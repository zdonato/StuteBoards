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
    "created_by" : id_of_user,
}
```

#### Return GET
```
{
    "boards" : [
        {
            "name" : "name of board",
            "id" : board_id
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
    "id" : id_of_board
}
```

### */rest/boards/id* => GET, POST
#### Body (POST only)
```
{
    "title" : "thread title",
    "created_by" : id_of_user
}
```
#### Return GET
```
{
    "id" : "id of the board',
    "board_name" : "name of the board
    "threads" : [
        {
            "id" : thread_id,
            "title" : "thread title",
            "last_comment" : "moment string, formatted",
            "parent_id" : id_of_board,
            "created_on" : "moment string, formatted
        }
    ]
}
```
#### Return POST
```
{
    "error" : "error message if error",
    "id" : thread_id
}
```

### */rest/boards/boardID/threadID* => GET, POST
#### Body (POST only)
```
{
    "body" : "Body of the comment",
    "created_by" : "id of user that created the comment"
}
```

#### Return POST
```
{
    "error" : "error message if error",
    "message" : "success message"
}
```

#### Return GET
```
{
    "comments" : [
        {
            "id" : "comment id",
            "body" : "comment body",
            "created_on" : "moment timestamp",
            "parent_id" : "id of thread the comment resides in"
        }
    ]
}
```

### */rest/logout* => POST
#### Body
```
{
    "email" : "some-email@stevens.edu",
    "token" : "auth token of user"
}
```
#### Return
```
{
    "error" : "some error message",
    "message" : "email has been logged out"
}
```
