import type { VfxQuality } from '@/shared/settings';
import { updateSettings, useGame } from '../store/gameStore';

const QUALITIES: Array<{ id: VfxQuality; label: string }> = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
];

export function SettingsPanel() {
  const s = useGame((st) => st.settings);
  return (
    <div className="settings">
      <label className="setting">
        <span>Screen shake</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={s.screenShake}
          onChange={(e) => updateSettings({ screenShake: Number(e.target.value) })}
        />
        <output>{Math.round(s.screenShake * 100)}%</output>
      </label>
      <label className="setting">
        <span>Sound effects volume</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={s.sfxVolume}
          onChange={(e) => updateSettings({ sfxVolume: Number(e.target.value) })}
        />
        <output>{Math.round(s.sfxVolume * 100)}%</output>
      </label>
      <label className="setting">
        <span>Music volume</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={s.musicVolume}
          onChange={(e) => updateSettings({ musicVolume: Number(e.target.value) })}
        />
        <output>{Math.round(s.musicVolume * 100)}%</output>
      </label>
      <div className="setting">
        <span>Particles</span>
        <div className="seg">
          {QUALITIES.map((q) => (
            <button
              key={q.id}
              type="button"
              className={s.vfxQuality === q.id ? 'on' : ''}
              onClick={() => updateSettings({ vfxQuality: q.id })}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>
      <label className="setting check">
        <input type="checkbox" checked={s.flashes} onChange={(e) => updateSettings({ flashes: e.target.checked })} />
        <span>Damage flashes</span>
      </label>
      <label className="setting check">
        <input
          type="checkbox"
          checked={s.damageNumbers}
          onChange={(e) => updateSettings({ damageNumbers: e.target.checked })}
        />
        <span>Damage numbers</span>
      </label>
      <label className="setting check">
        <input type="checkbox" checked={s.muted} onChange={(e) => updateSettings({ muted: e.target.checked })} />
        <span>Mute</span>
      </label>
    </div>
  );
}
