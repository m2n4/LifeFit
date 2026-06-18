// ============================================================
// SharePage.js — 공유 페이지
// ============================================================
function SharePage({fb, user, lifeItems, foods}) {
  const theme = useTheme();
  const [shareCode, setShareCode] = React.useState('');
  const [inputCode, setInputCode] = React.useState('');
  const [sharedWith, setSharedWith] = React.useState([]);
  const [sharedFrom, setSharedFrom] = React.useState(null);
  const [sharedFromCode, setSharedFromCode] = React.useState('');
  const [partnerStats, setPartnerStats] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState('');

  React.useEffect(()=>{
    if(!fb||!user) return;
    // 내 공유 코드 및 연결 정보 가져오기
    fb.getDoc(fb.doc(fb.db,'users',user.uid)).then(snap=>{
      if((typeof snap.exists === 'function' ? snap.exists() : Boolean(snap.exists))) {
        const d = snap.data();
        setShareCode(d.shareCode||'');
        setSharedWith(d.sharedWith||[]);
        setSharedFrom(d.sharedFrom||null);
        setSharedFromCode(d.sharedFromCode||'');
      }
    });
  },[fb,user]);

  // 연결된 룸메이트 현황 가져오기
  React.useEffect(()=>{
    if(!fb||!sharedFrom) return;
    fb.getDoc(fb.doc(fb.db,'users',sharedFrom)).then(snap=>{
      if((typeof snap.exists === 'function' ? snap.exists() : Boolean(snap.exists))) {
        const d = snap.data();
        setPartnerStats({name: d.name||'룸메이트', animal: d.animal||'🐻'});
      }
    });
  },[fb,sharedFrom]);

  async function generateCode() {
    if(!fb||!user) return;
    const code = Math.random().toString(36).slice(2,8).toUpperCase();
    await fb.updateDoc(fb.doc(fb.db,'users',user.uid), {shareCode:code});
    setShareCode(code);
  }

  async function connectShare() {
    if(!fb||!user||!inputCode.trim()) return;
    setLoading(true); setMsg('');
    try {
      const code = inputCode.trim().toUpperCase();
      // shareCode로 상대방 유저 검색
      const q = fb.query(
        fb.collection(fb.db, 'users'),
        fb.where('shareCode', '==', code)
      );
      const snap = await fb.getDocs(q);
      if(snap.empty) {
        setMsg('해당 코드를 가진 사용자를 찾을 수 없어요.');
        setLoading(false);
        return;
      }
      const partnerDoc = snap.docs[0];
      const partnerId = partnerDoc.id;
      if(partnerId === user.uid) {
        setMsg('내 코드는 입력할 수 없어요.');
        setLoading(false);
        return;
      }
      // 내 문서에 sharedFrom(상대 uid) 저장
      await fb.updateDoc(fb.doc(fb.db,'users',user.uid), {
        sharedFrom: partnerId,
        sharedFromCode: code,
      });
      // 상대방 문서에도 나를 sharedWith에 추가
      const partnerData = partnerDoc.data();
      const partnerSharedWith = partnerData.sharedWith || [];
      if(!partnerSharedWith.includes(user.uid)) {
        await fb.updateDoc(fb.doc(fb.db,'users',partnerId), {
          sharedWith: [...partnerSharedWith, user.uid],
        });
      }
      setSharedFrom(partnerId);
      setMsg('✅ 룸메이트와 연결됐어요!');
    } catch(e) {
      console.error(e);
      setMsg('오류가 발생했어요. 다시 시도해주세요.');
    }
    setLoading(false);
  }

  // 공유된 내 오늘 현황
  const todayStr = getToday();
  const todayDue = lifeItems.filter(c=>isDueOn(c,todayStr));
  const todayDoneCount = todayDue.filter(c=>isDoneOn(c,todayStr)).length;

  return (
    <div>
      <div style={{marginBottom:18}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{fontSize:21,fontWeight:800,color:C.text}}>👥 공유</div>
          <PageHelp pageId="share"/>
        </div>
        <div style={{fontSize:13,color:C.muted,marginTop:3}}>룸메이트와 생활 관리를 함께해요</div>
      </div>

      {/* 내 공유 코드 */}
      <div style={{background:'linear-gradient(135deg,'+theme.bg+','+theme.light+')',borderRadius:18,padding:'20px',marginBottom:14,border:`1.5px solid ${theme.mid}`}}>
        <div style={{fontSize:13,fontWeight:700,color:theme.primary,marginBottom:8}}>📤 내 공유 코드</div>
        {shareCode ? (
          <div>
            <div style={{fontSize:32,fontWeight:900,color:theme.primary,letterSpacing:4,textAlign:'center',padding:'12px',background:C.card,borderRadius:12,border:`2px dashed ${theme.border}`,marginBottom:8}}>{shareCode}</div>
            <div style={{fontSize:11,color:C.muted,textAlign:'center'}}>이 코드를 룸메이트에게 알려주세요</div>
            <button onClick={()=>{navigator.clipboard?.writeText(shareCode);setMsg('복사됐어요!');setTimeout(()=>setMsg(''),2000);}} style={{width:'100%',marginTop:8,padding:'9px',borderRadius:10,border:`1.5px solid ${theme.mid}`,background:C.card,color:theme.primary,fontSize:12,fontWeight:700,cursor:'pointer',margin:0}}>코드 복사</button>
          </div>
        ):(
          <button onClick={generateCode} style={{width:'100%',padding:'12px',borderRadius:12,border:'none',background:theme.primary,color:C.card,fontSize:14,fontWeight:700,cursor:'pointer',margin:0}}>공유 코드 생성</button>
        )}
      </div>

      {/* 코드로 연결 */}
      <div style={{background:C.card,borderRadius:18,padding:'20px',marginBottom:14,border:`1.5px solid ${C.border}`}}>
        <div style={{fontSize:13,fontWeight:700,color:C.text2,marginBottom:10}}>📥 룸메이트 코드 입력</div>
        <div style={{display:'flex',gap:7}}>
          <input value={inputCode} onChange={e=>setInputCode(e.target.value.toUpperCase())} maxLength={6}
            placeholder="6자리 코드"
            style={{flex:1,padding:'11px 14px',border:`1.5px solid ${C.border2}`,borderRadius:11,fontSize:16,outline:'none',letterSpacing:3,fontWeight:700,textTransform:'uppercase'}}
            onFocus={e=>e.target.style.borderColor=theme.primary}
            onBlur={e=>e.target.style.borderColor='#e5e7eb'}
          />
          <button onClick={connectShare} disabled={loading||inputCode.length<6} style={{padding:'11px 16px',borderRadius:11,border:'none',background:inputCode.length>=6?theme.primary:'#e5e7eb',color:inputCode.length>=6?'#fff':'#9ca3af',fontSize:14,fontWeight:700,cursor:inputCode.length>=6?'pointer':'default',width:'auto',margin:0}}>연결</button>
        </div>
        {sharedFrom&&<div style={{marginTop:8,fontSize:12,color:'#16a34a',fontWeight:600}}>✓ {sharedFromCode||sharedFrom} 코드와 연결됐어요 {partnerStats?`(${partnerStats.animal} ${partnerStats.name})`:''}</div>}
        {msg&&<div style={{marginTop:8,fontSize:12,color:theme.primary,fontWeight:600}}>{msg}</div>}
      </div>

      {/* 내 현황 미리보기 */}
      <div style={{background:C.card,borderRadius:18,padding:'20px',border:`1.5px solid ${C.border}`}}>
        <div style={{fontSize:13,fontWeight:700,color:C.text2,marginBottom:10}}>📊 공유될 내 현황</div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <div style={{display:'flex',justifyContent:'space-between',padding:'10px 12px',background:C.card2,borderRadius:10}}>
            <span style={{fontSize:13,color:C.text3}}>오늘 달성</span>
            <span style={{fontSize:13,fontWeight:700,color:theme.primary}}>{todayDoneCount}/{todayDue.length}개</span>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',padding:'10px 12px',background:C.card2,borderRadius:10}}>
            <span style={{fontSize:13,color:C.text3}}>등록 식재료</span>
            <span style={{fontSize:13,fontWeight:700,color:C.text2}}>{foods.length}개</span>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',padding:'10px 12px',background:C.card2,borderRadius:10}}>
            <span style={{fontSize:13,color:C.text3}}>생활 관리 항목</span>
            <span style={{fontSize:13,fontWeight:700,color:C.text2}}>{lifeItems.length}개</span>
          </div>
        </div>
        <div style={{marginTop:10,fontSize:11,color:C.muted,textAlign:'center'}}>💡 공유 기능은 현재 베타 버전이에요</div>
      </div>

      {/* 룸메이트 현황 */}
      {partnerStats && (
        <div style={{background:`linear-gradient(135deg,${theme.bg},${theme.light})`,borderRadius:18,padding:'20px',marginTop:14,border:`1.5px solid ${theme.mid}`}}>
          <div style={{fontSize:13,fontWeight:700,color:theme.primary,marginBottom:10}}>
            {partnerStats.animal} {partnerStats.name}의 현황
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <div style={{display:'flex',justifyContent:'space-between',padding:'10px 12px',background:C.card,borderRadius:10}}>
              <span style={{fontSize:13,color:C.text3}}>연결 상태</span>
              <span style={{fontSize:13,fontWeight:700,color:'#16a34a'}}>✓ 연결됨</span>
            </div>
            <div style={{fontSize:11,color:C.muted,textAlign:'center',padding:'8px'}}>
              💡 룸메이트가 앱을 사용하면 실시간 현황이 여기 표시돼요
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ============================================================
// FIREBASE HOOKS
// ============================================================
