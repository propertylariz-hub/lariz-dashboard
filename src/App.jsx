import { useState, useEffect, useRef, useCallback } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const GAS_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";

const USERS = {
  admin: { password:"admin123", role:"admin", label:"Admin",  color:"#6366F1", avatar:"AD" },
  aris:  { password:"aris123",  role:"agen",  label:"Aris",   color:"#22D3EE", avatar:"AR", feeField:"aris",  savingField:"savingAris"  },
  argo:  { password:"argo123",  role:"agen",  label:"Argo",   color:"#F59E0B", avatar:"AG", feeField:"argo",  savingField:"savingArgo"  },
  darma: { password:"darma123", role:"agen",  label:"Darma",  color:"#A78BFA", avatar:"DA", feeField:"darma", savingField:"savingDarma" },
};

const AGENTS = [
  { id:"aris",  label:"Aris",  color:"#22D3EE", feeField:"aris",  savingField:"savingAris",  pct:22.5, savingPct:10, wa:"6281516072070",  waDisplay:"0815-1607-207"  },
  { id:"argo",  label:"Argo",  color:"#F59E0B", feeField:"argo",  savingField:"savingArgo",  pct:22.5, savingPct:10, wa:"6281241735380",  waDisplay:"0812-4173-5380" },
  { id:"darma", label:"Darma", color:"#A78BFA", feeField:"darma", savingField:"savingDarma", pct:15,   savingPct:10, wa:"6285920000152",  waDisplay:"0859-2000-0152" },
];

const TEAM_PCT = { bdb:0.40, aris:0.225, argo:0.225, darma:0.15 };
const BDB_PCT  = { operasional:0.70, savingAris:0.10, savingArgo:0.10, savingDarma:0.10 };

// ─── DEMO DATA ────────────────────────────────────────────────────────────────
const DEMO_TRANS = [
  { id:"t1", type:"fee",      tanggal:"2026-03-06", namaDev:"MG_6",  namaKonsumen:"SELVI",  feeLariz:29250000, promo:0,       feeAgentBT:8000000,  netCommission:21250000, bdb:8500000,  aris:4781250, argo:4781250, darma:3187500, opBdb:5950000, savingAris:850000,  savingArgo:850000,  savingDarma:850000,  keterangan:"" },
  { id:"t2", type:"fee",      tanggal:"2026-02-18", namaDev:"GR_2",  namaKonsumen:"BUDI S.", feeLariz:35000000, promo:500000,  feeAgentBT:0,        netCommission:34500000, bdb:13800000, aris:7762500, argo:7762500, darma:5175000, opBdb:9660000, savingAris:1380000, savingArgo:1380000, savingDarma:1380000, keterangan:"" },
  { id:"t3", type:"fee",      tanggal:"2026-01-30", namaDev:"PD_11", namaKonsumen:"SARI W.", feeLariz:22000000, promo:0,       feeAgentBT:5000000,  netCommission:17000000, bdb:6800000,  aris:3825000, argo:3825000, darma:2550000, opBdb:4760000, savingAris:680000,  savingArgo:680000,  savingDarma:680000,  keterangan:"" },
  { id:"t4", type:"fee",      tanggal:"2025-12-20", namaDev:"BT_7",  namaKonsumen:"RINA H.", feeLariz:18500000, promo:0,       feeAgentBT:0,        netCommission:18500000, bdb:7400000,  aris:4162500, argo:4162500, darma:2775000, opBdb:5180000, savingAris:740000,  savingArgo:740000,  savingDarma:740000,  keterangan:"" },
  { id:"t5", type:"fee",      tanggal:"2025-11-15", namaDev:"KM_4",  namaKonsumen:"DODI P.", feeLariz:41000000, promo:1000000, feeAgentBT:3000000,  netCommission:37000000, bdb:14800000, aris:8325000, argo:8325000, darma:5550000, opBdb:10360000,savingAris:1480000, savingArgo:1480000, savingDarma:1480000, keterangan:"" },
  { id:"w1", type:"withdraw", tanggal:"2026-03-01", agent:"aris",  jumlah:3000000,  keterangan:"Tarik saving Maret" },
  { id:"w2", type:"withdraw", tanggal:"2026-02-01", agent:"argo",  jumlah:2500000,  keterangan:"Tarik saving Feb" },
  { id:"p1", type:"promo",    tanggal:"2026-03-10", keterangan:"ATK & Operasional Kantor", jumlah:450000 },
  { id:"p2", type:"promo",    tanggal:"2026-02-25", keterangan:"Print Brosur", jumlah:200000 },
];

// ─── UTILS ────────────────────────────────────────────────────────────────────
const rp    = (n) => "Rp\u00A0" + Math.round(n||0).toString().replace(/\B(?=(\d{3})+(?!\d))/g,".");
const rpS   = (n) => { n=Math.round(n||0); if(n>=1e9) return "Rp\u00A0"+(n/1e9).toFixed(1)+"M"; if(n>=1e6) return "Rp\u00A0"+(n/1e6).toFixed(1)+"jt"; return rp(n); };
const fmtDate=(s)=>{ if(!s) return "-"; const d=new Date(s); return isNaN(d)?s:d.toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"}); };
const parseMoney=(s)=>parseFloat(String(s).replace(/[^0-9]/g,""))||0;
const toMoneyStr=(n)=>n?Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,".") : "";

const calcFee=(fee,promo,feeAgentBT)=>{
  const net=fee-promo-feeAgentBT;
  const bdb=net*TEAM_PCT.bdb, aris=net*TEAM_PCT.aris, argo=net*TEAM_PCT.argo, darma=net*TEAM_PCT.darma;
  return { fee, promo, feeAgentBT, net, bdb, aris, argo, darma,
    opBdb:bdb*BDB_PCT.operasional, savingAris:bdb*BDB_PCT.savingAris,
    savingArgo:bdb*BDB_PCT.savingArgo, savingDarma:bdb*BDB_PCT.savingDarma };
};

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const G = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body{background:#05070E;color:#E2E8F0;font-family:'Plus Jakarta Sans',sans-serif;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
  @keyframes pulse2{0%,100%{opacity:.7}50%{opacity:.3}}
  @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-7px)}40%,80%{transform:translateX(7px)}}
  @keyframes slideIn{from{opacity:0;transform:translateX(100%)}to{opacity:1;transform:translateX(0)}}
  @keyframes countUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:#1E293B;border-radius:2px}
  input,textarea,button,select{font-family:'Plus Jakarta Sans',sans-serif;}
  input[type=date]::-webkit-calendar-picker-indicator{filter:invert(.4);}
  .row-hover:hover{background:rgba(99,102,241,.05)!important;}
  .btn-ghost:hover{opacity:.8;transform:translateY(-1px);}
  .nav-item:hover{background:rgba(255,255,255,.05)!important;}
