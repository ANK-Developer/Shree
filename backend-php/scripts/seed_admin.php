<?php
// php scripts/seed_admin.php  -> .env ke ADMIN_EMAIL / ADMIN_PASSWORD se admin banata hai (agar pehle se na ho)
require __DIR__ . '/../src/helpers.php';
load_env(__DIR__ . '/../.env');

try {
    $email = mb_strtolower(env('ADMIN_EMAIL', ''));

    if (query('SELECT id FROM users WHERE email = ?', [$email])->fetch()) {
        echo "Admin already exists: $email\n";
    } else {
        $now = db_datetime(now_utc());
        query(
            "INSERT INTO users (id, name, email, password, role, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, 'ADMIN', 1, ?, ?)",
            [uuid4(), env('ADMIN_NAME', 'Admin'), $email, password_hash(env('ADMIN_PASSWORD', ''), PASSWORD_BCRYPT, ['cost' => 10]), $now, $now]
        );
        echo "Admin created: $email\n";
    }
} catch (Throwable $e) {
    fwrite(STDERR, $e->getMessage() . "\n");
    exit(1);
}
