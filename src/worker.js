/**
 * RoadCode - Browser Code Editor
 * Copyright (c) 2026 BlackRoad OS, Inc. All rights reserved.
 *
 * Write it. Ship it. From anywhere.
 */

const SNIPPETS = [];
let snippetIdCounter = 1;

const TEMPLATES = [
  { id: 'cf-worker', name: 'Cloudflare Worker', language: 'javascript', code: `export default {\n  async fetch(request, env) {\n    return new Response('Hello from the edge!', {\n      headers: { 'Content-Type': 'text/plain' }\n    });\n  }\n};` },
  { id: 'react-app', name: 'React App', language: 'javascript', code: `import React, { useState } from 'react';\n\nfunction App() {\n  const [count, setCount] = useState(0);\n  return (\n    <div>\n      <h1>Count: {count}</h1>\n      <button onClick={() => setCount(c => c + 1)}>Increment</button>\n    </div>\n  );\n}\n\nexport default App;` },
  { id: 'python-script', name: 'Python Script', language: 'python', code: `#!/usr/bin/env python3\n\"\"\"A starter Python script.\"\"\"\nimport sys\n\ndef main():\n    print("Hello from RoadCode!")\n    for i, arg in enumerate(sys.argv[1:], 1):\n        print(f"  arg {i}: {arg}")\n\nif __name__ == "__main__":\n    main()` },
  { id: 'bash-tool', name: 'Bash Tool', language: 'bash', code: `#!/bin/bash\n# RoadCode Bash Tool\nset -e\n\necho "Running RoadCode bash tool..."\nfor i in 1 2 3; do\n  echo "  Step $i complete"\ndone\necho "Done."` },
  { id: 'node-api', name: 'Node API', language: 'javascript', code: `import { createServer } from 'node:http';\n\nconst server = createServer((req, res) => {\n  res.writeHead(200, { 'Content-Type': 'application/json' });\n  res.end(JSON.stringify({ status: 'ok', path: req.url }));\n});\n\nserver.listen(3000, () => {\n  console.log('API running on :3000');\n});` },
];

const RC_TEMPLATES = [
  { slug: 'react-app', name: 'React App', category: 'Frontend', description: 'Modern React application with hooks, state management, and component architecture. Includes routing and responsive layout.', language: 'JavaScript', difficulty: 'Beginner', features: ['React 18 with hooks', 'React Router v6', 'CSS Modules', 'Responsive layout', 'Dark mode support'], codePreview: 'import React, { useState } from \'react\';\nimport { BrowserRouter, Routes, Route } from \'react-router-dom\';\n\nfunction App() {\n  const [theme, setTheme] = useState(\'dark\');\n  return (\n    <BrowserRouter>\n      <Routes>\n        <Route path="/" element={<Home />} />\n      </Routes>\n    </BrowserRouter>\n  );\n}' },
  { slug: 'nextjs-app', name: 'Next.js App', category: 'Frontend', description: 'Full-stack Next.js application with App Router, server components, and API routes. SEO-optimized with metadata API.', language: 'TypeScript', difficulty: 'Intermediate', features: ['App Router', 'Server Components', 'API Routes', 'Metadata API for SEO', 'Tailwind CSS'], codePreview: 'import type { Metadata } from \'next\';\n\nexport const metadata: Metadata = {\n  title: \'My App\',\n  description: \'Built with Next.js\',\n};\n\nexport default function RootLayout({\n  children,\n}: { children: React.ReactNode }) {\n  return (\n    <html lang="en">\n      <body>{children}</body>\n    </html>\n  );\n}' },
  { slug: 'express-api', name: 'Express API', category: 'Backend', description: 'RESTful API with Express.js. Includes middleware, error handling, validation, and structured routing.', language: 'JavaScript', difficulty: 'Beginner', features: ['RESTful routing', 'Error middleware', 'Input validation', 'CORS configuration', 'Environment config'], codePreview: 'import express from \'express\';\nimport cors from \'cors\';\n\nconst app = express();\napp.use(cors());\napp.use(express.json());\n\napp.get(\'/api/health\', (req, res) => {\n  res.json({ status: \'ok\', uptime: process.uptime() });\n});\n\napp.listen(3000, () => console.log(\'API on :3000\'));' },
  { slug: 'flask-api', name: 'Flask API', category: 'Backend', description: 'Python REST API with Flask. Includes blueprints, SQLAlchemy ORM, and request validation.', language: 'Python', difficulty: 'Beginner', features: ['Flask blueprints', 'SQLAlchemy ORM', 'Marshmallow validation', 'Error handlers', 'Config management'], codePreview: 'from flask import Flask, jsonify\nfrom flask_sqlalchemy import SQLAlchemy\n\napp = Flask(__name__)\napp.config[\'SQLALCHEMY_DATABASE_URI\'] = \'sqlite:///app.db\'\ndb = SQLAlchemy(app)\n\n@app.route(\'/api/health\')\ndef health():\n    return jsonify({\'status\': \'ok\'})\n\nif __name__ == \'__main__\':\n    app.run(debug=True)' },
  { slug: 'django-app', name: 'Django App', category: 'Backend', description: 'Full-featured Django web application with models, views, templates, and admin panel. Production-ready structure.', language: 'Python', difficulty: 'Intermediate', features: ['Models & migrations', 'Class-based views', 'Django admin', 'Template system', 'Authentication built-in'], codePreview: 'from django.db import models\nfrom django.views.generic import ListView\n\nclass Article(models.Model):\n    title = models.CharField(max_length=200)\n    content = models.TextField()\n    published = models.DateTimeField(auto_now_add=True)\n\n    class Meta:\n        ordering = [\'-published\']\n\nclass ArticleList(ListView):\n    model = Article\n    template_name = \'articles/list.html\'' },
  { slug: 'fastapi', name: 'FastAPI', category: 'Backend', description: 'High-performance Python API with FastAPI. Auto-generated docs, async support, and Pydantic validation.', language: 'Python', difficulty: 'Intermediate', features: ['Auto OpenAPI docs', 'Async/await support', 'Pydantic models', 'Dependency injection', 'Type-safe routing'], codePreview: 'from fastapi import FastAPI\nfrom pydantic import BaseModel\n\napp = FastAPI(title="My API")\n\nclass Item(BaseModel):\n    name: str\n    price: float\n    in_stock: bool = True\n\n@app.get("/health")\nasync def health():\n    return {"status": "ok"}\n\n@app.post("/items")\nasync def create_item(item: Item):\n    return {"id": 1, **item.dict()}' },
  { slug: 'cloudflare-worker', name: 'Cloudflare Worker', category: 'Backend', description: 'Edge computing with Cloudflare Workers. Runs in 300+ cities worldwide with D1 database and KV storage.', language: 'JavaScript', difficulty: 'Beginner', features: ['Edge runtime', 'D1 SQLite database', 'KV storage', 'R2 object storage', 'Cron triggers'], codePreview: 'export default {\n  async fetch(request, env) {\n    const url = new URL(request.url);\n    if (url.pathname === \'/api/data\') {\n      const rows = await env.DB.prepare(\n        \'SELECT * FROM items LIMIT 10\'\n      ).all();\n      return Response.json(rows.results);\n    }\n    return new Response(\'Hello from the edge!\');\n  },\n};' },
  { slug: 'static-site', name: 'Static Site', category: 'Frontend', description: 'Clean static website with modern CSS. No frameworks, no build step. Pure HTML, CSS, and vanilla JavaScript.', language: 'HTML/CSS', difficulty: 'Beginner', features: ['Zero dependencies', 'Responsive design', 'CSS custom properties', 'Semantic HTML', 'Progressive enhancement'], codePreview: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width">\n  <title>My Site</title>\n  <style>\n    :root { --bg: #000; --text: #f5f5f5; }\n    body { background: var(--bg); color: var(--text); }\n  </style>\n</head>\n<body>\n  <main>Hello World</main>\n</body>\n</html>' },
  { slug: 'cli-tool', name: 'CLI Tool', category: 'Packages', description: 'Command-line tool with argument parsing, colored output, and interactive prompts. Publishable to npm.', language: 'JavaScript', difficulty: 'Intermediate', features: ['Argument parsing', 'Colored output', 'Interactive prompts', 'Config file support', 'npm publishable'], codePreview: '#!/usr/bin/env node\nimport { parseArgs } from \'node:util\';\n\nconst { values, positionals } = parseArgs({\n  options: {\n    verbose: { type: \'boolean\', short: \'v\' },\n    output: { type: \'string\', short: \'o\' },\n  },\n  allowPositionals: true,\n});\n\nconsole.log(\'Running with:\', values);\nconsole.log(\'Args:\', positionals);' },
  { slug: 'chrome-extension', name: 'Chrome Extension', category: 'Frontend', description: 'Browser extension with popup UI, content scripts, background service worker, and storage API.', language: 'JavaScript', difficulty: 'Intermediate', features: ['Manifest V3', 'Popup UI', 'Content scripts', 'Background worker', 'Chrome storage API'], codePreview: '// manifest.json\n{\n  "manifest_version": 3,\n  "name": "My Extension",\n  "version": "1.0",\n  "action": { "default_popup": "popup.html" },\n  "permissions": ["storage", "activeTab"],\n  "background": {\n    "service_worker": "background.js"\n  }\n}' },
  { slug: 'discord-bot', name: 'Discord Bot', category: 'Bots', description: 'Discord bot with slash commands, event handlers, and embedded messages. Uses discord.js v14.', language: 'JavaScript', difficulty: 'Intermediate', features: ['Slash commands', 'Event handlers', 'Embed messages', 'Button interactions', 'Permission system'], codePreview: 'import { Client, GatewayIntentBits } from \'discord.js\';\n\nconst client = new Client({\n  intents: [GatewayIntentBits.Guilds]\n});\n\nclient.on(\'ready\', () => {\n  console.log(`Logged in as ${client.user.tag}`);\n});\n\nclient.on(\'interactionCreate\', async (i) => {\n  if (i.commandName === \'ping\')\n    await i.reply(\'Pong!\');\n});\n\nclient.login(process.env.TOKEN);' },
  { slug: 'slack-bot', name: 'Slack Bot', category: 'Bots', description: 'Slack bot with Bolt framework. Handles messages, slash commands, shortcuts, and interactive modals.', language: 'JavaScript', difficulty: 'Intermediate', features: ['Bolt framework', 'Slash commands', 'Interactive modals', 'Event subscriptions', 'Message formatting'], codePreview: 'import { App } from \'@slack/bolt\';\n\nconst app = new App({\n  token: process.env.SLACK_BOT_TOKEN,\n  signingSecret: process.env.SLACK_SIGNING_SECRET,\n});\n\napp.command(\'/hello\', async ({ command, ack, say }) => {\n  await ack();\n  await say(`Hey <@${command.user_id}>!`);\n});\n\n(async () => {\n  await app.start(3000);\n  console.log(\'Slack bot running\');\n})();' },
  { slug: 'rest-api', name: 'REST API (Node)', category: 'Backend', description: 'Production REST API with authentication, rate limiting, logging, and OpenAPI documentation.', language: 'TypeScript', difficulty: 'Intermediate', features: ['JWT authentication', 'Rate limiting', 'Request logging', 'OpenAPI docs', 'Input validation'], codePreview: 'import Fastify from \'fastify\';\nimport jwt from \'@fastify/jwt\';\nimport rateLimit from \'@fastify/rate-limit\';\n\nconst app = Fastify({ logger: true });\napp.register(jwt, { secret: process.env.JWT_SECRET });\napp.register(rateLimit, { max: 100, timeWindow: \'1m\' });\n\napp.get(\'/api/v1/users\', {\n  preHandler: [app.authenticate],\n}, async (req) => {\n  return { users: [] };\n});' },
  { slug: 'graphql-api', name: 'GraphQL API', category: 'Backend', description: 'GraphQL server with type definitions, resolvers, and subscriptions. Includes playground and schema introspection.', language: 'TypeScript', difficulty: 'Intermediate', features: ['Type-safe schema', 'Resolvers', 'Subscriptions', 'DataLoader batching', 'GraphQL Playground'], codePreview: 'import { createSchema, createYoga } from \'graphql-yoga\';\n\nconst schema = createSchema({\n  typeDefs: `\n    type Query {\n      users: [User!]!\n      user(id: ID!): User\n    }\n    type User {\n      id: ID!\n      name: String!\n      email: String!\n    }\n  `,\n  resolvers: {\n    Query: {\n      users: () => db.users.findAll(),\n    },\n  },\n});' },
  { slug: 'websocket-server', name: 'WebSocket Server', category: 'Backend', description: 'Real-time WebSocket server with rooms, broadcasting, and reconnection handling.', language: 'JavaScript', difficulty: 'Intermediate', features: ['Room management', 'Broadcasting', 'Heartbeat/ping', 'Reconnection support', 'Binary messages'], codePreview: 'import { WebSocketServer } from \'ws\';\n\nconst wss = new WebSocketServer({ port: 8080 });\nconst rooms = new Map();\n\nwss.on(\'connection\', (ws) => {\n  ws.isAlive = true;\n  ws.on(\'pong\', () => { ws.isAlive = true; });\n  ws.on(\'message\', (data) => {\n    const msg = JSON.parse(data);\n    if (msg.type === \'join\') joinRoom(ws, msg.room);\n    if (msg.type === \'chat\') broadcast(msg.room, msg);\n  });\n});' },
  { slug: 'docker-compose', name: 'Docker Compose', category: 'DevOps', description: 'Multi-service Docker Compose setup with app server, database, cache, and reverse proxy.', language: 'YAML', difficulty: 'Intermediate', features: ['Multi-service stack', 'Volume persistence', 'Network isolation', 'Health checks', 'Environment config'], codePreview: 'version: "3.9"\nservices:\n  app:\n    build: .\n    ports: ["3000:3000"]\n    environment:\n      - DATABASE_URL=postgres://db:5432/app\n    depends_on:\n      db: { condition: service_healthy }\n  db:\n    image: postgres:16-alpine\n    volumes: [pgdata:/var/lib/postgresql/data]\nvolumes:\n  pgdata:' },
  { slug: 'github-action', name: 'GitHub Action', category: 'DevOps', description: 'Custom GitHub Action for CI/CD. Includes testing, building, and deploying on push and pull request events.', language: 'YAML', difficulty: 'Beginner', features: ['CI/CD pipeline', 'Matrix testing', 'Caching', 'Artifact uploads', 'Environment secrets'], codePreview: 'name: CI\non:\n  push:\n    branches: [main]\n  pull_request:\n    branches: [main]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    strategy:\n      matrix:\n        node: [18, 20]\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n      - run: npm ci && npm test' },
  { slug: 'terraform-module', name: 'Terraform Module', category: 'DevOps', description: 'Reusable Terraform module for cloud infrastructure. Includes variables, outputs, and state management.', language: 'HCL', difficulty: 'Intermediate', features: ['Reusable module', 'Variable validation', 'Output values', 'State management', 'Provider config'], codePreview: 'terraform {\n  required_version = ">= 1.5"\n  required_providers {\n    aws = {\n      source  = "hashicorp/aws"\n      version = "~> 5.0"\n    }\n  }\n}\n\nvariable "environment" {\n  type    = string\n  default = "production"\n}\n\nresource "aws_instance" "app" {\n  ami           = var.ami_id\n  instance_type = "t3.micro"\n}' },
  { slug: 'python-package', name: 'Python Package', category: 'Packages', description: 'Publishable Python package with pyproject.toml, tests, and CI. Ready for PyPI distribution.', language: 'Python', difficulty: 'Intermediate', features: ['pyproject.toml config', 'pytest test suite', 'Type hints', 'CLI entry point', 'PyPI-ready'], codePreview: '[build-system]\nrequires = ["setuptools>=68.0"]\nbuild-backend = "setuptools.backends._legacy:_Backend"\n\n[project]\nname = "my-package"\nversion = "0.1.0"\nrequires-python = ">=3.9"\n\n[project.scripts]\nmy-tool = "my_package.cli:main"' },
  { slug: 'npm-package', name: 'npm Package', category: 'Packages', description: 'Publishable npm package with TypeScript, tests, and bundling. Supports ESM and CommonJS.', language: 'TypeScript', difficulty: 'Intermediate', features: ['Dual ESM/CJS', 'TypeScript source', 'Vitest testing', 'Bundled with tsup', 'npm publish ready'], codePreview: '// package.json\n{\n  "name": "my-package",\n  "version": "0.1.0",\n  "type": "module",\n  "exports": {\n    ".": {\n      "import": "./dist/index.js",\n      "require": "./dist/index.cjs"\n    }\n  }\n}\n\n// src/index.ts\nexport function greet(name: string): string {\n  return `Hello, ${name}!`;\n}' },
  { slug: 'tailwind-app', name: 'Tailwind App', category: 'Frontend', description: 'Vite-powered app with Tailwind CSS v4. Includes dark mode, responsive utilities, and custom design tokens.', language: 'JavaScript', difficulty: 'Beginner', features: ['Tailwind CSS v4', 'Vite build', 'Dark mode', 'Custom design tokens', 'Responsive utilities'], codePreview: 'import { useState } from \'react\';\n\nexport default function App() {\n  const [dark, setDark] = useState(true);\n  return (\n    <div className={dark ? \'dark\' : \'\'}>\n      <main className="min-h-screen bg-white\n        dark:bg-zinc-950 p-8">\n        <h1 className="text-4xl font-bold">\n          Hello Tailwind\n        </h1>\n      </main>\n    </div>\n  );\n}' },
  { slug: 'svelte-app', name: 'Svelte App', category: 'Frontend', description: 'SvelteKit application with file-based routing, server-side rendering, and form actions.', language: 'Svelte', difficulty: 'Beginner', features: ['SvelteKit framework', 'File-based routing', 'SSR support', 'Form actions', 'Load functions'], codePreview: '<script>\n  export let data;\n</script>\n\n<svelte:head>\n  <title>Home</title>\n</svelte:head>\n\n<main>\n  <h1>Welcome to SvelteKit</h1>\n  {#each data.items as item}\n    <article>\n      <h2>{item.title}</h2>\n    </article>\n  {/each}\n</main>' },
];

function corsHeaders(origin) {
  const allowed = origin && (origin.endsWith('.blackroad.io') || origin === 'https://blackroad.io') ? origin : 'https://roadcode.blackroad.io';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function securityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'ALLOW-FROM https://app.blackroad.io',
    'Content-Security-Policy': "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; frame-ancestors https://app.blackroad.io https://*.blackroad.io;",
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-XSS-Protection': '1; mode=block',
  };
}

