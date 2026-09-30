"""Render the game's one-shot sounds offline. Round eighteen, AS, AT and AU.

His words, 2026-09-29: "Can you improve the sounds in the game. They seem too cartoony."
And on the first answer, 2026-09-30: "They sound very tinny and hollow. I want deeper more
rumbly sounds. It should feel and sound like you are digging into the earth but still sound
soothing and satisfying."

So everything here is earth, not metal: thuds of packed soil, grit and gravel kept dark, and a
warm low body that sinks in pitch as it settles. A phone speaker gives little below about
150 Hz, so the low body is gently saturated to put its weight into harmonics a phone can play,
which the ear hears as the bass they imply. Attacks are soft and nothing rings on, so a sound
heard a thousand times a session stays pleasant. One small dark room tail is shared by all.
Several takes of each are rendered and the game picks one and spreads its pitch a little
(DESIGN.md, "Round eighteen: the sound of things").

    python tools/sfx.py            # writes public/sfx/*.ogg and test/baseline/sfx-measure.json
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
MEASURE = ROOT / "test" / "baseline" / "sfx-measure.json"
SRC = ROOT / "assets" / "sfx-src"  # the CC0 recordings the sounds are built from
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


# One small dark room, shared by every sound: a low, soft cavity, not a hall. AS's room was
# white noise up to 3.2 kHz, and that tail is most of what he heard as hollow.
_ir_t = t_of(0.3)
ROOM = band(brown(0.3), 60, 900) * np.exp(-_ir_t / 0.06)
ROOM /= np.sqrt(np.sum(ROOM ** 2))


def room(x: np.ndarray, wet: float = 0.1) -> np.ndarray:
    n = len(x) + len(ROOM)
    tail = np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(ROOM, n), n)
    dry = np.concatenate([x, np.zeros(len(ROOM))])
    return dry + tail * wet


def finish(x: np.ndarray, peak: float) -> np.ndarray:
    x = room(x)
    # Nothing bright gets out, and nothing so low a phone speaker cannot play it: the first
    # AU draft put 90% of its energy under 200 Hz and measured near silent on a phone.
    x = band(x, 120, 2600, order=3)
    x = x + 0.8 * band(x, 160, 500)  # the low-mid a phone does carry, where the rumble lives
    x = np.tanh(x / (np.abs(x).max() + 1e-9) * 1.6)  # warmth: a soft saturator, not a clip
    fade = min(len(x), int(0.03 * SR))
    x[-fade:] *= np.linspace(1, 0, fade)
    live = np.nonzero(np.abs(x) > 1e-3)[0]
    x = x[: (live[-1] + 1) if len(live) else len(x)]
    return x / (np.abs(x).max() + 1e-9) * peak


# ---------------------------------------------------------------- earth, the only material

def thud(dur: float, hi: float, decay: float, attack: float = 0.004) -> np.ndarray:
    """Packed soil taking a blow: dark noise, felt more than heard."""
    return band(brown(dur), 120, hi * 1.4) * env(dur, attack, decay)


def body(dur: float, f0: float, f1: float, decay: float, attack: float = 0.006,
         drive: float = 3.2) -> np.ndarray:
    """A warm low tone that sinks as it settles, driven so a phone speaker can carry it."""
    t = t_of(dur)
    f = f1 + (f0 - f1) * np.exp(-t / max(decay * 0.6, 1e-3))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR + rng.uniform(0, 6.28))
    return np.tanh(x * drive) / np.tanh(drive) * env(dur, attack, decay)


def hum(dur: float, f: float, decay: float, attack: float = 0.03, beat: float = 0.006) -> np.ndarray:
    """A soft low hum with a slow beat in it: the one warm tone a find is allowed."""
    t = t_of(dur)
    ph = rng.uniform(0, 6.28)
    x = 0.5 * np.sin(2 * np.pi * f * t + ph) + 0.5 * np.sin(2 * np.pi * f * (1 + beat) * t)
    x += 0.2 * np.sin(2 * np.pi * f * 2.01 * t)
    return x * env(dur, attack, decay)


def crumble(total: float, n: int, span: float, lo: float = 150, hi: float = 1400,
            start: float = 0.0, thin: float = 1.4) -> np.ndarray:
    """Soil and grit trickling: many small dark grains, thinning out."""
    parts = []
    for i in range(n):
        s = start + (i / max(n, 1)) ** thin * span + rng.uniform(0, 0.02)
        d = rng.uniform(0.03, 0.07)
        g = band(white(d), lo, hi * rng.uniform(0.6, 1.0)) * env(d, 0.002, d * 0.25)
        parts.append((s, g, rng.uniform(0.3, 1.0) * (1 - 0.6 * i / max(n, 1))))
    return mix(total, *parts)


# ---------------------------------------------------------------- real recordings

# His words on the second draft, 2026-09-30: "I don't want higher tones to be removed
# completely, just less often or less pronounced. So for the drilling and cracking, you can
# still use higher frequencies for more realistic sounds, just make sure they are quiet and
# have deeper sounds behind them. It still sounds a bit cartoony. Can you find a good mix and
# see if you can find some more realistic sounds?"
#
# So the texture is recorded now: real rock breaking, stones, a pick in stone, air, thunder,
# from three CC0 packs kept in assets/sfx-src/ (assets/CREDITS.md names them). Synthesis is
# only the deep body under them. Every recording's top end goes through tame(), which keeps
# its highs but pulls them down, so the detail is there and quiet with the weight behind it.

_cache: dict[str, np.ndarray] = {}


def rec(name: str, start: float = 0.0, dur: float | None = None) -> np.ndarray:
    """A recording from assets/sfx-src, mono at SR, peak 1."""
    if name not in _cache:
        raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(SRC / name), "-ac", "1",
                              "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
        x = np.frombuffer(raw, "<f4").astype(np.float64)
        _cache[name] = x / (np.abs(x).max() + 1e-9)
    x = _cache[name]
    x = x[int(start * SR):]
    if dur is not None:
        x = x[:int(dur * SR)]
        fade = min(len(x), int(0.02 * SR))
        x = x.copy()
        x[-fade:] *= np.linspace(1, 0, fade)
    return x


def pick(prefix: str, n: int) -> str:
    return f"{prefix}{rng.integers(0, n):d}.ogg"


def tame(x: np.ndarray, shelf: float = 1800, db: float = -9, lo: float | None = None,
         hi: float | None = None) -> np.ndarray:
    """Keep a recording's highs, but quieter: a high shelf cut, and optionally a band too."""
    g = 10 ** (db / 20)
    x = x - (1 - g) * band(x, shelf, None)
    return band(x, lo, hi) if (lo or hi) else x


