"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { mockRequests } from '@/lib/mock-data';
import { StatusBadge } from '@/components/ui/status-badge';
import { TimelineStepper } from '@/components/ui/timeline-stepper';
import { 
  IconArrowLeft, 
  IconDownload, 
  IconFileDescription, 
  IconMessageCircle,
  IconCalendarEvent,
  IconClock
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LETTER_TYPE_LABELS } from '@/types';

export default function LetterDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const request = mockRequests.find(r => r.id === id);

  if (!request) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <h2 className="text-xl font-semibold">Pengajuan Tidak Ditemukan</h2>
        <Button onClick={() => router.push('/mahasiswa/dashboard')}>Kembali ke Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/mahasiswa/dashboard">
            <Button variant="ghost" size="icon" className="rounded-full">
              <IconArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{LETTER_TYPE_LABELS[request.type]}</h2>
            <p className="text-sm text-slate-500 font-mono tracking-tighter">ID: {request.id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {request.status === 'done' && (
            <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/20">
              <IconDownload size={18} className="mr-2" />
              Unduh Surat
            </Button>
          )}
          <StatusBadge status={request.status} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Status Timeline */}
          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle>Status Pengajuan</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <TimelineStepper currentStatus={request.status} />
            </CardContent>
          </Card>

          {/* Details */}
          <Card className="border-none shadow-xl">
            <CardHeader className="flex flex-row items-center space-x-3 border-b border-slate-50 dark:border-slate-800 mb-2">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                <IconFileDescription size={20} />
              </div>
              <CardTitle>Rincian Data</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                {Object.entries(request.details).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">{key.replace(/([A-Z])/g, ' $1').trim()}</dt>
                    <dd className="text-sm font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          {/* Uploaded Files */}
          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle>Berkas Lampiran</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {request.files.map((file, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-100 text-slate-500 dark:bg-slate-800">
                        <IconFileDescription size={18} />
                      </div>
                      <span className="text-sm font-medium">{file.name}</span>
                    </div>
                    <Button variant="ghost" size="sm" asChild className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                      <a href={file.url}>Pratinjau</a>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Info Side Card */}
          <Card className="border-none shadow-xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white">
            <CardHeader>
              <CardTitle className="text-base text-white/90">Info Pengajuan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3 text-sm">
                <IconCalendarEvent size={18} className="text-white/60" />
                <div>
                  <p className="text-white/60">Dikirim pada</p>
                  <p className="font-semibold">{new Date(request.createdAt).toLocaleString('id-ID')}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <IconClock size={18} className="text-white/60" />
                <div>
                  <p className="text-white/60">Update terakhir</p>
                  <p className="font-semibold">{new Date(request.updatedAt).toLocaleString('id-ID')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Notes */}
          <Card className={cn("border-none shadow-xl", request.adminNotes ? "bg-amber-50 dark:bg-amber-900/10 ring-1 ring-amber-200 dark:ring-amber-900/50" : "")}>
            <CardHeader className="flex flex-row items-center space-x-2">
              <IconMessageCircle className={request.adminNotes ? "text-amber-600" : "text-slate-400"} size={20} />
              <CardTitle className="text-base text-inherit">Catatan Admin</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-300 italic">
                {request.adminNotes || "Tidak ada catatan dari administrator."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
