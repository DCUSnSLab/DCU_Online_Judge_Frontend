#-*- coding:utf-8 -*-
import requests
import time
import logging
import logging.handlers

import psutil
import os
import signal
import argparse
import threading

import smtplib
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)

formatter = logging.Formatter('[%(asctime)s][%(levelname)s|%(filename)s:%(lineno)s] >> %(message)s')

streamHandler = logging.StreamHandler()

file_max_bytes = 5 * 1024 * 1024
fileHandler = logging.handlers.RotatingFileHandler('./oj_server.log', maxBytes=file_max_bytes, backupCount=50)

streamHandler.setFormatter(formatter)
fileHandler.setFormatter(formatter)

logger.addHandler(streamHandler)
logger.addHandler(fileHandler)

logger.setLevel(level=logging.DEBUG)

backend_conn = 0
db_conn = 0
redis_conn = 0
judge_conn = 0

def sendEmail(error): # 전송할 메일 내용 정의
    print("sending Email for Notification")
    s = smtplib.SMTP('smtp.gmail.com', 587)
    s.starttls()
    s.login('dcucode@gmail.com', 'wwwsnslab1!')
    msg = MIMEText('Get up and FIX IT\n')
    msg['Subject'] = '[DCU SERVER NOTIFICATION] Server has been broken by [' + error + ']'
    s.sendmail('dcucode@gmail.com', ['junhp12345@gmail.com'], msg.as_string())
    s.quit()
    print("Email has been sent")

while True:
    if backend_conn > 5:
            # os.system('echo "08502740" | sudo -S docker restart oj-backend') # 본 서버 사용 시 아래 코드 주석 처리 후 해당 코드 사용
            os.system('echo "akqthtk1!" | sudo -S docker restart oj-backend') # 에러 카운트가 5를 넘은 경우, (백엔드가 25초 이상 무응답 시) 백엔드 컨테이너를 재시작한다.
            t = threading.Thread(target=sendEmail("backend"))
            t.start()
            jdata = r.json()
            jdata['error'] = "Server Restarted"
            logger.info(jdata)
            backend_conn = 0
    try:
        requesttime = time.time()
        r = requests.get("http://localhost:8085/api/heartbeat") # 프론트엔드 주소 입력 (환경에 따라 포트 변경 필요)
        requesttime = time.time() - requesttime
        print("백엔드 하트비트 앱 요청에 걸리는 시간", requesttime)
        print("logging app cpu usage", psutil.cpu_percent())
        print("logging app memory usage", psutil.virtual_memory().percent)
        jsonerr = r.json()['error']

        postgres = r.json()['data']['postgres']

        if postgres is False: # Postgres 미동작하는 경우
            db_conn = db_conn + 1

        if jsonerr is not None: # 프론트엔드가 동작하지 않는 경우
            json = r.json()
            logger.info(json)
            frontend_conn = frontend_conn + 1
        else:
            backend_conn = 0
            json = r.json()
            logger.info(json)
    except Exception as e:
        # catastrophic error. bail.
        logger.info(e)
        backend_conn = backend_conn + 1

    time.sleep(5)