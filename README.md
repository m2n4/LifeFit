# 🏠 LifeFit — 자취 생활 관리 웹 애플리케이션

> 혼자 사는 생활을 더 쉽게. 식재료 유통기한, 생활 루틴, 청소 주기를 한 곳에서 관리하는 싱글 페이지 웹 앱입니다.

---

## 📋 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | LifeFit |
| 개발 형태 | 싱글 파일 SPA (Single Page Application) |
| 주요 언어 | HTML, CSS, JavaScript (JSX) |
| 프레임워크 | React 18 (CDN) |
| 백엔드 | Firebase (Authentication + Firestore) |
| 빌드 도구 | 없음 (Babel Standalone으로 브라우저 내 트랜스파일) |

---

## ⚙️ 실행 방법

### 사전 준비
- 최신 웹 브라우저 (Chrome, Edge, Firefox 권장)
- 인터넷 연결 필수 (CDN 라이브러리 및 Firebase 사용)
- Firebase 프로젝트 계정 (이미 `index.html` 내에 설정 포함)

### 로컬 실행

`index.html`을 직접 브라우저에서 열면 Firebase 인증이 동작하지 않습니다. 반드시 로컬 웹 서버를 통해 실행해야 합니다.

**방법 1 — Node.js `serve` 패키지 사용 (권장)**
```bash
# serve 설치 (최초 1회)
npm install -g serve

# index.html이 있는 폴더로 이동 후 실행
serve .
```
브라우저에서 `http://localhost:3000` 접속

**방법 2 — Python 내장 HTTP 서버 사용**
```bash
# index.html이 있는 폴더로 이동 후 실행
python -m http.server 8000
```
브라우저에서 `http://localhost:8000` 접속

**방법 3 — VS Code Live Server 확장 사용**
VS Code에서 `index.html`을 열고 우클릭 → `Open with Live Server` 선택

### Firebase 승인 도메인 등록
로컬 서버 실행 후 Google 로그인을 사용하려면 Firebase Console에서 도메인을 등록해야 합니다.

