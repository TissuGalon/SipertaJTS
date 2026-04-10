"use client";

import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { mockLecturers } from '@/lib/mock-data';
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
  const [lecturers, setLecturers] = useState(mockLecturers);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingLecturer, setEditingLecturer] = useState<any>(null);

  const filteredLecturers = lecturers.filter(lecturer => 
    lecturer.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    lecturer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lecturer.id.includes(searchQuery)
  );

  const handleAddLecturer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newLecturer = {
      id: `l${lecturers.length + 1}`,
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      role: 'dosen' as const,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.get('name')}`,
    };
    
    setLecturers([newLecturer, ...lecturers]);
    setIsAddDialogOpen(false);
    toast.success("Data dosen berhasil ditambahkan");
  };

  const handleEditLecturer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updatedLecturer = {
      ...editingLecturer,
      name: formData.get('name') as string,
      email: formData.get('email') as string,
    };
    
    setLecturers(prev => prev.map(l => l.id === editingLecturer.id ? updatedLecturer : l));
    setEditingLecturer(null);
    toast.success("Data dosen berhasil diperbarui");
  };

  const handleDeleteLecturer = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus data ini?")) {
      setLecturers(prev => prev.filter(l => l.id !== id));
      toast.success("Data dosen berhasil dihapus");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Data Dosen</h2>
          <p className="text-slate-500">Kelola informasi dan akun dosen pendidik.</p>
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
                  Masukkan detail dosen baru di bawah ini. Klik simpan setelah selesai.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right font-medium">Nama</Label>
                  <Input id="name" name="name" placeholder="Nama Lengkap & Gelar" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right font-medium">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="nama@pnl.ac.id" className="col-span-3" required />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsAddDialogOpen(false)}>Batal</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Simpan</Button>
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
                placeholder="Cari Nama atau Email..." 
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
                  <th className="h-12 px-6 text-left">ID / NIP</th>
                  <th className="h-12 px-6 text-left">Email</th>
                  <th className="h-12 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLecturers.map((lecturer) => (
                  <tr key={lecturer.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-all duration-200">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10 ring-2 ring-transparent group-hover:ring-emerald-100 dark:group-hover:ring-emerald-900 transition-all">
                          <AvatarImage src={lecturer.avatar} alt={lecturer.name} />
                          <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                            {lecturer.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-slate-900 dark:text-white">{lecturer.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      <code className="text-xs font-mono px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                        {lecturer.id}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {lecturer.email}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center space-x-2">
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
                          onClick={() => handleDeleteLecturer(lecturer.id)}
                        >
                          <IconTrash size={18} />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <IconDotsVertical size={18} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Jadwal Bimbingan</DropdownMenuItem>
                            <DropdownMenuItem>Verifikasi Berkas</DropdownMenuItem>
                            <DropdownMenuItem className="text-rose-500">Nonaktifkan</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredLecturers.length === 0 && (
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
                  <Label htmlFor="edit-email" className="text-right font-medium">Email</Label>
                  <Input id="edit-email" name="email" type="email" defaultValue={editingLecturer.email} className="col-span-3" required />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setEditingLecturer(null)}>Batal</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Simpan Perubahan</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
