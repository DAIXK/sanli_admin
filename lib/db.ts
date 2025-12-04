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
  order: number;
}

export interface Order {
  id: string;
  openid: string;
  address?: string;
  products: any[];
  totalPrice: number;
  status: number; // 0: unpaid, 1: paid, 2: shipped, 3: completed
  createdAt: string;
  trackingNumber?: string;
  carrierName?: string;
  remark?: string;
}

export interface Design {
  id: string;
  openid: string;
  payload: any;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseSchema {
  users: User[];
  goldPrice: GoldPrice;
  tabs: Tab[];
  beads: Bead[];
  orders: Order[];
  designs: Design[];
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
  orders: [],
  designs: [],
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
    if (!data.orders) {
      data.orders = [];
      changed = true;
    }
    if (!data.designs) {
      data.designs = [];
      changed = true;
    }
    if (data.beads) {
      let maxOrder = 0;
      let missingOrder = false;
      data.beads = data.beads.map((b: any, index: number) => {
        if (b.order === undefined) {
          missingOrder = true;
          maxOrder = Math.max(maxOrder, index + 1);
          return { ...b, order: index + 1 };
        }
        maxOrder = Math.max(maxOrder, b.order);
        return b;
      });
      if (missingOrder) changed = true;
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
    create: async (bead: Omit<Bead, 'id' | 'createdAt' | 'order'> & { order?: number }) => {
      const data = await getDb();
      const maxOrder =
        data.beads
          .filter((b) => b.tabId === bead.tabId)
          .reduce((max, b) => Math.max(max, b.order ?? 0), 0) || 0;
      const newBead: Bead = {
        ...bead,
        id: Math.random().toString(36).slice(2, 9),
        createdAt: new Date().toISOString(),
        order: bead.order ?? maxOrder + 1,
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
    reorder: async (tabId: string, orderedIds: string[]) => {
      const data = await getDb();
      const beadsInTab = data.beads.filter((b) => b.tabId === tabId);
      const idToBead = new Map(beadsInTab.map((b) => [b.id, b]));
      orderedIds.forEach((id, index) => {
        const bead = idToBead.get(id);
        if (bead) {
          bead.order = index + 1;
        }
      });
      data.beads = [
        ...data.beads.filter((b) => b.tabId !== tabId),
        ...beadsInTab,
      ];
      await saveDb(data);
      return beadsInTab;
    },
  },
  order: {
    findMany: async (filter?: { openid?: string; status?: number }) => {
      const data = await getDb();
      let orders = data.orders;
      if (filter?.openid) {
        orders = orders.filter((o) => o.openid === filter.openid);
      }
      if (filter?.status !== undefined) {
        orders = orders.filter((o) => o.status === filter.status);
      }
      return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    create: async (order: Omit<Order, 'id' | 'createdAt'>) => {
      const data = await getDb();
      const newOrder: Order = {
        ...order,
        id: Math.random().toString(36).slice(2, 12),
        createdAt: new Date().toISOString(),
      };
      data.orders.push(newOrder);
      await saveDb(data);
      return newOrder;
    },
    updateStatus: async (id: string, status: number) => {
      const data = await getDb();
      const idx = data.orders.findIndex((o) => o.id === id);
      if (idx === -1) return null;
      data.orders[idx].status = status;
      await saveDb(data);
      return data.orders[idx];
    },
    update: async (id: string, updates: Partial<Omit<Order, 'id' | 'createdAt'>>) => {
      const data = await getDb();
      const idx = data.orders.findIndex((o) => o.id === id);
      if (idx === -1) return null;
      data.orders[idx] = { ...data.orders[idx], ...updates };
      await saveDb(data);
      return data.orders[idx];
    },
  },
  design: {
    findMany: async (filter?: { openid?: string }) => {
      const data = await getDb();
      let designs = data.designs;
      if (filter?.openid) {
        designs = designs.filter((d) => d.openid === filter.openid);
      }
      return designs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    create: async (design: { openid: string; payload: any }) => {
      const data = await getDb();
      const now = new Date().toISOString();
      const newDesign: Design = {
        id: Math.random().toString(36).slice(2, 12),
        openid: design.openid,
        payload: design.payload,
        createdAt: now,
        updatedAt: now,
      };
      data.designs.push(newDesign);
      await saveDb(data);
      return newDesign;
    },
  },
};
