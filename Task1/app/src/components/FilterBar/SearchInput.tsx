import { useEffect, useRef, useState } from "react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchInput({ value, onChange }: SearchInputProps) {
  const [local, setLocal] = useState(value);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(local);
    }, 300);
    return () => clearTimeout(timer);
  }, [local, onChange]);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  return (
    <div className="relative">
      <div className="relative">
        <svg
          className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(55,55,55)] transition-all duration-200 ${focused ? "scale-0 opacity-0" : "scale-100 opacity-100"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search employee..."
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`w-full rounded-[2px] border border-[rgb(55,55,55)] bg-[#ebebed] py-2 pr-4 text-sm text-[rgb(55,55,55)] transition-all duration-200 placeholder:text-[rgb(55,55,55)] hover:bg-gray-200 focus:border-[rgb(55,55,55)] focus:bg-gray-50 focus:outline-none ${focused ? "pl-4" : "pl-10"}`}
        />
      </div>
    </div>
  );
}
