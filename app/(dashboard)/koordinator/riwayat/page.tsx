"use client"

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  IconSearch,
  IconEye,
  IconHistory,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from "next/link"
import { LETTER_TYPE_LABELS, PRODI_LABELS, ProdiType, RequestStatus } from "@/types"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

export default function KoordinatorRiwayatPage() {
  const [filterStatus, setFilterStatus] = useState<RequestStatus | "all">("all")
  const [filterProdi, setFilterProdi] = useState<ProdiType | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [requests, setRequests] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [settings, setSettings] = useState<any>(null)
  const [isSettingsLoading, setIsSettingsLoading] = useState(true)

  const fetchSettings = async () => {
    setIsSettingsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("dosen_dashboard_settings")
        .select("*")
        .eq("dosen_user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      setSettings(data || { is_enabled: true, prodi: 'all', visible_letter_types: null });
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setIsSettingsLoading(false);
    }
  }

  const fetchRequests = async () => {
    if (settings && !settings.is_enabled) {
      setRequests([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true)
    
    let query = supabase
      .from("letter_requests")
      .select("*, users!user_id(name, nim, prodi)")
      .in("status", ["disetujui_koordinator", "ditolak_koordinator"]) // Only history
      .order("updated_at", { ascending: false })

    // Apply settings filters
    if (settings) {
      if (settings.prodi && settings.prodi !== 'all') {
        query = query.eq('prodi', settings.prodi);
      }
      if (settings.visible_letter_types && settings.visible_letter_types.length > 0) {
        query = query.in('type', settings.visible_letter_types);
      } else {
        query = query.in('type', ['surat_sidang', 'surat_undangan_seminar', 'surat_undangan_sidang', 'surat_magang', 'surat_permohonan_magang', 'surat_tugas_magang']);
      }
    } else {
      query = query.in('type', ['surat_sidang', 'surat_undangan_seminar', 'surat_undangan_sidang', 'surat_magang', 'surat_permohonan_magang', 'surat_tugas_magang']);
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Gagal mengambil riwayat pengajuan")
    } else {
      const mappedData = (data || []).map((req: any) => ({
        ...req,
        userName: req.users?.name || "Unknown",
        userNim: req.users?.nim || "-",
      }))
      setRequests(mappedData)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  useEffect(() => {
    if (!isSettingsLoading) {
      fetchRequests()
    }
  }, [isSettingsLoading, settings])

  const filteredRequests = requests.filter((req) => {
    const matchesStatus = filterStatus === "all" || req.status === filterStatus
    const matchesProdi = filterProdi === "all" || req.prodi === filterProdi || (req.users?.prodi === filterProdi)
    const matchesSearch =
      req.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.userNim.includes(searchQuery) ||
      req.id.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesProdi && matchesSearch
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <IconHistory className="h-6 w-6 text-indigo-600" />
            <span>Riwayat Verifikasi Koordinator</span>
          </CardTitle>
          <CardDescription>
            Riwayat semua permintaan surat yang telah disetujui atau ditolak koordinator.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[300px]">
              <IconSearch className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nama, NIM, atau ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select
              value={filterProdi}
              onValueChange={(value) =>
                setFilterProdi(value as ProdiType | "all")
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Semua Prodi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Program Studi</SelectItem>
                {Object.entries(PRODI_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filterStatus}
              onValueChange={(value) =>
                setFilterStatus(value as RequestStatus | "all")
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="disetujui_koordinator">Disetujui</SelectItem>
                <SelectItem value="ditolak_koordinator">Ditolak</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      ID Request
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Mahasiswa
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Jenis
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Tgl Diproses
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground" style={{ width: '100px' }}>
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="h-24 text-center align-middle text-muted-foreground">
                        Belum ada riwayat verifikasi.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((request) => (
                      <tr key={request.id} className="border-b hover:bg-slate-50/50">
                        <td className="p-4 align-middle font-medium truncate max-w-[100px]">
                          {request.id}
                        </td>
                        <td className="p-4 align-middle">
                          <div>
                            <div className="font-medium">{request.userName}</div>
                            <div className="text-sm text-muted-foreground">
                               {request.userNim}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          {LETTER_TYPE_LABELS[request.type as keyof typeof LETTER_TYPE_LABELS] || request.type}
                        </td>
                        <td className="p-4 align-middle">
                          <StatusBadge status={request.status} />
                        </td>
                        <td className="p-4 align-middle">
                          {new Date(request.updated_at).toLocaleDateString("id-ID", {
                            year: "numeric", month: "short", day: "numeric"
                          })}
                        </td>
                        <td className="p-4 align-middle">
                          <Button variant="ghost" size="sm" asChild title="Lihat Detail">
                            <Link href={`/koordinator/verifier/${request.id}`}>
                              <IconEye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
