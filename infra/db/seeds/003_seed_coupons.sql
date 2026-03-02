USE ecommerce_bolsos;

INSERT INTO coupons (code, type, value, min_order_cents, max_uses, uses_count, expires_at, is_active)
VALUES
  ('WELCOME10', 'PERCENT', 10, 3000, 500, 0, NULL, 1);