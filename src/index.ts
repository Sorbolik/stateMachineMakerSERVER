// State machine API: stores machines as JSON in one D1 table.
// Every request needs `Authorization: Bearer <ADMIN_KEY>`: the database is the owner's only.
//
//   GET    /machines       list   -> [{ id, name, updated }]
//   POST   /machines       create -> { id }
//   GET    /machines/:id   read   -> machine
//   PUT    /machines/:id   update
//   DELETE /machines/:id   delete

import { parseMachine } from "./machine";

type Env = { DB: D1Database; ALLOWED_ORIGINS: string; ADMIN_KEY?: string };

const MAX_BODY = 200_000; // bytes
const MAX_MACHINES = 1000;

const SCHEMA = `CREATE TABLE IF NOT EXISTS machines (
  id      TEXT PRIMARY KEY,
  name    TEXT NOT NULL,
  data    TEXT NOT NULL,
  updated TEXT NOT NULL
)`;

// Creates the table on the first request of each isolate, so a fresh database needs no setup step
let ready: Promise<unknown> | null = null;
const ensureSchema = (db: D1Database) => (ready ??= db.exec(SCHEMA.replace(/\s+/g, " ")).catch((e) => {
  ready = null;
  throw e;
}));

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const json = (body: unknown, status = 200) => Response.json(body, { status });

const sha256 = async (text: string) => crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));

/** Compares the bearer token with ADMIN_KEY in constant time. No ADMIN_KEY set means nobody gets in. */
async function isOwner(request: Request, env: Env): Promise<boolean> {
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!env.ADMIN_KEY || !token) return false;
  const [a, b] = await Promise.all([sha256(token), sha256(env.ADMIN_KEY)]);
  return crypto.subtle.timingSafeEqual(a, b);
}

async function readMachine(request: Request) {
  const body = await request.text();
  if (body.length > MAX_BODY) throw new HttpError(413, "machine too large");
  try {
    return parseMachine(JSON.parse(body));
  } catch (e) {
    throw new HttpError(400, e instanceof Error ? e.message : "invalid machine");
  }
}

async function route(request: Request, env: Env): Promise<Response> {
  const { pathname } = new URL(request.url);
  const [, collection, id, extra] = pathname.split("/");
  if (collection !== "machines" || extra !== undefined) throw new HttpError(404, "not found");
  if (!(await isOwner(request, env))) throw new HttpError(401, "unauthorized");
  await ensureSchema(env.DB);
  const db = env.DB;
  const now = new Date().toISOString();

  if (!id) {
    if (request.method === "GET") {
      const { results } = await db.prepare("SELECT id, name, updated FROM machines ORDER BY updated DESC").all();
      return json(results);
    }
    if (request.method === "POST") {
      const machine = await readMachine(request);
      const count = await db.prepare("SELECT COUNT(*) AS n FROM machines").first<number>("n");
      if ((count ?? 0) >= MAX_MACHINES) throw new HttpError(409, "storage full");
      const newId = crypto.randomUUID().replaceAll("-", "").slice(0, 12);
      await db
        .prepare("INSERT INTO machines (id, name, data, updated) VALUES (?, ?, ?, ?)")
        .bind(newId, machine.name, JSON.stringify(machine), now)
        .run();
      return json({ id: newId }, 201);
    }
    throw new HttpError(405, "method not allowed");
  }

  if (request.method === "GET") {
    const data = await db.prepare("SELECT data FROM machines WHERE id = ?").bind(id).first<string>("data");
    if (data === null) throw new HttpError(404, "machine not found");
    return new Response(data, { headers: { "content-type": "application/json" } });
  }
  if (request.method === "PUT") {
    const machine = await readMachine(request);
    const { meta } = await db
      .prepare("UPDATE machines SET name = ?, data = ?, updated = ? WHERE id = ?")
      .bind(machine.name, JSON.stringify(machine), now, id)
      .run();
    if (meta.changes === 0) throw new HttpError(404, "machine not found");
    return new Response(null, { status: 204 });
  }
  if (request.method === "DELETE") {
    await db.prepare("DELETE FROM machines WHERE id = ?").bind(id).run();
    return new Response(null, { status: 204 });
  }
  throw new HttpError(405, "method not allowed");
}

function cors(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get("origin");
  const allowed = env.ALLOWED_ORIGINS.split(",").map((o) => o.trim());
  if (!origin || !allowed.includes(origin)) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, POST, PUT, DELETE",
    "access-control-allow-headers": "content-type, authorization",
    vary: "origin",
  };
}

export default {
  async fetch(request, env): Promise<Response> {
    const headers = cors(request, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    let response: Response;
    try {
      response = await route(request, env);
    } catch (e) {
      if (!(e instanceof HttpError)) console.error(e);
      response = e instanceof HttpError ? json({ error: e.message }, e.status) : json({ error: "server error" }, 500);
    }
    for (const [k, v] of Object.entries(headers)) response.headers.set(k, v);
    return response;
  },
} satisfies ExportedHandler<Env>;
