import API from "./api";
import {isAfterDate, mostFrequent, filterAndMap} from "./util";
import config from "./config";
import * as cache from "./cache";
// <nowiki>

/** Template
 *
 * @class
 * Represents the wikitext of template transclusion. Used by #parseTemplates.
 * @prop {String} name Name of the template
 * @prop {String} wikitext Full wikitext of the transclusion
 * @prop {Object[]} parameters Parameters used in the translcusion, in order, of form:
	{
		name: {String|Number} parameter name, or position for unnamed parameters,
		value: {String} Wikitext passed to the parameter (whitespace trimmed),
		wikitext: {String} Full wikitext (including leading pipe, parameter name/equals sign (if applicable), value, and any whitespace)
	}
 * @constructor
 * @param {String} wikitext Wikitext of a template transclusion, starting with '{{' and ending with '}}'.
 */
var Template = function(wikitext) {
	this.wikitext = wikitext;
	this.parameters = [];
	// Spacing around pipes, equals signs, end braces (defaults)
	this.pipeStyle = " |";
	this.equalsStyle = "=";
	this.endBracesStyle = "}}";
};
Template.prototype.addParam = function(name, val, wikitext) {
	this.parameters.push({
		"name": name,
		"value": val, 
		"wikitext": "|" + wikitext
	});
};
/**
 * Get a parameter data by parameter name
 */ 
Template.prototype.getParam = function(paramName) {
	return this.parameters.find(function(p) { return p.name == paramName; });
};
Template.prototype.setName = function(name) {
	this.name = name.trim();
};
Template.prototype.getTitle = function() {
	return mw.Title.newFromText("Template:" + this.name);
};

