---
date: 2025-01-05
published: true
slug:
thumbnail:
---

React의 [Suspense](https://react.dev/reference/react/Suspense) 도입으로 인해 컴포넌트 외부에서 컴포넌트 자식들의 **loading 상태**에 따라 UI를 관리할 수 있게 되었다. 이를 통해 React가 지향하는 선언적 프로그래밍, 선언적 데이터 패칭이 쉽게 가능해졌다.
![React 공식문서](dashboard-19.png)
위와 같이 `Suspense`는 활성화되는 조건이 정해져있다. 특히 외부 프레임워크, 라이브러리 등을 사용할 때는 React의 Suspense를 지원하는지가 중요하다.
비동기 상태 관리 라이브러리인 [TanStack Query](https://tanstack.com/query/latest)에서 [useQuery의 suspense](https://tanstack.com/query/v4/docs/framework/react/guides/suspense)(v5에서 [useSuspenseQuery](https://tanstack.com/query/latest/docs/framework/react/guides/migrating-to-v5#new-hooks-for-suspense)로 아예 분리 되었다)를 이용하면 isLoading, isSuccess 같은 값을 사용하지 않고 `Suspense`로 인한 선언적인 컴포넌트 관리가 가능해진다.
# Next.js, TanStack Query와의 문제점
아래와 같은 조건의 페이지를 구현한다고 가정한다.
> 💡 - Next.js **Page Router**를 사용한다.
> - API 요청은 **TanStack Query v5**를 이용한다.
> - API 응답이 오래걸리는 경우 **Suspense**를 통해 Loading UI를 보여주어 CSR 방식을 이용한다.
## 예시 1. 일반 Suspense 사용
`API 요청(일부로 2초 지연)`을 하여 요청이 오래걸린 다는 상황을 만든다. 사용자에게 데이터 요청 시간동안 `Suspense`의 fallback의 Loading UI를 먼저 보여주고, 2초 뒤 응답을 받아 데이터를 표시해보자.
```typescript
type User = {
  name: string;
  phone: string;
};

const mockApi: () => Promise<User[]> = async () => {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const response = await fetch("https://jsonplaceholder.typicode.com/users");
  const result: User[] = await response.json();
  return result;
};

```
```typescript
// List.tsx
import { mockApi } from "@/api/mockApi";
import { useSuspenseQuery } from "@tanstack/react-query";

function List() {
  const { data } = useSuspenseQuery({
    queryKey: ["mock"],
    queryFn: () => mockApi(), 
  });

  return (
    <ul>
      {data.map(({ name, phone }) => (
        <li key={name}>
          <p>name: {name}</p>
          <p>phone: {phone}</p>
        </li>
      ))}
    </ul>
  );
}

// Page.tsx
function Page() {
  return (
    <Suspense fallback={<h1>Loading...</h1>}>
      <List />
    </Suspense>
  );
}
```
![크롬 Performance 탭, TTFB 지연이 발생](dashboard-6.gif)

![](dashboard-20.png)

하지만 실제 동작을 확인해보면, `Suspense` fallback이 동작하지 않는다.
오히려 API 응답이 반영된 HTML이 바로 브라우저에 곧 바로 보여진다.
Network 탭을 통해 HTML을 확인해보자. TanStack Query의 [Prefetch](https://tanstack.com/query/latest/docs/framework/react/guides/prefetching) 기능을 사용하지 않았는데도 API 응답 데이터가 채워져 있다.
이를 통해 Next.js(SSR) Suspense 내부에 useQuery(suspense option)를 이용하면 
**의도치 않게 Server Side에서 데이터 요청을 미리 불러오는 것**을 확인할 수 있다.

![](dashboard-21.png)
즉, 초기 렌더링에 `Suspense` fallback이 동작하지 않는다. 만약 예시와 같이 API 요청이 길어질 경우 [TTFB](https://web.dev/articles/ttfb?hl=ko)가 비약적으로 높아지는 현상이 발생한다.
## 예시 2. SSRSuspense 사용
SSR에서 정상적이게 동작하는 Suspense를 구현해보자.
```typescript
function SSRSuspense(props: ComponentProps<typeof Suspense>) {
  const [mount, setMount] = useState(false);
  useEffect(() => {
    setMount(true);
  }, []);

  if (!mount) return <>{props?.fallback}</>;
  return <Suspense {...props} />;
}
```
약간의 커스텀을 통해 `Suspense`에 위와 같은 조건을 추가해준다면 Server Side에서 컴포넌트 렌더 자체를 하지 못 한다. 따라서 컴포넌트 내부 useQuery의 존재 자체를 알지 못하기 때문에 위에서 언급한 문제가 발생하지 않는다. 
또한 렌더를 Client Side에서만 진행하기 때문에 **Hydration 에러** 또한 없어진다.
![크롬 Performance 탭, TTFB 지연 없이 곧 바로 fallback 노출](dashboard-7.gif)
하지만, 은빛 총알은 없다..! `SSRSuspense`는 일반적으로 언급된 모든 상황을 해결하는 것 같이 보이지만, 스크롤 복원과 같은 **mount 전,후 조작**을 하는 경우 또 다른 의도치 않은 동작을 야기한다.
```typescript
const nextConfig = {
  experimental: {
		scrollRestoration: true,
  },
};
```
실제로 Next.js에서 자체적으로 제공하는 스크롤 복원이 `SSRSuspense`를 사용하면 동작을 하지 않는다.
## 예시 3. App Router 사용
위에서 언급된 문제들은 근본적으로 React 18부터 [변경된 Suspense의 내부 로직](https://github.com/reactwg/react-18/discussions/37)을 프레임워크, 라이브러리들이 안정적이게 지원하지 못 해서 발생하는 현상이다.
최근 **Next.js 14**(최근이라기엔 15도 나와버렸다..)부터 [App Router](https://nextjs.org/docs/app)를 통해 [React Streaming](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming#what-is-streaming)을 지원하게 되고 컴포넌트별 렌더링 패턴을 정할 수 있게 되었다. 이를 통해 Suspense에 대한 특이 케이스도 안정적인 지원이 가능해졌다.
![Next.js App Router, Suspense가 정상 작동](dashboard-8.gif)
# 마치며
최근 [React 19](https://react.dev/blog/2024/12/05/react-19)가 정식 출시되었다. 안정화된 [RSC](https://react.dev/reference/rsc/server-components)에 대한 도입으로 프로젝트 마이그레이션을 준비하면서 무의식적으로 사용하고 있던 `SSRSuspense`의 필요성에서 발견한 이슈이다. 
사실 위와 연관된 이슈는 꽤 오래전부터 발생한 [이슈](https://github.com/vercel/next.js/discussions/36385)이다. 그때 당시 발생한 이슈에 대해 즉각적으로 대응하여 `SSRSuspense`라는 대응책을 냈지만, 기록이 남아있지 않아 오늘날에 와서 깊게 파악하게 되었다.
결국 빠르게 변화하는 프론트엔드 생태계에서 이런 이슈에 대한 `대응과 기록`이 꼭 필요하다. 
아마 익숙하게 사용하고 있던 코드들이 그때 당시 은빛 총알이라고 생각하고 수정해서 사용하고 있던 코드가 아닌지 항상 생각해야겠다.

