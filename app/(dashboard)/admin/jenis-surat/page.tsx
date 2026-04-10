"use client";

import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { letterConfigs } from '@/lib/letter-configs';
import { 
  LETTER_TYPE_LABELS, 
  LetterType 
} from '@/types';
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
  IconDownload
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ManajemenSuratPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<LetterType | null>(null);
  
  // Convert Record to Array for mapping
  const activeTypes = Object.keys(letterConfigs) as LetterType[];
  
  const filteredTypes = activeTypes.filter(type => 
    LETTER_TYPE_LABELS[type].toLowerCase().includes(searchQuery.toLowerCase()) ||
    type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Manajemen Jenis Surat</h2>
          <p className="text-slate-500">Konfigurasi template, persyaratan, dan ketersediaan jenis surat.</p>
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
        <div className="relative flex-1">
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
          <span>Terakhir diperbarui: 24 Mar 2024</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTypes.map((type) => {
          const config = letterConfigs[type];
          return (
            <Card key={type} className="group relative border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
              <div className="absolute top-0 right-0 p-4">
                <IconTemplate size={40} className="text-slate-50 dark:text-slate-800 absolute -top-2 -right-2 transform rotate-12 transition-transform group-hover:rotate-0" />
              </div>
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 border-none px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider">
                    {type.split('_')[1]}
                  </Badge>
                  <Switch checked={true} />
                </div>
                <CardTitle className="text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {LETTER_TYPE_LABELS[type]}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  Template standar untuk {LETTER_TYPE_LABELS[type].toLowerCase()} mahasiswa.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center text-xs text-slate-500 font-medium">
                  <IconFileText size={14} className="mr-1.5 text-slate-400" />
                  <span>{config.length} Input / Persyaratan</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {config.slice(0, 3).map((field, idx) => (
                    <Badge key={idx} variant="outline" className="text-[10px] bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 border-slate-200 dark:border-slate-800">
                      {field.label}
                    </Badge>
                  ))}
                  {config.length > 3 && (
                    <Badge variant="outline" className="text-[10px] bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 border-slate-200 dark:border-slate-800">
                      +{config.length - 3} lainnya
                    </Badge>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 mt-2">
                   <div className="flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                     <IconFileWord size={12} className="mr-1" />
                     TEMPLATE READY
                   </div>
                   <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-slate-400 hover:text-indigo-600">
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
                  onClick={() => setSelectedType(type)}
                >
                  Lihat Detail
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-lg text-slate-400 hover:text-indigo-600"
                >
                  <IconSettings size={18} />
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedType} onOpenChange={(open) => !open && setSelectedType(null)}>
        <DialogContent className="max-w-2xl bg-white dark:bg-slate-950 border-none shadow-2xl">
          {selectedType && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <IconFileText size={20} />
                  </div>
                  <DialogTitle className="text-xl">{LETTER_TYPE_LABELS[selectedType]}</DialogTitle>
                </div>
                <DialogDescription>
                  Berikut adalah konfigurasi field dan persyaratan untuk pengajuan surat ini.
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="h-10 px-4 text-left font-medium text-slate-500">Nama Field</th>
                      <th className="h-10 px-4 text-left font-medium text-slate-500">Tipe Input</th>
                      <th className="h-10 px-4 text-left font-medium text-slate-500 text-center">Wajib</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {letterConfigs[selectedType].map((field, idx) => (
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
                <Switch checked={true} />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <Button variant="ghost" onClick={() => setSelectedType(null)}>Tutup</Button>
                <Button className="bg-indigo-600 hover:bg-indigo-700">Edit Konfigurasi</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
