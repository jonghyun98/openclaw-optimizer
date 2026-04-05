# ClawPilot - OpenClaw Intelligent Fallback Optimizer & Dashboard

> OpenClaw의 모델 폴백 시스템을 실시간으로 모니터링하고, AI 기반으로 최적화하는 Electron 데스크톱 앱

## 1. 프로젝트 개요

### 비전
OpenClaw의 단순 순차 폴백을 **실시간 헬스 기반 스마트 라우팅**으로 진화시키고,
사용자에게 모든 AI 모델의 상태를 한눈에 보여주는 **컨트롤 타워**를 제공한다.

### 핵심 가치
- **가시성**: 어떤 모델이 지금 건강한지, 얼마나 빠른지, 얼마나 비용이 드는지 실시간 파악
- **지능형 폴백**: 순차 체인이 아닌, 실시간 메트릭 기반 최적 모델 자동 선택
- **비용 최적화**: 태스크 복잡도에 따른 모델 라우팅으로 불필요한 비용 절감
- **무중단 서비스**: 장애 예측 및 선제적 전환으로 다운타임 최소화

---

## 2. 기술 스택

| 레이어 | 기술 | 이유 |
|--------|------|------|
| **데스크톱 앱** | Electron + React + TypeScript | 넓은 화면 대시보드에 최적, 웹 기술 재사용 |
| **UI 프레임워크** | Tailwind CSS + shadcn/ui | 빠른 대시보드 UI 개발, 다크모드 기본 |
| **차트/시각화** | Recharts 또는 D3.js | 실시간 메트릭 시각화 |
| **상태 관리** | Zustand | 경량, TypeScript 친화적 |
| **OpenClaw 연동** | WebSocket (ws://127.0.0.1:18789) | OpenClaw Gateway 네이티브 프로토콜 |
| **로컬 DB** | SQLite (better-sqlite3) | 히스토리/메트릭 로컬 저장 |
| **빌드** | Vite + electron-builder | 빠른 개발 + 크로스 플랫폼 배포 |

---

## 3. 핵심 기능

### 3.1 실시간 상태 대시보드

```
+------------------------------------------------------------------+
|  ClawPilot                                        [_] [□] [X]    |
+------------------------------------------------------------------+
|                                                                    |
|  [ Model Health Overview ]                                         |
|  ┌──────────────┬──────────────┬──────────────┬──────────────┐    |
|  │ Claude Opus  │ GPT-5        │ Gemini 3 Pro │ Llama 4      │    |
|  │  ● HEALTHY   │  ● HEALTHY   │  ⚠ SLOW      │  ● HEALTHY   │    |
|  │  124ms avg   │  89ms avg    │  2.1s avg    │  67ms avg    │    |
|  │  $0.42/hr    │  $0.38/hr    │  $0.15/hr    │  FREE        │    |
|  │  99.8% up    │  99.2% up    │  87.1% up    │  99.9% up    │    |
|  └──────────────┴──────────────┴──────────────┴──────────────┘    |
|                                                                    |
|  [ Fallback Chain ]  현재: Claude → GPT-5 → Gemini → Llama       |
|  [ 추천 체인 ]       최적: Claude → Llama → GPT-5 → Gemini  ✨    |
|                                                                    |
|  [ 실시간 요청 로그 ]                                              |
|  14:23:01  #chat-general  Claude Opus   ✓ 1.2s  $0.003          |
|  14:23:05  #dev-support   Claude Opus   ✗ timeout → GPT-5 ✓     |
|  14:23:08  #random        Llama 4       ✓ 0.4s  FREE            |
|                                                                    |
+------------------------------------------------------------------+
```

**세부 기능:**
- 프로바이더별 실시간 레이턴시, 에러율, 가동률 표시
- 쿨다운 상태 및 남은 시간 시각화
- Auth Profile별 사용량/한도 모니터링
- 폴백 발생 시 실시간 알림 (시스템 노티피케이션)

### 3.2 지능형 폴백 최적화 엔진

**현재 OpenClaw 방식의 한계:**
```
순차 폴백: Claude → GPT-5 → Gemini (고정 순서)
문제: Gemini가 지금 가장 빠르고 안정적이어도 항상 3번째
```

**ClawPilot 최적화:**

#### A. 헬스 스코어 기반 동적 순서
```typescript
// 각 모델의 실시간 헬스 스코어 계산
healthScore = w1 * (1 - errorRate)     // 안정성
            + w2 * (1 / latency)       // 속도
            + w3 * (1 - costPerToken)   // 비용 효율
            + w4 * uptime              // 가동률
            + w5 * qualityScore        // 응답 품질

// 헬스 스코어 순으로 폴백 체인 자동 재배열
```

#### B. 태스크 기반 라우팅
```
[간단한 질문] → 저비용 모델 우선 (Llama, Haiku)
[코드 생성]   → 코딩 특화 모델 우선 (Claude, GPT)
[긴 문서 분석] → 컨텍스트 윈도우 큰 모델 (Gemini)
[창의적 작업] → 품질 높은 모델 우선 (Opus, GPT-5)
```

#### C. 선제적 폴백 (Predictive Failover)
- 에러율 추이 분석으로 장애 **예측**
- 임계값 도달 전 미리 다음 모델로 전환 준비
- "warm standby" — 백업 모델에 주기적 핑으로 연결 유지

### 3.3 비용 분석 & 최적화

- 시간별/일별/월별 모델별 비용 추적
- "이 폴백 설정이면 월 예상 비용은 $XX" 시뮬레이션
- 비용 절감 추천: "지난주 간단한 질문의 40%가 Opus로 갔습니다. Haiku로 라우팅하면 월 $30 절감 가능"
- 예산 한도 설정 및 알림

### 3.4 폴백 시뮬레이터

- 실제 트래픽 없이 폴백 체인 테스트
- "만약 Claude가 다운되면?" 시나리오 시뮬레이션
- A/B 테스트: 현재 체인 vs 추천 체인 성능 비교
- 과거 데이터 기반 리플레이

### 3.5 알림 & 자동화

- 모델 다운/복구 시 데스크톱 알림
- Slack/Discord/Telegram 웹훅 알림 연동
- 자동 폴백 체인 재배열 (수동/자동 모드 선택)
- 일일/주간 리포트 자동 생성

---

## 4. 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                   ClawPilot (Electron)               │
│                                                       │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  Dashboard   │  │  Optimizer   │  │  Simulator  │ │
│  │  (React UI)  │  │  Engine      │  │             │ │
│  └──────┬──────┘  └──────┬───────┘  └──────┬──────┘ │
│         │                │                  │         │
│  ┌──────┴────────────────┴──────────────────┴──────┐ │
│  │              Core Service Layer                   │ │
│  │  - WebSocket Client (OpenClaw Gateway 연결)      │ │
│  │  - Metrics Collector (실시간 수집)               │ │
│  │  - Health Scorer (스코어 계산)                   │ │
│  │  - Cost Tracker (비용 추적)                      │ │
│  └──────────────────────┬───────────────────────────┘ │
│                         │                              │
│  ┌──────────────────────┴───────────────────────────┐ │
│  │              SQLite (로컬 스토리지)                │ │
│  │  - metrics, fallback_events, cost_logs, configs  │ │
│  └──────────────────────────────────────────────────┘ │
└─────────────────────────┬───────────────────────────────┘
                          │ WebSocket
                          ▼
              ┌───────────────────────┐
              │  OpenClaw Gateway     │
              │  ws://127.0.0.1:18789 │
              └───────────────────────┘
```

---

## 5. 확장 기능 (v2+)

### 5.1 멀티 게이트웨이 관리
- 여러 OpenClaw 인스턴스를 하나의 대시보드에서 관리
- 팀용: 팀원들의 게이트웨이 상태 통합 모니터링

### 5.2 커뮤니티 폴백 프리셋
- "코딩용 최적 체인", "번역용 최적 체인" 등 프리셋 공유
- 커뮤니티 기반 모델 벤치마크 데이터 수집

### 5.3 OpenClaw 플러그인/스킬
- ClawPilot 최적화 엔진을 OpenClaw 스킬로 직접 통합
- `/optimize-fallback` 명령어로 채팅에서 직접 제어

### 5.4 모바일 컴패니언 (React Native)
- 간소화된 상태 모니터링 모바일 앱
- 푸시 알림으로 장애 즉시 알림
- 긴급 폴백 체인 변경

### 5.5 AI 기반 자동 튜닝
- 사용 패턴 학습 → 시간대별 최적 모델 자동 선택
- "월요일 오전에는 코딩 질문이 많으니 Claude 우선"
- 비용 대비 품질 파레토 최적화

---

## 6. 개발 로드맵

### Phase 1 - Foundation (MVP) — 2주
- [ ] Electron + React + Vite 프로젝트 셋업
- [ ] OpenClaw Gateway WebSocket 연결
- [ ] 기본 모델 상태 대시보드 (헬스, 레이턴시, 에러율)
- [ ] SQLite 메트릭 저장

### Phase 2 - Smart Fallback — 2주
- [ ] 헬스 스코어 계산 엔진
- [ ] 동적 폴백 체인 재배열
- [ ] 태스크 기반 라우팅 (기본 분류)
- [ ] 폴백 이벤트 로그 & 시각화

### Phase 3 - Cost & Analytics — 1주
- [ ] 비용 트래킹 & 리포트
- [ ] 비용 시뮬레이터
- [ ] 절감 추천 엔진

### Phase 4 - Advanced — 2주
- [ ] 선제적 폴백 (예측 엔진)
- [ ] 폴백 시뮬레이터
- [ ] 알림 시스템 (데스크톱 + 웹훅)
- [ ] 자동 튜닝 기초

### Phase 5 - Polish & Release — 1주
- [ ] UI/UX 폴리싱
- [ ] 자동 업데이트 (electron-updater)
- [ ] 문서화 & 배포 (GitHub Releases)

---

## 7. 프로젝트 구조 (예상)

```
openclaw-optimizer/
├── PROJECT.md                 # 이 문서
├── package.json
├── electron.vite.config.ts
├── src/
│   ├── main/                  # Electron 메인 프로세스
│   │   ├── index.ts
│   │   ├── gateway/           # OpenClaw WebSocket 클라이언트
│   │   │   ├── connection.ts
│   │   │   └── events.ts
│   │   ├── optimizer/         # 폴백 최적화 엔진
│   │   │   ├── health-scorer.ts
│   │   │   ├── task-router.ts
│   │   │   └── predictive.ts
│   │   ├── metrics/           # 메트릭 수집 & 저장
│   │   │   ├── collector.ts
│   │   │   └── cost-tracker.ts
│   │   └── db/                # SQLite
│   │       ├── schema.ts
│   │       └── queries.ts
│   ├── renderer/              # React UI
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Optimizer.tsx
│   │   │   ├── CostAnalytics.tsx
│   │   │   ├── Simulator.tsx
│   │   │   └── Settings.tsx
│   │   ├── components/
│   │   │   ├── ModelCard.tsx
│   │   │   ├── FallbackChain.tsx
│   │   │   ├── MetricsChart.tsx
│   │   │   ├── RequestLog.tsx
│   │   │   └── CostBreakdown.tsx
│   │   └── stores/
│   │       ├── gateway.ts
│   │       ├── metrics.ts
│   │       └── settings.ts
│   └── shared/                # 공유 타입 & 유틸
│       ├── types.ts
│       └── constants.ts
├── resources/                 # 아이콘, 에셋
└── tests/
```

---

## 8. 경쟁 우위 & 차별화

| 기존 도구 | ClawPilot 차별점 |
|-----------|-----------------|
| OpenClaw 기본 폴백 | 순차 → 실시간 헬스 기반 동적 라우팅 |
| LiteLLM | 범용 프록시 vs OpenClaw 네이티브 통합 |
| OpenRouter | 클라우드 서비스 vs 로컬 자체 호스팅 |
| 수동 모니터링 | 자동 메트릭 수집 + 예측 + 추천 |

---

## 9. 네이밍

**ClawPilot** — OpenClaw의 "Claw" + 자동 조종사의 "Pilot"
- 대안: ClawDash, ClawOptima, FallbackPilot, ClawControl

---

*Created: 2026-04-05*
*Last Updated: 2026-04-05*
