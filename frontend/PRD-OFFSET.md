# PRD — Workflow Offset | COTS Order Progress Monitoring

**Versi:** 1.0 — baseline pengembangan bertahap  
**Tanggal:** 18 November 2026  
**Status:** Siap sebagai acuan implementasi bertahap; keputusan terbuka ditandai `TBD` dan **tidak boleh diasumsikan**  
**Cakupan:** Hanya project dengan `Process Route = Offset`  
**Referensi:** Workbook `form offset dan digital 2.xlsx` (sheet `BUTTON ADD PROJECT`, `BUTTON TOOLING`, `PREPRESS`); tiga transkrip diskusi operasional; struktur aplikasi COTS yang ada.

## 1. Tujuan

Menyelesaikan workflow Offset dari Incoming Design hingga Press/Printing (sebelum QC) dengan satu data project yang konsisten, update tahap dari modal Details, pengisian ulang seminimal mungkin, pemantauan waiting/ready, dan history yang tidak hilang. **Tidak membuat report Product Record** seperti contoh report yang diberikan.

## 2. Batasan wajib dan kompatibilitas

1. **Jangan mengubah perilaku, alur, validasi, tampilan, atau data project Converting maupun Digital.** Incoming Design adalah menu bersama; perubahan harus dibatasi pada cabang `Offset`.
2. **Pertahankan layout COTS saat ini.** Gunakan komponen, pola card, modal Details, tombol, dan styling yang sudah ada; tidak melakukan redesign.
3. **Pola interaksi mengikuti Converting:** Add Project di Incoming Design; **Update Next Preparation dilakukan melalui modal Details Incoming Design**. Jangan memindahkan kontrol tersebut ke Add Project.
4. Seluruh field Add Project Offset **harus tersedia untuk dilihat** pada modal Details di **setiap** menu Offset. Tidak berarti semua field dapat diedit di semua menu.
5. Gunakan **satu identitas project** lintas menu; hindari pembuatan project duplikat saat perpindahan tahap. Field otomatis diambil dari sumber project yang sama.
6. Pertahankan histori perubahan dan data selesai; jangan menghapus record ketika berpindah tahap.
7. Jangan mengubah sistem penyimpanan seluruh aplikasi atau membuat migrasi lintas modul tanpa tugas dan persetujuan tersendiri.
8. Jangan membangun seluruh PRD dalam satu eksekusi Codex. Implementasi harus dilakukan bertahap dengan review setelah tiap tahap.

## 3. Pengguna dan tanggung jawab

Pengguna aplikasi yang dibahas: Design, Intern Design, SPV Design, QC. Sistem ini **memantau dan mencatat progres**; bukan aplikasi operator produksi. Kewenangan detail per role mengikuti implementasi saat ini, kecuali ada persetujuan perubahan eksplisit.

## 4. Model alur Offset

```text
Incoming Design
  Add Project Offset → project muncul di Incoming Design
  Modal Details → Update Next Preparation: Prepress
            ↓
Prepress (proof color, plot, plate, remark)
  Next Preparation: Material
            ↓
Material / MI (kebutuhan dan kesiapan material)
  Next Preparation, sesuai kebutuhan:
    ├─ Tooling (jika perlu tooling baru/menunggu tooling)
    ├─ Block / Spot Varnish (jika proses ini perlu ditunggu)
    └─ Press / Printing (jika kebutuhan lain sudah siap/tidak perlu)
            ↓
Press / Printing → tahap sebelum QC (detail QC di luar cakupan)
```

