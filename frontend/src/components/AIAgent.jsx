import { useState, useRef, useEffect } from 'react';

function AIAgent({ proposal, onAccept, onReject }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      text: 'こんにちは！今日もあなたの給料を守ります💪',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [showProposal, setShowProposal] = useState(!!proposal);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (proposal && showProposal) {
      // 提案がある場合、AIメッセージとして表示
      setTimeout(() => {
        const proposalMessage = {
          id: messages.length + 1,
          type: 'ai',
          text: proposal.message,
          timestamp: new Date(),
          isProposal: true,
          proposalData: proposal
        };
        setMessages(prev => [...prev, proposalMessage]);
      }, 1000);
    }
  }, [proposal, showProposal]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setMessages([...messages, userMessage]);
    setInputText('');

    // モックAI応答
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        type: 'ai',
        text: getAIResponse(inputText),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 800);
  };

  const getAIResponse = (userInput) => {
    const input = userInput.toLowerCase();

    if (input.includes('レート') || input.includes('為替')) {
      return '現在の為替レートは 1 USD = 1,200 ARS です。過去1週間の平均より2%良いレートですよ！📈';
    } else if (input.includes('変換') || input.includes('実行')) {
      return '変換を実行しますね。少々お待ちください...';
    } else if (input.includes('ありがとう') || input.includes('感謝')) {
      return 'どういたしまして！いつでもお手伝いしますよ😊';
    } else if (input.includes('こんにちは') || input.includes('hello')) {
      return 'こんにちは！何かお手伝いできることはありますか？';
    } else {
      return 'ご質問ありがとうございます。もっと詳しく教えていただけますか？💬';
    }
  };

  const handleAcceptProposal = (proposalData) => {
    onAccept();
    setShowProposal(false);

    // 実行メッセージを追加
    setTimeout(() => {
      const confirmMessage = {
        id: messages.length + 1,
        type: 'ai',
        text: '✅ 変換を実行しました！あなたの資産を守りました。履歴画面で確認できます。',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, confirmMessage]);
    }, 500);
  };

  const handleRejectProposal = () => {
    onReject();
    setShowProposal(false);

    // 確認メッセージを追加
    setTimeout(() => {
      const rejectMessage = {
        id: messages.length + 1,
        type: 'ai',
        text: '了解しました。また別のタイミングでお知らせしますね。',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, rejectMessage]);
    }, 500);
  };

  const quickQuestions = [
    '今のレートは？',
    '次の給料日はいつ？',
    '履歴を見せて'
  ];

  return (
    <div className="ai-agent">
      <div className="ai-agent-header">
        <div className="ai-agent-avatar">🤖</div>
        <div className="ai-agent-info">
          <div className="ai-agent-name">Porteño AI</div>
          <div className="ai-agent-status">
            <span className="status-dot"></span>
            オンライン
          </div>
        </div>
      </div>

      <div className="ai-agent-messages">
        {messages.map((message) => (
          <div key={message.id}>
            <div
              className={`ai-agent-message ${
                message.type === 'ai' ? 'ai-agent-message-ai' : 'ai-agent-message-user'
              }`}
            >
              <div className="ai-agent-message-text">{message.text}</div>
              <div className="ai-agent-message-time">
                {message.timestamp.toLocaleTimeString('ja-JP', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>

            {message.isProposal && showProposal && message.proposalData && (
              <div className="ai-proposal-card">
                {message.proposalData.timestamp && (
                  <div className="ai-proposal-timestamp">
                    {new Date(message.proposalData.timestamp).toLocaleString('ja-JP', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                )}
                <div className="ai-proposal-amount">
                  {message.proposalData.arsAmount.toLocaleString()} ARS
                  <span style={{ fontSize: '0.6em', margin: '0 8px' }}>→</span>
                  {message.proposalData.usdcAmount} USDC
                </div>
                <div className="ai-proposal-details">
                  <div className="ai-proposal-detail">
                    💱 レート: 1 USD = {message.proposalData.exchangeRate.toLocaleString()} ARS
                  </div>
                  <div className="ai-proposal-detail">
                    ⛽ ガス: {message.proposalData.gasStatus}
                  </div>
                </div>
                <div className="ai-proposal-actions">
                  <button
                    className="ai-proposal-button ai-proposal-button-accept"
                    onClick={() => handleAcceptProposal(message.proposalData)}
                  >
                    ✓ 実行する
                  </button>
                  <button
                    className="ai-proposal-button ai-proposal-button-reject"
                    onClick={handleRejectProposal}
                  >
                    × やめる
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {messages.length <= 2 && (
        <div className="ai-quick-questions">
          {quickQuestions.map((question, index) => (
            <button
              key={index}
              className="ai-quick-question"
              onClick={() => setInputText(question)}
            >
              {question}
            </button>
          ))}
        </div>
      )}

      <div className="ai-agent-input">
        <input
          type="text"
          className="ai-agent-input-field"
          placeholder="質問してみよう..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <button
          className="ai-agent-send-button"
          onClick={handleSend}
          disabled={!inputText.trim()}
        >
          📤
        </button>
      </div>
    </div>
  );
}

export default AIAgent;
