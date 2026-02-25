"use client";

import {
  CredencePreset,
  CREDENCE_PRESET_VALUES,
} from "@/types/inference";

interface CredenceSliderProps {
  label: string;
  value: number | null | undefined;
  onChange?: (value: number | null) => void;
  readOnly?: boolean;
}

export default function CredenceSlider({
  label,
  value,
  onChange,
  readOnly = false,
}: CredenceSliderProps) {
  const displayValue = value != null ? value.toFixed(2) : "Not set";

  const activePreset = value != null
    ? (Object.entries(CREDENCE_PRESET_VALUES).find(
        ([, v]) => Math.abs(v - value) < 0.005
      )?.[0] as CredencePreset | undefined)
    : undefined;

  if (readOnly) {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          {label}
        </label>
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {displayValue}
        </span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {label}
        </label>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {displayValue}
        </span>
      </div>

      {value != null ? (
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={value}
          onChange={(e) => onChange?.(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-500"
        />
      ) : (
        <button
          onClick={() => onChange?.(0.5)}
          className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Set value
        </button>
      )}

      {value != null && (
        <>
          <div className="flex flex-wrap gap-1 mt-2">
            {Object.entries(CREDENCE_PRESET_VALUES).map(([preset, presetValue]) => (
              <button
                key={preset}
                onClick={() => onChange?.(presetValue)}
                className={`text-xs px-2 py-0.5 rounded-full border ${
                  activePreset === preset
                    ? "bg-blue-100 border-blue-300 dark:bg-blue-900 dark:border-blue-700"
                    : "border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
          <button
            onClick={() => onChange?.(null)}
            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mt-1"
          >
            Clear
          </button>
        </>
      )}
    </div>
  );
}
