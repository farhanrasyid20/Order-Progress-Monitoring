PRD COTS — v1.6: Penyempurnaan bertahap
27 November 2026 | Repository Order-Progress-Monitoring
0. Ketentuan aktif dan prioritas
Dokumen ini mempertahankan PRD v1.5 secara utuh sebagai baseline historis di bagian bawah. Ketentuan v1.6 berikut menggantikan setiap ketentuan, AC, status sementara, dan roadmap v1.5 yang bertentangan. Baseline bukan instruksi untuk mengulang implementasi. Jalankan hanya satu prompt yang secara eksplisit disetujui user. Tidak ada Digital. Jangan redesign, reset storage, menghapus data/history, atau commit/push tanpa instruksi. Offset dahulu sampai checkpoint GitHub; baru Converting; baru Closing; Export terpisah. Perubahan shared code wajib terisolasi dan regression di luar scope wajib lulus.

Baseline dilaporkan user: 8B lulus 12/12 pemeriksaan manual pada kombinasi semua cabang; Offset telah berjalan sampai QC Checking. Kombinasi lain, source terkini, dan hasil test/build terbaru belum diverifikasi dalam revisi dokumen ini. Pertahankan routing yang sudah bekerja; jangan mengulang 8B.
1. Aturan bisnis aktif
- Status bisnis Tooling/Plate dan Block/Spot Varnish Offset (A4), kemudian Order Tooling dan Order Rubber Converting (B1): Not Ordered (belum dipesan), Ordered (sudah dipesan), Received (sudah sampai), Cancelled (dibatalkan). Default record baru Not Ordered. All dan Completed adalah filter, bukan enum status bisnis. Varnish tetap monitoring, tanpa form pembelian. Received menggantikan Ready Varnish sebagai syarat Continue untuk record baru setelah A4; Tooling Continue menggunakan Received. Material dan empat status Prepress tidak diubah. Material Released/Received tetap baseline sementara.
- Audit mapping enum lama sebelum A4/B1. Jangan membuang nilai/history lama, mengarang completion, atau memaksa mapping Existing, Repair, On Hold, Revision Required dan status ambigu. Ajukan mapping eksplisit untuk persetujuan sebelum perubahan yang memerlukan keputusan. Cancelled pada cabang terpilih tidak memenuhi readiness; kebijakan pembatalan/skip/reopen masih TBD. Jangan menghapus cabang untuk melewati gate.
- Save Draft/Save MI boleh menyimpan data belum lengkap; nilai yang diisi harus valid (tipe, enum, angka, identitas, izin, ownership). Field opsional boleh kosong. Continue memerlukan semua field wajib yang berlaku dan status readiness valid. Audit matriks required per aksi dan menu; jangan menambah field wajib tanpa keputusan. Validasi Waiting/remark Prepress untuk Continue tetap berlaku; kebijakan penyimpanan draft kosong tidak boleh dianggap completion. Laporkan konflik validasi existing sebelum perubahan.
- Sebelum Save & Continue tampilkan konfirmasi mengikuti UI existing: “Are you sure you want to save and continue? Once submitted, this record will be locked and can no longer be edited.” Cancel menutup konfirmasi saja, tidak menyimpan atau mengubah data. Confirm memvalidasi ulang state terbaru dan menyimpan secara atomik. Kegagalan tidak mengunci data atau menampilkan sukses. Double click/retry tidak menduplikasi completion/history/routing.
- Setelah Continue sukses, record menu itu langsung terkunci, meski cabang lain belum selesai. Details/History/Export tetap tersedia. Edit disabled; provider juga menolak update langsung, stale modal, Save Draft, dan perubahan status/remark terhadap record terkunci. Aturan ini menggantikan invalidasi completion melalui edit setelah Continue pada v1.5 bagian 18 dan AC70–73. Tidak ada reopen otomatis; mekanisme koreksi/revision TBD. Prepress completion sebelum Update tetap mengizinkan Update Preparation yang belum dilakukan, tanpa membuka kembali Edit Prepress. Update Preparation dan completion adalah aksi berbeda.
- Data tetap tampil di menu yang pernah dimasuki, dengan ID yang sama, termasuk setelah stage berpindah, project selesai/batal, dan reload. All mencakup seluruh record yang berhak dilihat; Completed per menu berdasarkan bukti completion menu tersebut, bukan status Received atau lifecycle project global. Filter status bisnis tetap dapat menampilkan record yang completed. Jangan membuat record untuk menu yang belum dimasuki. Untuk menu tanpa Save & Continue gunakan aksi penyelesaian existing yang sah (misalnya Complete QC), audit sebelum implementasi. Incoming lifecycle filter tetap existing. Data legacy tanpa bukti completion tidak otomatis dianggap completed; data downstream tidak dipaksa mundur atau mengulang. Hak edit terminal tetap terkunci.
- History append-only, satu project ID, actor/waktu aktual, event System terpisah, tidak menimpa master remark. Pertahankan recovery Varnish dan gate paralel yang sudah bekerja. Save Draft tidak meroute; Continue terakhir memicu gate existing hanya jika seluruh syarat terpenuhi. Jangan meroute saat hydration.
2. Roadmap dan acceptance criteria aktif
Setiap tahap: audit delta, implementasi hanya scope tahap, test/provider/UI, build/lint/regression/diff check, laporkan file dan blocker, user cek browser sebelum lanjut. Jangan memperbaiki lint di luar scope. Angka test lama bukan hasil terbaru.
A — Offset saja
Prompt	Requirement	Acceptance criteria
A1	Details Prepress: Cancel mengikuti Update (historis, digantikan A9)	Setelah Update sukses keduanya disabled; Cancel tidak berubah menjadi Close; footer Close tetap berfungsi; gagal Update tidak mengunci secara palsu.
A2	Hapus Open Size Width/Length Tooling Offset	Tidak tampil di Add/Edit/Details/draft pencil; bukan syarat Continue/fingerprint; nilai legacy tidak dihapus; Converting tidak berubah.
A3	Layout Varnish	Status dipindah ke ruang sebelah Coating Side; field dan layout lain tetap.
A4	Empat status Offset	Dropdown/filter/status readiness konsisten; Received + Continue memenuhi readiness; status lain tidak; mapping legacy disetujui dahulu.
A5	Validasi per aksi	Draft belum lengkap dapat disimpan jika nilai terisi valid; Continue disabled dan provider menolak jika required/readiness belum terpenuhi; matriks required diaudit.
A6	Konfirmasi dan lock	Cancel alert tidak mutasi; Confirm sukses mengunci record segera, termasuk sebelum Printing; reload/stale modal/direct call tidak bypass; gagal simpan tidak lock.
A7	Persistent queue/filter	Prepress, MI, Tooling, Varnish, Printing tetap tampil di All setelah selesai; Completed per menu; Details tersedia, Edit terkunci; tidak duplikat.
A8	Hapus Reset Filter	Hanya Prepress, Material/MI, Block/Spot Varnish, Press/Printing; filter/search lain tetap berfungsi.
A9	Details Incoming Offset dan Details Prepress	Incoming menampilkan Next Preparation Prepress dan remark awal Prepress secara read-only dengan fallback -; Current Process aktual; Update dan Cancel tetap, dengan Cancel sebagai aksi pembatalan project yang independen dari Update. Add Issue/Edit/Close dan Drawing Status tetap. Details Prepress mempertahankan Update dan Close dengan style Incoming, menghapus Cancel, dan tidak submit preparation saat modal ditutup.
A10	Final test Offset	Empat kombinasi plan, setiap cabang terakhir, draft vs Continue, lock, reload, history, legacy, storage failure, Printing hingga QC; regression Converting/Closing.


