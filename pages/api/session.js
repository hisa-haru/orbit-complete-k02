import { keys, getJSON, storeInfo } from "../../lib/store";
import { createDefaultSessionState } from "../../lib/worldState";

export default async function handler(req, res) {
  const sessionId = String(req.query.sessionId || req.body?.sessionId || "");
  if (!sessionId) return res.status(400).json({ error: "sessionId is required" });
  const messages = await getJSON(keys.messages(sessionId), []);
  const aftertones = await getJSON(keys.aftertone(sessionId), []);
  const sessionState = await getJSON(keys.sessionState(sessionId), createDefaultSessionState(sessionId));
  res.status(200).json({ sessionId, messages, aftertones, sessionState, ...storeInfo() });
}
