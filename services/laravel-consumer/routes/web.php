<?php

use Illuminate\Support\Facades\Route;

// Ruta web de bienvenida — solo para confirmar que el servidor está vivo
// Las rutas reales están en routes/api.php bajo el prefijo /api
Route::get('/', function () {
    return response()->json([
        'app'     => 'Rivet Bags Laravel API',
        'version' => '1.0.0',
        'docs'    => 'See /api/* for available endpoints',
    ]);
});
