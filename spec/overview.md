## 1. 概要とアーキテクチャ

本仕様書は、DólarBlue Agent MVPのバックエンドシステムの詳細設計を定義する。本ドキュメントに基づき、APIおよび内部ロジックの実装が可能である。

### 1.1 システムゴールとMVP体験

1. **ハイブリッド設定管理**:
    - **Intentフロー (AgentKit)**: ユーザーがAIエージェントとチャットし、自然言語で給料設定（日付・割合）を行う。
    - **Manualフロー**: ユーザーがフォームUIから手動で設定・変更する。
2. **Adaptive Rate Strategy (ARS)と自律的データ取得**:
    - 給料日トリガー時、バックエンドが複数のレートソース（Blue, MEP, CCL）を比較する。
    - 各ソースへのアクセス時、**x402プロトコル**を用いてエージェントが自律的に支払いを行い、データを取得する（Agent-to-Agentデモ）。
    - 最も有利なレートを自動選択する。
3. **提案と自律実行**:
    - 最適レートに基づきドル化案を計算し、チャットUIに提案する。
    - ユーザー承認に基づき、**CDP Server Wallet**を用いてUSDC送金（ドル化）を実行する。

### 1.2 アーキテクチャ概要

バックエンドはNext.js API Routes (Vercel Serverless Functions) 上に構築されることを想定する。

```mermaid
graph TD
    %% ==== Frontend ====
    subgraph Frontend
        F[Next.js App UI]
        EW[CDP Embedded Wallet SDK]
    end

    %% ==== Backend ====
    subgraph Backend
        API[API Routes]

        subgraph AgentCore
            AS[AgentService - AgentKit]
            ACT[Custom Actions]
        end

        subgraph Services
            SRV_RULE[SalaryRuleService]
            SRV_RATE[RateService - ARS]
            SRV_X402[X402Service]
            SRV_CDP[CdpWalletService]
            SRV_PROP[ProposalService]
            SRV_LLM[LlmService]
        end

        DB[(Supabase / Prisma)]
    end

    %% ==== External ====
    subgraph External
        LLM_EXT[(OpenAI)]
        POLYGON[Polygon Amoy]
        MOCK_APIS[Mock Rate APIs - x402]
    end

    %% ==== Edges ====
    F -- API Calls --> API
    API -- Chat Intent --> AS
    AS -- Call --> LLM_EXT
    AS -- Execute --> ACT
    ACT --> SRV_RULE

    API -- Propose/Execute --> SRV_PROP

    SRV_PROP -- ARS Logic --> SRV_RATE
    SRV_RATE -- Fetch x402 --> SRV_X402
    SRV_X402 --> MOCK_APIS

    SRV_X402 -- Payment --> SRV_CDP
    SRV_PROP -- Execute Tx --> SRV_CDP
    SRV_CDP -- Send Tx --> POLYGON

    SRV_PROP -- Generate Text --> SRV_LLM
    SRV_LLM --> LLM_EXT

    SRV_RULE --> DB
    SRV_RATE --> DB
    SRV_X402 --> DB
    SRV_CDP --> DB
    SRV_PROP --> DB
    SRV_LLM --> DB

```

### 1.3 ウォレット戦略 (Simplified MVP Model)

実装速度を優先し、トランザクション実行主体を明確化する。

1. **CDP Embedded Wallet (User)**: フロントエンド管理。ユーザー資産の保管場所。ドル化の**受取先**。
2. **CDP Server Wallet (Agent)**: バックエンド管理。秘密鍵管理不要。x402支払いとUSDC送金の**実行主体**。

## 2. 技術スタックと環境設定

### 2.1 技術スタック

| **領域** | **技術/ライブラリ** | **バージョン（推奨）** | **役割** |
| --- | --- | --- | --- |
| ランタイム/言語 | Node.js / TypeScript | 22.x / 5.x | 実行環境 |
| Agent Core | `@coinbase/agentkit` | 最新 | Agentフレームワーク |
| CDP連携 | `@coinbase/cdp-sdk` | 最新 | Server Wallet操作 |
| x402 Buyer | `x402-fetch` | 最新 | 402支払い自動化ヘルパー |
| EVM連携 | `viem` | ^2.x | EVMクライアント、型定義 |
| LLM SDK | `openai` | 最新 | LLM API呼び出し |
| LLM Model | GPT-4o mini | - | Intent解析、応答生成 |
| ORM/DB | `prisma` / PostgreSQL (Supabase) | 最新 | データ永続化 |
| 数値計算 | `decimal.js` | 最新 | 高精度な通貨計算 |