`;

// ─── ANIMATED NUMBER ──────────────────────────────────────────────────────────
function AnimNum({ value, prefix="Rp\u00A0", duration=700 }) {
  const [disp,setDisp]=useState(0); const r=useRef();
  useEffect(()=>{
    const prev=disp, diff=value-prev, t0=performance.now();
    const go=now=>{
      const p=Math.min((now-t0)/duration,1), e=1-Math.pow(1-p,3);
      setDisp(Math.round(prev+diff*e));
      if(p<1) r.current=requestAnimationFrame(go);
    };
    r.current=requestAnimationFrame(go);
    return()=>cancelAnimationFrame(r.current);
  },[value]);
  return <>{prefix}{disp.toString().replace(/\B(?=(\d{3})+(?!\d))/g,".")}</>;
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function Toast({items, onRemove}) {
  return (
    <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,display:"flex",flexDirection:"column",gap:8}}>
      {items.map(t=>(
        <div key={t.id} onClick={()=>onRemove(t.id)} style={{
          background:t.type==="success"?"#052E16":t.type==="error"?"#450A0A":"#0C1A2E",
          border:`1px solid ${t.type==="success"?"#16A34A":t.type==="error"?"#DC2626":"#2563EB"}`,
          color:t.type==="success"?"#4ADE80":t.type==="error"?"#F87171":"#93C5FD",
          padding:"11px 18px",borderRadius:10,fontSize:13,fontWeight:600,
          cursor:"pointer",animation:"slideIn .3s ease",minWidth:260,
          boxShadow:"0 8px 32px rgba(0,0,0,.5)",
        }}>
          {t.type==="success"?"✓":t.type==="error"?"✕":"ℹ"}&nbsp;&nbsp;{t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
function Modal({title,onClose,children,width=480}) {
  return (
    <div style={{position:"fixed",inset:0,zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,
      background:"rgba(0,0,0,.7)",backdropFilter:"blur(8px)",animation:"fadeIn .2s ease"}} onClick={onClose}>
      <div style={{width:"100%",maxWidth:width,background:"#0D1117",border:"1px solid rgba(255,255,255,.1)",
        borderRadius:20,padding:28,boxShadow:"0 24px 80px rgba(0,0,0,.7)",animation:"fadeUp .25s ease"}}
        onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,letterSpacing:".12em",color:"#E2E8F0"}}>{title}</div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,.06)",border:"none",color:"#64748B",
            width:28,height:28,borderRadius:7,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login({onLogin}) {
  const [u,setU]=useState(""); const [p,setP]=useState(""); const [show,setShow]=useState(false);
  const [err,setErr]=useState(""); const [shake,setShake]=useState(false); const [loading,setLoading]=useState(false);

  const submit=()=>{
    setLoading(true);
    setTimeout(()=>{
      const user=USERS[u.toLowerCase().trim()];
      if(user && user.password===p){ onLogin({username:u.toLowerCase().trim(),...user}); }
      else { setErr("Username atau password salah."); setShake(true); setTimeout(()=>setShake(false),500); }
      setLoading(false);
    },600);
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20,
      background:"radial-gradient(ellipse 120% 80% at 50% -10%,rgba(99,102,241,.12) 0%,transparent 60%),#05070E"}}>
      <style>{G}</style>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",
        backgroundImage:"linear-gradient(rgba(99,102,241,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.03) 1px,transparent 1px)",
        backgroundSize:"56px 56px"}}/>
      <div style={{width:"100%",maxWidth:400,animation:"fadeUp .5s ease",position:"relative"}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{display:"inline-flex",width:80,height:80,borderRadius:20,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.1)",alignItems:"center",justifyContent:"center",marginBottom:16,overflow:"hidden",boxShadow:"0 0 50px rgba(99,102,241,.2)"}}><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj3D3dP2IHvCsgRuzkl9XRJDsb-Ttc98DnL3Y7EW7L_lnNNtw0qfrGpro_F9PEmt0Xz-SCxs2gWBVbYme0XCshjAGD5YGAfdW7JUq5lrlMn2hu_ynIL7oSVRppEcyICy7qY7A9iBY4k2d8igPSjL8UU12uQPmrsRGVAdUs4CCJMZlhCfVeOtvpF3yHvLcs8/s300/3.png" alt="Lariz Property" style={{width:76,height:76,objectFit:"contain"}}/></div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:32,letterSpacing:".2em",color:"#F1F5F9"}}>LARIZ PROPERTY</div>
          <div style={{fontSize:11,color:"#334155",letterSpacing:".2em",marginTop:4}}>FEE MANAGEMENT SYSTEM</div>
        </div>
        <div style={{background:"rgba(255,255,255,.025)",border:"1px solid rgba(255,255,255,.07)",borderRadius:20,
          padding:28,backdropFilter:"blur(20px)",boxShadow:"0 24px 60px rgba(0,0,0,.4)",
          animation:shake?"shake .4s ease":"none"}}>
          <p style={{fontSize:14,fontWeight:600,color:"#64748B",marginBottom:20}}>Masuk ke Akun</p>
          <div style={{marginBottom:14}}>
            <label style={S.lbl}>Username</label>
            <input value={u} onChange={e=>{setU(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&submit()}
              placeholder="admin / aris / argo / darma"
              style={{...S.inp,borderColor:err?"rgba(248,113,113,.4)":"rgba(255,255,255,.08)"}}/>
          </div>
          <div style={{marginBottom:6}}>
            <label style={S.lbl}>Password</label>
            <div style={{position:"relative"}}>
              <input type={show?"text":"password"} value={p} onChange={e=>{setP(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&submit()}
                placeholder="••••••••"
                style={{...S.inp,paddingRight:40,borderColor:err?"rgba(248,113,113,.4)":"rgba(255,255,255,.08)"}}/>
              <button onClick={()=>setShow(x=>!x)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",
                background:"none",border:"none",cursor:"pointer",fontSize:15,opacity:.5}}>{show?"🙈":"👁️"}</button>
            </div>
          </div>
          <div style={{height:20,marginBottom:16}}>{err&&<p style={{fontSize:12,color:"#F87171"}}>{err}</p>}</div>
          <button onClick={submit} disabled={loading} style={{width:"100%",padding:"12px",borderRadius:11,border:"none",
            background:loading?"#1E293B":"linear-gradient(135deg,#6366F1,#4F46E5)",
            color:loading?"#475569":"#fff",fontSize:14,fontWeight:700,cursor:loading?"not-allowed":"pointer",
            boxShadow:loading?"none":"0 4px 20px rgba(99,102,241,.4)",transition:"all .2s"}}>
            {loading?<span style={{animation:"pulse2 1s infinite",display:"inline-block"}}>Memverifikasi...</span>:"Masuk →"}
          </button>
          <div style={{marginTop:18,padding:"12px 14px",background:"rgba(255,255,255,.02)",borderRadius:10,border:"1px solid rgba(255,255,255,.04)"}}>
            <p style={{fontSize:10,color:"#334155",marginBottom:6,letterSpacing:".08em"}}>AKUN TERSEDIA</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {Object.entries(USERS).map(([k,v])=>(
                <span key={k} onClick={()=>{setU(k);setP(v.password);setErr("");}}
                  style={{padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:700,
                    background:`${v.color}15`,color:v.color,border:`1px solid ${v.color}30`,cursor:"pointer"}}>
                  {v.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── WITHDRAW MODAL ───────────────────────────────────────────────────────────
function WithdrawModal({agent, saldo, onConfirm, onClose}) {
  const [step, setStep]       = useState(1); // 1=form, 2=bukti, 3=kirim
  const [jumlah, setJumlah]   = useState("");
  const [ket, setKet]         = useState("");
  const [bukti, setBukti]     = useState(null);   // { file, url, name }
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const num   = parseMoney(jumlah);
  const valid = num > 0 && num <= saldo;

  const tgl = new Date().toLocaleDateString("id-ID", {day:"2-digit", month:"long", year:"numeric"});
  const nominalFmt = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  const waText = encodeURIComponent(
    `Halo *${agent.label}* 👋\n\n` +
    `Admin Lariz Property telah memproses *penarikan tabungan* kamu.\n\n` +
    `📅 Tanggal  : ${tgl}\n` +
    `👤 Agen     : ${agent.label}\n` +
    `💰 Nominal  : Rp ${nominalFmt}\n` +
    `📝 Ket      : ${ket || "Tarik tabungan"}\n\n` +
    `Bukti transfer terlampir. Silakan cek rekening kamu ya 🙏\n\n` +
    `_Lariz Property_`
  );

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setBukti({ file, url, name: file.name });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setBukti({ file, url, name: file.name });
  };

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm({ agent: agent.id, jumlah: num, keterangan: ket || `Tarik tabungan ${agent.label}` });
    setLoading(false);
    setStep(3);
  };

  const handleSendWA = () => {
    window.open(`https://wa.me/${agent.wa}?text=${waText}`, "_blank");
  };

  const STEPS = ["Form", "Bukti Transfer", "Kirim WA"];

  return (
    <Modal title={`TARIK TABUNGAN — ${agent.label.toUpperCase()}`} onClose={onClose} width={500}>

      {/* Step indicator */}
      <div style={{display:"flex",alignItems:"center",marginBottom:22,gap:0}}>
        {STEPS.map((s, i) => {
          const done  = step > i + 1;
          const active = step === i + 1;
          return (
            <div key={s} style={{display:"flex",alignItems:"center",flex: i < STEPS.length-1 ? 1 : "none"}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <div style={{width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:12,fontWeight:700,transition:"all .25s",
                  background: done ? "#22C55E" : active ? agent.color : "rgba(255,255,255,.06)",
                  color: done||active ? "#000" : "#334155",
                  border: `2px solid ${done?"#22C55E":active?agent.color:"rgba(255,255,255,.1)"}`,
                  boxShadow: active ? `0 0 12px ${agent.color}50` : "none"}}>
                  {done ? "✓" : i + 1}
                </div>
                <span style={{fontSize:9,fontWeight:600,color:active?agent.color:done?"#22C55E":"#334155",
                  letterSpacing:".06em",textTransform:"uppercase",whiteSpace:"nowrap"}}>{s}</span>
              </div>
              {i < STEPS.length-1 && (
                <div style={{flex:1,height:2,margin:"0 6px",marginBottom:14,borderRadius:1,
                  background: done ? "#22C55E" : "rgba(255,255,255,.06)",transition:"background .3s"}}/>
              )}
            </div>
          );
        })}
      </div>

      {/* Saldo chip */}
      <div style={{marginBottom:18,padding:"12px 16px",background:`${agent.color}0C`,border:`1px solid ${agent.color}22`,
        borderRadius:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <p style={{fontSize:10,color:"#475569",letterSpacing:".08em",marginBottom:3}}>SALDO TERSEDIA</p>
          <p style={{fontFamily:"'DM Mono',monospace",fontSize:20,fontWeight:700,color:agent.color}}>{rp(saldo)}</p>
        </div>
        <div style={{padding:"4px 10px",borderRadius:99,fontSize:11,fontWeight:700,
          background:`${agent.color}18`,color:agent.color,border:`1px solid ${agent.color}30`}}>{agent.label}</div>
      </div>

      {/* ── STEP 1: FORM ── */}
      {step === 1 && (
        <div style={{animation:"fadeUp .2s ease"}}>
          <div style={{marginBottom:14}}>
            <label style={S.lbl}>Jumlah Tarik (Rp)</label>
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",
                fontSize:12,color:"#475569",fontFamily:"'DM Mono',monospace",fontWeight:600}}>Rp</span>
              <input value={jumlah}
                onChange={e => { const r=e.target.value.replace(/\D/g,""); setJumlah(r?parseInt(r).toString().replace(/\B(?=(\d{3})+(?!\d))/g,"."):""  ); }}
                style={{...S.inp, paddingLeft:32, fontSize:15, fontFamily:"'DM Mono',monospace", fontWeight:700,
                  borderColor: num>saldo?"rgba(248,113,113,.5)":num>0?`${agent.color}50`:"rgba(255,255,255,.09)"}}
                placeholder="0"/>
            </div>
            {num > saldo && <p style={{fontSize:11,color:"#F87171",marginTop:5}}>⚠ Melebihi saldo ({rp(saldo)})</p>}
            {num > 0 && num <= saldo && <p style={{fontSize:11,color:"#34D399",marginTop:5}}>✓ Sisa setelah tarik: {rp(saldo-num)}</p>}
          </div>
          <div style={{marginBottom:20}}>
            <label style={S.lbl}>Keterangan</label>
            <input value={ket} onChange={e=>setKet(e.target.value)} style={S.inp} placeholder={`Tarik tabungan ${agent.label}...`}/>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={onClose} style={{flex:1,padding:"11px",borderRadius:10,
              border:"1px solid rgba(255,255,255,.1)",background:"transparent",color:"#64748B",fontSize:13,fontWeight:600,cursor:"pointer"}}>Batal</button>
            <button onClick={()=>setStep(2)} disabled={!valid} style={{flex:2,padding:"11px",borderRadius:10,border:"none",
              background:valid?`linear-gradient(135deg,${agent.color},${agent.color}CC)`:"#1E293B",
              color:valid?"#000":"#334155",fontSize:13,fontWeight:700,cursor:valid?"pointer":"not-allowed",
              boxShadow:valid?`0 4px 16px ${agent.color}30`:"none",transition:"all .2s"}}>
              Lanjut → Upload Bukti
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: UPLOAD BUKTI ── */}
      {step === 2 && (
        <div style={{animation:"fadeUp .2s ease"}}>
          {/* Ringkasan nominal */}
          <div style={{marginBottom:16,padding:"10px 14px",background:"rgba(255,255,255,.03)",
            border:"1px solid rgba(255,255,255,.07)",borderRadius:10,display:"flex",justifyContent:"space-between"}}>
            <span style={{fontSize:12,color:"#64748B"}}>Nominal transfer</span>
            <span style={{fontFamily:"'DM Mono',monospace",fontWeight:700,color:agent.color,fontSize:14}}>{rp(num)}</span>
          </div>

          <label style={S.lbl}>Upload Bukti Transfer</label>

          {/* Drop zone */}
          <div
            onDrop={handleDrop} onDragOver={e=>e.preventDefault()}
            onClick={()=>fileRef.current.click()}
            style={{
              border:`2px dashed ${bukti?agent.color:"rgba(255,255,255,.1)"}`,
              borderRadius:12, padding:"20px 16px", textAlign:"center",
              cursor:"pointer", transition:"all .2s", marginBottom:14,
              background: bukti ? `${agent.color}07` : "rgba(255,255,255,.02)",
            }}
            onMouseEnter={e=>{ if(!bukti) e.currentTarget.style.borderColor="rgba(255,255,255,.2)"; }}
            onMouseLeave={e=>{ if(!bukti) e.currentTarget.style.borderColor="rgba(255,255,255,.1)"; }}
          >
            <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleFile} style={{display:"none"}}/>
            {bukti ? (
              <div>
                {bukti.file.type.startsWith("image/") ? (
                  <img src={bukti.url} alt="bukti"
                    style={{maxHeight:160,maxWidth:"100%",borderRadius:8,marginBottom:8,objectFit:"contain"}}/>
                ) : (
                  <div style={{fontSize:36,marginBottom:8}}>📄</div>
                )}
                <p style={{fontSize:12,color:agent.color,fontWeight:600}}>{bukti.name}</p>
                <p style={{fontSize:11,color:"#475569",marginTop:4}}>Klik untuk ganti file</p>
              </div>
            ) : (
              <div>
                <div style={{fontSize:36,marginBottom:8,opacity:.4}}>📸</div>
                <p style={{fontSize:13,color:"#64748B",fontWeight:500}}>Klik atau drag foto bukti transfer</p>
                <p style={{fontSize:11,color:"#334155",marginTop:4}}>JPG, PNG, PDF — maks 10MB</p>
              </div>
            )}
          </div>

          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setStep(1)} style={{flex:1,padding:"11px",borderRadius:10,
              border:"1px solid rgba(255,255,255,.1)",background:"transparent",color:"#64748B",fontSize:13,fontWeight:600,cursor:"pointer"}}>← Kembali</button>
            <button onClick={handleConfirm} disabled={!bukti||loading} style={{flex:2,padding:"11px",borderRadius:10,border:"none",
              background:bukti&&!loading?`linear-gradient(135deg,${agent.color},${agent.color}CC)`:"#1E293B",
              color:bukti&&!loading?"#000":"#334155",fontSize:13,fontWeight:700,
              cursor:bukti&&!loading?"pointer":"not-allowed",transition:"all .2s",
              boxShadow:bukti&&!loading?`0 4px 16px ${agent.color}30`:"none"}}>
              {loading ? "⏳ Memproses..." : "✓ Konfirmasi & Simpan"}
            </button>
          </div>
          {!bukti && (
            <p style={{textAlign:"center",fontSize:11,color:"#334155",marginTop:10}}>
              Upload bukti transfer wajib sebelum konfirmasi
            </p>
          )}
        </div>
      )}

      {/* ── STEP 3: KIRIM WA ── */}
      {step === 3 && (
        <div style={{animation:"fadeUp .2s ease",textAlign:"center"}}>
          {/* Sukses badge */}
          <div style={{width:64,height:64,borderRadius:"50%",background:"rgba(34,197,94,.15)",
            border:"2px solid #22C55E",display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:28,margin:"0 auto 16px",boxShadow:"0 0 30px rgba(34,197,94,.25)"}}>✓</div>
          <p style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:".1em",color:"#E2E8F0",marginBottom:4}}>Transfer Berhasil Dicatat!</p>
          <p style={{fontSize:13,color:"#475569",marginBottom:20}}>Sekarang kirim notifikasi ke {agent.label} via WhatsApp</p>

          {/* Preview pesan */}
          <div style={{marginBottom:20,padding:"14px 16px",background:"rgba(37,211,102,.06)",
            border:"1px solid rgba(37,211,102,.2)",borderRadius:12,textAlign:"left"}}>
            <p style={{fontSize:10,color:"#475569",letterSpacing:".08em",marginBottom:10}}>PREVIEW PESAN WA ke {agent.label}</p>
            <div style={{fontSize:12,color:"#94A3B8",lineHeight:1.75,fontFamily:"'DM Mono',monospace",whiteSpace:"pre-wrap"}}>
              {`Halo `}<strong style={{color:"#E2E8F0"}}>{agent.label}</strong>{` 👋

Admin Lariz Property telah memproses `}<strong style={{color:agent.color}}>penarikan tabungan</strong>{` kamu.

📅 Tanggal  : ${tgl}
👤 Agen     : ${agent.label}
💰 Nominal  : `}<strong style={{color:agent.color}}>{`Rp ${nominalFmt}`}</strong>{`
📝 Ket      : ${ket||"Tarik tabungan"}

Bukti transfer terlampir 🙏`}
            </div>
          </div>

          {/* Bukti thumbnail */}
          {bukti && bukti.file.type.startsWith("image/") && (
            <div style={{marginBottom:16,padding:8,background:"rgba(255,255,255,.03)",borderRadius:10,border:"1px solid rgba(255,255,255,.07)"}}>
              <p style={{fontSize:10,color:"#334155",marginBottom:8,letterSpacing:".06em"}}>BUKTI TRANSFER</p>
              <img src={bukti.url} alt="bukti" style={{maxHeight:120,maxWidth:"100%",borderRadius:6,objectFit:"contain"}}/>
              <p style={{fontSize:10,color:"#334155",marginTop:6}}>{bukti.name}</p>
            </div>
          )}

          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {/* WA Button */}
            <button onClick={handleSendWA} style={{
              width:"100%",padding:"14px",borderRadius:12,border:"none",
              background:"linear-gradient(135deg,#25D366,#128C7E)",
              color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",gap:10,
              boxShadow:"0 4px 24px rgba(37,211,102,.4)",transition:"all .2s"}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.531 5.845L.057 23.55a.75.75 0 0 0 .916.919l5.808-1.453A11.946 11.946 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.75 9.75 0 0 1-4.96-1.36l-.355-.212-3.684.921.958-3.591-.232-.37A9.75 9.75 0 1 1 12 21.75z"/>
              </svg>
              Kirim Notifikasi ke {agent.label}
            </button>
            <p style={{fontSize:11,color:"#1E293B"}}>{agent.waDisplay} · WhatsApp {agent.label}</p>
            <button onClick={onClose} style={{width:"100%",padding:"10px",borderRadius:10,
              border:"1px solid rgba(255,255,255,.08)",background:"transparent",
              color:"#475569",fontSize:12,fontWeight:600,cursor:"pointer"}}>Tutup</button>
          </div>
        </div>
      )}
    </Modal>
  );
}


