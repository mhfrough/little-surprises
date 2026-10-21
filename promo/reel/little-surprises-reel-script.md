# Little Surprises reel: "A whole basket in 15 seconds"

**Recipe:** style=pastel-soft, structure=speedrun, layout=top-tight, background=colorblock-shift, transition=circle-wipe, headline=word-pop, hook=strike-chips, frame=browser-window, cta=sticker-pile (seed 725215728, from `reel.json`)
**Length:** 25 seconds, 9:16 vertical (1080x1920 CSS, rendered at 2x to 2160x3840, 30 fps)
**Goal:** a viewer understands that Little Surprises lets them build a personal gift basket (basket, wrap and ribbon, treats, handwritten note) in seconds, delivered the same day in Karachi, and remembers the site.
**Visuals:** `little-surprises-reel.html`. The demo is the real site (Angular dev build at http://localhost:4300), captured by `capture/capture.cjs` at the browser frame's exact screen size (1000x784 at 2x). Every tap sits on the control's measured box (`capture/shots.json`). Logo mark `assets/logo-mark.png` (picture only), Inter and Cinzel from the project's own font packages.
**Look:** pastel-soft (round, bouncy, soft gradients) dressed in the brand: wine `#7a0f3d` accent, rose `#d86b8a`, blush ground, sage tints in the colour fields, plum ink. Inter for all text, Cinzel only for the wordmark (wine "Little", rose "Surprises", as on the site).
**Audio:** music only. Not chosen yet (Sizzle picks music after the owner approves the visuals).

## Script (on-screen copy, also readable as a voiceover)

> No time to make a gift personal?
> Little Surprises. Personalized with Love, Delivered with Care.
> Pick the basket. Wrap it, tie a ribbon. Fill it with treats. Write a note, we handwrite it.
> Done: a whole basket in 15 seconds. Every gift tells a story.
> Same day in Karachi. Pay cash, or by wallet. Help on WhatsApp.
> Little Surprises. Make every gift personal. littlesurprises.pk

## Shot list

| Time (s) | On screen |
|---|---|
| 0.15-2.75 | **Hook** (strike-chips). "No time to / make a gift / **personal?**" Four chips pop in and get struck out: *Saw it on Instagram*, *Not sold in Karachi*, *Same old hampers*, *Family far away* (the survey's top problems). |
| 2.95-4.85 | **Reveal** (circle-wipe). Wine circle bursts open; the logo mark pops in a white tile; "LITTLE / SURPRISES" rises letter by letter in Cinzel; the tagline. The circle collapses into the speedrun clock. |
| 5.0-5.6 | Browser window (littlesurprises.pk/build-a-basket) swings in on the real builder. Clock pill appears ("sped up"). |
| 5.6-7.4 | **Step 1** "Pick the / basket." Cursor taps *Signature gift box*; the live preview switches to the gift box. "Live preview" sticker on the preview panel. |
| 7.4-9.4 | **Step 2** "Wrap it, / tie a ribbon." Taps *Rose satin*, then the *Wine* ribbon; total goes to Rs 2,800. Split chip *Basket 2.5s*. |
| 9.4-11.4 | **Step 3** "Fill it with / treats." Three "+ Add" taps; capacity meter fills 1, 2, 3 of 8. Split *Wrap 6.0s*. |
| 11.4-13.4 | **Step 4** "Write a note, / we handwrite it." Taps *For*, types "Ammi", taps the *Birthday* idea: the note fills and the preview's "For Ammi" tag updates. Split *Treats 10.9s*. |
| 13.4-15.5 | **Finish.** Review screen; clock stops and turns wine; "Done! 00:15.2 a whole basket" stamp slams in. Headline "Every gift / tells a story." Split *Note 15.2s*. |
| 15.5-17.3 | **Proof 1** One-page checkout (/cart). "Same day / in Karachi." Spotlight on *Today, order before 2 pm*. Pill: *Order before 2 pm*. |
| 17.3-18.4 | **Proof 2** Camera pans to the order summary. "Pay cash, / or by wallet." Spotlight on *Cash on delivery* / *JazzCash or Easypaisa*. Pills: *Cash on delivery*, *JazzCash*, *Easypaisa*. |
| 18.4-19.9 | Tap on the real WhatsApp bubble; the chat widget opens ("We deliver same day across Karachi"). Pill: *Help on WhatsApp*. |
| 19.9-20.5 | Window drops away; colour field irises in. |
| 20.5-25.0 | **CTA** (sticker-pile). "LITTLE / SURPRISES" wordmark, the tagline, then stickers slap on: logo mark, *Same day in Karachi*, **littlesurprises.pk**, *Make every gift personal*, *Ready-made hampers too*. About 3.2 s still hold at the end. |

## Claims check

| Claim | Source |
|---|---|
| Hook chips: Instagram ideas hard to recreate, not available locally, few customisation options, living away from the people you gift | PROJECT_BRIEF.md section 3 (survey: problems 43/37/39; 53% live in a different city or country) |
| Build a basket: basket, wrap and ribbon, treats, note, review, with a live preview | `src/app/builder/basket-builder.ts` (STEPS, `aside.preview`), captured live |
| "We handwrite it" | Builder note step lead: "We handwrite it on the tag, free." |
| "Done! 00:15.2" | `capture/timing.json`: a scripted run of the real builder at human pace (look 0.8-1.5 s before each click, typing at 5 chars/s) took 15.24 s from the open builder to the Review step. The reel plays it sped up and says so ("sped up" on the clock). **The owner should time it once by hand and confirm.** |
| Same day in Karachi, order before 2 pm | Checkout "Today: Order before 2 pm"; Review step "Same day across Karachi before 2 pm"; brief section 7 |
| Cash on delivery, JazzCash, Easypaisa | Checkout payment options (captured) |
| Help on WhatsApp | WhatsApp bubble and chat widget on every page (captured) |
| Ready-made hampers too | Shop: 20 gift hampers; home hero "Pick a ready-made hamper, or build your own" |
| Tagline, campaign line, CTA | Brief section 2 ("Personalized with Love, Delivered with Care", "Every Gift Tells a Story", "Make Every Gift Personal") |
| littlesurprises.pk | `BRAND` domain **placeholder** in `src/app/core/catalog.ts`. Must be the real, live domain before publishing. |

Left out on purpose: customer reviews and ratings. The brief says the current reviews are generated sample data, so the reel makes no review claim. Add a reviews beat once real reviews exist. Prices shown are the site's current catalogue prices.

## Retiming

All times live in `CUES` in the HTML. Change a cue and everything tied to it moves. The clock's real-time mapping is the `MAP` list in the speedrun script (reel cue to real seconds from `capture/timing.json`).

## Music

**Not chosen yet.** After the owner approves the visuals: per Sizzle `references/music.md`, shortlist 2-3 tracks that are free for commercial use, **not** Content ID registered and not AI-generated, in the pastel-soft mood (bubbly pop, marimba, light claps). The owner picks one and approves the download (file name, source, size). Then:

```sh
python -I D:\workspace-personal\mhfrough_projects\sizzle\skills\sizzle\tools\music_sync.py little-surprises-bgm.mp3 --cue 2.95 --length 25
```

Put the chosen offset in `reel.json` (`music.offset`) so a hit lands on the wine circle burst at 2.95 s.

## Render (not run; waiting for approval)

From `D:\workspace-personal\little-things-gift-baskets\promo\reel` (PowerShell):

```powershell
$env:TEMP = "D:\workspace-personal\little-things-gift-baskets\promo\reel\.cache\tmp"; $env:TMP = $env:TEMP
$env:PLAYWRIGHT = "D:\workspace-personal\little-things-gift-baskets\promo\reel\.cache\pw-chrome"
python D:\workspace-personal\mhfrough_projects\sizzle\skills\sizzle\tools\reel.py stills reel.json 1,3.6,6.5,8.6,10.5,12.3,14.6,16.4,18.9,24.9
python D:\workspace-personal\mhfrough_projects\sizzle\skills\sizzle\tools\reel.py all reel.json
```

`all` writes 750 frames (2160x3840 JPEG) to `.reel-work/little-surprises-reel/frames/`, then `videos/little-surprises-reel.mp4` and a `.webp` poster (from 4.5 s). It needs `little-surprises-bgm.mp3` in this folder; for a silent draft first, set `"music": {"file": null}` in `reel.json`.
