<?php

namespace App\Services;

use App\Models\SellerRequest;
use App\Models\User;

class SellerRequestService
{
    // ✅ قبلاً whereIn('status', ['pending', 'approved']) بود — 'pending'
    // مقداری است که هیچ درخواست واقعی‌ای هرگز نمی‌گیرد (وضعیت‌های واقعی
    // pending_initial/pending_documents/pending_final/approved/rejected
    // هستند)، پس این محافظِ «جلوگیری از ثبت درخواست تکراری» عملاً برای
    // ۳ حالت از ۴ حالتِ «در انتظار» کار نمی‌کرد.
    public function findActiveRequest(int $userId): ?SellerRequest
    {
        return SellerRequest::where('user_id', $userId)
            ->whereIn('status', ['pending_initial', 'pending_documents', 'pending_final', 'approved'])
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

    public function uploadDocuments(SellerRequest $sellerRequest, array $validated, ?\Illuminate\Http\UploadedFile $idCardImage, ?\Illuminate\Http\UploadedFile $businessLicenseImage): void
    {
        $data = [
            'bank_account' => $validated['bank_account'],
            // ✅ bank_name و shop_alias اضافه شدند — قبلاً هیچ‌جای جریان
            // فعلی این دو را از کاربر نمی‌پرسید (فقط endpoint متروک
            // complete() این‌ها را می‌خواست، که هیچ‌وقت صدا زده نمی‌شد).
            'bank_name' => $validated['bank_name'] ?? null,
            'shop_alias' => $validated['shop_alias'] ?? null,
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
