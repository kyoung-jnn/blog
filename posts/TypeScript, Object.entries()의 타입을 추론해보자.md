---
date: 2024-04-01
published: true
slug:
thumbnail:
---

# Object.entries()
`Object.entries()`는 `enumerable` 속성이 있는 값을 가진 `[key, value]` 쌍 **배열**을 반환한다. 이를 통해 우리는 객체 내부를 반복문을 **순회 및 탐색**이 가능해진다.
```typescript {2,3}
const obj = {
  a: 10,
  b: 20,
  c: 30,
};

Object.entries(obj).map(([key, value]) => {
  console.log([key, value]);
});

// [LOG]: ["a", 10]
// [LOG]: ["b", 20]
// [LOG]: ["c", 30]
```
# TypeScript 한계
```typescript
entries<T>(o: { [s: string]: T } | ArrayLike<T>): [string, T][];
```
**TypeScript**에서 `Record`를 이용해 객체 타입을 지정할 때, `Object.entries()`를 통과한 `[key, value]` 쌍 배열의 `key 타입`이 정확히 추론되지 않는 **한계점**이 존재한다.
이는 `Object.entries()` 내부 타입 추론 방식이 `key 타입`을 단순히 **string**으로 지정하고 있기 때문이다.
```javascript
type AnimalKey = "dog" | "cat"
type Animal = {
  age: number;
  character: {
    cute: boolean
  }
}
 
// const AnimalMap: Record<AnimalKey, Animal>
const AnimalObj: Record<AnimalKey, Animal> = {
  dog: {
    age: 3,
    character: {
      cute: true,
    }
  },
  cat: {
    age: 4,
    character: {
      cute: true,
    }
  },
};

// const AnimalArr: [string, Animal][]
const AnimalArr = Object.entries(AnimalObj);
```
위와 같은 상황에서 AnimalArr 변수, `[key, value]` 쌍 배열의 `key의 타입`이 **string**으로 추론된다.
- ✅  `[AnimalKey, Animal][]`
- ❌  `[string, Animal][]`

 위와 같은 정확한 타입 추론을 얻기 위해선 유틸리티 타입을 직접 만들어야 한다. 
# ObjectEntries\<T\> 유틸리티 타입 만들기
`Object.entries()` 타입은 `[[key, value],[key, value],[key, value],…]` 형태를 갖고 있어야한다. 
이를 위해 튜플 형태를 **value**로 갖는 객체 타입으로 표현한 뒤, 튜플들을 배열 타입으로 뽑아야 한다.
## 1. 튜플 형식 객체 만들기 
```typescript
// { [K in keyof T]: [K, T[K]] }

{
	dog: ["dog", Animal];
	cat: ["cat", Animal];
}
```
`객체 T`의 **key, value**를 튜플 형태로 갖고 있는 새로운 객체를 만든다. 새로운 객체의 **key**는 `객체 T`의 key를 그대로 사용한다.
## 2. 튜플 형식 접근
```typescript
// { [K in keyof T]: [K, T[K]] }[keyof T]

["dog", Animal] | ["cat", Animal]
```
`Object.entries()`의 `[[key, value],[key, value],[key, value],…]` 형태를 표현하기 위해 `[keyof T]` 를 통해서 객체의 value(튜플)만 가져온다.
## 3. 배열화
```typescript
// { [K in keyof T]: [K, T[K]] }[keyof T][]

[["dog", Animal], ["cat", Animal]]
```
가져온 튜플들을 배열 형태로 만들어주기 위해 `[]`를 이용한다.
## 4. 완성
```typescript
type ObjectEntries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];
```
## 5. 사용하기
```typescript
const AnimalArr = Object.entries(AnimalObj) as ObjectEntries<Record<AnimalKey, Animal>>;
```
