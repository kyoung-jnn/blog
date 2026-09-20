---
date: 2026-04-04
slug:
published: true
thumbnail:
aliases:
  - Claude Code는 터미널에서 React를 어떻게 사용할까?
---

2026년 3월 31일, Claude Code의 소스코드가 통째로 유출됐다. 😇

보안 연구자 Chaofan Shou(X: [@Fried_rice](https://x.com/Fried_rice/status/2038894956459290963))가 새벽에 올린 짧은 트윗 한 줄이 사건의 시작이었다.  
npm 레지스트리에 올라간 map 파일을 통해 Claude Code 소스코드가 노출됐다는 내용이었는데, 실제로 까보니 단순한 실수치고는 규모가 어마어마했다.

`@anthropic-ai/claude-code` 2.1.88 버전을 npm에 배포하는 과정에서 59.8MB짜리 소스맵(`cli.js.map`) 파일이 같이 올라갔다.  
이 파일 안에는 난독화되지 않은 TypeScript 원본 소스 약 1,900개 파일, 51만 줄 이상이 들어 있었다.  
Anthropic은 고객 데이터나 자격증명은 포함되지 않았고, 릴리즈 패키징 실수라고 설명했다. ([Axios 보도](https://www.axios.com/2026/03/31/anthropic-leaked-source-code-ai))

트윗이 올라온 지 몇 시간 만에 소스코드는 GitHub 여기저기에 미러링됐고, [ccunpacked.dev](https://ccunpacked.dev/) 같은 분석 도구도 등장했다.  
다만 이 시점부터는 주의가 필요하다. 유출 소스 기반을 자처하며 등장한 일부 미러 저장소에는 악성코드가 섞인 사례도 있었다.  
직접 받아 실행해보고 싶은 마음이 든다면 출처를 한 번 더 확인하자.

이번 글에서는 그 난리 속에서도 프론트엔드 개발자로서 가장 흥미로웠던 부분, 바로 "이 까만 터미널 앱이 내부적으로 React를 어떻게 쓰고 있었는가"를 정리해봤다.

# React가 터미널에 있다고?

Claude Code CLI를 매일 쓰면서도 이게 React로 돌아간다는 생각은 한 번도 해본 적이 없었다.

브라우저도 없는 까만 터미널 창에 텍스트만 주르륵 흐르는 앱인데, 어떻게 React를 썼다는 걸까?

답은 React의 본질을 다시 보면 쉽게 풀린다.  
**React는 애초에 웹 페이지를 그리는 도구라기보다, 상태에 따라 컴포넌트 트리를 선언적으로 관리하는 도구에 가깝다.**  
그리고 최종 출력 대상만 바꿔주면 된다.

웹에서는 `react-dom`이 `<div />`, `<button />`을 실제 DOM으로 바꾼다. React Native에서는 네이티브 뷰로 바꾼다. Claude Code는 그 자리에 터미널을 넣었다.

그 다리 역할을 한 것이 [Ink](https://github.com/vadimdemedes/ink)다. Ink는 React 컴포넌트를 터미널 UI로 렌더링하는 라이브러리다. `div` 대신 `Box`, `span` 대신 `Text`를 쓴다고 생각하면 얼추 맞다.

```tsx
import { Box, Text } from 'ink'

function Status() {
  return (
    <Box flexDirection="column">
      <Text color="green">✓ 파일 분석 중</Text>
      <Text dimColor>src/components/App.tsx</Text>
    </Box>
  )
}
```

브라우저라면 이 JSX의 결과가 DOM 노드가 된다. Ink에서는 줄, 공백, 색상 ANSI escape code가 된다. 결국 화면에 보이는 것은 텍스트지만, 만드는 방식은 React 앱과 거의 같다.

# 1. React + Ink 구조

흐름을 단순하게 그리면 이렇다.

```text
상태 변경
  ↓
React 컴포넌트 렌더링
  ↓
Reconciler가 이전 트리와 비교
  ↓
Ink가 Box, Text 등을 터미널 레이아웃으로 계산
  ↓
ANSI escape code를 stdout에 출력
  ↓
터미널 화면 갱신
```

여기서 핵심은 `Reconciler`다. **React는 상태가 바뀔 때마다 화면 전체를 새로 그리는 라이브러리가 아니다.** 이전 컴포넌트 트리와 새 트리를 비교하고, 바뀐 부분만 renderer에게 전달한다.

```tsx
function Spinner() {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setFrame((frame) => frame + 1), 80)
    return () => clearInterval(timer)
  }, [])

  return <Text>{['⠋', '⠙', '⠹', '⠸'][frame % 4]} Thinking...</Text>
}
```

우리가 익숙한 `useState`, `useEffect`가 그대로 나온다. 브라우저 DOM을 만지는 부분만 Ink가 맡는다. 그래서 로딩 스피너, 선택 메뉴, permission prompt처럼 상태가 계속 바뀌는 UI를 명령형으로 쌓아 올리지 않아도 된다.

# 2. 터미널도 생각보다 복잡한 UI다

처음에는 터미널에 React까지 필요한가 싶었다. `console.log`로 찍으면 되는 것 아닌가?

그런데 Claude Code를 조금만 떠올려보면 생각보다 화면 상태가 많다.

- 응답이 토큰 단위로 스트리밍된다.
- tool 호출은 진행 중, 성공, 실패 상태를 가진다.
- 긴 diff는 접히고 펼쳐진다.
- `/`를 누르면 command menu가 열리고, 방향키로 선택한다.
- 파일 수정이나 명령 실행 전에는 permission prompt가 떠야 한다.
- 터미널 폭이 바뀌면 markdown 줄바꿈도 다시 계산해야 한다.

이걸 전부 문자열 붙이기와 cursor 이동으로 관리하면 금방 꼬인다.  
어떤 줄을 지워야 하는지, modal이 닫힌 뒤 원래 화면을 어떻게 복구할지, 스트리밍 중인 메시지와 spinner가 동시에 바뀌면 어느 범위를 다시 그릴지 전부 직접 관리해야 한다.

React를 쓰면 이 문제를 상태로 바꿔 생각할 수 있다.

```tsx
function App() {
  const [permission, setPermission] = useState<PermissionRequest | null>(null)
  const [messages, setMessages] = useState<Message[]>([])

  return (
    <Box flexDirection="column">
      <Conversation messages={messages} />
      {permission && (
        <PermissionPrompt
          request={permission}
          onClose={() => setPermission(null)}
        />
      )}
      <Input />
    </Box>
  )
}
```

permission이 있으면 prompt를 그리고, 없으면 안 그린다. 웹에서 modal을 다루는 방식과 같다. 터미널이라는 이유만으로 상태 관리 방식까지 바꿀 필요는 없어진다.

# 3. 그런데 이거, 그냥 Ink가 아니다

처음에는 Claude Code도 Ink를 설치해서 썼겠거니 생각했다. 소스를 열어보면 생각보다 훨씬 과하다. **`src/ink` 디렉터리에 React renderer를 거의 한 벌 새로 만들어두었다.**

Ink에서 출발한 것은 맞지만, Claude Code의 구현은 일반적인 Ink 앱이라고 부르기 애매할 정도다.  
`react-reconciler`를 직접 연결하고, Yoga로 flexbox layout을 계산하고, 터미널 화면을 2차원 cell buffer로 들고 있다.  
브라우저의 DOM과 GPU가 해주던 일을 터미널용으로 다시 만든 셈이다. ([분석된 `src/ink` 구조](https://github.com/alanisme/claude-code-decompiled/blob/main/docs/en/18-react-ink-terminal-ui.md))

## React element를 터미널 DOM으로 바꾸기

브라우저의 React는 `<div />`를 `HTMLDivElement`로 만든다. Claude Code의 custom reconciler는 `<Box />`, `<Text />` 같은 element를 `ink-box`, `ink-text`, `ink-link` 같은 자체 DOM node로 바꾼다.

```tsx
// 실제 구조를 단순화한 예시
const reconciler = createReconciler({
  createInstance(type, props) {
    return createInkNode(type, props)
  },
  appendChild(parent, child) {
    parent.childNodes.push(child)
  },
  resetAfterCommit() {
    computeLayout()
    scheduleRender()
  },
})
```

이 node는 텍스트만 들고 있지 않다. 자식 node, style, event handler, scroll 상태, 그리고 Yoga node까지 갖는다. 그러니까 terminal에 DOM 비슷한 트리가 실제로 존재하는 것이다.

## Yoga는 뭔데?

Yoga는 Meta가 만든 **독립적으로 끼워 넣을 수 있는 Flexbox layout engine**이다. [공식 저장소](https://github.com/facebook/yoga) 표현 그대로, CSS Flexbox 규칙을 계산하는 엔진이라고 보면 된다.

중요한 건 **Yoga가 화면을 직접 그리는 라이브러리는 아니라는 점**이다.  
Yoga에게 node tree와 `flexDirection`, `padding`, `flexGrow` 같은 style을 넘기면, 각 node의 `x`, `y`, `width`, `height`를 계산해준다.  
실제 픽셀을 그리거나 DOM을 만드는 일은 그 다음 단계의 renderer가 맡는다.

```text
React component tree
  ↓
Yoga: 각 node의 위치와 크기 계산
  ↓
renderer: 계산 결과를 실제 화면에 그리기
```

React Native에서 본 구조도 이와 같다. `<View style={{ flexDirection: 'row' }} />`를 선언하면 Yoga가 native view의 frame을 계산하고, iOS/Android renderer가 그 frame을 화면에 그린다. React Native의 `View` default 방향이 `column`인 것도 Yoga의 영향이다. 웹 CSS Flexbox의 default가 `row`인 것과 살짝 다르다. ([React Native Flexbox 문서](https://reactnative.dev/docs/flexbox))

Claude Code는 native view 대신 terminal cell을 그린다. 그런데 terminal에도 "왼쪽에는 spinner, 오른쪽에는 실행 시간", "긴 경로는 남은 폭 안에서 줄여 표시", "modal은 가운데" 같은 layout이 필요하다. 문자열 길이와 공백을 손으로 계산해도 되지만, 화면이 커지면 바로 고역이다.

```tsx
// 이 선언만으로 Yoga가 terminal column 안의 배치를 계산한다.
<Box flexDirection="row" justifyContent="space-between">
  <Text>⠹ Reading src/App.tsx</Text>
  <Text dimColor>1.2s</Text>
</Box>
```

terminal 폭이 80 column이면 Yoga는 왼쪽 text와 오른쪽 `1.2s`를 어디에 놓을지 계산한다. 폭이 40 column으로 줄면 남는 폭도 다시 계산한다. renderer는 그 좌표를 받아 해당 cell에 문자와 ANSI style을 채운다.

그래서 Yoga를 고른 것도 납득이 간다. `<Box flexDirection="row" justifyContent="space-between" />`처럼 작성한 레이아웃을 terminal 열 수와 행 수에 맞춰 계산해야 하기 때문이다. 창 크기가 바뀌면 root Yoga node의 width를 새 terminal width로 설정하고 layout을 다시 계산한다. 웹의 responsive layout이 terminal resize에서도 그대로 필요한 셈이다.

## 매번 화면 전체를 다시 그리지 않는다

이 부분이 제일 흥미로웠다. **터미널 UI가 버벅이는 이유는 React가 아니라 stdout에 너무 많은 문자를 쓰는 데 있다.**

Claude Code renderer는 `frontFrame`, `backFrame` 두 화면 버퍼를 둔다.  
새 화면은 back buffer에 그리고, 이전 화면인 front buffer와 비교한다.  
달라진 cell만 patch로 만들고 cursor 이동, 색상 변경, 텍스트 쓰기 ANSI sequence로 바꿔 stdout에 한 번에 보낸다.

```text
이전 frame:  [ Claude is thinking...          ]
새 frame:    [ Claude is thinking... ⠹        ]
                                   ^ 이 cell만 변경

stdout: cursor 이동 + spinner 문자만 출력
```

만약 spinner 한 칸 바뀔 때마다 대화 전체를 다시 출력한다면 긴 세션에서 바로 티가 난다. 이중 버퍼와 diff는 terminal에서의 virtual DOM 같은 역할을 한다. 소스에는 patch를 더 줄이는 optimizer와 스타일 객체 재사용을 위한 pool도 있다.

렌더 요청도 바로 stdout으로 보내지 않는다.  
React commit 뒤 layout을 계산하고, microtask로 render를 미룬 다음, 약 16ms 단위로 묶어서 처리한다.  
`useLayoutEffect`가 최신 layout 값을 읽을 수 있고, token이 빠르게 들어와도 화면이 필요 이상으로 흔들리지 않는다.  
말 그대로 terminal에서 60fps를 목표로 한 render loop다.

## 터미널에 event system까지 있다

더 놀라운 부분은 입력 처리다. 일반 CLI라면 `stdin.on('data')`에서 키를 받아 조건문으로 분기하면 끝난다. Claude Code는 focus manager를 두고, target node를 찾은 뒤 capture/bubble 단계로 event를 dispatch한다.

```text
키 입력
  ↓
현재 focus를 가진 Ink node 확인
  ↓
capture phase
  ↓
target handler
  ↓
bubble phase
```

웹의 click event 흐름과 거의 같다. 그래서 input, autocomplete, modal, scrollable pane이 동시에 있어도 각 컴포넌트가 자기 이벤트를 처리할 수 있다. mouse tracking, text selection, scroll region까지 구현되어 있는 이유도 여기에 있다. 터미널에 브라우저의 UI model을 옮겨놓은 느낌이다.

여기서 재밌는 점은 React를 버리지 않았다는 것이다. **병목은 React 자체보다 터미널에 무엇을, 얼마나 많이 출력하느냐에 더 가까웠다.** 상태와 컴포넌트 모델은 유지하고, 마지막 출력 파이프라인만 터미널 환경에 맞게 바꾼 셈이다.

# 4. React가 잘 맞는 이유

Claude Code의 화면은 사실 웹 앱의 채팅 화면과 닮아 있다.

```text
입력
  ↓
메시지 추가
  ↓
모델 스트리밍
  ↓
tool 호출 카드 추가
  ↓
권한 요청 또는 결과 표시
  ↓
다음 입력 대기
```

이 흐름에는 비동기 이벤트가 계속 들어온다. 모델의 token, subprocess 출력, 파일 변경 결과, 키보드 입력, terminal resize가 거의 동시에 도착한다. React의 단방향 데이터 흐름과 컴포넌트 단위 분리는 이런 UI를 다루기에 꽤 잘 맞는다.

특히 화면 일부를 독립된 컴포넌트로 나눌 수 있다는 점이 크다.

```tsx
<App>
  <Header />
  <Conversation>
    <UserMessage />
    <AssistantMessage />
    <ToolUse />
    <ToolResult />
  </Conversation>
  <PermissionPrompt />
  <Autocomplete />
  <Input />
</App>
```

각 컴포넌트는 자기 상태와 표시 규칙만 신경 쓴다. `ToolUse`는 실행 중이면 spinner를, 끝나면 결과를 보여주면 된다. App 전체가 cursor 위치를 기억하면서 줄 단위로 화면을 조립할 필요가 없다.

# 5. Tool은 실행 코드만 있는 객체가 아니다

소스를 보며 "아 이래서 React 앱이구나" 싶었던 지점이 하나 더 있다. **Claude Code에서 Tool은 `Bash`, `Read`, `Edit`처럼 작업을 실행하는 코드만 뜻하지 않는다. 각 Tool이 자기 화면도 직접 그린다.**

구조를 단순화하면 대략 이런 인터페이스다.

```tsx
interface Tool<Input, Output> {
  call(input: Input): Promise<Output>

  renderToolUseMessage(
    input: Partial<Input>,
    options: RenderOptions,
  ): React.ReactNode

  renderToolUseProgressMessage?(
    progress: ProgressMessage[],
    options: RenderOptions,
  ): React.ReactNode

  renderToolResultMessage?(
    result: Output,
    progress: ProgressMessage[],
    options: RenderOptions,
  ): React.ReactNode
}
```

`call()`이 실제 작업을 수행하고, 나머지는 그 작업을 사용자에게 어떻게 보여줄지 결정한다.  
Grep은 검색 패턴과 경로를, Bash는 실행한 명령과 stdout 일부를, Edit은 바뀐 diff를 자기 방식으로 렌더링한다.  
그래서 transcript에서 보이는 `Read 3 files`, `Edited src/App.tsx`, 접힌 tool 결과가 모두 도구별 React component다.

여기서 `input`이 `Partial<Input>`인 것도 재밌다.  
모델 응답이 streaming되는 동안 tool parameter가 아직 전부 도착하지 않았어도 UI는 먼저 보여줘야 한다.  
`file_path`만 도착한 상태라면 일단 "Reading src/App.tsx"를 그려두고, 나머지 parameter가 도착하면 같은 component를 다시 렌더링하면 된다.  
UI가 API 응답의 완성을 기다리지 않는다.

```tsx
function renderToolUseMessage(input: Partial<GrepInput>) {
  if (!input.pattern) return <Text dimColor>Searching...</Text>

  return (
    <Text>
      Searching <Text color="cyan">{input.pattern}</Text>
      {input.path && ` in ${input.path}`}
    </Text>
  )
}
```

실제 Tool interface에는 결과를 접을 수 있는지, 거절된 tool call을 어떻게 보여줄지, transcript 검색용 텍스트를 어떻게 뽑을지까지 있다.  
실행 결과의 raw data와 사람이 화면에서 읽는 요약을 분리한 것이다.  
특히 transcript 검색은 화면에 실제로 그려진 텍스트와 index 대상 텍스트가 어긋나지 않는지 test로 검증한다.  
사소해 보이지만, 검색 결과 수와 highlight가 다르면 UI 신뢰도가 바로 무너지는 부분이다. ([Tool interface 분석](https://github.com/yzhang2016/claude-code/blob/main/Tool.ts))

## 병렬 tool 호출도 component 문제다

Claude가 파일 열 개를 동시에 읽으면 화면에 tool 카드 열 개를 한꺼번에 쌓는 것이 정답은 아니다. 실제 구현에는 같은 종류의 tool 호출을 묶어 한 덩어리로 보여주는 `renderGroupedToolUse` 계열 hook도 있다.

```text
나쁜 화면
  Read a.ts
  Read b.ts
  Read c.ts
  Read d.ts

더 나은 화면
  Read 4 files
  └ a.ts, b.ts, c.ts, d.ts
```

이건 단순한 예쁘기 문제가 아니다. agent가 병렬로 일할수록 UI가 해야 할 일은 더 많아진다. 실행 순서, 진행 상태, 접힘 여부를 각각 보존하면서도 사용자가 지금 무슨 일이 일어나는지 놓치지 않게 해야 한다. React tree가 있어서 가능한 정리다.

# 6. 터미널 resize도 렌더링 문제다

Claude Code를 쓰다 terminal 창 폭을 바꾸면 markdown table, 코드 블록, diff가 바로 다시 맞춰진다. 당연하게 봤는데, 이 동작도 꽤 많은 일이 필요하다.

terminal의 `resize` event가 오면 root node의 너비를 새 column 수로 바꾸고 Yoga layout을 다시 계산한다. 그 결과를 새 back buffer에 paint하고, 이전 front buffer와 diff를 내보낸다. 화면을 통째로 초기화하지 않으니 긴 대화 중간에서도 scroll 위치와 선택 상태를 최대한 유지할 수 있다.

```text
terminal resize
  ↓
root Yoga width 변경
  ↓
모든 flex layout 재계산
  ↓
새 frame paint
  ↓
이전 frame과 diff
  ↓
바뀐 cell만 stdout에 반영
```

웹에서 `window.resize`를 받고 responsive layout을 다시 그리는 것과 구조가 같다. 출력 매체가 terminal일 뿐이다.

# 7. React는 웹 전용 라이브러리가 아니다

React를 오래 쓰다 보면 무의식적으로 React = DOM 이라고 생각하게 된다.

하지만 **React는 UI를 선언하는 방식이고, DOM은 그 선언을 받아 실제 화면에 반영하는 renderer 중 하나일 뿐이다.** React Native가 휴대폰 화면에 그리는 것처럼, Ink는 터미널에 그리고 Claude Code는 거기에 자기 상황에 맞는 renderer를 더했다.

Claude Code가 React를 사용한다는 사실은 생각보다 당연한 선택처럼 느껴진다. 화면이 복잡해질수록 중요한 것은 화면에 무엇을 찍을지가 아니라, 지금 앱이 어떤 상태인가이기 때문이다.

까만 창에서 돌아가는 CLI도 결국은 상태가 있고, 컴포넌트가 있고, 렌더링이 있는 앱이었다. 다만 DOM이 없었을 뿐. 🤯
