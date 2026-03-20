"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { DynamicForm } from '@/components/forms/dynamic-form';
import { letterConfigs } from '@/lib/letter-configs';
import { LETTER_TYPE_LABELS, LetterType } from '@/types';
import { toast } from 'sonner';
import { IconArrowLeft, IconFilePlus } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function RequestLetterPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<LetterType | "">("");

  const handleSubmit = (data: any) => {
    console.log('Form data submitted:', data);
    toast.success("Request submitted successfully!");
    
    // Simulate redirect after successful submission
    setTimeout(() => {
      router.push('/student/dashboard');
    }, 1500);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/student/dashboard">
          <Button variant="ghost" size="icon">
            <IconArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Request New Letter</h2>
          <p className="text-sm text-slate-500">Fill in the details below to request your academic letter.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Letter Type</CardTitle>
          <CardDescription>Select the type of letter you want to request</CardDescription>
        </CardHeader>
        <CardContent>
          <Select onValueChange={(v: any) => setSelectedType(v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select letter type..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LETTER_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedType && (
        <Card className="animate-in fade-in slide-in-from-top-4 duration-500">
          <CardHeader className="flex flex-row items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30">
              <IconFilePlus size={20} />
            </div>
            <div>
              <CardTitle>{LETTER_TYPE_LABELS[selectedType as LetterType]}</CardTitle>
              <CardDescription>Please provide the following information for this letter</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <DynamicForm 
              fields={letterConfigs[selectedType]} 
              onSubmit={handleSubmit}
              submitLabel="Submit Request" 
            />
          </CardContent>
        </Card>
      )}

      {!selectedType && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center text-slate-400 dark:border-slate-800">
          <IconFilePlus size={48} stroke={1.5} className="mb-4 opacity-20" />
          <p>Please select a letter type above to continue</p>
        </div>
      )}
    </div>
  );
}
