export interface AnestheticAgent {
  name: string;
  wgtMax: number;     // mg/kg
  totalMax: number;   // Absolute maximum in mg
  commonConcs: number[]; // typical concentrations in % for quick selection
}

export interface AdministeredDose {
  id: string;
  agentName: string;
  concentration: number; // in %
  volume: number;        // in mL
  calculatedMg: number;  // volume * concentration * 10
  percentOfMax: number;  // (calculatedMg / safeMaxForWeight) * 100
  timestamp: string;     // Time logged
}

export interface PlannedDose {
  agentName: string;
  concentration: number; // in %
}

export const ANESTHETIC_DATABASE: Record<string, Omit<AnestheticAgent, 'name'>> = {
  "Bupivicaine": {
    "wgtMax": 2.5,
    "totalMax": 175,
    "commonConcs": [0.25, 0.5, 0.75]
  },
  "Bupivicaine + Epi": {
    "wgtMax": 3,
    "totalMax": 200,
    "commonConcs": [0.25, 0.5, 0.75]
  },
  "Lidocaine": {
    "wgtMax": 4.5,
    "totalMax": 300,
    "commonConcs": [0.5, 1.0, 1.5, 2.0]
  },
  "Lidocaine + Epi": {
    "wgtMax": 7,
    "totalMax": 500,
    "commonConcs": [0.5, 1.0, 1.5, 2.0]
  },
  "Ropivicaine": {
    "wgtMax": 3,
    "totalMax": 200,
    "commonConcs": [0.2, 0.5, 0.75, 1.0]
  },
  "Mepivacaine": {
    "wgtMax": 7,
    "totalMax": 400,
    "commonConcs": [1.0, 1.5, 2.0, 3.0]
  },
  "Chloroprocaine": {
    "wgtMax": 3,
    "totalMax": 200,
    "commonConcs": [1.0, 2.0, 3.0]
  },
  "Chloroprocaine + Epi": {
    "wgtMax": 4.5,
    "totalMax": 300,
    "commonConcs": [1.0, 2.0, 3.0]
  },
  "Procaine": {
    "wgtMax": 7,
    "totalMax": 350,
    "commonConcs": [1.0, 2.0, 10.0]
  },
  "Prilocaine": {
    "wgtMax": 8,
    "totalMax": 500, // Becomes 600 if patient > 70kg
    "commonConcs": [1.0, 2.0, 3.0, 4.0]
  },
  "Levobupivicaine": {
    "wgtMax": 2,
    "totalMax": 150,
    "commonConcs": [0.25, 0.5, 0.75]
  }
};

export function getSafeMaxMg(agentName: string, weightKg: number): number {
  const agent = ANESTHETIC_DATABASE[agentName];
  if (!agent) return 0;
  
  let absoluteMax = agent.totalMax;
  // Special rule for Prilocaine: total max is increased to 600 mg if patient is > 70kg
  if (agentName === "Prilocaine" && weightKg > 70) {
    absoluteMax = 600;
  }
  
  const weightBasedLimit = weightKg * agent.wgtMax;
  return Math.min(weightBasedLimit, absoluteMax);
}
