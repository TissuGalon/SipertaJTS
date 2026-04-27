"use client";

import React from 'react';
import { 
  IconMenu2, 
  IconBell, 
  IconSearch, 
  IconSettings, 
  IconLogout,
  IconShieldLock,
  IconUser
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserProfile, NavItem } from './types';
import { IconProps } from '@tabler/icons-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './theme-toggle';
import { NotificationBell } from './notification-bell';

interface TopbarProps {
  userProfile: UserProfile | null;
  brandIcon: React.ComponentType<IconProps>;
  brandName: string;
  navItems: NavItem[];
  categories?: string[];
  navCounts?: Record<string, number>;
  onSearchOpen: () => void;
  onLogout: () => void;
  role?: string;
}

export function Topbar({ 
  userProfile, 
  brandIcon: BrandIcon, 
  brandName, 
  navItems, 
  categories = [], 
  navCounts = {}, 
  onSearchOpen, 
  onLogout,
  role
}: TopbarProps) {
  const pathname = usePathname();

  const renderMobileNav = () => (
    <nav className="space-y-6 p-4">
      {(categories.length > 0 ? categories : [undefined]).map((category) => (
        <div key={category || 'default'} className="space-y-2">
          {category && (
            <h3 className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {category}
            </h3>
          )}
          <div className="space-y-1">
            {navItems.filter(item => !category || item.category === category).map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400" 
                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </div>
                  {typeof navCounts[item.href] !== 'undefined' && (
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full",
                      isActive 
                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400" 
                        : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    )}>
                      {navCounts[item.href]}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
      <div className="pt-4 border-t">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
          onClick={onLogout}
        >
          <IconLogout size={20} className="mr-3" />
          Keluar
        </Button>
      </div>
    </nav>
  );

  return (
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
                <BrandIcon size={24} />
                <span className="text-lg font-bold tracking-tight">{brandName}</span>
              </div>
            </div>
            {renderMobileNav()}
          </SheetContent>
        </Sheet>
        
        {/* Search Trigger */}
        <div className="relative max-w-md w-full hidden md:block">
          <button
            onClick={onSearchOpen}
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
      
      <div className="flex items-center space-x-1 md:space-x-4">
        <div className="flex items-center space-x-1 md:space-x-2">
          <ThemeToggle />
          <NotificationBell role={role} />
        </div>

        <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block mx-1" />

        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {userProfile?.name || "Loading..."}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1 rounded dark:bg-indigo-900/30 dark:text-indigo-400">
              {userProfile?.role || "User"}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 border-none hover:bg-transparent">
                <Avatar className="h-9 w-9 ring-2 hover:ring-4 ring-indigo-100 dark:ring-indigo-900/30 transition-all cursor-pointer border-none">
                  <AvatarImage src={userProfile?.avatar || ""} alt={userProfile?.name} />
                  <AvatarFallback className="bg-indigo-600 text-white text-xs">
                    {userProfile?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal border-b pb-2 mb-2">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userProfile?.name}</p>
                  <p className="text-xs leading-none text-slate-500">{userProfile?.email}</p>
                </div>
              </DropdownMenuLabel>
              <Link href={role === 'admin' ? '/admin/settings' : `/${role}/profile`}>
                <DropdownMenuItem className="cursor-pointer">
                  <IconUser className="mr-2 h-4 w-4" />
                  <span>Profil Saya</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem className="text-rose-500 cursor-pointer focus:bg-rose-50 focus:text-rose-600 dark:focus:bg-rose-950/50" onClick={onLogout}>
                <IconLogout className="mr-2 h-4 w-4" />
                <span>Keluar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
