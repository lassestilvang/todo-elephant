declare module 'jsonwebtoken' {
  export function sign(
    payload: object | string,
    secretOrPrivateKey: string,
    options?: object
  ): string;

  export function verify(
    token: string,
    secretOrPrivateKey: string,
    options?: object
  ): object | string;

  export function decode(
    token: string,
    options?: object
  ): object | string | null;
}