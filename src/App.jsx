import React, { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard, ClipboardList, UserCog, Wrench, Headphones, Phone,
  Package, ShieldCheck, Plus, Trash2, Lock, Unlock, X, Loader2, Building2,
  CalendarDays, Users, Settings2, ListChecks, Target as TargetIcon,
  Image as ImageIcon, RotateCcw, Upload, Coins, FileText
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/* CONSTANTS                                                               */
/* ---------------------------------------------------------------------- */

const ROLES = [
  { key: "service_manager", label: "Service Manager", short: "SM", icon: ClipboardList },
  { key: "service_advisor", label: "Service Advisor", short: "SA", icon: UserCog },
  { key: "technician", label: "Technician", short: "Tech", icon: Wrench },
  { key: "cre", label: "Customer Relation Executive", short: "CRE", icon: Headphones },
  { key: "telemarketer", label: "Telemarketer", short: "TM", icon: Phone },
  { key: "parts_officer", label: "Parts Officer", short: "Parts", icon: Package },
  { key: "warranty_officer", label: "Warranty Officer", short: "Warranty", icon: ShieldCheck },
];
const ROLE_MAP = Object.fromEntries(ROLES.map(r => [r.key, r]));

const FOCUS_PRODUCTS = ["Battery", "Brake Pad", "Wiper"];

// Official Proton logo, hotlinked from Wikimedia Commons. Kept up to date manually;
// staff can upload a newer logo any time from the Dashboard and it takes over automatically.
const DEFAULT_LOGO = "https://commons.wikimedia.org/wiki/Special:FilePath/Proton%20AG%20logo.svg?width=240";

const COMPANY_INFO = {
  name: "PROTON INDAH SARI OTOMOBIL SDN BHD",
  address: "LOT 7481 & 7482, KAMPUNG PADANG LANDAK, 22000 JERTEH, TERENGGANU",
  phone: "09-690 5681 / 012-669 3180 (WhatsApp)",
};

function defaultKpiConfig() {
  return {
    service_manager: {
      kpis: [
        { key: "throughput", label: "Throughput (TP)", unit: "unit", aggregation: "sum", targets: { default: 0 } },
        { key: "revenue", label: "Revenue (Rev RM)", unit: "RM", aggregation: "sum", targets: { default: 0 } },
        { key: "csi", label: "CSI", unit: "%", aggregation: "average", targets: { default: 0 } },
        { key: "stockholding_total", label: "Stockholding - Total", unit: "RM", aggregation: "latest", targets: { default: 0 } },
        { key: "deadstock", label: "Deadstock (6 bulan atau lebih)", unit: "RM", aggregation: "latest", targets: { default: 0 } },
      ],
    },
    service_advisor: {
      kpis: [
        { key: "throughput", label: "Throughput (TP)", unit: "unit", aggregation: "sum", targets: { default: 0 } },
        { key: "revenue", label: "Revenue (Rev RM)", unit: "RM", aggregation: "sum", targets: { default: 0 } },
        { key: "csi", label: "CSI", unit: "%", aggregation: "average", targets: { default: 0 } },
        { key: "focus_product", label: "Focus Product", unit: "unit", aggregation: "sum", hasSubcategory: true, subcategories: [...FOCUS_PRODUCTS], targets: { default: 0 } },
      ],
    },
    technician: {
      kpis: [
        { key: "throughput", label: "Throughput (TP)", unit: "unit", aggregation: "sum", targets: { default: 0 } },
        { key: "revenue", label: "Revenue (Rev RM)", unit: "RM", aggregation: "sum", targets: { default: 0 } },
        { key: "csi", label: "CSI", unit: "%", aggregation: "average", targets: { default: 0 } },
        { key: "focus_product", label: "Focus Product", unit: "unit", aggregation: "sum", hasSubcategory: true, subcategories: [...FOCUS_PRODUCTS], targets: { default: 0 } },
      ],
    },
    cre: {
      kpis: [
        { key: "throughput", label: "Throughput (TP)", unit: "unit", aggregation: "sum", targets: { default: 0 } },
        { key: "csi", label: "CSI", unit: "%", aggregation: "average", targets: { default: 0 } },
      ],
    },
    telemarketer: { kpis: [] },
    parts_officer: {
      kpis: [
        { key: "stockholding_fast_moving", label: "Stockholding - Fast Moving", unit: "RM", aggregation: "latest", targets: { default: 0 } },
        { key: "stockholding_total", label: "Stockholding - Total", unit: "RM", aggregation: "latest", targets: { default: 0 } },
        { key: "stockholding_warranty", label: "Stockholding - Warranty", unit: "RM", aggregation: "latest", targets: { default: 0 } },
        { key: "deadstock", label: "Deadstock (6 bulan atau lebih)", unit: "RM", aggregation: "latest", targets: { default: 0 } },
      ],
    },
    warranty_officer: {
      kpis: [
        { key: "approval_rate", label: "Approval Rate", unit: "%", aggregation: "average", targets: { default: 0 } },
        { key: "claim_speed", label: "Claim Speed (Within 5 Days)", unit: "%", aggregation: "average", targets: { default: 0 } },
        { key: "stockholding_warranty", label: "Stockholding - Warranty", unit: "RM", aggregation: "latest", targets: { default: 0 } },
      ],
    },
  };
}

const DASHBOARD_METRICS = [
  { key: "throughput", label: "Throughput", roles: ["service_manager", "service_advisor", "technician"], unit: "unit", aggregation: "sum" },
  { key: "revenue", label: "Revenue", roles: ["service_manager", "service_advisor", "technician"], unit: "RM", aggregation: "sum" },
  { key: "csi", label: "CSI", roles: ["service_manager", "service_advisor", "technician", "cre"], unit: "%", aggregation: "average" },
  { key: "focus_product", label: "Focus Product", roles: ["service_advisor", "technician"], unit: "unit", aggregation: "sum", hasSubcategory: true, subcategories: [...FOCUS_PRODUCTS] },
];

// These KPI keys share ONE target per outlet across every role that tracks them.
// Service Manager sets it once (in "Urus Sasaran") and it applies automatically
// to Service Manager / Service Advisor / Technician / CRE as relevant.
const SHARED_KPI_KEYS = DASHBOARD_METRICS.map(m => m.key);

/* ---------------------------------------------------------------------- */
/* HELPERS                                                                 */
/* ---------------------------------------------------------------------- */

function uid() { return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8); }
function todayStr() { return new Date().toISOString().slice(0, 10); }
function monthOf(d) { return (d || "").slice(0, 7); }
function currentMonthStr() { return todayStr().slice(0, 7); }
function monthLabel(m) {
  if (!m) return "";
  const [y, mo] = m.split("-");
  const d = new Date(Number(y), Number(mo) - 1, 1);
  return d.toLocaleDateString("ms-MY", { month: "long", year: "numeric" });
}
function dateLabel(d) {
  if (!d) return "";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("ms-MY", { day: "2-digit", month: "short", year: "numeric" });
}
function fmt(value, unit) {
  const n = Number(value) || 0;
  const rounded = Math.round(n * 100) / 100;
  const str = rounded.toLocaleString("en-MY");
  if (unit === "RM") return `RM ${str}`;
  if (unit === "%") return `${str}%`;
  return `${str}${unit ? " " + unit : ""}`;
}
function getTarget(kpi, outlet) {
  if (!kpi || !kpi.targets) return 0;
  const v = kpi.targets[outlet];
  return v !== undefined ? v : (kpi.targets.default || 0);
}
function statusOf(actual, target) {
  if (!target || target <= 0) return { label: "Sasaran belum ditetapkan", tone: "muted", pct: null };
  const pct = (actual / target) * 100;
  if (pct >= 100) return { label: "Sasaran tercapai", tone: "good", pct };
  if (pct >= 70) return { label: "Dalam progress", tone: "warn", pct };
  return { label: "Jauh dari sasaran", tone: "bad", pct };
}

/** Given a kpi (with optional incentiveTiers) and an achieved value, return the matching tier or null. */
function matchIncentiveTier(kpi, value) {
  const tiers = (kpi && kpi.incentiveTiers) || [];
  for (const t of tiers) {
    const min = t.min === "" || t.min === null || t.min === undefined ? -Infinity : Number(t.min);
    const max = t.max === "" || t.max === null || t.max === undefined ? Infinity : Number(t.max);
    if (!isNaN(min) && !isNaN(max) && value >= min && value <= max) return t;
  }
  return null;
}
function fmtRM(n) { return "RM " + (Math.round(Number(n) || 0)).toLocaleString("en-MY"); }

/** Aggregate one kpi for a role, scoped to outlet (or null = all outlets), month, and optionally one staff member. */
function aggregateKpi(entries, role, outlet, month, kpi, staffName) {
  if (!kpi) return { total: 0, count: 0, perProduct: {} };
  let rows = entries.filter(e => e.role === role && monthOf(e.date) === month && (outlet ? e.outlet === outlet : true));
  if (staffName) rows = rows.filter(e => e.staffName === staffName);

  if (kpi.hasSubcategory) {
    const perProduct = {};
    (kpi.subcategories || []).forEach(s => { perProduct[s] = 0; });
    let total = 0;
    rows.forEach(e => {
      const arr = e.values && e.values[kpi.key];
      if (Array.isArray(arr)) arr.forEach(it => {
        perProduct[it.product] = (perProduct[it.product] || 0) + (Number(it.qty) || 0);
        total += Number(it.qty) || 0;
      });
    });
    return { total, perProduct, count: rows.length };
  }

  const vals = rows
    .map(e => ({ date: e.date, v: Number(e.values && e.values[kpi.key]) }))
    .filter(x => !isNaN(x.v));
  if (vals.length === 0) return { total: 0, count: 0 };
  if (kpi.aggregation === "average") {
    return { total: vals.reduce((a, b) => a + b.v, 0) / vals.length, count: vals.length };
  }
  if (kpi.aggregation === "latest") {
    vals.sort((a, b) => a.date.localeCompare(b.date));
    return { total: vals[vals.length - 1].v, count: vals.length };
  }
  return { total: vals.reduce((a, b) => a + b.v, 0), count: vals.length };
}

