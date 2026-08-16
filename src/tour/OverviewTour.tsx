import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { driver, type Driver, type DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'
import './tour.css'
import { useTourStore } from './tourStore'

/**
 * Welcome tour for the account-level layout (Overview, Projects, etc.).
 * Auto-starts once on the Overview page; replayable from Settings.
 * Steps whose target element isn't on the current page are skipped.
 */
export function OverviewTour() {
  const location = useLocation()
  const activeTour = useTourStore(s => s.activeTour)
  const seen = useTourStore(s => s.seen)
  const startTour = useTourStore(s => s.startTour)
  const endTour = useTourStore(s => s.endTour)
  const markSeen = useTourStore(s => s.markSeen)

  const driverRef = useRef<Driver | null>(null)
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* auto-start once, on the Overview page */
  useEffect(() => {
    if (location.pathname !== '/') return
    if (seen.overview || activeTour) return

    autoTimer.current = setTimeout(() => {
      // element may not exist if user navigated away before the timer fired
      if (!document.querySelector('[data-tour="credits-pill"]')) return
      startTour('overview')
    }, 900)

    return () => {
      if (autoTimer.current) clearTimeout(autoTimer.current)
    }
  }, [location.pathname, seen.overview, activeTour, startTour])

  /* run the tour when activated */
  useEffect(() => {
    if (activeTour !== 'overview') return

    const isDesktop = window.innerWidth >= 1024

    const steps: DriveStep[] = [
      {
        popover: {
          title: '👋 Welcome to ooguy!',
          description:
            'A quick 30-second tour to show you around. ' +
            'You can replay it anytime from <b>Settings → Guided Tours</b>.',
          showButtons: ['next'],
          nextBtnText: 'Start tour →',
        },
      },
      ...(isDesktop
        ? [{
            element: '[data-tour="sidebar-nav"]',
            popover: {
              title: 'Navigation',
              description:
                'Move between <b>Overview</b>, <b>Projects</b>, <b>History</b>, <b>Credits</b>, and <b>Settings</b> from this sidebar.',
              side: 'right' as const,
              align: 'start' as const,
            },
          }]
        : []),
      {
        element: '[data-tour="credits-pill"]',
        popover: {
          title: 'Your credit balance',
          description:
            'Credits power AI workflows. <b>10,000 credits = 1M tokens</b> — you\'re billed only for the tokens each run actually uses. Click to see billing details.',
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: '[data-tour="buy-credits"]',
        popover: {
          title: 'Topping up',
          description:
            'Buy more credits here — Starter 1M / Pro 2M / Business 4M tokens. First-time buyers get a big discount with coupon <b>new2026set</b>.',
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: '[data-tour="new-project"]',
        popover: {
          title: 'Create your first project',
          description:
            'A project is a visual workflow: add nodes, connect them, and run them to build datasets. Let\'s open the editor next!',
          side: 'bottom',
          align: 'start',
          nextBtnText: 'Finish ✓',
        },
      },
      {
        popover: {
          title: 'That\'s the basics!',
          description:
            'Click <b>New Project</b> whenever you\'re ready — the editor will guide you through nodes, connections, and running your first workflow.',
          showButtons: ['next'],
          nextBtnText: 'Got it ✓',
        },
      },
    ]

    // drop steps whose target element isn't rendered on this page
    const usable = steps.filter(s => !s.element || document.querySelector(s.element))
    if (usable.length <= 1) {
      markSeen('overview')
      endTour()
      return
    }

    const driverObj = driver({
      showProgress: true,
      progressText: '{{current}} of {{total}}',
      nextBtnText: 'Next →',
      prevBtnText: '← Back',
      doneBtnText: 'Done ✓',
      allowClose: true,
      stagePadding: 6,
      stageRadius: 10,
      overlayColor: 'rgb(8 6 14 / 0.75)',
      popoverClass: 'ooguy-popover',
      steps: usable,
      onDestroyed: () => {
        markSeen('overview')
        endTour()
      },
    })

    driverRef.current = driverObj
    // small delay so the overlay transition feels natural
    const startTimer = setTimeout(() => driverObj.drive(), 80)

    return () => {
      clearTimeout(startTimer)
      driverRef.current?.destroy()
      driverRef.current = null
    }
  }, [activeTour, endTour, markSeen])

  return null
}
