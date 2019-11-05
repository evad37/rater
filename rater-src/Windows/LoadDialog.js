import {makeErrorMsg} from "../util";

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
LoadDialog.static.title = "Loading Rater...";

// Customize the initialize() function: This is where to add content to the dialog body and set up event handlers.
LoadDialog.prototype.initialize = function () {
	// Call the parent method.
	LoadDialog.super.prototype.initialize.call( this );
	// Create a layout
	this.content = new OO.ui.PanelLayout( { 
		padded: true,
		expanded: false 
	} );
	// Create content
	this.progressBar = new OO.ui.ProgressBarWidget( {
		progress: 1
	} );
	this.setuptasks = [
		new OO.ui.LabelWidget( {
			label: "Loading your Rater preferences...",
			$element: $("<p style=\"display:block\">")
		}),
		new OO.ui.LabelWidget( {
			label: "Loading list of project banners...",
			$element: $("<p style=\"display:block\">")
		}),
		new OO.ui.LabelWidget( {
			label: "Loading talkpage wikitext...",
			$element: $("<p style=\"display:block\">")
		}),
		new OO.ui.LabelWidget( {
			label: "Parsing talkpage templates...",
			$element: $("<p style=\"display:block\">")
		}),
		new OO.ui.LabelWidget( {
			label: "Getting templates' parameter data...",
			$element: $("<p style=\"display:block\">")
		}),
		new OO.ui.LabelWidget( {
			label: "Checking if page redirects...",
			$element: $("<p style=\"display:block\">")
		}),
		new OO.ui.LabelWidget( {
			label: "Retrieving quality prediction...",
			$element: $("<p style=\"display:block\">")
		}).toggle(),
	];
	this.closeButton = new OO.ui.ButtonWidget( {
		label: "Close"
	}).toggle();
	this.setupPromises = [];

	// Append content to layout
	this.content.$element.append(
		this.progressBar.$element,
		(new OO.ui.LabelWidget( {
			label: "Initialising:",
			$element: $("<strong style=\"display:block\">")
		})).$element,
		...this.setuptasks.map(widget => widget.$element),
		this.closeButton.$element
	);

	// Append layout to dialog
	this.$body.append( this.content.$element );

	// Connect events to handlers
	this.closeButton.connect( this, { "click": "onCloseButtonClick" } );
};

LoadDialog.prototype.onCloseButtonClick = function() {
	// Close this dialog, without passing any data
	this.close();
};

// Override the getBodyHeight() method to specify a custom height (or don't to use the automatically generated height).
LoadDialog.prototype.getBodyHeight = function () {
	return this.content.$element.outerHeight( true );
};

LoadDialog.prototype.incrementProgress = function(amount, maximum) {
	var priorProgress = this.progressBar.getProgress();
	var incrementedProgress = Math.min(maximum || 100, priorProgress + amount);
	this.progressBar.setProgress(incrementedProgress);
};

LoadDialog.prototype.addTaskPromiseHandlers = function(taskPromises) {
	var onTaskDone = index => {
		// Add "Done!" to label
		var widget = this.setuptasks[index];
		widget.setLabel(widget.getLabel() + " Done!");
		// Increment status bar. Show a smooth transition by
		// using small steps over a short duration.
		var totalIncrement = 20; // percent
		var totalTime = 400; // milliseconds
		var totalSteps = 10;
		var incrementPerStep = totalIncrement / totalSteps;

		for ( var step=0; step < totalSteps; step++) {
			window.setTimeout(
				this.incrementProgress.bind(this),
				totalTime * step / totalSteps,
				incrementPerStep
			);
		}
	};
	var onTaskError = (index, code, info) => {
		var widget = this.setuptasks[index];
		widget.setLabel(
			widget.getLabel() + " Failed. " + makeErrorMsg(code, info)
		);
		this.closeButton.toggle(true);
		this.updateSize();
	};
	taskPromises.forEach(function(promise, index) {
		promise.then(
			() => onTaskDone(index),
			(code, info) => onTaskError(index, code, info)
		);
	});
};

// Use getSetupProcess() to set up the window with data passed to it at the time 
// of opening
LoadDialog.prototype.getSetupProcess = function ( data ) {
	data = data || {};
	return LoadDialog.super.prototype.getSetupProcess.call( this, data )
		.next( () => {
			var showOresTask = !!data.ores;
			this.setuptasks[6].toggle(showOresTask);
			var taskPromises = data.ores ? data.promises : data.promises.slice(0, -1);
			data.isOpened.then(() => this.addTaskPromiseHandlers(taskPromises));
		}, this );
};

// Prevent window from closing too quickly, using getHoldProcess()
LoadDialog.prototype.getHoldProcess = function ( data ) {
	data = data || {};
	if (data.success) {
		// Wait a bit before processing the close, which happens automatically
		return LoadDialog.super.prototype.getHoldProcess.call( this, data )
			.next(800);
	}
	// No need to wait if closed manually
	return LoadDialog.super.prototype.getHoldProcess.call( this, data );
};

// Use the getTeardownProcess() method to perform actions whenever the dialog is closed. 
LoadDialog.prototype.getTeardownProcess = function ( data ) {
	return LoadDialog.super.prototype.getTeardownProcess.call( this, data )
		.first( () => {
		// Perform cleanup: reset labels
			this.setuptasks.forEach( setuptask => {
				var currentLabel = setuptask.getLabel();
				setuptask.setLabel(
					currentLabel.slice(0, currentLabel.indexOf("...")+3)
				);
			} );
		}, this );
};

export default LoadDialog;