### 2.2 ブロックチェーン設定 (Polygon Amoy Testnet)

- Chain ID: 80002
- RPC URL: (viemデフォルトまたはカスタムRPC)
- USDC Token Address: `0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582`

### 2.3 環境変数 (`.env`)

```jsx
# Database (Supabase)
DATABASE_URL="postgresql://..."

# OpenAI (GPT-4o mini推奨)
OPENAI_API_KEY="sk-..."

# Coinbase Developer Platform (CDP) - Server Wallet操作用
# ※ CDP SDKの認証方法はバージョンにより異なるため、公式ドキュメントを参照
# CDP_API_KEY_ID="organizations/.../apiKeys/..."
# CDP_API_KEY_SECRET="-----BEGIN EC PRIVATE KEY-----..." # PEM形式の秘密鍵

# 事前に作成し、AmoyテストUSDCを入金しておくServer WalletのID
CDP_SERVER_WALLET_ID="organizations/.../wallets/..."

# Blockchain Configuration (Polygon Amoy)
POLYGON_AMOY_USDC_ADDRESS="0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582"

# x402支払いの受取先アドレス（モックAPI用。開発者のEOA等で良い）
MOCK_API_RECIPIENT_ADDRESS="0x..."

# Mock Rate API Base URL (ローカル開発/Vercelデプロイ環境のベースURL)
MOCK_RATE_API_BASE_URL="http://localhost:3000/api/mock/rate"

# その他アプリケーション設定
# MVPでは給料額は固定値を利用することを想定
FIXED_SALARY_AMOUNT_ARS="150000"
```

## 3. データモデル (Prisma Schema)

prisma/schema.prisma

（注：PrismaのDecimal型はサポートされているが、MVPではJson型を利用し、アプリケーション層でDecimal.jsを用いて計算精度を担保する戦略を採用する。）

コード スニペット

```jsx
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id                    String       @id @default(uuid())
  // authProviderId        String       @unique // 認証サービスID。MVPでは簡易IDで代用可。
  embeddedWalletAddress String?      @unique // フロントで生成されたアドレス
  createdAt             DateTime     @default(now())
  SalaryRule            SalaryRule?
  Proposals             Proposal[]
}

// 給料自動ドル化設定
model SalaryRule {
  id             String   @id @default(uuid())
  userId         String   @unique
  user           User     @relation(fields: [userId], references: [id])
  dayOfMonth     Int      // 給料日 (1-31)
  convertPercent Int      // ドル化割合 (0-100)
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

enum ProposalStatus {
  PENDING
  EXECUTED
  SKIPPED
  FAILED
}

// 提案と実行ログ
model Proposal {
  id         String         @id @default(uuid())
  userId     String
  user       User           @relation(fields: [userId], references: [id])
  status     ProposalStatus @default(PENDING)
  txHash     String?        @unique
  // 提案内容の詳細（ARS結果、レート比較、金額など）。ProposalDetails型に対応。
  details    Json
  createdAt  DateTime       @default(now())
  executedAt DateTime?
}
```

## 4. コアサービス仕様と実装ガイド

### 4.0. TypeScript型定義とDTO

`src/types/index.ts`

