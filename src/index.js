const swaggerUi = require("swagger-ui-express");
const YAML = require("yaml");
const fs = require("fs");
const path = require("path");
const express = require("express");
const pool = require("../db");
const { searchGoogleBooks } = require("./services/external-api");

const app = express();
app.use(express.json());
const openapiDocument = YAML.parse(
  fs.readFileSync(path.join(__dirname, "../openapi.yaml"), "utf8")
);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));

// ตรวจสอบว่า ID เป็นจำนวนเต็มบวก
function validId(id) {
  return Number.isInteger(Number(id)) && Number(id) > 0;
}

// 1. GET /api/books — ดูหนังสือทั้งหมด
app.get("/api/books", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT books.id, books.title, books.isbn,
        authors.name AS author,
        categories.name AS category,
        books.published_year,
        books.total_copies,
        books.available_copies
      FROM books
      JOIN authors ON books.author_id = authors.id
      JOIN categories ON books.category_id = categories.id
    `);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database query failed" });
  }
});

// 2. GET /api/books/search?q=clean — ค้นหาหนังสือ
app.get("/api/books/search", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();

    if (!q) {
      return res.status(400).json({
        error: "กรุณาระบุคำค้นหาใน q",
      });
    }

    const keyword = `%${q}%`;
    const [rows] = await pool.query(
      `SELECT books.id, books.title, books.isbn,
        authors.name AS author,
        categories.name AS category,
        books.published_year,
        books.total_copies,
        books.available_copies
       FROM books
       JOIN authors ON books.author_id = authors.id
       JOIN categories ON books.category_id = categories.id
       WHERE books.title LIKE ?
          OR books.isbn LIKE ?
          OR authors.name LIKE ?`,
      [keyword, keyword, keyword]
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database query failed" });
  }
});

// 3. GET /api/books/:id — ดูหนังสือตาม ID
app.get("/api/books/:id", async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ error: "Invalid book ID" });
    }

    const [rows] = await pool.execute(
      `SELECT books.id, books.title, books.isbn,
        authors.name AS author,
        categories.name AS category,
        books.published_year,
        books.total_copies,
        books.available_copies
       FROM books
       JOIN authors ON books.author_id = authors.id
       JOIN categories ON books.category_id = categories.id
       WHERE books.id = ?`,
      [Number(req.params.id)]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Book not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database query failed" });
  }
});

// ตรวจสอบข้อมูลหนังสือสำหรับ POST และ PUT
function validateBook(body) {
  const {
    title, isbn, published_year, total_copies,
    available_copies, author_id, category_id,
  } = body;

  if (
    typeof title !== "string" || !title.trim() ||
    typeof isbn !== "string" || !isbn.trim() ||
    !Number.isInteger(published_year) ||
    !Number.isInteger(total_copies) ||
    !Number.isInteger(available_copies) ||
    !Number.isInteger(author_id) ||
    !Number.isInteger(category_id)
  ) {
    return "กรุณาระบุข้อมูลหนังสือให้ครบและใช้ชนิดข้อมูลที่ถูกต้อง";
  }

  if (
    total_copies < 0 ||
    available_copies < 0 ||
    available_copies > total_copies
  ) {
    return "จำนวนหนังสือไม่ถูกต้อง";
  }

  return null;
}

// 4. POST /api/books — เพิ่มหนังสือ
app.post("/api/books", async (req, res) => {
  const errorMessage = validateBook(req.body);

  if (errorMessage) {
    return res.status(400).json({ error: errorMessage });
  }

  const {
    title, isbn, published_year, total_copies,
    available_copies, author_id, category_id,
  } = req.body;

  try {
    const [result] = await pool.execute(
      `INSERT INTO books
        (title, isbn, published_year, total_copies,
         available_copies, author_id, category_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(), isbn.trim(), published_year,
        total_copies, available_copies, author_id, category_id,
      ]
    );

    res.status(201).json({
      message: "Book created successfully",
      id: result.insertId,
    });
  } catch (error) {
    console.error(error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "ISBN already exists" });
    }

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        error: "Author ID or category ID does not exist",
      });
    }

    res.status(500).json({ error: "Could not create book" });
  }
});

