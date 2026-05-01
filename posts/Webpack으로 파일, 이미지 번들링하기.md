---
date: 2021-09-24
published: true
slug:
thumbnail:
---

이전 포스팅까지 CSS, 스타일 파일까지 `Webpack`으로 번들링을 진행했습니다.
이번 포스팅에서는 파비콘, 이미지 등 `asset` 파일들을 번들링해보겠습니다. 🧐
# 1. 이미지 설정 / file-loader, url-loader
```plain text
npm i -D file-loader url-loader
```
우선 필요한 `loader` 들을 설치해줍니다.
# 1-1. file-loader
프로젝트에서 사용되는 파일(이미지등)을 빌드 결과물 폴더에 반영을 해주는 역할을 합니다.
# 1-2. url-loader
파일을 base64 URL로 변환합니다. 파일을 결과물 폴더로 옮기는 작업이 아니라, 변환해서 빌드 결과물에 직접 저장하는 역할 ❗️
> 모든 파일을 변환하는 것이 아니라, limit 보다 작은 파일만을 변환하고, 그 이상 큰 파일은 file-loader를 통해서 처리합니다.
```json
{
   test: /\.(png|jpg|jpeg|gif)$/,
   exclude: /node_module/,
   use: {
     loader: "url-loader",
     options: {
       name: "assets/[name].[hash].[ext]",
       fallback: "file-loader",
       limit: 5000, // 5kb 미만 파일만 data url로 처리
     },
   },
},
```
위와 같은 옵션을 `webpack.config.js` 에 추가해줍니다.
# 2. 파비콘, Favicon 설정
```javascript
new HtmlWebpackPlugin({
   ...,
   favicon: "./src/assets/logo.png",
}),
```
`webpack.config.js`의 플러그인에 위 설정을 추가합니다.
# 3. 프로젝트에 적용하기 👏
**빌드**시 **로고 이미지와 기타 이미지**가 번들링된 모습을 확인할 수 있습니다!
