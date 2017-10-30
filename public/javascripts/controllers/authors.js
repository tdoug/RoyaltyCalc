app.controller('authors', function($scope, $http, $window) {

	$scope.alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
	
	$scope.load_authors = function()
	{
        $http.post("/api/authors/get_all_statuses", {quarter:$scope.quarter, year:$scope.year}).success(function(author_statuses)
        {
    		$http.post("/api/authors/list").success(function (response) {
    			$scope.these_authors = response;

                for(author in $scope.these_authors)
                {
                    $scope.these_authors[author].status_class = "glyphicon glyphicon-remove";
                    $scope.these_authors[author].button_class = "btn-danger";

                    for(status in author_statuses) ///set statuses
                    {
                        if(author_statuses[status].author_uid == $scope.these_authors[author].uid)
                        {
                            if(author_statuses[status].show_author_flag == 1)
                            {
                                $scope.these_authors[author].status_class = "glyphicon glyphicon-ok";
                                $scope.these_authors[author].button_class = "btn-success";
                            }        
                        }
                    }
                }
                $scope.data_loading = true;
    		});
        });

        $scope.load_providers();
	};
    $scope.load_providers = function()
    {       
        $http.post("/api/providers/list").success(function (response) {
            $scope.providers = response;                        
        }); 
    };
    $scope.change_author_status = function(author)
    {
        var author_uid = author.uid;
        $http.post("/api/authors/change_status", {author_uid:author_uid, quarter:$scope.quarter, year:$scope.year})
        .success(function (response) {
            if(response.author_status == 1)
            {
                author.status_class = 'glyphicon glyphicon-ok';
                author.button_class = 'btn-success';
            }
            else
            {
                author.status_class = 'glyphicon glyphicon-remove';
                author.button_class = 'btn-danger';
            }
        });
    };
    $scope.load_provider_totals = function(author_uid)
    {
        for(this_provider in $scope.providers)
        {
            $http.post("/api/authors/get_provider_total", {author_uid:author_uid, provider:$scope.providers[this_provider].id, quarter:$scope.quarter, year:$scope.year})
            .success(function(totals){
                for(total in totals)
                {
                	for(author in $scope.these_authors)
                	{
                		if($scope.these_authors[author].uid == author_uid)
                		{
                			if($scope.these_authors[author].royalty_totals == undefined)
                				$scope.these_authors[author].royalty_totals = {};

                			if(totals[total].total_royalty == undefined)
                				totals[total].total_royalty = 0;
                			else
                				totals[total].total_royalty = parseFloat(totals[total].total_royalty).toFixed(2);

                			$scope.these_authors[author].royalty_totals[totals[total].provider_id] = totals[total].total_royalty;
                		    $scope.these_authors[author].show_totals = 1;  	
                		} 
                	}
                }
            });
        }
    };
    $scope.open_pdf = function(author_uid)
    {
        var vendor_pdf_view_url = "http://www.vendor.com/user/open_pdf/";
        var quarter = $scope.quarter.replace("Q","");
        $window.open(vendor_pdf_view_url+author_uid+"/"+quarter+"/"+$scope.year);
    };
    $scope.unapprove_all = function()
    {
        var author_uid;
        $scope.setMsg("Unapproving all PDFs...");
                   
        $http.post("/api/authors/unapprove_all", {quarter:$scope.quarter, year:$scope.year}).success(function(res){
            for(author in $scope.these_authors)
            {
                $scope.these_authors[author].status_class = 'glyphicon glyphicon-remove';
                $scope.these_authors[author].button_class = 'btn-danger';
            }        

            $scope.setMsg("All PDFs Unapproved");

        }); 
    };
    $scope.approve_all = function()
    {
        var author_uid;
        $scope.setMsg("Approving all PDFs...");
        for(author in $scope.these_authors)
        {
            author_uid = $scope.these_authors[author].uid;
            $http.post("/api/authors/change_status", {author_uid:author_uid, quarter:$scope.quarter, year:$scope.year, force_status: "approve"}).success(function(res){
                
            });

            $scope.these_authors[author].status_class = 'glyphicon glyphicon-ok';
            $scope.these_authors[author].button_class = 'btn-success';
        }
        $scope.setMsg("All PDFs Approved");
    };
    $scope.generate_all_approved = function()
    {
        var quarter = $scope.quarter.replace("Q","");
        var key = "dummyKey";
        var url = 'http://65.61.164.146/generate_all_pdfs/'+quarter+'/'+$scope.year+'/'+key;

        $scope.setMsg("Generating PDFs for approved authors...");

        $http({url:url, method:'POST', header: {'content-type':'application/text'}}).success(function(res){            
            $scope.setMsg(res.msg);
        });
    };
    $scope.download_reports_zip = function()
    {
        var quarter = $scope.quarter.replace("Q","");
        var key = "dummyKey";
        var url = 'http://65.61.164.146/generate_pdf_zip/'+quarter+'/'+$scope.year+'/'+key;
        $window.location = url;
    };
});

app.filter('firstLetter', function () {
    return function (input, letter) {
        input = input || [];
        var out = [];
        input.forEach(function (item) {
            //console.log("current item is", item, item.charAt(0));
            if (item.charAt(0).toLowerCase() == letter) {
                out.push(item);
            }
        });
        return out;
    }
});