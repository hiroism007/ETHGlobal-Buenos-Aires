import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvmAddress } from '@coinbase/cdp-hooks';
import { AuthButton } from '@coinbase/cdp-react/components/AuthButton';

function AuthPage() {
  const { evmAddress } = useEvmAddress();
  const navigate = useNavigate();

  // URLパラメータからシナリオを取得
  const params = new URLSearchParams(window.location.search);
  const scenario = params.get('scenario');

  // ウォレットアドレスが取得できたらホーム画面へ遷移
  useEffect(() => {
    if (evmAddress) {
      const targetPath = scenario ? `/home?scenario=${scenario}` : '/home';
      navigate(targetPath);
    }
  }, [evmAddress, navigate, scenario]);

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">💱 Camb.ai</h1>
          <p className="auth-subtitle">給料を守るスマートウォレット</p>
        </div>

        <div className="auth-card">
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>サインインして始める</h2>
            <p style={{ marginBottom: '2rem', color: '#666' }}>
              メールアドレスで認証すると、あなた専用の AI スマートウォレットを自動生成します
            </p>
            <AuthButton />
          </div>

          <div className="auth-description">
            <p>
              シードフレーズ不要・ガスレスで、安全にウォレットを作成できます。
            </p>
          </div>
        </div>

        <div className="auth-features">
          <div className="auth-feature">
            <div className="auth-feature-icon">🔐</div>
            <div className="auth-feature-text">安全なウォレット生成</div>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon">🤖</div>
            <div className="auth-feature-text">AI が自動提案</div>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon">⚡</div>
            <div className="auth-feature-text">ガスレス取引</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
