
// Google spreadsheet URL
var public_spreadsheet_url = 'https://docs.google.com/spreadsheets/d/18kOeUM3aN2c-W9Q2MF2lChKifCRX7GW4LHN_KiBXzfU/pubhtml';

var screen_width = $(window).width();

var school_first_page = 		5;	// first page of school section
var experience_first_page = 	8; 	// first page of experience section

var current_section, total_pages, school_pages, experience_pages, personal_pages, state_laws;
var section_page = 1;

// did the user's school shut down?
var shutdown = false;

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

		// save state data
		state_laws = tabletop.sheets("State Laws").all();
    }

    function getStateLaw(state) {

    	// filter state laws table for the selected state
    	var state_law = state_laws.filter( function(item){return (item.State==state);} );

    	// fill hidden input with state law text
		$("input[name='state_law']").attr("value", state_law[0].Law);
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

	$('#dtr-form').submit(function(event) {
		var data = $(this).serializeObject()
		$.ajax({
			method: 'POST',
			url: '/corinthian/dtr_generate',
			data: data,
			success: function (data) {
				window.location.hash = '#page17'
				$('#pdf-view').attr('src', data['pdf_link'])
			},
			error: function (data) {
				console.log(data)
			}
		})
	  event.preventDefault();
	});


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

		// skip shutdown page if the school didn't shut down
		if (!shutdown && next_page == 11)
			$("footer #next").attr("href", "#page" + zeroFill(current_page + 2, 2));
		else if (!shutdown && prev_page == 11)
			$("footer #previous").attr("href", "#page" + zeroFill(current_page - 2, 2));

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

		// update "steps" nav
		$("nav#steps li.active").removeClass("active");
		$("nav#steps li#" + current_section).addClass("active");

		// build bottom nav
		var li = '<li id="nav01"><a href="#page01">1</a></li>';
		$("nav#pages ol").children().remove();

		var j;
		for(var i = 0; i < section_pages; i++) {
			j = i;
			if (!shutdown && section_page + i == 11)
				i++
			else if (!shutdown && section_page + i > 11)
				j--
			$("nav#pages ol").append(li);
			$("nav#pages li").last().attr("id", "nav" + zeroFill(section_page + i, 2));
			$("nav#pages li").last().find("a").attr("href", "#page" + zeroFill(section_page + i, 2)).text(j+1);
		}

		// change nav state
		$("nav#pages li#nav" + hash.substring(5)).addClass("active");

		// validate the form before letting the user move on
		$("nav a").click( function(e) {
			var isValid = $("form").valid();
			if (!isValid)
				e.preventDefault();
		});


		// initialize chosen plugin for <select>s
		if (hash && $(hash + " select.chosen").length
			// make sure it's not the schools list
			&& current_page != school_first_page) {

			// some may need custom widths
			var ch_width = null;
			if (current_page == 1 && screen_width > 480)
				ch_width = "33%";

			$(hash + " select.chosen").chosen({ width: ch_width, disable_search_threshold: 12 });
		}
	}

	// combine two questions from the wizard into one form field to send to the PDF
	function combineValues(question1, question2, combined) {

		$("input[name='"+question1+"_check'], input[name='"+question2+"_check']").on("change", function() {
			var isChecked = $(this).val();
			if (isChecked)
				$("input[name='"+combined+"_check']").attr("value", "true");
		});

		$("textarea[name='"+question1+"'], textarea[name='"+question2+"']").on("change", function() {
			var combined_vals = $("textarea[name='"+question1+"']").val() + " " + $("textarea[name='"+question2+"']").val();
			$("input[name='"+combined+"']").val(combined_vals);
		});
	}

	$(document).ready(function (){

		// toggle "explain" textarea field when box is checked
		$('.checkbox input').click(function() {
		    $(this).parent().parent().find(".explain").toggle(this.checked);
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

		$("#employment-status input[type='radio']").on("change", function() {
			var input = $("#employment-status input[value='true']")[0];
			if (input.checked) {
				$("#employment-type").show();
			}
			else {
				$("#employment-type").hide();
			}
		});

		// school closing question

		$("input[name='school-close']").on("change", function() {
			var input = $("#school-close input[value='false']")[0];
			if (input.checked)
				$("#withdraw").show();
			else
				$("#withdraw").hide();
		});

		$("input[name='school-close'], input[name='withdraw']").on("change", function() {
			if ($("input[name='school-close']:checked").val() == "true" || $("input[name='withdraw']:checked").val() == "true")
				shutdown = true;
			else
				shutdown = false;
		});

		// update state law based on state <select>
		$("select[name='state']").on("change", function() {
			var state = $(this).val();
			getStateLaw(state);
		});

		// show the correct page on hash change
		$(window).on( 'hashchange', getPage );

		// combine values from two wizard fields into one PDF field
		combineValues("misleading_job_assistance_1", "misleading_job_assistance_2", "misleading_job_assistance");
		combineValues("misleading_accreditation_1", "misleading_job_accreditation_2", "misleading_job_accreditation");


		// jquery.validate

		// don't ignore chosen
		$.validator.setDefaults({ ignore: ":hidden:not(.active select)" })

		$("form").validate({
			messages: {
				ssn_3: "A valid Social Security Number is required to submit the form.",
				name: "Please enter your name.",
				address: "Please enter your address.",
				city: "Please enter your city.",
				state: "Please enter your state.",
				zip: "Please enter your zip code.",
				phone_primary_3: "Please enter a valid phone number, or you may leave it blank.",
				email: "Please enter a valid email address, or you may leave it blank.",
				agreement: "You must check this box in order to submit the form and contest your loans.",
				attendance_from_year: "Please enter a start date.",
				attendance_to_year: "Please enter an end date.",
			},
			groups: {
			    ssn: "ssn_1 ssn_2 ssn_3",
			    phone_primary: "phone_primary_1 phone_primary_2 phone_primary_3",
			    phone_secondary: "phone_secondary_1 phone_secondary_2 phone_secondary_3"
			},
			errorPlacement: function(error, element) {
			    if (element.attr("type") == "radio" || element.attr("type") == "checkbox" )
			    	error.insertAfter(".input-group:last-of-type");
			    else if (element.attr("name") == "ssn_1" || element.attr("name") == "ssn_2" )
			    	error.insertAfter("input[name='ssn_3']");
			    else if (element.attr("name") == "phone_primary_1" || element.attr("name") == "phone_primary_2" )
			    	error.insertAfter("input[name='phone_primary_3']");
			    else if (element.attr("name") == "phone_secondary_1" || element.attr("name") == "phone_secondary_2" )
			    	error.insertAfter("input[name='phone_secondary_3']");
			    else if (element.attr("name") == "attendance_from_year" || element.attr("name") == "attendance_to_year" )
			    	error.insertAfter("#attendance-to");
			    else if (element.hasClass("chosen"))
			    	error.insertAfter(".chosen-container")
			    else
			    	error.insertAfter(element);
			},
		});

		// fill the "today's date" field for the signature!
		var today = new Date();
		var d = today.getDate();
		var m = today.getMonth()+1; //January is 0!
		var yyyy = today.getFullYear();

		today = m+'/'+d+'/'+yyyy;
		$("input[name='date_today']").attr("value", today);
	});


	$(window).load(function() {
		init();

		screen_width = $(window).width();

		getPage();
	});

	$(window).resize(function() {

		screen_width = $(window).width();

	});

	$.fn.serializeObject = function()
	{
	    var o = {};
	    var a = this.serializeArray();
	    $.each(a, function() {
	        if (o[this.name] !== undefined) {
	            if (!o[this.name].push) {
	                o[this.name] = [o[this.name]];
	            }
	            o[this.name].push(this.value || '');
	        } else {
	            o[this.name] = this.value || '';
	        }
	    });
	    return o;
	};

})(window.jQuery);