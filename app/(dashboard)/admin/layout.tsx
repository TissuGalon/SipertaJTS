"use client";

import React, { useState, useEffect } from 'react';
import { 
  IconLayoutDashboard, 
  IconFileUpload, 
  IconShieldLock,
  IconUsers,
  IconMail
} from '@tabler/icons-react';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/dashboard/layout';
import { NavItem } from '@/components/dashboard/types';

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: IconLayoutDashboard, category: 'Utama' },
  { label: 'Permintaan Surat', href: '/admin/permintaan', icon: IconMail, category: 'Layanan Surat' },  
  { label: 'Template Surat', href: '/admin/jenis-surat', icon: IconFileUpload, category: 'Layanan Surat' },
  { label: 'Data Mahasiswa', href: '/admin/mahasiswa', icon: IconUsers, category: 'Data Master' },
  { label: 'Data Dosen', href: '/admin/dosen', icon: IconUsers, category: 'Data Master' },
  { label: 'Import Data', href: '/admin/import', icon: IconFileUpload, category: 'Data Master' },
];

const categories = ['Utama', 'Layanan Surat', 'Data Master'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [navCounts, setNavCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchCounts = async () => {
      const [
        { count: reqCount },
        { count: templateCount },
        { count: mahasiswaCount },
        { count: dosenCount }
      ] = await Promise.all([
        supabase.from('letter_requests').select('*', { count: 'exact', head: true }),
        supabase.from('letter_templates').select('*', { count: 'exact', head: true }),
        supabase.from('mahasiswa').select('*', { count: 'exact', head: true }),
        supabase.from('dosen').select('*', { count: 'exact', head: true })
      ]);
      
      setNavCounts({
        '/admin/permintaan': reqCount || 0,
        '/admin/jenis-surat': templateCount || 0,
        '/admin/mahasiswa': mahasiswaCount || 0,
        '/admin/dosen': dosenCount || 0
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
