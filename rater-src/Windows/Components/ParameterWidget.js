function ParameterWidget( parameter, paramData, config ) {
	// Configuration initialization
	config = config || {};
	// Call parent constructor
	ParameterWidget.super.call( this, config );
    
	this.parameter = parameter;
	this.paramData = paramData || {};

	// Make the input. Type can be checkbox, or dropdown, or text input,
	// depending on number of allowed values in param data.
	this.allowedValues = paramData && paramData.allowedValues || [];
	// switch (true) {
	// case this.allowedValues.length === 0:
	// case parameter.value && !this.allowedValues.includes(parameter.value):
	// 	// Text input
	// 	break;
	// case 1:
	// 	// Checkbox (labelled only when both checked)
	// 	this.allowedValues = [null, ...this.allowedValues];
	// 	/* ...falls through... */
	// case 2:
	// 	// Checkbox (labelled when both checked and not checked)
	// 	this.input = new OO.ui.CheckboxMultioptionWidget( {
	// 		data: parameter.value,
	// 		selected: this.allowedValues.indexOf(parameter.value) === 1,
	// 		label: $("<code>").text(parameter.value || "")
	// 	} );
	// 	break;
	// default:
	// 	// Dropdown
	// 	this.input = new OO.ui.DropdownWidget( {
	// 		menu: {
	// 			items: this.allowedValues.map(allowedVal => new OO.ui.MenuOptionWidget({
	// 				data: allowedVal,
	// 				label: allowedVal
	// 			}) )
	// 		}
	// 	} );
	// 	this.input.getMenu().selectItemByData(parameter.value);
	// 	break;
	// }
	// TODO: Use above logic, or something similar. For now, just create a ComboBox
	this.input = new OO.ui.ComboBoxInputWidget( {
		value: this.parameter.value,
		// label: parameter.name + " =",
		// labelPosition: "before",
		options: this.allowedValues.map(val => {return {data: val, label:val}; }),
		$element: $("<div style='width:calc(100% - 70px);margin-right:0;'>") // the 70px leaves room for buttons
	} );
	// Reduce the excessive whitespace/height
	this.input.$element.find("input").css({
		"padding-top": 0,
		"padding-bottom": "2px",
		"height": "24px"
	});
	// Fix label positioning within the reduced height
	this.input.$element.find("span.oo-ui-labelElement-label").css({"line-height": "normal"});
	// Also reduce height of dropdown button (if options are present)
	this.input.$element.find("a.oo-ui-buttonElement-button").css({
		"padding-top": 0,
		"height": "24px",
		"min-height": "0"
	});

	//var description = this.paramData[parameter.name] && this.paramData[parameter.name].label && this.paramData[parameter.name].label.en;
	// var paramName = new OO.ui.LabelWidget({
	// 	label: "|" + parameter.name + "=",
	// 	$element: $("<code>")
	// });
	this.deleteButton = new OO.ui.ButtonWidget({
		icon: "clear",
		framed: false,
		flags: "destructive"
	});
	this.deleteButton.$element.find("a span").first().css({
		"min-width": "unset",
		"width": "16px"
	});
    
	this.confirmButton = new OO.ui.ButtonWidget({
		icon: "check",
		framed: false,
		flags: "progressive",
		$element: $("<span style='margin-right:0'>")
	});
	this.confirmButton.$element.find("a span").first().css({
		"min-width": "unset",
		"width": "16px",
		"margin-right": 0
	});

	this.editLayoutControls = new OO.ui.HorizontalLayout({
		items: [
			this.input,
			this.confirmButton,
			this.deleteButton
		],
		//$element: $("<div style='width: 48%;margin:0;'>")
	});
	// Hacks to make this HorizontalLayout go inside a FieldLayout
	this.editLayoutControls.getInputId = () => false;
	this.editLayoutControls.isDisabled = () => false;
	this.editLayoutControls.simulateLabelClick = () => true;

	this.editLayout = new OO.ui.FieldLayout( this.editLayoutControls, {
		label: this.parameter.name + " =",
		align: "top",
		help: this.paramData.description && this.paramData.description.en || false,
		helpInline: true
	}).toggle();
	this.editLayout.$element.find("label.oo-ui-inline-help").css({"margin": "-10px 0 5px 10px"});

	this.fullLabel = new OO.ui.LabelWidget({
		label: this.parameter.name + " = " + this.parameter.value,
		$element: $("<label style='margin: 0;'>")
	});
	this.editButton = new OO.ui.ButtonWidget({
		icon: "edit",
		framed: false,
		$element: $("<span style='margin-bottom: 0;'>")
	});
	this.editButton.$element.find("a").css({
		"border-radius": "0 10px 10px 0",
		"margin-left": "5px"
	});
	this.editButton.$element.find("a span").first().css({
		"min-width": "unset",
		"width": "16px"
	});

	this.readLayout = new OO.ui.HorizontalLayout({
		items: [
			this.fullLabel,
			this.editButton
		],
		$element: $("<span style='margin:0;width:unset;'>")
	});

	this.$element = $("<div>")
		.css({
			"width": "unset",
			"display": "inline-block",
			"border": "1px solid #ddd",
			"border-radius": "10px",
			"padding-left": "10px",
			"margin": "0 8px 8px 0"
		})
		.append(this.readLayout.$element, this.editLayout.$element);
    
	this.editButton.connect( this, { "click": "onEditClick" } );
	this.confirmButton.connect( this, { "click": "onConfirmClick" } );
}
OO.inheritClass( ParameterWidget, OO.ui.Widget );

ParameterWidget.prototype.onEditClick = function() {
	this.readLayout.toggle(false);
	this.editLayout.toggle(true);
	this.input.focus();
};

ParameterWidget.prototype.onConfirmClick = function() {
	this.parameter.value = this.input.getValue();
	this.fullLabel.setLabel(this.parameter.name + " = " + this.parameter.value);
	this.readLayout.toggle(true);
	this.editLayout.toggle(false);
};

ParameterWidget.prototype.focusInput = function() {
	return this.input.focus();
};

export default ParameterWidget;