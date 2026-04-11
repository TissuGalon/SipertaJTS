"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { 
  IconSearch, 
  IconFilter, 
  IconDownload, 
  IconFileText, 
  IconClock, 
  IconCheck, 
  IconX,
  IconLoader2,
  IconArrowsSort,
  IconCalendar,
  IconChevronRight
} from '@tabler/icons-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function HistoryPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    fetchHistory();
    fetchTemplates();
  }, []);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('letter_requests')
        .select('*, letter_templates(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      toast.error("Gagal memuat riwayat: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTemplates = async () => {
    const { data } = await supabase.from('letter_templates').select('id, name');
    setTemplates(data || []);
  };

  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending' || r.status === 'verifying').length,
      done: requests.filter(r => r.status === 'done').length,
      rejected: requests.filter(r => r.status === 'rejected').length
    };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const matchesSearch = 
        (req.letter_templates?.name || req.type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' 
        ? true 
        : statusFilter === 'pending' 
          ? (req.status === 'pending' || req.status === 'verifying')
          : req.status === statusFilter;
      
      const matchesTemplate = templateFilter === 'all' 
        ? true 
        : req.template_id === templateFilter;

      return matchesSearch && matchesStatus && matchesTemplate;
    });
  }, [requests, searchQuery, statusFilter, templateFilter]);

  const handleDownload = (request: any) => {
    if (!request.letter_url) {
      toast.error("Surat belum tersedia.");
      return;
    }
    window.open(request.letter_url, '_blank');
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Riwayat Pengajuan</h2>
          <p className="text-slate-500 font-medium">Pantau dan kelola semua permohonan surat Anda di sini.</p>
        </div>
        <Link href="/mahasiswa/request">
          <Button className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 px-6 font-bold h-12 transition-all hover:scale-105 active:scale-95">
            Ajukan Surat Baru
          </Button>
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total', value: stats.total, icon: IconFileText, color: 'indigo', lightBg: 'bg-indigo-50', darkBg: 'dark:bg-indigo-900/20', textColor: 'text-indigo-600' },
          { label: 'Proses', value: stats.pending, icon: IconClock, color: 'amber', lightBg: 'bg-amber-50', darkBg: 'dark:bg-amber-900/20', textColor: 'text-amber-600' },
          { label: 'Selesai', value: stats.done, icon: IconCheck, color: 'emerald', lightBg: 'bg-emerald-50', darkBg: 'dark:bg-emerald-900/20', textColor: 'text-emerald-600' },
          { label: 'Ditolak', value: stats.rejected, icon: IconX, color: 'rose', lightBg: 'bg-rose-50', darkBg: 'dark:bg-rose-900/20', textColor: 'text-rose-600' },
        ].map((item) => (
          <Card key={item.label} className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900 group hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6 flex items-center space-x-4">
              <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110 duration-300", item.lightBg, item.darkBg, item.textColor)}>
                <item.icon size={26} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{item.label}</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white leading-none">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden min-h-[500px]">
        <CardHeader className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30">
          <div className="flex flex-col space-y-6">
            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative group">
                <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                <Input 
                  placeholder="Cari ID atau Jenis Surat..." 
                  className="pl-12 h-12 rounded-2xl border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 font-medium transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select value={templateFilter} onValueChange={setTemplateFilter}>
                <SelectTrigger className="h-12 rounded-2xl border-slate-200 dark:border-slate-800 font-medium focus:ring-4 focus:ring-indigo-500/10">
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl shadow-2xl border-slate-100">
                  <SelectItem value="all" className="rounded-xl m-1">Semua Kategori</SelectItem>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id} className="rounded-xl m-1">{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <Button variant="outline" className="flex-1 h-12 rounded-2xl border-slate-200 dark:border-slate-800 font-bold hover:bg-slate-50">
                  <IconCalendar className="mr-2" size={18} />
                  Pilih Tanggal
                </Button>
                <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-slate-200 dark:border-slate-800 hover:bg-slate-50">
                  <IconArrowsSort size={20} className="text-slate-500" />
                </Button>
              </div>
            </div>

            {/* Status Tabs */}
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
              <TabsList className="bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl h-14 w-full md:w-auto grid grid-cols-4 md:flex backdrop-blur-sm">
                <TabsTrigger value="all" className="rounded-xl px-6 font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-lg transition-all">Semua</TabsTrigger>
                <TabsTrigger value="pending" className="rounded-xl px-6 font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-lg text-amber-600 transition-all">Proses</TabsTrigger>
                <TabsTrigger value="done" className="rounded-xl px-6 font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-lg text-emerald-600 transition-all">Selesai</TabsTrigger>
                <TabsTrigger value="rejected" className="rounded-xl px-6 font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-lg text-rose-600 transition-all">Ditolak</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-50 dark:border-slate-800 text-[10px] uppercase font-black tracking-widest text-slate-400 bg-slate-50/10">
                  <th className="px-8 py-5 text-left">Informasi Surat</th>
                  <th className="px-8 py-5 text-left">Status</th>
                  <th className="px-8 py-5 text-left">Tanggal Kirim</th>
                  <th className="px-8 py-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                <AnimatePresence mode="popLayout">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="p-20 text-center">
                        <IconLoader2 className="animate-spin h-10 w-10 text-indigo-600 mx-auto" />
                        <p className="mt-4 text-slate-500 font-bold">Memperbarui Riwayat...</p>
                      </td>
                    </tr>
                  ) : filteredRequests.length > 0 ? (
                    filteredRequests.map((req, idx) => (
                      <motion.tr 
                        key={req.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-all duration-200"
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-indigo-600 group-hover:scale-110 group-hover:bg-indigo-50 transition-all shadow-sm">
                              <IconFileText size={24} />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 dark:text-white text-base leading-tight group-hover:text-indigo-600 transition-colors">
                                {req.letter_templates?.name || req.type}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-tighter mt-1">
                                ID: {req.id.slice(0, 18).toUpperCase()}...
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <StatusBadge status={req.status} className="px-4 h-7 text-[10px] font-black uppercase rounded-full shadow-sm" />
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-700 dark:text-slate-300">
                              {new Date(req.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(req.created_at).toLocaleTimeString('id-ID')} WIB</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end items-center space-x-3">
                            {req.status === 'done' && (
                              <Button 
                                size="icon" 
                                variant="outline" 
                                onClick={() => handleDownload(req)}
                                className="h-10 w-10 text-emerald-600 hover:bg-emerald-600 hover:text-white border-slate-100 rounded-xl shadow-sm hover:scale-110 transition-all active:scale-90"
                                title="Unduh Surat"
                              >
                                <IconDownload size={18} />
                              </Button>
                            )}
                            <Link href={`/mahasiswa/letters/${req.id}`}>
                              <Button variant="ghost" className="h-10 px-4 rounded-xl font-black text-xs uppercase tracking-widest group/btn hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                                Detail
                                <IconChevronRight size={16} className="ml-1 group-hover/btn:translate-x-1 transition-transform" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-32 text-center text-slate-400">
                        <div className="flex flex-col items-center">
                          <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="mb-8 p-12 bg-slate-50 dark:bg-slate-800 rounded-full shadow-inner"
                          >
                            <IconFileText size={80} stroke={1} className="opacity-10" />
                          </motion.div>
                          <h4 className="text-2xl font-black text-slate-900 dark:text-white">Riwayat Kosong</h4>
                          <p className="text-sm font-medium mt-2 max-w-xs mx-auto">Kami tidak menemukan data pengajuan yang sesuai dengan kriteria filter Anda.</p>
                          {(searchQuery || statusFilter !== 'all' || templateFilter !== 'all') && (
                            <Button 
                              variant="outline" 
                              className="mt-8 rounded-2xl border-indigo-200 text-indigo-600 font-black h-12 px-8 hover:bg-indigo-50 transition-all"
                              onClick={() => {
                                setSearchQuery('');
                                setStatusFilter('all');
                                setTemplateFilter('all');
                              }}
                            >
                              Tampilkan Semua Data
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
