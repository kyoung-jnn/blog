---
date: 2023-11-25
published: true
slug:
thumbnail:
---

현재 운영중인 프로덕트 게시글들의 `URL`을 **SEO 및 관리차원**에서 **서브 도메인**에서 **메인 도메인**으로 옮기는 작업을 진행했다.
하지만, 이렇게되면 기존에 검색엔진이 읽어간 URL들은 존재하지 않는 URL로 처리될 것이고 사용자는 해당 `URL`로 접근시 없는 사이트로 인식되는 문제가 존재할 것이다. 😟 
# 인프라 추상화 💭
> **AWS 사용 가정**

1. 사용자가 **이전 URL(서브 도메인)**로 접근
2. 사용자의 **이전 URL(서브 도메인)**에 따라서 원하는 URL 계산
3. 사용자는 **바뀐** **URL(메인 도메인)**로 `308 Permanent Redirect`

'위와 같은 로직을 인프라에서 어떻게 구현할까?' 고민을 하는 와중 `CloudFront` 와 `S3`를 이용하는 방법을 생각했다.
일반적으로 **CRA 프로젝트**를 배포할 때 **S3**의 정적 파일 호스팅을 이용한다. 이를 착안해서 **이전 URL**을 **S3** 호스팅에 연결하고, 앞단의 **CloudFront**으로 사용자의 접근을 원하는 곳으로 이동시키는 `Redirect 로직`를 두면 된다.
![](cloudfront-1.png)
`Redirect 로직`은 **AWS**의 [Lambda@Edge](https://us-east-1.console.aws.amazon.com/lambda/home?region=us-east-1#/begin) 혹은 [CloudFront Function](https://aws.amazon.com/ko/blogs/korea/introducing-cloudfront-functions-run-your-code-at-the-edge-with-low-latency-at-any-scale/)을 이용하면 되는데, 해당 로직은 매우 간단한 함수이므로 **CloudFront Function**을 이용할 예정이다. (**Lambda@Edge** 요금의 1/6이다..😳)
> 기존의 서브 도메인으로 연결된 **EC2 내부 코드(nginx 코드)**로 해당 Redirect 로직을 구현하는 방법도 생각했지만, 결국 실시간 요금 때문에 효과적인 방법은 아니라고 판단했다. 

# 인프라 구체화
> 💡 `legacy.naver.com` → `naver.com` 로 주소를 옮기는 예시

## S3
### 버킷 만들기

![](cloudfront-2.png)

![](cloudfront-3.png)

1. 버킷 이름은 `이전 URL의 Host Name`로 정해주고 생성한다.
2. 외부에서 접근을 위해 **퍼블릭 엑세스 차단**을 풀어준다.
### 버킷 속성 변경 (정적 웹 사이트 설정)
![](cloudfront-4.png)
![](cloudfront-5.png)
1. 생성된 버킷의 **속성(Property) 탭**에서 제일 하단에 존재하는 `정적 웹 사이트 호스팅` 편집에서 호스트 이름을 `현재 URL(Redirect URL)의 Host Name`으로 설정한다.
2. **CloudFront**와 **S3** 연결을 위해 `버킷 웹 사이트 Endpoint`를 복사한다.
## CloudFront 
![](cloudfront-6.png)
![](cloudfront-7.png)
![](cloudfront-8.png)

1. CloudFront 생성을 하는데, `S3`에서 만든 `버킷 웹 사이트 Endpoint` 를 원본 도메인에 넣어준다.
2. 프로토콜과 HTTP 방법은 자유!
3. 설정에서 도메인 `SSL` 인증서를 등록해준다. 
	1. 위 예시에서는 `*.naver.com`
### CloudFront Function
생성된 **CloudFront Domain Name(Distribution domain name)**으로 접속해보면 아직 **이전 URL**로 연결된다. 이제 Redirect 로직을 **CloudFront Function**으로 설정해줘야 한다.
1. Redirect 함수 생성
	![](cloudfront-9.png)
	```javascript
function handler(event) {
  const request = event.request;
  const path = request.uri;

  const redirectHandler = (path) => {
    let redirectURL = `https://naver.com`; // 새로운 URL
	  ...
	return redirectURL
  };

  const response = {
    statusCode: 308,
    statusDescription: 'Permanent Redirect',
    headers: { location: { value: redirectHandler(path) } },
  };

  return response;
}
	```
	**Redirect 로직**을 서비스의 방향성에 맞게 **JavaScript 함수**로 만든 후 `Publish`한다.
2. CloudFront에 연결하기
	![](cloudfront-10.png)
	`CloudFront > Behaviors` 설정에서 **Viewer request**에 만든 함수를 추가해준다. 이제 사용자(Viewer)가 해당 **CloudFront Domain Name**으로 접근하면 **CloudFront Function**이 실행될 것 이다. 
## Route 53
마지막으로 **CloudFront**에 도메인 이름을 연결해줘야 한다. 
1. `Create Record`를 실행한다.
	1. **naver SSL 인증서**는 실제로 갖고있지 않기 때문에, 예시는 `*.fapis.io`
2. `Record Name`를 이전 URL로 지정한다.
3. `Record Type`은 `A`, `Route traffic to` 는 위에서 지정한 **CloudFront Domain Name(Distribution domain name)**로 연결한다.
![](cloudfront-11.png)
# Redirect 확인
```javascript
curl -i 이전주소
```
![](cloudfront-12.png)
해당 명령어를 통해서 **Redirect**를 확인해보자. `Via 헤더`에 **CloudFront**를 통해 **301 Redirect** 된 모습이 확인된다면 성공이다. 🎉
