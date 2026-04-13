import React, { useState, useEffect } from 'react';
import JSZip from 'jszip'; 
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { 
  Printer, Music, Mic2, BookOpen, Users, Settings, LogOut, 
  Edit3, Key, Mail, UserCheck, ClipboardPaste, Info, Save, Trash2, RotateCcw
} from 'lucide-react';

// --- CONFIGURACIÓN FIREBASE (REUNIONES-GP) ---
import { initializeApp } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBtYm5P6hWi4rzE1sGsrjutMK1ukfI0wAg",
  authDomain: "reuniones-gp.firebaseapp.com",
  projectId: "reuniones-gp",
  storageBucket: "reuniones-gp.firebasestorage.app",
  messagingSenderId: "347619552073",
  appId: "1:347619552073:web:993fe0b33570076f564898"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const MIEMBROS = [
  { n: "Ascanio Nelson", s: "M", r: ["t3", "meca"] },
  { n: "Ascanio Viviana", s: "F", r: [] },
  { n: "Baragaño Moira", s: "F", r: [] },
  { n: "Díaz Dante", s: "M", r: ["t3"] },
  { n: "Gualtieri Abel", s: "M", r: ["presi", "ora", "t12", "t3", "vida", "atCond", "wePresi"] },
  { n: "Gualtieri Mariel", s: "F", r: [] },
  { n: "Gonzalez Maria", s: "F", r: [] },
  { n: "Guzmán Angélica", s: "F", r: [] },
  { n: "Huber José", s: "M", r: ["t3"] },
  { n: "Huber Nancy", s: "F", r: [] },
  { n: "Huber Walter", s: "M", r: ["ora", "t3", "ebLect", "atLect", "meca"] },
  { n: "Montes de Oca Pamela", s: "F", r: [] },
  { n: "Montes de Oca Cristian", s: "M", r: ["ora", "t12", "t3", "vida", "atCond", "atLect", "wePresi", "meca"] },
  { n: "Luceros Mirta", s: "F", r: [] },
  { n: "Luceros Sergio", s: "M", r: ["ora", "t12", "t3", "ebLect", "atLect", "meca"] },
  { n: "Mena Georgina", s: "F", r: [] },
  { n: "Monzón Apolinaria", s: "F", r: [] },
  { n: "Ojeda Iker", s: "M", r: ["t3", "ebLect", "atLect", "meca"] },
  { n: "Ojeda Mariana", s: "F", r: [] },
  { n: "Ojeda Victor", s: "M", r: ["presi", "ora", "t12", "t3", "vida", "atCond", "wePresi"] },
  { n: "Ponce Elisa", s: "F", r: [] },
  { n: "Rojas Benjamín", s: "M", r: ["t3", "meca"] },
  { n: "Rojas Lisseth", s: "F", r: [] },
  { n: "Rojas Iara", s: "F", r: [] },
  { n: "Romero Jose", s: "M", r: ["ora", "t12", "t3", "vida", "wePresi", "meca"] },
  { n: "Romero Margarita", s: "F", r: [] },
  { n: "Sardina Clara", s: "F", r: [] },
  { n: "Sardina Jonatan", s: "M", r: ["ora", "t3", "ebLect", "atLect", "meca"] },
  { n: "Sardina Mónica", s: "F", r: [] },
  { n: "Sardina Tizziana", s: "F", r: [] },
  { n: "Tinnirello Carmen", s: "F", r: [] },
  { n: "Cáceres Paulina", s: "F", r: [] },
  { n: "Caceres Nelida", s: "F", r: [] },
  { n: "Perera Carlos", s: "M", r: ["t3"] },
  { n: "Perera Felisa", s: "F", r: [] },
  { n: "Torres Victor", s: "M", r: ["t3"] },
  { n: "Torres Noelia", s: "F", r: [] }
].sort((a, b) => a.n.localeCompare(b.n));

const OP_LIMPIEZA = [{n: "Grupo 1"}, {n: "Grupo 2"}, {n: "Limpieza Profunda"}];

