"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { IconArrowLeft, IconFilePlus, IconLoader2, IconAlertCircle, IconCheck, IconExternalLink } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';

function RequestLetterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateIdFromUrl = searchParams.get('template');

  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [lecturers, setLecturers] = useState<any[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (templates.length > 0 && templateIdFromUrl && !selectedTemplateId) {
      const template = templates.find(t => t.id === templateIdFromUrl);
      if (template) {
        setSelectedTemplateId(templateIdFromUrl);
        setSelectedTemplate(template);
      }
    }
  }, [templates, templateIdFromUrl]);

  const fetchInitialData = async () => {
    try {
      setIsLoadingTemplates(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      
      // Fetch profile to get prodi and other details
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
        
      setCurrentUser(profile || user);

      const { data: templatesData, error: templatesError } = await supabase
        .from('letter_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (templatesError) throw templatesError;
      setTemplates(templatesData || []);

      // Fetch lecturers for picker
      const { data: lecturersData } = await supabase
        .from('dosen')
        .select('*')
        .order('name');
      
      setLecturers(lecturersData || []);

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

    if (Array.isArray(selectedTemplate.fields)) {
      selectedTemplate.fields.forEach((field: any) => {
        const isNomorSurat = field.name.toLowerCase().includes('nomor') && field.name.toLowerCase().includes('surat');
        
        fields.push({
          name: field.name,
          label: field.label,
          type: field.type || 'text',
          placeholder: isNomorSurat ? "Otomatis diisi oleh admin" : field.placeholder,
          description: field.description,
          required: isNomorSurat ? false : field.required !== false,
          disabled: isNomorSurat,
          options: field.type === 'dosen_picker' 
            ? lecturers.map(l => ({ label: `${l.name} (NIP: ${l.nip || '-'})`, value: JSON.stringify({ name: l.name, nip: l.nip }) }))
            : field.options
        });
      });
    }

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

      for (const key in data) {
        if (key.startsWith('req_')) {
          const requirementId = key.replace('req_', '');
          const fileArray = data[key];
          
          if (Array.isArray(fileArray) && fileArray.length > 0) {
            // Get label from template requirements to avoid TS error on File object
            const currentReq = selectedTemplate.requirements?.find((r: any) => r.id === requirementId);
            const reqLabel = currentReq?.label || 'Lampiran';

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
                name: reqLabel,
                fileName: file.name,
                path: filePath,
                size: file.size,
                type: file.type,
                requirementId: requirementId
              });
            }
          }
        } else {
          // If it's a dosen_picker value (JSON string), parse it and spread it
          if (key.includes('dosen') && typeof data[key] === 'string' && data[key].startsWith('{')) {
            try {
              const dosenData = JSON.parse(data[key]);
              details[`nama_${key}`] = dosenData.name;
              details[`nip_${key}`] = dosenData.nip;
            } catch (e) {
              details[key] = data[key];
            }
          } else {
            details[key] = data[key];
          }
        }
      }

      // Add automatic date
      details['submission_date'] = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      let initialStatus = selectedTemplate.requires_coordinator ? 'verifying' : 'menunggu_admin';

      if (selectedTemplate.requires_coordinator) {
        // Cek apakah ada koordinator aktif untuk prodi mahasiswa ini
        const { data: activeKoordinators, error: checkError } = await supabase
          .from('dosen_dashboard_settings')
          .select('visible_letter_types')
          .eq('prodi', currentUser.prodi)
          .eq('is_enabled', true);
        
        let isBypassed = true;
        if (!checkError && activeKoordinators && activeKoordinators.length > 0) {
          // Jika ada minimal satu koordinator yang punya akses ke tipe surat ini
          for (const k of activeKoordinators) {
             if (k.visible_letter_types && k.visible_letter_types.includes(selectedTemplate.id)) {
                isBypassed = false;
                break;
             }
          }
        }
        
        // Jika tidak ada koordinator aktif atau tidak ada yang ditugaskan untuk tipe surat ini, maka bypass ke admin.
        if (isBypassed) {
           initialStatus = 'menunggu_admin';
        }
      }

      const { error } = await supabase
        .from('letter_requests')
        .insert({
          user_id: currentUser.id,
          template_id: selectedTemplate.id,
          type: selectedTemplate.id, // Better to use ID or a slug if available
          details: details,
          files: uploadedFiles,
          status: initialStatus,
          prodi: currentUser.prodi // Save prodi directly for filtering
        });

      if (error) throw error;

      setIsSuccess(true);
      toast.success("Pengajuan berhasil dikirim!");
      
      // Delay redirect to show success state
      setTimeout(() => {
        router.push('/mahasiswa/dashboard');
      }, 2000);

    } catch (error: any) {
      console.error('Error submitting request:', error);
      toast.error(error.message || "Gagal mengirim pengajuan, silakan coba lagi.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      {/* Premium Loading/Success Overlay */}
      <AnimatePresence>
        {(isSubmitting || isSuccess) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center text-center p-8 max-w-sm"
            >
              {isSuccess ? (
                <div className="h-24 w-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12 }}
                  >
                    <IconCheck size={48} stroke={3} />
                  </motion.div>
                </div>
              ) : (
                <div className="relative mb-6">
                  <div className="h-24 w-24 rounded-full border-4 border-slate-100 dark:border-slate-800" />
                  <IconLoader2 size={48} className="absolute inset-0 m-auto animate-spin text-indigo-600" />
                </div>
              )}
              
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {isSuccess ? "Berhasil Dikirim!" : "Sedang Memproses..."}
              </h3>
              <p className="text-slate-500 mt-2 font-medium">
                {isSuccess 
                  ? "Permohonan Anda telah masuk ke sistem. Anda akan dialihkan ke dashboard." 
                  : "Mohon tunggu sebentar, kami sedang mengamankan data dan berkas Anda."}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-5">
          <Link href="/mahasiswa/dashboard">
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-all shadow-sm">
              <IconArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Ajukan Surat Baru</h2>
            <p className="text-slate-500 font-medium">Pilih kategori dan lengkapi data permohonan Anda.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Card className="border-none shadow-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-[2.5rem] sticky top-8">
            <CardHeader className="p-8">
              <CardTitle className="text-xl font-black">Langkah 1</CardTitle>
              <CardDescription className="text-slate-500 font-medium">Tentukan jenis layanan surat</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <Select value={selectedTemplateId} onValueChange={handleTemplateChange} disabled={isLoadingTemplates}>
                <SelectTrigger className="w-full h-14 bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 font-bold">
                  <SelectValue placeholder={isLoadingTemplates ? "Memuat..." : "Pilih jenis surat..."} />
                </SelectTrigger>
                <SelectContent className="rounded-2xl shadow-2xl border-slate-100 dark:border-slate-800">
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id} className="h-12 focus:bg-indigo-50 dark:focus:bg-indigo-900/20 rounded-xl m-1">
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedTemplate && (
                <div className="mt-8 p-6 rounded-3xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-900/20">
                  <h4 className="font-black text-indigo-900 dark:text-indigo-300 text-sm uppercase tracking-widest mb-2">Deskripsi Layanan</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">
                    {selectedTemplate.description || "Layanan ini disediakan untuk memfasilitasi kebutuhan administrasi akademik mahasiswa."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8">
          {selectedTemplate ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                <CardHeader className="p-8 border-b border-slate-50 dark:border-slate-800 flex flex-row items-center space-x-5">
                  <div className="h-16 w-16 rounded-3xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
                    <IconFilePlus size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{selectedTemplate.name}</h3>
                    <p className="text-slate-500 font-medium">Langkah 2: Lengkapi Formulir</p>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  {selectedTemplate.requirements?.length > 0 && (
                    <Alert className="mb-10 bg-amber-50/50 border-amber-100 text-amber-900 dark:bg-amber-950/20 dark:border-amber-900/30 rounded-3xl p-6">
                      <IconAlertCircle className="h-6 w-6 text-amber-600" />
                      <div className="ml-2">
                        <AlertTitle className="text-sm font-black uppercase tracking-widest mb-1">Perhatian Penting</AlertTitle>
                        <AlertDescription className="text-sm font-medium opacity-80">
                          Beberapa dokumen pendukung diperlukan. Pastikan berkas dalam format PDF/JPG dengan ukuran maksimal 2MB.
                        </AlertDescription>
                      </div>
                    </Alert>
                  )}
                  
                  <div className="px-1">
                    <DynamicForm 
                      fields={getFormFields()} 
                      onSubmit={handleSubmit}
                      isLoading={isSubmitting}
                      submitLabel="Kirim Pengajuan Sekarang" 
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] rounded-[2.5rem] border-4 border-dashed border-slate-100 dark:border-slate-800/50 p-12 text-center bg-slate-50/30">
              <motion.div 
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                className="p-10 bg-white dark:bg-slate-900 rounded-full shadow-2xl mb-8 border border-slate-50 dark:border-slate-800"
              >
                <IconFilePlus size={64} stroke={1} className="text-slate-200" />
              </motion.div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-200">Formulir Belum Aktif</h3>
              <p className="text-slate-400 font-medium max-w-xs mt-3">Silakan pilih jenis surat di panel samping untuk memulai proses pengisian data.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RequestLetterPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[80vh] items-center justify-center">
        <IconLoader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    }>
      <RequestLetterContent />
    </Suspense>
  );
}

