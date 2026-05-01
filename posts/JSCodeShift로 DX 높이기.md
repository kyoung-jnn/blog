---
date: 2025-02-12
published: true
slug:
thumbnail:
---

코드를 작성하다 보면, 동일한 경로에서 import하는 구문이 중복되는 경우가 많다. 예를 들어
```typescript
import React from 'react';
import { useEffect } from 'react';
```
이렇게 같은 패키지(예: react)에서 여러 줄에 걸쳐 import를 하는 식이다. 프로젝트 규모가 커질수록 이러한 중복 import는 점점 늘어나고, 유지보수 시에도 여러 파일을 일일이 찾아 수정해야 하는 번거로움이 커진다.
![VSCode Search 기능](dashboard-45.png)
물론 VSCode의 Search 기능 등을 이용해 어느 정도 자동 치환을 할 수 있지만, 복잡한 조건이 얽힌 리팩토링에는 한계가 있다.
이럴 때 AST(Abstract Syntax Tree) 기반 도구인 `jscodeshift`를 사용하면, 프로젝트 전반에 걸쳐 중복 import 구문 등 수정되야 하는 구문 및 로직을 한 번에 정리하여 코드 품질과 생산성을 크게 높일 수 있다.
이런 자동 리팩토링은 단순 반복 작업 시간을 줄여주고, 일관성을 유지해준다. 곧 **DX(Developer Experience)** 개선으로 이어진다.
# JSCodeShift와 AST

