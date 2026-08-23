import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './authStore'
import { uuid } from '../utils/uuid'
import { tokensToCredits, TOKENS_PER_CREDIT } from '../utils/credits'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface CreditTransaction {
  id: string
  planId: string
  creditsAwarded: number
  amountPaid: number
  currency: string
  reference: string
  subscriptionExpiresAt: string | null
  status: 'completed' | 'pending' | 'failed'
  createdAt: string
}

interface CreditState {
  balance: number
  totalPurchased: number
  transactions: CreditTransaction[]
  loading: boolean
  initialized: boolean

  /* token tracking */
  tokensUsed: number
  /** Tokens consumed by the most recent workflow run (for UI display) */
  lastRunTokens: number

  initialize: (userId: string) => Promise<void>
  deductCredits: (amount: number) => Promise<boolean>
  deductTokens: (tokens: number) => Promise<boolean>
  canAfford: (amount: number) => boolean
  addCredits: (
    planId: string,
    credits: number,
    amountPaid: number,
    currency: string,
    reference: string,
  ) => Promise<void>
  syncWithServer: (userId: string) => Promise<void>
  /** Records a completed workflow run (tokens + credits) to Supabase */
  recordWorkflowRun: (params: {
    workflowName: string
    nodesCount: number
    tokensUsed: number
    creditsDeducted: number
    status: 'completed' | 'failed'
  }) => Promise<void>
}

/* ------------------------------------------------------- */
/*  localStorage helpers ( fallback when supabase is off )  */
/* ------------------------------------------------------- */

/**
 * Keys are scoped PER USER: "ooguy-credits:{userId}".
 * A shared key would leak one account's balance to every other
 * account on the same browser (and poison new signups via the
 * local fallback path). The legacy unscoped key is removed on
 * initialize.
 */
const LS_PREFIX = 'ooguy-credits'
const LEGACY_LS_KEY = 'ooguy-credits'

interface LocalCreditData {
  balance: number
  totalPurchased: number
  transactions: CreditTransaction[]
}

const EMPTY_LOCAL: LocalCreditData = { balance: 0, totalPurchased: 0, transactions: [] }

function lsKey(userId: string): string {
  return `${LS_PREFIX}:${userId}`
}

