// ============================================================================
// HistoryScreen: 取引履歴画面
// ============================================================================

import { useState, useEffect } from 'react';
import type { Transaction } from '../types';
import type { ProposalHistoryItem } from '../types/proposal';
import { getHistory } from '../api/salary';
import { getProposalHistory } from '../api/proposals';
import { ProposalTimelineCard } from '../components/ProposalTimelineCard';
import { useLanguage } from '../contexts/LanguageContext';

type HistoryTab = 'proposals' | 'transactions';

export function HistoryScreen() {
  const { t, language } = useLanguage();
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
    return date.toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US', {
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
        return <span className="history-status-badge history-status-executed">✓ {t('executed')}</span>;
      case 'pending':
        return <span className="history-status-badge history-status-pending">⏳ {t('pending')}</span>;
      case 'failed':
        return <span className="history-status-badge history-status-failed">✕ {t('failed')}</span>;
    }
  };

  if (loading) {
    return (
      <div className="history-screen">
        <header className="history-header">
          <h1 className="history-title">📊 {t('historyHeader')}</h1>
        </header>
        <div className="history-loading">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="history-screen">
      <header className="history-header">
        <h1 className="history-title">📊 {t('historyHeader')}</h1>
      </header>

      {/* タブ切り替え */}
      <div className="history-tabs">
        <button
          className={`history-tab ${activeTab === 'proposals' ? 'history-tab-active' : ''}`}
          onClick={() => setActiveTab('proposals')}
        >
          🤖 {t('aiProposalLog')}
        </button>
        <button
          className={`history-tab ${activeTab === 'transactions' ? 'history-tab-active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          📜 {t('transactionHistory')}
        </button>
      </div>

      <div className="history-content">
        {/* AI提案ログタブ */}
        {activeTab === 'proposals' && (
          <>
            {proposals.length === 0 ? (
              <div className="history-empty">
                <div className="history-empty-icon">🤖</div>
                <p className="history-empty-text">{t('noProposalHistory')}</p>
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
                <p className="history-empty-text">{t('noTransactionHistory')}</p>
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
                    <span className="history-item-amount-label">{t('conversionAmount')}</span>
                    <span className="history-item-amount-value">
                      {tx.arsAmount.toLocaleString()} {t('ars')}
                    </span>
                  </div>
                  <div className="history-item-arrow">→</div>
                  <div className="history-item-amount">
                    <span className="history-item-amount-label">{t('receiveAmount')}</span>
                    <span className="history-item-amount-value history-item-amount-usdc">
                      {tx.usdcAmount.toFixed(2)} {t('usdc')}
                    </span>
                  </div>
                </div>

                <div className="history-item-details">
                  <div className="history-item-detail">
                    <span className="history-item-detail-label">{t('rate')}:</span>
                    <span className="history-item-detail-value">
                      {tx.rateSource} {tx.exchangeRate.toLocaleString()} {t('ars')}/USD
                    </span>
                  </div>
                  <div className="history-item-detail">
                    <span className="history-item-detail-label">{t('gasFee')}:</span>
                    <span className="history-item-detail-value">{tx.gasPaid} POL</span>
                  </div>
                </div>

                <div className="history-item-txhash">
                  <span className="history-item-txhash-label">{t('txHash')}:</span>
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
