<?php

namespace App\Http\Controllers;

use App\Services\ContactService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

// Equivalente de contact.controller.js de Node.js
class ContactController extends Controller
{
    protected ContactService $contactService;

    public function __construct(ContactService $contactService)
    {
        $this->contactService = $contactService;
    }

    // POST /api/contact — sin autenticación requerida
    public function send(Request $request): JsonResponse
    {
        try {
            $name    = $request->input('name');
            $email   = $request->input('email');
            $phone   = $request->input('phone');
            $message = $request->input('message');

            if (!$name || !$email || !$message) {
                return response()->json(['error' => 'Missing required fields: name, email, message'], 400);
            }

            $result = $this->contactService->sendContactMessage($name, $email, $phone, $message);
            // ok:true + data con el registro guardado — igual que Node.js
            return response()->json(['ok' => true, 'data' => $result], 201);

        } catch (\Exception $e) {
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }
}
