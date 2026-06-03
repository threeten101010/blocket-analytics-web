"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { TrendingUp, BarChart3, LineChart as LucideLineChart, PieChart as LucidePieChart } from "lucide-react";

interface ChartProps {
  rows: any[];
  visualization: {
    recommended_chart: string;
    x_axis_key: string;
    y_axis_key: string;
    series_key?: string | null;
  };
}

export default function AnalyticsChart({ rows, visualization }: ChartProps) {
  const { recommended_chart, x_axis_key, y_axis_key, series_key } = visualization;

  if (!rows || rows.length === 0) {
    return (
      <div className="h-[350px] flex flex-col items-center justify-center text-slate-400 glass-panel rounded-2xl">
        <p className="text-sm">No data available for visualization.</p>
      </div>
    );
  }

  // --- Real-time Data Pivot Engine for Multi-Series Visualizations ---
  // Transforms flat databases lists: [ { year: 2018, brand: 'Honda', price: 54000 }, ... ]
  // Into pivoted coordinates: [ { year: 2018, Honda: 54000, Yamaha: 57000 }, ... ]
  const uniqueSeriesNames = new Set<string>();
  let chartData: any[] = [];

  if (series_key && rows[0][series_key] !== undefined) {
    const pivoted: { [key: string]: any } = {};
    rows.forEach((row) => {
      const xVal = row[x_axis_key];
      const seriesVal = String(row[series_key]);
      const yVal = Number(row[y_axis_key]) || 0;

      uniqueSeriesNames.add(seriesVal);

      if (!pivoted[xVal]) {
        pivoted[xVal] = { [x_axis_key]: xVal };
      }
      pivoted[xVal][seriesVal] = yVal;
    });
    chartData = Object.values(pivoted);
  } else {
    chartData = rows.map((row) => ({
      ...row,
      [x_axis_key]: row[x_axis_key],
      [y_axis_key]: Number(row[y_axis_key]) || row[y_axis_key],
    }));
  }

  // Define curated glowing neon colors for multiple series/lines
  const colors = ["#34D399", "#8B5CF6", "#60A5FA", "#FB7185", "#FBBF24", "#A7F3D0"];
  const seriesArray = Array.from(uniqueSeriesNames);

  // Custom Glassmorphic Tooltip Renderer
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-[#0B0F19]/90 border border-white/10 rounded-lg shadow-xl backdrop-blur-md text-xs font-sans">
          <p className="font-semibold text-slate-200 mb-1.5">{`${x_axis_key}: ${label}`}</p>
          <div className="flex flex-col gap-1">
            {payload.map((p: any, idx: number) => (
              <p key={idx} style={{ color: p.color || p.fill }} className="font-medium">
                {`${p.name}: ${typeof p.value === 'number' ? p.value.toLocaleString() : p.value}`}
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Helper to render the specific chart
  const renderChart = () => {
    const chartType = recommended_chart.toLowerCase();

    switch (chartType) {
      case "line":
        return (
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey={x_axis_key} stroke="#64748B" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(v) => typeof v === 'number' ? v.toLocaleString() : v} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
            {seriesArray.length > 0
              ? seriesArray.map((name, i) => (
                  <Line key={name} type="monotone" dataKey={name} stroke={colors[i % colors.length]} strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 3 }} />
                ))
              : <Line type="monotone" dataKey={y_axis_key} name={y_axis_key} stroke="#34D399" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 3 }} />}
          </LineChart>
        );

      case "bar":
        return (
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorEmerald" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34D399" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorAmethyst" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey={x_axis_key} stroke="#64748B" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(v) => typeof v === 'number' ? v.toLocaleString() : v} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
            {seriesArray.length > 0
              ? seriesArray.map((name, i) => (
                  <Bar key={name} dataKey={name} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} />
                ))
              : <Bar dataKey={y_axis_key} name={y_axis_key} fill="url(#colorEmerald)" radius={[4, 4, 0, 0]} />}
          </BarChart>
        );

      case "area":
        return (
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34D399" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#34D399" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey={x_axis_key} stroke="#64748B" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(v) => typeof v === 'number' ? v.toLocaleString() : v} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
            {seriesArray.length > 0
              ? seriesArray.map((name, i) => (
                  <Area key={name} type="monotone" dataKey={name} fill={colors[i % colors.length]} stroke={colors[i % colors.length]} fillOpacity={0.15} />
                ))
              : <Area type="monotone" dataKey={y_axis_key} name={y_axis_key} stroke="#34D399" fill="url(#colorArea)" />}
          </AreaChart>
        );

      case "pie":
        return (
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
            <Pie
              data={chartData}
              dataKey={y_axis_key}
              nameKey={x_axis_key}
              cx="50%"
              cy="45%"
              outerRadius={100}
              innerRadius={50}
              paddingAngle={4}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={1}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
          </PieChart>
        );

      case "scatter":
        return (
          <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey={x_axis_key} type="number" name={x_axis_key} stroke="#64748B" fontSize={11} tickLine={false} />
            <YAxis dataKey={y_axis_key} type="number" name={y_axis_key} stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(v) => typeof v === 'number' ? v.toLocaleString() : v} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
            <Scatter name="Motorcycles" data={chartData} fill="#8B5CF6" />
          </ScatterChart>
        );

      default:
        return (
          <div className="h-full flex items-center justify-center text-slate-400">
            <p className="text-sm">Tabular format recommended for this query query results.</p>
          </div>
        );
    }
  };

  const getChartIcon = () => {
    switch (recommended_chart.toLowerCase()) {
      case "line": return <LucideLineChart className="w-4 h-4 text-emerald-400" />;
      case "bar": return <BarChart3 className="w-4 h-4 text-emerald-400" />;
      case "pie": return <LucidePieChart className="w-4 h-4 text-emerald-400" />;
      default: return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="w-full p-5 rounded-2xl glass-panel flex flex-col gap-4 border border-white/5">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          {getChartIcon()}
          <span className="text-xs md:text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Interactive Visualization ({recommended_chart.toUpperCase()})
          </span>
        </div>
        <div className="text-[10px] bg-emerald-400/10 text-emerald-400 px-2 py-0.5 rounded font-mono">
          Pivoted: {series_key ? "Yes" : "No"}
        </div>
      </div>
      <div className="w-full h-[320px] md:h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
