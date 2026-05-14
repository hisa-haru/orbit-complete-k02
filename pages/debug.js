import { useState } from "react";

export default function DebugPage() {
  const [sessionId, setSessionId] = useState("");
  const [password, setPassword] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  async function loadDebug(e) {
    e.preventDefault();
    setError("");
    setData(null);
    try {
      const url = `/api/debug?sessionId=${encodeURIComponent(sessionId)}&password=${encodeURIComponent(password)}`;
      const res = await fetch(url);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "debug取得に失敗しました");
      setData(body);
    } catch (err) {
      setError(err.message || "debug取得に失敗しました");
    }
  }

  return (
    <main className="debugPage">
      <h1>ORBIT debug</h1>
      <p>DEBUG_PASSWORD で保護された状態確認ページ。</p>
      <form className="debugForm" onSubmit={loadDebug}>
        <label>sessionId<input value={sessionId} onChange={(e) => setSessionId(e.target.value)} placeholder="session_..." /></label>
        <label>DEBUG_PASSWORD<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" /></label>
        <button>debugを読む</button>
      </form>
      {error && <div className="errorBox">{error}</div>}
      {data && <pre className="debugOutput">{JSON.stringify(data, null, 2)}</pre>}
    </main>
  );
}
