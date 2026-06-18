// ============================================================
// LifePage.js — 생활 관리 페이지: 루틴·생활·청소 체크리스트 + 월간 캘린더
// ============================================================
// LIFE PAGE — 완전 재설계
// ============================================================

// 날짜 유틸
function dateStrToObj(s) { return new Date(s+'T00:00:00'); }
function getWeekDates() {
  const today = new Date(); today.setHours(0,0,0,0);
  const dow = today.getDay();
  return Array.from({length:7}, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - dow + i);
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  });
}

// 개별 항목 카드 — 날짜 기반 완료 판단
function LifeItemCard({c, onToggle, onDelete, openEdit, updateStreak, lifeItems, viewDate, isReadOnly, onMoveUp, onMoveDown, showMoveButtons}) {
  const theme = useTheme();
  const SECTIONS = useLifeSections();
  const [guideOpen, setGuideOpen] = React.useState(false);
  const sec = SECTIONS[c.section] || SECTIONS['루틴'] || LIFE_SECTIONS['루틴'];

  // 핵심: 오늘(viewDate) 완료 여부는 lastDone === viewDate 로만 판단
  const doneOnView = isDoneOn(c, viewDate);

  // 생활/청소 주기 계산
  const sinceLastDone = c.lastDone
    ? Math.floor((dateStrToObj(viewDate) - dateStrToObj(c.lastDone)) / 864e5)
    : null;
  const nextDueDate = c.section !== '루틴' && c.lastDone
    ? addDays(c.lastDone, c.intervalDays || 7)
    : null;
  const dLeft = nextDueDate
    ? Math.floor((dateStrToObj(nextDueDate) - dateStrToObj(viewDate)) / 864e5)
    : null;
  const isOverdue = dLeft !== null && dLeft < 0 && !doneOnView;
  const isSoon = dLeft !== null && dLeft >= 0 && dLeft <= 2 && !doneOnView;
  const progress = c.section !== '루틴' && !doneOnView
    ? (c.lastDone
        ? Math.min(100, Math.round(sinceLastDone / (c.intervalDays || 7) * 100))
        : 100)
    : null;
  const progressColor = isOverdue ? '#ef4444' : isSoon ? '#f97316' : theme.primary;

  function StatusLabel() {
    if(c.section === '루틴') {
      if(doneOnView) return <span style={{fontSize:11,fontWeight:700,color:'#16a34a',background:'#f0fdf4',padding:'2px 8px',borderRadius:20,border:'1px solid #bbf7d0'}}>✓ 완료</span>;
      const isRoutineToday = isTodayItem(c, viewDate);
      if(isRoutineToday) return <span style={{fontSize:11,fontWeight:700,color:theme.primary,background:theme.light,padding:'2px 8px',borderRadius:20,border:`1px solid ${theme.mid}`}}>오늘</span>;
      const nd = getNextItemDate(c);
      return <span style={{fontSize:11,color:C.muted}}>다음: {nd ? formatNextDate(nd) : '-'}</span>;
    }
    if(doneOnView) return <span style={{fontSize:11,fontWeight:700,color:'#16a34a',background:'#f0fdf4',padding:'2px 8px',borderRadius:20,border:'1px solid #bbf7d0'}}>✓ 오늘 완료</span>;
    if(!c.lastDone) return <span style={{fontSize:11,color:C.muted,background:C.card3,padding:'2px 8px',borderRadius:20}}>아직 안 함</span>;
    if(isOverdue) return <span style={{fontSize:11,fontWeight:700,color:'#ef4444',background:'#fef2f2',padding:'2px 8px',borderRadius:20,border:'1px solid #fecaca'}}>⚠️ {Math.abs(dLeft)}일 지남</span>;
    if(isSoon) return <span style={{fontSize:11,fontWeight:700,color:'#f97316',background:'#fff7ed',padding:'2px 8px',borderRadius:20,border:'1px solid #fed7aa'}}>D-{dLeft}</span>;
    return <span style={{fontSize:11,color:'#22c55e',background:'#f0fdf4',padding:'2px 8px',borderRadius:20,border:'1px solid #bbf7d0'}}>D+{sinceLastDone}/{c.intervalDays}일</span>;
  }

  return (
    <div style={{
      background:C.card,borderRadius:14,
      border:`1.5px solid ${doneOnView?'#d1fae5':isOverdue?'#fecaca':'#f3f4f6'}`,
      overflow:'hidden',opacity:doneOnView?0.75:1,transition:'opacity 0.2s,border-color 0.2s'
    }}>
      <div style={{padding:'13px 15px'}}>
        <div style={{display:'flex',alignItems:'center',gap:11}}>
          {/* 체크박스 */}
          <div onClick={()=>{
            if(isReadOnly) return;
            onToggle(c.id);
            if(c.section==='루틴') {
              const willBeDone = !doneOnView;
              const currentDone = lifeItems.filter(x=>x.section==='루틴'&&isDoneOn(x,viewDate)).length;
              const newDoneCount = willBeDone ? currentDone+1 : Math.max(0,currentDone-1);
              updateStreak && updateStreak(newDoneCount, lifeItems.filter(x=>x.section==='루틴').length);
            }
          }} style={{
            width:22,height:22,borderRadius:6,flexShrink:0,
            cursor:isReadOnly?'default':'pointer',
            background:doneOnView?theme.primary:'transparent',
            border:`2px solid ${doneOnView?theme.primary:'#d1d5db'}`,
            display:'flex',alignItems:'center',justifyContent:'center',
            transition:'all 0.15s'
          }}>
            {doneOnView&&<span style={{color:'#fff',fontSize:11,fontWeight:700}}>✓</span>}
          </div>
          <span style={{fontSize:18,flexShrink:0}}>{c.emoji||'💧'}</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:600,color:doneOnView?C.muted:C.text,textDecoration:doneOnView?'line-through':'none'}}>{c.text}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:2,display:'flex',gap:5,flexWrap:'wrap',alignItems:'center'}}>
              <span style={{background:sec.bg,color:sec.color,padding:'1px 6px',borderRadius:20,border:`1px solid ${sec.border}`,fontWeight:600,fontSize:10}}>{sec.icon} {c.section}</span>
              {c.section==='루틴'
                ? <span style={{background:C.card3,padding:'1px 6px',borderRadius:20,fontSize:10}}>🔄 {getRepeatLabel(c)}</span>
                : <span style={{fontSize:10}}>⏱ {c.intervalDays}일 주기{c.lastDone?` · ${sinceLastDone}일 전 완료`:''}</span>
              }
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4,flexShrink:0}}>
            <StatusLabel/>
            {!isReadOnly&&<div style={{display:'flex',gap:4}}>
              {showMoveButtons&&<>
                <button onClick={e=>{e.stopPropagation();onMoveUp&&onMoveUp(c.id);}} style={{background:'none',border:'none',cursor:'pointer',color:'#d1d5db',fontSize:13,padding:0,width:'auto',margin:0,lineHeight:1}} title="위로" onMouseEnter={e=>e.currentTarget.style.color=theme.primary} onMouseLeave={e=>e.currentTarget.style.color='#d1d5db'}>↑</button>
                <button onClick={e=>{e.stopPropagation();onMoveDown&&onMoveDown(c.id);}} style={{background:'none',border:'none',cursor:'pointer',color:'#d1d5db',fontSize:13,padding:0,width:'auto',margin:0,lineHeight:1}} title="아래로" onMouseEnter={e=>e.currentTarget.style.color=theme.primary} onMouseLeave={e=>e.currentTarget.style.color='#d1d5db'}>↓</button>
              </>}
              {c.guide&&<button onClick={()=>setGuideOpen(!guideOpen)} style={{fontSize:10,color:theme.primary,background:theme.light,border:`1px solid ${theme.mid}`,borderRadius:7,padding:'2px 7px',cursor:'pointer',width:'auto',margin:0}}>{guideOpen?'접기':'방법'}</button>}
              <button onClick={()=>openEdit(c)} style={{background:'none',border:'none',cursor:'pointer',color:theme.border,fontSize:13,padding:0,width:'auto',margin:0}} onMouseEnter={e=>e.currentTarget.style.color=theme.primary} onMouseLeave={e=>e.currentTarget.style.color=theme.border}>✎</button>
              <button onClick={()=>onDelete(c.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#d1d5db',fontSize:13,padding:0,width:'auto',margin:0}} onMouseEnter={e=>e.currentTarget.style.color='#ef4444'} onMouseLeave={e=>e.currentTarget.style.color='#d1d5db'}>✕</button>
            </div>}
          </div>
        </div>
        {guideOpen&&c.guide&&(
          <div style={{marginTop:10,padding:'10px 12px',background:theme.light,borderRadius:10,border:`1px solid ${theme.mid}`,fontSize:12,color:theme.primary,lineHeight:1.7,whiteSpace:'pre-wrap'}}>{c.guide}</div>
        )}
      </div>
      {progress !== null && (
        <div style={{height:3,background:C.card3}}>
          <div style={{height:'100%',width:`${progress}%`,background:progressColor,transition:'width 0.5s',borderRadius:2}}/>
        </div>
      )}
    </div>
  );
}

