# Enhancement Plan: Dashboard Koordinator (Lecturer)

Implementasi fitur lanjutan untuk meningkatkan produktivitas Koordinator dalam mengeloa persuratan.

## Proposed Changes

### 1. UI/UX Dashboard
- **Bulk Selection**: Menambahkan checkbox pada tabel `letter_requests`.
- **Bulk Action Toolbar**: Muncul saat baris dipilih, menyediakan tombol "Setujui Semua" dan "Tolak Semua".
- **Statistik Visual**: Mengganti Card statistik statis dengan visualisasi data menggunakan library chart (seperti Recharts atau minimal CSS bar) untuk menunjukkan rasio status surat.

### 2. Fitur Manajemen Data
- **Profile Mini-Editor**: Menambahkan modal atau section khusus untuk Dosen memperbarui data **Gelar** dan **No HP** mereka agar tersinkronisasi di surat yang dihasilkan.
- **Auto-Filter by Active Session**: Dashboard secara otomatis mendeteksi Prodi asal Dosen dan menjadikannya filter default (saat ini sudah ada dasarnya di `dosen_dashboard_settings`).

### 3. Komponen Verifier (Preview)
- **Side-by-Side Preview**: Mengoptimalkan halaman `/koordinator/verifier/[id]` agar tampilan data input mahasiswa dan file lampiran bisa dilihat berdampingan tanpa berganti tab.

## Technical Tasks
- [ ] Update `app/(dashboard)/koordinator/dashboard/page.tsx` untuk logika Bulk Action.
- [ ] Create `components/koordinator/bulk-action-bar.tsx`.
- [ ] Update logic `useSettings` untuk memastikan default filter selalu tepat sasaran.

## Verification Plan
- Uji coba menyetujui 5 surat sekaligus.
- Pastikan update Gelar di dashboard berdampingan dengan data di tabel `dosen`.
