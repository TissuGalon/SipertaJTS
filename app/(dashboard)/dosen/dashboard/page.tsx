"use client"

import React, { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { mockRequests } from "@/lib/mock-data"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  IconClipboardList,
  IconHourglass,
  IconCircleCheck,
  IconSearch,
  IconFilter,
  IconEye,
  IconCheck,
  IconX,
  IconDotsVertical,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from "next/link"
import { LETTER_TYPE_LABELS, RequestStatus } from "@/types"
import { toast } from "sonner"

export default function TeacherDashboard() {
  const [filterStatus, setFilterStatus] = useState<RequestStatus | "all">(
    "verifying"
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [requests, setRequests] = useState(mockRequests)

  const filteredRequests = requests.filter((req) => {
    const matchesStatus = filterStatus === "all" || req.status === filterStatus
    const matchesSearch =
      req.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.userNim.includes(searchQuery) ||
      req.id.includes(searchQuery)
    return matchesStatus && matchesSearch
  })

  const stats = {
    total: requests.length,
    verifying: requests.filter((r) => r.status === "verifying").length,
    pending: requests.filter((r) => r.status === "pending").length,
    done: requests.filter((r) => r.status === "done").length,
  }

  const handleApprove = (id: string) => {
    setRequests((prev) =>
      prev.map((req) =>
        req.id === id ? { ...req, status: "processing" as RequestStatus } : req
      )
    )
    toast.success("Permintaan disetujui untuk diproses")
  }

  const handleReject = (id: string) => {
    setRequests((prev) =>
      prev.map((req) =>
        req.id === id ? { ...req, status: "rejected" as RequestStatus } : req
      )
    )
    toast.error("Permintaan ditolak")
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Pengajuan
            </CardTitle>
            <IconClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verifikasi</CardTitle>
            <IconHourglass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verifying}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tertunda</CardTitle>
            <IconHourglass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selesai</CardTitle>
            <IconCircleCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.done}</div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengajuan Surat</CardTitle>
          <CardDescription>
            Kelola dan verifikasi permintaan surat mahasiswa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center space-x-2">
            <div className="relative flex-1">
              <IconSearch className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nama, NIM, atau ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select
              value={filterStatus}
              onValueChange={(value) =>
                setFilterStatus(value as RequestStatus | "all")
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Tertunda</SelectItem>
                <SelectItem value="verifying">Verifikasi</SelectItem>
                <SelectItem value="processing">Proses</SelectItem>
                <SelectItem value="done">Selesai</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    ID Request
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Mahasiswa
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Jenis
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Tgl Dibuat
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground" style={{ width: '120px' }}>
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="border-b">
                    <td className="p-4 align-middle font-medium">
                      {request.id}
                    </td>
                    <td className="p-4 align-middle">
                      <div>
                        <div className="font-medium">{request.userName}</div>
                        <div className="text-sm text-muted-foreground">
                          {request.userNim}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      {LETTER_TYPE_LABELS[request.type]}
                    </td>
                    <td className="p-4 align-middle">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="p-4 align-middle">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dosen/verifier/${request.id}`}>
                            <IconEye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {request.status === "verifying" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(request.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <IconCheck className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReject(request.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <IconX className="h-4 w-4" />
                            </Button>
                          </>
                        )}
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
  )
}
