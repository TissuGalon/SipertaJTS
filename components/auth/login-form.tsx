"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IconMail, IconLock, IconLoader2 } from "@tabler/icons-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

interface LoginFormProps {
  onSuccess?: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const router = useRouter()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      let emailToUse = identifier

      // If it doesn't look like an email, try to find the email in our tables
      if (!identifier.includes("@")) {
        // Search in mahasiswa first
        const { data: studentData } = await supabase
          .from("mahasiswa")
          .select("email")
          .eq("nim", identifier)
          .single()

        if (studentData?.email) {
          emailToUse = studentData.email
        } else {
          // Search in dosen
          const { data: lecturerData } = await supabase
            .from("dosen")
            .select("email")
            .eq("nip", identifier)
            .single()

          if (lecturerData?.email) {
            emailToUse = lecturerData.email
          } else {
            // Fallback to legacy virtual email
            emailToUse = `${identifier}@siperta.local`
          }
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: password,
      })

      if (error) throw error

      toast.success("Login Berhasil", {
        description: "Selamat datang kembali di Sistem Surat.",
      })

      if (onSuccess) {
        onSuccess()
      } else {
        // Default redirect logic
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", data.user.id)
          .single()

        if (profile?.role === "admin") {
          window.location.href = "/admin/dashboard"
        } else if (profile?.role === "dosen") {
          window.location.href = "/dosen/dashboard"
        } else {
          window.location.href = "/mahasiswa/dashboard"
        }
      }
    } catch (error: any) {
      console.error("Login error:", error)
      toast.error("Login Gagal", {
        description:
          error.message === "Invalid login credentials"
            ? "Akun tidak ditemukan atau kata sandi salah. Gunakan NIM/NIP atau Email yang terdaftar."
            : error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4 text-left">
      <div className="space-y-2">
        <Label htmlFor="login-identifier">Email atau NIM/NIP</Label>
        <div className="relative">
          <IconMail className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
          <Input
            id="login-identifier"
            type="text"
            placeholder="Email, NIM, atau NIP"
            className="pl-10 h-11 h-11 bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-password">Password</Label>
        <div className="relative">
          <IconLock className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
          <Input
            id="login-password"
            type="password"
            placeholder="••••••••"
            className="pl-10 h-11 bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
      </div>
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
          "Masuk Sekarang"
        )}
      </Button>
    </form>
  )
}
