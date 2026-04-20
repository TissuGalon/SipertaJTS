import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const requestId = Math.random().toString(36).substring(7)
  console.log(`[${requestId}] ${req.method} ${req.url}`)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return new Response(JSON.stringify({ error: 'Server config error: missing env vars', code: 'ENV_MISSING' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500
      })
    }

    // --- Auth: verify caller is admin ---
    const authHeader = req.headers.get('Authorization') ?? ''
    if (!authHeader.startsWith('Bearer ') || authHeader.includes('undefined') || authHeader.includes('null')) {
      console.error(`[${requestId}] Bad auth header`)
      return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header. Re-login.', code: 'AUTH_MISSING' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401
      })
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: { user: requester }, error: requesterError } = await userClient.auth.getUser()
    if (requesterError || !requester) {
      console.error(`[${requestId}] getUser failed:`, requesterError?.message)
      return new Response(JSON.stringify({ error: `Unauthorized: ${requesterError?.message || 'Invalid session'}`, code: 'AUTH_FAIL' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401
      })
    }
    console.log(`[${requestId}] Caller: ${requester.email} [${requester.id}]`)

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // Verify admin role in public.users
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users').select('role').eq('id', requester.id).single()
    if (profileError || !profile || profile.role !== 'admin') {
      console.error(`[${requestId}] Role check: ${profile?.role}, err: ${profileError?.message}`)
      return new Response(JSON.stringify({ error: 'Forbidden: Admin role required', code: 'ROLE_DENIED' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403
      })
    }

    // --- Parse payload ---
    const body = await req.json()
    const { mode, userData } = body
    console.log(`[${requestId}] Mode: ${mode}, userData:`, JSON.stringify(userData))

    // ============================================================
    // MODE: create
    // Creates auth.users account + updates profile tables
    // ============================================================
    if (mode === 'create') {
      const { name, identifier, email, role } = userData

      if (!name || !identifier || !role) {
        return new Response(JSON.stringify({ error: 'Missing required fields: name, identifier, role', code: 'INVALID_PAYLOAD' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400
        })
      }

      const virtualEmail = `${identifier}@siperta.local`
      console.log(`[${requestId}] Creating ${role} user: ${virtualEmail}`)

      // A. Create auth.users account
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: virtualEmail,
        password: identifier,
        email_confirm: true,
        user_metadata: { name, role }
      })

      if (authError) {
        console.error(`[${requestId}] createUser error:`, authError.message)
        return new Response(JSON.stringify({ error: authError.message, code: 'AUTH_CREATE_FAIL' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400
        })
      }

      const newUserId = authData.user.id
      console.log(`[${requestId}] Auth user created: ${newUserId}`)

      // B. Role-specific profile update
      if (role === 'mahasiswa') {
        // Update mahasiswa table: set user_id where nim matches
        const { error: mahasiswaError } = await supabaseAdmin
          .from('mahasiswa')
          .update({ user_id: newUserId })
          .eq('nim', identifier)

        if (mahasiswaError) {
          console.error(`[${requestId}] mahasiswa update error:`, mahasiswaError.message)
          await supabaseAdmin.auth.admin.deleteUser(newUserId)
          return new Response(JSON.stringify({ error: `Gagal update tabel mahasiswa: ${mahasiswaError.message}`, code: 'MAHASISWA_UPDATE_FAIL' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400
          })
        }

        // Also insert into public.users for role-based auth
        const { error: usersInsertError } = await supabaseAdmin
          .from('users')
          .insert({ id: newUserId, name, email: email || virtualEmail, role: 'mahasiswa', nim: identifier })

        if (usersInsertError) {
          // If duplicate, try upsert
          console.warn(`[${requestId}] users insert failed (may be duplicate): ${usersInsertError.message}`)
          await supabaseAdmin.from('users').upsert({ id: newUserId, name, email: email || virtualEmail, role: 'mahasiswa', nim: identifier })
        }

        console.log(`[${requestId}] Mahasiswa activated: ${identifier}`)
        return new Response(JSON.stringify({ success: true, userId: newUserId, requestId }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
        })
      }

      if (role === 'dosen') {
        // Update dosen table: set user_id where nip matches
        const { error: dosenError } = await supabaseAdmin
          .from('dosen')
          .update({ user_id: newUserId })
          .eq('nip', identifier)

        if (dosenError) {
          console.error(`[${requestId}] dosen update error:`, dosenError.message)
          await supabaseAdmin.auth.admin.deleteUser(newUserId)
          return new Response(JSON.stringify({ error: `Gagal update tabel dosen: ${dosenError.message}`, code: 'DOSEN_UPDATE_FAIL' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400
          })
        }

        // Also insert into public.users
        const { error: usersInsertError } = await supabaseAdmin
          .from('users')
          .insert({ id: newUserId, name, email: email || virtualEmail, role: 'dosen', nip: identifier })

        if (usersInsertError) {
          console.warn(`[${requestId}] users insert failed (may be duplicate): ${usersInsertError.message}`)
          await supabaseAdmin.from('users').upsert({ id: newUserId, name, email: email || virtualEmail, role: 'dosen', nip: identifier })
        }

        console.log(`[${requestId}] Dosen activated: ${identifier}`)
        return new Response(JSON.stringify({ success: true, userId: newUserId, requestId }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
        })
      }

      if (role === 'admin') {
        // Admin: insert directly to public.users (no mahasiswa/dosen profile)
        const adminEmail = email && email.includes('@') ? email : virtualEmail
        const { error: insertError } = await supabaseAdmin
          .from('users')
          .insert({ id: newUserId, name, email: adminEmail, role: 'admin' })

        if (insertError) {
          console.error(`[${requestId}] admin users insert error:`, insertError.message)
          await supabaseAdmin.auth.admin.deleteUser(newUserId)
          return new Response(JSON.stringify({ error: `Gagal buat profil admin: ${insertError.message}`, code: 'ADMIN_INSERT_FAIL' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400
          })
        }

        console.log(`[${requestId}] Admin created: ${identifier}`)
        return new Response(JSON.stringify({ success: true, userId: newUserId, requestId }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
        })
      }

      return new Response(JSON.stringify({ error: `Unsupported role: ${role}`, code: 'UNSUPPORTED_ROLE' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400
      })
    }

    // ============================================================
    // MODE: delete
    // Deletes auth.users account (cascades to public.users via FK)
    // ============================================================
    if (mode === 'delete') {
      const { id } = userData
      if (!id) {
        return new Response(JSON.stringify({ error: 'Missing required field: userData.id', code: 'INVALID_PAYLOAD' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400
        })
      }

      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(id)
      if (deleteError) {
        console.error(`[${requestId}] deleteUser error:`, deleteError.message)
        return new Response(JSON.stringify({ error: deleteError.message, code: 'DELETE_FAIL' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400
        })
      }

      console.log(`[${requestId}] User deleted: ${id}`)
      return new Response(JSON.stringify({ success: true, requestId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
      })
    }

    return new Response(JSON.stringify({ error: `Unsupported mode: ${mode}`, code: 'UNSUPPORTED_MODE' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400
    })

  } catch (error: any) {
    console.error(`[${requestId}] Uncaught:`, error.message)
    return new Response(JSON.stringify({ error: error.message || 'Internal server error', code: 'UNCAUGHT_ERROR' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500
    })
  }
})
