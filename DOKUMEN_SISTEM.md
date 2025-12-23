# Dokumentasi Sistem RK Caffee Backend

Dokumen ini berisi rancangan teknis (Architecture Design) untuk sistem backend RK Caffee, yang dibuat berdasarkan analisis struktur kode sumber (Source Code Analysis). Diagram berikut merepresentasikan logika bisnis, struktur database, dan alur kerja sistem saat ini.

---

## 1. Analisis Aktor & Hak Akses

Sistem ini membagi pengguna menjadi 3 peran (Role) dengan hak akses sebagai berikut:

| Aktor       | Deskripsi Peran            | Hak Akses Utama                                                                                       |
| :---------- | :------------------------- | :---------------------------------------------------------------------------------------------------- |
| **OWNER**   | Administrator & Pemilik    | Akses Penuh (Full Access) ke semua fitur, termasuk Manajemen User dan Melihat Laporan Keuangan.       |
| **KASIR**   | Operasional Depan & Gudang | Melayani Transaksi (POS), Mengelola Data Bahan Baku (Inventori), Mengatur Menu, dan Input Stok Masuk. |
| **BARISTA** | Operasional Dapur          | Memonitor pesanan masuk (Kitchen Display) dan memperbarui status pesanan (Dibuat -> Selesai).         |

---

## 2. Use Case Diagram

Diagram interaksi antara Aktor dengan Fitur Sistem.

```mermaid
graph LR
    %% Subgraph Kiri: Aktor
    subgraph Actors [Aktor]
        direction TB
        OWNER[Owner]
        KASIR[Kasir]
        BARISTA[Barista]
    end

    %% Subgraph Kanan: Sistem
    subgraph System [Sistem RK Caffee]
        direction TB

        %% Kelompok Umum
        Login((Login))

        %% Kelompok Owner Only
        Laporan((Lihat Laporan Penjualan))
        KelolaUser((Kelola User))

        %% Kelompok Owner & Kasir
        KelolaMenu((Kelola Menu & Resep))
        KelolaBahan((Kelola Bahan Baku))
        StokMasuk((Input Stok Masuk))

        %% Kelompok Operasional Order
        Order((Input Pesanan / POS))
        UpdateStatus((Update Status Order))
        Monitor((Monitor Dapur))
    end

    %% Relasi
    BARISTA --> Login
    BARISTA --> Monitor
    BARISTA --> UpdateStatus

    KASIR --> Login
    KASIR --> Order
    KASIR --> UpdateStatus
    KASIR --> KelolaMenu
    KASIR --> KelolaBahan
    KASIR --> StokMasuk

    OWNER --> Login
    OWNER --> Laporan
    OWNER --> KelolaUser
    OWNER --> KelolaMenu
    OWNER --> KelolaBahan
    OWNER --> StokMasuk

    linkStyle default stroke-width:2px,fill:none,stroke:gray;
```

---

## 3. Class Diagram (ERD & Struktur Data)

Representasi hubungan antar tabel database (Model Sequelize).

```mermaid
classDiagram
    direction LR

    class User {
        +String id_user (PK)
        +String username
        +String role [OWNER, KASIR, BARISTA]
    }

    class Menu {
        +String id_menu (PK)
        +String nama_menu
        +Double harga
    }

    class BahanBaku {
        +String id_bahan (PK)
        +String nama_bahan
        +Double stok_saat_ini
    }

    class BillOfMaterials {
        +String id_bom (PK)
        +Double jumlah_dibutuhkan
    }

    class Order {
        +String id_order (PK)
        +Date tanggal
        +Double total_bayar
        +String status_pesanan [BARU, SEDANG DIBUAT, SELESAI]
        +String id_user (FK)
    }

    class OrderItem {
        +Integer id_order_item (PK)
        +Integer jumlah
        +Double subtotal
    }

    class RiwayatStok {
        +Integer id_riwayat (PK)
        +Double jumlah_berubah
        +String jenis_transaksi [MASUK, KURANG]
        +Date tanggal
    }

    %% Relationships
    User "1" --> "*" Order : "Melayani"
    User "1" --> "*" RiwayatStok : "Mencatat Log"

    Order "1" *-- "*" OrderItem : "Memiliki Detail"
    Menu "1" --> "*" OrderItem : "Dijual Sebagai Item"

    Menu "1" *-- "*" BillOfMaterials : "Terdiri dari (Resep)"
    BahanBaku "1" --> "*" BillOfMaterials : "Menyusun Resep"

    BahanBaku "1" --> "*" RiwayatStok : "Memiliki Log Histori"
```

