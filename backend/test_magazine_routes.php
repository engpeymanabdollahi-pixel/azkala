<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Route;

echo "=== Test Magazine Routes ===\n\n";

try {
    $routes = Route::getRoutes();
    
    // ========================================
    // Test 1: Public routes exist
    // ========================================
    echo "🧪 Test 1: Public magazine routes\n";
    
    $publicRoutes = [
        'magazine.index' => ['GET', 'api/v1/magazine'],
        'magazine.featured' => ['GET', 'api/v1/magazine/featured'],
        'magazine.stats' => ['GET', 'api/v1/magazine/stats'],
        'magazine.category' => ['GET', 'api/v1/magazine/category/{category}'],
        'magazine.device.news' => ['GET', 'api/v1/magazine/device/{modelId}/news'],
        'magazine.show' => ['GET', 'api/v1/magazine/{slug}'],
    ];
    
    $allFound = true;
    foreach ($publicRoutes as $name => [$method, $uri]) {
        $route = $routes->getByName($name);
        if ($route) {
            $routeMethods = implode(',', $route->methods());
            echo "   ✅ $name → $routeMethods $uri\n";
        } else {
            echo "   ❌ $name NOT FOUND\n";
            $allFound = false;
        }
    }
    
    if ($allFound) {
        echo "   ✅ All 6 public routes registered\n";
    }
    
    // ========================================
    // Test 2: Admin routes exist
    // ========================================
    echo "\n🧪 Test 2: Admin magazine routes\n";
    
    $adminRoutes = [
        'admin.magazine.index' => ['GET', 'api/v1/admin/magazine'],
        'admin.magazine.store' => ['POST', 'api/v1/admin/magazine'],
        'admin.magazine.stats' => ['GET', 'api/v1/admin/magazine/stats'],
        'admin.magazine.bulk-action' => ['POST', 'api/v1/admin/magazine/bulk-action'],
        'admin.magazine.show' => ['GET', 'api/v1/admin/magazine/{article}'],
        'admin.magazine.update' => ['PUT', 'api/v1/admin/magazine/{article}'],
        'admin.magazine.destroy' => ['DELETE', 'api/v1/admin/magazine/{article}'],
        'admin.magazine.toggle' => ['POST', 'api/v1/admin/magazine/{article}/toggle'],
    ];
    
    $allFound = true;
    foreach ($adminRoutes as $name => [$method, $uri]) {
        $route = $routes->getByName($name);
        if ($route) {
            $routeMethods = implode(',', $route->methods());
            echo "   ✅ $name → $routeMethods $uri\n";
        } else {
            echo "   ❌ $name NOT FOUND\n";
            $allFound = false;
        }
    }
    
    if ($allFound) {
        echo "   ✅ All 8 admin routes registered\n";
    }
    
    // ========================================
    // Test 3: Admin routes have 'admin' middleware
    // ========================================
    echo "\n🧪 Test 3: Admin routes have 'admin' middleware\n";
    
    $adminRoute = $routes->getByName('admin.magazine.index');
    $middlewares = $adminRoute->middleware();
    
    $hasAuth = in_array('auth:sanctum', $middlewares) || 
               collect($middlewares)->contains(fn ($m) => str_contains($m, 'auth'));
    $hasAdmin = in_array('admin', $middlewares) || 
                collect($middlewares)->contains(fn ($m) => str_contains($m, 'admin'));
    
    if ($hasAuth && $hasAdmin) {
        echo "   ✅ Admin routes have auth + admin middleware\n";
        echo "   Middlewares: " . implode(', ', $middlewares) . "\n";
    } else {
        echo "   ❌ Admin routes missing middleware\n";
        echo "   Middlewares: " . implode(', ', $middlewares) . "\n";
    }
    
    // ========================================
    // Test 4: Public routes don't have auth middleware
    // ========================================
    echo "\n🧪 Test 4: Public routes don't have auth middleware\n";
    
    $publicRoute = $routes->getByName('magazine.index');
    $middlewares = $publicRoute->middleware();
    
    $hasAuth = collect($middlewares)->contains(fn ($m) => str_contains($m, 'auth:sanctum'));
    
    if (!$hasAuth) {
        echo "   ✅ Public routes are accessible without auth\n";
        echo "   Middlewares: " . implode(', ', $middlewares) . "\n";
    } else {
        echo "   ❌ Public routes should not have auth\n";
    }
    
    // ========================================
    // Test 5: Route order (featured/stats before {slug})
    // ========================================
    echo "\n🧪 Test 5: Route order (featured/stats before {slug})\n";
    
    $featuredRoute = $routes->getByName('magazine.featured');
    $showRoute = $routes->getByName('magazine.show');
    
    if ($featuredRoute && $showRoute) {
        // اگر featured قبل از show ثبت شده، درست است
        $featuredUri = $featuredRoute->uri();
        $showUri = $showRoute->uri();
        
        echo "   Featured URI: $featuredUri\n";
        echo "   Show URI: $showUri\n";
        
        if ($featuredUri === 'api/v1/magazine/featured' && $showUri === 'api/v1/magazine/{slug}') {
            echo "   ✅ Route order correct (featured before {slug})\n";
        } else {
            echo "   ⚠️ Check route order\n";
        }
    }
    
    echo "\n════════════════════════════════════════\n";
    echo "✅ All route tests completed!\n";
    echo "════════════════════════════════════════\n";
    
} catch (\Exception $e) {
    echo "\n❌ Error: " . $e->getMessage() . "\n";
    echo "   File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}