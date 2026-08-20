<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Verificamos si la app está en modo mantenimiento
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Cargamos el autoloader de Composer (todas las clases del proyecto y sus dependencias)
require __DIR__.'/../../laravel-app/vendor/autoload.php';

// Bootstrapeamos la aplicación y manejamos la petición HTTP entrante
$app = require_once __DIR__.'/../../laravel-app/bootstrap/app.php';

$app->handleRequest(Request::capture());
