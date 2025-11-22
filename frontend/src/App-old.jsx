import { useState, useMemo } from 'react';
import './App.css';
import TabNavigation from './components/TabNavigation';
import HomeScreen from './components/HomeScreen';
import ChatScreen from './components/ChatScreen';
import SettingsScreen from './components/SettingsScreen';
import HistoryScreen from './components/HistoryScreen';

// モックデータ
const initialSettings = {
  paymentDay: 5,
  conversionPercentage: 50,
  walletAddress: '0x742d...4b29'
};

const mockProposal = {
  message: '給料日だね！今のレートは良好でガスも低め。50%をUSDCに変えると良いタイミングです👍',
  arsAmount: 42000,
  usdcAmount: 35.0,
  exchangeRate: 1200,
  gasStatus: '低め (最適)',
  timestamp: new Date().toISOString(),
  rateType: 'Blue',
  rates: {
    blue: 1250,
    official: 1180,
    mep: 1230,
    ccl: 1200
  },
  details: {
    highRate: 1250,
    highTime: '10:30',
    lowRate: 1150,
    lowTime: '15:45',
    gasFees: {
      current: 50,
      trend: 'low'
    },
    reason: '現在のBlueレートは本日の平均より4.2%高く、ガス代も通常の60%程度です。また、過去7日間のトレンドから今後数時間でレートが下がる可能性があります。',
    rateHistory: [
      { time: '06:00', rate: 1180, isCurrent: false },
      { time: '08:00', rate: 1220, isCurrent: false },
      { time: '10:00', rate: 1250, isCurrent: false },
      { time: '12:00', rate: 1230, isCurrent: false },
      { time: '14:00', rate: 1200, isCurrent: true },
      { time: '16:00', rate: 1180, isCurrent: false },
      { time: '18:00', rate: 1150, isCurrent: false }
    ]
  }
};

const mockSavings = {
  amountSaved: 2400,
  percentSaved: 5.7,
  comparedToWorst: {
    executed: {
      rate: 1200,
      gas: 50
    },
    worst: {
      rate: 1150,
      gas: 100
    }
  }
};

const mockHistory = [
  {
    id: 1,
    date: '2025-01-05T10:30:00',
    arsAmount: 42000,
    usdcAmount: 35.0,
    exchangeRate: 1200,
    txHash: '0xabc123def456789...'
  },
  {
    id: 2,
    date: '2024-12-05T14:20:00',
    arsAmount: 40000,
    usdcAmount: 32.5,
    exchangeRate: 1230,
    txHash: '0xdef456abc789012...'
  },
  {
    id: 3,
    date: '2024-11-05T09:15:00',
    arsAmount: 38000,
    usdcAmount: 30.8,
    exchangeRate: 1234,
    txHash: '0x789abc012def345...'
  }
];

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [settings, setSettings] = useState(initialSettings);
  const [proposal, setProposal] = useState(mockProposal);
  const [history, setHistory] = useState(mockHistory);
  const [showProposal, setShowProposal] = useState(true);
  const [savings, setSavings] = useState(mockSavings);

  // ダッシュボード統計を計算
  const stats = useMemo(() => {
    const totalUSDC = history.reduce((sum, item) => sum + item.usdcAmount, 0);
    const currentMonth = new Date().getMonth();
    const monthlyConversions = history.filter(item =>
      new Date(item.date).getMonth() === currentMonth
    ).length;
    const avgRate = history.length > 0
      ? Math.round(history.reduce((sum, item) => sum + item.exchangeRate, 0) / history.length)
      : 0;

    // 次の給料日を計算
    const today = new Date();
    const nextPayday = new Date(today.getFullYear(), today.getMonth(), settings.paymentDay);
    if (nextPayday < today) {
      nextPayday.setMonth(nextPayday.getMonth() + 1);
    }
    const daysUntil = Math.ceil((nextPayday - today) / (1000 * 60 * 60 * 24));

    return {
      totalUSDC,
      monthlyConversions,
      avgRate,
      nextPayday: `${settings.paymentDay}日`,
      daysUntilPayday: daysUntil
    };
  }, [history, settings.paymentDay]);

  const notifications = useMemo(() => {
    const notifs = [];
    if (stats.daysUntilPayday <= 3 && stats.daysUntilPayday > 0) {
      notifs.push({
        id: 1,
        type: 'info',
        icon: '💡',
        title: '給料日が近づいています',
        message: `${stats.daysUntilPayday}日後に自動変換の提案をします`
      });
    }
    // 最適なタイミング通知は削除（提案カードで十分）
    return notifs;
  }, [stats.daysUntilPayday]);

  const handleSettingsUpdate = (newSettings) => {
    setSettings(newSettings);
    alert('✓ 設定が保存されました');
  };

  const handleAcceptProposal = () => {
    alert('💫 変換を実行しています...');

    // モックトランザクションを履歴に追加
    const newTransaction = {
      id: history.length + 1,
      date: new Date().toISOString(),
      arsAmount: proposal.arsAmount,
      usdcAmount: proposal.usdcAmount,
      exchangeRate: proposal.exchangeRate,
      txHash: '0x' + Math.random().toString(16).substr(2, 15) + '...'
    };

    setHistory([newTransaction, ...history]);
    setShowProposal(false);

    setTimeout(() => {
      alert('✅ 変換が完了しました！');
    }, 1000);
  };

  const handleRejectProposal = () => {
    setShowProposal(false);
    alert('今回の提案をスキップしました');
  };

  const handleShowProposal = () => {
    setShowProposal(true);
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen
            stats={stats}
            proposal={proposal}
            showProposal={showProposal}
            onAccept={handleAcceptProposal}
            onReject={handleRejectProposal}
            notifications={notifications}
            savings={savings}
          />
        );
      case 'chat':
        return <ChatScreen />;
      case 'settings':
        return (
          <SettingsScreen
            settings={settings}
            onUpdate={handleSettingsUpdate}
          />
        );
      case 'history':
        return <HistoryScreen history={history} />;
      default:
        return null;
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-text">
            <h1>💼 Porteño</h1>
            <p>給料を守るスマートウォレット</p>
          </div>
          <button
            className="notification-bell"
            onClick={() => alert(`通知 ${notifications.length}件`)}
            aria-label="通知"
          >
            🔔
            {notifications.length > 0 && (
              <span className="notification-badge">{notifications.length}</span>
            )}
          </button>
        </div>
      </header>

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

export default App;
