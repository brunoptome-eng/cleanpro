import { useState, useEffect, useRef } from "react";

/* ─── Google Font ─────────────────────────────────────────────────────── */
const FontLink = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #060d1f; }
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 99px; }
    @keyframes slideUp { from { transform:translateY(24px);opacity:0 } to { transform:translateY(0);opacity:1 } }
    @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
    @keyframes toastIn { from { transform:translateY(80px);opacity:0 } to { transform:translateY(0);opacity:1 } }
    .job-card:active   { transform:scale(.97) }
    .tap-btn:active    { opacity:.7;transform:scale(.95) }
    .cleaner-toggle:active { transform:scale(.93) }
    html, body, #root  { height: 100%; height: 100dvh; margin: 0; padding: 0; }
    #app-root          { display:flex; flex-direction:column; height:100%; height:100dvh; overflow:hidden; }
  `}</style>
);

/* ─── Static data ─────────────────────────────────────────────────────── */
const CLEANERS = [
  { id:1, name:"Maria Santos",   initials:"MS", color:"#34d399", phone:"+44 7700 111 111" },
  { id:2, name:"Ana Oliveira",   initials:"AO", color:"#818cf8", phone:"+44 7700 222 222" },
  { id:3, name:"Clara Ferreira", initials:"CF", color:"#fbbf24", phone:"+44 7700 333 333" },
  { id:4, name:"Sofia Lima",     initials:"SL", color:"#f472b6", phone:"+44 7700 444 444" },
];
const CLIENTS = [
  { id:1, name:"James Wilson",   address:"12 Baker St, London W1U 3BT",     postcode:"W1U", freq:"weekly",      value:120 },
  { id:2, name:"Emma Thompson",  address:"8 Oxford Rd, Manchester M13 9PL", postcode:"M13", freq:"fortnightly", value:160 },
  { id:3, name:"Oliver Brown",   address:"3 Kings Rd, Brighton BN1 1NA",    postcode:"BN1", freq:"weekly",      value:90  },
  { id:4, name:"Sophie Davis",   address:"21 Rose Lane, Leeds LS1 2HT",     postcode:"LS1", freq:"monthly",     value:200 },
  { id:5, name:"William Harris", address:"7 Park Ave, Bristol BS1 5TR",     postcode:"BS1", freq:"weekly",      value:140 },
];
const DAYS  = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const DATES = ["5 May","6 May","7 May","8 May","9 May","10 May","11 May"];
const HOURS = [
  "07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30",
  "11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30",
  "15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00"
];
const DURATIONS = [
  {val:0.5,  label:"30 min"},
  {val:1,    label:"1h"},
  {val:1.5,  label:"1h 30min"},
  {val:2,    label:"2h"},
  {val:2.5,  label:"2h 30min"},
  {val:3,    label:"3h"},
  {val:3.5,  label:"3h 30min"},
  {val:4,    label:"4h"},
  {val:4.5,  label:"4h 30min"},
  {val:5,    label:"5h"},
  {val:5.5,  label:"5h 30min"},
  {val:6,    label:"6h"},
  {val:7,    label:"7h"},
  {val:8,    label:"8h"},
];

/* ── Jobs: cleanerIds is now an ARRAY — one job per client visit ───────── */
const SEED_JOBS = [
  { id:1, cleanerIds:[1,4], clientId:1, day:"Mon", time:"09:00", duration:3, status:"confirmed", note:"" },
  { id:2, cleanerIds:[1,3], clientId:3, day:"Wed", time:"13:00", duration:2, status:"confirmed", note:"" },
  { id:3, cleanerIds:[2],   clientId:2, day:"Tue", time:"10:00", duration:4, status:"confirmed", note:"Keys with neighbour" },
  { id:4, cleanerIds:[2,3], clientId:5, day:"Thu", time:"09:00", duration:3, status:"pending",   note:"" },
  { id:5, cleanerIds:[3,4], clientId:4, day:"Fri", time:"11:00", duration:2, status:"confirmed", note:"" },
  { id:6, cleanerIds:[1,2], clientId:1, day:"Sat", time:"09:00", duration:3, status:"confirmed", note:"" },
  { id:7, cleanerIds:[4],   clientId:5, day:"Mon", time:"14:00", duration:2, status:"pending",   note:"" },
];

/* ─── Helpers ─────────────────────────────────────────────────────────── */
const SC = { confirmed:"#34d399", pending:"#fbbf24", cancelled:"#f87171" };
const SL = { confirmed:"Confirmed", pending:"Pending", cancelled:"Cancelled" };
const FL = { weekly:"Weekly", fortnightly:"Fortnightly", monthly:"Monthly", oneoff:"One-off" };
function fmtDur(d) {
  const h = Math.floor(d);
  const m = Math.round((d - h) * 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

function getCleaners(ids) { return (ids||[]).map(id=>CLEANERS.find(c=>c.id===id)).filter(Boolean); }
function getClient(id)    { return CLIENTS.find(c=>c.id===id); }

/* ── Message generators ─────────────────────────────────────────────── */
// Weekly schedule for a cleaner
function buildCleanerMsg(cleaner, jobs) {
  const cj = jobs.filter(j=>j.cleanerIds.includes(cleaner.id));
  if (!cj.length) return `Hi ${cleaner.name.split(" ")[0]} 👋\n\nNo jobs scheduled for you this week. We'll be in touch!\n\n— CleanPro`;
  const lines = DAYS
    .map(d => {
      const dj = cj.filter(j=>j.day===d);
      if (!dj.length) return null;
      return dj.map(j => {
        const client = getClient(j.clientId);
        const team   = getCleaners(j.cleanerIds).filter(c=>c.id!==cleaner.id);
        const partner= team.length ? ` (with ${team.map(c=>c.name.split(" ")[0]).join(" & ")})` : "";
        return `  ${d}: ${client?.name} — ${j.time}, ${j.duration}h${partner}\n       📍 ${client?.address}`;
      }).join("\n");
    })
    .filter(Boolean)
    .join("\n");
  return `Hi ${cleaner.name.split(" ")[0]} 👋\n\nHere's your schedule for this week:\n\n${lines}\n\nAny questions, just let us know! 😊\n— CleanPro`;
}

// Reminder for a client about their next visit
function buildClientMsg(client, jobs) {
  const cj   = jobs.filter(j=>j.clientId===client.id);
  const next  = cj[0];
  if (!next) return `Hi ${client.name.split(" ")[0]} 👋\n\nNo upcoming visits scheduled yet. We'll be in touch soon!\n\n— CleanPro`;
  const team  = getCleaners(next.cleanerIds);
  const names = team.map(c=>c.name.split(" ")[0]).join(" & ");
  return `Hi ${client.name.split(" ")[0]} 👋\n\nJust a reminder that your cleaning is scheduled for:\n\n📅 ${next.day} at ${next.time} (${next.duration}h)\n🧹 Cleaner${team.length>1?"s":""}: ${names}\n📍 ${client.address}${next.note?`\n📝 Note: ${next.note}`:""}\n\nSee you then! 😊\n— CleanPro`;
}

// Reminder from a specific job detail
function buildJobMsg(job) {
  const client  = getClient(job.clientId);
  const cleaners = getCleaners(job.cleanerIds);
  const names   = cleaners.map(c=>c.name.split(" ")[0]).join(" & ");
  return `Hi ${client?.name.split(" ")[0]} 👋\n\nYour cleaning is confirmed for:\n\n📅 ${job.day} at ${job.time} (${job.duration}h)\n🧹 Cleaner${cleaners.length>1?"s":""}: ${names}\n📍 ${client?.address}${job.note?`\n📝 Note: ${job.note}`:""}\n\nSee you then! 😊\n— CleanPro`;
}

function shareMessage(text, showToast, setSharePreview) {
  // Show the message in a preview modal so user can copy/select and send anywhere
  setSharePreview(text);
}

