import React from 'react';
import { Badge } from '@/components/ui/badge';
import { RequestStatus } from '@/types';
import { cn } from '@/lib/utils';
import { 
  IconCircleDashed, 
  IconLoader2, 
  IconSettings, 
  IconCheck, 
  IconX 
} from '@tabler/icons-react';

interface StatusBadgeProps {
  status: RequestStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const config: Record<RequestStatus, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { 
      label: 'Menunggu', 
      color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      icon: <IconCircleDashed size={14} className="mr-1" />
    },
    verifying: { 
      label: 'Verifikasi', 
      color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800',
      icon: <IconLoader2 size={14} className="mr-1 animate-spin" />
    },
    processing: { 
      label: 'Diproses', 
      color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-100 dark:border-amber-800',
      icon: <IconSettings size={14} className="mr-1 animate-spin" />
    },
    done: { 
      label: 'Selesai', 
      color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800',
      icon: <IconCheck size={14} className="mr-1" />
    },
    rejected: { 
      label: 'Ditolak', 
      color: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-100 dark:border-rose-800',
      icon: <IconX size={14} className="mr-1" />
    },
    menunggu_admin: {
      label: 'Menunggu Admin',
      color: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border-sky-100 dark:border-sky-800',
      icon: <IconLoader2 size={14} className="mr-1 animate-spin" />
    },
    disetujui_koordinator: {
      label: 'Disetujui Koordinator',
      color: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-teal-100 dark:border-teal-800',
      icon: <IconCheck size={14} className="mr-1" />
    },
    ditolak_koordinator: {
      label: 'Ditolak Koordinator',
      color: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-100 dark:border-rose-800',
      icon: <IconX size={14} className="mr-1" />
    },
  };
  
  const currentConfig = config[status] || {
    label: status,
    color: 'bg-slate-50 text-slate-500 border-slate-200 uppercase text-[10px] tracking-widest font-black',
    icon: <IconCircleDashed size={14} className="mr-1" />
  };

  const { label, color, icon } = currentConfig;

  return (
    <Badge 
      variant="outline" 
      className={cn("px-3 py-1 font-bold flex items-center w-fit rounded-full shadow-sm border-none", color, className)}
    >
      {icon}
      {label}
    </Badge>
  );
};
