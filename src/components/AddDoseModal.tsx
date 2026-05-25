import { useState, useMemo, ChangeEvent, FormEvent } from "react";
import { X, Plus, ShieldAlert, Scale } from "lucide-react";
import { ANESTHETIC_DATABASE, getSafeMaxMg } from "../types";

interface AddDoseModalProps {
  weightKg: number;
  onClose: () => void;
  onAddDose: (dose: { agentName: string; concentration: number; volume: number }) => void;
}

export default function AddDoseModal({
  weightKg,
  onClose,
  onAddDose,
}: AddDoseModalProps) {
  const [selectedAgent, setSelectedAgent] = useState<string>("Lidocaine");
  const [customConc, setCustomConc] = useState<string>("1");
  const [volume, setVolume] = useState<string>("10");

  const currentAgentData = useMemo(() => {
    return ANESTHETIC_DATABASE[selectedAgent];
  }, [selectedAgent]);

  const handleAgentChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const agent = e.target.value;
    setSelectedAgent(agent);
    const defaults = ANESTHETIC_DATABASE[agent]?.commonConcs || [];
    if (defaults.length > 0) {
      setCustomConc(defaults[0].toString());
    }
  };

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
    const concNum = parseFloat(customConc);
    const volNum = parseFloat(volume);

    if (isNaN(concNum) || concNum <= 0) return;
    if (isNaN(volNum) || volNum <= 0) return;

    onAddDose({
      agentName: selectedAgent,
      concentration: concNum,
      volume: volNum,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#111317] border border-slate-800 rounded-3xl w-full max-w-lg p-6 relative shadow-2xl animate-scale-in text-slate-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl transition-all cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-600/15 border border-indigo-500/20 text-indigo-400 rounded-full">
            <Plus size={24} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">Log Administered Dose</h2>
            <p className="text-xs text-slate-400">Add local anesthetic drug parameters spent</p>
          </div>
        </div>

        {weightKg <= 0 && (
          <div className="mb-4 p-3.5 bg-amber-950/40 border border-amber-900/30 rounded-xl flex items-start gap-2.5 text-amber-400">
            <ShieldAlert size={18} className="shrink-0 mt-0.5" />
            <div className="text-xs leading-normal">
              <strong>Patient Weight Needed:</strong> Specify patient weight first to calculate safe dynamic limits.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            {/* Agent Selector */}
            <div className="space-y-1.5">
              <label htmlFor="agent-select" className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
                Local Anesthetic Agent
              </label>
              <select
                id="agent-select"
                disabled={weightKg <= 0}
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-800 bg-[#16191E] text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50"
                value={selectedAgent}
                onChange={handleAgentChange}
              >
                {Object.keys(ANESTHETIC_DATABASE).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Concentration Selector */}
            {weightKg > 0 && currentAgentData && (
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Quick concentration picks:</span>
                <div className="flex flex-wrap gap-1.5">
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
                        onClick={() => setCustomConc(conc.toString())}
                        className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-medium ${
                          parseFloat(customConc) === conc
                            ? "bg-indigo-600 border-indigo-600 text-white font-bold"
                            : "bg-[#16191E] hover:bg-[#1E222B] border-slate-800 text-slate-300"
                        }`}
                      >
                        {conc}%
                      </button>
                    ));
                  })()}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Concentration value */}
              <div className="space-y-1.5">
                <label htmlFor="conc-input" className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block flex justify-between">
                  <span>Concentration</span>
                  <span className="text-slate-500 normal-case">% conc</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="conc-input"
                    step="0.01"
                    min="0.01"
                    max="100"
                    disabled={weightKg <= 0}
                    required
                    className="pr-8 pl-4 py-3 w-full text-sm font-bold rounded-xl border border-slate-800 bg-[#16191E] text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50"
                    value={customConc}
                    onChange={(e) => setCustomConc(e.target.value)}
                  />
                  <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs font-bold text-slate-500 pointer-events-none">
                    %
                  </span>
                </div>
              </div>

              {/* Volume of Dose */}
              <div className="space-y-1.5">
                <label htmlFor="vol-input" className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block flex justify-between">
                  <span>Volume</span>
                  <span className="text-slate-500 normal-case">mL given</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="vol-input"
                    step="0.1"
                    min="0.1"
                    max="1000"
                    disabled={weightKg <= 0}
                    required
                    className="pr-8 pl-4 py-3 w-full text-sm font-bold rounded-xl border border-slate-800 bg-[#16191E] text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                  />
                  <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs font-bold text-slate-500 pointer-events-none">
                    mL
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Calculations preview strip */}
          {weightKg > 0 && (
            <div className="bg-[#16191E] rounded-2xl p-4 border border-slate-800 space-y-2">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Dose Calculation Preview</span>
              <div className="flex justify-between items-baseline flex-wrap gap-2 text-xs">
                <div>
                  <span className="font-mono text-base font-extrabold text-slate-100">{previewData.mg.toFixed(1)}</span>
                  <span className="text-slate-400 font-bold ml-1">mg</span>
                  <span className="text-slate-500 font-medium ml-1.5 block xs:inline">
                    ({volume || "0"} mL × {customConc || "0"}% × 10)
                  </span>
                </div>
                <div className="text-right">
                  <span className={`font-mono text-base font-extrabold ${
                    previewData.percent >= 100 
                      ? "text-red-500" 
                      : previewData.percent >= 70 
                        ? "text-amber-500" 
                        : "text-indigo-400"
                  }`}>
                    {previewData.percent.toFixed(1)}%
                  </span>
                  <span className="text-slate-400 font-bold ml-1">of max</span>
                  <span className="text-slate-500 font-medium block text-[10px]">
                    total safe limit: {previewData.safeMax.toFixed(0)} mg
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-[#1E222B] hover:bg-[#252A36] text-slate-300 font-extrabold rounded-2xl transition-all cursor-pointer text-center text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={weightKg <= 0 || !volume || !customConc || parseFloat(volume) <= 0}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold rounded-2xl transition-all shadow-md shadow-indigo-500/10 cursor-pointer text-center text-xs"
            >
              Log Dose
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
