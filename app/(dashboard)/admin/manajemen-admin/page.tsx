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
  IconShieldLock, 
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconUserPlus,
  IconLock,
  IconMail
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
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ManajemenAdminPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [admins, setAdmins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'admin')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdmins(data || []);
    } catch (error: any) {
      toast.error("Gagal mengambil data administrator", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAdmins = admins.filter((admin: any) => 
    admin.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    admin.nim?.includes(searchQuery) ||
    (admin.email && admin.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const identifier = formData.get('identifier') as string;
    const email = formData.get('email') as string;

    try {
      // Step 1: Create Auth Account via Edge Function
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error("Sesi tidak valid atau telah berakhir. Silakan login kembali.");
      }

      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: {
          mode: 'create',
          userData: {
            name,
            identifier,
            email: email || `${identifier}@admin.local`,
            role: 'admin'
          }
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success("Akun Admin berhasil dibuat", {
        description: `Admin "${name}" sekarang bisa login menggunakan ID Admin dan Password default.`
      });
      setIsAddDialogOpen(false);
      fetchAdmins();
    } catch (error: any) {
      toast.error("Gagal membuat akun admin", { 
        description: error.message 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ name, email })
        .eq('id', editingAdmin.id);

      if (error) throw error;

      toast.success("Data administrator berhasil diperbarui");
      setEditingAdmin(null);
      fetchAdmins();
    } catch (error: any) {
      toast.error("Gagal memperbarui data", { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (id: string, name: string) => {
    // Prevent self-deletion if we could detect the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id === id) {
      toast.error("Anda tidak dapat menghapus akun Anda sendiri.");
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus akses administrator untuk "${name}"?`)) {
      try {
        // Since we don't have a direct "delete user" in public.users that cascades well without triggering edge function
        // We'll just delete from public.users. If the edge function handles it, great.
        // Usually, deleting from auth.users via edge function is cleaner.
        
        const { data: { session } } = await supabase.auth.getSession();
        
        const { error } = await supabase.functions.invoke('manage-users', {
          body: {
            mode: 'delete',
            userId: id
          },
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });

        if (error) throw error;

        toast.success("Akses administrator berhasil dihapus");
        fetchAdmins();
      } catch (error: any) {
        toast.error("Gagal menghapus administrator", { description: error.message });
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <IconShieldLock className="h-8 w-8 text-indigo-600" />
            Manajemen Admin
          </h2>
          <p className="text-slate-500">Kelola akun administrator dengan hak akses penuh ke sistem.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none transition-all duration-300 transform hover:scale-105">
              <IconPlus className="mr-2 h-5 w-5" />
              Tambah Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] border-none shadow-2xl">
            <form onSubmit={handleAddAdmin}>
              <DialogHeader>
                <DialogTitle>Tambah Administrator Baru</DialogTitle>
                <DialogDescription>
                  Akun akan langsung aktif dan bisa digunakan untuk login.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right font-medium">Nama</Label>
                  <Input id="name" name="name" placeholder="Nama Lengkap" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="identifier" className="text-right font-medium">ID Admin</Label>
                  <Input id="identifier" name="identifier" placeholder="Username / ID" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right font-medium">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="email@example.com" className="col-span-3" required />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>Batal</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 font-semibold" disabled={isSubmitting}>
                  {isSubmitting ? "Memproses..." : "Buat Akun Admin"}
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
              <CardTitle className="text-xl">Daftar Administrator</CardTitle>
              <CardDescription>Menampilkan {filteredAdmins.length} administrator terdaftar</CardDescription>
            </div>
            <div className="relative w-full md:w-72">
              <IconSearch className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Cari Nama atau Email..." 
                className="pl-10 h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-indigo-500" 
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
                  <th className="h-12 px-6 text-left">Administrator</th>
                  <th className="h-12 px-6 text-left">ID / Username</th>
                  <th className="h-12 px-6 text-left">Kontak</th>
                  <th className="h-12 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-10 w-40 bg-slate-200 dark:bg-slate-700 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-6 w-20 bg-slate-100 dark:bg-slate-800 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-6 w-32 bg-slate-100 dark:bg-slate-800 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-8 w-20 bg-slate-100 dark:bg-slate-800 rounded ml-auto"></div></td>
                    </tr>
                  ))
                ) : filteredAdmins.map((admin) => (
                  <tr key={admin.id} className="group hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all duration-200">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10 ring-2 ring-transparent group-hover:ring-indigo-100 dark:group-hover:ring-indigo-900 transition-all">
                          <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=${admin.name}`} alt={admin.name} />
                          <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs">
                            {admin.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 dark:text-white">{admin.name}</span>
                          <span className="text-[10px] text-slate-400 capitalize">System {admin.role}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      <code className="text-xs font-mono px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                        {admin.nim || admin.nip || 'N/A'}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-slate-600 dark:text-slate-400">
                        <IconMail size={14} className="mr-1.5 opacity-60" />
                        {admin.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                          onClick={() => setEditingAdmin(admin)}
                        >
                          <IconEdit size={18} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30"
                          onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                        >
                          <IconTrash size={18} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && filteredAdmins.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <IconShieldLock size={48} className="text-slate-200" />
                        <p>Tidak ada administrator yang ditemukan.</p>
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
      <Dialog open={!!editingAdmin} onOpenChange={(open) => !open && setEditingAdmin(null)}>
        <DialogContent className="sm:max-w-[425px]">
          {editingAdmin && (
            <form onSubmit={handleEditAdmin}>
              <DialogHeader>
                <DialogTitle>Edit Akun Administrator</DialogTitle>
                <DialogDescription>
                  Perbarui informasi nama dan email administrator.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right font-medium">Nama</Label>
                  <Input id="edit-name" name="name" defaultValue={editingAdmin.name} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-email" className="text-right font-medium">Email</Label>
                  <Input id="edit-email" name="email" type="email" defaultValue={editingAdmin.email ?? ''} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4 opacity-50">
                  <Label className="text-right font-medium">ID Admin</Label>
                  <Input value={editingAdmin.nim || editingAdmin.nip || ''} className="col-span-3" disabled />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setEditingAdmin(null)} disabled={isSubmitting}>Batal</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={isSubmitting}>
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
