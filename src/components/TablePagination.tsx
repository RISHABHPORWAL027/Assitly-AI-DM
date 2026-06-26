import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  PAGE_SIZE_OPTIONS,
  getPageRange,
  getTotalPages,
  type PageSizeOption,
} from '../lib/pagination';

interface TablePaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: PageSizeOption) => void;
  itemLabel?: string;
  className?: string;
  variant?: 'default' | 'reference';
}

export default function TablePagination({
  page,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  itemLabel = 'items',
  className = '',
  variant = 'default',
}: TablePaginationProps) {
  const totalPages = getTotalPages(totalCount, pageSize);
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const { start, end } = getPageRange(page, pageSize, totalCount);

  if (variant === 'reference') {
    return (
      <div
        className={`px-6 py-4 border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-container-low/50 ${className}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs text-outline">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value) as PageSizeOption)}
            className="bg-white border border-outline-variant rounded-lg text-xs py-1 px-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer outline-none"
            aria-label="Rows per page"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        <p className="text-xs font-medium text-on-surface-variant">
          {totalCount === 0
            ? `No ${itemLabel}`
            : `Showing ${end} of ${totalCount} ${itemLabel}`}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={!canPrev}
            className="p-2 rounded-lg border border-outline-variant text-outline hover:bg-surface-container-lowest disabled:opacity-50 transition-all"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={!canNext}
            className="p-2 rounded-lg border border-outline-variant text-outline hover:bg-surface-container-lowest transition-all disabled:opacity-50"
            aria-label="Next page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-slate-50/20 border-t border-slate-100 ${className}`}
    >
      <span className="text-xs text-slate-400 font-medium font-sans">
        {totalCount === 0
          ? `No ${itemLabel}`
          : `Showing ${start}–${end} of ${totalCount} ${itemLabel}`}
      </span>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-slate-500 font-sans font-medium">
          <span className="hidden sm:inline">Rows per page</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value) as PageSizeOption)}
            className="bg-white border border-slate-200 rounded-lg text-xs font-sans px-2.5 py-1.5 text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            aria-label="Rows per page"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <span className="text-[11px] font-sans font-semibold text-slate-500 tabular-nums">
          Page {page} of {totalPages}
        </span>

        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={!canPrev}
            className={`w-9 h-9 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 transition-colors ${
              canPrev
                ? 'hover:bg-slate-50 hover:text-slate-600 cursor-pointer'
                : 'opacity-40 cursor-not-allowed'
            }`}
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={!canNext}
            className={`w-9 h-9 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 transition-colors ${
              canNext
                ? 'hover:bg-slate-50 hover:text-slate-600 cursor-pointer'
                : 'opacity-40 cursor-not-allowed'
            }`}
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
