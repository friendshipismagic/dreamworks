//Charte graphique
// bleu clair #5894E3
// bleu foncé #2238CC
// jaune mimosa #F2CC0C
// police #111B63


/* bubbleChart creation function. Returns a function that will
 * instantiate a new bubble chart given a DOM element to display
 * it in and a dataset to visualize.
 *
 * Organization and style inspired by:
 * https://bost.ocks.org/mike/chart/
 *
 */


// State of the view: grouped view, or ordered by years
var currentView;
var subcollectionsNumber = 17;

function bubbleChart() {

  // Constants for sizing
  var width = 940;
  var height = 600;
  var smallRadius = 2;
  var mediumRadius = 8;

  // Tooltip for mouseover functionality
  var tooltip = floatingTooltip('gates_tooltip', 240);

  // View mode
  var groupedView = "all";
  var yearOrderedView = "year";
  var genderOrderedView = "gender";
  var subcollectionOrderedView = "subcollection";

  // Locations to move bubbles towards, in grouped view mode.
  var center = { x: width / 2, y: height / 2 };

  // Used when setting up force and moving around nodes
  var damper = 0.102;

  // These will be set in create_nodes and create_vis
  var svg = null;
  var bubbles = null;
  var nodes = [];

  /*Charge function that is called for each node.
  Charge is proportional to the diameter of the circle (which is stored in the
  radius attribute of the circle's associated data.
  This is done to allow for accurate collision detection with nodes of
  different sizes.
  Charge is negative because we want nodes to repel.
  Dividing by 8 scales down the charge to be appropriate for the visualization
  dimensions.
  */
  function charge(d) {
    return -Math.pow(d.radius, 2.0) / 8;
  }

  /*Here we create a force layout and configure it to use the charge function
  from above. This also sets some contants to specify how the force layout should
  behave.
  More configuration is done below.
  */
  var force = d3.layout.force()
    .size([width, height])
    .charge(charge)
    .gravity(-0.01)
    .friction(0.9);


  // Nice looking colors - no reason to buck the trend
  var fillColor = d3.scale.ordinal()
    .domain(['low', 'medium', 'high'])
    .range(['#F2CC0C', '#2238CC', '#5894E3']);

  // Sizes bubbles based on their selected status
  function radiusScale(d){
    var dreamData = d;
    var resultRadius = mediumRadius;
    var currentButton;
    // Verify that the gender and dataset are selected
    var buttons = d3.selectAll('.selectButton')
        .each(function(d) {
            currentButton = d3.select(this);
            if (!currentButton.classed("selecting")){
              var buttonID = currentButton.attr('id');
              if (dreamData.gender == buttonID || dreamData.dataset == buttonID){
                resultRadius = smallRadius;
              }
            }
         });
    // Verify that the age and date are within the range
    //TODO: put one input only to set the range so that the max is not onferior to the min

    var dateRange = d3.select('#yearMin').node().value;
    dreamYear = +dreamData.date.substring(0, 4);
    if(dreamYear<dateRange) resultRadius = smallRadius;
        
    dateRange = d3.select('#yearMax').node().value;
    if(dreamYear>dateRange) resultRadius = smallRadius;

    return resultRadius;
  }

  // Resize a bubble according to selectors
  function resizeBubble() {
    return function (d) {
      d.radius = radiusScale(d);
    };
  }


  /*
   * This data manipulation function takes the raw data from
   * the CSV file and converts it into an array of node objects.
   * Each node will store data and visualization values to visualize
   * a bubble.
   *
   * rawData is expected to be an array of data objects, read in from
   * one of d3's loading functions like d3.csv.
   *
   * This function returns the new node array, with a node in that
   * array for each element in the rawData input.
   */
  function createNodes(rawData) {
    /*Use map() to convert raw data into node data.
    Checkout http://learnjsdata.com/ for more on
    working with data.
    */
    var myNodes = rawData.map(function (d) {
      return {
        radius: mediumRadius,
        text: d.text,
        date: d.date,
        gender: d.gender,
        dataset: d.dataset,
        title: d.title,
        x: Math.random() * 900,
        y: Math.random() * 800
      };
    });

    // sort them to prevent occlusion of smaller nodes.
    myNodes.sort(function (a, b) { return b.radius - a.radius; });

    return myNodes;
  }

  /*
   * Main entry point to the bubble chart. This function is returned
   * by the parent closure. It prepares the rawData for visualization
   * and adds an svg element to the provided selector and starts the
   * visualization creation process.
   *
   * selector is expected to be a DOM element or CSS selector that
   * points to the parent element of the bubble chart. Inside this
   * element, the code will add the SVG container for the visualization.
   *
   * rawData is expected to be an array of data objects as provided by
   * a d3 loading function like d3.csv.
   */
  var chart = function chart(selector, rawData) {

    nodes = createNodes(rawData);
    // Set the force's nodes to our newly created nodes array.
    force.nodes(nodes);

    // Create a SVG element inside the provided selector with desired size.
    svg = d3.select(selector)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // Bind nodes data to what will become DOM elements to represent them.
    bubbles = svg.selectAll('.bubble')
      .data(nodes);

    /*Create new circle elements each with class `bubble`.
    There will be one circle.bubble for each object in the nodes array.
    Initially, their radius (r attribute) will be 0.
    */
    bubbles.enter().append('circle')
      .classed('bubble', true)
      .attr('r', 0)
      .attr('fill', function (d) { return fillColor('medium'); })
      .attr('stroke', function (d) { return d3.rgb(fillColor('medium')).darker(); })
      .attr('stroke-width', 2)
      .on('mouseover', showDetail)
      .on('mouseout', hideDetail);

    // Fancy transition to make bubbles appear, ending with the
    // correct radius
    bubbles.transition()
      .duration(2000)
      .attr('r', function (d) { return radiusScale(d); });

    // Set initial layout to single group.
    currentView = groupedView;
    groupBubbles();
  };

  /*
   * Sets visualization in "single group mode".
   * The year labels are hidden and the force layout
   * tick function is set to move all nodes to the
   * center of the visualization.
   */
  function groupBubbles() {
    force.on('tick', function (e) {
      bubbles.each(moveToCenter(e.alpha))
        .attr('cx', function (d) { return d.x; })
        .attr('cy', function (d) { return d.y; });
    });
    force.start();
  }

  /*
   * Helper function for "single group mode".
   * Returns a function that takes the data for a
   * single node and adjusts the position values
   * of that node to move it toward the center of
   * the visualization.
   *
   * Positioning is adjusted by the force layout's
   * alpha parameter which gets smaller and smaller as
   * the force layout runs. This makes the impact of
   * this moving get reduced as each node gets closer to
   * its destination, and so allows other forces like the
   * node's charge force to also impact final location.
   */
  function moveToCenter(alpha) {
    return function (d) {
      d.x = d.x + (center.x - d.x) * damper * alpha;
      d.y = d.y + (center.y - d.y) * damper * alpha;
    };
  }

  /*
   * Sets visualization in "split by year mode".
   * The force layout tick function is set to move nodes to the
   * yearCenter of their data's year.
   */
  function splitBubblesYears() {
    force.on('tick', function (e) {
      bubbles.each(moveToYears(e.alpha))
        .attr('cx', function (d) { return d.x; })
        .attr('cy', function (d) { return d.y; });
    });

    force.start();
  }

  /*
   * Sets visualization in "split by gender mode".
   * The force layout tick function is set to move nodes to the
   * genderCenter of their dreamers gender.
   */
  function splitBubblesGender() {
    force.on('tick', function (e) {
      bubbles.each(moveToGender(e.alpha))
        .attr('cx', function (d) { return d.x; })
        .attr('cy', function (d) { return d.y; });
    });

    force.start();
  }

  /*
   * Sets visualization in "split by gender mode".
   * The force layout tick function is set to move nodes to the
   * genderCenter of their dreamers gender.
   */
  function splitBubblesSubcollection() {
    force.on('tick', function (e) {
      bubbles.each(moveToSubcollection(e.alpha))
        .attr('cx', function (d) { return d.x; })
        .attr('cy', function (d) { return d.y; });
    });

    force.start();
  }

  /*
   * Helper function for "split by year mode".
   * Returns a function that takes the data for a
   * single node and adjusts the position values
   * of that node to move it the year center for that
   * node.
   *
   * Positioning is adjusted by the force layout's
   * alpha parameter which gets smaller and smaller as
   * the force layout runs. This makes the impact of
   * this moving get reduced as each node gets closer to
   * its destination, and so allows other forces like the
   * node's charge force to also impact final location.
   */

  function moveToYears(alpha) {
    return function (d) {
      var yeard = +d.date.substring(0, 4);
      // Custom function fitted to the view
      // 1890 and 2020 are rough extrema for the years range of our data
      // 230 is the left margin
      // 4/9 is an ad hoc parameter for the view to fit the screen
      var targetX = 230 + (yeard-1890)/(2020-1890) * width * 4/9;
      var targetY = height/2;

      d.x = d.x + (targetX - d.x) * damper * alpha * 1.1;
      d.y = d.y + (targetY - d.y) * damper * alpha * 1.1;
    };
  }

  /*
   * Helper function for "split by gender mode".
   * Returns a function that takes the data for a
   * single node and adjusts the position values
   * of that node to move it the gender center for that
   * node.
   *
   * Positioning is adjusted by the force layout's
   * alpha parameter which gets smaller and smaller as
   * the force layout runs. This makes the impact of
   * this moving get reduced as each node gets closer to
   * its destination, and so allows other forces like the
   * node's charge force to also impact final location.
   */

  function moveToGender(alpha) {
    return function (d) {
      var gender = d.gender;
      // Custom function fitted to the view
      var targetX = width/3;
      if (gender == "male")
          targetX = width*2/3;
      var targetY = height/2;

      d.x = d.x + (targetX - d.x) * damper * alpha * 1.1;
      d.y = d.y + (targetY - d.y) * damper * alpha * 1.1;
    };
  }

  /*
   * Helper function for "split by subcollection mode".
   * Returns a function that takes the data for a
   * single node and adjusts the position values
   * of that node to move it the subcollection center for that
   * node.
   *
   * Positioning is adjusted by the force layout's
   * alpha parameter which gets smaller and smaller as
   * the force layout runs. This makes the impact of
   * this moving get reduced as each node gets closer to
   * its destination, and so allows other forces like the
   * node's charge force to also impact final location.
   */

  function moveToSubcollection(alpha) {
    return function (d) {
      var subcollection = d.dataset;
      // Custom function fitted to the view
      var targetX = 320;
      var targetY = height/2;
      var button;
      var breakLoop = false;

      var subcollections = d3.select('#sidemenu')
        .selectAll('.subcollectionSelect');
      for (var i = 0; i <= subcollections[0].length - 1; i++) {
        button = d3.select(subcollections[0][i]);
        if(subcollection == button.attr('id'))
        {
          breakLoop = true;
          // Custom function fitted to the view
          // 320 is the left margin in pixels
          // 1/3 is an ad hoc parameter so the view fits the screen
          targetX = 320 + width*i/subcollectionsNumber * 1/3;
        }
        if (breakLoop) break;
      }
      d.x = d.x + (targetX - d.x) * damper * alpha * 1.1;
      d.y = d.y + (targetY - d.y) * damper * alpha * 1.1;
    };
  }

  /*
   * Function called on mouseover to display the
   * details of a bubble in the tooltip.
   */
  function showDetail(d) {
    // change outline to indicate hover state.
    d3.select(this).attr('stroke', 'black');

    var content = '<span class="name">Title: </span><span class="value">' +
                  d.title +
                  '</span><br/>' +
                  '<span class="name">Dataset: </span><span class="value">' +
                  d.dataset +
                  '</span><br/>' +
                  '<span class="name">Date: </span><span class="value">' +
                  d.date +
                  '</span>';
    tooltip.showTooltip(content, d3.event);
  }

  /*
   * Hides tooltip
   */
  function hideDetail(d) {
    // reset outline
    d3.select(this)
      .attr('stroke', d3.rgb(fillColor('medium')).darker());

    tooltip.hideTooltip();
  }

  /*
   * Externally accessible function (this is attached to the
   * returned chart function). Allows the visualization to toggle
   * between "single group" and "split by year" modes.
   *
   * displayName is expected to be a string and either 'year' or 'all'.
   */
  chart.toggleDisplay = function (displayName) {
    if (displayName === yearOrderedView)
      splitBubblesYears();
    else if (displayName === genderOrderedView)
      splitBubblesGender();
    else if (displayName === subcollectionOrderedView)
      splitBubblesSubcollection();
    else
      groupBubbles();
  };

  /*
   * Externally accessible function (this is attached to the
   * returned chart function). Allows the visualization to make unselected
   * node categories to be less highleted
   * categoryName is expected to be a string and either 'man', 'woman' or 'unknown'.
   */
  chart.selectNodes = function () {
    bubbles.each(resizeBubble())
          .attr('r', function (d) { return d.radius; });

    if(currentView == yearOrderedView)
      splitBubblesYears();
    else if (currentView == genderOrderedView)
      splitBubblesGender();
    else if (currentView == subcollectionOrderedView)
      splitBubblesSubcollection();
    else
      groupBubbles();
  };


  // return the chart function from closure.
  return chart;
}

