# @natsunaaa/nextjs-sheet-export


[한국어](#한국어) | [English](#english) | [中文](#中文)

---

## 한국어

Next.js App Router 기반의 선언적 Excel 다운로드 라이브러리.  
API 응답 데이터를 Excel/CSV 파일로 변환하여 다운로드합니다.

### 설치

```bash
npm install @natsunaaa/nextjs-sheet-export

```

### 빠른 시작

#### 1. 서버 Route 설정

`app/api/excel-download/route.ts` (경로는 자유롭게 설정)

```ts
import { createExcelRoute } from '@natsunaaa/nextjs-sheet-export/route'
import { apiClient } from '@/lib/axios'

export const POST = createExcelRoute({
  fetcher: apiClient,
  baseUrl: process.env.API_BASE_URL,
})
```

#### 2. 클라이언트 초기화

`lib/excel.ts`

```ts
import { createExcelDownloader } from '@natsunaaa/nextjs-sheet-export/client'

export const downloadExcel = createExcelDownloader({
  routePath: '/api/excel-download',
})
```

#### 3. 사용

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

### 서버 설정 (Route)

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

#### 인증 우선순위

`fetcher` > `getHeaders` > `headers` 순으로 적용됩니다.

### 클라이언트 설정

```ts
export const downloadExcel = createExcelDownloader({
  routePath: '/api/excel-download',   // route를 배치한 경로
  format: 'xlsx',                     // 기본 출력 포맷 ('xlsx' | 'csv')
  onError: (error) => {               // 에러 핸들러
    toast.error(error.message)
  },
})
```

### Sheet 구성

시트는 데이터를 가져오는 방식에 따라 두 가지 전략으로 나뉩니다.

#### 전략 1: 단일 API (`sources`)

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

#### 전략 2: 복수 API 조합 (`merge`)

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

### Sources 상세

#### 단일 dataPath

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

#### 복수 dataPath (rows concat)

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

#### 복수 sources (블록 분리)

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

### 셀 스타일

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

#### 지원 스타일 속성

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

### 데이터 변환 (transform)

컬럼에 `transform` 함수를 지정하면 셀에 값을 넣기 전에 데이터를 가공할 수 있습니다.

```ts
import { format } from 'date-fns'

columns: [
  {
    key: 'createdAt',
    label: '등록일',
    transform: (value) => format(new Date(value as string), 'yyyy-MM-dd'),
  },
  {
    key: 'status',
    label: '상태',
    transform: (value) => value === 'active' ? '활성' : '비활성',
  },
  {
    key: 'firstName',
    label: '이름',
    transform: (value, row) => `${row.lastName} ${value}`,
  },
]
```

`transform(value, row)` — 첫 번째 인자는 해당 key의 값, 두 번째 인자는 행 전체 데이터입니다.  
다른 필드를 참조하거나 조합하는 것도 가능합니다.

### 포맷 선택

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

### 전체 예시

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

### 구조 요약

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

---

## English

A declarative Excel download library for Next.js App Router.  
Converts API response data into Excel/CSV files for download.

### Installation

```bash
npm install @natsunaaa/nextjs-sheet-export

```

### Quick Start

#### 1. Server Route Setup

`app/api/excel-download/route.ts` (path is configurable)

```ts
import { createExcelRoute } from '@natsunaaa/nextjs-sheet-export/route'
import { apiClient } from '@/lib/axios'

export const POST = createExcelRoute({
  fetcher: apiClient,
  baseUrl: process.env.API_BASE_URL,
})
```

#### 2. Client Initialization

`lib/excel.ts`

```ts
import { createExcelDownloader } from '@natsunaaa/nextjs-sheet-export/client'

export const downloadExcel = createExcelDownloader({
  routePath: '/api/excel-download',
})
```

#### 3. Usage

```ts
import { downloadExcel } from '@/lib/excel'

await downloadExcel({
  sheets: [
    {
      name: 'Users',
      endpoint: '/api/admin/users',
      method: 'GET',
      sources: [
        {
          dataPath: ['data.list'],
          columns: [
            { key: 'userName', label: 'User' },
            { key: 'email', label: 'Email' },
          ],
        },
      ],
    },
  ],
  filename: 'user_list',
})
```

### Server Configuration (Route)

```ts
export const POST = createExcelRoute({
  // Authentication (choose one)
  fetcher: axiosInstance,                         // Inject axios instance
  headers: { 'X-API-Key': 'xxx' },               // Static headers
  getHeaders: (req) => ({                         // Dynamic headers
    Authorization: `Bearer ${req.cookies.get('token')?.value}`,
  }),

  // API base URL
  baseUrl: process.env.API_BASE_URL,

  // Default styles
  defaultStyles: {
    headerFont: { bold: true, color: { argb: 'FFFFFF' }, size: 12 },
    headerFill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '4472C4' } },
    defaultWidth: 20,
  },
})
```

#### Authentication Priority

Applied in order: `fetcher` > `getHeaders` > `headers`.

### Client Configuration

```ts
export const downloadExcel = createExcelDownloader({
  routePath: '/api/excel-download',   // Path where route is placed
  format: 'xlsx',                     // Default output format ('xlsx' | 'csv')
  onError: (error) => {               // Error handler
    toast.error(error.message)
  },
})
```

### Sheet Configuration

Sheets are divided into two strategies based on how data is fetched.

#### Strategy 1: Single API (`sources`)

Extracts data from a single API response.

```ts
{
  name: 'Usage Stats',
  endpoint: '/api/admin/usage/summary',
  method: 'POST',
  body: { startDate: '2026-01-01' },
  sources: [
    {
      dataPath: ['data.topUsers'],
      columns: [
        { key: 'userName', label: 'User' },
        { key: 'usageCount', label: 'Usage Count' },
      ],
    },
  ],
}
```

#### Strategy 2: Multiple API Merge (`merge`)

Combines responses from multiple APIs into a single table.

```ts
{
  name: 'All Users',
  merge: {
    endpoints: [
      { method: 'GET', url: '/api/admin/users', dataPath: ['data.list'] },
      { method: 'GET', url: '/api/admin/external-users', dataPath: ['data'] },
    ],
    columns: [
      { key: ['userName', 'name'], label: 'Name' },
      { key: ['department', 'dept'], label: 'Department' },
      { key: ['totalTokens', 'tokens'], label: 'Tokens' },
    ],
  },
}
```

`columns.key` corresponds to the order of `endpoints`.  
In the example above, `userName` from the first API and `name` from the second API map to the same 'Name' column.

### Sources Detail

#### Single dataPath

```ts
sources: [
  {
    dataPath: ['data.list'],
    columns: [
      { key: 'name', label: 'Name' },
    ],
  },
]
```

#### Multiple dataPath (rows concat)

Concatenates data from multiple paths within a single API response into one table.

```ts
sources: [
  {
    dataPath: ['data.topUsers', 'data.topDepartments'],
    columns: [
      { key: 'userName', label: 'User' },
      { key: 'departmentName', label: 'Department' },
      { key: 'total', label: 'Total' },
    ],
  },
]
```

If a row doesn't have a matching key, it will be treated as an empty value.

#### Multiple sources (block separation)

Separated into distinct table blocks (top/bottom) within the same sheet.

```ts
sources: [
  {
    dataPath: ['data.topUsers'],
    columns: [
      { key: 'userName', label: 'User' },
      { key: 'usageCount', label: 'Usage Count' },
    ],
  },
  {
    dataPath: ['data.topDepartments'],
    columns: [
      { key: 'departmentName', label: 'Department' },
      { key: 'total', label: 'Total' },
    ],
  },
]
```

### Cell Styles

Styles can be specified per column.

```ts
columns: [
  { key: 'userName', label: 'User' },
  {
    key: 'totalTokens',
    label: 'Total Tokens',
    style: {
      width: 15,
      numFmt: '#,##0',
      alignment: { horizontal: 'right' },
      font: { bold: true, color: { argb: 'FF0000' } },
    },
  },
  {
    key: 'createdAt',
    label: 'Created At',
    style: {
      numFmt: 'yyyy-mm-dd',
      width: 12,
    },
  },
]
```

#### Supported Style Properties

| Property | Description | Example |
|----------|-------------|---------|
| `width` | Cell width | `20` |
| `numFmt` | Number/date format | `'#,##0'`, `'yyyy-mm-dd'` |
| `alignment.horizontal` | Horizontal alignment | `'left'`, `'center'`, `'right'` |
| `alignment.vertical` | Vertical alignment | `'top'`, `'middle'`, `'bottom'` |
| `font.bold` | Bold | `true` |
| `font.color` | Font color | `{ argb: 'FF0000' }` |
| `font.size` | Font size | `12` |
| `fill` | Background color | `{ type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF00' } }` |

### Data Transform

Use the `transform` function on columns to process data before writing to cells.

```ts
import { format } from 'date-fns'

columns: [
  {
    key: 'createdAt',
    label: 'Created At',
    transform: (value) => format(new Date(value as string), 'yyyy-MM-dd'),
  },
  {
    key: 'status',
    label: 'Status',
    transform: (value) => value === 'active' ? 'Active' : 'Inactive',
  },
  {
    key: 'firstName',
    label: 'Full Name',
    transform: (value, row) => `${row.lastName} ${value}`,
  },
]
```

`transform(value, row)` — the first argument is the value for that key, the second is the entire row data.  
You can reference or combine other fields in the row.

### Format Selection

```ts
// Set default in client config
export const downloadExcel = createExcelDownloader({
  routePath: '/api/excel-download',
  format: 'xlsx',
})

// Override per call
await downloadExcel({
  sheets: [{ ... }],
  filename: 'report',
  format: 'csv',
})
```

### Architecture Overview

```
createExcelRoute(RouteConfig)        → Server configuration
createExcelDownloader(ClientConfig)  → Client configuration
downloadExcel(DownloadRequest)       → Download call
  └─ sheets[]
      ├─ SourceSheet: endpoint + sources[]
      │    └─ Source: dataPath[] + columns[]
      └─ MergeSheet: merge
           ├─ endpoints[]
           └─ columns[] (key: string[])
```

---

## 中文

基于 Next.js App Router 的声明式 Excel 下载库。  
将 API 响应数据转换为 Excel/CSV 文件并下载。

### 安装

```bash
npm install @natsunaaa/nextjs-sheet-export

```

### 快速开始

#### 1. 服务端 Route 设置

`app/api/excel-download/route.ts`（路径可自由配置）

```ts
import { createExcelRoute } from '@natsunaaa/nextjs-sheet-export/route'
import { apiClient } from '@/lib/axios'

export const POST = createExcelRoute({
  fetcher: apiClient,
  baseUrl: process.env.API_BASE_URL,
})
```

#### 2. 客户端初始化

`lib/excel.ts`

```ts
import { createExcelDownloader } from '@natsunaaa/nextjs-sheet-export/client'

export const downloadExcel = createExcelDownloader({
  routePath: '/api/excel-download',
})
```

#### 3. 使用

```ts
import { downloadExcel } from '@/lib/excel'

await downloadExcel({
  sheets: [
    {
      name: '用户列表',
      endpoint: '/api/admin/users',
      method: 'GET',
      sources: [
        {
          dataPath: ['data.list'],
          columns: [
            { key: 'userName', label: '用户名' },
            { key: 'email', label: '邮箱' },
          ],
        },
      ],
    },
  ],
  filename: '用户列表',
})
```

### 服务端配置 (Route)

```ts
export const POST = createExcelRoute({
  // 认证方式（三选一）
  fetcher: axiosInstance,                         // 注入 axios 实例
  headers: { 'X-API-Key': 'xxx' },               // 静态请求头
  getHeaders: (req) => ({                         // 动态请求头
    Authorization: `Bearer ${req.cookies.get('token')?.value}`,
  }),

  // API 基础 URL
  baseUrl: process.env.API_BASE_URL,

  // 默认样式
  defaultStyles: {
    headerFont: { bold: true, color: { argb: 'FFFFFF' }, size: 12 },
    headerFill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '4472C4' } },
    defaultWidth: 20,
  },
})
```

#### 认证优先级

按以下顺序应用：`fetcher` > `getHeaders` > `headers`。

### 客户端配置

```ts
export const downloadExcel = createExcelDownloader({
  routePath: '/api/excel-download',   // route 所在路径
  format: 'xlsx',                     // 默认输出格式 ('xlsx' | 'csv')
  onError: (error) => {               // 错误处理
    toast.error(error.message)
  },
})
```

### Sheet 构成

Sheet 根据数据获取方式分为两种策略。

#### 策略 1：单个 API（`sources`）

从单个 API 响应中提取数据。

```ts
{
  name: '使用统计',
  endpoint: '/api/admin/usage/summary',
  method: 'POST',
  body: { startDate: '2026-01-01' },
  sources: [
    {
      dataPath: ['data.topUsers'],
      columns: [
        { key: 'userName', label: '用户' },
        { key: 'usageCount', label: '使用次数' },
      ],
    },
  ],
}
```

#### 策略 2：多个 API 合并（`merge`）

将多个 API 的响应合并为一个表格。

```ts
{
  name: '全部用户',
  merge: {
    endpoints: [
      { method: 'GET', url: '/api/admin/users', dataPath: ['data.list'] },
      { method: 'GET', url: '/api/admin/external-users', dataPath: ['data'] },
    ],
    columns: [
      { key: ['userName', 'name'], label: '姓名' },
      { key: ['department', 'dept'], label: '部门' },
      { key: ['totalTokens', 'tokens'], label: 'Token数' },
    ],
  },
}
```

`columns.key` 与 `endpoints` 的顺序一一对应。  
上例中，第一个 API 的 `userName` 和第二个 API 的 `name` 映射到同一个"姓名"列。

### Sources 详解

#### 单个 dataPath

```ts
sources: [
  {
    dataPath: ['data.list'],
    columns: [
      { key: 'name', label: '姓名' },
    ],
  },
]
```

#### 多个 dataPath（行合并）

将单个 API 响应中多个路径的数据合并为一个表格。

```ts
sources: [
  {
    dataPath: ['data.topUsers', 'data.topDepartments'],
    columns: [
      { key: 'userName', label: '用户' },
      { key: 'departmentName', label: '部门' },
      { key: 'total', label: '合计' },
    ],
  },
]
```

如果某行没有对应的 key，则显示为空值。

#### 多个 sources（块分离）

在同一 Sheet 中分为独立的表格块（上下排列）。

```ts
sources: [
  {
    dataPath: ['data.topUsers'],
    columns: [
      { key: 'userName', label: '用户' },
      { key: 'usageCount', label: '使用次数' },
    ],
  },
  {
    dataPath: ['data.topDepartments'],
    columns: [
      { key: 'departmentName', label: '部门' },
      { key: 'total', label: '合计' },
    ],
  },
]
```

### 单元格样式

可以为每列指定样式。

```ts
columns: [
  { key: 'userName', label: '用户' },
  {
    key: 'totalTokens',
    label: '总Token数',
    style: {
      width: 15,
      numFmt: '#,##0',
      alignment: { horizontal: 'right' },
      font: { bold: true, color: { argb: 'FF0000' } },
    },
  },
  {
    key: 'createdAt',
    label: '创建日期',
    style: {
      numFmt: 'yyyy-mm-dd',
      width: 12,
    },
  },
]
```

#### 支持的样式属性

| 属性 | 说明 | 示例 |
|------|------|------|
| `width` | 列宽 | `20` |
| `numFmt` | 数字/日期格式 | `'#,##0'`, `'yyyy-mm-dd'` |
| `alignment.horizontal` | 水平对齐 | `'left'`, `'center'`, `'right'` |
| `alignment.vertical` | 垂直对齐 | `'top'`, `'middle'`, `'bottom'` |
| `font.bold` | 粗体 | `true` |
| `font.color` | 字体颜色 | `{ argb: 'FF0000' }` |
| `font.size` | 字体大小 | `12` |
| `fill` | 背景颜色 | `{ type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF00' } }` |

### 数据转换 (transform)

在列上指定 `transform` 函数，可以在写入单元格之前对数据进行加工。

```ts
import { format } from 'date-fns'

columns: [
  {
    key: 'createdAt',
    label: '创建日期',
    transform: (value) => format(new Date(value as string), 'yyyy-MM-dd'),
  },
  {
    key: 'status',
    label: '状态',
    transform: (value) => value === 'active' ? '活跃' : '未活跃',
  },
  {
    key: 'firstName',
    label: '姓名',
    transform: (value, row) => `${row.lastName} ${value}`,
  },
]
```

`transform(value, row)` — 第一个参数是该 key 的值，第二个参数是整行数据。  
可以引用或组合行内其他字段。

### 格式选择

```ts
// 在客户端配置中设置默认值
export const downloadExcel = createExcelDownloader({
  routePath: '/api/excel-download',
  format: 'xlsx',
})

// 调用时覆盖
await downloadExcel({
  sheets: [{ ... }],
  filename: '报表',
  format: 'csv',
})
```

### 架构概览

```
createExcelRoute(RouteConfig)        → 服务端配置
createExcelDownloader(ClientConfig)  → 客户端配置
downloadExcel(DownloadRequest)       → 下载调用
  └─ sheets[]
      ├─ SourceSheet: endpoint + sources[]
      │    └─ Source: dataPath[] + columns[]
      └─ MergeSheet: merge
           ├─ endpoints[]
           └─ columns[] (key: string[])
```
