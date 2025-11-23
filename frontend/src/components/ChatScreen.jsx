import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExecutionResultCard } from './ExecutionResultCard';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../api/client';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageToggle from './LanguageToggle';

// デモモード用のモックレスポンス関数
function getMockResponse(type, proposal, language) {
  const responsesJa = {
    reason: `今回このタイミングで提案した理由を説明しますね。

・採用レート：${proposal.bestRateSource}（${proposal.bestRateArsPerUsdc.toLocaleString()} ARS）
・ガス代：${proposal.gasFeeArs} PoL（低め）
・お得額：+${Math.floor(proposal.convertAmountArs * 0.034).toLocaleString()} ARS（3.4%）

BLUE/MEP/CCL を比較し、最も効率の良い条件でした。`,

    rate_detail: '各レートの詳細を表にまとめました。BLUEレートが他の市場（MEP・CCL）より有利で、最もお得にUSDCを獲得できます。',

    chart: '過去7日間のレート推移をグラフ化しました。BLUEレートが安定的に有利な水準を維持しており、今日が絶好のタイミングです。',

    execute: `了解しました！${proposal.convertAmountArs.toLocaleString()} ARSを${proposal.amountUsdc} USDCに変換します。実行ボタンを押してください。`,

    skip: '了解しました。今回の提案はスキップします。次回より良い条件のときに、また提案させていただきますね。',

    completed: '変換が完了しました！トランザクションはブロックチェーンに記録されました。ウォレットを確認してください。',

    fallback: '申し訳ありません、理解できませんでした。'
  };

  const responsesEn = {
    reason: `Let me explain why I'm suggesting this timing:

• Exchange Rate: ${proposal.bestRateSource} (${proposal.bestRateArsPerUsdc.toLocaleString()} ARS)
• Gas Fee: ${proposal.gasFeeArs} PoL (low)
• Savings: +${Math.floor(proposal.convertAmountArs * 0.034).toLocaleString()} ARS (3.4%)

After comparing BLUE/MEP/CCL, these are the most efficient conditions.`,

    rate_detail: 'Here\'s a detailed rate comparison table. The BLUE rate is more favorable than other markets (MEP・CCL), allowing you to get the most USDC.',

    chart: 'Here\'s a chart of the rate trends over the past 7 days. The BLUE rate has maintained a consistently favorable level, making today the perfect timing.',

    execute: `Got it! I'll convert ${proposal.convertAmountArs.toLocaleString()} ARS to ${proposal.amountUsdc} USDC. Please press the execute button.`,

    skip: 'Understood. I\'ll skip this proposal. I\'ll suggest again when better conditions arise.',

    completed: 'Conversion completed! The transaction has been recorded on the blockchain. Please check your wallet.',

    fallback: 'Sorry, I didn\'t understand that.'
  };

  const responses = language === 'ja' ? responsesJa : responsesEn;
  return responses[type] || responses.fallback;
}

