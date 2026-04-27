"use client";

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { IconUser, IconSchool, IconPhone, IconBadge, IconMail } from '@tabler/icons-react';

interface ProfileEditorProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onUpdate: () => void;
}

export function ProfileEditor({ isOpen, onClose, userId, onUpdate }: ProfileEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    gelar: '',
    phone: '',
    nip: '',
    email: '',
    prodi: ''
  });

  useEffect(() => {
    if (isOpen && userId) {
      fetchProfile();
    }
  }, [isOpen, userId]);

  const fetchProfile = async () => {
    if (!userId || userId === 'undefined') return;
    setIsFetching(true);
    try {
      const { data, error } = await supabase
        .from('dosen')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setFormData({
          name: data.name || '',
          gelar: data.gelar || '',
          phone: data.hp || '',
          nip: data.nip || '',
          email: data.email || '',
          prodi: data.prodi || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || userId === 'undefined') {
      toast.error("ID Pengguna tidak valid");
      return;
    }
    setIsSubmitting(true);
    try {
      // 1. Update molten dosen table
      const { error: dosenError } = await supabase
        .from('dosen')
        .update({
          name: formData.name,
          gelar: formData.gelar,
          hp: formData.phone,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (dosenError) throw dosenError;

      // 2. Sync with users table for consistency
      const { error: userError } = await supabase
        .from('users')
        .update({ 
          name: formData.name,
          hp: formData.phone,
        })
        .eq('id', userId);
      
      if (userError) throw userError;

      toast.success('Profil berhasil diperbarui dan disinkronkan');
      onUpdate();
      onClose();
    } catch (error: any) {
      toast.error('Gagal memperbarui profil: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">Lengkapi Profil Koordinator</DialogTitle>
          <DialogDescription>
            Informasi ini akan tercantum pada setiap surat yang Anda verifikasi.
          </DialogDescription>
        </DialogHeader>

        {isFetching ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Sinkronisasi Data...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-wider text-slate-500">Nama Lengkap (Sesuai KTP)</Label>
                <div className="relative group">
                  <IconUser className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="pl-10 h-11 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gelar" className="text-[10px] font-black uppercase tracking-wider text-slate-500">Gelar Akademik</Label>
                <div className="relative group">
                  <IconBadge className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <Input 
                    id="gelar" 
                    value={formData.gelar} 
                    onChange={(e) => setFormData({...formData, gelar: e.target.value})}
                    placeholder="S.T., M.T."
                    className="pl-10 h-11 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-wider text-slate-500">Nomor WhatsApp</Label>
                <div className="relative group">
                  <IconPhone className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  <Input 
                    id="phone" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="0812..."
                    className="pl-10 h-11 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400">NIP / Identitas</Label>
                <div className="relative">
                  <IconSchool className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    value={formData.nip} 
                    disabled
                    className="pl-10 h-11 bg-slate-100 dark:bg-slate-800 border-none rounded-xl opacity-60 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Program Studi</Label>
                <div className="relative">
                  <IconSchool className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    value={formData.prodi} 
                    disabled
                    className="pl-10 h-11 bg-slate-100 dark:bg-slate-800 border-none rounded-xl opacity-60 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="sm:col-span-2 space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Email Institusi</Label>
                <div className="relative">
                  <IconMail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    value={formData.email} 
                    disabled
                    className="pl-10 h-11 bg-slate-100 dark:bg-slate-800 border-none rounded-xl opacity-60 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-6 gap-3">
              <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl flex-1">Batal</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-10 rounded-xl shadow-xl shadow-indigo-600/20 flex-[2] h-12 transition-all active:scale-95">
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>Menyimpan...</span>
                  </div>
                ) : 'Simpan & Sinkronkan'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
