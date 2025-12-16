## Fleet Booking & Monitoring

Aplikasi pemesanan kendaraan tambang nikel dengan approval berjenjang (minimal 2 level), dashboard pemakaian, log audit, dan export laporan ke Excel (CSV). UI responsif berbasis Next.js.

### Stack
- Framework: Next.js 16 (app router) + React 19
- UI: Tailwind CSS v4
- Database (opsional, untuk audit log): MongoDB 7.x
- Bahasa: TypeScript
- PHP version (referensi integrasi legacy): 8.2

### Akun Demo
- Admin: `admin-01` (Aulia) — bebas pilih via dropdown di header
- Approver L1: `apr-01` (Pak Bima) atau `apr-03` (Region Sulawesi)
- Approver L2: `apr-02` (Bu Chandra)
Password tidak diproteksi di demo (pilih user dari dropdown). Untuk produksi tambahkan auth sendiri.

### Menjalankan Aplikasi
```bash
cd sekawan
npm install
npm run dev
# buka http://localhost:3000
```

### Konfigurasi MongoDB (opsional, untuk simpan log)
Buat file `.env.local` di root project:

**Untuk MongoDB Atlas (cloud):**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fleet_monitoring
```

**Contoh dengan connection string yang diberikan:**
```
MONGODB_URI=mongodb+srv://zhafranmirsyad:6HksSYhNYINIZgiO@zhafranappcluster.sw76p.mongodb.net/fleet_monitoring
```

**Untuk MongoDB lokal:**
```
MONGODB_URI=mongodb://127.0.0.1:27017/fleet_monitoring
```

**Catatan:**
- Nama database bisa disertakan di URI (setelah `/`) atau akan menggunakan default `fleet_monitoring`
- Jika MONGODB_URI tidak di-set, aplikasi tetap berjalan normal (log hanya tersimpan di memory/UI)
- Hanya perlu **satu** environment variable: `MONGODB_URI`

### Fitur Utama
- Admin input pemesanan: pilih kendaraan, driver, tanggal, estimasi BBM/KM, serta approver level 1 & 2.
- Persetujuan berjenjang: Approver hanya bisa bertindak jika level sebelumnya sudah approve.
- Dashboard: grafik trip bulanan, kartu status (menunggu, disetujui, ditolak, rencana BBM).
- Laporan periodik: filter tanggal lalu `Export Excel` (CSV dengan ekstensi .xls agar mudah dibuka di Excel).
- Log aplikasi: setiap proses tercatat, dikirim ke endpoint `/api/audit` (tersambung ke Mongo bila tersedia).
- Data contoh: 6 kendaraan di berbagai region (HQ, cabang, 6 tambang).

### Endpoint
- `POST /api/audit` — menyimpan log ke koleksi `audit_logs` (MongoDB). Gagal koneksi tidak memutus alur (graceful).

### Physical Data Model (ringkas)
```mermaid
erDiagram
  vehicle ||--o{ booking : digunakan_oleh
  booking ||--|{ approval : memiliki
  vehicle ||--o{ vehicle_log : dicatat
  booking {
    string id
    string vehicleId
    string region
    date startDate
    date endDate
    number fuelPlan
    number kmEstimate
    string status
  }
  approval {
    string approverId
    number level
    string status
    string note
  }
  vehicle_log {
    string vehicleId
    number fuelUsed
    number odo
    string type // pemakaian/service
  }
```

### Activity Diagram (pemesanan)
```mermaid
flowchart TD
  A[Admin input booking] --> B[Set driver & approver L1,L2]
  B --> C[Submit]
  C --> D{Approval L1}
  D -- Tolak --> R[Status Rejected + log]
  D -- Setuju --> E{Approval L2}
  E -- Tolak --> R
  E -- Setuju --> F[Status Approved]
  F --> G[Log tersimpan & siap dieksekusi]
```

### Panduan Singkat Penggunaan
1) Pilih peran pada dropdown header (Admin atau Approver).  
2) Admin isi form pemesanan, set driver serta approver level 1 & 2, lalu simpan.  
3) Approver membuka tabel pemesanan, klik `Setujui` atau `Tolak` sesuai level.  
4) Gunakan filter tanggal + tombol `Export Excel` untuk laporan periodik.  
5) Pantau kartu ringkasan dan grafik pada dashboard. Log setiap aksi muncul di panel log.
