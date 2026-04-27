"use client";

import React, { useState, useRef, useEffect } from 'react';
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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

interface ImportData {
  identifier: string; // NIM or NIP
  name: string;
  email: string;
  degree?: string; // Gelar (for lecturers)
  status: 'pending' | 'duplicate' | 'invalid' | 'ready';
  error?: string;
}

interface ImportLog {
  id: string;
  type: string;
  filename: string;
  total_rows: number;
  success_count: number;
  error_count: number;
  created_at: string;
}

export default function BulkImportPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [importType, setImportType] = useState<'mahasiswa' | 'dosen'>('mahasiswa');
  const [parsedData, setParsedData] = useState<ImportData[]>([]);
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('import_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  if (!mounted) return null;

  // Dynamic colors based on import type to match their respective pages
  const themeClass = importType === 'mahasiswa' 
    ? {
        btn: "bg-blue-600 hover:bg-blue-700 shadow-blue-200",
        bg: "bg-blue-50 text-blue-600",
        ring: "group-hover:ring-blue-100 dark:group-hover:ring-blue-900",
        avatar: "bg-blue-100 text-blue-700",
        focus: "focus-visible:ring-blue-500"
      } 
    : {
        btn: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200",
        bg: "bg-emerald-50 text-emerald-600",
        ring: "group-hover:ring-emerald-100 dark:group-hover:ring-emerald-900",
        avatar: "bg-emerald-100 text-emerald-700",
        focus: "focus-visible:ring-emerald-500"
      };

  const stats = {
    ready: parsedData.filter(d => d.status === 'ready').length,
    duplicate: parsedData.filter(d => d.status === 'duplicate').length,
    invalid: parsedData.filter(d => d.status === 'invalid').length,
  };

  const parseCSV = (text: string): ImportData[] => {
    const lines = text.split('\n');
    const results: ImportData[] = [];
    
    // Improved CSV parsing for quoted values and different delimiters
    const parseLine = (line: string) => {
      const parts = [];
      let currentPart = "";
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if ((char === ',' || char === ';') && !inQuotes) {
          parts.push(currentPart.trim());
          currentPart = "";
        } else {
          currentPart += char;
        }
      }
      parts.push(currentPart.trim());
      return parts;
    };

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = parseLine(line);
      const [identifier, name, degree, email] = parts;
      
      if (!identifier || !name) {
        results.push({ 
          identifier: identifier || '?', 
          name: name || '?', 
          email: email || '', 
          degree: degree || '',
          status: 'invalid',
          error: 'Form Gagal: NIM/NIP dan Nama diperlukan'
        });
        continue;
      }

      results.push({ 
        identifier, 
        name, 
        degree: degree || '',
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
      toast.error("Format Tidak Didukung", { description: "Hanya file .csv yang didukung sementara ini." });
      return;
    }

    setIsLoading(true);
    setActiveFile(file);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const data = parseCSV(text);
      
      if (data.length === 0) {
        toast.error("File Kosong", { description: "Tidak ada data yang ditemukan dalam file CSV." });
        setIsLoading(false);
        return;
      }

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
        toast.success("Berhasil Memuat File", { 
          description: `Terdapat ${data.length} baris data ditemukan.` 
        });
      } catch (error) {
        toast.error("Validasi Gagal", { description: "Gagal menghubungkan ke database untuk validasi." });
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    const dataToImport = parsedData.filter(d => d.status === 'ready');
    if (dataToImport.length === 0) {
      toast.error("Proses Dibatalkan", { description: "Tidak ada data valid untuk diimport." });
      return;
    }

    setIsLoading(true);
    try {
      // 1. Get current admin ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User session not found");

      // 2. Perform Batch Insert
      const table = importType === 'mahasiswa' ? 'mahasiswa' : 'dosen';
      const keyColumn = importType === 'mahasiswa' ? 'nim' : 'nip';
      
      const rows = dataToImport.map(d => ({
        [keyColumn]: d.identifier,
        name: d.name,
        email: d.email || null,
        ...(importType === 'dosen' ? { gelar: d.degree || null } : {})
      }));

      const { error: insertError } = await supabase.from(table).insert(rows);
      if (insertError) throw insertError;

      // 3. Record Log
      await supabase.from('import_logs').insert({
        admin_id: user.id,
        type: importType,
        filename: activeFile?.name || 'unknown.csv',
        total_rows: parsedData.length,
        success_count: rows.length,
        error_count: parsedData.length - rows.length
      });

      toast.success("Impor Berhasil", { 
        description: `Berhasil mengimport ${rows.length} data ${importType}.` 
      });
      
      setIsUploaded(false);
      setParsedData([]);
      setActiveFile(null);
      fetchLogs(); // Refresh history
    } catch (error: any) {
      toast.error("Impor Gagal", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    const isDosen = importType === 'dosen';
    const identifier = isDosen ? 'NIP' : 'NIM';
    const header = isDosen ? `NIP,Nama,Gelar,Email\n` : `NIM,Nama,Email\n`;
    const example = isDosen 
      ? '19850101,Dr. Budi Santoso,M.T.,budi@example.com' 
      : '2101001,Ahmad Fauzi,ahmad@example.com';
    const blob = new Blob([header + example], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_import_${importType}.csv`;
    a.click();
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-500">
      {/* Header Alignment */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Import Data Massal</h2>
          <p className="text-slate-500">Unggah file CSV untuk mengimport data secara massal ke sistem.</p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <span className="text-sm font-medium text-slate-500 px-2">Target Impor:</span>
          <Select value={importType} onValueChange={(v: any) => setImportType(v)}>
            <SelectTrigger className={cn("w-[160px] border-none shadow-none focus:ring-0", themeClass.avatar)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mahasiswa">Data Mahasiswa</SelectItem>
              <SelectItem value="dosen">Data Dosen</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!isUploaded ? (
        <Card className={cn(
          "border-2 border-dashed transition-all duration-500 shadow-xl",
          isDragging ? "border-indigo-500 bg-indigo-50/20" : "border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm"
        )}>
          <CardContent className="flex flex-col items-center justify-center p-16 space-y-8 text-center"
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFileUpload({ target: { files: [file] } } as any);
            }}
          >
            <div className={cn("h-24 w-24 rounded-[2.5rem] flex items-center justify-center shadow-inner transition-transform duration-500 rotate-12", themeClass.bg)}>
              <IconCloudUpload size={48} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Tarik & Lepaskan File</h3>
              <p className="text-slate-500 max-w-sm mx-auto">
                Silakan pilih file <span className="font-bold text-slate-800 dark:text-slate-200 underline">.csv</span> yang berisi data {importType === 'mahasiswa' ? 'mahasiswa' : 'dosen'}.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button variant="ghost" onClick={downloadTemplate} className="hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600">
                <IconDownload size={18} className="mr-2" />
                Unduh Template .csv
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
                  size="lg"
                  className={cn("text-white px-8 transition-all duration-300 transform hover:scale-105 active:scale-95", themeClass.btn)}
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <IconLoader2 className="mr-2 h-5 w-5 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <IconSearch className="mr-2 h-5 w-5" />
                      Telusuri File
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
          <Card className="border-none shadow-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/50 pb-6 px-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className={cn("uppercase tracking-wider text-[10px] font-bold", themeClass.avatar)}>
                      {importType}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl">Pratinjau Data Impor</CardTitle>
                  <CardDescription>File: <span className="text-slate-900 font-medium underline">{activeFile?.name}</span></CardDescription>
                </div>
                <div className="flex items-center space-x-3">
                  <Button variant="ghost" className="h-11 px-6" onClick={() => setIsUploaded(false)} disabled={isLoading}>Batal</Button>
                  <Button 
                    size="lg"
                    className={cn("h-11 px-8 text-white font-semibold shadow-lg transition-all duration-300", themeClass.btn)}
                    onClick={handleImport} 
                    disabled={isLoading || stats.ready === 0}
                  >
                    {isLoading ? <IconLoader2 className="mr-2 h-5 w-5 animate-spin" /> : <IconCheck className="mr-2 h-5 w-5" />}
                    Impor {stats.ready} Data
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Stats Summary Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-b">
                <div className="p-8 flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                    <IconCheck size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Siap Impor</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.ready}</p>
                  </div>
                </div>
                <div className="p-8 flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-inner">
                    <IconAlertTriangle size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Lewati (Duplikat)</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.duplicate}</p>
                  </div>
                </div>
                <div className="p-8 flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-inner">
                    <IconX size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Invalid</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.invalid}</p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                      <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b text-slate-500 font-medium">
                    <tr>
                      <th className="h-14 px-8 text-left">Profil {importType === 'dosen' && "/ Gelar"}</th>
                      <th className="h-14 px-8 text-left uppercase tracking-tight">{importType === 'mahasiswa' ? 'NIM' : 'NIP'}</th>
                      <th className="h-14 px-8 text-left">Email</th>
                      <th className="h-14 px-8 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {parsedData.map((row, i) => (
                      <tr key={i} className={cn(
                        "group transition-all duration-200",
                        row.status === 'duplicate' && "bg-amber-50/20",
                        row.status === 'invalid' && "bg-rose-50/20",
                        row.status === 'ready' && "hover:bg-slate-50/80 dark:hover:bg-slate-800/80"
                      )}>
                        <td className="px-8 py-5">
                          <div className="flex items-center space-x-3">
                            <Avatar className={cn("h-10 w-10 ring-2 ring-transparent transition-all", themeClass.ring)}>
                              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${row.name}`} />
                              <AvatarFallback className={themeClass.avatar}>
                                {row.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-900 dark:text-white leading-none">{row.name}</span>
                              {row.degree && <span className="text-[10px] text-indigo-600 font-bold mt-1 uppercase tracking-tight">{row.degree}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <code className="text-xs font-mono px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                            {row.identifier}
                          </code>
                        </td>
                        <td className="px-8 py-5 text-slate-500 italic">{row.email || 'tidak ada email'}</td>
                        <td className="px-8 py-5">
                          {row.status === 'ready' && (
                            <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none px-3 py-1">Siap Impor</Badge>
                          )}
                          {row.status === 'duplicate' && (
                            <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 px-3 py-1">Akan Dilewati</Badge>
                          )}
                          {row.status === 'invalid' && (
                            <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50 px-3 py-1">{row.error || 'Data Error'}</Badge>
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
      <Card className="border-none shadow-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <div>
            <CardTitle className="text-xl">Riwayat Aktivitas Impor</CardTitle>
            <CardDescription>Daftar aktivitas impor massal yang pernah dilakukan.</CardDescription>
          </div>
          <IconFileSpreadsheet size={24} className="text-slate-300" />
        </CardHeader>
        <CardContent className="p-0">
          {logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b text-slate-500 font-medium">
                  <tr>
                    <th className="h-12 px-8 text-left">Tanggal</th>
                    <th className="h-12 px-8 text-left">Tipe</th>
                    <th className="h-12 px-8 text-left">Nama File</th>
                    <th className="h-12 px-8 text-right">Statistik</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-900 dark:text-slate-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-8 py-4 whitespace-nowrap">
                        <div className="font-medium">{new Date(log.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                        <div className="text-[10px] text-slate-400 font-mono uppercase">{new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="px-8 py-4">
                        <Badge className={cn(
                          "uppercase text-[10px] font-bold px-2",
                          log.type === 'mahasiswa' ? "bg-blue-100 text-blue-700 hover:bg-blue-100" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                        )}>
                          {log.type}
                        </Badge>
                      </td>
                      <td className="px-8 py-4 font-medium text-slate-500 truncate max-w-[200px]">{log.filename}</td>
                      <td className="px-8 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-bold whitespace-nowrap">
                            <span className="text-emerald-500">{log.success_count}</span>
                            <span className="text-slate-300"> / </span>
                            <span className="text-slate-500">{log.total_rows}</span>
                          </span>
                          <span className="text-[10px] text-slate-400">Berhasil diimpor</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 border-2 border-dotted rounded-3xl border-slate-100 dark:border-slate-800 m-8">
              <div className="h-16 w-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-300">
                <IconFileSpreadsheet size={32} />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-900 dark:text-white">Belum Ada Riwayat Tersedia</p>
                <p className="text-xs text-slate-500 mt-1">Log aktivitas impor Anda akan tercatat secara otomatis di sini.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
