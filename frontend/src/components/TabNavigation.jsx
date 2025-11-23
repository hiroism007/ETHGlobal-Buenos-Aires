import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

function TabNavigation({ activeTab, onTabChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const tabs = [
    { id: 'home', icon: '🏠', label: t('home'), route: '/home' },
    { id: 'chat', icon: '💬', label: t('chat'), route: '/chat' },
    { id: 'settings', icon: '⚙️', label: t('settings') },
    { id: 'history', icon: '📜', label: t('history') }
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
