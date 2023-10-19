FROM ubuntu:20.04

COPY . /oj_frontend
WORKDIR /oj_frontend

SHELL ["/bin/bash", "-c"]

RUN apt-get update -y
RUN apt-get install curl -y
RUN apt-get install git -y
RUN apt-get install vim -y

RUN mkdir -p /usr/local/nvm
ENV NVM_DIR /usr/local/nvm
# Nodejs 버전 명시
ENV NODE_VERSION 8.12.0

RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
RUN source $NVM_DIR/nvm.sh && nvm install $NODE_VERSION && nvm use --delete-prefix $NODE_VERSION

ENV NODE_PATH $NVM_DIR/versions/node/$NODE_VERSION/bin
ENV PATH $NODE_PATH:$PATH


ENV NODE_ENV development
# docker-compose 또는 쿠버네티스 환경 기반에서 구축 시 환경변수 오버라이딩 필요
ENV TARGET backendurl

RUN source $NVM_DIR/nvm.sh && npm install
RUN source $NVM_DIR/nvm.sh && npm run build:dll

# ENTRYPOINT ["/bin/bash", "/oj_frontend/start.sh"]
# ENTRYPOINT /oj_frontend/start.sh
ENTRYPOINT ["/bin/bash", "start.sh"]
# CMD sh start.sh
