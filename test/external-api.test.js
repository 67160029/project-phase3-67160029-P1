const { searchGoogleBooks } = require("../src/services/external-api");

afterEach(() => jest.restoreAllMocks());

function successResponse() {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      totalItems: 1,
      items: [
        {
          id: "book-1",
          volumeInfo: {
            title: "Clean Code",
            authors: ["Robert C. Martin"],
            publishedDate: "2008",
            industryIdentifiers: [
              { type: "ISBN_13", identifier: "9780132350884" },
            ],
            previewLink: "https://example.com/book",
          },
        },
      ],
    }),
  };
}

test("returns Google Books results on success", async () => {
  const fetchMock = jest
    .spyOn(global, "fetch")
    .mockResolvedValue(successResponse());

  const result = await searchGoogleBooks("clean");

  expect(result.success).toBe(true);
  expect(result.source).toBe("google_books");
  expect(result.attempts).toBe(1);
  expect(result.items[0].title).toBe("Clean Code");
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test("retries a server error and succeeds", async () => {
  const fetchMock = jest
    .spyOn(global, "fetch")
    .mockResolvedValueOnce({ ok: false, status: 503 })
    .mockResolvedValueOnce(successResponse());

  const result = await searchGoogleBooks("clean", 1, 1000);

  expect(result.success).toBe(true);
  expect(result.attempts).toBe(2);
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test("does not retry a client error", async () => {
  const fetchMock = jest
    .spyOn(global, "fetch")
    .mockResolvedValue({ ok: false, status: 400 });

  const result = await searchGoogleBooks("clean", 2, 1000);

  expect(result.success).toBe(false);
  expect(result.attempts).toBe(1);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test("returns a timeout error when the request exceeds its limit", async () => {
  jest.spyOn(global, "fetch").mockImplementation(
    (_url, { signal }) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener(
          "abort",
          () => {
            const error = new Error("Request aborted");
            error.name = "AbortError";
            reject(error);
          },
          { once: true }
        );
      })
  );

  const result = await searchGoogleBooks("slow", 0, 20);

  expect(result.success).toBe(false);
  expect(result.error).toBe("Google Books request timed out");
});