'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'

// ════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════
type Tab = 'home'|'contenu'|'clients'|'finance'|'outils'
interface Client { id:string; nom:string; secteur:string; pack:string; montant:number; stage:string; contact:string; notes:string }
interface Task { id:string; titre:string; type:string; prio:string; statut:string; date:string; client:string; heure:string; notes?:string }
interface Gain { id:string; label:string; type:string; montant:number; mois:string; date:string; notes:string }
interface Depense { id:string; label:string; type:string; montant:number; mois:string; date:string; notes:string }
interface Editorial { id:string; titre:string; pilier:string; format:string; plateforme:string; statut:string; sem:string }
interface Idea { id:string; titre:string; desc:string; pilier:string; plateforme:string; date:string }
interface Equipment { id:string; nom:string; cat:string; statut:string; valeur:number; usage:string }
interface PreProd { id:string; titre:string; client:string; date:string; lieu:string; statut:string; notes:string; equipe:string[]; checklist:string[] }
interface Devis { id:string; ref:string; client:string; date:string; validite:string; lignes:{desc:string;qte:number;pu:number}[]; statut:string; notes:string }
interface NotionPost { id:string; name:string; pub:string; platform:string; type:string; status:string; source:string; client:string }
interface NotionTask { id:string; title:string; due:string; status:string }
interface Motivation { quotes:string[]; streak:number; lastDay:string; objectifs:string[]; affirmations:string[] }
interface AppState {
  clients:Client[]; tasks:Task[]; gains:Gain[]; depenses:Depense[];
  editorial:Editorial[]; ideas:Idea[]; equip:Equipment[];
  prods:PreProd[]; devis:Devis[]; motivation:Motivation; goal:number;
}

