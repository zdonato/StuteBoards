var myApp = angular.module('Stuteboards',[]);

function redirectTo(_path)
{
	//change path to _path
	console.log(_path);
}

myApp.controller('LoginController', ['$scope', '$http', function($scope, $http) 
{
  $scope.loggedin = false;
  $scope.codeduser = false;
  //do login validation here, change variables if necessary
  $scope.loginsrc = "/assets/partials/login.html";
  $scope.confirmationsrc = "/assets/partials/confirmation.html";
  $scope.loginformdata = {email:"",password:""};
  $scope.registrationformdata = {email:"",password:"",conpassword:""};
  $scope.confirmformdata = {email:"",code:""};

  // Login into Acount
  $scope.verifyAndLogin = function() 
  {
  	var submitdata = {email:"", password:""};
  	if ($scope.loginformdata.email && $scope.loginformdata.password) 
  	{
        submitdata.email = $scope.loginformdata.email;
        submitdata.password = $scope.loginformdata.password;
    }
	// $http.post("/rest/registration", submitdata)
	//redirect to authorized pages!

	//if successful, change logged in to true
	alert("done with login");
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
  		redirectTo("CONFIRMATION PATH HERE");
	})
	.error(function(err)
	{
  		console.log(err);
	});
	//if successful, change logged in to true
	alert("done with registration");
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
  		redirectTo("LOGIN PAGE TO LOGIN WITH CREDENTIALS");
	})
	.error(function(err)
	{
  		console.log(err);
	});
	//if successful, change codeduser to true
	alert("done with confirm");
  };

}]);

$(document).ready(function()
{
  
});