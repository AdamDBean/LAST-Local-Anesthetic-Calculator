import { useState, useMemo } from "react";
import { LifeBuoy, AlertCircle, CheckCircle, ShieldAlert, Heart, Activity } from "lucide-react";

interface ResuscitationHelperProps {
  weightKg: number;
  autoOpen?: boolean;
}

export default function ResuscitationHelper({ weightKg, autoOpen = false }: ResuscitationHelperProps) {
  const [isOpen, setIsOpen] = useState(autoOpen);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    stopAnesthetic: false,
    callHelp: false,
    manageAirway: false,
    seizureMeds: false,
    lipidsPrepped: false,
  });

  const toggleCheck = (key: string) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Live weight-based Intralipid 20% Rescue Dosing
  const lipidDoses = useMemo(() => {
    if (weightKg <= 0) return null;
    
    // Bolus: 1.5 mL/kg over 1 minute
    const bolusMl = 1.5 * weightKg;
    // Infusion: 0.25 mL/kg/min
    const infusionMlMin = 0.25 * weightKg;
    const infusionMlHr = infusionMlMin * 60;

    return {
      bolusMl,
      infusionMlMin,
      infusionMlHr,
      maxBolus: 100, // Typically max bolus is ~100ml, capped for larger patients occasionally
    };
  }, [weightKg]);

  return (
    <div id="last-rescue-section" className="bg-slate-900 dark:bg-brand-card text-white rounded-2xl shadow-lg border border-red-500/30 dark:border-red-500/40 overflow-hidden">
      {/* Visual Emergency Header */}
      <button
        type="button"
        id="btn-toggle-rescue"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left border-none focus:outline-none cursor-pointer bg-slate-900 hover:bg-slate-850/90 dark:bg-brand-card dark:hover:bg-brand-item/60 transition-all select-none"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-650/40 border border-red-500/40 text-red-500 rounded-lg animate-pulse">
            <LifeBuoy size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight uppercase text-red-400">LAST Bedside Resuscitation Aid</h2>
              <span className="text-[9px] bg-red-650/50 text-red-100 border border-red-500/40 px-1.5 py-0.5 rounded font-extrabold uppercase">
                ASRA Protocol
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-300 mt-1">Instant weight-calculated 20% Lipid Emulsion dosing & emergency safety checklist.</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-red-950/40 text-red-400 rounded-lg border border-red-950/60 dark:border-brand-border transition-all hover:bg-red-900/40">
          {isOpen ? "Hide Rescue Helper" : "Show Rescue Helper"}
        </span>
      </button>

      {isOpen && (
        <div className="p-5 border-t border-slate-800 dark:border-brand-border space-y-6">
          {/* Section 1: Dynamic Lipid Emulsion 20% Calculator */}
          <div className="bg-slate-850 dark:bg-brand-item border border-red-500/10 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Heart className="text-red-500" size={16} />
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-350">Intralipid 20% Resuscitation Dosing</h3>
            </div>
            
            {weightKg <= 0 ? (
              <p className="text-xs text-slate-405 italic">
                Set patient weight in the Demographics panel to automatically calculate precise emergency lipid doses.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bolus dose */}
                <div className="bg-slate-900/60 dark:bg-brand-card p-3.5 rounded-lg border border-slate-800 dark:border-brand-border flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">1. Initial IV Bolus</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">1.5 mL/kg over 1 minute</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-extrabold text-red-400 font-mono">
                      {lipidDoses?.bolusMl.toFixed(1)}
                    </span>
                    <span className="text-xs ml-1 font-bold text-slate-400">mL</span>
                  </div>
                </div>

                {/* Continuous Infusion */}
                <div className="bg-slate-900/60 dark:bg-brand-card p-3.5 rounded-lg border border-slate-800 dark:border-brand-border flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">2. Continuous Infusion</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">0.25 mL/kg/min intravenously</span>
                  </div>
                  <div className="text-right">
                    <div className="flex items-baseline justify-end gap-1">
                      <span className="text-xl font-extrabold text-red-400 font-mono">
                        {lipidDoses?.infusionMlMin.toFixed(1)}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">mL/min</span>
                    </div>
                    <span className="text-[9px] text-slate-500 block">
                      (≈ {lipidDoses?.infusionMlHr.toFixed(0)} mL/hr)
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {weightKg > 0 && (
              <p className="text-[10px] text-slate-400 dark:text-slate-350 leading-normal bg-slate-950/45 dark:bg-brand-card p-2.5 rounded border border-slate-800 dark:border-brand-border">
                <strong>Administration Rules:</strong> If cardiovascular stability is not restored, repeat bolus dose 1-2 times (every 3-5 mins), or double the infusion rate to 0.5 mL/kg/min (approx <strong>{(lipidDoses?.infusionMlMin || 0 * 2).toFixed(1)} mL/min</strong>). Max limit of total lipid given is 12 mL/kg over 30 mins.
              </p>
            )}
          </div>

          {/* Section 2: Resuscitation Checklist checkboxes */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Activity size={14} className="text-slate-400" />
              Emergency Response Sequential Guide
            </h3>
            
            <div className="space-y-2">
              {[
                {
                  key: "stopAnesthetic",
                  title: "1. Stop Anesthetic Immediate",
                  desc: "Turn off irrigation or halt additional infiltrations immediately.",
                },
                {
                  key: "callHelp",
                  title: "2. Summon Emergency Rescue Kit",
                  desc: "Request LAST toolkit + Intralipid 20%. alert nearby anesthesia/resuscitation personnel.",
                },
                {
                  key: "manageAirway",
                  title: "3. Establish Airway Supervision",
                  desc: "Ventilate with 100% Oxygen. Avoid hyperventilation (to protect brain blood supply & avoid respiratory alkalosis which lowers seizure threshold).",
                },
                {
                  key: "seizureMeds",
                  title: "4. Control Seizures (Benzodiazepines)",
                  desc: "Use Midazolam or Diazepam. Avoid Propofol or Thiopental if cardiovascular depression is suspected.",
                },
                {
                  key: "lipidsPrepped",
                  title: "5. Initiate Lipid Emulsion Recovery",
                  desc: "Run the weight-calculated lipid doses above. For pediatric dosages, strict calculation oversight is requested.",
                },
              ].map((item) => (
                <div
                  key={item.key}
                  id={`rescue-check-${item.key}`}
                  onClick={() => toggleCheck(item.key)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                    checklist[item.key]
                      ? "bg-slate-850 dark:bg-brand-item border-emerald-500/30 text-slate-200"
                      : "bg-slate-900 dark:bg-brand-card border-slate-800 dark:border-brand-border hover:bg-slate-850/50 hover:dark:bg-[#252A33] text-slate-350"
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {checklist[item.key] ? (
                      <CheckCircle className="text-emerald-500" size={18} />
                    ) : (
                      <div className="w-[18px] h-[18px] rounded-full border border-slate-700 dark:border-brand-border-light bg-slate-950 flex items-center justify-center text-[10px] text-slate-500 font-bold" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <span className={`text-xs font-bold block ${checklist[item.key] ? "text-emerald-400 line-through" : ""}`}>
                      {item.title}
                    </span>
                    <p className="text-[11px] text-slate-450 dark:text-slate-400 leading-normal">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Critical Contraindications / Modifications */}
          <div className="p-3.5 bg-red-955/20 border border-red-500/10 rounded-xl space-y-1.5 text-xs text-red-200">
            <span className="font-bold flex items-center gap-1">
              <ShieldAlert size={14} className="text-red-400 shrink-0" />
              ACLS Modifications for LAST
            </span>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-300 leading-relaxed">
              <li><strong>Avoid Vasopressin, Calcium Channel Blockers, and Beta Blockers:</strong> These exacerbate myocardial depression or LAST severity.</li>
              <li><strong>Limit Epinephrine:</strong> If required, use extra low epinephrine doses (&lt; 1 mcg/kg or &lt; 70-100 mcg total) to prevent arrhythmias.</li>
              <li><strong>Amiodarone is Preferred:</strong> For ventricular arrhythmias. Avoid lidocaine/procainamide as they belong to the same pharmacological class!</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