def finish_real(x: np.ndarray, peak: float) -> np.ndarray:
    """finish() for a mix with real highs in it: the same room and warmth, but the top is
    already tamed layer by layer, so the final filter only takes off the fizz."""
    x = room(x)
    x = band(x, 110, 9000, order=3)
    x = x + 0.7 * band(x, 160, 500)
    x = np.tanh(x / (np.abs(x).max() + 1e-9) * 1.4)
    fade = min(len(x), int(0.03 * SR))
    x[-fade:] *= np.linspace(1, 0, fade)
    live = np.nonzero(np.abs(x) > 1e-3)[0]
    x = x[: (live[-1] + 1) if len(live) else len(x)]
    return phone_level(x, peak * 0.11)


def phone_level(x: np.ndarray, target: float) -> np.ndarray:
    """Set loudness as a phone speaker plays it (a steep highpass near 250 Hz), not by peak:
    a sound whose weight sits low would otherwise come out quiet on the phone he plays on."""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    h = 1 / np.sqrt(1 + (250 / np.maximum(f, 1)) ** 4)
    heard = np.sqrt(np.mean(np.fft.irfft(X * h, len(x)) ** 2))
    x = x * (target / (heard + 1e-9))
    top = np.abs(x).max()
    return x * (0.95 / top) if top > 0.95 else x


