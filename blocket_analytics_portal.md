# 🌌 Blocket Analytics Portal

The **Blocket Analytics Portal** is a full-stack analytical dashboard built to query, visualize, and appraise the Swedish motorcycle market. It translates natural language questions into secure DuckDB SQL queries in real-time, executing them and charting the findings dynamically.

---

## 🎨 Interactive Interface Mockups
Below are the high-fidelity user interface mockups for the key tabs in the portal:

### 🔍 AI Analyst View
![AI Analyst View - Blocket Analytics UI](./blocket_analytics_ui_mockup.png)

### ⚡ Deal Finder View
![Deal Finder View - Blocket Analytics UI](./blocket_deal_finder_ui.png)

---

## ⚙️ Tech Stack & Architecture
* **Frontend**: Next.js 15 (TypeScript, React 19) + TailwindCSS 3 for sleek dark glassmorphism (glass-panel backdrops) and Lucide-React icon packs.
* **Charts**: Recharts-based dynamic data visualization (supporting Line, Bar, Pie, Scatter, and Table layouts).
* **Backend**: FastAPI (Python) running on port `8000` with Uvicorn hot-reload.
* **Database Engine**: DuckDB on the remote server, queried over Tailscale SSH.
* **Natural Language Compiler**: Gemini 2.5 compiling user questions to DuckDB SQL.
* **Remote Connectivity**: Tailscale SSH tunnel to remote database server (`101010_remote`).
* **Interactive BI Dashboard**: Rill Developer (`v0.86.6`) running on port `9009` for sub-second local slicing and dicing of the scraper database.

---

## 🧩 Portal Tab Specifications

### 1. 🔍 AI Analyst (`analytics`)
Allows users to type open-ended queries (e.g., *"Show the average mileage and price of Touring motorcycles"*). The AI compiles it into SQL, logs the query for transparency, and renders:
* **Interactive Chart**: Recharts visualization based on data classification.
* **Data Grid**: Complete scrollable dataset.
* **Analyst Insights**: Human-readable text summary of the results.

### 2. ⚡ Deal Finder (`deals`)
Scans database metrics and ranks active motorcycle listings by their "deal score" (measuring listing price against customized fair market values). Identifies under-priced listings instantly.

**Features:**
* **Column A — Underpriced Value Deals**: Listings priced 15–45% below their national cohort FMV.
* **Column B — Highly Negotiable Postings**: Listings sitting on the market significantly longer than comparable ones, indicating seller willingness to discount.
* **Pricing Comparison Grid**: Each deal card displays a structured 3-column grid showing **Listed Price**, **Fair Market Value**, and **Total Savings** (or **Markup/Premium**) side-by-side to eliminate mental arithmetic.
* **Interactive Filters**: Brand, Location, and Minimum Price-Drop dropdown filters at the top of the page to refine both columns simultaneously.

### 3. 🧮 Cohort Valuation (`calculator`)
A pricing calculator that lets users input motorcycle specifications to receive a calculated appraisal score based on historical market trends.

**Input Specifications Form:**
* **Brand** — Dropdown selector (10 most common brands).
* **Style Class** — Dropdown selector (Touring, Sport, Custom, etc.).
* **Manufacture Year** — Numeric input.
* **Mileage (km)** — Numeric input.
* **Engine Displacement (cc)** — Numeric input.
* **Model (Optional)** — Dynamic dropdown populated by available models for the selected Brand+Style combination.
* **Location (Optional)** — Dynamic dropdown populated by available locations for the selected Brand+Style combination.

**Dynamic Behavior:**
* When Brand or Style Class changes, the backend API (`GET /api/cohort-options`) is called to fetch distinct models and locations from the database for that specific combination. The Model and Location dropdowns are repopulated dynamically.
* If Model or Location are specified, the backend recalculates the **FMV** (median price of the refined subset) and **Cohort Sample Size** dynamically rather than relying on the broad category statistics.

**Result Panel:**
* Estimated Fair Market Value display.
* Expected Days to Sell and Cohort Sample Size metrics.
* Cohort hierarchy resolution info (which level of specificity was matched).
* **Cohort Refinement Filters**: Post-appraisal filters for Model and Location to refine the scatter chart and listing registry.
* **Scatter Chart**: Mileage vs Price distribution with FMV reference lines (baseline green + filtered violet).
* **Raw Cohort Database Registry**: Scrollable list of matched listings with Active/Sold status badges.

### 4. 🗺️ Geographic Insights (`geo`)
Maps listing densities, volume, and average price ranges across Swedish regions (e.g., Stockholm, Västra Götaland, Skåne) to locate geographic pricing arbitrage opportunities.

### 5. 📊 Rill Dashboard (`rill`)
A standalone Rill Developer dashboard serving on port `9009` designed for sub-second interactive data exploration. It provides real-time time-series aggregation and sidebar filters (for Brand, Location, Seller Type, Gearbox, etc.) connected to the scraper DuckDB database.

