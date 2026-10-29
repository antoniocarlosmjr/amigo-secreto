interface Env { DB: D1Database }

type ParticipantInput = { name: string };
type CreateInput = {
  name?: unknown; eventDate?: unknown; giftAmountCents?: unknown;
  participants?: unknown; restrictions?: unknown;
};

const json = (data: unknown, status = 200) => Response.json(data, {
  status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
});
const error = (message: string, status = 400) => json({ error: message }, status);
const id = () => crypto.randomUUID();
const key = (name: string) => name.normalize('NFC').trim().toLocaleLowerCase('pt-BR');
const sha256 = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))))
  .map(x => x.toString(16).padStart(2, '0')).join('');
const iso = (d: Date) => d.toISOString();

function validate(input: CreateInput): { name: string; eventDate: string | null; giftAmountCents: number | null; participants: string[]; restrictions: [number, number][] } | string {
  if (typeof input.name !== 'string' || !input.name.trim() || input.name.trim().length > 100) return 'Nome do grupo deve ter de 1 a 100 caracteres';
  if (!Array.isArray(input.participants) || input.participants.length < 3 || input.participants.length > 50) return 'Informe de 3 a 50 participantes';
  const names: string[] = [];
  for (const p of input.participants as ParticipantInput[]) {
    if (!p || typeof p.name !== 'string' || !p.name.trim() || p.name.trim().length > 80) return 'Cada participante precisa de um nome de até 80 caracteres';
    names.push(p.name.trim().normalize('NFC'));
  }
  if (new Set(names.map(key)).size !== names.length) return 'Nomes de participantes devem ser únicos';
  let eventDate: string | null = null;
  if (input.eventDate !== undefined && input.eventDate !== null && input.eventDate !== '') {
    if (typeof input.eventDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input.eventDate) || Number.isNaN(Date.parse(input.eventDate)) || new Date(input.eventDate).toISOString().slice(0, 10) !== input.eventDate) return 'Data inválida (use AAAA-MM-DD)';
    eventDate = input.eventDate;
  }
  let giftAmountCents: number | null = null;
  if (input.giftAmountCents !== undefined && input.giftAmountCents !== null) {
    if (!Number.isSafeInteger(input.giftAmountCents) || (input.giftAmountCents as number) < 0 || (input.giftAmountCents as number) > 100000000) return 'Valor do presente inválido (em centavos)';
    giftAmountCents = input.giftAmountCents as number;
  }
  const restrictions: [number, number][] = [];
  if (input.restrictions !== undefined) {
    if (!Array.isArray(input.restrictions) || input.restrictions.length > 1225) return 'Restrições inválidas';
    const unique = new Set<string>();
    for (const pair of input.restrictions) {
      if (!Array.isArray(pair) || pair.length !== 2 || !pair.every((n: unknown) => Number.isInteger(n) && (n as number) >= 0 && (n as number) < names.length) || pair[0] === pair[1]) return 'Restrição deve conter dois índices distintos de participantes';
      const a = Math.min(pair[0], pair[1]), b = Math.max(pair[0], pair[1]);
      const k = `${a}:${b}`;
      if (unique.has(k)) return 'Restrições duplicadas';
      unique.add(k); restrictions.push([a, b]);
    }
  }
  return { name: input.name.trim(), eventDate, giftAmountCents, participants: names, restrictions };
}

async function createGroup(request: Request, env: Env): Promise<Response> {
  if (Number(request.headers.get('content-length') || 0) > 16000) return error('Corpo da requisição muito grande', 413);
  let body: CreateInput;
  try { body = await request.json() as CreateInput; } catch { return error('JSON inválido'); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return error('JSON inválido');
  const valid = validate(body);
  if (typeof valid === 'string') return error(valid);
  const groupId = id();
  const adminToken = `${id()}${id().replaceAll('-', '')}`;
  const adminTokenHash = await sha256(adminToken);
  const participantIds = valid.participants.map(() => id());
  const now = new Date();
  const expires = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const statements = [
    env.DB.prepare('INSERT INTO groups (id,admin_token_hash,name,event_date,gift_amount_cents,created_at,expires_at) VALUES (?,?,?,?,?,?,?)')
      .bind(groupId, adminTokenHash, valid.name, valid.eventDate, valid.giftAmountCents, iso(now), iso(expires)),
    ...valid.participants.map((name, i) => env.DB.prepare('INSERT INTO participants (id,group_id,name,name_key) VALUES (?,?,?,?)')
      .bind(participantIds[i], groupId, name, key(name))),
    ...valid.restrictions.map(([a,b]) => env.DB.prepare('INSERT INTO restrictions (group_id,participant_a,participant_b) VALUES (?,?,?)')
      .bind(groupId, ...[participantIds[a], participantIds[b]].sort()))
  ];
  await env.DB.batch(statements);
  // O token administrativo só é devolvido nesta resposta; nunca no endpoint público.
  return json({ groupId, adminToken, expiresAt: iso(expires), status: 'draft', note: 'O sorteio ainda não foi realizado' }, 201);
}

async function getGroup(groupId: string, env: Env): Promise<Response> {
  const group = await env.DB.prepare('SELECT id,name,event_date,gift_amount_cents,created_at,expires_at,status FROM groups WHERE id = ? AND expires_at > ?').bind(groupId, iso(new Date())).first();
  if (!group) return error('Grupo não encontrado ou expirado', 404);
  const participants = await env.DB.prepare('SELECT id,name FROM participants WHERE group_id = ? ORDER BY rowid').bind(groupId).all();
  return json({ ...group, participants: participants.results });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/api/v1/health') return json({ status: 'ok', service: 'amigo-secreto-api', stage: 3 });
    if (request.method === 'POST' && url.pathname === '/api/v1/groups') {
      if (!env.DB) return error('Banco D1 não configurado', 503);
      try { return await createGroup(request, env); } catch (e) { console.error('createGroup failed', e instanceof Error ? e.name : 'unknown'); return error('Não foi possível criar o grupo', 500); }
    }
    const match = url.pathname.match(/^\/api\/v1\/groups\/([a-f0-9-]{36})$/);
    if (request.method === 'GET' && match) {
      if (!env.DB) return error('Banco D1 não configurado', 503);
      try { return await getGroup(match[1], env); } catch { return error('Não foi possível consultar o grupo', 500); }
    }
    return error('Endpoint não encontrado', 404);
  }
} satisfies ExportedHandler<Env>;
