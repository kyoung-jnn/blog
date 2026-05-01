---
date: 2024-07-06
published: true
slug:
thumbnail:
---

최근 `HTTP 완벽 가이드 서적`으로 스터디를 진행중에 있다. 오랜만에 **HTTP 관련 이론적인 지식**을 다룰수 있는 기회가 된 것 같아서 **버전별 특징**을 정리해본다. 🤓

# HTTP

> **Hypertext Transfer Protocol**

호스트간 통신하는데, 몇가지 규칙을 특징으로 갖고있는 `기초적인 통신 프로토콜
`웹 브라우저, 서버, 웹 애플리케이션 모두 HTTP를 통해서 서로 대화한다. HTTP는 현대 인터넷의 **공용어**이다.

- **클라이언트-서버 구조
**클라이언트가 요청을 보내고 서버가 응답하는 `클라이언트-서버 구조`
- **무상태성 (Stateless)
**서버나 클라이언트의 상태를 기억하고 있지 않기 때문에 **각각의 요청을 독립적**으로 여기고 특정 클라이언트의 요청을 알아채지 못한다. 따라서** 쿠키**나 **세션**를 이용하여 추가적인 정보를 교환하며 클라이언트를 판단한다.
- **비연결성 (Connectionless)**
리소스를 공유하고 연결을 바로 끊어 **서버 부하**를 줄인다. 하지만, 매 통신마다 연결을 다시 하면 TCP 특성상 **TCP 연결(3-way handshake)** 비용이 지속적으로 발생할 수  있다.
	> 💡 **3-way handshake**
	> ![](3way-handshake.png)
	> **TCP**가 호스트 간에 연결을 설정하는 방법으로 `SYN/ACK 패킷`을 통해 이루어진다.
	> `SYN 패킷`은 동기화(**SYN**chronize)를 의미하는 패킷이며 `ACK 패킷`은 확인(**ACK**nowledgement)을 의미하는 패킷이다. 클라이언트-서버간 **3번의 통신**으로 연결을 확정짓는다.

# HTTP/0.9

> 원래 HTTP 초기 버전에는 버전 번호가 없었다! 이후 버전들이 나오면서 `0.9` 라고 지칭되었다.

**단일 라인 요청**으로 리소스에 대한 메소드는 `Get`만 존재했다. **헤더**조차 존재하지 않았기 때문에 **HTML 문서**만 전송이 가능했다. **상태 코드 및 오류 코드**도 존재하지 않았다.

# HTTP/1.0

