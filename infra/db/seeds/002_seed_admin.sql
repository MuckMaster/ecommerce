USE ecommerce_bolsos;

INSERT INTO users (email, password_hash, name, role)
VALUES
  ('admin@bolsos.local',
   '$2b$10$wH8Z7p1r9v7c9w2D2dGk9e9xNQm3fP8o1u5iCqzSxV4mM6o7QKqkK',
   'Admin Tienda',
   'ADMIN');