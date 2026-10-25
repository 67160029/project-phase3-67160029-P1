const statusEl = document.querySelector("#status");
const booksEl = document.querySelector("#books");

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || `เกิดข้อผิดพลาด HTTP ${response.status}`);
  }

  return data;
}

function showStatus(message) {
  statusEl.querySelector(".status-message").textContent = message;

  if (message.startsWith("กำลัง")) {
    statusEl.dataset.state = "loading";
  } else if (/ไม่สำเร็จ|ไม่ถูกต้อง|กรุณา|ตรวจสอบ/.test(message)) {
    statusEl.dataset.state = "error";
  } else {
    statusEl.dataset.state = "success";
  }
}

function renderBooks(books) {
  booksEl.replaceChildren();

  if (!books.length) {
    booksEl.textContent = "ไม่พบหนังสือ";
    return;
  }

  for (const book of books) {
    const article = document.createElement("article");
    article.className = "book-card";
    const title = document.createElement("h3");
    title.className = "book-title";
    const details = document.createElement("p");
    details.className = "book-details";

    title.textContent = book.title;
    details.textContent =
      `${book.author} · ${book.category} · ISBN ${book.isbn} · ` +
      `ว่าง ${book.available_copies}/${book.total_copies} เล่ม`;

    article.append(title, details);
    booksEl.append(article);
  }
}

async function loadBooks(url = "/api/books") {
  showStatus("กำลังโหลดหนังสือ...");

  try {
    const books = await api(url);
    renderBooks(books);
    showStatus(`โหลดข้อมูลแล้ว ${books.length} รายการ`);
  } catch (error) {
    showStatus(`โหลดข้อมูลไม่สำเร็จ: ${error.message}`);
  }
}

document.querySelector("#search-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const keyword = document.querySelector("#keyword").value.trim();

  if (!keyword) {
    loadBooks();
    return;
  }

  loadBooks(`/api/books/search?q=${encodeURIComponent(keyword)}`);
});

document.querySelector("#show-all").addEventListener("click", () => loadBooks());

document.querySelector("#book-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  const values = new FormData(form);

  const book = {
    title: values.get("title").trim(),
    isbn: values.get("isbn").trim(),
    published_year: Number(values.get("published_year")),
    total_copies: Number(values.get("total_copies")),
    available_copies: Number(values.get("available_copies")),
    author_id: Number(values.get("author_id")),
    category_id: Number(values.get("category_id")),
  };

  if (!book.title || !book.isbn) {
    showStatus("กรุณากรอกชื่อหนังสือและ ISBN");
    return;
  }

  if (
    book.available_copies > book.total_copies ||
    book.total_copies < 0 ||
    book.author_id < 1 ||
    book.category_id < 1
  ) {
    showStatus("ตรวจสอบจำนวนหนังสือ, Author ID และ Category ID อีกครั้ง");
    return;
  }

  showStatus("กำลังบันทึกหนังสือ...");

  try {
    await api("/api/books", {
      method: "POST",
      body: JSON.stringify(book),
    });

    form.reset();
    showStatus("เพิ่มหนังสือสำเร็จ");
    await loadBooks();
  } catch (error) {
    showStatus(`บันทึกไม่สำเร็จ: ${error.message}`);
  }
});

loadBooks();
