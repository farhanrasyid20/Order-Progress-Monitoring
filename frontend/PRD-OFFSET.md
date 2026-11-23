# Tahap 3 — Revisi Tooling / Plate Offset

**Status:** Perlu penyempurnaan implementasi Tahap 3 sebelumnya.

## 3.1 Tujuan

Memperbaiki mekanisme Add, Edit, dan Details Tooling/Plate Offset agar mengikuti pola penggunaan Tooling Converting, tetapi dengan logika berbeda.

- Converting: memilih project untuk membuat order tooling.
- Offset: project memilih tooling yang tersedia, seperti memilih barang dari katalog.
- Tooling Offset harus dapat didaftarkan tanpa Sample Number dan digunakan kembali oleh project yang sesuai.
- Pertahankan seluruh field khusus Tooling Offset yang sudah diimplementasikan.

## 3.2 Add Tooling Offset

Tambahkan tombol **+ Add Tooling** pada halaman `/offset/plate`.

Modal Add Tooling menggunakan layout yang konsisten dengan Add Tooling Converting:

- Modal lebar dengan susunan dua kolom.
- Header dan footer tetap terlihat.
- Area form dapat di-scroll.
- Tombol Cancel dan Save Tooling.
- Tidak menggunakan modal sempit seperti implementasi sebelumnya.

### Order Source

Sediakan dua pilihan:

**A. Existing Project / Sample Number**

- User memilih project Offset yang sudah tersedia.
- Sample Number, Customer, Description, Material, Imposition/UP, dan PIC otomatis dari project.
- Field informasi project bersifat read-only.
- User melengkapi field khusus tooling.
- Setelah disimpan, tooling masuk katalog dan langsung terhubung dengan project yang dipilih.

**B. No Sample Number Yet (Manual Entry)**

- User dapat mendaftarkan tooling tanpa memilih project.
- MC No./Tooling Code diisi manual.
- Customer, Description, Material, Imposition/UP, dan PIC dapat diisi manual.
- Field khusus tooling lainnya tetap tersedia.
- Data masuk katalog Tooling Offset.
- Tidak otomatis membuat project atau menghasilkan Sample Number baru.
- Tooling tersebut dapat dipilih oleh project Offset di kemudian hari.

## 3.3 Field Tooling Offset

Pertahankan field berikut:

| Field | Ketentuan |
|---|---|
| MC No./Tooling Code | Input manual, identitas tooling |
| Customer | Otomatis dari project atau manual |
| Description | Otomatis dari project atau manual |
| Material | Otomatis dari project atau manual |
| Imposition/UP | Otomatis dari project atau manual |
| Gramatur | Dropdown yang sudah diimplementasikan |
| Open Size Width | Input manual |
| Open Size Length | Input manual |
| Priority | Low, Medium, Hard |
| PIC | Otomatis dari project atau manual |
| Machine | Dropdown mesin Offset yang sudah tersedia |
| Order Date | Opsional saat Add |
| Received Date | Opsional saat Add |
| Supplier | Input |
| Invoice Number | Input |
| Price | Input |
| Image | Lampiran |
| Remark | Textarea |

Jangan mengganti field Offset dengan field Tooling Converting.

## 3.4 Edit pada Project Tooling/Plate

Tombol Edit pada baris project **tidak langsung membuka form pembuatan tooling**.

Sebagai gantinya:

1. Buka modal `Select Tooling`.
2. Tampilkan daftar tooling yang sudah didaftarkan melalui Add Tooling.
3. User memilih tooling berdasarkan MC No./Tooling Code.
4. Setelah dipilih, tampilkan informasi tooling seperti Customer, Description, Material, Gramatur, Machine, dan Open Size.
5. User dapat menghubungkan tooling tersebut dengan project.
6. Jika tooling belum tersedia, arahkan user ke tombol `+ Add Tooling`.
7. Jangan membuat record tooling baru hanya karena user memilih tooling.

