SET MONGO_URL=mongodb://127.0.0.1:27017/wekan
SET ROOT_URL=http://127.0.0.1:2000/
SET MAIL_URL=smtp://user:pass@mailserver.example.com:25/
SET MAIL_FROM=admin@example.com
SET PORT=2000
SET WITH_API=true
cd .build\bundle
node main.js