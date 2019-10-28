function ParameterWidget( parameter, paramData, config ) {
	// Configuration initialization
	config = config || {};
	// Call parent constructor
	ParameterWidget.super.call( this, config );

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
		value: parameter.value,
		label: parameter.name + " =",
		labelPosition: "before",
		options: this.allowedValues.map(val => {return {data: val, label:val}; }),
		$element: $("<div style='width:calc(100% - 45px);margin-right:0;'>") // the 45px leaves room for the delete button
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
	this.layout = new OO.ui.HorizontalLayout({
		items: [
			this.input,
			this.deleteButton
		],
		$element: $("<div style='width: 33%;margin:0;'>")
	});
	this.$element = this.layout.$element;
}
OO.inheritClass( ParameterWidget, OO.ui.Widget );

ParameterWidget.prototype.focusInput = function() {
	return this.input.focus();
};

export default ParameterWidget;