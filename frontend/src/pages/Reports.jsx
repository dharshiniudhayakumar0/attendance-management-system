import React, { useState, useEffect, useCallback } from "react";
import Layout from "../components/Layout";
import { getDepartments } from "../services/employeeService";
import { getAttendanceEmployeeSummary } from "../services/attendanceService";

// ─── Percentage colour helper ──────────────────────────────────────────────────
const pctColor = (pct) => {
  if (pct >= 90) return { bar: "bg-emerald-500", text: "text-emerald-400", badge: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" };
  if (pct >= 75) return { bar: "bg-amber-500",   text: "text-amber-400",   badge: "bg-amber-500/10   border-amber-500/20   text-amber-400"   };
  if (pct >= 50) return { bar: "bg-orange-500",  text: "text-orange-400",  badge: "bg-orange-500/10  border-orange-500/20  text-orange-400"  };
  return           { bar: "bg-red-500",    text: "text-red-400",    badge: "bg-red-500/10    border-red-500/20    text-red-400"    };
};

// ─── Sort Icon ─────────────────────────────────────────────────────────────────
const SortIcon = ({ field, sortField, sortDir }) => {
  if (sortField !== field) return <span className="ml-1 opacity-30 text-[10px]">⇅</span>;
  return <span className="ml-1 text-indigo-400 text-[10px]">{sortDir === "asc" ? "▲" : "▼"}</span>;
};

export default function Reports() {
  const [summary, setSummary]       = useState([]);
  const [loading, setLoading]       = useState(true);

  // Filters
  const [filters, setFilters] = useState({
    search: "",
  });

  // Sorting
  const [sortField, setSortField] = useState("attendance_percentage");
  const [sortDir, setSortDir]     = useState("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize]       = useState(10);

  // Notifications
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg]     = useState("");
  const triggerSuccess = (m) => { setSuccessMsg(m); setTimeout(() => setSuccessMsg(""), 4000); };
  const triggerError   = (m) => { setErrorMsg(m);   setTimeout(() => setErrorMsg(""), 4000); };

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAttendanceEmployeeSummary(filters);
      if (res.success) setSummary(res.data);
    } catch (err) {
      setErrorMsg(err.message || "Failed to load attendance summary.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadSummary(); }, [loadSummary]);
  useEffect(() => { setCurrentPage(1); }, [filters, pageSize]);

  const handleFilterChange = (e) =>
    setFilters({ ...filters, [e.target.name]: e.target.value });

  const resetFilters = () =>
    setFilters({ search: "" });

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  // ── Sorting ────────────────────────────────────────────────────────────────
  const requestSort = (field) => {
    setSortDir(sortField === field && sortDir === "asc" ? "desc" : "asc");
    setSortField(field);
  };

  const sorted = [...summary].sort((a, b) => {
    let aVal = a[sortField] ?? "";
    let bVal = b[sortField] ?? "";
    if (typeof aVal === "string") { aVal = aVal.toLowerCase(); bVal = bVal.toLowerCase(); }
    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalItems = sorted.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIdx   = (currentPage - 1) * pageSize;
  const paginated  = sorted.slice(startIdx, startIdx + pageSize);

  // ── CSV Export ─────────────────────────────────────────────────────────────
  const exportCSV = () => {
    if (sorted.length === 0) { triggerError("No records to export."); return; }
    const headers = [
      "Employee ID", "Name", "Department", "Designation", "Status",
      "Total Records", "Present", "Late", "Half Day", "Absent", "On Leave"
    ];
    const rows = sorted.map((e) => [
      e.employee_id,
      `"${e.employee_name}"`,
      `"${e.department}"`,
      `"${e.designation}"`,
      e.status,
      e.total_records,
      e.present,
      e.late,
      e.half_day,
      e.absent,
      e.on_leave,
    ]);
    const csv = "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `attendance_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerSuccess("Report exported!");
  };

  return (
    <Layout>
      <div className="space-y-8 relative">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Reports & Analytics</h1>
            <p className="text-slate-400 mt-1 text-sm">
              Per-employee attendance summaries.
            </p>
          </div>
          <button
            onClick={exportCSV}
            id="btn-export-report-csv"
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl px-4 py-3 text-sm font-semibold transition-all border border-slate-700/50 active:scale-[0.98]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>

        {/* ── Toast ──────────────────────────────────────────────────────── */}
        {successMsg && (
          <div className="fixed top-6 right-6 z-50 p-4 rounded-xl bg-emerald-500 text-white text-sm font-medium shadow-2xl flex items-center gap-3 animate-bounce">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="fixed top-6 right-6 z-50 p-4 rounded-xl bg-red-500 text-white text-sm font-medium shadow-2xl flex items-center gap-3 animate-bounce">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {errorMsg}
          </div>
        )}

        {/* ── Filters Panel ──────────────────────────────────────────────── */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              <span className="text-sm font-bold text-slate-300">Search</span>
              {activeFilterCount > 0 && (
                <span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {activeFilterCount} active
                </span>
              )}
            </div>
            {activeFilterCount > 0 && (
              <button onClick={resetFilters} className="text-xs text-slate-400 hover:text-white transition-all flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Search Employee</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  name="search"
                  id="report-search"
                  placeholder="Name or department..."
                  value={filters.search}
                  onChange={handleFilterChange}
                  className="w-full bg-slate-950/50 border border-slate-800 text-white placeholder-slate-600 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Table ──────────────────────────────────────────────────────── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-slate-400 text-sm">Loading attendance summaries...</p>
            </div>
          ) : paginated.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-12 h-12 text-slate-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-slate-500 text-sm font-semibold">No employees match the current filters.</p>
              {activeFilterCount > 0 && (
                <button onClick={resetFilters} className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 underline">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-950/20 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
                    {[
                      { label: "Employee",     field: "employee_name" },
                      { label: "Department",   field: "department"    },
                      { label: "Present",      field: "present"       },
                      { label: "Late",         field: "late"          },
                      { label: "Half Day",     field: "half_day"      },
                      { label: "Absent",       field: "absent"        },
                      { label: "On Leave",     field: "on_leave"      },
                    ].map(({ label, field }) => (
                      <th
                        key={field}
                        className="px-5 py-4 cursor-pointer hover:text-white transition-all whitespace-nowrap"
                        onClick={() => requestSort(field)}
                      >
                        {label}
                        <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm">
                  {paginated.map((emp) => {
                    return (
                      <tr key={emp.employee_id} className="hover:bg-slate-800/20 transition-all group">
                        {/* Employee */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-extrabold text-sm uppercase shrink-0">
                              {emp.employee_name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-white text-xs">{emp.employee_name}</p>
                              <p className="text-[10px] text-slate-500">{emp.designation}</p>
                            </div>
                          </div>
                        </td>
                        {/* Department */}
                        <td className="px-5 py-4">
                          <span className="text-xs font-semibold text-slate-300 bg-slate-800/60 px-2 py-1 rounded-lg border border-slate-700/50">
                            {emp.department}
                          </span>
                        </td>
                        {/* Counts */}
                        <td className="px-5 py-4 text-center font-bold text-emerald-400 text-xs">{emp.present}</td>
                        <td className="px-5 py-4 text-center font-bold text-amber-400  text-xs">{emp.late}</td>
                        <td className="px-5 py-4 text-center font-bold text-orange-400 text-xs">{emp.half_day}</td>
                        <td className="px-5 py-4 text-center font-bold text-red-400    text-xs">{emp.absent}</td>
                        <td className="px-5 py-4 text-center font-bold text-indigo-300 text-xs">{emp.on_leave}</td>
                        <td className="px-5 py-4 min-w-[160px]">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full transition-all duration-700 ${c.bar}`}
                                style={{ width: `${Math.min(emp.attendance_percentage, 100)}%` }}
                              />
                            </div>
                            <span className={`text-xs font-extrabold min-w-[42px] text-right ${c.text}`}>
                              {emp.attendance_percentage}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* ── Pagination ─────────────────────────────────────────── */}
              <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-950/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1 text-xs cursor-pointer focus:outline-none"
                  >
                    <option value={5}>5 entries</option>
                    <option value={10}>10 entries</option>
                    <option value={20}>20 entries</option>
                    <option value={50}>50 entries</option>
                  </select>
                  <span className="text-xs text-slate-500">
                    of <span className="font-bold text-slate-300">{totalItems}</span> employees
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}
                    className="px-2 py-1 text-xs text-slate-400 hover:text-white disabled:opacity-30 transition-all">«</button>
                  <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}
                    className="px-2 py-1 text-xs text-slate-400 hover:text-white disabled:opacity-30 transition-all">‹</button>
                  <span className="text-xs font-semibold text-indigo-400 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                    {currentPage} / {totalPages}
                  </span>
                  <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
                    className="px-2 py-1 text-xs text-slate-400 hover:text-white disabled:opacity-30 transition-all">›</button>
                  <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}
                    className="px-2 py-1 text-xs text-slate-400 hover:text-white disabled:opacity-30 transition-all">»</button>
                </div>

                <div className="text-xs text-slate-500">
                  Showing {startIdx + 1}–{Math.min(startIdx + pageSize, totalItems)} of {totalItems}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Legend ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span className="font-bold uppercase tracking-wider">Attendance legend:</span>
          {[
            { label: "Excellent (≥90%)", color: "bg-emerald-500" },
            { label: "Good (75–89%)",    color: "bg-amber-500"   },
            { label: "Fair (50–74%)",    color: "bg-orange-500"  },
            { label: "At Risk (<50%)",   color: "bg-red-500"     },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
              <span>{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