function ChatScreen() {
  const { user, walletAddress } = useAuth();
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  // チャットシナリオを状態として管理
  const [chatScenario, setChatScenario] = useState(localStorage.getItem('chatScenario') || 'best');

  // localStorageの変更を監視
  useEffect(() => {
    const updateScenario = () => {
      const scenario = localStorage.getItem('chatScenario') || 'best';
      setChatScenario(scenario);
      console.log('Chat scenario updated to:', scenario);
    };

    // 初回読み込み時と、localStorageイベント時に更新
    updateScenario();
    window.addEventListener('storage', updateScenario);

    // 定期的にチェック（同一タブ内での変更も検知）
    const interval = setInterval(updateScenario, 500);

    return () => {
      window.removeEventListener('storage', updateScenario);
      clearInterval(interval);
    };
  }, []);

  // シナリオ別の初期メッセージ
  const getInitialMessage = () => {
    if (chatScenario === 'wait') {
      return language === 'ja'
        ? 'こんにちは！Camb.aiです。今日はまだ条件が整っていないので様子見をおすすめしています。設定の確認や変更、現在のレートの確認ができます。'
        : 'Hello! I\'m Camb.ai. The conditions aren\'t quite right yet today, so I recommend waiting. You can check or change your settings and view current rates.';
    }
    return language === 'ja'
      ? 'こんにちは！Camb.aiです。給料の管理や提案について相談できます。'
      : 'Hello! I\'m Camb.ai. I can help you manage your salary and provide conversion suggestions.';
  };

  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      text: '',
      timestamp: new Date()
    }
  ]);

  // 言語が変更されたら初期メッセージを更新
  useEffect(() => {
    setMessages(prev => {
      const newMessages = [...prev];
      newMessages[0] = {
        ...newMessages[0],
        text: getInitialMessage()
      };
      return newMessages;
    });
  }, [language, chatScenario]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const [currentProposal, setCurrentProposal] = useState(null);
  const [executionCompleted, setExecutionCompleted] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true); // 最初から展開

  // chatScenarioが変更されたらshowQuickActionsも更新
  useEffect(() => {
    setShowQuickActions(true);
  }, [chatScenario]);

  /**
   * プリロードされた提案を確認して、提案カードとAI説明メッセージを追加
   * ※ bestシナリオの場合のみ
   */
  useEffect(() => {
    // waitシナリオの場合はプリロード提案を無視
    if (chatScenario === 'wait') return;

    const preloadedProposal = localStorage.getItem('preloadProposal');
    if (preloadedProposal) {
      try {
        const proposal = JSON.parse(preloadedProposal);
        setCurrentProposal(proposal);

        // まず提案カードを表示
        setTimeout(() => {
          const proposalCardMessage = {
            id: Date.now(),
            type: 'proposal_card',
            proposal: proposal,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, proposalCardMessage]);

          // 次にAI説明メッセージを表示
          setTimeout(() => {
            const explanationMessage = {
              id: Date.now() + 1,
              type: 'ai',
              text: getMockResponse('reason', proposal, language),
              timestamp: new Date()
            };
            setMessages(prev => [...prev, explanationMessage]);
          }, 300);
        }, 150); // 150msディレイでフェードイン効果

        // localStorageをクリア
        localStorage.removeItem('preloadProposal');
      } catch (err) {
        console.error('プリロード提案の解析に失敗:', err);
      }
    }
  }, [chatScenario]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || !user?.userId) return;

    const messageText = inputText;
    setInputText('');

    // ユーザーメッセージを追加
    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // 実際のAPIを呼び出す
      const response = await apiClient.sendChatMessage({
        userId: user.userId,
        message: messageText
      });

      // AI応答を追加
      setTimeout(() => {
        const aiResponse = {
          id: Date.now() + 1,
          type: 'ai',
          text: response.reply,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiResponse]);
      }, 500);
    } catch (error) {
      console.error('Chat API error:', error);

      // エラー時はモック応答にフォールバック
      const input = messageText.toLowerCase();

      // 提案を要求するキーワードを検出
      if (input.includes('提案') || input.includes('ドル化') || input.includes('変換して') || input.includes('今日の')) {
        // AI応答を追加
        setTimeout(() => {
          const aiResponse = {
            id: Date.now() + 1,
            type: 'ai',
            text: '承知しました。現在の条件で提案を生成します...',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiResponse]);

          // 提案を生成
          handleCreateProposal();
        }, 500);
      } else {
        setTimeout(() => {
          const aiResponse = {
            id: Date.now() + 1,
            type: 'ai',
            text: getAIResponse(messageText),
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiResponse]);
        }, 500);
      }
    }
  };

  // 提案を生成する関数
  const handleCreateProposal = async () => {
    try {
      if (!user?.userId) {
        throw new Error('User not authenticated');
      }

      // POST /propose を呼び出す
      const response = await apiClient.createPropose({
        userId: user.userId
      });

      // 提案データを構築
      const proposal = {
        proposalId: response.proposalId,
        salaryAmountArs: parseFloat(response.details.salaryAmountArs),
        convertPercent: response.details.convertPercent,
        convertAmountArs: parseFloat(response.details.convertArs),
        amountUsdc: parseFloat(response.details.amountUsdc),
        bestRateSource: response.details.bestRate.source,
        bestRateArsPerUsdc: parseFloat(response.details.bestRate.rateArsPerUsdc),
        gasFeeArs: '0.032',
        reason: response.assistantText,
        createdAt: new Date().toISOString()
      };

      setCurrentProposal(proposal);

      // 提案カードを表示
      setTimeout(() => {
        const proposalCardMessage = {
          id: Date.now() + 2,
          type: 'proposal_card',
          proposal: proposal,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, proposalCardMessage]);

        // AI説明メッセージを表示
        setTimeout(() => {
          const explanationMessage = {
            id: Date.now() + 3,
            type: 'ai',
            text: getMockResponse('reason', proposal, language),
            timestamp: new Date()
          };
          setMessages(prev => [...prev, explanationMessage]);
          setExecutionCompleted(false); // 新しい提案なので実行完了フラグをリセット
        }, 300);
      }, 800);
    } catch (error) {
      console.error('Propose API error:', error);

      // エラー時はモック提案を生成
      const mockProposal = {
        proposalId: 'prop_' + Date.now(),
        salaryAmountArs: 144000,
        convertPercent: 50,
        convertAmountArs: 72000,
        amountUsdc: 56.91,
        bestRateSource: 'BLUE',
        bestRateArsPerUsdc: 1265.5,
        gasFeeArs: '0.032',
        reason: 'BLUEレートが有利で、ガス代も低めです。今日が絶好のタイミングです。',
        createdAt: new Date().toISOString()
      };

      setCurrentProposal(mockProposal);

      setTimeout(() => {
        const proposalCardMessage = {
          id: Date.now() + 2,
          type: 'proposal_card',
          proposal: mockProposal,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, proposalCardMessage]);

        setTimeout(() => {
          const explanationMessage = {
            id: Date.now() + 3,
            type: 'ai',
            text: getMockResponse('reason', mockProposal, language),
            timestamp: new Date()
          };
          setMessages(prev => [...prev, explanationMessage]);
          setExecutionCompleted(false);
        }, 300);
      }, 800);
    }
  };

  const getAIResponse = (userInput) => {
    const input = userInput.toLowerCase();

    if (language === 'ja') {
      if (input.includes('レート') || input.includes('為替')) {
        return '現在の為替レートは 1 USD = 1,200 ARS です。過去1週間の平均より良いレートですよ！';
      } else if (input.includes('変換') || input.includes('ドル')) {
        return '給料の50%をUSDCに変換する設定になっています。変換を実行しますか？';
      } else if (input.includes('設定')) {
        return '給料日は毎月5日、変換割合は50%に設定されています。変更したい場合は設定画面からどうぞ。';
      } else if (input.includes('履歴')) {
        return '今月は1回の変換を実行しました。詳細は履歴画面で確認できます。';
      } else {
        return 'ご質問ありがとうございます。給料の管理、為替レート、変換設定などについてお答えできます。';
      }
    } else {
      if (input.includes('rate') || input.includes('exchange')) {
        return 'The current exchange rate is 1 USD = 1,200 ARS. It\'s a better rate than the average over the past week!';
      } else if (input.includes('convert') || input.includes('dollar')) {
        return 'You\'re set to convert 50% of your salary to USDC. Would you like to execute the conversion?';
      } else if (input.includes('setting')) {
        return 'Your payday is set to the 5th of each month, with a 50% conversion ratio. You can change this in the settings screen.';
      } else if (input.includes('history')) {
        return 'You\'ve executed 1 conversion this month. You can see the details in the history screen.';
      } else {
        return 'Thank you for your question. I can help with salary management, exchange rates, conversion settings, and more.';
      }
    }
  };

  // waitシナリオ専用のアクションハンドラー
  const handleWaitAction = async (actionType) => {
    const timestamp = new Date();

    switch (actionType) {
      case 'change_ratio':
        // ドル化割合を変更
        setTimeout(async () => {
          const aiMessage = {
            id: Date.now(),
            type: 'ai',
            text: language === 'ja'
              ? '了解しました。ドル化割合を 60% に更新しました。\n\n次回の給料日から、給料の60%が自動的にUSDCに変換されます。'
              : 'Got it. I\'ve updated the conversion ratio to 60%.\n\nFrom the next payday, 60% of your salary will be automatically converted to USDC.',
            timestamp
          };
          setMessages(prev => [...prev, aiMessage]);
        }, 150);
        break;

      case 'change_payday':
        // 給料日を変更
        setTimeout(async () => {
          const aiMessage = {
            id: Date.now(),
            type: 'ai',
            text: language === 'ja'
              ? '給料日を毎月25日に変更しました。\n\n次回の給料日は来月25日です。その日にレートとガス代を監視して、最適なタイミングで提案します。'
              : 'I\'ve changed your payday to the 25th of each month.\n\nYour next payday is the 25th of next month. I\'ll monitor rates and gas fees on that day to suggest the optimal timing.',
            timestamp
          };
          setMessages(prev => [...prev, aiMessage]);
        }, 150);
        break;

      case 'show_settings':
        // 設定画面を表示
        setTimeout(() => {
          const aiMessage = {
            id: Date.now(),
            type: 'ai',
            text: language === 'ja'
              ? '給料日のAIルール設定画面を表示します。こちらで設定を変更できます。'
              : 'Here\'s the AI rule settings for payday. You can change your settings here.',
            timestamp
          };
          setMessages(prev => [...prev, aiMessage]);

          // 設定カードを追加
          setTimeout(() => {
            const settingsCardMessage = {
              id: Date.now() + 1,
              type: 'settings_card',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, settingsCardMessage]);
          }, 150);
        }, 150);
        break;

      case 'show_proposal_status':
        // 最新の提案状況を表示
        setTimeout(() => {
          const statusText = currentProposal
            ? (language === 'ja'
              ? `現在、提案が1件あります。\n\n💰 変換額: ${currentProposal.convertAmountArs.toLocaleString()} ARS\n💵 受取額: ${currentProposal.amountUsdc.toFixed(2)} USDC\n📈 レート: ${currentProposal.bestRateArsPerUsdc.toLocaleString()} ARS\n⛽ ガス代: ${currentProposal.gasFeeArs} PoL\n\n詳細は上の提案カードをご確認ください。`
              : `You currently have 1 proposal.\n\n💰 Amount: ${currentProposal.convertAmountArs.toLocaleString()} ARS\n💵 Receive: ${currentProposal.amountUsdc.toFixed(2)} USDC\n📈 Rate: ${currentProposal.bestRateArsPerUsdc.toLocaleString()} ARS\n⛽ Gas: ${currentProposal.gasFeeArs} PoL\n\nPlease check the proposal card above for details.`)
            : (language === 'ja'
              ? '現在、提案はありません。\n\n給料日になると、最適なタイミングでドル化の提案を行います。'
              : 'You currently have no proposals.\n\nOn payday, I\'ll suggest the optimal timing for conversion.');

          const aiMessage = {
            id: Date.now(),
            type: 'ai',
            text: statusText,
            timestamp
          };
          setMessages(prev => [...prev, aiMessage]);
        }, 150);
        break;

      default:
        return;
    }
  };

  // クイックアクションボタン（提案がある場合）
  const handleQuickAction = (actionType) => {
    if (!currentProposal) return;

    const timestamp = new Date();

    switch (actionType) {
      case 'rate_detail':
        // AIメッセージを追加
        setTimeout(() => {
          const aiMessage = {
            id: Date.now(),
            type: 'ai',
            text: getMockResponse('rate_detail', currentProposal, language),
            timestamp
          };
          setMessages(prev => [...prev, aiMessage]);

          // レート表メッセージを追加
          setTimeout(() => {
            const rateTableMessage = {
              id: Date.now() + 1,
              type: 'rate_table',
              proposal: currentProposal,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, rateTableMessage]);
          }, 150);
        }, 150);
        break;

      case 'chart':
        // AIメッセージを追加
        setTimeout(() => {
          const aiMessage = {
            id: Date.now(),
            type: 'ai',
            text: getMockResponse('chart', currentProposal, language),
            timestamp
          };
          setMessages(prev => [...prev, aiMessage]);

          // チャートメッセージを追加
          setTimeout(() => {
            const chartMessage = {
              id: Date.now() + 1,
              type: 'chart',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, chartMessage]);
          }, 150);
        }, 150);
        break;

      case 'execute':
        // AIメッセージを追加
        setTimeout(async () => {
          const aiMessage = {
            id: Date.now(),
            type: 'ai',
            text: getMockResponse('execute', currentProposal, language),
            timestamp
          };
          setMessages(prev => [...prev, aiMessage]);

          try {
            // POST /execute (action=confirm) を呼び出す
            if (!user?.userId || !walletAddress) {
              throw new Error('User not authenticated');
            }

            // proposalIdを取得（currentProposalにない場合は新規作成）
            let proposalId = currentProposal.proposalId;
            if (!proposalId) {
              const proposeResponse = await apiClient.createPropose({
                userId: user.userId
              });
              proposalId = proposeResponse.proposalId;
            }

            // TODO: ARS送金のtxHashを取得（現在は仮実装）
            const arsTxHash = '0x' + Math.random().toString(16).substr(2, 64);

            // 提案を実行
            const executeResponse = await apiClient.executePropose({
              userId: user.userId,
              proposalId: proposalId,
              action: 'confirm',
              userWalletAddress: walletAddress,
              arsTxHash: arsTxHash
            });

            // 実行結果メッセージを追加
            setTimeout(() => {
              const executionResult = {
                id: Date.now() + 1,
                type: 'execution_result',
                proposal: currentProposal,
                result: {
                  txHash: executeResponse.txHash,
                  explorerUrl: executeResponse.explorerUrl,
                  actualAmountUsdc: currentProposal.amountUsdc,
                  executedAt: new Date().toISOString()
                },
                timestamp: new Date()
              };
              setMessages(prev => [...prev, executionResult]);
              // 実行完了フラグを立てる
              setExecutionCompleted(true);
            }, 1000);
          } catch (error) {
            console.error('Execute API error:', error);

            // エラー時はモック応答
            setTimeout(() => {
              const executionResult = {
                id: Date.now() + 1,
                type: 'execution_result',
                proposal: currentProposal,
                result: {
                  txHash: '0x' + Math.random().toString(16).substr(2, 64),
                  actualAmountUsdc: currentProposal.amountUsdc,
                  executedAt: new Date().toISOString()
                },
                timestamp: new Date()
              };
              setMessages(prev => [...prev, executionResult]);
              setExecutionCompleted(true);
            }, 1000);
          }
        }, 150);
        break;

      case 'skip':
        // AIメッセージを追加
        setTimeout(async () => {
          try {
            if (!user?.userId) {
              throw new Error('User not authenticated');
            }

            // proposalIdを取得
            let proposalId = currentProposal.proposalId;
            if (!proposalId) {
              const proposeResponse = await apiClient.createPropose({
                userId: user.userId
              });
              proposalId = proposeResponse.proposalId;
            }

            // POST /execute (action=skip) を呼び出す
            await apiClient.executePropose({
              userId: user.userId,
              proposalId: proposalId,
              action: 'skip'
            });

            const aiMessage = {
              id: Date.now(),
              type: 'ai',
              text: getMockResponse('skip', currentProposal, language),
              timestamp
            };
            setMessages(prev => [...prev, aiMessage]);
            // スキップ後も深掘りメニューを非表示
            setExecutionCompleted(true);
          } catch (error) {
            console.error('Skip API error:', error);

            // エラー時もメッセージを表示
            const aiMessage = {
              id: Date.now(),
              type: 'ai',
              text: getMockResponse('skip', currentProposal, language),
              timestamp
            };
            setMessages(prev => [...prev, aiMessage]);
            setExecutionCompleted(true);
          }
        }, 150);
        break;

      default:
        return;
    }
  };

  return (
    <div className="chat-screen">
      <LanguageToggle />
      {/* ヘッダー */}
      <div className="chat-header">
        <h2 className="chat-header-title">🤖 {t('chatWithAI')}</h2>
        <p className="chat-header-subtitle">{t('yourDedicated')}{t('aiAssistant')}</p>
      </div>

      {/* チャットメッセージ */}
      <div className="chat-messages">
        {messages.map((message) => {
          // 設定カードメッセージ
          if (message.type === 'settings_card') {
            const SettingsCard = () => {
              const [paymentDay, setPaymentDay] = useState(25);
              const [convertPercent, setConvertPercent] = useState(60);
              const [autoConvert, setAutoConvert] = useState(true);
              const [saving, setSaving] = useState(false);

              const handleSave = async () => {
                setSaving(true);

                // デモ用：API呼び出しをスキップして成功メッセージのみ表示
                // await apiClient.updateUserSettings({
                //   userId: user.userId,
                //   dayOfMonth: paymentDay,
                //   convertPercent: convertPercent,
                //   autoConvertEnabled: autoConvert
                // });

                // 成功メッセージを追加
                setTimeout(() => {
                  const successText = language === 'ja'
                    ? `✓ 設定を保存しました！\n\n給料日: 毎月${paymentDay}日\nドル化割合: ${convertPercent}%\n自動ドル化: ${autoConvert ? 'ON' : 'OFF'}`
                    : `✓ Settings saved!\n\nPayday: ${paymentDay}th of each month\nConversion ratio: ${convertPercent}%\nAuto conversion: ${autoConvert ? 'ON' : 'OFF'}`;

                  const successMessage = {
                    id: Date.now(),
                    type: 'success_with_home_button',
                    text: successText,
                    timestamp: new Date()
                  };
                  setMessages(prev => [...prev, successMessage]);
                  setSaving(false);
                }, 300);
              };

              return (
                <div className="settings-inline-card">
                  <div className="settings-inline-header">
                    <span className="settings-inline-icon">💚</span>
                    <span className="settings-inline-title">{t('autoConversionRules')}</span>
                  </div>

                  <div className="settings-inline-content">
                    <div className="settings-inline-field">
                      <label className="settings-inline-label">{t('payday')}</label>
                      <select
                        className="settings-inline-select"
                        value={paymentDay}
                        onChange={(e) => setPaymentDay(Number(e.target.value))}
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                          <option key={day} value={day}>{t('everyMonth')} {day}{t('day')}</option>
                        ))}
                      </select>
                    </div>

                    <div className="settings-inline-field">
                      <label className="settings-inline-label">{t('conversionRatio')}: {convertPercent}%</label>
                      <input
                        type="range"
                        className="settings-inline-range"
                        min="0"
                        max="100"
                        step="5"
                        value={convertPercent}
                        onChange={(e) => setConvertPercent(Number(e.target.value))}
                      />
                      <div className="settings-inline-range-labels">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>

                    <div className="settings-inline-toggle-field">
                      <div className="settings-inline-toggle-label">
                        <div className="settings-inline-toggle-title">{t('autoConversion')}</div>
                        <div className="settings-inline-toggle-description">{t('autoConversionDesc')}</div>
                      </div>
                      <label className="settings-inline-toggle">
                        <input
                          type="checkbox"
                          checked={autoConvert}
                          onChange={(e) => setAutoConvert(e.target.checked)}
                        />
                        <span className="settings-inline-toggle-slider"></span>
                      </label>
                    </div>

                    <button
                      className="settings-inline-save-button"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? t('saving') : t('saveSettings')}
                    </button>
                  </div>
                </div>
              );
            };

            return <SettingsCard key={message.id} />;
          }

          // レート表メッセージ（bestシナリオ）
          if (message.type === 'rate_table') {
            // 固定のARS額から各レートでの受取額を計算
            const arsAmount = message.proposal.convertAmountArs;
            const blueRate = message.proposal.bestRateArsPerUsdc;
            const mepRate = blueRate * 1.02; // BLUEより2%不利
            const cclRate = blueRate * 1.04; // BLUEより4%不利

            return (
              <div key={message.id} className="rate-table-card">
                <div className="rate-table-header">📊 {t('rateComparisonTable')}</div>
                <table className="rate-table">
                  <thead>
                    <tr>
                      <th>{t('rateType')}</th>
                      <th>1 USDC =</th>
                      <th>{t('receiveUsdc')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="rate-table-row-best">
                      <td>BLUE ✓</td>
                      <td>{blueRate.toLocaleString(undefined, {maximumFractionDigits: 1})} ARS</td>
                      <td>{(arsAmount / blueRate).toFixed(2)} USDC</td>
                    </tr>
                    <tr>
                      <td>MEP</td>
                      <td>{mepRate.toLocaleString(undefined, {maximumFractionDigits: 1})} ARS</td>
                      <td>{(arsAmount / mepRate).toFixed(2)} USDC</td>
                    </tr>
                    <tr>
                      <td>CCL</td>
                      <td>{cclRate.toLocaleString(undefined, {maximumFractionDigits: 1})} ARS</td>
                      <td>{(arsAmount / cclRate).toFixed(2)} USDC</td>
                    </tr>
                  </tbody>
                </table>
                <div className="rate-table-note">
                  💡 {t('rateNote')}
                </div>
              </div>
            );
          }

          // レート表メッセージ（waitシナリオ）
          if (message.type === 'wait_rate_table') {
            // waitシナリオ用の現在レート
            const blueRate = 1285.2;
            const mepRate = 1310.9;
            const cclRate = 1336.6;
            const arsAmount = 72000; // サンプル金額

            return (
              <div key={message.id} className="rate-table-card">
                <div className="rate-table-header">📊 {language === 'ja' ? '現在のレート' : 'Current Rates'}</div>
                <table className="rate-table">
                  <thead>
                    <tr>
                      <th>{t('rateType')}</th>
                      <th>1 USDC =</th>
                      <th>{t('receiveUsdc')} (72,000 ARS)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="rate-table-row-best">
                      <td>BLUE ✓</td>
                      <td>{blueRate.toLocaleString(undefined, {maximumFractionDigits: 1})} ARS</td>
                      <td>{(arsAmount / blueRate).toFixed(2)} USDC</td>
                    </tr>
                    <tr>
                      <td>MEP</td>
                      <td>{mepRate.toLocaleString(undefined, {maximumFractionDigits: 1})} ARS</td>
                      <td>{(arsAmount / mepRate).toFixed(2)} USDC</td>
                    </tr>
                    <tr>
                      <td>CCL</td>
                      <td>{cclRate.toLocaleString(undefined, {maximumFractionDigits: 1})} ARS</td>
                      <td>{(arsAmount / cclRate).toFixed(2)} USDC</td>
                    </tr>
                  </tbody>
                </table>
                <div className="rate-table-note">
                  ⚠️ ガス代: 0.045 PoL（通常より高め）
                </div>
              </div>
            );
          }

          // 提案カードメッセージ
          if (message.type === 'proposal_card') {
            return (
              <div key={message.id} className="chat-proposal-card">
                {/* タイムスタンプ */}
                <div className="chat-proposal-timestamp">
                  <div className="chat-proposal-timestamp-message">
                    🤖✨ {t('aiProposalTitle')}
                  </div>
                  <div className="chat-proposal-timestamp-date">
                    {new Date(message.proposal.createdAt).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    })}{' '}
                    {new Date(message.proposal.createdAt).toLocaleTimeString(language === 'ja' ? 'ja-JP' : 'en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                <h3 className="chat-proposal-title">
                  {t('proposalTitle')}
                </h3>

                <div className="chat-proposal-conversion">
                  <div className="chat-proposal-amount">
                    <span className="chat-proposal-amount-label">{t('conversionAmount')}</span>
                    <span className="chat-proposal-amount-value">
                      {message.proposal.convertAmountArs.toLocaleString()}
                      <span className="chat-proposal-amount-currency">{t('ars')}</span>
                    </span>
                  </div>
                  <div className="chat-proposal-arrow">→</div>
                  <div className="chat-proposal-amount">
                    <span className="chat-proposal-amount-label">{t('receiveAmount')}</span>
                    <span className="chat-proposal-amount-value chat-proposal-amount-value-usdc">
                      {message.proposal.amountUsdc.toFixed(2)}
                      <span className="chat-proposal-amount-currency">{t('usdc')}</span>
                    </span>
                  </div>
                </div>

                <div className="chat-proposal-reason">
                  <div className="chat-proposal-reason-icon">💡</div>
                  <div className="chat-proposal-reason-text">
                    {language === 'ja'
                      ? 'ガス代が低く、BLUEレートが他の市場（MEP・CCL）より有利です。今が変換の好機です。'
                      : 'Gas fees are low, and the BLUE rate is more favorable than other markets (MEP・CCL). Now is a great time to convert.'}
                  </div>
                </div>

                <div className="chat-proposal-meta">
                  <div className="chat-proposal-meta-item">
                    {t('rate')}: {message.proposal.bestRateArsPerUsdc.toLocaleString()} {t('ars')}
                  </div>
                  <div className="chat-proposal-meta-divider">•</div>
                  <div className="chat-proposal-meta-item">
                    {t('gasFee')}: {message.proposal.gasFeeArs} PoL
                  </div>
                </div>
              </div>
            );
          }

          // 実行結果メッセージ
          if (message.type === 'execution_result') {
            return (
              <div key={message.id}>
                <ExecutionResultCard
                  proposal={message.proposal}
                  result={message.result}
                  onClose={() => window.location.href = '/home'}
                />
              </div>
            );
          }

          // チャートメッセージ
          if (message.type === 'chart') {
            // 過去7日間のレートデータ（より現実的な値動き）
            const rateData = language === 'ja'
              ? [
                  { day: '7日前', rate: 1205 },
                  { day: '6日前', rate: 1198 },
                  { day: '5日前', rate: 1215 },
                  { day: '4日前', rate: 1208 },
                  { day: '3日前', rate: 1232 },
                  { day: '2日前', rate: 1245 },
                  { day: '昨日', rate: 1252 },
                  { day: '今日', rate: 1265.5 }
                ]
              : [
                  { day: '7 days ago', rate: 1205 },
                  { day: '6 days ago', rate: 1198 },
                  { day: '5 days ago', rate: 1215 },
                  { day: '4 days ago', rate: 1208 },
                  { day: '3 days ago', rate: 1232 },
                  { day: '2 days ago', rate: 1245 },
                  { day: 'Yesterday', rate: 1252 },
                  { day: 'Today', rate: 1265.5 }
                ];

            const minRate = Math.min(...rateData.map(d => d.rate));
            const maxRate = Math.max(...rateData.map(d => d.rate));
            const rateRange = maxRate - minRate;

            // SVGのサイズ
            const width = 300;
            const height = 150;
            const padding = { top: 20, right: 20, bottom: 30, left: 50 };
            const chartWidth = width - padding.left - padding.right;
            const chartHeight = height - padding.top - padding.bottom;

            // データポイントの座標を計算
            const points = rateData.map((d, i) => {
              const x = padding.left + (i / (rateData.length - 1)) * chartWidth;
              const y = padding.top + chartHeight - ((d.rate - minRate) / rateRange) * chartHeight;
              return { x, y, rate: d.rate, day: d.day, isToday: i === rateData.length - 1 };
            });

            // 折れ線のパス
            const linePath = points.map((p, i) =>
              `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
            ).join(' ');

            // グラデーション用のエリアパス
            const areaPath = `M ${points[0].x} ${padding.top + chartHeight} ` +
              points.map(p => `L ${p.x} ${p.y}`).join(' ') +
              ` L ${points[points.length - 1].x} ${padding.top + chartHeight} Z`;

            return (
              <div key={message.id} className="chart-card">
                <div className="chart-header">📈 {t('pastSevenDaysChart')}</div>
                <div className="chart-content">
                  <svg
                    width="100%"
                    height={height}
                    viewBox={`0 0 ${width} ${height}`}
                    className="rate-chart-svg"
                  >
                    {/* グラデーション定義 */}
                    <defs>
                      <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#4CAF50" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#4CAF50" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>

                    {/* グリッドライン */}
                    {[0, 1, 2, 3, 4].map(i => {
                      const y = padding.top + (chartHeight / 4) * i;
                      return (
                        <line
                          key={i}
                          x1={padding.left}
                          y1={y}
                          x2={padding.left + chartWidth}
                          y2={y}
                          stroke="#e0e0e0"
                          strokeWidth="1"
                          strokeDasharray="2,2"
                        />
                      );
                    })}

                    {/* エリア */}
                    <path
                      d={areaPath}
                      fill="url(#areaGradient)"
                    />

                    {/* 折れ線 */}
                    <path
                      d={linePath}
                      fill="none"
                      stroke="#4CAF50"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* データポイント */}
                    {points.map((p, i) => (
                      <g key={i}>
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={p.isToday ? 5 : 3}
                          fill={p.isToday ? '#FF9800' : '#4CAF50'}
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                        {/* 今日のポイントにラベル */}
                        {p.isToday && (
                          <text
                            x={p.x}
                            y={p.y - 12}
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight="600"
                            fill="#FF9800"
                          >
                            {p.rate.toLocaleString()} ARS
                          </text>
                        )}
                      </g>
                    ))}

                    {/* X軸ラベル */}
                    <text x={padding.left} y={height - 5} fontSize="10" fill="#666">
                      {rateData[0].day}
                    </text>
                    <text x={padding.left + chartWidth} y={height - 5} fontSize="10" fill="#666" textAnchor="end">
                      {rateData[rateData.length - 1].day}
                    </text>

                    {/* Y軸ラベル */}
                    <text x={5} y={padding.top} fontSize="10" fill="#666">
                      {maxRate.toLocaleString()}
                    </text>
                    <text x={5} y={padding.top + chartHeight} fontSize="10" fill="#666">
                      {minRate.toLocaleString()}
                    </text>
                  </svg>

                  <div className="chart-info">
                    {t('currentRateHighest')}
                  </div>
                </div>
              </div>
            );
          }

          // 成功メッセージ（ホームへ戻るボタン付き）
          if (message.type === 'success_with_home_button') {
            return (
              <div key={message.id} className="chat-message chat-message-ai">
                <div className="chat-message-avatar">🤖</div>
                <div className="chat-message-content">
                  <div className="chat-message-text">{message.text}</div>
                  <button
                    className="chat-action-button chat-action-button-home"
                    onClick={() => navigate('/home')}
                  >
                    🏠 ホームへ戻る
                  </button>
                  <div className="chat-message-time">
                    {message.timestamp.toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            );
          }

          // 通常のメッセージ（AI or ユーザー）
          return (
            <div
              key={message.id}
              className={`chat-message ${message.type === 'ai' ? 'chat-message-ai' : 'chat-message-user'}`}
            >
              <div className="chat-message-avatar">
                {message.type === 'ai' ? '🤖' : '👤'}
              </div>
              <div className="chat-message-content">
                <div className="chat-message-text">{message.text}</div>
                <div className="chat-message-time">
                  {message.timestamp.toLocaleTimeString('ja-JP', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* クイックアクションボタン（bestシナリオ） */}
      {chatScenario === 'best' && (
        <div className="chat-quick-actions">
          <button
            className="chat-quick-actions-toggle"
            onClick={() => setShowQuickActions(!showQuickActions)}
          >
            <span className="chat-quick-actions-toggle-icon">
              {showQuickActions ? '▼' : '▶'}
            </span>
            <span className="chat-quick-actions-toggle-text">
              {showQuickActions ? t('closeMenu') : `💬 ${t('frequentQuestions')}`}
            </span>
          </button>

          {showQuickActions && (
            <div className="chat-quick-action-buttons">
              {currentProposal && !executionCompleted ? (
                <>
                  <button
                    className="chat-quick-action chat-quick-action-primary"
                    onClick={() => handleQuickAction('rate_detail')}
                  >
                    <span className="chat-quick-action-icon">📊</span>
                    {t('rateDetails')}
                  </button>
                  <button
                    className="chat-quick-action chat-quick-action-primary"
                    onClick={() => handleQuickAction('chart')}
                  >
                    <span className="chat-quick-action-icon">📈</span>
                    {t('showChart')}
                  </button>
                  <button
                    className="chat-quick-action chat-quick-action-success"
                    onClick={() => handleQuickAction('execute')}
                  >
                    <span className="chat-quick-action-icon">✓</span>
                    {t('executeThis')}
                  </button>
                  <button
                    className="chat-quick-action chat-quick-action-secondary"
                    onClick={() => handleQuickAction('skip')}
                  >
                    <span className="chat-quick-action-icon">↩</span>
                    {t('skipThis')}
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="chat-quick-action chat-quick-action-primary"
                    onClick={() => handleWaitAction('show_settings')}
                  >
                    <span className="chat-quick-action-icon">⚙️</span>
                    {t('changeAIRules')}
                  </button>
                  <button
                    className="chat-quick-action chat-quick-action-primary"
                    onClick={() => handleWaitAction('show_proposal_status')}
                  >
                    <span className="chat-quick-action-icon">📊</span>
                    {t('checkProposalStatus')}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* クイックアクションボタン（plainシナリオ：初回ログイン時） */}
      {chatScenario === 'plain' && (
        <div className="chat-quick-actions">
          <button
            className="chat-quick-actions-toggle"
            onClick={() => setShowQuickActions(!showQuickActions)}
          >
            <span className="chat-quick-actions-toggle-icon">
              {showQuickActions ? '▼' : '▶'}
            </span>
            <span className="chat-quick-actions-toggle-text">
              {showQuickActions ? t('closeMenu') : `💬 ${t('frequentQuestions')}`}
            </span>
          </button>

          {showQuickActions && (
            <div className="chat-quick-action-buttons">
              <button
                className="chat-quick-action chat-quick-action-primary"
                onClick={() => handleWaitAction('show_settings')}
              >
                <span className="chat-quick-action-icon">⚙️</span>
                {t('changeAIRules')}
              </button>
              <button
                className="chat-quick-action chat-quick-action-primary"
                onClick={() => handleWaitAction('show_proposal_status')}
              >
                <span className="chat-quick-action-icon">📊</span>
                {t('checkProposalStatus')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* クイックアクションボタン（waitシナリオ：設定変更や現在レート確認） */}
      {chatScenario === 'wait' && (
        <div className="chat-quick-actions">
          <button
            className="chat-quick-actions-toggle"
            onClick={() => setShowQuickActions(!showQuickActions)}
          >
            <span className="chat-quick-actions-toggle-icon">
              {showQuickActions ? '▼' : '▶'}
            </span>
            <span className="chat-quick-actions-toggle-text">
              {showQuickActions ? t('closeSettingsMenu') : `⚙️ ${t('settingsMenu')}`}
            </span>
          </button>

          {showQuickActions && (
            <div className="chat-quick-action-buttons">
              <button
                className="chat-quick-action chat-quick-action-primary"
                onClick={() => handleWaitAction('change_ratio')}
              >
                <span className="chat-quick-action-icon">💵</span>
                {t('changeRatio')}
              </button>
              <button
                className="chat-quick-action chat-quick-action-primary"
                onClick={() => handleWaitAction('change_payday')}
              >
                <span className="chat-quick-action-icon">📅</span>
                {t('changePayday')}
              </button>
              <button
                className="chat-quick-action chat-quick-action-primary"
                onClick={() => handleWaitAction('current_rate')}
              >
                <span className="chat-quick-action-icon">📊</span>
                {t('checkCurrentRate')}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="chat-input-container">
        <input
          type="text"
          className="chat-input"
          placeholder={`${t('typeMessage')}...`}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <button
          className="chat-send-button"
          onClick={handleSend}
          disabled={!inputText.trim()}
        >
          📤
        </button>
      </div>
    </div>
  );
}

export default ChatScreen;
