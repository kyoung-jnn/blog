---
date: 2023-08-24
published: true
slug:
thumbnail:
---

```javascript
const sizes = ['small', 'medium', 'large'];
type T = typeof sizes; // type T = string[]
```
****
일반적으로 배열의 타입을 추론하기 위해서 `typeof` 키워드를 사용한다.
하지만, 이렇게 사용할 경우 [원시 타입(Primitive Type)](https://www.typescriptlang.org/ko/docs/handbook/2/everyday-types.html#%EC%9B%90%EC%8B%9C-%ED%83%80%EC%9E%85--string-number-%EA%B7%B8%EB%A6%AC%EA%B3%A0-boolean) 자체를 추론하기 때문에 우리가 원하는 동작인 배열 내부 값들로 이루어진 유니온 타입(Union Type) 을 추론하지 못한다.
# const assertion 이용하기
```javascript
const sizes = ['small', 'medium', 'large'] as const;

// type T = readonly ["small", "medium", "large"]
type T = typeof sizes;

// [["0", "small"], ["1", "medium"], ["2", "large"]]
console.log(Object.values(sizes));
```
****
[TypeScript 3.4](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions)에 추가된 `const assertion`을 이용해보자.
const assertion이 적용된 배열은 readonly로 수정이 불가하게 된다. 그리고 내부적으로 `numberic index signature`를 갖게 된다.

```typescript
// type SizeType = "small" | "medium" | "large"
type SizeType = (typeof sizes)[number];
```
****
`index signature의 타입`인 `number`를 이용해서 타입(typeof)의 value에 접근이 가능해진다.
그 결과, `"small" | "medium" | "large"` 과 같은 배열의 값으로 구성된 유니온 타입을 얻을 수 있다. 🥳