Checkpoint: user memverifikasi A1–A10 lalu memberi instruksi commit/push Offset Completed. Tidak berarti Export atau Closing sudah selesai.
B — Converting (hanya setelah checkpoint A)
B1 empat status Tooling/Rubber dan mapping legacy; B2 validasi Draft/Continue; B3 confirmation; B4 lock setelah completion; B5 persistent queue dan Completed per menu termasuk Material dan Sample Progress; B6 regression alur Converting dan Offset. Pertahankan Next Preparation, Update dan Cancel Incoming Converting. Jangan redesign atau mengubah routing di luar kebutuhan yang disetujui. Audit gate design approval dan MI existing; laporkan bug terpisah sebelum memperbaiki. Checkpoint GitHub Converting Completed atas instruksi user.
C — Closing (hanya setelah checkpoint B)
C1 QC Checking; C2 FA Report; C3 Ready to Submit; C4 Sample Decision: ganti empat card dengan Search dan Filter Project By (All Projects, Converting, Offset); pertahankan aksi dan layout lain. C5 persistent record, filter completion yang sesuai, penguncian setelah aksi penyelesaian sah; pastikan filter lifecycle tidak hilang tanpa alternatif. C6 uji kedua route hingga keputusan customer dan history. Field QC/FA, aturan Revision Offset, reopen dan hak akses yang belum disetujui tetap TBD; jangan menyalin route Revision Converting ke Offset. Checkpoint GitHub Closing Completed atas instruksi user.
D — Export & Reporting (setelah checkpoint C)
D1 sepakati format laporan, kolom, periode dan arti Open Month/Close Month; D2 implementasi pilot Incoming Design; D3 uji periode dan data selesai/batal; D4 terapkan Open Month/Close Month dan Export pada menu Offset sesuai pilot; D5 audit/penyesuaian Converting; D6 final test. Jangan mengarang format file, definisi tanggal atau perilaku close month. Export harus dapat mengambil record completed yang relevan. Checkpoint GitHub atas instruksi user.
3. Keputusan terbuka
Mapping legacy, Existing, Cancelled, Material Released/Received, daftar field wajib per menu, koreksi/reopen, Revision Offset, Drawing Status, Sheet Size, hak akses, format dan periode export. Ajukan hanya keputusan yang diperlukan tahap aktif; jangan mengimplementasikan TBD berdasarkan asumsi.
DRW-01 dibawa ke revisi PRD berikutnya. Perubahan Drawing Status, Drawing Validation sebelum QC, dan requirement DRW-01 lainnya ditunda dari implementasi A9.
Lampiran — baseline PRD v1.5 (historis, tunduk pada v1.6 di atas)
PRD — COTS: Parallel Preparation Workflow Offset & Project History
Versi: 1.5 — Explicit Preparation Completion & Printing Readiness, 25 November 2026
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
   - Ready: status bisnis yang memenuhi syarat kesiapan, bukan bukti Continue.
   - Continued: konfirmasi penyelesaian eksplisit melalui Save & Continue yang berhasil; terpisah dari Submitted dan Ready.
   - Tooling: die-cutting tooling; berbeda dari plate cetak pada Prepress.
   - History: catatan kronologis aksi yang terkait ID project yang sama.
4. Baseline referensi Converting (FR-C01)
5. Create New Project melalui Incoming Design, kemudian Submit.
6. Buka Details Incoming Design; pilih Request Material / Create MI pada Next Preparation.
7. Add Preparation Order menambah dropdown Order Tooling atau Order Rubber. Maksimal satu pilihan masing-masing; tidak boleh dua Tooling atau dua Rubber.
8. Icon pencil membuka form detail sesuai jenis order. Data master diambil dari project; data order diisi sesuai kebutuhan.
9. Update mengirim data ke menu Material, Tooling dan Rubber yang dipilih. Abu-abu = belum submit; hijau = sudah submit, bukan otomatis ready.
10. Tooling/Rubber: saat ready, update status dan submit pada menu masing-masing. Material: lengkapi data material, update status dan submit saat ready.
11. Setelah seluruh kebutuhan persiapan yang berlaku selesai, project masuk Sample Progress; user memperbarui status Ready to Check QC.
12. Audit perilaku existing termasuk kasus order opsional, validasi, pembatalan draft dan aturan perpindahan. Jangan mengubah Converting untuk menyamakan Offset.
13. Target workflow Offset (FR-O01)
    Incoming Design: Create Project -> Submit
    -> otomatis masuk queue Prepress setelah Submit berhasil (tetap tampil di Incoming Design)
    -> Prepress: update data persiapan
    -> Details Prepress: Next Preparation = Material / MI
    - Preparation Order: Tooling / Plate dan/atau Block / Spot Varnish (dipilih manual jika diperlukan)
      -> isi detail Tooling melalui pencil jika dipilih -> Update
      |-- Material / MI: lengkapi data -> Ready + Save & Continue
      |-- Tooling: monitoring -> Ready + Save & Continue (jika berlaku)
      |-- Varnish: monitoring -> Ready + Save & Continue (jika berlaku)
      -> Prepress dan seluruh kebutuhan terpilih Ready + Continued -> Printing -> QC
      Material, Tooling, dan Varnish dapat berjalan paralel setelah pengiriman dari Prepress. Tidak ada kewajiban menunggu Material selesai untuk mulai Tooling atau Varnish. Prepress tetap dilalui; Create Project tetap di Incoming Design. Printing adalah tahap akhir persiapan dan tempat update progress utama project sebelum QC, bukan tempat membuat project baru. Setelah seluruh persiapan wajib dan terpilih Ready serta Continued, project masuk Printing secara otomatis dengan identitas yang sama melalui gate FR-O08. Update Preparation hanya mengirim cabang; tidak menyelesaikannya.
