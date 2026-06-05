const en = {
  common: {
    appName: "Mwasalaty Operator",
    retry: "Retry",
    nextScan: "Next scan",
    scan: "Scan",
    back: "Back",
    dashboard: "Dashboard",
    history: "History",
    sync: "Sync",
    account: "Account",
    summary: "Shift summary",
    loading: "Loading",
    detailsUnavailable: "Details unavailable",
    routeDetailsUnavailable: "Route details unavailable",
    profile: "Scanner",
    mode: "Mode",
    route: "Route",
    queue: "Queue",
    pending: "Pending",
    synced: "Synced",
    failed: "Failed",
    unknown: "Unknown",
    dash: "-"
  },
  offline: {
    banner: "You're offline. Scans will be recorded as unverified and synced later.",
    queued: "{count} queued",
    none: "No scans waiting to sync"
  },
  stateView: {
    loading: {
      headline: "Loading...",
      support: "Preparing the information you need."
    },
    empty: {
      headline: "No data",
      support: "There is nothing to show yet."
    },
    error: {
      headline: "Something went wrong",
      support: "Check your connection and try again."
    }
  },
  profile: {
    title: "Choose shift scanner",
    subtitle: "Select the mode or route before validating any ticket.",
    loading: "Preparing your scanner...",
    empty: "No scanners assigned to this device. Contact your dispatcher.",
    error: "Couldn't sign you in. Check your connection and try again.",
    success: "Scanner selected.",
    offline: "You're offline. You can still select your scanner; scans will be recorded as unverified and queued.",
    partial: "Some scanner details are unavailable.",
    genericRoute: "All routes",
    select: "Select"
  },
  dashboard: {
    title: "Current shift",
    loading: "Loading your shift...",
    empty: "No scans yet. Tap Scan to begin.",
    error: "We couldn't load your shift stats.",
    partial: "Some metrics are unavailable right now.",
    selectedRoute: "Scanning for {mode} {route}",
    startedAt: "Started {time}",
    scanCta: "Scan ticket",
    counts: {
      valid: "Valid",
      already_used: "Used",
      invalid: "Invalid",
      no_match: "No match",
      ambiguous: "Ambiguous",
      unverified: "Unverified"
    }
  },
  scanner: {
    title: "Ticket scanner",
    loading: "Starting camera...",
    empty: "Center the passenger's QR in the frame.",
    error: "Camera unavailable. Close other apps using the camera and try again.",
    denied: "Camera access is off. Turn it on in your browser settings to scan.",
    noCamera: "No usable camera was found on this device.",
    help: "How to enable camera",
    tryAgain: "Try again",
    processing: "Checking...",
    flashValid: "Valid",
    flashInvalid: "Invalid",
    flashUsed: "Already used",
    flashOffline: "Recorded without verification",
    partial: "A decision was reached, but some details are unavailable."
  },
  result: {
    valid: {
      headline: "Valid - admit passenger",
      support: "Ticket leg {leg} is valid. Remaining legs: {remaining}.",
      partial: "Route details unavailable. Decision: admit passenger.",
      countdown: "Returning to scan in {seconds}s"
    },
    alreadyUsed: {
      headline: "Already used",
      support: "Validated at {time} on {scanner}.",
      guidance: "Do not admit on this ticket.",
      partial: "This ticket was already used, but scanner details are unavailable."
    },
    invalid: {
      headline: "Invalid - do not admit",
      support: "Reason: {reason}.",
      fallback: "This ticket is invalid or has been tampered with."
    },
    noMatch: {
      headline: "This ticket isn't for this service",
      support: "Current scanner: {profile}. The ticket has no matching leg.",
      partial: "Route details are limited, but this ticket does not match this service."
    },
    ambiguous: {
      headline: "Multiple matching legs - confirm segment",
      support: "Choose the segment the passenger is taking now to complete validation.",
      loading: "Loading ticket details...",
      empty: "No selectable legs were found.",
      error: "Couldn't load ticket choices.",
      validate: "Validate this leg"
    },
    unverified: {
      headline: "Recorded - not verified. Use your discretion.",
      support: "We'll confirm this ticket when you're back online.",
      tag: "Scanned while offline"
    }
  },
  ticket: {
    title: "Ticket detail",
    loading: "Loading ticket legs...",
    empty: "No ticket selected. Scan a passenger's QR to begin.",
    error: "Couldn't load this ticket.",
    offline: "Offline - may be out of date.",
    partial: "Some stop names are unavailable.",
    pending: "Ticket is being issued...",
    allUsed: "All legs used",
    lifecycle: {
      issued: "Issued",
      legUsed: "Leg used",
      fullyUsed: "Fully used",
      invalid: "Invalid",
      refunded: "Refunded"
    },
    legStatus: {
      unused: "Unused",
      used: "Used",
      refunded: "Refunded"
    }
  },
  history: {
    title: "Scan history",
    loading: "Loading history...",
    empty: "No scans yet this session.",
    error: "Couldn't load history.",
    offline: "Showing local history; offline scans are flagged.",
    partial: "Rows with missing descriptors show outcome and time only.",
    scannedOffline: "Scanned while offline"
  },
  syncQueue: {
    title: "Sync queue",
    loading: "Checking sync status...",
    empty: "Nothing waiting to sync. You're all caught up.",
    error: "Some scans couldn't sync.",
    success: "All scans synced.",
    discrepancies: "All scans synced - {count} need your attention.",
    offline: "Will sync automatically when you're back online.",
    partial: "Queued items missing descriptors are still listed by time and outcome.",
    retry: "Retry sync",
    wasAlreadyUsed: "Was already used",
    wasInvalid: "Was invalid"
  },
  cameraHelp: {
    title: "Camera help",
    default: "Enable camera access in your browser settings, then return to the scanner.",
    step1: "Open site settings for this browser.",
    step2: "Set camera permission to allowed.",
    step3: "Return and tap Try again.",
    error: "This device can't scan. Use a device with a working camera.",
    success: "Camera permission granted. Return to the scanner.",
    offline: "Help is available offline; validation needs connectivity unless the scan is recorded as unverified.",
    enable: "Enable camera"
  },
  shift: {
    title: "Shift summary",
    loading: "Tallying your shift...",
    empty: "No activity this shift.",
    error: "Couldn't load your summary.",
    success: "Review the numbers before ending the shift.",
    offline: "Final numbers confirm once synced.",
    partial: "Some metrics are unavailable.",
    duration: "Duration",
    end: "End shift",
    unsyncedWarning: "{count} scans haven't synced - they'll sync automatically next time you're online."
  },
  account: {
    title: "Account and settings",
    loading: "Loading account...",
    fallback: "Something went wrong. Reload to continue.",
    reload: "Reload",
    offline: "Settings are readable. Signing out never discards the sync queue.",
    partial: "Some account fields are unavailable.",
    operator: "Operator",
    selectedScanner: "Selected scanner",
    language: "Language",
    arabic: "العربية",
    english: "English",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    appVersion: "App version",
    installHint: "Install the app from your browser menu.",
    signOut: "Sign out",
    signOutWarning: "Any unsynced scans will remain saved on this device."
  }
};

export default en;
