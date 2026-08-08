import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  LayoutDashboard, Package, ShoppingCart, Users, Wallet,
  FileBarChart, Plus, Search, Pencil, Trash2, X, ChevronDown, ChevronRight,
  TrendingUp, TrendingDown, Menu, Truck, Printer, FileSpreadsheet,
  RotateCcw, Minus, CircleUser, ImageIcon, ArrowLeftRight, Layers, Receipt,
} from "lucide-react";
import * as XLSX from "xlsx";

/* ============================== DESIGN TOKENS (blue / white) ============================== */
const C = {
  bg: "#F2F6FC",
  surface: "#FFFFFF",
  sidebar: "#0B1E3F",
  sidebarLine: "#1C3564",
  accent: "#1D4FC4",
  accentSoft: "#E7EEFC",
  accentDark: "#12358F",
  success: "#178A56",
  successSoft: "#E5F5EC",
  warning: "#B8720A",
  warningSoft: "#FDF1DF",
  danger: "#C0402B",
  dangerSoft: "#FBE9E6",
  text: "#0F1A2E",
  sub: "#5D6B85",
  faint: "#93A0B8",
  border: "#DEE6F3",
};

const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600;700&display=swap');";

const GlobalStyle = () => (
  <style>{`
    ${FONT_IMPORT}
    .ims * { font-family: 'Inter', system-ui, sans-serif; box-sizing: border-box; }
    .ims .mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; font-variant-numeric: tabular-nums; }
    .ims ::-webkit-scrollbar { width: 8px; height: 8px; }
    .ims ::-webkit-scrollbar-thumb { background: #C9D6EC; border-radius: 8px; }
    .ims button:focus-visible, .ims input:focus-visible, .ims select:focus-visible, .ims textarea:focus-visible {
      outline: 2px solid ${C.accent}; outline-offset: 1px;
    }
    @media print {
      @page { size: A4; margin: 12mm; }
      body * { visibility: hidden; }
      .printable, .printable * { visibility: visible; }
      .printable { position: absolute; left: 0; top: 0; width: 100%; padding: 0; }
      .no-print { display: none !important; }
    }
  `}</style>
);

/* ============================== HELPERS ============================== */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const money = (n) => "฿" + Math.round(n || 0).toLocaleString("th-TH");
const num = (n) => Math.round(n || 0).toLocaleString("th-TH");
const fmtDate = (d) => new Date(d).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "2-digit" });
const fmtDateTime = (d) => new Date(d).toLocaleString("th-TH", { day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" });
const isoDay = (d) => new Date(d).toISOString().slice(0, 10);
const MONTHS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const addDays = (date, n) => { const d = new Date(date); d.setDate(d.getDate() + n); return d; };

const SITE_PASSWORD = "pp"; // เปลี่ยนเป็นรหัสที่ต้องการ

const CHANNELS = [
  { key: "line", label: "LINE", color: "#06C755" },
  { key: "shopee", label: "Shopee", color: "#EE4D2D" },
  { key: "instagram", label: "Instagram", color: "#C13584" },
  { key: "lazada", label: "Lazada", color: "#0F146D" },
  { key: "tiktok", label: "TikTok", color: "#111111" },
  { key: "other", label: "อื่นๆ / หน้าร้าน", color: "#6B7280" },
];
const channelOf = (key) => CHANNELS.find((c) => c.key === key);

// Thai baht text conversion (e.g. 9630 -> "เก้าพันหกร้อยสามสิบบาทถ้วน")
function thaiBahtText(amount) {
  const TXT_NUM = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
  const TXT_DIGIT = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน"];
  const convertGroup = (numStr) => {
    let result = "";
    const len = numStr.length;
    for (let i = 0; i < len; i++) {
      const digit = parseInt(numStr[i], 10);
      const place = len - i - 1;
      if (digit === 0) continue;
      if (place === 0 && digit === 1 && len > 1) result += "เอ็ด";
      else if (place === 1 && digit === 2) result += "ยี่" + TXT_DIGIT[place];
      else if (place === 1 && digit === 1) result += TXT_DIGIT[place];
      else result += TXT_NUM[digit] + TXT_DIGIT[place];
    }
    return result;
  };
  const convertLarge = (numStr) => {
    numStr = numStr.replace(/^0+/, "") || "0";
    if (numStr === "0") return "ศูนย์";
    let result = "";
    while (numStr.length > 6) {
      const millionPart = numStr.slice(0, numStr.length - 6);
      result += convertGroup(millionPart) + "ล้าน";
      numStr = numStr.slice(numStr.length - 6);
    }
    result += convertGroup(numStr);
    return result;
  };
  const isNegative = amount < 0;
  const rounded = Math.round(Math.abs(amount) * 100) / 100;
  const [bahtStr, satangStr] = rounded.toFixed(2).split(".");
  const satang = parseInt(satangStr, 10);
  let text = convertLarge(bahtStr) + "บาท";
  text += satang === 0 ? "ถ้วน" : convertGroup(String(satang)) + "สตางค์";
  return (isNegative ? "ลบ" : "") + text;
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function resizeImageFile(file, maxDim = 480, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = Math.round((height * maxDim) / width); width = maxDim; }
          else { width = Math.round((width * maxDim) / height); height = maxDim; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const DEFAULT_CATEGORIES = ["เสื้อผ้า", "กระเป๋า", "อิเล็กทรอนิกส์", "ของใช้ทั่วไป"];
const EXPENSE_CATS = ["ค่าเช่าคลังสินค้า", "ค่าการตลาด/โฆษณา", "ค่าขนส่ง", "เงินเดือนพนักงาน", "ค่าสาธารณูปโภค", "อื่นๆ"];

/* ============================== FIFO LOT HELPERS ============================== */
// Every product has: { ...basicFields, costPrice (estimate/default only), variants: [{id,sku,name,sellPrice}], lots: [{id,variantId,qty,costPrice,supplierId,date,note}] }
const productLots = (p) => p.lots || [];
const lotsFor = (p, variantId) => productLots(p).filter((l) => (l.variantId || null) === (variantId || null) && l.qty > 0)
  .sort((a, b) => new Date(a.date) - new Date(b.date));
const stockOf = (p, variantId) => productLots(p).filter((l) => (l.variantId || null) === (variantId || null)).reduce((s, l) => s + l.qty, 0);
const avgCostOf = (p, variantId) => {
  const lots = lotsFor(p, variantId);
  const totalQty = lots.reduce((s, l) => s + l.qty, 0);
  if (totalQty === 0) return p.costPrice || 0;
  const totalVal = lots.reduce((s, l) => s + l.qty * l.costPrice, 0);
  return Math.round((totalVal / totalQty) * 100) / 100;
};
const productTotalStock = (p) => productLots(p).reduce((s, l) => s + l.qty, 0);
const productStockValue = (p) => productLots(p).reduce((s, l) => s + l.qty * l.costPrice, 0);
const productRetailValue = (p) => {
  let val = stockOf(p, null) * p.sellPrice;
  (p.variants || []).forEach((v) => { val += stockOf(p, v.id) * v.sellPrice; });
  return val;
};

// Consumes `qty` units FIFO (oldest lot first) from a product's lots for a given variant.
// Returns { lots: newLotsArray, cost: totalCostConsumed, shortfall: unfulfilledQty }
function deductFIFO(allLots, variantId, qty) {
  const key = variantId || null;
  const relevant = allLots
    .map((l, idx) => ({ ...l, _idx: idx }))
    .filter((l) => (l.variantId || null) === key && l.qty > 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  let remaining = qty;
  let cost = 0;
  const updates = {};
  for (const lot of relevant) {
    if (remaining <= 0) break;
    const take = Math.min(lot.qty, remaining);
    cost += take * lot.costPrice;
    updates[lot._idx] = lot.qty - take;
    remaining -= take;
  }
  const newLots = allLots.map((l, idx) => (updates.hasOwnProperty(idx) ? { ...l, qty: updates[idx] } : l));
  return { lots: newLots, cost, shortfall: remaining };
}

// Backward-compat: migrate old flat stock/costPrice products (or fresh empty ones) into the lots model
function migrateProduct(p) {
  if (p.lots) return { ...p, variants: (p.variants || []).map((v) => ({ id: v.id, sku: v.sku, name: v.name, sellPrice: v.sellPrice })) };
  const lots = [];
  const now = new Date().toISOString();
  if (p.stock > 0) lots.push({ id: uid(), variantId: null, qty: p.stock, costPrice: p.costPrice || 0, supplierId: null, date: now, note: "ย้ายข้อมูลจากระบบเดิม" });
  (p.variants || []).forEach((v) => {
    if (v.stock > 0) lots.push({ id: uid(), variantId: v.id, qty: v.stock, costPrice: p.costPrice || 0, supplierId: null, date: now, note: "ย้ายข้อมูลจากระบบเดิม" });
  });
  return { ...p, lots, variants: (p.variants || []).map((v) => ({ id: v.id, sku: v.sku, name: v.name, sellPrice: v.sellPrice })) };
}

/* ============================== SEED DATA ============================== */
function buildSeedData() {
  return { products: [], customers: [], suppliers: [], orders: [], stockMoves: [], financeEntries: [], categories: [...DEFAULT_CATEGORIES], shopInfo: { name: "ชื่อร้านค้าของคุณ", address: "", taxId: "", phone: "", email: "" } };
}

/* ============================== DERIVED CALC ============================== */
const orderTotals = (order) => {
  const subtotal = order.items.reduce((s, it) => s + it.qty * it.price, 0);
  const cost = order.items.reduce((s, it) => s + it.qty * it.cost, 0);
  const total = subtotal - (order.discount || 0) + (order.shippingFee || 0);
  const profit = total - cost;
  return { subtotal, cost, total, profit };
};

/* ============================== UI PRIMITIVES ============================== */
const Card = ({ children, className = "", style }) => (
  <div className={`rounded-2xl ${className}`} style={{ background: C.surface, border: `1px solid ${C.border}`, ...style }}>{children}</div>
);

const Btn = ({ children, onClick, variant = "primary", icon: Icon, className = "", type = "button", disabled }) => {
  const styles = {
    primary: { background: C.accent, color: "#fff", border: `1px solid ${C.accent}` },
    ghost: { background: "transparent", color: C.text, border: `1px solid ${C.border}` },
    danger: { background: C.dangerSoft, color: C.danger, border: `1px solid ${C.dangerSoft}` },
    subtle: { background: C.accentSoft, color: C.accentDark, border: `1px solid ${C.accentSoft}` },
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      style={styles[variant]}>
      {Icon && <Icon size={15} />}
      {children}
    </button>
  );
};

const IconBtn = ({ icon: Icon, onClick, title, tone = "default" }) => {
  const color = tone === "danger" ? C.danger : tone === "accent" ? C.accent : C.sub;
  return <button title={title} onClick={onClick} className="p-1.5 rounded-lg hover:bg-black/5 transition" style={{ color }}><Icon size={15} /></button>;
};

const Field = ({ label, children, required }) => (
  <label className="block mb-3">
    <span className="block text-xs font-semibold mb-1" style={{ color: C.sub }}>{label} {required && <span style={{ color: C.danger }}>*</span>}</span>
    {children}
  </label>
);

const inputStyle = { width: "100%", padding: "9px 12px", borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 14, background: "#fff", color: C.text };
const Input = (props) => <input {...props} style={{ ...inputStyle, ...props.style }} />;
const Select = (props) => <select {...props} style={{ ...inputStyle, ...props.style }} />;
const TextArea = (props) => <textarea {...props} style={{ ...inputStyle, resize: "vertical", ...props.style }} />;

const Badge = ({ children, tone = "default" }) => {
  const map = {
    default: { bg: "#EDF1F9", fg: C.sub }, success: { bg: C.successSoft, fg: C.success },
    warning: { bg: C.warningSoft, fg: C.warning }, danger: { bg: C.dangerSoft, fg: C.danger }, accent: { bg: C.accentSoft, fg: C.accentDark },
  };
  const s = map[tone];
  return <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: s.bg, color: s.fg }}>{children}</span>;
};

const ChannelTag = ({ channel }) => {
  const c = channelOf(channel);
  if (!c) return <span className="text-xs" style={{ color: C.faint }}>-</span>;
  return <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: C.text }}><span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />{c.label}</span>;
};

const StatusBadge = ({ status }) => status === "pending" ? <Badge tone="warning">รอดำเนินการ</Badge> : <Badge tone="success">ปิดรายการแล้ว</Badge>;

const Modal = ({ open, onClose, title, children, width = 480, footer }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,30,63,0.55)" }}>
      <div className="rounded-2xl w-full overflow-hidden flex flex-col" style={{ maxWidth: width, background: C.surface, maxHeight: "88vh" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <h3 className="font-bold text-base" style={{ color: C.text }}>{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/5"><X size={18} /></button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-3 flex justify-end gap-2" style={{ borderTop: `1px solid ${C.border}` }}>{footer}</div>}
      </div>
    </div>
  );
};

const ConfirmDialog = ({ open, onCancel, onConfirm, message }) => (
  <Modal open={open} onClose={onCancel} title="ยืนยันการลบ" width={380}
    footer={<><Btn variant="ghost" onClick={onCancel}>ยกเลิก</Btn><Btn variant="danger" onClick={onConfirm}>ลบรายการ</Btn></>}>
    <p className="text-sm" style={{ color: C.sub }}>{message}</p>
  </Modal>
);

const StatCard = ({ label, value, sub, tone = "default", icon: Icon }) => {
  const toneColor = { default: C.accent, success: C.success, warning: C.warning, danger: C.danger }[tone];
  return (
    <Card className="p-4 flex flex-col gap-2 relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: toneColor }} />
      <div className="flex items-center justify-between pl-2">
        <span className="text-xs font-semibold" style={{ color: C.sub }}>{label}</span>
        {Icon && <Icon size={16} style={{ color: toneColor }} />}
      </div>
      <div className="pl-2 mono text-2xl font-bold" style={{ color: C.text }}>{value}</div>
      {sub && <div className="pl-2 text-xs" style={{ color: C.faint }}>{sub}</div>}
    </Card>
  );
};

const EmptyState = ({ text }) => <div className="py-14 text-center text-sm" style={{ color: C.faint }}>{text}</div>;

const Toast = ({ message }) => {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] no-print">
      <div className="px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: C.text, color: "#fff", boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}>
        {message}
      </div>
    </div>
  );
};

