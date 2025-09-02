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
  const startResult = (currentPage - 1) * resultsPerPage + 1;
  const endResult = Math.min(currentPage * resultsPerPage, totalResults);

  const getPaginationPages = () => {
    const pages = [];
    const maxPagesToShow = window.innerWidth < 640 ? 3 : 7; // Show fewer pages on mobile

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (window.innerWidth < 640) {
        // Mobile: Show only current page and adjacent pages
        if (currentPage === 1) {
          pages.push(1, 2, "...", totalPages);
        } else if (currentPage === totalPages) {
          pages.push(1, "...", totalPages - 1, totalPages);
        } else {
          pages.push(currentPage - 1, currentPage, currentPage + 1);
        }
      } else {
        // Desktop: Keep original logic
        if (currentPage <= 4) {
          pages.push(1, 2, 3, 4, 5, "...", totalPages);
        } else if (currentPage >= totalPages - 3) {
          pages.push(
            1,
            "...",
            totalPages - 4,
            totalPages - 3,
            totalPages - 2,
            totalPages - 1,
            totalPages,
          );
        } else {
          pages.push(
            1,
            "...",
            currentPage - 1,
            currentPage,
            currentPage + 1,
            "...",
            totalPages,
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
          <span className="font-medium">{totalResults}</span> results
        </div>

        <div className="flex items-center justify-center space-x-4 sm:space-x-2 w-full">
          {/* Previous Button */}
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="flex items-center justify-center w-10 h-10 text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed sm:px-4 sm:w-auto"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline sm:ml-1">Previous</span>
          </button>

          {/* Page Numbers */}
          <div className="flex items-center space-x-3 sm:space-x-1">
            {paginationPages.map((page, index) => {
              if (page === "...") {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-2 py-2 text-gray-500"
                  >
                    ...
                  </span>
                );
              }

              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page as number)}
                  className={`w-10 h-10 text-sm font-medium rounded-md flex items-center justify-center ${
                    page === currentPage
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
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center justify-center w-10 h-10 text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed sm:px-4 sm:w-auto"
          >
            <ChevronRight className="w-5 h-5" />
            <span className="hidden sm:inline sm:ml-1">Next</span>
          </button>
        </div>

        {/* Mobile-only "Go to" section */}
        <div className="sm:hidden mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-center gap-3">
            <span className="text-sm text-gray-600">Go to page:</span>
            <select
              value={currentPage}
              onChange={(e) => onPageChange(parseInt(e.target.value))}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:border-red-600"
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <option key={page} value={page}>
                    {page}
                  </option>
                ),
              )}
            </select>
            <span className="text-sm text-gray-500">of {totalPages}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
