var app = angular.module('royalty3',[]);

app.controller('globalroyal', function($scope, $http, $timeout) {

	$scope.quarter = localStorage.getItem('royaltyPeriodQuarter');
	$scope.year = localStorage.getItem('royaltyPeriodYear');
	
	$scope.setPeriod = function()
	{			
		localStorage.setItem('royaltyPeriodYear', $scope.year);
		localStorage.setItem('royaltyPeriodQuarter', $scope.quarter);
		$scope.setMsg('The active period has been changed.');	
	};

	$scope.setMsg = function(msg, no_hide, this_class)
	{
		no_hide = typeof no_hide !== 'undefined' ? no_hide : 0;

		$scope.messages = msg;
		$scope.messages_class = this_class;

		var audio = new Audio('sounds/prompt.mp3');
		audio.play();	 

		//if(no_hide == 0)
		//	$scope.hideStuff();
	};

	$scope.hideStuff = function () {
	
		$timeout(function(){        
	        $scope.startFade = true;
	        $scope.fadeclass = 'fade';
	         $timeout(function(){
	        	$scope.messages = '';
	        	$scope.startFade = false;
	        	$scope.hidden = false;
	        	$scope.fadeclass = '';
	        	$scope.msgStyle = {};	
	        }, 2100);
	    }, 5000);       
    };
});