```jsx
import { z } from 'zod';
import { Address } from 'viem';
import Decimal from 'decimal.js';

// --- Domain Types ---
// 金額計算にはDecimal.jsを利用し、精度を担保する。

export type RateSource = 'Blue' | 'MEP' | 'CCL';
export type RateInfo = {
  source: RateSource;
  rateArsPerUsdc: Decimal; // ARS/USDCレート
};

export type OptimizedRateResult = {
  bestRate: RateInfo;
  allRates: RateInfo[];
};

// Proposal.detailsフィールドに対応する型
export type ProposalDetails = {
  salaryAmountArs: Decimal;
  convertPercent: number;
  convertArs: Decimal;
  amountUsdc: Decimal; // USDC額
  bestRate: RateInfo;
  allRates: RateInfo[];
};

// --- DTO Definitions (Zod Schemas) ---
// APIリクエストボディのバリデーションに使用

export const ChatRequestDTO = z.object({
  userId: z.string().uuid(),
  message: z.string().min(1),
});

export const SaveSettingsDTO = z.object({
  userId: z.string().uuid(),
  dayOfMonth: z.number().int().min(1).max(31),
  convertPercent: z.number().int().min(0).max(100),
});

export const ProposeRequestDTO = z.object({
  userId: z.string().uuid(),
});

export const ExecuteRequestDTO = z.object({
  userId: z.string().uuid(),
  proposalId: z.string().uuid(),
  action: z.enum(['confirm', 'skip']),
  // ユーザーのEmbedded Walletアドレス（送金先）
  userWalletAddress: z.string().refine((val): val is Address => /^0x[a-fA-F0-9]{40}$/.test(val), {
    message: "Invalid Ethereum address",
  }),
});
```

### 4.1. CdpWalletService

ファイル: src/services/CdpWalletService.ts

責務: Server Wallet管理、viem連携、USDC送金。

TypeScript

```jsx
import { CdpClient } from "@coinbase/cdp-sdk";
import { toAccount } from "viem/accounts";
import { createWalletClient, http, WalletClient, Address, parseUnits } from 'viem';
import { polygonAmoy } from 'viem/chains';
import Decimal from 'decimal.js';

export class CdpWalletService {
  private cdp: CdpClient;
  private walletClient: WalletClient;
  private usdcAddress: Address;

  constructor() {
    // CDP Client初期化。環境変数からAPIキーをロードする想定。
    // SDKバージョンによっては明示的にキーを渡す必要がある。
    this.cdp = new CdpClient();
    this.usdcAddress = process.env.POLYGON_AMOY_USDC_ADDRESS as Address;
  }

  async init() {
    const walletId = process.env.CDP_SERVER_WALLET_ID;
    if (!walletId) throw new Error("CDP_SERVER_WALLET_ID is not set");

    // 1. Server WalletからEVMアカウントを取得し、viem Accountに変換
    const cdpAccount = await this.cdp.evm.getAccount({id: walletId});
    const viemAccount = toAccount(cdpAccount);

    // 2. viem Wallet Clientを生成 (Polygon Amoy用)
    this.walletClient = createWalletClient({
      account: viemAccount,
      chain: polygonAmoy,
      transport: http() // またはカスタムRPC
    });
  }

  getWalletClient(): WalletClient {
    if (!this.walletClient) throw new Error("WalletService not initialized");
    return this.walletClient;
  }

  // USDC送金 (Server Wallet -> 任意のアドレス)
  async sendUsdc(params: { to: Address; amountUsdc: Decimal }): Promise<string> {
    // Decimal型をUSDCの6桁精度の文字列に変換
    const amountString = params.amountUsdc.toFixed(6);
    // 文字列からWei (uint256) に変換
    const amountWei = parseUnits(amountString, 6);

    // ERC20 transferの実行 (viem writeContract利用)
    const hash = await this.walletClient.writeContract({
      address: this.usdcAddress,
      abi: [{ // 簡易的なERC20 transfer ABI
        "type": "function",
        "name": "transfer",
        "inputs": [
          {"name": "recipient", "type": "address"},
          {"name": "amount", "type": "uint256"}
        ],
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "nonpayable"
      }],
      functionName: 'transfer',
      args: [params.to, amountWei],
    });

    return hash;
  }
}
```

### 4.2. X402Service

ファイル: src/services/X402Service.ts

責務: x402-fetchを利用した支払い自動化。

TypeScript

