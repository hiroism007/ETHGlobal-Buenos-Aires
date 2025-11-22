import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function AuthPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('有効なメールアドレスを入力してください');
      return;
    }

    setLoading(true);

    try {
      await login(email);
      navigate('/home');
    } catch (err) {
      setError('ログインに失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">💼 Porteño</h1>
          <p className="auth-subtitle">給料を守るスマートウォレット</p>
        </div>

        <div className="auth-card">
          <form onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label htmlFor="email" className="auth-label">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                className="auth-input"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="auth-button"
              disabled={loading}
            >
              {loading ? '処理中...' : 'ログイン / サインアップ'}
            </button>
          </form>

          <div className="auth-description">
            <p>
              ログインすると、あなた専用の AI スマートウォレットを自動生成します
              <br />
              （シードフレーズ不要・ガスレス）。
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
