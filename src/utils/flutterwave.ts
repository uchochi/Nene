/**
 * FlutterWave inline checkout loader.
 *
 * Injects the official v3.js script (https://checkout.flutterwave.com/v3.js)
 * once and resolves when the global `FlutterwaveCheckout` function is ready.
 */

const FLW_SCRIPT_SRC = 'https://checkout.flutterwave.com/v3.js'

let loaderPromise: Promise<typeof FlutterwaveCheckout> | null = null

function injectScript(): Promise<typeof FlutterwaveCheckout> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('FlutterWave checkout requires a browser environment'))
      return
    }
    if (window.FlutterwaveCheckout) {
      resolve(window.FlutterwaveCheckout)
      return
    }

    const script = document.createElement('script')
    script.src = FLW_SCRIPT_SRC
    script.async = true

    script.addEventListener('load', () => {
      if (window.FlutterwaveCheckout) {
        resolve(window.FlutterwaveCheckout)
      } else {
        reject(new Error('FlutterWave script loaded but checkout function missing'))
      }
    })
    script.addEventListener('error', () => {
      reject(new Error('Failed to load FlutterWave checkout script'))
    })

    document.head.appendChild(script)
  })
}

/** Loads (once) and returns the global FlutterwaveCheckout function. */
export function loadFlutterwave(): Promise<typeof FlutterwaveCheckout> {
  if (!loaderPromise) {
    loaderPromise = injectScript().catch(err => {
      /* allow retrying after a failed load */
      loaderPromise = null
      throw err
    })
  }
  return loaderPromise
}

/** Generates a unique merchant transaction reference. */
export function makeTxRef(prefix = 'ooguy'): string {
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${Date.now()}-${rand}`
}
