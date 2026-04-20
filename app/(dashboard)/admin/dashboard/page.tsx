"use client";

export const dynamic = 'force-dynamic';


import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { StatusBadge } from '@/components/ui/status-badge';
import { 
  IconUsers, 
  IconClipboardList, 
  IconHourglass, 
  IconCircleCheck,
  IconSearch,
  IconFilter,
  IconEye,
  IconCheck,
  IconX,
  IconDotsVertical,
  IconLoader2
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import Link from 'next/link';
import { LETTER_TYPE_LABELS, PRODI_LABELS, ProdiType, RequestStatus } from '@/types';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const [filterStatus, setFilterStatus] = useState<RequestStatus | "all">("all");
  const [filterProdi, setFilterProdi] = useState<ProdiType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState([
    { label: 'Total Pengajuan', value: 0, icon: IconClipboardList, color: 'text-slate-600', bg: 'bg-slate-100' },
    { label: 'Perlu Tinjauan', value: 0, icon: IconHourglass, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Selesai', value: 0, icon: IconCircleCheck, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Mahasiswa Aktif', value: 0, icon: IconUsers, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  ]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Stats
      const [
        { count: totalCount },
        { count: pendingCount },
        { count: doneCount }, // We could filter by "today" if needed
        { count: studentCount }
      ] = await Promise.all([
        supabase.from('letter_requests').select('*', { count: 'exact', head: true }),
        supabase.from('letter_requests').select('*', { count: 'exact', head: true }).in('status', ['pending', 'menunggu_admin']),
        supabase.from('letter_requests').select('*', { count: 'exact', head: true }).eq('status', 'done'),
        supabase.from('mahasiswa').select('*', { count: 'exact', head: true })
      ]);

      setStats([
        { label: 'Total Pengajuan', value: totalCount || 0, icon: IconClipboardList, color: 'text-slate-600', bg: 'bg-slate-100' },
        { label: 'Perlu Tinjauan', value: pendingCount || 0, icon: IconHourglass, color: 'text-amber-600', bg: 'bg-amber-100' },
        { label: 'Selesai (Total)', value: doneCount || 0, icon: IconCircleCheck, color: 'text-emerald-600', bg: 'bg-emerald-100' },
        { label: 'Mahasiswa Terdaftar', value: studentCount || 0, icon: IconUsers, color: 'text-indigo-600', bg: 'bg-indigo-100' },
      ]);

      // 2. Fetch Recent Requests (limited to 5 for dashboard)
      const { data, error } = await supabase
        .from('letter_requests')
        .select('*, users(name, nim)')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Gagal memuat data dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesStatus = filterStatus === "all" || req.status === filterStatus;
    const matchesProdi = filterProdi === "all" || req.prodi === filterProdi || (req.users?.prodi === filterProdi);
    const userName = req.users?.name || "";
    const userNim = req.users?.nim || "";
    const matchesSearch = userName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          userNim.includes(searchQuery) ||
                          req.id.includes(searchQuery);
    return matchesStatus && matchesProdi && matchesSearch;
  });

  const handleAction = async (id: string, newStatus: RequestStatus) => {
    try {
      const { error } = await supabase
        .from('letter_requests')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Status pengajuan berhasil diubah menjadi ${newStatus}`);
      fetchDashboardData(); // Refresh data
    } catch (error: any) {
      toast.error("Gagal mengubah status: " + error.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard Admin</h2>
          <p className="text-slate-500">Ringkasan dan manajemen pengajuan surat mahasiswa secara real-time.</p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchDashboardData} 
          disabled={isLoading}
          className="h-10 border-indigo-100 hover:bg-indigo-50"
        >
          {isLoading ? <IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> : <IconSearch className="mr-2 h-4 w-4" />}
          Refresh Data
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-none shadow-md hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.label}</CardTitle>
              <div className={`p-2.5 rounded-xl ${stat.bg} shadow-sm`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-8 w-20 bg-slate-100 dark:bg-slate-800 animate-pulse rounded"></div>
              ) : (
                <div className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Requests Management */}
      <Card className="border-none shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pengajuan Terbaru</CardTitle>
              <CardDescription>Menampilkan 10 pengajuan surat terakhir</CardDescription>
            </div>
            <Link href="/admin/permintaan">
              <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                Lihat Semua <IconX className="ml-1 h-3 w-3 rotate-45" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-6 py-4 flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex flex-1 items-center space-x-2 max-w-md">
              <div className="relative w-full">
                <IconSearch className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Cari NIM, Nama, atau ID..." 
                  className="pl-10 h-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={filterProdi} onValueChange={(v: any) => setFilterProdi(v)}>
                <SelectTrigger className="w-[180px] h-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                  <IconFilter className="mr-2 h-4 w-4 text-slate-400" />
                  <SelectValue placeholder="Semua Prodi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Program Studi</SelectItem>
                  {Object.entries(PRODI_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                <SelectTrigger className="w-[180px] h-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                  <IconFilter className="mr-2 h-4 w-4 text-slate-400" />
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="pending">Tertunda (Pending)</SelectItem>
                  <SelectItem value="menunggu_admin">Menunggu Admin</SelectItem>
                  <SelectItem value="verifying">Verifikasi</SelectItem>
                  <SelectItem value="processing">Proses</SelectItem>
                  <SelectItem value="done">Selesai</SelectItem>
                  <SelectItem value="rejected">Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80 dark:bg-slate-900 border-b text-slate-500 font-medium uppercase tracking-tighter">
                <tr>
                  <th className="h-12 px-6 text-left">Pengaju</th>
                  <th className="h-12 px-6 text-left">Jenis Surat</th>
                  <th className="h-12 px-6 text-left">Status</th>
                  <th className="h-12 px-6 text-left">Tanggal</th>
                  <th className="h-12 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="p-4 bg-slate-50/30 dark:bg-slate-800/20">
                        <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
                      </td>
                    </tr>
                  ))
                ) : filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                          {request.users?.name || 'Unknown'}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">{request.users?.nim || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">
                      {LETTER_TYPE_LABELS[request.type as keyof typeof LETTER_TYPE_LABELS] || request.type}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">
                      {new Date(request.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/verifier/${request.id}`}>
                        <Button variant="outline" size="sm" className="h-8 px-3 text-indigo-600 border-indigo-100 hover:bg-indigo-50">
                          <IconEye size={16} className="mr-1.5" />
                          Detail
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
                {!isLoading && filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <IconClipboardList size={40} className="text-slate-200" />
                        <p className="font-medium">Tidak ada pengajuan terbaru.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
