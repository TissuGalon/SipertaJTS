"use client";

import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { IconUpload, IconFile, IconX, IconCloudUpload } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
  onFilesChange?: (files: File[]) => void;
  maxFiles?: number;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesChange, maxFiles = 3, className }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles: File[]) => {
    const updatedFiles = [...files, ...newFiles].slice(0, maxFiles);
    setFiles(updatedFiles);
    onFilesChange?.(updatedFiles);
  };

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesChange?.(updatedFiles);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all cursor-pointer",
          isDragging 
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
            : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          className="hidden"
          multiple
        />
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30">
          <IconCloudUpload size={24} />
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm font-medium">Click to upload or drag and drop</p>
          <p className="mt-1 text-xs text-slate-500">PDF, JPG, or PNG (max. {maxFiles} files)</p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div 
              key={`${file.name}-${index}`} 
              className="flex items-center justify-between rounded-lg border border-slate-200 p-2 pl-3 dark:border-slate-800 bg-white dark:bg-slate-900"
            >
              <div className="flex items-center space-x-3 overflow-hidden">
                <IconFile size={18} className="text-slate-400 shrink-0" />
                <span className="truncate text-sm font-medium">{file.name}</span>
                <span className="text-[10px] text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-slate-400 hover:text-rose-500"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
              >
                <IconX size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
