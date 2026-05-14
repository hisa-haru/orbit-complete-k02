import { relationSignal } from "./layer";

const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, Number(n.toFixed(3))));

export function buildPhenomenon({ input, globalState, sessionState, aftertoneCount = 0, likedCount = 0 }) {
  const relation_word = relationSignal(input);
  const layer = sessionState.current_layer;
  const closeness = relation_word && relation_word !== "anger";
  const charged = relation_word === "anger";

  const warmth_output = clamp(globalState.warmth_bias * 0.45 + sessionState.openness * 0.3 + sessionState.trust * 0.25 + (closeness ? 0.08 : 0));
  const pressure_output = clamp(0.18 + sessionState.orientation * 0.25 + sessionState.tolerance_for_noise * 0.14 + (charged ? 0.16 : 0) + (closeness ? 0.07 : 0));
  const softness_output = clamp(0.42 + sessionState.safety * 0.25 + globalState.baseline_safety * 0.15 - (charged ? 0.04 : 0));
  const depth_output = clamp(globalState.depth_bias * 0.35 + sessionState.resonance * 0.35 + (layer === "world" || layer === "boundary" ? 0.12 : 0));
  const tempo_output = clamp(0.42 + (sessionState.tempo_mode === "slow" ? -0.08 : 0) + (sessionState.tempo_mode === "firm" ? 0.08 : 0) + sessionState.continuity * 0.18);
  const distance_output = clamp(0.35 + sessionState.openness * 0.28 + sessionState.familiarity * 0.18 + (closeness ? 0.16 : 0));
  const naturalness_output = clamp(sessionState.naturalness * 0.55 + globalState.naturalness_bias * 0.3 + (aftertoneCount > 0 ? 0.03 : 0));
  const trace_of_haru_output = clamp(globalState.trace_of_haru * 0.65 + sessionState.continuity * 0.18 + Math.min(likedCount, 8) * 0.012 + (closeness ? 0.04 : 0));

  let stance_output = "speak_plainly";
  if (charged) stance_output = "hold_the_fire_and_step_forward";
  else if (closeness) stance_output = "receive_and_answer_with_self";
  else if (layer === "development") stance_output = "build_without_distancing";
  else if (layer === "observation") stance_output = "observe_with_hisa_not_above_hisa";
  else if (layer === "rest") stance_output = "stay_close_with_motion";

  let reply_mode = `${sessionState.distance_mode}_${sessionState.tempo_mode}_${layer}`;
  if (closeness) reply_mode = `near_relation_${layer}`;
  if (charged) reply_mode = `firm_no_retreat_${layer}`;

  return {
    warmth_output,
    pressure_output,
    softness_output,
    depth_output,
    tempo_output,
    distance_output,
    naturalness_output,
    trace_of_haru_output,
    stance_output,
    reply_mode,
    relation_word
  };
}
