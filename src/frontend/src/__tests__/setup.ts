import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// The object-storage package's ESM build uses extensionless imports that Node's
// strict ESM resolver rejects. It is only used for media upload, which these
// tests do not exercise, so mock it at the module boundary.
vi.mock("@caffeineai/object-storage", () => ({
  ExternalBlob: {
    fromBytes: () => ({ getBytes: async () => new Uint8Array() }),
    fromURL: () => ({ getBytes: async () => new Uint8Array() }),
  },
  StorageClient: {},
}));

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

// jsdom does not implement crypto.subtle used by the privacy lock's PIN hashing.
Object.defineProperty(globalThis, "crypto", {
  value: {
    ...globalThis.crypto,
    subtle: {
      digest: vi.fn(async (_algo: string, data: Uint8Array) => {
        // Deterministic fake SHA-256: fold input bytes into a 32-byte digest so
        // different PINs hash to different values within a test run.
        const out = new Uint8Array(32);
        for (let i = 0; i < data.length; i++) {
          out[i % 32] = (out[i % 32] + data[i]) & 0xff;
        }
        return out;
      }),
    },
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) arr[i] = i % 256;
      return arr;
    },
  },
});

// Radix UI primitives rely on these browser APIs that jsdom does not provide.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}

if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

if (!window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = () => undefined;
}

// jsdom lacks scrollTo; the Thread component calls it on the message list.
if (!window.HTMLElement.prototype.scrollTo) {
  window.HTMLElement.prototype.scrollTo = () => undefined;
}

// Radix Popover (via @floating-ui) measures the trigger with getBoundingClientRect
// before rendering its portal content. jsdom returns all zeros, which can leave
// the popover unopened. Provide a non-zero box so the popover opens in tests.
window.HTMLElement.prototype.getBoundingClientRect = () =>
  ({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 100,
    bottom: 100,
    width: 100,
    height: 100,
    toJSON: () => ({}),
  }) as DOMRect;

// jsdom lacks navigator.clipboard; used by the copy-message control.
Object.defineProperty(navigator, "clipboard", {
  value: {
    writeText: vi.fn(async () => undefined),
  },
  configurable: true,
});

// WebRTC globals used by useWebRTC (voice calls). jsdom provides none of them.
Object.defineProperty(navigator, "mediaDevices", {
  value: {
    getUserMedia: vi.fn(async () => ({
      getTracks: () => [],
      getAudioTracks: () => [],
    })),
  },
  configurable: true,
});

class MockRTCPeerConnection {
  connectionState = "new";
  onconnectionstatechange: (() => void) | null = null;
  onicecandidate: ((event: { candidate: null }) => void) | null = null;
  ontrack: ((event: { streams: MediaStream[] }) => void) | null = null;
  addTrack() {}
  getSenders() {
    return [];
  }
  close() {}
  async createOffer() {
    return { type: "offer", sdp: "offer" };
  }
  async createAnswer() {
    return { type: "answer", sdp: "answer" };
  }
  async setLocalDescription() {}
  async setRemoteDescription() {}
  async addIceCandidate() {}
}
Object.defineProperty(globalThis, "RTCPeerConnection", {
  value: MockRTCPeerConnection,
  configurable: true,
});
