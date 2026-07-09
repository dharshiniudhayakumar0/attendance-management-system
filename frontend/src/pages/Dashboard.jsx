import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getDashboardStats } from "../services/dashboardService";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getDashboardStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      setError(err.message || "Failed to load dashboard metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Title Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">HR Analytics Dashboard</h1>
          <p className="text-slate-400 mt-2 text-sm">Monitor employee registry metrics and attendance performance trends.</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading analytic charts...</div>
        ) : stats ? (
          <>
            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-6">
              {/* Card 1 */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all shadow-lg">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Employees</span>
                <p className="text-3xl font-extrabold text-white mt-4">{stats.total_employees}</p>
                <div className="text-xs text-slate-400 mt-1">Personnel count</div>
              </div>

              {/* Card 2 */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all shadow-lg">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active</span>
                <p className="text-3xl font-extrabold text-indigo-400 mt-4">{stats.active_employees}</p>
                <div className="text-xs text-slate-400 mt-1">Status: Active</div>
              </div>

              {/* Card 3 */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all shadow-lg">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Present Today</span>
                <p className="text-3xl font-extrabold text-emerald-400 mt-4">{stats.present_today}</p>
                <div className="text-xs text-slate-400 mt-1">Clocked in today</div>
              </div>

              {/* Card 4 */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all shadow-lg">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Absent Today</span>
                <p className="text-3xl font-extrabold text-red-400 mt-4">{stats.absent_today}</p>
                <div className="text-xs text-slate-400 mt-1">Unexcused absence</div>
              </div>

              {/* Card 5 */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all shadow-lg bg-gradient-to-tr from-indigo-950/10 to-violet-950/10">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Attendance Rate</span>
                <p className="text-3xl font-extrabold text-indigo-300 mt-4">{stats.attendance_percentage_today}%</p>
                <div className="text-xs text-slate-400 mt-1">Daily rate</div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Trend Chart (Line/Area) */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl lg:col-span-2">
                <h3 className="text-lg font-bold text-white mb-6">Attendance Trends (Last 7 Days)</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.trend_data}>
                      <defs>
                        <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                          borderRadius: "12px",
                          color: "#fff"
                        }}
                      />
                      <Area type="monotone" dataKey="Present" stroke="#10b981" fillOpacity={1} fill="url(#colorPresent)" strokeWidth={2} />
                      <Area type="monotone" dataKey="Absent" stroke="#ef4444" fillOpacity={1} fill="url(#colorAbsent)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Department Allocation Chart (Pie) */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col">
                <h3 className="text-lg font-bold text-white mb-6">Department Distribution</h3>
                <div className="h-64 flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.department_data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.department_data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                          borderRadius: "12px",
                          color: "#fff"
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Custom Legend */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-400">
                  {stats.department_data.map((dept, index) => (
                    <div key={dept.name} className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></span>
                      <span className="truncate">{dept.name} ({dept.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Department Headcount Bar Chart */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
              <h3 className="text-lg font-bold text-white mb-6">Department Headcount</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.department_data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "12px",
                        color: "#fff"
                      }}
                    />
                    <Bar dataKey="value" name="Headcount" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : (
          <div className="p-12 text-center text-slate-500">No dashboard statistics available.</div>
        )}
      </div>
    </Layout>
  );
}
