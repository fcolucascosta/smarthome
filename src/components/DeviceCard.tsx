'use client';

import { useState, useCallback, useRef } from 'react';
import {
    TuyaDevice, getStatusValue, parseColourData,
    ColourData, WorkMode,
    DEVICE_CATEGORY, STATUS_CODES,
} from '@/types/tuya';
import axios from 'axios';
import ColorPresets from './ColorPicker';

interface DeviceCardProps {
    device: TuyaDevice;
    customName?: string;
    isEditing?: boolean;
    isHidden?: boolean;
    onRename?: (name: string) => void;
    onToggleHidden?: () => void;
}

function MIcon({ name, size = 20, className = '', style = {} }: { name: string; size?: number; className?: string; style?: React.CSSProperties }) {
    return (
        <span
            className={`material-symbols-outlined select-none ${className}`}
            style={{ fontSize: size, ...style }}
        >
            {name}
        </span>
    );
}

/* ─── Magnetism Helper ─── */
const applyMagnetism = (val: number) => {
    const SNAP_POINTS = [10, 250, 500, 750, 1000]; // 1%, 25%, 50%, 75%, 100%
    const THRESHOLD = 50; // 5% snap range

    const closest = SNAP_POINTS.reduce((prev, curr) =>
        Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev
    );

    return Math.abs(val - closest) <= THRESHOLD ? closest : val;
};

