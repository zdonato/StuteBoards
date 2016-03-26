#Stute Boards

##Rest API

###*/rest/registration* => POST
####Body
```
{
    email : "some-email@stevens.edu",
    password : "encrypted-password"
}
```
####Return
```
{
    status : "success" or "error"
    error : message_if_error
}
```

___



###*/rest/registration/code* => POST
####Body
```
{
    email : "some-email@stevens.edu",
    code : 10 Digit code sent to email
}
```
####Return
```
{
    token : auth token if successful,
    error : error message if incorrect code, only allowed 3 tries
}
```

