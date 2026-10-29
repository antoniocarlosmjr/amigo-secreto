export type Participant = {
  id: string;
  name: string;
};

export type CreateGroupInput = {
  name: string;
  eventDate?: string;
  giftAmountCents?: number;
  participants: { name: string }[];
  restrictions?: [number, number][];
};

export type CreatedGroup = {
  groupId: string;
  adminToken: string;
  expiresAt: string;
  status: 'draft';
};

export type Group = {
  id: string;
  name: string;
  event_date: string | null;
  gift_amount_cents: number | null;
  expires_at: string;
  status: 'draft' | 'drawn';
  participants: Participant[];
};

async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erro ao comunicar com a API');
  }

  return data as T;
}

export const groupApi = {
  create: (input: CreateGroupInput) =>
    api<CreatedGroup>('/groups', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  get: (groupId: string) =>
    api<Group>(`/groups/${encodeURIComponent(groupId)}`),

  draw: (groupId: string, adminToken: string) =>
    api<{ groupId: string; status: 'drawn'; participantsCount: number }>(
      `/groups/${encodeURIComponent(groupId)}/draw`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    ),
};
