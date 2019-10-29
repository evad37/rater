var SuggestionLookupTextInputWidget = function SuggestionLookupTextInputWidget( config ) {
	OO.ui.TextInputWidget.call( this, config );
	OO.ui.mixin.LookupElement.call( this, config );
	this.suggestions = config.suggestions || [];
};
OO.inheritClass( SuggestionLookupTextInputWidget, OO.ui.TextInputWidget );
OO.mixinClass( SuggestionLookupTextInputWidget, OO.ui.mixin.LookupElement );

// Set suggestion. param: Object[] with objects of the form { data: ... , label: ... }
SuggestionLookupTextInputWidget.prototype.setSuggestions = function(suggestions) {
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

export default SuggestionLookupTextInputWidget;