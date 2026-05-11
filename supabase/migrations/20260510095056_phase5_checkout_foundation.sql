ALTER TABLE orders
ADD COLUMN IF NOT EXISTS checkout_source TEXT NOT NULL DEFAULT 'cart';

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'cod_pending';

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(10,2) NOT NULL DEFAULT 0;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 100;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_orders_checkout_source
ON orders(checkout_source);

CREATE INDEX IF NOT EXISTS idx_orders_payment_status
ON orders(payment_status);

CREATE INDEX IF NOT EXISTS idx_products_is_active
ON products(is_active);

CREATE INDEX IF NOT EXISTS idx_products_stock_quantity
ON products(stock_quantity);
