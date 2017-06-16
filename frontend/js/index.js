/*
 * Javascript for the index.html file
 */

// Side bar animation
$("#sidebarButton").click(function(e) {
    e.preventDefault();
    $("#wrapper").toggleClass("toggled");
    if($("#sidebarButton").text() == "<"){
      $("#sidebarButton").html(">");
    } else {
      $("#sidebarButton").html("<");
    }
});
