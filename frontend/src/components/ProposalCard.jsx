import { useState } from 'react';
import RateGraph from './RateGraph';

function ProposalCard({ proposal, onAccept, onReject }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!proposal) return null;

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  };

  const getRateTypeColor = (type) => {
    const colors = {
      'Blue': '#2196F3',
      'Official': '#4CAF50',
      'MEP': '#FF9800',
      'CCL': '#9C27B0'
    };
    return colors[type] || '#666666';
  };

  return (
    <div className="card">
      <div className="proposal-header">
        <h2>💡 AI提案</h2>
        {proposal.timestamp && (
          <div className="proposal-timestamp">
            {formatTimestamp(proposal.timestamp)}
          </div>
        )}
      </div>

      {proposal.rateType && (
        <div
          className="proposal-rate-type"
          style={{ borderColor: getRateTypeColor(proposal.rateType) }}
        >
          <span className="proposal-rate-type-label">使用レート:</span>
          <span
            className="proposal-rate-type-value"
            style={{ color: getRateTypeColor(proposal.rateType) }}
          >
            {proposal.rateType}
          </span>
        </div>
      )}

      <div className="proposal-message">
        {proposal.message}
      </div>

      <div className="proposal-amount">
        {proposal.arsAmount.toLocaleString()} ARS
        <br />
        ↓
        <br />
        {proposal.usdcAmount} USDC
      </div>

      {proposal.rates && (
        <div className="proposal-rate-table">
          <div className="proposal-rate-table-title">レート比較</div>
          <table className="rate-comparison-table">
            <tbody>
              {Object.entries(proposal.rates).map(([key, rate]) => {
                const isSelected = key.toLowerCase() === proposal.rateType?.toLowerCase();
                return (
                  <tr key={key} className={isSelected ? 'rate-row-selected' : ''}>
                    <td className="rate-source">
                      {key.toUpperCase()}
                      {isSelected && <span className="rate-badge">採用</span>}
                    </td>
                    <td className="rate-value">
                      1 USD = {rate.toLocaleString()} ARS
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="proposal-detail">
        <span className="proposal-detail-label">ガス代</span>
        <span className="proposal-detail-value">{proposal.gasStatus}</span>
      </div>

      {proposal.details && (
        <>
          <button
            className="proposal-details-toggle"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? '▼ 詳細を閉じる' : '▶ 詳細を見る'}
          </button>

          {showDetails && (
            <div className="proposal-details">
              {proposal.details.rateHistory && (
                <RateGraph
                  rateHistory={proposal.details.rateHistory}
                  currentRate={proposal.exchangeRate}
                />
              )}

              <h3>今日のレート比較</h3>

              <div className="proposal-rate-comparison">
                <div className="proposal-rate-item proposal-rate-best">
                  <div className="proposal-rate-item-label">最高</div>
                  <div className="proposal-rate-item-value">
                    {proposal.details.highRate.toLocaleString()} ARS
                  </div>
                  <div className="proposal-rate-item-time">
                    {proposal.details.highTime}
                  </div>
                </div>

                <div className="proposal-rate-item proposal-rate-current">
                  <div className="proposal-rate-item-label">現在</div>
                  <div className="proposal-rate-item-value">
                    {proposal.exchangeRate.toLocaleString()} ARS
                  </div>
                  <div className="proposal-rate-item-time">今</div>
                </div>

                <div className="proposal-rate-item proposal-rate-worst">
                  <div className="proposal-rate-item-label">最低</div>
                  <div className="proposal-rate-item-value">
                    {proposal.details.lowRate.toLocaleString()} ARS
                  </div>
                  <div className="proposal-rate-item-time">
                    {proposal.details.lowTime}
                  </div>
                </div>
              </div>

              {proposal.details.gasFees && (
                <div className="proposal-gas-comparison">
                  <h4>ガス代の推移</h4>
                  <div className="proposal-gas-info">
                    <span>現在: {proposal.details.gasFees.current} ARS</span>
                    <span className="proposal-gas-trend">
                      {proposal.details.gasFees.trend === 'low' && '📉 低め'}
                      {proposal.details.gasFees.trend === 'medium' && '➡️ 普通'}
                      {proposal.details.gasFees.trend === 'high' && '📈 高め'}
                    </span>
                  </div>
                </div>
              )}

              {proposal.details.reason && (
                <div className="proposal-reason">
                  <h4>このタイミングが良い理由</h4>
                  <p>{proposal.details.reason}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <div className="button-group">
        <button className="button button-success" onClick={onAccept}>
          ✓ 実行する
        </button>
        <button className="button button-secondary" onClick={onReject}>
          × やめる
        </button>
      </div>
    </div>
  );
}

export default ProposalCard;
