# Backend Architecture

The maintained Lab 3 architecture specification is
[../docs/lab-03-architecture.md](../docs/lab-03-architecture.md). The API
contract and acceptance test plan are in
[../docs/api-contract.md](../docs/api-contract.md) and
[../docs/api-test-plan.md](../docs/api-test-plan.md).

Implementation responsibilities are separated as follows:

- `services/issueService.js` reads and writes issue records in JSON.
- `data/issues.json` is the default persistent data store.