MINING = "impactMining_00"
SOFT = "impactSoft_heavy_00"
BREAK = "bfh1_rock_breaking_0"
FALL = ("bfh1_rock_falling_01.ogg", "bfh1_rock_falling_02.ogg", "bfh1_rock_falling_03.ogg",
        "bfh1_rock_falling_08.ogg")
STONES = "sfx100v2_stones_0"


def stones() -> str:
    return f"{STONES}{rng.integers(1, 4):d}.ogg"


def breaking() -> str:
    return f"{BREAK}{rng.integers(1, 4):d}.ogg"


# ---------------------------------------------------------------- the rewards

def ore() -> np.ndarray:
    """A lump of ore coming free and settling into the hold: a pick's knock in stone, a soft
    heavy landing, a little grit after, and the warm low body under it all."""
    return finish_real(mix(0.7,
        (0, tame(rec(pick(MINING, 5), 0, 0.5), 1500, -8), 0.55),
        (0.03, rec(pick(SOFT, 5)), 0.7),
        (0, body(0.4, rng.uniform(255, 292), 158, 0.08), 0.35),
        (0.06, tame(rec(stones(), 0, 0.3), 1500, -16), 0.25)), 0.6)


def key() -> np.ndarray:
    """A key: the pick knocks something harder than rock loose; a low hum, and the faintest
    glassy tick of crystal on top."""
    return finish_real(mix(2.0,
        (0, tame(rec(pick(MINING, 5), 0, 0.6), 1500, -8), 0.5),
        (0.02, rec(pick(SOFT, 5)), 0.6),
        (0, body(0.6, 210, 123, 0.16), 0.4),
        (0.03, hum(1.9, rng.uniform(190, 205), 0.55, 0.05), 0.45),
        (0.04, tame(rec("impactGlass_light_000.ogg"), 1800, -12), 0.18)), 0.62)


def discovery() -> np.ndarray:
    """The first of a kind, and a relic: the ground rolls like distant thunder, rock gives,
    and it settles on a hum."""
    return finish_real(mix(3.0,
        (0, rec("sfx100v2_thunder_01.ogg", 0.2, 2.8), 0.8),
        (0.1, tame(rec(breaking()), 1500, -12), 0.35),
        (0, body(2.0, 165, 98, 0.7, attack=0.2), 0.4),
        (0.3, hum(2.6, rng.uniform(145, 152), 0.9, 0.2), 0.35)), 0.7)


def cache() -> np.ndarray:
    """A sealed cache: the seal of rock breaks, a heavy lid drops, and something hums inside."""
    return finish_real(mix(1.8,
        (0, tame(rec(breaking()), 1500, -10), 0.5),
        (0.25, rec(pick(SOFT, 5)), 0.8),
        (0.25, body(0.5, 225, 117, 0.12), 0.4),
        (0.4, hum(1.2, rng.uniform(210, 225), 0.4, 0.06), 0.3)), 0.6)


def record() -> np.ndarray:
    """A personal best: a slow warm swell that lands softly on a heavy thud, nothing sung."""
    return finish_real(mix(1.4,
        (0, hum(1.4, rng.uniform(160, 170), 0.45, 0.08), 0.5),
        (0, body(0.8, 195, 132, 0.25, attack=0.05), 0.4),
        (0.05, rec(pick(SOFT, 5)), 0.5)), 0.5)


def sell() -> np.ndarray:
    """The hold emptying: real rock pouring out over a dark rush, then the last lump drops."""
    t = t_of(0.9)
    bed = band(brown(0.9), 90, 420) * np.clip(t / 0.06, 0, 1) * np.exp(-t / 0.35)
    return finish_real(mix(1.4,
        (0, bed, 0.5),
        (0, tame(rec(FALL[rng.integers(0, 4)]), 1500, -10), 0.6),
        (0.2, tame(rec(stones()), 1500, -12), 0.4),
        (0.8, rec(pick(SOFT, 5)), 0.7),
        (0.8, body(0.35, 240, 138, 0.08), 0.35)), 0.55)


