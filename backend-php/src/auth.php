<?php
// JWT (HS256, jsonwebtoken package jaisa hi) + protect / adminOnly middleware

function b64url_encode(string $s): string
{
    return rtrim(strtr(base64_encode($s), '+/', '-_'), '=');
}

function b64url_decode(string $s): string|false
{
    return base64_decode(strtr($s, '-_', '+/') . str_repeat('=', (4 - strlen($s) % 4) % 4), true);
}

// "7d", "12h", "30m", "45s" ya sirf seconds
function expires_in_seconds(string $v): int
{
    if (!preg_match('/^(\d+)\s*([smhdw]?)$/iD', trim($v), $m)) return 7 * 86400;
    $mult = ['' => 1, 's' => 1, 'm' => 60, 'h' => 3600, 'd' => 86400, 'w' => 604800][strtolower($m[2])];
    return (int) $m[1] * $mult;
}

function generate_token(string $userId, string $role): string
{
    $now = time();
    $header = b64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload = b64url_encode(json_encode([
        'id' => $userId,
        'role' => $role,
        'iat' => $now,
        'exp' => $now + expires_in_seconds(env('JWT_EXPIRES_IN', '7d')),
    ]));
    $sig = b64url_encode(hash_hmac('sha256', "$header.$payload", env('JWT_SECRET', ''), true));
    return "$header.$payload.$sig";
}

// Valid ho to payload, warna null
function verify_token(string $token): ?array
{
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    [$h, $p, $s] = $parts;

    $header = json_decode((string) b64url_decode($h), true);
    if (($header['alg'] ?? '') !== 'HS256') return null;

    $expected = b64url_encode(hash_hmac('sha256', "$h.$p", env('JWT_SECRET', ''), true));
    if (!hash_equals($expected, $s)) return null;

    $payload = json_decode((string) b64url_decode($p), true);
    if (!is_array($payload)) return null;
    if (isset($payload['exp']) && time() >= $payload['exp']) return null;
    return $payload;
}

const USER_COLUMNS = 'id, name, email, role, isActive, lastLoginAt, createdAt, updatedAt';

// Token verify karta hai aur current user return karta hai (password kabhi nahi)
function protect(): array
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    $token = str_starts_with($header, 'Bearer ') ? (explode(' ', $header)[1] ?? '') : '';

    if ($token === '') fail(401, 'Not authorized, token missing');

    $decoded = verify_token($token);
    if (!$decoded) fail(401, 'Invalid or expired token');

    $user = is_valid_id($decoded['id'] ?? null)
        ? query('SELECT ' . USER_COLUMNS . ' FROM users WHERE id = ?', [$decoded['id']])->fetch()
        : null;

    if (!$user || !$user['isActive']) fail(401, 'User not found or inactive');

    return $user;
}

// Sirf ADMIN role allow karta hai
function admin_only(array $user): array
{
    if (($user['role'] ?? null) !== 'ADMIN') fail(403, 'Admin access only');
    return $user;
}

function require_admin(): array
{
    return admin_only(protect());
}
