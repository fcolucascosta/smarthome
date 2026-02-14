'use client';

import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { TuyaDevice } from '@/types/tuya';
import DeviceCard from '@/components/DeviceCard';
import { useDeviceSettings } from '@/hooks/useDeviceSettings';

import { useInterval } from '@/hooks/useInterval';

/* Material Symbol shorthand */
function MIcon({ name, size = 24, className = '', style = {} }: { name: string; size?: number; className?: string; style?: React.CSSProperties }) {
  return <span className={`material-symbols-outlined ${className}`} style={{ fontSize: size, ...style }}>{name}</span>;
}

function getFormattedDate(): string {
  const now = new Date();
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Boa madrugada';
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function Dashboard() {
  const [devices, setDevices] = useState<TuyaDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const { loaded, toggleHidden, renameDevice, getDeviceName, isHidden } = useDeviceSettings();

  const fetchDevices = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/devices');
      if (res.data.success) {
        setDevices(res.data.result || []);
      } else {
        if (!silent) setError(res.data.msg || 'Falha ao buscar dispositivos');
      }
    } catch (err: any) {
      if (!silent) setError(err.response?.data?.msg || 'Erro de conexão');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  // Poll every 5 seconds if not editing and window is focused
  useInterval(() => {
    if (!document.hidden && !isEditing) {
      fetchDevices(true);
    }
  }, 5000);

  // Filter devices based on hidden state (unless editing)
  const visibleDevices = devices.filter(d => isEditing || !isHidden(d.id));

  const lights = visibleDevices.filter((d) => d.category === 'dj');
  const switches = visibleDevices.filter((d) => d.category === 'kg');
  const others = visibleDevices.filter((d) => d.category !== 'dj' && d.category !== 'kg');

  if (!loaded) return null; // Wait for settings to load

  return (
    <>
      <main
        className="min-h-screen px-4 pt-5 pb-24 md:px-8 md:pt-6 md:pb-8 transition-colors duration-500"
        style={{
          backgroundColor: '#111318',
          color: 'var(--md-on-surface)',
        }}
      >
        <div className="max-w-[1600px] mx-auto flex flex-col gap-5">

          {/* ─── Header ─── */}
          <header
            className="flex items-center justify-between pb-5 md:pb-6"
            style={{ borderBottom: '1px solid rgba(142, 144, 153, 0.2)' }}
          >
            <div>
              <h1
                className="font-bold tracking-tight"
                style={{ fontSize: 24, lineHeight: '32px', color: 'var(--md-on-surface)' }}
              >
                {getGreeting()}, Lucas <span className="font-normal opacity-60 text-lg ml-1">| Hoje é {getFormattedDate()}</span>
              </h1>
            </div>

            <div className="flex gap-3">
              {/* Edit Mode Toggle (Desktop) */}
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`hidden md:flex h-10 px-5 rounded-full items-center justify-center gap-2 transition-all ${isEditing
                  ? 'bg-[#FFB4AB] text-[#690005]'
                  : 'bg-[#3E4759] text-[#E2E2E6] hover:bg-[#4a5569]'
                  }`}
                title="Editar layout"
              >
                <MIcon name={isEditing ? 'check' : 'edit'} size={20} />
                <span className="font-medium text-sm">{isEditing ? 'Concluir' : 'Editar'}</span>
              </button>

              <button
                onClick={() => fetchDevices(false)}
                className="h-10 w-10 rounded-full flex items-center justify-center transition-colors"
                style={{
                  background: 'var(--md-primary-container)',
                  color: 'var(--md-on-primary-container)',
                }}
                title="Atualizar"
              >
                <MIcon name={loading ? 'sync' : 'refresh'} size={20} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </header>

          {isEditing && (
            <div className="bg-[#FFB4AB] text-[#690005] px-4 py-2 rounded-xl flex items-center gap-3 animate-fade-in text-sm">
              <MIcon name="info" size={20} />
              <span className="font-medium">Modo de edição: Toque no olho para ocultar/exibir ou no lápis para renomear.</span>
            </div>
          )}

          {/* ─── Error ─── */}
          {error && (
            <div
              className="px-4 py-3 text-sm rounded-xl"
              style={{ background: 'var(--md-error-container)', color: 'var(--md-error)' }}
            >
              {error}
            </div>
          )}

          {/* ─── Loading ─── */}
          {loading && devices.length === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-44 rounded-[1.75rem] animate-pulse"
                  style={{ background: 'var(--md-surface-container)' }}
                />
              ))}
            </div>
          )}

          {/* ─── Lâmpadas ─── */}
          {lights.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <MIcon name="lightbulb" style={{ color: 'var(--md-primary)' }} />
                <h2 className="text-xl font-medium" style={{ color: 'var(--md-on-surface)' }}>
                  Lâmpadas
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lights.map((d) => (
                  <DeviceCard
                    key={d.id}
                    device={d}
                    customName={getDeviceName(d.id, d.name)}
                    isEditing={isEditing}
                    isHidden={isHidden(d.id)}
                    onRename={(name) => renameDevice(d.id, name)}
                    onToggleHidden={() => toggleHidden(d.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ─── Interruptores ─── */}
          {switches.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <MIcon name="toggle_on" style={{ color: 'var(--md-primary)' }} />
                <h2 className="text-xl font-medium" style={{ color: 'var(--md-on-surface)' }}>
                  Interruptores
                </h2>
              </div>
              {/* Standardized Grid: 1 col mobile, 2 col md, 3 col lg */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {switches.map((d) => (
                  <DeviceCard
                    key={d.id}
                    device={d}
                    customName={getDeviceName(d.id, d.name)}
                    isEditing={isEditing}
                    isHidden={isHidden(d.id)}
                    onRename={(name) => renameDevice(d.id, name)}
                    onToggleHidden={() => toggleHidden(d.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ─── Outros ─── */}
          {others.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <MIcon name="devices_other" style={{ color: 'var(--md-primary)' }} />
                <h2 className="text-xl font-medium" style={{ color: 'var(--md-on-surface)' }}>
                  Outros
                </h2>
              </div>
              {/* Standardized Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {others.map((d) => (
                  <DeviceCard
                    key={d.id}
                    device={d}
                    customName={getDeviceName(d.id, d.name)}
                    isEditing={isEditing}
                    isHidden={isHidden(d.id)}
                    onRename={(name) => renameDevice(d.id, name)}
                    onToggleHidden={() => toggleHidden(d.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ─── Empty ─── */}
          {visibleDevices.length === 0 && !loading && !error && (
            <div className="text-center py-20 bg-[#1F1F23]/50 rounded-[28px]">
              <MIcon name="visibility_off" size={48} style={{ color: 'var(--md-surface-variant)' }} />
              <p className="text-base mt-4" style={{ color: 'var(--md-on-surface-variant)' }}>
                {isEditing ? 'Todos os dispositivos estão ocultos.' : 'Nenhum dispositivo visível.'}
              </p>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-4 text-[#A8C7FA] hover:underline"
                >
                  Editar visibilidade
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ─── Bottom Navigation (mobile) ─── */}
      <nav
        className="fixed bottom-0 left-0 w-full p-0 md:hidden z-50 rounded-t-[20px] shadow-[0_-4px_20px_rgba(0,0,0,0.4)]"
        style={{
          background: '#1F1F23',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <div className="flex justify-around items-center h-20">
          <button
            className="flex flex-col items-center gap-1 group"
            onClick={() => setIsEditing(false)}
          >
            <div
              className={`w-16 h-8 rounded-full flex items-center justify-center transition-all ${!isEditing ? 'bg-[#3E4759] text-[#E2E2E6]' : 'text-[#C4C6D0]'}`}
            >
              <MIcon name="home" />
            </div>
            <span className={`text-xs font-medium ${!isEditing ? 'text-[#E2E2E6]' : 'text-[#C4C6D0]'}`}>
              Início
            </span>
          </button>

          <button
            className="flex flex-col items-center gap-1 group"
            onClick={() => setIsEditing(!isEditing)}
          >
            <div className={`w-16 h-8 rounded-full flex items-center justify-center transition-colors ${isEditing ? 'bg-[#FFB4AB] text-[#690005]' : 'hover:bg-[rgba(68,71,79,0.2)] text-[#C4C6D0]'
              }`}>
              <MIcon name="edit_note" />
            </div>
            <span className={`text-xs font-medium ${isEditing ? 'text-[#FFB4AB]' : 'text-[#C4C6D0]'}`}>
              Editar
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
