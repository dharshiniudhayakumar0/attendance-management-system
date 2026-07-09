import re

# 1. Clean Employees.jsx
with open('frontend/src/pages/Employees.jsx', 'r', encoding='utf-8') as f: text = f.read()
text = re.sub(r'  // CSV Export handler\n  const exportEmployeesToCSV = \(\) => \{[\s\S]*?triggerSuccess\("CSV exported successfully!"\);\n  };\n\n', '', text)
with open('frontend/src/pages/Employees.jsx', 'w', encoding='utf-8') as f: f.write(text)

# 2. Clean Attendance.jsx
with open('frontend/src/pages/Attendance.jsx', 'r', encoding='utf-8') as f: text = f.read()
text = re.sub(r'    department: "",\n', '', text)
text = re.sub(r'          <div className="bg-slate-900 border border-indigo-500/25 p-4 rounded-2xl text-center col-span-2 sm:col-span-1 bg-gradient-to-tr from-indigo-950/20 to-violet-950/20">\n            <span className="text-\[10px\] font-bold uppercase tracking-wider text-indigo-400">Attendance %</span>\n            <p className="text-2xl font-extrabold text-indigo-300 mt-1">\{report\.attendance_percentage\}%</p>\n          </div>\n', '', text)
text = re.sub(r'            <button\n              onClick=\{exportCSV\}\n              id="btn-export-attendance-csv"\n              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl px-4 py-3 text-sm font-semibold transition-all border border-slate-700/50 active:scale-\[0\.98\]"\n            >\n              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />\n              </svg>\n              Export CSV\n            </button>\n', '', text)
text = re.sub(r'            \{\/\* Department \*\/\}\n            <div>\n              <label className="block text-\[10px\] font-bold text-slate-400 uppercase tracking-wider mb-1\.5">Department</label>\n              <select\n                name="department"\n                id="att-filter-dept"\n                value=\{filters\.department\}\n                onChange=\{handleFilterChange\}\n                className="w-full bg-slate-950/50 border border-slate-800 text-slate-300 rounded-xl px-4 py-2\.5 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"\n              >\n                <option value="" className="bg-slate-950">All Departments</option>\n                \{departments\.map\(\(d\) => \(\n                  <option key=\{d\} value=\{d\} className="bg-slate-950">\{d\}</option>\n                \)\)\}\n              </select>\n            </div>\n\n', '', text)
text = re.sub(r'  // ── CSV Export ───[\s\S]*?triggerSuccess\("CSV exported successfully!"\);\n  };\n\n', '', text)
text = re.sub(r', department: "" ', ' ', text)
with open('frontend/src/pages/Attendance.jsx', 'w', encoding='utf-8') as f: f.write(text)

# 3. Clean Reports.jsx
with open('frontend/src/pages/Reports.jsx', 'r', encoding='utf-8') as f: text = f.read()
text = re.sub(r'    department: "",\n', '', text)
text = re.sub(r'            <button\n              onClick=\{exportReportCSV\}\n              className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl px-4 py-3 text-sm font-semibold transition-all border border-slate-700/50 active:scale-\[0\.98\]"\n            >\n              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />\n              </svg>\n              Export CSV\n            </button>\n', '', text)
text = re.sub(r'          \{\/\* Department \*\/\}\n          <div>\n            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Department</label>\n            <select\n              name="department"\n              value=\{filters\.department\}\n              onChange=\{handleFilterChange\}\n              className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-2\.5 text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"\n            >\n              <option value="">All Departments</option>\n              \{departments\.map\(\(d\) => \(\n                <option key=\{d\} value=\{d\}>\{d\}</option>\n              \)\)\}\n            </select>\n          </div>\n\n', '', text)
text = re.sub(r'                    <th className="px-6 py-4 cursor-pointer hover:text-white transition-all" onClick=\{\(\) => requestSort\("attendance_percentage"\)\}>\n                      Attendance %\n                      <SortIcon field="attendance_percentage" sortField=\{sortField\} sortDir=\{sortDir\} />\n                    </th>\n', '', text)
text = re.sub(r'                      <td className="px-6 py-4">\n                        <span className=\{(s\.attendance_percentage || 0\) >= 75 \? "text-emerald-400 font-bold" : "text-red-400 font-bold"\}>\n                          \{s\.attendance_percentage || 0\}%\n                        </span>\n                      </td>\n', '', text)
text = re.sub(r'  // CSV Export\n  const exportReportCSV = \(\) => \{[\s\S]*?triggerSuccess\("Report exported successfully!"\);\n  };\n\n', '', text)
with open('frontend/src/pages/Reports.jsx', 'w', encoding='utf-8') as f: f.write(text)

# 4. Clean AttendanceHistoryModal.jsx
with open('frontend/src/components/AttendanceHistoryModal.jsx', 'r', encoding='utf-8') as f: text = f.read()
text = re.sub(r'                <div className="bg-gradient-to-tr from-indigo-900/50 to-violet-900/30 border border-indigo-500/30 p-3 rounded-xl text-center">\n                  <div className="text-\[10px\] text-indigo-300 uppercase font-bold">Att\. %</div>\n                  <div className="text-xl text-indigo-400 font-extrabold">\{data\.summary\.attendance_percentage\}%</div>\n                </div>\n', '', text)
with open('frontend/src/components/AttendanceHistoryModal.jsx', 'w', encoding='utf-8') as f: f.write(text)

