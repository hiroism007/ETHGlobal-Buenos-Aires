import SettingsCard from './SettingsCard';

function SettingsScreen({ settings, onUpdate }) {
  return (
    <div className="screen">
      <SettingsCard settings={settings} onUpdate={onUpdate} />

      <div className="card">
        <h2>ℹ️ アプリ情報</h2>
        <div className="setting-row">
          <span className="setting-label">バージョン</span>
          <span className="setting-value">MVP 1.0.0</span>
        </div>
        <div className="setting-row">
          <span className="setting-label">ネットワーク</span>
          <span className="setting-value">Base (モック)</span>
        </div>
        <div className="setting-row">
          <span className="setting-label">ステータス</span>
          <span className="setting-value">開発中</span>
        </div>
      </div>

      <div className="card">
        <h2>🔗 リンク</h2>
        <button className="button button-secondary" style={{ marginTop: 0, marginBottom: '12px' }}>
          📚 ドキュメント
        </button>
        <button className="button button-secondary" style={{ marginTop: 0, marginBottom: '12px' }}>
          💬 サポート
        </button>
        <button className="button button-secondary" style={{ marginTop: 0 }}>
          🐛 バグ報告
        </button>
      </div>
    </div>
  );
}

export default SettingsScreen;
