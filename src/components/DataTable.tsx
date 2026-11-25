import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  actions?: (item: T) => React.ReactNode;
  pageSize?: number;
  emptyMessage?: string;
  extraHeaderActions?: React.ReactNode;
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  searchPlaceholder = 'Search...',
  searchFilter,
  actions,
  pageSize = 10,
  emptyMessage = 'No records found.',
  extraHeaderActions,
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = searchFilter && query.trim()
    ? data.filter((item) => searchFilter(item, query.trim()))
    : data;

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  return (
    <div className="rounded-xl bg-[#061419]/80 backdrop-blur-xl border border-[#00F5B8]/20 shadow-[0_8px_32px_rgba(0,0,0,0.65)] overflow-hidden text-[#F0FDF9]">
      {/* Table toolbar */}
      <div className="p-4 border-b border-[#00F5B8]/15 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#040E12]/80">
        <div className="relative w-full sm:w-72 group">
          <Search className="w-4 h-4 text-[#5A7E88] group-focus-within:text-[#00F5B8] transition-colors duration-200 absolute left-3 top-2.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-[#00F5B8]/20 bg-[#051117]/85 text-[#F0FDF9] placeholder:text-[#5A7E88] hover:border-[#00F5B8]/40 hover:bg-[#071720] focus:outline-none focus:ring-2 focus:ring-[#00F5B8]/30 focus:border-[#00F5B8] focus:shadow-[0_0_14px_rgba(0,245,184,0.2)] transition-all duration-200"
          />
        </div>

        {extraHeaderActions && (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {extraHeaderActions}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#00F5B8]/15 bg-[#040E12]/90 text-[#9FB9C1] text-xs font-medium">
              {columns.map((col) => (
                <th key={col.key} className={`py-3 px-4 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
              {actions && <th className="py-3 px-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#00F5B8]/10 text-[#F0FDF9] text-xs">
            {paginatedData.length > 0 ? (
              paginatedData.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-[#00F5B8]/[0.05] transition-colors duration-150"
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`py-3 px-4 ${col.className || ''}`}>
                      {col.render ? col.render(item) : (item as any)[col.key]}
                    </td>
                  ))}
                  {actions && <td className="py-3 px-4 text-right">{actions(item)}</td>}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="py-12 text-center text-[#9FB9C1]"
                >
                  <Inbox className="w-8 h-8 mx-auto text-[#5A7E88] mb-2" />
                  <span>{emptyMessage}</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-3 border-t border-[#00F5B8]/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#9FB9C1] bg-[#040E12]/80">
          <div>
            Showing <span className="font-semibold text-[#F0FDF9]">{startIndex + 1}</span> to{' '}
            <span className="font-semibold text-[#F0FDF9]">{Math.min(startIndex + pageSize, filteredData.length)}</span> of{' '}
            <span className="font-semibold text-[#F0FDF9]">{filteredData.length}</span> results
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-[#00F5B8]/20 bg-[#061419] text-[#F0FDF9] hover:border-[#00F5B8]/50 hover:bg-[#00F5B8]/10 hover:text-[#00F5B8] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-[#00F5B8]/20 bg-[#061419] text-[#F0FDF9] hover:border-[#00F5B8]/50 hover:bg-[#00F5B8]/10 hover:text-[#00F5B8] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
