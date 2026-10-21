import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { BRAND, PIC, img } from '../../core/catalog';
import { InboxService } from '../../core/inbox.service';
import { PoliciesService } from '../../core/policies.service';
import { SeoService } from '../../core/seo.service';
import { waLink } from '../../core/whatsapp';
import { Breadcrumbs } from '../../shared/breadcrumbs';
import { I } from '../../shared/icons';
import { TiktokIcon } from '../../shared/tiktok-icon';
import { WhatsappIcon } from '../../shared/whatsapp-icon';

const AREAS = [
  'Clifton', 'DHA', 'PECHS', 'Bahadurabad', 'Gulshan-e-Iqbal', 'Gulistan-e-Jauhar', 'North Nazimabad', 'Federal B Area',
  'Saddar', 'Tariq Road', 'Defence View', 'Malir', 'Scheme 33', 'Bahria Town', 'Korangi', 'Nazimabad',
];

const OPEN_HOUR = 10;
const CLOSE_HOUR = 22;

const TOPICS = [
  { id: 'order', label: 'An order I placed', icon: 'Package', text: 'Hi! I have a question about my order. Order name / phone: ' },
  { id: 'choose', label: 'Help choosing a gift', icon: 'Gift', text: 'Hi! Can you help me choose a gift? Occasion: , budget: Rs ' },
  { id: 'corporate', label: 'Corporate or bulk order', icon: 'Wallet', text: 'Hi! I\'d like a quote for a corporate / bulk order. Quantity: , budget per gift: Rs ' },
  { id: 'custom', label: 'A custom basket', icon: 'PenLine', text: 'Hi! I\'d like a custom basket with: ' },
  { id: 'complaint', label: 'Report a problem', icon: 'CircleAlert', text: 'Hi, something went wrong with my order. Order name / phone: ' },
  { id: 'feedback', label: 'Suggestion or feedback', icon: 'MessagesSquare', text: 'A suggestion for Little Surprises: ' },
] as const;

/**
 * Contact, built around how people here actually reach a shop: WhatsApp
 * first, a phone number that answers, honest hours and reply times, and the
 * common questions answered before anyone has to ask.
 */
