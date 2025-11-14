#!/usr/bin/env bash
# =========================================
# Script para generar manifest.json para ELIODRIVE
# =========================================
# Ejecutar desde la carpeta 'eliodrive':
#   cd eliodrive
#   ./script.sh
#
# Esto recorrerá todos los archivos de la carpeta padre (../),
# generando un manifest.json que lista cada archivo con:
# - nombre
# - ruta relativa
# - url
# - tamaño en bytes
# - fecha de modificación
#
# El manifest se puede usar para servir un drive estático
# en nginx, apache o cualquier servidor web.
# =========================================

echo "Generando manifest.json para los archivos en ../ …"

out="manifest.json"
echo '{"items":[' > "$out"

first=true
count=0

while IFS= read -r -d '' f; do
  name=$(basename "$f")
  relpath="${f#../}"      # ruta relativa desde ../
  url="$relpath"
  size=$(stat -c%s "$f")
  mtime=$(stat -c%Y "$f")

  # imprimir los primeros 25 archivos
  if [ $count -lt 25 ]; then
    echo "  $relpath"
    count=$((count+1))
  elif [ $count -eq 25 ]; then
    echo "  ... (más archivos omitidos)"
    count=$((count+1))
  fi

  if [ "$first" = true ]; then
    first=false
  else
    echo "," >> "$out"
  fi

  printf '{"name":"%s","relpath":"%s","url":"%s","size":%s,"mtime":%s}' \
    "$name" "$relpath" "$url" "$size" "$mtime" >> "$out"
done < <(
  find ../ -type f \
    ! -path '../eliodrive/src/*' \
    ! -path '../eliodrive/tmp/*' \
    ! -name 'index.html' \
    ! -name 'manifest.json' \
    -print0 | sort -z
)

echo ']}' >> "$out"

echo "✔ manifest.json generado con éxito"
