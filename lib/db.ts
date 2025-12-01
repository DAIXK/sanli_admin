import fs from 'fs/promises';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

export interface User {
  id: string;
  username: string;
  passwordHash: string; // In a real app, use bcrypt. For this demo, we might store plain or simple hash.
  role: 'admin' | 'user';
}

export interface Item {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface DatabaseSchema {
  users: User[];
  items: Item[];
}

// Initial data
const initialData: DatabaseSchema = {
  users: [
    {
      id: '1',
      username: 'admin',
      passwordHash: 'admin123', // Simplified for demo
      role: 'admin',
    },
  ],
  items: [
    {
      id: '1',
      name: 'Sample Item',
      description: 'This is a sample item.',
      createdAt: new Date().toISOString(),
    },
  ],
};

async function ensureDb() {
  try {
    await fs.access(DB_PATH);
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
  item: {
    findMany: async () => {
      const data = await getDb();
      return data.items;
    },
    create: async (item: Omit<Item, 'id' | 'createdAt'>) => {
      const data = await getDb();
      const newItem: Item = {
        ...item,
        id: Math.random().toString(36).slice(2, 9),
        createdAt: new Date().toISOString(),
      };
      data.items.push(newItem);
      await saveDb(data);
      return newItem;
    },
    update: async (id: string, updates: Partial<Omit<Item, 'id' | 'createdAt'>>) => {
      const data = await getDb();
      const index = data.items.findIndex((i) => i.id === id);
      if (index === -1) return null;
      
      data.items[index] = { ...data.items[index], ...updates };
      await saveDb(data);
      return data.items[index];
    },
    delete: async (id: string) => {
      const data = await getDb();
      data.items = data.items.filter((i) => i.id !== id);
      await saveDb(data);
    },
  },
};
