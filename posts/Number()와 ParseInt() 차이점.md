---
date: 2022-03-15
published: true
slug:
thumbnail:
---

### ParseInt
```javascript
parseInt('10px'); // 10
parseInt('너비:10px'); // NaN
parseInt('10e2'); // 10
parseInt('10.123'); // 10
```
첫번째 만나는 숫자 문자열만을 숫자 인식하여 파싱합니다. 하지만 숫자가 첫번째로 인식이 안되면 `NaN`을 반환합니다.
### Number
```javascript
Number('10px'); // NaN
Number('10e2'); // 10 * 10^2 = 1000, exponential
Number('10.123'); // 10.123
```
문자열 전체를 인식하여 숫자가 아니라면 `NaN` 을 반환합니다.
# 2. 두번째 인자
### parseInt
```javascript
parseInt('0101'); // 101
parseInt('0101', 10); // 101, 10진수
parseInt('0101', 2); // 5, 2진수
```
2번째 인자를 사용하여 진법 계산을 할 수 있습니다.
# 3. undefined, null 변환
### ParseInt
```javascript
parseInt(); // NaN
parseInt(null); // NaN
parseInt(true); // NaN
parseInt(''); // NaN
Number(undefined); // NaN
```
항상 `NaN` 을 반환합니다.
### Number
```javascript
Number(); // 0
Number(null); // 0
Number(true); // 1
Number(''); // 0
Number(undefined); // NaN
```
`null`과 `boolean` 을 숫자로 변환해줍니다.
# '+' operator
```javascript
+'010'; // 10
+'10e2'; // 1000
```
여담으로 `'+' operator` 는 Number 와 동일하게 작동합니다!
# 결론
> 빠른고 간단한 변환을 위해서는 `Number` 구체적인 변환을 지정하기 위해서는 `parseInt`
알고리즘 문제에서 문자를 포함한 변환은 대부분 필요하지 않기 때문에 Number를 이용! 😁
