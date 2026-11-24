import { vi } from "vitest";

export function mockMatchMedia(reduced: boolean): void {
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: reduced && q.includes("reduce"),
    media: q,
    addEventListener() {},
    removeEventListener() {},
  }));
}

type IOCallback = (entries: Array<{ isIntersecting: boolean; target: Element }>) => void;
export class FakeIO {
  static instances: FakeIO[] = [];
  observed: Element[] = [];
  disconnected = false;
  constructor(public cb: IOCallback) {
    FakeIO.instances.push(this);
  }
  observe(el: Element) {
    this.observed.push(el);
  }
  unobserve(el: Element) {
    this.observed = this.observed.filter((e) => e !== el);
  }
  disconnect() {
    this.disconnected = true;
  }
  fire(isIntersecting = true) {
    this.cb(this.observed.map((target) => ({ isIntersecting, target })));
  }
}

export function installFakeIO(): void {
  FakeIO.instances = [];
  vi.stubGlobal("IntersectionObserver", FakeIO);
}
