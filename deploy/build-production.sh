#!/usr/bin/env bash
# Production zip banata hai (public_html me extract karne ke liye).
# Run: bash deploy/build-production.sh path/to/shree_database.sql
# Output: Shree_JI-deploy/Shree-JI-production.zip
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SQL="${1:?usage: build-production.sh <database.sql>}"
OUT="$ROOT/Shree_JI-deploy"
STAGE="$(mktemp -d)"

# 1) Frontend: API same domain par ("/api"), local .env ko ignore karke
# MSYS_NO_PATHCONV: Git Bash "/api" ko "C:/Program Files/Git/api" na bana de
(cd "$ROOT/frontend" && MSYS_NO_PATHCONV=1 VITE_API_URL=/api npm run build)
cp -r "$ROOT/frontend/dist/." "$STAGE/"
rm -f "$STAGE/_redirects"

# 2) Backend: public/index.php -> api.php, baaki shree_backend/ me (web se band)
B="$STAGE/shree_backend"
mkdir -p "$B/logs" "$STAGE/uploads/members" "$STAGE/uploads/events"
cp -r "$ROOT/backend-php/src" "$ROOT/backend-php/database" "$ROOT/backend-php/scripts" "$B/"
cp "$ROOT/backend-php/.env.example" "$B/"
printf 'Require all denied\n' > "$B/.htaccess"
printf 'Require all denied\n' > "$B/logs/.htaccess"
sed -e "s#__DIR__ . '/../src'#__DIR__ . '/shree_backend/src'#" \
    -e "s#__DIR__ . '/../logs'#__DIR__ . '/shree_backend/logs'#" \
    -e "s#__DIR__ . '/../.env'#__DIR__ . '/shree_backend/.env'#" \
    "$ROOT/backend-php/public/index.php" > "$STAGE/api.php"
sed -i "s#__DIR__ . '/../public/uploads'#__DIR__ . '/../../uploads'#" "$B/src/upload.php"
grep -q "shree_backend/logs" "$STAGE/api.php" && grep -q "'/../../uploads'" "$B/src/upload.php"

# 3) Root .htaccess, uploads (photos + PHP block), database, guide
cp "$ROOT/deploy/root.htaccess" "$STAGE/.htaccess"
cp "$ROOT/backend-php/public/uploads/.htaccess" "$STAGE/uploads/.htaccess"
cp "$ROOT/backend-php/public/uploads/members/"*.jpg "$STAGE/uploads/members/" 2>/dev/null || true
cp "$ROOT/backend-php/public/uploads/members/"*.png "$STAGE/uploads/members/" 2>/dev/null || true
cp "$ROOT/backend-php/public/uploads/members/"*.webp "$STAGE/uploads/members/" 2>/dev/null || true
cp "$SQL" "$STAGE/shree_database.sql"
cp "$ROOT/deploy/UPLOAD-GUIDE.txt" "$STAGE/UPLOAD-GUIDE.txt"

# 4) Zip (forward-slash paths, Linux cPanel ke liye)
mkdir -p "$OUT"
rm -f "$OUT/Shree-JI-production.zip"
WIN_STAGE="$(cygpath -w "$STAGE")"; WIN_OUT="$(cygpath -w "$OUT/Shree-JI-production.zip")"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$(cygpath -w "$ROOT/deploy/make-zip.ps1")" "$WIN_STAGE" "$WIN_OUT"
rm -rf "$STAGE"
echo "Done: $OUT/Shree-JI-production.zip"
