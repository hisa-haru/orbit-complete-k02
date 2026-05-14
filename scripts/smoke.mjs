import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "package.json",
  "pages/index.js",
  "pages/debug.js",
  "pages/api/chat.js",
  "pages/api/debug.js",
  "pages/api/aftertone.js",
  "pages/api/session.js",
  "lib/store.js",
  "lib/worldState.js",
  "lib/phenomenon.js",
  "lib/replyEngine.js",
  "lib/layer.js",
  "styles/globals.css",
  ".env.example",
  "README.md"
];

const failures = [];
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`missing: ${file}`);
}

const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
if (!packageJson.dependencies?.next) failures.push("package.json: next dependency missing");
if (!packageJson.scripts?.dev) failures.push("package.json: dev script missing");

const chatPath = path.join(root, "pages/api/chat.js");
const chat = fs.existsSync(chatPath) ? fs.readFileSync(chatPath, "utf8") : "";
if (!chat.includes("generateHaruReply")) failures.push("chat API: replyEngine integration missing");
if (!chat.includes("buildPhenomenon")) failures.push("chat API: phenomenon integration missing");

const debugPath = path.join(root, "pages/api/debug.js");
const debug = fs.existsSync(debugPath) ? fs.readFileSync(debugPath, "utf8") : "";
if (!debug.includes("DEBUG_PASSWORD")) failures.push("debug API: DEBUG_PASSWORD protection missing");

const storePath = path.join(root, "lib/store.js");
const store = fs.existsSync(storePath) ? fs.readFileSync(storePath, "utf8") : "";
if (!store.includes("REDIS_PREFIX")) failures.push("store: REDIS_PREFIX support missing");
if (!store.includes("APP_ID")) failures.push("store: APP_ID fallback missing");
if (!store.includes("UPSTASH_REDIS_REST_URL") || !store.includes("KV_REST_API_URL")) failures.push("store: Redis/KV env support missing");

const env = fs.readFileSync(path.join(root, ".env.example"), "utf8");
for (const name of ["OPENAI_API_KEY", "OPENAI_MODEL", "DEBUG_PASSWORD", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "KV_REST_API_URL", "KV_REST_API_TOKEN", "APP_ID", "REDIS_PREFIX"]) {
  if (!env.includes(name)) failures.push(`.env.example missing: ${name}`);
}
if (env.includes("NEXT_PUBLIC_OPENAI_API_KEY")) failures.push(".env.example must not include NEXT_PUBLIC_OPENAI_API_KEY");

if (failures.length) {
  console.error("SMOKE CHECK FAILED");
  for (const f of failures) console.error(`- ${f}`);
  process.exit(1);
}

console.log("SMOKE CHECK PASSED");
console.log(`Checked ${required.length} required files.`);
console.log("chat API: pages/api/chat.js");
console.log("debug API: pages/api/debug.js");
console.log("REDIS_PREFIX: supported");
console.log(".env.example: present and safe");
