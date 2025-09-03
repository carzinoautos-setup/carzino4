import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalResults: number;
  resultsPerPage: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalResults,
  resultsPerPage,
  onPageChange,
}) => {
  // Defensive programming: Ensure all values are valid numbers
  const safeCurrentPage = Math.max(1, isNaN(currentPage) ? 1 : currentPage);
  const safeTotalPages = Math.max(1, isNaN(totalPages) ? 1 : totalPages);
  const safeTotalResults = Math.max(0, isNaN(totalResults) ? 0 : totalResults);
  const safeResultsPerPage = Math.max(1, isNaN(resultsPerPage) ? 20 : resultsPerPage);

  const startResult = (safeCurrentPage - 1) * safeResultsPerPage + 1;
  const endResult = Math.min(safeCurrentPage * safeResultsPerPage, safeTotalResults);

  const getPaginationPages = () => {
    const pages = [];
    const maxPagesToShow = typeof window !== 'undefined' && window.innerWidth < 640 ? 3 : 7; // Show fewer pages on mobile

    if (safeTotalPages <= maxPagesToShow) {
      for (let i = 1; i <= safeTotalPages; i++) {
        pages.push(i);
      }
    } else {
      if (typeof window !== 'undefined' && window.innerWidth < 640) {
        // Mobile: Show only current page and adjacent pages
        if (safeCurrentPage === 1) {
          pages.push(1, 2, "...", safeTotalPages);
        } else if (safeCurrentPage === safeTotalPages) {
          pages.push(1, "...", safeTotalPages - 1, safeTotalPages);
        } else {
          pages.push(safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1);
        }
      } else {
        // Desktop: Keep original logic
        if (safeCurrentPage <= 4) {
          pages.push(1, 2, 3, 4, 5, "...", safeTotalPages);
        } else if (safeCurrentPage >= safeTotalPages - 3) {
          pages.push(
            1,
            "...",
            safeTotalPages - 4,
            safeTotalPages - 3,
            safeTotalPages - 2,
            safeTotalPages - 1,
            safeTotalPages,
          );
        } else {
          pages.push(
            1,
            "...",
            safeCurrentPage - 1,
            safeCurrentPage,
            safeCurrentPage + 1,
            "...",
            safeTotalPages,
          );
        }
      }
    }
    return pages;
  };

  const paginationPages = getPaginationPages();

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-4 mt-4">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="text-sm text-gray-700 text-center">
          Showing <span className="font-medium">{startResult}</span> to{" "}
          <span className="font-medium">{endResult}</span> of{" "}
          <span className="font-medium">{safeTotalResults}</span> results
        </div>

        <div className="flex items-center justify-center gap-3 sm:gap-2 w-full">
          {/* Previous Button */}
          <button
            onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
            disabled={safeCurrentPage === 1}
            className="flex items-center justify-center min-w-[40px] h-10 px-3 sm:px-4 text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">Previous</span>
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-2 sm:gap-1">
            {paginationPages.map((page, index) => {
              if (page === "...") {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-2 py-2 text-gray-500 text-sm"
                  >
                    ...
                  </span>
                );
              }

              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page as number)}
                  className={`w-10 h-10 text-sm font-medium rounded-md flex items-center justify-center transition-colors ${
                    page === safeCurrentPage
                      ? "bg-red-600 text-white border border-red-600"
                      : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            onClick={() => onPageChange(Math.min(safeTotalPages, safeCurrentPage + 1))}
            disabled={safeCurrentPage === safeTotalPages}
            className="flex items-center justify-center min-w-[40px] h-10 px-3 sm:px-4 text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">Next</span>
          </button>
        </div>

      </div>
    </div>
  );
};
