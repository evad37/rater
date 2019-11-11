function DropdownParameterWidget( config ) {
	// Configuration initialization
	config = $.extend({
		$element: $("<span style='display:inline-block;width:24%'>")
	}, config || {} );

	// Call parent constructor
	DropdownParameterWidget.super.call( this, config );
    
	this.$overlay = config.$overlay;
    
	// Autofilled icon
	this.autofilled = !!config.autofilled;
	this.autofilledIcon = new OO.ui.IconWidget( {
		icon: "robot",
		title: "Autofilled by Rater",
		flags: "progressive",
		$element: $("<span style='margin: 0 -5px 0 5px;min-width: 16px;width: 16px;left:unset;'>")
	} ).toggle(this.autofilled);
	this.$element.find(".oo-ui-indicatorElement-indicator").before(
		this.autofilledIcon.$element
	);

	// Events
	this.menu.connect(this, {
		"choose": "onDropdownMenuChoose",
		"select": "onDropdownMenuSelect"
	});
}
OO.inheritClass( DropdownParameterWidget, OO.ui.DropdownWidget );

DropdownParameterWidget.prototype.setAutofilled = function(setAutofill) {
	this.autofilledIcon.toggle(!!setAutofill);
	this.$element.find(".oo-ui-dropdownWidget-handle").css({
		"border": setAutofill ? "1px dashed #36c" : ""
	});
	this.autofilled = !!setAutofill;
};

DropdownParameterWidget.prototype.onDropdownMenuChoose = function() {
	this.setAutofilled(false);
	this.emit("change");
};

DropdownParameterWidget.prototype.onDropdownMenuSelect = function() {
	this.emit("change");
};

DropdownParameterWidget.prototype.getValue = function() {
	const selectedItem = this.menu.findSelectedItem();
	return selectedItem && selectedItem.getData();
};

export default DropdownParameterWidget;