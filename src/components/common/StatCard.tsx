import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color?: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  delay?: number;
}

function AnimatedValue({ value }: { value: number }) {
  const display = value;
  return <span>{display.toLocaleString()}</span>;
}

export default function StatCard({ title, value, icon: Icon, color = 'primary', subtitle, trend, trendValue, delay = 0 }: StatCardProps) {
  const variants: Record<string, {
    bg: string;
    text: string;
    iconBg: string;
    iconColor: string;
    border: string;
    glow: string;
  }> = {
    primary: {
      bg: 'bg-emerald-50/40',
      text: 'text-emerald-700',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      border: 'border-emerald-200/50',
      glow: 'group-hover:shadow-[0_4px_20px_rgba(0,135,81,0.08)] group-hover:border-emerald-300/50',
    },
    teal: {
      bg: 'bg-teal-50/40',
      text: 'text-teal-700',
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-600',
      border: 'border-teal-200/50',
      glow: 'group-hover:shadow-[0_4px_20px_rgba(13,148,136,0.08)] group-hover:border-teal-300/50',
    },
    blue: {
      bg: 'bg-blue-50/40',
      text: 'text-blue-700',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      border: 'border-blue-200/50',
      glow: 'group-hover:shadow-[0_4px_20px_rgba(59,130,246,0.08)] group-hover:border-blue-300/50',
    },
    purple: {
      bg: 'bg-purple-50/40',
      text: 'text-purple-700',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      border: 'border-purple-200/50',
      glow: 'group-hover:shadow-[0_4px_20px_rgba(139,92,246,0.08)] group-hover:border-purple-300/50',
    },
    orange: {
      bg: 'bg-orange-50/40',
      text: 'text-orange-700',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      border: 'border-orange-200/50',
      glow: 'group-hover:shadow-[0_4px_20px_rgba(249,115,22,0.08)] group-hover:border-orange-300/50',
    },
    army: {
      bg: 'bg-lime-50/40',
      text: 'text-lime-700',
      iconBg: 'bg-lime-100',
      iconColor: 'text-lime-600',
      border: 'border-lime-200/50',
      glow: 'group-hover:shadow-[0_4px_20px_rgba(101,163,13,0.08)] group-hover:border-lime-300/50',
    },
    lemon: {
      bg: 'bg-amber-50/40',
      text: 'text-amber-700',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      border: 'border-amber-200/50',
      glow: 'group-hover:shadow-[0_4px_20px_rgba(217,119,6,0.08)] group-hover:border-amber-300/50',
    },
    sage: {
      bg: 'bg-emerald-50/40',
      text: 'text-emerald-700',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      border: 'border-emerald-200/50',
      glow: 'group-hover:shadow-[0_4px_20px_rgba(0,135,81,0.08)] group-hover:border-emerald-300/50',
    },
    rose: {
      bg: 'bg-rose-50/40',
      text: 'text-rose-700',
      iconBg: 'bg-rose-100',
      iconColor: 'text-rose-600',
      border: 'border-rose-200/50',
      glow: 'group-hover:shadow-[0_4px_20px_rgba(244,63,94,0.08)] group-hover:border-rose-300/50',
    },
    indigo: {
      bg: 'bg-indigo-50/40',
      text: 'text-indigo-700',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      border: 'border-indigo-200/50',
      glow: 'group-hover:shadow-[0_4px_20px_rgba(99,102,241,0.08)] group-hover:border-indigo-300/50',
    },
  };

  const v = variants[color] || variants.primary;

  return (
    <div
      className={`rounded-xl border ${v.border} ${v.bg} p-4 hover:bg-white transition-all duration-300 group animate-slide-up ${v.glow}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${v.iconBg} ${v.iconColor} group-hover:scale-110 transition-all duration-300`}>
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-slate-500 tracking-wide">{title}</p>
          <div className="flex items-baseline gap-1.5">
            <p className={`text-2xl font-bold tracking-tight ${v.text} tabular-nums`}>
              <AnimatedValue value={value} />
            </p>
            {(trend || trendValue) && (
              <span className="flex items-center gap-0.5 text-xs font-medium">
                {trend === 'up' && <TrendingUp size={12} className="text-emerald-500" />}
                {trend === 'down' && <TrendingDown size={12} className="text-red-500" />}
                {trend === 'neutral' && <Minus size={12} className="text-amber-500" />}
                <span className={
                  trend === 'up' ? 'text-emerald-600' :
                  trend === 'down' ? 'text-red-600' :
                  'text-amber-600'
                }>{trendValue}</span>
              </span>
            )}
          </div>
          {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
