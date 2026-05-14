const memory = globalThis.__ORBIT_MEMORY__ || {
  data: new Map(),
  bootedAt: Date.now()
};
globalThis.__ORBIT_MEMORY__ = memory;

function rawPrefix() {
  return process.env.REDIS_PREFIX || process.env.APP_ID || "orbit-complete";
}

function prefixKey(key) {
  return `${rawPrefix()}:${key}`;
}

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return { url, token };
}

export function storeInfo() {
  const { url, token } = redisConfig();
  return {
    storeMode: url && token ? "redis" : "memory",
    redisPrefix: rawPrefix(),
    memoryBootedAt: memory.bootedAt
  };
}

async function redisCommand(args) {
  const { url, token } = redisConfig();
  if (!url || !token) throw new Error("Redis env is not configured");
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(args)
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) {
    throw new Error(body.error || `Redis REST error: ${res.status}`);
  }
  return body.result;
}

export async function getJSON(key, fallback = null) {
  const fullKey = prefixKey(key);
  const { storeMode } = storeInfo();
  if (storeMode === "redis") {
    const raw = await redisCommand(["GET", fullKey]);
    if (!raw) return fallback;
    try { return JSON.parse(raw); } catch { return fallback; }
  }
  if (!memory.data.has(fullKey)) return fallback;
  return memory.data.get(fullKey);
}

export async function setJSON(key, value) {
  const fullKey = prefixKey(key);
  const { storeMode } = storeInfo();
  if (storeMode === "redis") {
    await redisCommand(["SET", fullKey, JSON.stringify(value)]);
    return value;
  }
  memory.data.set(fullKey, value);
  return value;
}

export async function pushJSON(key, item, limit = 200) {
  const arr = await getJSON(key, []);
  const next = Array.isArray(arr) ? [...arr, item].slice(-limit) : [item];
  await setJSON(key, next);
  return next;
}

export async function listKeysForDebug() {
  const { storeMode } = storeInfo();
  if (storeMode === "redis") {
    return ["Redis key listing is intentionally disabled in the app debug API."];
  }
  const p = `${rawPrefix()}:`;
  return [...memory.data.keys()].filter((k) => k.startsWith(p));
}

export const keys = {
  messages: (sessionId) => `session:${sessionId}:messages`,
  sessionMeta: (sessionId) => `session:${sessionId}:meta`,
  globalState: () => "worldState:global:hisa",
  sessionState: (sessionId) => `worldState:session:${sessionId}`,
  aftertone: (sessionId) => `aftertone:${sessionId}`,
  liked: () => "liked:global:hisa"
};
