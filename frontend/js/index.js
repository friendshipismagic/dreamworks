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
});
