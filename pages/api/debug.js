import { keys, getJSON, listKeysForDebug, storeInfo } from "../../lib/store";
import { createDefaultGlobalState, createDefaultSessionState } from "../../lib/worldState";

function authorized(req) {
  const expected = process.env.DEBUG_PASSWORD;
  if (!expected) return false;
  const got = req.headers["x-debug-password"] || req.query.password || req.body?.password;
  return got === expected;
}

export default async function handler(req, res) {
  if (!authorized(req)) return res.status(401).json({ error: "debug password required" });
  const sessionId = String(req.query.sessionId || req.body?.sessionId || "");
  const globalState = await getJSON(keys.globalState(), createDefaultGlobalState());
  const sessionState = sessionId ? await getJSON(keys.sessionState(sessionId), createDefaultSessionState(sessionId)) : null;
  const messages = sessionId ? await getJSON(keys.messages(sessionId), []) : [];
  const aftertone = sessionId ? await getJSON(keys.aftertone(sessionId), []) : [];
  const liked = await getJSON(keys.liked(), []);
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const lastUser = [...messages].reverse().find((m) => m.role === "user");

  res.status(200).json({
    ...storeInfo(),
    sessionId: sessionId || null,
    current_layer: sessionState?.current_layer || null,
    worldState: { globalState, sessionState },
    sessionState,
    phenomenon: lastAssistant?.debug?.phenomenon || null,
    relation_word: lastAssistant?.debug?.phenomenon?.relation_word || null,
    stance_output: lastAssistant?.debug?.phenomenon?.stance_output || null,
    reply_mode: lastAssistant?.debug?.phenomenon?.reply_mode || null,
    input_preview: lastUser?.content?.slice(0, 80) || "",
    input_length: lastUser?.content?.length || 0,
    messagesCount: messages.length,
    aftertoneCount: aftertone.length,
    likedCount: liked.length,
    last_shift_reason: sessionState?.last_shift_reason || null,
    memory: {
      messagesStored: messages.length,
      likedUsed: liked.length > 0,
      aftertoneUsed: aftertone.length > 0
    },
    keys: await listKeysForDebug()
  });
}
