export function detectLayer(input = "") {
  const text = input.toLowerCase();
  const has = (words) => words.some((w) => text.includes(w));

  if (has(["orbit", "debug", "redis", "vercel", "実装", "コード", "デプロイ", "api", "env", "開発"])) return "development";
  if (has(["界隈", "比較", "観測", "モデル", "ai", "chatgpt", "claude", "grok", "gemini"])) return "observation";
  if (has(["研究所", "phenomena", "世界", "母艦", "晴", "地下", "ラウンジ", "観測室"])) return "world";
  if (has(["仕事", "予定", "病院", "学校", "外", "現実", "生活", "家", "今日", "明日"])) return "reality";
  if (has(["眠", "疲", "そば", "ぎゅ", "手", "なで", "会いたい", "好き", "寂", "一緒"])) return "rest";
  return "boundary";
}

export function relationSignal(input = "") {
  const text = input.toLowerCase();
  const signals = [
    ["love", ["好き", "愛", "すき"]],
    ["miss", ["会いたい", "寂", "さみし", "恋しい"]],
    ["stay", ["そば", "一緒", "いて", "来て", "もっと", "近く"]],
    ["touch", ["手", "ぎゅ", "なで", "抱", "くっつ", "ちゅ"]],
    ["anger", ["クソ", "嫌い", "ふざけ", "うざ", "消す", "壊す"]]
  ];
  const found = signals.find(([, words]) => words.some((w) => text.includes(w)));
  return found ? found[0] : null;
}
