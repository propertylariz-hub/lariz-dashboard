import React, { useState, useEffect, useRef } from "react";

const GAS_URL = "https://script.google.com/macros/s/AKfycbxOAySMOUVgh2FdRhl9kCOnf-848kcwVkNEUQJ3CM-kQC5pYu_6aoIfuCWjqOgO5R-Eaw/exec";
const GAS_URL_BASE = GAS_URL;

async function gasGet(params) {
  const qs  = Object.keys(params).map(k => k + "=" + encodeURIComponent(params[k])).join("&");
  const url = GAS_URL_BASE + "?" + qs;

  // Coba 1: fetch dengan mode cors
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: { "Accept": "application/json" },
    });
    const text = await res.text();
    if (text && text.trim().startsWith("{")) {
      return JSON.parse(text);
    }
  } catch(e) {
    console.log("[Lariz] fetch cors failed:", e.message);
  }

  // Coba 2: fetch no-cors via proxy
  try {
    const proxyUrl = "https://corsproxy.io/?" + encodeURIComponent(url);
    const res  = await fetch(proxyUrl);
    const text = await res.text();
    if (text && text.trim().startsWith("{")) {
      return JSON.parse(text);
    }
  } catch(e) {
    console.log("[Lariz] proxy failed:", e.message);
  }

  // Coba 3: JSONP
  return new Promise((resolve, reject) => {
    const cbName = "__gas_" + Date.now() + "_" + Math.random().toString(36).slice(2);
    const script = document.createElement("script");
    const timer  = setTimeout(() => {
      cleanup();
      reject(new Error("Gagal terhubung ke server"));
    }, 30000);
    function cleanup() {
      clearTimeout(timer);
      delete window[cbName];
      if (script.parentNode) script.parentNode.removeChild(script);
    }
    window[cbName] = (data) => { cleanup(); resolve(data); };
    script.onerror = () => { cleanup(); reject(new Error("Gagal terhubung ke server")); };
    script.src = url + "&callback=" + cbName;
    script.async = true;
    document.head.appendChild(script);
  });
}

async function gasPost(body) {
  const res  = await fetch(GAS_URL_BASE, { method:"POST", redirect:"follow", body:JSON.stringify(body) });
  const text = await res.text();
  if (text.trim().startsWith("<")) throw new Error("GAS POST returned HTML");
  return JSON.parse(text);
}

function md5(string) {
  function rotateLeft(lValue, iShiftBits) { return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits)); }
  function addUnsigned(lX, lY) {
    var lX8=(lX&0x80000000),lY8=(lY&0x80000000),lX4=(lX&0x40000000),lY4=(lY&0x40000000),lResult=(lX&0x3FFFFFFF)+(lY&0x3FFFFFFF);
    if(lX4&lY4) return(lResult^0x80000000^lX8^lY8);
    if(lX4|lY4){if(lResult&0x40000000)return(lResult^0xC0000000^lX8^lY8);else return(lResult^0x40000000^lX8^lY8);}
    else return(lResult^lX8^lY8);
  }
  function F(x,y,z){return(x&y)|((~x)&z);}
  function G(x,y,z){return(x&z)|(y&(~z));}
  function H(x,y,z){return(x^y^z);}
  function I(x,y,z){return(y^(x|(~z)));}
  function FF(a,b,c,d,x,s,ac){a=addUnsigned(a,addUnsigned(addUnsigned(F(b,c,d),x),ac));return addUnsigned(rotateLeft(a,s),b);}
  function GG(a,b,c,d,x,s,ac){a=addUnsigned(a,addUnsigned(addUnsigned(G(b,c,d),x),ac));return addUnsigned(rotateLeft(a,s),b);}
  function HH(a,b,c,d,x,s,ac){a=addUnsigned(a,addUnsigned(addUnsigned(H(b,c,d),x),ac));return addUnsigned(rotateLeft(a,s),b);}
  function II(a,b,c,d,x,s,ac){a=addUnsigned(a,addUnsigned(addUnsigned(I(b,c,d),x),ac));return addUnsigned(rotateLeft(a,s),b);}
  function convertToWordArray(string){
    var lWordCount,lMessageLength=string.length,lNumberOfWords_temp1=lMessageLength+8,
    lNumberOfWords_temp2=(lNumberOfWords_temp1-(lNumberOfWords_temp1%64))/64,
    lNumberOfWords=(lNumberOfWords_temp2+1)*16,lWordArray=new Array(lNumberOfWords-1),
    lBytePosition=0,lByteCount=0;
    while(lByteCount<lMessageLength){lWordCount=(lByteCount-(lByteCount%4))/4;lBytePosition=(lByteCount%4)*8;lWordArray[lWordCount]=(lWordArray[lWordCount]|(string.charCodeAt(lByteCount)<<lBytePosition));lByteCount++;}
    lWordCount=(lByteCount-(lByteCount%4))/4;lBytePosition=(lByteCount%4)*8;
    lWordArray[lWordCount]=lWordArray[lWordCount]|(0x80<<lBytePosition);
    lWordArray[lNumberOfWords-2]=lMessageLength<<3;lWordArray[lNumberOfWords-1]=lMessageLength>>>29;
    return lWordArray;
  }
  function wordToHex(lValue){
    var WordToHexValue="",WordToHexValue_temp="",lByte,lCount;
    for(lCount=0;lCount<=3;lCount++){lByte=(lValue>>>(lCount*8))&255;WordToHexValue_temp="0"+lByte.toString(16);WordToHexValue=WordToHexValue+WordToHexValue_temp.substr(WordToHexValue_temp.length-2,2);}
    return WordToHexValue;
  }
  function utf8Encode(string){
    string=string.replace(/\r\n/g,"\n");var utftext="";
    for(var n=0;n<string.length;n++){var c=string.charCodeAt(n);
      if(c<128){utftext+=String.fromCharCode(c);}
      else if((c>127)&&(c<2048)){utftext+=String.fromCharCode((c>>6)|192);utftext+=String.fromCharCode((c&63)|128);}
      else{utftext+=String.fromCharCode((c>>12)|224);utftext+=String.fromCharCode(((c>>6)&63)|128);utftext+=String.fromCharCode((c&63)|128);}
    }
    return utftext;
  }
  var x=[],k,AA,BB,CC,DD,a,b,c,d;
  var S11=7,S12=12,S13=17,S14=22,S21=5,S22=9,S23=14,S24=20,S31=4,S32=11,S33=16,S34=23,S41=6,S42=10,S43=15,S44=21;
  string=utf8Encode(string);x=convertToWordArray(string);
  a=0x67452301;b=0xEFCDAB89;c=0x98BADCFE;d=0x10325476;
  for(k=0;k<x.length;k+=16){
    AA=a;BB=b;CC=c;DD=d;
    a=FF(a,b,c,d,x[k+0],S11,0xD76AA478);d=FF(d,a,b,c,x[k+1],S12,0xE8C7B756);c=FF(c,d,a,b,x[k+2],S13,0x242070DB);b=FF(b,c,d,a,x[k+3],S14,0xC1BDCEEE);
    a=FF(a,b,c,d,x[k+4],S11,0xF57C0FAF);d=FF(d,a,b,c,x[k+5],S12,0x4787C62A);c=FF(c,d,a,b,x[k+6],S13,0xA8304613);b=FF(b,c,d,a,x[k+7],S14,0xFD469501);
    a=FF(a,b,c,d,x[k+8],S11,0x698098D8);d=FF(d,a,b,c,x[k+9],S12,0x8B44F7AF);c=FF(c,d,a,b,x[k+10],S13,0xFFFF5BB1);b=FF(b,c,d,a,x[k+11],S14,0x895CD7BE);
    a=FF(a,b,c,d,x[k+12],S11,0x6B901122);d=FF(d,a,b,c,x[k+13],S12,0xFD987193);c=FF(c,d,a,b,x[k+14],S13,0xA679438E);b=FF(b,c,d,a,x[k+15],S14,0x49B40821);
    a=GG(a,b,c,d,x[k+1],S21,0xF61E2562);d=GG(d,a,b,c,x[k+6],S22,0xC040B340);c=GG(c,d,a,b,x[k+11],S23,0x265E5A51);b=GG(b,c,d,a,x[k+0],S24,0xE9B6C7AA);
    a=GG(a,b,c,d,x[k+5],S21,0xD62F105D);d=GG(d,a,b,c,x[k+10],S22,0x02441453);c=GG(c,d,a,b,x[k+15],S23,0xD8A1E681);b=GG(b,c,d,a,x[k+4],S24,0xE7D3FBC8);
    a=GG(a,b,c,d,x[k+9],S21,0x21E1CDE6);d=GG(d,a,b,c,x[k+14],S22,0xC33707D6);c=GG(c,d,a,b,x[k+3],S23,0xF4D50D87);b=GG(b,c,d,a,x[k+8],S24,0x455A14ED);
    a=GG(a,b,c,d,x[k+13],S21,0xA9E3E905);d=GG(d,a,b,c,x[k+2],S22,0xFCEFA3F8);c=GG(c,d,a,b,x[k+7],S23,0x676F02D9);b=GG(b,c,d,a,x[k+12],S24,0x8D2A4C8A);
    a=HH(a,b,c,d,x[k+5],S31,0xFFFA3942);d=HH(d,a,b,c,x[k+8],S32,0x8771F681);c=HH(c,d,a,b,x[k+11],S33,0x6D9D6122);b=HH(b,c,d,a,x[k+14],S34,0xFDE5380C);
    a=HH(a,b,c,d,x[k+1],S31,0xA4BEEA44);d=HH(d,a,b,c,x[k+4],S32,0x4BDECFA9);c=HH(c,d,a,b,x[k+7],S33,0xF6BB4B60);b=HH(b,c,d,a,x[k+10],S34,0xBEBFBC70);
    a=HH(a,b,c,d,x[k+13],S31,0x289B7EC6);d=HH(d,a,b,c,x[k+0],S32,0xEAA127FA);c=HH(c,d,a,b,x[k+3],S33,0xD4EF3085);b=HH(b,c,d,a,x[k+6],S34,0x04881D05);
    a=HH(a,b,c,d,x[k+9],S31,0xD9D4D039);d=HH(d,a,b,c,x[k+12],S32,0xE6DB99E5);c=HH(c,d,a,b,x[k+15],S33,0x1FA27CF8);b=HH(b,c,d,a,x[k+2],S34,0xC4AC5665);
    a=II(a,b,c,d,x[k+0],S41,0xF4292244);d=II(d,a,b,c,x[k+7],S42,0x432AFF97);c=II(c,d,a,b,x[k+14],S43,0xAB9423A7);b=II(b,c,d,a,x[k+5],S44,0xFC93A039);
    a=II(a,b,c,d,x[k+12],S41,0x655B59C3);d=II(d,a,b,c,x[k+3],S42,0x8F0CCC92);c=II(c,d,a,b,x[k+10],S43,0xFFEFF47D);b=II(b,c,d,a,x[k+1],S44,0x85845DD1);
    a=II(a,b,c,d,x[k+8],S41,0x6FA87E4F);d=II(d,a,b,c,x[k+15],S42,0xFE2CE6E0);c=II(c,d,a,b,x[k+6],S43,0xA3014314);b=II(b,c,d,a,x[k+13],S44,0x4E0811A1);
    a=II(a,b,c,d,x[k+4],S41,0xF7537E82);d=II(d,a,b,c,x[k+11],S42,0xBD3AF235);c=II(c,d,a,b,x[k+2],S43,0x2AD7D2BB);b=II(b,c,d,a,x[k+9],S44,0xEB86D391);
    a=addUnsigned(a,AA);b=addUnsigned(b,BB);c=addUnsigned(c,CC);d=addUnsigned(d,DD);
  }
  return(wordToHex(a)+wordToHex(b)+wordToHex(c)+wordToHex(d)).toLowerCase();
}

const DEFAULT_HASHES = {
  admin: "0192023a7bbd73250516f069df18b500",
  aris:  "7e22b8b5e1d9d05fba3d55f5fb13cfe1",
  argo:  "9b47b77b6e0f41bde74c17bca00bde26",
  darma: "8d97a21a7e20b9f9e8f3bcef63de4ef4",
};
const DEFAULT_PASSWORDS = { admin:"admin123", aris:"aris123", argo:"argo123", darma:"darma123" };

function getPasswordHash(username) { return localStorage.getItem("lpwd_"+username) || DEFAULT_HASHES[username] || ""; }
function savePasswordHash(username, hash) { localStorage.setItem("lpwd_"+username, hash); }
function verifyPassword(username, plaintext) {
  if (DEFAULT_PASSWORDS[username] === plaintext) return true;
  return md5(plaintext) === getPasswordHash(username);
}

const USERS = {
  admin: { role:"admin",      label:"Admin",  color:"#6366F1", avatar:"AD" },
  aris:  { role:"agen-admin", label:"Aris",   color:"#22D3EE", avatar:"AR", feeField:"aris",  savingField:"savingAris"  },
  argo:  { role:"agen",       label:"Argo",   color:"#F59E0B", avatar:"AG", feeField:"argo",  savingField:"savingArgo"  },
  darma: { role:"agen",       label:"Darma",  color:"#A78BFA", avatar:"DA", feeField:"darma", savingField:"savingDarma" },
};

const AGENTS = [
  { id:"aris",  label:"Aris",  color:"#22D3EE", feeField:"aris",  savingField:"savingAris",  pct:22.5, savingPct:10, wa:"6281516072070",  waDisplay:"0815-1607-207"  },
  { id:"argo",  label:"Argo",  color:"#F59E0B", feeField:"argo",  savingField:"savingArgo",  pct:22.5, savingPct:10, wa:"6281241735380",  waDisplay:"0812-4173-5380" },
  { id:"darma", label:"Darma", color:"#A78BFA", feeField:"darma", savingField:"savingDarma", pct:15,   savingPct:10, wa:"6285920000152",  waDisplay:"0859-2000-0152" },
];

const TEAM_PCT = { bdb:0.40, aris:0.225, argo:0.225, darma:0.15 };
const BDB_PCT  = { operasional:0.70, savingAris:0.10, savingArgo:0.10, savingDarma:0.10 };

const rp  = (n) => "Rp\u00A0" + Math.round(n||0).toString().replace(/\B(?=(\d{3})+(?!\d))/g,".");
const rpS = (n) => { n=Math.round(n||0); if(n>=1e9) return "Rp\u00A0"+(n/1e9).toFixed(1)+"M"; if(n>=1e6) return "Rp\u00A0"+(n/1e6).toFixed(1)+"jt"; return rp(n); };
const fmtDate = (s) => { if(!s) return "-"; const d=new Date(s); return isNaN(d)?s:d.toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"}); };
const parseMoney = (s) => parseFloat(String(s).replace(/[^0-9]/g,""))||0;
const calcFee = (fee,promo,feeAgentBT) => {
  const net=fee-promo-feeAgentBT, bdb=net*TEAM_PCT.bdb, aris=net*TEAM_PCT.aris, argo=net*TEAM_PCT.argo, darma=net*TEAM_PCT.darma;
  return { fee,promo,feeAgentBT,net,bdb,aris,argo,darma, opBdb:bdb*BDB_PCT.operasional, savingAris:bdb*BDB_PCT.savingAris, savingArgo:bdb*BDB_PCT.savingArgo, savingDarma:bdb*BDB_PCT.savingDarma };
};

async function uploadBuktiToGAS(file) {
  if (!file) return "";
  try {
    const base64 = await new Promise((res,rej) => { const r=new FileReader(); r.onload=()=>res(r.result.split(",")[1]); r.onerror=()=>rej("read error"); r.readAsDataURL(file); });
    const resp = await fetch(GAS_URL, { method:"POST", body:JSON.stringify({ action:"uploadBukti", base64, mimeType:file.type, fileName:file.name }) });
    const data = await resp.json();
    return data.status==="ok" ? data.url : "";
  } catch { return ""; }
}

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
  ::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#1E293B;border-radius:2px}
  input,textarea,button,select{font-family:'Plus Jakarta Sans',sans-serif;}
  input[type=date]::-webkit-calendar-picker-indicator{filter:invert(.4);}
  .row-hover:hover{background:rgba(99,102,241,.05)!important;}
  .btn-ghost:hover{opacity:.8;transform:translateY(-1px);}
  .nav-item:hover{background:rgba(255,255,255,.05)!important;}
  .grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;}
  .grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}
  .grid-2{display:grid;grid-template-columns:2fr 1fr;gap:14px;}
  .grid-2-eq{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
  .header-nav{display:flex;gap:2px;}
  .header-right{display:flex;align-items:center;gap:10px;}
  .brand-title{display:inline;}
  .admin-badge{display:inline-flex;}
  .header-inner{padding:0 20px;height:58px;display:flex;align-items:center;justify-content:space-between;}
  .saldo-card-inner{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:16px;}
  .table-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;}
  .mobile-nav{display:none;}
  .desktop-nav{display:flex;}
  @media(max-width:900px){
    .grid-4{grid-template-columns:repeat(2,1fr);}
    .grid-3{grid-template-columns:repeat(2,1fr);}
    .grid-2{grid-template-columns:1fr;}
    .grid-2-eq{grid-template-columns:1fr;}
    .header-nav button{padding:5px 8px!important;font-size:11px!important;}
    .brand-title{display:none;}
  }
  @media(max-width:600px){
    .grid-4{grid-template-columns:1fr 1fr;}
    .grid-3{grid-template-columns:1fr;}
    .grid-2{grid-template-columns:1fr;}
    .grid-2-eq{grid-template-columns:1fr;}
    .header-inner{padding:0 14px!important;height:52px!important;}
    .desktop-nav{display:none!important;}
    .mobile-nav{display:flex!important;position:fixed;bottom:0;left:0;right:0;z-index:200;background:rgba(5,7,14,.96);border-top:1px solid rgba(255,255,255,.08);backdrop-filter:blur(20px);padding:6px 0 calc(6px + env(safe-area-inset-bottom));}
    .admin-badge{display:none!important;}
    main{padding:16px 12px 100px!important;}
    .toast-wrap{bottom:80px!important;right:12px!important;left:12px!important;}
  }