function copyText(text, showToast) {
  try {
    // Safari-compatible copy using execCommand fallback
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity  = "0";
    document.body.appendChild(el);
    el.focus();
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    showToast("📋 Copied! Paste into WhatsApp.");
  } catch {
    showToast("⚠️ Could not copy.","err");
  }
}

/* ════════════════════════════════════════════════════════════════════════ */
export default function CleanPro() {
  const [jobs, setJobs]         = useState(SEED_JOBS);
  const [cleaners, setCleaners] = useState(CLEANERS);
  const [clients,  setClients]  = useState(CLIENTS);
  const [tab, setTab]           = useState("home");
  const [activeDay, setDay]   = useState("Mon");
  const [sheet, setSheet]     = useState(null);
  const [form, setForm]       = useState({ cleanerIds:[1,2], clientId:1, day:"Mon", time:"09:00", duration:2, note:"" });
  const [toast, setToast]     = useState(null);
  const [sharePreview, setSharePreview] = useState(null);
  const [isMobile, setMobile] = useState(window.innerWidth < 768);

  useEffect(()=>{
    const fn=()=>setMobile(window.innerWidth<768);
    window.addEventListener("resize",fn);
    return ()=>window.removeEventListener("resize",fn);
  },[]);

  function showToast(msg,type="ok"){
    setToast({msg,type});
    setTimeout(()=>setToast(null),3000);
  }

  function addJob(){
    if(!form.cleanerIds.length){ showToast("⚠️ Select at least one cleaner","err"); return; }

    // True overlap using minutes for precision
    const toMin = t => { const [h,m]=t.split(":").map(Number); return h*60+m; };
    const newStart = toMin(form.time);
    const newEnd   = newStart + +form.duration * 60;
    const conflict = jobs.find(j=>{
      if(j.day !== form.day) return false;
      if(!j.cleanerIds.some(cid=>form.cleanerIds.includes(cid))) return false;
      const jStart = toMin(j.time);
      const jEnd   = jStart + j.duration * 60;
      return newStart < jEnd && newEnd > jStart;
    });
    if(conflict){
      const cl = getCleaners(conflict.cleanerIds.filter(cid=>form.cleanerIds.includes(cid)));
      showToast(`⚠️ ${cl[0]?.name.split(" ")[0]} already has a job at that time!`,"err");
      return;
    }
    const newJob = { ...form, id:Date.now(), clientId:+form.clientId, duration:+form.duration, value:+form.value||0, status:"pending" };
    setJobs(p=>[...p, newJob]);
    // Reset form for next entry
    setForm({ cleanerIds:[], clientId:1, day:"Mon", time:"09:00", duration:2, note:"", value:"" });
    setSheet(null);
    showToast("✅ Job scheduled!");
  }
  function setStatus(id,status){ setJobs(p=>p.map(j=>j.id===id?{...j,status}:j)); setSheet(null); showToast(`Marked as ${status}`); }
  function removeJob(id){ setJobs(p=>p.filter(j=>j.id!==id)); setSheet(null); showToast("Job removed","err"); }
  function copyCleanerMsg(cleaner){ shareMessage(buildCleanerMsg(cleaner, jobs), showToast, setSharePreview); }
  function copyClientMsg(client)  { shareMessage(buildClientMsg(client, jobs),   showToast, setSharePreview); }
  function copyJobMsg(job)        { shareMessage(buildJobMsg(job),                showToast, setSharePreview); }
  function copyAllMsg()           {
    const all = CLEANERS.map(c=>buildCleanerMsg(c,jobs)).join("\n\n---\n\n");
    shareMessage(all, showToast, setSharePreview);
  }

  const totalHrs  = jobs.reduce((a,j)=>a+j.duration,0);
  const revenue   = jobs.reduce((a,j)=>a+(j.value||0),0);
  const confirmed = jobs.filter(j=>j.status==="confirmed").length;
  const pending   = jobs.filter(j=>j.status==="pending").length;
  const dayJobs   = jobs.filter(j=>j.day===activeDay).sort((a,b)=>HOURS.indexOf(a.time)-HOURS.indexOf(b.time));

  return (
    <>
      <FontLink/>
      <div id="app-root">
      <div style={S.root}>
        {!isMobile && <DesktopSidebar tab={tab} setTab={setTab} jobs={jobs} confirmed={confirmed} pending={pending} totalHrs={totalHrs} revenue={revenue}/>}

        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,overflow:"hidden",height:"100%"}}>
          <AppHeader tab={tab} isMobile={isMobile} onAdd={()=>setSheet("addJob")} onAlert={copyAllMsg}/>

          {/* Scrollable content area */}
          <div style={{flex:1,overflowY:"auto",overflowX:"hidden",WebkitOverflowScrolling:"touch"}}>
            {tab==="home"     && <HomeTab     jobs={jobs} confirmed={confirmed} pending={pending} totalHrs={totalHrs} revenue={revenue} activeDay={activeDay} setDay={setDay} dayJobs={dayJobs} setSheet={setSheet} copyCleanerMsg={copyCleanerMsg} isMobile={isMobile}/>}
            {tab==="schedule" && <ScheduleTab jobs={jobs} activeDay={activeDay} setDay={setDay} dayJobs={dayJobs} setSheet={setSheet} isMobile={isMobile}/>}
            {tab==="team"     && <TeamTab     jobs={jobs} cleaners={cleaners} setSheet={setSheet} copyCleanerMsg={copyCleanerMsg} onAddCleaner={()=>setSheet("addCleaner")}/>}
            {tab==="clients"  && <ClientsTab  jobs={jobs} clients={clients}   setSheet={setSheet} copyClientMsg={copyClientMsg}  onAddClient={()=>setSheet("addClient")}/>}
          </div>

          {/* Always-frozen bottom nav */}
          <BottomNav tab={tab} setTab={setTab} pending={pending}/>
        </div>

        {sheet && (
          <BottomSheet onClose={()=>setSheet(null)} isMobile={isMobile}>
            {sheet==="addJob"
              ? <AddJobSheet form={form} setForm={setForm} onAdd={addJob} onClose={()=>setSheet(null)} cleaners={cleaners} clients={clients}/>
              : sheet==="addCleaner"
                ? <AddCleanerSheet onAdd={(c)=>{ setCleaners(p=>[...p,{...c,id:Date.now()}]); setSheet(null); showToast("✅ Cleaner added!"); }} onClose={()=>setSheet(null)}/>
                : sheet==="addClient"
                  ? <AddClientSheet onAdd={(c)=>{ setClients(p=>[...p,{...c,id:Date.now()}]); setSheet(null); showToast("✅ Client added!"); }} onClose={()=>setSheet(null)}/>
                  : sheet?._type==="client"
                    ? <ClientSheet client={sheet} jobs={jobs} setSheet={setSheet} copyClientMsg={copyClientMsg} copyJobMsg={copyJobMsg} onClose={()=>setSheet(null)}/>
                    : sheet?._type==="cleaner"
                      ? <CleanerSheet cleaner={sheet} jobs={jobs} copyCleanerMsg={copyCleanerMsg} onClose={()=>setSheet(null)}/>
                      : <JobSheet job={sheet} onStatus={setStatus} onDelete={removeJob} copyJobMsg={copyJobMsg} copyCleanerMsg={copyCleanerMsg} onClose={()=>setSheet(null)}/>
            }
          </BottomSheet>
        )}


        {sharePreview && (
          <SharePreviewModal
            text={sharePreview}
            onCopy={()=>{ copyText(sharePreview, showToast); }}
            onClose={()=>setSharePreview(null)}
          />
        )}

        {toast && <Toast msg={toast.msg} type={toast.type}/>}
      </div>
      </div>
    </>
  );
}

