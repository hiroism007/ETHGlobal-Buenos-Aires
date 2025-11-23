import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvmAddress } from '@coinbase/cdp-hooks';
import { AuthButton } from '@coinbase/cdp-react/components/AuthButton';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageToggle from '../components/LanguageToggle';

function AuthPage() {
  const { evmAddress } = useEvmAddress();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // URLパラメータからシナリオを取得
  const params = new URLSearchParams(window.location.search);
  const scenario = params.get('scenario');

  // ウォレットアドレスが取得できたらチャット画面へ遷移
  useEffect(() => {
    if (evmAddress) {
      // プレーンなチャットで始めるため、提案をクリア
      localStorage.removeItem('preloadProposal');
      localStorage.setItem('chatScenario', 'plain');

      const targetPath = scenario ? `/chat?scenario=${scenario}` : '/chat';
      navigate(targetPath);
    }
  }, [evmAddress, navigate, scenario]);

  return (
    <div className="auth-page">
      <LanguageToggle />
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">💱 {t('appName')}</h1>
          <p className="auth-subtitle">{t('appSubtitle')}</p>
        </div>

        <div className="auth-card">
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>{t('signInTitle')}</h2>
            <p style={{ marginBottom: '2rem', color: '#666' }}>
              {t('signInDescription')}
            </p>
            <AuthButton />
          </div>

          <div className="auth-description">
            <p>
              {t('authDescription')}
            </p>
          </div>
        </div>

        <div className="auth-features">
          <div className="auth-feature">
            <div className="auth-feature-icon">🔐</div>
            <div className="auth-feature-text">{t('secureWallet')}</div>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon">🤖</div>
            <div className="auth-feature-text">{t('aiSuggestion')}</div>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon">⚡</div>
            <div className="auth-feature-text">{t('gasless')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
