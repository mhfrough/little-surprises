#!/usr/bin/env python
"""Score for "For Ammi" (Little Surprises reel v2), built ONLY from synthesised sound effects.

Nothing is downloaded and nothing is AI-generated: every sound is made here from noise, sines, filters
and a Karplus-Strong string, then placed on the reel's own timeline. The cue times are read from the
reel's HTML (var CUES / var STROKES), so a retime there is followed by re-running this script.

  python -I make_sfx.py                      # writes little-surprises-sfx-mix.wav + cue-sheet.txt next to this file

Groove: 100 BPM (one beat = 0.6 s from 0.3 s). Stomp on 1 and 3, clap on 2 and 4, paper-shaker eighths,
wood knocks on the off-beats; scene sounds (tag, ribbon, wicker, tissue, chocolates, zip, pen, tape,
doorbell, door creak, chimes) land on the same grid as the picture's cuts and drops.
"""
import json
import os
import re
import sys

import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

HERE = os.path.dirname(os.path.abspath(__file__))
PAGE = os.path.join(HERE, "..", "little-surprises-reel-v2.html")
SR = 48000
RNG = np.random.default_rng(20261021)


# ---------------------------------------------------------------- timeline from the page
def read_timeline():
    html = open(PAGE, encoding="utf-8").read()
    cues = re.search(r"var CUES = (\{.*?\});", html, re.S).group(1)
    lead0 = lambda s: re.sub(r"(?<![\d])\.(\d)", r"0.\1", s)   # JS allows .16, JSON doesn't
    cues = json.loads(lead0(re.sub(r"(\w+):", r'"\1":', cues)))
    strokes = json.loads(lead0(re.search(r"var STROKES = (\[.*?\]);", html, re.S).group(1)))
    return cues, strokes


# ---------------------------------------------------------------- building blocks
def t_axis(dur):
    return np.arange(int(dur * SR)) / SR


def noise(dur):
    return RNG.standard_normal(int(dur * SR))


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, btype="low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, btype="high", fs=SR, output="sos"), x)


def expenv(dur, decay, attack=0.001):
    t = t_axis(dur)
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    return a * np.exp(-t / decay)


def norm(x, peak=1.0):
    m = np.max(np.abs(x)) or 1.0
    return x / m * peak


def sweep_noise(dur, f0, f1, width=0.35, bands=18):
    """Noise through a band-pass whose centre glides from f0 to f1 (a weighted filter bank)."""
    n = noise(dur)
    t = t_axis(dur) / dur
    centre = np.exp(np.log(f0) + (np.log(f1) - np.log(f0)) * t)
    edges = np.geomspace(150, 12000, bands + 1)
    out = np.zeros_like(n)
    for lo, hi in zip(edges[:-1], edges[1:]):
        fc = np.sqrt(lo * hi)
        w = np.exp(-((np.log(fc) - np.log(centre)) ** 2) / (2 * width ** 2))
        out += bp(n, lo, hi) * w
    return out


# ---------------------------------------------------------------- the sound effects
def tick(pitch=1800):
    d = 0.07
    return norm(bp(noise(d), 2500, 7000) * expenv(d, 0.004) * 0.6 + np.sin(2 * np.pi * pitch * t_axis(d)) * expenv(d, 0.018))


def stomp():
    d = 0.45
    t = t_axis(d)
    f = 48 + 100 * np.exp(-t / 0.035)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * expenv(d, 0.14, 0.002)
    wood = np.sin(2 * np.pi * 185 * t) * expenv(d, 0.05) * 0.35
    thud = lp(noise(d), 900) * expenv(d, 0.018) * 0.6
    return norm(body + wood + thud)


def clap():
    d = 0.35
    x = np.zeros(int(d * SR))
    for k, off in enumerate((0.0, 0.009, 0.019, 0.027)):
        n0 = int(off * SR)
        L = len(x) - n0
        e = expenv(d, 0.006 if k < 3 else 0.085)[:L]
        x[n0:] += noise(d)[:L] * e * (0.8 if k < 3 else 1.0)
    return norm(bp(x, 850, 3800))


def shaker(accent=1.0):
    d = 0.09
    x = hp(noise(d), 5200) * expenv(d, 0.03, 0.007)
    return norm(x) * accent


