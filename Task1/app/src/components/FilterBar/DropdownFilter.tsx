import { useEffect, useRef, useState } from "react";

interface DropdownFilterProps {
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}

export function DropdownFilter({ value, options, onChange }: DropdownFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative min-w-[10rem]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-[2px] border border-[rgb(55,55,55)] bg-[#ebebed] px-3 py-2 text-sm font-medium text-[rgb(55,55,55)] transition hover:bg-gray-200 focus:border-[rgb(55,55,55)] focus:outline-none"
      >
        <span>{selectedLabel}</span>
        <svg
          className="h-4 w-4 text-[rgb(55,55,55)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul className="absolute left-0 z-50 mt-0 max-h-60 w-full overflow-auto rounded-b-[2px] border border-t-0 border-[rgb(55,55,55)] bg-[#ebebed] shadow-md">
          {options.map((opt) => (
            <li
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`cursor-pointer bg-[#ebebed] px-3 py-2 text-sm text-[rgb(55,55,55)] hover:bg-white ${
                opt.value === value ? "font-medium" : ""
              }`}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
