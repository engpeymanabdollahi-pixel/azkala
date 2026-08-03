<?php

namespace App\Services;

use App\Models\SellerRequest;
use App\Models\User;

class SellerRequestService
{
    public function findActiveRequest(int $userId): ?SellerRequest
    {
        return SellerRequest::where('user_id', $userId)
            ->whereIn('status', ['pending', 'approved'])
            ->first();
    }

    public function getLatestRequest(int $userId): ?SellerRequest
    {
        return SellerRequest::where('user_id', $userId)->latest()->first();
    }

    public function submitInitialRequest(User $user, array $data): SellerRequest
    {
        $user->update([
            'name' => $data['full_name'],
            'national_code' => $data['national_code'],
            'phone' => $data['phone'],
            'role' => 'pending_seller',
        ]);

        return SellerRequest::create([
            'user_id' => $user->id,
            'shop_name' => $data['proposed_shop_name'] ?: ('فروشگاه ' . $data['full_name']),
            'national_code' => $data['national_code'],
            'phone' => $data['phone'],
            'description' => 'درخواست ثبت شده از فرم جدید',
            'status' => 'pending_initial',
        ]);
    }

    public function completeRequest(SellerRequest $sellerRequest, User $user, array $data): void
    {
        $sellerRequest->update([
            'shop_name' => $data['shop_name'],
            'shop_alias' => $data['shop_alias'] ?? null,
            'bank_name' => $data['bank_name'],
            'bank_account' => $data['bank_account'],
        ]);

        $user->update(['role' => 'seller']);
    }

    public function uploadDocuments(SellerRequest $sellerRequest, array $validated, ?\Illuminate\Http\UploadedFile $idCardImage, ?\Illuminate\Http\UploadedFile $businessLicenseImage): void
    {
        $data = [
            'bank_account' => $validated['bank_account'],
            'status' => 'pending_final',
        ];

        if ($idCardImage) {
            $data['id_card_image'] = $idCardImage->store('seller_docs/id_cards', 'public');
        }

        if ($businessLicenseImage) {
            $data['business_license_image'] = $businessLicenseImage->store('seller_docs/licenses', 'public');
        }

        $sellerRequest->update($data);
    }
}
