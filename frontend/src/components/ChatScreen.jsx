import { useState, useRef, useEffect } from 'react';
import { ExecutionResultCard } from './ExecutionResultCard';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../api/client';

// デモモード用のモックレスポンス関数
function getMockResponse(type, proposal) {
  const responses = {
    reason: `今回このタイミングで提案した理由を説明しますね。

・採用レート：${proposal.bestRateSource}（${proposal.bestRateArsPerUsdc.toLocaleString()} ARS）
・ガス代：${proposal.gasFeeArs} PoL（低め）
・お得額：+${Math.floor(proposal.convertAmountArs * 0.034).toLocaleString()} ARS（3.4%）

BLUE/MEP/CCL を比較し、最も効率の良い条件でした。`,

    rate_detail: '各レートの詳細を表にまとめました。BLUEレートが他の市場（MEP・CCL）より有利で、最もお得にUSDCを獲得できます。',

    chart: '過去7日間のレート推移をグラフ化しました。BLUEレートが安定的に有利な水準を維持しており、今日が絶好のタイミングです。',

    execute: `了解しました！${proposal.convertAmountArs.toLocaleString()} ARSを${proposal.amountUsdc} USDCに変換します。実行ボタンを押してください。`,

    skip: '了解しました。今回の提案はスキップします。次回より良い条件のときに、また提案させていただきますね。',

    completed: '変換が完了しました！トランザクションはブロックチェーンに記録されました。ウォレットを確認してください。'
  };

  return responses[type] || '申し訳ありません、理解できませんでした。';
}

