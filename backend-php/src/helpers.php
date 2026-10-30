<?php
// Poore app ke common helpers: env, DB, request body, JSON response, dates, ids.

// ---------- .env ----------
function load_env(string $file): void
{
    if (!is_file($file)) return;
    foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#' || !str_contains($line, '=')) continue;
        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        if (strlen($value) >= 2 && ($value[0] === '"' || $value[0] === "'") && $value[-1] === $value[0]) {
            $value = substr($value, 1, -1);
        }
        if (getenv($key) === false) putenv("$key=$value");
        $_ENV[$key] = getenv($key);
    }
}

function env(string $key, ?string $default = null): ?string
{
    $v = getenv($key);
    return $v === false || $v === '' ? $default : $v;
}

// ---------- DB ----------
// DATABASE_URL Prisma wala hi format: mysql://user:pass@host:port/dbname
function db(): PDO
{
    static $pdo = null;
    if ($pdo) return $pdo;

    $url = parse_url(env('DATABASE_URL', ''));
    if (!$url || empty($url['host'])) throw new RuntimeException('DATABASE_URL is missing or invalid');

    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
        $url['host'],
        $url['port'] ?? 3306,
        ltrim($url['path'] ?? '', '/')
    );
    $pdo = new PDO($dsn, urldecode($url['user'] ?? ''), urldecode($url['pass'] ?? ''), [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::ATTR_STRINGIFY_FETCHES => false,
        // updateMany jaisa: "kitni rows match hui" (changed nahi), warna same value set karne par 404 aa jata
        PDO::MYSQL_ATTR_FOUND_ROWS => true,
    ]);
    // Prisma ki tarah sab DATETIME UTC me store/read hote hain
    $pdo->exec("SET time_zone = '+00:00'");
    return $pdo;
}

function query(string $sql, array $params = []): PDOStatement
{
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    return $stmt;
}

function is_duplicate_error(Throwable $e): bool
{
    return $e instanceof PDOException && ($e->errorInfo[1] ?? null) === 1062;
}

// Prisma "contains" jaisa LIKE pattern (Prisma MySQL par % / _ escape nahi karta, isliye yahan bhi nahi)
function like(string $s): string
{
    return "%$s%";
}

// ---------- Response ----------
function json_response(int $status, array $data): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(int $status, string $message): never
{
    json_response($status, ['success' => false, 'message' => $message]);
}

