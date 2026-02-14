'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { ColourData, hsvToHsl } from '@/types/tuya';

interface HueRingPickerProps {
    value: ColourData;
    onChange: (color: ColourData) => void;
    onClose: () => void;
}

export default function HueRingPicker({ value, onChange, onClose }: HueRingPickerProps) {
    const [hue, setHue] = useState(value.h);
    const ringRef = useRef<HTMLDivElement>(null);
    const dragging = useRef(false);

    // Sync internal state
    useEffect(() => { setHue(value.h); }, [value.h]);

    const calcHue = useCallback((clientX: number, clientY: number) => {
        if (!ringRef.current) return hue;
        const rect = ringRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const angle = Math.atan2(clientY - cy, clientX - cx);
        let deg = (angle * 180) / Math.PI + 90;
        if (deg < 0) deg += 360;
        return Math.round(deg) % 360;
    }, [hue]);

    const handleMove = useCallback((cx: number, cy: number) => {
        const newHue = calcHue(cx, cy);
        setHue(newHue);
        // Don't commit change immediately to avoid spam, or do we?
        // Let's commit on drag end or throttling.
        // For smoothness, we can just update local preview, but props expects valid color.
        // We'll update parent continuously for "live" feel, debounce is handled in DeviceCard.
        onChange({ h: newHue, s: value.s, v: value.v });
    }, [calcHue, onChange, value.s, value.v]);

    const onPointerDown = (e: React.PointerEvent) => {
        dragging.current = true;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        handleMove(e.clientX, e.clientY);
    };

    const onPointerMove = (e: React.PointerEvent) => {
        if (!dragging.current) return;
        handleMove(e.clientX, e.clientY);
    };

    const onPointerUp = () => { dragging.current = false; };

    // Render variables
    const size = 220;
    const thickness = 24;
    const radius = size / 2 - thickness / 2;
    // Thumb position
    const angleRad = ((hue - 90) * Math.PI) / 180;
    const tx = size / 2 + radius * Math.cos(angleRad);
    const ty = size / 2 + radius * Math.sin(angleRad);
    const currentColor = hsvToHsl(hue, value.s, value.v);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div
                className="bg-[#1F1F23] p-6 rounded-[2rem] shadow-2xl flex flex-col items-center gap-6 border border-[#2B2930]"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-medium text-[#E2E2E6]">Escolher Cor</h3>

                {/* Ring */}
                <div
                    className="relative touch-none select-none"
                    style={{ width: size, height: size }}
                >
                    {/* Conic Gradient Track */}
                    <div
                        ref={ringRef}
                        className="w-full h-full rounded-full shadow-lg"
                        style={{
                            background: `conic-gradient(
                hsl(0, 100%, 50%),
                hsl(60, 100%, 50%),
                hsl(120, 100%, 50%),
                hsl(180, 100%, 50%),
                hsl(240, 100%, 50%),
                hsl(300, 100%, 50%),
                hsl(360, 100%, 50%)
              )`,
                            mask: `radial-gradient(transparent ${size / 2 - thickness}px, black ${size / 2 - thickness + 1}px)`,
                            WebkitMask: `radial-gradient(transparent ${size / 2 - thickness}px, black ${size / 2 - thickness + 1}px)`,
                        }}
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                    />

                    {/* Thumb */}
                    <div
                        className="absolute w-8 h-8 rounded-full border-4 border-white shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
                        style={{
                            left: tx,
                            top: ty,
                            backgroundColor: `hsl(${hue}, 100%, 50%)`
                        }}
                    />

                    {/* Center Preview */}
                    <div
                        className="absolute inset-0 m-auto w-24 h-24 rounded-full shadow-inner"
                        style={{ backgroundColor: currentColor }}
                    />
                </div>

                {/* Action Button */}
                <button
                    onClick={onClose}
                    className="w-full bg-[#A8C7FA] text-[#062E6F] font-medium py-3 rounded-xl hover:bg-[#D6E3FF] transition-colors"
                >
                    Confirmar
                </button>
            </div>
        </div>
    );
}
