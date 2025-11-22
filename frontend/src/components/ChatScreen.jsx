import { useState, useRef, useEffect } from 'react';

// デモモード用のモックレスポンス関数
function getMockResponse(type, proposal) {
  const responses = {
    reason: `今回このタイミングで提案した理由を説明しますね。

・採用レート：${proposal.bestRateSource}（${proposal.bestRateArsPerUsdc.toLocaleString()} ARS）
・ガス代：${proposal.gasFeeArs} ARS（低め）
・お得額：+${Math.floor(proposal.convertAmountArs * 0.034).toLocaleString()} ARS（3.4%）

BLUE/MEP/CCL を比較し、最も効率の良い条件でした。`,

    rate_detail: '各レートの詳細を表にまとめました。現在のBLUEレートは過去7日間の平均より2.1%高く、最適なタイミングです。',

    chart: '過去7日間のレート推移をグラフ化しました。BLUEレートは上昇トレンドにあり、今日が絶好のタイミングです。',

    execute: `了解しました！${proposal.convertAmountArs.toLocaleString()} ARSを${proposal.amountUsdc} USDCに変換します。実行ボタンを押してください。`,

    skip: '了解しました。今回の提案はスキップします。次回より良い条件のときに、また提案させていただきますね。',

    completed: '変換が完了しました！トランザクションはブロックチェーンに記録されました。ウォレットを確認してください。'
  };

  return responses[type] || '申し訳ありません、理解できませんでした。';
}

function ChatScreen() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      text: 'こんにちは！Porteñoです。給料の管理や提案について相談できます。',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const [currentProposal, setCurrentProposal] = useState(null);

  /**
   * プリロードされた提案を確認して、AI説明メッセージを追加
   */
  useEffect(() => {
    const preloadedProposal = localStorage.getItem('preloadProposal');
    if (preloadedProposal) {
      try {
        const proposal = JSON.parse(preloadedProposal);
        setCurrentProposal(proposal);

        // AI説明メッセージを作成（getMockResponseを使用）
        setTimeout(() => {
          const explanationMessage = {
            id: Date.now(),
            type: 'ai',
            text: getMockResponse('reason', proposal),
            timestamp: new Date()
          };

          setMessages(prev => [...prev, explanationMessage]);
        }, 150); // 150msディレイでフェードイン効果

        // localStorageをクリア
        localStorage.removeItem('preloadProposal');
      } catch (err) {
        console.error('プリロード提案の解析に失敗:', err);
      }
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    // ユーザーメッセージを追加
    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setMessages([...messages, userMessage]);
    setInputText('');

    // モックAI応答（実際にはここでAPIを呼び出す）
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        type: 'ai',
        text: getAIResponse(inputText),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
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
        setTimeout(() => {
          const aiMessage = {
            id: Date.now(),
            type: 'ai',
            text: getMockResponse('execute', currentProposal),
            timestamp
          };
          setMessages(prev => [...prev, aiMessage]);
        }, 150);
        break;

      case 'skip':
        // AIメッセージを追加
        setTimeout(() => {
          const aiMessage = {
            id: Date.now(),
            type: 'ai',
            text: getMockResponse('skip', currentProposal),
            timestamp
          };
          setMessages(prev => [...prev, aiMessage]);
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
        <h2 className="chat-header-title">💬 AIアシスタント</h2>
        <p className="chat-header-subtitle">給料の管理や提案について相談できます</p>
      </div>

      {/* チャットメッセージ */}
      <div className="chat-messages">
        {messages.map((message) => {
          // レート表メッセージ
          if (message.type === 'rate_table') {
            return (
              <div key={message.id} className="rate-table-card">
                <div className="rate-table-header">📊 レート比較表</div>
                <table className="rate-table">
                  <thead>
                    <tr>
                      <th>レート種別</th>
                      <th>1 USDC</th>
                      <th>受取額</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="rate-table-row-best">
                      <td>BLUE（採用）</td>
                      <td>{message.proposal.bestRateArsPerUsdc.toLocaleString()} ARS</td>
                      <td>{message.proposal.amountUsdc.toFixed(2)} USDC</td>
                    </tr>
                    <tr>
                      <td>MEP</td>
                      <td>{(message.proposal.bestRateArsPerUsdc * 0.98).toLocaleString()} ARS</td>
                      <td>{(message.proposal.amountUsdc * 0.98).toFixed(2)} USDC</td>
                    </tr>
                    <tr>
                      <td>CCL</td>
                      <td>{(message.proposal.bestRateArsPerUsdc * 0.96).toLocaleString()} ARS</td>
                      <td>{(message.proposal.amountUsdc * 0.96).toFixed(2)} USDC</td>
                    </tr>
                  </tbody>
                </table>
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

      {/* クイックアクションボタン（提案がある場合のみ） */}
      {currentProposal && (
        <div className="chat-quick-actions">
          <div className="chat-quick-actions-title">深掘りメニュー</div>
          <div className="chat-quick-action-buttons">
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
          </div>
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
