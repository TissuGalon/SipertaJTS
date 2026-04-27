
"use client";

import React, { useState, useEffect } from 'react';
import { 
  IconBell, 
  IconMail, 
  IconCircleCheck, 
  IconTrash,
  IconArrowRight
} from '@tabler/icons-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'sonner';

export function NotificationBell({ role }: { role?: string }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (role !== 'admin') return;
    fetchInitialNotifications();

    // Subscribe to REALTIME changes in letter_requests
    const channel = supabase
      .channel('letter_requests_notifications')
      .on(
        'postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'letter_requests' 
        }, 
        (payload: any) => {
          handleNewRequest(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchInitialNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('letter_requests')
        .select('id, user_id, type, status, created_at, users(name)')
        .eq('status', 'menunggu_admin')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      
      setNotifications(data || []);
      setUnreadCount(data?.length || 0);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleNewRequest = (newRequest: any) => {
    // If it's a request that needs admin attention
    if (newRequest.status === 'menunggu_admin' || newRequest.status === 'pending') {
      // Audio notification if browser allows
      try {
        const audio = new Audio('/notification.mp3');
        audio.play();
      } catch (e: any) {}

      toast.info("Ada pengajuan surat baru masuk!");
      
      // Refresh notifications (simple way)
      fetchInitialNotifications();
    }
  };

  const markAllAsRead = () => {
    setUnreadCount(0);
  };

  if (role !== 'admin') return null;

  return (
    <DropdownMenu onOpenChange={(open) => open && markAllAsRead()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg relative text-slate-600 dark:text-slate-400">
          <IconBell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-white dark:ring-slate-900 border-none animate-in zoom-in">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 border-none shadow-2xl rounded-2xl overflow-hidden">
        <DropdownMenuLabel className="p-4 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <span className="font-black text-sm tracking-tight">Notifikasi Pengajuan</span>
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Baru</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="m-0" />
        <div className="max-h-[70vh] overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <DropdownMenuItem key={notif.id} className="p-0 focus:bg-slate-50 dark:focus:bg-slate-800/50">
                <Link href={`/admin/verifier/${notif.id}`} className="w-full p-4 flex items-start space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center shrink-0">
                    <IconMail size={20} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">
                      {notif.users?.name || "Mahasiswa"}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-1">
                      Mengajukan {notif.type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(notif.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    </p>
                  </div>
                </Link>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="p-10 text-center space-y-2">
               <div className="h-12 w-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-300">
                 <IconCircleCheck size={28} />
               </div>
               <p className="text-xs text-slate-500 font-medium">Semua pengajuan telah dicek!</p>
            </div>
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />
        <DropdownMenuItem className="p-0">
          <Link href="/admin/permintaan" className="w-full py-3 text-center text-[11px] font-black uppercase text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all flex items-center justify-center">
            Lihat Semua Pengajuan
            <IconArrowRight size={14} className="ml-2" />
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
