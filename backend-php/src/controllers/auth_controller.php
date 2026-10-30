<?php

function sanitize_user(array $u): array
{
    return ['id' => $u['id'], 'name' => $u['name'], 'email' => $u['email'], 'role' => $u['role']];
}

// POST /api/auth/login  (admin only)
function login(): void
{
    $email = input('email');
    $password = input('password');

    if (!$email || !$password) fail(400, 'Email and password are required');

    $user = query('SELECT * FROM users WHERE email = ?', [mb_strtolower(str($email))])->fetch();
    $valid = $user && password_verify(is_scalar($password) ? (string) $password : '', $user['password']);

    if (!$valid || $user['role'] !== 'ADMIN' || !$user['isActive']) fail(401, 'Invalid credentials');

    // Admins page par "Last Login" dikhane ke liye
    // Last-login fail ho to bhi login na ruke
    try {
        $now = db_datetime(now_utc());
        query('UPDATE users SET lastLoginAt = ?, updatedAt = ? WHERE id = ?', [$now, $now, $user['id']]);
    } catch (Throwable $e) {
        error_log('lastLoginAt update failed: ' . $e->getMessage());
    }

    json_response(200, [
        'success' => true,
        'token' => generate_token($user['id'], $user['role']),
        'user' => sanitize_user($user),
    ]);
}

// GET /api/auth/me
function get_me(array $user): void
{
    json_response(200, ['success' => true, 'user' => sanitize_user($user)]);
}
