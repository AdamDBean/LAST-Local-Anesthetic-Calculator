import { useState, useMemo, ChangeEvent, FormEvent } from "react";
import { Plus, Trash2, ShieldAlert, Clock } from "lucide-react";
import { AdministeredDose, ANESTHETIC_DATABASE, getSafeMaxMg } from "../types";

interface AdministeredTrackerProps {
  weightKg: number;
  doses: AdministeredDose[];
  onAddDose: (dose: Omit<AdministeredDose, "id" | "percentOfMax" | "calculatedMg" | "timestamp">) => void;
  onDeleteDose: (id: string) => void;
  onClearAll: () => void;
}

export default function AdministeredTracker({
  weightKg,
  doses,
  onAddDose,
  onDeleteDose,
  onClearAll,
}: AdministeredTrackerProps) {
  // Add Dose form states
  const [selectedAgent, setSelectedAgent] = useState<string>("Lidocaine");
  const [customConc, setCustomConc] = useState<string>("1");
  const [volume, setVolume] = useState<string>("10");

  // Show clear confirmation
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Get common concentrations for selected agent
  const currentAgentData = useMemo(() => {
    return ANESTHETIC_DATABASE[selectedAgent];
  }, [selectedAgent]);

  // Sync custom concentration when selected agent changes to its first common conc
  const handleAgentChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const agent = e.target.value;
    setSelectedAgent(agent);
    const defaults = ANESTHETIC_DATABASE[agent]?.commonConcs || [];
    if (defaults.length > 0) {
      setCustomConc(defaults[0].toString());
    }
  };

  // Preview dose before adding
  const previewData = useMemo(() => {
    const concNum = parseFloat(customConc) || 0;
    const volNum = parseFloat(volume) || 0;
    const mg = volNum * concNum * 10;
    
    let percent = 0;
    let safeMax = 0;
    if (weightKg > 0) {
      safeMax = getSafeMaxMg(selectedAgent, weightKg);
      percent = safeMax > 0 ? (mg / safeMax) * 100 : 0;
    }

    return {
      mg,
      percent,
      safeMax,
    };
  }, [selectedAgent, customConc, volume, weightKg]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (weightKg <= 0) return;
    
    const concNum = parseFloat(customConc);
    const volNum = parseFloat(volume);

    if (isNaN(concNum) || concNum <= 0) return;
    if (isNaN(volNum) || volNum <= 0) return;

    onAddDose({
      agentName: selectedAgent,
      concentration: concNum,
      volume: volNum,
    });

    // Reset volume but preserve agent selection to facilitate repeated doses
    setVolume("");
  };

  return (
    <div id="dose-tracker-section" className="bg-white dark:bg-brand-card border border-slate-200 dark:border-brand-border rounded-2xl p-6 shadow-sm flex flex-col h-full justify-between">
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-50 dark:bg-brand-item/65 dark:border dark:border-brand-border rounded-lg text-rose-600 dark:text-rose-400">
              <Plus size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Log Discharged Dose</h2>
          </div>
          {doses.length > 0 && (
            <div className="relative">
              {!showClearConfirm ? (
                <button
                  type="button"
                  id="btn-trigger-clear"
                  onClick={() => setShowClearConfirm(true)}
                  className="text-xs font-semibold px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-lg transition-colors"
                >
                  Clear All
                </button>
              ) : (
                <div id="clear-confirm-bubble" className="absolute right-0 top-0 z-10 flex items-center gap-1.5 bg-rose-600 p-1.5 rounded-lg shadow-md animate-fade-in whitespace-nowrap">
                  <span className="text-[11px] text-white font-medium px-2">Confirm clear?</span>
                  <button
                    type="button"
                    id="btn-confirm-clear"
                    onClick={() => {
                      onClearAll();
                      setShowClearConfirm(false);
                    }}
                    className="text-[11px] font-bold bg-white text-rose-700 px-2 py-1 rounded hover:bg-slate-50 transition-colors"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    id="btn-cancel-clear"
                    onClick={() => setShowClearConfirm(false)}
                    className="text-[11px] font-semibold text-rose-100 hover:text-white px-1.5 py-1"
                  >
                    No
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Warning if weight is blank */}
        {weightKg <= 0 && (
          <div className="mb-4 p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl flex items-start gap-2.5 text-amber-800 dark:text-amber-400">
            <ShieldAlert size={18} className="shrink-0 mt-0.5" />
            <div className="text-xs font-medium leading-normal">
              <strong>Patient Weight is required:</strong> Please configure patient weight above to enable maximum dose logging calculations.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Agent Select */}
            <div className="space-y-1.5">
              <label htmlFor="agent-selector" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Agent Name
              </label>
              <select
                id="agent-selector"
                disabled={weightKg <= 0}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-brand-border-light bg-slate-50 dark:bg-brand-item text-slate-800 dark:text-[#E2E8F0] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:opacity-50"
                value={selectedAgent}
                onChange={handleAgentChange}
              >
                {Object.keys(ANESTHETIC_DATABASE).map((agentName) => (
                  <option key={agentName} value={agentName}>
                    {agentName}
                  </option>
                ))}
              </select>
            </div>

            {/* Concentration % */}
            <div className="space-y-1.5">
              <label htmlFor="input-conc" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider flex justify-between">
                <span>Concentration</span>
                <span className="text-slate-400 lowercase">% conc</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="input-conc"
                  step="0.01"
                  min="0.01"
                  max="100"
                  placeholder="Concentration"
                  disabled={weightKg <= 0}
                  className="pr-8 pl-3 py-2 w-full text-sm font-semibold rounded-xl border border-slate-300 dark:border-brand-border-light bg-slate-50 dark:bg-brand-item text-slate-800 dark:text-[#E2E8F0] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:opacity-50"
                  value={customConc}
                  onChange={(e) => setCustomConc(e.target.value)}
                />
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-slate-400 pointer-events-none">
                  %
                </span>
              </div>
            </div>

            {/* Volume mL */}
            <div className="space-y-1.5">
              <label htmlFor="input-volume" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider flex justify-between">
                <span>Volume</span>
                <span className="text-slate-400 lowercase">mL given</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="input-volume"
                  step="0.1"
                  min="0.1"
                  max="1000"
                  placeholder="Volume"
                  disabled={weightKg <= 0}
                  required
                  className="pr-8 pl-3 py-2 w-full text-sm font-semibold rounded-xl border border-slate-300 dark:border-brand-border-light bg-slate-50 dark:bg-brand-item text-slate-800 dark:text-[#E2E8F0] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:opacity-50"
                  value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                />
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-slate-400 pointer-events-none">
                  mL
                </span>
              </div>
            </div>
          </div>

          {/* Quick concentration picks */}
          {weightKg > 0 && currentAgentData && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mr-1">Quick Conc:</span>
              {(() => {
                const concs = [...currentAgentData.commonConcs];
                if (!concs.includes(0.25)) {
                  concs.unshift(0.25);
                }
                const sortedConcs = concs.sort((a, b) => a - b);
                return sortedConcs.map((conc) => (
                  <button
                    type="button"
                    key={conc}
                    id={`conc-quick-${conc}`}
                    onClick={() => setCustomConc(conc.toString())}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                      parseFloat(customConc) === conc
                        ? "bg-slate-800 border-slate-800 dark:bg-indigo-600 dark:border-indigo-600 text-white font-bold"
                        : "bg-slate-50 dark:bg-brand-item text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#252A33] border-slate-200 dark:border-brand-border"
                    }`}
                  >
                    {conc}%
                  </button>
                ));
              })()}
            </div>
          )}

          {/* Live math preview card */}
          {weightKg > 0 && (
            <div className="bg-indigo-50/70 dark:bg-indigo-950/20 rounded-xl p-3 border border-indigo-100/50 dark:border-indigo-900/30 flex justify-between items-center text-xs flex-wrap gap-2">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Dose Calculation Preview:</span>
                <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  <span className="font-mono text-sm">{previewData.mg.toFixed(1)}</span> mg of {selectedAgent} 
                  <span className="text-slate-400 text-[10px] ml-1.5">
                    ({volume || "0"}mL × {customConc || "0"}% × 10)
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-slate-500 dark:text-slate-400">Total Safe Cap:</span>
                <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono text-xs">{previewData.percent.toFixed(1)}%</span> of max ({previewData.safeMax.toFixed(0)}mg)
                </div>
              </div>
            </div>
          )}

          {/* Log button */}
          <button
            type="submit"
            id="btn-add-dose"
            disabled={weightKg <= 0 || !volume || !customConc}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl font-bold transition-all shadow-sm shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-1.5 select-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 touch-manipulation text-sm cursor-pointer"
          >
            <Plus size={18} />
            Log Administered Dose
          </button>
        </form>

        {/* Administration History Header */}
        <div className="mt-6 border-t border-slate-100 dark:border-brand-border pt-5">
          <h3 className="text-sm font-bold text-slate-800 dark:text-[#E2E8F0] mb-3 flex items-center gap-1.5">
            <span>Administration Log</span>
            <span className="text-xs bg-slate-100 dark:bg-brand-item dark:border dark:border-brand-border-light text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-semibold">
              {doses.length} entry{doses.length !== 1 && "ies"}
            </span>
          </h3>

          {doses.length === 0 ? (
            <div className="p-8 border border-dashed border-slate-200 dark:border-brand-border rounded-xl text-center text-slate-400 dark:text-slate-600">
              <Clock size={28} className="mx-auto mb-2 opacity-50 text-slate-400" />
              <p className="text-xs">No anesthetic dosages have been administered yet.</p>
              <p className="text-[10px] mt-1 text-slate-500">Configure parameters above to record safety thresholds.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
              
              {/* Responsive Wide Screen Table layout */}
              <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200 dark:border-brand-border">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-brand-item text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-brand-border">
                      <th className="p-2.5 font-bold uppercase tracking-wider">Agent</th>
                      <th className="p-2.5 font-bold uppercase tracking-wider text-right">Vol (mL)</th>
                      <th className="p-2.5 font-bold uppercase tracking-wider text-right">Conc (%)</th>
                      <th className="p-2.5 font-bold uppercase tracking-wider text-right">Total (mg)</th>
                      <th className="p-2.5 font-bold uppercase tracking-wider text-right">% of Max</th>
                      <th className="p-2.5 text-center">Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doses.map((dose) => (
                      <tr key={dose.id} className="border-b border-slate-100 dark:border-brand-border hover:bg-slate-50/50 dark:hover:bg-brand-item/40 transition-colors">
                        <td className="p-2.5 font-semibold text-slate-800 dark:text-[#E2E8F0]">{dose.agentName}</td>
                        <td className="p-2.5 text-right font-mono text-slate-700 dark:text-slate-300">{dose.volume} mL</td>
                        <td className="p-2.5 text-right font-mono text-slate-700 dark:text-slate-300">{dose.concentration}%</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-800 dark:text-[#E2E8F0]">{dose.calculatedMg.toFixed(1)} mg</td>
                        <td className={`p-2.5 text-right font-mono font-bold ${
                          dose.percentOfMax >= 100 
                            ? "text-red-500" 
                            : dose.percentOfMax >= 60 
                              ? "text-amber-500" 
                              : "text-emerald-500"
                        }`}>
                          {dose.percentOfMax.toFixed(1)}%
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            id={`delete-dose-${dose.id}`}
                            onClick={() => onDeleteDose(dose.id)}
                            className="p-1.5 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 text-slate-400 dark:text-slate-500 hover:dark:text-rose-400 rounded-lg transition-colors cursor-pointer"
                            style={{ minWidth: "32px", minHeight: "32px" }}
                            title="Delete dosage"
                          >
                            <Trash2 size={14} className="mx-auto" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Responsive Mobile Vertical Cards Layout */}
              <div className="block md:hidden space-y-2">
                {doses.map((dose) => (
                  <div
                    key={dose.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-brand-border bg-slate-50/50 dark:bg-brand-item relative flex justify-between items-center"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-850 dark:text-[#E2E8F0] text-sm">
                          {dose.agentName}
                        </span>
                      </div>
                      <div className="text-xs text-slate-550 dark:text-slate-400 grid grid-cols-2 gap-y-0.5 gap-x-3">
                        <div>Vol: <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">{dose.volume} mL</span></div>
                        <div>Conc: <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">{dose.concentration}%</span></div>
                        <div className="col-span-2">Dose: <span className="font-mono text-slate-850 dark:text-[#E2E8F0] font-bold">{dose.calculatedMg.toFixed(1)} mg</span></div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wide block font-semibold">Load Impact</span>
                        <span className={`text-base font-bold font-mono ${
                          dose.percentOfMax >= 100 
                            ? "text-red-500" 
                            : dose.percentOfMax >= 60 
                              ? "text-amber-500" 
                              : "text-emerald-500"
                        }`}>
                          {dose.percentOfMax.toFixed(1)}%
                        </span>
                      </div>
                      <button
                        type="button"
                        id={`delete-dose-mob-${dose.id}`}
                        onClick={() => onDeleteDose(dose.id)}
                        className="p-2.5 bg-white dark:bg-brand-item border border-slate-200 dark:border-brand-border text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-[#252A33] shadow-sm ml-1 transition-colors touch-manipulation cursor-pointer inline-flex items-center justify-center"
                        style={{ minWidth: "44px", minHeight: "44px" }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
