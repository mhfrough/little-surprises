import { Injectable, computed, signal } from '@angular/core';

export type MessageType = 'contact' | 'complaint' | 'feedback' | 'survey';
export type MessageStatus = 'new' | 'read' | 'resolved' | 'archived';

export interface InboxMessage {
  id: string;
  type: MessageType;
  name: string;
  /** phone or email the customer gave */
  contact: string;
  subject: string;
  body: string;
  /** survey: 1–5 */
  rating?: number;
  /** survey: how they heard about us */
  source?: string;
  orderRef?: string;
  date: string; // ISO
  status: MessageStatus;
  sample?: boolean;
}

export const TYPE_LABEL: Record<MessageType, string> = {
  contact: 'Contact',
  complaint: 'Complaint',
  feedback: 'Feedback',
  survey: 'Survey',
};

const KEY = 'ls-inbox';

interface Stored {
  added: InboxMessage[];
  status: Record<string, MessageStatus>;
  deleted: string[];
}

/**
 * Messages from the shop for the operator: the contact form, complaints,
 * feedback and the post-order survey. Sample messages fill the inbox until
 * the backend stores real ones; new ones from this browser are added on top.
 */
@Injectable({ providedIn: 'root' })
export class InboxService {
  private readonly stored = signal<Stored>(read());

  readonly all = computed<InboxMessage[]>(() => {
    const s = this.stored();
    const gone = new Set(s.deleted);
    return [...s.added, ...SAMPLE]
      .filter((m) => !gone.has(m.id))
      .map((m) => (s.status[m.id] ? { ...m, status: s.status[m.id] } : m))
      .sort((a, b) => b.date.localeCompare(a.date));
  });

  readonly unread = computed(() => this.all().filter((m) => m.status === 'new').length);

  add(m: Omit<InboxMessage, 'id' | 'date' | 'status'>): void {
    const msg: InboxMessage = { ...m, id: `m-${Date.now()}`, date: new Date().toISOString(), status: 'new' };
    this.save({ ...this.stored(), added: [msg, ...this.stored().added] });
  }

  setStatus(id: string, status: MessageStatus): void {
    this.save({ ...this.stored(), status: { ...this.stored().status, [id]: status } });
  }

  remove(id: string): void {
    this.save({ ...this.stored(), deleted: [...this.stored().deleted, id] });
  }

  reset(): void {
    this.save({ added: [], status: {}, deleted: [] });
  }

  private save(s: Stored): void {
    this.stored.set(s);
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* storage blocked */
    }
  }
}

function read(): Stored {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    return v ? { added: v.added ?? [], status: v.status ?? {}, deleted: v.deleted ?? [] } : { added: [], status: {}, deleted: [] };
  } catch {
    return { added: [], status: {}, deleted: [] };
  }
}

// ---- sample messages (replace with the backend's messages table) -----------
const daysAgo = (d: number, h = 11) => {
  const x = new Date();
  x.setDate(x.getDate() - d);
  x.setHours(h, (d * 17) % 60, 0, 0);
  return x.toISOString();
};

