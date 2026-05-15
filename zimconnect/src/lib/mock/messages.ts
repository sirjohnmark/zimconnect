/**
 * Messages data layer.
 * Persists to localStorage under "sanganai_conversations".
 * Shape: Conversation[] — each has a messages[] array.
 *
 * Seed data is merged with any user-created conversations on first load.
 */

export interface Message {
  id: string;
  senderId: string; // "me" | contact id
  body: string;
  sentAt: string;   // ISO string
  read: boolean;
}

export interface Conversation {
  id: string;
  contactId: string;
  contactName: string;
  contactInitial: string;
  contactAvatar?: string;
  listingId: string;
  listingTitle: string;
  listingImage?: string;
  listingPrice: number;
  listingCurrency: string;
  messages: Message[];
  /** ISO string of last message — used for sorting */
  updatedAt: string;
}

const STORAGE_KEY = "sanganai_conversations";

// ─── Seed conversations ───────────────────────────────────────────────────────

const SEED: Conversation[] = [
  {
    id: "conv-1",
    contactId: "u-farai",
    contactName: "Farai Ncube",
    contactInitial: "F",
    listingId: "2",
    listingTitle: "Toyota Corolla 2019 — 45,000km",
    listingImage: "https://picsum.photos/seed/zc-2/600/400",
    listingPrice: 12500,
    listingCurrency: "USD",
    updatedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    messages: [
      { id: "m1", senderId: "u-farai", body: "Hi, is this car still available?", sentAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), read: true },
      { id: "m2", senderId: "me",      body: "Yes it is! Still in great condition.", sentAt: new Date(Date.now() - 28 * 60 * 1000).toISOString(), read: true },
      { id: "m3", senderId: "u-farai", body: "Is the price negotiable? I can come view it tomorrow.", sentAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(), read: false },
    ],
  },
  {
    id: "conv-2",
    contactId: "u-chiedza",
    contactName: "Chiedza Mpofu",
    contactInitial: "C",
    listingId: "1",
    listingTitle: "Samsung Galaxy S24 Ultra — 256GB",
    listingImage: "https://picsum.photos/seed/zc-1/600/400",
    listingPrice: 650,
    listingCurrency: "USD",
    updatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    messages: [
      { id: "m4", senderId: "u-chiedza", body: "Does it come with the original charger?", sentAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(), read: true },
      { id: "m5", senderId: "me",        body: "Yes, charger, cable, and original box all included.", sentAt: new Date(Date.now() - 62 * 60 * 1000).toISOString(), read: true },
      { id: "m6", senderId: "u-chiedza", body: "Perfect! Can I pay in USD?", sentAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), read: false },
    ],
  },
  {
    id: "conv-3",
    contactId: "u-tinashe",
    contactName: "Tinashe Dube",
    contactInitial: "T",
    listingId: "4",
    listingTitle: "Dell XPS 15 Laptop — i7, 16GB RAM",
    listingImage: "https://picsum.photos/seed/zc-4/600/400",
    listingPrice: 850,
    listingCurrency: "USD",
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    messages: [
      { id: "m7", senderId: "u-tinashe", body: "I'm very interested. What's the earliest you can meet?", sentAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(), read: true },
      { id: "m8", senderId: "me",        body: "I'm free this weekend, Saturday works for me.", sentAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), read: true },
      { id: "m9", senderId: "u-tinashe", body: "Saturday at 10am then? I'll be in Avondale.", sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), read: true },
    ],
  },
  {
    id: "conv-4",
    contactId: "u-rumbi",
    contactName: "Rumbidzai Choto",
    contactInitial: "R",
    listingId: "3",
    listingTitle: "2-Bedroom Apartment — Avondale",
    listingImage: "https://picsum.photos/seed/zc-3/600/400",
    listingPrice: 450,
    listingCurrency: "USD",
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    messages: [
      { id: "m10", senderId: "u-rumbi", body: "Is electricity included in the rent?",              sentAt: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(), read: true },
      { id: "m11", senderId: "me",      body: "Yes, water and electricity are all included.",      sentAt: new Date(Date.now() - 49 * 60 * 60 * 1000).toISOString(), read: true },
      { id: "m12", senderId: "u-rumbi", body: "Thank you, I'll let you know by end of day.",      sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), read: true },
    ],
  },
];

// ─── Storage helpers ──────────────────────────────────────────────────────────

function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
      return SEED;
    }
    return JSON.parse(raw) as Conversation[];
  } catch {
    return SEED;
  }
}

function persist(convs: Conversation[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getConversations(): Conversation[] {
  return loadConversations().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function getConversation(id: string): Conversation | null {
  return loadConversations().find((c) => c.id === id) ?? null;
}

export function sendMessage(conversationId: string, body: string): Conversation {
  const convs = loadConversations();
  const idx = convs.findIndex((c) => c.id === conversationId);
  if (idx === -1) throw new Error("Conversation not found");

  const msg: Message = {
    id: `m-${Date.now()}`,
    senderId: "me",
    body,
    sentAt: new Date().toISOString(),
    read: true,
  };

  convs[idx] = {
    ...convs[idx],
    messages: [...convs[idx].messages, msg],
    updatedAt: msg.sentAt,
  };

  persist(convs);
  return convs[idx];
}

export function markConversationRead(conversationId: string): void {
  const convs = loadConversations();
  const idx = convs.findIndex((c) => c.id === conversationId);
  if (idx === -1) return;
  convs[idx].messages = convs[idx].messages.map((m) => ({ ...m, read: true }));
  persist(convs);
}

export function getTotalUnread(): number {
  return loadConversations().reduce(
    (sum, c) => sum + c.messages.filter((m) => m.senderId !== "me" && !m.read).length,
    0,
  );
}

export function deleteConversation(id: string): void {
  const convs = loadConversations().filter((c) => c.id !== id);
  persist(convs);
}
