"use client";

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/status-badge';
import { TimelineStepper } from '@/components/ui/timeline-stepper';
import { 
  IconFileText, 
  IconClock, 
  IconCheck, 
  IconX,
  IconArrowRight,
  IconDownload,
  IconFilePlus,
  IconLoader2
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LETTER_TYPE_LABELS, RequestStatus } from '@/types';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function StudentDashboard() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // 1. Get auth user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 2. Get student profile
      const { data: profileData, error: profileError } = await supabase
        .from('mahasiswa')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }
      
      // If profile not found in mahasiswa table, try profiles or users table
      if (!profileData) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        setUserProfile(userData || { name: user.email?.split('@')[0], nim: '-' });
      } else {
        setUserProfile(profileData);
      }

      // 3. Get requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('letter_requests')
        .select(`
          *,
          letter_templates(name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;
      setRequests(requestsData || []);

      // 4. Get available templates for quick actions
      const { data: templatesData } = await supabase
        .from('letter_templates')
        .select('id, name')
        .eq('is_active', true)
        .limit(5);
      
      setTemplates(templatesData || []);

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast.error("Gagal memuat data: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusCount = (status: RequestStatus | 'all') => {
    if (status === 'all') return requests.length;
    if (status === 'pending') {
      return requests.filter(r => r.status === 'pending' || r.status === 'verifying').length;
    }
    return requests.filter(r => r.status === status).length;
  };

  const stats = [
    { label: 'Total Pengajuan', value: getStatusCount('all'), icon: IconFileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Menunggu', value: getStatusCount('pending'), icon: IconClock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Disetujui', value: requests.filter(r => r.status === 'done').length, icon: IconCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Ditolak', value: requests.filter(r => r.status === 'rejected').length, icon: IconX, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  const latestRequest = requests[0];

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <IconLoader2 className="h-10 w-10 animate-spin text-indigo-600" />
          <p className="text-slate-500 font-medium">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Welcome Section */}
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Selamat Datang, {userProfile?.name || 'Mahasiswa'} 👋
        </h2>
        <p className="text-slate-500 text-lg">Pantau dan kelola pengajuan surat akademik Anda di sini.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-none shadow-lg bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">{stat.label}</CardTitle>
                <div className={cn("p-2 rounded-xl", stat.bg)}>
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Latest Request Progress */}
        <Card className="lg:col-span-4 border-none shadow-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <IconFileText size={160} />
          </div>
          <CardHeader>
            <CardTitle>Status Pengajuan Terbaru</CardTitle>
            <CardDescription>Progress visual pengajuan surat terakhir Anda</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 relative">
            {latestRequest ? (
              <div className="space-y-10">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {latestRequest.letter_templates?.name || latestRequest.type}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      Diajukan pada {new Date(latestRequest.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <StatusBadge status={latestRequest.status} />
                </div>
                <div className="py-2">
                  <TimelineStepper currentStatus={latestRequest.status} />
                </div>
                <div className="flex justify-end items-center space-x-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Terakhir diperbarui: {new Date(latestRequest.updated_at).toLocaleTimeString('id-ID')} WIB</p>
                  <Link href={`/mahasiswa/letters/${latestRequest.id}`}>
                    <Button variant="default" className="rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none">
                      Lihat Detail
                      <IconArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="p-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-300">
                  <IconFileText size={48} stroke={1.5} />
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Belum ada pengajuan aktif.</p>
                  <p className="text-slate-400 text-sm">Klik tombol "Ajukan Surat Baru" untuk memulai.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-3 border-none shadow-xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Butuh surat baru?</CardTitle>
            <CardDescription>Pilih jenis surat untuk memulai pengajuan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2">
              {templates.length > 0 ? templates.map((template, idx) => (
                <Button 
                  key={template.id} 
                  asChild 
                  className="w-full justify-start text-left font-semibold h-14 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all border-slate-100 dark:border-slate-800 rounded-2xl group" 
                  variant="outline"
                >
                  <Link href={`/mahasiswa/request?template=${template.id}`}>
                    <div className={cn(
                      "p-2 rounded-xl mr-3 group-hover:scale-110 transition-transform", 
                      idx % 2 === 0 ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"
                    )}>
                      <IconFilePlus className="h-5 w-5" />
                    </div>
                    <span>{template.name}</span>
                  </Link>
                </Button>
              )) : (
                <Button asChild className="w-full justify-start text-left font-normal h-12" variant="outline">
                  <Link href="/mahasiswa/request">
                    <div className="p-1.5 rounded mr-3 bg-blue-50 text-blue-600">
                      <IconFilePlus className="h-4 w-4" />
                    </div>
                    <span>Ajukan Surat Baru</span>
                  </Link>
                </Button>
              )}
              {templates.length > 0 && (
                <Link href="/mahasiswa/request" className="text-center py-2">
                  <span className="text-xs font-bold text-indigo-600 hover:underline">Lihat Semua Kategori</span>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Requests Table/List */}
      <Card id="my-letters" className="border-none shadow-2xl overflow-hidden rounded-3xl bg-white dark:bg-slate-900">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <CardTitle className="text-xl">Riwayat Pengajuan Surat</CardTitle>
            <CardDescription>Daftar semua surat yang telah Anda ajukan</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-slate-50/50 dark:bg-slate-800/30 border-b text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                <tr>
                  <th className="h-14 px-6 text-left">Jenis Surat</th>
                  <th className="h-14 px-6 text-left">Status</th>
                  <th className="h-14 px-6 text-left">Tanggal Pengajuan</th>
                  <th className="h-14 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-200 group">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                          {request.letter_templates?.name || request.type}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 mt-0.5">ID: {request.id.slice(0, 8)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-6 py-5 text-slate-500 font-medium">
                      {new Date(request.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end space-x-2">
                        {request.status === 'done' && request.letter_url && (
                          <Button size="icon" variant="ghost" className="h-9 w-9 text-indigo-600 hover:bg-indigo-50 rounded-full">
                            <IconDownload size={20} />
                          </Button>
                        )}
                        <Link href={`/mahasiswa/letters/${request.id}`}>
                          <Button size="sm" variant="outline" className="h-9 px-4 rounded-full border-slate-200 hover:bg-slate-100 group-hover:border-indigo-200 transition-all">Detail</Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-20 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <IconFileText size={48} className="opacity-10" />
                        <p className="text-lg">Belum ada riwayat pengajuan</p>
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

