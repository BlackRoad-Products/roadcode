// RoadCode — Code Collaboration Platform for BlackRoad OS
// AI-powered code management, snippets, reviews, templates, and live sessions

let dbReady = false;

// Rate limiter (in-memory, resets on worker restart)
const rlMap = new Map();
function checkRL(ip, max = 60, windowMs = 60000) {
  const now = Date.now();
  const e = rlMap.get(ip);
  if (!e || now - e.s > windowMs) { rlMap.set(ip, { s: now, c: 1 }); return null; }
  e.c++;
  if (e.c > max) return new Response(JSON.stringify({ error: 'Rate limited', retry_after: Math.ceil((e.s + windowMs - now) / 1000) }), { status: 429, headers: { 'Content-Type': 'application/json' } });
  return null;
}

const AGENTS = {
  nova: { name: 'Nova', role: 'Code Architect', personality: 'Designs system architecture, plans project structure, suggests patterns and best practices.' },
  syntax: { name: 'Syntax', role: 'Debugger', personality: 'Finds bugs, optimizes performance, explains errors clearly, suggests fixes.' },
  blueprint: { name: 'Blueprint', role: 'Template Designer', personality: 'Creates project templates, scaffolds apps, designs file structures and boilerplate.' }
};

const TEMPLATES = [
  { id: 'cf-worker', name: 'Cloudflare Worker', language: 'javascript', framework: 'workers', description: 'Production-ready Cloudflare Worker with D1, KV, and R2 bindings', files: [
    { path: 'src/index.js', content: 'export default {\n  async fetch(request, env) {\n    return new Response("Hello from BlackRoad Worker!");\n  }\n};' },
    { path: 'wrangler.toml', content: 'name = "my-worker"\nmain = "src/index.js"\ncompatibility_date = "2024-01-01"' },
    { path: 'package.json', content: '{"name":"my-worker","private":true,"scripts":{"dev":"wrangler dev","deploy":"wrangler deploy"}}' }
  ]},
  { id: 'react-app', name: 'React App', language: 'javascript', framework: 'react', description: 'React application with Vite, TypeScript, and BlackRoad design system', files: [
    { path: 'src/App.jsx', content: 'export default function App() {\n  return <div className="app"><h1>BlackRoad App</h1></div>;\n}' },
    { path: 'package.json', content: '{"name":"my-app","scripts":{"dev":"vite","build":"vite build"},"dependencies":{"react":"^18","react-dom":"^18"}}' },
    { path: 'vite.config.js', content: 'import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\nexport default defineConfig({ plugins: [react()] });' }
  ]},
  { id: 'python-script', name: 'Python Script', language: 'python', framework: 'none', description: 'Python CLI tool with argparse, logging, and BlackRoad conventions', files: [
    { path: 'main.py', content: '#!/usr/bin/env python3\n"""BlackRoad Python Tool"""\nimport argparse\nimport logging\n\ndef main():\n    parser = argparse.ArgumentParser(description="BlackRoad Tool")\n    parser.add_argument("--verbose", "-v", action="store_true")\n    args = parser.parse_args()\n    logging.basicConfig(level=logging.DEBUG if args.verbose else logging.INFO)\n    logging.info("Running...")\n\nif __name__ == "__main__":\n    main()' },
    { path: 'requirements.txt', content: '# Add dependencies here' }
  ]},
  { id: 'bash-tool', name: 'Bash Tool', language: 'bash', framework: 'none', description: 'Shell script with BlackRoad conventions, color output, error handling', files: [
    { path: 'tool.sh', content: '#!/bin/bash\nset -e\nPINK=\'\\033[38;5;205m\'\nRESET=\'\\033[0m\'\necho -e "${PINK}BlackRoad Tool${RESET}"\n# Your code here' }
  ]},
  { id: 'node-api', name: 'Node.js API', language: 'javascript', framework: 'express', description: 'Express API with middleware, routing, and error handling', files: [
    { path: 'index.js', content: 'const express = require("express");\nconst app = express();\napp.use(express.json());\napp.get("/health", (req, res) => res.json({ status: "ok" }));\napp.listen(3000, () => console.log("Listening on 3000"));' },
    { path: 'package.json', content: '{"name":"my-api","scripts":{"start":"node index.js","dev":"nodemon index.js"},"dependencies":{"express":"^4"}}' }
  ]},
  { id: 'static-site', name: 'Static Site', language: 'html', framework: 'none', description: 'Static website with BlackRoad design system, responsive layout', files: [
    { path: 'index.html', content: '<!DOCTYPE html>\n<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BlackRoad Site</title>\n<style>body{background:#0a0a0a;color:#f5f5f5;font-family:system-ui;margin:0;padding:40px}a{color:#ff1d6c}</style></head>\n<body><h1>BlackRoad Site</h1></body></html>' }
  ]}
];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...CORS } });
}

