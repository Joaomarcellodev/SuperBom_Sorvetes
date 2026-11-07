import { useSyncExternalStore } from "react";

const SOUND_KEY = "superbom.sound";
const EVENT = "superbom:prefs";

function readSound(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

function subscribe(cb: () => void): () => void {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** Preferência "som de clique" (por aparelho). */
export function useSoundPref(): [boolean, (on: boolean) => void] {
  const on = useSyncExternalStore(subscribe, readSound, () => true);
  const set = (value: boolean) => {
    try {
      localStorage.setItem(SOUND_KEY, value ? "on" : "off");
    } catch {
      /* sem storage: a preferência só vale até recarregar */
    }
    window.dispatchEvent(new Event(EVENT));
  };
  return [on, set];
}

let audio: AudioContext | null = null;

/** Clique curtinho + vibração leve ao mexer nos contadores (ajuda de luva e de mão ocupada). */
export function tick(): void {
  if (!readSound()) return;
  try {
    navigator.vibrate?.(8);
    audio ??= new AudioContext();
    if (audio.state === "suspended") void audio.resume();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.06, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.05);
    osc.connect(gain).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + 0.06);
  } catch {
    /* áudio bloqueado pelo navegador: tudo bem */
  }
}
