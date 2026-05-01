---
date: 2021-09-23
published: true
slug:
thumbnail:
---

이전 포스팅 Webpack 설정에서는 단순히 코드만 Webpack으로 번들링하는 과정에서 그쳤습니다. 하지만 웹 애플리케이션에서 스타일이 없을 수가 없습니다!
이번에는 CSS(SCSS) 또한 번들링을 해보겠습니다. 😎
# 1. CSS(SCSS)
```plain text
npm i -D sass style-loader css-loader sass-loader
npm i -D mini-css-extract-plugin
```
- sass: `node-sass`는 deprecated되므로 `dart-sass` 설치
- styled-loader: `<script>` 태그에 스타일을 추가함으로 DOM에 접근
- css-loader: CSS -\> JS
- sass-loader: SASS -\> CSS
- mini-css-extract-plugin: 빌드시 `css`를 별도의 파일로 묶기, 사용안할시 인라인으로 `html`에 들어감
# 1-1. webpack.config.js
```javascript
const sass = require("sass");
const fibers = require("fibers");
module: {
    rules: [
      ...,
      // 규칙 추가!
      {
        test: /\.scss?$/,
        exclude: /node_module/,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          {
            loader: "sass-loader",
            options: {
              implementation: sass, //dart-sass 적용
              sassOptions: {
                fiber: fibers, // fibers 적용, sass 컴파일 속도 향상
              },
            },
          },
        ],
      },
    ],
},
plugins: [
  ...,
  new MiniCssExtractPlugin({ filename: `[name].css` })
],
```
기존 **typescript** 규칙만 있었던** 웹팩 설정파일에 규칙**을 추가해줍니다. dart-sass 적용을 위해 공식 문서에서 위와 같은 구조로 적용할 것을 알려주고 있습니다.
> 그리고 `fibers` 를 통해 SASS의 컴파일 속도를 향상 시켜줍니다. https://sass-lang.com/blog/node-fibers-discontinued
또한 설치한 CSS 분리 플러그인을 설정합니다✨.
# 2. 프로젝트에 적용하기 👏
모든 설정이 끝났습니다!! 이제 CSS, SCSS 등 스타일 코드를 작성한 뒤 **빌드**를 시작합니다.
`dist` 폴더를 확인하면 스타일 파일이 정상적으로 빌드된 것을 확인할 수 있습니다. ✨
