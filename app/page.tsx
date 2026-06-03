"use client";

import React, { useState } from "react";
import { 
  Sparkles, 
  Flame, 
  Calculator, 
  Map, 
  Code, 
  MessageSquare, 
  ShieldAlert,
  ArrowRight,
  Copy,
  Check
} from "lucide-react";

// Visual Component Imports
import QueryInput from "../components/QueryInput";
import AnalyticsChart from "../components/AnalyticsChart";
import AnalyticsTable from "../components/AnalyticsTable";
import DealsTab from "../components/DealsTab";
import CalculatorTab from "../components/CalculatorTab";
import GeoTab from "../components/GeoTab";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"analytics" | "deals" | "calculator" | "geo">("analytics");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleSearch = async (userQuery: string, modelChoice: string) => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("http://localhost:8000/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_query: userQuery, model_choice: modelChoice }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to compile database query.");
      }

      const data = await res.json();
      if (data.success) {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message || "FastAPI connection offline.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopySQL = () => {
    if (!result?.sql_query) return;
    navigator.clipboard.writeText(result.sql_query);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="w-full max-w-7xl mx-auto px-4 md:px-6 py-8 flex flex-col gap-8 font-sans">
      
      {/* 1. Header Hero Panel */}
      <header className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] md:text-xs font-bold uppercase bg-gradient-to-r from-emerald-400 to-teal-500 text-[#090D16] tracking-wider shadow-sm shadow-emerald-400/20">
              Sweden Motorcycle Market
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></div>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white font-sans">
            BLOCKET <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-400 to-violet-400">ANALYTICS PORTAL</span>
          </h1>
          <p className="text-slate-400 text-xs md:text-sm max-w-[600px] leading-relaxed">
            A premium full-stack analytical platform translating natural language questions into secure DuckDB SQL and interactive visualizations using Gemini 2.5.
          </p>
        </div>
      </header>

      {/* 2. Glassmorphic Navigation Tabs */}
      <nav className="w-full max-w-3xl self-center p-1.5 rounded-2xl bg-white/5 border border-white/10 glass-panel flex gap-1 md:gap-2 text-xs md:text-sm font-semibold">
        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
            activeTab === "analytics"
              ? "bg-gradient-to-r from-emerald-400 to-teal-500 text-[#090D16] font-bold shadow-[0_0_15px_rgba(52,211,153,0.2)]"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Analyst</span>
        </button>

        <button
          onClick={() => setActiveTab("deals")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
            activeTab === "deals"
              ? "bg-gradient-to-r from-emerald-400 to-teal-500 text-[#090D16] font-bold shadow-[0_0_15px_rgba(52,211,153,0.2)]"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Deal Finder</span>
        </button>

        <button
          onClick={() => setActiveTab("calculator")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
            activeTab === "calculator"
              ? "bg-gradient-to-r from-emerald-400 to-teal-500 text-[#090D16] font-bold shadow-[0_0_15px_rgba(52,211,153,0.2)]"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Cohort Valuation</span>
        </button>

        <button
          onClick={() => setActiveTab("geo")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
            activeTab === "geo"
              ? "bg-gradient-to-r from-emerald-400 to-teal-500 text-[#090D16] font-bold shadow-[0_0_15px_rgba(52,211,153,0.2)]"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Map className="w-4 h-4" />
          <span>Geographic Insights</span>
        </button>
      </nav>

      {/* 3. Primary Dashboard Displays */}
      <section className="w-full flex flex-col gap-6">
        
        {/* TAB A: AI Search Interface */}
        {activeTab === "analytics" && (
          <div className="w-full flex flex-col gap-6">
            <QueryInput onSearch={handleSearch} isLoading={loading} />

            {/* Error handling card */}
            {error && (
              <div className="w-full p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 flex items-start gap-2.5 glass-panel text-xs md:text-sm font-sans">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-semibold mb-1">❌ SQL Translation Error</p>
                  <p className="text-slate-300 text-xs">{error}</p>
                </div>
              </div>
            )}

            {/* In-progress skeleton loader */}
            {loading && (
              <div className="w-full h-[300px] rounded-2xl glass-panel flex flex-col items-center justify-center gap-3 border border-white/5">
                <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 text-xs md:text-sm">Gemini is translating prompt and executing DuckDB schema-joins...</p>
              </div>
            )}

            {/* Query Results */}
            {result && !loading && (
              <div className="w-full flex flex-col gap-6">
                
                {/* Generated SQL Display Widget */}
                <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                  <div className="lg:col-span-2 p-5 rounded-2xl glass-panel border border-white/5 flex flex-col gap-3 shadow-xl">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2 text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      <div className="flex items-center gap-1.5"><Code className="w-4 h-4 text-emerald-400" /><span>Generated SQL Query</span></div>
                      <button
                        onClick={handleCopySQL}
                        className="p-1 rounded bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all flex items-center gap-1 text-slate-300 hover:text-white"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                    <pre className="text-[10px] md:text-xs text-violet-300 font-mono overflow-x-auto bg-[#090D16] p-4 rounded-xl border border-white/5 leading-relaxed max-h-[150px] select-all">
                      {result.sql_query}
                    </pre>
                  </div>

                  <div className="p-5 rounded-2xl glass-panel border border-white/5 flex flex-col gap-3 justify-center shadow-xl">
                    <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      <span>Analytical Explanation</span>
                    </div>
                    <p className="text-xs md:text-sm text-slate-300 font-sans leading-relaxed">
                      {result.explanation}
                    </p>
                  </div>
                </div>

                {/* dynamic SVG Chart */}
                {result.visualization.recommended_chart !== "table" && (
                  <AnalyticsChart rows={result.rows} visualization={result.visualization} />
                )}

                {/* Dynamic Data Table Grid */}
                <AnalyticsTable columns={result.columns} rows={result.rows} />

              </div>
            )}

            {/* Default Dashboard Introduction */}
            {!result && !loading && !error && (
              <div className="w-full p-8 rounded-2xl glass-panel border border-white/5 text-center flex flex-col items-center justify-center gap-5 shadow-2xl relative overflow-hidden">
                {/* Radial glow background */}
                <div className="absolute w-[200px] h-[200px] bg-gradient-to-tr from-violet-500/10 to-emerald-400/10 blur-[50px] rounded-full -z-10 animate-pulse"></div>
                
                <Sparkles className="w-10 h-10 text-slate-500 opacity-60 animate-bounce" />
                <div className="flex flex-col gap-1.5 max-w-[450px]">
                  <h3 className="text-base md:text-lg font-extrabold text-slate-200 font-sans">
                    Ask the AI Scraper Analyst
                  </h3>
                  <p className="text-xs text-slate-400 font-sans leading-relaxed">
                    Type any question in English or Swedish. The schema-aware **Gemini 2.5** engine will compile a query and execute it remotely on the DuckDB database to build custom reports in real-time.
                  </p>
                </div>

                <div className="w-full max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-3 text-left text-xs font-sans mt-2">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col gap-1">
                    <span className="font-semibold text-slate-200">🔍 Search anything</span>
                    <span className="text-[10px] text-slate-400">"Show the average mileage and price of Touring motorcykles"</span>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col gap-1">
                    <span className="font-semibold text-slate-200">📊 Automatic visualization</span>
                    <span className="text-[10px] text-slate-400">"Compare brand volumes using a pie chart"</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB B: Deal Finder Hub */}
        {activeTab === "deals" && <DealsTab />}

        {/* TAB C: Dynamic Appraisal Calculator */}
        {activeTab === "calculator" && <CalculatorTab />}

        {/* TAB D: Geo Pricing map / Insights */}
        {activeTab === "geo" && <GeoTab />}

      </section>

      {/* 4. Footer */}
      <footer className="w-full text-center border-t border-white/5 pt-6 text-[10px] md:text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
        <p>© 2026 Blocket Scraper Analytics Platform. All rights reserved.</p>
        <div className="flex items-center justify-center gap-1.5 font-mono text-[9px] bg-white/5 px-3 py-1 rounded-full border border-white/5 text-slate-400">
          <span>Head Node Status:</span>
          <span className="text-emerald-400 font-extrabold animate-pulse">● Active</span>
        </div>
      </footer>

    </main>
  );
}
