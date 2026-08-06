# StockFlow — วิธีเอาขึ้นเว็บ (Cloudflare Pages)

## 1. อัปโหลดขึ้น GitHub
1. เข้า https://github.com → สมัคร/ล็อกอิน
2. กด **New repository** → ตั้งชื่อ เช่น `ims-app` → กด **Create repository**
3. ในหน้า repo เปล่าๆ กด **uploading an existing file**
4. ลากไฟล์/โฟลเดอร์ทั้งหมดในนี้ (ยกเว้น `node_modules` ถ้ามี) ไปวาง แล้วกด **Commit changes**

## 2. เชื่อม Cloudflare
1. เข้า https://dash.cloudflare.com → สมัคร/ล็อกอิน
2. เมนูซ้าย เลือก **Workers & Pages**
3. กด **Create** → เลือกแท็บ **Pages** → **Connect to Git**
4. เลือก repo `ims-app` ที่เพิ่งอัปโหลด

## 3. ตั้งค่า build (กรอกแค่ 2 ช่องนี้)
| ช่อง | ใส่ค่านี้ |
|---|---|
| Build command | `npm run build` |
| Build output directory | `dist` |

กด **Save and Deploy** รอ 1-2 นาที จะได้ลิงก์เว็บพร้อมใช้งาน เช่น `ims-app-xyz.pages.dev`

---

## ทดสอบในเครื่องตัวเองก่อน (ไม่บังคับ)
ถ้ามี Node.js ในเครื่อง เปิด terminal ในโฟลเดอร์นี้แล้วรัน:
```
npm install
npm run dev
```
จะเปิดเว็บทดสอบที่ `http://localhost:5173`

## ข้อควรรู้
- ข้อมูลเก็บใน `localStorage` ของเบราว์เซอร์ — แต่ละเครื่อง/เบราว์เซอร์จะเห็นข้อมูลคนละชุดกัน ไม่ซิงก์ข้ามเครื่องอัตโนมัติ
- ทุกครั้งที่แก้โค้ดแล้วอัปขึ้น GitHub ใหม่ Cloudflare จะ build เว็บให้ใหม่อัตโนมัติ