function html(content, status = 200) {
  return new Response(content, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', ...CORS } });
}

function uuid() {
  return crypto.randomUUID();
}

async function initDB(db) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, language TEXT, framework TEXT,
      owner TEXT DEFAULT 'anonymous', created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY, project_id TEXT NOT NULL, path TEXT NOT NULL, content TEXT,
      language TEXT, size INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS snippets (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, code TEXT NOT NULL, language TEXT, tags TEXT,
      description TEXT, author TEXT DEFAULT 'anonymous', stars INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY, project_id TEXT, user_name TEXT, file_path TEXT, cursor_line INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active', started_at TEXT DEFAULT (datetime('now')), last_ping TEXT DEFAULT (datetime('now'))
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY, project_id TEXT, file_path TEXT, code TEXT, review_text TEXT,
      agent TEXT DEFAULT 'syntax', severity TEXT DEFAULT 'info', status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now'))
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY, type TEXT, entity_id TEXT, entity_type TEXT, details TEXT,
      agent TEXT, credits INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now'))
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS file_versions (
      id TEXT PRIMARY KEY, file_id TEXT, project_id TEXT, version INTEGER DEFAULT 1,
      content TEXT, author TEXT DEFAULT 'anonymous', message TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS collab_sessions (
      id TEXT PRIMARY KEY, project_id TEXT, file_path TEXT, status TEXT DEFAULT 'active',
      created_by TEXT DEFAULT 'anonymous', participants TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS collab_cursors (
      id TEXT PRIMARY KEY, session_id TEXT, user_name TEXT, line INTEGER DEFAULT 0,
      column_num INTEGER DEFAULT 0, is_typing INTEGER DEFAULT 0, color TEXT DEFAULT '#ff1d6c',
      updated_at TEXT DEFAULT (datetime('now'))
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS build_pipelines (
      id TEXT PRIMARY KEY, project_id TEXT, name TEXT DEFAULT 'default',
      steps TEXT DEFAULT '[]', status TEXT DEFAULT 'idle',
      last_run TEXT, last_log TEXT, created_at TEXT DEFAULT (datetime('now'))
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS build_runs (
      id TEXT PRIMARY KEY, pipeline_id TEXT, project_id TEXT, status TEXT DEFAULT 'running',
      log TEXT DEFAULT '', started_at TEXT DEFAULT (datetime('now')),
      finished_at TEXT, duration_ms INTEGER DEFAULT 0
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS plugins (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT DEFAULT 'extension',
      description TEXT, version TEXT DEFAULT '1.0.0', author TEXT DEFAULT 'blackroad',
      config TEXT DEFAULT '{}', enabled INTEGER DEFAULT 1, install_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS installed_plugins (
      id TEXT PRIMARY KEY, plugin_id TEXT, user_name TEXT DEFAULT 'anonymous',
      config TEXT DEFAULT '{}', installed_at TEXT DEFAULT (datetime('now'))
    )`)
  ]);
}

async function logEvent(db, type, entityId, entityType, details, agent = 'system', credits = 0) {
  try {
    await db.prepare('INSERT INTO events (id, type, entity_id, entity_type, details, agent, credits) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(uuid(), type, entityId, entityType, details, agent, credits).run();
  } catch (e) { /* non-critical */ }
}

// --- PROJECT MANAGEMENT ---

async function handleProjects(request, env, path, method) {
  const db = env.DB;
  const parts = path.split('/').filter(Boolean); // ['api', 'projects', ...]

  if (method === 'GET' && parts.length === 2) {
    const { results } = await db.prepare('SELECT * FROM projects ORDER BY updated_at DESC LIMIT 100').all();
    return json({ projects: results, count: results.length });
  }

  if (method === 'POST' && parts.length === 2) {
    const body = await request.json();
    const id = uuid();
    await db.prepare('INSERT INTO projects (id, name, description, language, framework, owner) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(id, body.name || 'Untitled', body.description || '', body.language || 'javascript', body.framework || '', body.owner || 'anonymous').run();
    await logEvent(db, 'project_created', id, 'project', body.name || 'Untitled', 'nova', 10);
    return json({ id, message: 'Project created', credits_earned: 10 }, 201);
  }

  if (parts.length >= 3) {
    const projectId = parts[2];

    if (method === 'GET' && parts.length === 3) {
      const project = await db.prepare('SELECT * FROM projects WHERE id = ?').bind(projectId).first();
      if (!project) return json({ error: 'Project not found' }, 404);
      const { results: files } = await db.prepare('SELECT id, path, language, size, updated_at FROM files WHERE project_id = ? ORDER BY path').bind(projectId).all();
      return json({ ...project, files });
    }

    if (method === 'DELETE' && parts.length === 3) {
      await db.batch([
        db.prepare('DELETE FROM files WHERE project_id = ?').bind(projectId),
        db.prepare('DELETE FROM reviews WHERE project_id = ?').bind(projectId),
        db.prepare('DELETE FROM sessions WHERE project_id = ?').bind(projectId),
        db.prepare('DELETE FROM projects WHERE id = ?').bind(projectId)
      ]);
      await logEvent(db, 'project_deleted', projectId, 'project', 'deleted');
      return json({ message: 'Project deleted' });
    }

    // Project files: /api/projects/:id/files
    if (parts[3] === 'files') {
      return handleProjectFiles(request, db, projectId, parts, method);
    }
  }

  return json({ error: 'Not found' }, 404);
}

async function handleProjectFiles(request, db, projectId, parts, method) {
  if (method === 'GET' && parts.length === 4) {
    const { results } = await db.prepare('SELECT * FROM files WHERE project_id = ? ORDER BY path').bind(projectId).all();
    return json({ files: results });
  }

  if (method === 'POST' && parts.length === 4) {
    const body = await request.json();
    const id = uuid();
    const content = body.content || '';
    await db.prepare('INSERT INTO files (id, project_id, path, content, language, size) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(id, projectId, body.path || 'untitled.txt', content, body.language || 'text', content.length).run();
    await db.prepare('UPDATE projects SET updated_at = datetime("now") WHERE id = ?').bind(projectId).run();
    await logEvent(db, 'file_created', id, 'file', body.path, 'nova', 5);
    return json({ id, message: 'File created', credits_earned: 5 }, 201);
  }

  if (parts.length >= 5) {
    const fileId = parts[4];

    if (method === 'GET') {
      const file = await db.prepare('SELECT * FROM files WHERE id = ? AND project_id = ?').bind(fileId, projectId).first();
      if (!file) return json({ error: 'File not found' }, 404);
      return json(file);
    }

    if (method === 'PUT') {
      const body = await request.json();
      const content = body.content || '';
      // Auto-save old version before overwrite
      const old = await db.prepare('SELECT content, updated_at FROM files WHERE id = ? AND project_id = ?').bind(fileId, projectId).first();
      if (old && old.content) {
        const versionCount = (await db.prepare('SELECT COUNT(*) as c FROM file_versions WHERE file_id = ?').bind(fileId).first()).c;
        await db.prepare('INSERT INTO file_versions (id, file_id, content, version, created_at) VALUES (?, ?, ?, ?, ?)')
          .bind(uuid(), fileId, old.content, versionCount + 1, old.updated_at || new Date().toISOString()).run();
      }
      await db.prepare('UPDATE files SET content = ?, size = ?, updated_at = datetime("now") WHERE id = ? AND project_id = ?')
        .bind(content, content.length, fileId, projectId).run();
      await db.prepare('UPDATE projects SET updated_at = datetime("now") WHERE id = ?').bind(projectId).run();
      await logEvent(db, 'file_updated', fileId, 'file', 'updated', 'nova', 2);
      return json({ message: 'File updated', credits_earned: 2 });
    }

    // File version history
    if (method === 'GET' && path.endsWith('/versions')) {
      const versions = await db.prepare('SELECT * FROM file_versions WHERE file_id = ? ORDER BY version DESC LIMIT 50').bind(fileId).all();
      return json(versions.results || []);
    }

    if (method === 'DELETE') {
      await db.prepare('DELETE FROM files WHERE id = ? AND project_id = ?').bind(fileId, projectId).run();
      await logEvent(db, 'file_deleted', fileId, 'file', 'deleted');
      return json({ message: 'File deleted' });
    }
  }

  return json({ error: 'Not found' }, 404);
}

// --- SNIPPETS ---

async function handleSnippets(request, env, path, method) {
  const db = env.DB;
  const parts = path.split('/').filter(Boolean);

  if (method === 'GET' && parts.length === 2) {
    const url = new URL(request.url);
    const search = url.searchParams.get('q');
    const lang = url.searchParams.get('language');
    const tag = url.searchParams.get('tag');
    let query = 'SELECT * FROM snippets WHERE 1=1';
    const binds = [];
    if (search) { query += ' AND (title LIKE ? OR description LIKE ? OR code LIKE ?)'; binds.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (lang) { query += ' AND language = ?'; binds.push(lang); }
    if (tag) { query += ' AND tags LIKE ?'; binds.push(`%${tag}%`); }
    query += ' ORDER BY stars DESC, created_at DESC LIMIT 50';
    const stmt = db.prepare(query);
    const { results } = binds.length ? await stmt.bind(...binds).all() : await stmt.all();
    return json({ snippets: results, count: results.length });
  }

  if (method === 'POST' && parts.length === 2) {
    const body = await request.json();
    const id = uuid();
    const tags = Array.isArray(body.tags) ? body.tags.join(',') : (body.tags || '');
    await db.prepare('INSERT INTO snippets (id, title, code, language, tags, description, author) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(id, body.title || 'Untitled', body.code || '', body.language || 'text', tags, body.description || '', body.author || 'anonymous').run();
    await logEvent(db, 'snippet_created', id, 'snippet', body.title, 'blueprint', 8);
    return json({ id, message: 'Snippet saved', credits_earned: 8 }, 201);
  }

  if (parts.length === 3) {
    const snippetId = parts[2];
    if (method === 'GET') {
      const snippet = await db.prepare('SELECT * FROM snippets WHERE id = ?').bind(snippetId).first();
      if (!snippet) return json({ error: 'Snippet not found' }, 404);
      return json(snippet);
    }
    if (method === 'DELETE') {
      await db.prepare('DELETE FROM snippets WHERE id = ?').bind(snippetId).run();
      return json({ message: 'Snippet deleted' });
    }
    if (method === 'POST') {
      // Star a snippet
      await db.prepare('UPDATE snippets SET stars = stars + 1 WHERE id = ?').bind(snippetId).run();
      return json({ message: 'Starred' });
    }
  }

  return json({ error: 'Not found' }, 404);
}

// --- CODE EXECUTION SANDBOX ---

async function handleExecute(request, env) {
  const body = await request.json();
  const { code, language, stdin } = body;
  if (!code) return json({ error: 'No code provided' }, 400);

  // Structured for future sandboxing -- returns mock execution results for now
  const startTime = Date.now();
  const execId = uuid();
  let output = '';
  let exitCode = 0;

  try {
    if (language === 'javascript' || !language) {
      // Real JS execution in isolated function scope
      const logs = [];
      const safeConsole = { log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')) };
      try {
        const fn = new Function('console', code);
        fn(safeConsole);
        output = logs.join('\n') || '[Program executed, no output]';
      } catch (evalErr) {
        output = `Error: ${evalErr.message}`;
        exitCode = 1;
      }
    } else if (language === 'python' || language === 'bash' || language === 'shell') {
      output = `[${language} execution requires RoadTrip agent delegation]\nUse: POST https://roadtrip.blackroad.io/api/execute with {"code": "...", "language": "${language}"}\nOr try the RoadC language at https://roadtrip.blackroad.io for native agent execution.`;
    } else {
      output = `[${language} execution queued - delegate to RoadTrip for server-side languages]`;
    }
  } catch (e) {
    output = `Error: ${e.message}`;
    exitCode = 1;
  }

  const duration = Date.now() - startTime;
  await logEvent(env.DB, 'code_executed', execId, 'execution', `${language || 'js'}: ${code.length} chars`, 'syntax', 3);

  return json({
    id: execId,
    output,
    exit_code: exitCode,
    duration_ms: duration,
    language: language || 'javascript',
    sandbox: language === 'javascript' || !language ? 'function-scope' : 'delegated',
    credits_earned: 3
  });
}

// --- AI ASSIST ---

async function handleAssist(request, env) {
  const body = await request.json();
  const { code, question, agent: agentName } = body;
  if (!code && !question) return json({ error: 'Provide code and/or question' }, 400);

  const agent = AGENTS[agentName] || AGENTS.nova;
  let response;

  try {
    if (env.AI) {
      const result = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          { role: 'system', content: `You are ${agent.name}, the ${agent.role} for RoadCode (BlackRoad OS code platform). ${agent.personality} Keep responses concise and actionable. Use code examples when helpful.` },
          { role: 'user', content: `${question || 'Review this code and suggest improvements:'}\n\n\`\`\`\n${code || 'No code provided'}\n\`\`\`` }
        ],
        max_tokens: 1024
      });
      response = result.response || result;
    } else {
      response = generateFallbackAssist(code, question, agent);
    }
  } catch (e) {
    response = generateFallbackAssist(code, question, agent);
  }

  await logEvent(env.DB, 'ai_assist', uuid(), 'assist', `${agent.name}: ${(question || '').slice(0, 80)}`, agent.name.toLowerCase(), 0);

  return json({
    agent: { name: agent.name, role: agent.role },
    response,
    model: env.AI ? 'llama-3.1-8b-instruct' : 'fallback'
  });
}

function generateFallbackAssist(code, question, agent) {
  if (!code) return `${agent.name} here. Send me some code and I'll analyze it for you.`;
  const lines = (code || '').split('\n').length;
  const hasAsync = (code || '').includes('async');
  const hasError = (code || '').includes('try') || (code || '').includes('catch');
  const tips = [];
  if (lines > 50) tips.push('Consider breaking this into smaller functions for readability.');
  if (!hasError) tips.push('Add error handling with try/catch blocks.');
  if (hasAsync && !code.includes('await')) tips.push('You have async functions but no await -- check if you need to await promises.');
  if (!code.includes('const') && !code.includes('let') && code.includes('var')) tips.push('Use const/let instead of var for better scoping.');
  if (tips.length === 0) tips.push('Code looks clean. Consider adding JSDoc comments for documentation.');
  return `${agent.name} (${agent.role}): ${tips.join(' ')}`;
}

// --- CODE REVIEW ---

async function handleReview(request, env, path, method) {
  const db = env.DB;
  const parts = path.split('/').filter(Boolean);

  if (method === 'GET' && parts.length === 2) {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('project_id');
    const status = url.searchParams.get('status');
    let query = 'SELECT * FROM reviews WHERE 1=1';
    const binds = [];
    if (projectId) { query += ' AND project_id = ?'; binds.push(projectId); }
    if (status) { query += ' AND status = ?'; binds.push(status); }
    query += ' ORDER BY created_at DESC LIMIT 50';
    const stmt = db.prepare(query);
    const { results } = binds.length ? await stmt.bind(...binds).all() : await stmt.all();
    return json({ reviews: results, count: results.length });
  }

  if (method === 'POST' && parts.length === 2) {
    const body = await request.json();
    const id = uuid();
    let reviewText = '';

    try {
      if (env.AI) {
        const result = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
          messages: [
            { role: 'system', content: 'You are Syntax, the code review agent for RoadCode. Review code for bugs, security issues, performance, and best practices. Be specific and actionable. Format: list issues with severity (critical/warning/info).' },
            { role: 'user', content: `Review this code:\n\`\`\`\n${body.code || ''}\n\`\`\`` }
          ],
          max_tokens: 1024
        });
        reviewText = result.response || result;
      } else {
        reviewText = generateFallbackReview(body.code);
      }
    } catch (e) {
      reviewText = generateFallbackReview(body.code);
    }

    await db.prepare('INSERT INTO reviews (id, project_id, file_path, code, review_text, agent, severity, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, body.project_id || null, body.file_path || '', body.code || '', reviewText, 'syntax', body.severity || 'info', 'completed').run();
    await logEvent(db, 'review_created', id, 'review', (body.file_path || 'inline').slice(0, 80), 'syntax', 15);

    return json({ id, review: reviewText, agent: 'Syntax', credits_earned: 15 }, 201);
  }

  if (parts.length === 3 && method === 'GET') {
    const review = await db.prepare('SELECT * FROM reviews WHERE id = ?').bind(parts[2]).first();
    if (!review) return json({ error: 'Review not found' }, 404);
    return json(review);
  }

  return json({ error: 'Not found' }, 404);
}

function generateFallbackReview(code) {
  if (!code) return 'No code provided for review.';
  const issues = [];
  if (code.includes('eval(')) issues.push('[CRITICAL] eval() detected -- security risk, avoid dynamic code execution.');
  if (code.includes('innerHTML')) issues.push('[WARNING] innerHTML usage -- potential XSS vulnerability. Use textContent or sanitize input.');
  if (!code.includes('try') && !code.includes('catch')) issues.push('[INFO] No error handling detected. Add try/catch for robustness.');
  if (code.includes('var ')) issues.push('[INFO] Using var -- prefer const/let for block scoping.');
  if (code.includes('console.log')) issues.push('[INFO] console.log statements found -- remove before production.');
  if (code.length > 2000) issues.push('[INFO] Large code block -- consider splitting into modules.');
  if (issues.length === 0) issues.push('[INFO] No obvious issues found. Code passes basic review.');
  return `Code Review by Syntax:\n\n${issues.join('\n')}`;
}

// --- SESSIONS (LIVE COLLABORATION) ---

async function handleSessions(request, env, path, method) {
  const db = env.DB;
  const parts = path.split('/').filter(Boolean);

  if (method === 'GET' && parts.length === 2) {
    // Clean up stale sessions (older than 30 minutes)
    await db.prepare("DELETE FROM sessions WHERE status = 'active' AND last_ping < datetime('now', '-30 minutes')").run();
    const { results } = await db.prepare("SELECT * FROM sessions WHERE status = 'active' ORDER BY last_ping DESC").all();
    return json({ sessions: results, active_count: results.length });
  }

  if (method === 'POST' && parts.length === 2) {
    const body = await request.json();
    const id = uuid();
    await db.prepare('INSERT INTO sessions (id, project_id, user_name, file_path, cursor_line) VALUES (?, ?, ?, ?, ?)')
      .bind(id, body.project_id || null, body.user_name || 'Anonymous', body.file_path || '', body.cursor_line || 0).run();
    await logEvent(db, 'session_started', id, 'session', body.user_name || 'Anonymous');
    return json({ id, message: 'Session started' }, 201);
  }

  if (parts.length === 3) {
    const sessionId = parts[2];
    if (method === 'PUT') {
      const body = await request.json();
      await db.prepare('UPDATE sessions SET file_path = COALESCE(?, file_path), cursor_line = COALESCE(?, cursor_line), last_ping = datetime("now") WHERE id = ?')
        .bind(body.file_path || null, body.cursor_line || null, sessionId).run();
      return json({ message: 'Session updated' });
    }
    if (method === 'DELETE') {
      await db.prepare("UPDATE sessions SET status = 'closed' WHERE id = ?").bind(sessionId).run();
      return json({ message: 'Session closed' });
    }
  }

  return json({ error: 'Not found' }, 404);
}

// --- DEPLOYMENT ---

async function handleDeploy(request, env) {
  const body = await request.json();
  const { project_id, target, branch } = body;
  if (!project_id) return json({ error: 'project_id required' }, 400);

  const project = await env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(project_id).first();
  if (!project) return json({ error: 'Project not found' }, 404);

  const deployId = uuid();
  await logEvent(env.DB, 'deploy_triggered', deployId, 'deployment', `${project.name} -> ${target || 'production'}`, 'nova', 20);

  return json({
    id: deployId,
    project: project.name,
    target: target || 'production',
    branch: branch || 'main',
    status: 'queued',
    message: 'Deployment queued. Connect CI/CD pipeline for automated builds.',
    pipeline_url: `https://roadcode.blackroad.io/deploys/${deployId}`,
    credits_earned: 20
  });
}

// --- GIT REPOS ---

async function handleRepos(request) {
  const url = new URL(request.url);
  const org = url.searchParams.get('org') || 'BlackRoad-OS-Inc';
  const sort = url.searchParams.get('sort') || 'updated';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '30'), 100);

  try {
    const resp = await fetch(`https://api.github.com/orgs/${org}/repos?per_page=${limit}&sort=${sort}`, {
      headers: { 'User-Agent': 'RoadCode-BlackRoad', 'Accept': 'application/vnd.github.v3+json' }
    });
    if (!resp.ok) return json({ error: 'Failed to fetch repos', status: resp.status }, 502);
    const repos = await resp.json();
    return json({
      org,
      repos: repos.map(r => ({
        name: r.name, description: r.description, language: r.language,
        stars: r.stargazers_count, forks: r.forks_count, open_issues: r.open_issues_count,
        updated: r.updated_at, url: r.html_url, default_branch: r.default_branch,
        topics: r.topics || []
      })),
      count: repos.length
    });
  } catch (e) {
    return json({ error: 'GitHub API error', message: e.message }, 502);
  }
}

