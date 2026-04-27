"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  IconMail,
  IconLock,
  IconUser,
  IconId,
  IconLoader2,
  IconSchool,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

interface RegisterFormProps {
  onSuccess?: () => void
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    nim: "",
    email: "",
    password: "",
    role: "mahasiswa" as "mahasiswa" | "dosen",
  })

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Step 1: Sign Up
      const { data: signUpResult, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            nim: formData.nim,
            role: formData.role,
          },
        },
      })

      if (signUpError) throw signUpError

      // Step 2: Create Profiles and Link Records
      if (signUpResult.user) {
        const userId = signUpResult.user.id

        // Update the identity table (mahasiswa/dosen) to link the user_id
        if (formData.role === "mahasiswa") {
          await supabase
            .from("mahasiswa")
            .update({
              user_id: userId,
              email: formData.email,
              name: formData.name,
            })
            .eq("nim", formData.nim)
        } else if (formData.role === "dosen") {
          await supabase
            .from("dosen")
            .update({
              user_id: userId,
              email: formData.email,
              name: formData.name,
            })
            .eq("nip", formData.nim)
        }

        // Ensure a record exists in the public.users table (unified profile)
        await supabase.from("users").upsert({
          id: userId,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          nim: formData.role === "mahasiswa" ? formData.nim : undefined,
          nip: formData.role === "dosen" ? formData.nim : undefined,
        })
      }

      toast.success("Registrasi Berhasil", {
        description: "Akun Anda telah dibuat. Melakukan login otomatis...",
      })

      // Step 2: Auto Login Logic
      // Check if session was already created by signUp (depends on Supabase config)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        if (formData.role === "dosen") {
          window.location.href = "/koordinator/dashboard"
        } else {
          window.location.href = "/mahasiswa/dashboard"
        }
      } else {
        // Fallback login if session not automatically created
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })
        
        if (loginError) {
          // If login fails for some reason, go to manual login
          window.location.href = "/login"
        } else {
          if (formData.role === "dosen") {
            window.location.href = "/koordinator/dashboard"
          } else {
            window.location.href = "/mahasiswa/dashboard"
          }
        }
      }

      if (onSuccess) onSuccess()

    } catch (error: any) {
      console.error("Registration error:", error)
      toast.error("Registrasi Gagal", {
        description: error.message || "Terjadi kesalahan saat pendaftaran.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleRegister} className="space-y-4 text-left">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="signup-name">Nama Lengkap</Label>
          <div className="relative">
            <IconUser className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
            <Input
              id="signup-name"
              placeholder="John Doe"
              className="pl-10 h-11 bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-nim">NIM / NIP</Label>
          <div className="relative">
            <IconId className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
            <Input
              id="signup-nim"
              placeholder="2022573..."
              className="pl-10 h-11 bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all"
              value={formData.nim}
              onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
              required
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="signup-role">Daftar sebagai</Label>
          <Select
            value={formData.role}
            onValueChange={(v: any) => setFormData({ ...formData, role: v })}
          >
            <SelectTrigger className="w-full h-11">
              <SelectValue placeholder="Pilih Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mahasiswa">
                <div className="flex items-center">
                  <IconSchool className="mr-2 h-4 w-4" />
                  Mahasiswa
                </div>
              </SelectItem>
              <SelectItem value="dosen">
                <div className="flex items-center">
                  <IconSchool className="mr-2 h-4 w-4" />
                  Dosen
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-email">Email</Label>
          <div className="relative">
            <IconMail className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
            <Input
              id="signup-email"
              type="email"
              placeholder="name@email.com"
              className="pl-10 h-11 bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <div className="relative">
          <IconLock className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
          <Input
            id="signup-password"
            type="password"
            placeholder="••••••••"
            className="pl-10 h-11 bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
        </div>
      </div>

      {formData.role !== "mahasiswa" && (
        <p className="text-[10px] text-amber-600 font-medium">
          * Peran Dosen memerlukan verifikasi administrator setelah pendaftaran.
        </p>
      )}

      <Button
        type="submit"
        className="mt-4 w-full h-11 bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-200 transition-all duration-300"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
            Memproses...
          </>
        ) : (
          "Daftar Akun Sekarang"
        )}
      </Button>
    </form>
  )
}
