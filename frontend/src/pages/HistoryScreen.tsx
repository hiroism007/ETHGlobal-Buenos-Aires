// ============================================================================
// HistoryScreen: 取引履歴画面
// ============================================================================

import { useState, useEffect } from 'react';
import type { Transaction } from '../types';
import type { ProposalHistoryItem } from '../types/proposal';
import { getHistory } from '../api/salary';
import { getProposalHistory } from '../api/proposals';
import { ProposalTimelineCard } from '../components/ProposalTimelineCard';

type HistoryTab = 'proposals' | 'transactions';

export function HistoryScreen() {
  const [activeTab, setActiveTab] = useState<HistoryTab>('proposals');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [proposals, setProposals] = useState<ProposalHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const [transactionsData, proposalsData] = await Promise.all([
          getHistory(),
          getProposalHistory(20),
        ]);
        setTransactions(transactionsData);
        setProposals(proposalsData);
      } catch (error) {
        console.error('履歴の取得に失敗:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'executed':
        return <span className="history-status-badge history-status-executed">✓ 完了</span>;
      case 'pending':
        return <span className="history-status-badge history-status-pending">⏳ 処理中</span>;
      case 'failed':
        return <span className="history-status-badge history-status-failed">✕ 失敗</span>;
    }
  };

  if (loading) {
    return (
      <div className="history-screen">
        <header className="history-header">
          <h1 className="history-title">📊 履歴</h1>
        </header>
        <div className="history-loading">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="history-screen">
      <header className="history-header">
        <h1 className="history-title">📊 履歴</h1>
      </header>

      {/* タブ切り替え */}
      <div className="history-tabs">
        <button
          className={`history-tab ${activeTab === 'proposals' ? 'history-tab-active' : ''}`}
          onClick={() => setActiveTab('proposals')}
        >
          🤖 AI提案ログ
        </button>
        <button
          className={`history-tab ${activeTab === 'transactions' ? 'history-tab-active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          📜 取引履歴
        </button>
      </div>

      <div className="history-content">
        {/* AI提案ログタブ */}
        {activeTab === 'proposals' && (
          <>
            {proposals.length === 0 ? (
              <div className="history-empty">
                <div className="history-empty-icon">🤖</div>
                <p className="history-empty-text">まだAI提案ログがありません</p>
              </div>
            ) : (
              <div className="proposal-timeline-list">
                {proposals.map((item) => (
                  <ProposalTimelineCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </>
        )}

        {/* 取引履歴タブ */}
        {activeTab === 'transactions' && (
          <>
            {transactions.length === 0 ? (
              <div className="history-empty">
                <div className="history-empty-icon">📭</div>
                <p className="history-empty-text">まだ取引履歴がありません</p>
              </div>
            ) : (
              <div className="history-list">
                {transactions.map((tx) => (
              <div key={tx.id} className="history-item">
                <div className="history-item-header">
                  <div className="history-item-date">{formatDate(tx.date)}</div>
                  {getStatusBadge(tx.status)}
                </div>

                <div className="history-item-conversion">
                  <div className="history-item-amount">
                    <span className="history-item-amount-label">変換額</span>
                    <span className="history-item-amount-value">
                      {tx.arsAmount.toLocaleString()} ARS
                    </span>
                  </div>
                  <div className="history-item-arrow">→</div>
                  <div className="history-item-amount">
                    <span className="history-item-amount-label">受取額</span>
                    <span className="history-item-amount-value history-item-amount-usdc">
                      {tx.usdcAmount.toFixed(2)} USDC
                    </span>
                  </div>
                </div>

                <div className="history-item-details">
                  <div className="history-item-detail">
                    <span className="history-item-detail-label">レート:</span>
                    <span className="history-item-detail-value">
                      {tx.rateSource} {tx.exchangeRate.toLocaleString()} ARS/USD
                    </span>
                  </div>
                  <div className="history-item-detail">
                    <span className="history-item-detail-label">ガス代:</span>
                    <span className="history-item-detail-value">{tx.gasPaid} POL</span>
                  </div>
                </div>

                <div className="history-item-txhash">
                  <span className="history-item-txhash-label">TxHash:</span>
                  <a
                    href={`https://amoy.polygonscan.com/tx/${tx.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="history-item-txhash-link"
                  >
                    {tx.txHash}
                  </a>
                </div>
                </div>
              ))}
            </div>
          )}
        </>
        )}
      </div>
    </div>
  );
}