/**
 * parseTemplates
 *
 * Parses templates from wikitext.
 * Based on SD0001's version at <https://en.wikipedia.org/wiki/User:SD0001/parseAllTemplates.js>.
 * Returns an array containing the template details:
 *  var templates = parseTemplates("Hello {{foo |Bar|baz=qux |2=loremipsum|3=}} world");
 *  console.log(templates[0]); // --> object
	{
		name: "foo",
		wikitext:"{{foo |Bar|baz=qux | 2 = loremipsum  |3=}}",
		parameters: [
			{
				name: 1,
				value: 'Bar',
				wikitext: '|Bar'
			},
			{
				name: 'baz',
				value: 'qux',
				wikitext: '|baz=qux '
			},
			{
				name: '2',
				value: 'loremipsum',
				wikitext: '| 2 = loremipsum  '
			},
			{
				name: '3',
				value: '',
				wikitext: '|3='
			}
		],
		getParam: function(paramName) {
			return this.parameters.find(function(p) { return p.name == paramName; });
		}
	}
 *    
 * 
 * @param {String} wikitext
 * @param {Boolean} recursive Set to `true` to also parse templates that occur within other templates,
 *  rather than just top-level templates. 
 * @return {Template[]} templates
*/
var parseTemplates = function(wikitext, recursive) { /* eslint-disable no-control-regex */
	if (!wikitext) {
		return [];
	}
	var strReplaceAt = function(string, index, char) {
		return string.slice(0,index) + char + string.slice(index + 1);
	};

	var result = [];
	
	var processTemplateText = function (startIdx, endIdx) {
		var text = wikitext.slice(startIdx, endIdx);

		var template = new Template("{{" + text.replace(/\x01/g,"|") + "}}");
		
		// swap out pipe in links with \x01 control character
		// [[File: ]] can have multiple pipes, so might need multiple passes
		while ( /(\[\[[^\]]*?)\|(.*?\]\])/g.test(text) ) {
			text = text.replace(/(\[\[[^\]]*?)\|(.*?\]\])/g, "$1\x01$2");
		}

		// Figure out most-used spacing styles for pipes/equals
		template.pipeStyle = mostFrequent( text.match(/[\s\n]*\|[\s\n]*/g) ) || " |";
		template.equalsStyle = mostFrequent( text.replace(/(=[^|]*)=+/g, "$1").match(/[\s\n]*=[\s\n]*/g) ) || "=";
		// Figure out end-braces style
		var endSpacing = text.match(/[\s\n]*$/);
		template.endBracesStyle = (endSpacing ? endSpacing[0] : "") + "}}";

		var chunks = text.split("|").map(function(chunk) {
			// change '\x01' control characters back to pipes
			return chunk.replace(/\x01/g,"|"); 
		});

		template.setName(chunks[0]);
		
		var parameterChunks = chunks.slice(1);

		var unnamedIdx = 1;
		parameterChunks.forEach(function(chunk) {
			var indexOfEqualTo = chunk.indexOf("=");
			var indexOfOpenBraces = chunk.indexOf("{{");
			
			var isWithoutEquals = !chunk.includes("=");
			var hasBracesBeforeEquals = chunk.includes("{{") && indexOfOpenBraces < indexOfEqualTo;	
			var isUnnamedParam = ( isWithoutEquals || hasBracesBeforeEquals );
			
			var pName, pNum, pVal;
			if ( isUnnamedParam ) {
				// Get the next number not already used by either an unnamed parameter, or by a
				// named parameter like `|1=val`
				while ( template.getParam(unnamedIdx) ) {
					unnamedIdx++;
				}
				pNum = unnamedIdx;
				pVal = chunk.trim();
			} else {
				pName = chunk.slice(0, indexOfEqualTo).trim();
				pVal = chunk.slice(indexOfEqualTo + 1).trim();
			}
			template.addParam(pName || pNum, pVal, chunk);
		});
		
		result.push(template);
	};

	
	var n = wikitext.length;
	
	// number of unclosed braces
	var numUnclosed = 0;

	// are we inside a comment, or between nowiki tags, or in a {{{parameter}}}?
	var inComment = false;
	var inNowiki = false;
	var inParameter = false;

	var startIdx, endIdx;
	
	for (var i=0; i<n; i++) {
		
		if ( !inComment && !inNowiki && !inParameter ) {

			if (wikitext[i] === "{" && wikitext[i+1] === "{" && wikitext[i+2] === "{" && wikitext[i+3] !== "{") {
				inParameter = true;
				i += 2;
			} else if (wikitext[i] === "{" && wikitext[i+1] === "{") {
				if (numUnclosed === 0) {
					startIdx = i+2;
				}
				numUnclosed += 2;
				i++;
			} else if (wikitext[i] === "}" && wikitext[i+1] === "}") {
				if (numUnclosed === 2) {
					endIdx = i;
					processTemplateText(startIdx, endIdx);
				}
				numUnclosed -= 2;
				i++;
			} else if (wikitext[i] === "|" && numUnclosed > 2) {
				// swap out pipes in nested templates with \x01 character
				wikitext = strReplaceAt(wikitext, i,"\x01");
			} else if ( /^<!--/.test(wikitext.slice(i, i + 4)) ) {
				inComment = true;
				i += 3;
			} else if ( /^<nowiki ?>/.test(wikitext.slice(i, i + 9)) ) {
				inNowiki = true;
				i += 7;
			} 

		} else { // we are in a comment or nowiki or {{{parameter}}}
			if (wikitext[i] === "|") {
				// swap out pipes with \x01 character
				wikitext = strReplaceAt(wikitext, i,"\x01");
			} else if (/^-->/.test(wikitext.slice(i, i + 3))) {
				inComment = false;
				i += 2;
			} else if (/^<\/nowiki ?>/.test(wikitext.slice(i, i + 10))) {
				inNowiki = false;
				i += 8;
			} else if (wikitext[i] === "}" && wikitext[i+1] === "}" && wikitext[i+2] === "}") {
				inParameter = false;
				i += 2;
			}
		}

	}
	
	if ( recursive ) {
		var subtemplates = filterAndMap(result,
			template => /\{\{(?:.|\n)*\}\}/.test(template.wikitext.slice(2,-2)),
			template => parseTemplates(template.wikitext.slice(2,-2), true)
		);
		return result.concat.apply(result, subtemplates);
	}

	return result; 
}; /* eslint-enable no-control-regex */

/**
 * @param {Template|Template[]} templates
 * @return {Promise<Template>|Promise<Template[]>}
 */
var getWithRedirectTo = function(templates) {
	var templatesArray = Array.isArray(templates) ? templates : [templates];
	if (templatesArray.length === 0) {
		return $.Deferred().resolve([]);
	}

	return API.get({
		"action": "query",
		"format": "json",
		"titles": filterAndMap(templatesArray,
			template => template.getTitle() !== null,
			template => template.getTitle().getPrefixedText()
		),
		"redirects": 1
	}).then(function(result) {
		if ( !result || !result.query ) {
			return $.Deferred().reject("Empty response");
		}
		if ( result.query.redirects ) {
			result.query.redirects.forEach(function(redirect) {
				var i = templatesArray.findIndex(template => {
					let title = template.getTitle();
					return title && title.getPrefixedText() === redirect.from;
				});
				if (i !== -1) {
					templatesArray[i].redirectTarget = mw.Title.newFromText(redirect.to);
				}
			});
		}
		return Array.isArray(templates) ? templatesArray : templatesArray[0];
	});
};

