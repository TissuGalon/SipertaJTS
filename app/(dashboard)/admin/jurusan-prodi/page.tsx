"use client";

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { 
  IconPlus,
  IconEdit,
  IconTrash,
  IconSchool,
  IconBuildingCommunity,
  IconLoader2,
  IconChecks,
  IconChevronRight
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { motion, AnimatePresence } from 'framer-motion';

export default function JurusanProdiPage() {
  const [jurusans, setJurusans] = useState<any[]>([]);
  const [prodis, setProdis] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJurusanId, setSelectedJurusanId] = useState<string | null>(null);

  // Dialog States
  const [isJurusanDialogOpen, setIsJurusanDialogOpen] = useState(false);
  const [isProdiDialogOpen, setIsProdiDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form States
  const [editingJurusan, setEditingJurusan] = useState<any>(null);
  const [editingProdi, setEditingProdi] = useState<any>(null);
  const [jurusanData, setJurusanData] = useState({ name: '', description: '' });
  const [prodiData, setProdiData] = useState({ code: '', name: '', alias: '', jurusan_id: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: jurusanData, error: jurusanError } = await supabase
        .from('jurusan')
        .select('*')
        .order('name');
      
      const { data: prodiData, error: prodiError } = await supabase
        .from('prodi')
        .select('*')
        .order('name');

      if (jurusanError) throw jurusanError;
      if (prodiError) throw prodiError;

      setJurusans(jurusanData || []);
      setProdis(prodiData || []);
      
      if (jurusanData && jurusanData.length > 0 && !selectedJurusanId) {
        setSelectedJurusanId(jurusanData[0].id);
      }
    } catch (error: any) {
      toast.error("Gagal mengambil data", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Jurusan Actions
  const handleOpenJurusanDialog = (jurusan: any = null) => {
    if (jurusan) {
      setEditingJurusan(jurusan);
      setJurusanData({ name: jurusan.name, description: jurusan.description || '' });
    } else {
      setEditingJurusan(null);
      setJurusanData({ name: '', description: '' });
    }
    setIsJurusanDialogOpen(true);
  };

  const saveJurusan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingJurusan) {
        const { error } = await supabase
          .from('jurusan')
          .update(jurusanData)
          .eq('id', editingJurusan.id);
        if (error) throw error;
        toast.success("Jurusan diperbarui");
      } else {
        const { error } = await supabase
          .from('jurusan')
          .insert(jurusanData);
        if (error) throw error;
        toast.success("Jurusan ditambahkan");
      }
      setIsJurusanDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error("Gagal menyimpan jurusan", { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteJurusan = async (id: string) => {
    if (!confirm("Hapus jurusan ini? Semua prodi di bawahnya juga akan dihapus.")) return;
    try {
      const { error } = await supabase.from('jurusan').delete().eq('id', id);
      if (error) throw error;
      toast.success("Jurusan dihapus");
      fetchData();
    } catch (error: any) {
      toast.error("Gagal menghapus jurusan", { description: error.message });
    }
  };

  // Prodi Actions
  const handleOpenProdiDialog = (prodi: any = null) => {
    if (prodi) {
      setEditingProdi(prodi);
      setProdiData({ 
        code: prodi.code, 
        name: prodi.name, 
        alias: prodi.alias || '', 
        jurusan_id: prodi.jurusan_id 
      });
    } else {
      setEditingProdi(null);
      setProdiData({ 
        code: '', 
        name: '', 
        alias: '', 
        jurusan_id: selectedJurusanId || '' 
      });
    }
    setIsProdiDialogOpen(true);
  };

  const saveProdi = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingProdi) {
        const { error } = await supabase
          .from('prodi')
          .update(prodiData)
          .eq('id', editingProdi.id);
        if (error) throw error;
        toast.success("Prodi diperbarui");
      } else {
        const { error } = await supabase
          .from('prodi')
          .insert(prodiData);
        if (error) throw error;
        toast.success("Prodi ditambahkan");
      }
      setIsProdiDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error("Gagal menyimpan prodi", { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteProdi = async (id: string) => {
    if (!confirm("Hapus prodi ini?")) return;
    try {
      const { error } = await supabase.from('prodi').delete().eq('id', id);
      if (error) throw error;
      toast.success("Prodi dihapus");
      fetchData();
    } catch (error: any) {
      toast.error("Gagal menghapus prodi", { description: error.message });
    }
  };

  const filteredProdis = prodis.filter(p => p.jurusan_id === selectedJurusanId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Kelola Jurusan & Prodi</h2>
          <p className="text-slate-500 dark:text-slate-400">Atur struktur akademik departemen dan program studi.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Jurusan List (Left Sidebar Style) */}
        <div className="md:col-span-4 space-y-4">
          <Card className="border-none shadow-md overflow-hidden bg-white/50 backdrop-blur-md dark:bg-slate-900/50">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Daftar Jurusan</CardTitle>
                <CardDescription>Pilih jurusan untuk kelola prodi</CardDescription>
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400" onClick={() => handleOpenJurusanDialog()}>
                <IconPlus size={18} />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y dark:divide-slate-800">
                {isLoading ? (
                  <div className="p-8 flex flex-col items-center justify-center text-slate-400">
                    <IconLoader2 className="animate-spin mb-2" size={24} />
                    <span className="text-sm">Memuat data...</span>
                  </div>
                ) : jurusans.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">Belum ada data jurusan.</div>
                ) : (
                  jurusans.map((jurusan) => (
                    <div 
                      key={jurusan.id}
                      onClick={() => setSelectedJurusanId(jurusan.id)}
                      className={`group flex items-center justify-between p-4 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/40 ${selectedJurusanId === jurusan.id ? 'bg-indigo-50/50 border-r-4 border-indigo-500 dark:bg-indigo-900/20' : ''}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${selectedJurusanId === jurusan.id ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                          <IconBuildingCommunity size={20} />
                        </div>
                        <span className={`font-medium ${selectedJurusanId === jurusan.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                          {jurusan.name}
                        </span>
                      </div>
                      <div className={`flex items-center space-x-1 transition-opacity ${selectedJurusanId === jurusan.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                         <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-indigo-600" onClick={(e) => { e.stopPropagation(); handleOpenJurusanDialog(jurusan); }}>
                           <IconEdit size={16} />
                         </Button>
                         <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-red-600" onClick={(e) => { e.stopPropagation(); deleteJurusan(jurusan.id); }}>
                           <IconTrash size={16} />
                         </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Prodi List (Right Main View) */}
        <div className="md:col-span-8">
          <Card className="border-none shadow-md overflow-hidden bg-white/50 backdrop-blur-md dark:bg-slate-900/50 min-h-[400px]">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <IconSchool className="text-indigo-500" />
                  <span>Program Studi</span>
                </CardTitle>
                <CardDescription>
                  {jurusans.find(j => j.id === selectedJurusanId)?.name || 'Pilih Jurusan'}
                </CardDescription>
              </div>
              <Button 
                disabled={!selectedJurusanId}
                className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20"
                onClick={() => handleOpenProdiDialog()}
              >
                <IconPlus className="mr-2" size={18} />
                Tambah Prodi
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                  <IconLoader2 className="animate-spin mb-2" size={32} />
                  <span>Memuat data prodi...</span>
                </div>
              ) : !selectedJurusanId ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                  <IconChevronRight className="mb-2 opacity-50" size={32} />
                  <span>Pilih jurusan di samping untuk melihat prodi</span>
                </div>
              ) : filteredProdis.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                  <IconChecks className="mb-2 opacity-30" size={48} />
                  <p>Belum ada program studi di jurusan ini.</p>
                  <Button variant="link" className="text-indigo-600" onClick={() => handleOpenProdiDialog()}>
                    Tambahkan sekarang
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Kode PRODI</TableHead>
                        <TableHead>Nama Program Studi</TableHead>
                        <TableHead>Alias/Label</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProdis.map((prodi) => (
                        <TableRow key={prodi.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <TableCell className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {prodi.code}
                          </TableCell>
                          <TableCell>{prodi.name}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold dark:bg-slate-800 dark:text-slate-400">
                              {prodi.alias}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-1">
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => handleOpenProdiDialog(prodi)}>
                                <IconEdit size={16} />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => deleteProdi(prodi.id)}>
                                <IconTrash size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Jurusan Dialog */}
      <Dialog open={isJurusanDialogOpen} onOpenChange={setIsJurusanDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingJurusan ? 'Edit Jurusan' : 'Tambah Jurusan Baru'}</DialogTitle>
            <DialogDescription>
              Masukkan nama jurusan dan deskripsi singkat.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveJurusan}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="jurusan-name">Nama Jurusan</Label>
                <Input 
                  id="jurusan-name" 
                  value={jurusanData.name} 
                  onChange={(e) => setJurusanData({...jurusanData, name: e.target.value})}
                  placeholder="Mis: Teknik Sipil"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="jurusan-desc">Deskripsi</Label>
                <Input 
                  id="jurusan-desc" 
                  value={jurusanData.description} 
                  onChange={(e) => setJurusanData({...jurusanData, description: e.target.value})}
                  placeholder="Deskripsi singkat (opsional)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsJurusanDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-indigo-600">
                {isSubmitting ? <IconLoader2 className="animate-spin mr-2" /> : null}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Prodi Dialog */}
      <Dialog open={isProdiDialogOpen} onOpenChange={setIsProdiDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingProdi ? 'Edit Prodi' : 'Tambah Prodi Baru'}</DialogTitle>
            <DialogDescription>
              Lengkapi data program studi untuk jurusan pilihan.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveProdi}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="prodi-code">Kode PRODI (Internal)</Label>
                <Input 
                  id="prodi-code" 
                  value={prodiData.code} 
                  onChange={(e) => setProdiData({...prodiData, code: e.target.value})}
                  placeholder="Mis: D3_TKJJ"
                  className="font-mono"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="prodi-name">Nama Lengkap Prodi</Label>
                <Input 
                  id="prodi-name" 
                  value={prodiData.name} 
                  onChange={(e) => setProdiData({...prodiData, name: e.target.value})}
                  placeholder="Mis: D-III Teknik Konstruksi Jalan dan Jembatan"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="prodi-alias">Alias / Label</Label>
                <Input 
                  id="prodi-alias" 
                  value={prodiData.alias} 
                  onChange={(e) => setProdiData({...prodiData, alias: e.target.value})}
                  placeholder="Mis: D-III TKJJ"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsProdiDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-indigo-600">
                {isSubmitting ? <IconLoader2 className="animate-spin mr-2" /> : null}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
