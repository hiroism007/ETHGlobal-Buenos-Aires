// ============================================================================
// WaitScenarioScreen: 様子見シナリオ専用の静的ページ
// ============================================================================

import { useEffect } from 'react';

export function WaitScenarioScreen() {
  // localStorage に wait シナリオを設定
  useEffect(() => {
    localStorage.setItem('chatScenario', 'wait');
    console.log('Wait scenario page loaded');
  }, []);

  return (
    <div className="dashboard-screen">
      <div className="dashboard-header">
        <h1 className="dashboard-title">💼 ダッシュボード</h1>
        <p className="dashboard-subtitle">様子見シナリオ</p>
      </div>

      <div className="dashboard-content">
        {/* 様子見メッセージカード */}
        <div className="wallet-card" style={{
          background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
          color: 'white',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>今日は様子見をおすすめします</h2>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            padding: '1rem',
            borderRadius: '8px',
            marginTop: '1rem'
          }}>
            <p style={{ margin: '0.5rem 0', fontSize: '0.95rem' }}>
              • ガス代が通常より高め（0.045 PoL）
            </p>
            <p style={{ margin: '0.5rem 0', fontSize: '0.95rem' }}>
              • レート変動の可能性あり
            </p>
            <p style={{ margin: '0.5rem 0', fontSize: '0.95rem' }}>
              • より良い条件を待つことをおすすめします
            </p>
          </div>

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <button
              onClick={() => {
                // チャットタブに切り替え
                window.dispatchEvent(new CustomEvent('switchTab', { detail: 'chat' }));
              }}
              style={{
                backgroundColor: 'white',
                color: '#FF9800',
                border: 'none',
                padding: '0.75rem 2rem',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              }}
            >
              💬 AIに相談する
            </button>
          </div>
        </div>

        {/* 説明カード */}
        <div className="wallet-card">
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>💡 できること</h3>
          <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
            <li style={{ marginBottom: '0.75rem' }}>現在のレートを確認</li>
            <li style={{ marginBottom: '0.75rem' }}>ドル化割合を変更</li>
            <li style={{ marginBottom: '0.75rem' }}>給料日の設定を変更</li>
            <li style={{ marginBottom: '0.75rem' }}>AIアシスタントに質問</li>
          </ul>
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: '#f5f5f5',
            borderRadius: '6px',
            fontSize: '0.875rem',
            color: '#666'
          }}>
            チャットタブから、設定変更やレート確認ができます
          </div>
        </div>
      </div>
    </div>
  );
}
