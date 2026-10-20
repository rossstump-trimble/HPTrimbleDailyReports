import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createJiraIssueFromFeedback } from "@/lib/jira-client";

export const runtime = "nodejs";

const DATA_URL_IMAGE_RE =
  /^data:image\/(png|jpeg|jpg|webp);(?:charset=[^;]+;)?base64,([A-Za-z0-9+/=\s]+)$/i;

function getQueuePaths() {
  const root = process.cwd();
  const jsonPath = path.join(root, "data", "feedback_queue.json");
  const attachmentsDir = path.join(root, "data", "feedback_attachments");
  return { jsonPath, attachmentsDir };
}

function loadQueue(jsonPath: string): any[] {
  try {
    if (!fs.existsSync(jsonPath)) return [];
    return JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  } catch {
    return [];
  }
}

function saveQueue(tasks: any[], jsonPath: string) {
  const dir = path.dirname(jsonPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(tasks, null, 2), "utf-8");
}

export async function GET() {
  const { jsonPath } = getQueuePaths();
  const tasks = loadQueue(jsonPath);
  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { jsonPath, attachmentsDir } = getQueuePaths();
    const taskId = `task-${crypto.randomBytes(4).toString("hex")}`;

    const annotations = body.annotations || [];
    const taskDir = path.join(attachmentsDir, taskId);

    for (let i = 0; i < annotations.length; i++) {
      const ann = annotations[i];
      if (ann && typeof ann.screenshot_data_url === "string") {
        const match = DATA_URL_IMAGE_RE.exec(ann.screenshot_data_url.trim());
        if (match) {
          if (!fs.existsSync(taskDir)) fs.mkdirSync(taskDir, { recursive: true });
          const ext = match[1].toLowerCase().replace("jpeg", "jpg");
          const fileName = `annotation-${i + 1}.${ext}`;
          const filePath = path.join(taskDir, fileName);
          fs.writeFileSync(filePath, Buffer.from(match[2].replace(/\s+/g, ""), "base64"));
          delete ann.screenshot_data_url;
          ann.screenshot_path = filePath;
        }
      }
    }

    let reporter = body.reporter || null;
    if (!reporter || (!reporter.email && !reporter.name)) {
      try {
        const cookieHeader = req.headers.get("cookie") || "";
        const userMatch = cookieHeader.match(/(?:^|;\s*)ps_user=([^;]+)/);
        if (userMatch) {
          reporter = JSON.parse(decodeURIComponent(userMatch[1]));
        } else {
          const sessionMatch = cookieHeader.match(/(?:^|;\s*)ps_session=([^;]+)/);
          if (sessionMatch) {
            const session = JSON.parse(decodeURIComponent(sessionMatch[1]));
            if (session.email || session.name) {
              reporter = {
                name: session.name || "",
                email: session.email || "",
                sub: session.sub || "",
              };
            }
          }
        }
      } catch {}
    }

    const task: any = {
      id: taskId,
      created_at: new Date().toISOString(),
      page_url: body.page_url || "",
      global_instruction: body.global_instruction || "",
      category: body.category || "bug",
      severity: body.severity || "medium",
      reporter: reporter || null,
      status: "queued",
      annotations,
    };

    // Forward immediately to Jira SCHED board
    try {
      const jiraResult = await createJiraIssueFromFeedback(task);
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