---

## 4. Activity Diagram

Diagram alur proses (Workflow) utama dalam sistem.

### A. Alur Transaksi Pemesanan (Selling Process)

Menjelaskan proses otomatisasi pemotongan stok saat pesanan dibuat.

```mermaid
flowchart TD
    subgraph KASIR
        Start([Mulai]) --> PilihMenu[Pilih Menu & Jumlah]
        PilihMenu --> Submit[Klik Buat Pesanan]
    end

    subgraph SISTEM
        Submit --> Transaksi[Mulai Transaksi Database]
        Transaksi --> CreateHead[Buat Order Header (Status: BARU)]

        CreateHead --> LoopItem{Loop Setiap Item}

        LoopItem --> GetBOM[Cek Resep (BOM) & Stok]

        GetBOM -- Stok Kurang --> Rollback[Batalkan Transaksi]
        Rollback --> Error[Tampilkan Error Stok Habis]

        GetBOM -- Stok Cukup --> Potong[Potong Stok & Catat Log]
        Potong --> CreateItem[Simpan Order Item]
        CreateItem --> NextItem{Ada Item Lain?}

        NextItem -- Ya --> LoopItem
        NextItem -- Tidak --> UpdateTotal[Update Total Bayar]

        UpdateTotal --> Commit[Simpan Permanen (Commit)]
        Commit --> Sukses[Return Sukses]
    end

    Error --> End([Gagal])
    Sukses --> End([Selesai])
```

### B. Alur Penyetokan Barang (Restock Process)

Menjelaskan proses penambahan stok manual.

```mermaid
flowchart TD
    Start([Mulai]) --> Login[Login User (Owner/Kasir)]
    Login --> Menu[Pilih Menu Riwayat Stok]
    Menu --> Input[Input: Bahan, Jumlah, Tipe 'MASUK']

    Input --> Validasi{Data Valid?}
    Validasi -- Tidak --> Error[Tampilkan Error] --> Input

    Validasi -- Ya --> Update[Update Stok Bahan (+)]
    Update --> Log[Catat Log Riwayat Stok]
    Log --> Show[Tampilkan Sukses] --> End([Selesai])
```

---

## 5. Sequence Diagram

Diagram detail interaksi objek/modul teknis per skenario.

### A. Sequence: Create Order (Multi-Item)

```mermaid
sequenceDiagram
    actor Kasir
    participant UI as Frontend
    participant Ctrl as OrderController
    participant DB as Database

    Kasir->>UI: Input Items ([{menuId, qty}, ...])
    UI->>Ctrl: POST /api/orders

    activate Ctrl
    Ctrl->>DB: Start Transaction
    Ctrl->>DB: Order.create(Header)

    loop Untuk Setiap Item
        Ctrl->>DB: Menu.findByPk(id)
        Ctrl->>DB: BOM.findAll(menuId)

        opt Jika Ada Resep (BOM)
            loop Cek Bahan
                Ctrl->>DB: Bahan.findByPk(id)
                alt Stok Tidak Cukup
                    Ctrl->>DB: Rollback Transaction
                    Ctrl-->>UI: Error 400 (Stok Habis)
                end
                Ctrl->>DB: Bahan.update(stok - butuh)
                Ctrl->>DB: RiwayatStok.create(log)
            end
        end

        Ctrl->>DB: OrderItem.create(detail)
    end

    Ctrl->>DB: Order.update({ total_bayar })
    Ctrl->>DB: Commit Transaction

    Ctrl-->>UI: 201 Created (Success)
    deactivate Ctrl

    UI-->>Kasir: Tampilkan Sukses & Struk
```

### B. Sequence: Lihat Laporan (Owner)

```mermaid
sequenceDiagram
    actor Owner
    participant UI as Dashboard UI
    participant Ctrl as LaporanController
    participant DB as Database

    Owner->>UI: Filter Tanggal (Start - End)
    UI->>Ctrl: GET /api/laporan/penjualan

    activate Ctrl
    par Parallel Queries
        Ctrl->>DB: Query Total Order & Omzet (SUM)
        Ctrl->>DB: Query Total Item Terjual (SUM)
        Ctrl->>DB: Query Top 3 Menu Terlaris (GROUP BY)
    end

    DB-->>Ctrl: Return Data

    Ctrl-->>UI: JSON { omzet, totalItem, topMenu }
    deactivate Ctrl

    UI-->>Owner: Render Grafik / Tabel Laporan
```
