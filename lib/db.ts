import fs from 'fs/promises';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'user';
}

export interface GoldPrice {
  price: number;
  updatedAt: string;
}

export interface Tab {
  id:string;
  name: string;
  isVisible: boolean;
  maxBeads: number;
  model: string;
  createdAt: string;
}

export interface Bead {
  id: string;
  name: string;
  image: string;
  model: string;
  weight: number;
  width: number;
  material: string;
  orientation: string;
  hasGold: boolean;
  goldWeight: number;
  price: number;
  processingFee: number;
  tabId: string;
  isVisible: boolean;
  createdAt: string;
}

export interface DatabaseSchema {
  users: User[];
  goldPrice: GoldPrice;
  tabs: Tab[];
  beads: Bead[];
}

// Initial data
const initialData: DatabaseSchema = {
  users: [
    {
      id: '1',
      username: 'admin',
      passwordHash: 'admin123',
      role: 'admin',
    },
  ],
  goldPrice: {
    price: 0,
    updatedAt: new Date().toISOString(),
  },
  tabs: [],
  beads: [],
};

async function ensureDb() {
  try {
    await fs.access(DB_PATH);
    // Ensure new fields exist if reading from old DB
    const data = JSON.parse(await fs.readFile(DB_PATH, 'utf-8'));
    let changed = false;
    if (!data.goldPrice) {
      data.goldPrice = initialData.goldPrice;
      changed = true;
    }
    if (!data.tabs) {
      data.tabs = [];
      changed = true;
    }
    if (!data.beads) {
      data.beads = [];
      changed = true;
    }
    if (changed) {
      await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
    }
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify(initialData, null, 2));
  }
}

export async function getDb(): Promise<DatabaseSchema> {
  await ensureDb();
  const data = await fs.readFile(DB_PATH, 'utf-8');
  return JSON.parse(data);
}

export async function saveDb(data: DatabaseSchema) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

export const db = {
  user: {
    findUnique: async (username: string) => {
      const data = await getDb();
      return data.users.find((u) => u.username === username);
    },
  },
  goldPrice: {
    get: async () => {
      const data = await getDb();
      return data.goldPrice;
    },
    update: async (price: number) => {
      const data = await getDb();
      data.goldPrice = { price, updatedAt: new Date().toISOString() };
      await saveDb(data);
      return data.goldPrice;
    },
  },
  tab: {
    findMany: async () => {
      const data = await getDb();
      return data.tabs;
    },
    create: async (tab: Omit<Tab, 'id' | 'createdAt'>) => {
      const data = await getDb();
      const newTab: Tab = {
        ...tab,
        id: Math.random().toString(36).slice(2, 9),
        createdAt: new Date().toISOString(),
      };
      data.tabs.push(newTab);
      await saveDb(data);
      return newTab;
    },
    update: async (id: string, updates: Partial<Omit<Tab, 'id' | 'createdAt'>>) => {
      const data = await getDb();
      const index = data.tabs.findIndex((t) => t.id === id);
      if (index === -1) return null;
      data.tabs[index] = { ...data.tabs[index], ...updates };
      await saveDb(data);
      return data.tabs[index];
    },
    delete: async (id: string) => {
      const data = await getDb();
      data.tabs = data.tabs.filter((t) => t.id !== id);
      // Also delete beads in this tab? Or keep them orphaned? Let's keep them for now or warn user.
      // For simplicity, just delete tab.
      await saveDb(data);
    },
  },
  bead: {
    findMany: async () => {
      const data = await getDb();
      return data.beads;
    },
    create: async (bead: Omit<Bead, 'id' | 'createdAt'>) => {
      const data = await getDb();
      const newBead: Bead = {
        ...bead,
        id: Math.random().toString(36).slice(2, 9),
        createdAt: new Date().toISOString(),
      };
      data.beads.push(newBead);
      await saveDb(data);
      return newBead;
    },
    update: async (id: string, updates: Partial<Omit<Bead, 'id' | 'createdAt'>>) => {
      const data = await getDb();
      const index = data.beads.findIndex((b) => b.id === id);
      if (index === -1) return null;
      data.beads[index] = { ...data.beads[index], ...updates };
      await saveDb(data);
      return data.beads[index];
    },
    delete: async (id: string) => {
      const data = await getDb();
      data.beads = data.beads.filter((b) => b.id !== id);
      await saveDb(data);
    },
  },
};
