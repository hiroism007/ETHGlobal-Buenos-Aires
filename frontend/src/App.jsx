import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import './styles/dashboard.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import TabNavigation from './components/TabNavigation';
import { DashboardScreen } from './pages/DashboardScreen';
import { WaitScenarioScreen } from './pages/WaitScenarioScreen';
import { SettingsScreen } from './pages/SettingsScreen';
import { HistoryScreen } from './pages/HistoryScreen';
import ChatScreen from './components/ChatScreen';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading-page">読み込み中...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

function MainApp() {
  const [activeTab, setActiveTab] = useState('home');

  // カスタムイベントでタブ切り替えを受け取る
  useEffect(() => {
    const handleSwitchTab = (event) => {
      setActiveTab(event.detail);
    };

    window.addEventListener('switchTab', handleSwitchTab);
    return () => window.removeEventListener('switchTab', handleSwitchTab);
  }, []);

  // URLパラメータからシナリオを取得して localStorage に保存
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const scenario = params.get('scenario');
    if (scenario) {
      localStorage.setItem('chatScenario', scenario);
      console.log('[MainApp] Scenario saved to localStorage:', scenario);
    }
  }, []);

  const renderScreen = (isWaitScenario = false) => {
    switch (activeTab) {
      case 'home':
        return isWaitScenario ? <WaitScenarioScreen /> : <DashboardScreen />;
      case 'chat':
        return <ChatScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'history':
        return <HistoryScreen />;
      default:
        return isWaitScenario ? <WaitScenarioScreen /> : <DashboardScreen />;
    }
  };

  return (
    <div className="app">
      <div className="content">
        {renderScreen(false)}
      </div>

      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}

function WaitMainApp() {
  const [activeTab, setActiveTab] = useState('home');

  // カスタムイベントでタブ切り替えを受け取る
  useEffect(() => {
    const handleSwitchTab = (event) => {
      setActiveTab(event.detail);
    };

    window.addEventListener('switchTab', handleSwitchTab);
    return () => window.removeEventListener('switchTab', handleSwitchTab);
  }, []);

  // wait シナリオを localStorage に保存
  useEffect(() => {
    localStorage.setItem('chatScenario', 'wait');
    console.log('[WaitMainApp] Scenario set to: wait');
  }, []);

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <WaitScenarioScreen />;
      case 'chat':
        return <ChatScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'history':
        return <HistoryScreen />;
      default:
        return <WaitScenarioScreen />;
    }
  };

  return (
    <div className="app">
      <div className="content">
        {renderScreen()}
      </div>

      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}

function RootRedirect() {
  // URLパラメータを保持してリダイレクト
  const search = window.location.search;
  return <Navigate to={`/auth${search}`} replace />;
}

function ChatApp() {
  const [activeTab, setActiveTab] = useState('chat');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const scenario = params.get('scenario');
    if (scenario) {
      localStorage.setItem('chatScenario', scenario);
      console.log('[ChatApp] Scenario saved to localStorage:', scenario);
    }
  }, []);

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <DashboardScreen />;
      case 'chat':
        return <ChatScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'history':
        return <HistoryScreen />;
      default:
        return <ChatScreen />;
    }
  };

  return (
    <div className="app">
      <div className="content">
        {renderScreen()}
      </div>

      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <MainApp />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatApp />
              </ProtectedRoute>
            }
          />
          <Route
            path="/home-wait"
            element={
              <ProtectedRoute>
                <WaitMainApp />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