14. Functional requirements
    FR-O02 — Incoming Design Offset
    - Add/Edit Project mempertahankan form dan field existing. Submit Add Project Offset yang berhasil menghasilkan satu project dengan stage awal Prepress, tampil sekaligus di Incoming Design dan queue Prepress. Edit tidak mengulang routing awal.
    - Details menampilkan data master, current process, status, last update, dan Project History.
    - Hapus kebutuhan memilih Next Preparation Prepress dan Update manual pada Details Incoming khusus Offset baru. Incoming Design tetap menjadi pusat monitoring seluruh project aktif tanpa bergantung pada stage.
    - Submit Add Project mencatat Create dan perpindahan otomatis ke Prepress pada history project yang sama. Event otomatis bukan remark user. Tidak membuat MI, Tooling atau Varnish otomatis pada tahap ini.
    - Details Incoming tetap dapat diakses sepanjang lifecycle. Filter Active menampilkan seluruh project aktif termasuk Prepress, Material, Tooling, Varnish, Printing dan QC; Completed/Cancelled mengikuti filter existing. Jangan membuat salinan project atau memindahkan project legacy otomatis. Pertahankan jalur penanganan legacy yang aman; bila perlu keputusan baru, laporkan blocker.
      FR-O02A — Monitoring Incoming khusus Offset
    - Preparation Check menampilkan Material / MI serta Tooling / Plate dan Block / Spot Varnish apabila dipilih dalam preparation plan. Gunakan data cabang aktual, bukan stage tunggal. Centang hijau hanya jika cabang submitted, Ready dan Continued; abu-abu jika belum siap. Draft tidak dianggap submitted atau ready. Jangan menampilkan kebutuhan opsional yang tidak dipilih sebagai wajib.
    - Details Incoming: Status & Preparation bersifat monitoring; Production / Design dan Next Preparation berupa informasi read-only, Next Preparation menampilkan Prepress sebagai rute awal, bukan current process. Hapus dropdown Next Preparation, tombol Update dan Cancel serta badge status pada action bar khusus Offset. Current Process tetap mengikuti proses aktual. Add Issue, Edit, Close dan Project History dipertahankan.
    - Latest Remark menampilkan nama menu sumber pada baris pertama dan isi remark user terakhir yang tidak kosong pada baris kedua dengan teks abu-abu. Ambil dari aksi berhasil berdasarkan urutan waktu aktual pada project yang sama, termasuk Prepress, Material / MI, Tooling / Plate, Block / Spot Varnish dan Press / Printing. Abaikan event System dan teks otomatis; jangan menimpa master remark. Jika tidak ada remark tampilkan -. Update kosong tidak menghapus remark sebelumnya.
    - Drawing Status: pertahankan data dan akses existing; bila penghapusan Update menyebabkan perubahan tidak dapat disimpan, laporkan dan minta keputusan sebelum mengubah mekanisme penyimpanannya. Read-only merupakan usulan belum final.
    - Nama Current Process agregat (misalnya Offset Preparation) masih TBD; jangan mengubah enum atau routing untuk penamaan.
      FR-O03 — Prepress
    - Prepress menjadi daftar monitoring project Offset lintas stage: project tetap tampil setelah Update Preparation, termasuk selama Material, Tooling, Varnish, Printing dan QC. Gunakan project yang sama, bukan salinan. Jangan mengubah stage aktual hanya agar tampil di Prepress. Details dan data Prepress tetap dapat diakses; edit mengikuti izin/lifecycle existing. Update ulang tidak membuat record atau history ganda. Filter Active/Completed/Cancelled pada Prepress merupakan usulan yang perlu konfirmasi; jangan menghapus data selesai/batal.
    - Edit Prepress memakai modal lebar dua kolom existing. Project Information read-only: Sample Number, MC No. / Code (mainData.mcNo), Customer, Description / Component, Material, FG Qty (SHT), Imposition / Up, Colours dari Printing, Coating / Varnish (mainData.varnish). Gunakan sumber existing; kosong tampil -; jangan mengarang mapping. ID Plate manual setelah cetak plate; Plate Type dropdown GTO54, CD102, SM102, SUMITOMO; FG Qty manual angka terpisah dari FG Qty (SHT).
    - Proof Color, Plot, Plate, Ink wajib dipilih dari Ready / Waiting; project baru belum memiliki pilihan. Remark wajib jika salah satu Waiting, opsional jika semua Ready. Validasi UI dan provider; Save Draft Prepress hanya menyimpan dan append history, tanpa routing; Save & Continue mengikuti FR-O08. Jangan menambah gate semua Ready untuk Update Preparation. Pertahankan legacy tanpa konversi sembarang.
    - Divider dan jarak 22px sebelum Prepress Status. Kolom Status tabel Prepress menampilkan grid 2x2 Proof, Plot, Plate, Ink, diikuti remark Prepress dengan teks kecil; tanpa badge, dot, background atau Last Update. Fallback -. Details menampilkan data yang sama secara read-only.
    - Menerima project dari Incoming dengan ID dan data master yang sama.
    - Data master tersedia pada Details; default read-only di tahap lanjutan.
    - Update Preparation boleh dilakukan sebelum Prepress Ready; penyelesaian Prepress untuk Printing membutuhkan empat status Ready dan Save & Continue.
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
    - MI Status existing Draft, Requested, Released, Received, On Hold. Implementasi saat ini dilaporkan menandai Released/Received sebagai materialReady; makna bisnis final harus dikonfirmasi sebelum gate Printing. Save MI tidak meroute ke cabang lain; Save & Continue mengikuti FR-O08.
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
    - Project yang sebelumnya sudah memilih Varnish pada Update berhasil tetapi tertahan karena integrasi bertahap (contoh laporan user 2611009) harus dapat dipulihkan melalui mekanisme rekonsiliasi idempotent berdasarkan bukti pilihan tersimpan dan aksi Update berhasil. Jangan mengirim draft yang belum pernah disubmit oleh user, jangan migrasi massal tanpa persetujuan. Recovery hydration yang telah berhasil dipertahankan: plan valid dengan Varnish draft, Material submitted pada plan dan record project yang sama, serta history Offset Material preparation submitted yang berkorelasi dengan waktu plan. Catat recovery sebagai event sistem, idempoten. Jika bukti tidak cukup, laporkan tanpa mengirim draft. Tidak ada tombol Submit Varnish tambahan. Jangan hardcode Sample Number.
    - Menu Varnish memantau laporan kesiapan seluruh kebutuhan Varnish sebelum Printing; bukan pencatatan proses aplikasi Varnish di mesin, bukan pemesanan, dan bukan aktivitas operator Production.
    - Incoming Design > Coatings sudah memiliki Varnish (WB Block Varnish, WB Spot Varnish, OPV Block Varnish, OPV Spot Varnish), Lamination (Glossy, Matte), Coating Side (1 side, 2 side). Pertahankan field dan opsi existing. Lamination dan Spot UV bukan otomatis pemicu queue Varnish.
    - Varnish Type, Lamination, dan Coating Side berasal dari master project, ditampilkan read-only pada Details Prepress dan monitoring; jangan meminta input ulang. Nilai kosong tetap ditampilkan sebagai -. Spesifikasi bukan bukti kesiapan.
    - Record monitoring independen terkait project ID yang sama. Tidak ada icon pencil Varnish pada Preparation Order di Prepress; action Edit pada queue Varnish tetap tersedia. Tidak ada form order, supplier, invoice, price, order date, atau purchase order baru. Jangan membuat katalog Varnish.
    - Queue Varnish menerima project hanya setelah Update Details Prepress berhasil dan Varnish dipilih manual sebagai kebutuhan monitoring. Tidak menunggu Material atau Tooling selesai.
    - Varnish kosong atau terisi pada master tidak membuat queue secara otomatis. Jenis dan pengecualian kebutuhan Varnish tetap TBD; jangan mengaktifkan routing otomatis.
    - Prompt 7.2: Edit Block / Spot Varnish menggunakan pola modal existing dua kolom, tanpa redesign. Project Information read-only: Sample Number, MC No. / Code (mainData.mcNo), Customer, Description / Component, PIC dari data existing (bukan user yang sedang login sebagai fallback), Target Completion Date dari deadline project. Varnish Specification read-only: Varnish Type, Lamination, Coating Side dari master. Nilai kosong tampil -; jangan mengarang mapping atau menimpa master. Field read-only mengikuti gaya abu-abu existing.
    - Field editable hanya Varnish Status dan Remark. Status sementara yang disetujui untuk implementasi sebelum konfirmasi pihak Design: Waiting (default), In Progress, Ready, Revision Required. Status wajib valid; Remark wajib tidak kosong setelah trim jika Revision Required, opsional untuk status lain. Validasi UI dan provider. Jangan menambah status produksi atau status Skipped pada queue.
    - Simpan status dan remark khusus branch Varnish, bukan status global, remark master atau handoff cabang lain. Record submitted legacy tanpa status monitoring tampil Waiting dan belum Ready; jangan menganggap remark lama dari cabang lain sebagai remark Varnish. Pertahankan data legacy yang ada; jangan reset status valid.
    - Ganti Complete & Continue lama dengan Save Draft dan Save & Continue. Save Draft hanya memperbarui branch submitted; Continue mengikuti FR-O08. Keduanya tidak mengubah cabang lain. Pada Prompt 7.2 routing Printing tetap nonaktif. Details menampilkan field yang sama seluruhnya read-only, beserta informasi update existing bila tersedia.
    - Status tabel Varnish berupa status aktual dan remark Varnish sendiri sebagai teks kecil abu-abu di bawahnya; tanpa badge, background warna, dot atau Last Update pada kolom Status. Remark kosong tampil -. Ubah deskripsi queue yang menyiratkan ketergantungan pada Plate menjadi deskripsi monitoring paralel, tanpa redesign.
    - Preparation Check Incoming: Varnish hijau hanya jika branch submitted, status Ready dan Continued; status lain atau draft minus abu-abu. Tidak dipilih berarti tidak ditampilkan. Save berhasil mencatat actor, waktu, status dan remark pada Project History Incoming secara append-only. Save gagal tidak mengubah data atau mencatat sukses palsu.
    - Perubahan spesifikasi setelah submit, aturan reopen setelah Printing dan status final hasil konfirmasi Design tetap TBD. Jangan mengaktifkan routing Printing pada Prompt 7.2.
      FR-O07 — Printing dan readiness
    - Printing hanya menerima project melalui FR-O08 setelah tahap gate diaktifkan secara eksplisit. Tidak ada routing linear Material → Tooling → Varnish.
    - Data master, hasil preparation dan history tetap dapat dilihat. Satu project ID dan satu entry Printing per siklus yang sah.
    - Referensi audit Converting: Sample Progress memiliki Production Notes dan Complete & Send to QC. Untuk Offset, padanan Press / Printing dan aksi tersebut merupakan rancangan tahap berikutnya; field Printing, validasi dan integrasi QC belum disetujui untuk implementasi.
    - QC Checking → FA Report → Ready to Submit → Sample Decision merupakan referensi Converting; keputusan Revision Offset, reset preparation dan lifecycle QC masih TBD. Jangan menyalin route Revision ke Design Progress untuk Offset tanpa keputusan.
      FR-O08 — Explicit completion dan readiness gate
    - Aturan normatif v1.5: bagian ini mengatasi konflik dengan aturan Save/Ready versi lama. Tidak ada jalur Save Draft yang menyelesaikan preparation atau meroute Printing.
    - Tombol: Prepress Save Draft + Save & Continue; Material Save MI + Save & Continue; Tooling dan Varnish Save Draft + Save & Continue. Cancel hanya menutup modal tanpa menyimpan. Update Preparation tetap aksi terpisah di Details Prepress.
    - Material wajib; Tooling dan Varnish opsional berdasarkan plan yang telah disubmit. Prepress wajib. Plan yang hilang/invalid tidak boleh dianggap plan tanpa kebutuhan opsional.
    - Continue Prepress boleh sebelum atau sesudah Update Preparation; tidak mengirim branch. Jika dilakukan sebelum Update, simpan konfirmasi Prepress; gate tetap menunggu plan submitted. Update tidak menghapus konfirmasi yang masih valid.
    - Status bisnis sementara untuk pengembangan: Prepress empat Ready; Material Released/Received; Tooling Received/Available / Existing; Varnish Ready. Konfirmasi Design masih diperlukan sebelum penggunaan produksi. Jangan mengubah enum existing secara global.
    - Save Draft menyimpan data valid, status, remark dan history; tidak menetapkan Continued. Continue menyimpan data dan completion secara atomik setelah validasi server/provider dan UI. Status Ready saja, flag materialReady lama, recovery branch, atau history submit induk tidak membuktikan Continued.
    - Detail state, validasi, transisi, legacy dan pengujian mengikuti bagian 18–22.
