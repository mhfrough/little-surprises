import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { BRAND } from '../core/catalog';
import { I } from '../shared/icons';
import { WhatsappIcon } from '../shared/whatsapp-icon';

/**
 * WhatsApp chat bubble, ported from the Bloomstone site: appears after 3s,
 * opens a small chat card, and sends the typed message to wa.me.
 */
@Component({
  selector: 'app-whatsapp-bubble',
  imports: [LucideAngularModule, WhatsappIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      @if (open()) {
        <div class="wa-widget" role="dialog" aria-label="WhatsApp chat">
          <div class="wa-widget-header">
            <div class="wa-header-info">
              <div class="wa-avatar"><img src="brand/mark.webp" alt="" width="34" height="34" /></div>
              <div>
                <div class="wa-name">{{ brand.name }}</div>
                <div class="wa-status">Typically replies within minutes</div>
              </div>
            </div>
            <button type="button" class="wa-close-btn" (click)="close()" aria-label="Close chat">
              <lucide-icon [img]="I.X" [size]="18" [strokeWidth]="2" />
            </button>
          </div>

          <div class="wa-widget-body">
            @for (m of greetings; track $index; let first = $first) {
              <div class="wa-bubble-msg" [class.is-first]="first">
                <p>{{ m }}</p>
                <span class="wa-time">{{ time }}</span>
              </div>
            }
          </div>

          <div class="wa-widget-footer">
            <label class="visually-hidden" for="wa-input">Message</label>
            <input id="wa-input" type="text" class="wa-input" placeholder="Type a message…" maxlength="500"
              [value]="message()" (input)="message.set($any($event.target).value)" (keydown)="onKeydown($event)" />
            <button type="button" class="wa-send-btn" (click)="send()" aria-label="Send on WhatsApp">
              <lucide-icon [img]="I.Send" [size]="16" [strokeWidth]="2.2" />
            </button>
          </div>
        </div>
      }

      <button type="button" class="wa-bubble" (click)="toggle()" [attr.aria-label]="open() ? 'Close WhatsApp chat' : seen() ? 'Chat on WhatsApp' : 'Chat on WhatsApp, 3 new messages'"
        [attr.aria-expanded]="open()">
        @if (open()) {
          <lucide-icon [img]="I.X" [size]="24" [strokeWidth]="2.2" />
        } @else {
          <app-whatsapp-icon [size]="28" />
          @if (!seen()) {
            <span class="wa-unread" aria-hidden="true">{{ greetings.length }}</span>
          }
        }
      </button>
    }
  `,
  styles: `
    .wa-bubble {
      position: fixed; bottom: 24px; right: 24px; z-index: 70;
      width: 56px; height: 56px; border-radius: 50%;
      display: grid; place-items: center; background: #25d366; color: #fff;
      box-shadow: 0 4px 20px rgb(37 211 102 / 0.45);
      transition: transform var(--dur-fast) var(--ease-spring), background-color var(--dur-fast);
      animation: wa-pop var(--dur-slow) var(--ease-spring);
    }
    .wa-bubble:hover { transform: scale(1.08); background: #1ebe5e; }
    .wa-unread {
      position: absolute; top: -2px; right: -2px; min-width: 20px; height: 20px; padding: 0 5px; border-radius: 10px;
      background: #e53935; color: #fff; font-size: 0.75rem; font-weight: 700; line-height: 20px; text-align: center;
      box-shadow: 0 0 0 2px #fff;
    }
    @keyframes wa-pop { from { opacity: 0; transform: scale(0.4); } }

    .wa-widget {
      position: fixed; bottom: 90px; right: 24px; z-index: 69; width: 320px;
      background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 40px rgb(0 0 0 / 0.18);
      animation: wa-slide-up 0.25s ease;
    }
    @media (max-width: 400px) { .wa-widget { width: calc(100dvw - 24px); right: 12px; } }
    @keyframes wa-slide-up { from { opacity: 0; transform: translateY(14px) scale(0.97); } }

    .wa-widget-header { background: #075e54; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; }
    .wa-header-info { display: flex; align-items: center; gap: 12px; }
    .wa-avatar { width: 42px; height: 42px; border-radius: 50%; background: #fff; display: grid; place-items: center; flex: none; }
    .wa-name { color: #fff; font-size: 0.9375rem; font-weight: 600; line-height: 1.3; }
    .wa-status { color: rgb(255 255 255 / 0.75); font-size: 0.75rem; margin-top: 1px; }
    .wa-close-btn { color: rgb(255 255 255 / 0.8); padding: 6px; border-radius: 50%; display: grid; }
    .wa-close-btn:hover { color: #fff; background: rgb(255 255 255 / 0.1); }

    .wa-widget-body { padding: 16px; background: #e5ddd5; min-height: 120px; display: grid; gap: 6px; justify-items: start; align-content: start; }
    .wa-bubble-msg {
      position: relative; background: #fff; border-radius: 10px; padding: 8px 12px 18px; max-width: 88%;
      box-shadow: 0 1px 2px rgb(0 0 0 / 0.12); animation: wa-in 0.25s ease both;
    }
    .wa-bubble-msg.is-first { border-top-left-radius: 0; }
    .wa-bubble-msg p { margin: 0; font-size: 0.875rem; color: #303030; line-height: 1.5; padding-right: 34px; }
    .wa-time { position: absolute; right: 10px; bottom: 4px; font-size: 0.6875rem; color: #8a8a8a; }
    @keyframes wa-in { from { opacity: 0; transform: translateY(6px) scale(0.98); } }


    .wa-widget-footer { padding: 10px 12px; background: #f0f0f0; display: flex; align-items: center; gap: 8px; }
    .wa-input { flex: 1; min-width: 0; border: 0; border-radius: 20px; padding: 9px 16px; font-size: 0.9375rem; background: #fff; color: #333; outline: none; }
    .wa-input::placeholder { color: #999; }
    .wa-input:focus-visible { box-shadow: 0 0 0 2px #25d366; }
    .wa-send-btn { width: 38px; height: 38px; flex: none; border-radius: 50%; display: grid; place-items: center; background: #25d366; color: #fff; }
    .wa-send-btn:hover { background: #1ebe5e; }
  `,
})
export class WhatsappBubble implements OnInit, OnDestroy {
  protected readonly I = I;
  protected readonly brand = BRAND;
  protected readonly visible = signal(false);
  protected readonly open = signal(false);
  protected readonly message = signal('');
  private showTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.showTimer = setTimeout(() => this.visible.set(true), 3000);
  }

  ngOnDestroy(): void {
    clearTimeout(this.showTimer);
  }

  toggle(): void {
    this.open.update((o) => !o);
    if (this.open()) {
      this.seen.set(true);
      try {
        localStorage.setItem('gw-wa-seen', '1');
      } catch {
        /* storage blocked — the badge returns next visit */
      }
    } else {
      this.message.set('');
    }
  }

  close(): void {
    this.open.set(false);
    this.message.set('');
  }

  /** The shop's opening messages; they arrive one after another, like a real chat. */
  protected readonly greetings = [
    'Assalam o Alaikum! 👋 Welcome to Little Surprises.',
    'Looking for something special? We deliver same day across Karachi 🎁',
    'Tell us the occasion and your budget, and we’ll suggest the perfect basket.',
  ];
  /** remembered, so the unread count only shows until the chat is first opened */
  protected readonly seen = signal(readSeen());
  protected readonly time = new Date().toLocaleTimeString('en-PK', { hour: 'numeric', minute: '2-digit' });

  send(): void {
    const text = this.message().trim() || 'Hello, I need help choosing a gift';
    window.open(`https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    this.close();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
    if (event.key === 'Escape') this.close();
  }
}

function readSeen(): boolean {
  try {
    return localStorage.getItem('gw-wa-seen') === '1';
  } catch {
    return false;
  }
}
