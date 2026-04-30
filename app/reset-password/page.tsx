"use client"

import React, { useState, useEffect } from "react"
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
  IconLock,
  IconLoader2,
  IconShieldCheck,
  IconArrowLeft,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [isValidSession, setIsValidSession] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setIsValidSession(true)
      } else {
        toast.error("Sesi Tidak Valid", {
          description: "Tautan pemulihan mungkin sudah kedaluwarsa atau tidak valid.",
        })
        // router.push("/login") // Don't redirect immediately to let user see the error
      }
      setIsVerifying(false)
    }

    checkSession()
  }, [router])

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error("Password Tidak Cocok", {
        description: "Konfirmasi password harus sama dengan password baru.",
      })
      return
    }

    if (password.length < 6) {
      toast.error("Password Terlalu Pendek", {
        description: "Password harus minimal 6 karakter.",
      })
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      toast.success("Password Berhasil Diperbarui", {
        description: "Silakan login menggunakan password baru Anda.",
      })

      // Wait a bit before redirecting
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (error: any) {
      console.error("Password update error:", error)
      toast.error("Gagal Memperbarui Password", {
        description: error.message || "Terjadi kesalahan saat memperbarui password Anda.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isVerifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <IconLoader2 className="h-10 w-10 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">Memverifikasi sesi...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 p-4 dark:bg-slate-950">
      {/* Decorative Background Elements */}
      <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-400/20 blur-[100px] dark:bg-blue-600/20" />
      <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-400/20 blur-[100px] dark:bg-indigo-600/20" />
      
      <Card className="relative z-10 w-full max-w-md overflow-hidden border border-white/60 bg-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl transition-all duration-500 dark:border-slate-800/60 dark:bg-slate-900/80 sm:rounded-2xl">
        <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        <CardHeader className="space-y-1 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-600 text-white shadow-lg ring-4 ring-green-50 dark:ring-green-900/20">
              <IconShieldCheck size={28} />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Atur Password Baru
          </CardTitle>
          <CardDescription>
            {isValidSession 
              ? "Masukkan kata sandi baru yang aman untuk akun Anda." 
              : "Sesi tidak ditemukan atau kedaluwarsa."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isValidSession ? (
            <form onSubmit={handlePasswordUpdate} className="space-y-4 text-left">
              <div className="space-y-2">
                <Label htmlFor="new-password">Password Baru</Label>
                <div className="relative">
                  <IconLock className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 h-11 bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Konfirmasi Password</Label>
                <div className="relative">
                  <IconLock className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 h-11 bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                  "Perbarui Password"
                )}
              </Button>
            </form>
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                Silakan coba minta tautan pemulihan baru dari halaman Lupa Password.
              </p>
              <Button asChild className="w-full">
                <Link href="/forgot-password">
                  Kembali ke Lupa Password
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 border-t bg-slate-50/50 p-6 dark:bg-slate-900/50">
          <div className="text-center text-sm text-slate-500">
            <Link href="/login" className="flex items-center justify-center hover:text-indigo-600">
              <IconArrowLeft className="mr-1 h-3 w-3" />
              Kembali ke Login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
