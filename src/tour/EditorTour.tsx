import { useEffect, useRef } from 'react'
import { driver, type Driver, type DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'
import './tour.css'
import { useTourStore } from './tourStore'
import { seedDemoWorkflow, nodeSelector } from './demoWorkflow'
import { useWorkflowStore } from '../store/workflowStore'

interface EditorTourProps {
  /** Opens/closes the node palette sidebar (mobile starts collapsed) */
  setPaletteOpen: (open: boolean) => void
}

/**
 * Interactive walkthrough for the workflow editor.
 *
 * - Auto-starts once on first visit to any editor page.
 * - Seeds a sample Input → Clean → Format → Output workflow on an empty canvas so
 *   the tour can point at real nodes, connections, and open the config panel.
 * - Replayable from Settings → Guided Tours.
 */
export function EditorTour({ setPaletteOpen }: EditorTourProps) {
  const activeTour = useTourStore(s => s.activeTour)
  const seen = useTourStore(s => s.seen)
  const startTour = useTourStore(s => s.startTour)
  const endTour = useTourStore(s => s.endTour)
  const markSeen = useTourStore(s => s.markSeen)

  const driverRef = useRef<Driver | null>(null)
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* auto-start once */
  useEffect(() => {
    if (seen.editor || activeTour) return

    autoTimer.current = setTimeout(() => {
      if (!document.querySelector('[data-tour="toolbar-back"]')) return
      startTour('editor')
    }, 1000)

    return () => {
      if (autoTimer.current) clearTimeout(autoTimer.current)
    }
  }, [seen.editor, activeTour, startTour])

  /* run the tour when activated */
  useEffect(() => {
    if (activeTour !== 'editor') return

    const isDesktop = window.innerWidth >= 1024

    /* seed a demo workflow on empty canvases so there's something to point at */
    const demo = seedDemoWorkflow()
    const inputSel = demo ? nodeSelector(demo.inputId) : null

    const steps: DriveStep[] = [
      {
        popover: {
          title: '🛠 The workflow editor',
          description:
            'This is where you build data pipelines with nodes. ' +
            'We\'ve placed a sample workflow on the canvas so you can see how everything works.',
          showButtons: ['next'],
          nextBtnText: 'Start tour →',
        },
      },
      {
        element: '[data-tour="toolbar-back"]',
        popover: {
          title: 'Back to Projects',
          description:
            'This arrow always takes you back to your projects list. Your work auto-saves as you build.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tour="workflow-name"]',
        popover: {
          title: 'Workflow name',
          description:
            'Rename your workflow here. The dot next to it turns orange when there are unsaved changes, green when everything is saved.',
          side: 'bottom',
          align: 'start',
        },
      },
      ...(isDesktop
        ? [{
            element: '[data-tour="node-palette"]',
            popover: {
              title: 'Nodes — your building blocks',
              description:
                'Click a node (or drag it onto the canvas) to add it. They\'re ordered by pipeline stage: <b>Input → Clean → Align → Structure → Label → Output</b>.',
              side: 'right' as const,
              align: 'start' as const,
            },
          }]
        : [{
            element: '[data-tour="palette-toggle"]',
            popover: {
              title: 'Nodes menu',
              description:
                'Tap here to open the nodes palette. Nodes are your building blocks — <b>Input</b> for content, <b>Format</b> to structure it, <b>Output</b> to export. Tap Next and we\'ll open it for you.',
              side: 'bottom',
              align: 'start',
              onNextClick: (_el, _step, ctx) => {
                setPaletteOpen(true)
                setTimeout(() => ctx.driver.moveNext(), 350)
              },
              onPrevClick: (_el, _step, ctx) => ctx.driver.movePrevious(),
            },
          },
          {
            element: '[data-tour="node-palette"]',
            popover: {
              title: 'The node palette',
              description:
                'Tap a node to add it to the canvas. They\'re ordered by pipeline stage: <b>Input → Clean → Align → Structure → Label → Output</b>. Tap Next to see them in action — we\'ll close this menu for you.',
              side: 'right',
              align: 'start',
              // close the drawer so the canvas step below is actually visible
              onNextClick: (_el, _step, ctx) => {
                setPaletteOpen(false)
                setTimeout(() => ctx.driver.moveNext(), 400)
              },
              onPrevClick: (_el, _step, ctx) => ctx.driver.movePrevious(),
            },
          }]),
      {
        element: '[data-tour="canvas"]',
        popover: {
          title: 'The canvas',
          description:
            demo
              ? 'This is your sample workflow: <b>Input → Clean → Format → Output</b>. The animated lines are connections — data flows through them. Drag nodes to rearrange, pinch or scroll to zoom.'
              : 'Your nodes appear here. Drag them around to rearrange, pinch or scroll to zoom.',
          side: 'top',
          align: 'center',
          // mobile: Back should bring the palette drawer back up
          onPrevClick: isDesktop
            ? undefined
            : (_el, _step, ctx) => {
                setPaletteOpen(true)
                setTimeout(() => ctx.driver.movePrevious(), 350)
              },
        },
      },
      ...(inputSel
        ? [{
            element: inputSel,
            popover: {
              title: 'Connecting nodes',
              description:
                'Each node has a dot on <b>top</b> (input) and <b>bottom</b> (output). To connect two nodes, drag from one node\'s bottom dot to another\'s top dot. Click a node to configure it — try it after the tour!',
              side: 'bottom',
              align: 'start',
              // opening the config panel needs to happen before the next step
              // highlights it — take over the Next button to control the timing
              onNextClick: (_el: Element | undefined, _step: DriveStep, ctx: { driver: Driver }) => {
                if (demo) useWorkflowStore.getState().selectNode(demo.inputId)
                setTimeout(() => ctx.driver.moveNext(), 250)
              },
              onPrevClick: (_el: Element | undefined, _step: DriveStep, ctx: { driver: Driver }) => {
                ctx.driver.movePrevious()
              },
            },
          },
          {
            element: '[data-tour="config-panel"]',
            popover: {
              title: 'Configuring a node',
              description:
                'We just opened the Input node\'s settings. Here you paste text, upload media files, and enable AI processing like OCR or transcription. Every node type has its own options.',
              side: 'left',
              align: 'start',
              onNextClick: (_el: Element | undefined, _step: DriveStep, ctx: { driver: Driver }) => {
                useWorkflowStore.getState().selectNode(null)
                setTimeout(() => ctx.driver.moveNext(), 150)
              },
              onPrevClick: (_el: Element | undefined, _step: DriveStep, ctx: { driver: Driver }) => {
                if (demo) useWorkflowStore.getState().selectNode(demo.inputId)
                setTimeout(() => ctx.driver.movePrevious(), 250)
              },
            },
          }]
        : [{
            popover: {
              title: 'Connecting & configuring',
              description:
                'Each node has a dot on <b>top</b> and <b>bottom</b> — drag between them to connect. Click any node to open its configuration panel on the right.',
            },
          }]),
      {
        element: isDesktop ? '[data-tour="run-workflow"]' : '[data-tour="mobile-actions"]',
        popover: {
          title: 'Run your workflow',
          description:
            isDesktop
              ? 'Run executes the whole pipeline from top to bottom. You\'re billed per AI token used — a simple run costs just a few credits.'
              : 'Open the Actions menu to <b>Run</b> the pipeline, plus Save, Export and Import. You\'re billed per AI token used — a simple run costs just a few credits.',
          side: 'bottom',
          align: 'end',
        },
      },
      {
        popover: {
          title: 'Results & export 🎉',
          description:
            'After running, results appear at the bottom with <b>Preview</b>, <b>Stats</b>, and <b>Raw</b> tabs. ' +
            'Hit <b>Export</b> in the toolbar to download your dataset as JSONL, JSON, or CSV — ready for LLM fine-tuning.',
          showButtons: ['next'],
          nextBtnText: 'Finish ✓',
        },
      },
      {
        popover: {
          title: 'You\'re all set! 🚀',
          description:
            'The sample workflow on the canvas is yours to experiment with — paste text into the Input node and press Run. ' +
            'Clear the canvas anytime with the 🗑 trash icon. Replay this tour from <b>Settings → Guided Tours</b>.',
          showButtons: ['next'],
          nextBtnText: 'Got it ✓',
        },
      },
    ]

    /* drop steps whose target isn't rendered right now */
    const usable = steps.filter(s => !s.element || document.querySelector(s.element))

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
        /* leave the panel closed and the demo workflow on the canvas */
        useWorkflowStore.getState().selectNode(null)
        markSeen('editor')
        endTour()
      },
    })

    driverRef.current = driverObj
    const startTimer = setTimeout(() => driverObj.drive(), 80)

    return () => {
      clearTimeout(startTimer)
      driverRef.current?.destroy()
      driverRef.current = null
    }
  }, [activeTour, endTour, markSeen, setPaletteOpen])

  return null
}
