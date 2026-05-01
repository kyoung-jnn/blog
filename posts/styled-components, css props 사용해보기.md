---
date: 2023-02-19
published: true
slug:
thumbnail:
---

# CSS Props
**styled-components**를 이용할 때, [css props](https://styled-components.com/docs/api#css-prop)를 통해서 **인라인 스타일링**을 사용할 수 있다. 의외로 적절한 곳에 사용하면 굉장히 굉장히 유용하게 사용이 가능하다.
예를 들어 프로젝트 전역에서 사용이 가능하게 디자인된 버튼 컴포넌트가 있다고 가정해보자. 해당 컴포넌트를 사용하면서 위치를 수정하기 위해서는 일반적으로 [스타일 확장하기](https://styled-components.com/docs/basics#extending-styles) 기능을 통해서 기존 스타일링을 오버라이딩해서 위치 스타일링을 따로 작성한 새로운 컴포넌트를 구현한다.
> 이런 상황에서 css props를 사용하면 아주 편하다.
# 준비
```bash
import type {} from 'styled-components/cssprop';
import { CSSProp } from '.';

declare module 'react' {
    interface Attributes {
        css?: CSSProp | undefined;
    }
}
```
타입스크립트에서 사용하기 위해서는 타입지정을 먼저 해준다. 해당 설정을 하지 않을 경우 `Property 'css' does not exist on type..` 오류가 발생한다.
# 적용하기
## Before
```bash
import styled from '@emotion/styled';
import { css } from '@emotion/react';
import Button from './Button';

<StyledButton />;

const StyledButton = styled(Button)`
  margin-top: 10px;
`;
```
## After
```bash
import { css } from '@emotion/react';

<Button
  css={css`
    margin-top: 10px;
  `}
/>;
```
> 해당 옵션을 적절히 이용하면 styled 함수의 역할을 줄이면서, 직관적인 스타일링과 코드를 더 간결하게 유지할 수 있다.
> 하지만 사용하기 위해서는 css props를 받기 위한 공용 컴포넌트의 고도화는 필수인 것 같다.
>
> 여담이지만 [emotion에서도 css props 기능](https://emotion.sh/docs/css-prop)을 제공한다.
