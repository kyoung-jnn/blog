---
date: 2024-02-28
published: true
slug:
thumbnail:
---

`React Native`로 구현된 `Android` 앱이 특정 상황에서 **강제로 꺼진다는(Crash) 이슈**가 발견되었다. 
문제가 되는 상황은 **앱 푸시 알림**을 누를 경우** **푸시 알림이 갖고 있는 정보중 경로(URL)를 읽어서 해당 **경로(URL) WebView**로 **화면을 이동**시키는 `로직`이다. 
# 원인 파악
1. 경로(URL) **WebView** 렌더링 이슈
2. 화면을 이동(**Navigate**)시킬 때 이슈
`로직`으로 인해 원인이 `2가지` 로 좁혀지고 WebView 혹은 네비게이션(화면 이동) 관련 이슈들을 검색해봤다.

이미 몇 년전에 발견된 이슈 같은데, 결론적으로 [React Native Navigation](https://reactnavigation.org/)을 사용할 때. **WebView**가 존재하는 Stack Screen에서 [animation](https://reactnavigation.org/docs/stack-navigator/#animations)을 사용하게 되면, Android에서 비정상 메모리 이슈인 `fatal signal 11 (SIGSEGV)`가 발생한다는 것이다.
animation 설정을 끄면 해결되는 문제지만, `UX`를 위해서 animation을 끄는 방법 대신 다른 해결법을 찾았다.
## 하드웨어 가속
`react-native-webview` 라이브러리 옵션중 [androidLayerType](https://github.com/react-native-webview/react-native-webview/blob/master/docs/Reference.md#androidLayerType)이라는 옵션이 존재한다. WebView에 안드로이드 하드웨어 가속 사용 여부를 설정하는 옵션이다.
대부분의 사람들이 `<WebView androidLayerType="software" ... />`로 지정해서 이슈를 해결했다고 하는데, 테스트 해본 결과 이슈는 해결되지만 **웹뷰의 프레임이 너무 끊키는 현상**이 발생했다.
> 아무래도 **GPU **를 사용하지 않고 **CPU **만을 이용하여 렌더링하기 때문에 성능상에서 큰 단점을 갖게 되지 않을까 싶다.
따라서 `<WebView androidLayerType="hardware" ... />` 옵션을 지정해서 이슈를 해결했다. 하드웨어 가속을 `react-native-webview` 자체에 적용하기 위해서는 위와 같은 옵션을 따로 켜야하는 것 같다.
하드웨어 가속은 GPU를 이용하는 만큼 핸드폰의 사양 영향을 받고 배터리 소모 효과도 크다하니 선택을 잘 해야겠다. (요즘 핸드폰 사양이 상향 평준화되어서 크게 상관은 없겠지만)
**Android API 14**이상 부터는 하드웨어 가속이 앱의 **기본 설정**으로 켜져있다고 하는데, 
```typescript
<application android:hardwareAccelerated="true" ...>
```
만약 직접 지정하고 싶다면 **Android 매니페이트 파일**에 위 옵션을 지정해주자.
```typescript
<application android:hardwareAccelerated="true">
    <activity ... />
    <activity android:hardwareAccelerated="false" />
</application>
```
[Android 공식문서](https://developer.android.com/topic/performance/hardware-accel?hl=ko)에서 **특정 화면에 하드웨어 가속이 필요**하다면 위와 같은 문법을 사용하라고 알려주지만, React-Native 앱에서 해당 기능을 위해 계속 Android Native 코드를 건드리기는 효율적이지 않다. (업데이트를 하려면 바이너리 업데이트가 필요하기 때문에)

따라서 **React-Native 앱 전체적으로 하드웨어 가속을 설정하지 않고 특정 화면에서 하드웨어 가속을 켜고 싶다**면 위와 같은 라이브러리를 사용하자.

