/**
 * MinePod by Lourdes Auto Parts - Application Controller
 * Mengelola antarmuka, state lokal, sinkronisasi Supabase, dan event UI.
 */

import { supabaseManager } from './supabase.js';

// ==========================================================================
// KONSTANTA & DEFINISI DATA PRODUKSI
// ==========================================================================

export const ST = ["Pra-Produksi", "Produksi", "Pasca-Produksi", "Distribusi", "Evaluasi", "Selesai"];
export const PIC = [
  "Marketing",
  "Host, Audio Operator, Kameramen",
  "Audio & Video Editor",
  "Social Media / Marketing",
  "Produser / Marketing"
];
export const WH = [
  "H-7",
  "H-1",
  "H+1 s/d H+14",
  "Rilis Jumat minggu I",
  "Bulanan"
];
export const TK = [
  ["Riset topik", "Brief & daftar pertanyaan", "Konfirmasi tamu", "Release form ditandatangani"],
  ["Sound check", "Setting kamera & lighting", "Proses rekaman"],
  ["Editing", "Mixing & mastering", "Transkrip", "Pemotongan klip video"],
  ["Upload YouTube & website", "Klip di media sosial", "Newsletter", "Kit promosi tamu"],
  ["Analisis data pendengar", "Laporan & perbaikan"]
];
export const NT = 17; // Total checklist tasks (4 + 3 + 4 + 4 + 2)
export const KT = { v: 20, r: 50, i: 50, s: 15, l: 5 };
const STAGE_CHART_COLORS = ["#2563eb", "#7c3aed", "#0891b2", "#f59e0b", "#10b981"];
const QCC_CHART_COLORS = ["#2563eb", "#7c3aed", "#0891b2", "#f59e0b", "#10b981", "#ef4444", "#14b8a6"];
const FISHBONE_CATEGORIES = [
  ["people", "Manusia"],
  ["method", "Metode"],
  ["machine", "Mesin"],
  ["material", "Material"],
  ["measurement", "Pengukuran"],
  ["environment", "Lingkungan"]
];
const QCC_PPT_SLIDES = [
  "Sampul",
  "Ringkasan periode",
  "Sumber data",
  "Pareto checklist tertunda",
  "Progres per tahap produksi",
  "Kandidat tema",
  "Distribusi pipeline episode",
  "Jadwal rekaman dan rilis",
  "Performa pendengar",
  "Kesiapan tamu",
  "Fishbone sebab akibat",
  "Progres per episode",
  "Perbandingan dua rentang",
  "Target rilis episode",
  "Tindak lanjut",
  "Batasan data",
  "Penutup"
];
export const KL = {
  v: "Viewer / stream per minggu (1 episode)",
  r: "Retention: dengar hingga 80% durasi (%)",
  i: "Interaksi per klip",
  s: "Pertumbuhan subscriber / bulan (%)",
  l: "Calon klien / mitra per kuartal"
};
export const GS = ["Belum diundang", "Diundang", "Konfirmasi", "Release form OK", "Selesai rekam"];
export const ES = ["Belum", "Dipesan", "Diterima"];
export const TABS = [
  ["ringkasan", "Ringkasan"],
  ["episode", "Episode"],
  ["tamu", "Tamu"],
  ["peralatan", "Peralatan & Anggaran"],
  ["risiko", "Risiko"],
  ["report", "Report Episode"],
  ["rekap", "Rekap Kinerja"],
  ["qcc", "QCC"],
];

// Data Awal (Seed) Resmi Lourdes Auto Parts
export const seed = () => ({
  eps: [
    ["Cerita di Balik PT. Garuda Mart Indonesia", "Perwakilan Manajemen", "Brand Awareness & Trust"],
    ["Industri Auto Parts 2026: Tren, Tantangan, dan Peluang Masa Depan", "CEO / Founder", "Thought Leadership & Brand Authority"],
    ["Dari Masalah Menjadi Solusi: Cerita Nyata di Balik Kepuasan Pelanggan", "Marketing / Business Development / Pelanggan", "Customer Trust & Lead Generation"],
    ["Behind the Safety: Sehari Bersama Tim HSE dan Budaya Kerja Aman", "Departemen HSE", "Employer Branding & Safety Awareness"],
    ["Dari Ide Menjadi Inovasi: Proses R&D dan Production", "Departemen RnD", "Technical Credibility & Employer Branding"],
    ["After-Sales Excellence: Peran Tim Service", "Departemen Service", "Service Excellence & Customer Loyalty"]
  ].map((x, i) => ({ id: i + 1, title: x[0], guest: x[1], goal: x[2], rec: "", rel: "", d: {} })),
  guests: [
    "Perwakilan Manajemen",
    "CEO / Founder",
    "Marketing / Busdev",
    "Departemen HSE",
    "Departemen RnD",
    "Departemen Service"
  ].map((n, i) => ({ id: i + 1, name: n, ep: i + 1, st: 0 })),
  kpi: [],
  eq: [
    ["Kamera Mirrorless (3 unit)", "Sony A5000", 12000000],
    ["Tripod 3 unit", "INBEX IB-2R 170CM + remote Bluetooth", 600000],
    ["Processor (second)", "Intel Core i7 6800K LGA 2011-V3", 1200000],
    ["Power Supply", "Thermalright TR-SP1000 1000W 80+ Platinum", 1800000],
    ["VGA", "ASUS KO GeForce RTX 3060 Ti 8GB OC V2", 1600000],
    ["RAM", "Digital Alliance DDR4 16GB 3200MHz", 2100000]
  ].map((x, i) => ({ id: i + 1, name: x[0], spec: x[1], est: x[2], act: "", st: 0 })),
  risks: [
    ["Konsistensi produksi menurun", "Batch recording 3–4 episode sekaligus untuk membangun buffer konten"],
    ["Kualitas audio kurang baik", "Penanganan akustik ruangan dan pelatihan teknis singkat bagi operator"],
    ["Tamu batal hadir", "Daftar cadangan topik solo dan tamu internal"],
    ["Isu kerahasiaan / reputasi", "Release form tertulis dari tamu dan review konten sebelum rilis"],
    ["Engagement rendah", "Evaluasi KPI per kuartal dan penyesuaian topik berdasarkan data pendengar"],
    ["Man power", "Fokus untuk podcast (penunjukan tim produksi)"]
  ].map((x, i) => ({ id: i + 1, name: x[0], mit: x[1], ok: false, note: "" }))
});

// State Global Aplikasi
export let S = null;
const openDetails = new Set();
const requestedTab = location.hash.slice(1);
let currentTab = requestedTab === "kpi"
  ? "rekap"
  : (TABS.some(t => t[0] === requestedTab) ? requestedTab : "ringkasan");
const debounceTimers = {};

// Inisialisasi State Awal dari LocalStorage
try {
  S = JSON.parse(localStorage.getItem("minepod1"));
} catch (e) {}
if (!S || !S.eps) S = seed();
if (!S.rekap || typeof S.rekap !== "object") S.rekap = {};
if (!S.rekap.qcc || typeof S.rekap.qcc !== "object") S.rekap.qcc = {};
if (!S.rekap.fishbone || typeof S.rekap.fishbone !== "object") S.rekap.fishbone = {};
if (!S.qccMetrics || typeof S.qccMetrics !== "object") S.qccMetrics = {};
if (!S.qccPeriod || typeof S.qccPeriod !== "object") S.qccPeriod = {};
S.qccPeriod = { ...defaultQccPeriod(), ...S.qccPeriod };
if (typeof S.qccSelectedTheme !== "string") S.qccSelectedTheme = "";
if (!S.qccNotes || typeof S.qccNotes !== "object") {
  S.qccNotes = { pdca: S.rekap.qcc, fishbone: S.rekap.fishbone };
}
if (!S.qccNotes.pdca || typeof S.qccNotes.pdca !== "object") S.qccNotes.pdca = S.rekap.qcc;
if (!S.qccNotes.fishbone || typeof S.qccNotes.fishbone !== "object") S.qccNotes.fishbone = S.rekap.fishbone;
let selectedReportEpisodeId = Number(S.eps[0]?.id) || null;

export const saveLocal = () => {
  try {
    localStorage.setItem("minepod1", JSON.stringify(S));
  } catch (e) {}
};

// ==========================================================================
// FUNGSI HELPER FORMATTING & KALKULASI
// ==========================================================================

export const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;"
}[c]));

export const rp = n => "Rp " + (+n || 0).toLocaleString("id-ID");

export const cnt = e => Object.entries(e.d || {}).filter(([key, value]) => /^\d+-\d+$/.test(key) && Boolean(value)).length;

export const stg = e => {
  for (let s = 0; s < 5; s++) {
    if (TK[s].some((_, i) => !(e.d && e.d[`${s}-${i}`]))) return s;
  }
  return 5;
};

export const pct = e => Math.round((cnt(e) / NT) * 100);

export const dt = s => s ? new Date(s + "T00:00").toLocaleDateString("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric"
}) : "–";

export const bar = p => `<div class="bar"><i style="width:${p}%"></i></div>`;

function dateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function defaultQccPeriod() {
  const today = new Date();
  const currentStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const previousStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const previousEnd = new Date(today.getFullYear(), today.getMonth(), 0);
  return {
    from: dateInputValue(currentStart),
    to: dateInputValue(today),
    compareFrom: dateInputValue(previousStart),
    compareTo: dateInputValue(previousEnd)
  };
}

export const opts = (a, v) => a.map((x, i) => `<option value="${i}"${i == v ? " selected" : ""}>${esc(x)}</option>`).join("");

export const inp = (l, it, k, t = "text") => `<input type="${t}" data-l="${l}" data-id="${it.id}" data-k="${k}" value="${esc(it[k])}">`;

export const sel = (l, it, k, a) => `<select data-n="1" data-l="${l}" data-id="${it.id}" data-k="${k}">${opts(a, it[k])}</select>`;

export const del = (l, it) => `<button class="b g" data-a="del" data-l="${l}" data-id="${it.id}">Hapus</button>`;

export const lastK = () => [...(S.kpi || [])].sort((a, b) => a.m > b.m ? 1 : -1).pop();

