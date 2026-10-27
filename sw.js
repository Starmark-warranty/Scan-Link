// Service worker ของแอปสแกน: ทำให้ติดตั้งได้ + เปิดเร็วขึ้น
// หน้าแอป = ดึงจากเน็ตก่อน (ได้เวอร์ชันใหม่เสมอ) ไม่มีเน็ตค่อยใช้ของที่เก็บไว้
// ตัวอ่านโค้ด (zxing จาก jsdelivr, เวอร์ชันล็อกไว้) = ใช้ของที่เก็บไว้ก่อน
const CACHE = "scanlink-v21";   // 2026-10-27: v21 เก็บ ov (ADMIN แก้สถานะของ StarStock) ตอนเขียน steps.json · v20 ปุ่มสี / เคลือบ เฉพาะชิ้นชนิดนั้น (fstyle.csv + รหัสไม้) · v19 โหมดเดียว (แอปดูเองจากโค้ด) + ปุ่ม 3D ในแผง Lot · 2026-10-26: v18 แผงห่อไม่ถูกแถบโหมดบัง + ห่อของ Lot ตรวจแล้ว x/ทั้งหมด · v17 Site ตรวจรับราย Pack (ติ๊กรายชิ้น / ทั้งห่อ) · Lot ผลิต Edge / Drill · v8 เลือกโหมด 3D / สถานะ · v9 หา Lot จาก Code Part · v10 ไม่เจอ = ตรวจข้อมูลใหม่ · v11 + Site · v12 แตะเลือก + ปุ่มบันทึก · v13 Proj Name · v14 + สี / เคลือบ · v15 ยิง Pack → รายการชิ้น → ดู 3D · v16 ชิ้น Barcode Manual ในตู้เปิด 3D ได้
const SHELL = ["./", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-180.png", "./qr-link.png"];
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