15. Data requirements dan field mapping
    Kelompok	Field kandidat / acuan	Sumber dan aturan
    Identitas	Project ID, Sample Number, Customer, Product/Component atau Description, MC No./Code, Part Number bila tersedia	Master Incoming; jangan menyamakan MC Number dengan Sample Number
    Master	Material, Priority, Deadline, Name of Designer, Dimensions, Colour, Coating, Special Effect	Baca dari project; field aktual diaudit; jangan input ulang tanpa kebutuhan
    Prepress	ID Plate, Plate Type, Proof Color, Plot, Ink, Remark	Data khusus tahap; wajib/opsional TBD
    Material	Material, Grammage, Sheet Size, Request Quantity, Status, Remark	Master + data MI; sumber/rumus Sheet Size TBD
    Tooling	Order By/PIC, Tooling Type, Status, Order Date, Expected Arrival Date, Supplier/Vendor, Invoice Number, Remark	Kandidat berdasarkan screenshot Converting; bukan daftar field wajib Offset
    Varnish	Varnish Type, Lamination, Coating Side, PIC, Status, Remark, Last Updated	Type/Lamination/Side dan PIC read-only; status/remark editable sesuai FR-O06; tanpa field order
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
   - Pada tabel Material/MI dan Tooling/Plate Offset serta Varnish jika dropdown status tersedia, status utama berasal dari dropdown status aktual menu tersebut. Remark handoff dari tahap sebelumnya tampil sebagai teks kecil di bawah status untuk Material dan Tooling; khusus Varnish gunakan remark Varnish sendiri sesuai FR-O06. Tanpa background berwarna dan tanpa Last Update pada kolom Status; nilai kosong tampil -. Event otomatis bukan remark. Pilihan status Material/Tooling existing dipertahankan; status sementara Varnish mengikuti FR-O06. Untuk menu tanpa dropdown status, pertahankan mekanisme existing.
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
    AC lama dipertahankan; jika ada konflik semantik Ready/Submit/Continue, FR-O08 dan AC58–AC87 berlaku. Tahap implementasi mengikuti bagian 23.
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
AC15	Semua kebutuhan relevan Ready + Continued	Project memenuhi kondisi bisnis untuk masuk Printing otomatis dengan Project ID, Sample Number, dan master data yang sama; implementasi trigger menunggu tahap readiness disetujui
AC16	Kebutuhan relevan belum Ready atau Continued	Project belum boleh masuk Printing
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
AC29	Incoming Active lintas stage	Project aktif tetap terlihat di Incoming pada seluruh tahap; Completed/Cancelled mengikuti filter existing
AC30	Submit gagal atau berulang	Tidak ada project atau history sukses palsu maupun duplikasi
AC31	Project legacy dan Edit	Tidak ada routing ulang atau migrasi otomatis
AC32	Status tabel menu dengan dropdown	Status aktual dan remark handoff saja; tanpa background dan Last Update; pilihan status existing tetap
12. Keputusan terbuka (TBD — jangan implementasikan)
13. Field/validasi yang belum ditetapkan untuk Material, Tooling dan handoff Prepress; validasi Save Prepress sudah final.
14. Field manual Prepress yang wajib untuk Continue selain empat status Ready; jangan menambah kewajiban tanpa keputusan.
15. Cara mencatat tooling/varnish tidak diperlukan atau sudah tersedia tanpa order baru.
16. Varnish sudah diputuskan sebagai monitoring, bukan order, dan dipilih manual di Details Prepress. TBD: apakah seluruh empat jenis selalu membutuhkan monitoring, pengecualian, konfirmasi status final oleh Design, dan perubahan spesifikasi setelah submit. PIC read-only dan status sementara mengikuti FR-O06.
17. Konfirmasi bisnis status Material Released/Received dan status Varnish sementara oleh Design sebelum penggunaan produksi.
18. Rumus/sumber Sheet Size dan hubungan FG Qty dengan MI Request Quantity.
19. Semantik status per cabang, pembatalan order submitted, koreksi setelah submit, dan kemungkinan reopen.
20. Tingkat detail history before/after, hak akses, persistensi draft lintas reload, dan mekanisme recovery submit parsial.
21. Audit Codex — deliverables
    Audit source code aktual, bukan hanya README atau PRD lama. Catat branch/commit dan perubahan lokal tanpa mengubahnya. Telusuri route, komponen, form config, type/model, provider/store, API/storage, history, validasi, role dan test. Untuk setiap FR dan AC beri status IMPLEMENTED / PARTIAL / MISSING / CONFLICT / NOT VERIFIED / TBD, bukti file:line dan perilaku nyata. Pisahkan implementasi UI dari logic/persistensi. Jangan memberi status implemented hanya karena tombol atau field ada. Buat matriks field aktual Converting vs Offset, diagram workflow aktual, peta event history, daftar gap/risiko, dan usulan tahapan perbaikan. Jangan implementasikan, commit, push, mengubah database atau menjalankan migrasi. Jika test tidak dapat dijalankan, jelaskan alasannya. Jangan mengubah PRD untuk menyamakan dengan kode; laporkan konflik.
