import { useState, useEffect } from 'react';
import { Briefcase, Clock, AlertTriangle, CheckCircle, Calendar, Users, ArrowUpRight, BarChart3, ClipboardCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getHospitalScope } from '../lib/scope';
import { getLocumDashboardStats, getLocumAssignments, getLocumRequests, getStaffingRequests } from '../lib/locums';
import { Link } from 'react-router-dom';
import StatCard from '../components/common/StatCard';
import type { LocumAssignment, LocumRequest, StaffingRequest } from '../types';

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-white rounded-2xl p-8 border border-slate-200/60 shadow-sm">
        <div className="h-5 bg-gradient-to-r from-slate-100 to-slate-50 rounded w-48 mb-3" />
        <div className="h-4 bg-gradient-to-r from-slate-100 to-slate-50 rounded w-72" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="h-4 bg-gradient-to-r from-slate-100 to-slate-50 rounded w-24 mb-3" />
            <div className="h-8 bg-gradient-to-r from-slate-100 to-slate-50 rounded w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm h-72" />
        <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm h-72" />
      </div>
    </div>
  );
}

export default function LocumDashboardPage() {
  const { user, hasRole } = useAuth();
  const hospitalScope = getHospitalScope(user);
  const [stats, setStats] = useState({ activeAssignments: 0, pendingRequests: 0, openStaffingRequests: 0, upcomingExpiry: 0, completedAssignments: 0 });
  const [recentAssignments, setRecentAssignments] = useState<LocumAssignment[]>([]);
  const [recentRequests, setRecentRequests] = useState<LocumRequest[]>([]);
  const [openRequests, setOpenRequests] = useState<StaffingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [s, assignRes, reqRes, staffRes] = await Promise.all([
          getLocumDashboardStats(hospitalScope),
          getLocumAssignments(1, 10, undefined, hospitalScope),
          getLocumRequests(1, 5, undefined, hospitalScope),
          getStaffingRequests(1, 5, undefined, hospitalScope),
        ]);
        setStats(s);
        setRecentAssignments(assignRes.data);
        setRecentRequests(reqRes.data);
        setOpenRequests(staffRes.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [hospitalScope]);

  const canManage = hasRole('super_admin', 'executive_secretary', 'hospital_admin');

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl p-6 lg:p-8 text-white shadow-lg"
        style={{ background: 'linear-gradient(135deg, #083344 0%, #155e75 40%, #0e7490 70%, #0891b2 100%)' }}>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-cyan-400/10 blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0H0v40' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/svg%3E")` }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-cyan-200/80 text-sm mb-2">
            <Briefcase size={14} />
            <span>HR</span>
            <span className="text-cyan-500/50">/</span>
            <span className="text-white font-medium">Locum Management</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Locum & Temporary Staffing
          </h1>
          <p className="mt-1.5 text-cyan-100/60 text-sm max-w-xl">
            Manage temporary deployments, staffing requests, and employee-initiated locum assignments across hospitals
          </p>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 shadow-sm w-fit">
              <Calendar size={15} className="text-cyan-200/80" />
              <div className="flex flex-col items-start">
                <span className="text-sm text-cyan-50 font-medium tabular-nums tracking-wide">
                  {currentTime.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                </span>
                <span className="text-[10px] text-cyan-200/60 leading-tight">
                  {currentTime.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
            {canManage && (
              <div className="flex gap-2">
                <Link to="/locum-requests/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-sm font-medium transition-all">
                  <Briefcase size={15} /> New Locum Request
                </Link>
                <Link to="/staffing-requests/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-sm font-medium transition-all">
                  <Users size={15} /> Staffing Request
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Active Assignments" value={stats.activeAssignments} icon={Briefcase} color="primary" subtitle="Currently deployed" />
        <StatCard title="Pending Requests" value={stats.pendingRequests} icon={Clock} color="orange" subtitle="Awaiting approval" />
        <StatCard title="Open Staffing Requests" value={stats.openStaffingRequests} icon={Users} color="blue" subtitle="Needing staff" />
        <StatCard title="Upcoming Expiry" value={stats.upcomingExpiry} icon={AlertTriangle} color="army" subtitle="Ending in 7 days" />
        <StatCard title="Completed" value={stats.completedAssignments} icon={CheckCircle} color="teal" subtitle="Finished assignments" />
      </div>

      {/* Recent Assignments + Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Assignments Table */}
        <div className="lg:col-span-2 card border-t-2 border-t-cyan-400 shadow-sm hover:shadow-md transition-shadow">
          <div className="card-header bg-gradient-to-r from-cyan-50/50 to-transparent">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Briefcase size={16} className="text-cyan-600" />
              Recent Assignments
            </h3>
            <Link to="/locum-assignments" className="text-xs text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1 transition-colors">
              View All <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            {recentAssignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <div className="p-4 rounded-2xl bg-slate-50 mb-4">
                  <Briefcase size={40} className="text-slate-300" />
                </div>
                <p className="text-sm font-medium">No assignments yet.</p>
                <p className="text-xs text-slate-300 mt-1">Assignments will appear once approved.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">From</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">To</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Duration</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAssignments.map((a, i) => (
                    <tr key={a.id} className={`border-b border-slate-50 hover:bg-gradient-to-r hover:from-cyan-50/40 hover:to-transparent transition-all duration-200 ${i === recentAssignments.length - 1 ? 'border-b-0' : ''}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                            {a.employee_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{a.employee_name}</p>
                            <p className="text-[11px] text-slate-400">{a.department}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{a.source_hospital_name}</td>
                      <td className="px-5 py-4 text-slate-600">{a.destination_hospital_name}</td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-slate-700">{a.duration_days}d</span>
                        <span className="text-[10px] text-slate-400 ml-1 block">
                          {a.start_date?.toDate ? a.start_date.toDate().toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : '—'}
                          {' → '}
                          {a.end_date?.toDate ? a.end_date.toDate().toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : '—'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          a.status === 'active' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' :
                          a.status === 'completed' ? 'bg-slate-50 text-slate-600 ring-1 ring-slate-400/20' :
                          'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            a.status === 'active' ? 'bg-emerald-500' :
                            a.status === 'completed' ? 'bg-slate-400' : 'bg-amber-500'
                          }`} />
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {recentAssignments.length > 0 && (
            <div className="p-3 border-t border-slate-100 bg-slate-50/50">
              <Link to="/locum-assignments" className="text-xs text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1 transition-colors">
                View All Assignments <ArrowUpRight size={12} />
              </Link>
            </div>
          )}
        </div>

        {/* Quick Links + Recent Activity */}
        <div className="space-y-6">

          {/* Quick Links */}
          <div className="card border-t-2 border-t-cyan-400 shadow-sm hover:shadow-md transition-shadow">
            <div className="card-header bg-gradient-to-r from-cyan-50/50 to-transparent">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <BarChart3 size={16} className="text-cyan-600" />
                Quick Actions
              </h3>
            </div>
            <div className="p-5 space-y-2">
              {canManage && (
                <Link to="/locum-requests" className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-cyan-50 to-transparent border border-cyan-100 hover:border-cyan-200 hover:shadow-sm transition-all group">
                  <div className="p-2 rounded-lg bg-cyan-100 text-cyan-600 group-hover:scale-110 transition-transform">
                    <Briefcase size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-700">Locum Requests</p>
                    <p className="text-xs text-slate-400">{stats.pendingRequests} pending</p>
                  </div>
                  <ArrowUpRight size={14} className="text-slate-300 group-hover:text-cyan-500 transition-colors" />
                </Link>
              )}
              {canManage && (
                <Link to="/staffing-requests" className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-transparent border border-blue-100 hover:border-blue-200 hover:shadow-sm transition-all group">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform">
                    <Users size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-700">Staffing Requests</p>
                    <p className="text-xs text-slate-400">{stats.openStaffingRequests} open</p>
                  </div>
                  <ArrowUpRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                </Link>
              )}
              <Link to="/locum-assignments" className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-violet-50 to-transparent border border-violet-100 hover:border-violet-200 hover:shadow-sm transition-all group">
                <div className="p-2 rounded-lg bg-violet-100 text-violet-600 group-hover:scale-110 transition-transform">
                  <ClipboardCheck size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-700">View Assignments</p>
                  <p className="text-xs text-slate-400">{stats.activeAssignments} active</p>
                </div>
                <ArrowUpRight size={14} className="text-slate-300 group-hover:text-violet-500 transition-colors" />
              </Link>
              {hasRole('super_admin', 'executive_secretary') && (
                <Link to="/locum-history" className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-slate-50 to-transparent border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all group">
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-600 group-hover:scale-110 transition-transform">
                    <Clock size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-700">Completed History</p>
                    <p className="text-xs text-slate-400">{stats.completedAssignments} completed</p>
                  </div>
                  <ArrowUpRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                </Link>
              )}
            </div>
          </div>

          {/* Recent Requests */}
          <div className="card border-t-2 border-t-amber-400 shadow-sm hover:shadow-md transition-shadow">
            <div className="card-header bg-gradient-to-r from-amber-50/50 to-transparent">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Clock size={16} className="text-amber-600" />
                Pending Locum Requests
              </h3>
            </div>
            <div className="p-4 space-y-2">
              {recentRequests.filter(r => r.status !== 'approved' && r.status !== 'rejected' && r.status !== 'cancelled').length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No pending requests.</p>
              ) : (
                recentRequests
                  .filter(r => r.status !== 'approved' && r.status !== 'rejected' && r.status !== 'cancelled')
                  .slice(0, 5)
                  .map(r => (
                    <div key={r.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-700 truncate">{r.employee_name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{r.source_hospital_name} → {r.destination_hospital_name}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ml-2 ${
                        r.status === 'pending_hospital_admin' ? 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-600/20' :
                        r.status === 'pending_destination_admin' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20' :
                        'bg-slate-50 text-slate-600 ring-1 ring-slate-400/20'
                      }`}>
                        {r.status === 'pending_hospital_admin' ? 'Source Admin' :
                         r.status === 'pending_destination_admin' ? 'Dest. Admin' : r.status}
                      </span>
                    </div>
                  ))
              )}
              {recentRequests.filter(r => r.status !== 'approved' && r.status !== 'rejected' && r.status !== 'cancelled').length > 0 && (
                <Link to="/locum-requests" className="block text-center text-[11px] text-cyan-600 hover:text-cyan-700 font-medium pt-2 transition-colors">
                  View All Requests →
                </Link>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