```jsx
import { createX402Fetch } from "x402-fetch";
import { CdpWalletService } from "./CdpWalletService";

export class X402Service {
  private fetchWithPayment: typeof fetch;

  constructor(private walletService: CdpWalletService) {}

  async init() {
    const walletClient = this.walletService.getWalletClient();
    // WalletClientを渡して、支払い機能付きfetchを生成
    // ※ x402-fetchの最新仕様に合わせて引数（walletClientまたはaccount）を調整する
    this.fetchWithPayment = createX402Fetch({ walletClient });
  }

  async fetchJsonWithPayment<T>(url: string): Promise<T> {
    if (!this.fetchWithPayment) throw new Error("X402Service not initialized");

    const res = await this.fetchWithPayment(url);

    if (!res.ok) {
      // 402支払い完了後も失敗した場合（例：残高不足、APIサーバーエラー）
      throw new Error(`x402 fetch failed: ${res.status} ${res.statusText}`);
    }
    return res.json() as Promise<T>;
  }
}
```

### 4.3. RateService (ARS Logic)

ファイル: src/services/RateService.ts

責務: 複数ソースからx402経由でレートを取得し、最適レートを選択する。

TypeScript

```jsx
import { X402Service } from './X402Service';
import { RateInfo, OptimizedRateResult, RateSource } from '../types';
import Decimal from 'decimal.js';

export class RateService {
  private baseUrl = process.env.MOCK_RATE_API_BASE_URL;

  constructor(private x402Service: X402Service) {}

  async getOptimizedRate(): Promise<OptimizedRateResult> {
    const sources: { url: string, name: RateSource }[] = [
      { url: `${this.baseUrl}/blue`, name: "Blue" },
      { url: `${this.baseUrl}/mep`, name: "MEP" },
      { url: `${this.baseUrl}/ccl`, name: "CCL" }
    ];

    // 1. 並行してレート取得（内部でx402支払いが自律実行される）
    const results = await Promise.all(sources.map(s => this.fetchRate(s.url, s.name)));

    // 2. 失敗したものを除外
    const validRates = results.filter(r => r !== null) as RateInfo[];
    if (validRates.length === 0) throw new Error("ARS Failed: Could not fetch any rates.");

    // 3. 最も低い（有利な）レートを選択 (Decimal比較)
    const bestRate = validRates.reduce((min, current) =>
      current.rateArsPerUsdc.lt(min.rateArsPerUsdc) ? current : min
    );
    return { bestRate: bestRate, allRates: validRates };
  }

  private async fetchRate(url: string, source: RateSource): Promise<RateInfo | null> {
    try {
      // モックAPIはレートを文字列で返すことを想定
      const data = await this.x402Service.fetchJsonWithPayment<{ rate: string }>(url);
      // レートをDecimal型に変換
      return { rateArsPerUsdc: new Decimal(data.rate), source: source };
    } catch (error) {
      console.error(`[ARS] Failed to fetch rate from ${source}:`, error);
      return null;
    }
  }
}
```

### 4.4. SalaryRuleService

ファイル: src/services/SalaryRuleService.ts

責務: Prismaを用いたSalaryRuleのCRUD操作。

TypeScript

```jsx
import { PrismaClient, SalaryRule } from '@prisma/client';

export class SalaryRuleService {
  constructor(private prisma: PrismaClient) {}

  async getRuleByUserId(userId: string): Promise<SalaryRule | null> {
    return this.prisma.salaryRule.findUnique({
      where: { userId },
    });
  }

  async upsertRule(userId: string, data: { dayOfMonth: number, convertPercent: number }): Promise<SalaryRule> {
    // バリデーション（API層やAction層でも行われるが、サービス層でも実施）
    if (data.dayOfMonth < 1 || data.dayOfMonth > 31) throw new Error("Invalid dayOfMonth");
    if (data.convertPercent < 0 || data.convertPercent > 100) throw new Error("Invalid convertPercent");

    return this.prisma.salaryRule.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }
}
```

### 4.5. AgentService (AgentKit Core) & Custom Action

ファイル: src/services/AgentService.ts

責務: AgentKit初期化、Intentフロー処理。

TypeScript

