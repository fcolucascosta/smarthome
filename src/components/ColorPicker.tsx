'use client';

import { useState } from 'react';
import { ColourData } from '@/types/tuya';
import HueRingPicker from './HueRingPicker';

interface ColorPresetsProps {
    value: ColourData;
    onChange: (color: ColourData) => void;
}

const PRESETS = [
    { color: '#FF0000', h: 0, s: 1000, v: 1000 },    // Red
    { color: '#FFA500', h: 30, s: 1000, v: 1000 },   // Orange
    { color: '#FFFF00', h: 60, s: 1000, v: 1000 },   // Yellow
    { color: '#008000', h: 120, s: 1000, v: 1000 },  // Green
    { color: '#00FFFF', h: 180, s: 1000, v: 1000 },  // Cyan
    { color: '#0000FF', h: 240, s: 1000, v: 1000 },  // Blue
    { color: '#800080', h: 300, s: 1000, v: 1000 },  // Purple
    { color: '#FF00FF', h: 330, s: 1000, v: 1000 },  // Magenta
];

export default function ColorPresets({ value, onChange }: ColorPresetsProps) {
    const [showCustom, setShowCustom] = useState(false);

    // Match based on Hue only (tolerance +/- 15 deg)
    // allowing brightness/saturation to change without losing selection
    const activeIndex = PRESETS.findIndex(p => {
        const diff = Math.abs(p.h - value.h);
        const dist = Math.min(diff, 360 - diff);
        return dist < 15;
    });

    return (
        <div className="flex flex-wrap gap-3 pb-2">
            {PRESETS.map((p, i) => {
                const isSelected = i === activeIndex;

                return (
                    <button
                        key={i}
                        onClick={() => onChange({ h: p.h, s: p.s, v: p.v })}
                        className="group relative w-10 h-10 rounded-full transition-all duration-300 ease-out"
                        title="Cor predefinida"
                    >
                        {/* Active Indicator Ring */}
                        <div
                            className={`absolute inset-0 rounded-full border-2 transition-all duration-300 ${isSelected
                                ? 'border-[#E2E2E6] scale-110 opacity-100'
                                : 'border-transparent scale-100 opacity-0'
                                }`}
                        />
                        {/* Color Circle */}
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

            {/* Custom Picker Modal */}
            {showCustom && (
                <HueRingPicker
                    value={value}
                    onChange={onChange}
                    onClose={() => setShowCustom(false)}
                />
            )}
        </div>
    );
}
