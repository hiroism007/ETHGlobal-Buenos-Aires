function HistoryList({ history }) {
  if (!history || history.length === 0) {
    return (
      <div className="card">
        <h2>📜 履歴</h2>
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <p>まだ履歴がありません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>📜 履歴</h2>

      {history.map((item) => (
        <div key={item.id} className="history-item">
          <div className="history-date">
            {new Date(item.date).toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>

          <div className="history-amount">
            {item.arsAmount.toLocaleString()} ARS → {item.usdcAmount} USDC
          </div>

          <div className="history-rate">
            レート: 1 USD = {item.exchangeRate.toLocaleString()} ARS
          </div>

          {item.txHash && (
            <a
              href={`https://basescan.org/tx/${item.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="history-link"
            >
              ⛓ EXPLORER
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

export default HistoryList;