function json(data, status = 200, origin = '') {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin), ...securityHeaders() },
  });
}

// --- Safe Expression Evaluator (no eval/Function) ---
function safeEval(expr, vars = {}) {
  expr = expr.trim().replace(/;$/, '');
  // String literal
  if (/^["'`]/.test(expr)) return expr.slice(1, -1);
  // Boolean
  if (expr === 'true') return true;
  if (expr === 'false') return false;
  if (expr === 'null') return null;
  if (expr === 'undefined') return undefined;
  // Number
  if (!isNaN(Number(expr)) && expr !== '') return Number(expr);
  // Variable reference
  if (/^\w+$/.test(expr) && expr in vars) return vars[expr];
  // String concatenation: "a" + "b" or var + "str"
  if (expr.includes('+')) {
    const parts = expr.split('+').map(p => safeEval(p.trim(), vars));
    if (parts.some(p => typeof p === 'string')) return parts.join('');
    return parts.reduce((a, b) => a + b, 0);
  }
  // Simple math: only numbers and +-*/()
  const mathExpr = expr.replace(/\w+/g, m => m in vars ? String(vars[m]) : m);
  if (/^[\d+\-*/().% ]+$/.test(mathExpr)) {
    try {
      // Manually evaluate simple math with a recursive descent parser
      return evalMath(mathExpr);
    } catch { return expr; }
  }
  // Template literal: `text ${var}`
  if (expr.startsWith('`') && expr.endsWith('`')) {
    return expr.slice(1, -1).replace(/\$\{(\w+)\}/g, (_, k) => k in vars ? String(vars[k]) : '');
  }
  return expr;
}

function evalMath(s) {
  s = s.replace(/\s/g, '');
  let i = 0;
  function num() {
    if (s[i] === '(') { i++; const v = add(); i++; return v; }
    let n = '';
    if (s[i] === '-') { n += '-'; i++; }
    while (i < s.length && (/\d/.test(s[i]) || s[i] === '.')) { n += s[i++]; }
    return parseFloat(n);
  }
  function mul() {
    let v = num();
    while (i < s.length && (s[i] === '*' || s[i] === '/' || s[i] === '%')) {
      const op = s[i++];
      const r = num();
      v = op === '*' ? v * r : op === '/' ? v / r : v % r;
    }
    return v;
  }
  function add() {
    let v = mul();
    while (i < s.length && (s[i] === '+' || s[i] === '-') && s[i - 1] !== '(') {
      const op = s[i++];
      v = op === '+' ? v + mul() : v - mul();
    }
    return v;
  }
  return add();
}

function splitArgs(s) {
  const args = [];
  let depth = 0, current = '', inStr = false, strChar = '';
  for (const c of s) {
    if (inStr) { current += c; if (c === strChar) inStr = false; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = true; strChar = c; current += c; continue; }
    if (c === '(') depth++;
    if (c === ')') depth--;
    if (c === ',' && depth === 0) { args.push(current); current = ''; continue; }
    current += c;
  }
  if (current) args.push(current);
  return args;
}

// --- Simple RoadC Interpreter ---
function executeRoadC(code) {
  const output = [];
  const vars = {};
  const lines = code.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//'));
  for (const line of lines) {
    try {
      // road <var> = <expr>
      const letMatch = line.match(/^road\s+(\w+)\s*=\s*(.+)$/);
      if (letMatch) {
        vars[letMatch[1]] = evalExpr(letMatch[2], vars);
        continue;
      }
      // ship(<expr>) — print
      const shipMatch = line.match(/^ship\((.+)\)$/);
      if (shipMatch) {
        output.push(String(evalExpr(shipMatch[1], vars)));
        continue;
      }
      // cruise <n> { ... } — loop
      const cruiseMatch = line.match(/^cruise\s+(\d+)\s*\{(.+)\}$/);
      if (cruiseMatch) {
        const n = parseInt(cruiseMatch[1], 10);
        const body = cruiseMatch[2].trim();
        for (let i = 0; i < n; i++) {
          const innerShip = body.match(/^ship\((.+)\)$/);
          if (innerShip) {
            let expr = innerShip[1].replace(/\bi\b/g, String(i));
            output.push(String(evalExpr(expr, vars)));
          }
        }
        continue;
      }
      // if check(<cond>) { ... }
      const ifMatch = line.match(/^if\s+check\((.+)\)\s*\{(.+)\}$/);
      if (ifMatch) {
        if (evalExpr(ifMatch[1], vars)) {
          const body = ifMatch[2].trim();
          const innerShip = body.match(/^ship\((.+)\)$/);
          if (innerShip) output.push(String(evalExpr(innerShip[1], vars)));
        }
        continue;
      }
      output.push('[unknown]: ' + line);
    } catch (e) {
      output.push('[error]: ' + e.message + ' at: ' + line);
    }
  }
  return output.join('\n');
}

function evalExpr(expr, vars) {
  let e = expr.trim();
  // String literal
  if ((e.startsWith('"') && e.endsWith('"')) || (e.startsWith("'") && e.endsWith("'"))) {
    return e.slice(1, -1);
  }
  // String concat with +
  if (e.includes('+') && e.includes('"')) {
    return e.split('+').map(p => evalExpr(p.trim(), vars)).join('');
  }
  // Variable
  if (vars.hasOwnProperty(e)) return vars[e];
  // Number
  if (!isNaN(Number(e))) return Number(e);
  // Simple arithmetic (no eval — manual parse)
  const arith = e.match(/^(\w+)\s*([\+\-\*\/\%])\s*(\w+)$/);
  if (arith) {
    const a = vars.hasOwnProperty(arith[1]) ? Number(vars[arith[1]]) : Number(arith[1]);
    const b = vars.hasOwnProperty(arith[3]) ? Number(vars[arith[3]]) : Number(arith[3]);
    switch (arith[2]) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b !== 0 ? a / b : 'div/0';
      case '%': return a % b;
    }
  }
  // Comparison
  const cmp = e.match(/^(\w+)\s*(==|!=|>=|<=|>|<)\s*(.+)$/);
  if (cmp) {
    const a = vars.hasOwnProperty(cmp[1]) ? vars[cmp[1]] : isNaN(Number(cmp[1])) ? cmp[1] : Number(cmp[1]);
    const bRaw = cmp[3].trim();
    const b = vars.hasOwnProperty(bRaw) ? vars[bRaw] : isNaN(Number(bRaw)) ? bRaw : Number(bRaw);
    switch (cmp[2]) {
      case '==': return a == b;
      case '!=': return a != b;
      case '>': return a > b;
      case '<': return a < b;
      case '>=': return a >= b;
      case '<=': return a <= b;
    }
  }
  return e;
}

// --- API Router ---
async function handleAPI(path, request, origin) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (path === '/api/track' && (request.method === 'POST' || method === 'POST')) {
    try { const body = await request.json(); const cf = request.cf || {};
      if (env.DB) { await env.DB.prepare("CREATE TABLE IF NOT EXISTS analytics_events (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT DEFAULT 'pageview', path TEXT, referrer TEXT, country TEXT, city TEXT, device TEXT, screen TEXT, scroll_depth INTEGER DEFAULT 0, engagement_ms INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')))").run();
      await env.DB.prepare('INSERT INTO analytics_events (type, path, referrer, country, city, device, screen, scroll_depth, engagement_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(body.type||'pageview', body.path||'/', body.referrer||'', cf.country||'', cf.city||'', body.device||'', body.screen||'', body.scroll||0, body.time||0).run(); }
    } catch(e) {}
    return new Response(JSON.stringify({ok:true}), {headers:{'Content-Type':'application/json'}});
  }

    // ── Sovereign Analytics ──
    if (path === '/api/analytics' && request.method === 'POST') {
      try {
        const body = await request.json();
        const cf = request.cf || {};
        const ip = request.headers.get('CF-Connecting-IP') || '';
        const ipHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip + '2026'));
        const visitor = btoa(String.fromCharCode(...new Uint8Array(ipHash))).slice(0,12);
        await env.DB.prepare(`CREATE TABLE IF NOT EXISTS br_analytics (id INTEGER PRIMARY KEY AUTOINCREMENT, path TEXT, referrer TEXT, visitor TEXT, country TEXT, city TEXT, screen TEXT, ts TEXT DEFAULT (datetime('now')))`).run();
        await env.DB.prepare('INSERT INTO br_analytics (path, referrer, visitor, country, city, screen) VALUES (?,?,?,?,?,?)').bind(body.path||'/', body.ref||'', visitor, cf.country||'', cf.city||'', (body.w||0)+'x'+(body.h||0)).run();
      } catch(e){}
      return new Response('ok', {headers:{'Access-Control-Allow-Origin':'*'}});
    }
    if (path === '/api/analytics/stats') {
      try {
        await env.DB.prepare(`CREATE TABLE IF NOT EXISTS br_analytics (id INTEGER PRIMARY KEY AUTOINCREMENT, path TEXT, referrer TEXT, visitor TEXT, country TEXT, city TEXT, screen TEXT, ts TEXT DEFAULT (datetime('now')))`).run();
        const total = await env.DB.prepare('SELECT COUNT(*) as c FROM br_analytics').first();
        const unique = await env.DB.prepare('SELECT COUNT(DISTINCT visitor) as c FROM br_analytics').first();
        const today = await env.DB.prepare("SELECT COUNT(*) as c FROM br_analytics WHERE ts > datetime('now','-1 day')").first();
        const pages = await env.DB.prepare('SELECT path, COUNT(*) as views FROM br_analytics GROUP BY path ORDER BY views DESC LIMIT 10').all();
        const countries = await env.DB.prepare('SELECT country, COUNT(*) as c FROM br_analytics WHERE country != "" GROUP BY country ORDER BY c DESC LIMIT 10').all();
        return new Response(JSON.stringify({total_views:total?.c||0,unique_visitors:unique?.c||0,today:today?.c||0,top_pages:pages?.results||[],top_countries:countries?.results||[]}),{headers:{'Access-Control-Allow-Origin':'*','Content-Type':'application/json'}});
      } catch(e) { return new Response(JSON.stringify({error:'analytics unavailable'}),{status:500,headers:{'Content-Type':'application/json'}}); }
    }
  if (path === '/api/health') {
    return json({ status: 'ok', service: 'roadcode', version: '1.0.0', uptime: Date.now() }, 200, origin);
  }

  if (path === '/api/execute' && request.method === 'POST') {
    const body = await request.json();
    const { code, language } = body;
    if (!code) return json({ error: 'No code provided' }, 400, origin);
    let output, success = true;
    if (language === 'roadc') {
      output = executeRoadC(code);
    } else if (language === 'javascript') {
      // Safe JS execution — parse console.log statements and evaluate simple expressions
      try {
        const logs = [];
        const vars = {};
        const lines = code.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('//')) continue;
          // Variable declaration: let/const/var x = value
          const varMatch = trimmed.match(/^(?:let|const|var)\s+(\w+)\s*=\s*(.+?);?$/);
          if (varMatch) {
            vars[varMatch[1]] = safeEval(varMatch[2], vars);
            continue;
          }
          // console.log(...)
          const logMatch = trimmed.match(/^console\.log\((.+)\);?$/);
          if (logMatch) {
            const args = splitArgs(logMatch[1]).map(a => String(safeEval(a.trim(), vars)));
            logs.push(args.join(' '));
            continue;
          }
          // Assignment: x = value
          const assignMatch = trimmed.match(/^(\w+)\s*=\s*(.+?);?$/);
          if (assignMatch) {
            vars[assignMatch[1]] = safeEval(assignMatch[2], vars);
            continue;
          }
        }
        output = logs.join('\n') || '(no output — use console.log() to print results)';
      } catch (e) {
        output = 'Error: ' + e.message;
        success = false;
      }
    } else {
      output = `[${language}] Remote execution is not available in this environment.\nCode received (${code.length} chars). In production, this would be sent to a sandboxed runner.`;
    }
    return json({ output, success, language }, 200, origin);
  }

  if (path === '/api/snippets' && request.method === 'GET') {
    return json({ snippets: SNIPPETS.slice(-50).reverse() }, 200, origin);
  }

  if (path === '/api/snippets' && request.method === 'POST') {
    const body = await request.json();
    const { name, language, code } = body;
    if (!name || !code) return json({ error: 'name and code required' }, 400, origin);
    const snippet = { id: snippetIdCounter++, name, language: language || 'javascript', code, created: new Date().toISOString() };
    SNIPPETS.push(snippet);
    if (SNIPPETS.length > 200) SNIPPETS.shift();
    return json({ snippet }, 201, origin);
  }

  if (path === '/api/templates') {
    return json({ templates: TEMPLATES }, 200, origin);
  }

  if (path === '/api/review' && request.method === 'POST') {
    const body = await request.json();
    const { code, language } = body;
    if (!code) return json({ error: 'No code provided' }, 400, origin);
    const lines = code.split('\n');
    const feedback = [];
    feedback.push({ type: 'info', message: `Analyzed ${lines.length} lines of ${language || 'unknown'} code.` });
    if (lines.length > 100) feedback.push({ type: 'warn', message: 'File is over 100 lines. Consider splitting into modules.' });
    if (code.includes('var ')) feedback.push({ type: 'warn', message: 'Use const/let instead of var for block scoping.' });
    if (code.includes('eval(')) feedback.push({ type: 'error', message: 'Avoid eval() - it is a security risk.' });
    if (!code.includes('try') && !code.includes('catch')) feedback.push({ type: 'info', message: 'Consider adding error handling (try/catch).' });
    if (code.includes('console.log')) feedback.push({ type: 'info', message: 'Remove console.log statements before shipping.' });
    if (code.includes('TODO') || code.includes('FIXME')) feedback.push({ type: 'warn', message: 'Found TODO/FIXME comments - resolve before shipping.' });
    if (feedback.length === 1) feedback.push({ type: 'info', message: 'Code looks clean. No major issues found.' });
    return json({ feedback, summary: `${feedback.length} items found` }, 200, origin);
  }

  return json({ error: 'Not found' }, 404, origin);
}

