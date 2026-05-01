---
date: 2024-03-08
published: true
slug:
thumbnail:
---

`Next.js 프로젝트`와 `React-Native 프로젝트(웹뷰 기반)`사이 **통신을 위한 브릿지 함수 및 타입**이 필요했다. 관련 코드를 필요한 저장소에서 각각 관리하게 되면, 코드 관리거  여러 곳에서 동시에 이루어져야 한다는 불편함이 생긴다.
```json
📌 web-project-repository
	- 🗂️ packages
		- 🎁 웹-웹뷰 공유 패키지
	- 🗂️ apps
		- 📝 Next.js 프로젝트 소스 코드 (여기서 패키지 사용)
		- 📝 기타 프로젝트 소스 코드
		- 📝 기타 프로젝트 소스 코드
```
```json
📌 webview(app)-project-repository
	- 📝 React-Native 프로젝트 소스 코드 (여기서 패키지 사용)
```
이를 해결하기 위해 브릿지 함수 및 타입을 🎁`패키지 형태` 로 구성하고, 이를 `'NPM 라이브러리'처럼 다운받아 사용하는 형태`로 고도화하기로 했다. 
> 고도화 과정은 아래과 같다. 포스팅에서는 `2번, 3번` 과정에 대해 기술한다.

1. 패키지 코드를 작성한다.
2. **번들러(Rollup.js)**를 이용하여 코드를 번들링한다.
3. **Github Packages**를 이용해 깃허브 저장소에서 패키지를 공유한다.
# 번들러, Bundler
패키지 코드를 작성하고 배포했다고 가정해보자. 
만약 **번들링**을 하지 않는다면 패키지를 사용하는 곳에서 필요한 모듈의 개수마다 네트워크 요청을 보내야 한다는 단점이 생긴다. 하지만 **코드의 자바스크립트 파일들이 하나로 묶여있다면**, 한 번에 요청으로 필요한 모든 모듈을 가져올 수 있다.
이렇듯 `번들러`는 **여러 의존성을 가진 파일들을 하나의 파일(번들)로 만들어주는 역할**을 한다. 
시간이 지남에 따라 [tree shaking](https://ui.toast.com/weekly-pick/ko_20180716), [code splitting](https://webpack.kr/guides/code-splitting/), [minification](https://developer.mozilla.org/en-US/docs/Glossary/Minification) 등의 부가적인 기능들 또한 번들러의 역할이 되었고, 결국 이름만 **번들러**지 웹 애플리케이션 빌드 및 최적화에 대해 다양한 역할을 수행하게 되었다.
초기 [Browserify](https://browserify.org/)를 비롯하여** **[Webpack](https://webpack.kr/)**, **[Parcel](https://ko.parceljs.org/)**, **[Rollup.js](https://rollupjs.org/)**, **[Esbuild](https://esbuild.github.io/)** **등 여러 번들러가 탄생했고 각각 번들러마다 특징이 존재하게 되었다.
## Rollup.js
현재 프로젝트에는 `Rollup.js`을 선택했다. 기본적으로 `ES6`를 지원하기 때문에 `ESM`으로 모듈을 생성하여 사용하는 곳에서 필요한 모듈만 사용하도록 **tree shaking**이 가능하다.
```javascript
// utils object 전체를 불러와야 한다.
const utils = require('./utils');
const query = 'Rollup';
// utils object에 접근하여 함수를 호출
utils.ajax(`https://api.example.com?search=${query}`).then(handleResponse);
```
```javascript
// 필요한 ajax 함수만 import
import { ajax } from './utils';
const query = 'Rollup';
// 불러온 함수만 호출
ajax(`https://api.example.com?search=${query}`).then(handleResponse);
```
또한** **2017년부터 개발되어 오면서 구성된 [다양한 플러그인 생태계](https://github.com/rollup/plugins?tab=readme-ov-file)가 추후 기능 확장성과 유지보수에 유리할 것 이라 판단했다. 
> `CommonJS` 로 작성된 모듈들을 `ES6` 바꾸는 [플러그인](https://github.com/rollup/plugins/tree/master/packages/commonjs)도 존재한다.

다양한 라이브러리들에서 `Rollup.js`을 사용하고 있기 때문에, 개발시 레퍼런스 참고가 편하다는 것도 무시 못 했다.
### 1. Rollup.js 설정 
```shell
yarn add -D rollup

yarn add -D @rollup/plugin-babel
yarn add -D @babel/core @babel/preset-env
```
```javascript
import babel from '@rollup/plugin-babel';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: './dist/index.cjs',
      format: 'cjs', // CommonJS
    },
    {
      file: './dist/index.mjs',
      format: 'es', // ESM
    },
  ],
  plugins: [
	 babel({
	  babelHelpers: 'bundled',
	  presets: ['@babel/preset-env'],
	 }),
  ],
};
```
`Rollup.js`를 설치하고 설정 파일을 프로젝트 루트에 생성한다. **CommonJS**와 **ESM**을 모두 지원하도록 하기위해서 [format ](https://rollupjs.org/configuration-options/#output-format)필드를 이용한다. 또한 **transplie**을 위한 `babel 플러그인`을 설치하고 [@babel/preset-env](https://babeljs.io/docs/babel-preset-env) 프리셋을 적용한다. 
[다양한 옵션](https://rollupjs.org/configuration-options/)과 [플러그인](https://github.com/rollup/plugins?tab=readme-ov-file) 설정은 프로젝트 성격에 맞게 설정하자.
```json
{
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "scripts": {
    "build": "rollup --config rollup.config.mjs"
  }
}
```
마지막으로 `package.json`를 수정한다. `main` 필드는 패키지 사용자가 진입하는 경로이다. 따라서 **index.cjs** 파일의 경로를 지정해주고 ESM 대응을 위한 **index.mjs** 경로는 `module` 필드에 지정한다.
빌드 실행을 위한 숏컷을 위해 `scripts` 필드도 추가한다.
### 2. Typescript 지원하기
Typescript를 지원한다는 것은 패키지 코드(라이브러리)를 사용하는 곳에서 패키지 코드들의 타입 추론이 가능하게 함을 의미한다. 이를 위해선 패키지 배포전 컴파일 과정을 통해 `*.d.ts` 를 생성하여 결과물에 포함시켜줘야 한다.
[tsc 명령어](https://www.typescriptlang.org/ko/docs/handbook/compiler-options.html)를 통해 직접 생성해줘도 되지만, 플러그인을 통해 `rollup.js`에게 그 역할을 맡길 수 있다
```shell
yarn add -D @rollup/plugin-typescript
yarn add -D typescript tslib
```
```javascript
import typescript from '@rollup/plugin-typescript';

