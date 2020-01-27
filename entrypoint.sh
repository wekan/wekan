#!/usr/bin/env bash
set -e

# ==============================================================================
# docker swarm secret files management

if [ ! -z ${MONGO_URL_FILE} ]; then
    if [ -f $MONGO_URL_FILE ];then
        export MONGO_URL=$(cat $MONGO_URL_FILE)
    fi
fi


if [ ! -z ${MAIL_URL_FILE} ]; then
    if [ -f $MAIL_URL_FILE ];then
        export MAIL_URL=$(cat $MAIL_URL_FILE)
    fi
fi

if [ ! -z ${LDAP_AUTHENTIFICATION_PASSWORD_FILE} ]; then
    if [ -f $LDAP_AUTHENTIFICATION_PASSWORD_FILE ];then
        export LDAP_AUTHENTIFICATION_PASSWORD=$(cat $LDAP_AUTHENTIFICATION_PASSWORD_FILE)
    fi
fi

# ==============================================================================
# launch wekan

node /wekan/main.js
