/**
 * Meat Cook Timer / Dom's Roast Pro
 *
 * Changelog:
 *   - Start Now vs Plan Meal (eat-at time) with schedule and overdue (red) state
 *   - Serve Time card in Roasting Time section (Start Now); Recommended Schedule step highlighting
 *   - Chef's Tip (Gemini API), sticky header with back/start over, fan oven 10% time reduction
 *   - Meat/cut/doneness selection, kg/lbs, fan/conventional (180°C / 200°C), 20 min rest, UK FSA-style timings
 */

import React, { useState, useMemo, useEffect } from 'react';
import { ChefHat, Timer, Thermometer, Info, Beef, Drumstick, Ham, Clock, ChevronLeft, ChevronRight, RotateCcw, Scale, Wind, Plus, Minus, Sparkles } from 'lucide-react';

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
          { id: 'well', label: 'Well Done', minsPerKg: 60, extraMins: 30, internalTemp: 71, color: 'bg-stone-600' },
        ]
      },
      rib: {
        label: 'Rib on the Bone',
        variants: [
          { id: 'rare', label: 'Rare', minsPerKg: 30, extraMins: 20, internalTemp: 52, color: 'bg-red-900' },
          { id: 'medium', label: 'Medium', minsPerKg: 40, extraMins: 25, internalTemp: 60, color: 'bg-pink-700' },
          { id: 'well', label: 'Well Done', minsPerKg: 50, extraMins: 30, internalTemp: 71, color: 'bg-stone-600' },
        ]
      },
      fillet: {
        label: 'Fillet (Whole)',
        variants: [
          { id: 'rare', label: 'Rare', minsPerKg: 20, extraMins: 15, internalTemp: 52, color: 'bg-red-900' },
          { id: 'medium', label: 'Medium', minsPerKg: 30, extraMins: 15, internalTemp: 60, color: 'bg-pink-700' },
          { id: 'well', label: 'Well Done', minsPerKg: 40, extraMins: 15, internalTemp: 71, color: 'bg-stone-600' },
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
          { id: 'well', label: 'Well Done', minsPerKg: 60, extraMins: 30, internalTemp: 71, color: 'bg-stone-600' },
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
          { id: 'well', label: 'Well Done', minsPerKg: 45, extraMins: 15, internalTemp: 71, color: 'bg-stone-600' },
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
  const [currentTime, setCurrentTime] = useState(new Date());
  const [chefTip, setChefTip] = useState(null);
  const [isLoadingTip, setIsLoadingTip] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  // On home (step 1), catch swipe-back / browser back so the user doesn't leave the site
  useEffect(() => {
    if (currentStep !== 1) return;
    const url = window.location.pathname + window.location.search || '/';
    history.pushState({ meatCookTimer: true, step: 1 }, '', url);
    const handlePopState = () => {
      history.pushState({ meatCookTimer: true, step: 1 }, '', url);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentStep]);

  const meatData = MEAT_TYPES[selectedType];
  const weightInKg = isImperial ? weight * 0.453592 : weight;

  const handleTypeSelect = (type) => {
    const data = MEAT_TYPES[type];
    setSelectedType(type);
    
    // Logic to update state for cuts/variants
    let nextVariant;
    if (data.hasCuts) {
      setSelectedCut(data.defaultCut);
      const cut = data.cuts[data.defaultCut];
      const preferredId = data.defaultVariant;
      const defaultVariantId = cut.variants.some(v => v.id === preferredId) ? preferredId : cut.variants[0].id;
      setVariantId(defaultVariantId);
      nextVariant = cut.variants.find(v => v.id === defaultVariantId);
      setCurrentStep(2);
    } else {
      setVariantId(data.defaultVariant);
      nextVariant = data.variants.find(v => v.id === data.defaultVariant);
      setCurrentStep(3);
    }

    // If in planning mode, ensure the schedule is valid for the new meat
    if (isPlanningMode && nextVariant) {
      const weightKg = isImperial ? weight * 0.453592 : weight;
      const totalMins = Math.round((weightKg * nextVariant.minsPerKg) + nextVariant.extraMins);
      const restingMins = 20;
      const prepMins = 30;
      const totalProcess = totalMins + restingMins + prepMins;
      
      const [h, m] = eatAtTime.split(':').map(Number);
      let ready = new Date();
      ready.setHours(h, m, 0, 0);
      
      // If the set time is in the past for today, assume it means tomorrow
      // But we need to check if *starting* now for that time is possible
      const now = new Date();
      if (ready < now) ready.setDate(ready.getDate() + 1);
      
      const requiredStart = new Date(ready.getTime() - totalProcess * 60000);
      
      // If we would have had to start in the past, reset the eat time
      if (requiredStart < now) {
        const newReady = new Date(now.getTime() + totalProcess * 60000);
        const minutes = newReady.getMinutes();
        const rounded = Math.ceil(minutes / 15) * 15;
        newReady.setMinutes(rounded);
        setEatAtTime(newReady.toTimeString().slice(0, 5));
      }
    }
  };

  const handleCutSelect = (cutKey) => {
    setSelectedCut(cutKey);
    const cutData = meatData.cuts[cutKey];
    const preferredId = meatData.defaultVariant;
    const defaultVariantId = cutData.variants.some(v => v.id === preferredId) ? preferredId : cutData.variants[0].id;
    setVariantId(defaultVariantId);
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
    
    let calculatedMinutes = (weightInKg * variant.minsPerKg) + variant.extraMins;
    if (isFanOven) {
      calculatedMinutes *= 0.9; // Fan ovens are typically ~10% faster/more efficient
    }
    const totalMinutes = Math.round(calculatedMinutes);
    const restingMinutes = 20;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    const now = new Date();
    let startAt, ovenOutAt, readyAt, fridgeOut, ovenOnAt;

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
      ovenOnAt = new Date(startAt.getTime() - 10 * 60000); // 10 mins before cooking starts
      fridgeOut = new Date(startAt.getTime() - 30 * 60000);
    } else {
      fridgeOut = now;
      ovenOnAt = new Date(now.getTime() + 20 * 60000); // 20m after fridge out (10m before cooking)
      startAt = new Date(now.getTime() + 30 * 60000);
      ovenOutAt = new Date(startAt.getTime() + totalMinutes * 60000);
      readyAt = new Date(ovenOutAt.getTime() + restingMinutes * 60000);
    }

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
      ovenOnAt,
      ovenOutAt,
      readyAt,
      fridgeOut,
      activeVariant: variant
    };
  }, [selectedType, selectedCut, variantId, weightInKg, meatData, isPlanningMode, eatAtTime]);

  // Auto-fetch chef tip with debounce
  useEffect(() => {
    if (currentStep !== 3) return;
    
    // Clear previous tip when params change to encourage fresh look
    // But maybe keep it if it's just a small weight change? 
    // Let's keep it simple: fresh tip for fresh parameters.
    // Actually, setting chefTip to null causes "Get a professional..." text to flash.
    // Let's just let the loading state handle it.
    
    const timer = setTimeout(() => {
      fetchChefTip();
    }, 1500);

    return () => clearTimeout(timer);
  }, [currentStep, selectedType, selectedCut, variantId, weight]);

  const fetchChefTip = async () => {
    setIsLoadingTip(true);
    setChefTip(null);
    try {
      const variant = calculation.activeVariant;
      const response = await fetch('/api/generate-tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meat: meatData.name,
          cut: meatData.hasCuts ? meatData.cuts[selectedCut].label : 'Whole',
          weight: `${weight} ${isImperial ? 'lbs' : 'kg'}`,
          doneness: variant.label
        })
      });
      
      const data = await response.json();
      if (data.tip) {
        setChefTip(data.tip);
      } else {
        setChefTip("Focus on resting the meat adequately; it makes all the difference.");
      }
    } catch (error) {
      console.error("Failed to fetch tip", error);
      setChefTip("Ensure your oven is fully preheated before starting.");
    } finally {
      setIsLoadingTip(false);
    }
  };

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

  // Plan meal is "overdue" if the chosen eat-at time (today) has already passed
  const eatAtToday = new Date();
  const [eatH, eatM] = eatAtTime.split(':').map(Number);
  eatAtToday.setHours(eatH, eatM, 0, 0);
  const isPlanOverdue = isPlanningMode && eatAtToday < currentTime;

  return (
    <div className="min-h-screen bg-slate-950 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:p-8 font-sans text-slate-100 flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-8">
        
        {/* Header */}
        <div className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md w-[calc(100%+2rem)] -ml-4 px-4 md:w-full md:ml-0 md:px-0 py-2 md:py-4 -mt-4 md:-mt-8 flex flex-col items-center gap-3 shadow-sm shadow-black/20 border-b border-white/5 relative">
          
          {currentStep > 1 && (
            <button 
              onClick={() => setCurrentStep(currentStep === 3 && meatData.hasCuts ? 2 : 1)}
              className="absolute left-2 md:left-0 top-3 md:top-5 p-2 text-slate-400 hover:text-white transition-colors z-20"
              aria-label="Back"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          <button onClick={() => setCurrentStep(1)} className="flex items-center gap-3 hover:opacity-80 transition-opacity w-auto z-10">
            <div className="bg-amber-700 p-2 rounded-xl shadow-lg shadow-amber-900/30">
              <ChefHat className="text-white w-6 h-6" />
            </div>
            <div className="text-left">
              <h1 className={`font-black tracking-tighter text-white uppercase italic transition-all ${currentStep > 1 ? 'text-xs text-slate-400' : 'text-lg sm:text-xl'}`}>My Roast Pro</h1>
              {currentStep > 1 && (
                <div className="flex flex-wrap items-baseline gap-x-2 animate-in fade-in slide-in-from-left-2">
                  <span className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight leading-none">{meatData.name}</span>
                  {meatData.hasCuts && <span className="text-sm sm:text-base font-bold text-amber-500 uppercase tracking-wide leading-none">{meatData.cuts[selectedCut].label}</span>}
                </div>
              )}
            </div>
          </button>

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
                      <button type="button" onClick={() => {
                        setIsPlanningMode(false);
                        // Reset schedule to start now
                      }} className={`flex-1 min-h-[44px] rounded-lg text-sm font-bold uppercase transition-all ${!isPlanningMode ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>Start Now</button>
                      <button type="button" onClick={() => {
                        setIsPlanningMode(true);
                        // Set default eat time to earliest possible completion
                        const now = new Date();
                        const totalProcessMinutes = calculation.totalMinutes + calculation.restingMinutes + 30; // +30 for prep
                        const earliestReady = new Date(now.getTime() + totalProcessMinutes * 60000);
                        const minutes = earliestReady.getMinutes();
                        const rounded = Math.ceil(minutes / 15) * 15;
                        earliestReady.setMinutes(rounded);
                        setEatAtTime(earliestReady.toTimeString().slice(0, 5));
                      }} className={`flex-1 min-h-[44px] rounded-lg text-sm font-bold uppercase transition-all ${isPlanningMode ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>Plan Meal</button>
                    </div>
                    
                    {isPlanningMode && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                         <div className="flex flex-wrap items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-2 px-3 sm:px-4 gap-2">
                            <span className="text-white text-sm font-bold uppercase tracking-widest shrink-0 flex items-center gap-2">
                              <Clock className="w-5 h-5 text-white" />
                              Eat At:
                            </span>
                            
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
                                className="bg-transparent text-white text-xl sm:text-2xl font-black focus:outline-none text-center appearance-none w-[7rem] sm:w-32 border-0 p-0 [color-scheme:dark]"
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
                      {!isPlanningMode && (
                        <div className="bg-black/15 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-4">
                          <Timer className="w-6 h-6 text-amber-100" />
                          <div>
                            <p className="text-xs font-bold uppercase opacity-90 mb-0.5 tracking-widest">Serve Time</p>
                            <p className="text-2xl font-black">{calculation.readyAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                      )}
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
                          <p className="text-2xl font-black">{isFanOven ? '180' : '200'}°C <span className="text-xs opacity-80 font-bold">{isFanOven ? 'Fan' : 'Conv'}</span></p>
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

                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-6">
                   <h4 className="text-sm font-black text-amber-500 uppercase tracking-widest border-b border-slate-800 pb-4 flex items-center gap-2">
                     <Timer className="w-5 h-5 text-slate-500" /> Recommended Schedule
                   </h4>
                   <div className={`space-y-6 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] ${isPlanOverdue ? 'before:bg-red-800' : 'before:bg-slate-800'}`}>
                      {[
                        { 
                          time: calculation.fridgeOut, 
                          endTime: calculation.ovenOnAt,
                          label: 'Step 1: Prep', 
                          detail: 'Remove from fridge',
                          isLast: false 
                        },
                        { 
                          time: calculation.ovenOnAt, 
                          endTime: calculation.startAt,
                          label: 'Step 2: Turn On Oven', 
                          detail: `Preheat to ${isFanOven ? '180' : '200'}°C`,
                          isLast: false 
                        },
                        { 
                          time: calculation.startAt, 
                          endTime: calculation.ovenOutAt,
                          label: 'Step 3: Meat In', 
                          detail: `Roast for ${calculation.hours > 0 ? calculation.hours + 'h ' : ''}${calculation.mins}m`,
                          isLast: false 
                        },
                        { 
                          time: calculation.ovenOutAt, 
                          endTime: calculation.readyAt,
                          label: 'Step 4: Rest', 
                          detail: `Foil & towels (${calculation.restingMinutes}m)`,
                          isLast: false 
                        },
                        { 
                          time: calculation.readyAt, 
                          endTime: null, // End of timeline
                          label: 'Step 5: Serve', 
                          detail: '', // No detail text needed or different style
                          isLast: true 
                        }
                      ].map((step, idx) => {
                        // Step is "past" if its end has passed; last step (Serve) has no endTime so use step.time
                        const stepEnd = step.endTime ?? step.time;
                        const isPast = currentTime >= stepEnd;
                        // In Plan Meal: red if this step's recommended time is before now
                        const stepRecommendedBeforeNow = isPlanningMode && currentTime > step.time;
                        // Red when whole plan overdue, or step ended, or (plan mode) step's scheduled time is before now
                        const isStepOverdue = isPlanOverdue || isPast || stepRecommendedBeforeNow;
                        const isCurrent = !isPlanningMode && !isPast && currentTime >= step.time;
                        const isFuture = !isPast && !isCurrent;
                        
                        return (
                          <div key={idx} className={`relative pl-8 transition-opacity duration-500 ${isStepOverdue || isCurrent ? 'opacity-100' : 'opacity-40'}`}>
                            <div className={`absolute left-0 top-1 w-5 h-5 rounded-full border-4 border-slate-950 transition-colors duration-500 z-10 ${
                              isStepOverdue ? 'bg-red-600' :
                              isCurrent ? 'bg-amber-500 scale-125 shadow-[0_0_15px_rgba(245,158,11,0.6)]' : 
                              isPast ? 'bg-slate-600' : 
                              'bg-slate-800'
                            }`} />
                            <p className={`text-sm font-black uppercase transition-colors duration-500 mb-1 ${
                              isStepOverdue ? 'text-red-400' :
                              isCurrent ? 'text-amber-400' : 
                              isPast ? 'text-slate-500' : 
                              'text-slate-500'
                            }`}>
                              {step.label} {isCurrent && <span className="inline-block ml-2 text-[10px] bg-amber-900/40 text-amber-300 px-1.5 py-0.5 rounded animate-pulse align-middle">NOW</span>}
                            </p>
                            <p className={`text-lg font-bold transition-colors duration-500 leading-tight ${
                              isStepOverdue ? 'text-red-300' :
                              isCurrent ? 'text-white' : 
                              isPast ? 'text-slate-500' : 
                              'text-slate-300'
                            }`}>
                              {step.time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              {step.detail && <span className="opacity-80 block sm:inline sm:ml-2 text-base font-medium"> {step.detail}</span>}
                            </p>
                          </div>
                        );
                      })}
                   </div>
                </div>

                {/* Chef's Tip Section */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Chef's Tip
                    </h4>
                  </div>
                  
                  {isLoadingTip ? (
                    <div className="flex items-center gap-3 text-slate-400 animate-pulse">
                      <div className="w-4 h-4 rounded-full bg-slate-700"></div>
                      <div className="h-2 bg-slate-700 rounded w-2/3"></div>
                    </div>
                  ) : chefTip ? (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <p className="text-slate-300 text-sm font-medium leading-relaxed italic">"{chefTip}"</p>
                      <button 
                        onClick={fetchChefTip}
                        className="mt-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" /> New Tip
                      </button>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-xs italic">
                      Consulting our AI chef...
                    </p>
                  )}
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