function reportField(e, key, label, type = "number", suffix = "") {
  const value = e.d?.report?.[key] ?? "";
  const control = type === "textarea"
    ? `<textarea data-report-id="${e.id}" data-report-key="${key}" rows="3">${esc(value)}</textarea>`
    : `<input type="${type}" data-report-id="${e.id}" data-report-key="${key}" value="${esc(value)}"${type === "number" ? ` min="0"${key === "retention" || key === "subscriberGrowth" ? ' max="100"' : ""}` : ""}>`;
  return `<label class="report-field">${label}${suffix ? ` (${suffix})` : ""}${control}</label>`;
}

function vReport() {
  const episodes = S.eps || [];
  const episode = episodes.find(item => item.id === selectedReportEpisodeId) || episodes[0];
  if (!episode) {
    return `<h2>Rekap &amp; Report Episode</h2><div class="card sm">Belum ada episode untuk dibuatkan report.</div>`;
  }
  selectedReportEpisodeId = Number(episode.id);
  const report = episode.d?.report || {};
  const stageIndex = stg(episode);
  const completed = cnt(episode);
  const stages = TK.map((tasks, index) => {
    const done = tasks.filter((_, taskIndex) => Boolean(episode.d?.[`${index}-${taskIndex}`])).length;
    const progress = Math.round(done / tasks.length * 100);
    const status = done === tasks.length ? "Selesai" : index === stageIndex ? "Berjalan" : "Menunggu";
    const milestone = index === 1
      ? { label: "Rekaman", date: episode.rec }
      : index === 3
        ? { label: "Rilis", date: episode.rel }
        : null;
    return { index, done, progress, status, milestone };
  });
  const metrics = [
    ["views", "Views / stream"],
    ["retention", "Retention", "number", "%"],
    ["interactions", "Interaksi"],
    ["subscriberGrowth", "Pertumbuhan subscriber", "number", "%"],
    ["leads", "Calon klien / mitra"]
  ];
  const checklist = TK.map((tasks, index) => `
    <section class="report-section report-stage">
      <h3>${esc(ST[index])}</h3>
      <ul>${tasks.map((task, taskIndex) => {
        const checked = Boolean(episode.d?.[`${index}-${taskIndex}`]);
        return `<li>${checked ? "☑" : "☐"} ${esc(task)}</li>`;
      }).join("")}</ul>
    </section>
  `).join("");
  const remaining = Math.max(NT - completed, 0);
  const stageChart = stages.map((stage, index) => `
    <div class="report-bar-item">
      <span class="report-bar-value">${stage.progress}%</span>
      <div class="report-bar-plot">
        <span class="report-bar-fill" style="height:${stage.progress}%;background:${STAGE_CHART_COLORS[index]}"></span>
      </div>
      <b>${esc(ST[index].replace("-", " "))}</b>
      <small>${stage.done}/${TK[index].length} tugas</small>
    </div>
  `).join("");

  return `
    <article class="episode-report-page">
      <div class="report-actions">
        <label class="report-episode-picker">Pilih episode
          <select data-report-episode>
            ${episodes.map(item => `<option value="${item.id}"${Number(item.id) === selectedReportEpisodeId ? " selected" : ""}>${esc(item.title || "Episode tanpa judul")}</option>`).join("")}
          </select>
        </label>
        <button class="b" data-a="print-report">🖨 Cetak / Simpan PDF</button>
      </div>
      <div class="report-heading">
        <div class="sm">MinePod by Lourdes · Rekap &amp; Report Episode</div>
        <h1>${esc(episode.title || "Episode tanpa judul")}</h1>
        <div class="sm">Dicetak ${esc(new Date().toLocaleDateString("id-ID"))}</div>
      </div>
      <div class="report-summary">
        <div class="item"><b>Tamu</b><br>${esc(episode.guest || "Belum ditentukan")}</div>
        <div class="item"><b>Tujuan</b><br>${esc(episode.goal || "Belum diisi")}</div>
        <div class="item"><b>Tanggal rekaman</b><br>${dt(episode.rec)}</div>
        <div class="item"><b>Tanggal rilis</b><br>${dt(episode.rel)}</div>
      </div>
      <section class="report-section">
        <h2>Rekap Progres Produksi · ${ST[stageIndex]} · ${pct(episode)}%</h2>
        <div>${completed}/${NT} checklist selesai</div>
        <div class="report-progress"><span style="width:${pct(episode)}%"></span></div>
      </section>
      <section class="report-section report-visual">
        <h2>Diagram Progres Produksi</h2>
        <div class="report-charts">
          <div class="report-bar-chart-wrap">
            <h3>Diagram Batang per Tahap</h3>
            <div class="report-bar-chart" role="img" aria-label="Diagram batang persentase penyelesaian setiap tahap produksi">
              ${stageChart}
            </div>
          </div>
          <div class="report-donut-wrap">
            <h3>Diagram Donat Keseluruhan</h3>
            <div
              class="report-donut"
              role="img"
              aria-label="${completed} dari ${NT} tugas selesai"
              style="--donut-progress:${pct(episode)}%"
            >
              <div class="report-donut-center">
                <strong>${pct(episode)}%</strong>
                <span>${completed}/${NT} tugas</span>
              </div>
            </div>
            <div class="report-donut-legend">
              <span><i class="legend-complete"></i>Selesai <b>${completed}</b></span>
              <span><i class="legend-remaining"></i>Belum selesai <b>${remaining}</b></span>
            </div>
          </div>
        </div>
      </section>
      <section class="report-section report-visual">
        <h2>Timeline Produksi</h2>
        <div class="report-timeline">
          ${stages.map((stage, index) => `
            <div class="timeline-step ${stage.status === "Selesai" ? "complete" : stage.status === "Berjalan" ? "current" : ""}">
              <span class="timeline-marker" aria-hidden="true">${stage.status === "Selesai" ? "✓" : index + 1}</span>
              <b>${esc(ST[index])}</b>
              <span class="sm">${stage.status} · ${stage.done}/${TK[index].length} tugas</span>
              ${stage.milestone ? `<span class="sm">${stage.milestone.label}: ${stage.milestone.date ? dt(stage.milestone.date) : "Belum dijadwalkan"}</span>` : ""}
            </div>
          `).join("")}
        </div>
      </section>
      <h2 class="report-title">Metrik Pascarilis</h2>
      <div class="report-metrics">
        ${metrics.map(([key, label, type, suffix]) => `
          <div class="metric report-metric">
            ${reportField(episode, key, label, type || "number", suffix || "")}
            <div class="report-metric-value">${report[key] === "" || report[key] == null ? "Belum diisi" : `${esc(report[key])}${suffix || ""}`}</div>
          </div>
        `).join("")}
      </div>
      <div class="report-notes-grid">
        <div class="report-note-card">
          ${reportField(episode, "summary", "Ringkasan hasil", "textarea")}
          <div class="report-note-value" data-report-note-value="summary">${esc(report.summary || "Belum ada ringkasan.")}</div>
        </div>
        <div class="report-note-card">
          ${reportField(episode, "followUp", "Tindak lanjut", "textarea")}
          <div class="report-note-value" data-report-note-value="followUp">${esc(report.followUp || "Belum ada tindak lanjut.")}</div>
        </div>
      </div>
      <h2 class="report-title">Checklist Produksi</h2>
      <div class="report-stages">${checklist}</div>
    </article>
  `;
}

// ==========================================================================
// TOAST NOTIFICATIONS
// ==========================================================================

export function showToast(message, type = 'info', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => toast.remove(), 250);
  }, duration);
}

// ==========================================================================
// VIEWS / KOMPONEN TAMPILAN
// ==========================================================================

function vHome() {
  const eps = S.eps || [];
  const dn = eps.filter(e => stg(e) === 5).length;
  const rc = (S.eq || []).filter(x => x.st === 2).length;
  const est = (S.eq || []).reduce((a, x) => a + (Number(x.est) || 0), 0);
  const act = (S.eq || []).reduce((a, x) => a + (Number(x.act) || 0), 0);
  const gc = (S.guests || []).filter(g => g.st >= 2).length;
  const rk = (S.risks || []).filter(r => r.ok).length;
  const k = lastK();
  const kp = k ? Object.keys(KT).filter(x => +k[x] >= KT[x]).length : null;

  const today = new Date().toISOString().slice(0, 10);
  const dl = [];
  eps.forEach(e => {
    if (e.rec && e.rec >= today) dl.push([e.rec, "Rekaman", e]);
    if (e.rel && e.rel >= today) dl.push([e.rel, "Rilis", e]);
  });
  dl.sort();

  return `
    <div class="grid">
      <div class="card">
        <div class="sm">Episode Selesai</div>
        <div class="big">${dn}/${eps.length}</div>
        ${bar(eps.length ? (dn / eps.length) * 100 : 0)}
      </div>
      <div class="card">
        <div class="sm">Peralatan Diterima</div>
        <div class="big">${rc}/${(S.eq || []).length}</div>
        ${bar((S.eq || []).length ? (rc / (S.eq || []).length) * 100 : 0)}
      </div>
      <div class="card">
        <div class="sm">Anggaran Estimasi / Realisasi</div>
        <div class="big" style="font-size:18px">${rp(est)}</div>
        <div class="sm">Realisasi: ${rp(act)}</div>
      </div>
      <div class="card">
        <div class="sm">Tamu Terkonfirmasi</div>
        <div class="big">${gc}/${(S.guests || []).length}</div>
      </div>
      <div class="card">
        <div class="sm">Risiko Termitigasi</div>
        <div class="big">${rk}/${(S.risks || []).length}</div>
      </div>
      <div class="card">
        <div class="sm">KPI Tercapai (${k ? esc(k.m) : "belum ada data"})</div>
        <div class="big">${kp == null ? "–" : kp + "/5"}</div>
      </div>
    </div>

    <div class="card">
      <h3>Progres Pipeline Episode</h3>
      ${eps.map((e, i) => `
        <div style="margin:12px 0">
          <div style="display:flex;justify-content:space-between;gap:8px;align-items:center">
            <span><b>Ep ${String(i + 1).padStart(2, "0")}</b> ${esc(e.title)}</span>
            <span class="tag">${ST[stg(e)]}</span>
          </div>
          ${bar(pct(e))}
        </div>
      `).join("") || "<p class='sm'>Belum ada episode.</p>"}
    </div>

    <div class="card">
      <h3>Jadwal Mendatang</h3>
      ${dl.length ? dl.slice(0, 6).map(x => `
        <div style="padding:6px 0; border-bottom:1px solid var(--line); display:flex; justify-content:space-between; flex-wrap:wrap;">
          <span>${dt(x[0])} · <b>${x[1]}</b> · ${esc(x[2].title)}</span>
          <span class="sm">${esc(x[2].guest || "Tamu belum ditentukan")}</span>
        </div>
      `).join("") : "<p class='sm'>Belum ada jadwal rekaman atau rilis yang diatur. Silakan atur tanggal di tab <b>Episode</b>.</p>"}
    </div>

    <div class="card sm" style="border-left: 4px solid var(--blue);">
      <b>Ritme Kerja Produksi:</b> Rekaman minggu ke-2, rilis setiap Jumat pagi minggu pertama bulan berikutnya.
      Target: 1 episode per bulan, durasi 20–40 menit. Platform distribusi utama: YouTube & Website PT. Garuda Mart Indonesia / Lourdes Auto Parts.
    </div>
  `;
}

