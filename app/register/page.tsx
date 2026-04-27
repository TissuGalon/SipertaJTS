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
  IconShieldLock,
  IconArrowLeft,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

import { RegisterForm } from "@/components/auth/register-form"

export default function RegisterPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 p-4 dark:bg-slate-950 py-10">
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
          <CardTitle className="text-2xl font-bold tracking-tight">
            Daftar Akun Baru
          </CardTitle>
          <CardDescription>
            Lengkapi data di bawah untuk bergabung
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 border-t bg-slate-50/50 p-6 dark:bg-slate-900/50">
          <div className="text-center text-sm text-slate-500">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-bold text-indigo-600 hover:underline">
              Login di sini
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
