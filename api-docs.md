# API Documentation for Frontend Integration

Base URL: `http://localhost:3001` (Server)

## 1. Settings (設定関連)

給料日の設定やドル化割合の設定を管理します。

### GET /settings
現在の設定を取得します。

**Request**
- Query Params:
  - `userId` (string, required): ユーザーID

**Response (200 OK)**
```json
{
  "id": "uuid-...",
  "userId": "user-123",
  "dayOfMonth": 25,
  "convertPercent": 50,
  "isActive": true,
  "createdAt": "2023-10-27T...",
  "updatedAt": "2023-10-27T..."
}
```
*設定がない場合は空オブジェクト `{}` が返る可能性があります。*

### POST /settings
設定を新規作成または更新（Upsert）します。

**Request Body**
```json
{
  "userId": "user-123",
  "dayOfMonth": 25,      // 1-31
  "convertPercent": 50   // 0-100
}
```

**Response (200 OK)**
```json
{
  "id": "uuid-...",
  "userId": "user-123",
  "dayOfMonth": 25,
  "convertPercent": 50,
  "isActive": true,
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

## 2. Chat & Proposal (チャット・提案フロー)

### POST /chat
通常のチャットメッセージ送信。AIが自然言語で応答します。

**Request Body**
```json
{
  "userId": "user-123",
  "message": "今日の給料、どれくらいドルにしたほうがいい？"
}
```

**Response (200 OK)**
```json
{
  "reply": "現在のレートは..." // AIからのテキスト応答
}
```

---

### POST /propose
給料日トリガー時、またはユーザーのリクエストにより、AIが変換提案（Proposal）を生成します。
**これを叩くと、裏側でx402レート取得〜計算が走り、提案データが作られます。**

**Request Body**
```json
{
  "userId": "user-123"
}
```

**Response (200 OK)**
```json
{
  "proposalId": "uuid-proposal-123",
  "assistantText": "現在のレートに基づき...", // チャットに表示するAIのメッセージ
  "details": {
    "salaryAmountArs": "150000",
    "convertPercent": 50,
    "convertArs": "75000",
    "amountUsdc": "75.123456", // ユーザーが受け取るUSDC額
    "bestRate": {
      "source": "Blue",
      "rateArsPerUsdc": "998.5"
    },
    "allRates": [...]
  }
}
```

---

## 3. Execution (実行フロー)

ユーザーが提案を承認した後の処理です。

### POST /execute
提案を実行（Confirm）またはスキップ（Skip）します。
**FrontendでARS送金完了後に、このAPIを `action: 'confirm'` で叩いてください。**

**Request Body (Confirm - 実行時)**
```json
{
  "userId": "user-123",
  "proposalId": "uuid-proposal-123", // /propose で取得したID
  "action": "confirm",
  "userWalletAddress": "0x1234...",  // USDCを受け取るユーザーのウォレットアドレス
  "arsTxHash": "0xabcd..."           // Frontendで実行したARS送金のTxHash
}
```

**Request Body (Skip - キャンセル時)**
```json
{
  "userId": "user-123",
  "proposalId": "uuid-proposal-123",
  "action": "skip"
}
```

**Response (200 OK - Confirm)**
```json
{
  "status": "executed",
  "txHash": "0x9876...", // Server Walletから送られたUSDC送金のTxHash
  "explorerUrl": "https://amoy.polygonscan.com/tx/0x9876..."
}
```

**Response (200 OK - Skip)**
```json
{
  "status": "skipped"
}
```

---

## Error Handling

エラー時は `4xx` または `5xx` ステータスコードとともに、以下の形式で返ります。

```json
{
  "error": "Error message description"
}
```
または Zod Validation Error の場合:
```json
{
  "error": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "number",
      "inclusive": true,
      "exact": false,
      "message": "Number must be greater than or equal to 1",
      "path": ["dayOfMonth"]
    }
  ]
}
```

