---
date: 2022-09-18
published: true
slug:
thumbnail:
---

# map 안에서 쓰기
```javascript
const getUserData = (id) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(`${id} user data`), 2000);
  });
};
```
위와 같이 `id`를 받아서 사용자의 데이터를 가져오는 `비동기 함수`가 있습니다.
해당 함수를 이용하여 다수의 사용자 데이터를 받고 싶을 때, `map`을 이용하여 구현하면 될 것 같지만 결과 값을 확인해보면 `Promise 객체`들만 내부에 존재하게 됩니다.
```javascript
const userIdList = [1, 2, 3, 4, 5];

const response = await userIdList.map(async (id) => {
  return await getUser(id);
});
```
****
```plain text
(5) [Promise, Promise, Promise, Promise, Promise]
```
> 이는 await 키워드가 map이 반환한 Promise 객체 배열을 기다리고 실행하지는 않기 때문입니다. **Promise 객체**만을 기다리고 실행 할 뿐이죠. 즉, await를 쓰는 의미가 없어집니다.
# Promise.all
이를 해결하기 위해서는 주어진 Promise들을 병렬적으로 처리하는 `Promise.all`을 사용하면 됩니다.
`Promise.all`은 하나의 Promise가 실패하면 병렬적으로 수행하던 작업을 멈추고 오류를 반환합니다. (모든 Promise의 **Resolve**를 보장함)
따라서, 각각의 Promise들의 성공, 실패여부 없이 모든 데이터 (**Resolve, Reject**) 를 가져오고 싶다면 `Promise.allSettled`를 사용하면 됩니다.
```javascript
const response = await Promise.all(
  userIdList.map(async (id) => {
    return await getUser(id);
  }),
);
```
****
```plain text
(5) ['1 user data', '2 user data', '3 user data', '4 user data', '5 user data']
```
