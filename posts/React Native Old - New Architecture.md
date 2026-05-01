---
date: 2025-01-14
published: true
slug:
thumbnail:
---

React Native의 `v0.68`에서 처음 도입된 **New Architecture**는 `v0.76`부터 안정화되면서 기본 설정으로 자리 잡았다. 이는 React Native 팀이 [Working Group](https://github.com/reactwg/react-native-new-architecture)을 만들고, 라이브러리 마이그레이션을 지원하기 위해 [가이드 문서](https://github.com/reactwg/react-native-new-architecture/blob/main/docs/enable-libraries.md)를 작성하는 등 꾸준히 노력한 결과(약 6년의 노력..!)라고 볼 수 있다.
이제 React Native 개발에서 New Architecture는 선택이 아니라 필수적인 요소가 되었기 때문에, 내부 구조와 작동 방식의 변화에 대해 잘 이해하는 것이 중요하다. 다음으로, New Architecture에서 달라진 핵심 구조와 주요 변경 사항을 살펴보자.
# Old Architecture
![React Native New Architecture - What changes it brings?](17cd55b8-1.webp)
## Bridge 한계
Old Architecture에서 **Bridge**가 반드시 필요했다. 이를 통해서 JavaScript와 Native 간의 통신을 JSON으로 주고 받을 수 있게 된다.
Bridge는 설계 당시에는 혁신적이었지만 점차 복잡한 애플리케이션 요구 사항을 처리하기에는 한계가 드러났다.
통신이 JSON 형식으로 직렬화되고 역직렬화되는 과정에서 **오버헤드**가 발생하며, 이는 통신 속도를 저하시킨다. 또한, 비동기 방식으로 이루어지는 통신의 특성상 실시간으로 반응해야 하는 작업(예: 애니메이션 처리, UI 업데이트 등)에서는 지연이 발생할 가능성이 높았다.
# New Architecture
![Flow of New Architecture](17cd55b8-2.png)
## Bridge 삭제, JSI 도입
![](17cd55b8-3.png)
New Architecture에서는 Old Architecture의 문제점으로 지적되었던 **Bridge**가 제거되었으며, 이를 대체하기 위해 `JavaScript Interface(JSI)`가 도입되었다. JSI의 구현 코드는 [여기](https://github.com/facebook/react-native/tree/v0.76.6/packages/react-native/ReactCommon/jsi/jsi)에서 확인할 수 있다.
**JSI**는 C++로 구현되어 있으며, JavaScript가 Native Module을 직접 호출할 수 있도록 JavaScript와  Android(Java/Kotlin), iOS(Objective-C/Swift) 코드의 `중간 계층` 역할을 한다.
이를 통해 Bridge 없이 JavaScript와 Native 간의 통신이 직접적으로 이루어질 수 있게 되었으며 기존 Bridge 구조의 오버헤드 및 성능 병목을 해결하고 효율적인 데이터 교환을 가능하게 한다.
> Bridge 자체가 없어지면서 JSI를 적용한 구조를 [Bridgeless](https://github.com/reactwg/react-native-new-architecture/discussions/154) 라고 부르는 것 같다.
## Codegen
JSI를 직접 구현할 필요는 없다. 🥹 React Native에서는 Codegen이라는 도구를 제공하며, 이를 통해 JSI와 Native 코드를 자동으로 생성하고 서로 연결해 준다. Codegen은 React Native 앱의 빌드 타임에 자동으로 실행되며, 수동으로도 실행할 수 있다.
개발자는 JavaScript로 Spec 파일을 작성하고, iOS나 Android의 Native Platform 코드(iOS: Obj-C/Swift, Android: Java/Kotlin)를 직접 수정하지 않아도 원하는 Native 동작을 구현할 수 있다. 단, 꼭 알아야 할 점은 **JavaScript에서는 Interface를 정의하고, 실제 구현은 C++로 해야 한다는 것이다. **([Native Platform code](https://reactnative.dev/docs/turbo-native-modules-introduction?platforms=android#3-write-application-code-using-the-turbo-native-module)을 통해서 각각의 Native Platform code로 구현할 수 도 있다.)
```typescript
import {TurboModule, TurboModuleRegistry} from 'react-native';

export interface Spec extends TurboModule {
  readonly reverseString: (input: string) => string;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'NativeSampleModule',
);
```
## Turbo Modules (Native Module 시스템)
위에서 언급한 Codegen과 JSI을 이용한 Native Module를 구현하는 새로운 **Native Module 시스템**을 Turbo Modules로 부른다.
기존 Native Module 시스템은 앱에서 사용하는 모든 Native 기능을 앱 시작 시 한꺼번에 불러오는 방식이었다. 이로 인해 앱의 시작 속도가 느려지는 문제가 있었다. Turbo Modules는 lazy loading 방식을 도입하여, 필요한 Native Module만 특정 시점에 로드되도록 개선했다. 이를 통해 앱 시작 속도가 크게 향상되었다.
## Fabric
Fabric은 React Native의 New Architecture에서 핵심 역할을 하는 새로운 렌더러로, **JSI**를 사용해 렌더링 로직을 C++로 통합하고, JavaScript와 Native 간의 상태를 항상 동기화된 상태로 유지한다. 이를 통해 더 빠르고 안정적인 UI 업데이트가 가능하다.
![new-architecture-in-depth](17cd55b8-4.webp)
Fabric의 또 다른 주요 특징은 JavaScript Thread와 Native UI Thread 간의 효율적인 통신이다. React Native에서 JavaScript Thread는 React의 [Render Tree](https://react.dev/learn/understanding-your-ui-as-a-tree#the-render-tree)를 생성한다. 이를 기반으로 동일한 Shadow Tree를 생성한다. 이 Shadow Tree는 [React Shadow Tree](https://reactnative.dev/architecture/glossary#react-shadow-tree-and-react-shadow-node)라고 불리며, UI의 가상 구조를 표현한다. 
Fabric은 Shadow Tree를 Native의 렌더링 엔진인 [Yoga](https://github.com/facebook/yoga)와 통합하여 각 UI 요소의 레이아웃(위치와 크기)을 계산한다. 이후 최종적으로 계산 결과를 바탕으로 Host View, 즉 실제 화면에 최종적으로 렌더링을 수행한다.
웹의 [DOM](https://developer.mozilla.org/ko/docs/Web/API/Document_Object_Model/Introduction)처럼 React Native에서도 다양한 플랫폼에 맞는 [Host View](https://reactnative.dev/architecture/glossary#host-view-tree-and-host-view)를 제공한다. Fabric이 생성한 Shadow Tree는 C++로 구현되어 있기 때문에 플랫폼 환경에 따라 서로 다른 Host View에 렌더링을 수행이 가능하다. 따라서 플랫폼별 Host View를 효과적으로 관리하고, 플랫폼 특화된 렌더링 기능을 최적화해 제공한다.