/* ─── Desktop Sidebar ──────────────────────────────────────────────────── */
function DesktopSidebar({tab,setTab,jobs,confirmed,pending,totalHrs,revenue}){
  const NAV=[{id:"home",icon:"⌂",label:"Home"},{id:"schedule",icon:"▦",label:"Schedule"},{id:"team",icon:"◈",label:"Team"},{id:"clients",icon:"◉",label:"Clients"}];
  return(
    <aside style={S.sidebar}>
      <div style={S.sidebarLogo}><span style={{color:"#34d399",fontSize:22}}>✦</span><span style={S.logoText}>CleanPro</span></div>
      <nav style={{display:"flex",flexDirection:"column",gap:4}}>
        {NAV.map(n=>(
          <button key={n.id} className="tap-btn" style={{...S.sideNav,...(tab===n.id?S.sideNavActive:{})}} onClick={()=>setTab(n.id)}>
            <span style={{fontSize:16,width:18,textAlign:"center"}}>{n.icon}</span>{n.label}
          </button>
        ))}
      </nav>
      <div style={{marginTop:"auto"}}>
        <p style={S.sideLabel}>THIS WEEK</p>
        {[["Jobs",jobs.length,"#e2e8f0"],["Confirmed",confirmed,"#34d399"],["Pending",pending,"#fbbf24"],["Hours",`${totalHrs}h`,"#818cf8"],["Revenue",`£${revenue}`,"#34d399"]].map(([l,v,c])=>(
          <div key={l} style={S.sideStat}>
            <span style={{fontSize:12,color:"#64748b"}}>{l}</span>
            <span style={{fontSize:14,fontWeight:700,color:c}}>{v}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

/* ─── App Header ───────────────────────────────────────────────────────── */
function AppHeader({tab,isMobile,onAdd,onAlert}){
  const T={home:"Dashboard",schedule:"Schedule",team:"Team",clients:"Clients"};
  return(
    <header style={S.header}>
      <div>
        {isMobile&&<div style={{fontSize:13,fontWeight:700,color:"#64748b",marginBottom:2}}><span style={{color:"#34d399"}}>✦</span> CleanPro</div>}
        <h1 style={S.headerTitle}>{T[tab]}</h1>
        {tab==="home"&&<p style={{fontSize:12,color:"#475569",marginTop:2}}>Week of 5–11 May 2026</p>}
      </div>
      <div style={{display:"flex",gap:8}}>
        <button className="tap-btn" style={S.headerBtn} onClick={onAlert} title="Share all schedules">🔗</button>
        <button className="tap-btn" style={{...S.headerBtn,background:"#34d399",color:"#060d1f",fontWeight:800,fontSize:20,border:"none"}} onClick={onAdd}>＋</button>
      </div>
    </header>
  );
}

/* ─── Bottom Nav ───────────────────────────────────────────────────────── */
function BottomNav({tab,setTab,pending}){
  const NAV=[{id:"home",icon:"⌂",label:"Home"},{id:"schedule",icon:"▦",label:"Schedule"},{id:"team",icon:"◈",label:"Team"},{id:"clients",icon:"◉",label:"Clients"}];
  return(
    <nav style={S.bottomNav}>
      {NAV.map(n=>(
        <button key={n.id} className="tap-btn" style={{...S.bottomNavBtn,...(tab===n.id?S.bottomNavActive:{})}} onClick={()=>setTab(n.id)}>
          <span style={{fontSize:18}}>{n.icon}</span>
          <span style={{fontSize:10,fontWeight:600,letterSpacing:"0.5px"}}>{n.label}</span>
          {n.id==="home"&&pending>0&&<span style={S.badge}>{pending}</span>}
        </button>
      ))}
    </nav>
  );
}

/* ─── HOME TAB ─────────────────────────────────────────────────────────── */
function HomeTab({jobs,confirmed,pending,totalHrs,revenue,activeDay,setDay,dayJobs,setSheet,copyCleanerMsg,isMobile}){
  return(
    <div style={S.tabBody}>
      <div style={{...S.statGrid,gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)"}}>
        {[
          {label:"Jobs",    val:jobs.length,   color:"#818cf8", sub:"this week"},
          {label:"Hours",   val:`${totalHrs}h`, color:"#34d399", sub:"scheduled"},
          {label:"Pending", val:pending,        color:"#fbbf24", sub:"need confirm"},
          {label:"Revenue", val:`£${revenue}`,  color:"#34d399", sub:"estimated"},
        ].map(s=>(
          <div key={s.label} style={S.statCard}>
            <p style={S.statLabel}>{s.label}</p>
            <p style={{...S.statVal,color:s.color}}>{s.val}</p>
            <p style={S.statSub}>{s.sub}</p>
          </div>
        ))}
      </div>

      <DaySelector activeDay={activeDay} setDay={setDay} jobs={jobs}/>

      <div style={S.section}>
        <p style={S.sectionTitle}>
          {activeDay}'s Jobs <span style={S.sectionCount}>{dayJobs.length}</span>
        </p>
        {dayJobs.length===0
          ? <EmptyState icon="📅" text="No jobs scheduled"/>
          : dayJobs.map(j=><JobRow key={j.id} job={j} onClick={()=>setSheet(j)}/>)
        }
      </div>

      <div style={S.section}>
        <p style={S.sectionTitle}>Quick Alerts</p>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {CLEANERS.map(c=>(
            <button key={c.id} className="tap-btn" style={{...S.alertBtn,borderColor:c.color+"44"}} onClick={()=>copyCleanerMsg(c)}>
              <Avatar c={c} size={32}/>
              <span style={{fontSize:13,color:"#94a3b8",flex:1,textAlign:"left"}}>{c.name}</span>
              <span style={{fontSize:12,color:"#64748b"}}>🔗 Share</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── SCHEDULE TAB ─────────────────────────────────────────────────────── */
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function ScheduleTab({jobs,activeDay,setDay,dayJobs,setSheet,isMobile}){
  const [viewMode,setViewMode] = useState("week"); // "week" | "month"
  const today = new Date(2026,4,9); // fixed demo date: 9 May 2026
  const [calMonth,setCalMonth]  = useState(today.getMonth());
  const [calYear,setCalYear]    = useState(today.getFullYear());

  return(
    <div style={{display:"flex",flexDirection:"column",paddingBottom:80}}>
      {/* View toggle */}
      <div style={{display:"flex",gap:8,padding:"16px 20px 8px"}}>
        {["week","month"].map(m=>(
          <button key={m} className="tap-btn"
            style={{flex:1,padding:"10px",borderRadius:10,border:`1px solid ${viewMode===m?"#34d399":"#1e293b"}`,
              background:viewMode===m?"#34d39922":"transparent",color:viewMode===m?"#34d399":"#64748b",
              fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"Outfit,sans-serif",textTransform:"capitalize"}}
            onClick={()=>setViewMode(m)}>
            {m==="week"?"📅 Week":"🗓 Month"}
          </button>
        ))}
      </div>

      {viewMode==="week" ? (
        <>
          <DaySelector activeDay={activeDay} setDay={setDay} jobs={jobs}/>
          {isMobile
            ? <div style={S.section}>
                {dayJobs.length===0
                  ? <EmptyState icon="📅" text="No jobs for this day"/>
                  : dayJobs.map(j=><JobRow key={j.id} job={j} onClick={()=>setSheet(j)}/>)
                }
              </div>
            : <TimelineGrid dayJobs={dayJobs} setSheet={setSheet}/>
          }
        </>
      ) : (
        <MonthCalendar jobs={jobs} month={calMonth} year={calYear}
          setMonth={setCalMonth} setYear={setCalYear}
          onDayPress={(d)=>{ setViewMode("week"); setDay(d); }}
          setSheet={setSheet}/>
      )}
    </div>
  );
}

function MonthCalendar({jobs,month,year,setMonth,setYear,onDayPress,setSheet}){
  const firstDay  = new Date(year,month,1).getDay(); // 0=Sun
  const daysInMonth = new Date(year,month+1,0).getDate();
  // Shift so Mon=0
  const startOffset = (firstDay+6)%7;
  const cells = [];
  for(let i=0;i<startOffset;i++) cells.push(null);
  for(let d=1;d<=daysInMonth;d++) cells.push(d);
  while(cells.length%7!==0) cells.push(null);

  // Map SEED_JOBS days to actual dates for demo — just use day-of-month matching
  // In real app this would use actual dates; for demo show jobs by day-of-week label
  const DEMO_WEEK_START = 5; // May 5 = Mon
  const dayLabelForDate = (d)=>{
    if(month!==4||year!==2026) return null; // only show for demo month
    const offset = d - DEMO_WEEK_START;
    if(offset>=0&&offset<7) return DAYS[offset];
    return null;
  };

  function prevMonth(){ if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); }
  function nextMonth(){ if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); }

  return(
    <div style={{padding:"0 20px"}}>
      {/* Month nav */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <button className="tap-btn" style={{...S.btnGhost,padding:"8px 14px"}} onClick={prevMonth}>‹</button>
        <p style={{fontSize:16,fontWeight:800,color:"#f1f5f9"}}>{MONTH_NAMES[month]} {year}</p>
        <button className="tap-btn" style={{...S.btnGhost,padding:"8px 14px"}} onClick={nextMonth}>›</button>
      </div>

      {/* Day headers */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:4}}>
        {["Mo","Tu","We","Th","Fr","Sa","Su"].map(d=>(
          <div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,color:"#475569",padding:"4px 0"}}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
        {cells.map((d,i)=>{
          const dayLabel = d ? dayLabelForDate(d) : null;
          const dayJobs  = dayLabel ? jobs.filter(j=>j.day===dayLabel) : [];
          const isToday  = d===9 && month===4 && year===2026;
          return(
            <div key={i}
              style={{minHeight:52,borderRadius:10,padding:"4px",background:isToday?"#34d39911":d?"#0a1628":"transparent",
                border:isToday?"1px solid #34d39944":"1px solid transparent",cursor:d?"pointer":"default",position:"relative"}}
              onClick={()=>{ if(d&&dayLabel) onDayPress(dayLabel); }}>
              {d&&<p style={{fontSize:12,fontWeight:isToday?800:600,color:isToday?"#34d399":"#94a3b8",marginBottom:2,textAlign:"center"}}>{d}</p>}
              <div style={{display:"flex",flexDirection:"column",gap:2}}>
                {dayJobs.slice(0,2).map(j=>{
                  const cl=getCleaners(j.cleanerIds)[0];
                  return(
                    <div key={j.id}
                      style={{borderRadius:4,background:(cl?.color||"#475569")+"33",borderLeft:`2px solid ${cl?.color||"#475569"}`,padding:"1px 3px",cursor:"pointer"}}
                      onClick={e=>{e.stopPropagation();setSheet(j);}}>
                      <p style={{fontSize:9,fontWeight:700,color:cl?.color||"#475569",lineHeight:1.3,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>
                        {getClient(j.clientId)?.name.split(" ")[0]}
                      </p>
                    </div>
                  );
                })}
                {dayJobs.length>2&&<p style={{fontSize:9,color:"#64748b",textAlign:"center"}}>+{dayJobs.length-2}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimelineGrid({dayJobs,setSheet}){
  return(
    <div style={S.section}>
      <div style={{display:"flex",overflowX:"auto",border:"1px solid #1e293b",borderRadius:12}}>
        <div style={{width:56,flexShrink:0,borderRight:"1px solid #1e293b"}}>
          <div style={{height:44,borderBottom:"1px solid #1e293b"}}/>
          {HOURS.map((h,i)=><div key={h} style={{height:52,display:"flex",alignItems:"flex-start",justifyContent:"flex-end",paddingRight:8,paddingTop:6,fontSize:i%2===0?10:9,color:i%2===0?"#475569":"#334155",fontFamily:"DM Mono,monospace",flexShrink:0}}>{h}</div>)}
        </div>
        {CLEANERS.map(c=>{
          const cj=dayJobs.filter(j=>j.cleanerIds.includes(c.id));
          return(
            <div key={c.id} style={{flex:1,borderRight:"1px solid #1e293b",minWidth:130,position:"relative"}}>
              <div style={{height:44,borderBottom:`2px solid ${c.color}`,display:"flex",alignItems:"center",gap:8,padding:"0 10px"}}>
                <Avatar c={c} size={22}/>
                <span style={{fontSize:12,fontWeight:700,color:"#e2e8f0"}}>{c.name.split(" ")[0]}</span>
              </div>
              <div style={{position:"relative"}}>
                {HOURS.map((_,i)=><div key={i} style={{height:52,borderBottom:"1px solid #1e293b0a",background:i%2===0?"#ffffff03":"transparent"}}/>)}
                {cj.map(j=>{
                  const client=getClient(j.clientId);
                  const cls=getCleaners(j.cleanerIds);
                  const toMinTL = t=>{const[h,m]=t.split(":").map(Number);return h*60+m;};
                  const dayStart=toMinTL(HOURS[0]);
                  const top=((toMinTL(j.time)-dayStart)/30)*52;
                  const height=(j.duration*2)*52-4;
                  return(
                    <div key={j.id} className="job-card"
                      style={{position:"absolute",left:4,right:4,top,height,borderRadius:8,background:c.color+"1a",borderLeft:`3px solid ${c.color}`,padding:"6px 8px",cursor:"pointer",transition:"transform .1s"}}
                      onClick={()=>setSheet(j)}>
                      <p style={{fontSize:11,fontWeight:700,color:"#f1f5f9",lineHeight:1.3}}>{client?.name}</p>
                      <p style={{fontSize:10,color:"#94a3b8",fontFamily:"DM Mono,monospace"}}>{j.time} · {fmtDur(j.duration)}</p>
                      {cls.length>1&&(
                        <div style={{display:"flex",gap:2,marginTop:3}}>
                          {cls.map(cl=><span key={cl.id} style={{fontSize:9,padding:"1px 5px",borderRadius:99,background:cl.color+"33",color:cl.color,fontWeight:700}}>{cl.initials}</span>)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── TEAM TAB ─────────────────────────────────────────────────────────── */
function TeamTab({jobs,cleaners,setSheet,copyCleanerMsg,onAddCleaner}){
  return(
    <div style={S.tabBody}>
      {/* Add cleaner button */}
      <div style={{padding:"16px 20px 0"}}>
        <button className="tap-btn" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,width:"100%",padding:"13px",borderRadius:12,border:"2px dashed #1e293b",background:"transparent",color:"#34d399",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"Outfit,sans-serif"}}
          onClick={onAddCleaner}>
          ＋ Add New Cleaner
        </button>
      </div>
      {cleaners.map(c=>{
        const cj=jobs.filter(j=>j.cleanerIds.includes(c.id));
        const hrs=cj.reduce((a,j)=>a+j.duration,0);
        return(
          <div key={c.id} style={{...S.card,borderTop:`3px solid ${c.color}`}}>
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
              <Avatar c={c} size={48}/>
              <div style={{flex:1}}>
                <p style={S.cardTitle}>{c.name}</p>
                <p style={S.cardSub}>{c.phone}</p>
              </div>
              <button className="tap-btn" style={S.waBtn} onClick={()=>copyCleanerMsg(c)}>🔗</button>
            </div>
            <div style={S.miniStats}>
              {[["Jobs",cj.length,c.color],["Hours",`${hrs}h`,c.color],["Confirmed",cj.filter(j=>j.status==="confirmed").length,"#34d399"]].map(([l,v,col])=>(
                <div key={l} style={S.miniStat}>
                  <p style={{fontSize:22,fontWeight:800,color:col,letterSpacing:"-1px"}}>{v}</p>
                  <p style={S.statSub}>{l}</p>
                </div>
              ))}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:14}}>
              {DAYS.map(d=>{
                const dj=cj.filter(j=>j.day===d);
                if(!dj.length) return null;
                return(
                  <div key={d} style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <span style={{fontSize:11,fontWeight:700,color:"#475569",width:28,flexShrink:0}}>{d}</span>
                    {dj.map(j=>{
                      const client=getClient(j.clientId);
                      const cls=getCleaners(j.cleanerIds);
                      return(
                        <button key={j.id} className="tap-btn"
                          style={{display:"flex",alignItems:"center",gap:4,fontSize:11,padding:"4px 10px",borderRadius:99,background:c.color+"1a",border:`1px solid ${c.color}33`,cursor:"pointer",fontFamily:"Outfit,sans-serif"}}
                          onClick={()=>setSheet(j)}>
                          <span style={{color:c.color,fontWeight:700}}>{client?.name.split(" ")[0]}</span>
                          <span style={{color:"#64748b",fontFamily:"DM Mono,monospace"}}>{j.time}</span>
                          {cls.length>1&&<span style={{color:"#475569",fontSize:10}}>+{cls.length-1}</span>}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
              {cj.length===0&&<p style={{color:"#475569",fontSize:13}}>No jobs this week</p>}
            </div>
            <button className="tap-btn" style={{...S.waBtn,width:"100%",justifyContent:"center",marginTop:14}}
              onClick={()=>copyCleanerMsg(c)}>
              🔗 Share Weekly Schedule
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ─── CLIENTS TAB ──────────────────────────────────────────────────────── */
function ClientsTab({jobs,clients,setSheet,copyClientMsg,onAddClient}){
  return(
    <div style={S.tabBody}>
      {/* Add client button */}
      <div style={{padding:"16px 20px 0"}}>
        <button className="tap-btn" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,width:"100%",padding:"13px",borderRadius:12,border:"2px dashed #1e293b",background:"transparent",color:"#818cf8",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"Outfit,sans-serif"}}
          onClick={onAddClient}>
          ＋ Add New Client
        </button>
      </div>
      {clients.map(cl=>{
        const cj=jobs.filter(j=>j.clientId===cl.id);
        const next=cj[0];
        const nextCleaners=next?getCleaners(next.cleanerIds):[];
        return(
          <div key={cl.id} style={S.card} onClick={()=>setSheet({...cl,_type:"client"})}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
              <div style={{width:44,height:44,borderRadius:"50%",background:"#818cf822",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#818cf8",flexShrink:0}}>
                {cl.name.split(" ").map(n=>n[0]).join("")}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <p style={S.cardTitle}>{cl.name}</p>
                <p style={S.cardSub}>📍 {cl.address}</p>
              </div>
              <span style={{fontSize:11,padding:"3px 9px",borderRadius:99,background:"#818cf822",color:"#818cf8",fontWeight:700,flexShrink:0}}>{FL[cl.freq]}</span>
            </div>
            <div style={{display:"flex",gap:14,flexWrap:"wrap",alignItems:"center"}}>
              {next?(
                <>
                  <Chip label="Next" val={`${next.day} ${next.time}`}/>

                  <Chip label="Status" val={SL[next.status]} color={SC[next.status]}/>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    <span style={{fontSize:9,fontWeight:700,letterSpacing:"1px",color:"#475569",textTransform:"uppercase"}}>Team</span>
                    <div style={{display:"flex"}}>
                      {nextCleaners.map((c,i)=>(
                        <div key={c.id} style={{marginLeft:i?-8:0,zIndex:nextCleaners.length-i}}>
                          <Avatar c={c} size={26}/>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ):<p style={{color:"#475569",fontSize:13}}>No jobs scheduled</p>}
              <button className="tap-btn" style={{...S.waBtn,marginLeft:"auto",padding:"8px 12px"}}
                onClick={e=>{e.stopPropagation();copyClientMsg(cl);}}>🔗</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Shared UI ────────────────────────────────────────────────────────── */
function DaySelector({activeDay,setDay,jobs}){
  const ref=useRef();
  useEffect(()=>{
    const idx=DAYS.indexOf(activeDay);
    ref.current?.children[idx]?.scrollIntoView({inline:"center",behavior:"smooth"});
  },[activeDay]);
  return(
    <div ref={ref} style={S.dayScroll}>
      {DAYS.map((d,i)=>{
        const count=jobs.filter(j=>j.day===d).length;
        const active=activeDay===d;
        return(
          <button key={d} className="tap-btn" style={{...S.dayPill,...(active?S.dayPillActive:{})}} onClick={()=>setDay(d)}>
            <span style={{fontSize:11,fontWeight:700}}>{d}</span>
            <span style={{fontSize:10,opacity:.7}}>{DATES[i]}</span>
            {count>0&&<span style={{fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:99,background:active?"#060d1f44":"#34d39922",color:active?"#060d1f":"#34d399"}}>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* JobRow — stacked overlapping avatars for multi-cleaner */
function JobRow({job,onClick}){
  const client=getClient(job.clientId);
  const cleaners=getCleaners(job.cleanerIds);
  const primary=cleaners[0];
  return(
    <div className="job-card" style={{...S.jobRow,borderLeft:`4px solid ${primary?.color||"#475569"}`}} onClick={onClick}>
      {/* Stacked avatars */}
      <div style={{display:"flex",flexShrink:0,alignItems:"center"}}>
        {cleaners.map((c,i)=>(
          <div key={c.id} style={{marginLeft:i?-10:0,zIndex:cleaners.length-i,position:"relative"}}>
            <Avatar c={c} size={36}/>
          </div>
        ))}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <p style={S.jobRowClient}>{client?.name}</p>
        <div style={{display:"flex",alignItems:"center",gap:6,marginTop:2,flexWrap:"wrap"}}>
          <span style={{fontSize:12,color:"#64748b",fontFamily:"DM Mono,monospace"}}>{job.time} · {fmtDur(job.duration)}</span>
          {cleaners.length>1&&<span style={{fontSize:11,color:"#94a3b8"}}>{cleaners.map(c=>c.name.split(" ")[0]).join(" & ")}</span>}
        </div>
      </div>
      <span style={{...S.pill,background:SC[job.status]+"22",color:SC[job.status]}}>{SL[job.status]}</span>
    </div>
  );
}

function Avatar({c,size=36}){
  return(
    <div style={{width:size,height:size,borderRadius:"50%",background:c.color+"33",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.34,fontWeight:700,color:c.color,flexShrink:0,border:"2px solid #0a1628"}}>
      {c.initials}
    </div>
  );
}
function Chip({label,val,color="#e2e8f0"}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:2}}>
      <span style={{fontSize:9,fontWeight:700,letterSpacing:"1px",color:"#475569",textTransform:"uppercase"}}>{label}</span>
      <span style={{fontSize:13,fontWeight:700,color}}>{val}</span>
    </div>
  );
}
function EmptyState({icon,text}){
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:"32px 0",color:"#475569"}}>
      <span style={{fontSize:32}}>{icon}</span>
      <p style={{fontSize:14}}>{text}</p>
    </div>
  );
}
function Toast({msg,type}){
  return(
    <div style={{position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",background:type==="err"?"#ef4444":"#1e293b",color:"#f1f5f9",padding:"12px 20px",borderRadius:12,fontWeight:600,fontSize:14,zIndex:200,whiteSpace:"nowrap",animation:"toastIn .3s ease",boxShadow:"0 8px 30px #0009",border:"1px solid #ffffff11"}}>
      {msg}
    </div>
  );
}

/* ─── Bottom Sheet ─────────────────────────────────────────────────────── */
function BottomSheet({onClose,isMobile,children}){
  return(
    <div style={{position:"fixed",inset:0,zIndex:100,animation:"fadeIn .2s ease"}}>
      {/* Backdrop — tap to close */}
      <div style={{position:"absolute",inset:0,background:"#00000077"}} onClick={onClose}/>
      {/* Sheet — sits above backdrop, centered or bottom */}
      <div style={{
        position:"absolute",
        bottom: isMobile ? 0 : "auto",
        top:    isMobile ? "auto" : "50%",
        left:   isMobile ? 0 : "50%",
        right:  isMobile ? 0 : "auto",
        transform: isMobile ? "none" : "translate(-50%,-50%)",
        width:  isMobile ? "100%" : "min(520px,95vw)",
        maxHeight:"88vh",
        ...S.sheet,
        ...(isMobile ? {} : {borderRadius:16, borderBottom:"1px solid #1e293b"}),
      }}>
        <div style={S.sheetHandle}/>
        <div style={{overflowY:"auto",flex:1,paddingBottom:8}}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── ADD JOB — multi-cleaner toggle buttons ───────────────────────────── */
function AddJobSheet({form,setForm,onAdd,onClose,cleaners,clients}){
  function toggle(id){
    setForm(p=>({ ...p, cleanerIds: p.cleanerIds.includes(id) ? p.cleanerIds.filter(x=>x!==id) : [...p.cleanerIds,id] }));
  }
  return(
    <>
      <p style={S.sheetTitle}>New Job</p>

      {/* Multi-cleaner selector */}
      <div style={S.formLabel}>
        <span style={S.formLabelText}>
          Cleaners&nbsp;<span style={{color:"#475569",fontWeight:400,fontSize:11}}>(tap to select one or more)</span>
        </span>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {CLEANERS.map(c=>{
            const sel=form.cleanerIds.includes(c.id);
            return(
              <button key={c.id} className="cleaner-toggle tap-btn"
                style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:12,border:`2px solid ${sel?c.color:"#1e293b"}`,background:sel?c.color+"15":"#060d1f",cursor:"pointer",transition:"all .15s",fontFamily:"Outfit,sans-serif",textAlign:"left"}}
                onClick={()=>toggle(c.id)}>
                <Avatar c={c} size={34}/>
                <span style={{fontSize:14,fontWeight:600,color:sel?c.color:"#94a3b8",flex:1}}>{c.name}</span>
                {/* Checkmark circle */}
                <span style={{width:24,height:24,borderRadius:"50%",border:`2px solid ${sel?c.color:"#334155"}`,background:sel?c.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#060d1f",fontWeight:800,flexShrink:0,transition:"all .15s"}}>
                  {sel?"✓":""}
                </span>
              </button>
            );
          })}
        </div>
        {/* Team indicator */}
        {form.cleanerIds.length>0&&(
          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:6,padding:"8px 12px",borderRadius:10,background:"#34d39911",border:"1px solid #34d39933"}}>
            <div style={{display:"flex"}}>
              {getCleaners(form.cleanerIds).map((c,i)=>(
                <div key={c.id} style={{marginLeft:i?-8:0}}><Avatar c={c} size={22}/></div>
              ))}
            </div>
            <span style={{fontSize:12,color:"#34d399",fontWeight:600}}>
              {form.cleanerIds.length===1?"Solo job":"Team of "+form.cleanerIds.length}
            </span>
          </div>
        )}
      </div>

      {/* Client */}
      <label style={S.formLabel}>
        <span style={S.formLabelText}>Client</span>
        <select style={S.select} value={form.clientId} onChange={e=>setForm(p=>({...p,clientId:+e.target.value}))}>
          {CLIENTS.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>

      {/* Day + Time side by side */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <label style={S.formLabel}>
          <span style={S.formLabelText}>Day</span>
          <select style={S.select} value={form.day} onChange={e=>setForm(p=>({...p,day:e.target.value}))}>
            {DAYS.map(d=><option key={d} value={d}>{d}</option>)}
          </select>
        </label>
        <label style={S.formLabel}>
          <span style={S.formLabelText}>Time</span>
          <select style={S.select} value={form.time} onChange={e=>setForm(p=>({...p,time:e.target.value}))}>
            {HOURS.map(h=><option key={h} value={h}>{h}</option>)}
          </select>
        </label>
      </div>

      <label style={S.formLabel}>
        <span style={S.formLabelText}>Duration (hours)</span>
        <select style={S.select} value={form.duration} onChange={e=>setForm(p=>({...p,duration:+e.target.value}))}>
          {DURATIONS.map(d=><option key={d.val} value={d.val}>{d.label}</option>)}
        </select>
      </label>

      <label style={S.formLabel}>
        <span style={S.formLabelText}>Value (£)</span>
        <input style={{...S.select,outline:"none"}} placeholder="120" type="number" value={form.value} onChange={e=>setForm(p=>({...p,value:e.target.value}))}/>
      </label>
      <label style={S.formLabel}>
        <span style={S.formLabelText}>Note (optional)</span>
        <input style={{...S.select,outline:"none"}} placeholder="e.g. Keys with neighbour" value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))}/>
      </label>

      <div style={{display:"flex",gap:10,marginTop:8}}>
        <button className="tap-btn" style={S.btnGhost} onClick={onClose}>Cancel</button>
        <button className="tap-btn" style={{...S.btnPrimary,flex:1}} onClick={onAdd}>Schedule Job</button>
      </div>
    </>
  );
}

/* ─── JOB DETAIL SHEET ─────────────────────────────────────────────────── */
function JobSheet({job,onStatus,onDelete,copyJobMsg,copyCleanerMsg,onClose}){
  const client=getClient(job.clientId);
  const cleaners=getCleaners(job.cleanerIds);
  const primary=cleaners[0];
  return(
    <>
      <p style={S.sheetTitle}>Job Details</p>
      <div style={{borderLeft:`4px solid ${primary?.color||"#475569"}`,paddingLeft:14,marginBottom:20}}>
        <p style={S.cardTitle}>{client?.name}</p>
        <p style={S.cardSub}>📍 {client?.address}</p>
        {job.note&&<p style={{fontSize:13,color:"#94a3b8",marginTop:6}}>📝 {job.note}</p>}
      </div>

      {/* Cleaners */}
      <p style={{fontSize:11,fontWeight:700,letterSpacing:"1px",color:"#475569",textTransform:"uppercase",marginBottom:10}}>
        {cleaners.length>1?"Team assigned":"Cleaner assigned"}
      </p>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
        {cleaners.map(c=>(
          <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,background:c.color+"10",border:`1px solid ${c.color}33`}}>
            <Avatar c={c} size={32}/>
            <div style={{flex:1}}>
              <p style={{fontSize:13,fontWeight:700,color:c.color}}>{c.name}</p>
              <p style={{fontSize:11,color:"#64748b"}}>{c.phone}</p>
            </div>
            <button className="tap-btn" style={{...S.waBtn,padding:"6px 10px",fontSize:12}} onClick={()=>{copyCleanerMsg(c);onClose();}}>🔗</button>
          </div>
        ))}
      </div>

      {[["Day / Time",`${job.day} at ${job.time}`],["Duration",fmtDur(job.duration)],["Value",job.value?`£${job.value}`:"—"],["Status",SL[job.status]]].map(([l,v])=>(
        <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #1e293b44"}}>
          <span style={{fontSize:13,color:"#64748b"}}>{l}</span>
          <span style={{fontSize:13,fontWeight:700,color:"#e2e8f0"}}>{v}</span>
        </div>
      ))}

      <div style={{display:"flex",gap:8,marginTop:20,flexWrap:"wrap"}}>
        {job.status!=="confirmed"&&<button className="tap-btn" style={{...S.btnPrimary,background:"#34d399",color:"#060d1f",flex:1}} onClick={()=>onStatus(job.id,"confirmed")}>✓ Confirm</button>}
        {job.status!=="cancelled"&&<button className="tap-btn" style={{...S.btnPrimary,background:"#ef444422",color:"#f87171",flex:1}} onClick={()=>onStatus(job.id,"cancelled")}>✗ Cancel</button>}
        <button className="tap-btn" style={S.waBtn} onClick={()=>{copyJobMsg(job);onClose();}}>🔗 Client</button>
        <button className="tap-btn" style={{...S.btnGhost,color:"#f87171"}} onClick={()=>onDelete(job.id)}>🗑</button>
      </div>
    </>
  );
}

/* ─── CLEANER SHEET ────────────────────────────────────────────────────── */
function CleanerSheet({cleaner,jobs,copyCleanerMsg,onClose}){
  const cj=jobs.filter(j=>j.cleanerIds.includes(cleaner.id));
  const hrs=cj.reduce((a,j)=>a+j.duration,0);
  return(
    <>
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20}}>
        <Avatar c={cleaner} size={56}/>
        <div><p style={S.sheetTitle}>{cleaner.name}</p><p style={S.cardSub}>{cleaner.phone}</p></div>
      </div>
      <div style={S.miniStats}>
        {[["Jobs",cj.length,cleaner.color],["Hours",`${hrs}h`,cleaner.color],["Confirmed",cj.filter(j=>j.status==="confirmed").length,"#34d399"]].map(([l,v,col])=>(
          <div key={l} style={S.miniStat}>
            <p style={{fontSize:22,fontWeight:800,color:col}}>{v}</p>
            <p style={S.statSub}>{l}</p>
          </div>
        ))}
      </div>
      <button className="tap-btn" style={{...S.waBtn,width:"100%",justifyContent:"center",marginTop:16}}
        onClick={()=>{copyCleanerMsg(cleaner);onClose();}}>
        🔗 Share Schedule
      </button>
    </>
  );
}

/* ─── CLIENT SHEET ─────────────────────────────────────────────────────── */
function ClientSheet({client,jobs,setSheet,copyClientMsg,copyJobMsg,onClose}){
  const cj=jobs.filter(j=>j.clientId===client.id);
  return(
    <>
      <p style={S.sheetTitle}>{client.name}</p>
      <p style={{...S.cardSub,marginBottom:16}}>📍 {client.address}</p>
      {[["Frequency",FL[client.freq]],["Total Jobs",cj.length]].map(([l,v])=>(
        <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #1e293b44"}}>
          <span style={{fontSize:13,color:"#64748b"}}>{l}</span>
          <span style={{fontSize:13,fontWeight:700,color:"#e2e8f0"}}>{v}</span>
        </div>
      ))}
      <p style={{...S.sectionTitle,marginTop:20,marginBottom:10}}>Scheduled Visits</p>
      {cj.length===0
        ? <EmptyState icon="📅" text="No jobs scheduled"/>
        : cj.map(j=>(
            <div key={j.id} style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{flex:1}}><JobRow job={j} onClick={()=>setSheet(j)}/></div>
              <button className="tap-btn" style={{...S.waBtn,padding:"8px 10px",marginBottom:8,flexShrink:0}} onClick={()=>copyJobMsg(j)}>🔗</button>
            </div>
          ))
      }
      <button className="tap-btn" style={{...S.waBtn,width:"100%",justifyContent:"center",marginTop:16}}
        onClick={()=>{copyClientMsg(client);onClose();}}>
        🔗 Share Reminder
      </button>
    </>
  );
}


/* ─── Share Preview Modal ──────────────────────────────────────────────── */
function SharePreviewModal({ text, onCopy, onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", flexDirection:"column",
      justifyContent:"flex-end", alignItems:"center", background:"#00000088", animation:"fadeIn .2s ease" }}
      onClick={onClose}>
      <div style={{ background:"#0a1628", borderRadius:"20px 20px 0 0", padding:"20px 20px 36px",
        width:"100%", maxHeight:"80vh", display:"flex", flexDirection:"column", gap:14,
        border:"1px solid #1e293b", borderBottom:"none", animation:"slideUp .3s ease" }}
        onClick={e=>e.stopPropagation()}>

        <div style={{ width:40, height:4, background:"#1e293b", borderRadius:99, margin:"0 auto" }}/>

        <p style={{ fontSize:16, fontWeight:800, color:"#f1f5f9", letterSpacing:"-0.5px" }}>
          Message ready to send
        </p>
        <p style={{ fontSize:12, color:"#64748b" }}>
          Tap <strong style={{color:"#94a3b8"}}>Copy</strong> then paste into WhatsApp, iMessage or any app.
        </p>

        {/* Message preview box — user can also long-press to select all */}
        <div style={{ background:"#060d1f", border:"1px solid #1e293b", borderRadius:12,
          padding:"14px 16px", maxHeight:220, overflowY:"auto" }}>
          <pre style={{ fontFamily:"Outfit,sans-serif", fontSize:13, color:"#cbd5e1",
            whiteSpace:"pre-wrap", lineHeight:1.6, margin:0 }}>{text}</pre>
        </div>

        <div style={{ display:"flex", gap:10 }}>
          <button style={{ flex:1, padding:"13px", borderRadius:12, border:"1px solid #1e293b",
            background:"transparent", color:"#94a3b8", fontSize:14, cursor:"pointer",
            fontFamily:"Outfit,sans-serif", fontWeight:600 }}
            onClick={onClose}>Close</button>
          <button style={{ flex:2, padding:"13px", borderRadius:12, border:"none",
            background:"#25d366", color:"#fff", fontSize:15, cursor:"pointer",
            fontFamily:"Outfit,sans-serif", fontWeight:800 }}
            onClick={onCopy}>📋 Copy message</button>
        </div>
      </div>
    </div>
  );
}


/* ─── ADD CLEANER SHEET ────────────────────────────────────────────────── */
const CLEANER_COLORS = ["#34d399","#818cf8","#fbbf24","#f472b6","#60a5fa","#f87171","#a78bfa","#34d3d3"];

function AddCleanerSheet({onAdd,onClose}){
  const [cf,setCf] = useState({name:"",phone:"",color:CLEANER_COLORS[0]});
  const initials = cf.name.trim().split(" ").filter(Boolean).map(w=>w[0].toUpperCase()).slice(0,2).join("");
  function submit(){
    if(!cf.name.trim()){ return; }
    onAdd({ name:cf.name.trim(), phone:cf.phone.trim(), color:cf.color, initials: initials||"?" });
  }
  return(
    <>
      <p style={S.sheetTitle}>New Cleaner</p>

      {/* Preview avatar */}
      <div style={{display:"flex",justifyContent:"center",marginBottom:20}}>
        <div style={{width:64,height:64,borderRadius:"50%",background:cf.color+"33",border:`3px solid ${cf.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:800,color:cf.color}}>
          {initials||"?"}
        </div>
      </div>

      <label style={S.formLabel}>
        <span style={S.formLabelText}>Full Name *</span>
        <input style={{...S.select,outline:"none"}} placeholder="e.g. Maria Santos" value={cf.name} onChange={e=>setCf(p=>({...p,name:e.target.value}))}/>
      </label>

      <label style={S.formLabel}>
        <span style={S.formLabelText}>Phone</span>
        <input style={{...S.select,outline:"none"}} placeholder="+44 7700 000 000" value={cf.phone} onChange={e=>setCf(p=>({...p,phone:e.target.value}))}/>
      </label>

      <div style={S.formLabel}>
        <span style={S.formLabelText}>Colour</span>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:4}}>
          {CLEANER_COLORS.map(col=>(
            <button key={col} className="tap-btn"
              style={{width:36,height:36,borderRadius:"50%",background:col,border:`3px solid ${cf.color===col?"#f1f5f9":"transparent"}`,cursor:"pointer",transition:"all .15s"}}
              onClick={()=>setCf(p=>({...p,color:col}))}/>
          ))}
        </div>
      </div>

      <div style={{display:"flex",gap:10,marginTop:8}}>
        <button className="tap-btn" style={S.btnGhost} onClick={onClose}>Cancel</button>
        <button className="tap-btn" style={{...S.btnPrimary,flex:1,opacity:cf.name.trim()?1:0.4}} onClick={submit}>Add Cleaner</button>
      </div>
    </>
  );
}

/* ─── ADD CLIENT SHEET ─────────────────────────────────────────────────── */
function AddClientSheet({onAdd,onClose}){
  const [cf,setCf] = useState({name:"",address:"",postcode:"",freq:"weekly"});
  function submit(){
    if(!cf.name.trim()||!cf.address.trim()){ return; }
    onAdd({ name:cf.name.trim(), address:cf.address.trim(), postcode:cf.postcode.trim(), freq:cf.freq, value:0 });
  }
  return(
    <>
      <p style={S.sheetTitle}>New Client</p>

      <label style={S.formLabel}>
        <span style={S.formLabelText}>Full Name *</span>
        <input style={{...S.select,outline:"none"}} placeholder="e.g. James Wilson" value={cf.name} onChange={e=>setCf(p=>({...p,name:e.target.value}))}/>
      </label>

      <label style={S.formLabel}>
        <span style={S.formLabelText}>Address *</span>
        <input style={{...S.select,outline:"none"}} placeholder="e.g. 12 Baker St, London" value={cf.address} onChange={e=>setCf(p=>({...p,address:e.target.value}))}/>
      </label>

      <label style={S.formLabel}>
        <span style={S.formLabelText}>Postcode</span>
        <input style={{...S.select,outline:"none"}} placeholder="W1U 3BT" value={cf.postcode} onChange={e=>setCf(p=>({...p,postcode:e.target.value.toUpperCase()}))}/>
      </label>

      <label style={S.formLabel}>
        <span style={S.formLabelText}>Frequency</span>
        <select style={S.select} value={cf.freq} onChange={e=>setCf(p=>({...p,freq:e.target.value}))}>
          <option value="weekly">Weekly</option>
          <option value="fortnightly">Fortnightly</option>
          <option value="monthly">Monthly</option>
          <option value="oneoff">One-off</option>
        </select>
      </label>

      <div style={{display:"flex",gap:10,marginTop:8}}>
        <button className="tap-btn" style={S.btnGhost} onClick={onClose}>Cancel</button>
        <button className="tap-btn" style={{...S.btnPrimary,flex:1,opacity:(cf.name.trim()&&cf.address.trim())?1:0.4}} onClick={submit}>Add Client</button>
      </div>
    </>
  );
}

/* ═══ Styles ════════════════════════════════════════════════════════════ */
const S={
  root:         {display:"flex",flex:1,background:"#060d1f",fontFamily:"Outfit,sans-serif",color:"#e2e8f0",overflow:"hidden",height:"100%"},
  sidebar:      {width:220,background:"#0a1628",borderRight:"1px solid #1e293b",display:"flex",flexDirection:"column",padding:"28px 16px 24px",gap:8,flexShrink:0},
  sidebarLogo:  {display:"flex",alignItems:"center",gap:10,marginBottom:28},
  logoText:     {fontSize:20,fontWeight:800,letterSpacing:"-1px",color:"#f1f5f9"},
  sideNav:      {display:"flex",alignItems:"center",gap:10,padding:"11px 12px",borderRadius:10,border:"none",background:"transparent",color:"#64748b",fontSize:14,fontWeight:500,cursor:"pointer",textAlign:"left",fontFamily:"Outfit,sans-serif",transition:"all .15s"},
  sideNavActive:{background:"#34d39922",color:"#34d399"},
  sideLabel:    {fontSize:10,fontWeight:700,letterSpacing:"1.5px",color:"#334155",marginBottom:10,marginTop:8},
  sideStat:     {display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0"},
  header:       {display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px",borderBottom:"1px solid #1e293b",flexShrink:0},
  headerTitle:  {fontSize:20,fontWeight:800,color:"#f1f5f9",letterSpacing:"-0.5px"},
  headerBtn:    {width:40,height:40,borderRadius:10,border:"1px solid #1e293b",background:"#0a1628",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .1s"},
  content:      {flex:1,overflowY:"auto",overflowX:"hidden"}, // legacy
  tabBody:      {display:"flex",flexDirection:"column",gap:0,padding:"0 0 24px"},
  statGrid:     {display:"grid",gap:12,padding:"20px 20px 0"},
  statCard:     {background:"#0a1628",border:"1px solid #1e293b",borderRadius:14,padding:"16px 18px"},
  statLabel:    {fontSize:11,fontWeight:700,letterSpacing:"1px",color:"#475569",textTransform:"uppercase"},
  statVal:      {fontSize:28,fontWeight:800,letterSpacing:"-1px",margin:"4px 0 2px"},
  statSub:      {fontSize:11,color:"#334155"},
  dayScroll:    {display:"flex",gap:8,overflowX:"auto",padding:"16px 20px",scrollbarWidth:"none"},
  dayPill:      {display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"10px 12px",borderRadius:12,border:"1px solid #1e293b",background:"transparent",color:"#64748b",cursor:"pointer",flexShrink:0,minWidth:56,transition:"all .15s",fontFamily:"Outfit,sans-serif"},
  dayPillActive:{background:"#34d399",border:"1px solid #34d399",color:"#060d1f"},
  section:      {padding:"16px 20px"},
  sectionTitle: {fontSize:13,fontWeight:700,color:"#64748b",letterSpacing:"0.5px",marginBottom:12,display:"flex",alignItems:"center",gap:8},
  sectionCount: {background:"#1e293b",color:"#94a3b8",fontSize:11,padding:"2px 8px",borderRadius:99,fontWeight:600},
  jobRow:       {display:"flex",alignItems:"center",gap:12,background:"#0a1628",border:"1px solid #1e293b",borderRadius:12,padding:"12px 14px",marginBottom:8,cursor:"pointer",transition:"transform .1s"},
  jobRowClient: {fontSize:14,fontWeight:700,color:"#f1f5f9"},
  card:         {background:"#0a1628",border:"1px solid #1e293b",borderRadius:16,padding:"18px 20px",margin:"0 20px 12px",animation:"slideUp .25s ease"},
  cardTitle:    {fontSize:15,fontWeight:700,color:"#f1f5f9"},
  cardSub:      {fontSize:12,color:"#64748b",marginTop:3},
  miniStats:    {display:"flex",background:"#060d1f",borderRadius:12,overflow:"hidden",border:"1px solid #1e293b"},
  miniStat:     {flex:1,padding:"12px 0",textAlign:"center",borderRight:"1px solid #1e293b"},
  pill:         {fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:99,flexShrink:0},
  badge:        {position:"absolute",top:-4,right:-4,width:16,height:16,borderRadius:"50%",background:"#fbbf24",color:"#060d1f",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"},
  btnPrimary:   {padding:"13px 18px",borderRadius:12,border:"none",background:"#34d399",color:"#060d1f",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"Outfit,sans-serif"},
  btnGhost:     {padding:"12px 16px",borderRadius:12,border:"1px solid #1e293b",background:"transparent",color:"#94a3b8",fontSize:14,cursor:"pointer",fontFamily:"Outfit,sans-serif"},
  waBtn:        {display:"flex",alignItems:"center",gap:6,padding:"10px 14px",borderRadius:12,border:"1px solid #25d36633",background:"#25d36611",color:"#25d366",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"Outfit,sans-serif"},
  alertBtn:     {display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:12,border:"1px solid #1e293b",background:"#0a1628",cursor:"pointer",fontFamily:"Outfit,sans-serif"},
  bottomNav:    {display:"flex",background:"#0a1628",borderTop:"1px solid #1e293b",padding:"8px 4px 20px",flexShrink:0,zIndex:50},
  bottomNavBtn: {flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"8px 4px",border:"none",background:"transparent",color:"#475569",cursor:"pointer",position:"relative",fontFamily:"Outfit,sans-serif",transition:"color .15s"},
  bottomNavActive:{color:"#34d399"},
  sheet:        {background:"#0a1628",borderRadius:"20px 20px 0 0",padding:"12px 20px 32px",width:"100%",maxHeight:"90vh",display:"flex",flexDirection:"column",animation:"slideUp .3s ease",border:"1px solid #1e293b",borderBottom:"none"},
  sheetHandle:  {width:40,height:4,background:"#1e293b",borderRadius:99,margin:"0 auto 20px",flexShrink:0},
  sheetTitle:   {fontSize:18,fontWeight:800,color:"#f1f5f9",marginBottom:16,letterSpacing:"-0.5px"},
  formLabel:    {display:"flex",flexDirection:"column",gap:6,marginBottom:14},
  formLabelText:{fontSize:12,fontWeight:700,color:"#64748b",letterSpacing:"0.5px"},
  select:       {padding:"13px 14px",borderRadius:10,border:"1px solid #1e293b",background:"#060d1f",color:"#e2e8f0",fontSize:14,fontFamily:"Outfit,sans-serif",outline:"none"},
};
