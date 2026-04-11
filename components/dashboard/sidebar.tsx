"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  IconLogout, 
  IconSettings
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { NavItem, DashboardConfig } from './types';
import { IconProps } from '@tabler/icons-react';

interface SidebarProps {
  brandIcon: React.ComponentType<IconProps>;
  brandName: string;
  navItems: NavItem[];
  categories?: string[];
  navCounts?: Record<string, number>;
  onLogout: () => void;
}

export function Sidebar({ 
  brandIcon: BrandIcon, 
  brandName, 
  navItems, 
  categories = [], 
  navCounts = {}, 
  onLogout 
}: SidebarProps) {
  const pathname = usePathname();

  const renderNavGroup = (items: NavItem[], category?: string) => (
    <div key={category || 'default'} className="space-y-2">
      {category && (
        <h3 className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {category}
        </h3>
      )}
      <div className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive 
                  ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
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
  );

  return (
    <aside className="hidden w-64 border-r bg-white dark:bg-slate-900 lg:block">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center px-6 border-b">
          <div className="flex items-center space-x-2 text-indigo-600">
            <BrandIcon size={24} />
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">{brandName}</span>
          </div>
        </div>
        
        <nav className="flex-1 space-y-6 p-4 overflow-y-auto">
          {categories.length > 0 ? (
            categories.map(category => 
              renderNavGroup(navItems.filter(item => item.category === category), category)
            )
          ) : (
            renderNavGroup(navItems)
          )}
        </nav>
        
        <div className="p-4 border-t space-y-2">
          <Button variant="ghost" className="w-full justify-start text-slate-600 dark:text-slate-400">
            <IconSettings size={20} className="mr-3" />
            Pengaturan
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20"
            onClick={onLogout}
          >
            <IconLogout size={20} className="mr-3" />
            Keluar
          </Button>
        </div>
      </div>
    </aside>
  );
}
