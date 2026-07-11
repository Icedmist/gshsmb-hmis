import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color?: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

function AnimatedValue({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let start = 0;
    const duration = 600;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.floor(eased * value);
      setDisplay(start);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <span ref={ref}>{display.toLocaleString()}</span>;
}

export default function StatCard({ title, value, icon: Icon, color = 'primary', subtitle, trend, trendValue }: StatCardProps) {
  const variants: Record<string, {
    bg: string;
    gradient: string;
    iconBg: string;
    ring: string;
    text: string;
  }> = {
    primary: {
      bg: 'bg-gradient-to-br from-emerald-50 to-green-50',
      gradient: 'from-[#008751] to-[#006838]',
      iconBg: 'bg-gradient-to-br from-[#008751] to-[#006838]',
      ring: 'ring-[#008751]/10',
      text: 'text-[#008751]',
    },
    teal: {
      bg: 'bg-gradient-to-br from-teal-50 to-emerald-50',
      gradient: 'from-teal-500 to-emerald-600',
      iconBg: 'bg-gradient-to-br from-teal-500 to-emerald-600',
      ring: 'ring-teal-500/10',
      text: 'text-teal-600',
    },
    blue: {
      bg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
      gradient: 'from-blue-500 to-indigo-600',
      iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      ring: 'ring-blue-500/10',
      text: 'text-blue-600',
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-50 to-violet-50',
      gradient: 'from-purple-500 to-violet-600',
      iconBg: 'bg-gradient-to-br from-purple-500 to-violet-600',
      ring: 'ring-purple-500/10',
      text: 'text-purple-600',
    },
    orange: {
      bg: 'bg-gradient-to-br from-orange-50 to-amber-50',
      gradient: 'from-orange-500 to-amber-600',
      iconBg: 'bg-gradient-to-br from-orange-500 to-amber-600',
      ring: 'ring-orange-500/10',
      text: 'text-orange-600',
    },
    army: {
      bg: 'bg-gradient-to-br from-army-50 to-sage-50',
      gradient: 'from-army-700 to-army-600',
      iconBg: 'bg-gradient-to-br from-army-700 to-army-600',
      ring: 'ring-army-700/10',
      text: 'text-army-700',
    },
    lemon: {
      bg: 'bg-gradient-to-br from-lemon-50 to-lime-50',
      gradient: 'from-lemon-500 to-lime-600',
      iconBg: 'bg-gradient-to-br from-lemon-500 to-lime-600',
      ring: 'ring-lemon-500/10',
      text: 'text-lemon-600',
    },
    sage: {
      bg: 'bg-gradient-to-br from-sage-50 to-army-50',
      gradient: 'from-sage-400 to-sage-500',
      iconBg: 'bg-gradient-to-br from-sage-400 to-sage-500',
      ring: 'ring-sage-400/10',
      text: 'text-sage-600',
    },
  };

  const v = variants[color] || variants.primary;

  return (
    <div className={`card p-5 hover:shadow-lg transition-all duration-300 group animate-slide-up ${v.bg}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-500 tracking-wide">{title}</p>
          <p className={`stat-value ${v.text} group-hover:scale-105 transition-transform origin-left`}>
            <AnimatedValue value={value} />
          </p>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className={`p-3.5 rounded-2xl shadow-sm ${v.iconBg} ${v.ring} ring-2`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        {(trend || trendValue) && (
          <div className="flex items-center gap-1.5 text-xs font-medium">
            {trend === 'up' && <TrendingUp size={14} className="text-emerald-500" />}
            {trend === 'down' && <TrendingDown size={14} className="text-red-500" />}
            {trend === 'neutral' && <span className="w-2 h-2 rounded-full bg-amber-500" />}
            <span className={
              trend === 'up' ? 'text-emerald-600' :
              trend === 'down' ? 'text-red-600' :
              'text-amber-600'
            }>{trendValue}</span>
          </div>
        )}
        <div className={`h-1 flex-1 ml-3 rounded-full bg-gradient-to-r ${v.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      </div>
    </div>
  );
}
