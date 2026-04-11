"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  IconPlus, 
  IconTrash, 
  IconArrowLeft, 
  IconEye, 
  IconDeviceFloppy,
  IconGripVertical,
  IconSettings,
  IconTemplate,
  IconCircleCheck,
  IconFileWord,
  IconCloudUpload
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { DynamicForm } from '@/components/forms/dynamic-form';
import { FormFieldConfig } from '@/types';
import Link from 'next/link';
import * as mammoth from 'mammoth';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import { supabase } from '@/lib/supabase';


const templateSchema = z.object({
  title: z.string().min(3, "Judul template minimal 3 karakter"),
  description: z.string().min(10, "Deskripsi minimal 10 karakter"),
  category: z.string().min(1, "Kategori wajib diisi"),
  fields: z.array(z.object({
    name: z.string().min(1, "ID Field wajib diisi"),
    label: z.string().min(1, "Label wajib diisi"),
    type: z.enum(["text", "number", "email", "select", "textarea", "file"]),
    placeholder: z.string().optional(),
    description: z.string().optional(),
    required: z.boolean(),
    options: z.array(z.object({
      label: z.string(),
      value: z.string()
    })).optional()
  })).min(1, "Minimal harus ada satu field"),
  requirements: z.array(z.object({
    id: z.string().min(1, "ID wajib diisi"),
    label: z.string().min(1, "Label wajib diisi"),
    required: z.boolean(),
    description: z.string().optional()
  })).optional()
});

type TemplateFormValues = z.infer<typeof templateSchema>;

