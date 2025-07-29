#!/bin/bash
echo "Npm run dev strt"
echo $NVM_DIR
source /usr/local/nvm/nvm.sh
#npm run build

exec nginx -c ./deploy/nginx.conf
