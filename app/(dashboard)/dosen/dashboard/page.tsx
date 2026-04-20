"use client"

export const dynamic = 'force-dynamic';


import React, { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { mockRequests } from "@/lib/mock-data"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  IconClipboardList,
  IconHourglass,
  IconCircleCheck,
  IconSearch,
  IconFilter,
  IconEye,
  IconCheck,
  IconX,
  IconDotsVertical,
  IconLock,
  IconInbox
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
import { useEffect } from "react"

export default function TeacherDashboard() {
  const [filterStatus, setFilterStatus] = useState<RequestStatus | "all">(
    "verifying"
  )
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
      .order("created_at", { ascending: false })

    // Apply settings filters
    if (settings) {
      if (settings.prodi && settings.prodi !== 'all') {
        query = query.eq('prodi', settings.prodi);
      }
      if (settings.visible_letter_types && settings.visible_letter_types.length > 0) {
        query = query.in('type', settings.visible_letter_types);
      }
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Gagal mengambil data pengajuan")
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

  const stats = {
    total: requests.length,
    verifying: requests.filter((r: any) => r.status === "verifying").length,
    pending: requests.filter((r: any) => r.status === "pending").length,
    done: requests.filter((r: any) => r.status === "done").length,
  }

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from("letter_requests")
      .update({ 
        status: "processing",
        updated_at: new Date().toISOString()
      })
      .eq("id", id)

    if (error) {
      toast.error("Gagal menyetujui permintaan")
    } else {
      toast.success("Permintaan disetujui untuk diproses")
      fetchRequests()
    }
  }

  const handleReject = async (id: string) => {
    const { error } = await supabase
      .from("letter_requests")
      .update({ 
        status: "rejected",
        updated_at: new Date().toISOString()
      })
      .eq("id", id)

    if (error) {
      toast.error("Gagal menolak permintaan")
    } else {
      toast.error("Permintaan ditolak")
      fetchRequests()
    }
  }

  if (!isSettingsLoading && settings && !settings.is_enabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in fade-in duration-500">
        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
          <IconLock size={48} className="text-slate-400" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Akses Dashboard Ditangguhkan</h2>
          <p className="text-slate-500 max-w-md">
            Maaf, akses dashboard Anda sedang dinonaktifkan oleh administrator. 
            Silakan hubungi bagian administrasi untuk informasi lebih lanjut.
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Coba Muat Ulang
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Pengajuan
            </CardTitle>
            <IconClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verifikasi</CardTitle>
            <IconHourglass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verifying}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tertunda</CardTitle>
            <IconHourglass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selesai</CardTitle>
            <IconCircleCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.done}</div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengajuan Surat</CardTitle>
          <CardDescription>
            Kelola dan verifikasi permintaan surat mahasiswa
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
                <SelectItem value="pending">Tertunda</SelectItem>
                <SelectItem value="verifying">Verifikasi</SelectItem>
                <SelectItem value="processing">Proses</SelectItem>
                <SelectItem value="done">Selesai</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b">
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
                      Tgl Dibuat
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground" style={{ width: '120px' }}>
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="h-24 text-center align-middle text-muted-foreground">
                        Tidak ada pengajuan ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((request) => (
                      <tr key={request.id} className="border-b">
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
                          {new Date(request.created_at).toLocaleDateString("id-ID")}
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" asChild title="Lihat Detail">
                              <Link href={`/dosen/verifier/${request.id}`}>
                                <IconEye className="h-4 w-4" />
                              </Link>
                            </Button>
                            {request.status === "verifying" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleApprove(request.id)}
                                  className="text-green-600 hover:text-green-700"
                                  title="Setujui"
                                >
                                  <IconCheck className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleReject(request.id)}
                                  className="text-red-600 hover:text-red-700"
                                  title="Tolak"
                                >
                                  <IconX className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
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
