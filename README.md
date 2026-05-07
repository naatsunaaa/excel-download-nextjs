# excel-download-nextjs

Next.js App Router 기반의 선언적 Excel 다운로드 라이브러리.  
API 응답 데이터를 Excel/CSV 파일로 변환하여 다운로드합니다.

## 설치

```bash
npm install excel-download-nextjs
```

## 빠른 시작

### 1. 서버 Route 설정

`app/api/excel-download/route.ts` (경로는 자유롭게 설정)

```ts
import { createExcelRoute } from 'excel-download-nextjs/route'
import { apiClient } from '@/lib/axios'

export const POST = createExcelRoute({
  fetcher: apiClient,
  baseUrl: process.env.API_BASE_URL,
})
```

### 2. 클라이언트 초기화

`lib/excel.ts`

```ts
import { createExcelDownloader } from 'excel-download-nextjs/client'

export const downloadExcel = createExcelDownloader({
  routePath: '/api/excel-download',
})
```

### 3. 사용

```ts
import { downloadExcel } from '@/lib/excel'

await downloadExcel({
  sheets: [
    {
      name: '사용자_목록',
      endpoint: '/api/admin/users',
      method: 'GET',
      sources: [
        {
          dataPath: ['data.list'],
          columns: [
            { key: 'userName', label: '사용자' },
            { key: 'email', label: '이메일' },
          ],
        },
      ],
    },
  ],
  filename: '사용자_목록',
})
```

---

## 서버 설정 (Route)

```ts
export const POST = createExcelRoute({
  // 인증 방식 (택 1)
  fetcher: axiosInstance,                         // axios instance 주입
  headers: { 'X-API-Key': 'xxx' },               // 정적 헤더
  getHeaders: (req) => ({                         // 동적 헤더
    Authorization: `Bearer ${req.cookies.get('token')?.value}`,
  }),

  // API base URL
  baseUrl: process.env.API_BASE_URL,

  // 기본 스타일
  defaultStyles: {
    headerFont: { bold: true, color: { argb: 'FFFFFF' }, size: 12 },
    headerFill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '4472C4' } },
    defaultWidth: 20,
  },
})
```

### 인증 우선순위

`fetcher` > `getHeaders` > `headers` 순으로 적용됩니다.

---

## 클라이언트 설정

```ts
export const downloadExcel = createExcelDownloader({
  routePath: '/api/excel-download',   // route를 배치한 경로
  format: 'xlsx',                     // 기본 출력 포맷 ('xlsx' | 'csv')
  onError: (error) => {               // 에러 핸들러
    toast.error(error.message)
  },
})
```

---

## Sheet 구성

시트는 데이터를 가져오는 방식에 따라 두 가지 전략으로 나뉩니다.

### 전략 1: 단일 API (`sources`)

하나의 API 응답에서 데이터를 추출합니다.

```ts
{
  name: '이용량_통계',
  endpoint: '/api/admin/usage/summary',
  method: 'POST',
  body: { startDate: '2026-01-01' },
  sources: [
    {
      dataPath: ['data.topUsers'],
      columns: [
        { key: 'userName', label: '사용자' },
        { key: 'usageCount', label: '이용 횟수' },
      ],
    },
  ],
}
```

### 전략 2: 복수 API 조합 (`merge`)

여러 API의 응답을 하나의 테이블로 합칩니다.

```ts
{
  name: '전체_사용자',
  merge: {
    endpoints: [
      { method: 'GET', url: '/api/admin/users', dataPath: ['data.list'] },
      { method: 'GET', url: '/api/admin/external-users', dataPath: ['data'] },
    ],
    columns: [
      { key: ['userName', 'name'], label: '이름' },
      { key: ['department', 'dept'], label: '부서' },
      { key: ['totalTokens', 'tokens'], label: '토큰수' },
    ],
  },
}
```

`columns.key`는 `endpoints` 순서에 대응합니다.  
위 예시에서 첫 번째 API의 `userName`과 두 번째 API의 `name`이 같은 '이름' 컬럼으로 매핑됩니다.

---

## Sources 상세

### 단일 dataPath

```ts
sources: [
  {
    dataPath: ['data.list'],
    columns: [
      { key: 'name', label: '이름' },
    ],
  },
]
```

### 복수 dataPath (rows concat)

하나의 API 응답에서 여러 경로의 데이터를 하나의 테이블로 합칩니다.

```ts
sources: [
  {
    dataPath: ['data.topUsers', 'data.topDepartments'],
    columns: [
      { key: 'userName', label: '사용자' },
      { key: 'departmentName', label: '부서' },
      { key: 'total', label: '합계' },
    ],
  },
]
```

