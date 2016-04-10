# Stute Boards

## Rest API

### */rest/registration* => POST
#### Body
```
{
    "email" : "some-email@stevens.edu",
    "password" : "encrypted-password"
}
```
#### Return
```
{
    "status" : "success or error",
    "error" : "message if error"
}
```

___



### */rest/registration/code* => POST
#### Body
```
{
    "email" : "some-email@stevens.edu",
    "code" : "10 Digit code sent to email"
}
```
#### Return
```
{
    "token" : "auth token if successful",
    "error" : "error message if incorrect code, only allowed 3 tries"
}
```

___

### */rest/login* => POST
#### Body
```
{
    "email" : "some-email@stevens.edu",
    "password" : "encrypted-password"
}
```
#### Return
```
{
    "status" : "success or error",
    "error" : "message if error"
}
```

___

### */rest/boards* => GET, POST
#### Body (POST only)
``` 
{
    "board_name" : "name of board",
    "created_by" : id of user,
}
```

#### Return GET
```
{
    "boards" : [
        {
            "name" : "name of board",
            "id" : board id
            "created_on" : "moment string, formatted"
            "latest_post" : "moment string, formatted"
        }
    ]
}
```
#### Return POST
```
{
    "error" : "error message if error",
    "board_name" : "name of board",
    "id" : id of board
}
```