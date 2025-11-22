// ============================================================================
// WalletSummary: ウォレット残高と節約額のサマリー表示
// ============================================================================

import { useEffect, useState } from 'react';
import type { WalletSummary as WalletSummaryType } from '../types';

interface Props {
  // 外部から渡すこともできるし、内部でAPIから取得することもできる
  summary?: WalletSummaryType;
}

export function WalletSummary({ summary: externalSummary }: Props) {
  // 仮データ（実際のAPI実装時はここを変更）
  const [summary] = useState<WalletSummaryType>(
    externalSummary || {
      totalUsdcHeld: 156.32,
      arsEquivalent: 187584,
      totalSavingsArs: 8420,
      lastUpdated: new Date().toISOString(),
    }
  );

  return (
    <div className="wallet-summary">
      <div className="wallet-summary-main">
        <div className="wallet-summary-label">保有USDC</div>
        <div className="wallet-summary-usdc">
          {summary.totalUsdcHeld.toFixed(2)} USDC
        </div>
        <div className="wallet-summary-ars">
          ≒ {summary.arsEquivalent.toLocaleString()} ARS 相当
        </div>
      </div>

      <div className="wallet-summary-divider" />

      <div className="wallet-summary-savings">
        <div className="wallet-summary-savings-icon">💰</div>
        <div className="wallet-summary-savings-content">
          <div className="wallet-summary-savings-label">
            これまで守れた給料
          </div>
          <div className="wallet-summary-savings-value">
            +{summary.totalSavingsArs.toLocaleString()} ARS
          </div>
        </div>
      </div>
    </div>
  );
}
