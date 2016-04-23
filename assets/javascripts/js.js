var myApp = angular.module('Stuteboards',['ngCookies', 'ngRoute']);

var userid = "";
var token = "";
var email = "";

function softLogin(_$cookies)
{
	var res = {email: "", userid: "", token: "", present: false};
	if (_$cookies.get("email") && _$cookies.get("userid") && _$cookies.get("token"))
	{
		res.email = _$cookies.get("email");
		res.userid = _$cookies.get("userid");
		res.token = _$cookies.get("token");
		res.present = true;
	}
	return res;
}

function deleteAllCookiesOnFail(_$cookies)
{
	var cookies = _$cookies.getAll();
	angular.forEach(cookies, function (v, k) 
	{
   		_$cookies.remove(k);
	});
}

myApp.config(function($routeProvider, $locationProvider) {
	$routeProvider
		.when('/boards/:boardid/:page/:threadid', 
		{
    		templateUrl: 'assets/partials/base.html',
    		controller: 'BoardController'
  		})
		.when('/boards/:boardid/:page', 
		{
    		templateUrl: 'assets/partials/base.html',
    		controller: 'BoardController'
  		})
		.when('/boards/:boardid', 
		{
			//just default to page onew
    		templateUrl: 'assets/partials/base.html',
    		controller: 'BoardController'
  		})
		.when('/boards', 
		{
    		templateUrl: 'assets/partials/base.html',
    		controller: 'BoardController'
  		})
  		.when('/login', 
		{
    		templateUrl: 'assets/partials/login.html',
    		controller: 'LoginController'
  		})
  		.when('/confirmation', 
		{
    		templateUrl: 'assets/partials/confirmation.html',
    		controller: 'LoginController'
  		})
  		.otherwise({redirectTo: '/boards'});
	});

myApp.controller('MainController', ['$window','$scope', '$http', '$cookies', '$location', '$route', '$routeParams', function($window, $scope, $http, $cookies, $location, $route, $routeParams) 
{
	//Main Controller handles soft logins
	$scope.$route = $route;
    $scope.$location = $location;
    $scope.$routeParams = $routeParams;
  	//do login validation here, change variables if necessary
  	if (softLogin($cookies).present == true)
  	{
  		var temp = softLogin($cookies);
  		email = temp.email;
  		userid = temp.userid;
  		token = temp.token;
  		//use route params to indicate which board
  	}
  	else
  	{
  		$window.location.href = "#/login";
  	}
}]);