1. [Firebase Console](https://console.firebase.google.com) 접속
2. 프로젝트 선택 → **Authentication** → **Settings** 탭
3. **승인된 도메인** 항목에 `localhost` 추가

---

## 📁 소스코드 구조

전체 소스코드는 `index.html` 단일 파일로 구성되어 있으며, 내부적으로 다음 세 블록으로 나뉩니다.

```
index.html
├── <head>           CSS 변수 (라이트/다크 모드), 반응형 레이아웃 스타일
├── Firebase Script  Firebase SDK 초기화 및 전역 노출 (type="module")
└── React Script     전체 UI 컴포넌트 및 애플리케이션 로직 (type="text/babel")
```

### 🔧 유틸리티 함수 (공통)

| 함수 | 설명 |
|------|------|
| `useLocalStorage(key, init)` | localStorage를 React state와 동기화하는 커스텀 훅 |
| `calcDaysLeft(date)` | 특정 날짜까지 남은 일수 계산 |
| `getFoodStatus(dl)` | 남은 일수에 따라 색상/라벨 반환 (초과/임박/안전) |
| `getToday()` | 오늘 날짜를 `YYYY-MM-DD` 형식으로 반환 |
| `daysSince(dateStr)` | 특정 날짜로부터 경과 일수 계산 |
| `addDays(dateStr, n)` | 날짜에 n일을 더한 날짜 문자열 반환 |
| `getAchievLevel(done, total)` | 달성률에 따라 3단계 뱃지(시작/노력/완벽) 반환 |
| `isTodayItem(repeat, date)` | 반복 설정에 따라 해당 날짜에 할 일인지 판단 |
| `isDoneOn(item, dateStr)` | 특정 날짜에 완료됐는지 판단 (`lastDone` 필드 기준) |
| `isDueOn(item, viewDate)` | 생활/청소 항목이 해당 날짜 기준으로 할 때가 됐는지 판단 |

### 🎨 UI 기반 컴포넌트

| 컴포넌트 | 설명 |
|----------|------|
| `Modal` | 공통 모달 컨테이너 (제목, 부제, 닫기 버튼) |
| `Btn` | 공통 버튼 (primary / outline 변형, sm / md 크기) |
| `CircleGauge` | SVG 기반 원형 달성률 게이지 |
| `RepeatPicker` | 루틴 반복 주기 설정 UI (매일/평일/주말/매주/N일/매월) |
| `Sidebar` | 데스크탑 사이드바 + 모바일 드로어 (네비게이션, 캐릭터 카드, 명언) |

### 📄 페이지 컴포넌트

| 컴포넌트 | 페이지 | 주요 기능 |
|----------|--------|-----------|
| `HomePage` | 🏠 홈 | 우선순위 알림, 생활 달성 요약, 임박 식재료, 빠른 실행, 이번 주 달성 현황 |
| `FoodPage` | 🥕 식재료 | 식재료 등록/수정/삭제, 카테고리별 탭, 유통기한 D-day 표시, 장보기 연동 |
| `LifePage` | 🌀 생활 관리 | 루틴·생활·청소 항목 관리, 날짜 이동, 섹션별 분류, 월간 달력, 스트릭 |
| `ShoppingPage` | 🛒 장보기 | 장보기 목록 CRUD, 카테고리 분류, 유통기한 임박 재구매 추천, 레시피 기반 자동 추가 |
| `ReportPage` | 📊 월간 리포트 | 월별 활동 통계, 달성 히트맵, 달성 분포 차트, 스트릭 현황 |
| `DiaryPage` | 📝 메모·일기 | 날짜별 일기 작성, 기분 선택, 목록 보기 (Firestore 저장) |
| `MissionPage` | 🎯 미션 & 성장 | 주간 미션 XP 시스템, 캐릭터 성장 단계, 레벨 로드맵 |
| `TipsPage` | 💡 생활 팁 | 자취 생활 가이드, 카테고리 필터, 나만의 팁 추가 |
| `HubPage` | 🔖 추천 | 상황별 추천, 유용한 앱·사이트·커뮤니티 모음 |
| `SharePage` | 👥 공유 | 룸메이트 공유 코드 생성 및 연결 (베타) |
| `SettingsPage` | ⚙️ 설정 | 프로필 편집, 동물 캐릭터/테마 선택, 다크 모드, 섹션 색상 커스텀 |

### 🏗️ 보조 컴포넌트 (페이지 내부)

| 컴포넌트 | 소속 페이지 | 설명 |
|----------|-------------|------|
| `LifeItemCard` | LifePage | 루틴/생활/청소 항목 카드 (체크, 수정, 삭제, 순서 이동) |
| `ScheduledItemCard` | LifePage | 오늘 할 필요 없는 예정 항목 카드 (D-day 표시) |
| `MonthlyCalendar` | LifePage | 달성 기록이 표시되는 월간 달력 |
| `DateModal` | FoodPage | 식재료 유통기한 선택 모달 |
| `FoodFormFields` | FoodPage | 식재료 추가/수정 폼 공통 필드 |
| `QuickActionBtn` | HomePage | 홈 화면 빠른 실행 버튼 |

### 🔐 인증 컴포넌트

| 컴포넌트 | 설명 |
|----------|------|
| `WelcomeScreen` | 앱 첫 진입 화면 (시작하기 / 로그인) |
| `AuthScreen` | 이메일 회원가입·로그인 + Google 소셜 로그인 |
| `Onboarding` | 신규 사용자 생활 스타일 선택 및 기본 항목 세팅 |

### 🔄 상태 관리 구조

별도 상태 관리 라이브러리 없이 React 내장 기능만 사용합니다.

```
App (최상위)
├── Firebase Auth 상태 (authState, user)
├── Firestore 실시간 구독 (foods, lifeItems, streak, weeklyLog)
├── 사용자 설정 (userName, animal, themeId, darkMode, customSections)
│
├── Context API
│   ├── ThemeCtx     — 현재 테마 색상 전달 (useTheme 훅)
│   ├── DarkCtx      — 다크 모드 여부 전달 (useDark 훅)
│   └── CustomSectionsCtx — 섹션 커스텀 색상 전달
│
└── 페이지 라우팅 (page state로 조건부 렌더링)
```

### 🗄️ Firestore 데이터 구조

```
users/{uid}
├── name, onboarded, animal, themeId, shareCode
├── streak: { count, lastDate }
├── weeklyLog: { "YYYY-MM-DD": 달성률(%) }
│
├── foods/{foodId}
│   ├── name, emoji, category, storage
│   ├── expiryDate, purchaseDate
│
├── lifeItems/{itemId}
│   ├── text, emoji, section (루틴/생활/청소)
│   ├── freq, intervalDays, freqDays, monthDay
│   ├── done, lastDone, order, guide
│
├── shoppingItems/{itemId}
│   ├── text, category, emoji, done, recipeTag
│
└── diaries/{diaryId}
    ├── date, content, mood
```

---

## 🛠️ 사용 기술

| 기술 | 버전 | 용도 |
|------|------|------|
| React | 18 (CDN) | UI 컴포넌트 및 상태 관리 |
| Babel Standalone | 최신 | 브라우저 내 JSX 트랜스파일 |
| Firebase Authentication | 10.12.0 | 이메일/Google 로그인 |
| Firebase Firestore | 10.12.0 | 실시간 데이터베이스 |
| Pretendard | CDN | 한국어 최적화 웹폰트 |

---

## ✨ 주요 기능 요약

- **식재료 관리** — 유통기한 D-day 추적, 보관 방법별 분류, 카테고리 프리셋
- **생활 루틴** — 매일/요일별/N일 주기 반복 설정, 섹션별(루틴·생활·청소) 분류
- **장보기** — 체크리스트, 유통기한 임박 재구매 추천, 레시피 기반 재료 자동 추가
- **월간 리포트** — 달성률 히트맵, 통계 시각화
- **미션 & 성장** — 주간 XP 미션, 캐릭터 5단계 성장 시스템
- **스트릭** — 연속 달성 일수 추적 및 시각화
- **다크 모드 / 테마** — 6가지 컬러 테마, 라이트·다크 전환
- **반응형** — 모바일(하단 탭바) / 데스크탑(사이드바) 레이아웃 자동 전환
- **실시간 동기화** — Firestore onSnapshot으로 멀티 디바이스 실시간 반영
