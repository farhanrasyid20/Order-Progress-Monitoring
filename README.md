# Customer Order Tracking System

Customer Order Tracking System adalah aplikasi web internal perusahaan yang dirancang untuk membantu proses **tracking dan monitoring order customer** secara terstruktur, mulai dari order diterima hingga seluruh tahapan proses selesai.

Sistem ini memungkinkan pengguna untuk memantau posisi setiap order dalam workflow, mengetahui status pekerjaan terkini, PIC yang bertanggung jawab, deadline, dokumen terkait, serta riwayat aktivitas dari setiap proses.

## Anggota Tim

| Nama | NIM |
|---|---|
| Farhan Rasyid | 3312411075 |
| Aulya Anantha | 3312411076 |

## Tentang Sistem

Dalam proses pengelolaan order customer, sebuah order dapat melewati beberapa tahapan sebelum dinyatakan selesai. Customer Order Tracking System dibuat untuk memberikan informasi yang terpusat mengenai perkembangan setiap order.

Alur utama yang dimonitor oleh sistem adalah:

**Order Received → Design / Drawing → Review → Approval → Sample → Quality Control → Completed**

Melalui sistem ini, pengguna dapat mengetahui:

- Order yang sedang dikerjakan
- Tahapan proses dari setiap order
- Status pekerjaan terkini
- PIC yang bertanggung jawab
- Deadline setiap order
- Order yang mengalami keterlambatan
- Dokumen yang berkaitan dengan order
- Riwayat proses dan aktivitas order
- Tindakan atau proses yang perlu dilakukan selanjutnya

## Fitur Utama

### Dashboard

Dashboard menyediakan ringkasan kondisi order secara keseluruhan, meliputi:

- Total Orders
- Orders in Progress
- Waiting Approval
- Completed Orders
- Overdue Orders
- Order Progress
- Recent Orders
- Recent Activity

### Order Management

Digunakan untuk mengelola dan memonitor seluruh data order customer.

Fitur yang tersedia antara lain:

- Menampilkan seluruh order
- Pencarian berdasarkan nomor order atau customer
- Filter berdasarkan status, customer, PIC, proses, dan tanggal
- Menambahkan order baru
- Melihat detail order
- Mengubah informasi order
- Monitoring deadline dan status

### Order Detail

Halaman detail order menampilkan informasi lengkap mengenai sebuah order, seperti:

- Informasi customer
- Informasi produk
- Quantity
- Order date
- Deadline
- PIC
- Current status
- Process tracking
- Dokumen terkait
- Riwayat aktivitas

### Design / Drawing

Digunakan untuk mengelola proses pembuatan drawing atau desain dari sebuah order.

Status drawing meliputi:

- Not Started
- In Progress
- Submitted
- Under Review
- Revision Required
- Approved

Pengguna juga dapat mengunggah drawing dan mengirimkannya untuk proses review.

### Review & Approval

Digunakan untuk melakukan review terhadap drawing yang telah dikirim.

Reviewer dapat melakukan:

- Approve
- Request Revision
- Reject

Jika diperlukan revisi, reviewer dapat memberikan catatan revisi, perubahan yang diperlukan, serta deadline revisi.

### Sample

Digunakan untuk melakukan tracking terhadap proses pembuatan sample.

Status sample meliputi:

- Waiting
- In Progress
- Completed
- Revision

Sistem juga menyimpan history dari proses sample.

### Quality Control

Digunakan untuk melakukan pemeriksaan kualitas terhadap sample atau hasil pekerjaan.

Fitur QC meliputi:

- QC Checklist
- Specification
- Inspection Result
- Notes
- QC Status
- QC History

Status hasil pemeriksaan meliputi:

- Pass
- Fail
- Need Revision

### Reports

Halaman laporan digunakan untuk melihat data order berdasarkan beberapa filter seperti:

- Date Range
- Customer
- Order Status
- Process
- PIC

Laporan juga dapat diekspor ke dalam format:

- Excel
- PDF

### User Management

Administrator dapat mengelola pengguna yang memiliki akses ke dalam sistem.

Informasi pengguna meliputi:

- Nama
- Email
- Role
- Department
- Status
- Last Login

## User Role

Sistem memiliki beberapa role pengguna:

### Admin

Admin memiliki akses untuk:

- Melihat seluruh order
- Mengelola data order
- Memantau seluruh progress
- Mengelola user dan PIC
- Melihat status setiap proses
- Melihat riwayat order
- Mengakses laporan

### Design

User Design memiliki akses untuk:

- Melihat order yang ditugaskan
- Melihat detail order
- Mengelola proses drawing/design
- Mengubah status drawing
- Mengunggah drawing
- Mengirim drawing untuk review
- Melihat hasil review dan approval

### Quality Control

User Quality Control memiliki akses untuk:

- Melihat order yang masuk ke proses QC
- Melihat detail order
- Melakukan pemeriksaan
- Mengisi hasil pemeriksaan
- Mengubah status QC
- Melihat riwayat pemeriksaan

## Alur Sistem

```text
Login
  ↓
Dashboard
  ↓
Orders
  ↓
Order Detail
  ↓
Process Tracking
  ↓
Design / Drawing
  ↓
Review & Approval
  ↓
Sample
  ↓
Quality Control
  ↓
Completed
```

Setiap pengguna hanya dapat mengakses menu dan proses yang sesuai dengan role dan permission yang dimiliki.

## Teknologi yang Digunakan

Project ini dikembangkan menggunakan teknologi web modern:

- React
- TypeScript
- Vite
- CSS
- Node.js & npm
- Git & GitHub

## Struktur Project

```text
customer-order-tracking-system/
├── src/
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
│
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Menjalankan Project

Pastikan **Node.js** dan **npm** sudah terinstall pada komputer.

Clone repository:

```bash
git clone <repository-url>
```

Masuk ke direktori project:

```bash
cd customer-order-tracking-system
```

Install dependency:

```bash
npm install
```

Jalankan development server:

```bash
npm run dev
```

Setelah server berjalan, buka alamat localhost yang ditampilkan pada terminal.

## Desain UI/UX

Antarmuka Customer Order Tracking System dirancang dengan konsep:

- Simple
- Clean
- Minimalis
- Profesional
- Modern
- Corporate
- Data-focused
- Responsive
- Mudah digunakan

Desain mengutamakan **usability** dan **readability**, sehingga pengguna dapat dengan cepat memahami status dan perkembangan suatu order tanpa tampilan yang terlalu kompleks.

Sistem dirancang agar dapat digunakan pada beberapa ukuran perangkat:

- Desktop
- Tablet
- Mobile

## Tujuan Pengembangan

Pengembangan Customer Order Tracking System bertujuan untuk menghasilkan sistem monitoring order yang dapat membantu perusahaan dalam mengelola proses order secara lebih terstruktur dan terpusat.

Dengan adanya sistem ini, proses monitoring diharapkan menjadi lebih mudah karena informasi mengenai **status order, progress, PIC, deadline, dokumen, dan history proses** dapat diakses melalui satu sistem.

---

**Dikembangkan oleh:**

**Farhan Rasyid — 3312411075**  
**Aulya Anantha — 3312411076**