**Aturan alur:**
- Prepress adalah tujuan pertama dari Incoming Design untuk Offset; **jangan langsung mengarahkan Offset dari Incoming ke Material**.
- Setelah Prepress, **wajib melewati tahap Material** terlebih dahulu. Tidak menyediakan lompatan langsung Prepress → Printing pada baseline ini.
- Setelah Material, urutan **fleksibel**. Tooling dan Block/Spot Varnish **tidak otomatis wajib**; dapat dilewati bila sudah tersedia, menggunakan tooling lama yang sesuai, atau tidak dibutuhkan.
- Dari Tooling atau Varnish, kelanjutan diarahkan berdasarkan kebutuhan yang masih tersisa, sampai Printing. Jangan memaksa satu rantai tetap yang membuat user melewati tahap tidak relevan.
- **Next Preparation adalah perpindahan/penetapan tahap monitoring**, bukan otomatis membuat Purchase Order, request supplier, atau pekerjaan produksi fisik.
- Bila suatu kebutuhan belum siap, user harus bisa menyimpan status/remark waiting tanpa dipaksa menandai siap atau menyelesaikan proses.

## 5. Kebutuhan lintas menu

### FR-C01 — Identitas dan sumber data tunggal
- Project Offset dibuat satu kali melalui Add Project Incoming Design.
- Semua menu dan modal Details Offset membaca identitas project dan field awal yang sama.
- Perpindahan tahap **tidak membuat project baru**.
- Perubahan field master yang diizinkan harus tercermin pada semua Details Offset; jangan membentuk salinan field master yang kemudian tidak sinkron.

### FR-C02 — Modal Details lengkap pada semua menu Offset
Modal Details pada **Incoming Design (project Offset), Prepress, Material/MI, Tooling, Block/Spot Varnish, Press/Printing** harus dapat menampilkan **seluruh field Add Project Offset**, termasuk field yang kosong, dengan label/kelompok yang dapat dikenali. Informasi khusus tahap boleh ditampilkan sebagai section tambahan, tanpa menghapus informasi project awal.

- Field master secara default bersifat **read-only** pada modal tahap lanjutan; edit dilakukan lewat mekanisme yang memang diizinkan aplikasi.
- Modal Details harus tetap menggunakan pola tampilan dan komponen existing.
- Tidak membuat ulang Add Project Offset di setiap menu.

### FR-C03 — Remark, waiting, reminder, history
- User dapat mencatat remark proses, misalnya `Waiting Ink`, `Ink Ready`, `Waiting Tooling`, `Plate Ready`, `Proof Color Ready`, atau `Plot Ready` sebagai **contoh isi**, bukan daftar status wajib yang dipaksakan.
- Remark terbaru yang relevan ditampilkan di Details/tahap berjalan. Remark sebelumnya **tetap tersimpan** di Project History dengan waktu, tahap, dan pelaku jika data pelaku tersedia.
- **Remark kosong tidak otomatis berarti kebutuhan sudah ready.** Kesiapan harus berdasarkan pembaruan yang jelas.
- Waiting yang belum selesai harus tetap dapat terlihat walaupun project berpindah tahap; ketika resolved, history tetap menyimpan catatan sebelumnya.
- Reminder `Weight belum diisi` muncul selama Weight Offset kosong; hilang setelah terisi valid. Jangan menimpa atau menghapus remark user hanya untuk menampilkan reminder.

### FR-C04 — Konsistensi data
- Saat project dipindahkan, field awal, remark/history, dan data tahap yang sudah diisi tetap tersimpan.
- Status aktif, selesai, dan dibatalkan tidak boleh menyebabkan penghapusan history.
- Jangan memperluas cakupan menjadi redesign dashboard, ekspor, atau database bersama dalam PRD ini.

## 6. Detail kebutuhan per menu

### FR-01 — Incoming Design / Add Project Offset

**Pola UI:** gunakan form Add Project Offset yang ada. Setelah Save, project muncul pada daftar Incoming Design. User membuka **modal Details Incoming Design** untuk melihat informasi dan melakukan **Update Next Preparation → Prepress**, mengikuti pola Converting tanpa mengubah Converting.

**Field sumber dari sheet `BUTTON ADD PROJECT`:**

