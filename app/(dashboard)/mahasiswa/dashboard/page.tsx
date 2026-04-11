"use client";

export const dynamic = 'force-dynamic';


import React, { useState, useEffect, useMemo } from 'react';
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
  IconLoader2,
  IconSearch,
  IconSchool,
  IconId,
  IconFilter
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { RequestStatus } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
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
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData, error: profileError } = await supabase
        .from('mahasiswa')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      
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

      const { data: templatesData } = await supabase
        .from('letter_templates')
        .select('id, name, description')
        .eq('is_active', true)
        .limit(6);
      
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
    { label: 'Total Pengajuan', value: getStatusCount('all'), icon: IconFileText, color: 'text-blue-600', bg: 'bg-blue-100', shadow: 'shadow-blue-500/20' },
    { label: 'Sedang Diproses', value: getStatusCount('pending'), icon: IconClock, color: 'text-amber-600', bg: 'bg-amber-100', shadow: 'shadow-amber-500/20' },
    { label: 'Selesai', value: requests.filter(r => r.status === 'done').length, icon: IconCheck, color: 'text-emerald-600', bg: 'bg-emerald-100', shadow: 'shadow-emerald-500/20' },
    { label: 'Ditolak', value: requests.filter(r => r.status === 'rejected').length, icon: IconX, color: 'text-rose-600', bg: 'bg-rose-100', shadow: 'shadow-rose-500/20' },
  ];

  const latestRequest = requests[0];

  const handleDownload = (request: any) => {
    if (!request.letter_url) {
      toast.error("Surat belum tersedia untuk diunduh.");
      return;
    }
    window.open(request.letter_url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="h-20 w-20 rounded-full border-4 border-indigo-50 dark:border-slate-800" />
            <IconLoader2 className="absolute inset-0 m-auto h-10 w-10 animate-spin text-indigo-600" />
          </div>
          <p className="text-slate-500 font-bold animate-pulse">Menyiapkan Dashboard Anda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Premium Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-indigo-700 via-violet-700 to-purple-800 p-8 md:p-12 text-white shadow-2xl"
      >
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-2 rounded-full bg-white/20 px-4 py-1.5 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span className="text-xs font-black uppercase tracking-widest text-white/90">Sistem Layanan Surat Online</span>
            </div>
            
            <div className="space-y-1">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                Halo, {userProfile?.name?.split(' ')[0] || 'Mahasiswa'}! 👋
              </h2>
              <p className="text-indigo-100 text-lg md:text-xl font-medium max-w-xl opacity-80">
                Selamat membangun masa depan. Mari urus keperluan akademikmu dengan lebih mudah dan cepat.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center space-x-2 text-sm bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-sm border border-white/10">
                <IconId size={18} className="text-indigo-300" />
                <span className="font-bold">{userProfile?.nim || '-'}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-sm border border-white/10">
                <IconSchool size={18} className="text-indigo-300" />
                <span className="font-bold">Teknik Informatika</span>
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
             <Link href="/mahasiswa/request">
              <Button size="lg" className="h-16 px-8 rounded-3xl bg-white text-indigo-700 hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-900/40 font-black text-lg">
                <IconFilePlus className="mr-3 h-6 w-6" />
                Ajukan Surat Baru
              </Button>
             </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="group relative border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden hover:shadow-2xl transition-all duration-300 rounded-[2rem]">
              <div className={cn("absolute top-0 right-0 p-6 opacity-[0.05] group-hover:scale-125 transition-transform duration-500", stat.color)}>
                <stat.icon size={80} />
              </div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("p-3 rounded-2xl", stat.bg, stat.color)}>
                    <stat.icon size={24} />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{stat.label}</p>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Latest Request Card */}
        <Card className="lg:col-span-8 border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden flex flex-col">
          <CardHeader className="p-8 border-b border-slate-50 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black text-slate-900 dark:text-white">Status Terkini</CardTitle>
                <CardDescription className="text-slate-500 font-medium mt-1">Lacak progres pengajuan terakhir Anda</CardDescription>
              </div>
              {latestRequest && (
                <StatusBadge status={latestRequest.status} className="h-8 px-4 text-xs font-bold uppercase rounded-full" />
              )}
            </div>
          </CardHeader>
          <CardContent className="p-8 flex-grow">
            {latestRequest ? (
              <div className="space-y-10">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-5">
                    <div className="h-14 w-14 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-indigo-600">
                      <IconFileText size={28} />
                    </div>
                    <div>
                      <p className="font-black text-xl text-slate-900 dark:text-white tracking-tight">
                        {latestRequest.letter_templates?.name || latestRequest.type}
                      </p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {latestRequest.id.split('-')[0].toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tanggal Pengajuan</p>
                    <p className="font-bold text-slate-700 dark:text-slate-300">{new Date(latestRequest.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>

                <div className="px-4">
                  <TimelineStepper currentStatus={latestRequest.status} />
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-slate-50 dark:border-slate-800">
                  <div className="flex items-center space-x-2">
                    <IconClock size={16} className="text-slate-400" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Update Terakhir: {new Date(latestRequest.updated_at).toLocaleTimeString('id-ID')} WIB</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Link href={`/mahasiswa/letters/${latestRequest.id}`}>
                      <Button variant="outline" className="rounded-2xl h-12 px-6 border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-all font-bold">
                        Detail Pengajuan
                      </Button>
                    </Link>
                    {latestRequest.status === 'done' && (
                      <Button onClick={() => handleDownload(latestRequest)} className="rounded-2xl h-12 px-6 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 font-bold">
                        <IconDownload size={20} className="mr-2" />
                        Unduh Hasil
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="p-8 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-200"
                >
                  <IconFileText size={64} stroke={1} />
                </motion.div>
                <div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white">Belum Ada Pengajuan</h4>
                  <p className="text-slate-400 text-sm mt-1 max-w-xs">Silakan ajukan permohonan surat pertamamu untuk melihat progresnya di sini.</p>
                </div>
                <Link href="/mahasiswa/request" className="pt-4">
                   <Button className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-8 py-6 font-bold h-12 transition-all">Mulai Pengajuan</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions / Categories */}
        <div className="lg:col-span-4 space-y-8">
           <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50 dark:border-slate-800">
              <CardTitle className="text-xl font-black text-slate-900 dark:text-white">Layanan Populer</CardTitle>
              <CardDescription className="text-slate-500 font-medium">Jenis surat yang paling sering diajukan</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              <div className="grid gap-3">
                {templates.map((template, idx) => (
                  <Button 
                    key={template.id} 
                    asChild 
                    className="w-full justify-start text-left font-bold h-16 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:scale-[1.02] transition-all border-slate-100 dark:border-slate-800 rounded-2xl group relative overflow-hidden" 
                    variant="outline"
                  >
                    <Link href={`/mahasiswa/request?template=${template.id}`}>
                      <div className={cn(
                        "p-2.5 rounded-xl mr-4 transition-all duration-300 shadow-sm", 
                        idx % 3 === 0 ? "bg-indigo-50 text-indigo-600" : 
                        idx % 3 === 1 ? "bg-emerald-50 text-emerald-600" : "bg-purple-50 text-purple-600"
                      )}>
                        <IconFilePlus size={22} className="group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-800 dark:text-slate-200">{template.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium line-clamp-1 opacity-70">{template.description || "Layanan pengajuan surat akdemik."}</span>
                      </div>
                      <IconArrowRight size={16} className="absolute right-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                    </Link>
                  </Button>
                ))}
                <Link href="/mahasiswa/request" className="flex items-center justify-center pt-2 group">
                  <span className="text-sm font-black text-indigo-600 group-hover:underline">Lihat Semua Layanan</span>
                  <IconArrowRight size={16} className="ml-1 text-indigo-600 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity Table */}
      <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-black text-slate-900 dark:text-white">Aktivitas Terkini</CardTitle>
              <CardDescription className="text-slate-500 font-medium">3 pengajuan surat terbaru Anda</CardDescription>
            </div>
            <Link href="/mahasiswa/history">
              <Button variant="outline" className="rounded-2xl border-slate-200 dark:border-slate-800 font-bold hover:bg-slate-50 transition-all">
                Lihat Semua
                <IconArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="overflow-x-auto rounded-3xl border border-slate-50 dark:border-slate-800">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/10 text-slate-400 font-black uppercase tracking-widest text-[10px]">
                  <th className="h-14 px-8 text-left">Jenis Surat</th>
                  <th className="h-14 px-8 text-left">Status</th>
                  <th className="h-14 px-8 text-left">Tanggal</th>
                  <th className="h-14 px-8 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                <AnimatePresence mode="popLayout">
                  {requests.slice(0, 3).map((request) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={request.id} 
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-all duration-200 group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-base group-hover:text-indigo-600 transition-colors">
                            {request.letter_templates?.name || request.type}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-tighter mt-1">ID: {request.id.slice(0, 8)}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <StatusBadge status={request.status} className="rounded-full px-4 h-7 text-[10px] font-black uppercase" />
                      </td>
                      <td className="px-8 py-6 text-slate-500 font-bold">
                        {new Date(request.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end items-center space-x-2">
                          <Link href={`/mahasiswa/letters/${request.id}`}>
                            <Button size="sm" variant="ghost" className="h-10 px-4 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 font-bold transition-all">
                              Detail
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-24 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="p-6 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-200">
                          <IconFileText size={48} stroke={1} />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-slate-900 dark:text-white">Belum Ada Pengajuan</p>
                          <p className="text-slate-400 text-sm">Gunakan tombol "Ajukan Surat Baru" untuk memulai.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {requests.length > 3 && (
            <div className="mt-6 flex justify-center">
               <Link href="/mahasiswa/history">
                <Button variant="link" className="text-indigo-600 font-black flex items-center group">
                  Lihat Seluruh Riwayat Pengajuan ({requests.length})
                  <IconArrowRight size={18} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

