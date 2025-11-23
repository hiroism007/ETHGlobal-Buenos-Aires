import { useNavigate, useLocation } from 'react-router-dom';

function TabNavigation({ activeTab, onTabChange }) {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: 'home', icon: '🏠', label: 'ホーム', route: '/home' },
    { id: 'chat', icon: '💬', label: 'チャット', route: '/chat' },
    { id: 'settings', icon: '⚙️', label: '設定' },
    { id: 'history', icon: '📜', label: '履歴' }
  ];

  const handleTabClick = (tab) => {
    // For home and chat tabs, navigate to their routes
    if (tab.route) {
      navigate(tab.route);
    } else {
      // For settings and history, switch to home route first if needed, then change tab
      if (location.pathname !== '/home') {
        navigate('/home');
      }
      onTabChange(tab.id);
    }
  };

  return (
    <nav className="tab-navigation">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab-button ${activeTab === tab.id ? 'tab-button-active' : ''}`}
          onClick={() => handleTabClick(tab)}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

export default TabNavigation;
