import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getDepartments,
} from "../services/employeeService";
import AttendanceHistoryModal from "../components/AttendanceHistoryModal";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  
  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  
  // Sorting states
  const [sortField, setSortField] = useState("employee_name");
  const [sortDirection, setSortDirection] = useState("asc"); // 'asc' | 'desc'
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // UI status messages
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // Modals state
  const [currentModal, setCurrentModal] = useState(null); // 'add' | 'edit' | 'view' | 'delete' | 'history' | null
  const [selectedEmp, setSelectedEmp] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    employee_name: "",
    email: "",
    mobile: "",
    department: "",
    designation: "",
    status: "Active",
  });

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateMobile = (mobile) => {
    return /^[0-9]{10,15}$/.test(mobile);
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await getEmployees();
      if (res.success) {
        setEmployees(res.data);
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to load employees.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await getDepartments();
      if (res.success) setDepartments(res.data);
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  const triggerSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const triggerError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 4000);
  };

  const resetForm = () => {
    setFormData({
      employee_name: "",
      email: "",
      mobile: "",
      department: "",
      designation: "",
      status: "Active",
    });
  };

  const openAddModal = () => {
    resetForm();
    setCurrentModal("add");
  };

  const openEditModal = (emp) => {
    setSelectedEmp(emp);
    setFormData({
      employee_name: emp.employee_name,
      email: emp.email,
      mobile: emp.mobile,
      department: emp.department,
      designation: emp.designation,
      status: emp.status,
    });
    setCurrentModal("edit");
  };

  const openViewModal = (emp) => {
    setSelectedEmp(emp);
    setCurrentModal("view");
  };

  const openDeleteModal = (emp) => {
    setSelectedEmp(emp);
    setCurrentModal("delete");
  };

  const openHistoryModal = (emp) => {
    setSelectedEmp(emp);
    setCurrentModal("history");
  };

  const closeModal = () => {
    setCurrentModal(null);
    setSelectedEmp(null);
    resetForm();
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!formData.employee_name.trim() || !formData.email.trim() || !formData.mobile.trim() || !formData.department.trim() || !formData.designation.trim()) {
      triggerError("Please fill in all required fields.");
      return;
    }
    if (!validateEmail(formData.email)) {
      triggerError("Please enter a valid email address.");
      return;
    }
    if (!validateMobile(formData.mobile)) {
      triggerError("Please enter a valid mobile number (10 to 15 digits).");
      return;
    }

    try {
      const res = await createEmployee(formData);
      if (res.success) {
        triggerSuccess("Employee created successfully!");
        fetchEmployees();
        closeModal();
      }
    } catch (err) {
      triggerError(err.message || "Failed to create employee.");
    }
  };

  const handleEditEmployee = async (e) => {
    e.preventDefault();
    if (!formData.employee_name.trim() || !formData.email.trim() || !formData.mobile.trim() || !formData.department.trim() || !formData.designation.trim()) {
      triggerError("Please fill in all required fields.");
      return;
    }
    if (!validateEmail(formData.email)) {
      triggerError("Please enter a valid email address.");
      return;
    }
    if (!validateMobile(formData.mobile)) {
      triggerError("Please enter a valid mobile number (10 to 15 digits).");
      return;
    }

    try {
      const res = await updateEmployee(selectedEmp.employee_id, formData);
      if (res.success) {
        triggerSuccess("Employee updated successfully!");
        fetchEmployees();
        closeModal();
      }
    } catch (err) {
      triggerError(err.message || "Failed to update employee.");
    }
  };

  const handleDeleteEmployee = async () => {
    try {
      const res = await deleteEmployee(selectedEmp.employee_id);
      if (res.success) {
        triggerSuccess("Employee deleted successfully!");
        fetchEmployees();
        closeModal();
      }
    } catch (err) {
      triggerError(err.message || "Failed to delete employee.");
    }
  };

  // Sorting handler
  const requestSort = (field) => {
    let direction = "asc";
    if (sortField === field && sortDirection === "asc") {
      direction = "desc";
    }
    setSortField(field);
    setSortDirection(direction);
  };

  // Search, Filter, Sort logic
  const filteredEmployees = employees
    .filter((emp) => {
      const matchesSearch =
        emp.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.designation.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    })
    .sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  // Unique departments for filter list — now sourced from API
  const uniqueDepts = ["All", ...departments];

  // Pagination logic
  const totalItems = filteredEmployees.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + pageSize);

  // Reset pagination page if filter/query yields fewer elements
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  return (
    <Layout>
      <div className="space-y-8 relative">
        {/* Banner Headers */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Employee Directory</h1>
            <p className="text-slate-400 mt-2 text-sm">Add, configure, sort, search, or export employee records.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-5 py-3 text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Employee
            </button>
          </div>
        </div>

        {/* Global Toast Alerts */}
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

        {/* Advanced Filters Panel */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Search Query</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search by name, email, or designation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 text-white placeholder-slate-600 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Directory Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading directory records...</div>
          ) : paginatedEmployees.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No employees match current criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-950/20 text-xs font-semibold text-slate-400 uppercase tracking-wider select-none">
                    <th className="px-6 py-4 cursor-pointer hover:text-white transition-all" onClick={() => requestSort("employee_id")}>
                      ID {sortField === "employee_id" && (sortDirection === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-white transition-all" onClick={() => requestSort("employee_name")}>
                      Name {sortField === "employee_name" && (sortDirection === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-white transition-all" onClick={() => requestSort("email")}>
                      Email {sortField === "email" && (sortDirection === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-white transition-all" onClick={() => requestSort("mobile")}>
                      Mobile {sortField === "mobile" && (sortDirection === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-white transition-all" onClick={() => requestSort("department")}>
                      Department {sortField === "department" && (sortDirection === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-white transition-all" onClick={() => requestSort("designation")}>
                      Designation {sortField === "designation" && (sortDirection === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-white transition-all" onClick={() => requestSort("status")}>
                      Status {sortField === "status" && (sortDirection === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm">
                  {paginatedEmployees.map((emp) => (
                    <tr key={emp.employee_id} className="hover:bg-slate-800/20 transition-all group">
                      <td className="px-6 py-4 text-slate-550 font-mono">#{emp.employee_id}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-white">{emp.employee_name}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-300 text-xs">{emp.email}</td>
                      <td className="px-6 py-4 text-slate-300 font-mono text-xs">{emp.mobile}</td>
                      <td className="px-6 py-4 text-slate-300">{emp.department}</td>
                      <td className="px-6 py-4 text-slate-300">{emp.designation}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-semibold ${
                            emp.status === "Active"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}
                        >
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2.5 opacity-80 group-hover:opacity-100 transition-all">
                          <button
                            onClick={() => openViewModal(emp)}
                            className="p-2 bg-slate-950/40 border border-slate-800 hover:border-indigo-500/50 hover:text-indigo-400 text-slate-400 rounded-lg transition-all"
                            title="View Info"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          <button
                            onClick={() => openHistoryModal(emp)}
                            className="p-2 bg-slate-950/40 border border-slate-800 hover:border-blue-500/50 hover:text-blue-400 text-slate-400 rounded-lg transition-all"
                            title="Attendance History"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>

                          <button
                            onClick={() => openEditModal(emp)}
                            className="p-2 bg-slate-950/40 border border-slate-800 hover:border-amber-500/50 hover:text-amber-400 text-slate-400 rounded-lg transition-all"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>

                          <button
                            onClick={() => openDeleteModal(emp)}
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

              {/* Pagination UI Controls */}
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
                  </select>
                  <span className="text-xs text-slate-500">
                    of {totalItems} filtered employees
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-2 text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-all"
                  >
                    «
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-all"
                  >
                    ‹
                  </button>
                  <span className="text-xs font-semibold text-indigo-400 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                    Page {currentPage} of {totalPages || 1}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-2 text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-all"
                  >
                    ›
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-2 text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-all"
                  >
                    »
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL: ADD / EDIT EMPLOYEE */}
        {(currentModal === "add" || currentModal === "edit") && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={closeModal}></div>
            
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden relative z-10 shadow-2xl">
              <div className="px-6 py-5 border-b border-slate-850 bg-slate-950/20 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">
                  {currentModal === "add" ? "Register Employee" : "Modify Profile"}
                </h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-white transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={currentModal === "add" ? handleAddEmployee : handleEditEmployee} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      name="employee_name"
                      value={formData.employee_name}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Rohit Varma"
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. name@company.com"
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Mobile Number *</label>
                    <input
                      type="text"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. 9876543220"
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Department *</label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Engineering"
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Designation *</label>
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Software Engineer"
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="Active" className="bg-slate-950">Active</option>
                      <option value="Inactive" className="bg-slate-950">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-5 py-2.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700/50 border border-slate-700/50 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition-all"
                  >
                    {currentModal === "add" ? "Create Employee" : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: VIEW EMPLOYEE DETAILS */}
        {currentModal === "view" && selectedEmp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={closeModal}></div>
            
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden relative z-10 shadow-2xl">
              <div className="px-6 py-5 border-b border-slate-850 bg-slate-950/20 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Employee Profile Details</h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-white transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-extrabold text-2xl uppercase shadow-inner">
                    {selectedEmp.employee_name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-lg font-extrabold text-white">{selectedEmp.employee_name}</h4>
                    <span className="text-xs text-slate-500 font-mono">ID: #{selectedEmp.employee_id}</span>
                  </div>
                </div>

                <div className="space-y-3.5 p-4 rounded-xl bg-slate-950/50 border border-slate-800/80">
                  <div className="grid grid-cols-2">
                    <span className="text-xs text-slate-500 uppercase tracking-wider">Email</span>
                    <span className="text-sm text-slate-200 break-all">{selectedEmp.email}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-xs text-slate-500 uppercase tracking-wider">Mobile</span>
                    <span className="text-sm text-slate-200 font-mono">{selectedEmp.mobile}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-xs text-slate-500 uppercase tracking-wider">Department</span>
                    <span className="text-sm text-slate-200">{selectedEmp.department}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-xs text-slate-500 uppercase tracking-wider">Designation</span>
                    <span className="text-sm text-slate-200">{selectedEmp.designation}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-xs text-slate-500 uppercase tracking-wider">Status</span>
                    <span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          selectedEmp.status === "Active"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {selectedEmp.status}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <button
                    onClick={closeModal}
                    className="px-5 py-2.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700/50 border border-slate-700/50 rounded-xl transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: DELETE CONFIRMATION */}
        {currentModal === "delete" && selectedEmp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={closeModal}></div>
            
            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden relative z-10 shadow-2xl">
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Delete Employee?</h3>
                  <p className="text-sm text-slate-400 mt-2">
                    Are you sure you want to remove <span className="font-semibold text-white">{selectedEmp.employee_name}</span>?
                  </p>
                  <p className="text-xs text-red-400 font-semibold mt-1">
                    This action is permanent and will delete all associated attendance history records.
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-850 bg-slate-950/20 flex items-center justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700/50 border border-slate-700/50 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteEmployee}
                  className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-lg transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: HISTORY */}
        {currentModal === "history" && selectedEmp && (
          <AttendanceHistoryModal employeeId={selectedEmp.employee_id} onClose={closeModal} />
        )}
      </div>
    </Layout>
  );
}
