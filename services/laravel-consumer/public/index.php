<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Verificamos si la app está en modo mantenimiento
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Cargamos el autoloader de Composer (todas las clases del proyecto y sus dependencias)
//Ruta para produccion//
//Desactivar en local//
//require __DIR__.'/../../laravel-app/vendor/autoload.php';//


//Ruta para local//
//Desactivar en produccion//
require __DIR__.'/../vendor/autoload.php';

//Ruta para produccion//
//Desactivar en local//
// Bootstrapeamos la aplicación y manejamos la petición HTTP entrante
//$app = require_once __DIR__.'/../../laravel-app/bootstrap/app.php';//


//Ruta para local//
//Desactivar en produccion//
$app = require_once __DIR__.'/../bootstrap/app.php';

$app->handleRequest(Request::capture());
