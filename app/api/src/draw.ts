/** Sorteio sem autoatribuição, com restrições mútuas.
 * Aleatoriedade criptográfica, mas NÃO distribuição uniforme entre todos os emparelhamentos.
 */
export type Restriction = readonly [number, number];

export function randomInt(max: number): number {
  if (!Number.isSafeInteger(max) || max <= 0 || max > 0x100000000) throw new RangeError('Limite inválido');
  const range = 0x100000000;
  const cutoff = range - (range % max);
  const buf = new Uint32Array(1);
  do { crypto.getRandomValues(buf); } while (buf[0] >= cutoff);
  return buf[0] % max;
}
function shuffle<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/** Retorna recipientByGiver[giver] = recipient, ou null se impossível. */
export function drawAssignments(count: number, restrictions: readonly Restriction[] = []): number[] | null {
  if (!Number.isInteger(count) || count < 3 || count > 50) throw new RangeError('Participantes: 3 a 50');
  const forbidden = Array.from({ length: count }, (_, i) => new Set([i]));
  for (const [a, b] of restrictions) {
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0 || a >= count || b >= count || a === b) throw new RangeError('Restrição inválida');
    forbidden[a].add(b); forbidden[b].add(a);
  }
  const options = Array.from({ length: count }, (_, i) => shuffle(Array.from({ length: count }, (_, j) => j).filter(j => !forbidden[i].has(j))));
  const recipientOwner = Array<number>(count).fill(-1);
  const order = shuffle(Array.from({ length: count }, (_, i) => i));
  function augment(giver: number, seen: boolean[]): boolean {
    for (const recipient of options[giver]) {
      if (seen[recipient]) continue;
      seen[recipient] = true;
      if (recipientOwner[recipient] === -1 || augment(recipientOwner[recipient], seen)) {
        recipientOwner[recipient] = giver;
        return true;
      }
    }
    return false;
  }
  for (const giver of order) if (!augment(giver, Array<boolean>(count).fill(false))) return null;
  const recipientByGiver = Array<number>(count).fill(-1);
  recipientOwner.forEach((giver, recipient) => { recipientByGiver[giver] = recipient; });
  return recipientByGiver;
}
