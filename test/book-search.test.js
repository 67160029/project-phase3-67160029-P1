jest.mock("../src/services/external-api", () => ({
  searchGoogleBooks: jest.fn(),
}));

const request = require("supertest");
const app = require("../src/services/book-search-server");
const { searchGoogleBooks } = require("../src/services/external-api");

const sampleBook = {
  id: 1,
  title: "Clean Code",
  isbn: "9780132350884",
};

beforeEach(() => jest.clearAllMocks());
afterEach(() => jest.restoreAllMocks());

test("Book Search Service rejects an empty query", async () => {
  const response = await request(app).get("/api/external/books");

  expect(response.status).toBe(400);
  expect(searchGoogleBooks).not.toHaveBeenCalled();
});

test("Book Search Service returns Google Books results when available", async () => {
  searchGoogleBooks.mockResolvedValue({
    success: true,
    source: "google_books",
    items: [{ title: "Clean Code" }],
  });

  const response = await request(app)
    .get("/api/external/books?q=clean");

  expect(response.status).toBe(200);
  expect(response.body.source).toBe("google_books");
  expect(searchGoogleBooks).toHaveBeenCalledWith("clean");
});

test("Book Search Service uses Catalog API as fallback", async () => {
  searchGoogleBooks.mockResolvedValue({
    success: false,
    attempts: 3,
    error: "Google Books HTTP 429",
  });

  jest.spyOn(global, "fetch").mockResolvedValue({
    ok: true,
    json: async () => [sampleBook],
  });

  const response = await request(app)
    .get("/api/external/books?q=clean");

  expect(response.status).toBe(200);
  expect(response.body.source).toBe("local_fallback");
  expect(response.body.items).toEqual([sampleBook]);
});

test("Book Search Service returns 502 when fallback also fails", async () => {
  searchGoogleBooks.mockResolvedValue({
    success: false,
    attempts: 3,
    error: "Google Books HTTP 429",
  });

  jest.spyOn(global, "fetch").mockResolvedValue({
    ok: false,
    status: 500,
  });

  const response = await request(app)
    .get("/api/external/books?q=clean");

  expect(response.status).toBe(502);
});