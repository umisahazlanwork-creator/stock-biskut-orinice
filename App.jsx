import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Package, ArrowDownToLine, ArrowUpFromLine, History, Search, RefreshCw, Download, Plus, Boxes, AlertCircle } from 'lucide-react';

const PRODUCTS = [
'ALAMANDA RICE COOKIES','ALMOND LONDON','AMERICAN COOKIES','AWANA COOKIES','BISKUT BATIK',
'BISKUT BIJAN','BISKUT DAM','BISKUT GAJUS','BISKUT MAKMUR','CAPPUCINO BROWNISH COOKIES',
'COCONUTS COOKIES','COKLAT CRISPY COOKIES','CORNFLAKES KARISMA COOKIES','EZORES COOKIES',
'GREEN PEAS COOKIES','KUIH BANGKIT KLASIK','KUIH KAPIT CHOCOLATE','KUIH KAPIT PEANUT BUTTER',
'MAMA CAREY COOKIES','MARBLE COOKIES','PEANUT BUTTER COOKIES','PINOCIO COOKIES','RED VELVET COOKIES',
'ROLL OAT COOKIES','SEMPRIT COOKIES','SEMPRIT IDAMAN COOKIES','SEROJA COOKIES',
'SUCI DALAM DEBU COOKIES','SWEET MELODY COOKIES','TART NENAS'
];
const TYPES = ['BALANG 7000','BALANG 9503'];
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = url && key ? createClient(url, key) : null;
const demoKey = 'orinice-stock-demo-v1';

function readDemo() {
  try { return JSON.parse(localStorage.getItem(demoKey)) || {stock: [], movements: []}; }
  catch { return {stock: [], movements: []}; }
}
function seedDemo(data) {
  if (!data.stock.length) {
    data.stock = PRODUCTS.flatMap(product => TYPES.map(packaging => ({product, packaging, quantity: 0})));
    localStorage.setItem(demoKey, JSON.stringify(data));
  }
  return data;
}
const fmt = n => Number(n || 0).toLocaleString('ms-MY');

