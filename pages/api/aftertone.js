import { keys, getJSON, pushJSON, setJSON, storeInfo } from "../../lib/store";
import { createDefaultGlobalState, updateGlobalStateFromAftertone } from "../../lib/worldState";

function id() {
  return `after_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    const sessionId = String(req.query.sessionId || "");
    if (!sessionId) return res.status(400).json({ error: "sessionId is required" });
    const items = await getJSON(keys.aftertone(sessionId), []);
    return res.status(200).json({ sessionId, items, ...storeInfo() });
  }

  if (req.method === "POST") {
    const { sessionId, messageId, text, role = "assistant" } = req.body || {};
    if (!sessionId || !text) return res.status(400).json({ error: "sessionId and text are required" });
    const item = { id: id(), sessionId, messageId: messageId || null, text, role, createdAt: Date.now() };
    const items = await pushJSON(keys.aftertone(sessionId), item, 200);
    const liked = await pushJSON(keys.liked(), item, 500);
    const globalState = await getJSON(keys.globalState(), createDefaultGlobalState());
    await setJSON(keys.globalState(), updateGlobalStateFromAftertone(globalState, 1));
    return res.status(200).json({ item, aftertoneCount: items.length, likedCount: liked.length, ...storeInfo() });
  }

  return res.status(405).json({ error: "GET or POST only" });
}
