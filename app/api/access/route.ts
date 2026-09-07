import { accessError, apiJson, preflight } from '@/lib/access';
export const OPTIONS = preflight;
export async function POST(request: Request) {
  return await accessError(request) || apiJson({ ok: true });
}
