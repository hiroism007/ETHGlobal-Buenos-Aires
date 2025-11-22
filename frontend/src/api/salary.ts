// ============================================================================
// API Client: 給料関連のAPI呼び出し
// ============================================================================

import type {
  SalarySettings,
  Proposal,
  ExecutionResult,
  WalletSummary,
  Transaction,
  ApiError,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const USE_MOCK_DATA = true; // デモモード: trueにするとモックデータを使用

/**
 * API共通エラーハンドリング
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      message: 'ネットワークエラーが発生しました',
    }));
    throw new Error(error.message);
  }
  return response.json();
}

/**
 * 遅延を追加してローディング状態を見せる（デモ用）
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 給料日設定を取得
 * GET /api/salary/settings
 */
export async function getSettings(): Promise<SalarySettings> {
  if (USE_MOCK_DATA) {
    await delay(300);
    return {
      paymentDay: 25,
      convertPercent: 60,
      autoConvertEnabled: true,
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
      network: 'amoy',
    };
  }

  const response = await fetch(`${API_BASE_URL}/api/salary/settings`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });
  return handleResponse<SalarySettings>(response);
}

/**
 * 給料日設定を更新
 * POST /api/salary/settings
 */
export async function updateSettings(
  settings: Partial<SalarySettings>
): Promise<SalarySettings> {
  if (USE_MOCK_DATA) {
    await delay(500);
    // 既存の設定とマージして返す
    const currentSettings = await getSettings();
    return { ...currentSettings, ...settings };
  }

  const response = await fetch(`${API_BASE_URL}/api/salary/settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(settings),
  });
  return handleResponse<SalarySettings>(response);
}

/**
 * 給料日提案を生成
 * POST /api/salary/propose
 *
 * x402経由で複数レート(Blue/MEP/CCL)を取得し、
 * ベストレートで提案内容(Proposal)を生成する
 */
export async function createProposal(): Promise<Proposal> {
  if (USE_MOCK_DATA) {
    // ローディング状態を見せるために2秒待つ
    await delay(2000);

    const settings = await getSettings();
    const salaryAmountArs = 120000; // 給料額（例）
    const convertAmountArs = Math.floor(salaryAmountArs * (settings.convertPercent / 100));

    // x402で取得したようなレート（Blue, MEP, CCLのうち最良のもの）
    const blueRate = 1265.5;
    const mepRate = 1248.2;
    const cclRate = 1232.8;

    // Blueが最も良いレート
    const bestRate = blueRate;
    const amountUsdc = convertAmountArs / bestRate;

    return {
      proposalId: `prop_${Date.now()}`,
      salaryAmountArs,
      convertPercent: settings.convertPercent,
      convertAmountArs,
      amountUsdc,
      bestRateSource: 'BLUE',
      bestRateArsPerUsdc: bestRate,
      gasStatus: 'low',
      gasFeeArs: 45,
      reason: 'ガス代が低く、BLUEレートが過去1週間で最高値に近い水準です。今が変換の好機です。',
      createdAt: new Date().toISOString(),
    };
  }

  const response = await fetch(`${API_BASE_URL}/api/salary/propose`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });
  return handleResponse<Proposal>(response);
}

/**
 * 提案を実行
 * POST /api/salary/execute
 *
 * Server Wallet経由でオンチェーンにUSDC送金を実行
 */
export async function executeProposal(
  proposalId: string
): Promise<ExecutionResult> {
  if (USE_MOCK_DATA) {
    await delay(1500);

    return {
      txHash: '0x' + Math.random().toString(16).substring(2, 66).padEnd(64, '0'),
      actualAmountUsdc: 56.84,
      executedAt: new Date().toISOString(),
    };
  }

  const response = await fetch(`${API_BASE_URL}/api/salary/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ proposalId }),
  });
  return handleResponse<ExecutionResult>(response);
}

/**
 * ウォレットサマリーを取得
 * TODO: API が整ったら接続する
 * 現在はモックデータを返す
 */
export async function getWalletSummary(): Promise<WalletSummary> {
  if (USE_MOCK_DATA) {
    await delay(400);
    return {
      currentUsdcBalance: 342.58,
      arsEquivalent: 433458,
      totalSavingsArs: 15680,
    };
  }

  // TODO: 実際のAPI実装
  return Promise.resolve({
    currentUsdcBalance: 156.32,
    arsEquivalent: 187584,
    totalSavingsArs: 8420,
  });
}

/**
 * 取引履歴を取得
 * TODO: API が整ったら接続する
 * 現在はモックデータを返す
 */
export async function getHistory(): Promise<Transaction[]> {
  if (USE_MOCK_DATA) {
    await delay(500);
    return [
      {
        id: '5',
        date: '2025-01-25T10:30:00Z',
        arsAmount: 72000,
        usdcAmount: 56.84,
        exchangeRate: 1265.5,
        rateSource: 'BLUE',
        gasPaid: 45,
        txHash: '0x8f2e4b1c9d3a7e5f6b8c2a4d7e9f1b3c5a7d9e2f4b6c8a1d3e5f7b9c2a4d6e8f',
        status: 'executed',
      },
      {
        id: '4',
        date: '2024-12-25T14:15:00Z',
        arsAmount: 68000,
        usdcAmount: 54.42,
        exchangeRate: 1248.2,
        rateSource: 'MEP',
        gasPaid: 52,
        txHash: '0x3a7e5f6b8c2a4d7e9f1b3c5a7d9e2f4b6c8a1d3e5f7b9c2a4d6e8f1a3c5e7f9b',
        status: 'executed',
      },
      {
        id: '3',
        date: '2024-11-25T09:45:00Z',
        arsAmount: 65000,
        usdcAmount: 52.71,
        exchangeRate: 1232.8,
        rateSource: 'CCL',
        gasPaid: 58,
        txHash: '0x1b3c5a7d9e2f4b6c8a1d3e5f7b9c2a4d6e8f1a3c5e7f9b2d4e6f8a1c3e5f7b9d',
        status: 'executed',
      },
      {
        id: '2',
        date: '2024-10-25T11:20:00Z',
        arsAmount: 70000,
        usdcAmount: 56.18,
        exchangeRate: 1245.7,
        rateSource: 'BLUE',
        gasPaid: 48,
        txHash: '0x9e2f4b6c8a1d3e5f7b9c2a4d6e8f1a3c5e7f9b2d4e6f8a1c3e5f7b9d2e4f6a8c',
        status: 'executed',
      },
      {
        id: '1',
        date: '2024-09-25T13:30:00Z',
        arsAmount: 66000,
        usdcAmount: 53.01,
        exchangeRate: 1244.5,
        rateSource: 'MEP',
        gasPaid: 55,
        txHash: '0x7b9c2a4d6e8f1a3c5e7f9b2d4e6f8a1c3e5f7b9d2e4f6a8c1b3d5e7f9b1c3e5a',
        status: 'executed',
      },
    ];
  }

  // TODO: 実際のAPI実装
  return Promise.resolve([
    {
      id: '1',
      date: '2025-01-15T10:30:00Z',
      arsAmount: 42000,
      usdcAmount: 35.0,
      exchangeRate: 1200,
      rateSource: 'BLUE',
      gasPaid: 50,
      txHash: '0xabc123...def456',
      status: 'executed',
    },
  ]);
}
