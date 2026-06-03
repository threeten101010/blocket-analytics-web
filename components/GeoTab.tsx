"use client";

import React, { useEffect, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Map, Navigation, Compass, ShieldAlert, Award } from "lucide-react";

interface TierInsight {
  location_tier: string;
  volume: number;
  avg_days_on_market: number;
  avg_price_dev: number;
}

interface CityInsight {
  city: string;
  volume: number;
  avg_price_dev: number;
}

export default function GeoTab() {
  const [tiers, setTiers] = useState<TierInsight[]>([]);
  const [cities, setCities] = useState<CityInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadGeoInsights() {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:8000/api/geo-insights");
        if (!res.ok) throw new Error("Failed to load geo insights from API.");
        
        const data = await res.json();
        if (data.success) {
          setTiers(data.tiers || []);
          setCities(data.cities || []);
        }
      } catch (err: any) {
        setError(err.message || "FastAPI connection offline.");
      } finally {
        setLoading(false);
      }
    }
    loadGeoInsights();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-[400px] flex flex-col items-center justify-center gap-3 glass-panel rounded-2xl border border-white/5">
        <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs md:text-sm">Mapping coordinates and calculating metropolitan pricing indexes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-6 text-center glass-panel rounded-2xl border border-red-500/20 bg-red-500/5">
        <ShieldAlert className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-red-400 text-sm font-semibold mb-1">❌ Geo API Offline</p>
        <p className="text-slate-400 text-xs">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* CHART SECTION: Location Tiers (Col 1-7) */}
      <div className="lg:col-span-7 p-5 rounded-2xl glass-panel border border-white/5 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
          <Compass className="w-4 h-4 text-emerald-400" />
          <span className="text-xs md:text-sm font-semibold text-slate-200 uppercase tracking-wider">
            City Proximity & Pricing Index
          </span>
        </div>

        <p className="text-xs text-slate-400 font-sans leading-relaxed">
          How geographical density impacts listing prices. Major metropolitan areas command a double-digit price premium compared to regional/rural counterparts, while regional postings sell slightly faster due to local demand spikes.
        </p>

        {/* Dual Axis Bar/Line Chart */}
        <div className="w-full h-[300px] mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tiers} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="geoColorEmerald" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34D399" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.15}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="location_tier" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis yAxisId="left" orientation="left" stroke="#34D399" fontSize={11} tickLine={false} label={{ value: 'Price Premium (%)', angle: -90, position: 'insideLeft', fill: '#34D399', fontSize: 10, offset: 10 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#8B5CF6" fontSize={11} tickLine={false} label={{ value: 'Days to Sell', angle: 90, position: 'insideRight', fill: '#8B5CF6', fontSize: 10, offset: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: "#0B0F19", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }} />
              <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
              <Bar yAxisId="left" dataKey="avg_price_dev" name="Price Deviation (%)" fill="url(#geoColorEmerald)" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="avg_days_on_market" name="Avg Days on Market" fill="#8B5CF6" radius={[4, 4, 0, 0]} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* METRO LISTINGS LIST: Top Cities (Col 8-12) */}
      <div className="lg:col-span-5 p-5 rounded-2xl glass-panel border border-white/5 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
          <MapPin className="w-4 h-4 text-emerald-400" />
          <span className="text-xs md:text-sm font-semibold text-slate-200 uppercase tracking-wider">
            City Market Hotspots
          </span>
        </div>

        <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
          {cities.map((city, idx) => {
            const isExpensive = city.avg_price_dev > 5.0;
            return (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-all font-sans text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-500 text-[10px] w-4">{idx + 1}</span>
                  <span className="font-bold text-slate-200">{city.city}</span>
                  <span className="text-[10px] text-slate-400">({city.volume} ads)</span>
                </div>
                
                <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${isExpensive ? "text-rose-400 bg-rose-400/10" : "text-emerald-400 bg-emerald-400/10"}`}>
                  {city.avg_price_dev > 0 ? `+${city.avg_price_dev}%` : `${city.avg_price_dev}%`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
