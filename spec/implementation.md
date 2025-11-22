# DólarBlue Agent MVP - Product Requirements Document (PRD)

## 1. ドキュメント情報
*   **Project Name:** DólarBlue Agent
*   **Version:** 1.0.0 (MVP)
*   **Status:** Implementation Phase
*   **Last Updated:** 2025-11-22

## 2. 製品概要 (Product Overview)
**DólarBlue Agent** は、アルゼンチンのユーザー向けに設計された自律型金融エージェントです。不安定な現地通貨 (ARS) のインフレヘッジを目的として、給料日などの特定のタイミングで最も有利な交換レート (Blue, MEP, CCL) を自律的に判断し、給与の一部をステーブルコイン (USDC) に自動的に交換・送金することを提案・実行します。

### 2.1 コアバリュー
*   **Adaptive Rate Strategy (ARS):** 複数の為替市場 (Blue, MEP, CCL) をリアルタイムで比較し、ユーザーにとって最も有利なレートを自動選択します。
*   **Autonomous Data Retrieval:** x402 プロトコル（支払いとデータアクセスの統合）を利用し、エージェントが自律的に「情報への対価」を支払い、信頼できるレート情報を取得します。
*   **Seamless Dollarization:** 複雑なオンチェーン操作をエージェントが代行し、ユーザーはチャットベースまたはシンプルな UI で承認するだけで資産防衛が可能になります。

## 3. 主要ユースケース (Key Use Cases)

### 3.1 自然言語による設定管理 (Intent-Based Configuration)
*   **Actor:** ユーザー
*   **Description:** ユーザーはチャットインターフェースを通じて、「給料の30%を毎月25日にドルに変えて」のように自然言語で指示を出します。
*   **System Behavior:** AgentKit を搭載した AI エージェントが意図 (Intent) を解析し、自動的にバックエンドの設定 (Salary Rule) を更新します。

### 3.2 最適レートの自律選定 (ARS Execution)
*   **Actor:** システム (RateService / Agent)
*   **Description:** 給料日またはユーザーのトリガーにより、システムは複数のレートソース (Mock APIs) にアクセスします。
*   **System Behavior:** 各ソースへのアクセス時に x402 プロトコルを用いて小額の決済を行い、データを取得。取得したレートを正規化して比較し、最良のレート (Best Rate) を決定します。

### 3.3 ドル化の提案と実行 (Proposal & Execution)
*   **Actor:** システム -> ユーザー
*   **Description:** 最適レートに基づき、ARS から USDC への変換シミュレーション結果をユーザーに提案します。
*   **System Behavior:** LLM が親しみやすいスペイン語で提案文を生成。ユーザーが「承認 (Confirm)」すると、バックエンドの Server Wallet が USDC 送金トランザクションを実行し、ユーザーの Embedded Wallet に着金させます。

## 4. 機能要件 (Functional Requirements)

### 4.1 認証とユーザー管理
*   **認証基盤:** NextAuth.js (v5 beta) を使用。
*   **ID 管理:** ユーザーごとに一意の ID (`userId`) を発行し、SalaryRule や Proposal を紐付けます。
*   **ウォレット連携:** ユーザーの受取用アドレス (`embeddedWalletAddress`) を管理します。

### 4.2 設定管理 (Salary Rules)
*   **設定項目:**
    *   `dayOfMonth`: 給料日 (1-31)
    *   `convertPercent`: ドル化する割合 (0-100%)
*   **インターフェース:**
    *   **Chat UI:** AgentKit 経由での会話的設定更新。
    *   **Settings UI:** フォームによる明示的な設定更新。

### 4.3 レート取得と最適化 (Rate Service)
*   **データソース:** 3種類のモック API (`/api/mock/rate/{blue,mep,ccl}`)。
*   **x402 支払い:** `x402-fetch` を使用し、データ取得リクエスト時に 402 Payment Required に対する支払いを自動実行します。
*   **最適化ロジック:** 取得した全てのレートを `Decimal` 型で比較し、ARS/USDC レートが最も低い（有利な）ソースを選択します。

### 4.4 提案生成 (Proposal Service)
*   **計算ロジック:**
    *   給与額 (固定値 `FIXED_SALARY_AMOUNT_ARS`) × 設定割合 = 変換対象 ARS 額。
    *   変換対象 ARS 額 ÷ 最適レート = 獲得 USDC 額 (小数点第6位で丸め)。
*   **メッセージ生成:** OpenAI (GPT-4o mini) を使用し、計算結果に基づいた提案メッセージをスペイン語 ("vos" 調) で生成します。
*   **ステータス管理:** `PENDING` -> `EXECUTED` / `SKIPPED` / `FAILED`。

