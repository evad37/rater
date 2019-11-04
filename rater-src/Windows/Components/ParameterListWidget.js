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
		var hiddenCount = 0;
		for (let i = hideFromIndex; i < this.items.length; i++) {
			if (!this.items[i].autofilled) { // Don't hide auto-filled params
				this.items[i].toggle(false);
				hiddenCount++;
			}
		}
		if (hiddenCount>0) {
			// Add button to show the hidden params
			this.showMoreParametersButton = new OO.ui.ButtonWidget({
				label: "Show " + hiddenCount + " more " + (hiddenCount===1 ? "paramter" : "paramters"),
				framed: false,
				$element: $("<span style='margin-bottom:0'>")
			});
			this.addItems([this.showMoreParametersButton]);
		}
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
    
	// Handle change events from ParameterWidgets
	this.aggregate( { change: "parameterChange"	} );
	this.connect( this, { parameterChange: "onParameterChange" } );
    
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

ParameterListWidget.prototype.onParameterDelete = function(parameter) {
	this.removeItems([parameter]);
	this.emit("change");
};

ParameterListWidget.prototype.onParameterChange = function() {
	this.emit("change");
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

ParameterListWidget.prototype.makeWikitext = function(pipeStyle, equalsStyle) {
	return this.getParameterItems()
		.map(parameter => parameter.makeWikitext(pipeStyle, equalsStyle))
		.join("");
};

export default ParameterListWidget;