myApp.controller('LoginController', ['$window','$scope', '$http', '$cookies', '$location', '$route', '$routeParams', function($window, $scope, $http, $cookies, $location, $route, $routeParams) 
{
	$scope.params = $routeParams;

  	$scope.loginsrc = "/assets/partials/login.html";
  	$scope.confirmationsrc = "/assets/partials/confirmation.html";
  	$scope.authorizedsrc = "/assets/partials/base.html";
  	$scope.loginformdata = {email:"",password:""};
  	$scope.registrationformdata = {email:"",password:"",conpassword:""};
  	$scope.confirmformdata = {email:"",code:"",password:""};

	$scope.saveCookieData = function(_email, _userid, _token)
	{
		$cookies.put("email",_email);
		$cookies.put("userid",_userid);
		$cookies.put("token",_token);
	}

	$scope.deleteAllCookies = function()
	{
		var cookies = $cookies.getAll();
		angular.forEach(cookies, function (v, k) 
		{
    		$cookies.remove(k);
		});
	}

	$scope.validate = function(_formid)
	{
		$('#'+_formid).validate({ // initialize the plugin
        	highlight: function(element) 
        	{
    			$(element).parent().addClass("has-error").removeClass("has-success");
  			},
  			unhighlight: function(element) 
  			{
    			$(element).parent().removeClass("has-error").addClass("has-success");
  			}
    	});
	}

  	// Login into Acount
  	$scope.verifyAndLogin = function(_formid) 
  	{
  		var submitdata = {email:"", password:""};
  		if ($scope.loginformdata.email && $scope.loginformdata.password) 
  		{
        	submitdata.email = $scope.loginformdata.email;
        	submitdata.password = $scope.loginformdata.password;
    	}
		$http.post("/rest/login", submitdata)
		.success(function(data)
		{
  			$scope.deleteAllCookies();
  			$scope.saveCookieData(submitdata.email, data.id, data.token);
  			email = submitdata.email;
  			userid = data.id;
  			token = data.token;
  			//window.location.replace("#/boards");
  			$window.location.href = "#/boards";
		})
		.error(function(err)
		{
  			console.log(err);
		});
  	};

  	// Register New Account
  	$scope.verifyAndRegister = function(_formid) 
  	{
  		var submitdata = {email:"", password:""};
  		if ($scope.registrationformdata.email 
  			&& $scope.registrationformdata.password 
  			&& $scope.registrationformdata.conpassword
  			&& $scope.registrationformdata.password == $scope.registrationformdata.conpassword) 
  		{
        	submitdata.email = $scope.registrationformdata.email;
        	submitdata.password = $scope.registrationformdata.password;
    	}
		$http.post("/rest/registration", submitdata)
		.success(function(data)
		{
  			$window.location.href = "#/confirmation";
		})
		.error(function(err)
		{
  			console.log(err);
		});
  	};

  	//Confirm New Account
  	$scope.verifyAndConfirm = function() 
  	{
  		var submitdata = {email:"",code:""};
  		if ($scope.confirmformdata.email && $scope.confirmformdata.code) 
  		{
        	submitdata.email = $scope.confirmformdata.email;
        	submitdata.code = $scope.confirmformdata.code;
    	}
    	//$scope.validate(_formid);
		$http.post("/rest/registration/code", submitdata)
		.success(function(data)
		{
			var submitdatatemp = {email:"",password:""};
			if ($scope.confirmformdata.email && $scope.confirmformdata.password) 
  			{
        		submitdatatemp.email = $scope.confirmformdata.email;
        		submitdatatemp.password = $scope.confirmformdata.password;
    		}
  			$http.post("/rest/login", submitdatatemp)
			.success(function(data)
			{
  				$scope.deleteAllCookies();
  				$scope.saveCookieData(submitdatatemp.email, data.id, data.token);
  				email = submitdatatemp.email;
  				userid = data.id;
  				token = data.token;
  				$window.location.href = "#/boards";
  				//window.location.replace("#/boards");
			})
			.error(function(err)
			{
  				console.log(err);
			});
		})
		.error(function(err)
		{
  			console.log(err);
		});
  	};

  	$scope.logout = function() 
  	{
		$scope.deleteAllCookies();
		$window.location.href = "/";
		// 
		var logoutdatatemp = {email:"",token:""};
		if (email && token) 
  		{
        	logoutdatatemp.email = email;
        	logoutdatatemp.token = token
    	}
  		$http.post("/rest/logout", logoutdatatemp)
		.success(function(data)
		{
  			$scope.deleteAllCookies();
  			$window.location.href = "/";
  			//console.log("success logout");
		})
		.error(function(err)
		{
  			console.log(err);
		});
  	};
}]);

function compareBoardName(a,b) {
  if (a.name < b.name)
    return -1;
  else if (a.name > b.name)
    return 1;
  else 
    return 0;
}

