# Deploying ExporaFlow

How to run ExporaFlow on your own infrastructure — a company server, or AWS.
Written so someone who has never seen this codebase can take it from source to production.

**Prices are indicative, checked September 2026.** Confirm on the vendor page before purchasing.
AWS figures are for `ap-south-1` (Mumbai); use the
[AWS Pricing Calculator](https://calculator.aws/) for an exact quote.

---

## 1. Read this first

Two things will stop a new team dead if nobody tells them.

### ⚠️ The workspace owner is hard-coded to a personal email

`lib/workspace-access.ts` line 4:

```ts
const DEFAULT_WORKSPACE_OWNER_EMAIL = "abhishekbr989@gmail.com";
```

This is not cosmetic. That address controls the whole system:

- `canEmailSignIn()` — **only** the owner, existing workspace members, or someone holding a valid
  pending invite can sign in at all. Everyone else is bounced to `/auth/access-denied`.
- `ensureOwnerWorkspace()` — the owner gets an ADMIN workspace created on first sign-in.
- `getPrimaryWorkspaceId()` — the entire app resolves its workspace from the owner's account.

**Deploy without setting `WORKSPACE_OWNER_EMAIL` and nobody at the company can log in.** There is
no recovery path through the UI — the first admin has to be the owner.

Set it to a **role account you control**, not an individual's mailbox:

```env
WORKSPACE_OWNER_EMAIL="it-admin@edcs.com"
```

It must be an address that can sign in with Google or GitHub OAuth. Set it **before** the first
sign-in, then have that account sign in first; it bootstraps the workspace and invites everyone
else from `/workflow/invite`.

> Worth doing properly: delete the hard-coded default so a missing env var fails loudly instead of
> silently handing control to a former employee's personal Gmail.

### ⚠️ Three services are baked into the code

These are not swappable by configuration. Replacing one means writing code:

| Service | Used by | To replace |
|---|---|---|
| **Cloudinary** | `lib/cloudinary-config.ts`, ticket photo/video uploads | Rewrite `lib/save-cloudinary-attachments.ts` and `app/api/cloudinary/sign/route.ts` against S3 |
| **Upstash Redis** | `lib/rate-limit.ts` via `@upstash/redis` | It speaks Upstash's **REST** protocol, not the Redis wire protocol — a self-hosted Redis will not work as a drop-in. Either keep Upstash, run [`serverless-redis-http`](https://github.com/hiett/serverless-redis-http) in front of your own Redis, or drop rate limiting |
| **Resend** | `lib/mention-email-queue.ts`, `lib/integrations/notify.ts`, `app/api/invite` | Swap the Resend SDK for `nodemailer` against company SMTP |

If company policy forbids third-party SaaS, budget engineering time for these — especially
Cloudinary, which is load-bearing for attachments.

---

## 2. What you are deploying

| | |
|---|---|
| **Framework** | Next.js 15 (App Router) — one deployable app, frontend and API together |
| **Runtime** | Node.js 20 LTS |
| **Package manager** | **pnpm 9.15.9** (pinned in `package.json` → `packageManager`) |
| **Database** | PostgreSQL 16, via Prisma |
| **Auth** | NextAuth v4 — Google + GitHub OAuth, plus email/password (`app/api/auth/register`, `login`) |
| **Media** | Cloudinary |
| **Email** | Resend |
| **Rate limiting** | Upstash Redis |
| **AI (optional)** | OpenAI or Anthropic |

---

## 3. What it costs

### Option A — your own server (cheapest, most control)

Everything except the three baked-in SaaS services runs on hardware you already have.

| Requirement | Cost |
|---|---|
| Server (4 GB RAM, 2 vCPU, 40 GB disk) | Existing hardware, or ~$12–25/mo VPS |
| PostgreSQL 16 | **Free** — Docker or a system package on the same box |
| Redis | **Free** if self-hosted, but see the Upstash note in §1 |
| TLS certificate | **Free** — Let's Encrypt via Caddy or certbot |
| Domain / subdomain | **Free** if you already own `edcs.com` |

### Option B — AWS

| Component | Instance | ~USD/mo | ~INR/mo |
|---|---|---|---|
| **EC2** app server | `t3.medium` (2 vCPU, 4 GB) | ~$33 | ~₹2,900 |
| **RDS PostgreSQL** | `db.t4g.small` (2 vCPU, 2 GB) | ~$30 | ~₹2,600 |
| RDS storage | 20 GB gp3 | ~$2.50 | ~₹220 |
| EBS root volume | 30 GB gp3 | ~$2.70 | ~₹240 |
| Data transfer out | ~50 GB | ~$4 | ~₹350 |
| Elastic IP (attached) | — | Free | Free |
| **Subtotal** | | **~$72/mo** | **~₹6,300/mo** |

Cheaper: run PostgreSQL on the same EC2 box instead of RDS (drops ~$32/mo, but you own backups
and patching). More resilient: RDS Multi-AZ roughly doubles the database line.

A 1-year EC2 Reserved Instance or Savings Plan cuts the compute line ~30–40%.

### External services (both options)

| Service | Required? | Free tier | Paid from |
|---|---|---|---|
| **Cloudinary** | **Yes** — attachments | 25 credits/mo (1 credit = 1 GB storage or 1 GB bandwidth) | **$99/mo** (Plus, 225 credits) |
| **Resend** | Yes, for invites | 3,000 emails/mo, **100/day** | **$20/mo** (50k) · $35/mo (100k) |
| **Upstash Redis** | Recommended | 500K commands/mo, 256 MB | $0.20/100K commands, or **$10/mo** fixed (250 MB) |
| **Google OAuth** | Yes | **Free** | — |
| **GitHub OAuth** | Optional | **Free** | — |
| **OpenAI / Anthropic** | Optional | — | `gpt-4o-mini` $0.15/$0.60 per 1M tokens · `claude-sonnet-5` $2/$10 · realistically **under $5/mo** |
| **Slack / Teams webhook** | Optional | **Free** | — |
| **Sentry** | Optional | Free tier | ~$26/mo |

### Realistic totals (~50 internal users)

| Setup | Monthly |
|---|---|
| Own server + free tiers | **~$0–25** |
| Own server + Resend paid + Upstash paid | **~$45–55** |
| AWS + free tiers | **~$72** |
| AWS + Resend + Upstash + Cloudinary Plus | **~$200** |

Cloudinary is the one that bites — it jumps from free to $99/mo. Monitor credit usage before
committing; heavy video attachments will get you there fast.

---

## 4. Environment variables

Copy `.env.example` to `.env` and fill it in.

### Required

| Variable | Notes |
|---|---|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/exporaflow?sslmode=require` |
| `NEXTAUTH_URL` | Public URL, no trailing slash — `https://tickets.edcs.com` |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32`. **Production will not start without it.** Rotating it logs everyone out |
| `WORKSPACE_OWNER_EMAIL` | **See §1.** Set this or nobody can sign in |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud Console |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary dashboard |
| `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Cloudinary dashboard. The secret is server-side — never expose it |

### Recommended

| Variable | Notes |
|---|---|
| `GITHUB_ID` / `GITHUB_SECRET` | GitHub OAuth app |
| `RESEND_API_KEY` | Starts `re_`. Email silently no-ops without it |
| `RESEND_FROM_EMAIL` | `ExporaFlow <noreply@edcs.com>` — domain must be verified in Resend. **Missing from `.env.example`** |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Both required together. If either is missing, rate limiting **silently allows everything** |
| `NEXT_PUBLIC_APP_URL` | Fallback for `NEXTAUTH_URL` in email links. **Missing from `.env.example`** |

### Optional

| Variable | Notes |
|---|---|
| `AI_PROVIDER` | `openai` (default) or `anthropic`. **Missing from `.env.example`** |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | Defaults to `gpt-4o-mini` |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | |
| `SLACK_WEBHOOK_URL` / `TEAMS_WEBHOOK_URL` | Incoming webhook URLs |
| `GITHUB_WEBHOOK_SECRET` / `GITLAB_WEBHOOK_SECRET` | **Set these if you enable webhooks** — unset means the endpoint accepts unsigned requests from anyone. Both **missing from `.env.example`** |
| `SENTRY_DSN` | `lib/observability/sentry.ts` is a console-logging stub; wire up `@sentry/nextjs` to make it real |

---

## 5. Provider setup

### Google OAuth
1. [Google Cloud Console](https://console.cloud.google.com/) → new project → **APIs & Services → Credentials**
2. **Consent screen** → **Internal** if you use Google Workspace — this restricts sign-in to your
   company domain, which is what you want
3. **Create Credentials → OAuth client ID → Web application**
4. Authorised redirect URIs:
   - `https://tickets.edcs.com/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (dev)

### GitHub OAuth (optional)
GitHub → **Settings → Developer settings → OAuth Apps → New**.
Callback: `https://tickets.edcs.com/api/auth/callback/github`

### Cloudinary
Sign up → dashboard gives **Cloud name**, **API Key**, **API Secret**. Create an upload preset if
you want to constrain file types or sizes.

### Resend
**Domains → Add Domain** → `edcs.com` → add the DKIM/SPF records → wait for verification →
**API Keys → Create**.

### Upstash
[console.upstash.com](https://console.upstash.com/) → Create Database → region nearest your server
→ copy the **REST** URL and token (not the `redis://` URL).

---

## 6. Deploy on your own server

Assumes Ubuntu 22.04+ with Docker and Docker Compose.

```bash
# 1. Prerequisites
sudo apt update && sudo apt install -y docker.io docker-compose-plugin
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs
sudo corepack enable && corepack prepare pnpm@9.15.9 --activate

# 2. Code and config
git clone https://github.com/Abhishek-B-R/ExporaFlow.git /opt/exporaflow
cd /opt/exporaflow
cp .env.example .env && $EDITOR .env      # fill in §4 — especially WORKSPACE_OWNER_EMAIL

# 3. Postgres + Redis
docker compose up -d                       # CHANGE the default password in docker-compose.yml

# 4. Build
pnpm install --frozen-lockfile
pnpm db:migrate                            # prisma migrate deploy
pnpm build
```

Run it under systemd so it survives reboots — `/etc/systemd/system/exporaflow.service`:

```ini
[Unit]
Description=ExporaFlow
After=network.target docker.service

[Service]
Type=simple
User=deploy
WorkingDirectory=/opt/exporaflow
EnvironmentFile=/opt/exporaflow/.env
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/pnpm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload && sudo systemctl enable --now exporaflow
```

### TLS and reverse proxy

Caddy is the least work — it gets and renews Let's Encrypt certificates automatically.
`/etc/caddy/Caddyfile`:

```
tickets.edcs.com {
    reverse_proxy localhost:3000
}
```

Point a DNS A record for `tickets.edcs.com` at the server's public IP, then
`sudo systemctl reload caddy`. Open only 80 and 443 to the internet; keep 3000, 5432 and 6379
on localhost or behind the firewall.

---

## 7. Deploy on AWS

Same application steps as §6 — the difference is managed infrastructure.

1. **RDS** — create a PostgreSQL 16 instance (`db.t4g.small`), in a **private** subnet, not
   publicly accessible. Put `DATABASE_URL` in `.env` with `?sslmode=require`.
2. **EC2** — `t3.medium`, Ubuntu 22.04, in the same VPC. Security group: inbound 443 and 80 from
   `0.0.0.0/0` (or your office CIDR), 22 from your admin IP only. Attach an Elastic IP.
3. **RDS security group** — allow 5432 **only** from the EC2 instance's security group.
4. Follow §6 steps 2–4 on the EC2 box, skipping the `postgres` service in `docker compose`
   (you're using RDS). Keep the `redis` service, or use Upstash.
5. **DNS** — Route 53 A record `tickets.edcs.com` → the Elastic IP.
6. **Backups** — RDS automated backups, 7–30 day retention. Verify a restore actually works.

For higher availability put an Application Load Balancer in front, terminate TLS with ACM (free
certificates), and run two EC2 instances in different AZs. That adds ~$20/mo for the ALB.

### Docker image (optional)

`next.config.ts` does **not** set `output: "standalone"`, so the slim standalone Dockerfile pattern
will not work as-is. Either add that line first, or build a straightforward image:

```dockerfile
FROM node:20-slim
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile && pnpm build
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
CMD ["pnpm", "start"]
```

---

## 8. First run

Order matters.

1. `WORKSPACE_OWNER_EMAIL` is set in `.env` **before** anyone signs in
2. That account signs in with Google — this creates the workspace and makes it ADMIN
3. From `/workflow/invite`, the admin invites everyone else with a role
   (`ADMIN` / `MANAGER` / `ENGINEER` / `QA` / `VIEWER`)
4. Invitees accept, sign in, and land in the workspace

Anyone who signs in without being the owner, a member, or invited gets `/auth/access-denied`.
This is deliberate — the app is not open-registration.

---

## 9. Post-deploy checklist

- [ ] `https://tickets.edcs.com` loads over HTTPS with a valid certificate
- [ ] `WORKSPACE_OWNER_EMAIL` is a **role account**, not an individual's personal address
- [ ] The owner signed in first and has an ADMIN workspace
- [ ] An invited colleague receives the email and can accept
- [ ] Create a ticket, upload a photo and a video — both appear (Cloudinary is configured)
- [ ] @mention someone in a comment — they get an email
- [ ] Database backups are on **and a restore has been tested**
- [ ] `.env` is `chmod 600` and not in version control
- [ ] Ports 3000 / 5432 / 6379 are not reachable from the internet

---

## 10. Operations

```bash
pnpm db:migrate        # apply new migrations (prisma migrate deploy)
pnpm db:status         # check migration state
npx prisma studio      # inspect/edit data
pnpm test              # ticket policy + integration logic checks
```

**Deploying an update**

```bash
cd /opt/exporaflow && git pull
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm build
sudo systemctl restart exporaflow
```

**Manual database backup**

```bash
pg_dump "$DATABASE_URL" | gzip > backup-$(date +%F).sql.gz
```

Put that in a cron job with off-box retention if you are not using RDS automated backups.

**Rotating a secret** — update it at the provider, update `.env`, restart the service.
Rotating `NEXTAUTH_SECRET` signs every user out; nothing else is lost.

---

## 11. Known gaps

- **`WORKSPACE_OWNER_EMAIL` defaults to a personal Gmail** — §1. The single biggest risk to
  running this after the original author leaves.
- **Sentry is a stub.** `lib/observability/sentry.ts` logs to console. `pnpm add @sentry/nextjs`
  and run `npx @sentry/wizard -i nextjs` to make it real. Structured logging via
  `lib/observability/logger.ts` does work and reaches your system logs.
- **Webhook secrets are optional in code.** If `GITHUB_WEBHOOK_SECRET` / `GITLAB_WEBHOOK_SECRET`
  are unset, the webhook endpoints accept unsigned requests from anyone. Set them, or leave the
  integrations disabled.
- **`.env.example` is missing five variables the code reads**: `RESEND_FROM_EMAIL`,
  `NEXT_PUBLIC_APP_URL`, `AI_PROVIDER`, `GITHUB_WEBHOOK_SECRET`, `GITLAB_WEBHOOK_SECRET`.
- **`next/font` fetches Inter from Google Fonts at build time.** A build machine with no outbound
  internet fails with `Failed to fetch 'Inter' from Google Fonts`. Allowlist
  `fonts.googleapis.com` and `fonts.gstatic.com`, or switch `app/layout.tsx` to `next/font/local`.
- **`docker-compose.yml` ships with `POSTGRES_PASSWORD: password`.** Change it before it goes
  anywhere near production.
- **No health endpoint.** Add `app/api/health/route.ts` returning `SELECT 1` against Prisma if you
  want a load balancer or uptime monitor to have something meaningful to poll.
