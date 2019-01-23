use database;
db.collecctionname.updateMany({}, {$set: {
    "production": false
}});