| Kelompok | Field |
|---|---|
| Klasifikasi | Process Route, PSR/Code, Preparation Type, Project Type |
| Project Information | MC No./Code, Customer, Description, Material, FG Qty (Sht), Imposition/UP, Grammage, Printing Side, Machine |
| Dimensions | Width, Length, Weight *(sheet tertulis `WEIGTH`)* |
| PIC | Name of Designer |
| Printing & Colour | Printing, Colours 1–5, jumlah Pantone, jumlah special colour |
| Coatings | Varnish, Lamination, Coating Side |
| Special Effect | Emboss, Deboss, Hotprint Gold/Silver, Spot UV |
| Penugasan | Assignment, Target, Remark |

**Ketentuan:**
- Pertahankan semua field, pilihan, dan data yang sudah didukung implementasi. Periksa ketidaksesuaian label/opsi terhadap Excel sebelum memperbaiki.
- `Weight` **boleh kosong** saat Add Project Offset; nilai `0` bukan nilai Weight valid untuk submit ke GA.
- Data awal tidak boleh hilang setelah Save, Edit, atau Update Next Preparation.
- **Jangan otomatis membuat MI atau order Tooling** hanya karena Add Project disimpan.
- **Jangan mengubah flow Converting** pada modal Details bersama.

**Acceptance criteria:**
1. Add Project Converting tetap berperilaku sama seperti sebelum perubahan.
2. Project Offset tersimpan dan muncul di Incoming Design.
3. Semua field Offset yang disimpan dapat dilihat kembali pada Details/Edit sesuai hak akses existing.
4. Weight kosong tidak menghalangi Save Offset.
5. User dapat memilih `Prepress` melalui **Next Preparation di modal Details Incoming Design**.
6. Setelah update, project yang sama tersedia di antrean Prepress dengan data utuh.

### FR-02 — Prepress

**Tujuan:** memantau persiapan plate, proof color, plot, dan kendala seperti tinta yang belum datang.

**Data otomatis:** seluruh field Add Project Offset tampil pada modal Details. Berdasarkan sheet `PREPRESS`, informasi khusus mencakup `No JO/PN/Code`, `ID Plate`, `Plate Type`, `FG Qty`, `Colours`, `Coating/Varnish`, dan referensi data customer/material/imposition. Opsi Plate Type di Excel: `GTO54`, `CD102`, `SM102`, `SUMITOMO`.

**Aksi user:**
- Melihat seluruh data master Offset tanpa mengisi ulang.
- Melengkapi **field khusus Prepress** yang relevan, termasuk ID Plate dan Plate Type, melalui kontrol yang mengikuti layout existing.
- Memperbarui remark/kesiapan proof color, plot, plate, tinta.
- Memperbarui **Next Preparation → Material** melalui mekanisme Details/Update yang konsisten.

**Aturan:** data master dari Incoming Design tidak boleh ditimpa hanya karena field tampilan Prepress kosong. Status production pada Excel (Prepress, Material, Coating/Varnish, Press, Finishing, QC & FG, Close Project) adalah referensi ringkasan, **bukan instruksi membuat seluruh modul baru**.

**Acceptance criteria:** project dari Incoming terlihat; seluruh field master tersedia pada Details; input khusus Prepress tersimpan; remark tercatat; user dapat melanjutkan ke Material tanpa kehilangan data.

### FR-03 — Material / MI

**Tujuan:** menampilkan spesifikasi dan memantau kebutuhan/request material.

**Data otomatis dari Add Project:** kode project, customer, description, material, grammage, Width, Length, dan informasi terkait. **Sheet Size = Width × Length** ditampilkan dari Dimensions sebagai **read-only**, bukan diketik ulang di MI.

**Aksi user:**
- Melihat seluruh field Add Project Offset pada modal Details.
- Melihat spesifikasi material dan sheet size yang otomatis terisi.
- Mengelola data/status MI sesuai kontrol existing, termasuk waiting/request/ready bila didukung.
- Menambah remark dan melihat history.
- Memilih Next Preparation setelah Material: **Tooling, Block/Spot Varnish, atau Printing**, berdasarkan kebutuhan.