const SAMPLE: InboxMessage[] = [
  { id: 's1', type: 'complaint', name: 'Sana M.', contact: '0300 1112233', subject: 'Cake arrived with the cream smudged', body: 'The toffee cake for my sister’s birthday arrived with the top smudged on one side. Still tasted great but the surprise looked messy. Order placed yesterday for DHA.', orderRef: 'LS-1042', date: daysAgo(0, 10), status: 'new' },
  { id: 's2', type: 'contact', name: 'Bilal A.', contact: 'bilal.a@example.com', subject: 'Corporate order for 40 hampers', body: 'We need 40 Eid hampers for clients, delivered to 3 offices in Karachi and 5 in Lahore. Budget around Rs 6,000 each with our logo on the tag. Can you send a quote?', date: daysAgo(0, 9), status: 'new' },
  { id: 's3', type: 'survey', name: 'Ayesha K.', contact: '0321 4455667', subject: 'After-order survey', body: 'Loved building the basket myself. Would be nice to see the actual ribbon colour in a photo.', rating: 5, source: 'Instagram', orderRef: 'LS-1039', date: daysAgo(1, 18), status: 'new' },
  { id: 's4', type: 'feedback', name: 'Hassan B.', contact: '0333 9988776', subject: 'Please add savoury options', body: 'Not everyone in my family likes sweets. Some nimko, dry fruit or cheese boxes in the builder would be great.', date: daysAgo(1, 14), status: 'read' },
  { id: 's5', type: 'complaint', name: 'Komal Y.', contact: 'komal.y@example.com', subject: 'Delivery came in the wrong slot', body: 'I chose 2–6 pm but the rider came at 8:30 pm. My mother had gone out, so the gift sat with the guard.', orderRef: 'LS-1031', date: daysAgo(2, 21), status: 'read' },
  { id: 's6', type: 'survey', name: 'Omar F.', contact: '0302 1234500', subject: 'After-order survey', body: 'Easy checkout, quick confirmation on WhatsApp.', rating: 4, source: 'Google search', orderRef: 'LS-1036', date: daysAgo(2, 12), status: 'resolved' },
  { id: 's7', type: 'contact', name: 'Iqra J.', contact: '0345 2223344', subject: 'Can you recreate this Pinterest basket?', body: 'I have a picture of a pastel basket with macarons, a candle and peonies. Can you make something like it for Saturday? Budget Rs 9,000.', date: daysAgo(3, 16), status: 'new' },
  { id: 's8', type: 'survey', name: 'Fatima R.', contact: '0312 7788990', subject: 'After-order survey', body: 'The handwritten note made my husband smile. Packaging felt premium.', rating: 5, source: 'Friend or family', orderRef: 'LS-1028', date: daysAgo(4, 11), status: 'resolved' },
  { id: 's9', type: 'feedback', name: 'Danish K.', contact: 'danish.k@example.com', subject: 'Show delivery charges earlier', body: 'I only saw the delivery fee in the bag. Would be clearer on the product page.', date: daysAgo(5, 13), status: 'resolved' },
  { id: 's10', type: 'survey', name: 'Rabia Q.', contact: '0300 5566778', subject: 'After-order survey', body: 'Flowers were fresh but the box was a little smaller than expected.', rating: 3, source: 'TikTok', orderRef: 'LS-1022', date: daysAgo(6, 19), status: 'read' },
  { id: 's11', type: 'contact', name: 'Talha W.', contact: '0331 6677889', subject: 'Do you deliver to Hyderabad?', body: 'Want to send a hamper to my grandparents in Hyderabad next Friday. Is that possible and how much is delivery?', date: daysAgo(7, 10), status: 'resolved' },
  { id: 's12', type: 'complaint', name: 'Laiba H.', contact: '0322 3344556', subject: 'Payment link didn’t open', body: 'The card payment link you sent on WhatsApp showed an error. Paid by bank transfer in the end.', orderRef: 'LS-1017', date: daysAgo(9, 15), status: 'resolved' },
  { id: 's13', type: 'survey', name: 'Ahmed R.', contact: '0300 9090901', subject: 'After-order survey', body: 'Smooth. Would order again for Eid.', rating: 5, source: 'Instagram', orderRef: 'LS-1014', date: daysAgo(10, 20), status: 'archived' },
  { id: 's14', type: 'feedback', name: 'Mahnoor S.', contact: 'mahnoor@example.com', subject: 'Occasion reminders please', body: 'Could you remind me a few days before my parents’ anniversary? I always forget until the day.', date: daysAgo(12, 9), status: 'read' },
  { id: 's15', type: 'survey', name: 'Saad H.', contact: '0313 4545454', subject: 'After-order survey', body: 'Rider was polite and called before arriving.', rating: 4, source: 'Google search', orderRef: 'LS-1009', date: daysAgo(14, 17), status: 'archived' },
  { id: 's16', type: 'contact', name: 'Areeba Z.', contact: '0334 8989898', subject: 'Baby shower favours', body: 'Need 25 small boxes of chocolates for a baby shower on the 2nd. Pink and white ribbon please.', date: daysAgo(16, 12), status: 'resolved' },
  { id: 's17', type: 'survey', name: 'Noor U.', contact: '0300 1212121', subject: 'After-order survey', body: 'Price a bit high for the size, but quality was great.', rating: 4, source: 'Friend or family', orderRef: 'LS-1004', date: daysAgo(20, 18), status: 'archived' },
  { id: 's18', type: 'survey', name: 'Kashif L.', contact: '0321 6767676', subject: 'After-order survey', body: 'Late by a day, which spoiled the surprise.', rating: 2, source: 'Facebook', orderRef: 'LS-1001', date: daysAgo(24, 13), status: 'resolved' },
].map((m) => ({ ...m, sample: true }) as InboxMessage);
