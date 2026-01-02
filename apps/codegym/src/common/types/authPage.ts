export const authPageList = Object.freeze([
  '/problems',
  '/history',
  '/graph',
  '/contests',
  '/settings',
] as const);

export type AuthPage = (typeof authPageList)[number];
