import { drawAssignments } from './draw';

interface Env { DB: D1Database; DRAW_ENCRYPTION_KEY: string }
type ParticipantInput = { name: string };
type CreateInput = { name?: unknown; eventDate?: unknown; giftAmountCents?: unknown; participants?: unknown; restrictions?: unknown };
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
const error = (message: string, status = 400) => json({ error: message }, status);
const id = () => crypto.randomUUID();
const key = (name: string) => name.normalize('NFC').trim().toLocaleLowerCase('pt-BR');
const sha256 = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))).map(x => x.toString(16).padStart(2, '0')).join('');
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
    env.DB.prepare('INSERT INTO groups (id,admin_token_hash,name,event_date,gift_amount_cents,created_at,expires_at) VALUES (?,?,?,?,?,?,?)').bind(groupId, adminTokenHash, valid.name, valid.eventDate, valid.giftAmountCents, iso(now), iso(expires)),
    ...valid.participants.map((name, i) => env.DB.prepare('INSERT INTO participants (id,group_id,name,name_key) VALUES (?,?,?,?)').bind(participantIds[i], groupId, name, key(name))),
    ...valid.restrictions.map(([a,b]) => env.DB.prepare('INSERT INTO restrictions (group_id,participant_a,participant_b) VALUES (?,?,?)').bind(groupId, ...[participantIds[a], participantIds[b]].sort()))
  ];
  await env.DB.batch(statements);
  return json({ groupId, adminToken, expiresAt: iso(expires), status: 'draft', note: 'O sorteio ainda não foi realizado' }, 201);
}
async function getGroup(groupId: string, env: Env): Promise<Response> {
  const group = await env.DB.prepare('SELECT id,name,event_date,gift_amount_cents,created_at,expires_at,status FROM groups WHERE id = ? AND expires_at > ?').bind(groupId, iso(new Date())).first();
  if (!group) return error('Grupo não encontrado ou expirado', 404);
  const participants = await env.DB.prepare('SELECT id,name FROM participants WHERE group_id = ? ORDER BY rowid').bind(groupId).all();
  return json({ ...group, participants: participants.results });
}
function bytesToHex(bytes: Uint8Array): string { return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join(''); }
async function encryptRecipient(recipientId: string, secret: string): Promise<{cipher: string; iv: string}> {
  if (!/^[a-f0-9]{64}$/i.test(secret)) throw new Error('DRAW_ENCRYPTION_KEY deve ter 64 caracteres hexadecimais');
  const raw = Uint8Array.from(secret.match(/../g)!, pair => parseInt(pair, 16));
  const cryptoKey = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({name: 'AES-GCM', iv}, cryptoKey, new TextEncoder().encode(recipientId));
  return { cipher: bytesToHex(new Uint8Array(ciphertext)), iv: bytesToHex(iv) };
}
function hexToBytes(value: string): Uint8Array {
  if (!/^(?:[0-9a-f]{2})+$/i.test(value)) throw new Error('Dados criptografados inválidos');
  return Uint8Array.from(value.match(/../g)!, pair => parseInt(pair, 16));
}
async function decryptRecipient(
  cipher: string,
  iv: string,
  secret: string
): Promise<string> {
  if (!/^[a-f0-9]{64}$/i.test(secret)) {
    throw new Error('Chave de criptografia inválida');
  }

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    Uint8Array.from(hexToBytes(secret)),
    'AES-GCM',
    false,
    ['decrypt']
  );

  const plaintext = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: Uint8Array.from(hexToBytes(iv)),
    },
    cryptoKey,
    Uint8Array.from(hexToBytes(cipher))
  );

  return new TextDecoder().decode(plaintext);
}
async function envelopeContext(groupId: string, participantId: string, env: Env): Promise<{ status: 'draft' | 'drawn'; name: string } | Response> {
  const group = await env.DB.prepare('SELECT status FROM groups WHERE id=? AND expires_at>?').bind(groupId, iso(new Date())).first<{status: 'draft' | 'drawn'}>();
  if (!group) return error('Grupo não encontrado ou expirado', 404);
  const participant = await env.DB.prepare('SELECT name FROM participants WHERE id=? AND group_id=?').bind(participantId, groupId).first<{name:string}>();
  if (!participant) return error('Participante não encontrado neste grupo', 404);
  return { status: group.status, name: participant.name };
}
async function getEnvelope(groupId: string, participantId: string, env: Env): Promise<Response> {
  const context = await envelopeContext(groupId, participantId, env);
  if (context instanceof Response) return context;
  if (context.status !== 'drawn') return error('O grupo ainda não foi sorteado', 409);
  const assignment = await env.DB.prepare('SELECT first_opened_at FROM assignments WHERE group_id=? AND giver_id=?').bind(groupId, participantId).first<{first_opened_at:string|null}>();
  if (!assignment) return error('Envelope não encontrado', 404);
  return json({ groupId, participantId, opened: assignment.first_opened_at !== null, firstOpenedAt: assignment.first_opened_at });
}
async function revealEnvelope(groupId: string, participantId: string, env: Env): Promise<Response> {
  const context = await envelopeContext(groupId, participantId, env);
  if (context instanceof Response) return context;
  if (context.status !== 'drawn') return error('O grupo ainda não foi sorteado', 409);
  const assignment = await env.DB.prepare('SELECT recipient_ciphertext,recipient_iv,first_opened_at FROM assignments WHERE group_id=? AND giver_id=?').bind(groupId, participantId).first<{recipient_ciphertext:string;recipient_iv:string;first_opened_at:string|null}>();
  if (!assignment) return error('Envelope não encontrado', 404);
  if (!env.DRAW_ENCRYPTION_KEY) return error('Chave de criptografia não configurada', 503);
  const recipientId = await decryptRecipient(assignment.recipient_ciphertext, assignment.recipient_iv, env.DRAW_ENCRYPTION_KEY);
  const recipient = await env.DB.prepare('SELECT id,name FROM participants WHERE id=? AND group_id=?').bind(recipientId, groupId).first<{id:string;name:string}>();
  if (!recipient) return error('Destinatário do sorteio não encontrado', 500);
  // A atualização condicional preserva a primeira abertura, inclusive em requisições simultâneas.
  await env.DB.prepare('UPDATE assignments SET first_opened_at=? WHERE group_id=? AND giver_id=? AND first_opened_at IS NULL').bind(iso(new Date()), groupId, participantId).run();
  const opened = await env.DB.prepare('SELECT first_opened_at FROM assignments WHERE group_id=? AND giver_id=?').bind(groupId, participantId).first<{first_opened_at:string}>();
  return json({ groupId, participantId, participantName: context.name, recipient: { id: recipient.id, name: recipient.name }, firstOpenedAt: opened?.first_opened_at ?? null, alreadyOpened: assignment.first_opened_at !== null });
}
async function runDraw(request: Request, groupId: string, env: Env): Promise<Response> {
  const bearer = request.headers.get('authorization')?.match(/^Bearer (\S+)$/i)?.[1];
  if (!bearer) return error('Token administrativo obrigatório', 401);
  const group = await env.DB.prepare('SELECT id,admin_token_hash,status FROM groups WHERE id=? AND expires_at>?').bind(groupId, iso(new Date())).first<{id:string;admin_token_hash:string;status:string}>();
  if (!group) return error('Grupo não encontrado ou expirado', 404);
  if (await sha256(bearer) !== group.admin_token_hash) return error('Token administrativo inválido', 403);
  if (group.status !== 'draft') return error('Este grupo já foi sorteado', 409);
  const participants = (await env.DB.prepare('SELECT id FROM participants WHERE group_id=? ORDER BY rowid').bind(groupId).all<{id:string}>()).results;
  const restrictions = (await env.DB.prepare('SELECT participant_a,participant_b FROM restrictions WHERE group_id=?').bind(groupId).all<{participant_a:string;participant_b:string}>()).results;
  const indices = new Map(participants.map((p,i) => [p.id, i]));
  const pairs = restrictions.map(r => [indices.get(r.participant_a)!, indices.get(r.participant_b)!] as const);
  const result = drawAssignments(participants.length, pairs);
  if (!result) return error('Não existe sorteio possível com estas restrições', 422);
  if (!env.DRAW_ENCRYPTION_KEY) return error('Chave de criptografia não configurada', 503);
  const encrypted = await Promise.all(result.map(index => encryptRecipient(participants[index].id, env.DRAW_ENCRYPTION_KEY)));
  const statements = [
    env.DB.prepare('INSERT INTO draw_guards (group_id,created_at) VALUES (?,?)').bind(groupId, iso(new Date())),
    ...participants.map((p,i) => env.DB.prepare('INSERT INTO assignments (group_id,giver_id,recipient_ciphertext,recipient_iv) VALUES (?,?,?,?)').bind(groupId, p.id, encrypted[i].cipher, encrypted[i].iv)),
    env.DB.prepare("UPDATE groups SET status='drawn' WHERE id=? AND status='draft'").bind(groupId)
  ];
  try { await env.DB.batch(statements); }
  catch { return error('O sorteio já foi realizado ou não pôde ser salvo', 409); }
  return json({ groupId, status: 'drawn', participantsCount: participants.length }, 201);
}
// O painel exige o token do organizador; o link público nunca o inclui.
async function getAdminOverview(request: Request, groupId: string, env: Env): Promise<Response> {
  const bearer = request.headers.get('authorization')?.match(/^Bearer (\S+)$/i)?.[1];
  if (!bearer) return error('Token administrativo obrigatório', 401);
  const group = await env.DB.prepare('SELECT id,name,status,admin_token_hash FROM groups WHERE id=? AND expires_at>?')
    .bind(groupId, iso(new Date()))
    .first<{id:string;name:string;status:string;admin_token_hash:string}>();
  if (!group) return error('Grupo não encontrado ou expirado', 404);
  if (await sha256(bearer) !== group.admin_token_hash) return error('Token administrativo inválido', 403);
  if (group.status !== 'drawn') return error('O grupo ainda não foi sorteado', 409);
  const participants = (await env.DB.prepare(
    'SELECT p.id AS participantId,p.name AS participantName,a.first_opened_at AS firstOpenedAt FROM participants p LEFT JOIN assignments a ON a.group_id=p.group_id AND a.giver_id=p.id WHERE p.group_id=? ORDER BY p.rowid'
  ).bind(groupId).all<{participantId:string;participantName:string;firstOpenedAt:string|null}>()).results;
  return json({
    groupId:group.id,
    groupName:group.name,
    totalParticipants:participants.length,
    openedCount:participants.filter(p=>p.firstOpenedAt !== null).length,
    participants:participants.map(p=>({
      participantId:p.participantId,
      participantName:p.participantName,
      opened:p.firstOpenedAt !== null,
      firstOpenedAt:p.firstOpenedAt
    }))
  });
}
async function wishesContext(groupId: string, env: Env): Promise<Response | true> {
  const group = await env.DB.prepare('SELECT status FROM groups WHERE id=? AND expires_at>?').bind(groupId, iso(new Date())).first<{status:string}>();
  if (!group) return error('Grupo não encontrado ou expirado', 404);
  if (group.status !== 'drawn') return error('O grupo ainda não foi sorteado', 409);
  return true;
}
async function getWishes(groupId: string, env: Env): Promise<Response> {
  const valid = await wishesContext(groupId, env);
  if (valid !== true) return valid;
  const rows = await env.DB.prepare("SELECT p.id AS participantId,p.name AS participantName,COALESCE(w.content, '') AS content,w.updated_at AS updatedAt FROM participants p LEFT JOIN wishes w ON w.group_id=p.group_id AND w.participant_id=p.id WHERE p.group_id=? ORDER BY p.rowid").bind(groupId).all();
  return json({groupId, wishes: rows.results});
}
async function putWish(request: Request, groupId: string, participantId: string, env: Env): Promise<Response> {
  const valid = await wishesContext(groupId, env);
  if (valid !== true) return valid;
  const participant = await env.DB.prepare('SELECT id,name FROM participants WHERE id=? AND group_id=?').bind(participantId, groupId).first<{id:string;name:string}>();
  if (!participant) return error('Participante não encontrado neste grupo', 404);
  const raw = await request.text();
  if (raw.length > 4096) return error('Corpo da requisição muito grande', 413);
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return error('JSON inválido'); }
  if (!body || typeof body !== 'object' || Array.isArray(body) || typeof (body as {content?:unknown}).content !== 'string') return error('Informe content como texto');
  const content = (body as {content:string}).content.trim();
  if (Array.from(content).length > 500) return error('A lista deve ter no máximo 500 caracteres');
  const updatedAt = iso(new Date());
  await env.DB.prepare('INSERT INTO wishes (group_id,participant_id,content,updated_at) VALUES (?,?,?,?) ON CONFLICT(group_id,participant_id) DO UPDATE SET content=excluded.content,updated_at=excluded.updated_at').bind(groupId,participantId,content,updatedAt).run();
  return json({groupId,participantId,participantName:participant.name,content,updatedAt});
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/api/v1/health') return json({ status: 'ok', service: 'amigo-secreto-api', stage: '4C' });
    if (!env.DB) return error('Banco D1 não configurado', 503);
    if (request.method === 'POST' && url.pathname === '/api/v1/groups') {
      try { return await createGroup(request, env); } catch (e) { console.error('createGroup failed', e instanceof Error ? e.name : 'unknown'); return error('Não foi possível criar o grupo', 500); }
    }
    const match = url.pathname.match(/^\/api\/v1\/groups\/([a-f0-9-]{36})$/);
    if (request.method === 'GET' && match) {
      try { return await getGroup(match[1], env); } catch { return error('Não foi possível consultar o grupo', 500); }
    }
    const drawMatch = url.pathname.match(/^\/api\/v1\/groups\/([a-f0-9-]{36})\/draw$/);
    if (request.method === 'POST' && drawMatch) {
      try { return await runDraw(request, drawMatch[1], env); } catch (e) { console.error(
  'runDraw failed',
  e instanceof Error ? `${e.name}: ${e.message}` : 'unknown'
); return error('Não foi possível realizar o sorteio', 500); }
    }
    const adminMatch = url.pathname.match(/^\/api\/v1\/groups\/([a-f0-9-]{36})\/admin\/overview$/);
    if (request.method === 'GET' && adminMatch) {
      try { return await getAdminOverview(request, adminMatch[1], env); }
      catch (e) { console.error('admin overview failed', e instanceof Error ? e.name : 'unknown'); return error('Não foi possível consultar o painel', 500); }
    }
    const wishesMatch = url.pathname.match(/^\/api\/v1\/groups\/([a-f0-9-]{36})\/wishes(?:\/([a-f0-9-]{36}))?$/);
    if (wishesMatch) {
      try {
        if (request.method === 'GET' && !wishesMatch[2]) return await getWishes(wishesMatch[1], env);
        if (request.method === 'PUT' && wishesMatch[2]) return await putWish(request, wishesMatch[1], wishesMatch[2], env);
      } catch (e) {
        console.error('wishes failed', e instanceof Error ? e.name : 'unknown');
        return error('Não foi possível acessar as listas de desejos', 500);
      }
    }
    const envelopeMatch = url.pathname.match(/^\/api\/v1\/groups\/([a-f0-9-]{36})\/envelopes\/([a-f0-9-]{36})(\/reveal)?$/);
    if (envelopeMatch) {
      const [, groupId, participantId, action] = envelopeMatch;
      try {
        if (request.method === 'GET' && !action) return await getEnvelope(groupId, participantId, env);
        if (request.method === 'POST' && action === '/reveal') return await revealEnvelope(groupId, participantId, env);
      } catch (e) {
        console.error('envelope failed', e instanceof Error ? e.name : 'unknown');
        return error('Não foi possível consultar o envelope', 500);
      }
    }
    return error('Endpoint não encontrado', 404);
  }
} satisfies ExportedHandler<Env>;