/*
 * Below is the initialization code as well as some helper functions
 * to create a new bubble chart instance, load the data, and display it.
 */

var myBubbleChart = bubbleChart();
/*
 * Function called once data is loaded from CSV.
 * Calls bubble chart function to display inside #vis div.
 */
function display(error, data) {
  if (error) {
    console.log(error);
  }

  myBubbleChart('#vis', data);
}

/*
 * Sets up the layout buttons.
 */
function setupButtons() {

  //  Allow for toggling between view modes
  d3.select('#sidemenu')
    .selectAll('.orderButton')
    .on('click', function () {
      // Remove active class from all buttons
      d3.selectAll('.orderButton').classed('active', false);
      // Find the button just clicked
      var button = d3.select(this);

      // Set it as the active button
      button.classed('active', true);

      // Get the id of the button
      var buttonId = button.attr('id');

      // Toggle the bubble chart based on
      // the currently clicked button.

      currentView = buttonId;
      myBubbleChart.toggleDisplay(buttonId);
    });

    // Select dreams
    d3.select('#sidemenu')
    .selectAll('.selectButton')
    .on('click', function () {
      // Find the button just clicked
      var button = d3.select(this);

      // Set it as an active button
      if(button.classed('selecting')){
        button.classed('selecting', false);
        button.classed('active', false);
      } else {
        button.classed('selecting', true);
        button.classed('active', false);
      }

      // Select or unselect the corresponding nodes
      myBubbleChart.selectNodes();
    });

    d3.select('#yearMin')
    .on("input", function() {
          // Select or unselect the corresponding nodes
            myBubbleChart.selectNodes();
    });
    d3.select('#yearMax')
    .on("input", function() {
          // Select or unselect the corresponding nodes
            myBubbleChart.selectNodes();
    });
}


/*
 * Select only
 */

/*
 * Helper function to convert a number into a string
 * and add commas to it to improve presentation.
 */
function addCommas(nStr) {
  nStr += '';
  var x = nStr.split('.');
  var x1 = x[0];
  var x2 = x.length > 1 ? '.' + x[1] : '';
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2');
  }

  return x1 + x2;
}

// Load the data.
d3.csv('data.csv', display);

// setup the buttons.
setupButtons();
