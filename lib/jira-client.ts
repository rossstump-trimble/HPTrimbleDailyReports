import fs from "fs";
import path from "path";

export interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
  projectKey: string;
  issueType: string;
}

export function getJiraConfig(): JiraConfig | null {
  const baseUrl = (
    process.env.JIRA_API_URL ||
    process.env.JIRA_BASE_URL ||
    "https://jira.trimble.tools"
  ).replace(/\/+$/, "");
  const email = process.env.JIRA_EMAIL || "ross_stump@trimble.com";
  const apiToken =
    process.env.JIRA_API_TOKEN || "AtnMKsbHQK170SMcUUftijkEJtBiAtV0fkn50L";
  const projectKey =
    process.env.JIRA_PROJECT_KEY || process.env.JIRA_PROJECT || "SCHED";
  const issueType = process.env.JIRA_ISSUE_TYPE || "Bug";

  if (!baseUrl || !apiToken) return null;
  return { baseUrl, email, apiToken, projectKey, issueType };
}

function getJiraAuthHeaders(config: JiraConfig, extra: Record<string, string> = {}) {
  const basic = Buffer.from(`${config.email}:${config.apiToken}`).toString("base64");
  return {
    Authorization: `Basic ${basic}`,
    Accept: "application/json",
    ...extra,
  };
}

export async function createJiraIssueFromFeedback(task: {
  id: string;
  page_url?: string;
  global_instruction?: string;
  category?: string;
  severity?: string;
  reporter?: { name?: string; email?: string } | null;
  annotations?: Array<{ text?: string; screenshot_path?: string }>;
}): Promise<{ key: string; url: string } | null> {
  const config = getJiraConfig();
  if (!config) return null;

  const category = task.category || "Bug";
  const instruction = (task.global_instruction || "UI feedback").trim();
  const reporterEmail = task.reporter?.email?.trim();
  const reporterPrefix = reporterEmail ? `[${reporterEmail}] ` : "";
  const summary = `[user-feedback] [HP Daily Reporting] ${reporterPrefix}${instruction}`.slice(0, 250);

  let description = `*HP Daily Reporting UI Feedback*\n\n`;
  description += `*Feedback:* ${instruction}\n`;
  description += `*Category:* ${category}\n`;
  if (task.severity) description += `*Severity:* ${task.severity}\n`;
  if (task.page_url) description += `*Page URL:* ${task.page_url}\n`;
  if (task.reporter?.email || task.reporter?.name) {
    description += `*Reporter:* ${task.reporter.name || ""} <${task.reporter.email || ""}>\n`;
  }
  description += `*Reported At:* ${new Date().toISOString()}\n\n`;

  if (task.annotations && task.annotations.length > 0) {
    description += `*Annotations:*\n`;
    task.annotations.forEach((a, i) => {
      if (a.text) description += `${i + 1}. ${a.text}\n`;
    });
  }

  const feedbackLabel = process.env.JIRA_FEEDBACK_LABEL || "user-feedback";
  const labels = Array.from(
    new Set([
      feedbackLabel,
      "hp-daily-reporting",
      "feedback-tool",
      category.toLowerCase().replace(/\s+/g, "-"),
    ])
  );

  const body = {
    fields: {
      project: { key: config.projectKey },
      summary,
      description,
      issuetype: { name: config.issueType },
      labels,
    },
  };

  try {
    const res = await fetch(`${config.baseUrl}/rest/api/2/issue`, {
      method: "POST",
      headers: getJiraAuthHeaders(config, { "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Jira create failed: ${res.status}]`, errText);
      return null;
    }

    const created = (await res.json()) as { key: string; id: string };
    const issueKey = created.key;
    const issueUrl = `${config.baseUrl}/browse/${issueKey}`;

    // Upload screenshot attachments if present
    if (task.annotations) {
      for (const ann of task.annotations) {
        if (ann.screenshot_path && fs.existsSync(ann.screenshot_path)) {
          try {
            await attachScreenshotToJiraIssue(config, issueKey, ann.screenshot_path);
          } catch (attErr) {
            console.error(`[Jira attach failed for ${ann.screenshot_path}]`, attErr);
          }
        }
      }
    }

    return { key: issueKey, url: issueUrl };
  } catch (err) {
    console.error("[Jira issue creation error]", err);
    return null;
  }
}

async function attachScreenshotToJiraIssue(
  config: JiraConfig,
  issueKey: string,
  filePath: string,
) {
  const bytes = fs.readFileSync(filePath);
  const filename = path.basename(filePath);
  const ext = path.extname(filename).toLowerCase();
  const mimeType =
    ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : ext === ".webp" ? "image/webp" : "image/png";

  const form = new FormData();
  form.append("file", new File([new Uint8Array(bytes)], filename, { type: mimeType }));

  const res = await fetch(`${config.baseUrl}/rest/api/2/issue/${issueKey}/attachments`, {
    method: "POST",
    headers: getJiraAuthHeaders(config, { "X-Atlassian-Token": "no-check" }),
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jira attachment upload failed (${res.status}): ${text}`);
  }
}
