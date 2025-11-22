import { useState } from 'react';

function SettingsCard({ settings, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSettings, setEditedSettings] = useState(settings);

  const handleSave = () => {
    onUpdate(editedSettings);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedSettings(settings);
    setIsEditing(false);
  };

  return (
    <div className="card">
      <h2>⚙️ 設定</h2>

      {!isEditing ? (
        <>
          <div className="setting-row">
            <span className="setting-label">💰 給料日</span>
            <span className="setting-value">毎月 {settings.paymentDay}日</span>
          </div>
          <div className="setting-row">
            <span className="setting-label">📊 変換割合</span>
            <span className="setting-value">{settings.conversionPercentage}%</span>
          </div>
          <div className="setting-row">
            <span className="setting-label">👛 ウォレット</span>
            <span className="setting-value">{settings.walletAddress}</span>
          </div>

          <button className="button" onClick={() => setIsEditing(true)}>
            ✏️ 編集する
          </button>
        </>
      ) : (
        <>
          <div className="input-group">
            <label>💰 給料日 (日付)</label>
            <input
              type="number"
              min="1"
              max="31"
              value={editedSettings.paymentDay}
              onChange={(e) => setEditedSettings({
                ...editedSettings,
                paymentDay: parseInt(e.target.value)
              })}
            />
          </div>

          <div className="input-group">
            <label>📊 変換割合 (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={editedSettings.conversionPercentage}
              onChange={(e) => setEditedSettings({
                ...editedSettings,
                conversionPercentage: parseInt(e.target.value)
              })}
            />
          </div>

          <div className="input-group">
            <label>👛 ウォレットアドレス</label>
            <input
              type="text"
              value={editedSettings.walletAddress}
              onChange={(e) => setEditedSettings({
                ...editedSettings,
                walletAddress: e.target.value
              })}
            />
          </div>

          <div className="button-group">
            <button className="button button-success" onClick={handleSave}>
              ✓ 保存
            </button>
            <button className="button button-secondary" onClick={handleCancel}>
              × キャンセル
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default SettingsCard;
