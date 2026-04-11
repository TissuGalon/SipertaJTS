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
  IconFileText
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
  const [requests, setRequests] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);

  React.useEffect(() => {
    setMounted(true);
    fetchRequests();
  }, [filterStatus, searchQuery, currentPage]);

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

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      if (searchQuery) {
        // Search in users table columns (Nama & NIM) or local academic_year
        // Note: PostgREST doesn't easily OR across tables in one .or() 
        // So we filter on the joined users table specifically
        query = query.or(`name.ilike.%${searchQuery}%,nim.ilike.%${searchQuery}%`, { foreignTable: 'users' });
      }

      const { data, error, count } = await query
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

  const handleExport = () => {
    try {
      if (requests.length === 0) {
        toast.error("Tidak ada data untuk diekspor");
        return;
      }

      const headers = ["ID", "Nama Mahasiswa", "NIM", "Jenis Surat", "Status", "Tanggal Masuk", "Tahun Akademik"];
      const csvData = requests.map(req => [
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
        ...csvData.map(row => row.join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Data_Permintaan_Surat_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Data berhasil diekspor ke CSV");
    } catch (error) {
      toast.error("Gagal mengekspor data");
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
          >
            Export Excel
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 rounded-lg px-3 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setShowReport(true)}
          >
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
                className="pl-10 h-11 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 focus-visible:ring-indigo-500" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
              <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50">
                <IconCalendarEvent size={20} className="text-slate-500" />
              </Button>
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
            <Badge variant="outline" className="font-mono text-xs">
              TOTAL: {filteredRequests.length}
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

      {/* Monthly Report Modal (Mock) */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
           <Card className="w-full max-w-xl shadow-2xl border-none">
             <CardHeader className="border-b">
               <div className="flex items-center justify-between">
                 <CardTitle>Ringkasan Laporan Bulanan</CardTitle>
                 <Button variant="ghost" size="icon" onClick={() => setShowReport(false)}>
                   <IconX size={20} />
                 </Button>
               </div>
               <CardDescription>Statistik pengajuan surat untuk bulan {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</CardDescription>
             </CardHeader>
             <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider mb-1">Total Pengajuan</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{totalCount}</p>
                  </div>
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-1">Disetujui</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">
                      {requests.filter(r => r.status === 'done').length}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">Distribusi Status</h4>
                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                    <div className="h-full bg-indigo-500" style={{ width: '40%' }}></div>
                    <div className="h-full bg-amber-500" style={{ width: '25%' }}></div>
                    <div className="h-full bg-emerald-500" style={{ width: '20%' }}></div>
                    <div className="h-full bg-rose-500" style={{ width: '15%' }}></div>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    <div className="flex items-center text-xs font-medium text-slate-500">
                      <div className="h-2 w-2 rounded-full bg-indigo-500 mr-2"></div> Pending
                    </div>
                    <div className="flex items-center text-xs font-medium text-slate-500">
                      <div className="h-2 w-2 rounded-full bg-amber-500 mr-2"></div> Verifikasi
                    </div>
                    <div className="flex items-center text-xs font-medium text-slate-500">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 mr-2"></div> Selesai
                    </div>
                    <div className="flex items-center text-xs font-medium text-slate-500">
                      <div className="h-2 w-2 rounded-full bg-rose-500 mr-2"></div> Ditolak
                    </div>
                  </div>
                </div>
             </CardContent>
             <CardFooter className="bg-slate-50 dark:bg-slate-800/50 p-4 flex justify-end">
               <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleExport}>Download Detail CSV</Button>
             </CardFooter>
           </Card>
        </div>
      )}

      {/* Attachment Viewer Modal */}
      <Dialog open={isFilesModalOpen} onOpenChange={setIsFilesModalOpen}>
        <DialogContent className="sm:max-w-md border-none shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <IconFileInvoice className="mr-2 text-indigo-600" size={20} />
              Lampiran Pengajuan
            </DialogTitle>
            <DialogDescription>
              Terdapat {selectedFiles.length} file yang dilampirkan dalam pengajuan ini.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-3 py-4 pr-2">
            {selectedFiles.map((file, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 group hover:border-indigo-200 dark:hover:border-indigo-900/30 transition-all"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm group-hover:text-indigo-600 transition-colors">
                    <IconFileText size={18} />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-semibold truncate max-w-[200px] text-slate-900 dark:text-white">
                      {file.name || `Lampiran_${idx + 1}`}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                      {file.type || 'Document'}
                    </span>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-9 w-9 p-0 rounded-full hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20"
                  onClick={() => window.open(file.url, '_blank')}
                >
                  <IconDownload size={18} />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setIsFilesModalOpen(false)}>Tutup</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
