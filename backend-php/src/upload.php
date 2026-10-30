<?php
// Image upload (multer wale middleware ki jagah)

const UPLOAD_ROOT = __DIR__ . '/../public/uploads';
const MAX_UPLOAD_SIZE = 2 * 1024 * 1024; // 2MB

// Extension original filename se nahi, mimetype se decide hota hai (user ka naam trust nahi karte)
const ALLOWED_IMAGES = [
    'image/jpeg' => '.jpg',
    'image/png' => '.png',
    'image/webp' => '.webp',
];

// Public URL path jo DB me save hota hai
const PHOTO_URL_PREFIX = '/uploads/members';
const BANNER_URL_PREFIX = '/uploads/events';

// File aayi ho to save karke public URL path return karta hai, nahi aayi to null. Galat file par 400.
function handle_image_upload(string $folder, string $field, string $label): ?string
{
    $file = uploaded_file($field);
    if (!$file) return null;

    if (in_array($file['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true) || $file['size'] > MAX_UPLOAD_SIZE) {
        fail(400, "$label must be 2MB or smaller");
    }
    if ($file['error'] !== UPLOAD_ERR_OK) fail(400, 'File upload failed');

    $mime = $file['type'];
    if (function_exists('finfo_open')) {
        $detected = finfo_file(finfo_open(FILEINFO_MIME_TYPE), $file['tmp_name']);
        if ($detected) $mime = $detected;
    }
    if (!isset(ALLOWED_IMAGES[$mime])) fail(400, 'Only JPG, PNG or WEBP images are allowed');

    $dir = UPLOAD_ROOT . "/$folder";
    if (!is_dir($dir)) mkdir($dir, 0775, true);

    $filename = uuid4() . ALLOWED_IMAGES[$mime];
    $target = "$dir/$filename";
    $ok = !empty($file['parsed']) ? rename($file['tmp_name'], $target) : move_uploaded_file($file['tmp_name'], $target);
    if (!$ok) throw new RuntimeException('Could not save uploaded file');

    return "/uploads/$folder/$filename";
}

// DB me saved URL path (jaise "/uploads/events/x.jpg") se disk ki file hata deta hai. Sirf uploads folder ke andar ki.
function remove_uploaded_file(?string $urlPath): void
{
    if (!$urlPath || !str_starts_with($urlPath, '/uploads/')) return;
    $root = realpath(UPLOAD_ROOT);
    $path = realpath(UPLOAD_ROOT . '/' . substr($urlPath, strlen('/uploads/')));
    if ($root && $path && str_starts_with($path, $root . DIRECTORY_SEPARATOR) && is_file($path)) @unlink($path);
}
