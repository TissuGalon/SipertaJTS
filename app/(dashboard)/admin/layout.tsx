"use client";

import React, { useState, useEffect } from 'react';
import { 
  IconLayoutDashboard, 
  IconFileUpload, 
  IconShieldLock,
  IconUsers,
  IconMail,
  IconDatabaseImport,
  IconFileCertificate,
  IconSchool,
  IconEye
} from '@tabler/icons-react';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/dashboard/layout';
import { NavItem } from '@/components/dashboard/types';

const navItems: NavItem[] = [
  // Utama
  { label: 'Dashboard', href: '/admin/dashboard', icon: IconLayoutDashboard, category: 'Utama' },
  
  // Layanan Surat
  { label: 'Permintaan Surat', href: '/admin/permintaan', icon: IconMail, category: 'Layanan Surat' },  
  { label: 'Template Surat', href: '/admin/jenis-surat', icon: IconFileCertificate, category: 'Layanan Surat' },
  
  // Data Master
  { label: 'Data Mahasiswa', href: '/admin/mahasiswa', icon: IconUsers, category: 'Data Master' },
  { label: 'Data Dosen', href: '/admin/dosen', icon: IconSchool, category: 'Data Master' },

  // Pengaturan & Sistem
  { label: 'Manajemen Admin', href: '/admin/manajemen-admin', icon: IconShieldLock, category: 'Pengaturan & Sistem' },
  { label: 'Akses Koordinator', href: '/admin/settings/koordinator', icon: IconEye, category: 'Pengaturan & Sistem' },
  { label: 'Import Data', href: '/admin/import', icon: IconDatabaseImport, category: 'Pengaturan & Sistem' },
];

const categories = ['Utama', 'Layanan Surat', 'Data Master', 'Pengaturan & Sistem'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [navCounts, setNavCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchCounts = async () => {
      const [
        { count: reqCount },
        { count: templateCount },
        { count: mahasiswaCount },
        { count: dosenCount },
        { count: adminCount }
      ] = await Promise.all([
        supabase.from('letter_requests').select('*', { count: 'exact', head: true }),
        supabase.from('letter_templates').select('*', { count: 'exact', head: true }),
        supabase.from('mahasiswa').select('*', { count: 'exact', head: true }),
        supabase.from('dosen').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'admin')
      ]);
      
      setNavCounts({
        '/admin/permintaan': reqCount || 0,
        '/admin/jenis-surat': templateCount || 0,
        '/admin/mahasiswa': mahasiswaCount || 0,
        '/admin/dosen': dosenCount || 0,
        '/admin/manajemen-admin': adminCount || 0
      });
    };
    fetchCounts();
  }, []);

  return (
    <DashboardLayout
      role="admin"
      brandName="Si Perta"
      brandIcon={IconShieldLock}
      navItems={navItems}
      categories={categories}
      navCounts={navCounts}
    >
      {children}
    </DashboardLayout>
  );
}