// 예정 항목 카드 (주기가 아직 안 됐거나 오늘 요일 해당 안 되는 루틴)
function ScheduledItemCard({c, onDelete, openEdit, viewDate}) {
  const theme = useTheme();
  const SECTIONS = useLifeSections();
  const sec = SECTIONS[c.section] || SECTIONS['루틴'] || LIFE_SECTIONS['루틴'];
  const sinceLastDone = c.lastDone
    ? Math.floor((dateStrToObj(viewDate) - dateStrToObj(c.lastDone)) / 864e5)
    : null;
  const nextDueDate = c.lastDone ? addDays(c.lastDone, c.intervalDays||7) : null;
  const dLeft = nextDueDate
    ? Math.floor((dateStrToObj(nextDueDate) - dateStrToObj(viewDate)) / 864e5)
    : null;

  let dday='', ddayColor='#9ca3af', ddayBg='#f3f4f6', ddayBorder='#e5e7eb';
  if(!c.lastDone) {
    dday='한 번도 안 함'; ddayColor='#7c3aed'; ddayBg='#f5f3ff'; ddayBorder='#ddd6fe';
  } else if(dLeft !== null) {
    if(dLeft < 0)        { dday=`⚠️ ${Math.abs(dLeft)}일 지남`; ddayColor='#ef4444'; ddayBg='#fef2f2'; ddayBorder='#fecaca'; }
    else if(dLeft === 0) { dday='오늘!'; ddayColor='#16a34a'; ddayBg='#f0fdf4'; ddayBorder='#bbf7d0'; }
    else if(dLeft <= 3)  { dday=`D-${dLeft}`; ddayColor='#f97316'; ddayBg='#fff7ed'; ddayBorder='#fed7aa'; }
    else if(dLeft <= 7)  { dday=`D-${dLeft}`; ddayColor='#eab308'; ddayBg='#fefce8'; ddayBorder='#fef08a'; }
    else                 { dday=`D-${dLeft}`; ddayColor='#22c55e'; ddayBg='#f0fdf4'; ddayBorder='#bbf7d0'; }
  }

  const progress = c.lastDone && c.intervalDays
    ? Math.min(100, Math.round(sinceLastDone / c.intervalDays * 100))
    : c.lastDone ? 100 : 0;

  return (
    <div style={{background:C.card,borderRadius:14,border:`1.5px solid ${C.border}`,overflow:'hidden'}}>
      <div style={{padding:'12px 15px',display:'flex',alignItems:'center',gap:11}}>
        <span style={{fontSize:18,flexShrink:0}}>{c.emoji||'💧'}</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:600,color:C.text}}>{c.text}</div>
          <div style={{fontSize:11,color:C.muted,marginTop:1,display:'flex',gap:5,flexWrap:'wrap'}}>
            <span style={{background:sec.bg,color:sec.color,padding:'1px 6px',borderRadius:20,border:`1px solid ${sec.border}`,fontWeight:600,fontSize:10}}>{sec.icon} {c.section}</span>
            <span style={{fontSize:10}}>⏱ {c.intervalDays}일 주기</span>
            {sinceLastDone !== null && <span style={{fontSize:10,color:C.muted}}>{sinceLastDone}일 전 완료</span>}
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4,flexShrink:0}}>
          {dday&&<span style={{fontSize:11,fontWeight:700,color:ddayColor,background:ddayBg,padding:'2px 9px',borderRadius:20,border:`1px solid ${ddayBorder}`,whiteSpace:'nowrap'}}>{dday}</span>}
          <div style={{display:'flex',gap:4}}>
            <button onClick={()=>openEdit(c)} style={{background:'none',border:'none',cursor:'pointer',color:'#d1d5db',fontSize:13,padding:0,width:'auto',margin:0}} onMouseEnter={e=>e.currentTarget.style.color=theme.primary} onMouseLeave={e=>e.currentTarget.style.color='#d1d5db'}>✎</button>
            <button onClick={()=>onDelete(c.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#d1d5db',fontSize:13,padding:0,width:'auto',margin:0}} onMouseEnter={e=>e.currentTarget.style.color='#ef4444'} onMouseLeave={e=>e.currentTarget.style.color='#d1d5db'}>✕</button>
          </div>
        </div>
      </div>
      <div style={{height:3,background:C.card3}}>
        <div style={{height:'100%',width:`${progress}%`,background:progress>=100?'#ef4444':progress>=70?'#f97316':theme.primary,transition:'width 0.5s',borderRadius:2}}/>
      </div>
    </div>
  );
}

