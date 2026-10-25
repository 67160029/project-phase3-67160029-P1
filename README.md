# Project Phase 3 — Book Management System (P1)

ระบบจัดการหนังสือ

## ติดตั้ง

```powershell
npm install
```

ตั้งค่า `.env` ตาม `.env.example` และเตรียม MySQL ด้วย `schema.sql` และ `seed.sql` ก่อนเริ่ม API

## เริ่มระบบ

เปิด terminal แยก 3 หน้าต่างในโฟลเดอร์นี้ แล้วรัน:

```powershell
npm run start:catalog
npm run start:search
npm run start:gateway
```

Catalog Service ใช้พอร์ต 3000, Book Search Service ใช้พอร์ต 3101 และ API Gateway/Frontend ใช้พอร์ต 3200

- Frontend: `http://localhost:3200`
- Swagger UI: `http://localhost:3000/api-docs` แล้วเลือก Gateway server `http://localhost:3200`
- Postman Collection: `postman_collection.json` (ส่งคำขอผ่าน Gateway)

## ตรวจสอบ

```powershell
npm test
npm run coverage
```

Borrowing API ใช้ transaction เพื่อบันทึกรายการยืม/คืนและปรับจำนวนหนังสือให้สอดคล้องกัน
