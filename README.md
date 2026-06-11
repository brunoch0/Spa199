# spa199 — Dubai On-Demand Massage

두바이 출장 온디맨드 마사지 서비스. 검증된 테라피스트를 호텔/집/오피스로 부르는 예약 플랫폼.

**Stack:** Next.js 16 (App Router) · Tailwind v4 · shadcn/ui · Supabase (Auth + Postgres + RLS)

## Features (MVP)

| 영역 | 기능 |
|------|------|
| Auth | 이메일 회원가입/로그인 (customer/therapist 역할 선택), 비밀번호 재설정, 프로필 자동 생성 트리거 |
| Discovery | 테라피스트 검색 (시술/지역/가격 필터), 프로필 상세, 리뷰/평점 표시 |
| Booking | 서비스 선택 → 가용 슬롯 캘린더 → 주소/방문메모 입력 → 결제(demo) 4단계 위저드 |
| Booking 관리 | 예약 내역/상세, 취소(48h/24h 차등 환불 자동계산), 리뷰 작성, 문의/신고 |
| Therapist Portal | 대시보드(KPI), 예약 수락/거절/완료, 프로필/서비스/가격 편집, 주간 스케줄+휴무, 정산 내역 |
| Admin | KPI 대시보드, 사용자 정지/복구, 예약/결제 모니터링, 리뷰 게시/숨김, 문의 답변, 공지/프로모션 |

## Booking 상태 흐름

`requested` → (테라피스트 수락) → `confirmed` → (세션 종료 후) → `completed` → 리뷰 가능
취소 정책: 시작 48h 이전 100% / 48–24h 50% / 24h 이내 0% 환불

## 로컬 실행

```bash
cp .env.example .env.local   # Supabase URL + anon key 입력
npm install
npm run dev
```

## DB

- Supabase project: `mjguemylvigynvoblndu` (스키마는 마이그레이션 `spa199_core_schema` 참고)
- RLS 전면 적용. `booked_slots` view로 예약된 시간만 공개 (고객정보 비노출)
- `chohj0228@gmail.com` 가입 시 자동 admin 부여

## 데모 계정

- Customer: `spa199.test.customer@gmail.com` / `test1234!`
- Therapist 6명 시드 데이터 (Maria, Anna, Yuki, Priya, Elena, Mai) — 로그인 불가(데모 표시용)

## Next (v2 backlog)

- 실결제 (Stripe / Telr AED)
- 지도 뷰 (현재 지역 필터로 대체)
- 다국어 EN/AR/KO + RTL
- 푸시/SMS 알림, 예약 타임아웃 자동만료
- 테라피스트 사진/동영상 업로드 (Supabase Storage)