```jsx
import { AgentKit, CdpWalletProvider, OpenAiLLMProvider, defineAction } from '@coinbase/agentkit';
import { z } from 'zod';
import { SalaryRuleService } from './SalaryRuleService';

// --- Custom Action Definition (SetupSalaryRuleAction) ---
// ファイル: src/actions/SetupSalaryRuleAction.ts

const SetupSalaryRuleSchema = z.object({
  dayOfMonth: z.number().int().min(1).max(31).describe('The day of the month (1-31).'),
  convertPercent: z.number().int().min(0).max(100).describe('The percentage to convert (0-100).'),
});

export const setupSalaryRuleAction = (salaryRuleService: SalaryRuleService) => defineAction({
  name: 'setup_salary_rule',
  description: 'Set up or update the automatic salary dollarization rule based on user instructions in Spanish.',
  params: SetupSalaryRuleSchema,
  async handler(params, context) {
    const { userId } = context;
    if (!userId) throw new Error("User context (userId) is missing.");

    // サービス呼び出し
    await salaryRuleService.upsertRule(userId, params);

    // LLMに応答生成させるための結果を返す
    return { success: true, message: `Rule updated: ${params.convertPercent}% on day ${params.dayOfMonth}.` };
  }
});

// --- AgentService 本体 ---
// ファイル: src/services/AgentService.ts

const SYSTEM_PROMPT = `You are DólarBlue Agent, a financial assistant for users in Argentina.
Respond in Argentine Spanish (use "vos" instead of "tú").
When the user expresses an intent to set up or change their salary conversion rules, use the 'setup_salary_rule' tool.
Be concise and helpful.`;

export class AgentService {
  private agent: AgentKit;

  async initialize(salaryRuleService: SalaryRuleService) {
    const llmProvider = new OpenAiLLMProvider({
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4o-mini'
    });

    // Wallet Provider (MVPのIntentフローではWallet操作がないため省略可と想定されるが、ライブラリ仕様により必須の場合はダミーまたはCdpWalletProviderを設定する)
    // const walletProvider = new CdpWalletProvider({ /* CDP SDK Config */ });

    const customActions = [setupSalaryRuleAction(salaryRuleService)];

    this.agent = new AgentKit({
      llmProvider,
      // walletProvider,
      actions: customActions,
      systemPrompt: SYSTEM_PROMPT
    });
  }

  async handleChatMessage(userId: string, message: string) {
    if (!this.agent) throw new Error("AgentService not initialized");
    const response = await this.agent.chat({
        message,
        context: { userId } // ユーザーIDをコンテキストとして渡す
    });
    return response;
  }
}
```

### 4.6. LlmService (Automation Flow)

ファイル: src/services/LlmService.ts

責務: 自動化フロー用の提案テキスト生成。

TypeScript

```jsx
import OpenAI from 'openai';
import { ProposalDetails } from '../types';
import Decimal from 'decimal.js';

export class LlmService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async buildSalaryProposalMessage(details: ProposalDetails): Promise<string> {
    const { bestRate, allRates, amountUsdc, convertPercent } = details;

    // ARS結果を説明するプロンプト
    const prompt = `Generate a concise proposal message in Argentine Spanish (use "vos").
    Inform the user about the result of the Adaptive Rate Strategy (ARS).
    Current Rates: ${allRates.map(r => `${r.source}: ${r.rateArsPerUsdc.toFixed(2)}`).join(', ')}.
    Best Rate Selected: ${bestRate.source} (${bestRate.rateArsPerUsdc.toFixed(2)} ARS/USDC).
    Action: Convert ${convertPercent}% of salary.
    Result: User will receive approximately ${amountUsdc.toFixed(2)} USDC.
    Tone: Professional yet friendly.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: prompt }],
        max_tokens: 150,
      });
      return completion.choices[0].message.content || "Proposal generated.";
    } catch (error) {
      // フォールバック（テンプレート）
      return `¡Hola! Comparamos Blue, MEP y CCL. La mejor tasa hoy es ${bestRate.source} (${bestRate.rateArsPerUsdc.toFixed(2)} ARS/USDC). Si convertimos el ${convertPercent}%, recibirás aprox ${amountUsdc.toFixed(2)} USDC. ¿Lo hacemos?`;
    }
  }
}
```

### 4.7. ProposalService

ファイル: src/services/ProposalService.ts

責務: 提案の生成、管理、実行。

TypeScript

```jsx
import { PrismaClient, ProposalStatus } from '@prisma/client';
import { RateService } from './RateService';
import { SalaryRuleService } from './SalaryRuleService';
import { CdpWalletService } from './CdpWalletService';
import { LlmService } from './LlmService';
import { ProposalDetails } from '../types';
import { Address } from 'viem';
import Decimal from 'decimal.js';

