---
date: 2024-10-13
published: true
slug:
thumbnail:
---

[AWS Elastic Beanstalk](https://aws.amazon.com/ko/elasticbeanstalk/?gclid=Cj0KCQjwjY64BhCaARIsAIfc7YZUZncotU3pWbK1DslkGrpqgCG7X4pi2RdVpVq5nkPXwfnh_BKIubUaAvCrEALw_wcB&trk=3d211853-d899-491e-bd5a-fb5f17de6f0f&sc_channel=ps&ef_id=Cj0KCQjwjY64BhCaARIsAIfc7YZUZncotU3pWbK1DslkGrpqgCG7X4pi2RdVpVq5nkPXwfnh_BKIubUaAvCrEALw_wcB:G:s&s_kwcid=AL!4422!3!651510175878!e!!g!!elastic%20beanstalk!19835789747!147297563979)은 자동으로 애플리케이션을 위한 `플랫폼` 별 환경을 구성한다. 환경 구성 중 EC2 인스턴스 내부에 애플리케이션 상태 모니터링(로깅)을 위해 CloudWatch Logs Agent가 설치되고 이를 통해 각 로그 그룹에 대한 데이터를 [CloudWatch](https://aws.amazon.com/ko/cloudwatch/)에 로그를 기록하게 된다.
> EC2 ↔ CloudWatch Logs Agent ↔ CloudWatch

# 플랫폼 별 로그
Elastic Beanstalk에서 `플랫폼`은 Docker, Docker(ECS), Node.js, Python** **등 언어 및 실행 환경을 의미하게 되는데 플랫폼 별로 **로그**가 다르게 설정되는 특징이 존재한다.
대부분 서비스에서 많이 사용하는 Docker([AWS ECS](https://aws.amazon.com/ko/ecs/)) 플랫폼을 기준으로 살펴보자.

![](10bd55b8-1.png)

![Docker(ECS) 로그 구성](10bd55b8-2.png)

Docker(AWS ECS) 플랫폼에서 구성되는 로그이다. 문서에 따르면 애플리케이션이 동작할 **docker container** 로그가 존재하지 않는다. 즉,** **기본 구성만으로는 사용자의 API 트랜잭션, 애플리케이션 내부 동작 등 애플리케이션의 로그들을 CloudWatch에서 볼 수가 없다.
> **docker-events.log**는 docker container의 시작, 종료 시간을 기록하는 로그일 뿐이다.

![](10bd55b8-3.png)

`log/containers` 경로에 docker container 로그들이 존재하긴 한다. 하지만 Elastic Beanstalk 환경 구성 과정에서 CloudWatch Logs Agent가 해당 폴더에 로그들을 CloudWatch로 **연결**을 해주지 않기 때문에 CloudWatch에서 볼 수 없는 것이다.

# 커스텀 로그
해당 폴더를 연결해주지 않아서 CloudWatch에서 볼 수 없는 것 이라면 반대로 연결만 해주면 해결이 가능하다.
다행히도 초기 설정을 통해 CloudWatch Logs Agent에 우리가 원하는 로그 관련 구성을 추가할 수 있다. 이때 위에 연결이 필요한 폴더를 추가하면 된다.
[.ebextensions](https://docs.aws.amazon.com/ko_kr/elasticbeanstalk/latest/dg/ebextensions.html) 폴더를 이용하면 사용자가 `*.config` 파일명(이름은 자유)으로 Elastic Beanstalk 환경 구성을 추가 및 수정이 가능해진다.

## log.config
```yaml
files:
  "/opt/aws/amazon-cloudwatch-agent/etc/custom-log-config.json":
    mode: "0644"
    owner: root
    group: root
    content: |
      {
        "logs": {
          "logs_collected": {
            "files": {
              "collect_list": [
                {
                  "file_path": "/var/log/containers/로그 파일.log",
                  "log_group_name": "`{"Fn::Join":["/", ["/aws/elasticbeanstalk", { "Ref":"AWSEBEnvironmentName" }, "/var/log/컨테이너 이름.log"]]}`",
                  "log_stream_name": "{instance_id}",
                  "retention_in_days": 7
                }
              ]
            }
          }
        }
      }
container_commands:
  01_append_cloudwatch_agent_config:
    command: /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a append-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/custom-log-config.json
  02_remove_backup_file:
    command: rm -f /opt/aws/amazon-cloudwatch-agent/etc/custom-log-config.json.bak
    ignoreErrors: true
```

### file_path
`file_path`에 추가를 원하는 애플리케이션 로그 파일 및 경로를 입력하면 된다. 여기서 파일 및 경로는 `log/containers`에 위치하게 된다.
만약 추가하고 싶은 로그가 여러개(멀티 컨테이너 환경)라면 `collect_list`가 배열이기 때문에 배열의 요소를 추가해주면된다.

### log_group_name
CloudWatch 로그 그룹의 이름을 지정한다. 해당 로그 그룹으로 로그들이 지정되게 되는데 기본적으로 Elastic Beanstalk가 생성한 로그 그룹의 이름은 `/aws/elasticbeanstalk/환경 이름/var/log/*.log` 로 지정되기 때문에 통일성을 위해 `/aws/elasticbeanstalk/환경 이름/var/log/컨테이너 이름.log` 을 추천한다.

## .ebextensions 전달 방법
```yaml
cp Dockerrun.aws.json deploy/Dockerrun.aws.json
cp -r .ebextensions deploy/.ebextensions

cd deploy && zip -r deploy.zip .
```
생성된 `.ebextensions/*.config` 파일들은 **dockerrun.aws.json** 파일과 함께 압축해서 Elastic Beanstalk에 전달을 해주면 된다.

# 로그 확인

![](10bd55b8-4.png)

위와 같은 설정을 해도 CloudWatch에서 로그가 보이지 않을텐데, 로그 그룹을 생성해주지 않았기 때문이다. 위 config 파일에서 `log_group_name`에 설정한 로그 그룹을 추가해주면 된다.

![nginx container 로그 추가](10bd55b8-5.png)

모든 설정이 끝났다면 Elastic Beanstalk이 기본으로 구성한 로그와 함께 **docker container 로그 확인**이 가능해진다.
