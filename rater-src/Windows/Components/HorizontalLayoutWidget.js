// <nowiki>

/**
 * A HorizontalLayout that is also a widget, and can thus be placed within
 * field layouts.
 * 
 * @class
 * @param {*} config configuration for OO.ui.HorizontalLayout
 */
function HorizontalLayoutWidget( config ) {
	// Configuration initialization
	config = config || {};
	// Call parent constructor
	HorizontalLayoutWidget.super.call( this, {} );
    
	this.layout = new OO.ui.HorizontalLayout( {
		...config,
		$element: this.$element
	});

}
OO.inheritClass( HorizontalLayoutWidget, OO.ui.Widget );

export default HorizontalLayoutWidget;
// </nowiki>