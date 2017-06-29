/*
 * Javascript for the index.html file
 */

$(document).ready(function() {
	$(document).on('click', '.open', function(event){
		$(this).addClass('oppenned');
		event.stopPropagation();
	})
	$(document).on('click', 'body', function(event) {
		$('.open').removeClass('oppenned');
	})
	$(document).on('click', '.cls', function(event){
		$('.open').removeClass('oppenned');
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
