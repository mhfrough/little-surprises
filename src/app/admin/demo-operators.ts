/**
 * Demo operator accounts for the portal sign-in, checked in the browser.
 *
 * Not real security: anything shipped to the browser can be read. When the
 * NestJS backend arrives these go away — the API checks a hashed password and
 * hands back a session cookie, and AdminAuth.signIn calls that instead.
 */
export interface DemoOperator {
  email: string;
  password: string;
  name: string;
  role: string;
}

export const DEMO_OPERATORS: DemoOperator[] = [
  { email: 'shazra@littlesurprises.pk', password: 'Surprise#2026', name: 'Shazra Akbar', role: 'Owner' },
  { email: 'hamza@littlesurprises.pk', password: 'Surprise#2026', name: 'Mohammad Hamza', role: 'Developer' },
];
