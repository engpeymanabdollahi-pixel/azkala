<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * Every path the frontend requests must exist in the route table.
 *
 * Nothing in either build catches a mismatch: the frontend compiles a string,
 * the backend registers a route, and they are only compared at runtime by a
 * user hitting a 404. That gap had swallowed whole admin sections - the chat
 * monitor, moderation reports, FAQ management, message templates, the
 * sentiment dashboard and suggestion management all called /admin/<thing>
 * while the backend serves them under /admin/chat-management/<thing>, and the
 * chat block/report UI called /chat/* against a backend on /chat/moderation/*.
 * 44 distinct calls had no route behind them.
 *
 * This test parses the frontend sources rather than mocking them, so it fails
 * the moment either side moves without the other.
 */
class FrontendApiContractTest extends TestCase
{
    /**
     * Frontend calls with no backend route, kept here only when the endpoint
     * is genuinely unbuilt. Remove an entry once the route exists.
     *
     * /seller/payouts has no model, table or migration behind it - the payouts
     * feature was never built, so the page cannot work regardless of routing.
     */
    private const KNOWN_UNBUILT = [
        'GET /seller/payouts',
    ];

    /**
     * Frontend calls that map to a route which only registers when
     * app()->environment('local') is true (routes/api.php, dev tools group).
     * The test suite boots under APP_ENV=testing, so Route::getRoutes() never
     * contains these — not because the backend is missing them, but because
     * shipping dev-only tooling (instant OTP lookup, one-click admin login)
     * under any other environment would itself be a real vulnerability.
     */
    private const KNOWN_DEV_ONLY = [
        'POST /dev/admin-login',
    ];

    private function frontendSrc(): string
    {
        return dirname(base_path()).'/frontend/src';
    }

    /**
     * @return array<string, string> "METHOD /path" => "file:line"
     */
    private function frontendCalls(): array
    {
        $calls = [];
        $pattern = '/apiClient\.(get|post|put|patch|delete)\(\s*[`\'"]([^`\'"]+)[`\'"]/i';

        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($this->frontendSrc(), \FilesystemIterator::SKIP_DOTS)
        );

        foreach ($files as $file) {
            if (! in_array($file->getExtension(), ['ts', 'tsx'], true)) {
                continue;
            }

            foreach (file($file->getPathname()) as $i => $line) {
                if (! preg_match_all($pattern, $line, $matches, PREG_SET_ORDER)) {
                    continue;
                }

                foreach ($matches as $match) {
                    [, $method, $path] = $match;

                    // Absolute URLs and runtime-built endpoints are out of scope.
                    if (! str_starts_with($path, '/')) {
                        continue;
                    }

                    $key = strtoupper($method).' '.$path;
                    $calls[$key] ??= basename($file->getPathname()).':'.($i + 1);
                }
            }
        }

        return $calls;
    }

    private function routeExists(string $method, string $path): bool
    {
        $path = explode('?', $path)[0];
        // A ${...} at the very end that is not its own segment is a query-string
        // append (e.g. `/categories${params}`), not part of the path.
        $path = preg_replace('/(?<!\/)\$\{[^}]*\}$/', '', $path);
        // Remaining interpolations stand in for a route parameter.
        $path = preg_replace('/\$\{[^}]*\}/', 'X', $path);
        $path = '/'.trim($path, '/');

        foreach (Route::getRoutes() as $route) {
            if (! str_starts_with($route->uri(), 'api/v1')) {
                continue;
            }
            if (! in_array($method, $route->methods(), true)) {
                continue;
            }

            $routePath = '/'.trim(substr($route->uri(), strlen('api/v1')), '/');
            $regex = '#^'.preg_replace('/\\\{[^}]+\\\}/', '[^/]+', preg_quote($routePath, '#')).'$#';

            if (preg_match($regex, $path)) {
                return true;
            }
        }

        return false;
    }

    public function test_every_endpoint_the_frontend_calls_is_registered(): void
    {
        $missing = [];

        foreach ($this->frontendCalls() as $call => $where) {
            [$method, $path] = explode(' ', $call, 2);

            if (! $this->routeExists($method, $path)
                && ! in_array($call, self::KNOWN_UNBUILT, true)
                && ! in_array($call, self::KNOWN_DEV_ONLY, true)) {
                $missing[$call] = $where;
            }
        }

        $this->assertSame(
            [],
            $missing,
            "The frontend calls these endpoints but no route serves them:\n  ".
            implode("\n  ", array_map(fn ($k, $v) => "{$k}  ({$v})", array_keys($missing), $missing))
        );
    }

    public function test_the_unbuilt_list_has_no_stale_entries(): void
    {
        $stale = [];

        foreach (self::KNOWN_UNBUILT as $call) {
            [$method, $path] = explode(' ', $call, 2);

            if ($this->routeExists($method, $path)) {
                $stale[] = $call;
            }
        }

        $this->assertSame([], $stale, 'These now have routes; remove them from KNOWN_UNBUILT: '.implode(', ', $stale));
    }

    /**
     * The parser must actually be finding call sites - if the frontend moves or
     * the apiClient helper is renamed, the test above would pass by finding
     * nothing at all.
     */
    /**
     * KNOWN_DEV_ONLY is only a safe allowlist as long as those routes really
     * are still gated behind app()->environment('local'). Route::getRoutes()
     * can't tell us that under APP_ENV=testing (the routes never register at
     * all), so this checks the source directly — the same reason the gate
     * exists to begin with must still be there.
     */
    public function test_the_dev_only_list_routes_are_still_environment_gated(): void
    {
        $routesSource = file_get_contents(base_path('routes/api.php'));

        $this->assertMatchesRegularExpression(
            '/environment\([\'"]local[\'"]\)\)\s*\{.*?admin-login/s',
            $routesSource,
            'POST /dev/admin-login is listed as KNOWN_DEV_ONLY but no longer looks environment-gated in routes/api.php.'
        );
    }

    public function test_the_parser_finds_the_frontend_call_sites(): void
    {
        $this->assertDirectoryExists($this->frontendSrc());
        $this->assertGreaterThan(100, count($this->frontendCalls()));
    }
}
