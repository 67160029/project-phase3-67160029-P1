const express = require("express");
const { searchGoogleBooks } = require("./external-api");

const app = express();
const port = 3101;
const catalogApiUrl =
  process.env.CATALOG_API_URL || "http://localhost:3000";

app.get("/api/external/books", async (req, res) => {
  const q = String(req.query.q || "").trim();

  if (!q) {
    return res.status(400).json({
      error: "กรุณาระบุคำค้นหา เช่น ?q=clean",
    });
  }

  const result = await searchGoogleBooks(q);

  if (result.success) {
    return res.json(result);
  }

  try {
    const fallbackResponse = await fetch(
      `${catalogApiUrl}/api/books/search?q=${encodeURIComponent(q)}`
    );

    if (!fallbackResponse.ok) {
      throw new Error(`Catalog API HTTP ${fallbackResponse.status}`);
    }

    const items = await fallbackResponse.json();

    return res.json({
      success: true,
      source: "local_fallback",
      warning: "Google Books unavailable; using local catalog",
      attempts: result.attempts,
      externalError: result.error,
      totalItems: items.length,
      items,
    });
  } catch (error) {
    return res.status(502).json({
      success: false,
      source: "google_books",
      error: "Google Books และ Catalog Service ใช้งานไม่ได้",
      details: error.message,
    });
  }
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Book Search Service running at http://localhost:${port}`);
  });
}

module.exports = app;