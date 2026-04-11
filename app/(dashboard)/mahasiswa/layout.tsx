"use client";

import React, { useState, useEffect } from 'react';
import { 
  IconLayoutDashboard, 
  IconFilePlus, 
  IconFiles, 
  IconSchool
} from '@tabler/icons-react';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/dashboard/layout';
import { NavItem } from '@/components/dashboard/types';

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/mahasiswa/dashboard', icon: IconLayoutDashboard, category: 'Utama' },
  { label: 'Ajukan Surat', href: '/mahasiswa/request', icon: IconFilePlus, category: 'Layanan Surat' },
  { label: 'Riwayat Surat', href: '/mahasiswa/history', icon: IconFiles, category: 'Layanan Surat' },
];

const categories = ['Utama', 'Layanan Surat'];

export default function MahasiswaLayout({ children }: { children: React.ReactNode }) {
  const [navCounts, setNavCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchCounts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count } = await supabase
        .from('letter_requests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      setNavCounts({
        '/mahasiswa/history': count || 0,
      });
    };
    fetchCounts();
  }, []);

  return (
    <DashboardLayout
      role="mahasiswa"
      brandName="Si Perta"
      brandIcon={IconSchool}
      navItems={navItems}
      categories={categories}
      navCounts={navCounts}
    >
      {children}
    </DashboardLayout>
  );
}