def rustle(dur=0.4, lo=1400, hi=7500):
    """Paper / tissue: band-passed noise chopped by random crinkles."""
    n = bp(noise(dur), lo, hi)
    crk = np.zeros_like(n)
    for _ in range(int(dur * 140)):
        i = RNG.integers(0, len(n))
        L = int(RNG.uniform(0.002, 0.012) * SR)
        crk[i:i + L] += RNG.uniform(.3, 1.0) * np.exp(-np.arange(min(L, len(n) - i)) / (L / 3))
    body = np.abs(lp(noise(dur), 25)) * 1.5
    t = t_axis(dur) / dur
    shape = np.sin(np.pi * np.clip(t, 0, 1)) ** 0.6
    return norm(n * (crk + body) * shape)


def flap():
    d = 0.25
    x = bp(noise(d), 180, 1600) * expenv(d, 0.045, 0.004) + np.sin(2 * np.pi * 120 * t_axis(d)) * expenv(d, 0.06) * 0.6
    return norm(x)


def swish(dur=0.7, f0=500, f1=5000):
    x = sweep_noise(dur, f0, f1)
    t = t_axis(dur) / dur
    return norm(x * np.sin(np.pi * t) ** 1.4)


def swell(dur=0.6, f0=300, f1=6000):
    """Reverse whoosh into a hit."""
    x = sweep_noise(dur, f0, f1)
    t = t_axis(dur) / dur
    return norm(x * t ** 2.6)


def zipper(dur=0.55):
    x = np.zeros(int(dur * SR))
    t = 0.0
    while t < dur:
        rate = 45 + 160 * (t / dur)
        i = int(t * SR)
        L = int(0.004 * SR)
        x[i:i + L] += np.exp(-np.arange(min(L, len(x) - i)) / 30.0) * RNG.uniform(.6, 1)
        t += 1 / rate
    x = bp(x + noise(dur) * 0.05, 1800, 6500)
    tt = t_axis(dur) / dur
    return norm(x * np.minimum(1, tt * 6) * np.minimum(1, (1 - tt) * 10))


def tape(dur=0.5):
    """Sticky tape pulled off a roll: jittery stick-slip through a falling band."""
    x = np.zeros(int(dur * SR))
    t = 0.0
    while t < dur:
        i = int(t * SR)
        L = int(0.002 * SR)
        x[i:i + L] += RNG.uniform(.4, 1)
        t += 1 / RNG.uniform(220, 520)
    x = x + noise(dur) * 0.25
    tt = t_axis(dur) / dur
    y = sweep_noise(dur, 4200, 1300, width=.5) * 0.3 + bp(x, 900, 5200)
    return norm(y * np.minimum(1, tt * 5) * np.minimum(1, (1 - tt) * 14))


def click(f=2400, body=0.5):
    d = 0.12
    t = t_axis(d)
    x = bp(noise(d), 3000, 9000) * expenv(d, 0.002) + body * (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.31 * t)) * expenv(d, 0.03)
    return norm(x)


def knock(f=190):
    d = 0.3
    t = t_axis(d)
    x = np.sin(2 * np.pi * f * t) * expenv(d, 0.07) + 0.5 * np.sin(2 * np.pi * f * 2.42 * t) * expenv(d, 0.03) + 0.4 * lp(noise(d), 2500) * expenv(d, 0.006)
    return norm(x)


def scribble(dur):
    """Felt pen on card: band-passed friction riding the stroke's speed bumps."""
    t = t_axis(dur)
    fr = RNG.uniform(9, 14)
    am = 0.35 + 0.65 * np.abs(np.sin(np.pi * fr * t + RNG.uniform(0, 3)))
    x = bp(noise(dur), 1800, 6500) * am
    tt = t / dur
    return norm(x * np.minimum(1, tt * 12) * np.minimum(1, (1 - tt) * 12 + .15))


def pluck(f=392.0, dur=0.6, damp=0.996):
    N = int(SR / f)
    buf = RNG.uniform(-1, 1, N)
    out = np.zeros(int(dur * SR))
    for i in range(len(out)):
        out[i] = buf[i % N]
        buf[i % N] = damp * 0.5 * (buf[i % N] + buf[(i + 1) % N])
    return norm(out * expenv(dur, dur / 3, 0.001))


def bell(f, dur=1.8, partials=((1, 1, 1.0), (2.0, .35, .6), (3.0, .18, .45), (4.07, .1, .3)), strike=0.25):
    t = t_axis(dur)
    x = np.zeros_like(t)
    for ratio, amp, dec in partials:
        x += amp * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t / (dur * dec / 2.2))
    x += strike * bp(noise(dur), 2000, 8000) * expenv(dur, 0.003)
    return norm(x * np.clip(t / 0.002, 0, 1))


