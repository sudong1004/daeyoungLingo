# 영어 단어장

회화 초보를 위한 개인용 영어 단어 학습 웹앱입니다.
Next.js (App Router) + Tailwind + Supabase + Vercel.

- 비밀번호 하나로 입장 (회원가입/로그인 없음)
- 단어 추가·수정·삭제·검색, 붙여넣기 일괄 등록
- 학습 세션: 플래시카드, 객관식(영→한, 한→영), 예문 빈칸, 듣고 뜻/단어 고르기
- 간격 반복: 맞히면 1일 → 3일 → 7일 → 14일 뒤 복습, 5단계가 되면 졸업. 틀리면 처음부터
- 하루 새 단어 5개, 틀린 문제는 세션 끝에서 한 번 더
- 발음 듣기: 브라우저 음성(speechSynthesis), 폰 홈 화면에 추가해서 사용

## 1. Supabase 준비

1. [supabase.com](https://supabase.com) 에서 새 프로젝트를 만듭니다. (리전은 Northeast Asia (Seoul) 추천)
2. 왼쪽 **SQL Editor**에 `supabase/schema.sql` 내용을 붙여넣고 **Run**.
3. **Project Settings → API**에서 아래 두 값을 확인합니다.
   - Project URL → `SUPABASE_URL`
   - `service_role` 키 (새 대시보드에서는 secret 키) → `SUPABASE_SERVICE_ROLE_KEY`

> 이 키는 서버에서만 쓰고, 이름에 `NEXT_PUBLIC_` 을 붙이면 안 됩니다.
> 테이블은 RLS가 켜져 있고 정책이 없어서, 브라우저의 공개 키로는 접근할 수 없습니다.

## 2. 로컬 실행

```bash
npm install
cp .env.example .env.local   # 값을 채워 넣기: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, APP_PASSWORD
npm run dev
```

http://localhost:3000 에서 비밀번호(`APP_PASSWORD`)를 입력하면 들어갑니다.

## 3. Vercel 배포

1. 이 저장소를 GitHub에 올립니다.
2. Vercel에서 **Add New → Project**로 저장소를 가져옵니다.
3. **Environment Variables**에 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_PASSWORD` 3개를 등록하고 Deploy.
4. 배포된 주소를 폰 브라우저로 열고 **홈 화면에 추가**하면 앱처럼 쓸 수 있습니다.

## 구조

```
app/
  login/                 비밀번호 입장
  (app)/                 로그인 필요 화면 (레이아웃에서 검사)
    page.tsx             홈: 오늘 풀 단어 수
    study/               학습 세션 (page, StudyClient, actions)
    words/               단어장, 추가, 수정, 일괄 등록
lib/
  auth.ts                비밀번호 확인, 쿠키
  supabase.ts            서버 전용 클라이언트
  srs.ts                 복습 간격, 숙련도 규칙
  questions.ts           문제 만들기 (유형, 오답 보기, 예문 빈칸)
  session.ts             오늘 풀 단어 고르기
supabase/schema.sql      테이블 (words, study_logs)
```

## 조정할 수 있는 값

`lib/srs.ts`: 복습 간격(`INTERVAL_DAYS`), 하루 새 단어 수(`NEW_WORDS_PER_DAY`), 세션당 복습 단어 수(`SESSION_DUE_LIMIT`).
`lib/questions.ts`: 숙련도별로 나오는 문제 유형(`TYPES_BY_LEVEL`).
