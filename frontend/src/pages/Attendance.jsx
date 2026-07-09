import React, { useState, useEffect, useCallback } from "react";
import Layout from "../components/Layout";
import { getEmployees, getDepartments } from "../services/employeeService";
import {
  getAttendance,
  markAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceReport,
} from "../services/attendanceService";

// ─── Sort Icon ────────────────────────────────────────────────────────────────
const SortIcon = ({ field, sortField, sortDir }) => {
  if (sortField !== field)
    return <span className="ml-1 opacity-30 text-[10px]">⇅</span>;
  return (
    <span className="ml-1 text-indigo-400 text-[10px]">
      {sortDir === "asc" ? "▲" : "▼"}
    </span>
  );
};

// ─── Status badge helper ───────────────────────────────────────────────────────
const statusBadge = (status) => {
  const map = {
    Present: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Late: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "Half Day": "bg-orange-500/10 text-orange-400 border-orange-500/20",
    "On Leave": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    Absent: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return `inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
    map[status] || "bg-slate-500/10 text-slate-400 border-slate-500/20"
  }`;
};

export default function Attendance() {
  const [logs, setLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [report, setReport] = useState({
    total_records: 0,
    status_counts: { Present: 0, Absent: 0, Late: 0, "Half Day": 0, "On Leave": 0 },
    attendance_percentage: 0,
  });

  const [loading, setLoading] = useState(true);
  const [employeesLoading, setEmployeesLoading] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    employee_id: "",
    date: "",
    status: "",
  });

  // Client-side sorting
  const [sortField, setSortField] = useState("attendance_date");
  const [sortDir, setSortDir] = useState("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // UI
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Modals
  const [currentModal, setCurrentModal] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Form
  const [formData, setFormData] = useState({
    employee_id: "",
    attendance_date: new Date().toISOString().split("T")[0],
    check_in_time: "09:00:00",
    check_out_time: "18:00:00",
    attendance_status: "Present",
  });

  // ── Loaders ────────────────────────────────────────────────────────────────
  const loadDepartments = async () => {
    try {
      const res = await getDepartments();
      if (res.success) setDepartments(res.data);
    } catch { /* silent */ }
  };

  const loadEmployeesList = async () => {
    setEmployeesLoading(true);
    try {
      const res = await getEmployees();
      if (res.success) setEmployees(res.data.filter((e) => e.status === "Active"));
    } catch (err) {
      console.error(err.message);
    } finally {
      setEmployeesLoading(false);
    }
  };

  const loadAttendanceData = useCallback(async () => {
    setLoading(true);
    try {
      const logsRes = await getAttendance(filters);
      const reportRes = await getAttendanceReport({ department: filters.department });
      if (logsRes.success) setLogs(logsRes.data);
      if (reportRes.success) setReport(reportRes.data);
    } catch (err) {
      setErrorMsg(err.message || "Failed to load attendance logs.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadAttendanceData(); }, [loadAttendanceData]);
  useEffect(() => { loadEmployeesList(); loadDepartments(); }, []);

  // Reset page on filter change
  useEffect(() => { setCurrentPage(1); }, [filters, pageSize]);

  // ── Notifications ──────────────────────────────────────────────────────────
  const triggerSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 4000); };
  const triggerError   = (msg) => { setErrorMsg(msg);   setTimeout(() => setErrorMsg(""), 4000); };

  // ── Form helpers ───────────────────────────────────────────────────────────
  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const resetForm = () =>
    setFormData({
      employee_id: "",
      attendance_date: new Date().toISOString().split("T")[0],
      check_in_time: "09:00:00",
      check_out_time: "18:00:00",
      attendance_status: "Present",
    });

  const openMarkModal = () => { resetForm(); setCurrentModal("mark"); };
  const openEditModal = (rec) => {
    setSelectedRecord(rec);
    setFormData({
      employee_id: rec.employee_id,
      attendance_date: rec.attendance_date,
      check_in_time: rec.check_in_time || "",
      check_out_time: rec.check_out_time || "",
      attendance_status: rec.attendance_status,
    });
    setCurrentModal("edit");
  };
  const openDeleteModal = (rec) => { setSelectedRecord(rec); setCurrentModal("delete"); };
  const closeModal = () => { setCurrentModal(null); setSelectedRecord(null); resetForm(); };

  // ── API Handlers ───────────────────────────────────────────────────────────
  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    if (!formData.employee_id || !formData.attendance_date || !formData.attendance_status) {
      triggerError("Please fill in all required fields."); return;
    }
    const todayStr = new Date().toISOString().split("T")[0];
    if (formData.attendance_date > todayStr) {
      triggerError("Cannot mark attendance for a future date."); return;
    }
    const payload = { ...formData };
    if (["Absent", "On Leave"].includes(formData.attendance_status)) {
      payload.check_in_time = ""; payload.check_out_time = "";
    }
    try {
      const res = await markAttendance(payload);
      if (res.success) { triggerSuccess("Attendance marked!"); loadAttendanceData(); closeModal(); }
    } catch (err) { triggerError(err.message || "Failed to mark attendance."); }
  };

  const handleEditAttendance = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (["Absent", "On Leave"].includes(formData.attendance_status)) {
        payload.check_in_time = ""; payload.check_out_time = "";
      }
      const res = await updateAttendance(selectedRecord.attendance_id, payload);
      if (res.success) { triggerSuccess("Attendance updated!"); loadAttendanceData(); closeModal(); }
    } catch (err) { triggerError(err.message || "Failed to update attendance."); }
  };

  const handleDeleteAttendance = async () => {
    try {
      const res = await deleteAttendance(selectedRecord.attendance_id);
      if (res.success) { triggerSuccess("Record deleted!"); loadAttendanceData(); closeModal(); }
    } catch (err) { triggerError(err.message || "Failed to delete record."); }
  };

  const handleFilterChange = (e) =>
    setFilters({ ...filters, [e.target.name]: e.target.value });

  const resetFilters = () =>
    setFilters({ search: "", employee_id: "", date: "", status: "" });

  // ── Sorting ────────────────────────────────────────────────────────────────
  const requestSort = (field) => {
    setSortDir(sortField === field && sortDir === "asc" ? "desc" : "asc");
    setSortField(field);
  };

  const sortedLogs = [...logs].sort((a, b) => {
    let aVal = a[sortField] ?? "";
    let bVal = b[sortField] ?? "";
    if (typeof aVal === "string") { aVal = aVal.toLowerCase(); bVal = bVal.toLowerCase(); }
    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalItems  = sortedLogs.length;
  const totalPages  = Math.ceil(totalItems / pageSize) || 1;
  const startIndex  = (currentPage - 1) * pageSize;
  const pageLogs    = sortedLogs.slice(startIndex, startIndex + pageSize);

  // ── Active filter count badge ─────────────────────────────────────────────
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <Layout>
      <div className="space-y-8 relative">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Attendance Logs</h1>
            <p className="text-slate-400 mt-1 text-sm">
              Search, filter, sort, export, or manage daily attendance records.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={openMarkModal}
              id="btn-mark-attendance"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-5 py-3 text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Mark Attendance
            </button>
          </div>
        </div>

        {/* ── Toast Notifications ────────────────────────────────────────── */}
        {successMsg && (
          <div className="fixed top-6 right-6 z-50 p-4 rounded-xl bg-emerald-500 text-white text-sm font-medium shadow-2xl flex items-center gap-3 animate-bounce">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="fixed top-6 right-6 z-50 p-4 rounded-xl bg-red-500 text-white text-sm font-medium shadow-2xl flex items-center gap-3 animate-bounce">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ── Stats Cards ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
          {[
            { label: "Present",  value: report.status_counts.Present,          color: "text-emerald-400" },
            { label: "Late",     value: report.status_counts.Late,             color: "text-amber-400"   },
            { label: "Half Day", value: report.status_counts["Half Day"],      color: "text-orange-400"  },
            { label: "Absent",   value: report.status_counts.Absent,           color: "text-red-400"     },
            { label: "On Leave", value: report.status_counts["On Leave"],      color: "text-indigo-300"  },
          ].map((s) => (
            <div key={s.label} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{s.label}</span>
              <p className={`text-2xl font-extrabold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Filters Panel ──────────────────────────────────────────────── */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              <span className="text-sm font-bold text-slate-300">Filters & Search</span>
              {activeFilterCount > 0 && (
                <span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {activeFilterCount} active
                </span>
              )}
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-xs text-slate-400 hover:text-white transition-all flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            {/* Search by name */}
            <div className="sm:col-span-2">
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
                  id="att-search"
                  placeholder="Search by employee name..."
                  value={filters.search}
                  onChange={handleFilterChange}
                  className="w-full bg-slate-950/50 border border-slate-800 text-white placeholder-slate-600 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date</label>
              <input
                type="date"
                name="date"
                id="att-filter-date"
                value={filters.date}
                onChange={handleFilterChange}
                className="w-full bg-slate-950/50 border border-slate-800 text-slate-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
              />
            </div>

            {/* Clear button */}
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="w-full bg-slate-800 hover:bg-slate-700/80 text-white rounded-xl py-2.5 text-xs font-semibold border border-slate-700/50 transition-all active:scale-[0.98]"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* ── Table ──────────────────────────────────────────────────────── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-slate-400 text-sm">Loading attendance records...</p>
            </div>
          ) : pageLogs.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-12 h-12 text-slate-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-slate-500 text-sm font-semibold">No attendance logs match your current filters.</p>
              {activeFilterCount > 0 && (
                <button onClick={resetFilters} className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 underline">Clear filters</button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-950/20 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
                    {[
                      { label: "Date",        field: "attendance_date" },
                      { label: "Emp ID",      field: "employee_id"     },
                      { label: "Employee Name",field: "employee_name"  },
                      { label: "Department",  field: "department"      },
                      { label: "Check-In",    field: "check_in_time"   },
                      { label: "Check-Out",   field: "check_out_time"  },
                      { label: "Status",      field: "attendance_status" },
                    ].map(({ label, field }) => (
                      <th
                        key={field}
                        className="px-6 py-4 cursor-pointer hover:text-white transition-all whitespace-nowrap"
                        onClick={() => requestSort(field)}
                      >
                        {label}
                        <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
                      </th>
                    ))}
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm">
                  {pageLogs.map((rec) => (
                    <tr key={rec.attendance_id} className="hover:bg-slate-800/20 transition-all group">
                      <td className="px-6 py-4 text-slate-300 font-mono text-xs whitespace-nowrap">
                        {rec.attendance_date}
                      </td>
                      <td className="px-6 py-4 font-mono text-[11px] text-indigo-300">
                        #{rec.employee_id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-white">{rec.employee_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold text-slate-300 bg-slate-800/60 px-2 py-1 rounded-lg border border-slate-700/50">
                          {rec.department}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-mono text-xs">{rec.check_in_time  || "—"}</td>
                      <td className="px-6 py-4 text-slate-400 font-mono text-xs">{rec.check_out_time || "—"}</td>
                      <td className="px-6 py-4">
                        <span className={statusBadge(rec.attendance_status)}>{rec.attendance_status}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-all">
                          <button
                            onClick={() => openEditModal(rec)}
                            className="p-2 bg-slate-950/40 border border-slate-800 hover:border-amber-500/50 hover:text-amber-400 text-slate-400 rounded-lg transition-all"
                            title="Edit Record"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => openDeleteModal(rec)}
                            className="p-2 bg-slate-950/40 border border-slate-800 hover:border-red-500/50 hover:text-red-400 text-slate-400 rounded-lg transition-all"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* ── Pagination ──────────────────────────────────────────── */}
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
                    of <span className="font-bold text-slate-300">{totalItems}</span> records
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
                  Showing {startIndex + 1}–{Math.min(startIndex + pageSize, totalItems)} of {totalItems}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── MODAL: MARK / EDIT ─────────────────────────────────────────── */}
        {(currentModal === "mark" || currentModal === "edit") && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={closeModal} />
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden relative z-10 shadow-2xl">
              <div className="px-6 py-5 border-b border-slate-800 bg-slate-950/20 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">
                  {currentModal === "mark" ? "Mark Daily Attendance" : "Modify Log Record"}
                </h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-white transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={currentModal === "mark" ? handleMarkAttendance : handleEditAttendance} className="p-6 space-y-4">
                {currentModal === "mark" ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Select Employee *</label>
                    <select
                      name="employee_id"
                      value={formData.employee_id}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="">Choose Employee</option>
                      {employeesLoading ? (
                        <option>Loading employees...</option>
                      ) : (
                        employees.map((emp) => (
                          <option key={emp.employee_id} value={emp.employee_id}>
                            {emp.employee_name} ({emp.department})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                ) : (
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Employee</span>
                    <p className="text-sm font-bold text-white">{selectedRecord?.employee_name}</p>
                    <span className="text-xs text-slate-500">{selectedRecord?.department}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Attendance Date *</label>
                  <input
                    type="date" name="attendance_date" value={formData.attendance_date}
                    onChange={handleInputChange} required disabled={currentModal === "edit"}
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Status *</label>
                  <select
                    name="attendance_status" value={formData.attendance_status}
                    onChange={handleInputChange} required
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Late">Late</option>
                    <option value="Half Day">Half Day</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>

                {!["Absent", "On Leave"].includes(formData.attendance_status) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Check-In</label>
                      <input type="text" name="check_in_time" value={formData.check_in_time}
                        onChange={handleInputChange} placeholder="HH:MM:SS"
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Check-Out</label>
                      <input type="text" name="check_out_time" value={formData.check_out_time}
                        onChange={handleInputChange} placeholder="HH:MM:SS"
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-end gap-3">
                  <button type="button" onClick={closeModal}
                    className="px-5 py-2.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 border border-slate-700/50 rounded-xl transition-all">
                    Cancel
                  </button>
                  <button type="submit"
                    className="px-5 py-2.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition-all">
                    {currentModal === "mark" ? "Submit Log" : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── MODAL: DELETE ──────────────────────────────────────────────── */}
        {currentModal === "delete" && selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={closeModal} />
            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden relative z-10 shadow-2xl">
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Delete Log Record?</h3>
                  <p className="text-sm text-slate-400 mt-2">
                    Remove attendance of <span className="font-semibold text-white">{selectedRecord.employee_name}</span> on{" "}
                    <span className="font-semibold text-white">{selectedRecord.attendance_date}</span>?
                  </p>
                  <p className="text-xs text-red-400 font-semibold mt-1">This operation is irreversible.</p>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/20 flex items-center justify-end gap-3">
                <button onClick={closeModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 border border-slate-700/50 rounded-xl transition-all">
                  Cancel
                </button>
                <button onClick={handleDeleteAttendance}
                  className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-lg transition-all">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
