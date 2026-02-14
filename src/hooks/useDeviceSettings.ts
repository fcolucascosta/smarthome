'use client';

import { useState, useEffect, useCallback } from 'react';

export interface DeviceSetting {
    id: string;
    isHidden: boolean;
    customName?: string;
}

export function useDeviceSettings() {
    const [settings, setSettings] = useState<Record<string, DeviceSetting>>({});
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('smartlife_device_settings');
        if (saved) {
            try {
                setSettings(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse settings', e);
            }
        }
        setLoaded(true);
    }, []);

    const saveSettings = (newSettings: Record<string, DeviceSetting>) => {
        setSettings(newSettings);
        localStorage.setItem('smartlife_device_settings', JSON.stringify(newSettings));
    };

    const toggleHidden = useCallback((id: string) => {
        setSettings(prev => {
            const current = prev[id] || { id, isHidden: false };
            const next = { ...current, isHidden: !current.isHidden };
            const newSettings = { ...prev, [id]: next };
            localStorage.setItem('smartlife_device_settings', JSON.stringify(newSettings));
            return newSettings;
        });
    }, []);

    const renameDevice = useCallback((id: string, newName: string) => {
        setSettings(prev => {
            const current = prev[id] || { id, isHidden: false };
            const next = { ...current, customName: newName };
            const newSettings = { ...prev, [id]: next };
            localStorage.setItem('smartlife_device_settings', JSON.stringify(newSettings));
            return newSettings;
        });
    }, []);

    const getDeviceName = useCallback((id: string, originalName: string) => {
        return settings[id]?.customName || originalName;
    }, [settings]);

    const isHidden = useCallback((id: string) => {
        return !!settings[id]?.isHidden;
    }, [settings]);

    return {
        settings,
        loaded,
        toggleHidden,
        renameDevice,
        getDeviceName,
        isHidden
    };
}
