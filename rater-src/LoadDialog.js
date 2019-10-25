import {makeErrorMsg} from "./util";

var progressBar = new OO.ui.ProgressBarWidget( {
	progress: 1
} );
var incrementProgress = function(amount, maximum) {
	var priorProgress = progressBar.getProgress();
	var incrementedProgress = Math.min(maximum || 100, priorProgress + amount);
	progressBar.setProgress(incrementedProgress);
};
/* var incrementProgressByInterval = function() {
	var incrementIntervalDelay = 100;
	var incrementIntervalAmount = 0.1;
	var incrementIntervalMaxval = 98;
	return window.setInterval(
		incrementProgress,
		incrementIntervalDelay,
		incrementIntervalAmount,
		incrementIntervalMaxval
	);
}; */

var LoadDialog = function LoadDialog( config ) {
	LoadDialog.super.call( this, config );
};
OO.inheritClass( LoadDialog, OO.ui.Dialog ); 

LoadDialog.static.name = "loadDialog";
// Specify a title statically (or, alternatively, with data passed to the opening() method).
LoadDialog.static.title = "Loading Rater...";

// Customize the initialize() function: This is where to add content to the dialog body and set up event handlers.
LoadDialog.prototype.initialize = function () {
	// Call the parent method.
	LoadDialog.super.prototype.initialize.call( this );
	// Create and append a layout and some content.
	this.content = new OO.ui.PanelLayout( { 
		padded: true,
		expanded: false 
	} );
	this.content.$element.append(
		progressBar.$element,
		$("<p>").attr("id", "dialog-loading-0").css("font-weight", "bold").text("Initialising:"),
		$("<p>").attr("id", "dialog-loading-1").text("Loading talkpage wikitext..."),
		$("<p>").attr("id", "dialog-loading-2").text("Parsing talkpage templates..."),
		$("<p>").attr("id", "dialog-loading-3").text("Getting templates' parameter data..."),
		$("<p>").attr("id", "dialog-loading-4").text("Checking if page redirects..."),
		$("<p>").attr("id", "dialog-loading-5").text("Retrieving quality prediction...").hide()
	);
	this.$body.append( this.content.$element );
};

// Override the getBodyHeight() method to specify a custom height (or don't to use the automatically generated height).
LoadDialog.prototype.getBodyHeight = function () {
	return this.content.$element.outerHeight( true );
};

LoadDialog.prototype.showTaskDone = function(taskNumber) {
	$("#dialog-loading-"+taskNumber).append(" Done!");
	var isLastTask = ( taskNumber === 5 );
	if ( isLastTask ) {
		// Immediately show 100% completed
		incrementProgress(100);
		window.setTimeout(function() {
			$("#dialog-loading").hide();
		}, 100);
		return;
	} 
	// Show a smooth transition by using small steps over a short duration
	var totalIncrement = 20;
	var totalTime = 400;
	var totalSteps = 10;
	var incrementPerStep = totalIncrement / totalSteps;
	for ( var step=0; step < totalSteps; step++) {
		window.setTimeout(
			incrementProgress,
			totalTime * step / totalSteps,
			incrementPerStep
		);
	}
};
LoadDialog.prototype.showTaskFailed = function(taskNumber, code, jqxhr) {
	$("#dialog-loading-"+taskNumber).append(
		" Failed.",
		( code == null ) ? "" : " " + makeErrorMsg(code, jqxhr)
	);
};

export default LoadDialog;

