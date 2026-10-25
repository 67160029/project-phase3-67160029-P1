jest.mock("../db", () => ({
  query: jest.fn(),
  execute: jest.fn(),
}));

jest.mock("../src/services/external-api", () => ({
  searchGoogleBooks: jest.fn(),
}));

const request = require("supertest");
const pool = require("../db");
const { searchGoogleBooks } = require("../src/services/external-api");
const app = require("../src");

const sampleBook = {
  id: 1,
  title: "Clean Code",
  isbn: "9780132350884",
  author: "Robert C. Martin",
  category: "Programming",
  published_year: 2008,
  total_copies: 3,
  available_copies: 3,
};

beforeEach(() => {
  jest.clearAllMocks();
});

test("GET /api/books returns the book list", async () => {
  pool.query.mockResolvedValue([[sampleBook]]);

  const response = await request(app).get("/api/books");

  expect(response.status).toBe(200);
  expect(response.body).toEqual([sampleBook]);
});

test("GET /api/books/search searches the catalog", async () => {
  pool.query.mockResolvedValue([[sampleBook]]);

  const response = await request(app).get("/api/books/search?q=clean");

  expect(response.status).toBe(200);
  expect(response.body).toEqual([sampleBook]);
});

test("POST /api/books rejects missing fields", async () => {
  const response = await request(app)
    .post("/api/books")
    .send({ title: "Incomplete book" });

  expect(response.status).toBe(400);
  expect(pool.execute).not.toHaveBeenCalled();
});

test("POST /api/books creates a book", async () => {
  pool.execute.mockResolvedValue([{ insertId: 7 }]);

  const response = await request(app)
    .post("/api/books")
    .send({
      title: "Test Book",
      isbn: "9780000098765",
      published_year: 2024,
      total_copies: 2,
      available_copies: 2,
      author_id: 1,
      category_id: 1,
    });

  expect(response.status).toBe(201);
  expect(response.body.id).toBe(7);
});

test("GET /api/external/books uses local fallback when Google Books fails", async () => {
  searchGoogleBooks.mockResolvedValue({
    success: false,
    attempts: 3,
    error: "Google Books HTTP 429",
  });
  pool.execute.mockResolvedValue([[sampleBook]]);

  const response = await request(app)
    .get("/api/external/books?q=clean");

  expect(response.status).toBe(200);
  expect(response.body.source).toBe("local_fallback");
  expect(response.body.items).toEqual([sampleBook]);
});