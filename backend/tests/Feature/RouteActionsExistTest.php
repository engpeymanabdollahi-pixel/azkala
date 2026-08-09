<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * A route may name a controller method that does not exist. Nothing complains
 * at boot, the route shows up in route:list looking perfectly healthy, and the
 * failure only appears when someone calls it - as a 500 BadMethodCallException.
 *
 * This started at 14 such routes. Those with existing service-layer support
 * were wired up, and those nothing called were removed. The 6 that remain are
 * a genuinely unbuilt feature - chat product-suggestions and sentiment - plus
 * one stray seller-ratings action. Implementing them means deciding what they
 * should do, so they are recorded here rather than silently tolerated.
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
        'GET|HEAD api/v1/chat/conversations/{conversation}/suggestions',
        'POST api/v1/chat/conversations/{conversation}/suggest',
        'GET|HEAD api/v1/chat/conversations/{conversation}/sentiment',
        'GET|HEAD api/v1/admin/advanced-reports/chat-analytics',
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