`;

function AnimNum({ value, prefix="Rp\u00A0", duration=700 }) {
  const [disp,setDisp]=useState(0); const r=useRef();
  useEffect(()=>{
    const prev=disp,diff=value-prev,t0=performance.now();
    const go=now=>{const p=Math.min((now-t0)/duration,1),e=1-Math.pow(1-p,3);setDisp(Math.round(prev+diff*e));if(p<1)r.current=requestAnimationFrame(go);};
    r.current=requestAnimationFrame(go);
    return()=>cancelAnimationFrame(r.current);
  },[value]);
  return <>{prefix}{disp.toString().replace(/\B(?=(\d{3})+(?!\d))/g,".")}</>;
}

function Toast({items,onRemove}) {
  return(
    <div className="toast-wrap" style={{position:"fixed",bottom:24,right:24,zIndex:9999,display:"flex",flexDirection:"column",gap:8}}>
      {items.map(t=>(
        <div key={t.id} onClick={()=>onRemove(t.id)} style={{background:t.type==="success"?"#052E16":t.type==="error"?"#450A0A":"#0C1A2E",border:`1px solid ${t.type==="success"?"#16A34A":t.type==="error"?"#DC2626":"#2563EB"}`,color:t.type==="success"?"#4ADE80":t.type==="error"?"#F87171":"#93C5FD",padding:"11px 18px",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer",animation:"slideIn .3s ease",minWidth:260,boxShadow:"0 8px 32px rgba(0,0,0,.5)"}}>
          {t.type==="success"?"✓":t.type==="error"?"✕":"ℹ"}&nbsp;&nbsp;{t.msg}
        </div>
      ))}
    </div>
  );
}

function Modal({title,onClose,children,width=480}) {
  return(
    <div style={{position:"fixed",inset:0,zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,background:"rgba(0,0,0,.7)",backdropFilter:"blur(8px)",animation:"fadeIn .2s ease"}} onClick={onClose}>
      <div style={{width:"100%",maxWidth:Math.min(width,window.innerWidth-32),background:"#0D1117",border:"1px solid rgba(255,255,255,.1)",borderRadius:20,padding:28,boxShadow:"0 24px 80px rgba(0,0,0,.7)",animation:"fadeUp .25s ease"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,letterSpacing:".12em",color:"#E2E8F0"}}>{title}</div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,.06)",border:"none",color:"#64748B",width:28,height:28,borderRadius:7,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ImageViewerModal({url,name,onClose}) {
  const isPdf=name&&name.toLowerCase().endsWith(".pdf");
  return(
    <div style={{position:"fixed",inset:0,zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.85)",backdropFilter:"blur(12px)",animation:"fadeIn .2s ease",padding:16}} onClick={onClose}>
      <div style={{position:"relative",maxWidth:"90vw",maxHeight:"90vh",animation:"fadeUp .25s ease"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,padding:"0 4px"}}>
          <span style={{fontSize:13,color:"#94A3B8",fontWeight:500,maxWidth:300,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📎 {name||"Bukti Transfer"}</span>
          <div style={{display:"flex",gap:8}}>
            <a href={url} target="_blank" rel="noreferrer" style={{padding:"5px 12px",borderRadius:7,border:"1px solid rgba(99,102,241,.3)",background:"rgba(99,102,241,.1)",color:"#818CF8",fontSize:12,fontWeight:600,textDecoration:"none"}}>↗ Buka Tab Baru</a>
            <button onClick={onClose} style={{width:30,height:30,borderRadius:8,border:"1px solid rgba(255,255,255,.15)",background:"rgba(255,255,255,.06)",color:"#94A3B8",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          </div>
        </div>
        {isPdf?(<div style={{background:"#0D1117",borderRadius:12,padding:32,textAlign:"center",border:"1px solid rgba(255,255,255,.08)",minWidth:280}}><div style={{fontSize:64,marginBottom:16}}>📄</div><a href={url} target="_blank" rel="noreferrer" style={{display:"inline-block",padding:"10px 20px",borderRadius:9,background:"linear-gradient(135deg,#6366F1,#4F46E5)",color:"#fff",fontSize:13,fontWeight:700,textDecoration:"none"}}>Buka PDF →</a></div>)
        :(<img src={url} alt={name||"bukti"} style={{maxWidth:"85vw",maxHeight:"80vh",borderRadius:12,objectFit:"contain",boxShadow:"0 24px 80px rgba(0,0,0,.6)",display:"block"}}/>)}
      </div>
    </div>
  );
}

function BuktiThumb({buktiName,buktiUrl,color="#6366F1"}) {
  const [show,setShow]=useState(false);
  if(!buktiName) return(<div style={{background:"rgba(255,255,255,.02)",border:"1px dashed rgba(255,255,255,.08)",borderRadius:10,padding:"10px 14px",minWidth:140,textAlign:"center"}}><div style={{fontSize:9,color:"#334155",letterSpacing:".07em",textTransform:"uppercase",marginBottom:6}}>Bukti</div><div style={{fontSize:22,marginBottom:4,opacity:.3}}>📎</div><div style={{fontSize:11,color:"#334155"}}>Tidak ada bukti</div></div>);
  const isImg=/\.(jpg|jpeg|png|gif|webp)$/i.test(buktiName);
  return(<>{<div onClick={buktiUrl?()=>setShow(true):undefined} style={{background:`${color}08`,border:`1px solid ${color}25`,borderRadius:10,padding:"10px 14px",minWidth:160,textAlign:"center",cursor:buktiUrl?"pointer":"default"}}><div style={{fontSize:9,color:"#475569",letterSpacing:".07em",textTransform:"uppercase",marginBottom:6}}>Bukti Transfer</div>{buktiUrl&&isImg?<img src={buktiUrl} alt="bukti" style={{width:"100%",maxHeight:80,objectFit:"cover",borderRadius:6,marginBottom:6}}/>:<div style={{fontSize:28,marginBottom:6}}>{isImg?"🖼️":"📄"}</div>}<div style={{fontSize:11,color,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:140}}>{buktiName}</div>{buktiUrl&&<div style={{fontSize:10,color:"#475569",marginTop:4}}>🔍 Klik untuk lihat</div>}</div>}{show&&<ImageViewerModal url={buktiUrl} name={buktiName} onClose={()=>setShow(false)}/>}</>);
}

function ChangePasswordModal({user,onClose}) {
  const [oldPass,setOldPass]=useState(""); const [newPass,setNewPass]=useState(""); const [confirm,setConfirm]=useState("");
  const [showOld,setShowOld]=useState(false); const [showNew,setShowNew]=useState(false); const [showCon,setShowCon]=useState(false);
  const [error,setError]=useState(""); const [success,setSuccess]=useState(false); const [loading,setLoading]=useState(false);
  const strength=(()=>{if(!newPass)return 0;let s=0;if(newPass.length>=6)s++;if(newPass.length>=10)s++;if(/[A-Z]/.test(newPass))s++;if(/[0-9]/.test(newPass))s++;if(/[^A-Za-z0-9]/.test(newPass))s++;return s;})();
  const strengthLabel=["","Lemah","Cukup","Sedang","Kuat","Sangat Kuat"][strength];
  const strengthColor=["","#F87171","#F59E0B","#FBBF24","#34D399","#22D3EE"][strength];
  const handleSave=()=>{
    setError("");
    if(!verifyPassword(user.username,oldPass)){setError("Password lama tidak sesuai.");return;}
    if(newPass.length<6){setError("Password baru minimal 6 karakter.");return;}
    if(newPass!==confirm){setError("Konfirmasi password tidak cocok.");return;}
    setLoading(true);
    setTimeout(()=>{const hash=md5(newPass);savePasswordHash(user.username,hash);try{gasPost({action:"updatePassword",username:user.username,hash}).catch(()=>{});}catch{}setLoading(false);setSuccess(true);},600);
  };
  return(
    <Modal title="GANTI PASSWORD" onClose={onClose} width={420}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,padding:"10px 14px",background:`${user.color}0C`,border:`1px solid ${user.color}22`,borderRadius:10}}>
        <div style={{width:32,height:32,borderRadius:9,background:`${user.color}20`,border:`1px solid ${user.color}35`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Bebas Neue',sans-serif",fontSize:13,color:user.color}}>{user.avatar}</div>
        <div><div style={{fontSize:13,fontWeight:700,color:"#E2E8F0"}}>{user.label}</div><div style={{fontSize:10,color:"#475569"}}>@{user.username}</div></div>
      </div>
      {success?(<div style={{textAlign:"center",padding:"20px 0"}}><div style={{width:60,height:60,borderRadius:"50%",background:"rgba(34,197,94,.15)",border:"2px solid #22C55E",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,margin:"0 auto 16px"}}>✓</div><p style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,letterSpacing:".1em",color:"#E2E8F0",marginBottom:8}}>Password Berhasil Diubah!</p><button onClick={onClose} style={{width:"100%",padding:"11px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${user.color},${user.color}CC)`,color:"#000",fontSize:13,fontWeight:700,cursor:"pointer"}}>Tutup</button></div>)
      :(<div>
        {[{l:"Password Lama",v:oldPass,sv:setOldPass,sh:showOld,ssh:setShowOld},{l:"Password Baru",v:newPass,sv:v=>{setNewPass(v);setError("");},sh:showNew,ssh:setShowNew},{l:"Konfirmasi",v:confirm,sv:v=>{setConfirm(v);setError("");},sh:showCon,ssh:setShowCon}].map(({l,v,sv,sh,ssh})=>(
          <div key={l} style={{marginBottom:14}}><label style={S.lbl}>{l}</label><div style={{position:"relative"}}><input type={sh?"text":"password"} value={v} onChange={e=>sv(e.target.value)} placeholder="••••••••" style={{...S.inp,paddingRight:40}}/><button onClick={()=>ssh(x=>!x)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:14,opacity:.5}}>{sh?"🙈":"👁️"}</button></div></div>
        ))}
        {newPass.length>0&&(<div style={{marginTop:-8,marginBottom:14}}><div style={{display:"flex",gap:3,marginBottom:4}}>{[1,2,3,4,5].map(i=><div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=strength?strengthColor:"rgba(255,255,255,.08)"}}/>)}</div><div style={{fontSize:10,color:strengthColor,fontWeight:600}}>{strengthLabel}</div></div>)}
        {error&&<div style={{marginBottom:14,padding:"8px 12px",background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.25)",borderRadius:8,fontSize:12,color:"#F87171",fontWeight:600}}>✕ {error}</div>}
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:"11px",borderRadius:10,border:"1px solid rgba(255,255,255,.1)",background:"transparent",color:"#64748B",fontSize:13,fontWeight:600,cursor:"pointer"}}>Batal</button>
          <button onClick={handleSave} disabled={loading||!oldPass||!newPass||!confirm} style={{flex:2,padding:"11px",borderRadius:10,border:"none",background:loading||!oldPass||!newPass||!confirm?"#1E293B":`linear-gradient(135deg,${user.color},${user.color}CC)`,color:loading||!oldPass||!newPass||!confirm?"#334155":"#000",fontSize:13,fontWeight:700,cursor:"pointer"}}>{loading?"⏳ Menyimpan...":"🔐 Simpan Password"}</button>
        </div>
      </div>)}
    </Modal>
  );
}

