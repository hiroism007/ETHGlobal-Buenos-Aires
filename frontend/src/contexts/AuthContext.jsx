import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
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

  const login = async (email) => {
    // TODO: 実際のAPIコールに差し替え
    // const response = await fetch('/api/auth/login', { ... });

    // モック実装
    const mockUser = {
      userId: 'user_' + Date.now(),
      email: email,
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f4b29',
      createdAt: new Date().toISOString()
    };

    setUser(mockUser);
    localStorage.setItem('porteno_user', JSON.stringify(mockUser));
    return mockUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('porteno_user');
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
