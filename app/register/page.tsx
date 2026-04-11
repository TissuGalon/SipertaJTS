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

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    nim: "",
    email: "",
    password: "",
    role: "mahasiswa" as "mahasiswa" | "dosen" | "admin"
  })

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Check if NIM/NIP exists in our tables
      if (formData.role === 'mahasiswa') {
        const { data } = await supabase.from('mahasiswa').select('name').eq('nim', formData.nim).single();
        if (!data) {
          throw new Error("NIM tidak ditemukan. Pastikan Anda sudah terdaftar di sistem oleh admin.");
        }
      } else if (formData.role === 'dosen') {
        const { data } = await supabase.from('dosen').select('name').eq('nip', formData.nim).single();
        if (!data) {
          throw new Error("NIP tidak ditemukan. Pastikan Anda sudah terdaftar di sistem oleh admin.");
        }
      }

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            nim: formData.nim,
            role: formData.role
          }
        }
      })

      if (error) throw error

      toast.success("Registrasi Berhasil", {
        description: "Akun Anda telah dibuat. Silakan login."
      })
      
      window.location.href = "/login"

    } catch (error: any) {
      console.error("Registration error:", error)
      toast.error("Registrasi Gagal", {
        description: error.message || "Terjadi kesalahan saat pendaftaran."
      })
    } finally {
      setIsLoading(false)
    }
  }

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
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <div className="relative">
                  <IconUser className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="name"
                    placeholder="John Doe"
                    className="pl-10"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nim">NIM / NIP</Label>
                <div className="relative">
                  <IconId className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="nim"
                    placeholder="2022573..."
                    className="pl-10"
                    value={formData.nim}
                    onChange={(e) => setFormData({...formData, nim: e.target.value})}
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <IconMail className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@email.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
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
                  className="pl-10"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">Daftar sebagai</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(v: any) => setFormData({...formData, role: v})}
                >
                  <SelectTrigger className="w-full">
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
                {formData.role !== "mahasiswa" && (
                  <p className="text-[10px] text-amber-600 font-medium">
                    * Peran Dosen memerlukan verifikasi administrator setelah pendaftaran.
                  </p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="mt-4 w-full h-11 bg-indigo-600 hover:bg-indigo-700 font-semibold shadow-lg shadow-indigo-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mendaftar...
                </>
              ) : "Buat Akun"}
            </Button>
          </form>
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
