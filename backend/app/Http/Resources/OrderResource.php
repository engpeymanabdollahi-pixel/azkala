<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'status' => $this->status,
            'payment_status' => $this->payment_status,
            'payment_method' => $this->payment_method,
            
            // Financial
            'subtotal' => $this->subtotal,
            'shipping_cost' => $this->shipping_cost,
            'discount' => $this->discount,
            'total' => $this->total,
            
            // Shipping Address
            'shipping_address' => $this->whenLoaded('address', fn() => [
                'full_name' => $this->address->full_name ?? '',
                'phone' => $this->address->phone ?? '',
                'province' => $this->address->province ?? '',
                'city' => $this->address->city ?? '',
                'address' => $this->address->address ?? '',
                'postal_code' => $this->address->postal_code ?? '',
            ]),
            
            // Relations
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'user' => new UserResource($this->whenLoaded('user')),
            'coupon' => $this->whenLoaded('coupon', fn() => [
                'code' => $this->coupon->code,
                'discount' => $this->coupon->discount_amount,
            ]),
            
            // Timestamps
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
            'paid_at' => $this->paid_at?->format('Y-m-d H:i:s'),
            'delivered_at' => $this->delivered_at?->format('Y-m-d H:i:s'),
        ];
    }
}