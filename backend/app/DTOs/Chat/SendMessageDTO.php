<?php

namespace App\DTOs\Chat;

use Illuminate\Http\Request;

class SendMessageDTO
{
    public function __construct(
        public readonly int $conversation_id,
        public readonly int $sender_id,
        public readonly string $message,
    ) {}

    /**
     * Create DTO from Request
     */
    public static function fromRequest(Request $request, int $conversationId, int $senderId): self
    {
        return new self(
            conversation_id: $conversationId,
            sender_id: $senderId,
            message: trim($request->message),
        );
    }

    /**
     * Validate the DTO
     */
    public function validate(): array
    {
        $errors = [];

        if (empty($this->message)) {
            $errors[] = 'پیام نمی‌تواند خالی باشد';
        }

        if (strlen($this->message) > 2000) {
            $errors[] = 'پیام نباید بیشتر از ۲۰۰۰ کاراکتر باشد';
        }

        return $errors;
    }
}