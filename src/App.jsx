import React, { useState, useEffect, useRef, useMemo } from 'react';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { 
  BookOpen, Users, Settings, LogOut, Calendar, FileText, 
  Printer, ChevronLeft, ChevronRight, RotateCcw, ArrowDownCircle, 
  ArrowUpCircle, Trash2, AlertCircle, X, Check, Search, Filter, 
  ShieldCheck, UserPlus, Music, PlusCircle, CheckSquare, Square,
  Clock, Award, HelpCircle
} from 'lucide-react';

// --- CONFIGURACIÓN FIREBASE ---
import { initializeApp } from "firebase/app";
import { 
  getFirestore, doc, onSnapshot, setDoc, getDocs, collection 
} from "firebase/firestore";
import { 
  getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut 
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "reuniones-gp.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "reuniones-gp",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "reuniones-gp.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "347619552073",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:347619552073:web:993fe0b33570076f564898"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Roles y asignaciones configurables
export const ROLES_CONFIG = [
  { id: "presi", label: "Presi VMC", desc: "Presidente Vida y Ministerio", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  { id: "ora", label: "Oración", desc: "Oración Inicial / Final", color: "bg-blue-100 text-blue-800 border-blue-300" },
  { id: "t12", label: "Tesoros (10m/Perlas)", desc: "Tesoros partes 1 y 2", color: "bg-teal-100 text-teal-800 border-teal-300" },
  { id: "t3", label: "Lectura Bíblica", desc: "Tesoros parte 3 (Lectura)", color: "bg-cyan-100 text-cyan-800 border-cyan-300" },
  { id: "vida", label: "Vida / Cond. EB", desc: "Vida Cristiana y Conductor EB", color: "bg-rose-100 text-rose-800 border-rose-300" },
  { id: "ebLect", label: "Lector EB", desc: "Lector Estudio Bíblico de congregación", color: "bg-purple-100 text-purple-800 border-purple-300" },
  { id: "wePresi", label: "Presi Finde", desc: "Presidente Fin de Semana", color: "bg-indigo-100 text-indigo-800 border-indigo-300" },
  { id: "atCond", label: "Cond. Atalaya", desc: "Conductor Estudio de La Atalaya", color: "bg-amber-100 text-amber-800 border-amber-300" },
  { id: "atLect", label: "Lector Atalaya", desc: "Lector Estudio de La Atalaya", color: "bg-orange-100 text-orange-800 border-orange-300" },
  { id: "meca", label: "Mecánica", desc: "Entrada, Micrófonos, Audio/Video, Plataforma", color: "bg-slate-200 text-slate-800 border-slate-400" }
];

const MIEMBROS_DEFAULT = [
  { n: "Baragaño Moira", s: "F", r: [] },
  { n: "Cáceres Felix", s: "M", r: ["presi", "ora", "t12", "t3", "vida", "atCond", "wePresi"] },
  { n: "Cáceres Angela", s: "F", r: [] },
  { n: "Cáceres Abigail", s: "F", r: [] },
  { n: "Díaz Dante", s: "M", r: ["t3"] },
  { n: "Dominguez Atilio", s: "M", r: ["t3"] },
  { n: "Dominguez Norma", s: "F", r: [] },
  { n: "Gualtieri Abel", s: "M", r: ["presi", "ora", "t12", "t3", "vida", "atCond", "wePresi", "atLect", "meca"] },
  { n: "Gualtieri Mariel", s: "F", r: [] },
  { n: "Gonzalez Maria", s: "F", r: [] },
  { n: "Guzmán Angélica", s: "F", r: [] },
  { n: "Huber José", s: "M", r: [] },
  { n: "Huber Nancy", s: "F", r: [] },
  { n: "Huber Walter", s: "M", r: ["ora", "t3", "ebLect", "atLect", "meca"] },
  { n: "Montes de Oca Pamela", s: "F", r: [] },
  { n: "Montes de Oca Cristian", s: "M", r: ["ora", "t12", "t3", "vida", "atCond", "atLect", "wePresi", "meca"] },
  { n: "Luceros Mirta", s: "F", r: [] },
  { n: "Luceros Sergio", s: "M", r: ["ora", "t3", "ebLect", "atLect", "meca"] },
  { n: "Mena Georgina", s: "F", r: [] },
  { n: "Monzón Apolinaria", s: "F", r: [] },
  { n: "Ojeda Iker", s: "M", r: ["t3", "ebLect", "atLect", "meca"] },
  { n: "Ojeda Mariana", s: "F", r: [] },
  { n: "Ojeda Victor", s: "M", r: ["presi", "ora", "t12", "t3", "vida", "atCond", "wePresi", "meca"] },
  { n: "Ponce Elisa", s: "F", r: [] },
  { n: "Rojas Benjamín", s: "M", r: ["t3", "meca"] },
  { n: "Rojas Lisseth", s: "F", r: [] },
  { n: "Rojas Iara", s: "F", r: [] },
  { n: "Romero Jose", s: "M", r: ["ora", "t12", "t3", "vida", "wePresi", "meca"] },
  { n: "Romero Mateo", s: "M", r: ["ora", "t12", "t3", "vida", "atCond", "atLect", "wePresi", "meca"] },
  { n: "Romero Margarita", s: "F", r: [] },
  { n: "Sardina Clara", s: "F", r: [] },
  { n: "Sardina Jonatan", s: "M", r: ["ora", "t3", "t12", "ebLect", "atLect", "meca", "vida", "wePresi"] },
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

const OP_LIMPIEZA = [{ n: "Grupo 1" }, { n: "Grupo 2" }, { n: "Limpieza Profunda" }];
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const ANIOS_DISPONIBLES = [2025, 2026, 2027, 2028, 2029, 2030];

// Generador de semanas base del mes
const generarSemanasBase = (m, a) => {
  let firstDay = new Date(a, m, 1);
  while (firstDay.getDay() !== 1) firstDay.setDate(firstDay.getDate() + 1);
  let temp = [];
  let current = new Date(firstDay);
  for (let i = 0; i < 5; i++) {
    if (current.getMonth() !== m && i > 3) break;
    const dKey = current.toISOString().split('T')[0];
    let end = new Date(current); end.setDate(current.getDate() + 6);
    const mIni = current.toLocaleString('es-AR', { month: 'long' });
    const mFin = end.toLocaleString('es-AR', { month: 'long' });
    const rangoTexto = (current.getMonth() === end.getMonth()) 
      ? `${current.getDate()}-${end.getDate()} DE ${mIni.toUpperCase()}`
      : `${current.getDate()} DE ${mIni.toUpperCase()} AL ${end.getDate()} DE ${mFin.toUpperCase()}`;

    temp.push({
      id: current.getTime(), dateKey: dKey, rango: rangoTexto,
      meta: { lect: "LECTURA SEMANAL", can1: "0", can2: "0", can3: "0", tesoros: [], maestros: [], vida: [], atT: "Título Atalaya..." },
      asig: {}
    });
    current.setDate(current.getDate() + 7);
  }
  return temp;
};

// Encontrar la semana actual según la fecha del sistema
const encontrarSemanaActual = (semanas) => {
  if (!semanas || semanas.length === 0) return 0;
  const hoy = new Date();
  for (let i = 0; i < semanas.length; i++) {
    const inicio = new Date(semanas[i].dateKey + "T00:00:00");
    const fin = new Date(inicio);
    fin.setDate(inicio.getDate() + 6);
    fin.setHours(23, 59, 59, 999);
    if (hoy >= inicio && hoy <= fin) return i;
  }
  let masCercano = 0;
  let minDiff = Infinity;
  semanas.forEach((s, idx) => {
    const sDate = new Date(s.dateKey + "T00:00:00");
    const diff = Math.abs(hoy - sDate);
    if (diff < minDiff) { minDiff = diff; masCercano = idx; }
  });
  return masCercano;
};

const App = () => {
  const [user, setUser] = useState(null);
  const [loginMail, setLoginMail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loading, setLoading] = useState(true);

  const hoyRef = useMemo(() => new Date(), []);
  const [mes, setMes] = useState(hoyRef.getMonth());
  const [anio, setAnio] = useState(hoyRef.getFullYear());
  const [semanas, setSemanas] = useState([]);
  const [vista, setVista] = useState('semana'); // 'semana' | 'mes'
  const [semanaIdx, setSemanaIdx] = useState(0);
  const [pestana, setPestana] = useState(() => {
    const d = new Date().getDay();
    return (d === 5 || d === 6 || d === 0) ? 'findesemana' : 'entresemana';
  });

  const targetWeekRef = useRef(null);
  const [editMode, setEditMode] = useState(false);
  const [showMeta, setShowMeta] = useState(false);
  const [historialProgramas, setHistorialProgramas] = useState({});
  const [partnerModal, setPartnerModal] = useState({ isOpen: false, memberName: '', history: [] });
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [sheetType, setSheetType] = useState('entresemana'); // 'entresemana' | 'findesemana' | 'mecanicas'
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Lista dinámica de miembros sincronizada con Firestore
  const [miembros, setMiembros] = useState(MIEMBROS_DEFAULT);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberFilterRole, setMemberFilterRole] = useState('ALL');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberGender, setNewMemberGender] = useState('M');
  const [newMemberRoles, setNewMemberRoles] = useState([]);
  const [savingMembers, setSavingMembers] = useState(false);

  // Roles de usuarios
  const userEmail = (user?.email || '').toLowerCase().trim();
  const isAdmin = userEmail === "biktormo@gmail.com";
  const canEditEntresemana = isAdmin || userEmail === "abel@pinedo.com" || userEmail === "mateo@pinedo.com";
  const canEditFinde = isAdmin || userEmail === "cristian@pinedo.com";
  const canEditMeca = isAdmin || userEmail === "mateo@pinedo.com";
  const canEditAny = canEditEntresemana || canEditFinde || canEditMeca || isAdmin;

  const getRoleBadge = () => {
    if (isAdmin) return { label: "Admin Total (Victor)", color: "bg-purple-600 text-white" };
    if (userEmail === "mateo@pinedo.com") return { label: "Editor Entresemana y Mecánicas", color: "bg-blue-600 text-white" };
    if (userEmail === "abel@pinedo.com") return { label: "Editor Entresemana", color: "bg-emerald-600 text-white" };
    if (userEmail === "cristian@pinedo.com") return { label: "Editor Fin de Semana", color: "bg-sky-600 text-white" };
    return null;
  };

  // Listas de hermanos filtradas
  const getFiltered = (rol, type = "normal") => {
    if (type === "disc") return miembros.filter(m => m.s === "M");
    if (rol === "all" || !rol) return miembros;
    return miembros.filter(m => Array.isArray(m.r) && m.r.includes(rol));
  };

  const SE = useMemo(() => {
    return miembros.filter(m => Array.isArray(m.r) && m.r.includes("meca") && !m.n.toLowerCase().includes("iker") && !m.n.toLowerCase().includes("benjam"));
  }, [miembros]);

  const CE = useMemo(() => {
    return miembros.filter(m => Array.isArray(m.r) && m.r.includes("meca"));
  }, [miembros]);

  // Auth Listener
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setLoading(false);
    });
    return () => unsubAuth();
  }, []);

  // Sincronizar semanas del mes actual
  useEffect(() => {
    if (!user) return;
    const docId = `${anio}-${mes + 1}`;
    const unsub = onSnapshot(doc(db, "programas", docId), (docSnap) => {
      let base = generarSemanasBase(mes, anio);
      let fusion = base;
      if (docSnap.exists()) {
        const cloud = docSnap.data().semanas || [];
        fusion = base.map(s => {
          const match = cloud.find(c => c.dateKey === s.dateKey);
          return match ? { ...s, asig: match.asig || {}, meta: match.meta || s.meta } : s;
        });
      }
      setSemanas(fusion);
      setHistorialProgramas(prev => ({ ...prev, [docId]: fusion }));

      if (targetWeekRef.current === 'last') {
        setSemanaIdx(fusion.length - 1);
        targetWeekRef.current = null;
      } else if (targetWeekRef.current === 'first') {
        setSemanaIdx(0);
        targetWeekRef.current = null;
      } else {
        if (mes === hoyRef.getMonth() && anio === hoyRef.getFullYear()) {
          setSemanaIdx(encontrarSemanaActual(fusion));
        } else {
          setSemanaIdx(0);
        }
      }
    });
    return () => unsub();
  }, [user, mes, anio, hoyRef]);

  // Cargar historial de todos los meses de programas para detección de repeticiones y parejas
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const snap = await getDocs(collection(db, "programas"));
        let hist = {};
        snap.forEach(d => {
          const data = d.data();
          if (data && data.semanas) hist[d.id] = data.semanas;
        });
        setHistorialProgramas(prev => ({ ...hist, ...prev }));
      } catch (err) {
        console.error("Error al cargar historial de programas:", err);
      }
    })();
  }, [user]);

  // Sincronizar lista de hermanos desde Firestore
  useEffect(() => {
    if (!user) return;
    const unsubMiembros = onSnapshot(doc(db, "programas", "configuracion_miembros"), (snap) => {
      if (snap.exists() && Array.isArray(snap.data().lista) && snap.data().lista.length > 0) {
        const listaOrd = [...snap.data().lista].sort((a, b) => a.n.localeCompare(b.n));
        setMiembros(listaOrd);
      } else {
        setMiembros(MIEMBROS_DEFAULT);
      }
    }, (error) => {
      console.warn("Usando lista local de miembros:", error);
      setMiembros(MIEMBROS_DEFAULT);
    });
    return () => unsubMiembros();
  }, [user]);

  const pushUpdate = async (newData) => {
    await setDoc(doc(db, "programas", `${anio}-${mes + 1}`), { semanas: newData });
  };

  // Guardar lista de miembros en Firestore
  const pushMiembrosCloud = async (nuevaLista) => {
    setSavingMembers(true);
    const ordenada = [...nuevaLista].sort((a, b) => a.n.localeCompare(b.n));
    setMiembros(ordenada);
    try {
      await setDoc(doc(db, "programas", "configuracion_miembros"), { lista: ordenada });
    } catch (err) {
      console.error("Error al guardar miembros:", err);
      alert("Error al guardar en Firebase: " + err.message);
    } finally {
      setSavingMembers(false);
    }
  };

  // Agregar nuevo hermano/a
  const handleAddMember = (e) => {
    e.preventDefault();
    const nombre = newMemberName.trim();
    if (!nombre) {
      alert("Ingresa el nombre del hermano o hermana");
      return;
    }
    if (miembros.some(m => m.n.toLowerCase() === nombre.toLowerCase())) {
      alert("Ya existe un miembro con ese nombre");
      return;
    }
    const nuevo = {
      n: nombre,
      s: newMemberGender,
      r: newMemberGender === 'F' ? [] : newMemberRoles
    };
    const actualizada = [...miembros, nuevo];
    pushMiembrosCloud(actualizada);
    setNewMemberName('');
    setNewMemberRoles([]);
  };

  // Eliminar hermano/a de la congregación
  const handleDeleteMember = (nombre) => {
    if (!window.confirm(`¿Seguro que deseas eliminar a "${nombre}" de la lista general y de todas las asignaciones?`)) return;
    const actualizada = miembros.filter(m => m.n !== nombre);
    pushMiembrosCloud(actualizada);
  };

  // Alternar rol/asignación de un hermano
  const handleToggleMemberRole = (nombre, roleId) => {
    const actualizada = miembros.map(m => {
      if (m.n !== nombre) return m;
      const tieneRol = Array.isArray(m.r) && m.r.includes(roleId);
      const rolesActuales = Array.isArray(m.r) ? m.r : [];
      const nuevosRoles = tieneRol 
        ? rolesActuales.filter(r => r !== roleId)
        : [...rolesActuales, roleId];
      return { ...m, r: nuevosRoles };
    });
    pushMiembrosCloud(actualizada);
  };

  // Restablecer miembros a valores por defecto
  const handleResetMiembros = () => {
    if (!window.confirm("¿Restablecer la lista completa de hermanos a los valores iniciales predeterminados?")) return;
    pushMiembrosCloud(MIEMBROS_DEFAULT);
  };

  const updateAsig = (sIdx, field, val) => {
    if (!canEditAny) return;
    const n = [...semanas];
    if (!n[sIdx].asig) n[sIdx].asig = {};
    n[sIdx].asig[field] = val;
    setSemanas(n);
    pushUpdate(n);
  };

  const updateMetaItem = (sIdx, section, itemIdx, field, val) => {
    if (!isAdmin) return;
    const n = [...semanas];
    n[sIdx].meta[section][itemIdx][field] = val;
    setSemanas(n);
    pushUpdate(n);
  };

  const deleteMetaItem = (sIdx, section, itemIdx) => {
    if (!isAdmin || !window.confirm("¿Eliminar este tema?")) return;
    const n = [...semanas];
    n[sIdx].meta[section].splice(itemIdx, 1);
    setSemanas(n);
    pushUpdate(n);
  };

  const addMetaItem = (sIdx, section) => {
    if (!isAdmin) return;
    const n = [...semanas];
    if (!n[sIdx].meta[section]) n[sIdx].meta[section] = [];
    n[sIdx].meta[section].push({ t: "Nuevo Tema", d: "Descripción..." });
    setSemanas(n);
    pushUpdate(n);
  };

  const moveItem = (sIdx, from, to, itemIdx) => {
    if (!isAdmin) return;
    const n = [...semanas];
    const item = n[sIdx].meta[from][itemIdx];
    n[sIdx].meta[from].splice(itemIdx, 1);
    if (!n[sIdx].meta[to]) n[sIdx].meta[to] = [];
    n[sIdx].meta[to].push(item);
    setSemanas(n);
    pushUpdate(n);
  };

  const clearWeek = (sIdx) => {
    if (!isAdmin || !window.confirm("¿Borrar todo el contenido de esta semana?")) return;
    const n = [...semanas];
    n[sIdx].meta = { lect: "LECTURA SEMANAL", can1: "0", can2: "0", can3: "0", tesoros: [], maestros: [], vida: [], atT: "Título Atalaya..." };
    n[sIdx].asig = {};
    setSemanas(n);
    pushUpdate(n);
  };

  const processPastedText = (sIdx, text) => {
    if (!text || !isAdmin) return;
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const n = [...semanas];
    let currentItems = []; let currentItem = null; let sectionState = "START"; let songs = []; let weekReading = "";

    lines.forEach((line, idx) => {
      const up = line.toUpperCase();
      if (up.includes("TESOROS")) sectionState = "T";
      else if (up.includes("SEAMOS MEJORES")) sectionState = "M";
      else if (up.includes("NUESTRA VIDA")) sectionState = "V";
      if (line.toLowerCase().includes("canción") && idx > 0 && sectionState === "START") weekReading = lines[idx - 1];
      const canMatch = line.match(/\bCanci[óo]n\s+(\d+)\b/i);
      if (canMatch) songs.push(canMatch[1]);

      if (line.match(/^\d+\./)) {
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
    pushUpdate(n);
  };

  const prevSemana = () => {
    if (semanaIdx > 0) {
      setSemanaIdx(semanaIdx - 1);
    } else {
      targetWeekRef.current = 'last';
      if (mes === 0) { setMes(11); setAnio(anio - 1); }
      else { setMes(mes - 1); }
    }
  };

  const nextSemana = () => {
    if (semanaIdx < semanas.length - 1) {
      setSemanaIdx(semanaIdx + 1);
    } else {
      targetWeekRef.current = 'first';
      if (mes === 11) { setMes(0); setAnio(anio + 1); }
      else { setMes(mes + 1); }
    }
  };

  const irSemanaActual = () => {
    const curM = hoyRef.getMonth();
    const curA = hoyRef.getFullYear();
    if (mes !== curM || anio !== curA) {
      setMes(curM);
      setAnio(curA);
    } else {
      setSemanaIdx(encontrarSemanaActual(semanas));
    }
  };

  // Detector de asignación repetida semana anterior
  const esRepetidoSemanaAnt = (sIdx, field, val) => {
    if (!val) return false;
    let prevAsig = null;
    if (sIdx > 0) {
      prevAsig = semanas[sIdx - 1]?.asig;
    } else {
      const prevMesNum = mes === 0 ? 11 : mes - 1;
      const prevAnioNum = mes === 0 ? anio - 1 : anio;
      const prevMonthWeeks = historialProgramas[`${prevAnioNum}-${prevMesNum + 1}`];
      if (prevMonthWeeks && prevMonthWeeks.length > 0) {
        prevAsig = prevMonthWeeks[prevMonthWeeks.length - 1]?.asig;
      }
    }
    if (!prevAsig) return false;
    if (field === 'atEn') return prevAsig.atEn === val;
    if (field === 'atPl') return prevAsig.atPl === val;
    if (field === 'av') return prevAsig.av === val;
    if (field === 'limp') return prevAsig.limp === val;
    if (field.startsWith('micEntre')) {
      return [prevAsig.micEntre1, prevAsig.micEntre2, prevAsig.mic1, prevAsig.mic2].includes(val);
    }
    if (field.startsWith('micFds')) {
      return [prevAsig.micFds1, prevAsig.micFds2, prevAsig.mic1, prevAsig.mic2].includes(val);
    }
    return false;
  };

  // Historial de parejas para estudiantes
  const abrirHistorialParejas = (nombreEstudiante) => {
    if (!nombreEstudiante) return;
    let todas = [];
    Object.values(historialProgramas).forEach(arr => {
      if (Array.isArray(arr)) arr.forEach(w => todas.push(w));
    });
    semanas.forEach(w => {
      if (!todas.some(t => t.dateKey === w.dateKey)) todas.push(w);
    });
    todas.sort((a, b) => (b.dateKey || '').localeCompare(a.dateKey || ''));

    let hist = [];
    for (const w of todas) {
      if (!w.meta?.maestros || !w.asig) continue;
      w.meta.maestros.forEach((m, mIdx) => {
        const est = w.asig[`m${mIdx}`];
        const ayu = w.asig[`m${mIdx}A`];
        if (est === nombreEstudiante && ayu) {
          hist.push({ date: w.rango || w.dateKey, partner: ayu, role: 'Estudiante', partnerRole: 'Ayudante', partTitle: m.t || 'Demostración' });
        } else if (ayu === nombreEstudiante && est) {
          hist.push({ date: w.rango || w.dateKey, partner: est, role: 'Ayudante', partnerRole: 'Estudiante', partTitle: m.t || 'Demostración' });
        }
      });
      if (hist.length >= 5) break;
    }
    setPartnerModal({ isOpen: true, memberName: nombreEstudiante, history: hist.slice(0, 5) });
  };

  const handleSelectEstudiante = (sIdx, field, val) => {
    updateAsig(sIdx, field, val);
    if (val && canEditAny) abrirHistorialParejas(val);
  };

  const printMonthlySheet = () => {
    document.body.classList.add('printing-monthly-sheet');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-monthly-sheet');
    }, 1200);
  };

  const downloadMonthlySheetPdf = async () => {
    const el = document.getElementById('monthly-preview-sheet');
    if (!el) return;
    setGeneratingPdf(true);
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const isLandscape = sheetType === 'mecanicas';
      const pdf = new jsPDF(isLandscape ? 'l' : 'p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 6;
      const printWidth = pageWidth - (margin * 2);
      const printHeight = pageHeight - (margin * 2);
      const ratio = Math.min(printWidth / canvas.width, printHeight / canvas.height);
      const canvasW = canvas.width * ratio;
      const canvasH = canvas.height * ratio;
      const posX = margin + ((printWidth - canvasW) / 2);
      pdf.addImage(imgData, 'PNG', posX, margin, canvasW, canvasH);
      const filename = sheetType === 'entresemana'
        ? `Programa Entresemana - ${MESES[mes]} ${anio}.pdf`
        : sheetType === 'findesemana'
        ? `Programa Fin de Semana - ${MESES[mes]} ${anio}.pdf`
        : `Asignaciones Mecanicas - ${MESES[mes]} ${anio}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error("Error generando PDF:", err);
      alert("Hubo un error al generar el PDF: " + err.message);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, loginMail, loginPass);
    } catch {
      alert("Credenciales incorrectas o problema de conexión");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white font-sans p-4">
        <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-base sm:text-xl font-black uppercase tracking-widest text-blue-400 text-center">
          Programa de Reuniones General Pinedo
        </h2>
        <p className="text-xs text-slate-400 mt-2">Cargando programa...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 border-t-8 border-blue-600">
          <div className="text-center mb-6">
            <span className="inline-block p-3 bg-blue-100 text-blue-700 rounded-2xl mb-3 shadow-inner">
              <BookOpen size={32} />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 uppercase tracking-tight">
              Programa de Reuniones General Pinedo
            </h1>
            <p className="text-xs font-semibold text-slate-500 mt-1">Gestión de Asignaciones y Reuniones</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Correo electrónico</label>
              <input 
                type="email" 
                required 
                placeholder="congre@pinedo.com" 
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500" 
                onChange={e => setLoginMail(e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contraseña</label>
              <input 
                type="password" 
                required 
                placeholder="••••••••" 
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500" 
                onChange={e => setLoginPass(e.target.value)} 
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-white py-3.5 rounded-xl font-black uppercase text-sm shadow-lg shadow-blue-500/30"
            >
              Iniciar Sesión
            </button>
          </form>
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">PWA optimizada para celulares y computadoras</p>
          </div>
        </div>
      </div>
    );
  }

  const roleInfo = getRoleBadge();
  const currentWeek = semanas[semanaIdx] || null;

  // Filtrado de miembros en el modal de gestión
  const filteredModalMembers = miembros.filter(m => {
    const matchesSearch = m.n.toLowerCase().includes(memberSearch.toLowerCase());
    if (!matchesSearch) return false;
    if (memberFilterRole === 'ALL') return true;
    if (memberFilterRole === 'M') return m.s === 'M';
    if (memberFilterRole === 'F') return m.s === 'F';
    return Array.isArray(m.r) && m.r.includes(memberFilterRole);
  });

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-20 selection:bg-blue-200 selection:text-blue-900">
      <style>{`
        @media print {
          body { background: white !important; }
          .print-hidden { display: none !important; }
          .page-break { page-break-before: always; }
          .page-break:first-of-type { page-break-before: avoid; }
        }
        body.printing-monthly-sheet > * { display: none !important; }
        body.printing-monthly-sheet #monthly-print-portal { display: block !important; }
        @page { size: auto; margin: 4mm; }
        @media print {
          #monthly-preview-sheet { border: none !important; box-shadow: none !important; width: 100% !important; max-width: 100% !important; padding: 2mm !important; }
          .avoid-break { break-inside: avoid; }
        }
      `}</style>

      {/* HEADER / NAVBAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm print-hidden">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 text-white p-2 rounded-xl shadow-md shrink-0">
                <BookOpen size={20} />
              </div>
              <div>
                <h1 className="text-xs sm:text-sm md:text-base font-black tracking-tight leading-tight uppercase text-slate-900">
                  Programa de Reuniones General Pinedo
                </h1>
                {roleInfo && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${roleInfo.color}`}>
                      {roleInfo.label}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto flex-wrap">
              {isAdmin && (
                <button 
                  onClick={() => setShowMembersModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-black text-xs bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-all"
                  title="Gestionar hermanos y asignaciones autorizadas"
                >
                  <Users size={14} />
                  <span>Hermanos ({miembros.length})</span>
                </button>
              )}

              {canEditAny && (
                <button 
                  onClick={() => setEditMode(!editMode)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-sm transition-all ${
                    editMode 
                      ? 'bg-amber-600 hover:bg-amber-700 text-white ring-2 ring-amber-400' 
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
                  }`}
                  title={editMode ? "Guardar y ver en modo lectura" : "Habilitar edición"}
                >
                  {editMode ? (
                    <><span>💾</span><span>Finalizar</span></>
                  ) : (
                    <><span>✏️</span><span>Asignar</span></>
                  )}
                </button>
              )}

              {isAdmin && (
                <button 
                  onClick={() => setShowMeta(!showMeta)}
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs border transition-all ${
                    showMeta ? 'bg-amber-500 text-white border-amber-600' : 'bg-slate-50 text-slate-700 border-slate-300'
                  }`}
                >
                  <Settings size={14} /> Estructura
                </button>
              )}

              {/* Selector combinado: Año primero y luego Mes */}
              <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl shadow-sm overflow-hidden divide-x divide-slate-200">
                <select 
                  className="bg-transparent font-black text-xs text-blue-900 px-2 py-1.5 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                  value={anio} 
                  onChange={e => setAnio(Number(e.target.value))}
                  title="Seleccionar Año"
                >
                  {ANIOS_DISPONIBLES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>

                <select 
                  className="bg-transparent font-bold text-xs text-slate-800 px-2.5 py-1.5 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                  value={mes} 
                  onChange={e => setMes(Number(e.target.value))}
                  title="Seleccionar Mes"
                >
                  {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
              </div>

              <button 
                onClick={() => { signOut(auth); setUser(null); }}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                title="Cerrar sesión"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>

          {/* Subbarra con selector de vista y botón PDF */}
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
            <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
              <button 
                onClick={() => setVista('semana')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  vista === 'semana' ? 'bg-white text-blue-700 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar size={14} /> Vista Semanal
              </button>
              <button 
                onClick={() => setVista('mes')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  vista === 'mes' ? 'bg-white text-blue-700 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText size={14} /> Mes Completo
              </button>
            </div>

            <button 
              onClick={() => setShowPdfModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
            >
              <Printer size={14} /> <span>PDF Mensual</span>
            </button>
          </div>
        </div>
      </header>

      {/* --- MODAL DE ADMINISTRACIÓN DE HERMANOS Y ASIGNACIONES --- */}
      {showMembersModal && isAdmin && (
        <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in duration-200">
            {/* Cabecera del Modal */}
            <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 p-5 text-white flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={22} className="text-yellow-300" />
                  <h2 className="text-lg font-black uppercase tracking-tight">Gestión de Hermanos y Asignaciones</h2>
                </div>
                <p className="text-xs text-purple-100 mt-0.5">Agrega o quita hermanos y gestiona sus asignaciones para que los editores puedan filtrar.</p>
              </div>
              <button 
                onClick={() => setShowMembersModal(false)}
                className="p-2 hover:bg-white/20 rounded-full text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Formulario para agregar nuevo hermano */}
            <div className="bg-slate-50 p-4 border-b border-slate-200">
              <form onSubmit={handleAddMember} className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-purple-900 uppercase">
                  <UserPlus size={15} /> Añadir Nuevo Hermano o Hermana
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  <div className="sm:col-span-6">
                    <input 
                      type="text" 
                      placeholder="Apellido y Nombre (ej: Gómez Juan)" 
                      value={newMemberName} 
                      onChange={e => setNewMemberName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-purple-500" 
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <select 
                      value={newMemberGender} 
                      onChange={e => setNewMemberGender(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                    >
                      <option value="M">Varón (Hermano)</option>
                      <option value="F">Mujer (Hermana)</option>
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <button 
                      type="submit" 
                      disabled={savingMembers}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase py-2 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <PlusCircle size={14} /> Agregar
                    </button>
                  </div>
                </div>

                {newMemberGender === 'M' && (
                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1.5">Asignaciones iniciales autorizadas:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ROLES_CONFIG.map(rc => {
                        const isChecked = newMemberRoles.includes(rc.id);
                        return (
                          <button
                            type="button"
                            key={rc.id}
                            onClick={() => {
                              if (isChecked) setNewMemberRoles(newMemberRoles.filter(r => r !== rc.id));
                              else setNewMemberRoles([...newMemberRoles, rc.id]);
                            }}
                            className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border transition-all ${
                              isChecked ? 'bg-purple-600 text-white border-purple-700 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                            }`}
                          >
                            {isChecked ? '✓ ' : '+ '}{rc.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Barra de Búsqueda y Filtro de Roles */}
            <div className="p-4 bg-white border-b border-slate-200 flex flex-wrap gap-3 items-center justify-between">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar hermano/a por nombre..." 
                  value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-purple-400"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-slate-500" />
                <select 
                  value={memberFilterRole}
                  onChange={e => setMemberFilterRole(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold outline-none"
                >
                  <option value="ALL">Todos los miembros ({miembros.length})</option>
                  <option value="M">Solo Varones ({miembros.filter(m => m.s === 'M').length})</option>
                  <option value="F">Solo Hermanas ({miembros.filter(m => m.s === 'F').length})</option>
                  <optgroup label="Filtrar por Asignación">
                    {ROLES_CONFIG.map(rc => (
                      <option key={rc.id} value={rc.id}>
                        {rc.label} ({miembros.filter(m => Array.isArray(m.r) && m.r.includes(rc.id)).length})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Lista de Hermanos y asignaciones interactivas */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <div className="flex justify-between items-center text-[11px] font-black text-slate-400 uppercase pb-1 border-b">
                <span>Hermano / Asignaciones ({filteredModalMembers.length} mostrados)</span>
                <span>Acciones</span>
              </div>

              {filteredModalMembers.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs font-bold">
                  No se encontraron miembros con el criterio especificado.
                </div>
              ) : (
                filteredModalMembers.map(m => (
                  <div key={m.n} className="bg-slate-50 hover:bg-slate-100/80 p-3 rounded-2xl border border-slate-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${m.s === 'M' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                          {m.s === 'M' ? 'Hno' : 'Hna'}
                        </span>
                        <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{m.n}</span>
                      </div>

                      {/* Asignaciones del hermano */}
                      {m.s === 'M' ? (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {ROLES_CONFIG.map(rc => {
                            const tieneRol = Array.isArray(m.r) && m.r.includes(rc.id);
                            return (
                              <button
                                key={rc.id}
                                onClick={() => handleToggleMemberRole(m.n, rc.id)}
                                title={`${tieneRol ? 'Quitar de' : 'Agregar a'} ${rc.desc}`}
                                className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border transition-all ${
                                  tieneRol 
                                    ? rc.color + ' shadow-xs font-extrabold hover:opacity-80' 
                                    : 'bg-white text-slate-300 border-slate-200 hover:border-slate-400 hover:text-slate-600 opacity-60'
                                }`}
                              >
                                {tieneRol ? `✓ ${rc.label}` : `+ ${rc.label}`}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">Participa en asignaciones de estudiantes (Seamos mejores maestros) y ayudantes.</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button 
                        onClick={() => handleDeleteMember(m.n)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title={`Eliminar a ${m.n}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pie del modal */}
            <div className="bg-slate-100 p-4 border-t border-slate-200 flex flex-wrap justify-between items-center gap-2">
              <button 
                onClick={handleResetMiembros}
                className="text-[10px] font-bold text-red-600 hover:underline uppercase flex items-center gap-1"
              >
                <RotateCcw size={12} /> Restaurar lista original predeterminada
              </button>
              <button 
                onClick={() => setShowMembersModal(false)}
                className="bg-slate-900 hover:bg-black text-white px-6 py-2 rounded-xl text-xs font-black uppercase transition-all"
              >
                Listo / Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ÁREA PRINCIPAL */}
      <main className="max-w-5xl mx-auto px-3 sm:px-6 pt-4">
        {/* VISTA SEMANAL */}
        {vista === 'semana' && currentWeek && (
          <div className="space-y-4">
            {/* Navegador de Semanas */}
            <div className="bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between gap-2">
              <button 
                onClick={prevSemana}
                className="flex items-center justify-center gap-1 p-2.5 sm:px-4 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition-all active:scale-95"
                title="Semana anterior"
              >
                <ChevronLeft size={18} />
                <span className="hidden sm:inline">Anterior</span>
              </button>

              <div className="text-center px-1">
                <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Semana {semanaIdx + 1} de {semanas.length} ({MESES[mes]} {anio})
                </span>
                <span className="text-xs sm:text-base font-black text-slate-900 uppercase tracking-tight">
                  {currentWeek.rango}
                </span>
                {(mes !== hoyRef.getMonth() || anio !== hoyRef.getFullYear() || semanaIdx !== encontrarSemanaActual(semanas)) && (
                  <button 
                    onClick={irSemanaActual}
                    className="block mx-auto mt-1 text-[10px] font-extrabold text-blue-600 hover:underline uppercase"
                  >
                    📅 Ir a semana actual
                  </button>
                )}
              </div>

              <button 
                onClick={nextSemana}
                className="flex items-center justify-center gap-1 p-2.5 sm:px-4 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition-all active:scale-95"
                title="Semana siguiente"
              >
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Pestañas: Entresemana vs Fin de Semana */}
            <div className="grid grid-cols-2 gap-2 bg-slate-200/80 p-1.5 rounded-2xl border border-slate-300">
              <button 
                onClick={() => setPestana('entresemana')}
                className={`py-3 px-3 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  pestana === 'entresemana'
                    ? 'bg-[#007B5E] text-white shadow-md ring-2 ring-[#007B5E]/30'
                    : 'bg-white/80 hover:bg-white text-slate-700'
                }`}
              >
                <BookOpen size={18} />
                <span>Reunión Entresemana</span>
              </button>
              <button 
                onClick={() => setPestana('findesemana')}
                className={`py-3 px-3 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  pestana === 'findesemana'
                    ? 'bg-blue-800 text-white shadow-md ring-2 ring-blue-800/30'
                    : 'bg-white/80 hover:bg-white text-slate-700'
                }`}
              >
                <Users size={18} />
                <span>Fin de Semana</span>
              </button>
            </div>

            {/* Editor de Estructura JW (Solo Admin) */}
            {showMeta && isAdmin && (
              <div className="bg-amber-50 p-4 rounded-2xl border-2 border-amber-300 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-900 uppercase">Pegar Guía de Actividades de JW.org</span>
                  <button 
                    onClick={() => clearWeek(semanaIdx)}
                    className="text-red-600 hover:text-red-700 font-bold text-xs flex items-center gap-1"
                  >
                    <RotateCcw size={14} /> Limpiar Semana
                  </button>
                </div>
                <textarea 
                  className="w-full h-24 p-3 rounded-xl border border-amber-300 text-xs font-mono bg-white outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Pega el contenido copiado de la reunión en JW.org aquí..."
                  onPaste={e => processPastedText(semanaIdx, e.clipboardData.getData('Text'))}
                />
              </div>
            )}

            {/* CONTENIDO DE LA REUNIÓN SEGÚN PESTAÑA */}
            <div className="space-y-4">
              {/* --- PESTAÑA REUNIÓN ENTRESEMANA --- */}
              {pestana === 'entresemana' && (
                <div className="space-y-4">
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-[#007B5E] text-white p-4 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <BookOpen size={22} />
                        <h2 className="font-black uppercase tracking-wider text-sm sm:text-base">Vida y Ministerio Cristianos</h2>
                      </div>
                    </div>

                    <div className="bg-emerald-50/70 border-b border-emerald-100 p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs font-black">
                      <span className="text-emerald-900 bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                        🎵 Canción {currentWeek.meta.can1}
                      </span>
                      <span className="text-emerald-800 uppercase tracking-tight">
                        📖 {currentWeek.meta.lect}
                      </span>
                    </div>

                    <div className="p-4 sm:p-6 space-y-6">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                        <SelectRow 
                          label="Presidente" 
                          val={currentWeek.asig.presi} 
                          options={getFiltered("presi")} 
                          edit={editMode && canEditEntresemana} 
                          onSelect={e => updateAsig(semanaIdx, 'presi', e)} 
                          canEditAny={canEditAny} 
                        />
                        <SelectRow 
                          label="Oración Inicial" 
                          val={currentWeek.asig.orIn} 
                          options={getFiltered("ora")} 
                          edit={editMode && canEditEntresemana} 
                          onSelect={e => updateAsig(semanaIdx, 'orIn', e)} 
                          canEditAny={canEditAny} 
                        />
                      </div>

                      {/* Tesoros */}
                      <div>
                        <div className="bg-[#007B5E] text-white text-xs font-black px-3.5 py-1.5 rounded-xl uppercase tracking-wider inline-block mb-3">
                          Tesoros de la Biblia
                        </div>
                        <div className="space-y-3">
                          {currentWeek.meta.tesoros?.map((t, idx) => (
                            <div key={idx} className="bg-slate-50/60 p-3.5 rounded-2xl border border-slate-200">
                              <div className="flex justify-between items-start gap-2 mb-1.5">
                                {showMeta && isAdmin ? (
                                  <input 
                                    className="w-full text-xs font-bold border-b bg-transparent outline-none uppercase" 
                                    value={t.t} 
                                    onChange={e => updateMetaItem(semanaIdx, 'tesoros', idx, 't', e.target.value)} 
                                  />
                                ) : (
                                  <p className="text-xs sm:text-sm font-black text-emerald-950 uppercase">{t.t}</p>
                                )}
                                {showMeta && isAdmin && (
                                  <div className="flex gap-1">
                                    <button onClick={() => moveItem(semanaIdx, 'tesoros', 'maestros', idx)} className="text-amber-500">
                                      <ArrowDownCircle size={16} />
                                    </button>
                                    <button onClick={() => deleteMetaItem(semanaIdx, 'tesoros', idx)} className="text-red-400">
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                )}
                              </div>
                              {t.d && <p className="text-xs text-slate-500 mb-2 leading-relaxed">{t.d}</p>}
                              <SelectRow 
                                label="Asignado" 
                                val={currentWeek.asig[`t${idx}`]} 
                                options={getFiltered(idx === 2 ? "t3" : "t12")} 
                                edit={editMode && canEditEntresemana} 
                                onSelect={e => updateAsig(semanaIdx, `t${idx}`, e)} 
                                canEditAny={canEditAny} 
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Maestros */}
                      <div>
                        <div className="bg-[#C18B00] text-white text-xs font-black px-3.5 py-1.5 rounded-xl uppercase tracking-wider inline-block mb-3">
                          Seamos Mejores Maestros
                        </div>
                        <div className="space-y-3">
                          {currentWeek.meta.maestros?.map((m, idx) => {
                            const isDiscurso = m.t?.toLowerCase().includes("discurso");
                            return (
                              <div key={idx} className="bg-amber-50/40 p-3.5 rounded-2xl border border-amber-200/60">
                                <div className="flex justify-between items-start gap-2 mb-1.5">
                                  {showMeta && isAdmin ? (
                                    <input 
                                      className="w-full text-xs font-bold border-b bg-transparent outline-none uppercase" 
                                      value={m.t} 
                                      onChange={e => updateMetaItem(semanaIdx, 'maestros', idx, 't', e.target.value)} 
                                    />
                                  ) : (
                                    <p className="text-xs sm:text-sm font-black text-amber-950 uppercase">{m.t}</p>
                                  )}
                                  {showMeta && isAdmin && (
                                    <div className="flex gap-1">
                                      <button onClick={() => moveItem(semanaIdx, 'maestros', 'tesoros', idx)} className="text-emerald-500">
                                        <ArrowUpCircle size={16} />
                                      </button>
                                      <button onClick={() => moveItem(semanaIdx, 'maestros', 'vida', idx)} className="text-red-500">
                                        <ArrowDownCircle size={16} />
                                      </button>
                                      <button onClick={() => deleteMetaItem(semanaIdx, 'maestros', idx)} className="text-red-400">
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                {m.d && <p className="text-xs text-slate-500 mb-2 leading-relaxed">{m.d}</p>}

                                {isDiscurso ? (
                                  <SelectRow 
                                    label="Discursante" 
                                    val={currentWeek.asig[`m${idx}`]} 
                                    options={getFiltered("", "disc")} 
                                    edit={editMode && canEditEntresemana} 
                                    onSelect={e => updateAsig(semanaIdx, `m${idx}`, e)} 
                                    canEditAny={canEditAny} 
                                  />
                                ) : (
                                  <div className="space-y-2">
                                    <SelectRow 
                                      label="Estudiante" 
                                      val={currentWeek.asig[`m${idx}`]} 
                                      options={miembros} 
                                      edit={editMode && canEditEntresemana} 
                                      onSelect={e => handleSelectEstudiante(semanaIdx, `m${idx}`, e)} 
                                      onViewHistory={() => abrirHistorialParejas(currentWeek.asig[`m${idx}`])} 
                                      canEditAny={canEditAny} 
                                    />
                                    <SelectRow 
                                      label="Ayudante" 
                                      val={currentWeek.asig[`m${idx}A`]} 
                                      options={miembros} 
                                      edit={editMode && canEditEntresemana} 
                                      onSelect={e => handleSelectEstudiante(semanaIdx, `m${idx}A`, e)} 
                                      onViewHistory={() => abrirHistorialParejas(currentWeek.asig[`m${idx}A`])} 
                                      canEditAny={canEditAny} 
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {showMeta && isAdmin && (
                            <button 
                              onClick={() => addMetaItem(semanaIdx, 'maestros')}
                              className="text-xs font-black text-amber-700 hover:text-amber-800 flex items-center gap-1 mt-2"
                            >
                              <PlusCircle size={14} /> Añadir Parte de Maestros
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Vida Cristiana */}
                      <div>
                        <div className="bg-[#8A1A11] text-white text-xs font-black px-3.5 py-1.5 rounded-xl uppercase tracking-wider inline-block mb-3">
                          Nuestra Vida Cristiana
                        </div>
                        <div className="space-y-3">
                          <div className="text-xs font-black text-red-900 bg-red-50 p-2.5 rounded-xl border border-red-100 inline-block">
                            🎵 Canción {currentWeek.meta.can2}
                          </div>
                          {currentWeek.meta.vida?.map((v, idx) => {
                            const isEstudio = v.t?.toLowerCase().includes("estudio b") || v.t?.toLowerCase().includes("viajante");
                            return (
                              <div key={idx} className="bg-red-50/30 p-3.5 rounded-2xl border border-red-200/60">
                                <div className="flex justify-between items-start gap-2 mb-1.5">
                                  {showMeta && isAdmin ? (
                                    <input 
                                      className="w-full text-xs font-bold border-b bg-transparent outline-none uppercase" 
                                      value={v.t} 
                                      onChange={e => updateMetaItem(semanaIdx, 'vida', idx, 't', e.target.value)} 
                                    />
                                  ) : (
                                    <p className="text-xs sm:text-sm font-black text-red-950 uppercase">{v.t}</p>
                                  )}
                                  {showMeta && isAdmin && (
                                    <div className="flex gap-1">
                                      <button onClick={() => moveItem(semanaIdx, 'vida', 'maestros', idx)} className="text-amber-500">
                                        <ArrowUpCircle size={16} />
                                      </button>
                                      <button onClick={() => deleteMetaItem(semanaIdx, 'vida', idx)} className="text-red-400">
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                {v.d && <p className="text-xs text-slate-500 mb-2 leading-relaxed">{v.d}</p>}

                                {isEstudio ? (
                                  <div className="space-y-2 bg-white/70 p-3 rounded-xl border border-red-200">
                                    <SelectRow 
                                      label="Conductor EB" 
                                      val={currentWeek.asig[`v${idx}_C`]} 
                                      options={getFiltered("vida")} 
                                      edit={editMode && canEditEntresemana} 
                                      onSelect={e => updateAsig(semanaIdx, `v${idx}_C`, e)} 
                                      canEditAny={canEditAny} 
                                    />
                                    <SelectRow 
                                      label="Lector EB" 
                                      val={currentWeek.asig[`v${idx}_L`]} 
                                      options={getFiltered("ebLect")} 
                                      edit={editMode && canEditEntresemana} 
                                      onSelect={e => updateAsig(semanaIdx, `v${idx}_L`, e)} 
                                      canEditAny={canEditAny} 
                                    />
                                  </div>
                                ) : (
                                  <SelectRow 
                                    label="Asignado" 
                                    val={currentWeek.asig[`v${idx}`]} 
                                    options={getFiltered("vida")} 
                                    edit={editMode && canEditEntresemana} 
                                    onSelect={e => updateAsig(semanaIdx, `v${idx}`, e)} 
                                    canEditAny={canEditAny} 
                                  />
                                )}
                              </div>
                            );
                          })}

                          {showMeta && isAdmin && (
                            <button 
                              onClick={() => addMetaItem(semanaIdx, 'vida')}
                              className="text-xs font-black text-red-700 hover:text-red-800 flex items-center gap-1 mt-2"
                            >
                              <PlusCircle size={14} /> Añadir Parte de Vida Cristiana
                            </button>
                          )}

                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 mt-4">
                            <div className="text-xs font-black text-slate-700">🎵 Canción {currentWeek.meta.can3} y Conclusión</div>
                            <SelectRow 
                              label="Oración Final" 
                              val={currentWeek.asig.orFi} 
                              options={getFiltered("ora")} 
                              edit={editMode && canEditEntresemana} 
                              onSelect={e => updateAsig(semanaIdx, 'orFi', e)} 
                              canEditAny={canEditAny} 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Asignaciones Mecánicas Entresemana */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6">
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                      <Settings size={20} className="text-slate-500" />
                      <h3 className="font-black text-sm uppercase tracking-wider text-slate-800">
                        Asignaciones Mecánicas - Reunión Entresemana
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                        <span className="block text-[11px] font-black uppercase text-emerald-700 mb-1">
                          🎤 Microfonistas (Entresemana)
                        </span>
                        <SelectRow 
                          label="Microfonista 1" 
                          val={currentWeek.asig.micEntre1 || currentWeek.asig.mic1} 
                          options={CE} 
                          edit={editMode && canEditMeca} 
                          onSelect={e => updateAsig(semanaIdx, 'micEntre1', e)} 
                          warning={esRepetidoSemanaAnt(semanaIdx, 'micEntre1', currentWeek.asig.micEntre1 || currentWeek.asig.mic1)} 
                          canEditAny={canEditAny} 
                        />
                        <SelectRow 
                          label="Microfonista 2" 
                          val={currentWeek.asig.micEntre2 || currentWeek.asig.mic2} 
                          options={CE} 
                          edit={editMode && canEditMeca} 
                          onSelect={e => updateAsig(semanaIdx, 'micEntre2', e)} 
                          warning={esRepetidoSemanaAnt(semanaIdx, 'micEntre2', currentWeek.asig.micEntre2 || currentWeek.asig.mic2)} 
                          canEditAny={canEditAny} 
                        />
                      </div>

                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                        <span className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                          🚪 Acomodación y Sonido
                        </span>
                        <SelectRow 
                          label="Acomodador de Entrada" 
                          val={currentWeek.asig.atEn} 
                          options={SE} 
                          edit={editMode && canEditMeca} 
                          onSelect={e => updateAsig(semanaIdx, 'atEn', e)} 
                          warning={esRepetidoSemanaAnt(semanaIdx, 'atEn', currentWeek.asig.atEn)} 
                          canEditAny={canEditAny} 
                        />
                        <SelectRow 
                          label="Acomodador de Auditorio" 
                          val={currentWeek.asig.atPl} 
                          options={SE} 
                          edit={editMode && canEditMeca} 
                          onSelect={e => updateAsig(semanaIdx, 'atPl', e)} 
                          warning={esRepetidoSemanaAnt(semanaIdx, 'atPl', currentWeek.asig.atPl)} 
                          canEditAny={canEditAny} 
                        />
                        <SelectRow 
                          label="Audio / Video" 
                          val={currentWeek.asig.av} 
                          options={CE} 
                          edit={editMode && canEditMeca} 
                          onSelect={e => updateAsig(semanaIdx, 'av', e)} 
                          warning={esRepetidoSemanaAnt(semanaIdx, 'av', currentWeek.asig.av)} 
                          canEditAny={canEditAny} 
                        />
                        <SelectRow 
                          label="Limpieza" 
                          val={currentWeek.asig.limp} 
                          options={OP_LIMPIEZA} 
                          edit={editMode && canEditMeca} 
                          onSelect={e => updateAsig(semanaIdx, 'limp', e)} 
                          warning={esRepetidoSemanaAnt(semanaIdx, 'limp', currentWeek.asig.limp)} 
                          canEditAny={canEditAny} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- PESTAÑA FIN DE SEMANA --- */}
              {pestana === 'findesemana' && (
                <div className="space-y-4">
                  <div className="bg-white rounded-3xl border border-blue-200 shadow-sm overflow-hidden">
                    <div className="bg-blue-900 text-white p-4 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Users size={22} />
                        <h2 className="font-black uppercase tracking-wider text-sm sm:text-base">Reunión de Fin de Semana</h2>
                      </div>
                    </div>

                    <div className="p-4 sm:p-6 space-y-6">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <SelectRow 
                          label="Presidente Fin de Semana" 
                          val={currentWeek.asig.wePresi} 
                          options={getFiltered("wePresi")} 
                          edit={editMode && canEditFinde} 
                          onSelect={e => updateAsig(semanaIdx, 'wePresi', e)} 
                          canEditAny={canEditAny} 
                        />
                      </div>

                      {/* Discurso Público */}
                      <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200 text-center space-y-3">
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-black uppercase tracking-wider">
                          Discurso Público (30 min)
                        </span>

                        {editMode && canEditFinde ? (
                          <div className="space-y-2 max-w-md mx-auto text-left">
                            <div>
                              <label className="text-[10px] font-black uppercase text-slate-500">Título del Discurso</label>
                              <input 
                                className="w-full border border-slate-300 p-2 rounded-xl text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500" 
                                placeholder="Título del discurso..." 
                                value={currentWeek.asig.discTit || ""} 
                                onChange={e => updateAsig(semanaIdx, 'discTit', e.target.value)} 
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black uppercase text-slate-500">Nombre del Discursante</label>
                              <input 
                                className="w-full border border-slate-300 p-2 rounded-xl text-xs font-bold uppercase bg-white outline-none focus:ring-2 focus:ring-blue-500" 
                                placeholder="Nombre..." 
                                value={currentWeek.asig.discNom || ""} 
                                onChange={e => updateAsig(semanaIdx, 'discNom', e.target.value)} 
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black uppercase text-slate-500">Congregación de Origen</label>
                              <input 
                                className="w-full border border-slate-300 p-2 rounded-xl text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500" 
                                placeholder="General Pinedo" 
                                value={currentWeek.asig.weDiscOrig || ""} 
                                onChange={e => updateAsig(semanaIdx, 'weDiscOrig', e.target.value)} 
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="py-2 space-y-1">
                            <p className="text-base sm:text-lg font-serif font-black text-slate-800 italic">
                              "{currentWeek.asig.discTit || 'TÍTULO PENDIENTE'}"
                            </p>
                            <p className="text-sm font-black uppercase text-blue-900">
                              {currentWeek.asig.discNom || 'NOMBRE DEL DISCURSANTE'}
                            </p>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                              ({currentWeek.asig.weDiscOrig || "General Pinedo"})
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Estudio de La Atalaya */}
                      <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200">
                        <div className="text-center mb-4">
                          <span className="inline-block px-3 py-1 bg-blue-900 text-white rounded-lg text-xs font-black uppercase tracking-wider mb-2">
                            Estudio de La Atalaya
                          </span>
                          {currentWeek.asig.atImg && (
                            <img 
                              src={currentWeek.asig.atImg} 
                              className="h-44 sm:h-52 mx-auto rounded-2xl mb-3 shadow-md object-cover max-w-full border-2 border-white" 
                              alt="Atalaya" 
                              crossOrigin="anonymous" 
                            />
                          )}
                          {editMode && canEditFinde && (
                            <div className="flex flex-col gap-2 max-w-md mx-auto mb-3 bg-white p-3 rounded-xl border border-slate-200 text-left">
                              <div>
                                <label className="text-[10px] font-black uppercase text-slate-500">URL Imagen Atalaya</label>
                                <input 
                                  className="text-xs p-2 border border-slate-300 w-full rounded-lg outline-none" 
                                  placeholder="https://..." 
                                  value={currentWeek.asig.atImg || ""} 
                                  onChange={e => updateAsig(semanaIdx, 'atImg', e.target.value)} 
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-black uppercase text-slate-500">Título del Artículo</label>
                                <input 
                                  className="text-xs p-2 border border-slate-300 w-full rounded-lg outline-none" 
                                  placeholder="Título del artículo..." 
                                  value={currentWeek.asig.atTitulo || ""} 
                                  onChange={e => updateAsig(semanaIdx, 'atTitulo', e.target.value)} 
                                />
                              </div>
                            </div>
                          )}
                          <p className="text-xs sm:text-sm font-black text-blue-950 uppercase tracking-tight">
                            "{currentWeek.asig.atTitulo || "Artículo de Estudio"}"
                          </p>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-slate-200">
                          <SelectRow 
                            label="Conductor" 
                            val={currentWeek.asig.atCond} 
                            options={getFiltered("atCond")} 
                            edit={editMode && canEditFinde} 
                            onSelect={e => updateAsig(semanaIdx, 'atCond', e)} 
                            canEditAny={canEditAny} 
                          />
                          <SelectRow 
                            label="Lector" 
                            val={currentWeek.asig.atLect} 
                            options={getFiltered("atLect")} 
                            edit={editMode && canEditFinde} 
                            onSelect={e => updateAsig(semanaIdx, 'atLect', e)} 
                            canEditAny={canEditAny} 
                          />
                        </div>
                      </div>

                      {/* Discurso Adicional / Especial */}
                      {(editMode && canEditFinde || currentWeek.asig.discTit2) && (
                        <div className="bg-slate-50 p-4 rounded-2xl border-2 border-dashed border-blue-200 text-center space-y-2">
                          <span className="text-xs font-black uppercase tracking-wider text-blue-700">Discurso Adicional / Especial</span>
                          {editMode && canEditFinde ? (
                            <div className="space-y-2 max-w-md mx-auto text-left">
                              <input 
                                className="w-full border border-slate-300 p-2 rounded-xl text-xs font-bold outline-none" 
                                placeholder="Título 2do Discurso" 
                                value={currentWeek.asig.discTit2 || ""} 
                                onChange={e => updateAsig(semanaIdx, 'discTit2', e.target.value)} 
                              />
                              <input 
                                className="w-full border border-slate-300 p-2 rounded-xl text-xs font-bold uppercase outline-none" 
                                placeholder="Nombre Discursante" 
                                value={currentWeek.asig.discNom2 || ""} 
                                onChange={e => updateAsig(semanaIdx, 'discNom2', e.target.value)} 
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <input 
                                  className="border border-slate-300 p-2 rounded-xl text-xs outline-none" 
                                  placeholder="Canción" 
                                  value={currentWeek.asig.discCan2 || ""} 
                                  onChange={e => updateAsig(semanaIdx, 'discCan2', e.target.value)} 
                                />
                                <input 
                                  className="border border-slate-300 p-2 rounded-xl text-xs outline-none" 
                                  placeholder="Oración" 
                                  value={currentWeek.asig.discOra2 || ""} 
                                  onChange={e => updateAsig(semanaIdx, 'discOra2', e.target.value)} 
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <p className="text-sm font-black text-slate-800 italic">"{currentWeek.asig.discTit2}"</p>
                              <p className="text-xs font-black uppercase text-blue-900">{currentWeek.asig.discNom2}</p>
                              <div className="flex justify-center gap-6 text-xs text-slate-600 font-bold pt-1">
                                <span>Canción: {currentWeek.asig.discCan2}</span>
                                <span>Oración: {currentWeek.asig.discOra2}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Asignaciones Mecánicas Fin de Semana */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6">
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                      <Settings size={20} className="text-slate-500" />
                      <h3 className="font-black text-sm uppercase tracking-wider text-slate-800">
                        Asignaciones Mecánicas - Reunión Fin de Semana
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                        <span className="block text-[11px] font-black uppercase text-blue-700 mb-1">
                          🎤 Microfonistas (Fin de Semana)
                        </span>
                        <SelectRow 
                          label="Microfonista 1" 
                          val={currentWeek.asig.micFds1 || currentWeek.asig.mic1} 
                          options={CE} 
                          edit={editMode && canEditMeca} 
                          onSelect={e => updateAsig(semanaIdx, 'micFds1', e)} 
                          warning={esRepetidoSemanaAnt(semanaIdx, 'micFds1', currentWeek.asig.micFds1 || currentWeek.asig.mic1)} 
                          canEditAny={canEditAny} 
                        />
                        <SelectRow 
                          label="Microfonista 2" 
                          val={currentWeek.asig.micFds2 || currentWeek.asig.mic2} 
                          options={CE} 
                          edit={editMode && canEditMeca} 
                          onSelect={e => updateAsig(semanaIdx, 'micFds2', e)} 
                          warning={esRepetidoSemanaAnt(semanaIdx, 'micFds2', currentWeek.asig.micFds2 || currentWeek.asig.mic2)} 
                          canEditAny={canEditAny} 
                        />
                      </div>

                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                        <span className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                          🚪 Acomodación y Sonido
                        </span>
                        <SelectRow 
                          label="Acomodador de Entrada" 
                          val={currentWeek.asig.atEn} 
                          options={SE} 
                          edit={editMode && canEditMeca} 
                          onSelect={e => updateAsig(semanaIdx, 'atEn', e)} 
                          warning={esRepetidoSemanaAnt(semanaIdx, 'atEn', currentWeek.asig.atEn)} 
                          canEditAny={canEditAny} 
                        />
                        <SelectRow 
                          label="Acomodador de Auditorio" 
                          val={currentWeek.asig.atPl} 
                          options={SE} 
                          edit={editMode && canEditMeca} 
                          onSelect={e => updateAsig(semanaIdx, 'atPl', e)} 
                          warning={esRepetidoSemanaAnt(semanaIdx, 'atPl', currentWeek.asig.atPl)} 
                          canEditAny={canEditAny} 
                        />
                        <SelectRow 
                          label="Audio / Video" 
                          val={currentWeek.asig.av} 
                          options={CE} 
                          edit={editMode && canEditMeca} 
                          onSelect={e => updateAsig(semanaIdx, 'av', e)} 
                          warning={esRepetidoSemanaAnt(semanaIdx, 'av', currentWeek.asig.av)} 
                          canEditAny={canEditAny} 
                        />
                        <SelectRow 
                          label="Limpieza" 
                          val={currentWeek.asig.limp} 
                          options={OP_LIMPIEZA} 
                          edit={editMode && canEditMeca} 
                          onSelect={e => updateAsig(semanaIdx, 'limp', e)} 
                          warning={esRepetidoSemanaAnt(semanaIdx, 'limp', currentWeek.asig.limp)} 
                          canEditAny={canEditAny} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VISTA MES COMPLETO */}
        {vista === 'mes' && (
          <div id="print-area" className="space-y-6">
            <div className="text-center border-b-4 border-slate-900 pb-3 pt-2 mb-4 px-4">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase">
                Programa de Asignaciones para las Reuniones
              </h1>
              <p className="text-xs sm:text-sm font-bold text-blue-800 uppercase tracking-widest mt-1">
                Congregación General Pinedo - {MESES[mes]} {anio}
              </p>
            </div>

            {semanas.map((s, idx) => (
              <div key={s.id} id={`week-${s.id}`} className="bg-white border border-slate-200 page-break rounded-3xl overflow-hidden shadow-sm relative mb-6">
                <div className="bg-slate-900 p-3 sm:p-4 text-center text-white text-base sm:text-lg font-black tracking-widest uppercase flex justify-between px-6 sm:px-10 items-center">
                  <span>{s.rango}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 sm:p-6">
                  {/* Columna Entresemana */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b-2 border-[#007B5E] pb-1 text-[#007B5E]">
                      <BookOpen size={20} />
                      <h3 className="font-black uppercase text-xs tracking-wider">Vida y Ministerio Cristianos</h3>
                    </div>
                    <div className="flex justify-between font-black text-[11px] bg-emerald-50 p-2.5 border border-emerald-100 rounded-xl">
                      <span>CANCIÓN {s.meta.can1}</span>
                      <span className="uppercase text-slate-700 tracking-tight font-bold">{s.meta.lect}</span>
                    </div>
                    <div className="space-y-1">
                      <SelectRow label="Presidente" val={s.asig.presi} options={getFiltered("presi")} edit={editMode && canEditEntresemana} onSelect={e => updateAsig(idx, 'presi', e)} canEditAny={canEditAny} />
                      <SelectRow label="Oración Inicial" val={s.asig.orIn} options={getFiltered("ora")} edit={editMode && canEditEntresemana} onSelect={e => updateAsig(idx, 'orIn', e)} canEditAny={canEditAny} />
                    </div>

                    <SectionHeader title="Tesoros de la Biblia" color="bg-[#007B5E]" />
                    <div className="space-y-2">
                      {s.meta.tesoros?.map((t, tIdx) => (
                        <div key={tIdx} className="bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                          <p className="text-xs font-black text-emerald-950 uppercase">{t.t}</p>
                          <SelectRow label="Asignado" val={s.asig[`t${tIdx}`]} options={getFiltered(tIdx === 2 ? "t3" : "t12")} edit={editMode && canEditEntresemana} onSelect={e => updateAsig(idx, `t${tIdx}`, e)} canEditAny={canEditAny} />
                        </div>
                      ))}
                    </div>

                    <SectionHeader title="Seamos Mejores Maestros" color="bg-[#C18B00]" />
                    <div className="space-y-2">
                      {s.meta.maestros?.map((m, mIdx) => {
                        const isDiscurso = m.t?.toLowerCase().includes("discurso");
                        return (
                          <div key={mIdx} className="bg-amber-50/30 p-2 rounded-xl border border-amber-100">
                            <p className="text-xs font-black text-amber-950 uppercase">{m.t}</p>
                            {isDiscurso ? (
                              <SelectRow label="Discursante" val={s.asig[`m${mIdx}`]} options={getFiltered("", "disc")} edit={editMode && canEditEntresemana} onSelect={e => updateAsig(idx, `m${mIdx}`, e)} canEditAny={canEditAny} />
                            ) : (
                              <>
                                <SelectRow label="Estudiante" val={s.asig[`m${mIdx}`]} options={miembros} edit={editMode && canEditEntresemana} onSelect={e => handleSelectEstudiante(idx, `m${mIdx}`, e)} onViewHistory={() => abrirHistorialParejas(s.asig[`m${mIdx}`])} canEditAny={canEditAny} />
                                <SelectRow label="Ayudante" val={s.asig[`m${mIdx}A`]} options={miembros} edit={editMode && canEditEntresemana} onSelect={e => handleSelectEstudiante(idx, `m${mIdx}A`, e)} onViewHistory={() => abrirHistorialParejas(s.asig[`m${mIdx}A`])} canEditAny={canEditAny} />
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <SectionHeader title="Nuestra Vida Cristiana" color="bg-[#8A1A11]" />
                    <div className="space-y-2">
                      <div className="text-xs font-black text-red-900 bg-red-50 p-2 rounded-lg">🎵 Canción {s.meta.can2}</div>
                      {s.meta.vida?.map((v, vIdx) => {
                        const isEstudio = v.t?.toLowerCase().includes("estudio b") || v.t?.toLowerCase().includes("viajante");
                        return (
                          <div key={vIdx} className="bg-red-50/20 p-2 rounded-xl border border-red-100">
                            <p className="text-xs font-black text-red-950 uppercase">{v.t}</p>
                            {isEstudio ? (
                              <div className="space-y-1 mt-1 bg-white p-2 rounded-lg border border-red-100">
                                <SelectRow label="Conductor EB" val={s.asig[`v${vIdx}_C`]} options={getFiltered("vida")} edit={editMode && canEditEntresemana} onSelect={e => updateAsig(idx, `v${vIdx}_C`, e)} canEditAny={canEditAny} />
                                <SelectRow label="Lector EB" val={s.asig[`v${vIdx}_L`]} options={getFiltered("ebLect")} edit={editMode && canEditEntresemana} onSelect={e => updateAsig(idx, `v${vIdx}_L`, e)} canEditAny={canEditAny} />
                              </div>
                            ) : (
                              <SelectRow label="Asignado" val={s.asig[`v${vIdx}`]} options={getFiltered("vida")} edit={editMode && canEditEntresemana} onSelect={e => updateAsig(idx, `v${vIdx}`, e)} canEditAny={canEditAny} />
                            )}
                          </div>
                        );
                      })}
                      <div className="pt-2 border-t border-slate-200">
                        <SelectRow label="Oración Final" val={s.asig.orFi} options={getFiltered("ora")} edit={editMode && canEditEntresemana} onSelect={e => updateAsig(idx, 'orFi', e)} canEditAny={canEditAny} />
                      </div>
                    </div>
                  </div>

                  {/* Columna Fin de Semana y Mecánicas */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b-2 border-blue-900 pb-1 text-blue-900">
                      <Users size={20} />
                      <h3 className="font-black uppercase text-xs tracking-wider">Reunión de Fin de Semana</h3>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                      <SelectRow label="Presidente" val={s.asig.wePresi} options={getFiltered("wePresi")} edit={editMode && canEditFinde} onSelect={e => updateAsig(idx, 'wePresi', e)} canEditAny={canEditAny} />
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center space-y-1">
                      <span className="text-[10px] font-black uppercase text-blue-700">Discurso Público (30 min)</span>
                      <p className="text-sm font-serif font-black text-slate-800 italic">"{s.asig.discTit || 'TÍTULO PENDIENTE'}"</p>
                      <p className="text-xs font-black uppercase text-blue-900">{s.asig.discNom || 'NOMBRE'}</p>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase">({s.asig.weDiscOrig || "General Pinedo"})</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div className="text-center mb-2">
                        <span className="text-[10px] font-black uppercase text-blue-900">Estudio de La Atalaya</span>
                        <p className="text-xs font-black text-blue-950 uppercase mt-0.5">"{s.asig.atTitulo || "Artículo de Estudio"}"</p>
                      </div>
                      <div className="space-y-1 pt-2 border-t border-slate-200">
                        <SelectRow label="Conductor" val={s.asig.atCond} options={getFiltered("atCond")} edit={editMode && canEditFinde} onSelect={e => updateAsig(idx, 'atCond', e)} canEditAny={canEditAny} />
                        <SelectRow label="Lector" val={s.asig.atLect} options={getFiltered("atLect")} edit={editMode && canEditFinde} onSelect={e => updateAsig(idx, 'atLect', e)} canEditAny={canEditAny} />
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center gap-1.5 text-slate-700 font-black text-xs uppercase mb-1">
                        <Settings size={16} /> Asignaciones Mecánicas
                      </div>
                      <SelectRow label="Mic Entre 1" val={s.asig.micEntre1 || s.asig.mic1} options={CE} edit={editMode && canEditMeca} onSelect={e => updateAsig(idx, 'micEntre1', e)} canEditAny={canEditAny} />
                      <SelectRow label="Mic Entre 2" val={s.asig.micEntre2 || s.asig.mic2} options={CE} edit={editMode && canEditMeca} onSelect={e => updateAsig(idx, 'micEntre2', e)} canEditAny={canEditAny} />
                      <SelectRow label="Mic Fds 1" val={s.asig.micFds1 || s.asig.mic1} options={CE} edit={editMode && canEditMeca} onSelect={e => updateAsig(idx, 'micFds1', e)} canEditAny={canEditAny} />
                      <SelectRow label="Mic Fds 2" val={s.asig.micFds2 || s.asig.mic2} options={CE} edit={editMode && canEditMeca} onSelect={e => updateAsig(idx, 'micFds2', e)} canEditAny={canEditAny} />
                      <SelectRow label="Entrada" val={s.asig.atEn} options={SE} edit={editMode && canEditMeca} onSelect={e => updateAsig(idx, 'atEn', e)} canEditAny={canEditAny} />
                      <SelectRow label="Auditorio" val={s.asig.atPl} options={SE} edit={editMode && canEditMeca} onSelect={e => updateAsig(idx, 'atPl', e)} canEditAny={canEditAny} />
                      <SelectRow label="Audio/Video" val={s.asig.av} options={CE} edit={editMode && canEditMeca} onSelect={e => updateAsig(idx, 'av', e)} canEditAny={canEditAny} />
                      <SelectRow label="Limpieza" val={s.asig.limp} options={OP_LIMPIEZA} edit={editMode && canEditMeca} onSelect={e => updateAsig(idx, 'limp', e)} canEditAny={canEditAny} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* --- MODAL DE HOJA MENSUAL PARA IMPRESIÓN Y PDF --- */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[96vh] flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Printer size={20} className="text-emerald-400" />
                <h3 className="text-sm font-black uppercase tracking-tight">Hojas Mensuales de Programa (1 Página A4)</h3>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex p-1 bg-slate-800 rounded-xl">
                  <button 
                    onClick={() => setSheetType('entresemana')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${sheetType === 'entresemana' ? 'bg-[#007B5E] text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Entresemana
                  </button>
                  <button 
                    onClick={() => setSheetType('findesemana')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${sheetType === 'findesemana' ? 'bg-blue-800 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Fin de Semana
                  </button>
                  <button 
                    onClick={() => setSheetType('mecanicas')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${sheetType === 'mecanicas' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Mecánicas
                  </button>
                </div>
                <button 
                  onClick={downloadMonthlySheetPdf}
                  disabled={generatingPdf}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Printer size={14} /> {generatingPdf ? "Generando..." : "Descargar PDF"}
                </button>
                <button 
                  onClick={printMonthlySheet}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  Imprimir
                </button>
                <button 
                  onClick={() => setShowPdfModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Vista previa de la hoja */}
            <div className="flex-1 overflow-auto p-4 bg-slate-200 flex justify-center">
              <div 
                id="monthly-preview-sheet"
                className={`bg-white p-6 shadow-xl rounded-xl border border-slate-300 ${sheetType === 'mecanicas' ? 'w-[297mm] max-w-full' : 'w-[210mm] max-w-full'}`}
              >
                <div className="text-center border-b-2 border-slate-900 pb-2 mb-3">
                  <h2 className="text-base font-black uppercase text-slate-900 tracking-tight">
                    Programa de Asignaciones de Congregación General Pinedo
                  </h2>
                  <p className="text-[10px] font-bold text-blue-900 uppercase tracking-wider mt-0.5">
                    {sheetType === 'entresemana' && "Vida y Ministerio Cristianos • "}
                    {sheetType === 'findesemana' && "Discurso Público y Estudio de La Atalaya • "}
                    {sheetType === 'mecanicas' && "Microfonistas, Acomodadores, Audio/Video y Limpieza • "}
                    {MESES[mes]} {anio}
                  </p>
                </div>

                {/* Hoja Entresemana */}
                {sheetType === 'entresemana' && (
                  <div className="space-y-2">
                    {semanas.map((s, idx) => (
                      <div key={idx} className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-xs avoid-break">
                        <div className="bg-[#006e53] text-white px-3 py-1 flex justify-between items-center text-[10px] font-black uppercase">
                          <div className="flex items-center gap-2">
                            <span className="bg-white text-[#006e53] px-2 py-0.5 rounded text-[9.5px] font-black">
                              {s.rango}
                            </span>
                            <span className="text-emerald-100 font-bold">
                              Canción {s.meta.can1} • {s.meta.lect}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-[9.5px]">
                            <span>Presi: <b className="text-white">{s.asig.presi || "-"}</b></span>
                            <span>O. Inicial: <b className="text-white">{s.asig.orIn || "-"}</b></span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 divide-x divide-slate-200">
                          {/* Tesoros */}
                          <div className="flex flex-col bg-emerald-50/15">
                            <div className="bg-emerald-100/70 text-[#006e53] px-2 py-0.5 font-black uppercase text-[8.5px] tracking-wider border-b border-emerald-200">
                              Tesoros de la Biblia
                            </div>
                            <div className="p-2 space-y-1.5 flex-1 flex flex-col justify-between">
                              {s.meta.tesoros?.map((t, tIdx) => (
                                <div key={tIdx} className="border-b border-slate-100 last:border-0 pb-1">
                                  <p className="text-[9px] font-semibold text-slate-700 leading-tight">{t.t}</p>
                                  <p className="text-[9.5px] font-black text-slate-900 text-right mt-0.5">
                                    {s.asig[`t${tIdx}`] || "-"}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Maestros */}
                          <div className="flex flex-col bg-amber-50/15">
                            <div className="bg-amber-100/70 text-[#9e6d00] px-2 py-0.5 font-black uppercase text-[8.5px] tracking-wider border-b border-amber-200">
                              Seamos Mejores Maestros
                            </div>
                            <div className="p-2 space-y-1.5 flex-1 flex flex-col justify-between">
                              {s.meta.maestros?.map((m, mIdx) => {
                                const isDiscurso = m.t?.toLowerCase().includes("discurso");
                                return (
                                  <div key={mIdx} className="border-b border-slate-100 last:border-0 pb-1">
                                    <p className="text-[9px] font-semibold text-slate-700 leading-tight">{m.t}</p>
                                    {isDiscurso ? (
                                      <p className="text-[9.5px] font-black text-slate-900 text-right mt-0.5">
                                        <span className="text-[8px] font-bold text-slate-500 uppercase mr-1">Discursante:</span>
                                        {s.asig[`m${mIdx}`] || "-"}
                                      </p>
                                    ) : (
                                      <div className="grid grid-cols-2 gap-1 text-[9px] mt-0.5 bg-white/80 p-1 rounded border border-amber-200/50">
                                        <div>
                                          <span className="text-slate-500 font-bold block text-[7.5px] uppercase">Estudiante</span>
                                          <span className="font-black text-slate-900 block truncate">{s.asig[`m${mIdx}`] || "-"}</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-500 font-bold block text-[7.5px] uppercase">Ayudante</span>
                                          <span className="font-black text-slate-800 block truncate">{s.asig[`m${mIdx}A` || "-"]}</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Vida */}
                          <div className="flex flex-col bg-red-50/15">
                            <div className="bg-red-100/70 text-[#8a1a11] px-2 py-0.5 font-black uppercase text-[8.5px] tracking-wider border-b border-red-200 flex justify-between items-center">
                              <span>Nuestra Vida Cristiana</span>
                              <span>Canción {s.meta.can2}</span>
                            </div>
                            <div className="p-2 space-y-1.5 flex-1 flex flex-col justify-between">
                              {s.meta.vida?.map((v, vIdx) => {
                                const isEstudio = v.t?.toLowerCase().includes("estudio b") || v.t?.toLowerCase().includes("viajante");
                                return (
                                  <div key={vIdx} className="border-b border-slate-100 last:border-0 pb-1">
                                    <p className="text-[9px] font-semibold text-slate-700 leading-tight">{v.t}</p>
                                    {isEstudio ? (
                                      <div className="grid grid-cols-2 gap-1 text-[9px] mt-0.5 bg-white/80 p-1 rounded border border-red-200/50">
                                        <div>
                                          <span className="text-slate-500 font-bold block text-[7.5px] uppercase">Conductor</span>
                                          <span className="font-black text-slate-900 block truncate">{s.asig[`v${vIdx}_C`] || "-"}</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-500 font-bold block text-[7.5px] uppercase">Lector</span>
                                          <span className="font-black text-slate-800 block truncate">{s.asig[`v${vIdx}_L`] || "-"}</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-[9.5px] font-black text-slate-900 text-right mt-0.5">
                                        {s.asig[`v${vIdx}`] || "-"}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                              <div className="pt-1 border-t border-red-100 flex justify-between items-center text-[9px] font-black text-slate-800 bg-red-50/40 p-1 rounded">
                                <span>Canción {s.meta.can3}</span>
                                <span>O. Final: <b className="text-red-950">{s.asig.orFi || "-"}</b></span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Hoja Fin de Semana */}
                {sheetType === 'findesemana' && (
                  <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-xs">
                    <table className="w-full text-left border-collapse text-[10.5px]">
                      <thead>
                        <tr className="bg-blue-950 text-white uppercase text-[9.5px] tracking-wider">
                          <th className="p-3 border-r border-blue-900 w-36">Semana</th>
                          <th className="p-3 border-r border-blue-900 w-36">Presidente</th>
                          <th className="p-3 border-r border-blue-900">Discurso Público (30 min)</th>
                          <th className="p-3">Estudio de La Atalaya (60 min)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {semanas.map((s, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                            <td className="p-3 border-r border-slate-200 align-top">
                              <span className="font-black uppercase text-slate-900 text-[11px] block">{s.rango}</span>
                            </td>
                            <td className="p-3 border-r border-slate-200 align-top">
                              <span className="font-bold text-blue-950 text-[11px] block">{s.asig.wePresi || "-"}</span>
                            </td>
                            <td className="p-3 border-r border-slate-200 align-top">
                              <div className="font-serif font-black italic text-slate-900 text-[11.5px] leading-snug">
                                "{s.asig.discTit || 'TÍTULO PENDIENTE'}"
                              </div>
                              <div className="font-black text-blue-900 uppercase text-[11px] mt-1">
                                {s.asig.discNom || "-"}
                              </div>
                              <div className="text-[10px] text-slate-500 font-semibold uppercase">
                                ({s.asig.weDiscOrig || "General Pinedo"})
                              </div>
                              {s.asig.discTit2 && (
                                <div className="mt-2 pt-1.5 border-t border-slate-200 text-[10px] text-blue-800 font-medium italic">
                                  Especial: "{s.asig.discTit2}" ({s.asig.discNom2})
                                </div>
                              )}
                            </td>
                            <td className="p-3 align-top">
                              <div className="font-black text-slate-900 uppercase text-[11px] leading-snug">
                                "{s.asig.atTitulo || "Artículo de Estudio"}"
                              </div>
                              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-[10px]">
                                <div className="bg-blue-50/60 p-1.5 rounded border border-blue-100">
                                  <span className="text-slate-500 font-bold block text-[8px] uppercase">Conductor</span>
                                  <span className="font-black text-blue-950 block">{s.asig.atCond || "-"}</span>
                                </div>
                                <div className="bg-blue-50/60 p-1.5 rounded border border-blue-100">
                                  <span className="text-slate-500 font-bold block text-[8px] uppercase">Lector</span>
                                  <span className="font-black text-slate-800 block">{s.asig.atLect || "-"}</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Hoja Mecánicas */}
                {sheetType === 'mecanicas' && (
                  <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-xs">
                    <table className="w-full text-left border-collapse text-[10px]">
                      <thead>
                        <tr className="bg-slate-900 text-white uppercase text-[9px] tracking-wider">
                          <th className="p-2.5 border-r border-slate-800 w-32">Semana</th>
                          <th className="p-2.5 border-r border-slate-800">Microfonistas Entresemana</th>
                          <th className="p-2.5 border-r border-slate-800">Microfonistas Fin de Semana</th>
                          <th className="p-2.5 border-r border-slate-800">Acomodador Entrada</th>
                          <th className="p-2.5 border-r border-slate-800">Acomodador Auditorio</th>
                          <th className="p-2.5 border-r border-slate-800">Audio / Video</th>
                          <th className="p-2.5">Limpieza</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {semanas.map((s, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                            <td className="p-2.5 font-black uppercase text-slate-900 border-r border-slate-200 whitespace-nowrap align-middle">
                              {s.rango}
                            </td>
                            <td className="p-2.5 border-r border-slate-200 align-middle">
                              <div className="font-bold text-slate-800 text-[10.5px]">
                                1: <span className="font-black text-slate-950">{s.asig.micEntre1 || s.asig.mic1 || "-"}</span>
                              </div>
                              <div className="font-bold text-slate-800 text-[10.5px] mt-0.5">
                                2: <span className="font-black text-slate-950">{s.asig.micEntre2 || s.asig.mic2 || "-"}</span>
                              </div>
                            </td>
                            <td className="p-2.5 border-r border-slate-200 align-middle">
                              <div className="font-bold text-slate-800 text-[10.5px]">
                                1: <span className="font-black text-slate-950">{s.asig.micFds1 || s.asig.mic1 || "-"}</span>
                              </div>
                              <div className="font-bold text-slate-800 text-[10.5px] mt-0.5">
                                2: <span className="font-black text-slate-950">{s.asig.micFds2 || s.asig.mic2 || "-"}</span>
                              </div>
                            </td>
                            <td className="p-2.5 font-black text-slate-900 border-r border-slate-200 text-[10.5px] align-middle">
                              {s.asig.atEn || "-"}
                            </td>
                            <td className="p-2.5 font-black text-slate-900 border-r border-slate-200 text-[10.5px] align-middle">
                              {s.asig.atPl || "-"}
                            </td>
                            <td className="p-2.5 font-black text-slate-900 border-r border-slate-200 text-[10.5px] align-middle">
                              {s.asig.av || "-"}
                            </td>
                            <td className="p-2.5 font-black text-blue-900 text-[10.5px] align-middle">
                              {s.asig.limp || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL HISTORIAL DE PAREJAS DE ESTUDIANTES --- */}
      {partnerModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in duration-200">
            <div className="bg-amber-100 p-5 border-b border-amber-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block">
                  Historial de Parejas
                </span>
                <h3 className="text-base font-black text-slate-900 uppercase">
                  {partnerModal.memberName}
                </h3>
              </div>
              <button 
                onClick={() => setPartnerModal({ isOpen: false, memberName: '', history: [] })}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-500 leading-relaxed">
                Últimas 5 compañeras/os registradas en el programa para evitar repeticiones seguidas:
              </p>
              {partnerModal.history && partnerModal.history.length > 0 ? (
                <div className="space-y-2">
                  {partnerModal.history.map((h, idx) => (
                    <div key={idx} className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-2xl flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 text-amber-900 font-black text-xs">
                          <Users size={14} className="text-amber-600" />
                          <span>{h.partner}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
                          {h.partTitle} ({h.role} con {h.partnerRole})
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200 shrink-0 uppercase">
                        {h.date}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs font-semibold">
                  No se encontraron registros previos de compañeras/os para esta persona.
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
              <button 
                onClick={() => setPartnerModal({ isOpen: false, memberName: '', history: [] })}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl uppercase transition-all shadow-md"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para filas de selección
const SelectRow = ({ label, val, options, edit, onSelect, onViewHistory, warning, canEditAny }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 border-b border-slate-100 last:border-0 gap-1 min-h-[36px]">
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">{label}</span>
      {canEditAny && onViewHistory && val && (
        <button 
          type="button"
          onClick={onViewHistory}
          className="text-amber-600 hover:text-amber-800 p-0.5 rounded hover:bg-amber-50 transition-all"
          title="Ver últimas 5 compañeras"
        >
          <Users size={13} />
        </button>
      )}
    </div>
    <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
      {edit ? (
        <select 
          className="text-xs border border-slate-300 rounded-xl bg-white px-2.5 py-1 font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-56 shadow-2xs"
          value={val || ""} 
          onChange={e => onSelect(e.target.value)}
        >
          <option value="">-- SELECCIONAR --</option>
          {options?.map(o => (
            <option key={o.n} value={o.n}>{o.n}</option>
          ))}
        </select>
      ) : (
        <span className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
          {val || "-"}
        </span>
      )}
      {canEditAny && warning && (
        <span 
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 animate-pulse"
          title="Esta persona ya tuvo la misma asignación la semana anterior"
        >
          <AlertCircle size={11} className="text-amber-600" /> Repite semana ant.
        </span>
      )}
    </div>
  </div>
);

const SectionHeader = ({ title, color }) => (
  <div className={`${color} text-white text-[11px] font-black px-3.5 py-1.5 rounded-xl uppercase tracking-wider mb-2 shadow-xs`}>
    {title}
  </div>
);

export default App;
