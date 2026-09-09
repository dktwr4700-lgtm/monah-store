import { useEffect, useRef, useState } from "react";

const FLEE_RADIUS = 100;
const MAX_PUSH = 68;

export default function useRunawayButton(ready) {
  const [offsetX, setOffsetX] = useState(0);
  const [fleeing, setFleeing] = useState(false);
  const trackRef = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    if (ready) {
      setOffsetX(0);
      setFleeing(false);
      return;
    }
    const finePointer = window.matchMedia?.("(pointer: fine)").matches;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!finePointer || reducedMotion) return;

    function handlePointerMove(event) {
      const track = trackRef.current;
      const btn = btnRef.current;
      if (!track || !btn) return;
      const trackRect = track.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      const btnCenterX = btnRect.left + btnRect.width / 2;
      const btnCenterY = btnRect.top + btnRect.height / 2;
      const dx = event.clientX - btnCenterX;
      const dy = event.clientY - btnCenterY;
      const dist = Math.hypot(dx, dy);
      if (dist >= FLEE_RADIUS || dist === 0) {
        setOffsetX(0);
        setFleeing(false);
        return;
      }
      const strength = (FLEE_RADIUS - dist) / FLEE_RADIUS;
      const maxOffset = Math.max(0, (trackRect.width - btnRect.width) / 2 - 6);
      const pushX = Math.max(-maxOffset, Math.min(maxOffset, -(dx / dist) * strength * MAX_PUSH));
      setOffsetX(pushX);
      setFleeing(true);
    }

    document.addEventListener("pointermove", handlePointerMove);
    return () => document.removeEventListener("pointermove", handlePointerMove);
  }, [ready]);

  return { trackRef, btnRef, offsetX, fleeing };
}
