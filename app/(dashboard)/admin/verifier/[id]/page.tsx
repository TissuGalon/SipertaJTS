"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { mockRequests } from '@/lib/mock-data';
import { StatusBadge } from '@/components/ui/status-badge';
import { 
  IconArrowLeft, 
  IconCheck, 
  IconX, 
  IconFileText,
  IconUser,
  IconInfoCircle,
  IconExternalLink,
  IconChevronLeft,
  IconChevronRight
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import Link from 'next/link';
import { LETTER_TYPE_LABELS } from '@/types';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

export default function DocumentVerifierPage() {
  const { id } = useParams();
  const router = useRouter();
  const request = mockRequests.find(r => r.id === id);
  
  const [letterNumber, setLetterNumber] = useState("");
  const [academicYear, setAcademicYear] = useState("2023/2024");
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  if (!request) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <h2 className="text-xl font-semibold">Request Not Found</h2>
        <Button onClick={() => router.push('/admin/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  const handleAction = (status: 'done' | 'rejected') => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      toast.success(`Request ${status === 'done' ? 'approved' : 'rejected'} successfully`);
      router.push('/admin/dashboard');
    }, 1500);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="icon">
              <IconArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Document Verifier</h2>
            <p className="text-sm text-slate-500">Review and validate student letter request</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="hidden sm:flex">
            <IconChevronLeft size={16} className="mr-1" />
            Previous
          </Button>
          <Button variant="outline" size="sm" className="hidden sm:flex">
            Next
            <IconChevronRight size={16} className="ml-1" />
          </Button>
          <StatusBadge status={request.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
        {/* Left: Document Preview */}
        <Card className="flex flex-col h-full bg-slate-100/50 dark:bg-slate-900/50 overflow-hidden">
          <CardHeader className="bg-white dark:bg-slate-900 border-b py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <IconFileText size={18} className="text-blue-600" />
                <span className="text-sm font-semibold">Lampiran: {request.files[0]?.name || 'Document.pdf'}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <IconExternalLink size={16} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center p-0 overflow-hidden">
            {/* Mock PDF Viewer */}
            <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center p-8">
              <div className="w-full max-w-lg aspect-[1/1.4] bg-white dark:bg-slate-950 shadow-2xl rounded p-12 space-y-8 animate-in zoom-in-95 duration-500">
                <div className="flex flex-col items-center border-b pb-8">
                  <div className="h-16 w-16 bg-slate-100 dark:bg-slate-900 rounded-full mb-4 flex items-center justify-center">
                    <IconSchool className="text-slate-400" size={32} />
                  </div>
                  <div className="h-4 w-48 bg-slate-100 dark:bg-slate-800 rounded"></div>
                  <div className="h-3 w-32 bg-slate-50 dark:bg-slate-900 rounded mt-2"></div>
                </div>
                <div className="space-y-4">
                  <div className="h-4 w-full bg-slate-50 dark:bg-slate-900 rounded"></div>
                  <div className="h-4 w-full bg-slate-50 dark:bg-slate-900 rounded"></div>
                  <div className="h-4 w-3/4 bg-slate-50 dark:bg-slate-900 rounded"></div>
                </div>
                <div className="grid grid-cols-2 gap-8 pt-8">
                  <div className="space-y-3">
                    <div className="h-3 w-16 bg-slate-100 dark:bg-slate-900 rounded"></div>
                    <div className="h-8 w-full bg-slate-50 dark:bg-slate-800 rounded"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-3 w-16 bg-slate-100 dark:bg-slate-900 rounded"></div>
                    <div className="h-8 w-full bg-slate-50 dark:bg-slate-800 rounded"></div>
                  </div>
                </div>
                <div className="pt-20 flex justify-end">
                  <div className="text-right">
                    <div className="h-3 w-32 bg-slate-100 dark:bg-slate-900 rounded mb-12"></div>
                    <div className="h-4 w-40 bg-slate-100 dark:bg-slate-900 rounded"></div>
                    <div className="h-3 w-24 bg-slate-50 dark:bg-slate-900 rounded mt-2 ml-auto"></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-white dark:bg-slate-900 border-t py-2 justify-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Document Preview Simulation</span>
          </CardFooter>
        </Card>

        {/* Right: Info & Actions */}
        <div className="space-y-6 overflow-y-auto">
          {/* Student Info */}
          <Card>
            <CardHeader className="flex flex-row items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 flex items-center justify-center">
                <IconUser size={20} />
              </div>
              <div>
                <CardTitle>{request.userName}</CardTitle>
                <CardDescription>NIM: {request.userNim} • {LETTER_TYPE_LABELS[request.type]}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(request.details).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <p className="text-sm font-medium">{value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Verification Form */}
          <Card className="border-indigo-100 dark:border-indigo-900/30">
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <IconInfoCircle size={18} className="mr-2 text-indigo-600" />
                Administrative Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="letterNumber">Nomor Surat</Label>
                  <Input 
                    id="letterNumber" 
                    placeholder="Contoh: 123/UN/AK/2024" 
                    value={letterNumber}
                    onChange={(e) => setLetterNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="academicYear">Tahun Akademik</Label>
                  <Input 
                    id="academicYear" 
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes for Student</Label>
                <Textarea 
                  id="notes" 
                  placeholder="Optional: Provide feedback or reasons for rejection..." 
                  className="min-h-[100px]"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex space-x-3 bg-slate-50/50 dark:bg-slate-900/50 p-6 border-t">
              <Button 
                variant="outline" 
                className="flex-1 text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900/30 dark:hover:bg-rose-900/20"
                onClick={() => handleAction('rejected')}
                disabled={isProcessing}
              >
                <IconX size={18} className="mr-2" />
                Reject
              </Button>
              <Button 
                className="flex-[2] bg-indigo-600 hover:bg-indigo-700"
                onClick={() => handleAction('done')}
                disabled={isProcessing}
              >
                <IconCheck size={18} className="mr-2" />
                Approve & Process
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Additional missing components from Shadcn for this page
function IconSchool({ className, size }: { className?: string, size?: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
    </svg>
  );
}
