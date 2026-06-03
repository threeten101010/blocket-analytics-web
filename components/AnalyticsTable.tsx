"use client";

import React, { useState, useMemo } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight, Search, Download } from "lucide-react";

interface TableProps {
  columns: string[];
  rows: any[];
}

export default function AnalyticsTable({ columns, rows }: TableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Handle column header clicks for sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  // 1. Search Filtering
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const term = searchTerm.toLowerCase().trim();
    return rows.filter((row) =>
      Object.values(row).some(
        (val) => val !== null && String(val).toLowerCase().includes(term)
      )
    );
  }, [rows, searchTerm]);

  // 2. Column Sorting
  const sortedRows = useMemo(() => {
    if (!sortColumn) return filteredRows;
    const sorted = [...filteredRows];
    sorted.sort((a, b) => {
      let valA = a[sortColumn];
      let valB = b[sortColumn];

      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      // Handle numbers
      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }
      
      // Fallback to strings
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortDirection === "asc" ? -1 : 1;
      if (strA > strB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredRows, sortColumn, sortDirection]);

  // 3. Pagination
  const totalPages = Math.ceil(sortedRows.length / rowsPerPage);
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [sortedRows, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Export to CSV helper
  const exportToCSV = () => {
    if (!rows.length) return;
    const headers = columns.join(",");
    const csvRows = rows.map((row) =>
      columns
        .map((col) => {
          const val = row[col];
          return typeof val === "string" ? `"${val.replace(/"/g, '""')}"` : val;
        })
        .join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...csvRows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "blocket_analytics_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cleanColumnName = (col: string) => {
    return col
      .replace(/_/g, " ")
      .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
  };

  return (
    <div className="w-full p-5 rounded-2xl glass-panel flex flex-col gap-4 border border-white/5 shadow-2xl">
      
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs md:text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Raw Query Dataset ({filteredRows.length} Rows)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Search */}
          <div className="relative flex items-center">
            <Search className="absolute left-3 text-slate-400 w-3.5 h-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search table..."
              className="pl-9 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-400/40 focus:ring-1 focus:ring-emerald-400/40 w-[180px] sm:w-[220px]"
            />
          </div>

          {/* CSV Export */}
          <button
            onClick={exportToCSV}
            disabled={rows.length === 0}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-emerald-400/30 hover:bg-emerald-400/5 transition-all text-xs text-slate-300 hover:text-white disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Frosted Glass Data Table */}
      <div className="w-full overflow-x-auto rounded-xl border border-white/10 shadow-inner bg-white/[0.01]">
        <table className="w-full text-left border-collapse text-xs md:text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              {columns.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="px-4 py-3.5 font-semibold text-slate-300 hover:text-white cursor-pointer select-none transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{cleanColumnName(col)}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.length > 0 ? (
              paginatedRows.map((row, idx) => (
                <tr
                  key={idx}
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  {columns.map((col) => {
                    const cellVal = row[col];
                    const isUrl = typeof cellVal === "string" && cellVal.startsWith("http");
                    
                    return (
                      <td key={col} className="px-4 py-3 text-slate-300 font-sans">
                        {isUrl ? (
                          <a
                            href={cellVal}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 underline font-medium hover:glow"
                          >
                            View Ad
                          </a>
                        ) : typeof cellVal === "number" ? (
                          // Format numbers cleanly
                          col.includes("price") || col.includes("sek") || col.includes("value") ? (
                            `${cellVal.toLocaleString()} kr`
                          ) : col.includes("mileage") || col.includes("km") ? (
                            `${cellVal.toLocaleString()} km`
                          ) : (
                            cellVal.toLocaleString()
                          )
                        ) : cellVal === null || cellVal === undefined ? (
                          <span className="text-slate-500 italic">null</span>
                        ) : (
                          String(cellVal)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400">
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-white/5 pt-3 text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-slate-200">{Math.min(filteredRows.length, (currentPage - 1) * rowsPerPage + 1)}</span> to{" "}
            <span className="font-semibold text-slate-200">{Math.min(filteredRows.length, currentPage * rowsPerPage)}</span> of{" "}
            <span className="font-semibold text-slate-200">{filteredRows.length}</span> rows
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded bg-white/5 border border-white/5 hover:border-white/10 disabled:opacity-40 disabled:hover:border-white/5 transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            
            <div className="px-3 py-1 bg-white/5 border border-white/10 rounded font-semibold text-slate-200">
              Page {currentPage} of {totalPages}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded bg-white/5 border border-white/5 hover:border-white/10 disabled:opacity-40 disabled:hover:border-white/5 transition-all"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
