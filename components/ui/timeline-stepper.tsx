import React from 'react';
import { RequestStatus } from '@/types';
import { cn } from '@/lib/utils';
import { IconCheck, IconX } from '@tabler/icons-react';

interface TimelineStepperProps {
  currentStatus: RequestStatus;
  className?: string;
}

const steps: { status: RequestStatus; label: string }[] = [
  { status: 'pending', label: 'Menunggu' },
  { status: 'disetujui_koordinator', label: 'Verifikasi Kaprodi' },
  { status: 'processing', label: 'Proses Admin' },
  { status: 'done', label: 'Selesai' },
];

export const TimelineStepper: React.FC<TimelineStepperProps> = ({ currentStatus, className }) => {
  const currentIndex = steps.findIndex((step) => step.status === currentStatus);
  const isRejected = currentStatus === 'rejected';

  return (
    <div className={cn("w-full py-4 px-2", className)}>
      <div className="relative flex items-center justify-between">
        {/* Connection Line */}
        <div className="absolute left-[20px] right-[20px] top-1/2 h-1 -translate-y-1/2 bg-slate-100 dark:bg-slate-800 rounded-full" />
        <div 
          className="absolute left-[20px] top-1/2 h-1 -translate-y-1/2 bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-1000 ease-in-out rounded-full shadow-sm" 
          style={{ width: `calc(${isRejected ? 0 : (currentIndex / (steps.length - 1)) * 100}% - 40px)` }}
        />

        {/* Steps */}
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div key={step.status} className="relative z-10 flex flex-col items-center">
              <div 
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-2xl border-2 transition-all duration-500 shadow-sm",
                  isCompleted ? "bg-indigo-600 border-indigo-600 text-white scale-110 shadow-indigo-200" : 
                  isCurrent ? "bg-white border-indigo-600 text-indigo-600 dark:bg-slate-900 scale-125 ring-4 ring-indigo-50 dark:ring-indigo-900/20 shadow-md" : 
                  "bg-white border-slate-100 text-slate-300 dark:bg-slate-900 dark:border-slate-800 scale-100"
                )}
              >
                {isCompleted ? (
                  <IconCheck size={18} stroke={3} />
                ) : (
                  <span className="text-xs font-black">{index + 1}</span>
                )}
              </div>
              <span 
                className={cn(
                  "absolute -bottom-10 whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all duration-500",
                  isCurrent ? "text-indigo-600 translate-y-2 opacity-100" : 
                  isCompleted ? "text-slate-400 opacity-80" : "text-slate-300 opacity-60"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      
      {isRejected && (
        <div className="mt-16 flex items-center justify-center rounded-2xl border-2 border-rose-100 bg-rose-50/50 p-4 text-rose-600 dark:border-rose-900/30 dark:bg-rose-900/10 dark:text-rose-400 animate-in zoom-in duration-500">
          <IconX size={18} className="mr-2" />
          <span className="text-sm font-black uppercase tracking-widest">Pengajuan ini ditolak oleh administrator</span>
        </div>
      )}
    </div>
  );
};
