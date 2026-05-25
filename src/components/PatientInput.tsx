import { ChangeEvent } from "react";
import { Scale, Activity } from "lucide-react";

interface PatientInputProps {
  weightKg: number;
  setWeightKg: (weight: number) => void;
}

export default function PatientInput({
  weightKg,
  setWeightKg,
}: PatientInputProps) {
  
  const handleWeightChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      setWeightKg(Math.max(0.1, Math.min(val, 300))); // Cap weight realistically between 0.1 and 300 kg
    } else {
      setWeightKg(0);
    }
  };

  const handleWeightSlider = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setWeightKg(val);
  };

  const setPreset = (weight: number) => {
    setWeightKg(weight);
  };

  const weightLb = (weightKg * 2.20462).toFixed(1);

  return (
    <div id="patient-input-section" className="bg-white dark:bg-brand-card border border-slate-200 dark:border-brand-border rounded-2xl p-6 shadow-md max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6 justify-center">
        <div className="p-3 bg-indigo-50 dark:bg-brand-item/65 dark:border dark:border-brand-border rounded-full text-indigo-600 dark:text-indigo-400">
          <Scale size={24} />
        </div>
        <div className="text-center md:text-left">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-[#E2E8F0]">Patient Demographics</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure weight parameters to calibrate safe local anesthetic dosing</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Patient Weight in kg */}
        <div className="space-y-3">
          <div className="flex justify-between items-baseline">
            <label htmlFor="patient-weight" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>Patient Weight</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">*</span>
            </label>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-brand-item dark:text-indigo-400 border dark:border-brand-border-light px-2.5 py-1 rounded-xl">
              ≈ {weightLb} lbs
            </span>
          </div>

          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <input
                type="number"
                id="patient-weight"
                placeholder="Weight"
                step="0.1"
                min="0.1"
                max="300"
                className="pr-12 pl-4 py-3 w-full rounded-xl border border-slate-300 dark:border-brand-border-light bg-slate-50 dark:bg-brand-item text-slate-800 dark:text-[#E2E8F0] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-base font-extrabold tracking-tight transition-all"
                value={weightKg || ""}
                onChange={handleWeightChange}
              />
              <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs font-extrabold text-slate-400 pointer-events-none">
                kg
              </span>
            </div>
          </div>
          
          {/* Slider input */}
          <div className="pt-2">
            <input
              type="range"
              min="1"
              max="150"
              step="0.5"
              className="w-full accent-indigo-600 cursor-pointer"
              value={weightKg || 70}
              onChange={handleWeightSlider}
            />
          </div>
        </div>

        {/* Direct Weight Presets */}
        <div className="pt-5 border-t border-slate-100 dark:border-brand-border">
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest block mb-3">
            Quick Weight Presets
          </span>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            {[
              { label: "Infant (5kg)", weight: 5 },
              { label: "Child (20kg)", weight: 20 },
              { label: "Pediatric (40kg)", weight: 40 },
              { label: "Small Adult (55kg)", weight: 55 },
              { label: "Standard Adult (70kg)", weight: 70 },
              { label: "Large Adult (90kg)", weight: 90 },
              { label: "Adult (100kg)", weight: 100 },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                id={`preset-${preset.weight}`}
                onClick={() => setPreset(preset.weight)}
                className={`text-xs px-3 py-2 rounded-xl border transition-all cursor-pointer font-medium ${
                  weightKg === preset.weight
                    ? "bg-indigo-600 border-indigo-600 text-white font-bold shadow-md shadow-indigo-150/20"
                    : "bg-slate-50 hover:bg-slate-100 dark:bg-brand-item hover:dark:bg-[#252A33] border-slate-200 dark:border-brand-border text-slate-700 dark:text-slate-300"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