function loadLocal(userId: string): LocalCreditData {
  try {
    const raw = localStorage.getItem(lsKey(userId))
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { ...EMPTY_LOCAL }
}

function saveLocal(data: LocalCreditData, userId: string): void {
  try {
    localStorage.setItem(lsKey(userId), JSON.stringify(data))
  } catch { /* ignore */ }
}

/* ------------------------------------------------------- */
/*  Store                                                   */
/* ------------------------------------------------------- */

export const useCreditStore = create<CreditState>((set, get) => ({
  /* start at zero — real balance arrives via initialize(userId) */
  ...EMPTY_LOCAL,
  loading: false,
  initialized: false,
  tokensUsed: 0,
  lastRunTokens: 0,

  initialize: async (userId: string) => {
    set({ loading: true })

    /* drop the legacy shared key — it leaked balances across accounts */
    try { localStorage.removeItem(LEGACY_LS_KEY) } catch { /* ignore */ }

    if (supabase) {
      try {
        /* try to load from supabase */
        const { data: profile } = await supabase
          .from('user_credits')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (profile) {
          /* Server is the single source of truth — never let stale
             local data override it. */
          const { data: txns } = await supabase
            .from('credit_transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(100)

          const balance = profile.balance
          const totalPurchased = profile.total_purchased
          const tokensUsed = profile.tokens_used ?? 0
          const mappedTxns = (txns || []).map(mapTxn)

          set({
            balance,
            totalPurchased,
            tokensUsed,
            transactions: mappedTxns,
            loading: false,
            initialized: true,
          })
          saveLocal({ balance, totalPurchased, transactions: mappedTxns }, userId)
          return
        }

        /* No server row yet (fresh signup): create a canonical zero row
           instead of falling back to whatever is in localStorage. */
        const now = new Date().toISOString()
        await supabase.from('user_credits').upsert({
          user_id: userId,
          balance: 0,
          total_purchased: 0,
          tokens_used: 0,
          updated_at: now,
        }, { onConflict: 'user_id' })

        set({ ...EMPTY_LOCAL, loading: false, initialized: true })
        saveLocal(EMPTY_LOCAL, userId)
        return
      } catch { /* fall through to local */ }
    }

    /* fallback to per-user local only */
    set({
      ...loadLocal(userId),
      loading: false,
      initialized: true,
    })
  },

  canAfford: (amount: number) => {
    return get().balance >= amount
  },

  deductCredits: async (amount: number) => {
    const { balance, transactions, totalPurchased } = get()
    if (balance < amount) return false

    const newBalance = balance - amount
    set({ balance: newBalance })

    /* sync to supabase (await it so balance persists across reloads) */
    const userId = getCurrentUserId()
    if (userId) saveLocal({ balance: newBalance, totalPurchased, transactions }, userId)
    if (userId && supabase) {
      try {
        const { error } = await supabase.from('user_credits').upsert({
          user_id: userId,
          balance: newBalance,
          total_purchased: totalPurchased,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        if (error) throw error
      } catch (e) {
        console.error('Failed to sync credit deduction:', e)
      }
    }

    return true
  },

  deductTokens: async (tokens: number) => {
    if (tokens <= 0) return true
    const credits = tokensToCredits(tokens)
    const ok = await get().deductCredits(credits)
    if (ok) {
      const newTokensUsed = get().tokensUsed + tokens
      set({ tokensUsed: newTokensUsed, lastRunTokens: tokens })

      /* persist tokens_used to Supabase */
      const userId = getCurrentUserId()
      if (userId && supabase) {
        try {
          await supabase.from('user_credits').upsert({
            user_id: userId,
            tokens_used: newTokensUsed,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' })
        } catch { /* best-effort */ }
      }
    }
    return ok
  },

  recordWorkflowRun: async (params) => {
    const userId = getCurrentUserId()
    if (!userId || !supabase) return
    try {
      await supabase.from('workflow_runs').insert({
        user_id: userId,
        workflow_name: params.workflowName,
        nodes_count: params.nodesCount,
        tokens_used: params.tokensUsed,
        credits_deducted: params.creditsDeducted,
        status: params.status,
      })
    } catch { /* best-effort logging */ }
  },

  addCredits: async (planId, credits, amountPaid, currency, reference) => {
    const { balance, totalPurchased, transactions } = get()
    const now = new Date().toISOString()

    /* 30-day subscription expiry for plan purchases */
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const tokensAwarded = credits * TOKENS_PER_CREDIT

    const txn: CreditTransaction = {
      id: uuid(),
      planId,
      creditsAwarded: credits,
      amountPaid,
      currency,
      reference,
      subscriptionExpiresAt: expiresAt,
      status: 'completed',
      createdAt: now,
    }

    const newBalance = balance + credits
    const newTotal = totalPurchased + credits

    set({
      balance: newBalance,
      totalPurchased: newTotal,
      transactions: [txn, ...transactions],
    })

    /* sync to supabase */
    const userId = getCurrentUserId()
    if (userId) saveLocal({ balance: newBalance, totalPurchased: newTotal, transactions: [txn, ...transactions] }, userId)
    if (userId && supabase) {
      try {
        await supabase.from('user_credits').upsert({
          user_id: userId,
          balance: newBalance,
          total_purchased: newTotal,
          updated_at: now,
        }, { onConflict: 'user_id' })

        await supabase.from('credit_transactions').insert({
          user_id: userId,
          plan_id: planId,
          credits_awarded: credits,
          tokens_awarded: tokensAwarded,
          amount_paid: amountPaid,
          currency,
          reference,
          subscription_expires_at: expiresAt,
          status: 'completed',
        })
      } catch { /* ignore */ }
    }
  },

  syncWithServer: async (userId: string) => {
    if (!supabase) return
    try {
      const { data: profile } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (profile) {
        const { data: txns } = await supabase
          .from('credit_transactions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(100)

        set({
          balance: profile.balance,
          totalPurchased: profile.total_purchased,
          tokensUsed: profile.tokens_used ?? 0,
          transactions: (txns || []).map(mapTxn),
        })
        saveLocal({ balance: profile.balance, totalPurchased: profile.total_purchased, transactions: (txns || []).map(mapTxn) }, userId)
      }
    } catch { /* ignore */ }
  },
}))

/* helpers */

function getCurrentUserId(): string | null {
  try {
    return useAuthStore.getState().user?.id || null
  } catch {
    return null
  }
}

function mapTxn(t: any): CreditTransaction {
  return {
    id: t.id,
    planId: t.plan_id || 'top-up',
    creditsAwarded: t.credits_awarded || 0,
    amountPaid: t.amount_paid || 0,
    currency: t.currency || 'USD',
    reference: t.reference || '',
    subscriptionExpiresAt: t.subscription_expires_at || null,
    status: t.status || 'completed',
    createdAt: t.created_at || new Date().toISOString(),
  }
}
