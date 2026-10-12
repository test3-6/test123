# BOOKLOG

책을 검색하고 나만의 독서 기록을 관리하는 웹 앱입니다. Next.js 14, React 18, Tailwind CSS, Supabase, Google Books API를 사용합니다.

## 시작하기

1. Node.js 20.9 이상을 설치합니다.
2. `npm install`로 의존성을 설치합니다.
3. `.env.example`을 복사해 `.env.local`을 만들고 Supabase 프로젝트 URL과 anon key를 입력합니다.
4. `npm run dev`를 실행한 뒤 `http://localhost:3000`을 엽니다.

Supabase 키는 소스 파일에 넣지 마세요. `.env.local`은 Git에 올라가지 않습니다. 브라우저에서 사용하는 키는 Supabase의 공개 anon key여야 하며, 서비스 역할 키(service role key)를 넣으면 안 됩니다.

## Vercel 배포

1. 이 프로젝트를 GitHub 저장소에 올린 뒤 Vercel에서 해당 저장소를 Import합니다.
2. Vercel 프로젝트의 **Settings → Environment Variables**에서 다음 값을 Preview와 Production 환경에 등록합니다.
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy를 실행합니다. 프레임워크는 Next.js로 자동 감지되며 별도의 빌드 설정은 필요하지 않습니다.
4. 환경변수를 바꾼 뒤에는 새 배포를 실행해야 적용됩니다.

## Supabase 테이블 전제

이 앱은 기존 `books` 테이블에 다음 컬럼이 있다고 전제합니다.

`id`, `google_id`, `title`, `authors`, `publisher`, `published_date`, `description`, `thumbnail`, `category`, `page_count`, `preview_link`, `status`, `notes`, `created_at`

`google_id`에는 중복 방지를 위한 UNIQUE 제약이 필요하고 `status` 값은 `want_to_read`, `reading`, `read`를 사용합니다. 현재 프로젝트의 실제 스키마와 RLS 정책을 확인하지 못했으므로 이 파일은 DB를 자동으로 변경하지 않습니다. 특히 UPDATE/DELETE 요청이 RLS에 의해 거부되면 화면에 오류가 표시됩니다. 필요한 정책을 확인한 뒤 Supabase에서 기존 보안 규칙에 맞춰 설정하세요.

## 기능

- Google Books API 책 검색
- Supabase 책장에 책 저장
- `/library` 독립 페이지, 상태별 필터 및 도서 통계
- 독서 상태 변경, 삭제 확인 및 오류 표시
