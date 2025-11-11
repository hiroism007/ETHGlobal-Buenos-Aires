import { createContext, useContext, useState, useEffect } from 'react';
import { useEvmAddress } from '@coinbase/cdp-hooks';
import { apiClient } from '../api/client';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { evmAddress } = useEvmAddress();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ローカルストレージからユーザー情報を復元
    const savedUser = localStorage.getItem('porteno_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('porteno_user');
      }
    }
    setLoading(false);
  }, []);

  // CDP Embedded Walletでアドレスが取得できたら、バックエンドに通知
  useEffect(() => {
    const handleWalletLogin = async () => {
      if (evmAddress && !user) {
        try {
          // TODO: signMessageで署名を生成
          // ドキュメントによると、"Login to DolarBlue" というメッセージに署名する必要がある
          // 現時点では、署名機能が未実装なので、仮の署名を使用
          const signature = '0x' + '0'.repeat(130); // 仮の署名

          // バックエンドAPI /auth/wallet/login を呼び出す
          const response = await apiClient.walletLogin({
            address: evmAddress,
            signature: signature
          });

          const userData = {
            userId: response.userId,
            email: localStorage.getItem('porteno_email') || '',
            walletAddress: response.address,
            isNewUser: response.isNewUser,
            createdAt: new Date().toISOString()
          };

          setUser(userData);
          localStorage.setItem('porteno_user', JSON.stringify(userData));
          localStorage.setItem('porteno_userId', response.userId);

          console.log('Wallet login successful:', response);
        } catch (error) {
          console.error('Wallet login failed:', error);

          // エラー時は仮実装にフォールバック
          const mockUser = {
            userId: localStorage.getItem('porteno_userId') || 'user_' + Date.now(),
            email: localStorage.getItem('porteno_email') || '',
            walletAddress: evmAddress,
            createdAt: new Date().toISOString()
          };

          setUser(mockUser);
          localStorage.setItem('porteno_user', JSON.stringify(mockUser));
          localStorage.setItem('porteno_userId', mockUser.userId);
        }
      }
    };

    handleWalletLogin();
  }, [evmAddress, user]);

  const login = async (email) => {
    // CDP AuthButtonによる認証後に呼ばれる
    // evmAddressは useEvmAddress() で自動的に取得される
    const mockUser = {
      userId: localStorage.getItem('porteno_userId') || 'user_' + Date.now(),
      email: email,
      walletAddress: evmAddress || '0x...',
      createdAt: new Date().toISOString()
    };

    setUser(mockUser);
    localStorage.setItem('porteno_user', JSON.stringify(mockUser));
    localStorage.setItem('porteno_email', email);
    localStorage.setItem('porteno_userId', mockUser.userId);
    return mockUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('porteno_user');
    // CDP側のログアウトは別途実装が必要
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!evmAddress, // CDPウォレットがあればログイン状態
    walletAddress: evmAddress
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