// --- UI ---
function renderUI() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>RoadCode — Browser Code Editor with AI — BlackRoad OS</title>
<meta name="description" content="Browser code editor with AI-powered completion, code review, and one-click deploy. Projects, files, snippets, templates. Write, test, and ship from anywhere.">
<meta name="robots" content="index, follow, noai, noimageai">
<link rel="canonical" href="https://roadcode.blackroad.io/">
<meta property="og:title" content="RoadCode — Browser Code Editor — BlackRoad OS">
<meta property="og:description" content="Code editor with AI completion, review, and deploy. Write, test, and ship from anywhere.">
<meta property="og:url" content="https://roadcode.blackroad.io/">
<meta property="og:type" content="website">
<meta property="og:image" content="https://images.blackroad.io/pixel-art/road-logo.png">
<meta property="og:site_name" content="BlackRoad OS">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="RoadCode — Browser Code Editor — BlackRoad OS">
<meta name="twitter:description" content="Code editor with AI completion, review, and deploy. Write, test, and ship from anywhere.">
<meta name="twitter:image" content="https://images.blackroad.io/pixel-art/road-logo.png">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebApplication","name":"RoadCode","url":"https://roadcode.blackroad.io/","description":"Browser code editor with AI-powered completion, code review, and one-click deploy.","applicationCategory":"DeveloperApplication","operatingSystem":"Web","offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},"author":{"@type":"Organization","name":"BlackRoad OS, Inc.","url":"https://blackroad.io"}}</script>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0a0a0a;--bg2:#111;--bg3:#1a1a1a;--bg4:#222;
  --fg:#f5f5f5;--fg2:#aaa;--fg3:#666;
  --pink:#FF1D6C;--amber:#F5A623;--blue:#2979FF;--violet:#9C27B0;--green:#00E676;
  --font:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  --mono:'SF Mono','Fira Code','Cascadia Code','JetBrains Mono',Consolas,'Courier New',monospace;
  --radius:6px;
}
html,body{height:100%;background:var(--bg);color:var(--fg);font-family:var(--font);overflow:hidden}
button{cursor:pointer;font-family:var(--font);border:none;outline:none}
select{font-family:var(--font);outline:none}

/* Layout */
.app{display:flex;flex-direction:column;height:100vh}
.header{display:flex;align-items:center;justify-content:space-between;padding:8px 16px;background:var(--bg2);border-bottom:1px solid var(--bg4);flex-shrink:0}
.header-left{display:flex;align-items:center;gap:12px}
.logo{font-size:18px;font-weight:700;color:var(--fg);letter-spacing:-0.5px}
.logo-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--pink);margin-right:6px}
.tagline{font-size:11px;color:var(--fg3);font-style:italic}
.header-actions{display:flex;gap:8px;align-items:center}

