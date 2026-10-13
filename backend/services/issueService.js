const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const dataDirectory = path.join(__dirname, "..", "data");
const issuesFile = process.env.ISSUES_DATA_PATH
  ? path.resolve(process.env.ISSUES_DATA_PATH)
  : path.join(dataDirectory, "issues.json");
let writeQueue = Promise.resolve();

async function readIssues() {
  try {
    const content = await fs.readFile(issuesFile, "utf8");
    const issues = JSON.parse(content);
    if (!Array.isArray(issues)) {
      throw new Error("Issue data file must contain a JSON array.");
    }
    return issues;
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function writeIssues(issues) {
  await fs.mkdir(path.dirname(issuesFile), { recursive: true });
  const temporaryFile = `${issuesFile}.${process.pid}.tmp`;
  await fs.writeFile(temporaryFile, JSON.stringify(issues, null, 2), "utf8");
  await fs.rename(temporaryFile, issuesFile);
}

function mutateIssues(mutator) {
  const operation = writeQueue.then(async () => {
    const issues = await readIssues();
    const result = mutator(issues);
    if (result.changed) {
      await writeIssues(issues);
    }
    return result.value;
  });

  writeQueue = operation.catch(() => {});
  return operation;
}

function createIssue(input) {
  return mutateIssues((issues) => {
    const issue = {
      id: `ISS-${randomUUID()}`,
      title: input.title,
      description: input.description,
      priority: input.priority,
      status: "Open",
      createdAt: new Date().toISOString(),
    };
    issues.push(issue);
    return { changed: true, value: issue };
  });
}

function updateIssueStatus(id, status) {
  return mutateIssues((issues) => {
    const issue = issues.find((item) => item.id === id);
    if (!issue) {
      return { changed: false, value: null };
    }

    issue.status = status;
    return { changed: true, value: issue };
  });
}

module.exports = { readIssues, createIssue, updateIssueStatus };
