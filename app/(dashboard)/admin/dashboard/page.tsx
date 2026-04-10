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
  IconUsers, 
  IconClipboardList, 
  IconHourglass, 
  IconCircleCheck,
  IconSearch,
  IconFilter,
  IconEye,
  IconCheck,
  IconX,
  IconDotsVertical
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
import { LETTER_TYPE_LABELS, RequestStatus } from '@/types';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const [filterStatus, setFilterStatus] = useState<RequestStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [requests, setRequests] = useState(mockRequests);

  const filteredRequests = requests.filter(req => {
    const matchesStatus = filterStatus === "all" || req.status === filterStatus;
    const matchesSearch = req.userName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          req.userNim.includes(searchQuery) ||
                          req.id.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const handleAction = (id: string, newStatus: RequestStatus) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus, updatedAt: new Date().toISOString() } : r));
    toast.success(`Request ${id} marked as ${newStatus}`);
  };

  const stats = [
    { label: 'Total Pengajuan', value: requests.length, icon: IconClipboardList, color: 'text-slate-600', bg: 'bg-slate-100' },
    { label: 'Perlu Tinjauan', value: requests.filter(r => r.status === 'pending').length, icon: IconHourglass, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Selesai Hari Ini', value: requests.filter(r => r.status === 'done').length, icon: IconCircleCheck, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Mahasiswa Aktif', value: 1240, icon: IconUsers, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard Admin</h2>
        <p className="text-slate-500">Ringkasan dan manajemen seluruh pengajuan surat mahasiswa.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">{stat.label}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Requests Management */}
      <Card className="border-none shadow-xl">
        <CardHeader>
          <CardTitle>Kelola Pengajuan Surat</CardTitle>
          <CardDescription>Manajemen dan verifikasi berkas surat mahasiswa</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-6">
            <div className="flex flex-1 items-center space-x-2 max-w-md">
              <div className="relative w-full">
                <IconSearch className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Cari NIM atau Nama..." 
                  className="pl-10" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                <SelectTrigger className="w-[180px]">
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
            </div>
          </div>

          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                <tr>
                  <th className="h-12 px-4 text-left font-medium text-slate-500">Info Mahasiswa</th>
                  <th className="h-12 px-4 text-left font-medium text-slate-500">Jenis Surat</th>
                  <th className="h-12 px-4 text-left font-medium text-slate-500">Status</th>
                  <th className="h-12 px-4 text-left font-medium text-slate-500">Tanggal</th>
                  <th className="h-12 px-4 text-right font-medium text-slate-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 dark:text-white">{request.userName}</span>
                        <span className="text-xs text-slate-500">{request.userNim}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">
                      {LETTER_TYPE_LABELS[request.type]}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="p-4 text-slate-500">
                      {new Date(request.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end items-center space-x-1">
                        <Link href={`/admin/verifier/${request.id}`}>
                          <Button variant="outline" size="sm" className="h-8 px-2 text-indigo-600 hover:text-indigo-700">
                            <IconEye size={16} className="mr-1" />
                            Verifikasi
                          </Button>
                        </Link>
                        {request.status === 'pending' && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-emerald-600 hover:bg-emerald-50"
                              onClick={() => handleAction(request.id, 'verifying')}
                            >
                              <IconCheck size={16} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-rose-600 hover:bg-rose-50"
                              onClick={() => handleAction(request.id, 'rejected')}
                            >
                              <IconX size={16} />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <IconDotsVertical size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      Tidak ada pengajuan yang sesuai dengan kriteria.
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