22. Rencana pengembangan dan baseline terbaru
    - Tahap 0 audit; Tahap 1 fondasi; Tahap 2 Prepress termasuk automatic routing dan koreksi 4.4/4.5; Tahap 3 Material / MI; Tahap 4 Tooling / Plate dan koreksi 6.1: dilaporkan selesai oleh Codex, tidak perlu dibangun ulang.
    - Baseline terakhir yang dilaporkan: 77/77 test, 10/10 regression Converting, build PASS, lint 2 error dan 1 warning existing. Recovery Varnish sesudah baseline tersebut dilaporkan berhasil di browser oleh user; hasil test pasca-recovery belum dilaporkan. Checkpoint Prompt 6.2 sudah dipush; perubahan berikutnya jangan commit/push tanpa instruksi.
    - Prompt 6.2: Preparation Check Incoming dan Prepress persistent queue. Prompt 6.3: Details Incoming monitoring dan Latest Remark. Prompt 7.1: integrasi queue dan recovery Varnish (berhasil di browser menurut user). Prompt 7.2 / Tahap 5: modal Edit/Details, status, remark, readiness indicator dan history Varnish sesuai FR-O06. Prompt 8A: explicit completion Prepress/MI/Tooling dan konsistensi indikator; Prompt 8B: Printing readiness gate setelah persetujuan. Prompt 9 / Tahap 7: History & Tracking. Prompt 10 / Tahap 8: final testing.
    - Setiap prompt terpisah; jangan menjalankan seluruh PRD sekaligus. Gate Printing hanya boleh diaktifkan pada Prompt 8B setelah tahap completion 8A lulus pengujian dan user menyetujui. Prompt 7.2 tidak mengaktifkan routing.
