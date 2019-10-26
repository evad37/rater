// Stub code, based on the example from https://www.mediawiki.org/wiki/OOUI/Windows/Window_managers

function MainWindow( config ) {
	MainWindow.super.call( this, config );
}
OO.inheritClass( MainWindow, OO.ui.Dialog );

// Specify a symbolic name (e.g., 'simple', in this example) using the static 'name' property.
MainWindow.static.name = "main";
MainWindow.static.title = "Rater";

MainWindow.prototype.initialize = function () {
	MainWindow.super.prototype.initialize.call( this );
	this.content = new OO.ui.PanelLayout( { padded: true, expanded: false } );
	this.content.$element.append( "<p>The window manager references this window by its symbolic name ('simple'). The symbolic name is specified with the dialog class's static 'name' property. A factory is used to instantiate the window and add it to the window manager when it is needed.</p>" );
	this.$body.append( this.content.$element );
};

export default MainWindow;