export type Turn = { question: string; answer: string };
export type Question = { kind: 'question'; feedback: string; question: string; options: string[] };
export type Report = {
  summary: string;
  profile: { label: string; value: string }[];
  strengths: string[];
  unknowns: string[];
  actions: { title: string; detail: string }[];
  serviceNeeds: { name: string; reason: string; deliverable: string }[];
};
export type Followup = { title: string; summary: string; steps: { title: string; detail: string }[]; questions: string[] };
export type Topic = 'plan' | 'direction' | 'brief';
export type RequestData = { mode: 'question' | 'report' | 'followup'; turns: Turn[]; topic?: Topic };
export const initialQuestion: Question = { kind: 'question', feedback: '不用一次想清所有答案，我们从你的目标开始。', question: '你计划申请哪个阶段？', options: ['本科', '硕士', '博士', '暂不确定'] };

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid object');
  return value as Record<string, unknown>;
}
function text(value: unknown, max = 1600): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error('Invalid text');
  return value.trim();
}
function list<T>(value: unknown, parse: (item: unknown) => T, min: number, max: number): T[] {
  if (!Array.isArray(value) || value.length < min || value.length > max) throw new Error('Invalid list');
  return value.map(parse);
}
function action(value: unknown) { const row = record(value); return { title: text(row.title, 100), detail: text(row.detail) }; }
export function parseRequest(value: unknown): RequestData {
  const data = record(value);
  if (!['question', 'report', 'followup'].includes(String(data.mode))) throw new Error('Invalid mode');
  const turns = list(data.turns, item => { const row = record(item); return { question: text(row.question, 400), answer: text(row.answer, 500) }; }, 1, 10);
  if (data.mode !== 'question' && turns.length < 3) throw new Error('At least three answers required');
  if (data.mode === 'followup' && !['plan', 'direction', 'brief'].includes(String(data.topic))) throw new Error('Invalid topic');
  return { mode: data.mode as RequestData['mode'], turns, ...(data.mode === 'followup' ? { topic: data.topic as Topic } : {}) };
}
export function parseQuestion(value: unknown, count: number): Question | { kind: 'complete' } {
  const data = record(value);
  if (data.kind === 'complete' && count >= 6) return { kind: 'complete' };
  if (data.kind !== 'question') throw new Error('Invalid question kind');
  const options = list(data.options, item => text(item, 100), 2, 7);
  if (new Set(options).size !== options.length) throw new Error('Duplicate options');
  if (!options.some(option => /不确定|不清楚|不了解|不方便|不愿/.test(option))) options.push('暂不确定');
  return { kind: 'question', feedback: text(data.feedback, 600), question: text(data.question, 300), options };
}
export function parseReport(value: unknown): Report {
  const data = record(value);
  return {
    summary: text(data.summary),
    profile: list(data.profile, item => { const row = record(item); return { label: text(row.label, 80), value: text(row.value, 700) }; }, 2, 15),
    strengths: list(data.strengths, item => text(item, 800), 0, 6),
    unknowns: list(data.unknowns, item => text(item, 800), 1, 10),
    actions: list(data.actions, action, 2, 6),
    serviceNeeds: list(data.serviceNeeds, item => { const row = record(item); return { name: text(row.name, 100), reason: text(row.reason, 800), deliverable: text(row.deliverable, 800) }; }, 0, 3),
  };
}
export function parseFollowup(value: unknown): Followup {
  const data = record(value);
  return { title: text(data.title, 100), summary: text(data.summary), steps: list(data.steps, action, 2, 6), questions: list(data.questions, item => text(item, 400), 1, 6) };
}