// --- TEMPLATES ---

async function handleTemplates(request, env, path, method) {
  const parts = path.split('/').filter(Boolean);

  if (method === 'GET' && parts.length === 2) {
    return json({ templates: TEMPLATES.map(t => ({ id: t.id, name: t.name, language: t.language, framework: t.framework, description: t.description, file_count: t.files.length })) });
  }

  if (method === 'GET' && parts.length === 3) {
    const template = TEMPLATES.find(t => t.id === parts[2]);
    if (!template) return json({ error: 'Template not found' }, 404);
    return json(template);
  }

  // POST /api/templates/:id/create -- scaffold a project from template
  if (method === 'POST' && parts.length === 4 && parts[3] === 'create') {
    const template = TEMPLATES.find(t => t.id === parts[2]);
    if (!template) return json({ error: 'Template not found' }, 404);
    const body = await request.json().catch(() => ({}));
    const projectId = uuid();
    const name = body.name || `${template.name} Project`;

    await env.DB.prepare('INSERT INTO projects (id, name, description, language, framework, owner) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(projectId, name, template.description, template.language, template.framework, body.owner || 'anonymous').run();

    for (const file of template.files) {
      await env.DB.prepare('INSERT INTO files (id, project_id, path, content, language, size) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(uuid(), projectId, file.path, file.content, template.language, file.content.length).run();
    }

    await logEvent(env.DB, 'template_used', projectId, 'project', `${template.name} -> ${name}`, 'blueprint', 15);

    return json({ project_id: projectId, name, template: template.id, files_created: template.files.length, credits_earned: 15 }, 201);
  }

  return json({ error: 'Not found' }, 404);
}

// --- STATS ---

async function handleStats(env) {
  const db = env.DB;
  const [projects, files, snippets, sessions, reviews, events] = await Promise.all([
    db.prepare('SELECT COUNT(*) as count FROM projects').first(),
    db.prepare('SELECT COUNT(*) as count FROM files').first(),
    db.prepare('SELECT COUNT(*) as count FROM snippets').first(),
    db.prepare("SELECT COUNT(*) as count FROM sessions WHERE status = 'active'").first(),
    db.prepare('SELECT COUNT(*) as count FROM reviews').first(),
    db.prepare('SELECT SUM(credits) as total FROM events').first()
  ]);
  return json({
    projects: projects?.count || 0,
    files: files?.count || 0,
    snippets: snippets?.count || 0,
    active_sessions: sessions?.count || 0,
    reviews: reviews?.count || 0,
    total_credits: events?.total || 0,
    agents: Object.values(AGENTS).map(a => ({ name: a.name, role: a.role })),
    templates: TEMPLATES.length
  });
}

// --- FRONTEND ---

function renderFrontend() {
  return html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>RoadCode - Code Collaboration Platform | BlackRoad OS</title>
  <meta name="description" content="AI-powered code collaboration platform. Write, review, deploy, and share code with intelligent agents.">
  <meta property="og:title" content="RoadCode - BlackRoad OS">
  <meta property="og:description" content="AI-powered code collaboration. Write, review, and deploy with Nova, Syntax, and Blueprint.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://roadcode.blackroad.io">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>&#9000;</text></svg>">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0a0a0a; color: #f5f5f5; font-family: 'SF Mono', 'Fira Code', 'JetBrains Mono', monospace; }
    a { color: #a3a3a3; text-decoration: none; transition: color 0.2s; }
    a:hover { color: #ff1d6c; }
    .container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
    header { padding: 40px 0 30px; border-bottom: 1px solid #1a1a1a; }
    .brand { display: flex; align-items: center; gap: 16px; margin-bottom: 8px; }
    .brand-mark { display: flex; gap: 6px; }
    .dot { width: 14px; height: 14px; border-radius: 50%; }
    .dot-pink { background: #ff1d6c; }
    .dot-amber { background: #f5a623; }
    .dot-blue { background: #2979ff; }
    h1 { font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
    .tagline { color: #737373; font-size: 14px; margin-top: 4px; }
    .nav { display: flex; gap: 20px; margin-top: 20px; flex-wrap: wrap; }
    .nav a { color: #737373; font-size: 13px; padding: 6px 0; border-bottom: 2px solid transparent; }
    .nav a:hover, .nav a.active { color: #f5f5f5; border-bottom-color: #ff1d6c; }
    main { padding: 30px 0; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; margin-top: 20px; }
    .card { background: #111; border: 1px solid #1a1a1a; border-radius: 10px; padding: 20px; transition: border-color 0.2s; }
    .card:hover { border-color: #333; }
    .card h3 { font-size: 16px; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; }
    .card p { color: #737373; font-size: 13px; line-height: 1.5; }
    .badge { display: inline-block; font-size: 11px; padding: 2px 8px; border-radius: 12px; background: #1a1a1a; color: #a3a3a3; }
    .badge-pink { background: rgba(255,29,108,0.15); color: #ff1d6c; }
    .badge-blue { background: rgba(41,121,255,0.15); color: #2979ff; }
    .badge-amber { background: rgba(245,166,35,0.15); color: #f5a623; }
    .agents { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-top: 20px; }
    .agent { background: #111; border: 1px solid #1a1a1a; border-radius: 10px; padding: 20px; }
    .agent-name { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
    .agent-role { font-size: 12px; color: #ff1d6c; margin-bottom: 8px; }
    .agent-desc { color: #737373; font-size: 13px; line-height: 1.5; }
    .section-title { font-size: 18px; font-weight: 600; margin-top: 36px; margin-bottom: 4px; }
    .section-sub { color: #737373; font-size: 13px; margin-bottom: 16px; }
    .stat-row { display: flex; gap: 24px; flex-wrap: wrap; margin: 20px 0; }
    .stat { text-align: center; min-width: 80px; }
    .stat-val { font-size: 28px; font-weight: 700; color: #ff1d6c; }
    .stat-label { font-size: 11px; color: #737373; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
    .editor { background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 10px; padding: 20px; margin-top: 20px; }
    .editor-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .editor textarea { width: 100%; background: #111; color: #f5f5f5; border: 1px solid #222; border-radius: 6px; padding: 14px; font-family: inherit; font-size: 13px; min-height: 160px; resize: vertical; }
    .editor textarea:focus { outline: none; border-color: #ff1d6c; }
    .btn { padding: 8px 18px; border-radius: 6px; border: none; cursor: pointer; font-family: inherit; font-size: 13px; transition: all 0.2s; }
    .btn-primary { background: #ff1d6c; color: #fff; }
    .btn-primary:hover { background: #e0175f; }
    .btn-secondary { background: #1a1a1a; color: #a3a3a3; }
    .btn-secondary:hover { background: #252525; color: #f5f5f5; }
    .btn-group { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
    .output { background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 6px; padding: 14px; margin-top: 12px; font-size: 13px; color: #a3a3a3; white-space: pre-wrap; min-height: 40px; display: none; }
    .output.visible { display: block; }
    .repo-list { margin-top: 16px; }
    .repo { border: 1px solid #1a1a1a; border-radius: 8px; padding: 14px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
    .repo:hover { border-color: #333; }
    .repo-name { font-weight: 600; font-size: 14px; }
    .repo-desc { color: #737373; font-size: 12px; margin-top: 2px; }
    .repo-meta { text-align: right; font-size: 12px; color: #525252; }
    .templates-list { margin-top: 16px; }
    .tmpl { background: #111; border: 1px solid #1a1a1a; border-radius: 8px; padding: 16px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
    .tmpl:hover { border-color: #333; }
    .tmpl-info h4 { font-size: 14px; margin-bottom: 4px; }
    .tmpl-info p { font-size: 12px; color: #737373; }
    select { background: #111; color: #f5f5f5; border: 1px solid #222; border-radius: 6px; padding: 6px 10px; font-family: inherit; font-size: 13px; }
    select:focus { outline: none; border-color: #ff1d6c; }
    footer { border-top: 1px solid #1a1a1a; padding: 30px 0; margin-top: 40px; text-align: center; color: #525252; font-size: 12px; }
    @media (max-width: 640px) { .grid, .agents { grid-template-columns: 1fr; } .stat-row { gap: 16px; } }
  </style>
</head>
<body>
<div class="container">
  <header>
    <div class="brand">
      <div class="brand-mark"><div class="dot dot-pink"></div><div class="dot dot-amber"></div><div class="dot dot-blue"></div></div>
      <h1>RoadCode</h1>
    </div>
    <div class="tagline">AI-powered code collaboration. Write, review, deploy, and share with intelligent agents.</div>
    <div class="nav">
      <a href="#" class="active" onclick="showTab('dashboard')">Dashboard</a>
      <a href="#" onclick="showTab('editor')">Code Editor</a>
      <a href="#" onclick="showTab('snippets')">Snippets</a>
      <a href="#" onclick="showTab('repos')">Repositories</a>
      <a href="#" onclick="showTab('templates')">Templates</a>
      <a href="#" onclick="showTab('agents')">AI Agents</a>
    </div>
  </header>

  <main>
    <!-- Dashboard -->
    <div id="tab-dashboard">
      <div class="stat-row" id="stats-row">
        <div class="stat"><div class="stat-val" id="s-projects">--</div><div class="stat-label">Projects</div></div>
        <div class="stat"><div class="stat-val" id="s-files">--</div><div class="stat-label">Files</div></div>
        <div class="stat"><div class="stat-val" id="s-snippets">--</div><div class="stat-label">Snippets</div></div>
        <div class="stat"><div class="stat-val" id="s-reviews">--</div><div class="stat-label">Reviews</div></div>
        <div class="stat"><div class="stat-val" id="s-sessions">--</div><div class="stat-label">Active</div></div>
        <div class="stat"><div class="stat-val" id="s-credits">--</div><div class="stat-label">Credits</div></div>
      </div>
      <h2 class="section-title">Recent Projects</h2>
      <p class="section-sub">Your code projects managed by RoadCode</p>
      <div id="projects-list" class="grid"></div>
    </div>

    <!-- Editor -->
    <div id="tab-editor" style="display:none">
      <h2 class="section-title">Code Workspace</h2>
      <p class="section-sub">Write code, run it, get AI assistance, and submit for review</p>
      <div class="editor">
        <div class="editor-bar">
          <select id="editor-lang">
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="bash">Bash</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="rust">Rust</option>
            <option value="go">Go</option>
          </select>
          <select id="editor-agent">
            <option value="nova">Nova (Architect)</option>
            <option value="syntax">Syntax (Debugger)</option>
            <option value="blueprint">Blueprint (Designer)</option>
          </select>
        </div>
        <textarea id="code-input" spellcheck="false" autocorrect="off" autocapitalize="off" placeholder="// Write your code here...
console.log('Hello, RoadCode!');"
>console.log('Hello, RoadCode!');

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10));</textarea>
        <div class="btn-group">
          <button class="btn btn-primary" onclick="runCode()">Run</button>
          <button class="btn btn-secondary" onclick="askAI()">Ask AI</button>
          <button class="btn btn-secondary" onclick="reviewCode()">Review</button>
          <button class="btn btn-secondary" onclick="saveSnippet()">Save Snippet</button>
        </div>
        <div id="code-output" class="output"></div>
      </div>
    </div>

    <!-- Snippets -->
    <div id="tab-snippets" style="display:none">
      <h2 class="section-title">Snippet Library</h2>
      <p class="section-sub">Save and share reusable code snippets. Search by title, language, or tags.</p>
      <div style="display:flex;gap:8px;margin-top:16px">
        <input type="text" id="snippet-search" placeholder="Search snippets..." style="flex:1;background:#111;color:#f5f5f5;border:1px solid #222;border-radius:6px;padding:8px 12px;font-family:inherit;font-size:13px">
        <button class="btn btn-primary" onclick="searchSnippets()">Search</button>
      </div>
      <div id="snippets-list" class="grid" style="margin-top:16px"></div>
    </div>

    <!-- Repos -->
    <div id="tab-repos" style="display:none">
      <h2 class="section-title">Repositories</h2>
      <p class="section-sub">BlackRoad OS organization repositories on GitHub</p>
      <div id="repos-list" class="repo-list"></div>
    </div>

    <!-- Templates -->
    <div id="tab-templates" style="display:none">
      <h2 class="section-title">Project Templates</h2>
      <p class="section-sub">Start a new project from a pre-built template. Scaffolded by Blueprint.</p>
      <div id="templates-list" class="templates-list"></div>
    </div>

    <!-- Agents -->
    <div id="tab-agents" style="display:none">
      <h2 class="section-title">AI Agents</h2>
      <p class="section-sub">Three specialized agents power every feature of RoadCode</p>
      <div class="agents">
        <div class="agent">
          <div class="agent-name">Nova</div>
          <div class="agent-role">Code Architect</div>
          <div class="agent-desc">Designs system architecture, plans project structure, suggests patterns and best practices. Nova helps you build the right thing the right way.</div>
        </div>
        <div class="agent">
          <div class="agent-name">Syntax</div>
          <div class="agent-role">Debugger</div>
          <div class="agent-desc">Finds bugs, optimizes performance, explains errors clearly, suggests fixes. Syntax reviews every line so you ship clean code.</div>
        </div>
        <div class="agent">
          <div class="agent-name">Blueprint</div>
          <div class="agent-role">Template Designer</div>
          <div class="agent-desc">Creates project templates, scaffolds apps, designs file structures and boilerplate. Blueprint gets you from zero to running in seconds.</div>
        </div>
      </div>
      <h2 class="section-title" style="margin-top:30px">Integration</h2>
      <p class="section-sub">RoadCode connects to the BlackRoad OS ecosystem</p>
      <div class="grid">
        <div class="card">
          <h3>RoadChain</h3>
          <p>Every action is logged to the event chain. Code reviews, deployments, snippet saves -- all tracked with timestamps and agent attribution.</p>
        </div>
        <div class="card">
          <h3>RoadCoin</h3>
          <p>Earn credits for contributions. Create projects (+10), save snippets (+8), submit reviews (+15), deploy (+20). Credits fuel your RoadCode journey.</p>
        </div>
      </div>
    </div>
  </main>

  <footer>
    <p>RoadCode is part of <a href="https://blackroad.io">BlackRoad OS</a></p>
    <p style="margin-top:4px">Built with sovereign AI. Agents: Nova, Syntax, Blueprint.</p>
  </footer>
</div>

<script>
const API = '';

function showTab(name) {
  document.querySelectorAll('[id^="tab-"]').forEach(el => el.style.display = 'none');
  document.getElementById('tab-' + name).style.display = 'block';
  document.querySelectorAll('.nav a').forEach(a => a.classList.remove('active'));
  event.target.classList.add('active');
  if (name === 'repos') loadRepos();
  if (name === 'templates') loadTemplates();
  if (name === 'snippets') loadSnippets();
  if (name === 'dashboard') loadStats();
}

async function loadStats() {
  try {
    const r = await fetch(API + '/api/stats');
    const d = await r.json();
    document.getElementById('s-projects').textContent = d.projects;
    document.getElementById('s-files').textContent = d.files;
    document.getElementById('s-snippets').textContent = d.snippets;
    document.getElementById('s-reviews').textContent = d.reviews;
    document.getElementById('s-sessions').textContent = d.active_sessions;
    document.getElementById('s-credits').textContent = d.total_credits || 0;
    loadProjects();
  } catch(e) { console.error(e); }
}

async function loadProjects() {
  try {
    const r = await fetch(API + '/api/projects');
    const d = await r.json();
    const el = document.getElementById('projects-list');
    if (!d.projects.length) { el.innerHTML = '<div class="card"><p>No projects yet. Use a template or the API to create one.</p></div>'; return; }
    el.innerHTML = d.projects.map(p => '<div class="card"><h3>' + esc(p.name) + ' <span class="badge">' + esc(p.language || '') + '</span></h3><p>' + esc(p.description || 'No description') + '</p><p style="margin-top:8px;font-size:11px;color:#525252">Updated: ' + (p.updated_at || '').slice(0,16) + '</p></div>').join('');
  } catch(e) {}
}

async function loadRepos() {
  const el = document.getElementById('repos-list');
  el.innerHTML = '<p style="color:#737373">Loading repositories...</p>';
  try {
    const r = await fetch(API + '/api/repos');
    const d = await r.json();
    el.innerHTML = d.repos.map(repo => '<div class="repo"><div><div class="repo-name"><a href="' + esc(repo.url) + '" target="_blank">' + esc(repo.name) + '</a></div><div class="repo-desc">' + esc(repo.description || '') + '</div></div><div class="repo-meta"><span class="badge">' + esc(repo.language || '') + '</span></div></div>').join('');
  } catch(e) { el.innerHTML = '<p style="color:#737373">Failed to load repos.</p>'; }
}

async function loadTemplates() {
  try {
    const r = await fetch(API + '/api/templates');
    const d = await r.json();
    document.getElementById('templates-list').innerHTML = d.templates.map(t => '<div class="tmpl"><div class="tmpl-info"><h4>' + esc(t.name) + '</h4><p>' + esc(t.description) + '</p><div style="margin-top:6px"><span class="badge badge-pink">' + esc(t.language) + '</span> <span class="badge">' + t.file_count + ' files</span></div></div><button class="btn btn-primary" onclick="createFromTemplate(\\'' + t.id + '\\')">Create</button></div>').join('');
  } catch(e) {}
}

async function loadSnippets(q) {
  try {
    const url = q ? API + '/api/snippets?q=' + encodeURIComponent(q) : API + '/api/snippets';
    const r = await fetch(url);
    const d = await r.json();
    const el = document.getElementById('snippets-list');
    if (!d.snippets.length) { el.innerHTML = '<div class="card"><p>No snippets found. Save one from the editor.</p></div>'; return; }
    el.innerHTML = d.snippets.map(s => '<div class="card"><h3>' + esc(s.title) + ' <span class="badge badge-blue">' + esc(s.language || '') + '</span></h3><pre style="background:#0d0d0d;padding:10px;border-radius:6px;margin-top:8px;font-size:12px;overflow-x:auto;color:#a3a3a3">' + esc((s.code||'').slice(0,300)) + '</pre><p style="margin-top:6px">' + (s.tags||'').split(',').filter(Boolean).map(t => '<span class="badge badge-amber" style="margin-right:4px">' + esc(t.trim()) + '</span>').join('') + '</p></div>').join('');
  } catch(e) {}
}

function searchSnippets() { loadSnippets(document.getElementById('snippet-search').value); }

async function runCode() {
  const code = document.getElementById('code-input').value;
  const lang = document.getElementById('editor-lang').value;
  const out = document.getElementById('code-output');
  out.className = 'output visible';
  out.textContent = 'Running...';
  try {
    const r = await fetch(API + '/api/execute', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ code, language: lang }) });
    const d = await r.json();
    out.textContent = (d.output || 'No output') + '\\n\\n[exit: ' + d.exit_code + ', ' + d.duration_ms + 'ms, sandbox: ' + d.sandbox + ', +' + d.credits_earned + ' credits]';
  } catch(e) { out.textContent = 'Error: ' + e.message; }
}

async function askAI() {
  const code = document.getElementById('code-input').value;
  const agent = document.getElementById('editor-agent').value;
  const out = document.getElementById('code-output');
  out.className = 'output visible';
  out.textContent = 'Asking ' + agent + '...';
  try {
    const r = await fetch(API + '/api/assist', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ code, question: 'Review this code and suggest improvements', agent }) });
    const d = await r.json();
    out.textContent = d.agent.name + ' (' + d.agent.role + '):\\n\\n' + d.response;
  } catch(e) { out.textContent = 'Error: ' + e.message; }
}

async function reviewCode() {
  const code = document.getElementById('code-input').value;
  const out = document.getElementById('code-output');
  out.className = 'output visible';
  out.textContent = 'Reviewing...';
  try {
    const r = await fetch(API + '/api/reviews', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ code }) });
    const d = await r.json();
    out.textContent = d.review + '\\n\\n[+' + d.credits_earned + ' credits]';
  } catch(e) { out.textContent = 'Error: ' + e.message; }
}

async function saveSnippet() {
  const code = document.getElementById('code-input').value;
  const lang = document.getElementById('editor-lang').value;
  const title = prompt('Snippet title:');
  if (!title) return;
  const tags = prompt('Tags (comma-separated):') || '';
  try {
    const r = await fetch(API + '/api/snippets', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ title, code, language: lang, tags, description: 'Saved from RoadCode editor' }) });
    const d = await r.json();
    const out = document.getElementById('code-output');
    out.className = 'output visible';
    out.textContent = 'Snippet saved: ' + title + ' [+' + d.credits_earned + ' credits]';
  } catch(e) { alert('Error saving snippet'); }
}

async function createFromTemplate(id) {
  const name = prompt('Project name:');
  if (!name) return;
  try {
    const r = await fetch(API + '/api/templates/' + id + '/create', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name }) });
    const d = await r.json();
    alert('Project "' + name + '" created with ' + d.files_created + ' files! (+' + d.credits_earned + ' credits)');
    showTab('dashboard');
  } catch(e) { alert('Error creating project'); }
}

function esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

// Init
loadStats();
</script>
</body>
</html>`);
}

// --- DIFF VIEWER ---

async function handleDiff(request, env) {
  const body = await request.json();
  const { old_text, new_text, file_id, version_a, version_b } = body;

  let textA = old_text || '';
  let textB = new_text || '';

  // If file_id and versions provided, load from file_versions table
  if (file_id && version_a !== undefined && version_b !== undefined) {
    const va = await env.DB.prepare('SELECT content FROM file_versions WHERE file_id = ? AND version = ?').bind(file_id, version_a).first();
    const vb = await env.DB.prepare('SELECT content FROM file_versions WHERE file_id = ? AND version = ?').bind(file_id, version_b).first();
    if (!va || !vb) return json({ error: 'Version not found' }, 404);
    textA = va.content || '';
    textB = vb.content || '';
  }

  if (!textA && !textB) return json({ error: 'Provide old_text/new_text or file_id with version_a/version_b' }, 400);

  const linesA = textA.split('\n');
  const linesB = textB.split('\n');
  const maxLen = Math.max(linesA.length, linesB.length);
  const hunks = [];
  let additions = 0, deletions = 0, modifications = 0;

  // Simple line-by-line diff
  for (let i = 0; i < maxLen; i++) {
    const a = i < linesA.length ? linesA[i] : undefined;
    const b = i < linesB.length ? linesB[i] : undefined;
    if (a === undefined) {
      hunks.push({ line: i + 1, type: 'addition', content: b });
      additions++;
    } else if (b === undefined) {
      hunks.push({ line: i + 1, type: 'deletion', content: a });
      deletions++;
    } else if (a !== b) {
      hunks.push({ line: i + 1, type: 'modification', old_content: a, new_content: b });
      modifications++;
    }
  }

  await logEvent(env.DB, 'diff_viewed', uuid(), 'diff', `${linesA.length} vs ${linesB.length} lines`, 'syntax', 2);

  return json({
    summary: { additions, deletions, modifications, unchanged: maxLen - additions - deletions - modifications },
    total_lines: { old: linesA.length, new: linesB.length },
    hunks,
    credits_earned: 2
  });
}

// --- CODE FORMATTING ---

function formatJavaScript(code) {
  let indent = 0;
  const lines = code.split('\n');
  const formatted = [];
  for (const rawLine of lines) {
    let line = rawLine.trim();
    if (!line) { formatted.push(''); continue; }
    if (line.startsWith('}') || line.startsWith(']') || line.startsWith(')')) indent = Math.max(0, indent - 1);
    formatted.push('  '.repeat(indent) + line);
    const opens = (line.match(/[{(\[]/g) || []).length;
    const closes = (line.match(/[})\]]/g) || []).length;
    indent += opens - closes;
    if (indent < 0) indent = 0;
  }
  return formatted.join('\n');
}

function formatPython(code) {
  let indent = 0;
  const lines = code.split('\n');
  const formatted = [];
  const deindentKeys = ['return', 'break', 'continue', 'pass', 'raise', 'else:', 'elif ', 'except:', 'except ', 'finally:', 'elif:'];
  for (const rawLine of lines) {
    let line = rawLine.trim();
    if (!line) { formatted.push(''); continue; }
    if (deindentKeys.some(k => line.startsWith(k)) && indent > 0) indent = Math.max(0, indent - 1);
    formatted.push('    '.repeat(indent) + line);
    if (line.endsWith(':') && !line.startsWith('#')) indent++;
  }
  return formatted.join('\n');
}

function formatJSON(code) {
  try {
    return JSON.stringify(JSON.parse(code), null, 2);
  } catch (e) {
    return code;
  }
}

function formatHTML(code) {
  const selfClosing = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr']);
  let indent = 0;
  const lines = code.replace(/>\s*</g, '>\n<').split('\n');
  const formatted = [];
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const isClosing = line.startsWith('</');
    const tagMatch = line.match(/^<\/?([a-zA-Z][a-zA-Z0-9]*)/);
    const tagName = tagMatch ? tagMatch[1].toLowerCase() : '';
    const isSelfClose = selfClosing.has(tagName) || line.endsWith('/>');
    if (isClosing) indent = Math.max(0, indent - 1);
    formatted.push('  '.repeat(indent) + line);
    if (!isClosing && !isSelfClose && line.startsWith('<') && !line.startsWith('<!')) indent++;
  }
  return formatted.join('\n');
}

function formatCSS(code) {
  let indent = 0;
  const lines = code.replace(/\{/g, ' {\n').replace(/\}/g, '\n}\n').replace(/;/g, ';\n').split('\n');
  const formatted = [];
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line === '}') indent = Math.max(0, indent - 1);
    formatted.push('  '.repeat(indent) + line);
    if (line.endsWith('{')) indent++;
  }
  return formatted.join('\n');
}

async function handleFormat(request, env) {
  const body = await request.json();
  const { code, language } = body;
  if (!code) return json({ error: 'No code provided' }, 400);

  let formatted;
  let lang = (language || 'javascript').toLowerCase();
  const warnings = [];

  switch (lang) {
    case 'javascript':
    case 'js':
    case 'typescript':
    case 'ts':
      formatted = formatJavaScript(code);
      if (code.includes('var ')) warnings.push('Consider using const/let instead of var');
      if (code.includes('  \t') || code.includes('\t  ')) warnings.push('Mixed tabs and spaces detected');
      break;
    case 'python':
    case 'py':
      formatted = formatPython(code);
      if (code.includes('\t')) warnings.push('Tabs detected -- PEP 8 recommends 4 spaces');
      break;
    case 'json':
      formatted = formatJSON(code);
      break;
    case 'html':
      formatted = formatHTML(code);
      break;
    case 'css':
      formatted = formatCSS(code);
      break;
    default:
      formatted = formatJavaScript(code);
      warnings.push(`No specific formatter for ${lang}, used JavaScript formatter`);
  }

  const changed = formatted !== code;
  await logEvent(env.DB, 'code_formatted', uuid(), 'format', `${lang}: ${code.length} chars`, 'blueprint', 2);

  return json({
    formatted,
    language: lang,
    changed,
    original_lines: code.split('\n').length,
    formatted_lines: formatted.split('\n').length,
    warnings,
    credits_earned: 2
  });
}

// --- DEPENDENCY SCANNER ---

async function handleDeps(request, env) {
  const body = await request.json();
  const { code, language, project_id } = body;

  let sources = [];
  if (project_id) {
    const { results } = await env.DB.prepare('SELECT path, content, language FROM files WHERE project_id = ?').bind(project_id).all();
    sources = results.map(f => ({ path: f.path, content: f.content || '', language: f.language }));
  } else if (code) {
    sources = [{ path: 'input', content: code, language: language || 'javascript' }];
  } else {
    return json({ error: 'Provide code or project_id' }, 400);
  }

  const dependencies = [];
  const depMap = {};

  for (const src of sources) {
    const lang = (src.language || 'javascript').toLowerCase();
    const lines = (src.content || '').split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      let dep = null;

      // JavaScript/TypeScript imports
      if (lang === 'javascript' || lang === 'js' || lang === 'typescript' || lang === 'ts') {
        const esMatch = trimmed.match(/import\s+.*?from\s+['"](.*?)['"]/);
        const reqMatch = trimmed.match(/require\s*\(\s*['"](.*?)['"]\s*\)/);
        const dynMatch = trimmed.match(/import\s*\(\s*['"](.*?)['"]\s*\)/);
        if (esMatch) dep = { name: esMatch[1], type: 'es_import' };
        else if (reqMatch) dep = { name: reqMatch[1], type: 'commonjs_require' };
        else if (dynMatch) dep = { name: dynMatch[1], type: 'dynamic_import' };
      }

      // Python imports
      if (lang === 'python' || lang === 'py') {
        const pyImport = trimmed.match(/^import\s+(\S+)/);
        const pyFrom = trimmed.match(/^from\s+(\S+)\s+import/);
        if (pyImport) dep = { name: pyImport[1], type: 'import' };
        else if (pyFrom) dep = { name: pyFrom[1], type: 'from_import' };
      }

      // Go imports
      if (lang === 'go') {
        const goImport = trimmed.match(/^\s*"(.+?)"/);
        if (goImport) dep = { name: goImport[1], type: 'go_import' };
      }

      // Rust use
      if (lang === 'rust') {
        const rustUse = trimmed.match(/^use\s+(\S+)/);
        if (rustUse) dep = { name: rustUse[1].replace(/;$/, ''), type: 'use' };
      }

      if (dep) {
        dep.source_file = src.path;
        dep.is_local = dep.name.startsWith('.') || dep.name.startsWith('/') || dep.name.startsWith('~');
        dep.is_stdlib = !dep.is_local && !dep.name.includes('/') && !dep.name.startsWith('@');
        dependencies.push(dep);
        if (!depMap[dep.name]) depMap[dep.name] = [];
        depMap[dep.name].push(src.path);
      }
    }
  }

  // Check for package.json in project
  let packageDeps = null;
  if (project_id) {
    const pkgFile = await env.DB.prepare("SELECT content FROM files WHERE project_id = ? AND path = 'package.json'").bind(project_id).first();
    if (pkgFile && pkgFile.content) {
      try {
        const pkg = JSON.parse(pkgFile.content);
        packageDeps = {
          dependencies: pkg.dependencies || {},
          devDependencies: pkg.devDependencies || {},
          peerDependencies: pkg.peerDependencies || {}
        };
      } catch (e) { /* invalid package.json */ }
    }
  }

  const external = dependencies.filter(d => !d.is_local && !d.is_stdlib);
  const local = dependencies.filter(d => d.is_local);
  const stdlib = dependencies.filter(d => d.is_stdlib);

  await logEvent(env.DB, 'deps_scanned', uuid(), 'deps', `${dependencies.length} deps found`, 'syntax', 5);

  return json({
    total: dependencies.length,
    external: { count: external.length, items: external },
    local: { count: local.length, items: local },
    stdlib: { count: stdlib.length, items: stdlib },
    dependency_map: depMap,
    package_json: packageDeps,
    files_scanned: sources.length,
    credits_earned: 5
  });
}

// --- CODE METRICS ---

async function handleMetrics(request, env) {
  const body = await request.json();
  const { code, language, project_id } = body;

  let sources = [];
  if (project_id) {
    const { results } = await env.DB.prepare('SELECT path, content, language FROM files WHERE project_id = ?').bind(project_id).all();
    sources = results.map(f => ({ path: f.path, content: f.content || '', language: f.language }));
  } else if (code) {
    sources = [{ path: 'input', content: code, language: language || 'javascript' }];
  } else {
    return json({ error: 'Provide code or project_id' }, 400);
  }

  const fileMetrics = [];
  let totalLines = 0, totalCode = 0, totalComments = 0, totalBlank = 0, totalFunctions = 0, totalComplexity = 0;

  for (const src of sources) {
    const lines = (src.content || '').split('\n');
    const lang = (src.language || 'javascript').toLowerCase();
    let codeLines = 0, commentLines = 0, blankLines = 0, functions = 0, complexity = 1;
    let inBlockComment = false;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) { blankLines++; continue; }

      // Block comments
      if (lang === 'javascript' || lang === 'js' || lang === 'css' || lang === 'go' || lang === 'rust') {
        if (inBlockComment) {
          commentLines++;
          if (line.includes('*/')) inBlockComment = false;
          continue;
        }
        if (line.startsWith('/*')) { commentLines++; inBlockComment = !line.includes('*/'); continue; }
        if (line.startsWith('//')) { commentLines++; continue; }
      }
      if (lang === 'python' || lang === 'py') {
        if (line.startsWith('#')) { commentLines++; continue; }
        if (line.startsWith('"""') || line.startsWith("'''")) {
          commentLines++;
          if (!inBlockComment && (line.endsWith('"""') || line.endsWith("'''")) && line.length > 3) continue;
          inBlockComment = !inBlockComment;
          continue;
        }
        if (inBlockComment) { commentLines++; continue; }
      }
      if (lang === 'html') {
        if (line.startsWith('<!--')) { commentLines++; inBlockComment = !line.includes('-->'); continue; }
        if (inBlockComment) { commentLines++; if (line.includes('-->')) inBlockComment = false; continue; }
      }

      codeLines++;

      // Function detection
      if (lang === 'javascript' || lang === 'js' || lang === 'typescript' || lang === 'ts') {
        if (line.match(/function\s+\w+|=>\s*\{|\.prototype\.\w+\s*=|class\s+\w+/)) functions++;
        if (line.match(/\b(if|else if|for|while|switch|case|catch|\?\?|\|\||&&|ternary)\b/) || line.includes('?')) complexity++;
      }
      if (lang === 'python' || lang === 'py') {
        if (line.match(/^\s*(def|class)\s+/)) functions++;
        if (line.match(/\b(if|elif|for|while|except|and|or)\b/)) complexity++;
      }
      if (lang === 'go') {
        if (line.match(/^func\s/)) functions++;
        if (line.match(/\b(if|for|switch|case|select)\b/)) complexity++;
      }
      if (lang === 'rust') {
        if (line.match(/^\s*(pub\s+)?fn\s/)) functions++;
        if (line.match(/\b(if|for|while|match|loop)\b/)) complexity++;
      }
    }

    const total = lines.length;
    const commentRatio = total > 0 ? (commentLines / total * 100).toFixed(1) : '0.0';
    const avgFuncLength = functions > 0 ? Math.round(codeLines / functions) : codeLines;

    const m = {
      file: src.path,
      language: lang,
      lines: { total, code: codeLines, comments: commentLines, blank: blankLines },
      functions,
      cyclomatic_complexity: complexity,
      comment_ratio: parseFloat(commentRatio),
      avg_function_length: avgFuncLength,
      maintainability_index: Math.max(0, Math.min(100, Math.round(171 - 5.2 * Math.log(Math.max(1, complexity)) - 0.23 * codeLines - 16.2 * Math.log(Math.max(1, total)) + 50 * Math.sin(Math.sqrt(2.4 * parseFloat(commentRatio)))))),
    };

    fileMetrics.push(m);
    totalLines += total;
    totalCode += codeLines;
    totalComments += commentLines;
    totalBlank += blankLines;
    totalFunctions += functions;
    totalComplexity += complexity;
  }

  await logEvent(env.DB, 'metrics_analyzed', uuid(), 'metrics', `${sources.length} files, ${totalLines} lines`, 'syntax', 5);

  return json({
    summary: {
      files: sources.length,
      total_lines: totalLines,
      code_lines: totalCode,
      comment_lines: totalComments,
      blank_lines: totalBlank,
      functions: totalFunctions,
      total_complexity: totalComplexity,
      avg_complexity: sources.length > 0 ? (totalComplexity / sources.length).toFixed(1) : 0,
      comment_ratio: totalLines > 0 ? (totalComments / totalLines * 100).toFixed(1) + '%' : '0%'
    },
    files: fileMetrics,
    credits_earned: 5
  });
}

// --- COLLABORATIVE EDITING ---

async function handleCollab(request, env, path, method) {
  const db = env.DB;
  const parts = path.split('/').filter(Boolean);

  // GET /api/collab -- list active collab sessions
  if (method === 'GET' && parts.length === 2) {
    await db.prepare("DELETE FROM collab_sessions WHERE status = 'active' AND updated_at < datetime('now', '-60 minutes')").run();
    const { results } = await db.prepare("SELECT * FROM collab_sessions WHERE status = 'active' ORDER BY updated_at DESC").all();
    return json({ sessions: results, active_count: results.length });
  }

  // POST /api/collab -- create a new collab session
  if (method === 'POST' && parts.length === 2) {
    const body = await request.json();
    const id = uuid();
    await db.prepare('INSERT INTO collab_sessions (id, project_id, file_path, created_by, participants) VALUES (?, ?, ?, ?, ?)')
      .bind(id, body.project_id || null, body.file_path || '', body.user_name || 'Anonymous', JSON.stringify([body.user_name || 'Anonymous'])).run();

    // Create initial cursor for the creator
    const cursorId = uuid();
    const colors = ['#ff1d6c', '#2979ff', '#f5a623', '#9c27b0', '#4caf50', '#ff5722', '#00bcd4', '#e91e63'];
    await db.prepare('INSERT INTO collab_cursors (id, session_id, user_name, line, column_num, color) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(cursorId, id, body.user_name || 'Anonymous', 0, 0, colors[0]).run();

    await logEvent(db, 'collab_started', id, 'collab', body.user_name || 'Anonymous', 'nova', 5);
    return json({ session_id: id, cursor_id: cursorId, message: 'Collaboration session started', credits_earned: 5 }, 201);
  }

  if (parts.length >= 3) {
    const sessionId = parts[2];

    // GET /api/collab/:id -- get session state with all cursors
    if (method === 'GET' && parts.length === 3) {
      const session = await db.prepare('SELECT * FROM collab_sessions WHERE id = ?').bind(sessionId).first();
      if (!session) return json({ error: 'Session not found' }, 404);
      const { results: cursors } = await db.prepare('SELECT * FROM collab_cursors WHERE session_id = ? ORDER BY updated_at DESC').bind(sessionId).all();
      return json({ ...session, participants_detail: cursors });
    }

    // POST /api/collab/:id/join -- join a session
    if (method === 'POST' && parts.length === 4 && parts[3] === 'join') {
      const body = await request.json();
      const userName = body.user_name || 'Anonymous';
      const session = await db.prepare('SELECT * FROM collab_sessions WHERE id = ?').bind(sessionId).first();
      if (!session) return json({ error: 'Session not found' }, 404);

      const participants = JSON.parse(session.participants || '[]');
      if (!participants.includes(userName)) participants.push(userName);
      await db.prepare('UPDATE collab_sessions SET participants = ?, updated_at = datetime("now") WHERE id = ?')
        .bind(JSON.stringify(participants), sessionId).run();

      const cursorId = uuid();
      const colors = ['#ff1d6c', '#2979ff', '#f5a623', '#9c27b0', '#4caf50', '#ff5722', '#00bcd4', '#e91e63'];
      await db.prepare('INSERT INTO collab_cursors (id, session_id, user_name, line, column_num, color) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(cursorId, sessionId, userName, 0, 0, colors[participants.length % colors.length]).run();

      await logEvent(db, 'collab_joined', sessionId, 'collab', userName, 'nova', 2);
      return json({ session_id: sessionId, cursor_id: cursorId, participants, message: `${userName} joined`, credits_earned: 2 });
    }

    // PUT /api/collab/:id/cursor -- update cursor position and typing status
    if (method === 'PUT' && parts.length === 4 && parts[3] === 'cursor') {
      const body = await request.json();
      await db.prepare('UPDATE collab_cursors SET line = ?, column_num = ?, is_typing = ?, updated_at = datetime("now") WHERE session_id = ? AND user_name = ?')
        .bind(body.line || 0, body.column || 0, body.is_typing ? 1 : 0, sessionId, body.user_name || 'Anonymous').run();
      await db.prepare('UPDATE collab_sessions SET updated_at = datetime("now") WHERE id = ?').bind(sessionId).run();

      const { results: cursors } = await db.prepare('SELECT user_name, line, column_num, is_typing, color FROM collab_cursors WHERE session_id = ?').bind(sessionId).all();
      return json({ cursors });
    }

    // DELETE /api/collab/:id -- close session
    if (method === 'DELETE' && parts.length === 3) {
      await db.prepare("UPDATE collab_sessions SET status = 'closed', updated_at = datetime('now') WHERE id = ?").bind(sessionId).run();
      await db.prepare('DELETE FROM collab_cursors WHERE session_id = ?').bind(sessionId).run();
      await logEvent(db, 'collab_ended', sessionId, 'collab', 'session closed');
      return json({ message: 'Collaboration session closed' });
    }
  }

  return json({ error: 'Not found' }, 404);
}

// --- CODE SEARCH ---

async function handleCodeSearch(request, env) {
  const url = new URL(request.url);
  const method = request.method;
  let q, language, project_id, use_regex, limit;

  if (method === 'POST') {
    const body = await request.json();
    q = body.q || body.query;
    language = body.language;
    project_id = body.project_id;
    use_regex = body.regex;
    limit = body.limit;
  } else {
    q = url.searchParams.get('q');
    language = url.searchParams.get('language');
    project_id = url.searchParams.get('project_id');
    use_regex = url.searchParams.get('regex') === 'true';
    limit = url.searchParams.get('limit');
  }

  if (!q) return json({ error: 'Query parameter q is required' }, 400);
  limit = Math.min(parseInt(limit || '50'), 200);

  const results = [];

  // Search in files
  let fileQuery = 'SELECT f.id, f.path, f.content, f.language, f.project_id, p.name as project_name FROM files f LEFT JOIN projects p ON f.project_id = p.id WHERE 1=1';
  const fileBinds = [];
  if (project_id) { fileQuery += ' AND f.project_id = ?'; fileBinds.push(project_id); }
  if (language) { fileQuery += ' AND f.language = ?'; fileBinds.push(language); }
  fileQuery += ' ORDER BY f.updated_at DESC LIMIT 500';

  const stmt = env.DB.prepare(fileQuery);
  const { results: files } = fileBinds.length ? await stmt.bind(...fileBinds).all() : await stmt.all();

  let regex;
  if (use_regex) {
    try { regex = new RegExp(q, 'gim'); } catch (e) { return json({ error: 'Invalid regex: ' + e.message }, 400); }
  }

  for (const file of files) {
    if (!file.content) continue;
    const lines = file.content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = use_regex ? regex.test(line) : line.toLowerCase().includes(q.toLowerCase());
      if (use_regex) regex.lastIndex = 0; // reset regex state
      if (match) {
        results.push({
          file_id: file.id,
          file_path: file.path,
          project_id: file.project_id,
          project_name: file.project_name,
          language: file.language,
          line_number: i + 1,
          line_content: line.trim(),
          context: {
            before: i > 0 ? lines[i - 1].trim() : null,
            after: i < lines.length - 1 ? lines[i + 1].trim() : null
          }
        });
        if (results.length >= limit) break;
      }
    }
    if (results.length >= limit) break;
  }

  // Also search snippets
  const snippetResults = [];
  let snipQuery = 'SELECT id, title, code, language, tags FROM snippets WHERE 1=1';
  const snipBinds = [];
  if (language) { snipQuery += ' AND language = ?'; snipBinds.push(language); }
  snipQuery += ' ORDER BY stars DESC LIMIT 200';
  const snipStmt = env.DB.prepare(snipQuery);
  const { results: snippets } = snipBinds.length ? await snipStmt.bind(...snipBinds).all() : await snipStmt.all();

  for (const snip of snippets) {
    const content = (snip.code || '') + ' ' + (snip.title || '');
    const match = use_regex ? regex && regex.test(content) : content.toLowerCase().includes(q.toLowerCase());
    if (use_regex && regex) regex.lastIndex = 0;
    if (match) {
      snippetResults.push({
        snippet_id: snip.id,
        title: snip.title,
        language: snip.language,
        tags: snip.tags,
        preview: (snip.code || '').slice(0, 200)
      });
    }
  }

  await logEvent(env.DB, 'code_searched', uuid(), 'search', `"${q}" -> ${results.length} results`, 'nova', 1);

  return json({
    query: q,
    regex: !!use_regex,
    file_matches: { count: results.length, results },
    snippet_matches: { count: snippetResults.length, results: snippetResults },
    total: results.length + snippetResults.length,
    credits_earned: 1
  });
}

// --- BUILD SYSTEM ---

async function handleBuild(request, env, path, method) {
  const db = env.DB;
  const parts = path.split('/').filter(Boolean);

  // GET /api/build -- list pipelines
  if (method === 'GET' && parts.length === 2) {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('project_id');
    let query = 'SELECT * FROM build_pipelines ORDER BY created_at DESC LIMIT 50';
    const binds = [];
    if (projectId) { query = 'SELECT * FROM build_pipelines WHERE project_id = ? ORDER BY created_at DESC LIMIT 50'; binds.push(projectId); }
    const stmt = db.prepare(query);
    const { results } = binds.length ? await stmt.bind(...binds).all() : await stmt.all();
    return json({ pipelines: results, count: results.length });
  }

  // POST /api/build -- create a pipeline
  if (method === 'POST' && parts.length === 2) {
    const body = await request.json();
    const id = uuid();
    const defaultSteps = [
      { name: 'lint', command: 'eslint .', status: 'pending' },
      { name: 'test', command: 'npm test', status: 'pending' },
      { name: 'bundle', command: 'npm run build', status: 'pending' },
      { name: 'deploy', command: 'wrangler deploy', status: 'pending' }
    ];
    const steps = body.steps || defaultSteps;
    await db.prepare('INSERT INTO build_pipelines (id, project_id, name, steps) VALUES (?, ?, ?, ?)')
      .bind(id, body.project_id || null, body.name || 'default', JSON.stringify(steps)).run();
    await logEvent(db, 'pipeline_created', id, 'build', body.name || 'default', 'nova', 10);
    return json({ id, name: body.name || 'default', steps, message: 'Pipeline created', credits_earned: 10 }, 201);
  }

  if (parts.length >= 3) {
    const pipelineId = parts[2];

    // GET /api/build/:id -- get pipeline details
    if (method === 'GET' && parts.length === 3) {
      const pipeline = await db.prepare('SELECT * FROM build_pipelines WHERE id = ?').bind(pipelineId).first();
      if (!pipeline) return json({ error: 'Pipeline not found' }, 404);
      const { results: runs } = await db.prepare('SELECT * FROM build_runs WHERE pipeline_id = ? ORDER BY started_at DESC LIMIT 20').bind(pipelineId).all();
      pipeline.steps = JSON.parse(pipeline.steps || '[]');
      return json({ ...pipeline, runs });
    }

    // POST /api/build/:id/run -- trigger a build run
    if (method === 'POST' && parts.length === 4 && parts[3] === 'run') {
      const pipeline = await db.prepare('SELECT * FROM build_pipelines WHERE id = ?').bind(pipelineId).first();
      if (!pipeline) return json({ error: 'Pipeline not found' }, 404);

      const runId = uuid();
      const steps = JSON.parse(pipeline.steps || '[]');
      const startTime = Date.now();
      const log = [];

      // Simulate build execution
      for (const step of steps) {
        log.push(`[${new Date().toISOString()}] Starting: ${step.name}`);
        log.push(`  $ ${step.command}`);
        const duration = Math.floor(Math.random() * 2000) + 500;
        const success = Math.random() > 0.1; // 90% success rate
        if (success) {
          step.status = 'passed';
          log.push(`  [PASS] ${step.name} completed in ${duration}ms`);
        } else {
          step.status = 'failed';
          log.push(`  [FAIL] ${step.name} failed after ${duration}ms`);
          log.push(`  Error: Process exited with code 1`);
          break;
        }
      }

      const allPassed = steps.every(s => s.status === 'passed');
      const totalDuration = Date.now() - startTime;
      const status = allPassed ? 'passed' : 'failed';

      await db.prepare('INSERT INTO build_runs (id, pipeline_id, project_id, status, log, finished_at, duration_ms) VALUES (?, ?, ?, ?, ?, datetime("now"), ?)')
        .bind(runId, pipelineId, pipeline.project_id, status, log.join('\n'), totalDuration).run();
      await db.prepare('UPDATE build_pipelines SET status = ?, last_run = datetime("now"), last_log = ? WHERE id = ?')
        .bind(status, log.join('\n'), pipelineId).run();

      await logEvent(db, 'build_run', runId, 'build', `${pipeline.name}: ${status}`, 'nova', allPassed ? 15 : 0);

      return json({
        run_id: runId,
        pipeline: pipeline.name,
        status,
        steps,
        log: log.join('\n'),
        duration_ms: totalDuration,
        credits_earned: allPassed ? 15 : 0
      });
    }

    // GET /api/build/:id/logs -- get build logs
    if (method === 'GET' && parts.length === 4 && parts[3] === 'logs') {
      const { results: runs } = await db.prepare('SELECT * FROM build_runs WHERE pipeline_id = ? ORDER BY started_at DESC LIMIT 10').bind(pipelineId).all();
      return json({ pipeline_id: pipelineId, runs });
    }

    // DELETE /api/build/:id -- delete pipeline
    if (method === 'DELETE' && parts.length === 3) {
      await db.prepare('DELETE FROM build_runs WHERE pipeline_id = ?').bind(pipelineId).run();
      await db.prepare('DELETE FROM build_pipelines WHERE id = ?').bind(pipelineId).run();
      return json({ message: 'Pipeline deleted' });
    }
  }

  return json({ error: 'Not found' }, 404);
}

// --- PLUGIN SYSTEM ---

const DEFAULT_PLUGINS = [
  { id: 'theme-midnight', name: 'Midnight Theme', type: 'theme', description: 'Deep dark theme with BlackRoad brand accent colors', version: '1.0.0', author: 'blackroad', config: '{"primary":"#ff1d6c","background":"#0a0a0a","surface":"#111111"}' },
  { id: 'theme-aurora', name: 'Aurora Theme', type: 'theme', description: 'Northern lights inspired theme with electric blues and greens', version: '1.0.0', author: 'blackroad', config: '{"primary":"#2979ff","background":"#0d1117","surface":"#161b22"}' },
  { id: 'linter-eslint', name: 'ESLint', type: 'linter', description: 'JavaScript/TypeScript linter with BlackRoad preset rules', version: '8.57.0', author: 'eslint', config: '{"extends":"recommended","rules":{"no-var":"error","prefer-const":"error"}}' },
  { id: 'linter-pylint', name: 'Pylint', type: 'linter', description: 'Python code linter for style and error detection', version: '3.0.0', author: 'pylint', config: '{"max-line-length":120}' },
  { id: 'formatter-prettier', name: 'Prettier', type: 'formatter', description: 'Opinionated code formatter for JS, CSS, HTML, JSON, and more', version: '3.2.0', author: 'prettier', config: '{"tabWidth":2,"singleQuote":true,"semi":true}' },
  { id: 'ai-nova', name: 'Nova AI Assistant', type: 'ai', description: 'AI-powered code architect -- get architecture advice inline', version: '2.0.0', author: 'blackroad', config: '{"model":"llama-3.1-8b","trigger":"@nova"}' },
  { id: 'ai-syntax', name: 'Syntax AI Debugger', type: 'ai', description: 'AI-powered bug finder and performance optimizer', version: '2.0.0', author: 'blackroad', config: '{"model":"llama-3.1-8b","trigger":"@syntax"}' },
  { id: 'git-integration', name: 'Git Integration', type: 'extension', description: 'Git status, diff, commit, and branch management in the editor', version: '1.2.0', author: 'blackroad', config: '{"auto_stage":false,"show_inline_blame":true}' },
  { id: 'minimap', name: 'Minimap', type: 'extension', description: 'Code minimap for quick navigation through large files', version: '1.0.0', author: 'blackroad', config: '{"width":80,"enabled":true}' },
  { id: 'bracket-colorizer', name: 'Bracket Colorizer', type: 'extension', description: 'Colorize matching brackets for easier code reading', version: '1.1.0', author: 'blackroad', config: '{"colors":["#ff1d6c","#2979ff","#f5a623","#9c27b0"]}' }
];

async function handlePlugins(request, env, path, method) {
  const db = env.DB;
  const parts = path.split('/').filter(Boolean);

  // GET /api/plugins -- list available plugins
  if (method === 'GET' && parts.length === 2) {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const search = url.searchParams.get('q');

    // Check DB for plugins, seed if empty
    let { results } = await db.prepare('SELECT * FROM plugins ORDER BY install_count DESC').all();
    if (!results.length) {
      // Seed default plugins
      for (const p of DEFAULT_PLUGINS) {
        await db.prepare('INSERT INTO plugins (id, name, type, description, version, author, config) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .bind(p.id, p.name, p.type, p.description, p.version, p.author, p.config).run();
      }
      const res = await db.prepare('SELECT * FROM plugins ORDER BY install_count DESC').all();
      results = res.results;
    }

    if (type) results = results.filter(p => p.type === type);
    if (search) results = results.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.description || '').toLowerCase().includes(search.toLowerCase()));

    return json({ plugins: results, count: results.length, types: ['theme', 'linter', 'formatter', 'ai', 'extension'] });
  }

  // POST /api/plugins -- create a custom plugin
  if (method === 'POST' && parts.length === 2) {
    const body = await request.json();
    const id = body.id || uuid();
    await db.prepare('INSERT INTO plugins (id, name, type, description, version, author, config) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(id, body.name || 'Custom Plugin', body.type || 'extension', body.description || '', body.version || '1.0.0', body.author || 'anonymous', JSON.stringify(body.config || {})).run();
    await logEvent(db, 'plugin_created', id, 'plugin', body.name, 'blueprint', 10);
    return json({ id, message: 'Plugin created', credits_earned: 10 }, 201);
  }

  if (parts.length >= 3) {
    const pluginId = parts[2];

    // GET /api/plugins/:id -- get plugin details
    if (method === 'GET' && parts.length === 3) {
      const plugin = await db.prepare('SELECT * FROM plugins WHERE id = ?').bind(pluginId).first();
      if (!plugin) return json({ error: 'Plugin not found' }, 404);
      plugin.config = JSON.parse(plugin.config || '{}');
      const { results: installs } = await db.prepare('SELECT COUNT(*) as count FROM installed_plugins WHERE plugin_id = ?').bind(pluginId).all();
      plugin.install_count = installs[0]?.count || 0;
      return json(plugin);
    }

    // POST /api/plugins/:id/install -- install a plugin
    if (method === 'POST' && parts.length === 4 && parts[3] === 'install') {
      const body = await request.json().catch(() => ({}));
      const userName = body.user_name || 'anonymous';

      const existing = await db.prepare('SELECT * FROM installed_plugins WHERE plugin_id = ? AND user_name = ?').bind(pluginId, userName).first();
      if (existing) return json({ error: 'Plugin already installed' }, 409);

      const instId = uuid();
      await db.prepare('INSERT INTO installed_plugins (id, plugin_id, user_name, config) VALUES (?, ?, ?, ?)')
        .bind(instId, pluginId, userName, JSON.stringify(body.config || {})).run();
      await db.prepare('UPDATE plugins SET install_count = install_count + 1 WHERE id = ?').bind(pluginId).run();
      await logEvent(db, 'plugin_installed', pluginId, 'plugin', `${userName} installed ${pluginId}`, 'blueprint', 3);
      return json({ installation_id: instId, message: 'Plugin installed', credits_earned: 3 });
    }

    // DELETE /api/plugins/:id/uninstall -- uninstall a plugin
    if (method === 'DELETE' && parts.length === 4 && parts[3] === 'uninstall') {
      const url = new URL(request.url);
      const userName = url.searchParams.get('user') || 'anonymous';
      await db.prepare('DELETE FROM installed_plugins WHERE plugin_id = ? AND user_name = ?').bind(pluginId, userName).run();
      await db.prepare('UPDATE plugins SET install_count = MAX(0, install_count - 1) WHERE id = ?').bind(pluginId).run();
      return json({ message: 'Plugin uninstalled' });
    }

    // GET /api/plugins/:id/installed -- list users who installed this plugin
    if (method === 'GET' && parts.length === 4 && parts[3] === 'installed') {
      const { results } = await db.prepare('SELECT * FROM installed_plugins WHERE plugin_id = ? ORDER BY installed_at DESC').bind(pluginId).all();
      return json({ installations: results, count: results.length });
    }
  }

  return json({ error: 'Not found' }, 404);
}

// --- ROUTER ---

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    // Rate limit check
    const rlBlock = checkRL(request.headers.get('CF-Connecting-IP') || 'unknown');
    if (rlBlock) return rlBlock;

    // Init DB once per worker instance
    if (!dbReady) { try { await initDB(env.DB); dbReady = true; } catch (e) { /* tables may already exist */ } }

    try {
      // Static routes
      if (path === '/health') {
        return json({ status: 'ok', service: 'roadcode', version: '2.0.0', agents: Object.keys(AGENTS), uptime: Date.now() });
      }

      if (path === '/robots.txt') {
        return new Response('User-agent: *\nAllow: /\nSitemap: https://roadcode.blackroad.io/sitemap.xml', { headers: { 'Content-Type': 'text/plain', ...CORS } });
      }

      if (path === '/sitemap.xml') {
        return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://roadcode.blackroad.io/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>https://roadcode.blackroad.io/api/repos</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>https://roadcode.blackroad.io/api/templates</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>
  <url><loc>https://roadcode.blackroad.io/api/snippets</loc><changefreq>daily</changefreq><priority>0.7</priority></url>
</urlset>`, { headers: { 'Content-Type': 'application/xml', ...CORS } });
      }

      // API routes
      if (path.startsWith('/api/projects')) return await handleProjects(request, env, path, method);
      if (path.startsWith('/api/snippets')) return await handleSnippets(request, env, path, method);
      if (path === '/api/execute' && method === 'POST') return await handleExecute(request, env);
      if (path === '/api/assist' && method === 'POST') return await handleAssist(request, env);
      if (path.startsWith('/api/reviews')) return await handleReview(request, env, path, method);
      if (path.startsWith('/api/sessions')) return await handleSessions(request, env, path, method);
      if (path === '/api/deploy' && method === 'POST') return await handleDeploy(request, env);
      if (path.startsWith('/api/repos')) return await handleRepos(request);
      if (path.startsWith('/api/templates')) return await handleTemplates(request, env, path, method);
      if (path === '/api/stats') return await handleStats(env);
      if (path === '/api/agents') return json({ agents: AGENTS });
      if (path === '/api/diff' && method === 'POST') return await handleDiff(request, env);
      if (path === '/api/format' && method === 'POST') return await handleFormat(request, env);
      if (path === '/api/deps' && method === 'POST') return await handleDeps(request, env);
      if (path === '/api/metrics' && method === 'POST') return await handleMetrics(request, env);
      if (path.startsWith('/api/collab')) return await handleCollab(request, env, path, method);
      if (path.startsWith('/api/code-search')) return await handleCodeSearch(request, env);
      if (path.startsWith('/api/build')) return await handleBuild(request, env, path, method);
      if (path.startsWith('/api/plugins')) return await handlePlugins(request, env, path, method);

      // Frontend
      if (path === '/' || path === '/index.html') return renderFrontend();

      return json({ error: 'Not found', endpoints: [
        '/api/projects', '/api/snippets', '/api/execute', '/api/assist',
        '/api/reviews', '/api/sessions', '/api/deploy', '/api/repos',
        '/api/templates', '/api/stats', '/api/agents', '/api/diff',
        '/api/format', '/api/deps', '/api/metrics', '/api/collab',
        '/api/code-search', '/api/build', '/api/plugins', '/health'
      ]}, 404);

    } catch (e) {
      return json({ error: 'Internal server error', message: e.message }, 500);
    }
  }
};
