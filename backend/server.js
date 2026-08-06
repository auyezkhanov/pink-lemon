/* =========================================================
   Pink Lemon — local backend
   Plain Node.js (no npm install needed) + built-in node:sqlite.
   Serves the static site AND stores form submissions ("заявки").
   ========================================================= */
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "leads.db");
const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY || "pinklemon-admin";

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

/* ---------------- Database ---------------- */
const db = new DatabaseSync(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    name TEXT,
    email TEXT,
    company TEXT,
    phone TEXT,
    project_type TEXT,
    budget TEXT,
    message TEXT,
    consent INTEGER DEFAULT 0,
    form_source TEXT,
    page TEXT
  )
`);

// Statements are prepared fresh per call rather than cached at module scope —
// node:sqlite (experimental) can finalize long-lived cached StatementSync objects between requests.
function insertLead(row) {
  return db.prepare(`
    INSERT INTO leads (created_at, name, email, company, phone, project_type, budget, message, consent, form_source, page)
    VALUES (@created_at, @name, @email, @company, @phone, @project_type, @budget, @message, @consent, @form_source, @page)
  `).run(row);
}
function listLeads() {
  return db.prepare(`SELECT * FROM leads ORDER BY id DESC`).all();
}
function deleteLead(id) {
  return db.prepare(`DELETE FROM leads WHERE id = ?`).run(id);
}

/* ---------------- Helpers ---------------- */
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json"
};

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function readBody(req, limitBytes) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limitBytes) {
        reject(new Error("Payload too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function isAdmin(req) {
  return req.headers["x-admin-key"] === ADMIN_KEY;
}

function clean(value, maxLen) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLen || 5000);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ---------------- Static file serving ---------------- */
function serveStatic(req, res, pathname) {
  let rel = pathname === "/" ? "/index.html" : pathname;
  rel = rel.split("?")[0];
  const filePath = path.normalize(path.join(ROOT, decodeURIComponent(rel)));

  // Prevent path traversal outside project root, and keep /backend off-limits.
  if (!filePath.startsWith(ROOT) || filePath.startsWith(path.join(ROOT, "backend"))) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      fs.readFile(path.join(ROOT, "404.html"), (err404, page404) => {
        res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
        res.end(err404 ? "404 — Not found" : page404);
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
}

/* ---------------- Request handler ---------------- */
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  try {
    // POST /api/leads — store a new submission (заявка)
    if (req.method === "POST" && pathname === "/api/leads") {
      const raw = await readBody(req, 100 * 1024); // 100KB cap
      let body;
      try {
        body = JSON.parse(raw);
      } catch {
        return sendJson(res, 400, { ok: false, error: "Invalid JSON body." });
      }

      const name = clean(body.name, 200);
      const email = clean(body.email, 200);
      const message = clean(body.message, 5000);

      if (!name || !email || !message) {
        return sendJson(res, 400, { ok: false, error: "name, email and message are required." });
      }
      if (!EMAIL_RE.test(email)) {
        return sendJson(res, 400, { ok: false, error: "Please provide a valid email address." });
      }

      const row = {
        created_at: new Date().toISOString(),
        name,
        email,
        company: clean(body.company, 200),
        phone: clean(body.phone, 60),
        project_type: clean(body.type, 100),
        budget: clean(body.budget, 100),
        message,
        consent: body.consent ? 1 : 0,
        form_source: clean(body.form_source, 100),
        page: clean(body.page, 200)
      };

      const info = insertLead(row);
      console.log(`[lead #${info.lastInsertRowid}] ${row.name} <${row.email}> — ${row.form_source || "unknown source"}`);
      return sendJson(res, 201, { ok: true, id: Number(info.lastInsertRowid) });
    }

    // GET /api/leads — list all submissions (admin only)
    if (req.method === "GET" && pathname === "/api/leads") {
      if (!isAdmin(req)) return sendJson(res, 401, { ok: false, error: "Missing or invalid admin key." });
      const rows = listLeads();
      return sendJson(res, 200, { ok: true, leads: rows });
    }

    // DELETE /api/leads/:id — remove a submission (admin only)
    if (req.method === "DELETE" && pathname.startsWith("/api/leads/")) {
      if (!isAdmin(req)) return sendJson(res, 401, { ok: false, error: "Missing or invalid admin key." });
      const id = Number(pathname.split("/").pop());
      if (!Number.isInteger(id)) return sendJson(res, 400, { ok: false, error: "Invalid id." });
      deleteLead(id);
      return sendJson(res, 200, { ok: true });
    }

    // GET /admin — admin dashboard page (separate from the public site nav)
    if (req.method === "GET" && (pathname === "/admin" || pathname === "/admin.html")) {
      const adminHtml = fs.readFileSync(path.join(__dirname, "admin.html"));
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end(adminHtml);
    }

    // Everything else -> static site files
    if (req.method === "GET") {
      return serveStatic(req, res, pathname);
    }

    res.writeHead(405);
    res.end("Method not allowed");
  } catch (err) {
    console.error(err);
    sendJson(res, 500, { ok: false, error: "Server error." });
  }
});

server.listen(PORT, () => {
  console.log("");
  console.log("  Pink Lemon — local server running");
  console.log(`  Site:   http://localhost:${PORT}/`);
  console.log(`  Admin:  http://localhost:${PORT}/admin  (key: ${ADMIN_KEY})`);
  console.log(`  DB:     ${DB_PATH}`);
  console.log("");
});