**Catatan `TBD-MI-01`:** transkrip tidak sepenuhnya konsisten apakah `Quantity MI` otomatis dari `FG Qty (Sht)` atau diisi sebagai quantity request terpisah. **Jangan samakan kedua nilai secara otomatis tanpa konfirmasi.** Untuk sementara pertahankan perilaku quantity existing dan jangan membuat konversi/perhitungan baru.

**Acceptance criteria:** spesifikasi otomatis sesuai project; Sheet Size tidak bisa diedit langsung di MI; history tidak hilang; Next Preparation tidak memaksa Tooling/Varnish bila tidak diperlukan.

### FR-04 — Tooling (Offset)

**Tujuan:** memantau kebutuhan tooling Offset, termasuk penggunaan tooling lama atau kebutuhan penggantian.

**Aksi user:**
- Melihat seluruh field Add Project Offset pada modal Details.
- Menandai/mencatat bahwa tooling lama masih sesuai dan dapat digunakan, atau tooling baru/penggantian masih dibutuhkan.
- Memperbarui remark, status waiting/ready, dan kelanjutan ke proses yang masih diperlukan.
- Menelusuri riwayat tooling untuk project yang sama.

**Aturan:**
- Repeat order **tidak otomatis memerlukan order tooling baru**.
- Tooling baru dapat diperlukan jika tooling rusak atau drawing berubah; detail versi/kode penggantian adalah `TBD-TOOL-01`.
- Sheet `BUTTON TOOLING` adalah referensi form tooling (termasuk open size, priority, PIC, machine, supplier, invoice, price), **bukan bukti bahwa Offset wajib mempunyai form pemesanan Plate tersendiri**.
- Plate yang dibuat di Prepress **jangan disamakan secara otomatis** dengan order Tooling.

**Acceptance criteria:** project tidak dipaksa masuk Tooling jika tooling lama siap; jika masuk Tooling, Details tetap menampilkan seluruh field master; perubahan remark/history tersimpan.

### FR-05 — Block / Spot Varnish

**Tujuan:** memantau kebutuhan dan kesiapan varnish, bila relevan.

**Aksi user:**
- Melihat seluruh field Add Project Offset dan informasi coating/varnish pada Details.
- Mencatat waiting/ready dan remark bila kebutuhan varnish belum siap.
- Melanjutkan project ke Printing bila kebutuhan terkait telah siap.

**Aturan:**
- Berdasarkan diskusi, **Block Varnish umumnya diorder oleh Production**, bukan Design. **Jangan otomatis menambahkan fitur order pembelian Block Varnish oleh Design.**
- Jika tidak diperlukan atau sudah siap, tahap ini dapat dilewati.
- Perbedaan persis `Block Varnish` dan `Spot/Support Varnish` sebagai proses/order masih perlu dipastikan bila implementasi membutuhkan field tambahan (`TBD-VAR-01`).

**Acceptance criteria:** tahap opsional; detail master lengkap; status/remark dapat dilacak; tidak membuat order baru otomatis.

### FR-06 — Press / Printing (sebelum QC)

**Tujuan:** menampilkan kesiapan dan progres printing, bukan mengoperasikan mesin produksi.

**Aksi user:**
- Melihat seluruh field Add Project Offset pada modal Details.
- Memantau informasi kesiapan plate, material, tooling, tinta, dan varnish sesuai data yang tersedia.
- Menambah/memperbarui remark seperti `Waiting Ink`, `Printing Process`, `Printing Complete`.
- Melengkapi/memperbarui Weight ketika hasil fisik sudah diketahui, melalui jalur edit yang diizinkan.
- Melihat history lintas tahap.