const App = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('member');
  const [loginMail, setLoginMail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loading, setLoading] = useState(true);
  const [mes, setMes] = useState(new Date().getMonth());
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [semanas, setSemanas] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [showMeta, setShowMeta] = useState(false);

  // --- FUNCIÓN DE FILTRADO (REPARADA) ---
  const getFiltered = (rol, type = "normal") => {
    if (type === "disc") return MIEMBROS.filter(m => m.s === "M");
    if (rol === "all") return MIEMBROS;
    if (!rol) return MIEMBROS;
    return MIEMBROS.filter(m => m.r && m.r.includes(rol));
  };

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        if (u.email === "biktormo@gmail.com") setRole('admin');
        else if (["abel@pinedo.com", "cristian@pinedo.com"].includes(u.email)) setRole('editor');
        else setRole('member');
      } else { setUser(null); setRole('member'); }
      setLoading(false);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubData = onSnapshot(doc(db, "programas", `${anio}-${mes + 1}`), (docSnap) => {
      let base = generarSemanasBase(mes, anio);
      if (docSnap.exists()) {
        const cloud = docSnap.data().semanas;
        const fusion = base.map(s => {
          const match = cloud.find(c => c.dateKey === s.dateKey);
          return match ? { ...s, asig: match.asig, meta: match.meta || s.meta } : s;
        });
        setSemanas(fusion);
      } else { setSemanas(base); }
    });
    return () => unsubData();
  }, [user, mes, anio]);

  const generarSemanasBase = (m, a) => {
    let firstDay = new Date(a, m, 1);
    while (firstDay.getDay() !== 1) firstDay.setDate(firstDay.getDate() + 1);
    let temp = [];
    let current = new Date(firstDay);
    for (let i = 0; i < 5; i++) {
      if (current.getMonth() !== m && i > 3) break;
      const dKey = current.toISOString().split('T')[0];
      let end = new Date(current); 
      end.setDate(current.getDate() + 6);

      const mesIni = current.toLocaleString('es-AR', { month: 'long' }).toUpperCase();
      const mesFin = end.toLocaleString('es-AR', { month: 'long' }).toUpperCase();
      
      const rangoTexto = (current.getMonth() === end.getMonth()) 
        ? `${current.getDate()}-${end.getDate()} DE ${mesIni}`
        : `${current.getDate()} DE ${mesIni} AL ${end.getDate()} DE ${mesFin}`;

      temp.push({
        id: current.getTime(), dateKey: dKey, diaInicio: current.getDate(), mesNom: current.toLocaleString('es', { month: 'long' }),
        rango: rangoTexto,
        meta: { lect: "LECTURA SEMANAL", can1: "0", can2: "0", can3: "0", tesoros: [], maestros: [], vida: [], atT: "Título Atalaya..." },
        asig: {}
      });
      current.setDate(current.getDate() + 7);
    }
    return temp;
  };

  const processPastedText = (sIdx, text) => {
    if (!text) return;
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const n = [...semanas];
    let currentItems = []; let currentItem = null; let sectionState = "START"; let songs = []; let weekReading = "";

    lines.forEach((line, idx) => {
        const up = line.toUpperCase();
        if (up.includes("TESOROS")) sectionState = "T";
        else if (up.includes("SEAMOS MEJORES")) sectionState = "M";
        else if (up.includes("NUESTRA VIDA")) sectionState = "V";
        if (line.toLowerCase().includes("canción") && idx > 0 && sectionState === "START") weekReading = lines[idx-1];
        const canMatch = line.match(/\bCanci[óo]n\s+(\d+)\b/i);
        if (canMatch) songs.push(canMatch[1]);
        if (line.match(/^\d\./)) {
            if (currentItem) { currentItem.section = sectionState; currentItems.push(currentItem); }
            currentItem = { t: line, d: "", section: sectionState };
        } else if (currentItem) { currentItem.d += line + " "; }
    });
    if (currentItem) { currentItem.section = sectionState; currentItems.push(currentItem); }

    n[sIdx].meta.tesoros = currentItems.filter(i => i.section === "T");
    n[sIdx].meta.maestros = currentItems.filter(i => i.section === "M");
    n[sIdx].meta.vida = currentItems.filter(i => i.section === "V");
    n[sIdx].meta.lect = weekReading.toUpperCase() || "LECTURA SEMANAL";
    n[sIdx].meta.can1 = songs[0] || "0"; n[sIdx].meta.can2 = songs[1] || "0"; n[sIdx].meta.can3 = songs[2] || "0";

    setSemanas(n);
    setDoc(doc(db, "programas", `${anio}-${mes + 1}`), { semanas: n });
    alert("¡Estructura actualizada!");
  };

  const updateAsig = (sIdx, field, val) => {
    if (role === 'member') return;
    const n = [...semanas]; n[sIdx].asig[field] = val; setSemanas(n);
    setDoc(doc(db, "programas", `${anio}-${mes + 1}`), { semanas: n });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try { await signInWithEmailAndPassword(auth, loginMail, loginPass); } 
    catch (err) { alert("Credenciales incorrectas"); setLoading(false); }
  };

  const printWeek = (s) => {
    const el = document.getElementById(`week-${s.id}`);
    html2canvas(el, { scale: 2, useCORS: true, logging: false }).then(canvas => {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 5, 5, 200, 0);
      pdf.save(`Reunion (${s.rango.toLowerCase()}).pdf`);
    });
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-blue-400 font-black animate-pulse uppercase tracking-[0.3em]">REUNIONES GP...</div>;

  if (!user) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 italic font-sans text-center leading-none">
      <form onSubmit={handleLogin} className="bg-white p-12 rounded-[3rem] shadow-2xl w-full max-w-md space-y-6 border-t-[12px] border-blue-600">
        <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter leading-none">Reuniones GP</h2>
        <div className="space-y-4">
            <input type="email" placeholder="Email" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold" onChange={e => setLoginMail(e.target.value)} />
            <input type="password" placeholder="Clave" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold" onChange={e => setLoginPass(e.target.value)} />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all">Ingresar</button>
      </form>
    </div>
  );

  return (
    <div className="bg-slate-200 min-h-screen font-sans antialiased pb-20 leading-none">
        <style>{`
            @media print {
                @page { size: A4; margin: 0; }
                body { background: white; }
                .print-hidden { display: none !important; }
                .tooltip { display: none !important; }
                .page-break { page-break-before: always; height: 297mm; padding: 4mm 10mm !important; margin: 0 !important; border: none !important; box-shadow: none !important; }
                .page-break:first-of-type { page-break-before: avoid; }
            }
            .tooltip { visibility: hidden; opacity: 0; transition: 0.1s; position: absolute; z-index: 50; }
            .has-tooltip:hover .tooltip { visibility: visible; opacity: 1; }
        `}</style>

      {/* NAVBAR */}
      <div className="bg-white border-b sticky top-0 z-50 p-4 shadow-sm flex justify-between items-center print-hidden">
        <div className="flex gap-4">
          <div className="px-4 py-1.5 bg-blue-600 text-white rounded-full font-black text-[10px] uppercase shadow-sm flex items-center gap-2 tracking-widest"><UserCheck size={14}/> {role}</div>
          <select className="border-2 border-slate-100 p-1.5 rounded-xl font-black bg-slate-50 text-xs shadow-sm outline-none" value={mes} onChange={e => setMes(Number(e.target.value))}>
            {["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"].map((m,i)=><option key={i} value={i}>{m}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          {role !== 'member' && (
            <button onClick={() => setEditMode(!editMode)} className={`px-5 py-2 rounded-full font-black text-[10px] uppercase shadow-md transition-all ${editMode ? 'bg-orange-500 text-white' : 'bg-white text-slate-600 border'}`}>
              {editMode ? "💾 FINALIZAR" : "✏️ ASIGNAR"}
            </button>
          )}
          {role === 'admin' && (
            <button onClick={() => setShowMeta(!showMeta)} className={`px-5 py-2 rounded-full font-black text-[10px] uppercase border shadow-md transition-all ${showMeta ? 'bg-yellow-500 text-white' : 'bg-white'}`}>ESTRUCTURA</button>
          )}
          <button onClick={() => window.print()} className="bg-emerald-600 text-white px-6 py-2 rounded-full font-black text-[10px] shadow-lg uppercase">PDF</button>
          <button onClick={() => { signOut(auth); setUser(null); }} className="bg-slate-100 text-slate-400 p-2 rounded-full transition-colors hover:bg-red-500 hover:text-white"><LogOut size={18}/></button>
        </div>
      </div>

      <div id="print-area" className="max-w-4xl mx-auto space-y-4">
        <div className="text-center border-b-4 border-slate-900 pb-2 pt-10 mb-4 px-10 leading-none">
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Programa de asignaciones para las Reuniones</h1>
            <p className="text-sm font-bold text-blue-800 uppercase tracking-widest mt-1 italic leading-none uppercase tracking-widest">Congregación General Pinedo</p>
        </div>

        {semanas.map((s, sIdx) => (
          <div key={s.id} id={`week-${s.id}`} className="bg-white border border-slate-200 page-break rounded-[2.5rem] overflow-hidden mb-8 shadow-sm relative italic">
            <div className="bg-slate-900 p-3 text-center text-white text-xl font-black tracking-widest uppercase italic flex justify-between px-10 items-center">
                <span>{s.rango}</span>
                <button onClick={() => printWeek(s)} className="print-hidden p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all"><Printer size={16}/></button>
            </div>
            
            {showMeta && role === 'admin' && (
              <div className="bg-yellow-50 p-6 border-b-4 border-yellow-400 print:hidden flex flex-col gap-3">
                 <textarea className="w-full h-16 p-3 rounded-2xl border-2 border-yellow-200 text-[10px] font-mono shadow-inner outline-none bg-white/50 focus:bg-white transition-all shadow-none" 
                    placeholder="Pega el contenido de JW.ORG aquí..." onPaste={(e) => processPastedText(sIdx, e.clipboardData.getData('Text'))}/>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 px-10 pb-10 pt-0 leading-none relative">
              <div className="space-y-4 leading-none">
                <div className="flex items-center gap-3 border-b-2 border-[#007B5E] pb-1 text-[#007B5E]">
                  <BookOpen size={24} />
                  <h3 className="font-black uppercase text-[11px] italic tracking-tighter leading-none">Vida y Ministerio Cristianos</h3>
                </div>

                <div className="flex justify-between font-black text-[9px] bg-emerald-50 p-3 border border-emerald-100 rounded-xl leading-none shadow-none">
                    <span>CANCIÓN {s.meta.can1}</span>
                    <span className="uppercase text-slate-700 font-bold tracking-widest">{s.meta.lect}</span>
                </div>

                <div className="space-y-0.5">
                    <SelectRow label="Presidente (oracion inicial)" val={s.asig.presi} options={getFiltered("presi")} edit={editMode} onSelect={v => updateAsig(sIdx, 'presi', v)} />
                </div>

                <SectionHeader title="Tesoros de la Biblia" color="bg-[#007B5E]" />
                <div className="space-y-3 px-1 leading-none shadow-none">
                  {s.meta.tesoros?.map((t, tIdx) => (
                    <div key={tIdx} className="relative has-tooltip">
                        <p className="text-[11px] font-black text-emerald-950 border-b pb-0.5 uppercase cursor-help leading-tight leading-none">{t.t}</p>
                        <div className="tooltip bg-black text-white text-[10px] p-2 rounded-lg w-64 -top-2 left-full ml-2 shadow-xl border">{t.d}</div>
                        <SelectRow label="Asignado" val={s.asig[`t${tIdx}`]} options={getFiltered(tIdx === 2 ? "t3" : "t12")} edit={editMode} onSelect={v => updateAsig(sIdx, `t${tIdx}`, v)} />
                    </div>
                  ))}
                </div>

                <SectionHeader title="Seamos Mejores Maestros" color="bg-[#C18B00]" />
                <div className="space-y-2">
                  {s.meta.maestros?.map((m, mIdx) => (
                    <div key={mIdx} className="border-l-2 border-amber-300 pl-3 py-1 bg-amber-50/30 rounded-r-lg mb-1 relative has-tooltip">
                      <p className="text-[10px] font-black text-amber-800 uppercase cursor-help leading-tight">{m.t}</p>
                      <div className="tooltip bg-amber-900 text-white text-[10px] p-2 rounded-lg w-64 -top-2 left-full ml-2 shadow-xl border">{m.d}</div>
                      {!m.t.toLowerCase().includes("discurso") ? (
                        <>
                          <SelectRow label="Estudiante" val={s.asig[`m${mIdx}`]} options={MIEMBROS} edit={editMode} onSelect={v => updateAsig(sIdx, `m${mIdx}`, v)} />
                          <SelectRow label="Ayudante" val={s.asig[`m${mIdx}A`]} options={MIEMBROS} edit={editMode} onSelect={v => updateAsig(sIdx, `m${mIdx}A`, v)} />
                        </>
                      ) : (
                        <SelectRow label="Discursante" val={s.asig[`m${mIdx}`]} options={getFiltered("", "disc")} edit={editMode} onSelect={v => updateAsig(sIdx, `m${mIdx}`, v)} />
                      )}
                    </div>
                  ))}
                </div>

                <SectionHeader title="Nuestra Vida Cristiana" color="bg-[#8A1A11]" />
                <div className="space-y-4">
                    <div className="font-black text-[9px] flex items-center gap-2 leading-none"><Music size={12} className="text-red-600"/> CANCIÓN {s.meta.can2}</div>
                    {s.meta.vida?.map((v, vIdx) => (
                       <div key={vIdx} className="relative has-tooltip leading-none">
                          <p className="text-[10px] font-black text-red-950 uppercase border-b pb-0.5 cursor-help leading-tight leading-none">{v.t}</p>
                          <div className="tooltip bg-red-900 text-white text-[10px] p-2 rounded-lg w-64 -top-2 left-full ml-2 shadow-xl leading-none">{v.d}</div>
                          {v.t.toLowerCase().includes("estudio b") || v.t.toLowerCase().includes("viajante") ? (
                            <div className="bg-red-50 p-2.5 rounded-xl border border-red-100 mt-1 space-y-1 shadow-none leading-none">
                                <SelectRow label="Conductor" val={s.asig[`v${vIdx}_C`]} options={getFiltered("vida")} edit={editMode} onSelect={vVal => updateAsig(sIdx, `v${vIdx}_C`, vVal)} />
                                <SelectRow label="Lector" val={s.asig[`v${vIdx}_L`]} options={getFiltered("ebLect")} edit={editMode} onSelect={vVal => updateAsig(sIdx, `v${vIdx}_L`, vVal)} />
                            </div>
                          ) : (
                            <SelectRow label="Asignado" val={s.asig[`v${vIdx}`]} options={getFiltered("vida")} edit={editMode} onSelect={vVal => updateAsig(sIdx, `v${vIdx}`, vVal)} />
                          )}
                       </div>
                    ))}
                    <div className="pt-2 border-t text-[9px] font-black flex justify-between uppercase leading-none italic shadow-none">
                        <span>CANCIÓN {s.meta.can3} Y ORACIÓN</span>
                        <SelectRow label="O. Final" val={s.asig.orFi} options={getFiltered("ora")} edit={editMode} onSelect={v => updateAsig(sIdx, 'orFi', v)} />
                    </div>
                </div>
              </div>

              <div className="space-y-6 flex flex-col h-full leading-none">
                <div className="flex items-center gap-3 border-b-2 border-blue-800 pb-1 text-blue-800"><Users size={24}/><h3 className="font-black uppercase text-xs italic tracking-tighter leading-none tracking-widest leading-none">Reunión de Fin de Semana</h3></div>
                <div className="bg-white p-6 rounded-[2rem] border border-blue-100 shadow-sm mb-4 leading-none shadow-none">
                  <SelectRow label="Presidente" val={s.asig.wePresi} options={getFiltered("wePresi")} edit={editMode} onSelect={v => updateAsig(sIdx, 'wePresi', v)} />
                  <div className="mt-6 pt-6 border-t-2 border-slate-50 text-center space-y-2 leading-none shadow-none">
                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest leading-none">Discurso Público</p>
                    {editMode ? (
                      <div className="space-y-1 leading-none shadow-none">
                        <input className="w-full text-center border p-1 rounded-lg text-[9px] shadow-none outline-none" placeholder="Título Discurso..." value={s.asig.discTit || ""} onChange={e => updateAsig(sIdx, 'discTit', e.target.value)} />
                        <input className="w-full text-center border p-1 rounded-lg text-[9px] font-black uppercase shadow-none outline-none" placeholder="Nombre Discursante..." value={s.asig.discNom || ""} onChange={e => updateAsig(sIdx, 'discNom', e.target.value)} />
                        <input className="w-full text-center border p-1 rounded-lg text-[8px] italic shadow-none outline-none" placeholder="Congregación..." value={s.asig.weDiscOrig || ""} onChange={e => updateAsig(sIdx, 'weDiscOrig', e.target.value)} />
                      </div>
                    ) : (
                      <div className="py-1 leading-tight shadow-none italic leading-none">
                        <p className="text-base font-serif italic font-black text-slate-800 leading-none">"{s.asig.discTit || 'TÍTULO PENDIENTE'}"</p>
                        <p className="text-xs font-black uppercase text-blue-900 mt-2 leading-none tracking-tight leading-none tracking-tight">{s.asig.discNom || 'NOMBRE'}</p>
                        <p className="text-[9px] text-slate-500 font-bold italic tracking-tighter leading-none italic leading-none shadow-none tracking-widest uppercase">({s.asig.weDiscOrig || "General Pinedo"})</p>
                      </div>
                    )}
                    {/* Solo Admin ve los campos para el segundo discurso */}
                    {role === 'admin' && editMode && (
                      <div className="mt-4 p-4 bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl">
                        <p className="text-[10px] font-black text-blue-800 uppercase mb-2">Segundo Discurso (Opcional)</p>
                        <div className="space-y-2">
                          <input className="w-full p-1 text-xs border rounded" placeholder="Título 2do Discurso" value={s.asig.discTit2 || ""} onChange={e => updateAsig(sIdx, 'discTit2', e.target.value)} />
                          <input className="w-full p-1 text-xs border rounded" placeholder="Nombre Discursante 2" value={s.asig.discNom2 || ""} onChange={e => updateAsig(sIdx, 'discNom2', e.target.value)} />
                          <div className="flex gap-2">
                            <input className="w-1/2 p-1 text-xs border rounded" placeholder="Canción" value={s.asig.discCan2 || ""} onChange={e => updateAsig(sIdx, 'discCan2', e.target.value)} />
                            <input className="w-1/2 p-1 text-xs border rounded" placeholder="Oración" value={s.asig.discOra2 || ""} onChange={e => updateAsig(sIdx, 'discOra2', e.target.value)} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm leading-none shadow-none">
                   <p className="text-[9px] font-black text-blue-800 uppercase mb-4 tracking-widest text-center border-b pb-1 underline italic leading-none shadow-none px-4">Estudio de La Atalaya</p>
                   <div className="text-center mb-4 leading-none">
                      {s.asig.atImg && <img src={s.asig.atImg} className="h-32 mx-auto rounded-xl mb-3 shadow-md object-cover w-full border-2 border-white shadow-none shadow-none" alt="Atalaya" crossOrigin="anonymous" />}
                      {(role === 'admin' || role === 'editor') && editMode && (
                        <div className="flex flex-col gap-1 print:hidden">
                          <input className="text-[9px] p-1 border w-full rounded-lg outline-none" placeholder="URL Imagen Atalaya" value={s.asig.atImg || ""} onChange={e => updateAsig(sIdx, 'atImg', e.target.value)} />
                          <input className="text-[9px] p-1 border w-full rounded-lg outline-none" placeholder="Título artículo..." value={s.asig.atTitulo || ""} onChange={e => updateAsig(sIdx, 'atTitulo', e.target.value)} />
                        </div>
                      )}
                      <p className="text-[10px] font-black text-blue-900 italic leading-snug px-4 uppercase tracking-tighter leading-none shadow-none px-4 leading-none tracking-tighter leading-tight italic leading-none leading-none shadow-none">"{s.asig.atTitulo || "Artículo de Estudio"}"</p>
                   </div>
                   <div className="space-y-0.5 leading-none">
                    <SelectRow label="Conductor" val={s.asig.atCond} options={getFiltered("atCond")} edit={editMode} onSelect={v => updateAsig(sIdx, 'atCond', v)} />
                    <SelectRow label="Lector" val={s.asig.atLect} options={getFiltered("atLect") || getFiltered("ebLect")} edit={editMode} onSelect={v => updateAsig(sIdx, 'atLect', v)} />
                   </div>
                </div>

                {/* Caja de Segundo Discurso: Se activa solo si hay título */}
                {s.asig.discTit2 && !editMode && (
                  <div className="mt-4 bg-white p-6 rounded-3xl border-2 border-blue-100 shadow-sm leading-none">
                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest text-center mb-3">Discurso Adicional / Especial</p>
                    <div className="text-center space-y-2">
                      <p className="text-base font-serif italic font-black text-slate-800 leading-tight">"{s.asig.discTit2}"</p>
                      <p className="text-xs font-black uppercase text-blue-900">{s.asig.discNom2}</p>
                      <div className="flex justify-around pt-2 border-t text-[10px] font-black uppercase text-slate-500">
                          <span>Canción {s.asig.discCan2}</span>
                          <span>Oración: {s.asig.discOra2}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t-2 border-double border-slate-200 mt-auto leading-none">
                  <div className="flex items-center gap-2 mb-2 text-slate-400 font-black leading-none italic font-bold tracking-widest uppercase leading-none shadow-none"><Settings size={18}/><h3 className="uppercase text-[9px] tracking-widest leading-none font-bold">Asignaciones Mecánicas</h3></div>
                  <div className="space-y-0.5 bg-slate-50 p-6 rounded-[2rem] border shadow-none leading-none leading-none">
                    <SelectRow label="Limpieza" val={s.asig.limp} options={OP_LIMPIEZA} edit={editMode} onSelect={v => updateAsig(sIdx, 'limp', v)} />
                    <SelectRow label="Entrada" val={s.asig.atEn} options={getFiltered("meca")} edit={editMode} onSelect={v => updateAsig(sIdx, 'atEn', v)} />
                    <SelectRow label="Plataforma" val={s.asig.atPl} options={getFiltered("meca")} edit={editMode} onSelect={v => updateAsig(sIdx, 'atPl', v)} />
                    <SelectRow label="Micro 1" val={s.asig.mic1} options={getFiltered("meca")} edit={editMode} onSelect={v => updateAsig(sIdx, 'mic1', v)} />
                    <SelectRow label="Micro 2" val={s.asig.mic2} options={getFiltered("meca")} edit={editMode} onSelect={v => updateAsig(sIdx, 'mic2', v)} />
                    <SelectRow label="Audio/Video" val={s.asig.av} options={getFiltered("meca")} edit={editMode} onSelect={v => updateAsig(sIdx, 'av', v)} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SelectRow = ({ label, val, options, edit, onSelect }) => (
  <div className="flex justify-between items-center py-1 border-b border-slate-50 last:border-0 min-h-[32px] leading-none">
    <span className="text-[9px] font-black text-slate-300 uppercase pr-4 leading-none tracking-tighter leading-none tracking-tighter leading-none tracking-tighter leading-none tracking-tighter leading-none tracking-tighter leading-none tracking-tighter leading-none tracking-tighter leading-none tracking-tighter leading-none tracking-tighter leading-none tracking-tighter leading-none tracking-tighter leading-none tracking-tighter leading-none tracking-tighter">{label}</span>
    {edit ? (
      <select className="text-[11px] border border-slate-100 rounded-lg bg-white w-44 p-0.5 font-bold outline-none shadow-none leading-none" value={val || ""} onChange={e => onSelect(e.target.value)}>
        <option value="">-- SELEC. --</option>
        {options?.map(o => <option key={o.n} value={o.n}>{o.n}</option>)}
      </select>
    ) : <span className="text-[12px] font-black text-slate-900 tracking-tighter leading-none italic italic tracking-tighter leading-none italic shadow-none shadow-none shadow-none shadow-none shadow-none shadow-none shadow-none shadow-none shadow-none shadow-none shadow-none shadow-none shadow-none shadow-none shadow-none shadow-none shadow-none">{val || "---"}</span>}
  </div>
);

const SectionHeader = ({ title, color }) => <div className={`${color} text-white text-[9px] font-black px-4 py-1 rounded-lg uppercase mb-2 shadow-none leading-none tracking-widest leading-none shadow-none shadow-none shadow-none shadow-none shadow-none shadow-none shadow-none shadow-none shadow-none shadow-none shadow-none shadow-none shadow-none shadow-none shadow-none shadow-none shadow-none shadow-none shadow-none shadow-none shadow-none shadow-none`}>{title}</div>;

export default App;