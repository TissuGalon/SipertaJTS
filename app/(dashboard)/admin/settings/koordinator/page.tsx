"use client";

import React, { useState, useEffect } from 'react';
import { 
  IconUserCheck, 
  IconUserOff, 
  IconSettings, 
  IconSearch,
  IconFilter,
  IconCheck,
  IconX,
  IconAlertCircle
} from '@tabler/icons-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { LetterType, LETTER_TYPE_LABELS } from '@/types';

interface DosenWithSettings {
  id: string;
  name: string;
  nip: string;
  email: string;
  prodi: string;
  settings?: {
    is_enabled: boolean;
    visible_letter_types: string[];
    prodi_setting: string;
  };
}

const PRODI_OPTIONS = [
  { value: 'all', label: 'Semua Prodi' },
  { value: 'D-III TKJJ', label: 'D-III TKJJ' },
  { value: 'D-III TKBA', label: 'D-III TKBA' },
  { value: 'D-IV TRKJJ', label: 'D-IV TRKJJ' },
  { value: 'D-IV TRKBG', label: 'D-IV TRKBG' },
];

const LETTER_TYPES: LetterType[] = [
  'surat_undangan_seminar',
  'surat_undangan_sidang',
  'surat_permohonan_magang',
  'surat_tugas_magang',
  'surat_aktif_kuliah',
  'surat_izin_penelitian'
];

export default function CoordinatorSettingsPage() {
  const [dosenList, setDosenList] = useState<DosenWithSettings[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDosen, setSelectedDosen] = useState<DosenWithSettings | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Modal State
  const [modalEnabled, setModalEnabled] = useState(true);
  const [modalProdi, setModalProdi] = useState('all');
  const [modalLetters, setModalLetters] = useState<string[]>([]);



  useEffect(() => {
    fetchDosenWithSettings();
  }, []);

  const fetchDosenWithSettings = async () => {
    setIsLoading(true);
    try {
      // Fetch users with role 'dosen'
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, name, nip, email, prodi')
        .eq('role', 'dosen')
        .order('name');

      if (userError) throw userError;

      // Fetch settings
      const { data: settings, error: settingsError } = await supabase
        .from('dosen_dashboard_settings')
        .select('*');

      if (settingsError) throw settingsError;

      const combinedData: DosenWithSettings[] = (users || []).map((user: any) => {
        const userSetting = settings?.find((s: any) => s.dosen_user_id === user.id);
        return {
          ...user,
          settings: userSetting ? {
            is_enabled: userSetting.is_enabled,
            visible_letter_types: userSetting.visible_letter_types || [],
            prodi_setting: userSetting.prodi || 'all'
          } : undefined
        };
      });

      setDosenList(combinedData);
    } catch (error: any) {
      toast.error(`Gagal memuat data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenSettings = (dosen: DosenWithSettings) => {
    setSelectedDosen(dosen);
    setModalEnabled(dosen.settings?.is_enabled ?? false);
    setModalProdi(dosen.settings?.prodi_setting ?? 'all');
    setModalLetters(dosen.settings?.visible_letter_types ?? []);
    setIsModalOpen(true);
  };

  const handleSaveSettings = async () => {
    if (!selectedDosen) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('dosen_dashboard_settings')
        .upsert({
          dosen_user_id: selectedDosen.id,
          is_enabled: modalEnabled,
          prodi: modalProdi,
          visible_letter_types: modalLetters,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'dosen_user_id,prodi' // Based on unique constraint
        });

      if (error) throw error;

      toast.success(`Pengaturan dashboard untuk ${selectedDosen.name} telah diperbarui.`);
      
      setIsModalOpen(false);
      fetchDosenWithSettings();
    } catch (error: any) {
      toast.error(`Gagal menyimpan: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleLetter = (type: string) => {
    setModalLetters(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type) 
        : [...prev, type]
    );
  };

  const filteredDosen = dosenList.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.nip.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Akses Koordinator</h1>
        <p className="text-muted-foreground">
          Kelola visibilitas dashboard dan akses jenis surat untuk Dosen Koordinator.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Koordinator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dosenList.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {dosenList.filter(d => d.settings?.is_enabled).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Nonaktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {dosenList.filter(d => !d.settings?.is_enabled).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Daftar Dosen & Pengaturan Visibilitas</CardTitle>
            <div className="relative w-72">
              <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau NIP..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dosen</TableHead>
                <TableHead>Prodi Terpilih</TableHead>
                <TableHead>Dashboard</TableHead>
                <TableHead>Jenis Surat</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Menghubungkan ke database...
                  </TableCell>
                </TableRow>
              ) : filteredDosen.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Tidak ada data dosen ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDosen.map((dosen) => (
                  <TableRow key={dosen.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{dosen.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">{dosen.nip}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {PRODI_OPTIONS.find(p => p.value === (dosen.settings?.prodi_setting || 'all'))?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {dosen.settings?.is_enabled ? (
                        <div className="flex items-center gap-1.5 text-green-600">
                          <IconUserCheck size={16} />
                          <span className="text-sm font-medium">Terbuka</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-red-600">
                          <IconUserOff size={16} />
                          <span className="text-sm font-medium">Tertutup</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {dosen.settings?.visible_letter_types && dosen.settings.visible_letter_types.length > 0 ? (
                          dosen.settings.visible_letter_types.slice(0, 2).map((type, idx) => (
                            <Badge key={idx} variant="secondary" className="text-[10px] px-1 py-0">
                              {LETTER_TYPE_LABELS[type] || type}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Tidak ada akses</span>
                        )}
                        {dosen.settings?.visible_letter_types && dosen.settings.visible_letter_types.length > 2 && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0">
                            +{dosen.settings.visible_letter_types.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleOpenSettings(dosen)}
                      >
                        <IconSettings size={18} className="mr-2" />
                        Atur Akses
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Settings Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pengaturan Visibilitas Dashboard</DialogTitle>
            <DialogDescription>
              Atur hak akses dashboard untuk <strong>{selectedDosen?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="space-y-0.5">
                <div className="text-base font-semibold">Aktifkan Dashboard</div>
                <div className="text-sm text-muted-foreground">
                  Buka atau tutup akses dashboard untuk akun dosen ini.
                </div>
              </div>
              <Switch 
                checked={modalEnabled}
                onCheckedChange={setModalEnabled}
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Program Studi (Filtrasi Data)</label>
              <Select value={modalProdi} onValueChange={setModalProdi}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Prodi" />
                </SelectTrigger>
                <SelectContent>
                  {PRODI_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground flex gap-1 items-center">
                <IconAlertCircle size={12} />
                Dosen hanya akan melihat data dari prodi yang dipilih.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Jenis Surat yang Dapat Diakses</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border rounded-lg">
                {LETTER_TYPES.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox 
                      id={type} 
                      checked={modalLetters.includes(type)}
                      onCheckedChange={() => toggleLetter(type)}
                    />
                    <label 
                      htmlFor={type}
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {LETTER_TYPE_LABELS[type] || type}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button onClick={handleSaveSettings} disabled={isSaving}>
              {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
