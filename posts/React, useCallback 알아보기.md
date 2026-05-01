---
date: 2022-04-05
published: true
slug:
thumbnail:
---

# useCallback? 🤔

```javascript
const memoizedCallback = useCallback(() => {  doSomething(a, b);}, [a, b]);
```

> `메모이제이션`된 콜백을 반환합니다.

useCallback은 useMemo와 비슷한 `Hook` 입니다. 😵
큰 차이점은 `useMemo` 는 값을 기억(메모리제이션)했지만 `useCallback` 은 함수를 기억하는 것이 큰 차이라고 볼 수 있습니다.

# 예시 코드

```javascript
const ComponentThatRendersOften = ({ cb1, cb2 }) => {
  const [state, setState] = useState(...);
  const doSomething = () => {
    // 에너지가 많이 소모되는 연산
    ...
    setState(...);
    cb1();
  };
  return (
    <button onClick={doSomething} />
  );
};
```

컴포넌트가 랜더링될 때 마다 에너지가 많이 소모되는 `doSomething` 함수를 다시 선언합니다.
아예 컴포넌트의 **스코프** 밖으로 함수를 옮기는 방법이 있지만 그럴 경우 함수의 파라미터를 매번 넘겨줘야 하기 때문에 가독성이 떨어지게 됩니다.

```javascript
const ComponentThatRendersOften = ({ cb1, cb2 }) => {
  const [state, setState] = useState(...);
  const doSomething = useCallback(() => {
    // 에너지가 많이 소모되는 연산
    ...
    setState(...);
    cb1();
  }, [cb1]);
  return (
    <button onClick={doSomething} />
  );
};
```

이러한 상황에서 `useCallback` 훅을 이용하게 되면 `deps` 배열에 들어가는 변수가 변하지 않게 되면 해당 함수를 재선언하지 않게 됩니다!

### ❗ 주의사항

> 만약에 **deps** **배열** 안에 함수에서 사용하는 값을 넣지 않게 된다면, 함수 내에서 해당 값들을 참조할 때 가장 최신 값을 참조 할 것이라고 보장할 수 없습니다. ❌ (해당 값이 업데이트가 되었는지 deps 배열에서 확인하므로)

# 최적화?

위와 같이 `useCallback` 가 반환하는 메모이제이션된 함수를 이용하면 컴포넌트의 최적화를 이룰수 있게 되지만
실제로 컴포넌트가 랜더링될 때, 함수 선언과 관련된 것은 성능 최적화에 큰 문제가 되지는 않다고 합니다..
그렇다면 `useCallback`은 어떻게 쓸 때 의미가 있을까요? 🙄

### 함수의 동등성

```javascript
> const add1 = () => x + y;
undefined
> const add2 = () => x + y;
undefined
> add1 === add2
false
```

`JavaScript`에서는 함수의 동등함 비교는 위 결과가 도출됩니다. 함수도 객체 취급을 하기 때문에 함수 비교에 새로운 메모리 주소에 의한 참조 비교가 일어나기 때문입니다.

> (결국 다른 메모리에 저장되므로 동등성 ❌)

### 동등성 문제

실제 코드에서는 동등성이 무슨 문제를 일으킬까요?

```javascript
function Profile({ userId }) {
  const [user, setUser] = useState(null);
  const fetchUser = () =>
    fetch(`https://api/users/${userId}`)
      .then((response) => response.json())
      .then(({ user }) => user);
  useEffect(() => {
    fetchUser().then((user) => setUser(user));
  }, [fetchUser]);
}
```

위와 같은 코드에서는 아래와 같이 절차가 이루어집니다.

- 컴포넌트 랜더링 과정에서 `fetchUser` 함수가 선언됩니다.
- `uesEffect` 훅으로 인한 `fetchUser` 함수가 실행이 됩니다.
- 해당 함수에서 `user state`를 변화합니다.
- 컴포넌트가 다시 랜더링 됩니다. **(state 변화로 인한)**
- 컴포넌트 랜더링 과정에서 `fetchUser` 함수가 선언됩니다. **(동등성 문제로 다른 함수 취급)**
- `uesEffect` 훅으로 인한 `fetchUser` 함수가 실행이 됩니다....**무한루프** 🤪

> **동등성 문제**로 무한루프가 발생하고 있습니다 ❗️

### 동등성 문제 해결 (useCallback)

```javascript
function Profile({ userId }) {
  const [user, setUser] = useState(null);
  const fetchUser = useCallback(
    () =>
      fetch(`https://api/users/${userId}`)
        .then((response) => response.json())
        .then(({ user }) => user),
    [userId],
  );
  useEffect(() => {
    fetchUser().then((user) => setUser(user));
  }, [fetchUser]);
}
```

이러한 상황에서 `useCallback` 을 사용합시다!

- 컴포넌트 랜더링 과정에서 `fetchUser` 함수가 선언됩니다.
- `uesEffect` 훅으로 인한 `fetchUser` 함수가 실행이 됩니다.
- 해당 함수에서 `user state`를 변화합니다.
- 컴포넌트가 다시 랜더링 됩니다. **(state 변화로 인한)**
- 컴포넌트 랜더링 과정에서 `fetchUser` 함수가 선언되지 않습니다. **(useCallback의 deps 배열 변화가 없으므로 기존에 있던 함수 재사용!)**
