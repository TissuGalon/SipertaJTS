import { LetterRequest, User } from "@/types"

export const mockStudents: User[] = [
  {
    id: "s1",
    name: "Ahmad Fauzi",
    nim: "21010123",
    email: "ahmad@student.ac.id",
    role: "mahasiswa",
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

export const mockLecturers: User[] = [
  { id: "l1", name: "Drs. Amru", email: "amru@pnl.ac.id", role: "dosen", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Amru" },
  { id: "l2", name: "Ir. Herri Mahyar", email: "herri@pnl.ac.id", role: "dosen", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Herri" },
  { id: "l3", name: "Mulizar, S.T., M.T.", email: "mulizar@pnl.ac.id", role: "dosen", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mulizar" },
  { id: "l4", name: "Nazira Suha Al Bakri, S.T., M.T.", email: "nazira@pnl.ac.id", role: "dosen", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nazira" },
  { id: "l5", name: "Dr. Eng. Ir. Hamzah, M.T.", email: "hamzah@pnl.ac.id", role: "dosen", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Hamzah" },
  { id: "l6", name: "Ir. Syamsul Bahri, M.T.", email: "syamsul@pnl.ac.id", role: "dosen", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Syamsul" },
  { id: "l7", name: "Dra. Siti Hajar, M.T.", email: "siti@pnl.ac.id", role: "dosen", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Siti" },
  { id: "l8", name: "M. Yunus, S.T., M.T.", email: "yunus@pnl.ac.id", role: "dosen", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Yunus" },
  { id: "l9", name: "Fadhli, S.T., M.T.", email: "fadhli@pnl.ac.id", role: "dosen", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Fadhli" },
  { id: "l10", name: "Zulkifli, S.T., M.T.", email: "zulkifli@pnl.ac.id", role: "dosen", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Zulkifli" },
  ...Array.from({ length: 46 }).map((_, i) => ({
    id: `l${i + 11}`,
    name: `Dosen Jurusan Sipil ${i + 11}`,
    email: `dosen${i + 11}@pnl.ac.id`,
    role: "dosen" as const,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Lecturer${i + 11}`
  }))
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
    type: "surat_penelitian",
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