// ---------- Request ----------
// Express ke req.body jaisa: JSON, urlencoded ya multipart (PUT multipart PHP khud parse nahi karta)
function body(): array
{
    static $body = null;
    if ($body !== null) return $body;

    $type = $_SERVER['CONTENT_TYPE'] ?? '';
    $method = $_SERVER['REQUEST_METHOD'];

    if (stripos($type, 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        $decoded = $raw === '' ? [] : json_decode($raw, true);
        if (!is_array($decoded)) fail(400, 'Invalid JSON body');
        $body = $decoded;
    } elseif ($method === 'POST') {
        $body = $_POST;
    } elseif (stripos($type, 'multipart/form-data') !== false) {
        $body = parse_multipart_input($type);
    } elseif (stripos($type, 'application/x-www-form-urlencoded') !== false) {
        parse_str(file_get_contents('php://input'), $body);
    } else {
        $body = [];
    }
    return $body;
}

function input(string $key): mixed
{
    return body()[$key] ?? null;
}

function query_param(string $key): string
{
    $v = $_GET[$key] ?? '';
    return is_string($v) ? $v : '';
}

// Uploaded file: POST me $_FILES, PUT me parse_multipart_input() wala
function uploaded_file(string $field): ?array
{
    body();
    $file = $GLOBALS['__parsed_files'][$field] ?? $_FILES[$field] ?? null;
    if (!$file || ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) return null;
    return $file;
}

function parse_multipart_input(string $contentType): array
{
    $fields = [];
    $GLOBALS['__parsed_files'] = [];
    if (!preg_match('/boundary=(?:"([^"]+)"|([^;]+))/i', $contentType, $m)) return $fields;
    $boundary = $m[1] !== '' ? $m[1] : $m[2];

    $raw = file_get_contents('php://input');
    $parts = explode("--$boundary", $raw);
    array_pop($parts); // aakhri "--" wala hissa
    array_shift($parts); // pehle boundary se pehle ka

    foreach ($parts as $part) {
        $part = ltrim($part, "\r\n");
        $split = strpos($part, "\r\n\r\n");
        if ($split === false) continue;
        $headers = substr($part, 0, $split);
        $content = substr($part, $split + 4, -2); // last "\r\n" boundary ka hai

        if (!preg_match('/name="([^"]*)"/i', $headers, $nm)) continue;
        $name = $nm[1];

        if (preg_match('/filename="([^"]*)"/i', $headers, $fn)) {
            if ($fn[1] === '' && $content === '') continue;
            preg_match('/Content-Type:\s*([^\r\n]+)/i', $headers, $ct);
            $tmp = tempnam(sys_get_temp_dir(), 'upl');
            file_put_contents($tmp, $content);
            register_shutdown_function(fn() => is_file($tmp) && @unlink($tmp));
            $GLOBALS['__parsed_files'][$name] = [
                'name' => $fn[1],
                'type' => trim($ct[1] ?? 'application/octet-stream'),
                'tmp_name' => $tmp,
                'error' => UPLOAD_ERR_OK,
                'size' => strlen($content),
                'parsed' => true,
            ];
        } else {
            $fields[$name] = $content;
        }
    }
    return $fields;
}

// ---------- Strings / ids ----------
// JS String(v).trim() jaisa
function str(mixed $v): string
{
    if ($v === null) return '';
    if (is_bool($v)) return $v ? 'true' : 'false';
    if (!is_scalar($v)) return '[object Object]';
    return preg_replace('/^\s+|\s+$/u', '', (string) $v) ?? trim((string) $v);
}

function uuid4(): string
{
    $b = random_bytes(16);
    $b[6] = chr((ord($b[6]) & 0x0f) | 0x40);
    $b[8] = chr((ord($b[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($b), 4));
}

function is_valid_id(mixed $id): bool
{
    return is_string($id) && preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iD', $id) === 1;
}

// JS parseInt(x, 10) || fallback
function int_param(string $v, int $fallback): int
{
    return preg_match('/^\s*([+-]?\d+)/', $v, $m) && (int) $m[1] !== 0 ? (int) $m[1] : $fallback;
}

function page_params(int $defaultLimit = 10): array
{
    return [
        max(int_param(query_param('page'), 1), 1),
        min(max(int_param(query_param('limit'), $defaultLimit), 1), 500),
    ];
}

function paginate(int $page, int $limit, int $total): array
{
    return ['page' => $page, 'limit' => $limit, 'total' => $total, 'totalPages' => max((int) ceil($total / $limit), 1)];
}

// ---------- Dates ----------
// JS new Date(value) jaisa: "YYYY-MM-DD" UTC midnight, baaki ISO strings apne offset ke saath. Invalid => null
function parse_js_date(mixed $value): ?DateTimeImmutable
{
    if ($value instanceof DateTimeImmutable) return $value;
    $utc = new DateTimeZone('UTC');
    try {
        if (is_int($value) || is_float($value)) {
            return (new DateTimeImmutable('@' . sprintf('%.3F', $value / 1000)))->setTimezone($utc);
        }
        $s = str($value);
        if ($s === '') return null;
        if (preg_match('/^\d{4}(-\d{2}(-\d{2})?)?$/D', $s)) {
            $d = DateTimeImmutable::createFromFormat('!Y-m-d', strlen($s) === 4 ? "$s-01-01" : (strlen($s) === 7 ? "$s-01" : $s), $utc);
            $errors = DateTimeImmutable::getLastErrors();
            if (!$d || ($errors && ($errors['warning_count'] || $errors['error_count']))) return null;
            return $d;
        }
        return (new DateTimeImmutable($s))->setTimezone($utc);
    } catch (Throwable) {
        return null;
    }
}

function now_utc(): DateTimeImmutable
{
    return new DateTimeImmutable('now', new DateTimeZone('UTC'));
}

function db_datetime(DateTimeImmutable $d): string
{
    return $d->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s.v');
}

function db_date(DateTimeImmutable $d): string
{
    return $d->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d');
}

// DB value -> JSON me Prisma jaisi ISO string ("2026-10-29T10:00:00.000Z")
function iso(?string $v): ?string
{
    if ($v === null) return null;
    $d = new DateTimeImmutable(strlen($v) === 10 ? "$v 00:00:00" : $v, new DateTimeZone('UTC'));
    return $d->format('Y-m-d\TH:i:s.v\Z');
}

// ---------- Rows -> API ----------
const DATE_COLUMNS = [
    'createdAt', 'updatedAt', 'lastLoginAt', 'startDateTime', 'endDateTime',
    'lastCalledAt', 'registeredAt', 'calledAt', 'birthDate', 'anniversaryDate', 'dob',
];

// DB row ko frontend wale shape me: dates ISO, isActive boolean, aur "id" -> "_id" (Mongo ke time se)
function to_api(?array $row): ?array
{
    if ($row === null) return null;
    if (array_is_list($row)) return array_map('to_api', $row);

    $out = [];
    foreach ($row as $key => $v) {
        if (in_array($key, DATE_COLUMNS, true) && is_string($v)) $v = iso($v);
        elseif ($key === 'isActive') $v = (bool) $v;
        elseif (is_array($v)) $v = to_api($v);
        $out[$key === 'id' ? '_id' : $key] = $v;
    }
    return $out;
}
