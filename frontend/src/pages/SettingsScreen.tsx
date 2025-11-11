// ============================================================================
// SettingsScreen: 設定画面（3セクション構成）
// ============================================================================

import { useState, useEffect } from 'react';
import type { SalarySettings } from '../types';
import { getSettings, updateSettings } from '../api/salary';
import { useAuth } from '../contexts/AuthContext';

export function SettingsScreen() {
  const { walletAddress, user } = useAuth();
  const [settings, setSettings] = useState<SalarySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      alert('✓ 設定を保存しました');
    } catch (error) {
      alert('❌ 保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-screen">
        <div className="settings-loading">読み込み中...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="settings-screen">
        <div className="settings-error">設定の読み込みに失敗しました</div>
      </div>
    );
  }

  return (
    <div className="settings-screen">
      <header className="settings-header">
        <h1 className="settings-title">⚙️ 設定</h1>
      </header>

      <div className="settings-content">
        {/* セクション1: 自動ドル化ルール */}
        <section className="settings-section">
          <h2 className="settings-section-title">💵 自動ドル化ルール</h2>

          <div className="settings-section-content">
            <div className="settings-field">
              <label className="settings-label" htmlFor="paymentDay">
                給料日
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
                    毎月 {day}日
                  </option>
                ))}
              </select>
            </div>

            <div className="settings-field">
              <label className="settings-label" htmlFor="convertPercent">
                ドル化割合: {settings.convertPercent}%
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
                <div className="settings-toggle-title">自動ドル化</div>
                <div className="settings-toggle-description">
                  給料日に自動的に提案を実行
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
              {saving ? '保存中...' : '設定を保存'}
            </button>
          </div>
        </section>

        {/* セクション2: ウォレット情報 */}
        <section className="settings-section">
          <h2 className="settings-section-title">💼 ウォレット情報</h2>

          <div className="settings-section-content">
            <div className="settings-info-field">
              <div className="settings-info-label">アドレス (CDP Embedded Wallet)</div>
              <div className="settings-info-value settings-info-value-mono">
                {walletAddress || '接続されていません'}
              </div>
            </div>

            {user?.userId && (
              <div className="settings-info-field">
                <div className="settings-info-label">User ID</div>
                <div className="settings-info-value settings-info-value-mono">
                  {user.userId}
                </div>
              </div>
            )}

            <div className="settings-info-field">
              <div className="settings-info-label">ネットワーク</div>
              <div className="settings-info-value">
                {settings?.network || 'Polygon Amoy (Testnet)'}
              </div>
            </div>

            <div className="settings-info-field">
              <div className="settings-info-label">接続状態</div>
              <div className="settings-info-value">
                <span className={`settings-status-badge ${walletAddress ? 'settings-status-badge-connected' : 'settings-status-badge-disconnected'}`}>
                  {walletAddress ? '✓ 接続済み' : '✗ 未接続'}
                </span>
              </div>
            </div>

            {walletAddress && (
              <button
                className="settings-button-secondary"
                onClick={() => {
                  navigator.clipboard.writeText(walletAddress);
                  alert('📋 アドレスをコピーしました');
                }}
              >
                📋 アドレスをコピー
              </button>
            )}
          </div>
        </section>

        {/* セクション3: アプリ情報 */}
        <section className="settings-section">
          <h2 className="settings-section-title">ℹ️ アプリ情報</h2>

          <div className="settings-section-content">
            <div className="settings-info-field">
              <div className="settings-info-label">バージョン</div>
              <div className="settings-info-value">v1.0.0</div>
            </div>

            <div className="settings-info-field">
              <div className="settings-info-label">環境</div>
              <div className="settings-info-value">
                <span className="settings-env-badge">
                  {import.meta.env.MODE === 'production'
                    ? 'Production'
                    : 'Development'}
                </span>
              </div>
            </div>

            <div className="settings-info-field">
              <div className="settings-info-label">ネットワーク</div>
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
