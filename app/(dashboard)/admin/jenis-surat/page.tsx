"use client";

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { FormFieldConfig } from '@/types';
import Link from 'next/link';
import { 
  IconSettings, 
  IconPlus,
  IconSearch,
  IconClock,
  IconFileText,
  IconChevronRight,
  IconCheck,
  IconX,
  IconExternalLink,
  IconTemplate,
  IconFileWord,
  IconDownload,
  IconTrash,
  IconLoader2,
  IconRocket
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'sonner';

export default function ManajemenSuratPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('letter_templates')
        .select('*')
        .order('name', { ascending: true }); // Better to sort by name for management

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      console.error("Error fetching templates:", error);
      toast.error("Gagal Memuat Data", {
        description: "Tidak dapat mengambil daftar jenis surat dari server."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('letter_templates')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      setTemplates(templates.map(t => 
        t.id === id ? { ...t, is_active: !currentStatus } : t
      ));

      if (selectedTemplate?.id === id) {
        setSelectedTemplate({ ...selectedTemplate, is_active: !currentStatus });
      }

      toast.success("Status Berhasil Diperbarui", {
        description: `Layanan surat sekarang ${!currentStatus ? 'Aktif' : 'Nonaktif'}.`
      });
    } catch (error: any) {
      console.error("Error toggling status:", error);
      toast.error("Gagal Memperbarui Status", {
        description: error.message
      });
    }
  };

  const handleDelete = async (id: string, filePath: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus template ini?")) return;

    try {
      // 1. Delete from database
      const { error: dbError } = await supabase
        .from('letter_templates')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      // 2. Delete from storage
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('letter_templates')
          .remove([filePath]);
        if (storageError) console.error("Error deleting file:", storageError);
      }

      toast.success("Template Berhasil Dihapus");
      setTemplates(templates.filter(t => t.id !== id));
    } catch (error: any) {
      console.error("Error deleting template:", error);
      toast.error("Gagal Menghapus", {
        description: error.message
      });
    }
  };

  const handleDownload = async (filePath: string, name: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('letter_templates')
        .download(filePath);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${name.replace(/\s+/g, '_')}.docx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error: any) {
      console.error("Error downloading file:", error);
      toast.error("Gagal Mengunduh", {
        description: "Berkas template tidak dapat ditemukan atau diunduh."
      });
    }
  };

  const filteredTemplates = templates.filter(template => 
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Manajemen Jenis Surat</h2>
          <p className="text-slate-500">Konfigurasi template, persyaratan, dan ketersediaan jenis surat secara dinamis.</p>
        </div>
        <Button 
          asChild
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none transition-all"
        >
          <Link href="/admin/jenis-surat/tambah">
            <IconPlus className="mr-2 h-5 w-5" />
            Tambah Template
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
        <div className="relative flex-1 w-full">
          <IconSearch className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Cari jenis surat..." 
            className="pl-10 h-10 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2 text-sm font-medium text-slate-400">
          <IconClock size={16} />
          <span>Update Realtime via Supabase</span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <IconLoader2 className="h-10 w-10 text-indigo-500 animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Memuat template surat...</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Card className="border-2 border-dashed border-slate-200 dark:border-slate-800 bg-transparent py-20">
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-full text-slate-400">
              <IconTemplate size={48} />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Belum Ada Template</h3>
              <p className="text-slate-500 max-w-sm">Data template surat belum tersedia atau tidak ditemukan dengan kata kunci pencarian Anda.</p>
            </div>
            <Button asChild variant="outline" className="mt-4 border-indigo-200 text-indigo-600 hover:bg-indigo-50">
              <Link href="/admin/jenis-surat/tambah">Mulai Buat Template</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="group relative border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
              <div className="absolute top-0 right-0 p-4">
                <IconTemplate size={40} className="text-slate-50 dark:text-slate-800 absolute -top-2 -right-2 transform rotate-12 transition-transform group-hover:rotate-0" />
              </div>
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 border-none px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider">
                    {template.category}
                  </Badge>
                  <Switch 
                    checked={template.is_active ?? true} 
                    onCheckedChange={() => handleToggleStatus(template.id, template.is_active ?? true)}
                  />
                </div>
                <CardTitle className="text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {template.name}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {template.description || `Template standar untuk ${template.name.toLowerCase()} mahasiswa.`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center text-xs text-slate-500 font-medium">
                  <IconFileText size={14} className="mr-1.5 text-slate-400" />
                  <span>{template.fields.length} Input / Persyaratan</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {template.fields.slice(0, 3).map((field: any, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-[10px] bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 border-slate-200 dark:border-slate-800">
                      {field.label}
                    </Badge>
                  ))}
                  {template.fields.length > 3 && (
                    <Badge variant="outline" className="text-[10px] bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 border-slate-200 dark:border-slate-800">
                      +{template.fields.length - 3} lainnya
                    </Badge>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 mt-2">
                   <div className="flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                     <IconFileWord size={12} className="mr-1" />
                     DOCX TEMPLATE
                   </div>
                   <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 px-2 text-[10px] text-slate-400 hover:text-indigo-600"
                    onClick={() => handleDownload(template.file_path, template.name)}
                   >
                     <IconDownload size={12} className="mr-1" />
                     Download
                   </Button>
                </div>
              </CardContent>
              <CardFooter className="pt-0 flex justify-between gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 h-9 rounded-lg border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                  onClick={() => setSelectedTemplate(template)}
                >
                  Lihat Detail
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild
                  className="flex-1 h-9 rounded-lg border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600"
                >
                  <Link href={`/admin/jenis-surat/test/${template.id}`}>
                    <IconRocket size={16} className="mr-2" />
                    Uji Coba
                  </Link>
                </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                    onClick={() => handleDelete(template.id, template.file_path)}
                  >
                    <IconTrash size={18} />
                  </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
        <DialogContent className="max-w-2xl bg-white dark:bg-slate-950 border-none shadow-2xl">
          {selectedTemplate && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <IconFileText size={20} />
                  </div>
                  <DialogTitle className="text-xl">{selectedTemplate.name}</DialogTitle>
                </div>
                <DialogDescription>
                  Berikut adalah konfigurasi field dan persyaratan untuk pengajuan surat ini.
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden max-h-[300px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0">
                    <tr>
                      <th className="h-10 px-4 text-left font-medium text-slate-500">Nama Field</th>
                      <th className="h-10 px-4 text-left font-medium text-slate-500">Tipe Input</th>
                      <th className="h-10 px-4 text-left font-medium text-slate-500 text-center">Wajib</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {selectedTemplate.fields.map((field: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 dark:text-white">{field.label}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{field.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="capitalize text-[10px] px-1.5 py-0">
                            {field.type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <IconCheck size={16} className="text-emerald-500 mx-auto" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                <div className="flex items-center space-x-3">
                  <IconSettings className="text-indigo-600" size={20} />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">Status Layanan</span>
                    <span className="text-xs text-slate-500 italic text-indigo-600 dark:text-indigo-400 ">Dapat diakses oleh mahasiswa</span>
                  </div>
                </div>
                <Switch 
                  checked={selectedTemplate.is_active ?? true} 
                  onCheckedChange={() => handleToggleStatus(selectedTemplate.id, selectedTemplate.is_active ?? true)}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <Button variant="ghost" onClick={() => setSelectedTemplate(null)}>Tutup</Button>
                <Button 
                  asChild
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Link href={`/admin/jenis-surat/edit/${selectedTemplate.id}`}>
                    Edit Konfigurasi
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
