---
date: 2025-07-15
published: true
slug:
thumbnail:
---

# Performant NPM
pnpm의 이름은 **Performant npm**의 줄임말로, 핵심 철학을 담고 있다. Node.js 공식 레지스트리를 그대로 이용하면서도 **Content-Addressable Store**와 **하드 링크/심볼릭 링크**를 결합해 기존 npm보다 더 빠르고 가벼운 설치 과정을 제공한다.
궁금해서 다른 패키지 매니저도 찾아봤는데 npm은 node package manager, yarn은 "실타래"를 의미하는 영단어에서 차용했다고 한다.
![원래는 yarn은 kpm이 될 뻔했다.. yarn maintainer 게시물|553](pnpm-yarn-kpm.png)
# Content-Addressable Storage
pnpm의 가장 큰 특징은 **Content-Addressable Store** 방식이다. 파일의 내용을 기반으로 해시값을 생성하고, 이 해시값을 주소로 사용해 파일을 저장한다. 말 그대로 Content를 통해 Address를 생성한다.
같은 내용의 파일은 같은 해시값을 가지므로, 여러 프로젝트에서 동일한 패키지 버전을 사용하더라도 실제 파일은 한 곳(글로벌 스토어)에만 저장된다.
```shell
# 같은 내용의 파일은 같은 해시값을 가진다
echo "console.log('hello world');" | sha256sum
# 출력: 59af696e17754a1baee33a017d1f398af042504daff4dca9c13a02963d96da55

# pnpm 스토어에서의 실제 구조 (macOS 기준)
~/Library/pnpm/store/v3/files
└── f1/
    └── 59af696e17754a1baee33a017d1f398af042504daff4dca9c13a02963d96da55
```
## 패키지는 어디에 보관될까?
pnpm은 **3단계 저장 구조**를 사용한다. 각 단계는 서로 다른 목적을 가지며, 링크 기술로 연결된다.
### **1. 글로벌 스토어 (Content-Addressable Storage)**
> 경로: 글로벌 스토어는 OS 마다 위치가 다르다.
> - macOS: `~/Library/pnpm/store`
> - Windows: `~/AppData/Local/pnpm/store`
> - Linux: `~/.local/share/pnpm/store`

위 에서 기술한 Content-Addressable Storage가 **글로벌 스토어**가 된다. 시스템 전체에서 단 하나만 존재하며, 모든 프로젝트가 이곳의 파일을 공유한다. **실제 파일 데이터가 저장되는 유일한 장소**다.
```shell
~/Library/pnpm/store/v3/files/
├── ab/
│   └── cd1234567890abcdef.../lodash-index.js
├── ef/
│   └── gh5678901234abcdef.../express-index.js
└── ij/
    └── kl9012345678abcdef.../body-parser-index.js
```
### **2. 프로젝트별 버추얼 스토어**
> 경로: `프로젝트 루트/node_modules/.pnpm`

