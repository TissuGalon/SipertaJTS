"use client";

import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { mockStudents, mockRequests } from '@/lib/mock-data';
import { StatusBadge } from '@/components/ui/status-badge';
import { TimelineStepper } from '@/components/ui/timeline-stepper';
import { 
  IconFileText, 
  IconClock, 
  IconCheck, 
  IconX,
  IconArrowRight,
  IconDownload,
  IconFilePlus
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LETTER_TYPE_LABELS } from '@/types';
import { motion } from 'framer-motion';

export default function StudentDashboard() {
  const user = mockStudents[0];
  const requests = mockRequests.filter(r => r.userId === user.id);
  
  const stats = [
    { label: 'Total Requests', value: requests.length, icon: IconFileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending', value: requests.filter(r => r.status === 'pending' || r.status === 'verifying').length, icon: IconClock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Approved', value: requests.filter(r => r.status === 'done').length, icon: IconCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Rejected', value: requests.filter(r => r.status === 'rejected').length, icon: IconX, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  const latestRequest = requests[0];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Welcome, {user.name} 👋</h2>
        <p className="text-slate-500">Track and manage your academic letter requests here.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <div className={cn("p-2 rounded-lg", stat.bg)}>
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Latest Request Progress */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Latest Request Status</CardTitle>
            <CardDescription>Visual progress of your most recent letter request</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">{LETTER_TYPE_LABELS[latestRequest.type]}</p>
                  <p className="text-xs text-slate-500">Submitted on {new Date(latestRequest.createdAt).toLocaleDateString()}</p>
                </div>
                <StatusBadge status={latestRequest.status} />
              </div>
              <div className="py-4">
                <TimelineStepper currentStatus={latestRequest.status} />
              </div>
              <div className="flex justify-end pt-4">
                <Link href={`/student/letters/${latestRequest.id}`}>
                  <Button variant="outline" size="sm">
                    View Details
                    <IconArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Need a new letter?</CardTitle>
            <CardDescription>Choose a letter type to start a new request</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Button asChild className="w-full justify-start text-left font-normal" variant="outline">
                <Link href="/student/request">
                  <IconFilePlus className="mr-2 h-4 w-4 text-blue-600" />
                  <span>Request Internship Letter</span>
                </Link>
              </Button>
              <Button asChild className="w-full justify-start text-left font-normal" variant="outline">
                <Link href="/student/request">
                  <IconFilePlus className="mr-2 h-4 w-4 text-purple-600" />
                  <span>Request Active Student Letter</span>
                </Link>
              </Button>
              <Button asChild className="w-full justify-start text-left font-normal" variant="outline">
                <Link href="/student/request">
                  <IconFilePlus className="mr-2 h-4 w-4 text-amber-600" />
                  <span>Request Research Permit</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Requests Table/List */}
      <Card id="my-letters">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>My Letter Requests</CardTitle>
            <CardDescription>A history of all your requested letters</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                <tr>
                  <th className="h-10 px-4 text-left font-medium text-slate-500">Letter Type</th>
                  <th className="h-10 px-4 text-left font-medium text-slate-500">Status</th>
                  <th className="h-10 px-4 text-left font-medium text-slate-500">Submitted Date</th>
                  <th className="h-10 px-4 text-right font-medium text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-medium">{LETTER_TYPE_LABELS[request.type]}</td>
                    <td className="p-4">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="p-4 text-slate-500">
                      {new Date(request.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end space-x-2">
                        {request.status === 'done' && (
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600">
                            <IconDownload size={18} />
                          </Button>
                        )}
                        <Link href={`/student/letters/${request.id}`}>
                          <Button size="sm" variant="ghost">View</Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper for class name merging (cn was missing in the prev view)
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
