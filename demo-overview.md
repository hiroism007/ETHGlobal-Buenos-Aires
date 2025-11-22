# DólarBlue AI Agent - Demo Flow Overview

本ドキュメントでは、ハッカソンデモにおけるユーザー体験（UX）と、バックグラウンドでのシステム連携（System Flow）を解説します。

## 登場人物 (Actors)

*   **User (Employee)**: アルゼンチン在住のユーザー。給与をARSで受け取り、安定したUSDCで保有したい。
*   **Smart Wallet (Frontend)**: ユーザーのブラウザ上で動作するCoinbase Smart Wallet。ARSの保持と送金署名を行う。
*   **AI Agent (Backend)**: ユーザーのファイナンシャルアシスタント。レート監視、提案、USDC変換（Server Wallet操作）を行う。
*   **x402 (External)**: 有料の自律型レート提供API。AI Agentが情報料を支払ってアクセスする。

---

## Demo Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant FE as Frontend (Smart Wallet)
    participant AI as AI Agent (Backend)
    participant SW as Server Wallet (Backend)
    participant x402 as x402 Rate API

    Note over User, AI: 1. 初期設定 (Onboarding)
    User->>FE: 「給料日設定」 (毎月25日 / 50%ドル化)
    FE->>AI: POST /settings (ルール保存)
    AI-->>FE: 設定完了

    Note over User, AI: 2. 給料日イベント (Trigger)
    User->>FE: 「今日は給料日」ボタン押下 (Demo Trigger)
    FE->>FE: ARS Faucet (擬似給与着金)
    FE->>AI: POST /propose (提案リクエスト)

    Note over AI, x402: 3. 自律的な情報収集
    AI->>x402: レート問い合わせ (with Payment)
    x402-->>AI: 高精度レート (Blue/MEP/CCL)
    AI->>AI: 最適レート計算 & 変換プラン作成
    AI-->>FE: 提案データ (Assistant Message + Action Card)

    Note over User, FE: 4. 提案と意思決定
    FE->>User: チャット「現在のレートは... 50%をドル化しますか？」
    User->>FE: チャット「OK、お願い」 (or Action Card「実行」クリック)
    FE->>User: 署名リクエスト (Smart Wallet)
    User->>FE: パスキー認証 (FaceID/TouchID)

    Note over FE, SW: 5. 資金移動と変換 (Execution)
    FE->>SW: ARS 送金 (Tx: User -> Server Wallet)
    FE->>AI: POST /execute (TxHashを含めて通知)
    AI->>SW: 着金確認 & USDC送金指示
    SW->>FE: USDC 送金 (Tx: Server Wallet -> User)
    AI-->>FE: 完了通知 (Explorer Link)

    Note over User, FE: 6. 完了確認
    FE->>User: 「完了しました！ 詳細はリンクを確認してください」
    User->>FE: ダッシュボードでUSDC残高確認
```

---

## Step-by-Step Demo Walkthrough

### Phase 1: Onboarding (設定)

1.  **User Action**: ダッシュボードの「設定」から、給料日を「25日」、自動ドル化割合を「50%」に設定する。
2.  **System**: Backend DBに `SalaryRule` として保存される。

### Phase 2: Payday Trigger (給料日)

3.  **User Action**: デモ用に用意された「給料日シミュレーション」ボタンを押す。
4.  **Frontend**:
    *   ユーザーのSmart Walletに、擬似的な給与（例: 150,000 ARS）がFaucetされる。
    *   Backendに「提案生成」をリクエストする。

### Phase 3: AI Proposal (AIによる提案)

5.  **System (Backend)**:
    *   `RateService` が `X402Service` を通じて、**AIが自律的にガス代を払って** 最新の為替レートを取得する。
    *   取得したレートに基づき、50%分（75,000 ARS）をUSDCに換えた場合の受取額を計算する。
    *   `LlmService` が「現在のレートは1 USDC = 1000 ARSです。設定通り50%を変換しますか？」という自然なメッセージを生成する。
6.  **Frontend**: チャット画面に「AIからのメッセージ」と「実行ボタン付きカード」が表示される。

### Phase 4: User Approval & Execution (承認と実行)

7.  **User Action**:
    *   チャットで「OK」と返信、またはカードの「実行」ボタンを押す。
    *   Smart Walletのポップアップが表示され、**パスキー（指紋/顔認証）で署名** する。
8.  **Frontend**:
    *   ARSを指定の Server Wallet アドレスへ送金するトランザクションを発行。
    *   完了後、TxHash を添えて Backend の `/execute` エンドポイントを叩く。

### Phase 5: Settlement (決済・着金)

9.  **System (Backend)**:
    *   受け取った TxHash を記録。
    *   Server Wallet から計算済みの USDC 額をユーザーのウォレットへ送金する。
    *   完了メッセージとExplorerへのリンクを返す。
10. **User Action**: チャット画面で「完了」を確認し、ダッシュボードでUSDC残高が増えていることを確認してデモ終了。

