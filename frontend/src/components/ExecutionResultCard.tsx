// ============================================================================
// ExecutionResultCard: 実行完了画面
// ============================================================================

import type { Proposal } from '../types';

interface ExecuteResult {
  txHash: string;
  actualAmountUsdc: number;
  executedAt: string;
}

interface Props {
  proposal: Proposal;
  result: ExecuteResult;
  onClose: () => void;
}

export function ExecutionResultCard({ proposal, result, onClose }: Props) {
  // txHashをクリップボードにコピー
  const handleCopyTxHash = () => {
    navigator.clipboard.writeText(result.txHash);
    alert('📋 TxHashをコピーしました');
  };

  // 推定節約額を計算（簡易版：レート差を仮定）
  const estimatedSavingsArs = Math.floor(proposal.convertAmountArs * 0.034); // 約3.4%の節約
  const savingsPercent = ((estimatedSavingsArs / proposal.convertAmountArs) * 100).toFixed(1);

  // Polygonscanのリンク
  const explorerUrl = `https://amoy.polygonscan.com/tx/${result.txHash}`;

  // 日時フォーマット
  const executedDate = new Date(result.executedAt).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="execution-result-card">
      {/* 上部アイコン */}
      <div className="execution-result-icon">🎉</div>

      {/* タイトル */}
      <h2 className="execution-result-title">給料をドル化しました</h2>

      {/* メイン数字 */}
      <div className="execution-result-main">
        <div className="execution-result-conversion">
          <span className="execution-result-amount-from">
            {proposal.convertAmountArs.toLocaleString()}
            <span className="execution-result-currency">ARS</span>
          </span>
          <span className="execution-result-arrow">→</span>
          <span className="execution-result-amount-to">
            {result.actualAmountUsdc.toFixed(2)}
            <span className="execution-result-currency">USDC</span>
          </span>
        </div>
      </div>

      {/* 節約額 */}
      <div className="execution-result-savings">
        <div className="execution-result-savings-icon">💰</div>
        <div className="execution-result-savings-content">
          <div className="execution-result-savings-label">本日の節約</div>
          <div className="execution-result-savings-value">
            +{estimatedSavingsArs.toLocaleString()} ARS
            <span className="execution-result-savings-percent">
              ({savingsPercent}%)
            </span>
          </div>
        </div>
      </div>

      {/* 実行情報 */}
      <div className="execution-result-info">
        <div className="execution-result-info-row">
          <span className="execution-result-info-label">実行日時</span>
          <span className="execution-result-info-value">{executedDate}</span>
        </div>
        <div className="execution-result-info-row">
          <span className="execution-result-info-label">レート</span>
          <span className="execution-result-info-value">
            {proposal.bestRateSource} {proposal.bestRateArsPerUsdc.toLocaleString()} ARS
          </span>
        </div>
      </div>

      {/* TxHash */}
      <div className="execution-result-txhash">
        <div className="execution-result-txhash-label">Transaction Hash</div>
        <div className="execution-result-txhash-row">
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="execution-result-txhash-link"
          >
            {result.txHash.substring(0, 10)}...{result.txHash.substring(result.txHash.length - 8)}
          </a>
          <button
            onClick={handleCopyTxHash}
            className="execution-result-txhash-copy"
          >
            📋
          </button>
        </div>
      </div>

      {/* ホームに戻るボタン */}
      <button
        onClick={onClose}
        className="execution-result-button"
      >
        ホームに戻る
      </button>
    </div>
  );
}
