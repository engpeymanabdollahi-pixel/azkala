<?php

namespace App\Services;

use App\Models\Address;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class AddressService
{
    public function getUserAddresses(int $userId): Collection
    {
        return Address::where('user_id', $userId)
            ->orderByDesc('is_default')
            ->orderByDesc('created_at')
            ->get();
    }

    public function createAddress(int $userId, array $data): Address
    {
        return DB::transaction(function () use ($userId, $data) {
            if (!empty($data['is_default'])) {
                Address::where('user_id', $userId)->update(['is_default' => false]);
            }

            $isFirstAddress = Address::where('user_id', $userId)->count() === 0;

            return Address::create([
                'user_id' => $userId,
                'title' => $data['title'],
                'full_name' => $data['full_name'],
                'phone' => $data['phone'],
                'province' => $data['province'],
                'city' => $data['city'],
                'address' => $data['address'],
                'postal_code' => $data['postal_code'] ?? null,
                'is_default' => $isFirstAddress || !empty($data['is_default']),
                // ✅ Nearby Stores Completion Phase — اختیاری؛ نبودشان در
                // $data به معنای null است، نه خطا.
                'latitude' => $data['latitude'] ?? null,
                'longitude' => $data['longitude'] ?? null,
            ]);
        });
    }

    public function updateAddress(int $addressId, int $userId, array $data): Address
    {
        $address = Address::where('id', $addressId)
            ->where('user_id', $userId)
            ->firstOrFail();

        return DB::transaction(function () use ($userId, $address, $data) {
            if (isset($data['is_default']) && $data['is_default']) {
                Address::where('user_id', $userId)
                    ->where('id', '!=', $address->id)
                    ->update(['is_default' => false]);
            }

            $address->update($data);

            return $address;
        });
    }

    public function deleteAddress(int $addressId, int $userId): void
    {
        $address = Address::where('id', $addressId)
            ->where('user_id', $userId)
            ->firstOrFail();

        $wasDefault = $address->is_default;
        $address->delete();

        if ($wasDefault) {
            $newDefault = Address::where('user_id', $userId)
                ->orderByDesc('created_at')
                ->first();

            if ($newDefault) {
                $newDefault->is_default = true;
                $newDefault->save();
            }
        }
    }

    public function setDefaultAddress(int $addressId, int $userId): Address
    {
        $address = Address::where('id', $addressId)
            ->where('user_id', $userId)
            ->firstOrFail();

        $address->setAsDefault();

        return $address;
    }
}
