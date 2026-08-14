<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Admin\AdminCommissionService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AdminCommissionController extends Controller
{
    public function __construct(protected AdminCommissionService $service) {}

    /**
     * فهرست Commission Rule ها (بازه‌ی امتیاز → سطح → نرخ کمیسیون)
     */
    public function rules()
    {
        return response()->json(['success' => true, 'data' => $this->service->getRules()]);
    }

    public function storeRule(Request $request)
    {
        $validated = $this->validateRule($request);

        $rule = $this->service->createRule($validated);

        return response()->json(['success' => true, 'data' => $rule], 201);
    }

    public function updateRule(Request $request, int $id)
    {
        $validated = $this->validateRule($request, $id);

        $rule = $this->service->updateRule($id, $validated);

        return response()->json(['success' => true, 'data' => $rule]);
    }

    public function destroyRule(int $id)
    {
        $this->service->deleteRule($id);

        return response()->json(['success' => true, 'message' => 'قانون کمیسیون حذف شد']);
    }

    /**
     * امتیاز/سطح/نرخ کمیسیون فعلی یک فروشنده
     */
    public function sellerInfo(User $user)
    {
        $this->ensureSeller($user);

        return response()->json(['success' => true, 'data' => $this->service->getSellerCommissionInfo($user)]);
    }

    /**
     * تنظیم یا پاک‌کردن override دستی کمیسیون یک فروشنده.
     * rate=null یا عدم ارسال rate یعنی «پاک‌کردن override» (برگشت به
     * محاسبه‌ی بر اساس Score/Rule).
     */
    public function setSellerOverride(Request $request, User $user)
    {
        $this->ensureSeller($user);

        $validated = $request->validate([
            'rate' => 'nullable|numeric|min:0|max:100',
        ]);

        $rate = array_key_exists('rate', $validated) ? $validated['rate'] : null;
        $this->service->setSellerOverride($user, $rate === null ? null : (float) $rate);

        return response()->json([
            'success' => true,
            'message' => $rate === null ? 'Override کمیسیون پاک شد؛ نرخ دوباره بر اساس Score محاسبه می‌شود.' : 'Override کمیسیون ثبت شد.',
            'data' => $this->service->getSellerCommissionInfo($user->fresh()),
        ]);
    }

    private function ensureSeller(User $user): void
    {
        if ($user->role !== 'seller') {
            throw ValidationException::withMessages(['user' => 'این کاربر فروشنده نیست.']);
        }
    }

    private function validateRule(Request $request, ?int $ignoreId = null): array
    {
        $validated = $request->validate([
            'level' => [
                $ignoreId ? 'sometimes' : 'required',
                'string',
                'max:30',
                Rule::unique('commission_rules', 'level')->ignore($ignoreId),
            ],
            'label' => ($ignoreId ? 'sometimes' : 'required').'|string|max:100',
            'min_score' => ($ignoreId ? 'sometimes' : 'required').'|numeric|min:0|max:100',
            'max_score' => 'nullable|numeric|min:0|max:100',
            'commission_rate' => ($ignoreId ? 'sometimes' : 'required').'|numeric|min:0|max:100',
            'is_active' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer|min:0',
        ]);

        // ✅ در ویرایش، اگر فقط یکی از min_score/max_score ارسال شده، برای
        // مقایسه‌ی معتبر، مقدار موجودِ دیگری از رکورد فعلی خوانده می‌شود —
        // وگرنه فرستادن تنها max_score بدون min_score این بررسی را کاملاً
        // دور می‌زد.
        $minScore = $validated['min_score']
            ?? ($ignoreId ? \App\Models\CommissionRule::find($ignoreId)?->min_score : null);
        $maxScore = array_key_exists('max_score', $validated)
            ? $validated['max_score']
            : ($ignoreId ? \App\Models\CommissionRule::find($ignoreId)?->max_score : null);

        if ($minScore !== null && $maxScore !== null && (float) $maxScore < (float) $minScore) {
            throw ValidationException::withMessages(['max_score' => 'حداکثر امتیاز نمی‌تواند کمتر از حداقل باشد.']);
        }

        return $validated;
    }
}