// ─── ADMIN DASHBOARD ─────────────────────────────────────────────────────────
function AdminDashboard({user, onLogout}) {
  const [tab,setTab]=useState("overview");
  const [data,setData]=useState(DEMO_TRANS);
  const [loading,setLoading]=useState(false);
  const [toasts,setToasts]=useState([]);
  const [withdrawModal,setWithdrawModal]=useState(null); // agent obj
  const [filterAgent,setFilterAgent]=useState("all");

  // Form: Input Fee
  const [feeForm,setFeeForm]=useState({namaDev:"",namaKonsumen:"",tanggal:new Date().toISOString().split("T")[0],feeLariz:"",promo:"",feeAgentBT:"",keterangan:""});
  const [savingFee,setSavingFee]=useState(false);

  // Form: Input Promo
  const [promoForm,setPromoForm]=useState({tanggal:new Date().toISOString().split("T")[0],keterangan:"",jumlah:""});
  const [savingPromo,setSavingPromo]=useState(false);

  const addToast=(msg,type="success")=>{
    const id=Date.now();
    setToasts(t=>[...t,{id,msg,type}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3500);
  };

  // ─ Computed values ─
  const feeRecords    = data.filter(r=>r.type==="fee");
  const promoRecords  = data.filter(r=>r.type==="promo");
  const withdrawRecs  = data.filter(r=>r.type==="withdraw");

  const totalFeeIn   = feeRecords.reduce((s,r)=>s+(parseFloat(r.feeLariz)||0),0);
  const totalNetComm = feeRecords.reduce((s,r)=>s+(parseFloat(r.netCommission)||0),0);
  const totalPromoOut= promoRecords.reduce((s,r)=>s+(parseFloat(r.jumlah)||0),0);
  const totalWithdraw= withdrawRecs.reduce((s,r)=>s+(parseFloat(r.jumlah)||0),0);

  // Saldo agen = total saving dari fee - withdraw
  const agentSaldo = AGENTS.map(ag=>{
    const totalSaving = feeRecords.reduce((s,r)=>s+(parseFloat(r[ag.savingField])||0),0);
    const totalOut    = withdrawRecs.filter(w=>w.agent===ag.id).reduce((s,r)=>s+(parseFloat(r.jumlah)||0),0);
    return { ...ag, totalSaving, totalOut, saldo: totalSaving-totalOut };
  });

  const totalSaldoAll = agentSaldo.reduce((s,a)=>s+a.saldo,0);

  // Preview kalkulasi fee
  const feeNums = { fee:parseMoney(feeForm.feeLariz), promo:parseMoney(feeForm.promo), feeAgentBT:parseMoney(feeForm.feeAgentBT) };
  const feeCalc = calcFee(feeNums.fee, feeNums.promo, feeNums.feeAgentBT);

  const setMoney=(form,setter,field)=>(e)=>{
    const raw=e.target.value.replace(/\D/g,"");
    setter(f=>({...f,[field]:raw?parseInt(raw).toString().replace(/\B(?=(\d{3})+(?!\d))/g,"."):""  }));
  };

  // Save fee
  const saveFee=async()=>{
    if(!feeForm.namaDev||!feeForm.feeLariz){addToast("Nama Dev & Fee Lariz wajib diisi!","error");return;}
    setSavingFee(true);
    const newRec={id:"t"+Date.now(),type:"fee",tanggal:feeForm.tanggal,namaDev:feeForm.namaDev,
      namaKonsumen:feeForm.namaKonsumen,...feeCalc,keterangan:feeForm.keterangan};
    try {
      await fetch(GAS_URL,{method:"POST",body:JSON.stringify({action:"addFee",...newRec})});
    } catch{}
    setData(d=>[newRec,...d]);
    setFeeForm({namaDev:"",namaKonsumen:"",tanggal:new Date().toISOString().split("T")[0],feeLariz:"",promo:"",feeAgentBT:"",keterangan:""});
    addToast("Fee berhasil disimpan!");
    setSavingFee(false); setTab("overview");
  };

  // Save promo
  const savePromo=async()=>{
    if(!promoForm.keterangan||!promoForm.jumlah){addToast("Keterangan & jumlah wajib diisi!","error");return;}
    setSavingPromo(true);
    const newRec={id:"p"+Date.now(),type:"promo",tanggal:promoForm.tanggal,
      keterangan:promoForm.keterangan,jumlah:parseMoney(promoForm.jumlah)};
    try {
      await fetch(GAS_URL,{method:"POST",body:JSON.stringify({action:"addPromo",...newRec})});
    } catch{}
    setData(d=>[newRec,...d]);
    setPromoForm({tanggal:new Date().toISOString().split("T")[0],keterangan:"",jumlah:""});
    addToast("Pengeluaran berhasil dicatat!");
    setSavingPromo(false); setTab("overview");
  };

  // Withdraw
  const handleWithdraw=async({agent,jumlah,keterangan})=>{
    const newRec={id:"w"+Date.now(),type:"withdraw",tanggal:new Date().toISOString().split("T")[0],agent,jumlah,keterangan};
    try {
      await fetch(GAS_URL,{method:"POST",body:JSON.stringify({action:"addWithdraw",...newRec})});
    } catch{}
    setData(d=>[newRec,...d]);
    addToast(`Tarik tabungan ${agent} berhasil dicatat!`);
  };

  // All transactions sorted by date
  const allTrans=[...data].sort((a,b)=>new Date(b.tanggal)-new Date(a.tanggal));
  const filteredTrans = filterAgent==="all" ? allTrans : allTrans.filter(r=>r.type==="fee"||(r.agent===filterAgent)||(r.type==="promo")||(r.type==="fee"));

  // Monthly stats for chart
  const monthlyStats=(()=>{
    const map={};
    feeRecords.forEach(r=>{
      const d=new Date(r.tanggal); if(isNaN(d)) return;
      const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      if(!map[k]) map[k]={k,fee:0,net:0};
      map[k].fee+=(parseFloat(r.feeLariz)||0);
      map[k].net+=(parseFloat(r.netCommission)||0);
    });
    return Object.values(map).sort((a,b)=>a.k.localeCompare(b.k)).slice(-6);
  })();
  const maxStat=Math.max(...monthlyStats.map(m=>m.fee),1);

  const TABS=[
    {id:"overview",  label:"Overview",     icon:"📊"},
    {id:"input-fee", label:"Input Fee",    icon:"💰"},
    {id:"input-promo",label:"Input Promo", icon:"📤"},
    {id:"history",   label:"Riwayat",      icon:"📋"},
  ];

  return (
    <div style={{minHeight:"100vh",
      background:"radial-gradient(ellipse 100% 50% at 50% -5%,rgba(99,102,241,.1) 0%,transparent 60%),#05070E"}}>
      <style>{G}</style>

      {/* ══ HEADER ══ */}
      <header style={{position:"sticky",top:0,zIndex:100,background:"rgba(5,7,14,.92)",
        backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
        <div style={{maxWidth:1200,margin:"auto",padding:"0 20px",height:58,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj3D3dP2IHvCsgRuzkl9XRJDsb-Ttc98DnL3Y7EW7L_lnNNtw0qfrGpro_F9PEmt0Xz-SCxs2gWBVbYme0XCshjAGD5YGAfdW7JUq5lrlMn2hu_ynIL7oSVRppEcyICy7qY7A9iBY4k2d8igPSjL8UU12uQPmrsRGVAdUs4CCJMZlhCfVeOtvpF3yHvLcs8/s300/3.png" alt="logo" style={{width:28,height:28,objectFit:"contain",borderRadius:4}}/>
              <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,letterSpacing:".15em",color:"#F1F5F9"}}>LARIZ PROPERTY</span>
            </div>
            <div style={{width:1,height:20,background:"rgba(255,255,255,.1)"}}/>
            <div style={{display:"flex",gap:2}}>
              {TABS.map(t=>(
                <button key={t.id} onClick={()=>setTab(t.id)} className="nav-item" style={{
                  padding:"6px 14px",borderRadius:8,border:"none",fontSize:12,fontWeight:600,cursor:"pointer",
                  background:tab===t.id?"rgba(99,102,241,.2)":"transparent",
                  color:tab===t.id?"#818CF8":"#64748B",
                  borderBottom:tab===t.id?"2px solid #6366F1":"2px solid transparent",transition:"all .15s"}}>
                  {t.icon}&nbsp;{t.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{padding:"4px 12px",borderRadius:99,fontSize:11,fontWeight:700,
              background:"rgba(99,102,241,.15)",color:"#818CF8",border:"1px solid rgba(99,102,241,.3)"}}>ADMIN</div>
            <button onClick={onLogout} className="btn-ghost" style={{padding:"6px 14px",borderRadius:8,border:"1px solid rgba(248,113,113,.2)",
              background:"rgba(248,113,113,.06)",color:"#F87171",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .15s"}}>
              ⏏ Keluar
            </button>
          </div>
        </div>
      </header>

      <main style={{maxWidth:1200,margin:"auto",padding:"28px 20px 80px"}}>

        {/* ══════════════════════════════════════
            TAB: OVERVIEW
        ══════════════════════════════════════ */}
        {tab==="overview" && (
          <div style={{animation:"fadeUp .35s ease"}}>

            {/* Top KPI Cards */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:28}}>
              {[
                {label:"Total Fee Masuk",  value:totalFeeIn,   color:"#34D399", icon:"📥", sub:`${feeRecords.length} transaksi`},
                {label:"Net Commission",   value:totalNetComm, color:"#6366F1", icon:"✅", sub:"setelah promo & co-broke"},
                {label:"Total Pengeluaran",value:totalPromoOut,color:"#F87171", icon:"📤", sub:`${promoRecords.length} item`},
                {label:"Total Saldo Agen", value:totalSaldoAll,color:"#F59E0B", icon:"🏦", sub:"semua agen"},
              ].map(c=>(
                <div key={c.label} style={{background:`${c.color}08`,border:`1px solid ${c.color}20`,borderRadius:14,padding:"18px 20px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:c.color,borderRadius:"14px 14px 0 0",opacity:.6}}/>
                  <div style={{fontSize:11,color:"#475569",letterSpacing:".08em",textTransform:"uppercase",marginBottom:8}}>{c.icon} {c.label}</div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:18,fontWeight:700,color:c.color}}>
                    <AnimNum value={c.value}/>
                  </div>
                  <div style={{fontSize:11,color:"#334155",marginTop:4}}>{c.sub}</div>
                </div>
              ))}
            </div>

            {/* Saldo Agen Cards */}
            <div style={{marginBottom:28}}>
              <SectionTitle>💳 Saldo Tabungan Agen</SectionTitle>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
                {agentSaldo.map(ag=>(
                  <div key={ag.id} style={{background:`${ag.color}07`,border:`1px solid ${ag.color}20`,borderRadius:16,padding:"20px 22px",position:"relative",overflow:"hidden"}}>
                    {/* Decorative bg circle */}
                    <div style={{position:"absolute",right:-20,top:-20,width:90,height:90,borderRadius:"50%",background:`${ag.color}08`}}/>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                          <div style={{width:32,height:32,borderRadius:9,background:`${ag.color}20`,border:`1px solid ${ag.color}35`,
                            display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Bebas Neue',sans-serif",fontSize:12,color:ag.color}}>
                            {ag.id.slice(0,2).toUpperCase()}
                          </div>
                          <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,letterSpacing:".1em",color:"#E2E8F0"}}>{ag.label}</span>
                        </div>
                        <div style={{fontSize:11,color:"#334155"}}>{ag.pct}% dari net · Saving {ag.savingPct}% BDB</div>
                      </div>
                      <button onClick={()=>setWithdrawModal(ag)} style={{
                        padding:"6px 12px",borderRadius:9,border:`1px solid ${ag.color}40`,
                        background:`${ag.color}12`,color:ag.color,fontSize:11,fontWeight:700,cursor:"pointer",
                        transition:"all .15s",whiteSpace:"nowrap"}}
                        onMouseEnter={e=>{e.currentTarget.style.background=`${ag.color}25`;}}
                        onMouseLeave={e=>{e.currentTarget.style.background=`${ag.color}12`;}}>
                        ↑ Tarik
                      </button>
                    </div>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:24,fontWeight:700,color:ag.color,marginBottom:12}}>
                      <AnimNum value={ag.saldo}/>
                    </div>
                    <div style={{display:"flex",gap:16}}>
                      <div>
                        <div style={{fontSize:10,color:"#334155"}}>Total Masuk</div>
                        <div style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"#64748B"}}>{rpS(ag.totalSaving)}</div>
                      </div>
                      <div style={{width:1,background:"rgba(255,255,255,.06)"}}/>
                      <div>
                        <div style={{fontSize:10,color:"#334155"}}>Total Keluar</div>
                        <div style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"#F87171"}}>{rpS(ag.totalOut)}</div>
                      </div>
                      <div style={{width:1,background:"rgba(255,255,255,.06)"}}/>
                      <div>
                        <div style={{fontSize:10,color:"#334155"}}>Riwayat Tarik</div>
                        <div style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"#64748B"}}>{withdrawRecs.filter(w=>w.agent===ag.id).length}x</div>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div style={{marginTop:14,height:4,background:"rgba(255,255,255,.05)",borderRadius:2,overflow:"hidden"}}>
                      <div style={{height:"100%",background:`linear-gradient(90deg,${ag.color},${ag.color}80)`,
                        width:`${ag.totalSaving>0?Math.max(5,(ag.saldo/ag.totalSaving)*100):0}%`,borderRadius:2,transition:"width 1s ease"}}/>
                    </div>
                    <div style={{fontSize:10,color:"#334155",marginTop:4}}>
                      {ag.totalSaving>0?`${Math.round((ag.saldo/ag.totalSaving)*100)}% tersisa`:"Belum ada masuk"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Statistik Chart */}
            <div style={{marginBottom:28}}>
              <SectionTitle>📈 Statistik 6 Bulan Terakhir</SectionTitle>
              <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14}}>
                {/* Bar chart */}
                <div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.07)",borderRadius:16,padding:"20px 24px"}}>
                  <p style={{fontSize:12,fontWeight:600,color:"#64748B",marginBottom:20}}>Fee Masuk per Bulan</p>
                  {monthlyStats.length===0
                    ? <div style={{padding:40,textAlign:"center",color:"#334155"}}>Belum ada data</div>
                    : (
                    <div style={{display:"flex",gap:8,alignItems:"flex-end",height:160}}>
                      {monthlyStats.map(m=>{
                        const pct=(m.fee/maxStat)*100;
                        const pctNet=(m.net/maxStat)*100;
                        const [yr,mo]=m.k.split("-");
                        const moLabel=["","Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"][parseInt(mo)];
                        return(
                          <div key={m.k} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                            <div style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:"#475569"}}>{rpS(m.fee)}</div>
                            <div style={{width:"100%",display:"flex",gap:2,alignItems:"flex-end",height:120}}>
                              <div style={{flex:1,background:"linear-gradient(180deg,#6366F1,#4F46E5)",borderRadius:"3px 3px 0 0",
                                height:`${pct}%`,minHeight:4,transition:"height 1s ease",opacity:.8}}/>
                              <div style={{flex:1,background:"linear-gradient(180deg,#34D399,#059669)",borderRadius:"3px 3px 0 0",
                                height:`${pctNet}%`,minHeight:4,transition:"height 1s ease",opacity:.8}}/>
                            </div>
                            <div style={{fontSize:10,color:"#475569",fontFamily:"'DM Mono',monospace"}}>{moLabel}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div style={{display:"flex",gap:16,marginTop:12}}>
                    {[["#6366F1","Fee Lariz"],["#34D399","Net Commission"]].map(([c,l])=>(
                      <div key={l} style={{display:"flex",alignItems:"center",gap:5}}>
                        <div style={{width:10,height:10,borderRadius:2,background:c}}/>
                        <span style={{fontSize:11,color:"#475569"}}>{l}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mini stats */}
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {[
                    {label:"Rata-rata Fee/transaksi", value:feeRecords.length?totalFeeIn/feeRecords.length:0, color:"#6366F1"},
                    {label:"Total Transaksi", value:feeRecords.length, color:"#34D399", isCount:true},
                    {label:"Total Penarikan Agen", value:totalWithdraw, color:"#F59E0B"},
                    {label:"Saldo BDB Operasional", value:feeRecords.reduce((s,r)=>s+(parseFloat(r.opBdb)||0),0)-totalPromoOut, color:"#22D3EE"},
                  ].map(s=>(
                    <div key={s.label} style={{background:"rgba(255,255,255,.02)",border:`1px solid ${s.color}20`,
                      borderRadius:12,padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{fontSize:11,color:"#475569",maxWidth:160}}>{s.label}</div>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:14,fontWeight:700,color:s.color,textAlign:"right"}}>
                        {s.isCount?s.value:rpS(s.value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tabel Saldo (semua transaksi ringkas) */}
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <SectionTitle nomb>📒 Tabel Saldo — Pendapatan & Pengeluaran</SectionTitle>
                <div style={{display:"flex",gap:6}}>
                  {["all","aris","argo","darma"].map(a=>(
                    <button key={a} onClick={()=>setFilterAgent(a)} style={{
                      padding:"5px 12px",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",border:"none",
                      background:filterAgent===a?"rgba(99,102,241,.2)":"rgba(255,255,255,.04)",
                      color:filterAgent===a?"#818CF8":"#475569",transition:"all .15s"}}>
                      {a==="all"?"Semua":a.charAt(0).toUpperCase()+a.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <SaldoTable data={allTrans} agentSaldo={agentSaldo} filterAgent={filterAgent}/>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            TAB: INPUT FEE
        ══════════════════════════════════════ */}
        {tab==="input-fee" && (
          <div style={{animation:"fadeUp .3s ease"}}>
            <SectionTitle>💰 Input Fee Transaksi</SectionTitle>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
              {/* Form */}
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <Panel title="Info Transaksi" accent="#6366F1">
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    <Fld label="Nama Dev / Listing">
                      <input style={S.inp} value={feeForm.namaDev} onChange={e=>setFeeForm(f=>({...f,namaDev:e.target.value}))} placeholder="MG_6"/>
                    </Fld>
                    <Fld label="Nama Konsumen">
                      <input style={S.inp} value={feeForm.namaKonsumen} onChange={e=>setFeeForm(f=>({...f,namaKonsumen:e.target.value}))} placeholder="SELVI"/>
                    </Fld>
                  </div>
                  <Fld label="Tanggal Realisasi">
                    <input type="date" style={S.inp} value={feeForm.tanggal} onChange={e=>setFeeForm(f=>({...f,tanggal:e.target.value}))}/>
                  </Fld>
                </Panel>
                <Panel title="Detail Fee" accent="#10B981">
                  <MoneyFld label="Fee Lariz Property (Total Masuk)" value={feeForm.feeLariz} onChange={setMoney(feeForm,setFeeForm,"feeLariz")}/>
                  <MoneyFld label="Promo (misal: mesin cuci)" value={feeForm.promo} onChange={setMoney(feeForm,setFeeForm,"promo")}/>
                  <MoneyFld label="Fee Agent BT / Co-Broke" value={feeForm.feeAgentBT} onChange={setMoney(feeForm,setFeeForm,"feeAgentBT")}/>
                  <Fld label="Keterangan">
                    <textarea style={{...S.inp,minHeight:56,resize:"vertical"}} value={feeForm.keterangan} onChange={e=>setFeeForm(f=>({...f,keterangan:e.target.value}))} placeholder="Catatan..."/>
                  </Fld>
                  <button onClick={saveFee} disabled={savingFee} style={S.saveBtn(savingFee)}>
                    {savingFee?"⏳ Menyimpan...":"💾 Simpan & Hitung Otomatis"}
                  </button>
                </Panel>
              </div>
              {/* Preview */}
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <Panel title="Preview Kalkulasi" accent="#F59E0B">
                  <AlcRow label="Fee Lariz" value={feeCalc.fee} green/>
                  <AlcRow label="Promo" value={feeCalc.promo} red/>
                  <AlcRow label="Fee Agent BT" value={feeCalc.feeAgentBT} red/>
                  <div style={{background:"rgba(99,102,241,.1)",border:"1px solid rgba(99,102,241,.3)",borderRadius:9,
                    padding:"10px 14px",display:"flex",justifyContent:"space-between",marginTop:6}}>
                    <span style={{fontWeight:700,color:"#E2E8F0"}}>NET COMMISSION</span>
                    <span style={{fontFamily:"'DM Mono',monospace",color:"#818CF8",fontWeight:700,fontSize:15}}>{rp(feeCalc.net)}</span>
                  </div>
                </Panel>
                <Panel title="Alokasi Tim (dari Net)" accent="#A78BFA">
                  {[["BDB 40%",feeCalc.bdb,"#F59E0B"],["Aris 22.5%",feeCalc.aris,"#22D3EE"],["Argo 22.5%",feeCalc.argo,"#F59E0B"],["Darma 15%",feeCalc.darma,"#A78BFA"]].map(([l,v,c])=>(
                    <AlcRow key={l} label={l} value={v} accent={c} green/>
                  ))}
                </Panel>
                <Panel title="Alokasi BDB" accent="#F59E0B">
                  {[["Operasional 70%",feeCalc.opBdb,"#34D399"],["Saving Aris 10%",feeCalc.savingAris,"#22D3EE"],["Saving Argo 10%",feeCalc.savingArgo,"#F59E0B"],["Saving Darma 10%",feeCalc.savingDarma,"#A78BFA"]].map(([l,v,c])=>(
                    <AlcRow key={l} label={l} value={v} accent={c} green/>
                  ))}
                </Panel>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            TAB: INPUT PROMO
        ══════════════════════════════════════ */}
        {tab==="input-promo" && (
          <div style={{animation:"fadeUp .3s ease",maxWidth:560}}>
            <SectionTitle>📤 Input Pengeluaran / Promo</SectionTitle>
            <Panel title="Catat Pengeluaran Operasional" accent="#F87171">
              <div style={{marginBottom:12,padding:"10px 14px",background:"rgba(248,113,113,.07)",border:"1px solid rgba(248,113,113,.15)",borderRadius:9}}>
                <p style={{fontSize:12,color:"#94A3B8"}}>Pengeluaran ini akan mengurangi saldo operasional BDB. Contoh: ATK, brosur, biaya pemasaran, dll.</p>
              </div>
              <Fld label="Tanggal"><input type="date" style={S.inp} value={promoForm.tanggal} onChange={e=>setPromoForm(f=>({...f,tanggal:e.target.value}))}/></Fld>
              <Fld label="Keterangan Pengeluaran">
                <input style={S.inp} value={promoForm.keterangan} onChange={e=>setPromoForm(f=>({...f,keterangan:e.target.value}))} placeholder="ATK, Print Brosur, dll"/>
              </Fld>
              <MoneyFld label="Jumlah (Rp)" value={promoForm.jumlah} onChange={setMoney(promoForm,setPromoForm,"jumlah")}/>
              <div style={{marginTop:6,padding:"10px 14px",background:"rgba(255,255,255,.03)",borderRadius:9,display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:12,color:"#475569"}}>Jumlah</span>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:14,fontWeight:700,color:"#F87171"}}>- {rp(parseMoney(promoForm.jumlah))}</span>
              </div>
              <button onClick={savePromo} disabled={savingPromo} style={{...S.saveBtn(savingPromo),background:savingPromo?"#1E293B":"linear-gradient(135deg,#EF4444,#DC2626)",
                boxShadow:savingPromo?"none":"0 4px 16px rgba(239,68,68,.3)",marginTop:14}}>
                {savingPromo?"⏳ Menyimpan...":"📤 Catat Pengeluaran"}
              </button>
            </Panel>

            {/* Recent promo */}
            <div style={{marginTop:20}}>
              <p style={{fontSize:12,fontWeight:600,color:"#475569",marginBottom:10}}>PENGELUARAN TERAKHIR</p>
              {promoRecords.slice(0,5).map((r,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                  padding:"10px 14px",borderRadius:9,background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.05)",marginBottom:6}}>
                  <div>
                    <p style={{fontSize:13,color:"#CBD5E1",fontWeight:500}}>{r.keterangan}</p>
                    <p style={{fontSize:11,color:"#334155"}}>{fmtDate(r.tanggal)}</p>
                  </div>
                  <span style={{fontFamily:"'DM Mono',monospace",fontSize:14,fontWeight:700,color:"#F87171"}}>- {rp(r.jumlah)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            TAB: RIWAYAT
        ══════════════════════════════════════ */}
        {tab==="history" && (
          <div style={{animation:"fadeUp .3s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <SectionTitle nomb>📋 Riwayat Semua Transaksi</SectionTitle>
              <div style={{fontSize:12,color:"#334155"}}>{allTrans.length} total record</div>
            </div>
            <FullHistoryTable data={allTrans} agents={AGENTS}/>
          </div>
        )}

      </main>

      {/* Withdraw Modal */}
      {withdrawModal&&(
        <WithdrawModal
          agent={withdrawModal}
          saldo={agentSaldo.find(a=>a.id===withdrawModal.id)?.saldo||0}
          onConfirm={handleWithdraw}
          onClose={()=>setWithdrawModal(null)}
        />
      )}

      <Toast items={toasts} onRemove={id=>setToasts(t=>t.filter(x=>x.id!==id))}/>
    </div>
  );
}

// ─── SALDO TABLE ─────────────────────────────────────────────────────────────
function SaldoTable({ data, agentSaldo, filterAgent }) {
  const rows = data.map(r => {
    if(r.type==="fee") return {
      tanggal:r.tanggal, desc:`${r.namaDev} / ${r.namaKonsumen}`, type:"fee",
      in: parseFloat(r.feeLariz)||0, out:0, net:parseFloat(r.netCommission)||0, color:"#34D399",badge:"FEE",
    };
    if(r.type==="promo") return {
      tanggal:r.tanggal, desc:r.keterangan, type:"promo",
      in:0, out:parseFloat(r.jumlah)||0, net:-(parseFloat(r.jumlah)||0), color:"#F87171",badge:"PROMO",
    };
    if(r.type==="withdraw") {
      const ag=agentSaldo.find(a=>a.id===r.agent);
      return {
        tanggal:r.tanggal, desc:`Tarik Tabungan — ${r.agent?.charAt(0).toUpperCase()+r.agent?.slice(1)}`, type:"withdraw",
        in:0, out:parseFloat(r.jumlah)||0, net:-(parseFloat(r.jumlah)||0), color:"#F59E0B",badge:"TARIK",
      };
    }
    return null;
  }).filter(Boolean);

  const filtered = filterAgent==="all" ? rows : rows.filter(r=>r.type==="fee"||r.type==="promo"||(r.type==="withdraw"&&r.desc.toLowerCase().includes(filterAgent)));

  let runBalance=0;
  const rowsWithBalance=[...filtered].reverse().map(r=>{ runBalance+=r.net; return{...r,balance:runBalance}; }).reverse();

  const totalIn=filtered.reduce((s,r)=>s+r.in,0);
  const totalOut=filtered.reduce((s,r)=>s+r.out,0);

  return(
    <div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.06)",borderRadius:16,overflow:"hidden"}}>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead>
            <tr style={{background:"rgba(255,255,255,.03)",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
              {["Tanggal","Keterangan","Tipe","Pendapatan","Pengeluaran","Saldo Berjalan"].map(h=>(
                <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:10,fontWeight:700,
                  letterSpacing:".1em",color:"#334155",textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowsWithBalance.map((r,i)=>(
              <tr key={i} className="row-hover" style={{borderBottom:"1px solid rgba(255,255,255,.04)",background:i%2===0?"transparent":"rgba(255,255,255,.012)"}}>
                <td style={S.td}><span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#475569"}}>{fmtDate(r.tanggal)}</span></td>
                <td style={S.td}><span style={{color:"#CBD5E1",fontWeight:500}}>{r.desc}</span></td>
                <td style={S.td}>
                  <span style={{padding:"2px 8px",borderRadius:99,fontSize:10,fontWeight:700,
                    background:`${r.color}15`,color:r.color,border:`1px solid ${r.color}30`}}>{r.badge}</span>
                </td>
                <td style={S.td}><span style={{fontFamily:"'DM Mono',monospace",color:"#34D399",fontWeight:600}}>{r.in>0?rp(r.in):"—"}</span></td>
                <td style={S.td}><span style={{fontFamily:"'DM Mono',monospace",color:"#F87171",fontWeight:600}}>{r.out>0?rp(r.out):"—"}</span></td>
                <td style={S.td}>
                  <span style={{fontFamily:"'DM Mono',monospace",fontWeight:700,
                    color:r.balance>=0?"#6EE7B7":"#FCA5A5"}}>{rp(r.balance)}</span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{background:"rgba(255,255,255,.04)",borderTop:"2px solid rgba(255,255,255,.1)"}}>
              <td colSpan={3} style={{padding:"11px 14px",fontSize:11,fontWeight:700,letterSpacing:".1em",color:"#334155",textTransform:"uppercase"}}>
                TOTAL ({filtered.length} transaksi)
              </td>
              <td style={S.td}><span style={{fontFamily:"'DM Mono',monospace",fontWeight:700,color:"#34D399",fontSize:13}}>{rp(totalIn)}</span></td>
              <td style={S.td}><span style={{fontFamily:"'DM Mono',monospace",fontWeight:700,color:"#F87171",fontSize:13}}>{rp(totalOut)}</span></td>
              <td style={S.td}>
                <span style={{fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:13,
                  color:(totalIn-totalOut)>=0?"#6EE7B7":"#FCA5A5"}}>{rp(totalIn-totalOut)}</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ─── FULL HISTORY TABLE ───────────────────────────────────────────────────────
function FullHistoryTable({ data, agents }) {
  const [expanded,setExpanded]=useState(null);
  return(
    <div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.06)",borderRadius:16,overflow:"hidden"}}>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead>
            <tr style={{background:"rgba(255,255,255,.03)",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
              {["Tanggal","Tipe","Detail","Jumlah Utama","Net / Alokasi"].map(h=>(
                <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:10,fontWeight:700,letterSpacing:".1em",color:"#334155",textTransform:"uppercase"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((r,i)=>{
              const isExp=expanded===i;
              const isFee=r.type==="fee";
              const isPromo=r.type==="promo";
              const isWd=r.type==="withdraw";
              const typeInfo = isFee?{label:"FEE",color:"#34D399"}:isPromo?{label:"PROMO",color:"#F87171"}:{label:"TARIK",color:"#F59E0B"};
              const ag=isWd?agents.find(a=>a.id===r.agent):null;
              return(
                <>
                <tr key={i} className="row-hover" onClick={()=>isFee&&setExpanded(isExp?null:i)}
                  style={{borderBottom:"1px solid rgba(255,255,255,.04)",cursor:isFee?"pointer":"default",
                    background:isExp?"rgba(99,102,241,.06)":i%2===0?"transparent":"rgba(255,255,255,.012)"}}>
                  <td style={S.td}><span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#475569"}}>{fmtDate(r.tanggal)}</span></td>
                  <td style={S.td}>
                    <span style={{padding:"2px 8px",borderRadius:99,fontSize:10,fontWeight:700,
                      background:`${typeInfo.color}15`,color:typeInfo.color,border:`1px solid ${typeInfo.color}30`}}>{typeInfo.label}</span>
                  </td>
                  <td style={S.td}>
                    {isFee&&<><span style={{fontWeight:600,color:"#CBD5E1"}}>{r.namaDev}</span><span style={{color:"#475569"}}> / {r.namaKonsumen}</span></>}
                    {isPromo&&<span style={{color:"#94A3B8"}}>{r.keterangan}</span>}
                    {isWd&&<span style={{color:"#94A3B8"}}>Tarik — <strong style={{color:ag?.color||"#E2E8F0"}}>{r.agent}</strong> · {r.keterangan}</span>}
                  </td>
                  <td style={S.td}>
                    <span style={{fontFamily:"'DM Mono',monospace",fontWeight:700,
                      color:isFee?"#34D399":"#F87171",fontSize:13}}>
                      {isFee?rp(r.feeLariz):`- ${rp(r.jumlah)}`}
                    </span>
                  </td>
                  <td style={S.td}>
                    {isFee&&<span style={{fontFamily:"'DM Mono',monospace",color:"#818CF8",fontSize:13}}>{rp(r.netCommission)}</span>}
                    {isWd&&<span style={{fontFamily:"'DM Mono',monospace",color:"#F59E0B",fontSize:13}}>{rp(r.jumlah)}</span>}
                    {isFee&&<span style={{marginLeft:6,fontSize:10,color:"#334155"}}>▼ detail</span>}
                  </td>
                </tr>
                {isExp&&isFee&&(
                  <tr style={{background:"rgba(99,102,241,.04)",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                    <td colSpan={5} style={{padding:"12px 18px"}}>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8,animation:"fadeUp .2s ease"}}>
                        {[["Promo",r.promo,"#F87171"],["Fee BT",r.feeAgentBT,"#F87171"],["BDB 40%",r.bdb,"#F59E0B"],
                          ["Aris 22.5%",r.aris,"#22D3EE"],["Argo 22.5%",r.argo,"#F59E0B"],["Darma 15%",r.darma,"#A78BFA"],
                          ["Operasional",r.opBdb,"#34D399"],["Saving Aris",r.savingAris,"#22D3EE"],
                          ["Saving Argo",r.savingArgo,"#F59E0B"],["Saving Darma",r.savingDarma,"#A78BFA"],
                        ].map(([l,v,c])=>(
                          <div key={l} style={{background:"rgba(255,255,255,.03)",borderRadius:8,padding:"7px 10px"}}>
                            <div style={{fontSize:9,color:"#334155",textTransform:"uppercase",letterSpacing:".07em"}}>{l}</div>
                            <div style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:c,fontWeight:600}}>{rp(v)}</div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── TINY COMPONENTS ──────────────────────────────────────────────────────────
const SectionTitle=({children,nomb})=>(
  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,letterSpacing:".12em",color:"#94A3B8",marginBottom:nomb?0:14}}>{children}</div>
);
const Panel=({title,accent,children})=>(
  <div style={{background:"rgba(255,255,255,.025)",border:"1px solid rgba(255,255,255,.07)",borderRadius:14,padding:18,position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:accent,borderRadius:"14px 14px 0 0"}}/>
    <p style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:12,letterSpacing:".12em",color:"#4B5563",marginBottom:14,marginTop:2}}>{title}</p>
    {children}
  </div>
);
const Fld=({label,children})=><div style={{marginBottom:12}}><label style={S.lbl}>{label}</label>{children}</div>;
const MoneyFld=({label,value,onChange})=>(
  <div style={{marginBottom:12}}>
    <label style={S.lbl}>{label}</label>
    <div style={{position:"relative"}}>
      <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:11,color:"#475569",fontFamily:"'DM Mono',monospace"}}>Rp</span>
      <input value={value} onChange={onChange} style={{...S.inp,paddingLeft:28}} placeholder="0"/>
    </div>
  </div>
);
const AlcRow=({label,value,accent,green,red})=>(
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",
    borderRadius:8,background:"rgba(255,255,255,.025)",marginBottom:5}}>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <div style={{width:3,height:22,borderRadius:2,background:red?"#F87171":accent||"#34D399"}}/>
      <span style={{fontSize:12,color:"#94A3B8"}}>{label}</span>
    </div>
    <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:700,color:red?"#F87171":"#34D399"}}>{red?"- ":""}{rp(value)}</span>
  </div>
);

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const S={
  lbl:{display:"block",fontSize:10,fontWeight:700,letterSpacing:".1em",color:"#374151",marginBottom:5,textTransform:"uppercase"},
  inp:{width:"100%",padding:"9px 12px",background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.09)",
    borderRadius:9,color:"#E2E8F0",fontSize:13,outline:"none",transition:"border-color .15s"},
  td:{padding:"11px 14px",verticalAlign:"middle"},
  saveBtn:(dis)=>({width:"100%",padding:"12px",borderRadius:10,border:"none",
    background:dis?"#1E293B":"linear-gradient(135deg,#6366F1,#4F46E5)",
    color:dis?"#334155":"#fff",fontSize:14,fontWeight:700,cursor:dis?"not-allowed":"pointer",
    boxShadow:dis?"none":"0 4px 16px rgba(99,102,241,.35)",transition:"all .2s"}),
};

// ─── AGEN DASHBOARD ─────────────────────────────────────────────────────────
function WaRequestModal({user, saldo, onClose}) {
  const [nominal, setNominal] = useState("");
  const WA_NUMBER = "6281516072070";

  const num = parseMoney(nominal);
  const valid = num > 0 && num <= saldo;

  const fmtNominal = (n) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  const waText = () => {
    const tgl = new Date().toLocaleDateString("id-ID", {day:"2-digit", month:"long", year:"numeric"});
    return encodeURIComponent(
      `Halo Admin Lariz Property,\n\nSaya *${user.label}* ingin mengajukan permintaan penarikan tabungan.\n\n` +
      `📅 Tanggal  : ${tgl}\n` +
      `👤 Nama     : ${user.label}\n` +
      `💰 Nominal  : Rp ${fmtNominal(num)}\n\n` +
      `Mohon konfirmasinya. Terima kasih 🙏`
    );
  };

  const handleSend = () => {
    if (!valid) return;
    window.open(`https://wa.me/${WA_NUMBER}?text=${waText()}`, "_blank");
  };

  return (
    <Modal title="REQUEST TARIK TABUNGAN" onClose={onClose} width={440}>
      {/* Saldo info */}
      <div style={{marginBottom:18,padding:"14px 16px",background:`${user.color}0C`,border:`1px solid ${user.color}25`,borderRadius:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:10,color:"#475569",letterSpacing:".08em",marginBottom:4}}>SALDO TABUNGAN TERSEDIA</div>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:22,fontWeight:700,color:user.color}}>{rp(saldo)}</div>
        </div>
        <div style={{fontSize:28,opacity:.3}}>🏦</div>
      </div>

      {/* Nominal input */}
      <div style={{marginBottom:16}}>
        <label style={S.lbl}>Nominal yang ingin ditarik (Rp)</label>
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:12,color:"#475569",fontFamily:"'DM Mono',monospace",fontWeight:600}}>Rp</span>
          <input
            value={nominal}
            onChange={e => {
              const raw = e.target.value.replace(/\D/g,"");
              setNominal(raw ? parseInt(raw).toString().replace(/\B(?=(\d{3})+(?!\d))/g,".") : "");
            }}
            placeholder="0"
            style={{...S.inp, paddingLeft:34, fontSize:15, fontFamily:"'DM Mono',monospace", fontWeight:700,
              borderColor: num > saldo ? "rgba(248,113,113,.5)" : num > 0 ? `${user.color}50` : "rgba(255,255,255,.09)"}}
          />
        </div>
        {num > saldo && <p style={{fontSize:11,color:"#F87171",marginTop:5}}>⚠ Melebihi saldo tersedia ({rp(saldo)})</p>}
        {num > 0 && num <= saldo && (
          <p style={{fontSize:11,color:"#34D399",marginTop:5}}>✓ Nominal valid · Sisa setelah tarik: {rp(saldo - num)}</p>
        )}
      </div>

      {/* Preview pesan WA */}
      {num > 0 && num <= saldo && (
        <div style={{marginBottom:18,padding:"12px 14px",background:"rgba(37,211,102,.06)",border:"1px solid rgba(37,211,102,.2)",borderRadius:10}}>
          <div style={{fontSize:10,color:"#475569",letterSpacing:".08em",marginBottom:8}}>PREVIEW PESAN WhatsApp</div>
          <div style={{fontSize:12,color:"#94A3B8",lineHeight:1.7,fontFamily:"'DM Mono',monospace",whiteSpace:"pre-line"}}>
            {`Halo Admin Lariz Property,\n\nSaya `}<strong style={{color:"#E2E8F0"}}>{user.label}</strong>{` ingin mengajukan permintaan penarikan tabungan.\n\n📅 Tgl  : ${new Date().toLocaleDateString("id-ID",{day:"2-digit",month:"long",year:"numeric"})}\n👤 Nama : ${user.label}\n💰 Nominal : `}<strong style={{color:user.color}}>{`Rp ${fmtNominal(num)}`}</strong>
          </div>
        </div>
      )}

      {/* CTA Button */}
      <button
        onClick={handleSend}
        disabled={!valid}
        style={{
          width:"100%", padding:"13px", borderRadius:11, border:"none",
          background: valid ? "linear-gradient(135deg,#25D366,#128C7E)" : "#1E293B",
          color: valid ? "#fff" : "#334155",
          fontSize:14, fontWeight:700, cursor: valid ? "pointer" : "not-allowed",
          display:"flex", alignItems:"center", justifyContent:"center", gap:10,
          boxShadow: valid ? "0 4px 20px rgba(37,211,102,.35)" : "none",
          transition:"all .2s",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.531 5.845L.057 23.55a.75.75 0 0 0 .916.919l5.808-1.453A11.946 11.946 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.75 9.75 0 0 1-4.96-1.36l-.355-.212-3.684.921.958-3.591-.232-.37A9.75 9.75 0 1 1 12 21.75z"/>
        </svg>
        {valid ? `Kirim Request via WhatsApp` : "Masukkan nominal yang valid"}
      </button>

      <p style={{textAlign:"center",fontSize:11,color:"#1E293B",marginTop:10}}>
        Dikirim ke 0815-1607-207 · Admin Lariz Property
      </p>
    </Modal>
  );
}

function AgenDashboard({user, onLogout}) {
  const [data,setData]=useState(DEMO_TRANS);
  const [search,setSearch]=useState("");
  const [sortCol,setSortCol]=useState("tanggal");
  const [sortDir,setSortDir]=useState("desc");
  const [showWaModal,setShowWaModal]=useState(false);

  const feeRecs=data.filter(r=>r.type==="fee");
  const withdrawRecs=data.filter(r=>r.type==="withdraw" && r.agent===user.id);
  const myRecs=feeRecs.filter(r=>(parseFloat(r[user.feeField])||0)+(parseFloat(r[user.savingField])||0)>0);
  const filtered=myRecs.filter(r=>(r.namaDev||"").toLowerCase().includes(search.toLowerCase())||(r.namaKonsumen||"").toLowerCase().includes(search.toLowerCase()));
  const sorted=[...filtered].sort((a,b)=>{
    let va=a[sortCol]||0,vb=b[sortCol]||0;
    if(sortCol==="tanggal"){va=new Date(va);vb=new Date(vb);}else{va=parseFloat(va)||0;vb=parseFloat(vb)||0;}
    return sortDir==="asc"?(va>vb?1:-1):(va<vb?1:-1);
  });
  const toggleSort=col=>{if(sortCol===col)setSortDir(d=>d==="asc"?"desc":"asc");else{setSortCol(col);setSortDir("desc");}};

  const totalFee    = myRecs.reduce((s,r)=>s+(parseFloat(r[user.feeField])||0),0);
  const totalSaving = myRecs.reduce((s,r)=>s+(parseFloat(r[user.savingField])||0),0);
  const totalLariz  = myRecs.reduce((s,r)=>s+(parseFloat(r.feeLariz)||0),0);
  const totalWd     = withdrawRecs.reduce((s,r)=>s+(parseFloat(r.jumlah)||0),0);
  const saldoTabungan = totalSaving - totalWd;

  const SI=({col})=><span style={{marginLeft:3,opacity:sortCol===col?1:.3,fontSize:9,color:user.color}}>{sortCol===col?(sortDir==="asc"?"▲":"▼"):"⇅"}</span>;

  return(
    <div style={{minHeight:"100vh",background:`radial-gradient(ellipse 100% 50% at 50% -5%,${user.color}0C 0%,transparent 65%),#05070E`}}>
      <style>{G}</style>

      {/* Header */}
      <header style={{position:"sticky",top:0,zIndex:100,background:"rgba(5,7,14,.94)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
        <div style={{maxWidth:1100,margin:"auto",padding:"0 20px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,borderRadius:10,background:`${user.color}18`,border:`1px solid ${user.color}35`,
              display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:user.color,letterSpacing:".05em"}}>
              {user.avatar}
            </div>
            <div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:17,letterSpacing:".1em",color:"#E2E8F0"}}>{user.label}</div>
              <div style={{fontSize:10,color:"#334155",letterSpacing:".1em"}}>LARIZ PROPERTY · AGEN</div>
            </div>
          </div>
          <button onClick={onLogout} style={{padding:"6px 14px",borderRadius:8,border:"1px solid rgba(248,113,113,.2)",
            background:"rgba(248,113,113,.06)",color:"#F87171",fontSize:12,fontWeight:600,cursor:"pointer"}}>⏏ Keluar</button>
        </div>
      </header>

      <div style={{maxWidth:1100,margin:"auto",padding:"24px 20px 80px"}}>

        {/* ── KPI Cards ── */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
          {[
            {l:"Jumlah Listing",   v:myRecs.length,          c:user.color, isN:true, icon:"🏠"},
            {l:"Total Fee Lariz",  v:totalLariz,              c:"#34D399",  icon:"📥"},
            {l:"Total Pendapatan", v:totalFee+totalSaving,    c:user.color, icon:"💰"},
            {l:"Total Tabungan",   v:totalSaving,             c:"#F59E0B",  icon:"🏦"},
          ].map(s=>(
            <div key={s.l} style={{background:`${s.c}08`,border:`1px solid ${s.c}20`,borderRadius:14,padding:"16px 18px",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:s.c,opacity:.5}}/>
              <div style={{fontSize:10,color:"#475569",textTransform:"uppercase",letterSpacing:".1em",marginBottom:6}}>{s.icon} {s.l}</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:16,fontWeight:700,color:s.c}}>
                {s.isN ? s.v : rpS(s.v)}
              </div>
            </div>
          ))}
        </div>

        {/* ── Saldo Tabungan Card + WA CTA ── */}
        <div style={{marginBottom:24,background:`linear-gradient(135deg,${user.color}0E 0%,rgba(255,255,255,.02) 100%)`,
          border:`1px solid ${user.color}25`,borderRadius:18,padding:"22px 24px",position:"relative",overflow:"hidden"}}>

          {/* Decorative */}
          <div style={{position:"absolute",right:-30,top:-30,width:160,height:160,borderRadius:"50%",background:`${user.color}06`,pointerEvents:"none"}}/>
          <div style={{position:"absolute",right:20,bottom:-40,width:100,height:100,borderRadius:"50%",background:`${user.color}04`,pointerEvents:"none"}}/>

          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
            <div style={{flex:1,minWidth:200}}>
              <div style={{fontSize:11,color:"#475569",letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>🏦 Saldo Tabungan BDB Saya</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:32,fontWeight:700,color:user.color,marginBottom:4,lineHeight:1}}>
                <AnimNum value={saldoTabungan}/>
              </div>
              <div style={{display:"flex",gap:20,marginTop:12}}>
                <div>
                  <div style={{fontSize:10,color:"#334155"}}>Total Masuk</div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:"#34D399",fontWeight:600}}>{rp(totalSaving)}</div>
                </div>
                <div style={{width:1,background:"rgba(255,255,255,.06)"}}/>
                <div>
                  <div style={{fontSize:10,color:"#334155"}}>Total Ditarik</div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:"#F87171",fontWeight:600}}>{rp(totalWd)}</div>
                </div>
                <div style={{width:1,background:"rgba(255,255,255,.06)"}}/>
                <div>
                  <div style={{fontSize:10,color:"#334155"}}>Riwayat Tarik</div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:"#64748B",fontWeight:600}}>{withdrawRecs.length}x</div>
                </div>
              </div>
              {/* Progress bar */}
              <div style={{marginTop:14,height:5,background:"rgba(255,255,255,.06)",borderRadius:3,overflow:"hidden",maxWidth:320}}>
                <div style={{height:"100%",borderRadius:3,transition:"width 1s ease",
                  background:`linear-gradient(90deg,${user.color},${user.color}80)`,
                  width:`${totalSaving>0?Math.max(4,(saldoTabungan/totalSaving)*100):0}%`}}/>
              </div>
              <div style={{fontSize:10,color:"#334155",marginTop:4}}>
                {totalSaving>0?`${Math.round((saldoTabungan/totalSaving)*100)}% tersisa dari total tabungan`:"Belum ada tabungan masuk"}
              </div>
            </div>

            {/* WA Request CTA */}
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8}}>
              <button
                onClick={()=>setShowWaModal(true)}
                disabled={saldoTabungan<=0}
                style={{
                  display:"flex",alignItems:"center",gap:10,
                  padding:"14px 22px",borderRadius:13,border:"none",
                  background:saldoTabungan>0?"linear-gradient(135deg,#25D366,#128C7E)":"#1E293B",
                  color:saldoTabungan>0?"#fff":"#334155",
                  fontSize:14,fontWeight:700,cursor:saldoTabungan>0?"pointer":"not-allowed",
                  boxShadow:saldoTabungan>0?"0 4px 24px rgba(37,211,102,.4)":"none",
                  transition:"all .2s",whiteSpace:"nowrap",
                }}
                onMouseEnter={e=>{if(saldoTabungan>0){e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 28px rgba(37,211,102,.5)";}}}
                onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow=saldoTabungan>0?"0 4px 24px rgba(37,211,102,.4)":"none";}}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.531 5.845L.057 23.55a.75.75 0 0 0 .916.919l5.808-1.453A11.946 11.946 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.75 9.75 0 0 1-4.96-1.36l-.355-.212-3.684.921.958-3.591-.232-.37A9.75 9.75 0 1 1 12 21.75z"/>
                </svg>
                Request Tarik Tabungan
              </button>
              <div style={{fontSize:10,color:"#1E293B",textAlign:"right"}}>via WhatsApp ke 0815-1607-207</div>
            </div>
          </div>
        </div>

        {/* ── Tabel Rincian ── */}
        <div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.06)",borderRadius:16,overflow:"hidden"}}>
          <div style={{padding:"14px 18px",borderBottom:"1px solid rgba(255,255,255,.05)",
            display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,letterSpacing:".12em",color:"#CBD5E1"}}>Rincian Pendapatan — {user.label}</div>
              <div style={{fontSize:11,color:"#334155"}}>{sorted.length} transaksi</div>
            </div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Cari dev / konsumen..."
              style={{...S.inp,width:210,padding:"7px 12px",fontSize:12}}/>
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead>
                <tr style={{background:"rgba(255,255,255,.03)"}}>
                  {[{l:"No",c:null},{l:"Dev / Listing",c:"namaDev"},{l:"Konsumen / Pemilik",c:"namaKonsumen"},
                    {l:"Tgl Realisasi",c:"tanggal"},{l:"Fee Lariz",c:"feeLariz"},
                    {l:`Fee ${user.label}`,c:user.feeField},{l:"Saving BDB",c:user.savingField},{l:"Total",c:null}
                  ].map(({l,c})=>(
                    <th key={l} onClick={()=>c&&toggleSort(c)} style={{padding:"9px 14px",textAlign:"left",
                      fontSize:10,fontWeight:700,letterSpacing:".1em",color:"#334155",
                      cursor:c?"pointer":"default",textTransform:"uppercase",whiteSpace:"nowrap",
                      borderBottom:"1px solid rgba(255,255,255,.05)",userSelect:"none"}}>
                      {l}{c&&<SI col={c}/>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.length===0&&(
                  <tr><td colSpan={8} style={{padding:40,textAlign:"center",color:"#334155"}}>
                    <div style={{fontSize:28,marginBottom:8}}>📭</div>Belum ada transaksi.
                  </td></tr>
                )}
                {sorted.map((r,i)=>{
                  const f=parseFloat(r[user.feeField])||0, sv=parseFloat(r[user.savingField])||0;
                  return(
                    <tr key={i} className="row-hover" style={{borderBottom:"1px solid rgba(255,255,255,.04)",
                      background:i%2===0?"transparent":"rgba(255,255,255,.012)",transition:"background .12s"}}>
                      <td style={S.td}><span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#1E293B"}}>{String(i+1).padStart(2,"0")}</span></td>
                      <td style={S.td}><span style={{fontWeight:600,color:"#CBD5E1"}}>{r.namaDev||"-"}</span></td>
                      <td style={S.td}><span style={{color:"#64748B"}}>{r.namaKonsumen||"-"}</span></td>
                      <td style={S.td}><span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#475569"}}>{fmtDate(r.tanggal)}</span></td>
                      <td style={S.td}><span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"#64748B"}}>{rp(r.feeLariz)}</span></td>
                      <td style={S.td}><span style={{fontFamily:"'DM Mono',monospace",fontWeight:700,color:user.color}}>{rp(f)}</span></td>
                      <td style={S.td}><span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"#F59E0B"}}>{rp(sv)}</span></td>
                      <td style={S.td}>
                        <div style={{display:"inline-flex",background:`${user.color}12`,border:`1px solid ${user.color}30`,
                          borderRadius:7,padding:"4px 10px",fontFamily:"'DM Mono',monospace",fontWeight:700,
                          color:user.color,fontSize:13,whiteSpace:"nowrap"}}>{rp(f+sv)}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {sorted.length>0&&(
                <tfoot>
                  <tr style={{background:"rgba(255,255,255,.04)",borderTop:`2px solid ${user.color}30`}}>
                    <td colSpan={4} style={{padding:"11px 14px",fontSize:10,fontWeight:700,letterSpacing:".1em",color:"#334155",textTransform:"uppercase"}}>
                      TOTAL ({sorted.length})
                    </td>
                    <td style={S.td}><span style={{fontFamily:"'DM Mono',monospace",fontWeight:700,color:"#CBD5E1",fontSize:13}}>{rp(sorted.reduce((s,r)=>s+(parseFloat(r.feeLariz)||0),0))}</span></td>
                    <td style={S.td}><span style={{fontFamily:"'DM Mono',monospace",fontWeight:700,color:user.color,fontSize:13}}>{rp(sorted.reduce((s,r)=>s+(parseFloat(r[user.feeField])||0),0))}</span></td>
                    <td style={S.td}><span style={{fontFamily:"'DM Mono',monospace",fontWeight:700,color:"#F59E0B",fontSize:13}}>{rp(sorted.reduce((s,r)=>s+(parseFloat(r[user.savingField])||0),0))}</span></td>
                    <td style={S.td}>
                      <div style={{display:"inline-flex",background:`${user.color}18`,border:`1px solid ${user.color}45`,
                        borderRadius:7,padding:"5px 12px",fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:user.color}}>
                        {rpS(sorted.reduce((s,r)=>s+(parseFloat(r[user.feeField])||0)+(parseFloat(r[user.savingField])||0),0))}
                      </div>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {showWaModal && (
        <WaRequestModal user={user} saldo={saldoTabungan} onClose={()=>setShowWaModal(false)}/>
      )}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user,setUser]=useState(null);
  if(!user) return <Login onLogin={setUser}/>;
  if(user.role==="admin") return <AdminDashboard user={user} onLogout={()=>setUser(null)}/>;
  return <AgenDashboard user={user} onLogout={()=>setUser(null)}/>;
}
