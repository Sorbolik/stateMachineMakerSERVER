// Same format as the editor (vanillaAndWebpackStateMachineMaker/src/machine.ts).
// The server never trusts a body: it rebuilds the machine field by field.

export type Point = { x: number; y: number };
export type Transition = { from: string; on: string; to: string };
export type Machine = {
  v: 1;
  name: string;
  initial: string | null;
  final: string[];
  states: Record<string, Point>;
  transitions: Transition[];
};

const MAX_STATES = 500;
const MAX_TRANSITIONS = 2000;
const MAX_TEXT = 100;

export function parseMachine(d: any): Machine {
  const fail = (why: string): never => {
    throw new Error(why);
  };
  const text = (s: unknown) => typeof s === "string" && s.length > 0 && s.length <= MAX_TEXT;
  if (d?.v !== 1) fail("v must be 1");
  if (typeof d.name !== "string" || d.name.length > MAX_TEXT) fail("invalid name");
  if (typeof d.states !== "object" || d.states === null || Array.isArray(d.states)) fail("states must be an object");
  const names = Object.keys(d.states);
  if (names.length > MAX_STATES) fail(`at most ${MAX_STATES} states`);
  const states: Record<string, Point> = {};
  for (const k of names) {
    const p = d.states[k];
    if (!text(k)) fail("invalid state name");
    if (!Number.isFinite(p?.x) || !Number.isFinite(p?.y)) fail(`invalid position for "${k}"`);
    states[k] = { x: p.x, y: p.y };
  }
  const known = (s: unknown): s is string => typeof s === "string" && Object.hasOwn(states, s);
  if (d.initial !== null && !known(d.initial)) fail("unknown initial state");
  if (!Array.isArray(d.final) || !d.final.every(known)) fail("unknown final state");
  if (!Array.isArray(d.transitions) || d.transitions.length > MAX_TRANSITIONS) fail("invalid transitions");
  const transitions = d.transitions.map((t: any) => {
    if (!known(t?.from) || !known(t?.to) || !text(t.on)) fail("a transition points to an unknown state");
    return { from: t.from, on: t.on, to: t.to };
  });
  return { v: 1, name: d.name, initial: d.initial, final: [...new Set<string>(d.final)], states, transitions };
}