Template.prototype.getDataForParam = function(key, paraName) {
	if ( !this.paramData ) {
		return null;
	}
	// If alias, switch from alias to preferred parameter name
	var para = this.paramAliases[paraName] || paraName;	
	if ( !this.paramData[para] ) {
		return;
	}
	
	var data = this.paramData[para][key];
	// Data might actually be an object with key "en"
	if ( data && data.en && !Array.isArray(data) ) {
		return data.en;
	}
	return data;
};

Template.prototype.isShellTemplate = function() {
	var mainText = this.redirectTarget
		? this.redirectTarget.getMainText()
		: this.getTitle().getMainText();
	return config.shellTemplates.includes(mainText);
};

Template.prototype.setParamDataAndSuggestions = function() {
	var self = this;
	var paramDataSet = $.Deferred();
	
	if ( self.paramData ) { return paramDataSet.resolve(); }
    
	var prefixedText = self.redirectTarget
		? self.redirectTarget.getPrefixedText()
		: self.getTitle().getPrefixedText();

	var cachedInfo = cache.read(prefixedText + "-params");
	
	if (
		cachedInfo &&
		cachedInfo.value &&
		cachedInfo.staleDate &&
		cachedInfo.value.paramData != null &&
		cachedInfo.value.parameterSuggestions != null &&
		cachedInfo.value.paramAliases != null
	) {
		self.notemplatedata = cachedInfo.value.notemplatedata;
		self.paramData = cachedInfo.value.paramData;
		self.parameterSuggestions = cachedInfo.value.parameterSuggestions;
		self.paramAliases = cachedInfo.value.paramAliases;
		
		paramDataSet.resolve();
		if ( !isAfterDate(cachedInfo.staleDate) ) {
			// Just use the cached data
			return paramDataSet;
		} // else: Use the cache data for now, but also fetch new data from API
	}
	
	API.get({
		action: "templatedata",
		titles: prefixedText,
		redirects: 1,
		includeMissingTitles: 1
	})
		.then(
			function(response) { return response; },
			function(/*error*/) { return null; } // Ignore errors, will use default data
		)
		.then( function(result) {
		// Figure out page id (beacuse action=templatedata doesn't have an indexpageids option)
			var id = result && $.map(result.pages, function( _value, key ) { return key; });
		
			if ( !result || !result.pages[id] || result.pages[id].notemplatedata || !result.pages[id].params ) {
			// No TemplateData, so use defaults (guesses)
				self.notemplatedata = true;
				self.templatedataApiError = !result;
				self.paramData = config.defaultParameterData;
			} else {
				self.paramData = result.pages[id].params;
			}
        
			self.paramAliases = {};
			$.each(self.paramData, function(paraName, paraData) {
				// Extract aliases for easier reference later on
				if ( paraData.aliases && paraData.aliases.length ) {
					paraData.aliases.forEach(function(alias){
						self.paramAliases[alias] = paraName;
					});
				}
				// Extract allowed values array from description
				if ( paraData.description && /\[.*'.+?'.*?\]/.test(paraData.description.en) ) {
					try {
						var allowedVals = JSON.parse(
							paraData.description.en
								.replace(/^.*\[/,"[")
								.replace(/"/g, "\\\"")
								.replace(/'/g, "\"")
								.replace(/,\s*]/, "]")
								.replace(/].*$/, "]")
						);
						self.paramData[paraName].allowedValues = allowedVals;
					} catch(e) {
						console.warn("[Rater] Could not parse allowed values in description:\n  "+
					paraData.description.en + "\n Check TemplateData for parameter |" + paraName +
					"= in " + self.getTitle().getPrefixedText());
					}
				}
			});
		
			// Make suggestions for combobox
			var allParamsArray = ( !self.notemplatedata && result.pages[id].paramOrder ) ||
			$.map(self.paramData, function(_val, key){
				return key;
			});
			self.parameterSuggestions = allParamsArray.filter(function(paramName) {
				return ( paramName && paramName !== "class" && paramName !== "importance" );
			})
				.map(function(paramName) {
					var optionObject = {data: paramName};
					var label = self.getDataForParam(label, paramName);
					if ( label ) {
						optionObject.label = label + " (|" + paramName + "=)";
					}
					return optionObject;
				});
		
			if ( self.templatedataApiError ) {
				// Don't save defaults/guesses to cache;
				return true;
			}
		
			cache.write(prefixedText + "-params", {
				notemplatedata: self.notemplatedata,
				paramData: self.paramData,
				parameterSuggestions: self.parameterSuggestions,
				paramAliases: self.paramAliases
			},	1
			);
			return true;
		})
		.then(
			paramDataSet.resolve,
			paramDataSet.reject
		);
	
	return paramDataSet;	
};

