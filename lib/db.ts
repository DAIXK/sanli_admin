import { Prisma, Feedback as PrismaFeedback, AfterSaleReturnInfo as PrismaAfterSaleReturnInfo } from '@prisma/client';
import prisma from './prisma';

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
  id: string;
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
  basePricingMode: string;
  extraPricingModes: string[];
  tabId: string;
  isVisible: boolean;
  createdAt: string;
  order: number;
}

export interface Address {
  userName: string;
  telNumber: string;
  provinceName: string;
  cityName: string;
  countyName: string;
  detailInfo: string;
}

export interface Order {
  id: string;
  openid: string;
  address?: Address | null;
  products: any[];
  totalPrice: number;
  status: number;
  createdAt: string;
  updatedAt?: string;
  trackingNumber?: string | null;
  carrierName?: string | null;
  carrierCode?: string | null;
  remark?: string | null;
  expiresAt?: string | null;
  transactionId?: string | null;
  paidAmount?: number | null;
  paidAt?: string | null;
  afterSaleStatus?: number | null;
  afterSaleType?: string | null;
  afterSaleReason?: string | null;
  afterSaleDesc?: string | null;
  afterSaleImages?: string[] | null;
  afterSaleDeadline?: string | null;
  returnTrackingNumber?: string | null;
  returnCarrierCode?: string | null;
  refundAmount?: number | null;
}

export interface Design {
  id: string;
  openid: string;
  payload: any;
  createdAt: string;
  updatedAt: string;
}

export interface AfterSaleReturnInfo {
  receiverName: string;
  telNumber: string;
  address: string;
  note: string;
}

export interface Feedback {
  id: string;
  openid?: string | null;
  content: string;
  contact?: string | null;
  createdAt: string;
}

const toNumber = (val: Prisma.Decimal | number | null | undefined): number | null => {
  if (val === null || val === undefined) return null;
  return typeof val === 'number' ? val : Number(val);
};

const mapTab = (t: any): Tab => ({
  id: t.id,
  name: t.name,
  isVisible: t.isVisible,
  maxBeads: t.maxBeads,
  model: t.model,
  createdAt: t.createdAt?.toISOString?.() ?? t.createdAt,
});

const mapBead = (b: any): Bead => ({
  id: b.id,
  name: b.name,
  image: b.image,
  model: b.model,
  weight: toNumber(b.weight) ?? 0,
  width: toNumber(b.width) ?? 0,
  material: b.material,
  orientation: b.orientation,
  hasGold: b.hasGold,
  goldWeight: toNumber(b.goldWeight) ?? 0,
  price: toNumber(b.price) ?? 0,
  processingFee: toNumber(b.processingFee) ?? 0,
  basePricingMode: b.basePricingMode || 'fixed',
  extraPricingModes: b.extraPricingModes || [],
  tabId: b.tabId,
  isVisible: b.isVisible,
  createdAt: b.createdAt?.toISOString?.() ?? b.createdAt,
  order: b.order,
});

const mapOrder = (o: any): Order => ({
  id: o.id,
  openid: o.openid,
  address: (o.address as any) ?? null,
  products: (o.products as any[]) ?? [],
  totalPrice: toNumber(o.totalPrice) ?? 0,
  status: o.status,
  createdAt: o.createdAt?.toISOString?.() ?? o.createdAt,
  updatedAt: o.updatedAt?.toISOString?.() ?? o.createdAt?.toISOString?.() ?? o.createdAt,
  trackingNumber: o.trackingNumber ?? null,
  carrierName: o.carrierName ?? null,
  carrierCode: o.carrierCode ?? null,
  remark: o.remark ?? null,
  expiresAt: o.expiresAt ? o.expiresAt.toISOString() : null,
  transactionId: o.transactionId ?? null,
  paidAmount: toNumber(o.paidAmount),
  paidAt: o.paidAt ? o.paidAt.toISOString() : null,
  afterSaleStatus: o.afterSaleStatus ?? null,
  afterSaleType: o.afterSaleType ?? null,
  afterSaleReason: o.afterSaleReason ?? null,
  afterSaleDesc: o.afterSaleDesc ?? null,
  afterSaleImages: (o.afterSaleImages as any) ?? null,
  afterSaleDeadline: o.afterSaleDeadline ? o.afterSaleDeadline.toISOString() : null,
  returnTrackingNumber: o.returnTrackingNumber ?? null,
  returnCarrierCode: o.returnCarrierCode ?? null,
  refundAmount: toNumber(o.refundAmount),
});

const mapDesign = (d: any): Design => ({
  id: d.id,
  openid: d.openid,
  payload: d.payload,
  createdAt: d.createdAt?.toISOString?.() ?? d.createdAt,
  updatedAt: d.updatedAt?.toISOString?.() ?? d.updatedAt,
});

