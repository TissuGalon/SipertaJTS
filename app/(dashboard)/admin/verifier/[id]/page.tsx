"use client";

import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { useParams, useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { mockRequests } from '@/lib/mock-data';
import { StatusBadge } from '@/components/ui/status-badge';
import { 
  IconArrowLeft, 
  IconCheck, 
  IconX, 
  IconFileText,
  IconUser,
  IconInfoCircle,
  IconExternalLink,
  IconChevronLeft,
  IconChevronRight
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { LETTER_TYPE_LABELS, RequestStatus } from '@/types';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

export default function DocumentVerifierPage() {
  const { id } = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<any>(null);
  const [adjacentIds, setAdjacentIds] = useState<{ prev: string | null; next: string | null }>({ prev: null, next: null });
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [letterNumber, setLetterNumber] = useState("");
  const [academicYear, setAcademicYear] = useState("2023/2024");
  const [notes, setNotes] = useState("");

  React.useEffect(() => {
    if (id) {
      fetchRequest();
      fetchAdjacentIds();
    }
  }, [id]);

  const fetchAdjacentIds = async () => {
    try {
      // Simplistic way to get prev/next: order by created_at
      const { data: allIds } = await supabase
        .from('letter_requests')
        .select('id')
        .order('is_priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (allIds) {
        const curIdx = allIds.findIndex(r => r.id === id);
        setAdjacentIds({
          prev: curIdx > 0 ? allIds[curIdx - 1].id : null,
          next: curIdx < allIds.length - 1 ? allIds[curIdx + 1].id : null
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRequest = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('letter_requests')
        .select('*, users(name, nim)')
        .eq('id', id)
        .single();

      if (error) throw error;
      setRequest(data);
      setLetterNumber(data.letter_number || "");
      setAcademicYear(data.academic_year || "2023/2024");
      setNotes(data.admin_notes || "");
    } catch (error: any) {
      console.error('Error fetching request:', error);
      toast.error("Gagal mengambil data pengajuan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (status: 'done' | 'rejected') => {
    try {
      setIsProcessing(true);
      const { error } = await supabase
        .from('letter_requests')
        .update({
          status,
          admin_notes: notes,
          letter_number: letterNumber,
          academic_year: academicYear,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Permintaan berhasil ${status === 'done' ? 'disetujui' : 'ditolak'}`);
      router.push('/admin/permintaan');
    } catch (error: any) {
      console.error('Error updating request:', error);
      toast.error("Gagal memproses permintaan");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium tracking-tight">Memuat data pengajuan...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <h2 className="text-xl font-semibold">Pengajuan Tidak Ditemukan</h2>
        <Button onClick={() => router.push('/admin/permintaan')}>Kembali ke Daftar</Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="icon">
              <IconArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Verifikasi Dokumen</h2>
            <p className="text-sm text-slate-500">Tinjau dan validasi pengajuan surat mahasiswa</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="hidden sm:flex"
            disabled={!adjacentIds.prev}
            onClick={() => router.push(`/admin/verifier/${adjacentIds.prev}`)}
          >
            <IconChevronLeft size={16} className="mr-1" />
            Sebelumnya
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="hidden sm:flex"
            disabled={!adjacentIds.next}
            onClick={() => router.push(`/admin/verifier/${adjacentIds.next}`)}
          >
            Selanjutnya
            <IconChevronRight size={16} className="ml-1" />
          </Button>
          <StatusBadge status={request.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
        {/* Left: Document Preview */}
        <Card className="flex flex-col h-full bg-slate-100/50 dark:bg-slate-900/50 overflow-hidden">
          <CardHeader className="bg-white dark:bg-slate-900 border-b py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <IconFileText size={18} className="text-blue-600" />
                <span className="text-sm font-semibold truncate max-w-[200px]">
                  Lampiran: {request.files?.[0]?.name || 'Document.pdf'}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => {
                  if (request.files?.[0]?.url) window.open(request.files[0].url, '_blank');
                  else toast.info("Tidak ada file untuk dibuka");
                }}
              >
                <IconExternalLink size={16} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center p-0 overflow-hidden">
            {/* Mock PDF Viewer */}
            <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center p-8">
              <div className="w-full max-w-lg aspect-[1/1.4] bg-white dark:bg-slate-950 shadow-2xl rounded p-12 space-y-8 animate-in zoom-in-95 duration-500">
                <div className="flex flex-col items-center border-b pb-8 text-center">
                  <div className="h-16 w-16 bg-slate-100 dark:bg-slate-900 rounded-full mb-4 flex items-center justify-center">
                    <IconSchool className="text-indigo-600" size={32} />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">KEMENTERIAN PENDIDIKAN DAN KEBUDAYAAN</h3>
                  <p className="text-[10px] font-bold text-slate-600">UNIVERSITAS TEKNOLOGI INFORMASI</p>
                </div>
                <div className="space-y-4">
                  <h4 className="text-center font-bold underline uppercase decoration-slate-300">
                    {LETTER_TYPE_LABELS[request.type as keyof typeof LETTER_TYPE_LABELS] || "SURAT KETERANGAN"}
                  </h4>
                  <p className="text-[11px] text-justify leading-relaxed">
                    Yang bertanda tangan di bawah ini menerangkan bahwa mahasiswa dengan nama <b>{request.users?.name}</b>, 
                    NIM <b>{request.users?.nim}</b>, adalah benar terdaftar sebagai mahasiswa aktif pada semester ini 
                    Tahun Akademik <b>{academicYear}</b>.
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-[10px]">
                    {Object.entries(request.details).slice(0, 4).map(([key, value]) => (
                      <div key={key} className="border-b border-slate-100 pb-1">
                        <span className="text-slate-400 uppercase font-black">{key}:</span>
                        <span className="ml-2 font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-12 flex justify-end">
                  <div className="text-right">
                    <p className="text-[10px] mb-12">Semarang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <div className="h-0.5 w-40 bg-slate-200 mb-1 ml-auto"></div>
                    <p className="text-[10px] font-bold">Kepala Bagian Administrasi</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-white dark:bg-slate-900 border-t py-2 justify-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Document Preview Simulation</span>
          </CardFooter>
        </Card>

        {/* Right: Info & Actions */}
        <div className="space-y-6 overflow-y-auto">
          {/* Student Info */}
          <Card>
            <CardHeader className="flex flex-row items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 flex items-center justify-center">
                <IconUser size={20} />
              </div>
              <div>
                <CardTitle>{request.users?.name || 'Unknown'}</CardTitle>
                <CardDescription>NIM: {request.users?.nim || '-'} • {LETTER_TYPE_LABELS[request.type as keyof typeof LETTER_TYPE_LABELS]}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(request.details).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <p className="text-sm font-medium">{String(value)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Verification Form */}
          <Card className="border-indigo-100 dark:border-indigo-900/30 shadow-xl ring-1 ring-indigo-500/10">
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <IconInfoCircle size={18} className="mr-2 text-indigo-600" />
                Detail Administrasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status Saat Ini</Label>
                  <div className="h-10 flex items-center">
                    <StatusBadge status={request.status} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Tanggal Pengajuan</Label>
                  <div className="h-10 flex items-center text-sm font-medium">
                    {new Date(request.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {request.type === 'surat_magang' && (
                  <div className="space-y-2">
                    <Label htmlFor="letterNumber">Nomor Surat</Label>
                    <Input 
                      id="letterNumber" 
                      placeholder="Contoh: 123/UN/AK/2024" 
                      value={letterNumber}
                      onChange={(e) => setLetterNumber(e.target.value)}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="academicYear">Tahun Akademik</Label>
                  <Input 
                    id="academicYear" 
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Catatan untuk Mahasiswa</Label>
                <Textarea 
                  id="notes" 
                  placeholder="Opsional: Berikan feedback atau alasan penolakan..." 
                  className="min-h-[100px]"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex space-x-3 bg-slate-50/50 dark:bg-slate-900/50 p-6 border-t">
              <Button 
                variant="outline" 
                className="flex-1 text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900/30 dark:hover:bg-rose-900/20"
                onClick={() => handleAction('rejected')}
                disabled={isProcessing}
              >
                <IconX size={18} className="mr-2" />
                Tolak
              </Button>
              <Button 
                className="flex-[2] bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
                onClick={() => handleAction('done')}
                disabled={isProcessing}
              >
                <IconCheck size={18} className="mr-2" />
                Setujui & Proses
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Additional missing components from Shadcn for this page
function IconSchool({ className, size }: { className?: string, size?: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
    </svg>
  );
}
