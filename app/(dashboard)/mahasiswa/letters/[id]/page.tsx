"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  IconArrowLeft,
  IconDownload,
  IconFileDescription,
  IconMessageCircle,
  IconCalendarEvent,
  IconClock,
  IconLoader2,
  IconFileText,
  IconPlus,
  IconUpload,
  IconCheck
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';

export default function LetterDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      fetchRequestDetail();
    }
  }, [id]);

  const fetchRequestDetail = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('letter_requests')
        .select(`
          *,
          letter_templates(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setRequest(data);

      // Extract files from the new 'files' column (JSONB array)
      if (data.files && Array.isArray(data.files)) {
        const fileList = data.files.map((file: any) => {
          const { data: { publicUrl } } = supabase.storage
            .from('letter_attachments')
            .getPublicUrl(file.path);
          
          return {
            ...file,
            url: publicUrl
          };
        });
        setAttachments(fileList);
      } else if (data.attachments && typeof data.attachments === 'object') {
        // Fallback for legacy data structure
        const fileList = Object.entries(data.attachments).map(([key, path]) => {
          const fileName = (path as string).split('/').pop() || key;
          const { data: { publicUrl } } = supabase.storage
            .from('letter_attachments')
            .getPublicUrl(path as string);
          
          return {
            name: key,
            fileName: fileName,
            url: publicUrl
          };
        });
        setAttachments(fileList);
      }

    } catch (error: any) {
      console.error('Error fetching request detail:', error);
      toast.error("Gagal memuat detail pengajuan: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string, label: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const filePath = `requests/${id}/${fieldName}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('letter_attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const newFile = {
        name: label,
        path: filePath,
        fileName: file.name,
        fieldName: fieldName,
        requirementId: fieldName.startsWith('req_') ? fieldName.replace('req_', '') : null,
        size: file.size,
        type: file.type
      };

      const existingIdx = (request.files || []).findIndex((f: any) => 
        (f.fieldName === fieldName && fieldName) || 
        (f.requirementId === newFile.requirementId && newFile.requirementId)
      );
      let updatedFiles = [...(request.files || [])];
      
      if (existingIdx !== -1) {
        updatedFiles[existingIdx] = newFile;
      } else {
        updatedFiles.push(newFile);
      }

      const { error: updateError } = await supabase
        .from('letter_requests')
        .update({ 
          files: updatedFiles,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      toast.success(`Berhasil mengunggah ${label}`);
      fetchRequestDetail();
    } catch (error: any) {
      toast.error("Gagal mengunggah berkas: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <IconLoader2 className="h-10 w-10 animate-spin text-indigo-600" />
          <p className="text-slate-500 font-medium">Memuat detail pengajuan...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
          <IconFileText size={48} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Pengajuan Tidak Ditemukan</h2>
        <p className="text-slate-500">ID pengajuan "{id}" tidak dapat ditemukan atau Anda tidak memiliki akses.</p>
        <Button onClick={() => router.push('/mahasiswa/dashboard')} className="rounded-full">
          Kembali ke Dashboard
        </Button>
      </div>
    );
  }

  // Get dynamic fields labels from template
  const detailEntries = Object.entries(request.details || {}).map(([key, value]) => {
    const templateField = request.letter_templates?.fields?.find((f: any) => f.name === key);
    return {
      label: templateField?.label || key.replace(/([A-Z])/g, ' $1').trim(),
      value: value as string
    };
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link href="/mahasiswa/dashboard">
            <Button variant="ghost" size="icon" className="rounded-full bg-white dark:bg-slate-900 shadow-sm">
              <IconArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {request.letter_templates?.name || request.type}
            </h2>
            <div className="flex items-center space-x-2 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
              <span>ID: {request.id.slice(0, 18)}...</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {request.status === 'done' && request.letter_url && (
            <Button asChild className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/20 border-none transition-all hover:scale-105 active:scale-95">
              <a href={request.letter_url} target="_blank" rel="noopener noreferrer">
                <IconDownload size={18} className="mr-2" />
                Unduh Surat
              </a>
            </Button>
          )}
          <StatusBadge status={request.status} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Status Timeline */}
          <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-lg">Status Pengajuan</CardTitle>
            </CardHeader>
            <CardContent className="py-10">
              <TimelineStepper currentStatus={request.status} />
            </CardContent>
          </Card>

          {/* Details */}
          <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
            <CardHeader className="flex flex-row items-center space-x-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30">
                <IconFileDescription size={20} />
              </div>
              <CardTitle className="text-lg">Rincian Data Pengajuan</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <dl className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                {detailEntries.length > 0 ? detailEntries.map((entry, idx) => (
                  <div key={idx} className="space-y-1 group">
                    <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-500 transition-colors">
                      {entry.label}
                    </dt>
                    <dd className="text-sm font-bold text-slate-900 dark:text-white">{entry.value || '-'}</dd>
                  </div>
                )) : (
                  <div className="col-span-2 py-4 text-center text-slate-400 italic text-sm">
                    Tidak ada rincian data khusus.
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Uploaded Files */}
          <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Berkas Lampiran</CardTitle>
              <div className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase">
                {attachments.length} Berkas
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid gap-3">
                {attachments.map((file, i) => (
                  <div key={i} className="flex items-center justify-between rounded-2xl border border-slate-100 p-4 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 group hover:border-indigo-200 transition-all">
                    <div className="flex items-center space-x-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-slate-800 text-slate-500 shadow-sm group-hover:text-indigo-600 transition-colors">
                        <IconFileDescription size={22} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{file.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono italic">{file.fileName}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild className="rounded-full text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold px-4">
                      <a href={file.url} target="_blank" rel="noopener noreferrer">Pratinjau</a>
                    </Button>
                  </div>
                ))}
              </div>

              {/* Missing Requirements / Upload Nyusul */}
              {request.status !== 'done' && request.status !== 'rejected' && (
                <div className="space-y-4 pt-4 border-t border-dashed">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Upload Berkas Susulan</h4>
                  <div className="grid gap-4">
                    {[
                      ...(request.letter_templates?.fields?.filter((f: any) => f.type === 'file') || []),
                      ...(request.letter_templates?.requirements?.map((r: any) => ({ 
                        ...r, 
                        name: `req_${r.id}`, 
                        label: r.label, 
                        isRequirement: true,
                        requirementId: r.id 
                      })) || [])
                    ].map((field: any) => {
                        const isUploaded = request.files?.some((f: any) => 
                          f.fieldName === field.name || f.requirementId === field.requirementId
                        );

                        return (
                          <div key={field.name} className="relative group p-4 rounded-2xl border-2 border-slate-50 dark:border-slate-800/50 bg-slate-50/20">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex flex-col">
                                <Label className="text-xs font-black text-slate-700 dark:text-slate-200">{field.label}</Label>
                                {field.description && <p className="text-[10px] text-slate-400 mt-0.5">{field.description}</p>}
                              </div>
                              {isUploaded && (
                                <div className="flex items-center px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 text-[9px] font-black uppercase">
                                  <IconCheck size={10} className="mr-1" /> Terunggah
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 relative">
                                <Input 
                                  type="file" 
                                  disabled={isUploading}
                                  onChange={(e) => handleFileUpload(e, field.name, field.label)}
                                  className={cn(
                                    "h-11 rounded-xl border-dashed border-2 bg-white dark:bg-slate-900 file:hidden pr-10 cursor-pointer transition-all",
                                    isUploaded ? "border-emerald-200/50 hover:border-emerald-400" : "border-slate-200 hover:border-indigo-300"
                                  )}
                                />
                                <IconUpload className={cn(
                                  "absolute right-4 top-3 h-5 w-5 pointer-events-none transition-colors",
                                  isUploaded ? "text-emerald-400" : "text-slate-300"
                                )} />
                              </div>
                            </div>
                            {isUploaded && (
                              <p className="mt-2 text-[9px] text-slate-400 font-medium italic">
                                * Klik untuk mengganti berkas yang sudah ada.
                              </p>
                            )}
                          </div>
                        );
                      })}
                    
                    {!([
                      ...(request.letter_templates?.fields?.filter((f: any) => f.type === 'file') || []),
                      ...(request.letter_templates?.requirements || [])
                    ].filter((f: any) => !request.files?.some((uf: any) => uf.fieldName === f.name || uf.requirementId === (f.id || f.requirementId))).length) && (
                      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-3 text-emerald-600 shadow-sm">
                        <IconCheck className="h-5 w-5" />
                        <span className="text-xs font-black uppercase tracking-wider">Semua persyaratan pengajuan telah terpenuhi</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Info Side Card */}
          <Card className="border-none shadow-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-3xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <IconCalendarEvent size={80} />
            </div>
            <CardHeader>
              <CardTitle className="text-base text-white/90">Info Pengajuan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 relative">
              <div className="flex items-center space-x-4">
                <div className="p-2 rounded-xl bg-white/10">
                  <IconCalendarEvent size={20} className="text-white/80" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-white/60">Dikirim pada</p>
                  <p className="font-bold text-sm">{new Date(request.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="p-2 rounded-xl bg-white/10">
                  <IconClock size={20} className="text-white/80" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-white/60">Update terakhir</p>
                  <p className="font-bold text-sm">{new Date(request.updated_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Notes */}
          <Card className={cn(
            "border-none shadow-2xl rounded-3xl overflow-hidden transition-all duration-500", 
            request.rejection_reason || request.admin_notes ? "bg-amber-50 dark:bg-amber-900/10 ring-2 ring-amber-200/50 dark:ring-amber-900/50" : "bg-white dark:bg-slate-900"
          )}>
            <CardHeader className="flex flex-row items-center space-x-3 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
              <div className={cn("p-2 rounded-xl", request.rejection_reason || request.admin_notes ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400")}>
                <IconMessageCircle size={20} />
              </div>
              <CardTitle className="text-base text-inherit">Catatan Admin</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {request.status === 'rejected' && request.rejection_reason && (
                <div className="mb-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-1">Alasan Penolakan:</p>
                  <p className="text-sm font-bold text-rose-600 dark:text-rose-400 leading-relaxed">
                    {request.rejection_reason}
                  </p>
                </div>
              )}
              <p className="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                {request.admin_notes || (!request.rejection_reason && "Tidak ada catatan dari administrator.")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
