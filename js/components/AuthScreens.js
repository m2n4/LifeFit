// ============================================================
// AuthScreens.js — useFirebase 훅 + WelcomeScreen + AuthScreen
// ============================================================
function useFirebase() {
  const [fb, setFb] = React.useState(window._firebase || null);
  React.useEffect(() => {
    if(window._firebaseReady) { setFb(window._firebase); return; }
    const handler = () => setFb(window._firebase);
    window.addEventListener('firebaseReady', handler);
    return () => window.removeEventListener('firebaseReady', handler);
  }, []);
  return fb;
}

// ============================================================
// AUTH SCREENS
// ============================================================
function WelcomeScreen({onStart, onLogin}) {
  return (
    <div className="fade-in" style={{minHeight:'100vh',background:'linear-gradient(160deg,#f5f3ff 0%,#ede9fe 50%,#ddd6fe 100%)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{textAlign:'center',maxWidth:380,width:'100%'}}>
        <div style={{fontSize:64,marginBottom:16,filter:'drop-shadow(0 4px 12px rgba(124,58,237,0.3))'}}>🏠</div>
        <h1 style={{fontSize:32,fontWeight:900,color:'#7c3aed',marginBottom:8,letterSpacing:'-1px'}}>LifeFit</h1>
        <p style={{fontSize:16,color:'#6d28d9',marginBottom:6,fontWeight:600}}>혼자 사는 생활, 조금 더 쉽게.</p>
        <p style={{fontSize:14,color:'#a78bfa',marginBottom:40,lineHeight:1.6}}>식재료 · 생활 루틴 · 청소 주기<br/>모두 한 곳에서 관리해요</p>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <button onClick={onStart} style={{width:'100%',padding:'16px',borderRadius:18,border:'none',background:'#7c3aed',color:'#fff',fontSize:16,fontWeight:700,cursor:'pointer',boxShadow:'0 8px 24px rgba(124,58,237,0.35)'}}>
            시작하기 →
          </button>
          <button onClick={onLogin} style={{width:'100%',padding:'15px',borderRadius:18,border:'2px solid #ddd6fe',background:C.card,color:'#7c3aed',fontSize:15,fontWeight:600,cursor:'pointer'}}>
            이미 계정이 있어요
          </button>
        </div>
        <p style={{fontSize:12,color:'#c4b5fd',marginTop:24}}>로그인하면 모든 기기에서 동기화돼요 ✨</p>
      </div>
    </div>
  );
}

function AuthScreen({mode, onSuccess, onBack}) {
  const fb = useFirebase();
  const [isLogin, setIsLogin] = React.useState(mode === 'login');
  const [email, setEmail] = React.useState('');
  const [pw, setPw] = React.useState('');
  const [name, setName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  async function handleEmail(e) {
    e.preventDefault();
    if(!fb) return;
    setLoading(true); setError('');
    try {
      let cred;
      if(isLogin) {
        cred = await fb.signInWithEmailAndPassword(fb.auth, email, pw);
      } else {
        cred = await fb.createUserWithEmailAndPassword(fb.auth, email, pw);
        if(name.trim()) await fb.updateProfile(cred.user, {displayName: name.trim()});
      }
      // updateProfile 직후엔 displayName이 반영 안 될 수 있어서 name을 직접 전달
      onSuccess(cred.user, name.trim() || cred.user.displayName || '');
    } catch(err) {
      const msgs = {
        'auth/user-not-found':'등록된 이메일이 없어요',
        'auth/wrong-password':'비밀번호가 틀렸어요',
        'auth/email-already-in-use':'이미 사용 중인 이메일이에요',
        'auth/weak-password':'비밀번호는 6자 이상이어야 해요',
        'auth/invalid-email':'이메일 형식이 올바르지 않아요',
        'auth/invalid-credential':'이메일 또는 비밀번호가 틀렸어요',
      };
      setError(msgs[err.code] || '오류가 발생했어요. 다시 시도해주세요.');
    }
    setLoading(false);
  }

  async function handleGoogle() {
    if(!fb) return;
    setLoading(true); setError('');
    try {
      const cred = await fb.signInWithPopup(fb.auth, fb.googleProvider);
      onSuccess(cred.user, cred.user.displayName || '');
    } catch(err) {
      setError('구글 로그인에 실패했어요.');
    }
    setLoading(false);
  }

  const inputStyle = {width:'100%',padding:'13px 16px',border:`1.5px solid ${C.border2}`,borderRadius:14,fontSize:14,outline:'none',background:C.input,boxSizing:'border-box',transition:'border-color 0.15s'};

  return (
    <div className="fade-in" style={{minHeight:'100vh',background:'linear-gradient(160deg,#f5f3ff,#ede9fe)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:C.card,borderRadius:28,padding:'32px 28px',width:'100%',maxWidth:380,boxShadow:'0 24px 64px rgba(124,58,237,0.15)'}}>
        <button onClick={onBack} style={{background:'none',border:'none',cursor:'pointer',color:C.muted,fontSize:13,padding:0,marginBottom:20,display:'flex',alignItems:'center',gap:5,width:'auto'}}>
          ← 뒤로
        </button>
        <div style={{fontSize:26,marginBottom:6}}>🏠</div>
        <div style={{fontSize:20,fontWeight:800,color:C.text,marginBottom:4}}>
          {isLogin ? '다시 만나서 반가워요!' : '함께 시작해요!'}
        </div>
        <div style={{fontSize:13,color:C.muted,marginBottom:24}}>
          {isLogin ? '로그인하고 생활 관리를 계속해요' : '무료로 시작하고 모든 기기에서 동기화해요'}
        </div>

        {/* 구글 로그인 */}
        <button onClick={handleGoogle} disabled={loading} style={{width:'100%',padding:'13px',borderRadius:14,border:`1.5px solid ${C.border2}`,background:C.card,fontSize:14,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginBottom:16,color:C.text2}}>
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.6 2.5 30.1 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.8 6c1.8-5.4 6.8-9.8 13.6-9.8z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17z"/><path fill="#FBBC05" d="M10.4 28.7A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.8-6z"/><path fill="#34A853" d="M24 48c6.1 0 11.2-2 14.9-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.4 2.2-6.7 0-12.4-4.5-14.4-10.6l-7.8 6C6.5 42.5 14.6 48 24 48z"/></svg>
          Google로 {isLogin?'로그인':'시작하기'}
        </button>

        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
          <div style={{flex:1,height:1,background:C.card3}}/>
          <span style={{fontSize:12,color:C.muted}}>또는</span>
          <div style={{flex:1,height:1,background:C.card3}}/>
        </div>

        <form onSubmit={handleEmail} style={{display:'flex',flexDirection:'column',gap:10}}>
          {!isLogin&&(
            <input placeholder="이름 (닉네임 가능)" value={name} onChange={e=>setName(e.target.value)} style={inputStyle}
              onFocus={e=>e.target.style.borderColor='#7c3aed'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
          )}
          <input type="email" placeholder="이메일" value={email} onChange={e=>setEmail(e.target.value)} required style={inputStyle}
            onFocus={e=>e.target.style.borderColor='#7c3aed'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
          <input type="password" placeholder="비밀번호 (6자 이상)" value={pw} onChange={e=>setPw(e.target.value)} required style={inputStyle}
            onFocus={e=>e.target.style.borderColor='#7c3aed'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
          {error&&<div style={{fontSize:12,color:'#ef4444',background:'#fef2f2',padding:'9px 12px',borderRadius:10,border:'1px solid #fecaca'}}>{error}</div>}
          <button type="submit" disabled={loading} style={{width:'100%',padding:'14px',borderRadius:14,border:'none',background:loading?'#a78bfa':'#7c3aed',color:'#fff',fontSize:15,fontWeight:700,cursor:loading?'default':'pointer',marginTop:4}}>
            {loading?'처리 중...': isLogin?'로그인':'가입하기'}
          </button>
        </form>

        <button onClick={()=>{setIsLogin(!isLogin);setError('');}} style={{width:'100%',marginTop:14,padding:'10px',borderRadius:12,border:'none',background:'transparent',color:'#7c3aed',fontSize:13,cursor:'pointer',fontWeight:600}}>
          {isLogin?'계정이 없어요 → 회원가입':'이미 계정이 있어요 → 로그인'}
        </button>
      </div>
    </div>
  );
}

// ============================================================