23. Batasan implementasi
    - JANGAN SENTUH CONVERTING. Isolasi perubahan shared component/provider khusus Offset; regression wajib. Tidak ada Digital.
    - Penamaan UI Offset: Material / MI (bukan Req. Material, Request Material / Create MI atau Offset Material / Create MI), Tooling / Plate, Block / Spot Varnish. Pertahankan enum/identifier internal dan history legacy. Converting tetap memakai nama existing.
    - Pertahankan layout existing, data legacy, perubahan lokal, ID, Sample Number, master dan history. Jangan reset/stash/migrasi/commit/push tanpa instruksi. Storage existing React state + localStorage menurut audit awal; jangan mengklaim sinkronisasi antarperangkat.
    - Jalankan test, build, lint, regression Converting dan git diff --check; laporkan file, hasil, blocker dan langkah uji browser. Jangan memperbaiki lint di luar scope.
    - Gunakan frontend/PRD-OFFSET.md sebagai dokumen tunggal. Audit awal tidak perlu diulang; validasi delta dan laporkan konflik.
24. Acceptance criteria tambahan versi 1.3
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
AC46	Pilihan Varnish lama tertahan	Recovery hydration berdasarkan korelasi legacy FR-O06; draft murni tidak dikirim; tanpa tombol tambahan
AC47	Label Offset	Material / MI, Tooling / Plate, Block / Spot Varnish konsisten; Converting dan identifier internal tidak berubah
AC48	Reload monitoring	Preparation Check, Latest Remark dan visibilitas Prepress tetap konsisten
17. Acceptance criteria tambahan versi 1.4
    ID	Skenario	Hasil target
    AC49	Edit Varnish	Field master, PIC dan deadline read-only; hanya status dan remark editable
AC50	Record baru/legacy tanpa status	Waiting, tidak Ready; data lama tetap utuh
AC51	Status invalid atau Revision Required tanpa remark	Save ditolak UI dan provider; tidak ada history sukses
AC52	Save Draft Varnish valid	Status dan remark branch tersimpan setelah refresh, history append-only; stage dan cabang lain tidak berubah
AC53	Details Varnish	Field sama dengan Edit, seluruhnya read-only
AC54	Status tabel Varnish	Status aktual dan remark sendiri, tanpa badge/background/dot/Last Update
AC55	Preparation Check	Hijau hanya submitted + Ready + Continued; status lain minus; tidak dipilih tidak tampil
AC56	Save Draft Ready	Tidak meroute Printing pada tahap mana pun; project tetap di queue
AC57	Regression submission/recovery	Satu Update mengirim semua pilihan; recovery legacy tetap idempoten; tidak ada tombol Submit Varnish
18. Kontrak data dan state machine (normatif)
    Nama properti berikut bersifat konseptual; Codex wajib memetakan tipe existing, tidak membuat sumber kebenaran ganda.
    Dimensi	Nilai / sumber	Aturan
    Lifecycle project	Active, Completed, Cancelled existing	Hanya Active dapat Continue/routing
    Plan	draft atau submitted yang valid	Pilihan opsional dibekukan saat Update berhasil
Branch submission	draft/submitted	Record unik projectId + kind; Prepress memakai data tahap sendiri
Status bisnis	enum per menu	Tidak menimpa status menu lain
Completion	belum Continued / Continued	Persisten, actor, timestamp, referensi revisi data yang dikonfirmasi
Routing	stage existing	Bukan indikator readiness cabang
- Identitas internal projectId, bukan Sample Number atau MC No., menjadi join key. Record milik project lain atau kind salah tidak boleh memenuhi gate.
- Prepress completion disimpan terpisah dari branch Material/Tooling/Varnish. Tidak perlu membuat record order Prepress palsu.
- Completion harus merujuk versi data relevan yang benar-benar dikonfirmasi. Usulan teknis: revision counter/fingerprint dari field readiness dan field wajib; jangan memakai timestamp global project yang berubah akibat cabang lain. Simpan actor dan waktu dari aksi aktual.
- Save Draft pertama dengan status Ready tetap belum Continued. Save Draft setelah Continued: jika field bisnis relevan berubah, batalkan completion cabang tersebut sebelum Printing; jika hanya remark berubah atau payload identik, pertahankan completion yang valid. Ini kebijakan teknis usulan v1.5 untuk mencegah konfirmasi lama digunakan pada data baru; validasi dengan user sebelum implementasi bila tidak sesuai pola existing.
- Status berubah menjadi tidak Ready selalu membatalkan completion sebelum Printing. Kembali Ready via Save Draft tidak memulihkan completion. Continue baru diperlukan.
- Setelah Printing/QC, jangan otomatis mundur atau membatalkan gate karena edit. Sampai aturan reopen disetujui, blokir perubahan field yang memengaruhi readiness/plan pada provider dan UI; Details tetap tersedia, perubahan remark yang diizinkan tidak mengubah stage. Jangan membuka kembali project Completed/Cancelled.
- Plan submitted tidak boleh diubah dengan Update ulang, X, Add Tooling standalone, atau edit master secara diam-diam. Penambahan/penghapusan cabang setelah handoff membutuhkan kebijakan reopen yang belum disetujui. Add Tooling existing tidak boleh menjadi bypass gate; laporkan konflik sebelum mengubah fitur.
- Status bisnis tetap terlihat pada tabel tanpa badge baru; indikator Incoming mengikuti completion efektif. Prepress tetap memakai grid empat status dan remark. Tidak menambah baris Prepress ke Preparation Check tanpa persetujuan.
19. Validasi per aksi dan per menu
    Aksi	Validasi minimum	Efek sukses