var makeListAs = function(subjectTitle) {
	var name = subjectTitle.getMainText().replace(/\s\(.*\)/, "");
	if ( name.indexOf(" ") === -1 ) {
		return name;
	}
	var generationalSuffix = "";
	if ( / (?:[JS]r.?|[IVX]+)$/.test(name) ) {
		generationalSuffix = name.slice(name.lastIndexOf(" "));
		name = name.slice(0, name.lastIndexOf(" "));
		if ( name.indexOf(" ") === -1 ) {
			return name + generationalSuffix;
		}
	}
	var lastName = name.slice(name.lastIndexOf(" ")+1).replace(/,$/, "");
	var otherNames = name.slice(0, name.lastIndexOf(" "));
	return lastName + ", " + otherNames + generationalSuffix;
};

Template.prototype.addMissingParams = function() {
	var thisTemplate = this;

	// Autofill listas parameter for WP:BIO
	var isBiographyBanner = this.getTitle().getMainText() === "WikiProject Biography" ||
		(this.redirectTarget && this.redirectTarget.getMainText() === "WikiProject Biography");

	if (isBiographyBanner && !this.getParam("listas")) {
		var subjectTitle = mw.Title.newFromText(config.mw.wgPageName).getSubjectPage();
		this.parameters.push({
			name: "listas",
			value: makeListAs(subjectTitle),
			autofilled: true,
		});
	}

	// Make sure required/suggested parameters are present
	$.each(thisTemplate.paramData, function(paraName, paraData) {
		if ( (paraData.required || paraData.suggested) && !thisTemplate.getParam(paraName) ) {
			// Check if already present in an alias, if any
			if ( paraData.aliases.length ) {
				var aliases = thisTemplate.parameters.filter(p => {
					var isAlias = paraData.aliases.includes(p.name);
					var isEmpty = !p.value;
					return isAlias && !isEmpty;
				});
				if ( aliases.length ) {
				// At least one non-empty alias, so do nothing
					return;
				}
			}
			// No non-empty aliases, so add this to the parameters list (with
			// value set parameter to either the autovaule, or as null).
			// Also set that it was autofilled.
			thisTemplate.parameters.push({
				name:paraName,
				value: paraData.autovalue || null,
				autofilled: true,
			});
		}
	});

	return thisTemplate;
};

Template.prototype.setClassesAndImportances = function() {
	var parsed = $.Deferred();

	// Don't re-parse if already parsed; no need to parse shell templates or banners without ratings
	if ( (this.classes && this.importances) || this.isShellTemplate() || this.withoutRatings ) {
		return parsed.resolve();
	}

	var mainText = this.getTitle().getMainText();

	// Some projects have hardcoded values, to avoid standard classes or to prevent API issues (timeout and/or node count exceeded)
	const redirectTargetOrMainText = this.redirectTarget ? this.redirectTarget.getMainText() : mainText;
	if ( config.customBanners[redirectTargetOrMainText] ) {
		this.classes = config.customBanners[redirectTargetOrMainText].classes;
		this.importances = config.customBanners[redirectTargetOrMainText].importances;
		return parsed.resolve();
	}

	// Otherwise try reading from cached data
	var cachedRatings = cache.read(mainText+"-ratings");
	if (
		cachedRatings &&
		cachedRatings.value &&
		cachedRatings.staleDate &&
		cachedRatings.value.classes!=null &&
		cachedRatings.value.importances!=null
	) {
		this.classes = cachedRatings.value.classes;
		this.importances = cachedRatings.value.importances;
		parsed.resolve();
		if ( !isAfterDate(cachedRatings.staleDate) ) {
			// Just use the cached data
			return parsed;
		} // else: Use the cache data for now, but also fetch new data from API
	}

	var wikitextToParse = "";	
	config.bannerDefaults.extendedClasses.forEach(function(classname, index) {
		wikitextToParse += "{{" + mainText + "|class=" + classname + "|importance=" +
		(config.bannerDefaults.extendedImportances[index] || "") + "}}/n";
	});
	
	return API.get({
		action: "parse",
		title: "Talk:Sandbox",
		text: wikitextToParse,
		prop: "categorieshtml"
	})
		.then((result) => {
			var catsHtml = result.parse.categorieshtml["*"];
			var extendedClasses = config.bannerDefaults.extendedClasses.filter(function(cl) {
				return catsHtml.indexOf(cl+"-Class") !== -1;
			});
			this.classes = [...config.bannerDefaults.classes, ...extendedClasses];
			this.importances = config.bannerDefaults.extendedImportances.filter(function(imp) {
				return catsHtml.indexOf(imp+"-importance") !== -1;
			});
			cache.write(mainText+"-ratings",
				{
					classes: this.classes,
					importances: this.importances
				},
				1
			);
			return true;
		});
};

export {Template, parseTemplates, getWithRedirectTo};
// </nowiki>