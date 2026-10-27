import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createJiraIssueFromFeedback } from "@/lib/jira-client";
import { SESSION_COOKIE, isAdminEmail, parseVerifiedSession } from "@/lib/local-session";
import { isLocalAuthRequest } from "@/lib/auth-mode";
import { getAccessControl } from "@/lib/store";

export const runtime = "nodejs";

const DATA_URL_IMAGE_RE =
  /^data:image\/(png|jpeg|jpg|webp);(?:charset=[^;]+;)?base64,([A-Za-z0-9+/=\s]+)$/i;

const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024; // 5 MB

function getQueuePaths() {
  const root = process.cwd();
  const jsonPath = path.join(root, "data", "feedback_queue.json");
  const attachmentsDir = path.join(root, "data", "feedback_attachments");
  return { jsonPath, attachmentsDir };
}

function loadQueue(jsonPath: string): Record<string, unknown>[] {
  try {
    if (!fs.existsSync(jsonPath)) return [];
    return JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  } catch {
    return [];
  }
}

function saveQueue(tasks: Record<string, unknown>[], jsonPath: string) {
  const dir = path.dirname(jsonPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(tasks, null, 2), "utf-8");
}

export async function GET(req: Request) {
  const accessControl = getAccessControl();
  let isAdmin = isLocalAuthRequest(req);
  if (!isAdmin) {
    try {
      const jar = cookies();
      const session = parseVerifiedSession(jar.get(SESSION_COOKIE)?.value, {
        allowedDomains: accessControl.allowedDomains,
        allowedEmails: accessControl.allowedEmails,
      });
      isAdmin = Boolean(session && isAdminEmail(session.email, accessControl.adminEmails));
    } catch {
      isAdmin = false;
    }
  }

  if (!isAdmin) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  const { jsonPath } = getQueuePaths();
  const tasks = loadQueue(jsonPath).map((t) => {
    const anns = Array.isArray(t.annotations)
      ? (t.annotations as Record<string, unknown>[]).map(({ screenshot_path: _sp, ...rest }) => rest)
      : [];
    return {
      ...t,
      annotations: anns,
    };
  });
  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const { jsonPath, attachmentsDir } = getQueuePaths();
    const taskId = `task-${crypto.randomBytes(4).toString("hex")}`;

    const rawAnnotations = Array.isArray(body.annotations) ? body.annotations.slice(0, 5) : [];
    const annotations: Array<{ text?: string; screenshot_path?: string }> = [];
    const taskDir = path.join(attachmentsDir, taskId);

    for (let i = 0; i < rawAnnotations.length; i++) {
      const ann = rawAnnotations[i] as Record<string, unknown> | undefined;
      if (!ann || typeof ann !== "object") continue;
      const entry: { text?: string; screenshot_path?: string } = {
        text: typeof ann.text === "string" ? ann.text.slice(0, 2000) : undefined,
      };
      if (typeof ann.screenshot_data_url === "string") {
        const match = DATA_URL_IMAGE_RE.exec(ann.screenshot_data_url.trim());
        if (match) {
          const imgBytes = Buffer.from(match[2].replace(/\s+/g, ""), "base64");
          if (imgBytes.length <= MAX_SCREENSHOT_BYTES) {
            if (!fs.existsSync(taskDir)) fs.mkdirSync(taskDir, { recursive: true });
            const ext = match[1].toLowerCase().replace("jpeg", "jpg");
            const fileName = `annotation-${i + 1}.${ext}`;
            const filePath = path.join(taskDir, fileName);
            fs.writeFileSync(filePath, imgBytes);
            entry.screenshot_path = filePath;
          }
        }
      }
      annotations.push(entry);
    }

    let reporter: { name?: string; email?: string; sub?: string } | null = null;
    try {
      const jar = cookies();
      const session = parseVerifiedSession(jar.get(SESSION_COOKIE)?.value);
      if (session && (session.email || session.name)) {
        reporter = {
          name: session.name || "",
          email: session.email || "",
          sub: session.sub || "",
        };
      }
    } catch {
      // ignore outside request context
    }

    const task: Record<string, unknown> = {
      id: taskId,
      created_at: new Date().toISOString(),
      page_url: typeof body.page_url === "string" ? body.page_url.slice(0, 500) : "",
      global_instruction:
        typeof body.global_instruction === "string" ? body.global_instruction.slice(0, 4000) : "",
      category: typeof body.category === "string" ? body.category.slice(0, 64) : "bug",
      severity: typeof body.severity === "string" ? body.severity.slice(0, 32) : "medium",
      reporter,
      status: "queued",
      annotations,
    };

    // Forward immediately to Jira SCHED board if configured
    try {
      const jiraResult = await createJiraIssueFromFeedback({
        id: taskId,
        page_url: String(task.page_url || ""),
        global_instruction: String(task.global_instruction || ""),
        category: String(task.category || "bug"),
        severity: String(task.severity || "medium"),
        reporter,
        annotations,
      });
      if (jiraResult) {
        task.jira_issue_key = jiraResult.key;
        task.jira_issue_url = jiraResult.url;
        task.external_refs = [{ system: "jira", id: jiraResult.key, url: jiraResult.url }];
      }
    } catch (jiraErr) {
      console.error("[Jira push failed]", jiraErr);
    }

    const tasks = loadQueue(jsonPath);
    tasks.unshift(task);
    saveQueue(tasks, jsonPath);

    return NextResponse.json(
      {
        task_id: taskId,
        status: task.status,
        category: task.category,
        jira_issue_key: task.jira_issue_key || null,
        jira_issue_url: task.jira_issue_url || null,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[api/feedback error]", err);
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }
}
