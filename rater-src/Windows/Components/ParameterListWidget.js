/**
 * @cfg {OO.ui.Element[]} items Items to be added
 * @cfg {Number} displayLimit The most to show at once. If the number of items
 *  is more than this, then only the first (displayLimit - 1) items are shown.
 */
var ParameterListWidget = function ParameterListWidget( config ) {
	config = config || {};

	// Call parent constructor
	ParameterListWidget.parent.call( this, config );
	OO.ui.mixin.GroupElement.call( this, {
		$group: this.$element
	} );
	this.addItems( config.items );
   
	// Hide some parameters (initially), if more than set display limit
	if (config.displayLimit && this.items.length > config.displayLimit ) {
		var hideFromNumber = config.displayLimit - 1; // One-indexed
		var hideFromIndex = hideFromNumber - 1; // Zero-indexed
		for (let i = hideFromIndex; i < this.items.length; i++) {
			this.items[i].toggle(false);
		}
		// Add button to show the hidden params
		this.showMoreParametersButton = new OO.ui.ButtonWidget({
			label: "Show "+(this.items.length - config.displayLimit - 1)+" more paramters",
			framed: false,
			$element: $("<span style='margin-bottom:0'>")
		});
		this.addItems([this.showMoreParametersButton]);
	}

	// Add the button that allows user to add more parameters
	this.addParametersButton = new OO.ui.ButtonWidget({
		label: "Add paramter",
		icon: "add",
		framed: false,
		$element: $("<span style='margin-bottom:0'>")
	});
	this.addItems([this.addParametersButton]);

	// Handle delete events from ParameterWidgets
	this.aggregate( { delete: "parameterDelete"	} );
	this.connect( this, { parameterDelete: "onParameterDelete" } );
    
	// Handle button clicks
	if (this.showMoreParametersButton ) {
		this.showMoreParametersButton.connect( this, { "click": "onShowMoreParametersButtonClick" } );
	}
	this.addParametersButton.connect( this, { "click": "onAddParametersButtonClick" } );
};

OO.inheritClass( ParameterListWidget, OO.ui.Widget );
OO.mixinClass( ParameterListWidget, OO.ui.mixin.GroupElement );
/*
methods from mixin:
 - addItems( items, [index] ) : OO.ui.Element  (CHAINABLE)
 - clearItems( ) : OO.ui.Element  (CHAINABLE)
 - findItemFromData( data ) : OO.ui.Element|null
 - findItemsFromData( data ) : OO.ui.Element[]
 - removeItems( items ) : OO.ui.Element  (CHAINABLE)
*/

ParameterListWidget.prototype.onParameterDelete = function ( parameter ) {
	this.removeItems([parameter]);
};

ParameterListWidget.prototype.getParameterItems = function() {
	return this.items.filter(item => item.constructor.name === "ParameterWidget");
};

ParameterListWidget.prototype.onShowMoreParametersButtonClick = function() {
	this.removeItems([this.showMoreParametersButton]);
	this.items.forEach(parameterWidget => parameterWidget.toggle(true));
};

ParameterListWidget.prototype.onAddParametersButtonClick = function() {
	this.removeItems([this.addParametersButton]);
	this.emit("addParametersButtonClick");
};

export default ParameterListWidget;