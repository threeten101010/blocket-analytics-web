"use client";

import React, { useState } from "react";
import { Search, Sparkles, Cpu } from "lucide-react";

interface QueryInputProps {
  onSearch: (query: string, model: string) => void;
  isLoading: boolean;
}

export default function QueryInput({ onSearch, isLoading }: QueryInputProps) {
  const [query, setQuery] = useState("");
  const [model, setModel] = useState("gemini-2.5-flash");

  const suggestionChips = [
    { label: "🏍️ Volume by Brand", text: "Show the top 10 motorcycle brands by active listing volume" },
    { label: "💰 Avg Price by Style", text: "Compare the average price of each vehicle type class" },
    { label: "📈 KTM vs Yamaha", text: "Compare the average mileage and average price of KTM vs YAMAHA by year" },
    { label: "🗺️ Geographic Density", text: "Show the volume of listings in Stockholm, Göteborg, and Malmö" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.strip && !query.trim()) return;
    onSearch(query.trim(), model);
  };

  const handleSuggestionClick = (text: string) => {
    setQuery(text);
    onSearch(text, model);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="w-full relative flex flex-col sm:flex-row gap-3">
        {/* Sleek glowing backdrop for search bar */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-emerald-500/10 to-violet-500/10 rounded-xl blur-lg"></div>
        
        <div className="flex-1 relative flex items-center">
          <Search className="absolute left-4 text-slate-400 w-5 h-5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything about the Sweden motorcycle market... (e.g. Compare BMW vs Honda prices by year)"
            className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/60 transition-all font-sans text-sm md:text-base glass-panel"
            disabled={isLoading}
          />
        </div>

        {/* Model Chooser & Trigger Button */}
        <div className="flex gap-2 sm:self-stretch">
          <div className="flex items-center gap-1.5 px-3 py-2 sm:py-0 rounded-xl bg-white/5 border border-white/10 glass-panel">
            <Cpu className="text-slate-400 w-4 h-4" />
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="bg-transparent text-slate-200 border-none outline-none text-xs md:text-sm font-medium cursor-pointer focus:ring-0"
              disabled={isLoading}
            >
              <option value="gemini-2.5-flash" className="bg-[#0B0F19] text-white">Gemini 2.5 Flash</option>
              <option value="gemini-2.5-pro" className="bg-[#0B0F19] text-white">Gemini 2.5 Pro</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-[#090D16] font-semibold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(52,211,153,0.4)] transform hover:scale-[1.01]"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-[#090D16] border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Query</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Suggestion Chips */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider pl-1">Quick Insights:</span>
        <div className="flex flex-wrap gap-2">
          {suggestionChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSuggestionClick(chip.text)}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-lg bg-white/5 border border-white/5 hover:border-emerald-400/40 text-xs text-slate-300 hover:text-white transition-all glass-panel glass-panel-hover"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
