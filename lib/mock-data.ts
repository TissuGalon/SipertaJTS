import { LetterRequest, User } from "@/types"

export const mockStudents: User[] = [
  {
    id: "s1",
    name: "Ahmad Fauzi",
    nim: "21010123",
    email: "ahmad@student.ac.id",
    role: "student",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad",
  },
]

export const mockAdmins: User[] = [
  {
    id: "a1",
    name: "Admin Akademik",
    email: "admin@ac.id",
    role: "admin",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
  },
]

export const mockTeachers: User[] = [
  {
    id: "t1",
    name: "Dr. Budi Santoso",
    email: "budi@lecturer.ac.id",
    role: "teacher",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Budi",
  },
]

export const mockRequests: LetterRequest[] = [
  {
    id: "req-001",
    userId: "s1",
    userName: "Ahmad Fauzi",
    userNim: "21010123",
    type: "surat_magang",
    status: "verifying",
    createdAt: "2024-03-20T10:00:00Z",
    updatedAt: "2024-03-20T10:00:00Z",
    details: {
      companyName: "PT. Teknologi Maju",
      companyAddress: "Jl. Merdeka No. 10, Jakarta",
      startDate: "2024-06-01",
      endDate: "2024-08-31",
    },
    files: [
      { name: "KRS_Semester_6.pdf", url: "#" },
      { name: "Transkrip_Nilai.pdf", url: "#" },
    ],
  },
  {
    id: "req-002",
    userId: "s1",
    userName: "Ahmad Fauzi",
    userNim: "21010123",
    type: "surat_aktif_kuliah",
    status: "done",
    createdAt: "2024-03-15T08:30:00Z",
    updatedAt: "2024-03-16T14:20:00Z",
    details: {
      purpose: "Pengajuan Beasiswa",
      semester: "6",
    },
    files: [{ name: "KTM.jpg", url: "#" }],
    letterNumber: "123/UN/AK/2024",
    academicYear: "2023/2024",
    adminNotes: "Selesai diproses, silakan unduh.",
  },
  {
    id: "req-003",
    userId: "s1",
    userName: "Ahmad Fauzi",
    userNim: "21010123",
    type: "permintaan_penelitian",
    status: "rejected",
    createdAt: "2024-03-10T09:00:00Z",
    updatedAt: "2024-03-11T11:00:00Z",
    details: {
      researchTitle: "Analisis Sistem Informasi Akademik",
      location: "Dinas Pendidikan Jabar",
    },
    files: [{ name: "Proposal.pdf", url: "#" }],
    adminNotes: "Proposal kurang lengkap, silakan unggah ulang dengan revisi.",
  },
]
