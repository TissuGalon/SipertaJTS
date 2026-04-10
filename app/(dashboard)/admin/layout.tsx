"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  IconSettings
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { mockAdmins } from '@/lib/mock-data';

const navItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: IconLayoutDashboard },
  { label: 'Data Dosen', href: '/admin/dosen', icon: IconChecklist },
  { label: 'Data Mahasiswa', href: '/admin/mahasiswa', icon: IconChecklist },
  { label: 'Permintaan Surat', href: '/admin/permintaan', icon: IconChecklist },
  { label: 'Manajemen Surat', href: '/admin/jenis-surat', icon: IconFileUpload },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = mockAdmins[0];

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
            <Link href="/login">
              <Button variant="ghost" className="w-full justify-start text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20">
                <IconLogout size={20} className="mr-3" />
                Keluar
              </Button>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 dark:bg-slate-900 lg:px-8">
          <div className="flex items-center flex-1">
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
            
            <div className="relative max-w-md w-full hidden md:block">
              <IconSearch className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Cari NIM, Nama, atau ID Surat..." 
                className="pl-10 h-9 bg-slate-50 border-none ring-0 focus-visible:ring-1 focus-visible:ring-indigo-100 dark:bg-slate-800" 
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative">
              <IconBell size={20} />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-slate-900" />
            </Button>
            <div className="flex items-center space-x-3 border-l pl-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{user.name}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1 rounded dark:bg-indigo-900/30 dark:text-indigo-400">Administrator</p>
              </div>
              <div className="h-9 w-9 overflow-hidden rounded-full ring-2 ring-indigo-100 dark:ring-indigo-900/30">
                <img src={user.avatar} alt="Admin" className="h-full w-full object-cover" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50/50 dark:bg-slate-950/50">
          {children}
        </main>
      </div>
    </div>
  );
}
