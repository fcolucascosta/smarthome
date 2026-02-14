'use client';

import { useState } from 'react';
import { ColourData } from '@/types/tuya';
import HueRingPicker from './HueRingPicker';

interface ColorPresetsProps {
    value: ColourData;
    onChange: (color: ColourData) => void;
}

const PRESETS: { color: string; hsv: ColourData }[] = [
    { color: '#FFB74D', hsv: { h: 33, s: 690, v: 1000 } },
    { color: '#EF5350', hsv: { h: 0, s: 750, v: 1000 } },
    { color: '#AB47BC', hsv: { h: 291, s: 600, v: 900 } },
    { color: '#42A5F5', hsv: { h: 207, s: 750, v: 1000 } },
    { color: '#66BB6A', hsv: { h: 122, s: 600, v: 900 } },
    { color: '#29B6F6', hsv: { h: 199, s: 700, v: 980 } },
    { color: '#FFA726', hsv: { h: 25, s: 800, v: 1000 } },
    { color: '#EC407A', hsv: { h: 340, s: 700, v: 950 } },
];

export default function ColorPresets({ value, onChange }: ColorPresetsProps) {
    const [showCustom, setShowCustom] = useState(false);

    // Check if a preset is currently selected
    const isSelected = (preset: ColourData) =>
        Math.abs(preset.h - value.h) < 15 &&
        Math.abs(preset.s - value.s) < 150;

    return (
        <>
            <div className="flex flex-wrap gap-3 pb-2">
                {PRESETS.map((p, i) => {
                    const selected = isSelected(p.hsv);
                    return (
                        <button
                            key={i}
                            onClick={() => onChange(p.hsv)}
                            className="group relative w-10 h-10 rounded-full transition-all duration-300 ease-out"
                            title={`Preset ${i + 1}`}
                        >
                            <div
                                className={`absolute inset-0 rounded-full border-2 transition-all duration-300 ${selected ? 'border-[#E2E2E6] scale-110 opacity-100' : 'border-transparent scale-100 opacity-0'
                                    }`}
                            />
                            <div
                                className="absolute inset-[4px] rounded-full shadow-sm transition-transform duration-200 group-active:scale-90"
                                style={{ backgroundColor: p.color }}
                            />
                        </button>
                    );
                })}

                {/* Custom Color Button */}
                <button
                    onClick={() => setShowCustom(true)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-[#3E4759] text-[#C4C6D0] hover:bg-[#4a5569] transition-colors"
                    title="Cor personalizada"
                >
                    <span className="material-symbols-outlined text-xl">palette</span>
                </button>
            </div>

            {/* Custom Picker Modal */}
            {showCustom && (
                <HueRingPicker
                    value={value}
                    onChange={onChange}
                    onClose={() => setShowCustom(false)}
                />
            )}
        </>
    );
}
