const request = require("supertest");
const app = require("../src/gateway");

afterEach(() => jest.restoreAllMocks());

function mockResponse(body = "[]", status = 200) {
  return {
    status,
    headers: { get: () => "application/json" },
    text: async () => body,
  };
}

test("Gateway forwards book requests to Catalog Service", async () => {
  const fetchMock = jest
    .spyOn(global, "fetch")
    .mockResolvedValue(mockResponse());

  const response = await request(app).get("/api/books");

  expect(response.status).toBe(200);
  expect(fetchMock.mock.calls[0][0].href)
    .toBe("http://localhost:3000/api/books");
});

test("Gateway forwards borrowing requests to Catalog Service", async () => {
  const fetchMock = jest
    .spyOn(global, "fetch")
    .mockResolvedValue(mockResponse());

  const response = await request(app).get("/api/borrowings");

  expect(response.status).toBe(200);
  expect(fetchMock.mock.calls[0][0].href)
    .toBe("http://localhost:3000/api/borrowings");
});

test("Gateway forwards external search to Book Search Service", async () => {
  const fetchMock = jest
    .spyOn(global, "fetch")
    .mockResolvedValue(mockResponse());

  const response = await request(app)
    .get("/api/external/books?q=clean");

  expect(response.status).toBe(200);
  expect(fetchMock.mock.calls[0][0].href)
    .toBe("http://localhost:3101/api/external/books?q=clean");
});

test("Gateway returns 404 for an unknown route", async () => {
  const fetchMock = jest.spyOn(global, "fetch");

  const response = await request(app).get("/unknown");

  expect(response.status).toBe(404);
  expect(fetchMock).not.toHaveBeenCalled();
});

test("Gateway returns 502 when a service is unreachable", async () => {
  jest.spyOn(global, "fetch").mockRejectedValue(new Error("connection refused"));

  const response = await request(app).get("/api/books");

  expect(response.status).toBe(502);
});
