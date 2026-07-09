import React, { useState, useEffect } from "react";
import { getEmployeeAttendanceHistory } from "../services/employeeService";

export default function AttendanceHistoryModal({ employeeId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        const res = await getEmployeeAttendanceHistory(employeeId);
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        setError(err.message || "Failed to load history.");
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [employeeId]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden relative z-10 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-slate-850 bg-slate-950/20 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold text-white">Attendance History</h3>
            {data && <p className="text-xs text-slate-400 mt-1">{data.employee.employee_name} ({data.employee.department})</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center text-slate-400 py-10">Loading attendance history...</div>
          ) : error ? (
            <div className="text-center text-red-400 py-10">{error}</div>
          ) : data ? (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-xl text-center">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Total</div>
                  <div className="text-xl text-white font-extrabold">{data.summary.total}</div>
                </div>
                <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-xl text-center">
                  <div className="text-[10px] text-emerald-500 uppercase font-bold">Present</div>
                  <div className="text-xl text-emerald-400 font-extrabold">{data.summary.present}</div>
                </div>
                <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-xl text-center">
                  <div className="text-[10px] text-amber-500 uppercase font-bold">Late</div>
                  <div className="text-xl text-amber-400 font-extrabold">{data.summary.late}</div>
                </div>
                <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-xl text-center">
                  <div className="text-[10px] text-orange-500 uppercase font-bold">Half Day</div>
                  <div className="text-xl text-orange-400 font-extrabold">{data.summary.half_day}</div>
                </div>
                <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-xl text-center">
                  <div className="text-[10px] text-red-500 uppercase font-bold">Absent</div>
                  <div className="text-xl text-red-400 font-extrabold">{data.summary.absent}</div>
                </div>
                <div className="bg-gradient-to-tr from-indigo-900/50 to-violet-900/30 border border-indigo-500/30 p-3 rounded-xl text-center">
                  <div className="text-[10px] text-indigo-300 uppercase font-bold">Att. %</div>
                  <div className="text-xl text-indigo-400 font-extrabold">{data.summary.attendance_percentage}%</div>
                </div>
              </div>

              {/* Records Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                {data.records.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">No attendance records found.</div>
                ) : (
                  <table className="w-full text-left">
                    <thead className="bg-slate-950/40 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">In Time</th>
                        <th className="px-4 py-3">Out Time</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                      {data.records.map((r) => (
                        <tr key={r.attendance_id} className="hover:bg-slate-800/20">
                          <td className="px-4 py-3">{r.attendance_date}</td>
                          <td className="px-4 py-3 font-mono">{r.check_in_time || "—"}</td>
                          <td className="px-4 py-3 font-mono">{r.check_out_time || "—"}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              r.attendance_status === "Present" ? "bg-emerald-500/10 text-emerald-400" :
                              r.attendance_status === "Absent" ? "bg-red-500/10 text-red-400" :
                              r.attendance_status === "Late" ? "bg-amber-500/10 text-amber-400" :
                              r.attendance_status === "Half Day" ? "bg-orange-500/10 text-orange-400" :
                              "bg-slate-700/50 text-slate-300"
                            }`}>
                              {r.attendance_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
