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
        <h2 className="text-xl font-semibold">Request Not Found</h2>
        <Button onClick={() => router.push('/student/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/student/dashboard">
            <Button variant="ghost" size="icon">
              <IconArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{LETTER_TYPE_LABELS[request.type]}</h2>
            <p className="text-sm text-slate-500">ID: {request.id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {request.status === 'done' && (
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <IconDownload size={18} className="mr-2" />
              Download Letter
            </Button>
          )}
          <StatusBadge status={request.status} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Request Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <TimelineStepper currentStatus={request.status} />
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader className="flex flex-row items-center space-x-3">
              <IconFileDescription className="text-blue-600" />
              <CardTitle>Form Details</CardTitle>
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
          <Card>
            <CardHeader>
              <CardTitle>Attachment Files</CardTitle>
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
                    <Button variant="ghost" size="sm" asChild>
                      <a href={file.url}>Preview</a>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Info Side Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Submission Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3 text-sm">
                <IconCalendarEvent size={18} className="text-slate-400" />
                <div>
                  <p className="text-slate-500">Submitted on</p>
                  <p className="font-medium">{new Date(request.createdAt).toLocaleString('id-ID')}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <IconClock size={18} className="text-slate-400" />
                <div>
                  <p className="text-slate-500">Last updated</p>
                  <p className="font-medium">{new Date(request.updatedAt).toLocaleString('id-ID')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Notes */}
          <Card className={request.adminNotes ? "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/10" : ""}>
            <CardHeader className="flex flex-row items-center space-x-2">
              <IconMessageCircle className={request.adminNotes ? "text-amber-600" : "text-slate-400"} size={20} />
              <CardTitle className="text-base text-inherit">Admin Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-300 italic">
                {request.adminNotes || "No notes from administrator."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
