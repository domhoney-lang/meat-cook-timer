/**
 * App Name: Meat Cook Timer
 * Description: Step-by-step roast timer for UK/EU meats with cut selection, weight (kg/lbs),
 *   fan/conventional oven, target internal temp, and a recommended schedule (UK FSA-style).
 * Changelog:
 *   - Multi-step flow: choose meat → cut (where applicable) → time & options
 *   - Fan / conventional oven toggle with suggested temps (160°C fan, 180°C conv)
 *   - Kg and lbs weight input with live roasting time calculation
 *   - Recommended schedule (remove from fridge 30m before, preheat, ready-at time)
 *   - Safety notes and resting reminder per meat type
 */

import React, { useState, useMemo } from 'react';
import { ChefHat, Timer, Thermometer, Info, Beef, Drumstick, Ham, Clock, ChevronLeft, ChevronRight, RotateCcw, Scale, Wind } from 'lucide-react';

// UK/EU Standard Meat Data with specific cuts and timing constants
const MEAT_TYPES = {
  chicken: {
    name: 'Whole Chicken',
    icon: <Drumstick className="w-6 h-6" />,
    hasCuts: false,
    variantLabel: 'Style',
    variants: [
      { id: 'standard', label: 'Standard Roast', minsPerKg: 45, extraMins: 20, internalTemp: 75 },
    ],
    defaultVariant: 'standard',
    safetyNote: 'Ensure juices run clear and internal temp reaches 75°C.'
  },
  beef: {
    name: 'Beef',
    icon: <Beef className="w-6 h-6" />,
    hasCuts: true,
    cuts: {
      topside: {
        label: 'Topside / Silverside',
        variants: [
          { id: 'rare', label: 'Rare', minsPerKg: 40, extraMins: 20, internalTemp: 52, color: 'bg-red-900' },
          { id: 'medium', label: 'Medium', minsPerKg: 50, extraMins: 25, internalTemp: 60, color: 'bg-pink-700' },
          { id: 'well', label: 'Well Done', minsPerKg: 60, extraMins: 30, internalTemp: 70, color: 'bg-stone-600' },
        ]
      },
      rib: {
        label: 'Rib on the Bone',
        variants: [
          { id: 'rare', label: 'Rare', minsPerKg: 30, extraMins: 20, internalTemp: 52, color: 'bg-red-900' },
          { id: 'medium', label: 'Medium', minsPerKg: 40, extraMins: 25, internalTemp: 60, color: 'bg-pink-700' },
          { id: 'well', label: 'Well Done', minsPerKg: 50, extraMins: 30, internalTemp: 70, color: 'bg-stone-600' },
        ]
      },
      fillet: {
        label: 'Fillet (Whole)',
        variants: [
          { id: 'rare', label: 'Rare', minsPerKg: 20, extraMins: 15, internalTemp: 52, color: 'bg-red-900' },
          { id: 'medium', label: 'Medium', minsPerKg: 30, extraMins: 15, internalTemp: 60, color: 'bg-pink-700' },
          { id: 'well', label: 'Well Done', minsPerKg: 40, extraMins: 15, internalTemp: 70, color: 'bg-stone-600' },
        ]
      }
    },
    defaultCut: 'topside',
    defaultVariant: 'medium',
    safetyNote: 'Rest for at least 20 minutes. Rib on the bone needs high heat initially for crackling.'
  },
  pork: {
    name: 'Pork',
    icon: <Ham className="w-6 h-6" />,
    hasCuts: true,
    cuts: {
      shoulder: {
        label: 'Shoulder (Rolled)',
        variants: [{ id: 'standard', label: 'Standard', minsPerKg: 70, extraMins: 30, internalTemp: 75 }]
      },
      loin: {
        label: 'Loin',
        variants: [{ id: 'standard', label: 'Standard', minsPerKg: 60, extraMins: 25, internalTemp: 71 }]
      },
      belly: {
        label: 'Belly',
        variants: [{ id: 'standard', label: 'Standard', minsPerKg: 70, extraMins: 30, internalTemp: 75 }]
      }
    },
    defaultCut: 'shoulder',
    defaultVariant: 'standard',
    safetyNote: 'Shoulder and Belly benefit from longer cooking to break down fat.'
  },
  lamb: {
    name: 'Lamb',
    icon: <Beef className="w-6 h-6" />,
    hasCuts: true,
    cuts: {
      leg: {
        label: 'Leg of Lamb',
        variants: [
          { id: 'pink', label: 'Medium/Pink', minsPerKg: 50, extraMins: 20, internalTemp: 60, color: 'bg-pink-600' },
          { id: 'well', label: 'Well Done', minsPerKg: 60, extraMins: 30, internalTemp: 70, color: 'bg-stone-600' },
        ]
      },
      shoulder: {
        label: 'Shoulder',
        variants: [
          { id: 'pink', label: 'Medium/Pink', minsPerKg: 60, extraMins: 25, internalTemp: 60, color: 'bg-pink-600' },
          { id: 'well', label: 'Well Done', minsPerKg: 75, extraMins: 30, internalTemp: 75, color: 'bg-stone-600' },
        ]
      },
      rack: {
        label: 'Rack of Lamb',
        variants: [
          { id: 'pink', label: 'Medium/Pink', minsPerKg: 35, extraMins: 10, internalTemp: 58, color: 'bg-pink-600' },
          { id: 'well', label: 'Well Done', minsPerKg: 45, extraMins: 15, internalTemp: 68, color: 'bg-stone-600' },
        ]
      }
    },
    defaultCut: 'leg',
    defaultVariant: 'pink',
    safetyNote: 'Lamb Shoulder benefits from a longer, slower roast.'
  },
  turkey: {
    name: 'Turkey',
    icon: <Drumstick className="w-6 h-6" />,
    hasCuts: true,
    cuts: {
      whole: {
        label: 'Whole Turkey',
        variants: [{ id: 'standard', label: 'Standard', minsPerKg: 40, extraMins: 20, internalTemp: 75 }]
      },
      crown: {
        label: 'Turkey Crown',
        variants: [{ id: 'standard', label: 'Standard', minsPerKg: 45, extraMins: 20, internalTemp: 75 }]
      }
    },
    defaultCut: 'whole',
    defaultVariant: 'standard',
    safetyNote: 'Check temperature at the thickest part.'
  },
  duck: {
    name: 'Duck',
    icon: <Drumstick className="w-6 h-6" />,
    hasCuts: false,
    variantLabel: 'Style',
    variants: [
      { id: 'standard', label: 'Whole Roast', minsPerKg: 50, extraMins: 20, internalTemp: 75 },
    ],
    defaultVariant: 'standard',
    safetyNote: 'Prick the skin to render fat.'
  }
};