export class ProposalService {
  // ... constructor (prisma, rateService, ruleService, walletService, llmService) ...

  async generateProposal(userId: string) {
    const rule = await this.ruleService.getRuleByUserId(userId);
    if (!rule || !rule.isActive) return null;

    // 1. ARS実行
    const { bestRate, allRates } = await this.rateService.getOptimizedRate();

    // 2. 計算ロジック (Decimal.js利用)
    const salaryAmountArs = new Decimal(process.env.FIXED_SALARY_AMOUNT_ARS || "150000");
    const convertPercent = rule.convertPercent;
    const convertArs = salaryAmountArs.mul(convertPercent).div(100);
    // USDC額を計算（小数点以下6桁で丸める）
    const amountUsdc = convertArs.div(bestRate.rateArsPerUsdc).toDecimalPlaces(6, Decimal.ROUND_HALF_UP);

    const details: ProposalDetails = {
      salaryAmountArs, convertPercent, convertArs, amountUsdc, bestRate, allRates
    };

    // 3. 提案テキスト生成 (LLM)
    const assistantText = await this.llmService.buildSalaryProposalMessage(details);

    // 4. DB保存 (status: PENDING)
    // PrismaがJson型にDecimalを保存する際は文字列化が必要
    const detailsForDb = JSON.parse(JSON.stringify(details));

    const proposal = await this.prisma.proposal.create({
      data: {
        userId,
        details: detailsForDb,
        status: ProposalStatus.PENDING,
      }
    });

    return { proposalId: proposal.id, assistantText, details };
  }

  async executeProposal(userId: string, proposalId: string, userWalletAddress: Address) {
    const proposal = await this.prisma.proposal.findUnique({ where: { id: proposalId, userId } });
    if (!proposal || proposal.status !== ProposalStatus.PENDING) {
        throw new Error("Invalid proposal state.");
    }

    // JsonからProposalDetails型に復元し、Decimalインスタンス化
    const rawDetails = proposal.details as any;
    // Decimal型を復元する（PrismaのJson型からは文字列として取得されるため）
    const amountUsdcDecimal = new Decimal(rawDetails.amountUsdc);

    // 1. USDC送金実行 (Server Wallet -> User Embedded Wallet)
    const txHash = await this.walletService.sendUsdc({
      to: userWalletAddress,
      amountUsdc: amountUsdcDecimal
    });

    // 2. DB更新 (status: EXECUTED)
    await this.prisma.proposal.update({
      where: { id: proposalId },
      data: {
        status: ProposalStatus.EXECUTED,
        txHash,
        executedAt: new Date()
      }
    });

    return {
        status: "executed",
        txHash,
        explorerUrl: `https://amoy.polygonscan.com/tx/${txHash}`
    };
  }

