import * as z from "zod"

export type Role = "admin" | "mahasiswa" | "dosen"

export type ProdiType = "D3_TKJJ" | "D3_TKBA" | "D4_TRKJJ" | "D4_TRKBG";

export const PRODI_LABELS: Record<ProdiType, string> = {
  D3_TKJJ: "D-III TKJJ",
  D3_TKBA: "D-III TKBA",
  D4_TRKJJ: "D-IV TRKJJ",
  D4_TRKBG: "D-IV TRKBG",
};

export type RequestStatus =
  | "pending"
  | "verifying"
  | "processing"
  | "done"
  | "rejected"
  | "menunggu_admin"
  | "disetujui_koordinator"
  | "ditolak_koordinator"

export interface User {
  id: string
  name: string
  nim?: string
  email: string
  role: Role
  avatar?: string
  prodi?: ProdiType
}

export type LetterType =
  | "surat_magang"
  | "surat_aktif_kuliah"
  | "surat_penelitian"
  | "surat_cuti"
  | "surat_sidang"
  | "surat_undangan_seminar"
  | "surat_undangan_sidang"
  | "surat_permohonan_magang"
  | "surat_tugas_magang"
  | "surat_izin_penelitian"

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
  prodi?: ProdiType
}

export interface TimelineEvent {
  status: RequestStatus
  label: string
  timestamp?: string
  isCompleted: boolean
  isCurrent: boolean
}

export const LETTER_TYPE_LABELS: Record<string, string> = {
  surat_magang: "Surat Magang",
  surat_aktif_kuliah: "Surat Aktif Kuliah",
  surat_penelitian: "Surat Penelitian",
  surat_cuti: "Surat Cuti",
  surat_sidang: "Surat Sidang/Seminar",
  surat_undangan_seminar: "Surat Undangan Seminar",
  surat_undangan_sidang: "Surat Undangan Sidang",
  surat_permohonan_magang: "Surat Permohonan Magang",
  surat_tugas_magang: "Surat Tugas Magang",
  surat_izin_penelitian: "Surat Izin Penelitian",
}

export type FieldType =
  | "text"
  | "number"
  | "email"
  | "select"
  | "textarea"
  | "file"
  | "dosen_picker"

export interface FormFieldConfig {
  name: string
  label: string
  type: FieldType
  placeholder?: string
  description?: string
  options?: { label: string; value: string }[]
  validation?: z.ZodTypeAny
  required?: boolean
  disabled?: boolean
}
