"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  IconArrowLeft,
  IconCheck,
  IconX,
  IconFileText,
  IconUser,
  IconInfoCircle,
  IconExternalLink,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { LETTER_TYPE_LABELS, LetterType } from "@/types"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { motion, AnimatePresence } from "framer-motion"

export default function KoordinatorVerifierPage() {
  const { id } = useParams()
  const router = useRouter()
  const [request, setRequest] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notes, setNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const fetchRequest = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from("letter_requests")
          .select("*, users!user_id(name, nim)")
          .eq("id", id)
          .single()

        if (error) throw error;
        
        // Enhance files with public URLs
        const enhancedFiles = await Promise.all((data.files || []).map(async (file: any) => {
          if (file.path) {
            const { data: urlData } = await supabase.storage
              .from('letter_attachments')
              .getPublicUrl(file.path);
            return { ...file, url: urlData.publicUrl };
          }
          return file;
        }));

        setRequest({
          ...data,
          files: enhancedFiles,
          userName: data.users?.name || "Unknown",
          userNim: data.users?.nim || "-",
        })
        setNotes(data.admin_notes || "")
      } catch (error: any) {
        toast.error("Gagal mengambil data pengajuan: " + error.message)
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchRequest()
    }
  }, [id])

  if (isLoading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        <p className="text-sm font-medium text-slate-500 animate-pulse">Memuat berkas mahasiswa...</p>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Pengajuan Tidak Ditemukan</h2>
        <Button onClick={() => router.push("/koordinator/dashboard")} className="rounded-xl px-8 shadow-lg shadow-indigo-500/20">
          Kembali ke Dashboard
        </Button>
      </div>
    )
  }

  const handleApprove = async () => {
    setIsProcessing(true)
    const { error } = await supabase
      .from("letter_requests")
      .update({ 
        status: "disetujui_koordinator",
        admin_notes: notes ? `[Catatan Koordinator]: ${notes}${request.admin_notes ? `\n\n${request.admin_notes}` : ''}` : request.admin_notes,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)

    if (error) {
      toast.error("Gagal menyetujui pengajuan")
    } else {
      toast.success("Pengajuan disetujui")
      router.push("/koordinator/dashboard")
    }
    setIsProcessing(false)
  }

  const handleReject = async () => {
    if (!notes) {
      toast.error("Mohon berikan alasan penolakan di kolom catatan.");
      return;
    }
    setIsProcessing(true)
    const { error } = await supabase
      .from("letter_requests")
      .update({ 
        status: "ditolak_koordinator",
        admin_notes: notes ? `[Catatan Koordinator]: ${notes}${request.admin_notes ? `\n\n${request.admin_notes}` : ''}` : request.admin_notes,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)

    if (error) {
      toast.error("Gagal menolak pengajuan")
    } else {
      toast.error("Pengajuan ditolak")
      router.push("/koordinator/dashboard")
    }
    setIsProcessing(false)
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-20">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
        <div className="flex items-center space-x-6">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="h-12 w-12 rounded-2xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-all">
            <IconArrowLeft size={20} />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Verifikasi Pengajuan</h1>
              <StatusBadge status={request.status} />
            </div>
            <p className="text-slate-500 font-medium">#{request.id}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 px-4">
        {/* Left Column: Data Input Mahasiswa */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-8">
          <Card className="border-none shadow-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600">
                  <IconUser size={24} />
                </div>
                <CardTitle className="text-2xl font-black">Informasi Pengirim</CardTitle>
              </div>
              <CardDescription className="text-slate-500 text-base font-medium">
                Data diri dan jenis layanan yang diajukan oleh mahasiswa.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid gap-8 sm:grid-cols-2">
                <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100/50">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Nama Lengkap</Label>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{request.userName}</p>
                </div>
                <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100/50">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">NIM</Label>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{request.userNim}</p>
                </div>
                <div className="sm:col-span-2 p-6 rounded-3xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100/50">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2 block">Jenis Layanan Surat</Label>
                  <p className="text-xl font-black text-indigo-900 dark:text-indigo-200">
                    {LETTER_TYPE_LABELS[request.type as LetterType] || request.type}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                  <IconFileText size={24} />
                </div>
                <CardTitle className="text-2xl font-black">Rincian Data Surat</CardTitle>
              </div>
              <CardDescription className="text-slate-500 text-base font-medium">Input data yang dimasukkan oleh mahasiswa.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid gap-6 sm:grid-cols-2">
                {Object.entries(request.details).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {key.replace(/([A-Z])|(_)/g, " $1").replace(/_/g, "").trim()}
                    </Label>
                    <p className="text-base font-bold text-slate-700 dark:text-slate-300 break-words">{String(value)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Files & Actions */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-8">
          <Card className="border-none shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-[2.5rem] overflow-hidden sticky top-8">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-black">Berkas Pendukung</CardTitle>
              <CardDescription className="font-medium text-slate-500">Lampiran wajib yang diunggah.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-4">
              {Array.isArray(request.files) && request.files.length > 0 ? (
                <div className="space-y-3">
                  {request.files.map((file: any, index: number) => (
                    <div
                      key={index}
                      className="group flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all hover:shadow-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                          <IconFileText size={28} />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-sm font-black text-slate-900 dark:text-white truncate max-w-[150px]">{file.name}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">{file.type?.split('/')[1] || 'DOC'} • {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" className="rounded-xl h-10 w-10 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-900" asChild>
                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                          <IconExternalLink size={20} />
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                  <p className="text-slate-400 font-medium italic">Tidak ada berkas yang diunggah.</p>
                </div>
              )}

              {/* Action Form */}
              <div className="pt-8 space-y-6 border-t border-slate-100 dark:border-slate-800 mt-8">
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-xs font-black uppercase tracking-widest text-slate-500">Catatan Koordinator</Label>
                  <Textarea
                    id="notes"
                    placeholder="Tambahkan catatan jika perlu..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[120px] rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4 focus:ring-indigo-500"
                  />
                  {request.admin_notes && (
                    <div className="mt-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 text-[11px] text-amber-700 dark:text-amber-400">
                      <strong>Catatan Sebelumnya:</strong> {request.admin_notes}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={handleReject}
                    disabled={isProcessing || request.status !== 'pending'}
                    className="h-14 rounded-2xl border-red-200 text-red-600 font-black hover:bg-red-50 hover:text-red-700 transition-all"
                  >
                    <IconX className="mr-2 h-5 w-5" />
                    Tolak
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={isProcessing || request.status !== 'pending'}
                    className="h-14 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all"
                  >
                    {isProcessing ? 'Memproses...' : (
                      <>
                        <IconCheck className="mr-2 h-5 w-5" />
                        Setujui
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
