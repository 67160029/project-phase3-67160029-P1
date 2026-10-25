const express = require("express");

const app = express();
const port = 3200;
const path = require("path");

// หลังสร้าง app
app.use(express.static(path.join(__dirname, "../frontend")));
app.use(express.json());

app.use(async (req, res) => {
  let serviceUrl;

  if (req.path.startsWith("/api/external/books")) {
    serviceUrl = "http://localhost:3101";
  } else if ([
    "/api/books",
    "/api/authors",
    "/api/categories",
    "/api/members",
    "/api/borrowings",
  ].some((route) => req.path === route || req.path.startsWith(`${route}/`))) {
    serviceUrl = "http://localhost:3000";
  } else {
    return res.status(404).json({ error: "Gateway route not found" });
  }

  try {
    const url = new URL(req.originalUrl, serviceUrl);
    const hasBody = !["GET", "HEAD"].includes(req.method);

    const response = await fetch(url, {
      method: req.method,
      headers: {
        "Content-Type": req.get("Content-Type") || "application/json",
      },
      body: hasBody ? JSON.stringify(req.body ?? {}) : undefined,
    });

    const responseBody = await response.text();

    res.status(response.status);
    res.type(response.headers.get("content-type") || "text/plain");
    return res.send(responseBody);
  } catch (error) {
    return res.status(502).json({
      error: "Gateway could not reach the target service",
      details: error.message,
    });
  }
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`API Gateway running at http://localhost:${port}`);
  });
}

module.exports = app;
