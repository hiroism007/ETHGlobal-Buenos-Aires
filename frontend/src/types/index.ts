// ============================================================================
// 型定義: Porteño給料自動ドル化アプリ
// ============================================================================

/**
 * レートソース (Blue / MEP / CCL)
 */
export type RateSource = 'BLUE' | 'MEP' | 'CCL';

/**
 * ガスの状態
 */
export type GasStatus = 'low' | 'normal' | 'high';

/**
 * トランザクションステータス
 */
export type TxStatus = 'pending' | 'executed' | 'failed';

/**
 * 給料日設定 (GET /api/salary/settings のレスポンス)
 */
export interface SalarySettings {
  paymentDay: number;          // 給料日 (1-31)
  convertPercent: number;      // ドル化割合 (0-100)
  autoConvertEnabled: boolean; // 自動変換ON/OFF
  walletAddress: string;       // ウォレットアドレス
  network: string;             // ネットワーク名
}

/**
 * 給料日提案 (POST /api/salary/propose のレスポンス)
 */
export interface Proposal {
  proposalId: string;
  salaryAmountArs: number;
  convertPercent: number;
  convertAmountArs: number;
  amountUsdc: number;
  bestRateSource: RateSource;
  bestRateArsPerUsdc: number;
  gasStatus: GasStatus;
  gasFeeArs: number;
  reason: string;
  createdAt: string;
}

/**
 * 実行結果 (POST /api/salary/execute のレスポンス)
 */
export interface ExecutionResult {
  txHash: string;
  executedAt: string;
  actualAmountUsdc: number;
}

/**
 * ウォレット情報サマリー
 */
export interface WalletSummary {
  currentUsdcBalance: number;
  arsEquivalent?: number;
  totalSavingsArs?: number;
}

/**
 * 取引履歴
 */
export interface Transaction {
  id: string;
  date: string;
  arsAmount: number;
  usdcAmount: number;
  exchangeRate: number;
  rateSource: RateSource;
  gasPaid: number;
  txHash: string;
  status: TxStatus;
}

/**
 * レート比較テーブル用の型
 */
export interface RateTableRow {
  source: RateSource;
  sourceName: string;
  rate: number;
  isSelected: boolean;
}

/**
 * APIエラーレスポンス
 */
export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}
