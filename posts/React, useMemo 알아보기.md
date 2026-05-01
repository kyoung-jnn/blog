---
date: 2022-04-05
published: true
slug:
thumbnail:
---

```javascript
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
```
> **메모이제이션(Memoization)** 된 값을 반환합니다.
`useMemo` 는 위와 같은 한 문장으로 정리할 수 있습니다.
`useMemo`를 이용하여 우리는 훅의 deps / 2번째 파라미터로 들어가는 변수가 변하지 않으면 해당 변수를 이용하는 함수의 실행을 하지 않고 메모이제이션, 즉 이전에 저장된 값을 이용합니다.
이를 통해 복잡한 계산을 하는 컴포넌트들의 불필요한 렌더링을 줄이게 되고 코드의 최적화가 가능해집니다. 👍
# 예시 코드
### 비효율 코드
```javascript
// useMemo를 사용하지 않은 컴포넌트
const computeExpensiveValue = (prop) => {
  // 에너지가 많이 소모되는 계산 발생
};

const notUsingMemo = ({ prop1, prop2 }) => {
  const valueComputedFromProp1 = computeExpensiveValue(prop1);

  return (
    <>
      <div>{valueComputedFromProp1}</div>
      <div>{prop2}</div>
    </>
  );
};
```
위 코드에서 `prop2` 만 값의 변화가 생기면 기존에 있던 `prop1`은 값의 변화가 없지만, 에너지 소모가 큰 계산이 다시 이루어져야 합니다. 😅
### 최적화 코드 / useMemo 사용
```javascript
const computeExpensiveValue = (prop) => {
  // 에너지가 많이 소모되는 계산 발생
};

const usingMemo = ({ prop1, prop2 }) => {
  const valueComputedFromProp1 = useMemo(() => {
    return computeExpensiveValue(prop1);
  }, [prop1]);

  return (
    <>
      <div>{valueComputedFromProp1}</div>
      <div>{prop2}</div>
    </>
  );
};
```
`useMemo` 를 이용하여 값의 변화를 인지해야할 부분을 감싸게 되면 `prop1`의 변화가 없으면 불필요한 연산(**computeExpensiveValue**)을 수행하지 않고 기존의 변수의 값을 이용합니다. ✨