프로젝트의 `node_modules/.pnpm` 폴더가 [버추얼(Virtual) 스토어](https://pnpm.io/ko/settings#virtualstoredir) 역할을 한다.
전역 스토어의 파일들을 **하드 링크**로 가져와, 각 패키지가 자신의 의존성을 격리된 공간에서 관리할 수 있게 한다. 
```shell
my-project/node_modules/.pnpm/
├── lodash@4.17.21/
│   └── node_modules/
│       └── lodash/
│           └── index.js       # 하드 링크 -> 글로벌 스토어 (Content-Addressable Store)
└── express@4.18.2/
    └── node_modules/
        ├── express/
        │   └── index.js       # 하드 링크 -> 글로벌 스토어 (Content-Addressable Store)
        └── body-parser/
            └── index.js       # 하드 링크 -> 글로벌 스토어 (Content-Addressable Store)
```
### **3. 프로젝트 루트의 node_modules**
> 경로: `프로젝트 루트/node_modules`

개발자가 직접 접근하는 **node_modules** 폴더다. 버추얼 스토어의 패키지들을 **심볼릭 링크**로 연결해, Node.js의 모듈 해석 규칙에 맞게 구성한다. 
`require('lodash')`나 `import express from 'express'`가 자연스럽게 작동하는 계층이다.
```shell
my-project/node_modules/
├── .pnpm/ # 버추얼 스토어
├── lodash -> .pnpm/lodash@4.17.21/node_modules/lodash # 심볼릭 링크 -> 버추얼 스토어
└── express -> .pnpm/express@4.18.2/node_modules/express # 심볼릭 링크 -> 버추얼 스토어
```
### 전체 구조
```shell
# 1. 글로벌 스토어 (실제 파일)
~/Library/pnpm/store/v3/files/
├── ab/cd1234.../lodash-index.js           # 10MB (실제 데이터)
├── ef/gh5678.../express-index.js          # 5MB (실제 데이터)
└── ij/kl9012.../body-parser-index.js      # 3MB (실제 데이터)

        ↓ 하드 링크

# 2. 버추얼 스토어 (격리된 복사본처럼 동작)
my-project/node_modules/.pnpm/
├── lodash@4.17.21/node_modules/lodash/
│   └── index.js                           # 같은 inode 공유
└── express@4.18.2/node_modules/
    ├── express/index.js                   # 같은 inode 공유
    └── body-parser/index.js               # 같은 inode 공유

        ↓ 심볼릭 링크

# 3. 프로젝트 루트 (개발자가 사용)
my-project/node_modules/
├── lodash -> .pnpm/lodash@4.17.21/node_modules/lodash
└── express -> .pnpm/express@4.18.2/node_modules/express
```
# 하드 링크와 심볼릭 링크: 두 가지 연결 방식
그렇다면 왜 pnpm은 하드 링크와 심볼릭 링크 방식을 조합해서 사용할까? 링크들의 특성과 역할을 이해하면 pnpm의 작동 방식이 명확해진다.
### 하드 링크 (Hard Link): 같은 파일, 다른 이름
하드 링크는 **같은 실제 데이터를 가리키는 여러 개의 파일명**이다. 모든 파일은 inode라는 고유 번호로 관리되는데, 하드 링크는 서로 다른 경로의 파일명들이 **같은 inode(같은 파일)**를 공유하는 방식이다.
- 실제 데이터는 디스크에 단 한 번만 저장된다
- 용량을 차지하지 않는다 (inode만 공유)
- 원본을 삭제해도 다른 하드 링크가 존재하면 데이터는 유지된다
```shell
# 하드 링크 예시
$ echo "hello" > original.txt
$ ln original.txt hardlink.txt

$ ls -li
# inode 번호가 같다! (예: 12345678)
12345678 .rw-r--r-- user 6 original.txt
12345678 .rw-r--r-- user 6 hardlink.txt

$ rm original.txt
$ cat hardlink.txt
hello  # 여전히 내용이 남아있다!
```
### pnpm에서 활용: 하드 링크
```shell
전역 스토어
~/Library/pnpm/store/v3/files/ab/cd1234.../lodash.js (실제 데이터)

                                    ↓ 하드 링크
                                    
버추얼 스토어
a-project/node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/lodash.js
b-project/node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/lodash.js
c-project/node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/lodash.js
```
**글로벌 스토어에서 버추얼 스토어로 연결**할 때 하드 링크를 사용한다. 
따라서 버추얼 스토어 파일들은 전역 스토어와 같은 inode를 공유하므로 추가 디스크 공간을 차지하지 않는다.
`lodash.js` 파일이 100개 프로젝트에서 사용되어도, 디스크에는 단 한 번만 저장되고 inode만 100번 참조되고 파일 복사가 일어나지 않으므로 설치가 빠르고, 디스크 용량도 절약된다.
### 심볼릭 링크 (Symbolic Link): 경로를 가리키는 포인터
심볼릭 링크는 **다른 파일의 경로를 담고 있는 특수한 파일**이다. Windows의 바로가기나 macOS의 별칭(alias)과 유사하다. 실제 데이터가 아닌 **"저기에 가면 원본이 있어요 👉" **라는 정보만 담고 있다.
- 경로 정보만 저장하는 작은 파일 (몇 바이트)
- 원본이 삭제되면 "깨진 링크(broken link)"가 된다
- 디렉토리에도 심볼릭 링크를 만들 수 있다!
```shell
# 심볼릭 링크 예시
$ echo "hello" > original.txt
$ ln -s original.txt symlink.txt

$ ls -li
# inode 번호가 다르다
12345678 -rw-r--r-- 1 user user  6 original.txt
87654321 lrwxrwxrwx 1 user user 12 symlink.txt -> original.txt

$ rm original.txt
$ cat symlink.txt
cat: symlink.txt: No such file or directory  # 원본이 사라지면 접근 불가!
```
### pnpm에서 활용: 심볼릭 링크
```shell
버추얼 스토어
my-project/node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/

                                    ↓ 심볼릭 링크
                                    
프로젝트 루트
my-project/node_modules/lodash
```
**버추얼 스토어에서 프로젝트 루트(node_moduels)로 연결**할 때 심볼릭 링크를 사용한다. 
코드에서 `import _ from 'lodash'`를 호출하면, Node.js는 `node_modules/lodash`를 찾고, 심볼릭 링크를 따라가 실제 파일이 있는 `.pnpm/lodash@4.17.21/`에 도달한다.
따라서 Node.js 모듈 해석(module resolution) 규칙과의 호환성을 지키고 패키지의 의존성을 격리된 공간에 배치할 수 있다.
# 평탄화되지 않는 node_mudules
> "평탄한 node_modules가 유일한 방법은 아닙니다" - [pnpm 블로그](https://pnpm.io/ko/blog/2020/05/27/flat-node-modules-is-not-the-only-way)

## npm v2: 중첩 구조
npm v2까지는 의존성을 중첩 구조로 관리했다. 각 패키지가 자신의 `node_modules` 안에 의존성을 가지는 방식이다.
```bash
node_modules/
└── express/
    ├── index.js
    └── node_modules/
        └── body-parser/
            ├── index.js
            └── node_modules/
                └── qs/
                    └── index.js
```
위 구조는 같은 패키지가 여러 곳에 중복 설치되고 의존성이 깊어질수록 경로가 기하급수적으로 길어진다. 이는 Windows OS의 [260자 경로 제한 문제](https://learn.microsoft.com/ko-kr/windows/win32/fileio/maximum-file-path-limitation?tabs=registry)도 유발한다.
## npm v3+: 평탄화 구조
이러한 문제를 해결하기 위해 npm v3부터는 가능한 한 모든 패키지를 루트로 끌어올리는 **호이스팅(hoisting)** 방식을 도입했다. 
```shell
node_modules/
├── express/          # 직접 설치한 패키지
├── body-parser/      # express의 의존성 → 루트로 호이스팅
├── qs/               # body-parser의 의존성 → 루트로 호이스팅
└── react/            # 직접 설치한 패키지
```
**하지만 평탄화는 새로운 문제를 만들었다.**
```bash
node_modules/
├── express         # package.json에 명시 ✅
├── react           # package.json에 명시 ✅
├── react-dom       # package.json에 명시 ✅
├── body-parser     # express가 의존 (루트로 호이스팅됨)
├── lodash          # react-dom이 의존 (루트로 호이스팅됨)
└── scheduler       # react가 의존 (루트로 호이스팅됨)
```
위 구조에서 개발자는 `package.json`에 선언하지 않은 `lodash`, `body-parser`, `scheduler`를 직접 `import`할 수 있다. Node.js의 모듈 해석 알고리즘은 `node_modules`에 있는 모든 패키지를 찾을 수 있기 때문이다. 
이를 **유령 의존성 (Phantom Dependency)**이라고 부른다.
## **pnpm: 중첩 구조 (링크)**
```shell
node_modules/
├── .pnpm/
│   ├── express@4.18.2/
│   │   └── node_modules/
│   │       ├── express/              # 글로벌 스토어 하드 링크
│   │       └── body-parser/          # express의 의존성
│   ├── react@18.2.0/
│   │   └── node_modules/
│   │       ├── react/                # 글로벌 스토어 하드 링크
│   │       └── scheduler/            # react의 의존성
│   └── react-dom@18.2.0/
│       └── node_modules/
│           ├── react-dom/            # 글로벌 스토어 하드 링크
│           ├── react -> ../../react@18.2.0/node_modules/react  # peer 연결
│           └── lodash/               # react-dom의 의존성
├── express -> .pnpm/express@4.18.2/node_modules/express
├── react -> .pnpm/react@18.2.0/node_modules/react
└── react-dom -> .pnpm/react-dom@18.2.0/node_modules/react-dom
```
pnpm은 평탄화를 하지 않고 **중첩 구조**를 유지한다. 단, 위에서 언급한 **링크** 기반으로 구현해 기존 중첩 구조의 단점(긴 경로, 중복 설치)을 제거했다.
# 마무리
npm과 다른 패키지 매니저들이 갖고 있던 문제들을 pnpm은 다른 접근을 택했다. 결과적으로 pnpm이 증명한 것은 간단하다. 평탄한 node_modules가 유일한 방법은 아니었다.
패키지 매니저의 역사는 하나의 문제를 해결하면 다른 문제가 생기는 과정의 반복이었다. 어떤 방법이 정답이라고 말할 수는 없겠지만, 더 나은 도구는 기존의 가정에 의문을 던지는 데서 시작하는 것 같다.
