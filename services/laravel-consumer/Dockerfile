FROM php:8.2-cli

# Instalamos las dependencias del sistema que PHP necesita para funcionar con MySQL,
# ZIP (para Composer), y GIT (para descargar paquetes)
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libzip-dev \
    unzip \
    libonig-dev \
    libxml2-dev \
    && docker-php-ext-install pdo pdo_mysql zip mbstring xml \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copiamos Composer desde su imagen oficial — más limpio que descargarlo con curl
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Copiamos primero solo composer.json y composer.lock para aprovechar el cache de Docker:
# si no cambian las dependencias, esta capa se cachea y no se vuelve a ejecutar
COPY composer.json composer.lock* ./

# Instalamos dependencias PHP (--no-dev en producción, pero aquí ponemos todo)
RUN composer install --no-interaction --no-scripts --prefer-dist

# Ahora copiamos el resto del código
COPY . .

# Creamos los directorios que Laravel necesita y les damos permisos de escritura
RUN mkdir -p storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    public/uploads/products \
    && chmod -R 775 storage bootstrap/cache public/uploads

EXPOSE 8000

# php artisan serve arranca el servidor de desarrollo de PHP en el puerto 8000
# --host=0.0.0.0 para que sea accesible desde fuera del contenedor
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
