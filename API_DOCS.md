# Dokumentasi API Backend RK Caffee

**Base URL:** `http://localhost:3000/api` (Ganti dengan IP server kamu jika testing di HP/Emulator)

Semua endpoint yang tertulis **Protected** memerlukan header Authorization.
**Header Standard:**

```http
Authorization: Bearer <token_jwt_disini>
Content-Type: application/json
```

---

## 1. Authentication

### Login User

- **URL:** `/api/login`
- **Method:** `POST`
- **Akses:** Public
- **Role:** Semua (Owner, Kasir, Barista)

**Request Body:**

```json
{
  "username": "kasir1",
  "password": "password123"
}
```

**Response Success (200):**

```json
{
  "message": "Login berhasil",
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id_user": "USR-001",
    "username": "kasir1",
    "role": "KASIR"
  }
}
```

---

## 2. Manajemen Menu

### Get All Menu (Daftar Menu)

- **URL:** `/api/menus`
- **Method:** `GET`
- **Akses:** Public (Bisa diakses sebelum login jika mau, tapi biasanya protected)

**Response Success (200):**

```json
{
  "message": "Data menu ditemukan",
  "data": [
    {
      "id_menu": "MNU-001",
      "nama_menu": "Kopi Susu Gula Aren",
      "harga": 18000,
      "kategori": "MINUMAN",
      "status_tersedia": true
    },
    ...
  ]
}
```

### Create Menu (Tambah Menu Baru)

- **URL:** `/api/menus`
- **Method:** `POST`
- **Akses:** Protected (Owner, Kasir)

**Request Body:**

```json
{
  "nama_menu": "Croissant",
  "harga": 25000,
  "kategori": "MAKANAN"
}
```

---

## 3. Transaksi & Order

### Create Order (Checkout)

- **URL:** `/api/orders`
- **Method:** `POST`
- **Akses:** Protected (Kasir, Owner)

**Request Body (RAW JSON):**

```json
{
  "id_user": "USR-001",
  "items": [
    {
      "id_menu": "MNU-001",
      "jumlah": 2
    },
    {
      "id_menu": "MNU-003",
      "jumlah": 1
    }
  ]
}
```

**Response Success (201):**

```json
{
  "success": true,
  "message": "Order berhasil dibuat",
  "data": {
    "id_order": "ORD-0005",
    "total_bayar": 61000
  }
}
```

### Get Kitchen Orders (Layar Dapur)

- **URL:** `/api/kitchen/orders`
- **Method:** `GET`
- **Akses:** Protected (Barista)

**Response Success (200):**

```json
{
  "message": "Daftar order untuk dapur",
  "total": 5,
  "orders": [...]
}
```

### Update Status Order

- **URL:** `/api/orders/:id` (Contoh: `/api/orders/ORD-0005`)
- **Method:** `PUT`
- **Akses:** Protected (Barista, Kasir)

**Request Body:**

```json
{
  "status_pesanan": "SELESAI"
  // Opsi: "BARU", "SEDANG DIBUAT", "SELESAI"
}
```

---

## 4. Laporan (Owner Only)

### Get Laporan Penjualan

- **URL:** `/api/laporan/penjualan`
- **Method:** `GET`
- **Query Params:** `startDate` & `endDate` (Format YYYY-MM-DD)
- **Contoh:** `/api/laporan/penjualan?startDate=2024-01-01&endDate=2024-01-31`
- **Akses:** Protected (Owner Only)

**Response Success (200):**

```json
{
  "periode": { "dari": "2024-01-01", "sampai": "2024-01-31" },
  "total_order": 150,
  "total_omzet": 5000000,
  "total_item": 320,
  "menu_terlaris": [
    { "nama_menu": "Kopi Susu", "total_terjual": 100 },
    { "nama_menu": "Teh Manis", "total_terjual": 50 }
  ]
}
```

---

## 5. Contoh Integrasi di Flutter (Dart)

Gunakan package `http` atau `dio`. Berikut contoh service class sederhana menggunakan `http`.

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  // Ganti IP address sesuai komputer kamu (jangan localhost jika di emulator Android)
  // Android Emulator: 10.0.2.2
  // Real Device: IP Laptop (misal 192.168.1.5)
  static const String baseUrl = "http://10.0.2.2:3000/api";
  String? token;

  // 1. LOGIN
  Future<bool> login(String username, String password) async {
    final url = Uri.parse('$baseUrl/login');
    try {
      final response = await http.post(
        url,
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "username": username,
          "password": password,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        token = data['token']; // Simpan token ini (bisa pakai shared_preferences)
        print("Login Sukses: ${data['user']['role']}");
        return true;
      } else {
        print("Login Gagal: ${response.body}");
        return false;
      }
    } catch (e) {
      print("Error: $e");
      return false;
    }
  }

  // 2. CREATE ORDER (Protected)
  Future<void> createOrder(String userId, List<Map<String, dynamic>> items) async {
    final url = Uri.parse('$baseUrl/orders');
    try {
      final response = await http.post(
        url,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $token", // Wajib Header Token
        },
        body: jsonEncode({
          "id_user": userId,
          "items": items,
        }),
      );

      if (response.statusCode == 201) {
        print("Order Berhasil Dibuat!");
      } else {
        print("Gagal: ${response.body}");
      }
    } catch (e) {
      print("Error: $e");
    }
  }
}
```