// 5. PUT /api/books/:id — แก้ไขข้อมูลหนังสือ
app.put("/api/books/:id", async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ error: "Invalid book ID" });
  }

  const errorMessage = validateBook(req.body);

  if (errorMessage) {
    return res.status(400).json({ error: errorMessage });
  }

  const {
    title, isbn, published_year, total_copies,
    available_copies, author_id, category_id,
  } = req.body;

  try {
    const [result] = await pool.execute(
      `UPDATE books SET
        title = ?, isbn = ?, published_year = ?,
        total_copies = ?, available_copies = ?,
        author_id = ?, category_id = ?
       WHERE id = ?`,
      [
        title.trim(), isbn.trim(), published_year,
        total_copies, available_copies, author_id,
        category_id, Number(req.params.id),
      ]
    );

    if (result.affectedRows === 0) {
      const [rows] = await pool.execute(
        "SELECT id FROM books WHERE id = ?",
        [Number(req.params.id)]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "Book not found" });
      }
    }

    res.json({ message: "Book updated successfully" });
  } catch (error) {
    console.error(error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "ISBN already exists" });
    }

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        error: "Author ID or category ID does not exist",
      });
    }

    res.status(500).json({ error: "Could not update book" });
  }
});

// 6. DELETE /api/books/:id — ลบหนังสือ
app.delete("/api/books/:id", async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ error: "Invalid book ID" });
  }

  try {
    const [result] = await pool.execute(
      "DELETE FROM books WHERE id = ?",
      [Number(req.params.id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Book not found" });
    }

    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error(error);

    res.status(500).json({ error: "Could not delete book" });
  }
});

// Resource endpoints required by the initial requirements.
app.get("/api/authors", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email FROM authors ORDER BY name"
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not load authors" });
  }
});

app.post("/api/authors", async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : null;
  if (!name) return res.status(400).json({ error: "Author name is required" });

  try {
    const [result] = await pool.execute(
      "INSERT INTO authors (name, email) VALUES (?, ?)",
      [name, email || null]
    );
    res.status(201).json({ id: result.insertId, name, email: email || null });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Author email already exists" });
    }
    console.error(error);
    res.status(500).json({ error: "Could not create author" });
  }
});

app.get("/api/categories", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name FROM categories ORDER BY name"
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not load categories" });
  }
});

app.post("/api/categories", async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (!name) return res.status(400).json({ error: "Category name is required" });

  try {
    const [result] = await pool.execute(
      "INSERT INTO categories (name) VALUES (?)", [name]
    );
    res.status(201).json({ id: result.insertId, name });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Category already exists" });
    }
    console.error(error);
    res.status(500).json({ error: "Could not create category" });
  }
});

app.get("/api/members", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, phone FROM members ORDER BY name"
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not load members" });
  }
});

app.post("/api/members", async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  const phone = typeof req.body?.phone === "string" ? req.body.phone.trim() : null;
  if (!name || !email) {
    return res.status(400).json({ error: "Member name and email are required" });
  }

  try {
    const [result] = await pool.execute(
      "INSERT INTO members (name, email, phone) VALUES (?, ?, ?)",
      [name, email, phone || null]
    );
    res.status(201).json({ id: result.insertId, name, email, phone: phone || null });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Member email already exists" });
    }
    console.error(error);
    res.status(500).json({ error: "Could not create member" });
  }
});

app.get("/api/borrowings", async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT borrowings.id, borrowings.member_id, members.name AS member,
        borrowings.book_id, books.title AS book, borrowings.borrowed_at,
        borrowings.returned_at, borrowings.status
      FROM borrowings
      JOIN members ON members.id = borrowings.member_id
      JOIN books ON books.id = borrowings.book_id
      ORDER BY borrowings.borrowed_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not load borrowing history" });
  }
});

