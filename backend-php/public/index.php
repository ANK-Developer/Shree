<?php
// Front controller: Express ke app.js + routes/* ki jagah.
// Local: php -S localhost:5000 public/index.php   (Apache par public/.htaccess sab requests yahin bhejta hai)

// PHP built-in server: uploads jaisi asli files seedhe serve hon
if (PHP_SAPI === 'cli-server') {
    $file = __DIR__ . urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
    $real = realpath($file) ?: '';
    if (str_starts_with($real, realpath(__DIR__ . '/uploads') . DIRECTORY_SEPARATOR) && is_file($real)) {
        $types = ['jpg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp'];
        header('Content-Type: ' . ($types[strtolower(pathinfo($real, PATHINFO_EXTENSION))] ?? 'application/octet-stream'));
        header('Content-Length: ' . filesize($real));
        readfile($real);
        return true;
    }
}

$src = __DIR__ . '/../src';
require "$src/helpers.php";
load_env(__DIR__ . '/../.env');
date_default_timezone_set(env('TZ', 'Asia/Kolkata'));

require "$src/auth.php";
require "$src/upload.php";
require "$src/member_validation.php";
foreach (glob("$src/controllers/*.php") as $controller) require $controller;

ini_set('display_errors', '0');
set_exception_handler(function (Throwable $e) {
    error_log('Unhandled error: ' . $e->getMessage());
    fail(500, 'Server error');
});

// ---------- CORS ----------
// Comma-separated list allowed, e.g. "https://site.com,http://localhost:5173"
$allowed = array_map(fn($u) => rtrim(trim($u), '/'), explode(',', env('CLIENT_URL', 'http://localhost:5173')));
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && in_array($origin, $allowed, true)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Vary: Origin');
}
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE');
    if (!empty($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
        header('Access-Control-Allow-Headers: ' . $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']);
    }
    http_response_code(204);
    exit;
}

// ---------- Routing ----------
$method = $_SERVER['REQUEST_METHOD'] === 'HEAD' ? 'GET' : $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';
// Subfolder me deploy ho (jaise /shree/api/...) to uska prefix hata do
$script = $_SERVER['SCRIPT_NAME'] ?? '';
$base = basename($script) === 'index.php' ? rtrim(str_replace('\\', '/', dirname($script)), '/') : '';
if ($base !== '' && str_starts_with($path, $base)) $path = substr($path, strlen($base));
$path = '/' . trim($path, '/');

$ID = '([^/]+)';
$routes = [
    // Health check API
    ['GET', '/api/health', fn() => json_response(200, ['success' => true, 'message' => 'Shree Ji API is running'])],

    ['POST', '/api/auth/login', fn() => login()],
    ['GET', '/api/auth/me', fn() => get_me(require_admin())],

    ['GET', '/api/admins', function () { require_admin(); get_admins(); }],
    ['POST', '/api/admins', function () { require_admin(); create_admin(); }],
    ['PATCH', "/api/admins/$ID/status", fn($id) => update_admin_status(require_admin(), $id)],
    ['PATCH', "/api/admins/$ID/password", function ($id) { require_admin(); reset_admin_password($id); }],

    // Public: membership form submit
    ['POST', '/api/members', fn() => create_member()],
    // Admin only
    ['GET', '/api/members', function () { require_admin(); get_members(); }],
    ['GET', '/api/members/stats', function () { require_admin(); get_member_stats(); }], // "/:id" se pehle, warna "stats" id samjha jayega
    ['GET', "/api/members/$ID", function ($id) { require_admin(); get_member_by_id($id); }],
    ['GET', "/api/members/$ID/referred", function ($id) { require_admin(); get_referred_members($id); }],
    ['PATCH', "/api/members/$ID/status", function ($id) { require_admin(); update_member_status($id); }],

    ['GET', '/api/important-dates', function () { require_admin(); get_important_dates(); }],
    ['GET', '/api/dashboard', function () { require_admin(); get_dashboard(); }],

    // protect pehle: unauthorized request ki file disk par save hi na ho
    ['GET', '/api/events', function () { require_admin(); get_events(); }],
    ['POST', '/api/events', fn() => create_event(require_admin())],
    ['GET', "/api/events/$ID", function ($id) { require_admin(); get_event_by_id($id); }],
    ['PUT', "/api/events/$ID", function ($id) { require_admin(); update_event($id); }],
    ['DELETE', "/api/events/$ID", function ($id) { require_admin(); delete_event($id); }],
    ['PATCH', "/api/events/$ID/status", function ($id) { require_admin(); update_event_status($id); }],
    ['POST', "/api/events/$ID/sync-participants", function ($id) { require_admin(); sync_participants($id); }],
    ['GET', "/api/events/$ID/participants", function ($id) { require_admin(); get_participants($id); }],
    ['PATCH', "/api/events/$ID/participants/$ID", function ($id, $pid) { require_admin(); update_participant_status($id, $pid); }],
    ['GET', "/api/events/$ID/participants/$ID/calls", function ($id, $pid) { require_admin(); get_calls($id, $pid); }],
    ['POST', "/api/events/$ID/participants/$ID/calls", fn($id, $pid) => add_call(require_admin(), $id, $pid)],
];

foreach ($routes as [$routeMethod, $pattern, $handler]) {
    if ($routeMethod === $method && preg_match("#^$pattern$#D", $path, $m)) {
        $handler(...array_map('urldecode', array_slice($m, 1)));
        exit;
    }
}

// 404 handler
fail(404, 'Route not found');
