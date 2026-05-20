const http = require("http");
const fs = require("fs");
const path = require("path");
const shorten = require("./api/shorten");
const redirect = require("./api/redirect");

const publicDir = path.join(__dirname, "public");
const port = Number(process.env.PORT || 8788);

function serveFile(res, filePath) {
  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.statusCode = 404;
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const type = ext === ".html" ? "text/html; charset=utf-8"
      : ext === ".js" ? "application/javascript; charset=utf-8"
      : ext === ".png" ? "image/png"
      : "application/octet-stream";
    res.setHeader("Content-Type", type);
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  req.query = Object.fromEntries(url.searchParams.entries());

  if (url.pathname === "/api/shorten") {
    shorten(req, res);
    return;
  }

  if (url.pathname.startsWith("/s/")) {
    req.query.code = decodeURIComponent(url.pathname.slice(3));
    redirect(req, res);
    return;
  }

  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.resolve(publicDir, `.${pathname}`);
  if (!filePath.startsWith(publicDir)) {
    res.statusCode = 403;
    res.end("Forbidden");
    return;
  }
  serveFile(res, filePath);
});

server.listen(port, () => {
  console.log(`매라매 URL 단축 앱: http://localhost:${port}`);
});
