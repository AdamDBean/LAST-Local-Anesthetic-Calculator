import { useState, useMemo, ChangeEvent } from "react";
import { Sparkles, AlertTriangle, ShieldCheck } from "lucide-react";
import { ANESTHETIC_DATABASE, getSafeMaxMg } from "../types";

interface WhatIfPlannerProps {
  weightKg: number;
  totalPercent: number; // Aggregate toxicity load, e.g. 64.5%
}

export default function WhatIfPlanner({ weightKg, totalPercent }: WhatIfPlannerProps) {
  const [plannedAgent, setPlannedAgent] = useState<string>("Bupivicaine");
  const [plannedConc, setPlannedConc] = useState<string>("0.5");

  // Sync concentration defaults when proposed agent changes
  const handleAgentChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const agent = e.target.value;
    setPlannedAgent(agent);
    const defaults = ANESTHETIC_DATABASE[agent]?.commonConcs || [];
    if (defaults.length > 0) {
      setPlannedConc(defaults[0].toString());
    }
  };

  const agentData = useMemo(() => {
    return ANESTHETIC_DATABASE[plannedAgent];
  }, [plannedAgent]);

  // Calculations
  const calculations = useMemo(() => {
    if (weightKg <= 0) {
      return {
        safeMaxMg: 0,
        remainingMg: 0,
        remainingMl: 0,
        remainingPercent: 0,
      };
    }

    const safeMaxMg = getSafeMaxMg(plannedAgent, weightKg);
    const remainingPercent = Math.max(0, 100 - totalPercent);
    const remainingMg = (remainingPercent / 100) * safeMaxMg;

    const concNum = parseFloat(plannedConc) || 0;
    const mgPerMl = concNum * 10;
    const remainingMl = mgPerMl > 0 ? remainingMg / mgPerMl : 0;

    return {
      safeMaxMg,
      remainingMg,
      remainingMl,
      remainingPercent,
    };
  }, [plannedAgent, plannedConc, weightKg, totalPercent]);

  return (
    <div id="what-if-planner" className="bg-white dark:bg-brand-card border border-slate-200 dark:border-brand-border rounded-3xl p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-5 border-b border-slate-100 dark:border-brand-border pb-3">
          <div className="p-2 bg-pink-500/10 text-pink-400 rounded-xl">
            <Sparkles size={18} />
          </div>
          <h2 className="text-sm font-black text-slate-900 dark:text-[#E2E8F0] uppercase tracking-wide">
            What do you want to give?
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          {/* Select Planned Agent */}
          <div className="space-y-1.55">
            <label htmlFor="plan-agent" className="block text-xs font-semibold text-slate-500 uppercase tracking-widest text-[10px]">
              Agent Name
            </label>
            <select
              id="plan-agent"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-brand-border-light bg-slate-50 dark:bg-brand-item text-slate-800 dark:text-[#E2E8F0] focus:ring-2 focus:ring-indigo-500 focus:shadow-sm outline-none transition-all"
              value={plannedAgent}
              onChange={handleAgentChange}
            >
              {Object.keys(ANESTHETIC_DATABASE).map((agentName) => (
                <option key={agentName} value={agentName}>
                  {agentName}
                </option>
              ))}
            </select>
          </div>

          {/* Planned Concentration */}
          <div className="space-y-1.5">
            <label htmlFor="plan-conc" className="block text-xs font-semibold text-slate-500 uppercase tracking-widest text-[10px] flex justify-between">
              <span>Proposed Conc.</span>
              <span className="text-slate-405 font-normal">%</span>
            </label>
            <div className="relative">
              <input
                type="number"
                id="plan-conc"
                step="0.01"
                min="0.01"
                max="100"
                className="pr-8 pl-3 py-2 w-full text-sm font-semibold rounded-xl border border-slate-300 dark:border-brand-border-light bg-slate-50 dark:bg-brand-item text-slate-800 dark:text-[#E2E8F0] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                value={plannedConc}
                onChange={(e) => setPlannedConc(e.target.value)}
              />
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-slate-400 pointer-events-none">
                %
              </span>
            </div>
          </div>
        </div>

        {/* Quick select concentration values for proposed agent */}
        {agentData && (
          <div className="flex flex-wrap items-center gap-1.5 mb-5">
            <span className="text-[10px] uppercase font-bold text-slate-405 tracking-wider">Common conc:</span>
            {(() => {
              const concs = [...agentData.commonConcs];
              if (!concs.includes(0.25)) {
                concs.unshift(0.25);
              }
              const sortedConcs = concs.sort((a, b) => a - b);
              return sortedConcs.map((conc) => (
                <button
                  type="button"
                  key={conc}
                  id={`plan-quick-${conc}`}
                  onClick={() => setPlannedConc(conc.toString())}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    parseFloat(plannedConc) === conc
                      ? "bg-slate-800 border-slate-800 dark:bg-indigo-600 dark:border-indigo-600 text-white font-semibold"
                      : "bg-slate-50 dark:bg-brand-item text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#252A33] border-slate-200 dark:border-brand-border"
                  }`}
                >
                  {conc}%
                </button>
              ));
            })()}
          </div>
        )}

        {/* Result Area */}
        {weightKg <= 0 ? (
          <div className="p-4 border border-dashed border-slate-200 dark:border-brand-border rounded-xl text-center text-slate-400">
            <AlertTriangle className="mx-auto mb-1 text-slate-300 dark:text-slate-650" size={20} />
            <p className="text-xs">Specify weight to predict safe levels.</p>
          </div>
        ) : totalPercent >= 100 ? (
          <div className="p-4 bg-red-100/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-400 clinical-critical-alert">
            <AlertTriangle size={20} className="shrink-0 mt-0.5 animate-bounce" />
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider block">Safety Limit Exceeded</span>
              <p className="text-xs leading-normal">
                Toxicity index is at {totalPercent.toFixed(1)}%. Cease administration protocols.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {/* Safe dose in mg */}
            <div className="p-4 bg-slate-50 dark:bg-brand-item border border-slate-200 dark:border-brand-border rounded-2xl">
              <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Remaining Safe Dose</span>
              <div className="flex items-baseline gap-1 mt-1.5">
                <span className="text-xl md:text-2xl font-extrabold text-slate-850 dark:text-[#E2E8F0] font-mono">
                  {calculations.remainingMg.toFixed(1)}
                </span>
                <span className="text-xs font-bold text-slate-405">mg</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 lines-clamp-1">
                {calculations.remainingPercent.toFixed(1)}% safe margin.
              </p>
            </div>

            {/* Safe volume in mL */}
            <div className="p-4 bg-indigo-50/50 dark:bg-[#1E222B] border border-indigo-100/15 dark:border-slate-800 rounded-2xl">
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider block">Max Allowable Vol</span>
              <div className="flex items-baseline gap-1 mt-1.5 text-indigo-700 dark:text-indigo-400">
                <span className="text-xl md:text-2xl font-extrabold font-mono">
                  {calculations.remainingMl.toFixed(1)}
                </span>
                <span className="text-xs font-bold">mL</span>
              </div>
              <p className="text-[10px] text-indigo-500/80 dark:text-indigo-455 mt-1 lines-clamp-1 font-medium">
                At proposed {plannedConc || "0"}% conc.
              </p>
            </div>
          </div>
        )}
      </div>

      {weightKg > 0 && totalPercent < 100 && (
        <div className="mt-5 p-3 rounded-xl bg-slate-50 dark:bg-brand-item/30 border border-slate-200 dark:border-brand-border flex gap-2.5 items-start">
          <ShieldCheck size={16} className="text-emerald-500 shrink-0 mt-0.5" />
          <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
            1 mL of {plannedAgent} {plannedConc}% equals <strong>{(parseFloat(plannedConc) || 0) * 10} mg</strong> of active drug.
          </div>
        </div>
      )}
    </div>
  );
}
