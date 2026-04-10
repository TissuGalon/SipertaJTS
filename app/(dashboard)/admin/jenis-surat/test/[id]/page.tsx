"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  IconArrowLeft, 
  IconFileText, 
  IconCheck,
  IconLoader2,
  IconTemplate,
  IconVariable,
  IconExternalLink,
  IconFileWord,
  IconCircleCheck
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { DynamicForm } from '@/components/forms/dynamic-form';
import { FormFieldConfig } from '@/types';
import Link from 'next/link';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import mammoth from 'mammoth';


export default function TestTemplatePage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<any | null>(null);
  const [templateBuffer, setTemplateBuffer] = useState<ArrayBuffer | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);


  useEffect(() => {
    if (id) {
      fetchTemplate();
    }
  }, [id]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('letter_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setTemplate(data);

      if (data.file_path) {
        const { data: fileData, error: fileError } = await supabase.storage
          .from('letter_templates')
          .download(data.file_path);
        
        if (fileError) throw fileError;
        const buffer = await fileData.arrayBuffer();
        setTemplateBuffer(buffer);
      }
    } catch (error: any) {
      console.error("Error fetching template:", error);
      toast.error("Gagal Memuat Template", {
        description: "Pastikan template tersedia dan file .docx sudah valid."
      });
      router.push('/admin/jenis-surat');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTest = async (data: any) => {
    if (!templateBuffer) {
      toast.error("Berkas Template Belum Siap");
      return;
    }

    setIsGenerating(true);
    try {
      const zip = new PizZip(templateBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: '{{', end: '}}' }
      });

      doc.render(data);

      const buffer = doc.getZip().generate({
        type: "arraybuffer",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      // Convert to HTML for preview
      const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
      setPreviewHtml(result.value);

      // Also generate Blob for download
      const blob = new Blob([buffer], { 
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
      });

      saveAs(blob, `PREVIEW_${template.name.replace(/\s+/g, '_')}.docx`);
      toast.success("Uji Coba Berhasil", {
        description: "Preview telah dihasilkan dan berkas diunduh otomatis."
      });
    } catch (error: any) {
      console.error("Test generation error:", error);
      toast.error("Gagal Menghasilkan Pratinjau", {
        description: "Terjadi kesalahan saat memproses placeholder. Periksa format file Word Anda."
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const previewFields = useMemo(() => {
    if (!template?.fields) return [];
    return template.fields.map((f: any) => ({
      name: f.name,
      label: f.label,
      type: f.type,
      placeholder: f.placeholder,
      description: f.description,
      options: f.options
    })) as FormFieldConfig[];
  }, [template]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-4">
        <IconLoader2 className="h-10 w-10 text-indigo-500 animate-spin" />
        <p className="text-slate-500 font-medium">Menyiapkan lingkungan uji coba...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/admin/jenis-surat">
              <IconArrowLeft size={20} />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Uji Coba Template</h2>
            <p className="text-slate-500">Verifikasi hasil mapping placeholder dari {template.name}.</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 border-none font-bold">
              SANDBOX MODE
            </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="bg-indigo-600 text-white">
              <CardTitle className="text-lg flex items-center">
                <IconTemplate className="mr-2" size={20} />
                Detail Template
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Surat</p>
                <p className="font-semibold text-slate-900 dark:text-white">{template.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kategori</p>
                <Badge variant="outline">{template.category}</Badge>
              </div>
              <div className="space-y-1 pt-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                  <IconVariable size={12} className="mr-1" />
                  ID Field Terdeteksi
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {template.fields.map((f: any, idx: number) => (
                    <code key={idx} className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-indigo-600">
                      {f.name}
                    </code>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 p-4">
                <Button variant="ghost" size="sm" className="w-full text-xs text-indigo-600" asChild>
                  <Link href={`/admin/jenis-surat/edit/${template.id}`}>
                    <IconFileText size={14} className="mr-2" />
                    Edit Konfigurasi Field
                  </Link>
                </Button>
            </CardFooter>
          </Card>

          <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30">
            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-400 mb-2">Cara Menggunakan</h4>
            <ul className="text-[11px] text-amber-700 dark:text-amber-500 space-y-2 leading-relaxed">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                Isi form uji coba di sebelah kanan dengan data contoh.
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                Klik tombol "Generate & Unduh" untuk memproses data ke dalam file Word.
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                Buka file yang terunduh dan pastikan semua tag `{"{{tags}}"}` terisi dengan benar.
              </li>
            </ul>
          </div>
        </div>

        {/* Main Test Form */}
        <div className="lg:col-span-8 space-y-8">
            <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
                <div className="h-2 bg-emerald-500 w-full" />
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl flex items-center">
                                <IconFileWord className="text-emerald-500 mr-2" />
                                Simulasi Pengisian Form
                            </CardTitle>
                            <CardDescription>Visualisasi form yang akan dilihat oleh mahasiswa.</CardDescription>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-full">
                            <IconCircleCheck size={12} className="mr-1 text-emerald-500" />
                            Dihasilkan Berdasarkan Konfigurasi
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="bg-slate-50/50 dark:bg-slate-950/20 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <DynamicForm 
                           fields={previewFields} 
                           onSubmit={handleGenerateTest}
                           submitLabel={isGenerating ? "Sedang Memproses..." : "Generate & Preview (.docx)"}
                        />
                    </div>
                </CardContent>
                <CardFooter className="bg-slate-50 dark:bg-slate-800/50 p-6 border-t border-slate-100 dark:border-slate-800 text-slate-400 text-xs text-center flex justify-center">
                    <p>Testing dilakukan secara lokal di browser Anda. Tidak ada data yang disimpan ke database selama sesi uji coba ini.</p>
                </CardFooter>
            </Card>

            {/* Preview Document */}
            {previewHtml && (
              <div className="animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center text-slate-700 dark:text-slate-300">
                    <IconFileText size={20} className="mr-2 text-indigo-500" />
                    Hasil Pratinjau Dokumen
                  </h3>
                  <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-none">
                    Preview Mode
                  </Badge>
                </div>
                
                <Card className="border-none shadow-2xl bg-slate-100 dark:bg-slate-800/50 overflow-hidden p-4 md:p-8 lg:p-12 flex justify-center">
                  <div 
                    className="bg-white text-black p-8 md:p-16 shadow-[0_0_50px_rgba(0,0,0,0.1)] w-full max-w-[800px] min-h-[1000px] font-serif leading-relaxed"
                    style={{ 
                      fontSize: '14px',
                    }}
                  >
                    <div 
                      className="preview-content"
                      dangerouslySetInnerHTML={{ __html: previewHtml }} 
                    />
                    
                    <style jsx global>{`
                      .preview-content p { margin-bottom: 1.25em; line-height: 1.6; }
                      .preview-content h1, .preview-content h2, .preview-content h3 { 
                        margin-top: 1.5em; margin-bottom: 0.5em; font-weight: bold; font-family: sans-serif; 
                      }
                      .preview-content table { width: 100%; border-collapse: collapse; margin: 1em 0; }
                      .preview-content th, .preview-content td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                      .preview-content ul, .preview-content ol { margin-left: 1.5em; margin-bottom: 1em; }
                    `}</style>
                  </div>
                </Card>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
