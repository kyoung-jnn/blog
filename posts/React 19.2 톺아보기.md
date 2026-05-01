---
date: 2025-10-26
published: false
slug:
thumbnail:
---

# **\<Activity /\>**
> React에 새로 추가된 컴포넌트다. hooks만 추가되던 React에 새로운 컴포넌트라니..?
기존, 조건부 렌더링을 생각해보자
```bash
// 기존 방식
{isVisible && <Component />}
```
위와 같이 상태를 바라보면서 컴포넌트의 렌더링을 분기하는 일반적인 방법이다. 하지만 
이제는 `<Activity />` 컴포넌트로 더 똑똑하게 처리할 수 있다.
```bash
// React 19.2의 새로운 방식
<Activity mode={isVisible ? 'visible' : 'hidden'}>
  <Component />
</Activity>
```
조건부 렌더링은 컴포넌트를 완전히 언마운트시킨다. 상태가 사라지고, 다시 마운트할 때 처음부터 렌더링해야 한다. 반면 `<Activity />`는 컴포넌트를 DOM에 유지하면서 상태를 보존한다. 
`<Activity />`는 두 가지 모드를 지원하는데
- **visible**: 자식 요소를 표시하고, Effect를 마운트하며, 업데이트를 정상적으로 처리한다.
- **hidden**: 자식 요소를 숨기고(`display: none`), Effect를 언마운트한다. 자식 요소에서 props를 넘기면 hidden 상태에서도 **리렌더링**이 되는데 우선 순위가 낮아진다고 한다.
즉, 요소의 상태를 유지한채 UI에서 제거 및 
## 1. State 유지, DOM 유지
## 2. Pre-render
지금까지는 Activity로 **이미 본 콘텐츠의 상태를 유지**하는 방법을 봤다. 하지만 Activity는 반대로도 사용할 수 있다. 사용자가 **아직 보지 않은 콘텐츠를 미리 준비**하는 것.
### 유의 사항
![](294d55b8-1.png)
```javascript
function Posts() {
  const [posts, setPosts] = useState([]);
  
  useEffect(() => {
    // ❌ Activity가 hidden이면 이 코드 실행 안 됨!
    fetch('/api/posts')
      .then(res => res.json())
      .then(setPosts);
  }, []);
  
  // ...
}

```
`<Activity />` 내부에서는 Effect를 마운트하지 않기 때문에 위와 같이 사용하면 동작하지 않는다.
# useEffectEvent
다들 이런 생각을 한번 쯤은 해봤을 것이다. ‘나는 컴포넌트가 마운트 되었을 때만 effect를 실행시키고 싶어’ 하지만 내부에서 실행되는 함수들의 변수들 때문에 ㅇ