각 행에 해당 key가 없으면 빈 값으로 처리됩니다.

### 복수 sources (블록 분리)

같은 시트 안에서 별도의 테이블 블록으로 위/아래 분리됩니다.

```ts
sources: [
  {
    dataPath: ['data.topUsers'],
    columns: [
      { key: 'userName', label: '사용자' },
      { key: 'usageCount', label: '이용 횟수' },
    ],
  },
  {
    dataPath: ['data.topDepartments'],
    columns: [
      { key: 'departmentName', label: '부서' },
      { key: 'total', label: '합계' },
    ],
  },
]
```

---

## 셀 스타일

컬럼별로 스타일을 지정할 수 있습니다.

```ts
columns: [
  { key: 'userName', label: '사용자' },
  {
    key: 'totalTokens',
    label: '사용 토큰수',
    style: {
      width: 15,
      numFmt: '#,##0',
      alignment: { horizontal: 'right' },
      font: { bold: true, color: { argb: 'FF0000' } },
    },
  },
  {
    key: 'createdAt',
    label: '등록일',
    style: {
      numFmt: 'yyyy-mm-dd',
      width: 12,
    },
  },
]
```

### 지원 스타일 속성

| 속성 | 설명 | 예시 |
|------|------|------|
| `width` | 셀 너비 | `20` |
| `numFmt` | 숫자/날짜 포맷 | `'#,##0'`, `'yyyy-mm-dd'` |
| `alignment.horizontal` | 가로 정렬 | `'left'`, `'center'`, `'right'` |
| `alignment.vertical` | 세로 정렬 | `'top'`, `'middle'`, `'bottom'` |
| `font.bold` | 굵게 | `true` |
| `font.color` | 글자 색상 | `{ argb: 'FF0000' }` |
| `font.size` | 글자 크기 | `12` |
| `fill` | 배경 색상 | `{ type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF00' } }` |

---

## 포맷 선택

```ts
// 클라이언트 설정에서 기본값 지정
export const downloadExcel = createExcelDownloader({
  routePath: '/api/excel-download',
  format: 'xlsx',
})

// 호출 시 오버라이드
await downloadExcel({
  sheets: [{ ... }],
  filename: '리포트',
  format: 'csv',
})
```

---

## 전체 예시

```ts
await downloadExcel({
  sheets: [
    // 시트 1: 단일 API, 단일 데이터
    {
      name: '사용자',
      endpoint: '/api/admin/users',
      method: 'GET',
      params: { active: true },
      sources: [
        {
          dataPath: ['data.list'],
          columns: [
            { key: 'userName', label: '사용자' },
            { key: 'email', label: '이메일', style: { width: 30 } },
            { key: 'createdAt', label: '등록일', style: { numFmt: 'yyyy-mm-dd' } },
          ],
        },
      ],
    },

    // 시트 2: 단일 API, 복수 데이터 블록
    {
      name: '이용량_통계',
      endpoint: '/api/admin/usage/summary',
      method: 'POST',
      body: { startDate: '2026-01-01', endDate: '2026-03-31' },
      sources: [
        {
          dataPath: ['data.topUsers'],
          columns: [
            { key: 'userName', label: '사용자' },
            { key: 'usageCount', label: '이용 횟수', style: { numFmt: '#,##0' } },
            { key: 'totalTokens', label: '토큰수', style: { numFmt: '#,##0' } },
          ],
        },
        {
          dataPath: ['data.topDepartments'],
          columns: [
            { key: 'departmentName', label: '부서' },
            { key: 'total', label: '합계', style: { numFmt: '#,##0' } },
          ],
        },
      ],
    },

    // 시트 3: 복수 API 조합
    {
      name: '전체_사용자',
      merge: {
        endpoints: [
          { method: 'GET', url: '/api/admin/users', dataPath: ['data.list'] },
          { method: 'GET', url: '/api/admin/external-users', dataPath: ['data'] },
        ],
        columns: [
          { key: ['userName', 'name'], label: '이름' },
          { key: ['department', 'dept'], label: '부서' },
          { key: ['totalTokens', 'tokens'], label: '토큰수', style: { numFmt: '#,##0' } },
        ],
      },
    },
  ],
  filename: '월간_리포트',
})
```

---

## 구조 요약

```
createExcelRoute(RouteConfig)        → 서버 설정
createExcelDownloader(ClientConfig)  → 클라이언트 설정
downloadExcel(DownloadRequest)       → 다운로드 호출
  └─ sheets[]
      ├─ SourceSheet: endpoint + sources[]
      │    └─ Source: dataPath[] + columns[]
      └─ MergeSheet: merge
           ├─ endpoints[]
           └─ columns[] (key: string[])
```
