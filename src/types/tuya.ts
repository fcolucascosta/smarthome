export interface TuyaDevice {
    id: string;
    uuid: string;
    name: string;
    online: boolean;
    icon: string;
    category: string; // 'dj' = light, 'kg' = switch
    product_name: string;
    status: DeviceStatusItem[];
}

export interface DeviceStatusItem {
    code: string;
    value: any;
}

export interface ColourData {
    h: number; // 0-360 (hue)
    s: number; // 0-1000 (saturation)
    v: number; // 0-1000 (value/brightness)
}

export type WorkMode = 'white' | 'colour' | 'scene';

// Helper to extract status value from a device
export function getStatusValue<T = any>(device: TuyaDevice, code: string): T | undefined {
    return device.status.find((s) => s.code === code)?.value as T | undefined;
}

// Parse colour_data_v2 JSON string to ColourData
export function parseColourData(value: any): ColourData {
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        } catch {
            return { h: 0, s: 1000, v: 1000 };
        }
    }
    if (typeof value === 'object' && value !== null) {
        return value as ColourData;
    }
    return { h: 0, s: 1000, v: 1000 };
}

// Convert HSV (Tuya scale) to CSS hsl for preview
export function hsvToHsl(h: number, s: number, v: number): string {
    // Tuya: h=0-360, s=0-1000, v=0-1000
    const sNorm = s / 1000;
    const vNorm = v / 1000;
    const l = vNorm * (1 - sNorm / 2);
    const sl = l === 0 || l === 1 ? 0 : (vNorm - l) / Math.min(l, 1 - l);
    return `hsl(${h}, ${Math.round(sl * 100)}%, ${Math.round(l * 100)}%)`;
}

// Device categories
export const DEVICE_CATEGORY = {
    LIGHT: 'dj',
    SWITCH: 'kg',
} as const;

// Status codes per category
export const STATUS_CODES = {
    // Lights (dj)
    SWITCH_LED: 'switch_led',
    BRIGHTNESS: 'bright_value_v2',
    COLOR_TEMP: 'temp_value_v2',
    WORK_MODE: 'work_mode',
    COLOR_DATA: 'colour_data_v2',
    // Switches (kg)
    SWITCH_1: 'switch_1',
} as const;
