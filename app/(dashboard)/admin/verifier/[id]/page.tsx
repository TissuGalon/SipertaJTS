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
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';

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
        .select('*, users(name, nim), letter_templates(*)')
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

  const handleDownload = async () => {
    if (!request.letter_templates?.file_path) {
      toast.error("Template berkas tidak ditemukan untuk jenis surat ini");
      return;
    }

    try {
      setIsProcessing(true);
      const { data, error } = await supabase.storage
        .from('letter_templates')
        .download(request.letter_templates.file_path);

      if (error) throw error;

      const arrayBuffer = await data.arrayBuffer();
      const zip = new PizZip(arrayBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: '{{', end: '}}' }
      });

      // Prepare data for template
      // Combine user info and request details
      const templateData = {
        ...request.details,
        Nama: request.users?.name,
        NIM: request.users?.nim,
        NomorSurat: letterNumber,
        TahunAkademik: academicYear,
        Tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      };

      doc.render(templateData);

      const out = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      saveAs(out, `${request.letter_templates.name}_${request.users?.nim}.docx`);
      toast.success("Dokumen berhasil diunduh");
    } catch (error: any) {
      console.error('Error downloading document:', error);
      toast.error("Gagal menjenerate dokumen: " + (error.message || "Unknown error"));
    } finally {
      setIsProcessing(false);
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
    <div className="h-full flex flex-col space-y-6 print:space-y-0 print:p-0">
      <div className="flex items-center justify-between print:hidden">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden print:block print:w-full">
        {/* Left: Document Preview */}
        <Card className="flex flex-col h-full bg-slate-100/50 dark:bg-slate-900/50 overflow-hidden print:bg-white print:border-none print:shadow-none print:h-auto print:w-full">
          <CardHeader className="bg-white dark:bg-slate-900 border-b py-3 print:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <IconFileText size={18} className="text-blue-600" />
                <span className="text-sm font-semibold truncate max-w-[200px]">
                  {request.letter_templates?.name || 'Dokumen Surat'}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-[10px] font-bold uppercase"
                  onClick={handleDownload}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Download .DOCX'}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => {
                    // Logic to open/print
                    window.print();
                  }}
                >
                  <IconExternalLink size={16} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center p-0 overflow-hidden print:overflow-visible">
            {/* Dynamic Document Preview */}
            <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center p-4 sm:p-8 overflow-y-auto print:bg-white print:p-0 print:overflow-visible">
              <div className="w-full max-w-lg min-h-[141%] bg-white dark:bg-slate-950 shadow-2xl rounded p-6 sm:p-12 space-y-6 sm:space-y-8 animate-in zoom-in-95 duration-500 scale-[0.8] sm:scale-100 origin-top print:shadow-none print:scale-100 print:p-0 print:min-h-0 print:animate-none">
                {/* Letter Header */}
                <div className="flex flex-col items-center border-b-2 border-slate-900 pb-4 text-center">
                  <div className="h-16 w-16 bg-slate-100 dark:bg-slate-900 rounded-full mb-4 flex items-center justify-center">
                    <IconSchool className="text-indigo-600" size={32} />
                  </div>
                  <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white leading-tight">
                    KEMENTERIAN PENDIDIKAN, KEBUDAYAAN,<br />RISET, DAN TEKNOLOGI
                  </h3>
                  <p className="text-[9px] sm:text-[10px] font-bold text-slate-900 mt-1 uppercase">
                    UNIVERSITAS TEKNOLOGI INFORMASI - FAKULTAS TEKNIK
                  </p>
                  <p className="text-[8px] text-slate-500 mt-1 italic">
                    Jl. Teknologi No. 123, Kampus Terpadu, Semarang 50123
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Letter Title & Number */}
                  <div className="text-center space-y-1">
                    <h4 className="font-bold underline uppercase decoration-1 underline-offset-4 text-sm sm:text-base">
                      {request.letter_templates?.name || (LETTER_TYPE_LABELS[request.type as keyof typeof LETTER_TYPE_LABELS] || "SURAT KETERANGAN")}
                    </h4>
                    <p className="text-[10px] font-medium">
                      Nomor: {letterNumber || "..../..../..../...."}
                    </p>
                  </div>

                  {/* Letter Body */}
                  <div className="text-[11px] sm:text-xs text-justify leading-loose space-y-4">
                    <p>
                      Yang bertanda tangan di bawah ini, Pimpinan Fakultas Teknik Universitas Teknologi Informasi menerangkan bahwa:
                    </p>
                    
                    <div className="ml-8 space-y-2">
                      <div className="grid grid-cols-4 gap-2">
                        <span className="col-span-1">Nama</span>
                        <span className="col-span-3 font-bold">: {request.users?.name}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <span className="col-span-1">NIM</span>
                        <span className="col-span-3 font-bold">: {request.users?.nim}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <span className="col-span-1">Prodi</span>
                        <span className="col-span-3">: {request.details?.JurusanProdi || request.details?.prodi || request.details?.department || "Teknik Sipil"}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <span className="col-span-1">Semester</span>
                        <span className="col-span-3">: {request.details?.TingkatSemester || request.details?.semester || "-"}</span>
                      </div>
                    </div>

                    <p>
                      Adalah benar mahasiswa yang terdaftar aktif pada Fakultas Teknik Universitas Teknologi Informasi pada Tahun Akademik <b>{academicYear}</b>.
                    </p>

                    <p>
                      {request.details?.Keperluan || request.details?.purpose ? (
                        <>Surat ini diberikan untuk keperluan: <b>{request.details.Keperluan || request.details.purpose}</b>.</>
                      ) : (
                        "Demikian surat keterangan ini diberikan untuk dapat dipergunakan sebagaimana mestinya."
                      )}
                    </p>
                  </div>

                  {/* All Other Details Grid */}
                  {Object.entries(request.details).filter(([k]) => !['Nama', 'NIM', 'JurusanProdi', 'TingkatSemester', 'Keperluan', 'name', 'nim', 'prodi', 'semester', 'purpose'].includes(k)).length > 0 && (
                    <div className="pt-4 border-t border-dashed border-slate-200">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Informasi Tambahan:</p>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[10px]">
                        {Object.entries(request.details)
                          .filter(([k]) => !['Nama', 'NIM', 'JurusanProdi', 'TingkatSemester', 'Keperluan', 'name', 'nim', 'prodi', 'semester', 'purpose'].includes(k))
                          .map(([key, value]) => (
                          <div key={key} className="flex justify-between border-b border-slate-50 pb-1">
                            <span className="text-slate-500">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                            <span className="font-medium text-right">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Signature Area */}
                <div className="pt-8 flex justify-end">
                  <div className="text-center min-w-[180px]">
                    <p className="text-[10px] mb-16">
                      Semarang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-[10px] font-bold border-t border-slate-900 pt-1">
                      Kepala Bagian Administrasi
                    </p>
                    <p className="text-[9px] text-slate-500">NIP. 19750812 200003 1 002</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-white dark:bg-slate-900 border-t py-2 justify-center print:hidden">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Live Document Preview</span>
          </CardFooter>
        </Card>

        {/* Right: Info & Actions */}
        <div className="space-y-6 overflow-y-auto print:hidden">
          {/* Student Info */}
          <Card>
            <CardHeader className="flex flex-row items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 flex items-center justify-center">
                <IconUser size={20} />
              </div>
              <div>
                <CardTitle>{request.users?.name || 'Unknown'}</CardTitle>
                <CardDescription>
                  NIM: {request.users?.nim || '-'} • {request.letter_templates?.name || (LETTER_TYPE_LABELS[request.type as keyof typeof LETTER_TYPE_LABELS] || request.type)}
                </CardDescription>
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
                <div className="space-y-2">
                  <Label htmlFor="letterNumber">Nomor Surat</Label>
                  <Input 
                    id="letterNumber" 
                    placeholder="Contoh: 123/UN/AK/2024" 
                    value={letterNumber}
                    onChange={(e) => setLetterNumber(e.target.value)}
                  />
                </div>
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
