function CompactDashboard({ stats }) {
  return (
    <div className="compact-dashboard">
      <div className="compact-stat compact-stat-primary">
        <div className="compact-stat-icon">💰</div>
        <div className="compact-stat-info">
          <div className="compact-stat-label">保有USDC</div>
          <div className="compact-stat-value">{stats.totalUSDC.toFixed(1)} USDC</div>
        </div>
      </div>

      <div className="compact-stat-row">
        <div className="compact-stat compact-stat-secondary">
          <div className="compact-stat-icon-small">📅</div>
          <div className="compact-stat-info">
            <div className="compact-stat-label-small">次の給料日</div>
            <div className="compact-stat-value-small">{stats.daysUntilPayday}日後</div>
          </div>
        </div>

        <div className="compact-stat compact-stat-secondary">
          <div className="compact-stat-icon-small">📊</div>
          <div className="compact-stat-info">
            <div className="compact-stat-label-small">今月の変換</div>
            <div className="compact-stat-value-small">{stats.monthlyConversions}回</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompactDashboard;
