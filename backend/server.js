const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { handleApiRequest } = require("./routes/issues");

const projectRoot = path.resolve(__dirname, "..");
const frontendRoot = path.join(projectRoot, "frontend");
const port = Number(process.env.PORT) || 8080;

function sendJson(response, statusCode, value) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(value));
}

async function readJson(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > 65536) {
      const error = new Error("Request body is too large.");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("Request body must be valid JSON.");
    error.statusCode = 400;
    throw error;
  }
}

function sendFile(request, response, pathname) {
  let relativePath;
  try {
    relativePath = decodeURIComponent(
      pathname === "/" ? "/index.html" : pathname,
    );
  } catch {
    sendJson(response, 400, { error: "Invalid URL path." });
    return;
  }

  const filePath = path.resolve(frontendRoot, `.${relativePath}`);
  if (
    filePath !== frontendRoot &&
    !filePath.startsWith(`${frontendRoot}${path.sep}`)
  ) {
    sendJson(response, 403, { error: "Forbidden." });
    return;
  }

  let fileStat;
  try {
    fileStat = fs.statSync(filePath);
  } catch {
    sendJson(response, 404, { error: "Not found." });
    return;
  }

  if (!fileStat.isFile()) {
    sendJson(response, 404, { error: "Not found." });
    return;
  }

  const contentTypes = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
  };
  response.writeHead(200, {
    "Content-Type":
      contentTypes[path.extname(filePath)] || "application/octet-stream",
  });

  if (request.method === "HEAD") {
    response.end();
    return;
  }

  fs.createReadStream(filePath).pipe(response);
}

const server = http.createServer((request, response) => {
  const url = new URL(
    request.url,
    `http://${request.headers.host || "localhost"}`,
  );

  if (url.pathname.startsWith("/api/")) {
    handleApiRequest(request, response, url);
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  sendFile(request, response, url.pathname);
});

server.listen(port, () => {
  console.log(`Cloud Issue Tracker running at http://localhost:${port}`);
});

function closeServer() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", closeServer);
process.on("SIGTERM", closeServer);