app.post("/api/borrowings", async (req, res) => {
  const memberId = Number(req.body?.member_id);
  const bookId = Number(req.body?.book_id);
  if (!Number.isInteger(memberId) || memberId < 1 ||
      !Number.isInteger(bookId) || bookId < 1) {
    return res.status(400).json({ error: "Valid member_id and book_id are required" });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [members] = await connection.execute(
      "SELECT id FROM members WHERE id = ?", [memberId]
    );
    if (members.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Member not found" });
    }

    const [books] = await connection.execute(
      "SELECT id, available_copies FROM books WHERE id = ? FOR UPDATE", [bookId]
    );
    if (books.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Book not found" });
    }
    if (books[0].available_copies < 1) {
      await connection.rollback();
      return res.status(409).json({ error: "No copies available" });
    }

    const [result] = await connection.execute(
      "INSERT INTO borrowings (member_id, book_id, status) VALUES (?, ?, 'BORROWED')",
      [memberId, bookId]
    );
    await connection.execute(
      "UPDATE books SET available_copies = available_copies - 1 WHERE id = ?",
      [bookId]
    );
    await connection.commit();
    res.status(201).json({
      id: result.insertId, member_id: memberId, book_id: bookId, status: "BORROWED",
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error(error);
    res.status(500).json({ error: "Could not create borrowing" });
  } finally {
    connection?.release();
  }
});

app.put("/api/borrowings/:id/return", async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ error: "Invalid borrowing ID" });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      "SELECT id, book_id, status FROM borrowings WHERE id = ? FOR UPDATE",
      [Number(req.params.id)]
    );
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Borrowing not found" });
    }
    if (rows[0].status === "RETURNED") {
      await connection.rollback();
      return res.status(409).json({ error: "Borrowing was already returned" });
    }

    await connection.execute(
      "UPDATE borrowings SET status = 'RETURNED', returned_at = CURRENT_TIMESTAMP WHERE id = ?",
      [Number(req.params.id)]
    );
    await connection.execute(
      "UPDATE books SET available_copies = available_copies + 1 WHERE id = ?",
      [rows[0].book_id]
    );
    await connection.commit();
    res.json({ id: Number(req.params.id), status: "RETURNED" });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error(error);
    res.status(500).json({ error: "Could not return book" });
  } finally {
    connection?.release();
  }
});

app.get("/api/external/books", async (req, res) => {
  const q = String(req.query.q || "").trim();

  if (!q) {
    return res.status(400).json({
      error: "กรุณาระบุคำค้นหา เช่น ?q=clean",
    });
  }

  try {
    const result = await searchGoogleBooks(q);

    // ถ้า Google Books ทำงานได้ ใช้ข้อมูลจากภายนอก
    if (result.success) {
      return res.json(result);
    }

    // Fallback: ค้นหาจากฐานข้อมูล MySQL ในเครื่อง
    const keyword = `%${q}%`;

    const [rows] = await pool.execute(
      `SELECT books.id, books.title, books.isbn,
        authors.name AS author,
        categories.name AS category,
        books.published_year,
        books.total_copies,
        books.available_copies
       FROM books
       JOIN authors ON books.author_id = authors.id
       JOIN categories ON books.category_id = categories.id
       WHERE books.title LIKE ?
          OR books.isbn LIKE ?
          OR authors.name LIKE ?`,
      [keyword, keyword, keyword]
    );

    return res.json({
      success: true,
      source: "local_fallback",
      warning: "Google Books unavailable; using local database",
      attempts: result.attempts,
      externalError: result.error,
      totalItems: rows.length,
      items: rows,
    });
  } catch (error) {
    console.error("External books endpoint failed:", error);

    return res.status(500).json({
      success: false,
      error: "ไม่สามารถค้นหาหนังสือได้",
    });
  }
});

if (require.main === module) {
  app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
  });
}

module.exports = app;
