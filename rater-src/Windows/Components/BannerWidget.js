import ParameterWidget from "./ParameterWidget";

/* Target output (from rater v1):
// HTML
<span class="rater-dialog-paraInput rater-dialog-textInputContainer">
	<label><span class="rater-dialog-para-code">category</span></label>
	<input type="text"/><a title="remove">x</a><wbr/>
</span>
// CSS
.rater-dialog-row > div > span {
    padding-right: 0.5em;
    white-space: nowrap;
}
.rater-dialog-autofill {
    border: 1px dashed #cd20ff;
    padding: 0.2em;
    margin-right: 0.2em;
}
rater-dialog-autofill::after {
    content: "autofilled";
    color: #cd20ff;
    font-weight: bold;
    font-size: 96%;
}
*/

function BannerWidget( template, config ) {
	// Configuration initialization
	config = config || {};
	// Call parent constructor
	BannerWidget.super.call( this, config );
	// Create a layout
	this.layout = new OO.ui.FieldsetLayout();
	
	this.mainLabel = new OO.ui.LabelWidget({
		label: "{{" + template.getTitle().getMainText() + "}}",
		$element: $("<strong style='display:inline-block;width:48%;font-size: 110%;margin-right:0;padding-right:8px'>")
	});
	// Rating dropdowns
	this.classDropdown = new OO.ui.DropdownWidget( {
		label: new OO.ui.HtmlSnippet("<span style=\"color:#777\">Class</span>"),
		menu: { // FIXME: needs real data
			items: [
				new OO.ui.MenuOptionWidget( {
					data: "",
					label: " "
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
			]
		},
		$element: $("<span style='display:inline-block;width:24%'>"),
		$overlay: this.$overlay,
	} );
	this.importanceDropdown = new OO.ui.DropdownWidget( {
		label: new OO.ui.HtmlSnippet("<span style=\"color:#777\">Importance</span>"),
		menu: { // FIXME: needs real data
			items: [
				new OO.ui.MenuOptionWidget( {
					data: "",
					label: " "
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
		$element: $("<span style='display:inline-block;width:24%'>"),
		$overlay: this.$overlay,
	} );
	this.ratingsDropdowns = new OO.ui.HorizontalLayout( {
		items: [
			this.mainLabel,
			this.classDropdown,
			this.importanceDropdown,
		]
	} );
	//this.parametersToggle = new OO.ui.ToggleSwitchWidget();
	// Parameters as text (collapsed)
	// this.parametersText = new OO.ui.LabelWidget({
	// 	label: template.parameters.map(parameter => `|${parameter.name}=${parameter.value}`).join(" ")
	// });
	// this.parametersField =  new OO.ui.FieldLayout( this.parametersText, {
	// 	label: "Parameters", 
	// 	align: "top" 
	// } );
	this.parameterWidgets = template.parameters
		.filter(param => param.name !== "class" && param.name !== "importance")
		.map(param => new ParameterWidget(param, template.paramData[param.name]));
	// Parameters as label/input pairs (expanded)
	//TODO: New parameter combobox
	this.parameterWidgetsLayout = new OO.ui.HorizontalLayout( {
		items: this.parameterWidgets
	} );
	// Add everything to the layout
	this.layout.addItems([
		this.ratingsDropdowns,
		this.parameterWidgetsLayout
	]);
	
	this.$element.append(this.layout.$element, $("<hr>"));
}
OO.inheritClass( BannerWidget, OO.ui.Widget );

export default BannerWidget;