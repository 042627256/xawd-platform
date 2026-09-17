#!/bin/bash
BASE="https://9rxawd.up.railway.app/v1"
KEY="comku"

echo "=========================================="
echo "🔍 1. MENGAMBIL DAFTAR LENGKAP MODEL"
echo "=========================================="
curl -s -H "Authorization: Bearer $KEY" "$BASE/models" | grep -o '"id":"[^"]*"' | cut -d'"' -f4 > all_models.txt
TOTAL=$(wc -l < all_models.txt)
echo "Total model ditemukan: $TOTAL"
echo ""

echo "=========================================="
echo "⚡ 2. MENGUJI MODEL PRIORITAS & ROUTER"
echo "=========================================="

test_one() {
  local model="$1"
  printf "Menguji [%-28s] ... " "$model"
  local res
  res=$(curl -s --max-time 10 -X POST "$BASE/chat/completions" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $KEY" \
    -d "{\"model\":\"$model\",\"messages\":[{\"role\":\"user\",\"content\":\"ping\"}],\"max_tokens\":10}")

  if echo "$res" | grep -q '"content"'; then
    local snippet
    snippet=$(echo "$res" | grep -o '"content":"[^"]*"' | head -n 1 | cut -d'"' -f4 | tr -d '\n')
    echo -e "✅ AKTIF -> \"${snippet:0:25}...\""
    echo "$model" >> working_models.txt
  else
    local err
    err=$(echo "$res" | grep -o '"message":"[^"]*"' | head -n 1 | cut -d'"' -f4)
    [ -z "$err" ] && err="Timeout / Gagal"
    echo -e "❌ GAGAL -> ${err:0:30}"
  fi
}

> working_models.txt

# Daftar model yang akan diuji (Router, GLM, Claude, GPT non-Gemini)
MODELS=(
  "Comku"
  "All"
  "ag/claude-sonnet-4-6"
  "ag/claude-opus-4-6-thinking"
  "cx/gpt-6-astra"
  "cx/gpt-5.6-sol"
  "cx/gpt-5.6-terra"
  "cx/gpt-5.6-luna"
  "cx/gpt-5.5"
  "cx/gpt-5.4"
  "ag/gpt-oss-120b-medium"
  "glm-4"
  "glm-4-plus"
  "glm-4-air"
  "glm-4-flash"
  "THUDM/glm-4-9b-chat"
)

for m in "${MODELS[@]}"; do
  test_one "$m"
  sleep 0.3
done

echo ""
echo "=========================================="
echo "✅ HASIL MODEL AKTIF YANG BISA DIPAKAI:"
echo "=========================================="
cat working_models.txt
echo "=========================================="
