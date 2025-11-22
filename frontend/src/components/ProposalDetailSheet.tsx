// ============================================================================
// ProposalDetailSheet: 提案の詳細を表示するボトムシート
// ============================================================================

import type { Proposal, RateTableRow } from '../types';

interface Props {
  proposal: Proposal | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProposalDetailSheet({ proposal, isOpen, onClose }: Props) {
  if (!isOpen) return null;

  if (!proposal) {
    return (
      <>
        <div className="detail-sheet-overlay" onClick={onClose} />
        <div className="detail-sheet">
          <div className="detail-sheet-header">
            <div className="detail-sheet-handle" />
            <h3 className="detail-sheet-title">提案の詳細</h3>
            <button
              className="detail-sheet-close"
              onClick={onClose}
              aria-label="閉じる"
            >
              ✕
            </button>
          </div>
          <div className="detail-sheet-content">
            <p className="detail-sheet-empty">提案を生成してください</p>
          </div>
        </div>
      </>
    );
  }

  // レート比較テーブル用のデータ（モック）
  // TODO: API が rates フィールドを返すようになったら、そちらを使う
  const rateTable: RateTableRow[] = [
    {
      source: 'BLUE',
      sourceName: 'Blue',
      rate: proposal.bestRateSource === 'BLUE' ? proposal.bestRateArsPerUsdc : proposal.bestRateArsPerUsdc * 0.95,
      isSelected: proposal.bestRateSource === 'BLUE',
    },
    {
      source: 'MEP',
      sourceName: 'MEP',
      rate: proposal.bestRateSource === 'MEP' ? proposal.bestRateArsPerUsdc : proposal.bestRateArsPerUsdc * 0.98,
      isSelected: proposal.bestRateSource === 'MEP',
    },
    {
      source: 'CCL',
      sourceName: 'CCL',
      rate: proposal.bestRateSource === 'CCL' ? proposal.bestRateArsPerUsdc : proposal.bestRateArsPerUsdc * 0.96,
      isSelected: proposal.bestRateSource === 'CCL',
    },
  ];

  const getGasStatusText = () => {
    switch (proposal.gasStatus) {
      case 'low':
        return 'ガス代が低めです。実行に最適なタイミングです。';
      case 'normal':
        return 'ガス代は通常レベルです。';
      case 'high':
        return 'ガス代が高めです。少し待つと安くなる可能性があります。';
    }
  };

  const getGasStatusIcon = () => {
    switch (proposal.gasStatus) {
      case 'low':
        return '🟢';
      case 'normal':
        return '🟡';
      case 'high':
        return '🔴';
    }
  };

  const getGasStatusLabel = () => {
    switch (proposal.gasStatus) {
      case 'low':
        return '低め';
      case 'normal':
        return '普通';
      case 'high':
        return '高め';
    }
  };

  return (
    <>
      {/* オーバーレイ */}
      <div className="detail-sheet-overlay" onClick={onClose} />

      {/* ボトムシート本体 */}
      <div className="detail-sheet">
        <div className="detail-sheet-header">
          <div className="detail-sheet-handle" />
          <h3 className="detail-sheet-title">提案の詳細</h3>
          <button
            className="detail-sheet-close"
            onClick={onClose}
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        <div className="detail-sheet-content">
          {/* レート比較セクション */}
          <section className="detail-sheet-section">
            <h4 className="detail-sheet-section-title">📊 レート比較</h4>
            <p className="detail-sheet-section-description">
              x402を使って複数のレートを取得し、最もお得なレートを選んでいます
            </p>

            <table className="rate-comparison-table">
              <thead>
                <tr>
                  <th>ソース</th>
                  <th>レート (1 USD)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rateTable.map((row) => (
                  <tr
                    key={row.source}
                    className={row.isSelected ? 'rate-row-selected' : ''}
                  >
                    <td className="rate-source-name">{row.sourceName}</td>
                    <td className="rate-value-cell">
                      {row.rate.toLocaleString()} ARS
                    </td>
                    <td className="rate-badge-cell">
                      {row.isSelected && (
                        <span className="rate-badge-selected">✓ 採用</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* ガス代セクション */}
          <section className="detail-sheet-section">
            <h4 className="detail-sheet-section-title">⛽ ガス代の状態</h4>
            <div className="gas-status-card">
              <div className="gas-status-indicator">
                <span>{getGasStatusIcon()}</span>
                <span className="gas-status-text">{getGasStatusLabel()}</span>
              </div>
              <div className="gas-status-description">{getGasStatusText()}</div>
              <div className="gas-fee-amount">
                推定ガス代: {proposal.gasFeeArs} ARS
              </div>
            </div>
          </section>

          {/* AIの判断理由 */}
          <section className="detail-sheet-section">
            <h4 className="detail-sheet-section-title">🤖 AIの判断</h4>
            <div className="ai-reason-card">{proposal.reason}</div>
          </section>

          {/* 技術スタック */}
          <section className="detail-sheet-section">
            <h4 className="detail-sheet-section-title">⚙️ 使用技術</h4>
            <div className="tech-stack-chips">
              <div className="tech-stack-chip">
                <span className="tech-stack-chip-icon">🤖</span>
                <div className="tech-stack-chip-content">
                  <div className="tech-stack-chip-label">AI Agent</div>
                  <div className="tech-stack-chip-description">
                    最適なタイミングを判断
                  </div>
                </div>
              </div>

              <div className="tech-stack-chip">
                <span className="tech-stack-chip-icon">📡</span>
                <div className="tech-stack-chip-content">
                  <div className="tech-stack-chip-label">x402</div>
                  <div className="tech-stack-chip-description">
                    複数レートを取得
                  </div>
                </div>
              </div>

              <div className="tech-stack-chip">
                <span className="tech-stack-chip-icon">💼</span>
                <div className="tech-stack-chip-content">
                  <div className="tech-stack-chip-label">Smart Wallet</div>
                  <div className="tech-stack-chip-description">
                    オンチェーン実行
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
