# Project brief — Little Surprises

> One file with everything an AI assistant (or a new teammate) needs to understand
> this project: the business, the research it rests on, what is built, and what
> comes next. Source of the business model: Shazra Akbar's MMS thesis,
> *"Advertising Strategy for Little Surprises"* (Iqra University Karachi, Dept. of
> Media Sciences, supervisor Dr. Sobia Usman, Spring 2026).
> Last updated: 2026-10-21.

---

## 1. The idea in one paragraph

An online **personalised gifting** shop for Pakistan, Karachi first. Customers can
(a) buy ready-made gifts and hampers for any occasion, or (b) **build their own
basket**: choose the basket, the wrapping, the ribbon, the treats inside and a
**handwritten note**, then have it delivered (same day in Karachi). It solves the
problems people described in the research: no time, products not available
locally, ideas seen on Instagram/Pinterest that are hard to recreate, and few
customisation options in existing Pakistani gift shops.

- **Founder / original idea:** Shazra Akbar
- **Built by:** Hamza (credited in the footer as "Built by ء Hamza")

## 2. Name and identity

| | Thesis | Website today |
| --- | --- | --- |
| Brand name | **Little Surprises** | **Little Surprises** (renamed from "Gift Wrap", 2026-10-21) |
| Product name | "Gift Wrap Web App" / "Gift Organization Web Application" | — |
| Tagline | **"Personalized with Love, Delivered with Care"** | Same; header shows "Personalized with love" |
| Campaign | **"Every Gift, A Beautiful Surprise"** · big idea **"Every Gift Tells a Story"** · CTA **"Make Every Gift Personal"** | — |

**Decided (2026-10-21): the public brand is Little Surprises.** The brand name,
tagline, contact details and domain placeholder (`littlesurprises.pk`) live in
`BRAND` in `src/app/core/catalog.ts`; the wordmark is in
`src/app/shared/brand-mark.ts` and the footer. The logo artwork
(`public/brand/logo-full.jpeg`, `logo.webp`) still has the old "GIFT WRAP" text and
isn't used on the site; only the picture mark (no text) is shown.