myApp.controller('BoardController', ['$window','$scope', '$http', '$cookies', '$location', '$route', '$routeParams', function($window, $scope, $http, $cookies, $location, $route, $routeParams) 
{
	$scope.params = $routeParams;

	$scope.showboardlist = true;
	$scope.showthreadview = false;

	$scope.boardid = 0;
	$scope.pagenumber = 1;
	$scope.threadid = 1;

	if($scope.params.boardid != null)
	{
		//viewing a board
		$scope.showboardlist = false;
		$scope.boardid = $scope.params.boardid;
		if($scope.params.page != null)
		{
			//get page number that is not an assumed 1
			$scope.pagenumber = $scope.params.page;
			if ($scope.params.threadid != null)
			{
				//We are viewing an individual thread
				$scope.threadid = $scope.params.threadid;
				$scope.showthreadview = true;
			}
		}
		else
		{
			//add 1 to the url if it an assumed 1 
			//(user put in /#/boards/boardid, so make it /#/boards/boardid/1)
			$window.location.href = "#/boards/" + $scope.boardid + "/" + $scope.pagenumber;
		}
	}

  	$scope.authorizedsrc = "/assets/partials/base.html";
  	$scope.boardlistsrc = "/assets/partials/boardlist.html";
  	$scope.boardviewsrc = "/assets/partials/boardview.html";
  	$scope.threadviewsrc = "/assets/partials/threadview.html";
  	$scope.topnavviewsrc = "/assets/partials/topnavview.html";
  	$scope.bottomnavviewsrc = "/assets/partials/bottomnavview.html";

  	$scope.createboarddata = {name: ""}
  	$scope.createthreaddata = {name: ""}

  	$scope.boardlist = {data: []};
  	$scope.threadlist = {data: []};

  	$scope.currentboardname = "";

  	//Create a new board
  	$scope.verifyAndCreateBoard = function() 
  	{
  		var submitdata = {board_name:"", created_by:""};
  		if ($scope.createboarddata.name && userid) 
  		{
        	submitdata.board_name = $scope.createboarddata.name;
        	submitdata.created_by = userid;
    	}
		$http.post("/rest/boards", submitdata)
		.success(function(data)
		{
  			$route.reload();
		})
		.error(function(err)
		{
  			deleteAllCookiesOnFail($cookies);
  			$route.reload();
		});
  	};

  	$scope.verifyAndCreateThread = function() 
  	{
  		var submitdata = {title:"", created_by:""};
  		if ($scope.createthreaddata.name && userid) 
  		{
        	submitdata.title = $scope.createthreaddata.name;
        	submitdata.created_by = userid;
    	}
		$http.post("/rest/boards/"+$scope.boardid, submitdata)
		.success(function(data)
		{
  			$route.reload();
		})
		.error(function(err)
		{
  			deleteAllCookiesOnFail($cookies);
  			$route.reload();
		});
  	};

  	$scope.validate = function(_formid)
	{
		$('#'+_formid).validate({ // initialize the plugin
        	highlight: function(element) 
        	{
    			$(element).parent().addClass("has-error").removeClass("has-success");
  			},
  			unhighlight: function(element) 
  			{
    			$(element).parent().removeClass("has-error").addClass("has-success");
  			}
    	});
	}

  	$scope.buildBoardListData = function()
  	{
  		configobj = {data:null};
  		configobj.data = {email: email, token: token};
  		if(!(email == "" || token == ""))
  		{
  			$http.get("/rest/boards", configobj)
			.success(function(data)
			{
  				$scope.boardlist.data = data.boards;
  				$scope.boardlist.data.sort(compareBoardName);
			})
			.error(function(err)
			{
  				// deleteAllCookiesOnFail($cookies);
  				// $route.reload();
  				console.log(err);
			});
  		}
  	}

  	$scope.buildThreadListData = function()
  	{
  		// Make sure to build board data
  		$scope.buildBoardListData();
  		// Have to wait for the board to be created
  		$scope.$watch("boardlist.data", function()
  		{
  			// Get the name for this particular thread's board
  			for(var i = 0; i < $scope.boardlist.data.length; i++)
  			{
  				if ($scope.boardlist.data[i].id == $scope.boardid)
  				{
  					$scope.currentboardname = $scope.boardlist.data[i].name;
  				}
  			}
    	});

  		// Get thread data for the board
  		configobj = {data:null};
  		configobj.data = {email: email, token: token};
  		if(!(email == "" || token == ""))
  		{
  			$http.get("/rest/boards/"+$scope.boardid, configobj)
			.success(function(data)
			{
  				$scope.threadlist.data = data.threads;
  				// $scope.threadlist.data.sort(compareBoardName);
			})
			.error(function(err)
			{
  				// deleteAllCookiesOnFail($cookies);
  				// $route.reload();
  				console.log(err);
			});
  		}
  	}
}]);

$(document).ready(function()
{
	console.log(email);
  	console.log(userid);
  	console.log(token);
});