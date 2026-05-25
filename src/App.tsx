import { useState, useEffect, useMemo } from "react";
import { 
  ShieldAlert, 
  Heart, 
  Menu, 
  X, 
  BookOpen, 
  ArrowRight, 
  Compass,
  Syringe,
  Scale,
  Plus,
  Trash2,
  Info,
  Activity,
  LifeBuoy
} from "lucide-react";

import { AdministeredDose, getSafeMaxMg } from "./types";
import ReferenceTable from "./components/ReferenceTable";
import ResuscitationHelper from "./components/ResuscitationHelper";
import WhatIfPlanner from "./components/WhatIfPlanner";
import CircularProgress from "./components/CircularProgress";
import AddDoseModal from "./components/AddDoseModal";

export default function App() {
  // 1. Patient Weight State
  const [weightKg, setWeightKg] = useState<number>(() => {
    const saved = localStorage.getItem("last_calc_weight");
    return saved ? parseFloat(saved) : 70;
  });

  // 2. State for logged doses
  const [doses, setDoses] = useState<AdministeredDose[]>(() => {
    const saved = localStorage.getItem("last_calc_doses");
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 3. User UI Modals Active state
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isAddDoseModalOpen, setIsAddDoseModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeRefView, setActiveRefView] = useState<"index" | "database" | "dual-caps" | "guidelines" | "last-card">("index");

  // 4. State indicating whether the clinician confirmed administering status to reveal monitor
  const [isMonitorActive, setIsMonitorActive] = useState(() => {
    return localStorage.getItem("last_calc_confirm") === "true";
  });

  // Keep localStorage sync
  useEffect(() => {
    localStorage.setItem("last_calc_weight", weightKg.toString());
  }, [weightKg]);

  useEffect(() => {
    localStorage.setItem("last_calc_doses", JSON.stringify(doses));
  }, [doses]);

  useEffect(() => {
    localStorage.setItem("last_calc_confirm", isMonitorActive.toString());
  }, [isMonitorActive]);

  // Calculations for dynamic toxicity percentages
  const processedDoses = useMemo(() => {
    if (weightKg <= 0) {
      return doses.map(d => ({ ...d, percentOfMax: 0 }));
    }
    return doses.map(dose => {
      const safeMax = getSafeMaxMg(dose.agentName, weightKg);
      const percent = safeMax > 0 ? (dose.calculatedMg / safeMax) * 100 : 0;
      return {
        ...dose,
        percentOfMax: percent
      };
    });
  }, [doses, weightKg]);

  const totalPercent = useMemo(() => {
    return processedDoses.reduce((sum, item) => sum + item.percentOfMax, 0);
  }, [processedDoses]);

  const agentSummaries = useMemo<Record<string, { totalMg: number; maxAllowedMg: number; percent: number }>>(() => {
    const summaryMap: Record<string, { totalMg: number; maxAllowedMg: number; percent: number }> = {};
    processedDoses.forEach(dose => {
      if (!summaryMap[dose.agentName]) {
        summaryMap[dose.agentName] = { totalMg: 0, maxAllowedMg: 0, percent: 0 };
      }
      summaryMap[dose.agentName].totalMg += dose.calculatedMg;
    });
    Object.keys(summaryMap).forEach(agentName => {
      const safeMax = getSafeMaxMg(agentName, weightKg);
      summaryMap[agentName].maxAllowedMg = safeMax;
      summaryMap[agentName].percent = safeMax > 0 ? (summaryMap[agentName].totalMg / safeMax) * 100 : 0;
    });
    return summaryMap;
  }, [processedDoses, weightKg]);

  // Handlers
  const handleAddDose = (newDose: { agentName: string; concentration: number; volume: number }) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 7);
    const calculatedMg = newDose.volume * newDose.concentration * 10;
    const safeMax = getSafeMaxMg(newDose.agentName, weightKg);
    const percentOfMax = safeMax > 0 ? (calculatedMg / safeMax) * 100 : 0;

    const fullDose: AdministeredDose = {
      id,
      ...newDose,
      calculatedMg,
      percentOfMax,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setDoses(prev => [fullDose, ...prev]);
  };

  const handleDeleteDose = (id: string) => {
    setDoses(prev => prev.filter(item => item.id !== id));
  };

  const handleClearAll = () => {
    setDoses([]);
    setIsMonitorActive(false);
  };

  // Safe color helpers for dynamic badges
  const toxicityBadgeColor = totalPercent >= 100 
    ? "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse" 
    : totalPercent >= 70 
      ? "bg-amber-500/20 text-amber-400 border-amber-500/30" 
      : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";

  return (
    <div className="dark bg-[#0B0F19] min-h-screen text-slate-200 transition-colors pb-16 font-sans">
      
      {/* 1. Header Bar */}
      <header className="border-b border-slate-800/60 bg-[#111317] sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          
          {/* Logo & Guideline Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActiveRefView("index");
                setIsMenuOpen(true);
              }}
              className="p-2.5 rounded-xl text-slate-350 hover:text-white bg-[#161922] border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              id="btn-guidelines-menu"
              title="Guidelines Reference Menu"
            >
              <Menu size={16} />
              <span className="text-[11px] font-extrabold uppercase tracking-wider hidden sm:inline">Guidelines</span>
            </button>
            <div className="flex items-center gap-1.5">
              <Syringe className="text-indigo-400" size={18} />
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-xs font-black text-slate-100 tracking-wider uppercase">
                  LAST Safety Hub
                </span>
              </div>
            </div>
          </div>

          {/* Center Patient Weight Trigger (Popup Modal) */}
          <div className="flex items-center justify-center">
            <button
              onClick={() => setIsWeightModalOpen(true)}
              id="btn-trigger-weight-modal"
              className="px-4 py-2 text-xs font-black bg-[#161922] border border-slate-850 hover:border-indigo-500/30 rounded-xl transition-all cursor-pointer flex items-center gap-2 text-slate-100"
            >
              <Scale size={13} className="text-indigo-400" />
              <span>Weight: <strong className="text-indigo-400 font-mono tracking-tight">{weightKg} kg</strong></span>
              <span className="text-slate-500 font-medium text-[10px]">({(weightKg * 2.20462).toFixed(1)} lbs)</span>
              <span className="text-slate-500 text-[9px] ml-0.5">▼</span>
            </button>
          </div>

          {/* Right side simple Toxicity Loaded pill */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (doses.length > 0) {
                  setIsMonitorActive(prev => !prev);
                }
              }}
              title="Click to toggle bedside monitor"
              className={`text-xs font-mono font-black border px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1.5 transition-all ${toxicityBadgeColor}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
              <span className="hidden xs:inline uppercase text-[9px] tracking-wider font-extrabold text-slate-405 mr-0.5">Toxicity:</span>
              <span>{totalPercent.toFixed(1)}%</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main workspace container */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        {/* Urgent Critical Warning Banner */}
        {totalPercent >= 100 && (
          <div id="visual-toxicity-hazard-alert" className="p-4 bg-red-950/90 border border-red-500 rounded-2xl text-red-100 shadow-xl flex items-start gap-4 max-w-4xl mx-auto animate-pulse">
            <ShieldAlert size={24} className="shrink-0 mt-0.5 text-red-400" />
            <div className="space-y-1">
              <h2 className="text-sm font-black tracking-wider uppercase text-red-200 flex items-center gap-1.5">
                CRITICAL WARNING: SAFETY LIMIT EXCEEDED
              </h2>
              <p className="text-xs leading-normal opacity-95">
                Total toxicity index is <strong className="font-mono text-sm ml-0.5">{totalPercent.toFixed(1)}%</strong>. Toxic dosage levels of local anesthesia are reached! Immediately prepare Intralipid 20% Rescue protocols. Click guidelines to access calculations.
              </p>
            </div>
          </div>
        )}

        {/* Outer Desktop Columns Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6 items-start">
          
          {/* LEFT PANEL: Logged entries list */}
          <div className="space-y-6">
            <div className="bg-[#111317] border border-slate-800 rounded-3xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-2 text-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black uppercase tracking-wider">Dosage Logging Grid</span>
                </div>
                {doses.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-[10px] font-extrabold px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition-all cursor-pointer"
                    id="btn-clear-doses"
                  >
                    Clear Doses
                  </button>
                )}
              </div>

              {/* Add Dose Trigger Button */}
              <button
                onClick={() => setIsAddDoseModalOpen(true)}
                id="btn-trigger-add-dose"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-[#F1F5F9] font-extrabold text-sm tracking-wide rounded-2xl py-3.5 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-505/10"
              >
                <Plus size={16} />
                <span>Log Administered Dose</span>
              </button>

              <hr className="border-b border-slate-800/60 my-5" />

              {/* Administration Log Section Title / Badge */}
              <div className="flex items-center mb-4">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-350">
                  Administration Log
                </h3>
                <span className="bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded-full text-[10px] font-black text-slate-300 tracking-tight ml-2.5 uppercase select-none">
                  {doses.length === 1 ? "1 entry" : `${doses.length} entries`}
                </span>
              </div>

              {/* List of Log Doses */}
              {doses.length === 0 ? (
                <div className="p-10 border border-dashed border-slate-800 rounded-2xl text-center text-slate-500">
                  <Syringe size={32} className="mx-auto mb-3 opacity-30 text-indigo-400" />
                  <p className="text-xs font-semibold uppercase tracking-wider">No anesthetic doses logged</p>
                  <p className="text-[10px] text-slate-600 mt-1">Tap the button above to log administered doses.</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {processedDoses.map((dose) => {
                    const impactColor = dose.percentOfMax >= 100 
                      ? "text-red-500" 
                      : dose.percentOfMax >= 60 
                        ? "text-amber-500" 
                        : "text-emerald-400";
                    
                    return (
                      <div
                        key={dose.id}
                        className="bg-[#161922]/80 border border-slate-800/80 rounded-2xl p-4 flex justify-between items-center transition-all hover:bg-[#1C202B]/90 shadow-sm"
                      >
                        <div className="space-y-1">
                          <span className="font-extrabold text-slate-100 text-sm tracking-tight block">
                            {dose.agentName}
                          </span>
                          <div className="text-xs text-slate-405 font-semibold flex items-center gap-3 flex-wrap mt-0.5">
                            <span>Vol: <strong className="font-mono text-slate-200 font-extrabold">{dose.volume}</strong> mL</span>
                            <span className="text-slate-750">•</span>
                            <span>Conc: <strong className="font-mono text-slate-200 font-extrabold">{dose.concentration}%</strong></span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1 font-semibold">
                            <span>Dose: <strong className="font-mono text-slate-100 font-extrabold text-[#F1F5F9]">{dose.calculatedMg.toFixed(1)}</strong> mg</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-[8px] text-slate-500 font-extrabold uppercase tracking-widest block select-none">Load Impact</span>
                            <span className={`text-base font-black font-mono tracking-tighter ${impactColor}`}>
                              {dose.percentOfMax.toFixed(1)}%
                            </span>
                          </div>
                          {!isMonitorActive && (
                            <button
                              onClick={() => handleDeleteDose(dose.id)}
                              id={`delete-dose-${dose.id}`}
                              className="border border-slate-800/80 rounded-xl hover:bg-rose-500/10 hover:border-red-500/30 text-rose-450 p-2.5 transition-all cursor-pointer inline-flex items-center justify-center shrink-0"
                              title="Delete dose"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Confirmation / Lock trigger */}
                  <div className="pt-4 border-t border-slate-805 mt-2.5 flex justify-end">
                    {!isMonitorActive ? (
                      <button
                        onClick={() => setIsMonitorActive(true)}
                        id="btn-lock-log"
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-md shadow-emerald-500/10 cursor-pointer flex items-center gap-1.5"
                      >
                        <span>Lock Log & View Bedside Monitor</span>
                        <ArrowRight size={13} />
                      </button>
                    ) : (
                      <div className="flex items-center justify-between w-full flex-wrap gap-2">
                        <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5 bg-emerald-950/30 border border-emerald-900/30 px-3 py-1.5 rounded-xl">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Log Confirmed & Secured
                        </span>
                        <button
                          onClick={() => setIsMonitorActive(false)}
                          id="btn-unlock-log"
                          className="px-3.5 py-1.5 border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-slate-350 rounded-xl text-xs font-semibold cursor-pointer"
                        >
                          Unlock to Edit Log
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Render Bedside Monitor and Drug active consumption under the log *after* user confirms */}
            {isMonitorActive && doses.length > 0 && (
              <div className="bg-[#111317] border border-slate-800 rounded-3xl p-6 shadow-md space-y-6 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Heart className="text-red-400 animate-pulse" size={18} />
                    <h2 className="text-sm font-black text-slate-100 uppercase tracking-wide">
                      Bedside Monitoring Terminal
                    </h2>
                  </div>
                  <span className="text-[9px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md uppercase">
                    Live
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 items-center">
                  {/* Gauge */}
                  <div className="flex justify-center bg-slate-900/40 p-4 rounded-2xl border border-slate-800 shadow-inner max-w-[210px] mx-auto w-full">
                    <CircularProgress value={totalPercent} size={150} strokeWidth={10} />
                  </div>

                  {/* Active agent load bars */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-350 uppercase tracking-wider">Active Drug Consumption</h4>
                      <p className="text-[10px] text-slate-500">DYNAMIC weight checks & ceiling comparators applied</p>
                    </div>

                    <div className="space-y-3">
                      {Object.entries(agentSummaries).map(([name, val]) => {
                        const data = val as { totalMg: number; maxAllowedMg: number; percent: number };
                        const widthPct = Math.min(data.percent, 100);
                        const barColor = data.percent >= 100 
                          ? "bg-red-500" 
                          : data.percent >= 70 
                            ? "bg-amber-500" 
                            : "bg-indigo-500";
                        
                        return (
                          <div key={name} className="p-3 bg-slate-900/60 border border-slate-805 rounded-xl">
                            <div className="flex justify-between items-center text-xs font-semibold">
                              <span className="text-slate-200">{name}</span>
                              <span className="font-mono text-slate-300">
                                {data.totalMg.toFixed(1)} / {data.maxAllowedMg.toFixed(0)} mg
                              </span>
                            </div>

                            {/* Safe progress bar */}
                            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-2 border border-slate-800/40">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${barColor}`} 
                                style={{ width: `${widthPct}%` }}
                              />
                            </div>

                            <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                              <span>Safe limitation threshold</span>
                              <span className="font-bold text-indigo-400">{data.percent.toFixed(1)}% loaded</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: Dynamic Proposed Planner "What do you want to give?" */}
          <div>
            <WhatIfPlanner weightKg={weightKg} totalPercent={totalPercent} />
          </div>

        </div>
      </main>

      {/* 2. Weight Select Modal Pop-Up */}
      {isWeightModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#111317] border border-slate-800 rounded-3xl w-full max-w-md p-6 relative shadow-2xl animate-scale-in text-slate-200">
            {/* Close button */}
            <button
              onClick={() => setIsWeightModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl transition-all cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-indigo-600/10 rounded-full text-indigo-400 border border-indigo-550/20">
                <Scale size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100 tracking-tight">Patient Weight</h2>
                <p className="text-xs text-slate-400">Calibrates safe anesthetic parameters</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <label htmlFor="weight-number-input" className="text-sm font-semibold text-slate-350">
                    Patient Weight (kg)
                  </label>
                  <span className="text-xs font-bold text-indigo-400 bg-indigo-950/40 border border-indigo-900/30 px-2.5 py-1 rounded-xl">
                    ≈ {(weightKg * 2.20462).toFixed(1)} lbs
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    id="weight-number-input"
                    step="0.1"
                    min="0.1"
                    max="300"
                    placeholder="E.g. 70"
                    className="pr-12 pl-4 py-3 w-full rounded-xl border border-slate-800 bg-[#16191E] text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-base font-extrabold tracking-tight transition-all"
                    value={weightKg || ""}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setWeightKg(isNaN(val) ? 0 : Math.max(0.1, Math.min(val, 300)));
                    }}
                  />
                  <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs font-extrabold text-slate-500 pointer-events-none">
                    kg
                  </span>
                </div>

                <div className="pt-2">
                  <input
                    type="range"
                    min="1"
                    max="150"
                    step="0.5"
                    className="w-full accent-indigo-500 cursor-pointer"
                    value={weightKg || 70}
                    onChange={(e) => setWeightKg(parseFloat(e.target.value))}
                  />
                </div>
              </div>

              {/* Direct Weight Presets */}
              <div className="pt-5 border-t border-slate-805">
                <span className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest block mb-3">
                  Quick Weight Presets
                </span>
                <div className="grid grid-cols-2 xs:grid-cols-3 gap-2">
                  {[
                    { label: "Infant (5kg)", weight: 5 },
                    { label: "Child (20kg)", weight: 20 },
                    { label: "Pediatric (40kg)", weight: 40 },
                    { label: "Small Adult (55kg)", weight: 55 },
                    { label: "Standard (70kg)", weight: 70 },
                    { label: "Large Adult (90kg)", weight: 90 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setWeightKg(preset.weight)}
                      className={`text-xs px-2.5 py-2 rounded-xl border transition-all cursor-pointer font-semibold text-left ${
                        weightKg === preset.weight
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "bg-[#16191E] hover:bg-[#1E222B] border-slate-850 text-slate-350"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-805 flex justify-end">
              <button
                onClick={() => setIsWeightModalOpen(false)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs cursor-pointer"
              >
                Confirm Weight
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Add Dose Modal Pop-up Component */}
      {isAddDoseModalOpen && (
        <AddDoseModal
          weightKg={weightKg}
          onClose={() => setIsAddDoseModalOpen(false)}
          onAddDose={(data) => {
            handleAddDose(data);
            setIsAddDoseModalOpen(false);
          }}
        />
      )}

      {/* 4. Guidelines & Standalone Clinical Resources Menu Modal */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in text-slate-200">
          <div className="bg-[#111317] border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col animate-scale-in">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-[#161922] shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600/10 text-indigo-400 rounded-xl">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-black text-slate-100 uppercase tracking-widest">
                    Clinical Reference Station
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Decision support based on ASRA protocol standards</p>
                </div>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 hover:bg-slate-805 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal View switcher */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeRefView === "index" && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Big Red standlone LAST Card button trigger */}
                  <button
                    onClick={() => setActiveRefView("last-card")}
                    className="w-full flex items-center justify-between p-5 bg-red-950/40 hover:bg-red-950/65 border border-red-500/40 rounded-2xl cursor-pointer text-left transition-all"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="p-3 bg-red-650/45 border border-red-500/45 text-red-400 rounded-xl animate-pulse">
                        <LifeBuoy size={24} />
                      </div>
                      <div>
                        <span className="text-xs bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded font-extrabold uppercase text-[8px] tracking-wider">
                          Emergency Aid Case
                        </span>
                        <h4 className="text-base font-black text-red-200 mt-0.5 uppercase tracking-wide">
                          LAST Resuscitation Card
                        </h4>
                        <p className="text-xs text-red-300/80 mt-1">Weight-calculated Intralipid 20% dosing & sequential ASRA checklist</p>
                      </div>
                    </div>
                    <ArrowRight size={20} className="text-red-400" />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Database */}
                    <button
                      onClick={() => setActiveRefView("database")}
                      className="p-5 bg-slate-900 hover:bg-[#1E222B] border border-slate-805 rounded-2xl text-left cursor-pointer transition-all flex flex-col justify-between min-h-[140px]"
                    >
                      <div className="p-2.5 bg-indigo-650/10 text-indigo-400 rounded-lg w-fit">
                        <BookOpen size={18} />
                      </div>
                      <div className="mt-4">
                        <span className="text-xs font-black text-slate-100 uppercase tracking-wide block">Anesthetic Database</span>
                        <span className="text-[10px] text-slate-450 block mt-1">Dynamic weight limit tables & absolute ceil caps guide.</span>
                      </div>
                    </button>

                    {/* Dual class */}
                    <button
                      onClick={() => setActiveRefView("dual-caps")}
                      className="p-5 bg-slate-900 hover:bg-[#1E222B] border border-slate-805 rounded-2xl text-left cursor-pointer transition-all flex flex-col justify-between min-h-[140px]"
                    >
                      <div className="p-2.5 bg-indigo-650/10 text-indigo-400 rounded-lg w-fit">
                        <Scale size={18} />
                      </div>
                      <div className="mt-4">
                        <span className="text-xs font-black text-slate-100 uppercase tracking-wide block">Dual-Cap explanation</span>
                        <span className="text-[10px] text-slate-450 block mt-1">Rules on absolute caps vs weight-based calculations.</span>
                      </div>
                    </button>

                    {/* Guidelines */}
                    <button
                      onClick={() => setActiveRefView("guidelines")}
                      className="p-5 bg-slate-900 hover:bg-[#1E222B] border border-slate-805 rounded-2xl text-left cursor-pointer transition-all flex flex-col justify-between min-h-[140px]"
                    >
                      <div className="p-2.5 bg-indigo-650/10 text-indigo-400 rounded-lg w-fit">
                        <Info size={18} />
                      </div>
                      <div className="mt-4">
                        <span className="text-xs font-black text-slate-100 uppercase tracking-wide block">Pharmacology</span>
                        <span className="text-[10px] text-slate-450 block mt-1">LAST pathophysiology, symptoms, and ASRA emergency guidelines.</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* View standalone LAST emergency helper ALONE */}
              {activeRefView === "last-card" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="mb-4">
                    <button
                      onClick={() => setActiveRefView("index")}
                      className="px-3 py-1.5 bg-[#1E222B] hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      ← Back to Reference Menu
                    </button>
                  </div>
                  <ResuscitationHelper weightKg={weightKg} autoOpen={true} />
                </div>
              )}

              {/* View standalone database */}
              {activeRefView === "database" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="mb-4">
                    <button
                      onClick={() => setActiveRefView("index")}
                      className="px-3 py-1.5 bg-[#1E222B] hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      ← Back to Reference Menu
                    </button>
                  </div>
                  <ReferenceTable weightKg={weightKg} autoOpen={true} />
                </div>
              )}

              {/* View standalone dual caps */}
              {activeRefView === "dual-caps" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="mb-4">
                    <button
                      onClick={() => setActiveRefView("index")}
                      className="px-3 py-1.5 bg-[#1E222B] hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      ← Back to Reference Menu
                    </button>
                  </div>
                  
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs leading-relaxed text-slate-300">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                      <Scale className="text-indigo-400" size={18} />
                      <h4 className="text-sm font-black text-slate-100 uppercase tracking-widest">
                        Dual-Cap Safety Threshold Logic
                      </h4>
                    </div>
                    <p>
                      To ensure clinical correctness in maximum dosing limits across diverse body weights, the safety hub evaluates local anesthetics using a dynamic dual-cap limitation comparison algorithm:
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="p-4 bg-[#161922] border border-slate-805 rounded-xl space-y-1.5">
                        <span className="font-extrabold text-indigo-400 block uppercase tracking-wide text-[10px]">1. Weight-Based Limit ($mg/kg$)</span>
                        <p className="text-[11px] text-slate-400 leading-normal">
                          This is primary for children, infants, or smaller adults where absolute limits would be toxic. E.g. plain Lidocaine allows up to 4.5 mg/kg weight multipliers.
                        </p>
                      </div>

                      <div className="p-4 bg-[#161922] border border-slate-805 rounded-xl space-y-1.5">
                        <span className="font-extrabold text-indigo-400 block uppercase tracking-wide text-[10px]">2. Absolute Maximum Cap</span>
                        <p className="text-[11px] text-slate-400 leading-normal">
                          Provides protection in heavier or bariatric patients where multiplying mg/kg yields unsafe levels. Plain Lidocaine enforces a static absolute maximum limit of 300 mg.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 bg-indigo-950/20 border border-slate-800 text-indigo-400 rounded-xl font-bold mt-2.5 text-[11px]">
                      Mathematical Protection: The safety hub dynamically calculates safety caps using Math.min(weight-based, absolute maximum limit) to strictly enforce whichever cap is lower and clinically safer.
                    </div>
                  </div>
                </div>
              )}

              {/* View standalone pharmacology guidelines */}
              {activeRefView === "guidelines" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="mb-4">
                    <button
                      onClick={() => setActiveRefView("index")}
                      className="px-3 py-1.5 bg-[#1E222B] hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      ← Back to Reference Menu
                    </button>
                  </div>
                  
                  <div className="space-y-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-xs leading-relaxed text-slate-300">
                    <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
                      <Activity className="text-red-400" size={18} />
                      <h4 className="text-sm font-black text-slate-100 uppercase tracking-widest">
                        Pathophysiology & Resuscitation Guidelines
                      </h4>
                    </div>
                    
                    <div className="space-y-3 shrink-0">
                      <p>
                        Local Anesthetic Systemic Toxicity (LAST) occurs when systemic absorption of local anesthetic exceeds critical threshold plasma levels, impacting neural and cardiac conduction. It manifests as metallic taste, circumoral paresthesia, visual disturbances, and progresses to generalized tonic-clonic seizures, coma, or complete cardiovascular collapse.
                      </p>
                      <p>
                        <strong>Emergency support protocol calls for:</strong> air-way supervision using 100% oxygen to prevent respiratory acidosis; controlling toxic seizures with rapid administration of benzodiazepine (Midazolam preferred, relative avoid Propofol if unstable); and immediate Intralipid 20% rescue boluses and infusions.
                      </p>
                      <p className="font-bold text-red-400">
                        Never use vasopressin, calcium channel blockers, or beta blockers during LAST ACLS actions. epinephrine should be constrained to ultra-low absolute dosages (&lt; 1 mcg/kg).
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-900 text-center text-[9px] text-slate-500 border-t border-slate-805 uppercase tracking-widest font-extrabold shrink-0">
              ASRA Medical Reference Companion Utility
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
