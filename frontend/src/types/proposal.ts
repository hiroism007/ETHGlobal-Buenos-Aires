// ============================================================================
// AI提案ログの型定義
// ============================================================================

export type ProposalStatus = 'proposed' | 'executed' | 'skipped';

export type RateSource = 'BLUE' | 'MEP' | 'CCL';

/**
 * AI提案履歴の1アイテム
 * /api/proposals から返される型
 */
export interface ProposalHistoryItem {
  id: string;
  createdAt: string;        // 提案が生成された日時（ISO 8601形式）
  status: ProposalStatus;   // 提案のステータス
  salaryAmountArs: number;  // 給料総額
  convertAmountArs: number; // 変換額
  amountUsdc: number;       // 受取USDC
  bestRateSource: RateSource; // ベストレート元
  bestRateArsPerUsdc: number; // レート
  savingsArs?: number;      // 推定節約額（オプション）
  savingsPercent?: number;  // 推定節約率（オプション）
  reason?: string;          // AI判断理由（オプション）
}
