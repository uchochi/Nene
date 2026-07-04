import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './authStore'

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

  initialize: (userId: string) => Promise<void>
  deductCredits: (amount: number) => Promise<boolean>
  canAfford: (amount: number) => boolean
  addCredits: (
    planId: string,
    credits: number,
    amountPaid: number,
    currency: string,
    reference: string,
  ) => Promise<void>
  syncWithServer: (userId: string) => Promise<void>
}

/* ------------------------------------------------------- */
/*  localStorage helpers ( fallback when supabase is off )  */
/* ------------------------------------------------------- */

const LS_KEY = 'n8n-dataset-credits'

interface LocalCreditData {
  balance: number
  totalPurchased: number
  transactions: CreditTransaction[]
}

function loadLocal(): LocalCreditData {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { balance: 0, totalPurchased: 0, transactions: [] }
}

function saveLocal(data: LocalCreditData): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data))
  } catch { /* ignore */ }
}

/* ------------------------------------------------------- */
/*  Store                                                   */
/* ------------------------------------------------------- */

export const useCreditStore = create<CreditState>((set, get) => ({
  ...loadLocal(),
  loading: false,
  initialized: false,

  initialize: async (userId: string) => {
    set({ loading: true })

    const local = loadLocal()

    if (supabase) {
      try {
        /* try to load from supabase */
        const { data: profile } = await supabase
          .from('user_credits')
          .select('*')
          .eq('user_id', userId)
          .single()

        const { data: txns } = await supabase
          .from('credit_transactions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(100)

        if (profile) {
          set({
            balance: profile.balance,
            totalPurchased: profile.total_purchased,
            transactions: (txns || []).map(mapTxn),
            loading: false,
            initialized: true,
          })
          /* sync local */
          saveLocal({ balance: profile.balance, totalPurchased: profile.total_purchased, transactions: (txns || []).map(mapTxn) })
          return
        }
      } catch { /* fall through to local */ }
    }

    /* fallback to local */
    set({
      ...local,
      loading: false,
      initialized: true,
    })
  },

  canAfford: (amount: number) => {
    return get().balance >= amount
  },

  deductCredits: async (amount: number) => {
    const { balance, transactions } = get()
    if (balance < amount) return false

    const newBalance = balance - amount
    set({ balance: newBalance })
    saveLocal({ balance: newBalance, totalPurchased: get().totalPurchased, transactions })

    /* sync to supabase in background */
    const userId = getCurrentUserId()
    if (userId && supabase) {
      try {
        await supabase.from('user_credits').upsert({
          user_id: userId,
          balance: newBalance,
          total_purchased: get().totalPurchased,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
      } catch { /* ignore */ }
    }

    return true
  },

  addCredits: async (planId, credits, amountPaid, currency, reference) => {
    const { balance, totalPurchased, transactions } = get()
    const now = new Date().toISOString()

    /* 30-day subscription expiry for plan purchases */
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const txn: CreditTransaction = {
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
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

    saveLocal({ balance: newBalance, totalPurchased: newTotal, transactions: [txn, ...transactions] })

    /* sync to supabase */
    const userId = getCurrentUserId()
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
          transactions: (txns || []).map(mapTxn),
        })
        saveLocal({ balance: profile.balance, totalPurchased: profile.total_purchased, transactions: (txns || []).map(mapTxn) })
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
