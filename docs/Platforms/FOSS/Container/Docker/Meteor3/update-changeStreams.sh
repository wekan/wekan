#!/bin/bash

sed -i "s|changeStreams,oplog,polling|oplog,polling|g" */docker-compose.yml
sed -i "s|DDP_TRANSPORT=uws|DDP_TRANSPORT=sockjs|g" */docker-compose.yml

#      - METEOR_REACTIVITY_ORDER=changeStreams,oplog,polling
#      #- METEOR_REACTIVITY_ORDER=oplog,polling
#      - DDP_TRANSPORT=uws
#      #- DDP_TRANSPORT=sockjs