### 4.5 トランザクション実行 (Wallet Service)
*   **実行主体:** CDP Server Wallet (Coinbase Developer Platform)。
*   **対象ネットワーク:** Polygon Amoy Testnet。
*   **トークン:** USDC。
*   **フロー:** ユーザーの承認トリガーを受け、Server Wallet からユーザーの Embedded Wallet アドレスへ USDC を送金 (`transfer`) します。

## 5. データモデル (Data Model)
*Database: SQLite (via Prisma)*
※ SQLite の制約により、Enum や Json 型は String として扱われます。

### 5.1 User
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String (UUID) | プライマリキー |
| `email` | String | ユニーク、認証用 |
| `embeddedWalletAddress`| String | ドル化資産の受取先アドレス |
| `SalaryRule` | Relation | 1対1 |
| `Proposals` | Relation | 1対多 |

### 5.2 SalaryRule
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String (UUID) | プライマリキー |
| `userId` | String | 外部キー (User) |
| `dayOfMonth` | Int | 給料日 (1-31) |
| `convertPercent` | Int | ドル化割合 (0-100) |
| `isActive` | Boolean | 有効フラグ (Default: true) |

### 5.3 Proposal
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String (UUID) | プライマリキー |
| `userId` | String | 外部キー (User) |
| `status` | String | `PENDING`, `EXECUTED`, `SKIPPED`, `FAILED` |
| `details` | String | 計算詳細 (JSON stringified) |
| `txHash` | String? | 実行されたトランザクションハッシュ |
| `createdAt` | DateTime | 作成日時 |
| `executedAt`| DateTime? | 実行日時 |

## 6. API インターフェース (API Interface)

### 6.1 Chat & Agent
*   `POST /api/chat`
    *   **Body:** `{ userId: string, message: string }`
    *   **Response:** `{ reply: string, actionsPerformed: Array }`
    *   **Note:** 現在の実装ではライブラリの問題によりモック応答を返す場合があります。

### 6.2 Salary Settings
*   `GET /api/salary/settings` (Query: `userId`)
*   `POST /api/salary/settings`
    *   **Body:** `{ userId: string, dayOfMonth: number, convertPercent: number }`

### 6.3 Automation & Execution
*   `POST /api/salary/propose`
    *   **Body:** `{ userId: string }`
    *   **Action:** ARS 実行 -> 提案生成 -> DB 保存。
    *   **Response:** `{ proposalId, assistantText, details }`
*   `POST /api/salary/execute`
    *   **Body:** `{ userId: string, proposalId: string, action: "confirm"|"skip", userWalletAddress: string }`
    *   **Action:** USDC 送金 (confirm 時) -> ステータス更新。
    *   **Response:** `{ status, txHash, explorerUrl }`

### 6.4 Mock Rates (x402 Enabled)
*   `GET /api/mock/rate/{blue,mep,ccl}`
    *   **Behavior:** 初回アクセス時は `402 Payment Required` を返し、支払いが確認されるとレート情報 (JSON) を返します。

## 7. 技術スタック (Tech Stack)

*   **Backend Framework:** Next.js 15 (App Router)
*   **Runtime:** Node.js
*   **Language:** TypeScript
*   **Database:** SQLite (Development / MVP)
*   **ORM:** Prisma
*   **AI / Agent:**
    *   `@coinbase/agentkit`: エージェント基盤
    *   `openai`: LLM 推論 (GPT-4o mini)
    *   `langchain`: エージェントオーケストレーション
*   **Blockchain / Wallet:**
    *   `@coinbase/cdp-sdk`: Server Wallet 管理
    *   `viem`: EVM クライアント、コントラクト操作
    *   `x402-fetch`: 自律的支払いプロトコル
*   **Validation:** Zod
*   **Math:** decimal.js (通貨計算の精度保証)

## 8. 制約と前提条件 (Constraints & Assumptions)
1.  **Salary Source:** ユーザーの給与 (ARS) 入金自体はトラッキングせず、システム内では `FIXED_SALARY_AMOUNT_ARS` (環境変数) を仮の給与額として計算に使用します。
2.  **Single Chain:** MVP では Polygon Amoy Testnet のみに対応します。
3.  **Wallet Architecture:** セキュリティと実装速度の観点から、ドル化実行 (USDC 送金) はバックエンド管理の Server Wallet が行い、ユーザーは受取専用の Embedded Wallet (または外部 EOA) を使用する構成とします。
4.  **Database Limitation:** SQLite を使用するため、JSON 型や Enum 型はアプリケーション層でシリアライズ/デシリアライズして扱います。

