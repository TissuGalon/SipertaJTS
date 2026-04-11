"use client";

export const dynamic = 'force-dynamic';

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
  IconUsers, 
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconDotsVertical,
  IconUserPlus,
  IconSchool
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function DataDosenPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingLecturer, setEditingLecturer] = useState<any>(null);

  useEffect(() => {
    fetchLecturers();
  }, []);

  const fetchLecturers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('dosen')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLecturers(data || []);
    } catch (error: any) {
      toast.error("Gagal mengambil data dosen", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLecturers = lecturers.filter((lecturer: any) => 
    lecturer.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (lecturer.email && lecturer.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    lecturer.nip?.includes(searchQuery)
  );

  const handleAddLecturer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const nip = formData.get('nip') as string;
    const email = formData.get('email') as string;

    try {
      const { error } = await supabase
        .from('dosen')
        .insert([{ name, nip, email }]);

      if (error) throw error;

      toast.success("Dosen berhasil ditambahkan", {
        description: `Data dosen "${name}" telah disimpan.`
      });
      setIsAddDialogOpen(false);
      fetchLecturers();
    } catch (error: any) {
      toast.error("Gagal menambahkan dosen", { 
        description: error.message.includes('unique') 
          ? "NIP sudah terdaftar" 
          : error.message 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditLecturer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const nip = formData.get('nip') as string;
    
    try {
      const { error } = await supabase
        .from('dosen')
        .update({ name, email, nip })
        .eq('id', editingLecturer.id);

      if (error) throw error;

      toast.success("Data dosen berhasil diperbarui");
      setEditingLecturer(null);
      fetchLecturers();
    } catch (error: any) {
      toast.error("Gagal memperbarui data", { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLecturer = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data dosen "${name}"?`)) {
      try {
        const { error } = await supabase
          .from('dosen')
          .delete()
          .eq('id', id);

        if (error) throw error;

        toast.success("Data dosen berhasil dihapus");
        fetchLecturers();
      } catch (error: any) {
        toast.error("Gagal menghapus data", { description: error.message });
      }
    }
  };

  const handleActivateAccount = async (lecturer: any) => {
    if (!confirm(`Aktifkan akun login untuk ${lecturer.name}?`)) return;
    
    setIsLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error("Sesi tidak valid atau telah berakhir. Silakan login kembali.");
      }

      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: {
          mode: 'create',
          userData: {
            name: lecturer.name,
            identifier: lecturer.nip,
            email: lecturer.email || `${lecturer.nip}@siperta.local`,
            role: 'dosen'
          }
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success("Akun berhasil diaktifkan", {
        description: `Dosen sekarang bisa login menggunakan NIP dan Password default: ${lecturer.nip}`
      });
      fetchLecturers();
    } catch (error: any) {
      toast.error("Gagal mengaktifkan akun", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Data Dosen</h2>
          <p className="text-slate-500">Kelola informasi profil dosen pendidik.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 dark:shadow-none transition-all duration-300 transform hover:scale-105">
              <IconUserPlus className="mr-2 h-5 w-5" />
              Tambah Dosen
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] border-none shadow-2xl">
            <form onSubmit={handleAddLecturer}>
              <DialogHeader>
                <DialogTitle>Tambah Dosen Baru</DialogTitle>
                <DialogDescription>
                  Masukkan detail dosen baru. Data ini disimpan sebagai profil, bukan akun login.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right font-medium">Nama</Label>
                  <Input id="name" name="name" placeholder="Nama Lengkap & Gelar" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="nip" className="text-right font-medium">NIP</Label>
                  <Input id="nip" name="nip" placeholder="NIP / ID Dosen" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right font-medium">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="Optional" className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>Batal</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 font-semibold" disabled={isSubmitting}>
                  {isSubmitting ? "Menyimpan..." : "Simpan Data"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm overflow-hidden">
        <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Daftar Dosen</CardTitle>
              <CardDescription>Menampilkan {filteredLecturers.length} dosen terdaftar</CardDescription>
            </div>
            <div className="relative w-full md:w-72">
              <IconSearch className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Cari Nama atau NIP..." 
                className="pl-10 h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-emerald-500" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b text-slate-500 font-medium">
                <tr>
                  <th className="h-12 px-6 text-left">Dosen</th>
                  <th className="h-12 px-6 text-left">NIP</th>
                  <th className="h-12 px-6 text-left">Status Akun</th>
                  <th className="h-12 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-10 w-40 bg-slate-200 dark:bg-slate-700 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-6 w-20 bg-slate-100 dark:bg-slate-800 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-6 w-24 bg-slate-100 dark:bg-slate-800 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-8 w-20 bg-slate-100 dark:bg-slate-800 rounded ml-auto"></div></td>
                    </tr>
                  ))
                ) : filteredLecturers.map((lecturer) => (
                  <tr key={lecturer.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-all duration-200">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10 ring-2 ring-transparent group-hover:ring-emerald-100 dark:group-hover:ring-emerald-900 transition-all">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${lecturer.name}`} alt={lecturer.name} />
                          <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                            {lecturer.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-slate-900 dark:text-white">{lecturer.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      <code className="text-xs font-mono px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                        {lecturer.nip}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      {lecturer.user_id ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          Belum Aktif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center space-x-2">
                        {!lecturer.user_id && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-xs bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-600 hover:text-white transition-colors"
                            onClick={() => handleActivateAccount(lecturer)}
                          >
                            Aktifkan Akun
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                          onClick={() => setEditingLecturer(lecturer)}
                        >
                          <IconEdit size={18} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30"
                          onClick={() => handleDeleteLecturer(lecturer.id, lecturer.name)}
                        >
                          <IconTrash size={18} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && filteredLecturers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <IconSchool size={48} className="text-slate-200" />
                        <p>Tidak ada data dosen yang ditemukan.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingLecturer} onOpenChange={(open) => !open && setEditingLecturer(null)}>
        <DialogContent className="sm:max-w-[425px]">
          {editingLecturer && (
            <form onSubmit={handleEditLecturer}>
              <DialogHeader>
                <DialogTitle>Edit Data Dosen</DialogTitle>
                <DialogDescription>
                  Perbarui informasi profil dosen di sini.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right font-medium">Nama</Label>
                  <Input id="edit-name" name="name" defaultValue={editingLecturer.name} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-nip" className="text-right font-medium">NIP</Label>
                  <Input id="edit-nip" name="nip" defaultValue={editingLecturer.nip ?? ''} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-email" className="text-right font-medium">Email</Label>
                  <Input id="edit-email" name="email" type="email" defaultValue={editingLecturer.email ?? ''} className="col-span-3" required />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setEditingLecturer(null)} disabled={isSubmitting}>Batal</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting}>
                  {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
