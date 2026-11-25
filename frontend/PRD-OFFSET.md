PRD — COTS: Parallel Preparation Workflow Offset & Project History
Versi: 1.3 — monitoring Incoming, Prepress persistent queue dan integrasi persiapan, 25 November 2026
Status: Kesepakatan workflow dan rancangan kebutuhan; item TBD belum disetujui untuk implementasi.
Produk: Customer Order Tracking System (COTS)
Repository: Order-Progress-Monitoring
Acuan: Diskusi 24 November 2026, screenshot Details Incoming dan Add Tooling Converting, serta keputusan workflow sebelumnya. Dokumen ini bukan bukti fitur telah diimplementasikan.
1. Latar belakang dan tujuan
COTS memantau perjalanan project customer dari Incoming Design melalui proses persiapan hingga tahap berikutnya. Converting menjadi referensi mekanisme persiapan paralel: Request Material, Order Tooling, dan Order Rubber memiliki data dan progres masing-masing. Offset membutuhkan pola serupa dengan tambahan tahap Prepress. Tujuannya mengurangi input berulang, memungkinkan persiapan berjalan independen, mempertahankan satu identitas project, dan menyediakan riwayat aksi user terpusat.
2. Scope dan batasan
- Incoming Design, Converting sebagai referensi existing, Offset (Prepress, Material/MI, Tooling/Plate, Block/Spot Varnish, Printing), dan Project History terkait.
- Tidak ada modul Digital dalam cakupan COTS.
- Jangan mengubah perilaku Converting, redesign layout, menghapus data lama, membuat project duplikat, atau melakukan migrasi storage tanpa persetujuan.
- QC Check/FA Report, History & Archive, Issue Log, Master Data, Board Type Management dan Dashboard yang terlihat pada sidebar bukan target redesign. Audit dampak integrasi bila relevan; jangan mengasumsikan detail prosesnya.
- Pengguna yang dibahas: Design, Intern Design, SPV Design, QC. Matriks izin aktual harus diaudit; operator Production bukan pengguna utama.
- PRD ini mengatur target workflow Offset, bukan seluruh spesifikasi aplikasi. Ketentuan terbaru menggantikan usulan alur Offset linear atau katalog tooling lintas project yang bertentangan.
3. Terminologi
- Project: satu order/customer design dengan ID internal tetap.
- Sample Number: identitas tampilan project; jangan mengubah nomor tersimpan. Audit generator existing.
- Next Preparation: pilihan tahap utama berikutnya.
- Preparation Order: kebutuhan persiapan tambahan yang memiliki record sendiri.
- Draft: data persiapan yang belum dikirim melalui aksi Update induk. Status ini adalah data/lifecycle, bukan badge wajib pada UI Details Prepress.
- Submitted: data sudah dikirim ke menu tujuan; tidak berarti Ready. Status ini adalah data/lifecycle, bukan badge wajib pada UI Details Prepress.
- Ready: kesiapan proses berdasarkan aksi user yang sah.
- Tooling: die-cutting tooling; berbeda dari plate cetak pada Prepress.
- History: catatan kronologis aksi yang terkait ID project yang sama.
4. Baseline referensi Converting (FR-C01)
1. Create New Project melalui Incoming Design, kemudian Submit.
2. Buka Details Incoming Design; pilih Request Material / Create MI pada Next Preparation.
3. Add Preparation Order menambah dropdown Order Tooling atau Order Rubber. Maksimal satu pilihan masing-masing; tidak boleh dua Tooling atau dua Rubber.
4. Icon pencil membuka form detail sesuai jenis order. Data master diambil dari project; data order diisi sesuai kebutuhan.
5. Update mengirim data ke menu Material, Tooling dan Rubber yang dipilih. Abu-abu = belum submit; hijau = sudah submit, bukan otomatis ready.
6. Tooling/Rubber: saat ready, update status dan submit pada menu masing-masing. Material: lengkapi data material, update status dan submit saat ready.
7. Setelah seluruh kebutuhan persiapan yang berlaku selesai, project masuk Sample Progress; user memperbarui status Ready to Check QC.
8. Audit perilaku existing termasuk kasus order opsional, validasi, pembatalan draft dan aturan perpindahan. Jangan mengubah Converting untuk menyamakan Offset.
5. Target workflow Offset (FR-O01)
Incoming Design: Create Project -> Submit
-> otomatis masuk queue Prepress setelah Submit berhasil (tetap tampil di Incoming Design)
-> Prepress: update data persiapan
-> Details Prepress: Next Preparation = Material / MI
+ Preparation Order: Tooling / Plate dan/atau Block / Spot Varnish (dipilih manual jika diperlukan)
-> isi detail Tooling melalui pencil jika dipilih -> Update
|-- Material / MI: lengkapi data -> Ready / Submit
|-- Tooling: monitoring -> Ready / Submit (jika berlaku)
|-- Varnish: monitoring -> Ready / Submit (jika berlaku)
-> seluruh kebutuhan relevan siap -> Printing -> QC
Material, Tooling, dan Varnish dapat berjalan paralel setelah pengiriman dari Prepress. Tidak ada kewajiban menunggu Material selesai untuk mulai Tooling atau Varnish. Prepress tetap dilalui; Create Project tetap di Incoming Design. Printing adalah tahap akhir persiapan dan tempat update progress utama project sebelum QC, bukan tempat membuat project baru. Setelah seluruh persiapan yang diperlukan berstatus Ready, project masuk Printing secara otomatis dengan Project ID, Sample Number, dan master data yang sama. Definisi status/validasi readiness rinci tetap TBD.
6. Functional requirements
FR-O02 — Incoming Design Offset
- Add/Edit Project mempertahankan form dan field existing. Submit Add Project Offset yang berhasil menghasilkan satu project dengan stage awal Prepress, tampil sekaligus di Incoming Design dan queue Prepress. Edit tidak mengulang routing awal.
- Details menampilkan data master, current process, status, last update, dan Project History.
- Hapus kebutuhan memilih Next Preparation Prepress dan Update manual pada Details Incoming khusus Offset baru. Incoming Design tetap menjadi pusat monitoring seluruh project aktif tanpa bergantung pada stage.
- Submit Add Project mencatat Create dan perpindahan otomatis ke Prepress pada history project yang sama. Event otomatis bukan remark user. Tidak membuat MI, Tooling atau Varnish otomatis pada tahap ini.
- Details Incoming tetap dapat diakses sepanjang lifecycle. Filter Active menampilkan seluruh project aktif termasuk Prepress, Material, Tooling, Varnish, Printing dan QC; Completed/Cancelled mengikuti filter existing. Jangan membuat salinan project atau memindahkan project legacy otomatis. Pertahankan jalur penanganan legacy yang aman; bila perlu keputusan baru, laporkan blocker.
FR-O02A — Monitoring Incoming khusus Offset
- Preparation Check menampilkan Material / MI serta Tooling / Plate dan Block / Spot Varnish apabila dipilih dalam preparation plan. Gunakan data cabang aktual, bukan stage tunggal. Centang hijau hanya jika readiness cabang terkonfirmasi; abu-abu jika belum siap. Draft tidak dianggap submitted atau ready. Jangan menampilkan kebutuhan opsional yang tidak dipilih sebagai wajib.
- Details Incoming: Status & Preparation bersifat monitoring; Production / Design dan Next Preparation berupa informasi read-only, Next Preparation menampilkan Prepress sebagai rute awal, bukan current process. Hapus dropdown Next Preparation, tombol Update dan Cancel serta badge status pada action bar khusus Offset. Current Process tetap mengikuti proses aktual. Add Issue, Edit, Close dan Project History dipertahankan.
- Latest Remark menampilkan nama menu sumber pada baris pertama dan isi remark user terakhir yang tidak kosong pada baris kedua dengan teks abu-abu. Ambil dari aksi berhasil berdasarkan urutan waktu aktual pada project yang sama, termasuk Prepress, Material / MI, Tooling / Plate, Block / Spot Varnish dan Press / Printing. Abaikan event System dan teks otomatis; jangan menimpa master remark. Jika tidak ada remark tampilkan -. Update kosong tidak menghapus remark sebelumnya.
- Drawing Status: pertahankan data dan akses existing; bila penghapusan Update menyebabkan perubahan tidak dapat disimpan, laporkan dan minta keputusan sebelum mengubah mekanisme penyimpanannya. Read-only merupakan usulan belum final.
- Nama Current Process agregat (misalnya Offset Preparation) masih TBD; jangan mengubah enum atau routing untuk penamaan.
FR-O03 — Prepress
- Prepress menjadi daftar monitoring project Offset lintas stage: project tetap tampil setelah Update Preparation, termasuk selama Material, Tooling, Varnish, Printing dan QC. Gunakan project yang sama, bukan salinan. Jangan mengubah stage aktual hanya agar tampil di Prepress. Details dan data Prepress tetap dapat diakses; edit mengikuti izin/lifecycle existing. Update ulang tidak membuat record atau history ganda. Filter Active/Completed/Cancelled pada Prepress merupakan usulan yang perlu konfirmasi; jangan menghapus data selesai/batal.
- Edit Prepress memakai modal lebar dua kolom existing. Project Information read-only: Sample Number, MC No. / Code (mainData.mcNo), Customer, Description / Component, Material, FG Qty (SHT), Imposition / Up, Colours dari Printing, Coating / Varnish (mainData.varnish). Gunakan sumber existing; kosong tampil -; jangan mengarang mapping. ID Plate manual setelah cetak plate; Plate Type dropdown GTO54, CD102, SM102, SUMITOMO; FG Qty manual angka terpisah dari FG Qty (SHT).
- Proof Color, Plot, Plate, Ink wajib dipilih dari Ready / Waiting; project baru belum memiliki pilihan. Remark wajib jika salah satu Waiting, opsional jika semua Ready. Validasi UI dan provider; Save Prepress hanya menyimpan dan append history, tanpa routing. Jangan menambah gate semua Ready untuk Update Preparation. Pertahankan legacy tanpa konversi sembarang.
- Divider dan jarak 22px sebelum Prepress Status. Kolom Status tabel Prepress menampilkan grid 2x2 Proof, Plot, Plate, Ink, diikuti remark Prepress dengan teks kecil; tanpa badge, dot, background atau Last Update. Fallback -. Details menampilkan data yang sama secara read-only.
- Menerima project dari Incoming dengan ID dan data master yang sama.
- Data master tersedia pada Details; default read-only di tahap lanjutan.
- Kriteria Prepress selesai untuk handoff masih TBD; validasi Save mengikuti ketentuan di atas.
- Status & Preparation dalam Details Prepress mengikuti pola Details Incoming Converting, bukan membuat halaman Create Project baru.
- Letakkan Status & Preparation tepat setelah ringkasan Current Process, Status, dan Last Update pada modal Details Prepress; bukan di modal Edit Prepress.
- Next Preparation utama: Material / MI.
- Tombol + Add Preparation Order berada di kolom sebelah Next Preparation. Tombol terlihat namun disabled sebelum Material / MI dipilih.
- Klik + Add Preparation Order menambah satu baris dropdown Preparation Order. Selama ada dropdown kosong, tombol Add disembunyikan dan baris itu hanya menampilkan dropdown serta icon X. Setelah dropdown dipilih, tombol Add muncul kembali bila masih ada pilihan yang tersisa.
- Preparation Order hanya menyediakan Tooling / Plate dan Block / Spot Varnish; maksimal satu pilihan masing-masing dan tidak boleh duplikat. Baris menggunakan pola horizontal/grid Details Incoming yang memanfaatkan ruang kanan dan baru turun ke baris berikutnya bila ruang tidak mencukupi. Tooling memiliki maksimal satu draft aktif.
- Tooling dipilih manual dan memiliki icon pencil untuk membuka detail terkait project saat ini serta icon X untuk membatalkan pilihan/draft. Varnish dipilih manual, bukan order pembelian, tidak memiliki pencil atau modal order, dan hanya memiliki icon X. Penghapusan pilihan draft membebaskan pilihan kembali; record submitted tidak dihapus.
- Jangan tampilkan badge Draft atau Submitted pada baris Preparation Order maupun action bar Details Prepress. Status project tetap menggunakan ringkasan Details existing dan lifecycle data tetap disimpan terpisah.
- Tampilkan Varnish Type, Lamination, dan Coating Side dari Incoming sebagai informasi read-only. Nilai yang tidak dipilih tampil sebagai -. Kebutuhan monitoring Varnish ditentukan melalui pilihan manual Varnish pada Preparation Order; aturan jenis dan pengecualian kebutuhan masih TBD.
- Update mengirim Material, Tooling yang dipilih, dan Varnish yang dipilih manual ke queue masing-masing pada tahap integrasi. Tidak membuat record Varnish saat Save Project atau handoff Incoming ke Prepress. Tidak membuat record ganda atau record untuk kebutuhan yang tidak berlaku.
- Simpan detail Tooling sebagai draft tidak sama dengan submit. Representasi visual status di Details Prepress tidak boleh menambah badge Draft/Submitted di luar pola Details Incoming.
- Validasi field wajib dan aturan tombol Update mengikuti keputusan field final; audit perilaku Converting sebagai referensi, bukan menyalin validasi secara buta.
FR-O04 — Material / MI
- Material read-only dari mainData.boardQua; provider memaksa nilai master saat Save MI, fallback legacy hanya jika master kosong. Unit dropdown sheet / pcs, default sheet untuk record baru; simpan pilihan tanpa migrasi legacy.
- MI Status existing Draft, Requested, Released, Received, On Hold. Implementasi saat ini dilaporkan menandai Released/Received sebagai materialReady; makna bisnis final harus dikonfirmasi sebelum gate Printing. Save MI tidak meroute ke cabang lain.
- Menerima kebutuhan Material dari Prepress. Data master terhubung dengan project yang sama.
- User melengkapi data Material yang diperlukan dan memperbarui status kesiapan melalui menu Material.
- Submit saat ready mencatat perubahan dan memperbarui kesiapan cabang Material tanpa menimpa status cabang lain.
- Material, grammage, dimensi, request quantity, sheet size dan remark perlu dipetakan terhadap form existing. Rumus Sheet Size dan hubungan FG Qty dengan MI Request Quantity belum disetujui; jangan menghitung otomatis berdasarkan asumsi.
- Jangan mengubah MI Converting.
FR-O05 — Tooling / Plate
- Add Tooling wajib memilih project Offset aktif tanpa Tooling aktif; tidak boleh membuat record manual tanpa Sample Number. Data manual legacy dipertahankan. Save Tooling tidak meroute ke Varnish.
- Tooling / Plate dapat dipilih dari Details Prepress dan detailnya dibuka melalui pencil.
- Modal mengikuti pola Add Tooling Converting dengan field Offset yang relevan, bukan menyalin semua field tanpa audit.
- Data master yang relevan diambil otomatis; detail order tersimpan pada record Tooling terkait project.
- Setelah Update Prepress, record tampil pada menu Tooling untuk monitoring, Details/Edit, dan update status.
- Saat tooling ready, user memperbarui status dan submit; history tercatat pada project yang sama.
- Tidak membangun katalog lintas project, Select Tooling, Edit Tooling Record di header, reuse tooling lintas project, atau field Image berdasarkan PRD lama yang telah dibatalkan.
- Aturan tooling yang sudah tersedia/tidak diperlukan dan field order wajib masih perlu konfirmasi. Jangan menganggap tidak memilih order selalu berarti tooling ready.
FR-O06 — Block / Spot Varnish
- Pada Tahap 5, Update Details Prepress yang berhasil dengan Block / Spot Varnish dipilih harus langsung membuat satu record monitoring pada queue Block / Spot Varnish dengan Sample Number dan MC No. / Code yang sama; tidak menunggu Material atau Tooling. User tinggal memperbarui status melalui menu tersebut.
- Project yang sebelumnya sudah memilih Varnish pada Update berhasil tetapi tertahan karena integrasi bertahap (contoh laporan user 2611009) harus dapat dipulihkan melalui mekanisme rekonsiliasi idempotent berdasarkan bukti pilihan tersimpan dan aksi Update berhasil. Jangan mengirim draft yang belum pernah disubmit oleh user, jangan migrasi massal tanpa persetujuan. Jika bukti tidak cukup, laporkan dan sediakan jalur Update ulang yang aman dari Prepress. Jangan hardcode Sample Number.
  (monitoring kesiapan)
