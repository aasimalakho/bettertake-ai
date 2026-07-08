# BetterTake AI

Two AI agents argue over an ad image until it's good enough to ship.

![Home screen — live round-by-round argument](screenshots/home.png)
![Past campaigns archive, read live from B2](screenshots/history.png)

- **Generator agent** — creates an ad image from your campaign brief using **Replicate's FLUX 1.1 Pro** model, orchestrated through **Genblaze**.
- **Critic agent** — looks at the actual image (vision model) and scores it against your brief, calling out one specific thing to fix.
- The two go back and forth for a few rounds, **live in the browser** — each round streams in as it finishes rather than making you wait on one long request.
- Every round's image, plus the full back-and-forth, is stored durably in **Backblaze B2** — and is browsable afterward on the **Past campaigns** page, not just claimed in this README.

Built for the Backblaze Generative Media Hackathon.

---

## Who this is for

Solo brand owners, indie e-commerce sellers, and small marketing teams who need ad
creative fast but can't brief and wait on a design agency for every variation.
Instead of getting one AI image and hoping it's usable, they get a short,
visible negotiation between a generator and a critic — and a durable record of
every version considered, so nothing is a black box.

---

## What you need before you start

Three free accounts, no money required to get started.

1. A **Backblaze B2** account (storage) — 10GB free.
2. A **Replicate** account (image generation) — free trial runs, no credit card needed to start, at [replicate.com](https://replicate.com).
3. An **OpenAI** account (the critic's "eyes") — new accounts usually come with a small free credit; a few dozen critique calls cost cents.
4. **Python 3.11 or newer** for local development (not needed if you only plan to deploy).

---

## Step 1 — Create your Backblaze B2 bucket

1. Go to [backblaze.com/b2](https://www.backblaze.com/cloud-storage) and sign up for a free account.
2. Once logged in, go to **Buckets** and click **Create a Bucket**.
3. Give it any name (must be globally unique, e.g. `bettertake-ai-yourname`).
4. Set it to **Public** — this lets the generated images load directly in the browser without extra work.
5. Go to **Application Keys** (left sidebar) and click **Add a New Application Key**.
6. Name it anything, allow access to the bucket you just created, and click **Create New Key**.
7. Copy the **keyID** and **applicationKey** shown — you'll only see the applicationKey once. Save both somewhere safe.

## Step 2 — Create your Replicate account

1. Go to [replicate.com](https://replicate.com) and sign up (email, GitHub, or Google — no card required).
2. Click your profile icon (top right) → **API tokens** → **Create token**. Copy it (starts with `r8_...`).
3. Browse [replicate.com/collections/try-for-free](https://replicate.com/collections/try-for-free) to confirm which models currently have free runs available — this project defaults to `black-forest-labs/flux-1.1-pro`, but check the collection since Replicate rotates what's included.
4. Free runs are capped per account. Once you exceed them, Replicate will ask you to add billing to continue — at that point, per-run pricing is shown on the model's page.

## Step 3 — Create your OpenAI account

1. Go to [platform.openai.com](https://platform.openai.com/api-keys) and sign up.
2. Click **Create new secret key**, copy it immediately (you won't see it again).
3. This project uses `gpt-4o` for the critic — a normal free-tier or pay-as-you-go account works fine; each critique call costs a fraction of a cent.

## Step 4 — Local setup

```bash
python3 -m venv venv
source venv/bin/activate        # on Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Step 5 — Add your API keys

```bash
cp .env.example .env
```

Open `.env` and fill in:
```
B2_KEY_ID=...
B2_APP_KEY=...
B2_BUCKET=your-bucket-name
REPLICATE_API_TOKEN=r8_...
OPENAI_API_KEY=...
```

## Step 6 — Run it locally

```bash
python app.py
```

Then open **http://localhost:5000**

## Step 7 — Deploy to Hugging Face Spaces (so judges get a real working URL)

The hackathon requires a live app URL judges can open directly — `localhost` isn't
submittable. This repo's `Dockerfile` is already configured for HF Spaces.

1. Create a free Hugging Face account → **New Space** → choose **Docker** as the SDK → name it (e.g. `bettertake-ai`).
2. Clone the empty Space repo HF gives you, copy every file from this project into it (including hidden files like `.gitignore`).
3. Make sure the very top of this README has the HF Spaces config block — if it's missing, add it above everything else:
   ```yaml
   ---
   title: BetterTake AI
   emoji: 🖊️
   sdk: docker
   app_port: 7860
   pinned: false
   ---
   ```
4. `git add . && git commit -m "Initial commit" && git push`
5. In your Space, go to **Settings → Repository secrets** and add: `B2_KEY_ID`, `B2_APP_KEY`, `B2_BUCKET`, `REPLICATE_API_TOKEN`, `OPENAI_API_KEY`.
6. The Space rebuilds automatically — watch the **Building** logs. You'll get a live URL like `https://huggingface.co/spaces/yourname/bettertake-ai`.

**Alternative hosts** (same Dockerfile, no changes needed — they inject their own `$PORT`):
- **Render** — "New Web Service" → connect this repo → it detects the `Dockerfile` → add the env vars → deploy.
- **Railway** — "New Project" → deploy from repo → it picks up the `Procfile` → add the env vars → deploy.
- **Fly.io** — `fly launch` in this folder, then `fly secrets set B2_KEY_ID=... B2_APP_KEY=... B2_BUCKET=... REPLICATE_API_TOKEN=... OPENAI_API_KEY=...`

Test one full campaign on the live URL before recording your demo or submitting. Since Replicate's free runs are limited per account, save a couple for your live demo recording rather than using them all up in development.

## Step 8 — Use it

1. Type in a product/campaign description and a brand direction (tone, mood, colors).
2. Optionally attach a reference image (a product photo, a style reference — totally optional).
3. Choose how many rounds you want the two agents to argue for (2–4).
4. Click **Submit for Review** — each round appears live as it finishes, stamped **Revise** or **Approved**, with a download link and a link to that round's B2 provenance manifest.
5. Visit **Past campaigns** any time to browse every previous session, pulled live from B2.

Every round's image and a full session log (the whole argument, as JSON) get uploaded to your B2 bucket automatically, organized under `sessions/{session_id}/`.

---

## How this satisfies the hackathon requirements

**Providers and models used:**
- Replicate — `black-forest-labs/flux-1.1-pro` (image generation, the Generator agent)
- OpenAI — `gpt-4o` (vision-based scoring, the Critic agent)

**How B2 is used:** every round's generated image is stored via Genblaze's `ObjectStorageSink`, which also writes a SHA-256 provenance manifest alongside each asset (organized under `runs/` by session). This app also writes a consolidated `session_log.json` per campaign under `sessions/{session_id}/`, capturing every round's prompt, image, and critique. The `/history` page reads that same data back out of B2 with `list_objects_v2` / `get_object`, so the "durable, reviewable" storage claim is something a judge can click through live, not just read about.

**How Genblaze is used:** the Generator agent runs through Genblaze's `Pipeline` / `Step` API, chained across rounds with `.from_result()` so each regeneration is linked to its predecessor (full lineage, not disconnected calls). This is exactly the generate → evaluate → retry pattern the hackathon calls out as a strong pattern for agentic media pipelines. Genblaze's provider abstraction is also what made it possible to move the image provider (GMI Cloud → NVIDIA NIM → Google → Replicate, across this project's development) with a one-function change in `run_generator_step()` each time, instead of a rewrite.

**Production readiness:**
- Rounds stream live over Server-Sent Events instead of one blocking request, so the browser never sits on a multi-minute unresponsive call.
- `max_rounds` and brief text length are validated and clamped server-side — a malicious or mistaken client can't force runaway generation cost.
- A simple per-IP cooldown limits how fast one visitor can trigger new (paid) generation runs.
- Runs behind `gunicorn` in Docker/Procfile, not the Flask dev server, with `debug` off by default.
- A small `pytest` suite covers prompt-building and input-clamping logic (`tests/test_app.py`).
- Fully responsive UI (mobile, tablet, desktop) with a proper editorial design system, not default browser form styling.

---

## Troubleshooting

- **"B2_BUCKET is not set" warning on startup** — you forgot to fill in `.env`. Double check Step 5.
- **Images don't load in the browser** — make sure your B2 bucket is set to **Public** (Step 1.4).
- **"Insufficient credit" or a billing prompt from Replicate** — you've used up the free runs on your account; either add billing (per-run pricing is on the model's page) or switch `model=` in `run_generator_step()` to another model still in the free collection.
- **Reference image upload seems ignored** — some image models don't support reference-image guidance the same way; the app automatically falls back to text-only generation if the provider rejects the reference image, so the demo never breaks — check your terminal log for a warning.
- **Critic responses look garbled** — this can happen occasionally with any LLM; the app has a fallback that scores it 5/10 and asks for a retry rather than crashing.
- **"Please wait Ns before starting another campaign"** — the per-IP cooldown (Step 8), there to stop accidental cost spam; just wait the stated number of seconds.
- **HF Space stuck "Building"** — check the build logs tab; the most common cause is a missing/misplaced YAML config block at the very top of the README (see Step 7.3).

## Project structure

```
bettertake-ai/
├── app.py                  # Flask backend: generator/critic loop, SSE streaming, B2 storage, history API
├── requirements.txt        # Python dependencies
├── Dockerfile              # Defaults to port 7860 for Hugging Face Spaces
├── Procfile                # For Railway / Heroku style deploys
├── .dockerignore
├── .gitignore
├── .env.example             # Copy to .env and fill in your keys
├── screenshots/             # Used in this README
├── tests/
│   └── test_app.py         # Unit tests for prompt building + input validation
├── templates/
│   ├── index.html          # Main campaign form + live round view
│   └── history.html        # Gallery of past campaigns, read from B2
└── static/
    ├── style.css            # "The Red Pen" — responsive editorial design system
    ├── app.js               # Streams rounds live via Server-Sent Events
    └── history.js           # Loads /api/sessions for the gallery
```
