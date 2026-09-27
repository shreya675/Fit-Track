import { useEffect, useRef, useState } from 'react';
import { BellRing, Minus, Plus, SkipForward, TimerReset } from 'lucide-react';
import { REST_STEP, adjustRest, clampRest, formatClock, readRestSeconds, restProgress, restRemaining, startRest, writeRestSeconds } from './restTimer.js';
import './restTimer.css';

const canNotify = () => typeof Notification !== 'undefined';

/** A short two-tone chime through the Web Audio API; silent wherever audio is unavailable. */
function chime() {
  try {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    const context = new Context();
    [[880, 0], [1175, 0.18]].forEach(([frequency, offset]) => {
      const oscillator = context.createOscillator(), gain = context.createGain();
      oscillator.type = 'sine'; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, context.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.25, context.currentTime + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + offset + 0.35);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(context.currentTime + offset); oscillator.stop(context.currentTime + offset + 0.4);
    });
    setTimeout(() => context.close(), 1000);
  } catch { /* No sound is better than a crash mid-workout. */ }
}

function announce(seconds) {
  try { navigator.vibrate?.([200, 100, 200]); } catch { /* Not every device vibrates. */ }
  chime();
  if (canNotify() && Notification.permission === 'granted' && document.visibilityState !== 'visible') {
    try { new Notification('Rest over', { body: `${formatClock(seconds)} rest finished. Next set.`, tag: 'fittrack-rest', silent: true }); } catch { /* Notification blocked by the platform. */ }
  }
}

/**
 * Countdown between sets. Starts by itself whenever a new set is logged (the count is passed in by the
 * session), can be nudged longer or shorter while running, and chimes, vibrates and — if allowed — sends
 * a browser notification when it ends. The chosen length is a device preference kept in this browser.
 */
export default function RestTimer({ loggedSets = 0 }) {
  const [length, setLength] = useState(() => readRestSeconds(typeof localStorage === 'undefined' ? null : localStorage));
  const [auto, setAuto] = useState(true);
  const [rest, setRest] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const [done, setDone] = useState(false);
  const [permission, setPermission] = useState(() => (canNotify() ? Notification.permission : 'unsupported'));
  const previousSets = useRef(loggedSets);
  const remaining = restRemaining(rest, now);

  // A newly logged set starts the rest; removing a set never does.
  useEffect(() => {
    if (loggedSets > previousSets.current && auto) { setRest(startRest(length)); setDone(false); }
    previousSets.current = loggedSets;
  }, [loggedSets, auto, length]);

  useEffect(() => {
    if (!rest) return;
    setNow(Date.now());
    const tick = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(tick);
  }, [rest]);

  useEffect(() => {
    if (!rest || remaining > 0) return;
    announce(rest.total);
    setRest(null);
    setDone(true);
  }, [rest, remaining]);
  useEffect(() => {
    if (!done) return;
    const hide = setTimeout(() => setDone(false), 6000);
    return () => clearTimeout(hide);
  }, [done]);

  function changeLength(delta) {
    const next = clampRest(length + delta);
    setLength(next);
    writeRestSeconds(localStorage, next);
  }
  async function askPermission() {
    if (!canNotify()) return;
    try { setPermission(await Notification.requestPermission()); } catch { setPermission(Notification.permission); }
  }

  return <section className={`rest-timer ${rest ? 'running' : ''} ${done ? 'done' : ''}`} aria-label="Rest timer">
    {rest ? <>
      <div className="rest-clock" role="timer" aria-live="off" aria-label={`${remaining} seconds of rest remaining`}>
        <span className="rest-progress" style={{ '--progress': `${restProgress(rest, now) * 100}%` }} />
        <strong>{formatClock(remaining)}</strong><small>rest</small>
      </div>
      <div className="rest-actions">
        <button type="button" className="button secondary" aria-label="Fifteen seconds less" onClick={() => setRest(current => adjustRest(current, -REST_STEP))}><Minus size={15} />15 s</button>
        <button type="button" className="button secondary" aria-label="Fifteen seconds more" onClick={() => setRest(current => adjustRest(current, REST_STEP))}><Plus size={15} />15 s</button>
        <button type="button" className="button secondary" onClick={() => { setRest(null); setDone(false); }}><SkipForward size={15} />Skip</button>
      </div>
    </> : <>
      <div className="rest-idle">
        <span className="rest-status" role="status">{done ? 'Rest over — go for your next set.' : `Rest ${formatClock(length)} between sets`}</span>
        <div className="rest-length" role="group" aria-label="Rest length">
          <button type="button" className="icon-button bordered" aria-label="Shorter rest" disabled={length <= 15} onClick={() => changeLength(-REST_STEP)}><Minus size={15} /></button>
          <span>{formatClock(length)}</span>
          <button type="button" className="icon-button bordered" aria-label="Longer rest" disabled={length >= 600} onClick={() => changeLength(REST_STEP)}><Plus size={15} /></button>
        </div>
      </div>
      <div className="rest-actions">
        <button type="button" className="button secondary" onClick={() => { setRest(startRest(length)); setDone(false); }}><TimerReset size={15} />Start rest</button>
        <label className="rest-auto"><input type="checkbox" checked={auto} onChange={e => setAuto(e.target.checked)} />Start after each set</label>
      </div>
    </>}
    {permission === 'default' && <button type="button" className="text-link rest-notify" onClick={askPermission}><BellRing size={14} />Notify me when rest ends, even in another tab</button>}
    {permission === 'denied' && <p className="fine-print">Browser notifications are blocked; the chime and vibration still work while this tab is open.</p>}
  </section>;
}
