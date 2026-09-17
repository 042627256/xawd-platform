import urllib.request
import json
import time

BASE_URL = "https://9rxawd.up.railway.app/v1"
API_KEY = "comku"

def test_model(model_name):
    url = f"{BASE_URL}/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}",
        "User-Agent": "Mozilla/5.0"
    }
    payload = {
        "model": model_name,
        "messages": [{"role": "user", "content": "ping"}],
        "max_tokens": 15
    }
    
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers)
    start = time.time()
    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            duration = round(time.time() - start, 2)
            data = json.loads(response.read().decode("utf-8"))
            reply = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip().replace("\n", " ")
            return True, f"AKTIF ({duration}s) -> Respon: '{reply[:30]}...'"
    except Exception as e:
        err_msg = str(e)
        if hasattr(e, 'read'):
            try:
                err_data = json.loads(e.read().decode("utf-8"))
                err_msg = err_data.get("error", {}).get("message", err_msg)
            except:
                pass
        return False, f"GAGAL -> {err_msg[:60]}"

print("=" * 60)
print("🔍 1. MENGAMBIL DAFTAR LENGKAP MODEL DARI 9ROUTER")
print("=" * 60)

all_models = []
try:
    req = urllib.request.Request(f"{BASE_URL}/models", headers={"Authorization": f"Bearer {API_KEY}", "User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=10) as response:
        models_data = json.loads(response.read().decode("utf-8"))
        all_models = [m["id"] for m in models_data.get("data", [])]
        print(f"Total model ditemukan di akun: {len(all_models)} model\n")
except Exception as e:
    print(f"Gagal mengambil daftar model: {e}\n")

# Model prioritas untuk dites: Comku, All, varian GLM, Claude, GPT, dan lainnya
priority_models = [
    "Comku",
    "All",
    "glm-4",
    "glm-4-plus",
    "glm-4-air",
    "glm-4-flash",
    "THUDM/glm-4-9b-chat",
    "ag/claude-sonnet-4-6",
    "ag/claude-opus-4-6-thinking",
    "cx/gpt-6-astra",
    "cx/gpt-5.6-sol",
    "cx/gpt-5.6-terra",
    "cx/gpt-5.6-luna",
    "cx/gpt-5.5",
    "cx/gpt-5.4",
    "ag/gpt-oss-120b-medium"
]

# Tambahkan model lain dari katalog yang bukan Gemini
for m in all_models:
    if "gemini" not in m.lower() and m not in priority_models:
        priority_models.append(m)

print("=" * 60)
print("⚡ 2. MEMULAI PENGUJIAN MODEL (NON-GEMINI & ROUTER)")
print("=" * 60)

working_models = []

for m in priority_models[:20]:  # Tes 20 model teratas
    print(f"Menguji [{m}] ... ", end="", flush=True)
    ok, result = test_model(m)
    print(result)
    if ok:
        working_models.append(m)
    time.sleep(0.5)

print("\n" + "=" * 60)
print("✅ MODEL YANG SUKSES AKTIF & BISA DIGUNAKAN:")
print("=" * 60)
for wm in working_models:
    print(f"  • {wm}")
print("=" * 60)
