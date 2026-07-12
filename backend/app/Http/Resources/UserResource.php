<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'avatar' => $this->avatar,
            'role' => $this->role,
            'is_active' => $this->is_active,
            'is_verified' => $this->email_verified_at !== null,
            
            // Relations
            'devices' => PhoneModelResource::collection($this->whenLoaded('devices')),
            'addresses' => AddressResource::collection($this->whenLoaded('addresses')),
            
            // Counts (برای پنل ادمین)
            'orders_count' => $this->when(
                $request->user()?->role === 'admin',
                $this->orders_count ?? 0
            ),
            
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
            'last_seen_at' => $this->last_seen_at?->format('Y-m-d H:i:s'),
        ];
    }
}