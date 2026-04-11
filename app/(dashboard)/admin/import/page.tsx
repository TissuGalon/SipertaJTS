"use client";

import React, { useState, useRef } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  IconFileUpload, 
  IconFileSpreadsheet, 
  IconCheck, 
  IconAlertTriangle,
  IconX,
  IconSearch,
  IconCloudUpload,
  IconLoader2,
  IconDownload
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface ImportData {
  identifier: string; // NIM or NIP
  name: string;
  email: string;
  status: 'pending' | 'duplicate' | 'invalid' | 'ready';
  error?: string;
}

export default function BulkImportPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [importType, setImportType] = useState<'mahasiswa' | 'dosen'>('mahasiswa');
  const [parsedData, setParsedData] = useState<ImportData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = {
    ready: parsedData.filter(d => d.status === 'ready').length,
    duplicate: parsedData.filter(d => d.status === 'duplicate').length,
    invalid: parsedData.filter(d => d.status === 'invalid').length,
  };

  const parseCSV = (text: string): ImportData[] => {
    const lines = text.split('\n');
    const results: ImportData[] = [];
    
    // Skip header assumed to be NIM/NIP, Name, Email
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const [identifier, name, email] = line.split(',').map(s => s.trim());
      
      if (!identifier || !name) {
        results.push({ 
          identifier: identifier || '?', 
          name: name || '?', 
          email: email || '', 
          status: 'invalid',
          error: 'Format data tidak lengkap'
        });
        continue;
      }

      results.push({ 
        identifier, 
        name, 
        email: email || '', 
        status: 'pending' 
      });
    }
    return results;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error("Hanya file .csv yang didukung sementara ini.");
      return;
    }

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const data = parseCSV(text);
      
      // Validate duplicates in Supabase
      const identifiers = data.filter(d => d.status === 'pending').map(d => d.identifier);
      
      try {
        const table = importType === 'mahasiswa' ? 'mahasiswa' : 'dosen';
        const column = importType === 'mahasiswa' ? 'nim' : 'nip';
        
        const { data: existing } = await supabase
          .from(table)
          .select(column)
          .in(column, identifiers);

        const existingSet = new Set(existing?.map((e: any) => e[column]));
        
        const validatedData = data.map(d => {
          if (d.status !== 'pending') return d;
          if (existingSet.has(d.identifier)) {
            return { ...d, status: 'duplicate' as const, error: 'Data sudah terdaftar' };
          }
          return { ...d, status: 'ready' as const };
        });

        setParsedData(validatedData);
        setIsUploaded(true);
        toast.success(`Berhasil memproses ${data.length} baris.`);
      } catch (error) {
        toast.error("Gagal melakukan validasi data.");
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    const dataToImport = parsedData.filter(d => d.status === 'ready');
    if (dataToImport.length === 0) {
      toast.error("Tidak ada data valid untuk diimport.");
      return;
    }

    setIsLoading(true);
    try {
      const table = importType === 'mahasiswa' ? 'mahasiswa' : 'dosen';
      const rows = dataToImport.map(d => ({
        [importType === 'mahasiswa' ? 'nim' : 'nip']: d.identifier,
        name: d.name,
        email: d.email || null,
      }));

      const { error } = await supabase.from(table).insert(rows);
      if (error) throw error;

      toast.success(`Berhasil mengimport ${rows.length} data ${importType}.`);
      setIsUploaded(false);
      setParsedData([]);
    } catch (error: any) {
      toast.error("Gagal melakukan import: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    const header = importType === 'mahasiswa' ? 'NIM,Nama,Email\n' : 'NIP,Nama,Email\n';
    const example = importType === 'mahasiswa' ? '2101001,Ahmad Fauzi,ahmad@example.com' : '19850101,Dr. Budi Santoso,budi@example.com';
    const blob = new Blob([header + example], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_import_${importType}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Import Data Massal</h2>
          <p className="text-slate-500">Unggah file CSV untuk mengimport data Mahasiswa atau Dosen secara massal.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-600">Impor ke:</span>
          <Select value={importType} onValueChange={(v: any) => setImportType(v)}>
            <SelectTrigger className="w-[150px] bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mahasiswa">Mahasiswa</SelectItem>
              <SelectItem value="dosen">Dosen</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!isUploaded ? (
        <Card className={cn(
          "border-2 border-dashed transition-all duration-300 shadow-sm",
          isDragging ? "border-indigo-500 bg-indigo-50/50" : "border-slate-200 bg-white"
        )}>
          <CardContent className="flex flex-col items-center justify-center p-16 space-y-6 text-center">
            <div className="h-20 w-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center shadow-inner">
              <IconCloudUpload size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">Letakkan file Anda di sini</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Mendukung file <span className="font-bold text-slate-700">.csv</span>. 
                Gunakan format yang sesuai agar data dapat terbaca dengan baik.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={downloadTemplate} className="border-indigo-100 text-indigo-600 hover:bg-indigo-50">
                <IconDownload size={18} className="mr-2" />
                Unduh Template
              </Button>
              <div className="relative">
                <input 
                  type="file" 
                  accept=".csv"
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <Button 
                  className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200" 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Pilih & Unggah File"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <Card className="border-none shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div>
                <CardTitle>Pratinjau Data Impor ({importType === 'mahasiswa' ? 'Mahasiswa' : 'Dosen'})</CardTitle>
                <CardDescription>Tinjau status validasi sebelum melanjutkan proses impor.</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" onClick={() => setIsUploaded(false)} disabled={isLoading}>Batal</Button>
                <Button 
                  className="bg-indigo-600 hover:bg-indigo-700" 
                  onClick={handleImport} 
                  disabled={isLoading || stats.ready === 0}
                >
                  {isLoading ? <IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> : <IconCheck className="mr-2 h-4 w-4" />}
                  Mulai Impor ({stats.ready})
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="rounded-2xl border bg-emerald-50/30 p-4 flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
                    <IconCheck size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-tight">Data Valid</p>
                    <p className="text-2xl font-black text-emerald-700">{stats.ready}</p>
                  </div>
                </div>
                <div className="rounded-2xl border bg-amber-50/30 p-4 flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm">
                    <IconAlertTriangle size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-tight">Duplikat</p>
                    <p className="text-2xl font-black text-amber-700">{stats.duplicate}</p>
                  </div>
                </div>
                <div className="rounded-2xl border bg-rose-50/30 p-4 flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-sm">
                    <IconX size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-tight">Invalid</p>
                    <p className="text-2xl font-black text-rose-700">{stats.invalid}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                    <tr>
                      <th className="h-12 px-6 text-left font-bold text-slate-600 dark:text-slate-400">
                        {importType === 'mahasiswa' ? 'NIM' : 'NIP'}
                      </th>
                      <th className="h-12 px-6 text-left font-bold text-slate-600 dark:text-slate-400">Nama Lengkap</th>
                      <th className="h-12 px-6 text-left font-bold text-slate-600 dark:text-slate-400">Email</th>
                      <th className="h-12 px-6 text-left font-bold text-slate-600 dark:text-slate-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {parsedData.map((row, i) => (
                      <tr key={i} className={cn(
                        "transition-colors",
                        row.status === 'duplicate' && "bg-amber-50/30",
                        row.status === 'invalid' && "bg-rose-50/30",
                        row.status === 'ready' && "hover:bg-slate-50/50"
                      )}>
                        <td className="px-6 py-4 font-mono text-xs">{row.identifier}</td>
                        <td className="px-6 py-4 font-medium text-slate-900">{row.name}</td>
                        <td className="px-6 py-4 text-slate-500">{row.email || '-'}</td>
                        <td className="px-6 py-4">
                          {row.status === 'ready' && (
                            <Badge className="bg-emerald-500 hover:bg-emerald-600">Siap Impor</Badge>
                          )}
                          {row.status === 'duplicate' && (
                            <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Duplikat</Badge>
                          )}
                          {row.status === 'invalid' && (
                            <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50">{row.error || 'Invalid'}</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Import History */}
      <Card className="border-none shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Riwayat Impor Terbaru</CardTitle>
          <IconFileSpreadsheet size={20} className="text-slate-300" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
             <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/30">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white shadow-sm text-indigo-600 border border-slate-100">
                    <IconFileSpreadsheet size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Belum ada riwayat impor aktif</p>
                    <p className="text-xs text-slate-500">Log aktivitas impor Anda akan muncul di sini.</p>
                  </div>
                </div>
              </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
