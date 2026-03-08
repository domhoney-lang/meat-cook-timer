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
import { ChefHat, Timer, Thermometer, Info, Beef, Drumstick, Ham, Clock, ChevronLeft, ChevronRight, RotateCcw, Scale, Wind, Plus, Minus } from 'lucide-react';

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
  const [isPlanningMode, setIsPlanningMode] = useState(false);
  const [eatAtTime, setEatAtTime] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2);
    const minutes = d.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 15) * 15;
    d.setMinutes(roundedMinutes);
    return d.toTimeString().slice(0, 5);
  });

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

  const adjustEatTime = (minutes) => {
    const [h, m] = eatAtTime.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m + minutes);
    setEatAtTime(date.toTimeString().slice(0, 5));
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
    const restingMinutes = 20;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    const now = new Date();
    let startAt, ovenOutAt, readyAt;

    if (isPlanningMode) {
      const [h, m] = eatAtTime.split(':').map(Number);
      readyAt = new Date();
      readyAt.setHours(h, m, 0, 0);
      if (readyAt < now) {
        // If time passed, assume tomorrow for logical planning
        readyAt.setDate(readyAt.getDate() + 1);
      }
      ovenOutAt = new Date(readyAt.getTime() - restingMinutes * 60000);
      startAt = new Date(ovenOutAt.getTime() - totalMinutes * 60000);
    } else {
      startAt = now;
      ovenOutAt = new Date(now.getTime() + totalMinutes * 60000);
      readyAt = new Date(ovenOutAt.getTime() + restingMinutes * 60000);
    }

    const fridgeOut = new Date(startAt.getTime() - 30 * 60000);

    return {
      totalMinutes,
      restingMinutes,
      hours,
      mins,
      internalTemp: variant.internalTemp,
      safetyNote: meatData.safetyNote,
      variantLabel: meatData.hasCuts ? (['lamb', 'beef'].includes(selectedType) ? 'Doneness' : 'Style') : meatData.variantLabel,
      availableVariants: meatData.hasCuts ? meatData.cuts[selectedCut].variants : meatData.variants,
      startAt,
      ovenOutAt,
      readyAt,
      fridgeOut,
      activeVariant: variant
    };
  }, [selectedType, selectedCut, variantId, weightInKg, meatData]);

  const SelectableOption = ({ label, isSelected, onClick, icon }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 sm:p-6 min-h-[88px] sm:min-h-0 rounded-3xl border-2 transition-all duration-300 touch-manipulation ${
        isSelected 
        ? 'border-amber-600 bg-amber-600/10 text-amber-200 ring-1 ring-amber-600 shadow-lg shadow-amber-900/20' 
        : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-600 active:bg-slate-800/60'
      }`}
    >
      {icon && <span className={`mb-2 sm:mb-3 transition-colors ${isSelected ? 'text-amber-500' : 'text-slate-400'}`}>{icon}</span>}
      <span className="text-sm font-bold text-center leading-tight uppercase tracking-wider">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-950 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:p-8 font-sans text-slate-100 flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-8">
        
        {/* Header */}
        <div className="flex flex-col items-center gap-6">
          <header className="flex items-center gap-3">
            <div className="bg-amber-700 p-2 rounded-xl shadow-lg shadow-amber-900/30">
              <ChefHat className="text-white w-6 h-6" />
            </div>
            <h1 className="text-lg sm:text-xl font-black tracking-tighter text-white uppercase italic">Dom's Roast Pro</h1>
          </header>

          <div className="flex items-center gap-2 w-full max-w-xs">
            {[1, 2, 3].map((step) => (
              <div key={step} className={`h-1.5 rounded-full transition-all duration-500 flex-1 ${currentStep >= step ? 'bg-amber-600' : 'bg-slate-800'}`} />
            ))}
          </div>
        </div>

        <div className="min-h-fit">
          {currentStep === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">Choose Meat</h2>
                <p className="text-slate-400 font-medium">What's on the menu today?</p>
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
                <button type="button" onClick={() => setCurrentStep(1)} className="inline-flex items-center gap-1 text-amber-400 text-sm font-bold uppercase tracking-widest mb-6 py-2.5 -my-2 min-h-[44px] justify-center hover:opacity-90 active:opacity-100 transition-opacity touch-manipulation">
                  <ChevronLeft className="w-4 h-4" /> Change Meat
                </button>
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">{meatData.name} Selection</h2>
                <p className="text-slate-400 font-medium">Select the specific cut</p>
              </div>
              <div className="max-w-md mx-auto space-y-3">
                {Object.entries(meatData.cuts).map(([key, cut]) => (
                  <button type="button" key={key} onClick={() => handleCutSelect(key)} className="flex items-center justify-between px-6 py-4 min-h-[52px] rounded-2xl border-2 border-slate-800 bg-slate-900/40 text-slate-200 text-sm font-bold hover:border-amber-600 hover:text-amber-300 active:bg-slate-800/60 transition-all w-full text-left touch-manipulation">
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
                <div className="flex items-center justify-between gap-2">
                  <button type="button" onClick={() => setCurrentStep(meatData.hasCuts ? 2 : 1)} className="inline-flex items-center gap-1 text-amber-400 text-sm font-bold uppercase tracking-widest py-2.5 min-h-[44px] hover:opacity-90 active:opacity-100 transition-opacity touch-manipulation">
                    <ChevronLeft className="w-4 h-4 shrink-0" /> Go Back
                  </button>
                  <button type="button" onClick={() => setCurrentStep(1)} className="inline-flex items-center gap-1 text-slate-400 text-sm font-bold uppercase tracking-widest py-2.5 min-h-[44px] hover:text-white active:text-slate-200 transition-colors touch-manipulation">
                    <RotateCcw className="w-3.5 h-3.5 shrink-0" /> Start Over
                  </button>
                </div>

                <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 md:p-8 border border-slate-800 shadow-xl space-y-8 md:space-y-10">
                  <div className="flex flex-wrap gap-3 sm:gap-4 items-center justify-between border-b border-slate-800 pb-5 md:pb-6">
                    <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
                      <button type="button" onClick={() => setIsImperial(false)} className={`min-h-[44px] px-4 py-2.5 rounded-lg text-sm font-black uppercase transition-all touch-manipulation ${!isImperial ? 'bg-amber-700 text-white' : 'text-slate-400 hover:text-slate-200 active:bg-slate-800'}`}>KG</button>
                      <button type="button" onClick={() => setIsImperial(true)} className={`min-h-[44px] px-4 py-2.5 rounded-lg text-sm font-black uppercase transition-all touch-manipulation ${isImperial ? 'bg-amber-700 text-white' : 'text-slate-400 hover:text-slate-200 active:bg-slate-800'}`}>LBS</button>
                    </div>
                    
                    <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
                      <button type="button" onClick={() => setIsFanOven(false)} className={`min-h-[44px] px-3 py-2.5 rounded-lg text-sm font-black uppercase transition-all flex items-center gap-2 touch-manipulation ${!isFanOven ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-200 active:bg-slate-800'}`}>
                        <Timer className="w-3.5 h-3.5 shrink-0" /> Conv
                      </button>
                      <button type="button" onClick={() => setIsFanOven(true)} className={`min-h-[44px] px-3 py-2.5 rounded-lg text-sm font-black uppercase transition-all flex items-center gap-2 touch-manipulation ${isFanOven ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-200 active:bg-slate-800'}`}>
                        <Wind className="w-3.5 h-3.5 shrink-0" /> Fan
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                      <button type="button" onClick={() => setIsPlanningMode(false)} className={`flex-1 min-h-[44px] rounded-lg text-sm font-bold uppercase transition-all ${!isPlanningMode ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>Start Now</button>
                      <button type="button" onClick={() => setIsPlanningMode(true)} className={`flex-1 min-h-[44px] rounded-lg text-sm font-bold uppercase transition-all ${isPlanningMode ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>Plan Meal</button>
                    </div>
                    
                    {isPlanningMode && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                         <div className="flex flex-wrap items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-2 px-3 sm:px-4 gap-2">
                            <span className="text-slate-400 text-sm font-bold uppercase tracking-widest shrink-0">Eat At:</span>
                            
                            <div className="flex items-center gap-1 sm:gap-2 bg-slate-900/50 rounded-lg p-1 ml-auto">
                              <button 
                                type="button"
                                onClick={() => adjustEatTime(-15)}
                                className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors active:bg-slate-700 touch-manipulation"
                                aria-label="Subtract 15 minutes"
                              >
                                <Minus className="w-5 h-5" />
                              </button>

                              <input 
                                type="time" 
                                value={eatAtTime} 
                                onChange={(e) => setEatAtTime(e.target.value)}
                                className="bg-transparent text-white text-xl sm:text-2xl font-black focus:outline-none text-center appearance-none w-[5.5rem] sm:w-28 border-0 p-0"
                              />

                              <button 
                                type="button"
                                onClick={() => adjustEatTime(15)}
                                className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors active:bg-slate-700 touch-manipulation"
                                aria-label="Add 15 minutes"
                              >
                                <Plus className="w-5 h-5" />
                              </button>
                            </div>
                         </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-5 md:space-y-6">
                    <div className="flex flex-wrap justify-between items-end gap-3">
                      <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Weight of Roast</label>
                      <div className="flex items-center gap-2">
                        <input type="number" step="0.1" min={0.5} max={10} value={weight} onChange={(e) => setWeight(Math.max(0, parseFloat(e.target.value) || 0))} className="w-24 p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-center font-black text-amber-400 text-xl sm:text-2xl focus:outline-none focus:border-amber-600 touch-manipulation" aria-label="Weight" />
                        <span className="font-bold text-slate-400 text-sm uppercase">{isImperial ? 'lbs' : 'kg'}</span>
                      </div>
                    </div>
                    <input type="range" min="0.5" max="10" step="0.1" value={weight} onChange={(e) => setWeight(parseFloat(e.target.value))} className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-700 touch-manipulation" aria-label="Weight slider" />
                  </div>

                  {calculation.availableVariants.length > 1 && (
                    <div className="space-y-3 md:space-y-4">
                      <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">{calculation.variantLabel}</label>
                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        {calculation.availableVariants.map(v => (
                          <button type="button" key={v.id} onClick={() => setVariantId(v.id)} className={`relative overflow-hidden group min-h-[44px] py-3 px-2 rounded-2xl border-2 transition-all touch-manipulation ${variantId === v.id ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-600 active:bg-slate-800'}`}>
                            <span className="relative z-10 font-black uppercase text-xs tracking-widest">{v.label}</span>
                            {v.color && variantId !== v.id && <div className={`absolute bottom-0 left-0 w-full h-1 ${v.color}`} />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-5 space-y-4">
                <div className="bg-amber-700 text-white rounded-3xl p-5 sm:p-6 md:p-7 shadow-2xl shadow-amber-950/40 flex flex-col gap-5 md:gap-6 relative overflow-hidden ring-4 ring-amber-600/30">
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-amber-100" />
                      <span className="text-xs font-black uppercase tracking-[0.2em] text-amber-100">Roasting Time</span>
                    </div>
                    <div className="text-5xl sm:text-6xl font-black flex items-baseline gap-1 mb-5 md:mb-6">
                      {calculation.hours > 0 && <>{calculation.hours}<span className="text-xl font-medium opacity-60">h</span></>}
                      {calculation.mins}<span className="text-xl font-medium opacity-60">m</span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div className="bg-black/15 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-4">
                        <Thermometer className="w-6 h-6 text-amber-100" />
                        <div>
                          <p className="text-xs font-bold uppercase opacity-90 mb-0.5 tracking-widest">Target Internal</p>
                          <p className="text-2xl font-black">{calculation.internalTemp}°C</p>
                        </div>
                      </div>

                      <div className="bg-black/15 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-4">
                        <Scale className="w-6 h-6 text-amber-100" />
                        <div>
                          <p className="text-xs font-bold uppercase opacity-90 mb-0.5 tracking-widest">Oven Temp</p>
                          <p className="text-2xl font-black">{isFanOven ? '160' : '180'}°C <span className="text-xs opacity-80 font-bold">{isFanOven ? 'Fan' : 'Conv'}</span></p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 pt-4 border-t border-white/20">
                    <div className="flex gap-3">
                      <Info className="w-4 h-4 shrink-0 opacity-80" />
                      <p className="text-sm font-medium leading-tight opacity-95">
                        {calculation.safetyNote} <span className="font-black block mt-1">Resting 20m is vital.</span>
                      </p>
                    </div>
                  </div>
                  <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-black/10 rounded-full blur-2xl"></div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
                   <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-3 flex items-center gap-2">
                     <Timer className="w-3.5 h-3.5" /> Recommended Schedule
                   </h4>
                   <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-800">
                      <div className="relative pl-7">
                        <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-slate-700 border-4 border-slate-950" />
                        <p className="text-xs font-black text-slate-400 uppercase">Step 1: Prep</p>
                        <p className="text-sm text-slate-300 font-bold">
                          {calculation.fridgeOut.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} &bull; Remove from fridge
                        </p>
                      </div>
                      <div className="relative pl-7">
                        <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-amber-700/60 border-4 border-slate-950" />
                        <p className="text-xs font-black text-amber-400 uppercase">Step 2: Oven In</p>
                        <p className="text-sm text-slate-300 font-bold">
                          {calculation.startAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} &bull; Preheat to {isFanOven ? '160' : '180'}°C
                        </p>
                      </div>
                      <div className="relative pl-7">
                        <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-amber-700 border-4 border-slate-950" />
                        <p className="text-xs font-black text-amber-400 uppercase">Step 3: Rest</p>
                        <p className="text-sm text-slate-300 font-bold">
                          {calculation.ovenOutAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} &bull; Foil & towels ({calculation.restingMinutes}m)
                        </p>
                      </div>
                      <div className="relative pl-7">
                        <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-white border-4 border-slate-950" />
                        <p className="text-xs font-black text-white uppercase">Step 4: Serve</p>
                        <p className="text-sm text-white font-black">{calculation.readyAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <footer className="text-center text-slate-600 text-xs py-8 md:py-10 pb-[max(1.5rem,env(safe-area-inset-bottom))] uppercase tracking-[0.4em] font-black">
          Precision Roasting &bull; UK FSA Guidelines &bull; 2026
        </footer>
      </div>
    </div>
  );
};

export default App;