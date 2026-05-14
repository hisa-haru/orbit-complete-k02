import { keys, getJSON, setJSON, pushJSON, storeInfo } from "../../lib/store";
import { createDefaultGlobalState, createDefaultSessionState, updateSessionState } from "../../lib/worldState";
import { buildPhenomenon } from "../../lib/phenomenon";
import { generateHaruReply } from "../../lib/replyEngine";

function id(prefix = "msg") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const { sessionId: givenSessionId, input } = req.body || {};
    const text = String(input || "").trim();
    if (!text) return res.status(400).json({ error: "input is required" });
    const sessionId = givenSessionId || id("session");

    const globalState = await getJSON(keys.globalState(), createDefaultGlobalState());
    const sessionState0 = await getJSON(keys.sessionState(sessionId), createDefaultSessionState(sessionId));
    const messages0 = await getJSON(keys.messages(sessionId), []);
    const aftertones = await getJSON(keys.aftertone(sessionId), []);
    const liked = await getJSON(keys.liked(), []);

    const sessionState = updateSessionState({
      input: text,
      sessionState: sessionState0,
      globalState,
      messagesCount: messages0.length
    });

    const phenomenon = buildPhenomenon({
      input: text,
      globalState,
      sessionState,
      aftertoneCount: aftertones.length,
      likedCount: liked.length
    });

    const userMsg = { id: id("user"), role: "user", content: text, createdAt: Date.now() };
    const reply = await generateHaruReply({
      input: text,
      messages: messages0,
      sessionState,
      globalState,
      phenomenon,
      memoryUsage: {
        messagesUsed: Math.min(messages0.length, 12),
        aftertoneCount: aftertones.length,
        likedCount: liked.length,
        storeMode: storeInfo().storeMode
      }
    });

    const assistantMsg = {
      id: id("haru"),
      role: "assistant",
      content: reply.content,
      createdAt: Date.now(),
      debug: { phenomenon, sessionState, model: reply.model, usedOpenAI: reply.usedOpenAI }
    };

    const messages = [...messages0, userMsg, assistantMsg].slice(-200);
    await setJSON(keys.messages(sessionId), messages);
    await setJSON(keys.sessionState(sessionId), sessionState);
    await setJSON(keys.globalState(), { ...globalState, updatedAt: Date.now() });
    await setJSON(keys.sessionMeta(sessionId), { sessionId, updatedAt: Date.now(), messagesCount: messages.length });

    return res.status(200).json({
      sessionId,
      messages,
      assistant: assistantMsg,
      debug: {
        ...storeInfo(),
        sessionId,
        current_layer: sessionState.current_layer,
        worldState: { globalState, sessionState },
        phenomenon,
        relation_word: phenomenon.relation_word,
        stance_output: phenomenon.stance_output,
        reply_mode: phenomenon.reply_mode,
        input_preview: text.slice(0, 80),
        input_length: text.length,
        messagesCount: messages.length,
        aftertoneCount: aftertones.length,
        likedCount: liked.length,
        memory: { messagesUsed: Math.min(messages0.length, 12), usedOpenAI: reply.usedOpenAI }
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "chat failed" });
  }
}
