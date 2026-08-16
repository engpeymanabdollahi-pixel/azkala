<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReferralRewardRule;
use App\Services\Admin\AdminReferralRuleService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * مدیریت ادمین روی قوانین پاداش سطحی معرفی — Referral Rule Engine
 * (Part 4 audit). دسترسی از طریق permission:referrals.view/manage در
 * routes/api.php enforce می‌شود — همان permission موجودِ رزروشده برای
 * «توسعه‌ی آینده»، بدون Permission جدید.
 */
class AdminReferralRuleController extends Controller
{
    public function __construct(protected AdminReferralRuleService $service) {}

    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => $this->service->list(),
            'stats' => $this->service->stats(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateRule($request);

        $rule = $this->service->create($validated);

        return response()->json(['success' => true, 'data' => $rule], 201);
    }

    public function update(Request $request, int $id)
    {
        $validated = $this->validateRule($request, $id);

        try {
            $rule = $this->service->update($id, $validated);

            return response()->json(['success' => true, 'data' => $rule]);
        } catch (ModelNotFoundException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 404);
        }
    }

    public function destroy(int $id)
    {
        try {
            $this->service->delete($id);

            return response()->json(['success' => true, 'message' => 'قانون حذف شد']);
        } catch (ModelNotFoundException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 404);
        }
    }

    public function toggle(int $id)
    {
        try {
            $rule = $this->service->toggleActive($id);

            return response()->json(['success' => true, 'data' => $rule]);
        } catch (ModelNotFoundException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 404);
        }
    }

    public function triggerHistory(Request $request)
    {
        $history = $this->service->triggerHistory((int) $request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $history->items(),
            'pagination' => [
                'current_page' => $history->currentPage(),
                'last_page' => $history->lastPage(),
                'per_page' => $history->perPage(),
                'total' => $history->total(),
            ],
        ]);
    }

    private function validateRule(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'milestone' => [
                'required', 'integer', 'min:1',
                Rule::unique('referral_reward_rules', 'milestone')->ignore($ignoreId)->whereNull('deleted_at'),
            ],
            'reward_type' => ['required', Rule::in([
                ReferralRewardRule::TYPE_FIXED_CREDIT,
                ReferralRewardRule::TYPE_FIXED_COUPON,
                ReferralRewardRule::TYPE_PERCENTAGE_COUPON,
            ])],
            'reward_value' => [
                'required', 'numeric', 'min:0.01',
                // درصد کوپن معنایی بیش از ۱۰۰٪ ندارد؛ فقط برای همین یک
                // نوع اعمال می‌شود، بقیه (مبلغ ثابت) بدون سقف بالا هستند.
                $request->input('reward_type') === ReferralRewardRule::TYPE_PERCENTAGE_COUPON ? 'max:100' : '',
            ],
            'min_order_amount' => 'nullable|numeric|min:0',
            'max_discount' => 'nullable|numeric|min:0',
            'coupon_expiration_days' => 'nullable|integer|min:1',
            'usage_limit' => 'nullable|integer|min:1',
            'repeatable' => 'sometimes|boolean',
            'priority' => 'nullable|integer|min:0',
            'is_active' => 'sometimes|boolean',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'description' => 'nullable|string|max:500',
        ]);
    }
}
