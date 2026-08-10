<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ad;
use Illuminate\Http\Request;

class AdController extends Controller
{
    /**
     * دریافت تبلیغات فعال برای نمایش در frontend
     */
    public function active(Request $request)
    {
        $position = $request->input('position', 'sidebar');
        $limit = min((int) $request->input('limit', 5), 10);

        $ads = Ad::active()
            ->position($position)
            ->orderBy('priority', 'desc')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $ads,
            'count' => $ads->count(),
        ]);
    }
}