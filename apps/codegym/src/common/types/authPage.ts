export const authPageList = Object.freeze([
  '/problems',
  '/history',
  '/graph',
  '/contests',
  '/settings',
] as const);

export type AuthPage = (typeof authPageList)[number];

export function isAuthPage(page: string): page is AuthPage {
  return (authPageList as readonly string[]).includes(page);
}
