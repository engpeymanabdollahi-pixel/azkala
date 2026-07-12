<?php

namespace App\DTOs\Order;

use Illuminate\Http\Request;

class CreateOrderDTO
{
    public function __construct(
        public readonly int $user_id,
        public readonly ?int $address_id,
        public readonly ?string $note,
        public readonly string $payment_method,
        public readonly array $items, // [{product_id, quantity, price}]
    ) {}

    /**
     * Create DTO from Request
     */
    public static function fromRequest(Request $request, int $userId, array $cartItems): self
    {
        return new self(
            user_id: $userId,
            address_id: $request->address_id ? (int) $request->address_id : null,
            note: $request->note,
            payment_method: $request->payment_method ?? 'online',
            items: $cartItems,
        );
    }

    /**
     * Validate the DTO
     */
    public function validate(): array
    {
        $errors = [];

        if (empty($this->items)) {
            $errors[] = 'سبد خرید خالی است';
        }

        if (!$this->address_id) {
            $errors[] = 'آدرس ارسال انتخاب نشده است';
        }

        if (!in_array($this->payment_method, ['online', 'wallet', 'cod'])) {
            $errors[] = 'روش پرداخت نامعتبر است';
        }

        return $errors;
    }
}