@Component({
  selector: 'app-contact-page',
  imports: [RouterLink, LucideAngularModule, Breadcrumbs, WhatsappIcon, TiktokIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="main">
      <section class="hero">
        <img class="hero-img" [src]="heroImg" alt="" />
        <div class="container hero-inner">
          <app-breadcrumbs [items]="[{ label: 'Contact' }]" />
          <h1 class="t-display">Talk to a real person</h1>
          <p class="lead">Help choosing, a custom basket, or a question about a delivery. Our Karachi team answers every message.</p>
          <p class="status" [class.is-open]="isOpen()">
            <span class="dot" aria-hidden="true"></span>
            {{ isOpen() ? 'Open now · usually replies in under 10 minutes' : 'Closed now · we reply from ' + openLabel + ' tomorrow' }}
          </p>
          <div class="cta">
            <a class="btn btn-lg wa" [href]="wa('👋 Hi! I need help choosing a *gift* 🎁')" target="_blank" rel="noopener">
              <app-whatsapp-icon [size]="22" /> Chat on WhatsApp
            </a>
            <a class="btn btn-lg btn-on-dark" [href]="'tel:+' + brand.whatsapp">
              <lucide-icon [img]="I.Phone" [size]="20" [strokeWidth]="2" /> Call {{ brand.phone }}
            </a>
          </div>
        </div>
      </section>

      <div class="container body">
        <!-- channels -->
        <section aria-labelledby="ways-title" class="ways-sec">
          <h2 id="ways-title" class="visually-hidden">Ways to reach us</h2>
          <ul class="ways" role="list">
            <li>
              <a class="way" [href]="wa('👋 Hi!')" target="_blank" rel="noopener">
                <span class="w-icon wa-ic"><app-whatsapp-icon [size]="24" /></span>
                <strong>WhatsApp</strong><span>{{ brand.phone }}</span><em>Fastest · replies in minutes</em>
              </a>
            </li>
            <li>
              <a class="way" [href]="'tel:+' + brand.whatsapp">
                <span class="w-icon"><lucide-icon [img]="I.Phone" [size]="22" [strokeWidth]="1.8" /></span>
                <strong>Phone</strong><span>{{ brand.phone }}</span><em>{{ openLabel }} – {{ closeLabel }}, every day</em>
              </a>
            </li>
            <li>
              <a class="way" [href]="'mailto:' + brand.email">
                <span class="w-icon"><lucide-icon [img]="I.Mail" [size]="22" [strokeWidth]="1.8" /></span>
                <strong>Email</strong><span>{{ brand.email }}</span><em>Replies within 4 hours</em>
              </a>
            </li>
            <li>
              <div class="way">
                <span class="w-icon"><lucide-icon [img]="I.MapPin" [size]="22" [strokeWidth]="1.8" /></span>
                <strong>Studio</strong><span>{{ brand.address }}</span><em>Pickup by appointment</em>
              </div>
            </li>
          </ul>
        </section>

        <!-- topics + form -->
        <section class="help" aria-labelledby="help-title">
          <div class="help-copy">
            <h2 id="help-title" class="t-title">What can we help with?</h2>
            <p class="t-muted">Pick one and we'll start the message for you, or write your own.</p>
            <div class="topics" role="radiogroup" aria-label="Topic">
              @for (t of topics; track t.id) {
                <label class="topic">
                  <input type="radio" name="topic-pick" [value]="t.id" [checked]="topic() === t.id" (change)="pickTopic(t.id)" />
                  <lucide-icon [img]="I[t.icon]" [size]="20" [strokeWidth]="1.8" />
                  <span>{{ t.label }}</span>
                </label>
              }
            </div>
            <ul class="shortcuts" role="list">
              <li><a routerLink="/policies/delivery"><lucide-icon [img]="I.Truck" [size]="18" [strokeWidth]="1.8" /> Delivery times and areas</a></li>
              <li><a routerLink="/policies/refunds"><lucide-icon [img]="I.RotateCcw" [size]="18" [strokeWidth]="1.8" /> Something arrived damaged</a></li>
              <li><a routerLink="/build-a-basket"><lucide-icon [img]="I.Gift" [size]="18" [strokeWidth]="1.8" /> Build a basket yourself</a></li>
            </ul>
          </div>

          <form class="form" (submit)="send($event)" novalidate>
            @if (sent()) {
              <p class="notice is-positive" role="status"><lucide-icon [img]="I.CircleCheck" [size]="18" [strokeWidth]="2" />
                {{ sent() === 'inbox' ? 'Message sent. We’ll reply on the number or email you gave.' : 'Your message is ready in WhatsApp. Send it there and we’ll reply soon.' }}</p>
            }
            <div class="two">
              <div class="field"><label for="m-name">Your name</label><input id="m-name" name="name" class="input" required autocomplete="name" /></div>
              <div class="field"><label for="m-phone">Mobile or email</label><input id="m-phone" name="contact" class="input" required autocomplete="tel" placeholder="0300 1234567" /></div>
            </div>
            <div class="field">
              <label for="m-msg">Message</label>
              <textarea id="m-msg" name="message" class="textarea" rows="5" required [value]="draft()" (input)="draft.set($any($event.target).value)"></textarea>
              <span class="field-hint">For an order, include the name or phone number it was placed with.</span>
            </div>
            <div class="row">
              <button class="btn btn-primary btn-lg" value="whatsapp"><app-whatsapp-icon [size]="18" /> Send on WhatsApp</button>
              <button class="btn btn-secondary btn-lg" value="inbox"><lucide-icon [img]="I.Send" [size]="18" [strokeWidth]="2" /> Send</button>
            </div>
          </form>
        </section>

        <!-- quick answers -->
        <section class="faq" aria-labelledby="faq-title">
          <h2 id="faq-title" class="t-title">Quick answers</h2>
          <div class="faq-list">
            @for (q of faqs(); track q.heading) {
              <details>
                <summary>{{ q.heading }}</summary>
                @for (p of q.body; track $index) { <p>{{ p }}</p> }
              </details>
            }
          </div>
        </section>

        <!-- coverage -->
        <section class="areas" aria-labelledby="areas-title">
          <div class="areas-copy">
            <h2 id="areas-title" class="t-title">Same day, all over Karachi</h2>
            <p>Order before 2 pm and it arrives today. Other cities in 2–4 days.</p>
            <ul role="list" class="area-list">
              @for (a of areas; track a) { <li>{{ a }}</li> }
            </ul>
            <div class="social">
              <a [href]="brand.instagram.url" target="_blank" rel="noopener" class="btn btn-secondary">
                <lucide-icon [img]="I.Instagram" [size]="18" [strokeWidth]="2" /> {{ brand.instagram.handle }}
              </a>
              <a [href]="brand.tiktok.url" target="_blank" rel="noopener" class="btn btn-secondary">
                <app-tiktok-icon [size]="18" /> {{ brand.tiktok.handle }}
              </a>
            </div>
          </div>
          <iframe class="map" title="Map of Karachi, our delivery area" loading="lazy" referrerpolicy="no-referrer"
            src="https://www.openstreetmap.org/export/embed.html?bbox=66.90%2C24.78%2C67.25%2C25.02&amp;layer=mapnik"></iframe>
        </section>
      </div>
    </main>
  `,
  styles: `
    /* hero */
    .hero { position: relative; color: #fff; background: var(--field-deep); overflow: hidden; }
    .hero-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.32; }
    .hero::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, rgb(28 8 17 / 0.9), rgb(28 8 17 / 0.45)); }
    .hero-inner { position: relative; z-index: 1; display: grid; gap: 20px; justify-items: start; padding-block: 40px clamp(56px, 8vw, 104px); }
    app-breadcrumbs ::ng-deep ol, app-breadcrumbs ::ng-deep a, app-breadcrumbs ::ng-deep span { color: rgb(255 255 255 / 0.8) !important; }
    .hero h1 { max-width: 12ch; }
    .lead { font-size: clamp(1.0625rem, 0.95rem + 0.5vw, 1.375rem); max-width: 34em; opacity: 0.9; }
    .status { color: #fff; display: inline-flex; align-items: center; gap: 10px; padding: 8px 14px; border-radius: var(--radius-pill); background: rgb(255 255 255 / 0.1); font-size: var(--text-small); font-weight: 560; }
    .dot { width: 9px; height: 9px; border-radius: 50%; background: #c2b0b8; }
    .status.is-open .dot { background: #4ade80; box-shadow: 0 0 0 4px rgb(74 222 128 / 0.25); }
    .cta { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 4px; }
    .wa { background: #25d366; color: #fff; }
    .wa:hover { background: #1ebe5e; }

    .body { display: grid; gap: clamp(64px, 8vw, 112px); padding-top: 0; }

    /* channels — overlap the hero */
    .ways-sec { margin-top: -44px; position: relative; z-index: 2; }
    .ways { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
    .way {
      display: grid; gap: 2px; height: 100%; padding: 22px; border-radius: var(--radius); background: var(--ground);
      box-shadow: 0 10px 30px rgb(42 10 24 / 0.08); transition: transform var(--dur) var(--ease-out);
    }
    a.way:hover { transform: translateY(-3px); }
    .w-icon { width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; background: var(--field); color: var(--accent); margin-bottom: 10px; }
    .wa-ic { background: #e8f8ee; color: #128c4b; }
    .way strong { font-size: var(--text-body); font-weight: 650; }
    .way span { font-size: var(--text-small); color: var(--ink); overflow-wrap: anywhere; }
    .way em { font-style: normal; font-size: 0.8125rem; color: var(--ink-3); }

    /* topics + form */
    .help { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr); gap: clamp(28px, 5vw, 72px); align-items: start; }
    .help-copy { display: grid; gap: 16px; }
    .topics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 4px; }
    .topic {
      position: relative; display: grid; gap: 8px; padding: 16px; border-radius: var(--radius); background: var(--surface); cursor: pointer;
      box-shadow: inset 0 0 0 2px transparent; transition: box-shadow var(--dur) var(--ease-out), background-color var(--dur);
      font-weight: 600; font-size: 0.9375rem; line-height: 1.3;
    }
    .topic input { position: absolute; opacity: 0; }
    .topic lucide-icon { color: var(--accent); }
    .topic:hover { background: var(--surface-2); }
    .topic:has(input:checked) { box-shadow: inset 0 0 0 2px var(--accent); background: var(--ground); }
    .topic:has(input:focus-visible) { outline: 3px solid var(--focus); outline-offset: 2px; }
    .shortcuts { display: grid; gap: 4px; margin-top: 8px; }
    .shortcuts a { display: flex; align-items: center; gap: 10px; padding: 10px 0; color: var(--ink-2); font-size: 0.9375rem; }
    .shortcuts a:hover { color: var(--accent); }
    .shortcuts lucide-icon { color: var(--accent); }
    .form { display: grid; gap: 16px; padding: clamp(22px, 3vw, 36px); border-radius: var(--radius-lg); background: var(--surface); }
    .form .input, .form .textarea { background: var(--ground); }
    .input:user-invalid, .textarea:user-invalid { border-color: var(--negative); }
    .two { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .row { display: flex; flex-wrap: wrap; gap: 10px; }

    /* faq */
    .faq { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); gap: clamp(24px, 5vw, 72px); align-items: start; }
    .faq-list { display: grid; gap: 8px; }
    details { border-radius: var(--radius); background: var(--surface); padding: 2px 20px; }
    summary { cursor: pointer; font-weight: 600; padding: 16px 0; }
    details p { padding-bottom: 14px; color: var(--ink-2); }

    /* areas */
    .areas {
      display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); gap: clamp(24px, 4vw, 56px); align-items: stretch;
      padding: clamp(24px, 4vw, 48px); border-radius: var(--radius-lg); background: var(--field); color: var(--field-ink);
    }
    .areas-copy { display: grid; gap: 14px; align-content: start; }
    .area-list { display: flex; flex-wrap: wrap; gap: 6px; }
    .area-list li { padding: 6px 12px; border-radius: var(--radius-pill); background: var(--ground); color: var(--ink); font-size: var(--text-small); }
    .social { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 8px; }
    .map { width: 100%; min-height: 340px; border: 0; border-radius: var(--radius); background: var(--surface-2); }

    @media (max-width: 1000px) {
      .ways { grid-template-columns: 1fr 1fr; }
      .help, .faq, .areas { grid-template-columns: 1fr; }
    }
    @media (max-width: 520px) {
      .ways, .topics, .two { grid-template-columns: 1fr; }
    }
  `,
})
export class ContactPage implements OnDestroy {
  protected readonly I = I;
  protected readonly brand = BRAND;
  protected readonly areas = AREAS;
  protected readonly topics = TOPICS;
  protected readonly heroImg = img(PIC.giftKraft, 1600);
  protected readonly openLabel = '10 am';
  protected readonly closeLabel = '10 pm';
  private readonly policies = inject(PoliciesService);
  private readonly inbox = inject(InboxService);

  protected readonly topic = signal<string>('choose');
  protected readonly draft = signal<string>(TOPICS[1].text);
  protected readonly sent = signal('');

  /** Karachi time (UTC+5), so the status is right wherever the visitor is. */
  private readonly now = signal(Date.now());
  private readonly clock = setInterval(() => this.now.set(Date.now()), 60_000);
  protected readonly isOpen = computed(() => {
    const h = new Date(this.now() + 5 * 3600_000).getUTCHours();
    return h >= OPEN_HOUR && h < CLOSE_HOUR;
  });

  protected readonly faqs = computed(() => {
    const faq = this.policies.bySlug('faq')?.sections ?? [];
    const delivery = this.policies.bySlug('delivery')?.sections.slice(0, 2) ?? [];
    return [...delivery.map((s) => ({ ...s, heading: s.heading === 'Karachi' ? 'How fast is delivery in Karachi?' : 'Do you deliver outside Karachi?' })), ...faq];
  });

  constructor() {
    inject(SeoService).set({
      title: 'Contact',
      description: `WhatsApp, call or email ${BRAND.name}, ${OPEN_HOUR} am – 10 pm every day. Same-day gift delivery across Karachi.`,
      path: '/contact',
      pageType: 'ContactPage',
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.clock);
  }

  wa(text: string): string {
    return waLink(text);
  }

  pickTopic(id: string): void {
    const prev = TOPICS.find((t) => t.id === this.topic());
    const next = TOPICS.find((t) => t.id === id)!;
    this.topic.set(id);
    // only replace the draft if the visitor hasn't written their own yet
    if (!this.draft().trim() || this.draft() === prev?.text) this.draft.set(next.text);
  }

  send(e: SubmitEvent): void {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    if (!form.reportValidity()) return;
    const f = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const topic = TOPICS.find((t) => t.id === this.topic())?.label ?? 'Message';
    const body = `${f['message']}\n\n— ${f['name']} (${f['contact']})`;
    const via = (e.submitter as HTMLButtonElement | null)?.value === 'inbox' ? 'inbox' : 'whatsapp';
    // every message lands in the portal inbox; "Send" stops there, WhatsApp also opens the chat
    const id = this.topic();
    this.inbox.add({
      type: id === 'complaint' ? 'complaint' : id === 'feedback' ? 'feedback' : 'contact',
      name: f['name'],
      contact: f['contact'],
      subject: topic,
      body: f['message'],
    });
    if (via === 'whatsapp') window.open(this.wa(`${topic}\n\n${body}`), '_blank', 'noopener,noreferrer');
    else {
      form.reset();
      this.draft.set('');
    }
    this.sent.set(via);
  }
}
