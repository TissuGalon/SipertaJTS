"use client";

import React, { useState, useEffect } from 'react';
import { 
  IconLayoutDashboard, 
  IconChecklist, 
  IconShieldCheck,
  IconUser
} from '@tabler/icons-react';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/dashboard/layout';
import { NavItem } from '@/components/dashboard/types';

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/koordinator/dashboard', icon: IconLayoutDashboard, category: 'Utama' },
  { label: 'Verifikasi Surat', href: '/koordinator/verifier', icon: IconChecklist, category: 'Layanan Surat' },
  { label: 'Riwayat Verifikasi', href: '/koordinator/riwayat', icon: IconShieldCheck, category: 'Layanan Surat' },
  { label: 'Profil Saya', href: '/koordinator/profile', icon: IconUser, category: 'Akun' },
];

const categories = ['Utama', 'Layanan Surat', 'Akun'];

export default function KoordinatorLayout({ children }: { children: React.ReactNode }) {
  const [navCounts, setNavCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchCounts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Count pending verifications for this lecturer
      // Assuming there's a relation or a status we can check
      // For now, let's just fetch all requests that need verification (simplified)
      const { count } = await supabase
        .from('letter_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'); // Or whatever the status is for 'needs verification'
      
      setNavCounts({
        '/koordinator/verifier': count || 0,
      });
    };
    fetchCounts();
  }, []);

  return (
    <DashboardLayout
      role="dosen"
      brandName="Si Perta"
      brandIcon={IconShieldCheck}
      navItems={navItems}
      categories={categories}
      navCounts={navCounts}
    >
      {children}
    </DashboardLayout>
  );
}
