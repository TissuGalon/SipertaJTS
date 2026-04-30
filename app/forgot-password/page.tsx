"use client"

import React, { useState } from "react"
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
  IconLoader2,
  IconArrowLeft,
  IconKey,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      })

      if (error) throw error

      setIsSent(true)
      toast.success("Email Terkirim", {
        description: "Silakan periksa kotak masuk email Anda untuk instruksi pemulihan password.",
      })
    } catch (error: any) {
      console.error("Reset request error:", error)
      toast.error("Gagal Mengirim Email", {
        description: error.message || "Terjadi kesalahan saat memproses permintaan Anda.",
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
      
      {/* Back to Login Button */}
      <Button 
        variant="ghost" 
        className="absolute left-4 top-4 z-10 sm:left-8 sm:top-8 text-slate-500 hover:bg-slate-200/50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-100" 
        asChild
      >
        <Link href="/login">
          <IconArrowLeft className="mr-2 h-4 w-4" />
          <span>Kembali ke Login</span>
        </Link>
      </Button>

      <Card className="relative z-10 w-full max-w-md overflow-hidden border border-white/60 bg-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl transition-all duration-500 dark:border-slate-800/60 dark:bg-slate-900/80 sm:rounded-2xl">
        <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        <CardHeader className="space-y-1 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg ring-4 ring-indigo-50 dark:ring-indigo-900/20">
              <IconKey size={28} />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Lupa Password?
          </CardTitle>
          <CardDescription>
            {isSent 
              ? "Instruksi telah dikirim ke email Anda." 
              : "Masukkan email Anda untuk menerima link pemulihan password."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isSent ? (
            <form onSubmit={handleResetRequest} className="space-y-4 text-left">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email Terdaftar</Label>
                <div className="relative">
                  <IconMail className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="name@email.com"
                    className="pl-10 h-11 bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    Mengirim...
                  </>
                ) : (
                  "Kirim Link Pemulihan"
                )}
              </Button>
            </form>
          ) : (
            <div className="py-6 text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Email pemulihan telah dikirim ke <strong>{email}</strong>. Silakan periksa kotak masuk atau folder spam Anda.
              </p>
              <Button 
                variant="outline" 
                className="mt-6 w-full"
                onClick={() => setIsSent(false)}
              >
                Ganti Email
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 border-t bg-slate-50/50 p-6 dark:bg-slate-900/50">
          <div className="text-center text-sm text-slate-500">
            Ingat password Anda?{" "}
            <Link href="/login" className="font-bold text-indigo-600 hover:underline">
              Kembali ke Login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
