---
date: 2022-06-08
published: true
slug:
thumbnail:
---

- **useState** 대신 복잡한 구조의 상태 관리 가능
- 상태 관리 코드를 상태를 사용하는 컴포넌트와 분리해서 **유지보수**
- 미들웨어들을 통해 비동기 처리 및 상태 처리 가능
간략히 위와 같은 장점들로 거의 **React 프로젝트**와** 전역 상태 관리**는 떼려야 뗄 수 없는 수준이 되버렸습니다. 🤓
`Redux`, `MobX`, `Recoil` 등등 수 많은 **상태관리 라이브러리**가 나오고 있고, 오늘은 MobX를 중점으로 살펴봅시다. 😎
# 기존의 상태관리, Redux
전역 상태관리 하면 바로 떠오르는 라이브러리는 `Redux`입니다. 사실상 상태관리의 교과서라고 불릴 만큼 수 많은 프로젝트에서 사용되는 라이브러리인데요.
`Redux`를 사용하기 위해 복잡한 보일러플레이트 코드가 필요하고
비동기 처리를 위해 **별도의 미들웨어 (Redux-thunk, Redux-saga)** 등을 설치해야 된다는 불편함이 존재합니다.
또한 **Immutable**적인 Store 덕분에 저희는 항상 새로운 상태 값을 Store에 반환해줘야 하고 하나의 Store만을 Provider에 등록해야 했습니다.
> 최근 `Redux-toolkit`의 등장으로 위와 같은 불편함들이 일부 해소되긴 했습니다.
# MobX!
`MobX`는 Redux의 불편함을 해소하고 기존의 `Funtional Programming`적인 Redux의 구성에서 벗어나 조금 더 `OOP` 적이게 **상태를 관리하는 라이브러리**입니다.
**Singleton** 형태로 구성된 상태(class)를 **React Context**를 통해 전역 상태로 관리하고 단순한 로컬 상태 또한 관리가 가능합니다.
**하지만**, [공식 문서](https://ko.mobx.js.org/the-gist-of-mobx.html)에서도 말하길 높은 자유도로 인해 **정답인 MobX 구조는 없어서 러닝 커브**가 낮지만 최적화된 구조를 적용할 때까지 *만만치 않은* 러닝 커브를 갖게 될 것 같기도 합니다..🥲
# MobX Core
`MobX`는 어플리케이션에서 세 가지 의 중요한 개념이 존재합니다.
- 상태 (state)
	- 애플리케이션을 구동하는 데이터 (일반 객체, 배열, 클래스, 순환 데이터 구조 또는 참조)
	- Class 를 통해 주로 제작 (OOP 🤓)
	- 코드에 `observable`로 표시를 통해 MobX가 추적할 수 있도록 `(중요!)`
```javascript
export class CounterStore {
  count = 0;

  constructor() {
    makeObservable(this, {
      count: observable,
    });
  }
}
```
- 동작 (action)
	- observable한 값을 변화 시키는 행동
	- 코드에 `action` 표시를 통해 MobX가 트랜잭션을 자동으로 적용하여 성능을 쉽게 최적화
- 파생 (derivation)
	- **observable state**의 변화로 인해 파생될 수 있는 모든 것이 `derivation`
	- MobX는 다음과 같이 두 종류로 `derivation`을 구분합니다.
		1. **computed** 값: 현재 observable state를 통해 파생(생성)될 수 있는 값JS getter 함수 get을 사용하여 속성을 정의하고 `computed`로 표시합니다.
		2. **reaction** 값: observable state가 변경될 때 자동으로 발생해야 하는 부수효과
			- 값을 반환하는 대신 콘솔 출력, 네트워크 요청, DOM 패치 적용을 위해 React 컴포넌트 트리를 업데이트하는 등의 부수효과

```javascript
export class CounterStore {
  count = 0;

  constructor() {
    makeObservable(this, {
      count: observable,
      increase: action,
      decrease: action,
      getCount: computed,
    });
  }

  get getDoubleCount() {
    return this.count * 2; // 현재 state가 변화하면 자동으로 값을 업데이트
  }

  increase = () => {
    this.count += 1;
  };

  decrease = () => {
    this.count -= 1;
  };
}
```
# MobX Flow
![](mobx-flow.png)
`단방향 데이터 흐름`으로 action을 통해 state (observable state) 에 변화가 생기면 해당 state를 사용하는 view가 다시 렌더링되고, computed & reaction 등 state 변화로 인해 파생 된 행동들이 실행됩니다.
# MobX 예제
> 데코레이터를 v6 부터는 권장하지 않고 makeObservable, makeAutoObservable를 통해 지정함
### 1. Store 설정 / count.js
```javascript
import { createContext, useContext } from 'react';
import { makeObservable, observable, action, computed } from 'mobx';

// class 사용
class CounterStore {
  count = 0;

  constructor() {
    makeObservable(this, {
      count: observable,
      increase: action,
      decrease: action,
    });
  }

  increase = () => {
    this.count += 1;
  };

  decrease = () => {
    this.count -= 1;
  };
}

export const counterStore = new CounterStore(); // 레퍼런스 생성
const CounterStoreContext = createContext(counterStore);
// Context 사용을 위한 Hook
export const useCounterStore = () => useContext(CounterStoreContext);
```
### 2. Provider 설정 / App.js
```javascript
import { Provider } from 'mobx-react';

const stores = {
  counterStore,
};

function App() {
  // Provider를 통해 store 전달
  return <Provider {...stores}>...</Provider>;
}
```
### 3. Context 사용 / Count.jsx
```javascript
import { observer } from 'mobx-react';
import { useCounterStore } from 'store/count';

function Count() {
  // hook 형식으로 데이터 가져오기
  const { count, increase, decrease } = useCounterStore();

  return (
    <div>
      <h1>Count</h1>
      <h2>{count}</h2>
      <button onClick={increase}>증가</button>
      <button onClick={decrease}>감소</button>
    </div>
  );
}

// observable state를 사용하는 컴포넌트는 observer 설정을 반드시 해줘야합니다.
export default observer(Count);
```
# 번외. 전역 스토어 접근 Hook 만들기 / useStore
```javascript
import { useContext } from 'react';
import { MobXProviderContext } from 'mobx-react';

function useStore() {
  return useContext(MobXProviderContext);
}

export default useStore;
```
****
```javascript
function Count() {
  const { counterStore } = useStore();

  return (
    ...
  );
}
```
컴포넌트별로 useContext를 사용하지 않고 MobX에서 제공하는 `MobXProviderContext`를 이용하여 전역 스토어에 접근가능한 Hook구현 또한 가능합니다. ✨
