<?php

namespace App\Services;

use App\Models\ContactMessage;
use Illuminate\Support\Facades\Mail;

// Equivalente de contact.service.js de Node.js
// Guarda el mensaje en BD y envía un email SMTP al email de contacto configurado
class ContactService
{
    // Guarda el mensaje y envía el email de notificación
    // En Node.js se usaba nodemailer — aquí usamos el Mail facade de Laravel
    // que usa symfony/mailer por debajo (incluido en Laravel por defecto)
    public function sendContactMessage(string $name, string $email, ?string $phone, string $message): array
    {
        // Guardamos el mensaje en la BD para tener historial de contactos
        $contact = ContactMessage::create([
            'name'       => $name,
            'email'      => $email,
            'phone'      => $phone,
            'message'    => $message,
            'created_at' => now(),
        ]);

        // Enviamos el email de notificación al email de contacto configurado
        // Usamos un closure en to() para no depender de una clase Mailable
        $contactEmail = env('CONTACT_EMAIL');

        Mail::html(
            $this->buildEmailHtml($name, $email, $phone, $message),
            function ($mailMessage) use ($name, $contactEmail) {
                $mailMessage->to($contactEmail)
                            ->subject("Nuevo mensaje de contacto de {$name}");
            }
        );

        return [
            'id'         => (string) $contact->id,
            'name'       => $contact->name,
            'email'      => $contact->email,
            'phone'      => $contact->phone,
            'message'    => $contact->message,
            'created_at' => $contact->created_at,
        ];
    }

    // Construye el HTML del email — igual que el template de Node.js
    private function buildEmailHtml(string $name, string $email, ?string $phone, string $message): string
    {
        $phoneText = $phone ?: 'No proporcionado';
        return "
            <h2>Nuevo mensaje de contacto</h2>
            <p><strong>Nombre:</strong> {$name}</p>
            <p><strong>Email:</strong> {$email}</p>
            <p><strong>Teléfono:</strong> {$phoneText}</p>
            <p><strong>Mensaje:</strong></p>
            <p>{$message}</p>
        ";
    }
}
