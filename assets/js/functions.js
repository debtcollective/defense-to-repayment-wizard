
// Google spreadsheet URL
var public_spreadsheet_url = 'https://docs.google.com/spreadsheets/d/18kOeUM3aN2c-W9Q2MF2lChKifCRX7GW4LHN_KiBXzfU/pubhtml';

var screen_width = $(window).width();

var school_first_page = 		5;	// first page of school section
var experience_first_page = 	7; 	// first page of experience section

var current_section, total_pages, school_pages, experience_pages, personal_pages;
var section_page = 1;

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

		// update nav links
		var current_page = parseInt(hash.substring(5));
		var next_page = zeroFill(current_page + 1, 2);
		var prev_page = zeroFill(current_page - 1, 2);
		$("footer #next").attr("href", "#page" + next_page);
		$("footer #previous").attr("href", "#page" + prev_page);

		// determine current section
		if (current_page < school_first_page){
			current_section = "personal";
			section_page = 1;
			section_pages = personal_pages;
		}
		else if (current_page >= school_first_page && current_page < experience_first_page) {
			current_section = "school";
			section_page = school_first_page;
			section_pages = school_pages;
		}
		else {
			current_section = "experience";
			section_page = experience_first_page;
			section_pages = experience_pages;
		}

		console.log(section_pages);

		// update "steps" nav
		$("nav#steps li.active").removeClass("active");
		$("nav#steps li#" + current_section).addClass("active");

		// build bottom nav
		var li = '<li id="nav01"><a href="#page01">1</a></li>';
		$("nav#pages ol").children().remove();

		for(var i = 0; i < section_pages; i++) {
			$("nav#pages ol").append(li);
			$("nav#pages li").last().attr("id", "nav" + zeroFill(section_page + i, 2));
			$("nav#pages li").last().find("a").attr("href", "#page" + zeroFill(section_page + i, 2)).text(i+1);
		}

		// change nav state
		$("nav#pages li#nav" + hash.substring(5)).addClass("active");


		// initialize chosen plugin for <select>s
		if (hash && $(hash + " select.chosen").length
			// make sure it's not the schools list
			&& current_page != 5) {

			// some may need custom widths
			var ch_width = null;
			if (current_page == 1 && screen_width > 480)
				ch_width = "33%";

			$(hash + " select.chosen").chosen({ width: ch_width });
		}
	}

	$(document).ready(function (){

		// toggle "explain" textarea field when box is checked
		$('input[type="checkbox"]').click(function() {
		    $(this).parent().find(".explain").toggle(this.checked);
		});


		// how many pages total?
		total_pages = 		$("section").length - 1;
		personal_pages = 	school_first_page - 1;
		experience_pages = 	total_pages - experience_first_page + 1;
		school_pages = 		experience_first_page - school_first_page;

		// make steps nav work
		$("nav#steps li#school a").attr("href", "#page" + zeroFill(school_first_page, 2));
		$("nav#steps li#experience a").attr("href", "#page" + zeroFill(experience_first_page, 2));

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


		$(window).on( 'hashchange', getPage );
	
	});

	
	$(window).load(function() {
		init();

		screen_width = $(window).width();

		getPage();
	});
	
	$(window).resize(function() {
		
	});
	
	

})(window.jQuery);