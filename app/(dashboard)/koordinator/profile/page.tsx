"use client";

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { 
  IconUser, 
  IconSchool, 
  IconPhone, 
  IconBadge, 
  IconMail, 
  IconId,
  IconClock,
  IconCheck,
  IconUserEdit,
  IconLogout,
  IconShieldCheck
} from '@tabler/icons-react';
import { ProfileEditor } from '@/components/koordinator/profile-editor';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function KoordinatorProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);

      // Fetch Dosen Profile
      const { data: profileData } = await supabase
        .from('dosen')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      setProfile(profileData);

      // Fetch Verification Stats
      const { count: approvedCount } = await supabase
        .from('letter_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'disetujui_koordinator');
      
      const { count: totalCount } = await supabase
        .from('letter_requests')
        .select('*', { count: 'exact', head: true });

      setStats({
        approved: approvedCount || 0,
        total: totalCount || 0,
        lastLogin: user.last_sign_in_at
      });

    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    toast.success('Berhasil keluar sistem');
  };

  if (isLoading) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        <p className="text-sm font-bold text-slate-500">Memuat profil...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 px-4">
      <ProfileEditor 
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        userId={currentUser?.id}
        onUpdate={fetchProfileData}
      />

      {/* Header Profile */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[3rem] blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
        <Card className="relative border-none shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[3rem] overflow-hidden">
          <CardContent className="p-10">
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="relative">
                <div className="h-40 w-40 rounded-[2.5rem] bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner group-hover:rotate-3 transition-transform duration-500">
                  <IconUser size={80} stroke={1.5} />
                </div>
                <div className="absolute -bottom-2 -right-2 h-12 w-12 rounded-2xl bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center text-emerald-500">
                  <IconShieldCheck size={28} />
                </div>
              </div>
              
              <div className="flex-1 text-center md:text-left space-y-4">
                <div>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                      {profile?.name}
                    </h1>
                    {profile?.gelar && (
                      <span className="px-4 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-black tracking-wide">
                        {profile.gelar}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 font-bold text-lg flex items-center justify-center md:justify-start gap-2">
                    <IconBadge size={20} className="text-indigo-400" />
                    Koordinator {profile?.prodi}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                  <Button 
                    onClick={() => setIsEditorOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl px-6 h-12 transition-all hover:shadow-lg hover:shadow-indigo-500/20"
                  >
                    <IconUserEdit className="mr-2 h-5 w-5" />
                    Lengkapi Profil
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleLogout}
                    className="border-red-100 text-red-500 hover:bg-red-50 font-black rounded-2xl px-6 h-12"
                  >
                    <IconLogout className="mr-2 h-5 w-5" />
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Detail Informasi */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-black flex items-center gap-2">
                <IconId className="text-indigo-500" /> Informasi Pribadi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">NIP / Identitas</Label>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400">
                      <IconSchool size={20} />
                    </div>
                    <p className="font-bold text-slate-700 dark:text-slate-300">{profile?.nip || '-'}</p>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Institusi</Label>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400">
                      <IconMail size={20} />
                    </div>
                    <p className="font-bold text-slate-700 dark:text-slate-300">{profile?.email || '-'}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nomor WhatsApp</Label>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-emerald-500">
                      <IconPhone size={20} />
                    </div>
                    <p className="font-bold text-slate-700 dark:text-slate-300">{profile?.hp || '-'}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Login Terakhir</Label>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400">
                      <IconClock size={20} />
                    </div>
                    <p className="font-bold text-slate-700 dark:text-slate-300">
                      {stats?.lastLogin ? new Date(stats.lastLogin).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistik Ringkas */}
        <div className="space-y-8">
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-indigo-600 text-white overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-black">Statistik Verifikasi</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-6">
              <div className="space-y-4">
                <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-md">
                  <p className="text-indigo-100 text-xs font-black uppercase tracking-widest mb-1">Total Setuju</p>
                  <div className="flex items-end gap-2">
                    <h3 className="text-4xl font-black">{stats?.approved}</h3>
                    <p className="text-indigo-200 text-sm font-bold pb-1 mb-1">Pengajuan</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-5 rounded-3xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center">
                      <IconCheck size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-100">Rating Kepatuhan</p>
                      <p className="text-base font-black">Sangat Baik</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-[2.5rem] bg-slate-50 dark:bg-slate-800/40 overflow-hidden">
            <CardContent className="p-8 text-center space-y-4">
              <div className="h-20 w-20 mx-auto rounded-3xl bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center text-slate-400">
                <IconShieldCheck size={40} />
              </div>
              <div>
                <h4 className="font-black text-slate-900 dark:text-white">Akun Terverifikasi</h4>
                <p className="text-slate-500 text-sm font-medium mt-1">Hak akses Anda sebagai Koordinator Program Studi telah aktif.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
