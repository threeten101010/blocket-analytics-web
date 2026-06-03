"use client";

import React, { useEffect, useState } from "react";
import { Flame, Handshake, ExternalLink, Calendar, MapPin, DollarSign, Tag, TrendingDown } from "lucide-react";

interface Deal {
  brand: string | null;
  model: string | null;
  model_year: number;
  listed_price: number;
  fair_market_value: number;
  discount_pct: number;
  days_on_market: number;
  location: string;
  url: string;
  negotiability_score?: number;
}

export default function DealsTab() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [negotiable, setNegotiable] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters State
  const [brandFilter, setBrandFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [minDiscountFilter, setMinDiscountFilter] = useState(0);

  useEffect(() => {
    async function loadDeals() {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:8000/api/deals");
        if (!res.ok) throw new Error("Failed to load deals data from API.");
        
        const data = await res.json();
        if (data.success) {
          setDeals(data.deals || []);
          setNegotiable(data.negotiation_targets || []);
        }
      } catch (err: any) {
        setError(err.message || "Unable to establish connection with FastAPI backend.");
      } finally {
        setLoading(false);
      }
    }
    loadDeals();
  }, []);

  // Collect unique brands and locations for filter options
  const uniqueBrands = Array.from(new Set([
    ...deals.map(d => d.brand?.toUpperCase()),
    ...negotiable.map(n => n.brand?.toUpperCase())
  ].filter(Boolean))).sort() as string[];

  const uniqueLocations = Array.from(new Set([
    ...deals.map(d => d.location),
    ...negotiable.map(n => n.location)
  ].filter(Boolean))).sort() as string[];

  // Filter evaluation logic
  const filteredDeals = deals.filter(deal => {
    const brand = deal.brand?.toUpperCase() || "";
    const matchBrand = brandFilter === "All" || brand === brandFilter;
    const matchLocation = locationFilter === "All" || deal.location === locationFilter;
    const matchDiscount = Math.abs(deal.discount_pct) >= minDiscountFilter;
    return matchBrand && matchLocation && matchDiscount;
  });

  const filteredNegotiable = negotiable.filter(item => {
    const brand = item.brand?.toUpperCase() || "";
    const matchBrand = brandFilter === "All" || brand === brandFilter;
    const matchLocation = locationFilter === "All" || item.location === locationFilter;
    return matchBrand && matchLocation;
  });

  const getNegotiabilityColor = (score: number) => {
    if (score >= 70) return "text-emerald-400 border-emerald-400/30 bg-emerald-400/5";
    if (score >= 40) return "text-amber-400 border-amber-400/30 bg-amber-400/5";
    return "text-indigo-400 border-indigo-400/30 bg-indigo-400/5";
  };

  if (loading) {
    return (
      <div className="w-full h-[400px] flex flex-col items-center justify-center gap-3 glass-panel rounded-2xl border border-white/5">
        <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs md:text-sm">Calculating cohort medians and scanning database for bargains...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-6 text-center glass-panel rounded-2xl border border-red-500/20 bg-red-500/5">
        <p className="text-red-400 text-sm font-semibold mb-1">❌ API Error Encountered</p>
        <p className="text-slate-400 text-xs">{error}</p>
        <p className="text-slate-500 text-[10px] mt-4">Make sure the FastAPI server is running (`python3 main.py` on port 8000).</p>
      </div>
    );
  }

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Interactive Controls & Filters Bar */}
      <div className="col-span-1 lg:col-span-2 p-5 rounded-2xl glass-panel border border-white/5 flex flex-wrap items-center gap-6 text-xs md:text-sm shadow-xl">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-slate-300 uppercase tracking-wider text-[10px] md:text-xs">🔎 Filter Bargains</span>
        </div>
        
        {/* Brand Dropdown */}
        <div className="flex flex-col gap-1 min-w-[140px] flex-1 lg:flex-none">
          <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Brand</label>
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-200 focus:outline-none focus:border-emerald-400/60 font-sans"
          >
            <option value="All" className="bg-[#0B0F19]">All Brands</option>
            {uniqueBrands.map(b => (
              <option key={b} value={b} className="bg-[#0B0F19]">{b}</option>
            ))}
          </select>
        </div>

        {/* Location Dropdown */}
        <div className="flex flex-col gap-1 min-w-[160px] flex-1 lg:flex-none">
          <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Location</label>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-200 focus:outline-none focus:border-emerald-400/60 font-sans"
          >
            <option value="All" className="bg-[#0B0F19]">All Locations</option>
            {uniqueLocations.map(l => (
              <option key={l} value={l} className="bg-[#0B0F19]">{l}</option>
            ))}
          </select>
        </div>

        {/* Min Discount Dropdown */}
        <div className="flex flex-col gap-1 min-w-[130px] flex-1 lg:flex-none">
          <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Min Price-Drop</label>
          <select
            value={minDiscountFilter}
            onChange={(e) => setMinDiscountFilter(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-200 focus:outline-none focus:border-emerald-400/60 font-sans"
          >
            <option value="0" className="bg-[#0B0F19]">All Price Drops</option>
            <option value="15" className="bg-[#0B0F19]">15% or more</option>
            <option value="25" className="bg-[#0B0F19]">25% or more</option>
            <option value="35" className="bg-[#0B0F19]">35% or more</option>
          </select>
        </div>
      </div>
      
      {/* COLUMN A: Underpriced Bargains */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
          <div className="p-1.5 rounded bg-emerald-400/10 text-emerald-400">
            <Flame className="w-5 h-5 fill-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">🔥 Underpriced Value Deals</h3>
            <p className="text-[10px] text-slate-400 font-sans">Active newly posted ads priced 15% to 45% below their specific national cohort medians</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 max-h-[750px] overflow-y-auto pr-1">
          {filteredDeals.length > 0 ? (
            filteredDeals.map((deal, idx) => {
              const savings = deal.fair_market_value - deal.listed_price;
              return (
                <div key={idx} className="p-5 min-h-[125px] rounded-xl glass-panel glass-panel-hover flex justify-between items-start gap-4 relative overflow-hidden group">
                  {/* Subtle hover background highlight */}
                  <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-r from-transparent to-emerald-400/[0.02] -z-10 group-hover:to-emerald-400/[0.04] transition-all"></div>
                  
                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-200 truncate font-sans">
                        {deal.brand ? `${deal.brand} ${deal.model || ""}` : "Unknown Model"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] text-slate-400 font-sans">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-500" />{deal.model_year}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-500" />{deal.location}</span>
                      <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5 text-slate-500" />FMV: {deal.fair_market_value.toLocaleString()} kr</span>
                    </div>

                    <div className="text-[10px] text-emerald-400 font-medium font-sans mt-0.5">
                      💰 Savings: <span className="font-bold">{savings.toLocaleString()} kr</span> relative to national medians
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <span className="text-xs md:text-sm font-extrabold text-emerald-400 px-2 py-0.5 rounded bg-emerald-400/15 border border-emerald-400/20 font-mono shadow-[0_0_10px_rgba(52,211,153,0.1)]">
                      {deal.discount_pct}%
                    </span>
                    <a
                      href={deal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white underline font-sans"
                    >
                      <span>View Ad</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-500 glass-panel rounded-xl">
              No matching hot deals found. Try adjusting your filters.
            </div>
          )}
        </div>
      </div>

      {/* COLUMN B: Stale negotiation targets */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
          <div className="p-1.5 rounded bg-indigo-400/10 text-indigo-400">
            <Handshake className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">🤝 Highly Negotiable Postings</h3>
            <p className="text-[10px] text-slate-400 font-sans">Active ads sitting on the market significantly longer than similar ones, making sellers ready to discount</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 max-h-[750px] overflow-y-auto pr-1">
          {filteredNegotiable.length > 0 ? (
            filteredNegotiable.map((item, idx) => {
              const score = item.negotiability_score || 0;
              const isOverpriced = item.discount_pct > 0;
              
              return (
                <div key={idx} className="p-5 min-h-[125px] rounded-xl glass-panel glass-panel-hover flex justify-between items-start gap-4 relative overflow-hidden group">
                  <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-r from-transparent to-indigo-400/[0.01] -z-10 group-hover:to-indigo-400/[0.03] transition-all"></div>
                  
                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    <span className="font-extrabold text-sm text-slate-200 truncate font-sans">
                      {item.brand ? `${item.brand} ${item.model || ""}` : "Unknown Model"}
                    </span>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] text-slate-400 font-sans">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-500" />{item.model_year}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-500" />{item.location}</span>
                      <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5 text-slate-500" />Listed: {item.listed_price.toLocaleString()} kr</span>
                    </div>

                    <div className={`text-[10px] font-sans font-medium flex items-center gap-1 mt-0.5 ${isOverpriced ? "text-indigo-300" : "text-slate-400"}`}>
                      {isOverpriced ? (
                        <>📈 Markup: <span className="font-bold text-indigo-400">+{item.discount_pct}%</span> above FMV ({item.fair_market_value.toLocaleString()} kr)</>
                      ) : (
                        <>📉 Listed slightly below FMV ({item.fair_market_value.toLocaleString()} kr)</>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 shrink-0">
                    {/* Glowing Negotiability Index Pill */}
                    <div className={`px-2.5 py-1 rounded-lg border text-center flex flex-col font-mono text-[10px] md:text-xs font-extrabold ${getNegotiabilityColor(score)}`}>
                      <span className="text-[8px] font-sans font-semibold uppercase tracking-wider text-slate-400 block -mb-0.5">Negotiable</span>
                      <span>{score}/100</span>
                    </div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white underline font-sans"
                    >
                      <span>View Ad</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-500 glass-panel rounded-xl">
              No matching highly negotiable targets found. Try adjusting your filters.
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
