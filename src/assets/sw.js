// Service worker for WebLLM
// Simple service worker implementation without TypeScript dependencies

self.addEventListener("install", function(event) {
  console.log("Service Worker installing");
  // Skip waiting to ensure the service worker activates immediately
  self.skipWaiting();
});

self.addEventListener("activate", function(event) {
  console.log("Service Worker activating");
  // Create the handler when the service worker activates
  // Using a more generic approach to avoid TypeScript conflicts
  const { ServiceWorkerMLCEngineHandler } = require("@mlc-ai/web-llm");
  self.handler = new ServiceWorkerMLCEngineHandler();
  console.log("Service Worker is ready");
  
  // Claim clients to ensure the service worker controls all pages
  event.waitUntil(self.clients.claim());
});

// Handle fetch events
self.addEventListener("fetch", function(event) {
  // This is a simple pass-through fetch handler
  console.log("Service Worker handling fetch event for", event.request.url);
});

// Handle message events
self.addEventListener("message", function(event) {
  console.log("Service Worker received message:", event.data);
  if (self.handler) {
    self.handler.onmessage(event);
  } else {
    console.error("Handler not initialized yet");
  }
});
