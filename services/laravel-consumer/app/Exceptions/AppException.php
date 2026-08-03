<?php

namespace App\Exceptions;

// Excepción personalizada para errores de negocio de la aplicación
// Equivalente al patrón de Node.js donde se hace: error.code = "EMAIL_TAKEN"
// En PHP no podemos añadir propiedades arbitrarias a RuntimeException (code es protected int)
// así que usamos esta clase que tiene un errorCode string público
class AppException extends \RuntimeException
{
    // El código de error legible — ej: 'EMAIL_TAKEN', 'INVALID_CREDENTIALS', etc.
    private string $errorCode;

    public function __construct(string $message, string $errorCode)
    {
        parent::__construct($message);
        $this->errorCode = $errorCode;
    }

    // Método getter para leer el código de error en los controladores
    public function getErrorCode(): string
    {
        return $this->errorCode;
    }
}
