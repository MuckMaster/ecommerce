/** Pedido **/

CREATE TABLE orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_number VARCHAR(40) NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  email VARCHAR(255) NOT NULL,
  status ENUM('PENDING','PAID','SHIPPED','CANCELLED','REFUNDED') NOT NULL DEFAULT 'PENDING',
  subtotal_cents INT NOT NULL,
  discount_cents INT NOT NULL DEFAULT 0,
  shipping_cents INT NOT NULL DEFAULT 0,
  total_cents INT NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  shipping_name VARCHAR(255) NOT NULL,
  shipping_phone VARCHAR(40) NULL,
  shipping_address_line1 VARCHAR(255) NOT NULL,
  shipping_address_line2 VARCHAR(255) NULL,
  shipping_city VARCHAR(120) NOT NULL,
  shipping_postcode VARCHAR(30) NOT NULL,
  shipping_country VARCHAR(2) NOT NULL, -- ISO2 (ES, FR...)
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_orders_number (order_number),
  KEY idx_orders_user (user_id),
  KEY idx_orders_status_created (status, created_at),
  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;


/** Productos del pedido**/

CREATE TABLE order_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  variant_id BIGINT UNSIGNED NULL,
  product_name_snapshot VARCHAR(255) NOT NULL,
  variant_snapshot VARCHAR(255) NULL,
  unit_price_cents INT NOT NULL,
  qty INT NOT NULL,
  line_total_cents INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_order_items_order (order_id),
  KEY idx_order_items_product (product_id),
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_order_items_variant
    FOREIGN KEY (variant_id) REFERENCES product_variants(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;


/** Auditoria **/

CREATE TABLE order_status_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  from_status ENUM('PENDING','PAID','SHIPPED','CANCELLED','REFUNDED') NULL,
  to_status ENUM('PENDING','PAID','SHIPPED','CANCELLED','REFUNDED') NOT NULL,
  changed_by_user_id BIGINT UNSIGNED NULL,
  comment VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_osh_order (order_id),
  KEY idx_osh_changed_by (changed_by_user_id),
  CONSTRAINT fk_osh_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_osh_user
    FOREIGN KEY (changed_by_user_id) REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;
