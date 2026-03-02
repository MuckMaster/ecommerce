/** Pagos con stripe**/

CREATE TABLE payments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  provider VARCHAR(30) NOT NULL DEFAULT 'stripe',
  stripe_payment_intent_id VARCHAR(120) NOT NULL,
  stripe_checkout_session_id VARCHAR(120) NULL,
  status ENUM('REQUIRES_PAYMENT','SUCCEEDED','FAILED','REFUNDED') NOT NULL DEFAULT 'REQUIRES_PAYMENT',
  amount_cents INT NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  raw_event JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payments_pi (stripe_payment_intent_id),
  UNIQUE KEY uq_payments_session (stripe_checkout_session_id),
  KEY idx_payments_order (order_id),
  KEY idx_payments_status (status),
  CONSTRAINT fk_payments_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;