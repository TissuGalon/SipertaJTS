"use client";

import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
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
  IconArrowUpRight
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
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { LETTER_TYPE_LABELS, RequestStatus, LetterRequest } from '@/types';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function PermintaanSuratPage() {
  const [filterStatus, setFilterStatus] = useState<RequestStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('letter_requests')
        .select('*, users(name, nim)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      console.error('Error fetching requests:', error);
      toast.error("Gagal mengambil data pengajuan");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesStatus = filterStatus === "all" || req.status === filterStatus;
    const userName = req.users?.name || "";
    const userNim = req.users?.nim || "";
    const matchesSearch = userName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          userNim.includes(searchQuery) ||
                          req.id.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Permintaan Surat</h2>
          <p className="text-slate-500">Manajemen dan verifikasi seluruh pengajuan surat dari mahasiswa.</p>
        </div>
        <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-1.5 rounded-xl shadow-sm border">
          <Button variant="ghost" size="sm" className="h-8 rounded-lg px-3 hover:bg-slate-100 dark:hover:bg-slate-800">
            Export Excel
          </Button>
          <Button variant="ghost" size="sm" className="h-8 rounded-lg px-3 hover:bg-slate-100 dark:hover:bg-slate-800">
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
                            <DropdownMenuItem className="py-2.5">
                              <IconArrowUpRight size={16} className="mr-2 text-indigo-500" />
                              Prioritaskan Pengajuan
                            </DropdownMenuItem>
                            <DropdownMenuItem className="py-2.5">
                              <IconDownload size={16} className="mr-2 text-emerald-500" />
                              Unduh Lampiran
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="py-2.5 text-rose-500 focus:text-rose-500 focus:bg-rose-50 dark:focus:bg-rose-900/20">
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
      
      {/* Footer Info */}
      <div className="flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 font-medium px-4">
        <span>Menampilkan {filteredRequests.length} dari {requests.length} pengajuan surat</span>
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm" className="h-8 shadow-sm" disabled>Sebelumnya</Button>
          <div className="flex items-center space-x-1">
            <Button size="sm" className="h-8 w-8 p-0 bg-indigo-600">1</Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">2</Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">3</Button>
          </div>
          <Button variant="outline" size="sm" className="h-8 shadow-sm">Berikutnya</Button>
        </div>
      </div>
    </div>
  );
}
