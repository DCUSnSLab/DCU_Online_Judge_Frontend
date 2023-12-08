/* pipeline 변수 설정 */
def app

node {
    // gitlab으로부터 소스 다운하는 stage
    stage('Checkout') {
            checkout scm
    }

    // mvn 툴 선언하는 stage, 필자의 경우 maven 3.6.0을 사용중
    stage('Ready'){
        sh "echo 'Ready to build'"
    }

    //dockerfile기반 빌드하는 stage ,git소스 root에 dockerfile이 있어야한다
    stage('Build image'){
        app = docker.build("harbor.cu.ac.kr/dcucode/dcu_code_fe")
    }

    //docker image를 push하는 stage, 필자는 dockerhub에 이미지를 올렸으나 보통 private image repo를 별도 구축해서 사용하는것이 좋음
    //docker.withRegistry에 dockerhub는 앞서 설정한 dockerhub credentials의 ID이다.
    stage('Push image') {
        docker.withRegistry("https://harbor.cu.ac.kr", "harbor") {
            app.push("latest")
            app.push("${env.BUILD_NUMBER}")
        }
    }

    stage('Kubernetes deploy') {
        sh "kubectl delete -f /services/dcucode/oj-frontend_only_con.yaml -n dcucode"
        sh "kubectl apply -f /services/dcucode/oj-frontend_only_con.yaml -n dcucode"
    }

    stage('Complete') {
        sh "echo 'The end'"
    }
  }
