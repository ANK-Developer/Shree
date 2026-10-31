<?php
// Error log file: app ka koi bhi error (fatal, exception, warning, DB, upload) yahin likha jata hai.
// Developer ko "random error" ka reason <logs>/app.log me milega, request id ke saath.

const LOG_MAX_BYTES = 5 * 1024 * 1024; // 5MB se bada ho to app.log -> app.log.1 (purana hata diya jata hai)

function init_logging(string $dir): void
{
    $GLOBALS['__log_dir'] = $dir;
    $GLOBALS['__request_id'] = bin2hex(random_bytes(4));

    if (!is_dir($dir)) @mkdir($dir, 0775, true);
    // Browser ko PHP errors kabhi na dikhao, sirf file me jayein
    ini_set('display_errors', '0');
    ini_set('log_errors', '1');
    ini_set('error_log', "$dir/php_errors.log");
    error_reporting(E_ALL);
    // Stack trace me function arguments (DB password jaisi cheezein) na aayein
    ini_set('zend.exception_ignore_args', '1');

    // Warning/notice (jaise undefined index) bhi log ho, request band na ho
    set_error_handler(function (int $no, string $msg, string $file, int $line): bool {
        if (!(error_reporting() & $no)) return false;
        log_message('WARNING', "PHP[$no] $msg at $file:$line");
        return true;
    });

    set_exception_handler(function (Throwable $e) {
        log_error('Unhandled exception', $e);
        if (!headers_sent()) fail(500, 'Server error (ref: ' . request_id() . ')');
    });

    // Fatal error (parse/memory/timeout) handler tak nahi pahunchte, yahan pakde jate hain
    register_shutdown_function(function () {
        $err = error_get_last();
        if ($err && in_array($err['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR], true)) {
            log_message('FATAL', "{$err['message']} at {$err['file']}:{$err['line']}");
            if (!headers_sent()) {
                http_response_code(500);
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode(['success' => false, 'message' => 'Server error (ref: ' . request_id() . ')']);
            }
        }
    });
}

function request_id(): string
{
    return $GLOBALS['__request_id'] ?? '--------';
}

function log_message(string $level, string $message): void
{
    $dir = $GLOBALS['__log_dir'] ?? null;
    if (!$dir) return;

    $file = "$dir/app.log";
    clearstatcache(true, $file);
    if (is_file($file) && filesize($file) > LOG_MAX_BYTES) @rename($file, "$file.1");

    $line = sprintf(
        "[%s] [%s] [%s] %s %s | ip=%s | %s\n",
        date('Y-m-d H:i:s'),
        $level,
        request_id(),
        $_SERVER['REQUEST_METHOD'] ?? 'CLI',
        $_SERVER['REQUEST_URI'] ?? '-',
        $_SERVER['REMOTE_ADDR'] ?? '-',
        $message
    );
    // Logging khud kabhi app ko na tode (folder permission galat ho tab bhi)
    @file_put_contents($file, $line, FILE_APPEND | LOCK_EX);
}

// $context: kahan fail hua (jaise "createMember"); $e: exception ho to message + file:line + stack trace
function log_error(string $context, ?Throwable $e = null): void
{
    if ($e === null) {
        log_message('ERROR', $context);
        return;
    }
    log_message('ERROR', sprintf(
        "%s: %s (%s) at %s:%d\n%s",
        $context,
        $e->getMessage(),
        get_class($e),
        $e->getFile(),
        $e->getLine(),
        $e->getTraceAsString()
    ));
}