// ════════════════════════════════════════════════════════
// UTILS
// ════════════════════════════════════════════════════════
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2,6)}`
const today = () => { const d=new Date(); return `${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}` }
const curMo = () => { const d=new Date(); return `${d.getFullYear()}-${p2(d.getMonth()+1)}` }
const p2 = (n:number) => ('0'+n).slice(-2)
const fmtK = (n:number) => n>=1e6?`${(n/1e6).toFixed(1)}M`:n>=1e3?`${Math.round(n/1e3)}k`:`${n}`
const esc = (s:string) => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
const FR_M = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const FR_D = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam']
const dTo = (d:string) => d?Math.round((new Date(d).getTime()-new Date(today()).getTime())/864e5):999
const dlbl = (d:string) => { if(!d)return''; const df=dTo(d); if(df===0)return"Auj."; if(df===1)return'Demain'; if(df===-1)return'Hier'; const dt=new Date(d+'T12:00'); return `${dt.getDate()} ${FR_M[dt.getMonth()].slice(0,3)}` }
const DB = {
  get:(k:string,fb:unknown)=>{try{const v=localStorage.getItem(k);return v!=null?JSON.parse(v):fb}catch{return fb}},
  set:(k:string,v:unknown)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
}

// ════════════════════════════════════════════════════════
// DEFAULT DATA
// ════════════════════════════════════════════════════════
const DEF_DATA: AppState = {
  goal: 700000,
  clients: [
    {id:'c1',nom:'Detmine Immo',secteur:'Immobilier',pack:'Pack Woyofal',montant:150000,stage:'Actif',contact:'+221 77 000 0001',notes:'Shooting mensuel — 3 vidéos + 2 biens/mois'},
    {id:'c2',nom:'So Suite Hôtel',secteur:'Hospitalité',pack:'Pack Woyofal H',montant:200000,stage:'RDV Fixé',contact:'+221 77 000 0002',notes:'Relance WhatsApp urgente — RDV à fixer'},
    {id:'c3',nom:'NaySeet Cosmetics',secteur:'Bien-être',pack:'Pack Sama',montant:120000,stage:'Devis Envoyé',contact:'',notes:'TikTok influencer — devis identité visuelle envoyé'},
  ],
  tasks: [
    {id:'t1',titre:'Corriger devis NaySeet',type:'Tâche',prio:'Urgent',statut:'Todo',date:today(),client:'NaySeet',heure:''},
    {id:'t2',titre:'Relance WhatsApp So Suite',type:'Tâche',prio:'Urgent',statut:'Todo',date:today(),client:'So Suite',heure:''},
    {id:'t3',titre:'Shooting terrain Detmine',type:'Tournage',prio:'Normal',statut:'Todo',date:'2026-04-12',client:'Detmine Immo',heure:'08:00'},
    {id:'t4',titre:'RDV présentation So Suite',type:'RDV',prio:'Normal',statut:'Todo',date:'2026-04-09',client:'So Suite',heure:'10:00'},
  ],
  gains: [{id:'g1',label:'Detmine Immo — Avr 2026',type:'Récurrent client',montant:150000,mois:'2026-04',date:'2026-04-01',notes:''}],
  depenses: [
    {id:'d1',label:'Déplacements terrain',type:'Charge fixe',montant:30000,mois:'2026-04',date:'2026-04-01',notes:''},
    {id:'d2',label:'Abonnements outils',type:'Charge fixe',montant:15000,mois:'2026-04',date:'2026-04-01',notes:'Meta, Drive...'},
  ],
  editorial: [
    {id:'e1',titre:'Reel BTS — Shooting Detmine',pilier:'Montrer',format:'Reel 30s',plateforme:'Instagram',statut:'À créer',sem:'S1'},
    {id:'e2',titre:'3 erreurs photo agences immo',pilier:'Éduquer',format:'Carrousel',plateforme:'Instagram',statut:'À créer',sem:'S1'},
    {id:'e3',titre:'Face cam — Qui je suis',pilier:'Personal Brand',format:'Reel 60s',plateforme:'Instagram',statut:'À planifier',sem:'S2'},
  ],
  ideas: [
    {id:'i1',titre:'Journée type agence à Mbour',desc:'Montrer le quotidien terrain — drone, montage, client',pilier:'Montrer',plateforme:'TikTok',date:today()},
    {id:'i2',titre:'Série "La Petite-Côte en images"',desc:'Valoriser le territoire — attirer hôtels/restaurants',pilier:'Prouver',plateforme:'Instagram',date:today()},
  ],
  equip: [
    {id:'eq1',nom:'iPhone 14 Pro',cat:'Caméra',statut:'Disponible',valeur:400000,usage:'Tournage 4K, ProRAW'},
    {id:'eq2',nom:'DJI Mini 3',cat:'Drone',statut:'Disponible',valeur:350000,usage:'Vues aériennes panoramiques'},
    {id:'eq3',nom:'DJI Osmo Mobile 7',cat:'Stabilisateur',statut:'Disponible',valeur:80000,usage:'Walking tour stabilisé'},
    {id:'eq4',nom:'PC Bureau',cat:'Post-production',statut:'Disponible',valeur:500000,usage:'Montage, étalonnage'},
    {id:'eq5',nom:'MacBook (occasion)',cat:'Mobilité',statut:'À acquérir',valeur:350000,usage:'Mobilité terrain'},
  ],
  prods: [{
    id:'pp1',titre:'Shooting Detmine — Résidence Saly',client:'Detmine Immo',
    date:'2026-04-12',lieu:'Saly Portudal',statut:'Préparation',notes:'2 biens — T3 + villa',
    equipe:['Norta (caméra)','DJI Mini 3'],
    checklist:['Batteries chargées (iPhone + DJI Mini 3)','Cartes SD formatées','Drone calibré + test vol','Stabilisateur Osmo chargé','Contrat signé + devis validé','Heure RDV confirmée','Lieu repéré (lumière + accès)','Tenue professionnelle','Briefing angles avec client','Disque dur backup'],
  }],
  devis: [{
    id:'dv1',ref:'DEV-2026-BTP-001',client:'Detmine Immo',date:'2026-04-01',validite:'30 jours',
    lignes:[{desc:'Shooting photo bien immobilier',qte:1,pu:75000},{desc:'Vidéo présentation 60s',qte:1,pu:120000},{desc:'Vue aérienne DJI Mini 3',qte:1,pu:50000}],
    statut:'Envoyé',notes:'Pack mensuel — 2 biens',
  }],
  motivation: {
    quotes:['BaoPixel transforme la Petite-Côte. Continue.','L\'excellence est une habitude, pas un acte.','Ton travail parle avant que tu n\'arrives.'],
    streak:0, lastDay:'',
    objectifs:['Signer So Suite Hôtel avant fin avril','700k FCFA CA mensuel','3 contenus/semaine minimum'],
    affirmations:['BaoPixel est l\'agence N°1 de la Petite-Côte','Chaque tournage est une œuvre d\'art','Ma créativité a de la valeur réelle'],
  },
}

// ════════════════════════════════════════════════════════
// DESIGN TOKENS
// ════════════════════════════════════════════════════════
const STAGES = ['Prospect Froid','Prospect Chaud','RDV Fixé','Devis Envoyé','Négociation','Signé','Actif']
const SCOL: Record<string,string> = {'Prospect Froid':'#7A6D94','Prospect Chaud':'#F7A800','RDV Fixé':'#4DA6FF','Devis Envoyé':'#A87EFA','Négociation':'#FBBF24','Signé':'#00D98B','Actif':'#00D98B'}
const PCOL: Record<string,string> = {'Montrer':'#C084FC','Éduquer':'#60A5FA','Prouver':'#00D98B','Personal Brand':'#F7A800','Vendre':'#F04438','Inspirer':'#FBBF24'}
const TCOL: Record<string,string> = {Tournage:'#C084FC',RDV:'#4DA6FF',Livraison:'#F7A800',Tâche:'#7A6D94'}
const PLAT_ICO: Record<string,string> = {Instagram:'bi-instagram',TikTok:'bi-tiktok',Facebook:'bi-facebook',YouTube:'bi-youtube',LinkedIn:'bi-linkedin','X':'bi-twitter-x',Spotify:'bi-spotify','E‑mail':'bi-envelope','Blog /site Web':'bi-globe'}
const PLAT_CLS: Record<string,string> = {Instagram:'plat-ig',TikTok:'plat-tt',Facebook:'plat-fb',YouTube:'plat-yt',LinkedIn:'plat-li','X':'plat-x'}
const TICON: Record<string,string> = {Tournage:'bi-camera-video-fill',RDV:'bi-calendar-check-fill',Livraison:'bi-box-seam-fill',Tâche:'bi-check2-square'}
const MO = ['2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07','2026-08','2026-09','2026-10','2026-11','2026-12']
const ML: Record<string,string> = Object.fromEntries(MO.map((m,i)=>[m,FR_M[i].slice(0,3)]))
const BAOPIXEL_WA = '221779127614' // Numéro WhatsApp BaoPixel agence

// ════════════════════════════════════════════════════════
// MAIN APP COMPONENT
// ════════════════════════════════════════════════════════
export default function BaoPixelStudio() {
  // ── Auth ──
  const [locked, setLocked] = useState(true)
  const [pinBuf, setPinBuf] = useState('')
  const [pinFirst, setPinFirst] = useState('')
  const [pinMsg, setPinMsg] = useState('')
  const [pinShake, setPinShake] = useState(false)

  // ── Theme ──
  const [theme, setTheme] = useState<'dark'|'light'>('dark')

  // ── Navigation ──
  const [tab, setTab] = useState<Tab>('home')
  const [contentSub, setContentSub] = useState<'posts'|'editorial'|'ideas'>('editorial')
  const [clientsSub, setClientsSub] = useState<'pipeline'|'agenda'|'preprod'>('pipeline')
  const [finTab, setFinTab] = useState<'res'|'gains'|'dep'|'devis'>('res')
  const [finMo, setFinMo] = useState(curMo())
  const [outilsSub, setOutilsSub] = useState<'preprod'|'veille'|'guide'|'decks'|'equip'|'mot'|'settings'>('preprod')
  const [editFilter, setEditFilter] = useState('Tous')

  // ── Calendar ──
  const [calY, setCalY] = useState(new Date().getFullYear())
  const [calM, setCalM] = useState(new Date().getMonth())
  const [calSel, setCalSel] = useState(today())

  // ── App Data ──
  const [data, setDataRaw] = useState<AppState>(DEF_DATA)
  const [dragId, setDragId] = useState<string|null>(null)

  // ── Notion / Sync ──
  const [notionPosts, setNotionPosts] = useState<NotionPost[]>([])
  const [notionTasks, setNotionTasks] = useState<NotionTask[]>([])
  const [donePosts, setDonePosts] = useState<Record<string,boolean>>({})
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<string>('')
  const [syncError, setSyncError] = useState(false)

  // ── AI ──
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState('')
  const [veilleNet, setVeilleNet] = useState('Instagram')
  const [deckType, setDeckType] = useState('Proposition commerciale')
  const [boostText, setBoostText] = useState('')

  // ── Devis modal ──
  const [dvLignes, setDvLignes] = useState<{desc:string;qte:number;pu:number}[]>([{desc:'',qte:1,pu:0}])

  // ── Modal ──
  const [modal, setModal] = useState<React.ReactNode>(null)

  // ── Hydration ──
  const [mounted, setMounted] = useState(false)

  // ════════════════════════════════════════════════════════
  // INITIALIZATION
  // ════════════════════════════════════════════════════════
  useEffect(() => {
    // Load theme
    const t = DB.get('bp_theme','dark') as 'dark'|'light'
    setTheme(t)
    document.documentElement.setAttribute('data-theme', t)

    // Load data from localStorage
    const stored = DB.get('bp4_data', null)
    if (stored) setDataRaw(stored as AppState)

    // Load misc state
    setDonePosts(DB.get('bp_done_posts', {}) as Record<string,boolean>)
    setLastSync(DB.get('bp_last_sync','') as string)

    // Mark as mounted (hydration complete)
    setMounted(true)
  }, [])

  // ════════════════════════════════════════════════════════
  // SAVE (auto-persist on every state change)
  // ════════════════════════════════════════════════════════
  const setData = useCallback((updater: (prev:AppState)=>AppState) => {
    setDataRaw(prev => {
      const next = updater(prev)
      DB.set('bp4_data', next)
      return next
    })
  }, [])

  // ════════════════════════════════════════════════════════
  // NOTION SYNC — called on every app open
  // ════════════════════════════════════════════════════════
  const syncNotion = useCallback(async (silent=true) => {
    setSyncing(true)
    setSyncError(false)
    try {
      const r = await fetch('/api/notion/sync')
      const d = await r.json()
      if (d.error === 'NO_TOKEN') { setSyncing(false); return }
      setNotionPosts(d.posts || [])
      setNotionTasks(d.tasks || [])
      const ts = new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})
      setLastSync(ts)
      DB.set('bp_notion_posts', d.posts || [])
      DB.set('bp_notion_tasks', d.tasks || [])
      DB.set('bp_last_sync', ts)
      if (!silent) showToast(`✅ Notion synchronisé — ${d.posts?.length||0} post(s)`, 'success')
    } catch {
      setSyncError(true)
      // Load cached data
      setNotionPosts(DB.get('bp_notion_posts', []) as NotionPost[])
      setNotionTasks(DB.get('bp_notion_tasks', []) as NotionTask[])
    }
    setSyncing(false)
  }, [])

  // ════════════════════════════════════════════════════════
  // UNLOCK APP — sync Notion on every open
  // ════════════════════════════════════════════════════════
  const unlockApp = useCallback(() => {
    setLocked(false)
    // Update streak
    setData(prev => {
      const m = {...prev.motivation}
      const t = today()
      if (m.lastDay !== t) {
        const y = new Date(); y.setDate(y.getDate()-1)
        const ys = y.toISOString().slice(0,10)
        m.streak = (m.lastDay === ys ? m.streak : 0) + 1
        m.lastDay = t
      }
      return {...prev, motivation: m}
    })
    // Sync Notion on every open
    syncNotion()
    // Load cached Notion data immediately while syncing
    setNotionPosts(DB.get('bp_notion_posts', []) as NotionPost[])
    setNotionTasks(DB.get('bp_notion_tasks', []) as NotionTask[])
    setLastSync(DB.get('bp_last_sync','') as string)
  }, [setData, syncNotion])

  // ════════════════════════════════════════════════════════
  // THEME TOGGLE
  // ════════════════════════════════════════════════════════
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    DB.set('bp_theme', next)
  }

  // ════════════════════════════════════════════════════════
  // AUTO-SYNC NOTION AT MIDNIGHT EVERY DAY (when calendar view is active)
  // ════════════════════════════════════════════════════════
  useEffect(() => {
    if (!mounted || locked || contentSub !== 'editorial') return
    
    const getTimeUntilMidnight = () => {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      return tomorrow.getTime() - now.getTime()
    }
    
    let timeouts: NodeJS.Timeout[] = []
    let intervals: NodeJS.Timeout[] = []
    
    const scheduleSync = () => {
      const timeUntilMidnight = getTimeUntilMidnight()
      
      const timeout = setTimeout(() => {
        syncNotion() // Sync à minuit
        
        // Puis chaque 24h après minuit
        const interval = setInterval(() => {
          syncNotion()
        }, 24 * 60 * 60 * 1000)
        
        intervals.push(interval)
      }, timeUntilMidnight)
      
      timeouts.push(timeout)
    }
    
    scheduleSync()
    
    return () => {
      timeouts.forEach(t => clearTimeout(t))
      intervals.forEach(i => clearInterval(i))
    }
  }, [mounted, locked, contentSub, syncNotion])

  // ════════════════════════════════════════════════════════
  // TOAST
  // ════════════════════════════════════════════════════════
  const toastRef = useRef<HTMLDivElement>(null)
  const showToast = (msg: string, type='info') => {
    const el = toastRef.current
    if (!el) return
    el.innerHTML = `<div class="toast ${type}">${esc(msg)}</div>`
    setTimeout(() => { if(el) el.innerHTML = '' }, 3800)
  }

  // ════════════════════════════════════════════════════════
  // PIN AUTH
  // ════════════════════════════════════════════════════════
  const submitPin = useCallback((buf: string) => {
    const stored = DB.get('bp4_pin', null) as string|null
    if (!stored) {
      if (!pinFirst) { setPinFirst(buf); setPinBuf(''); setPinMsg('Confirmez votre PIN'); return }
      if (buf === pinFirst) { DB.set('bp4_pin', buf); setPinMsg('✅ PIN créé !'); setTimeout(unlockApp, 420) }
      else { setPinFirst(''); setPinBuf(''); setPinMsg('PINs différents'); setPinShake(true); setTimeout(()=>setPinShake(false), 600) }
      return
    }
    if (buf === stored) { unlockApp() }
    else { setPinBuf(''); setPinMsg('Code incorrect'); setPinShake(true); setTimeout(()=>{ setPinShake(false); setPinMsg('') }, 650) }
  }, [pinFirst, unlockApp])

  const handleKey = (v: string) => {
    if (pinBuf.length >= 4) return
    const nb = pinBuf + v
    setPinBuf(nb)
    if (nb.length === 4) setTimeout(() => submitPin(nb), 160)
  }

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (locked) {
        if ('0123456789'.includes(e.key)) handleKey(e.key)
        if (e.key === 'Backspace') setPinBuf(b => b.slice(0,-1))
      }
      if (e.ctrlKey && e.key === 'l') { setLocked(true); setPinBuf(''); setPinFirst(''); setPinMsg('') }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [locked, pinBuf, handleKey])

  // ════════════════════════════════════════════════════════
  // AI HELPER
  // ════════════════════════════════════════════════════════
  const askAI = async (prompt: string, system?: string): Promise<string> => {
    try {
      const r = await fetch('/api/ai', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({prompt,system}) })
      const d = await r.json()
      return d.text || 'Erreur de réponse.'
    } catch { return 'Erreur réseau.' }
  }

  // ════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ════════════════════════════════════════════════════════
  const ca = data.gains.filter(g=>g.mois===curMo()).reduce((s,g)=>s+Number(g.montant),0)
  const pct = Math.min(100, Math.round(ca/data.goal*100))
  const urgTasks = data.tasks.filter(t=>t.prio==='Urgent'&&t.statut!=='Fait')
  const todayTasks = data.tasks.filter(t=>t.date===today()&&t.statut!=='Fait')
  const activePosts = notionPosts.filter(p=>!donePosts[p.id])

  // ════════════════════════════════════════════════════════
  // MARK POST DONE
  // ════════════════════════════════════════════════════════
  const markPostDone = async (id: string) => {
    const isDone = !!donePosts[id]
    const next = {...donePosts}
    if (isDone) delete next[id]
    else { next[id] = true; fetch('/api/notion/mark',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pageId:id})}).then(r=>r.json()).then(d=>{ if(d.ok) showToast('✅ Marqué "Publié" dans Notion','success') }) }
    setDonePosts(next)
    DB.set('bp_done_posts', next)
  }

  // ════════════════════════════════════════════════════════
  // PRINT DEVIS
  // ════════════════════════════════════════════════════════
  const printDevis = (dv: Devis) => {
    const tot = dv.lignes.reduce((s,l)=>s+Number(l.qte)*Number(l.pu),0)
    const acomp = Math.round(tot*.5)
    const w = window.open('','_blank')
    if (!w) return
    w.document.write(`<!DOCTYPE html><html><head><title>${dv.ref}</title><meta charset="UTF-8">
    <style>body{font-family:'Segoe UI',sans-serif;margin:0;color:#111;font-size:13px}
    .hdr{background:#7B2FF7;color:#fff;padding:28px 36px;display:flex;justify-content:space-between;align-items:flex-start}
    .logo{font-size:26px;font-weight:900;letter-spacing:-.02em}.logo .o{color:#F7A800}
    .body{padding:32px 36px}.two{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:24px 0;border:1px solid #eee;border-radius:8px;overflow:hidden}
    .col{padding:18px}.col+.col{border-left:1px solid #eee}.cl{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px}
    .cv{font-size:15px;font-weight:700;margin-bottom:3px}.cs{font-size:12px;color:#555}
    table{width:100%;border-collapse:collapse;margin:16px 0}
    th{background:#7B2FF7;color:#fff;padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em}
    th:not(:first-child){text-align:right}td{padding:10px 12px;border-bottom:1px solid #eee}td:not(:first-child){text-align:right}
    .tot td{font-weight:800;font-size:15px;color:#7B2FF7;border-top:2px solid #7B2FF7;border-bottom:none}
    .cond{background:#f9f7ff;border-radius:8px;padding:16px 20px;margin-top:20px}
    .cond-t{font-weight:800;color:#7B2FF7;margin-bottom:8px;font-size:14px}
    .cond li{font-size:12px;color:#444;margin-bottom:4px;line-height:1.5}
    .sigs{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:40px}
    .sig-l{border-top:1px solid #999;padding-top:8px;margin-top:50px;font-size:12px;color:#666;text-align:center}
    .foot{text-align:center;font-size:11px;color:#999;padding:16px;border-top:1px solid #eee;margin-top:24px}
    @media print{body{margin:0}}</style></head><body>
    <div class="hdr">
      <div><div class="logo">Bao<span class="o">Pixel</span> Digital Agency</div>
      <div style="margin-top:6px;font-size:12px;opacity:.85">Mbour, Petite-Côte, Sénégal · contact@baopixel.com · www.baopixel.com</div></div>
      <div style="text-align:right"><div style="font-size:22px;font-weight:900;letter-spacing:.05em">DEVIS</div>
      <div style="margin-top:6px;font-size:13px;font-weight:700">${dv.ref}</div>
      <div style="font-size:12px;opacity:.85">Date : ${dv.date} · Validité : ${dv.validite}</div></div>
    </div>
    <div class="body">
      <div class="two">
        <div class="col"><div class="cl">Prestataire</div><div class="cv">BaoPixel Digital Agency</div>
        <div class="cs">Mbour, Petite-Côte, Sénégal</div><div class="cs">contact@baopixel.com</div></div>
        <div class="col"><div class="cl">Client</div><div class="cv">${esc(dv.client)}</div></div>
      </div>
      ${dv.notes?`<div style="background:#f9f7ff;border-left:4px solid #7B2FF7;padding:12px 16px;margin-bottom:20px;border-radius:0 8px 8px 0"><div class="cl">Objet</div>${esc(dv.notes)}</div>`:''}
      <table>
        <tr><th>Description</th><th>Qté</th><th>P.U. HT</th><th>Total HT</th></tr>
        ${dv.lignes.map(l=>`<tr><td>${esc(l.desc)}</td><td>${l.qte}</td><td>${Number(l.pu).toLocaleString('fr-FR')} FCFA</td><td>${(Number(l.qte)*Number(l.pu)).toLocaleString('fr-FR')} FCFA</td></tr>`).join('')}
        <tr><td colspan="3" style="text-align:right;color:#888;padding:8px 12px">Sous-total HT</td><td>${tot.toLocaleString('fr-FR')} FCFA</td></tr>
        <tr><td colspan="3" style="text-align:right;color:#888;padding:4px 12px">TVA (0%)</td><td>0 FCFA</td></tr>
        <tr class="tot"><td colspan="3" style="text-align:right;padding:12px">TOTAL TTC</td><td>${tot.toLocaleString('fr-FR')} FCFA</td></tr>
      </table>
      <div class="cond"><div class="cond-t">Conditions de règlement</div><ul>
        <li>Acompte 50% à la signature : <strong>${acomp.toLocaleString('fr-FR')} FCFA</strong></li>
        <li>Solde 50% à la livraison : <strong>${acomp.toLocaleString('fr-FR')} FCFA</strong></li>
        <li>Paiement : Orange Money / Wave / Virement bancaire</li>
      </ul></div>
      <div class="sigs">
        <div><div class="sig-l">Signature & Cachet BaoPixel</div></div>
        <div><div class="sig-l">Signature Client (bon pour accord)</div></div>
      </div>
    </div>
    <div class="foot">BaoPixel Digital Agency · Mbour, Petite-Côte, Sénégal · ${dv.ref}</div>
    </body></html>`)
    w.document.close()
    setTimeout(() => w.print(), 600)
  }

  // ════════════════════════════════════════════════════════
  // MODAL HELPERS
  // ════════════════════════════════════════════════════════
  const closeModal = () => setModal(null)
  const Mbox = ({title, children, wide=false}: {title:string; children:React.ReactNode; wide?:boolean}) => (
    <div className={`overlay${wide?'':''}`} onClick={e=>{if(e.target===e.currentTarget)closeModal()}}>
      <div className="modal" style={wide?{maxWidth:500}:{}}>
        <div className="modal-handle"/>
        <div className="modal-head">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={closeModal}><i className="bi bi-x"/></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )

  const Fld = ({label, id, value, onChange, type='text', placeholder='', opts, rows}:{label?:string;id?:string;value:string;onChange:(v:string)=>void;type?:string;placeholder?:string;opts?:string[];rows?:number}) => (
    <div className="field">
      {label && <label>{label}</label>}
      {opts ? <select value={value} onChange={e=>onChange(e.target.value)}>{opts.map(o=><option key={o}>{o}</option>)}</select>
       : rows ? <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}/>
       : <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>}
    </div>
  )

  const Acts = ({children}: {children:React.ReactNode}) => (
    <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:16}}>{children}</div>
  )

  // ════════════════════════════════════════════════════════
  // DASHBOARD
  // ════════════════════════════════════════════════════════
  const Dashboard = () => {
    const now = new Date()
    const dep = data.depenses.filter(d=>d.mois===curMo()&&d.type!=='Investissement').reduce((s,d)=>s+Number(d.montant),0)
    const net = ca - dep
    const mot = data.motivation
    const q = mot.quotes[now.getDay()%mot.quotes.length]
    const upT = data.tasks.filter(t=>t.date>today()&&t.statut!=='Fait').sort((a,b)=>a.date.localeCompare(b.date)).slice(0,4)
    const greet = now.getHours()<12?'Bonjour 👋':'Bon après-midi 👋'

    return (
      <div className="page">
        {/* Hero greeting */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14,flexWrap:'wrap',gap:8}}>
          <div>
            <div className="sy" style={{fontSize:26,fontWeight:900,lineHeight:1}}>{greet}</div>
            <div className="mu" style={{marginTop:4}}>{FR_D[now.getDay()]} {now.getDate()} {FR_M[now.getMonth()]} · BaoPixel Studio</div>
          </div>
          <div style={{background:'var(--ps)',border:'1px solid rgba(123,47,247,.3)',borderRadius:12,padding:'8px 14px',textAlign:'right'}}>
            <div className="sy" style={{fontSize:20,fontWeight:900,color:'var(--o)'}}>{mot.streak}🔥</div>
            <div className="mu2">jours streak</div>
          </div>
        </div>

        {/* Stats */}
        <div className="stat-grid mb14">
          <div className="stat-card p">
            <div className="sc-lbl">CA {FR_M[now.getMonth()].slice(0,4)}.</div>
            <div className="sc-val sy" style={{color:'var(--g)',fontSize:20}}>{fmtK(ca)}<span style={{fontSize:10,color:'var(--mu)',fontFamily:'Outfit,sans-serif',fontWeight:400}}> FCFA</span></div>
            <div className="sc-sub">Net : {fmtK(net)} FCFA</div>
          </div>
          <div className="stat-card o">
            <div className="sc-lbl">Objectif</div>
            <div className="sc-val sy" style={{color:'var(--pl)'}}>{pct}%</div>
            <div className="pbar mt8" style={{height:5}}><div className="pbar-f" style={{width:`${pct}%`}}/></div>
            <div className="sc-sub mt8">{fmtK(data.goal)} FCFA</div>
          </div>
          <div className="stat-card g">
            <div className="sc-lbl">Actifs</div>
            <div className="sc-val sy" style={{color:'var(--pl)'}}>{data.clients.filter(c=>c.stage==='Actif').length}</div>
            <div className="sc-sub">clients</div>
          </div>
          <div className="stat-card y">
            <div className="sc-lbl">Urgences</div>
            <div className="sc-val sy" style={{color:urgTasks.length?'var(--r)':'var(--g)'}}>{urgTasks.length}</div>
            <div className="sc-sub">{urgTasks.length?'Action requise':'Tout OK ✓'}</div>
          </div>
        </div>

        {/* Notion Posts 24h Widget */}
        <div className="posts-widget mb14">
          <div className="flex-sb mb12">
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:13,color:'var(--pl)',textTransform:'uppercase',letterSpacing:'.06em'}}>
              <i className="bi bi-calendar2-check-fill" style={{marginRight:6}}/>Posts 24h · Notion
            </div>
            <div className="flex" style={{gap:8}}>
              <div className="mu2">{syncing?<span className="sync-dot syncing"/>:<span className="sync-dot"/>} {lastSync||'—'}</div>
              <button className="btn btn-pill" style={{minHeight:28,padding:'4px 10px',fontSize:11,background:'rgba(123,47,247,.2)',color:'var(--pl)',border:'1px solid rgba(123,47,247,.3)'}}
                onClick={()=>syncNotion()} disabled={syncing}>
                <i className={`bi bi-arrow-clockwise ${syncing?'spin':''}`}/>{syncing?' Sync...':' Sync'}
              </button>
            </div>
          </div>
          {activePosts.length === 0 ? (
            <div style={{textAlign:'center',padding:'16px 0',color:'var(--pl)',fontSize:13}}>
              {lastSync ? '✅ Aucun post à publier dans les 24h' : syncError?'❌ Erreur de connexion Notion':'Configure le token Notion dans Outils → Paramètres'}
            </div>
          ) : activePosts.slice(0,5).map(p => (
            <div key={p.id} className={`post-pill${donePosts[p.id]?' done':''}`}>
              <div className={`pp-plat ${PLAT_CLS[p.platform]||'plat-def'}`}><i className={`bi ${PLAT_ICO[p.platform]||'bi-megaphone-fill'}`}/></div>
              <div className="pp-info">
                <div className="pp-name">{p.name}</div>
                <div className="pp-meta"><i className="bi bi-clock"/>{' '}{dlbl(p.pub)||'Auj.'} · {p.platform} · {p.source}</div>
              </div>
              <div className="pp-chk" onClick={()=>markPostDone(p.id)}><i className="bi bi-check"/></div>
            </div>
          ))}
          {activePosts.length>0&&<div style={{textAlign:'center',marginTop:10}}>
            <button className="btn btn-pill" style={{fontSize:11,background:'rgba(0,217,139,.1)',color:'var(--g)',border:'1px solid rgba(0,217,139,.25)'}}
              onClick={()=>requestNotifPermission()}>
              <i className="bi bi-bell-fill"/> Activer rappels
            </button>
          </div>}
        </div>

        {/* Urgences */}
        {urgTasks.length>0&&<div className="card mb14 card-o" style={{borderColor:'rgba(240,68,56,.3)'}}>
          <div className="flex mb12">
            <span className="pu" style={{width:8,height:8,background:'var(--r)',borderRadius:'50%',display:'inline-block',flexShrink:0}}/>
            <span className="sy" style={{fontSize:12,fontWeight:800,color:'var(--r)',textTransform:'uppercase',letterSpacing:'.06em'}}>URGENCES</span>
          </div>
          {urgTasks.map(t=>(
            <div key={t.id} className="surf2 mb8 flex-sb">
              <div className="flex" style={{minWidth:0,gap:8}}>
                <i className={`bi ${TICON[t.type]||'bi-check2-square'}`} style={{color:TCOL[t.type],flexShrink:0}}/>
                <div style={{minWidth:0}}><div className="rt">{t.titre}</div><div className="mu2">{t.client}{t.date?` · ${dlbl(t.date)}`:''}</div></div>
              </div>
              <span className="badge" style={{background:'rgba(240,68,56,.12)',color:'var(--r)',fontSize:10}}>URGENT</span>
            </div>
          ))}
        </div>}

        {/* Today */}
        <div className="card mb14 card-glow">
          <div className="flex-sb mb12">
            <span className="sy fw8" style={{fontSize:15}}><i className="bi bi-pin-map-fill" style={{color:'var(--p)',marginRight:6}}/>Aujourd'hui</span>
            <span className="mu">{todayTasks.length} tâche{todayTasks.length!==1?'s':''}</span>
          </div>
          {todayTasks.length===0?<div className="mu">✅ Rien de planifié</div>
          :todayTasks.slice(0,4).map(t=>(
            <div key={t.id} className="surf2 mb8 flex" style={{gap:10}}>
              <i className={`bi ${TICON[t.type]||'bi-check2-square'}`} style={{color:TCOL[t.type]||'var(--mu)',flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}><div className="rt" style={{fontSize:13}}>{t.titre}</div><div className="mu2">{t.client}{t.heure?` · ${t.heure}`:''}</div></div>
              <button onClick={()=>setData(p=>({...p,tasks:p.tasks.map(x=>x.id===t.id?{...x,statut:x.statut==='Fait'?'Todo':'Fait'}:x)}))}
                style={{width:26,height:26,borderRadius:'50%',border:`2px solid ${t.statut==='Fait'?'var(--g)':'var(--dm)'}`,background:t.statut==='Fait'?'var(--g)':'transparent',cursor:'pointer',color:'#fff',fontSize:11,flexShrink:0}}>
                {t.statut==='Fait'?<i className="bi bi-check"/>:''}
              </button>
            </div>
          ))}
          <button className="btn btn-g btn-sm mt12" onClick={()=>{setTab('clients');setClientsSub('agenda')}}>
            <i className="bi bi-arrow-right"/>Tout voir
          </button>
        </div>

        {/* À venir */}
        {upT.length>0&&<div className="card mb14">
          <div className="flex-sb mb12">
            <span className="sy fw8" style={{fontSize:15}}><i className="bi bi-calendar3" style={{color:'var(--b)',marginRight:6}}/>À venir</span>
          </div>
          {upT.map(t=>{const d=dTo(t.date);return(
            <div key={t.id} className="surf2 mb8 flex" style={{gap:8}}>
              <span className="sy" style={{fontSize:10,fontWeight:800,background:d<=2?'var(--o)':'var(--ps)',color:d<=2?'#fff':'var(--pl)',padding:'2px 8px',borderRadius:100,whiteSpace:'nowrap'}}>{dlbl(t.date)}</span>
              <i className={`bi ${TICON[t.type]||'bi-check2-square'}`} style={{color:TCOL[t.type],flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}><div className="rt" style={{fontSize:12}}>{t.titre}</div><div className="mu2">{t.client}</div></div>
            </div>
          )})}
        </div>}

        {/* Citation */}
        <div style={{background:'linear-gradient(135deg,var(--ps2),var(--ps))',border:'1px solid rgba(123,47,247,.25)',borderRadius:'var(--r20)',padding:16}}>
          <div className="mu2 mb8" style={{textTransform:'uppercase',letterSpacing:'.07em'}}>💬 Citation du jour</div>
          <div className="sy" style={{fontSize:15,fontWeight:700,lineHeight:1.5,fontStyle:'italic',color:'var(--tx2)'}}>&ldquo;{q}&rdquo;</div>
        </div>

        {/* WhatsApp Contact BaoPixel */}
        <a href={`https://wa.me/${BAOPIXEL_WA}?text=Bonjour%20BaoPixel`} target="_blank" style={{display:'block',marginTop:16,textDecoration:'none'}}>
          <div style={{background:'linear-gradient(135deg,#00D98B 0%,#00C78A 100%)',borderRadius:'var(--r12)',padding:14,textAlign:'center',cursor:'pointer',transition:'transform 0.2s'}}>
            <div style={{color:'#fff',fontWeight:700,fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
              <i className="bi bi-whatsapp"/>Contacter BaoPixel — {BAOPIXEL_WA}
            </div>
          </div>
        </a>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════
  // CONTENT TAB
  // ════════════════════════════════════════════════════════
  const ContentTab = () => (
    <div className="page">
      <div className="sec-hd"><div className="sy-t">Contenu</div></div>
      <div className="chips">
        {([['editorial','bi-calendar-check-fill','Calendrier'],['posts','bi-list-task','Calendar Éditorial'],['ideas','bi-lightbulb-fill','Idées']] as [string,string,string][]).map(([id,ic,lbl])=>(
          <div key={id} className={`chip${contentSub===id?' act':''}`} onClick={()=>setContentSub(id as any)}>
            <i className={`bi ${ic}`}/> {lbl}
          </div>
        ))}
      </div>
      {contentSub==='editorial' && <ContentPosts/>}
      {contentSub==='posts' && <EditorialView/>}
      {contentSub==='ideas' && <IdeasView/>}
    </div>
  )

  const ContentPosts = () => {
    // Group posts by date
    const groupedPosts: Record<string, typeof notionPosts> = {}
    activePosts.forEach(p => {
      const date = p.pub || today()
      if (!groupedPosts[date]) groupedPosts[date] = []
      groupedPosts[date].push(p)
    })

    // Sort dates
    const sortedDates = Object.keys(groupedPosts).sort()

    return (
      <div>
        <div className="calendar-sync-bar">
          <div className="calendar-sync-info">
            <div className="calendar-status-dot" style={{background: syncError ? '#FF6B6B' : '#00D98B'}}/>
            <span>{syncing ? 'Synchronisation...' : `✓ À jour — ${lastSync || 'Jamais'}`}</span>
          </div>
          <button className="btn btn-g btn-sm" onClick={()=>syncNotion(false)} disabled={syncing}>
            <i className={`bi bi-arrow-clockwise ${syncing?'spin':''}`}/>{syncing?' Sync...':' Actualiser'}
          </button>
        </div>

        {activePosts.length===0?(
          <div className="card"><div className="empty"><span className="empty-ico"><i className="bi bi-inbox"/></span>
            {lastSync?'Aucun contenu à venir':'Configurez votre token Notion dans Outils → Paramètres'}
          </div></div>
        ):(
          <div className="calendar-container">
            {sortedDates.map(date=>(
              <div key={date} className="calendar-day">
                <div className="calendar-day-header">
                  <i className="bi bi-calendar-check-fill" style={{fontSize:14}}/>
                  <span>{dlbl(date)}</span>
                </div>
                <div className="calendar-posts">
                  {groupedPosts[date].map(p=>(
                    <div key={p.id} className={`calendar-post-item${donePosts[p.id]?' done':''}`}>
                      <div className="calendar-post-icon" style={{background:PLAT_CLS[p.platform]?'var(--s3)':'var(--s3)'}}>
                        <i className={`bi ${PLAT_ICO[p.platform]||'bi-megaphone-fill'}`}/>
                      </div>
                      <div className="calendar-post-content">
                        <div className="calendar-post-title">{p.name}</div>
                        <div className="calendar-post-meta">
                          <span className="calendar-post-badge"><i className="bi bi-tag-fill" style={{fontSize:9}}/>  {p.type}</span>
                          <span className="calendar-post-badge"><i className={`bi ${PLAT_ICO[p.platform]||'bi-megaphone-fill'}`} style={{fontSize:9}}/> {p.platform}</span>
                          <span className="calendar-post-client"><i className="bi bi-person-fill" style={{fontSize:9}}/> {p.client}</span>
                        </div>
                      </div>
                      <button className={`btn btn-sm ${donePosts[p.id]?'btn-g':'btn-p'}`} onClick={()=>markPostDone(p.id)} style={{flexShrink:0}}>
                        {donePosts[p.id]?<><i className="bi bi-check-all"/>Publié</>:<><i className="bi bi-check-lg"/>Marquer</>}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const EditorialView = () => {
    const items = editFilter==='Tous'?data.editorial:data.editorial.filter(c=>c.pilier===editFilter)
    const statBg = (s:string) => s==='À créer'?'rgba(168,126,250,.15)':s==='En cours'?'rgba(251,191,36,.15)':s==='Prêt'?'rgba(0,217,139,.15)':'var(--s3)'
    const statC  = (s:string) => s==='À créer'?'var(--pl)':s==='En cours'?'var(--y)':s==='Prêt'?'var(--g)':'var(--mu)'
    return(
      <div>
        <div className="chips">
          {['Tous',...Object.keys(PCOL)].map(f=>(
            <div key={f} className={`chip${editFilter===f?' act':''}`} onClick={()=>setEditFilter(f)} style={editFilter!==f&&f!=='Tous'?{borderColor:PCOL[f]+'55'}:{}}>{f}</div>
          ))}
        </div>
        {items.length===0?<div className="empty"><span className="empty-ico"><i className="bi bi-calendar3"/></span>Aucun contenu pour ce filtre</div>
        :items.map(c=>(
          <div key={c.id} className="content-card" style={{background:`${PCOL[c.pilier]||'#7A6D94'}12`,borderLeftColor:PCOL[c.pilier]||'var(--p)'}}>
            <div className="flex-sb mb8">
              <div style={{fontWeight:600,fontSize:14,flex:1,marginRight:8}}>{c.titre}</div>
              <select value={c.statut} onChange={e=>{const v=e.target.value;setData(p=>({...p,editorial:p.editorial.map(x=>x.id===c.id?{...x,statut:v}:x)}))}}
                style={{fontSize:11,background:statBg(c.statut),color:statC(c.statut),border:'none',borderRadius:8,padding:'3px 8px',fontFamily:'inherit',fontWeight:600,cursor:'pointer',width:'auto',minHeight:28}}>
                {['À créer','En cours','Prêt','Publié','Archivé'].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex" style={{gap:6,flexWrap:'wrap'}}>
              <span className="badge" style={{background:`${PCOL[c.pilier]||'var(--ps)'}22`,color:PCOL[c.pilier]||'var(--pl)',fontSize:10}}>{c.pilier}</span>
              <span className={`badge ${PLAT_CLS[c.plateforme]||'plat-def'}`} style={{fontSize:10}}><i className={`bi ${PLAT_ICO[c.plateforme]||'bi-megaphone-fill'}`}/> {c.plateforme}</span>
              <span className="mu2">{c.format} · Sem. {c.sem}</span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const IdeasView = () => (
    <div>
      <div className="flex-sb mb14">
        <div className="sy fw8" style={{fontSize:16}}>Bank d'idées</div>
        <span className="mu">{data.ideas.length} idée{data.ideas.length!==1?'s':''}</span>
      </div>
      {data.ideas.length===0?<div className="empty"><span className="empty-ico"><i className="bi bi-lightbulb"/></span>Capturez votre première idée !</div>
      :data.ideas.map(i=>(
        <div key={i.id} className="card mb10" style={{borderLeft:`3px solid ${PCOL[i.pilier]||'var(--p)'}`}}>
          <div className="flex-sb mb8">
            <span className="badge" style={{background:`${PCOL[i.pilier]||'var(--ps)'}22`,color:PCOL[i.pilier]||'var(--pl)',fontSize:10}}>{i.pilier}</span>
            <button onClick={()=>setData(p=>({...p,ideas:p.ideas.filter(x=>x.id!==i.id)}))} style={{background:'none',border:'none',color:'var(--mu)',cursor:'pointer',fontSize:18}}><i className="bi bi-x"/></button>
          </div>
          <div style={{fontWeight:700,fontSize:15,marginBottom:6,lineHeight:1.4}}>{i.titre}</div>
          <div className="mu mb8" style={{lineHeight:1.5}}>{i.desc}</div>
          <div className="flex-sb"><span className="mu2"><i className={`bi ${PLAT_ICO[i.plateforme]||'bi-megaphone-fill'}`}/> {i.plateforme}</span><span className="mu2">{dlbl(i.date)}</span></div>
        </div>
      ))}
    </div>
  )

  // ════════════════════════════════════════════════════════
  // CLIENTS TAB
  // ════════════════════════════════════════════════════════
  const ClientsTab = () => (
    <div className="page">
      <div className="sec-hd"><div className="sy-t">Clients</div></div>
      <div className="chips">
        {([['pipeline','bi-kanban-fill','Pipeline'],['agenda','bi-calendar3','Agenda'],['preprod','bi-camera-video-fill','Pré-prod']] as [string,string,string][]).map(([id,ic,lbl])=>(
          <div key={id} className={`chip${clientsSub===id?' act':''}`} onClick={()=>setClientsSub(id as any)}>
            <i className={`bi ${ic}`}/> {lbl}
          </div>
        ))}
      </div>
      {clientsSub==='pipeline' && <PipelineView/>}
      {clientsSub==='agenda' && <AgendaView/>}
      {clientsSub==='preprod' && <PreprodList/>}
    </div>
  )

  const PipelineView = () => {
    const capot = data.clients.filter(c=>c.stage==='Actif').reduce((s,c)=>s+Number(c.montant),0)
    return(
      <div>
        <div className="stat-grid mb14">
          <div className="stat-card p"><div className="sc-lbl">Prospects</div><div className="sc-val sy" style={{color:'var(--pl)'}}>{data.clients.length}</div></div>
          <div className="stat-card g"><div className="sc-lbl">Actifs</div><div className="sc-val sy" style={{color:'var(--g)'}}>{data.clients.filter(c=>c.stage==='Actif').length}</div></div>
          <div className="stat-card o"><div className="sc-lbl">CA pipeline</div><div className="sc-val sy" style={{color:'var(--ol)',fontSize:16}}>{fmtK(capot)}<span style={{fontSize:10,color:'var(--mu)',fontFamily:'Outfit,sans-serif'}}> FCFA</span></div></div>
          <div className="stat-card y"><div className="sc-lbl">Chauds</div><div className="sc-val sy" style={{color:'var(--y)'}}>{data.clients.filter(c=>['RDV Fixé','Devis Envoyé','Négociation'].includes(c.stage)).length}</div></div>
        </div>
        <div className="kanban">
          {STAGES.map(st=>{
            const cards = data.clients.filter(c=>c.stage===st)
            const col = SCOL[st]||'#7A6D94'
            return(
              <div key={st} className="k-col">
                <div className="k-head" style={{background:`${col}18`}}>
                  <div className="sy" style={{fontSize:11,fontWeight:800,color:col}}>{st}</div>
                  <div className="mu2">{cards.length}</div>
                </div>
                <div className="k-body" id={`kc-${st}`}
                  onDragOver={e=>{e.preventDefault();document.getElementById(`kc-${st}`)?.classList.add('dov')}}
                  onDragLeave={()=>document.getElementById(`kc-${st}`)?.classList.remove('dov')}
                  onDrop={()=>{document.getElementById(`kc-${st}`)?.classList.remove('dov');if(dragId)setData(p=>({...p,clients:p.clients.map(c=>c.id===dragId?{...c,stage:st}:c)}));setDragId(null)}}>
                  {cards.map(c=>(
                    <div key={c.id} className="k-card" draggable
                      onDragStart={()=>setDragId(c.id)}
                      onDragEnd={()=>setDragId(null)}
                      onClick={()=>openEditClient(c)}>
                      <div style={{fontWeight:700,fontSize:13,marginBottom:2}}>{c.nom}</div>
                      <div className="mu2 mb8">{c.secteur} · {fmtK(Number(c.montant))} FCFA</div>
                      <div className="flex" style={{gap:5,flexWrap:'wrap'}}>
                        <span className="badge" style={{background:'var(--ps)',color:'var(--pl)',fontSize:9}}>{c.pack}</span>
                        {c.contact&&<button className="btn btn-p btn-sm" style={{padding:'2px 7px',minHeight:24,fontSize:10,borderRadius:6}} onClick={e=>{e.stopPropagation();openWaScript(c)}}><i className="bi bi-whatsapp"/></button>}
                      </div>
                    </div>
                  ))}
                  {cards.length===0&&<div className="mu2" style={{textAlign:'center',padding:'16px 0',fontSize:11}}>Déposer ici</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const AgendaView = () => {
    const first = new Date(calY, calM, 1)
    const last  = new Date(calY, calM+1, 0)
    const days: {date:string;cur:boolean}[] = []
    let cur = new Date(first)
    const dow = (first.getDay()+6)%7
    for(let i=0;i<dow;i++){const d=new Date(first);d.setDate(d.getDate()-dow+i);days.push({date:d.toISOString().slice(0,10),cur:false})}
    while(cur<=last){days.push({date:cur.toISOString().slice(0,10),cur:true});cur.setDate(cur.getDate()+1)}
    while(days.length%7!==0){const d=new Date(cur);days.push({date:d.toISOString().slice(0,10),cur:false});cur.setDate(cur.getDate()+1)}
    const selTasks = data.tasks.filter(t=>t.date===calSel)

    return(
      <div>
        <div className="cal-nav">
          <button className="cal-btn" onClick={()=>{if(calM===0){setCalM(11);setCalY(calY-1)}else setCalM(calM-1)}}><i className="bi bi-chevron-left"/></button>
          <span className="cal-title">{FR_M[calM]} {calY}</span>
          <button className="cal-btn" onClick={()=>{if(calM===11){setCalM(0);setCalY(calY+1)}else setCalM(calM+1)}}><i className="bi bi-chevron-right"/></button>
        </div>
        <div className="cal-dh-row">{['L','M','M','J','V','S','D'].map((d,i)=><div key={i} className="cal-dh">{d}</div>)}</div>
        <div className="cal-grid mb14">
          {days.map(({date,cur},i)=>{
            const dt=data.tasks.filter(t=>t.date===date)
            const isT=date===today(),isSel=date===calSel
            return(
              <div key={i} className={`cal-day${isSel?' sel':isT?' today':''}${cur?'':' other'}`} onClick={()=>setCalSel(date)}>
                <div className="cal-dn">{new Date(date+'T12:00').getDate()}</div>
                <div className="cal-dots">{dt.slice(0,3).map((t,j)=><div key={j} className="cal-dot" style={{background:TCOL[t.type]||'#7A6D94'}}/>)}</div>
              </div>
            )
          })}
        </div>
        <div className="card">
          <div className="flex-sb mb12">
            <div className="sy fw8" style={{fontSize:15}}><i className="bi bi-calendar3" style={{color:'var(--p)',marginRight:6}}/>{dlbl(calSel)||"Auj."}</div>
            <button className="btn btn-p btn-sm" onClick={openAddTask}><i className="bi bi-plus"/>Ajouter</button>
          </div>
          {selTasks.length===0?<div className="mu"><i className="bi bi-check-all"/> Rien ce jour</div>
          :selTasks.map(t=>(
            <div key={t.id} className="row-item">
              <i className={`bi ${TICON[t.type]||'bi-check2-square'}`} style={{color:TCOL[t.type]||'var(--mu)'}}/>
              <div className="ri">
                <div className="rt" style={t.statut==='Fait'?{textDecoration:'line-through',opacity:.5}:{}}>{t.titre}</div>
                <div className="rs">{t.client}{t.heure?` · ${t.heure}`:''}</div>
              </div>
              <button onClick={()=>setData(p=>({...p,tasks:p.tasks.map(x=>x.id===t.id?{...x,statut:x.statut==='Fait'?'Todo':'Fait'}:x)}))}
                style={{width:28,height:28,borderRadius:'50%',border:`2px solid ${t.statut==='Fait'?'var(--g)':'var(--dm)'}`,background:t.statut==='Fait'?'var(--g)':'transparent',cursor:'pointer',color:'#fff',fontSize:11,flexShrink:0}}>
                {t.statut==='Fait'&&<i className="bi bi-check"/>}
              </button>
              <button onClick={()=>setData(p=>({...p,tasks:p.tasks.filter(x=>x.id!==t.id)}))} style={{background:'none',border:'none',color:'var(--mu)',cursor:'pointer',fontSize:18,lineHeight:1}}><i className="bi bi-x"/></button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const PreprodList = () => {
    const pct = (p:PreProd) => p.checklist.length?Math.round(p.checklist.filter(c=>c.includes('✅')).length/p.checklist.length*100):0
    const sc: Record<string,string> = {Préparation:'var(--y)',Prêt:'var(--g)','En cours':'var(--pl)',Terminé:'var(--mu)'}
    return(
      <div>
        <div className="flex-sb mb14">
          <div className="sy fw8" style={{fontSize:16}}><i className="bi bi-camera-video-fill" style={{color:'var(--p)',marginRight:6}}/>Tournages</div>
          <button className="btn btn-p btn-sm" onClick={openAddProd}><i className="bi bi-plus"/>Nouveau</button>
        </div>
        {data.prods.length===0?<div className="empty"><span className="empty-ico"><i className="bi bi-camera-video"/></span>Créez votre premier dossier de tournage</div>
        :data.prods.map(p=>(
          <div key={p.id} className="card mb12" style={{cursor:'pointer'}} onClick={()=>openProdDetail(p)}>
            <div className="flex-sb mb8">
              <div className="sy fw8" style={{fontSize:15,flex:1,marginRight:8}}>{p.titre}</div>
              <span className="badge" style={{background:`${sc[p.statut]||'var(--mu)'}18`,color:sc[p.statut]||'var(--mu)',fontSize:10}}>{p.statut}</span>
            </div>
            <div className="flex mb10" style={{gap:10,flexWrap:'wrap'}}>
              {p.client&&<span className="mu2"><i className="bi bi-person"/> {p.client}</span>}
              {p.date&&<span className="mu2"><i className="bi bi-calendar3"/> {p.date}</span>}
              {p.lieu&&<span className="mu2"><i className="bi bi-geo-alt"/> {p.lieu}</span>}
            </div>
            <div className="pbar mb6" style={{height:5}}><div className="pbar-f" style={{width:`${pct(p)}%`,background:'var(--g)'}}/></div>
            <div className="mu2">{pct(p)}% validé · {p.checklist.filter(c=>c.includes('✅')).length}/{p.checklist.length}</div>
          </div>
        ))}
      </div>
    )
  }

  // ════════════════════════════════════════════════════════
  // FINANCE TAB
  // ════════════════════════════════════════════════════════
  const FinanceTab = () => {
    const mg=data.gains.filter(g=>g.mois===finMo)
    const md=data.depenses.filter(d=>d.mois===finMo)
    const moCa=mg.reduce((s,g)=>s+Number(g.montant),0)
    const moDep=md.filter(d=>d.type!=='Investissement').reduce((s,d)=>s+Number(d.montant),0)
    const net=moCa-moDep
    return(
      <div className="page">
        <div className="sec-hd">
          <div className="sy-t">Finance</div>
          <div className="flex" style={{gap:6}}>
            <button className="btn btn-g btn-sm" onClick={openAddGain}><i className="bi bi-plus"/>Gain</button>
            <button className="btn btn-g btn-sm" onClick={openAddDep}><i className="bi bi-dash"/>Dépense</button>
            <button className="btn btn-p btn-sm" onClick={openAddDevis}><i className="bi bi-file-text-fill"/>Devis</button>
          </div>
        </div>
        <div className="chips">
          {MO.map(m=><div key={m} className={`chip${m===finMo?' act':''}`} onClick={()=>setFinMo(m)}>{ML[m]}</div>)}
        </div>
        <div className="stat-grid mb14">
          <div className="stat-card g"><div className="sc-lbl">Revenus</div><div className="sc-val sy" style={{color:'var(--g)',fontSize:18}}>{fmtK(moCa)}<span style={{fontSize:10,color:'var(--mu)',fontFamily:'Outfit,sans-serif'}}> FCFA</span></div></div>
          <div className="stat-card"><div className="sc-lbl">Charges</div><div className="sc-val sy" style={{color:'var(--r)',fontSize:18}}>{fmtK(moDep)}<span style={{fontSize:10,color:'var(--mu)',fontFamily:'Outfit,sans-serif'}}> FCFA</span></div></div>
          <div className={`stat-card ${net>=0?'g':'r'}`}><div className="sc-lbl">Net</div><div className="sc-val sy" style={{color:net>=0?'var(--g)':'var(--r)',fontSize:18}}>{fmtK(net)}<span style={{fontSize:10,color:'var(--mu)',fontFamily:'Outfit,sans-serif'}}> FCFA</span></div></div>
          <div className="stat-card"><div className="sc-lbl">Devis actifs</div><div className="sc-val sy" style={{color:'var(--pl)'}}>{data.devis.filter(d=>d.statut==='Envoyé').length}</div></div>
        </div>
        <div className="chips">
          {([['res','bi-bar-chart-fill','Résultats'],['gains','bi-graph-up-arrow','Gains'],['dep','bi-graph-down-arrow','Dépenses'],['devis','bi-receipt','Devis']] as [string,string,string][]).map(([id,ic,lbl])=>(
            <div key={id} className={`chip${finTab===id?' act':''}`} onClick={()=>setFinTab(id as any)}><i className={`bi ${ic}`}/> {lbl}</div>
          ))}
        </div>
        {finTab==='res'&&<div className="g2">
          <div className="card"><div className="sy fw8 mb12">Gains</div>{mg.length===0?<div className="mu">Aucun gain</div>:mg.map(g=><div key={g.id} className="row-item"><div className="ri"><div className="rt">{g.label}</div><div className="rs">{g.type}</div></div><span style={{color:'var(--g)',fontWeight:700}}>{fmtK(Number(g.montant))}</span></div>)}</div>
          <div className="card"><div className="sy fw8 mb12">Charges</div>{md.length===0?<div className="mu">Aucune</div>:md.map(d=><div key={d.id} className="row-item"><div className="ri"><div className="rt">{d.label}</div><div className="rs">{d.type}</div></div><span style={{color:d.type==='Investissement'?'var(--y)':'var(--r)',fontWeight:700}}>{fmtK(Number(d.montant))}</span></div>)}</div>
        </div>}
        {finTab==='gains'&&<div className="card">{data.gains.length===0?<div className="empty"><span className="empty-ico"><i className="bi bi-cash-coin"/></span>Aucun gain</div>:[...data.gains].sort((a,b)=>b.mois.localeCompare(a.mois)).map(g=><div key={g.id} className="row-item"><div className="ri"><div className="rt">{g.label}</div><div className="rs">{ML[g.mois]||g.mois} · {g.type}</div></div><span style={{color:'var(--g)',fontWeight:700}}>{fmtK(Number(g.montant))} FCFA</span><button onClick={()=>setData(p=>({...p,gains:p.gains.filter(x=>x.id!==g.id)}))} style={{background:'none',border:'none',color:'var(--mu)',cursor:'pointer',fontSize:18}}><i className="bi bi-trash3"/></button></div>)}</div>}
        {finTab==='dep'&&<div className="card">{data.depenses.length===0?<div className="empty"><span className="empty-ico"><i className="bi bi-graph-down"/></span>Aucune dépense</div>:[...data.depenses].sort((a,b)=>b.mois.localeCompare(a.mois)).map(d=><div key={d.id} className="row-item"><div className="ri"><div className="rt">{d.label}</div><div className="rs">{ML[d.mois]||d.mois} · {d.type}</div></div><span style={{color:d.type==='Investissement'?'var(--y)':'var(--r)',fontWeight:700}}>{fmtK(Number(d.montant))} FCFA</span><button onClick={()=>setData(p=>({...p,depenses:p.depenses.filter(x=>x.id!==d.id)}))} style={{background:'none',border:'none',color:'var(--mu)',cursor:'pointer',fontSize:18}}><i className="bi bi-trash3"/></button></div>)}</div>}
        {finTab==='devis'&&<div>{data.devis.length===0?<div className="empty"><span className="empty-ico"><i className="bi bi-receipt"/></span>Aucun devis</div>:data.devis.map(dv=>{const tot=dv.lignes.reduce((s,l)=>s+Number(l.qte)*Number(l.pu),0);return(
          <div key={dv.id} className="card mb10">
            <div className="flex-sb mb8">
              <div><div className="sy fw8" style={{fontSize:15}}>{dv.ref}</div><div className="mu2">{dv.client} · {dv.date}</div></div>
              <span className="badge" style={{background:dv.statut==='Signé'?'rgba(0,217,139,.15)':dv.statut==='Envoyé'?'var(--ps)':'var(--s3)',color:dv.statut==='Signé'?'var(--g)':dv.statut==='Envoyé'?'var(--pl)':'var(--mu)',fontSize:10}}>{dv.statut}</span>
            </div>
            <div className="sy" style={{fontSize:22,fontWeight:900,color:'var(--pl)',marginBottom:12}}>{fmtK(tot)} FCFA</div>
            <div className="flex" style={{gap:8}}>
              <button className="btn btn-p btn-sm" onClick={()=>printDevis(dv)}><i className="bi bi-printer-fill"/>PDF</button>
              <button className="btn btn-d btn-sm" onClick={()=>setData(p=>({...p,devis:p.devis.filter(x=>x.id!==dv.id)}))}><i className="bi bi-trash3"/>Supprimer</button>
            </div>
          </div>
        )})}</div>}
      </div>
    )
  }

  // ════════════════════════════════════════════════════════
  // OUTILS TAB
  // ════════════════════════════════════════════════════════
  const OutilsTab = () => (
    <div className="page">
      <div className="sec-hd"><div className="sy-t">Outils</div></div>
      <div className="chips">
        {([['veille','bi-broadcast','Veille IA'],['guide','bi-book-half','Guide Algo'],['decks','bi-file-earmark-richtext','Decks'],['mot','bi-lightning-fill','Motivation'],['equip','bi-camera-fill','Équip'],['settings','bi-gear-fill','Settings']] as [string,string,string][]).map(([id,ic,lbl])=>(
          <div key={id} className={`chip${outilsSub===id?' act':''}`} onClick={()=>setOutilsSub(id as any)}><i className={`bi ${ic}`}/> {lbl}</div>
        ))}
      </div>
      {outilsSub==='veille'&&<VeilleView/>}
      {outilsSub==='guide'&&<GuideView/>}
      {outilsSub==='decks'&&<DecksView/>}
      {outilsSub==='mot'&&<MotivationView/>}
      {outilsSub==='equip'&&<EquipView/>}
      {outilsSub==='settings'&&<SettingsView/>}
    </div>
  )

  const VeilleView = () => {
    const nets = ['Instagram','TikTok','Facebook','LinkedIn','Réseaux']
    return(
      <div>
        <div className="flex-sb mb14"><div className="sy fw8" style={{fontSize:16}}><i className="bi bi-broadcast" style={{color:'var(--p)',marginRight:6}}/>Veille IA</div><div className="mu2">Powered by Claude</div></div>
        <div className="chips mb14">{nets.map(n=><div key={n} className={`chip${veilleNet===n?' act':''}`} onClick={()=>setVeilleNet(n)}>{n}</div>)}</div>
        <button className="btn btn-p btn-full mb14" disabled={aiLoading} onClick={async()=>{
          setAiLoading(true);setAiResult('')
          const r=await askAI(`Tu es expert social media 2026. Donne-moi les 5 dernières actualités et mises à jour importantes concernant ${veilleNet} pour les créateurs et agences digitales en Afrique de l'Ouest (Sénégal). Format : 📌 **Titre** → explication pratique (2-3 lignes) → Impact pour BaoPixel (agence audiovisuelle Petite-Côte). Concret et actionnable.`)
          setAiResult(r);setAiLoading(false)
        }}>
          {aiLoading?<><span className="spinner" style={{width:18,height:18,borderWidth:2}}/> Analyse...</>:<><i className="bi bi-broadcast-pin"/>Lancer la veille {veilleNet}</>}
        </button>
        {aiLoading&&<div style={{textAlign:'center',padding:'40px 0'}}><div className="spinner" style={{width:36,height:36,margin:'0 auto 14px'}}/><div className="mu">Interrogation de Claude...</div></div>}
        {aiResult&&<div className="card fi"><div className="ai-box">{aiResult}</div></div>}
        {!aiResult&&!aiLoading&&<div style={{textAlign:'center',padding:'40px 20px',color:'var(--mu)',fontSize:13}}><i className="bi bi-broadcast" style={{fontSize:40,display:'block',marginBottom:12,color:'var(--p)'}}/>Sélectionne un réseau et lance l'analyse</div>}
      </div>
    )
  }

  const GuideView = () => {
    const topics = ['Algorithme Instagram 2026','Algorithme TikTok 2026','Meilleures heures post Sénégal','Formats qui performent en AOF','Stratégie Reels vs Carrousels','Engagement Afrique de l\'Ouest','Hashtags efficaces Sénégal']
    const [q, setQ] = useState('')
    const run = async (topic:string) => {
      setAiLoading(true);setAiResult('')
      const r=await askAI(`Explique-moi : "${topic}". Contexte : Norta, fondateur BaoPixel, agence audiovisuelle Mbour Sénégal. Clients : hôtels, restos, immo, spas. Format : 🎯 Principe clé → ✅ À faire → ❌ À éviter → 💡 Astuce BaoPixel → 📊 Métriques. Concret, adapté contexte sénégalais.`)
      setAiResult(r);setAiLoading(false)
    }
    return(
      <div>
        <div className="flex-sb mb14"><div className="sy fw8" style={{fontSize:16}}><i className="bi bi-book-half" style={{color:'var(--p)',marginRight:6}}/>Guide Algorithmes</div><div className="mu2">IA personnalisée</div></div>
        <div className="chips mb14">{topics.map(t=><div key={t} className="chip" onClick={()=>run(t)} style={{fontSize:11}}>{t}</div>)}</div>
        <div className="card mb14">
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Pose ta propre question..." style={{border:'none',background:'transparent',padding:'4px 0',fontSize:14,marginBottom:8}}/>
          <button className="btn btn-g btn-sm" onClick={()=>q&&run(q)}><i className="bi bi-arrow-right"/>Demander</button>
        </div>
        {aiLoading&&<div style={{textAlign:'center',padding:'40px 0'}}><div className="spinner" style={{width:36,height:36,margin:'0 auto 14px'}}/><div className="mu">Analyse en cours...</div></div>}
        {aiResult&&<div className="card fi"><div className="ai-box">{aiResult}</div></div>}
        {!aiResult&&!aiLoading&&<div style={{textAlign:'center',padding:'40px 20px',color:'var(--mu)',fontSize:13}}><i className="bi bi-book" style={{fontSize:40,display:'block',marginBottom:12,color:'var(--p)'}}/>Sélectionne un sujet ou pose ta question</div>}
      </div>
    )
  }

  const DecksView = () => {
    const types = ['Proposition commerciale','Brief créatif client','Rapport mensuel','Onboarding client','Script de vente WhatsApp','Plan de communication 3 mois']
    const [client, setClient] = useState('BaoPixel (interne)')
    const [result, setResult] = useState('')
    const [loading, setLoading] = useState(false)
    const run = async () => {
      setLoading(true);setResult('')
      const c=data.clients.find(x=>x.nom===client)
      const ctx=c?`Client : ${c.nom}, Secteur : ${c.secteur}, Pack : ${c.pack}, Budget : ${c.montant} FCFA/mois.`:''
      const r=await askAI(`Génère un ${deckType} professionnel pour BaoPixel Digital Agency (Mbour, Petite-Côte, Sénégal). ${ctx} Packs : Woyofal 150k, Sama 250k, Autorité 400k. Services : photo, vidéo, drone, identité visuelle, social media. Fondateur : Norta. Document structuré, professionnel, convaincant, en français.`)
      setResult(r);setLoading(false)
    }
    return(
      <div>
        <div className="flex-sb mb14"><div className="sy fw8" style={{fontSize:16}}><i className="bi bi-file-earmark-richtext" style={{color:'var(--p)',marginRight:6}}/>Decks & Docs IA</div></div>
        <div className="chips mb12">{types.map(t=><div key={t} className={`chip${deckType===t?' act':''}`} onClick={()=>setDeckType(t)} style={{fontSize:11}}>{t}</div>)}</div>
        <div className="field mb14"><label>Client</label><select value={client} onChange={e=>setClient(e.target.value)}><option>BaoPixel (interne)</option>{data.clients.map(c=><option key={c.id}>{c.nom}</option>)}</select></div>
        <button className="btn btn-p btn-full mb14" onClick={run} disabled={loading}>
          {loading?<><span className="spinner" style={{width:18,height:18,borderWidth:2}}/> Génération...</>:<><i className="bi bi-robot"/>Générer le document</>}
        </button>
        {loading&&<div style={{textAlign:'center',padding:'40px 0'}}><div className="spinner" style={{width:36,height:36,margin:'0 auto 14px'}}/><div className="mu">Génération en cours...</div></div>}
        {result&&<div className="card fi">
          <div className="flex-sb mb14">
            <div className="sy fw8" style={{fontSize:15}}>{deckType}</div>
            <div className="flex" style={{gap:8}}>
              <button className="btn btn-g btn-sm" onClick={()=>navigator.clipboard.writeText(result).then(()=>showToast('Copié !','success'))}><i className="bi bi-clipboard"/>Copier</button>
              <button className="btn btn-p btn-sm" onClick={()=>{const w=window.open('','_blank');if(w){w.document.write(`<!DOCTYPE html><html><head><title>${deckType}</title><meta charset="UTF-8"><style>body{font-family:'Segoe UI',sans-serif;margin:40px;line-height:1.8;color:#111}h1{color:#7B2FF7}hr{border:none;border-top:1px solid #eee;margin:20px 0}</style></head><body><h1>${deckType}</h1><p>${client!=='BaoPixel (interne)'?`Client : ${client}`:''}</p><hr><div style="white-space:pre-wrap">${result}</div></body></html>`);w.document.close();setTimeout(()=>w.print(),500)}}}><i className="bi bi-printer-fill"/>Imprimer</button>
            </div>
          </div>
          <div className="ai-box">{result}</div>
        </div>}
      </div>
    )
  }

  const MotivationView = () => {
    const m = data.motivation
    const now = new Date()
    const q = m.quotes[now.getDay()%m.quotes.length]
    const [boostLoading, setBoostLoading] = useState(false)
    const runBoost = async() => {
      setBoostLoading(true)
      const r=await askAI('Je suis Norta, fondateur de BaoPixel, agence digitale à Mbour au Sénégal. Donne-moi une phrase de motivation ultra-puissante et personnalisée pour aujourd\'hui. Sois inspirant, direct, ancré dans la réalité terrain africaine. Max 3 phrases très percutantes.')
      setBoostText(r);setBoostLoading(false)
    }
    return(
      <div>
        <div className="card mb14" style={{background:'linear-gradient(135deg,var(--ps2),var(--ps))',borderColor:'rgba(123,47,247,.3)'}}>
          <div className="mu2 mb10" style={{textTransform:'uppercase',letterSpacing:'.07em'}}><i className="bi bi-chat-quote-fill" style={{marginRight:6}}/>Citation du jour</div>
          <div className="sy" style={{fontSize:17,fontWeight:800,lineHeight:1.5,fontStyle:'italic',marginBottom:16}}>"{q}"</div>
          <div className="flex" style={{gap:12}}>
            <div style={{width:44,height:44,borderRadius:'50%',background:'linear-gradient(135deg,var(--p),var(--o))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>🔥</div>
            <div><div className="sy" style={{fontSize:24,fontWeight:900,color:'var(--o)'}}>{m.streak} jour{m.streak!==1?'s':''}</div><div className="mu2">Série active</div></div>
          </div>
        </div>
        <div className="card mb14">
          <div className="flex-sb mb12"><div className="sy fw8" style={{fontSize:15}}><i className="bi bi-robot" style={{color:'var(--p)',marginRight:6}}/>Boost IA</div></div>
          {boostText?<div style={{fontSize:15,lineHeight:1.7,fontStyle:'italic',marginBottom:16}}>{boostText}</div>:<div className="mu mb16">L'IA génère une phrase de motivation personnalisée pour aujourd'hui.</div>}
          <button className="btn btn-p btn-full" onClick={runBoost} disabled={boostLoading}>
            {boostLoading?<><span className="spinner" style={{width:18,height:18,borderWidth:2}}/> Chargement...</>:<><i className="bi bi-lightning-charge-fill"/>Booster ma journée</>}
          </button>
        </div>
        <div className="card mb14">
          <div className="sy fw8 mb12" style={{fontSize:15}}><i className="bi bi-trophy-fill" style={{color:'var(--y)',marginRight:6}}/>Objectifs</div>
          {m.objectifs.map((o,i)=>(
            <div key={i} className="surf2 mb8 flex" style={{gap:12,borderLeft:'3px solid var(--p)'}}>
              <span className="sy" style={{fontWeight:900,color:'var(--p)',fontSize:14,flexShrink:0}}>0{i+1}</span>
              <span style={{flex:1,fontWeight:600}}>{o}</span>
              <button onClick={()=>setData(p=>({...p,motivation:{...p.motivation,objectifs:p.motivation.objectifs.filter((_,j)=>j!==i)}}))} style={{background:'none',border:'none',color:'var(--mu)',cursor:'pointer',fontSize:18,lineHeight:1}}><i className="bi bi-x"/></button>
            </div>
          ))}
          <button className="btn btn-g btn-sm mt10" onClick={()=>{const v=prompt('Nouvel objectif :');if(v)setData(p=>({...p,motivation:{...p.motivation,objectifs:[...p.motivation.objectifs,v]}}))}}>
            <i className="bi bi-plus"/>Ajouter objectif
          </button>
        </div>
        <div className="card">
          <div className="sy fw8 mb12" style={{fontSize:15}}><i className="bi bi-stars" style={{color:'var(--y)',marginRight:6}}/>Affirmations</div>
          {m.affirmations.map((a,i)=>(
            <div key={i} className="surf2 mb8" style={{borderLeft:`3px solid ${['var(--p)','var(--o)','var(--g)'][i%3]}`}}>
              <div className="flex-sb"><span style={{fontWeight:600,fontSize:13}}>{a}</span>
              <button onClick={()=>setData(p=>({...p,motivation:{...p.motivation,affirmations:p.motivation.affirmations.filter((_,j)=>j!==i)}}))} style={{background:'none',border:'none',color:'var(--mu)',cursor:'pointer',fontSize:18,lineHeight:1}}><i className="bi bi-x"/></button></div>
            </div>
          ))}
          <button className="btn btn-g btn-sm mt10" onClick={()=>{const v=prompt('Nouvelle affirmation :');if(v)setData(p=>({...p,motivation:{...p.motivation,affirmations:[...p.motivation.affirmations,v]}}))}}>
            <i className="bi bi-plus"/>Ajouter affirmation
          </button>
        </div>
      </div>
    )
  }

  const EquipView = () => {
    const tot=data.equip.reduce((s,e)=>s+Number(e.valeur),0)
    const eIco: Record<string,string>={Caméra:'bi-camera-fill',Drone:'bi-wind',Stabilisateur:'bi-camera-video-fill','Post-production':'bi-laptop-fill',Mobilité:'bi-display',Objectif:'bi-circle',Éclairage:'bi-lightbulb-fill',Audio:'bi-mic-fill',Accessoire:'bi-tools'}
    const esc2: Record<string,string>={Disponible:'var(--g)','À acquérir':'var(--o)',Planifié:'var(--y)','En réparation':'var(--r)',Loué:'var(--b)'}
    return(
      <div>
        <div className="flex-sb mb14">
          <div className="sy fw8" style={{fontSize:16}}><i className="bi bi-camera-fill" style={{color:'var(--p)',marginRight:6}}/>Équipement</div>
          <div><div className="mu2">Valeur totale</div><div className="sy fw8" style={{color:'var(--pl)'}}>{fmtK(tot)} FCFA</div></div>
        </div>
        {data.equip.map(e=>(
          <div key={e.id} className="card mb10 flex" style={{gap:12}}>
            <div style={{width:44,height:44,borderRadius:'var(--r12)',background:'var(--ps)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>
              <i className={`bi ${eIco[e.cat]||'bi-tools'}`} style={{color:'var(--pl)'}}/>
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:2}}>{e.nom}</div>
              <div className="mu2 mb6">{e.cat} · {e.usage}</div>
              <div className="flex" style={{gap:8}}>
                <span className="badge" style={{background:`${esc2[e.statut]||'var(--mu)'}18`,color:esc2[e.statut]||'var(--mu)',fontSize:10}}>{e.statut}</span>
                <span style={{color:'var(--y)',fontWeight:700,fontSize:12}}>{fmtK(Number(e.valeur))} FCFA</span>
              </div>
            </div>
            <button onClick={()=>setData(p=>({...p,equip:p.equip.filter(x=>x.id!==e.id)}))} style={{background:'none',border:'none',color:'var(--mu)',cursor:'pointer',fontSize:18,alignSelf:'flex-start'}}><i className="bi bi-x"/></button>
          </div>
        ))}
        <button className="btn btn-p btn-full mt12" onClick={openAddEquip}><i className="bi bi-plus-circle-fill"/>Ajouter équipement</button>
      </div>
    )
  }

  const SettingsView = () => {
    const [apiKey, setApiKey] = useState(() => DB.get('bp_apikey','') as string)
    const [notionTok, setNotionTok] = useState(() => DB.get('bp_notion_token','') as string)
    const [goalVal, setGoalVal] = useState(String(data.goal))
    return(
      <div>
        <div className="sy fw8 mb14" style={{fontSize:16}}><i className="bi bi-gear-fill" style={{color:'var(--p)',marginRight:6}}/>Paramètres</div>
        <div className="card mb12">
          <div className="sy fw8 mb8" style={{fontSize:14}}><i className="bi bi-key-fill" style={{color:'var(--y)',marginRight:6}}/>Clé API Claude</div>
          <div className="mu mb12" style={{lineHeight:1.6,fontSize:12}}>Pour Veille IA, Guide Algo, Decks & Boost IA. Stockée localement dans le navigateur.</div>
          <Fld label="Clé API Anthropic" value={apiKey} onChange={setApiKey} type="password" placeholder="sk-ant-..."/>
          <button className="btn btn-p btn-full" onClick={()=>{DB.set('bp_apikey',apiKey);showToast('✅ Clé API sauvegardée !','success')}}><i className="bi bi-save-fill"/>Sauvegarder</button>
          <div className="mu2 mt8">Obtenez votre clé sur <a href="https://console.anthropic.com" target="_blank" style={{color:'var(--pl)'}}>console.anthropic.com</a></div>
        </div>
        <div className="card mb12">
          <div className="sy fw8 mb8" style={{fontSize:14}}><i className="bi bi-box-arrow-in-down" style={{color:'var(--b)',marginRight:6}}/>Token Notion</div>
          <div className="mu mb12" style={{lineHeight:1.6,fontSize:12}}>Token d'intégration pour synchroniser vos calendriers éditoriaux. <a href="https://www.notion.so/my-integrations" target="_blank" style={{color:'var(--pl)'}}>Créer une intégration →</a><br/>N'oubliez pas de <strong>partager vos bases</strong> avec l'intégration dans Notion.</div>
          <Fld label="Notion Integration Token" value={notionTok} onChange={setNotionTok} type="password" placeholder="secret_..."/>
          <button className="btn btn-p btn-full mb8" onClick={()=>{DB.set('bp_notion_token',notionTok);showToast('✅ Token Notion sauvegardé !','success')}}><i className="bi bi-save-fill"/>Sauvegarder token</button>
          <button className="btn btn-g btn-full" onClick={()=>syncNotion()}><i className={`bi bi-arrow-clockwise ${syncing?'spin':''}`}/>{syncing?' Synchronisation...':' Synchroniser maintenant'}</button>
          {lastSync&&<div className="mu2 mt8"><i className="bi bi-check-circle-fill" style={{color:'var(--g)',marginRight:4}}/>Dernière sync : {lastSync}</div>}
        </div>
        <div className="card mb12">
          <div className="sy fw8 mb8" style={{fontSize:14}}><i className="bi bi-bell-fill" style={{color:'var(--o)',marginRight:6}}/>Notifications Push</div>
          <div className="mu mb12" style={{lineHeight:1.6,fontSize:12}}>Sur iPhone Safari : ajoutez l'app à l'écran d'accueil (Partager → Sur l'écran d'accueil) pour activer les notifications push.</div>
          <button className="btn btn-p btn-full mb8" onClick={()=>requestNotifPermission()}><i className="bi bi-bell-fill"/>Activer les notifications</button>
          <button className="btn btn-g btn-full" onClick={()=>{if(Notification.permission==='granted'){new Notification('🎬 BaoPixel Studio OS',{body:'Notifications actives — tout fonctionne !'})}}}><i className="bi bi-bell-slash"/>Tester notification</button>
        </div>
        <div className="card mb12">
          <div className="sy fw8 mb8" style={{fontSize:14}}><i className="bi bi-graph-up-arrow" style={{color:'var(--g)',marginRight:6}}/>Objectif CA mensuel</div>
          <Fld label="Objectif (FCFA)" value={goalVal} onChange={setGoalVal} type="number"/>
          <button className="btn btn-p btn-full" onClick={()=>{const v=Number(goalVal);if(v>0){setData(p=>({...p,goal:v}));showToast('✅ Objectif mis à jour','success')}}}><i className="bi bi-save-fill"/>Sauvegarder</button>
        </div>
        <div className="card">
          <div className="sy fw8 mb12" style={{fontSize:14}}><i className="bi bi-database-fill" style={{color:'var(--mu)',marginRight:6}}/>Données locales</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <button className="btn btn-g btn-full" onClick={()=>{const a=document.createElement('a');a.href='data:application/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(data,null,2));a.download=`baopixel-backup-${today()}.json`;a.click();showToast('📤 Export téléchargé','success')}}><i className="bi bi-download"/>Exporter JSON</button>
            <button className="btn btn-g btn-full" onClick={()=>{const input=document.createElement('input');input.type='file';input.accept='.json';input.onchange=(e:Event)=>{const f=(e.target as HTMLInputElement).files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>{try{const d=JSON.parse(ev.target?.result as string);setDataRaw(d);DB.set('bp4_data',d);showToast('✅ Données importées !','success')}catch{showToast('❌ Fichier invalide','error')}};r.readAsText(f)};input.click()}}><i className="bi bi-upload"/>Importer JSON</button>
            <button className="btn btn-d btn-full" onClick={()=>{if(confirm('⚠️ Réinitialiser TOUTES les données ?')){setDataRaw(DEF_DATA);DB.set('bp4_data',DEF_DATA);showToast('Données réinitialisées','info')}}}>⚠️ Réinitialiser tout</button>
            <button className="btn btn-d btn-full" onClick={()=>{if(confirm('Réinitialiser le PIN ?')){DB.set('bp4_pin',null);setLocked(true);setPinBuf('');setPinFirst('');setPinMsg('')}}}><i className="bi bi-key"/>Réinitialiser PIN</button>
          </div>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════
  // MODAL OPENERS
  // ════════════════════════════════════════════════════════
  const openAddTask = () => {
    let form = {titre:'',type:'Tâche',prio:'Normal',date:calSel,heure:'',client:'',notes:''}
    const M = () => {
      const [f,setF] = useState(form)
      return <Mbox title="Nouvelle tâche"><>
        <Fld label="Titre" value={f.titre} onChange={v=>setF({...f,titre:v})} placeholder="Ex: Relance WhatsApp So Suite"/>
        <div className="form-2col"><Fld label="Type" value={f.type} onChange={v=>setF({...f,type:v})} opts={['Tâche','RDV','Tournage','Livraison']}/><Fld label="Priorité" value={f.prio} onChange={v=>setF({...f,prio:v})} opts={['Normal','Urgent']}/></div>
        <div className="form-2col"><Fld label="Date" value={f.date} onChange={v=>setF({...f,date:v})} type="date"/><Fld label="Heure" value={f.heure} onChange={v=>setF({...f,heure:v})} type="time"/></div>
        <Fld label="Client" value={f.client} onChange={v=>setF({...f,client:v})} placeholder="Nom du client"/>
        <Acts><button className="btn btn-g btn-sm" onClick={closeModal}>Annuler</button><button className="btn btn-p btn-sm" onClick={()=>{if(!f.titre)return;setData(p=>({...p,tasks:[...p.tasks,{...f,id:uid(),statut:'Todo'}]}));closeModal()}}>Ajouter</button></Acts>
      </></Mbox>
    }
    setModal(<M/>)
  }

  const openAddContent = () => {
    const M = () => {
      const [f,setF]=useState({titre:'',pilier:'Montrer',format:'Reel 30s',plateforme:'Instagram',sem:'S1'})
      return <Mbox title="Nouveau contenu"><>
        <Fld label="Titre / Concept" value={f.titre} onChange={v=>setF({...f,titre:v})} placeholder="Ex: 3 erreurs photo des agences immo"/>
        <div className="form-2col"><Fld label="Pilier" value={f.pilier} onChange={v=>setF({...f,pilier:v})} opts={Object.keys(PCOL)}/><Fld label="Format" value={f.format} onChange={v=>setF({...f,format:v})} opts={['Reel 30s','Reel 60s','Carrousel','Photo','Story','TikTok 15s','TikTok 60s','YouTube Short']}/></div>
        <div className="form-2col"><Fld label="Plateforme" value={f.plateforme} onChange={v=>setF({...f,plateforme:v})} opts={['Instagram','TikTok','Facebook','IG+FB','LinkedIn','YouTube']}/><Fld label="Semaine" value={f.sem} onChange={v=>setF({...f,sem:v})} opts={['S1','S2','S3','S4','S5']}/></div>
        <Acts><button className="btn btn-g btn-sm" onClick={closeModal}>Annuler</button><button className="btn btn-p btn-sm" onClick={()=>{if(!f.titre)return;setData(p=>({...p,editorial:[...p.editorial,{...f,id:uid(),statut:'À créer'}]}));closeModal()}}>Ajouter</button></Acts>
      </></Mbox>
    }
    setModal(<M/>)
  }

  const openAddIdea = () => {
    const M = () => {
      const [f,setF]=useState({titre:'',desc:'',pilier:'Montrer',plateforme:'Instagram'})
      return <Mbox title="💡 Capturer une idée"><>
        <Fld label="Titre" value={f.titre} onChange={v=>setF({...f,titre:v})} placeholder="Ex: Journée type agence à Mbour"/>
        <Fld label="Description" value={f.desc} onChange={v=>setF({...f,desc:v})} rows={3} placeholder="Angle, contexte, message..."/>
        <div className="form-2col"><Fld label="Pilier" value={f.pilier} onChange={v=>setF({...f,pilier:v})} opts={Object.keys(PCOL)}/><Fld label="Plateforme" value={f.plateforme} onChange={v=>setF({...f,plateforme:v})} opts={['Instagram','TikTok','Facebook','LinkedIn','YouTube']}/></div>
        <Acts><button className="btn btn-g btn-sm" onClick={closeModal}>Annuler</button><button className="btn btn-p btn-sm" onClick={()=>{if(!f.titre)return;setData(p=>({...p,ideas:[...p.ideas,{...f,id:uid(),date:today()}]}));closeModal()}}>Capturer</button></Acts>
      </></Mbox>
    }
    setModal(<M/>)
  }

  const openAddClient = () => {
    const M = () => {
      const [f,setF]=useState({nom:'',secteur:'Immobilier',pack:'Pack Woyofal',stage:'Prospect Froid',montant:0,contact:'',notes:''})
      return <Mbox title="Nouveau prospect"><>
        <Fld label="Nom / Entreprise" value={f.nom} onChange={v=>setF({...f,nom:v})} placeholder="Ex: So Suite Hôtel"/>
        <div className="form-2col"><Fld label="Secteur" value={f.secteur} onChange={v=>setF({...f,secteur:v})} opts={['Immobilier','Restauration','Bien-être','Hospitalité','BTP','Mode','Autre']}/><Fld label="Pack" value={f.pack} onChange={v=>setF({...f,pack:v})} opts={['Pack Woyofal','Pack Sama','Pack Autorité','Sur mesure']}/></div>
        <Fld label="Étape Pipeline" value={f.stage} onChange={v=>setF({...f,stage:v})} opts={STAGES}/>
        <Fld label="Montant mensuel (FCFA)" value={String(f.montant)} onChange={v=>setF({...f,montant:Number(v)})} type="number"/>
        <Fld label="Contact WhatsApp" value={f.contact} onChange={v=>setF({...f,contact:v})} placeholder="+221 77..."/>
        <Fld label="Notes" value={f.notes} onChange={v=>setF({...f,notes:v})} rows={2}/>
        <Acts><button className="btn btn-g btn-sm" onClick={closeModal}>Annuler</button><button className="btn btn-p btn-sm" onClick={()=>{if(!f.nom)return;setData(p=>({...p,clients:[...p.clients,{...f,id:uid()}]}));closeModal()}}>Ajouter</button></Acts>
      </></Mbox>
    }
    setModal(<M/>)
  }

  const openEditClient = (c: Client) => {
    const M = () => {
      const [f,setF]=useState(c)
      return <Mbox title="Modifier prospect"><>
        <Fld label="Nom / Entreprise" value={f.nom} onChange={v=>setF({...f,nom:v})}/>
        <div className="form-2col"><Fld label="Secteur" value={f.secteur} onChange={v=>setF({...f,secteur:v})} opts={['Immobilier','Restauration','Bien-être','Hospitalité','BTP','Mode','Autre']}/><Fld label="Pack" value={f.pack} onChange={v=>setF({...f,pack:v})} opts={['Pack Woyofal','Pack Sama','Pack Autorité','Sur mesure']}/></div>
        <Fld label="Étape Pipeline" value={f.stage} onChange={v=>setF({...f,stage:v})} opts={STAGES}/>
        <Fld label="Montant mensuel (FCFA)" value={String(f.montant)} onChange={v=>setF({...f,montant:Number(v)})} type="number"/>
        <Fld label="Contact WhatsApp" value={f.contact} onChange={v=>setF({...f,contact:v})}/>
        <Fld label="Notes" value={f.notes} onChange={v=>setF({...f,notes:v})} rows={2}/>
        <Acts>
          <button className="btn btn-d btn-sm" onClick={()=>{setData(p=>({...p,clients:p.clients.filter(x=>x.id!==c.id)}));closeModal()}}><i className="bi bi-trash3"/>Supprimer</button>
          <button className="btn btn-g btn-sm" onClick={closeModal}>Annuler</button>
          <button className="btn btn-p btn-sm" onClick={()=>{setData(p=>({...p,clients:p.clients.map(x=>x.id===c.id?f:x)}));closeModal()}}>Enregistrer</button>
        </Acts>
      </></Mbox>
    }
    setModal(<M/>)
  }

  const openWaScript = (c: Client) => {
    const scripts: Record<string,string> = {
      'Prospect Froid':`Bonjour ${c.nom} 👋\n\nJe suis Norta de BaoPixel Digital Agency (Mbour). Nous aidons les entreprises de la Petite-Côte à dominer leur présence visuelle — photo, vidéo, drone, réseaux.\n\nVous seriez intéressé par un appel de 15min cette semaine ?`,
      'RDV Fixé':`Bonjour ${c.nom},\n\nJe confirme notre rendez-vous. Je prépare une proposition personnalisée pour ${c.secteur}.\n\nÀ très bientôt ✨`,
      'Devis Envoyé':`Bonjour ${c.nom},\n\nJ'espère que vous avez bien reçu notre devis. Des questions ?\n\nCordialement, Norta — BaoPixel`,
    }
    const script = scripts[c.stage] || scripts['Prospect Froid']
    const M = () => <Mbox title={`Script WhatsApp — ${c.nom}`}><>
      <div style={{background:'var(--s1)',borderRadius:'var(--r12)',padding:14,fontSize:13,lineHeight:1.75,whiteSpace:'pre-wrap',border:'1px solid var(--bd)',marginBottom:14}}>{script}</div>
      <div style={{display:'flex',gap:8}}>
        {c.contact&&<a href={`https://wa.me/${c.contact.replace(/\D/g,'')}?text=${encodeURIComponent(script)}`} target="_blank" style={{flex:1}}><button className="btn btn-o btn-full"><i className="bi bi-whatsapp"/>Ouvrir WhatsApp</button></a>}
        <button className="btn btn-g" onClick={()=>navigator.clipboard.writeText(script).then(()=>showToast('Copié !','success'))}><i className="bi bi-clipboard"/></button>
      </div>
    </></Mbox>
    setModal(<M/>)
  }

  const DEFCHK = ['Batteries chargées (iPhone + DJI Mini 3)','Cartes SD formatées','Drone calibré + test vol','Stabilisateur Osmo chargé','Contrat signé + devis validé','Heure RDV confirmée','Lieu repéré (lumière + accès)','Tenue professionnelle','Briefing angles avec client','Disque dur backup']

  const openAddProd = () => {
    const M = () => {
      const [f,setF]=useState({titre:'',client:'',date:'',lieu:'',notes:'',equipe:''})
      return <Mbox title="Nouveau dossier de tournage"><>
        <Fld label="Titre du tournage" value={f.titre} onChange={v=>setF({...f,titre:v})} placeholder="Ex: Shooting Detmine — Résidence Saly"/>
        <div className="form-2col"><Fld label="Client" value={f.client} onChange={v=>setF({...f,client:v})}/><Fld label="Date" value={f.date} onChange={v=>setF({...f,date:v})} type="date"/></div>
        <Fld label="Lieu" value={f.lieu} onChange={v=>setF({...f,lieu:v})} placeholder="Ex: Saly Portudal"/>
        <Fld label="Équipe (virgule)" value={f.equipe} onChange={v=>setF({...f,equipe:v})} placeholder="Norta, DJI Mini 3..."/>
        <Fld label="Notes" value={f.notes} onChange={v=>setF({...f,notes:v})} rows={2}/>
        <div className="mu2 mb14"><i className="bi bi-check-all" style={{color:'var(--g)',marginRight:4}}/>{DEFCHK.length} points checklist ajoutés automatiquement</div>
        <Acts><button className="btn btn-g btn-sm" onClick={closeModal}>Annuler</button><button className="btn btn-p btn-sm" onClick={()=>{if(!f.titre)return;setData(p=>({...p,prods:[...p.prods,{id:uid(),titre:f.titre,client:f.client,date:f.date,lieu:f.lieu,statut:'Préparation',notes:f.notes,equipe:f.equipe.split(',').map(e=>e.trim()).filter(Boolean),checklist:[...DEFCHK]}]}));closeModal()}}>Créer le dossier</button></Acts>
      </></Mbox>
    }
    setModal(<M/>)
  }

  const openProdDetail = (p: PreProd) => {
    const pct = (pr:PreProd) => pr.checklist.length?Math.round(pr.checklist.filter(c=>c.includes('✅')).length/pr.checklist.length*100):0
    const brief = `🎬 *Briefing Tournage — ${p.titre}*\n📍 ${p.lieu||'—'}\n📅 ${p.date||'—'}\n👥 ${p.equipe.join(', ')||'—'}\n\n✅ Checklist : ${pct(p)}% validée\n\nÀ demain ! 💪`
    const M = () => {
      const [prod,setProd]=useState(p)
      const toggle = (idx:number) => {
        const chk=[...prod.checklist];const done=chk[idx].includes('✅')
        chk[idx]=done?chk[idx].replace('✅',''):chk[idx]+'✅'
        const next={...prod,checklist:chk};setProd(next)
        setData(prev=>({...prev,prods:prev.prods.map(x=>x.id===prod.id?next:x)}))
      }
      return <Mbox title={`🎬 ${prod.titre}`}><>
        <div className="g2 mb14">
          {[['Client',prod.client],['Date',prod.date],['Lieu',prod.lieu],['Équipe',prod.equipe.join(', ')||'—']].map(([l,v])=>(
            <div key={l} className="surf2"><div className="mu2">{l}</div><div style={{fontWeight:600,fontSize:13,marginTop:3}}>{String(v)||'—'}</div></div>
          ))}
        </div>
        <div className="flex-sb mb8"><div className="mu2" style={{textTransform:'uppercase',letterSpacing:'.06em'}}>Checklist</div><span style={{fontWeight:700,color:'var(--g)'}}>{pct(prod)}%</span></div>
        <div className="pbar mb14" style={{height:5}}><div className="pbar-f" style={{width:`${pct(prod)}%`,background:'var(--g)'}}/></div>
        {prod.checklist.map((item,i)=>{const done=item.includes('✅');const clean=item.replace('✅','')
          return<div key={i} className={`chk${done?' done':''}`} onClick={()=>toggle(i)}>
            <div className="chk-ring"><i className="bi bi-check" style={{fontSize:11}}/></div>
            <span className="chk-lbl">{clean}</span>
          </div>
        })}
        <div className="divider"/>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-o" style={{flex:1}} onClick={()=>navigator.clipboard.writeText(brief).then(()=>showToast('Brief copié !','success'))}><i className="bi bi-whatsapp"/>Brief WhatsApp</button>
          <button className="btn btn-d btn-sm" onClick={()=>{setData(prev=>({...prev,prods:prev.prods.filter(x=>x.id!==prod.id)}));closeModal()}}><i className="bi bi-trash3"/></button>
        </div>
      </></Mbox>
    }
    setModal(<M/>)
  }

  const openAddGain = () => {
    const M = () => {
      const [f,setF]=useState({label:'',type:'Récurrent client',montant:'0',mois:curMo()})
      return <Mbox title="Nouveau gain"><>
        <Fld label="Libellé" value={f.label} onChange={v=>setF({...f,label:v})} placeholder="Ex: Detmine Immo — Avr 2026"/>
        <div className="form-2col"><Fld label="Type" value={f.type} onChange={v=>setF({...f,type:v})} opts={['Récurrent client','Tournage ponctuel','Devis encaissé','Autre gain']}/><Fld label="Montant (FCFA)" value={f.montant} onChange={v=>setF({...f,montant:v})} type="number"/></div>
        <Fld label="Mois" value={f.mois} onChange={v=>setF({...f,mois:v})} opts={MO}/>
        <Acts><button className="btn btn-g btn-sm" onClick={closeModal}>Annuler</button><button className="btn btn-p btn-sm" onClick={()=>{if(!f.label)return;setData(p=>({...p,gains:[...p.gains,{id:uid(),label:f.label,type:f.type,montant:Number(f.montant),mois:f.mois,date:today(),notes:''}]}));closeModal()}}>Ajouter</button></Acts>
      </></Mbox>
    }
    setModal(<M/>)
  }

  const openAddDep = () => {
    const M = () => {
      const [f,setF]=useState({label:'',type:'Charge fixe',montant:'0',mois:curMo()})
      return <Mbox title="Nouvelle dépense"><>
        <Fld label="Libellé" value={f.label} onChange={v=>setF({...f,label:v})} placeholder="Ex: Déplacements terrain"/>
        <div className="form-2col"><Fld label="Type" value={f.type} onChange={v=>setF({...f,type:v})} opts={['Charge fixe','Charge variable','Investissement','Autre']}/><Fld label="Montant (FCFA)" value={f.montant} onChange={v=>setF({...f,montant:v})} type="number"/></div>
        <Fld label="Mois" value={f.mois} onChange={v=>setF({...f,mois:v})} opts={MO}/>
        <Acts><button className="btn btn-g btn-sm" onClick={closeModal}>Annuler</button><button className="btn btn-p btn-sm" onClick={()=>{if(!f.label)return;setData(p=>({...p,depenses:[...p.depenses,{id:uid(),label:f.label,type:f.type,montant:Number(f.montant),mois:f.mois,date:today(),notes:''}]}));closeModal()}}>Ajouter</button></Acts>
      </></Mbox>
    }
    setModal(<M/>)
  }

  const openAddDevis = () => {
    const M = () => {
      const [lignes,setLignes]=useState([{desc:'',qte:1,pu:0}])
      const [f,setF]=useState({client:'',ref:'DEV-2026-'+Date.now().toString().slice(-4),notes:''})
      const tot=lignes.reduce((s,l)=>s+l.qte*l.pu,0)
      return <Mbox title="Générer un devis"><>
        <div className="form-2col"><Fld label="Client" value={f.client} onChange={v=>setF({...f,client:v})} placeholder="Nom du client"/><Fld label="Référence" value={f.ref} onChange={v=>setF({...f,ref:v})}/></div>
        <Fld label="Notes / Objet" value={f.notes} onChange={v=>setF({...f,notes:v})} rows={2}/>
        <div style={{fontSize:10,fontWeight:700,color:'var(--mu)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:8}}>Lignes</div>
        {lignes.map((l,i)=>(
          <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 60px 90px 32px',gap:6,marginBottom:8}}>
            <input placeholder="Description" value={l.desc} onChange={e=>{const nl=[...lignes];nl[i]={...nl[i],desc:e.target.value};setLignes(nl)}}/>
            <input type="number" value={l.qte} onChange={e=>{const nl=[...lignes];nl[i]={...nl[i],qte:+e.target.value};setLignes(nl)}}/>
            <input type="number" value={l.pu} onChange={e=>{const nl=[...lignes];nl[i]={...nl[i],pu:+e.target.value};setLignes(nl)}}/>
            <button onClick={()=>setLignes(lignes.filter((_,j)=>j!==i))} style={{background:'var(--rs)',border:'none',color:'var(--r)',borderRadius:8,cursor:'pointer',fontSize:16}}><i className="bi bi-x"/></button>
          </div>
        ))}
        <button className="btn btn-g btn-sm mb12" onClick={()=>setLignes([...lignes,{desc:'',qte:1,pu:0}])}><i className="bi bi-plus"/>Ligne</button>
        <div className="sy" style={{fontSize:22,fontWeight:900,color:'var(--pl)',textAlign:'right',marginBottom:12}}>TOTAL : {fmtK(tot)} FCFA</div>
        <Acts><button className="btn btn-g btn-sm" onClick={closeModal}>Annuler</button><button className="btn btn-p btn-sm" onClick={()=>{if(!f.client)return;const dv:Devis={id:uid(),ref:f.ref,client:f.client,date:today(),validite:'30 jours',lignes,statut:'Brouillon',notes:f.notes};setData(p=>({...p,devis:[...p.devis,dv]}));closeModal()}}>Créer le devis</button></Acts>
      </></Mbox>
    }
    setModal(<M/>)
  }

  const openAddEquip = () => {
    const M = () => {
      const [f,setF]=useState({nom:'',cat:'Caméra',statut:'Disponible',valeur:'0',usage:''})
      return <Mbox title="Ajouter équipement"><>
        <Fld label="Nom de l'équipement" value={f.nom} onChange={v=>setF({...f,nom:v})} placeholder="Ex: Sony A7IV"/>
        <div className="form-2col"><Fld label="Catégorie" value={f.cat} onChange={v=>setF({...f,cat:v})} opts={['Caméra','Drone','Stabilisateur','Objectif','Éclairage','Audio','Post-production','Mobilité','Accessoire']}/><Fld label="Statut" value={f.statut} onChange={v=>setF({...f,statut:v})} opts={['Disponible','À acquérir','Planifié','En réparation','Loué']}/></div>
        <Fld label="Valeur (FCFA)" value={f.valeur} onChange={v=>setF({...f,valeur:v})} type="number"/>
        <Fld label="Usage / Description" value={f.usage} onChange={v=>setF({...f,usage:v})} placeholder="Ex: Tournage 4K, ProRAW"/>
        <Acts><button className="btn btn-g btn-sm" onClick={closeModal}>Annuler</button><button className="btn btn-p btn-sm" onClick={()=>{if(!f.nom)return;setData(p=>({...p,equip:[...p.equip,{id:uid(),nom:f.nom,cat:f.cat,statut:f.statut,valeur:Number(f.valeur),usage:f.usage}]}));closeModal()}}>Ajouter</button></Acts>
      </></Mbox>
    }
    setModal(<M/>)
  }

  // ════════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ════════════════════════════════════════════════════════
  const requestNotifPermission = async () => {
    if (!('Notification' in window)) { showToast('Notifications non supportées','error'); return false }
    if (Notification.permission === 'granted') { showToast('✅ Notifications déjà actives','success'); return true }
    const p = await Notification.requestPermission()
    if (p === 'granted') { showToast('✅ Notifications activées !','success'); return true }
    showToast('Activez les notifications dans les réglages','error'); return false
  }

  // ════════════════════════════════════════════════════════
  // FAB ACTIONS
  // ════════════════════════════════════════════════════════
  const fabAction = () => {
    const actions: Record<Tab,()=>void> = {
      home: openAddTask, contenu: openAddContent, clients: openAddClient,
      finance: openAddGain, outils: ()=>{},
    }
    actions[tab]?.()
  }

  // ════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════
  const NAV_ITEMS = [
    {id:'home',    ic:'bi-house-fill',     lbl:'Accueil'},
    {id:'contenu', ic:'bi-phone-fill',      lbl:'Contenu'},
    {id:'clients', ic:'bi-people-fill',     lbl:'Clients'},
    {id:'finance', ic:'bi-cash-coin',       lbl:'Finance'},
    {id:'outils',  ic:'bi-lightning-fill',  lbl:'Outils'},
  ] as const

  if (locked) return (
    <div id="login">
      <div className={`l-card sp${pinShake?' sk':''}`}>
        <div className="l-logo sy">Bao<span className="p">Pixel</span><span className="o">OS</span></div>
        <div className="l-sub">Studio · Mbour · Petite-Côte</div>
        {!DB.get('bp4_pin',null) && <div className="l-hint">Première connexion — créez votre PIN à 4 chiffres</div>}
        <div className="l-dots">
          {[0,1,2,3].map(i=><div key={i} className={`l-dot${i<pinBuf.length?' on':''}${pinShake?' er':''}`}/>)}
        </div>
        <div className="l-keys">
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k,i)=>(
            <button key={i} className={`l-key${k===''?' ghost':k==='⌫'?' del':''}`}
              onClick={()=>k==='⌫'?setPinBuf(b=>b.slice(0,-1)):k?handleKey(k):undefined}>
              {k==='⌫'?<i className="bi bi-backspace-fill" style={{fontSize:16}}/>:k}
            </button>
          ))}
        </div>
        {pinMsg&&<div className={`l-msg${pinMsg.includes('✅')?' ok':pinMsg.includes('incorrect')||pinMsg.includes('différents')?' er':''}`}>{pinMsg}</div>}
      </div>
    </div>
  )

  if (!mounted) return (
    <div id="app" style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh'}}>
      <div style={{textAlign:'center',color:'var(--mu)'}}>
        <div className="spinner" style={{width:48,height:48,margin:'0 auto 20px'}}/>
        <div style={{fontSize:14}}>Initialisation...</div>
      </div>
    </div>
  )

  return (
    <div id="app">
      {/* HEADER */}
      <div id="header">
        <div className="h-brand sy">Bao<span className="p">Pixel</span><span className="o">OS</span></div>
        <div className="h-actions">
          <div className="h-ca-pill">
            <div className="h-ca-dot"/>
            <span>{fmtK(ca)} FCFA</span>
          </div>
          <button className="h-btn h-notif" onClick={() => syncNotion(false)} title="Synchroniser Notion">
            <i className={`bi bi-arrow-clockwise ${syncing?'spin':''}`}/>
            <div className={`h-badge${activePosts.length>0?' show':''}`}/>
          </button>
          <button className="theme-toggle" onClick={toggleTheme} title="Changer le thème">
            <i className="bi bi-moon-stars-fill icon moon"/>
            <i className="bi bi-sun-fill icon sun" style={{color:'var(--y)'}}/>
          </button>
          <button className="h-btn" onClick={()=>{setLocked(true);setPinBuf('');setPinFirst('');setPinMsg('')}} title="Verrouiller">
            <i className="bi bi-lock-fill"/>
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div id="main">
        {tab==='home'    && <Dashboard/>}
        {tab==='contenu' && <ContentTab/>}
        {tab==='clients' && <ClientsTab/>}
        {tab==='finance' && <FinanceTab/>}
        {tab==='outils'  && <OutilsTab/>}
      </div>

      {/* BOTTOM NAV */}
      <nav id="nav">
        {NAV_ITEMS.map(n=>(
          <div key={n.id} className={`nav-item${tab===n.id?' act':''}`} onClick={()=>setTab(n.id)}>
            <i className={`bi ${n.ic} nav-ico`}/>
            <div className="nav-lbl">{n.lbl}</div>
            {n.id==='contenu'&&activePosts.length>0&&<div className="nav-badge show">{activePosts.length}</div>}
          </div>
        ))}
      </nav>

      {/* FAB */}
      {tab!=='outils'&&<button className="fab" onClick={fabAction}><i className="bi bi-plus-lg"/></button>}

      {/* MODAL */}
      {modal}

      {/* TOAST */}
      <div ref={toastRef} className="toast-wrap"/>
    </div>
  )
}
