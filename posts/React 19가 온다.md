---
date: 2024-05-04
published: true
slug:
thumbnail:
---

드디어 `React 19`가 등장했다. **Release Candidate**인 만큼 조금의 수정을 걸쳐서 곧 바로 공식 버전으로 업데이트 되지 않을까 싶다.
공식문서에서 기술하는 `React 19`의 **새로운 기능 및 개선점**을 알아보자.

# 신규 기능

> 💡 React에서 비동기 `Transition`을 사용하는 함수들을 `actions`라 부른다. `actions`은 데이터 트랜지션 과정을 관리한다

## Form Action

`<form>`, `<input>`, `<button>` 태그들에 **action 또는 formAction props**를 전달할 수 있게 된다.
form이 제출될 때 action이 성공적으로 수행되면 form이 자동으로 reset 된다. action은 비동기로 작동되며 첫번째 인자로 [form data](https://developer.mozilla.org/en-US/docs/Web/API/FormData)를 전달받는다.

> 💡 action 또는 formAction는 `HTTP method` 속성 값과 상관없이 `POST`가 된다!

```typescript
function Search() {
  function search(formData) {
	  // form data를 받는다.
    const searchInput = formData.get("searchInput");
  }
  
  return (
    <form action={search}>
      <input name="searchInput" />
      <button type="submit">Search</button>
    </form>
  );
}
```

### Action에 추가적인 정보 전달

action 및 formAction 내부적으로 form data만 접근이 가능하다. 하지만 [bind()](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Function/bind) 메소드를 통해  **추가적인 정보**를** **제공하는게 가능해진다.

```typescript
function Search() {
	async function search(formData, categoryId) {
    const results = await searchAPI(categoryId, formData);
  }
  
  const searchWithCategory = search.bind(null, categoryId);
  
  return (
    <form action={searchWithCategory}>
      <input name="searchInput" />
      <button type="submit">Search</button>
    </form>
  );
}
```

## useFormStatus

form의 상태(action의 비동기 상태)를 감지하기 위해서는 `<form/>` 태그가 존재하는 컴포넌트에서 `const [pending, setPending] = useState(false)` 같이 상태 값을 따로 관리하고 이를 props로 자식 컴포넌트에 내려줘야 했다.
이는 복잡한 컴포넌트 구조에서 `props drilling`를 야기시킨다.
React 19 부터는 `<form/>` 컴포넌트의 자식 컴포넌트에서 `useFormStatus`를 사용하게 되면 form의 상태를 알 수 있다 🥹

```typescript
function Form() {
	const action = async (formData) {
		...
  } 
  return (
    <form action={action}>
	    ...
      <SubmitButton />
    </form>
  );
}
```

```typescript
import {useFormStatus} from 'react-dom';

function SubmitButton() {
  const {pending} = useFormStatus();
  return <button type="submit" disabled={pending} />
}
```

## useActionState

> 💡 Canary Releases에서의 `ReactDOM.useFormState` 이름이 **deprecated**되고 `React.useActionState`으로 수정되었다.
> 또한 **React DOM 내부 API **였지만 **React API**로 이전된 듯 하다.

```typescript
const [state, action] = useActionState(fn, initialState, permalink?)
```

form의 제출 상태 및 action 자체를 커스텀 하게 할 수 있게 한다.
useState 및 useReducer를 사용하지 않고 **대기, 오류, 성공 상태를 하나의 훅(hook)**으로 관리 할 수 있다. 이제는 form의 `validation`만 수월하게 할 수 있다면 [react-hook-form](https://react-hook-form.com/) 같은 라이브러리의 도움이 **최소화** 될 것 같다.
`반환 값인 state`는** action이 성공적인지를 나타내는 불리언 값, 오류 메시지, 또는 업데이트된 정보를 포함하는 객체**일 수 있다. 이를 활용해 form의 성공 및 에러 상태를 커스텀하게 보여줄 수 있다.

```typescript
import { useActionState } from 'react';

function action(currentState, formData) {
  // ...
  return 'next state';
}

function MyComponent() {
  const [state, formAction] = useActionState(action, null);
  return (
    <form action={formAction}>
      {/* ... */}
    </form>
  );
}
```

- form이 제출되기 `전`
	- state: useActionState의 초기 값
	- action의 첫번째 인자: useActionState의 초기 값
	- action의 두번재 인자: 제출된 formData
- form이 제출된 `후`
	- state: action의 반환값 (action의 반환값은 useActionState의 새로운 현재 state가 된다.)
	- action의 첫번째 인자: 이전에 제출된 formData (제출될 때 마다 업데이트)
	- action의 두번재 인자: 다시 제출된 formData

직관적인 사용 방법이지만, **useActionState 반환 값과 action의 인자의 변화**는 기억해두자.

## useOptimistic

사용자가 form을 제출하고 요청이 처리되는 동안 사용자에게 즉각적인 피드백을 보여 줄 수 있게 된다. 사용자는** Loading Spinner 같은 pending 상태에 대한 UI**를 볼 필요가 없다. 요청이 성공했을 때의 데이터를 이용하여 곧 바로 필요한 UI를 볼 수 있게 된다.

> 무조건 성공을 예상하고 데이터를 사용하기 때문에 `optimistic, 낙관적`이라는 단어를 썼지 않을까?

**개인적**으로 이 훅에 대해서는 조금 회의적인 생각이 든다.
만약 응답이 실패하게 되면 사용자는 성공이 예측된 데이터를 보다가 다시 이전의 데이터를 보게 될 것이다. 이 과정이 오히려 UX를 해치고 응답 실패를 더욱 더 오류 처럼 보이게 하는 것이 아닌가 싶다. 또한 성공한 UI가 사라지기 때문에 [CLS 지표](https://kyoung-jnn.com/posts/core-web-vitals#30b1bf5fe7624ac29da0ee9c02b1a3ac)에도 영향을 미칠 것 같다.
하지만 [예시](https://react.dev/reference/react/useOptimistic)에서 보여주듯 해당 훅은 채팅같은 **실시간 데이터를 사용하는 UI**에서는 낙관적 데이터를 이용하여 UI를 업데이트 해주는게 UX에서 좋을 듯 하다. ~~채팅 하나 보내는데 Loading Spinner 뜨는것도 이상하니깐~~
결과적으로 사용할 곳이 많아 보이지는 않지만, 적절한 곳에 사용하면 UI/UX적으로 도움이 될 것은 확실해 보인다.

## use

```typescript
const value = use(resource);
```

[promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) 또는 [context](https://react.dev/learn/passing-data-deeply-with-context)를 인자(resource)로 받아 해당 값을 읽을 수 있는 함수이다.

### Promise

```typescript
import { use, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

function App({ messagePromise }) {
  return (
    <ErrorBoundary fallback={...}>
      <Suspense fallback={...}>
        <Message messagePromise={messagePromise} />
      </Suspense>
    </ErrorBoundary>
  );
}

function Message({ messagePromise }) {
  const content = use(messagePromise);
  return <p>{content}</p>;
}

```

[promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)가 인자로 넘겨질 경우 promise가 `resolve` 혹은 `reject` 될 때 까지 React는 중단(Suspense)된다.
이를 이용해서 `useEffect`를 사용하지 않고 Data Fetch 등의 Promise 처리가 가능해진다. 또한 **Suspense**, **ErrorBoundary**를 이용하여 상태에 따른 조건부 UI 처리도 간단해진다.

### Context

```typescript
function Button({ show, children }) {
  if (show) {
    const theme = use(ThemeContext);
    const className = 'button-' + theme;
    return (
      <button className={className}>
        {children}
      </button>
    );
  }
  return false
}
```

[Context](https://react.dev/learn/passing-data-deeply-with-context)가 인자로 넘겨질 경우 [useContext](https://react.dev/reference/react/useContext)과 동일하게 동작한다. 하지만 use의 경우 **If 문**과** for 문** 안에서 `조건부`로 호출이 가능하다!

# 개선점

## ref as a props

![React Conf 2024](e2311a54-1.png)

이제 `ref`를 **props**로 넘겨줄 때 `forwardRef` 로 컴포넌트를 감싸지 않아도 된다. 추후 `forwardRef`는 삭제될 예정이라고 한다.

## ref, clean up 함수

```typescript
<input
  ref={(ref) => {
    // ref가 생성됨
    
    // NEW: ref가 DOM에서 제거될 때 실행되는 cleanup 함수 반환
    return () => {
      // ref clean up (정리 작업)
    };
  }}
/>
```

ref 콜백에 **clean up 함수**가 추가된다. 컴포넌트가 언마운트되거나 ref가 해제될 때 호출되며 ref와 관련된 리소스를 정리하거나 필요한 해제 작업을 수행이 가능하다.

## Context.Provider 삭제

```typescript
const ThemeContext = createContext('');

function App({children}) {
  return (
    <ThemeContext value="dark">
      {children}
    </ThemeContext>
  );  
}
```

[Context](https://react.dev/learn/passing-data-deeply-with-context) 사용시 `<Context.Provider>` 대신 `<Context>`로 렌더링이 가능해진다.
추후 `<Context.Provider>` 는** 삭제될 예정**이기 때문에 코드상에서 Context를 사용한 부분 및 라이브러리 업데이트 등의 대응이 필요할 듯하다.

## useDeferredValue 초기값

```typescript
useDeferredValue(value, initialValue?) 
```

[useDeferredValue](https://react.dev/reference/react/useDeferredValue)의 initialValue(초기값)이 추가된다. initialValue로 초기 렌더링 후 value 인자를 return 하는 렌더링이 진행된다.

## 컴포넌트 내부, metadata tag 지원

```typescript
function BlogPost({post}) {
  return (
    <article>
      <h1>{post.title}</h1>
      <title>{post.title}</title>
      <meta name="author" content="Josh" />
      <link rel="author" href="https://twitter.com/joshcstory/" />
      <meta name="keywords" content={post.keywords} />
      <p>
				...
      </p>
    </article>
  );
}
```

기존에는 metadata tag을 사용하기 위해서 document의 `<head>`에 지정하거나 [react-helmet](https://github.com/nfl/react-helmet) 같은 라이브러리의 도움을 받았어야 했다.
이제는 컴포넌트에서 `<title>` `<link>` `<meta>` 태그 사용이 가능해진다. 해당 태그들은 `<head>` 로 자동으로 [호이스팅](https://developer.mozilla.org/ko/docs/Glossary/Hoisting)된다.

## stylesheets 지원

stylesheets(스타일시트)의 순서를 `precedence` 속성을 사용하여 지정할 수 있게 된다. 또한 중복되는 스타일시트는 제거한다. 이는 스타일시트가 올바른 **순서대로 로드**되고 **중복되지 않도록 보장**한다.
컴포넌트에서 `<link>` 태그 사용이 가능 해짐에 따라 **스타일시트도 컴포넌트 별로 불러올 수 있게 된다.**
**CSR, SSR** 모두에서 렌더링 전 스타일시트를 불러오게 된다. 이를 통해 스타일이 적용되지 않은 콘텐츠가 뒤늦게 스타일이 적용되면서 깜빡이는 현상을 방지할 수 있다.

## 비동기 scripts 지원

```typescript
function MyComponent() {
  return (
    <div>
      <script async={true} src="..." />
      Hello World
    </div>
  )
}
```

`<script>` 태그를 통해 필요한 스크립트를 컴포넌트 단에서 불러올 수 있다. 만약 동일한 자원을 여러 컴포넌트에서 불러온다면 자체적으로 스크립트 중복을 제거해준다.

![](e2311a54-2.png)

자체적으로 `async` 속성이 생기면서 **Server Component** 와의 호환을 위해 `defer` 속성을 추천하지 않게 되었다.

## preloading resouces 지원

```typescript
import { prefetchDNS, preconnect, preload, preinit } from 'react-dom'
function MyComponent() {
  preinit('https://.../path/to/some/script.js', {as: 'script' }) // 스크립트 로드 & 실행
  preload('https://.../path/to/font.woff', { as: 'font' }) 
  preload('https://.../path/to/stylesheet.css', { as: 'style' }) 
  prefetchDNS('https://...') // 브라우저가 연결에 대한 준비를 함
  preconnect('https://...') // 브라우저가 자원을 연결을 시켜둠
}
```

```typescript
<html>
  <head>
    <link rel="prefetch-dns" href="https://...">
    <link rel="preconnect" href="https://...">
    <link rel="preload" as="font" href="https://.../path/to/font.woff">
    <link rel="preload" as="style" href="https://.../path/to/stylesheet.css">
    <script async="" src="https://.../path/to/some/script.js"></script>
  </head>
  <body>
    ...
  </body>
</html>
```

리소스를 미리 불러오는 [API](https://react.dev/reference/react-dom#resource-preloading-apis)가 추가되었다. 컴포넌트에서 `<link>` 태그를 사용하지 않고 제공하는 API를 이용해 `직관적`으로 리소스를 불러올 수 있는 것 같다.

# 정리

form 및 기타 편의성이 대폭 강화되었다. 기존의 불편했던 React의 사용성을 개선한 서드 파티 라이브러리의 기능을 React 내부로 가져온 느낌이 든다.
기술된 내용들은 코드상에서 사용가능한 부분(새로운 훅) 및 개선점이지만 업데이트를 통해 [react-compiler](https://react.dev/blog/2024/02/15/react-labs-what-we-have-been-working-on-february-2024#react-compiler)와 같이 `React의 내부 동작 방식`이 바뀌는 부분도 있기 때문에 필히 이를 **인지**하고 업데이트 및 사용해야겠다.
[Next.js](https://nextjs.org/)도 이에 맞춰서 `14 버전` 이후로 `15 버전`을 준비하고 있는 것 같은데, 요즘 프론트엔드 프레임워크 생태계가 아주 활발하게 돌아가고 있는 것 같아서 흥미롭다. 그리고 새롭게 알아야 할 지식이 점점 많아진다. 🤡
