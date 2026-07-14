<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Seller\SellerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SellerDashboardController extends Controller
{
    protected SellerService $sellerService;

    public function __construct(SellerService $sellerService)
    {
        $this->sellerService = $sellerService;
    }

    /**
     * دریافت آمار داشبورد فروشنده
     */
    public function stats(Request $request)
    {
        try {
            $sellerId = $request->user()->id;
            $stats = $this->sellerService->getSellerDashboardStats($sellerId);

            return response()->json([
                'success' => true,
                'data' => $stats,
            ]);
        } catch (\Exception $e) {
            Log::error('SellerDashboardController@stats: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    public function wallet(Request $request)
    {
        $sellerId = $request->user()->id;
        $user = \App\Models\User::find($sellerId);
        
        $transactions = \App\Models\SellerTransaction::where('seller_id', $sellerId)
            ->orderBy('created_at', 'desc')
            ->take(20)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'wallet' => [
                    'balance' => $user->wallet_balance ?? 0,
                    'last_updated' => $user->updated_at,
                ],
                'transactions' => $transactions
            ]
        ]);
    }}
