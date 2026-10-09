// Service worker ของแอปสแกน: ทำให้ติดตั้งได้ + เปิดเร็วขึ้น
// หน้าแอป = ดึงจากเน็ตก่อน (ได้เวอร์ชันใหม่เสมอ) ไม่มีเน็ตค่อยใช้ของที่เก็บไว้
// ตัวอ่านโค้ด (zxing จาก jsdelivr, เวอร์ชันล็อกไว้) = ใช้ของที่เก็บไว้ก่อน
const CACHE = "scanlink-v4";
const SHELL = ["./", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-180.png"];
const LIB = "https://cdn.jsdelivr.net/npm/zxing-wasm@3.1.5/";
const WASM = "https://fastly.jsdelivr.net/npm/zxing-wasm@3.1.5/";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("scanlink-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = req.url;
  const scope = self.registration.scope;

  // ตัวอ่านโค้ด: cache ก่อน
  if (url.startsWith(LIB) || url.startsWith(WASM)) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }))
    );
    return;
  }

  // ไฟล์ของแอปเอง (เฉพาะใน /Scan-Link/ ไม่ยุ่งกับ repo อื่นบนโดเมนเดียวกัน): เน็ตก่อน
  if (url.startsWith(scope)) {
    e.respondWith(
      fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match("./")))
    );
  }
});