function dashboardAggregate(entries, kpiConfig, metric, outlet, month) {
  const rows = [];
  metric.roles.forEach(r => {
    const kpi = kpiConfig[r] && kpiConfig[r].kpis.find(k => k.key === metric.key);
    if (!kpi) return;
    entries.filter(e => e.role === r && monthOf(e.date) === month && (outlet ? e.outlet === outlet : true))
      .forEach(e => rows.push(e));
  });
  if (metric.hasSubcategory) {
    const perProduct = {};
    (metric.subcategories || []).forEach(s => { perProduct[s] = 0; });
    let total = 0;
    rows.forEach(e => {
      const arr = e.values && e.values[metric.key];
      if (Array.isArray(arr)) arr.forEach(it => {
        perProduct[it.product] = (perProduct[it.product] || 0) + (Number(it.qty) || 0);
        total += Number(it.qty) || 0;
      });
    });
    return { total, perProduct };
  }
  const vals = rows.map(e => Number(e.values && e.values[metric.key])).filter(v => !isNaN(v));
  if (vals.length === 0) return { total: 0 };
  if (metric.aggregation === "average") return { total: vals.reduce((a, b) => a + b, 0) / vals.length };
  return { total: vals.reduce((a, b) => a + b, 0) };
}

function dashboardTarget(kpiConfig, metric, outlet) {
  const targets = [];
  metric.roles.forEach(r => {
    const kpi = kpiConfig[r] && kpiConfig[r].kpis.find(k => k.key === metric.key);
    if (kpi) targets.push(getTarget(kpi, outlet));
  });
  if (targets.length === 0) return 0;
  if (metric.aggregation === "average") return targets.reduce((a, b) => a + b, 0) / targets.length;
  return targets.reduce((a, b) => a + b, 0);
}

/* ---------------------------------------------------------------------- */
/* SMALL UI PRIMITIVES                                                     */
/* ---------------------------------------------------------------------- */

