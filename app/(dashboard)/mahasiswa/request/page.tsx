"use client";

import React, { useState, useEffect } from 'react';
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
import { supabase } from '@/lib/supabase';
import { FormFieldConfig } from '@/types';
import { toast } from 'sonner';
import { IconArrowLeft, IconFilePlus, IconLoader2, IconAlertCircle } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function RequestLetterPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoadingTemplates(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);

      // Fetch active templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('letter_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (templatesError) throw templatesError;
      setTemplates(templatesData || []);

    } catch (error: any) {
      console.error('Error fetching initial data:', error);
      toast.error("Gagal memuat data: " + error.message);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const handleTemplateChange = (id: string) => {
    setSelectedTemplateId(id);
    const template = templates.find(t => t.id === id);
    setSelectedTemplate(template);
  };

  const getFormFields = (): FormFieldConfig[] => {
    if (!selectedTemplate) return [];

    const fields: FormFieldConfig[] = [];

    // 1. Add fields from template.fields
    if (Array.isArray(selectedTemplate.fields)) {
      selectedTemplate.fields.forEach((field: any) => {
        fields.push({
          name: field.name,
          label: field.label,
          type: field.type || 'text',
          placeholder: field.placeholder,
          description: field.description,
          required: field.required !== false,
        });
      });
    }

    // 2. Add file fields from template.requirements
    if (Array.isArray(selectedTemplate.requirements)) {
      selectedTemplate.requirements.forEach((req: any) => {
        fields.push({
          name: `req_${req.id}`,
          label: req.label,
          type: 'file',
          description: req.description || (req.required ? '(Wajib)' : '(Opsional)'),
          required: req.required !== false,
        });
      });
    }

    return fields;
  };

  const handleSubmit = async (data: any) => {
    if (!selectedTemplate || !currentUser) return;

    try {
      setIsSubmitting(true);
      
      const uploadedFiles: any[] = [];
      const details: Record<string, any> = {};

      // Separate details and files
      for (const key in data) {
        if (key.startsWith('req_')) {
          const requirementId = key.replace('req_', '');
          const fileArray = data[key];
          
          if (Array.isArray(fileArray) && fileArray.length > 0) {
            for (const file of fileArray as File[]) {
              const fileExt = file.name.split('.').pop();
              const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
              const filePath = `${currentUser.id}/${selectedTemplate.id}/${fileName}`;

              const { error: uploadError } = await supabase.storage
                .from('letter_attachments')
                .upload(filePath, file);

              if (uploadError) {
                throw new Error(`Gagal mengunggah ${file.name}: ${uploadError.message}`);
              }

              uploadedFiles.push({
                name: file.name,
                path: filePath,
                size: file.size,
                type: file.type,
                requirementId: requirementId
              });
            }
          }
        } else {
          details[key] = data[key];
        }
      }

      // Insert request
      const { error } = await supabase
        .from('letter_requests')
        .insert({
          user_id: currentUser.id,
          template_id: selectedTemplate.id,
          type: selectedTemplate.name, // or a slug if available, but name is used in admin
          details: details,
          files: uploadedFiles,
          status: 'pending'
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
    <div className="mx-auto max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative">
            <div className="h-24 w-24 rounded-full border-4 border-slate-100 dark:border-slate-800" />
            <IconLoader2 size={48} className="absolute inset-0 m-auto animate-spin text-blue-600" />
          </div>
          <p className="mt-6 text-lg font-bold text-slate-900 dark:text-white">Sedang Memproses...</p>
          <p className="text-sm text-slate-500 mt-2">Mohon tunggu sebentar, permintaan Anda sedang kami kirim.</p>
        </div>
      )}

      <div className="flex items-center space-x-4">
        <Link href="/mahasiswa/dashboard">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 transition-colors">
            <IconArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Ajukan Surat Baru</h2>
          <p className="text-sm text-slate-500">Lengkapi detail di bawah ini untuk mengajukan surat akademik.</p>
        </div>
      </div>

      <Card className="border-none shadow-lg bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg">Pilih Jenis Surat</CardTitle>
          <CardDescription>Pilih dokumen yang ingin Anda ajukan permohonannya</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedTemplateId} onValueChange={handleTemplateChange} disabled={isLoadingTemplates}>
            <SelectTrigger className="w-full h-12 bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500/20">
              <SelectValue placeholder={isLoadingTemplates ? "Memuat..." : "Pilih jenis surat..."} />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedTemplate && (
        <Card className="border-none shadow-xl animate-in zoom-in-95 duration-300">
          <CardHeader className="flex flex-row items-center space-x-4 border-b border-slate-100 dark:border-slate-800 pb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/30">
              <IconFilePlus size={28} />
            </div>
            <div>
              <CardTitle className="text-xl">{selectedTemplate.name}</CardTitle>
              <CardDescription>{selectedTemplate.description || "Mohon lengkapi informasi berikut dengan benar"}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            {selectedTemplate.requirements?.length > 0 && (
              <Alert className="mb-8 bg-blue-50/50 border-blue-100 text-blue-900 dark:bg-blue-950/20 dark:border-blue-900/30">
                <IconAlertCircle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-xs font-bold uppercase tracking-widest">Informasi Penting</AlertTitle>
                <AlertDescription className="text-xs">
                  Pastikan semua dokumen lampiran dalam format PDF atau Gambar dan terbaca dengan jelas.
                </AlertDescription>
              </Alert>
            )}
            
            <DynamicForm 
              fields={getFormFields()} 
              onSubmit={handleSubmit}
              isLoading={isSubmitting}
              submitLabel="Kirim Pengajuan" 
            />
          </CardContent>
        </Card>
      )}

      {!selectedTemplate && !isLoadingTemplates && (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 p-20 text-center text-slate-400 dark:border-slate-800 bg-slate-50/30">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-full shadow-sm mb-6 opacity-40">
            <IconFilePlus size={48} stroke={1.5} />
          </div>
          <p className="text-lg font-medium">Silakan pilih jenis surat di atas</p>
          <p className="text-sm max-w-xs mt-2">Formulir pengajuan akan muncul secara otomatis setelah Anda memilih kategori surat.</p>
        </div>
      )}

      {isLoadingTemplates && (
        <div className="flex flex-col items-center justify-center p-20 text-slate-400">
          <IconLoader2 size={40} className="animate-spin mb-4 text-blue-500" />
          <p>Menyiapkan formulir...</p>
        </div>
      )}
    </div>
  );
}