**헤더**가 요청과 응답 둘 다 도입되어, 메타데이터 전송이 가능해졌다. [Content-Type](https://developer.mozilla.org/ko/docs/Web/HTTP/Headers/Content-Type) 헤더로 인해서 HTML 문서외 다른 리소스들의 통신이 가능해졌다.
**상태 코드**가 응답의 시작에 붙어 클라이언트가 요청에 대한 성공과 실패 여부를 알 수 있게 되었다.

## 단기 커넥션 (Short lived Connections)

새로운 커넥션 마다 `TCP 연결(3-Way Handshaking)`이 필요하기 때문에 성능이 저하된다. 이는 `HTTP/1.1 - 지속 커넥션 (Persistent Connection)`에서 개선된다.

# HTTP/1.1

![](http1_x_connections.png)

## 병렬 커넥션 (Parallel Connection)

**대역폭**을 쪼개서 **여러 개 커넥션**을 연결한다. 이를 이용해 다수의 요청을 병렬로 처리할 수 있게된다.
일반적으로 **병렬 커넥션**은 빠르지만 클라이언트의 **대역폭**이 좁거나 다수의 커넥션 처리를 위해 서버에 **부하**가 생겨 느려질 수도 있다.

> 여러 개의 커넥션을 위해 **TCP 연결(3-Way Handshaking)**을 여러번 해야하는 입장인 것이다.

## 지속 커넥션 (Persistent Connection)

`HTTP/1.1` 부터는 기본적으로 지속 커넥션이 작동한다.
한번에 커넥션으로 여러 개의 트랜잭션을 가능하게 한다. 새로운 **TCP 연결(3-Way Handshaking)**를 하는 비용을 아끼고, **TCP의 혼잡 제어**를 활용할 수 있다.

> 💡 **TCP의 혼잡 제어** 방식에서 [Slow Start](https://developer.mozilla.org/en-US/docs/Glossary/TCP_slow_start)는 커넥션을 열어둘수록 전송가능한 패킷이 2배씩 들어나므로, 커넥션 연결이 지속될수록 효과적이다.

> 💡 `HTTP/1.0+`에서는 [Keep-Alive 헤더](https://developer.mozilla.org/ko/docs/Web/HTTP/Headers/Keep-Alive)를 통해 지속 커넥션을 조절한다. 하위 프로토콜에 대한 호환을 위해 적기도 한다.

## 파이프라이닝 (Pipelining) 

`지속 커넥션`을 이용해서 응답을 기다리지 않고 곧바로 다른 트랜잭션들을 요청해 여러개의 요청을 병렬로 처리가능하게 한다. [GET](https://developer.mozilla.org/ko/docs/Web/HTTP/Methods/GET), [HEAD](https://developer.mozilla.org/ko/docs/Web/HTTP/Methods/HEAD), [PUT](https://developer.mozilla.org/ko/docs/Web/HTTP/Methods/PUT) 그리고 [DELETE](https://developer.mozilla.org/ko/docs/Web/HTTP/Methods/DELETE) 메서드같이 **멱등한(idempotent)** 메서드만 가능하다.

## 한계

- **HOL(Head Of Line) Blocking **
**파이프라이닝(Pipelining)**은 우선순위가 없어서 요청들을 **순서(FIFO, 선입 선출)**에 맞춰서 응답을 해야한다. 만약 첫번째 요청의 처리속도가 늦어지면 후속 요청들은 처리가 빨리 끝나도 대기해야하는 `병목 현상`이 나타난다.
이를 **HOL(Head Of Line) Blocking**으로 지칭한다. 따라서 **파이프라이닝(Pipelining)**은 모던 브라우저에서 기본적으로 활성화되어있지 않다.
- **RTT(Round Trip Time)** 증가
**RTT(Round Trip Time)**란, 클라이언트-서버간 요청에 대한 응답 왕복 시간(패킷 왕복 시간)을 의미한다.
매번 요청 별로 **Connection**을 만들게 되는 HTTP의 특성상 **3-way handshake**가 반복적으로 일어나며, 불필요한 `RTT` 증가와 네트워크 지연을 초래하여 성능을 악화시킨다.

# HTTP/2.0

`HTTP/1.1`의 한계를 느낀 Google이 차세대 프로토콜 개발 [SPDY(스피디)](https://ko.wikipedia.org/wiki/SPDY)를 개발하여 긍정적인 효과를 보자
[HTTP Working Group](https://httpwg.org/)이 SPDY를 기반으로 고도화하여 `HTTP/2.0`을** **탄생시켰다.

## Binary Framing Layer (Frame)

![](http2-binary-framing.svg)

`프레임(Frame)`은 **HTTP/2.0**에서 **통신의 최소 단위**이다.
**HTTP/1.1**에서는 **메세지(Message) **단위로 구성되어 개행 문자(\\r, \\n)를 통해 헤더(Header)와 본문(Body)를 구분했다.
**HTTP/2.0**에서는 이를 개선하기 위해 HTTP 메세지의 plain text는 **binary frame**으로 인코딩한다. **Header Frame,** **Data Frame **2가지로 구성된다.

> 💡 **Header 압축**
> ![](hpack-header-compression.svg)
> 헤더(Header Frame)를 전달하는 과정에서 [허프만 코딩 압축 방식](https://ko.wikipedia.org/wiki/%ED%97%88%ED%94%84%EB%A8%BC_%EB%B6%80%ED%98%B8%ED%99%94)을 기반으로하는 `HPACK 압축 방식`이 사용된다. 이를 통해 Header 크기를 줄이고 중복되는 Header는 재전송하지 않는다.

## 스트림 (Stream)

![](http2-streams-messages.svg)

커넥션을 통해 연결된 호스트 사이에서 교환되는 **Frame**들의 양방향 시퀸스이다. 한쌍의 HTTP 요청과 응답은 하나의 **스트림(stream)** 내부에서 이루어진다.
즉, **Frame**들이 모여 **Message**를 이루고 **Message**들이 모여 **Stream**을 이루게 된다. 따라서 구성되는 단위는 **Stream \> Message \> Frame**으로 정리된다.

### 멀티플렉싱 (multiplexing)

![HTTP/1.1 예시, TCP 병렬 커넥션](http1-tcp-parallel.gif)

![HTTP/2.0 예시, 1개의 Stream을 이용한 멀티플렉싱](http2-multiplexing.gif)

여기서 중요한 것은 **하나의 커넥션에 여러 스트림이 열릴 수 있다는 것**이다. 이를 통해 요청을 병렬적으로 처리할 수 있게 되었고 **멀티플렉싱(multiplexing)**이라고 한다.

> 💡 **우선 순위부여**
> HTTP/1.1과 다르게 **스트림(Stream)**은 **우선 순위**를 가질 수 있다. 중요한 리소스를 요청하는 스트림에게 우선순위를 높게 부여하는 것이다. 이는 **HOL(Head Of Line) Blocking** 문제를 해결했다.

## 서버 푸시

![HTTP/2.0 서버 푸시 예시](http2-server-push.gif)

`HTTP/2.0`에서 서버는 원래 요청에 대한 응답 외에도 클라이언트가 **필요한 리소스**를 명시적으로 요청하지 않고도 미리 캐싱해두어 **필요한 리소스** 요청이 올 때 빠르게 클라이언트에 보낼 수 있다.

> [chrome에서 더 이상 지원하지 않는다.](https://developer.chrome.com/blog/removing-push?hl=ko)

# HTTP/3

## QUIC 배경

> 💡  QUIC는 초기에는 "HTTP-over-QUIC"이라는 이름으로 불렸다가, 추후 공식적으로 "HTTP/3"로 명명되었다.

### TCP의 한계점

HTTP는 결국 TCP 위에서 동작된다. 따라서 아래와 같은 문제가 발생할 수 밖에 없다.

1. **RTT(Round Trip Time) 지연**: TCP 연결 설정 시 **3-way handshake** 과정에서 1 RTT가 소요된다. 여기에 **TLS handshake**까지 더하면 총 3 RTT가 소요된다.
2. **HOL(Head Of Line) Blocking**: TCP 스트림에서 하나의 패킷이 손실되면 그 뒤의 모든 패킷이 차단되어 전체 전송이 지연되는건 마찬가지다.

근본적인 해결책을 위해 `HTTP/3`에서는 **UDP(User Datagram Protocol)** 기반의 새로운 전송 프로토콜인 `QUIC(Quick UDP Internet Connections)`를 도입했다.

### UDP의 도입

**QUIC**에 도입된 **UDP**를 살펴보자. UDP는 **하얀 도화지**와 같다고 표현하는데, 이는 최소한의 기능만 제공하여 개발자가 자유롭게 필요한 기능을 구현할 수 있는 유연성을 제공하기 때문이다.
UDP는 이름 그대로 Datagram 패킷 교환 방식을 사용하여 데이터의 전송 순서가 보장되지 않고 신뢰성도 없다. 따라서 기존 TCP에서 필요했던 연결 설정, 혼잡 제어 등의 과정이 모두 생략되어 상대적으로 속도가 빠르다.
그러나 신뢰성과 전송 순서가 보장되지 않는 프로토콜을 그대로 서비스 네트워크에 적용하기는 어렵다. 이 문제를 해결하기 위해 UDP라는 하얀 도화지 위에 필요한 기능을 커스텀하여 구현한 프로토콜이 바로 **QUIC**이다.

## **QUIC 특징**

### 0(zero) RTT

QUIC(UDP)의 가장 주목할 만한 특징 중 하나는 **3-way handshake** 과정이 필요하지 않다는 것이다.

![그런건 모르겠고, 데이터 받아라](quic-data.jpg)

TCP(TLS)는 신뢰성(3-way handshake)과 암호화(TLS) 연결을 위한 절차 실행 후 데이터를 교환하지만, QUIC은 아무런 과정 없이 바로 데이터부터 전송한다. 이로 인해 QUIC의 속도가 빠를 수밖에 없다.
이는 QUIC이 데이터를 보낼 때, 연결 설정에 필요한 정보도 **함께** 전송하기 때문이다. 또한 내부에 **TLS 1.3**을 자체적으로 내장하고 있어 별도의 암호화 계층 설정 과정이 필요 없다.

![QUIC로 기능들이 통합되었다.](quic-stack.png)

QUIC의 `Connection ID`는 IP 주소와 포트 번호에 의존하지 않는 고유 식별자로, 클라이언트와 서버 간 연결을 식별한다. 이 Connection ID를 통해 QUIC은 이전 연결 상태를 저장하고 재사용할 수 있어, 네트워크 재연결 시 새로운 암호화 파라미터 협상 없이도 즉시 데이터를 전송할 수 있다. 이것이 바로 **0-RTT** 연결을 가능하게 하는 **핵심 메커니즘**이다.

> 💡 Connection ID는 **QUIC 헤더**에 존재한다.

단, 최초 연결 시에는 **1-RTT**가 필요하다. 이는 서버의 암호화 매개변수를 최초로 받아오는 과정이 필수적이기 때문이다. 그러나 재연결 시에는 **0-RTT**로 즉시 데이터 전송이 가능하다.
또한, Connection ID는 사용자의 IP 주소와 무관한 고유 식별자로, 네트워크 환경이 변경되어도(예: Wi-Fi에서 셀룰러 네트워크로 전환) 연결을 유지할 수 있게 해준다.

### 멀티플렉싱

멀티플렉싱 자체는 QUIC의 고유한 특징은 아니다. **HTTP/2.0**에서 등장한 기술이지만, QUIC에서 개선이 되었다.
QUIC에서는 `독립 스트림` 을 통해 각 스트림은 독립적인 순서 보장을 갖게** 되어 한 스트림의 패킷 손실이 다른 스트림에 영향**을 미치지 않게 되었다.
