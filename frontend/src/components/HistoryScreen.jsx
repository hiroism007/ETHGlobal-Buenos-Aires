import HistoryList from './HistoryList';

function HistoryScreen({ history }) {
  // 統計情報を計算
  const totalARS = history.reduce((sum, item) => sum + item.arsAmount, 0);
  const totalUSDC = history.reduce((sum, item) => sum + item.usdcAmount, 0);
  const avgRate = history.length > 0
    ? Math.round(history.reduce((sum, item) => sum + item.exchangeRate, 0) / history.length)
    : 0;

  return (
    <div className="screen">
      <div className="card">
        <h2>📊 統計</h2>
        <div className="setting-row">
          <span className="setting-label">総変換回数</span>
          <span className="setting-value">{history.length}回</span>
        </div>
        <div className="setting-row">
          <span className="setting-label">総ARS額</span>
          <span className="setting-value">{totalARS.toLocaleString()} ARS</span>
        </div>
        <div className="setting-row">
          <span className="setting-label">総USDC額</span>
          <span className="setting-value">{totalUSDC.toFixed(1)} USDC</span>
        </div>
        <div className="setting-row">
          <span className="setting-label">平均レート</span>
          <span className="setting-value">1 USD = {avgRate.toLocaleString()} ARS</span>
        </div>
      </div>

      <HistoryList history={history} />
    </div>
  );
}

export default HistoryScreen;
