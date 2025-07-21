// declare global {
//   interface Window {
//     gtag: (command: string, action: string, parameters?: any) => void
//   }
// }

// export function trackEvent(action: string, parameters?: any) {
//   if (typeof window !== "undefined" && window.gtag) {
//     window.gtag("event", action, {
//       ...parameters,
//       timestamp: new Date().toISOString(),
//     })
//   }
// }

// export function trackPageView(url: string) {
//   if (typeof window !== "undefined" && window.gtag) {
//     window.gtag("config", process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
//       page_path: url,
//     })
//   }
// }

declare global {
  interface Window {
    gtag: (command: string, action: string, parameters?: any) => void
  }
}

export function trackEvent(action: string, parameters?: any) {
  try {
    if (typeof window !== "undefined" && window.gtag) {
      console.log(`Tracking event: ${action}`, parameters)
      window.gtag("event", action, {
        ...parameters,
        timestamp: new Date().toISOString(),
      })
    } else {
      console.warn("Google Analytics gtag not available")
    }
  } catch (err) {
    console.error("Error tracking event:", action, err)
  }
}

export function trackPageView(url: string) {
  try {
    if (typeof window !== "undefined" && window.gtag) {
      if (!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
        console.warn("Google Analytics measurement ID not set")
        return
      }
      console.log(`Tracking page view: ${url}`)
      window.gtag("config", process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
        page_path: url,
      })
    } else {
      console.warn("Google Analytics gtag not available")
    }
  } catch (err) {
    console.error("Error tracking page view:", url, err)
  }
}