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
* **Frontend**: Next.js (TypeScript) + TailwindCSS for sleek dark glassmorphism (glass-panel backdrops) and Lucide-React icon packs.
* **Charts**: Recharts-based dynamic data visualization (supporting Line, Bar, Pie, Scatter, and Table layouts).
* **Backend**: FastAPI (Python) running on port `8000`.
* **Database Engine**: DuckDB for sub-millisecond analytical aggregations on crawled listing files.
* **Natural Language Compiler**: Gemini 2.5 compiling user questions to DuckDB SQL.

---

## 🧩 Portal Tab Specifications

### 1. 🔍 AI Analyst (`analytics`)
Allows users to type open-ended queries (e.g., *"Show the average mileage and price of Touring motorcycles"*). The AI compiles it into SQL, logs the query for transparency, and renders:
* **Interactive Chart**: Recharts visualization based on data classification.
* **Data Grid**: Complete scrollable dataset.
* **Analyst Insights**: Human-readable text summary of the results.

### 2. ⚡ Deal Finder (`deals`)
Scans database metrics and ranks active motorcycle listings by their "deal score" (measuring listing price against customized fair market values). Identifies under-priced listings instantly.

### 3. 🧮 Cohort Valuation (`calculator`)
A pricing calculator that lets users input motorcycle specifications (Brand, Model, Year, Mileage, Engine Size) to receive a calculated appraisal score based on historical market trends, with real-time model and location filters.

### 4. 🗺️ Geographic Insights (`geo`)
Maps listing densities, volume, and average price ranges across Swedish regions (e.g., Stockholm, Västra Götaland, Skåne) to locate geographic pricing arbitrage opportunities.

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

