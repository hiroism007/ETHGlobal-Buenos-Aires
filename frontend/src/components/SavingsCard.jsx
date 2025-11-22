function SavingsCard({ savings }) {
  if (!savings) return null;

  const { amountSaved, percentSaved } = savings;

  return (
    <div className="card savings-card-compact">
      <div className="savings-compact-content">
        <div className="savings-compact-icon">💰</div>
        <div className="savings-compact-info">
          <div className="savings-compact-label">今日の節約</div>
          <div className="savings-compact-amount">
            {amountSaved > 0 ? '+' : ''}{amountSaved.toLocaleString()} ARS
          </div>
        </div>
        <div className="savings-compact-percent">
          {percentSaved.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}

export default SavingsCard;
