var myApp = angular.module('Stuteboards',['ngCookies']);

var userid = "";
var token = "";

function softLogin(_$cookies)
{
	var cookies = _$cookies.getAll();
	var i = 0;
	var res = {userid: "", token: "", present: false}
	angular.forEach(cookies, function (v, k) 
	{
		if (i <= 0)
		{
			res.userid = k;
			res.token = _$cookies.get(k);
			res.present = true;
		}
	});
	return res;
}

myApp.controller('LoginController', ['$scope', '$http', '$cookies', function($scope, $http, $cookies) 
{
  	$scope.registered = false;
  	$scope.confirmed = false;
  	//do login validation here, change variables if necessary
  	if (softLogin($cookies).present == true)
  	{
  		$scope.registered = true;
  		$scope.confirmed = true;
  		var temp = softLogin($cookies);
  		userid = "userid: " + temp.userid;
  		token = "token: " + temp.token;
  	}

  	$scope.loginsrc = "/assets/partials/login.html";
  	$scope.confirmationsrc = "/assets/partials/confirmation.html";
  	$scope.authorizedsrc = "/assets/partials/base.html";
  	$scope.loginformdata = {email:"",password:""};
  	$scope.registrationformdata = {email:"",password:"",conpassword:""};
  	$scope.confirmformdata = {email:"",code:""};

	$scope.saveCookieData = function(_userid, _token)
	{
		$cookies.put(_userid,_token);
	}

	$scope.deleteAllCookies = function()
	{
		var cookies = $cookies.getAll();
		angular.forEach(cookies, function (v, k) 
		{
    		$cookies.remove(k);
		});
	}

  	// Login into Acount
  	$scope.verifyAndLogin = function() 
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
  			$scope.saveCookieData(data.id, data.token);
  			userid = data.id;
  			token = data.token;
		})
		.error(function(err)
		{
  			console.log(err);
		});
  	};

  	// Register New Account
  	$scope.verifyAndRegister = function() 
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
  	$scope.verifyAndConfirm = function() 
  	{
  		var submitdata = {email:"",code:""};
  		if ($scope.confirmformdata.email && $scope.confirmformdata.code) 
  		{
        	submitdata.email = $scope.confirmformdata.email;
        	submitdata.code = $scope.confirmformdata.code;
    	}
		$http.post("/rest/registration/code", submitdata)
		.success(function(data)
		{
			var submitdatatemp = {email:"",password:""};
			console.log($scope.registrationformdata.email);
			console.log($scope.registrationformdata.password);
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
  				$scope.saveCookieData(data.id, data.token);
  				userid = data.id;
  				token = data.token;
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
		console.log("done");
  	};
}]);

myApp.controller('BoardController', ['$scope', '$http', '$cookies', function($scope, $http, $cookies) 
{
  	$scope.authorizedsrc = "/assets/partials/base.html";
  	$scope.boardviewsrc = "/assets/partials/boardview.html";
}]);

$(document).ready(function()
{
  
});