#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="${CONTAINER_NAME:-ecommerce_bolsos_mysql}"

DB_NAME="${DB_NAME:-ecommerce_bolsos}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-root}"


# Seeds
SEED_FILES=(
  "infra/db/seeds/001_seed_categories.sql"
  "infra/db/seeds/002_seed_admin.sql"
  "infra/db/seeds/003_seed_coupons.sql"
)


# Helpers
die() { echo " $*" >&2; exit 1; }

require_file() {
  [[ -f "$1" ]] || die "No encuentro el archivo: $1"
}

docker_running() {
  docker ps --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"
}

mysql_exec_in_container() {
  # Ejecuta SQL pasado por stdin dentro del contenedor
  docker exec -i "$CONTAINER_NAME" mysql -u"$DB_USER" -p"$DB_PASSWORD" "$@"
}


# Validaciones
docker_running || die "El contenedor '$CONTAINER_NAME' no está corriendo. Ejecuta: docker compose up -d"

require_file "$MIGRATION_FILE"
for f in "${SEED_FILES[@]}"; do require_file "$f"; done

echo "Usando contenedor: $CONTAINER_NAME"
echo "DB: $DB_NAME | User: $DB_USER"


# RESET DB
echo "Reset: borrando y recreando DB '$DB_NAME'."
mysql_exec_in_container -e "DROP DATABASE IF EXISTS \`${DB_NAME}\`; CREATE DATABASE \`${DB_NAME}\` DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_0900_ai_ci;"


# MIGRATIONS
echo "Aplicando migración: $MIGRATION_FILE"
mysql_exec_in_container < "$MIGRATION_FILE"


# SEEDS
echo "Aplicando seeds..."
for seed in "${SEED_FILES[@]}"; do
  echo "   -> $seed"
  mysql_exec_in_container < "$seed"
done

echo "Reset completado (migraciones + seeds)."