Update Preparation	Active Offset, stage awal yang sah, Material dipilih, tidak ada dropdown kosong/duplikat, detail Tooling sesuai validasi existing	Satu plan submitted, semua branch terpilih dibuat dalam satu update; tidak Continue
Save Draft Prepress	Empat pilihan valid; Waiting membutuhkan remark	Simpan data Prepress saja
Continue Prepress	Validasi Save + empat Ready + field wajib existing yang sah	Completion Prepress
Save MI	Field MI existing valid; material master read-only; Unit sheet/pcs	Simpan MI tanpa completion baru
Continue MI	Validasi Save + Released/Received + field wajib existing	Completion Material
Save Draft Tooling	Record project valid; status dan field existing valid	Simpan Tooling tanpa completion baru
Continue Tooling	Validasi Save + Received/Available / Existing + field wajib existing	Completion Tooling
Save Draft Varnish	Submitted branch, status valid, Revision Required membutuhkan remark	Simpan status dan remark Varnish
Continue Varnish	Validasi Save + Ready	Completion Varnish
- Audit daftar field required aktual untuk MI dan Tooling sebelum implementasi; jangan menyalin kewajiban invoice, price, supplier atau received date Converting ke Offset tanpa keputusan. Jangan melonggarkan validasi existing secara diam-diam. Jika required existing membuat Save Draft tidak dapat digunakan secara wajar, laporkan blocker dan usulan matriks field per aksi.
- Validasi dropdown menggunakan enum canonical existing, bukan pencocokan label UI. Unknown/null status tidak Ready. Remark wajib diperiksa setelah trim. Input read-only juga dilindungi pada provider, bukan hanya disabled di UI.
- Tombol Continue disabled bila syarat belum terpenuhi; provider wajib menolak pemanggilan langsung yang invalid. Tampilkan alasan sesuai pola UI existing. Tidak ada toast sukses sebelum commit state berhasil.
- Aksi harus membaca state terbaru, bukan snapshot modal lama; jika data relevan berubah sejak modal dibuka, tolak konflik dan minta reload modal. Jangan menimpa cabang lain dari stale snapshot.
20. Algoritma gate dan truth table
    Gate dijalankan hanya setelah aksi Update Preparation atau Continue yang sukses, menggunakan state hasil transaksi yang sama. Save Draft tidak boleh meroute. Pada tahap 8A, evaluasi boleh diuji tetapi routing nonaktif. Pada 8B, hanya stage preparation Offset yang diizinkan, bukan Incoming awal, Printing, QC atau terminal. Petakan allowlist stage existing secara eksplisit.
    eligible = activeOffset AND allowedPreparationStage AND validSubmittedPlan
    prepressOK = allFourReady AND validPrepressCompletion
    branchOK(kind) = sameProjectSubmittedRecord(kind)
    AND validBusinessStatus(kind)
    AND validRequiredFields(kind)
    AND validCompletionForCurrentData(kind)
readyForPrinting = eligible AND prepressOK AND branchOK(material)
AND (NOT toolingSelected OR branchOK(tooling))
AND (NOT varnishSelected OR branchOK(varnish))

| Plan submitted | Prepress | Material | Tooling | Varnish | Hasil jika seluruh kolom wajib OK |
| --- | --- | --- | --- | --- | --- | --- |
| Material | OK | OK | Skip | Skip | Printing |
| Material + Tooling | OK | OK | OK | Skip | Printing |
| Material + Varnish | OK | OK | Skip | OK | Printing |
| Material + Tooling + Varnish | OK | OK | OK | OK | Printing |
| Plan hilang/draft | OK | OK | — | — | Block |
| Material + Tooling | OK | OK | Ready tanpa Continue | Skip | Block |
| Material + Varnish | OK | OK | Skip | Record hilang/draft | Block |
| Semua | Waiting/Ready tanpa Continue | OK | OK | OK | Block |
- Skip hanya jika tidak dipilih pada plan submitted valid; bukan jika record hilang, status kosong atau gagal submit. Master coating tidak menentukan skip/queue.
- Gunakan satu evaluator shared untuk provider dan indikator UI, dengan alasan blocking per proses. Jangan memakai current stage sebagai pengganti status cabang. Jangan memakai flag ready global sebagai satu-satunya bukti.
- Continue terakhir dapat berasal dari Prepress, Material, Tooling atau Varnish. Urutan penyelesaian bebas. Jika semua completion sudah valid sebelum Update, Update tetap harus membuat branch yang diwajibkan dan memeriksa gate; tidak menganggap branch baru selesai.
- Commit perubahan branch, completion, history user, stage Printing dan history routing dalam satu perubahan state yang konsisten. Jika storage gagal, jangan melaporkan sukses; pertahankan state terakhir yang berhasil atau laporkan kegagalan secara eksplisit. Audit kemampuan persistence existing; jangan mengklaim transaksi database.
- Double click/retry tidak membuat duplicate completion/routing/history; no-op identik tidak menambah history palsu. Continue ulang yang sah setelah perubahan data merupakan aksi baru.
- Printing queue memproyeksikan stage Printing existing, bukan status Ready semata. Tidak membuat project baru. Incoming dan Prepress tetap terlihat selama Active; branch preparation tetap dapat ditelusuri, tidak dihapus. Filter existing dipertahankan; kebijakan filter branch selesai menunggu keputusan jika berbeda dari existing.
21. Legacy, history, dan keamanan perubahan
    - Pertahankan recovery Varnish FR-O06 yang sudah berhasil; recovery hanya memperbaiki submission, bukan completion. Tidak ada tombol Submit Varnish tambahan.
    - Data lama Ready/submitted tanpa bukti Continue eksplisit tetap belum Continued. Jangan backfill completion dari status, materialReady, timestamp plan, atau history parent. User dapat membuka Edit branch dan Continue secara normal sebelum Printing. Jika bukti Continue lama eksplisit tersedia, laporkan pemetaan untuk persetujuan sebelum backfill; jangan mengarang actor/waktu.
    - Project yang sudah Printing/QC/terminal sebelum v1.5 tidak diturunkan stage dan tidak dipaksa mengulang preparation. Tandai sebagai legacy dalam laporan audit, bukan membuat status bisnis baru tanpa persetujuan.
    - Hydration tidak meroute Printing secara otomatis. Recovery Varnish tetap idempoten dan persist setelah refresh. Data invalid/konflik tidak dihapus; laporkan alasan dan jangan membuat branch palsu.
    - History membedakan Save Draft, Continue, Update Preparation, recovery System, dan routing System. Catat project ID, menu, actor, timestamp, status, remark dan completion sesuai schema existing; jangan menimpa master remark. Latest Remark mengabaikan event System dan remark kosong.
    - Jangan reset localStorage, mengganti storage key, menghapus history, atau mengubah source Converting/Digital. Uji fixture pada storage terisolasi, bukan data perusahaan. Tidak commit/push tanpa instruksi.