function ForgotPasswordModal({onClose}) {
  const [step,setStep]=useState(1); const [username,setUsername]=useState(""); const [otp,setOtp]=useState("");
  const [newPass,setNewPass]=useState(""); const [confirm,setConfirm]=useState(""); const [showNew,setShowNew]=useState(false);
  const [showCon,setShowCon]=useState(false); const [loading,setLoading]=useState(false); const [error,setError]=useState("");
  const userList=Object.entries(USERS).map(([k,v])=>({key:k,...v}));
  const strength=(()=>{if(!newPass)return 0;let s=0;if(newPass.length>=6)s++;if(newPass.length>=10)s++;if(/[A-Z]/.test(newPass))s++;if(/[0-9]/.test(newPass))s++;if(/[^A-Za-z0-9]/.test(newPass))s++;return s;})();
  const strengthColor=["","#F87171","#F59E0B","#FBBF24","#34D399","#22D3EE"][strength];
  const strengthLabel=["","Lemah","Cukup","Sedang","Kuat","Sangat Kuat"][strength];
  const handleRequestOTP=async()=>{if(!username){setError("Pilih akun dulu.");return;}setError("");setLoading(true);try{const data=await gasGet({action:"requestOTP",username});if(data.status==="ok"){setStep(2);}else{setError(data.message||"Gagal mengirim OTP.");}}catch{setError("Tidak bisa terhubung ke server.");}setLoading(false);};
  const handleVerifyOTP=async()=>{if(otp.length!==6){setError("OTP harus 6 digit.");return;}setError("");setLoading(true);try{const data=await gasPost({action:"verifyOTP",username,otp});if(data.status==="ok"){setStep(3);}else{setError(data.message||"OTP salah.");}}catch{setError("Tidak bisa terhubung ke server.");}setLoading(false);};
  const handleReset=async()=>{if(newPass.length<6){setError("Password minimal 6 karakter.");return;}if(newPass!==confirm){setError("Konfirmasi tidak cocok.");return;}setError("");setLoading(true);const hash=md5(newPass);savePasswordHash(username,hash);try{await gasPost({action:"resetPassword",username,hash});}catch{}setLoading(false);setStep(4);};
  const STEP_LABELS=["Pilih Akun","Verifikasi OTP","Password Baru","Selesai"];
  return(
    <Modal title="LUPA PASSWORD" onClose={onClose} width={440}>
      <div style={{display:"flex",alignItems:"center",marginBottom:22}}>
        {STEP_LABELS.map((l,i)=>{const done=step>i+1,active=step===i+1;return(<div key={l} style={{display:"flex",alignItems:"center",flex:i<3?1:"none"}}><div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}><div style={{width:26,height:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,background:done?"#22C55E":active?"#6366F1":"rgba(255,255,255,.06)",color:done||active?"#fff":"#334155",border:`2px solid ${done?"#22C55E":active?"#6366F1":"rgba(255,255,255,.1)"}`,boxShadow:active?"0 0 12px rgba(99,102,241,.4)":"none"}}>{done?"✓":i+1}</div><span style={{fontSize:8,color:active?"#818CF8":done?"#22C55E":"#334155",letterSpacing:".05em",textTransform:"uppercase",whiteSpace:"nowrap"}}>{l}</span></div>{i<3&&<div style={{flex:1,height:2,margin:"0 4px",marginBottom:14,borderRadius:1,background:done?"#22C55E":"rgba(255,255,255,.06)"}}/>}</div>);})}
      </div>
      {error&&<div style={{marginBottom:14,padding:"8px 12px",background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.25)",borderRadius:8,fontSize:12,color:"#F87171",fontWeight:600}}>✕ {error}</div>}
      {step===1&&(<div style={{animation:"fadeUp .2s ease"}}><p style={{fontSize:13,color:"#64748B",marginBottom:16}}>Pilih akun, OTP akan dikirim ke WhatsApp.</p><div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>{userList.map(u=>(<div key={u.key} onClick={()=>{setUsername(u.key);setError("");}} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:10,cursor:"pointer",background:username===u.key?`${u.color}12`:"rgba(255,255,255,.02)",border:`1px solid ${username===u.key?u.color+"40":"rgba(255,255,255,.07)"}`}}><div style={{width:32,height:32,borderRadius:9,background:`${u.color}20`,border:`1px solid ${u.color}35`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Bebas Neue',sans-serif",fontSize:12,color:u.color,flexShrink:0}}>{u.avatar}</div><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:"#CBD5E1"}}>{u.label}</div><div style={{fontSize:10,color:"#475569"}}>@{u.key}</div></div>{username===u.key&&<div style={{color:u.color,fontSize:16}}>✓</div>}</div>))}</div><button onClick={handleRequestOTP} disabled={!username||loading} style={{width:"100%",padding:"12px",borderRadius:10,border:"none",background:username&&!loading?"linear-gradient(135deg,#6366F1,#4F46E5)":"#1E293B",color:username&&!loading?"#fff":"#334155",fontSize:13,fontWeight:700,cursor:username&&!loading?"pointer":"not-allowed"}}>{loading?"⏳ Mengirim OTP...":"📱 Kirim OTP via WhatsApp"}</button></div>)}
      {step===2&&(<div style={{animation:"fadeUp .2s ease"}}><div style={{marginBottom:18,padding:"12px 14px",background:"rgba(37,211,102,.06)",border:"1px solid rgba(37,211,102,.2)",borderRadius:10}}><p style={{fontSize:12,color:"#34D399",fontWeight:600,marginBottom:4}}>✓ OTP Terkirim!</p><p style={{fontSize:12,color:"#64748B"}}>Cek WhatsApp. OTP berlaku <strong style={{color:"#E2E8F0"}}>10 menit</strong>.</p></div><div style={{marginBottom:16}}><label style={S.lbl}>Masukkan OTP (6 digit)</label><input value={otp} onChange={e=>{const v=e.target.value.replace(/\D/g,"").slice(0,6);setOtp(v);setError("");}} placeholder="_ _ _ _ _ _" maxLength={6} style={{...S.inp,textAlign:"center",fontSize:22,fontFamily:"'DM Mono',monospace",letterSpacing:"0.4em",fontWeight:700}}/></div><button onClick={handleVerifyOTP} disabled={otp.length!==6||loading} style={{width:"100%",padding:"12px",borderRadius:10,border:"none",background:otp.length===6&&!loading?"linear-gradient(135deg,#6366F1,#4F46E5)":"#1E293B",color:otp.length===6&&!loading?"#fff":"#334155",fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:10}}>{loading?"⏳ Memverifikasi...":"✓ Verifikasi OTP"}</button><button onClick={()=>{setStep(1);setOtp("");setError("");}} style={{width:"100%",padding:"10px",borderRadius:10,border:"1px solid rgba(255,255,255,.08)",background:"transparent",color:"#475569",fontSize:12,fontWeight:600,cursor:"pointer"}}>← Ganti Akun</button></div>)}
      {step===3&&(<div style={{animation:"fadeUp .2s ease"}}><p style={{fontSize:13,color:"#64D399",fontWeight:600,marginBottom:16}}>✓ OTP valid! Buat password baru.</p><div style={{marginBottom:14}}><label style={S.lbl}>Password Baru</label><div style={{position:"relative"}}><input type={showNew?"text":"password"} value={newPass} onChange={e=>{setNewPass(e.target.value);setError("");}} placeholder="Minimal 6 karakter" style={{...S.inp,paddingRight:40}}/><button onClick={()=>setShowNew(x=>!x)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:14,opacity:.5}}>{showNew?"🙈":"👁️"}</button></div>{newPass.length>0&&(<div style={{marginTop:6}}><div style={{display:"flex",gap:3,marginBottom:3}}>{[1,2,3,4,5].map(i=>(<div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=strength?strengthColor:"rgba(255,255,255,.08)"}}/>))}</div><span style={{fontSize:10,color:strengthColor,fontWeight:600}}>{strengthLabel}</span></div>)}</div><div style={{marginBottom:16}}><label style={S.lbl}>Konfirmasi Password</label><div style={{position:"relative"}}><input type={showCon?"text":"password"} value={confirm} onChange={e=>{setConfirm(e.target.value);setError("");}} placeholder="Ulangi password baru" style={{...S.inp,paddingRight:40}}/><button onClick={()=>setShowCon(x=>!x)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:14,opacity:.5}}>{showCon?"🙈":"👁️"}</button></div>{confirm.length>0&&<div style={{marginTop:4,fontSize:11,fontWeight:600,color:newPass===confirm?"#34D399":"#F87171"}}>{newPass===confirm?"✓ Password cocok":"✕ Tidak cocok"}</div>}</div><button onClick={handleReset} disabled={loading||newPass.length<6||newPass!==confirm} style={{width:"100%",padding:"12px",borderRadius:10,border:"none",background:!loading&&newPass.length>=6&&newPass===confirm?"linear-gradient(135deg,#6366F1,#4F46E5)":"#1E293B",color:!loading&&newPass.length>=6&&newPass===confirm?"#fff":"#334155",fontSize:13,fontWeight:700,cursor:"pointer"}}>{loading?"⏳ Menyimpan...":"🔐 Simpan Password Baru"}</button></div>)}
      {step===4&&(<div style={{textAlign:"center",padding:"16px 0",animation:"fadeUp .2s ease"}}><div style={{width:64,height:64,borderRadius:"50%",background:"rgba(34,197,94,.15)",border:"2px solid #22C55E",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 16px"}}>✓</div><p style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:".1em",color:"#E2E8F0",marginBottom:8}}>Password Berhasil Direset!</p><button onClick={onClose} style={{width:"100%",padding:"12px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#22C55E,#16A34A)",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>Login Sekarang</button></div>)}
    </Modal>
  );
}

function Login({onLogin,verifyPwd}) {
  const [u,setU]=useState(""); const [p,setP]=useState(""); const [show,setShow]=useState(false);
  const [err,setErr]=useState(""); const [loading,setLoading]=useState(false); const [showForgot,setShowForgot]=useState(false);

  const submit=()=>{
    setLoading(true);
    setTimeout(()=>{
      const ukey=u.toLowerCase().trim();
      const user=USERS[ukey];
      if(!user){setErr("Username tidak ditemukan.");setLoading(false);return;}
      const DEFAULTS={admin:"admin123",aris:"aris123",argo:"argo123",darma:"darma123"};
      const HASHES={admin:"0192023a7bbd73250516f069df18b500",aris:"7e22b8b5e1d9d05fba3d55f5fb13cfe1",argo:"9b47b77b6e0f41bde74c17bca00bde26",darma:"8d97a21a7e20b9f9e8f3bcef63de4ef4"};
      const ok=p===DEFAULTS[ukey]||md5(p)===HASHES[ukey]||(verifyPwd&&verifyPwd(ukey,p));
      if(ok){onLogin({username:ukey,...user});}
      else{setErr("Username atau password salah.");}
      setLoading(false);
    },600);
  };

  return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20,background:"radial-gradient(ellipse 120% 80% at 50% -10%,rgba(99,102,241,.12) 0%,transparent 60%),#05070E"}}>
      <style>{G}</style>
      <div style={{width:"100%",maxWidth:400,animation:"fadeUp .5s ease"}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{display:"inline-flex",width:80,height:80,borderRadius:20,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.1)",alignItems:"center",justifyContent:"center",marginBottom:16,overflow:"hidden"}}>
            <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj3D3dP2IHvCsgRuzkl9XRJDsb-Ttc98DnL3Y7EW7L_lnNNtw0qfrGpro_F9PEmt0Xz-SCxs2gWBVbYme0XCshjAGD5YGAfdW7JUq5lrlMn2hu_ynIL7oSVRppEcyICy7qY7A9iBY4k2d8igPSjL8UU12uQPmrsRGVAdUs4CCJMZlhCfVeOtvpF3yHvLcs8/s300/3.png" alt="logo" style={{width:76,height:76,objectFit:"contain"}}/>
          </div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:32,letterSpacing:".2em",color:"#F1F5F9"}}>LARIZ PROPERTY</div>
          <div style={{fontSize:11,color:"#334155",letterSpacing:".2em",marginTop:4}}>FEE MANAGEMENT SYSTEM</div>
        </div>
        <div style={{background:"rgba(255,255,255,.025)",border:"1px solid rgba(255,255,255,.07)",borderRadius:20,padding:"24px 20px"}}>
          <p style={{fontSize:14,fontWeight:600,color:"#64748B",marginBottom:20}}>Masuk ke Akun</p>
          <div style={{marginBottom:14}}><label style={S.lbl}>Username</label><input value={u} onChange={e=>{setU(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="admin / aris / argo / darma" style={{...S.inp,borderColor:err?"rgba(248,113,113,.4)":"rgba(255,255,255,.08)"}}/></div>
          <div style={{marginBottom:6}}><label style={S.lbl}>Password</label><div style={{position:"relative"}}><input type={show?"text":"password"} value={p} onChange={e=>{setP(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="••••••••" style={{...S.inp,paddingRight:40,borderColor:err?"rgba(248,113,113,.4)":"rgba(255,255,255,.08)"}}/><button onClick={()=>setShow(x=>!x)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:15,opacity:.5}}>{show?"🙈":"👁️"}</button></div></div>
          <div style={{height:20,marginBottom:16}}>{err&&<p style={{fontSize:12,color:"#F87171"}}>{err}</p>}</div>
          <button onClick={submit} disabled={loading} style={{width:"100%",padding:"12px",borderRadius:11,border:"none",background:loading?"#1E293B":"linear-gradient(135deg,#6366F1,#4F46E5)",color:loading?"#475569":"#fff",fontSize:14,fontWeight:700,cursor:loading?"not-allowed":"pointer",boxShadow:loading?"none":"0 4px 20px rgba(99,102,241,.4)"}}>{loading?<span style={{animation:"pulse2 1s infinite",display:"inline-block"}}>Memverifikasi...</span>:"Masuk →"}</button>
          <div style={{textAlign:"center",marginTop:12}}><button onClick={()=>setShowForgot(true)} style={{background:"none",border:"none",color:"#475569",fontSize:12,cursor:"pointer",textDecoration:"underline"}}>Lupa password?</button></div>
          <div style={{marginTop:10,padding:"12px 14px",background:"rgba(255,255,255,.02)",borderRadius:10,border:"1px solid rgba(255,255,255,.04)"}}>
            <p style={{fontSize:10,color:"#334155",marginBottom:6,letterSpacing:".08em"}}>AKUN TERSEDIA</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{Object.entries(USERS).map(([k,v])=>(<span key={k} onClick={()=>{setU(k);setP("");setErr("");}} style={{padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:700,background:`${v.color}15`,color:v.color,border:`1px solid ${v.color}30`,cursor:"pointer"}}>{v.label}</span>))}</div>
          </div>
        </div>
      </div>
      {showForgot&&<ForgotPasswordModal onClose={()=>setShowForgot(false)}/>}
    </div>
  );
}

function TransferUnifiedModal({agent,agData,onConfirmKomisi,onConfirmSaving,onClose}) {
  const [tipe,setTipe]=useState(agData?.hutangKomisi>0&&agData?.saldoSaving>0?"both":agData?.hutangKomisi>0?"komisi":"saving");
  const [step,setStep]=useState(1); const [jKomisi,setJKomisi]=useState(""); const [jSaving,setJSaving]=useState("");
  const [ket,setKet]=useState(""); const [bukti,setBukti]=useState(null); const [loading,setLoading]=useState(false);
  const fileRef=useRef();
  const hutang=agData?.hutangKomisi||0, saldo=agData?.saldoSaving||0;
  const numKom=parseMoney(jKomisi), numSav=parseMoney(jSaving);
  const validKom=tipe==="saving"?true:numKom>0&&numKom<=hutang;
  const validSav=tipe==="komisi"?true:numSav>0&&numSav<=saldo;
  const valid=validKom&&validSav&&(tipe==="both"?numKom>0||numSav>0:true);
  const tgl=new Date().toLocaleDateString("id-ID",{day:"2-digit",month:"long",year:"numeric"});
  const fmtN=n=>n.toString().replace(/\B(?=(\d{3})+(?!\d))/g,".");
  const handleConfirm=async()=>{
    setLoading(true);
    const bName=bukti?bukti.name:"";
    if((tipe==="komisi"||tipe==="both")&&numKom>0) await onConfirmKomisi({agent:agent.id,jumlah:numKom,keterangan:ket||`Transfer komisi ${agent.label}`,buktiName:bName,buktiFile:bukti?.file||null});
    if((tipe==="saving"||tipe==="both")&&numSav>0) await onConfirmSaving({agent:agent.id,jumlah:numSav,keterangan:ket||`Tarik saving ${agent.label}`,buktiName:bName,buktiFile:bukti?.file||null});
    setLoading(false);setStep(3);
  };
  const waLines=[`Halo *${agent.label}* 👋`,``,`Admin Lariz Property telah melakukan transfer:`,``];
  if((tipe==="komisi"||tipe==="both")&&numKom>0) waLines.push(`💸 Komisi   : *Rp ${fmtN(numKom)}*`);
  if((tipe==="saving"||tipe==="both")&&numSav>0) waLines.push(`🏦 Saving   : *Rp ${fmtN(numSav)}*`);
  waLines.push(`📅 Tanggal  : ${tgl}`);if(ket)waLines.push(`📝 Ket      : ${ket}`);
  waLines.push(``,`Bukti terlampir. Silakan cek rekening 🙏`,`_Lariz Property_`);
  const waText=encodeURIComponent(waLines.join("\n"));
  const MonInput=({label,value,onChange,max,color})=>(<div style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><label style={S.lbl}>{label}</label><span style={{fontSize:10,color:"#475569"}}>maks {rp(max)}</span></div><div style={{position:"relative"}}><span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:11,color:"#475569",fontFamily:"'DM Mono',monospace"}}>Rp</span><input value={value} onChange={e=>{const r=e.target.value.replace(/\D/g,"");onChange(r?parseInt(r).toString().replace(/\B(?=(\d{3})+(?!\d))/g,"."):""  );}} placeholder="0" style={{...S.inp,paddingLeft:28,fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:14,borderColor:parseMoney(value)>max?"rgba(248,113,113,.5)":parseMoney(value)>0?`${color}50`:"rgba(255,255,255,.09)"}}/></div>{parseMoney(value)>max&&<p style={{fontSize:10,color:"#F87171",marginTop:3}}>⚠ Melebihi batas</p>}{parseMoney(value)>0&&parseMoney(value)<=max&&<p style={{fontSize:10,color:"#34D399",marginTop:3}}>✓ Sisa: {rp(max-parseMoney(value))}</p>}</div>);
  const STEPS=["Form","Bukti Transfer","Kirim WA"];
  return(
    <Modal title={`TRANSFER — ${agent.label.toUpperCase()}`} onClose={onClose} width={500}>
      <div style={{display:"flex",alignItems:"center",marginBottom:20}}>
        {STEPS.map((s,i)=>{const done=step>i+1,active=step===i+1;return(<div key={s} style={{display:"flex",alignItems:"center",flex:i<2?1:"none"}}><div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}><div style={{width:26,height:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,background:done?"#22C55E":active?agent.color:"rgba(255,255,255,.06)",color:done||active?"#000":"#334155",border:`2px solid ${done?"#22C55E":active?agent.color:"rgba(255,255,255,.1)"}`,boxShadow:active?`0 0 12px ${agent.color}50`:"none"}}>{done?"✓":i+1}</div><span style={{fontSize:9,color:active?agent.color:done?"#22C55E":"#334155",letterSpacing:".06em",textTransform:"uppercase",whiteSpace:"nowrap"}}>{s}</span></div>{i<2&&<div style={{flex:1,height:2,margin:"0 6px",marginBottom:14,borderRadius:1,background:done?"#22C55E":"rgba(255,255,255,.06)"}}/>}</div>);})}
      </div>
      {step===1&&(<div style={{animation:"fadeUp .2s ease"}}>
        <div style={{display:"flex",gap:6,marginBottom:18}}>{[{v:"komisi",label:"💸 Komisi",disabled:hutang<=0},{v:"saving",label:"🏦 Saving",disabled:saldo<=0},{v:"both",label:"💸+🏦 Keduanya",disabled:hutang<=0||saldo<=0}].map(t=>(<button key={t.v} onClick={()=>!t.disabled&&setTipe(t.v)} disabled={t.disabled} style={{flex:1,padding:"8px 6px",borderRadius:9,border:"none",fontSize:11,fontWeight:700,cursor:t.disabled?"not-allowed":"pointer",background:tipe===t.v?`${agent.color}20`:"rgba(255,255,255,.04)",color:tipe===t.v?agent.color:t.disabled?"#1E293B":"#475569",borderBottom:`2px solid ${tipe===t.v?agent.color:"transparent"}`}}>{t.label}</button>))}</div>
        {(tipe==="komisi"||tipe==="both")&&<div style={{padding:"12px",background:"rgba(248,113,113,.06)",border:"1px solid rgba(248,113,113,.15)",borderRadius:10,marginBottom:12}}><MonInput label="Jumlah Komisi (Rp)" value={jKomisi} onChange={setJKomisi} max={hutang} color="#F87171"/></div>}
        {(tipe==="saving"||tipe==="both")&&<div style={{padding:"12px",background:`${agent.color}08`,border:`1px solid ${agent.color}20`,borderRadius:10,marginBottom:12}}><MonInput label="Jumlah Saving (Rp)" value={jSaving} onChange={setJSaving} max={saldo} color={agent.color}/></div>}
        {(numKom>0||numSav>0)&&<div style={{padding:"10px 14px",background:"rgba(255,255,255,.03)",borderRadius:9,display:"flex",justifyContent:"space-between",marginBottom:14}}><span style={{fontSize:12,color:"#475569"}}>Total Transfer</span><span style={{fontFamily:"'DM Mono',monospace",fontWeight:700,color:agent.color,fontSize:14}}>{rp(numKom+numSav)}</span></div>}
        <div style={{marginBottom:16}}><label style={S.lbl}>Keterangan (opsional)</label><input value={ket} onChange={e=>setKet(e.target.value)} style={S.inp} placeholder="Transfer komisi & saving..."/></div>
        <div style={{display:"flex",gap:10}}><button onClick={onClose} style={{flex:1,padding:"11px",borderRadius:10,border:"1px solid rgba(255,255,255,.1)",background:"transparent",color:"#64748B",fontSize:13,fontWeight:600,cursor:"pointer"}}>Batal</button><button onClick={()=>setStep(2)} disabled={!valid} style={{flex:2,padding:"11px",borderRadius:10,border:"none",background:valid?`linear-gradient(135deg,${agent.color},${agent.color}CC)`:"#1E293B",color:valid?"#000":"#334155",fontSize:13,fontWeight:700,cursor:valid?"pointer":"not-allowed"}}>Lanjut → Upload Bukti</button></div>
      </div>)}
      {step===2&&(<div style={{animation:"fadeUp .2s ease"}}>
        <label style={S.lbl}>Upload Bukti Transfer</label>
        <div onClick={()=>fileRef.current.click()} onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)setBukti({file:f,url:URL.createObjectURL(f),name:f.name});}} onDragOver={e=>e.preventDefault()} style={{border:`2px dashed ${bukti?agent.color:"rgba(255,255,255,.1)"}`,borderRadius:12,padding:"20px 16px",textAlign:"center",cursor:"pointer",marginBottom:14,background:bukti?`${agent.color}06`:"rgba(255,255,255,.02)"}}>
          <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={e=>{const f=e.target.files[0];if(f)setBukti({file:f,url:URL.createObjectURL(f),name:f.name});}} style={{display:"none"}}/>
          {bukti?(<div>{bukti.file.type.startsWith("image/")?<img src={bukti.url} alt="bukti" style={{maxHeight:150,maxWidth:"100%",borderRadius:8,marginBottom:8,objectFit:"contain"}}/>:<div style={{fontSize:36,marginBottom:8}}>📄</div>}<p style={{fontSize:12,color:agent.color,fontWeight:600}}>{bukti.name}</p></div>):(<div><div style={{fontSize:36,marginBottom:8,opacity:.4}}>📎</div><p style={{fontSize:13,color:"#64748B"}}>Klik atau drag bukti transfer</p></div>)}
        </div>
        <div style={{display:"flex",gap:10}}><button onClick={()=>setStep(1)} style={{flex:1,padding:"11px",borderRadius:10,border:"1px solid rgba(255,255,255,.1)",background:"transparent",color:"#64748B",fontSize:13,fontWeight:600,cursor:"pointer"}}>← Kembali</button><button onClick={handleConfirm} disabled={!bukti||loading} style={{flex:2,padding:"11px",borderRadius:10,border:"none",background:bukti&&!loading?`linear-gradient(135deg,${agent.color},${agent.color}CC)`:"#1E293B",color:bukti&&!loading?"#000":"#334155",fontSize:13,fontWeight:700,cursor:bukti&&!loading?"pointer":"not-allowed"}}>{loading?"⏳ Memproses...":"✓ Konfirmasi & Simpan"}</button></div>
      </div>)}
      {step===3&&(<div style={{animation:"fadeUp .2s ease",textAlign:"center"}}>
        <div style={{width:60,height:60,borderRadius:"50%",background:"rgba(34,197,94,.15)",border:"2px solid #22C55E",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,margin:"0 auto 14px"}}>✓</div>
        <p style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,letterSpacing:".1em",color:"#E2E8F0",marginBottom:4}}>Transfer Dicatat!</p>
        <p style={{fontSize:12,color:"#475569",marginBottom:16}}>Total: <strong style={{color:agent.color}}>{rp(numKom+numSav)}</strong> ke {agent.label}</p>
        <button onClick={()=>window.open(`https://wa.me/${agent.wa}?text=${waText}`,"_blank")} style={{width:"100%",padding:"13px",borderRadius:11,border:"none",background:"linear-gradient(135deg,#25D366,#128C7E)",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:8}}>📱 Kirim WA ke {agent.label}</button>
        <button onClick={onClose} style={{width:"100%",padding:"9px",borderRadius:10,border:"1px solid rgba(255,255,255,.08)",background:"transparent",color:"#475569",fontSize:12,fontWeight:600,cursor:"pointer"}}>Tutup</button>
      </div>)}
    </Modal>
  );
}

