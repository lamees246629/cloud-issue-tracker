# Lab 3 — Cloud Issue Tracker Architecture

## 1. Application Goal

The Cloud Issue Tracker lets users create issues, view the shared issue list, and change an issue's status. The browser provides the interface; a Node.js API validates requests and stores records in a JSON file so they survive page refreshes and are shared by clients using the same server.

The Node.js server serves the frontend and API on the same origin. It listens on port `8080` by default, and stores data in `backend/data/issues.json`.

## 2. Functional Scope

The application supports three operations:

- **Create an issue:** Save a title, description, and priority. The server assigns an ID, creation time, and initial `Open` status.
- **View all issues:** Retrieve and display the stored issues in insertion order.
- **Change issue status:** Set an existing issue to `Open` or `Resolved`.

The browser does not act as the source of truth. It requests the current list from the API after creating an issue or changing a status.

## 3. Request Flow

### Create an issue

```text
User
  -> Frontend form (title, description, priority)
  -> POST /api/issues with JSON
  -> API validates the body
   -> JSON data service stores the issue with a generated ID and Open status
  <- 201 Created with the new issue as JSON
  -> Frontend requests GET /api/issues and renders the updated list
```

The API trims and requires a title of 3–100 characters and a description of
5–500 characters, and accepts only `Low`, `Medium`, or `High` priority. On
success it returns `201` and the created issue. Invalid JSON or fields return
`400` with a JSON error message.

### View all issues

```text
Page loads
  -> GET /api/issues
   -> API reads all issues from the JSON data service
  <- 200 OK with a JSON array (empty if there are no records)
  -> Frontend renders one card per issue, or "No issues yet"
```

The frontend makes this request when the page loads. The API asks the data layer
for every stored issue and returns the array with `200 OK`. The client renders
issue cards or the "No issues yet" message for an empty array. The default JSON
file contains the two Lab 2 sample records; a missing or empty data file returns
an empty array.

### Change an issue status

```text
User selects a status button
  -> PATCH /api/issues/{id}/status with JSON
  -> API validates the issue ID and requested status
   -> Data layer updates only that issue's status in the JSON file
  <- 200 OK with the full updated issue as JSON
  -> Frontend refreshes and re-renders the issue list
```

For example, the current client sends `{"status":"Resolved"}` to mark an open
issue resolved, or `{"status":"Open"}` to reopen it. The manual's
`in_progress` value is illustrative; this implementation currently allows only
`Open` and `Resolved`. An invalid status returns `400`; an unknown issue ID
returns `404`. The API returns the updated issue, after which the client fetches
the list again and re-renders it.

## 4. Trust Boundaries

```text
USER-CONTROLLED SIDE                     APPLICATION-CONTROLLED SIDE

Browser input  ---- HTTP request ---->  REST API  ---->  JSON data service
      ^                                      |
      +------------- JSON response <---------+
```

The user-controlled side includes the browser, form fields, buttons, and every
request sent from the browser. Users can alter requests with developer tools or
other HTTP clients, so all incoming values are untrusted until the API validates
them. The application-controlled side is the REST API and data layer; the
browser never accesses the JSON file directly.

The boundary follows these rules:

1. The API validates every request. Frontend checks are for convenience, not
   security.
2. The browser never talks to the data layer directly; the API is the only path
   to stored issue data.
3. Responses contain the issue data the frontend needs. Unexpected failures are
   logged on the server, while clients receive a generic error without a stack
   trace.
4. The frontend renders issue titles and descriptions as plain text using
   `textContent`, never as HTML.

The API accepts JSON objects, trims and validates title and description lengths,
checks the priority and status enums, and ignores client-supplied server-owned
fields.

The server limits each JSON request body to 65,536 bytes and returns `413` when
that limit is exceeded. It enforces the title and description character limits
on the API boundary. Unexpected server or database errors return `500`.

The JSON file provides persistent storage on the server host and is excluded
from Git. The API currently has no authentication or authorization, so anyone
who can reach the server can create issues and change statuses. This is a
single-host lab architecture, not yet a production multi-instance cloud
deployment.

## 5. Understanding the HTTP Exchange

Creating an issue is an HTTP exchange between the browser and the API. The
browser sends a request; it does not call a function inside the server directly.

```http
POST /api/issues HTTP/1.1
Content-Type: application/json
Accept: application/json

{
  "title": "Projector not working in Lab 3",
  "description": "Laptop cannot detect the classroom projector.",
  "priority": "High"
}
```

The five important parts are:

1. **HTTP method:** `POST` asks the API to create a new issue.
2. **Path or endpoint:** `/api/issues` identifies the collection that will
   receive the new issue.
3. **Headers:** `Content-Type: application/json` says the request body is JSON.
   `Accept: application/json` says the client wants a JSON response.
4. **Body:** The JSON carries the user-provided title, description, and
   priority. The API validates these values, then assigns the issue ID, initial
   status, and creation time.
5. **Status code:** `201 Created` tells the client that the API created the
   issue successfully.

The API response has a JSON body containing the complete created issue:

```http
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8
Location: /api/issues/ISS-<generated-uuid>

{
  "id": "ISS-<generated-uuid>",
  "title": "Projector not working in Lab 3",
  "description": "Laptop cannot detect the classroom projector.",
  "priority": "High",
  "status": "Open",
  "createdAt": "<server-generated ISO timestamp>"
}
```

The UUID and timestamp are generated at runtime, so they differ from fixed
values in a teaching example. The frontend sends both `Content-Type` and
`Accept`; the API responds with JSON and a `Location` header for the created
issue.
