<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * A route may name a controller method that does not exist. Nothing complains
 * at boot, the route shows up in route:list looking perfectly healthy, and the
 * failure only appears when someone calls it - as a 500 BadMethodCallException.
 *
 * The repository currently has 14 such routes (see KNOWN_MISSING). They are
 * dead endpoints, including some that matter: DELETE /cart/clear,
 * PUT /reviews/{review}, DELETE /admin/categories/{category} and
 * POST /admin/orders/{order}/refund all answer 500 today. Implementing them is
 * feature work, so they are recorded here rather than silently tolerated.
 *
 * The test fails if a *new* one appears, and also if an entry in the list is
 * fixed without being removed from it - so the list cannot rot.
 */
class RouteActionsExistTest extends TestCase
{
    /**
     * Routes known to point at a missing controller method, as "METHODS uri".
     * Remove an entry once its action is implemented.
     */
    private const KNOWN_MISSING = [
        'GET|HEAD api/v1/seller-ratings/seller/{sellerId}',
        'DELETE api/v1/cart/clear',
        'PUT api/v1/reviews/{review}',
        'GET|HEAD api/v1/chat/conversations/{conversation}',
        'GET|HEAD api/v1/chat/conversations/{conversation}/suggestions',
        'POST api/v1/chat/conversations/{conversation}/suggest',
        'GET|HEAD api/v1/chat/conversations/{conversation}/sentiment',
        'POST api/v1/chat/online-status',
        'GET|HEAD api/v1/admin/advanced-reports/chat-analytics',
        'DELETE api/v1/admin/categories/{category}',
        'PUT api/v1/admin/categories/reorder',
        'GET|HEAD api/v1/admin/products/{product}',
        'GET|HEAD api/v1/admin/products/{product}/stats',
        'POST api/v1/admin/orders/{order}/refund',
    ];

    /**
     * @return array<string, string> "METHODS uri" => "Class::method"
     */
    private function routesWithMissingActions(): array
    {
        $missing = [];

        foreach (Route::getRoutes() as $route) {
            $action = $route->getActionName();

            if (! str_contains($action, '@')) {
                continue;
            }

            [$class, $method] = explode('@', $action, 2);
            $key = implode('|', $route->methods()).' '.$route->uri();

            if (! class_exists($class)) {
                $missing[$key] = "class does not exist: {$class}";
            } elseif (! method_exists($class, $method)) {
                $missing[$key] = class_basename($class)."::{$method}";
            }
        }

        return $missing;
    }

    public function test_no_new_route_points_at_a_missing_controller_method(): void
    {
        $missing = $this->routesWithMissingActions();
        $new = array_diff_key($missing, array_flip(self::KNOWN_MISSING));

        $this->assertSame(
            [],
            $new,
            "These routes are bound to controller methods that do not exist, so they answer 500 when called:\n  ".
            implode("\n  ", array_map(fn ($k, $v) => "{$k}  ->  {$v}", array_keys($new), $new))
        );
    }

    public function test_the_known_missing_list_has_no_stale_entries(): void
    {
        $missing = $this->routesWithMissingActions();
        $fixed = array_diff(self::KNOWN_MISSING, array_keys($missing));

        $this->assertSame(
            [],
            array_values($fixed),
            'These routes now resolve; remove them from KNOWN_MISSING: '.implode(', ', $fixed)
        );
    }
}
