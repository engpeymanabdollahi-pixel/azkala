<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureAdminRole;
use Illuminate\Auth\Middleware\Authenticate;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * Structural guards for the API route table.
 *
 * The project used to mount two route files (routes/api.php and the now-deleted
 * routes/api_v1.php) over the same "api/v1" prefix. Laravel keeps the *last*
 * registration for a given method+URI, so every accidental redefinition in the
 * second file silently replaced the first - which produced three separate
 * production bugs: an unauthenticated DELETE unfollow, a state-changing GET
 * follow, and a can-review endpoint that returned 401 to every caller because
 * its authenticated definition had been overwritten by a public one.
 *
 * None of those were detectable by ordinary feature tests using actingAs(),
 * because actingAs() sets the user directly and never runs route middleware.
 * These tests inspect the route table itself instead.
 */
class RoutingIntegrityTest extends TestCase
{
    /**
     * A duplicated name silently evicts the earlier route from the name lookup,
     * so route() starts resolving to a different URL than the author intended.
     * This caught api.php's three admin device-* groups all registering
     * admin.index / admin.store / admin.update / admin.destroy.
     */
    public function test_no_two_routes_share_a_name(): void
    {
        $byName = [];

        foreach (Route::getRoutes() as $route) {
            if ($name = $route->getName()) {
                $byName[$name][] = implode('|', $route->methods()).' '.$route->uri();
            }
        }

        $duplicates = array_filter($byName, fn ($routes) => count($routes) > 1);

        $this->assertSame([], $duplicates, 'Duplicate route names: '.json_encode($duplicates, JSON_UNESCAPED_SLASHES));
    }

    /**
     * Guards the specific collision that removing api_v1.php exposed: naming the
     * API's POST api/v1/login "login" steals the name from the web login page,
     * and Authenticate::redirectTo() calls route('login') to redirect guests.
     */
    public function test_route_login_still_resolves_to_the_web_login_page(): void
    {
        $this->assertSame(url('/login'), route('login'));
    }

    /**
     * The shadowing itself cannot be asserted from the route table: RouteCollection
     * is keyed by method+domain+uri, so a second registration *replaces* the first
     * rather than coexisting with it. By the time the table is built the evidence
     * is gone - which is precisely why the api_v1.php bugs survived 435 tests.
     *
     * So guard the structural precondition instead: exactly one API route file,
     * mounted once. Two files over one prefix is what made shadowing possible.
     */
    public function test_only_one_api_route_file_is_mounted(): void
    {
        $this->assertFileDoesNotExist(
            base_path('routes/api_v1.php'),
            'routes/api_v1.php is back. It was mounted over the same api/v1 prefix as routes/api.php, '.
            'where the last registration of a method+URI silently wins - it caused an unauthenticated '.
            'unfollow, a state-changing GET follow, and a permanently-401 can-review endpoint.'
        );

        $this->assertStringNotContainsString(
            'base_path(\'routes/',
            file_get_contents(base_path('bootstrap/app.php')),
            'bootstrap/app.php mounts an extra route file. Add routes to routes/api.php instead.'
        );
    }

    /**
     * State-changing operations must never be reachable over GET/HEAD: they are
     * cacheable, prefetchable by browsers, and trivially triggered by an <img>
     * tag. routes/api_v1.php had exposed GET api/v1/sellers/{id}/follow.
     */
    public function test_no_get_route_maps_to_a_state_changing_action(): void
    {
        $forbidden = ['follow', 'unfollow', 'store', 'update', 'destroy', 'delete'];
        $offenders = [];

        foreach (Route::getRoutes() as $route) {
            if (! in_array('GET', $route->methods(), true) || ! str_starts_with($route->uri(), 'api/')) {
                continue;
            }

            $action = $route->getActionMethod();

            if (in_array($action, $forbidden, true)) {
                $offenders[] = $route->uri().' -> '.$route->getActionName();
            }
        }

        $this->assertSame([], $offenders, 'GET routes bound to state-changing actions: '.json_encode($offenders, JSON_UNESCAPED_SLASHES));
    }

    /**
     * Anything under api/v1/admin must sit behind both authentication and the
     * admin role check - the middleware, not the controller, is what stops an
     * ordinary logged-in user from reaching admin data.
     */
    public function test_every_admin_route_is_behind_auth_and_the_admin_middleware(): void
    {
        $unprotected = [];

        foreach (Route::getRoutes() as $route) {
            if (! str_starts_with($route->uri(), 'api/v1/admin/')) {
                continue;
            }

            // gatherMiddleware() returns unresolved aliases ("admin", "auth:sanctum");
            // the router expands them to the class names the request actually runs.
            $middleware = app('router')->gatherRouteMiddleware($route);

            $hasAuth = (bool) array_filter(
                $middleware,
                fn ($m) => is_string($m) && str_contains($m, Authenticate::class)
            );
            $hasAdmin = (bool) array_filter(
                $middleware,
                fn ($m) => is_string($m) && str_contains($m, EnsureAdminRole::class)
            );

            if (! $hasAuth || ! $hasAdmin) {
                $unprotected[] = $route->uri();
            }
        }

        $this->assertSame([], $unprotected, 'Admin routes missing auth/admin middleware: '.json_encode($unprotected, JSON_UNESCAPED_SLASHES));
    }
}