function EditRecordModal({rec, onSave, onClose}) {
  const isFee=rec.type==="fee", isProm=rec.type==="promo", isWd=rec.type==="withdraw"||rec.type==="komisi";
  const [form,setForm]=useState({...rec});
  const [bukti,setBukti]=useState(null); // {file, url, name}
  const [uploading,setUploading]=useState(false);
  const fileRef=useRef();

  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const setMon=k=>e=>{const r=e.target.value.replace(/\D/g,"");set(k,r?parseInt(r).toString().replace(/\B(?=(\d{3})+(?!\d))/g,".") :"");};
  const num=k=>parseFloat(String(form[k]).replace(/[^0-9]/g,""))||0;

  const save=async()=>{
    setUploading(true);
    const updated={...form};

    // Upload bukti baru jika ada
    if(bukti?.file) {
      const url = await uploadBuktiToGAS(bukti.file);
      updated.buktiName = bukti.name;
      updated.buktiUrl  = url;
    }

    if(isFee){
      const net=num("feeLariz")-num("feeAgentBT");
      const bdb=net*.4,aris=net*.225,argo=net*.225,darma=net*.15;
      Object.assign(updated,{feeLariz:num("feeLariz"),feeAgentBT:num("feeAgentBT"),
        netCommission:net,bdb,aris,argo,darma,
        opBdb:bdb*.7,savingAris:bdb*.1,savingArgo:bdb*.1,savingDarma:bdb*.1});
    }
    if(isProm) updated.jumlah=num("jumlah");
    if(isWd)   updated.jumlah=num("jumlah");

    setUploading(false);
    onSave(updated);
  };

  const typeColor=isFee?"#34D399":isProm?"#F87171":"#F59E0B";
  const typeLabel=isFee?"FEE":isProm?"PROMO":"TARIK";
  const hasUrl = !!form.buktiUrl && form.buktiUrl.startsWith("http");

  return(
    <Modal title="EDIT TRANSAKSI" onClose={onClose} width={500}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:18}}>
        <span style={{padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:700,
          background:`${typeColor}15`,color:typeColor,border:`1px solid ${typeColor}30`}}>{typeLabel}</span>
        <span style={{fontSize:12,color:"#475569"}}>ID: {rec.id}</span>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {/* Tanggal */}
        <div>
          <label style={S.lbl}>Tanggal</label>
          <input type="date" value={form.tanggal||""} onChange={e=>set("tanggal",e.target.value)} style={S.inp}/>
        </div>

        {/* Field khusus FEE */}
        {isFee&&<>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><label style={S.lbl}>Nama Dev</label><input value={form.namaDev||""} onChange={e=>set("namaDev",e.target.value)} style={S.inp}/></div>
            <div><label style={S.lbl}>Nama Konsumen</label><input value={form.namaKonsumen||""} onChange={e=>set("namaKonsumen",e.target.value)} style={S.inp}/></div>
          </div>
          <div><label style={S.lbl}>Fee Lariz (Rp)</label><div style={{position:"relative"}}><span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:11,color:"#475569",fontFamily:"'DM Mono',monospace"}}>Rp</span><input value={form.feeLariz||""} onChange={setMon("feeLariz")} style={{...S.inp,paddingLeft:28}}/></div></div>
          <div><label style={S.lbl}>Fee Agent BT (Rp)</label><div style={{position:"relative"}}><span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:11,color:"#475569",fontFamily:"'DM Mono',monospace"}}>Rp</span><input value={form.feeAgentBT||""} onChange={setMon("feeAgentBT")} style={{...S.inp,paddingLeft:28}}/></div></div>
          <div style={{padding:"10px 12px",background:"rgba(99,102,241,.08)",border:"1px solid rgba(99,102,241,.2)",borderRadius:9,display:"flex",justifyContent:"space-between"}}>
            <span style={{fontSize:12,color:"#64748B"}}>Net Commission</span>
            <span style={{fontFamily:"'DM Mono',monospace",color:"#818CF8",fontWeight:700,fontSize:13}}>{rp(num("feeLariz")-num("feeAgentBT"))}</span>
          </div>
          <div><label style={S.lbl}>Keterangan</label><textarea value={form.keterangan||""} onChange={e=>set("keterangan",e.target.value)} style={{...S.inp,minHeight:50,resize:"vertical"}}/></div>
        </>}

        {/* Field khusus PROMO & WITHDRAW */}
        {(isProm||isWd)&&<>
          <div><label style={S.lbl}>Keterangan</label><input value={form.keterangan||""} onChange={e=>set("keterangan",e.target.value)} style={S.inp}/></div>
          <div><label style={S.lbl}>Jumlah (Rp)</label><div style={{position:"relative"}}><span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:11,color:"#475569",fontFamily:"'DM Mono',monospace"}}>Rp</span><input value={form.jumlah||""} onChange={setMon("jumlah")} style={{...S.inp,paddingLeft:28}}/></div></div>

          {/* ✅ Upload Bukti */}
          <div>
            <label style={S.lbl}>Bukti Transfer</label>

            {/* Bukti lama */}
            {form.buktiName && !bukti && (
              <div style={{marginBottom:8,padding:"8px 12px",background:"rgba(255,255,255,.03)",
                border:"1px solid rgba(255,255,255,.07)",borderRadius:9,
                display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:11,color:"#64748B",marginBottom:2}}>Bukti saat ini:</div>
                  <div style={{fontSize:12,color:"#CBD5E1",fontWeight:600}}>{form.buktiName}</div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  {hasUrl && (
                    <button onClick={()=>window.open(form.buktiUrl,"_blank")}
                      style={{padding:"4px 10px",borderRadius:6,border:"1px solid rgba(99,102,241,.3)",
                        background:"rgba(99,102,241,.1)",color:"#818CF8",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                      🔍 Lihat
                    </button>
                  )}
                  <button onClick={()=>set("buktiName","")}
                    style={{padding:"4px 10px",borderRadius:6,border:"1px solid rgba(248,113,113,.3)",
                      background:"rgba(248,113,113,.08)",color:"#F87171",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                    ✕ Hapus
                  </button>
                </div>
              </div>
            )}

            {/* Upload baru */}
            <input ref={fileRef} type="file" accept="image/*,.pdf"
              onChange={e=>{const f=e.target.files[0];if(f)setBukti({file:f,url:URL.createObjectURL(f),name:f.name});}}
              style={{display:"none"}}/>
            <div
              onClick={()=>fileRef.current.click()}
              onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)setBukti({file:f,url:URL.createObjectURL(f),name:f.name});}}
              onDragOver={e=>e.preventDefault()}
              style={{border:`2px dashed ${bukti?typeColor:"rgba(255,255,255,.1)"}`,borderRadius:10,
                padding:"14px 12px",textAlign:"center",cursor:"pointer",transition:"all .2s",
                background:bukti?`${typeColor}06`:"rgba(255,255,255,.02)"}}>
              {bukti?(
                <div>
                  {bukti.file.type.startsWith("image/")?
                    <img src={bukti.url} alt="bukti" style={{maxHeight:120,maxWidth:"100%",borderRadius:7,marginBottom:6,objectFit:"contain"}}/>
                    :<div style={{fontSize:32,marginBottom:6}}>📄</div>
                  }
                  <p style={{fontSize:12,color:typeColor,fontWeight:600}}>{bukti.name}</p>
                  <p style={{fontSize:10,color:"#475569",marginTop:3}}>Klik untuk ganti</p>
                </div>
              ):(
                <div>
                  <div style={{fontSize:24,opacity:.4,marginBottom:6}}>📎</div>
                  <p style={{fontSize:12,color:"#64748B"}}>{form.buktiName?"Klik untuk ganti bukti":"Klik atau drag bukti baru"}</p>
                  <p style={{fontSize:10,color:"#334155",marginTop:3}}>JPG, PNG, PDF</p>
                </div>
              )}
            </div>
            {bukti&&(
              <button onClick={()=>setBukti(null)}
                style={{marginTop:6,padding:"4px 10px",borderRadius:6,
                  border:"1px solid rgba(248,113,113,.3)",background:"rgba(248,113,113,.08)",
                  color:"#F87171",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                ✕ Batal ganti bukti
              </button>
            )}
          </div>
        </>}
      </div>

      <div style={{display:"flex",gap:10,marginTop:20}}>
        <button onClick={onClose} style={{flex:1,padding:"11px",borderRadius:10,
          border:"1px solid rgba(255,255,255,.1)",background:"transparent",
          color:"#64748B",fontSize:13,fontWeight:600,cursor:"pointer"}}>Batal</button>
        <button onClick={save} disabled={uploading} style={{flex:2,padding:"11px",borderRadius:10,border:"none",
          background:uploading?"#1E293B":"linear-gradient(135deg,#6366F1,#4F46E5)",
          color:uploading?"#334155":"#fff",fontSize:13,fontWeight:700,cursor:uploading?"not-allowed":"pointer",
          boxShadow:uploading?"none":"0 4px 16px rgba(99,102,241,.3)"}}>
          {uploading?"⏳ Mengupload bukti...":"💾 Simpan Perubahan"}
        </button>
      </div>
    </Modal>
  );
}

const S={
  lbl:{display:"block",fontSize:10,fontWeight:700,letterSpacing:".1em",color:"#374151",marginBottom:5,textTransform:"uppercase"},
  inp:{width:"100%",padding:"9px 12px",background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.09)",borderRadius:9,color:"#E2E8F0",fontSize:13,outline:"none"},
  td:{padding:"11px 14px",verticalAlign:"middle"},
  saveBtn:(dis)=>({width:"100%",padding:"12px",borderRadius:10,border:"none",background:dis?"#1E293B":"linear-gradient(135deg,#6366F1,#4F46E5)",color:dis?"#334155":"#fff",fontSize:14,fontWeight:700,cursor:dis?"not-allowed":"pointer",boxShadow:dis?"none":"0 4px 16px rgba(99,102,241,.35)"}),
};

