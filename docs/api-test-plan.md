# API Test Plan: Issues API

Run these checks against a local test instance. For an empty isolated database,
Run these checks against a local test instance. For isolated test data, set
`ISSUES_DATA_PATH` to a temporary JSON file before starting the backend. A
missing file represents an empty issue list. Do not clear a developer's normal
issue data to set up a test.

| Test ID | Request / setup                                                                            | Expected result                                                                     |
| ------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| T01     | `GET /api/issues` with issues stored                                                       | `200`; JSON array contains the stored issues.                                       |
| T02     | `POST /api/issues` with a valid title, description, and priority                           | `201`; complete issue returned with generated `id`, `createdAt`, and `Open` status. |
| T03     | `POST /api/issues` with missing or blank title                                             | `400`; `VALIDATION_ERROR`; no issue is stored.                                      |
| T04     | `POST /api/issues` with title under 3 or over 100 characters                               | `400`; `VALIDATION_ERROR`; no issue is stored.                                      |
| T05     | `POST /api/issues` with description under 5 or over 500 characters, or priority `Critical` | `400`; `VALIDATION_ERROR`; no issue is stored.                                      |
| T06     | `PATCH /api/issues/{id}/status` for an existing issue with `{"status":"Resolved"}`         | `200`; complete issue returned with only its status changed.                        |
| T07     | `PATCH /api/issues/{id}/status` with status `Deleted`                                      | `400`; `VALIDATION_ERROR`; stored issue is unchanged.                               |
| T08     | `PATCH /api/issues/missing-id/status`                                                      | `404`; `ISSUE_NOT_FOUND`.                                                           |
| T09     | `GET /api/issues` against a temporary empty data store                                     | `200`; response body is `[]`.                                                       |
| T10     | `POST /api/issues` with client-supplied `id`, `status`, or `createdAt`                     | `201`; API-generated values are returned; client values are ignored.                |
| T11     | `POST` or `PATCH` with `Content-Type: text/plain`                                          | `415`; `UNSUPPORTED_MEDIA_TYPE`; no data changes.                                   |
| T12     | `POST` or `PATCH` with malformed JSON                                                      | `400`; `VALIDATION_ERROR`; no data changes.                                         |
| T13     | `POST` or `PATCH` with a JSON body larger than 65,536 bytes                                | `413`; `REQUEST_TOO_LARGE`; no data changes.                                        |
| T14     | Cause an unexpected storage failure in an isolated test setup                              | `500`; `INTERNAL_ERROR`; response contains no stack trace.                          |

Tests T01, T02, and T06 cover successful operations. The remaining tests cover
validation, missing resources, content type, request size, and empty storage.