def chime_chord(root=523.25, dur=3.2):
    notes = [1, 1.2599, 1.4983, 1.8877, 2.2449]  # maj9 (C E G B D)
    out = np.zeros(int((dur + 0.2) * SR))
    for k, r in enumerate(notes):
        b = bell(root * r, dur, partials=((1, 1, 1.0), (2.76, .3, .5), (5.4, .12, .3), (8.93, .05, .2)), strike=.1)
        i = int(k * 0.035 * SR)
        out[i:i + len(b)] += b * (0.9 - k * 0.1)
    return norm(out)


def creak(dur=0.9):
    """Old door hinge: stick-slip impulses whose rate wanders, through two wooden resonances."""
    x = np.zeros(int(dur * SR))
    t = 0.0
    while t < dur:
        u = t / dur
        rate = 38 + 70 * np.sin(np.pi * u) + 18 * np.sin(7 * np.pi * u)
        i = int(t * SR)
        x[i] += RNG.uniform(.6, 1)
        t += 1 / max(rate, 12) * RNG.uniform(.9, 1.1)
    y = bp(x, 560, 700, 2) * 1.0 + bp(x, 1250, 1500, 2) * 0.6 + bp(x, 2400, 2800, 2) * 0.25
    tt = t_axis(dur) / dur
    return norm(y * np.minimum(1, tt * 8) * np.minimum(1, (1 - tt) * 5))


def glitter(dur=1.6):
    x = np.zeros(int(dur * SR))
    for _ in range(70):
        tt = RNG.uniform(0, dur) ** 1.6 / dur ** 0.6
        f = RNG.uniform(3500, 8000)
        b = np.sin(2 * np.pi * f * t_axis(0.06)) * expenv(0.06, 0.012)
        i = int(tt * SR)
        x[i:i + len(b)] += b[:max(0, min(len(b), len(x) - i))] * RNG.uniform(.2, .7)
    return norm(x * np.exp(-t_axis(dur) / (dur / 2)))


def reverb_ir(dur=1.3, decay=0.32):
    t = t_axis(dur)
    l = noise(dur) * np.exp(-t / decay)
    r = noise(dur) * np.exp(-t / decay)
    return norm(lp(l, 6000)) * 0.6, norm(lp(r, 6000)) * 0.6


