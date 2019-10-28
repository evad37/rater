import BannerWidget from "./Components/BannerWidget";

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
		label: "X", // not using an icon since color becomes inverted, i.e. white on light-grey
		title: "Close (and discard any changes)",
		flags: "primary",
	},
	// Safe (top left)
	{
		action: "help",
		flags: "safe",
		label: "?", // not using icon, to mirror Close action
		title: "help"
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
		framed: false,
		padded: false
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
		],
		$element: $("<div style='display:inline-block;width:100%;max-width:425px;'>"),
		$overlay: this.$overlay,
	} );

	this.setAllDropDown = new OO.ui.DropdownWidget( {
		label: new OO.ui.HtmlSnippet("<span style=\"color:#777\">Set all...</span>"),
		menu: { // FIXME: needs real data
			items: [
				new OO.ui.MenuSectionOptionWidget( {
					label: "Classes"
				} ),
				new OO.ui.MenuOptionWidget( {
					data: "B",
					label: "B"
				} ),
				new OO.ui.MenuOptionWidget( {
					data: "C",
					label: "C"
				} ),
				new OO.ui.MenuOptionWidget( {
					data: "start",
					label: "Start"
				} ),
				new OO.ui.MenuSectionOptionWidget( {
					label: "Importances"
				} ),
				new OO.ui.MenuOptionWidget( {
					data: "top",
					label: "Top"
				} ),
				new OO.ui.MenuOptionWidget( {
					data: "high",
					label: "High"
				} ),
				new OO.ui.MenuOptionWidget( {
					data: "mid",
					label: "Mid"
				} )
			]
		},
		$element: $("<span style=\"display:inline-block;width:auto\">"),
		$overlay: this.$overlay,
	} );

	this.removeAllButton = new OO.ui.ButtonWidget( {
		icon: "trash",
		title: "Remove all",
		flags: "destructive"
	} );
	this.clearAllButton = new OO.ui.ButtonWidget( {
		icon: "cancel",
		title: "Clear all",
		flags: "destructive"
	} );
	this.bypassAllButton = new OO.ui.ButtonWidget( {
		icon: "articleRedirect",
		title: "Bypass all redirects"
	} );
	this.doAllButtons = new OO.ui.ButtonGroupWidget( {
		items: [
			this.removeAllButton,
			this.clearAllButton,
			this.bypassAllButton
		],
		$element: $("<span style='float:right;'>"),
	} );

	this.topBar.$element.append(
		this.searchBox.$element,
		this.setAllDropDown.$element,
		this.doAllButtons.$element
	).css("background","#ccc");

	// FIXME: this is placeholder content
	// this.content.$element.append( "<span>(No project banners yet)</span>" );

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
			this.banners = data.banners.map(bannerTemplate => new BannerWidget(bannerTemplate));
			for (const banner of this.banners) {
				this.content.$element.append(banner.$element);
			}
			this.talkWikitext = data.talkWikitext;
			this.talkpage = data.talkpage;
			this.updateSize();
		}, this );
};

// Set up the window it is ready: attached to the DOM, and opening animation completed
MainWindow.prototype.getReadyProcess = function ( data ) {
	data = data || {};
	return MainWindow.super.prototype.getReadyProcess.call( this, data )
		.next( () => { // force labels to show by default
			this.banners.forEach(banner => {
				banner.parameterWidgets.forEach(param => param.focusInput()); 
			});
		}, this)
		.next( () => this.searchBox.focus()); // search box is where we really ant focus to be
};

export default MainWindow;