# Mwasalaty — Deployment Guide (AWS EC2 t3.small + OTP + CI/CD)

A step-by-step, copy-paste guide to deploy the whole stack on **one** AWS EC2
`t3.small` instance, with HTTPS and automatic deploys on every push to `main`.

This file documents the **manual steps you do by hand**. After Part 10, deploys
become automatic (GitHub Actions). Read top to bottom the first time.

---

## 0. What we are building

One small server runs everything. No load balancer, no RDS, no S3 — the only
AWS resource that costs money is the instance itself.

```
                          mwasalaty.duckdns.org  (HTTPS, free DuckDNS + Let's Encrypt)
                                     │
                                     ▼
        ┌──────────────────────  EC2 t3.small (2 GB RAM, Ubuntu 24.04) ─────────────────┐
        │                                                                                │
        │   Nginx (ports 80/443)                                                         │
        │     ├── /            → serves frontend/dist   (the Vue PWA, static files)      │
        │     └── /api/        → proxy to 127.0.0.1:3000 (Node backend, via PM2)         │
        │                                                                                │
        │   Node backend  ──(localhost:8081)──►  OTP container (Docker, -Xmx1G)          │
        │                                                                                │
        └────────────────────────────────────────────────────────────────────────────────┘
                 │                          │                       │
                 ▼                          ▼                       ▼
            Supabase (DB/auth)         PayMob (payments)        Groq (AI)     ← all external, $0 on AWS
```

**Memory budget on the 2 GB box** (this is why `-Xmx1G`, not `4G`):

| Process            | RAM        |
|--------------------|------------|
| Ubuntu OS          | ~200 MB    |
| Docker daemon      | ~100 MB    |
| OTP container      | ~700–900 MB (capped at 1 GB heap) |
| Node backend       | ~120 MB    |
| Nginx              | ~20 MB     |
| **Idle total**     | **~1.3 GB** (fits in 2 GB, with a 2 GB swap file as a safety net for build spikes) |

---

## 1. Before you start — checklist

