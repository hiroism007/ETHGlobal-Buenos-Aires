function Dashboard({ stats }) {
  return (
    <div className="dashboard">
      <div className="stat-card stat-card-primary">
        <div className="stat-icon">💰</div>
        <div className="stat-value">{stats.totalUSDC.toFixed(1)}</div>
        <div className="stat-label">総USDC残高</div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-value">{stats.monthlyConversions}</div>
          <div className="stat-label">今月の変換</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-value">{stats.avgRate.toLocaleString()}</div>
          <div className="stat-label">平均レート</div>
        </div>
      </div>

      <div className="stat-card stat-card-info">
        <div className="stat-label-small">次の給料日</div>
        <div className="stat-value-large">{stats.nextPayday}</div>
        <div className="stat-sublabel">{stats.daysUntilPayday}日後</div>
      </div>
    </div>
  );
}

export default Dashboard;
