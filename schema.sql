CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, phone TEXT UNIQUE, full_name TEXT NOT NULL, role TEXT DEFAULT 'explorer', credit_balance INTEGER DEFAULT 50, hardware_pass_id TEXT UNIQUE, kyc_status TEXT DEFAULT 'unverified', device_fingerprint TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS admin_users (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, role TEXT DEFAULT 'operator', permissions TEXT NOT NULL, created_by TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS system_routers (id INTEGER PRIMARY KEY AUTOINCREMENT, router_name TEXT UNIQUE NOT NULL, endpoint_url TEXT NOT NULL, status TEXT DEFAULT 'ONLINE', latency_ms INTEGER DEFAULT 45, load_percent INTEGER DEFAULT 12, last_ping DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS security_violations (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, violation_tier TEXT NOT NULL, detection_type TEXT NOT NULL, ip_address TEXT, device_info TEXT, evidence_payload TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS hardware_passes (card_uid TEXT PRIMARY KEY, card_token_hash TEXT UNIQUE NOT NULL, bank_type TEXT NOT NULL, initial_fiat_balance INTEGER DEFAULT 0, claim_status INTEGER DEFAULT 0, assigned_user_id TEXT UNIQUE, claimed_at DATETIME);
CREATE TABLE IF NOT EXISTS spatial_bounties (id TEXT PRIMARY KEY, contributor_id TEXT NOT NULL, poi_name TEXT NOT NULL, category TEXT NOT NULL, latitude REAL NOT NULL, longitude REAL NOT NULL, altitude REAL, image_r2_url TEXT NOT NULL, perceptual_hash TEXT NOT NULL, imu_accelerometer_var REAL NOT NULL, reward_amount INTEGER NOT NULL, payout_status TEXT DEFAULT 'pending_48h', ai_audit_score REAL, rejection_code TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, cleared_at DATETIME);
CREATE TABLE IF NOT EXISTS credits_ledger (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, amount INTEGER NOT NULL, transaction_type TEXT NOT NULL, reference_id TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);

-- Inisialisasi 9 Router Telemetry
INSERT OR IGNORE INTO system_routers (id, router_name, endpoint_url, status, latency_ms, load_percent) VALUES
(1, 'Router-01 (Gateway Edge Global)', 'https://edge1.xawd.my.id', 'ONLINE', 18, 24),
(2, 'Router-02 (Frontier LLM Arbiter)', 'https://engine.xawd.my.id', 'ONLINE', 65, 42),
(3, 'Router-03 (SpatialGrid Ingestion)', 'https://spatial.xawd.my.id', 'ONLINE', 32, 19),
(4, 'Router-04 (DePIN Wi-Fi Cluster)', 'https://wifi-beacon.xawd.my.id', 'ONLINE', 28, 15),
(5, 'Router-05 (Multimodal Vision QA)', 'https://vision.xawd.my.id', 'ONLINE', 85, 38),
(6, 'Router-06 (Fraud & IMU Attestation)', 'https://defense.xawd.my.id', 'ONLINE', 22, 11),
(7, 'Router-07 (Veo Video Synthesis)', 'https://video.xawd.my.id', 'ONLINE', 120, 56),
(8, 'Router-08 (Database D1 Hyperdrive)', 'https://d1-mesh.xawd.my.id', 'ONLINE', 14, 29),
(9, 'Router-09 (Web3 Settlement Engine)', 'https://settle.xawd.my.id', 'ONLINE', 48, 18);
