import { create } from 'zustand'

/**
 * Product tour state.
 * - `activeTour`: the tour currently running ('overview' | 'editor' | null)
 * - `seen`: localStorage-persisted flags so each tour auto-starts only once.
 *   Users can replay tours anytime from Settings → Guided Tours.
 */

export type TourName = 'overview' | 'editor'

const SEEN_KEY = 'ooguy-tours-seen'

function loadSeen(): Record<TourName, boolean> {
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    if (raw) return { overview: false, editor: false, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { overview: false, editor: false }
}

function saveSeen(seen: Record<TourName, boolean>): void {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(seen))
  } catch { /* ignore */ }
}

interface TourState {
  activeTour: TourName | null
  seen: Record<TourName, boolean>

  /** Start a tour (used by auto-start effects and Settings replay buttons) */
  startTour: (tour: TourName) => void
  /** Called when a tour finishes or is dismissed */
  endTour: () => void
  /** Persist that a tour has been seen (auto-start won't trigger again) */
  markSeen: (tour: TourName) => void
}

export const useTourStore = create<TourState>((set, get) => ({
  activeTour: null,
  seen: loadSeen(),

  startTour: (tour) => {
    if (get().activeTour) return // one tour at a time
    set({ activeTour: tour })
  },

  endTour: () => set({ activeTour: null }),

  markSeen: (tour) => {
    const seen = { ...get().seen, [tour]: true }
    set({ seen })
    saveSeen(seen)
  },
}))
