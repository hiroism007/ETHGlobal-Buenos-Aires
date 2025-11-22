// ============================================================================
// AI提案履歴API
// ============================================================================

import type { ProposalHistoryItem } from '../types/proposal';

const USE_MOCK_DATA = true; // デモモード

/**
 * 遅延を追加してローディング状態を見せる（デモ用）
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * AI提案履歴を取得
 * GET /api/proposals?limit=20
 *
 * 最新の提案から順に返す
 */
export async function getProposalHistory(limit: number = 20): Promise<ProposalHistoryItem[]> {
  if (USE_MOCK_DATA) {
    await delay(600);

    // モックデータ: 過去7件の提案履歴
    return [
      {
        id: 'prop_7',
        createdAt: '2025-01-25T10:32:00Z',
        status: 'executed',
        salaryAmountArs: 120000,
        convertAmountArs: 72000,
        amountUsdc: 56.89,
        bestRateSource: 'BLUE',
        bestRateArsPerUsdc: 1265.5,
        savingsArs: 2448,
        savingsPercent: 3.4,
        reason: 'ガス代が低く、BLUEレートが過去1週間で最高値に近い水準です。今が変換の好機です。',
      },
      {
        id: 'prop_6',
        createdAt: '2024-12-25T14:15:00Z',
        status: 'executed',
        salaryAmountArs: 120000,
        convertAmountArs: 68000,
        amountUsdc: 54.42,
        bestRateSource: 'MEP',
        bestRateArsPerUsdc: 1248.2,
        savingsArs: 2312,
        savingsPercent: 3.1,
        reason: 'MEPレートが比較的安定しており、ガス代も適正な水準です。',
      },
      {
        id: 'prop_5',
        createdAt: '2024-11-25T09:45:00Z',
        status: 'skipped',
        salaryAmountArs: 120000,
        convertAmountArs: 65000,
        amountUsdc: 52.71,
        bestRateSource: 'CCL',
        bestRateArsPerUsdc: 1232.8,
        reason: 'レートはやや低めですが、ガス代は低い状況です。',
      },
      {
        id: 'prop_4',
        createdAt: '2024-10-25T11:20:00Z',
        status: 'executed',
        salaryAmountArs: 120000,
        convertAmountArs: 70000,
        amountUsdc: 56.18,
        bestRateSource: 'BLUE',
        bestRateArsPerUsdc: 1245.7,
        savingsArs: 2380,
        savingsPercent: 3.2,
        reason: 'BLUEレートが好調で、実行に最適なタイミングです。',
      },
      {
        id: 'prop_3',
        createdAt: '2024-09-25T13:30:00Z',
        status: 'executed',
        salaryAmountArs: 120000,
        convertAmountArs: 66000,
        amountUsdc: 53.01,
        bestRateSource: 'MEP',
        bestRateArsPerUsdc: 1244.5,
        savingsArs: 2247,
        savingsPercent: 3.0,
        reason: 'MEPレートが安定しており、安全な実行が可能です。',
      },
      {
        id: 'prop_2',
        createdAt: '2024-08-25T10:00:00Z',
        status: 'proposed',
        salaryAmountArs: 120000,
        convertAmountArs: 64000,
        amountUsdc: 51.84,
        bestRateSource: 'BLUE',
        bestRateArsPerUsdc: 1234.5,
        reason: 'レートは平均的ですが、ガス代がやや高めです。',
      },
      {
        id: 'prop_1',
        createdAt: '2024-07-25T15:45:00Z',
        status: 'executed',
        salaryAmountArs: 120000,
        convertAmountArs: 68000,
        amountUsdc: 54.88,
        bestRateSource: 'CCL',
        bestRateArsPerUsdc: 1238.9,
        savingsArs: 2312,
        savingsPercent: 3.1,
        reason: 'CCLレートが好調で、実行に適したタイミングです。',
      },
    ];
  }

  // TODO: 実際のAPI実装
  const response = await fetch(`/api/proposals?limit=${limit}`);
  if (!response.ok) {
    throw new Error('提案履歴の取得に失敗しました');
  }
  return response.json();
}

/**
 * 最新のAI提案1件だけを取得
 * ホーム画面の「最後の提案」行に表示するために使用
 */
export async function getLatestProposal(): Promise<ProposalHistoryItem | null> {
  const history = await getProposalHistory(1);
  return history.length > 0 ? history[0] : null;
}
