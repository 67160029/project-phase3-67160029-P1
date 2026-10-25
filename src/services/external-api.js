const GOOGLE_BOOKS_URL =
  process.env.GOOGLE_BOOKS_URL ||
  "https://www.googleapis.com/books/v1/volumes";

async function searchGoogleBooks(query, maxRetries = 2, timeoutMs = 3000) {
  let lastError;

  // maxRetries = 2 หมายถึงลองครั้งแรก + ลองซ้ำอีก 2 ครั้ง
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = new URL(GOOGLE_BOOKS_URL);
      url.searchParams.set("q", query);
      url.searchParams.set("maxResults", "10");

      const response = await fetch(url, {
        signal: controller.signal,
      });

      if (!response.ok) {
        // ลองซ้ำเฉพาะกรณี server error หรือ rate limit
        if (response.status >= 500 || response.status === 429) {
          throw new Error(`Google Books HTTP ${response.status}`);
        }

        // Error อื่น เช่น 400 ไม่ควรลองซ้ำ
        const error = new Error(`Google Books HTTP ${response.status}`);
        error.noRetry = true;
        throw error;
      }

      const data = await response.json();

      return {
        success: true,
        source: "google_books",
        attempts: attempt + 1,
        totalItems: data.totalItems || 0,
        items: (data.items || []).map((item) => ({
          googleBookId: item.id,
          title: item.volumeInfo?.title || "ไม่ระบุชื่อ",
          authors: item.volumeInfo?.authors || [],
          publishedDate: item.volumeInfo?.publishedDate || null,
          isbn: (item.volumeInfo?.industryIdentifiers || [])
            .find((x) => x.type === "ISBN_13")?.identifier || null,
          previewLink: item.volumeInfo?.previewLink || null,
        })),
      };
    } catch (error) {
      lastError = error;

      if (error.noRetry || attempt === maxRetries) {
        break;
      }

      // หน่วงก่อนลองซ้ำ 500 ms แล้วเพิ่มตามจำนวนครั้ง
      await new Promise((resolve) =>
        setTimeout(resolve, 500 * (attempt + 1))
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    success: false,
    source: "google_books",
    attempts: lastError?.noRetry ? 1 : maxRetries + 1,
    error: lastError?.name === "AbortError"
      ? "Google Books request timed out"
      : lastError?.message || "Google Books request failed",
  };
}

module.exports = { searchGoogleBooks };
