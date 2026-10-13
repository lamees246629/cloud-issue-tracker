const issueForm = document.querySelector("#issue-form");
const titleInput = document.querySelector("#title");
const descriptionInput = document.querySelector("#description");
const priorityInput = document.querySelector("#priority");
const issuesList = document.querySelector("#issues-list");
const issueCount = document.querySelector("#issue-count");
const formMessage = document.querySelector("#form-message");

async function requestIssues(url, options) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...options?.headers,
    },
  });
  const result = await response.json();

  if (!response.ok) {
    const message =
      typeof result.error === "string" ? result.error : result.error?.message;
    throw new Error(message || "The request failed.");
  }

  return result;
}

function renderIssues(issues) {
  issuesList.replaceChildren();
  issueCount.textContent = issues.length;

  if (issues.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-state";
    emptyState.textContent = "No issues yet";
    issuesList.append(emptyState);
    return;
  }

  issues.forEach((issue) => {
    const card = document.createElement("article");
    card.className = "issue-card";

    const heading = document.createElement("h3");
    heading.textContent = issue.title;

    const description = document.createElement("p");
    description.textContent = issue.description;

    const meta = document.createElement("p");
    meta.textContent = `Priority: ${issue.priority} | Status: 
${issue.status}`;

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = issue.status === "Open" ? "Mark Resolved" : "Reopen";
    button.addEventListener("click", () => toggleIssueStatus(issue));

    card.append(heading, description, meta, button);
    issuesList.append(card);
  });
}

issueForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const newIssue = {
    title: titleInput.value.trim(),
    description: descriptionInput.value.trim(),
    priority: priorityInput.value,
  };

  try {
    await requestIssues("/api/issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newIssue),
    });
    issueForm.reset();
    priorityInput.value = "Medium";
    formMessage.textContent = "Issue saved.";
    await loadIssues();
  } catch (error) {
    formMessage.textContent = `Could not save issue: ${error.message}`;
  }
});

async function toggleIssueStatus(issue) {
  const status = issue.status === "Open" ? "Resolved" : "Open";

  try {
    await requestIssues(`/api/issues/${encodeURIComponent(issue.id)}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await loadIssues();
    formMessage.textContent = "Issue status saved.";
  } catch (error) {
    formMessage.textContent = `Could not update issue: ${error.message}`;
  }
}

async function loadIssues() {
  try {
    renderIssues(await requestIssues("/api/issues"));
  } catch (error) {
    issueCount.textContent = "0";
    issuesList.replaceChildren();
    formMessage.textContent = `Could not load issues: ${error.message}`;
  }
}

loadIssues();
