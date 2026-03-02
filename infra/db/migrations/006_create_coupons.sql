/** Coupons **/

CREATE TABLE coupons (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(80) NOT NULL,
  type ENUM('PERCENT','FIXED') NOT NULL,
  value INT NOT NULL, -- percent (10) o fixed (cents)
  min_order_cents INT NULL,
  max_uses INT NULL,
  uses_count INT NOT NULL DEFAULT 0,
  expires_at DATETIME NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_coupons_code (code),
  KEY idx_coupons_active (is_active),
  KEY idx_coupons_expires (expires_at)
) ENGINE=InnoDB;


/** Cupon aplicado **/

CREATE TABLE order_coupons (
  order_id BIGINT UNSIGNED NOT NULL,
  coupon_id BIGINT UNSIGNED NOT NULL,
  discount_cents INT NOT NULL,
  PRIMARY KEY (order_id, coupon_id),
  KEY idx_oc_coupon (coupon_id),
  CONSTRAINT fk_oc_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_oc_coupon
    FOREIGN KEY (coupon_id) REFERENCES coupons(id)
    ON DELETE RESTRICT
) ENGINE=InnoDB;
