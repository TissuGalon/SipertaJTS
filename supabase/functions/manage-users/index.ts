import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
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

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // Verify admin role in public.users
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users').select('role').eq('id', requester.id).single()
    if (profileError || !profile || profile.role !== 'admin') {
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
    // ============================================================
    if (mode === 'create') {
      const { name, identifier, email, role } = userData

      if (!name || !identifier || !role) {
        return new Response(JSON.stringify({ error: 'Data tidak lengkap: nama, ID, dan role wajib diisi.', code: 'INVALID_PAYLOAD' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
        })
      }

      // 1. Determine the email to use for Auth
      const identifierTrimmed = identifier.trim()
      // Sanitasi identifier untuk email (hapus spasi, lowercase)
      const emailSafeId = identifierTrimmed.replace(/\s+/g, '').toLowerCase()
      const targetEmail = (email && email.includes('@')) ? email.trim() : `${emailSafeId}@admin.local`
      
      console.log(`[${requestId}] Processing ${role}:`, { name, identifierTrimmed, targetEmail })

      // 1. Password/ID Length Validation
      if (identifierTrimmed.length < 6) {
        return new Response(JSON.stringify({ 
          error: "ID Admin harus minimal 6 karakter (digunakan sebagai password default).", 
          code: 'PASSWORD_TOO_SHORT' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
        })
      }

      // 2. Comprehensive Conflict Check
      const { data: userConflict, error: conflictErr } = await supabaseAdmin
        .from('users')
        .select('role, nim, nip, email')
        .or(`nim.eq.${identifierTrimmed},nip.eq.${identifierTrimmed},email.eq.${targetEmail}`)
        .maybeSingle()

      if (conflictErr) console.error(`[${requestId}] Conflict check error:`, conflictErr)

      if (userConflict) {
        let msg = "Identitas (ID atau Email) sudah terdaftar."
        if (userConflict.email === targetEmail) msg = `Email "${targetEmail}" sudah terdaftar.`
        else if (userConflict.nim === identifierTrimmed) msg = `ID "${identifierTrimmed}" sudah terdaftar sebagai NIM Mahasiswa.`
        else if (userConflict.nip === identifierTrimmed) msg = `ID "${identifierTrimmed}" sudah terdaftar sebagai NIP Dosen.`
        
        return new Response(JSON.stringify({ error: msg, code: 'CONFLICT' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
        })
      }

      // 3. Extra check for Admin role against master tables
      if (role === 'admin') {
        const [{ data: mData }, { data: dData }] = await Promise.all([
          supabaseAdmin.from('mahasiswa').select('nim').eq('nim', identifierTrimmed).maybeSingle(),
          supabaseAdmin.from('dosen').select('nip').eq('nip', identifierTrimmed).maybeSingle()
        ])
        
        if (mData || dData) {
          const type = mData ? "Mahasiswa" : "Dosen"
          return new Response(JSON.stringify({ 
            error: `ID "${identifierTrimmed}" tidak bisa digunakan karena sudah terdaftar sebagai data ${type}.`, 
            code: 'CONFLICT_MASTER' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
          })
        }
      }

      // 4. Create Auth Account
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: targetEmail,
        password: identifierTrimmed,
        email_confirm: true,
        user_metadata: { name, role }
      })

      if (authError) {
        console.error(`[${requestId}] createUser error:`, authError.message)
        // Return a cleaner description for certain errors
        let errorMsg = authError.message
        if (errorMsg.includes("Password")) errorMsg = "Password (ID) tidak memenuhi kriteria keamanan Supabase."
        
        return new Response(JSON.stringify({ error: `Gagal membuat akun: ${errorMsg}`, code: 'AUTH_CREATE_FAIL' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
        })
      }

      const newUserId = authData.user.id
      console.log(`[${requestId}] Auth user created: ${newUserId}`)

      // C. Role-specific profile update
      try {
        if (role === 'mahasiswa') {
          const { error: mError } = await supabaseAdmin.from('mahasiswa').update({ user_id: newUserId }).eq('nim', identifierTrimmed)
          if (mError) throw mError
          
          const { error: uError } = await supabaseAdmin.from('users').insert({ 
            id: newUserId, name, email: targetEmail, role: 'mahasiswa', nim: identifierTrimmed 
          })
          if (uError) throw uError
        } 
        else if (role === 'dosen') {
          const { error: dError } = await supabaseAdmin.from('dosen').update({ user_id: newUserId }).eq('nip', identifierTrimmed)
          if (dError) throw dError
          
          const { error: uError } = await supabaseAdmin.from('users').insert({ 
            id: newUserId, name, email: targetEmail, role: 'dosen', nip: identifierTrimmed 
          })
          if (uError) throw uError
        } 
        else if (role === 'admin') {
          const { error: uError } = await supabaseAdmin.from('users').insert({ 
            id: newUserId, name, email: targetEmail, role: 'admin', nim: identifierTrimmed 
          })
          if (uError) throw uError
        }

        console.log(`[${requestId}] Success: ${role} [${identifier}] created`)
        return new Response(JSON.stringify({ success: true, userId: newUserId, requestId }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
        })

      } catch (dbError: any) {
        console.error(`[${requestId}] Cleanup after DB error:`, dbError.message)
        await supabaseAdmin.auth.admin.deleteUser(newUserId)
        return new Response(JSON.stringify({ error: dbError.message, code: 'DB_FINALIZE_FAIL' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400
        })
      }
    }

    // MODE: delete
    if (mode === 'delete') {
      const { id } = userData
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(id)
      if (deleteError) {
        return new Response(JSON.stringify({ error: deleteError.message, code: 'DELETE_FAIL' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400
        })
      }
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
