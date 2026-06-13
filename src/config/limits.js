// Placeholder gating rule — free users can start this many videos before
// being asked to subscribe. Tune this single constant as the pricing model
// is refined.
export const FREE_VIDEO_LIMIT = 3

export const shouldShowUpgrade = (isActive, videoCount) =>
  !isActive && videoCount >= FREE_VIDEO_LIMIT
