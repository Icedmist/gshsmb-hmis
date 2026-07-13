import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-gradient-to-r from-transparent via-slate-50/30 to-transparent">
      <p className="text-xs text-slate-500 font-medium">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="btn btn-sm border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:pointer-events-none rounded-xl shadow-sm hover:shadow transition-all active:scale-95"
        >
          <ChevronLeft size={14} />
        </button>
        {pages.map((p, i) => (
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-slate-300 text-xs">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`min-w-[36px] h-9 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 ${
                p === page
                  ? 'bg-[#008751] text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent hover:border-slate-200'
              }`}
            >
              {p}
            </button>
          )
        ))}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="btn btn-sm border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:pointer-events-none rounded-xl shadow-sm hover:shadow transition-all active:scale-95"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
