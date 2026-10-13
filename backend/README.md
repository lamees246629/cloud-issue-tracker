# Backend

The backend exposes the issue API and serves the frontend from the same origin.
HTTP handling lives in `routes/issues.js`; SQLite reads and writes live in
`services/issueService.js`. Issues are stored in `data/issues.sqlite`, which is
created on first run and ignored by Git. SQLite is retained instead of the
manual's illustrative JSON-file store so the existing persistent data is kept.

See [../docs/lab-03-architecture.md](../docs/lab-03-architecture.md) for the
The backend exposes the issue API and serves the frontend from the same origin.
HTTP handling lives in `routes/issues.js`; JSON-file reads and writes live in
`services/issueService.js`. Issues are stored in `data/issues.json`. The previous
SQLite file remains in place as a backup and is ignored by Git.
architecture and trust boundary, [../docs/api-contract.md](../docs/api-contract.md)
for endpoint details, and [../docs/api-test-plan.md](../docs/api-test-plan.md)
for the acceptance matrix.

Requirements: Node.js 22.13 or newer (uses the built-in `node:sqlite` module).

From the repository root, start the frontend and backend together with:

```powershell
cd frontend
npm start
```

Alternatively, start the backend from this directory with `npm start`, or use
`npm run dev` to restart it when files change. Open http://localhost:8080.

Set `ISSUES_DB_PATH` to an absolute path before starting the server to use an
isolated SQLite file for tests. When set, the service does not insert sample
Set `ISSUES_DATA_PATH` to an absolute path before starting the server to use an
isolated JSON file for tests. If the file does not exist, the API returns an
empty issue list; the default data file is not modified.
