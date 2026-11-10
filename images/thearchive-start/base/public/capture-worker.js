const scope = self.registration.scope;
const inbox = new URL("identify/share-inbox", scope).href;

self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "POST" || event.request.url !== inbox) return;
  event.respondWith((async () => {
    const files = await event.request.formData();
    const photos = new FormData();
    for (const photo of files.getAll("photos").slice(0, 5)) {
      if (photo instanceof File && photo.size <= 10 * 1024 * 1024 &&
          ["image/jpeg", "image/png", "image/webp"].includes(photo.type)) {
        photos.append("photos", photo);
      }
    }
    const target = new URL("identify/", scope);
    if (photos.has("photos")) {
      const cache = await caches.open("archive-shared-photos");
      const key = crypto.randomUUID();
      await cache.put(new URL(`identify/shared/${key}`, scope), new Response(photos));
      target.searchParams.set("shared", key);
    }
    return Response.redirect(target, 303);
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(new URL("identify/", scope)));
});
