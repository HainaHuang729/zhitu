import { env } from 'cloudflare:workers';
import type { D1Database } from '@cloudflare/workers-types';
const pagesOrigin = 'https://hainahuang729.github.io';
export const runtime = env as unknown as { DEEPSEEK_API_KEY?: string; DEEPSEEK_MODEL?: string; SITE_ACCESS_CODE?: string; DAILY_AI_LIMIT?: string; DB?: D1Database };
export function apiJson(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': pagesOrigin, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Invite-Code', Vary: 'Origin' } });
}
export function originAllowed(request: Request) {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin || origin === pagesOrigin;
}
export async function accessError(request: Request) {
  if (!originAllowed(request)) return apiJson({ error: '请从知途网页发起请求。' }, 403);
  if (!runtime.SITE_ACCESS_CODE) return apiJson({ error: '访问入口尚未配置，请稍后再试。' }, 503);
  const supplied = request.headers.get('x-invite-code') || '';
  if (supplied.length > 128) return apiJson({ error: '访问口令不正确。' }, 401);
  const encode = new TextEncoder();
  const [expected, actual] = await Promise.all([runtime.SITE_ACCESS_CODE, supplied].map(value => crypto.subtle.digest('SHA-256', encode.encode(value))));
  const a = new Uint8Array(expected), b = new Uint8Array(actual);
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference ? apiJson({ error: '访问口令不正确，请向分享者确认。' }, 401) : null;
}
export function preflight(request: Request) {
  return originAllowed(request) ? apiJson({ ok: true }) : apiJson({ error: '不支持的来源。' }, 403);
}
export async function reserveAiCall() {
  if (!runtime.DB) throw new Error('Quota store unavailable');
  const configured = Number(runtime.DAILY_AI_LIMIT);
  const limit = Number.isInteger(configured) && configured > 0 && configured <= 1000 ? configured : 200;
  const bucket = new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10);
  const row = await runtime.DB.prepare('INSERT INTO ai_quota (bucket, used) VALUES (?, 1) ON CONFLICT(bucket) DO UPDATE SET used = used + 1 WHERE used < ? RETURNING used').bind(bucket, limit).first<{ used: number }>();
  return row !== null;
}
