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
  ["kpi", "KPI"],
  ["peralatan", "Peralatan & Anggaran"],
  ["risiko", "Risiko"]
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
let currentTab = TABS.some(t => t[0] === location.hash.slice(1)) ? location.hash.slice(1) : "ringkasan";
const debounceTimers = {};

// Inisialisasi State Awal dari LocalStorage
try {
  S = JSON.parse(localStorage.getItem("minepod1"));
} catch (e) {}
if (!S || !S.eps) S = seed();

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

export const cnt = e => Object.values(e.d || {}).filter(Boolean).length;

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

export const opts = (a, v) => a.map((x, i) => `<option value="${i}"${i == v ? " selected" : ""}>${esc(x)}</option>`).join("");

export const inp = (l, it, k, t = "text") => `<input type="${t}" data-l="${l}" data-id="${it.id}" data-k="${k}" value="${esc(it[k])}">`;

export const sel = (l, it, k, a) => `<select data-n="1" data-l="${l}" data-id="${it.id}" data-k="${k}">${opts(a, it[k])}</select>`;

export const del = (l, it) => `<button class="b g" data-a="del" data-l="${l}" data-id="${it.id}">Hapus</button>`;

export const lastK = () => [...(S.kpi || [])].sort((a, b) => a.m > b.m ? 1 : -1).pop();

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
    <h2>Pelacakan KPI & Metrik Produksi</h2>
    <div class="card">
      <h3>Target 3 Bulan Pertama (Evaluasi Berkala)</h3>
      <div class="grid">
        ${Object.keys(KT).map(x => `
          <div>
            <div class="sm">${KL[x]}</div>
            <div class="big">≥${KT[x]}</div>
            ${k ? `<span class="tag ${+k[x] >= KT[x] ? "ok" : "no"}">${k.m}: ${k[x] === "" ? "–" : k[x]}</span>` : ""}
          </div>
        `).join("")}
      </div>
    </div>

    <div class="card">
      <h3>Input Laporan Metrik Bulanan</h3>
      <div class="f">
        <label>Bulan Evaluasi <input type="month" id="km"></label>
        ${Object.keys(KT).map(x => `<label>${KL[x]} <input type="number" min="0" id="k_${x}" placeholder="Nilai"></label>`).join("")}
      </div>
      <button class="b" data-a="add" data-l="kpi">Simpan Laporan Bulanan</button>
      <p class="sm" style="margin-top:8px">Sumber data: YouTube Studio, Spotify for Podcasters, Instagram / LinkedIn Insights, dan CRM / Sales Team.</p>
    </div>

    <div class="card sc">
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
  `;
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
  const navEl = document.getElementById("nav");
  if (navEl) {
    navEl.innerHTML = TABS.map(t => `
      <button class="${t[0] === currentTab ? "on" : ""}" data-a="tab" data-t="${t[0]}">
        ${t[1]}
      </button>
    `).join("");
  }

  const appEl = document.getElementById("app");
  if (appEl) {
    const viewMap = {
      ringkasan: vHome,
      episode: vEps,
      tamu: vGuests,
      kpi: vKpi,
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
  if (!d.l || !d.k) return;

  const it = (S[d.l] || []).find(x => x.id == d.id);
  if (!it) return;

  it[d.k] = d.n ? +t.value : (t.type === "number" ? (t.value === "" ? "" : +t.value) : t.value);
  saveLocal();
  syncToSupabase(d.l, it);
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
