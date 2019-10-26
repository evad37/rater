function MainWindow( config ) {
	MainWindow.super.call( this, config );
}
OO.inheritClass( MainWindow, OO.ui.ProcessDialog );

MainWindow.static.name = "main";
MainWindow.static.title = "Rater";
MainWindow.static.size = "large";
MainWindow.static.actions = [
	// Primary (top right):
	{
		title: "Close (and discard any changes)",
		flags: "primary",
		label: new OO.ui.HtmlSnippet("Close <span style='font-weight:bold'>X</span>"), // not using an icon since color becomes inverted, i.e. white on light-grey
	},
	// Safe (top left)
	{
		label: "Help",
		action: "help",
		icon: "helpNotice",
		flags: "safe",
		title: "help"
		// no label, to mirror size of Close action
	},
	// Others (bottom)
	{
		action: "save",
		label: new OO.ui.HtmlSnippet("<span style='padding:0 1em;'>Save</span>"),
		flags: ["primary", "progressive"]
	},
	{
		action: "preview",
		label: "Show preview"
	},
	{
		action: "changes",
		label: "Show changes"
	},
	{
		action: "cancel",
		label: "Cancel"
	}
];

// Customize the initialize() function: This is where to add content to the dialog body and set up event handlers.
MainWindow.prototype.initialize = function () {
	// Call the parent method.
	MainWindow.super.prototype.initialize.call( this );
	// Create layouts
	this.topBar = new OO.ui.PanelLayout( {
		expanded: false,
		framed: true,
		padded: true
	} );
	this.content = new OO.ui.PanelLayout( {
		expanded: true,
		padded: true,
		scrollable: true
	} );
	this.outerLayout = new OO.ui.StackLayout( {
		items: [
			this.topBar,
			this.content
		],
		continuous: true,
		expanded: true
	} );
	// Create topBar content
	this.searchBox = new OO.ui.ComboBoxInputWidget( {
		placeholder: "Add a WikiProject...",
		options: [
			{ // FIXME: These are placeholders.
				data: "Option 1",
				label: "Option One"
			},
			{
				data: "Option 2",
				label: "Option Two"
			},
			{
				data: "Option 3",
				label: "Option Three"
			}
		]
	} );
	this.addProjectButton = new OO.ui.ButtonWidget( {
		label: "Add",
		icon: "add",
		title: "Add project",
		flags: "progressive"
	} );
	this.topBar.$element.append(
		(new OO.ui.ActionFieldLayout(this.searchBox, this.addProjectButton)).$element
	);

	// FIXME: this is placeholder content
	this.content.$element.append( "<p>(No project banners yet)</p>" );

	this.$body.append( this.outerLayout.$element );
};

// Override the getBodyHeight() method to specify a custom height
MainWindow.prototype.getBodyHeight = function () {
	return this.topBar.$element.outerHeight( true ) + this.content.$element.outerHeight( true );
};

// Use getSetupProcess() to set up the window with data passed to it at the time 
// of opening
MainWindow.prototype.getSetupProcess = function ( data ) {
	data = data || {};
	return MainWindow.super.prototype.getSetupProcess.call( this, data )
		.next( () => {
			// TODO: Set up window based on data

			this.updateSize();
		}, this );
};

export default MainWindow;