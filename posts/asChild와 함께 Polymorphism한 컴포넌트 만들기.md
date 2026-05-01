---
date: 2024-11-06
published: false
slug:
thumbnail:
---

# **Polymorphism, **다형성
> [프로그램 언어](https://ko.wikipedia.org/wiki/%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%A8_%EC%96%B8%EC%96%B4)의 **다형성**(多形性, polymorphism; 폴리모피즘)은 그 프로그래밍 언어의 [자료형 체계](https://ko.wikipedia.org/wiki/%EC%9E%90%EB%A3%8C%ED%98%95_%EC%B2%B4%EA%B3%84)의 성질을 나타내는 것으로, 프로그램 언어의 각 요소들([상수](https://ko.wikipedia.org/wiki/%EC%83%81%EC%88%98), [변수](https://ko.wikipedia.org/wiki/%EB%B3%80%EC%88%98_(%EC%BB%B4%ED%93%A8%ED%84%B0_%EA%B3%BC%ED%95%99)), [식](https://ko.wikipedia.org/wiki/%EC%8B%9D), [오브젝트](https://ko.wikipedia.org/wiki/%EC%98%A4%EB%B8%8C%EC%A0%9D%ED%8A%B8), [함수](https://ko.wikipedia.org/wiki/%ED%95%A8%EC%88%98), [메소드](https://ko.wikipedia.org/wiki/%EB%A9%94%EC%86%8C%EB%93%9C) 등)이 다양한 자료형(type)에 속하는 것이 허가되는 성질을 가리킨다.
일반적으로 프로그래밍에서 다형성이란

# 컴포넌트의 다형성의 필요성

만약 버튼ㅇ
**HTML 명세**에 따르면 a element의 자식으로 [interactive content](https://html.spec.whatwg.org/multipage/dom.html#interactive-content-2)가 존재하면 안된다.

## as 의 한계
```yaml
<Text>Hello World</Text>

// Renders a <div>
<Text as="div">Hello World</Text>

// Renders the Paragraph component
<Text as={Paragraph}>Hello World</Text>
```

## asChild

