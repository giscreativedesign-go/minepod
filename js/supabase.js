/**
 * MinePod - Supabase Client & Realtime Sync Handler
 * Mendukung konfigurasi via Vercel Environment Variables (/api/config)
 * serta input manual via UI LocalStorage.
 */

const SUPABASE_CDN = 'https://esm.sh/@supabase/supabase-js@2';

export class SupabaseManager {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.config = {
      url: '',
      anonKey: ''
    };
    this.realtimeChannel = null;
    this.onStateChangeCallbacks = [];
    this.onDataChangeCallbacks = [];
  }

  // Daftarkan listener untuk perubahan status koneksi (connected / disconnected)
  onStatusChange(cb) {
    if (typeof cb === 'function') this.onStateChangeCallbacks.push(cb);
  }

  // Daftarkan listener saat ada update realtime dari Supabase
  onRemoteDataChange(cb) {
    if (typeof cb === 'function') this.onDataChangeCallbacks.push(cb);
  }

  notifyStatus(status, details = '') {
    this.onStateChangeCallbacks.forEach(cb => cb({ isConnected: this.isConnected, status, details, config: this.config }));
  }

  notifyDataChange(payload) {
    this.onDataChangeCallbacks.forEach(cb => cb(payload));
  }

  // Dapatkan konfigurasi tersimpan (dari /api/config atau localStorage)
  async loadConfig() {
    // 1. Cek dari Vercel / Serverless API endpoint
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        if (data && data.supabaseUrl && data.supabaseAnonKey) {
          this.config.url = data.supabaseUrl.trim();
          this.config.anonKey = data.supabaseAnonKey.trim();
          this.config.source = 'vercel-env';
          return this.config;
        }
      }
    } catch (e) {
      // Endpoint /api/config tidak tersedia (misal file dibuka langsung)
    }

    // 2. Cek dari localStorage jika diatur lewat modal browser
    try {
      const local = JSON.parse(localStorage.getItem('minepod_supabase_cfg') || '{}');
      if (local && local.url && local.anonKey) {
        this.config.url = local.url.trim();
        this.config.anonKey = local.anonKey.trim();
        this.config.source = 'local-storage';
        return this.config;
      }
    } catch (e) {}

    this.config.source = 'none';
    return this.config;
  }

  // Inisialisasi koneksi ke Supabase
  async init(customConfig = null) {
    if (customConfig && customConfig.url && customConfig.anonKey) {
      this.config.url = customConfig.url.trim();
      this.config.anonKey = customConfig.anonKey.trim();
      this.config.source = 'manual';
      localStorage.setItem('minepod_supabase_cfg', JSON.stringify({
        url: this.config.url,
        anonKey: this.config.anonKey
      }));
    } else {
      await this.loadConfig();
    }

    if (!this.config.url || !this.config.anonKey) {
      this.isConnected = false;
      this.client = null;
      this.notifyStatus('offline', 'Kredensial Supabase belum diatur');
      return false;
    }

    try {
      this.notifyStatus('connecting', 'Menghubungkan ke Supabase...');
      
      // Dynamic import modul Supabase dari CDN
      const { createClient } = await import(SUPABASE_CDN);
      this.client = createClient(this.config.url, this.config.anonKey, {
        auth: { persistSession: false }
      });

      // Uji koneksi dengan mengambil 1 baris dari tabel episodes
      const { data, error } = await this.client
        .from('episodes')
        .select('id')
        .limit(1);

      if (error) {
        console.warn('Supabase connection test error:', error);
        this.isConnected = false;
        this.notifyStatus('error', error.message || 'Tabel belum ada atau query ditolak RLS');
        return false;
      }

      this.isConnected = true;
      this.notifyStatus('connected', 'Terhubung ke Supabase');
      this.subscribeRealtime();
      return true;
    } catch (err) {
      console.error('Gagal inisialisasi Supabase:', err);
      this.isConnected = false;
      this.notifyStatus('error', err.message || 'Gagal memuat pustaka Supabase');
      return false;
    }
  }

  // Putus koneksi & hapus konfigurasi lokal
  disconnect() {
    if (this.realtimeChannel) {
      try {
        this.client.removeChannel(this.realtimeChannel);
      } catch (e) {}
      this.realtimeChannel = null;
    }
    this.client = null;
    this.isConnected = false;
    this.config = { url: '', anonKey: '', source: 'none' };
    localStorage.removeItem('minepod_supabase_cfg');
    this.notifyStatus('offline', 'Koneksi diputus');
  }

  // Berlangganan perubahan Realtime
  subscribeRealtime() {
    if (!this.client || !this.isConnected) return;
    try {
      if (this.realtimeChannel) {
        this.client.removeChannel(this.realtimeChannel);
      }

      this.realtimeChannel = this.client
        .channel('minepod-realtime-all')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'episodes' }, payload => {
          this.notifyDataChange({ table: 'eps', payload });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'guests' }, payload => {
          this.notifyDataChange({ table: 'guests', payload });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'kpis' }, payload => {
          this.notifyDataChange({ table: 'kpi', payload });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'equipments' }, payload => {
          this.notifyDataChange({ table: 'eq', payload });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'risks' }, payload => {
          this.notifyDataChange({ table: 'risks', payload });
        })
        .subscribe(status => {
          console.log('[Supabase Realtime Status]:', status);
        });
    } catch (e) {
      console.warn('Realtime subscription error:', e);
    }
  }

  // ==========================================
  // METODE PENGAMBILAN DATA (FETCH ALL)
  // ==========================================

  async fetchAll() {
    if (!this.isConnected || !this.client) return null;

    try {
      const [epsRes, guestsRes, kpisRes, eqRes, risksRes] = await Promise.all([
        this.client.from('episodes').select('*').order('id', { ascending: true }),
        this.client.from('guests').select('*').order('id', { ascending: true }),
        this.client.from('kpis').select('*').order('m', { ascending: true }),
        this.client.from('equipments').select('*').order('id', { ascending: true }),
        this.client.from('risks').select('*').order('id', { ascending: true })
      ]);

      if (epsRes.error || guestsRes.error || kpisRes.error || eqRes.error || risksRes.error) {
        console.error('Error fetching tables from Supabase', { epsRes, guestsRes, kpisRes, eqRes, risksRes });
        return null;
      }

      // Normalisasi format kolom agar 100% kompatibel dengan state aplikasi
      const eps = (epsRes.data || []).map(r => ({
        id: Number(r.id),
        title: r.title || '',
        guest: r.guest || '',
        goal: r.goal || '',
        rec: r.rec || '',
        rel: r.rel || '',
        d: r.d || {}
      }));

      const guests = (guestsRes.data || []).map(r => ({
        id: Number(r.id),
        name: r.name || '',
        ep: Number(r.ep || 1),
        st: Number(r.st || 0)
      }));

      const kpi = (kpisRes.data || []).map(r => ({
        id: Number(r.id),
        m: r.m || '',
        v: r.v ?? '',
        r: r.r ?? '',
        i: r.i ?? '',
        s: r.s ?? '',
        l: r.l ?? ''
      }));

      const eq = (eqRes.data || []).map(r => ({
        id: Number(r.id),
        name: r.name || '',
        spec: r.spec || '',
        est: Number(r.est || 0),
        act: r.act === null || r.act === undefined ? '' : Number(r.act),
        st: Number(r.st || 0)
      }));

      const risks = (risksRes.data || []).map(r => ({
        id: Number(r.id),
        name: r.name || '',
        mit: r.mit || '',
        ok: Boolean(r.ok),
        note: r.note || ''
      }));

      return { eps, guests, kpi, eq, risks };
    } catch (err) {
      console.error('Failed to fetch all data from Supabase:', err);
      return null;
    }
  }

  // ==========================================
  // METODE SINKRONISASI SATUAN (UPSERT & DELETE)
  // ==========================================

  async upsertItem(table, item) {
    if (!this.isConnected || !this.client) return false;
    try {
      const payload = { ...item };
      // Pastikan format id numeric/bigint
      payload.id = Number(payload.id);
      payload.updated_at = new Date().toISOString();

      const { error } = await this.client
        .from(table)
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        console.error(`Error upserting into ${table}:`, error);
        return false;
      }
      return true;
    } catch (e) {
      console.error(`Exception upserting into ${table}:`, e);
      return false;
    }
  }

  async deleteItem(table, id) {
    if (!this.isConnected || !this.client) return false;
    try {
      const { error } = await this.client
        .from(table)
        .delete()
        .eq('id', Number(id));

      if (error) {
        console.error(`Error deleting from ${table}:`, error);
        return false;
      }
      return true;
    } catch (e) {
      console.error(`Exception deleting from ${table}:`, e);
      return false;
    }
  }

  // Inisialisasi awal seluruh seed data ke Supabase (berguna jika tabel masih kosong)
  async seedDatabase(seed) {
    if (!this.isConnected || !this.client) throw new Error('Supabase belum terhubung.');
    
    // Upsert episodes
    if (seed.eps?.length) {
      await this.client.from('episodes').upsert(seed.eps.map(x => ({
        id: Number(x.id),
        title: x.title,
        guest: x.guest,
        goal: x.goal,
        rec: x.rec,
        rel: x.rel,
        d: x.d || {}
      })));
    }

    // Upsert guests
    if (seed.guests?.length) {
      await this.client.from('guests').upsert(seed.guests.map(x => ({
        id: Number(x.id),
        name: x.name,
        ep: Number(x.ep),
        st: Number(x.st)
      })));
    }

    // Upsert equipments
    if (seed.eq?.length) {
      await this.client.from('equipments').upsert(seed.eq.map(x => ({
        id: Number(x.id),
        name: x.name,
        spec: x.spec,
        est: Number(x.est || 0),
        act: x.act === '' ? null : Number(x.act),
        st: Number(x.st || 0)
      })));
    }

    // Upsert risks
    if (seed.risks?.length) {
      await this.client.from('risks').upsert(seed.risks.map(x => ({
        id: Number(x.id),
        name: x.name,
        mit: x.mit,
        ok: Boolean(x.ok),
        note: x.note || ''
      })));
    }

    return true;
  }
}

export const supabaseManager = new SupabaseManager();