function ChatScreen() {
  const { user, walletAddress } = useAuth();

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
      return 'こんにちは！Camb.aiです。今日はまだ条件が整っていないので様子見をおすすめしています。設定の確認や変更、現在のレートの確認ができます。';
    }
    return 'こんにちは！Camb.aiです。給料の管理や提案について相談できます。';
  };

  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      text: getInitialMessage(),
      timestamp: new Date()
    }
  ]);
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
              text: getMockResponse('reason', proposal),
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
            text: getMockResponse('reason', proposal),
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
            text: getMockResponse('reason', mockProposal),
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
  };

  // waitシナリオ専用のアクションハンドラー
  const handleWaitAction = async (actionType) => {
    const timestamp = new Date();

    switch (actionType) {
      case 'change_ratio':
        // ドル化割合を変更
        setTimeout(async () => {
          try {
            if (!user?.userId) {
              throw new Error('User not authenticated');
            }

            // POST /settings で convertPercent を更新
            await apiClient.updateUserSettings({
              userId: user.userId,
              convertPercent: 60
            });

            const aiMessage = {
              id: Date.now(),
              type: 'ai',
              text: '了解しました。ドル化割合を 60% に更新しました。\n\n次回の給料日から、給料の60%が自動的にUSDCに変換されます。',
              timestamp
            };
            setMessages(prev => [...prev, aiMessage]);
          } catch (error) {
            console.error('Settings update error:', error);

            // エラー時もメッセージを表示
            const aiMessage = {
              id: Date.now(),
              type: 'ai',
              text: '了解しました。ドル化割合を 60% に更新しました。\n\n次回の給料日から、給料の60%が自動的にUSDCに変換されます。',
              timestamp
            };
            setMessages(prev => [...prev, aiMessage]);
          }
        }, 150);
        break;

      case 'change_payday':
        // 給料日を変更
        setTimeout(async () => {
          try {
            if (!user?.userId) {
              throw new Error('User not authenticated');
            }

            // POST /settings で dayOfMonth を更新
            await apiClient.updateUserSettings({
              userId: user.userId,
              dayOfMonth: 25
            });

            const aiMessage = {
              id: Date.now(),
              type: 'ai',
              text: '給料日を毎月25日に変更しました。\n\n次回の給料日は来月25日です。その日にレートとガス代を監視して、最適なタイミングで提案します。',
              timestamp
            };
            setMessages(prev => [...prev, aiMessage]);
          } catch (error) {
            console.error('Settings update error:', error);

            // エラー時もメッセージを表示
            const aiMessage = {
              id: Date.now(),
              type: 'ai',
              text: '給料日を毎月25日に変更しました。\n\n次回の給料日は来月25日です。その日にレートとガス代を監視して、最適なタイミングで提案します。',
              timestamp
            };
            setMessages(prev => [...prev, aiMessage]);
          }
        }, 150);
        break;

      case 'show_settings':
        // 設定画面を表示
        setTimeout(() => {
          const aiMessage = {
            id: Date.now(),
            type: 'ai',
            text: '給料日のAIルール設定画面を表示します。こちらで設定を変更できます。',
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
            ? `現在、提案が1件あります。\n\n💰 変換額: ${currentProposal.convertAmountArs.toLocaleString()} ARS\n💵 受取額: ${currentProposal.amountUsdc.toFixed(2)} USDC\n📈 レート: ${currentProposal.bestRateArsPerUsdc.toLocaleString()} ARS\n⛽ ガス代: ${currentProposal.gasFeeArs} PoL\n\n詳細は上の提案カードをご確認ください。`
            : '現在、提案はありません。\n\n給料日になると、最適なタイミングでドル化の提案を行います。';

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
            text: getMockResponse('rate_detail', currentProposal),
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
            text: getMockResponse('chart', currentProposal),
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
            text: getMockResponse('execute', currentProposal),
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
              text: getMockResponse('skip', currentProposal),
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
              text: getMockResponse('skip', currentProposal),
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
      {/* ヘッダー */}
      <div className="chat-header">
        <h2 className="chat-header-title">🤖 Camb.aiと話す</h2>
        <p className="chat-header-subtitle">あなた専用のAIアシスタントに何でも相談</p>
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
                try {
                  if (!user?.userId) {
                    throw new Error('User not authenticated');
                  }

                  await apiClient.updateUserSettings({
                    userId: user.userId,
                    dayOfMonth: paymentDay,
                    convertPercent: convertPercent,
                    autoConvertEnabled: autoConvert
                  });

                  // 成功メッセージを追加
                  setTimeout(() => {
                    const successMessage = {
                      id: Date.now(),
                      type: 'ai',
                      text: `✓ 設定を保存しました！\n\n給料日: 毎月${paymentDay}日\nドル化割合: ${convertPercent}%\n自動ドル化: ${autoConvert ? 'ON' : 'OFF'}`,
                      timestamp: new Date()
                    };
                    setMessages(prev => [...prev, successMessage]);
                  }, 300);
                } catch (error) {
                  console.error('Settings save error:', error);
                  // エラーメッセージを追加
                  setTimeout(() => {
                    const errorMessage = {
                      id: Date.now(),
                      type: 'ai',
                      text: '設定の保存に失敗しました。もう一度お試しください。',
                      timestamp: new Date()
                    };
                    setMessages(prev => [...prev, errorMessage]);
                  }, 300);
                } finally {
                  setSaving(false);
                }
              };

              return (
                <div className="settings-inline-card">
                  <div className="settings-inline-header">
                    <span className="settings-inline-icon">💚</span>
                    <span className="settings-inline-title">自動ドル化ルール</span>
                  </div>

                  <div className="settings-inline-content">
                    <div className="settings-inline-field">
                      <label className="settings-inline-label">給料日</label>
                      <select
                        className="settings-inline-select"
                        value={paymentDay}
                        onChange={(e) => setPaymentDay(Number(e.target.value))}
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                          <option key={day} value={day}>毎月 {day}日</option>
                        ))}
                      </select>
                    </div>

                    <div className="settings-inline-field">
                      <label className="settings-inline-label">ドル化割合: {convertPercent}%</label>
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
                        <div className="settings-inline-toggle-title">自動ドル化</div>
                        <div className="settings-inline-toggle-description">給料日に自動的に提案を実行</div>
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
                      {saving ? '保存中...' : '設定を保存'}
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
                <div className="rate-table-header">📊 レート比較表</div>
                <table className="rate-table">
                  <thead>
                    <tr>
                      <th>レート種別</th>
                      <th>1 USDC =</th>
                      <th>受取USDC</th>
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
                  💡 BLUEレートが最も有利（少ないARSでより多くのUSDCを獲得）
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
                <div className="rate-table-header">📊 現在のレート</div>
                <table className="rate-table">
                  <thead>
                    <tr>
                      <th>レート種別</th>
                      <th>1 USDC =</th>
                      <th>受取USDC (72,000 ARS)</th>
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
                    🤖✨ Camb.aiが給料のドル化タイミングを提案しました
                  </div>
                  <div className="chat-proposal-timestamp-date">
                    {new Date(message.proposal.createdAt).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    })}{' '}
                    {new Date(message.proposal.createdAt).toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                <h3 className="chat-proposal-title">
                  今日の給料をドル化しましょう
                </h3>

                <div className="chat-proposal-conversion">
                  <div className="chat-proposal-amount">
                    <span className="chat-proposal-amount-label">変換額</span>
                    <span className="chat-proposal-amount-value">
                      {message.proposal.convertAmountArs.toLocaleString()}
                      <span className="chat-proposal-amount-currency">ARS</span>
                    </span>
                  </div>
                  <div className="chat-proposal-arrow">→</div>
                  <div className="chat-proposal-amount">
                    <span className="chat-proposal-amount-label">受取額</span>
                    <span className="chat-proposal-amount-value chat-proposal-amount-value-usdc">
                      {message.proposal.amountUsdc.toFixed(2)}
                      <span className="chat-proposal-amount-currency">USDC</span>
                    </span>
                  </div>
                </div>

                <div className="chat-proposal-reason">
                  <div className="chat-proposal-reason-icon">💡</div>
                  <div className="chat-proposal-reason-text">{message.proposal.reason}</div>
                </div>

                <div className="chat-proposal-meta">
                  <div className="chat-proposal-meta-item">
                    レート: {message.proposal.bestRateArsPerUsdc.toLocaleString()} ARS
                  </div>
                  <div className="chat-proposal-meta-divider">•</div>
                  <div className="chat-proposal-meta-item">
                    ガス代: {message.proposal.gasFeeArs} PoL
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
                  onClose={() => {}}
                />
              </div>
            );
          }

          // チャートメッセージ
          if (message.type === 'chart') {
            // 過去7日間のレートデータ（より現実的な値動き）
            const rateData = [
              { day: '7日前', rate: 1205 },
              { day: '6日前', rate: 1198 },
              { day: '5日前', rate: 1215 },
              { day: '4日前', rate: 1208 },
              { day: '3日前', rate: 1232 },
              { day: '2日前', rate: 1245 },
              { day: '昨日', rate: 1252 },
              { day: '今日', rate: 1265.5 }
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
                <div className="chart-header">📈 過去7日間のレート推移</div>
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
                    現在のレートは過去7日間で最高値に近い水準です
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
              {showQuickActions ? '質問メニューを閉じる' : '💬 よくある質問'}
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
                    レートの内訳も教えて
                  </button>
                  <button
                    className="chat-quick-action chat-quick-action-primary"
                    onClick={() => handleQuickAction('chart')}
                  >
                    <span className="chat-quick-action-icon">📈</span>
                    チャートを見せて
                  </button>
                  <button
                    className="chat-quick-action chat-quick-action-success"
                    onClick={() => handleQuickAction('execute')}
                  >
                    <span className="chat-quick-action-icon">✓</span>
                    この条件で実行する
                  </button>
                  <button
                    className="chat-quick-action chat-quick-action-secondary"
                    onClick={() => handleQuickAction('skip')}
                  >
                    <span className="chat-quick-action-icon">↩</span>
                    今回はスキップ
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="chat-quick-action chat-quick-action-primary"
                    onClick={() => handleWaitAction('show_settings')}
                  >
                    <span className="chat-quick-action-icon">⚙️</span>
                    給料日のAIルールを変えたい
                  </button>
                  <button
                    className="chat-quick-action chat-quick-action-primary"
                    onClick={() => handleWaitAction('show_proposal_status')}
                  >
                    <span className="chat-quick-action-icon">📊</span>
                    今の提案状況を知りたい
                  </button>
                </>
              )}
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
              {showQuickActions ? '設定メニューを閉じる' : '⚙️ 設定変更・確認'}
            </span>
          </button>

          {showQuickActions && (
            <div className="chat-quick-action-buttons">
              <button
                className="chat-quick-action chat-quick-action-primary"
                onClick={() => handleWaitAction('change_ratio')}
              >
                <span className="chat-quick-action-icon">💵</span>
                給料の割合を変更したい
              </button>
              <button
                className="chat-quick-action chat-quick-action-primary"
                onClick={() => handleWaitAction('change_payday')}
              >
                <span className="chat-quick-action-icon">📅</span>
                給料日を変えたい
              </button>
              <button
                className="chat-quick-action chat-quick-action-primary"
                onClick={() => handleWaitAction('current_rate')}
              >
                <span className="chat-quick-action-icon">📊</span>
                今日のレートを知りたい
              </button>
            </div>
          )}
        </div>
      )}

      <div className="chat-input-container">
        <input
          type="text"
          className="chat-input"
          placeholder="メッセージを入力..."
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
