const issueService = require("../services/issueService");

const MAX_BODY_BYTES = 65536;
const VALID_PRIORITIES = ["Low", "Medium", "High"];
const VALID_STATUSES = ["Open", "Resolved"];

function sendJson(response, statusCode, value, headers = {}) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    ...headers,
  });
  response.end(JSON.stringify(value));
}

function sendError(response, statusCode, code, message) {
  sendJson(response, statusCode, { error: { code, message } });
}

async function readJson(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      const error = new Error("Request body exceeds 65,536 bytes.");
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

function requireJsonContentType(request) {
  const contentType = request.headers["content-type"] || "";
  if (contentType.split(";")[0].trim().toLowerCase() !== "application/json") {
    const error = new Error("Content-Type must be application/json.");
    error.statusCode = 415;
    throw error;
  }
}

function requireObject(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    const error = new Error("Request body must be a JSON object.");
    error.statusCode = 400;
    throw error;
  }
  return body;
}

function validateCreateIssue(body) {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";

  if (title.length < 3 || title.length > 100) {
    return { error: "Title must contain between 3 and 100 characters." };
  }
  if (description.length < 5 || description.length > 500) {
    return { error: "Description must contain between 5 and 500 characters." };
  }
  if (!VALID_PRIORITIES.includes(body.priority)) {
    return { error: "Priority must be Low, Medium, or High." };
  }

  return { value: { title, description, priority: body.priority } };
}

async function handleApiRequest(request, response, url) {
  try {
    if (url.pathname === "/api/issues" && request.method === "GET") {
      sendJson(response, 200, await issueService.readIssues());
      return true;
    }

    if (url.pathname === "/api/issues" && request.method === "POST") {
      requireJsonContentType(request);
      const body = requireObject(await readJson(request));
      const validation = validateCreateIssue(body);
      if (validation.error) {
        sendError(response, 400, "VALIDATION_ERROR", validation.error);
        return true;
      }

      const issue = await issueService.createIssue(validation.value);
      sendJson(response, 201, issue, {
        Location: `/api/issues/${encodeURIComponent(issue.id)}`,
      });
      return true;
    }

    const statusRoute = url.pathname.match(/^\/api\/issues\/([^/]+)\/status$/);
    if (statusRoute && request.method === "PATCH") {
      requireJsonContentType(request);
      const body = requireObject(await readJson(request));
      if (!VALID_STATUSES.includes(body.status)) {
        sendError(
          response,
          400,
          "VALIDATION_ERROR",
          "Status must be Open or Resolved.",
        );
        return true;
      }

      let issueId;
      try {
        issueId = decodeURIComponent(statusRoute[1]);
      } catch {
        sendError(response, 400, "VALIDATION_ERROR", "Issue ID is invalid.");
        return true;
      }

      const issue = await issueService.updateIssueStatus(issueId, body.status);
      if (!issue) {
        sendError(response, 404, "ISSUE_NOT_FOUND", "Issue not found.");
        return true;
      }

      sendJson(response, 200, issue);
      return true;
    }

    if (url.pathname.startsWith("/api/")) {
      sendError(response, 404, "ROUTE_NOT_FOUND", "API route not found.");
      return true;
    }

    return false;
  } catch (error) {
    if (error.statusCode === 413) {
      sendError(response, 413, "REQUEST_TOO_LARGE", error.message);
      return true;
    }
    if (error.statusCode === 415) {
      sendError(response, 415, "UNSUPPORTED_MEDIA_TYPE", error.message);
      return true;
    }
    if (error.statusCode === 400) {
      sendError(response, 400, "VALIDATION_ERROR", error.message);
      return true;
    }

    console.error(error);
    sendError(
      response,
      500,
      "INTERNAL_ERROR",
      "Something went wrong. Please try again later.",
    );
    return true;
  }
}

module.exports = { handleApiRequest };