- Menu Varnish memantau laporan kesiapan seluruh kebutuhan Varnish sebelum Printing; bukan pencatatan proses aplikasi Varnish di mesin, bukan pemesanan, dan bukan aktivitas operator Production.
- Incoming Design > Coatings sudah memiliki Varnish (WB Block Varnish, WB Spot Varnish, OPV Block Varnish, OPV Spot Varnish), Lamination (Glossy, Matte), Coating Side (1 side, 2 side). Pertahankan field dan opsi existing. Lamination dan Spot UV bukan otomatis pemicu queue Varnish.
- Varnish Type, Lamination, dan Coating Side berasal dari master project, ditampilkan read-only pada Details Prepress dan monitoring; jangan meminta input ulang. Nilai kosong tetap ditampilkan sebagai -. Spesifikasi bukan bukti kesiapan.
- Record monitoring independen terkait project ID yang sama. Tidak ada icon pencil Varnish, form order, supplier, invoice, price, order date, atau purchase order baru. Jangan membuat katalog Varnish.
- Queue Varnish menerima project hanya setelah Update Details Prepress berhasil dan Varnish dipilih manual sebagai kebutuhan monitoring. Tidak menunggu Material atau Tooling selesai.
- Varnish kosong atau terisi pada master tidak membuat queue secara otomatis. Jenis dan pengecualian kebutuhan Varnish tetap TBD; jangan mengaktifkan routing otomatis.
- Details Varnish menampilkan data master terkait (Sample Number, Customer, Description/Component, MC No./Code, Varnish Type, Lamination, Coating Side, Priority, Deadline sesuai data existing), status kesiapan, remark, dan informasi update. PIC mengikuti aturan existing; field final dan validasi TBD.
- Usulan status monitoring Not Ready / Ready; nama enum, default, dan aturan koreksi/reopen TBD. Tidak ada status Running atau Completed Production baru.
- Update/Submit status yang berhasil mencatat actor, waktu, status dan remark dalam Project History Incoming; tidak mengubah kesiapan cabang lain atau remark master. Kegagalan tidak boleh menampilkan sukses palsu.
- Perubahan spesifikasi setelah submit dan penanganan record legacy harus diputuskan sebelum mengubah kebutuhan cabang secara otomatis.
FR-O07 — Printing dan readiness
- Target bisnis: Printing hanya dilanjutkan ketika seluruh persiapan yang relevan siap, termasuk Material dan kebutuhan tambahan yang berlaku. Setelah kondisi tersebut terpenuhi, project otomatis masuk Printing dengan identitas dan master data yang sama.
- Cabang independen: submit satu cabang tidak otomatis menyelesaikan cabang lain.
- Submitted, Ready, Not Required, Already Available harus dibedakan secara konsep; nama enum dan cara konfirmasi belum final.
- Jika salah satu kebutuhan yang berlaku belum siap, project belum memenuhi kondisi kesiapan Printing.
- Jangan mengaktifkan gate blocking atau perpindahan otomatis sebelum validasi readiness rinci diimplementasikan pada tahap yang disetujui. Audit mekanisme existing dan laporkan perbedaannya.
- Data master, hasil persiapan dan history tetap dapat dilihat setelah masuk Printing. Printing menjadi tempat update progress utama project sebelum QC; detail proses Printing/QC lanjutan di luar keputusan saat ini.
7. Data requirements dan field mapping
Kelompok	Field kandidat / acuan	Sumber dan aturan
Identitas	Project ID, Sample Number, Customer, Product/Component atau Description, MC No./Code, Part Number bila tersedia	Master Incoming; jangan menyamakan MC Number dengan Sample Number
Master	Material, Priority, Deadline, Name of Designer, Dimensions, Colour, Coating, Special Effect	Baca dari project; field aktual diaudit; jangan input ulang tanpa kebutuhan
Prepress	ID Plate, Plate Type, Proof Color, Plot, Ink, Remark	Data khusus tahap; wajib/opsional TBD
Material	Material, Grammage, Sheet Size, Request Quantity, Status, Remark	Master + data MI; sumber/rumus Sheet Size TBD
Tooling	Order By/PIC, Tooling Type, Status, Order Date, Expected Arrival Date, Supplier/Vendor, Invoice Number, Remark	Kandidat berdasarkan screenshot Converting; bukan daftar field wajib Offset
Varnish	Varnish Type, Lamination, Coating Side, PIC, Status, Remark, Last Updated	Type/Lamination/Side dari master read-only; nilai kosong tampil -; status/remark monitoring; PIC dan validasi TBD; tanpa field order
Monitoring	Last Update, Updated By, Actual Arrival Date jika diperlukan	Data tahap; jangan menambah field tanpa validasi kebutuhan