const mapFeedback = (f: PrismaFeedback): Feedback => ({
  id: f.id,
  content: f.content,
  contact: f.contact ?? null,
  openid: f.openid ?? null,
  createdAt: f.createdAt?.toISOString?.() ?? f.createdAt,
});

const ensureSingletons = async () => {
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', passwordHash: 'admin123', role: 'admin' },
  });
  await prisma.goldPrice.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, price: new Prisma.Decimal(0), updatedAt: new Date() },
  });
  await prisma.afterSaleReturnInfo.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, receiverName: '', telNumber: '', address: '', note: '' },
  });
};

export const db = {
  user: {
    findUnique: async (username: string) => {
      await ensureSingletons();
      return prisma.user.findUnique({ where: { username } }) as unknown as User | null;
    },
  },
  goldPrice: {
    get: async (): Promise<GoldPrice> => {
      await ensureSingletons();
      const row = await prisma.goldPrice.findUnique({ where: { id: 1 } });
      return {
        price: toNumber(row?.price) ?? 0,
        updatedAt: row?.updatedAt?.toISOString?.() ?? new Date().toISOString(),
      };
    },
    update: async (price: number): Promise<GoldPrice> => {
      await ensureSingletons();
      const row = await prisma.goldPrice.update({
        where: { id: 1 },
        data: { price: new Prisma.Decimal(price), updatedAt: new Date() },
      });
      return { price: Number(row.price), updatedAt: row.updatedAt.toISOString() };
    },
  },
  tab: {
    findMany: async () => {
      const tabs = await prisma.tab.findMany({ orderBy: { createdAt: 'desc' } });
      return tabs.map(mapTab);
    },
    create: async (tab: Omit<Tab, 'id' | 'createdAt'>) => {
      const created = await prisma.tab.create({ data: tab });
      return mapTab(created);
    },
    update: async (id: string, updates: Partial<Omit<Tab, 'id' | 'createdAt'>>) => {
      const updated = await prisma.tab.update({ where: { id }, data: updates });
      return mapTab(updated);
    },
    delete: async (id: string) => {
      await prisma.bead.deleteMany({ where: { tabId: id } });
      await prisma.tab.delete({ where: { id } });
    },
  },
  bead: {
    findMany: async () => {
      const beads = await prisma.bead.findMany({ orderBy: [{ tabId: 'asc' }, { order: 'asc' }] });
      return beads.map(mapBead);
    },
    create: async (bead: Omit<Bead, 'id' | 'createdAt' | 'order'> & { order?: number }) => {
      const maxOrder = await prisma.bead.aggregate({
        _max: { order: true },
        where: { tabId: bead.tabId },
      });
      const order = bead.order ?? (maxOrder._max.order ?? 0) + 1;
      const created = await prisma.bead.create({
        data: {
          ...bead,
          order,
          weight: new Prisma.Decimal(bead.weight),
          width: new Prisma.Decimal(bead.width),
          goldWeight: new Prisma.Decimal(bead.goldWeight),
          price: new Prisma.Decimal(bead.price),
          processingFee: new Prisma.Decimal(bead.processingFee),
          basePricingMode: bead.basePricingMode || 'fixed',
          extraPricingModes: bead.extraPricingModes || [],
        },
      });
      return mapBead(created);
    },
    update: async (id: string, updates: Partial<Omit<Bead, 'id' | 'createdAt'>>) => {
      const data: any = { ...updates };
      ['weight', 'width', 'goldWeight', 'price', 'processingFee'].forEach((key) => {
        if (updates[key as keyof typeof updates] !== undefined) {
          data[key] = new Prisma.Decimal(updates[key as keyof typeof updates] as any);
        }
      });
      const updated = await prisma.bead.update({ where: { id }, data });
      return mapBead(updated);
    },
    delete: async (id: string) => {
      await prisma.bead.delete({ where: { id } });
    },
    reorder: async (tabId: string, orderedIds: string[]) => {
      await prisma.$transaction(
        orderedIds.map((id, idx) =>
          prisma.bead.update({
            where: { id },
            data: { order: idx + 1 },
          }),
        ),
      );
      const beads = await prisma.bead.findMany({ where: { tabId }, orderBy: { order: 'asc' } });
      return beads.map(mapBead);
    },
  },
  order: {
    findById: async (id: string) => {
      const order = await prisma.order.findUnique({ where: { id } });
      return order ? mapOrder(order) : null;
    },
    findMany: async (filter?: {
      openid?: string;
      status?: number;
      keyword?: string;
      createdFrom?: string;
      createdTo?: string;
    }) => {
      const where: any = {};
      if (filter?.openid) where.openid = filter.openid;
      if (filter?.status !== undefined) where.status = filter.status;
      if (filter?.keyword) {
        const kw = filter.keyword;
        where.OR = [
          { id: { contains: kw } },
          { transactionId: { contains: kw } },
          { trackingNumber: { contains: kw } },
          { returnTrackingNumber: { contains: kw } },
          { returnCarrierCode: { contains: kw } },
          { carrierName: { contains: kw } },
        ];
      }
      if (filter?.createdFrom || filter?.createdTo) {
        where.createdAt = {};
        if (filter.createdFrom) (where.createdAt as any).gte = new Date(filter.createdFrom);
        if (filter.createdTo) (where.createdAt as any).lte = new Date(filter.createdTo);
      }
      const orders = await prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
      return orders.map(mapOrder);
    },
    create: async (order: Omit<Order, 'id' | 'createdAt'>) => {
      const created = await prisma.order.create({
        data: {
          ...order,
          totalPrice: new Prisma.Decimal(order.totalPrice),
          paidAmount: order.paidAmount !== undefined && order.paidAmount !== null ? new Prisma.Decimal(order.paidAmount) : null,
          products: order.products as any,
          address: order.address as any,
          afterSaleImages: order.afterSaleImages as any,
        },
      });
      return mapOrder(created);
    },
    updateStatus: async (id: string, status: number) => {
      const updated = await prisma.order.update({ where: { id }, data: { status } });
      return mapOrder(updated);
    },
    update: async (id: string, updates: Partial<Omit<Order, 'id' | 'createdAt'>>) => {
      const data: any = { ...updates };
      if (updates.totalPrice !== undefined) data.totalPrice = new Prisma.Decimal(updates.totalPrice);
      if (updates.paidAmount !== undefined) data.paidAmount = updates.paidAmount === null ? null : new Prisma.Decimal(updates.paidAmount);
      if (updates.products !== undefined) data.products = updates.products as any;
      if (updates.address !== undefined) data.address = updates.address as any;
      if (updates.afterSaleImages !== undefined) data.afterSaleImages = updates.afterSaleImages as any;
      const updated = await prisma.order.update({ where: { id }, data });
      return mapOrder(updated);
    },
  },
  design: {
    findMany: async (filter?: { openid?: string }) => {
      const designs = await prisma.design.findMany({
        where: filter?.openid ? { openid: filter.openid } : undefined,
        orderBy: { createdAt: 'desc' },
      });
      return designs.map(mapDesign);
    },
    create: async (design: { openid: string; payload: any }) => {
      const created = await prisma.design.create({
        data: {
          openid: design.openid,
          payload: design.payload,
        },
      });
      return mapDesign(created);
    },
  },
  afterSaleReturnInfo: {
    get: async (): Promise<AfterSaleReturnInfo> => {
      await ensureSingletons();
      const info = await prisma.afterSaleReturnInfo.findUnique({ where: { id: 1 } });
      return {
        receiverName: info?.receiverName || '',
        telNumber: info?.telNumber || '',
        address: info?.address || '',
        note: info?.note || '',
      };
    },
    update: async (info: Partial<AfterSaleReturnInfo>): Promise<AfterSaleReturnInfo> => {
      await ensureSingletons();
      const updated = await prisma.afterSaleReturnInfo.update({
        where: { id: 1 },
        data: info,
      });
      return {
        receiverName: updated.receiverName || '',
        telNumber: updated.telNumber || '',
        address: updated.address || '',
        note: updated.note || '',
      };
    },
  },
  feedback: {
    findMany: async (filter?: { keyword?: string; createdFrom?: string; createdTo?: string }) => {
      const where: Prisma.FeedbackWhereInput = {};
      if (filter?.keyword) {
        const kw = filter.keyword;
        where.OR = [
          { content: { contains: kw } },
          { contact: { contains: kw } },
          { openid: { contains: kw } },
        ];
      }
      if (filter?.createdFrom || filter?.createdTo) {
        where.createdAt = {};
        if (filter.createdFrom) where.createdAt.gte = new Date(filter.createdFrom);
        if (filter.createdTo) where.createdAt.lte = new Date(filter.createdTo);
      }
      const list = await prisma.feedback.findMany({ where, orderBy: { createdAt: 'desc' } });
      return list.map(mapFeedback);
    },
    create: async (feedback: { content: string; contact?: string | null; openid?: string | null }) => {
      const created = await prisma.feedback.create({
        data: {
          content: feedback.content,
          contact: feedback.contact,
          openid: feedback.openid,
        },
      });
      return mapFeedback(created);
    },
  },
};
