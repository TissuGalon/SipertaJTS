"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
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
  IconCloudUpload,
  IconLoader2
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
  is_active: z.boolean(),
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

export default function EditTemplatePage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"builder" | "preview">("builder");
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templateBuffer, setTemplateBuffer] = useState<ArrayBuffer | null>(null);
  const [existingFilePath, setExistingFilePath] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "Akademik",
      is_active: true,
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

      form.reset({
        title: data.name,
        description: data.description || "",
        category: data.category,
        is_active: data.is_active ?? true,
        fields: data.fields,
        requirements: data.requirements || []
      });
      setExistingFilePath(data.file_path);

      // Fetch file buffer for preview
      if (data.file_path) {
        const { data: fileData, error: fileError } = await supabase.storage
          .from('letter_templates')
          .download(data.file_path);
        
        if (!fileError && fileData) {
          const buffer = await fileData.arrayBuffer();
          setTemplateBuffer(buffer);
        }
      }
    } catch (error: any) {
      console.error("Error fetching template:", error);
      toast.error("Gagal Memuat Data", {
        description: "Template tidak ditemukan atau terjadi kesalahan server."
      });
      router.push('/admin/jenis-surat');
    } finally {
      setLoading(false);
    }
  };

  const handleDocxUpload = async (file: File) => {
    setIsConverting(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        setTemplateBuffer(arrayBuffer);
        
        const result = await mammoth.extractRawText({ arrayBuffer });
        const text = result.value;
        const regex = /{{\s*([a-zA-Z0-9_.]+)\s*}}/g;
        const matches = text.matchAll(regex);
        const uniqueVariables = new Set<string>();
        
        for (const match of matches) {
          uniqueVariables.add(match[1]);
        }

        const currentFields = form.getValues("fields");
        const currentFieldNames = new Set(currentFields.map(f => f.name));
        
        let addedCount = 0;
        for (const variable of uniqueVariables) {
          if (!currentFieldNames.has(variable)) {
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
        description: "Harap upload berkas .docx atau tunggu pemuatan data."
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

      doc.render(data);

      const out = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      saveAs(out, `TEST_${form.getValues("title").replace(/\s+/g, '_') || 'template'}.docx`);
      toast.success("Uji Coba Berhasil");
    } catch (error: any) {
      console.error("Docxtemplater error:", error);
      toast.error("Gagal Generate", {
        description: "Template bermasalah atau data tidak valid."
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (data: TemplateFormValues) => {
    try {
      setIsSaving(true);
      let filePath = existingFilePath;

      if (templateFile) {
        const fileExt = templateFile.name.split('.').pop();
        const fileName = `${Date.now()}-${data.title.replace(/\s+/g, '_')}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('letter_templates')
          .upload(fileName, templateFile);

        if (uploadError) throw uploadError;
        filePath = uploadData.path;

        // Optionally delete old file
        if (existingFilePath) {
          await supabase.storage.from('letter_templates').remove([existingFilePath]);
        }
      }

      // 2. Update database
      const { error: dbError } = await supabase
        .from('letter_templates')
        .update({
          name: data.title,
          category: data.category,
          description: data.description,
          fields: data.fields,
          requirements: data.requirements,
          file_path: filePath,
          is_active: data.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (dbError) throw dbError;

      toast.success("Template berhasil diperbarui");
      router.push('/admin/jenis-surat');
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error("Gagal Memperbarui", {
        description: error.message
      });
    } finally {
      setIsSaving(false);
    }
  };

  const previewFields = useMemo(() => {
    return form.watch("fields").map(f => ({
      name: f.name,
      label: f.label,
      type: f.type,
      placeholder: f.placeholder,
      description: f.description,
      options: f.options
    })) as FormFieldConfig[];
  }, [form.watch("fields")]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-4">
        <IconLoader2 className="h-10 w-10 text-indigo-500 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Memuat data template...</p>
      </div>
    );
  }

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
              Edit Template Surat
            </h2>
            <p className="text-slate-500">Sesuaikan alur data dan formulir untuk {form.getValues("title")}.</p>
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
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 dark:shadow-none"
          >
            {isSaving ? <IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> : <IconDeviceFloppy size={18} className="mr-2" />}
            Simpan Perubahan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
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
                            <Input {...field} className="bg-slate-50/50 dark:bg-slate-950/50" />
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
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-slate-50/50 dark:bg-slate-950/50">
                                <SelectValue />
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
                          <Textarea {...field} className="min-h-[100px] bg-slate-50/50 dark:bg-slate-950/50" />
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
                {existingFilePath && !templateFile && (
                  <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                    File Tersimpan
                  </Badge>
                )}
                {templateFile && (
                  <Badge className="bg-emerald-500 text-white border-none">
                    File Baru Dipilih
                  </Badge>
                )}
              </div>
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
                    <p className="text-xs text-slate-400">Ganti file yang sudah ada</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="font-bold text-slate-700 dark:text-slate-300">Ganti berkas template (Opsional)</p>
                    <p className="text-xs text-slate-400">Klik untuk mengupload versi terbaru dari template ini.</p>
                  </div>
                )}
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
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Struktur Formulir</h3>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                disabled
                onClick={() => append({ name: "", label: "", type: "text", required: true })}
                title="Field formulir ditambahkan secara otomatis dari berkas Word (.docx)"
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IconPlus size={16} className="mr-2" />
                Tambah Field
              </Button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <Card key={field.id} className="border-none shadow-lg bg-white dark:bg-slate-900 relative">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start gap-4">
                      <div className="mt-2 text-slate-300 dark:text-slate-700">
                        <IconGripVertical size={20} />
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-400">Label Field</Label>
                            <Input {...form.register(`fields.${index}.label` as const)} className="h-9" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-400">ID (Internal)</Label>
                            <Input {...form.register(`fields.${index}.name` as const)} className="h-9 font-mono text-sm" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-400">Tipe Input</Label>
                            <Select 
                              onValueChange={(val) => form.setValue(`fields.${index}.type`, val as any)}
                              defaultValue={field.type}
                            >
                              <SelectTrigger className="h-9">
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
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => remove(index)}
                        className="text-rose-500"
                      >
                        <IconTrash size={18} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <div className={`lg:col-span-4 ${activeTab === 'builder' ? 'hidden lg:block' : 'col-span-1 lg:col-span-12'}`}>
          <div className="sticky top-8 space-y-6">
            <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden min-h-[600px] flex flex-col">
              <div className="h-2 bg-indigo-600 w-full" />
              <CardHeader>
                <CardTitle>{form.watch("title") || "Preview"}</CardTitle>
                <CardDescription>{form.watch("description")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 flex-1">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                   <DynamicForm 
                     fields={previewFields} 
                     onSubmit={handleGenerateTest}
                     submitLabel={isGenerating ? "Processing..." : "Generate Test DOCX"}
                   />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
