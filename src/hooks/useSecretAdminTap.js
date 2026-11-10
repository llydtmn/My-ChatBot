import { useRef } from "react";

// Hidden shortcut to the admin dashboard: tap the target 5 times in a row,
// with no more than 2 seconds between taps. Nothing about it is visible.
const SECRET_TAPS = 5;
const MAX_GAP_MS = 2000;

export default function useSecretAdminTap() {
  const taps = useRef({ count: 0, last: 0 });

  return () => {
    const now = Date.now();
    const t = taps.current;
    t.count = now - t.last > MAX_GAP_MS ? 1 : t.count + 1;
    t.last = now;

    if (t.count >= SECRET_TAPS) {
      t.count = 0;
      window.location.hash = "#/admin";
    }
  };
}
