# Test Coverage Baseline — Project Phase 3

วันที่รัน: 25 ตุลาคม 2026  
คำสั่ง: `npm run coverage`

## ผลการทดสอบ

- Test suites: 5 ผ่าน, 0 ไม่ผ่าน
- Tests: 30 ผ่าน, 0 ไม่ผ่าน

## Coverage รวม

| รายการ | Coverage |
|---|---:|
| Statements | 67.57% |
| Branches | 60.22% |
| Functions | 79.31% |
| Lines | 68.29% |

## Coverage แยกตามไฟล์

| ไฟล์ | Statements | Branches | Functions | Lines |
|---|---:|---:|---:|---:|
| `src/gateway.js` | 92.30% | 68.75% | 66.66% | 92.30% |
| `src/index.js` | 57.67% | 50.89% | 78.94% | 58.76% |
| `src/services/book-search-server.js` | 91.30% | 91.66% | 50.00% | 91.30% |
| `src/services/external-api.js` | 100.00% | 75.00% | 100.00% | 100.00% |

## จุดที่ยังไม่มี test ครอบคลุม

- `src/index.js`: ยังขาดกรณี error จากฐานข้อมูลและ validation บาง branch รวมถึงสถานะ 404/409 ของ endpoint หลายตัว
- `src/gateway.js` และ `src/services/book-search-server.js`: callback ตอนเปิด listener ยังไม่ถูกครอบคลุม เพราะชุดทดสอบ import Express app โดยไม่เปิดพอร์ตจริง
- `src/services/external-api.js`: statements และ lines ครบ แต่ยังมี branch ที่ไม่ได้ทดสอบ
- ชุดทดสอบใช้ mock สำหรับฐานข้อมูลและการเรียก HTTP; ยังไม่มี automated browser test สำหรับ Frontend

ตัวเลขนี้เป็น baseline ของชุดทดสอบ ณ วันที่ระบุ ไม่ได้กำหนดเกณฑ์ coverage ขั้นต่ำใน rubric
