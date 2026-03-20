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
      label: 'Pending', 
      color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      icon: <IconCircleDashed size={14} className="mr-1" />
    },
    verifying: { 
      label: 'Verifying', 
      color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-100 dark:border-blue-800',
      icon: <IconLoader2 size={14} className="mr-1 animate-spin" />
    },
    processing: { 
      label: 'Processing', 
      color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-100 dark:border-amber-800',
      icon: <IconSettings size={14} className="mr-1 animate-spin" />
    },
    done: { 
      label: 'Done', 
      color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800',
      icon: <IconCheck size={14} className="mr-1" />
    },
    rejected: { 
      label: 'Rejected', 
      color: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-100 dark:border-rose-800',
      icon: <IconX size={14} className="mr-1" />
    },
  };

  const { label, color, icon } = config[status];

  return (
    <Badge 
      variant="outline" 
      className={cn("px-2 py-0.5 font-medium flex items-center w-fit", color, className)}
    >
      {icon}
      {label}
    </Badge>
  );
};