function CollapseCard({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="p-4 mb-3">
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between">
        <span className="font-bold text-sm" style={{ color: C.text }}>{title}</span>
        {open ? <ChevronDown size={16} style={{ color: C.sub }} /> : <ChevronRight size={16} style={{ color: C.sub }} />}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </Card>
  );
}

const SearchBox = ({ value, onChange, placeholder }) => (
  <div className="relative w-full sm:w-64">
    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.faint }} />
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full pl-9 pr-3 py-2 rounded-xl text-sm" style={{ border: `1px solid ${C.border}`, background: "#fff" }} />
  </div>
);

const PageHeader = ({ title, subtitle, actions }) => (
  <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
    <div>
      <h1 className="text-xl font-extrabold" style={{ color: C.text }}>{title}</h1>
      {subtitle && <p className="text-sm mt-0.5" style={{ color: C.sub }}>{subtitle}</p>}
    </div>
    <div className="flex gap-2">{actions}</div>
  </div>
);

const Thumb = ({ src, size = 40 }) => (
  src ? (
    <img src={src} alt="" className="rounded-lg object-cover" style={{ width: size, height: size, border: `1px solid ${C.border}` }} />
  ) : (
    <div className="rounded-lg flex items-center justify-center" style={{ width: size, height: size, background: C.accentSoft }}>
      <ImageIcon size={size * 0.42} style={{ color: C.faint }} />
    </div>
  )
);

function ImageField({ value, onChange }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const handleFile = async (file) => {
    if (!file) return;
    setBusy(true);
    try { onChange(await resizeImageFile(file)); }
    catch { alert("ไม่สามารถอัปโหลดรูปภาพนี้ได้ กรุณาลองไฟล์อื่น"); }
    finally { setBusy(false); }
  };
  return (
    <div className="flex items-center gap-3">
      <Thumb src={value} size={64} />
      <div className="flex flex-col gap-1.5">
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files && e.target.files[0])} />
        <Btn variant="ghost" type="button" onClick={() => inputRef.current && inputRef.current.click()} disabled={busy}>
          {busy ? "กำลังอัปโหลด..." : value ? "เปลี่ยนรูปภาพ" : "อัปโหลดรูปภาพ"}
        </Btn>
        {value && <button type="button" onClick={() => onChange("")} className="text-xs text-left" style={{ color: C.danger }}>ลบรูปภาพ</button>}
      </div>
    </div>
  );
}