Screenshot Add Tooling Converting memperlihatkan Incoming Design, Sample Number, Customer, Product/Component, Part Number/Code, Material, Priority, Order By/PIC, Tooling Type, Status, Order Date, Expected Arrival Date, Deadline, Supplier/Vendor dan Invoice Number. Field di luar area screenshot tidak diasumsikan. Codex harus menginventarisasi field aktual Offset dan Converting, termasuk required, default, editable/read-only, sumber nilai, tipe, penyimpanan dan tampilan Details. Field Offset final ditetapkan setelah audit.
8. Project History dan tracking (FR-H01 sampai FR-H05)
- FR-H01: Details Incoming Design menjadi pusat tracking seluruh perjalanan project, termasuk aksi dari Prepress, Material, Tooling, Varnish dan Printing. Tidak perlu membuka setiap menu hanya untuk melihat history.
- FR-H02: Semua aksi user yang mengubah data project dan berhasil disimpan harus tercatat, termasuk Create, Edit, Update Next Preparation, Submit persiapan, update status, penyelesaian dan Cancel bila tersedia. Draft yang tidak disimpan tidak dianggap submit. Event otomatis boleh dicatat terpisah dari aksi user.
- FR-H03: Riwayat tidak ditimpa saat update berikutnya; gunakan identitas project yang sama, termasuk saat proses paralel. Urutan berdasarkan waktu aktual aksi, bukan urutan menu tetap.
- FR-H04: Usulan struktur record: timestamp, actor/user ID dan nama, process/menu, action, target record ID bila relevan, previous value, new value, remark. Ketersediaan dan tingkat detail before/after harus diaudit; jangan membuat identitas atau waktu palsu untuk data legacy.
- FR-H05: History tetap tersedia setelah handoff dan penyelesaian/pembatalan sesuai filter existing. Hak akses mengikuti kebijakan existing; audit apakah semua role yang berwenang dapat melihat riwayat. Tidak perlu menduplikasi penyimpanan history di setiap menu.
  Contoh: Create Project -> Automatic Routing to Prepress -> Prepress Update/Submit Material + Tooling + Varnish -> Tooling Ready -> Material Ready -> Varnish Ready -> Printing. Urutan cabang dapat berbeda sesuai kejadian nyata.
