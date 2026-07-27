/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/** Paths that are precached and should play offline. */
const OFFLINE_DOCUMENTS = new Set(["/", "/play", "/play/daily", "/~offline"]);

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  // Navigation preload has caused Safari to miss precached documents.
  navigationPreload: false,
  precacheOptions: {
    // /play?d=medium and Next RSC ?_rsc= must still hit the /play HTML entry.
    ignoreURLParametersMatching: [/.*/],
    cleanupOutdatedCaches: true,
  },
  runtimeCaching: [
    {
      matcher: ({ sameOrigin, url }) =>
        sameOrigin && url.pathname.startsWith("/api/"),
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          if (request.destination !== "document" && request.mode !== "navigate") {
            return false;
          }
          try {
            const pathname = new URL(request.url).pathname;
            // Never fallback-loop for pages we already precache.
            if (OFFLINE_DOCUMENTS.has(pathname)) return false;
          } catch {
            // ignore bad URLs
          }
          return true;
        },
      },
    ],
  },
});

serwist.addEventListeners();
