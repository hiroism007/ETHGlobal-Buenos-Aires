// ============================================================================
// DashboardScreen: メインのダッシュボード画面（State管理ベース）
// ============================================================================

import { useState, useEffect } from 'react';
import type { Proposal, SalarySettings, WalletSummary } from '../types';
import { createProposal, getSettings, executeProposal, getWalletSummary } from '../api/salary';
import { ExecutionResultCard } from '../components/ExecutionResultCard';
import { getLatestProposal } from '../api/proposals';
import type { ProposalHistoryItem } from '../types/proposal';

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
  // デモモードフラグ
  const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

  // デモモード用のモック提案データ
  const mockProposal: Proposal = {
    proposalId: 'demo_001',
    createdAt: new Date().toISOString(),
    salaryAmountArs: 120000,
    convertAmountArs: 72000,
    amountUsdc: 56.89,
    bestRateSource: 'BLUE',
    bestRateArsPerUsdc: 1265.5,
    gasFeeArs: 15,
    reason: 'ガス代が低く、BLUEレートが過去1週間で最高値に近い水準です。今が変換の好機です。',
  };

  // 統一されたState管理（デモモードでは初期状態を'proposal'に）
  const [homeState, setHomeState] = useState<HomeState>(
    DEMO_MODE ? { status: 'proposal', proposal: mockProposal } : { status: 'idle' }
  );
  const [settings, setSettings] = useState<SalarySettings | null>(null);
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  const [latestProposal, setLatestProposal] = useState<ProposalHistoryItem | null>(null);

  // 給料日フラグ（デモ用に固定可能）
  const isPayday = true; // デモ用に固定: true にすると常に給料日として扱う

  // 未読の提案通知があるかどうか（デモモードでは常に表示）
  const [hasUnreadProposal, setHasUnreadProposal] = useState(DEMO_MODE || true);

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

    setHomeState({ status: 'proposing' });
    try {
      const newProposal = await createProposal();
      setHomeState({ status: 'proposal', proposal: newProposal });
    } catch (err) {
      setHomeState({
        status: 'error',
        message: err instanceof Error ? err.message : '提案の取得に失敗しました',
      });
    }
  };

  /**
   * 提案を実行（proposal → executing → completed）
   */
  const handleExecute = async () => {
    if (homeState.status !== 'proposal') return;

    const proposal = homeState.proposal;
    setHomeState({ status: 'executing', proposal });

    try {
      const result = await executeProposal(proposal.proposalId);

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
      setHomeState({
        status: 'error',
        message: err instanceof Error ? err.message : '実行に失敗しました',
      });
    }
  };

  /**
   * 提案をスキップ（proposal → idle）
   */
  const handleSkip = () => {
    setHomeState({ status: 'idle' });
  };

  /**
   * 提案の理由を詳しく聞く（チャット画面へ遷移）
   * 提案内容をチャットに渡して、AIの説明をプリロードする
   */
  const handleAskWhy = (proposal: Proposal) => {
    // 提案内容をlocalStorageに保存（チャット画面で取得）
    localStorage.setItem('preloadProposal', JSON.stringify(proposal));

    // チャットタブに遷移（App.jsxのタブ切り替え機能を使用）
    // 注: 実際の実装ではContext APIやZustandなどの状態管理を使う方が良い
    window.dispatchEvent(new CustomEvent('switchTab', { detail: 'chat' }));
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
      {/* ヘッダー */}
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <h1 className="dashboard-app-name">💼 Porteño</h1>
          <button
            className="dashboard-notification-button"
            aria-label="通知"
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
          <div className="hero-card hero-card-empty">
            <div className="hero-card-icon">🤖</div>
            <h2 className="hero-card-title">AIがあなたの給料を守っています</h2>
            <p className="hero-card-description">
              レート・ガス代を24時間監視し、
              <br />
              給料日に最適なタイミングで提案します。
            </p>
            <div className="hero-card-status">
              <div className="hero-card-status-indicator">
                <span className="hero-card-status-dot"></span>
                <span className="hero-card-status-text">監視中</span>
              </div>
              <div className="hero-card-status-info">
                次回給料日: {settings?.paymentDay}日 （あと{daysUntilPayday}日）
              </div>
              {/* 最後の提案行（提案が存在する場合のみ表示） */}
              {latestProposal && (
                <div className="hero-card-last-proposal">
                  最後の提案:{' '}
                  {new Date(latestProposal.createdAt).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  })}{' '}
                  {new Date(latestProposal.createdAt).toLocaleTimeString('ja-JP', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  （{latestProposal.bestRateSource}）
                </div>
              )}
            </div>

            {/* 給料日の場合、特別なメッセージを表示 */}
            {isPayday && (
              <div className="hero-card-payday-notice">
                今日は給料日です。AIから提案が届いています。
              </div>
            )}

            <button
              className="hero-card-button hero-card-button-demo"
              onClick={handleCheckProposal}
            >
              🔔 今日の提案を開く
            </button>
          </div>
        )}

        {/* ========== proposing: 提案生成中 ========== */}
        {homeState.status === 'proposing' && (
          <div className="hero-card hero-card-loading">
            <div className="loading-spinner"></div>
            <p className="loading-text">
              AIが最適な条件を計算しています...
            </p>
          </div>
        )}

        {/* ========== proposal: 提案カード表示 ========== */}
        {homeState.status === 'proposal' && (
          <div className="hero-card hero-card-active">
            {/* AIが提案したタイムスタンプ */}
            <div className="proposal-timestamp">
              AIが給料のドル化タイミングを提案しました（
              {new Date(homeState.proposal.createdAt).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              })}{' '}
              {new Date(homeState.proposal.createdAt).toLocaleTimeString('ja-JP', {
                hour: '2-digit',
                minute: '2-digit',
              })}
              ）
            </div>

            <div className="hero-card-badge">
              <span className="hero-card-badge-icon">✨</span>
              <span className="hero-card-badge-text">今がチャンス！</span>
            </div>

            <h3 className="hero-card-title-active">
              今日の給料をドル化しましょう
            </h3>

            <div className="hero-card-conversion">
              <div className="hero-card-amount">
                <span className="hero-card-amount-label">変換額</span>
                <span className="hero-card-amount-value">
                  {homeState.proposal.convertAmountArs.toLocaleString()}
                  <span className="hero-card-amount-currency">ARS</span>
                </span>
              </div>
              <div className="hero-card-arrow">→</div>
              <div className="hero-card-amount">
                <span className="hero-card-amount-label">受取額</span>
                <span className="hero-card-amount-value hero-card-amount-value-usdc">
                  {homeState.proposal.amountUsdc.toFixed(2)}
                  <span className="hero-card-amount-currency">USDC</span>
                </span>
              </div>
            </div>

            <div className="hero-card-reason">
              <div className="hero-card-reason-icon">💡</div>
              <div className="hero-card-reason-text">{homeState.proposal.reason}</div>
            </div>

            <div className="hero-card-meta">
              <div className="hero-card-meta-item">
                レート: {homeState.proposal.bestRateArsPerUsdc.toLocaleString()} ARS
              </div>
              <div className="hero-card-meta-divider">•</div>
              <div className="hero-card-meta-item">
                ガス代: {homeState.proposal.gasFeeArs} ARS
              </div>
            </div>

            <div className="hero-card-actions">
              <button
                className="hero-card-button hero-card-button-primary"
                onClick={handleExecute}
              >
                この条件で実行する
              </button>
              <button
                className="hero-card-button hero-card-button-secondary"
                onClick={handleSkip}
              >
                今回はスキップ
              </button>
            </div>

            {/* AIに理由を詳しく聞くボタン */}
            <button
              className="hero-card-ask-why-button"
              onClick={() => handleAskWhy(homeState.proposal)}
            >
              理由を詳しく聞く ▶
            </button>
          </div>
        )}

        {/* ========== executing: 実行中 ========== */}
        {homeState.status === 'executing' && (
          <div className="hero-card hero-card-loading">
            <div className="loading-spinner"></div>
            <p className="loading-text">
              オンチェーンで実行しています...
              <br />
              しばらくお待ちください
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
              <div className="wallet-summary-label">保有USDC</div>
              <div className="wallet-summary-value">
                {walletSummary.currentUsdcBalance.toFixed(2)} USDC
              </div>
              {walletSummary.arsEquivalent && (
                <div className="wallet-summary-subtext">
                  ≒ {walletSummary.arsEquivalent.toLocaleString()} ARS 相当
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
                      インフレから守れた給料
                    </div>
                    <div className="wallet-summary-savings-value">
                      +{walletSummary.totalSavingsArs.toLocaleString()} ARS
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