def fit() -> np.ndarray:
    """Fitting an upgrade: a heavy part seats with a metal clunk, a motor draws it home, and
    the lock drops in."""
    t = t_of(0.3)
    motor = np.tanh(2 * np.sin(2 * np.pi * np.cumsum(95 + 45 * np.sin(np.pi * t / 0.3)) / SR))
    motor = band(motor, 60, 600) * np.sin(np.pi * t / 0.3) ** 2
    return finish_real(mix(1.0,
        (0, tame(rec(f"impactMetal_heavy_00{rng.choice([1, 3])}.ogg"), 1500, -8), 0.6),
        (0, rec(pick(SOFT, 5)), 0.6),
        (0, body(0.3, 195, 117, 0.07), 0.4),
        (0.12, motor, 0.3),
        (0.45, tame(rec("sfx100v2_lock_open_01.ogg"), 1500, -12), 0.4)), 0.55)


def supply() -> np.ndarray:
    """Spending a supply: a real pressure release, kept low, and a settle."""
    return finish_real(mix(1.0,
        (0, tame(rec("sfx100v2_air_02.ogg", 0, 0.9), 1200, -10, hi=2200), 0.5),
        (0, body(0.3, 210, 132, 0.08), 0.5),
        (0, rec(pick(SOFT, 5)), 0.35)), 0.5)


# ---------------------------------------------------------------- machinery and warnings

def chip() -> np.ndarray:
    """A bite out of the rock: the first instant of a pick in stone, with weight behind it."""
    return finish_real(mix(0.3,
        (0, tame(rec(pick(MINING, 5), 0, 0.2), 1500, -10), 0.7),
        (0, body(0.12, rng.uniform(255, 315), 165, 0.025), 0.35),
        (0, thud(0.12, 400, 0.02), 0.4)), 0.5)


def crack() -> np.ndarray:
    """A cell breaking out: real rock giving way, quiet on top, a deep knock and body under."""
    return finish_real(mix(1.0,
        (0, tame(rec(breaking(), 0, 0.8), 1500, -10), 0.6),
        (0, rec(pick(SOFT, 5)), 0.7),
        (0, body(0.35, 210, 117, 0.08), 0.4)), 0.6)


def drop() -> np.ndarray:
    """Ore left in the rock: a lump falling back onto soil, a few stones after. Done."""
    return finish_real(mix(0.7,
        (0, rec(pick(SOFT, 5)), 0.8),
        (0.03, tame(rec(FALL[1]), 1500, -14), 0.3)), 0.45)


def ui() -> np.ndarray:
    """A panel tap: a real switch, turned well down, on a knuckle-on-wood knock."""
    return finish_real(mix(0.3,
        (0, rec("impactWood_light_001.ogg"), 0.6),
        (0, tame(rec("sfx100v2_switch_01.ogg"), 1500, -14), 0.35),
        (0, body(0.1, rng.uniform(240, 280), 200, 0.018, attack=0.002), 0.3)), 0.4)


def alarm() -> np.ndarray:
    """A hull warning: three deep pulses and a groan under them. Urgent by rhythm, not pitch."""
    parts = []
    for i in range(3):
        t = t_of(0.26)
        saw = 2 * ((110 * t) % 1) - 1
        parts.append((i * 0.28, band(saw, 60, 900) * env(0.26, 0.02, 0.12), 0.6))
        parts.append((i * 0.28, body(0.26, 150, 120, 0.12, attack=0.02), 0.4))
    parts.append((0, rec("sfx100v2_thunder_01.ogg", 0.4, 1.0), 0.4))
    return finish_real(mix(1.1, *parts), 0.55)


def thrust() -> np.ndarray:
    """A burst of the thrusters: a low roar, a breath of real air in it, the ground answering."""
    t = t_of(0.8)
    roar = band(brown(0.8) + 0.15 * white(0.8), 90, 900) * np.clip(t / 0.06, 0, 1) * np.exp(-t / 0.25)
    return finish_real(mix(0.8,
        (0, roar, 0.8),
        (0, tame(rec("sfx100v2_air_03.ogg"), 1200, -10, hi=2200), 0.3),
        (0, body(0.6, 142, 105, 0.2, attack=0.04), 0.35)), 0.5)


