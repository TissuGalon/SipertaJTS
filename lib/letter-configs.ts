import * as z from 'zod';
import { FormFieldConfig, LetterType } from '@/types';

export const letterConfigs: Record<string, FormFieldConfig[]> = {
  surat_magang: [
    {
      name: 'companyName',
      label: 'Nama Perusahaan/Instansi',
      type: 'text',
      placeholder: 'Contoh: PT. PLN (Persero) Aceh',
      validation: z.string().min(3, 'Nama perusahaan minimal 3 karakter'),
    },
    {
      name: 'companyAddress',
      label: 'Alamat Perusahaan',
      type: 'textarea',
      placeholder: 'Masukkan alamat lengkap perusahaan',
      validation: z.string().min(5, 'Alamat perusahaan minimal 5 karakter'),
    },
    {
      name: 'startDate',
      label: 'Tanggal Mulai Magang',
      type: 'text',
      placeholder: 'YYYY-MM-DD',
      validation: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
    },
    {
      name: 'endDate',
      label: 'Tanggal Selesai Magang',
      type: 'text',
      placeholder: 'YYYY-MM-DD',
      validation: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
    },
    {
      name: 'krs',
      label: 'Lampiran KRS (PDF)',
      type: 'file',
      validation: z.any().optional(),
    }
  ],
  surat_penelitian: [
    {
      name: 'researchTitle',
      label: 'Judul Penelitian/Skripsi',
      type: 'textarea',
      placeholder: 'Masukkan judul penelitian lengkap',
      validation: z.string().min(10, 'Judul penelitian minimal 10 karakter'),
    },
    {
      name: 'location',
      label: 'Lokasi Pengambilan Data',
      type: 'text',
      placeholder: 'Nama instansi/lokasi proyek',
      validation: z.string().min(3, 'Lokasi harus diisi'),
    },
    {
      name: 'supervisor',
      label: 'Dosen Pembimbing',
      type: 'text',
      placeholder: 'Nama Dosen Pembimbing Utama',
      validation: z.string().min(3, 'Nama pembimbing harus diisi'),
    },
    {
      name: 'proposal',
      label: 'Lampiran Outline/Proposal (PDF)',
      type: 'file',
      validation: z.any().optional(),
    }
  ],
  surat_aktif_kuliah: [
    {
      name: 'purpose',
      label: 'Keperluan Surat',
      type: 'text',
      placeholder: 'Contoh: Pengurusan Beasiswa, Tunjangan Gaji Orang Tua, dll.',
      validation: z.string().min(3, 'Keperluan harus diisi'),
    },
    {
      name: 'semester',
      label: 'Semester',
      type: 'select',
      options: [
        { label: 'Semester 1', value: '1' },
        { label: 'Semester 2', value: '2' },
        { label: 'Semester 3', value: '3' },
        { label: 'Semester 4', value: '4' },
        { label: 'Semester 5', value: '5' },
        { label: 'Semester 6', value: '6' },
        { label: 'Semester 7', value: '7' },
        { label: 'Semester 8', value: '8' },
      ],
      validation: z.string(),
    },
    {
      name: 'academicYear',
      label: 'Tahun Akademik',
      type: 'text',
      placeholder: 'Contoh: 2023/2024',
      validation: z.string().min(4, 'Tahun akademik harus diisi'),
    }
  ],
  surat_cuti: [
    {
      name: 'reason',
      label: 'Alasan Cuti',
      type: 'textarea',
      placeholder: 'Jelaskan alasan pengajuan cuti akademik',
      validation: z.string().min(10, 'Alasan cuti minimal 10 karakter'),
    },
    {
      name: 'duration',
      label: 'Lama Cuti (Semester)',
      type: 'select',
      options: [
        { label: '1 Semester', value: '1' },
        { label: '2 Semester', value: '2' },
      ],
      validation: z.string(),
    },
    {
      name: 'supportDoc',
      label: 'Dokumen Pendukung (Sakit/Lainnya)',
      type: 'file',
      validation: z.any().optional(),
    }
  ],
  surat_sidang: [
    {
      name: 'sidangType',
      label: 'Jenis Sidang/Seminar',
      type: 'select',
      options: [
        { label: 'Seminar Hasil Magang', value: 'magang' },
        { label: 'Seminar Proposal Skripsi', value: 'proposal' },
        { label: 'Seminar Hasil Skripsi', value: 'hasil' },
        { label: 'Sidang Akhir (Munaqasyah)', value: 'akhir' },
      ],
      validation: z.string(),
    },
    {
      name: 'title',
      label: 'Judul Laporan/Skripsi',
      type: 'textarea',
      placeholder: 'Pastikan judul sudah disetujui pembimbing',
      validation: z.string().min(10, 'Judul minimal 10 karakter'),
    },
    {
      name: 'supervisor1',
      label: 'Dosen Pembimbing 1',
      type: 'text',
      validation: z.string().min(3, 'Nama pembimbing 1 harus diisi'),
    },
    {
      name: 'supervisor2',
      label: 'Dosen Pembimbing 2',
      type: 'text',
      validation: z.any().optional(),
    },
    {
      name: 'approvalDoc',
      label: 'Lembar Persetujuan Sidang (PDF)',
      type: 'file',
      validation: z.any().optional(),
    }
  ]
};
