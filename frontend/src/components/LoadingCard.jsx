function LoadingCard({ message = 'AI があなたのウォレットから USDC を送金しています…' }) {
  return (
    <div className="card loading-card">
      <div className="loading-spinner-container">
        <div className="loading-spinner"></div>
      </div>

      <div className="loading-message">
        {message}
      </div>

      <div className="loading-note">
        通常 4〜8 秒ほどかかります
      </div>
    </div>
  );
}

export default LoadingCard;
