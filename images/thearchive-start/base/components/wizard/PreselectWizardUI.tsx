'use client';

import React, { useState, useEffect } from 'react';

export interface PreselectResult {
  step: 1 | 2;
  category: string;
  subCategory: string;
  detectedEra: string;
  confidence: number;
  baseValuationMin: number;
  baseValuationMax: number;
  finalValuation: number;
  rarityScore: number;
  conditionScore: number;
  repairImpact: number;
  aiPrompts: string[];
  selectedRepairs: string[];
  itemTitle: string;
  imageUrl: string;
}

const PRESET_SAMPLES = [
  {
    title: 'Star Wars Kenner Boba Fett Figure (1979)',
    category: 'Toys & Action Figures',
    subCategory: 'Kenner Star Wars 3.75"',
    era: '1970s (1979)',
    confidence: 98,
    baseMin: 3500,
    baseMax: 5000,
    imageUrl: 'https://images.unsplash.com/photo-1608889825205-eebdb9fc5806?w=600&auto=format&fit=crop&q=80',
    prompts: [
      'Photograph unpunched card slot tab under direct light',
      'Macro shot of figure foot stamp (Kenner 1979 CPG)',
      'Inspect bubble seal edges for stress fractures',
    ],
  },
  {
    title: 'Pink Floyd – Dark Side of the Moon (1st UK Harvest 1973)',
    category: 'Vinyl Records',
    subCategory: 'Rock / Progressive Vinyl',
    era: '1970s (1973)',
    confidence: 96,
    baseMin: 800,
    baseMax: 1400,
    imageUrl: 'https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=600&auto=format&fit=crop&q=80',
    prompts: [
      'Photograph Solid Blue Triangle vinyl label center',
      'Check matrix runout stamp SHVL 804 A-2 in dead wax',
      'Verify 2 original posters and 2 stickers completeness',
    ],
  },
  {
    title: 'Nintendo Game Boy DMG-01 (1989 Boxed)',
    category: 'Retro Gaming',
    subCategory: 'Handheld Consoles',
    era: '1980s (1989)',
    confidence: 95,
    baseMin: 600,
    baseMax: 1100,
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
    prompts: [
      'Inspect screen lens for horizontal lines or dead pixels',
      'Photograph serial number sticker inside battery bay',
      'Verify matching serial on original manual',
    ],
  },
];

interface RepairOption {
  id: string;
  name: string;
  cost: number;
  valueImpact: number;
  description: string;
}

const AVAILABLE_REPAIRS: RepairOption[] = [
  { id: 'clean', name: 'Professional Ultrasonic Cleaning', cost: 35, valueImpact: 120, description: 'Removes surface grime, dust, and oxidized residue' },
  { id: 'deyellow', name: 'UV De-Yellowing Treatment', cost: 45, valueImpact: 180, description: 'Restores original plastic clarity without chemical breakdown' },
  { id: 'grade', name: 'Archival Grading Encapsulation', cost: 85, valueImpact: 350, description: 'UV-shield acrylic slab with tamper-proof certificate' },
  { id: 'flatten', name: 'Precision Cardboard Flattening', cost: 30, valueImpact: 150, description: 'Controlled humidity press for warped cardbacks' },
];

