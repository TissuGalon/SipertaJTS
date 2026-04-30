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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  IconMail,
  IconLock,
  IconSchool,
  IconShieldLock,
  IconFileDownload,
  IconArrowRight,
  IconCheck,
  IconClock,
  IconFileText,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"

import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login")

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md dark:bg-slate-950/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-500/20">
              <IconSchool size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Si Perta
            </span>
          </div>
          <div className="hidden space-x-8 md:flex">
            <a href="#alur" className="text-sm font-medium hover:text-blue-600 transition-colors">Alur Pengajuan</a>
            <a href="#sop" className="text-sm font-medium hover:text-blue-600 transition-colors">Unduh SOP</a>
          </div>
          <Button variant="outline" size="sm" className="hidden md:flex">
            Bantuan
          </Button>
        </div>
      </nav>

      {/* Hero & Auth Section */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden pt-20">
        {/* Background Gradients */}
        <div className="absolute top-0 -left-1/4 h-[600px] w-[600px] rounded-full bg-blue-400/20 mix-blend-multiply blur-[100px] dark:bg-blue-600/10" />
        <div className="absolute bottom-0 -right-1/4 h-[600px] w-[600px] rounded-full bg-indigo-400/20 mix-blend-multiply blur-[100px] dark:bg-indigo-600/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] rounded-full bg-purple-400/10 mix-blend-multiply blur-[120px] dark:bg-purple-600/5" />

        <div className="mx-auto grid max-w-7xl px-4 py-8 lg:grid-cols-2 lg:gap-12 lg:py-16">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-center space-y-8"
          >
            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                Sistem Informasi <br />
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Persuratan Terintegrasi
                </span>
              </h1>
              <p className="max-w-xl text-lg text-slate-600 dark:text-slate-400">
                Layanan persuratan online untuk Mahasiswa, Admin, dan Dosen Jurusan Teknik Sipil Politeknik Negeri Lhokseumawe. Lebih cepat, transparan, dan terintegrasi.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                <IconCheck size={16} />
                <span>Auto-generate Surat</span>
              </div>
              <div className="flex items-center space-x-2 rounded-full bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                <IconCheck size={16} />
                <span>Tracking Real-time</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-12 lg:mt-0"
          >
            <Card className="mx-auto w-full max-w-md overflow-hidden border border-slate-200/50 bg-white/70 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/70">
              <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-none bg-slate-50/50 p-0 dark:bg-slate-900/50">
                  <TabsTrigger 
                    value="login" 
                    className="rounded-none border-b-2 border-transparent py-4 data-[state=active]:border-indigo-600 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 font-bold"
                  >
                    Masuk
                  </TabsTrigger>
                  <TabsTrigger 
                    value="signup" 
                    className="rounded-none border-b-2 border-transparent py-4 data-[state=active]:border-indigo-600 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 font-bold"
                  >
                    Daftar
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="p-6">
                  <LoginForm />
                </TabsContent>

                <TabsContent value="signup" className="p-6">
                  <RegisterForm onSuccess={() => setActiveTab("login")} />
                </TabsContent>
              </Tabs>
          
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Guide Section */}
      <section id="alur" className="bg-slate-50 py-24 dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-slate-900 dark:text-white">Alur Pengajuan Surat</h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">Pahami langkah-langkah mudah untuk mendapatkan surat keperluan akademik Anda.</p>
          </div>

          <div className="grid gap-12 lg:grid-cols-2">
            <div className="space-y-4">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" className="border-none bg-white px-6 py-2 rounded-xl shadow-sm dark:bg-slate-950 mb-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center space-x-4 text-left">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                        <span className="font-bold">1</span>
                      </div>
                      <span className="font-semibold">Isi Formulir Online</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-14 text-slate-600 dark:text-slate-400">
                    Pilih jenis surat yang dibutuhkan, isi data yang diminta dengan benar, dan unggah dokumen persyaratan dalam format PDF atau Gambar.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border-none bg-white px-6 py-2 rounded-xl shadow-sm dark:bg-slate-950 mb-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center space-x-4 text-left">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30">
                        <span className="font-bold">2</span>
                      </div>
                      <span className="font-semibold">Verifikasi Admin</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-14 text-slate-600 dark:text-slate-400">
                    Staf administrasi akan memeriksa kelengkapan dokumen Anda. Jika sesuai, admin akan memberikan persetujuan dan nomor surat (khusus magang).
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border-none bg-white px-6 py-2 rounded-xl shadow-sm dark:bg-slate-950 mb-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center space-x-4 text-left">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
                        <span className="font-bold">3</span>
                      </div>
                      <span className="font-semibold">Selesai & Unduh</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-14 text-slate-600 dark:text-slate-400">
                    Setelah disetujui, surat akan otomatis ter-generate. Anda dapat mengunduh dan mencetak surat tersebut secara mandiri.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-800 p-8 text-white shadow-[0_32px_64px_-12px_rgba(37,99,235,0.4)]"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 translate-x-1/4 -translate-y-1/4">
                <IconFileText size={320} />
              </div>
              <h3 className="text-2xl font-bold mb-8 flex items-center gap-2">
                <IconFileText className="text-blue-300" />
                Jenis Surat Tersedia
              </h3>
              <div className="space-y-5">
                {[
                  "Surat Magang & Industri",
                  "Surat Izin Penelitian",
                  "Surat Aktif Kuliah",
                  "Surat Cuti Akademik",
                  "Surat Sidang & Seminar"
                ].map((item, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center space-x-3 group"
                  >
                    <div className="h-2 w-2 rounded-full bg-blue-400 group-hover:w-4 transition-all" />
                    <span className="group-hover:translate-x-1 transition-transform">{item}</span>
                  </motion.div>
                ))}
              </div>
           {/*    <div className="mt-12 flex items-center justify-between border-t border-white/20 pt-8">
                <div>
                  <p className="text-3xl font-bold">500+</p>
                  <p className="text-sm opacity-80">Surat Terbit/Bulan</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">&lt; 24 Jam</p>
                  <p className="text-sm opacity-80">Rata-rata Proses</p>
                </div>
              </div> */}
            </motion.div>
          </div>
        </div>
      </section>

      {/* SOP Section */}
      <section id="sop" className="py-24">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="mb-8 flex justify-center">
            <div className="rounded-full bg-blue-50 p-4 text-blue-600 dark:bg-blue-900/30">
              <IconFileDownload size={48} />
            </div>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Unduh SOP Persuratan</h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Pelajari Standar Operasional Prosedur (SOP) persuratan Jurusan Teknik Sipil untuk memastikan pengajuan Anda disetujui dengan cepat.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <Button size="lg" className="h-14 px-8 bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20">
              <IconFileDownload className="mr-2 h-5 w-5" />
              Unduh SOP (PDF)
            </Button>
            <Button variant="outline" size="lg" className="h-14 px-8">
              Lihat Alur Detail
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-12 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-2 opacity-50 mb-4">
            <IconSchool size={20} />
            <span className="text-sm font-bold tracking-tight">Si Perta</span>
          </div>
          <p className="text-sm text-slate-500">
            &copy; 2024 Jurusan Teknik Sipil • Politeknik Negeri Lhokseumawe.
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Built with Next.js & Shadcn UI. Modernized by Antigravity.
          </p>
        </div>
      </footer>
    </div>
  )
}
