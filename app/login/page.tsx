"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  IconMail,
  IconLock,
  IconSchool,
  IconLoader2,
  IconArrowLeft,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      let emailToUse = email;

      // If it doesn't look like an email, try to find the email in our tables
      if (!email.includes('@')) {
        // Search in mahasiswa first
        const { data: studentData } = await supabase
          .from('mahasiswa')
          .select('email')
          .eq('nim', email)
          .single();

        if (studentData?.email) {
          emailToUse = studentData.email;
        } else {
          // Search in dosen
          const { data: lecturerData } = await supabase
            .from('dosen')
            .select('email')
            .eq('nip', email)
            .single();
          
          if (lecturerData?.email) {
            emailToUse = lecturerData.email;
          } else {
            // Fallback to legacy virtual email if not found in profiles but might exist in auth
            emailToUse = `${email}@siperta.local`;
          }
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: password,
      })

      if (error) throw error

      toast.success("Login Berhasil", {
        description: "Selamat datang kembali di Sistem Surat."
      })

      // Fetch profile to redirect correctly
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profile?.role === "admin") {
        window.location.href = "/admin/dashboard"
      } else if (profile?.role === "dosen") {
        window.location.href = "/dosen/dashboard"
      } else {
        window.location.href = "/mahasiswa/dashboard"
      }
    } catch (error: any) {
      console.error("Login error:", error)
      toast.error("Login Gagal", {
        description: error.message === "Invalid login credentials"
          ? "Akun tidak ditemukan atau kata sandi salah. Gunakan NIM/NIP atau Email yang terdaftar."
          : error.message
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 p-4 dark:bg-slate-950">
      {/* Decorative Background Elements */}
      <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-400/20 blur-[100px] dark:bg-blue-600/20" />
      <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-400/20 blur-[100px] dark:bg-indigo-600/20" />
      
      {/* Back to Home Button */}
      <Button 
        variant="ghost" 
        className="absolute left-4 top-4 z-10 sm:left-8 sm:top-8 text-slate-500 hover:bg-slate-200/50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-100" 
        asChild
      >
        <Link href="/">
          <IconArrowLeft className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Kembali ke Beranda</span>
          <span className="sm:hidden">Beranda</span>
        </Link>
      </Button>

      <Card className="relative z-10 w-full max-w-md overflow-hidden border border-white/60 bg-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl transition-all duration-500 dark:border-slate-800/60 dark:bg-slate-900/80 sm:rounded-2xl">
        <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        <CardHeader className="space-y-1 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg ring-4 ring-blue-50 dark:ring-blue-900/20">
              <IconSchool size={28} />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Login Sistem Surat
          </CardTitle>
          <CardDescription>
            Masukkan NIM / NIP atau Email Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email atau NIM/NIP</Label>
              <div className="relative">
                <IconMail className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="text"
                  placeholder="Email, NIM, atau NIP"
                  className="pl-10 h-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <IconLock className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              className="mt-4 w-full h-11 bg-indigo-600 hover:bg-indigo-700 font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : "Sign In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 border-t bg-slate-50/50 p-6 dark:bg-slate-900/50">
          <div className="text-center text-sm text-slate-500">
            Belum punya akun?{" "}
            <Link href="/register" className="font-bold text-indigo-600 hover:underline">
              Daftar Sekarang
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
