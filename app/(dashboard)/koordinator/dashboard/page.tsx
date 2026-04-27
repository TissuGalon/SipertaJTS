"use client";

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
  IconClipboardList,
  IconHourglass,
  IconSearch,
  IconCheck,
  IconX,
  IconLock,
  IconInbox,
  IconEye,
  IconSettings,
  IconUserEdit,
  IconAlertCircle
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
import { Checkbox } from "@/components/ui/checkbox"
import { BulkActionBar } from "@/components/koordinator/bulk-action-bar"
import { ProfileEditor } from "@/components/koordinator/profile-editor"
import { AnimatePresence, motion } from "framer-motion"

export default function KoordinatorDashboard() {
  const [filterStatus, setFilterStatus] = useState<RequestStatus | "all">(
    "pending"
  )
  const [filterProdi, setFilterProdi] = useState<ProdiType | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [requests, setRequests] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [settings, setSettings] = useState<any>(null)
  const [isSettingsLoading, setIsSettingsLoading] = useState(true)
  
  // Profile State
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false)
  const [dosenProfile, setDosenProfile] = useState<any>(null)
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false)
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false)

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
      
      // Also fetch dosen profile to check completeness
      const { data: profile } = await supabase
        .from('dosen')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profile) {
        setDosenProfile(profile);
        setIsProfileIncomplete(!profile.gelar || !profile.hp);
      }
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
      } else {
        // Milestone 1 Filter: Hanya menampilkan magang, sidang, seminar. Sembunyikan aktif kuliah dan izin penelitian.
        query = query.in('type', ['surat_sidang', 'surat_undangan_seminar', 'surat_undangan_sidang', 'surat_magang', 'surat_permohonan_magang', 'surat_tugas_magang']);
      }
    } else {
      query = query.in('type', ['surat_sidang', 'surat_undangan_seminar', 'surat_undangan_sidang', 'surat_magang', 'surat_permohonan_magang', 'surat_tugas_magang']);
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
    setSelectedIds([]) // Clear selection on refresh
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

  // Statistical data for the dashboard
  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "disetujui_koordinator").length,
    rejected: requests.filter((r) => r.status === "ditolak_koordinator").length,
  }

  // Selection Logic
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredRequests.length) {
      setSelectedIds([])
    } else {
      // Only select pending requests for bulk actions to be safe, or select all filtered?
      // Better to select only the ones that CAN be acted upon (pending)
      const actionableIds = filteredRequests
        .filter(r => r.status === "pending")
        .map(r => r.id)
      setSelectedIds(actionableIds)
      
      if (actionableIds.length === 0 && filteredRequests.length > 0) {
        toast.info("Tidak ada pengajuan 'Pending' yang bisa dipilih massal.")
      }
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from("letter_requests")
      .update({ 
        status: "disetujui_koordinator",
        updated_at: new Date().toISOString()
      })
      .eq("id", id)

    if (error) {
      toast.error("Gagal menyetujui permintaan")
    } else {
      toast.success("Permintaan disetujui")
      fetchRequests()
    }
  }

  const handleReject = async (id: string) => {
    const { error } = await supabase
      .from("letter_requests")
      .update({ 
        status: "ditolak_koordinator",
        updated_at: new Date().toISOString()
      })
      .eq("id", id)

    if (error) {
      toast.error("Gagal menolak permintaan")
    } else {
      toast.error("Permintaan ditolak koordinator")
      fetchRequests()
    }
  }

  // Bulk Handlers
  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkSubmitting(true);
    try {
      const { error } = await supabase
        .from("letter_requests")
        .update({ 
          status: "disetujui_koordinator",
          updated_at: new Date().toISOString()
        })
        .in("id", selectedIds);

      if (error) throw error;
      toast.success(`${selectedIds.length} pengajuan berhasil disetujui sekaligus.`);
      fetchRequests();
    } catch (error: any) {
      toast.error("Gagal memproses pengajuan massal", { description: error.message });
    } finally {
      setIsBulkSubmitting(false);
    }
  }

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Tolak ${selectedIds.length} pengajuan yang dipilih?`)) return;
    
    setIsBulkSubmitting(true);
    try {
      const { error } = await supabase
        .from("letter_requests")
        .update({ 
          status: "ditolak_koordinator",
          updated_at: new Date().toISOString()
        })
        .in("id", selectedIds);

      if (error) throw error;
      toast.error(`${selectedIds.length} pengajuan telah ditolak.`);
      fetchRequests();
    } catch (error: any) {
      toast.error("Gagal menolak pengajuan massal", { description: error.message });
    } finally {
      setIsBulkSubmitting(false);
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
      <AnimatePresence>
        <BulkActionBar 
          selectedCount={selectedIds.length}
          onApprove={handleBulkApprove}
          onReject={handleBulkReject}
          onClear={() => setSelectedIds([])}
          isSubmitting={isBulkSubmitting}
        />
      </AnimatePresence>

      <ProfileEditor 
        isOpen={isProfileEditorOpen}
        onClose={() => setIsProfileEditorOpen(false)}
        userId={dosenProfile?.user_id}
        onUpdate={fetchSettings}
      />

      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            Halo, {dosenProfile?.name || 'Koordinator'}
            <span className="hidden md:inline-block px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
              {dosenProfile?.prodi || 'Koordinator'}
            </span>
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Selamat datang kembali. Anda memiliki {stats.pending} pengajuan yang menunggu verifikasi.
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setIsProfileEditorOpen(true)}
          className="rounded-xl border-slate-200 dark:border-slate-800 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 px-6"
        >
          <IconUserEdit className="mr-2 h-4 w-4" />
          Edit Profil & Gelar
        </Button>
      </div>

      {/* Completion Notice */}
      <AnimatePresence>
        {isProfileIncomplete && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-none shadow-lg bg-indigo-600 text-white overflow-hidden rounded-[1.5rem]">
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                      <IconAlertCircle size={28} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-black text-lg">Lengkapi Profil Anda</h4>
                      <p className="text-indigo-100 text-sm font-medium">Gelar dan Nomor HP Anda belum lengkap. Data ini diperlukan untuk pencetakan surat.</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setIsProfileEditorOpen(true)}
                    className="bg-white text-indigo-600 hover:bg-indigo-50 font-black rounded-xl px-6 shadow-xl"
                  >
                    Lengkapi Sekarang
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

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
        <Card className={stats.pending > 0 ? "border-amber-200 bg-amber-50/20 dark:bg-amber-900/10" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menunggu Verifikasi</CardTitle>
            <IconHourglass className={`h-4 w-4 ${stats.pending > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disetujui</CardTitle>
            <IconCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ditolak</CardTitle>
            <IconX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card className="border-none shadow-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
        <CardHeader>
          <CardTitle>Daftar Pengajuan Surat</CardTitle>
          <CardDescription>
            Kelola dan verifikasi permintaan surat mahasiswa secara massal atau individu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[300px]">
              <IconSearch className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari berdasarkan nama, NIM, atau ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 border-slate-200 dark:border-slate-800 focus:ring-indigo-500"
              />
            </div>
            <Select
              value={filterProdi}
              onValueChange={(value) =>
                setFilterProdi(value as ProdiType | "all")
              }
            >
              <SelectTrigger className="w-[200px] h-10 border-slate-200 dark:border-slate-800">
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
              <SelectTrigger className="w-[200px] h-10 border-slate-200 dark:border-slate-800">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Menunggu Verifikasi</SelectItem>
                <SelectItem value="disetujui_koordinator">Sudah Disetujui</SelectItem>
                <SelectItem value="ditolak_koordinator">Ditolak Koordinator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
            {isLoading ? (
              <div className="flex h-64 flex-col items-center justify-center space-y-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                <p className="text-sm font-medium text-slate-500">Memproses data...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                      <th className="h-12 w-12 px-4 text-center align-middle">
                        <Checkbox 
                          checked={selectedIds.length > 0 && selectedIds.length === filteredRequests.filter(r => r.status === "pending").length}
                          onCheckedChange={toggleSelectAll}
                        />
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                        Mahasiswa
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                        Jenis Surat
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                        Status
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                        Tgl Diajukan
                      </th>
                      <th className="h-12 px-4 text-right align-middle font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider" style={{ width: '120px' }}>
                        Tindakan
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="h-64 text-center align-middle">
                          <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
                            <IconInbox size={48} stroke={1} className="opacity-20" />
                            <p className="font-medium">Tidak ada pengajuan surat ditemukan.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredRequests.map((request) => (
                        <tr 
                          key={request.id} 
                          className={`border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${selectedIds.includes(request.id) ? 'bg-indigo-50/30 dark:bg-indigo-900/5' : ''}`}
                        >
                          <td className="p-4 text-center align-middle">
                            <Checkbox 
                              checked={selectedIds.includes(request.id)}
                              onCheckedChange={() => toggleSelect(request.id)}
                              disabled={request.status !== "pending"}
                            />
                          </td>
                          <td className="p-4 align-middle">
                            <div className="flex items-center space-x-3">
                              <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold text-xs">
                                {request.userName?.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white leading-tight">{request.userName}</div>
                                <div className="text-xs font-medium text-slate-500">
                                  {request.userNim} • {request.prodi}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                              {LETTER_TYPE_LABELS[request.type as keyof typeof LETTER_TYPE_LABELS] || request.type}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">#{request.id.substring(0, 8)}</div>
                          </td>
                          <td className="p-4 align-middle">
                            <StatusBadge status={request.status} />
                          </td>
                          <td className="p-4 align-middle">
                            <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                              {new Date(request.created_at).toLocaleDateString("id-ID", {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            <div className="flex items-center justify-end space-x-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                asChild 
                                className="h-8 w-8 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                              >
                                <Link href={`/koordinator/verifier/${request.id}`}>
                                  <IconEye className="h-4 w-4" />
                                </Link>
                              </Button>
                              {request.status === "pending" && (
                                <div className="flex items-center space-x-1 border-l pl-1 ml-1 border-slate-200 dark:border-slate-800">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleApprove(request.id)}
                                    className="h-8 w-8 rounded-lg text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                                    title="Setujui"
                                  >
                                    <IconCheck className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleReject(request.id)}
                                    className="h-8 w-8 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                                    title="Tolak"
                                  >
                                    <IconX className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
