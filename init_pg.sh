#!/usr/bin/env bash
set -euo pipefail

# 可按需修改
DB_NAME="sanli_admin"
DB_USER="postgres"
DB_PASS="postgres"
DB_HOST="localhost"
DB_PORT="5432"
DB_SUPERUSER="postgres"       # 具有创建权限的账号
DB_SUPERPASS=""               # 如有密码则填

# 连接串
if [ -n "$DB_SUPERPASS" ]; then
  export PGPASSWORD="$DB_SUPERPASS"
fi

# 创建角色（如不存在）
if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_SUPERUSER" -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1; then
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_SUPERUSER" -c "CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}';"
fi

# 创建数据库（如不存在）
if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_SUPERUSER" -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_SUPERUSER" -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER} ENCODING 'UTF8';"
fi

# 建表（用业务账号执行）
export PGPASSWORD="$DB_PASS"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<'SQL'
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','user'))
);

CREATE TABLE IF NOT EXISTS gold_price (
  id SMALLINT PRIMARY KEY DEFAULT 1,
  price NUMERIC(12,2) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS tabs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_visible BOOLEAN NOT NULL,
  max_beads INT NOT NULL,
  model TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS beads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image TEXT NOT NULL,
  model TEXT NOT NULL,
  weight NUMERIC(12,2) NOT NULL,
  width NUMERIC(12,2) NOT NULL,
  material TEXT NOT NULL,
  orientation TEXT NOT NULL,
  has_gold BOOLEAN NOT NULL,
  gold_weight NUMERIC(12,2) NOT NULL,
  price NUMERIC(12,2) NOT NULL,
  processing_fee NUMERIC(12,2) NOT NULL,
  base_pricing_mode TEXT NOT NULL DEFAULT 'fixed',
  extra_pricing_modes TEXT[] NOT NULL DEFAULT '{}',
  tab_id TEXT NOT NULL REFERENCES tabs(id),
  is_visible BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  "order" INT NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  openid TEXT NOT NULL,
  address JSONB,
  products JSONB NOT NULL,
  total_price NUMERIC(12,2) NOT NULL,
  status INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ,
  tracking_number TEXT,
  carrier_name TEXT,
  carrier_code TEXT,
  remark TEXT,
  expires_at TIMESTAMPTZ,
  transaction_id TEXT,
  paid_amount NUMERIC(12,2),
  paid_at TIMESTAMPTZ,
  after_sale_status INT,
  after_sale_type TEXT,
  after_sale_reason TEXT,
  after_sale_desc TEXT,
  after_sale_images JSONB,
  after_sale_deadline TIMESTAMPTZ,
  return_tracking_number TEXT,
  return_carrier_code TEXT,
  refund_amount NUMERIC(12,2)
);

