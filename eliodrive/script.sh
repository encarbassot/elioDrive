#!/usr/bin/env bash

# =========================================
# Script para generar manifest.json para ELIODRIVE linux/MacOS
# =========================================
# Ejecutar desde la carpeta 'eliodrive':
#   cd eliodrive
#   chmod +x script.sh
#   ./script.sh
#
# Esto recorrerá todos los archivos de la carpeta padre (../),
# generando un manifest.json
#
# El manifest se puede usar para servir un drive estático
# en nginx, apache o cualquier servidor web.
# =========================================

set -euo pipefail

# Go to project root (parent of eliodrive)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
OUT_FILE="$SCRIPT_DIR/manifest.json"

cd "$ROOT_DIR"

# Simple JSON escaper for strings (handles \, " and newlines)
json_escape() {
  local s="$1"
  s=${s//\\/\\\\}     # backslash
  s=${s//\"/\\\"}     # double quote
  s=${s//$'\n'/\\n}   # newlines -> \n
  printf '%s' "$s"
}

# Detect stat flavor (macOS/BSD vs Linux/GNU)
get_size() {
  if stat -f '%z' "$1" >/dev/null 2>&1; then
    stat -f '%z' "$1"
  else
    stat -c '%s' "$1"
  fi
}

get_mtime() {
  if stat -f '%m' "$1" >/dev/null 2>&1; then
    stat -f '%m' "$1"
  else
    stat -c '%Y' "$1"
  fi
}

echo "Generating manifest at: $OUT_FILE"
echo '{"items":[' > "$OUT_FILE"

first=1

# Find all files under root, excluding eliodrive/, .git/ and index.html
while IFS= read -r -d '' file; do
  relpath="${file#./}"
  [ -z "$relpath" ] && continue

  name="$(basename "$relpath")"
  size=$(get_size "$file")
  mtime=$(get_mtime "$file")

  name_esc=$(json_escape "$name")
  relpath_esc=$(json_escape "$relpath")
  url_esc=$(json_escape "$relpath")  # for now url == relpath

  if [ $first -eq 0 ]; then
    echo "," >> "$OUT_FILE"
  else
    first=0
  fi

  cat >> "$OUT_FILE" <<EOF
{"name":"$name_esc","relpath":"$relpath_esc","url":"$url_esc","size":$size,"mtime":$mtime}
EOF

done < <(
  find . -type f \
    ! -path "./eliodrive/*" \
    ! -path "./.git/*" \
    ! -name "index.html" \
    -print0
)

echo ']}' >> "$OUT_FILE"

echo "Done."
