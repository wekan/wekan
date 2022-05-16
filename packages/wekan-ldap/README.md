# meteor-ldap

This packages is based on the RocketChat ldap login package

# settings definition

LDAP_Enable: Self explanatory

LDAP_Port: The port of the LDAP server

LDAP_Host: The host server for the LDAP server

LDAP_BaseDN: The base DN for the LDAP Tree

LDAP_Login_Fallback: Fallback on the default authentication method

LDAP_Reconnect: Reconnect to the server if the connection is lost

LDAP_Timeout: self explanatory

LDAP_Idle_Timeout: self explanatory

LDAP_Connect_Timeout: self explanatory

LDAP_Authentication: If the LDAP needs a user account to search

LDAP_Authentication_UserDN: The search user DN

LDAP_Authentication_Password: The password for the search user

LDAP_Internal_Log_Level: The logging level for the module

LDAP_Background_Sync: If the sync of the users should be done in the
background

LDAP_Background_Sync_Interval: At which interval does the background task sync

LDAP_Encryption: If using LDAPS, set it to 'ssl', else it will use 'ldap://'

LDAP_CA_Cert: The certification for the LDAPS server

LDAP_Reject_Unauthorized: Reject Unauthorized Certificate

LDAP_User_Search_Filter:

LDAP_User_Search_Scope:

LDAP_User_Search_Field: Which field is used to find the user

LDAP_Search_Page_Size:

LDAP_Search_Size_Limit:

LDAP_Group_Filter_Enable: enable group filtering

LDAP_Group_Filter_ObjectClass: The object class for filtering

LDAP_Group_Filter_Group_Id_Attribute:

LDAP_Group_Filter_Group_Member_Attribute:

LDAP_Group_Filter_Group_Member_Format:

LDAP_Group_Filter_Group_Name:

LDAP_Unique_Identifier_Field: This field is sometimes class GUID ( Globally Unique Identifier)

UTF8_Names_Slugify: Convert the username to utf8

LDAP_Username_Field: Which field contains the ldap username

LDAP_Fullname_Field: Which field contains the ldap full name

LDAP_Email_Match_Enable: Allow existing account matching by e-mail address when username does not match

LDAP_Email_Match_Require: Require existing account matching by e-mail address when username does match

LDAP_Email_Match_Verified: Require existing account email address to be verified for matching

LDAP_Email_Field: Which field contains the LDAP e-mail address

LDAP_Sync_User_Data:

LDAP_Sync_User_Data_FieldMap:

Accounts_CustomFields:

LDAP_Default_Domain: The default domain of the ldap it is used to create email if the field is not map correctly with the LDAP_Sync_User_Data_FieldMap




# example settings.json
```
{
  "LDAP_Port": 389,
  "LDAP_Host": "localhost",
  "LDAP_BaseDN": "ou=user,dc=example,dc=org",
  "LDAP_Login_Fallback": false,
  "LDAP_Reconnect": true,
  "LDAP_Timeout": 10000,
  "LDAP_Idle_Timeout": 10000,
  "LDAP_Connect_Timeout": 10000,
  "LDAP_Authentication": true,
  "LDAP_Authentication_UserDN": "cn=admin,dc=example,dc=org",
  "LDAP_Authentication_Password": "admin",
  "LDAP_Internal_Log_Level": "debug",
  "LDAP_Background_Sync": false,
  "LDAP_Background_Sync_Interval": "100",
  "LDAP_Encryption": false,
  "LDAP_Reject_Unauthorized": false,
  "LDAP_Group_Filter_Enable": false,
  "LDAP_Search_Page_Size": 0,
  "LDAP_Search_Size_Limit": 0,
  "LDAP_User_Search_Filter": "",
  "LDAP_User_Search_Field": "uid",
  "LDAP_User_Search_Scope": "",
  "LDAP_Unique_Identifier_Field": "guid",
  "LDAP_Username_Field": "uid",
  "LDAP_Fullname_Field": "cn",
  "LDAP_Email_Match_Enable": true,
  "LDAP_Email_Match_Require": false,
  "LDAP_Email_Match_Verified": false,
  "LDAP_Email_Field": "mail",
  "LDAP_Sync_User_Data": false,
  "LDAP_Sync_User_Data_FieldMap": "{\"cn\":\"name\", \"mail\":\"email\"}",
  "LDAP_Merge_Existing_Users": true,
  "UTF8_Names_Slugify": true
}
```