// 월간 달력
function MonthlyCalendar({weeklyLog, lifeItems, onSelectDate, viewDate}) {
  const theme = useTheme();
  const [calYear, setCalYear] = React.useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = React.useState(() => new Date().getMonth());

  const todayStr = getToday();
  const firstDay = new Date(calYear, calMonth, 1);
  const lastDay = new Date(calYear, calMonth+1, 0);
  const startDow = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const cells = [];
  for(let i=0;i<startDow;i++) cells.push(null);
  for(let d=1;d<=daysInMonth;d++) cells.push(d);

  function getCellAchiev(dateStr) {
    const log = (weeklyLog||{})[dateStr];
    if(log === undefined || log === null) return null;
    if(log >= 100) return {emoji:'🔥',bg:'#fff7ed',border:'#fed7aa',color:'#ea580c'};
    if(log >= 50) return {emoji:'💪',bg:'#eff6ff',border:'#bfdbfe',color:'#2563eb'};
    if(log > 0) return {emoji:'🌱',bg:'#f0fdf4',border:'#bbf7d0',color:'#16a34a'};
    return {emoji:'',bg:'#f9fafb',border:'#f3f4f6',color:C.muted};
  }

  const monthNames=['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

  return (
    <div style={{background:C.card,borderRadius:18,padding:'16px',border:`1.5px solid #f3f4f6`,marginBottom:14}}>
      {/* 헤더 */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <button onClick={()=>{if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1);}} style={{background:'none',border:'none',cursor:'pointer',fontSize:16,color:theme.primary,padding:'4px 8px',width:'auto',margin:0}}>‹</button>
        <span style={{fontSize:14,fontWeight:700,color:C.text}}>{calYear}년 {monthNames[calMonth]}</span>
        <button onClick={()=>{if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1);}} style={{background:'none',border:'none',cursor:'pointer',fontSize:16,color:theme.primary,padding:'4px 8px',width:'auto',margin:0}}>›</button>
      </div>
      {/* 범례 */}
      <div style={{display:'flex',gap:8,marginBottom:10,flexWrap:'wrap',alignItems:'center'}}>
        {[{bg:'#f0fdf4',border:'#bbf7d0',color:'#16a34a',label:'🌱 시작'},{bg:'#eff6ff',border:'#bfdbfe',color:'#2563eb',label:'💪 노력'},{bg:'#fff7ed',border:'#fed7aa',color:'#ea580c',label:'🔥 완벽'},{bg:'#f9fafb',border:'#f3f4f6',color:C.muted,label:'기록없음'}].map(s=>(
          <div key={s.label} style={{display:'flex',alignItems:'center',gap:4}}>
            <div style={{width:14,height:14,borderRadius:4,background:s.bg,border:`1.5px solid ${s.border}`}}/>
            <span style={{fontSize:10,color:s.color,fontWeight:600}}>{s.label}</span>
          </div>
        ))}
      </div>
      {/* 요일 헤더 */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3,marginBottom:4}}>
        {['일','월','화','수','목','금','토'].map((d,i)=>(
          <div key={d} style={{textAlign:'center',fontSize:10,fontWeight:700,color:i===0?'#ef4444':i===6?'#3b82f6':'#9ca3af',padding:'3px 0'}}>{d}</div>
        ))}
      </div>
      {/* 날짜 셀 */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3}}>
        {cells.map((d,i)=>{
          if(!d) return <div key={`empty-${i}`}/>;
          const ds=`${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
          const achiev=getCellAchiev(ds);
          const isToday=ds===todayStr;
          const isSelected=ds===viewDate;
          return (
            <button key={ds} onClick={()=>{onSelectDate(ds);}} style={{
              aspectRatio:'1',borderRadius:8,fontSize:11,fontWeight:isToday||isSelected?800:500,
              border:`1.5px solid ${isSelected?theme.primary:isToday?theme.border:achiev?.border||'#f3f4f6'}`,
              background:isSelected?theme.primary:achiev?.bg||C.card,
              color:isSelected?'#fff':isToday?theme.primary:achiev?.color||C.text2,
              cursor:'pointer',padding:0,margin:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:1,
              boxShadow:isToday?`0 0 0 2px ${theme.light}`:'none',
              transition:'all 0.15s',
            }}>
              <span>{d}</span>
              {achiev?.emoji&&!isSelected&&<span style={{fontSize:9,lineHeight:1}}>{achiev.emoji}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LifePage({lifeItems,onAdd,onToggle,onDelete,onEdit,streak,weeklyLog,updateStreak,fb,user}) {
  const theme=useTheme();
  const todayStr = getToday();
  const [lifeTab, setLifeTab] = React.useState('today'); // 'today' | 'report'
  const [viewDate, setViewDate] = React.useState(todayStr);
  const [showAddModal,setShowAddModal]=React.useState(false);
  const [editTarget,setEditTarget]=React.useState(null);
  const [showPackModal,setShowPackModal]=React.useState(false);
  const [showCalendar, setShowCalendar] = React.useState(false);
  const [scheduledOpen, setScheduledOpen] = React.useState(true);
  const [sortMode, setSortMode] = React.useState(false); // 순서 편집 모드
  const emptyForm={text:'',emoji:'💧',section:'루틴',freq:'daily',freqDays:[],intervalDays:7,monthDay:1,guide:''};
  const [form,setForm]=React.useState(emptyForm);

  const isToday = viewDate === todayStr;
  const isFuture = viewDate > todayStr;
  const isPast = viewDate < todayStr;

  // 오늘 할 일:
  // - 루틴: viewDate 요일/주기에 해당하는 것
  // - 생활/청소: 주기가 됐거나 한 번도 안 한 것 (isDueOn)
  // 오늘 완료 여부는 isDoneOn (lastDone === viewDate) 로만 판단
  const todayItems = lifeItems.filter(c => isDueOn(c, viewDate));

  // 예정 항목: 아직 주기가 안 된 생활/청소 + 오늘 요일 해당 안 되는 루틴
  const scheduledItems = lifeItems.filter(c => !isDueOn(c, viewDate));

  // 섹션 순서: 루틴 → 생활 → 청소
  const SECTION_ORDER = {'루틴':0, '생활':1, '청소':2};
  const todayUndone = todayItems
    .filter(c => !isDoneOn(c, viewDate))
    .sort((a,b) => {
      const so = (SECTION_ORDER[a.section]??9) - (SECTION_ORDER[b.section]??9);
      if(so !== 0) return so;
      return (a.order||0) - (b.order||0);
    });
  const todayDone = todayItems.filter(c => isDoneOn(c, viewDate));

  // 순서 이동 함수
  function handleMoveUp(id) {
    const idx = todayUndone.findIndex(c=>c.id===id);
    if(idx <= 0) return;
    const above = todayUndone[idx-1];
    const current = todayUndone[idx];
    const curOrder = current.order ?? idx;
    const aboveOrder = above.order ?? (idx-1);
    onEdit(current.id, {order: aboveOrder});
    onEdit(above.id, {order: curOrder});
  }
  function handleMoveDown(id) {
    const idx = todayUndone.findIndex(c=>c.id===id);
    if(idx >= todayUndone.length-1) return;
    const below = todayUndone[idx+1];
    const current = todayUndone[idx];
    const curOrder = current.order ?? idx;
    const belowOrder = below.order ?? (idx+1);
    onEdit(current.id, {order: belowOrder});
    onEdit(below.id, {order: curOrder});
  }

  // 달성률 계산
  const totalToday = todayItems.length;
  const doneToday = todayDone.length;
  const pct = totalToday ? Math.round(doneToday/totalToday*100) : 0;
  const achievLevel = getAchievLevel(doneToday, totalToday);

  // 카드 배경/게이지 색
  const cardBg = achievLevel?.cardBg || `linear-gradient(135deg,${theme.primary},${theme.border})`;
  const gaugeStroke = achievLevel?.gaugeStroke || '#fff';
  const badgeBg = achievLevel?.badgeBg || theme.light;
  const badgeColor = achievLevel?.badgeColor || theme.primary;
  const badgeBorder = achievLevel?.badgeBorder || theme.mid;

  // 날짜 네비게이션
  function navigate(dir) {
    const d = new Date(viewDate); d.setDate(d.getDate()+dir);
    setViewDate(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'));
    setShowCalendar(false);
  }
  function goToday() { setViewDate(todayStr); setShowCalendar(false); }

  // 요일 표기
  function dateLabel(ds) {
    const d = new Date(ds+'T00:00:00');
    const days=['일','월','화','수','목','금','토'];
    return `${d.getMonth()+1}/${d.getDate()} (${days[d.getDay()]})`;
  }

  function openAdd(section) {
    setEditTarget(null);
    setForm({...emptyForm,section:section||'루틴'});
    setShowAddModal(true);
  }
  function openEdit(item) {
    setEditTarget(item);
    setForm({text:item.text,emoji:item.emoji||'💧',section:item.section||'루틴',freq:item.freq||'interval',freqDays:item.freqDays||[],intervalDays:item.intervalDays||7,monthDay:item.monthDay||1,guide:item.guide||''});
    setShowAddModal(true);
  }
  function submitForm() {
    if(!form.text.trim()) return;
    if(editTarget) onDelete(editTarget.id);
    onAdd({id:Date.now(),...form,done:false,lastDone:null,createdAt:editTarget?.createdAt||new Date().toISOString()});
    setShowAddModal(false);
  }

  // 이번 주 날짜 바
  const weekDates = getWeekDates();

  function getWeekDayAchiev(ds) {
    const log = weeklyLog?.[ds];
    if(log === undefined || log === null) return null;
    if(log >= 100) return {bg:'#fff7ed',border:'#fed7aa',color:'#ea580c',emoji:'🔥'};
    if(log >= 50) return {bg:'#eff6ff',border:'#bfdbfe',color:'#2563eb',emoji:'💪'};
    if(log > 0) return {bg:'#f0fdf4',border:'#bbf7d0',color:'#16a34a',emoji:'🌱'};
    return null;
  }

  return (
    <div>
      {/* ── 헤더 ── */}
      <div style={{marginBottom:14}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
          <div>
            <div style={{fontSize:21,fontWeight:800,color:C.text,marginBottom:2}}>🌀 생활 관리</div>
            <div style={{fontSize:12,color:C.muted}}>
              {lifeTab==='today'&&'루틴·생활·청소 한눈에'}
              {lifeTab==='report'&&'월간 달성 기록'}
              {lifeTab==='diary'&&'오늘을 기억해요 ✍️'}
            </div>
          </div>
          <PageHelp pageId="life"/>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:5,flexWrap:'wrap',marginTop:8}}>
          {[{id:'report',emoji:'📊',label:'월간리포트'},{id:'diary',emoji:'📔',label:'하루기록'}].map(t=>(
            <button key={t.id} onClick={()=>setLifeTab(lifeTab===t.id?'today':t.id)} title={t.label} style={{
              borderRadius:10,border:`1.5px solid ${lifeTab===t.id?theme.primary:theme.mid}`,
              background:lifeTab===t.id?theme.primary:theme.bg,
              display:'flex',alignItems:'center',gap:4,
              fontSize:12,fontWeight:600,cursor:'pointer',padding:'5px 10px',margin:0,width:'auto',
              color:lifeTab===t.id?'#fff':theme.primary,
              transition:'all 0.15s',
              boxShadow:lifeTab===t.id?`0 2px 8px ${theme.primary}44`:'none',
            }}><span>{t.emoji}</span><span>{t.label}</span></button>
          ))}
          <div style={{width:1,height:20,background:theme.mid}}/>
          <button onClick={()=>setShowPackModal(true)} style={{padding:'5px 10px',borderRadius:10,border:`1.5px solid ${theme.mid}`,background:theme.bg,color:theme.primary,fontSize:12,fontWeight:600,cursor:'pointer',margin:0,width:'auto',display:'flex',alignItems:'center',gap:3}}><span>✨</span><span>추천팩</span></button>
          <button onClick={()=>openAdd('루틴')} style={{padding:'5px 12px',borderRadius:10,border:'none',background:theme.primary,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',margin:0,width:'auto'}}>+ 추가</button>
        </div>
      </div>

      {/* ── 리포트 탭 ── */}
      {lifeTab==='report'&&(
        <ReportPage weeklyLog={weeklyLog} lifeItems={lifeItems} foods={[]} streak={streak}/>
      )}

      {/* ── 하루기록 탭 ── */}
      {lifeTab==='diary'&&(
        <DiaryPage fb={fb} user={user}/>
      )}

      {/* ── 오늘 할 일 탭 ── */}
      {lifeTab==='today'&&(<>

      {/* 날짜 네비게이션 */}
      <div style={{background:C.card,borderRadius:16,padding:'12px 16px',border:`1.5px solid ${C.border}`,marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
        <button onClick={()=>navigate(-1)} style={{background:'none',border:'none',cursor:'pointer',fontSize:18,color:theme.primary,padding:'2px 6px',width:'auto',margin:0}}>‹</button>
        <div style={{flex:1,textAlign:'center'}}>
          <div style={{fontSize:14,fontWeight:700,color:C.text}}>{dateLabel(viewDate)}</div>
          {!isToday&&<div style={{fontSize:11,color:isPast?'#9ca3af':'#a78bfa',marginTop:2}}>{isPast?'📖 과거 기록 (읽기 전용)':'🔮 미래 미리보기'}</div>}
        </div>
        <button onClick={()=>navigate(1)} style={{background:'none',border:'none',cursor:'pointer',fontSize:18,color:theme.primary,padding:'2px 6px',width:'auto',margin:0}}>›</button>
        {!isToday&&<button onClick={goToday} style={{padding:'5px 10px',borderRadius:20,border:`1.5px solid ${theme.mid}`,background:theme.light,color:theme.primary,fontSize:11,fontWeight:700,cursor:'pointer',width:'auto',margin:0}}>오늘</button>}
      </div>

      {/* 이번 주 요일 바 */}
      <div style={{background:C.card,borderRadius:14,padding:'12px 14px',border:`1.5px solid ${C.border}`,marginBottom:12}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <div style={{fontSize:12,fontWeight:700,color:C.text2}}>이번 주</div>
          <button onClick={()=>setShowCalendar(v=>!v)} style={{fontSize:11,color:theme.primary,background:'none',border:'none',cursor:'pointer',width:'auto',margin:0,fontWeight:600}}>📅 {showCalendar?'달력 닫기':'월간 달력 보기'}</button>
        </div>
        <div style={{display:'flex',gap:4}}>
          {weekDates.map((ds,i)=>{
            const DAY_KR2=['일','월','화','수','목','금','토'];
            const isSelected = ds === viewDate;
            const isTod = ds === todayStr;
            const achiev = getWeekDayAchiev(ds);
            return (
              <button key={ds} onClick={()=>{setViewDate(ds);setShowCalendar(false);}} style={{
                flex:1,height:42,borderRadius:10,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                fontSize:11,fontWeight:700,gap:1,
                background:isSelected?theme.primary:achiev?.bg||'#f9fafb',
                color:isSelected?'#fff':isTod?theme.primary:achiev?.color||'#9ca3af',
                border:isSelected?'none':isTod?`1.5px solid ${theme.border}`:achiev?`1.5px solid ${achiev.border}`:'1px solid #f3f4f6',
                cursor:'pointer',width:'auto',margin:0,transition:'all 0.15s',
              }}>
                <span>{DAY_KR2[i]}</span>
                {achiev&&!isSelected&&<span style={{fontSize:9,lineHeight:1}}>{achiev.emoji}</span>}
                {isTod&&!achiev&&!isSelected&&<div style={{width:4,height:4,borderRadius:'50%',background:theme.primary}}/>}
              </button>
            );
          })}
        </div>
      </div>

      {/* 월간 달력 */}
      {showCalendar&&(
        <MonthlyCalendar weeklyLog={weeklyLog||{}} lifeItems={lifeItems} viewDate={viewDate} onSelectDate={ds=>{setViewDate(ds);setShowCalendar(false);}}/>
      )}

      {/* 달성 카드 */}
      <div style={{background:cardBg,borderRadius:18,padding:'17px 20px',marginBottom:14,color:achievLevel?achievLevel.badgeColor:'#fff'}}>
        <div style={{display:'flex',alignItems:'center',gap:18}}>
          {/* 원형 게이지 */}
          <div style={{position:'relative',width:78,height:78,flexShrink:0}}>
            <svg width={78} height={78} style={{transform:'rotate(-90deg)'}}>
              <circle cx={39} cy={39} r={30} fill="none" stroke={achievLevel?achievLevel.gaugeBg:'rgba(255,255,255,0.25)'} strokeWidth={8}/>
              <circle cx={39} cy={39} r={30} fill="none" stroke={gaugeStroke} strokeWidth={8}
                strokeDasharray={`${2*Math.PI*30*pct/100} ${2*Math.PI*30}`} strokeLinecap="round"
                style={{transition:'stroke-dasharray 0.6s ease'}}/>
            </svg>
            <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:800,color:achievLevel?achievLevel.badgeColor:'#fff'}}>{pct}%</div>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,opacity:achievLevel?0.7:0.85,marginBottom:2,color:achievLevel?C.text2:'#fff'}}>{dateLabel(viewDate)} 달성률</div>
            <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:6}}>
              <div style={{fontSize:15,fontWeight:700,color:achievLevel?achievLevel.badgeColor:'#fff'}}>{doneToday}/{totalToday} 완료</div>
              {achievLevel&&(
                <span style={{fontSize:11,fontWeight:800,color:achievLevel.badgeColor,background:achievLevel.badgeBg,padding:'2px 9px',borderRadius:20,border:`1.5px solid ${achievLevel.badgeBorder}`}}>
                  {achievLevel.emoji} {achievLevel.label}
                </span>
              )}
            </div>
            <div style={{height:6,background:achievLevel?achievLevel.gaugeBg:'rgba(255,255,255,0.25)',borderRadius:8,overflow:'hidden'}}>
              <div style={{width:`${pct}%`,height:'100%',background:gaugeStroke,borderRadius:8,transition:'width 0.5s ease'}}/>
            </div>
            <div style={{marginTop:5,display:'flex',gap:10,fontSize:11,color:achievLevel?'#6b7280':'rgba(255,255,255,0.75)'}}>
              <span>🌱 1개↑</span><span>💪 50%↑</span><span>🔥 100%</span>
            </div>
          </div>
          <div style={{textAlign:'center',flexShrink:0}}>
            <div style={{fontSize:24,fontWeight:800,color:achievLevel?achievLevel.badgeColor:'#fff'}}>🔥{(streak||{count:0}).count}</div>
            <div style={{fontSize:10,opacity:0.8,color:achievLevel?'#6b7280':'rgba(255,255,255,0.75)'}}>연속</div>
          </div>
        </div>
      </div>

      {/* 과거 / 미래 안내 */}
      {isPast&&(
        <div style={{background:'var(--bg-page)',borderRadius:14,padding:'12px 16px',border:`1.5px solid ${C.border2}`,marginBottom:12,fontSize:13,color:C.muted,textAlign:'center'}}>
          📖 과거 날짜예요. 읽기 전용으로 표시돼요.
        </div>
      )}
      {isFuture&&(
        <div style={{background:'#fdf4ff',borderRadius:14,padding:'12px 16px',border:'1.5px solid #e9d5ff',marginBottom:12,fontSize:13,color:'#7c3aed',textAlign:'center'}}>
          🔮 미래 날짜예요. 루틴 구성 미리보기만 가능해요.
        </div>
      )}

      {/* ✅ 오늘 할 일 섹션 */}
      <div style={{marginBottom:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <div style={{fontSize:14,fontWeight:800,color:C.text}}>
            ✅ {isToday?'오늘':dateLabel(viewDate)} 할 일
            {totalToday>0&&<span style={{marginLeft:7,fontSize:11,fontWeight:700,color:'#fff',background:theme.primary,padding:'2px 8px',borderRadius:20}}>{totalToday}</span>}
          </div>
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            {isToday&&todayUndone.length>1&&(
              <button onClick={()=>setSortMode(v=>!v)} style={{
                fontSize:11,fontWeight:700,padding:'4px 10px',borderRadius:20,cursor:'pointer',width:'auto',margin:0,
                border:`1.5px solid ${sortMode?theme.primary:'#e5e7eb'}`,
                background:sortMode?theme.light:C.card,
                color:sortMode?theme.primary:'#9ca3af',
              }}>{sortMode?'✓ 완료':'⇅ 순서'}</button>
            )}
            {isToday&&<button onClick={()=>openAdd('루틴')} style={{fontSize:11,color:theme.primary,background:'none',border:'none',cursor:'pointer',fontWeight:600,width:'auto',margin:0}}>+ 추가</button>}
          </div>
        </div>

        {totalToday === 0 ? (
          <div style={{background:C.card,borderRadius:16,padding:'28px',textAlign:'center',color:C.muted,fontSize:13,border:`1.5px solid ${C.border}`}}>
            <div style={{fontSize:30,marginBottom:7}}>✨</div>
            {isFuture?'미래 날짜는 루틴 구성 미리보기예요':'이 날은 할 일이 없어요'}
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {/* 미완료 — 섹션별 그룹 */}
            {['루틴','생활','청소'].map(sec => {
              const secItems = todayUndone.filter(c=>c.section===sec);
              if(secItems.length===0) return null;
              const SECTIONS_MAP = {'루틴':{icon:'🌀',color:'#7c3aed',bg:'#f5f3ff',border:'#ddd6fe'},'생활':{icon:'🏠',color:'#2563eb',bg:'#eff6ff',border:'#bfdbfe'},'청소':{icon:'🧹',color:'#16a34a',bg:'#f0fdf4',border:'#bbf7d0'}};
              const s = SECTIONS_MAP[sec];
              return (
                <div key={sec}>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6,paddingLeft:2}}>
                    <span style={{fontSize:13}}>{s.icon}</span>
                    <span style={{fontSize:12,fontWeight:700,color:s.color}}>{sec}</span>
                    <span style={{fontSize:11,color:C.muted,background:s.bg,padding:'1px 7px',borderRadius:20,border:`1px solid ${s.border}`}}>{secItems.length}개</span>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:6,paddingLeft:4,borderLeft:`2px solid ${s.border}`}}>
                    {secItems.map((c,idx)=>{
                      const globalIdx = todayUndone.indexOf(c);
                      return (
                        <LifeItemCard key={c.id} c={c} onToggle={onToggle} onDelete={onDelete} openEdit={openEdit} updateStreak={updateStreak} lifeItems={lifeItems} viewDate={viewDate} isReadOnly={isPast||isFuture}
                          showMoveButtons={sortMode&&isToday}
                          onMoveUp={globalIdx>0?()=>handleMoveUp(c.id):null}
                          onMoveDown={globalIdx<todayUndone.length-1?()=>handleMoveDown(c.id):null}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {/* 완료 구분선 */}
            {todayDone.length>0&&todayUndone.length>0&&(
              <div style={{display:'flex',alignItems:'center',gap:8,margin:'4px 0'}}>
                <div style={{flex:1,height:1,background:C.border2}}/>
                <span style={{fontSize:11,color:C.muted,fontWeight:600}}>완료된 항목</span>
                <div style={{flex:1,height:1,background:C.border2}}/>
              </div>
            )}
            {todayDone.length>0&&todayUndone.length===0&&(
              <div style={{display:'flex',alignItems:'center',gap:8,margin:'4px 0'}}>
                <div style={{flex:1,height:1,background:'#bbf7d0'}}/>
                <span style={{fontSize:11,color:'#16a34a',fontWeight:700}}>✓ 모두 완료!</span>
                <div style={{flex:1,height:1,background:'#bbf7d0'}}/>
              </div>
            )}
            {/* 완료된 항목들 */}
            {todayDone.map(c=>(
              <LifeItemCard key={c.id} c={c} onToggle={onToggle} onDelete={onDelete} openEdit={openEdit} updateStreak={updateStreak} lifeItems={lifeItems} viewDate={viewDate} isReadOnly={isPast||isFuture}/>
            ))}
          </div>
        )}
      </div>

      {/* 📅 예정된 관리 섹션 */}
      {scheduledItems.length > 0 && (
        <div style={{marginBottom:16}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
            <div style={{fontSize:14,fontWeight:800,color:C.text}}>
              📅 예정된 관리
              <span style={{marginLeft:7,fontSize:11,fontWeight:700,color:'#fff',background:'#6b7280',padding:'2px 8px',borderRadius:20}}>{scheduledItems.length}</span>
            </div>
            <button onClick={()=>setScheduledOpen(v=>!v)} style={{fontSize:11,color:C.muted,background:'none',border:'none',cursor:'pointer',width:'auto',margin:0}}>{scheduledOpen?'접기 ▲':'펼치기 ▼'}</button>
          </div>
          {scheduledOpen&&(
            <div style={{display:'flex',flexDirection:'column',gap:7}}>
              {scheduledItems
                .sort((a,b)=>{
                  const adLeft = a.section!=='루틴'&&a.lastDone ? calcDaysLeft(addDays(a.lastDone,a.intervalDays)) : 999;
                  const bdLeft = b.section!=='루틴'&&b.lastDone ? calcDaysLeft(addDays(b.lastDone,b.intervalDays)) : 999;
                  return adLeft - bdLeft;
                })
                .map(c=>(
                  <ScheduledItemCard key={c.id} c={c} onDelete={onDelete} openEdit={openEdit} viewDate={viewDate}/>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 추가 모달 — today 탭 외부, 항상 렌더 */}
      </>)} {/* end lifeTab==='today' */}

      {/* 추가 모달 */}
      {showAddModal&&(
        <Modal title={editTarget?'항목 수정':'+ 생활 관리 추가'} sub="루틴·생활·청소를 주기로 관리해요" onClose={()=>setShowAddModal(false)} maxWidth={440}>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={{display:'grid',gridTemplateColumns:'50px 1fr',gap:7}}>
              <div><div style={{fontSize:11,color:C.muted,marginBottom:3}}>이모지</div><input placeholder="💧" value={form.emoji} onChange={e=>setForm(p=>({...p,emoji:e.target.value}))} maxLength={2} style={inp({textAlign:'center',fontSize:20})}/></div>
              <div><div style={{fontSize:11,color:C.muted,marginBottom:3}}>내용 *</div><input placeholder="예: 빨래 돌리기" value={form.text} onChange={e=>setForm(p=>({...p,text:e.target.value}))} style={inp()} autoFocus/></div>
            </div>
            <div>
              <div style={{fontSize:11,color:C.muted,marginBottom:5}}>종류</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6}}>
                {Object.entries(LIFE_SECTIONS).map(([s,sec])=>(
                  <button key={s} onClick={()=>setForm(p=>({...p,section:s,freq:s==='루틴'?'daily':'interval'}))} style={{padding:'10px 5px',borderRadius:11,border:`1.5px solid ${form.section===s?sec.color:sec.border}`,background:form.section===s?sec.bg:C.card,cursor:'pointer',width:'auto',margin:0,textAlign:'center'}}>
                    <div style={{fontSize:16,marginBottom:2}}>{sec.icon}</div>
                    <div style={{fontSize:11,fontWeight:700,color:form.section===s?sec.color:C.text2}}>{sec.label}</div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{background:C.card2,borderRadius:12,padding:'13px',border:`1px solid ${C.border}`}}>
              {form.section==='루틴'?(
                <RepeatPicker form={form} setForm={setForm}/>
              ):(
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  <div style={{fontSize:11,color:C.muted,fontWeight:600}}>반복 주기</div>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontSize:12,color:C.muted,whiteSpace:'nowrap'}}>매</span>
                    <input type="number" min={1} max={365} value={form.intervalDays||7} onChange={e=>setForm(p=>({...p,intervalDays:Number(e.target.value)}))} style={inp({width:80,textAlign:'center'})}/>
                    <span style={{fontSize:12,color:C.muted,whiteSpace:'nowrap'}}>일마다</span>
                  </div>
                  <div style={{fontSize:11,color:theme.primary,background:theme.light,padding:'6px 10px',borderRadius:8,fontWeight:600}}>⏱ {form.intervalDays||7}일마다 한 번</div>
                </div>
              )}
            </div>
            {(form.section==='청소'||form.section==='생활')&&(
              <div><div style={{fontSize:11,color:C.muted,marginBottom:3}}>메모 (선택)</div>
                <textarea placeholder="나중에 볼 수 있는 메모" value={form.guide||''} onChange={e=>setForm(p=>({...p,guide:e.target.value}))} rows={2} style={inp({resize:'none',lineHeight:1.5})}/>
              </div>
            )}
            <div style={{display:'flex',gap:8,marginTop:2}}>
              <Btn onClick={submitForm} style={{flex:1}}>{editTarget?'수정하기':'추가하기'}</Btn>
              <Btn onClick={()=>setShowAddModal(false)} variant="outline" style={{flex:1}}>취소</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* 추천 팩 모달 */}
      {showPackModal&&(
        <Modal title="✨ 추천 생활 관리" sub="자취 생활에 맞는 항목을 추가해보세요" onClose={()=>setShowPackModal(false)} maxWidth={440}>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {Object.entries(ONBOARDING_PRESETS).map(([label,items])=>(
              <div key={label} style={{background:C.card2,borderRadius:14,padding:'14px 16px',border:`1.5px solid ${C.border}`}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <div style={{fontSize:14,fontWeight:700,color:C.text}}>{label}</div>
                  <Btn size="sm" onClick={()=>{items.forEach(item=>{if(!lifeItems.some(c=>c.text===item.text))onAdd({id:Date.now()+Math.random(),...item,done:false,lastDone:null,freqDays:item.freqDays||[],createdAt:new Date().toISOString()});});setShowPackModal(false);}}>전체 추가</Btn>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:5}}>
                  {items.map((item,idx)=>{
                    const already=lifeItems.some(c=>c.text===item.text);
                    const sec=LIFE_SECTIONS[item.section];
                    return <div key={idx} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderRadius:9,background:C.card,border:`1px solid ${C.border2}`}}>
                      <span style={{fontSize:15}}>{item.emoji}</span>
                      <span style={{flex:1,fontSize:13,color:C.text2}}>{item.text}</span>
                      <span style={{fontSize:10,color:sec.color,background:sec.bg,padding:'1px 6px',borderRadius:20,border:`1px solid ${sec.border}`,fontWeight:600}}>{sec.icon} {item.section}</span>
                      <span style={{fontSize:10,color:C.muted}}>{item.freq==='daily'?'매일':item.intervalDays?`${item.intervalDays}일`:'매주'}</span>
                      {already?<span style={{fontSize:11,color:'#16a34a',fontWeight:700}}>✓</span>:<button onClick={()=>onAdd({id:Date.now(),...item,done:false,lastDone:null,freqDays:item.freqDays||[],createdAt:new Date().toISOString()})} style={{padding:'3px 8px',borderRadius:8,border:`1px solid ${C.border2}`,background:C.card,color:theme.primary,fontSize:11,fontWeight:700,cursor:'pointer',width:'auto',margin:0}}>추가</button>}
                    </div>;
                  })}
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
