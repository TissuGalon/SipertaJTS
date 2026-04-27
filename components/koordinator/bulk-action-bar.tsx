"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  IconCheck, 
  IconX, 
  IconTrash, 
  IconLoader2 
} from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BulkActionBarProps {
  selectedCount: number;
  onApprove: () => void;
  onReject: () => void;
  onClear: () => void;
  isSubmitting: boolean;
}

export function BulkActionBar({ 
  selectedCount, 
  onApprove, 
  onReject, 
  onClear,
  isSubmitting 
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-6 px-6 py-4 rounded-2xl bg-white dark:bg-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-200 dark:border-slate-800"
    >
      <div className="flex items-center gap-3 pr-6 border-r border-slate-200 dark:border-slate-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-sm">
          {selectedCount}
        </div>
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Data dipilih
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Button 
          size="sm" 
          onClick={onApprove}
          disabled={isSubmitting}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4"
        >
          {isSubmitting ? (
            <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <IconCheck className="mr-2 h-4 w-4" />
          )}
          Setujui Semua
        </Button>
        
        <Button 
          size="sm" 
          variant="outline"
          onClick={onReject}
          disabled={isSubmitting}
          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/30 font-bold px-4"
        >
          <IconX className="mr-2 h-4 w-4" />
          Tolak Semua
        </Button>

        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClear}
          disabled={isSubmitting}
          className="text-slate-500"
        >
          Batal
        </Button>
      </div>
    </motion.div>
  );
}
