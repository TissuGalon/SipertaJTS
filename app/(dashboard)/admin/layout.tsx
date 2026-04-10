"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  IconLayoutDashboard, 
  IconChecklist, 
  IconFileUpload, 
  IconLogout, 
  IconShieldLock,
  IconMenu2,
  IconBell,
  IconSearch,
  IconSettings,
  IconUsers,
  IconMail
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

const navItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: IconLayoutDashboard, category: 'Main' },
  { label: 'Data Dosen', href: '/admin/dosen', icon: IconUsers, category: 'Data' },
  { label: 'Data Mahasiswa', href: '/admin/mahasiswa', icon: IconUsers, category: 'Data' },
  { label: 'Permintaan Surat', href: '/admin/permintaan', icon: IconMail, category: 'Surat' },
  { label: 'Manajemen Surat', href: '/admin/jenis-surat', icon: IconFileUpload, category: 'Surat' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<{ name: string; email: string; role: string } | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("name, email, role")
          .eq("id", user.id)
          .single()
        
        if (profile) {
          setUserProfile(profile)
        }
      }
    }
    fetchUser()
  }, [])

  // Keyboard shortcut for search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsSearchOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push("/login")
  }

  const handleSelect = (href: string) => {
    setIsSearchOpen(false)
    router.push(href)
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar Desktop */}
      <aside className="hidden w-64 border-r bg-white dark:bg-slate-900 lg:block">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center px-6 border-b">
            <div className="flex items-center space-x-2 text-indigo-600">
              <IconShieldLock size={24} />
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Si Perta</span>
            </div>
          </div>
          
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                  )}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          
          <div className="p-4 border-t space-y-2">
            <Button variant="ghost" className="w-full justify-start text-slate-600 dark:text-slate-400">
              <IconSettings size={20} className="mr-3" />
              Pengaturan
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20"
              onClick={handleLogout}
            >
              <IconLogout size={20} className="mr-3" />
              Keluar
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 dark:bg-slate-900 lg:px-8">
          <div className="flex items-center flex-1">
            {isMounted ? (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden mr-2">
                    <IconMenu2 size={24} />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                  <div className="flex h-16 items-center px-6 border-b">
                    <div className="flex items-center space-x-2 text-indigo-600">
                      <IconShieldLock size={24} />
                      <span className="text-lg font-bold tracking-tight">Si Perta</span>
                    </div>
                  </div>
                  <nav className="space-y-1 p-4">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                      >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
            ) : (
              <Button variant="ghost" size="icon" className="lg:hidden mr-2">
                <IconMenu2 size={24} />
              </Button>
            )}
            
            {/* Search Trigger */}
            <div className="relative max-w-md w-full hidden md:block">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center w-full px-4 h-9 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-sm text-slate-400 transition-colors group border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/30"
              >
                <IconSearch className="h-4 w-4 mr-3 group-hover:text-indigo-500" />
                <span>Cari fitur atau halaman...</span>
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-white px-1.5 font-mono text-[10px] font-medium text-slate-500 opacity-100 dark:bg-slate-900 flex-shrink-0">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative">
              <IconBell size={20} />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-slate-900" />
            </Button>
            <div className="flex items-center space-x-3 border-l pl-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {userProfile?.name || "Loading..."}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1 rounded dark:bg-indigo-900/30 dark:text-indigo-400">
                  {userProfile?.role || "User"}
                </p>
              </div>
              <Avatar className="h-9 w-9 ring-2 ring-indigo-100 dark:ring-indigo-900/30">
                <AvatarImage src="" alt={userProfile?.name} />
                <AvatarFallback className="bg-indigo-600 text-white text-xs">
                  {userProfile?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50/50 dark:bg-slate-950/50">
          {children}
        </main>
      </div>

      {/* Command Palette Dialog */}
      {isMounted && (
        <CommandDialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
          <CommandInput placeholder="Ketik nama fitur untuk mencari..." />
          <CommandList>
            <CommandEmpty>Tidak ada fitur yang ditemukan.</CommandEmpty>
            <CommandGroup heading="Navigasi Utama">
              {navItems.filter(item => item.category === "Main").map((item) => (
                <CommandItem key={item.href} onSelect={() => handleSelect(item.href)}>
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Data Master">
              {navItems.filter(item => item.category === "Data").map((item) => (
                <CommandItem key={item.href} onSelect={() => handleSelect(item.href)}>
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Layanan Surat">
              {navItems.filter(item => item.category === "Surat").map((item) => (
                <CommandItem key={item.href} onSelect={() => handleSelect(item.href)}>
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Aksi Lainnya">
              <CommandItem onSelect={() => handleSelect("/admin/pengaturan")}>
                <IconSettings className="mr-2 h-4 w-4" />
                <span>Pengaturan Sistem</span>
              </CommandItem>
              <CommandItem onSelect={handleLogout} className="text-rose-500">
                <IconLogout className="mr-2 h-4 w-4" />
                <span>Keluar / Logout</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      )}
    </div>
  );
}
