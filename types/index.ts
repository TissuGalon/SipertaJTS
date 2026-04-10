import * as z from "zod"

export type Role = "admin" | "mahasiswa" | "dosen"

export type RequestStatus =
  | "pending"
  | "verifying"
  | "processing"
  | "done"
  | "rejected"

export interface User {
  id: string
  name: string
  nim?: string
  email: string
  role: Role
  avatar?: string
}

export type LetterType =
  | "surat_magang"
  | "surat_aktif_kuliah"
  | "surat_penelitian"
  | "surat_cuti"
  | "surat_sidang"

export interface LetterRequest {
  id: string
  userId: string
  userName: string
  userNim: string
  type: LetterType
  status: RequestStatus
  createdAt: string
  updatedAt: string
  details: Record<string, any>
  files: { name: string; url: string }[]
  adminNotes?: string
  letterNumber?: string
  academicYear?: string
}

export interface TimelineEvent {
  status: RequestStatus
  label: string
  timestamp?: string
  isCompleted: boolean
  isCurrent: boolean
}

export const LETTER_TYPE_LABELS: Record<LetterType, string> = {
  surat_magang: "Surat Magang",
  surat_aktif_kuliah: "Surat Aktif Kuliah",
  surat_penelitian: "Surat Penelitian",
  surat_cuti: "Surat Cuti",
  surat_sidang: "Surat Sidang/Seminar",
}

export type FieldType =
  | "text"
  | "number"
  | "email"
  | "select"
  | "textarea"
  | "file"

export interface FormFieldConfig {
  name: string
  label: string
  type: FieldType
  placeholder?: string
  description?: string
  options?: { label: string; value: string }[]
  validation?: z.ZodTypeAny
}
