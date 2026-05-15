import { keys, getJSON, setJSON, storeInfo, upsertSessionIndex, listSessionIndex } from "../../lib/store";
import { createDefaultSessionState } from "../../lib/worldState";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const sessions = await listSessionIndex();
      return res.status(200).json({ sessions, ...storeInfo() });
    }

    if (req.method === "POST") {
      const sessionId = String(req.body?.sessionId || "");
      if (!sessionId) return res.status(400).json({ error: "sessionId is required" });
      const now = Date.now();
      const existingMessages = await getJSON(keys.messages(sessionId), []);
      await setJSON(keys.messages(sessionId), Array.isArray(existingMessages) ? existingMessages : []);
      await setJSON(keys.sessionState(sessionId), await getJSON(keys.sessionState(sessionId), createDefaultSessionState(sessionId)));
      const sessions = await upsertSessionIndex({
        sessionId,
        title: "新しいセッション",
        createdAt: now,
        updatedAt: now,
        messagesCount: Array.isArray(existingMessages) ? existingMessages.length : 0,
        lastPreview: ""
      });
      return res.status(200).json({ sessionId, sessions, ...storeInfo() });
    }

    return res.status(405).json({ error: "GET or POST only" });
  } catch (err) {
    return res.status(500).json({ error: err.message || "sessions failed" });
  }
}