/* Type-ahead name field (works reliably on iOS/Safari, unlike <datalist>) */
function NameAutocomplete({ value, onChange, onSelect, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const matches = value ? options.filter((o) => o.name.toLowerCase().includes(value.toLowerCase())).slice(0, 6) : [];
  return (
    <div className="relative">
      <Input value={value} placeholder={placeholder}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)} />
      {open && matches.length > 0 && (
        <div className="absolute z-20 left-0 right-0 mt-1 rounded-xl overflow-hidden" style={{ background: "#fff", border: `1px solid ${C.border}`, boxShadow: "0 8px 20px rgba(11,30,63,0.12)" }}>
          {matches.map((o) => (
            <button key={o.id} type="button" onMouseDown={() => onSelect(o)} className="w-full text-left px-3 py-2 text-sm hover:bg-black/5">
              {o.name}{o.phone && <span className="text-xs ml-1.5" style={{ color: C.sub }}>· {o.phone}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================== GENERIC ENTITY MODAL (customers / suppliers) ============================== */
function EntityModal({ open, onClose, columns, initial, onSave, title }) {
  const [form, setForm] = useState(initial || {});
  useEffect(() => { setForm(initial || {}); }, [initial, open]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const save = () => {
    const missing = columns.filter((c) => c.required && (form[c.key] === undefined || form[c.key] === null || form[c.key] === ""));
    if (missing.length) { alert("กรุณากรอกข้อมูลให้ครบ: " + missing.map((m) => m.label).join(", ")); return; }
    onSave({ ...form });
  };
  return (
    <Modal open={open} onClose={onClose} title={title} width={480}
      footer={<><Btn variant="ghost" onClick={onClose}>ยกเลิก</Btn><Btn onClick={save}>บันทึก</Btn></>}>
      {columns.map((c) => (
        <Field key={c.key} label={c.label} required={c.required}>
          {c.type === "textarea" ? (
            <TextArea rows={2} value={form[c.key] ?? ""} onChange={(e) => set(c.key, e.target.value)} />
          ) : (
            <Input type="text" value={form[c.key] ?? ""} onChange={(e) => set(c.key, e.target.value)} />
          )}
        </Field>
      ))}
    </Modal>
  );
}

function EntityTable({ title, columns, data, onAdd, onEdit, onDelete, searchKeys }) {
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(null);
  const [del, setDel] = useState(null);
  const filtered = data.filter((row) => !q || searchKeys.some((k) => String(row[k] ?? "").toLowerCase().includes(q.toLowerCase())));
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <SearchBox value={q} onChange={setQ} placeholder={`ค้นหา${title}...`} />
        <Btn icon={Plus} onClick={() => setModal({})}>{`เพิ่ม${title}`}</Btn>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
            {columns.map((c) => <th key={c.key} className="text-left py-2 px-2 font-semibold text-xs" style={{ color: C.sub }}>{c.label}</th>)}
            <th className="text-right py-2 px-2 font-semibold text-xs" style={{ color: C.sub }}>จัดการ</th>
          </tr></thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="hover:bg-black/[0.02]" style={{ borderBottom: `1px solid ${C.border}` }}>
                {columns.map((c) => <td key={c.key} className="py-2 px-2" style={{ color: C.text }}>{row[c.key]}</td>)}
                <td className="py-2 px-2">
                  <div className="flex justify-end gap-1">
                    <IconBtn icon={Pencil} tone="accent" title="แก้ไข" onClick={() => setModal(row)} />
                    <IconBtn icon={Trash2} tone="danger" title="ลบ" onClick={() => setDel(row)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <EmptyState text="ไม่พบข้อมูล" />}
      </div>
      <EntityModal open={!!modal} onClose={() => setModal(null)} columns={columns} initial={modal}
        title={modal && modal.id ? `แก้ไข${title}` : `เพิ่ม${title}`}
        onSave={(payload) => { if (modal && modal.id) onEdit({ ...modal, ...payload }); else onAdd({ id: uid(), ...payload }); setModal(null); }} />
      <ConfirmDialog open={!!del} onCancel={() => setDel(null)} message={`ต้องการลบ "${del?.name || ""}" ใช่หรือไม่?`}
        onConfirm={() => { onDelete(del.id); setDel(null); }} />
    </Card>
  );
}

/* ============================== PRODUCT MODAL (basic info + variants; stock is handled via lots, not here) ============================== */
function ProductModal({ open, onClose, initial, onSave, categories, onAddCategory }) {
  const isEdit = !!(initial && initial.id);
  const blank = { sku: "", name: "", category: "", costPrice: "", sellPrice: "", imageUrl: "", variants: [] };
  const [form, setForm] = useState(blank);
  const [newCat, setNewCat] = useState("");
  const [addingCat, setAddingCat] = useState(false);
  useEffect(() => { setForm(initial ? { ...blank, ...initial, variants: (initial.variants || []).map((v) => ({ ...v })) } : blank); setAddingCat(false); setNewCat(""); }, [initial, open]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addVariant = () => setForm((f) => ({ ...f, variants: [...f.variants, { id: uid(), sku: "", name: "", sellPrice: "" }] }));
  const updateVariant = (id, k, v) => setForm((f) => ({ ...f, variants: f.variants.map((x) => x.id === id ? { ...x, [k]: v } : x) }));
  const removeVariant = (id) => setForm((f) => ({ ...f, variants: f.variants.filter((x) => x.id !== id) }));

  const confirmNewCategory = () => {
    const name = newCat.trim();
    if (!name) return;
    onAddCategory(name);
    set("category", name);
    setNewCat(""); setAddingCat(false);
  };

  const save = () => {
    if (!form.sku || !form.name || !form.category || form.costPrice === "" || form.sellPrice === "") {
      alert("กรุณากรอกข้อมูลสินค้าหลักให้ครบ"); return;
    }
    const cleanVariants = form.variants
      .filter((v) => v.sku || v.name)
      .map((v) => {
        if (!v.sku || !v.name || v.sellPrice === "") return null;
        return { id: v.id, sku: v.sku, name: v.name, sellPrice: Number(v.sellPrice) };
      });
    if (cleanVariants.includes(null)) { alert("สินค้าย่อยแต่ละรายการต้องกรอก รหัส/ชื่อ/ราคาขาย ให้ครบ"); return; }
    onSave({
      sku: form.sku, name: form.name, category: form.category,
      costPrice: Number(form.costPrice), sellPrice: Number(form.sellPrice),
      imageUrl: form.imageUrl, variants: cleanVariants,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "แก้ไขสินค้า" : "เพิ่มสินค้า"} width={620}
      footer={<><Btn variant="ghost" onClick={onClose}>ยกเลิก</Btn><Btn onClick={save}>บันทึกสินค้า</Btn></>}>
      <Field label="รูปสินค้า"><ImageField value={form.imageUrl} onChange={(v) => set("imageUrl", v)} /></Field>
      <div className="grid grid-cols-2 gap-x-3">
        <Field label="รหัสสินค้า" required><Input value={form.sku} onChange={(e) => set("sku", e.target.value)} /></Field>
        <Field label="ชื่อสินค้า" required><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <div className="col-span-2">
          <Field label="หมวดหมู่" required>
            {!addingCat ? (
              <Select value={form.category} onChange={(e) => { if (e.target.value === "__new__") setAddingCat(true); else set("category", e.target.value); }}>
                <option value="" disabled>เลือกหมวดหมู่</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                <option value="__new__">+ เพิ่มหมวดหมู่ใหม่</option>
              </Select>
            ) : (
              <div className="flex gap-2">
                <Input autoFocus placeholder="ชื่อหมวดหมู่ใหม่" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
                <Btn onClick={confirmNewCategory}>เพิ่ม</Btn>
                <Btn variant="ghost" onClick={() => { setAddingCat(false); setNewCat(""); }}>ยกเลิก</Btn>
              </div>
            )}
          </Field>
        </div>
        <Field label="ราคาทุนโดยประมาณ" required>
          <Input type="number" min="0" value={form.costPrice} onChange={(e) => set("costPrice", e.target.value)} />
          <div className="text-xs mt-1" style={{ color: C.faint }}>ใช้เป็นค่าเริ่มต้นตอนรับสต๊อกเข้าเท่านั้น ไม่ทับต้นทุนของล็อตที่มีอยู่แล้ว</div>
        </Field>
        <Field label="ราคาขาย" required><Input type="number" min="0" value={form.sellPrice} onChange={(e) => set("sellPrice", e.target.value)} /></Field>
      </div>

      <div className="mt-2 pt-4" style={{ borderTop: `1px dashed ${C.border}` }}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-sm font-bold flex items-center gap-1.5" style={{ color: C.text }}><Layers size={15} /> สินค้าย่อย (ตัวเลือกย่อย)</div>
            <div className="text-xs" style={{ color: C.sub }}>เช่น สี, ไซส์ — ไม่บังคับ กรอกแค่ รหัส / ชื่อ / ราคาขาย (สต๊อกเริ่มต้นให้ไปรับเข้าที่ปุ่ม "รับสินค้าเข้า" หลังบันทึก)</div>
          </div>
          <Btn variant="subtle" icon={Plus} onClick={addVariant}>เพิ่มสินค้าย่อย</Btn>
        </div>
        {form.variants.length === 0 ? (
          <div className="text-xs py-3 text-center rounded-xl" style={{ color: C.faint, background: C.bg }}>ยังไม่มีสินค้าย่อย</div>
        ) : (
          <div className="flex flex-col gap-2">
            {form.variants.map((v) => (
              <div key={v.id} className="grid gap-2 items-center p-2 rounded-xl" style={{ gridTemplateColumns: "1fr 1fr 100px auto", background: C.bg }}>
                <Input placeholder="รหัสสินค้าย่อย" value={v.sku} onChange={(e) => updateVariant(v.id, "sku", e.target.value)} style={{ padding: "7px 10px", fontSize: 13 }} />
                <Input placeholder="ชื่อ (เช่น ไซส์ M)" value={v.name} onChange={(e) => updateVariant(v.id, "name", e.target.value)} style={{ padding: "7px 10px", fontSize: 13 }} />
                <Input type="number" min="0" placeholder="ราคาขาย" value={v.sellPrice} onChange={(e) => updateVariant(v.id, "sellPrice", e.target.value)} style={{ padding: "7px 10px", fontSize: 13 }} />
                <IconBtn icon={X} tone="danger" title="ลบสินค้าย่อย" onClick={() => removeVariant(v.id)} />
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ============================== STOCK / LOT MANAGEMENT MODAL (FIFO) ============================== */
function StockAdjustModal({ open, onClose, product, moves, suppliers, onSubmit }) {
  const [target, setTarget] = useState("");
  const [type, setType] = useState("in");
  const [lots, setLots] = useState([{ id: uid(), supplierId: "", qty: "", costPrice: "" }]);
  const [outQty, setOutQty] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setTarget(""); setType("in");
      setLots([{ id: uid(), supplierId: "", qty: "", costPrice: product ? String(product.costPrice ?? "") : "" }]);
      setOutQty(""); setNote("");
    }
  }, [open, product]);

  if (!product) return null;
  const options = [{ id: "", label: `${product.name} (สินค้าหลัก) — คงเหลือ ${stockOf(product, null)}` },
    ...(product.variants || []).map((v) => ({ id: v.id, label: `${v.name} (${v.sku}) — คงเหลือ ${stockOf(product, v.id)}` }))];

  const addLotRow = () => setLots((l) => [...l, { id: uid(), supplierId: "", qty: "", costPrice: "" }]);
  const updateLot = (id, k, v) => setLots((l) => l.map((x) => x.id === id ? { ...x, [k]: v } : x));
  const removeLot = (id) => setLots((l) => l.filter((x) => x.id !== id));

  const activeLots = lotsFor(product, target || null);
  const outPreview = type === "out" && outQty ? (() => {
    const sim = deductFIFO(product.lots || [], target || null, Number(outQty) || 0);
    return sim;
  })() : null;

  const submit = () => {
    if (type === "in") {
      const cleanLots = lots.filter((l) => l.qty && Number(l.qty) > 0).map((l) => ({
        supplierId: l.supplierId || null, qty: Number(l.qty), costPrice: l.costPrice === "" ? (product.costPrice || 0) : Number(l.costPrice),
      }));
      if (cleanLots.length === 0) { alert("กรุณาระบุจำนวนอย่างน้อย 1 รายการ"); return; }
      onSubmit({ productId: product.id, variantId: target || null, type: "in", lots: cleanLots, note });
    } else {
      if (!outQty || Number(outQty) <= 0) { alert("กรุณาระบุจำนวนให้ถูกต้อง"); return; }
      if (Number(outQty) > stockOf(product, target || null)) { alert("จำนวนที่ตัดออกมากกว่าคงเหลือ"); return; }
      onSubmit({ productId: product.id, variantId: target || null, type: "out", qty: Number(outQty), note });
    }
  };

  const productMoves = moves.filter((m) => m.productId === product.id).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 40);
  const labelFor = (m) => m.variantId ? (product.variants || []).find((v) => v.id === m.variantId)?.name || "ตัวเลือกย่อย" : "สินค้าหลัก";
  const supplierName = (id) => suppliers.find((s) => s.id === id)?.name;

  return (
    <Modal open={open} onClose={onClose} title={`รับ/ตัดสต๊อก — ${product.name}`} width={640}>
      <div className="flex items-center gap-3 mb-4">
        <Thumb src={product.imageUrl} size={48} />
        <div>
          <div className="text-sm font-bold" style={{ color: C.text }}>{product.name}</div>
          <div className="text-xs" style={{ color: C.sub }}>รวมคงเหลือทั้งหมด {productTotalStock(product)} · มูลค่าสต๊อก {money(productStockValue(product))}</div>
        </div>
      </div>
      <Field label="เลือกรายการ (สินค้าหลัก หรือ สินค้าย่อย)">
        <Select value={target} onChange={(e) => setTarget(e.target.value)}>
          {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </Select>
      </Field>
      <Field label="ประเภทรายการ" required>
        <div className="flex gap-2">
          <button onClick={() => setType("in")} className="flex-1 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1"
            style={{ background: type === "in" ? C.successSoft : "#fff", color: type === "in" ? C.success : C.sub, border: `1px solid ${type === "in" ? C.success : C.border}` }}>
            <Plus size={14} /> รับสินค้าเข้า
          </button>
          <button onClick={() => setType("out")} className="flex-1 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1"
            style={{ background: type === "out" ? C.dangerSoft : "#fff", color: type === "out" ? C.danger : C.sub, border: `1px solid ${type === "out" ? C.danger : C.border}` }}>
            <Minus size={14} /> ตัดออก (FIFO)
          </button>
        </div>
      </Field>

      {type === "in" ? (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold" style={{ color: C.sub }}>รายการรับเข้า (แต่ละแถวจะถูกบันทึกเป็นล็อตแยก ต้นทุนไม่ปนกัน)</span>
            <Btn variant="subtle" icon={Plus} onClick={addLotRow}>เพิ่มรายการ</Btn>
          </div>
          <div className="flex flex-col gap-2">
            {lots.map((l) => (
              <div key={l.id} className="grid gap-2 items-center p-2 rounded-xl" style={{ gridTemplateColumns: "1fr 90px 110px auto", background: C.bg }}>
                <Select value={l.supplierId} onChange={(e) => updateLot(l.id, "supplierId", e.target.value)} style={{ padding: "7px 10px", fontSize: 13 }}>
                  <option value="">ไม่ระบุผู้จำหน่าย</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
                <Input type="number" min="0" placeholder="จำนวน" value={l.qty} onChange={(e) => updateLot(l.id, "qty", e.target.value)} style={{ padding: "7px 10px", fontSize: 13 }} />
                <Input type="number" min="0" placeholder="ต้นทุน/หน่วย" value={l.costPrice} onChange={(e) => updateLot(l.id, "costPrice", e.target.value)} style={{ padding: "7px 10px", fontSize: 13 }} />
                <IconBtn icon={X} tone="danger" title="ลบรายการ" onClick={() => removeLot(l.id)} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-3">
          <Field label="จำนวนที่ตัดออก" required><Input type="number" min="1" value={outQty} onChange={(e) => setOutQty(e.target.value)} /></Field>
          {outPreview && (
            <div className="text-xs rounded-lg p-2.5" style={{ background: C.warningSoft, color: C.warning }}>
              {outPreview.shortfall > 0
                ? `⚠ สต๊อกไม่พอ (ขาดอีก ${outPreview.shortfall})`
                : `จะตัดต้นทุนรวม ${money(outPreview.cost)} (คำนวณแบบ FIFO จากล็อตเก่าสุดก่อน)`}
            </div>
          )}
        </div>
      )}

      <Field label="หมายเหตุ"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="เช่น เลขที่เอกสาร" /></Field>
      <Btn className="w-full justify-center mb-4" onClick={submit}>บันทึกรายการสต๊อก</Btn>

      <div className="pt-3 mb-4" style={{ borderTop: `1px dashed ${C.border}` }}>
        <div className="text-xs font-semibold mb-2" style={{ color: C.sub }}>ล็อตคงเหลือ (เรียงเก่า→ใหม่ ตามลำดับ FIFO ที่จะถูกตัดก่อน)</div>
        {activeLots.length === 0 ? <EmptyState text="ยังไม่มีล็อตคงเหลือ" /> : (
          <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
            {activeLots.map((l, i) => (
              <div key={l.id} className="flex items-center justify-between px-3 py-2 text-xs" style={{ borderBottom: i < activeLots.length - 1 ? `1px solid ${C.border}` : "none", background: i === 0 ? C.successSoft : "#fff" }}>
                <div>
                  <span className="font-semibold" style={{ color: C.text }}>{fmtDate(l.date)}</span>
                  {l.supplierId && <span style={{ color: C.sub }}> · {supplierName(l.supplierId) || "-"}</span>}
                  {i === 0 && <span className="ml-1.5"><Badge tone="success">ตัดก่อน</Badge></span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="mono" style={{ color: C.text }}>ทุน {money(l.costPrice)}</span>
                  <span className="mono font-bold" style={{ color: C.text }}>{l.qty} ชิ้น</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-3" style={{ borderTop: `1px dashed ${C.border}` }}>
        <div className="text-xs font-semibold mb-2" style={{ color: C.sub }}>ประวัติการเคลื่อนไหวล่าสุด</div>
        <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto">
          {productMoves.length === 0 ? <EmptyState text="ยังไม่มีประวัติ" /> : productMoves.map((m) => (
            <div key={m.id} className="flex items-center justify-between text-xs px-2.5 py-2 rounded-lg" style={{ background: C.bg }}>
              <div>
                <span className="font-semibold" style={{ color: C.text }}>{labelFor(m)}</span>
                <span style={{ color: C.faint }}> · {fmtDateTime(m.date)}</span>
                {m.supplierId && <div style={{ color: C.sub }}>ผู้จำหน่าย: {supplierName(m.supplierId) || "-"}</div>}
                {m.cost != null && <div style={{ color: C.sub }}>ต้นทุนรวม: {money(m.cost)}</div>}
                {m.costPrice != null && <div style={{ color: C.sub }}>ต้นทุน/หน่วย: {money(m.costPrice)}</div>}
                {m.note && <div style={{ color: C.sub }}>{m.note}</div>}
              </div>
              <span className="mono font-bold" style={{ color: m.type === "in" ? C.success : C.danger }}>{m.type === "in" ? "+" : "-"}{num(m.qty)}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

/* ============================== RECEIPT / QUOTATION (A4 print) ============================== */
function DocRow({ label, value, bold }) {
  if (!value) return null;
  return <div className="flex gap-2 text-sm"><span style={{ color: C.sub, minWidth: 92 }}>{label}</span><span className={bold ? "font-bold" : ""}>{value}</span></div>;
}

function ReceiptView({ open, onClose, order, customer, shopInfo }) {
  const [docType, setDocType] = useState("receipt");
  const [includeVat, setIncludeVat] = useState(false);
  useEffect(() => { if (open) { setDocType("receipt"); setIncludeVat(false); } }, [open, order]);
  if (!open || !order) return null;

  const isQuote = docType === "quotation";
  const t = orderTotals(order);
  const preVat = t.subtotal + (order.shippingFee || 0);
  const vat = includeVat ? Math.round(preVat * 0.07 * 100) / 100 : 0;
  const grandTotal = preVat + vat - (order.discount || 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: "rgba(11,30,63,0.55)" }}>
      <div className="min-h-full flex flex-col items-center py-6 px-3">
        <div className="flex flex-wrap gap-2 mb-4 no-print sticky top-2 z-10 justify-center">
          <div className="flex rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}`, background: "#fff" }}>
            <button onClick={() => setDocType("receipt")} className="px-3.5 py-2 text-xs font-semibold" style={{ background: !isQuote ? C.accent : "#fff", color: !isQuote ? "#fff" : C.sub }}>ใบเสร็จรับเงิน</button>
            <button onClick={() => setDocType("quotation")} className="px-3.5 py-2 text-xs font-semibold" style={{ background: isQuote ? C.accent : "#fff", color: isQuote ? "#fff" : C.sub }}>ใบเสนอราคา</button>
          </div>
          <button onClick={() => setIncludeVat((v) => !v)} className="px-3.5 py-2 rounded-xl text-xs font-semibold" style={{ background: includeVat ? C.accentSoft : "#fff", color: includeVat ? C.accentDark : C.sub, border: `1px solid ${C.border}` }}>
            {includeVat ? "✓ " : ""}รวมภาษีมูลค่าเพิ่ม 7%
          </button>
          <Btn variant="ghost" onClick={onClose}>ปิดหน้าต่าง</Btn>
          <Btn icon={Printer} onClick={() => window.print()}>พิมพ์ (A4)</Btn>
        </div>

        <div className="printable" style={{ width: "210mm", maxWidth: "100%", background: "#fff", padding: "14mm", color: C.text, boxShadow: "0 10px 34px rgba(11,30,63,0.18)", borderRadius: 4 }}>
          <div className="mb-5">
            <div className="text-3xl font-extrabold leading-tight">{isQuote ? "ใบเสนอราคา" : "ใบเสร็จรับเงิน"}</div>
            <div className="text-lg font-bold" style={{ color: C.sub }}>{isQuote ? "Quotation" : "Receipt"}</div>
          </div>

          <div className="grid grid-cols-2 gap-6 py-4 text-sm" style={{ borderTop: `1px solid ${C.text}`, borderBottom: `1px solid ${C.text}` }}>
            <div className="flex flex-col gap-1">
              <DocRow label="ชื่อลูกค้า" value={customer?.name || "ลูกค้าทั่วไป"} bold />
              <DocRow label="ที่อยู่" value={customer?.address} />
              <DocRow label="เลขผู้เสียภาษี" value={customer?.taxId} />
              <DocRow label="อีเมล" value={customer?.email} />
              <DocRow label="เบอร์โทรศัพท์" value={customer?.phone} />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex gap-2 text-sm"><span style={{ color: C.sub, minWidth: 92 }}>เลขที่</span><span className="font-bold mono">{order.orderNo}</span></div>
              <DocRow label="วันที่" value={fmtDate(order.date)} />
              <DocRow label={isQuote ? "ยืนราคาถึง" : "ครบกำหนด"} value={fmtDate(addDays(order.date, isQuote ? 7 : 30))} />
              <DocRow label="อ้างอิง" value={channelOf(order.channel)?.label} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 py-4 text-sm" style={{ borderBottom: `1px solid ${C.border}` }}>
            <div className="flex flex-col gap-1">
              <DocRow label="ผู้ออก" value={shopInfo?.name || "ยังไม่ได้ตั้งค่าชื่อร้าน"} bold />
              <DocRow label="ที่อยู่" value={shopInfo?.address} />
            </div>
            <div className="flex flex-col gap-1">
              <DocRow label="เลขผู้เสียภาษี" value={shopInfo?.taxId} />
              <DocRow label="เบอร์โทร" value={shopInfo?.phone} />
              <DocRow label="อีเมล" value={shopInfo?.email} />
            </div>
          </div>

          <div className="mt-5 rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
            <table className="w-full text-sm">
              <thead><tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
                <th className="text-left py-2.5 px-3" style={{ color: C.sub }}>ลำดับ</th>
                <th className="text-left py-2.5 px-3" style={{ color: C.sub }}>รายการสินค้า</th>
                <th className="text-right py-2.5 px-3" style={{ color: C.sub }}>จำนวน</th>
                <th className="text-right py-2.5 px-3" style={{ color: C.sub }}>ราคา/หน่วย</th>
                <th className="text-right py-2.5 px-3" style={{ color: C.sub }}>ราคารวม</th>
              </tr></thead>
              <tbody>
                {order.items.map((it, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td className="py-2 px-3">{i + 1}</td><td className="py-2 px-3">{it.name}</td>
                    <td className="py-2 px-3 text-right mono">{it.qty}</td><td className="py-2 px-3 text-right mono">{money(it.price)}</td>
                    <td className="py-2 px-3 text-right mono">{money(it.qty * it.price)}</td>
                  </tr>
                ))}
                {Array.from({ length: Math.max(0, 4 - order.items.length) }).map((_, i) => (
                  <tr key={"blank" + i} style={{ borderBottom: `1px solid ${C.border}` }}><td className="py-2.5 px-3" colSpan={5}>&nbsp;</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-4">
            <div>
              <div className="text-xs font-semibold mb-1.5" style={{ color: C.sub }}>หมายเหตุ</div>
              <div className="rounded-lg h-24" style={{ border: `1px solid ${C.border}` }} />
            </div>
            <div className="flex flex-col gap-1.5 text-sm justify-end">
              <div className="flex justify-between"><span>ราคารวม</span><span className="mono">{money(preVat)}</span></div>
              {includeVat && <div className="flex justify-between"><span>ภาษีมูลค่าเพิ่ม (7%)</span><span className="mono">{money(vat)}</span></div>}
              <div className="flex justify-between"><span>ส่วนลด</span><span className="mono">{money(order.discount)}</span></div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4 px-4 py-3 rounded-lg" style={{ border: `1px solid ${C.text}` }}>
            <div className="font-bold">จำนวนเงินรวมทั้งสิ้น</div>
            <div className="text-right">
              <div className="font-extrabold text-lg mono">{money(grandTotal)}</div>
              <div className="text-xs" style={{ color: C.sub }}>({thaiBahtText(grandTotal)})</div>
            </div>
          </div>

          {!isQuote && (
            <div className="grid grid-cols-2 gap-6 mt-6 text-sm">
              <div>
                <div className="font-bold mb-2">การชำระเงิน</div>
                <div className="flex flex-col gap-1.5" style={{ color: C.sub }}>
                  <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full inline-block" style={{ border: `1.5px solid ${C.sub}` }} /> เงินสด</div>
                  <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full inline-block" style={{ border: `1.5px solid ${C.sub}` }} /> บัตรเดบิต / บัตรเครดิต</div>
                  <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full inline-block" style={{ border: `1.5px solid ${C.sub}` }} /> โอนผ่านบัญชี</div>
                </div>
              </div>
              <div>
                <div className="font-bold mb-2">หมายเหตุ</div>
                <div className="rounded-lg h-16" style={{ border: `1px solid ${C.border}` }} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-10 text-xs text-center mt-16" style={{ color: C.sub }}>
            <div>............................................<div className="mt-1">{isQuote ? "ผู้เสนอราคา" : "อนุมัติโดย"}</div><div className="mt-1">วันที่ ....................</div></div>
            <div>............................................<div className="mt-1">{isQuote ? "ผู้อนุมัติสั่งซื้อ" : "รับชำระ"}</div><div className="mt-1">วันที่ ....................</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================== SHOP SETTINGS MODAL ============================== */
function ShopSettingsModal({ open, onClose, shopInfo, onSave }) {
  const [form, setForm] = useState(shopInfo || {});
  useEffect(() => { setForm(shopInfo || {}); }, [shopInfo, open]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <Modal open={open} onClose={onClose} title="ข้อมูลร้านค้า (สำหรับใบเสร็จ/ใบเสนอราคา)" width={480}
      footer={<><Btn variant="ghost" onClick={onClose}>ยกเลิก</Btn><Btn onClick={() => { onSave(form); onClose(); }}>บันทึก</Btn></>}>
      <Field label="ชื่อร้าน/บริษัท" required><Input value={form.name || ""} onChange={(e) => set("name", e.target.value)} /></Field>
      <Field label="ที่อยู่"><TextArea rows={2} value={form.address || ""} onChange={(e) => set("address", e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-x-3">
        <Field label="เลขประจำตัวผู้เสียภาษี"><Input value={form.taxId || ""} onChange={(e) => set("taxId", e.target.value)} /></Field>
        <Field label="เบอร์โทร"><Input value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} /></Field>
      </div>
      <Field label="อีเมล"><Input value={form.email || ""} onChange={(e) => set("email", e.target.value)} /></Field>
    </Modal>
  );
}

/* ============================== SHELL ============================== */
const NAV = [
  { key: "dashboard", label: "แดชบอร์ด", icon: LayoutDashboard },
  { key: "products", label: "สินค้าและสต๊อก", icon: Package },
  { key: "orders", label: "ออเดอร์", icon: ShoppingCart },
  { key: "parties", label: "ลูกค้า/ผู้จำหน่าย", icon: Users },
  { key: "finance", label: "รายรับ-รายจ่าย", icon: Wallet },
  { key: "reports", label: "รายงาน", icon: FileBarChart },
];

function Sidebar({ page, setPage, open, setOpen, onReset, onOpenSettings }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-30 md:hidden" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setOpen(false)} />}
      <aside className={`fixed md:static z-40 top-0 bottom-0 left-0 w-64 flex flex-col transition-transform ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`} style={{ background: C.sidebar }}>
        <div className="px-5 py-5 flex items-center gap-2.5" style={{ borderBottom: `1px solid ${C.sidebarLine}` }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: C.accent }}><Package size={18} color="#fff" /></div>
          <div>
            <div className="text-white font-extrabold text-sm leading-tight">StockFlow</div>
            <div className="text-[11px]" style={{ color: "#7C8CB0" }}>Inventory & Orders</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {NAV.map((item) => {
            const active = page === item.key;
            return (
              <button key={item.key} onClick={() => { setPage(item.key); setOpen(false); }}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition"
                style={{ background: active ? C.accent : "transparent", color: active ? "#fff" : "#B8C4E0" }}>
                <item.icon size={17} />{item.label}
              </button>
            );
          })}
        </nav>
        <div className="px-3 py-4 flex flex-col gap-1" style={{ borderTop: `1px solid ${C.sidebarLine}` }}>
          <button onClick={onOpenSettings} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium" style={{ color: "#B8C4E0" }}>
            <Receipt size={16} /> ข้อมูลร้านค้า
          </button>
          <button onClick={onReset} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium" style={{ color: "#7C8CB0" }}>
            <RotateCcw size={16} /> ล้างข้อมูลทั้งหมด
          </button>
        </div>
      </aside>
    </>
  );
}

function Topbar({ title, onMenu }) {
  return (
    <div className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-7 py-3.5 no-print" style={{ background: "rgba(242,246,252,0.9)", backdropFilter: "blur(6px)", borderBottom: `1px solid ${C.border}` }}>
      <div className="flex items-center gap-3">
        <button className="md:hidden p-2 rounded-lg" style={{ border: `1px solid ${C.border}`, background: "#fff" }} onClick={onMenu}><Menu size={17} /></button>
        <span className="font-bold text-sm" style={{ color: C.text }}>{title}</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "#fff", border: `1px solid ${C.border}` }}>
        <CircleUser size={16} style={{ color: C.accent }} />
        <span className="text-xs font-semibold" style={{ color: C.text }}>ผู้ดูแลระบบ</span>
      </div>
    </div>
  );
}

/* ============================== DASHBOARD ============================== */
function MonthlyTrendCard({ orders }) {
  const thisYear = new Date().getFullYear();
  const years = [0, 1, 2, 3, 4].map((n) => thisYear - n);
  const [year, setYear] = useState(thisYear);

  const monthly = useMemo(() => {
    const rows = MONTHS_TH.map((label, i) => ({ label, m: i, sales: 0, profit: 0 }));
    orders.forEach((o) => {
      const d = new Date(o.date);
      if (d.getFullYear() !== year) return;
      const t = orderTotals(o);
      rows[d.getMonth()].sales += t.total;
      rows[d.getMonth()].profit += t.profit;
    });
    return rows;
  }, [orders, year]);

  const yearTotal = monthly.reduce((s, r) => s + r.sales, 0);
  const yearProfit = monthly.reduce((s, r) => s + r.profit, 0);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-1">
        <div className="font-bold text-sm" style={{ color: C.text }}>ยอดขายและกำไรรายเดือน</div>
        <Select value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ width: 100, padding: "5px 8px", fontSize: 12 }}>
          {years.map((y) => <option key={y} value={y}>ปี {y + 543}</option>)}
        </Select>
      </div>
      <div className="text-xs mb-3" style={{ color: C.sub }}>
        รวมทั้งปี: <span className="mono font-semibold" style={{ color: C.text }}>{money(yearTotal)}</span> · กำไร: <span className="mono font-semibold" style={{ color: yearProfit >= 0 ? C.success : C.danger }}>{money(yearProfit)}</span>
      </div>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={monthly}>
          <CartesianGrid stroke={C.border} vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.sub }} axisLine={{ stroke: C.border }} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: C.sub }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? v / 1000 + "k" : v)} />
          <Tooltip formatter={(v) => money(v)} contentStyle={{ borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="sales" name="ยอดขาย" fill={C.accent} radius={[4, 4, 0, 0]} />
          <Bar dataKey="profit" name="กำไร" fill={C.success} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

function Dashboard({ data }) {
  const [gran, setGran] = useState("day");
  const [customFrom, setCustomFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10); });
  const [customTo, setCustomTo] = useState(() => new Date().toISOString().slice(0, 10));
  const productsById = useMemo(() => Object.fromEntries(data.products.map((p) => [p.id, p])), [data.products]);

  const { rangeStart, rangeEnd } = useMemo(() => {
    const now = new Date();
    if (gran === "day") { const s = new Date(now); s.setDate(s.getDate() - 29); s.setHours(0, 0, 0, 0); return { rangeStart: s, rangeEnd: now }; }
    if (gran === "month") { const s = new Date(now); s.setMonth(s.getMonth() - 11); s.setHours(0, 0, 0, 0); return { rangeStart: s, rangeEnd: now }; }
    if (gran === "year") { const s = new Date(now); s.setFullYear(s.getFullYear() - 4); s.setHours(0, 0, 0, 0); return { rangeStart: s, rangeEnd: now }; }
    const s = new Date(customFrom); s.setHours(0, 0, 0, 0);
    const e = new Date(customTo); e.setHours(23, 59, 59, 999);
    return { rangeStart: s, rangeEnd: e };
  }, [gran, customFrom, customTo]);

  const inRange = useMemo(() => data.orders.filter((o) => { const d = new Date(o.date); return d >= rangeStart && d <= rangeEnd; }), [data.orders, rangeStart, rangeEnd]);

  const chartData = useMemo(() => {
    const map = new Map();
    inRange.forEach((o) => {
      const key = gran === "day" || gran === "custom" ? isoDay(o.date) : gran === "month" ? new Date(o.date).toISOString().slice(0, 7) : String(new Date(o.date).getFullYear());
      const t = orderTotals(o);
      if (!map.has(key)) map.set(key, { key, sales: 0, profit: 0 });
      const rec = map.get(key); rec.sales += t.total; rec.profit += t.profit;
    });
    return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key)).map((r) => ({
      ...r, label: gran === "month" ? new Date(r.key + "-01").toLocaleDateString("th-TH", { month: "short", year: "2-digit" }) : gran === "year" ? r.key : fmtDate(r.key),
    }));
  }, [inRange, gran]);

  const totals = useMemo(() => {
    let sales = 0, cost = 0, profit = 0;
    inRange.forEach((o) => { const t = orderTotals(o); sales += t.total; cost += t.cost; profit += t.profit; });
    const expenseInRange = data.financeEntries.filter((f) => new Date(f.date) >= rangeStart && new Date(f.date) <= rangeEnd && f.type === "expense").reduce((s, f) => s + f.amount, 0);
    const stockQty = data.products.reduce((s, p) => s + productTotalStock(p), 0);
    const stockValue = data.products.reduce((s, p) => s + productRetailValue(p), 0);
    const stockCost = data.products.reduce((s, p) => s + productStockValue(p), 0);
    return { sales, cost, netProfit: profit - expenseInRange, orderCount: inRange.length, stockQty, stockValue, stockCost, revenue: sales };
  }, [inRange, data, rangeStart, rangeEnd]);

  const categoryBreakdown = useMemo(() => {
    const map = new Map();
    inRange.forEach((o) => o.items.forEach((it) => {
      const p = productsById[it.productId]; if (!p) return;
      map.set(p.category, (map.get(p.category) || 0) + it.qty * it.price);
    }));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [inRange, productsById]);

  const bestSellers = useMemo(() => {
    const map = new Map();
    inRange.forEach((o) => o.items.forEach((it) => {
      const key = it.productId + "|" + (it.variantId || "");
      const cur = map.get(key) || { name: it.name, imageUrl: it.imageUrl, qty: 0 };
      cur.qty += it.qty; map.set(key, cur);
    }));
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [inRange]);

  const PIE_COLORS = [C.accent, C.success, C.warning, C.danger, "#6E5AC8"];
  const periodLabel = gran === "day" ? "30 วันล่าสุด" : gran === "month" ? "12 เดือนล่าสุด" : gran === "year" ? "5 ปีล่าสุด" : `${fmtDate(customFrom)} - ${fmtDate(customTo)}`;

  return (
    <div>
      <PageHeader title="แดชบอร์ดภาพรวม" subtitle="สรุปยอดขาย กำไร และสถานะสต๊อกแบบเรียลไทม์"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
              {[{ k: "day", l: "รายวัน" }, { k: "month", l: "รายเดือน" }, { k: "year", l: "รายปี" }, { k: "custom", l: "กำหนดเอง" }].map((g) => (
                <button key={g.k} onClick={() => setGran(g.k)} className="px-3.5 py-2 text-xs font-semibold" style={{ background: gran === g.k ? C.accent : "#fff", color: gran === g.k ? "#fff" : C.sub }}>{g.l}</button>
              ))}
            </div>
            {gran === "custom" && (
              <div className="flex items-center gap-2">
                <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} style={{ width: 145, padding: "7px 10px", fontSize: 12 }} />
                <span className="text-xs" style={{ color: C.sub }}>ถึง</span>
                <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} style={{ width: 145, padding: "7px 10px", fontSize: 12 }} />
              </div>
            )}
          </div>
        } />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="ยอดขาย" value={money(totals.sales)} sub={periodLabel} icon={TrendingUp} tone="default" />
        <StatCard label="ต้นทุนขาย" value={money(totals.cost)} sub={periodLabel} icon={Package} tone="warning" />
        <StatCard label="กำไรสุทธิ" value={money(totals.netProfit)} sub={periodLabel} icon={totals.netProfit >= 0 ? TrendingUp : TrendingDown} tone={totals.netProfit >= 0 ? "success" : "danger"} />
        <StatCard label="จำนวนออเดอร์" value={num(totals.orderCount)} sub={periodLabel} icon={ShoppingCart} tone="default" />
        <StatCard label="สต๊อก" value={num(totals.stockQty)} icon={Package} tone="default" sub="จำนวนคงเหลือทั้งหมด" />
        <StatCard label="มูลค่าสต๊อก" value={money(totals.stockValue)} icon={Package} tone="default" sub="คิดที่ราคาขาย" />
        <StatCard label="ต้นทุนสต๊อก" value={money(totals.stockCost)} icon={Package} tone="warning" sub="คิดที่ต้นทุนจริง (FIFO)" />
        <StatCard label="รายรับรวม" value={money(totals.revenue)} sub={periodLabel} icon={Wallet} tone="success" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-5">
        <Card className="p-4 xl:col-span-2">
          <div className="font-bold text-sm mb-3" style={{ color: C.text }}>แนวโน้มยอดขายและกำไร</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid stroke={C.border} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.sub }} axisLine={{ stroke: C.border }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: C.sub }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? v / 1000 + "k" : v)} />
              <Tooltip formatter={(v) => money(v)} contentStyle={{ borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 12 }} />
              <Line type="monotone" dataKey="sales" name="ยอดขาย" stroke={C.accent} strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="profit" name="กำไร" stroke={C.success} strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-4">
          <div className="font-bold text-sm mb-3" style={{ color: C.text }}>ยอดขายตามหมวดหมู่</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={categoryBreakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                {categoryBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => money(v)} contentStyle={{ borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="font-bold text-sm mb-3" style={{ color: C.text }}>สินค้าขายดี (ตามช่วงเวลาที่เลือก)</div>
          {bestSellers.length === 0 ? <EmptyState text="ไม่มีข้อมูล" /> : (
            <div className="flex flex-col gap-2.5">
              {bestSellers.map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Thumb src={b.imageUrl} size={32} />
                  <div className="flex-1">
                    <div className="text-sm font-semibold" style={{ color: C.text }}>{b.name}</div>
                    <div className="w-full h-1.5 rounded-full mt-1" style={{ background: "#EEF1F8" }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${(b.qty / bestSellers[0].qty) * 100}%`, background: C.accent }} />
                    </div>
                  </div>
                  <div className="mono text-sm font-bold" style={{ color: C.text }}>{num(b.qty)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <MonthlyTrendCard orders={data.orders} />
      </div>
    </div>
  );
}

/* ============================== PRODUCTS PAGE ============================== */
function ProductsPage({ data, actions }) {
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(null);
  const [del, setDel] = useState(null);
  const [stockTarget, setStockTarget] = useState(null);
  const [expanded, setExpanded] = useState(new Set());

  const toggleExpand = (id) => setExpanded((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const filtered = data.products.filter((p) => !q || [p.sku, p.name, p.category].some((v) => v.toLowerCase().includes(q.toLowerCase())));

  return (
    <div>
      <PageHeader title="สินค้าและสต๊อก" subtitle={`ทั้งหมด ${data.products.length} รายการ — รับเข้า/ตัดสต๊อกแบบ FIFO แยกต้นทุนตามล็อต`}
        actions={<Btn icon={Plus} onClick={() => setModal({})}>เพิ่มสินค้า</Btn>} />

      <Card className="p-4">
        <SearchBox value={q} onChange={setQ} placeholder="ค้นหาสินค้า..." />
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
              <th className="w-8"></th>
              <th className="text-left py-2 px-2 text-xs font-semibold" style={{ color: C.sub }}>รูป</th>
              <th className="text-left py-2 px-2 text-xs font-semibold" style={{ color: C.sub }}>รหัส</th>
              <th className="text-left py-2 px-2 text-xs font-semibold" style={{ color: C.sub }}>ชื่อสินค้า</th>
              <th className="text-left py-2 px-2 text-xs font-semibold" style={{ color: C.sub }}>หมวดหมู่</th>
              <th className="text-right py-2 px-2 text-xs font-semibold" style={{ color: C.sub }}>ทุนเฉลี่ย</th>
              <th className="text-right py-2 px-2 text-xs font-semibold" style={{ color: C.sub }}>ราคาขาย</th>
              <th className="text-right py-2 px-2 text-xs font-semibold" style={{ color: C.sub }}>คงเหลือรวม</th>
              <th className="text-right py-2 px-2 text-xs font-semibold" style={{ color: C.sub }}>จัดการ</th>
            </tr></thead>
            <tbody>
              {filtered.map((p) => {
                const hasVariants = (p.variants || []).length > 0;
                const isOpen = expanded.has(p.id);
                return (
                  <React.Fragment key={p.id}>
                    <tr className="hover:bg-black/[0.02]" style={{ borderBottom: hasVariants && isOpen ? "none" : `1px solid ${C.border}` }}>
                      <td className="py-2 px-1 text-center">
                        {hasVariants && (
                          <button onClick={() => toggleExpand(p.id)} className="p-1 rounded hover:bg-black/5">
                            {isOpen ? <ChevronDown size={14} style={{ color: C.sub }} /> : <ChevronRight size={14} style={{ color: C.sub }} />}
                          </button>
                        )}
                      </td>
                      <td className="py-2 px-2"><Thumb src={p.imageUrl} size={40} /></td>
                      <td className="py-2 px-2 mono">{p.sku}</td>
                      <td className="py-2 px-2">
                        {p.name}
                        {hasVariants && <span className="ml-1.5"><Badge tone="accent">{p.variants.length} ตัวเลือก</Badge></span>}
                      </td>
                      <td className="py-2 px-2"><Badge>{p.category}</Badge></td>
                      <td className="py-2 px-2 text-right mono">{money(avgCostOf(p, null))}</td>
                      <td className="py-2 px-2 text-right mono">{money(p.sellPrice)}</td>
                      <td className="py-2 px-2 text-right mono font-bold">{num(productTotalStock(p))}</td>
                      <td className="py-2 px-2">
                        <div className="flex justify-end gap-1">
                          <IconBtn icon={ArrowLeftRight} tone="accent" title="รับ/ตัดสต๊อก" onClick={() => setStockTarget(p)} />
                          <IconBtn icon={Pencil} tone="accent" title="แก้ไข" onClick={() => setModal(p)} />
                          <IconBtn icon={Trash2} tone="danger" title="ลบ" onClick={() => setDel(p)} />
                        </div>
                      </td>
                    </tr>
                    {hasVariants && isOpen && (
                      <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td></td>
                        <td colSpan={8} className="pb-3 pt-1 px-2">
                          <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                            {p.variants.map((v) => (
                              <div key={v.id} className="flex items-center justify-between px-3 py-2 text-xs" style={{ borderBottom: `1px solid ${C.border}`, background: C.bg }}>
                                <div className="flex items-center gap-2">
                                  <span className="mono" style={{ color: C.sub }}>{v.sku}</span>
                                  <span className="font-semibold" style={{ color: C.text }}>{v.name}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="mono" style={{ color: C.sub }}>ทุนเฉลี่ย {money(avgCostOf(p, v.id))}</span>
                                  <span className="mono" style={{ color: C.text }}>{money(v.sellPrice)}</span>
                                  <span className="mono font-bold" style={{ color: C.text }}>คงเหลือ {stockOf(p, v.id)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <EmptyState text="ไม่พบข้อมูล" />}
        </div>
      </Card>

      <ProductModal open={!!modal} onClose={() => setModal(null)} initial={modal} categories={data.categories} onAddCategory={actions.addCategory}
        onSave={(payload) => { if (modal && modal.id) actions.editProduct({ ...modal, ...payload }); else actions.addProduct({ id: uid(), ...payload }); actions.notify("บันทึกสินค้าแล้ว"); setModal(null); }} />
      <StockAdjustModal open={!!stockTarget} onClose={() => setStockTarget(null)} product={stockTarget} moves={data.stockMoves} suppliers={data.suppliers}
        onSubmit={(payload) => { actions.addStockMove(payload); actions.notify(payload.type === "in" ? "รับสินค้าเข้าแล้ว" : "ตัดสต๊อกแล้ว"); }} />
      <ConfirmDialog open={!!del} onCancel={() => setDel(null)} message={`ต้องการลบ "${del?.name || ""}" ใช่หรือไม่? (รวมสินค้าย่อยทั้งหมด)`}
        onConfirm={() => { actions.deleteProduct(del.id); actions.notify("ลบสินค้าแล้ว"); setDel(null); }} />
    </div>
  );
}

/* ============================== ORDERS PAGE ============================== */
/* ============================== PRODUCT SEARCH MODAL (floating cart button opens this) ============================== */
function ProductSearchModal({ open, onClose, products, onPick }) {
  const [q, setQ] = useState("");
  useEffect(() => { if (open) setQ(""); }, [open]);
  const filtered = products.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase()));
  return (
    <Modal open={open} onClose={onClose} title="เพิ่มสินค้าลงออเดอร์" width={560}>
      <SearchBox value={q} onChange={setQ} placeholder="ค้นหาสินค้า..." />
      <div className="flex flex-col gap-2.5 mt-4 max-h-[440px] overflow-y-auto pr-1">
        {filtered.map((p) => {
          const mainAvail = stockOf(p, null);
          return (
            <div key={p.id} className="p-3 rounded-xl" style={{ border: `1px solid ${C.border}` }}>
              <button onClick={() => onPick(p)} disabled={mainAvail <= 0 || (p.variants || []).length > 0}
                className="flex gap-3 items-center w-full text-left disabled:cursor-default">
                <Thumb src={p.imageUrl} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate" style={{ color: C.text }}>{p.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: C.sub }}>{p.sku} · คงเหลือ {mainAvail}</div>
                  <div className="mono text-sm font-bold mt-1" style={{ color: C.accent }}>{money(p.sellPrice)}</div>
                </div>
                {(p.variants || []).length === 0 && <Plus size={16} style={{ color: C.accent }} />}
              </button>
              {(p.variants || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2.5" style={{ borderTop: `1px dashed ${C.border}` }}>
                  {p.variants.map((v) => {
                    const vAvail = stockOf(p, v.id);
                    return (
                      <button key={v.id} onClick={() => onPick(p, v)} disabled={vAvail <= 0}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
                        style={{ background: C.accentSoft, color: C.accentDark, border: `1px solid ${C.accentSoft}` }}>
                        {v.name} · {money(v.sellPrice)} · เหลือ {vAvail}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <EmptyState text="ไม่พบสินค้า" />}
      </div>
    </Modal>
  );
}

/* ============================== ORDERS PAGE ============================== */
/* ============================== ORDERS PAGE ============================== */
function OrdersPage({ data, actions, shopInfo }) {
  const [tab, setTab] = useState("list");
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerTaxId, setCustomerTaxId] = useState("");
  const [channel, setChannel] = useState("");
  const [discount, setDiscount] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);
  const [orderSearch, setOrderSearch] = useState("");
  const [detail, setDetail] = useState(null);
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  const customersById = Object.fromEntries(data.customers.map((c) => [c.id, c]));
  const productsById = Object.fromEntries(data.products.map((p) => [p.id, p]));

  const resetForm = () => {
    setCart([]); setDiscount(0); setShippingFee(0); setChannel(""); setEditingOrder(null);
    setCustomerName(""); setCustomerPhone(""); setCustomerAddress(""); setCustomerEmail(""); setCustomerTaxId("");
  };
  const selectExistingCustomer = (c) => {
    setCustomerName(c.name); setCustomerPhone(c.phone || ""); setCustomerAddress(c.address || ""); setCustomerEmail(c.email || ""); setCustomerTaxId(c.taxId || "");
  };

  const addToCart = (p, variant) => {
    const variantId = variant ? variant.id : null;
    const price = variant ? variant.sellPrice : p.sellPrice;
    const avail = stockOf(p, variantId);
    const estCost = avgCostOf(p, variantId);
    const name = variant ? `${p.name} — ${variant.name}` : p.name;
    const sku = variant ? variant.sku : p.sku;
    if (avail <= 0) return;
    setCart((c) => {
      const existing = c.find((i) => i.productId === p.id && (i.variantId || null) === variantId);
      if (existing) return c.map((i) => i === existing ? { ...i, qty: Math.min(i.qty + 1, avail) } : i);
      return [...c, { productId: p.id, variantId, sku, name, price, cost: estCost, qty: 1, imageUrl: p.imageUrl, avail }];
    });
    actions.notify(`เพิ่ม "${name}" แล้ว`);
  };
  const updateQty = (idx, qty, avail) => setCart((c) => c.map((i, ix) => ix === idx ? { ...i, qty: Math.max(1, Math.min(Number(qty) || 1, avail)) } : i));
  const removeFromCart = (idx) => setCart((c) => c.filter((_, ix) => ix !== idx));

  const subtotal = cart.reduce((s, i) => s + i.qty * i.price, 0);
  const estCostTotal = cart.reduce((s, i) => s + i.qty * i.cost, 0);
  const total = subtotal - Number(discount || 0) + Number(shippingFee || 0);
  const estProfit = total - estCostTotal;

  const resolveCustomerId = () => {
    const name = customerName.trim();
    if (!name) return null;
    const match = data.customers.find((c) => c.name.trim().toLowerCase() === name.toLowerCase());
    if (match) {
      actions.editCustomer({ id: match.id, name: match.name, phone: customerPhone || match.phone, address: customerAddress || match.address, email: customerEmail || match.email, taxId: customerTaxId || match.taxId });
      return match.id;
    }
    const newId = uid();
    actions.addCustomer({ id: newId, name, phone: customerPhone, address: customerAddress, email: customerEmail, taxId: customerTaxId });
    return newId;
  };

  const submitOrder = (status) => {
    if (cart.length === 0) { alert("กรุณาเลือกสินค้าอย่างน้อย 1 รายการ"); return; }
    const customerId = resolveCustomerId();
    const payload = {
      customerId, channel: channel || null,
      items: cart.map(({ avail, ...rest }) => rest), discount: Number(discount || 0), shippingFee: Number(shippingFee || 0),
      status, note: "",
    };
    if (editingOrder) {
      actions.updateOrder(editingOrder.id, { ...payload, orderNo: editingOrder.orderNo, date: editingOrder.date });
      actions.notify("แก้ไขออเดอร์เรียบร้อยแล้ว");
    } else {
      actions.addOrder({ orderNo: "ORD-" + String(data.orders.length + 1).padStart(5, "0"), date: new Date().toISOString(), ...payload });
      actions.notify(status === "pending" ? "บันทึกออเดอร์ไว้ก่อนแล้ว" : "ปิดรายการเรียบร้อยแล้ว");
    }
    resetForm();
    setTab("list");
  };

  const startEditOrder = (order) => {
    actions.reverseOrderStock(order);
    const cust = customersById[order.customerId];
    if (cust) selectExistingCustomer(cust); else { setCustomerName(""); setCustomerPhone(""); setCustomerAddress(""); setCustomerEmail(""); setCustomerTaxId(""); }
    setChannel(order.channel || "");
    setDiscount(order.discount || 0);
    setShippingFee(order.shippingFee || 0);
    setCart(order.items.map((it) => {
      const p = productsById[it.productId];
      const avail = (p ? stockOf(p, it.variantId) : 0) + it.qty;
      return { ...it, avail };
    }));
    setEditingOrder(order);
    setDetail(null);
    setTab("new");
  };

  const cancelEditOrder = () => {
    if (editingOrder) actions.restoreOrderStock(editingOrder);
    resetForm();
    actions.notify("ยกเลิกการแก้ไขแล้ว");
    setTab("list");
  };

  const goToListTab = () => {
    if (editingOrder) cancelEditOrder();
    else setTab("list");
  };

  const orders = [...data.orders].sort((a, b) => new Date(b.date) - new Date(a.date))
    .filter((o) => !orderSearch || o.orderNo.toLowerCase().includes(orderSearch.toLowerCase()) || (customersById[o.customerId]?.name || "").toLowerCase().includes(orderSearch.toLowerCase()));

  return (
    <div>
      <PageHeader title="ระบบออเดอร์" subtitle="สร้างออเดอร์ คำนวณยอดอัตโนมัติ และตัดสต๊อกแบบ FIFO ทันที"
        actions={<Btn icon={Plus} onClick={() => { resetForm(); setTab("new"); }}>สร้างออเดอร์ใหม่</Btn>} />

      <div className="flex gap-2 mb-4">
        <button onClick={goToListTab} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: tab === "list" ? C.accent : "#fff", color: tab === "list" ? "#fff" : C.sub, border: `1px solid ${tab === "list" ? C.accent : C.border}` }}>รายการออเดอร์</button>
        <button onClick={() => setTab("new")} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: tab === "new" ? C.accent : "#fff", color: tab === "new" ? "#fff" : C.sub, border: `1px solid ${tab === "new" ? C.accent : C.border}` }}>{editingOrder ? `แก้ไข ${editingOrder.orderNo}` : "คีย์ออเดอร์ใหม่"}</button>
      </div>

      {tab === "new" ? (
        <div className="max-w-2xl">
          <CollapseCard title="รายละเอียดลูกค้า" defaultOpen={true}>
            <Field label="ช่องทางการขาย">
              <Select value={channel} onChange={(e) => setChannel(e.target.value)}>
                <option value="">ไม่ระบุ</option>
                {CHANNELS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </Select>
            </Field>
            <Field label="ชื่อลูกค้า">
              <NameAutocomplete value={customerName} onChange={setCustomerName} onSelect={selectExistingCustomer}
                options={data.customers} placeholder="พิมพ์ชื่อลูกค้า (เว้นว่างได้ถ้าเป็นลูกค้าทั่วไป)" />
            </Field>
            <div className="grid grid-cols-2 gap-x-3">
              <Field label="เบอร์โทร"><Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} /></Field>
              <Field label="อีเมล"><Input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} /></Field>
            </div>
            <Field label="ที่อยู่"><TextArea rows={2} value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} /></Field>
            <Field label="เลขประจำตัวผู้เสียภาษี"><Input value={customerTaxId} onChange={(e) => setCustomerTaxId(e.target.value)} /></Field>
          </CollapseCard>

          <Card className="p-4 mb-24">
            <div className="font-bold text-sm mb-3" style={{ color: C.text }}>รายละเอียดสินค้า</div>
            <div className="flex flex-col gap-2 mb-3">
              {cart.length === 0 ? (
                <div className="py-10 text-center text-sm" style={{ color: C.faint }}>
                  ยังไม่มีสินค้า — กดปุ่มตะกร้าด้านล่างขวาเพื่อเพิ่มสินค้า
                </div>
              ) : cart.map((i, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-xl" style={{ background: C.bg }}>
                  <Thumb src={i.imageUrl} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: C.text }}>{i.name}</div>
                    <div className="mono text-xs" style={{ color: C.sub }}>{money(i.price)}</div>
                  </div>
                  <Input type="number" min="1" max={i.avail} value={i.qty} onChange={(e) => updateQty(idx, e.target.value, i.avail)} style={{ width: 60, padding: "6px 8px", textAlign: "center" }} />
                  <IconBtn icon={X} tone="danger" onClick={() => removeFromCart(idx)} />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-x-3 mb-3">
              <Field label="ส่วนลด (บาท)"><Input type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} /></Field>
              <Field label="ค่าจัดส่ง (บาท)"><Input type="number" min="0" value={shippingFee} onChange={(e) => setShippingFee(e.target.value)} /></Field>
            </div>

            {cart.length > 0 && (
              <div className="rounded-xl p-3 flex flex-col gap-1.5 mb-4" style={{ background: C.accentSoft }}>
                <div className="flex justify-between text-xs" style={{ color: C.sub }}><span>ยอดรวมสินค้า</span><span className="mono">{money(subtotal)}</span></div>
                <div className="flex justify-between text-xs" style={{ color: C.sub }}><span>ส่วนลด</span><span className="mono">-{money(discount)}</span></div>
                <div className="flex justify-between text-xs" style={{ color: C.sub }}><span>ค่าจัดส่ง</span><span className="mono">+{money(shippingFee)}</span></div>
                <div className="flex justify-between text-sm font-bold pt-1.5" style={{ color: C.accentDark, borderTop: `1px dashed ${C.accent}` }}><span>ยอดชำระสุทธิ</span><span className="mono">{money(total)}</span></div>
                <div className="flex justify-between text-xs pt-1" style={{ color: C.sub }}><span>ต้นทุนโดยประมาณ</span><span className="mono">{money(estCostTotal)}</span></div>
                <div className="flex justify-between text-xs font-bold" style={{ color: estProfit >= 0 ? C.success : C.danger }}><span>กำไรโดยประมาณ</span><span className="mono">{money(estProfit)}</span></div>
                <div className="text-[11px]" style={{ color: C.faint }}>* ต้นทุนจริงคำนวณแบบ FIFO ตอนกดยืนยัน อาจต่างจากตัวเลขนี้เล็กน้อย</div>
              </div>
            )}

            {editingOrder && <Btn variant="ghost" className="w-full justify-center mb-2" onClick={cancelEditOrder}>ยกเลิกการแก้ไข</Btn>}
            <div className="grid grid-cols-2 gap-2">
              <Btn variant="ghost" className="justify-center" onClick={() => submitOrder("pending")}>บันทึกก่อน</Btn>
              <Btn className="justify-center" onClick={() => submitOrder("closed")}>ปิดรายการ</Btn>
            </div>
          </Card>

          <button onClick={() => setPickerOpen(true)}
            className="fixed bottom-6 right-6 z-40 w-16 h-16 rounded-full flex items-center justify-center no-print"
            style={{ background: C.accent, color: "#fff", boxShadow: "0 10px 24px rgba(29,79,196,0.4)" }}
            title="เพิ่มสินค้า">
            <ShoppingCart size={22} />
            <Plus size={13} style={{ position: "absolute", top: 10, right: 10 }} />
          </button>

          <ProductSearchModal open={pickerOpen} onClose={() => setPickerOpen(false)} products={data.products} onPick={(p, v) => addToCart(p, v)} />
        </div>
      ) : (
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <SearchBox value={orderSearch} onChange={setOrderSearch} placeholder="ค้นหาเลขออเดอร์หรือลูกค้า..." />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
                <th className="text-left py-2 px-2 text-xs font-semibold" style={{ color: C.sub }}>เลขออเดอร์</th>
                <th className="text-left py-2 px-2 text-xs font-semibold" style={{ color: C.sub }}>วันที่</th>
                <th className="text-left py-2 px-2 text-xs font-semibold" style={{ color: C.sub }}>ลูกค้า</th>
                <th className="text-left py-2 px-2 text-xs font-semibold" style={{ color: C.sub }}>ช่องทาง</th>
                <th className="text-right py-2 px-2 text-xs font-semibold" style={{ color: C.sub }}>รายรับ</th>
                <th className="text-right py-2 px-2 text-xs font-semibold" style={{ color: C.sub }}>กำไร</th>
                <th className="text-center py-2 px-2 text-xs font-semibold" style={{ color: C.sub }}>สถานะ</th>
                <th></th>
              </tr></thead>
              <tbody>
                {orders.slice(0, 300).map((o) => {
                  const t = orderTotals(o);
                  return (
                    <tr key={o.id} className="hover:bg-black/[0.02] cursor-pointer" style={{ borderBottom: `1px solid ${C.border}` }} onClick={() => setDetail(o)}>
                      <td className="py-2.5 px-2 font-semibold mono">{o.orderNo}</td>
                      <td className="py-2.5 px-2 text-xs" style={{ color: C.sub }}>{fmtDateTime(o.date)}</td>
                      <td className="py-2.5 px-2">{customersById[o.customerId]?.name || "ลูกค้าทั่วไป"}</td>
                      <td className="py-2.5 px-2"><ChannelTag channel={o.channel} /></td>
                      <td className="py-2.5 px-2 text-right mono font-semibold">{money(t.total)}</td>
                      <td className="py-2.5 px-2 text-right mono font-semibold" style={{ color: t.profit >= 0 ? C.success : C.danger }}>{money(t.profit)}</td>
                      <td className="py-2.5 px-2 text-center"><StatusBadge status={o.status} /></td>
                      <td className="py-2.5 px-2 text-right"><ChevronRight size={14} style={{ color: C.faint }} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {orders.length === 0 && <EmptyState text="ไม่พบออเดอร์" />}
          </div>
        </Card>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.orderNo} width={480}
        footer={detail && (
          <>
            {detail.status === "pending" && <Btn onClick={() => { actions.updateOrderStatus(detail.id, "closed"); actions.notify("ปิดรายการเรียบร้อยแล้ว"); setDetail({ ...detail, status: "closed" }); }}>ปิดรายการ</Btn>}
            <Btn variant="ghost" icon={Pencil} onClick={() => startEditOrder(detail)}>แก้ไขออเดอร์</Btn>
            <Btn variant="subtle" icon={Receipt} onClick={() => setReceiptOrder(detail)}>ออกใบเสร็จ/ใบเสนอราคา (A4)</Btn>
          </>
        )}>
        {detail && (() => {
          const t = orderTotals(detail);
          return (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm" style={{ color: C.sub }}>
                  ลูกค้า: <b style={{ color: C.text }}>{customersById[detail.customerId]?.name || "ลูกค้าทั่วไป"}</b><br />
                  วันที่: {fmtDateTime(detail.date)}
                </div>
                <StatusBadge status={detail.status} />
              </div>
              <div className="mb-3"><ChannelTag channel={detail.channel} /></div>
              <div className="flex flex-col gap-2 mb-3">
                {detail.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-sm items-center gap-2">
                    <span className="flex items-center gap-2 min-w-0"><Thumb src={it.imageUrl} size={24} /><span className="truncate">{it.name} × {it.qty}</span></span>
                    <span className="mono">{money(it.qty * it.price)}</span>
                  </div>
                ))}
              </div>
              <div className="pt-3 flex flex-col gap-1" style={{ borderTop: `1px dashed ${C.border}` }}>
                <div className="flex justify-between text-xs" style={{ color: C.sub }}><span>ส่วนลด</span><span className="mono">-{money(detail.discount)}</span></div>
                <div className="flex justify-between text-xs" style={{ color: C.sub }}><span>ค่าจัดส่ง</span><span className="mono">+{money(detail.shippingFee)}</span></div>
                <div className="flex justify-between font-bold text-sm"><span>ยอดสุทธิ</span><span className="mono">{money(t.total)}</span></div>
                <div className="flex justify-between text-xs" style={{ color: C.sub }}><span>ต้นทุน (FIFO)</span><span className="mono">{money(t.cost)}</span></div>
                <div className="flex justify-between font-bold text-sm" style={{ color: t.profit >= 0 ? C.success : C.danger }}><span>กำไร</span><span className="mono">{money(t.profit)}</span></div>
              </div>
            </div>
          );
        })()}
      </Modal>

      <ReceiptView open={!!receiptOrder} onClose={() => setReceiptOrder(null)} order={receiptOrder} customer={receiptOrder ? customersById[receiptOrder.customerId] : null} shopInfo={shopInfo} />
    </div>
  );
}

/* ============================== PARTIES PAGE ============================== */
function PartiesPage({ data, actions }) {
  const [tab, setTab] = useState("customers");
  const custCols = [
    { key: "name", label: "ชื่อลูกค้า", required: true },
    { key: "phone", label: "เบอร์โทร" },
    { key: "email", label: "อีเมล" },
    { key: "taxId", label: "เลขประจำตัวผู้เสียภาษี" },
    { key: "address", label: "ที่อยู่", type: "textarea" },
  ];
  const supCols = [{ key: "name", label: "ชื่อผู้จำหน่าย", required: true }, { key: "contact", label: "ผู้ติดต่อ" }, { key: "phone", label: "เบอร์โทร" }, { key: "address", label: "ที่อยู่", type: "textarea" }];
  return (
    <div>
      <PageHeader title="ลูกค้าและผู้จำหน่าย" subtitle="จัดการข้อมูลผู้ติดต่อทั้งหมด" />
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("customers")} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: tab === "customers" ? C.accent : "#fff", color: tab === "customers" ? "#fff" : C.sub, border: `1px solid ${tab === "customers" ? C.accent : C.border}` }}>
          <Users size={14} className="inline mr-1.5 -mt-0.5" />ลูกค้า ({data.customers.length})
        </button>
        <button onClick={() => setTab("suppliers")} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: tab === "suppliers" ? C.accent : "#fff", color: tab === "suppliers" ? "#fff" : C.sub, border: `1px solid ${tab === "suppliers" ? C.accent : C.border}` }}>
          <Truck size={14} className="inline mr-1.5 -mt-0.5" />ผู้จำหน่าย ({data.suppliers.length})
        </button>
      </div>
      {tab === "customers" ? (
        <EntityTable title="ลูกค้า" columns={custCols} data={data.customers} searchKeys={["name", "phone", "email"]}
          onAdd={(c) => { actions.addCustomer(c); actions.notify("เพิ่มลูกค้าแล้ว"); }}
          onEdit={(c) => { actions.editCustomer(c); actions.notify("บันทึกลูกค้าแล้ว"); }}
          onDelete={(id) => { actions.deleteCustomer(id); actions.notify("ลบลูกค้าแล้ว"); }} />
      ) : (
        <EntityTable title="ผู้จำหน่าย" columns={supCols} data={data.suppliers} searchKeys={["name", "contact"]}
          onAdd={(s) => { actions.addSupplier(s); actions.notify("เพิ่มผู้จำหน่ายแล้ว"); }}
          onEdit={(s) => { actions.editSupplier(s); actions.notify("บันทึกผู้จำหน่ายแล้ว"); }}
          onDelete={(id) => { actions.deleteSupplier(id); actions.notify("ลบผู้จำหน่ายแล้ว"); }} />
      )}
    </div>
  );
}

/* ============================== FINANCE PAGE ============================== */
function FinancePage({ data, actions }) {
  const [form, setForm] = useState({ type: "expense", category: EXPENSE_CATS[0], amount: "", note: "" });
  const [range, setRange] = useState("month");

  const cutoff = useMemo(() => {
    const d = new Date();
    if (range === "month") d.setMonth(d.getMonth() - 1);
    else if (range === "quarter") d.setMonth(d.getMonth() - 3);
    else d.setFullYear(d.getFullYear() - 1);
    return d;
  }, [range]);

  const salesIncome = data.orders.filter((o) => new Date(o.date) >= cutoff).reduce((s, o) => s + orderTotals(o).total, 0);
  const cogs = data.orders.filter((o) => new Date(o.date) >= cutoff).reduce((s, o) => s + orderTotals(o).cost, 0);
  const otherEntries = data.financeEntries.filter((f) => new Date(f.date) >= cutoff);
  const otherIncome = otherEntries.filter((f) => f.type === "income").reduce((s, f) => s + f.amount, 0);
  const otherExpense = otherEntries.filter((f) => f.type === "expense").reduce((s, f) => s + f.amount, 0);
  const totalIncome = salesIncome + otherIncome;
  const netProfit = totalIncome - cogs - otherExpense;

  const submit = () => {
    if (!form.amount || Number(form.amount) <= 0) { alert("กรุณาระบุจำนวนเงินให้ถูกต้อง"); return; }
    actions.addFinance({ date: new Date().toISOString(), type: form.type, category: form.category, amount: Number(form.amount), note: form.note });
    actions.notify("บันทึกรายการแล้ว");
    setForm({ type: "expense", category: EXPENSE_CATS[0], amount: "", note: "" });
  };

  const entries = [...data.financeEntries].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div>
      <PageHeader title="รายรับ - รายจ่าย และกำไร" subtitle="ภาพรวมการเงินของธุรกิจ"
        actions={
          <div className="flex rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
            {[{ k: "month", l: "1 เดือน" }, { k: "quarter", l: "3 เดือน" }, { k: "year", l: "1 ปี" }].map((g) => (
              <button key={g.k} onClick={() => setRange(g.k)} className="px-3.5 py-2 text-xs font-semibold" style={{ background: range === g.k ? C.accent : "#fff", color: range === g.k ? "#fff" : C.sub }}>{g.l}</button>
            ))}
          </div>
        } />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="รายรับรวม" value={money(totalIncome)} tone="success" icon={TrendingUp} sub="ยอดขาย + รายรับอื่น" />
        <StatCard label="ต้นทุนขาย (COGS)" value={money(cogs)} tone="warning" icon={Package} />
        <StatCard label="รายจ่ายดำเนินงาน" value={money(otherExpense)} tone="danger" icon={TrendingDown} />
        <StatCard label="กำไรสุทธิ" value={money(netProfit)} tone={netProfit >= 0 ? "success" : "danger"} icon={Wallet} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 h-fit">
          <div className="font-bold text-sm mb-3" style={{ color: C.text }}>บันทึกรายการ</div>
          <Field label="ประเภท" required>
            <div className="flex gap-2">
              <button onClick={() => setForm((f) => ({ ...f, type: "income" }))} className="flex-1 py-2 rounded-xl text-sm font-semibold" style={{ background: form.type === "income" ? C.successSoft : "#fff", color: form.type === "income" ? C.success : C.sub, border: `1px solid ${form.type === "income" ? C.success : C.border}` }}>รายรับ</button>
              <button onClick={() => setForm((f) => ({ ...f, type: "expense" }))} className="flex-1 py-2 rounded-xl text-sm font-semibold" style={{ background: form.type === "expense" ? C.dangerSoft : "#fff", color: form.type === "expense" ? C.danger : C.sub, border: `1px solid ${form.type === "expense" ? C.danger : C.border}` }}>รายจ่าย</button>
            </div>
          </Field>
          <Field label="หมวดหมู่" required>
            <Select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              {(form.type === "expense" ? EXPENSE_CATS : ["รายรับอื่นๆ", "ดอกเบี้ยรับ", "ค่าคอมมิชชั่น"]).map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="จำนวนเงิน (บาท)" required><Input type="number" min="0" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} /></Field>
          <Field label="หมายเหตุ"><TextArea rows={2} value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} /></Field>
          <Btn className="w-full justify-center" onClick={submit}>บันทึกรายการ</Btn>
        </Card>

        <Card className="p-4 lg:col-span-2">
          <div className="font-bold text-sm mb-3" style={{ color: C.text }}>ประวัติรายรับ-รายจ่าย (นอกเหนือจากออเดอร์)</div>
          <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
                <th className="text-left py-2 px-2 text-xs font-semibold" style={{ color: C.sub }}>วันที่</th>
                <th className="text-left py-2 px-2 text-xs font-semibold" style={{ color: C.sub }}>หมวดหมู่</th>
                <th className="text-center py-2 px-2 text-xs font-semibold" style={{ color: C.sub }}>ประเภท</th>
                <th className="text-right py-2 px-2 text-xs font-semibold" style={{ color: C.sub }}>จำนวนเงิน</th>
              </tr></thead>
              <tbody>
                {entries.slice(0, 200).map((f) => (
                  <tr key={f.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td className="py-2 px-2 text-xs" style={{ color: C.sub }}>{fmtDate(f.date)}</td>
                    <td className="py-2 px-2">{f.category}</td>
                    <td className="py-2 px-2 text-center">{f.type === "income" ? <Badge tone="success">รายรับ</Badge> : <Badge tone="danger">รายจ่าย</Badge>}</td>
                    <td className="py-2 px-2 text-right mono font-semibold">{f.type === "income" ? "+" : "-"}{money(f.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {entries.length === 0 && <EmptyState text="ไม่มีรายการ" />}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ============================== REPORTS PAGE ============================== */
function ReportsPage({ data }) {
  const [reportTab, setReportTab] = useState("sales");
  const [from, setFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const customersById = Object.fromEntries(data.customers.map((c) => [c.id, c]));

  const rangeOrders = data.orders.filter((o) => { const d = isoDay(o.date); return d >= from && d <= to; });

  const bestSellers = useMemo(() => {
    const map = new Map();
    rangeOrders.forEach((o) => o.items.forEach((it) => {
      const key = it.productId + "|" + (it.variantId || "");
      const cur = map.get(key) || { sku: it.sku, name: it.name, imageUrl: it.imageUrl, qty: 0, revenue: 0 };
      cur.qty += it.qty; cur.revenue += it.qty * it.price;
      map.set(key, cur);
    }));
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty);
  }, [rangeOrders]);

  const stockList = useMemo(() => {
    const rows = [];
    data.products.forEach((p) => {
      const mainStock = stockOf(p, null);
      if (mainStock > 0 || (p.variants || []).length === 0) rows.push({ sku: p.sku, name: p.name, imageUrl: p.imageUrl, stock: mainStock, value: mainStock * avgCostOf(p, null) });
      (p.variants || []).forEach((v) => {
        const vStock = stockOf(p, v.id);
        rows.push({ sku: v.sku, name: `${p.name} — ${v.name}`, imageUrl: p.imageUrl, stock: vStock, value: vStock * avgCostOf(p, v.id) });
      });
    });
    return rows.sort((a, b) => a.stock - b.stock);
  }, [data.products]);

  const productProfit = useMemo(() => {
    const map = new Map();
    rangeOrders.forEach((o) => o.items.forEach((it) => {
      const key = it.productId + "|" + (it.variantId || "");
      const cur = map.get(key) || { sku: it.sku, name: it.name, imageUrl: it.imageUrl, qty: 0, revenue: 0, cost: 0 };
      cur.qty += it.qty; cur.revenue += it.qty * it.price; cur.cost += it.qty * it.cost;
      map.set(key, cur);
    }));
    return Array.from(map.values()).map((r) => ({ ...r, profit: r.revenue - r.cost, margin: r.revenue > 0 ? ((r.revenue - r.cost) / r.revenue) * 100 : 0 })).sort((a, b) => b.profit - a.profit);
  }, [rangeOrders]);

  const exportExcel = (rows, filename) => {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "รายงาน");
    XLSX.writeFile(wb, filename);
  };

  const doExportExcel = () => {
    if (reportTab === "sales") {
      exportExcel(rangeOrders.map((o) => { const t = orderTotals(o); return { เลขออเดอร์: o.orderNo, วันที่: fmtDate(o.date), ลูกค้า: customersById[o.customerId]?.name || "ลูกค้าทั่วไป", ช่องทาง: channelOf(o.channel)?.label || "-", ยอดรวม: t.total, ต้นทุน: t.cost, กำไร: t.profit }; }), `รายงานยอดขาย_${from}_${to}.xlsx`);
    } else if (reportTab === "bestseller") {
      exportExcel(bestSellers.map((b) => ({ รหัส: b.sku, สินค้า: b.name, จำนวนที่ขาย: b.qty, ยอดขาย: b.revenue })), `สินค้าขายดี_${from}_${to}.xlsx`);
    } else if (reportTab === "profit") {
      exportExcel(productProfit.map((p) => ({ รหัส: p.sku, สินค้า: p.name, จำนวนที่ขาย: p.qty, ยอดขาย: p.revenue, ต้นทุน: p.cost, กำไร: p.profit, "%กำไร": Math.round(p.margin * 10) / 10 })), `กำไรรายสินค้า_${from}_${to}.xlsx`);
    } else {
      exportExcel(stockList.map((p) => ({ รหัส: p.sku, สินค้า: p.name, คงเหลือ: p.stock, มูลค่ารวม: p.value })), `รายงานสต๊อกคงเหลือ.xlsx`);
    }
  };

  const totalRange = rangeOrders.reduce((acc, o) => { const t = orderTotals(o); acc.total += t.total; acc.cost += t.cost; acc.profit += t.profit; return acc; }, { total: 0, cost: 0, profit: 0 });

  return (
    <div>
      <PageHeader title="รายงาน" subtitle="สรุปยอดขาย สินค้าขายดี และสถานะสต๊อก"
        actions={<><Btn variant="ghost" icon={Printer} onClick={() => window.print()}>Export PDF</Btn><Btn icon={FileSpreadsheet} onClick={doExportExcel}>Export Excel</Btn></>} />

      <div className="flex flex-wrap gap-2 mb-4 no-print">
        {[{ k: "sales", l: "รายงานยอดขาย" }, { k: "bestseller", l: "สินค้าขายดี" }, { k: "profit", l: "กำไรรายสินค้า" }, { k: "stock", l: "สต๊อกคงเหลือ" }].map((t) => (
          <button key={t.k} onClick={() => setReportTab(t.k)} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: reportTab === t.k ? C.accent : "#fff", color: reportTab === t.k ? "#fff" : C.sub, border: `1px solid ${reportTab === t.k ? C.accent : C.border}` }}>{t.l}</button>
        ))}
        {reportTab !== "stock" && (
          <div className="flex items-center gap-2 ml-auto">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ width: 150 }} />
            <span className="text-sm" style={{ color: C.sub }}>ถึง</span>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ width: 150 }} />
          </div>
        )}
      </div>

      <Card className="p-4 printable">
        {reportTab === "sales" && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              <StatCard label="ยอดขายรวม" value={money(totalRange.total)} tone="default" />
              <StatCard label="ต้นทุนรวม" value={money(totalRange.cost)} tone="warning" />
              <StatCard label="กำไรรวม" value={money(totalRange.profit)} tone="success" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  <th className="text-left py-2 px-2 text-xs font-semibold" style={{ color: C.sub }}>เลขออเดอร์</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold" style={{ color: C.sub }}>วันที่</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold" style={{ color: C.sub }}>ลูกค้า</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold" style={{ color: C.sub }}>ช่องทาง</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold" style={{ color: C.sub }}>ยอดรวม</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold" style={{ color: C.sub }}>กำไร</th>
                </tr></thead>
                <tbody>
                  {rangeOrders.map((o) => { const t = orderTotals(o); return (
                    <tr key={o.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td className="py-2 px-2 mono">{o.orderNo}</td>
                      <td className="py-2 px-2 text-xs" style={{ color: C.sub }}>{fmtDate(o.date)}</td>
                      <td className="py-2 px-2">{customersById[o.customerId]?.name || "ลูกค้าทั่วไป"}</td>
                      <td className="py-2 px-2"><ChannelTag channel={o.channel} /></td>
                      <td className="py-2 px-2 text-right mono font-semibold">{money(t.total)}</td>
                      <td className="py-2 px-2 text-right mono" style={{ color: t.profit >= 0 ? C.success : C.danger }}>{money(t.profit)}</td>
                    </tr>
                  );})}
                </tbody>
              </table>
              {rangeOrders.length === 0 && <EmptyState text="ไม่มีออเดอร์ในช่วงเวลานี้" />}
            </div>
          </>
        )}
        {reportTab === "bestseller" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
                <th className="text-left py-2 px-2 text-xs font-semibold" style={{ color: C.sub }}>อันดับ</th>
                <th className="text-left py-2 px-2 text-xs font-semibold" style={{ color: C.sub }}>สินค้า</th>
                <th className="text-right py-2 px-2 text-xs font-semibold" style={{ color: C.sub }}>จำนวนที่ขาย</th>
                <th className="text-right py-2 px-2 text-xs font-semibold" style={{ color: C.sub }}>ยอดขาย</th>
              </tr></thead>
              <tbody>
                {bestSellers.map((b, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td className="py-2 px-2 mono">#{i + 1}</td>
                    <td className="py-2 px-2 flex items-center gap-2"><Thumb src={b.imageUrl} size={24} />{b.name}</td>
                    <td className="py-2 px-2 text-right mono">{num(b.qty)}</td>
                    <td className="py-2 px-2 text-right mono font-semibold">{money(b.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {bestSellers.length === 0 && <EmptyState text="ไม่มีข้อมูลในช่วงเวลานี้" />}
          </div>
        )}
        {reportTab === "profit" && (
          <div className="overflow-x-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              <StatCard label="ยอดขายรวม" value={money(productProfit.reduce((s, p) => s + p.revenue, 0))} tone="default" />
              <StatCard label="ต้นทุนรวม" value={money(productProfit.reduce((s, p) => s + p.cost, 0))} tone="warning" />
              <StatCard label="กำไรรวม" value={money(productProfit.reduce((s, p) => s + p.profit, 0))} tone="success" />
            </div>
            <table className="w-full text-sm">
              <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
                <th className="text-left py-2 px-2 text-xs font-semibold" style={{ color: C.sub }}>สินค้า</th>
                <th className="text-right py-2 px-2 text-xs font-semibold" style={{ color: C.sub }}>จำนวนที่ขาย</th>
                <th className="text-right py-2 px-2 text-xs font-semibold" style={{ color: C.sub }}>ยอดขาย</th>
                <th className="text-right py-2 px-2 text-xs font-semibold" style={{ color: C.sub }}>ต้นทุน</th>
                <th className="text-right py-2 px-2 text-xs font-semibold" style={{ color: C.sub }}>กำไร</th>
                <th className="text-right py-2 px-2 text-xs font-semibold" style={{ color: C.sub }}>% กำไร</th>
              </tr></thead>
              <tbody>
                {productProfit.map((p, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td className="py-2 px-2 flex items-center gap-2"><Thumb src={p.imageUrl} size={24} />{p.name}</td>
                    <td className="py-2 px-2 text-right mono">{num(p.qty)}</td>
                    <td className="py-2 px-2 text-right mono">{money(p.revenue)}</td>
                    <td className="py-2 px-2 text-right mono" style={{ color: C.sub }}>{money(p.cost)}</td>
                    <td className="py-2 px-2 text-right mono font-semibold" style={{ color: p.profit >= 0 ? C.success : C.danger }}>{money(p.profit)}</td>
                    <td className="py-2 px-2 text-right mono" style={{ color: p.profit >= 0 ? C.success : C.danger }}>{p.margin.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {productProfit.length === 0 && <EmptyState text="ไม่มีข้อมูลในช่วงเวลานี้" />}
          </div>
        )}
        {reportTab === "stock" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
                <th className="text-left py-2 px-2 text-xs font-semibold" style={{ color: C.sub }}>รหัส</th>
                <th className="text-left py-2 px-2 text-xs font-semibold" style={{ color: C.sub }}>สินค้า</th>
                <th className="text-right py-2 px-2 text-xs font-semibold" style={{ color: C.sub }}>คงเหลือ</th>
                <th className="text-right py-2 px-2 text-xs font-semibold" style={{ color: C.sub }}>มูลค่าสต๊อก</th>
              </tr></thead>
              <tbody>
                {stockList.map((p, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td className="py-2 px-2 mono">{p.sku}</td>
                    <td className="py-2 px-2 flex items-center gap-2"><Thumb src={p.imageUrl} size={24} />{p.name}</td>
                    <td className="py-2 px-2 text-right mono font-bold">{p.stock}</td>
                    <td className="py-2 px-2 text-right mono">{money(p.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {stockList.length === 0 && <EmptyState text="ไม่มีสินค้า" />}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ============================== APP ROOT ============================== */
const STORAGE_KEY = "ims-app-data";

export default function App() {
  const [page, setPage] = useState("orders");
  const [navOpen, setNavOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef(null);
  const [toastMsg, setToastMsg] = useState("");
  const toastTimer = useRef(null);
  const notify = (msg) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(""), 2000);
  };

  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem("ims-unlocked") === "1");
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const tryUnlock = () => {
    if (pwInput === SITE_PASSWORD) { sessionStorage.setItem("ims-unlocked", "1"); setUnlocked(true); }
    else setPwError(true);
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/data");
        const parsed = await res.json();
        if (parsed) {
          if (!parsed.categories) parsed.categories = [...DEFAULT_CATEGORIES];
          if (!parsed.shopInfo) parsed.shopInfo = { name: "ชื่อร้านค้าของคุณ", address: "", taxId: "", phone: "", email: "" };
          parsed.products = (parsed.products || []).map(migrateProduct);
          setData(parsed);
        } else setData(buildSeedData());
      } catch { setData(buildSeedData()); }
      finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    if (!data) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await fetch("/api/data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      } catch {}
    }, 400);
  }, [data]);

  const resetData = async () => {
    if (!confirm("ต้องการล้างข้อมูลทั้งหมดหรือไม่? (ไม่สามารถกู้คืนได้)")) return;
    setData(buildSeedData());
  };

  const actions = {
    addProduct: (p) => setData((d) => ({ ...d, products: [...d.products, { variants: [], lots: [], ...p }] })),
    editProduct: (p) => setData((d) => ({ ...d, products: d.products.map((x) => x.id === p.id ? { ...x, ...p } : x) })),
    deleteProduct: (id) => setData((d) => ({ ...d, products: d.products.filter((x) => x.id !== id) })),
    addCategory: (name) => setData((d) => d.categories.includes(name) ? d : { ...d, categories: [...d.categories, name] }),
    addCustomer: (c) => setData((d) => ({ ...d, customers: [...d.customers, c] })),
    editCustomer: (c) => setData((d) => ({ ...d, customers: d.customers.map((x) => x.id === c.id ? { ...x, ...c } : x) })),
    deleteCustomer: (id) => setData((d) => ({ ...d, customers: d.customers.filter((x) => x.id !== id) })),
    addSupplier: (s) => setData((d) => ({ ...d, suppliers: [...d.suppliers, s] })),
    editSupplier: (s) => setData((d) => ({ ...d, suppliers: d.suppliers.map((x) => x.id === s.id ? { ...x, ...s } : x) })),
    deleteSupplier: (id) => setData((d) => ({ ...d, suppliers: d.suppliers.filter((x) => x.id !== id) })),

    addStockMove: (m) => setData((d) => {
      const moves = [];
      let products = d.products;
      if (m.type === "in" && m.lots) {
        products = products.map((p) => {
          if (p.id !== m.productId) return p;
          const newLots = m.lots.map((l) => ({ id: uid(), variantId: m.variantId || null, qty: l.qty, costPrice: l.costPrice, supplierId: l.supplierId, date: new Date().toISOString(), note: m.note || "" }));
          return { ...p, lots: [...(p.lots || []), ...newLots] };
        });
        m.lots.forEach((l) => {
          moves.push({ id: uid(), productId: m.productId, variantId: m.variantId || null, type: "in", qty: l.qty, costPrice: l.costPrice, supplierId: l.supplierId, date: new Date().toISOString(), note: m.note || "", refOrderId: null });
        });
      } else {
        products = products.map((p) => {
          if (p.id !== m.productId) return p;
          const { lots: newLots, cost } = deductFIFO(p.lots || [], m.variantId || null, m.qty);
          moves.push({ id: uid(), productId: p.id, variantId: m.variantId || null, type: "out", qty: m.qty, cost, date: new Date().toISOString(), note: m.note || "", refOrderId: null });
          return { ...p, lots: newLots };
        });
      }
      return { ...d, products, stockMoves: [...d.stockMoves, ...moves] };
    }),

    addOrder: (o) => setData((d) => {
      const order = { id: uid(), ...o };
      const moves = [];
      const products = d.products.map((p) => {
        const items = order.items.filter((i) => i.productId === p.id);
        if (items.length === 0) return p;
        let currentLots = p.lots || [];
        items.forEach((it) => {
          const { lots: newLots, cost } = deductFIFO(currentLots, it.variantId || null, it.qty);
          currentLots = newLots;
          it.cost = it.qty > 0 ? Math.round((cost / it.qty) * 100) / 100 : 0;
          moves.push({ id: uid(), productId: p.id, variantId: it.variantId || null, type: "out", qty: it.qty, cost, date: order.date, note: `ตัดสต๊อกจากออเดอร์ ${order.orderNo}`, refOrderId: order.id });
        });
        return { ...p, lots: currentLots };
      });
      return { ...d, products, orders: [...d.orders, order], stockMoves: [...d.stockMoves, ...moves] };
    }),

    updateOrderStatus: (id, status) => setData((d) => ({ ...d, orders: d.orders.map((o) => o.id === id ? { ...o, status } : o) })),

    // Returns an order's items back into stock as fresh lots (used when starting to edit an order)
    reverseOrderStock: (order) => setData((d) => {
      const moves = [];
      const products = d.products.map((p) => {
        const items = order.items.filter((i) => i.productId === p.id);
        if (items.length === 0) return p;
        const newLots = [...(p.lots || [])];
        items.forEach((it) => {
          newLots.push({ id: uid(), variantId: it.variantId || null, qty: it.qty, costPrice: it.cost, supplierId: null, date: order.date, note: `คืนสต๊อกจากการแก้ไขออเดอร์ ${order.orderNo}` });
          moves.push({ id: uid(), productId: p.id, variantId: it.variantId || null, type: "in", qty: it.qty, costPrice: it.cost, supplierId: null, date: new Date().toISOString(), note: `คืนสต๊อกจากการแก้ไขออเดอร์ ${order.orderNo}`, refOrderId: order.id });
        });
        return { ...p, lots: newLots };
      });
      return { ...d, products, stockMoves: [...d.stockMoves, ...moves] };
    }),

    // Re-deducts an order's original items (used when the edit is cancelled, to restore the pre-edit state)
    restoreOrderStock: (order) => setData((d) => {
      const moves = [];
      const products = d.products.map((p) => {
        const items = order.items.filter((i) => i.productId === p.id);
        if (items.length === 0) return p;
        let currentLots = p.lots || [];
        items.forEach((it) => {
          const { lots: newLots, cost } = deductFIFO(currentLots, it.variantId || null, it.qty);
          currentLots = newLots;
          moves.push({ id: uid(), productId: p.id, variantId: it.variantId || null, type: "out", qty: it.qty, cost, date: new Date().toISOString(), note: `ยกเลิกแก้ไข - คืนสถานะออเดอร์ ${order.orderNo}`, refOrderId: order.id });
        });
        return { ...p, lots: currentLots };
      });
      return { ...d, products, stockMoves: [...d.stockMoves, ...moves] };
    }),

    // Applies edited order fields: FIFO-deducts the (possibly changed) item list and replaces the order in place
    updateOrder: (orderId, patch) => setData((d) => {
      const moves = [];
      const items = patch.items.map((it) => ({ ...it }));
      const products = d.products.map((p) => {
        const pItems = items.filter((i) => i.productId === p.id);
        if (pItems.length === 0) return p;
        let currentLots = p.lots || [];
        pItems.forEach((it) => {
          const { lots: newLots, cost } = deductFIFO(currentLots, it.variantId || null, it.qty);
          currentLots = newLots;
          it.cost = it.qty > 0 ? Math.round((cost / it.qty) * 100) / 100 : 0;
          moves.push({ id: uid(), productId: p.id, variantId: it.variantId || null, type: "out", qty: it.qty, cost, date: new Date().toISOString(), note: `ตัดสต๊อกจากการแก้ไขออเดอร์ ${patch.orderNo}`, refOrderId: orderId });
        });
        return { ...p, lots: currentLots };
      });
      const orders = d.orders.map((o) => o.id === orderId ? { ...o, ...patch, items } : o);
      return { ...d, products, orders, stockMoves: [...d.stockMoves, ...moves] };
    }),
    addFinance: (f) => setData((d) => ({ ...d, financeEntries: [...d.financeEntries, { id: uid(), ...f }] })),
    updateShopInfo: (info) => setData((d) => ({ ...d, shopInfo: { ...d.shopInfo, ...info } })),
    notify,
  };

  if (!unlocked) {
    return (
      <div className="ims min-h-screen flex items-center justify-center p-4" style={{ background: "#0B1E3F" }}>
        <GlobalStyle />
        <div className="w-full max-w-sm p-6 rounded-2xl" style={{ background: "#fff" }}>
          <div className="text-lg font-bold mb-3">กรุณาใส่รหัสผ่าน</div>
          <input type="password" value={pwInput} onChange={(e) => { setPwInput(e.target.value); setPwError(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") tryUnlock(); }}
            style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid #DEE6F3", fontSize: 14 }} />
          {pwError && <div className="text-xs mt-2" style={{ color: "#C0402B" }}>รหัสผ่านไม่ถูกต้อง</div>}
          <button onClick={tryUnlock} className="w-full mt-3 py-2 rounded-xl font-semibold" style={{ background: "#1D4FC4", color: "#fff" }}>เข้าสู่ระบบ</button>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="ims min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
        <GlobalStyle />
        <div className="text-sm" style={{ color: C.sub }}>กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  const pageTitles = { dashboard: "แดชบอร์ด", products: "สินค้าและสต๊อก", orders: "ออเดอร์", parties: "ลูกค้า/ผู้จำหน่าย", finance: "รายรับ-รายจ่าย", reports: "รายงาน" };

  return (
    <div className="ims min-h-screen flex" style={{ background: C.bg }}>
      <GlobalStyle />
      <Sidebar page={page} setPage={setPage} open={navOpen} setOpen={setNavOpen} onReset={resetData} onOpenSettings={() => setSettingsOpen(true)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar title={pageTitles[page]} onMenu={() => setNavOpen(true)} />
        <main className="flex-1 p-4 md:p-7">
          {page === "dashboard" && <Dashboard data={data} />}
          {page === "products" && <ProductsPage data={data} actions={actions} />}
          {page === "orders" && <OrdersPage data={data} actions={actions} shopInfo={data.shopInfo} />}
          {page === "parties" && <PartiesPage data={data} actions={actions} />}
          {page === "finance" && <FinancePage data={data} actions={actions} />}
          {page === "reports" && <ReportsPage data={data} />}
        </main>
      </div>
      <ShopSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} shopInfo={data.shopInfo} onSave={(info) => { actions.updateShopInfo(info); notify("บันทึกข้อมูลร้านแล้ว"); }} />
      <Toast message={toastMsg} />
    </div>
  );
}