function vEps() {
  const eps = S.eps || [];
  return `
    <h2>
      <span>Pipeline Produksi Episode (${eps.length})</span>
      <button class="b" data-a="add" data-l="eps">+ Episode Baru</button>
    </h2>
    ${eps.map((e, i) => {
      const s = stg(e);
      const isExpanded = openDetails.has(e.id);
      return `
        <details class="card" data-o="${e.id}" ${isExpanded ? "open" : ""}>
          <summary>
            <b>Ep ${String(i + 1).padStart(2, "0")}</b>
            <span>
              <strong>${esc(e.title)}</strong><br>
              <span class="sm">${esc(e.guest || "Tamu: –")} · Rekam: ${dt(e.rec)} · Rilis: ${dt(e.rel)}</span>
            </span>
            <span>
              <span class="tag">${ST[s]}</span>
              <span style="font-weight:700;margin-left:6px">${pct(e)}%</span>
            </span>
          </summary>

          <div class="f" style="margin-top:14px">
            <label>Judul / Topik ${inp("eps", e, "title")}</label>
            <label>Tamu ${inp("eps", e, "guest")}</label>
            <label>Tujuan Utama ${inp("eps", e, "goal")}</label>
            <label>Tanggal Rekaman ${inp("eps", e, "rec", "date")}</label>
            <label>Tanggal Rilis ${inp("eps", e, "rel", "date")}</label>
          </div>

          <div class="st">
            ${TK.map((t, si) => `
              <div class="${si === s ? "cur" : ""}">
                <b>${ST[si]}</b>
                <div class="sm" style="margin-bottom:6px">${WH[si]} · PIC: ${PIC[si]}</div>
                ${t.map((x, ti) => {
                  const key = `${si}-${ti}`;
                  const isChecked = Boolean(e.d && e.d[key]);
                  return `
                    <label>
                      <input type="checkbox" data-l="eps" data-id="${e.id}" data-t="${key}" ${isChecked ? "checked" : ""}>
                      ${esc(x)}
                    </label>
                  `;
                }).join("")}
              </div>
            `).join("")}
          </div>

          <div style="margin-top:14px; display:flex; justify-content:flex-end;">
            ${del("eps", e)}
          </div>
        </details>
      `;
    }).join("")}
  `;
}

function vGuests() {
  const guests = S.guests || [];
  return `
    <h2>
      <span>Manajemen Tamu Podcast (${guests.length})</span>
      <button class="b" data-a="add" data-l="guests">+ Tamu Baru</button>
    </h2>
    <div class="card sc">
      <table>
        <thead>
          <tr>
            <th>Nama / Jabatan / Divisi</th>
            <th style="width:110px">Episode</th>
            <th>Status Konfirmasi</th>
            <th style="width:90px"></th>
          </tr>
        </thead>
        <tbody>
          ${guests.map(g => `
            <tr>
              <td>${inp("guests", g, "name")}</td>
              <td>${inp("guests", g, "ep", "number")}</td>
              <td>${sel("guests", g, "st", GS)}</td>
              <td>${del("guests", g)}</td>
            </tr>
          `).join("") || `<tr><td colspan="4" class="sm">Belum ada tamu terdaftar.</td></tr>`}
        </tbody>
      </table>
    </div>
    <p class="sm">
      💡 <b>SOP Tamu:</b> Pastikan release form tertulis telah ditandatangani sebelum hari rekaman. 
      Siapkan daftar cadangan topik solo dan narasumber internal jika tamu mendadak berhalangan hadir.
    </p>
  `;
}

function vKpi() {
  const k = lastK();
  const kpiList = S.kpi || [];
  return `
    <section id="recap-kpi" class="card recap-section">
      <div class="recap-section-heading">
        <div>
          <h3>KPI · Key Performance Indicator</h3>
          <p class="sm">${k ? `Laporan terbaru: ${esc(k.m)}` : "Belum ada laporan KPI bulanan."}</p>
        </div>
      </div>
      <div class="recap-kpi-targets">
        ${Object.keys(KT).map(x => `
          <div class="recap-kpi-target">
            <span class="sm">${KL[x]}</span>
            <b>≥${KT[x]}</b>
            ${k ? `<span class="tag ${+k[x] >= KT[x] ? "ok" : "no"}">${k.m}: ${k[x] === "" ? "–" : k[x]}</span>` : ""}
          </div>
        `).join("")}
      </div>

      <div class="recap-kpi-entry">
        <h3>Input Laporan Metrik Bulanan</h3>
      <div class="f">
        <label>Bulan Evaluasi <input type="month" id="km"></label>
        ${Object.keys(KT).map(x => `<label>${KL[x]} <input type="number" min="0" id="k_${x}" placeholder="Nilai"></label>`).join("")}
      </div>
      <button class="b" data-a="add" data-l="kpi">Simpan Laporan Bulanan</button>
      <p class="sm" style="margin-top:8px">Sumber data: YouTube Studio, Spotify for Podcasters, Instagram / LinkedIn Insights, dan CRM / Sales Team.</p>
      </div>

      <div class="recap-kpi-history sc">
      <h3>Riwayat Evaluasi Bulanan</h3>
      <table>
        <thead>
          <tr>
            <th>Bulan</th>
            ${Object.keys(KT).map(x => `<th>${KL[x].split(" (")[0].split(":")[0]}</th>`).join("")}
            <th style="width:90px"></th>
          </tr>
        </thead>
        <tbody>
          ${[...kpiList].sort((a, b) => a.m < b.m ? 1 : -1).map(r => `
            <tr>
              <td><b>${esc(r.m)}</b></td>
              ${Object.keys(KT).map(x => `
                <td class="${r[x] === "" ? "" : +r[x] >= KT[x] ? "ok" : "no"}">
                  ${r[x] === "" ? "–" : r[x]}
                </td>
              `).join("")}
              <td>${del("kpi", r)}</td>
            </tr>
          `).join("") || `<tr><td colspan="7" class="sm">Belum ada riwayat data bulanan. Masukkan data di atas.</td></tr>`}
        </tbody>
      </table>
      </div>
    </section>
  `;
}

function vRecap() {
  const episodes = S.eps || [];
  const guests = S.guests || [];
  const stageWork = TK.map((tasks, index) => {
    const total = tasks.length * episodes.length;
    const completed = episodes.reduce((count, episode) => {
      return count + tasks.filter((_, taskIndex) => Boolean(episode.d?.[`${index}-${taskIndex}`])).length;
    }, 0);
    return { index, total, completed, remaining: total - completed };
  });
  const totalTasks = stageWork.reduce((sum, stage) => sum + stage.total, 0);
  const completedTasks = stageWork.reduce((sum, stage) => sum + stage.completed, 0);
  const completionRate = totalTasks ? Math.round(completedTasks / totalTasks * 100) : 0;
  const completedEpisodes = episodes.filter(episode => stg(episode) === 5).length;
  const confirmedGuests = guests.filter(guest => guest.st >= 2).length;
  const stageChart = stageWork.map(stage => {
    const progress = stage.total ? Math.round(stage.completed / stage.total * 100) : 0;
    return `
      <div class="report-bar-item">
        <span class="report-bar-value">${progress}%</span>
        <div class="report-bar-plot">
          <span class="report-bar-fill" style="height:${progress}%;background:${STAGE_CHART_COLORS[stage.index]}"></span>
        </div>
        <b>${esc(ST[stage.index])}</b>
        <small>${stage.completed}/${stage.total} tugas</small>
      </div>
    `;
  }).join("");

  return `
    <h2>Rekap Kinerja</h2>
    <p class="sm">Ringkasan SLA, beban kerja, metrik produksi, dan KPI berdasarkan data aplikasi.</p>

    <div class="grid">
      <div class="card">
        <div class="sm">Episode Selesai</div>
        <div class="big">${completedEpisodes}/${episodes.length}</div>
        ${bar(episodes.length ? completedEpisodes / episodes.length * 100 : 0)}
      </div>
      <div class="card">
        <div class="sm">Progres Checklist</div>
        <div class="big">${completionRate}%</div>
        <div class="sm">${completedTasks}/${totalTasks} tugas selesai</div>
      </div>
      <div class="card">
        <div class="sm">Beban Tugas Tersisa</div>
        <div class="big">${totalTasks - completedTasks}</div>
        <div class="sm">dari ${totalTasks} tugas pada ${episodes.length} episode</div>
      </div>
      <div class="card">
        <div class="sm">Tamu Terkonfirmasi</div>
        <div class="big">${confirmedGuests}/${guests.length}</div>
      </div>
    </div>

    <section class="card recap-section">
      <h3>SLA · Service Level Agreements</h3>
      <div class="recap-placeholder">
        <b>SLA belum dikonfigurasi</b>
        <p>Belum ada target layanan dan tanggal aktual penyelesaian yang tercatat, sehingga pencapaian SLA belum dapat dihitung.</p>
        <button class="b g" data-a="tab" data-t="episode">Buka Jadwal &amp; Checklist Episode</button>
      </div>
    </section>

    <section class="card recap-section">
      <h3>WLA · Workload Analysis</h3>
      <p class="sm">Beban dihitung dari jumlah tugas checklist per tahap dan PIC, bukan estimasi jam kerja.</p>
      <div class="sc">
        <table>
          <thead>
            <tr>
              <th>Tahap</th>
              <th>PIC</th>
              <th>Total Tugas</th>
              <th>Selesai</th>
              <th>Tersisa</th>
              <th>Progres</th>
            </tr>
          </thead>
          <tbody>
            ${episodes.length ? stageWork.map(stage => {
              const progress = stage.total ? Math.round(stage.completed / stage.total * 100) : 0;
              return `
                <tr>
                  <td>${esc(ST[stage.index])}</td>
                  <td>${esc(PIC[stage.index] || "Belum ditentukan")}</td>
                  <td>${stage.total}</td>
                  <td>${stage.completed}</td>
                  <td>${stage.remaining}</td>
                  <td>${progress}%${bar(progress)}</td>
                </tr>
              `;
            }).join("") : `<tr><td colspan="6" class="sm">Belum ada data episode untuk dianalisis.</td></tr>`}
          </tbody>
        </table>
      </div>
    </section>

    <section class="card recap-section">
      <h3>Visualisasi Beban &amp; Progres</h3>
      <div class="report-charts">
        <div class="report-bar-chart-wrap">
          <h3>Diagram Batang per Tahap</h3>
          <div class="report-bar-chart" role="img" aria-label="Diagram batang progres checklist per tahap produksi">
            ${stageChart}
          </div>
        </div>
        <div class="report-donut-wrap">
          <h3>Diagram Donat Keseluruhan</h3>
          <div
            class="report-donut recap-donut${totalTasks ? "" : " is-empty"}"
            role="img"
            aria-label="${totalTasks ? `${completedTasks} dari ${totalTasks} tugas selesai` : "Belum ada data tugas"}"
            style="--donut-progress:${completionRate}%"
          >
            <div class="report-donut-center">
              <strong>${totalTasks ? `${completionRate}%` : "–"}</strong>
              <span>${completedTasks}/${totalTasks} tugas</span>
            </div>
          </div>
          <div class="report-donut-legend">
            <span><i class="legend-complete"></i>Selesai <b>${completedTasks}</b></span>
            <span><i class="legend-remaining"></i>Belum selesai <b>${totalTasks - completedTasks}</b></span>
          </div>
        </div>
      </div>
    </section>

    <section class="card recap-section">
      <h3>Metrik Kerja Produksi</h3>
      <div class="recap-metrics">
        <div><span class="sm">Rata-rata progres checklist</span><b>${completionRate}%</b></div>
        <div><span class="sm">Tugas selesai</span><b>${completedTasks}</b></div>
        <div><span class="sm">Tugas tersisa</span><b>${totalTasks - completedTasks}</b></div>
        <div><span class="sm">Episode selesai</span><b>${completedEpisodes}</b></div>
      </div>
    </section>

    ${vKpi()}
  `;
}

function qccNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function qccAnalyzeEpisodes(episodes) {
  const stageWork = TK.map((tasks, index) => {
    const total = tasks.length * episodes.length;
    const completed = episodes.reduce((sum, episode) =>
      sum + tasks.filter((_, taskIndex) => Boolean(episode.d?.[`${index}-${taskIndex}`])).length, 0);
    return { index, total, completed, remaining: total - completed };
  });
  const totalTasks = stageWork.reduce((sum, stage) => sum + stage.total, 0);
  const completedTasks = stageWork.reduce((sum, stage) => sum + stage.completed, 0);
  const completedEpisodes = episodes.filter(episode => stg(episode) === 5).length;
  const publishedEpisodes = episodes.filter(episode => Boolean(episode.d?.['3-0'])).length;
  const reports = episodes.map(episode => episode.d?.report || {});
  const viewValues = reports.map(report => qccNumber(report.views)).filter(value => value !== null);
  const retentionValues = reports.map(report => qccNumber(report.retention)).filter(value => value !== null);
  const today = dateInputValue(new Date());

  return {
    total: episodes.length,
    stageWork,
    totalTasks,
    completedTasks,
    remainingTasks: Math.max(totalTasks - completedTasks, 0),
    averageProgress: totalTasks ? completedTasks / totalTasks * 100 : null,
    completedEpisodes,
    publishedEpisodes,
    overdueReleases: episodes.filter(episode => episode.rel && episode.rel < today && !episode.d?.['3-0']).length,
    missingSchedule: episodes.filter(episode => !episode.rec && !episode.rel).length,
    missingRecordingDate: episodes.filter(episode => !episode.rec).length,
    missingReleaseDate: episodes.filter(episode => !episode.rel).length,
    missingTitle: episodes.filter(episode => !String(episode.title || '').trim()).length,
    missingGuest: episodes.filter(episode => !String(episode.guest || '').trim()).length,
    missingGoal: episodes.filter(episode => !String(episode.goal || '').trim()).length,
    incompleteGuestPreparation: episodes.filter(episode => !episode.d?.['0-2'] || !episode.d?.['0-3']).length,
    averageViews: viewValues.length ? viewValues.reduce((sum, value) => sum + value, 0) / viewValues.length : null,
    averageRetention: retentionValues.length ? retentionValues.reduce((sum, value) => sum + value, 0) / retentionValues.length : null,
    reportedEpisodes: reports.filter(report => Object.values(report).some(value => value !== '' && value != null)).length,
    stageCounts: ST.map((_, index) => episodes.filter(episode => stg(episode) === index).length)
  };
}

function qccEpisodeDates(episode) {
  return [episode.rec, episode.rel].filter(date => /^\d{4}-\d{2}-\d{2}$/.test(String(date || '')));
}

function qccEpisodesInRange(episodes, from, to) {
  return episodes.filter(episode => qccEpisodeDates(episode).some(date => date >= from && date <= to));
}

function qccRate(value) {
  return Number.isFinite(value) ? `${value.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%` : '-';
}

function qccSupportMetrics(metrics, stats) {
  const releaseTarget = qccNumber(metrics.releaseTarget);
  return {
    metrics,
    releaseTarget,
    releaseTargetRate: releaseTarget > 0 ? stats.publishedEpisodes / releaseTarget * 100 : null
  };
}

function qccPeriodLabel(from, to) {
  return `${dt(from)} to ${dt(to)}`;
}

function qccParetoRows(episodes) {
  return TK.map((tasks, index) => {
    const remaining = episodes.reduce((sum, episode) =>
      sum + tasks.filter((_, taskIndex) => !episode.d?.[`${index}-${taskIndex}`]).length, 0);
    return { index, label: ST[index], value: remaining };
  }).filter(row => row.value > 0).sort((a, b) => b.value - a.value);
}

function qccTextarea(group, key, label, value = '', rows = 3, className = 'recap-field') {
  return `<label class="${className}">${label}<textarea data-qcc-group="${group}" data-qcc-key="${key}" rows="${rows}">${esc(value)}</textarea></label>`;
}

function qccMetricInput(key, label, value = '', type = 'number') {
  return `<label>${label}<input type="${type}" data-qcc-group="metrics" data-qcc-key="${key}" value="${esc(value)}"${type === 'number' ? ' min="0" step="1"' : ''}></label>`;
}

function getQccAnalysis() {
  const period = { ...defaultQccPeriod(), ...S.qccPeriod };
  const episodes = S.eps || [];
  const scheduledEpisodes = episodes.filter(episode => qccEpisodeDates(episode).length);
  const baseline = episodes.length > 0 && scheduledEpisodes.length === 0;
  const currentEpisodes = baseline ? episodes : qccEpisodesInRange(episodes, period.from, period.to);
  const compareEpisodes = qccEpisodesInRange(episodes, period.compareFrom, period.compareTo);
  const current = qccAnalyzeEpisodes(currentEpisodes);
  const compare = qccAnalyzeEpisodes(compareEpisodes);
  const currentMetricKey = `${period.from}|${period.to}`;
  const compareMetricKey = `${period.compareFrom}|${period.compareTo}`;
  const support = qccSupportMetrics(S.qccMetrics[currentMetricKey] || {}, current);
  const compareSupport = qccSupportMetrics(S.qccMetrics[compareMetricKey] || {}, compare);
  const pareto = qccParetoRows(currentEpisodes);
  const equipmentPending = (S.eq || []).filter(item => item.st !== 2).length;
  const openRisks = (S.risks || []).filter(item => !item.ok).length;

  return {
    period,
    episodes,
    scheduledEpisodes,
    currentEpisodes,
    baseline,
    current,
    compare,
    ...support,
    compareSupport,
    pareto,
    equipmentPending,
    openRisks
  };
}

function qccCandidateThemes(data) {
  const candidates = [];
  if (data.current.remainingTasks > 0) {
    const topStage = data.current.stageWork.reduce((top, stage) => stage.remaining > top.remaining ? stage : top, data.current.stageWork[0] || { index: 0, remaining: 0 });
    candidates.push({
      id: 'checklist-backlog',
      title: `Mengurangi checklist tertunda pada tahap ${ST[topStage.index]}`,
      evidence: `${topStage.remaining} dari ${data.current.remainingTasks} tugas tertunda`
    });
  }
  if (data.current.missingSchedule > 0) {
    candidates.push({
      id: 'episode-schedule',
      title: 'Melengkapi jadwal rekaman dan rilis episode',
      evidence: `${data.current.missingSchedule} episode belum memiliki tanggal rekaman dan rilis`
    });
  }
  if (data.current.overdueReleases > 0) {
    candidates.push({
      id: 'release-timeliness',
      title: 'Meningkatkan ketepatan jadwal rilis podcast',
      evidence: `${data.current.overdueReleases} episode melewati tanggal rilis dan belum diunggah`
    });
  }
  if (data.current.incompleteGuestPreparation > 0) {
    candidates.push({
      id: 'guest-preparation',
      title: 'Memperkuat kesiapan narasumber sebelum rekaman',
      evidence: `${data.current.incompleteGuestPreparation} episode belum menuntaskan konfirmasi tamu dan release form`
    });
  }
  if (data.current.averageRetention !== null && data.current.averageRetention < 80) {
    candidates.push({
      id: 'listener-retention',
      title: 'Meningkatkan retensi pendengar episode',
      evidence: `Rata-rata retensi ${data.current.averageRetention.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%`
    });
  }
  return candidates;
}