export const PreselectWizardUI: React.FC<{
  onComplete?: (result: PreselectResult) => void;
}> = ({ onComplete }) => {
  // ponytail: wizard step state 1 or 2
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [selectedSampleIndex, setSelectedSampleIndex] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Step 2 calculator state
  const [conditionScore, setConditionScore] = useState(85); // 0-100
  const [completenessScore, setCompletenessScore] = useState(90); // 0-100
  const [selectedRepairIds, setSelectedRepairIds] = useState<string[]>(['clean', 'grade']);

  const activeSample = PRESET_SAMPLES[selectedSampleIndex];

  // ponytail: rapid 1-sec simulation loop for AI scanning response
  const triggerScan = (index: number) => {
    setSelectedSampleIndex(index);
    setIsScanning(true);
    setScanProgress(10);
  };

  useEffect(() => {
    if (!isScanning) return;
    const timer = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsScanning(false);
          return 100;
        }
        return prev + 30;
      });
    }, 150);
    return () => clearInterval(timer);
  }, [isScanning]);

  // Live Valuation Math
  const netRepairImpact = selectedRepairIds.reduce((sum, id) => {
    const r = AVAILABLE_REPAIRS.find((item) => item.id === id);
    return sum + (r ? r.valueImpact - r.cost : 0);
  }, 0);

  const baseAverage = (activeSample.baseMin + activeSample.baseMax) / 2;
  const conditionMultiplier = (conditionScore / 100) * 0.5 + (completenessScore / 100) * 0.5;
  const calculatedValuation = Math.round(baseAverage * conditionMultiplier + netRepairImpact);
  const calculatedRarity = Math.round(activeSample.confidence * 0.9 + (conditionScore / 100) * 10);

  const toggleRepair = (id: string) => {
    setSelectedRepairIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleFinishWizard = () => {
    const finalData: PreselectResult = {
      step: currentStep,
      category: activeSample.category,
      subCategory: activeSample.subCategory,
      detectedEra: activeSample.era,
      confidence: activeSample.confidence,
      baseValuationMin: activeSample.baseMin,
      baseValuationMax: activeSample.baseMax,
      finalValuation: calculatedValuation,
      rarityScore: calculatedRarity,
      conditionScore,
      repairImpact: netRepairImpact,
      aiPrompts: activeSample.prompts,
      selectedRepairs: selectedRepairIds,
      itemTitle: activeSample.title,
      imageUrl: activeSample.imageUrl,
    };
    if (onComplete) {
      onComplete(finalData);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
      {/* Wizard Progress Bar Header */}
      <div className="mb-8 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              2-STEP AI PRESELECT WIZARD
            </span>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
              {currentStep === 1 ? 'Step 1: Rapid 1-Sec Preselect' : 'Step 2: Targeted Deep Verification & Valuation'}
            </h2>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold">
            <span className={`px-3 py-1 rounded-full ${currentStep === 1 ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'}`}>
              1. PRESELECT
            </span>
            <span>→</span>
            <span className={`px-3 py-1 rounded-full ${currentStep === 2 ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'}`}>
              2. DEEP VERIFY
            </span>
          </div>
        </div>

        {/* Visual Progress Line */}
        <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden dark:bg-neutral-800">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: currentStep === 1 ? '50%' : '100%' }}
          ></div>
        </div>
      </div>

      {/* STEP 1: RAPID PRESELECT */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            Select a vintage sample object below or simulate an instant camera photo scan. AI will classify the category, era, and baseline value range in ~1 second.
          </div>

          {/* Sample Selector Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PRESET_SAMPLES.map((sample, idx) => (
              <button
                key={sample.title}
                onClick={() => triggerScan(idx)}
                className={`p-4 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${
                  selectedSampleIndex === idx
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-md dark:border-emerald-500 dark:bg-emerald-950/20'
                    : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-850'
                }`}
              >
                <div className="relative w-full h-32 mb-3 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700">
                  <img src={sample.imageUrl} alt={sample.title} className="w-full h-full object-cover" />
                  <span className="absolute top-2 right-2 bg-neutral-900/80 text-white px-2 py-0.5 text-[10px] font-mono rounded">
                    {sample.era}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 uppercase font-bold">{sample.category}</div>
                  <div className="text-sm font-semibold text-neutral-900 dark:text-white line-clamp-1">{sample.title}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Scanning Animation / Detection Results Card */}
          <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-neutral-900 p-6 text-white dark:border-neutral-800">
            {isScanning ? (
              <div className="py-12 text-center space-y-4">
                <div className="inline-block animate-spin text-3xl">⚡</div>
                <div className="text-lg font-mono font-bold text-emerald-400">AI NEURAL CLASSIFYING... ({scanProgress}%)</div>
                <div className="w-64 mx-auto bg-neutral-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full transition-all duration-150" style={{ width: `${scanProgress}%` }}></div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div>
                    <span className="text-xs font-mono text-emerald-400 uppercase">INSTANT DETECTION RESULT</span>
                    <h3 className="text-xl font-bold text-white">{activeSample.title}</h3>
                  </div>
                  <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 text-xs font-mono font-bold">
                    {activeSample.confidence}% MATCH CONFIDENCE
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                  <div className="rounded bg-neutral-800/80 p-3">
                    <div className="text-[10px] font-mono text-neutral-400 uppercase">PRIMARY CATEGORY</div>
                    <div className="text-sm font-bold text-white">{activeSample.category}</div>
                  </div>
                  <div className="rounded bg-neutral-800/80 p-3">
                    <div className="text-[10px] font-mono text-neutral-400 uppercase">SUB-TYPE</div>
                    <div className="text-sm font-bold text-white">{activeSample.subCategory}</div>
                  </div>
                  <div className="rounded bg-neutral-800/80 p-3">
                    <div className="text-[10px] font-mono text-neutral-400 uppercase">ESTIMATED ERA</div>
                    <div className="text-sm font-bold text-white">{activeSample.era}</div>
                  </div>
                  <div className="rounded bg-emerald-950/60 border border-emerald-500/30 p-3">
                    <div className="text-[10px] font-mono text-emerald-400 uppercase">BASE VALUE RANGE</div>
                    <div className="text-sm font-bold text-emerald-300">€{activeSample.baseMin} - €{activeSample.baseMax}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setCurrentStep(2)}
              disabled={isScanning}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-lg flex items-center space-x-2 disabled:opacity-50"
            >
              <span>Continue to Step 2: Deep Verification</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: TARGETED DEEP VERIFY */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {/* AI Live Action Prompts */}
          <div className="rounded-xl border border-amber-300 bg-amber-50/60 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
            <div className="flex items-center space-x-2 mb-2 text-xs font-mono font-bold text-amber-800 dark:text-amber-300 uppercase">
              <span>🎯 AI LIVE VERIFICATION PROMPTS</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {activeSample.prompts.map((prompt, idx) => (
                <div key={idx} className="rounded-lg bg-white p-3 border border-amber-200 shadow-sm dark:bg-neutral-900 dark:border-amber-900/40">
                  <div className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 mb-1">PROMPT #{idx + 1}</div>
                  <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200">{prompt}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Condition & Sizing Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                Condition & Packaging Assessment
              </h4>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono font-semibold">
                  <span>PACKAGING / SURFACE MINTNESS:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{conditionScore}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={conditionScore}
                  onChange={(e) => setConditionScore(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono font-semibold">
                  <span>COMPLETENESS & ACCESSORIES:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{completenessScore}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={completenessScore}
                  onChange={(e) => setCompletenessScore(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
            </div>

            {/* Repair & Restoration Impact Calculator */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-900 space-y-3">
              <h4 className="text-sm font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                Restoration & Value Boost Calculator
              </h4>
              <div className="space-y-2">
                {AVAILABLE_REPAIRS.map((repair) => {
                  const isSelected = selectedRepairIds.includes(repair.id);
                  return (
                    <button
                      key={repair.id}
                      onClick={() => toggleRepair(repair.id)}
                      className={`w-full p-2.5 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 text-neutral-900 dark:bg-emerald-950/40 dark:text-white'
                          : 'border-neutral-200 bg-white text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                      }`}
                    >
                      <div>
                        <div className="font-bold">{repair.name}</div>
                        <div className="text-[10px] text-neutral-500 dark:text-neutral-400">{repair.description}</div>
                      </div>
                      <div className="text-right ml-2 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        +€{repair.valueImpact - repair.cost}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Final Precise Valuation Output Card */}
          <div className="rounded-xl border-2 border-emerald-500 bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 p-6 text-white shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono text-emerald-400 uppercase font-bold tracking-widest">
                  DEEP VERIFIED APPRAISAL RESULT
                </span>
                <h3 className="text-3xl font-extrabold text-white">€{calculatedValuation.toLocaleString()}</h3>
                <div className="text-xs text-neutral-400 font-mono mt-1">
                  Net Repair Boost: +€{netRepairImpact} | Final Rarity Index: {calculatedRarity}/100
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 rounded-lg border border-neutral-700 bg-neutral-800 text-xs font-bold text-neutral-300 hover:bg-neutral-700"
                >
                  ← Back to Step 1
                </button>
                <button
                  onClick={handleFinishWizard}
                  className="px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-extrabold text-sm transition-all shadow-lg"
                >
                  Save to Vault Showcase ✓
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