export default {
  ...
  plugins: [
	 typescript(),
	 babel({
	  babelHelpers: 'bundled',
	  presets: ['@babel/preset-env'],
	 }),
  ],
};
```
`typescript 플러그인`를 설치하고 플러그인 필드에 추가한다.
```javascript
{
  "compilerOptions": {
		...
    "declaration": true /* .d.ts 파일 사용 */,
    "declarationDir": "./dist" /* .d.ts 파일 생성 위치 */
  }
}
```
`tsconfig.json`에 `declaration` 옵션을 추가한다. 
`declarationDir`는 `*.d.ts` 파일이 생성되는 위치를 지정하게 된다. 위치는 프로젝트마다 다르겠지만, **번들된 Javascript 파일(index.cjs, index.mjs)**과 같은 경로에 위치하는게 파악에 편한 것 같다.
# Github 패키지
현재 공유할 패키지는 조직 내부에서만 사용할 패키지이기 때문에, 굳이 [npm](https://www.npmjs.com/)에 **public**으로 배포할 이유가 없다. **코드가 외부로 노출되면 안되는 경우는 더더욱 필요가 없다.**
**npm**에서 [private packages](https://docs.npmjs.com/about-private-packages)을 제공하긴 하지만 `$7/user`의 요금을 받는다. 
따라서 무료로 제공되는 Github 패키지를 통해 조직의 **Organization 내부 저장소**에서만 패키지가 공유되게 배포가 가능하다.
## 1. Access Token 생성
![](yarn-rollup-1.png)
[링크](https://github.com/settings/tokens/new)에 들어가 `personal access token`을 생성해준다. **packages 쓰기 권한**을 반드시 허용해준다.
## 2.  Access Token 등록 및 Scope 설정
```yaml
npmScopes:
  Organization 이름:
    npmPublishRegistry: https://npm.pkg.github.com
    npmRegistryServer: https://npm.pkg.github.com
    npmAlwaysAuth: true
    # 발급 받은 토큰 등록
    npmAuthToken: personal-access-token