# ---------------------------------------------------------------- arrangement
def main():
    C, STROKES = read_timeline()
    END = C["end"]
    N = int((END + 0.0) * SR)
    dry = np.zeros((2, N))
    send = np.zeros((2, N))
    sheet = []

    def put(time, sig, gain=1.0, pan=0.0, wet=0.2, name=""):
        i = int(round(time * SR))
        if i >= N:
            return
        s = sig[:N - i] * gain
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        dry[0, i:i + len(s)] += s * l
        dry[1, i:i + len(s)] += s * r
        send[0, i:i + len(s)] += s * l * wet
        send[1, i:i + len(s)] += s * r * wet
        if name:
            sheet.append((time, name))

    B = 0.6
    grid = lambda n: 0.3 + n * B

    # 1. night: a clock that won't wait (tick / tock on the beat), a slow heartbeat thump
    n = 0
    while grid(n) < C["ribbon"] + 0.31:
        put(grid(n), tick(1850 if n % 2 == 0 else 1380), 0.16, -0.25 if n % 2 else 0.25, 0.25, "tick" if n == 0 else "")
        if n % 2 == 0:
            put(grid(n), stomp(), 0.22, 0, 0.1, "heartbeat thump" if n == 0 else "")
        n += 1
    put(C["tagIn"] + 0.32, rustle(0.35), 0.35, 0.1, 0.25, "tag drops in (paper)")
    put(C["flip"] + 0.25, flap(), 0.5, 0, 0.25, "tag flips (paper flap)")
    put(C["flip"] + 0.1, swish(0.5, 900, 3000), 0.18, 0.3, 0.2)
    put(C["ribbon"], swish(0.85, 350, 6500), 0.55, -0.3, 0.3, "ribbon draws the loop (swish)")
    put(C["reveal"] - 0.6, swell(0.6), 0.45, 0, 0.2, "swell into the reveal")

    # 2. reveal hit
    put(C["reveal"], chime_chord(523.25, 3.0), 0.55, 0, 0.45, "REVEAL: chime chord + stomp + clap")
    put(C["reveal"], stomp(), 0.95)
    put(C["reveal"], clap(), 0.55, 0, 0.3)

    # 3. the groove: stomp 1+3, clap 2+4, shaker 8ths, wood knock on the and-of-4
    groove_end = C["arrive"]
    bar0 = C["reveal"]
    k = 0
    while True:
        t = bar0 + k * B
        if t >= groove_end - 0.01:
            break
        beat = k % 4
        duck = 0.45 if C["tag"] <= t < C["pack"] else 1.0          # quiet under the handwriting
        thin = 0.0 if t >= C["pin"] else 1.0                         # breakdown into the door
        if beat in (0, 2) and k > 0:
            put(t, stomp(), 0.8 * duck, 0, 0.08)
        if beat in (1, 3):
            put(t, clap(), 0.42 * duck * thin, 0.05 * (1 if beat == 1 else -1), 0.3)
        if t >= C["demo"]:
            lvl = 0.10 if t < C["choc1"] else 0.16
            put(t, shaker(1.0), lvl * duck, 0.35, 0.12)
            put(t + B / 2, shaker(.7), lvl * duck, 0.35, 0.12)
        if beat == 3 and t >= C["basket"]:
            put(t + B / 2, knock(240), 0.22 * duck * thin, -0.35, 0.15)
        k += 1
    sheet.append((bar0 + B, "groove starts: stomp 1+3, clap 2+4, paper-shaker 8ths, knock on the and-of-4"))

    # 4. scene sounds on the beat
    put(C["revealOut"], swish(0.75, 2500, 600), 0.35, 0.2, 0.25, "ribbon pulls through into the handle")
    put(C["basket"], knock(150), 0.75, 0, 0.15, "basket lands (wicker knock)")
    put(C["basket"], rustle(0.25, 900, 4000), 0.25, 0, 0.1)
    put(C["weave"], rustle(0.5, 1200, 5000), 0.28, -0.2, 0.15, "weave draws on (wicker rustle)")
    for i, dt in enumerate((0, 0.15, 0.3)):
        put(C["tissue"] + dt, rustle(0.42), 0.5, (-0.4, 0.4, 0)[i], 0.25, "tissue unfolds (x3)" if i == 0 else "")
    drops = [("choc1", click(1700, .3), "blush box lands (box click)"), ("choc2", click(2600), "truffle lands (foil click)"),
             ("choc3", knock(260), "chocolate bar lands (knock)"), ("choc4", click(3100), "truffle lands (foil click)")]
    for i, (cue, sig, name) in enumerate(drops):
        put(C[cue], sig, 0.65, (-0.3, -0.1, 0.15, 0.35)[i], 0.2, name)
        put(C[cue] + 0.17, click(2000 + 400 * i, .2), 0.15, (-0.3, -0.1, 0.15, 0.35)[i], 0.2)   # the little bounce
    put(C["wrap"], swish(0.6, 600, 4500), 0.45, -0.4, 0.25, "ribbon wraps (swish)")
    put(C["wrap"] + 0.45, zipper(0.45), 0.4, 0.3, 0.15, "ribbon pulls tight (zip)")
    put(C["bow"], pluck(392.0, 0.7), 0.45, 0, 0.35, "bow pops (plucked string, G4)")
    put(C["bow"], clap(), 0.3, 0, 0.3)
    put(C["tag"], flap(), 0.35, 0.2, 0.2, "tag swings in")
    put(C["tag"] + 0.05, bell(2093, 0.9, strike=.05), 0.12, 0.3, 0.4)
    for i, (s, d) in enumerate(STROKES):
        put(s, scribble(d + 0.02), 0.5 if i < 8 else 0.42, 0.1, 0.12, "handwriting (pen scribble per stroke)" if i == 0 else "")
    put(STROKES[-1][0] + STROKES[-1][1], bell(1568, 1.2, strike=.05), 0.16, 0, 0.4, "heart done (soft ting)")
    put(C["pack"], swish(0.5, 3000, 700), 0.35, 0, 0.2, "camera pulls back")
    put(C["pack"] + 0.18, knock(120), 0.55, 0, 0.12, "box rises (cardboard thud)")
    put(C["flap1"], flap(), 0.6, -0.3, 0.15, "flap 1")
    put(C["flap2"], flap(), 0.6, 0.3, 0.15, "flap 2")
    put(C["tape"], tape(0.45), 0.55, 0, 0.12, "tape pulled across")
    put(C["tape"] + 0.4, pluck(784.0, 0.35, .99), 0.25, -0.3, 0.25, "logo seal pops")
    put(C["route"] - 0.45, swish(0.6, 4000, 500), 0.4, 0, 0.25, "camera flies out over Karachi")
    for i in range(6):
        put(C["route"] + i * 0.3, click(3600 + 120 * i, .25), 0.10, -0.5 + i * 0.2, 0.2, "route dots tick" if i == 0 else "")
    put(C["pin"], pluck(523.25, 0.5, .993), 0.4, 0.4, 0.3, "pin pops")
    put(C["pin"] + 0.3, swell(0.5, 400, 3000), 0.3, 0.3, 0.2, "zoom into the pin")
    put(C["arrive"], knock(140), 0.7, 0.2, 0.12, "parcel lands on the step")
    put(C["arrive"], flap(), 0.3, 0.2, 0.1)
    put(C["bell"], bell(659.25, 1.8), 0.55, 0.35, 0.35, "doorbell: ding (E5)")
    put(C["bell2"], bell(523.25, 2.2), 0.55, 0.35, 0.35, "doorbell: dong (C5)")
    put(C["open"], creak(0.95), 0.45, -0.1, 0.3, "door creaks open")
    put(C["glow"], swell(C["hit"] - C["glow"], 250, 7000), 0.5, 0, 0.3, "light swells")

    # 5. the hit, petals, the card, the URL, a light outro groove
    put(C["hit"], chime_chord(523.25, 3.6), 0.7, 0, 0.5, "HIT: chime chord + stomp + clap + glitter (petals)")
    put(C["hit"], stomp(), 1.0)
    put(C["hit"], clap(), 0.6, 0, 0.3)
    put(C["hit"] + 0.05, glitter(1.8), 0.25, 0, 0.4)
    k = 1
    while True:
        t = C["hit"] + k * B
        if t > C["end"] - 1.9:
            break
        beat = k % 4
        fade = max(0.0, 1 - (t - C["hit"]) / (C["end"] - 1.9 - C["hit"]))
        if beat in (0, 2):
            put(t, stomp(), 0.5 * fade, 0, 0.08)
        if beat in (1, 3):
            put(t, clap(), 0.28 * fade, 0, 0.3)
        put(t, shaker(), 0.08 * fade, 0.35, 0.12)
        put(t + B / 2, shaker(.7), 0.08 * fade, 0.35, 0.12)
        k += 1
    for i, dt in enumerate((1.05, 1.35, 1.65)):
        put(C["hit"] + dt, knock(330 + 40 * i), 0.18, 0, 0.25, "card lines (soft knocks)" if i == 0 else "")
    put(C["url"], bell(1318.5, 1.6), 0.35, 0, 0.4, "URL: bell (E6)")
    put(C["end"] - 1.9, chime_chord(392.0, 2.0), 0.35, 0, 0.55, "last warm chime")

    # room reverb and the master
    irl, irr = reverb_ir()
    wet = np.vstack([fftconvolve(send[0], irl)[:N], fftconvolve(send[1], irr)[:N]])
    mix = dry + wet * 0.55
    mix = hp(mix, 30)
    tail = int(0.6 * SR)
    mix[:, -tail:] *= np.linspace(1, 0, tail) ** 2
    peak = np.max(np.abs(mix))
    mix = mix / peak * 0.89  # about -1 dBFS; tools/mux.py normalises the final video to -14 LUFS
    out = os.path.join(HERE, "little-surprises-sfx-mix.wav")
    wavfile.write(out, SR, (mix.T * 32767).astype(np.int16))
    rms = 20 * np.log10(np.sqrt(np.mean(mix ** 2)) + 1e-9)
    with open(os.path.join(HERE, "cue-sheet.txt"), "w", encoding="utf-8") as f:
        f.write("For Ammi: SFX score cue sheet (generated by make_sfx.py from the reel's CUES)\n\n")
        for t, name in sorted(sheet):
            f.write("%6.2f s  %s\n" % (t, name))
    print("wrote", out, "%.2f s" % (N / SR), "rms %.1f dBFS" % rms)


if __name__ == "__main__":
    sys.exit(main())