**Logo** (`public/brand/logo-full.jpeg`, mark at `public/brand/mark.webp`): a hand
cradling a gift box, a heart-shaped ribbon on top, a sage leaf, and a "For You" tag.
Meaning: thoughtful giving and human connection; the tag became the site's
signature element (the customer's note is shown on a "For you" tag).

**Colours** (from the thesis palette): rose / dusty pink (love, romance), deep plum
(luxury, grounding), sage green (natural, authentic), on clean soft white.
Site tokens: wine `#7a0f3d`, rose `#d86b8a`, blush `#f7e8ec`, sage `#6e6d4f`.

**Voice:** warm, caring, trusting, encouraging; simple, friendly English
(Roman Urdu welcome in casual copy). Mood: joyful, heartfelt.

## 3. Research findings that shape the product

Mixed methods: survey (~163–166 respondents, Google Forms) + 4 expert interviews
(e-commerce, branding, logistics, customer trust).

**Who:** mostly 18–34 (25–34 the largest group), also 45+; balanced gender.
53% live in a different city/country from the people they gift (87 of 166).

**Problems with gifting today** (most cited first):
1. Limited time (47)
2. Hard to recreate ideas found online (43)
3. Lack of customisation options (39)
4. Products not available locally (37)

**What they value most in a gifting app:**
1. Choice of wrapping styles and colours (47)
2. **Sourcing items from other website links** (43)
3. Handwritten-style cards (42)
4. Same-day / scheduled delivery (33)

**What builds trust:**
1. **Customer reviews** (51)
2. Final product matching the digital preview (47)
3. Secure payment (38)
4. Timely delivery (30)

**Most important overall:** timely delivery (49) = product quality (49) >
customisation accuracy (41) > ease of use (27).

**Other signals:**
- Emotion over price: more people rate emotional connection above price (42 + 27) than price above emotion (35 + 24).
- 60% would pay a premium for a service that handles sourcing and logistics (99 vs 67).
- 76% would be more likely to send gifts if one app handled customisation and delivery (64 much more, 62 somewhat more).
- Likely to use the app: 66 somewhat likely, 57 neutral, 43 unlikely.

**Competitors in Pakistan** (all mostly catalogue-based, little personalisation):
Toobas.pk, Giftlee.pk, Shop Carlo, Build Dream Gift (~Rs 399–2,299+), Gift Tree
(Rs 1,500–20,000+). → The gap: interactive customisation + emotional storytelling.

**Frameworks used:** AIDA, Maslow (belonging/esteem), consumer decision-making
process, brand personality (warm, creative, trustworthy). Conceptual model:
convenience, personalisation, product variety, emotional appeal → (service
quality, brand trust) → adoption.

## 4. Target market

Young adults 18–34; students; working professionals; newly married couples;
parents; people living away from family (in other cities or abroad); social-media
active shoppers; corporate buyers (client and staff gifts).
Occasions: birthdays, anniversaries, weddings, graduations, new baby, Eid,
Mother's Day, Father's Day, Valentine's Day, thank-you, get well.
Geography: Karachi first; then Lahore, Islamabad, Rawalpindi, Faisalabad,
Hyderabad, Multan; nationwide by courier.

## 5. Marketing plan (from the thesis)

- **Positioning:** "the one-stop, complete personalised gifting solution in Pakistan", not just an online gift shop.
- **Four value propositions:**
  1. Personalised gifting made simple
  2. One platform for the whole gift
  3. Thoughtful presents for emotional connection
  4. Reliable, quality delivery
- **ATL:** Instagram, Facebook, TikTok, Google Search/Display, influencers, Karachi billboard, mall standees (Lucky One, Dolmen), timed around occasions.
- **BTL:** basket customiser plus **WhatsApp consultation** (share inspiration images, get recommendations); sample baskets at universities and malls with QR codes to the site; corporate sampling; event stalls.
- **Budget (PKR, ~3 months): 1,250,000 total.**

| Channel | PKR |
| --- | --- |
| Instagram | 150k |
| Facebook | 100k |
| TikTok | 75k |
| Google Search | 125k |
| Micro-influencers ×10 | 100k |
| Lifestyle influencers ×3 | 150k |
| PR gift boxes ×20 | 50k |
| Billboard | 200k |
| Mall standees | 75k |
| University activation | 50k |
| Corporate sampling | 75k |
| Event stall | 100k |

- **60s film script "The Gift She Almost Missed":** busy Sara forgets her mum's birthday, a colleague opens the site ("Don't just buy a gift… create one"), she builds a basket with a handwritten note, Mum receives it. End line: "The best gifts aren't measured by their price… they're remembered by the love behind them."

## 6. Scope — what the website does

### Built (frontend, Angular 21)

**Shopping**
- **Home:** full-screen hero slider, shop by occasion and category, favourites, "two ways to give", ready-made hampers, corporate, reviews, Instagram + TikTok.
- **Shop:** all gifts, category and occasion pages; search, price bands, brand chips, sort, load more.
- **Product page:** gallery with thumbnails and a full-screen lightbox; delivery check for the chosen city; add to bag; order on WhatsApp; related gifts.
- **Product reviews:** star rating, filter by stars, sort, 5 per page, write a review.

**Build a basket:** five steps (basket → wrap and ribbon → treats → note → review), with a live preview and running total, capacity limits, three "start from an idea" presets, and suggested notes.

**Checkout**
- One-page checkout with a sticky order summary.
- Same day in Karachi before 2 pm; delivery slots.
- Payment: cash on delivery, JazzCash/Easypaisa, card (by link), bank transfer/Raast.
- No backend yet, so placing the order sends it to the shop on WhatsApp.

**Other pages**
- **Customer reviews** (`/reviews`): all feedback; filter by stars, category, text, verified; sort; 12 per page; most loved gifts; feedback form.
- **Contact:** open/closed status, WhatsApp first, topics that pre-fill the message, quick answers, Karachi delivery map.
- **Policies:** delivery, refunds, privacy, terms, FAQ.
- **Sitemap:** HTML page and XML.
- **404** page.
- **Design system** (`/design`): every token and component.

**Site-wide**
- **Search:** header search panel with suggestions, typo tolerance, keyboard use and recent searches.
- **City picker:** "Deliver to Karachi"; it filters products and changes delivery messages.
- **WhatsApp chat bubble** (ported from Bloomstone) and a cookie notice.
- **Look and feel:** light and dark mode, branded scrollbars, broken-image placeholder, long-text truncation.
- **SEO:** titles, canonical links, Product + AggregateRating structured data.

### Planned next

**Backend:** NestJS + PostgreSQL, lightweight. Wire categories, products, reviews, policies and orders.
- The JSON files in `public/data/` are already shaped like the tables, so they can be used as seed data.
- Only `CatalogService`, `ReviewsService` and `PoliciesService` should need to change.

**Real checkout:** order records; payment links (JazzCash/Easypaisa/card); order tracking.

**Features the research asks for that aren't built yet**
- **"Source it for me":** paste a link or upload a screenshot (Instagram/Pinterest) and we recreate it. This was the #2 most valued feature.
- **Occasion reminders** (birthdays, anniversaries) by WhatsApp or email.
- **Scheduled delivery** further ahead.
- **Upload an inspiration image** in the builder.

**Admin:** manage products, approve reviews, see orders.

**Before launch**
- Real reviews (the current ones are generated sample data).
- Real phone, WhatsApp, email and social handles.
- Domain.
- Permission or own photos for products taken from Belco/Giftwifts.

## 7. Business rules (current)

- **Currency:** PKR, written "Rs 2,900". Karachi is the default city.
- **Delivery**
  - Karachi: Rs 250. Other cities: Rs 450. Free from Rs 10,000.
  - Same day in Karachi on orders before 2 pm; elsewhere 2–4 days.
  - Slots: 10–2, 2–6, 6–10.
- **Basket sizes**
  - Kraft weave: Rs 1,500, up to 6 treats.
  - Gift box: Rs 2,200, up to 8 treats.
  - Keepsake hamper: Rs 3,500, up to 12 treats.
- **Wraps:** blush tissue free; kraft Rs 400; rose satin Rs 600; velvet wine Rs 900.
- **Treats allowed in a custom basket:** chocolates, mithai, perfumes, toys.
- **Catalogue:** 223 products in 7 categories (hampers 20, chocolates 90, cakes 55, flowers 14, mithai 20, perfumes 12, toys 12), imported from Belco Chocolates and Giftwifts (Leopards Courier) by `npm run import:catalog`.

## 8. Tech map

| What | Where |
| --- | --- |
| App | Angular 21 standalone, signals, zoneless — `src/app` |
| Pages | `src/app/pages/*` (home, shop, product, builder, cart, contact, policy, reviews, sitemap, design, not-found) |
| Page sections | `src/app/sections/*` |
| Shared UI | `src/app/shared/*` (cards, reviews, lightbox, pagination, rating, gift tag) |
| Data services | `src/app/core/*` (catalog, reviews, policies, search, stores = bag + builder, SEO) |
| Design tokens | `src/styles/_tokens.scss` (colours, type, spacing, motion; light + dark) |
| Data | `public/data/catalog.json`, `reviews.json` (sample), `policies.json` |
| Scripts | `scripts/import-catalog.mjs`, `build-reviews.mjs`, `build-sitemap.mjs` |
| Tests | Playwright, `e2e/` (`npm run e2e`) |
| Run | `npm start` (or `node node_modules/@angular/cli/bin/ng.js serve --port 4300`) |

**Design rules followed:**
- **Apple HIG:** 44px touch targets, 17px body text, light and dark mode, accessible contrast.
- **"Taste" anti-template rules:** no gradients or eyebrows, tone steps instead of borders, headlines at most two lines, one accent colour.
- **Signature element:** the "For you" gift tag.
