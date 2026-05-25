import { useMemo, useState } from "react";
import { BookOpen, Search, ArrowDownRight, ChevronDown, ChevronUp } from "lucide-react";
import { ANESTHETIC_DATABASE, getSafeMaxMg } from "../types";

interface ReferenceTableProps {
  weightKg: number;
  autoOpen?: boolean;
}

export default function ReferenceTable({ weightKg, autoOpen = false }: ReferenceTableProps) {
  const [isOpen, setIsOpen] = useState(autoOpen);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAgents = useMemo(() => {
    return Object.entries(ANESTHETIC_DATABASE).filter(([name]) => 
      name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <div id="reference-calculator-table" className="bg-white dark:bg-brand-card border border-slate-200 dark:border-brand-border rounded-2xl shadow-sm overflow-hidden animate-fade-in">
      {/* Header clickable to collapse */}
      <button
        type="button"
        id="btn-toggle-ref-table"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left border-none focus:outline-none cursor-pointer bg-transparent hover:bg-slate-50/50 dark:hover:bg-brand-item/40 transition-all select-none"
      >
        <div className="flex items-center gap-2">
          <div className="p-2 bg-slate-50 dark:bg-brand-item text-slate-600 dark:text-slate-450 border dark:border-brand-border-light rounded-lg">
            <BookOpen size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-950 dark:text-[#E2E8F0]">Anesthetic Database & Dynamic Threshold Guide</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Reference table of common local agents, weight thresholds, and absolute ceilings.</p>
          </div>
        </div>
        <div className="p-1 rounded bg-slate-100 dark:bg-brand-item text-slate-550 dark:text-slate-400 border dark:border-brand-border-light">
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 pt-1 space-y-4 border-t border-slate-100 dark:border-brand-border">
          {/* Quick Search Bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
              <Search size={14} />
            </span>
            <input
              type="text"
              id="search-agents-input"
              placeholder="Search agents..."
              className="pl-8 pr-4 py-1.5 w-full rounded-xl border border-slate-200 dark:border-brand-border-light bg-slate-50 dark:bg-brand-item text-xs text-slate-700 dark:text-[#E2E8F0] focus:ring-1.5 focus:ring-indigo-500 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-brand-border text-xs">
            {/* Desktop and Tablet table */}
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-brand-item text-slate-550 dark:text-slate-400 border-b border-slate-100 dark:border-brand-border">
                  <th className="p-2.5 font-bold uppercase tracking-wider">Agent</th>
                  <th className="p-2.5 font-bold uppercase tracking-wider text-right">Limit (mg/kg)</th>
                  <th className="p-2.5 font-bold uppercase tracking-wider text-right">Ceiling (mg)</th>
                  <th className="p-2.5 font-bold uppercase tracking-wider text-right bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400">
                    Patient Max {weightKg > 0 ? `(${weightKg}kg)` : ""}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAgents.map(([name, agent]) => {
                  const patientMax = weightKg > 0 ? getSafeMaxMg(name, weightKg) : 0;
                  const isPrilocaine70 = name === "Prilocaine" && weightKg > 70;
                  
                  return (
                    <tr key={name} className="border-b border-slate-100 dark:border-brand-border hover:bg-slate-50/55 dark:hover:bg-brand-item/20 transition-colors">
                      <td className="p-2.5 font-semibold text-slate-850 dark:text-[#E2E8F0]">
                        {name}
                      </td>
                      <td className="p-2.5 text-right font-mono text-slate-600 dark:text-slate-400">
                        {agent.wgtMax} mg/kg
                      </td>
                      <td className="p-2.5 text-right font-mono text-slate-600 dark:text-slate-400">
                        {isPrilocaine70 ? (
                          <span className="flex items-center justify-end gap-1" title="Ceiling increased to 600mg because weight is >70kg">
                            <span className="line-through text-slate-405 dark:text-slate-550 text-[10px]">500</span> 
                            <span className="font-bold text-slate-800 dark:text-slate-300">600 mg</span>
                          </span>
                        ) : (
                          `${agent.totalMax} mg`
                        )}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold bg-indigo-50/20 dark:bg-indigo-950/10 text-indigo-600 dark:text-indigo-400">
                        {weightKg > 0 ? `${patientMax.toFixed(0)} mg` : "Set weight"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-blue-50/50 dark:bg-brand-item/40 border border-blue-100 dark:border-brand-border-light rounded-xl text-[11px] text-blue-700 dark:text-blue-400 leading-normal flex items-start gap-2">
            <ArrowDownRight size={14} className="shrink-0 mt-0.5" />
            <p>
              <strong>Pharmacological "Ceiling" Limit Checked:</strong> When patient weight causes the mg/kg calculation to exceed the standard ceiling dose (e.g. Lidocaine at 4.5 mg/kg for 90kg would theoretically be 405mg), the dynamic calculation restricts safety recommended thresholds to the static absolute pharmacological ceiling (300mg in Lidocaine's case).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