function qccFishboneEvidence(stats, data) {
  const topStage = stats.stageWork.reduce((top, stage) => stage.remaining > top.remaining ? stage : top, stats.stageWork[0] || { index: 0, remaining: 0 });
  return {
    people: `${stats.incompleteGuestPreparation} episode belum menuntaskan konfirmasi tamu dan release form`,
    method: `${stats.remainingTasks} checklist tertunda${stats.remainingTasks ? ` - terbanyak di ${ST[topStage.index]}` : ''}`,
    machine: `${data.equipmentPending} peralatan belum berstatus diterima`,
    material: `${stats.missingTitle} judul/topik - ${stats.missingGoal} tujuan episode belum diisi`,
    measurement: `${stats.missingRecordingDate} tanggal rekaman - ${stats.missingReleaseDate} tanggal rilis belum dicatat`,
    environment: `${data.openRisks} risiko produksi belum dimitigasi`
  };
}

function vQcc() {
  const data = getQccAnalysis();
  const { period, current, compare, currentEpisodes, baseline, metrics, compareSupport, releaseTargetRate, pareto } = data;
  const themes = qccCandidateThemes(data);
  const evidence = qccFishboneEvidence(current, data);
  const fishboneNotes = S.qccNotes.fishbone || {};
  const pdca = S.qccNotes.pdca || {};
  const audienceNotes = metrics.audienceNotes || '';
  const label = baseline ? 'Baseline semua episode - jadwal belum diatur' : qccPeriodLabel(period.from, period.to);
  const paretoTotal = pareto.reduce((sum, item) => sum + item.value, 0);
  let cumulativePareto = 0;
  const paretoChart = pareto.map((item, index) => {
    cumulativePareto += item.value;
    const share = paretoTotal ? cumulativePareto / paretoTotal * 100 : 0;
    const width = paretoTotal ? item.value / paretoTotal * 100 : 0;
    return `
      <div class="qcc-pareto-row">
        <span>${esc(item.label)}</span>
        <div class="qcc-pareto-track"><i style="width:${width}%;background:${QCC_CHART_COLORS[index % QCC_CHART_COLORS.length]}"></i></div>
        <b>${item.value} tugas</b>
        <small>${share.toLocaleString('id-ID', { maximumFractionDigits: 1 })}% kumulatif</small>
      </div>
    `;
  }).join('');
  const stageChart = current.stageWork.map((stage, index) => {
    const progress = stage.total ? stage.completed / stage.total * 100 : 0;
    return `
      <div class="report-bar-item">
        <span class="report-bar-value">${Math.round(progress)}%</span>
        <div class="report-bar-plot"><span class="report-bar-fill" style="height:${progress}%;background:${QCC_CHART_COLORS[index % QCC_CHART_COLORS.length]}"></span></div>
        <b>${esc(ST[index])}</b>
        <small>${stage.completed}/${stage.total} tugas</small>
      </div>
    `;
  }).join('');
  const themesHtml = themes.map(theme => `
    <div class="qcc-theme ${S.qccSelectedTheme === theme.id ? 'selected' : ''}">
      <div><b>${esc(theme.title)}</b><p class="sm">${esc(theme.evidence)} - Pipeline podcast</p></div>
      <button class="b ${S.qccSelectedTheme === theme.id ? '' : 'g'}" data-a="select-qcc-theme" data-theme-id="${theme.id}">
        ${S.qccSelectedTheme === theme.id ? 'Tema dipilih' : 'Pilih tema'}
      </button>
    </div>
  `).join('');
  const compareRows = [
    ['Episode dalam periode', current.total, compare.total],
    ['Rata-rata progres produksi', qccRate(current.averageProgress), qccRate(compare.averageProgress)],
    ['Checklist selesai', `${current.completedTasks}/${current.totalTasks}`, `${compare.completedTasks}/${compare.totalTasks}`],
    ['Episode selesai', current.completedEpisodes, compare.completedEpisodes],
    ['Episode sudah diunggah', current.publishedEpisodes, compare.publishedEpisodes],
    ['Checklist tertunda', current.remainingTasks, compare.remainingTasks],
    ['Rata-rata views / stream', current.averageViews === null ? '-' : Math.round(current.averageViews).toLocaleString('id-ID'), compare.averageViews === null ? '-' : Math.round(compare.averageViews).toLocaleString('id-ID')],
    ['Rata-rata retensi pendengar', qccRate(current.averageRetention), qccRate(compare.averageRetention)]
  ];
  const episodeRows = currentEpisodes.map(episode => `
    <tr>
      <td><b>${esc(episode.title || 'Episode tanpa judul')}</b><br><span class="sm">${esc(episode.guest || 'Tamu belum ditentukan')}</span></td>
      <td>${esc(ST[stg(episode)])}</td>
      <td>${dt(episode.rec)}</td>
      <td>${dt(episode.rel)}</td>
      <td>${pct(episode)}%</td>
      <td>${Math.max(NT - cnt(episode), 0)}</td>
    </tr>
  `).join('');
  const releaseGoal = releaseTargetRate === null ? 'Target rilis belum diisi' : `${qccRate(releaseTargetRate)} dari target rilis`;

  return `
    <article class="qcc-page">
      <h2><span>QCC - Quality Control Circle Podcast</span><button class="b" data-a="export-qcc-ppt">Unduh Laporan QCC - 17 Slide</button></h2>
      <p class="sm">Analisa perbaikan mutu dari pipeline episode, checklist produksi, jadwal, dan metrik pendengar.</p>
      <p class="sm">QCC membaca data episode aplikasi. Catatan Fishbone, target, dan PDCA tersimpan lokal di browser ini.</p>

      <section class="card qcc-section">
        <h3>Periode Analisa Episode</h3>
        <div class="f qcc-period-fields">
          <label>Dari <input type="date" id="qcc-from" value="${esc(period.from)}"></label>
          <label>Sampai <input type="date" id="qcc-to" value="${esc(period.to)}"></label>
          <label>Pembanding dari <input type="date" id="qcc-compare-from" value="${esc(period.compareFrom)}"></label>
          <label>Sampai <input type="date" id="qcc-compare-to" value="${esc(period.compareTo)}"></label>
        </div>
        <button class="b" data-a="analyze-qcc">Analisa Periode</button>
        <p class="sm qcc-period-label">Periode ${qccPeriodLabel(period.from, period.to)} - Pembanding ${qccPeriodLabel(period.compareFrom, period.compareTo)}</p>
        ${baseline ? '<p class="qcc-empty">Belum ada tanggal rekaman/rilis. Untuk baseline, semua episode ditampilkan; isi jadwal di menu Episode agar analisa periode aktif.</p>' : ''}
      </section>

      <section class="card qcc-section">
        <div class="qcc-section-heading"><div><h3>Ringkasan Produksi</h3><p class="sm">${esc(label)}</p></div><span class="tag">${current.total} episode</span></div>
        <div class="qcc-summary-grid">
          <div class="qcc-summary-card"><span>Episode dianalisis</span><b>${current.total}</b><small>${data.scheduledEpisodes.length} episode sudah memiliki jadwal</small></div>
          <div class="qcc-summary-card"><span>Rata-rata progres produksi</span><b>${qccRate(current.averageProgress)}</b><small>${current.completedTasks}/${current.totalTasks} checklist selesai</small></div>
          <div class="qcc-summary-card"><span>Episode selesai</span><b>${current.completedEpisodes}</b><small>${current.publishedEpisodes} sudah ditandai diunggah</small></div>
          <div class="qcc-summary-card"><span>Checklist tertunda</span><b>${current.remainingTasks}</b><small>${current.overdueReleases} jadwal rilis terlewati</small></div>
        </div>
      </section>

      <section class="card qcc-section">
        <div class="qcc-section-heading"><div><h3>Bandingkan Periode</h3><p class="sm">Episode masuk bila tanggal rekaman atau rilis berada dalam rentang.</p></div></div>
        <div class="sc"><table>
          <thead><tr><th>Metrik Podcast</th><th>${esc(label)}</th><th>${esc(qccPeriodLabel(period.compareFrom, period.compareTo))}</th></tr></thead>
          <tbody>${compareRows.map(([name, value, compareValue]) => `<tr><td>${esc(name)}</td><td>${value}</td><td>${compareValue}</td></tr>`).join('')}
            <tr><td>Capaian target rilis</td><td>${releaseTargetRate === null ? '-' : qccRate(releaseTargetRate)}</td><td>${compareSupport.releaseTargetRate === null ? '-' : qccRate(compareSupport.releaseTargetRate)}</td></tr>
          </tbody>
        </table></div>
      </section>

      <section class="card qcc-section">
        <h3>Fishbone - Indikasi Penyebab Produksi</h3>
        <p class="sm">Indikasi menggunakan checklist episode, jadwal, peralatan, dan mitigasi risiko. Validasi akar masalah bersama tim.</p>
        <div class="fishbone-board">
          <div class="fishbone-spine" aria-hidden="true"></div>
          ${FISHBONE_CATEGORIES.map(([key, category], index) => `
            <div class="fishbone-cause fishbone-cause-${index + 1} ${index < 3 ? 'top' : 'bottom'}">
              <b>${esc(category)}</b><span class="qcc-fishbone-evidence">${esc(evidence[key])}</span>
              ${qccTextarea('fishbone', key, 'Catatan penyebab', fishboneNotes[key], 2, 'qcc-fishbone-note')}
            </div>
          `).join('')}
          <div class="fishbone-effect"><span>Masalah utama</span><b data-qcc-effect>${esc(pdca.problem || S.qccSelectedTheme || 'Pilih kandidat tema atau tulis masalah QCC')}</b></div>
        </div>
      </section>

      <section class="card qcc-section">
        <h3>Pareto Checklist Tertunda</h3>
        <p class="sm">Jumlah tugas belum selesai pada setiap tahap produksi podcast.</p>
        ${pareto.length ? `<div class="qcc-pareto">${paretoChart}</div>` : '<p class="qcc-empty">Semua checklist produksi pada periode ini telah selesai.</p>'}
      </section>

      <section class="card qcc-section">
        <h3>Progres Checklist per Tahap</h3>
        <div class="report-charts"><div class="report-bar-chart-wrap"><div class="report-bar-chart" role="img" aria-label="Progres checklist setiap tahap produksi">${stageChart}</div></div></div>
      </section>

      <section class="card qcc-section">
        <h3>Kandidat Tema Perbaikan</h3>
        <p class="sm">Kandidat dibuat dari data podcast yang tersedia. Pilih tema untuk dibahas dalam PDCA.</p>
        <div class="qcc-theme-list">${themesHtml || '<p class="qcc-empty">Belum ada temuan otomatis pada episode terpilih.</p>'}</div>
        ${S.qccSelectedTheme ? `<p class="sm">Tema terpilih: <b>${esc(themes.find(theme => theme.id === S.qccSelectedTheme)?.title || S.qccSelectedTheme)}</b></p>` : ''}
      </section>

      <section class="card qcc-section">
        <h3>Episode dalam Analisa</h3>
        <p class="sm">Data bersumber dari menu Episode dan Report Episode; ubah jadwal atau checklist dari menu Episode.</p>
        <div class="sc"><table class="qcc-episode-table">
          <thead><tr><th>Episode / Tamu</th><th>Tahap</th><th>Rekaman</th><th>Rilis</th><th>Progres</th><th>Tugas tersisa</th></tr></thead>
          <tbody>${episodeRows || '<tr><td colspan="6" class="sm">Tidak ada episode terjadwal pada rentang ini. Periksa jadwal pada menu Episode.</td></tr>'}</tbody>
        </table></div>
      </section>

      <section class="card qcc-section">
        <h3>Target dan Evaluasi Podcast</h3>
        <p class="sm">Target dan catatan ini disimpan terpisah untuk setiap rentang analisa.</p>
        <div class="f qcc-supporting-fields">
          ${qccMetricInput('releaseTarget', 'Target jumlah episode dirilis', metrics.releaseTarget)}
          <label>Capaian episode dirilis<input type="text" value="${current.publishedEpisodes}" readonly></label>
          <label>Rata-rata views / stream<input type="text" value="${current.averageViews === null ? 'Belum ada data' : Math.round(current.averageViews).toLocaleString('id-ID')}" readonly></label>
          <label>Rata-rata retensi pendengar<input type="text" value="${qccRate(current.averageRetention)}" readonly></label>
        </div>
        <div class="f">${qccTextarea('metrics', 'audienceNotes', 'Evaluasi pendengar / catatan produksi', audienceNotes, 2)}</div>
      </section>

      <section class="card qcc-section">
        <h3>Rencana Tindak Lanjut - PDCA</h3>
        <div class="recap-qcc-problem">${qccTextarea('pdca', 'problem', 'Masalah yang diprioritaskan', pdca.problem)}${qccTextarea('pdca', 'target', 'Target perbaikan', pdca.target)}</div>
        <div class="recap-qcc-cycle">
          ${qccTextarea('pdca', 'plan', 'Plan - Rencana tindakan', pdca.plan)}
          ${qccTextarea('pdca', 'do', 'Do - Pelaksanaan', pdca.do)}
          ${qccTextarea('pdca', 'check', 'Check - Hasil pemeriksaan', pdca.check)}
          ${qccTextarea('pdca', 'act', 'Act - Standarisasi / tindak lanjut', pdca.act)}
        </div>
      </section>

      <section class="card qcc-section">
        <div class="qcc-section-heading"><div><h3>Laporan PowerPoint</h3><p class="sm">17 slide berisi analisa pipeline podcast dan rencana perbaikan.</p></div><button class="b" data-a="export-qcc-ppt">Unduh PPT</button></div>
        <div class="qcc-slide-list">${QCC_PPT_SLIDES.map((title, index) => `<span><b>${index + 1}.</b> ${esc(title)}</span>`).join('')}</div>
        <p class="sm">Target rilis: ${esc(metrics.releaseTarget ?? 'Belum diisi')} - Capaian: ${esc(releaseGoal)} - Evaluasi: ${esc(audienceNotes || 'Belum ada catatan')}</p>
      </section>
    </article>
  `;
}

