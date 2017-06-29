/*
 * Javascript for the index.html file
 */

$(document).ready(function() {
	$(document).on('click', '.side-open', function(event){
		$(this).addClass('sideOpenned');
		event.stopPropagation();
	})
	$(document).on('click', 'body', function(event) {
		$('.side-open').removeClass('sideOpenned');
	})
	$(document).on('click', '.cls', function(event){
		$('.side-open').removeClass('sideOpenned');
		event.stopPropagation();
	});

	$('#yearRange').slider({
		id: "yearRange",
		min: 1880,
		max: 2017,
		range: true,
		value: [1900, 1980],
		tooltip: 'always',
		formatter: function(value) {
			return 'Current value: ' + value;
		}
	});
});
