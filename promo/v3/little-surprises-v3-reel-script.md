# Little Surprises reel: v3 (Sizzle 3.0 test)

## Brief

| | |
|---|---|
| Audience | 18-34 in Pakistan, many living in another city or abroad from the people they gift (53% in the research); busy professionals, students, newly married couples |
| Platform and format | Instagram (feed + Reels), TikTok, Facebook, around occasions (Eid, Mother's Day, birthdays) · format chosen per concept |
| Length | 12-18 s (short: social, occasion-timed) |
| The one message | You can build a gift that is truly personal (basket, wrap, ribbon, treats, a handwritten note) and have it delivered, even the same day in Karachi |
| Feeling | Warm, heartfelt, a little surprising |
| Call to action | "Make every gift personal" → littlesurprises.pk |
| Must show | Build a basket (basket → wrap and ribbon → treats → note), the "For you" note tag, same-day delivery in Karachi |
| Claims allowed | Same day in Karachi on orders before 2 pm; build your own basket in five steps; handwritten note; delivery across Pakistan in 2-4 days; wraps: blush tissue, kraft and twine, rose satin, velvet wine; ribbons: rose pink, wine, blush, sage, cream (all from `PROJECT_BRIEF.md` and `src/app/core/catalog.ts`) |
| Avoid | Prices as the hook (the research says emotion beats price); sample reviews (they are generated, not real); competitor names; the old "GIFT WRAP" logo artwork; real people's names |
| Brand | Wine `#7a0f3d`, rose `#d86b8a`, blush `#f7e8ec`, sage `#6e6d4f`, ink `#1f1418`; Inter (text), Cinzel (wordmark); picture mark `public/brand/logo-mark.png`; tagline "Personalized with Love, Delivered with Care"; campaign line "Every Gift Tells a Story"; signature element: the "For you" gift tag |
| Given by the person | None for this reel; the thesis's campaign (big idea "Every Gift Tells a Story", CTA "Make Every Gift Personal", the 60 s film "The Gift She Almost Missed") used as the source |

## Concepts offered

`fingerprint.py fresh` said the two earlier reels for this product were both: 9:16, ~24 s, a text question as the
opening, a centred layout with hard cuts, the site in a device frame, a stamp ending, elastic or stepped motion
(speedrun and quiz concepts). All three concepts below move away from every one of those.

```
A. The Note Comes First (letter, 4:5, 15 s)
   Logline:   A gift built backwards: it starts with the words, and the basket gathers around them.
   Opens on:  Extreme close-up of a cream "For you" tag; a line in ink handwriting writes itself:
              "Ammi, I couldn't be there. So I sent this."
   Middle:    One slow continuous pull-back. A wine ribbon threads through the tag and ties; the tag
              settles onto rose satin wrap; treats drop softly into a kraft basket around it, each with
              a tiny caption in the corner (basket, wrap, ribbon, treats). The note never leaves the frame.
   Ends on:   The finished basket, small in the frame, on blush paper. "Every gift tells a story."
              then the Cinzel wordmark and littlesurprises.pk, set like a letter's signature.
   Signature: The camera only ever moves away from the note: the words are the centre of the gift.
   Sound:     No drums: warm acoustic/ambient bed; organic SFX (paper, a soft snap as the ribbon
              ties, gentle thuds as treats land, a chime on the wordmark).

B. Before 2 PM (chat-thread, 9:16, 18 s)
   Logline:   A sibling group chat realises it's Ammi's birthday at 11:40, and the gift still makes it.
   Opens on:  Mid-action: a message thread already moving, "It's Ammi's birthday TODAY 😭", a phone
              status-bar clock at 11:40 in the corner.
   Middle:    The thread scrolls; one sibling replies with the builder itself (live, full-bleed cards
              sliding into the chat: basket picked, velvet wine wrap, sage ribbon, chocolates and mithai,
              a note typed). The status-bar clock jumps 11:40 → 12:15 → 1:52; "ordered before 2 = same
              day" lands as a system message. 6:10 pm: a photo bubble of the basket at the door; "she cried 🥹".
   Ends on:   The chat fades to blush; "Make every gift personal." littlesurprises.pk typed into a
              message box and sent (the send button press is the last beat).
   Signature: The clock in the status bar racing the 2 pm cut-off.
   Sound:     Lofi bed (calm under the panic, warm at the end); soft/digital SFX: message pops, typing,
              a notification, a whoosh on the photo.

C. Unwrapped (unboxing, 1:1, 14 s)
   Logline:   Top-down, a gift is opened layer by layer, and each layer is one choice you make when you build it.
   Opens on:  Black, a low boom, then a velvet-wine box lid seen from directly above, a giant Cinzel
              "For you" embossed on it.
   Middle:    The lid lifts off frame; a sage ribbon unties itself; rose satin tissue peels back in
              folds; treats are revealed in a kraft basket. Each layer is labelled in huge type cut out
              of the wrap: WRAP · RIBBON · TREATS · NOTE. The camera is locked off; only the layers move.
   Ends on:   The note at the bottom of the box: "Personalized with Love, Delivered with Care."
              Then a logo sting: the picture mark presses into the wine like a wax seal.
   Signature: Unboxing in reverse order of building, one layer per step of the builder.
   Sound:     Cinematic bed (drone, booms on each layer); cinematic SFX: boom, risers into each
              reveal, tissue whooshes, a sub drop under the seal.
```

**Chosen:** A, The Note Comes First.

## Script (approved 2026-10-21)

**Logline:** A gift built backwards: it starts with the words, and the basket gathers around them.
**Format:** 4:5 (1080x1350), 15 s, one continuous pull-back. No voiceover; the note is read on screen.

| Time | On screen | Words | Sound |
|---|---|---|---|
| 0.00-3.20 | Extreme close-up of a cream "For you" tag on blush paper. Ink italic writes itself, line by line, a pen point leading. Hold. | **Ammi, I couldn't be there.** / **So I sent this.** | Ambient pads alone, very soft. |
| 3.20-5.00 | The camera starts to pull back. A wine ribbon threads through the tag's hole and ties into a bow. Corner caption. | *02 · Ribbon: wine* | A soft snap as the bow pulls tight (4.3). |
| 5.00-6.60 | Rose satin tissue unfolds behind the tag in three folds. | *03 · Wrap: rose satin* | A gentle whoosh with the folds. |
| 6.60-8.40 | A kraft weave basket rises into frame around the tissue; its handle arcs over the top. | *04 · Basket: kraft weave* | A soft thud as it settles (7.6). |
| 8.40-10.60 | Treats drop in one by one and settle with a small bounce: chocolates, mithai, a perfume, a little bear. | *05 · Treats* | Four soft thuds, panned with each drop. |
| 10.60-12.20 | The camera keeps pulling back; the basket is small and low in the frame, the note still at its front. A line writes itself above, flush left. | **Every gift tells a story.** | A reverse swell into 10.6, where the music's soft pulse comes in. |
| 12.20-15.00 | Signed like a letter: the Cinzel wordmark, the URL and a small line beneath. Hold for reading. | **Little Surprises** / **littlesurprises.pk** / *Same day in Karachi, before 2 pm* | A chime on the wordmark; the bed rings out. |

The caption numbers start at 02 because the note is step 01: the captions name the builder's choices in the
order the camera finds them (built backwards). The first caption, *01 · The note*, sits under the tag from 0.4 s.

## Claims check

| Claim | Source |
|---|---|
| A handwritten note on a "For you" tag | Builder step "note"; `PROJECT_BRIEF.md` §2 (the tag is the site's signature element) |
| Ribbon: wine | `RIBBONS` in `src/app/core/catalog.ts` |
| Wrap: rose satin | `WRAPS` in `src/app/core/catalog.ts` |
| Basket: kraft weave | Basket sizes, `PROJECT_BRIEF.md` §7 |
| Treats: chocolates, mithai, perfume, a toy | "Treats allowed in a custom basket", `PROJECT_BRIEF.md` §7 |
| Same day in Karachi, before 2 pm | Business rules, `PROJECT_BRIEF.md` §7 |
| "Every gift tells a story." | The thesis campaign's big idea, `PROJECT_BRIEF.md` §2 |
