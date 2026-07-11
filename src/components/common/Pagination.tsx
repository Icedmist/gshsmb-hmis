import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100">
      <p className="text-xs text-slate-500">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="btn btn-sm border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 rounded-lg"
        >
          <ChevronLeft size={14} /> Previous
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="btn btn-sm border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 rounded-lg"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
