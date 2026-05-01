---
date: 2024-01-14
published: true
slug:
thumbnail:
---

`Next.js` 공식문서에서 자신들의 `Image 컴포넌트`가 자동으로 아래와 같은 `최적화`를 수행한다고 기술한다.
- **Size Optimization: **자동으로** WebP**와 **AVIF** 포맷을 이용하여 각 디바이스 별로 적절한 사이즈 이미지들을 제공해준다.
- **Visual Stability: **이미지가 로딩될때, 자동으로 [**CLS**](https://kyoung-jnn.com/posts/core-web-vitals#CLS-/-Cumulative-Layout-Shift)를 방지한다.
- **Faster Page Loads: **사용자의 viewport에 이미지가 감지되면 **로드(lazy loading)**한다. 이때 **blur placeholder**도 제공
- **Asset Flexibility:** 원격 서버에 저장된 이미지의 경우에도 **On-demand** 이미지 크기 조정
해당 포스팅에서는 `Size Optimization`에서 **WebP**와 **AVIF** 포맷으로 이미지 최적화를 하는 과정에 대해 알아본다.

# Image Loader

![HTML \<img/\> 태그](a7dbf408-1.png)

![Next.js \<Image/\> 컴포넌트](a7dbf408-2.png)

우리가 `Next.js Image 컴포넌트`를 사용할 때, `src props`를 통해 이미지의 **path string **혹은 [Static Image Import](https://nextjs.org/docs/app/building-your-application/optimizing/images#local-images)를 통해 전달하게 된다. 이때 HTML [\<img/\> 태그](https://developer.mozilla.org/ko/docs/Web/HTML/Element/img)와 다르게 내부적으로 `Image Loader`를 거치게 되고 자동으로 이미지를 최적화해주는 역할을 한다.

> 💡 만약 **Built-In Loader **대신 **Custom Loader**를 사용하고 싶다면 [`next.config.js`](https://nextjs.org/docs/app/api-reference/next-config-js/images#example-loader-configuration)에서 설정을 할 수 있다. 각각의 이미지마다 다른 로더를 사용하고 싶을 경우 [`loader prop`](https://nextjs.org/docs/app/api-reference/components/image#loader)를 이용하면 된다.

```typescript
// defaultLoader 함수 일부
function defaultLoader({
  config,
  src,
  width,
  quality,
}: ImageLoaderPropsWithConfig): string {

  (변환 코드)... 

  return `${config.path}?url=${encodeURIComponent(src)}&w=${width}&q=${
    quality || 75
  }${
    process.env.NEXT_DEPLOYMENT_ID
      ? `&dpl=${process.env.NEXT_DEPLOYMENT_ID}`
      : ''
  }`
}
```
`Image Loader`를 통과한 이미지는 `_next/image`로 시작하는 경로로 존재하게 되고 이는 컴포넌트 내부 함수가 자동으로 파싱하게 된다.

## Squoosh와 Sharp
**Next.js**에서는 설치가 쉽고 **개발 환경**에 적합한  [squoosh](https://github.com/GoogleChromeLabs/squoosh) 라는 로더를 기본으로 사용하게 된다. 하지만 **운영 환경**에 [sharp](https://sharp.pixelplumbing.com/) 라이브러리 사용을 경고문까지 띄우면서 강력하게 추천한다.

![PNG 이미지 - ARM64 아키텍쳐 벤치마크 표](a7dbf408-3.png)

`sharp`는 내부적으로 [libvips](https://github.com/libvips/libvips)를 이용하여 **적은 메모리 사용**과 **경량화**되어 **Node.js** 환경에서도 쉽게 설계되었다. 이는 **Next.js**와 같은 **서버 사이드 렌더링 환경**에서 이미지를 빠르고 효율적으로 처리할 수 있는 장점이 있기 때문에 채택하지 않았을까 싶다.
```typescript
// sharp 유무 판별
if (sharp) {
	// Sharp 로직
    if (contentType === AVIF) {
			...
    } else if (contentType === WEBP) {
      transformer.webp({ quality })
    } else if (contentType === PNG) {
      transformer.png({ quality })
    } else if (contentType === JPEG) {
      transformer.jpeg({ quality, progressive: true })
    }

    optimizedBuffer = await transformer.toBuffer()
} else {
	// ⛔️ 우리가 흔히 볼 수 있는 경고문 ⛔️
    if (showSharpMissingWarning && nextConfigOutput === 'standalone') {
      Log.error(
        `Error: 'sharp' is required to be installed in standalone mode for the image optimization to function correctly. Read more at: https://nextjs.org/docs/messages/sharp-missing-in-production`
      )
      throw new ImageError(500, 'Internal Server Error')
    }
    if (showSharpMissingWarning) {
      Log.warnOnce(
        `For production Image Optimization with Next.js, the optional 'sharp' package is strongly recommended. Run 'npm i sharp', and Next.js will use it automatically for Image Optimization.\n` +
          'Read more: https://nextjs.org/docs/messages/sharp-missing-in-production'
      )
    }

   // Squoosh 로직
    const { processBuffer } =
      require('./lib/squoosh/main') as typeof import('./lib/squoosh/main')

    if (contentType === AVIF) {
      optimizedBuffer = await processBuffer(buffer, operations, 'avif', quality)
    } else if (contentType === WEBP) {
      optimizedBuffer = await processBuffer(buffer, operations, 'webp', quality)
    } else if (contentType === PNG) {
      optimizedBuffer = await processBuffer(buffer, operations, 'png', quality)
    } else if (contentType === JPEG) {
      optimizedBuffer = await processBuffer(buffer, operations, 'jpeg', quality)
    }
  }
```

### 실제 환경 비교

![png with Squoosh](a7dbf408-4.png)

![webp with Sharp](a7dbf408-5.png)

브라우저 환경에서 비교해본 결과, `Squoosh, 523kb`에서  `Sharp, 50.8kb`로 상당한 압축 차이를 보여줬고, 속도 측면에서도 최소 `약 4~5배` 정도로 `Sharp`가 월등한 속도를 보여줬다.

> 💡 `AVIF 포맷`도 지원하기 때문에 해당 이미지 포맷을 제공할 수도 있다. 하지만 `AVIF`는 초기 최적화 속도가 느리다는 점을 기억하자.

![png with Squoosh](a7dbf408-6.png)

![webp with Sharp](a7dbf408-7.png)

이러한 속도 차이는 자연스럽게 `FCP`, `LCP` 등의 [Web Vitals](https://kyoung-jnn.com/posts/core-web-vitals) 지표를 향상시켜 **사용자 경험**에 큰 영향을 끼칠 것이다.

![avif with Sharp](a7dbf408-8.png)

![png with Squoosh](a7dbf408-6.png)

![webp with Sharp](a7dbf408-7.png)

# Cache

![](a7dbf408-9.png)

**Next.js 웹 서버(.next folder)**의 `<distDir>/cache/images` 폴더에 **이미지 최적화**되어 캐시된 사진을 갖고 있다. 클라이언트가 **특정 이미지**에 접근할 때, 이미지가 `<distDir>/cache/images` 폴더에 **캐시되어 있지 않다면** 최적화 과정을 거쳐 사용자에게 이미지를 보여준다.
이미지의 `response header` 중 `X-Nextjs-Cache`를 통해 웹 서버에 이미지의 캐시 여부를 판단할 수 있다. `X-Nextjs-Cache` 는 3가지로 상태가 나뉜다.
- `MISS` - 캐시되지 않았다. 첫번째 방문일 때, 적어도 한번은 발생
- `STALE` - 캐시되어 있지만 revalidate 시간을 지나 만료되었다. 업데이트 과정(다시 최적화)이 필요
- `HIT` - 캐시되어 있다.

![](a7dbf408-10.png)

![](a7dbf408-11.png)

`HIT` 된 이미지는** 최적화 과정을 거치지 않기 때문에 빠른 속도로 사용자에게 보여질 수 있다.**

## Cache-Control 유형
> 여기서 재밌는 점은 **이미지를 불러오는 방법**에 따라서 `Cache-Control`이 변한다는 점이다.
```typescript
import 이미지 from "/public/image/이미지.png"

<Image src={이미지} />
```
[Static Image Import](https://nextjs.org/docs/app/building-your-application/optimizing/images#local-images)의 경우 자동으로 `response header`에 `max-age=315360000, immutable`를 추가하여 영원히 웹 서버에 캐시한다. (그래도 빌드를 다시 하면 초기화된다. 😏)
```typescript
<Image src={"/public/image/이미지.png"} />
```
하지만, **인라인**으로 이미지를 불러올 경우 `max-age=60, must-revalidate` 같이 지정해주기 때문에, 이미지의 캐싱 동작이 다르게 동작할 수 있다.
```typescript
<Image src={"CDN 이미지 주소"} />
```
**CDN**을 통해 이미지를 사용한다면 `next.config.js`에 지정된 [`minimumCacheTTL`](https://nextjs.org/docs/app/api-reference/components/image#minimumcachettl) 과 `max-age (s-maxage)` 를 비교해서 큰 값을 이용한다.

> 💡 현재는 **캐시 무효화 방법**이 Next.js 자체적으로 없기 때문에 [`minimumCacheTTL`](https://nextjs.org/docs/app/api-reference/components/image#minimumcachettl)를 `max-age (s-maxage)`보다 낮게 설정하는 것을 추천한다.