let pptxGenPromise = null;

function loadPptxGenJS() {
  if (typeof window.PptxGenJS === 'function') return Promise.resolve(window.PptxGenJS);
  if (pptxGenPromise) return pptxGenPromise;

  pptxGenPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js';
    script.async = true;
    script.onload = () => {
      if (typeof window.PptxGenJS === 'function') resolve(window.PptxGenJS);
      else reject(new Error('Pustaka PowerPoint berhasil dimuat tetapi tidak tersedia.'));
    };
    script.onerror = () => reject(new Error('Pustaka PowerPoint tidak dapat dimuat. Periksa koneksi internet.'));
    document.head.appendChild(script);
  });
  return pptxGenPromise;
}

async function exportQccPptReport() {
  const PptxGenJS = await loadPptxGenJS();
  const pptx = new PptxGenJS();
  const data = getQccAnalysis();
  const { current, compare, currentEpisodes, period, metrics, releaseTargetRate } = data;
  const themes = qccCandidateThemes(data);
  const pipelineRows = ST.map((label, index) => ({ label, value: current.stageCounts[index] }));
  const stageProgressRows = current.stageWork.map(stage => ({
    label: ST[stage.index],
    value: stage.total ? stage.completed / stage.total * 100 : 0
  }));
  const addHeader = (slide, title, subtitle, page) => {
    slide.background = { color: 'F8FAFC' };
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.16, fill: { color: '2563EB' }, line: { color: '2563EB' } });
    slide.addText(title, { x: 0.65, y: 0.42, w: 12, h: 0.52, fontFace: 'Aptos Display', fontSize: 24, bold: true, color: '1E293B', margin: 0 });
    if (subtitle) slide.addText(subtitle, { x: 0.67, y: 1.02, w: 12, h: 0.38, fontFace: 'Aptos', fontSize: 11, color: '64748B', margin: 0 });
    slide.addText(`QCC MinePod ? ${page}/17`, { x: 10.2, y: 7.12, w: 2.45, h: 0.2, fontFace: 'Aptos', fontSize: 9, color: '64748B', align: 'right', margin: 0 });
  };
  const addTextSlide = (title, lines, page, subtitle = '') => {
    const slide = pptx.addSlide();
    addHeader(slide, title, subtitle, page);
    slide.addText(lines.length ? lines.map(line => `- ${line}`).join('\n') : 'Belum ada data pada periode ini.', {
      x: 0.85, y: 1.65, w: 11.6, h: 5.1, fontFace: 'Aptos', fontSize: 17, color: '334155', valign: 'top', margin: 0.08, paraSpaceAfterPt: 12, fit: 'shrink'
    });
    return slide;
  };
  const addBarSlide = (title, rows, page, suffix) => {
    const slide = pptx.addSlide();
    addHeader(slide, title, qccPeriodLabel(period.from, period.to), page);
    const max = Math.max(1, ...rows.map(row => row.value));
    if (!rows.length) {
      slide.addText('Belum ada data untuk ditampilkan.', { x: 0.85, y: 1.8, w: 11.6, h: 0.5, fontFace: 'Aptos', fontSize: 16, color: '64748B', margin: 0 });
      return slide;
    }
    rows.slice(0, 8).forEach((row, index) => {
      const y = 1.65 + index * 0.58;
      const width = row.value / max * 7.2;
      const value = Number(row.value).toLocaleString('id-ID', { maximumFractionDigits: 1 });
      slide.addText(row.label, { x: 0.85, y, w: 2.8, h: 0.3, fontFace: 'Aptos', fontSize: 11, color: '334155', margin: 0, fit: 'shrink' });
      slide.addShape(pptx.ShapeType.rect, { x: 3.8, y: y + 0.03, w: 7.2, h: 0.25, fill: { color: 'E2E8F0' }, line: { color: 'E2E8F0' } });
      if (width > 0) slide.addShape(pptx.ShapeType.rect, {
        x: 3.8, y: y + 0.03, w: width, h: 0.25,
        fill: { color: QCC_CHART_COLORS[index % QCC_CHART_COLORS.length] },
        line: { color: QCC_CHART_COLORS[index % QCC_CHART_COLORS.length] }
      });
      slide.addText(`${value} ${suffix}`, { x: 11.15, y, w: 1.3, h: 0.3, fontFace: 'Aptos', fontSize: 10, color: '334155', margin: 0, fit: 'shrink' });
    });
    return slide;
  };

  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'MinePod by Lourdes';
  pptx.subject = 'Laporan QCC Produksi Podcast';
  pptx.title = `Laporan QCC Podcast ${period.from} - ${period.to}`;
  pptx.theme = { headFontFace: 'Aptos Display', bodyFontFace: 'Aptos', lang: 'id-ID' };

  let slide = pptx.addSlide();
  slide.background = { color: 'EFF6FF' };
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.2, fill: { color: '2563EB' }, line: { color: '2563EB' } });
  slide.addText('QUALITY CONTROL CIRCLE - PODCAST', { x: 0.85, y: 2, w: 11.6, h: 0.55, fontFace: 'Aptos', fontSize: 16, bold: true, color: '2563EB', margin: 0 });
  slide.addText('Laporan Analisa QCC', { x: 0.85, y: 2.65, w: 11.6, h: 0.9, fontFace: 'Aptos Display', fontSize: 34, bold: true, color: '1E293B', margin: 0 });
  slide.addText(data.baseline ? 'Baseline seluruh episode - jadwal belum diatur' : qccPeriodLabel(period.from, period.to), { x: 0.85, y: 3.7, w: 11.6, h: 0.4, fontFace: 'Aptos', fontSize: 18, color: '475569', margin: 0 });
  slide.addText('MinePod by Lourdes', { x: 0.85, y: 6.35, w: 11.6, h: 0.3, fontFace: 'Aptos', fontSize: 13, color: '64748B', margin: 0 });

  addTextSlide('Ringkasan Produksi Podcast', [
    `${current.total} episode dianalisis; progres checklist rata-rata ${qccRate(current.averageProgress)}.`,
    `${current.completedEpisodes} episode selesai; ${current.publishedEpisodes} episode ditandai sudah diunggah.`,
    `${current.completedTasks} dari ${current.totalTasks} checklist selesai; ${current.remainingTasks} tugas masih tertunda.`,
    `${current.overdueReleases} episode melewati tanggal rilis dan belum diunggah.`
  ], 2, data.baseline ? 'Baseline seluruh episode' : qccPeriodLabel(period.from, period.to));
  addTextSlide('Sumber Data', [
    'Pipeline episode dan checklist dari menu Episode.',
    'Tanggal rekaman dan rilis untuk menyaring rentang analisa.',
    'Views, retensi, interaksi, subscriber, dan calon mitra dari Report Episode.',
    'Jadwal tamu, kesiapan peralatan, dan risiko produksi dari menu aplikasi.'
  ], 3);
  addBarSlide('Pareto Checklist Tertunda per Tahap', data.pareto.map(row => ({ label: row.label, value: row.value })), 4, 'tugas');
  addBarSlide('Progres Checklist per Tahap', stageProgressRows, 5, '%');
  addTextSlide('Kandidat Tema Perbaikan', themes.map(theme => `${theme.title} ? ${theme.evidence}${S.qccSelectedTheme === theme.id ? ' (tema dipilih)' : ''}`), 6);
  addBarSlide('Distribusi Pipeline Episode', pipelineRows, 7, 'episode');
  addTextSlide('Jadwal Rekaman dan Rilis', currentEpisodes.map(episode =>
    `${episode.title || 'Episode tanpa judul'} - rekaman ${dt(episode.rec)}, rilis ${dt(episode.rel)}, tahap ${ST[stg(episode)]}`
  ), 8);
  addTextSlide('Performa Pendengar', [
    `Rata-rata views / stream: ${current.averageViews === null ? 'belum ada data' : Math.round(current.averageViews).toLocaleString('id-ID')}.`,
    `Rata-rata retensi: ${qccRate(current.averageRetention)}.`,
    `${current.reportedEpisodes} episode memiliki setidaknya satu metrik pascarilis.`
  ], 9);
  addTextSlide('Kesiapan Tamu dan Materi', [
    `${current.incompleteGuestPreparation} episode belum menuntaskan konfirmasi tamu atau release form.`,
    `${current.missingGuest} episode belum mencantumkan tamu; ${current.missingGoal} belum mengisi tujuan utama.`,
    `${current.missingTitle} episode belum mengisi judul atau topik.`
  ], 10);
  const evidence = qccFishboneEvidence(current, data);
  const fishboneNotes = S.qccNotes.fishbone || {};
  addTextSlide('Fishbone Sebab Akibat', FISHBONE_CATEGORIES.map(([key, category]) => `${category}: ${evidence[key]}${fishboneNotes[key] ? `; catatan: ${fishboneNotes[key]}` : ''}`), 11);
  addTextSlide('Progres per Episode', currentEpisodes.map(episode =>
    `${episode.title || 'Episode tanpa judul'} ? ${ST[stg(episode)]}, ${pct(episode)}% (${cnt(episode)}/${NT} checklist)`
  ), 12);
  addTextSlide('Perbandingan Dua Rentang', [
    `Periode utama: ${current.total} episode; progres rata-rata ${qccRate(current.averageProgress)}; ${current.remainingTasks} checklist tertunda.`,
    `Pembanding: ${compare.total} episode; progres rata-rata ${qccRate(compare.averageProgress)}; ${compare.remainingTasks} checklist tertunda.`,
    `Episode selesai: ${current.completedEpisodes} vs ${compare.completedEpisodes}; sudah diunggah: ${current.publishedEpisodes} vs ${compare.publishedEpisodes}.`,
    `Views rata-rata: ${current.averageViews === null ? 'belum ada data' : Math.round(current.averageViews).toLocaleString('id-ID')} vs ${compare.averageViews === null ? 'belum ada data' : Math.round(compare.averageViews).toLocaleString('id-ID')}.`
  ], 13);
  addTextSlide('Target Rilis Episode', [
    `Target jumlah rilis: ${metrics.releaseTarget || 'belum diisi'}.`,
    `Capaian rilis periode ini: ${current.publishedEpisodes}.`,
    `Capaian terhadap target: ${releaseTargetRate === null ? 'belum dapat dihitung' : qccRate(releaseTargetRate)}.`,
    `Evaluasi pendengar / catatan produksi: ${metrics.audienceNotes || 'belum ada catatan'}.`
  ], 14);
  const pdca = S.qccNotes.pdca || {};
  addTextSlide('Tindak Lanjut QCC - PDCA', [
    `Tema dipilih: ${themes.find(theme => theme.id === S.qccSelectedTheme)?.title || 'belum dipilih'}.`,
    `Masalah: ${pdca.problem || 'belum diisi'}. Target: ${pdca.target || 'belum diisi'}.`,
    `Plan: ${pdca.plan || 'belum diisi'}. Do: ${pdca.do || 'belum diisi'}.`,
    `Check: ${pdca.check || 'belum diisi'}. Act: ${pdca.act || 'belum diisi'}.`
  ], 15);
  addTextSlide('Batasan Data', [
    'Analisa menggunakan jadwal rekaman/rilis dan checklist yang tercatat pada aplikasi.',
    `${data.episodes.filter(episode => !episode.rec && !episode.rel).length} episode belum memiliki tanggal rekaman maupun rilis.`,
    `${current.reportedEpisodes} episode memiliki data pascarilis pada rentang ini.`,
    'Views dan retensi hanya dihitung dari angka yang diisi pada Report Episode.'
  ], 16);
  addTextSlide('Penutup', [
    'Validasi temuan bersama tim podcast sebelum menetapkan akar masalah.',
    'Pilih satu tema, tetapkan target yang terukur, dan tinjau tindak lanjut PDCA pada siklus berikutnya.'
  ], 17);

  await pptx.writeFile({ fileName: `QCC-Podcast-${period.from}-sampai-${period.to}.pptx` });
}

