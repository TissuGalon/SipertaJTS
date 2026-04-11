"use client";

import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { mockRequests } from '@/lib/mock-data';
import { StatusBadge } from '@/components/ui/status-badge';
import { 
  IconClipboardList, 
  IconSearch,
  IconFilter,
  IconEye,
  IconCalendarEvent,
  IconFileInvoice,
  IconDownload,
  IconBorderVertical,
  IconArrowUpRight,
  IconX,
  IconFileText,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { LETTER_TYPE_LABELS, RequestStatus, LetterRequest } from '@/types';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function PermintaanSuratPage() {
  const [filterStatus, setFilterStatus] = useState<RequestStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [requests, setRequests] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);
  
  // Monthly stats state
  const [monthlyStats, setMonthlyStats] = useState({
    total: 0,
    done: 0,
    pending: 0,
    rejected: 0,
    verifying: 0
  });

  React.useEffect(() => {
    setMounted(true);
    fetchRequests();
  }, [filterStatus, searchQuery, currentPage, date]);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      
      let selectQuery = '*, users(name, nim)';
      if (searchQuery) {
        // Use !inner for robust filtering on joined table
        selectQuery = '*, users!inner(name, nim)';
      }

      let query = supabase
        .from('letter_requests')
        .select(selectQuery, { count: 'exact' });

      // Apply Filters
      if (filterStatus !== "all") {
        query = query.eq('status', filterStatus);
      }

      if (date?.from) {
        query = query.gte('created_at', date.from.toISOString());
      }
      if (date?.to) {
        const toDate = new Date(date.to);
        toDate.setDate(toDate.getDate() + 1);
        query = query.lt('created_at', toDate.toISOString());
      }

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      if (searchQuery) {
        // Search in users table columns (Nama & NIM) or local academic_year
        // Note: PostgREST doesn't easily OR across tables in one .or() 
        // So we filter on the joined users table specifically
        query = query.or(`name.ilike.%${searchQuery}%,nim.ilike.%${searchQuery}%`, { foreignTable: 'users' });
      }

      const { data, error, count } = await (query as any)
        .order('is_priority', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setRequests(data || []);
      setTotalCount(count || 0);
    } catch (error: any) {
      console.error('Error fetching requests:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      toast.error("Gagal mengambil data pengajuan: " + (error.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMonthlyReport = async () => {
    try {
      setIsLoading(true);
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('letter_requests')
        .select('status')
        .gte('created_at', startOfMonth.toISOString());

      if (error) throw error;

      const stats = {
        total: data.length,
        done: data.filter(r => r.status === 'done').length,
        pending: data.filter(r => r.status === 'pending').length,
        rejected: data.filter(r => r.status === 'rejected').length,
        verifying: data.filter(r => r.status === 'verifying' || r.status === 'processing').length
      };

      setMonthlyStats(stats);
      setShowReport(true);
    } catch (error) {
      toast.error("Gagal memuat laporan bulanan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // Fetch ALL data matching current filters (not just current page)
      let selectQuery = '*, users(name, nim)';
      if (searchQuery) selectQuery = '*, users!inner(name, nim)';

      let query = supabase.from('letter_requests').select(selectQuery);
      if (filterStatus !== "all") query = query.eq('status', filterStatus);
      
      if (date?.from) {
        query = query.gte('created_at', date.from.toISOString());
      }
      if (date?.to) {
        const toDate = new Date(date.to);
        toDate.setDate(toDate.getDate() + 1);
        query = query.lt('created_at', toDate.toISOString());
      }

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,nim.ilike.%${searchQuery}%`, { foreignTable: 'users' });
      }

      const { data, error } = await (query as any).order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) {
        toast.error("Tidak ada data untuk diekspor");
        return;
      }

      const headers = ["ID", "Nama Mahasiswa", "NIM", "Jenis Surat", "Status", "Tanggal Masuk", "Tahun Akademik"];
      const csvData = data.map((req: any) => [
        req.id,
        req.users?.name || "Unknown",
        req.users?.nim || "-",
        LETTER_TYPE_LABELS[req.type as keyof typeof LETTER_TYPE_LABELS] || req.type,
        req.status,
        new Date(req.created_at).toLocaleDateString('id-ID'),
        req.academic_year || "-"
      ]);

      const csvContent = [
        headers.join(","),
        ...csvData.map((row: any) => row.join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Laporan_Permintaan_Surat_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Data berhasil diekspor ke CSV");
    } catch (error) {
      toast.error("Gagal mengekspor data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleQuickAction = async (id: string, action: 'prioritize' | 'cancel') => {
    try {
      let updateData = {};
      if (action === 'prioritize') {
        const req = requests.find(r => r.id === id);
        updateData = { is_priority: !req.is_priority };
      } else if (action === 'cancel') {
        updateData = { status: 'rejected', admin_notes: 'Dibatalkan oleh admin via tindakan cepat.' };
      }

      const { error } = await supabase
        .from('letter_requests')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      
      toast.success(action === 'prioritize' ? "Status prioritas diperbarui" : "Pengajuan dibatalkan");
      fetchRequests();
    } catch (error) {
      toast.error("Gagal melakukan tindakan");
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const filteredRequests = requests; // Now handled by server-side query

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Permintaan Surat</h2>
          <p className="text-slate-500">Manajemen dan verifikasi seluruh pengajuan surat dari mahasiswa.</p>
        </div>
        <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-1.5 rounded-xl shadow-sm border">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 rounded-lg px-3 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? <IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> : <IconDownload className="mr-2 h-4 w-4" />}
            Export CSV
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 rounded-lg px-3 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={fetchMonthlyReport}
            disabled={isLoading}
          >
            <IconFileInvoice className="mr-2 h-4 w-4" />
            Laporan Bulanan
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="border-none shadow-lg bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Cari NIM, Nama Mahasiswa, atau ID Pengajuan..." 
                className="pl-10 h-11 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 focus-visible:ring-indigo-500 text-sm" 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="flex gap-2">
              {mounted ? (
                <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                  <SelectTrigger className="w-[180px] h-11 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50">
                    <IconFilter className="mr-2 h-4 w-4 text-slate-400" />
                    <SelectValue placeholder="Semua Status" />
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
              ) : (
                <div className="w-[180px] h-11 border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 rounded-lg animate-pulse" />
              )}
              {mounted ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className={cn(
                        "h-11 px-3 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 font-normal shrink-0",
                        !date && "text-slate-500"
                      )}
                    >
                      <IconCalendarEvent size={18} className="mr-2 text-slate-500" />
                      {date?.from ? (
                        date.to ? (
                          <>
                            {format(date.from, "dd LLL yy", { locale: localeID })} -{" "}
                            {format(date.to, "dd LLL yy", { locale: localeID })}
                          </>
                        ) : (
                          format(date.from, "dd LLL yy", { locale: localeID })
                        )
                      ) : (
                        <span className="hidden sm:inline">Filter Tanggal</span>
                      )}
                      {!date?.from && <span className="sm:hidden">Tanggal</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50 border-none shadow-2xl rounded-2xl overflow-hidden" align="end">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={date?.from}
                      selected={date}
                      onSelect={(newDate) => {
                        setDate(newDate);
                        setCurrentPage(1);
                      }}
                      numberOfMonths={1}
                      className="bg-white dark:bg-slate-900"
                    />
                    {date && (
                      <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                        <Button 
                          variant="ghost" 
                          className="w-full h-9 text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl" 
                          onClick={() => {
                            setDate(undefined);
                            setCurrentPage(1);
                          }}
                        >
                          Reset Filter Date
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              ) : (
                <div className="w-[140px] h-11 border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 rounded-lg animate-pulse" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Requests Table */}
      <Card className="border-none shadow-2xl overflow-hidden rounded-2xl bg-white dark:bg-slate-900">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                <IconFileInvoice size={20} />
              </div>
              <CardTitle className="text-lg">Daftar Pengajuan Terbaru</CardTitle>
            </div>
            <Badge variant="outline" className="font-mono text-xs font-bold tracking-widest text-indigo-600 bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800">
              TOTAL: {totalCount}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-slate-50/50 dark:bg-slate-800/30 border-b text-slate-500 font-medium">
                <tr>
                  <th className="h-14 px-6 text-left">Info Pengaju</th>
                  <th className="h-14 px-6 text-left">Jenis Surat</th>
                  <th className="h-14 px-6 text-left">Tanggal Masuk</th>
                  <th className="h-14 px-6 text-left">Status</th>
                  <th className="h-14 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded mb-2"></div>
                        <div className="h-3 w-24 bg-slate-50 dark:bg-slate-900 rounded"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-40 bg-slate-100 dark:bg-slate-800 rounded"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 w-20 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="h-9 w-20 bg-slate-100 dark:bg-slate-800 rounded ml-auto"></div>
                      </td>
                    </tr>
                  ))
                ) : filteredRequests.map((request) => (
                  <tr key={request.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-200">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {request.users?.name || 'Unknown'}
                        </span>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-slate-400 font-mono">ID: {request.id.slice(0, 8)}</span>
                          <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
                          <span className="text-sm font-medium text-slate-500">{request.users?.nim || '-'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
                          {LETTER_TYPE_LABELS[request.type as keyof typeof LETTER_TYPE_LABELS]}
                        </span>
                        {request.details?.companyName && (
                          <span className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[150px]">
                            {request.details.companyName}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">
                          {new Date(request.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(request.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center space-x-2">
                        <Link href={`/admin/verifier/${request.id}`}>
                          <Button size="sm" variant="outline" className="h-9 px-3 border-indigo-100 hover:bg-indigo-50 hover:text-indigo-600 dark:border-indigo-900/30 dark:hover:bg-indigo-900/20 transition-all group/btn">
                            <IconEye size={17} className="mr-2 group-hover/btn:scale-110 transition-transform" />
                            Detail
                          </Button>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                              <IconBorderVertical size={18} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 border-none shadow-2xl backdrop-blur-xl">
                            <DropdownMenuLabel>Tindakan Cepat</DropdownMenuLabel>
                            <DropdownMenuItem className="py-2.5" onClick={() => handleQuickAction(request.id, 'prioritize')}>
                              <IconArrowUpRight size={16} className={cn("mr-2", request.is_priority ? "text-amber-500" : "text-indigo-500")} />
                              {request.is_priority ? "Hapus Prioritas" : "Prioritaskan Pengajuan"}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="py-2.5" onClick={() => {
                              if (request.files && request.files.length > 0) {
                                setSelectedFiles(request.files);
                                setIsFilesModalOpen(true);
                              } else {
                                toast.info("Tidak ada lampiran");
                              }
                            }}>
                              <IconEye size={16} className="mr-2 text-emerald-500" />
                              Lihat Lampiran
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="py-2.5 text-rose-500 focus:text-rose-500 focus:bg-rose-50 dark:focus:bg-rose-900/20"
                              onClick={() => handleQuickAction(request.id, 'cancel')}
                            >
                              Batalkan Pengajuan
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-20 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400">
                          <IconClipboardList size={40} />
                        </div>
                        <p className="text-lg font-medium">Tidak ada pengajuan surat yang ditemukan</p>
                        <p className="max-w-xs text-sm">Coba atur ulang filter atau kata kunci pencarian Anda untuk melihat pengajuan lainnya.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Footer Info & Pagination */}
      <div className="flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 font-medium px-4">
        <span>Menampilkan {requests.length} dari {totalCount} pengajuan surat</span>
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 shadow-sm" 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          >
            Sebelumnya
          </Button>
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const pageNum = i + 1;
              return (
                <Button 
                  key={pageNum}
                  size="sm" 
                  className={cn("h-8 w-8 p-0", currentPage === pageNum ? "bg-indigo-600" : "bg-transparent text-slate-600 hover:bg-slate-100")}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            {totalPages > 5 && <span>...</span>}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 shadow-sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          >
            Berikutnya
          </Button>
        </div>
      </div>

      {/* Monthly Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <Card className="w-full max-w-xl shadow-3xl border-none overflow-hidden rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
             <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/50">
               <div className="flex items-center justify-between">
                 <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl shadow-inner">
                      <IconFileInvoice size={22} />
                    </div>
                    <div>
                      <CardTitle>Ringkasan Laporan Bulanan</CardTitle>
                      <CardDescription className="font-medium text-slate-500">
                        Periode: {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                      </CardDescription>
                    </div>
                 </div>
                 <Button variant="ghost" size="icon" className="rounded-full hover:bg-rose-50 hover:text-rose-600" onClick={() => setShowReport(false)}>
                   <IconX size={20} />
                 </Button>
               </div>
             </CardHeader>
             <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-5 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 rounded-3xl border border-indigo-100 dark:border-indigo-900/30 shadow-sm">
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest mb-1">Total Pengajuan</p>
                    <p className="text-4xl font-black text-slate-900 dark:text-white">{monthlyStats.total}</p>
                  </div>
                  <div className="p-5 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 rounded-3xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-widest mb-1">Disetujui</p>
                    <p className="text-4xl font-black text-slate-900 dark:text-white">{monthlyStats.done}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Distribusi Status</h4>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">REAL-TIME DATA</span>
                  </div>
                  <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden flex shadow-inner">
                    <div className="h-full bg-amber-400 transition-all duration-1000" style={{ width: `${(monthlyStats.pending / monthlyStats.total) * 100 || 0}%` }}></div>
                    <div className="h-full bg-indigo-400 transition-all duration-1000" style={{ width: `${(monthlyStats.verifying / monthlyStats.total) * 100 || 0}%` }}></div>
                    <div className="h-full bg-emerald-400 transition-all duration-1000" style={{ width: `${(monthlyStats.done / monthlyStats.total) * 100 || 0}%` }}></div>
                    <div className="h-full bg-rose-400 transition-all duration-1000" style={{ width: `${(monthlyStats.rejected / monthlyStats.total) * 100 || 0}%` }}></div>
                  </div>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-6 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-[11px] font-bold text-slate-500">
                        <div className="h-2.5 w-2.5 rounded-full bg-amber-400 mr-2 shadow-sm shadow-amber-200"></div> Pending
                      </div>
                      <span className="text-xs font-black text-slate-900 dark:text-white">{monthlyStats.pending}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-[11px] font-bold text-slate-500">
                        <div className="h-2.5 w-2.5 rounded-full bg-indigo-400 mr-2 shadow-sm shadow-indigo-200"></div> Verifikasi
                      </div>
                      <span className="text-xs font-black text-slate-900 dark:text-white">{monthlyStats.verifying}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-[11px] font-bold text-slate-500">
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 mr-2 shadow-sm shadow-emerald-200"></div> Selesai
                      </div>
                      <span className="text-xs font-black text-slate-900 dark:text-white">{monthlyStats.done}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-[11px] font-bold text-slate-500">
                        <div className="h-2.5 w-2.5 rounded-full bg-rose-400 mr-2 shadow-sm shadow-rose-200"></div> Ditolak
                      </div>
                      <span className="text-xs font-black text-slate-900 dark:text-white">{monthlyStats.rejected}</span>
                    </div>
                  </div>
                </div>
             </CardContent>
             <CardFooter className="bg-slate-50/80 dark:bg-slate-800/50 p-6 flex justify-between items-center border-t">
               <p className="text-[10px] text-slate-400 font-medium max-w-[200px]">
                 Laporan ini dihitung otomatis berdasarkan data pengajuan sebulan terakhir.
               </p>
               <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none font-bold px-6" onClick={handleExport}>
                 Unduh CSV Lengkap
               </Button>
             </CardFooter>
           </Card>
        </div>
      )}

      {/* Attachment Viewer Modal */}
      <Dialog open={isFilesModalOpen} onOpenChange={setIsFilesModalOpen}>
        <DialogContent className="sm:max-w-md border-none shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl font-black text-slate-900 dark:text-white">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl mr-3">
                <IconFileInvoice size={20} />
              </div>
              Lampiran Pengajuan
            </DialogTitle>
            <DialogDescription className="font-medium text-slate-500">
              Daftar dokumen pendukung yang diunggah oleh mahasiswa.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-3 py-6 pr-2">
            {selectedFiles.map((file, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 group hover:border-indigo-500 hover:shadow-lg transition-all"
              >
                <div className="flex items-center space-x-4 overflow-hidden">
                  <div className="min-h-[44px] min-w-[44px] bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                    <IconFileText size={22} />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-bold truncate max-w-[180px] text-slate-900 dark:text-white">
                      {file.name || `Dokumen_${idx + 1}`}
                    </span>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                      {file.type || 'UNDETERMINED'}
                    </span>
                  </div>
                </div>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-10 w-10 p-0 rounded-full hover:bg-indigo-50 hover:text-indigo-600"
                  onClick={() => window.open(file.url, '_blank')}
                >
                  <IconDownload size={20} />
                </Button>
              </div>
            ))}
            {selectedFiles.length === 0 && (
              <div className="text-center py-8">
                <IconX className="mx-auto text-slate-200 mb-2" size={32} />
                <p className="text-slate-500 font-medium">Tidak ada file lampiran.</p>
              </div>
            )}
          </div>
          <div className="flex justify-center pt-2">
            <Button variant="outline" className="rounded-full px-8 font-bold border-slate-200" onClick={() => setIsFilesModalOpen(false)}>Tutup</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
