<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class UpdateLastSeen
{
    public function handle(Request $request, Closure $next)
    {
        if (Auth::check()) {
            $userId = Auth::id();
            
            // فقط هر ۶۰ ثانیه یکبار آپدیت کن (برای کاهش بار دیتابیس)
            $cacheKey = "last_seen_{$userId}";
            
            if (!Cache::has($cacheKey)) {
                Auth::user()->update(['last_seen_at' => now()]);
                Cache::put($cacheKey, true, 60); // 60 seconds
            }
        }
        
        return $next($request);
    }
}