function vEq() {
  const eqList = S.eq || [];
  const est = eqList.reduce((a, x) => a + (Number(x.est) || 0), 0);
  const act = eqList.reduce((a, x) => a + (Number(x.act) || 0), 0);
  return `
    <h2>
      <span>Peralatan & Anggaran (Paket A Studio)</span>
      <button class="b" data-a="add" data-l="eq">+ Item Baru</button>
    </h2>
    <div class="card sc">
      <table>
        <thead>
          <tr>
            <th>Nama Item Peralatan</th>
            <th>Spesifikasi Teknis</th>
            <th style="width:140px">Estimasi (Rp)</th>
            <th style="width:140px">Realisasi (Rp)</th>
            <th style="width:130px">Status</th>
            <th style="width:90px"></th>
          </tr>
        </thead>
        <tbody>
          ${eqList.map(x => `
            <tr>
              <td>${inp("eq", x, "name")}</td>
              <td>${inp("eq", x, "spec")}</td>
              <td>${inp("eq", x, "est", "number")}</td>
              <td>${inp("eq", x, "act", "number")}</td>
              <td>${sel("eq", x, "st", ES)}</td>
              <td>${del("eq", x)}</td>
            </tr>
          `).join("")}
          <tr style="background:var(--card-subtle);">
            <td colspan="2"><b>TOTAL ANGGARAN</b></td>
            <td><b>${rp(est)}</b></td>
            <td><b>${rp(act)}</b></td>
            <td colspan="2" class="${act > est ? "no" : "ok"}">
              ${act ? (act > est ? "Melebihi " + rp(act - est) : "Hemat " + rp(est - act)) : "Belum ada realisasi"}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="sm">
      ⚠️ <b>Catatan Teknis:</b> Untuk konfigurasi 3 mikrofon podcast, pastikan audio interface memiliki minimal 3 input XLR / TRS independen. Konfirmasikan ketersediaan dan harga ke vendor resmi sebelum checkout.
    </p>
  `;
}

function vRisk() {
  const risks = S.risks || [];
  return `
    <h2>
      <span>Manajemen Risiko & Mitigasi (${risks.length})</span>
      <button class="b" data-a="add" data-l="risks">+ Tambah Risiko</button>
    </h2>
    ${risks.map(r => `
      <div class="card">
        <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
          <input type="checkbox" data-l="risks" data-id="${r.id}" data-k="ok" ${r.ok ? "checked" : ""}>
          <b style="flex:1;font-size:15px">${esc(r.name)}</b>
          ${r.ok ? `<span class="tag">Termitigasi</span>` : ""}
          ${del("risks", r)}
        </div>
        <div class="f" style="margin:10px 0 0">
          <label>Rencana Antisipasi / Solusi Mitigasi ${inp("risks", r, "mit")}</label>
          <label>Catatan / Tindak Lanjut Tim ${inp("risks", r, "note")}</label>
        </div>
      </div>
    `).join("")}
  `;
}

// ==========================================================================
// RENDER UTAMA
// ==========================================================================

export function render() {
  document.body.classList.toggle("report-tab-active", currentTab === "report");
  const navEl = document.getElementById("nav");
  if (navEl) {
    navEl.innerHTML = TABS.map(t => `
      <button class="${t[0] === currentTab ? "on" : ""}" data-a="tab" data-t="${t[0]}"${t[0] === currentTab ? ' aria-current="page"' : ""}>
        ${t[1]}
      </button>
    `).join("");
  }

  const appEl = document.getElementById("app");
  if (appEl) {
    const viewMap = {
      ringkasan: vHome,
      rekap: vRecap,
      qcc: vQcc,
      episode: vEps,
      report: vReport,
      tamu: vGuests,
      peralatan: vEq,
      risiko: vRisk
    };
    appEl.innerHTML = (viewMap[currentTab] || vHome)();
  }
}

// ==========================================================================
// SINKRONISASI KE SUPABASE DENGAN DEBOUNCE
// ==========================================================================

const TABLE_MAP = {
  eps: 'episodes',
  guests: 'guests',
  kpi: 'kpis',
  eq: 'equipments',
  risks: 'risks'
};

async function syncToSupabase(listKey, item) {
  if (!supabaseManager.isConnected) return;
  const dbTable = TABLE_MAP[listKey];
  if (!dbTable) return;

  const timerKey = `${listKey}-${item.id}`;
  clearTimeout(debounceTimers[timerKey]);
  debounceTimers[timerKey] = setTimeout(async () => {
    delete debounceTimers[timerKey];
    const success = await supabaseManager.upsertItem(dbTable, item);
    if (success) {
      showToast(`Tersimpan ke Supabase (${dbTable})`, 'success', 1500);
    }
  }, 400);
}

async function deleteFromSupabase(listKey, id) {
  if (!supabaseManager.isConnected) return;
  const dbTable = TABLE_MAP[listKey];
  if (!dbTable) return;
  const success = await supabaseManager.deleteItem(dbTable, id);
  if (success) {
    showToast(`Dihapus dari Supabase (${dbTable})`, 'info', 1500);
  }
}

// ==========================================================================
// EVENT DELEGATION
// ==========================================================================

