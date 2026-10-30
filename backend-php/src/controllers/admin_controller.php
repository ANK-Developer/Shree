<?php

function find_admin_user(string $id): ?array
{
    return query('SELECT ' . USER_COLUMNS . ' FROM users WHERE id = ?', [$id])->fetch() ?: null;
}

// GET /api/admins?search=
function get_admins(): void
{
    $sql = 'SELECT ' . USER_COLUMNS . " FROM users WHERE role = 'ADMIN'";
    $params = [];
    $search = str(query_param('search'));

    // MySQL collation (utf8mb4_unicode_ci) ki wajah se LIKE case-insensitive hai
    if ($search !== '') {
        $sql .= ' AND (name LIKE ? OR email LIKE ?)';
        $params = [like($search), like($search)];
    }

    $admins = query("$sql ORDER BY createdAt DESC", $params)->fetchAll();
    json_response(200, ['success' => true, 'admins' => to_api($admins)]);
}

// POST /api/admins
function create_admin(): void
{
    $name = str(input('name'));
    $email = mb_strtolower(str(input('email')));
    $password = (string) (input('password') ?: '');

    if ($name === '' || $email === '' || $password === '') fail(400, 'Name, email and password are required');
    if (mb_strlen($password) < 6) fail(400, 'Password must be at least 6 characters');
    if (query('SELECT id FROM users WHERE email = ?', [$email])->fetch()) fail(409, 'Email already exists');

    $id = uuid4();
    $now = db_datetime(now_utc());
    try {
        query(
            "INSERT INTO users (id, name, email, password, role, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, 'ADMIN', 1, ?, ?)",
            [$id, $name, $email, password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]), $now, $now]
        );
    } catch (PDOException $e) {
        if (is_duplicate_error($e)) fail(409, 'Email already exists');
        throw $e;
    }

    json_response(201, ['success' => true, 'message' => 'Admin created successfully', 'admin' => to_api(find_admin_user($id))]);
}

// PATCH /api/admins/:id/status   body: { isActive }
function update_admin_status(array $user, string $id): void
{
    $isActive = input('isActive');

    if (!is_valid_id($id)) fail(400, 'Invalid admin id');
    if (!is_bool($isActive)) fail(400, 'isActive must be true or false');
    if ($user['id'] === $id && !$isActive) fail(400, 'You cannot deactivate yourself');

    $count = query(
        "UPDATE users SET isActive = ?, updatedAt = ? WHERE id = ? AND role = 'ADMIN'",
        [$isActive ? 1 : 0, db_datetime(now_utc()), $id]
    )->rowCount();
    if ($count === 0) fail(404, 'Admin not found');

    json_response(200, [
        'success' => true,
        'message' => 'Admin ' . ($isActive ? 'activated' : 'deactivated') . ' successfully',
        'admin' => to_api(find_admin_user($id)),
    ]);
}

// PATCH /api/admins/:id/password   body: { newPassword, confirmPassword }
function reset_admin_password(string $id): void
{
    $newPassword = (string) (input('newPassword') ?: '');
    $confirmPassword = (string) (input('confirmPassword') ?: '');

    if (!is_valid_id($id)) fail(400, 'Invalid admin id');
    if ($newPassword === '' || $confirmPassword === '') fail(400, 'New password and confirm password are required');
    if (mb_strlen($newPassword) < 6) fail(400, 'Password must be at least 6 characters');
    if ($newPassword !== $confirmPassword) fail(400, 'Passwords do not match');

    $count = query(
        "UPDATE users SET password = ?, updatedAt = ? WHERE id = ? AND role = 'ADMIN'",
        [password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 10]), db_datetime(now_utc()), $id]
    )->rowCount();
    if ($count === 0) fail(404, 'Admin not found');

    json_response(200, ['success' => true, 'message' => 'Password reset successfully']);
}
