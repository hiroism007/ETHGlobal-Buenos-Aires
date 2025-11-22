function RateGraph({ rateHistory, currentRate }) {
  if (!rateHistory || rateHistory.length === 0) return null;

  // グラフの寸法
  const width = 300;
  const height = 150;
  const padding = 30;

  // レートの最大値と最小値を計算
  const rates = rateHistory.map(item => item.rate);
  const maxRate = Math.max(...rates);
  const minRate = Math.min(...rates);
  const range = maxRate - minRate;

  // スケーリング関数
  const scaleX = (index) => {
    return padding + (index / (rateHistory.length - 1)) * (width - 2 * padding);
  };

  const scaleY = (rate) => {
    return height - padding - ((rate - minRate) / range) * (height - 2 * padding);
  };

  // ラインパスを生成
  const linePath = rateHistory
    .map((item, index) => {
      const x = scaleX(index);
      const y = scaleY(item.rate);
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');

  // エリアパスを生成
  const areaPath =
    linePath +
    ` L ${scaleX(rateHistory.length - 1)} ${height - padding}` +
    ` L ${padding} ${height - padding} Z`;

  return (
    <div className="rate-graph">
      <div className="rate-graph-title">レート推移（今日）</div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* グリッド線 */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#e0e0e0"
          strokeWidth="1"
        />

        {/* エリア */}
        <path
          d={areaPath}
          fill="url(#gradient)"
          opacity="0.3"
        />

        {/* ライン */}
        <path
          d={linePath}
          fill="none"
          stroke="#2196F3"
          strokeWidth="2"
        />

        {/* ポイント */}
        {rateHistory.map((item, index) => (
          <g key={index}>
            <circle
              cx={scaleX(index)}
              cy={scaleY(item.rate)}
              r="4"
              fill={item.isCurrent ? "#4CAF50" : "#2196F3"}
              stroke="#ffffff"
              strokeWidth="2"
            />
            {item.isCurrent && (
              <text
                x={scaleX(index)}
                y={scaleY(item.rate) - 10}
                textAnchor="middle"
                fontSize="12"
                fill="#4CAF50"
                fontWeight="bold"
              >
                現在
              </text>
            )}
          </g>
        ))}

        {/* Y軸ラベル */}
        <text
          x={padding - 5}
          y={scaleY(maxRate)}
          textAnchor="end"
          fontSize="11"
          fill="#666666"
        >
          {maxRate}
        </text>
        <text
          x={padding - 5}
          y={scaleY(minRate)}
          textAnchor="end"
          fontSize="11"
          fill="#666666"
        >
          {minRate}
        </text>

        {/* グラデーション定義 */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2196F3" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#2196F3" stopOpacity="0.1" />
          </linearGradient>
        </defs>
      </svg>

      <div className="rate-graph-legend">
        <div className="rate-graph-legend-item">
          <span className="rate-graph-legend-dot rate-graph-legend-high"></span>
          最高: {maxRate} ARS
        </div>
        <div className="rate-graph-legend-item">
          <span className="rate-graph-legend-dot rate-graph-legend-current"></span>
          現在: {currentRate} ARS
        </div>
        <div className="rate-graph-legend-item">
          <span className="rate-graph-legend-dot rate-graph-legend-low"></span>
          最低: {minRate} ARS
        </div>
      </div>
    </div>
  );
}

export default RateGraph;
