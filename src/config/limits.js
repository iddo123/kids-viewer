// Placeholder gating rule — free users can start this many videos before
// being asked to subscribe. Tune this single constant as the pricing model
// is refined.
export const FREE_VIDEO_LIMIT = 3

// `loading` guards against a race: useSubscription starts as `free` and resolves
// the real status asynchronously. While we don't yet know whether the user is
// subscribed, never show the upgrade prompt — otherwise a paying customer who
// clicks Start before the query resolves gets wrongly blocked.
export const shouldShowUpgrade = (isActive, videoCount, loading = false) =>
  !loading && !isActive && videoCount >= FREE_VIDEO_LIMIT
