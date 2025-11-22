// ============================================================================
// ProposalTimelineCard: AI提案履歴のタイムラインカード
// ============================================================================

import { useState } from 'react';
import type { ProposalHistoryItem } from '../types/proposal';

interface Props {
  item: ProposalHistoryItem;
}

export function ProposalTimelineCard({ item }: Props) {
  const [isReasonExpanded, setIsReasonExpanded] = useState(false);

  // 日時フォーマット
  const formattedDate = new Date(item.createdAt).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  // ステータスバッジ
  const getStatusBadge = () => {
    switch (item.status) {
      case 'executed':
        return <span className="timeline-badge timeline-badge-executed">✓ 実行済み</span>;
      case 'skipped':
        return <span className="timeline-badge timeline-badge-skipped">→ スキップ</span>;
      case 'proposed':
        return <span className="timeline-badge timeline-badge-proposed">💡 提案のみ</span>;
    }
  };

  return (
    <div className="timeline-card">
      {/* 上部: 日付 + ステータスバッジ */}
      <div className="timeline-card-header">
        <div className="timeline-card-date">{formattedDate}</div>
        {getStatusBadge()}
      </div>

      {/* メイン: 金額表示 */}
      <div className="timeline-card-main">
        <div className="timeline-card-conversion">
          <span className="timeline-card-amount-from">
            {item.convertAmountArs.toLocaleString()}
            <span className="timeline-card-currency">ARS</span>
          </span>
          <span className="timeline-card-arrow">→</span>
          <span className="timeline-card-amount-to">
            {item.amountUsdc.toFixed(2)}
            <span className="timeline-card-currency">USDC</span>
          </span>
        </div>
      </div>

      {/* サブ: レート・節約額 */}
      <div className="timeline-card-sub">
        <div className="timeline-card-sub-item">
          <span className="timeline-card-sub-label">レート:</span>
          <span className="timeline-card-sub-value">
            {item.bestRateSource} {item.bestRateArsPerUsdc.toLocaleString()} ARS
          </span>
        </div>
        {item.savingsArs && (
          <>
            <div className="timeline-card-sub-item timeline-card-sub-savings">
              <span className="timeline-card-sub-label">本日の節約:</span>
              <span className="timeline-card-sub-value">
                +{item.savingsArs.toLocaleString()} ARS ({item.savingsPercent?.toFixed(1)}%)
              </span>
            </div>
            {/* お得度メッセージ */}
            <div className="timeline-card-benefit-message">
              このタイミングで実行していなかった場合より +{item.savingsPercent?.toFixed(1)}% お得でした
            </div>
          </>
        )}
      </div>

      {/* フッタ: AI判断理由（折りたたみ可） */}
      {item.reason && (
        <div className="timeline-card-footer">
          <button
            className="timeline-card-reason-toggle"
            onClick={() => setIsReasonExpanded(!isReasonExpanded)}
          >
            {isReasonExpanded ? '▼' : '▶'} AI判断理由
          </button>
          {isReasonExpanded && (
            <div className="timeline-card-reason-text">{item.reason}</div>
          )}
        </div>
      )}
    </div>
  );
}
