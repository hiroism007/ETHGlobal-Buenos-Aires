function ErrorCard({ error, onRetry }) {
  return (
    <div className="card error-card">
      <div className="error-icon">⚠️</div>

      <h3 className="error-title">エラーが発生しました</h3>

      <div className="error-message">
        {error || 'トランザクションの実行に失敗しました。ネットワーク状況を確認して、もう一度お試しください。'}
      </div>

      {onRetry && (
        <button
          className="button button-secondary"
          onClick={onRetry}
        >
          🔄 再試行する
        </button>
      )}
    </div>
  );
}

export default ErrorCard;
