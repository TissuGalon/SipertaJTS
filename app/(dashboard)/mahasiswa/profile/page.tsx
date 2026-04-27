
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  IconUser, 
  IconId, 
  IconMail, 
  IconSchool, 
  IconPhone, 
  IconHash,
  IconDeviceFloppy,
  IconLoader2,
  IconLock,
  IconAlertCircle,
  IconArrowLeft
} from '@tabler/icons-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { PRODI_LABELS, ProdiType } from '@/types';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function StudentProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    new: '',
    confirm: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('mahasiswa')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (!data) {
        // Fallback to unified users table
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(userData || { name: '', nim: '', email: user.email });
      } else {
        setProfile(data);
      }
    } catch (error: any) {
      toast.error("Gagal memuat profil", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi tidak valid");

      // Update mahasiswa table
      const { error: mhsError } = await supabase
        .from('mahasiswa')
        .update({
          name: profile.name,
          prodi: profile.prodi,
          semester: profile.semester ? parseInt(profile.semester) : null,
          hp: profile.hp,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (mhsError) throw mhsError;

      // Update unified users table
      await supabase
        .from('users')
        .update({
          name: profile.name,
          prodi: profile.prodi,
          hp: profile.hp,
          semester: profile.semester ? parseInt(profile.semester) : null,
        })
        .eq('id', user.id);

      toast.success("Profil berhasil diperbarui");
      router.refresh(); // Refresh server components
      fetchProfile(); // Refresh local state
    } catch (error: any) {
      toast.error("Gagal memperbarui profil", { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new
      });

      if (error) throw error;

      toast.success("Password berhasil diperbarui");
      setPasswords({ new: '', confirm: '' });
    } catch (error: any) {
      toast.error("Gagal memperbarui password", { description: error.message });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <IconLoader2 className="h-10 w-10 animate-spin text-indigo-600" />
        <p className="text-slate-500 font-medium anim-pulse">Memuat profil...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/mahasiswa/dashboard">
            <Button variant="ghost" size="icon" className="rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800">
              <IconArrowLeft size={18} />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Profil Mahasiswa</h2>
            <p className="text-slate-500 font-medium">Kelola informasi diri Anda untuk keperluan surat menyurat.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Visual & Status */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl overflow-hidden bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
            <div className="h-32 bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-800 relative">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            </div>
            <CardContent className="relative pt-0 flex flex-col items-center">
              <div className="-mt-16 relative">
                <div className="h-32 w-32 rounded-3xl bg-white dark:bg-slate-800 p-1 shadow-2xl rotate-3 transform transition-transform hover:rotate-0 duration-500">
                  <div className="h-full w-full rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-indigo-600">
                    <IconUser size={64} stroke={1.5} />
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-emerald-500 border-4 border-white dark:border-slate-900 shadow-lg" />
              </div>
              
              <div className="mt-6 text-center space-y-1">
                <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                  {profile.name}
                </h3>
                <p className="text-sm font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full inline-block">
                  {profile.nim}
                </p>
              </div>

              <div className="w-full mt-8 grid grid-cols-2 gap-4">
                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl text-center">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Status</p>
                  <p className="text-sm font-bold text-indigo-900 dark:text-indigo-300">Aktif</p>
                </div>
                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-2xl text-center">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Peran</p>
                  <p className="text-sm font-bold text-emerald-900 dark:text-emerald-300">Mahasiswa</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30">
            <CardContent className="p-4 flex items-start space-x-3">
              <IconAlertCircle className="text-indigo-600 shrink-0 mt-0.5" size={18} />
              <p className="text-xs text-indigo-800 dark:text-indigo-400 leading-relaxed font-medium">
                Pastikan data profil Anda benar. Data ini akan otomatis digunakan saat Anda mengisi form pengajuan surat.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Forms */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl transition-all hover:bg-white dark:hover:bg-slate-900">
            <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/50 px-8 py-6">
              <CardTitle className="text-xl font-bold flex items-center">
                <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center mr-3">
                   <IconUser size={18} />
                </div>
                Informasi Personal
              </CardTitle>
            </CardHeader>
            <form onSubmit={handleUpdateProfile}>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    <Label htmlFor="name" className="text-xs font-black uppercase tracking-wider text-slate-500">Nama Lengkap</Label>
                    <div className="relative group">
                      <IconUser className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      <Input 
                        id="name" 
                        value={profile.name} 
                        onChange={(e) => setProfile({...profile, name: e.target.value})}
                        className="pl-10 h-11 rounded-xl bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                        placeholder="Nama Lengkap sesuai KTM"
                      />
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="nim" className="text-xs font-black uppercase tracking-wider text-slate-500">NIM (Nomor Induk Mahasiswa)</Label>
                    <div className="relative">
                      <IconId className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input 
                        id="nim" 
                        value={profile.nim} 
                        className="pl-10 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 border-none cursor-not-allowed opacity-70"
                        disabled
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 italic font-medium">* NIM tidak dapat diubah sendiri.</p>
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="email" className="text-xs font-black uppercase tracking-wider text-slate-500">Email Kampus / Personal</Label>
                    <div className="relative">
                      <IconMail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input 
                        id="email" 
                        value={profile.email} 
                        className="pl-10 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 border-none cursor-not-allowed opacity-70"
                        disabled
                      />
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="hp" className="text-xs font-black uppercase tracking-wider text-slate-500">No. WhatsApp / HP</Label>
                    <div className="relative group">
                      <IconPhone className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      <Input 
                        id="hp" 
                        value={profile.hp || ''} 
                        onChange={(e) => setProfile({...profile, hp: e.target.value})}
                        className="pl-10 h-11 rounded-xl bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                        placeholder="08xxxxxxxxxx"
                      />
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="prodi" className="text-xs font-black uppercase tracking-wider text-slate-500">Program Studi</Label>
                    <div className="relative group">
                      <IconSchool className="absolute left-3 top-3 h-4 w-4 text-slate-400 z-10" />
                      <Select 
                        value={profile.prodi as ProdiType} 
                        onValueChange={(v) => setProfile({...profile, prodi: v})}
                      >
                        <SelectTrigger className="pl-10 h-11 rounded-xl bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                          <SelectValue placeholder="Pilih Prodi" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-2xl">
                          {Object.entries(PRODI_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="semester" className="text-xs font-black uppercase tracking-wider text-slate-500">Semester Saat Ini</Label>
                    <div className="relative group">
                      <IconHash className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      <Input 
                        id="semester" 
                        type="number"
                        min="1"
                        max="14"
                        value={profile.semester || ''} 
                        onChange={(e) => setProfile({...profile, semester: e.target.value})}
                        className="pl-10 h-11 rounded-xl bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                        placeholder="1-8"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50/50 dark:bg-slate-800/50 p-6 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="bg-indigo-600 hover:bg-indigo-700 h-11 px-8 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all transform hover:scale-105"
                >
                  {isSaving ? (
                    <IconLoader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <IconDeviceFloppy className="mr-2 h-5 w-5" />
                  )}
                  Simpan Perubahan
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card className="border-none shadow-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
            <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/50 px-8 py-6">
              <CardTitle className="text-xl font-bold flex items-center">
                <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center mr-3">
                   <IconLock size={18} />
                </div>
                Keamanan Akun
              </CardTitle>
            </CardHeader>
            <form onSubmit={handleChangePassword}>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    <Label htmlFor="new-pass" className="text-xs font-black uppercase tracking-wider text-slate-500">Password Baru</Label>
                    <Input 
                      id="new-pass" 
                      type="password"
                      value={passwords.new}
                      onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                      className="h-11 rounded-xl bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                      placeholder="Min 6 karakter"
                      required
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="confirm-pass" className="text-xs font-black uppercase tracking-wider text-slate-500">Konfirmasi Password</Label>
                    <Input 
                      id="confirm-pass" 
                      type="password"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                      className="h-11 rounded-xl bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                      placeholder="Ulangi password baru"
                      required
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50/50 dark:bg-slate-800/50 p-6 flex justify-end">
                <Button 
                   type="submit" 
                   variant="outline"
                   disabled={isChangingPassword}
                   className="h-11 px-8 rounded-xl font-bold border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-900/30 dark:hover:bg-indigo-950/30"
                >
                  {isChangingPassword ? (
                    <IconLoader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : "Perbarui Password"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
