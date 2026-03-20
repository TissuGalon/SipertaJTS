import React from 'react';
import { RequestStatus } from '@/types';
import { cn } from '@/lib/utils';
import { IconCheck } from '@tabler/icons-react';

interface TimelineStepperProps {
  currentStatus: RequestStatus;
  className?: string;
}

const steps: { status: RequestStatus; label: string }[] = [
  { status: 'pending', label: 'Pending' },
  { status: 'verifying', label: 'Verifying' },
  { status: 'processing', label: 'Processing' },
  { status: 'done', label: 'Done' },
];

export const TimelineStepper: React.FC<TimelineStepperProps> = ({ currentStatus, className }) => {
  const currentIndex = steps.findIndex((step) => step.status === currentStatus);
  const isRejected = currentStatus === 'rejected';

  return (
    <div className={cn("w-full py-4", className)}>
      <div className="relative flex items-center justify-between">
        {/* Connection Line */}
        <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-slate-200 dark:bg-slate-800" />
        <div 
          className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-blue-600 transition-all duration-500 ease-in-out" 
          style={{ width: `${isRejected ? 0 : (currentIndex / (steps.length - 1)) * 100}%` }}
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
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300",
                  isCompleted ? "bg-blue-600 border-blue-600 text-white" : 
                  isCurrent ? "bg-white border-blue-600 text-blue-600 dark:bg-slate-900" : 
                  "bg-white border-slate-200 text-slate-400 dark:bg-slate-900 dark:border-slate-800"
                )}
              >
                {isCompleted ? (
                  <IconCheck size={16} stroke={3} />
                ) : (
                  <span className="text-xs font-bold">{index + 1}</span>
                )}
              </div>
              <span 
                className={cn(
                  "absolute -bottom-6 whitespace-nowrap text-[10px] font-medium uppercase tracking-wider",
                  isCurrent ? "text-blue-600" : "text-slate-500"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      
      {isRejected && (
        <div className="mt-10 flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-400">
          <span className="text-sm font-medium">Request has been rejected</span>
        </div>
      )}
    </div>
  );
};
