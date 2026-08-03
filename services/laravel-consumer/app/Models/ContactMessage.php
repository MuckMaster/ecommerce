<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// Mensajes recibidos a través del formulario de contacto
// Se guardan en BD para tener historial, y también se envían por email
class ContactMessage extends Model
{
    protected $table = 'contact_messages';

    // Solo created_at en esta tabla (sin updated_at)
    public $timestamps = false;

    protected $fillable = [
        'name',
        'email',
        'phone',    // Campo opcional
        'message',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];
}
