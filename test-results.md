# API Test Results

**Project:** Book Management System — Phase 2

## 1. API Endpoint Testing

| Test Case | Expected Result | Actual Result | Status |
|---|---|---|---|
| GET /api/books | HTTP 200 และแสดงรายการหนังสือทั้งหมด | HTTP 200 OK — ระบบแสดงรายการหนังสือ 3 รายการจากฐานข้อมูล MySQL | Passed |
| GET /api/books/1 | HTTP 200 และแสดงรายละเอียดหนังสือ | HTTP 200 OK — ระบบแสดงรายละเอียดหนังสือ ID 1 ชื่อ Clean Code | Passed |
| GET /api/books/search?q=clean | HTTP 200 และแสดงผลการค้นหา | HTTP 200 OK — ระบบค้นหาและแสดงหนังสือ Clean Code ได้สำเร็จ | Passed |
| POST /api/books | HTTP 201 เมื่อเพิ่มหนังสือสำเร็จ | HTTP 201 Created — ระบบเพิ่มหนังสือใหม่และส่ง ID ของหนังสือที่สร้างกลับมา | Passed |
| PUT /api/books/1 | HTTP 200 เมื่อแก้ไขสำเร็จ | HTTP 200 OK — ระบบแก้ไขข้อมูลหนังสือตาม ID ที่ระบุได้สำเร็จ | Passed |
| DELETE /api/books/{id} | HTTP 200 เมื่อลบหนังสือสำเร็จ | HTTP 200 OK — ระบบลบหนังสือที่ระบุได้สำเร็จ | Passed |
| GET /api/external/books?q=clean%20code | HTTP 200 และแสดงผลการค้นหาจาก Google Books หรือฐานข้อมูลสำรอง | HTTP 200 OK — ระบบค้นหาหนังสือและส่งผลลัพธ์กลับมาได้สำเร็จ | Passed |

## 2. External API Failure Scenario Testing

| Scenario | Expected Result | Actual Result | Status |
|---|---|---|---|
| Normal Response | Google Books ตอบกลับสำเร็จ | API จำลองส่ง HTTP 200 พร้อมข้อมูลหนังสือ Test Book และระบบคืนค่า `source: google_books` | Passed |
| Retry | ระบบลองเชื่อมต่อใหม่เมื่อเกิด HTTP 503 | API จำลองส่ง HTTP 503 และระบบลองเชื่อมต่อทั้งหมด 3 ครั้ง ก่อนเข้าสู่ Fallback | Passed |
| Timeout | ระบบยกเลิกคำขอที่ใช้เวลาเกิน 3 วินาที | API จำลองหน่วงเวลา 5 วินาที ระบบเกิด Timeout และลองเชื่อมต่อใหม่ตามจำนวนครั้งที่กำหนด | Passed |
| Fallback | ระบบใช้ MySQL เมื่อ API ภายนอกล้มเหลว | ระบบค้นหาข้อมูลจาก MySQL และคืนค่า `source: local_fallback` หลังการเชื่อมต่อล้มเหลว | Passed |

## 3. Summary

The Book Management API was tested successfully. The system supports listing, retrieving, searching, creating, updating, and deleting books. Swagger UI provides API documentation, and the Google Books integration supports retry, timeout, and fallback mechanisms.

A local mock API was used to simulate successful responses, HTTP 503 errors, and delayed responses. When external requests failed, the system used the local MySQL database as a fallback.

## 4. Conclusion

The test results demonstrate that the implemented API endpoints and external API error-handling mechanisms behaved as expected during testing. The system can retrieve book information from an external service and fall back to the local database when the external service is unavailable.
## Latest automated verification — Phase 3

- `npm test`: 5 suites passed, 30 tests passed.
- `npm run coverage`: statements 67.57%, branches 60.22%, functions 79.31%, lines 68.29%.
- Added automated tests for author/category/member resources, borrowing and return transactions, stock conflicts, and Gateway routing.
- Jest tests mock database/HTTP dependencies. Run the documented live smoke flow against MySQL and Gateway before treating it as an end-to-end database test.
