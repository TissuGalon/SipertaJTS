"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  IconLayoutDashboard, 
  IconFilePlus, 
  IconFiles, 
  IconLogout, 
  IconSchool,
  IconMenu2,
  IconX,
  IconBell
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { mockStudents } from '@/lib/mock-data';

const navItems = [
  { label: 'Dashboard', href: '/mahasiswa/dashboard', icon: IconLayoutDashboard },
  { label: 'Ajukan Surat', href: '/mahasiswa/request', icon: IconFilePlus },
  { label: 'Riwayat Surat', href: '/mahasiswa/history', icon: IconFiles },
];

export default function MahasiswaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = mockStudents[0];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar Desktop */}
      <aside className="hidden w-64 border-r bg-white dark:bg-slate-900 lg:block">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center px-6 border-b">
            <div className="flex items-center space-x-2 text-blue-600">
              <IconSchool size={24} />
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
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                  )}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          
          <div className="p-4 border-t">
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
          <div className="flex items-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <IconMenu2 size={24} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="flex h-16 items-center px-6 border-b">
                  <div className="flex items-center space-x-2 text-blue-600">
                    <IconSchool size={24} />
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
                  <Link href="/login" className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20">
                    <IconLogout size={20} />
                    <span>Keluar</span>
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
            <h1 className="ml-4 text-lg font-semibold lg:ml-0">
              {navItems.find(item => item.href === pathname)?.label || 'Page'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative">
              <IconBell size={20} />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="hidden text-right lg:block">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{user.name}</p>
                <p className="text-xs text-slate-500">{user.nim}</p>
              </div>
              <div className="h-9 w-9 overflow-hidden rounded-full bg-slate-200 ring-2 ring-slate-100 dark:bg-slate-800 dark:ring-slate-800">
                <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