function Gauge({ percent, size = 128 }) {
  const raw = percent === null || percent === undefined ? 0 : percent;
  const clamped = Math.max(0, Math.min(raw, 130));
  const angle = (clamped / 130) * 180;
  const r = size / 2 - 12;
  const cx = size / 2, cy = size / 2;
  function polar(deg) {
    const a = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) };
  }
  const start = polar(180);
  const end = polar(180 - angle);
  const largeArc = angle > 180 ? 1 : 0;
  const path = `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  const bg = `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}`;
  const tone = percent === null ? "muted" : percent >= 100 ? "good" : percent >= 70 ? "warn" : "bad";
  const colorVar = tone === "good" ? "var(--good)" : tone === "warn" ? "var(--warn)" : tone === "bad" ? "var(--bad)" : "var(--track)";
  return (
    <svg width={size} height={size / 2 + 26} viewBox={`0 0 ${size} ${size / 2 + 26}`}>
      <path d={bg} fill="none" stroke="var(--track)" strokeWidth="10" strokeLinecap="round" />
      {percent !== null && <path d={path} fill="none" stroke={colorVar} strokeWidth="10" strokeLinecap="round" />}
      <text x={cx} y={cy - 4} textAnchor="middle" className="gauge-num">
        {percent === null ? "—" : Math.round(percent) + "%"}
      </text>
    </svg>
  );
}

function Badge({ tone, children }) {
  return <span className={"badge badge-" + tone}>{children}</span>;
}

function StatCard({ label, kpi, outlet, actual, target, unit }) {
  const st = statusOf(actual, target);
  const shortage = Math.max((target || 0) - (actual || 0), 0);
  return (
    <div className="card gauge-card">
      <div className="gauge-card-head">
        <span className="eyebrow-plain">{outlet}</span>
      </div>
      <Gauge percent={st.pct} />
      <div className="gauge-figures">
        <div className="gf-row"><span>Pencapaian</span><b>{fmt(actual, unit)}</b></div>
        <div className="gf-row"><span>Sasaran</span><b>{fmt(target, unit)}</b></div>
        <div className="gf-row"><span>Baki nak capai</span><b className={shortage > 0 ? "num-bad" : "num-good"}>{shortage > 0 ? fmt(shortage, unit) : "Tercapai"}</b></div>
      </div>
      <Badge tone={st.tone}>{st.label}</Badge>
    </div>
  );
}

function IndividualRow({ name, roleLabel, outlet, actual, target, unit }) {
  const st = statusOf(actual, target);
  const shortage = Math.max((target || 0) - (actual || 0), 0);
  return (
    <tr>
      <td>{name}</td>
      <td className="muted-cell">{roleLabel}{outlet ? " · " + outlet : ""}</td>
      <td className="num-cell">{fmt(actual, unit)}</td>
      <td className="num-cell">{fmt(target, unit)}</td>
      <td className="num-cell">{shortage > 0 ? fmt(shortage, unit) : "—"}</td>
      <td><Badge tone={st.tone}>{st.label}</Badge></td>
    </tr>
  );
}

function IndividualRowIncentive({ name, roleLabel, actual, target, unit, tier }) {
  const st = statusOf(actual, target);
  const shortage = Math.max((target || 0) - (actual || 0), 0);
  return (
    <tr>
      <td>{name}</td>
      <td className="muted-cell">{roleLabel}</td>
      <td className="num-cell">{fmt(actual, unit)}</td>
      <td className="num-cell">{fmt(target, unit)}</td>
      <td className="num-cell">{shortage > 0 ? fmt(shortage, unit) : "—"}</td>
      <td><Badge tone={st.tone}>{st.label}</Badge></td>
      <td className="num-cell">
        {tier ? <b className="num-good" title={tier.label || ""}>{fmtRM(tier.amount)}</b> : <span className="muted-cell">—</span>}
      </td>
    </tr>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

/* ---------------------------------------------------------------------- */
/* ROLE TAB (data entry + progress, reused by every position)              */
/* ---------------------------------------------------------------------- */

function RoleTab({ roleKey, kpiConfig, outlets, currentOutlet, staffList, entries, addStaff, upsertEntry, month, setMonth }) {
  const roleInfo = ROLE_MAP[roleKey];
  const roleCfg = kpiConfig[roleKey] || { kpis: [] };
  const plainKpis = roleCfg.kpis.filter(k => !k.hasSubcategory);
  const focusKpi = roleCfg.kpis.find(k => k.hasSubcategory);

  const roleStaff = useMemo(
    () => staffList.filter(s => s.role === roleKey && s.outlet === currentOutlet),
    [staffList, roleKey, currentOutlet]
  );

  const [selectedStaff, setSelectedStaff] = useState("");
  const [addingStaff, setAddingStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [entryDate, setEntryDate] = useState(todayStr());
  const [formValues, setFormValues] = useState({});
  const [focusList, setFocusList] = useState([]);
  const [focusProduct, setFocusProduct] = useState(focusKpi ? focusKpi.subcategories[0] : "");
  const [focusQty, setFocusQty] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [historyDate, setHistoryDate] = useState("");

  useEffect(() => {
    if (roleStaff.length && !roleStaff.some(s => s.name === selectedStaff)) {
      setSelectedStaff(roleStaff[0].name);
    }
    if (!roleStaff.length) setSelectedStaff("");
    // eslint-disable-next-line
  }, [roleStaff.length, currentOutlet]);

  useEffect(() => {
    const existing = entries.find(e => e.role === roleKey && e.outlet === currentOutlet && e.staffName === selectedStaff && e.date === entryDate);
    const vals = {};
    plainKpis.forEach(k => { vals[k.key] = existing && existing.values && existing.values[k.key] !== undefined ? String(existing.values[k.key]) : ""; });
    setFormValues(vals);
    if (focusKpi) {
      const arr = existing && existing.values && existing.values[focusKpi.key];
      setFocusList(Array.isArray(arr) ? [...arr] : []);
    }
    setSaveMsg("");
    // eslint-disable-next-line
  }, [selectedStaff, entryDate, currentOutlet, roleKey]);

  const datesAvailable = useMemo(() => {
    const list = Array.from(new Set(entries.filter(e => e.role === roleKey && e.outlet === currentOutlet).map(e => e.date)));
    return list.sort().reverse();
  }, [entries, roleKey, currentOutlet]);

  useEffect(() => {
    if (datesAvailable.length && !datesAvailable.includes(historyDate)) setHistoryDate(datesAvailable[0]);
    if (!datesAvailable.length) setHistoryDate("");
    // eslint-disable-next-line
  }, [datesAvailable.join(",")]);

  const monthsAvailable = useMemo(() => {
    const set = new Set([currentMonthStr()]);
    entries.filter(e => e.role === roleKey && e.outlet === currentOutlet).forEach(e => set.add(monthOf(e.date)));
    return Array.from(set).sort().reverse();
  }, [entries, roleKey, currentOutlet]);

  function handleAddStaff() {
    if (!newStaffName.trim()) return;
    addStaff(newStaffName, roleKey, currentOutlet);
    setSelectedStaff(newStaffName.trim());
    setNewStaffName("");
    setAddingStaff(false);
  }

  function handleAddFocusLine() {
    if (!focusProduct || !focusQty || Number(focusQty) <= 0) return;
    setFocusList([...focusList, { product: focusProduct, qty: Number(focusQty) }]);
    setFocusQty("");
  }

  function handleSave() {
    if (!selectedStaff) { setSaveMsg("Sila pilih atau tambah nama staff dahulu."); return; }
    const values = {};
    plainKpis.forEach(k => { values[k.key] = Number(formValues[k.key]) || 0; });
    if (focusKpi) values[focusKpi.key] = focusList;
    upsertEntry({ date: entryDate, outlet: currentOutlet, role: roleKey, staffName: selectedStaff, values });
    setSaveMsg("Kemaskini untuk " + dateLabel(entryDate) + " telah disimpan.");
  }

  const historyEntry = entries.find(e => e.role === roleKey && e.outlet === currentOutlet && e.date === historyDate);
  const historyEntriesForDate = entries.filter(e => e.role === roleKey && e.outlet === currentOutlet && e.date === historyDate);

  return (
    <div className="tab-body">
      <div className="tab-heading">
        <roleInfo.icon size={22} />
        <div>
          <h2>{roleInfo.label}</h2>
          <p className="tab-sub">Kemaskini KPI harian & semak progress berbanding sasaran — outlet {currentOutlet}</p>
        </div>
      </div>

      {roleCfg.kpis.length === 0 ? (
        <div className="empty-box">
          Belum ada KPI ditetapkan bagi jawatan ini buat masa ini. Service Manager akan tetapkan KPI melalui tab
          <b> Service Manager → Urus Deskripsi Kerja</b>.
        </div>
      ) : (
        <>
          <section className="card entry-card">
            <h3>Input Kemaskini Harian</h3>
            <div className="entry-grid">
              <Field label="Nama Staff">
                {!addingStaff ? (
                  <div className="row-inline">
                    <select className="select" value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)}>
                      {roleStaff.length === 0 && <option value="">Tiada staff didaftar</option>}
                      {roleStaff.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                    <button className="btn-ghost small" onClick={() => setAddingStaff(true)}><Plus size={14} /> Staff baru</button>
                  </div>
                ) : (
                  <div className="row-inline">
                    <input className="input" placeholder="Nama penuh staff" value={newStaffName} onChange={e => setNewStaffName(e.target.value)} />
                    <button className="btn-primary small" onClick={handleAddStaff}>Simpan</button>
                    <button className="btn-ghost small" onClick={() => setAddingStaff(false)}>Batal</button>
                  </div>
                )}
              </Field>
              <Field label="Tarikh Kemaskini">
                <input className="input" type="date" value={entryDate} max={todayStr()} onChange={e => setEntryDate(e.target.value)} />
              </Field>
            </div>

            <div className="kpi-input-grid">
              {plainKpis.map(k => (
                <Field key={k.key} label={`${k.label} (${k.unit})`}>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={formValues[k.key] ?? ""}
                    onChange={e => setFormValues({ ...formValues, [k.key]: e.target.value })}
                  />
                </Field>
              ))}
            </div>

            {focusKpi && (
              <div className="focus-block">
                <span className="field-label">{focusKpi.label} — catat jualan hari ini</span>
                <div className="row-inline">
                  <select className="select" value={focusProduct} onChange={e => setFocusProduct(e.target.value)}>
                    {focusKpi.subcategories.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <input className="input qty" type="number" min="1" step="1" placeholder="Unit" value={focusQty} onChange={e => setFocusQty(e.target.value)} />
                  <button className="btn-ghost small" onClick={handleAddFocusLine}><Plus size={14} /> Tambah</button>
                </div>
                {focusList.length > 0 && (
                  <ul className="focus-list">
                    {focusList.map((f, i) => (
                      <li key={i}>
                        <span>{f.product}</span><b>{f.qty} unit</b>
                        <button className="icon-btn" onClick={() => setFocusList(focusList.filter((_, idx) => idx !== i))}><X size={14} /></button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="row-inline save-row">
              <button className="btn-primary" onClick={handleSave}>Simpan Kemaskini</button>
              {saveMsg && <span className="save-msg">{saveMsg}</span>}
            </div>

            {selectedStaff && roleCfg.kpis.some(k => (k.incentiveTiers || []).length > 0) && (
              <div className="incentive-mini-card">
                <span className="field-label"><Coins size={13} /> Insentif Bulan Ini — {selectedStaff}</span>
                <div className="product-chip-row">
                  {roleCfg.kpis.filter(k => (k.incentiveTiers || []).length > 0).map(k => {
                    const agg = aggregateKpi(entries, roleKey, currentOutlet, month, k, selectedStaff);
                    const tier = matchIncentiveTier(k, agg.total);
                    return (
                      <div key={k.key} className="product-chip">
                        <span>{k.label}</span>
                        <b className={tier ? "num-good" : ""}>{tier ? fmtRM(tier.amount) : "Belum capai julat"}</b>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          <section className="progress-section">
            <div className="progress-head">
              <h3>Progress berbanding Sasaran</h3>
              <Field label="Bulan">
                <select className="select" value={month} onChange={e => setMonth(e.target.value)}>
                  {monthsAvailable.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
                </select>
              </Field>
            </div>

            <div className="gauge-row">
              {plainKpis.map(k => {
                const agg = aggregateKpi(entries, roleKey, currentOutlet, month, k);
                const target = getTarget(k, currentOutlet);
                return <StatCard key={k.key} label={k.label} outlet={k.label} actual={agg.total} target={target} unit={k.unit} />;
              })}
              {focusKpi && (() => {
                const agg = aggregateKpi(entries, roleKey, currentOutlet, month, focusKpi);
                const target = getTarget(focusKpi, currentOutlet);
                return <StatCard key={focusKpi.key} label={focusKpi.label} outlet={focusKpi.label} actual={agg.total} target={target} unit={focusKpi.unit} />;
              })()}
            </div>

            {focusKpi && (() => {
              const agg = aggregateKpi(entries, roleKey, currentOutlet, month, focusKpi);
              return (
                <div className="card product-breakdown">
                  <h4>Pecahan Focus Product ({monthLabel(month)})</h4>
                  <div className="product-chip-row">
                    {focusKpi.subcategories.map(p => (
                      <div key={p} className="product-chip">
                        <span>{p}</span><b>{agg.perProduct ? (agg.perProduct[p] || 0) : 0} unit</b>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {roleStaff.length > 0 && (
              <div className="card">
                <h4>Pencapaian Individu — {monthLabel(month)}</h4>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Nama</th><th>Jawatan</th><th>Pencapaian</th><th>Sasaran</th><th>Baki</th><th>Status</th><th>Insentif</th></tr>
                    </thead>
                    <tbody>
                      {roleStaff.map(s => {
                        const rows = [];
                        plainKpis.forEach(k => {
                          const agg = aggregateKpi(entries, roleKey, currentOutlet, month, k, s.name);
                          const target = getTarget(k, currentOutlet);
                          const tier = matchIncentiveTier(k, agg.total);
                          rows.push(<IndividualRowIncentive key={s.id + k.key} name={s.name} roleLabel={k.label} actual={agg.total} target={target} unit={k.unit} tier={tier} />);
                        });
                        if (focusKpi) {
                          const agg = aggregateKpi(entries, roleKey, currentOutlet, month, focusKpi, s.name);
                          const target = getTarget(focusKpi, currentOutlet);
                          const tier = matchIncentiveTier(focusKpi, agg.total);
                          rows.push(<IndividualRowIncentive key={s.id + focusKpi.key} name={s.name} roleLabel={focusKpi.label} actual={agg.total} target={target} unit={focusKpi.unit} tier={tier} />);
                        }
                        return rows;
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="card">
              <div className="progress-head">
                <h4>Rekod Mengikut Tarikh</h4>
                <Field label="Pilih tarikh">
                  <select className="select" value={historyDate} onChange={e => setHistoryDate(e.target.value)}>
                    {datesAvailable.length === 0 && <option value="">Tiada rekod lagi</option>}
                    {datesAvailable.map(d => <option key={d} value={d}>{dateLabel(d)}</option>)}
                  </select>
                </Field>
              </div>
              {historyEntriesForDate.length === 0 ? (
                <div className="empty-box">Belum ada kemaskini direkodkan untuk tarikh ini.</div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Nama</th>
                        {plainKpis.map(k => <th key={k.key}>{k.label}</th>)}
                        {focusKpi && <th>{focusKpi.label}</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {historyEntriesForDate.map(e => (
                        <tr key={e.id}>
                          <td>{e.staffName}</td>
                          {plainKpis.map(k => <td key={k.key} className="num-cell">{fmt(e.values ? e.values[k.key] : 0, k.unit)}</td>)}
                          {focusKpi && (
                            <td className="num-cell">
                              {Array.isArray(e.values && e.values[focusKpi.key]) && e.values[focusKpi.key].length > 0
                                ? e.values[focusKpi.key].map(x => `${x.product}: ${x.qty}`).join(", ")
                                : "—"}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* DASHBOARD TAB                                                           */
/* ---------------------------------------------------------------------- */

function DashboardTab({ kpiConfig, outlets, staffList, entries, month, setMonth, addOutlet, logoUrl, onLogoChange, onLogoReset, pin }) {
  const monthsAvailable = useMemo(() => {
    const set = new Set([currentMonthStr()]);
    entries.forEach(e => set.add(monthOf(e.date)));
    return Array.from(set).sort().reverse();
  }, [entries]);

  const [newOutlet, setNewOutlet] = useState("");
  const [outletMsg, setOutletMsg] = useState("");
  const [reportUnlocked, setReportUnlocked] = useState(false);

  function handleAddOutlet() {
    const trimmed = newOutlet.trim();
    if (!trimmed) return;
    if (outlets.includes(trimmed)) { setOutletMsg("Outlet ini sudah wujud."); return; }
    addOutlet(trimmed);
    setNewOutlet("");
    setOutletMsg(`Outlet "${trimmed}" ditambah.`);
    setTimeout(() => setOutletMsg(""), 2500);
  }

  function handlePrintPdf() {
    window.print();
  }

  function handleLogoFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { alert("Saiz gambar terlalu besar. Sila guna gambar di bawah 4MB."); return; }
    const reader = new FileReader();
    reader.onload = () => onLogoChange(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <div className="tab-body">
      <div className="tab-heading">
        <img src={logoUrl || DEFAULT_LOGO} alt="Logo Proton" className="dash-logo" />
        <div>
          <h2>Ringkasan KPI Syarikat</h2>
          <p className="tab-sub">Proton Indah Sari Otomobil Sdn Bhd — Jerteh</p>
        </div>
      </div>

      <div className="card logo-outlet-row">
        <div className="logo-manager">
          <span className="field-label">Logo Syarikat</span>
          <div className="row-inline">
            <img src={logoUrl || DEFAULT_LOGO} alt="Logo semasa" className="logo-preview" />
            <label className="btn-ghost small file-btn">
              <Upload size={14} /> Tukar Logo
              <input type="file" accept="image/*" onChange={handleLogoFile} hidden />
            </label>
            {logoUrl && (
              <button className="btn-ghost small" onClick={onLogoReset}><RotateCcw size={14} /> Guna Logo Proton Terkini</button>
            )}
          </div>
          <span className="hint-text">Kekalkan logo Proton terkini secara lalai. Muat naik gambar baharu di sini hanya jika logo rasmi Proton berubah.</span>
        </div>
        <div className="outlet-manager">
          <span className="field-label">Outlet</span>
          <div className="row-inline">
            <input className="input" placeholder="Nama outlet baru (cth: Kota Bharu)" value={newOutlet} onChange={e => setNewOutlet(e.target.value)} />
            <button className="btn-primary small" onClick={handleAddOutlet}><Plus size={14} /> Tambah Outlet</button>
          </div>
          {outletMsg && <span className="save-msg">{outletMsg}</span>}
          <span className="hint-text">Outlet sedia ada: {outlets.join(", ")}</span>
        </div>
      </div>

      <PinGate unlocked={reportUnlocked} pin={pin} onUnlock={() => setReportUnlocked(true)} onLock={() => setReportUnlocked(false)}>
        <div className="card report-card">
          <h4><FileText size={16} /> Muat Turun Laporan PDF — {monthLabel(month)}</h4>
          <p className="hint-text">Laporan ringkasan KPI profesional lengkap dengan logo, alamat & no. telefon syarikat, meter peratusan, dan pecahan insentif. Akses terhad kepada Service Manager.</p>
          <div className="row-inline">
            <button className="btn-primary small" onClick={handlePrintPdf}><FileText size={14} /> Muat Turun PDF</button>
          </div>
          <span className="hint-text">Skrin cetak akan terbuka — pilih destinasi "Save as PDF" / "Simpan sebagai PDF", dan pastikan pilihan "Background graphics" / "Grafik latar" dihidupkan untuk hasil terbaik.</span>
        </div>
      </PinGate>

      <Field label="Bulan">
        <select className="select" value={month} onChange={e => setMonth(e.target.value)}>
          {monthsAvailable.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
      </Field>

      <div className="hero-grid">
        {DASHBOARD_METRICS.map(metric => {
          const agg = dashboardAggregate(entries, kpiConfig, metric, null, month);
          const target = DASHBOARD_METRICS.length ? (function () {
            let sum = 0, count = 0;
            outlets.forEach(o => { sum += dashboardTarget(kpiConfig, metric, o); count++; });
            return metric.aggregation === "average" && count ? sum / count : sum;
          })() : 0;
          const st = statusOf(agg.total, target);
          const shortage = Math.max(target - agg.total, 0);
          return (
            <div key={metric.key} className="card hero-card">
              <div className="hero-card-top">
                <span className="eyebrow-plain">{metric.label} keseluruhan syarikat</span>
                <Badge tone={st.tone}>{st.label}</Badge>
              </div>
              <div className="hero-card-body">
                <Gauge percent={st.pct} size={150} />
                <div className="gauge-figures">
                  <div className="gf-row"><span>Pencapaian</span><b>{fmt(agg.total, metric.unit)}</b></div>
                  <div className="gf-row"><span>Sasaran</span><b>{fmt(target, metric.unit)}</b></div>
                  <div className="gf-row"><span>Baki nak capai</span><b className={shortage > 0 ? "num-bad" : "num-good"}>{shortage > 0 ? fmt(shortage, metric.unit) : "Tercapai"}</b></div>
                </div>
              </div>
              {metric.hasSubcategory && (
                <div className="product-chip-row hero-chips">
                  {metric.subcategories.map(p => (
                    <div key={p} className="product-chip"><span>{p}</span><b>{(agg.perProduct && agg.perProduct[p]) || 0} unit</b></div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {DASHBOARD_METRICS.map(metric => (
        <section key={metric.key} className="metric-section">
          <h3>{metric.label} — per outlet</h3>
          <div className="gauge-row">
            {outlets.map(o => {
              const agg = dashboardAggregate(entries, kpiConfig, metric, o, month);
              const target = dashboardTarget(kpiConfig, metric, o);
              return <StatCard key={o} label={metric.label} outlet={o} actual={agg.total} target={target} unit={metric.unit} />;
            })}
          </div>

          <div className="card">
            <h4>{metric.label} — per individu (Service Manager / Service Advisor / Technician{metric.roles.includes("cre") ? " / CRE" : ""})</h4>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Nama</th><th>Jawatan · Outlet</th><th>Pencapaian</th><th>Sasaran</th><th>Baki</th><th>Status</th></tr></thead>
                <tbody>
                  {(() => {
                    const rowsOut = [];
                    metric.roles.forEach(r => {
                      const kpi = kpiConfig[r] && kpiConfig[r].kpis.find(k => k.key === metric.key);
                      if (!kpi) return;
                      staffList.filter(s => s.role === r).forEach(s => {
                        const agg = aggregateKpi(entries, r, s.outlet, month, kpi, s.name);
                        const target = getTarget(kpi, s.outlet);
                        rowsOut.push(<IndividualRow key={s.id} name={s.name} roleLabel={ROLE_MAP[r].label} outlet={s.outlet} actual={agg.total} target={target} unit={metric.unit} />);
                      });
                    });
                    return rowsOut.length ? rowsOut : <tr><td colSpan={6} className="empty-cell">Belum ada staff / data direkodkan.</td></tr>;
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ))}

      <div className="print-report">
        <div className="print-letterhead">
          <img src={logoUrl || DEFAULT_LOGO} alt="Logo Proton" className="print-logo" />
          <div className="print-company">
            <h1>{COMPANY_INFO.name}</h1>
            <p>{COMPANY_INFO.address}</p>
            <p>Tel: {COMPANY_INFO.phone}</p>
          </div>
        </div>

        <div className="print-title-bar">
          <div>
            <h2>Laporan Ringkasan KPI</h2>
            <span className="print-month">{monthLabel(month)}</span>
          </div>
          <span className="print-generated">Dijana: {dateLabel(todayStr())}</span>
        </div>

        <div className="print-summary-grid">
          {DASHBOARD_METRICS.map(metric => {
            const agg = dashboardAggregate(entries, kpiConfig, metric, null, month);
            let sum = 0, count = 0;
            outlets.forEach(o => { sum += dashboardTarget(kpiConfig, metric, o); count++; });
            const target = metric.aggregation === "average" && count ? sum / count : sum;
            const st = statusOf(agg.total, target);
            const shortage = Math.max(target - agg.total, 0);
            return (
              <div className="print-summary-card" key={metric.key}>
                <div className="print-summary-head">
                  <span>{metric.label}</span>
                  <span className={"print-chip print-chip-" + st.tone}>{st.label}</span>
                </div>
                <div className="print-summary-body">
                  <Gauge percent={st.pct} size={92} />
                  <div className="print-summary-figures">
                    <div><span>Pencapaian</span><b>{fmt(agg.total, metric.unit)}</b></div>
                    <div><span>Sasaran</span><b>{fmt(target, metric.unit)}</b></div>
                    <div><span>Baki</span><b>{shortage > 0 ? fmt(shortage, metric.unit) : "Tercapai"}</b></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <h3 className="print-section-title">Prestasi Mengikut Outlet</h3>
        <table className="print-table">
          <thead><tr><th>Outlet</th><th>KPI</th><th>Pencapaian</th><th>Sasaran</th><th>%</th><th>Status</th></tr></thead>
          <tbody>
            {outlets.map(o => DASHBOARD_METRICS.map(metric => {
              const agg = dashboardAggregate(entries, kpiConfig, metric, o, month);
              const target = dashboardTarget(kpiConfig, metric, o);
              const st = statusOf(agg.total, target);
              return (
                <tr key={o + metric.key}>
                  <td>{o}</td>
                  <td>{metric.label}</td>
                  <td>{fmt(agg.total, metric.unit)}</td>
                  <td>{fmt(target, metric.unit)}</td>
                  <td>{st.pct !== null ? Math.round(st.pct) + "%" : "—"}</td>
                  <td><span className={"print-chip print-chip-" + st.tone}>{st.label}</span></td>
                </tr>
              );
            }))}
          </tbody>
        </table>

        <h3 className="print-section-title">Pencapaian & Insentif Individu</h3>
        <table className="print-table">
          <thead><tr><th>Nama</th><th>Jawatan</th><th>Outlet</th><th>KPI</th><th>Pencapaian</th><th>Sasaran</th><th>%</th><th>Status</th><th>Insentif</th></tr></thead>
          <tbody>
            {ROLES.map(r => {
              const cfg = kpiConfig[r.key] || { kpis: [] };
              const rowsOut = [];
              staffList.filter(s => s.role === r.key).forEach(s => {
                cfg.kpis.forEach(k => {
                  const agg = aggregateKpi(entries, r.key, s.outlet, month, k, s.name);
                  const target = getTarget(k, s.outlet);
                  const st = statusOf(agg.total, target);
                  const tier = matchIncentiveTier(k, agg.total);
                  rowsOut.push(
                    <tr key={s.id + k.key}>
                      <td>{s.name}</td><td>{r.label}</td><td>{s.outlet}</td><td>{k.label}</td>
                      <td>{fmt(agg.total, k.unit)}</td><td>{fmt(target, k.unit)}</td>
                      <td>{st.pct !== null ? Math.round(st.pct) + "%" : "—"}</td>
                      <td><span className={"print-chip print-chip-" + st.tone}>{st.label}</span></td>
                      <td className={tier ? "print-incentive" : ""}>{tier ? fmtRM(tier.amount) : "—"}</td>
                    </tr>
                  );
                });
              });
              return rowsOut;
            })}
          </tbody>
        </table>

        <p className="print-footer">Laporan dijana secara automatik oleh Sistem KPI Staff — {COMPANY_INFO.name} ({COMPANY_INFO.address}).</p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* SERVICE MANAGER ADMIN TAB                                               */
/* ---------------------------------------------------------------------- */

function PinGate({ unlocked, pin, onUnlock, onLock, children }) {
  const [input, setInput] = useState("");
  const [err, setErr] = useState("");
  if (unlocked) {
    return (
      <div>
        <div className="pin-status">
          <Unlock size={14} /> Mod admin dibuka
          <button className="btn-ghost small" onClick={onLock}>Kunci semula</button>
        </div>
        {children}
      </div>
    );
  }
  return (
    <div className="card pin-card">
      <Lock size={18} />
      <p>Bahagian ini dikunci PIN Service Manager untuk elak perubahan tanpa kebenaran.</p>
      <div className="row-inline">
        <input className="input" type="password" placeholder="Masukkan PIN" value={input} onChange={e => { setInput(e.target.value); setErr(""); }} />
        <button className="btn-primary small" onClick={() => {
          if (input === pin) { onUnlock(); setInput(""); } else setErr("PIN salah.");
        }}>Buka Kunci</button>
      </div>
      {err && <span className="err-msg">{err}</span>}
    </div>
  );
}

function ServiceManagerTab(props) {
  const {
    kpiConfig, outlets, staffList, entries, month, setMonth, currentOutlet,
    addStaff, upsertEntry, removeStaff, addOutlet, updateKpiConfig, pin, updatePin,
  } = props;

  const [unlocked, setUnlocked] = useState(false);
  const [subTab, setSubTab] = useState("input");

  const SUBS = [
    { key: "input", label: "Input KPI Saya", icon: ClipboardList },
    { key: "overview", label: "Semua Progress", icon: Users },
    { key: "targets", label: "Urus Sasaran", icon: TargetIcon },
    { key: "incentives", label: "Urus Insentif", icon: Coins },
    { key: "kpis", label: "Deskripsi Kerja (KPI)", icon: ListChecks },
    { key: "orgs", label: "Outlet & Staff", icon: Building2 },
    { key: "settings", label: "Tetapan PIN", icon: Settings2 },
  ];

  return (
    <div className="tab-body">
      <div className="tab-heading">
        <ClipboardList size={22} />
        <div>
          <h2>Service Manager</h2>
          <p className="tab-sub">Akses penuh: kemaskini data semua jawatan, urus sasaran, dan urus deskripsi kerja KPI.</p>
        </div>
      </div>

      <div className="subtab-strip">
        {SUBS.map(s => (
          <button key={s.key} className={"subtab-btn" + (subTab === s.key ? " active" : "")} onClick={() => setSubTab(s.key)}>
            <s.icon size={15} /> {s.label}
          </button>
        ))}
      </div>

      {subTab === "input" && (
        <RoleTab
          roleKey="service_manager"
          kpiConfig={kpiConfig} outlets={outlets} currentOutlet={currentOutlet}
          staffList={staffList} entries={entries} addStaff={addStaff} upsertEntry={upsertEntry}
          month={month} setMonth={setMonth}
        />
      )}

      {subTab === "overview" && (
        <div className="overview-body">
          <p className="hint-text">Gambaran keseluruhan pencapaian setiap jawatan, setiap outlet, berbanding sasaran yang ditetapkan.</p>
          <Field label="Bulan">
            <select className="select" value={month} onChange={e => setMonth(e.target.value)}>
              {(() => {
                const set = new Set([currentMonthStr()]);
                entries.forEach(e => set.add(monthOf(e.date)));
                return Array.from(set).sort().reverse().map(m => <option key={m} value={m}>{monthLabel(m)}</option>);
              })()}
            </select>
          </Field>
          {ROLES.map(r => {
            const cfg = kpiConfig[r.key] || { kpis: [] };
            if (cfg.kpis.length === 0) return null;
            return (
              <div className="card" key={r.key}>
                <h4><r.icon size={16} /> {r.label}</h4>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Outlet</th><th>KPI</th><th>Pencapaian</th><th>Sasaran</th><th>Baki</th><th>Status</th></tr></thead>
                    <tbody>
                      {outlets.map(o => cfg.kpis.map(k => {
                        const agg = aggregateKpi(entries, r.key, o, month, k);
                        const target = getTarget(k, o);
                        const st = statusOf(agg.total, target);
                        const shortage = Math.max(target - agg.total, 0);
                        return (
                          <tr key={o + k.key}>
                            <td>{o}</td>
                            <td>{k.label}</td>
                            <td className="num-cell">{fmt(agg.total, k.unit)}</td>
                            <td className="num-cell">{fmt(target, k.unit)}</td>
                            <td className="num-cell">{shortage > 0 ? fmt(shortage, k.unit) : "—"}</td>
                            <td><Badge tone={st.tone}>{st.label}</Badge></td>
                          </tr>
                        );
                      }))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {subTab === "targets" && (
        <PinGate unlocked={unlocked} pin={pin} onUnlock={() => setUnlocked(true)} onLock={() => setUnlocked(false)}>
          <p className="hint-text">
            Sasaran <b>Throughput, Revenue, CSI</b> dan <b>Focus Product</b> ditetapkan SEKALI sahaja di bawah, dan terpakai
            automatik untuk semua jawatan berkaitan (Service Manager, Service Advisor, Technician{" / CRE (untuk CSI)"}).
            Sasaran KPI lain (Stockholding, Deadstock, Approval Rate, dll) ditetapkan berasingan bagi setiap jawatan.
          </p>

          <div className="card">
            <h4><TargetIcon size={16} /> Sasaran Bersepadu (semua jawatan berkaitan)</h4>
            <div className="table-wrap">
              <table>
                <thead><tr><th>KPI</th>{outlets.map(o => <th key={o}>{o}</th>)}</tr></thead>
                <tbody>
                  {DASHBOARD_METRICS.map(metric => (
                    <tr key={metric.key}>
                      <td>{metric.label} <span className="muted-cell">({metric.unit})</span></td>
                      {outlets.map(o => {
                        let current = 0;
                        for (const r of metric.roles) {
                          const kpi = kpiConfig[r] && kpiConfig[r].kpis.find(k => k.key === metric.key);
                          if (kpi) { current = getTarget(kpi, o); break; }
                        }
                        return (
                          <td key={o}>
                            <input
                              className="input target-input"
                              type="number" min="0" step="any"
                              value={current}
                              onChange={e => {
                                const num = Number(e.target.value) || 0;
                                const next = JSON.parse(JSON.stringify(kpiConfig));
                                metric.roles.forEach(r => {
                                  const kk = next[r] && next[r].kpis.find(x => x.key === metric.key);
                                  if (kk) {
                                    if (!kk.targets) kk.targets = { default: 0 };
                                    kk.targets[o] = num;
                                  }
                                });
                                updateKpiConfig(next);
                              }}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {ROLES.map(r => {
            const cfg = kpiConfig[r.key] || { kpis: [] };
            const ownKpis = cfg.kpis.filter(k => !SHARED_KPI_KEYS.includes(k.key));
            if (ownKpis.length === 0) return null;
            return (
              <div className="card" key={r.key}>
                <h4><r.icon size={16} /> {r.label}</h4>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>KPI</th>{outlets.map(o => <th key={o}>{o}</th>)}</tr></thead>
                    <tbody>
                      {ownKpis.map(k => (
                        <tr key={k.key}>
                          <td>{k.label} <span className="muted-cell">({k.unit})</span></td>
                          {outlets.map(o => (
                            <td key={o}>
                              <input
                                className="input target-input"
                                type="number" min="0" step="any"
                                value={getTarget(k, o)}
                                onChange={e => {
                                  const next = JSON.parse(JSON.stringify(kpiConfig));
                                  const kk = next[r.key].kpis.find(x => x.key === k.key);
                                  if (!kk.targets) kk.targets = { default: 0 };
                                  kk.targets[o] = Number(e.target.value) || 0;
                                  updateKpiConfig(next);
                                }}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </PinGate>
      )}

      {subTab === "incentives" && (
        <PinGate unlocked={unlocked} pin={pin} onUnlock={() => setUnlocked(true)} onLock={() => setUnlocked(false)}>
          <IncentiveEditor kpiConfig={kpiConfig} updateKpiConfig={updateKpiConfig} />
        </PinGate>
      )}

      {subTab === "kpis" && (
        <PinGate unlocked={unlocked} pin={pin} onUnlock={() => setUnlocked(true)} onLock={() => setUnlocked(false)}>
          <p className="hint-text">Tambah atau buang KPI / deskripsi kerja bagi setiap jawatan. Perubahan di sini terpakai untuk semua outlet.</p>
          {ROLES.map(r => <KpiEditor key={r.key} roleKey={r.key} roleLabel={r.label} Icon={r.icon} kpiConfig={kpiConfig} updateKpiConfig={updateKpiConfig} />)}
        </PinGate>
      )}

      {subTab === "orgs" && (
        <PinGate unlocked={unlocked} pin={pin} onUnlock={() => setUnlocked(true)} onLock={() => setUnlocked(false)}>
          <OrgManager outlets={outlets} staffList={staffList} addOutlet={addOutlet} addStaff={addStaff} removeStaff={removeStaff} />
        </PinGate>
      )}

      {subTab === "settings" && (
        <PinGate unlocked={unlocked} pin={pin} onUnlock={() => setUnlocked(true)} onLock={() => setUnlocked(false)}>
          <PinSettings pin={pin} updatePin={updatePin} />
        </PinGate>
      )}
    </div>
  );
}

function IncentiveEditor({ kpiConfig, updateKpiConfig }) {
  function addTier(roleKey, kpiKey) {
    const next = JSON.parse(JSON.stringify(kpiConfig));
    const kpi = next[roleKey].kpis.find(k => k.key === kpiKey);
    if (!kpi.incentiveTiers) kpi.incentiveTiers = [];
    kpi.incentiveTiers.push({ id: uid(), label: "", min: "", max: "", amount: 0 });
    updateKpiConfig(next);
  }
  function updateTier(roleKey, kpiKey, tierId, field, value) {
    const next = JSON.parse(JSON.stringify(kpiConfig));
    const kpi = next[roleKey].kpis.find(k => k.key === kpiKey);
    const tier = (kpi.incentiveTiers || []).find(t => t.id === tierId);
    if (tier) tier[field] = field === "amount" ? Number(value) || 0 : value;
    updateKpiConfig(next);
  }
  function removeTier(roleKey, kpiKey, tierId) {
    const next = JSON.parse(JSON.stringify(kpiConfig));
    const kpi = next[roleKey].kpis.find(k => k.key === kpiKey);
    kpi.incentiveTiers = (kpi.incentiveTiers || []).filter(t => t.id !== tierId);
    updateKpiConfig(next);
  }

  return (
    <div>
      <p className="hint-text">
        Tetapkan insentif (RM) mengikut julat pencapaian bulanan bagi setiap KPI. Contoh: Stockholding - Fast Moving
        boleh ada julat "0.5–1 bulan → RM50" dan "bawah 0.5 bulan → RM150". Staff hanya keyin data harian seperti biasa —
        insentif dikira dan dipaparkan secara automatik berdasarkan julat yang ditetapkan di sini.
        Biarkan Minimum/Maksimum kosong bermaksud "tiada had" pada arah tersebut.
      </p>
      {ROLES.map(r => {
        const cfg = kpiConfig[r.key] || { kpis: [] };
        if (cfg.kpis.length === 0) return null;
        return (
          <div className="card" key={r.key}>
            <h4><r.icon size={16} /> {r.label}</h4>
            {cfg.kpis.map(k => (
              <div key={k.key} className="incentive-kpi-block">
                <div className="incentive-kpi-head">{k.label} <span className="muted-cell">({k.unit})</span></div>
                {(k.incentiveTiers || []).length === 0 ? (
                  <div className="empty-box small">Belum ada julat insentif ditetapkan untuk KPI ini.</div>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Label</th><th>Minimum</th><th>Maksimum</th><th>Insentif (RM)</th><th></th></tr></thead>
                      <tbody>
                        {k.incentiveTiers.map(t => (
                          <tr key={t.id}>
                            <td><input className="input" value={t.label} placeholder="cth: Bawah 0.5 bulan" onChange={e => updateTier(r.key, k.key, t.id, "label", e.target.value)} /></td>
                            <td><input className="input target-input" type="number" step="any" value={t.min} placeholder="tiada had" onChange={e => updateTier(r.key, k.key, t.id, "min", e.target.value)} /></td>
                            <td><input className="input target-input" type="number" step="any" value={t.max} placeholder="tiada had" onChange={e => updateTier(r.key, k.key, t.id, "max", e.target.value)} /></td>
                            <td><input className="input target-input" type="number" step="any" min="0" value={t.amount} onChange={e => updateTier(r.key, k.key, t.id, "amount", e.target.value)} /></td>
                            <td><button className="icon-btn" onClick={() => removeTier(r.key, k.key, t.id)}><Trash2 size={14} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <button className="btn-ghost small" onClick={() => addTier(r.key, k.key)}><Plus size={14} /> Tambah Julat</button>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function KpiEditor({ roleKey, roleLabel, Icon, kpiConfig, updateKpiConfig }) {
  const cfg = kpiConfig[roleKey] || { kpis: [] };
  const [label, setLabel] = useState("");
  const [unit, setUnit] = useState("unit");
  const [aggregation, setAggregation] = useState("sum");
  const [hasSub, setHasSub] = useState(false);
  const [subText, setSubText] = useState("");

  function addKpi() {
    if (!label.trim()) return;
    const key = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") + "_" + Math.random().toString(36).slice(2, 5);
    const kpi = { key, label: label.trim(), unit, aggregation, targets: { default: 0 } };
    if (hasSub) {
      kpi.hasSubcategory = true;
      kpi.subcategories = subText.split(",").map(s => s.trim()).filter(Boolean);
    }
    const next = { ...kpiConfig, [roleKey]: { ...cfg, kpis: [...cfg.kpis, kpi] } };
    updateKpiConfig(next);
    setLabel(""); setSubText(""); setHasSub(false);
  }

  function removeKpi(key) {
    const next = { ...kpiConfig, [roleKey]: { ...cfg, kpis: cfg.kpis.filter(k => k.key !== key) } };
    updateKpiConfig(next);
  }

  return (
    <div className="card">
      <h4><Icon size={16} /> {roleLabel}</h4>
      {cfg.kpis.length === 0 ? (
        <div className="empty-box">Belum ada KPI ditetapkan bagi jawatan ini.</div>
      ) : (
        <ul className="kpi-list">
          {cfg.kpis.map(k => (
            <li key={k.key}>
              <span>{k.label} <span className="muted-cell">({k.unit}{k.hasSubcategory ? " · " + k.subcategories.join("/") : ""})</span></span>
              <button className="icon-btn" onClick={() => removeKpi(k.key)}><Trash2 size={14} /></button>
            </li>
          ))}
        </ul>
      )}
      <div className="kpi-add-row">
        <input className="input" placeholder="Nama KPI baru" value={label} onChange={e => setLabel(e.target.value)} />
        <select className="select" value={unit} onChange={e => setUnit(e.target.value)}>
          <option value="unit">unit</option>
          <option value="RM">RM</option>
          <option value="%">%</option>
        </select>
        <select className="select" value={aggregation} onChange={e => setAggregation(e.target.value)}>
          <option value="sum">Jumlah (sum)</option>
          <option value="average">Purata (average)</option>
          <option value="latest">Nilai terkini (latest)</option>
        </select>
        <label className="checkbox-row">
          <input type="checkbox" checked={hasSub} onChange={e => setHasSub(e.target.checked)} /> Ada sub-kategori
        </label>
        {hasSub && <input className="input" placeholder="cth: Battery, Brake Pad, Wiper" value={subText} onChange={e => setSubText(e.target.value)} />}
        <button className="btn-primary small" onClick={addKpi}><Plus size={14} /> Tambah KPI</button>
      </div>
    </div>
  );
}

function OrgManager({ outlets, staffList, addOutlet, addStaff, removeStaff }) {
  const [newOutlet, setNewOutlet] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState(ROLES[0].key);
  const [outlet, setOutlet] = useState(outlets[0] || "");

  return (
    <div>
      <div className="card">
        <h4><Building2 size={16} /> Outlet</h4>
        <ul className="kpi-list">
          {outlets.map(o => <li key={o}><span>{o}</span></li>)}
        </ul>
        <div className="row-inline">
          <input className="input" placeholder="Nama outlet baru (cth: Kota Bharu)" value={newOutlet} onChange={e => setNewOutlet(e.target.value)} />
          <button className="btn-primary small" onClick={() => { if (newOutlet.trim()) { addOutlet(newOutlet); setOutlet(newOutlet.trim()); setNewOutlet(""); } }}><Plus size={14} /> Tambah Outlet</button>
        </div>
      </div>

      <div className="card">
        <h4><Users size={16} /> Staff</h4>
        {staffList.length === 0 ? (
          <div className="empty-box">Belum ada staff didaftar.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Nama</th><th>Jawatan</th><th>Outlet</th><th></th></tr></thead>
              <tbody>
                {staffList.map(s => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{ROLE_MAP[s.role] ? ROLE_MAP[s.role].label : s.role}</td>
                    <td>{s.outlet}</td>
                    <td><button className="icon-btn" onClick={() => removeStaff(s.id)}><Trash2 size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="kpi-add-row">
          <input className="input" placeholder="Nama penuh staff" value={name} onChange={e => setName(e.target.value)} />
          <select className="select" value={role} onChange={e => setRole(e.target.value)}>
            {ROLES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
          <select className="select" value={outlet} onChange={e => setOutlet(e.target.value)}>
            {outlets.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <button className="btn-primary small" onClick={() => { if (name.trim()) { addStaff(name, role, outlet); setName(""); } }}><Plus size={14} /> Tambah Staff</button>
        </div>
      </div>
    </div>
  );
}

function PinSettings({ pin, updatePin }) {
  const [current, setCurrent] = useState("");
  const [next1, setNext1] = useState("");
  const [next2, setNext2] = useState("");
  const [msg, setMsg] = useState("");
  return (
    <div className="card">
      <h4><Lock size={16} /> Tukar PIN Service Manager</h4>
      <p className="hint-text">PIN ini melindungi bahagian Urus Sasaran, Deskripsi Kerja, dan Outlet & Staff daripada diubah sesuka hati.</p>
      <div className="entry-grid">
        <Field label="PIN semasa"><input className="input" type="password" value={current} onChange={e => setCurrent(e.target.value)} /></Field>
        <Field label="PIN baru"><input className="input" type="password" value={next1} onChange={e => setNext1(e.target.value)} /></Field>
        <Field label="Sahkan PIN baru"><input className="input" type="password" value={next2} onChange={e => setNext2(e.target.value)} /></Field>
      </div>
      <div className="row-inline">
        <button className="btn-primary small" onClick={() => {
          if (current !== pin) { setMsg("PIN semasa tidak sepadan."); return; }
          if (!next1 || next1 !== next2) { setMsg("PIN baru tidak sepadan."); return; }
          updatePin(next1);
          setMsg("PIN berjaya dikemaskini.");
          setCurrent(""); setNext1(""); setNext2("");
        }}>Kemaskini PIN</button>
        {msg && <span className="save-msg">{msg}</span>}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* ROOT APP                                                                 */
/* ---------------------------------------------------------------------- */

export default function ProtonKpiApp() {
  const [loading, setLoading] = useState(true);
  const [outlets, setOutlets] = useState(["Jerteh"]);
  const [staffList, setStaffList] = useState([]);
  const [kpiConfig, setKpiConfig] = useState(defaultKpiConfig());
  const [entries, setEntries] = useState([]);
  const [pin, setPin] = useState("1234");
  const [logoUrl, setLogoUrl] = useState(null);
  const [currentOutlet, setCurrentOutlet] = useState("Jerteh");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [month, setMonth] = useState(currentMonthStr());
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    (async () => {
      async function safeGet(key, fallback) {
        try {
          const r = await window.storage.get(key, true);
          if (r && r.value != null) return JSON.parse(r.value);
          return fallback;
        } catch (e) { return fallback; }
      }
      const [o, s, k, e, p, lg] = await Promise.all([
        safeGet("psi_outlets", ["Jerteh"]),
        safeGet("psi_staff", []),
        safeGet("psi_kpiConfig", defaultKpiConfig()),
        safeGet("psi_entries", []),
        safeGet("psi_smPin", "1234"),
        safeGet("psi_logo", null),
      ]);
      setOutlets(o.length ? o : ["Jerteh"]);
      setStaffList(s);
      setKpiConfig(k);
      setEntries(e);
      setPin(p);
      setLogoUrl(lg);
      setCurrentOutlet((o.length ? o : ["Jerteh"])[0]);
      setLoading(false);
    })();
  }, []);

  async function saveKey(key, value) {
    try { await window.storage.set(key, JSON.stringify(value), true); }
    catch (e) { setSaveError("Gagal menyimpan data. Sila cuba lagi."); setTimeout(() => setSaveError(""), 3000); }
  }

  function updateOutlets(next) { setOutlets(next); saveKey("psi_outlets", next); }
  function updateStaffList(next) { setStaffList(next); saveKey("psi_staff", next); }
  function updateKpiConfig(next) { setKpiConfig(next); saveKey("psi_kpiConfig", next); }
  function updateEntries(next) { setEntries(next); saveKey("psi_entries", next); }
  function updatePin(next) { setPin(next); saveKey("psi_smPin", next); }
  function updateLogo(dataUrl) { setLogoUrl(dataUrl); saveKey("psi_logo", dataUrl); }
  function resetLogo() { setLogoUrl(null); saveKey("psi_logo", null); }

  function addOutlet(name) {
    const trimmed = name.trim();
    if (!trimmed || outlets.includes(trimmed)) return;
    updateOutlets([...outlets, trimmed]);
  }

  function addStaff(name, role, outlet) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const exists = staffList.some(s => s.name.toLowerCase() === trimmed.toLowerCase() && s.role === role && s.outlet === outlet);
    if (exists) return;
    updateStaffList([...staffList, { id: uid(), name: trimmed, role, outlet }]);
  }
  function removeStaff(id) { updateStaffList(staffList.filter(s => s.id !== id)); }

  function upsertEntry(draft) {
    const idx = entries.findIndex(e => e.date === draft.date && e.outlet === draft.outlet && e.role === draft.role && e.staffName === draft.staffName);
    let next;
    if (idx >= 0) { next = [...entries]; next[idx] = { ...next[idx], values: draft.values }; }
    else next = [...entries, { id: uid(), ...draft }];
    updateEntries(next);
  }

  if (loading) {
    return (
      <div className="psi-app loading-screen">
        <style>{GLOBAL_CSS}</style>
        <Loader2 className="spin" size={28} />
        <span>Memuatkan sistem KPI…</span>
      </div>
    );
  }

  return (
    <div className="psi-app">
      <style>{GLOBAL_CSS}</style>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><img src={logoUrl || DEFAULT_LOGO} alt="Logo Proton" /></div>
          <div className="brand-text">
            <b>Proton Indah Sari Otomobil</b>
            <span>Sistem KPI Staff</span>
          </div>
        </div>
        <nav className="nav">
          <button className={"nav-btn" + (activeTab === "dashboard" ? " active" : "")} onClick={() => setActiveTab("dashboard")}>
            <LayoutDashboard size={17} /> Dashboard
          </button>
          {ROLES.map(r => (
            <button key={r.key} className={"nav-btn" + (activeTab === r.key ? " active" : "")} onClick={() => setActiveTab(r.key)}>
              <r.icon size={17} /> {r.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">Data dikongsi bersama semua pengguna sistem ini.</div>
      </aside>

      <div className="main-col">
        <header className="topbar">
          <div className="topbar-left">
            <span className="outlet-label">Outlet</span>
            <select className="select outlet-select" value={currentOutlet} onChange={e => setCurrentOutlet(e.target.value)}>
              {outlets.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="topbar-right">
            <CalendarDays size={15} />
            <span>{dateLabel(todayStr())}</span>
          </div>
        </header>
        {saveError && <div className="err-banner">{saveError}</div>}
        <main className="content">
          {activeTab === "dashboard" && (
            <DashboardTab
              kpiConfig={kpiConfig} outlets={outlets} staffList={staffList} entries={entries} month={month} setMonth={setMonth}
              addOutlet={addOutlet} logoUrl={logoUrl} onLogoChange={updateLogo} onLogoReset={resetLogo} pin={pin}
            />
          )}
          {activeTab === "service_manager" && (
            <ServiceManagerTab
              kpiConfig={kpiConfig} outlets={outlets} staffList={staffList} entries={entries}
              month={month} setMonth={setMonth} currentOutlet={currentOutlet}
              addStaff={addStaff} upsertEntry={upsertEntry} removeStaff={removeStaff} addOutlet={addOutlet}
              updateKpiConfig={updateKpiConfig} pin={pin} updatePin={updatePin}
            />
          )}
          {["service_advisor", "technician", "cre", "telemarketer", "parts_officer", "warranty_officer"].includes(activeTab) && (
            <RoleTab
              roleKey={activeTab}
              kpiConfig={kpiConfig} outlets={outlets} currentOutlet={currentOutlet}
              staffList={staffList} entries={entries} addStaff={addStaff} upsertEntry={upsertEntry}
              month={month} setMonth={setMonth}
            />
          )}
        </main>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* CSS                                                                      */
/* ---------------------------------------------------------------------- */

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');

.psi-app {
  --bg: #eef1f4;
  --surface: #ffffff;
  --border: #d8dfe6;
  --ink: #17212b;
  --ink-soft: #57616c;
  --accent: #21508a;
  --accent-soft: #e7eef6;
  --good: #2f8558;
  --good-soft: #e4f3ea;
  --warn: #c77f1b;
  --warn-soft: #fbf0dc;
  --bad: #c1401f;
  --bad-soft: #fbe5dd;
  --track: #e2e7ec;
  --panel: #16202b;
  --panel-ink: #cfdaE6;
  --panel-active: #21508a;

  font-family: 'Inter', system-ui, sans-serif;
  color: var(--ink);
  background: var(--bg);
  display: flex;
  min-height: 640px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--border);
}
.psi-app * { box-sizing: border-box; }
.psi-app table { font-variant-numeric: tabular-nums; }

.loading-screen { align-items: center; justify-content: center; gap: 10px; padding: 60px; }
.spin { animation: spin 1s linear infinite; color: var(--accent); }
@keyframes spin { to { transform: rotate(360deg); } }

.sidebar {
  width: 232px;
  flex-shrink: 0;
  background: var(--panel);
  color: var(--panel-ink);
  display: flex;
  flex-direction: column;
  padding: 18px 14px;
}
.brand { display: flex; align-items: center; gap: 10px; padding: 4px 4px 18px; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 12px; }
.brand-mark {
  width: 40px; height: 40px; border-radius: 10px; background: #fff;
  display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;
  border: 1px solid rgba(255,255,255,0.15);
}
.brand-mark img { width: 100%; height: 100%; object-fit: contain; padding: 4px; }
.dash-logo { width: 44px; height: 44px; object-fit: contain; flex-shrink: 0; }
.logo-outlet-row { flex-direction: row; flex-wrap: wrap; gap: 26px; align-items: flex-start; }
.logo-manager, .outlet-manager { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 240px; }
.logo-preview { width: 46px; height: 46px; object-fit: contain; border: 1px solid var(--border); border-radius: 8px; padding: 4px; background: #fff; }
.file-btn { cursor: pointer; }
.brand-text { display: flex; flex-direction: column; line-height: 1.25; }
.brand-text b { font-family: 'Oswald', sans-serif; font-size: 13.5px; font-weight: 600; color: #fff; }
.brand-text span { font-size: 11px; color: #93a3b5; }

.nav { display: flex; flex-direction: column; gap: 3px; flex: 1; overflow-y: auto; }
.nav-btn {
  display: flex; align-items: center; gap: 10px; text-align: left;
  background: transparent; border: none; color: var(--panel-ink);
  padding: 9px 10px; border-radius: 8px; font-size: 13.5px; font-weight: 500; cursor: pointer;
  transition: background 0.15s;
}
.nav-btn:hover { background: rgba(255,255,255,0.06); }
.nav-btn.active { background: var(--panel-active); color: #fff; }
.sidebar-foot { font-size: 10.5px; color: #7c8ca0; padding: 10px 6px 0; border-top: 1px solid rgba(255,255,255,0.08); margin-top: 10px; }

.main-col { flex: 1; display: flex; flex-direction: column; min-width: 0; background: var(--bg); }
.topbar { display: flex; align-items: center; justify-content: space-between; padding: 14px 24px; background: var(--surface); border-bottom: 1px solid var(--border); }
.topbar-left { display: flex; align-items: center; gap: 10px; }
.outlet-label { font-size: 12px; color: var(--ink-soft); font-weight: 600; }
.outlet-select { min-width: 140px; }
.topbar-right { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--ink-soft); }

.err-banner { background: var(--bad-soft); color: var(--bad); padding: 8px 24px; font-size: 12.5px; }

.content { padding: 22px 26px 40px; overflow-y: auto; flex: 1; }

.tab-body { display: flex; flex-direction: column; gap: 18px; }
.tab-heading { display: flex; align-items: flex-start; gap: 12px; }
.tab-heading h2 { font-family: 'Oswald', sans-serif; font-size: 21px; font-weight: 600; margin: 0; }
.tab-sub { font-size: 12.5px; color: var(--ink-soft); margin: 3px 0 0; }

.card {
  background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
  padding: 16px 18px; display: flex; flex-direction: column; gap: 10px;
}
.card h3 { font-family: 'Oswald', sans-serif; font-size: 15.5px; margin: 0; font-weight: 600; }
.card h4 { font-family: 'Oswald', sans-serif; font-size: 13.5px; margin: 0; font-weight: 600; display: flex; align-items: center; gap: 6px; }

.entry-card { gap: 14px; }
.entry-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
.kpi-input-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; }

.field { display: flex; flex-direction: column; gap: 5px; }
.field-label { font-size: 11.5px; color: var(--ink-soft); font-weight: 600; }

.input, .select {
  border: 1px solid var(--border); border-radius: 8px; padding: 8px 10px; font-size: 13.5px;
  font-family: 'Inter', sans-serif; color: var(--ink); background: #fff; outline: none;
}
.input:focus, .select:focus { border-color: var(--accent); }
.input.qty { max-width: 90px; }
.input.target-input { max-width: 100px; }

.row-inline { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.save-row { margin-top: 4px; }
.save-msg { font-size: 12.5px; color: var(--good); }
.err-msg { font-size: 12.5px; color: var(--bad); }

.btn-primary, .btn-ghost {
  border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
  padding: 9px 16px; border: none;
}
.btn-primary { background: var(--accent); color: #fff; }
.btn-primary:hover { background: #1a4272; }
.btn-ghost { background: var(--accent-soft); color: var(--accent); }
.btn-ghost:hover { background: #dbe6f3; }
.btn-primary.small, .btn-ghost.small { padding: 6px 11px; font-size: 12px; }

.icon-btn { background: transparent; border: none; color: var(--ink-soft); cursor: pointer; padding: 4px; border-radius: 6px; }
.icon-btn:hover { background: var(--bad-soft); color: var(--bad); }

.focus-block { display: flex; flex-direction: column; gap: 8px; padding-top: 4px; border-top: 1px dashed var(--border); }
.focus-list { list-style: none; margin: 4px 0 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.focus-list li { display: flex; align-items: center; gap: 10px; font-size: 13px; background: var(--bg); border-radius: 6px; padding: 5px 10px; }
.focus-list li span { flex: 1; color: var(--ink-soft); }

.progress-section { display: flex; flex-direction: column; gap: 16px; }
.progress-head { display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
.progress-head h3, .progress-head h4 { margin: 0; }

.gauge-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 14px; }
.gauge-card { align-items: center; text-align: center; }
.gauge-card-head { width: 100%; }
.eyebrow-plain { font-size: 12px; color: var(--ink-soft); font-weight: 600; }
.gauge-num { font-family: 'Oswald', sans-serif; font-size: 20px; font-weight: 600; fill: var(--ink); }
.gauge-figures { width: 100%; display: flex; flex-direction: column; gap: 3px; }
.gf-row { display: flex; justify-content: space-between; font-size: 12.5px; color: var(--ink-soft); }
.gf-row b { color: var(--ink); font-weight: 600; }
.num-good { color: var(--good) !important; }
.num-bad { color: var(--bad) !important; }

.badge { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 999px; display: inline-block; }
.badge-good { background: var(--good-soft); color: var(--good); }
.badge-warn { background: var(--warn-soft); color: var(--warn); }
.badge-bad { background: var(--bad-soft); color: var(--bad); }
.badge-muted { background: var(--track); color: var(--ink-soft); }

.product-breakdown { gap: 8px; }
.product-chip-row { display: flex; gap: 10px; flex-wrap: wrap; }
.hero-chips { padding-top: 6px; border-top: 1px dashed var(--border); }
.product-chip { display: flex; flex-direction: column; gap: 2px; background: var(--bg); border-radius: 8px; padding: 8px 14px; min-width: 90px; }
.product-chip span { font-size: 11px; color: var(--ink-soft); }
.product-chip b { font-family: 'Oswald', sans-serif; font-size: 15px; }

.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
thead th { text-align: left; font-size: 11px; text-transform: none; color: var(--ink-soft); font-weight: 600; padding: 6px 8px; border-bottom: 1px solid var(--border); }
tbody td { padding: 7px 8px; border-bottom: 1px solid #eef1f4; }
.num-cell { font-variant-numeric: tabular-nums; }
.muted-cell { color: var(--ink-soft); font-size: 11.5px; }
.empty-cell { text-align: center; color: var(--ink-soft); padding: 16px; }

.empty-box { background: var(--bg); border: 1px dashed var(--border); border-radius: 10px; padding: 16px; font-size: 13px; color: var(--ink-soft); }
.hint-text { font-size: 12.5px; color: var(--ink-soft); margin: 0; }

.hero-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; }
.hero-card { align-items: center; }
.hero-card-top { width: 100%; display: flex; align-items: center; justify-content: space-between; }
.hero-card-body { display: flex; flex-direction: column; align-items: center; gap: 6px; width: 100%; }

.metric-section { display: flex; flex-direction: column; gap: 10px; }
.metric-section h3 { font-family: 'Oswald', sans-serif; font-size: 15.5px; margin: 6px 0 0; font-weight: 600; }

.report-card { gap: 10px; }

.print-report { display: none; }
@media print {
  @page { margin: 14mm; }
  body * { visibility: hidden; }
  .print-report, .print-report * { visibility: visible; }
  .print-report {
    display: block !important; position: absolute; top: 0; left: 0; width: 100%;
    font-family: 'Inter', system-ui, sans-serif; color: #17212b;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }

  .print-letterhead { display: flex; align-items: center; gap: 16px; border-bottom: 3px solid #21508a; padding-bottom: 10px; margin-bottom: 10px; }
  .print-logo { width: 58px; height: 58px; object-fit: contain; flex-shrink: 0; }
  .print-company h1 { font-family: 'Oswald', sans-serif; font-size: 15px; margin: 0 0 3px; color: #21508a; letter-spacing: 0.02em; }
  .print-company p { font-size: 10px; margin: 0; color: #444; }

  .print-title-bar { display: flex; justify-content: space-between; align-items: baseline; margin: 0 0 14px; }
  .print-title-bar h2 { font-family: 'Oswald', sans-serif; font-size: 16px; margin: 0; display: inline; color: #17212b; }
  .print-month { font-size: 11.5px; color: #21508a; font-weight: 700; margin-left: 8px; }
  .print-generated { font-size: 9.5px; color: #777; }

  .print-summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 16px; }
  .print-summary-card { border: 1px solid #d5dbe2; border-radius: 10px; padding: 10px 12px; page-break-inside: avoid; background: #fafbfc; }
  .print-summary-head { display: flex; justify-content: space-between; align-items: center; font-size: 11.5px; font-weight: 700; margin-bottom: 6px; }
  .print-summary-body { display: flex; align-items: center; gap: 12px; }
  .print-summary-figures { display: flex; flex-direction: column; gap: 3px; font-size: 10.5px; flex: 1; }
  .print-summary-figures div { display: flex; justify-content: space-between; gap: 10px; }
  .print-summary-figures span { color: #667; }
  .print-summary-figures b { color: #17212b; }

  .print-section-title { font-family: 'Oswald', sans-serif; font-size: 13px; color: #21508a; margin: 16px 0 6px; border-bottom: 1px solid #d5dbe2; padding-bottom: 4px; }
  .print-table { width: 100%; border-collapse: collapse; margin-bottom: 6px; page-break-inside: auto; }
  .print-table th { background: #21508a; color: #fff; border: 1px solid #21508a; padding: 5px 7px; font-size: 9.5px; text-align: left; }
  .print-table td { border: 1px solid #d5dbe2; padding: 4px 7px; font-size: 9.5px; text-align: left; }
  .print-table tbody tr:nth-child(even) { background: #f2f5f9; }
  .print-table tr { page-break-inside: avoid; }
  .print-incentive { color: #1f7a46; font-weight: 700; }

  .print-chip { display: inline-block; padding: 2px 9px; border-radius: 999px; font-size: 8.5px; font-weight: 700; white-space: nowrap; }
  .print-chip-good { background: #dff5e6; color: #1f7a46; border: 1px solid #79c79b; }
  .print-chip-warn { background: #fdf1d9; color: #a96b12; border: 1px solid #e0ab55; }
  .print-chip-bad { background: #fbe1da; color: #a3341a; border: 1px solid #dd8265; }
  .print-chip-muted { background: #eceef0; color: #667; border: 1px solid #ccc; }

  .print-footer { font-size: 9px; color: #888; margin-top: 18px; border-top: 1px solid #d5dbe2; padding-top: 8px; }
}

.incentive-kpi-block { border-top: 1px dashed var(--border); padding-top: 10px; margin-top: 10px; display: flex; flex-direction: column; gap: 8px; }
.incentive-kpi-block:first-of-type { border-top: none; margin-top: 0; padding-top: 0; }
.incentive-kpi-head { font-weight: 600; font-size: 12.5px; }
.empty-box.small { padding: 8px 10px; font-size: 12px; }
.incentive-mini-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 12px 16px; display: flex; flex-direction: column; gap: 8px; }
.incentive-mini-card .field-label { display: flex; align-items: center; gap: 5px; }
.subtab-btn {
  display: flex; align-items: center; gap: 6px; border: 1px solid var(--border); background: #fff;
  padding: 7px 12px; border-radius: 999px; font-size: 12.5px; font-weight: 600; color: var(--ink-soft); cursor: pointer;
}
.subtab-btn.active { background: var(--accent); border-color: var(--accent); color: #fff; }

.overview-body { display: flex; flex-direction: column; gap: 14px; }

.pin-card { align-items: flex-start; max-width: 380px; }
.pin-status { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--good); margin-bottom: 10px; }

.kpi-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.kpi-list li { display: flex; align-items: center; justify-content: space-between; background: var(--bg); border-radius: 6px; padding: 6px 10px; font-size: 12.5px; }
.kpi-add-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; padding-top: 8px; border-top: 1px dashed var(--border); }
.checkbox-row { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--ink-soft); }

@media (max-width: 760px) {
  .psi-app { flex-direction: column; }
  .sidebar { width: 100%; flex-direction: row; overflow-x: auto; align-items: center; }
  .brand { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
  .nav { flex-direction: row; }
  .sidebar-foot { display: none; }
}
`;
