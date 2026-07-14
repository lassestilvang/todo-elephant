declare global {
  function describe(name: string, fn: () => void): void;
  function it(name: string, fn: () => void): void;
  function test(name: string, fn: () => void): void;
  function expect<T>(actual: T): Expect<T>;
}

interface Expect<T> {
  toBe(expected: T): void;
  toBeGreaterThan(expected: number): void;
  toBeLessThan(expected: number): void;
  toEqual(expected: T): void;
}

export {};