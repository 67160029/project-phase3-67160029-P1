
const http = require("http");

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost:4000");

  if (url.pathname === "/success") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({
      totalItems: 1,
      items: [{
        id: "test-book-1",
        volumeInfo: {
          title: "Test Book",
          authors: ["Test Author"],
          publishedDate: "2024",
          industryIdentifiers: [
            { type: "ISBN_13", identifier: "9780000000001" }
          ]
        }
      }]
    }));
  }

  if (url.pathname === "/fail") {
    res.writeHead(503, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Simulated server error" }));
  }

  if (url.pathname === "/slow") {
    return setTimeout(() => {
      if (!res.destroyed) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ totalItems: 0, items: [] }));
      }
    }, 5000);
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(4000, () => {
  console.log("Mock Google Books running at http://localhost:4000");
});
