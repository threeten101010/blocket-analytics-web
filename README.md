# 🇸🇪 Blocket Analytics Web (Natural Language Query Portal)

Welcome to **Blocket Analytics Web**, a premium, split-stack web portal that enables you to query Sweden's largest classified motorcycle database using plain natural language!

This application translates user inquiries into schema-aware, optimized DuckDB SQL queries via the Google Gemini API, executes them on your analytical dataset, and displays interactive animated charts and sorted data matrices.

---

## 🌐 Planned Architecture

The diagram below details the data flow and communication pipeline between the Next.js React client, the FastAPI routing server, the Gemini LLM translator, and the local/remote DuckDB storage system:

```mermaid
graph TD
    subgraph Client [Front-End: Next.js / React]
        UI["Dashboard UI (Glassmorphic)"]
        SearchBar["Search Input (Natural Language)"]
        ChartRenderer["Recharts (Line/Bar/Scatter SVG)"]
        TableRenderer["Data Table Grid"]
        UI --> SearchBar
        UI --> ChartRenderer
        UI --> TableRenderer
    end

    subgraph Server [Back-End: FastAPI]
        API["POST /api/query"]
        LLMTranslator["Gemini NL-to-SQL Engine"]
        DBClient["DuckDB Query Execution Client"]
        API --> LLMTranslator
        LLMTranslator --> DBClient
    end

    subgraph Data [Data Tier]
        DuckDB[("DuckDB: listings_analytics")]
    end

    SearchBar -->|1. Natural Language Query| API
    DBClient -->|2. Schema-aware SQL Query| DuckDB
    DuckDB -->|3. Return Raw Datasets| DBClient
    API -->|4. Return JSON (SQL, Data, Chart Type)| UI
```

---

## 🛠️ Technology Stack

* **Front-end**: Next.js 15 (App Router, TypeScript, Tailwind CSS), Recharts (data visualizations), and Lucide React.
* **Back-end**: FastAPI, DuckDB analytical client, and Pydantic validation.
* **AI translation engine**: Google Gemini 1.5 Pro / Flash.

---

## 📂 Project Architecture

For deep technical details, prompt structures, Pydantic schemas, and local multi-server script boots, read the [Detailed Technical Blueprint](file:///home/aaronberman/Gemini/projects/blocket-analytics-web/analytics_web_blueprint.md).