**Aturan:**
- Project boleh memiliki remark waiting tinta saat sudah berada pada tahap Printing; jangan otomatis menganggap seluruh kebutuhan ready hanya karena tahap berubah.
- **Validasi Weight > 0 berlaku pada aksi submit ke GA**, bukan saat Add Project atau otomatis saat masuk Printing.
- Alur QC/GA sesudah Printing **di luar cakupan implementasi ini**, kecuali pengecekan validasi Weight pada titik submit ke GA yang sudah ada.

**Acceptance criteria:** semua data master terlihat; waiting dan history tidak hilang; Weight dapat dilengkapi; jika ada aksi submit GA, Weight kosong/0 ditolak hanya untuk Offset sesuai kebutuhan, tanpa mengubah validasi Converting.

## 7. Aturan bisnis ringkas

| ID | Aturan |
|---|---|
| BR-01 | Hanya berlaku untuk `Process Route = Offset`. |
| BR-02 | Update Next Preparation pertama dilakukan pada **modal Details Incoming Design**, mengikuti pola Converting. |
| BR-03 | Jalur awal: Incoming Design → Prepress → Material. |
| BR-04 | Setelah Material, Tooling/Varnish opsional; dapat langsung Printing jika kebutuhan sudah siap. |
| BR-05 | Seluruh field Add Project Offset terlihat di **semua modal Details Offset**. |
| BR-06 | Data project satu sumber; tidak ada pembuatan project duplikat saat transisi. |
| BR-07 | Weight opsional saat Add Project; reminder selama kosong. |
| BR-08 | Submit ke GA membutuhkan Weight > 0 gram; tidak berlaku sebagai syarat Add Project. |
| BR-09 | Remark lama tersimpan di history; remark kosong tidak berarti ready. |
| BR-10 | Tooling lama yang layak dapat dipakai kembali; jangan memaksa order baru. |
| BR-11 | Block Varnish yang ditangani Production tidak otomatis menjadi order baru Design. |
| BR-12 | Layout existing dan seluruh perilaku Converting tetap. |

## 8. Data, status, dan riwayat

Minimal pertahankan keterkaitan logis berikut (implementasi mengikuti model data existing, **bukan perintah membuat tabel database baru**):

- **Project master:** ID internal stabil, process route, seluruh field Add Project Offset.
- **Workflow:** tahap aktif/tujuan Next Preparation, status tahap, catatan waiting yang belum resolved.
- **Stage details:** informasi khusus Prepress, MI, Tooling, Varnish, Printing bila relevan.
- **History:** waktu, tahap asal/tujuan, perubahan remark/status, pelaku jika tersedia.

Jika kode saat ini hanya menggunakan localStorage, PRD ini **tidak** menginstruksikan migrasi database. Penyimpanan bersama lintas perangkat menjadi keputusan proyek terpisah.

## 9. Acceptance test end-to-end

1. Buat Offset dengan Weight kosong → Save berhasil, muncul di Incoming Design, reminder Weight terlihat.
2. Buka **Details Incoming Design** → seluruh field Add Project Offset terlihat → Update Next Preparation `Prepress` → project yang sama muncul di Prepress.
3. Buka **Details Prepress** → seluruh field awal terlihat; update Plate Type/ID Plate/remark → simpan dan buka kembali, nilai tetap ada.
4. Dari Prepress pilih Material → project muncul di Material, seluruh field awal tetap tersedia.
5. Buka MI → Material, Width, Length, Sheet Size berasal dari project dan tidak perlu diketik ulang; quantity mengikuti aturan existing sambil menunggu konfirmasi.
6. Project A: Tooling lama dan Varnish siap → dari Material dapat langsung Printing tanpa order baru.
7. Project B: Tooling belum siap → dapat menuju Tooling, mencatat waiting/ready, lalu melanjutkan sesuai kebutuhan.
8. Project C: Varnish masih ditunggu → dapat melalui tahap varnish dan melanjutkan ketika siap.
9. Di semua tahap, modal Details menampilkan seluruh field Add Project Offset dan history tetap dapat ditelusuri.
10. Remark `Waiting Ink` tidak hilang dari history ketika diganti `Ink Ready`; waiting aktif diperbarui dengan benar.
11. Submit GA (jika tombol/aksi sudah ada): Weight kosong atau 0 ditolak; Weight > 0 diterima sesuai validasi lain yang berlaku.
12. Regression: buat/edit/update Converting melalui Incoming Design → perilaku, tampilan, dan validasi **tetap sama**.

