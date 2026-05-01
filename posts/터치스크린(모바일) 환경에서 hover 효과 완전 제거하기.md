---
date: 2024-08-11
published: true
slug:
thumbnail:
---

요소의 **특정 상태에 대한 액션**을 위해 [pseudo class (가상 클래스)](https://developer.mozilla.org/ko/docs/Web/CSS/Pseudo-classes)를 이용한다. 이 중 `:hover`를 통해서 커서가 요소에 올라가 있는 상태(호버링) 감지가 가능하다.
![MDN](8dc2d0f1-1.png)
하지만 `:hover`에는 **특이한 현상**들이 존재하는데, 이는 **터치스크린**을 사용하는 환경에서 발생한다.
## hover 유지 현상
```css
div:hover {
  color: skyblue;
}
```
![모바일(터치 스크린)](Aug-11-2024_16-46-47.gif)
**터치스크린은 사용자가 요소를 ****`터치`****할 경우 해당 요소의 커서의 위치가 고정된다.** 즉, 브라우저는 해당 요소에 커서가 유지된다고 판단하여 `:hover` 효과를 계속 유지시키고 사용자가 **다른 요소를 클릭해야 이전 요소의 **`:hover`** 가상 클래스를 해제**한다.
## active 무시 현상
```css
div:hover {
  color: skyblue;
}

div:active {
  color: red;
}
```
![active 상태 무시](Aug-11-2024_17-01-42.gif)
터치스크린 환경에서는 `:hover`가 유지되는 현상과 맞물려서 `:hover`는 CSS 위계에서 자신보다 뒤에 위치하고 [`:link`](https://developer.mozilla.org/en-US/docs/Web/CSS/:link), [`:visited`](https://developer.mozilla.org/en-US/docs/Web/CSS/:visited), [`:active`](https://developer.mozilla.org/en-US/docs/Web/CSS/:active) 같은 가상 클래스를 덮어쓴다. 따라서 `:active`와 `:hover` 구분이 사실상 **불가능**해지게 된다.
# 해결법
## 미디어쿼리 Level 4
[미디어쿼리 level 4](https://www.w3.org/TR/mediaqueries-4/)에서 위와 같은 현상들을 대응하기 위해 다양한 미디어 쿼리들이 추가되었다.
### hover

사용자의 입력 장치가 호버 기능을 할 수 있는지 여부를 확인한다. 
- **`none`**: 호버 기능을 지원하지 않음. → 터치스크린
- **`hover`**: 호버 기능을 지원. → 마우스나 트랙패드 같은 장치에서 커서를 요소 위에 올려놓을 때
> 💡 Android 특정 버전에서는 모바일 환경에서 **길게 누르는 액션**을 호버링으로 판단하는 경우도 존재한다.따라서 `(hover: hover)` 속성이 적용될 여지가 존재한다. 이를 아래 미디어 쿼리과 같이 사용해서 방지한다.
### pointer

사용자가 **마우스**같은 **정밀한 포인팅 장치**를 갖고 있는지 판단한다.
- **`none`**: 사용자의 장치가 포인터 입력 장치를 전혀 지원하지 않음. → TV 리모컨
- **`coarse`**: 사용자의 포인터 장치가 상대적으로 정밀도가 낮은 경우. → 터치스크린
- **`fine`**: 사용자의 포인터 장치가 작은 영역에 정밀한 조작이 가능한 경우 → 마우스
## 적용
```css
/* AOS 대응을 위해 (hover: hover)와 같이 사용 */
@media (hover: hover) and (pointer: fine) {
  span:hover {
    background-color: skyblue;
  }
}

span:active {
  background-color: red;
}
```
![데스크톱(마우스)](Aug-11-2024_18-42-44.gif)
	![모바일(터치 스크린)](Aug-11-2024_18-43-35.gif)
위 미디어 쿼리를 통해 데스크톱(마우스)과 모바일(터치 스크린) 환경에서 **스타일 분리**가 명확해진다. 터치스크린 환경에서는 **hover 상태** 동작을 아예 없애고 **active 상태** 스타일링 적용이 가능하다.