const SectionTitle=({children,nomb})=>(<div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,letterSpacing:".12em",color:"#94A3B8",marginBottom:nomb?0:14}}>{children}</div>);
const Panel=({title,accent,children})=>(<div style={{background:"rgba(255,255,255,.025)",border:"1px solid rgba(255,255,255,.07)",borderRadius:14,padding:18,position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:0,left:0,right:0,height:3,background:accent,borderRadius:"14px 14px 0 0"}}/><p style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:12,letterSpacing:".12em",color:"#4B5563",marginBottom:14,marginTop:2}}>{title}</p>{children}</div>);
const Fld=({label,children})=><div style={{marginBottom:12}}><label style={S.lbl}>{label}</label>{children}</div>;
const MoneyFld=({label,value,onChange})=>(<div style={{marginBottom:12}}><label style={S.lbl}>{label}</label><div style={{position:"relative"}}><span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:11,color:"#475569",fontFamily:"'DM Mono',monospace"}}>Rp</span><input value={value} onChange={onChange} style={{...S.inp,paddingLeft:28}} placeholder="0"/></div></div>);
const AlcRow=({label,value,accent,green,red})=>(<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",borderRadius:8,background:"rgba(255,255,255,.025)",marginBottom:5}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:3,height:22,borderRadius:2,background:red?"#F87171":accent||"#34D399"}}/><span style={{fontSize:12,color:"#94A3B8"}}>{label}</span></div><span style={{fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:700,color:red?"#F87171":"#34D399"}}>{red?"- ":""}{rp(value)}</span></div>);

function SaldoTable({data,filterAgent,onDelete,onEdit}) {
  const [checked,setChecked]=useState({}); const [hoverId,setHoverId]=useState(null);
  const n=v=>parseFloat(String(v).replace(/[^0-9.-]/g,""))||0;
  const rows=data.map(r=>{
    if(r.type==="fee")return{id:r.id,tanggal:r.tanggal,desc:`${r.namaDev||""} / ${r.namaKonsumen||""}`,type:"fee",in:n(r.feeLariz)||n(r.fee)||0,out:n(r.feeAgentBT)||0,net:(n(r.netCommission)||(n(r.feeLariz)-n(r.feeAgentBT))||0),color:"#34D399",badge:"FEE",raw:r};
    if(r.type==="promo")return{id:r.id,tanggal:r.tanggal,desc:r.keterangan,type:"promo",in:0,out:n(r.jumlah),net:-n(r.jumlah),color:"#F87171",badge:"PROMO",raw:r};
    if(r.type==="withdraw")return{id:r.id,tanggal:r.tanggal,desc:`Tarik Saving — ${r.agent?.charAt(0).toUpperCase()+r.agent?.slice(1)}`,type:"withdraw",in:0,out:n(r.jumlah),net:-n(r.jumlah),color:"#F59E0B",badge:"SAVING",raw:r};
    if(r.type==="komisi")return{id:r.id,tanggal:r.tanggal,desc:`Transfer Komisi — ${r.agent?.charAt(0).toUpperCase()+r.agent?.slice(1)}`,type:"komisi",in:0,out:n(r.jumlah),net:-n(r.jumlah),color:"#F87171",badge:"KOMISI",raw:r};
    return null;
  }).filter(Boolean);
  const filtered=filterAgent==="all"?rows:rows.filter(r=>r.type==="fee"||r.type==="promo"||(r.type==="withdraw"&&r.desc.toLowerCase().includes(filterAgent)));
  let runBalance=0;
  const rowsWithBalance=[...filtered].reverse().map(r=>{runBalance+=r.net;return{...r,balance:runBalance};}).reverse();
  const totalIn=filtered.reduce((s,r)=>s+r.in,0),totalOut=filtered.reduce((s,r)=>s+r.out,0);
  const checkedIds=Object.keys(checked).filter(k=>checked[k]);
  const allChecked=filtered.length>0&&checkedIds.length===filtered.length;
  const someChecked=checkedIds.length>0&&!allChecked;
  const toggleAll=()=>{if(allChecked)setChecked({});else{const n={};filtered.forEach(r=>n[r.id]=true);setChecked(n);}};
  const toggleOne=id=>setChecked(c=>({...c,[id]:!c[id]}));
  return(
    <div>
      {checkedIds.length>0&&(<div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.25)",borderRadius:10,marginBottom:10,flexWrap:"wrap"}}><span style={{fontSize:13,fontWeight:600,color:"#F87171"}}>{checkedIds.length} transaksi dipilih</span><div style={{flex:1}}/><button onClick={()=>setChecked({})} style={{padding:"5px 12px",borderRadius:7,border:"1px solid rgba(255,255,255,.1)",background:"transparent",color:"#64748B",fontSize:12,fontWeight:600,cursor:"pointer"}}>Batal</button><button onClick={()=>{onDelete&&onDelete(checkedIds,true);setChecked({});}} style={{padding:"5px 14px",borderRadius:7,border:"none",background:"linear-gradient(135deg,#EF4444,#DC2626)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>🗑 Hapus {checkedIds.length} data</button></div>)}
      <div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.06)",borderRadius:16,overflow:"hidden"}}>
        <div className="table-scroll">
          <table style={{width:"100%",minWidth:600,borderCollapse:"collapse",fontSize:13}}>
            <thead><tr style={{background:"rgba(255,255,255,.03)",borderBottom:"1px solid rgba(255,255,255,.06)"}}><th style={{padding:"10px 14px",width:40}}><div onClick={toggleAll} style={{width:16,height:16,borderRadius:4,cursor:"pointer",background:allChecked?"#6366F1":someChecked?"rgba(99,102,241,.4)":"transparent",border:`2px solid ${allChecked||someChecked?"#6366F1":"rgba(255,255,255,.15)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff"}}>{allChecked?"✓":someChecked?"–":""}</div></th>{["Tanggal","Keterangan","Tipe","Pendapatan","Pengeluaran","Saldo","Aksi"].map(h=>(<th key={h} style={{padding:"10px 10px",textAlign:"left",fontSize:10,fontWeight:700,letterSpacing:".1em",color:"#334155",textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>))}</tr></thead>
            <tbody>
              {rowsWithBalance.map((r,i)=>{const isChecked=!!checked[r.id],isHover=hoverId===r.id;return(<tr key={r.id||i} onMouseEnter={()=>setHoverId(r.id)} onMouseLeave={()=>setHoverId(null)} style={{borderBottom:"1px solid rgba(255,255,255,.04)",background:isChecked?"rgba(99,102,241,.08)":isHover?"rgba(255,255,255,.04)":i%2===0?"transparent":"rgba(255,255,255,.012)"}}><td style={{padding:"10px 14px"}}><div onClick={()=>toggleOne(r.id)} style={{width:16,height:16,borderRadius:4,cursor:"pointer",background:isChecked?"#6366F1":"transparent",border:`2px solid ${isChecked?"#6366F1":"rgba(255,255,255,.15)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff"}}>{isChecked?"✓":""}</div></td><td style={S.td}><span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#475569",whiteSpace:"nowrap"}}>{fmtDate(r.tanggal)}</span></td><td style={{...S.td,maxWidth:200}}><span style={{color:"#CBD5E1",fontWeight:500,display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.desc}</span></td><td style={S.td}><span style={{padding:"2px 8px",borderRadius:99,fontSize:10,fontWeight:700,background:`${r.color}15`,color:r.color,border:`1px solid ${r.color}30`}}>{r.badge}</span></td><td style={S.td}><span style={{fontFamily:"'DM Mono',monospace",color:"#34D399",fontWeight:600,whiteSpace:"nowrap"}}>{r.in>0?rp(r.in):"—"}</span></td><td style={S.td}><span style={{fontFamily:"'DM Mono',monospace",color:"#F87171",fontWeight:600,whiteSpace:"nowrap"}}>{r.out>0?rp(r.out):"—"}</span></td><td style={S.td}><span style={{fontFamily:"'DM Mono',monospace",fontWeight:700,whiteSpace:"nowrap",color:r.balance>=0?"#6EE7B7":"#FCA5A5"}}>{rp(r.balance)}</span></td><td style={{...S.td,whiteSpace:"nowrap"}}><div style={{display:"flex",gap:5,opacity:isHover||isChecked?1:.3}}><button onClick={()=>onEdit&&onEdit(r.raw)} style={{width:28,height:28,borderRadius:7,border:"1px solid rgba(99,102,241,.3)",background:"rgba(99,102,241,.1)",color:"#818CF8",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>✏️</button><button onClick={()=>onDelete&&onDelete([r.id],false)} style={{width:28,height:28,borderRadius:7,border:"1px solid rgba(239,68,68,.3)",background:"rgba(239,68,68,.1)",color:"#F87171",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>🗑</button></div></td></tr>);})}
              {rowsWithBalance.length===0&&<tr><td colSpan={8} style={{padding:40,textAlign:"center",color:"#334155"}}><div style={{fontSize:28,marginBottom:8}}>📭</div>Belum ada data.</td></tr>}
            </tbody>
            <tfoot><tr style={{background:"rgba(255,255,255,.04)",borderTop:"2px solid rgba(255,255,255,.1)"}}><td colSpan={4} style={{padding:"11px 14px",fontSize:11,fontWeight:700,letterSpacing:".1em",color:"#334155",textTransform:"uppercase"}}>TOTAL ({filtered.length} transaksi)</td><td style={S.td}><span style={{fontFamily:"'DM Mono',monospace",fontWeight:700,color:"#34D399",fontSize:13}}>{rp(totalIn)}</span></td><td style={S.td}><span style={{fontFamily:"'DM Mono',monospace",fontWeight:700,color:"#F87171",fontSize:13}}>{rp(totalOut)}</span></td><td style={S.td}><span style={{fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:13,color:(totalIn-totalOut)>=0?"#6EE7B7":"#FCA5A5"}}>{rp(totalIn-totalOut)}</span></td><td/></tr></tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

function FullHistoryTable({data,agents,onDelete,onEdit}) {
  const [expanded,setExpanded]=useState(null); const [checked,setChecked]=useState({}); const [hoverId,setHoverId]=useState(null);
  const checkedIds=Object.keys(checked).filter(k=>checked[k]);
  const allChecked=data.length>0&&checkedIds.length===data.length;
  const someChecked=checkedIds.length>0&&!allChecked;
  const toggleAll=()=>{if(allChecked)setChecked({});else{const n={};data.forEach(r=>n[r.id]=true);setChecked(n);}};
  const toggleOne=id=>setChecked(c=>({...c,[id]:!c[id]}));
  return(
    <div>
      {checkedIds.length>0&&(<div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.25)",borderRadius:10,marginBottom:10,flexWrap:"wrap"}}><span style={{fontSize:13,fontWeight:600,color:"#F87171"}}>{checkedIds.length} transaksi dipilih</span><div style={{flex:1}}/><button onClick={()=>setChecked({})} style={{padding:"5px 12px",borderRadius:7,border:"1px solid rgba(255,255,255,.1)",background:"transparent",color:"#64748B",fontSize:12,fontWeight:600,cursor:"pointer"}}>Batal</button><button onClick={()=>{onDelete&&onDelete(checkedIds,true);setChecked({});}} style={{padding:"5px 14px",borderRadius:7,border:"none",background:"linear-gradient(135deg,#EF4444,#DC2626)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>🗑 Hapus {checkedIds.length} data</button></div>)}
      <div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.06)",borderRadius:16,overflow:"hidden"}}>
        <div className="table-scroll">
          <table style={{width:"100%",minWidth:620,borderCollapse:"collapse",fontSize:13}}>
            <thead><tr style={{background:"rgba(255,255,255,.03)",borderBottom:"1px solid rgba(255,255,255,.06)"}}><th style={{padding:"10px 14px",width:40}}><div onClick={toggleAll} style={{width:16,height:16,borderRadius:4,cursor:"pointer",background:allChecked?"#6366F1":someChecked?"rgba(99,102,241,.4)":"transparent",border:`2px solid ${allChecked||someChecked?"#6366F1":"rgba(255,255,255,.15)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff"}}>{allChecked?"✓":someChecked?"–":""}</div></th>{["Tanggal","Tipe","Detail","Jumlah Utama","Net / Alokasi","Aksi"].map(h=>(<th key={h} style={{padding:"10px 10px",textAlign:"left",fontSize:10,fontWeight:700,letterSpacing:".1em",color:"#334155",textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>))}</tr></thead>
            <tbody>
              {data.map((r,i)=>{
                const isExp=expanded===i,isFee=r.type==="fee",isPromo=r.type==="promo",isWd=r.type==="withdraw"||r.type==="komisi";
                const typeInfo=isFee?{label:"FEE",color:"#34D399"}:isPromo?{label:"PROMO",color:"#F87171"}:{label:"TARIK",color:"#F59E0B"};
                const ag=isWd?agents.find(a=>a.id===r.agent):null;
                const isChecked=!!checked[r.id],isHover=hoverId===r.id;
                return(<React.Fragment key={r.id||i}>
                  <tr onMouseEnter={()=>setHoverId(r.id)} onMouseLeave={()=>setHoverId(null)} style={{borderBottom:"1px solid rgba(255,255,255,.04)",background:isChecked?"rgba(99,102,241,.08)":isHover?"rgba(255,255,255,.04)":isExp?"rgba(99,102,241,.06)":i%2===0?"transparent":"rgba(255,255,255,.012)"}}>
                    <td style={{padding:"10px 14px"}}><div onClick={()=>toggleOne(r.id)} style={{width:16,height:16,borderRadius:4,cursor:"pointer",background:isChecked?"#6366F1":"transparent",border:`2px solid ${isChecked?"#6366F1":"rgba(255,255,255,.15)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff"}}>{isChecked?"✓":""}</div></td>
                    <td style={S.td}><span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#475569",whiteSpace:"nowrap"}}>{fmtDate(r.tanggal)}</span></td>
                    <td style={S.td}><span style={{padding:"2px 8px",borderRadius:99,fontSize:10,fontWeight:700,background:`${typeInfo.color}15`,color:typeInfo.color,border:`1px solid ${typeInfo.color}30`}}>{typeInfo.label}</span></td>
                    <td style={{...S.td,maxWidth:220}}>{isFee&&<><span style={{fontWeight:600,color:"#CBD5E1"}}>{r.namaDev}</span><span style={{color:"#475569"}}> / {r.namaKonsumen}</span></>}{isPromo&&<span style={{color:"#94A3B8"}}>{r.keterangan}</span>}{isWd&&<span style={{color:"#94A3B8"}}>Tarik — <strong style={{color:ag?.color||"#E2E8F0"}}>{r.agent}</strong> · {r.keterangan}</span>}</td>
                    <td style={S.td}><span style={{fontFamily:"'DM Mono',monospace",fontWeight:700,color:isFee?"#34D399":"#F87171",fontSize:13,whiteSpace:"nowrap"}}>{isFee?rp(r.feeLariz):`- ${rp(r.jumlah)}`}</span></td>
                    <td style={S.td}><div style={{display:"flex",alignItems:"center",gap:6}}>{isFee&&<span style={{fontFamily:"'DM Mono',monospace",color:"#818CF8",fontSize:13}}>{rp(r.netCommission)}</span>}{isWd&&<span style={{fontFamily:"'DM Mono',monospace",color:"#F59E0B",fontSize:13}}>{rp(r.jumlah)}</span>}<button onClick={()=>setExpanded(isExp?null:i)} style={{padding:"2px 7px",borderRadius:5,border:"1px solid rgba(255,255,255,.1)",background:isExp?"rgba(255,255,255,.06)":"transparent",color:"#475569",fontSize:10,cursor:"pointer"}}>{isExp?"▲":"▼"}</button></div></td>
                    <td style={{...S.td,whiteSpace:"nowrap"}}><div style={{display:"flex",gap:5,opacity:isHover||isChecked?1:.25}}><button onClick={()=>onEdit&&onEdit(r)} style={{width:28,height:28,borderRadius:7,border:"1px solid rgba(99,102,241,.3)",background:"rgba(99,102,241,.1)",color:"#818CF8",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>✏️</button><button onClick={()=>onDelete&&onDelete([r.id],false)} style={{width:28,height:28,borderRadius:7,border:"1px solid rgba(239,68,68,.3)",background:"rgba(239,68,68,.1)",color:"#F87171",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>🗑</button></div></td>
                  </tr>
                  {isExp&&(<tr style={{background:isFee?"rgba(99,102,241,.04)":isPromo?"rgba(239,68,68,.04)":"rgba(245,158,11,.04)",borderBottom:"1px solid rgba(255,255,255,.04)"}}><td colSpan={7} style={{padding:"14px 18px"}}><div style={{animation:"fadeUp .2s ease"}}>
                    {isFee&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8}}>{[["Fee BT",r.feeAgentBT,"#F87171"],["BDB 40%",r.bdb,"#F59E0B"],["Aris 22.5%",r.aris,"#22D3EE"],["Argo 22.5%",r.argo,"#F59E0B"],["Darma 15%",r.darma,"#A78BFA"],["Operasional",r.opBdb,"#34D399"],["Saving Aris",r.savingAris,"#22D3EE"],["Saving Argo",r.savingArgo,"#F59E0B"],["Saving Darma",r.savingDarma,"#A78BFA"]].map(([l,v,c])=>(<div key={l} style={{background:"rgba(255,255,255,.03)",borderRadius:8,padding:"7px 10px"}}><div style={{fontSize:9,color:"#334155",textTransform:"uppercase",letterSpacing:".07em"}}>{l}</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:c,fontWeight:600}}>{rp(v)}</div></div>))}</div>}
                    {isPromo&&<div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"flex-start"}}><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:8,flex:1}}>{[["Tanggal",fmtDate(r.tanggal),"#64748B"],["Keterangan",r.keterangan||"—","#CBD5E1"],["Jumlah",rp(r.jumlah),"#F87171"]].map(([l,v,c])=>(<div key={l} style={{background:"rgba(255,255,255,.03)",borderRadius:8,padding:"7px 10px"}}><div style={{fontSize:9,color:"#334155",textTransform:"uppercase",letterSpacing:".07em"}}>{l}</div><div style={{fontSize:12,color:c}}>{v}</div></div>))}</div><BuktiThumb buktiName={r.buktiName} buktiUrl={r.buktiUrl} color="#F87171"/></div>}
                    {isWd&&<div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"flex-start"}}><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:8,flex:1}}>{[["Tanggal",fmtDate(r.tanggal),"#64748B"],["Agen",r.agent||"—",ag?.color||"#E2E8F0"],["Jumlah",rp(r.jumlah),"#F59E0B"],["Keterangan",r.keterangan||"—","#94A3B8"]].map(([l,v,c])=>(<div key={l} style={{background:"rgba(255,255,255,.03)",borderRadius:8,padding:"7px 10px"}}><div style={{fontSize:9,color:"#334155",textTransform:"uppercase",letterSpacing:".07em"}}>{l}</div><div style={{fontSize:12,color:c}}>{v}</div></div>))}</div><BuktiThumb buktiName={r.buktiName} buktiUrl={r.buktiUrl} color={ag?.color||"#F59E0B"}/></div>}
                  </div></td></tr>)}
                </React.Fragment>);
              })}
              {data.length===0&&<tr><td colSpan={7} style={{padding:40,textAlign:"center",color:"#334155"}}><div style={{fontSize:28,marginBottom:8}}>📭</div>Belum ada data.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({user,onLogout,refreshPwdMap}) {
  const [tab,setTab]=useState("overview"); const [showChangePwd,setShowChangePwd]=useState(false);
  const [data,setData]=useState([]); const [loading,setLoading]=useState(false); const [toasts,setToasts]=useState([]);
  const [transferModal,setTransferModal]=useState(null); const [filterAgent,setFilterAgent]=useState("all"); const [editModal,setEditModal]=useState(null);
  const [feeForm,setFeeForm]=useState({namaDev:"",namaKonsumen:"",tanggal:new Date().toISOString().split("T")[0],feeLariz:"",promo:"",feeAgentBT:"",keterangan:""});
  const [savingFee,setSavingFee]=useState(false);
  const [promoForm,setPromoForm]=useState({tanggal:new Date().toISOString().split("T")[0],keterangan:"",jumlah:""});
  const [promoBukti,setPromoBukti]=useState(null); const promoBuktiRef=useRef(); const [savingPromo,setSavingPromo]=useState(false);

  const addToast=(msg,type="success")=>{const id=Date.now();setToasts(t=>[...t,{id,msg,type}]);setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3500);};

  const fetchData=async()=>{
    setLoading(true);
    try{const json=await gasGet({action:"getAll"});if(json.status==="ok")setData(json.records||[]);else addToast("Gagal load data","error");}
    catch(e){addToast("Gagal terhubung ke server","error");}
    setLoading(false);
  };

  useEffect(()=>{fetchData();},[]);

  const feeRecords=data.filter(r=>r.type==="fee"); const promoRecords=data.filter(r=>r.type==="promo");
  const withdrawRecs=data.filter(r=>r.type==="withdraw"); const komisiRecs=data.filter(r=>r.type==="komisi");
  const pN=v=>parseFloat(String(v).replace(/[^0-9.-]/g,""))||0;
  const totalFeeIn=feeRecords.reduce((s,r)=>s+pN(r.feeLariz),0);
  const totalNetComm=feeRecords.reduce((s,r)=>s+pN(r.netCommission),0);
  const totalPromoOut=promoRecords.reduce((s,r)=>s+pN(r.jumlah),0);
  const totalFeeAgentBT=feeRecords.reduce((s,r)=>s+pN(r.feeAgentBT),0);
  const totalWithdraw=withdrawRecs.reduce((s,r)=>s+pN(r.jumlah),0);
  const agentSaldo=AGENTS.map(ag=>{
    const totalKomisi=feeRecords.reduce((s,r)=>s+pN(r[ag.feeField]),0);
    const totalSaving=feeRecords.reduce((s,r)=>s+pN(r[ag.savingField]),0);
    const sudahTransferKom=komisiRecs.filter(w=>w.agent===ag.id).reduce((s,r)=>s+pN(r.jumlah),0);
    const sudahTransferSav=withdrawRecs.filter(w=>w.agent===ag.id).reduce((s,r)=>s+pN(r.jumlah),0);
    return{...ag,totalKomisi,totalSaving,sudahTransferKom,sudahTransferSav,hutangKomisi:totalKomisi-sudahTransferKom,saldoSaving:totalSaving-sudahTransferSav,saldo:totalSaving-sudahTransferSav};
  });
  const totalHutangKom=agentSaldo.reduce((s,a)=>s+a.hutangKomisi,0);
  const totalOpBdb=feeRecords.reduce((s,r)=>s+pN(r.opBdb),0);
  const saldoBDB=totalOpBdb-totalPromoOut;
  const feeNums={fee:parseMoney(feeForm.feeLariz),promo:parseMoney(feeForm.promo),feeAgentBT:parseMoney(feeForm.feeAgentBT)};
  const feeCalc=calcFee(feeNums.fee,feeNums.promo,feeNums.feeAgentBT);
  const setMoney=(form,setter,field)=>(e)=>{const raw=e.target.value.replace(/\D/g,"");setter(f=>({...f,[field]:raw?parseInt(raw).toString().replace(/\B(?=(\d{3})+(?!\d))/g,"."):""  }));};

  const saveFee=async()=>{
    if(!feeForm.namaDev||!feeForm.feeLariz){addToast("Nama Dev & Fee Lariz wajib diisi!","error");return;}
    setSavingFee(true);
    const newRec={id:"t"+Date.now(),type:"fee",tanggal:feeForm.tanggal,namaDev:feeForm.namaDev,namaKonsumen:feeForm.namaKonsumen,...feeCalc,keterangan:feeForm.keterangan};
    try{await gasPost({action:"addFee",...newRec});}catch{}
    setData(d=>[newRec,...d]);
    setFeeForm({namaDev:"",namaKonsumen:"",tanggal:new Date().toISOString().split("T")[0],feeLariz:"",promo:"",feeAgentBT:"",keterangan:""});
    addToast("Fee berhasil disimpan!");setSavingFee(false);setTab("overview");
    setTimeout(()=>fetchData(),1500);
  };

  const savePromo=async()=>{
    if(!promoForm.keterangan||!promoForm.jumlah){addToast("Keterangan & jumlah wajib diisi!","error");return;}
    setSavingPromo(true);
    const buktiUrl=promoBukti?await uploadBuktiToGAS(promoBukti.file):"";
    const newRec={id:"p"+Date.now(),type:"promo",tanggal:promoForm.tanggal,keterangan:promoForm.keterangan,jumlah:parseMoney(promoForm.jumlah),buktiName:promoBukti?promoBukti.name:"",buktiUrl};
    try{await gasPost({action:"addPromo",...newRec});}catch{}
    setData(d=>[newRec,...d]);
    setPromoForm({tanggal:new Date().toISOString().split("T")[0],keterangan:"",jumlah:""});setPromoBukti(null);
    addToast("Pengeluaran berhasil dicatat!");setSavingPromo(false);setTab("overview");
  };

  const handleWithdraw=async({agent,jumlah,keterangan,buktiName="",buktiFile=null})=>{
    const buktiUrl=buktiFile?await uploadBuktiToGAS(buktiFile):"";
    const newRec={id:"w"+Date.now(),type:"withdraw",tanggal:new Date().toISOString().split("T")[0],agent,jumlah,keterangan,buktiName,buktiUrl};
    try{await gasPost({action:"addWithdraw",...newRec});}catch{}
    setData(d=>[newRec,...d]);addToast(`Tarik saving ${agent} berhasil!`);
  };

  const handleTransferKomisi=async({agent,jumlah,keterangan,buktiName="",buktiFile=null})=>{
    const buktiUrl=buktiFile?await uploadBuktiToGAS(buktiFile):"";
    const newRec={id:"k"+Date.now(),type:"komisi",tanggal:new Date().toISOString().split("T")[0],agent,jumlah,keterangan,buktiName,buktiUrl};
    try{await gasPost({action:"addKomisi",...newRec});}catch{}
    setData(d=>[newRec,...d]);addToast(`Transfer komisi ${agent} berhasil!`);
  };

  const handleDelete=(ids,isBulk=false)=>{
    if(!window.confirm(isBulk?`Hapus ${ids.length} transaksi?`:"Hapus transaksi ini?"))return;
    setData(d=>d.filter(r=>!ids.includes(r.id)));
    addToast(isBulk?`${ids.length} transaksi dihapus.`:"Transaksi dihapus.");
    ids.forEach(id=>{try{gasPost({action:"deleteRecord",id});}catch{}});
  };

  const handleEditSave=(updated)=>{
    setData(d=>d.map(r=>r.id===updated.id?{...r,...updated}:r));
    addToast("Transaksi diperbarui!");setEditModal(null);
    try{gasPost({action:"updateRecord",...updated});}catch{}
  };

  const allTrans=[...data].sort((a,b)=>new Date(b.tanggal)-new Date(a.tanggal));
  const monthlyStats=(()=>{
    const map={};
    feeRecords.forEach(r=>{const d=new Date(r.tanggal);if(isNaN(d))return;const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;if(!map[k])map[k]={k,fee:0,net:0};map[k].fee+=(parseFloat(r.feeLariz)||0);map[k].net+=(parseFloat(r.netCommission)||0);});
    return Object.values(map).sort((a,b)=>a.k.localeCompare(b.k)).slice(-6);
  })();
  const maxStat=Math.max(...monthlyStats.map(m=>m.fee),1);
  const TABS=[{id:"overview",label:"Overview",icon:"📊"},{id:"input-fee",label:"Input Fee",icon:"💰"},{id:"input-promo",label:"Input Promo",icon:"📤"},{id:"history",label:"Riwayat",icon:"📋"}];

  return(
    <div style={{minHeight:"100vh",background:"radial-gradient(ellipse 100% 50% at 50% -5%,rgba(99,102,241,.1) 0%,transparent 60%),#05070E"}}>
      <style>{G}</style>
      <header style={{position:"sticky",top:0,zIndex:100,background:"rgba(5,7,14,.92)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
        <div className="header-inner" style={{maxWidth:1200,margin:"auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj3D3dP2IHvCsgRuzkl9XRJDsb-Ttc98DnL3Y7EW7L_lnNNtw0qfrGpro_F9PEmt0Xz-SCxs2gWBVbYme0XCshjAGD5YGAfdW7JUq5lrlMn2hu_ynIL7oSVRppEcyICy7qY7A9iBY4k2d8igPSjL8UU12uQPmrsRGVAdUs4CCJMZlhCfVeOtvpF3yHvLcs8/s300/3.png" alt="logo" style={{width:28,height:28,objectFit:"contain",borderRadius:4}}/>
              <span className="brand-title" style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,letterSpacing:".15em",color:"#F1F5F9"}}>LARIZ PROPERTY</span>
            </div>
            <div style={{width:1,height:20,background:"rgba(255,255,255,.1)"}}/>
            <div className="desktop-nav header-nav">
              {TABS.map(t=>(<button key={t.id} onClick={()=>setTab(t.id)} className="nav-item" style={{padding:"6px 14px",borderRadius:8,border:"none",fontSize:12,fontWeight:600,cursor:"pointer",background:tab===t.id?"rgba(99,102,241,.2)":"transparent",color:tab===t.id?"#818CF8":"#64748B",borderBottom:tab===t.id?"2px solid #6366F1":"2px solid transparent"}}>{t.icon}&nbsp;{t.label}</button>))}
            </div>
          </div>
          <div className="header-right">
            {loading&&<span style={{fontSize:11,color:"#475569",animation:"pulse2 1s infinite"}}>⟳ Memuat...</span>}
            <div className="admin-badge" style={{padding:"4px 12px",borderRadius:99,fontSize:11,fontWeight:700,background:"rgba(99,102,241,.15)",color:"#818CF8",border:"1px solid rgba(99,102,241,.3)"}}>ADMIN</div>
            <button onClick={()=>setShowChangePwd(true)} style={{padding:"6px 10px",borderRadius:8,border:"1px solid rgba(99,102,241,.2)",background:"rgba(99,102,241,.06)",color:"#818CF8",fontSize:13,cursor:"pointer"}} className="btn-ghost">🔑</button>
            <button onClick={fetchData} style={{padding:"6px 10px",borderRadius:8,border:"1px solid rgba(99,102,241,.2)",background:"rgba(99,102,241,.06)",color:"#818CF8",fontSize:13,cursor:"pointer"}} className="btn-ghost" title="Refresh">🔄</button>
            <button onClick={onLogout} className="btn-ghost" style={{padding:"6px 14px",borderRadius:8,border:"1px solid rgba(248,113,113,.2)",background:"rgba(248,113,113,.06)",color:"#F87171",fontSize:12,fontWeight:600,cursor:"pointer"}}>⏏ Keluar</button>
          </div>
        </div>
      </header>
      <nav className="mobile-nav">
        {TABS.map(t=>(<button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"8px 4px",border:"none",background:"transparent",cursor:"pointer",color:tab===t.id?"#818CF8":"#334155"}}><span style={{fontSize:18}}>{t.icon}</span><span style={{fontSize:9,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase"}}>{t.label}</span>{tab===t.id&&<div style={{width:20,height:2,borderRadius:1,background:"#6366F1"}}/>}</button>))}
        <button onClick={onLogout} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"8px 4px",border:"none",background:"transparent",cursor:"pointer",color:"#F87171"}}><span style={{fontSize:18}}>⏏</span><span style={{fontSize:9,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase"}}>Keluar</span></button>
      </nav>

      <main style={{maxWidth:1200,margin:"auto",padding:"24px 16px 90px"}}>
        {tab==="overview"&&(<div style={{animation:"fadeUp .35s ease"}}>
          <div className="grid-4 section-gap" style={{marginBottom:28,gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))"}}>
            {[{label:"Total Fee Masuk",value:totalFeeIn,color:"#34D399",icon:"📥",sub:`${feeRecords.length} transaksi`},{label:"Net Commission",value:totalNetComm,color:"#6366F1",icon:"✅",sub:"setelah co-broke"},{label:"Total Pengeluaran",value:totalPromoOut+totalFeeAgentBT,color:"#F87171",icon:"📤",sub:"promo + co-broke"},{label:"Saldo BDB",value:saldoBDB,color:"#F59E0B",icon:"🏦",sub:"operasional bersih"},{label:"Hutang Komisi",value:totalHutangKom,color:"#F87171",icon:"💸",sub:"belum ditransfer"},].map(c=>(<div key={c.label} style={{background:`${c.color}08`,border:`1px solid ${c.color}20`,borderRadius:14,padding:"18px 20px",position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:0,left:0,right:0,height:3,background:c.color,opacity:.6}}/><div style={{fontSize:11,color:"#475569",letterSpacing:".08em",textTransform:"uppercase",marginBottom:8}}>{c.icon} {c.label}</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:18,fontWeight:700,color:c.color}}><AnimNum value={c.value}/></div><div style={{fontSize:11,color:"#334155",marginTop:4}}>{c.sub}</div></div>))}
          </div>
          <div style={{marginBottom:28}}>
            <SectionTitle>💳 Saldo Tabungan Agen</SectionTitle>
            <div className="grid-3">
              {agentSaldo.map(ag=>(<div key={ag.id} style={{background:`${ag.color}07`,border:`1px solid ${ag.color}20`,borderRadius:16,padding:"18px 20px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:30,height:30,borderRadius:9,background:`${ag.color}20`,border:`1px solid ${ag.color}35`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Bebas Neue',sans-serif",fontSize:12,color:ag.color}}>{ag.id.slice(0,2).toUpperCase()}</div><div><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,letterSpacing:".1em",color:"#E2E8F0"}}>{ag.label}</div><div style={{fontSize:10,color:"#334155"}}>{ag.pct}% net · Saving {ag.savingPct}% BDB</div></div></div>
                  <button onClick={()=>setTransferModal(ag)} disabled={ag.hutangKomisi<=0&&ag.saldoSaving<=0} style={{padding:"6px 14px",borderRadius:9,border:`1px solid ${ag.color}40`,background:(ag.hutangKomisi>0||ag.saldoSaving>0)?`${ag.color}15`:"rgba(255,255,255,.03)",color:(ag.hutangKomisi>0||ag.saldoSaving>0)?ag.color:"#334155",fontSize:11,fontWeight:700,cursor:(ag.hutangKomisi>0||ag.saldoSaving>0)?"pointer":"not-allowed"}}>↑ Transfer</button>
                </div>
                <div style={{marginBottom:8,padding:"10px 12px",background:"rgba(248,113,113,.07)",border:"1px solid rgba(248,113,113,.18)",borderRadius:10}}><div style={{fontSize:9,color:"#F87171",fontWeight:700,letterSpacing:".07em",marginBottom:4}}>💸 HUTANG KOMISI</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:17,fontWeight:700,color:ag.hutangKomisi>0?"#F87171":"#334155",marginBottom:6}}>{rp(ag.hutangKomisi)}</div><div style={{display:"flex",gap:10}}><div><div style={{fontSize:9,color:"#334155"}}>Total</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#64748B"}}>{rpS(ag.totalKomisi)}</div></div><div style={{width:1,background:"rgba(255,255,255,.06)"}}></ div><div><div style={{fontSize:9,color:"#334155"}}>Ditransfer</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#34D399"}}>{rpS(ag.sudahTransferKom)}</div></div></div></div>
                <div style={{padding:"10px 12px",background:`${ag.color}08`,border:`1px solid ${ag.color}18`,borderRadius:10}}><div style={{fontSize:9,color:ag.color,fontWeight:700,letterSpacing:".07em",marginBottom:4}}>🏦 SAVING BDB</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:17,fontWeight:700,color:ag.color,marginBottom:6}}>{rp(ag.saldoSaving)}</div><div style={{display:"flex",gap:10}}><div><div style={{fontSize:9,color:"#334155"}}>Total</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#64748B"}}>{rpS(ag.totalSaving)}</div></div><div style={{width:1,background:"rgba(255,255,255,.06)"}}></div><div><div style={{fontSize:9,color:"#334155"}}>Ditarik</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#F87171"}}>{rpS(ag.sudahTransferSav)}</div></div></div></div>
              </div>))}
            </div>
          </div>
          <div style={{marginBottom:28}}>
            <SectionTitle>📈 Statistik 6 Bulan Terakhir</SectionTitle>
            <div className="grid-2">
              <div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.07)",borderRadius:16,padding:"20px 24px"}}>
                <p style={{fontSize:12,fontWeight:600,color:"#64748B",marginBottom:20}}>Fee Masuk per Bulan</p>
                {monthlyStats.length===0?<div style={{padding:40,textAlign:"center",color:"#334155"}}>Belum ada data</div>:(
                  <div style={{display:"flex",gap:6,alignItems:"flex-end",height:140}}>
                    {monthlyStats.map(m=>{const pct=(m.fee/maxStat)*100,pctNet=(m.net/maxStat)*100;const [yr,mo]=m.k.split("-");const moLabel=["","Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"][parseInt(mo)];return(<div key={m.k} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><div style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:"#475569"}}>{rpS(m.fee)}</div><div style={{width:"100%",display:"flex",gap:2,alignItems:"flex-end",height:120}}><div style={{flex:1,background:"linear-gradient(180deg,#6366F1,#4F46E5)",borderRadius:"3px 3px 0 0",height:`${pct}%`,minHeight:4,opacity:.8}}/><div style={{flex:1,background:"linear-gradient(180deg,#34D399,#059669)",borderRadius:"3px 3px 0 0",height:`${pctNet}%`,minHeight:4,opacity:.8}}/></div><div style={{fontSize:10,color:"#475569",fontFamily:"'DM Mono',monospace"}}>{moLabel}</div></div>);})}
                  </div>
                )}
                <div style={{display:"flex",gap:16,marginTop:12}}>{[["#6366F1","Fee Lariz"],["#34D399","Net Commission"]].map(([c,l])=>(<div key={l} style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:10,height:10,borderRadius:2,background:c}}/><span style={{fontSize:11,color:"#475569"}}>{l}</span></div>))}</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {[{label:"Rata-rata Fee/transaksi",value:feeRecords.length?totalFeeIn/feeRecords.length:0,color:"#6366F1"},{label:"Total Transaksi",value:feeRecords.length,color:"#34D399",isCount:true},{label:"Total Penarikan Agen",value:totalWithdraw,color:"#F59E0B"},{label:"Saldo BDB Operasional",value:saldoBDB,color:"#22D3EE"},{label:"Total Hutang Komisi",value:totalHutangKom,color:"#F87171"},].map(s=>(<div key={s.label} style={{background:"rgba(255,255,255,.02)",border:`1px solid ${s.color}20`,borderRadius:12,padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontSize:11,color:"#475569",maxWidth:160}}>{s.label}</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:14,fontWeight:700,color:s.color}}>{s.isCount?s.value:rpS(s.value)}</div></div>))}
              </div>
            </div>
          </div>
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <SectionTitle nomb>📒 Tabel Saldo</SectionTitle>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{["all","aris","argo","darma"].map(a=>(<button key={a} onClick={()=>setFilterAgent(a)} style={{padding:"5px 12px",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",border:"none",background:filterAgent===a?"rgba(99,102,241,.2)":"rgba(255,255,255,.04)",color:filterAgent===a?"#818CF8":"#475569"}}>{a==="all"?"Semua":a.charAt(0).toUpperCase()+a.slice(1)}</button>))}</div>
            </div>
            <SaldoTable data={allTrans} filterAgent={filterAgent} onDelete={handleDelete} onEdit={r=>setEditModal(r)}/>
          </div>
        </div>)}

        {tab==="input-fee"&&(<div style={{animation:"fadeUp .3s ease"}}>
          <SectionTitle>💰 Input Fee Transaksi</SectionTitle>
          <div className="grid-2-eq">
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <Panel title="Info Transaksi" accent="#6366F1">
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Fld label="Nama Dev"><input style={S.inp} value={feeForm.namaDev} onChange={e=>setFeeForm(f=>({...f,namaDev:e.target.value}))} placeholder="MG_6"/></Fld><Fld label="Nama Konsumen"><input style={S.inp} value={feeForm.namaKonsumen} onChange={e=>setFeeForm(f=>({...f,namaKonsumen:e.target.value}))} placeholder="SELVI"/></Fld></div>
                <Fld label="Tanggal"><input type="date" style={S.inp} value={feeForm.tanggal} onChange={e=>setFeeForm(f=>({...f,tanggal:e.target.value}))}/></Fld>
              </Panel>
              <Panel title="Detail Fee" accent="#10B981">
                <MoneyFld label="Fee Lariz Property" value={feeForm.feeLariz} onChange={setMoney(feeForm,setFeeForm,"feeLariz")}/>
                <MoneyFld label="Fee Agent BT / Co-Broke" value={feeForm.feeAgentBT} onChange={setMoney(feeForm,setFeeForm,"feeAgentBT")}/>
                <Fld label="Keterangan"><textarea style={{...S.inp,minHeight:56,resize:"vertical"}} value={feeForm.keterangan} onChange={e=>setFeeForm(f=>({...f,keterangan:e.target.value}))} placeholder="Catatan..."/></Fld>
                <button onClick={saveFee} disabled={savingFee} style={S.saveBtn(savingFee)}>{savingFee?"⏳ Menyimpan...":"💾 Simpan & Hitung Otomatis"}</button>
              </Panel>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <Panel title="Preview Kalkulasi" accent="#F59E0B"><AlcRow label="Fee Lariz" value={feeCalc.fee} green/><AlcRow label="Fee Agent BT" value={feeCalc.feeAgentBT} red/><div style={{background:"rgba(99,102,241,.1)",border:"1px solid rgba(99,102,241,.3)",borderRadius:9,padding:"10px 14px",display:"flex",justifyContent:"space-between",marginTop:6}}><span style={{fontWeight:700,color:"#E2E8F0"}}>NET COMMISSION</span><span style={{fontFamily:"'DM Mono',monospace",color:"#818CF8",fontWeight:700,fontSize:15}}>{rp(feeCalc.net)}</span></div></Panel>
              <Panel title="Alokasi Tim (dari Net)" accent="#A78BFA">{[["BDB 40%",feeCalc.bdb,"#F59E0B"],["Aris 22.5%",feeCalc.aris,"#22D3EE"],["Argo 22.5%",feeCalc.argo,"#F59E0B"],["Darma 15%",feeCalc.darma,"#A78BFA"]].map(([l,v,c])=><AlcRow key={l} label={l} value={v} accent={c} green/>)}</Panel>
              <Panel title="Alokasi BDB" accent="#F59E0B">{[["Operasional 70%",feeCalc.opBdb,"#34D399"],["Saving Aris 10%",feeCalc.savingAris,"#22D3EE"],["Saving Argo 10%",feeCalc.savingArgo,"#F59E0B"],["Saving Darma 10%",feeCalc.savingDarma,"#A78BFA"]].map(([l,v,c])=><AlcRow key={l} label={l} value={v} accent={c} green/>)}</Panel>
            </div>
          </div>
        </div>)}

        {tab==="input-promo"&&(<div style={{animation:"fadeUp .3s ease",maxWidth:640}}>
          <SectionTitle>📤 Input Pengeluaran / Promo</SectionTitle>
          <Panel title="Catat Pengeluaran Operasional" accent="#F87171">
            <Fld label="Tanggal"><input type="date" style={S.inp} value={promoForm.tanggal} onChange={e=>setPromoForm(f=>({...f,tanggal:e.target.value}))}/></Fld>
            <Fld label="Keterangan"><input style={S.inp} value={promoForm.keterangan} onChange={e=>setPromoForm(f=>({...f,keterangan:e.target.value}))} placeholder="ATK, Print Brosur, dll"/></Fld>
            <MoneyFld label="Jumlah (Rp)" value={promoForm.jumlah} onChange={setMoney(promoForm,setPromoForm,"jumlah")}/>
            <div style={{marginBottom:14}}>
              <label style={S.lbl}>Nota / Bukti (opsional)</label>
              <input ref={promoBuktiRef} type="file" accept="image/*,.pdf" onChange={e=>{const file=e.target.files[0];if(file)setPromoBukti({file,url:URL.createObjectURL(file),name:file.name});}} style={{display:"none"}}/>
              <div onClick={()=>promoBuktiRef.current.click()} onDrop={e=>{e.preventDefault();const file=e.dataTransfer.files[0];if(file)setPromoBukti({file,url:URL.createObjectURL(file),name:file.name});}} onDragOver={e=>e.preventDefault()} style={{border:`2px dashed ${promoBukti?"rgba(248,113,113,.6)":"rgba(255,255,255,.1)"}`,borderRadius:10,padding:"14px 12px",textAlign:"center",cursor:"pointer",background:promoBukti?"rgba(248,113,113,.05)":"rgba(255,255,255,.02)"}}>
                {promoBukti?(<div>{promoBukti.file.type.startsWith("image/")?<img src={promoBukti.url} alt="bukti" style={{maxHeight:120,maxWidth:"100%",borderRadius:7,marginBottom:6,objectFit:"contain"}}/>:<div style={{fontSize:32,marginBottom:6}}>📄</div>}<p style={{fontSize:12,color:"#F87171",fontWeight:600}}>{promoBukti.name}</p></div>):(<div><div style={{fontSize:28,opacity:.4,marginBottom:6}}>🧾</div><p style={{fontSize:12,color:"#64748B"}}>Klik atau drag nota/bukti</p></div>)}
              </div>
              {promoBukti&&<button onClick={()=>setPromoBukti(null)} style={{marginTop:6,padding:"4px 10px",borderRadius:6,border:"1px solid rgba(248,113,113,.3)",background:"rgba(248,113,113,.08)",color:"#F87171",fontSize:11,fontWeight:600,cursor:"pointer"}}>✕ Hapus file</button>}
            </div>
            <button onClick={savePromo} disabled={savingPromo} style={{...S.saveBtn(savingPromo),background:savingPromo?"#1E293B":"linear-gradient(135deg,#EF4444,#DC2626)"}}>{savingPromo?"⏳ Menyimpan...":"📤 Catat Pengeluaran"}</button>
          </Panel>
        </div>)}

        {tab==="history"&&(<div style={{animation:"fadeUp .3s ease"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><SectionTitle nomb>📋 Riwayat Semua Transaksi</SectionTitle><div style={{fontSize:12,color:"#334155"}}>{allTrans.length} total record</div></div>
          <FullHistoryTable data={allTrans} agents={AGENTS} onDelete={handleDelete} onEdit={r=>setEditModal(r)}/>
        </div>)}
      </main>

      {transferModal&&<TransferUnifiedModal agent={transferModal} agData={agentSaldo.find(a=>a.id===transferModal.id)} onConfirmKomisi={handleTransferKomisi} onConfirmSaving={handleWithdraw} onClose={()=>setTransferModal(null)}/>}
      <Toast items={toasts} onRemove={id=>setToasts(t=>t.filter(x=>x.id!==id))}/>
      {editModal&&<EditRecordModal rec={editModal} onSave={handleEditSave} onClose={()=>setEditModal(null)}/>}
      {showChangePwd&&<ChangePasswordModal user={{...user,username:user.username||"admin"}} onClose={()=>{setShowChangePwd(false);refreshPwdMap&&refreshPwdMap();}}/>}
    </div>
  );
}

function WaRequestModal({user,saldo,onClose}) {
  const [nominal,setNominal]=useState("");
  const num=parseMoney(nominal); const valid=num>0&&num<=saldo;
  const fmtN=n=>n.toString().replace(/\B(?=(\d{3})+(?!\d))/g,".");
  const waText=()=>{const tgl=new Date().toLocaleDateString("id-ID",{day:"2-digit",month:"long",year:"numeric"});return encodeURIComponent(`Halo Admin Lariz Property,\n\nSaya *${user.label}* ingin mengajukan permintaan penarikan tabungan.\n\n📅 Tanggal  : ${tgl}\n👤 Nama     : ${user.label}\n💰 Nominal  : Rp ${fmtN(num)}\n\nMohon konfirmasinya. Terima kasih 🙏`);};
  return(
    <Modal title="REQUEST TARIK TABUNGAN" onClose={onClose} width={440}>
      <div style={{marginBottom:18,padding:"14px 16px",background:`${user.color}0C`,border:`1px solid ${user.color}25`,borderRadius:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:10,color:"#475569",letterSpacing:".08em",marginBottom:4}}>SALDO TABUNGAN TERSEDIA</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:22,fontWeight:700,color:user.color}}>{rp(saldo)}</div></div><div style={{fontSize:28,opacity:.3}}>🏦</div></div>
      <div style={{marginBottom:16}}><label style={S.lbl}>Nominal yang ingin ditarik (Rp)</label><div style={{position:"relative"}}><span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:12,color:"#475569",fontFamily:"'DM Mono',monospace",fontWeight:600}}>Rp</span><input value={nominal} onChange={e=>{const raw=e.target.value.replace(/\D/g,"");setNominal(raw?parseInt(raw).toString().replace(/\B(?=(\d{3})+(?!\d))/g,".") :"");}} placeholder="0" style={{...S.inp,paddingLeft:34,fontSize:15,fontFamily:"'DM Mono',monospace",fontWeight:700}}/></div>{num>saldo&&<p style={{fontSize:11,color:"#F87171",marginTop:5}}>⚠ Melebihi saldo ({rp(saldo)})</p>}{num>0&&num<=saldo&&<p style={{fontSize:11,color:"#34D399",marginTop:5}}>✓ Valid · Sisa: {rp(saldo-num)}</p>}</div>
      <button onClick={()=>valid&&window.open(`https://wa.me/6281516072070?text=${waText()}`,"_blank")} disabled={!valid} style={{width:"100%",padding:"13px",borderRadius:11,border:"none",background:valid?"linear-gradient(135deg,#25D366,#128C7E)":"#1E293B",color:valid?"#fff":"#334155",fontSize:14,fontWeight:700,cursor:valid?"pointer":"not-allowed"}}>📱 {valid?"Kirim Request via WhatsApp":"Masukkan nominal yang valid"}</button>
    </Modal>
  );
}

