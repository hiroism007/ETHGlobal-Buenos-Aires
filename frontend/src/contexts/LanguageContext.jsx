import { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export const translations = {
  ja: {
    // Auth Page
    appName: 'Camb.ai',
    appSubtitle: '給料を守るスマートウォレット',
    signInTitle: 'サインインして始める',
    signInDescription: 'メールアドレスで認証すると、あなた専用の AI スマートウォレットを自動生成します',
    authDescription: 'シードフレーズ不要・ガスレスで、安全にウォレットを作成できます。',
    secureWallet: '安全なウォレット生成',
    aiSuggestion: 'AI が自動提案',
    gasless: 'ガスレス取引',

    // Dashboard
    home: 'ホーム',
    chat: 'チャット',
    settings: '設定',
    history: '履歴',
    walletBalance: 'ウォレット残高',
    aiProposalTitle: 'Camb.aiが給料のドル化タイミングを提案しました',
    proposalTimestamp: '提案時刻',
    conversionAmount: '変換額',
    expectedRate: '採用レート',
    benefit: 'お得額',
    gasFee: 'ガス代',
    askWhy: 'Camb.aiに理由を詳しく聞く',
    bestTiming: 'ベストなタイミング',
    checking: '確認中...',

    // Chat
    chatWithAI: 'Camb.aiと話す',
    yourDedicated: 'あなた専用の',
    aiAssistant: 'AIアシスタント',
    typeMessage: 'メッセージを入力',
    frequentQuestions: 'よくある質問',
    closeMenu: '質問メニューを閉じる',
    changeAIRules: '給料日のAIルールを変えたい',
    checkProposalStatus: '今の提案状況を知りたい',
    rateDetails: 'レートの内訳も教えて',
    showChart: 'チャートを見せて',
    executeThis: 'この条件で実行する',
    skipThis: '今回はスキップ',
    backToHome: 'ホームへ戻る',
    changeRatio: '給料の割合を変更したい',
    changePayday: '給料日を変えたい',
    checkCurrentRate: '今日のレートを知りたい',
    settingsMenu: '設定変更・確認',
    closeSettingsMenu: '設定メニューを閉じる',
    rateComparisonTable: 'レート比較表',
    rateType: 'レート種別',
    receiveUsdc: '受取USDC',
    rateNote: 'BLUEレートが最も有利（少ないARSでより多くのUSDCを獲得）',
    pastSevenDaysChart: '過去7日間のレート推移',
    currentRateHighest: '現在のレートは過去7日間で最高値に近い水準です',

    // Settings
    settingsTitle: '自動ドル化ルール',
    payday: '給料日',
    everyMonth: '毎月',
    day: '日',
    conversionRatio: 'ドル化割合',
    autoConversion: '自動ドル化',
    autoConversionDesc: '給料日に自動的に提案を実行',
    saveSettings: '設定を保存',
    saving: '保存中...',
    settingsSaved: '✓ 設定を保存しました！',

    // History
    historyTitle: '取引履歴',
    noHistory: 'まだ取引履歴がありません',
    conversion: '変換',
    completed: '完了',

    // Dashboard - Additional
    notification: '通知',
    monitoring: '監視中',
    aiProtecting: 'AIがあなたの給料を守っています',
    aiDescription: 'レート・ガス代を24時間監視し、\n給料日に最適なタイミングで提案します。',
    nextPayday: '次回給料日',
    daysRemaining: 'あと',
    days: '日',
    lastProposal: '最後の提案',
    paydayNotice: '今日は給料日です。AIから提案が届いています。',
    openProposal: '今日の提案を開く',
    calculating: 'AIが最適な条件を計算しています...',
    proposalTitle: '今日の給料をドル化しましょう',
    receiveAmount: '受取額',
    rate: 'レート',
    executeProposal: 'この条件で実行する',
    executing: 'オンチェーンで実行しています...\nしばらくお待ちください',
    holdingUsdc: '保有USDC',
    arsEquivalent: '相当',
    protectedSalary: 'インフレから守れた給料',
    waitMessage: '今日はまだ様子を見たほうが良さそうです',
    waitDescription: 'レートとガス代が十分に有利ではありません。\n条件が揃えば、最適なタイミングで自動的にご提案します。',
    askCurrentStatus: '今の状況をチャットで聞く',
    cambaiMonitoring: 'Camb.ai は Blue / MEP / CCL とガス代を常時監視しています。',
    proposalMessage: 'Camb.aiが給料の\nドル化タイミングを提案しました',

    // Execution Result
    executionSuccess: '給料をドル化しました',
    todaysSavings: '本日の節約',
    executedAt: '実行日時',
    copyTxHash: 'TxHashをコピーしました',

    // Settings (Additional)
    settingsHeader: '設定',
    autoConversionRules: '自動ドル化ルール',
    walletInfo: 'ウォレット情報',
    address: 'アドレス (CDP Embedded Wallet)',
    userId: 'User ID',
    network: 'ネットワーク',
    connectionStatus: '接続状態',
    connected: '接続済み',
    disconnected: '未接続',
    copyAddress: 'アドレスをコピー',
    addressCopied: 'アドレスをコピーしました',
    appInfo: 'アプリ情報',
    version: 'バージョン',
    environment: '環境',
    settingsLoadError: '設定の読み込みに失敗しました',
    saveError: '保存に失敗しました',

    // History (Additional)
    historyHeader: '履歴',
    aiProposalLog: 'AI提案ログ',
    transactionHistory: '取引履歴',
    noProposalHistory: 'まだAI提案ログがありません',
    noTransactionHistory: 'まだ取引履歴がありません',
    txHash: 'TxHash',
    executed: '完了',
    pending: '処理中',
    failed: '失敗',

    // Common
    loading: '読み込み中...',
    ars: 'ARS',
    usdc: 'USDC',
    or: 'または',
  },
  en: {
    // Auth Page
    appName: 'Camb.ai',
    appSubtitle: 'Smart Wallet to Protect Your Salary',
    signInTitle: 'Sign In to Get Started',
    signInDescription: 'Authenticate with your email to auto-generate your dedicated AI smart wallet',
    authDescription: 'Create a wallet safely without seed phrases and gas fees.',
    secureWallet: 'Secure Wallet Generation',
    aiSuggestion: 'AI Auto-Suggestion',
    gasless: 'Gasless Transactions',

    // Dashboard
    home: 'Home',
    chat: 'Chat',
    settings: 'Settings',
    history: 'History',
    walletBalance: 'Wallet Balance',
    aiProposalTitle: 'Camb.ai suggests the optimal timing to convert your salary',
    proposalTimestamp: 'Proposal Time',
    conversionAmount: 'Conversion Amount',
    expectedRate: 'Exchange Rate',
    benefit: 'Savings',
    gasFee: 'Gas Fee',
    askWhy: 'Ask Camb.ai for details',
    bestTiming: 'Best Timing',
    checking: 'Checking...',

    // Chat
    chatWithAI: 'Chat with Camb.ai',
    yourDedicated: 'Your dedicated',
    aiAssistant: 'AI Assistant',
    typeMessage: 'Type a message',
    frequentQuestions: 'Frequent Questions',
    closeMenu: 'Close question menu',
    changeAIRules: 'Change AI rules for payday',
    checkProposalStatus: 'Check current proposal status',
    rateDetails: 'Show me rate details',
    showChart: 'Show me the chart',
    executeThis: 'Execute with this condition',
    skipThis: 'Skip this time',
    backToHome: 'Back to Home',
    changeRatio: 'Change conversion ratio',
    changePayday: 'Change payday',
    checkCurrentRate: "Check today's rate",
    settingsMenu: 'Settings & Info',
    closeSettingsMenu: 'Close settings menu',
    rateComparisonTable: 'Rate Comparison Table',
    rateType: 'Rate Type',
    receiveUsdc: 'Receive USDC',
    rateNote: 'BLUE rate is most favorable (get more USDC with less ARS)',
    pastSevenDaysChart: 'Rate Trends Over Past 7 Days',
    currentRateHighest: 'Current rate is near the highest level in the past 7 days',

    // Settings
    settingsTitle: 'Auto Conversion Rules',
    payday: 'Payday',
    everyMonth: 'Every month on',
    day: 'th',
    conversionRatio: 'Conversion Ratio',
    autoConversion: 'Auto Conversion',
    autoConversionDesc: 'Automatically execute proposal on payday',
    saveSettings: 'Save Settings',
    saving: 'Saving...',
    settingsSaved: '✓ Settings saved!',

    // History
    historyTitle: 'Transaction History',
    noHistory: 'No transaction history yet',
    conversion: 'Conversion',
    completed: 'Completed',

    // Dashboard - Additional
    notification: 'Notifications',
    monitoring: 'Monitoring',
    aiProtecting: 'AI is protecting your salary',
    aiDescription: 'Monitoring rates and gas fees 24/7,\nsuggesting optimal timing on payday.',
    nextPayday: 'Next payday',
    daysRemaining: 'in',
    days: 'days',
    lastProposal: 'Last proposal',
    paydayNotice: "Today is payday. You have a proposal from AI.",
    openProposal: "Open today's proposal",
    calculating: 'AI is calculating optimal conditions...',
    proposalTitle: "Let's convert your salary today",
    receiveAmount: 'Receive',
    rate: 'Rate',
    executeProposal: 'Execute with this condition',
    executing: 'Executing on-chain...\nPlease wait',
    holdingUsdc: 'USDC Balance',
    arsEquivalent: 'equivalent',
    protectedSalary: 'Salary protected from inflation',
    waitMessage: "It's better to wait for now",
    waitDescription: 'Rate and gas fee are not favorable enough.\nWe will suggest automatically when conditions are met.',
    askCurrentStatus: 'Ask chat about current status',
    cambaiMonitoring: 'Camb.ai is monitoring Blue / MEP / CCL rates and gas fees continuously.',
    proposalMessage: 'Camb.ai suggests\noptimal timing to convert',

    // Execution Result
    executionSuccess: 'Salary Converted Successfully',
    todaysSavings: "Today's Savings",
    executedAt: 'Executed At',
    copyTxHash: 'TxHash copied',

    // Settings (Additional)
    settingsHeader: 'Settings',
    autoConversionRules: 'Auto Conversion Rules',
    walletInfo: 'Wallet Information',
    address: 'Address (CDP Embedded Wallet)',
    userId: 'User ID',
    network: 'Network',
    connectionStatus: 'Connection Status',
    connected: 'Connected',
    disconnected: 'Disconnected',
    copyAddress: 'Copy Address',
    addressCopied: 'Address copied',
    appInfo: 'App Information',
    version: 'Version',
    environment: 'Environment',
    settingsLoadError: 'Failed to load settings',
    saveError: 'Failed to save',

    // History (Additional)
    historyHeader: 'History',
    aiProposalLog: 'AI Proposal Log',
    transactionHistory: 'Transaction History',
    noProposalHistory: 'No proposal history yet',
    noTransactionHistory: 'No transaction history yet',
    txHash: 'TxHash',
    executed: 'Completed',
    pending: 'Pending',
    failed: 'Failed',

    // Common
    loading: 'Loading...',
    ars: 'ARS',
    usdc: 'USDC',
    or: 'or',
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('ja');

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ja' ? 'en' : 'ja');
  };

  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
