---
date: 2024-11-23
published: true
slug:
thumbnail:
---

AWS Elastic Beanstalk(EB)에서 AWS ECS로 인프라 구성을 수정하면서 Github Action으로 연결되어 있던 CI/CD 방식을 수정해야하는 상황이 발생했다.

# 변경 점
기존에는 EB에게 [Dockerrun.aws.json](https://docs.aws.amazon.com/ko_kr/elasticbeanstalk/latest/dg/create_deploy_docker_v2config.html) 파일을 생성하여 **'이런 식으로 task definition 만들어줘\~' **하는 느낌이었다면 이제는 직접 task definition을 작성하고 구성해야한다.
task definition의 메모리, CPU 등등 인프라 설정은 한번 설정하면 거의 바뀌지 않는다.
따라서 새로 배포되어야 할 기능이 반영된 Docker Image를 사용하도록 환경을 수정하면 되기 때문에 아래와 같은 단계를 거치도록 수정하였다.
1. 현재 배포되어 있는 **task definition 불러오기**
2. 새롭게 빌드된(배포할) Docker Image 사용하도록 **task definition 수정**
3. 수정된 새로운 **task definition 배포**

# task definition 불러오기
다행히 공식으로 제공되는 [AWS CLI](https://docs.aws.amazon.com/cli/latest/reference/ecs/describe-task-definition.html?highlight=describe%20task%20definition)가 Github Action에서 task definition을 불러오게 해준다. 🥹
```yaml
- name: Download task definition
  run: |
    aws ecs describe-task-definition \
      --task-definition task-definition-name \
      --query taskDefinition \
      > task-definition.json
```
위 명령어를 통해 `task-definition.json` 이란 이름의 JSON으로 저장이 되게 된다.

## 주의 사항
위 방식을 이용하는 경우 `task-definition-name` 으로 지정된 task-definition이 1개 이상 AWS에 저장되어 있어야한다. 다시 말해  AWS 대시보드(홈페이지)를 통해 **수동**으로 task-definition을 한번 등록을 해줘야 한다.
만약 처음 등록부터 Github Action을 통하고 싶다면 [register-task-definition](https://docs.aws.amazon.com/cli/latest/reference/ecs/register-task-definition.html) 명령어를 이용해보자.
- **describe-task-definition **에서 오류 발생 (등록된 task-definition 없음) → **register-task-definition** 실행
이런 식으로 구성을 하면 되겠다. 필자는 첫 task-definition 구성은 AWS 대시보드를 통하는게 실수를 줄이고 명확한 것 같아서 사용하지 않았다.

# task definition 수정
불러온 `task-definition.json`은 가장 최신(대부분 현재 배포되어 있는) task definition이기 때문에 배포를 위해서는 Docker Image 이름을 새롭게 작성해줘야 한다.
JSON에서 Docker Image 이름을 수정하기 위해 AWS에서 제공하는 [Action](https://github.com/aws-actions/amazon-ecs-render-task-definition/tree/v1/)을 사용한다.
이때 [containerDefinitions](https://docs.aws.amazon.com/ko_kr/AmazonECS/latest/APIReference/API_ContainerDefinition.html)에서 `multi container`를 이용하는 경우 Action에 반환 값을 이용하면 된다.

## Multi Container 환경
```yaml
- name: Render Amazon ECS task definition for first image
  id: render-first-image
  uses: aws-actions/amazon-ecs-render-task-definition@v1
  with:
    task-definition: task-definition.json
    container-name: first-container
    image: first-image-name
```
위 처럼 첫번째 Action에서 반환되는 값은 **첫번째 Docker Image 주소(ECR 주소)가 수정된 task definition**이다. 이때 `container-name` 값은 task definition에 등록된 이름과 동일해야 한다.
```yaml
- name: Modify Amazon ECS task definition with second image
  id: render-second-image
  uses: aws-actions/amazon-ecs-render-task-definition@v1
  with:
    task-definition: ${{ steps.render-first-container.outputs.task-definition }}
    container-name: second-container
    image: second-image-name
```
따라서 이를 두번째 Action의 `task-definition` 의 값으로 사용하면 된다.

# task definition 배포
```yaml
- name: Deploy to Amazon ECS service
  uses: aws-actions/amazon-ecs-deploy-task-definition@v2
  with:
    task-definition: 완성된 task definition
    service: my-service
    cluster: my-cluster
```
배포는 [해당 Action](https://github.com/aws-actions/amazon-ecs-deploy-task-definition)을 통해 간단히 가능하다. 배포될 Docker Image 이름이 전부 수정된 task definition 파일을 전달하면 배포가 가능하다.

# 정리
```yaml
# 0. Docker Image Build 및 Docker Image 이름 추출
- name: Create Docker Image Name
  id: create-image-name
  run: |
    echo "first-image" >> $GITHUB_OUTPUT
    echo "second-image" >> $GITHUB_OUTPUT

# 1. Task Definition 불어오기 
- name: Download task definition
  id: download-task-definition
  run: |
    aws ecs describe-task-definition \
      --task-definition task-definition-name \
      --query taskDefinition \
      > task-definition.json
      
    result=task-definition.json
    echo "task-definition=$result" >> $GITHUB_OUTPUT

# 2. Task Definition 수정 (Docker Image 수정)
- name: Render Amazon ECS task definition for first image
  id: replace-first-image
  uses: aws-actions/amazon-ecs-render-task-definition@v1
  with:
    task-definition: ${{ steps.download-task-definition.outputs.task-definition }}
    container-name: first-container
    image: ${{ steps.create-image-name.outputs.first-image }}
    
- name: Modify Amazon ECS task definition with second image
  id: replace-second-image
  uses: aws-actions/amazon-ecs-render-task-definition@v1
  with:
    task-definition: ${{ steps.render-first-image.outputs.task-definition }}
    container-name: second-container
    image: ${{ steps.create-image-name.outputs.second-image }}
    
# 3. Task Definition 배포 
- name: Deploy to Amazon ECS service
  uses: aws-actions/amazon-ecs-deploy-task-definition@v2
  with:
    task-definition: ${{ steps.replace-second-container.outputs.task-definition }}
    service: my-service
    cluster: my-cluster
```
위에서 설명한 3단계를 순차적으로 구성했다. **0단계**에 해당하는 Docker Image Build 단계는 자세히 다루지 않았지만, 결국 새로운 Docker Image의 이름만 `outputs`으로 알려주면 된다.
`echo "추출할 변수" >> $GITHUB_OUTPUT`을 통해 `step`에서 만들어진 값을 내보내고 이를 `steps.*.outputs`으로 사용하는 것에 유의하자.
