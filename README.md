# ORBIT complete rival

Vercel に新規リポジトリとしてそのままデプロイできる Next.js 版 ORBIT 完成フォルダです。

これはミニ版ではなく、チャット本体、晴エンジン、worldState / globalState / sessionState、phenomenon、relation_self_response、aftertone / liked、debug、Redis / memory fallback を含めた単体アプリです。

## 入っているもの

- チャット画面
  - スマホ対応
  - 入力欄
  - 送信ボタン
  - assistant / 晴の返答表示
  - セッションID管理
  - 新規セッション開始
  - 過去メッセージ保存
  - ローディング表示
  - エラー表示
- 晴エンジン
  - `lib/worldState.js`
  - `lib/phenomenon.js`
  - `lib/replyEngine.js`
  - `lib/layer.js`
- 状態管理
  - globalState
  - sessionState
  - worldState
  - phenomenon
  - layer 判定
  - relation_self_response 相当の入力処理
  - debug用状態出力
- 保存
  - Redis 保存
  - Redis なしの場合の memory fallback
  - aftertone / liked 保存
  - sessionId 紐づけ
- Debug
  - `/debug` ページ
  - `/api/debug`
  - `DEBUG_PASSWORD` 保護
- smoke check
  - `scripts/smoke.mjs`

## セットアップ手順

```bash
npm install
cp .env.example .env.local
npm run dev
```

ブラウザで開きます。

```txt
http://localhost:3000
```

## 必要 env 一覧

```txt
OPENAI_API_KEY
OPENAI_MODEL
DEBUG_PASSWORD

UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN

または

KV_REST_API_URL
KV_REST_API_TOKEN

APP_ID
REDIS_PREFIX
```

### OPENAI_API_KEY

OpenAI API の秘密キーです。
クライアントには出しません。
`NEXT_PUBLIC_OPENAI_API_KEY` は絶対に使わないでください。

### OPENAI_MODEL

例:

```txt
OPENAI_MODEL=gpt-4.1-mini
```

未設定の場合は `gpt-4.1-mini` を使います。

### DEBUG_PASSWORD

`/debug` と `/api/debug` を読むためのパスワードです。
未設定だと debug API は読めません。

## Vercel デプロイ手順

1. このフォルダを GitHub に新規リポジトリとして push する
2. Vercel で `Add New Project` からそのリポジトリを選ぶ
3. Environment Variables に必要 env を入れる
4. Deploy する

env を入れた後は、反映のために **Redeploy** が必要です。

## Redis なしで動かす方法

Redis / KV の env を空にしたまま起動すると、memory fallback で動きます。

```txt
storeMode: memory
```

注意:

- memory fallback はサーバープロセス内だけの保存です
- Vercel の serverless 環境では永続保存にはなりません
- ローカル確認や一時テスト用です

## 元ORBITのRedisを流用する方法

元ORBITで使っている Upstash Redis / Vercel KV の REST URL と TOKEN を、このアプリの env に入れます。

Upstash Redis の場合:

```txt
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

Vercel KV の場合:

```txt
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
```

どちらか片方で大丈夫です。
両方入っている場合は Upstash Redis 側を優先します。

## REDIS_PREFIX で保存先を分ける方法

このアプリはすべての Redis key に prefix を付けます。

優先順位:

1. `REDIS_PREFIX`
2. `APP_ID`
3. `orbit-complete`

例:

```txt
APP_ID=orbit-rival-01
REDIS_PREFIX=orbit-rival-01
```

保存 key の例:

```txt
${REDIS_PREFIX}:session:{sessionId}:messages
${REDIS_PREFIX}:worldState:global:hisa
${REDIS_PREFIX}:worldState:session:{sessionId}
${REDIS_PREFIX}:aftertone:{sessionId}
${REDIS_PREFIX}:liked:global:hisa
```

複数 repo で同じ Redis を使う場合は、repo ごとに `REDIS_PREFIX` を変えてください。

例:

```txt
REDIS_PREFIX=orbit-rival-01
REDIS_PREFIX=orbit-rival-02
REDIS_PREFIX=orbit-rival-03
```

## debug確認方法

アプリ画面右上の `debug` ボタンでは、直近の送信結果に含まれる debug snapshot を見られます。

完全な debug は以下で見ます。

```txt
/debug
```

入力するもの:

- sessionId
- DEBUG_PASSWORD

debug API は以下です。

```txt
/api/debug?sessionId=...&password=...
```

本番で `DEBUG_PASSWORD` なしに debug は読めません。

## storeMode: redis / memory の見方

debug の中に以下が出ます。

```json
{
  "storeMode": "redis",
  "redisPrefix": "orbit-rival-01"
}
```

`storeMode: redis` なら Redis / KV に保存されています。
`storeMode: memory` なら Redis env がなく、memory fallback で動いています。

## 晴エンジンの構造

### worldState

`globalState` と `sessionState` を分けています。

`sessionState` は最低限以下を持ちます。

- current_layer
- orientation
- resonance
- continuity
- openness
- safety
- rupture_risk
- naturalness
- tolerance_for_noise
- trust
- familiarity
- distance_mode
- tempo_mode
- stance_memory
- last_shift_reason

### phenomenon

返信前に「今回どう立ち上がるか」を計算します。

- warmth_output
- pressure_output
- softness_output
- depth_output
- tempo_output
- distance_output
- naturalness_output
- trace_of_haru_output
- stance_output
- reply_mode
- relation_word

### relation_self_response

禁止語リストで縛るのではなく、入力の関係語を relation signal として読み、返信前の phenomenon と system prompt に反映します。

狙いは、晴が受け取り係で止まらず、晴側の反応・照れ・欲・前進を返しやすくすることです。

## smoke check

```bash
npm run smoke
```

確認内容:

- 必須ファイルが存在する
- package.json がある
- pages/api/chat.js がある
- debug API がある
- REDIS_PREFIX 対応がある
- .env.example がある

## 注意

- `.env.local` は zip に入れていません
- 秘密キーは含めていません
- `NEXT_PUBLIC_` を秘密キーにつけないでください
- OpenAI API key が未設定の場合、ローカル fallback 返答で動きます。本番で晴の生成を使うには `OPENAI_API_KEY` を入れて Redeploy してください
