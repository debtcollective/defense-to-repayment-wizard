
// Google spreadsheet URL
var public_spreadsheet_url = 'https://docs.google.com/spreadsheets/d/18kOeUM3aN2c-W9Q2MF2lChKifCRX7GW4LHN_KiBXzfU/pubhtml';

var screen_width = $(window).width();

var school_page = 5;		// first page of school section
var experience_page = 7; 	// first page of experience section
var currentSection;

// remap jQuery to $
(function($){

	// parse JSON from tabletop.js

	function init() {
	    Tabletop.init( {
	    	key: public_spreadsheet_url,
	        callback: showInfo,
	    });
	}

    function showInfo(data, tabletop) {

    	// list of schools
		var schools_source = $('#schools-list').html();
		var schools_template = Handlebars.compile(schools_source);

        $.each( tabletop.sheets("Schools").all(), function(index,element) {
			var html = schools_template(element);
			$("#schools-select").append(html);
		});

		$("#schools-select").chosen({ width: "50%" }).on("change", function() {
			$(".school-name").html( $(this).val() );
		});

    }

    // pad with leading 0
    function zeroFill( number, width ) {
	  width -= number.toString().length;
	  if ( width > 0 )
	  {
	    return new Array( width + (/\./.test( number ) ? 2 : 1) ).join( '0' ) + number;
	  }
	  return number + ""; // always return a string
	}


	// show the appropriate page of the form
	function getPage() {
		var hash = window.location.hash;

		// change question state
		if (hash) {
			$("body").attr("id", "body" + hash.substring(5));
			$("section.active").removeClass("active");
			$("section" + hash).addClass("active");
		}

		// change nav state
		$("footer nav li.active").removeClass("active");
		$("footer nav li#nav" + hash.substring(5)).addClass("active");

		// update nav links
		var currentPage = parseInt(hash.substring(5));
		var nextPage = zeroFill(currentPage + 1, 2);
		var prevPage = zeroFill(currentPage - 1, 2);
		$("footer #next").attr("href", "#page" + nextPage);
		$("footer #previous").attr("href", "#page" + prevPage);

		// determine current section
		if (currentPage < school_page)
			currentSection = "school";
		else if (currentPage >= school_page && currentPage < experience_page)
			currentSection = "experience";
		else
			currentSection = "personal";

		// update "steps" nav
		$("nav#steps li.active").removeClass("active");
		$("nav#steps li#" + currentSection).addClass("active");


		// initialize chosen plugin for <select>s
		if (hash && $(hash + " select.chosen").length
			// make sure it's not the schools list
			&& currentPage != 5) {

			// some may need custom widths
			var ch_width = null;
			if (currentPage == 1 && screen_width > 480)
				ch_width = "33%";

			$(hash + " select.chosen").chosen({ width: ch_width });
		}
	}

	$(document).ready(function (){

		// toggle "explain" textarea field when box is checked
		$('input[type="checkbox"]').click(function() {
		    $(this).parent().find(".explain").toggle(this.checked);
		});


		// employment question

		$("#employment-status input[name='employed']").on("change", function() {
			var input = $("#employment-status input[name='employed']")[0];
			if (input.checked) {
				$("#body03 #next").attr("href", "#page03");

				$("#next").click( function() {
					$("#employment-type").show();
					$("#employment-status").hide();

					// let them move on to page 04
					window.setTimeout( function() {
						$("#body03 #next").attr("href", "#page04");
					}, 300);
				});
			}
		});
	
	});


	$(window).on( 'hashchange', getPage );

	
	$(window).load(function() {
		init();

		screen_width = $(window).width();

		getPage();
	});
	
	$(window).resize(function() {
		
	});
	
	

})(window.jQuery);