document.addEventListener("click", async ev => {
  const t = ev.target.closest("[data-a]");
  if (!t) return;
  const d = t.dataset;
  const a = d.a;

  if (a === "print-report") {
    window.print();
    return;
  }

  if (a === "analyze-qcc") {
    const from = document.getElementById("qcc-from")?.value || "";
    const to = document.getElementById("qcc-to")?.value || "";
    const compareFrom = document.getElementById("qcc-compare-from")?.value || "";
    const compareTo = document.getElementById("qcc-compare-to")?.value || "";
    if (!from || !to || !compareFrom || !compareTo || from > to || compareFrom > compareTo) {
      showToast("Periksa kembali rentang tanggal analisa dan pembanding.", "warning");
      return;
    }
    S.qccPeriod = { from, to, compareFrom, compareTo };
    saveLocal();
    render();
    return;
  }

  if (a === "select-qcc-theme") {
    S.qccSelectedTheme = d.themeId || "";
    saveLocal();
    render();
    return;
  }

  if (a === "export-qcc-ppt") {
    try {
      await exportQccPptReport();
      showToast("Laporan PPT QCC berhasil dibuat.", "success");
    } catch (error) {
      console.error("Gagal membuat laporan PPT QCC:", error);
      showToast(`Gagal membuat PPT: ${error.message}`, "error");
    }
    return;
  }

  // Tab switching
  if (a === "tab") {
    currentTab = d.t;
    try { location.hash = currentTab; } catch (e) {}
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  // Menambah item baru
  if (a === "add") {
    const id = Date.now();
    let newItem = null;

    if (d.l === "eps") {
      newItem = { id, title: "Episode Baru", guest: "", goal: "", rec: "", rel: "", d: {} };
      S.eps.push(newItem);
      openDetails.add(id);
    } else if (d.l === "guests") {
      newItem = { id, name: "Tamu Baru", ep: S.eps.length, st: 0 };
      S.guests.push(newItem);
    } else if (d.l === "eq") {
      newItem = { id, name: "Item Baru", spec: "", est: 0, act: "", st: 0 };
      S.eq.push(newItem);
    } else if (d.l === "risks") {
      newItem = { id, name: "Risiko Baru", mit: "", ok: false, note: "" };
      S.risks.push(newItem);
    } else if (d.l === "kpi") {
      const m = document.getElementById("km")?.value;
      if (!m) {
        alert("Pilih bulan evaluasi terlebih dahulu!");
        return;
      }
      newItem = { id, m };
      Object.keys(KT).forEach(x => {
        const v = document.getElementById("k_" + x)?.value;
        newItem[x] = v === "" ? "" : +v;
      });
      S.kpi = (S.kpi || []).filter(z => z.m !== m);
      S.kpi.push(newItem);
    }

    saveLocal();
    render();

    if (newItem) {
      await syncToSupabase(d.l, newItem);
    }
    return;
  }

  // Menghapus item
  if (a === "del") {
    if (!d.sure) {
      t.textContent = "Yakin hapus?";
      d.sure = "1";
      setTimeout(() => {
        t.textContent = "Hapus";
        delete d.sure;
      }, 3000);
      return;
    }
    const id = Number(d.id);
    S[d.l] = (S[d.l] || []).filter(x => x.id !== id);
    saveLocal();
    render();
    await deleteFromSupabase(d.l, id);
    return;
  }
});

// Event form change & input
document.addEventListener("change", async ev => {
  const t = ev.target;
  const d = t.dataset;
  if (d.qccGroup) {
    updateQccField(t);
    return;
  }
  if (t.matches("[data-report-episode]")) {
    selectedReportEpisodeId = Number(t.value);
    render();
    return;
  }
  if (d.reportId) {
    updateEpisodeReportField(t);
    return;
  }
  if (!d.l) return;

  const it = (S[d.l] || []).find(x => x.id == d.id);
  if (!it) return;

  if (d.t) {
    if (!it.d) it.d = {};
    it.d[d.t] = t.checked;
  } else if (t.type === "checkbox") {
    it[d.k] = t.checked;
  } else {
    it[d.k] = d.n ? +t.value : (t.type === "number" ? (t.value === "" ? "" : +t.value) : t.value);
  }

  saveLocal();
  render();
  await syncToSupabase(d.l, it);
});

// Sync real-time on typing (debounced)
document.addEventListener("input", ev => {
  const t = ev.target;
  const d = t.dataset;
  if (d.qccGroup) {
    updateQccField(t);
    return;
  }
  if (d.reportId) {
    updateEpisodeReportField(t);
    return;
  }
  if (!d.l || !d.k) return;

  const it = (S[d.l] || []).find(x => x.id == d.id);
  if (!it) return;

  it[d.k] = d.n ? +t.value : (t.type === "number" ? (t.value === "" ? "" : +t.value) : t.value);
  saveLocal();
  syncToSupabase(d.l, it);
});

function updateQccField(input) {
  const { qccGroup, qccKey } = input.dataset;
  if (!qccKey) return;
  if (qccGroup === "metrics") {
    const periodKey = `${S.qccPeriod.from}|${S.qccPeriod.to}`;
    if (!S.qccMetrics[periodKey] || typeof S.qccMetrics[periodKey] !== "object") S.qccMetrics[periodKey] = {};
  }
  const destination = qccGroup === "metrics"
    ? S.qccMetrics[`${S.qccPeriod.from}|${S.qccPeriod.to}`]
    : qccGroup === "pdca"
      ? S.qccNotes.pdca
      : qccGroup === "fishbone"
        ? S.qccNotes.fishbone
        : null;
  if (!destination) return;
  destination[qccKey] = qccGroup === "metrics" && input.type === "number"
    ? (input.value === "" ? "" : Number(input.value))
    : input.value;
  saveLocal();

  if (qccGroup === "pdca" && qccKey === "problem") {
    const effect = document.querySelector("[data-qcc-effect]");
    if (effect) effect.textContent = input.value || S.qccSelectedTheme || "Pilih kandidat tema atau tulis masalah QCC";
  }
}

function updateEpisodeReportField(input) {
  const episode = (S.eps || []).find(item => item.id === Number(input.dataset.reportId));
  if (!episode) return;
  if (!episode.d) episode.d = {};
  if (!episode.d.report) episode.d.report = {};

  const key = input.dataset.reportKey;
  episode.d.report[key] = input.type === "number"
    ? (input.value === "" ? "" : Number(input.value))
    : input.value;
  saveLocal();
  syncToSupabase("eps", episode);

  const value = input.closest(".report-metric")?.querySelector(".report-metric-value");
  if (value) {
    value.textContent = episode.d.report[key] === "" ? "Belum diisi" : `${episode.d.report[key]}${key === "retention" || key === "subscriberGrowth" ? "%" : ""}`;
  }
  const noteValue = document.querySelector(`[data-report-note-value="${key}"]`);
  if (noteValue) {
    noteValue.textContent = episode.d.report[key] || (key === "summary" ? "Belum ada ringkasan." : "Belum ada tindak lanjut.");
  }
}

window.addEventListener("beforeprint", () => {
  if (currentTab === "report") document.body.classList.add("printing-report");
});
window.addEventListener("afterprint", () => {
  document.body.classList.remove("printing-report");
});

// Toggle accordion open/close tracking
document.addEventListener("toggle", ev => {
  const id = ev.target.dataset?.o;
  if (id) {
    if (ev.target.open) openDetails.add(+id);
    else openDetails.delete(+id);
  }
}, true);

window.addEventListener("hashchange", () => {
  const h = location.hash.slice(1);
  if (h === "kpi") {
    currentTab = "rekap";
    render();
    return;
  }
  if (TABS.some(t => t[0] === h)) {
    currentTab = h;
    render();
  }
});

// ==========================================================================
// SUPABASE REALTIME & STATUS UPDATE HANDLERS
// ==========================================================================

export function updateConnectionStatusUI(statusInfo) {
  const pill = document.getElementById("supabase-status-pill");
  const text = document.getElementById("supabase-status-text");
  if (!pill || !text) return;

  pill.className = `status-pill ${statusInfo.status}`;
  if (statusInfo.status === 'connected') {
    text.textContent = 'Supabase Aktif';
    pill.title = 'Terhubung ke Supabase. Perubahan disinkronkan secara realtime.';
  } else if (statusInfo.status === 'connecting') {
    text.textContent = 'Menghubungkan...';
    pill.title = statusInfo.details;
  } else if (statusInfo.status === 'error') {
    text.textContent = 'Koneksi Gagal';
    pill.title = statusInfo.details;
  } else {
    text.textContent = 'Mode Lokal';
    pill.title = 'Berjalan offline menggunakan memori browser lokal.';
  }
}

// Handler saat data di Supabase diperbarui oleh user/tab lain
function handleRemoteChange({ table, payload }) {
  console.log('[Remote Change Event]:', table, payload);
  const { eventType, new: newRow, old: oldRow } = payload;
  const list = S[table];
  if (!list) return;

  if (eventType === 'INSERT') {
    if (!list.some(x => x.id === Number(newRow.id))) {
      list.push(newRow);
      showToast(`Item baru ditambahkan via Supabase`, 'info');
    }
  } else if (eventType === 'UPDATE') {
    const idx = list.findIndex(x => x.id === Number(newRow.id));
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...newRow };
      showToast(`Data diperbarui via realtime`, 'info');
    }
  } else if (eventType === 'DELETE') {
    const idx = list.findIndex(x => x.id === Number(oldRow.id));
    if (idx !== -1) {
      list.splice(idx, 1);
      showToast(`Item dihapus via realtime`, 'info');
    }
  }

  saveLocal();
  render();
}

// Inisialisasi Aplikasi Saat DOM Siap
export async function initApp() {
  supabaseManager.onStatusChange(updateConnectionStatusUI);
  supabaseManager.onRemoteDataChange(handleRemoteChange);

  // Inisialisasi Supabase
  const isOnline = await supabaseManager.init();
  if (isOnline) {
    // Ambil data terbaru dari Supabase
    const remoteData = await supabaseManager.fetchAll();
    if (remoteData && remoteData.eps && remoteData.eps.length > 0) {
      S = remoteData;
      saveLocal();
      showToast('Data berhasil disinkronkan dari Supabase', 'success');
    } else {
      // Jika tabel Supabase masih kosong sama sekali, tawarkan seeding
      console.log('Tabel Supabase terdeteksi masih kosong.');
    }
  }

  render();
}
