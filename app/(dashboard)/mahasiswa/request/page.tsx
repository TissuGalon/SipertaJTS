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
import { LETTER_TYPE_LABELS, LetterType } from '@/types';
import { toast } from 'sonner';
import { IconArrowLeft, IconFilePlus } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function RequestLetterPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<LetterType | "">("");

  const handleSubmit = (data: any) => {
    console.log('Form data submitted:', data);
    toast.success("Pengajuan berhasil dikirim!");
    
    // Simulate redirect after successful submission
    setTimeout(() => {
      router.push('/mahasiswa/dashboard');
    }, 1500);
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
