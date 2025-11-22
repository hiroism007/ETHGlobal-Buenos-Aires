function ResultCard({ result }) {
  if (!result) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="card result-card">
      <div className="result-header">
        <div className="result-icon">✅</div>
        <h3>変換が完了しました！</h3>
      </div>

      <div className="result-summary">
        <div className="result-amount">
          {result.amountArs?.toLocaleString()} ARS
          <span className="result-arrow">→</span>
          {result.amountUsdc} USDC
        </div>
      </div>

      <div className="result-details">
        <div className="result-detail-row">
          <span className="result-detail-label">実行レート</span>
          <span className="result-detail-value">
            1 USD = {result.actualRate?.toLocaleString()} ARS
          </span>
        </div>

        <div className="result-detail-row">
          <span className="result-detail-label">ガス代</span>
          <span className="result-detail-value">{result.gasPaidArs} ARS</span>
        </div>

        <div className="result-detail-row">
          <span className="result-detail-label">実行時刻</span>
          <span className="result-detail-value">
            {formatDate(result.executedAt)}
          </span>
        </div>

        {result.txHash && (
          <div className="result-detail-row">
            <span className="result-detail-label">Tx</span>
            <a
              href={`https://polygonscan.com/tx/${result.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="result-link"
            >
              {result.txHash.substring(0, 10)}...
              {result.txHash.substring(result.txHash.length - 8)}
            </a>
          </div>
        )}
      </div>

      <a
        href={`https://polygonscan.com/tx/${result.txHash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="button button-secondary"
      >
        🔍 Explorer で見る
      </a>
    </div>
  );
}

export default ResultCard;
