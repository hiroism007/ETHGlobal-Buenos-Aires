// ============================================================================
// SettingsScreen: 設定画面（3セクション構成）
// ============================================================================

import { useState, useEffect } from 'react';
import type { SalarySettings } from '../types';
import { getSettings, updateSettings } from '../api/salary';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export function SettingsScreen() {
  const { walletAddress, user } = useAuth();
  const { t, language } = useLanguage();
  const [settings, setSettings] = useState<SalarySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<'best' | 'wait'>(
    (localStorage.getItem('chatScenario') as 'best' | 'wait') || 'best'
  );

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSettings();
        setSettings(data);
      } catch (error) {
        console.error('設定の取得に失敗:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      await updateSettings(settings);
      alert(t('settingsSaved'));
    } catch (error) {
      alert(`❌ ${t('saveError')}`);
    } finally {
      setSaving(false);
    }
  };

  const handleScenarioChange = (scenario: 'best' | 'wait') => {
    setCurrentScenario(scenario);
    localStorage.setItem('chatScenario', scenario);
    alert(`✓ シナリオを「${scenario === 'best' ? 'ベスト提案' : '様子見'}」に変更しました`);
  };

  if (loading) {
    return (
      <div className="settings-screen">
        <div className="settings-loading">{t('loading')}</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="settings-screen">
        <div className="settings-error">{t('settingsLoadError')}</div>
      </div>
    );
  }

  return (
    <div className="settings-screen">
      <header className="settings-header">
        <h1 className="settings-title">⚙️ {t('settingsHeader')}</h1>
      </header>

      <div className="settings-content">
        {/* セクション1: 自動ドル化ルール */}
        <section className="settings-section">
          <h2 className="settings-section-title">💵 {t('autoConversionRules')}</h2>

          <div className="settings-section-content">
            <div className="settings-field">
              <label className="settings-label" htmlFor="paymentDay">
                {t('payday')}
              </label>
              <select
                id="paymentDay"
                className="settings-select"
                value={settings.paymentDay}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    paymentDay: Number(e.target.value),
                  })
                }
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    {t('everyMonth')} {day}{t('day')}
                  </option>
                ))}
              </select>
            </div>

            <div className="settings-field">
              <label className="settings-label" htmlFor="convertPercent">
                {t('conversionRatio')}: {settings.convertPercent}%
              </label>
              <input
                id="convertPercent"
                type="range"
                className="settings-range"
                min="0"
                max="100"
                step="5"
                value={settings.convertPercent}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    convertPercent: Number(e.target.value),
                  })
                }
              />
              <div className="settings-range-labels">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            <div className="settings-toggle-field">
              <div className="settings-toggle-label">
                <div className="settings-toggle-title">{t('autoConversion')}</div>
                <div className="settings-toggle-description">
                  {t('autoConversionDesc')}
                </div>
              </div>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={settings.autoConvertEnabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      autoConvertEnabled: e.target.checked,
                    })
                  }
                />
                <span className="settings-toggle-slider"></span>
              </label>
            </div>

            <button
              className="settings-save-button"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? t('saving') : t('saveSettings')}
            </button>
          </div>
        </section>

        {/* セクション2: ウォレット情報 */}
        <section className="settings-section">
          <h2 className="settings-section-title">💼 {t('walletInfo')}</h2>

          <div className="settings-section-content">
            <div className="settings-info-field">
              <div className="settings-info-label">{t('address')}</div>
              <div className="settings-info-value settings-info-value-mono">
                {walletAddress || t('disconnected')}
              </div>
            </div>

            {user?.userId && (
              <div className="settings-info-field">
                <div className="settings-info-label">{t('userId')}</div>
                <div className="settings-info-value settings-info-value-mono">
                  {user.userId}
                </div>
              </div>
            )}

            <div className="settings-info-field">
              <div className="settings-info-label">{t('network')}</div>
              <div className="settings-info-value">
                {settings?.network || 'Polygon Amoy (Testnet)'}
              </div>
            </div>

            <div className="settings-info-field">
              <div className="settings-info-label">{t('connectionStatus')}</div>
              <div className="settings-info-value">
                <span className={`settings-status-badge ${walletAddress ? 'settings-status-badge-connected' : 'settings-status-badge-disconnected'}`}>
                  {walletAddress ? `✓ ${t('connected')}` : `✗ ${t('disconnected')}`}
                </span>
              </div>
            </div>

            {walletAddress && (
              <button
                className="settings-button-secondary"
                onClick={() => {
                  navigator.clipboard.writeText(walletAddress);
                  alert(`📋 ${t('addressCopied')}`);
                }}
              >
                📋 {t('copyAddress')}
              </button>
            )}
          </div>
        </section>

        {/* セクション3: アプリ情報 */}
        <section className="settings-section">
          <h2 className="settings-section-title">ℹ️ {t('appInfo')}</h2>

          <div className="settings-section-content">
            <div className="settings-info-field">
              <div className="settings-info-label">{t('version')}</div>
              <div className="settings-info-value">v1.0.0</div>
            </div>

            <div className="settings-info-field">
              <div className="settings-info-label">{t('environment')}</div>
              <div className="settings-info-value">
                <span className="settings-env-badge">
                  {import.meta.env.MODE === 'production'
                    ? 'Production'
                    : 'Development'}
                </span>
              </div>
            </div>

            <div className="settings-info-field">
              <div className="settings-info-label">{t('network')}</div>
              <div className="settings-info-value">
                {settings.network === 'amoy' ? 'Polygon Amoy (Testnet)' : settings.network}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