def laser() -> np.ndarray:
    """The cutting laser: a deep searing growl, and real stone crackling off where it cuts."""
    t = t_of(0.55)
    saw = 2 * ((85 * t) % 1) - 1
    growl = band(saw + 0.5 * brown(0.55), 50, 1400) * np.clip(t / 0.03, 0, 1) * np.exp(-t / 0.2)
    return finish_real(mix(0.9,
        (0, growl, 0.6),
        (0.06, tame(rec(stones()), 1500, -10), 0.45)), 0.5)


def gas() -> np.ndarray:
    """A gas pocket blowing: a real rush of air, kept low, and the hull taking a heavy blow."""
    return finish_real(mix(1.4,
        (0, tame(rec("sfx100v2_air_01.ogg", 0.05, 1.2), 1200, -10, hi=2200), 0.5),
        (0, rec(pick(SOFT, 5)), 0.8),
        (0, body(0.6, 172, 105, 0.15), 0.4)), 0.65)


# The drill's motor bed: a real low machine loop, cut to a seamless loop. The game still
# synthesizes the chatter on top, because that answers the rock's hardness as it changes.
def drill_loop() -> np.ndarray:
    x = rec("sfx100v2_loop_machine_01.ogg", 0.5, 4.0)
    n = len(x)
    xf = int(0.4 * SR)
    head, tail = x[:xf], x[n - xf:]
    ramp = np.linspace(0, 1, xf)
    x = x[:n - xf].copy()
    x[:xf] = head * ramp + tail * (1 - ramp)  # crossfade the end into the start
    x = band(x, 60, 3000)
    return x / (np.abs(x).max() + 1e-9) * 0.7


SOUNDS = {
    # name: (recipe, variants)
    "ore": (ore, 4), "key": (key, 3), "discovery": (discovery, 2), "cache": (cache, 2),
    "record": (record, 2), "sell": (sell, 2), "fit": (fit, 3), "supply": (supply, 2),
    "chip": (chip, 5), "crack": (crack, 4), "drop": (drop, 3), "ui": (ui, 4),
    "alarm": (alarm, 1), "thrust": (thrust, 2), "laser": (laser, 2), "gas": (gas, 2),
    "drill": (drill_loop, 1),
}


def centroid(x: np.ndarray) -> float:
    sp = np.abs(np.fft.rfft(x))
    f = np.fft.rfftfreq(len(x), 1 / SR)
    return float((sp * f).sum() / (sp.sum() + 1e-12))


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
    measure = {}
    for name, (fn, n) in SOUNDS.items():
        manifest[name] = n
        for i in range(n):
            x = fn()
            measure[f"{name}-{i}"] = round(centroid(x))
            write_wav(tmp, x)
            if args.wav:
                write_wav(args.wav / f"{name}-{i}.wav", x)
            dest = args.out / f"{name}-{i}.ogg"
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(tmp), "-c:a", "libopus",
                            "-b:a", "32k", "-ac", "1", str(dest)], check=True)
    tmp.unlink()
    (args.out / "sfx.json").write_text(json.dumps(manifest, indent=1) + "\n", encoding="utf-8")
    if args.out == OUT:
        # Measured on the rendered takes, before encoding: what test/sound.test.mjs holds.
        MEASURE.write_text(json.dumps({"centroid_hz": measure}, indent=1) + "\n", encoding="utf-8")
    total = sum(p.stat().st_size for p in args.out.glob("*.ogg"))
    print(f"{sum(manifest.values())} files, {total / 1024:.1f} KB in {args.out}")
    print("centroid Hz:", ", ".join(f"{k} {v}" for k, v in measure.items() if k.endswith("-0")))
    return 0


if __name__ == "__main__":
    sys.exit(main())