9. Status dan integritas data
- Pisahkan lifecycle project, status proses, status submit, readiness, dan remark. Jangan menggunakan satu status global untuk menimpa tiga cabang.
- Pada tabel Material/MI dan Tooling/Plate Offset serta Varnish jika dropdown status tersedia, status utama berasal dari dropdown status aktual menu tersebut. Remark handoff dari tahap sebelumnya tampil sebagai teks kecil di bawah status. Tanpa background berwarna dan tanpa Last Update pada kolom Status; nilai kosong tampil -. Event otomatis bukan remark. Jangan mengubah pilihan status atau membuat status Varnish baru sebelum disetujui. Untuk menu tanpa dropdown status, pertahankan mekanisme existing.
- Standardisasi yang sama berlaku pada tabel Tooling / Plate, Order Rubber dan Material Request/MI Converting, sebagai pengecualian terbatas untuk penyajian kolom Status saja. Jangan mengubah business logic, workflow, validasi, queue atau field Converting. Ringkasan Last Update pada Details tidak dihapus.
- mainData.remark tidak ditimpa oleh remark handoff. Pertahankan kompatibilitas legacy dan audit fallback.
- Satu project ID, satu master data, record persiapan terhubung melalui referensi yang konsisten. Tidak membuat project baru saat berpindah menu.
- Update berulang tidak membuat duplikasi; kegagalan submit tidak boleh menampilkan sukses palsu. Audit transaksi/persistensi dan pemulihan jika sebagian penyimpanan gagal.
- Pertahankan Active/Completed/Cancelled, Search & Filter, pagination, Export dan fitur existing bila ada. Tidak memperluas scope perubahan.
10. Non-functional requirements
- Konsistensi UI: gunakan pola modal, dropdown, tombol, warna dan layout existing; jangan redesign.
- Integritas: data master, order, status dan history konsisten setelah reload sesuai mekanisme storage existing.
- Authorization: audit izin Create/Edit/Submit/Cancel/View History per role; tidak mengasumsikan hak akses baru.
- Auditability: aksi berhasil dapat ditelusuri ke user dan waktu sejauh data tersedia.
- Maintainability: gunakan komponen bersama jika aman, pisahkan aturan route agar Converting tidak berubah.
- Regression: jalankan pemeriksaan lint/test/build yang tersedia hanya jika tidak mengubah source atau data bisnis; laporkan kegagalan dan keterbatasan.
11. Acceptance criteria / skenario audit
ID	Skenario	Hasil target
AC01	Create Offset	Satu project aktif di Incoming dan otomatis tampil di Prepress setelah Submit berhasil; ID dan Sample Number sama
AC02	Submit Add Offset tanpa handoff manual	Project langsung masuk Prepress; Create dan routing otomatis tercatat; tidak perlu Update Details Incoming
AC03	Buka Details Incoming setelah handoff	Master dan riwayat tetap tersedia
AC04	Pilih Material / MI di Prepress	Tombol Add Preparation Order di sebelah Next Preparation menjadi aktif
AC05	Tambah Preparation Order	Klik Add menambah satu dropdown kosong dan X; Add kembali tampil hanya setelah dropdown dipilih, maksimal dua pilihan berbeda
AC06	Pilih Tooling dan Varnish	Maksimal satu Tooling dan satu Varnish; pilihan duplikat disabled, pilihan yang dihapus tersedia kembali
AC07	Pencil Tooling	Modal Tooling, master otomatis, draft terikat project; Tooling memiliki pencil dan X, Varnish hanya X tanpa form order
AC08	Tutup/buka kembali draft	Data yang disimpan sebagai draft tidak hilang dalam sesi sesuai aturan existing
AC09	Hapus pilihan draft	Pilihan tersedia kembali; record submitted tidak terhapus
AC10	Update dengan tiga kebutuhan valid	Tiga record persiapan terkait satu project, tanpa duplikasi, pada tahap integrasi queue yang disetujui
AC11	Update hanya Material ketika kebutuhan lain tidak berlaku	Tidak membuat record Tooling/Varnish; aturan penentuan kebutuhan TBD
AC12	Update berulang	Tidak membuat record aktif ganda
AC13	Tooling ready sebelum Material	Tooling dapat submit tanpa menunggu Material; cabang lain tetap independen
AC14	Material ready sebelum Varnish	Varnish tetap belum ready jika belum diselesaikan
AC15	Semua kebutuhan relevan ready	Project memenuhi kondisi bisnis untuk masuk Printing otomatis dengan Project ID, Sample Number, dan master data yang sama; implementasi trigger menunggu tahap readiness disetujui
AC16	Kebutuhan relevan belum ready	Project belum boleh masuk Printing; detail enforcement TBD
AC17	Update tiap menu	History terlihat di Details Incoming dengan urutan kejadian nyata
AC18	Update remark handoff	Tidak menimpa remark master; tabel/Details konsisten
AC19	Reload / buka kembali	Record dan history konsisten dengan storage existing
AC20	Project lama/selesai/batal	Tetap dapat ditelusuri sesuai kebijakan existing
AC21	Regression Converting	Alur Material/Tooling/Rubber/Sample tidak berubah
AC22	Kegagalan validasi/submit	Tidak ada status sukses palsu atau record duplikat
AC23	User berbeda	Aksi dapat diatribusikan sesuai data autentikasi existing
AC24	Save Incoming dengan Varnish terisi	Spesifikasi tersimpan; tidak membuat queue Varnish
AC25	Update Prepress dengan Varnish dipilih manual	Satu record monitoring Varnish, tanpa form order; routing diaktifkan pada tahap integrasi
AC26	Details Varnish	Varnish Type, Lamination, dan Coating Side read-only dari master; nilai kosong tampil -; status dan remark dapat diperbarui sesuai izin
AC27	Submit kesiapan Varnish	History Incoming mencatat aksi; Material dan Tooling tidak berubah
AC28	Lamination atau Spot UV terisi	Tidak otomatis membuat record Varnish


