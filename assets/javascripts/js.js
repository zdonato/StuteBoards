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
		.when('/', 
		{
    		templateUrl: 'index.html',
    		controller: 'LoginController',
  		})
		.when('#/boards', 
		{
    		templateUrl: '../assets/partials/base.html',
    		controller: 'BoardController',
  		})
  		.when('#/login', 
		{
    		templateUrl: '../assets/partials/login.html',
    		controller: 'LoginController',
  		})
  		.when('#/confirmation', 
		{
    		templateUrl: '../assets/partials/confirmation.html',
    		controller: 'LoginController',
  		});
	});

myApp.controller('LoginController', ['$scope', '$http', '$cookies', '$location', '$route', '$routeParams', function($scope, $http, $cookies, $location, $route, $routeParams) 
{
	console.log($routeParams);
  	$scope.registered = false;
  	$scope.confirmed = false;
  	//do login validation here, change variables if necessary
  	if (softLogin($cookies).present == true)
  	{
  		$scope.registered = true;
  		$scope.confirmed = true;
  		var temp = softLogin($cookies);
  		email = temp.email;
  		userid = temp.userid;
  		token = temp.token;
  		window.location.replace("#/boards");
  	}
  	else
  	{
  		window.location.replace("#/login");	
  	}

  	$scope.loginsrc = "/assets/partials/login.html";
  	$scope.confirmationsrc = "/assets/partials/confirmation.html";
  	$scope.authorizedsrc = "/assets/partials/base.html";
  	$scope.loginformdata = {email:"",password:""};
  	$scope.registrationformdata = {email:"",password:"",conpassword:""};
  	$scope.confirmformdata = {email:"",code:""};

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
  			$scope.registered = true;
  			$scope.confirmed = true;
  			$scope.deleteAllCookies();
  			$scope.saveCookieData(submitdata.email, data.id, data.token);
  			email = submitdata.email;
  			userid = data.id;
  			token = data.token;
  			window.location.replace("#/boards");
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
  			$scope.registered = true;
		})
		.error(function(err)
		{
  			console.log(err);
		});
  	};

  	//Confirm New Account
  	$scope.verifyAndConfirm = function(_formid) 
  	{
  		var submitdata = {email:"",code:""};
  		if ($scope.confirmformdata.email && $scope.confirmformdata.code) 
  		{
        	submitdata.email = $scope.confirmformdata.email;
        	submitdata.code = $scope.confirmformdata.code;
    	}
    	$scope.validate(_formid);
		$http.post("/rest/registration/code", submitdata)
		.success(function(data)
		{
			var submitdatatemp = {email:"",password:""};
			if ($scope.registrationformdata.email && $scope.registrationformdata.password) 
  			{
        		submitdatatemp.email = $scope.registrationformdata.email;
        		submitdatatemp.password = $scope.registrationformdata.password;
    		}
  			$http.post("/rest/login", submitdatatemp)
			.success(function(data)
			{
  				$scope.registered = true;
  				$scope.confirmed = true;
  				$scope.deleteAllCookies();
  				$scope.saveCookieData(submitdatatemp.email, data.id, data.token);
  				email = submitdatatemp.email;
  				userid = data.id;
  				token = data.token;
  				window.location.replace("#/boards");
  				//location.reload();
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
		location.reload();
  	};
}]);

myApp.controller('BoardController', ['$scope', '$http', '$cookies', function($scope, $http, $cookies) 
{
  	$scope.authorizedsrc = "/assets/partials/base.html";
  	$scope.boardlistsrc = "/assets/partials/boardlist.html";
  	$scope.boardviewsrc = "/assets/partials/boardview.html";
  	$scope.topnavviewsrc = "/assets/partials/topnavview.html";
  	$scope.bottomnavviewsrc = "/assets/partials/bottomnavview.html";

  	$scope.createboarddata = {name: ""}

  	$scope.boardlist = {data: []};

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
  			location.reload();
		})
		.error(function(err)
		{
  			deleteAllCookiesOnFail();
  			location.reload();
		});
  	};

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
			})
			.error(function(err)
			{
  				// deleteAllCookiesOnFail($cookies);
  				// location.reload();
			});
  		}
  	}



  	//$scope.buildBoardListData();
}]);

$(document).ready(function()
{
	console.log(email);
  	console.log(userid);
  	console.log(token);
});