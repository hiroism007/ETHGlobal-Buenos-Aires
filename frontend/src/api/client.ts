// ============================================================================
// APIクライアント: バックエンドとの通信
// ============================================================================

import type {
  SalarySettings,
  Proposal,
  ExecutionResult,
  Transaction,
  NotificationSettings,
  ApiError
} from '../types';

export interface WalletLoginRequest {
  address: string;
  signature: string;
}

export interface WalletLoginResponse {
  userId: string;
  isNewUser: boolean;
  address: string;
}

export interface ChatRequest {
  userId: string;
  message: string;
}

export interface ChatResponse {
  reply: string;
}

export interface ProposeRequest {
  userId: string;
}

export interface ProposeResponse {
  proposalId: string;
  assistantText: string;
  details: {
    salaryAmountArs: string;
    convertPercent: number;
    convertArs: string;
    amountUsdc: string;
    bestRate: {
      source: string;
      rateArsPerUsdc: string;
    };
    allRates: any[];
  };
}

export interface ExecuteRequest {
  userId: string;
  proposalId: string;
  action: 'confirm' | 'skip';
  userWalletAddress?: string;
  arsTxHash?: string;
}

export interface ExecuteResponse {
  status: string;
  txHash?: string;
  explorerUrl?: string;
}

export interface SettingsRequest {
  userId: string;
  dayOfMonth?: number;
  convertPercent?: number;
}

export interface SettingsResponse {
  id: string;
  userId: string;
  dayOfMonth: number;
  convertPercent: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * API共通エラーハンドリング
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      message: 'ネットワークエラーが発生しました'
    }));
    throw new Error(error.message);
  }
  return response.json();
}

/**
 * API Client
 */
export const apiClient = {
  /**
   * ウォレットでログイン
   * POST /auth/wallet/login
   */
  async walletLogin(data: WalletLoginRequest): Promise<WalletLoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/wallet/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<WalletLoginResponse>(response);
  },

  /**
   * 給料日設定を取得
   * GET /api/salary/settings
   */
  async getSettings(): Promise<SalarySettings> {
    const response = await fetch(`${API_BASE_URL}/api/salary/settings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    return handleResponse<SalarySettings>(response);
  },

  /**
   * 給料日設定を更新
   * POST /api/salary/settings
   */
  async updateSettings(settings: Partial<SalarySettings>): Promise<SalarySettings> {
    const response = await fetch(`${API_BASE_URL}/api/salary/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(settings),
    });
    return handleResponse<SalarySettings>(response);
  },

  /**
   * チャットメッセージを送信
   * POST /chat
   */
  async sendChatMessage(data: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<ChatResponse>(response);
  },

  /**
   * 提案を作成
   * POST /propose
   */
  async createPropose(data: ProposeRequest): Promise<ProposeResponse> {
    const response = await fetch(`${API_BASE_URL}/propose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<ProposeResponse>(response);
  },

  /**
   * 提案を実行またはスキップ
   * POST /execute
   */
  async executePropose(data: ExecuteRequest): Promise<ExecuteResponse> {
    const response = await fetch(`${API_BASE_URL}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<ExecuteResponse>(response);
  },

  /**
   * 設定を更新（新API）
   * POST /settings
   */
  async updateUserSettings(data: SettingsRequest): Promise<SettingsResponse> {
    const response = await fetch(`${API_BASE_URL}/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<SettingsResponse>(response);
  },

  /**
   * 給料日提案を生成（旧API）
   * POST /api/salary/propose
   *
   * x402経由で複数レート(Blue/MEP/CCL)を取得し、
   * ベストレートで提案内容(Proposal)を生成する
   */
  async createProposal(): Promise<Proposal> {
    const response = await fetch(`${API_BASE_URL}/api/salary/propose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    return handleResponse<Proposal>(response);
  },

  /**
   * 提案を実行（旧API）
   * POST /api/salary/execute
   *
   * Server Wallet経由でオンチェーンにUSDC送金を実行
   */
  async executeProposal(proposalId: string): Promise<ExecutionResult> {
    const response = await fetch(`${API_BASE_URL}/api/salary/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ proposalId }),
    });
    return handleResponse<ExecutionResult>(response);
  },

  /**
   * 取引履歴を取得
   * GET /api/salary/history
   */
  async getHistory(): Promise<Transaction[]> {
    const response = await fetch(`${API_BASE_URL}/api/salary/history`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    return handleResponse<Transaction[]>(response);
  },

  /**
   * 通知設定を取得
   * GET /api/notifications/settings
   */
  async getNotificationSettings(): Promise<NotificationSettings> {
    const response = await fetch(`${API_BASE_URL}/api/notifications/settings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    return handleResponse<NotificationSettings>(response);
  },

  /**
   * 通知設定を更新
   * POST /api/notifications/settings
   */
  async updateNotificationSettings(
    settings: Partial<NotificationSettings>
  ): Promise<NotificationSettings> {
    const response = await fetch(`${API_BASE_URL}/api/notifications/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(settings),
    });
    return handleResponse<NotificationSettings>(response);
  },
};
