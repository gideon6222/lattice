"""Render the game's one-shot sounds offline. Round eighteen, AS and AT.

His words, 2026-09-29: "Can you improve the sounds in the game. They seem too cartoony."

Every reward used to be a pitched oscillator playing a musical interval. Here every sound is
built the way a struck or handled object sounds: a short noise transient for the contact, a
few INHARMONIC decaying partials for the body (modal synthesis, ratios near 1, 2.76, 5.40,
8.93), and one shared short room tail, so everything sits in the same dark place. Several
variants of each are rendered and the game picks one and spreads its pitch a little, so no
two plays are alike (DESIGN.md, "Round eighteen: the sound of things").

    python tools/sfx.py            # writes public/sfx/*.ogg
    python tools/sfx.py --wav DIR  # also writes WAVs to DIR, for listening

Seeded, so the same script always writes the same sounds. Needs numpy and ffmpeg.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

SR = 24000  # an Opus rate; mono at this rate is plenty for one-shots on a phone speaker
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "sfx"
rng = np.random.default_rng(1809)


# ---------------------------------------------------------------- building blocks

def t_of(dur: float) -> np.ndarray:
    return np.arange(int(dur * SR)) / SR


def white(dur: float) -> np.ndarray:
    return rng.uniform(-1, 1, int(dur * SR))


def brown(dur: float) -> np.ndarray:
    x = np.cumsum(rng.uniform(-1, 1, int(dur * SR)))
    x -= np.convolve(x, np.ones(400) / 400, mode="same")  # keep it centred
    return x / (np.abs(x).max() + 1e-9)


def band(x: np.ndarray, lo: float | None = None, hi: float | None = None, order: float = 2) -> np.ndarray:
    """A smooth highpass/lowpass/bandpass in the frequency domain."""
    n = len(x)
    if n == 0:
        return x
    f = np.fft.rfftfreq(n, 1 / SR)
    h = np.ones_like(f)
    if lo:
        h *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** (2 * order))
    if hi:
        h *= 1 / np.sqrt(1 + (f / hi) ** (2 * order))
    return np.fft.irfft(np.fft.rfft(x) * h, n)


def env(dur: float, attack: float, decay: float) -> np.ndarray:
    """Linear attack, exponential decay (decay is the 1/e time)."""
    t = t_of(dur)
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    return a * np.exp(-np.maximum(t - attack, 0) / decay)


def modes(dur: float, f0: float, ratios, amps, decays, detune: float = 0.004,
          beat: float = 0.0) -> np.ndarray:
    """Modal synthesis: decaying sine partials at inharmonic ratios. `beat` splits each
    mode into two close ones, which is what makes glass and crystal shimmer."""
    t = t_of(dur)
    out = np.zeros_like(t)
    for r, a, d in zip(ratios, amps, decays):
        f = f0 * r * (1 + rng.uniform(-detune, detune))
        ph = rng.uniform(0, 2 * np.pi)
        tone = np.sin(2 * np.pi * f * t + ph)
        if beat:
            tone = 0.5 * tone + 0.5 * np.sin(2 * np.pi * f * (1 + beat) * t + ph * 1.7)
        out += a * tone * np.exp(-t / d)
    return out


def click(dur: float, lo: float, hi: float, decay: float) -> np.ndarray:
    """The contact: a few ms of filtered noise."""
    return band(white(dur), lo, hi) * env(dur, 0.0008, decay)


def at(x: np.ndarray, sec: float, total: float) -> np.ndarray:
    """Place x at `sec` inside a buffer `total` seconds long."""
    out = np.zeros(int(total * SR))
    i = int(sec * SR)
    n = min(len(x), len(out) - i)
    out[i:i + n] += x[:n]
    return out


def mix(total: float, *parts) -> np.ndarray:
    out = np.zeros(int(total * SR))
    for sec, x, g in parts:
        out += at(x, sec, total) * g
    return out


# One small dark room, shared by every sound, so they all sit in the same place.
_ir_t = t_of(0.45)
ROOM = band(white(0.45), 200, 3200) * np.exp(-_ir_t / 0.09)
ROOM /= np.sqrt(np.sum(ROOM ** 2))


def room(x: np.ndarray, wet: float = 0.18) -> np.ndarray:
    n = len(x) + len(ROOM)
    tail = np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(ROOM, n), n)
    dry = np.concatenate([x, np.zeros(len(ROOM))])
    return dry * (1 - wet * 0.5) + tail * wet


def finish(x: np.ndarray, peak: float) -> np.ndarray:
    x = room(x)
    x = np.tanh(x / (np.abs(x).max() + 1e-9) * 1.4)  # a soft limiter, not a clip
    fade = min(len(x), int(0.02 * SR))
    x[-fade:] *= np.linspace(1, 0, fade)
    # trim silence off the tail
    live = np.nonzero(np.abs(x) > 1e-3)[0]
    x = x[: (live[-1] + 1) if len(live) else len(x)]
    return x / (np.abs(x).max() + 1e-9) * peak


BAR = (1.0, 2.76, 5.40, 8.93, 13.34)  # a free bar: the classic inharmonic set
PLATE = (1.0, 1.59, 2.14, 2.30, 2.65, 3.16)  # a plate or hopper wall


# ---------------------------------------------------------------- the rewards (AS)

def ore() -> np.ndarray:
    """A lump of ore landing in the hopper: a dull metal knock, no pitch you could sing."""
    f0 = rng.uniform(330, 420)
    body = modes(0.4, f0, PLATE[:5], (1, 0.6, 0.45, 0.3, 0.2), (0.07, 0.05, 0.04, 0.03, 0.025))
    thud = band(white(0.12), 60, 400) * env(0.12, 0.002, 0.03)
    grit = band(white(0.08), 1800, 6000) * env(0.08, 0.001, 0.012)
    return finish(mix(0.4, (0, body, 0.55), (0, thud, 0.9), (0, grit, 0.35)), 0.55)


def key() -> np.ndarray:
    """A key: a crystal struck clean, ringing and slowly beating. The one reward allowed a
    hint of pitch, because it is the rare promise."""
    f0 = rng.uniform(760, 880)
    ring = modes(2.2, f0, (1.0, 2.32, 4.25, 6.63), (1, 0.5, 0.28, 0.12), (0.9, 0.5, 0.3, 0.16),
                 beat=0.0035)
    tick = click(0.03, 3000, 11000, 0.004)
    sub = np.sin(2 * np.pi * 70 * t_of(0.4)) * env(0.4, 0.004, 0.09)
    return finish(mix(2.2, (0, ring, 0.6), (0, tick, 0.6), (0, sub, 0.35)), 0.6)


def discovery() -> np.ndarray:
    """The first of a kind, and a relic: a deep struck bloom that swells, then a crystal
    ring above it. Long and deliberate, because it is the rarest thing that happens."""
    t = t_of(3.0)
    swell = band(brown(3.0), 40, 500) * np.clip(t / 0.5, 0, 1) * np.exp(-t / 0.9)
    sub = np.sin(2 * np.pi * 48 * t) * env(3.0, 0.3, 0.8)
    bell = modes(2.6, rng.uniform(300, 340), BAR[:4], (1, 0.5, 0.3, 0.15), (1.2, 0.7, 0.4, 0.2),
                 beat=0.002)
    shimmer = modes(2.0, rng.uniform(1300, 1450), (1.0, 2.32, 4.25), (0.5, 0.25, 0.1),
                    (0.8, 0.4, 0.2), beat=0.004)
    hit = click(0.05, 200, 5000, 0.01)
    return finish(mix(3.0, (0, swell, 0.5), (0, sub, 0.4), (0.02, bell, 0.5), (0.16, shimmer, 0.35),
                      (0, hit, 0.5)), 0.7)


def cache() -> np.ndarray:
    """A sealed cache: the seal cracks with a hiss, the lid drops, one slow chime."""
    hiss = band(white(0.5), 2500, 9000) * env(0.5, 0.004, 0.09)
    crack = click(0.04, 400, 6000, 0.006)
    lid = modes(0.6, rng.uniform(110, 130), PLATE, (1, 0.7, 0.5, 0.4, 0.3, 0.2),
                (0.18, 0.12, 0.1, 0.08, 0.06, 0.05))
    thud = band(white(0.3), 40, 300) * env(0.3, 0.003, 0.07)
    chime = modes(1.8, rng.uniform(560, 620), BAR[:4], (1, 0.4, 0.2, 0.1), (0.7, 0.35, 0.2, 0.1),
                  beat=0.003)
    return finish(mix(2.2, (0, crack, 0.6), (0, hiss, 0.35), (0.12, lid, 0.5), (0.12, thud, 0.7),
                      (0.3, chime, 0.4)), 0.6)


def record() -> np.ndarray:
    """A personal best: one clear struck bell, bright, nothing sung."""
    bell = modes(1.6, rng.uniform(620, 680), BAR[:4], (1, 0.55, 0.3, 0.15), (0.6, 0.35, 0.2, 0.1),
                 beat=0.002)
    tick = click(0.03, 2000, 9000, 0.005)
    return finish(mix(1.6, (0, bell, 0.7), (0, tick, 0.5)), 0.5)


def sell() -> np.ndarray:
    """The hopper emptying: a rattle of stones on metal thinning out, then the latch."""
    total = 1.1
    parts = []
    n = 26
    for i in range(n):
        s = (i / n) ** 1.6 * 0.7 + rng.uniform(0, 0.03)
        g = 0.9 - 0.6 * i / n
        k = mix(0.12, (0, modes(0.12, rng.uniform(900, 1700), PLATE[:3], (1, 0.5, 0.3),
                                (0.02, 0.015, 0.01)), 1),
                (0, band(white(0.05), 1500, 7000) * env(0.05, 0.0005, 0.006), 0.6))
        parts.append((s, k, g * 0.35))
    latch = mix(0.4, (0, modes(0.4, 180, PLATE, (1, 0.7, 0.5, 0.4, 0.3, 0.2),
                               (0.09, 0.06, 0.05, 0.04, 0.03, 0.03)), 1),
                (0, click(0.05, 300, 5000, 0.006), 1))
    parts.append((0.78, latch, 0.6))
    return finish(mix(total, *parts), 0.5)


def fit() -> np.ndarray:
    """Fitting an upgrade: a clamp closes, a servo draws it home, the lock drops in."""
    clamp = mix(0.3, (0, modes(0.3, rng.uniform(140, 170), PLATE, (1, 0.8, 0.6, 0.4, 0.3, 0.2),
                               (0.08, 0.06, 0.05, 0.04, 0.03, 0.03)), 1),
                (0, click(0.04, 300, 6000, 0.005), 1))
    t = t_of(0.34)
    whine = np.sin(2 * np.pi * np.cumsum(260 + 180 * np.sin(np.pi * t / 0.34)) / SR)
    servo = band(whine + 0.6 * white(0.34), 200, 1800) * np.sin(np.pi * t / 0.34) ** 2
    lock = mix(0.25, (0, modes(0.25, rng.uniform(900, 1000), PLATE[:4], (1, 0.6, 0.4, 0.2),
                              (0.04, 0.03, 0.02, 0.02)), 1),
               (0, click(0.02, 2000, 9000, 0.003), 1))
    return finish(mix(0.9, (0, clamp, 0.6), (0.1, servo, 0.18), (0.46, lock, 0.5)), 0.5)


def supply() -> np.ndarray:
    """Spending a supply: a valve opens and a pressurised charge vents."""
    valve = mix(0.2, (0, modes(0.2, rng.uniform(200, 240), PLATE[:4], (1, 0.6, 0.4, 0.3),
                               (0.05, 0.04, 0.03, 0.02)), 1),
                (0, click(0.03, 500, 6000, 0.004), 1))
    t = t_of(0.7)
    vent = band(white(0.7), 1800, 8000) * np.clip(t / 0.03, 0, 1) * np.exp(-t / 0.22)
    return finish(mix(0.8, (0, valve, 0.6), (0.05, vent, 0.4)), 0.45)


# ---------------------------------------------------------------- machinery and warnings (AT)

def chip() -> np.ndarray:
    """A chip of rock off the bit: gritty, short, stone."""
    grit = band(white(0.1), 700, 5000) * env(0.1, 0.0005, 0.018)
    knock = modes(0.1, rng.uniform(450, 800), BAR[:3], (1, 0.3, 0.1), (0.015, 0.008, 0.005))
    return finish(mix(0.12, (0, grit, 0.7), (0, knock, 0.4)), 0.5)


def crack() -> np.ndarray:
    """A cell breaking out: a snap, a fall of rubble, a low knock."""
    snap = click(0.04, 800, 7000, 0.004)
    rubble = []
    for _ in range(8):
        k = band(white(0.06), 400, 3500) * env(0.06, 0.0005, 0.012)
        rubble.append((rng.uniform(0.02, 0.18), k, rng.uniform(0.2, 0.45)))
    knock = band(white(0.25), 50, 400) * env(0.25, 0.002, 0.05)
    return finish(mix(0.4, (0, snap, 0.7), (0, knock, 0.8), *rubble), 0.6)


def drop() -> np.ndarray:
    """Ore left in the rock: a lump falling on stone, dull and a little disappointing."""
    thud = band(white(0.2), 60, 600) * env(0.2, 0.002, 0.035)
    rattle = band(white(0.15), 800, 4000) * env(0.15, 0.001, 0.02)
    return finish(mix(0.3, (0, thud, 0.9), (0.04, rattle, 0.25)), 0.4)


def ui() -> np.ndarray:
    """A panel tap: a relay closing somewhere in the console, dry and small."""
    tick = click(0.02, 1200, 7000, 0.0025)
    body = modes(0.06, rng.uniform(1500, 1900), PLATE[:3], (1, 0.5, 0.3), (0.008, 0.006, 0.004))
    return finish(mix(0.08, (0, tick, 0.7), (0, body, 0.25)), 0.35)


def alarm() -> np.ndarray:
    """A hull warning: three low klaxon pulses, detuned, with a groan under them. Urgent by
    rhythm, not by pitch."""
    parts = []
    for i in range(3):
        t = t_of(0.2)
        f = 210 * (1 + 0.02 * np.sin(2 * np.pi * 3 * t))
        tone = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.4 + np.sin(2 * np.pi * np.cumsum(f * 1.498) / SR) * 0.3
        pulse = band(tone, 120, 1400) * env(0.2, 0.01, 0.12)
        parts.append((i * 0.22, pulse, 0.5))
    groan = band(brown(0.8), 40, 200) * env(0.8, 0.05, 0.3)
    parts.append((0, groan, 0.5))
    return finish(mix(0.9, *parts), 0.5)


def thrust() -> np.ndarray:
    """A burst of the thrusters: a roar of low noise with a sub under it, no whine."""
    t = t_of(0.8)
    roar = band(brown(0.8) + 0.3 * white(0.8), 60, 1600) * np.clip(t / 0.05, 0, 1) * np.exp(-t / 0.25)
    sub = np.sin(2 * np.pi * 52 * t) * env(0.8, 0.03, 0.2)
    return finish(mix(0.8, (0, roar, 0.8), (0, sub, 0.3)), 0.5)


def laser() -> np.ndarray:
    """The cutting laser: a crackling arc that burns into the rock, then the rock spits."""
    t = t_of(0.5)
    hum = np.sin(2 * np.pi * np.cumsum(120 + 60 * t) / SR)
    buzz = band(np.sign(hum) * 0.3 + white(0.5) * (rng.uniform(0, 1, len(t)) > 0.93), 400, 6000)
    arc = buzz * np.clip(t / 0.02, 0, 1) * np.exp(-t / 0.18)
    spit = band(white(0.3), 3000, 10000) * env(0.3, 0.003, 0.05)
    return finish(mix(0.55, (0, arc, 0.6), (0.06, spit, 0.3)), 0.5)


def gas() -> np.ndarray:
    """A gas pocket blowing: a hard burst, a long hiss, the hull flexing under it."""
    t = t_of(1.2)
    burst = click(0.06, 200, 6000, 0.012)
    hiss = band(white(1.2), 1500, 9000) * np.clip(t / 0.01, 0, 1) * np.exp(-t / 0.35)
    flex = modes(0.8, rng.uniform(70, 85), PLATE, (1, 0.7, 0.5, 0.3, 0.2, 0.1),
                 (0.3, 0.2, 0.15, 0.1, 0.08, 0.06))
    return finish(mix(1.2, (0, burst, 0.7), (0, hiss, 0.4), (0.02, flex, 0.5)), 0.65)


SOUNDS = {
    # name: (recipe, variants)
    "ore": (ore, 4), "key": (key, 3), "discovery": (discovery, 2), "cache": (cache, 2),
    "record": (record, 2), "sell": (sell, 2), "fit": (fit, 3), "supply": (supply, 2),
    "chip": (chip, 5), "crack": (crack, 4), "drop": (drop, 3), "ui": (ui, 4),
    "alarm": (alarm, 1), "thrust": (thrust, 2), "laser": (laser, 2), "gas": (gas, 2),
}


def write_wav(path: Path, x: np.ndarray) -> None:
    pcm = (np.clip(x, -1, 1) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--wav", type=Path, help="also write WAVs here, for listening")
    ap.add_argument("--out", type=Path, default=OUT)
    args = ap.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    if args.wav:
        args.wav.mkdir(parents=True, exist_ok=True)
    tmp = args.out / "_tmp.wav"
    manifest = {}
    for name, (fn, n) in SOUNDS.items():
        manifest[name] = n
        for i in range(n):
            x = fn()
            write_wav(tmp, x)
            if args.wav:
                write_wav(args.wav / f"{name}-{i}.wav", x)
            dest = args.out / f"{name}-{i}.ogg"
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(tmp), "-c:a", "libopus",
                            "-b:a", "32k", "-ac", "1", str(dest)], check=True)
    tmp.unlink()
    (args.out / "sfx.json").write_text(json.dumps(manifest, indent=1) + "\n", encoding="utf-8")
    total = sum(p.stat().st_size for p in args.out.glob("*.ogg"))
    print(f"{sum(manifest.values())} files, {total / 1024:.1f} KB in {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