export default function DeviceCard({
    device,
    customName,
    isEditing = false,
    isHidden = false,
    onRename,
    onToggleHidden
}: DeviceCardProps) {
    const isLight = device.category === DEVICE_CATEGORY.LIGHT;
    const displayName = customName || device.name;

    const powerCode = isLight ? STATUS_CODES.SWITCH_LED : STATUS_CODES.SWITCH_1;
    /* ─── Helpers ─── */
    // Gamma correction for natural brightness perception
    const GAMMA = 2.5;
    const MAX_VAL = 1000;
    const MIN_VAL = 10;

    // Linear slider (0-1000) -> Logarithmic power (10-1000)
    const toLogarithmic = (linear: number): number => {
        const normalized = linear / MAX_VAL;
        const logValue = Math.pow(normalized, GAMMA) * MAX_VAL;
        return Math.max(MIN_VAL, Math.round(logValue));
    };

    // Logarithmic power (10-1000) -> Linear slider (0-1000)
    const toLinear = (log: number): number => {
        const normalized = log / MAX_VAL;
        const linearValue = Math.pow(normalized, 1 / GAMMA) * MAX_VAL;
        return Math.round(linearValue);
    };

    const initialPower = getStatusValue<boolean>(device, powerCode) ?? false;
    // Initialize brightness as LINEAR value for the slider
    const rawBrightness = getStatusValue<number>(device, STATUS_CODES.BRIGHTNESS) ?? 500;
    const initialBrightness = toLinear(rawBrightness);

    const initialColorTemp = getStatusValue<number>(device, STATUS_CODES.COLOR_TEMP) ?? 500;
    const initialWorkMode = getStatusValue<WorkMode>(device, STATUS_CODES.WORK_MODE) ?? 'white';
    const initialColour = parseColourData(getStatusValue(device, STATUS_CODES.COLOR_DATA));

    const [isOn, setIsOn] = useState(initialPower);
    const [brightness, setBrightness] = useState(initialBrightness); // Linear state
    const [colorTemp, setColorTemp] = useState(initialColorTemp);
    const [workMode, setWorkMode] = useState<WorkMode>(initialWorkMode);
    const [colour, setColour] = useState<ColourData>(initialColour);
    const [error, setError] = useState('');
    const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

    const sendCommand = useCallback(async (commands: { code: string; value: any }[]) => {
        try {
            const res = await axios.post('/api/control', { deviceId: device.id, commands });
            if (!res.data?.success) {
                setError(res.data?.msg || 'Erro');
                setTimeout(() => setError(''), 4000);
                return false;
            }
            return true;
        } catch {
            setError('Erro');
            setTimeout(() => setError(''), 4000);
            return false;
        }
    }, [device.id]);

    const debounced = useCallback((key: string, commands: { code: string; value: any }[]) => {
        if (debounceTimers.current[key]) clearTimeout(debounceTimers.current[key]);
        debounceTimers.current[key] = setTimeout(() => sendCommand(commands), 350);
    }, [sendCommand]);

    /* ─── Handlers ─── */
    const controlsDisabled = !device.online || isEditing;

    /* ─── Handlers ─── */
    const togglePower = async () => {
        if (isEditing || !device.online) return;

        const next = !isOn;
        setIsOn(next); // Optimistic

        const success = await sendCommand([{ code: powerCode, value: next }]);
        if (!success) setIsOn(!next); // Revert
    };

    const ensureOn = (logBrightness?: number) => {
        if (!isOn) {
            setIsOn(true);
            const commands: { code: string; value: any }[] = [{ code: powerCode, value: true }];
            // If turning on with specific brightness, include it
            if (logBrightness) commands.push({ code: STATUS_CODES.BRIGHTNESS, value: logBrightness });
            sendCommand(commands);
        }
    };

    const handleBrightness = useCallback((rawVal: number) => {
        if (isEditing) return;
        const val = applyMagnetism(rawVal);
        setBrightness(val); // UI updates linearly

        const logValue = toLogarithmic(val); // Convert to log for device

        if (!isOn) {
            ensureOn(logValue);
        } else {
            debounced('brightness', [{ code: STATUS_CODES.BRIGHTNESS, value: logValue }]);
        }
    }, [isEditing, debounced, isOn, sendCommand]);

    const handleColorTemp = useCallback((val: number) => {
        if (isEditing) return;
        setColorTemp(val);
        ensureOn();
        debounced('colortemp', [{ code: STATUS_CODES.COLOR_TEMP, value: val }]);
    }, [isEditing, debounced, isOn, powerCode, sendCommand]);

    const handleWorkMode = (mode: WorkMode) => {
        if (isEditing) return;
        if (workMode === mode) return;
        setWorkMode(mode);
        ensureOn();
        sendCommand([{ code: STATUS_CODES.WORK_MODE, value: mode }]);
    };

    const handleColour = useCallback((c: ColourData) => {
        if (isEditing) return;
        setColour(c);
        ensureOn();

        const colourStr = JSON.stringify({ h: c.h, s: c.s, v: c.v });
        const commands = [
            { code: STATUS_CODES.WORK_MODE, value: 'colour' },
            { code: STATUS_CODES.COLOR_DATA, value: colourStr }
        ];

        debounced('colour', commands);
        if (workMode !== 'colour') setWorkMode('colour');
    }, [isEditing, debounced, workMode, isOn, powerCode, sendCommand]);

    const handleColourBrightness = useCallback((rawVal: number) => {
        if (isEditing) return;
        const val = applyMagnetism(rawVal);
        const newColour = { ...colour, v: val };
        setColour(newColour);
        setBrightness(val); // Sync main brightness
        ensureOn();

        const colourStr = JSON.stringify({ h: newColour.h, s: newColour.s, v: newColour.v });
        debounced('colour', [{ code: STATUS_CODES.COLOR_DATA, value: colourStr }]);
    }, [isEditing, colour, debounced, isOn, powerCode, sendCommand]);

    const handleRenameClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newName = window.prompt("Novo nome para o dispositivo:", displayName);
        if (newName && newName.trim() !== "" && onRename) {
            onRename(newName.trim());
        }
    };

    const brightPercent = Math.round((brightness / 1000) * 100);
    const tempPercent = Math.round((colorTemp / 1000) * 100);
    const colourBrightPercent = Math.round((colour.v / 1000) * 100);



    /* ─── EDIT OVERLAY ─── */
    const EditOverlay = () => (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-[2px] rounded-[28px] flex items-center justify-center gap-4 animate-fade-in">
            <button
                onClick={(e) => { e.stopPropagation(); onToggleHidden?.(); }}
                className="flex flex-col items-center gap-2 group"
            >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isHidden ? 'bg-[#3E4759] text-[#C4C6D0]' : 'bg-[#A8C7FA] text-[#062E6F]'
                    }`}>
                    <MIcon name={isHidden ? 'visibility_off' : 'visibility'} size={24} />
                </div>
                <span className="text-xs font-medium text-[#E2E2E6]">{isHidden ? 'Oculto' : 'Visível'}</span>
            </button>

            <button
                onClick={handleRenameClick}
                className="flex flex-col items-center gap-2 group"
            >
                <div className="w-12 h-12 rounded-full bg-[#3E4759] text-[#E2E2E6] flex items-center justify-center hover:bg-[#4a5569] transition-all">
                    <MIcon name="edit" size={24} />
                </div>
                <span className="text-xs font-medium text-[#E2E2E6]">Renomear</span>
            </button>
        </div>
    );

    /* ─── SWITCH TILE ─── */
    if (!isLight) {
        return (
            <div
                className="relative p-5 flex flex-col justify-between h-36 transition-all duration-300 cursor-pointer group hover:bg-[#2B2930]"
                style={{
                    background: 'var(--md-surface-container)',
                    borderRadius: 'var(--md-shape-xl)',
                    opacity: isHidden && !isEditing ? 0.5 : 1,
                }}
            >
                {isEditing && <EditOverlay />}

                <div className="flex justify-between items-start">
                    <MIcon
                        name="power"
                        size={32}
                        className="transition-colors duration-300"
                        style={{ color: isOn ? 'var(--md-primary)' : 'var(--md-on-surface-variant)' }}
                    />
                    <label className="m3-switch" onClick={(e) => e.stopPropagation()}>
                        <input
                            type="checkbox"
                            checked={isOn}
                            onChange={togglePower}
                            disabled={!device.online || isEditing}
                        />
                        <span className="slider"></span>
                    </label>
                </div>
                <div>
                    <h3 className="text-base font-semibold truncate" style={{ color: 'var(--md-on-surface)' }}>
                        {displayName}
                    </h3>
                    <p className="text-sm font-medium mt-0.5" style={{
                        color: !device.online
                            ? 'var(--md-outline)'
                            : isOn ? 'var(--md-primary)' : 'var(--md-on-surface-variant)',
                    }}>
                        {!device.online ? 'Offline' : isOn ? 'Ligado' : 'Desligado'}
                    </p>
                </div>
            </div>
        );
    }

    /* ─── LIGHT CARD ─── */
    return (
        <div
            className="relative p-5 flex flex-col gap-5 transition-colors"
            style={{
                background: 'var(--md-surface-container)',
                borderRadius: 'var(--md-shape-xl)',
                opacity: isHidden && !isEditing ? 0.5 : 1,
            }}
        >
            {isEditing && <EditOverlay />}

            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div
                        className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300"
                        style={{
                            background: isOn ? 'var(--md-secondary-container)' : '#2B2930',
                        }}
                    >
                        <MIcon
                            name="lightbulb"
                            size={24}
                            style={{
                                color: isOn ? 'var(--md-on-secondary-container)' : '#C4C6D0',
                            }}
                        />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold tracking-tight" style={{ color: '#E2E2E6' }}>
                            {displayName}
                        </h3>
                        <p className="text-sm font-medium tracking-wide" style={{ color: '#C4C6D0' }}>
                            {!device.online ? 'Offline' : isOn ? 'LIGADO' : 'DESLIGADO'}
                        </p>
                    </div>
                </div>

                <label className="m3-switch" onClick={(e) => isEditing && e.preventDefault()}>
                    <input
                        type="checkbox"
                        checked={isOn}
                        onChange={togglePower}
                        disabled={!device.online || isEditing}
                    />
                    <span className="slider"></span>
                </label>
            </div>

            {/* Tabs */}
            <div
                className="segmented-btn"
                style={{
                    opacity: !isOn ? 0.5 : controlsDisabled ? 0.3 : 1,
                    pointerEvents: controlsDisabled ? 'none' : 'auto',
                }}
            >
                <button
                    className={workMode === 'white' ? 'active' : ''}
                    onClick={() => handleWorkMode('white')}
                >
                    <MIcon name="wb_sunny" size={20} />
                    Branco
                </button>
                <button
                    className={workMode === 'colour' ? 'active' : ''}
                    onClick={() => handleWorkMode('colour')}
                >
                    <MIcon name="palette" size={20} />
                    Cor
                </button>
            </div>

            {/* Controls Container */}
            <div
                className="flex flex-col gap-4"
                style={{
                    opacity: !isOn ? 0.5 : controlsDisabled ? 0.3 : 1,
                    pointerEvents: controlsDisabled ? 'none' : 'auto',
                }}
            >
                {workMode === 'white' ? (
                    <>
                        {/* Brightness */}
                        <div className="flex items-center gap-3">
                            <div className="brightness-bar group flex-1">
                                <div className="brightness-bar__fill" style={{ width: `${brightPercent}%` }} />
                                <div className="bar-content">
                                    <MIcon name="brightness_6" size={22} style={{ color: '#E2E2E6' }} />
                                </div>
                                <input
                                    type="range"
                                    min={10} max={1000}
                                    value={brightness}
                                    onChange={(e) => handleBrightness(Number(e.target.value))}
                                    disabled={isEditing}
                                />
                            </div>
                            <span className="text-base font-medium w-11 text-right tabular-nums text-[#E2E2E6]">{brightPercent}%</span>
                        </div>

                        {/* Temp (Fixed Full Gradient with Clip Path) */}
                        <div className="flex items-center gap-3">
                            <div
                                className="brightness-bar temp-bar group flex-1 relative overflow-hidden bg-[#25272D]"
                            >
                                {/* 1. Underlying FULL gradient (dimmed base) */}
                                <div
                                    className="absolute inset-0 opacity-40"
                                    style={{
                                        background: 'linear-gradient(90deg, #FF8A65 0%, #FFFFFF 50%, #64B5F6 100%)',
                                    }}
                                />

                                {/* 2. Top FULL gradient (bright), clipped to reveal only the percentage */}
                                <div
                                    className="absolute inset-0 transition-[clip-path] duration-300 cubic-bezier(0.2, 0, 0, 1)"
                                    style={{
                                        background: 'linear-gradient(90deg, #FF8A65 0%, #FFFFFF 50%, #64B5F6 100%)',
                                        clipPath: `inset(0 ${100 - tempPercent}% 0 0)`
                                    }}
                                />

                                <div className="bar-content z-10">
                                    <MIcon name="thermostat" size={22} style={{ color: '#111318' }} />
                                </div>
                                <input
                                    type="range"
                                    min={0} max={1000}
                                    value={colorTemp}
                                    onChange={(e) => handleColorTemp(Number(e.target.value))}
                                    disabled={isEditing}
                                />
                            </div>
                            <span className="text-base font-medium w-11 text-right tabular-nums text-[#E2E2E6]">{tempPercent}%</span>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Colors */}
                        <div className={isEditing ? 'pointer-events-none' : ''}>
                            <ColorPresets value={colour} onChange={handleColour} />
                        </div>

                        {/* Brightness (Colour Intens.) */}
                        <div className="flex items-center gap-3 pt-2">
                            <div className="brightness-bar group mt-2 flex-1">
                                <div className="brightness-bar__fill" style={{ width: `${colourBrightPercent}%` }} />
                                <div className="bar-content">
                                    <MIcon name="brightness_6" size={22} style={{ color: '#E2E2E6' }} />
                                </div>
                                <input
                                    type="range"
                                    min={10} max={1000}
                                    value={colour.v}
                                    onChange={(e) => handleColourBrightness(Number(e.target.value))}
                                    disabled={isEditing}
                                />
                            </div>
                            <span className="text-base font-medium w-11 text-right tabular-nums mt-2 text-[#E2E2E6]">{colourBrightPercent}%</span>
                        </div>
                    </>
                )}
            </div>

            {/* Error Toast */}
            {error && (
                <div className="text-xs text-center py-2 text-[#FFB4AB] bg-[#93000A]/30 rounded-lg animate-pulse">
                    {error}
                </div>
            )}
        </div>
    );
}
