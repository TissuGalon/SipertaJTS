"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { DynamicForm } from '@/components/forms/dynamic-form';
import { letterConfigs } from '@/lib/letter-configs';
import { supabase } from '@/lib/supabase';
import { LETTER_TYPE_LABELS, LetterType } from '@/types';
import { toast } from 'sonner';
import { IconArrowLeft, IconFilePlus, IconLoader2 } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function RequestLetterPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<LetterType | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Sesi Anda telah berakhir, silakan login kembali.");
        router.push('/login');
        return;
      }

      // Handle file uploads
      const uploadedFiles: any[] = [];
      const cleanedDetails = { ...data };

      // Look for files in the data object
      for (const key in data) {
        const value = data[key];
        if (Array.isArray(value) && value.length > 0 && value[0] instanceof File) {
          // It's a file array from FileUpload
          for (const file of value as File[]) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('letter_attachments')
              .upload(filePath, file);

            if (uploadError) {
              console.error('Upload error:', uploadError);
              throw new Error(`Gagal mengunggah file: ${file.name}`);
            }

            uploadedFiles.push({
              name: file.name,
              path: filePath,
              size: file.size,
              type: file.type,
              fieldName: key
            });
          }
          // Remove file objects from details to keep it clean
          delete cleanedDetails[key];
        }
      }

      // Insert request
      const { error } = await supabase
        .from('letter_requests')
        .insert({
          user_id: user.id,
          type: selectedType,
          details: cleanedDetails,
          files: uploadedFiles,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success("Pengajuan berhasil dikirim!");
      
      router.push('/mahasiswa/dashboard');
    } catch (error: any) {
      console.error('Error submitting request:', error);
      toast.error(error.message || "Gagal mengirim pengajuan, silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/mahasiswa/dashboard">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-white transition-colors">
            <IconArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Ajukan Surat Baru</h2>
          <p className="text-sm text-slate-500">Lengkapi detail di bawah ini untuk mengajukan surat akademik.</p>
        </div>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle>Pilih Jenis Surat</CardTitle>
          <CardDescription>Pilih jenis surat yang ingin Anda ajukan</CardDescription>
        </CardHeader>
        <CardContent>
          <Select onValueChange={(v: any) => setSelectedType(v)}>
            <SelectTrigger className="w-full h-12 bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800">
              <SelectValue placeholder="Pilih jenis surat..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LETTER_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedType && (
        <Card className="border-none shadow-xl animate-in fade-in slide-in-from-top-4 duration-500">
          <CardHeader className="flex flex-row items-center space-x-3 border-b border-slate-50 dark:border-slate-800 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30">
              <IconFilePlus size={24} />
            </div>
            <div>
              <CardTitle className="text-xl">{LETTER_TYPE_LABELS[selectedType as LetterType]}</CardTitle>
              <CardDescription>Mohon lengkapi informasi berikut dengan benar</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <DynamicForm 
              fields={letterConfigs[selectedType]} 
              onSubmit={handleSubmit}
              isLoading={isSubmitting}
              submitLabel="Kirim Pengajuan" 
            />
          </CardContent>
        </Card>
      )}

      {!selectedType && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center text-slate-400 dark:border-slate-800">
          <IconFilePlus size={64} stroke={1} className="mb-4 opacity-10" />
          <p className="text-lg">Silakan pilih jenis surat di atas untuk melanjutkan</p>
        </div>
      )}
    </div>
  );
}
