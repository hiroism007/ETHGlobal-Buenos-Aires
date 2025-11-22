// モックAPI関数
// 実際のバックエンドができたら、これらを実際のfetchに置き換える

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  // ログイン
  async login(email) {
    await delay(800);

    return {
      userId: 'user_' + Date.now(),
      email: email,
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f4b29'
    };
  },

  // 給料日提案を取得
  async getProposal() {
    await delay(1000);

    return {
      proposalId: 'prop_' + Date.now(),
      salaryAmountArs: 150000,
      percent: 70,
      rateSource: 'CCL',
      rateArsPerUsdc: 1200,
      rates: {
        blue: 1250,
        official: 1180,
        mep: 1230,
        ccl: 1200
      },
      gasLevel: 'low',
      amountArs: 105000,
      amountUsdc: 87.5,
      createdAt: new Date().toISOString(),
      reason: 'Blue/MEP/CCL の中で CCL が最も安く、ガスも低いため',
      details: {
        highRate: 1250,
        highTime: '10:30',
        lowRate: 1150,
        lowTime: '15:45',
        gasFees: {
          current: 50,
          trend: 'low'
        },
        rateHistory: [
          { time: '06:00', rate: 1180, isCurrent: false },
          { time: '08:00', rate: 1220, isCurrent: false },
          { time: '10:00', rate: 1250, isCurrent: false },
          { time: '12:00', rate: 1230, isCurrent: false },
          { time: '14:00', rate: 1200, isCurrent: true },
          { time: '16:00', rate: 1180, isCurrent: false },
          { time: '18:00', rate: 1150, isCurrent: false }
        ]
      }
    };
  },

  // 給料日の提案を実行
  async executeProposal(proposalId) {
    await delay(2000); // トランザクション実行をシミュレート

    // ランダムで成功/失敗を決める（デモ用）
    const success = Math.random() > 0.1; // 90%成功

    if (!success) {
      throw new Error('トランザクションの実行に失敗しました');
    }

    return {
      status: 'executed',
      txHash: '0x' + Math.random().toString(16).substr(2, 40),
      executedAt: new Date().toISOString(),
      amountArs: 105000,
      amountUsdc: 87.5,
      actualRate: 1200,
      gasPaidArs: 50
    };
  },

  // 履歴を取得
  async getHistory() {
    await delay(500);

    return [
      {
        id: 1,
        date: '2025-01-05T10:30:00',
        arsAmount: 105000,
        usdcAmount: 87.5,
        exchangeRate: 1200,
        rateSource: 'CCL',
        gasPaid: 50,
        txHash: '0xabc123def456789012345678901234567890abcd',
        status: 'completed'
      },
      {
        id: 2,
        date: '2024-12-05T14:20:00',
        arsAmount: 100000,
        usdcAmount: 81.3,
        exchangeRate: 1230,
        rateSource: 'Blue',
        gasPaid: 75,
        txHash: '0xdef456abc789012345678901234567890abcdef',
        status: 'completed'
      },
      {
        id: 3,
        date: '2024-11-05T09:15:00',
        arsAmount: 95000,
        usdcAmount: 77.0,
        exchangeRate: 1234,
        rateSource: 'MEP',
        gasPaid: 60,
        txHash: '0x789abc012def345678901234567890abcdef012',
        status: 'completed'
      }
    ];
  },

  // 設定を保存
  async saveSettings(settings) {
    await delay(500);

    return {
      success: true,
      settings: settings
    };
  }
};