---

## 🔌 API Endpoint Reference

### `POST /api/query`
Translates natural language questions into DuckDB SQL and executes them.

| Parameter | Type | Description |
|-----------|------|-------------|
| `user_query` | string | Natural language question |
| `model_choice` | string | Gemini model variant (default: `gemini-2.5-flash`) |

### `POST /api/appraise`
Calculates fair market value using hierarchical cohort medians.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `brand` | string | ✅ | Motorcycle brand |
| `vehicle_type` | string | ✅ | Style class |
| `year` | int | ✅ | Manufacture year |
| `mileage` | int | ✅ | Mileage in km |
| `cc` | int | ✅ | Engine displacement |
| `model` | string | ❌ | Optional model filter (applies ILIKE matching) |
| `location` | string | ❌ | Optional location filter (applies ILIKE matching) |

**Behavior:** When `model` or `location` are provided, listings are filtered server-side and the FMV is dynamically recalculated as the median price of the refined subset.

### `GET /api/cohort-options`
Fetches available models and locations for a given brand+style combination.

| Parameter | Type | Description |
|-----------|------|-------------|
| `brand` | string | Motorcycle brand |
| `vehicle_type` | string | Style class |

**Returns:** `{ "models": ["MT-07", "R1", ...], "locations": ["Stockholm", "Göteborg", ...] }`

### `GET /api/deals`
Fetches top underpriced bargains and highly negotiable postings.

### `GET /api/geo`
Returns geographic tier statistics and per-city volume/price deviation data.

---

## 🗄️ Database Connectivity Engine

The backend connects to the remote DuckDB database over Tailscale SSH using an optimized two-tier strategy:

### Connection Strategy (`backend/database.py`)
1. **Direct Read-Only Connection (Primary)**: Attempts `duckdb.connect(path, read_only=True)` directly on the source database. DuckDB natively supports concurrent read-only queries, making this the fastest path (~0.8s round-trip over SSH).
2. **Fallback Copy (Secondary)**: If the direct connection fails (e.g., due to an active write lock from the scraper daemon), the system copies the database file to `/tmp` and connects to the copy.
3. **Connection Cleanup**: The connection is always explicitly closed in a `finally` block, and any temporary copies are removed.

### Performance Notes
* The original implementation always copied the full 52MB database file before every query, causing multi-second latency. The optimized strategy eliminates this copy in the common case.
* API response times dropped from several seconds to **~0.8 seconds** total round-trip.

---

## 📊 Fair Market Value (FMV) Calculation Model

To guarantee highly accurate, listing-specific appraisals in the **Deal Finder** and **Cohort Valuation** tools, the system runs an advanced multi-dimensional pricing engine at the end of each crawling sweep:

### 1. Model-Specific Baseline Extraction
* **Normalized Model Keys**: Brand and model strings are normalized by cleaning spaces, casing, and special characters (e.g. matching `MT-07` and `MT07`, and `R 1250 GS` and `R1250GS` into the same model).
* **Model Grouping**: For each model containing $\ge 3$ listings in the database, the engine computes:
  * Model Median Price (Baseline Price)
  * Model Median Year (Baseline Year)
  * Model Median Mileage (Baseline Mileage)
  * Model Median Sale Duration
* **Fallback Hierarchy**: If a model has $< 3$ listings, it falls back to the hierarchical category cohort (Level 1 to 5, such as `YAMAHA | Touring | 2016-2020 | 651-1000cc | 15k-30k` down to style fallback) to extract the baseline price, year, and mileage.

### 2. Multi-Dimensional Adjustments
Once the baseline is established, the engine adjusts the listing's FMV relative to the baseline attributes:

* **Age (Model Year) Offset**: 
  * Adjusts value by $\pm 6.0\%$ per year of difference from the baseline model year.
  * Capped between $-50\%$ (older) and $+30\%$ (newer) to prevent extreme age scaling.
* **Mileage Offset**:
  * Adjusts value by $\pm 3.0\%$ for every $5,000 \text{ km}$ deviation from the baseline model mileage.
  * Capped between $-25\%$ (high mileage) and $+15\%$ (very low mileage).
* **Geographical Demand Offset**:
  * **Metropolitan** (Stockholm, Göteborg, Malmö) listings receive a $+2.5\%$ value premium.
  * **Regional/Rural** listings receive a $-3.0\%$ discount.
  * **Urban Centers** (e.g., Västerås, Örebro) act as baseline ($0\%$).
* **Seller Profile Offset**:
  * **Commercial Dealers** (`Butik`/`Företag`) receive a $+6.0\%$ premium to account for professional reconditioning, standard vehicle warranties, and financing/trade-in support.
  * **Private Sellers** (`Privat`) receive a $-3.0\%$ discount.

