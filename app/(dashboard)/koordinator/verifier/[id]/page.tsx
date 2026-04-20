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
      const { data, error } = await supabase
        .from("letter_requests")
        .select("*, users!user_id(name, nim)")
        .eq("id", id)
        .single()

      if (error) {
        toast.error("Gagal mengambil data pengajuan")
      } else {
        setRequest({
          ...data,
          userName: data.users?.name || "Unknown",
          userNim: data.users?.nim || "-",
        })
        setNotes(data.admin_notes || "")
      }
      setIsLoading(false)
    }

    if (id) {
      fetchRequest()
    }
  }, [id])

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <h2 className="text-xl font-semibold">Pengajuan Tidak Ditemukan</h2>
        <Button onClick={() => router.push("/koordinator/dashboard")}>
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
      toast.success("Pengajuan disetujui dan diteruskan ke admin")
      router.push("/koordinator/dashboard")
    }
    setIsProcessing(false)
  }

  const handleReject = async () => {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="rounded-full">
          <IconArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Verifikasi Pengajuan</h1>
          <p className="text-muted-foreground">
            Tinjau dan verifikasi permintaan surat mahasiswa
          </p>
        </div>
      </div>

      {/* Request Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <IconUser className="h-5 w-5 text-indigo-600" />
              <span>Informasi Mahasiswa</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs font-bold uppercase text-slate-400">Nama</Label>
              <p className="text-sm text-muted-foreground">
                {request.userName}
              </p>
            </div>
            <div>
              <Label className="text-xs font-bold uppercase text-slate-400">NIM</Label>
              <p className="text-sm text-muted-foreground">{request.userNim}</p>
            </div>
            <div>
              <Label className="text-xs font-bold uppercase text-slate-400">Jenis Pengajuan</Label>
              <p className="text-sm text-muted-foreground">
                {LETTER_TYPE_LABELS[request.type as LetterType]}
              </p>
            </div>
            <div>
              <Label className="text-xs font-bold uppercase text-slate-400">Status</Label>
              <div className="mt-1">
                <StatusBadge status={request.status} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <IconInfoCircle className="h-5 w-5 text-amber-600" />
              <span>Detail Pengajuan</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs font-bold uppercase text-slate-400">Dibuat Pada</Label>
              <p className="text-sm text-muted-foreground">
                {new Date(request.created_at).toLocaleDateString("id-ID", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div>
              <Label className="text-xs font-bold uppercase text-slate-400">Terakhir Diperbarui</Label>
              <p className="text-sm text-muted-foreground">
                {new Date(request.updated_at).toLocaleDateString("id-ID", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            {request.letter_number && (
              <div>
                <Label className="text-xs font-bold uppercase text-slate-400">Nomor Surat</Label>
                <p className="text-sm text-muted-foreground">
                  {request.letter_number}
                </p>
              </div>
            )}
            {request.academic_year && (
              <div>
                <Label className="text-xs font-bold uppercase text-slate-400">Tahun Akademik</Label>
                <p className="text-sm text-muted-foreground">
                  {request.academic_year}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Letter Details */}
      <Card className="border-none shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <IconFileText className="h-5 w-5 text-blue-600" />
            <span>Rincian Surat</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(request.details).map(([key, value]) => (
              <div key={key}>
                <Label className="text-xs font-bold uppercase text-slate-400">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </Label>
                <p className="text-sm text-muted-foreground">{String(value)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Attached Files */}
      {Array.isArray(request.files) && request.files.length > 0 && (
        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle>Berkas Terlampir</CardTitle>
            <CardDescription>
              Dokumen yang diunggah bersama pengajuan ini
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {request.files.map((file: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center space-x-3">
                    <IconFileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{file.name}</span>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <IconExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Notes */}
      {request.admin_notes && (
        <Card className="border-none shadow-md bg-slate-50">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Catatan Sebelumnya</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {request.admin_notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Verification Actions */}
      <Card className="border-none shadow-xl ring-1 ring-emerald-500/10">
        <CardHeader>
          <CardTitle>Verifikasi Koordinator</CardTitle>
          <CardDescription>
            Berikan catatan dan tentukan tindakan untuk pengajuan ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Catatan Verifikasi</Label>
              <Textarea
                id="notes"
                placeholder="Tambahkan catatan verifikasi di sini..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-3 bg-slate-50/50 p-6 border-t">
          <Button
            variant="outline"
            onClick={handleReject}
            disabled={isProcessing}
            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <IconX className="mr-2 h-4 w-4" />
            Tolak
          </Button>
          <Button
            onClick={handleApprove}
            disabled={isProcessing}
            className="flex-[2] bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
          >
            <IconCheck className="mr-2 h-4 w-4" />
            Setujui & Teruskan
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