export default function App() {
  const [stock, setStock] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [packaging, setPackaging] = useState('SEMUA');
  const [tab, setTab] = useState('stock');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({product: PRODUCTS[0], packaging: TYPES[0], movement: 'MASUK', quantity: '1', staff: '', purpose: '', notes: ''});
  const connected = Boolean(supabase);

  async function load() {
    setLoading(true);
    if (supabase) {
      const [s, m] = await Promise.all([
        supabase.from('orinice_stock').select('*').order('product_name'),
        supabase.from('orinice_stock_movements').select('*').order('created_at', {ascending:false}).limit(500)
      ]);
      if (s.error || m.error) setNotice('Gagal membaca Supabase. Semak SQL, RLS dan tetapan .env.');
      else {
        setStock((s.data || []).map(x => ({product:x.product_name, packaging:x.packaging_type, quantity:Number(x.quantity)})));
        setMovements(m.data || []);
      }
    } else {
      const data = seedDemo(readDemo());
      setStock(data.stock); setMovements(data.movements);
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => stock.filter(s =>
    s.product.toLowerCase().includes(search.toLowerCase()) &&
    (packaging === 'SEMUA' || s.packaging === packaging)
  ), [stock, search, packaging]);
  const totalUnits = stock.reduce((n, s) => n + Number(s.quantity || 0), 0);
  const totalProducts = new Set(stock.map(s => s.product)).size;

  async function submitMovement(e) {
    e.preventDefault();
    const qty = Number(form.quantity);
    if (!Number.isInteger(qty) || qty <= 0) { setNotice('Kuantiti mesti nombor bulat lebih daripada 0.'); return; }
    if (!form.staff.trim()) { setNotice('Masukkan nama staff yang membuat transaksi.'); return; }
    const row = stock.find(s => s.product === form.product && s.packaging === form.packaging);
    if (!row) { setNotice('Rekod stok tidak ditemui.'); return; }
    if (form.movement === 'KELUAR' && row.quantity < qty) { setNotice(`Stok tidak mencukupi. Baki semasa: ${row.quantity}`); return; }
    const delta = form.movement === 'MASUK' ? qty : -qty;
    if (supabase) {
      const {error} = await supabase.rpc('orinice_record_stock_movement', {
        p_product_name: form.product, p_packaging_type: form.packaging,
        p_movement_type: form.movement, p_quantity: qty, p_staff_name: form.staff.trim(),
        p_purpose: form.purpose.trim() || null, p_notes: form.notes.trim() || null
      });
      if (error) { setNotice('Transaksi gagal: ' + error.message); return; }
    } else {
      const data = readDemo();
      data.stock = data.stock.map(s => s.product === form.product && s.packaging === form.packaging ? {...s, quantity:s.quantity + delta} : s);
      data.movements.unshift({id:crypto.randomUUID(), product_name:form.product, packaging_type:form.packaging, movement_type:form.movement, quantity:qty, staff_name:form.staff.trim(), purpose:form.purpose.trim(), notes:form.notes.trim(), created_at:new Date().toISOString()});
      localStorage.setItem(demoKey, JSON.stringify(data));
    }
    setNotice('Transaksi berjaya direkodkan.');
    setForm({...form, quantity:'1', purpose:'', notes:''});
    await load();
  }

  function exportCsv() {
    const rows = [['Produk','Kategori balang','Baki stok'], ...stock.map(s => [s.product,s.packaging,s.quantity])];
    const csv = rows.map(r => r.map(v => `"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], {type:'text/csv;charset=utf-8;'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'stok-biskut-orinice.csv'; a.click(); URL.revokeObjectURL(a.href);
  }

  return <div className="app">
    <header className="topbar"><div className="brand-icon"><Package size={28}/></div><div><div className="eyebrow">CTS PRODUCTION SDN BHD</div><h1>STOCK BISKUT <span>ORINICE</span></h1><p>Sistem rekod stok keluar masuk produk</p></div><div className="connection"><i className={connected?'online':'demo'}></i>{connected?'SUPABASE':'MOD DEMO'}</div></header>
    {!connected && <div className="banner"><AlertCircle size={18}/><span><b>Mod demo:</b> data hanya disimpan pada browser/peranti ini. Untuk perkongsian staff dan HQ, sambungkan Supabase menggunakan panduan README.</span></div>}
    {notice && <div className="notice"><span>{notice}</span><button onClick={()=>setNotice('')} aria-label="Tutup">×</button></div>}
    <section className="stats">
      <div className="stat-card"><div className="stat-icon red"><Boxes/></div><div><span>Jenis produk</span><strong>{totalProducts}</strong></div></div>
      <div className="stat-card"><div className="stat-icon gold"><Package/></div><div><span>Jumlah unit dalam stok</span><strong>{fmt(totalUnits)}</strong></div></div>
      <div className="stat-card"><div className="stat-icon green"><History/></div><div><span>Transaksi direkod</span><strong>{movements.length}</strong></div></div>
    </section>
    <nav className="tabs"><button className={tab==='stock'?'active':''} onClick={()=>setTab('stock')}><Boxes size={17}/> Baki stok</button><button className={tab==='movement'?'active':''} onClick={()=>setTab('movement')}><ArrowDownToLine size={17}/> Rekod transaksi</button><button className={tab==='history'?'active':''} onClick={()=>setTab('history')}><History size={17}/> Sejarah</button></nav>
    {tab==='stock' && <section className="panel"><div className="panel-head"><div><h2>Baki stok produk</h2><p>Stok dipisahkan mengikut jenis balang.</p></div><button className="outline-btn" onClick={exportCsv}><Download size={16}/> Export CSV</button></div>
      <div className="filters"><label className="search"><Search size={17}/><input placeholder="Cari nama biskut..." value={search} onChange={e=>setSearch(e.target.value)}/></label><select value={packaging} onChange={e=>setPackaging(e.target.value)}><option value="SEMUA">Semua jenis balang</option>{TYPES.map(t=><option key={t}>{t}</option>)}</select><button className="icon-btn" onClick={load} title="Muat semula"><RefreshCw size={17}/></button></div>
      <div className="table-wrap"><table><thead><tr><th>#</th><th>Nama produk</th><th>Jenis ready stock</th><th className="right">Baki stok</th></tr></thead><tbody>{filtered.map((s,i)=><tr key={s.product+s.packaging}><td className="muted">{i+1}</td><td className="product-name">{s.product}</td><td><span className={'pill '+(s.packaging===TYPES[0]?'pill-red':'pill-gold')}>{s.packaging}</span></td><td className="right qty">{fmt(s.quantity)}</td></tr>)}</tbody></table>{!filtered.length && <div className="empty">Tiada produk ditemui.</div>}</div><p className="footnote">Jumlah baris: {filtered.length}. Semua baki awal ditetapkan kepada 0 sehingga stok sebenar direkodkan.</p>
    </section>}
    {tab==='movement' && <section className="panel form-panel"><div className="panel-head"><div><h2>Rekod stok keluar / masuk</h2><p>Setiap transaksi akan mengemas kini baki stok.</p></div></div>
      <form onSubmit={submitMovement} className="movement-form">
        <div className="field full"><label>Jenis transaksi</label><div className="choice"><button type="button" className={form.movement==='MASUK'?'selected in':''} onClick={()=>setForm({...form,movement:'MASUK'})}><ArrowDownToLine size={18}/> Stok masuk</button><button type="button" className={form.movement==='KELUAR'?'selected out':''} onClick={()=>setForm({...form,movement:'KELUAR'})}><ArrowUpFromLine size={18}/> Stok keluar</button></div></div>
        <div className="field"><label>Nama produk *</label><select value={form.product} onChange={e=>setForm({...form,product:e.target.value})}>{PRODUCTS.map(p=><option key={p}>{p}</option>)}</select></div>
        <div className="field"><label>Jenis ready stock *</label><select value={form.packaging} onChange={e=>setForm({...form,packaging:e.target.value})}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
        <div className="field"><label>Kuantiti (unit) *</label><input type="number" min="1" step="1" required value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})}/></div>
        <div className="field"><label>Nama staff *</label><input required placeholder="Nama staff" value={form.staff} onChange={e=>setForm({...form,staff:e.target.value})}/></div>
        <div className="field full"><label>Tujuan / rujukan</label><input placeholder="Contoh: Penghantaran Mydin, order pelanggan" value={form.purpose} onChange={e=>setForm({...form,purpose:e.target.value})}/></div>
        <div className="field full"><label>Catatan (pilihan)</label><textarea rows="3" placeholder="Catatan tambahan..." value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
        <button className="submit-btn" type="submit"><Plus size={18}/> Simpan transaksi</button>
      </form>
    </section>}
    {tab==='history' && <section className="panel"><div className="panel-head"><div><h2>Sejarah transaksi</h2><p>Rekod transaksi terkini.</p></div><button className="icon-btn" onClick={load}><RefreshCw size={17}/></button></div><div className="table-wrap"><table><thead><tr><th>Tarikh / masa</th><th>Produk</th><th>Balang</th><th>Jenis</th><th className="right">Kuantiti</th><th>Staff</th><th>Tujuan</th></tr></thead><tbody>{movements.map(m=><tr key={m.id}><td>{new Date(m.created_at).toLocaleString('ms-MY')}</td><td className="product-name">{m.product_name}</td><td>{m.packaging_type}</td><td><span className={'pill '+(m.movement_type==='MASUK'?'pill-green':'pill-red')}>{m.movement_type}</span></td><td className="right qty">{fmt(m.quantity)}</td><td>{m.staff_name}</td><td>{m.purpose||'—'}</td></tr>)}</tbody></table>{!movements.length && <div className="empty">Belum ada transaksi.</div>}</div></section>}
    <footer>ORINICE · CTS PRODUCTION SDN BHD <span>•</span> Pengurusan stok produk biskut</footer>
  </div>;
}