### 3. Accessory, Condition, and Feature Title Scanning
The listing's `title` is scanned for high-value and high-risk terms to apply final adjustments:
* **Premium Upgrades & Good Condition (Capped at $+15.0\%$)**:
  * Brand systems (Akrapovič, Yoshimura, SC Project): $+3.5\%$
  * Premium suspension (Öhlins, Brembo brakes): $+4.0\%$
  * Accessories (Side cases/sidoväskor, Topbox, Touring bags): $+2.5\%$
  * Safety features (ABS brakes specified): $+1.5\%$
  * Condition highlights (Nyskick, kanonskick, top condition): $+3.0\%$
  * Service indicators (Nyservad, servad, freshly serviced): $+1.5\%$
  * Inspection indicators (Nybesiktigad, besiktigad, inspected): $+1.0\%$
* **Damage & Risk Indicators (Capped at $-40.0\%$)**:
  * Severe flaws (Repobjekt, defekt, engine failure/rasad): $-35.0\%$
  * Cosmetic flaws (Skadad, repad, buckla, spricka): $-10.0\%$
  * Urgencies (Måste bort, cheap on quick sale/snabb affär): $-5.0\%$

### 4. Valuation Consolidation & Safety Capping
* **Combined Formula**: 
  $$\text{Listing FMV} = \text{Baseline Price} \times (1 + \text{Age Offset} + \text{Mileage Offset} + \text{Geo Offset} + \text{Seller Offset} + \text{Text Offset})$$
* **Safety Bounds**: The final multiplier is capped strictly between $0.60$ and $1.40$ (unless it's a severe defect) to ensure anomalous listings are not appraised with unrealistic values.
* **Rounding**: Output is rounded to the nearest $100 \text{ SEK}$.

---

## 📂 Project Directory Structure

```text
blocket-analytics-web/
├── package.json               # Next.js, Tailwind, Recharts, and TypeScript dependencies
├── tsconfig.json              # TypeScript compilation rules
├── tailwind.config.js         # Tailored dark-mode colors & glassmorphism utilities
├── next.config.js             # Client configurations
├── Dockerfile                 # Container build configuration
├── docker-compose.yml         # Docker Compose orchestration
├── run_dev.sh                 # Boot both servers concurrently
├── blocket_rill_dashboard_preview.png  # Visual preview screenshot of the Rill dashboard
│
├── development/               # GitOps ticketing and project artifacts
│   ├── features/              # Design stories, specifications, and walkthrough guides
│   ├── backlog/               # Pending development tickets
│   ├── done/                  # Completed and audited tickets
│   └── rill/                  # Rill Developer configuration files
│       ├── rill.yaml          # Rill compiler settings
│       ├── connectors/        # DuckDB connector configuration
│       ├── sources/           # Database source files (pointing to DuckDB)
│       └── dashboards/        # Metrics views and explore dashboards
│
├── app/                       # App Router Directories
│   ├── layout.tsx             # HTML body, fonts, and dark theme background
│   ├── page.tsx               # Dashboard Portal (tabbed navigation with 4 views)
│   └── globals.css            # Tailwind imports, glassmorphism classes, scrollbar styles
│
├── components/                # Modular React Components
│   ├── QueryInput.tsx         # Natural language search field with animated glows
│   ├── AnalyticsChart.tsx     # Dynamic chart visualizer (Bar/Line/Pie/Scatter)
│   ├── AnalyticsTable.tsx     # Interactive data grid with sorting
│   ├── DealsTab.tsx           # Deal Finder: pricing grids, filters, bargain cards
│   ├── CalculatorTab.tsx      # Cohort Appraiser: specs form, scatter chart, registry
│   └── GeoTab.tsx             # Geographic Insights: tier stats, city volumes
│
├── backend/                   # FastAPI Server
│   ├── main.py                # Router, CORS, endpoint definitions
│   ├── database.py            # Remote DuckDB SSH connector (optimized read-only)
│   └── translator.py          # AI SQL Translator (Gemini schema-aware compiler)
│
└── blocket_analytics_portal.md  # This documentation file
```

---

## 🏁 Development & Deployment

### Local Development
```bash
# Start both servers concurrently
./run_dev.sh

# Or start individually:
cd backend && python3 main.py          # FastAPI on port 8000
npm run dev                             # Next.js on port 3005
```

### Git Workflow
* **Sandbox**: `/projects/blocket-analytics-web` — Active development on `dev` branch.
* **Production**: `/repos/threeten101010/blocket-analytics-web` — Updated via `main` branch pulls.
* All changes are committed to `dev`, merged to `main`, pushed to GitHub, then pulled into production.

### Known Operational Notes
* **Cache Corruption**: Running `next build` while the dev server is active corrupts the `.next` cache. Always stop the dev server before building, or delete `.next` and restart.
* **DuckDB Locks**: The remote scraper daemon holds a write lock on the database during active crawling cycles. The database connector handles this gracefully with its fallback copy strategy.