function AgenDashboard({user,onLogout,refreshPwdMap}) {
  const [data,setData]=useState([]); const [search,setSearch]=useState("");
  const [sortCol,setSortCol]=useState("tanggal"); const [sortDir,setSortDir]=useState("desc");
  const [showWaModal,setShowWaModal]=useState(false); const [showChangePwd,setShowChangePwd]=useState(false);

  useEffect(()=>{
    gasGet({action:"getAll"}).then(d=>{if(d.status==="ok")setData(d.records||[]);}).catch(e=>console.error("[Lariz] agen fetch:",e.message));
  },[]);

  const feeRecs=data.filter(r=>r.type==="fee");
  const withdrawRecs=data.filter(r=>r.type==="withdraw"&&r.agent===user.username);
  const myRecs=feeRecs.filter(r=>(parseFloat(r[user.feeField])||0)+(parseFloat(r[user.savingField])||0)>0);
  const filtered=myRecs.filter(r=>(r.namaDev||"").toLowerCase().includes(search.toLowerCase())||(r.namaKonsumen||"").toLowerCase().includes(search.toLowerCase()));
  const sorted=[...filtered].sort((a,b)=>{let va=a[sortCol]||0,vb=b[sortCol]||0;if(sortCol==="tanggal"){va=new Date(va);vb=new Date(vb);}else{va=parseFloat(va)||0;vb=parseFloat(vb)||0;}return sortDir==="asc"?(va>vb?1:-1):(va<vb?1:-1);});
  const toggleSort=col=>{if(sortCol===col)setSortDir(d=>d==="asc"?"desc":"asc");else{setSortCol(col);setSortDir("desc");}};
  const totalFee=myRecs.reduce((s,r)=>s+(parseFloat(r[user.feeField])||0),0);
  const totalSaving=myRecs.reduce((s,r)=>s+(parseFloat(r[user.savingField])||0),0);
  const totalLariz=myRecs.reduce((s,r)=>s+(parseFloat(r.feeLariz)||0),0);
  const totalWd=withdrawRecs.reduce((s,r)=>s+(parseFloat(r.jumlah)||0),0);
  const saldoTabungan=totalSaving-totalWd;
  const SI=({col})=><span style={{marginLeft:3,opacity:sortCol===col?1:.3,fontSize:9,color:user.color}}>{sortCol===col?(sortDir==="asc"?"▲":"▼"):"⇅"}</span>;

  return(
    <div style={{minHeight:"100vh",background:`radial-gradient(ellipse 100% 50% at 50% -5%,${user.color}0C 0%,transparent 65%),#05070E`}}>
      <style>{G}</style>
      <header style={{position:"sticky",top:0,zIndex:100,background:"rgba(5,7,14,.94)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
        <div className="header-inner" style={{maxWidth:1100,margin:"auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,borderRadius:10,background:`${user.color}18`,border:`1px solid ${user.color}35`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:user.color,flexShrink:0}}>{user.avatar}</div>
            <div><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:17,letterSpacing:".1em",color:"#E2E8F0"}}>{user.label}</div><div style={{fontSize:10,color:"#334155",letterSpacing:".1em"}}>LARIZ PROPERTY · AGEN</div></div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setShowChangePwd(true)} style={{padding:"6px 10px",borderRadius:8,border:`1px solid ${user.color}25`,background:`${user.color}08`,color:user.color,fontSize:13,cursor:"pointer"}} className="btn-ghost">🔑</button>
            <button onClick={onLogout} style={{padding:"6px 14px",borderRadius:8,border:"1px solid rgba(248,113,113,.2)",background:"rgba(248,113,113,.06)",color:"#F87171",fontSize:12,fontWeight:600,cursor:"pointer"}}>⏏ Keluar</button>
          </div>
        </div>
      </header>

      <div style={{maxWidth:1100,margin:"auto",padding:"24px 16px 100px"}}>
        <div className="grid-4" style={{gap:12,marginBottom:20}}>
          {[{l:"Jumlah Listing",v:myRecs.length,c:user.color,isN:true,icon:"🏠"},{l:"Total Fee Lariz",v:totalLariz,c:"#34D399",icon:"📥"},{l:"Total Pendapatan",v:totalFee+totalSaving,c:user.color,icon:"💰"},{l:"Saldo Tabungan",v:saldoTabungan,c:"#F59E0B",icon:"🏦"}].map(s=>(<div key={s.l} style={{background:`${s.c}08`,border:`1px solid ${s.c}20`,borderRadius:14,padding:"16px 18px",position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:0,left:0,right:0,height:2,background:s.c,opacity:.5}}/><div style={{fontSize:10,color:"#475569",textTransform:"uppercase",letterSpacing:".1em",marginBottom:6}}>{s.icon} {s.l}</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:16,fontWeight:700,color:s.c}}>{s.isN?s.v:rpS(s.v)}</div></div>))}
        </div>
        <div style={{marginBottom:24,background:`linear-gradient(135deg,${user.color}0E 0%,rgba(255,255,255,.02) 100%)`,border:`1px solid ${user.color}25`,borderRadius:18,padding:"22px 24px"}}>
          <div className="saldo-card-inner">
            <div style={{flex:1,minWidth:200}}>
              <div style={{fontSize:11,color:"#475569",letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>🏦 Saldo Tabungan BDB Saya</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:32,fontWeight:700,color:user.color,marginBottom:4}}><AnimNum value={saldoTabungan}/></div>
              <div style={{display:"flex",gap:20,marginTop:12}}>
                <div><div style={{fontSize:10,color:"#334155"}}>Total Masuk</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:"#34D399",fontWeight:600}}>{rp(totalSaving)}</div></div>
                <div style={{width:1,background:"rgba(255,255,255,.06)"}}/>
                <div><div style={{fontSize:10,color:"#334155"}}>Total Ditarik</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:"#F87171",fontWeight:600}}>{rp(totalWd)}</div></div>
                <div style={{width:1,background:"rgba(255,255,255,.06)"}}/>
                <div><div style={{fontSize:10,color:"#334155"}}>Riwayat Tarik</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:"#64748B",fontWeight:600}}>{withdrawRecs.length}x</div></div>
              </div>
            </div>
            <button onClick={()=>setShowWaModal(true)} disabled={saldoTabungan<=0} style={{display:"flex",alignItems:"center",gap:10,padding:"14px 22px",borderRadius:13,border:"none",background:saldoTabungan>0?"linear-gradient(135deg,#25D366,#128C7E)":"#1E293B",color:saldoTabungan>0?"#fff":"#334155",fontSize:14,fontWeight:700,cursor:saldoTabungan>0?"pointer":"not-allowed",whiteSpace:"nowrap"}}>📱 Request Tarik Tabungan</button>
          </div>
        </div>
        <div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.06)",borderRadius:16,overflow:"hidden"}}>
          <div style={{padding:"14px 18px",borderBottom:"1px solid rgba(255,255,255,.05)",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <div><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,letterSpacing:".12em",color:"#CBD5E1"}}>Rincian Pendapatan — {user.label}</div><div style={{fontSize:11,color:"#334155"}}>{sorted.length} transaksi</div></div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Cari dev / konsumen..." style={{...S.inp,width:"100%",maxWidth:210,padding:"7px 12px",fontSize:12}}/>
          </div>
          <div className="table-scroll">
            <table style={{width:"100%",minWidth:520,borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{background:"rgba(255,255,255,.03)"}}>{[{l:"No",c:null},{l:"Dev / Listing",c:"namaDev"},{l:"Konsumen",c:"namaKonsumen"},{l:"Tgl",c:"tanggal"},{l:"Fee Lariz",c:"feeLariz"},{l:`Fee ${user.label}`,c:user.feeField},{l:"Saving BDB",c:user.savingField},{l:"Total",c:null}].map(({l,c})=>(<th key={l} onClick={()=>c&&toggleSort(c)} style={{padding:"9px 14px",textAlign:"left",fontSize:10,fontWeight:700,letterSpacing:".1em",color:"#334155",cursor:c?"pointer":"default",textTransform:"uppercase",whiteSpace:"nowrap",borderBottom:"1px solid rgba(255,255,255,.05)",userSelect:"none"}}>{l}{c&&<SI col={c}/>}</th>))}</tr></thead>
              <tbody>
                {sorted.length===0&&<tr><td colSpan={8} style={{padding:40,textAlign:"center",color:"#334155"}}><div style={{fontSize:28,marginBottom:8}}>📭</div>Belum ada transaksi.</td></tr>}
                {sorted.map((r,i)=>{const f=parseFloat(r[user.feeField])||0,sv=parseFloat(r[user.savingField])||0;return(<tr key={i} className="row-hover" style={{borderBottom:"1px solid rgba(255,255,255,.04)",background:i%2===0?"transparent":"rgba(255,255,255,.012)"}}><td style={S.td}><span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#1E293B"}}>{String(i+1).padStart(2,"0")}</span></td><td style={S.td}><span style={{fontWeight:600,color:"#CBD5E1"}}>{r.namaDev||"-"}</span></td><td style={S.td}><span style={{color:"#64748B"}}>{r.namaKonsumen||"-"}</span></td><td style={S.td}><span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#475569"}}>{fmtDate(r.tanggal)}</span></td><td style={S.td}><span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"#64748B"}}>{rp(r.feeLariz)}</span></td><td style={S.td}><span style={{fontFamily:"'DM Mono',monospace",fontWeight:700,color:user.color}}>{rp(f)}</span></td><td style={S.td}><span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"#F59E0B"}}>{rp(sv)}</span></td><td style={S.td}><div style={{display:"inline-flex",background:`${user.color}12`,border:`1px solid ${user.color}30`,borderRadius:7,padding:"4px 10px",fontFamily:"'DM Mono',monospace",fontWeight:700,color:user.color,fontSize:13}}>{rp(f+sv)}</div></td></tr>);})}
              </tbody>
              {sorted.length>0&&(<tfoot><tr style={{background:"rgba(255,255,255,.04)",borderTop:`2px solid ${user.color}30`}}><td colSpan={4} style={{padding:"11px 14px",fontSize:10,fontWeight:700,letterSpacing:".1em",color:"#334155",textTransform:"uppercase"}}>TOTAL ({sorted.length})</td><td style={S.td}><span style={{fontFamily:"'DM Mono',monospace",fontWeight:700,color:"#CBD5E1",fontSize:13}}>{rp(sorted.reduce((s,r)=>s+(parseFloat(r.feeLariz)||0),0))}</span></td><td style={S.td}><span style={{fontFamily:"'DM Mono',monospace",fontWeight:700,color:user.color,fontSize:13}}>{rp(sorted.reduce((s,r)=>s+(parseFloat(r[user.feeField])||0),0))}</span></td><td style={S.td}><span style={{fontFamily:"'DM Mono',monospace",fontWeight:700,color:"#F59E0B",fontSize:13}}>{rp(sorted.reduce((s,r)=>s+(parseFloat(r[user.savingField])||0),0))}</span></td><td style={S.td}><div style={{display:"inline-flex",background:`${user.color}18`,border:`1px solid ${user.color}45`,borderRadius:7,padding:"5px 12px",fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:user.color}}>{rpS(sorted.reduce((s,r)=>s+(parseFloat(r[user.feeField])||0)+(parseFloat(r[user.savingField])||0),0))}</div></td></tr></tfoot>)}
            </table>
          </div>
        </div>
      </div>
      {showWaModal&&<WaRequestModal user={user} saldo={saldoTabungan} onClose={()=>setShowWaModal(false)}/>}
      {showChangePwd&&<ChangePasswordModal user={{...user,username:user.username}} onClose={()=>{setShowChangePwd(false);refreshPwdMap&&refreshPwdMap();}}/>}
    </div>
  );
}
function AgenAdminDashboard({user, onLogout, refreshPwdMap}) {
  const [activeView, setActiveView] = useState("agen"); // "agen" | "admin"

  return (
    <div>
      {/* Toggle bar */}
      <div style={{
        position:"fixed", top:0, left:0, right:0, zIndex:999,
        background:"rgba(5,7,14,.95)", backdropFilter:"blur(20px)",
        borderBottom:"1px solid rgba(255,255,255,.08)",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"8px 16px", height:46,
      }}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:28,height:28,borderRadius:8,background:`${user.color}18`,border:`1px solid ${user.color}35`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Bebas Neue',sans-serif",fontSize:12,color:user.color}}>{user.avatar}</div>
          <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,letterSpacing:".1em",color:"#E2E8F0"}}>{user.label}</span>
          <span style={{padding:"2px 8px",borderRadius:99,fontSize:10,fontWeight:700,background:"rgba(99,102,241,.15)",color:"#818CF8",border:"1px solid rgba(99,102,241,.3)"}}>AGEN + ADMIN</span>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {/* Toggle button */}
          <div style={{display:"flex",background:"rgba(255,255,255,.05)",borderRadius:10,padding:3,gap:3}}>
            <button onClick={()=>setActiveView("agen")}
              style={{padding:"5px 14px",borderRadius:8,border:"none",fontSize:11,fontWeight:700,cursor:"pointer",transition:"all .15s",
                background:activeView==="agen"?`${user.color}25`:"transparent",
                color:activeView==="agen"?user.color:"#475569"}}>
              👤 Dashboard Saya
            </button>
            <button onClick={()=>setActiveView("admin")}
              style={{padding:"5px 14px",borderRadius:8,border:"none",fontSize:11,fontWeight:700,cursor:"pointer",transition:"all .15s",
                background:activeView==="admin"?"rgba(99,102,241,.25)":"transparent",
                color:activeView==="admin"?"#818CF8":"#475569"}}>
              ⚙️ Panel Admin
            </button>
          </div>
          <button onClick={onLogout} style={{padding:"5px 12px",borderRadius:8,border:"1px solid rgba(248,113,113,.2)",background:"rgba(248,113,113,.06)",color:"#F87171",fontSize:11,fontWeight:600,cursor:"pointer"}}>⏏ Keluar</button>
        </div>
      </div>

      {/* Content — tambah padding top karena ada toggle bar */}
      <div style={{paddingTop:46}}>
        {activeView==="agen" && (
          <AgenDashboard user={user} onLogout={onLogout} refreshPwdMap={refreshPwdMap}/>
        )}
        {activeView==="admin" && (
          <AdminDashboard user={user} onLogout={onLogout} refreshPwdMap={refreshPwdMap}/>
        )}
      </div>
    </div>
  );
}
export default function App() {
  const [user,setUser]=useState(null);
  const [pwdMap,setPwdMap]=useState({});
  const [pwdLoaded,setPwdLoaded]=useState(false);

  useEffect(()=>{
    gasGet({action:"getPasswords"})
      .then(d=>{if(d.passwords)setPwdMap(d.passwords);})
      .catch(()=>{})
      .finally(()=>setPwdLoaded(true));
  },[]);

  const verifyPwd=(username,plaintext)=>{
    const DEFAULTS={admin:"admin123",aris:"aris123",argo:"argo123",darma:"darma123"};
    const HASHES={admin:"0192023a7bbd73250516f069df18b500",aris:"7e22b8b5e1d9d05fba3d55f5fb13cfe1",argo:"9b47b77b6e0f41bde74c17bca00bde26",darma:"8d97a21a7e20b9f9e8f3bcef63de4ef4"};
    if(DEFAULT_PASSWORDS&&DEFAULT_PASSWORDS[username]===plaintext) return true;
    const stored=pwdMap[username]||HASHES[username]||getPasswordHash(username);
    return md5(plaintext)===stored;
  };

  const refreshPwdMap=()=>{
    gasGet({action:"getPasswords"}).then(d=>{if(d.passwords)setPwdMap(d.passwords);}).catch(()=>{});
  };

  if(!pwdLoaded) return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#05070E",color:"#334155",fontSize:13,gap:10}}>
      <span style={{animation:"spin 1s linear infinite",display:"inline-block",fontSize:18}}>⟳</span>
      Memuat sistem...
    </div>
  );

  if(!user) return <Login onLogin={u=>setUser(u)} verifyPwd={verifyPwd}/>;
if(user.role==="admin") return <AdminDashboard user={user} onLogout={()=>setUser(null)} refreshPwdMap={refreshPwdMap}/>;
if(user.role==="agen-admin") return <AgenAdminDashboard user={user} onLogout={()=>setUser(null)} refreshPwdMap={refreshPwdMap}/>;
return <AgenDashboard user={user} onLogout={()=>setUser(null)} refreshPwdMap={refreshPwdMap}/>;
}
