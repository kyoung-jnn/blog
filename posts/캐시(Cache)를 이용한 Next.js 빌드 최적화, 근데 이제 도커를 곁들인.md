---
date: 2024-03-02
published: true
slug:
thumbnail:
---

현재 프로젝트들을 [Next.js](https://nextjs.org/)를 이용해 운용하고 있다. 프로젝트들의 `CI/CD` 를 더 빠르고, 더 효율적이게 최적화 할 수 있는 방법이 없을까 고민하던차에 `CI`의 첫 단계인 `Next.js 빌드` 쪽에서 개선점을 찾을 수 있었다.
> 💡 기술될 개선 방법은 **2가지 조건**을 전제로 한다.
> 1. Github Action 이용
> 2. Docker 이용
# '.next/cache' 폴더
![](749d11ec-1.png)
`Next.js`에서 `빌드(build)`를 한번 하게 되면, 그 후 부터는 빌드 시간이 줄게 된다. 이는 빌드시 생성되는 `.next/cache` 폴더에 이전 빌드 데이터를 **캐싱**하고 있기 때문이다

공식문서에서도 `.next/cache`를 캐싱하여 **CI 최적화 방법**을 알려주고 있다. 참고로 `.next/cache`는 애플리케이션 실행에는 지장을 주지 않기 때문에, 빌드 후 용량 최적화를 위해 없애도 된다.
# Github Actions 환경에서 캐싱
`local 환경`에서는 `cache 데이터(.next/cache)`는 삭제하지 않는 한 계속 갖고 있다. 그렇다면 **Github Actions**과 같은 `remote 환경`에서는 어떨까?
**Github Actions**에서** workflow**가 실행될 때, **가상 컴퓨터 환경(runner)**이 새롭게 생성되기 때문에, `cache 데이터`가 유지가 안된다.
따라서 우리는 **remote 환경**에서 `cache 데이터`를 따로 저장하고 캐시를 이용하고 싶을 때 불러와야 한다. 이러한 캐싱 기능은 깃허브에서 제작한 [actions/cache](https://github.com/actions/cache) 액션을 이용하면 된다.
```yaml
- name: Restore Cache
	uses: actions/cache@v3
  with:
    path: ${{ github.workspace }}/프로젝트-경로/.next/cache
    key: ${{ runner.os }}-nextjs-${{ hashFiles('**/yarn.lock') }}
    restore-keys: |
      ${{ runner.os }}-nextjs-
```
캐싱 대상을 `.next/cache` 폴더로 지정하고, `yarn.lock` 파일이 바뀔 때 다시 캐싱한다. 이렇게 되면 `key`가 변하지 않는 이상 CI 환경에서 해당 **cache 데이터**를 가져와 사용이 가능해진다.
![](actions-cache-delete.webp)
> 저장된 캐시들은 `Actions 탭 → Caches 메뉴` 에서 확인이 가능하다.
# 개선 하기
프로젝트 빌드에 `Docker`를 이용한다고 가정해보자. **CI**의 단계들을 간단히 추상화하면 아래와 같을 것이다.
1. [actions/cache](https://github.com/actions/cache) 액션으로 캐싱된 `.next/cache` 불러오기
2. **Docker 환경**안으로 `.next/cache` 를 가져오기
	```docker
# 'Github Actions Runner 환경'에서
# ".next/cache"를 'Docker 환경' 안으로 가져온다.
COPY ./.next/cache ./.next/cache 

...

# 빌드에 ".next/cache"를 이용한다.
FROM base AS builder
RUN yarn build

# 프로젝트 실행
CMD yarn start
	```
3. 가져온 `.next/cache`를 이용해 프로젝트 및 Docker 이미지를 빌드하기
4. 새로운 캐시 저장을 위해, **Docker 환경**안에서 `.next/cache` 를 가져오기
요약하자면 `github action runner 환경 → docker 환경`으로 캐시 데이터를 가져와 프로젝트를 빌드하고, 캐시 데이터를 다시 `docker 환경 → github action runner 환경`으로 전달하여 캐싱하는 전략이다.
> 문제는 "`docker 환경 → github action runner 환경` 으로 어떻게 데이터를 가져올 것 인가" 이다.
## docker/build-push-action 액션

이때 [docker](https://www.docker.com/)에서 제작한 액션을 이용하면 된다. 
해당 액션은 Docker 이미지를 빌드하고 레지스트리로 푸시하는 과정을 자동화해준다. [설정 옵션](https://github.com/docker/build-push-action?tab=readme-ov-file#customizing)들을 통해 Context, Tag 등을 커스터마이즈할 수 있으며, 멀티 플랫폼 이미지 빌드도 지원한다.
```yaml
- name: Export Next.js cache
	uses: docker/build-push-action@v5
	with:
		context: .
		file: ./도커-파일-경로/Dockerfile
		target: cache
		outputs: type=local,dest=.
```
`target 옵션`은 지정된 Docker 단계까지 빌드를 실행한다. 그리고 `outputs 옵션`을 통해 액션의 결과물이 현재  `github action runner 환경` 으로 가져올 수 있게한다.
요약하자면 `docker 환경`에서 **cache 단계 **파일들을 `github action runner 환경` 으로 가져온다. 이제 우리는 **cache 단계**에서 `.next/cache` 폴더가 존재하면 된다.
```docker
# Next.js build cache 저장
FROM scratch AS cache

COPY --from=builder ./.next/cache ./.next/cache 
```
해당 단계에서는 특별한 로직이 없기 때문에, 경량화 이미지인 [scratch](https://hub.docker.com/_/scratch)를 이용한다. `builder` 단계에서 Next.js를 빌드한 결과물 중 `.next/cache` 폴더를 가져온다.
# 개선된 Github Actions과 Dockerfile
```yaml
- name: Restore cache
	uses: actions/cache@v3
  with:
    path: ${{ github.workspace }}/프로젝트-경로/.next/cache
    key: ${{ runner.os }}-nextjs-${{ hashFiles('**/yarn.lock') }}
    restore-keys: |
      ${{ runner.os }}-nextjs-

- name: Build Docker Image
	run: |
		docker build .

- name: Export Next.js cache
	uses: docker/build-push-action@v5
	with:
		context: .
		file: ./도커-파일-경로/Dockerfile
		target: cache
		outputs: type=local,dest=.
```
```yaml
# 'Github Actions Runner 환경'에서
# ".next/cache"를 'Docker 환경' 안으로 가져온다.
COPY ./.next/cache ./.next/cache 

...

# 빌드에 ".next/cache"를 이용한다.
FROM base AS builder
RUN yarn build

# 캐싱을 위해 ".next/cache"를 가져온다.
FROM scratch AS cache
COPY --from=builder ./.next/cache ./.next/cache 

# 프로젝트 실행
CMD yarn start
```
`docker/build-push-action` 액션이 CI의 마지막 단계에 있으면 "`scratch` 단계 이전까지 이미지가 또 빌드되는 것 아닌가?" 라는 의문 생길 수 있다.
![](749d11ec-3.png)
하지만, Docker는 자동으로 레이어 캐싱을 하기 때문에, `scratch` 단계 이전까지 모두 캐싱된 결과를 이용하고 정확히 `scratch` 단계만 실행되기 때문에 괜찮다. 🤓
# 결과
<table header-row="true">
<colgroup>
<col width="290.0104064941406">
<col width="290.0104064941406">
</colgroup>
<tr>
<td>Next.js Cache Before</td>
<td>Next.js Cache After</td>
</tr>
<tr>
<td>**340s**</td>
<td>**257s**</td>
</tr>
</table>
프로젝트 크기에 따라서 빌드 시간이 다르겠지만, 현재 프로젝트에서는 표와 같은 결과가 나왔다. 5번 횟수, 중앙값 기준으로 `약 25%`정도 `빌드 시간 최적화`가 이루어졌다.
