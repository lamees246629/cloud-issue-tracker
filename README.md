# Cloud Issue Tracker

A small issue-tracking application for creating issues, viewing the issue list,
and changing issue status.

## Lab 3 — Application and API Design

The application uses a browser frontend, a Node.js REST API, and a JSON-file data
service. The API contract and acceptance test plan cover create, view, and
status-change operations. See [docs/lab-03-architecture.md](docs/lab-03-architecture.md),
[docs/api-contract.md](docs/api-contract.md), and
[docs/api-test-plan.md](docs/api-test-plan.md) for the design package.

To run the local app, use Node.js 22.13 or newer:

```powershell
cd frontend
npm start
```

Then open http://localhost:8080.
