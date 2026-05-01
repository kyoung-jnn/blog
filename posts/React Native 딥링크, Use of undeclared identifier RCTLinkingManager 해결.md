---
date: 2022-12-23
published: true
slug:
thumbnail:
---

```bash
Use of undeclared identifier 'RCTLinkingManager'
```
React Native 딥링크 설정을 하다가 위와 같은 오류가 발생했다. [React Native 공식문서](https://reactnative.dev/docs/0.69/linking)에 작성된 그대로 진행했는데?! 😧
# 해결
찾아보니 `Use of undeclared identifier` 관련 오류는 C, C++ 에서 함수, 변수 선언 관련 오류인 것 같아서, `#import <React/RCTLinkingManager.h>`를 `AppDelegate.h` 파일안으로 옮겨줬더니 잘 작동한다.
# Fabric을 사용한다면?
> 만약, `AppDelegate.mm` 파일 안 `#if RCT_NEW_ARCH_ENABLED` 구문이 있다면
> `#import <React/RCTLinkingManager.h>`를 `#if RCT_NEW_ARCH_ENABLED` 위로 선언해주자!

**React-Native 0.70**부터 [Fabric 렌더링 방식](https://reactnative.dev/architecture/fabric-renderer)이 부분적 업데이트가 되면서 해당 옵션(렌더링 방식)을 키고 끌수가 있는데, 본인은 아직 0.70 버전이 아니라서 위 옵션을 끄고 있었다.
따라서, **Fabric**을 사용하고 있지 않다면 `#if RCT_NEW_ARCH_ENABLED` 구문 아래 헤더 파일(`.h`) 호출을 위로 올려주자. 🥳