- [ ] An AWS account (yours is the new **credit-based** plan — t3.small runs off your credits).
- [ ] Your DuckDNS domain: **`mwasalaty.duckdns.org`** and your DuckDNS **token**
      (from <https://www.duckdns.org> after signing in).
- [ ] The `graph.obj` and data already on your PC at
      `C:\ITI\GP\otp-cairo\data\cairo\` (you have these).
- [ ] Your real secret values ready to paste: PayMob keys, Supabase URL/keys, Groq key.
- [ ] Windows OpenSSH client (built into Windows 10/11 — `ssh` and `scp` work in PowerShell).

> ⚠️ **About the IP `41.34.213.243`:** that is your **home/ISP** address (TE Data, Egypt),
> not an AWS address. In Part 2 you will repoint DuckDNS to the **Elastic IP** you get
> from AWS in Part 1. Don't deploy to your home IP.

---

## 2. Part 1 — Launch the EC2 instance (AWS Console)

1. Sign in to AWS → top search bar → **EC2** → **Instances** → **Launch instances**.
2. **Name:** `mwasalaty`.
3. **Application and OS Images (AMI):** choose **Ubuntu Server 24.04 LTS** (64-bit x86).
4. **Instance type:** **`t3.small`** (2 vCPU, 2 GB RAM).
5. **Key pair (login):** **Create new key pair**
   - Name: `mwasalaty-key`
   - Type: **RSA**, Format: **.pem**
   - Click **Create** → the browser downloads `mwasalaty-key.pem`. **Save it somewhere safe**
     (e.g. `C:\ITI\GP\mwasalaty-key.pem`). You'll use it for SSH and CI. You cannot re-download it.
6. **Network settings → Edit → Firewall (security group) → Create**. Add three inbound rules:

   | Type  | Port | Source                |
   |-------|------|-----------------------|
   | SSH   | 22   | **My IP**             |
   | HTTP  | 80   | **Anywhere 0.0.0.0/0**|
   | HTTPS | 443  | **Anywhere 0.0.0.0/0**|

   > Do **not** open port 8081 (OTP) or 3000 (Node). They stay private on the box.
7. **Configure storage:** **20 GiB**, **gp3** (within the 30 GB free allowance; OTP image + graph need room).
8. Click **Launch instance**, then **View all instances**. Wait until **Instance state = Running**
   and **Status check = 2/2 passed** (~1–2 min).

### Give it a fixed IP (Elastic IP)

9. Left menu → **Network & Security → Elastic IPs** → **Allocate Elastic IP address** → **Allocate**.
10. Select the new IP → **Actions → Associate Elastic IP address** → choose your `mwasalaty` instance → **Associate**.
11. **Copy this Elastic IP** — call it `ELASTIC_IP` from now on. (An Elastic IP attached to a
    running instance is free within your plan; keep it associated so it never changes.)

---

## 3. Part 2 — Point DuckDNS at your server

1. Go to <https://www.duckdns.org> and sign in.
2. Find the **`mwasalaty`** domain in your list.
3. In its **current ip** box, type your **`ELASTIC_IP`** from Part 1.
4. Click **update ip**.
5. Verify from your PC (PowerShell), it should return `ELASTIC_IP`:

   ```powershell
   nslookup mwasalaty.duckdns.org
   ```

DNS may take a minute. Don't continue to HTTPS (Part 9) until this resolves to the Elastic IP.

---

## 4. Part 3 — Connect via SSH

From **PowerShell** on your PC:

```powershell
# One-time: lock down the key file so SSH will accept it on Windows
icacls C:\ITI\GP\mwasalaty-key.pem /inheritance:r
icacls C:\ITI\GP\mwasalaty-key.pem /grant:r "$($env:USERNAME):(R)"

# Connect (user is 'ubuntu' for the Ubuntu AMI)
ssh -i C:\ITI\GP\mwasalaty-key.pem ubuntu@ELASTIC_IP
```

Type `yes` when asked about the host fingerprint. You're now on the server — the rest of the
commands (until Part 9 finishes) run **on the server** unless it says "on your PC".

---

## 5. Part 4 — Install everything + add swap (on the server)

```bash
# Update the OS
sudo apt-get update && sudo apt-get upgrade -y

# Nginx + git + certbot (for HTTPS)
sudo apt-get install -y nginx git certbot python3-certbot-nginx

# Node 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# pnpm (for frontend/operator) + PM2 (keeps the backend alive)
sudo npm install -g pnpm pm2

# Docker (for OTP)
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER     # lets you run docker without sudo
newgrp docker                     # apply the new group now (or log out/in)

# 2 GB swap — lets the 2 GB box survive build/memory spikes
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

Verify:

```bash
node -v        # v20.x
docker --version
free -h        # should show 2.0Gi mem + 2.0Gi swap
```

### Allow CI to reload Nginx without a password

The CI/CD pipeline (Part 10) reloads Nginx. Allow that one command passwordless:

```bash
echo "ubuntu ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx" | sudo tee /etc/sudoers.d/mwasalaty
```

---

## 6. Part 5 — Get the code and set secrets (on the server)

```bash
# Create the web root, owned by you
sudo mkdir -p /var/www && sudo chown $USER:$USER /var/www
cd /var/www

# Clone (deploy branch is main)
git clone https://github.com/shahddsameh/mwasalaty.git
cd mwasalaty
git checkout main
```

Now create the two `.env` files (they are **gitignored**, so they never arrive via git — you set them once here).

### Backend secrets

```bash
nano backend/.env
```

Paste your real values. Change these **three** lines for production; keep all your other keys
(PayMob, Supabase, Groq, etc.) the same as your local `backend/.env`:

```env
PORT=3000
CLIENT_URL=https://mwasalaty.duckdns.org
BACKEND_URL=https://mwasalaty.duckdns.org
OTP_GRAPHQL_URL=http://localhost:8081/otp/routers/default/index/graphql
GTFS_PATH=/var/www/mwasalaty/otp-cairo/data/cairo/cairo-gtfs.zip

# --- keep your existing real values below ---
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_JWT_SECRET=...
DATABASE_URL=...
PAYMOB_SECRET_KEY=...
PAYMOB_PUBLIC_KEY=...
PAYMOB_INTEGRATION_ID=...
PAYMOB_HMAC_SECRET=...
PAYMOB_API_KEY=...
GROQ_API_KEY=...
GROQ_MODEL=openai/gpt-oss-20b
GROQ_TIMEOUT_MS=8000
```

Save in nano: **Ctrl+O**, **Enter**, then **Ctrl+X**.

### Frontend secrets (needed at build time — Vite bakes them in)

```bash
nano frontend/.env
```

```env
VITE_SUPABASE_URL=...      # same project as the backend
VITE_SUPABASE_ANON_KEY=...
```

> The frontend calls the API as a relative `/api/...` path, so it needs **no** API base URL —
> Nginx serves the app and the API on the same origin.

---

## 7. Part 6 — Ship and run OTP (Docker)

The graph is **pre-built on your PC**, so the server only loads and serves it (no heavy build).

### Step A — copy the OTP folder to the server (run on **your PC**, in PowerShell)

```powershell
scp -i C:\ITI\GP\mwasalaty-key.pem -r C:\ITI\GP\otp-cairo ubuntu@ELASTIC_IP:/var/www/mwasalaty/
```

This uploads `graph.obj`, the OSM/GTFS data, and config (~65 MB). Takes a minute or two.

### Step B — use the production OTP compose (on the **server**)

The committed `otp-cairo/docker-compose.yml` is tuned for a big dev machine (`-Xmx4G`, public
port). Replace it with this 2 GB-safe, localhost-only version:

```bash
nano /var/www/mwasalaty/otp-cairo/docker-compose.yml
```

Replace the whole file with:

```yaml
services:
  otp:
    image: docker.io/opentripplanner/opentripplanner:2.6.0
    container_name: otp-cairo
    ports:
      - "127.0.0.1:8081:8080"      # localhost only — never exposed to the internet
    volumes:
      - ./data/cairo:/var/opentripplanner
    command: ["--load", "--serve"]  # load the pre-built graph.obj, then serve
    environment:
      JAVA_TOOL_OPTIONS: "-Xmx1G"   # capped for the 2 GB box (was 4G)
    restart: unless-stopped          # auto-starts on reboot
```

### Step C — start OTP

```bash
cd /var/www/mwasalaty/otp-cairo
docker compose up -d

# Watch it load the graph (look for "Grizzly server running")
docker compose logs -f
# Ctrl+C to stop watching (the container keeps running)

# Smoke test — should return JSON, not a connection error:
curl -s http://localhost:8081/otp/routers/default | head -c 200
```

If it crashes with an out-of-memory error, drop the heap to `-Xmx768m` and `docker compose up -d` again.

---

## 8. Part 7 — Build the frontends and start the backend (on the server)

```bash
cd /var/www/mwasalaty

# Backend dependencies
cd backend && npm ci && cd ..

# Build the PWA + operator (cap Node memory so it shares the box with OTP)
export NODE_OPTIONS=--max-old-space-size=768
pnpm install
pnpm -r build         # outputs frontend/dist and operator/dist

# Start the backend under PM2 (run from backend/ so it finds backend/.env)
cd backend
pm2 start server.js --name mwasalaty-api
cd ..

# Make PM2 survive reboots
pm2 save
pm2 startup systemd
#   ^ this prints a 'sudo env PATH=... pm2 startup ...' line — copy/paste & run it once.
```

Check it's up:

```bash
pm2 status
curl -s http://localhost:3000/api/places/search?q=tahrir | head -c 200   # should return JSON
```

---

## 9. Part 8 — Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/mwasalaty
```

Paste:

```nginx
server {
    listen 80;
    server_name mwasalaty.duckdns.org;

    root /var/www/mwasalaty/frontend/dist;   # the built PWA
    index index.html;

    # API → Node backend (keeps the /api prefix the routes expect)
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SPA fallback for Vue Router
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable it and reload:

```bash
sudo ln -s /etc/nginx/sites-available/mwasalaty /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t                # must say "syntax is ok" / "test is successful"
sudo systemctl reload nginx
```

Now visit **`http://mwasalaty.duckdns.org`** in a browser — the app should load (over plain HTTP for now).

---

## 10. Part 9 — Turn on HTTPS (required for the PWA + camera)

Your app is a **PWA** (service worker) and the operator uses the **camera** — both need HTTPS.
Make sure `mwasalaty.duckdns.org` already resolves to your Elastic IP (Part 2), then:

```bash
sudo certbot --nginx -d mwasalaty.duckdns.org
```

- Enter your email, accept the terms.
- When asked, choose to **redirect HTTP to HTTPS**.

Certbot edits Nginx to add port 443, installs a free 90-day certificate, and sets up
**auto-renewal** (a systemd timer). Verify renewal works:

```bash
sudo certbot renew --dry-run
```

Visit **`https://mwasalaty.duckdns.org`** — you should see the padlock, the PWA install prompt,
and the operator camera should work.

> **Update PayMob/Supabase dashboards** to use the HTTPS URL where relevant
> (PayMob webhook/return URLs → `https://mwasalaty.duckdns.org/...`, Supabase Auth redirect URLs).

---

## 11. Part 10 — CI/CD: auto-deploy on every push to `main`

A workflow file is already in the repo at **`.github/workflows/deploy.yml`**. It SSHes into the
server, pulls `main`, rebuilds, and restarts — on every push to `main`. You only need to add the
three secrets it reads.

### Add the GitHub secrets (on your PC, in a browser)

GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**. Add:

| Name          | Value                                                            |
|---------------|------------------------------------------------------------------|
| `EC2_HOST`    | your `ELASTIC_IP` (or `mwasalaty.duckdns.org`)                    |
| `EC2_USER`    | `ubuntu`                                                         |
| `EC2_SSH_KEY` | the **entire contents** of `mwasalaty-key.pem` (open it in a text editor, copy everything including the BEGIN/END lines) |

### Use it

- Merge your work into `main` and push.
- Watch progress in the repo's **Actions** tab. First run takes a few minutes (build on a small box).
- Your `.env` files and the `otp-cairo/` folder are gitignored, so CI never touches them — secrets and the graph stay safe on the server.
- You can also trigger it manually from the **Actions** tab (**Run workflow**) thanks to `workflow_dispatch`.

> CI does **not** restart OTP — it rarely changes. If you update the graph, see "Day-2" below.

---

## 12. Part 11 — Stop surprise bills (do this once)

1. AWS console → **Billing and Cost Management → Budgets → Create budget**.
2. Template: **Zero spend budget** (or a $5 monthly budget) → add your email → Create.
3. Also check **Billing → Free Tier / Credits** to watch your remaining credit balance.

On the credit-based Free Plan, if credits run out or the 6-month window ends, AWS **pauses the
account** rather than charging you. To keep the demo alive past then, add a card (upgrade to the
Paid Plan) — t3.small all-in is ~$21/month after that.

**To pause costs while not demoing:** EC2 → select instance → **Instance state → Stop** (not
Terminate). Your disk, Elastic IP, and setup are preserved; **Start** it again later.

---

## 13. Verification checklist

- [ ] `https://mwasalaty.duckdns.org` loads with a valid padlock.
- [ ] `pm2 status` shows `mwasalaty-api` **online**.
- [ ] `docker compose ls` (in `otp-cairo/`) shows `otp-cairo` **running**.
- [ ] Planning a route in the app returns results (proves backend → OTP works).
- [ ] The PWA shows an install prompt; the operator camera opens.
- [ ] Pushing to `main` triggers a green run in the **Actions** tab and the change goes live.

---

## 14. Day-2 operations (cheat sheet)

```bash
# --- Backend (Node / PM2) ---
pm2 status                       # process state
pm2 logs mwasalaty-api           # live backend logs
pm2 restart mwasalaty-api        # manual restart

# --- OTP (Docker) ---
cd /var/www/mwasalaty/otp-cairo
docker compose ps                # is it running?
docker compose logs -f           # live OTP logs
docker stats otp-cairo           # live RAM/CPU (you used this locally)
docker compose restart           # restart OTP

# --- Update the OTP graph later ---
# 1) rebuild graph.obj on your PC, then from your PC:
#    scp -i ...key.pem C:\ITI\GP\otp-cairo\data\cairo\graph.obj ubuntu@ELASTIC_IP:/var/www/mwasalaty/otp-cairo/data/cairo/
# 2) on the server:
cd /var/www/mwasalaty/otp-cairo && docker compose up -d --force-recreate

# --- Nginx ---
sudo nginx -t && sudo systemctl reload nginx
sudo tail -f /var/log/nginx/error.log

# --- HTTPS cert (auto-renews; manual check) ---
sudo certbot renew --dry-run

# --- System health on the small box ---
free -h                          # memory + swap
df -h                            # disk
```

---

## 15. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| OTP container keeps restarting / exits | `-Xmx` too high for 2 GB | Set `-Xmx768m` in `otp-cairo/docker-compose.yml`, `docker compose up -d` |
| Route planning returns nothing | Backend can't reach OTP | `curl http://localhost:8081/otp/routers/default`; confirm `OTP_GRAPHQL_URL` port is **8081** |
| `npm ci` fails | Wrong directory | Run it inside `backend/` (has its own `package-lock.json`) |
| Build is killed (OOM) during deploy | Build + OTP exceed RAM | Confirm swap is on (`free -h`); keep `NODE_OPTIONS=--max-old-space-size=768`; or build during low traffic |
| `certbot` fails | DNS not pointing at the box yet | `nslookup mwasalaty.duckdns.org` must equal your Elastic IP; port 80 must be open |
| Site loads on HTTP but PWA/camera won't work | No HTTPS | Finish Part 9 (HTTPS is mandatory for service workers + camera) |
| CI deploy fails on `systemctl reload nginx` | Missing passwordless sudo | Re-run the `/etc/sudoers.d/mwasalaty` step in Part 4 |
| 502 Bad Gateway | Backend down | `pm2 status` / `pm2 logs mwasalaty-api` |

---

**That's the whole deployment.** After the first manual run, your day-to-day is just
`git push` to `main` → GitHub Actions ships it.
