import * as z from 'zod';
import { FormFieldConfig, LetterType } from '@/types';

export const letterConfigs: Record<string, FormFieldConfig[]> = {
  surat_magang: [
    {
      name: 'companyName',
      label: 'Nama Perusahaan',
      type: 'text',
      placeholder: 'Contoh: PT. Teknologi Indonesia',
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
      label: 'Tanggal Mulai',
      type: 'text', // In a real app, use a Date Picker
      placeholder: 'YYYY-MM-DD',
      validation: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
    },
    {
      name: 'endDate',
      label: 'Tanggal Selesai',
      type: 'text',
      placeholder: 'YYYY-MM-DD',
      validation: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
    },
    {
      name: 'documents',
      label: 'Lampiran (KRS/Transkrip)',
      type: 'file',
      validation: z.any().optional(),
    }
  ],
  surat_aktif_kuliah: [
    {
      name: 'purpose',
      label: 'Keperluan',
      type: 'text',
      placeholder: 'Contoh: Beasiswa, BPJS, dll.',
      validation: z.string().min(3, 'Keperluan harus diisi'),
    },
    {
      name: 'semester',
      label: 'Semester Saat Ini',
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
      name: 'ktm',
      label: 'Foto KTM',
      type: 'file',
      validation: z.any().optional(),
    }
  ],
  permintaan_penelitian: [
    {
      name: 'researchTitle',
      label: 'Judul Penelitian',
      type: 'textarea',
      placeholder: 'Masukkan judul penelitian lengkap',
      validation: z.string().min(10, 'Judul penelitian minimal 10 karakter'),
    },
    {
      name: 'location',
      label: 'Lokasi Penelitian',
      type: 'text',
      placeholder: 'Nama instansi/perusahaan tempat penelitian',
      validation: z.string().min(3, 'Lokasi penelitian harus diisi'),
    },
    {
      name: 'proposal',
      label: 'Upload Proposal (PDF)',
      type: 'file',
      validation: z.any().optional(),
    }
  ],
  undangan_seminar: [
    {
      name: 'seminarName',
      label: 'Nama Seminar',
      type: 'text',
      placeholder: 'Contoh: Seminar Nasional Teknologi 2024',
      validation: z.string().min(5, 'Nama seminar harus diisi'),
    },
    {
      name: 'date',
      label: 'Tanggal Seminar',
      type: 'text',
      placeholder: 'YYYY-MM-DD',
      validation: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
    },
  ],
  penyelesaian_studi: [
    {
      name: 'graduationPeriod',
      label: 'Periode Wisuda',
      type: 'text',
      placeholder: 'Contoh: Gelombang II 2024',
      validation: z.string().min(3, 'Periode wisuda harus diisi'),
    },
    {
      name: 'transcript',
      label: 'Transkrip Nilai Terakhir',
      type: 'file',
      validation: z.any().optional(),
    }
  ]
};