/* Buttons */
.btn{padding:6px 14px;border-radius:var(--radius);font-size:12px;font-weight:600;transition:opacity .15s}
.btn:hover{opacity:0.85}
.btn-run{background:var(--green);color:#000}
.btn-save{background:var(--blue);color:#fff}
.btn-review{background:var(--violet);color:#fff}
.btn-new{background:var(--bg4);color:var(--fg)}
.btn-template{background:var(--amber);color:#000}
.btn-sm{padding:4px 10px;font-size:11px}

/* Tabs */
.tabs{display:flex;background:var(--bg2);border-bottom:1px solid var(--bg4);flex-shrink:0;overflow-x:auto}
.tab{padding:6px 16px;font-size:12px;color:var(--fg2);background:var(--bg2);border:none;border-right:1px solid var(--bg4);cursor:pointer;display:flex;align-items:center;gap:6px;white-space:nowrap}
.tab.active{background:var(--bg);color:var(--fg);border-bottom:2px solid var(--pink)}
.tab-close{font-size:14px;color:var(--fg3);cursor:pointer;line-height:1}
.tab-close:hover{color:var(--fg)}

/* Main area */
.main{display:flex;flex:1;overflow:hidden}

/* Sidebar */
.sidebar{width:240px;background:var(--bg2);border-right:1px solid var(--bg4);display:flex;flex-direction:column;flex-shrink:0;overflow:hidden}
.sidebar-header{padding:10px 12px;font-size:11px;font-weight:700;color:var(--fg2);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--bg4);display:flex;justify-content:space-between;align-items:center}
.sidebar-list{flex:1;overflow-y:auto;padding:4px}
.sidebar-item{padding:8px 10px;font-size:12px;color:var(--fg2);cursor:pointer;border-radius:var(--radius);margin-bottom:2px;display:flex;flex-direction:column;gap:2px}
.sidebar-item:hover{background:var(--bg4);color:var(--fg)}
.sidebar-item-name{color:var(--fg);font-weight:500}
.sidebar-item-meta{font-size:10px;color:var(--fg3)}
.sidebar-empty{padding:16px 12px;font-size:12px;color:var(--fg3);text-align:center}

/* Editor area */
.editor-area{flex:1;display:flex;flex-direction:column;overflow:hidden}
.toolbar{display:flex;align-items:center;gap:8px;padding:6px 12px;background:var(--bg2);border-bottom:1px solid var(--bg4);flex-shrink:0;flex-wrap:wrap}
.toolbar select{background:var(--bg4);color:var(--fg);border:1px solid var(--fg3);border-radius:var(--radius);padding:4px 8px;font-size:12px}

/* Editor */
.editor-container{flex:1;display:flex;overflow:hidden;position:relative}
.line-numbers{width:48px;background:var(--bg2);color:var(--fg3);font-family:var(--mono);font-size:13px;line-height:1.6;padding:12px 8px 12px 0;text-align:right;overflow:hidden;user-select:none;flex-shrink:0;border-right:1px solid var(--bg4)}
.editor-wrapper{flex:1;position:relative;overflow:hidden}
.editor-highlight{position:absolute;top:0;left:0;right:0;bottom:0;font-family:var(--mono);font-size:13px;line-height:1.6;padding:12px;white-space:pre-wrap;word-wrap:break-word;overflow-y:auto;color:transparent;pointer-events:none;z-index:1}
.editor-textarea{position:absolute;top:0;left:0;width:100%;height:100%;font-family:var(--mono);font-size:13px;line-height:1.6;padding:12px;background:transparent;color:var(--fg);border:none;outline:none;resize:none;white-space:pre-wrap;word-wrap:break-word;overflow-y:auto;z-index:2;caret-color:var(--fg);-webkit-text-fill-color:var(--fg);tab-size:2}

/* Syntax colors - applied to highlight overlay */
.hl-keyword{color:#c792ea}
.hl-string{color:#c3e88d}
.hl-number{color:#f78c6c}
.hl-comment{color:#546e7a;font-style:italic}
.hl-function{color:#82aaff}
.hl-operator{color:#89ddff}
.hl-builtin{color:#ffcb6b}

/* Output panel */
.output-panel{height:180px;background:var(--bg);border-top:2px solid var(--bg4);display:flex;flex-direction:column;flex-shrink:0}
.output-header{display:flex;justify-content:space-between;align-items:center;padding:6px 12px;background:var(--bg2);border-bottom:1px solid var(--bg4)}
.output-title{font-size:11px;font-weight:700;color:var(--fg2);text-transform:uppercase;letter-spacing:0.5px}
.output-content{flex:1;overflow-y:auto;padding:10px 12px;font-family:var(--mono);font-size:12px;line-height:1.5;color:var(--fg2);white-space:pre-wrap}
.output-success{color:var(--fg)}
.output-error{color:#ff5252}

/* Status bar */
.statusbar{display:flex;align-items:center;justify-content:space-between;padding:3px 12px;background:var(--bg2);border-top:1px solid var(--bg4);flex-shrink:0;font-size:11px;color:var(--fg3)}
.statusbar-left,.statusbar-right{display:flex;gap:16px;align-items:center}
.status-indicator{width:6px;height:6px;border-radius:50%;background:var(--green);display:inline-block}

/* Resizer */
.output-resizer{height:4px;background:var(--bg4);cursor:row-resize;flex-shrink:0}
.output-resizer:hover{background:var(--blue)}

/* Templates dropdown */
.template-dropdown{position:relative;display:inline-block}
.template-menu{display:none;position:absolute;top:100%;left:0;background:var(--bg3);border:1px solid var(--bg4);border-radius:var(--radius);min-width:180px;z-index:100;margin-top:4px;box-shadow:0 4px 12px rgba(0,0,0,.5)}
.template-menu.open{display:block}
.template-option{padding:8px 12px;font-size:12px;color:var(--fg2);cursor:pointer;border-bottom:1px solid var(--bg4)}
.template-option:last-child{border-bottom:none}
.template-option:hover{background:var(--bg4);color:var(--fg)}

/* Mobile */
@media(max-width:768px){
  .sidebar{display:none}
  .sidebar.mobile-open{display:flex;position:fixed;left:0;top:0;bottom:0;z-index:200;width:260px;box-shadow:4px 0 20px rgba(0,0,0,.5)}
  .header{padding:6px 10px}
  .tagline{display:none}
  .toolbar{padding:4px 8px}
  .output-panel{height:140px}
}

/* Scrollbar */
::-webkit-scrollbar{width:8px;height:8px}
::-webkit-scrollbar-track{background:var(--bg)}
::-webkit-scrollbar-thumb{background:var(--bg4);border-radius:4px}
::-webkit-scrollbar-thumb:hover{background:var(--fg3)}

/* Save dialog */
.modal-overlay{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.6);z-index:300;align-items:center;justify-content:center}
.modal-overlay.open{display:flex}
.modal{background:var(--bg3);border:1px solid var(--bg4);border-radius:8px;padding:20px;width:360px;max-width:90vw}
.modal h3{font-size:14px;margin-bottom:12px;color:var(--fg)}
.modal input{width:100%;padding:8px 10px;background:var(--bg);color:var(--fg);border:1px solid var(--fg3);border-radius:var(--radius);font-size:13px;margin-bottom:12px;font-family:var(--font)}
.modal-actions{display:flex;gap:8px;justify-content:flex-end}
</style>
</head>
<body>
<div class="app" id="app">
  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <div class="logo"><span class="logo-dot"></span>RoadCode</div>
      <span class="tagline">Write it. Ship it. From anywhere.</span>
    </div>
    <div class="header-actions">
      <button class="btn btn-sm btn-new" onclick="toggleSidebar()" title="Toggle snippets panel">Snippets</button>
    </div>
  </div>

  <!-- Tabs -->
  <div class="tabs" id="tabs"></div>

  <!-- Main -->
  <div class="main">
    <!-- Sidebar -->
    <div class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <span>Saved Snippets</span>
        <button class="btn btn-sm btn-new" onclick="loadSnippets()">Refresh</button>
      </div>
      <div class="sidebar-list" id="snippetList">
        <div class="sidebar-empty">No saved snippets yet.<br>Save your code to see it here.</div>
      </div>
    </div>

    <!-- Editor -->
    <div class="editor-area">
      <div class="toolbar">
        <select id="langSelect" onchange="changeLanguage(this.value)">
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="roadc">RoadC</option>
          <option value="bash">Bash</option>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
        </select>
        <button class="btn btn-run" onclick="runCode()">Run</button>
        <button class="btn btn-save" onclick="showSaveDialog()">Save</button>
        <button class="btn btn-review" onclick="reviewCode()">Review</button>
        <div class="template-dropdown">
          <button class="btn btn-template" onclick="toggleTemplateMenu()">Templates</button>
          <div class="template-menu" id="templateMenu"></div>
        </div>
        <button class="btn btn-sm btn-new" onclick="newFile()">+ New File</button>
      </div>

      <div class="editor-container">
        <div class="line-numbers" id="lineNumbers">1</div>
        <div class="editor-wrapper">
          <div class="editor-highlight" id="editorHighlight"></div>
          <textarea class="editor-textarea" id="editor" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off"></textarea>
        </div>
      </div>

      <div class="output-resizer" id="outputResizer"></div>

      <div class="output-panel" id="outputPanel">
        <div class="output-header">
          <span class="output-title">Output</span>
          <button class="btn btn-sm btn-new" onclick="clearOutput()">Clear</button>
        </div>
        <div class="output-content" id="outputContent">Ready.</div>
      </div>
    </div>
  </div>

  <!-- Status bar -->
  <div class="statusbar">
    <div class="statusbar-left">
      <span><span class="status-indicator"></span> Connected</span>
      <span id="statusLang">JavaScript</span>
    </div>
    <div class="statusbar-right">
      <span id="statusLines">Ln 1</span>
      <span id="statusChars">0 chars</span>
      <span>RoadCode v1.0</span>
    </div>
  </div>
</div>

<!-- Save Dialog -->
<div class="modal-overlay" id="saveModal">
  <div class="modal">
    <h3>Save Snippet</h3>
    <input type="text" id="snippetName" placeholder="Snippet name..." autofocus>
    <div class="modal-actions">
      <button class="btn btn-sm btn-new" onclick="closeSaveDialog()">Cancel</button>
      <button class="btn btn-sm btn-save" onclick="saveSnippet()">Save</button>
    </div>
  </div>
</div>

<script>
// --- State ---
const state = {
  files: [],
  activeFileId: null,
  fileCounter: 0,
  sidebarOpen: true,
};

const LANG_NAMES = { javascript:'JavaScript', python:'Python', roadc:'RoadC', bash:'Bash', html:'HTML', css:'CSS' };

// --- File management ---
function createFile(name, language, code) {
  const id = ++state.fileCounter;
  const file = { id, name: name || ('untitled-' + id), language: language || 'javascript', code: code || '' };
  state.files.push(file);
  state.activeFileId = id;
  renderTabs();
  loadFile(id);
  return file;
}

function loadFile(id) {
  const file = state.files.find(f => f.id === id);
  if (!file) return;
  state.activeFileId = id;
  document.getElementById('editor').value = file.code;
  document.getElementById('langSelect').value = file.language;
  renderTabs();
  updateHighlight();
  updateLineNumbers();
  updateStatus();
}

function closeFile(id) {
  const idx = state.files.findIndex(f => f.id === id);
  if (idx === -1) return;
  state.files.splice(idx, 1);
  if (state.files.length === 0) {
    createFile();
  } else if (state.activeFileId === id) {
    loadFile(state.files[Math.min(idx, state.files.length - 1)].id);
  } else {
    renderTabs();
  }
}

function getActiveFile() {
  return state.files.find(f => f.id === state.activeFileId);
}

function newFile() {
  createFile();
}

// --- Tabs ---
function renderTabs() {
  const el = document.getElementById('tabs');
  el.innerHTML = state.files.map(f => {
    const active = f.id === state.activeFileId ? ' active' : '';
    return '<div class="tab' + active + '" onclick="loadFile(' + f.id + ')">' +
      '<span>' + escHtml(f.name) + '</span>' +
      (state.files.length > 1 ? '<span class="tab-close" onclick="event.stopPropagation();closeFile(' + f.id + ')">x</span>' : '') +
      '</div>';
  }).join('');
}

// --- Editor ---
const editor = document.getElementById('editor');
const highlight = document.getElementById('editorHighlight');
const lineNumbers = document.getElementById('lineNumbers');

editor.addEventListener('input', () => {
  const file = getActiveFile();
  if (file) file.code = editor.value;
  updateHighlight();
  updateLineNumbers();
  updateStatus();
});

editor.addEventListener('scroll', () => {
  highlight.scrollTop = editor.scrollTop;
  highlight.scrollLeft = editor.scrollLeft;
  lineNumbers.scrollTop = editor.scrollTop;
});

editor.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const val = editor.value;
    editor.value = val.substring(0, start) + '  ' + val.substring(end);
    editor.selectionStart = editor.selectionEnd = start + 2;
    editor.dispatchEvent(new Event('input'));
  }
  // Ctrl/Cmd+S to save
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    showSaveDialog();
  }
  // Ctrl/Cmd+Enter to run
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    runCode();
  }
});

editor.addEventListener('click', updateStatus);
editor.addEventListener('keyup', updateStatus);

function updateLineNumbers() {
  const lines = editor.value.split('\\n').length;
  let html = '';
  for (let i = 1; i <= lines; i++) html += i + '\\n';
  lineNumbers.textContent = html;
}

function updateStatus() {
  const val = editor.value;
  const lines = val.split('\\n').length;
  const pos = editor.selectionStart;
  const upToCursor = val.substring(0, pos);
  const ln = upToCursor.split('\\n').length;
  const file = getActiveFile();
  document.getElementById('statusLang').textContent = LANG_NAMES[file ? file.language : 'javascript'] || 'Unknown';
  document.getElementById('statusLines').textContent = 'Ln ' + ln + '/' + lines;
  document.getElementById('statusChars').textContent = val.length + ' chars';
}

// --- Syntax Highlighting ---
function updateHighlight() {
  const code = editor.value;
  const file = getActiveFile();
  const lang = file ? file.language : 'javascript';
  highlight.innerHTML = highlightCode(code, lang) + '\\n';
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function highlightCode(code, lang) {
  let escaped = escHtml(code);

  // Comments
  if (lang === 'javascript' || lang === 'css' || lang === 'roadc') {
    escaped = escaped.replace(/(\/\\/[^\\n]*)/g, '<span class="hl-comment">$1</span>');
    escaped = escaped.replace(/(\/\\*[\\s\\S]*?\\*\\/)/g, '<span class="hl-comment">$1</span>');
  } else if (lang === 'python' || lang === 'bash') {
    escaped = escaped.replace(/(#[^\\n]*)/g, '<span class="hl-comment">$1</span>');
  } else if (lang === 'html') {
    escaped = escaped.replace(/(&lt;!--[\\s\\S]*?--&gt;)/g, '<span class="hl-comment">$1</span>');
  }

  // Strings
  escaped = escaped.replace(/(&quot;(?:[^&]|&(?!quot;))*?&quot;)/g, '<span class="hl-string">$1</span>');
  escaped = escaped.replace(/(&#x27;(?:[^&]|&(?!#x27;))*?&#x27;)/g, '<span class="hl-string">$1</span>');
  escaped = escaped.replace(/(\`[^\`]*?\`)/g, '<span class="hl-string">$1</span>');

  // Numbers
  escaped = escaped.replace(/\\b(\\d+\\.?\\d*)\\b/g, '<span class="hl-number">$1</span>');

  // Keywords by language
  let keywords = [];
  if (lang === 'javascript') {
    keywords = ['const','let','var','function','return','if','else','for','while','do','switch','case','break','continue','new','this','class','extends','import','export','default','from','async','await','try','catch','finally','throw','typeof','instanceof','in','of','true','false','null','undefined','yield','void','delete','super','static','get','set'];
  } else if (lang === 'python') {
    keywords = ['def','class','if','elif','else','for','while','return','import','from','as','try','except','finally','raise','with','yield','lambda','pass','break','continue','and','or','not','in','is','True','False','None','global','nonlocal','assert','del','print','self'];
  } else if (lang === 'roadc') {
    keywords = ['road','ship','cruise','check','if','else','loop','fn','return','true','false','null','pipe','gear','park'];
  } else if (lang === 'bash') {
    keywords = ['if','then','else','elif','fi','for','while','do','done','case','esac','function','return','echo','exit','export','source','local','readonly','declare','set','unset','shift','trap','eval','exec','read','test','cd','ls','grep','awk','sed','cat'];
  } else if (lang === 'html') {
    keywords = ['div','span','html','head','body','title','meta','link','script','style','p','a','img','h1','h2','h3','h4','h5','h6','ul','ol','li','table','tr','td','th','form','input','button','select','option','textarea','section','article','nav','header','footer','main'];
  } else if (lang === 'css') {
    keywords = ['color','background','margin','padding','border','display','flex','grid','position','top','left','right','bottom','width','height','font','text','align','justify','overflow','opacity','transition','transform','animation','box','shadow','cursor','z-index'];
  }

  if (keywords.length) {
    const kw = keywords.join('|');
    const re = new RegExp('\\\\b(' + kw + ')\\\\b', 'g');
    escaped = escaped.replace(re, '<span class="hl-keyword">$1</span>');
  }

  // Built-in functions
  escaped = escaped.replace(/\\b(console|document|window|Math|JSON|Array|Object|String|Number|Date|Promise|fetch|setTimeout|setInterval|parseInt|parseFloat|require|module|process|Buffer|Response|Request|URL|Headers|addEventListener)\\b/g, '<span class="hl-builtin">$1</span>');

  // Function calls
  escaped = escaped.replace(/\\b(\\w+)(?=\\()/g, '<span class="hl-function">$1</span>');

  return escaped;
}

// --- Language ---
function changeLanguage(lang) {
  const file = getActiveFile();
  if (file) file.language = lang;
  updateHighlight();
  updateStatus();
}

// --- Run ---
async function runCode() {
  const file = getActiveFile();
  if (!file) return;
  const output = document.getElementById('outputContent');
  output.className = 'output-content';
  output.textContent = 'Running...';
  try {
    const res = await fetch('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: file.code, language: file.language }),
    });
    const data = await res.json();
    output.textContent = data.output || '(no output)';
    output.className = 'output-content ' + (data.success !== false ? 'output-success' : 'output-error');
  } catch (e) {
    output.textContent = 'Error: ' + e.message;
    output.className = 'output-content output-error';
  }
}

// --- Review ---
async function reviewCode() {
  const file = getActiveFile();
  if (!file) return;
  const output = document.getElementById('outputContent');
  output.className = 'output-content';
  output.textContent = 'Reviewing...';
  try {
    const res = await fetch('/api/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: file.code, language: file.language }),
    });
    const data = await res.json();
    const lines = data.feedback.map(f => {
      const prefix = f.type === 'error' ? '[ERROR]' : f.type === 'warn' ? '[WARN]' : '[INFO]';
      return prefix + ' ' + f.message;
    });
    output.textContent = 'Code Review:\\n' + lines.join('\\n');
    output.className = 'output-content output-success';
  } catch (e) {
    output.textContent = 'Review error: ' + e.message;
    output.className = 'output-content output-error';
  }
}

// --- Save ---
function showSaveDialog() {
  const file = getActiveFile();
  document.getElementById('snippetName').value = file ? file.name : '';
  document.getElementById('saveModal').classList.add('open');
  setTimeout(() => document.getElementById('snippetName').focus(), 50);
}

function closeSaveDialog() {
  document.getElementById('saveModal').classList.remove('open');
}

async function saveSnippet() {
  const file = getActiveFile();
  if (!file) return;
  const name = document.getElementById('snippetName').value.trim() || file.name;
  file.name = name;
  renderTabs();
  try {
    const res = await fetch('/api/snippets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, language: file.language, code: file.code }),
    });
    const data = await res.json();
    closeSaveDialog();
    loadSnippets();
    const output = document.getElementById('outputContent');
    output.textContent = 'Saved: ' + name;
    output.className = 'output-content output-success';
  } catch (e) {
    const output = document.getElementById('outputContent');
    output.textContent = 'Save failed: ' + e.message;
    output.className = 'output-content output-error';
  }
}

document.getElementById('saveModal').addEventListener('click', (e) => {
  if (e.target.id === 'saveModal') closeSaveDialog();
});

document.getElementById('snippetName').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') saveSnippet();
  if (e.key === 'Escape') closeSaveDialog();
});

// --- Snippets sidebar ---
async function loadSnippets() {
  try {
    const res = await fetch('/api/snippets');
    const data = await res.json();
    const list = document.getElementById('snippetList');
    if (!data.snippets || data.snippets.length === 0) {
      list.innerHTML = '<div class="sidebar-empty">No saved snippets yet.<br>Save your code to see it here.</div>';
      return;
    }
    list.innerHTML = data.snippets.map(s =>
      '<div class="sidebar-item" onclick="openSnippet(' + JSON.stringify(JSON.stringify(s)).slice(1,-1) + ')">' +
        '<span class="sidebar-item-name">' + escHtml(s.name) + '</span>' +
        '<span class="sidebar-item-meta">' + (LANG_NAMES[s.language] || s.language) + ' - ' + s.code.length + ' chars</span>' +
      '</div>'
    ).join('');
  } catch (e) {
    console.error('Failed to load snippets:', e);
  }
}

function openSnippet(snippetJson) {
  const s = JSON.parse(snippetJson);
  const file = createFile(s.name, s.language, s.code);
}

// --- Templates ---
function toggleTemplateMenu() {
  const menu = document.getElementById('templateMenu');
  menu.classList.toggle('open');
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.template-dropdown')) {
    document.getElementById('templateMenu').classList.remove('open');
  }
});

async function loadTemplates() {
  try {
    const res = await fetch('/api/templates');
    const data = await res.json();
    const menu = document.getElementById('templateMenu');
    menu.innerHTML = data.templates.map(t =>
      '<div class="template-option" onclick="applyTemplate(\\'' + t.id + '\\')">' + escHtml(t.name) + '</div>'
    ).join('');
  } catch (e) {
    console.error('Failed to load templates:', e);
  }
}

async function applyTemplate(id) {
  try {
    const res = await fetch('/api/templates');
    const data = await res.json();
    const t = data.templates.find(t => t.id === id);
    if (t) {
      createFile(t.name, t.language, t.code);
    }
  } catch (e) {
    console.error('Template error:', e);
  }
  document.getElementById('templateMenu').classList.remove('open');
}

// --- Sidebar toggle ---
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  if (window.innerWidth <= 768) {
    sb.classList.toggle('mobile-open');
  } else {
    sb.style.display = sb.style.display === 'none' ? 'flex' : 'none';
  }
}

// --- Output resize ---
(function() {
  const resizer = document.getElementById('outputResizer');
  const panel = document.getElementById('outputPanel');
  let startY, startH;
  resizer.addEventListener('mousedown', (e) => {
    startY = e.clientY;
    startH = panel.offsetHeight;
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    e.preventDefault();
  });
  function onMove(e) {
    const diff = startY - e.clientY;
    panel.style.height = Math.max(60, Math.min(500, startH + diff)) + 'px';
  }
  function onUp() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  }
})();

// --- Clear output ---
function clearOutput() {
  const output = document.getElementById('outputContent');
  output.textContent = 'Ready.';
  output.className = 'output-content';
}

// --- Init ---
createFile('untitled-1', 'javascript', '// Welcome to RoadCode\\n// Write it. Ship it. From anywhere.\\n\\nfunction hello(name) {\\n  console.log("Hello, " + name + "!");\\n  return "Welcome to RoadCode";\\n}\\n\\nhello("World");\\n');
loadSnippets();
loadTemplates();
window.addEventListener('message',function(e){if(e.data</script></script>e.data.type==='blackroad-os:context'){window._osUser=e.data.user;window._osToken=e.data.token;}});if(window.parent!==window)window.parent.postMessage({type:'blackroad-os:request-context'},'*');
</script>
</body>
</html>`;
}

// --- Main handler ---
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const origin = request.headers.get('Origin') || '';

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (path === '/sitemap.xml') {
      const tplUrls = RC_TEMPLATES.map(t => `  <url><loc>https://roadcode.blackroad.io/templates/${t.slug}</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`).join('\n');
      return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://roadcode.blackroad.io/</loc><lastmod>2026-04-05</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>\n  <url><loc>https://roadcode.blackroad.io/templates</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n${tplUrls}\n</urlset>`, { headers: { 'Content-Type': 'application/xml' } });
    }

    if (path === '/robots.txt') {
      return new Response(`User-agent: *\nAllow: /\nSitemap: https://roadcode.blackroad.io/sitemap.xml\n\nUser-agent: GPTBot\nDisallow: /\n\nUser-agent: ChatGPT-User\nDisallow: /\n\nUser-agent: CCBot\nDisallow: /`, { headers: { 'Content-Type': 'text/plain' } });
    }

    // Init D1 tables
    if (env.DB && path.startsWith('/api/')) {
      await env.DB.batch([
        env.DB.prepare(`CREATE TABLE IF NOT EXISTS rc_projects (
          id TEXT PRIMARY KEY, name TEXT NOT NULL, language TEXT DEFAULT 'javascript',
          description TEXT, owner TEXT DEFAULT 'anonymous', is_public INTEGER DEFAULT 0,
          created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
        )`),
        env.DB.prepare(`CREATE TABLE IF NOT EXISTS rc_files (
          id TEXT PRIMARY KEY, project_id TEXT NOT NULL, path TEXT NOT NULL,
          content TEXT DEFAULT '', language TEXT, size INTEGER DEFAULT 0,
          version INTEGER DEFAULT 1, created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )`),
        env.DB.prepare(`CREATE TABLE IF NOT EXISTS rc_executions (
          id TEXT PRIMARY KEY, project_id TEXT, language TEXT, code TEXT,
          stdout TEXT, stderr TEXT, exit_code INTEGER DEFAULT 0, duration_ms INTEGER,
          created_at TEXT DEFAULT (datetime('now'))
        )`),
        env.DB.prepare(`CREATE TABLE IF NOT EXISTS rc_deploys (
          id TEXT PRIMARY KEY, project_id TEXT NOT NULL, target TEXT DEFAULT 'cloudflare',
          status TEXT DEFAULT 'pending', url TEXT, created_at TEXT DEFAULT (datetime('now'))
        )`),
        env.DB.prepare(`CREATE TABLE IF NOT EXISTS rc_snippets (
          id TEXT PRIMARY KEY, title TEXT NOT NULL, language TEXT DEFAULT 'javascript',
          code TEXT NOT NULL, tags TEXT DEFAULT '[]', owner TEXT DEFAULT 'community',
          is_public INTEGER DEFAULT 1, created_at TEXT DEFAULT (datetime('now'))
        )`),
      ]);
    }

    const db = env.DB;

    // ─── D1-backed API routes ───
    if (path.startsWith('/api/') && db) {
      // Projects CRUD
      if (path === '/api/projects' && method === 'POST') {
        const body = await request.json();
        if (!body.name) return json({ error: 'name required' }, 400, origin);
        const id = crypto.randomUUID();
        await db.prepare('INSERT INTO rc_projects (id, name, language, description, owner) VALUES (?, ?, ?, ?, ?)')
          .bind(id, body.name, body.language || 'javascript', body.description || '', body.owner || 'anonymous').run();
        return json({ ok: true, id, name: body.name }, 201, origin);
      }

      if (path === '/api/projects' && method === 'GET') {
        const owner = url.searchParams.get('owner');
        let q = 'SELECT * FROM rc_projects';
        const params = [];
        if (owner) { q += ' WHERE owner = ?'; params.push(owner); }
        q += ' ORDER BY updated_at DESC LIMIT 50';
        const result = await db.prepare(q).bind(...params).all();
        return json({ projects: result.results || [] }, 200, origin);
      }

      const projMatch = path.match(/^\/api\/projects\/([^/]+)$/);
      if (projMatch && method === 'GET') {
        const proj = await db.prepare('SELECT * FROM rc_projects WHERE id = ?').bind(projMatch[1]).first();
        if (!proj) return json({ error: 'Project not found' }, 404, origin);
        const files = await db.prepare('SELECT id, path, language, size, version, updated_at FROM rc_files WHERE project_id = ? ORDER BY path').bind(projMatch[1]).all();
        return json({ project: proj, files: files.results || [] }, 200, origin);
      }

      if (projMatch && method === 'DELETE') {
        await db.prepare('DELETE FROM rc_files WHERE project_id = ?').bind(projMatch[1]).run();
        await db.prepare('DELETE FROM rc_projects WHERE id = ?').bind(projMatch[1]).run();
        return json({ ok: true, deleted: projMatch[1] }, 200, origin);
      }

      // Files CRUD
      const filesMatch = path.match(/^\/api\/projects\/([^/]+)\/files$/);
      if (filesMatch && method === 'POST') {
        const body = await request.json();
        if (!body.path) return json({ error: 'path required' }, 400, origin);
        const content = body.content || '';
        const existing = await db.prepare('SELECT id, version FROM rc_files WHERE project_id = ? AND path = ?').bind(filesMatch[1], body.path).first();
        if (existing) {
          await db.prepare("UPDATE rc_files SET content = ?, size = ?, version = version + 1, language = ?, updated_at = datetime('now') WHERE id = ?")
            .bind(content, content.length, body.language || 'javascript', existing.id).run();
          return json({ ok: true, id: existing.id, version: existing.version + 1, action: 'updated' }, 200, origin);
        }
        const id = crypto.randomUUID();
        await db.prepare('INSERT INTO rc_files (id, project_id, path, content, language, size) VALUES (?, ?, ?, ?, ?, ?)')
          .bind(id, filesMatch[1], body.path, content, body.language || 'javascript', content.length).run();
        await db.prepare("UPDATE rc_projects SET updated_at = datetime('now') WHERE id = ?").bind(filesMatch[1]).run();
        return json({ ok: true, id, action: 'created' }, 201, origin);
      }

      if (filesMatch && method === 'GET') {
        const files = await db.prepare('SELECT id, path, language, size, version, updated_at FROM rc_files WHERE project_id = ? ORDER BY path').bind(filesMatch[1]).all();
        return json({ files: files.results || [] }, 200, origin);
      }

      // Single file
      const fileMatch = path.match(/^\/api\/projects\/([^/]+)\/files\/(.+)$/);
      if (fileMatch && method === 'GET') {
        const file = await db.prepare('SELECT * FROM rc_files WHERE project_id = ? AND path = ?').bind(fileMatch[1], decodeURIComponent(fileMatch[2])).first();
        if (!file) return json({ error: 'File not found' }, 404, origin);
        return json({ file }, 200, origin);
      }

      if (fileMatch && method === 'DELETE') {
        await db.prepare('DELETE FROM rc_files WHERE project_id = ? AND path = ?').bind(fileMatch[1], decodeURIComponent(fileMatch[2])).run();
        return json({ ok: true }, 200, origin);
      }

      // AI Code Completion
      if (path === '/api/ai/complete' && method === 'POST') {
        const body = await request.json();
        if (!body.code) return json({ error: 'code required' }, 400, origin);
        try {
          const result = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
            messages: [
              { role: 'system', content: 'You are a code completion assistant. Given partial code, complete it naturally. Return ONLY the completed code, no explanations.' },
              { role: 'user', content: `Complete this ${body.language || 'javascript'} code:\n\n${body.code}` },
            ],
            max_tokens: 500,
          });
          return json({ completion: result.response, language: body.language }, 200, origin);
        } catch { return json({ completion: '// AI completion unavailable', error: 'AI service unavailable' }, 200, origin); }
      }

      // AI Code Review (enhanced)
      if (path === '/api/ai/review' && method === 'POST') {
        const body = await request.json();
        if (!body.code) return json({ error: 'code required' }, 400, origin);
        try {
          const result = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
            messages: [
              { role: 'system', content: 'You are a code reviewer. Analyze the code for bugs, security issues, performance problems, and style. Return a JSON object: {"issues": [{"type": "bug|security|performance|style", "line": number, "message": "..."}], "score": 1-10, "summary": "..."}. Return ONLY valid JSON.' },
              { role: 'user', content: `Review this ${body.language || 'javascript'} code:\n\n${body.code}` },
            ],
            max_tokens: 800,
          });
          try { return json(JSON.parse(result.response), 200, origin); }
          catch { return json({ summary: result.response, issues: [], score: 7 }, 200, origin); }
        } catch { return json({ summary: 'AI review unavailable', issues: [], score: null }, 200, origin); }
      }

      // AI Code Explanation
      if (path === '/api/ai/explain' && method === 'POST') {
        const body = await request.json();
        if (!body.code) return json({ error: 'code required' }, 400, origin);
        try {
          const result = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
            messages: [
              { role: 'system', content: 'Explain this code clearly and concisely. What does it do? How does it work? Any notable patterns?' },
              { role: 'user', content: `Explain this ${body.language || 'javascript'} code:\n\n${body.code}` },
            ],
            max_tokens: 600,
          });
          return json({ explanation: result.response, language: body.language }, 200, origin);
        } catch { return json({ explanation: 'AI explanation unavailable' }, 200, origin); }
      }

      // Deploy
      if (path === '/api/deploy' && method === 'POST') {
        const body = await request.json();
        if (!body.project_id) return json({ error: 'project_id required' }, 400, origin);
        const id = crypto.randomUUID();
        const target = body.target || 'cloudflare';
        await db.prepare('INSERT INTO rc_deploys (id, project_id, target, status) VALUES (?, ?, ?, ?)')
          .bind(id, body.project_id, target, 'queued').run();
        return json({ ok: true, deploy_id: id, project_id: body.project_id, target, status: 'queued' }, 201, origin);
      }

      if (path === '/api/deploys' && method === 'GET') {
        const projectId = url.searchParams.get('project_id');
        let q = 'SELECT * FROM rc_deploys';
        const params = [];
        if (projectId) { q += ' WHERE project_id = ?'; params.push(projectId); }
        q += ' ORDER BY created_at DESC LIMIT 20';
        const result = await db.prepare(q).bind(...params).all();
        return json({ deploys: result.results || [] }, 200, origin);
      }

      // D1-backed snippets (replace in-memory)
      if (path === '/api/snippets' && method === 'GET') {
        const result = await db.prepare('SELECT * FROM rc_snippets WHERE is_public = 1 ORDER BY created_at DESC LIMIT 50').all();
        return json({ snippets: result.results || [] }, 200, origin);
      }

      if (path === '/api/snippets' && method === 'POST') {
        const body = await request.json();
        if (!body.title || !body.code) return json({ error: 'title and code required' }, 400, origin);
        const id = crypto.randomUUID();
        await db.prepare('INSERT INTO rc_snippets (id, title, language, code, tags, owner) VALUES (?, ?, ?, ?, ?, ?)')
          .bind(id, body.title, body.language || 'javascript', body.code, JSON.stringify(body.tags || []), body.owner || 'community').run();
        return json({ ok: true, id }, 201, origin);
      }

      // Share project
      const shareMatch = path.match(/^\/api\/projects\/([^/]+)\/share$/);
      if (shareMatch && method === 'POST') {
        await db.prepare('UPDATE rc_projects SET is_public = 1 WHERE id = ?').bind(shareMatch[1]).run();
        return json({ ok: true, shared: shareMatch[1], url: `https://roadcode.blackroad.io/p/${shareMatch[1]}` }, 200, origin);
      }

      // AI Fix
      if (path === '/api/ai/fix' && method === 'POST') {
        const body = await request.json();
        if (!body.code || !body.error) return json({ error: 'code and error required' }, 400, origin);
        try {
          const result = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
            messages: [
              { role: 'system', content: 'You are a code debugging assistant. Given code and an error message, provide the FIXED code. Return ONLY the corrected code, no explanations.' },
              { role: 'user', content: `Language: ${body.language || 'javascript'}\nError: ${body.error}\n\nCode:\n${body.code}` },
            ],
            max_tokens: 800,
          });
          return json({ fixed_code: result.response, original_error: body.error }, 200, origin);
        } catch { return json({ error: 'AI unavailable' }, 200, origin); }
      }

      // AI Refactor
      if (path === '/api/ai/refactor' && method === 'POST') {
        const body = await request.json();
        if (!body.code) return json({ error: 'code required' }, 400, origin);
        try {
          const result = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
            messages: [
              { role: 'system', content: 'You are a code refactoring assistant. Refactor the given code according to the instruction. Return ONLY the refactored code.' },
              { role: 'user', content: `Language: ${body.language || 'javascript'}\nInstruction: ${body.instruction || 'Make it cleaner and more efficient'}\n\nCode:\n${body.code}` },
            ],
            max_tokens: 800,
          });
          return json({ refactored_code: result.response, instruction: body.instruction }, 200, origin);
        } catch { return json({ error: 'AI unavailable' }, 200, origin); }
      }

      // Version snapshots
      const versionsMatch = path.match(/^\/api\/projects\/([^/]+)\/versions$/);
      if (versionsMatch && method === 'POST') {
        await db.prepare("CREATE TABLE IF NOT EXISTS rc_versions (id TEXT PRIMARY KEY, project_id TEXT, version INTEGER, files TEXT, message TEXT, created_at TEXT DEFAULT (datetime('now')))").run();
        const files = await db.prepare('SELECT path, content FROM rc_files WHERE project_id = ?').bind(versionsMatch[1]).all();
        const maxVer = await db.prepare('SELECT MAX(version) as v FROM rc_versions WHERE project_id = ?').bind(versionsMatch[1]).first();
        const ver = (maxVer?.v || 0) + 1;
        const body = await request.json().catch(() => ({}));
        const id = crypto.randomUUID();
        await db.prepare('INSERT INTO rc_versions (id, project_id, version, files, message) VALUES (?, ?, ?, ?, ?)').bind(id, versionsMatch[1], ver, JSON.stringify(files.results || []), body.message || `Version ${ver}`).run();
        return json({ id, version: ver, files: (files.results || []).length }, 201, origin);
      }
      if (versionsMatch && method === 'GET') {
        await db.prepare("CREATE TABLE IF NOT EXISTS rc_versions (id TEXT PRIMARY KEY, project_id TEXT, version INTEGER, files TEXT, message TEXT, created_at TEXT DEFAULT (datetime('now')))").run();
        const result = await db.prepare('SELECT id, version, message, created_at FROM rc_versions WHERE project_id = ? ORDER BY version DESC').bind(versionsMatch[1]).all();
        return json({ versions: result.results || [] }, 200, origin);
      }

      // Diff
      const diffMatch = path.match(/^\/api\/projects\/([^/]+)\/diff\/(\d+)\/(\d+)$/);
      if (diffMatch && method === 'GET') {
        await db.prepare("CREATE TABLE IF NOT EXISTS rc_versions (id TEXT PRIMARY KEY, project_id TEXT, version INTEGER, files TEXT, message TEXT, created_at TEXT DEFAULT (datetime('now')))").run();
        const v1 = await db.prepare('SELECT files FROM rc_versions WHERE project_id = ? AND version = ?').bind(diffMatch[1], parseInt(diffMatch[2])).first();
        const v2 = await db.prepare('SELECT files FROM rc_versions WHERE project_id = ? AND version = ?').bind(diffMatch[1], parseInt(diffMatch[3])).first();
        if (!v1 || !v2) return json({ error: 'Version not found' }, 404, origin);
        const f1 = JSON.parse(v1.files || '[]'), f2 = JSON.parse(v2.files || '[]');
        const diff = [];
        const paths1 = new Set(f1.map(f => f.path)), paths2 = new Set(f2.map(f => f.path));
        for (const f of f2) {
          const old = f1.find(o => o.path === f.path);
          if (!old) diff.push({ path: f.path, type: 'added' });
          else if (old.content !== f.content) diff.push({ path: f.path, type: 'modified' });
        }
        for (const f of f1) { if (!paths2.has(f.path)) diff.push({ path: f.path, type: 'deleted' }); }
        return json({ project_id: diffMatch[1], v1: parseInt(diffMatch[2]), v2: parseInt(diffMatch[3]), changes: diff }, 200, origin);
      }

      // Stats
      if (path === '/api/stats') {
        const projects = await db.prepare('SELECT COUNT(*) as c FROM rc_projects').first();
        const files = await db.prepare('SELECT COUNT(*) as c FROM rc_files').first();
        const totalSize = await db.prepare('SELECT COALESCE(SUM(size), 0) as s FROM rc_files').first();
        const deploys = await db.prepare('SELECT COUNT(*) as c FROM rc_deploys').first();
        const snippets = await db.prepare('SELECT COUNT(*) as c FROM rc_snippets').first();
        return json({
          projects: projects.c, files: files.c, total_lines: Math.round((totalSize.s || 0) / 40),
          deploys: deploys.c, snippets: snippets.c,
        }, 200, origin);
      }
    }

    // ─── Template content pages (SEO) ───
    if (path === '/templates') {
      const cats = {};
      RC_TEMPLATES.forEach(t => { (cats[t.category] = cats[t.category] || []).push(t); });
      const listing = Object.entries(cats).map(([cat, items]) =>
        `<div style="margin-bottom:32px"><h2 style="font-size:18px;font-weight:700;margin-bottom:12px;color:#f5f5f5">${cat}</h2><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">${items.map(t => `<a href="/templates/${t.slug}" style="display:block;background:#0a0a0a;border:1px solid #1a1a1a;border-radius:8px;padding:16px;text-decoration:none;transition:border-color .2s"><div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><span style="font-size:14px;font-weight:600;color:#f5f5f5">${t.name}</span><span style="font-size:10px;padding:2px 8px;border-radius:10px;background:#4488ff22;color:#4488ff;font-family:monospace">${t.language}</span><span style="font-size:10px;padding:2px 8px;border-radius:10px;background:${t.difficulty==='Beginner'?'#22c55e22':'#f5a62322'};color:${t.difficulty==='Beginner'?'#22c55e':'#f5a623'}">${t.difficulty}</span></div><p style="font-size:12px;color:#737373;line-height:1.5">${t.description}</p></a>`).join('')}</div></div>`
      ).join('');
      const pageHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Coding Templates - RoadCode by BlackRoad OS</title><meta name="description" content="Browse 22+ starter templates for React, Next.js, Express, Flask, Django, Cloudflare Workers, CLI tools, Discord bots, and more. Start coding instantly in your browser."><meta property="og:title" content="Coding Templates - RoadCode"><meta property="og:description" content="22+ starter templates. React, Next.js, Express, Flask, Django, and more. Code in your browser."><meta property="og:url" content="https://roadcode.blackroad.io/templates"><meta property="og:image" content="https://images.blackroad.io/pixel-art/road-logo.png"><meta name="twitter:card" content="summary_large_image"><link rel="canonical" href="https://roadcode.blackroad.io/templates"><script type="application/ld+json">{"@context":"https://schema.org","@type":"CollectionPage","name":"Coding Templates","url":"https://roadcode.blackroad.io/templates","description":"Browse 22+ starter templates for web apps, APIs, bots, and DevOps.","publisher":{"@type":"Organization","name":"BlackRoad OS, Inc."}}</script><link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#000;color:#f5f5f5;font-family:'Space Grotesk',sans-serif}a{color:inherit}a:hover{border-color:#333 !important}.bar{height:3px;background:linear-gradient(90deg,#FF6B2B,#FF2255,#CC00AA,#8844FF,#4488FF,#00D4FF);position:fixed;top:0;left:0;right:0;z-index:1000}nav{position:fixed;top:3px;left:0;right:0;z-index:999;background:rgba(0,0,0,.92);backdrop-filter:blur(20px);border-bottom:1px solid #1a1a1a;height:48px;display:flex;align-items:center;padding:0 24px;gap:16px}nav a{font-size:12px;color:#737373}nav a:hover{color:#f5f5f5}.container{max-width:960px;margin:0 auto;padding:80px 24px 48px}</style></head><body><div class="bar"></div><nav><a href="/" style="font-weight:700;font-size:15px;color:#f5f5f5">RoadCode</a><a href="/templates" style="color:#f5f5f5">Templates</a><a href="https://blackroad.io">Highway</a><a href="https://app.blackroad.io" style="padding:6px 14px;border-radius:5px;background:#f5f5f5;color:#000;font-weight:600;font-size:11px">Open OS</a></nav><div class="container"><h1 style="font-size:clamp(24px,5vw,40px);font-weight:700;margin-bottom:8px">Coding Templates</h1><p style="color:#737373;margin-bottom:32px;max-width:600px;line-height:1.6">Start from a working template. Pick a stack, customize it, and ship from your browser.</p>${listing}</div><script>(function(){var d={path:location.pathname,ref:document.referrer,w:screen.width,h:screen.height,t:Date.now()};navigator.sendBeacon&&navigator.sendBeacon('/api/analytics',JSON.stringify(d))})()</script></body></html>`;
      return new Response(pageHtml, { headers: { 'Content-Type': 'text/html;charset=UTF-8', ...securityHeaders() } });
    }

    const tplMatch = path.match(/^\/templates\/([a-z0-9-]+)$/);
    if (tplMatch) {
      const tpl = RC_TEMPLATES.find(t => t.slug === tplMatch[1]);
      if (!tpl) return new Response('Template not found', { status: 404 });
      const related = RC_TEMPLATES.filter(t => t.category === tpl.category && t.slug !== tpl.slug).slice(0, 4);
      const tplHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${tpl.name} Template - RoadCode by BlackRoad OS</title><meta name="description" content="${tpl.description} Start coding ${tpl.name} in your browser with RoadCode."><meta property="og:title" content="${tpl.name} Template - RoadCode"><meta property="og:description" content="${tpl.description}"><meta property="og:url" content="https://roadcode.blackroad.io/templates/${tpl.slug}"><meta property="og:image" content="https://images.blackroad.io/pixel-art/road-logo.png"><meta name="twitter:card" content="summary"><link rel="canonical" href="https://roadcode.blackroad.io/templates/${tpl.slug}"><script type="application/ld+json">{"@context":"https://schema.org","@type":"SoftwareSourceCode","name":"${tpl.name}","programmingLanguage":"${tpl.language}","description":"${tpl.description}","codeRepository":"https://roadcode.blackroad.io/templates/${tpl.slug}","author":{"@type":"Organization","name":"BlackRoad OS, Inc."}}</script><link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#000;color:#f5f5f5;font-family:'Space Grotesk',sans-serif}a{color:inherit}.bar{height:3px;background:linear-gradient(90deg,#FF6B2B,#FF2255,#CC00AA,#8844FF,#4488FF,#00D4FF);position:fixed;top:0;left:0;right:0;z-index:1000}nav{position:fixed;top:3px;left:0;right:0;z-index:999;background:rgba(0,0,0,.92);backdrop-filter:blur(20px);border-bottom:1px solid #1a1a1a;height:48px;display:flex;align-items:center;padding:0 24px;gap:16px}nav a{font-size:12px;color:#737373}nav a:hover{color:#f5f5f5}.container{max-width:720px;margin:0 auto;padding:80px 24px 48px}pre{background:#0a0a0a;border:1px solid #1a1a1a;border-radius:8px;padding:16px;overflow-x:auto;font-family:'JetBrains Mono',monospace;font-size:13px;line-height:1.6;color:#ccc;margin:16px 0}</style></head><body><div class="bar"></div><nav><a href="/" style="font-weight:700;font-size:15px;color:#f5f5f5">RoadCode</a><a href="/templates" style="color:#f5f5f5">Templates</a><a href="https://blackroad.io">Highway</a><a href="https://app.blackroad.io" style="padding:6px 14px;border-radius:5px;background:#f5f5f5;color:#000;font-weight:600;font-size:11px">Open OS</a></nav><div class="container"><a href="/templates" style="font-size:12px;color:#737373;display:inline-block;margin-bottom:16px">&larr; All Templates</a><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px"><h1 style="font-size:28px;font-weight:700">${tpl.name}</h1><span style="font-size:11px;padding:3px 10px;border-radius:10px;background:#4488ff22;color:#4488ff;font-family:'JetBrains Mono',monospace">${tpl.language}</span><span style="font-size:11px;padding:3px 10px;border-radius:10px;background:${tpl.difficulty==='Beginner'?'#22c55e22':'#f5a62322'};color:${tpl.difficulty==='Beginner'?'#22c55e':'#f5a623'}">${tpl.difficulty}</span><span style="font-size:11px;padding:3px 10px;border-radius:10px;background:#8844ff22;color:#8844ff">${tpl.category}</span></div><p style="font-size:15px;color:#737373;line-height:1.6;margin-bottom:24px">${tpl.description}</p><h2 style="font-size:16px;margin-bottom:8px">Features</h2><ul style="list-style:none;margin-bottom:24px">${tpl.features.map(f => `<li style="padding:4px 0;font-size:13px;color:#aaa">&bull; ${f}</li>`).join('')}</ul><h2 style="font-size:16px;margin-bottom:8px">Code Preview</h2><pre>${tpl.codePreview.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre><a href="https://app.blackroad.io" style="display:inline-block;margin-top:24px;padding:12px 28px;border-radius:7px;background:#f5f5f5;color:#000;font-weight:600;font-size:14px;text-decoration:none">Open in RoadCode</a>${related.length ? `<div style="margin-top:48px;border-top:1px solid #1a1a1a;padding-top:24px"><h2 style="font-size:16px;margin-bottom:12px">Related Templates</h2><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">${related.map(r => `<a href="/templates/${r.slug}" style="display:block;background:#0a0a0a;border:1px solid #1a1a1a;border-radius:8px;padding:12px;text-decoration:none"><div style="font-size:13px;font-weight:600;color:#f5f5f5;margin-bottom:4px">${r.name}</div><div style="font-size:11px;color:#737373">${r.language} &middot; ${r.difficulty}</div></a>`).join('')}</div></div>` : ''}</div><script>!function(){var b=document.createElement("div");b.style.cssText="position:fixed;top:0;left:0;right:0;z-index:99999;background:#0a0a0a;border-bottom:1px solid #1a1a1a;padding:6px 16px;display:flex;align-items:center;justify-content:space-between;font-family:sans-serif";b.innerHTML="<span style=\"font-size:11px;color:#737373\">Part of <a href=\"https://os.blackroad.io\" style=\"color:#f5f5f5;font-weight:600;text-decoration:none\">BlackRoad OS<\/a> \u2014 27 AI agents, 17 products<\/span><a href=\"https://os.blackroad.io\" style=\"font-size:10px;font-weight:600;padding:4px 12px;background:#f5f5f5;color:#000;border-radius:4px;text-decoration:none\">Try Free<\/a>";b.id="br-bar";if(!document.getElementById("br-bar")){document.body.prepend(b);document.body.style.paddingTop=(parseInt(getComputedStyle(document.body).paddingTop)||0)+32+"px"}if(!document.querySelector("[data-cta]")){var f=document.createElement("div");f.dataset.cta="1";f.style.cssText="border-top:1px solid #1a1a1a;padding:24px 16px;text-align:center;background:#0a0a0a;margin-top:32px";f.innerHTML="<div style=\"font-size:14px;font-weight:700;color:#f5f5f5;margin-bottom:6px\">BlackRoad OS<\/div><div style=\"font-size:11px;color:#737373;margin-bottom:12px\">17 products. 27 agents. Free to try.<\/div><a href=\"https://os.blackroad.io\" style=\"display:inline-block;padding:8px 24px;background:#f5f5f5;color:#000;border-radius:6px;font-size:12px;font-weight:600;text-decoration:none\">Open BlackRoad OS<\/a>";document.body.appendChild(f)}}();</script>
</body></html>`;
      return new Response(tplHtml, { headers: { 'Content-Type': 'text/html;charset=UTF-8', ...securityHeaders() } });
    }

    // --- Enhanced: Snippet search ---
    if (path === '/api/snippets/search' && request.method === 'GET') {
      if (!env.DB) return json({ results: [] }, 200, origin);
      const q = url.searchParams.get('q') || '';
      const lang = url.searchParams.get('lang');
      let sql = "SELECT * FROM rc_snippets WHERE (title LIKE ? OR description LIKE ? OR tags LIKE ?)";
      const binds = [`%${q}%`, `%${q}%`, `%${q}%`];
      if (lang) { sql += ' AND language = ?'; binds.push(lang); }
      sql += ' ORDER BY stars DESC, created_at DESC LIMIT 50';
      const rows = await env.DB.prepare(sql).bind(...binds).all();
      return json({ results: rows.results, count: rows.results.length }, 200, origin);
    }

    // --- Enhanced: Fork snippet ---
    const forkMatch = path.match(/^\/api\/snippets\/(.+)\/fork$/);
    if (forkMatch && request.method === 'POST') {
      if (!env.DB) return json({ error: 'No DB' }, 500, origin);
      const orig = await env.DB.prepare('SELECT * FROM rc_snippets WHERE id = ?').bind(forkMatch[1]).first();
      if (!orig) return json({ error: 'Not found' }, 404, origin);
      const id = crypto.randomUUID().slice(0, 12);
      await env.DB.prepare("INSERT INTO rc_snippets (id, title, language, code, description, tags, author, fork_of) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(id, `Fork of ${orig.title}`, orig.language, orig.code, orig.description, orig.tags, 'anonymous', forkMatch[1]).run();
      return json({ ok: true, id, forked_from: forkMatch[1] }, 201, origin);
    }

    // --- Enhanced: Star snippet ---
    const starMatch = path.match(/^\/api\/snippets\/(.+)\/star$/);
    if (starMatch && request.method === 'POST') {
      if (!env.DB) return json({ error: 'No DB' }, 500, origin);
      await env.DB.prepare('UPDATE rc_snippets SET stars = stars + 1 WHERE id = ?').bind(starMatch[1]).run();
      return json({ ok: true }, 200, origin);
    }

    // --- Enhanced: Run/Execute code ---
    if (path === '/api/run' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { code, language, snippet_id } = body;
        if (!code) return json({ error: 'code required' }, 400, origin);
        let output = '';
        if (language === 'javascript' || language === 'js') {
          // Safe static analysis — no eval
          const lines = code.split('\n');
          const logs = lines.filter(l => l.trim().startsWith('console.log'));
          output = logs.length > 0 ? logs.map(l => { const m = l.match(/console\.log\((.+)\)/); return m ? m[1].replace(/['"]/g, '') : ''; }).join('\n') : `[${lines.length} lines of JavaScript analyzed]`;
        } else { output = `[${language || 'unknown'} — ${code.split('\n').length} lines — run simulated]`; }
        if (snippet_id && env.DB) { try { await env.DB.prepare('UPDATE rc_snippets SET runs = runs + 1 WHERE id = ?').bind(snippet_id).run(); } catch {} }
        return json({ output, language: language || 'unknown', lines: code.split('\n').length }, 200, origin);
      } catch { return json({ error: 'Invalid request' }, 400, origin); }
    }

    // --- Enhanced: Code review ---
    if (path === '/api/review' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { code, language } = body;
        if (!code) return json({ error: 'code required' }, 400, origin);
        const lines = code.split('\n');
        const issues = [];
        lines.forEach((l, i) => {
          if (l.includes('eval(')) issues.push({ line: i + 1, severity: 'error', msg: 'Avoid eval() — security risk' });
          if (l.includes('innerHTML')) issues.push({ line: i + 1, severity: 'warning', msg: 'innerHTML can cause XSS — use textContent' });
          if (l.match(/\bvar\b/)) issues.push({ line: i + 1, severity: 'info', msg: 'Prefer const/let over var' });
          if (l.length > 120) issues.push({ line: i + 1, severity: 'info', msg: 'Line exceeds 120 chars' });
        });
        const funcs = (code.match(/function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\(/g) || []).length;
        return json({ analysis: { lines: lines.length, functions: funcs, issues, issue_count: issues.length, language: language || 'unknown' } }, 200, origin);
      } catch { return json({ error: 'Invalid request' }, 400, origin); }
    }

    // --- Enhanced: Deploy to edge ---
    if (path === '/api/deploy' && request.method === 'POST') {
      try {
        const body = await request.json();
        if (!body.code || !body.name) return json({ error: 'code and name required' }, 400, origin);
        const codeHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body.code)))).map(b => b.toString(16).padStart(2, '0')).join('');
        const id = crypto.randomUUID().slice(0, 12);
        if (env.DB) {
          await env.DB.prepare("CREATE TABLE IF NOT EXISTS rc_deployments (id TEXT PRIMARY KEY, name TEXT, code_hash TEXT, status TEXT DEFAULT 'deployed', created_at TEXT DEFAULT (datetime('now')))").run();
          await env.DB.prepare('INSERT INTO rc_deployments (id, name, code_hash) VALUES (?, ?, ?)').bind(id, body.name, codeHash).run();
        }
        // Stamp to RoadChain
        try { await fetch('https://roadchain.blackroad.io/api/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ app: 'roadcode', type: 'deploy', data: { name: body.name, hash: codeHash } }) }); } catch {}
        return json({ ok: true, deployment: { id, name: body.name, code_hash: codeHash, status: 'deployed' } }, 201, origin);
      } catch { return json({ error: 'Invalid request' }, 400, origin); }
    }

    // --- Enhanced: Template gallery ---
    if (path === '/api/templates' && request.method === 'GET') {
      const cat = url.searchParams.get('category');
      const lang = url.searchParams.get('language');
      let filtered = RC_TEMPLATES;
      if (cat) filtered = filtered.filter(t => t.category.toLowerCase() === cat.toLowerCase());
      if (lang) filtered = filtered.filter(t => t.language.toLowerCase() === lang.toLowerCase());
      return json({ templates: filtered, total: filtered.length }, 200, origin);
    }

    // ─── Terminal Shell ───
    if (path === '/api/terminal' && method === 'POST') {
      const body = await request.json();
      const cmd = (body.command || '').trim();
      if (!cmd) return json({ error: 'command required' }, 400, origin);
      // Built-in shell commands
      const builtins = {
        'help': 'Available commands: help, ls, cat, pwd, echo, clear, whoami, date, agents, status, roadc <code>',
        'whoami': 'roadie@blackroad-os',
        'pwd': '/home/roadie/projects',
        'date': new Date().toISOString(),
        'clear': '\x1b[2J',
        'agents': '27 agents online. Type: agents list, agents chat <name>',
        'status': 'RoadCode v1.0 | Projects: active | AI: ready | Deploy: enabled',
      };
      const parts = cmd.split(/\s+/);
      const base = parts[0].toLowerCase();
      if (builtins[base]) return json({ output: builtins[base], command: cmd }, 200, origin);
      // ls — list project files
      if (base === 'ls' && db) {
        try {
          const files = await db.prepare("SELECT path FROM rc_files ORDER BY path LIMIT 50").all();
          return json({ output: (files.results || []).map(f => f.path).join('\n') || '(empty)', command: cmd }, 200, origin);
        } catch { return json({ output: '(no projects)', command: cmd }, 200, origin); }
      }
      // cat — read a file
      if (base === 'cat' && parts[1] && db) {
        try {
          const file = await db.prepare("SELECT content FROM rc_files WHERE path = ? LIMIT 1").bind(parts[1]).first();
          return json({ output: file ? file.content : `cat: ${parts[1]}: No such file`, command: cmd }, 200, origin);
        } catch { return json({ output: `cat: error reading ${parts[1]}`, command: cmd }, 200, origin); }
      }
      // echo
      if (base === 'echo') return json({ output: parts.slice(1).join(' '), command: cmd }, 200, origin);
      // roadc — execute RoadC code
      if (base === 'roadc') {
        const code = parts.slice(1).join(' ');
        const result = executeRoadC(code);
        return json({ output: result, command: cmd, language: 'roadc' }, 200, origin);
      }
      // agents chat — talk to an agent
      if (base === 'agents' && parts[1] === 'chat' && parts[2]) {
        try {
          const r = await fetch('https://roadtrip.blackroad.io/api/chat', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agent: parts[2], message: parts.slice(3).join(' ') || 'hello', channel: 'terminal' })
          });
          const d = await r.json();
          return json({ output: `${parts[2]}: ${d.reply?.content || d.response || '...'}`, command: cmd }, 200, origin);
        } catch { return json({ output: 'Agent unavailable', command: cmd }, 200, origin); }
      }
      // agents list
      if (base === 'agents' && parts[1] === 'list') {
        return json({ output: 'roadie lucidia cecilia octavia olympia silas sebastian calliope aria seraphina sapphira lyra thalia alice alexandria sophia gematria theodosia elias portia atticus cicero valeria celeste ophelia gaia anastasia', command: cmd }, 200, origin);
      }
      return json({ output: `${base}: command not found. Type 'help' for available commands.`, command: cmd }, 200, origin);
    }

    // ─── Agent Pair Programming ───
    if (path === '/api/pair' && method === 'POST') {
      const body = await request.json();
      if (!body.code) return json({ error: 'code required' }, 400, origin);
      const agent = body.agent || 'silas';
      const action = body.action || 'review'; // review, suggest, explain, debug, optimize
      const prompts = {
        review: `Review this code. Find bugs, security issues, and improvements. Be specific. 3-5 points.`,
        suggest: `Suggest the next thing to add to this code. One specific feature, with example code.`,
        explain: `Explain this code like I'm a junior developer. What does each part do?`,
        debug: `This code has a bug. Find it and explain the fix.`,
        optimize: `Optimize this code for performance. Show the improved version.`,
      };
      try {
        const aiResp = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
          messages: [
            { role: 'system', content: `You are ${agent}, a coding assistant at BlackRoad OS. ${prompts[action] || prompts.review} Keep it concise.` },
            { role: 'user', content: body.code.slice(0, 2000) }
          ],
          max_tokens: 500
        });
        return json({ agent, action, feedback: aiResp.response || 'No feedback generated', code_length: body.code.length }, 200, origin);
      } catch (e) {
        return json({ agent, action, feedback: 'AI unavailable — try again in a moment', error: e.message }, 200, origin);
      }
    }

    // ─── Git-like Operations ───
    if (path === '/api/git/log' && method === 'GET') {
      if (!db) return json({ error: 'no database' }, 500, origin);
      const projectId = url.searchParams.get('project');
      if (!projectId) return json({ error: 'project param required' }, 400, origin);
      await db.prepare("CREATE TABLE IF NOT EXISTS rc_commits (id TEXT PRIMARY KEY, project_id TEXT, message TEXT, author TEXT DEFAULT 'anonymous', files_changed INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')))").run();
      const commits = await db.prepare('SELECT * FROM rc_commits WHERE project_id = ? ORDER BY created_at DESC LIMIT 20').bind(projectId).all();
      return json({ project: projectId, commits: commits.results || [] }, 200, origin);
    }
    if (path === '/api/git/commit' && method === 'POST') {
      if (!db) return json({ error: 'no database' }, 500, origin);
      const body = await request.json();
      if (!body.project_id || !body.message) return json({ error: 'project_id and message required' }, 400, origin);
      await db.prepare("CREATE TABLE IF NOT EXISTS rc_commits (id TEXT PRIMARY KEY, project_id TEXT, message TEXT, author TEXT DEFAULT 'anonymous', files_changed INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')))").run();
      const id = crypto.randomUUID().slice(0, 12);
      const files = await db.prepare('SELECT COUNT(*) as n FROM rc_files WHERE project_id = ?').bind(body.project_id).first();
      await db.prepare('INSERT INTO rc_commits (id, project_id, message, author, files_changed) VALUES (?,?,?,?,?)').bind(id, body.project_id, body.message, body.author || 'anonymous', files?.n || 0).run();
      return json({ ok: true, commit_id: id }, 201, origin);
    }
    if (path === '/api/git/diff' && method === 'GET') {
      if (!db) return json({ error: 'no database' }, 500, origin);
      const fileId = url.searchParams.get('file');
      if (!fileId) return json({ error: 'file param required' }, 400, origin);
      const file = await db.prepare('SELECT * FROM rc_files WHERE id = ?').bind(fileId).first();
      return json({ file: file ? { path: file.path, version: file.version, size: file.size, language: file.language } : null }, 200, origin);
    }

    // ─── Collaboration ───
    if (path === '/api/collab/share' && method === 'POST') {
      if (!db) return json({ error: 'no database' }, 500, origin);
      const body = await request.json();
      if (!body.project_id) return json({ error: 'project_id required' }, 400, origin);
      await db.prepare("CREATE TABLE IF NOT EXISTS rc_shares (id TEXT PRIMARY KEY, project_id TEXT, shared_with TEXT, permission TEXT DEFAULT 'read', created_at TEXT DEFAULT (datetime('now')))").run();
      const id = crypto.randomUUID().slice(0, 8);
      await db.prepare('INSERT INTO rc_shares (id, project_id, shared_with, permission) VALUES (?,?,?,?)').bind(id, body.project_id, body.shared_with || 'public', body.permission || 'read').run();
      return json({ ok: true, share_id: id, url: `https://roadcode.blackroad.io/shared/${id}` }, 201, origin);
    }
    if (path === '/api/collab/shared' && method === 'GET') {
      if (!db) return json({ error: 'no database' }, 500, origin);
      await db.prepare("CREATE TABLE IF NOT EXISTS rc_shares (id TEXT PRIMARY KEY, project_id TEXT, shared_with TEXT, permission TEXT DEFAULT 'read', created_at TEXT DEFAULT (datetime('now')))").run();
      const shares = await db.prepare('SELECT s.*, p.name as project_name FROM rc_shares s LEFT JOIN rc_projects p ON s.project_id = p.id ORDER BY s.created_at DESC LIMIT 20').all();
      return json({ shares: shares.results || [] }, 200, origin);
    }

    // Legacy API routes (in-memory fallback if no DB)
    if (path.startsWith('/api/')) {
      return handleAPI(path, request, origin);
    }

    // Serve UI
    return new Response(renderUI(), {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        ...securityHeaders(),
      },
    });
  },
};