```
모노레포 최상위 `.yarnrc.yml` 파일의 [npmScopes](https://yarnpkg.com/configuration/yarnrc#npmScopes) 옵션을 추가한다. 
이는 **yarn 패키지 매니저**에게 `Organization 이름이 scope인 패키지`는 **github packages registry**를 사용하겠다고 명시적으로 알려준다.  
이제 `@organization-이름/`으로 시작하는 패키지는 github 패키지에서 다운받게 된다.  
## 3. 배포를 위한 package.json 수정
```json
{
  "name": "@organization-이름/패키지명",
  "version": "1.0.0",
  "repository": {
    "type": "git",
    "url": "패키지를 관리할 저장소 주소"
  },
  "publishConfig": {
    "registry": "https://npm.pkg.github.com" 
  },
}
```
`private` 필드가 있다면 제거해준다. 해당 옵션이 `true`면 배포가 안된다.
`name` 필드에 `@organization-이름/패키지-이름` 형식으로 패키지 이름을 명명한다. 해당 이름은 패키지 설치를 위한 **식별자**로서, 패키지 설치를 위해 `yarn add 패키지명` 명령어를 실행할 때 `패키지명` 역할을 맡는다.
> Github Packages를 이용하기 위해선, 반드시 `@organization-이름/패키지-이름` 형식이어야 한다!

`publishConfig` 필드에 [https://npm.pkg.github.com](https://npm.pkg.github.com)를 기입하여 패키지가 **github packages registry**를 이용한다고 알려준다. 
npm 공식 레지스트리를 사용하려면 [https://registry.npmjs.org/](https://registry.npmjs.org/)를 이용한다.
### Yarn Workspaces 참조 이슈
[Yarn Workspaces(모노레포)](https://yarnpkg.com/features/workspaces)에서 공유할 패키지 코드를 관리한다고 할 때, 한 가지 `대응`해야 할 부분이 발생한다. 
패키지 설치시 예상하는 우리가 동작은 github 패키지에 존재하는 공유된 패키지를 설치하는 것이다. 
```json
{
	"dependencies": { "@organization-이름/패키지명": "^1.0.0", ... }
}
```
```json
{
	"dependencies": { "@organization-이름/패키지명": "workspace:^", ... }
}
```
하지만, 예상과 달리 `remote 환경(github packages)`에 공유된 패키지를 설치하지 않고 `local 환경(workspaces)`에 있는 소스 코드를 그대로 참조하게 된다. 
```json
{
  "name": "@organization-이름/패키지명",
  ...
}
```
이는 패키지 매니저가 내부 workspaces을 순회하며 `@organization-이름/패키지` 이름으로 존재하는 workspace를 찾기 때문이다.
```json
"workspaces": [
	"packages/*",
	"!packages/패키지명",
],
```
따라서, 공유할 패키지는 workspaces의 `최상위 package.json`를 수정하여 **명시적**으로 workspaces에서 제거해야 한다.
## 4. Deploy
```shell
yarn build
yarn npm publish
```
패키지 배포 과정은 간단하다. 배포 전 프로젝트를 번들러를 통해 빌드한다. 그 후, [yarn 공식문서](https://yarnpkg.com/cli/npm/publish)에 따라서 명령어를 통해 배포가 가능하다.
### CI/CD
```yaml
- uses: actions/setup-node@v4
  with:
	  node-version: '18'
		registry-url: 'https://npm.pkg.github.com'
		scope: '@organization-이름'

- run: yarn npm publish
	env:
		NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
[github actions를 이용하여 CI/CD](https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages#publishing-packages-using-yarn)를 구성한다고 하면, 위와 같이 `registry-url` 에 **github packages registry**를 등록하고 `scope` 는 **organization 이름**을 등록해준다. 
![](yarn-rollup-2.png)
이제 [https://github.com/orgs/organization-이름/packages](https://github.com/orgs/organization-이름/packages) 에서 확인해보면 배포된 패키지를 볼 수 있다. scope 설정이 되어있는 내부 저장소들에서 npm 라이브러리를 사용하듯`yarn add @organization-이름/패키지명`으로 사용이 가능하다.
