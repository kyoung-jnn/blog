---
date: 2024-04-21
published: false
slug:
thumbnail:
---

# Server Side Rendering 한계
## hydration
`SSR`은 서버에서 `HTML`을 먼저 클라이언트에게 내려주어 사용자는 빠르게 초기 화면를 볼 수 있게 된다. 이를 통해 [FCP](https://web.dev/articles/fcp?hl=ko)에서 이점을 얻게 된다. 하지만, 사용자가 보는 초기 화면은 **인터렉션이 불가능**한 화면이고 **버튼 클릭 등의 인터렉션**을 위해서는 `hydration`을 통해 JavaScript 이벤트들을 [DOM](https://developer.mozilla.org/ko/docs/Web/API/Document_Object_Model/Introduction)에 바인딩 시켜줘야 한다. 이는 결국 [TTI](https://web.dev/articles/tti?hl=ko)를 증가시키게 된다.
# React Server Component
**React v18**부터 도입된 새로운 패러다임으로 `서버에서 동작하는 컴포넌트`를 지칭한다. 여기서 `동작`은 서버 컴포넌트 내부에서 데이터를 불러오거나 렌더링 되는 과정을 지칭한다. 
새로운 패러다임의 도입으로 기존의 우리가 사용하고 있던 컴포넌트는 모두 `클라이언트 컴포넌트`에 해당되게 된다.
## Server Component 장점
### Zero Bundle Size

### Streaming

## Server Component vs Client Component
> `Next.js`에서 기술하고 있는 차이점은 아래와 같다.
<table header-row="true" header-column="true">
<colgroup>
<col width="230.0037841796875">
<col width="230.0037841796875">
<col width="230.0037841796875">
</colgroup>
<tr>
<td></td>
<td>**서버 컴포넌트**</td>
<td>**클라이언트 컴포넌트**</td>
</tr>
<tr>
<td>데이터 불러오기 (fetch)</td>
<td>✅</td>
<td>❌</td>
</tr>
<tr>
<td>백엔드 resource에 직접 접근</td>
<td>✅</td>
<td>❌</td>
</tr>
<tr>
<td>민감한 정보 보호 (액세스 토큰, API 키)</td>
<td>✅</td>
<td>❌</td>
</tr>
<tr>
<td>컴포넌트의 JavaScript 번들 최적화</td>
<td>✅</td>
<td>❌</td>
</tr>
<tr>
<td>이벤트 핸들링 (onClick)</td>
<td>❌</td>
<td>✅</td>
</tr>
<tr>
<td>React 라이프 사이클 (useState)</td>
<td>❌</td>
<td>✅</td>
</tr>
<tr>
<td>Browser API 사용</td>
<td>❌</td>
<td>✅</td>
</tr>
<tr>
<td>React Class Components</td>
<td>❌</td>
<td>✅</td>
</tr>
</table>
## Server Side Rendering vs Server Component
서버 컴포넌트가 SSR을 대체하는 것도 아니고 SSR을 이용한다고 반드시 서버 컴포넌트를 이용해야 하는 것도 아니다. 중요한 것은 **SSR과 서버 컴포넌트 상호보완적인 개념**인 것이다.
결국 `HTML`을 렌더링하기 위해서는 SSR을 이용해야한다. 하지만 SSR 에서는 렌더링에 필요한 데이터를 전역에서 불러왔다면 서버 컴포넌트는 이를 컴포넌트 별로 불러올 수 있게 한다.  
SSR에서 서버 컴포넌트를 이용함으로 위에서 기술한 서버 컴포넌트가 갖고 있는 추가적인 장점들을 이용할 수 있다.

### React-Query의 Prefetch와 차이점
# 동작 방식
## **React Server Component Payload (RSC Payload)**
- 서버 컴포넌트의 렌더링 결과를 갖고있다. 
-