export default function TambahTemplatePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"builder" | "preview">("builder");
  const [previewMode, setPreviewMode] = useState<"form" | "content">("form");

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "Akademik",
      fields: [],
      requirements: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "fields"
  });

  const { fields: reqFields, append: appendReq, remove: removeReq } = useFieldArray({
    control: form.control,
    name: "requirements"
  });

  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templateBuffer, setTemplateBuffer] = useState<ArrayBuffer | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const onSubmit = async (data: TemplateFormValues) => {
    try {
      if (!templateFile) {
        toast.error("Template Belum Ada", {
          description: "Silakan upload berkas .docx terlebih dahulu."
        });
        return;
      }

      setIsGenerating(true);

      // 1. Upload file to storage
      const fileExt = templateFile.name.split('.').pop();
      const fileName = `${Date.now()}-${data.title.replace(/\s+/g, '_')}.${fileExt}`;
      const filePath = fileName; // Inside bucket

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('letter_templates')
        .upload(filePath, templateFile);

      if (uploadError) throw uploadError;

      // 2. Save metadata to database
      const { error: dbError } = await supabase
        .from('letter_templates')
        .insert([{
          name: data.title,
          category: data.category,
          description: data.description,
          fields: data.fields,
          requirements: data.requirements,
          file_path: uploadData.path
        }]);

      if (dbError) throw dbError;

      toast.success("Template berhasil disimpan", {
        description: "Jenis surat baru telah ditambahkan ke sistem."
      });
      router.push('/admin/jenis-surat');
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error("Gagal Menyimpan", {
        description: error.message || "Terjadi kesalahan saat menyimpan template."
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDocxUpload = async (file: File) => {
    setIsConverting(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        setTemplateBuffer(arrayBuffer);
        
        // Extract raw text to find placeholders
        const result = await mammoth.extractRawText({ arrayBuffer });
        const text = result.value;
        
        // Find placeholders like {{variableName}} or {{parent.child}}
        const regex = /{{\s*([a-zA-Z0-9_.]+)\s*}}/g;
        const matches = text.matchAll(regex);
        const uniqueVariables = new Set<string>();
        
        for (const match of matches) {
          uniqueVariables.add(match[1]);
        }

        // Get current fields to avoid duplicates
        const currentFields = form.getValues("fields");
        const currentFieldNames = new Set(currentFields.map(f => f.name));
        
        let addedCount = 0;
        for (const variable of uniqueVariables) {
          if (!currentFieldNames.has(variable)) {
            // Simple logic to format label: camelCase to Title Case
            const label = variable
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, (str) => str.toUpperCase())
              .trim();
              
            append({
              name: variable,
              label: label,
              type: "text",
              required: true,
              placeholder: `Masukkan ${label.toLowerCase()}...`
            });
            addedCount++;
          }
        }

        toast.success("Template Terkoneksi", {
          description: addedCount > 0 
            ? `Berhasil mengimpor ${addedCount} field baru dari template.` 
            : "Berkas .docx siap digunakan."
        });
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Gagal Memproses Berkas", {
          description: "Terjadi kesalahan saat mengekstraksi data dari berkas .docx."
        });
      } finally {
        setIsConverting(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleGenerateTest = (data: any) => {
    if (!templateBuffer) {
      toast.error("Template Belum Siap", {
        description: "Harap upload berkas .docx terlebih dahulu."
      });
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

      // Render the document with form data
      doc.render(data);

      const out = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      saveAs(out, `TEST_${form.getValues("title").replace(/\s+/g, '_') || 'template'}.docx`);
      
      toast.success("Uji Coba Berhasil", {
        description: "Berkas contoh telah diunduh. Silakan periksa hasil mapping."
      });
    } catch (error: any) {
      console.error("Docxtemplater error:", error);
      
      let errorMessage = "Terjadi kesalahan saat memetakan data ke template.";
      
      // Detailed error reporting for MultiError
      if (error.properties && error.properties.errors instanceof Array) {
        const detailedErrors = error.properties.errors.map((e: any) => e.properties.explanation).join("\n");
        console.error("Docxtemplater detailed errors:", detailedErrors);
        errorMessage = "Template bermasalah (Tag terdeteksi ganda/rusak). Solusi: Hapus tag tersebut di Word dan ketik ulang secara manual.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error("Gagal Generate", {
        description: errorMessage
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Prepare fields for DynamicForm preview
  const previewFields = useMemo(() => {
    return form.watch("fields").map(f => ({
      name: f.name,
      label: f.label,
      type: f.type,
      placeholder: f.placeholder,
      description: f.description,
      // Mapping options if select
      options: f.options
    })) as FormFieldConfig[];
  }, [form.watch("fields")]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/admin/jenis-surat">
              <IconArrowLeft size={20} />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white underline decoration-blue-500/30 decoration-4 underline-offset-4">
              Buat Template Surat
            </h2>
            <p className="text-slate-500">Rancang alur data dan formulir untuk jenis surat baru.</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl flex">
            <Button 
              variant={activeTab === 'builder' ? 'default' : 'ghost'} 
              size="sm"
              className={activeTab === 'builder' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm hover:bg-white' : 'text-slate-500'}
              onClick={() => setActiveTab('builder')}
            >
              <IconSettings size={16} className="mr-2" />
              Builder
            </Button>
            <Button 
              variant={activeTab === 'preview' ? 'default' : 'ghost'} 
              size="sm"
              className={activeTab === 'preview' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm hover:bg-white' : 'text-slate-500'}
              onClick={() => setActiveTab('preview')}
            >
              <IconEye size={16} className="mr-2" />
              Preview
            </Button>
          </div>
          <Button 
            onClick={form.handleSubmit(onSubmit)}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 dark:shadow-none"
          >
            <IconDeviceFloppy size={18} className="mr-2" />
            Simpan Template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Configuration */}
        <div className={`lg:col-span-8 space-y-8 ${activeTab === 'preview' ? 'hidden lg:block lg:opacity-50 pointer-events-none' : ''}`}>
          <Card className="border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <IconTemplate className="text-blue-600" size={20} />
                <CardTitle className="text-lg">Informasi Dasar</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <Form {...form}>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Template Surat</FormLabel>
                          <FormControl>
                            <Input placeholder="Contoh: Surat Keterangan Magang" {...field} className="bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500/20" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kategori</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800">
                                <SelectValue placeholder="Pilih kategori" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Akademik">Akademik</SelectItem>
                              <SelectItem value="Kemahasiswaan">Kemahasiswaan</SelectItem>
                              <SelectItem value="Umum">Umum</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deskripsi / Instruksi</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Berikan instruksi bagi mahasiswa yang ingin mengajukan surat ini..." 
                            className="min-h-[100px] bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <IconFileWord className="text-emerald-600" size={20} />
                  <CardTitle className="text-lg">Berkas Template (.docx)</CardTitle>
                </div>
                {templateFile && (
                  <Badge className="bg-emerald-500 text-white border-none">
                    File Terpilih
                  </Badge>
                )}
              </div>
              <CardDescription>Upload berkas Word dengan placeholder `{"{{field_id}}"}` untuk pemrosesan otomatis.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer group"
                   onClick={() => document.getElementById('template-upload')?.click()}>
                <input 
                  type="file" 
                  id="template-upload" 
                  className="hidden" 
                  accept=".docx" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setTemplateFile(file);
                      handleDocxUpload(file);
                    }
                  }}
                />
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
                  <IconCloudUpload size={32} />
                </div>
                {templateFile ? (
                  <div className="text-center">
                    <p className="font-bold text-slate-900 dark:text-white">{templateFile.name}</p>
                    <p className="text-xs text-slate-400">{(templateFile.size / 1024 / 1024).toFixed(2)} MB • Klik untuk ganti file</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="font-bold text-slate-700 dark:text-slate-300">Pilih berkas template</p>
                    <p className="text-xs text-slate-400">Tarik dan lepas atau klik untuk mencari berkas .docx</p>
                  </div>
                )}
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="p-3 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-lg border border-indigo-100 dark:border-indigo-900/30 flex items-start space-x-3">
                   <div className="mt-0.5 text-indigo-600 font-bold bg-white dark:bg-slate-800 w-5 h-5 rounded flex items-center justify-center text-[10px] shadow-sm">1</div>
                   <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                     Pastikan ID Field di bawah sesuai dengan nama variabel di dalam Word. Misal ID `companyName` akan mengisi `{"{{companyName}}"}`.
                   </p>
                 </div>
                 <div className="p-3 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-lg border border-indigo-100 dark:border-indigo-900/30 flex items-start space-x-3">
                   <div className="mt-0.5 text-indigo-600 font-bold bg-white dark:bg-slate-800 w-5 h-5 rounded flex items-center justify-center text-[10px] shadow-sm">2</div>
                   <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                     Gunakan font standar seperti Times New Roman atau Arial agar format surat tetap rapi saat diunduh.
                   </p>
                 </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center">
                Struktur Lampiran Dokumen
                <Badge variant="secondary" className="ml-2 bg-amber-50 text-amber-600 dark:bg-amber-900/30 border-none px-2 py-0">
                  {reqFields.length} Form Upload
                </Badge>
              </h3>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => appendReq({ id: "", label: "", required: true })}
                className="border-amber-200 dark:border-amber-900 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
              >
                <IconPlus size={16} className="mr-2" />
                Tambah Form Upload
              </Button>
            </div>

            <div className="space-y-4">
              {reqFields.map((field, index) => (
                <Card key={field.id} className="group border-none shadow-sm bg-amber-50/30 dark:bg-slate-900 relative overflow-hidden transition-all hover:ring-2 hover:ring-amber-500/10">
                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start gap-4">
                      <div className="mt-2 text-slate-300 dark:text-slate-700 cursor-grab active:cursor-grabbing">
                        <IconGripVertical size={20} />
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-slate-400 font-bold">Nama Dokumen</Label>
                            <Input 
                              placeholder="KTP / Kartu Keluarga" 
                              {...form.register(`requirements.${index}.label` as const)}
                              className="h-9 border-slate-200 dark:border-slate-800"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-slate-400 font-bold">ID (Internal)</Label>
                            <Input 
                              placeholder="ktp_kk" 
                              {...form.register(`requirements.${index}.id` as const)}
                              className="h-9 font-mono text-sm border-slate-200 dark:border-slate-800"
                            />
                          </div>
                          <div className="space-y-2 flex flex-col justify-end">
                            <Label className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">Wajib Diunggah?</Label>
                            <div className="flex items-center space-x-2">
                              {/* Simple select for required boolean */}
                              <Select 
                                onValueChange={(val) => form.setValue(`requirements.${index}.required`, val === 'true')}
                                defaultValue={form.getValues(`requirements.${index}.required`) ? 'true' : 'false'}
                              >
                                <SelectTrigger className="h-9 border-slate-200 dark:border-slate-800">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="true">Wajib (Ya)</SelectItem>
                                  <SelectItem value="false">Pilihan (Tidak)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                           <div className="space-y-2">
                             <Label className="text-xs uppercase tracking-wider text-slate-400 font-bold">Catatan / Deskripsi Tambahan</Label>
                             <Input 
                               placeholder="Scan berwarna resolusi tinggi..." 
                               {...form.register(`requirements.${index}.description` as const)}
                               className="h-9 border-slate-200 dark:border-slate-800"
                             />
                           </div>
                        </div>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeReq(index)}
                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                      >
                        <IconTrash size={18} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button 
                type="button" 
                variant="ghost" 
                className="w-full h-16 border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 hover:border-amber-300 hover:text-amber-500 transition-all rounded-xl"
                onClick={() => appendReq({ id: "", label: "", required: true })}
              >
                <IconPlus className="mr-2" />
                Tambah Form Lampiran Baru
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center">
                Struktur Formulir
                <Badge variant="secondary" className="ml-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 border-none px-2 py-0">
                  {fields.length} Field
                </Badge>
              </h3>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                disabled
                onClick={() => append({ name: "", label: "", type: "text", required: true })}
                className="border-indigo-200 dark:border-indigo-900 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Field formulir ditambahkan secara otomatis dari berkas Word (.docx)"
              >
                <IconPlus size={16} className="mr-2" />
                Tambah Field
              </Button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <Card key={field.id} className="group border-none shadow-lg bg-white dark:bg-slate-900 relative overflow-hidden transition-all hover:ring-2 hover:ring-indigo-500/10">
                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start gap-4">
                      <div className="mt-2 text-slate-300 dark:text-slate-700 cursor-grab active:cursor-grabbing">
                        <IconGripVertical size={20} />
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-slate-400 font-bold">Label Field</Label>
                            <Input 
                              placeholder="Maksud pengajuan" 
                              {...form.register(`fields.${index}.label` as const)}
                              className="h-9 border-slate-200 dark:border-slate-800"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-slate-400 font-bold">ID (Internal)</Label>
                            <Input 
                              placeholder="maksud_pengajuan" 
                              {...form.register(`fields.${index}.name` as const)}
                              className="h-9 font-mono text-sm border-slate-200 dark:border-slate-800"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-slate-400 font-bold">Tipe Input</Label>
                            <Select 
                              onValueChange={(val) => form.setValue(`fields.${index}.type`, val as any)}
                              defaultValue={field.type}
                            >
                              <SelectTrigger className="h-9 border-slate-200 dark:border-slate-800">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Text (Pendek)</SelectItem>
                                <SelectItem value="textarea">Textarea (Panjang)</SelectItem>
                                <SelectItem value="number">Numeric</SelectItem>
                                <SelectItem value="select">Dropdown / Select</SelectItem>
                                <SelectItem value="file">File Upload / Berkas</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-slate-400 font-bold">Placeholder</Label>
                            <Input 
                              placeholder="Masukkan..." 
                              {...form.register(`fields.${index}.placeholder` as const)}
                              className="h-9 border-slate-200 dark:border-slate-800"
                            />
                          </div>
                          {form.watch(`fields.${index}.type`) === 'select' && (
                             <div className="space-y-2">
                               <Label className="text-xs uppercase tracking-wider text-slate-400 font-bold underline decoration-indigo-400">Opsi Dropdown (Pisahkan koma)</Label>
                               <Input 
                                 placeholder="Opsi 1, Opsi 2, Opsi 3" 
                                 onChange={(e) => {
                                   const options = e.target.value.split(',').map(o => ({ label: o.trim(), value: o.trim().toLowerCase().replace(/\s+/g, '_') }));
                                   form.setValue(`fields.${index}.options`, options);
                                 }}
                                 className="h-9 border-slate-200 dark:border-slate-800"
                               />
                             </div>
                          )}
                        </div>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => remove(index)}
                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                      >
                        <IconTrash size={18} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button 
                type="button" 
                variant="ghost" 
                disabled
                className="w-full h-16 border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-all rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => append({ name: "", label: "", type: "text", required: true })}
                title="Field formulir ditambahkan secara otomatis dari berkas Word (.docx)"
              >
                <IconPlus className="mr-2" />
                Tambah Form Field Baru
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Preview Wrapper */}
        <div className={`lg:col-span-4 ${activeTab === 'builder' ? 'hidden lg:block' : 'col-span-1 lg:col-span-12'}`}>
          <div className="sticky top-8 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center">
                Live Preview
                {activeTab === 'preview' && (
                  <Badge className="ml-2 bg-emerald-500 text-white border-none animate-pulse">
                    Live
                  </Badge>
                )}
              </h3>
              <div className="text-[10px] text-slate-400 font-mono flex items-center">
                <IconCircleCheck size={12} className="mr-1 text-emerald-500" />
                Dihasilkan secara dinamis
              </div>
            </div>

            <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden min-h-[600px] flex flex-col">
              <div className="h-2 bg-indigo-600 w-full" />
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
                    <IconTemplate size={24} />
                  </div>
                </div>
                <CardTitle className="text-xl">
                  {form.watch("title") || "Judul Template"}
                </CardTitle>
                <CardDescription className="italic">
                  {form.watch("description") || "Pusat bantuan formulir dinamis Si Perta."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 flex-1">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                     <div className="mb-4 flex items-center justify-between">
                       <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Sandbox Form</h4>
                       <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-600 border-indigo-200">TEST MODE</Badge>
                     </div>
                     <DynamicForm 
                       fields={previewFields} 
                       onSubmit={handleGenerateTest}
                       submitLabel={isGenerating ? "Sedang Memproses..." : "Generate & Download DOCX (Uji)"}
                     />
                     <p className="mt-4 text-[10px] text-slate-400 italic text-center">
                       Tombol di atas akan mengisi template `.docx` yang diupload dengan data menggunakan `Docxtemplater`.
                     </p>
                  </div>
              </CardContent>
              <CardFooter className="bg-slate-50/50 dark:bg-slate-800/50 flex flex-col items-start gap-2 text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800 p-6">
                <div className="flex items-center">
                  <IconCircleCheck size={14} className="mr-2 text-emerald-500" />
                  Seluruh data akan diverifikasi oleh Admin.
                </div>
                <div className="flex items-center">
                  <IconCircleCheck size={14} className="mr-2 text-emerald-500" />
                  Pastikan informasi yang diberikan akurat.
                </div>
              </CardFooter>
            </Card>

            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30 flex items-start space-x-3">
               <IconSettings className="text-amber-600 mt-1 shrink-0" size={18} />
               <div className="space-y-1">
                 <p className="text-xs font-bold text-amber-900 dark:text-amber-400 capsule">Tips Konfigurasi</p>
                 <p className="text-[11px] text-amber-700 dark:text-amber-500 leading-relaxed">
                   Gunakan ID field yang unik dan deskriptif (misal: `tgl_mulai_magang`) untuk memudahkan pemrosesan data di sisi verifikator.
                 </p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