[jscodeshift](https://github.com/facebook/jscodeshift)는 Meta(구 Facebook)에서 만든 **JavaScript/TypeScript 코드 변환 도구**다. 소스 코드를 AST 형태로 파싱하여, 원하는 구조나 패턴을 찾아내 손쉽게 수정할 수 있게 도와준다.
특히 프로젝트 전체에서 특정 함수나 변수명을 일괄 변경해야 할 때, 혹은 import 경로 같은 공통된 패턴을 수정해야 할 때 매우 유용하다.
![](dashboard-46.png)
실제로 Next.js 같은 프레임워크도 주요 업데이트를 쉽게 적용하기 위해 **codemod**(code modification) 기능을 제공하는데, 내부적으로 jscodeshift를 활용한다.
## AST
> 컴퓨터 과학에서 추상 구문 트리(Abstract Syntax Tree, AST), 또는 간단히 구문 트리(syntax tree)는 프로그래밍 언어로 작성된 소스 코드의 추상 구문 구조의 트리이다. 이 트리의 각 노드는 소스 코드에서 발생되는 구조를 나타낸다. - [wikipedia](https://ko.wikipedia.org/wiki/%EC%B6%94%EC%83%81_%EA%B5%AC%EB%AC%B8_%ED%8A%B8%EB%A6%AC)
jscodeshift는 **AST**를 이용하여 코드 맥락을 인식하기 때문에, 특정 함수 호출만 찾아서 수정하거나, if문 안에 있는 로직만 건드리는 등 정교한 작업이 가능하다.
### AST Explorer
jscodeshift를 사용하기 전에, [AST Explorer](https://astexplorer.net/) 같은 도구를 활용하면 매우 편리합니다. AST Explorer에 코드를 붙여넣으면, 코드 구조가 어떻게 트리 형태로 변환되는지 시각화해서 보여주므로, "어떤 노드가 어떤 역할을 하는지"를 한눈에 파악할 수 있다.
예를 들어 다음 코드가 존재할 때, 
```typescript
import React from 'react';
const foo = 'FOO';
```
![AST Explorer 결과](dashboard-47.png)
- `import React from 'react'`는 **ImportDeclaration**으로 표현되며, React는 **ImportDefaultSpecifier**로 처리된다.
- `const foo = 'FOO'`는 **VariableDeclaration**에 해당하며, 그 안에 foo라는 **Identifier**가 있고, 값으로 'FOO'라는 **StringLiteral**이 할당된다.
이처럼 AST Explorer를 통해 미리 각 노드 타입과 구조를 확인해두면, jscodeshift 스크립트를 작성할 때 어떤 노드를 찾아서 어떻게 수정해야 할지 쉽게 구상할 수 있다.
# 적용: 중복 import 구문 병합
이제 문제가 되었던 **중복 import**를 자동으로 병합해주는 스크립트를 만들어보자.
```typescript
const transform = (fileInfo, api) => {
  const jscodeshift = api.jscodeshift;
  const root = jscodeshift(fileInfo.source);

  const importMap = createImportNodeMap(jscodeshift, root);
  processDuplicateImport(jscodeshift, importMap);

  return root.toSource();
};
```
### 1. jscodeshift API 설정 및 AST 파싱
```typescript
 // jscodeshift API 객체
 const jscodeshift = api.jscodeshift;

 // fileInfo.source: 현재 파일의 소스 코드
 // jscodeshift(fileInfo.source)를 통해 AST로 변환 후, 조작할 수 있는 root 객체 생성
 const root = jscodeshift(fileInfo.source);
```
### 2. 동일한 import 경로를 저장하는 Map
```typescript
/**
 * 동일한 import 경로의 노드 정보를 저장할 Map
 *
 * key: import 경로(예: "react")
 * value: 해당 경로를 import하는 ImportDeclaration 노드들의 배열
 */
const createImportNodeMap = (jscodeshift, root) => {
  const importMap = new Map();
  root.find(jscodeshift.ImportDeclaration).forEach((nodePath) => {
    const source = nodePath.value.source.value; // 예: 'react'
    importMap.set(source, [...(importMap.get(source) || []), nodePath]);
  });
  return importMap;
};
```
[**find()**](https://jscodeshift.com/build/api-reference/#find)** **메서드를 통해 AST 내에서 특정 노드 타입을 찾는다. **find(jscodeshift.ImportDeclaration)**는 AST에서 모든 ImportDeclaration 노드를 추출한다.
### 3. Map을 바탕으로 새로운 Import 문 생성
```typescript
const processDuplicateImport = (jscodeshift, importMap) => {
  importMap.forEach((nodePathList, importPath) => {
    if (nodePathList.length < 2) return;

    const specifiers = extractSpecifier(jscodeshift, nodePathList);
    const remainingNodeList = createNewImport(jscodeshift, nodePathList, importPath, specifiers);

    remainingNodeList.forEach((node) => jscodeshift(node).remove());
  });
};
```
```typescript
/**
 * 각각의 ImportDeclaration에서 specifier만 추출하여 하나로 합침
 * import React from 'react';         -> default import
 * import { useEffect } from 'react'; -> named import
 */
const extractSpecifier = (jscodeshift, nodePathList) =>
  nodePathList.flatMap(({ value }) =>
    value.specifiers.map((specifier) =>
      specifier.type === 'ImportDefaultSpecifier'
        ? jscodeshift.importDefaultSpecifier(jscodeshift.identifier(specifier.local.name))
        : jscodeshift.importSpecifier(jscodeshift.identifier(specifier.local.name)),
    ),
  );
```
![나워져 있는, ImportDelaration](dashboard-48.png)
![하나로 통일되어 있는 ImportDelaration](dashboard-49.png)
**병합된 import**을 생성하기 위해서는 나눠여 있는데 **ImportDeclaration**의 specifier들을 하나의 ImportDeclaration으로 통합하는 과정이 필요하다.
이를 위해 sepcifier 집합(배열)을 하나의 ImportDeclaration로 통합해야한다.
주의할 점은 [default export](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export#using_the_default_export)와 [named export](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export#using_named_exports)를 AST에서 지칭하는 type이 다르다는 점이다. 따라서 분기처리가 꼭 필요하다.
- default export: importDefaultSpecifier
- named export: ImportSpecifier
```typescript
const createNewImport = (jscodeshift, nodePathList, importPath, specifiers) => {
  const newImport = jscodeshift.importDeclaration(specifiers, jscodeshift.literal(importPath));
  jscodeshift(nodePathList[0]).replaceWith(newImport);
  
  return nodePathList.slice(1); // 교체된 노드를 제외한 노드는 제거한다.
};
```
[**importDeclaration()**](https://jscodeshift.com/build/ast-grammar/#importdeclaration) 메서드를 통해 하나로 병합된 specifier를 합쳐서 새로운 import문(노드)로 만든 **ImportDeclaration**를 생성한다**.**
ImportDeclaration를 이용해 만든 새로운 import node는** **[**replaceWith()**](https://jscodeshift.com/build/api-reference/#replacewith) 메서드를 이용하여 원하는 노드와 교체해준다.
### 4. 수정된 Node가 반영된 AST 반환
```typescript
return root.toSource();
```
[**toSource()**](https://jscodeshift.com/build/api-reference/#tosource) 메서드를 통해 수정된 AST를 다시 소스코드로 변환하여 반환한다.
# 최종 코드 및 결과
```typescript
/**
 * 동일한 import 경로의 노드 정보를 저장할 Map
 *
 * key: import 경로(예: "react")
 * value: 해당 경로를 import하는 ImportDeclaration 노드들의 배열
 */
const createImportNodeMap = (jscodeshift, root) => {
  const importMap = new Map();
  root.find(jscodeshift.ImportDeclaration).forEach((nodePath) => {
    const source = nodePath.value.source.value;
    importMap.set(source, [...(importMap.get(source) || []), nodePath]);
  });
  return importMap;
};

/**
 * 각각의 ImportDeclaration에서 specifier만 추출하여 하나로 합침
 * import React from 'react';         -> default import
 * import { useEffect } from 'react'; -> named import
 */
const extractSpecifier = (jscodeshift, nodePathList) =>
  nodePathList.flatMap(({ value }) =>
    value.specifiers.map((specifier) =>
      specifier.type === 'ImportDefaultSpecifier'
        ? jscodeshift.importDefaultSpecifier(jscodeshift.identifier(specifier.local.name))
        : jscodeshift.importSpecifier(jscodeshift.identifier(specifier.local.name)),
    ),
  );

const createNewImport = (jscodeshift, nodePathList, importPath, specifiers) => {
  const newImport = jscodeshift.importDeclaration(specifiers, jscodeshift.literal(importPath));
  jscodeshift(nodePathList[0]).replaceWith(newImport);
  return nodePathList.slice(1);
};

const processDuplicateImport = (jscodeshift, importMap) => {
  importMap.forEach((nodePathList, importPath) => {
    if (nodePathList.length < 2) return;

    const specifiers = extractSpecifier(jscodeshift, nodePathList);
    const remainingNodeList = createNewImport(jscodeshift, nodePathList, importPath, specifiers);

    remainingNodeList.forEach((node) => jscodeshift(node).remove());
  });
};

const transform = (fileInfo, api) => {
  const jscodeshift = api.jscodeshift;
  const root = jscodeshift(fileInfo.source);

  const importMap = createImportNodeMap(jscodeshift, root);
  processDuplicateImport(jscodeshift, importMap);

  return root.toSource();
};

export default transform;

```
## as-is
```typescript
import React from 'react';
import { useEffect } from 'react';

import Button from '@ui/components';
import Dialog from '@ui/components';
```
## to-be
```typescript
import React, { useEffect } from 'react';

import Button, Dialog from '@ui/components';
```
위와 같이 **중복 import를 하나로 병합**해주면 유지보수가 훨씬 용이해지며, 코드 일관성도 높아진다. 이처럼 `jscodeshift`를 사용하면 코드베이스 전체as에 걸친 반복 작업을 안전하고 효율적으로 진행할 수 있어, 궁극적으로 **DX** 향상에 크게 기여할 수 있다.
위 예시에서는 단순 import 관련 구문을 수정하였지만, Class Component → Function Component, 로깅 기능등 코어 로직에 대한 전체적인 수정이 필요할 때, 큰 역할을 할 수 있다고 생각이 든다.
