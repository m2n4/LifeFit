// ============================================================
// App.js — 최상위 컴포넌트: 인증 흐름 + 전체 레이아웃
// ============================================================
// APP ROOT — Firebase 통합
// ============================================================
function App() {
  const fb = useFirebase();
  const [authState, setAuthState] = React.useState('loading'); // loading | welcome | login | signup | onboarding | app
  const [user, setUser] = React.useState(null);

  // Firebase Auth 상태 감지
  React.useEffect(() => {
    if(!fb) return;
    const unsub = fb.onAuthStateChanged(fb.auth, async (u) => {
      if(u) {
        setUser(u);
        // Firestore에서 온보딩 완료 여부 확인
        const snap = await fb.getDoc(fb.doc(fb.db, 'users', u.uid));
        if((typeof snap.exists === 'function' ? snap.exists() : Boolean(snap.exists)) && snap.data().onboarded) {
          setAuthState('app');
        } else {
          setAuthState('onboarding');
        }
      } else {
        setUser(null);
        setAuthState('welcome');
      }
    });
    return () => unsub();
  }, [fb]);

  // ── Firestore 실시간 동기화 ──
  const [foods, setFoods] = React.useState([]);
  const [lifeItems, setLifeItems] = React.useState([]);
  const [streak, setStreak] = React.useState({count:0, lastDate:null});
  const [weeklyLog, setWeeklyLog] = React.useState({});
  const [userName, setUserName] = React.useState('');
  const [animal, setAnimal] = React.useState('🐻');
  const [themeId, setThemeId] = React.useState('purple');
  const [customSections, setCustomSections] = React.useState({});
  const [darkMode, setDarkMode] = React.useState(false);

  // 다크모드 body class 토글 → CSS 변수 자동 전환
  React.useEffect(() => {
    if(darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  React.useEffect(() => {
    if(!fb || !user || authState !== 'app') return;
    const uid = user.uid;

    // 프로필
    fb.getDoc(fb.doc(fb.db, 'users', uid)).then(snap => {
      if((typeof snap.exists === 'function' ? snap.exists() : Boolean(snap.exists))) {
        const d = snap.data();
        setUserName(d.name || user.displayName || '');
        setStreak(d.streak || {count:0, lastDate:null});
        setWeeklyLog(d.weeklyLog || {});
        setAnimal(d.animal || '🐻');
        setThemeId(d.themeId || 'purple');
        setCustomSections(d.customSections || {});
        setDarkMode(d.darkMode || false);
      }
    });

    // 식재료 실시간
    const unsubFood = fb.onSnapshot(fb.collection(fb.db, 'users', uid, 'foods'), snap => {
      setFoods(snap.docs.map(d => {
        const data = d.data();
        return {...data, id: d.id}; // d.id (Firestore) always wins — override any stored id field
      }));
    });
    // 생활관리 실시간
    const unsubLife = fb.onSnapshot(fb.collection(fb.db, 'users', uid, 'lifeItems'), snap => {
      setLifeItems(snap.docs.map(d => {
        const data = d.data();
        return {...data, id: d.id}; // d.id (Firestore) always wins
      }));
    });
    return () => { unsubFood(); unsubLife(); };
  }, [fb, user, authState]);

  // ── Firestore CRUD ──
  async function addFood(f) {
    if(!fb||!user) return;
    const {id, ...data} = f; // Firestore auto-generates its own id
    await fb.addDoc(fb.collection(fb.db,'users',user.uid,'foods'), data);
  }
  async function deleteFood(id) {
    if(!fb||!user) return;
    await fb.deleteDoc(fb.doc(fb.db,'users',user.uid,'foods',id));
  }
  async function editFood(id, data) {
    if(!fb||!user) return;
    await fb.updateDoc(fb.doc(fb.db,'users',user.uid,'foods',id), data);
  }
  async function addLife(c) {
    if(!fb||!user) return;
    const {id, ...data} = c; // Firestore auto-generates its own id
    await fb.addDoc(fb.collection(fb.db,'users',user.uid,'lifeItems'), data);
  }
  async function toggleLife(id) {
    if(!fb||!user) return;
    const item = lifeItems.find(c=>c.id===id);
    if(!item) return;
    const todayStr = getToday();
    const isDoneToday = item.lastDone === todayStr;
    if(!isDoneToday) {
      // 완료: lastDone = 오늘, done = true
      await fb.updateDoc(fb.doc(fb.db,'users',user.uid,'lifeItems',id), {
        done: true,
        lastDone: todayStr,
      });
    } else {
      // 완료 취소: lastDone을 어제로 복원 (주기 계산 유지)
      const yesterday = addDays(todayStr, -1);
      await fb.updateDoc(fb.doc(fb.db,'users',user.uid,'lifeItems',id), {
        done: false,
        lastDone: yesterday,
      });
    }
  }
  async function deleteLife(id) {
    if(!fb||!user) return;
    await fb.deleteDoc(fb.doc(fb.db,'users',user.uid,'lifeItems',id));
  }
  async function editLife(id, data) {
    if(!fb||!user) return;
    await fb.updateDoc(fb.doc(fb.db,'users',user.uid,'lifeItems',id), data);
  }
  async function updateStreak(routinesDone, routinesTotal) {
    if(!fb||!user) return;
    const todayStr = getToday();
    // 🌱 시작: 1개 이상 완료면 스트릭 달성 (기존 60% → 1개 이상으로 완화)
    if(routinesDone >= 1) {
      if(streak.lastDate === todayStr) return;
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
      const yStr = yesterday.getFullYear()+'-'+String(yesterday.getMonth()+1).padStart(2,'0')+'-'+String(yesterday.getDate()).padStart(2,'0');
      const newCount = streak.lastDate === yStr ? streak.count+1 : 1;
      const pct = routinesTotal ? Math.round(routinesDone/routinesTotal*100) : 0;
      const newStreak = {count:newCount, lastDate:todayStr};
      const newLog = {...weeklyLog, [todayStr]:pct};
      setStreak(newStreak); setWeeklyLog(newLog);
      await fb.updateDoc(fb.doc(fb.db,'users',user.uid), {streak:newStreak, weeklyLog:newLog});
    }
  }
  async function handleLogout() {
    if(!fb) return;
    await fb.signOut(fb.auth);
  }
  async function completeOnboarding(choice, chosenAnimal, chosenTheme) {
    if(!fb||!user) return;
    const uid = user.uid;
    const createdAtISO = new Date().toISOString();
    const todayStr = getToday();
    const presets = (ONBOARDING_PRESETS[choice]||[]).map((item) => ({
      ...item,
      done: false,
      lastDone: null,
      freqDays: item.freqDays || [],
      createdAt: createdAtISO,
      startDate: todayStr,
    }));
    // 중복 방지: 동일한 text의 항목이 이미 있으면 추가하지 않음
    const existingTexts = new Set(lifeItems.map(it => it.text));
    const uniquePresets = presets.filter(p => !existingTexts.has(p.text));
    await fb.setDoc(fb.doc(fb.db,'users',uid), {
      name: userName || user.displayName || '',
      onboarded: true,
      createdAt: fb.serverTimestamp(),
      streak: {count:0, lastDate:null},
      weeklyLog: {},
      animal: chosenAnimal || '🐻',
      themeId: chosenTheme || 'purple',
    }, {merge:true});
    for(const item of uniquePresets) {
      await fb.addDoc(fb.collection(fb.db,'users',uid,'lifeItems'), item);
    }
    setAnimal(chosenAnimal || '🐻');
    setThemeId(chosenTheme || 'purple');
    setAuthState('app');
  }

  const [page, setPage] = React.useState('home');
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const {isMob, isTablet} = useResponsive();
  const PAGE_TITLES = {home:'🏠 홈', food:'🥕 식재료', life:'🌀 생활 관리', shop:'🛒 장보기', report:'📊 월간 리포트', diary:'📝 메모·일기', mission:'🎯 미션', share:'👥 공유', hub:'🔖 추천', tips:'💡 생활 팁', settings:'⚙️ 설정'};

  // ── 로딩 ──
  if(authState === 'loading') return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,var(--bg-page),var(--bg-card))'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:48,marginBottom:12}}>🏠</div>
        <div style={{fontSize:18,fontWeight:700,color:'#7c3aed'}}>LifeFit</div>
        <div style={{fontSize:13,color:'#a78bfa',marginTop:6}}>불러오는 중...</div>
      </div>
    </div>
  );

  if(authState === 'welcome') return (
    <WelcomeScreen
      onStart={()=>setAuthState('signup')}
      onLogin={()=>setAuthState('login')}
    />
  );
  if(authState === 'login' || authState === 'signup') return (
    <AuthScreen
      mode={authState}
      onSuccess={(u, name)=>{ setUser(u); if(name) setUserName(name); }}
      onBack={()=>setAuthState('welcome')}
    />
  );
  if(authState === 'onboarding') return (
    <Onboarding
      userName={userName || user?.displayName || ''}
      onComplete={completeOnboarding}
    />
  );

  // ── 메인 앱 ──
  const currentTheme = getTheme(themeId);
  const MOB_NAV = [
    {id:'home',    emoji:'🏠', label:'홈'},
    {id:'food',    emoji:'🥕', label:'식재료'},
    {id:'life',    emoji:'🌀', label:'생활'},
    {id:'hub',     emoji:'🔖', label:'추천'},
    {id:'settings',emoji:'⚙️', label:'설정'},
  ];
  const isDark = darkMode;
  return (
    <DarkCtx.Provider value={darkMode}>
    <ThemeCtx.Provider value={currentTheme}>
    <CustomSectionsCtx.Provider value={customSections||{}}>
    <div style={{display:'flex',minHeight:'100vh',background:'var(--bg-page)'}}>
      <Sidebar page={page} onNav={p=>{setPage(p);setSidebarOpen(false);}} mobileOpen={sidebarOpen} onClose={()=>setSidebarOpen(false)} userName={userName} onLogout={handleLogout} animal={animal} themeId={themeId} streak={streak}/>

      <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0}}>
        {/* 모바일 상단 바 */}
        <div className="mobile-topbar" style={{background:C.card,padding:'12px 18px',borderBottom:`1px solid ${isDark?'#334155':'#f0edf8'}`,alignItems:'center',gap:13,position:'sticky',top:0,zIndex:30}}>
          <button onClick={()=>setSidebarOpen(true)} style={{background:'none',border:'none',cursor:'pointer',fontSize:22,padding:4,color:currentTheme.primary,width:'auto',margin:0}}>☰</button>
          <div style={{fontSize:15,fontWeight:700,color:C.text,flex:1}}>{PAGE_TITLES[page]}</div>
          <div style={{fontSize:13,fontWeight:900,color:currentTheme.primary}}>🏠 LifeFit</div>
        </div>

        {/* 메인 콘텐츠 */}
        <main style={{flex:1,padding:isMob?'16px 14px 90px':'28px 34px',maxWidth:1060,width:'100%',overflowX:'hidden',background:C.page,minHeight:'100vh'}}>
          {page==='home'&&<HomePage foods={foods} lifeItems={lifeItems} streak={streak} weeklyLog={weeklyLog} onNav={setPage} userName={userName} onQuickAdd={addFood} onQuickCheck={toggleLife}/>}
          {page==='food'&&<FoodPage foods={foods} onAdd={addFood} onDelete={deleteFood} onEdit={editFood} fb={fb} user={user}/>}
          {page==='life'&&<LifePage lifeItems={lifeItems} onAdd={addLife} onToggle={toggleLife} onDelete={deleteLife} onEdit={editLife} streak={streak} weeklyLog={weeklyLog} updateStreak={updateStreak} fb={fb} user={user}/>}
          {page==='report'&&<ReportPage weeklyLog={weeklyLog} lifeItems={lifeItems} foods={foods} streak={streak}/>}
          {page==='diary'&&<DiaryPage fb={fb} user={user}/>}
          {page==='mission'&&<MissionPage streak={streak} lifeItems={lifeItems} weeklyLog={weeklyLog} animal={animal} foods={foods} fb={fb} user={user}/>}
          {page==='share'&&<SharePage fb={fb} user={user} lifeItems={lifeItems} foods={foods}/>}
          {page==='tips'&&<TipsPage/>}
          {page==='hub'&&<HubPage foods={foods} lifeItems={lifeItems} onNav={setPage}/>}
          {page==='settings'&&<SettingsPage user={user} fb={fb} userName={userName} setUserName={setUserName} animal={animal} setAnimal={setAnimal} themeId={themeId} setThemeId={setThemeId} customSections={customSections} setCustomSections={setCustomSections} darkMode={darkMode} setDarkMode={setDarkMode}/>}
        </main>

        {/* 모바일 하단 탭 바 */}
        <div className="mobile-tab-bar" style={{position:'fixed',bottom:0,left:0,right:0,background:C.card,borderTop:`1px solid ${C.divider}`,padding:'6px 0 calc(6px + env(safe-area-inset-bottom))',zIndex:30,justifyContent:'space-around',alignItems:'center',boxShadow:'0 -4px 16px rgba(0,0,0,0.06)'}}>
          {MOB_NAV.map(n=>(
            <button key={n.id} onClick={()=>setPage(n.id)} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,padding:'4px 8px',border:'none',background:'transparent',cursor:'pointer',width:'auto',margin:0,flex:1,maxWidth:80,minWidth:0}}>
              <span style={{fontSize:22,lineHeight:1,filter:page===n.id?'none':'grayscale(0.3)',opacity:page===n.id?1:0.5}}>{n.emoji}</span>
              <span style={{fontSize:10,fontWeight:page===n.id?700:500,color:page===n.id?currentTheme.primary:C.muted,whiteSpace:'nowrap'}}>{n.label}</span>
              {page===n.id&&<div style={{width:20,height:3,borderRadius:2,background:currentTheme.primary,marginTop:1}}/>}
            </button>
          ))}
        </div>
      </div>
    </div>
    </CustomSectionsCtx.Provider>
    </ThemeCtx.Provider>
    </DarkCtx.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