  // ... skipProposal method ...
}
```

## 5. API 定義 (REST Endpoints)

リクエストボディはZod DTO（`src/types/index.ts`参照）でバリデーションする。

### 5.1. Chat API (Intent Flow)

- **POST** `/api/chat`
- **Request Body:** `ChatRequestDTO`
- **Handler Logic:** `AgentService.handleChatMessage(dto.userId, dto.message)`
- **Response (200 OK):**JSON
    
    `{
      "reply": "Entendido. He actualizado tu configuración...",
      "actionsPerformed": [{ "toolName": "setup_salary_rule", ... }]
    }`
    

### 5.2. Settings API (Manual Flow)

- **GET** `/api/salary/settings?userId=...`
- **Handler Logic:** `SalaryRuleService.getRuleByUserId(userId)`
- **POST** `/api/salary/settings`
- **Request Body:** `SaveSettingsDTO`
- **Handler Logic:** `SalaryRuleService.upsertRule(dto.userId, dto)`

### 5.3. Automation API

- **POST** `/api/salary/propose`
- **Description:** 給料日フローをトリガーし、ARSを実行して提案を生成。
- **Request Body:** `ProposeRequestDTO`
- **Handler Logic:** `ProposalService.generateProposal(dto.userId)`
- **Response (200 OK):**JSON
    
    `{
      "proposalId": "uuid-...",
      "assistantText": "...",
      "details": { /* ProposalDetails型 */ }
    }`
    
- **POST** `/api/salary/execute`
- **Request Body:** `ExecuteRequestDTO`
- **Handler Logic:**
    - `if (dto.action === 'confirm')`: `ProposalService.executeProposal(dto.userId, dto.proposalId, dto.userWalletAddress)`
- **Response (200 OK - confirm):**JSON
    
    `{
      "status": "executed",
      "txHash": "0x...",
      "explorerUrl": "https://amoy.polygonscan.com/tx/0x..."
    }`
    

## 6. Mock API 定義 (x402)

ARS検証のため、3つのx402対応モックAPIを実装する。

- `GET /api/mock/rate/blue`
- `GET /api/mock/rate/mep`
- `GET /api/mock/rate/ccl`

### 6.1. 支払い前の挙動 (402 Payment Required)

`HTTP/1.1 402 Payment Required
Content-Type: application/json

