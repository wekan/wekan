Code originally by ertanalytics (Eric Thompson / AZero). Script has been used for daily exports of a board.

***

![Wekan Sandstorm cards to CSV using Python screenshot](https://wekan.github.io/sandstorm-api-csv.png)

***

## Exporting Wekan board to JSON with Bash script

1) On Wekan grain, get Webkey like this:

```
https://api-URL.SUBDOMAIN.sandcats.io#APIKEY
```

2) Modity URL, SUBDOMAIN and APIKEY to this Bash script that exports board to file directly:

```
curl https://Bearer:APIKEY@api-URL.SUBDOMAIN.sandcats.io/api/boards/sandstorm/export?authToken=#APIKEY > wekanboard.json
```
For local Sandstorm install:
```
curl http://Bearer:APIKEY@api-URL.local.sandstorm.io:6080/api/boards/sandstorm/export?authToken=#APIKEY > wekanboard.json
```

***

## Python script, has more dependencies

cards-to-csv.py

```
#Sandstorm Wekan API Access Testing
##Does not seem to pull the redirected content
import requests
from requests.auth import HTTPBasicAuth
from bs4 import BeautifulSoup
from time import sleep
import os
import sys
import urllib
#All imports needed site navigation
import datetime
from time import sleep
import time
from selenium import webdriver
#drive.get('http://www.google.com/');
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from splinter import *
#driver = webdriver.Chrome()
##Data Handling
import pandas as pd
import json
from bson import json_util, ObjectId
from pandas.io.json import json_normalize
reload(sys)
sys.setdefaultencoding('utf-8')
#Export API Command
apiURLnoAuth = 'https://Bearer:APIKEY@api-URL.SUBDOMAIN.sandcats.io/api/boards/sandstorm/export?authToken=#APIKEY'

sleep(1) #Time in seconds

# Choose the browser (default is Firefox)
browser2 = Browser('chrome')

# Fill in the url
browser2.visit(apiURLnoAuth)

sleep(1) #Time in seconds

soup = BeautifulSoup(browser2.html,'html.parser')
browser2.quit()

script = soup.find('pre').children.next()
sanitized = json.loads(script)

dflabels = pd.DataFrame(json_normalize(sanitized, 'labels'))
dflists = pd.DataFrame(json_normalize(sanitized, 'lists'))
dfcards = pd.DataFrame(json_normalize(sanitized, 'cards'))
dfusers = pd.DataFrame(json_normalize(sanitized, 'users'))

normalized = json_normalize(sanitized)
df = pd.DataFrame(normalized)


dflists['createdAt'] = pd.to_datetime(dflists['createdAt'])
dflists['updatedAt'] = pd.to_datetime(dflists['updatedAt'])

dfcards['createdAt'] = pd.to_datetime(dfcards['createdAt'])
dfcards['dateLastActivity'] = pd.to_datetime(dfcards['dateLastActivity'])
dfcards['title']=dfcards['title'].str.replace('\n','')


dfcards.to_csv('//DESTINATION_FOLDER/dfcards.csv',sep='|')
dflists.to_csv('//DESTINATION_FOLDER/dflists.csv',sep='|')
dflabels.to_csv('//DESTINATION_FOLDER/dfboardsLabels.csv',sep='|')
dfusers.to_csv('//DESTINATION_FOLDER/dfusers.csv',sep='|')
