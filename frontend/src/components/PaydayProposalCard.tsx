// ============================================================================
// PaydayProposalCard: 給料日の提案を表示するヒーローカード
// ============================================================================

import { useState } from 'react';
import type { Proposal } from '../types';
import { apiClient } from '../api/client';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  onProposalCreated?: (proposal: Proposal) => void;
  onOpenDetails?: () => void;
}

export function PaydayProposalCard({ onProposalCreated, onOpenDetails }: Props) {
  const { language } = useLanguage();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 提案を生成
   * POST /api/salary/propose を呼び出す
   */
  const handleCreateProposal = async () => {
    setLoading(true);
    setError(null);

    try {
      const newProposal = await apiClient.createProposal();
      setProposal(newProposal);
      onProposalCreated?.(newProposal);
    } catch (err) {
      setError(err instanceof Error ? err.message : '提案の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 提案を実行
   * POST /api/salary/execute を呼び出す
   */
  const handleExecute = async () => {
    if (!proposal) return;

    setExecuting(true);
    setError(null);

    try {
      const result = await apiClient.executeProposal(proposal.proposalId);
      alert(`✅ 変換が完了しました！\nTx: ${result.txHash.substring(0, 10)}...`);
      setProposal(null); // 提案をクリア
    } catch (err) {
      setError(err instanceof Error ? err.message : '実行に失敗しました');
    } finally {
      setExecuting(false);
    }
  };

  /**
   * 提案をスキップ
   */
  const handleSkip = () => {
    setProposal(null);
    alert('今回の提案をスキップしました');
  };

  // 提案がない場合: ボタンを表示
  if (!proposal) {
    return (
      <div className="payday-proposal-card payday-proposal-card-empty">
        <div className="payday-proposal-empty-content">
          <div className="payday-proposal-icon">💼</div>
          <h2 className="payday-proposal-title">給料を守る提案</h2>
          <p className="payday-proposal-description">
            AIが最適なタイミングとレートで、給料の一部をドル建て資産に変換します
          </p>

          {error && (
            <div className="payday-proposal-error">
              ⚠️ {error}
            </div>
          )}

          <button
            className="payday-proposal-button payday-proposal-button-primary"
            onClick={handleCreateProposal}
            disabled={loading}
          >
            {loading ? '提案を作成中...' : '💡 今日の提案を見る'}
          </button>
        </div>
      </div>
    );
  }

  // 提案がある場合: 詳細を表示
  return (
    <div className="payday-proposal-card">
      <div className="payday-proposal-header">
        <div className="payday-proposal-badge">
          {proposal.bestRateSource} レート採用
        </div>
        <button
          className="payday-proposal-details-button"
          onClick={onOpenDetails}
        >
          詳細 →
        </button>
      </div>

      <div className="payday-proposal-message">
        {language === 'ja'
          ? 'ガス代が低く、BLUEレートが他の市場（MEP・CCL）より有利です。今が変換の好機です。'
          : 'Gas fees are low, and the BLUE rate is more favorable than other markets (MEP・CCL). Now is a great time to convert.'}
      </div>

      <div className="payday-proposal-conversion">
        <div className="payday-proposal-amount">
          <div className="payday-proposal-amount-label">変換額</div>
          <div className="payday-proposal-amount-value">
            {proposal.convertAmountArs.toLocaleString()} ARS
          </div>
        </div>

        <div className="payday-proposal-arrow">→</div>

        <div className="payday-proposal-amount">
          <div className="payday-proposal-amount-label">受取USDC</div>
          <div className="payday-proposal-amount-value payday-proposal-amount-value-usdc">
            {proposal.amountUsdc.toFixed(2)} USDC
          </div>
        </div>
      </div>

      <div className="payday-proposal-details-grid">
        <div className="payday-proposal-detail-item">
          <div className="payday-proposal-detail-label">レート</div>
          <div className="payday-proposal-detail-value">
            1 USD = {proposal.bestRateArsPerUsdc.toLocaleString()} ARS
          </div>
        </div>

        <div className="payday-proposal-detail-item">
          <div className="payday-proposal-detail-label">ガス</div>
          <div className="payday-proposal-detail-value">
            {proposal.gasStatus === 'low' && '🟢 低め'}
            {proposal.gasStatus === 'normal' && '🟡 普通'}
            {proposal.gasStatus === 'high' && '🔴 高め'}
          </div>
        </div>

        <div className="payday-proposal-detail-item payday-proposal-detail-item-savings">
          <div className="payday-proposal-detail-label">節約額</div>
          <div className="payday-proposal-detail-value payday-proposal-detail-value-savings">
            +{proposal.savingsArs.toLocaleString()} ARS ({proposal.savingsPercent.toFixed(1)}%)
          </div>
        </div>
      </div>

      {error && (
        <div className="payday-proposal-error">
          ⚠️ {error}
        </div>
      )}

      <div className="payday-proposal-actions">
        <button
          className="payday-proposal-button payday-proposal-button-primary"
          onClick={handleExecute}
          disabled={executing}
        >
          {executing ? '実行中...' : '✓ 実行する'}
        </button>
        <button
          className="payday-proposal-button payday-proposal-button-secondary"
          onClick={handleSkip}
          disabled={executing}
        >
          × スキップ
        </button>
      </div>
    </div>
  );
}
