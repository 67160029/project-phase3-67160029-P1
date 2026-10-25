# Checklist ตรวจสอบข้อกำหนดโครงงานระยะที่ 1–3

โครงงาน: ระบบจัดการข้อมูลหนังสือ (P1) — รหัสนิสิต 67160029  
Pno: หลักที่ 8 คือ 9; `(9 mod 9) + 1 = 1`  
วันที่ตรวจสอบ: 25 ตุลาคม 2026

## ระยะที่ 1 — Requirement/ฐานข้อมูล (CLO8, 5 คะแนน)

| ข้อกำหนด | สถานะ | หลักฐาน/หมายเหตุ |
|---|---|---|
| เลือกระบบตรงกับ Pno | ✅ | P1 คือระบบข้อมูลหนังสือ ตามการคำนวณหลักที่ 8 |
| Requirement มีวัตถุประสงค์ ผู้ใช้ และ Use Case อย่างน้อย 5 ข้อ | ✅ | `requirement.md` มี 7 Use Case |
| ERD มี PK/FK และความสัมพันธ์ | ✅ | `erd.png`; สอดคล้องกับตารางใน `schema.sql` |
| มีอย่างน้อย 3 ตารางสัมพันธ์กันและ constraint | ✅ | `schema.sql` มี 5 ตาราง, UNIQUE, FOREIGN KEY, CHECK |
| Seed มีอย่างน้อย 3 แถวต่อตาราง | ✅ | `seed.sql` มีข้อมูลตัวอย่าง 3 แถวในแต่ละตาราง |
| Connection Pool และ route query DB จริง | ✅ | `db.js`, `src/index.js`; test อัตโนมัติ mock DB จึงไม่ใช่หลักฐานการเชื่อมต่อ DB เอง |

## ระยะที่ 2 — Docs/DX และ Integration (CLO8, 5 คะแนน)

| ข้อกำหนด | สถานะ | หลักฐาน/หมายเหตุ |
|---|---|---|
| OpenAPI ครอบคลุม endpoint หลักและ status code | ✅ | `openapi.yaml` ครอบคลุม books, authors, categories, members, borrowings และ external search |
| Swagger UI ใช้ OpenAPI | ✅ | `src/index.js` เปิด `/api-docs`; เลือก Gateway `http://localhost:3200` |
| Postman Collection มี request และตัวอย่าง response | ⚠️ | `postman_collection.json` มี 16 requests และ saved example responses; ควรเปิดใน Postman แล้วรันกับ Gateway ก่อนส่งเพื่อยืนยัน response จริง |
| External API มี retry/timeout/fallback | ✅ | `src/services/external-api.js`; fallback ผ่าน Catalog API ใน `src/services/book-search-server.js` |
| มีรายงาน failure scenario | ⚠️ | `failure-scenario-results.md` มีผลทดสอบเดิม; ต้องสาธิต topology ปัจจุบันผ่าน Gateway อีกครั้งก่อนนำเสนอ |

## ระยะที่ 3 — Final Integration/Frontend/Defense

### Final Integration — CLO8 (5 คะแนน)

| ข้อกำหนด | สถานะ | หลักฐาน/หมายเหตุ |
|---|---|---|
| รวม Catalog, Book Search, Gateway และ Frontend | ✅ | `src/index.js`, `src/services/book-search-server.js`, `src/gateway.js`, `frontend/` |
| Gateway ส่งทุก resource ไป Catalog และ external search ไป Book Search | ✅ | `src/gateway.js` |
| OpenAPI ตรงกับ route ที่ Gateway เปิด | ✅ | ตรวจ parse YAML และเทียบ route กับ Express; ยังควรรันทดสอบทุก endpoint ผ่าน Gateway กับ DB จริง |
| Test suite ผ่าน | ✅ | `npm test`: 5 suites, 30 tests ผ่าน |
| Coverage baseline และช่องว่าง | ✅ | `coverage-report.md`: statements 67.57%, branches 60.22%, functions 79.31%, lines 68.29% |
| ไม่มี merge conflict | ⚠️ | `git ls-files -u` ไม่พบไฟล์ conflict; `git status` ยังแสดงไฟล์ untracked/modified หลายรายการ จึงต้องทบทวนก่อน commit/ส่ง |

### Client-Facing Frontend — CLO6 (10 คะแนน)

| ข้อกำหนด | สถานะ | หลักฐาน/หมายเหตุ |
|---|---|---|
| เรียกอย่างน้อย 3 endpoints รวม GET และการเปลี่ยนข้อมูล | ✅ | `frontend/app.js`: GET books, GET search, POST book ผ่าน Gateway |
| มี loading/error/success ให้ผู้ใช้เห็น | ✅ | `frontend/app.js` และ `frontend/style.css` |
| ฟอร์มตรวจข้อมูลก่อนส่ง | ✅ | `frontend/index.html`, `frontend/app.js` |
| สาธิตหน้าเว็บจริง | ⚠️ | โค้ดพร้อม; ต้องเปิดระบบครบ 3 process และทดสอบหน้า `http://localhost:3200` ตอนซ้อม/นำเสนอ |

### Project Defense — CLO7 (5 คะแนน)

| เกณฑ์ | สถานะ | สิ่งที่ต้องทำ |
|---|---|---|
| Demo สด 3–4 นาที | ⬜ | ซ้อมเส้นทางค้นหา → ดูข้อมูล → เพิ่มหนังสือ หรือยืม/คืน |
| อธิบายสถาปัตยกรรมและเหตุผล | ⚠️ | ใช้ `microservices-design.md` อธิบาย Gateway, Catalog, Search และ transaction ยืมคืน |
| ตอบคำถามระบบที่พัฒนาจริง | ⬜ | ซ้อมอธิบาย retry, timeout, fallback, stock transaction และ coverage gap |
| จัดเวลา 5–7 นาที | ⬜ | จับเวลาซ้อม Demo และช่วงถามตอบ |

## สิ่งที่ต้องทำก่อนส่ง/นำเสนอ

1. เปิด Postman Collection แล้วรัน request ผ่าน `http://localhost:3200`; บันทึกหรือปรับ saved examples ให้ตรงกับผลจริง
2. ทดสอบยืมหนังสือและคืนหนังสือกับ MySQL จริง เพื่อตรวจว่า `available_copies` ลด/เพิ่มถูกต้อง
3. ตรวจ Git status จากบัญชี Windows เจ้าของ repo และเตรียม ZIP ด้วยชื่อ `project-phase3-67160029/`
4. ซ้อมหน้าเว็บและ Project Defense ตามเวลาที่กำหนด
