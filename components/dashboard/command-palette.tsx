"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  IconSettings, 
  IconLogout
} from '@tabler/icons-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { NavItem } from './types';

interface CommandPaletteProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  navItems: NavItem[];
  categories?: string[];
  onLogout: () => void;
}

export function CommandPalette({ 
  isOpen, 
  onOpenChange, 
  navItems, 
  categories = [], 
  onLogout 
}: CommandPaletteProps) {
  const router = useRouter();

  const handleSelect = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Ketik nama fitur untuk mencari..." />
      <CommandList>
        <CommandEmpty>Tidak ada fitur yang ditemukan.</CommandEmpty>
        
        {categories.length > 0 ? (
          categories.map(category => (
            <React.Fragment key={category}>
              <CommandGroup heading={category}>
                {navItems.filter(item => item.category === category).map((item) => (
                  <CommandItem key={item.href} onSelect={() => handleSelect(item.href)}>
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </React.Fragment>
          ))
        ) : (
          <CommandGroup heading="Menu">
            {navItems.map((item) => (
              <CommandItem key={item.href} onSelect={() => handleSelect(item.href)}>
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading="Aksi Lainnya">
          <CommandItem onSelect={() => handleSelect("/pengaturan")}>
            <IconSettings className="mr-2 h-4 w-4" />
            <span>Pengaturan Sistem</span>
          </CommandItem>
          <CommandItem onSelect={onLogout} className="text-rose-500">
            <IconLogout className="mr-2 h-4 w-4" />
            <span>Keluar / Logout</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
