jest.mock("../db", () => ({
  query: jest.fn(),
  execute: jest.fn(),
  getConnection: jest.fn(),
}));

const request = require("supertest");
const pool = require("../db");
const app = require("../src");

beforeEach(() => jest.clearAllMocks());

test.each([
  ["/api/authors", [{ id: 1, name: "Robert C. Martin", email: "robert@example.com" }]],
  ["/api/categories", [{ id: 1, name: "Programming" }]],
  ["/api/members", [{ id: 1, name: "Somchai Jaidee", email: "somchai@example.com" }]],
  ["/api/borrowings", [{ id: 1, status: "BORROWED" }]],
])("GET %s returns database rows", async (path, rows) => {
  pool.query.mockResolvedValue([rows]);
  const response = await request(app).get(path);
  expect(response.status).toBe(200);
  expect(response.body).toEqual(rows);
});

test("POST /api/members validates and creates a member", async () => {
  pool.execute.mockResolvedValue([{ insertId: 4 }]);
  const response = await request(app)
    .post("/api/members")
    .send({ name: "New Member", email: "new@example.com" });
  expect(response.status).toBe(201);
  expect(response.body.id).toBe(4);
});

test("POST /api/authors creates an author", async () => {
  pool.execute.mockResolvedValue([{ insertId: 4 }]);
  const response = await request(app)
    .post("/api/authors")
    .send({ name: "New Author", email: "new.author@example.com" });
  expect(response.status).toBe(201);
  expect(response.body.id).toBe(4);
});

test("POST /api/categories rejects a duplicate category", async () => {
  pool.execute.mockRejectedValue({ code: "ER_DUP_ENTRY" });
  const response = await request(app)
    .post("/api/categories")
    .send({ name: "Programming" });
  expect(response.status).toBe(409);
});

test("POST /api/borrowings creates a borrowing and decrements stock atomically", async () => {
  const connection = {
    beginTransaction: jest.fn(),
    execute: jest.fn()
      .mockResolvedValueOnce([[{ id: 2 }]])
      .mockResolvedValueOnce([[{ id: 1, available_copies: 2 }]])
      .mockResolvedValueOnce([{ insertId: 9 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]),
    commit: jest.fn(),
    rollback: jest.fn(),
    release: jest.fn(),
  };
  pool.getConnection.mockResolvedValue(connection);

  const response = await request(app)
    .post("/api/borrowings")
    .send({ member_id: 2, book_id: 1 });

  expect(response.status).toBe(201);
  expect(response.body).toMatchObject({ id: 9, status: "BORROWED" });
  expect(connection.commit).toHaveBeenCalledTimes(1);
  expect(connection.rollback).not.toHaveBeenCalled();
  expect(connection.release).toHaveBeenCalledTimes(1);
});

test("POST /api/borrowings rejects unavailable books without changing stock", async () => {
  const connection = {
    beginTransaction: jest.fn(),
    execute: jest.fn()
      .mockResolvedValueOnce([[{ id: 2 }]])
      .mockResolvedValueOnce([[{ id: 1, available_copies: 0 }]]),
    commit: jest.fn(),
    rollback: jest.fn(),
    release: jest.fn(),
  };
  pool.getConnection.mockResolvedValue(connection);

  const response = await request(app)
    .post("/api/borrowings")
    .send({ member_id: 2, book_id: 1 });

  expect(response.status).toBe(409);
  expect(connection.rollback).toHaveBeenCalledTimes(1);
  expect(connection.commit).not.toHaveBeenCalled();
});

test("POST /api/borrowings rejects an unknown member", async () => {
  const connection = {
    beginTransaction: jest.fn(),
    execute: jest.fn().mockResolvedValueOnce([[]]),
    commit: jest.fn(),
    rollback: jest.fn(),
    release: jest.fn(),
  };
  pool.getConnection.mockResolvedValue(connection);
  const response = await request(app)
    .post("/api/borrowings")
    .send({ member_id: 999, book_id: 1 });
  expect(response.status).toBe(404);
  expect(connection.rollback).toHaveBeenCalledTimes(1);
  expect(connection.commit).not.toHaveBeenCalled();
});

test("PUT /api/borrowings/:id/return marks returned and restores stock", async () => {
  const connection = {
    beginTransaction: jest.fn(),
    execute: jest.fn()
      .mockResolvedValueOnce([[{ id: 9, book_id: 1, status: "BORROWED" }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]),
    commit: jest.fn(),
    rollback: jest.fn(),
    release: jest.fn(),
  };
  pool.getConnection.mockResolvedValue(connection);

  const response = await request(app).put("/api/borrowings/9/return");

  expect(response.status).toBe(200);
  expect(response.body.status).toBe("RETURNED");
  expect(connection.commit).toHaveBeenCalledTimes(1);
});

test("PUT /api/borrowings/:id/return does not restore stock twice", async () => {
  const connection = {
    beginTransaction: jest.fn(),
    execute: jest.fn().mockResolvedValueOnce([[
      { id: 9, book_id: 1, status: "RETURNED" },
    ]]),
    commit: jest.fn(),
    rollback: jest.fn(),
    release: jest.fn(),
  };
  pool.getConnection.mockResolvedValue(connection);

  const response = await request(app).put("/api/borrowings/9/return");

  expect(response.status).toBe(409);
  expect(connection.rollback).toHaveBeenCalledTimes(1);
  expect(connection.commit).not.toHaveBeenCalled();
  expect(connection.execute).toHaveBeenCalledTimes(1);
});