const App = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedType, setSelectedType] = useState('chicken');
  const [selectedCut, setSelectedCut] = useState('whole');
  const [variantId, setVariantId] = useState('standard');
  const [weight, setWeight] = useState(1.5);
  const [isImperial, setIsImperial] = useState(false);
  const [isFanOven, setIsFanOven] = useState(true);

  const meatData = MEAT_TYPES[selectedType];
  const weightInKg = isImperial ? weight * 0.453592 : weight;

  const handleTypeSelect = (type) => {
    const data = MEAT_TYPES[type];
    setSelectedType(type);
    if (data.hasCuts) {
      setSelectedCut(data.defaultCut);
      setVariantId(data.cuts[data.defaultCut].variants[0].id);
      setCurrentStep(2);
    } else {
      setVariantId(data.defaultVariant);
      setCurrentStep(3);
    }
  };

  const handleCutSelect = (cutKey) => {
    setSelectedCut(cutKey);
    const cutData = meatData.cuts[cutKey];
    setVariantId(cutData.variants[0].id);
    setCurrentStep(3);
  };

  const calculation = useMemo(() => {
    let variant;
    if (meatData.hasCuts) {
      const cut = meatData.cuts[selectedCut];
      variant = cut.variants.find(v => v.id === variantId) || cut.variants[0];
    } else {
      variant = meatData.variants.find(v => v.id === variantId) || meatData.variants[0];
    }
    
    const totalMinutes = Math.round((weightInKg * variant.minsPerKg) + variant.extraMins);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    const now = new Date();
    const readyAt = new Date(now.getTime() + totalMinutes * 60000);
    const fridgeOut = new Date(now.getTime() - 30 * 60000);

    return {
      totalMinutes,
      hours,
      mins,
      internalTemp: variant.internalTemp,
      safetyNote: meatData.safetyNote,
      variantLabel: meatData.hasCuts ? (['lamb', 'beef'].includes(selectedType) ? 'Doneness' : 'Style') : meatData.variantLabel,
      availableVariants: meatData.hasCuts ? meatData.cuts[selectedCut].variants : meatData.variants,
      readyAt,
      fridgeOut,
      activeVariant: variant
    };
  }, [selectedType, selectedCut, variantId, weightInKg, meatData]);

  const SelectableOption = ({ label, isSelected, onClick, icon }) => (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all duration-300 ${
        isSelected 
        ? 'border-amber-500 bg-amber-500/10 text-amber-400 ring-1 ring-amber-500 shadow-lg shadow-amber-900/20' 
        : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
      }`}
    >
      {icon && <span className={`mb-3 transition-colors ${isSelected ? 'text-amber-500' : 'text-slate-500'}`}>{icon}</span>}
      <span className="text-sm font-bold text-center leading-tight uppercase tracking-wider">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 font-sans text-slate-100 flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-8">
        
        {/* Header */}
        <div className="flex flex-col items-center gap-6">
          <header className="flex items-center gap-3">
            <div className="bg-amber-600 p-2 rounded-xl shadow-lg shadow-amber-900/20">
              <ChefHat className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-black tracking-tighter text-white uppercase italic">Dom's Meat Cook Timer<span className="text-amber-500">v2</span></h1>
          </header>

          <div className="flex items-center gap-2 w-full max-w-xs">
            {[1, 2, 3].map((step) => (
              <div key={step} className={`h-1.5 rounded-full transition-all duration-500 flex-1 ${currentStep >= step ? 'bg-amber-500' : 'bg-slate-800'}`} />
            ))}
          </div>
        </div>

        <div className="min-h-fit">
          {currentStep === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center">
                <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Step 1: Choose Meat</h2>
                <p className="text-slate-500 font-medium">What's on the menu today?</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(MEAT_TYPES).map(([key, data]) => (
                  <SelectableOption key={key} label={data.name} icon={data.icon} isSelected={selectedType === key} onClick={() => handleTypeSelect(key)} />
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center">
                <button onClick={() => setCurrentStep(1)} className="inline-flex items-center gap-1 text-amber-500 text-xs font-bold uppercase tracking-widest mb-6 hover:opacity-75 transition-opacity">
                  <ChevronLeft className="w-4 h-4" /> Change Meat
                </button>
                <h2 className="text-3xl font-black text-white mb-2 tracking-tight">{meatData.name} Selection</h2>
                <p className="text-slate-500 font-medium">Select the specific cut</p>
              </div>
              <div className="max-w-md mx-auto space-y-3">
                {Object.entries(meatData.cuts).map(([key, cut]) => (
                  <button key={key} onClick={() => handleCutSelect(key)} className="flex items-center justify-between px-6 py-5 rounded-2xl border-2 border-slate-800 bg-slate-900/40 text-slate-300 hover:border-amber-500 hover:text-amber-400 transition-all w-full font-bold text-left">
                    <span>{cut.label}</span>
                    <ChevronRight className="w-5 h-5 opacity-30" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in zoom-in-95 duration-500">
              <div className="lg:col-span-7 space-y-6">
                <div className="flex items-center justify-between">
                  <button onClick={() => setCurrentStep(meatData.hasCuts ? 2 : 1)} className="inline-flex items-center gap-1 text-amber-500 text-xs font-bold uppercase tracking-widest hover:opacity-75 transition-opacity">
                    <ChevronLeft className="w-4 h-4" /> Go Back
                  </button>
                  <button onClick={() => setCurrentStep(1)} className="inline-flex items-center gap-1 text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">
                    <RotateCcw className="w-3.5 h-3.5" /> Start Over
                  </button>
                </div>

                <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-xl space-y-10">
                  <div className="flex flex-wrap gap-4 items-center justify-between border-b border-slate-800 pb-6">
                    <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
                      <button onClick={() => setIsImperial(false)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${!isImperial ? 'bg-amber-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>KG</button>
                      <button onClick={() => setIsImperial(true)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${isImperial ? 'bg-amber-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>LBS</button>
                    </div>
                    
                    <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
                      <button onClick={() => setIsFanOven(false)} className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${!isFanOven ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                        <Timer className="w-3 h-3" /> Conv
                      </button>
                      <button onClick={() => setIsFanOven(true)} className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${isFanOven ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                        <Wind className="w-3 h-3" /> Fan
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between items-end">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Weight of Roast</label>
                      <div className="flex items-center gap-2">
                        <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(Math.max(0, parseFloat(e.target.value) || 0))} className="w-24 p-2 bg-slate-950 border border-slate-800 rounded-xl text-center font-black text-amber-500 text-2xl focus:outline-none focus:border-amber-500" />
                        <span className="font-bold text-slate-500 text-sm uppercase">{isImperial ? 'lbs' : 'kg'}</span>
                      </div>
                    </div>
                    <input type="range" min="0.5" max="10" step="0.1" value={weight} onChange={(e) => setWeight(parseFloat(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-600" />
                  </div>

                  {calculation.availableVariants.length > 1 && (
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{calculation.variantLabel}</label>
                      <div className="grid grid-cols-3 gap-3">
                        {calculation.availableVariants.map(v => (
                          <button key={v.id} onClick={() => setVariantId(v.id)} className={`relative overflow-hidden group py-4 px-2 rounded-2xl border-2 transition-all ${variantId === v.id ? 'border-amber-500 bg-amber-500 text-black' : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'}`}>
                            <span className="relative z-10 font-black uppercase text-[10px] tracking-widest">{v.label}</span>
                            {v.color && <div className={`absolute bottom-0 left-0 w-full h-1 ${v.color}`} />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-5 space-y-4">
                <div className="bg-amber-600 text-white rounded-3xl p-7 shadow-2xl shadow-amber-950/40 flex flex-col gap-6 relative overflow-hidden ring-4 ring-amber-500/20">
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-amber-100" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-100">Roasting Time</span>
                    </div>
                    <div className="text-6xl font-black flex items-baseline gap-1 mb-6">
                      {calculation.hours > 0 && <>{calculation.hours}<span className="text-xl font-medium opacity-60">h</span></>}
                      {calculation.mins}<span className="text-xl font-medium opacity-60">m</span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div className="bg-black/15 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-4">
                        <Thermometer className="w-6 h-6 text-amber-100" />
                        <div>
                          <p className="text-[10px] font-bold uppercase opacity-50 mb-0.5 tracking-widest">Target Internal</p>
                          <p className="text-2xl font-black">{calculation.internalTemp}°C</p>
                        </div>
                      </div>

                      <div className="bg-black/15 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-4">
                        <Scale className="w-6 h-6 text-amber-100" />
                        <div>
                          <p className="text-[10px] font-bold uppercase opacity-50 mb-0.5 tracking-widest">Oven Temp</p>
                          <p className="text-2xl font-black">{isFanOven ? '160' : '180'}°C <span className="text-xs opacity-50 font-bold">{isFanOven ? 'Fan' : 'Conv'}</span></p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 pt-4 border-t border-white/20">
                    <div className="flex gap-3">
                      <Info className="w-4 h-4 shrink-0 opacity-80" />
                      <p className="text-[11px] font-medium leading-tight opacity-95">
                        {calculation.safetyNote} <span className="font-black block mt-1">Resting 20m is vital.</span>
                      </p>
                    </div>
                  </div>
                  <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-black/10 rounded-full blur-2xl"></div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-3 flex items-center gap-2">
                     <Timer className="w-3.5 h-3.5" /> Recommended Schedule
                   </h4>
                   <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-800">
                      <div className="relative pl-7">
                        <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-slate-800 border-4 border-slate-950" />
                        <p className="text-[10px] font-black text-slate-500 uppercase">Step 1: Prep</p>
                        <p className="text-xs text-slate-300 font-bold">Remove from fridge 30m before cooking.</p>
                      </div>
                      <div className="relative pl-7">
                        <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-amber-600/50 border-4 border-slate-950" />
                        <p className="text-[10px] font-black text-amber-500 uppercase">Step 2: Oven</p>
                        <p className="text-xs text-slate-300 font-bold">Preheat to {isFanOven ? '160' : '180'}°C.</p>
                      </div>
                      <div className="relative pl-7">
                        <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-amber-600 border-4 border-slate-950" />
                        <p className="text-[10px] font-black text-amber-500 uppercase">Step 3: Ready At</p>
                        <p className="text-xs text-white font-black">{calculation.readyAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <footer className="text-center text-slate-800 text-[10px] py-10 uppercase tracking-[0.4em] font-black">
          Precision Roasting &bull; UK FSA Guidelines &bull; 2024
        </footer>
      </div>
    </div>
  );
};

export default App;