Pemilihan tooling harus memvalidasi kesesuaian customer dan spesifikasi. Jika tidak sesuai, jangan menghubungkannya secara otomatis.

## 3.5 Edit Data Tooling

Sediakan tindakan **Edit Tooling Record** yang berbeda dari Edit Project.

Edit Tooling Record digunakan untuk memperbarui:

- Informasi order tooling.
- Supplier, invoice, dan price.
- Received Date.
- Image dan Remark.
- Field tooling lain sesuai kebutuhan.

Perubahan data tooling tidak boleh mengubah `mainData` project.

## 3.6 Penerimaan Tooling

Pencatatan penerimaan tooling dilakukan setelah order dibuat, mengikuti pola operasional Tooling Converting.

- Received Date boleh kosong saat Add Project atau Add Tooling.
- Received Date dapat dilengkapi kemudian melalui Edit Tooling Record.
- Pengisian data akhir dapat dilakukan oleh anak magang sesuai hak akses aplikasi.
- Save Tooling tetap diperbolehkan meskipun Received Date kosong.
- Data penerimaan dan perubahan penting dicatat dalam riwayat.

### Validasi sebelum Printing

Untuk project yang membutuhkan Tooling:

- Tooling harus sudah dipilih dan terhubung ke project.
- Received Date wajib terisi.
- Status tooling harus menunjukkan bahwa tooling sudah diterima/siap.
- Jika persyaratan belum terpenuhi, project tidak boleh melanjutkan ke Printing.
- Tampilkan pesan validasi yang menjelaskan data yang belum lengkap.

Untuk project yang tidak membutuhkan Tooling, validasi tersebut tidak diberlakukan, tetapi keputusan `Not Required` harus tercatat.

Validasi ini harus terintegrasi dengan validasi Varnish ketika workflow paralel diimplementasikan.

## 3.7 Katalog Tooling Offset

Tooling disimpan sebagai record independen dari project.

- Setiap tooling memiliki identitas unik.
- MC No./Tooling Code tidak sama dengan Sample Number.
- Satu tooling dapat digunakan kembali oleh beberapa project yang sesuai.
- Project menyimpan referensi tooling yang dipilih.
- Mengganti tooling pada project tidak menghapus record tooling sebelumnya.
- Data tooling lama pada `offsetTooling` tetap dapat dibaca dan tidak boleh hilang.

## 3.8 Details dan Project History

Modal Details menampilkan:

- Sample Number project.
- Tooling Code yang dipilih.
- Informasi spesifikasi tooling.
- Informasi order dan penerimaan.
- Lampiran gambar.
- Riwayat pemilihan, perubahan, dan penerimaan tooling.

## 3.9 Batasan Implementasi

- Jangan mengubah Tooling Converting.
- Jangan mengubah Incoming Design, Prepress, atau Material/MI yang sudah selesai.
- Jangan mengubah format Sample Number `YYMMNNN`.
- Jangan mengubah `mainData` untuk menyimpan informasi katalog tooling.
- Jangan mengaktifkan workflow paralel sebelum tahap khusus workflow dikerjakan.
- Jangan membuat ulang field Tooling Offset yang sudah tersedia.
- Pertahankan kompatibilitas data project dan tooling lama.

## 3.10 Kriteria Selesai

Tahap ini dianggap selesai jika:

1. Add Tooling mendukung Existing Project dan Manual Entry.
2. Layout Add Tooling konsisten dengan Converting.
3. Edit Project dapat memilih tooling yang sudah tersedia.
4. Edit Tooling Record dapat melengkapi Received Date dan informasi lainnya.
5. Tooling yang sama dapat digunakan kembali tanpa duplikasi record.
6. Details dan History menampilkan hubungan project dengan tooling.
7. Data lama tetap kompatibel.
8. Test dan build berhasil.

**Catatan:** Validasi lengkap sebelum Printing diselesaikan pada tahap workflow berikutnya, bukan dengan memaksa perpindahan tahap baru pada revisi ini.