## 10. Urutan implementasi Codex

**Jangan mengeksekusi seluruh PRD sekaligus.** Gunakan file ini sebagai referensi dan berikan tugas kecil per tahap.

| Tahap | Ruang lingkup | Syarat selesai |
|---|---|---|
| 0 | Audit kode Add Project Offset, Details Incoming, stage view, data model; **tanpa edit** | Daftar gap dan file terkait |
| 1 | Perbaiki field/validasi/persistensi Add Project Offset | Data tersimpan; Weight opsional; Converting aman |
| 2 | Details Incoming Offset + Next Preparation → Prepress | Perpindahan benar, ID/data tidak hilang |
| 3 | Semua modal Details Offset menampilkan seluruh field Add Project | Konsisten/read-only sesuai tahap |
| 4 | Prepress: field khusus, remark, Next Preparation → Material | Data/riwayat tersimpan |
| 5 | Material/MI: data otomatis, sheet size, Next Preparation fleksibel | Tidak wajib melewati tahap opsional |
| 6 | Tooling & Varnish: monitoring opsional/reuse | Tidak memaksa order baru |
| 7 | Printing, reminder Weight, history dan validasi submit GA | Pengujian end-to-end dan regression Converting |

Setelah setiap tahap: jalankan pemeriksaan yang tersedia, laporkan file yang diubah, uji kasus Offset, dan pastikan **tidak ada perubahan perilaku Converting**. Jangan refactor besar atau mengubah file yang tidak relevan.

## 11. Keputusan terbuka — jangan diimplementasikan dengan asumsi

| ID | Pertanyaan | Sikap sampai dikonfirmasi |
|---|---|---|
| TBD-IN-01 | Apakah project otomatis muncul di antrean Prepress segera setelah Save, atau setelah Update Next Preparation di Details Incoming? | **Gunakan pola Details Incoming → Update Next Preparation → Prepress** yang diminta user; jangan membuat auto-advance baru. |
| TBD-MI-01 | Apakah Quantity MI sama dengan FG Qty (Sht) atau quantity request tersendiri? | Jangan otomatis samakan; pertahankan behavior existing. |
| TBD-PP-01 | Apakah ID Plate dan Plate Type wajib sebelum Prepress Complete? | Tampilkan/dukung field, tetapi jangan membuat validasi wajib baru. |
| TBD-TOOL-01 | Bagaimana versi tooling/drawing lama dan penggantian dicatat? | Jangan menambah versioning otomatis. |
| TBD-VAR-01 | Detail kebutuhan Block vs Spot/Support Varnish? | Pertahankan opsi dan pola existing, jangan membuat purchase flow baru. |
| TBD-WGT-01 | Apakah Weight yang dimaksud FG Weight atau Material Weight pada Product Record? | Gunakan field `Weight` Add Project Offset yang sudah ada; jangan menggabungkan jenis berat baru tanpa konfirmasi. |
| TBD-HIS-01 | Apakah status waiting harus berupa enum terstruktur atau remark teks? | Pakai pola status/remark existing, hindari enum baru tanpa persetujuan. |

## 12. Definition of Done

Satu tahap dianggap selesai hanya jika: fungsi Offset yang ditargetkan bekerja; field master utuh di Details; tidak ada duplikasi project; history dan waiting tidak hilang; layout existing dipertahankan; dan regression Converting lulus. Jika sebuah keputusan `TBD` diperlukan untuk implementasi, **hentikan bagian itu dan minta keputusan**, jangan menebak.
