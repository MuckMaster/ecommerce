-- La columna ya existe en la BD local (se añadió a mano sin migración ni db pull).
-- MySQL (a diferencia de MariaDB) no soporta "ADD COLUMN IF NOT EXISTS", así que
-- esta migración queda documentada aquí para otros entornos; en local no hace falta
-- volver a ejecutarla.
ALTER TABLE products ADD COLUMN care TEXT NULL AFTER material;
