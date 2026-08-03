import { useState, useEffect } from 'react';
import { Briefcase, Clock, AlertTriangle, CheckCircle, Calendar, Users, ArrowUpRight, BarChart3, ClipboardCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getHospitalScope } from '../lib/scope';
import { getLocumDashboardStats, getLocumAssignments, getLocumRequests } from '../lib/locums';
import { Link } from 'react-router-dom';
import AnimatedCounter from '../components/common/AnimatedCounter';
import { Sparkles, ChevronRight } from 'lucide-react';
import type { LocumAssignment, LocumRequest } from '../types';

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-white rounded-2xl p-8 border border-slate-200/60 shadow-sm">
        <div className="h-5 bg-gradient-to-r from-slate-100 to-slate-50 rounded w-48 mb-3" />
        <div className="h-4 bg-gradient-to-r from-slate-100 to-slate-50 rounded w-72" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
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
  const [stats, setStats] = useState({ activeAssignments: 0, pendingRequests: 0, upcomingExpiry: 0, completedAssignments: 0 });
  const [recentAssignments, setRecentAssignments] = useState<LocumAssignment[]>([]);
  const [recentRequests, setRecentRequests] = useState<LocumRequest[]>([]);
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
        const [s, assignRes, reqRes] = await Promise.all([
          getLocumDashboardStats(hospitalScope),
          getLocumAssignments(1, 10, undefined, hospitalScope),
          getLocumRequests(1, 5, undefined, hospitalScope),
        ]);
        setStats(s);
        setRecentAssignments(assignRes.data);
        setRecentRequests(reqRes.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [hospitalScope]);

  const canManage = hasRole('super_admin', 'executive_secretary', 'hospital_admin');

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-8 animate-fade-in pb-10">

      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-3xl p-8 lg:p-10 text-white shadow-2xl transition-transform duration-500 hover:scale-[1.01]"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #0f7490 60%, #0891b2 100%)' }}>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-cyan-500/25 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-sky-500/25 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4 mix-blend-screen pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0H0v40' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/svg%3E")` }}
        />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-4">
              <Sparkles size={14} className="text-cyan-300 animate-pulse" />
              <span className="text-xs font-bold tracking-wider text-cyan-100 uppercase">
                Locum & Temporary Staffing
              </span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3">
              Locum Administration Dashboard
            </h1>
            
            <p className="text-cyan-100/80 text-sm md:text-base max-w-xl font-semibold leading-relaxed">
              Manage temporary deployments, evaluate staff requests, and coordinate employee-initiated transfers across Gombe State facilities.
            </p>
          </div>
          
          <div className="flex items-center gap-4 px-5 py-3.5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg">
            <div className="p-2.5 bg-cyan-500/20 rounded-xl">
              <Calendar size={20} className="text-cyan-200" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xl font-extrabold text-white tabular-nums tracking-tight">
                {currentTime.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </span>
              <span className="text-[11px] font-bold text-cyan-200/80 uppercase tracking-wider">
                {currentTime.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modern KPI Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { title: 'Active Assignments', value: stats.activeAssignments, icon: Briefcase, color: 'text-cyan-600 bg-cyan-50 border-cyan-100', hoverColor: 'hover:border-cyan-300 hover:shadow-cyan-500/5', desc: 'Currently deployed' },
          { title: 'Pending Requests', value: stats.pendingRequests, icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-100', hoverColor: 'hover:border-amber-300 hover:shadow-amber-500/5', desc: 'Awaiting approvals' },
          { title: 'Upcoming Expiry', value: stats.upcomingExpiry, icon: AlertTriangle, color: 'text-rose-600 bg-rose-50 border-rose-100', hoverColor: 'hover:border-rose-300 hover:shadow-rose-500/5', desc: 'Ending in 7 days' },
          { title: 'Completed Deployments', value: stats.completedAssignments, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-100', hoverColor: 'hover:border-emerald-300 hover:shadow-emerald-500/5', desc: 'Archived history' },
        ].map((card, idx) => (
          <div
            key={idx}
            className={`group bg-white rounded-3xl p-6 border ${card.hoverColor} shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-2xl transition-all duration-500 hover:-translate-y-1.5 flex items-center gap-5 relative overflow-hidden`}
          >
            <div className="absolute right-0 top-0 w-24 h-24 bg-slate-50/50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 transition-colors duration-500" />
            <div className={`p-4 rounded-2xl border ${card.color} group-hover:scale-110 transition-transform duration-300 shrink-0`}>
              <card.icon size={22} strokeWidth={2.5} />
            </div>
            <div className="relative z-10 flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-500 mb-0.5 truncate uppercase tracking-wider">{card.title}</p>
              <AnimatedCounter value={card.value} className="text-3xl font-black text-slate-800 tracking-tight block" />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{card.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Recent Assignments Table */}
        <div className="lg:col-span-2 card">
          <div className="card-header bg-gradient-to-r from-slate-50/60 to-transparent py-5">
            <h3 className="font-extrabold text-slate-800 flex items-center gap-2.5">
              <div className="p-2 bg-cyan-100/50 text-cyan-600 rounded-lg">
                <Briefcase size={18} strokeWidth={2.5} />
              </div>
              Recent Deployments
            </h3>
            <Link to="/locum-assignments" className="text-xs text-cyan-600 hover:text-cyan-700 font-bold flex items-center gap-1.5 transition-colors bg-cyan-50/50 hover:bg-cyan-50 px-3 py-1.5 rounded-xl border border-cyan-100/60">
              View All <ArrowUpRight size={12} strokeWidth={2.5} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            {recentAssignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <div className="p-4 rounded-3xl bg-slate-50 mb-4">
                  <Briefcase size={36} className="text-slate-300" />
                </div>
                <p className="text-sm font-semibold">No assignments found</p>
                <p className="text-xs text-slate-400 mt-1">Deployments will appear here once finalized.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100/80">
                    <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee</th>
                    <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Origin</th>
                    <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Destination</th>
                    <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Duration</th>
                    <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60">
                  {recentAssignments.map((a, i) => (
                    <tr key={a.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-100 to-cyan-200 text-cyan-800 flex items-center justify-center font-black text-sm shadow-sm ring-2 ring-white">
                            {a.employee_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{a.employee_name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{a.department}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4.5 text-slate-600 font-semibold text-xs">{a.source_hospital_name}</td>
                      <td className="px-6 py-4.5 text-slate-600 font-semibold text-xs">{a.destination_hospital_name}</td>
                      <td className="px-6 py-4.5">
                        <span className="text-xs font-bold text-slate-700 block">{a.duration_days} Days</span>
                        <span className="text-[9px] text-slate-400 font-semibold tracking-wide uppercase mt-0.5 block">
                          {new Date(a.start_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })} → {new Date(a.end_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                        </span>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          a.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          a.status === 'completed' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                          'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${a.status === 'active' ? 'bg-emerald-500 animate-pulse' : a.status === 'completed' ? 'bg-slate-400' : 'bg-amber-500'}`} />
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Side: Quick Links + Recent Requests */}
        <div className="space-y-6">
          
          {/* Quick Actions Panel */}
          <div className="card">
            <div className="card-header bg-gradient-to-r from-slate-50/60 to-transparent py-5">
              <h3 className="font-extrabold text-slate-800 flex items-center gap-2.5">
                <div className="p-2 bg-cyan-100/50 text-cyan-600 rounded-lg">
                  <BarChart3 size={18} strokeWidth={2.5} />
                </div>
                Quick Actions
              </h3>
            </div>
            <div className="p-6 space-y-3.5">
              {canManage && (
                <Link to="/locum-requests" className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-gradient-to-br from-cyan-50 to-transparent border border-cyan-100/60 hover:border-cyan-300 hover:shadow-lg hover:shadow-cyan-500/5 transition-all group">
                  <div className="p-2.5 rounded-xl bg-white border border-cyan-100 text-cyan-600 group-hover:bg-cyan-500 group-hover:text-white transition-colors duration-300 shadow-sm shrink-0">
                    <Briefcase size={16} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold text-slate-800 group-hover:text-cyan-950 transition-colors">Locum Requests</p>
                    <p className="text-[10px] font-bold text-cyan-600 uppercase mt-0.5 tracking-wider">{stats.pendingRequests} Pending Review</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-cyan-600 group-hover:translate-x-0.5 transition-all" />
                </Link>
              )}
              
              <Link to="/locum-assignments" className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-gradient-to-br from-violet-50 to-transparent border border-violet-100/60 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-500/5 transition-all group">
                <div className="p-2.5 rounded-xl bg-white border border-violet-100 text-violet-600 group-hover:bg-violet-500 group-hover:text-white transition-colors duration-300 shadow-sm shrink-0">
                  <ClipboardCheck size={16} strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold text-slate-800 group-hover:text-violet-950 transition-colors">Active Assignments</p>
                  <p className="text-[10px] font-bold text-violet-600 uppercase mt-0.5 tracking-wider">{stats.activeAssignments} Active Deployments</p>
                </div>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </div>

          {/* Pending Locum Requests List */}
          <div className="card">
            <div className="card-header bg-gradient-to-r from-slate-50/60 to-transparent py-5">
              <h3 className="font-extrabold text-slate-800 flex items-center gap-2.5">
                <div className="p-2 bg-amber-100/50 text-amber-600 rounded-lg">
                  <Clock size={18} strokeWidth={2.5} />
                </div>
                Awaiting Approvals
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {recentRequests.filter(r => r.status !== 'approved' && r.status !== 'rejected' && r.status !== 'cancelled').length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-xs font-semibold">No pending requests</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">All staff requests have been processed.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentRequests
                    .filter(r => r.status !== 'approved' && r.status !== 'rejected' && r.status !== 'cancelled')
                    .slice(0, 4)
                    .map(r => (
                      <div key={r.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-slate-50 transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-extrabold text-slate-800 truncate">{r.employee_name}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 truncate">
                            {r.source_hospital_name.split(' ')[0]} → {r.destination_hospital_name.split(' ')[0]}
                          </p>
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ml-3 border shrink-0 ${
                          r.status === 'pending_hospital_admin' ? 'bg-cyan-50 text-cyan-700 border-cyan-100' :
                          r.status === 'pending_destination_admin' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {r.status === 'pending_hospital_admin' ? 'Origin' :
                           r.status === 'pending_destination_admin' ? 'Destination' : 'HQ Admin'}
                        </span>
                      </div>
                    ))}
                </div>
              )}
              {recentRequests.filter(r => r.status !== 'approved' && r.status !== 'rejected' && r.status !== 'cancelled').length > 0 && (
                <Link to="/locum-requests" className="block text-center text-xs text-cyan-600 hover:text-cyan-700 font-bold transition-all bg-slate-50 hover:bg-slate-100/80 py-2.5 rounded-xl border border-slate-100">
                  View All Requests
                </Link>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
