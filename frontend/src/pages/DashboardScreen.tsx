// ============================================================================
// DashboardScreen: メインのダッシュボード画面（State管理ベース）
// ============================================================================

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import type { Proposal, SalarySettings, WalletSummary } from '../types';
import { createProposal, getSettings, executeProposal, getWalletSummary } from '../api/salary';
import { ExecutionResultCard } from '../components/ExecutionResultCard';
import { getLatestProposal } from '../api/proposals';
import type { ProposalHistoryItem } from '../types/proposal';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../api/client';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageToggle from '../components/LanguageToggle';

// 実行結果の型
interface ExecuteResult {
  txHash: string;
  actualAmountUsdc: number;
  executedAt: string;
}

// ホーム画面のState型
type HomeState =
  | { status: 'idle' }
  | { status: 'proposing' }
  | { status: 'proposal'; proposal: Proposal }
  | { status: 'executing'; proposal: Proposal }
  | { status: 'completed'; proposal: Proposal; result: ExecuteResult }
  | { status: 'error'; message: string };

export function DashboardScreen() {
  const { user, walletAddress } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  // デモモードフラグ
  const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

  // デバッグ: URL全体を確認
  console.log('Current URL:', window.location.href);
  console.log('Search params:', window.location.search);
  console.log('searchParams.get("scenario"):', searchParams.get('scenario'));
  console.log('All searchParams:', Array.from(searchParams.entries()));

  // URLパラメータからシナリオを取得
  const scenario = searchParams.get('scenario') || 'best'; // デフォルトは best

  // シナリオをlocalStorageに保存（ChatScreenで使用）
  useEffect(() => {
    localStorage.setItem('chatScenario', scenario);
    console.log('Scenario set to:', scenario); // デバッグ用
  }, [scenario]);

  // デモモード用のモック提案データ
  const mockProposal: Proposal = {
    proposalId: 'demo_001',
    createdAt: new Date().toISOString(),
    salaryAmountArs: 120000,
    convertAmountArs: 72000,
    amountUsdc: 56.4,
    bestRateSource: 'BLUE',
    bestRateArsPerUsdc: 1276.6,
    gasFeeArs: 0.015,
    reason: 'ガス代が低く、BLUEレートが他の市場（MEP・CCL）より有利です。今が変換の好機です。',
  };

  // 統一されたState管理
  const [homeState, setHomeState] = useState<HomeState>(
    DEMO_MODE && scenario === 'best' ? { status: 'proposal', proposal: mockProposal } : { status: 'idle' }
  );
  const [settings, setSettings] = useState<SalarySettings | null>(null);
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  const [latestProposal, setLatestProposal] = useState<ProposalHistoryItem | null>(null);

  // 給料日フラグ（デモ用に固定可能）
  const isPayday = true; // デモ用に固定: true にすると常に給料日として扱う

  // 未読の提案通知があるかどうか（デモモードでは常に表示）
  const [hasUnreadProposal, setHasUnreadProposal] = useState(false);

  /**
   * 初期データ取得
   * - 設定、ウォレットサマリー、最新のAI提案を取得
   */
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [settingsData, summaryData, latestProposalData] = await Promise.all([
          getSettings(),
          getWalletSummary(),
          getLatestProposal(),
        ]);
        setSettings(settingsData);
        setWalletSummary(summaryData);
        setLatestProposal(latestProposalData);
      } catch (err) {
        console.error('初期データの取得に失敗:', err);
      }
    };

    fetchInitialData();
  }, []);

  /**
   * 給料日までの日数を計算
   */
  const getDaysUntilPayday = (): number => {
    if (!settings) return 0;
    const today = new Date();
    const nextPayday = new Date(
      today.getFullYear(),
      today.getMonth(),
      settings.paymentDay
    );
    if (nextPayday < today) {
      nextPayday.setMonth(nextPayday.getMonth() + 1);
    }
    return Math.ceil((nextPayday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  /**
   * AIの提案を確認（idle → proposing → proposal）
   * 「🔔 今日の提案を開く」ボタンまたはヘッダーのベルをタップしたときに呼ばれる
   */
  const handleCheckProposal = async () => {
    // 未読フラグをクリア
    setHasUnreadProposal(false);

    if (!user?.userId) {
      setHomeState({
        status: 'error',
        message: 'ログインが必要です',
      });
      return;
    }

    setHomeState({ status: 'proposing' });
    try {
      // 新しいAPI: POST /propose を呼び出す
      const response = await apiClient.createPropose({
        userId: user.userId
      });

      // レスポンスをProposal型に変換
      const newProposal: Proposal = {
        proposalId: response.proposalId,
        createdAt: new Date().toISOString(),
        salaryAmountArs: parseFloat(response.details.salaryAmountArs),
        convertAmountArs: parseFloat(response.details.convertArs),
        amountUsdc: parseFloat(response.details.amountUsdc),
        bestRateSource: response.details.bestRate.source,
        bestRateArsPerUsdc: parseFloat(response.details.bestRate.rateArsPerUsdc),
        gasFeeArs: 0.015, // TODO: バックエンドから取得
        reason: response.assistantText,
      };

      setHomeState({ status: 'proposal', proposal: newProposal });
    } catch (err) {
      console.error('Propose API error:', err);

      // エラー時は旧APIにフォールバック
      try {
        const newProposal = await createProposal();
        setHomeState({ status: 'proposal', proposal: newProposal });
      } catch (fallbackErr) {
        setHomeState({
          status: 'error',
          message: fallbackErr instanceof Error ? fallbackErr.message : '提案の取得に失敗しました',
        });
      }
    }
  };

  /**
   * 提案を実行（proposal → executing → completed）
   */
  const handleExecute = async () => {
    if (homeState.status !== 'proposal') return;

    if (!user?.userId || !walletAddress) {
      setHomeState({
        status: 'error',
        message: 'ログインが必要です',
      });
      return;
    }

    const proposal = homeState.proposal;
    setHomeState({ status: 'executing', proposal });

    try {
      // TODO: ARS送金のtxHashを取得（現在は仮実装）
      const arsTxHash = '0x' + Math.random().toString(16).substr(2, 64);

      // 新しいAPI: POST /execute (action=confirm) を呼び出す
      const executeResponse = await apiClient.executePropose({
        userId: user.userId,
        proposalId: proposal.proposalId,
        action: 'confirm',
        userWalletAddress: walletAddress,
        arsTxHash: arsTxHash
      });

      const result: ExecuteResult = {
        txHash: executeResponse.txHash || '0x...',
        actualAmountUsdc: proposal.amountUsdc,
        executedAt: new Date().toISOString()
      };

      // 完了画面へ遷移
      setHomeState({
        status: 'completed',
        proposal,
        result,
      });

      // ウォレットサマリーを再取得
      const updatedSummary = await getWalletSummary();
      setWalletSummary(updatedSummary);
    } catch (err) {
      console.error('Execute API error:', err);

      // エラー時は旧APIにフォールバック
      try {
        const result = await executeProposal(proposal.proposalId);
        setHomeState({
          status: 'completed',
          proposal,
          result,
        });

        const updatedSummary = await getWalletSummary();
        setWalletSummary(updatedSummary);
      } catch (fallbackErr) {
        setHomeState({
          status: 'error',
          message: fallbackErr instanceof Error ? fallbackErr.message : '実行に失敗しました',
        });
      }
    }
  };

  /**
   * 提案をスキップ（proposal → idle）
   */
  const handleSkip = async () => {
    if (homeState.status !== 'proposal') return;

    if (!user?.userId) {
      console.error('User not authenticated');
      setHomeState({ status: 'idle' });
      return;
    }

    const proposal = homeState.proposal;

    try {
      // 新しいAPI: POST /execute (action=skip) を呼び出す
      await apiClient.executePropose({
        userId: user.userId,
        proposalId: proposal.proposalId,
        action: 'skip'
      });

      setHomeState({ status: 'idle' });
    } catch (err) {
      console.error('Skip API error:', err);
      // エラーでもidleに戻す
      setHomeState({ status: 'idle' });
    }
  };

  /**
   * 提案の理由を詳しく聞く（チャット画面へ遷移）
   * 提案内容をチャットに渡して、AIの説明をプリロードする
   */
  const handleAskWhy = (proposal: Proposal) => {
    // 提案内容をlocalStorageに保存（チャット画面で取得）
    localStorage.setItem('preloadProposal', JSON.stringify(proposal));
    localStorage.setItem('chatScenario', 'best');

    // チャット画面へ遷移
    navigate('/chat');
  };

  /**
   * ホームに戻る（completed → idle）
   * 最新のAI提案履歴を再取得して表示を更新
   */
  const handleBackToHome = async () => {
    setHomeState({ status: 'idle' });

    // 最新の提案を再取得
    try {
      const latestProposalData = await getLatestProposal();
      setLatestProposal(latestProposalData);
    } catch (err) {
      console.error('最新の提案の取得に失敗:', err);
    }
  };

  const daysUntilPayday = getDaysUntilPayday();

  return (
    <div className="dashboard-screen">
      <LanguageToggle />
      {/* ヘッダー */}
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <h1 className="dashboard-app-name">💱 {t('appName')}</h1>
          <button
            className="dashboard-notification-button"
            aria-label={t('notification')}
            onClick={handleCheckProposal}
          >
            🔔
            {/* 未読の提案通知がある場合、赤バッジを表示 */}
            {hasUnreadProposal && <span className="notification-badge"></span>}
          </button>
        </div>
      </header>

      {/* コンテンツ */}
      <div className="dashboard-content">
        {/* エラー表示 */}
        {homeState.status === 'error' && (
          <div className="dashboard-error">
            <span>❌</span>
            <p>{homeState.message}</p>
          </div>
        )}

        {/* ========== idle: AIが監視中 ========== */}
        {homeState.status === 'idle' && (
          <>
            {/* scenario=wait の場合 */}
            {DEMO_MODE && scenario === 'wait' ? (
              <div className="hero-card hero-card-empty">
                <div className="hero-card-status-indicator" style={{ marginBottom: '20px' }}>
                  <span className="hero-card-status-dot"></span>
                  <span className="hero-card-status-text">{t('monitoring')}</span>
                </div>
                <p className="hero-card-description" style={{ marginBottom: '24px', fontSize: '0.95em' }}>
                  {t('cambaiMonitoring')}
                </p>

                <div className="hero-card-wait-message">
                  <div className="hero-card-icon">⏳</div>
                  <h2 className="hero-card-title">{t('waitMessage')}</h2>
                  <p className="hero-card-description">
                    {t('waitDescription')}
                  </p>
                </div>

                <button
                  className="hero-card-button hero-card-button-demo"
                  onClick={() => {
                    localStorage.setItem('chatScenario', 'wait');
                    window.dispatchEvent(new CustomEvent('switchTab', { detail: 'chat' }));
                  }}
                >
                  💬 {t('askCurrentStatus')}
                </button>
              </div>
            ) : (
              /* scenario=best または通常モード */
              <div className="hero-card hero-card-empty">
                <div className="hero-card-icon">🤖</div>
                <h2 className="hero-card-title">{t('aiProtecting')}</h2>
                <p className="hero-card-description">
                  {t('aiDescription')}
                </p>
                <div className="hero-card-status">
                  <div className="hero-card-status-indicator">
                    <span className="hero-card-status-dot"></span>
                    <span className="hero-card-status-text">{t('monitoring')}</span>
                  </div>
                  <div className="hero-card-status-info">
                    {t('nextPayday')}: {settings?.paymentDay}{language === 'ja' ? '日' : 'th'} （{t('daysRemaining')}{daysUntilPayday}{t('days')}）
                  </div>
                  {latestProposal && (
                    <div className="hero-card-last-proposal">
                      {t('lastProposal')}:{' '}
                      {new Date(latestProposal.createdAt).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      })}{' '}
                      {new Date(latestProposal.createdAt).toLocaleTimeString(language === 'ja' ? 'ja-JP' : 'en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      （{latestProposal.bestRateSource}）
                    </div>
                  )}
                </div>

                {isPayday && (
                  <div className="hero-card-payday-notice">
                    {t('paydayNotice')}
                  </div>
                )}

                <button
                  className="hero-card-button hero-card-button-demo"
                  onClick={handleCheckProposal}
                >
                  🔔 {t('openProposal')}
                </button>
              </div>
            )}
          </>
        )}

        {/* ========== proposing: 提案生成中 ========== */}
        {homeState.status === 'proposing' && (
          <div className="hero-card hero-card-loading">
            <div className="loading-spinner"></div>
            <p className="loading-text">
              {t('calculating')}
            </p>
          </div>
        )}

        {/* ========== proposal: 提案カード表示 ========== */}
        {homeState.status === 'proposal' && (
          <div className="hero-card hero-card-active">
            {/* AIが提案したタイムスタンプ */}
            <div className="proposal-timestamp">
              <div className="proposal-timestamp-message">
                🤖 {t('proposalMessage')}
              </div>
              <div className="proposal-timestamp-date">
                {new Date(homeState.proposal.createdAt).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                })}{' '}
                {new Date(homeState.proposal.createdAt).toLocaleTimeString(language === 'ja' ? 'ja-JP' : 'en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>

            <h3 className="hero-card-title-active">
              {t('proposalTitle')}
            </h3>

            <div className="hero-card-conversion">
              <div className="hero-card-amount">
                <span className="hero-card-amount-label">{t('conversionAmount')}</span>
                <span className="hero-card-amount-value">
                  {homeState.proposal.convertAmountArs.toLocaleString()}
                  <span className="hero-card-amount-currency">{t('ars')}</span>
                </span>
              </div>
              <div className="hero-card-arrow">→</div>
              <div className="hero-card-amount">
                <span className="hero-card-amount-label">{t('receiveAmount')}</span>
                <span className="hero-card-amount-value hero-card-amount-value-usdc">
                  {homeState.proposal.amountUsdc.toFixed(2)}
                  <span className="hero-card-amount-currency">{t('usdc')}</span>
                </span>
              </div>
            </div>

            <div className="hero-card-reason">
              <div className="hero-card-reason-icon">💡</div>
              <div className="hero-card-reason-text">
                {language === 'ja'
                  ? 'ガス代が低く、BLUEレートが他の市場（MEP・CCL）より有利です。今が変換の好機です。'
                  : 'Gas fees are low, and the BLUE rate is more favorable than other markets (MEP・CCL). Now is a great time to convert.'}
              </div>
            </div>

            <div className="hero-card-meta">
              <div className="hero-card-meta-item">
                {t('rate')}: {homeState.proposal.bestRateArsPerUsdc.toLocaleString()} {t('ars')}
              </div>
              <div className="hero-card-meta-divider">•</div>
              <div className="hero-card-meta-item">
                {t('gasFee')}: {homeState.proposal.gasFeeArs} PoL
              </div>
            </div>

            <div className="hero-card-actions">
              <button
                className="hero-card-button hero-card-button-primary"
                onClick={handleExecute}
              >
                {t('executeProposal')}
              </button>
              <button
                className="hero-card-button hero-card-button-secondary"
                onClick={handleSkip}
              >
                {t('skipThis')}
              </button>
            </div>

            {/* Camb.aiに理由を詳しく聞くボタン */}
            <button
              className="hero-card-ask-why-button"
              onClick={() => handleAskWhy(homeState.proposal)}
            >
              🤖 {t('askWhy')}
            </button>
          </div>
        )}

        {/* ========== executing: 実行中 ========== */}
        {homeState.status === 'executing' && (
          <div className="hero-card hero-card-loading">
            <div className="loading-spinner"></div>
            <p className="loading-text">
              {t('executing')}
            </p>
          </div>
        )}

        {/* ========== completed: 完了画面 ========== */}
        {homeState.status === 'completed' && (
          <ExecutionResultCard
            proposal={homeState.proposal}
            result={homeState.result}
            onClose={handleBackToHome}
          />
        )}

        {/* ウォレットサマリー */}
        {walletSummary && (
          <div className="wallet-summary">
            <div className="wallet-summary-main">
              <div className="wallet-summary-label">{t('holdingUsdc')}</div>
              <div className="wallet-summary-value">
                {walletSummary.currentUsdcBalance.toFixed(2)} {t('usdc')}
              </div>
              {walletSummary.arsEquivalent && (
                <div className="wallet-summary-subtext">
                  ≒ {walletSummary.arsEquivalent.toLocaleString()} {t('ars')} {t('arsEquivalent')}
                </div>
              )}
            </div>

            {walletSummary.totalSavingsArs && (
              <>
                <div className="wallet-summary-divider" />
                <div className="wallet-summary-savings">
                  <div className="wallet-summary-savings-icon">💰</div>
                  <div className="wallet-summary-savings-content">
                    <div className="wallet-summary-savings-label">
                      {t('protectedSalary')}
                    </div>
                    <div className="wallet-summary-savings-value">
                      +{walletSummary.totalSavingsArs.toLocaleString()} {t('ars')}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