| AC29 | Incoming Active lintas stage | Project aktif tetap terlihat di Incoming pada seluruh tahap; Completed/Cancelled mengikuti filter existing |
| AC30 | Submit gagal atau berulang | Tidak ada project atau history sukses palsu maupun duplikasi |
| AC31 | Project legacy dan Edit | Tidak ada routing ulang atau migrasi otomatis |
| AC32 | Status tabel menu dengan dropdown | Status aktual dan remark handoff saja; tanpa background dan Last Update; pilihan status existing tetap |
12. Keputusan terbuka (TBD — jangan implementasikan)
1. Field/validasi yang belum ditetapkan untuk Material, Tooling, Varnish dan handoff Prepress; validasi Save Prepress sudah final.
2. Kriteria Prepress selesai dan apakah perlu konfirmasi readiness sebelum mengirim persiapan.
3. Cara mencatat tooling/varnish tidak diperlukan atau sudah tersedia tanpa order baru.
4. Varnish sudah diputuskan sebagai monitoring, bukan order, dan dipilih manual di Details Prepress. TBD: apakah seluruh empat jenis selalu membutuhkan monitoring, pengecualian, PIC, status final, dan perubahan spesifikasi setelah submit.
5. Validasi readiness rinci serta kebijakan blocking/warning sebelum perpindahan otomatis ke Printing.
6. Rumus/sumber Sheet Size dan hubungan FG Qty dengan MI Request Quantity.
7. Semantik status per cabang, pembatalan order submitted, koreksi setelah submit, dan kemungkinan reopen.
8. Tingkat detail history before/after, hak akses, persistensi draft lintas reload, dan mekanisme recovery submit parsial.
13. Audit Codex — deliverables
Audit source code aktual, bukan hanya README atau PRD lama. Catat branch/commit dan perubahan lokal tanpa mengubahnya. Telusuri route, komponen, form config, type/model, provider/store, API/storage, history, validasi, role dan test. Untuk setiap FR dan AC beri status IMPLEMENTED / PARTIAL / MISSING / CONFLICT / NOT VERIFIED / TBD, bukti file:line dan perilaku nyata. Pisahkan implementasi UI dari logic/persistensi. Jangan memberi status implemented hanya karena tombol atau field ada. Buat matriks field aktual Converting vs Offset, diagram workflow aktual, peta event history, daftar gap/risiko, dan usulan tahapan perbaikan. Jangan implementasikan, commit, push, mengubah database atau menjalankan migrasi. Jika test tidak dapat dijalankan, jelaskan alasannya. Jangan mengubah PRD untuk menyamakan dengan kode; laporkan konflik.
14. Rencana pengembangan dan baseline terbaru
- Tahap 0 audit; Tahap 1 fondasi; Tahap 2 Prepress termasuk automatic routing dan koreksi 4.4/4.5; Tahap 3 Material / MI; Tahap 4 Tooling / Plate dan koreksi 6.1: dilaporkan selesai oleh Codex, tidak perlu dibangun ulang.
- Baseline terbaru: 72/72 unit test, 10/10 regression Converting, build PASS, lint 2 error dan 1 warning existing (board-types-provider, use-table-pagination, change-password-modal). Belum diverifikasi independen. Commit/push ditunda oleh user.
- Prompt 6.2: Preparation Check Incoming dan Prepress persistent queue. Prompt 6.3: Details Incoming monitoring dan Latest Remark. Prompt 7 / Tahap 5: integrasi Block / Spot Varnish termasuk rekonsiliasi pilihan lama. Prompt 8 / Tahap 6: Printing readiness setelah aturan final disetujui. Prompt 9 / Tahap 7: History & Tracking. Prompt 10 / Tahap 8: final testing.
- Setiap prompt terpisah; jangan menjalankan seluruh PRD sekaligus. Jangan aktifkan gate Printing atau status Varnish yang masih TBD.
15. Batasan implementasi
- JANGAN SENTUH CONVERTING. Isolasi perubahan shared component/provider khusus Offset; regression wajib. Tidak ada Digital.
- Penamaan UI Offset: Material / MI (bukan Req. Material, Request Material / Create MI atau Offset Material / Create MI), Tooling / Plate, Block / Spot Varnish. Pertahankan enum/identifier internal dan history legacy. Converting tetap memakai nama existing.
- Pertahankan layout existing, data legacy, perubahan lokal, ID, Sample Number, master dan history. Jangan reset/stash/migrasi/commit/push tanpa instruksi. Storage existing React state + localStorage menurut audit awal; jangan mengklaim sinkronisasi antarperangkat.
- Jalankan test, build, lint, regression Converting dan git diff --check; laporkan file, hasil, blocker dan langkah uji browser. Jangan memperbaiki lint di luar scope.
- Gunakan frontend/PRD-OFFSET.md sebagai dokumen tunggal. Audit awal tidak perlu diulang; validasi delta dan laporkan konflik.
16. Acceptance criteria tambahan versi 1.3
ID	Skenario	Hasil target
AC33	Edit Prepress	Mapping master read-only, field manual dan dropdown Plate Type sesuai FR-O03
AC34	Status belum lengkap	Save ditolak oleh UI dan provider
AC35	Waiting tanpa remark	Save ditolak tanpa history palsu
AC36	Save valid dan reload	Data tersimpan, stage tidak berubah, history append-only
AC37	Status tabel Prepress	Empat status aktual grid 2x2 dan remark, tanpa badge/dot/Last Update
AC38	Save MI	Material master tidak dapat diubah; Unit sheet/pcs tersimpan
AC39	Add Tooling	Hanya project aktif yang belum memiliki Tooling aktif
AC40	Preparation Check Offset	Material / MI dan cabang opsional terpilih tampil dengan readiness independen
AC41	Details Incoming Offset	Next Preparation Prepress berupa teks; tanpa Update/Cancel/dropdown; Current Process aktual
AC42	Latest Remark lintas menu	Nama menu dan remark terakhir tidak kosong, urutan aktual, event System diabaikan
AC43	Update Preparation	Project tetap terlihat di Prepress setelah handoff dan lintas stage aktif
AC44	Update ulang dari Prepress	Tidak ada record/history duplikat atau regresi stage
AC45	Pilih Block / Spot Varnish dan Update berhasil	Langsung masuk queue Varnish pada Tahap 5 dengan identitas sama, tanpa menunggu cabang lain
AC46	Pilihan Varnish lama tertahan	Rekonsiliasi aman berdasarkan bukti submit atau Update ulang; draft murni tidak dikirim
AC47	Label Offset	Material / MI, Tooling / Plate, Block / Spot Varnish konsisten; Converting dan identifier internal tidak berubah
AC48	Reload monitoring	Preparation Check, Latest Remark dan visibilitas Prepress tetap konsisten