{
  "error": "Payment Required",
  "paymentDetails": {
    "network": "polygon-amoy",
    "token": "<POLYGON_AMOY_USDC_ADDRESS>",
    "amount": "0.01", // 0.01 USDC
    "recipient": "<MOCK_API_RECIPIENT_ADDRESS>"
  }
}`

### 6.2. 支払い後の挙動 (200 OK)

支払い証明ヘッダーが存在する場合に返す（MVPでは検証ロジックは省略可）。レートは文字列で返す。

JSON

`// /api/mock/rate/blue
{ "source": "Blue Mock", "rate": "3250.0" }
// /api/mock/rate/mep
{ "source": "MEP Mock", "rate": "3300.0" }
// /api/mock/rate/ccl
{ "source": "CCL Mock", "rate": "3180.0" }`

## 7. Reference（SDK / プロトコル / ドキュメント）

実装時に参照するべき公式ドキュメントとリポジトリ一覧。

### 7.1 Coinbase AgentKit / CDP

- AgentKit Welcome
    - https://docs.cdp.coinbase.com/agent-kit/welcome ([Coinbase Developer Docs](https://docs.cdp.coinbase.com/agent-kit/welcome?utm_source=chatgpt.com))
- AgentKit TypeScript Quickstart
    - https://docs.cdp.coinbase.com/agent-kit/getting-started/quickstart ([Coinbase Developer Docs](https://docs.cdp.coinbase.com/agent-kit/getting-started/quickstart?utm_source=chatgpt.com))
- Agent Actions（Action Provider 追加方法）
    - https://docs.cdp.coinbase.com/agent-kit/core-concepts/agents-actions ([Coinbase Developer Docs](https://docs.cdp.coinbase.com/agent-kit/core-concepts/agents-actions?utm_source=chatgpt.com))
- AgentKit アーキテクチャ解説
    - https://docs.cdp.coinbase.com/agent-kit/core-concepts/architecture-explained ([Coinbase Developer Docs](https://docs.cdp.coinbase.com/agent-kit/core-concepts/architecture-explained?utm_source=chatgpt.com))
- AgentKit GitHub（TypeScript モノレポ構成）
    - https://github.com/coinbase/agentkit ([GitHub](https://github.com/coinbase/agentkit?utm_source=chatgpt.com))

### 7.2 CDP Embedded Wallets

- Embedded Wallets Overview
    - https://docs.cdp.coinbase.com/embedded-wallets/welcome ([Coinbase Developer Docs](https://docs.cdp.coinbase.com/embedded-wallets/welcome?utm_source=chatgpt.com))
- Embedded Wallets Quickstart（React統合）
    - https://docs.cdp.coinbase.com/embedded-wallets/quickstart ([Coinbase Developer Docs](https://docs.cdp.coinbase.com/embedded-wallets/quickstart?utm_source=chatgpt.com))
- Embedded Wallets FAQ（セルフカストディ性など）
    - https://docs.cdp.coinbase.com/embedded-wallets/faq ([Coinbase Developer Docs](https://docs.cdp.coinbase.com/embedded-wallets/faq?utm_source=chatgpt.com))
- Authentication Methods / Security
    - https://docs.cdp.coinbase.com/embedded-wallets/authentication-methods ([Coinbase Developer Docs](https://docs.cdp.coinbase.com/embedded-wallets/authentication-methods?utm_source=chatgpt.com))

### 7.3 x402 プロトコル & CDP x402

- x402 Welcome（Coinbase Docs）
    - https://docs.cdp.coinbase.com/x402/welcome ([Coinbase Developer Docs](https://docs.cdp.coinbase.com/x402/welcome?utm_source=chatgpt.com))
- Quickstart for Buyers（x402-fetch / x402-axios の使い方）
    - https://docs.cdp.coinbase.com/x402/quickstart-for-buyers ([Coinbase Developer Docs](https://docs.cdp.coinbase.com/x402/quickstart-for-buyers?utm_source=chatgpt.com))
- Facilitator 概要
    - https://docs.cdp.coinbase.com/x402/core-concepts/facilitator ([Coinbase Developer Docs](https://docs.cdp.coinbase.com/x402/core-concepts/facilitator?utm_source=chatgpt.com))
- 公式サイト / ホワイトペーパー
    - https://www.x402.org/ ([x402](https://www.x402.org/?utm_source=chatgpt.com))
    - https://www.x402.org/x402.pdf ([x402](https://www.x402.org/x402.pdf?utm_source=chatgpt.com))

### 7.4 Polygon Agentic / x402 on Polygon

- x402 Introduction on Polygon
    - https://agentic-docs.polygon.technology/general/x402/intro/ ([Agentic Docs](https://agentic-docs.polygon.technology/general/x402/intro/?utm_source=chatgpt.com))
- Using the Polygon Facilitator
    - https://agentic-docs.polygon.technology/general/x402/guides/using-polygon-facilitator ([Agentic Docs](https://agentic-docs.polygon.technology/general/x402/guides/using-polygon-facilitator?utm_source=chatgpt.com))
- Using x402facilitators package
    - https://agentic-docs.polygon.technology/general/x402/guides/using-x402facilitators ([Agentic Docs](https://agentic-docs.polygon.technology/general/x402/guides/using-x402facilitators?utm_source=chatgpt.com))
- Quickstart for Sellers（API 側に 402 を仕込むガイド）
    - https://docs.polygon.technology/pos/payments/x402/quickstart-sellers/ ([Polygon](https://docs.polygon.technology/pos/payments/x402/quickstart-sellers/?utm_source=chatgpt.com))

### 7.5 Supabase / DB

- Supabase Docs Top
    - https://supabase.com/docs ([Supabase](https://supabase.com/docs?utm_source=chatgpt.com))
- JavaScript Client（`@supabase/supabase-js`）
    - https://supabase.com/docs/reference/javascript/introduction ([Supabase](https://supabase.com/docs/reference/javascript/introduction?utm_source=chatgpt.com))
    - https://supabase.com/docs/reference/javascript/v1 ([Supabase](https://supabase.com/docs/reference/javascript/v1?utm_source=chatgpt.com))
- supabase-js GitHub
    - https://github.com/supabase/supabase-js ([GitHub](https://github.com/supabase/supabase-js?utm_source=chatgpt.com))

### 7.6 viem

- viem Top
    - https://viem.sh/ ([viem.sh](http://viem.sh))
- Getting Started
    - https://viem.sh/docs/getting-started ([viem.sh](http://viem.sh))

### 7.7 OpenAI（LLM）

- Node SDK ライブラリ
    - https://github.com/openai/openai-node ([GitHub](https://github.com/openai/openai-node?utm_source=chatgpt.com))
- API Reference
    - https://platform.openai.com/docs/api-reference/introduction ([OpenAI Platform](https://platform.openai.com/docs/api-reference/introduction?utm_source=chatgpt.com))
- JavaScript Quickstart
    - https://platform.openai.com/docs/quickstart?context=node ([OpenAI Platform](https://platform.openai.com/docs/quickstart?context=node&utm_source=chatgpt.com))

---