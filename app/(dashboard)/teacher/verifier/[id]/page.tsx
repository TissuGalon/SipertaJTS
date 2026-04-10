"use client"

import React, { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { mockRequests } from "@/lib/mock-data"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  IconArrowLeft,
  IconCheck,
  IconX,
  IconFileText,
  IconUser,
  IconInfoCircle,
  IconExternalLink,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import Link from "next/link"
import { LETTER_TYPE_LABELS } from "@/types"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"

export default function TeacherVerifierPage() {
  const { id } = useParams()
  const router = useRouter()
  const request = mockRequests.find((r) => r.id === id)

  const [notes, setNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  if (!request) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <h2 className="text-xl font-semibold">Request Not Found</h2>
        <Button onClick={() => router.push("/teacher/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    )
  }

  const handleApprove = async () => {
    setIsProcessing(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    toast.success("Request approved and forwarded to admin")
    router.push("/teacher/dashboard")
  }

  const handleReject = async () => {
    setIsProcessing(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    toast.error("Request rejected")
    router.push("/teacher/dashboard")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <IconArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Verify Request</h1>
          <p className="text-muted-foreground">
            Review and verify student letter request
          </p>
        </div>
      </div>

      {/* Request Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <IconUser className="h-5 w-5" />
              <span>Student Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Name</Label>
              <p className="text-sm text-muted-foreground">
                {request.userName}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">NIM</Label>
              <p className="text-sm text-muted-foreground">{request.userNim}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Request Type</Label>
              <p className="text-sm text-muted-foreground">
                {LETTER_TYPE_LABELS[request.type]}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <div className="mt-1">
                <StatusBadge status={request.status} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <IconInfoCircle className="h-5 w-5" />
              <span>Request Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Created</Label>
              <p className="text-sm text-muted-foreground">
                {new Date(request.createdAt).toLocaleDateString("id-ID", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Last Updated</Label>
              <p className="text-sm text-muted-foreground">
                {new Date(request.updatedAt).toLocaleDateString("id-ID", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            {request.letterNumber && (
              <div>
                <Label className="text-sm font-medium">Letter Number</Label>
                <p className="text-sm text-muted-foreground">
                  {request.letterNumber}
                </p>
              </div>
            )}
            {request.academicYear && (
              <div>
                <Label className="text-sm font-medium">Academic Year</Label>
                <p className="text-sm text-muted-foreground">
                  {request.academicYear}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Letter Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <IconFileText className="h-5 w-5" />
            <span>Letter Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(request.details).map(([key, value]) => (
              <div key={key}>
                <Label className="text-sm font-medium capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </Label>
                <p className="text-sm text-muted-foreground">{String(value)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Attached Files */}
      {request.files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Attached Files</CardTitle>
            <CardDescription>
              Documents submitted with this request
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {request.files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center space-x-3">
                    <IconFileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{file.name}</span>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <IconExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Notes */}
      {request.adminNotes && (
        <Card>
          <CardHeader>
            <CardTitle>Previous Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {request.adminNotes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Verification Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Verification</CardTitle>
          <CardDescription>
            Add notes and take action on this request
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Verification Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add your verification notes here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={handleReject}
            disabled={isProcessing}
            className="text-red-600 hover:text-red-700"
          >
            <IconX className="mr-2 h-4 w-4" />
            Reject
          </Button>
          <Button
            onClick={handleApprove}
            disabled={isProcessing}
            className="bg-green-600 hover:bg-green-700"
          >
            <IconCheck className="mr-2 h-4 w-4" />
            Approve
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
