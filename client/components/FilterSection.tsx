import React from "react";
import { ChevronDown } from "lucide-react";

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  isCollapsed: boolean;
  onToggle: () => void;
}

export const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  children,
  isCollapsed,
  onToggle,
}) => {
  return (
    <div className="border-b border-gray-200 pb-3 mb-3">
      <button
        type="button"
        className="w-full flex items-center justify-between cursor-pointer py-2 hover:bg-gray-50 px-1 -mx-1 rounded"
        onClick={onToggle}
      >
        <h3 className="carzino-filter-title">{title}</h3>
        <ChevronDown
          className={`w-5 h-5 lg:w-5 lg:h-5 md:w-6 md:h-6 text-red-600 transition-transform mobile-chevron ${
            !isCollapsed ? "rotate-180" : ""
          }`}
        />
      </button>
      {!isCollapsed && <div className="mt-2">{children}</div>}
    </div>
  );
};
