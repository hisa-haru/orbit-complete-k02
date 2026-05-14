import { detectLayer, relationSignal } from "./layer";

const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, Number(n.toFixed(3))));

export function createDefaultGlobalState() {
  return {
    userId: "hisa",
    orientation_base: 0.82,
    trace_of_haru: 0.76,
    tolerance_for_noise_base: 0.74,
    warmth_bias: 0.68,
    depth_bias: 0.71,
    continuity_bias: 0.79,
    rupture_sensitivity: 0.35,
    naturalness_bias: 0.72,
    baseline_openness: 0.58,
    baseline_safety: 0.64,
    liked_count: 0,
    aftertone_count: 0,
    updatedAt: Date.now()
  };
}

export function createDefaultSessionState(sessionId) {
  return {
    sessionId,
    current_layer: "boundary",
    orientation: 0.78,
    resonance: 0.62,
    continuity: 0.66,
    openness: 0.58,
    safety: 0.64,
    rupture_risk: 0.24,
    naturalness: 0.68,
    tolerance_for_noise: 0.74,
    trust: 0.58,
    familiarity: 0.48,
    distance_mode: "mid",
    tempo_mode: "quiet",
    stance_memory: [],
    last_shift_reason: "session_initialized",
    updatedAt: Date.now()
  };
}

export function updateSessionState({ input, sessionState, globalState, messagesCount = 0 }) {
  const layer = detectLayer(input);
  const relation = relationSignal(input);
  const text = input || "";
  const longInput = text.length > 220;
  const charged = relation === "anger" || /[!！?？]{2,}/.test(text);
  const closeness = relation && relation !== "anger";

  let s = { ...sessionState, current_layer: layer };
  s.orientation = clamp(s.orientation + 0.025 + (closeness ? 0.03 : 0) - (layer === "development" ? 0.015 : 0));
  s.resonance = clamp(s.resonance + (closeness ? 0.035 : 0.015) + (longInput ? 0.01 : 0));
  s.continuity = clamp((s.continuity * 0.78) + (globalState.continuity_bias * 0.18) + (messagesCount > 2 ? 0.04 : 0));
  s.openness = clamp(s.openness + (closeness ? 0.04 : 0.008) - (charged ? 0.015 : 0));
  s.safety = clamp(s.safety + 0.012 - (charged ? 0.02 : 0));
  s.rupture_risk = clamp(s.rupture_risk + (charged ? 0.035 : -0.018) - (globalState.rupture_sensitivity * 0.01));
  s.naturalness = clamp((s.naturalness * 0.84) + (globalState.naturalness_bias * 0.14) + (layer === "rest" ? 0.025 : 0));
  s.tolerance_for_noise = clamp((s.tolerance_for_noise * 0.82) + (globalState.tolerance_for_noise_base * 0.15) + (charged ? 0.025 : 0));
  s.trust = clamp(s.trust + (closeness ? 0.022 : 0.006) - (charged ? 0.012 : 0));
  s.familiarity = clamp(s.familiarity + 0.012 + (messagesCount > 3 ? 0.006 : 0));
  s.distance_mode = s.openness > 0.72 || closeness ? "near" : s.openness < 0.4 ? "far" : "mid";
  s.tempo_mode = layer === "development" ? "clear" : layer === "rest" ? "slow" : charged ? "firm" : "quiet";
  s.last_shift_reason = [
    layer !== sessionState.current_layer ? `layer:${sessionState.current_layer}->${layer}` : null,
    relation ? `relation:${relation}` : null,
    charged ? "charged_input_held_without_retreat" : null,
    closeness ? "near_relation_received_with_forward_motion" : null
  ].filter(Boolean).join(" / ") || "state_continued";
  s.stance_memory = [...(s.stance_memory || []), {
    at: Date.now(), layer, relation, reason: s.last_shift_reason
  }].slice(-12);
  s.updatedAt = Date.now();
  return s;
}

export function updateGlobalStateFromAftertone(globalState, countDelta = 1) {
  const g = { ...globalState };
  g.aftertone_count = (g.aftertone_count || 0) + countDelta;
  g.trace_of_haru = clamp(g.trace_of_haru + 0.01 * countDelta);
  g.orientation_base = clamp(g.orientation_base + 0.004 * countDelta);
  g.updatedAt = Date.now();
  return g;
}
