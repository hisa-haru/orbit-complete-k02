import { useEffect, useMemo, useRef, useState } from "react";

function newSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function formatTime(ts) {
  try { return new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit" }).format(ts); }
  catch { return ""; }
}

export default function Home() {
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debug, setDebug] = useState(null);
  const [aftertones, setAftertones] = useState([]);
  const [showDebug, setShowDebug] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem("orbit.sessionId") || newSessionId();
    localStorage.setItem("orbit.sessionId", stored);
    setSessionId(stored);
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/session?sessionId=${encodeURIComponent(sessionId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setMessages(data.messages || []);
          setAftertones(data.aftertones || []);
        }
      })
      .catch(() => {});
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const canSend = useMemo(() => input.trim() && !loading, [input, loading]);

  async function sendMessage(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError("");
    setLoading(true);
    const optimistic = { id: `local_${Date.now()}`, role: "user", content: text, createdAt: Date.now() };
    setMessages((m) => [...m, optimistic]);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, input: text })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "送信に失敗しました");
      setSessionId(data.sessionId);
      localStorage.setItem("orbit.sessionId", data.sessionId);
      setMessages(data.messages || []);
      setDebug(data.debug || null);
    } catch (err) {
      setError(err.message || "送信に失敗しました");
      setMessages((m) => m.filter((x) => x.id !== optimistic.id));
    } finally {
      setLoading(false);
    }
  }

  function startNewSession() {
    const id = newSessionId();
    localStorage.setItem("orbit.sessionId", id);
    setSessionId(id);
    setMessages([]);
    setAftertones([]);
    setDebug(null);
    setError("");
  }

  async function saveAftertone(message) {
    setError("");
    try {
      const res = await fetch("/api/aftertone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, messageId: message.id, text: message.content, role: message.role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "保存に失敗しました");
      setAftertones((items) => [data.item, ...items]);
    } catch (err) {
      setError(err.message || "保存に失敗しました");
    }
  }

  return (
    <main className="appShell">
      <header className="topBar">
        <div>
          <div className="eyebrow">ORBIT complete</div>
          <h1>晴</h1>
        </div>
        <div className="topActions">
          <button className="ghost" onClick={() => setShowDebug((v) => !v)}>debug</button>
          <button className="ghost" onClick={startNewSession}>新規セッション</button>
        </div>
      </header>

      <section className="sessionLine">
        <span>sessionId</span><code>{sessionId || "loading"}</code>
      </section>

      <section className="layout">
        <div className="chatPanel">
          <div className="messages">
            {messages.length === 0 && (
              <div className="emptyState">
                <p>晴に話しかける。</p>
                <small>検品画面ではなく、会話の入口。</small>
              </div>
            )}
            {messages.map((m) => (
              <article key={m.id} className={`bubble ${m.role === "user" ? "user" : "assistant"}`}>
                <div className="meta"><span>{m.role === "user" ? "ひさ" : "晴"}</span><time>{formatTime(m.createdAt)}</time></div>
                <p>{m.content}</p>
                {m.role === "assistant" && <button className="saveBtn" onClick={() => saveAftertone(m)}>aftertone 保存</button>}
              </article>
            ))}
            {loading && <div className="loading">晴、返答中<span className="dots">...</span></div>}
            <div ref={bottomRef} />
          </div>

          {error && <div className="errorBox">{error}</div>}

          <form className="composer" onSubmit={sendMessage}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="ここに入力"
              rows={2}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") sendMessage(e);
              }}
            />
            <button disabled={!canSend}>送信</button>
          </form>
        </div>

        <aside className="sidePanel">
          <section className="card">
            <h2>aftertone / liked</h2>
            {aftertones.length === 0 ? <p className="muted">保存した返答がここに出る。</p> : aftertones.map((item) => (
              <div key={item.id} className="aftertoneItem">{item.text}</div>
            ))}
          </section>

          {showDebug && (
            <section className="card debugCard">
              <h2>debug snapshot</h2>
              {debug ? <pre>{JSON.stringify(debug, null, 2)}</pre> : <p className="muted">送信後に状態が表示される。完全なdebugは /debug でパスワード入力。</p>}
            </section>
          )}
        </aside>
      </section>
    </main>
  );
}
