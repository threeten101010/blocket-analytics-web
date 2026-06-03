"use client";

import React, { useState, useEffect } from "react";
import { Calculator, ShieldAlert, BadgeInfo, Zap, BarChart, Sparkles, ExternalLink } from "lucide-react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceLine,
  Cell
} from "recharts";

export default function CalculatorTab() {
  const [formData, setFormData] = useState({
    brand: "Yamaha",
    vehicle_type: "Touring",
    year: 2021,
    mileage: 12000,
    cc: 700,
    model: "",
    location: "",
  });

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Result Filters State
  const [modelFilter, setModelFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");

  // Dynamic Options States (limited by brand and style)
  const [modelsList, setModelsList] = useState<string[]>([]);
  const [locationsList, setLocationsList] = useState<string[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  useEffect(() => {
    async function fetchCohortOptions() {
      try {
        setOptionsLoading(true);
        const res = await fetch(`http://localhost:8000/api/cohort-options?brand=${formData.brand}&vehicle_type=${encodeURIComponent(formData.vehicle_type)}`);
        if (!res.ok) throw new Error("Failed to load options");
        const data = await res.json();
        if (data.success) {
          setModelsList(data.models || []);
          setLocationsList(data.locations || []);
          setFormData(prev => ({
            ...prev,
            model: data.models?.includes(prev.model) ? prev.model : "",
            location: data.locations?.includes(prev.location) ? prev.location : "",
          }));
        }
      } catch (err) {
        console.error("Error loading brand-style dynamic options:", err);
      } finally {
        setOptionsLoading(false);
      }
    }
    fetchCohortOptions();
  }, [formData.brand, formData.vehicle_type]);

  const commonBrands = [
    "Yamaha", "Honda", "Ktm", "Kawasaki", "Suzuki", "Bmw", "Husqvarna", "Triumph", "Ducati", "Aprilia"
  ];

  const vehicleStyles = [
    "Touring", "Sport", "Custom", "Klassisk/naken", "Mc scooter", "Offroad/motard", "Adventure", "Cruiser", "Lätt mc", "Veteran"
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "year" || name === "mileage" || name === "cc" ? Number(value) || 0 : value,
    });
  };

  const handleAppraise = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("http://localhost:8000/api/appraise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to compile valuation from cohort medians.");
      
      const data = await res.json();
      if (data.success) {
        setResult(data);
        setModelFilter("All");
        setLocationFilter("All");
      } else {
        setError(data.error || "No cohort metrics available.");
      }
    } catch (err: any) {
      setError(err.message || "FastAPI connection offline.");
    } finally {
      setLoading(false);
    }
  };

  const CustomScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 bg-[#0B0F19]/95 border border-white/10 rounded-lg shadow-xl backdrop-blur-md text-xs font-sans max-w-[250px]">
          <p className="font-semibold text-slate-200 mb-1.5 line-clamp-2 text-wrap">{data.title}</p>
          <div className="flex flex-col gap-1 text-slate-400">
            <p className="font-semibold text-emerald-400">Price: {Number(data.price_sek).toLocaleString()} SEK</p>
            <p>Mileage: {Number(data.mileage_km).toLocaleString()} km</p>
            <p>Year: {data.model_year}</p>
            {data.model && <p>Model: {data.model}</p>}
            <p>Location: {data.location}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span>Status:</span>
              {data.is_active ? (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase shrink-0">Active</span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold tracking-wider bg-violet-500/10 text-violet-400 border border-violet-500/20 uppercase shrink-0">Sold</span>
              )}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Extract unique models and locations from the cohort listings
  const cohortListings = result?.listings || [];

  const uniqueModels = Array.from(new Set(
    cohortListings.map((item: any) => item.model?.trim()).filter(Boolean)
  )).sort() as string[];

  const uniqueLocations = Array.from(new Set(
    cohortListings.map((item: any) => item.location?.trim()).filter(Boolean)
  )).sort() as string[];

  const filteredListings = cohortListings.filter((item: any) => {
    const matchModel = modelFilter === "All" || item.model?.trim() === modelFilter;
    const matchLocation = locationFilter === "All" || item.location?.trim() === locationFilter;
    return matchModel && matchLocation;
  });

  const calculateMedianPrice = (listings: any[]) => {
    if (listings.length === 0) return 0;
    const prices = listings.map(l => Number(l.price_sek)).filter(p => !isNaN(p)).sort((a, b) => a - b);
    const mid = Math.floor(prices.length / 2);
    return prices.length % 2 !== 0 ? prices[mid] : Math.round((prices[mid - 1] + prices[mid]) / 2);
  };

  const filteredFMV = calculateMedianPrice(filteredListings);

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
      
      {/* FORM INTERFACE (Col 1-5) */}
      <form onSubmit={handleAppraise} className="md:col-span-5 p-5 rounded-2xl glass-panel flex flex-col gap-4 border border-white/5 shadow-2xl">
        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
          <Calculator className="w-4 h-4 text-emerald-400" />
          <span className="text-xs md:text-sm font-semibold text-slate-200 uppercase tracking-wider">Cohort Appraiser</span>
        </div>

        {/* Brand Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Brand</label>
          <select
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-xs md:text-sm text-slate-200 focus:outline-none focus:border-emerald-400/60"
          >
            {commonBrands.map((b) => (
              <option key={b} value={b} className="bg-[#0B0F19] text-white">{b.toUpperCase()}</option>
            ))}
          </select>
        </div>

        {/* Style Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Style Class</label>
          <select
            name="vehicle_type"
            value={formData.vehicle_type}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-xs md:text-sm text-slate-200 focus:outline-none focus:border-emerald-400/60"
          >
            {vehicleStyles.map((s) => (
              <option key={s} value={s} className="bg-[#0B0F19] text-white">{s}</option>
            ))}
          </select>
        </div>

        {/* Vintage Year */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Manufacture Year</label>
          <input
            type="number"
            name="year"
            min={1950}
            max={2027}
            value={formData.year}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-xs md:text-sm text-white focus:outline-none focus:border-emerald-400/60 font-sans"
            required
          />
        </div>

        {/* Mileage */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mileage (km)</label>
          <input
            type="number"
            name="mileage"
            min={0}
            value={formData.mileage}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-xs md:text-sm text-white focus:outline-none focus:border-emerald-400/60 font-sans"
            required
          />
        </div>

        {/* Displacement CC */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Engine Displacement (cc)</label>
          <input
            type="number"
            name="cc"
            min={1}
            value={formData.cc}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-xs md:text-sm text-white focus:outline-none focus:border-emerald-400/60 font-sans"
            required
          />
        </div>

        {/* Model (Optional) & Location (Optional) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Model (Optional)</label>
            <select
              name="model"
              value={formData.model}
              onChange={handleChange}
              disabled={optionsLoading}
              className="w-full px-3 py-2.5 rounded-lg bg-[#0B0F19]/60 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-emerald-400/60 font-sans"
            >
              <option value="" className="bg-[#0B0F19]">All Models</option>
              {modelsList.map(m => (
                <option key={m} value={m} className="bg-[#0B0F19]">{m}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Location (Optional)</label>
            <select
              name="location"
              value={formData.location}
              onChange={handleChange}
              disabled={optionsLoading}
              className="w-full px-3 py-2.5 rounded-lg bg-[#0B0F19]/60 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-emerald-400/60 font-sans"
            >
              <option value="" className="bg-[#0B0F19]">All Locations</option>
              {locationsList.map(l => (
                <option key={l} value={l} className="bg-[#0B0F19]">{l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Trigger Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-lg bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-[#090D16] font-bold text-xs md:text-sm transition-all duration-300 hover:shadow-[0_0_15px_rgba(52,211,153,0.3)] transform hover:scale-[1.01]"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-[#090D16] border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Calculate Appraisal</span>
            </>
          )}
        </button>
      </form>

      {/* VALUATION PANEL (Col 6-12) */}
      <div className="md:col-span-7 flex flex-col gap-4">
        {result ? (
          <div className="w-full p-6 rounded-2xl glass-panel border border-emerald-400/20 bg-emerald-400/[0.01] flex flex-col gap-5 shadow-2xl relative overflow-hidden">
            {/* Soft ambient glowing core in card background */}
            <div className="absolute right-[-100px] top-[-100px] w-[250px] h-[250px] rounded-full bg-emerald-400/10 blur-[60px] -z-10 animate-pulse"></div>

            {/* Appraisal Header */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider font-mono">Appraisal Complete</span>
              <h2 className="text-xl md:text-2xl font-extrabold text-slate-100 font-sans">
                {formData.brand.toUpperCase()} Valuation
              </h2>
            </div>

            {/* Price Metric */}
            <div className="flex flex-col gap-1 border-y border-white/5 py-4">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Estimated Fair Market Value</span>
              <div className="text-3xl md:text-4xl font-black text-emerald-400 font-sans tracking-tight">
                {result.fair_market_value.toLocaleString()} <span className="text-lg font-bold text-slate-300">SEK</span>
              </div>
            </div>

            {/* Metadata Stats */}
            <div className="grid grid-cols-2 gap-4 text-xs font-sans">
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider font-mono mb-1">Expected Days to Sell</span>
                <span className="font-extrabold text-slate-200 text-sm md:text-base flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-teal-400 fill-teal-400" />
                  {result.average_days_to_sell} days
                </span>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider font-mono mb-1">Cohort Sample Size</span>
                <span className="font-extrabold text-slate-200 text-sm md:text-base flex items-center gap-1.5">
                  <BarChart className="w-4 h-4 text-violet-400" />
                  {result.cohort_size} active/sold listings
                </span>
              </div>
            </div>

            {/* Hierarchy Resolution Info */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-[11px] md:text-xs text-slate-300 flex items-start gap-2.5">
              <BadgeInfo className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1 font-sans">
                <p>
                  Resolved using **{result.cohort_level}** matching against the database:
                </p>
                <code className="text-[10px] bg-[#0B0F19] text-violet-300 px-2 py-1 rounded select-all font-mono mt-1 w-full truncate block border border-white/5">
                  {result.cohort_key}
                </code>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="w-full p-6 text-center glass-panel rounded-2xl border border-red-500/20 bg-red-500/5">
            <ShieldAlert className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-400 text-sm font-semibold mb-1">Valuation Unsuccessful</p>
            <p className="text-slate-400 text-xs">{error}</p>
          </div>
        ) : (
          <div className="w-full h-full min-h-[300px] p-6 flex flex-col items-center justify-center gap-3 glass-panel rounded-2xl border border-white/5 text-center text-slate-400">
            <Calculator className="w-10 h-10 text-slate-500 opacity-60 animate-pulse" />
            <div className="flex flex-col gap-1 max-w-[280px]">
              <p className="text-sm font-semibold text-slate-300">Awaiting Specifications Input</p>
              <p className="text-[10px] text-slate-400 font-sans">Fill in the motorcycle specifications to calculate expected prices based on historical sale speeds and pricing curves.</p>
            </div>
          </div>
        )}
      </div>

      {result && result.listings && result.listings.length > 0 && (
        <div className="md:col-span-12 flex flex-col gap-6 mt-4 border-t border-white/5 pt-8">
          
          {/* Cohort Filter Controls & Dynamic Summary Bar */}
          <div className="p-5 rounded-2xl glass-panel border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-r from-transparent to-violet-500/[0.01] -z-10"></div>
            
            <div className="flex flex-wrap items-center gap-6 text-xs md:text-sm">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-300 uppercase tracking-wider text-[10px] md:text-xs">🎯 Cohort Refinement</span>
              </div>
              
              {/* Model Dropdown */}
              <div className="flex flex-col gap-1 min-w-[150px] flex-1 lg:flex-none">
                <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">Model Option</label>
                <select
                  value={modelFilter}
                  onChange={(e) => setModelFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-200 focus:outline-none focus:border-emerald-400/60 font-sans"
                >
                  <option value="All" className="bg-[#0B0F19]">All Models</option>
                  {uniqueModels.map(m => (
                    <option key={m} value={m} className="bg-[#0B0F19]">{m}</option>
                  ))}
                </select>
              </div>

              {/* Location Dropdown */}
              <div className="flex flex-col gap-1 min-w-[150px] flex-1 lg:flex-none">
                <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">Location Option</label>
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
            </div>

            {/* Filtered stats summary card */}
            <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6 text-xs font-sans">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">Filtered FMV</span>
                <span className="font-extrabold text-emerald-400 text-sm md:text-base">
                  {filteredFMV > 0 ? `${filteredFMV.toLocaleString()} SEK` : "—"}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">Filtered Sample</span>
                <span className="font-extrabold text-slate-200 text-sm md:text-base">
                  {filteredListings.length} of {cohortListings.length}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Scatter Chart (col-span-7) */}
            <div className="lg:col-span-7 p-5 rounded-2xl glass-panel border border-white/5 shadow-2xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <BarChart className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs md:text-sm font-semibold text-slate-200 uppercase tracking-wider font-sans">
                    Market Pricing Distribution (Mileage vs Price)
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Sample: {filteredListings.length} matches
                </span>
              </div>
              
              <div className="w-full h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis 
                      dataKey="mileage_km" 
                      type="number" 
                      name="Mileage" 
                      unit=" km" 
                      stroke="#64748B" 
                      fontSize={11} 
                      tickLine={false} 
                    />
                    <YAxis 
                      dataKey="price_sek" 
                      type="number" 
                      name="Price" 
                      unit=" kr" 
                      stroke="#64748B" 
                      fontSize={11} 
                      tickLine={false} 
                      tickFormatter={(v) => typeof v === 'number' ? v.toLocaleString() : v} 
                    />
                    <RechartsTooltip content={<CustomScatterTooltip />} />
                    <ReferenceLine 
                      y={result.fair_market_value} 
                      stroke="#34D399" 
                      strokeDasharray="5 5" 
                      label={{ value: 'FMV Reference', fill: '#34D399', fontSize: 10, position: 'top' }} 
                    />
                    {filteredFMV > 0 && filteredFMV !== result.fair_market_value && (
                      <ReferenceLine 
                        y={filteredFMV} 
                        stroke="#A78BFA" 
                        strokeDasharray="3 3" 
                        label={{ value: `Filtered FMV (${filteredFMV.toLocaleString()} kr)`, fill: '#A78BFA', fontSize: 9, position: 'insideBottomRight' }} 
                      />
                    )}
                    <Scatter name="Listings" data={filteredListings} fill="#8B5CF6">
                      {filteredListings.map((entry: any, index: number) => {
                        return (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.is_active ? "#10B981" : "#8B5CF6"} 
                            className="cursor-pointer hover:scale-125 transition-transform duration-200"
                          />
                        );
                      })}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* List/Grid of cohort listings (col-span-5) */}
            <div className="lg:col-span-5 p-5 rounded-2xl glass-panel border border-white/5 shadow-2xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="text-xs md:text-sm font-semibold text-slate-200 uppercase tracking-wider font-sans">
                  Raw Cohort Database Registry
                </span>
                <span className="text-[10px] text-slate-400 font-mono font-semibold text-emerald-400">
                  Live
                </span>
              </div>

              <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                {filteredListings.length > 0 ? (
                  filteredListings.map((item: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-all flex items-center justify-between gap-4 text-xs font-sans">
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-bold text-slate-200 truncate">{item.title}</span>
                          {item.is_active ? (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase shrink-0">Active</span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold tracking-wider bg-violet-500/10 text-violet-400 border border-violet-500/20 uppercase shrink-0">Sold</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                          <span>{item.model_year} yr</span>
                          <span>•</span>
                          <span>{Number(item.mileage_km).toLocaleString()} km</span>
                          <span>•</span>
                          <span>{item.location}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-extrabold text-emerald-400">{Number(item.price_sek).toLocaleString()} kr</span>
                        {item.url && (
                          <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="p-1.5 rounded bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500 glass-panel rounded-xl w-full">
                    No matching listings found for filters.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