22. Acceptance criteria tambahan v1.5 dan bukti pengujian
    ID	Skenario	Hasil wajib
    AC58	Ready + Save Draft pada tiap menu	Status tersimpan; belum Continued; tidak routing
AC59	Continue saat belum Ready	UI disabled dan provider menolak; tidak ada mutasi/history sukses
AC60	Continue valid pada tiap menu	Completion persist, actor/waktu benar, cabang lain utuh
AC61	Empat kombinasi plan	Truth table bagian 20 terpenuhi
AC62	Prepress selesai terakhir	Masuk Printing hanya setelah Continue Prepress
AC63	MI selesai terakhir	Masuk Printing sekali
AC64	Tooling selesai terakhir	Masuk Printing sekali
AC65	Varnish selesai terakhir	Masuk Printing sekali
AC66	Prepress Continue sebelum Update	Completion valid tersimpan; tidak masuk Printing tanpa plan
AC67	Update ketika Prepress Waiting	Cabang tetap masuk queue paralel; gate block
AC68	Selected branch record hilang/draft	Gate block; bukan Skip
AC69	Plan hilang/ID mismatch/unknown status	Gate block
AC70	Save Draft Ready setelah completion invalidated	Tidak otomatis Continued kembali
AC71	Ubah status/field relevan sebelum Printing	Completion lama dibatalkan; Continue ulang diperlukan
AC72	Remark saja atau no-op	Completion valid tetap; no-op tidak membuat history palsu
AC73	Edit setelah Printing/QC	Tidak rollback; perubahan readiness diblokir sampai aturan reopen
AC74	Completed/Cancelled	Tidak dapat Continue atau routing
AC75	Double click/retry	Satu routing dan history routing
AC76	Stale modal dua cabang	Tidak menimpa data cabang lain; konflik data relevan ditolak
AC77	Refresh setelah Continue parsial	Completion dan queue tetap konsisten; tidak routing saat hydration
AC78	Legacy Ready tanpa Continue	Tidak auto-complete atau auto-route
AC79	Legacy Varnish recovery	Submitted saja; belum Continued; tidak duplicate
AC80	Draft murni Varnish	Tidak masuk queue
AC81	Master coating terisi tanpa pilihan	Tidak membuat Varnish
AC82	Storage gagal	Tidak sukses palsu atau kehilangan state terakhir
AC83	Incoming Preparation Check	Hijau hanya submitted + Ready + Continued; opsional tidak dipilih tersembunyi
AC84	Printing queue	Identitas sama, satu entry, Incoming/Prepress tetap tampil
AC85	Gate belum diaktifkan pada 7.2/8A	Tidak ada routing Printing meskipun seluruh completion valid
AC86	Regression Converting/Digital	Tidak ada perubahan perilaku atau source di luar isolasi Offset
AC87	Browser end-to-end	Klik UI aktual, cek queue dan reload; bukti bukan hanya helper test
23. Tahapan implementasi dan definition of done
24. Audit delta v1.5: inventaris handler, field required per aksi, state, enum, queue dan history aktual; laporkan konflik tanpa mengubah kode. Jangan mengulang audit seluruh aplikasi.
25. Prompt 7.2: modal/status Varnish dan dua tombol; completion Varnish persist; routing nonaktif. Pertahankan recovery dan queue.
26. Prompt 8A: completion Prepress, MI, Tooling, evaluator shared dan indikator Incoming; gate routing masih nonaktif. Uji integrasi seluruh kombinasi.
27. Prompt 8B: aktifkan routing Printing hanya setelah user menyetujui hasil 8A dan status kesiapan sementara. Uji setiap branch terakhir, duplicate, reload dan legacy.
28. Prompt 6.3: Details Incoming dan Latest Remark (dapat dilakukan terpisah); kemudian Printing modal/QC setelah requirement disetujui; history dan final regression.
    Setiap tahap: laporkan file/fungsi yang berubah, pemetaan AC, hasil test aktual, build, lint, regression Converting, git diff --check, serta langkah uji browser. Baseline harus diukur ulang; angka lama bukan hasil terbaru. Uji provider aktual, handler modal, queue projection dan persistence; fixture helper atau markup saja tidak cukup. Jika browser user tidak dapat diakses, gunakan browser test terisolasi bila tersedia dan nyatakan keterbatasan. User memverifikasi browser aktual sebelum tahap berikutnya. Jangan mengklaim PASS end-to-end jika hanya unit test. Tidak ada commit/push otomatis.
29. Keputusan yang masih perlu konfirmasi Design / user
    - Status Material Released vs Received, empat status Varnish sementara, field wajib Continue MI/Tooling/Prepress yang belum diputuskan.
    - Kebijakan invalidasi completion saat edit data relevan, penguncian setelah Printing, dan Add Tooling setelah handoff merupakan usulan pengamanan v1.5; konfirmasi sebelum mengubah perilaku existing yang bertentangan.
    - Field Press / Printing, QC, FA Report, Sample Decision dan siklus Revision Offset; jangan implementasikan berdasarkan asumsi.
    - Tidak ada keputusan baru mengenai role, Drawing Status, formula Sheet Size, atau filter Prepress terminal.
