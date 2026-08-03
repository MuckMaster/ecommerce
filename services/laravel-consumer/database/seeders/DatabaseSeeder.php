<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

// Seeder principal — por ahora vacío porque la BD ya tiene datos de Prisma/seeds
// Si necesitamos seeds de prueba, los añadimos aquí con php artisan db:seed
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // La BD ya está poblada por las migraciones y seeds de Prisma
        // que están en infra/db/seeds/
        //
        // Para añadir un admin de prueba en desarrollo, descomenta:
        // \App\Models\User::create([
        //     'name'          => 'Admin',
        //     'email'         => 'admin@test.com',
        //     'password_hash' => \Illuminate\Support\Facades\Hash::make('admin123'),
        //     'role'          => 'ADMIN',
        // ]);
    }
}
