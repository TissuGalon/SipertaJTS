"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { DashboardConfig, UserProfile } from './types';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { CommandPalette } from './command-palette';

interface DashboardLayoutProps extends DashboardConfig {
  children: React.ReactNode;
  navCounts?: Record<string, number>;
}

export function DashboardLayout({ 
  children, 
  role, 
  brandName, 
  brandIcon, 
  navItems, 
  categories = [], 
  navCounts = {} 
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("name, email, role")
          .eq("id", user.id)
          .single();
        
        if (profile) {
          setUserProfile({
            ...profile,
            avatar: "", // Can be extended later
          });
        }
      } else {
        router.push("/login");
      }
    };
    fetchProfile();
  }, [router]);

  // Keyboard shortcut for search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  };

  if (!isMounted) return null;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar 
        brandIcon={brandIcon}
        brandName={brandName}
        navItems={navItems}
        categories={categories}
        navCounts={navCounts}
        onLogout={handleLogout}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar 
          userProfile={userProfile}
          brandIcon={brandIcon}
          brandName={brandName}
          navItems={navItems}
          categories={categories}
          navCounts={navCounts}
          onSearchOpen={() => setIsSearchOpen(true)}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50/50 dark:bg-slate-950/50">
          {children}
        </main>
      </div>

      <CommandPalette 
        isOpen={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        navItems={navItems}
        categories={categories}
        onLogout={handleLogout}
      />
    </div>
  );
}
