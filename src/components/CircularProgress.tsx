import { motion } from "motion/react";

interface CircularProgressProps {
  value: number; // percentage from 0 to e.g. 150+
  size?: number;
  strokeWidth?: number;
}

export default function CircularProgress({
  value,
  size = 180,
  strokeWidth = 12,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  // Cap visual percentage at 100 for circle scaling, but let text show full amount
  const clampedValue = Math.min(value, 100);
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  // Determine colors and safety state
  let colorClass = "stroke-emerald-500 fill-transparent";
  let bgCircleClass = "stroke-emerald-100 fill-transparent dark:stroke-[#252A33]";
  let textClass = "text-emerald-600 dark:text-emerald-400";
  let statusText = "Safe Range";
  
  if (value >= 100) {
    colorClass = "stroke-red-500 fill-transparent";
    bgCircleClass = "stroke-red-100 fill-transparent dark:stroke-[#252A33]";
    textClass = "text-red-500 font-extrabold animate-pulse";
    statusText = "LIMIT EXCEEDED!";
  } else if (value >= 70) {
    colorClass = "stroke-amber-500 fill-transparent";
    bgCircleClass = "stroke-amber-100 fill-transparent dark:stroke-[#252A33]";
    textClass = "text-amber-500 font-semibold";
    statusText = "Warning, Near Threshold";
  }

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background Circle */}
        <circle
          className={bgCircleClass}
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Foreground Circle with smooth motion */}
        <motion.circle
          className={colorClass}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      
      {/* Centered Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-[#94A3B8] uppercase">
          Toxicity Load
        </span>
        <motion.div 
          className="flex items-baseline"
          animate={{ scale: value >= 100 ? [1, 1.08, 1] : 1 }}
          transition={{ repeat: value >= 100 ? Infinity : 0, duration: 1 }}
        >
          <span className={`text-4xl font-extrabold tracking-tight ${textClass}`}>
            {value.toFixed(1)}
          </span>
          <span className="text-sm font-medium text-slate-500 dark:text-[#94A3B8] ml-0.5">%</span>
        </motion.div>
        <span className={`text-[10px] block mt-2 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tight ${
          value >= 100 
            ? "bg-red-100 text-red-700 dark:bg-red-955/40 dark:text-red-400 dark:border dark:border-red-900/40 animate-bounce" 
            : value >= 70 
              ? "bg-amber-100 text-amber-700 dark:bg-amber-955/40 dark:text-amber-400 dark:border dark:border-amber-900/40" 
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-955/45 dark:text-emerald-400 dark:border dark:border-emerald-900/40"
        }`}>
          {statusText}
        </span>
      </div>
    </div>
  );
}
