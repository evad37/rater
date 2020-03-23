var SuggestionLookupTextInputWidget = function SuggestionLookupTextInputWidget( config ) {
	OO.ui.TextInputWidget.call( this, config );
	OO.ui.mixin.LookupElement.call( this, config );
	this.suggestions = Array.isArray(config.suggestions) ? config.suggestions : [];
	this.$element.addClass("rater-suggestionLookupTextInputWidget");
};
OO.inheritClass( SuggestionLookupTextInputWidget, OO.ui.TextInputWidget );
OO.mixinClass( SuggestionLookupTextInputWidget, OO.ui.mixin.LookupElement );

// Set suggestion. param: Object[] with objects of the form { data: ... , label: ... }
SuggestionLookupTextInputWidget.prototype.setSuggestions = function(suggestions) {
	if (!Array.isArray(suggestions)) {
		if (suggestions != null) {
			console.warn("[Rater] SuggestionLookupTextInputWidget.prototype.setSuggestions called with a non-array value:", suggestions);
		}
		return;
	}
	this.suggestions = suggestions;
};

// Returns data, as a resolution to a promise, to be passed to #getLookupMenuOptionsFromData
SuggestionLookupTextInputWidget.prototype.getLookupRequest = function () {
	var deferred = $.Deferred().resolve(new RegExp("\\b" + mw.util.escapeRegExp(this.getValue()), "i"));
	return deferred.promise( { abort: function () {} } );
};

// ???
SuggestionLookupTextInputWidget.prototype.getLookupCacheDataFromResponse = function ( response ) {
	return response || [];
};

// Is passed data from #getLookupRequest, returns an array of menu item widgets 
SuggestionLookupTextInputWidget.prototype.getLookupMenuOptionsFromData = function ( pattern ) {
	var labelMatchesInputVal = function(suggestionItem) {
		return pattern.test(suggestionItem.label) || ( !suggestionItem.label && pattern.test(suggestionItem.data) );
	};
	var makeMenuOptionWidget = function(optionItem) {
		return new OO.ui.MenuOptionWidget( {
			data: optionItem.data,
			label: optionItem.label || optionItem.data
		} );
	};
	return this.suggestions.filter(labelMatchesInputVal).map(makeMenuOptionWidget);
};

// Extend onLookupMenuChoose method to emit an choose event
SuggestionLookupTextInputWidget.prototype.onLookupMenuChoose = function ( item ) {
	// Get data
	const itemData = item.getData();
	// Simplify item data if it is an object with a name property
	if (itemData && itemData.name) {
		item.setData(itemData.name);
	}
	// First blur the input, to prevent the menu popping back up
	this.$input.blur();
	OO.ui.mixin.LookupElement.prototype.onLookupMenuChoose.call(this, item);
	this.emit("choose", itemData );
};

export default SuggestionLookupTextInputWidget;