CREATE TABLE IF NOT EXISTS designs (
  id TEXT PRIMARY KEY,
  openid TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS after_sale_return_info (
  id SMALLINT PRIMARY KEY DEFAULT 1,
  receiver_name TEXT,
  tel_number TEXT,
  address TEXT,
  note TEXT
);

CREATE TABLE IF NOT EXISTS feedbacks (
  id TEXT PRIMARY KEY,
  openid TEXT,
  content TEXT NOT NULL,
  contact TEXT,
  created_at TIMESTAMPTZ NOT NULL
);

-- 默认管理员账号
INSERT INTO users (id, username, password_hash, role)
VALUES ('1', 'admin', 'admin123', 'admin')
ON CONFLICT (username) DO NOTHING;

-- 预置分类
INSERT INTO tabs (id, name, is_visible, max_beads, model, created_at) VALUES
('005m4rd', '7*8手串', true, 29, 'https://sanli-access.oss-cn-shenzhen.aliyuncs.com/uploads/1764746515035_%E5%9C%88%E5%9C%8845.glb', '2025-12-03T06:16:26.013Z'),
('td30mk0', '4*6手串', true, 45, 'https://sanli-access.oss-cn-shenzhen.aliyuncs.com/uploads/1764746733189_%E5%9C%88%E5%9C%8845.glb', '2025-12-03T07:25:34.770Z')
ON CONFLICT (id) DO NOTHING;

-- 预置珠子
INSERT INTO beads (id, name, image, model, weight, width, material, orientation, has_gold, gold_weight, price, processing_fee, base_pricing_mode, extra_pricing_modes, tab_id, is_visible, created_at, "order") VALUES
('zcutn3e', '白药片', 'https://sanli-access.oss-cn-shenzhen.aliyuncs.com/uploads/1764755854821_%E8%8D%AF%E7%89%87%E7%99%BD%E7%8E%9B%E7%91%99.png', 'https://sanli-access.oss-cn-shenzhen.aliyuncs.com/uploads/1764755868652_%E7%99%BD%E8%8D%AF%E7%89%87.glb', 2, 4, '玛瑙', 'radial', false, 0, 1, 0, 'fixed', '{}', 'td30mk0', true, '2025-12-03T09:58:15.920Z', 7),
('llntnxv', '白玛瑙', 'https://sanli-access.oss-cn-shenzhen.aliyuncs.com/uploads/1764745163956_%E7%99%BD%E7%8E%9B%E7%91%99.png', 'https://sanli-access.oss-cn-shenzhen.aliyuncs.com/uploads/1764745182589_%E7%99%BD%E7%8E%9B%E7%91%991.glb', 1, 7, '玛瑙', 'radial', false, 0, 10, 0, 'fixed', '{}', '005m4rd', true, '2025-12-03T06:59:45.181Z', 5),
('08bqogj', '黑玛瑙', 'https://sanli-access.oss-cn-shenzhen.aliyuncs.com/uploads/1764746760031_%E9%BB%91%E7%8E%9B%E7%91%99.png', 'https://sanli-access.oss-cn-shenzhen.aliyuncs.com/uploads/1764746764713_%E9%BB%91%E7%8E%9B%E7%91%99.glb', 2, 7, '玛瑙', 'radial', false, 0, 10, 0, 'fixed', '{}', '005m4rd', true, '2025-12-03T07:26:28.857Z', 1),
('yuir763', '红玛瑙', 'https://sanli-access.oss-cn-shenzhen.aliyuncs.com/uploads/1764748982376_%E7%BA%A2%E7%8E%9B%E7%91%99.png', 'https://sanli-access.oss-cn-shenzhen.aliyuncs.com/uploads/1764749027377_%E7%BA%A2%E7%8E%9B%E7%91%99.glb', 1, 7, '玛瑙', 'radial', false, 0, 11, 0, 'fixed', '{}', '005m4rd', true, '2025-12-03T08:03:49.746Z', 2),
('7okdtcn', '蓝玛瑙', 'https://sanli-access.oss-cn-shenzhen.aliyuncs.com/uploads/1764749042238_%E8%93%9D%E7%8E%9B%E7%91%99.png', 'https://sanli-access.oss-cn-shenzhen.aliyuncs.com/uploads/1764749069445_%E8%93%9D%E7%8E%9B%E7%91%99.glb', 1, 7, '玛瑙', 'radial', false, 0, 11, 0, 'fixed', '{}', '005m4rd', true, '2025-12-03T08:04:33.737Z', 3),
('pj52fmg', '绿玛瑙', 'https://sanli-access.oss-cn-shenzhen.aliyuncs.com/uploads/1764755289095_%E7%BB%BF%E7%8E%9B%E7%91%99.png', 'https://sanli-access.oss-cn-shenzhen.aliyuncs.com/uploads/1764755534373_%E7%BB%BF%E7%8E%9B%E7%91%99.glb', 2, 7, '玛瑙', 'radial', false, 0, 10, 0, 'fixed', '{}', '005m4rd', true, '2025-12-03T09:52:37.828Z', 4),
('31asuf1', '磨砂珠', 'https://sanli-access.oss-cn-shenzhen.aliyuncs.com/uploads/1764755593403_%E7%A3%A8%E7%A0%82%E7%8F%A06mm.png', 'https://sanli-access.oss-cn-shenzhen.aliyuncs.com/uploads/1764755600299_%E7%A3%A8%E7%A0%82%E7%8F%A06mm.glb', 2, 7, '黄金', 'radial', true, 1, 10, 50, 'fixed', '{}', '005m4rd', true, '2025-12-03T09:53:52.866Z', 6)
ON CONFLICT (id) DO NOTHING;
SQL

echo "Done. DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
