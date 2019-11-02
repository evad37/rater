(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

var _setup = _interopRequireDefault(require("./setup"));

var _autostart = _interopRequireDefault(require("./autostart"));

var _css = _interopRequireDefault(require("./css.js"));

var _util = require("./util");

var _windowManager = _interopRequireDefault(require("./windowManager"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

(function App() {
  console.log("Rater's App.js is running...");
  mw.util.addCSS(_css["default"]);

  var showMainWindow = function showMainWindow(data) {
    if (!data || !data.success) {
      return;
    }

    _windowManager["default"].openWindow("main", data);
  };

  var showSetupError = function showSetupError(code, jqxhr) {
    return OO.ui.alert((0, _util.makeErrorMsg)(code, jqxhr), {
      title: "Rater failed to open"
    });
  }; // Invocation by portlet link 


  mw.util.addPortletLink("p-cactions", "#", "Rater", "ca-rater", "Rate quality and importance", "5");
  $("#ca-rater").click(function () {
    return (0, _setup["default"])().then(showMainWindow, showSetupError);
  }); // Invocation by auto-start (do not show message on error)

  (0, _autostart["default"])().then(showMainWindow);
})();

},{"./autostart":10,"./css.js":13,"./setup":15,"./util":16,"./windowManager":17}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getWithRedirectTo = exports.parseTemplates = exports.Template = void 0;

var _util = require("./util");

var _config = _interopRequireDefault(require("./config"));

var cache = _interopRequireWildcard(require("./cache"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

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
var Template = function Template(wikitext) {
  this.wikitext = wikitext;
  this.parameters = [];
};

exports.Template = Template;

Template.prototype.addParam = function (name, val, wikitext) {
  this.parameters.push({
    "name": name,
    "value": val,
    "wikitext": "|" + wikitext
  });
};
/**
 * Get a parameter data by parameter name
 */


Template.prototype.getParam = function (paramName) {
  return this.parameters.find(function (p) {
    return p.name == paramName;
  });
};

Template.prototype.setName = function (name) {
  this.name = name.trim();
};

Template.prototype.getTitle = function () {
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


var parseTemplates = function parseTemplates(wikitext, recursive) {
  /* eslint-disable no-control-regex */
  if (!wikitext) {
    return [];
  }

  var strReplaceAt = function strReplaceAt(string, index, _char) {
    return string.slice(0, index) + _char + string.slice(index + 1);
  };

  var result = [];

  var processTemplateText = function processTemplateText(startIdx, endIdx) {
    var text = wikitext.slice(startIdx, endIdx);
    var template = new Template("{{" + text.replace(/\x01/g, "|") + "}}"); // swap out pipe in links with \x01 control character
    // [[File: ]] can have multiple pipes, so might need multiple passes

    while (/(\[\[[^\]]*?)\|(.*?\]\])/g.test(text)) {
      text = text.replace(/(\[\[[^\]]*?)\|(.*?\]\])/g, "$1\x01$2");
    }

    var chunks = text.split("|").map(function (chunk) {
      // change '\x01' control characters back to pipes
      return chunk.replace(/\x01/g, "|");
    });
    template.setName(chunks[0]);
    var parameterChunks = chunks.slice(1);
    var unnamedIdx = 1;
    parameterChunks.forEach(function (chunk) {
      var indexOfEqualTo = chunk.indexOf("=");
      var indexOfOpenBraces = chunk.indexOf("{{");
      var isWithoutEquals = !chunk.includes("=");
      var hasBracesBeforeEquals = chunk.includes("{{") && indexOfOpenBraces < indexOfEqualTo;
      var isUnnamedParam = isWithoutEquals || hasBracesBeforeEquals;
      var pName, pNum, pVal;

      if (isUnnamedParam) {
        // Get the next number not already used by either an unnamed parameter, or by a
        // named parameter like `|1=val`
        while (template.getParam(unnamedIdx)) {
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

  var n = wikitext.length; // number of unclosed braces

  var numUnclosed = 0; // are we inside a comment or between nowiki tags?

  var inComment = false;
  var inNowiki = false;
  var startIdx, endIdx;

  for (var i = 0; i < n; i++) {
    if (!inComment && !inNowiki) {
      if (wikitext[i] === "{" && wikitext[i + 1] === "{") {
        if (numUnclosed === 0) {
          startIdx = i + 2;
        }

        numUnclosed += 2;
        i++;
      } else if (wikitext[i] === "}" && wikitext[i + 1] === "}") {
        if (numUnclosed === 2) {
          endIdx = i;
          processTemplateText(startIdx, endIdx);
        }

        numUnclosed -= 2;
        i++;
      } else if (wikitext[i] === "|" && numUnclosed > 2) {
        // swap out pipes in nested templates with \x01 character
        wikitext = strReplaceAt(wikitext, i, "\x01");
      } else if (/^<!--/.test(wikitext.slice(i, i + 4))) {
        inComment = true;
        i += 3;
      } else if (/^<nowiki ?>/.test(wikitext.slice(i, i + 9))) {
        inNowiki = true;
        i += 7;
      }
    } else {
      // we are in a comment or nowiki
      if (wikitext[i] === "|") {
        // swap out pipes with \x01 character
        wikitext = strReplaceAt(wikitext, i, "\x01");
      } else if (/^-->/.test(wikitext.slice(i, i + 3))) {
        inComment = false;
        i += 2;
      } else if (/^<\/nowiki ?>/.test(wikitext.slice(i, i + 10))) {
        inNowiki = false;
        i += 8;
      }
    }
  }

  if (recursive) {
    var subtemplates = result.map(function (template) {
      return template.wikitext.slice(2, -2);
    }).filter(function (templateWikitext) {
      return /\{\{.*\}\}/.test(templateWikitext);
    }).map(function (templateWikitext) {
      return parseTemplates(templateWikitext, true);
    });
    return result.concat.apply(result, subtemplates);
  }

  return result;
};
/* eslint-enable no-control-regex */

/**
 * @param {Template|Template[]} templates
 * @return {Promise<Template>|Promise<Template[]>}
 */


exports.parseTemplates = parseTemplates;

var getWithRedirectTo = function getWithRedirectTo(templates) {
  var templatesArray = Array.isArray(templates) ? templates : [templates];

  if (templatesArray.length === 0) {
    return $.Deferred().resolve([]);
  }

  return _util.API.get({
    "action": "query",
    "format": "json",
    "titles": templatesArray.map(function (template) {
      return template.getTitle().getPrefixedText();
    }),
    "redirects": 1
  }).then(function (result) {
    if (!result || !result.query) {
      return $.Deferred().reject("Empty response");
    }

    if (result.query.redirects) {
      result.query.redirects.forEach(function (redirect) {
        var i = templatesArray.findIndex(function (template) {
          return template.getTitle().getPrefixedText() === redirect.from;
        });

        if (i !== -1) {
          templatesArray[i].redirectTarget = mw.Title.newFromText(redirect.to);
        }
      });
    }

    return Array.isArray(templates) ? templatesArray : templatesArray[0];
  });
};

exports.getWithRedirectTo = getWithRedirectTo;

Template.prototype.getDataForParam = function (key, paraName) {
  if (!this.paramData) {
    return null;
  } // If alias, switch from alias to preferred parameter name


  var para = this.paramAliases[paraName] || paraName;

  if (!this.paramData[para]) {
    return;
  }

  var data = this.paramData[para][key]; // Data might actually be an object with key "en"

  if (data && data.en && !Array.isArray(data)) {
    return data.en;
  }

  return data;
};

Template.prototype.setParamDataAndSuggestions = function () {
  var self = this;
  var paramDataSet = $.Deferred();

  if (self.paramData) {
    return paramDataSet.resolve();
  }

  var prefixedText = self.redirectTarget ? self.redirectTarget.getPrefixedText() : self.getTitle().getPrefixedText();
  var cachedInfo = cache.read(prefixedText + "-params");

  if (cachedInfo && cachedInfo.value && cachedInfo.staleDate && cachedInfo.value.paramData != null && cachedInfo.value.parameterSuggestions != null && cachedInfo.value.paramAliases != null) {
    self.notemplatedata = cachedInfo.value.notemplatedata;
    self.paramData = cachedInfo.value.paramData;
    self.parameterSuggestions = cachedInfo.value.parameterSuggestions;
    self.paramAliases = cachedInfo.value.paramAliases;
    paramDataSet.resolve();

    if (!(0, _util.isAfterDate)(cachedInfo.staleDate)) {
      // Just use the cached data
      return paramDataSet;
    } // else: Use the cache data for now, but also fetch new data from API

  }

  _util.API.get({
    action: "templatedata",
    titles: prefixedText,
    redirects: 1,
    includeMissingTitles: 1
  }).then(function (response) {
    return response;
  }, function ()
  /*error*/
  {
    return null;
  } // Ignore errors, will use default data
  ).then(function (result) {
    // Figure out page id (beacuse action=templatedata doesn't have an indexpageids option)
    var id = result && $.map(result.pages, function (_value, key) {
      return key;
    });

    if (!result || !result.pages[id] || result.pages[id].notemplatedata || !result.pages[id].params) {
      // No TemplateData, so use defaults (guesses)
      self.notemplatedata = true;
      self.templatedataApiError = !result;
      self.paramData = _config["default"].defaultParameterData;
    } else {
      self.paramData = result.pages[id].params;
    }

    self.paramAliases = {};
    $.each(self.paramData, function (paraName, paraData) {
      // Extract aliases for easier reference later on
      if (paraData.aliases && paraData.aliases.length) {
        paraData.aliases.forEach(function (alias) {
          self.paramAliases[alias] = paraName;
        });
      } // Extract allowed values array from description


      if (paraData.description && /\[.*'.+?'.*?\]/.test(paraData.description.en)) {
        try {
          var allowedVals = JSON.parse(paraData.description.en.replace(/^.*\[/, "[").replace(/"/g, "\\\"").replace(/'/g, "\"").replace(/,\s*]/, "]").replace(/].*$/, "]"));
          self.paramData[paraName].allowedValues = allowedVals;
        } catch (e) {
          console.warn("[Rater] Could not parse allowed values in description:\n  " + paraData.description.en + "\n Check TemplateData for parameter |" + paraName + "= in " + self.getTitle().getPrefixedText());
        }
      } // Make sure required/suggested parameters are present


      if ((paraData.required || paraData.suggested) && !self.getParam(paraName)) {
        // Check if already present in an alias, if any
        if (paraData.aliases.length) {
          var aliases = self.parameters.filter(function (p) {
            var isAlias = paraData.aliases.includes(p.name);
            var isEmpty = !p.val;
            return isAlias && !isEmpty;
          });

          if (aliases.length) {
            // At least one non-empty alias, so do nothing
            return;
          }
        } // No non-empty aliases, so set parameter to either the autovaule, or
        // an empty string (without touching, unless it is a required parameter)


        self.parameters.push({
          name: paraName,
          value: paraData.autovalue || "",
          autofilled: true
        });
      }
    }); // Make suggestions for combobox

    var allParamsArray = !self.notemplatedata && result.pages[id].paramOrder || $.map(self.paramData, function (_val, key) {
      return key;
    });
    self.parameterSuggestions = allParamsArray.filter(function (paramName) {
      return paramName && paramName !== "class" && paramName !== "importance";
    }).map(function (paramName) {
      var optionObject = {
        data: paramName
      };
      var label = self.getDataForParam(label, paramName);

      if (label) {
        optionObject.label = label + " (|" + paramName + "=)";
      }

      return optionObject;
    });

    if (self.templatedataApiError) {
      // Don't save defaults/guesses to cache;
      return true;
    }

    cache.write(prefixedText + "-params", {
      notemplatedata: self.notemplatedata,
      paramData: self.paramData,
      parameterSuggestions: self.parameterSuggestions,
      paramAliases: self.paramAliases
    }, 1);
    return true;
  }).then(paramDataSet.resolve, paramDataSet.reject);

  return paramDataSet;
};

Template.prototype.setClassesAndImportances = function () {
  var _this = this;

  var parsed = $.Deferred();

  if (this.classes && this.importances) {
    return parsed.resolve();
  }

  var mainText = this.getTitle().getMainText();
  var cachedRatings = cache.read(mainText + "-ratings");

  if (cachedRatings && cachedRatings.value && cachedRatings.staleDate && cachedRatings.value.classes != null && cachedRatings.value.importances != null) {
    this.classes = cachedRatings.value.classes;
    this.importances = cachedRatings.value.importances;
    parsed.resolve();

    if (!(0, _util.isAfterDate)(cachedRatings.staleDate)) {
      // Just use the cached data
      return parsed;
    } // else: Use the cache data for now, but also fetch new data from API

  }

  var wikitextToParse = "";

  _config["default"].bannerDefaults.extendedClasses.forEach(function (classname, index) {
    wikitextToParse += "{{" + mainText + "|class=" + classname + "|importance=" + (_config["default"].bannerDefaults.extendedImportances[index] || "") + "}}/n";
  });

  return _util.API.get({
    action: "parse",
    title: "Talk:Sandbox",
    text: wikitextToParse,
    prop: "categorieshtml"
  }).then(function (result) {
    var redirectOrMainText = _this.redirectTarget ? _this.redirectTarget.getMainText() : mainText;
    var catsHtml = result.parse.categorieshtml["*"];

    var extendedClasses = _config["default"].bannerDefaults.extendedClasses.filter(function (cl) {
      return catsHtml.indexOf(cl + "-Class") !== -1;
    });

    var defaultClasses = redirectOrMainText === "WikiProject Portals" ? ["List"] : _config["default"].bannerDefaults.classes;
    var customClasses = _config["default"].customClasses[redirectOrMainText] || [];
    _this.classes = [].concat(customClasses, defaultClasses, extendedClasses);
    _this.importances = _config["default"].bannerDefaults.extendedImportances.filter(function (imp) {
      return catsHtml.indexOf(imp + "-importance") !== -1;
    });
    cache.write(mainText + "-ratings", {
      classes: _this.classes,
      importances: _this.importances
    }, 1);
    return true;
  });
};

},{"./cache":11,"./config":12,"./util":16}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var BannerListWidget = function BannerListWidget(config) {
  config = config || {}; // Call parent constructor

  BannerListWidget.parent.call(this, config);
  OO.ui.mixin.GroupElement.call(this, {
    $group: this.$element
  });
  this.aggregate({
    remove: "bannerRemove"
  });
  this.connect(this, {
    bannerRemove: "onBannerRemove"
  });
};

OO.inheritClass(BannerListWidget, OO.ui.Widget);
OO.mixinClass(BannerListWidget, OO.ui.mixin.GroupElement);
/*
methods from mixin:
 - addItems( items, [index] ) : OO.ui.Element  (CHAINABLE)
 - clearItems( ) : OO.ui.Element  (CHAINABLE)
 - findItemFromData( data ) : OO.ui.Element|null
 - findItemsFromData( data ) : OO.ui.Element[]
 - removeItems( items ) : OO.ui.Element  (CHAINABLE)
*/

BannerListWidget.prototype.onBannerRemove = function (banner) {
  this.removeItems([banner]);
};

var _default = BannerListWidget;
exports["default"] = _default;

},{}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ParameterListWidget = _interopRequireDefault(require("./ParameterListWidget"));

var _ParameterWidget = _interopRequireDefault(require("./ParameterWidget"));

var _SuggestionLookupTextInputWidget = _interopRequireDefault(require("./SuggestionLookupTextInputWidget"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

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
function BannerWidget(template, config) {
  var _this = this;

  // Configuration initialization
  config = config || {}; // Call parent constructor

  BannerWidget["super"].call(this, config);
  this.template = template;
  /* --- TITLE AND RATINGS --- */

  this.removeButton = new OO.ui.ButtonWidget({
    icon: "trash",
    label: "Remove banner",
    title: "Remove banner",
    flags: "destructive",
    $element: $("<div style=\"width:100%\">")
  });
  this.clearButton = new OO.ui.ButtonWidget({
    icon: "cancel",
    label: "Clear parameters",
    title: "Clear parameters",
    flags: "destructive",
    $element: $("<div style=\"width:100%\">")
  });
  this.bypassButton = new OO.ui.ButtonWidget({
    icon: "articleRedirect",
    label: "Bypass redirect",
    title: "Bypass redirect",
    $element: $("<div style=\"width:100%\">")
  });
  this.removeButton.$element.find("a").css("width", "100%");
  this.clearButton.$element.find("a").css("width", "100%");
  this.bypassButton.$element.find("a").css("width", "100%");
  this.titleButtonsGroup = new OO.ui.ButtonGroupWidget({
    items: template.redirectTarget ? [this.removeButton, this.clearButton, this.bypassButton] : [this.removeButton, this.clearButton],
    $element: $("<span style='width:100%;'>")
  });
  this.mainLabelPopupButton = new OO.ui.PopupButtonWidget({
    label: "{{" + this.template.getTitle().getMainText() + "}}",
    $element: $("<span style='display:inline-block;width:48%;margin-right:0;padding-right:8px'>"),
    indicator: "down",
    framed: false,
    popup: {
      $content: this.titleButtonsGroup.$element,
      width: 200,
      padded: false,
      align: "force-right",
      anchor: false
    }
  });
  this.mainLabelPopupButton.$element.children("a").first().css({
    "font-size": "110%"
  }).find("span.oo-ui-labelElement-label").css({
    "white-space": "normal"
  }); // Rating dropdowns

  this.classDropdown = new OO.ui.DropdownWidget({
    label: new OO.ui.HtmlSnippet("<span style=\"color:#777\">Class</span>"),
    menu: {
      // FIXME: needs real data
      items: [new OO.ui.MenuOptionWidget({
        data: "",
        label: " "
      }), new OO.ui.MenuOptionWidget({
        data: "B",
        label: "B"
      }), new OO.ui.MenuOptionWidget({
        data: "C",
        label: "C"
      }), new OO.ui.MenuOptionWidget({
        data: "start",
        label: "Start"
      })]
    },
    $element: $("<span style='display:inline-block;width:24%'>"),
    $overlay: this.$overlay
  });
  this.importanceDropdown = new OO.ui.DropdownWidget({
    label: new OO.ui.HtmlSnippet("<span style=\"color:#777\">Importance</span>"),
    menu: {
      // FIXME: needs real data
      items: [new OO.ui.MenuOptionWidget({
        data: "",
        label: " "
      }), new OO.ui.MenuOptionWidget({
        data: "top",
        label: "Top"
      }), new OO.ui.MenuOptionWidget({
        data: "high",
        label: "High"
      }), new OO.ui.MenuOptionWidget({
        data: "mid",
        label: "Mid"
      })]
    },
    $element: $("<span style='display:inline-block;width:24%'>"),
    $overlay: this.$overlay
  });
  this.titleLayout = new OO.ui.HorizontalLayout({
    items: [this.mainLabelPopupButton, this.classDropdown, this.importanceDropdown]
  });
  /* --- PARAMETERS LIST --- */

  var parameterWidgets = this.template.parameters.filter(function (param) {
    return param.name !== "class" && param.name !== "importance";
  }).map(function (param) {
    return new _ParameterWidget["default"](param, _this.template.paramData[param.name]);
  });
  this.parameterList = new _ParameterListWidget["default"]({
    items: parameterWidgets,
    displayLimit: 6
  });
  /* --- ADD PARAMETER SECTION --- */

  this.addParameterNameInput = new _SuggestionLookupTextInputWidget["default"]({
    suggestions: this.template.parameterSuggestions,
    placeholder: "parameter name",
    $element: $("<div style='display:inline-block;width:40%'>"),
    validate: function (val) {
      var _this$getAddParameter = this.getAddParametersInfo(val),
          validName = _this$getAddParameter.validName,
          name = _this$getAddParameter.name,
          value = _this$getAddParameter.value;

      return !name && !value ? true : validName;
    }.bind(this)
  });
  this.addParameterValueInput = new _SuggestionLookupTextInputWidget["default"]({
    placeholder: "parameter value",
    $element: $("<div style='display:inline-block;width:40%'>"),
    validate: function (val) {
      var _this$getAddParameter2 = this.getAddParametersInfo(null, val),
          validValue = _this$getAddParameter2.validValue,
          name = _this$getAddParameter2.name,
          value = _this$getAddParameter2.value;

      return !name && !value ? true : validValue;
    }.bind(this)
  });
  this.addParameterButton = new OO.ui.ButtonWidget({
    label: "Add",
    icon: "add",
    flags: "progressive"
  }).setDisabled(true);
  this.addParameterControls = new OO.ui.HorizontalLayout({
    items: [this.addParameterNameInput, new OO.ui.LabelWidget({
      label: "="
    }), this.addParameterValueInput, this.addParameterButton]
  }); // Hacks to make this HorizontalLayout go inside a FieldLayout

  this.addParameterControls.getInputId = function () {
    return false;
  };

  this.addParameterControls.isDisabled = function () {
    return false;
  };

  this.addParameterControls.simulateLabelClick = function () {
    return true;
  };

  this.addParameterLayout = new OO.ui.FieldLayout(this.addParameterControls, {
    label: "Add parameter:",
    align: "top"
  }).toggle(false); // And another hack

  this.addParameterLayout.$element.find(".oo-ui-fieldLayout-messages").css({
    "clear": "both",
    "padding-top": 0
  });
  /* --- OVERALL LAYOUT/DISPLAY --- */
  // Display the layout elements, and a rule

  this.$element.append(this.titleLayout.$element, this.parameterList.$element, this.addParameterLayout.$element, $("<hr>"));
  /* --- EVENT HANDLING --- */

  this.parameterList.connect(this, {
    "addParametersButtonClick": "showAddParameterInputs"
  });
  this.addParameterButton.connect(this, {
    "click": "onParameterAdd"
  });
  this.addParameterNameInput.connect(this, {
    "change": "onAddParameterNameChange"
  });
  this.addParameterValueInput.connect(this, {
    "change": "onAddParameterValueChange"
  });
  this.removeButton.connect(this, {
    "click": "onRemoveButtonClick"
  });
}

OO.inheritClass(BannerWidget, OO.ui.Widget);

BannerWidget.prototype.showAddParameterInputs = function () {
  this.addParameterLayout.toggle(true);
};

BannerWidget.prototype.getAddParametersInfo = function (nameInputVal, valueInputVal) {
  var name = nameInputVal && nameInputVal.trim() || this.addParameterNameInput.getValue().trim();
  var paramAlreadyIncluded = name === "class" || name === "importance" || this.parameterList.items.some(function (paramWidget) {
    return paramWidget.parameter && paramWidget.parameter.name === name;
  });
  var value = valueInputVal && valueInputVal.trim() || this.addParameterValueInput.getValue().trim();
  var autovalue = name && this.template.paramData[name] && this.template.paramData[name].autovalue || null;
  return {
    validName: !!(name && !paramAlreadyIncluded),
    validValue: !!(value || autovalue),
    isAutovalue: !!(!value && autovalue),
    isAlreadyIncluded: !!(name && paramAlreadyIncluded),
    name: name,
    value: value,
    autovalue: autovalue
  };
};

BannerWidget.prototype.onAddParameterNameChange = function () {
  var _this$getAddParameter3 = this.getAddParametersInfo(),
      validName = _this$getAddParameter3.validName,
      validValue = _this$getAddParameter3.validValue,
      isAutovalue = _this$getAddParameter3.isAutovalue,
      isAlreadyIncluded = _this$getAddParameter3.isAlreadyIncluded,
      name = _this$getAddParameter3.name,
      autovalue = _this$getAddParameter3.autovalue; // Set value input placeholder as the autovalue


  this.addParameterValueInput.$input.attr("placeholder", autovalue || ""); // Set suggestions, if the parameter has a list of allowed values

  var allowedValues = this.template.paramData[name] && this.template.paramData[name].allowedValues && this.template.paramData[name].allowedValues.map(function (val) {
    return {
      data: val,
      label: val
    };
  });
  this.addParameterValueInput.setSuggestions(allowedValues || []); // Set button disabled state based on validity

  this.addParameterButton.setDisabled(!validName || !validValue); // Show notice if autovalue will be used

  this.addParameterLayout.setNotices(validName && isAutovalue ? ["Parameter value will be autofilled"] : []); // Show error is the banner already has the parameter set

  this.addParameterLayout.setErrors(isAlreadyIncluded ? ["Parameter is already present"] : []);
};

BannerWidget.prototype.onAddParameterValueChange = function () {
  var _this$getAddParameter4 = this.getAddParametersInfo(),
      validName = _this$getAddParameter4.validName,
      validValue = _this$getAddParameter4.validValue,
      isAutovalue = _this$getAddParameter4.isAutovalue;

  this.addParameterButton.setDisabled(!validName || !validValue);
  this.addParameterLayout.setNotices(validName && isAutovalue ? ["Parameter value will be autofilled"] : []);
};

BannerWidget.prototype.onParameterAdd = function () {
  var _this$getAddParameter5 = this.getAddParametersInfo(),
      validName = _this$getAddParameter5.validName,
      validValue = _this$getAddParameter5.validValue,
      name = _this$getAddParameter5.name,
      value = _this$getAddParameter5.value,
      autovalue = _this$getAddParameter5.autovalue;

  if (!validName || !validValue) {
    // Error should already be shown via onAddParameter...Change methods
    return;
  }

  var newParameter = new _ParameterWidget["default"]({
    "name": name,
    "value": value || autovalue
  }, this.template.paramData[name]);
  this.parameterList.addItems([newParameter]);
  this.addParameterNameInput.setValue("");
  this.addParameterValueInput.setValue("");
  this.addParameterNameInput.focus();
};

BannerWidget.prototype.onRemoveButtonClick = function () {
  this.emit("remove");
};

var _default = BannerWidget;
exports["default"] = _default;

},{"./ParameterListWidget":5,"./ParameterWidget":6,"./SuggestionLookupTextInputWidget":7}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

/**
 * @cfg {OO.ui.Element[]} items Items to be added
 * @cfg {Number} displayLimit The most to show at once. If the number of items
 *  is more than this, then only the first (displayLimit - 1) items are shown.
 */
var ParameterListWidget = function ParameterListWidget(config) {
  config = config || {}; // Call parent constructor

  ParameterListWidget.parent.call(this, config);
  OO.ui.mixin.GroupElement.call(this, {
    $group: this.$element
  });
  this.addItems(config.items); // Hide some parameters (initially), if more than set display limit

  if (config.displayLimit && this.items.length > config.displayLimit) {
    var hideFromNumber = config.displayLimit - 1; // One-indexed

    var hideFromIndex = hideFromNumber - 1; // Zero-indexed

    for (var i = hideFromIndex; i < this.items.length; i++) {
      this.items[i].toggle(false);
    } // Add button to show the hidden params


    this.showMoreParametersButton = new OO.ui.ButtonWidget({
      label: "Show " + (this.items.length - config.displayLimit - 1) + " more paramters",
      framed: false,
      $element: $("<span style='margin-bottom:0'>")
    });
    this.addItems([this.showMoreParametersButton]);
  } // Add the button that allows user to add more parameters


  this.addParametersButton = new OO.ui.ButtonWidget({
    label: "Add paramter",
    icon: "add",
    framed: false,
    $element: $("<span style='margin-bottom:0'>")
  });
  this.addItems([this.addParametersButton]); // Handle delete events from ParameterWidgets

  this.aggregate({
    "delete": "parameterDelete"
  });
  this.connect(this, {
    parameterDelete: "onParameterDelete"
  }); // Handle button clicks

  if (this.showMoreParametersButton) {
    this.showMoreParametersButton.connect(this, {
      "click": "onShowMoreParametersButtonClick"
    });
  }

  this.addParametersButton.connect(this, {
    "click": "onAddParametersButtonClick"
  });
};

OO.inheritClass(ParameterListWidget, OO.ui.Widget);
OO.mixinClass(ParameterListWidget, OO.ui.mixin.GroupElement);
/*
methods from mixin:
 - addItems( items, [index] ) : OO.ui.Element  (CHAINABLE)
 - clearItems( ) : OO.ui.Element  (CHAINABLE)
 - findItemFromData( data ) : OO.ui.Element|null
 - findItemsFromData( data ) : OO.ui.Element[]
 - removeItems( items ) : OO.ui.Element  (CHAINABLE)
*/

ParameterListWidget.prototype.onParameterDelete = function (parameter) {
  this.removeItems([parameter]);
};

ParameterListWidget.prototype.getParameterItems = function () {
  return this.items.filter(function (item) {
    return item.constructor.name === "ParameterWidget";
  });
};

ParameterListWidget.prototype.onShowMoreParametersButtonClick = function () {
  this.removeItems([this.showMoreParametersButton]);
  this.items.forEach(function (parameterWidget) {
    return parameterWidget.toggle(true);
  });
};

ParameterListWidget.prototype.onAddParametersButtonClick = function () {
  this.removeItems([this.addParametersButton]);
  this.emit("addParametersButtonClick");
};

var _default = ParameterListWidget;
exports["default"] = _default;

},{}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function ParameterWidget(parameter, paramData, config) {
  // Configuration initialization
  config = config || {}; // Call parent constructor

  ParameterWidget["super"].call(this, config);
  this.parameter = parameter;
  this.paramData = paramData || {}; // Make the input. Type can be checkbox, or dropdown, or text input,
  // depending on number of allowed values in param data.

  this.allowedValues = paramData && paramData.allowedValues || []; // switch (true) {
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

  this.input = new OO.ui.ComboBoxInputWidget({
    value: this.parameter.value,
    // label: parameter.name + " =",
    // labelPosition: "before",
    options: this.allowedValues.map(function (val) {
      return {
        data: val,
        label: val
      };
    }),
    $element: $("<div style='width:calc(100% - 70px);margin-right:0;'>") // the 70px leaves room for buttons

  }); // Reduce the excessive whitespace/height

  this.input.$element.find("input").css({
    "padding-top": 0,
    "padding-bottom": "2px",
    "height": "24px"
  }); // Fix label positioning within the reduced height

  this.input.$element.find("span.oo-ui-labelElement-label").css({
    "line-height": "normal"
  }); // Also reduce height of dropdown button (if options are present)

  this.input.$element.find("a.oo-ui-buttonElement-button").css({
    "padding-top": 0,
    "height": "24px",
    "min-height": "0"
  }); //var description = this.paramData[parameter.name] && this.paramData[parameter.name].label && this.paramData[parameter.name].label.en;
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
    items: [this.input, this.confirmButton, this.deleteButton] //$element: $("<div style='width: 48%;margin:0;'>")

  }); // Hacks to make this HorizontalLayout go inside a FieldLayout

  this.editLayoutControls.getInputId = function () {
    return false;
  };

  this.editLayoutControls.isDisabled = function () {
    return false;
  };

  this.editLayoutControls.simulateLabelClick = function () {
    return true;
  };

  this.editLayout = new OO.ui.FieldLayout(this.editLayoutControls, {
    label: this.parameter.name + " =",
    align: "top",
    help: this.paramData.description && this.paramData.description.en || false,
    helpInline: true
  }).toggle();
  this.editLayout.$element.find("label.oo-ui-inline-help").css({
    "margin": "-10px 0 5px 10px"
  });
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
    items: [this.fullLabel, this.editButton],
    $element: $("<span style='margin:0;width:unset;'>")
  });
  this.$element = $("<div>").css({
    "width": "unset",
    "display": "inline-block",
    "border": "1px solid #ddd",
    "border-radius": "10px",
    "padding-left": "10px",
    "margin": "0 8px 8px 0"
  }).append(this.readLayout.$element, this.editLayout.$element);
  this.editButton.connect(this, {
    "click": "onEditClick"
  });
  this.confirmButton.connect(this, {
    "click": "onConfirmClick"
  });
  this.deleteButton.connect(this, {
    "click": "onDeleteClick"
  });
}

OO.inheritClass(ParameterWidget, OO.ui.Widget);

ParameterWidget.prototype.onEditClick = function () {
  this.readLayout.toggle(false);
  this.editLayout.toggle(true);
  this.input.focus();
};

ParameterWidget.prototype.onConfirmClick = function () {
  this.parameter.value = this.input.getValue();
  this.fullLabel.setLabel(this.parameter.name + " = " + this.parameter.value);
  this.readLayout.toggle(true);
  this.editLayout.toggle(false);
};

ParameterWidget.prototype.onDeleteClick = function () {
  this.emit("delete");
};

ParameterWidget.prototype.focusInput = function () {
  return this.input.focus();
};

var _default = ParameterWidget;
exports["default"] = _default;

},{}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var SuggestionLookupTextInputWidget = function SuggestionLookupTextInputWidget(config) {
  OO.ui.TextInputWidget.call(this, config);
  OO.ui.mixin.LookupElement.call(this, config);
  this.suggestions = config.suggestions || [];
};

OO.inheritClass(SuggestionLookupTextInputWidget, OO.ui.TextInputWidget);
OO.mixinClass(SuggestionLookupTextInputWidget, OO.ui.mixin.LookupElement); // Set suggestion. param: Object[] with objects of the form { data: ... , label: ... }

SuggestionLookupTextInputWidget.prototype.setSuggestions = function (suggestions) {
  this.suggestions = suggestions;
}; // Returns data, as a resolution to a promise, to be passed to #getLookupMenuOptionsFromData


SuggestionLookupTextInputWidget.prototype.getLookupRequest = function () {
  var deferred = $.Deferred().resolve(new RegExp("\\b" + mw.util.escapeRegExp(this.getValue()), "i"));
  return deferred.promise({
    abort: function abort() {}
  });
}; // ???


SuggestionLookupTextInputWidget.prototype.getLookupCacheDataFromResponse = function (response) {
  return response || [];
}; // Is passed data from #getLookupRequest, returns an array of menu item widgets 


SuggestionLookupTextInputWidget.prototype.getLookupMenuOptionsFromData = function (pattern) {
  var labelMatchesInputVal = function labelMatchesInputVal(suggestionItem) {
    return pattern.test(suggestionItem.label) || !suggestionItem.label && pattern.test(suggestionItem.data);
  };

  var makeMenuOptionWidget = function makeMenuOptionWidget(optionItem) {
    return new OO.ui.MenuOptionWidget({
      data: optionItem.data,
      label: optionItem.label || optionItem.data
    });
  };

  return this.suggestions.filter(labelMatchesInputVal).map(makeMenuOptionWidget);
};

var _default = SuggestionLookupTextInputWidget;
exports["default"] = _default;

},{}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _util = require("../util");

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

/* var incrementProgressByInterval = function() {
	var incrementIntervalDelay = 100;
	var incrementIntervalAmount = 0.1;
	var incrementIntervalMaxval = 98;
	return window.setInterval(
		incrementProgress,
		incrementIntervalDelay,
		incrementIntervalAmount,
		incrementIntervalMaxval
	);
}; */
var LoadDialog = function LoadDialog(config) {
  LoadDialog["super"].call(this, config);
};

OO.inheritClass(LoadDialog, OO.ui.Dialog);
LoadDialog["static"].name = "loadDialog";
LoadDialog["static"].title = "Loading Rater..."; // Customize the initialize() function: This is where to add content to the dialog body and set up event handlers.

LoadDialog.prototype.initialize = function () {
  var _this$content$$elemen;

  // Call the parent method.
  LoadDialog["super"].prototype.initialize.call(this); // Create a layout

  this.content = new OO.ui.PanelLayout({
    padded: true,
    expanded: false
  }); // Create content

  this.progressBar = new OO.ui.ProgressBarWidget({
    progress: 1
  });
  this.setuptasks = [new OO.ui.LabelWidget({
    label: "Loading list of project banners...",
    $element: $("<p style=\"display:block\">")
  }), new OO.ui.LabelWidget({
    label: "Loading talkpage wikitext...",
    $element: $("<p style=\"display:block\">")
  }), new OO.ui.LabelWidget({
    label: "Parsing talkpage templates...",
    $element: $("<p style=\"display:block\">")
  }), new OO.ui.LabelWidget({
    label: "Getting templates' parameter data...",
    $element: $("<p style=\"display:block\">")
  }), new OO.ui.LabelWidget({
    label: "Checking if page redirects...",
    $element: $("<p style=\"display:block\">")
  }), new OO.ui.LabelWidget({
    label: "Retrieving quality prediction...",
    $element: $("<p style=\"display:block\">")
  }).toggle()];
  this.closeButton = new OO.ui.ButtonWidget({
    label: "Close"
  }).toggle();
  this.setupPromises = []; // Append content to layout

  (_this$content$$elemen = this.content.$element).append.apply(_this$content$$elemen, [this.progressBar.$element, new OO.ui.LabelWidget({
    label: "Initialising:",
    $element: $("<strong style=\"display:block\">")
  }).$element].concat(_toConsumableArray(this.setuptasks.map(function (widget) {
    return widget.$element;
  })), [this.closeButton.$element])); // Append layout to dialog


  this.$body.append(this.content.$element); // Connect events to handlers

  this.closeButton.connect(this, {
    "click": "onCloseButtonClick"
  });
};

LoadDialog.prototype.onCloseButtonClick = function () {
  // Close this dialog, without passing any data
  this.close();
}; // Override the getBodyHeight() method to specify a custom height (or don't to use the automatically generated height).


LoadDialog.prototype.getBodyHeight = function () {
  return this.content.$element.outerHeight(true);
};

LoadDialog.prototype.incrementProgress = function (amount, maximum) {
  var priorProgress = this.progressBar.getProgress();
  var incrementedProgress = Math.min(maximum || 100, priorProgress + amount);
  this.progressBar.setProgress(incrementedProgress);
};

LoadDialog.prototype.addTaskPromiseHandlers = function (taskPromises) {
  var _this = this;

  var onTaskDone = function onTaskDone(index) {
    // Add "Done!" to label
    var widget = _this.setuptasks[index];
    widget.setLabel(widget.getLabel() + " Done!"); // Increment status bar. Show a smooth transition by
    // using small steps over a short duration.

    var totalIncrement = 20; // percent

    var totalTime = 400; // milliseconds

    var totalSteps = 10;
    var incrementPerStep = totalIncrement / totalSteps;

    for (var step = 0; step < totalSteps; step++) {
      window.setTimeout(_this.incrementProgress.bind(_this), totalTime * step / totalSteps, incrementPerStep);
    }
  };

  var onTaskError = function onTaskError(index, code, info) {
    var widget = _this.setuptasks[index];
    widget.setLabel(widget.getLabel() + " Failed. " + (0, _util.makeErrorMsg)(code, info));

    _this.closeButton.toggle(true);

    _this.updateSize();
  };

  taskPromises.forEach(function (promise, index) {
    promise.then(function () {
      return onTaskDone(index);
    }, function (code, info) {
      return onTaskError(index, code, info);
    });
  });
}; // Use getSetupProcess() to set up the window with data passed to it at the time 
// of opening


LoadDialog.prototype.getSetupProcess = function (data) {
  var _this2 = this;

  data = data || {};
  return LoadDialog["super"].prototype.getSetupProcess.call(this, data).next(function () {
    var showOresTask = !!data.ores;

    _this2.setuptasks[5].toggle(showOresTask);

    var taskPromises = data.ores ? data.promises : data.promises.slice(0, -1);
    data.isOpened.then(function () {
      return _this2.addTaskPromiseHandlers(taskPromises);
    });
  }, this);
}; // Prevent window from closing too quickly, using getHoldProcess()


LoadDialog.prototype.getHoldProcess = function (data) {
  data = data || {};

  if (data.success) {
    // Wait a bit before processing the close, which happens automatically
    return LoadDialog["super"].prototype.getHoldProcess.call(this, data).next(800);
  } // No need to wait if closed manually


  return LoadDialog["super"].prototype.getHoldProcess.call(this, data);
}; // Use the getTeardownProcess() method to perform actions whenever the dialog is closed. 


LoadDialog.prototype.getTeardownProcess = function (data) {
  var _this3 = this;

  return LoadDialog["super"].prototype.getTeardownProcess.call(this, data).first(function () {
    // Perform cleanup: reset labels
    _this3.setuptasks.forEach(function (setuptask) {
      var currentLabel = setuptask.getLabel();
      setuptask.setLabel(currentLabel.slice(0, currentLabel.indexOf("...") + 3));
    });
  }, this);
};

var _default = LoadDialog;
exports["default"] = _default;

},{"../util":16}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _BannerWidget = _interopRequireDefault(require("./Components/BannerWidget"));

var _BannerListWidget = _interopRequireDefault(require("./Components/BannerListWidget"));

var _SuggestionLookupTextInputWidget = _interopRequireDefault(require("./Components/SuggestionLookupTextInputWidget"));

var cache = _interopRequireWildcard(require("../cache"));

var _Template = require("../Template");

var _getBanners = require("../getBanners");

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function MainWindow(config) {
  MainWindow["super"].call(this, config);
}

OO.inheritClass(MainWindow, OO.ui.ProcessDialog);
MainWindow["static"].name = "main";
MainWindow["static"].title = "Rater";
MainWindow["static"].size = "large";
MainWindow["static"].actions = [// Primary (top right):
{
  label: "X",
  // not using an icon since color becomes inverted, i.e. white on light-grey
  title: "Close (and discard any changes)",
  flags: "primary"
}, // Safe (top left)
{
  action: "help",
  flags: "safe",
  label: "?",
  // not using icon, to mirror Close action
  title: "help"
}, // Others (bottom)
{
  action: "save",
  label: new OO.ui.HtmlSnippet("<span style='padding:0 1em;'>Save</span>"),
  flags: ["primary", "progressive"]
}, {
  action: "preview",
  label: "Show preview"
}, {
  action: "changes",
  label: "Show changes"
}, {
  action: "cancel",
  label: "Cancel"
}]; // Customize the initialize() function: This is where to add content to the dialog body and set up event handlers.

MainWindow.prototype.initialize = function () {
  var _this = this;

  // Call the parent method.
  MainWindow["super"].prototype.initialize.call(this); // Create layouts

  this.topBar = new OO.ui.PanelLayout({
    expanded: false,
    framed: false,
    padded: false
  });
  this.contentLayout = new OO.ui.PanelLayout({
    expanded: true,
    padded: true,
    scrollable: true
  });
  this.outerLayout = new OO.ui.StackLayout({
    items: [this.topBar, this.contentLayout],
    continuous: true,
    expanded: true
  }); // Create topBar content

  this.searchBox = new _SuggestionLookupTextInputWidget["default"]({
    placeholder: "Add a WikiProject...",
    suggestions: cache.read("bannerOptions"),
    $element: $("<div style='display:inline-block;width:100%;max-width:425px;'>"),
    $overlay: this.$overlay
  });
  (0, _getBanners.getBannerOptions)().then(function (bannerOptions) {
    return _this.searchBox.setSuggestions(bannerOptions);
  });
  this.setAllDropDown = new OO.ui.DropdownWidget({
    label: new OO.ui.HtmlSnippet("<span style=\"color:#777\">Set all...</span>"),
    menu: {
      // FIXME: needs real data
      items: [new OO.ui.MenuSectionOptionWidget({
        label: "Classes"
      }), new OO.ui.MenuOptionWidget({
        data: "B",
        label: "B"
      }), new OO.ui.MenuOptionWidget({
        data: "C",
        label: "C"
      }), new OO.ui.MenuOptionWidget({
        data: "start",
        label: "Start"
      }), new OO.ui.MenuSectionOptionWidget({
        label: "Importances"
      }), new OO.ui.MenuOptionWidget({
        data: "top",
        label: "Top"
      }), new OO.ui.MenuOptionWidget({
        data: "high",
        label: "High"
      }), new OO.ui.MenuOptionWidget({
        data: "mid",
        label: "Mid"
      })]
    },
    $element: $("<span style=\"display:inline-block;width:auto\">"),
    $overlay: this.$overlay
  });
  this.removeAllButton = new OO.ui.ButtonWidget({
    icon: "trash",
    title: "Remove all",
    flags: "destructive"
  });
  this.clearAllButton = new OO.ui.ButtonWidget({
    icon: "cancel",
    title: "Clear all",
    flags: "destructive"
  });
  this.bypassAllButton = new OO.ui.ButtonWidget({
    icon: "articleRedirect",
    title: "Bypass all redirects"
  });
  this.doAllButtons = new OO.ui.ButtonGroupWidget({
    items: [this.removeAllButton, this.clearAllButton, this.bypassAllButton],
    $element: $("<span style='float:right;'>")
  });
  this.topBar.$element.append(this.searchBox.$element, this.setAllDropDown.$element, this.doAllButtons.$element).css("background", "#ccc"); // Create content placeholder

  this.bannerList = new _BannerListWidget["default"]();
  this.contentLayout.$element.append(this.bannerList.$element);
  this.$body.append(this.outerLayout.$element);
  this.searchBox.connect(this, {
    enter: "onSearchSelect"
  });
}; // Override the getBodyHeight() method to specify a custom height


MainWindow.prototype.getBodyHeight = function () {
  return this.topBar.$element.outerHeight(true) + this.contentLayout.$element.outerHeight(true);
}; // Use getSetupProcess() to set up the window with data passed to it at the time 
// of opening


MainWindow.prototype.getSetupProcess = function (data) {
  var _this2 = this;

  data = data || {};
  return MainWindow["super"].prototype.getSetupProcess.call(this, data).next(function () {
    // TODO: Set up window based on data
    _this2.bannerList.addItems(data.banners.map(function (bannerTemplate) {
      return new _BannerWidget["default"](bannerTemplate);
    }));

    _this2.talkWikitext = data.talkWikitext;
    _this2.talkpage = data.talkpage;

    _this2.updateSize();
  }, this);
}; // Set up the window it is ready: attached to the DOM, and opening animation completed


MainWindow.prototype.getReadyProcess = function (data) {
  var _this3 = this;

  data = data || {};
  return MainWindow["super"].prototype.getReadyProcess.call(this, data).next(function () {
    return _this3.searchBox.focus();
  });
};

MainWindow.prototype.onSearchSelect = function () {
  var _this4 = this;

  var name = this.searchBox.getValue().trim();

  if (!name) {
    return;
  }

  var existingBanner = this.bannerList.items.find(function (banner) {
    return banner.template.getTitle().getMainText() === name || banner.template.redirectTarget && banner.template.redirectTarget.getMainText() === name;
  });

  if (existingBanner) {
    // TODO: show error message
    return;
  }

  if (!/^[Ww](?:P|iki[Pp]roject)/.test(name)) {
    var message = new OO.ui.HtmlSnippet("<code>{{" + name + "}}</code> is not a recognised WikiProject banner.<br/>Do you want to continue?"); // TODO: ask for confirmation

    console.log(message);
  }

  if (name === "WikiProject Disambiguation" && $("#ca-talk.new").length !== 0 && this.bannerList.items.length === 0) {
    var noNewDabMessage = "New talk pages shouldn't be created if they will only contain the {{WikiProject Disambiguation}} banner. Continue?"; // TODO: ask for confirmation

    console.log(noNewDabMessage);
  } // Create Template object


  var template = new _Template.Template();
  template.name = name;
  (0, _Template.getWithRedirectTo)(template).then(function (template) {
    return $.when(template.setClassesAndImportances(), template.setParamDataAndSuggestions()).then(function () {
      // Return the now-modified templates
      return template;
    });
  }).then(function (template) {
    _this4.bannerList.addItems([new _BannerWidget["default"](template)]);

    _this4.updateSize();
  });
};

var _default = MainWindow;
exports["default"] = _default;

},{"../Template":2,"../cache":11,"../getBanners":14,"./Components/BannerListWidget":3,"./Components/BannerWidget":4,"./Components/SuggestionLookupTextInputWidget":7}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _config = _interopRequireDefault(require("./config"));

var _util = require("./util");

var _setup = _interopRequireDefault(require("./setup"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var autoStart = function autoStart() {
  if (window.rater_autostartNamespaces == null || _config["default"].mw.wgIsMainPage) {
    return $.Deferred().reject();
  }

  var autostartNamespaces = $.isArray(window.rater_autostartNamespaces) ? window.rater_autostartNamespaces : [window.rater_autostartNamespaces];

  if (-1 === autostartNamespaces.indexOf(_config["default"].mw.wgNamespaceNumber)) {
    return $.Deferred().reject();
  }

  if (/(?:\?|&)(?:action|diff|oldid)=/.test(window.location.href)) {
    return $.Deferred().reject();
  } // Check if talk page exists


  if ($("#ca-talk.new").length) {
    return (0, _setup["default"])();
  }

  var thisPage = mw.Title.newFromText(_config["default"].mw.wgPageName);
  var talkPage = thisPage && thisPage.getTalkPage();

  if (!talkPage) {
    return $.Deferred().reject();
  }
  /* Check templates present on talk page. Fetches indirectly transcluded templates, so will find
  	Template:WPBannerMeta (and its subtemplates). But some banners such as MILHIST don't use that
  	meta template, so we also have to check for template titles containg 'WikiProject'
  */


  return _util.API.get({
    action: "query",
    format: "json",
    prop: "templates",
    titles: talkPage.getPrefixedText(),
    tlnamespace: "10",
    tllimit: "500",
    indexpageids: 1
  }).then(function (result) {
    var id = result.query.pageids;
    var templates = result.query.pages[id].templates;

    if (!templates) {
      return (0, _setup["default"])();
    }

    var hasWikiproject = templates.some(function (template) {
      return /(WikiProject|WPBanner)/.test(template.title);
    });

    if (!hasWikiproject) {
      return (0, _setup["default"])();
    }
  }, function (code, jqxhr) {
    // Silently ignore failures (just log to console)
    console.warn("[Rater] Error while checking whether to autostart." + (code == null) ? "" : " " + (0, _util.makeErrorMsg)(code, jqxhr));
    return $.Deferred().reject();
  });
};

var _default = autoStart;
exports["default"] = _default;

},{"./config":12,"./setup":15,"./util":16}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.clearInvalidItems = exports.clearItemIfInvalid = exports.read = exports.write = void 0;

var _util = require("./util");

/** write
 * @param {String} key
 * @param {Array|Object} val
 * @param {Number} staleDays Number of days after which the data becomes stale (usable, but should
 *  be updated for next time).
 * @param {Number} expiryDays Number of days after which the cached data may be deleted.
 */
var write = function write(key, val, staleDays, expiryDays) {
  try {
    var defaultStaleDays = 1;
    var defaultExpiryDays = 30;
    var millisecondsPerDay = 24 * 60 * 60 * 1000;
    var staleDuration = (staleDays || defaultStaleDays) * millisecondsPerDay;
    var expiryDuration = (expiryDays || defaultExpiryDays) * millisecondsPerDay;
    var stringVal = JSON.stringify({
      value: val,
      staleDate: new Date(Date.now() + staleDuration).toISOString(),
      expiryDate: new Date(Date.now() + expiryDuration).toISOString()
    });
    localStorage.setItem("Rater-" + key, stringVal);
  } catch (e) {} // eslint-disable-line no-empty

};
/** read
 * @param {String} key
 * @returns {Array|Object|String|Null} Cached array or object, or empty string if not yet cached,
 *          or null if there was error.
 */


exports.write = write;

var read = function read(key) {
  var val;

  try {
    var stringVal = localStorage.getItem("Rater-" + key);

    if (stringVal !== "") {
      val = JSON.parse(stringVal);
    }
  } catch (e) {
    console.log("[Rater] error reading " + key + " from localStorage cache:");
    console.log("\t" + e.name + " message: " + e.message + (e.at ? " at: " + e.at : "") + (e.text ? " text: " + e.text : ""));
  }

  return val || null;
};

exports.read = read;

var clearItemIfInvalid = function clearItemIfInvalid(key) {
  var isRaterKey = key.indexOf("Rater-") === 0;

  if (!isRaterKey) {
    return;
  }

  var item = read(key.replace("Rater-", ""));
  var isInvalid = !item || !item.expiryDate || (0, _util.isAfterDate)(item.expiryDate);

  if (isInvalid) {
    localStorage.removeItem(key);
  }
};

exports.clearItemIfInvalid = clearItemIfInvalid;

var clearInvalidItems = function clearInvalidItems() {
  for (var i = 0; i < localStorage.length; i++) {
    setTimeout(clearItemIfInvalid, 100, localStorage.key(i));
  }
};

exports.clearInvalidItems = clearInvalidItems;

},{"./util":16}],12:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
// A global object that stores all the page and user configuration and settings
var config = {}; // Script info

config.script = {
  // Advert to append to edit summaries
  advert: " ([[User:Evad37/rater.js|Rater]])",
  version: "2.0.0"
}; // Preferences: globals vars added to users' common.js, or set to defaults if undefined

config.prefs = {
  watchlist: window.rater_watchlist || "preferences"
}; // MediaWiki configuration values

config.mw = mw.config.get(["skin", "wgPageName", "wgNamespaceNumber", "wgUserName", "wgFormattedNamespaces", "wgMonthNames", "wgRevisionId", "wgScriptPath", "wgServer", "wgCategories", "wgIsMainPage"]);
config.regex = {
  /* eslint-disable no-useless-escape */
  // Pattern to find templates, which may contain other templates
  template: /\{\{\s*([^#\{\s].+?)\s*(\|(?:.|\n)*?(?:(?:\{\{(?:.|\n)*?(?:(?:\{\{(?:.|\n)*?\}\})(?:.|\n)*?)*?\}\})(?:.|\n)*?)*|)\}\}\n?/g,
  // Pattern to find `|param=value` or `|value`, where `value` can only contain a pipe
  // if within square brackets (i.e. wikilinks) or braces (i.e. templates)
  templateParams: /\|(?!(?:[^{]+}|[^\[]+]))(?:.|\s)*?(?=(?:\||$)(?!(?:[^{]+}|[^\[]+])))/g
};
/* eslint-enable no-useless-escape */

config.deferred = {};
config.bannerDefaults = {
  classes: ["FA", "FL", "A", "GA", "B", "C", "Start", "Stub", "List"],
  importances: ["Top", "High", "Mid", "Low"],
  extendedClasses: ["Category", "Draft", "File", "Portal", "Project", "Template", "Bplus", "Future", "Current", "Disambig", "NA", "Redirect", "Book"],
  extendedImportances: ["Top", "High", "Mid", "Low", "Bottom", "NA"]
};
config.customClasses = {
  "WikiProject Military history": ["AL", "BL", "CL"],
  "WikiProject Portals": ["FPo", "Complete", "Substantial", "Basic", "Incomplete", "Meta"]
};
config.shellTemplates = ["WikiProject banner shell", "WikiProjectBanners", "WikiProject Banners", "WPB", "WPBS", "Wikiprojectbannershell", "WikiProject Banner Shell", "Wpb", "WPBannerShell", "Wpbs", "Wikiprojectbanners", "WP Banner Shell", "WP banner shell", "Bannershell", "Wikiproject banner shell", "WikiProject Banners Shell", "WikiProjectBanner Shell", "WikiProjectBannerShell", "WikiProject BannerShell", "WikiprojectBannerShell", "WikiProject banner shell/redirect", "WikiProject Shell", "Banner shell", "Scope shell", "Project shell", "WikiProject banner"];
config.defaultParameterData = {
  "auto": {
    "label": {
      "en": "Auto-rated"
    },
    "description": {
      "en": "Automatically rated by a bot. Allowed values: ['yes']."
    },
    "autovalue": "yes"
  },
  "listas": {
    "label": {
      "en": "List as"
    },
    "description": {
      "en": "Sortkey for talk page"
    }
  },
  "small": {
    "label": {
      "en": "Small?"
    },
    "description": {
      "en": "Display a small version. Allowed values: ['yes']."
    },
    "autovalue": "yes"
  },
  "attention": {
    "label": {
      "en": "Attention required?"
    },
    "description": {
      "en": "Immediate attention required. Allowed values: ['yes']."
    },
    "autovalue": "yes"
  },
  "needs-image": {
    "label": {
      "en": "Needs image?"
    },
    "description": {
      "en": "Request that an image or photograph of the subject be added to the article. Allowed values: ['yes']."
    },
    "aliases": ["needs-photo"],
    "autovalue": "yes",
    "suggested": true
  },
  "needs-infobox": {
    "label": {
      "en": "Needs infobox?"
    },
    "description": {
      "en": "Request that an infobox be added to the article. Allowed values: ['yes']."
    },
    "aliases": ["needs-photo"],
    "autovalue": "yes",
    "suggested": true
  }
};
var _default = config;
exports["default"] = _default;

},{}],13:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.diffStyles = void 0;
// Attribution: Diff styles from <https://en.wikipedia.org/wiki/Wikipedia:AutoWikiBrowser/style.css>
var diffStyles = "table.diff, td.diff-otitle, td.diff-ntitle { background-color: white; }\ntd.diff-otitle, td.diff-ntitle { text-align: center; }\ntd.diff-marker { text-align: right; font-weight: bold; font-size: 1.25em; }\ntd.diff-lineno { font-weight: bold; }\ntd.diff-addedline, td.diff-deletedline, td.diff-context { font-size: 88%; vertical-align: top; white-space: -moz-pre-wrap; white-space: pre-wrap; }\ntd.diff-addedline, td.diff-deletedline { border-style: solid; border-width: 1px 1px 1px 4px; border-radius: 0.33em; }\ntd.diff-addedline { border-color: #a3d3ff; }\ntd.diff-deletedline { border-color: #ffe49c; }\ntd.diff-context { background: #f3f3f3; color: #333333; border-style: solid; border-width: 1px 1px 1px 4px; border-color: #e6e6e6; border-radius: 0.33em; }\n.diffchange { font-weight: bold; text-decoration: none; }\ntable.diff {\n    border: none;\n    width: 98%; border-spacing: 4px;\n    table-layout: fixed; /* Ensures that colums are of equal width */\n}\ntd.diff-addedline .diffchange, td.diff-deletedline .diffchange { border-radius: 0.33em; padding: 0.25em 0; }\ntd.diff-addedline .diffchange {\tbackground: #d8ecff; }\ntd.diff-deletedline .diffchange { background: #feeec8; }\ntable.diff td {\tpadding: 0.33em 0.66em; }\ntable.diff col.diff-marker { width: 2%; }\ntable.diff col.diff-content { width: 48%; }\ntable.diff td div {\n    /* Force-wrap very long lines such as URLs or page-widening char strings. */\n    word-wrap: break-word;\n    /* As fallback (FF<3.5, Opera <10.5), scrollbars will be added for very wide cells\n        instead of text overflowing or widening */\n    overflow: auto;\n}";
exports.diffStyles = diffStyles;

},{}],14:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getBannerOptions = exports.getBannerNames = void 0;

var _util = require("./util");

var cache = _interopRequireWildcard(require("./cache"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

var cacheBanners = function cacheBanners(banners, bannerOptions) {
  cache.write("banners", banners, 2, 60);
  cache.write("bannerOptions", bannerOptions, 2, 60);
};
/**
 * Gets banners/options from the Api
 * 
 * @returns {Promise} Resolved with: banners object, bannerOptions array
 */


var getListOfBannersFromApi = function getListOfBannersFromApi() {
  var finishedPromise = $.Deferred();
  var querySkeleton = {
    action: "query",
    format: "json",
    list: "categorymembers",
    cmprop: "title",
    cmnamespace: "10",
    cmlimit: "500"
  };
  var categories = [{
    title: " Category:WikiProject banners with quality assessment",
    abbreviation: "withRatings",
    banners: [],
    processed: $.Deferred()
  }, {
    title: "Category:WikiProject banners without quality assessment",
    abbreviation: "withoutRatings",
    banners: [],
    processed: $.Deferred()
  }, {
    title: "Category:WikiProject banner wrapper templates",
    abbreviation: "wrappers",
    banners: [],
    processed: $.Deferred()
  }];

  var processQuery = function processQuery(result, catIndex) {
    if (!result.query || !result.query.categorymembers) {
      // No results
      // TODO: error or warning ********
      finishedPromise.reject();
      return;
    } // Gather titles into array - excluding "Template:" prefix


    var resultTitles = result.query.categorymembers.map(function (info) {
      return info.title.slice(9);
    });
    Array.prototype.push.apply(categories[catIndex].banners, resultTitles); // Continue query if needed

    if (result["continue"]) {
      doApiQuery($.extend(categories[catIndex].query, result["continue"]), catIndex);
      return;
    }

    categories[catIndex].processed.resolve();
  };

  var doApiQuery = function doApiQuery(q, catIndex) {
    _util.API.get(q).done(function (result) {
      processQuery(result, catIndex);
    }).fail(function (code, jqxhr) {
      console.warn("[Rater] " + (0, _util.makeErrorMsg)(code, jqxhr, "Could not retrieve pages from [[:" + q.cmtitle + "]]"));
      finishedPromise.reject();
    });
  };

  categories.forEach(function (cat, index, arr) {
    cat.query = $.extend({
      "cmtitle": cat.title
    }, querySkeleton);
    $.when(arr[index - 1] && arr[index - 1].processed || true).then(function () {
      doApiQuery(cat.query, index);
    });
  });
  categories[categories.length - 1].processed.then(function () {
    var banners = {};

    var stashBanner = function stashBanner(catObject) {
      banners[catObject.abbreviation] = catObject.banners;
    };

    var mergeBanners = function mergeBanners(mergeIntoThisArray, catObject) {
      return $.merge(mergeIntoThisArray, catObject.banners);
    };

    var makeOption = function makeOption(bannerName) {
      var isWrapper = -1 !== $.inArray(bannerName, categories[2].banners);
      return {
        data: (isWrapper ? "subst:" : "") + bannerName,
        label: bannerName.replace("WikiProject ", "") + (isWrapper ? " [template wrapper]" : "")
      };
    };

    categories.forEach(stashBanner);
    var bannerOptions = categories.reduce(mergeBanners, []).map(makeOption);
    finishedPromise.resolve(banners, bannerOptions);
  });
  return finishedPromise;
};
/**
 * Gets banners/options from cache, if there and not too old
 * 
 * @returns {Promise} Resolved with: banners object, bannerOptions object
 */


var getBannersFromCache = function getBannersFromCache() {
  var cachedBanners = cache.read("banners");
  var cachedBannerOptions = cache.read("bannerOptions");

  if (!cachedBanners || !cachedBanners.value || !cachedBanners.staleDate || !cachedBannerOptions || !cachedBannerOptions.value || !cachedBannerOptions.staleDate) {
    return $.Deferred().reject();
  }

  if ((0, _util.isAfterDate)(cachedBanners.staleDate) || (0, _util.isAfterDate)(cachedBannerOptions.staleDate)) {
    // Update in the background; still use old list until then  
    getListOfBannersFromApi().then(cacheBanners);
  }

  return $.Deferred().resolve(cachedBanners.value, cachedBannerOptions.value);
};
/**
 * Gets banners/options from cache or API.
 * Has side affect of adding/updating/clearing cache.
 * 
 * @returns {Promise<Object, Array>} banners object, bannerOptions object
 *
var getBanners = () => getBannersFromCache().then(
	// Success: pass through
	(banners, options) => $.Deferred().resolve(banners, options),
	// Failure: get from Api, then cache them
	() => {
		var bannersPromise = getListOfBannersFromApi();
		bannersPromise.then(cacheBanners);
		return bannersPromise;
	}
);
 */

/**
 * Gets banner names, grouped by type (withRatings, withoutRatings, wrappers)
 * @returns {Promise<Object>} {withRatings:string[], withoutRatings:string[], wrappers:string[]>}
 */


var getBannerNames = function getBannerNames() {
  return getBannersFromCache().then( // Success: pass through (first param only)
  function (banners) {
    return banners;
  }, // Failure: get from Api, then cache them
  function () {
    var bannersPromise = getListOfBannersFromApi();
    bannersPromise.then(cacheBanners);
    return bannersPromise;
  });
};
/**
 * Gets banners as {data, label} objects, for use in our SuggestionLookupTextInputWidget
 * component (or other OOUI widgets like OO.ui.ComboBoxInputWidget)
 * @returns {Promise<Object[]>} Ratings as {data:string, label:string} objects
 */


exports.getBannerNames = getBannerNames;

var getBannerOptions = function getBannerOptions() {
  return getBannersFromCache().then( // Success: pass through (second param only)
  function (_banners, options) {
    return options;
  }, // Failure: get from Api, then cache them
  function () {
    var bannersPromise = getListOfBannersFromApi();
    bannersPromise.then(cacheBanners);
    return bannersPromise;
  });
};

exports.getBannerOptions = getBannerOptions;

},{"./cache":11,"./util":16}],15:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _config = _interopRequireDefault(require("./config"));

var _util = require("./util");

var _Template = require("./Template");

var _getBanners = require("./getBanners");

var cache = _interopRequireWildcard(require("./cache"));

var _windowManager = _interopRequireDefault(require("./windowManager"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var setupRater = function setupRater(clickEvent) {
  if (clickEvent) {
    clickEvent.preventDefault();
  }

  var setupCompletedPromise = $.Deferred();
  var currentPage = mw.Title.newFromText(_config["default"].mw.wgPageName);
  var talkPage = currentPage && currentPage.getTalkPage();
  var subjectPage = currentPage && currentPage.getSubjectPage(); // Get lists of all banners (task 1)

  var bannersPromise = (0, _getBanners.getBannerNames)(); // Load talk page (task 2)

  var loadTalkPromise = _util.API.get({
    action: "query",
    prop: "revisions",
    rvprop: "content",
    rvsection: "0",
    titles: talkPage.getPrefixedText(),
    indexpageids: 1
  }).then(function (result) {
    var id = result.query.pageids;
    var wikitext = id < 0 ? "" : result.query.pages[id].revisions[0]["*"];
    return wikitext;
  }); // Parse talk page for banners (task 3)


  var parseTalkPromise = loadTalkPromise.then(function (wikitext) {
    return (0, _Template.parseTemplates)(wikitext, true);
  }) // Get all templates
  .then(function (templates) {
    return (0, _Template.getWithRedirectTo)(templates);
  }) // Check for redirects
  .then(function (templates) {
    return bannersPromise.then(function (allBanners) {
      // Get list of all banner templates
      return templates.filter(function (template) {
        // Filter out non-banners
        var mainText = template.redirectTarget ? template.redirectTarget.getMainText() : template.getTitle().getMainText();
        return allBanners.withRatings.includes(mainText) || allBanners.withoutRatings.includes(mainText) || allBanners.wrappers.includes(mainText);
      }).map(function (template) {
        // Set wrapper target if needed
        var mainText = template.redirectTarget ? template.redirectTarget.getMainText() : template.getTitle().getMainText();

        if (allBanners.wrappers.includes(mainText)) {
          template.redirectTarget = mw.Title.newFromText("Template:Subst:" + mainText);
        }

        return template;
      });
    });
  }); // Retrieve and store classes, importances, and TemplateData (task 4)

  var templateDetailsPromise = parseTalkPromise.then(function (templates) {
    // Wait for all promises to resolve
    return $.when.apply(null, [].concat(_toConsumableArray(templates.map(function (template) {
      return template.setClassesAndImportances();
    })), _toConsumableArray(templates.map(function (template) {
      return template.setParamDataAndSuggestions();
    })))).then(function () {
      // Return the now-modified templates
      return templates;
    });
  }); // Check if page is a redirect (task 5) - but don't error out if request fails

  var redirectCheckPromise = _util.API.getRaw(subjectPage.getPrefixedText()).then( // Success
  function (rawPage) {
    if (/^\s*#REDIRECT/i.test(rawPage)) {
      // get redirection target, or boolean true
      return rawPage.slice(rawPage.indexOf("[[") + 2, rawPage.indexOf("]]")) || true;
    }

    return false;
  }, // Failure (ignored)
  function () {
    return null;
  }); // Retrieve rating from ORES (task 6, only needed for articles)


  var shouldGetOres = _config["default"].mw.wgNamespaceNumber <= 1;

  if (shouldGetOres) {
    var latestRevIdPromise = currentPage.isTalkPage() ? $.Deferred().resolve(_config["default"].mw.wgRevisionId) : _util.API.get({
      action: "query",
      format: "json",
      prop: "revisions",
      titles: subjectPage.getPrefixedText(),
      rvprop: "ids",
      indexpageids: 1
    }).then(function (result) {
      if (result.query.redirects) {
        return false;
      }

      var id = result.query.pageids;
      var page = result.query.pages[id];

      if (page.missing === "") {
        return false;
      }

      if (id < 0) {
        return $.Deferred().reject();
      }

      return page.revisions[0].revid;
    });
    var oresPromise = latestRevIdPromise.then(function (latestRevId) {
      if (!latestRevId) {
        return false;
      }

      return _util.API.getORES(latestRevId).then(function (result) {
        var data = result.enwiki.scores[latestRevId].wp10;

        if (data.error) {
          return $.Deferred().reject(data.error.type, data.error.message);
        }

        return data.score.prediction;
      });
    });
  } // Open the load dialog


  var isOpenedPromise = $.Deferred();

  var loadDialogWin = _windowManager["default"].openWindow("loadDialog", {
    promises: [bannersPromise, loadTalkPromise, parseTalkPromise, templateDetailsPromise, redirectCheckPromise, shouldGetOres && oresPromise],
    ores: shouldGetOres,
    isOpened: isOpenedPromise
  });

  loadDialogWin.opened.then(isOpenedPromise.resolve);
  $.when(loadTalkPromise, templateDetailsPromise, redirectCheckPromise, shouldGetOres && oresPromise).then( // All succeded
  function (talkWikitext, banners, redirectTarget, oresPredicition) {
    var result = {
      success: true,
      talkpage: talkPage,
      talkWikitext: talkWikitext,
      banners: banners
    };

    if (redirectTarget) {
      result.redirectTarget = redirectTarget;
    }

    if (oresPredicition) {
      result.oresPredicition = oresPredicition;
    }

    _windowManager["default"].closeWindow("loadDialog", result);
  }); // Any failures are handled by the loadDialog window itself
  // On window closed, check data, and resolve/reject setupCompletedPromise

  loadDialogWin.closed.then(function (data) {
    if (data && data.success) {
      // Got everything needed: Resolve promise with this data
      setupCompletedPromise.resolve(data);
    } else if (data && data.error) {
      // There was an error: Reject promise with error code/info
      setupCompletedPromise.reject(data.error.code, data.error.info);
    } else {
      // Window closed before completion: resolve promise without any data
      setupCompletedPromise.resolve(null);
    }

    cache.clearInvalidItems();
  }); // TESTING purposes only: log passed data to console

  setupCompletedPromise.then(function (data) {
    return console.log("setup window closed", data);
  }, function (code, info) {
    return console.log("setup window closed with error", {
      code: code,
      info: info
    });
  });
  return setupCompletedPromise;
};

var _default = setupRater;
exports["default"] = _default;

},{"./Template":2,"./cache":11,"./config":12,"./getBanners":14,"./util":16,"./windowManager":17}],16:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeErrorMsg = exports.API = exports.isAfterDate = void 0;

var _config = _interopRequireDefault(require("./config"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var isAfterDate = function isAfterDate(dateString) {
  return new Date(dateString) < new Date();
};

exports.isAfterDate = isAfterDate;
var API = new mw.Api({
  ajax: {
    headers: {
      "Api-User-Agent": "Rater/" + _config["default"].script.version + " ( https://en.wikipedia.org/wiki/User:Evad37/Rater )"
    }
  }
});
/* ---------- API for ORES ---------------------------------------------------------------------- */

exports.API = API;

API.getORES = function (revisionID) {
  return $.get("https://ores.wikimedia.org/v3/scores/enwiki?models=wp10&revids=" + revisionID);
};
/* ---------- Raw wikitext ---------------------------------------------------------------------- */


API.getRaw = function (page) {
  return $.get("https:" + _config["default"].mw.wgServer + mw.util.getUrl(page, {
    action: "raw"
  })).then(function (data) {
    if (!data) {
      return $.Deferred().reject("ok-but-empty");
    }

    return data;
  });
};

var makeErrorMsg = function makeErrorMsg(first, second) {
  var code, xhr, message;

  if (_typeof(first) === "object" && typeof second === "string") {
    // Errors from $.get being rejected (ORES & Raw wikitext)
    var errorObj = first.responseJSON && first.responseJSON.error;

    if (errorObj) {
      // Got an api-specific error code/message
      code = errorObj.code;
      message = errorObj.message;
    } else {
      xhr = first;
    }
  } else if (typeof first === "string" && _typeof(second) === "object") {
    // Errors from mw.Api object
    var mwErrorObj = second.error;

    if (mwErrorObj) {
      // Got an api-specific error code/message
      code = errorObj.code;
      message = errorObj.info;
    } else if (first === "ok-but-empty") {
      code = null;
      message = "Got an empty response from the server";
    } else {
      xhr = second && second.xhr;
    }
  }

  if (code && message) {
    return "API error ".concat(code, ": ").concat(message);
  } else if (message) {
    return "API error: ".concat(message);
  } else if (xhr) {
    return "HTTP error ".concat(xhr.status);
  } else if (typeof first === "string" && first !== "error" && typeof second === "string" && second !== "error") {
    return "Error ".concat(first, ": ").concat(second);
  } else if (typeof first === "string" && first !== "error") {
    return "Error: ".concat(first);
  } else {
    return "Unknown API error";
  }
};

exports.makeErrorMsg = makeErrorMsg;

},{"./config":12}],17:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _LoadDialog = _interopRequireDefault(require("./Windows/LoadDialog"));

var _MainWindow = _interopRequireDefault(require("./Windows/MainWindow"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var factory = new OO.Factory(); // Register window constructors with the factory.

factory.register(_LoadDialog["default"]);
factory.register(_MainWindow["default"]);
var manager = new OO.ui.WindowManager({
  "factory": factory
});
$(document.body).append(manager.$element);
var _default = manager;
exports["default"] = _default;

},{"./Windows/LoadDialog":8,"./Windows/MainWindow":9}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJyYXRlci1zcmMvQXBwLmpzIiwicmF0ZXItc3JjL1RlbXBsYXRlLmpzIiwicmF0ZXItc3JjL1dpbmRvd3MvQ29tcG9uZW50cy9CYW5uZXJMaXN0V2lkZ2V0LmpzIiwicmF0ZXItc3JjL1dpbmRvd3MvQ29tcG9uZW50cy9CYW5uZXJXaWRnZXQuanMiLCJyYXRlci1zcmMvV2luZG93cy9Db21wb25lbnRzL1BhcmFtZXRlckxpc3RXaWRnZXQuanMiLCJyYXRlci1zcmMvV2luZG93cy9Db21wb25lbnRzL1BhcmFtZXRlcldpZGdldC5qcyIsInJhdGVyLXNyYy9XaW5kb3dzL0NvbXBvbmVudHMvU3VnZ2VzdGlvbkxvb2t1cFRleHRJbnB1dFdpZGdldC5qcyIsInJhdGVyLXNyYy9XaW5kb3dzL0xvYWREaWFsb2cuanMiLCJyYXRlci1zcmMvV2luZG93cy9NYWluV2luZG93LmpzIiwicmF0ZXItc3JjL2F1dG9zdGFydC5qcyIsInJhdGVyLXNyYy9jYWNoZS5qcyIsInJhdGVyLXNyYy9jb25maWcuanMiLCJyYXRlci1zcmMvY3NzLmpzIiwicmF0ZXItc3JjL2dldEJhbm5lcnMuanMiLCJyYXRlci1zcmMvc2V0dXAuanMiLCJyYXRlci1zcmMvdXRpbC5qcyIsInJhdGVyLXNyYy93aW5kb3dNYW5hZ2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQUVBLENBQUMsU0FBUyxHQUFULEdBQWU7QUFDZixFQUFBLE9BQU8sQ0FBQyxHQUFSLENBQVksOEJBQVo7QUFFQSxFQUFBLEVBQUUsQ0FBQyxJQUFILENBQVEsTUFBUixDQUFlLGVBQWY7O0FBRUEsTUFBTSxjQUFjLEdBQUcsU0FBakIsY0FBaUIsQ0FBQSxJQUFJLEVBQUk7QUFDOUIsUUFBSSxDQUFDLElBQUQsSUFBUyxDQUFDLElBQUksQ0FBQyxPQUFuQixFQUE0QjtBQUMz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O0FBQ0EsR0FGTSxNQUVBLElBQ04sT0FBTyxLQUFQLEtBQWlCLFFBQWpCLElBQTZCLEtBQUssS0FBSyxPQUF2QyxJQUNBLE9BQU8sTUFBUCxLQUFrQixRQURsQixJQUM4QixNQUFNLEtBQUssT0FGbkMsRUFHTDtBQUNELDJCQUFnQixLQUFoQixlQUEwQixNQUExQjtBQUNBLEdBTE0sTUFLQSxJQUFJLE9BQU8sS0FBUCxLQUFpQixRQUFqQixJQUE2QixLQUFLLEtBQUssT0FBM0MsRUFBb0Q7QUFDMUQsNEJBQWlCLEtBQWpCO0FBQ0EsR0FGTSxNQUVBO0FBQ04sV0FBTyxtQkFBUDtBQUNBO0FBQ0QsQ0EzQ0Q7Ozs7Ozs7Ozs7OztBQy9CQTs7QUFDQTs7OztBQUVBLElBQUksT0FBTyxHQUFHLElBQUksRUFBRSxDQUFDLE9BQVAsRUFBZCxDLENBRUE7O0FBQ0EsT0FBTyxDQUFDLFFBQVIsQ0FBaUIsc0JBQWpCO0FBQ0EsT0FBTyxDQUFDLFFBQVIsQ0FBaUIsc0JBQWpCO0FBRUEsSUFBSSxPQUFPLEdBQUcsSUFBSSxFQUFFLENBQUMsRUFBSCxDQUFNLGFBQVYsQ0FBeUI7QUFDdEMsYUFBVztBQUQyQixDQUF6QixDQUFkO0FBR0EsQ0FBQyxDQUFFLFFBQVEsQ0FBQyxJQUFYLENBQUQsQ0FBbUIsTUFBbkIsQ0FBMkIsT0FBTyxDQUFDLFFBQW5DO2VBRWUsTyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImltcG9ydCBzZXR1cFJhdGVyIGZyb20gXCIuL3NldHVwXCI7XHJcbmltcG9ydCBhdXRvU3RhcnQgZnJvbSBcIi4vYXV0b3N0YXJ0XCI7XHJcbmltcG9ydCBkaWZmU3R5bGVzIGZyb20gXCIuL2Nzcy5qc1wiO1xyXG5pbXBvcnQgeyBtYWtlRXJyb3JNc2cgfSBmcm9tIFwiLi91dGlsXCI7XHJcbmltcG9ydCB3aW5kb3dNYW5hZ2VyIGZyb20gXCIuL3dpbmRvd01hbmFnZXJcIjtcclxuXHJcbihmdW5jdGlvbiBBcHAoKSB7XHJcblx0Y29uc29sZS5sb2coXCJSYXRlcidzIEFwcC5qcyBpcyBydW5uaW5nLi4uXCIpO1xyXG5cclxuXHRtdy51dGlsLmFkZENTUyhkaWZmU3R5bGVzKTtcclxuXHJcblx0Y29uc3Qgc2hvd01haW5XaW5kb3cgPSBkYXRhID0+IHtcclxuXHRcdGlmICghZGF0YSB8fCAhZGF0YS5zdWNjZXNzKSB7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHJcblx0XHR3aW5kb3dNYW5hZ2VyLm9wZW5XaW5kb3coXCJtYWluXCIsIGRhdGEpO1xyXG5cdH07XHJcblxyXG5cdGNvbnN0IHNob3dTZXR1cEVycm9yID0gKGNvZGUsIGpxeGhyKSA9PiBPTy51aS5hbGVydChcclxuXHRcdG1ha2VFcnJvck1zZyhjb2RlLCBqcXhociksXHR7XHJcblx0XHRcdHRpdGxlOiBcIlJhdGVyIGZhaWxlZCB0byBvcGVuXCJcclxuXHRcdH1cclxuXHQpO1xyXG5cclxuXHQvLyBJbnZvY2F0aW9uIGJ5IHBvcnRsZXQgbGluayBcclxuXHRtdy51dGlsLmFkZFBvcnRsZXRMaW5rKFxyXG5cdFx0XCJwLWNhY3Rpb25zXCIsXHJcblx0XHRcIiNcIixcclxuXHRcdFwiUmF0ZXJcIixcclxuXHRcdFwiY2EtcmF0ZXJcIixcclxuXHRcdFwiUmF0ZSBxdWFsaXR5IGFuZCBpbXBvcnRhbmNlXCIsXHJcblx0XHRcIjVcIlxyXG5cdCk7XHJcblx0JChcIiNjYS1yYXRlclwiKS5jbGljaygoKSA9PiBzZXR1cFJhdGVyKCkudGhlbihzaG93TWFpbldpbmRvdywgc2hvd1NldHVwRXJyb3IpICk7XHJcblxyXG5cdC8vIEludm9jYXRpb24gYnkgYXV0by1zdGFydCAoZG8gbm90IHNob3cgbWVzc2FnZSBvbiBlcnJvcilcclxuXHRhdXRvU3RhcnQoKS50aGVuKHNob3dNYWluV2luZG93KTtcclxufSkoKTsiLCJpbXBvcnQge0FQSSwgaXNBZnRlckRhdGV9IGZyb20gXCIuL3V0aWxcIjtcclxuaW1wb3J0IGNvbmZpZyBmcm9tIFwiLi9jb25maWdcIjtcclxuaW1wb3J0ICogYXMgY2FjaGUgZnJvbSBcIi4vY2FjaGVcIjtcclxuXHJcbi8qKiBUZW1wbGF0ZVxyXG4gKlxyXG4gKiBAY2xhc3NcclxuICogUmVwcmVzZW50cyB0aGUgd2lraXRleHQgb2YgdGVtcGxhdGUgdHJhbnNjbHVzaW9uLiBVc2VkIGJ5ICNwYXJzZVRlbXBsYXRlcy5cclxuICogQHByb3Age1N0cmluZ30gbmFtZSBOYW1lIG9mIHRoZSB0ZW1wbGF0ZVxyXG4gKiBAcHJvcCB7U3RyaW5nfSB3aWtpdGV4dCBGdWxsIHdpa2l0ZXh0IG9mIHRoZSB0cmFuc2NsdXNpb25cclxuICogQHByb3Age09iamVjdFtdfSBwYXJhbWV0ZXJzIFBhcmFtZXRlcnMgdXNlZCBpbiB0aGUgdHJhbnNsY3VzaW9uLCBpbiBvcmRlciwgb2YgZm9ybTpcclxuXHR7XHJcblx0XHRuYW1lOiB7U3RyaW5nfE51bWJlcn0gcGFyYW1ldGVyIG5hbWUsIG9yIHBvc2l0aW9uIGZvciB1bm5hbWVkIHBhcmFtZXRlcnMsXHJcblx0XHR2YWx1ZToge1N0cmluZ30gV2lraXRleHQgcGFzc2VkIHRvIHRoZSBwYXJhbWV0ZXIgKHdoaXRlc3BhY2UgdHJpbW1lZCksXHJcblx0XHR3aWtpdGV4dDoge1N0cmluZ30gRnVsbCB3aWtpdGV4dCAoaW5jbHVkaW5nIGxlYWRpbmcgcGlwZSwgcGFyYW1ldGVyIG5hbWUvZXF1YWxzIHNpZ24gKGlmIGFwcGxpY2FibGUpLCB2YWx1ZSwgYW5kIGFueSB3aGl0ZXNwYWNlKVxyXG5cdH1cclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSB3aWtpdGV4dCBXaWtpdGV4dCBvZiBhIHRlbXBsYXRlIHRyYW5zY2x1c2lvbiwgc3RhcnRpbmcgd2l0aCAne3snIGFuZCBlbmRpbmcgd2l0aCAnfX0nLlxyXG4gKi9cclxudmFyIFRlbXBsYXRlID0gZnVuY3Rpb24od2lraXRleHQpIHtcclxuXHR0aGlzLndpa2l0ZXh0ID0gd2lraXRleHQ7XHJcblx0dGhpcy5wYXJhbWV0ZXJzID0gW107XHJcbn07XHJcblRlbXBsYXRlLnByb3RvdHlwZS5hZGRQYXJhbSA9IGZ1bmN0aW9uKG5hbWUsIHZhbCwgd2lraXRleHQpIHtcclxuXHR0aGlzLnBhcmFtZXRlcnMucHVzaCh7XHJcblx0XHRcIm5hbWVcIjogbmFtZSxcclxuXHRcdFwidmFsdWVcIjogdmFsLCBcclxuXHRcdFwid2lraXRleHRcIjogXCJ8XCIgKyB3aWtpdGV4dFxyXG5cdH0pO1xyXG59O1xyXG4vKipcclxuICogR2V0IGEgcGFyYW1ldGVyIGRhdGEgYnkgcGFyYW1ldGVyIG5hbWVcclxuICovIFxyXG5UZW1wbGF0ZS5wcm90b3R5cGUuZ2V0UGFyYW0gPSBmdW5jdGlvbihwYXJhbU5hbWUpIHtcclxuXHRyZXR1cm4gdGhpcy5wYXJhbWV0ZXJzLmZpbmQoZnVuY3Rpb24ocCkgeyByZXR1cm4gcC5uYW1lID09IHBhcmFtTmFtZTsgfSk7XHJcbn07XHJcblRlbXBsYXRlLnByb3RvdHlwZS5zZXROYW1lID0gZnVuY3Rpb24obmFtZSkge1xyXG5cdHRoaXMubmFtZSA9IG5hbWUudHJpbSgpO1xyXG59O1xyXG5UZW1wbGF0ZS5wcm90b3R5cGUuZ2V0VGl0bGUgPSBmdW5jdGlvbigpIHtcclxuXHRyZXR1cm4gbXcuVGl0bGUubmV3RnJvbVRleHQoXCJUZW1wbGF0ZTpcIiArIHRoaXMubmFtZSk7XHJcbn07XHJcblxyXG4vKipcclxuICogcGFyc2VUZW1wbGF0ZXNcclxuICpcclxuICogUGFyc2VzIHRlbXBsYXRlcyBmcm9tIHdpa2l0ZXh0LlxyXG4gKiBCYXNlZCBvbiBTRDAwMDEncyB2ZXJzaW9uIGF0IDxodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9Vc2VyOlNEMDAwMS9wYXJzZUFsbFRlbXBsYXRlcy5qcz4uXHJcbiAqIFJldHVybnMgYW4gYXJyYXkgY29udGFpbmluZyB0aGUgdGVtcGxhdGUgZGV0YWlsczpcclxuICogIHZhciB0ZW1wbGF0ZXMgPSBwYXJzZVRlbXBsYXRlcyhcIkhlbGxvIHt7Zm9vIHxCYXJ8YmF6PXF1eCB8Mj1sb3JlbWlwc3VtfDM9fX0gd29ybGRcIik7XHJcbiAqICBjb25zb2xlLmxvZyh0ZW1wbGF0ZXNbMF0pOyAvLyAtLT4gb2JqZWN0XHJcblx0e1xyXG5cdFx0bmFtZTogXCJmb29cIixcclxuXHRcdHdpa2l0ZXh0Olwie3tmb28gfEJhcnxiYXo9cXV4IHwgMiA9IGxvcmVtaXBzdW0gIHwzPX19XCIsXHJcblx0XHRwYXJhbWV0ZXJzOiBbXHJcblx0XHRcdHtcclxuXHRcdFx0XHRuYW1lOiAxLFxyXG5cdFx0XHRcdHZhbHVlOiAnQmFyJyxcclxuXHRcdFx0XHR3aWtpdGV4dDogJ3xCYXInXHJcblx0XHRcdH0sXHJcblx0XHRcdHtcclxuXHRcdFx0XHRuYW1lOiAnYmF6JyxcclxuXHRcdFx0XHR2YWx1ZTogJ3F1eCcsXHJcblx0XHRcdFx0d2lraXRleHQ6ICd8YmF6PXF1eCAnXHJcblx0XHRcdH0sXHJcblx0XHRcdHtcclxuXHRcdFx0XHRuYW1lOiAnMicsXHJcblx0XHRcdFx0dmFsdWU6ICdsb3JlbWlwc3VtJyxcclxuXHRcdFx0XHR3aWtpdGV4dDogJ3wgMiA9IGxvcmVtaXBzdW0gICdcclxuXHRcdFx0fSxcclxuXHRcdFx0e1xyXG5cdFx0XHRcdG5hbWU6ICczJyxcclxuXHRcdFx0XHR2YWx1ZTogJycsXHJcblx0XHRcdFx0d2lraXRleHQ6ICd8Mz0nXHJcblx0XHRcdH1cclxuXHRcdF0sXHJcblx0XHRnZXRQYXJhbTogZnVuY3Rpb24ocGFyYW1OYW1lKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLnBhcmFtZXRlcnMuZmluZChmdW5jdGlvbihwKSB7IHJldHVybiBwLm5hbWUgPT0gcGFyYW1OYW1lOyB9KTtcclxuXHRcdH1cclxuXHR9XHJcbiAqICAgIFxyXG4gKiBcclxuICogQHBhcmFtIHtTdHJpbmd9IHdpa2l0ZXh0XHJcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gcmVjdXJzaXZlIFNldCB0byBgdHJ1ZWAgdG8gYWxzbyBwYXJzZSB0ZW1wbGF0ZXMgdGhhdCBvY2N1ciB3aXRoaW4gb3RoZXIgdGVtcGxhdGVzLFxyXG4gKiAgcmF0aGVyIHRoYW4ganVzdCB0b3AtbGV2ZWwgdGVtcGxhdGVzLiBcclxuICogQHJldHVybiB7VGVtcGxhdGVbXX0gdGVtcGxhdGVzXHJcbiovXHJcbnZhciBwYXJzZVRlbXBsYXRlcyA9IGZ1bmN0aW9uKHdpa2l0ZXh0LCByZWN1cnNpdmUpIHsgLyogZXNsaW50LWRpc2FibGUgbm8tY29udHJvbC1yZWdleCAqL1xyXG5cdGlmICghd2lraXRleHQpIHtcclxuXHRcdHJldHVybiBbXTtcclxuXHR9XHJcblx0dmFyIHN0clJlcGxhY2VBdCA9IGZ1bmN0aW9uKHN0cmluZywgaW5kZXgsIGNoYXIpIHtcclxuXHRcdHJldHVybiBzdHJpbmcuc2xpY2UoMCxpbmRleCkgKyBjaGFyICsgc3RyaW5nLnNsaWNlKGluZGV4ICsgMSk7XHJcblx0fTtcclxuXHJcblx0dmFyIHJlc3VsdCA9IFtdO1xyXG5cdFxyXG5cdHZhciBwcm9jZXNzVGVtcGxhdGVUZXh0ID0gZnVuY3Rpb24gKHN0YXJ0SWR4LCBlbmRJZHgpIHtcclxuXHRcdHZhciB0ZXh0ID0gd2lraXRleHQuc2xpY2Uoc3RhcnRJZHgsIGVuZElkeCk7XHJcblxyXG5cdFx0dmFyIHRlbXBsYXRlID0gbmV3IFRlbXBsYXRlKFwie3tcIiArIHRleHQucmVwbGFjZSgvXFx4MDEvZyxcInxcIikgKyBcIn19XCIpO1xyXG5cdFx0XHJcblx0XHQvLyBzd2FwIG91dCBwaXBlIGluIGxpbmtzIHdpdGggXFx4MDEgY29udHJvbCBjaGFyYWN0ZXJcclxuXHRcdC8vIFtbRmlsZTogXV0gY2FuIGhhdmUgbXVsdGlwbGUgcGlwZXMsIHNvIG1pZ2h0IG5lZWQgbXVsdGlwbGUgcGFzc2VzXHJcblx0XHR3aGlsZSAoIC8oXFxbXFxbW15cXF1dKj8pXFx8KC4qP1xcXVxcXSkvZy50ZXN0KHRleHQpICkge1xyXG5cdFx0XHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oXFxbXFxbW15cXF1dKj8pXFx8KC4qP1xcXVxcXSkvZywgXCIkMVxceDAxJDJcIik7XHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIGNodW5rcyA9IHRleHQuc3BsaXQoXCJ8XCIpLm1hcChmdW5jdGlvbihjaHVuaykge1xyXG5cdFx0XHQvLyBjaGFuZ2UgJ1xceDAxJyBjb250cm9sIGNoYXJhY3RlcnMgYmFjayB0byBwaXBlc1xyXG5cdFx0XHRyZXR1cm4gY2h1bmsucmVwbGFjZSgvXFx4MDEvZyxcInxcIik7IFxyXG5cdFx0fSk7XHJcblxyXG5cdFx0dGVtcGxhdGUuc2V0TmFtZShjaHVua3NbMF0pO1xyXG5cdFx0XHJcblx0XHR2YXIgcGFyYW1ldGVyQ2h1bmtzID0gY2h1bmtzLnNsaWNlKDEpO1xyXG5cclxuXHRcdHZhciB1bm5hbWVkSWR4ID0gMTtcclxuXHRcdHBhcmFtZXRlckNodW5rcy5mb3JFYWNoKGZ1bmN0aW9uKGNodW5rKSB7XHJcblx0XHRcdHZhciBpbmRleE9mRXF1YWxUbyA9IGNodW5rLmluZGV4T2YoXCI9XCIpO1xyXG5cdFx0XHR2YXIgaW5kZXhPZk9wZW5CcmFjZXMgPSBjaHVuay5pbmRleE9mKFwie3tcIik7XHJcblx0XHRcdFxyXG5cdFx0XHR2YXIgaXNXaXRob3V0RXF1YWxzID0gIWNodW5rLmluY2x1ZGVzKFwiPVwiKTtcclxuXHRcdFx0dmFyIGhhc0JyYWNlc0JlZm9yZUVxdWFscyA9IGNodW5rLmluY2x1ZGVzKFwie3tcIikgJiYgaW5kZXhPZk9wZW5CcmFjZXMgPCBpbmRleE9mRXF1YWxUbztcdFxyXG5cdFx0XHR2YXIgaXNVbm5hbWVkUGFyYW0gPSAoIGlzV2l0aG91dEVxdWFscyB8fCBoYXNCcmFjZXNCZWZvcmVFcXVhbHMgKTtcclxuXHRcdFx0XHJcblx0XHRcdHZhciBwTmFtZSwgcE51bSwgcFZhbDtcclxuXHRcdFx0aWYgKCBpc1VubmFtZWRQYXJhbSApIHtcclxuXHRcdFx0XHQvLyBHZXQgdGhlIG5leHQgbnVtYmVyIG5vdCBhbHJlYWR5IHVzZWQgYnkgZWl0aGVyIGFuIHVubmFtZWQgcGFyYW1ldGVyLCBvciBieSBhXHJcblx0XHRcdFx0Ly8gbmFtZWQgcGFyYW1ldGVyIGxpa2UgYHwxPXZhbGBcclxuXHRcdFx0XHR3aGlsZSAoIHRlbXBsYXRlLmdldFBhcmFtKHVubmFtZWRJZHgpICkge1xyXG5cdFx0XHRcdFx0dW5uYW1lZElkeCsrO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRwTnVtID0gdW5uYW1lZElkeDtcclxuXHRcdFx0XHRwVmFsID0gY2h1bmsudHJpbSgpO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHBOYW1lID0gY2h1bmsuc2xpY2UoMCwgaW5kZXhPZkVxdWFsVG8pLnRyaW0oKTtcclxuXHRcdFx0XHRwVmFsID0gY2h1bmsuc2xpY2UoaW5kZXhPZkVxdWFsVG8gKyAxKS50cmltKCk7XHJcblx0XHRcdH1cclxuXHRcdFx0dGVtcGxhdGUuYWRkUGFyYW0ocE5hbWUgfHwgcE51bSwgcFZhbCwgY2h1bmspO1xyXG5cdFx0fSk7XHJcblx0XHRcclxuXHRcdHJlc3VsdC5wdXNoKHRlbXBsYXRlKTtcclxuXHR9O1xyXG5cclxuXHRcclxuXHR2YXIgbiA9IHdpa2l0ZXh0Lmxlbmd0aDtcclxuXHRcclxuXHQvLyBudW1iZXIgb2YgdW5jbG9zZWQgYnJhY2VzXHJcblx0dmFyIG51bVVuY2xvc2VkID0gMDtcclxuXHJcblx0Ly8gYXJlIHdlIGluc2lkZSBhIGNvbW1lbnQgb3IgYmV0d2VlbiBub3dpa2kgdGFncz9cclxuXHR2YXIgaW5Db21tZW50ID0gZmFsc2U7XHJcblx0dmFyIGluTm93aWtpID0gZmFsc2U7XHJcblxyXG5cdHZhciBzdGFydElkeCwgZW5kSWR4O1xyXG5cdFxyXG5cdGZvciAodmFyIGk9MDsgaTxuOyBpKyspIHtcclxuXHRcdFxyXG5cdFx0aWYgKCAhaW5Db21tZW50ICYmICFpbk5vd2lraSApIHtcclxuXHRcdFx0XHJcblx0XHRcdGlmICh3aWtpdGV4dFtpXSA9PT0gXCJ7XCIgJiYgd2lraXRleHRbaSsxXSA9PT0gXCJ7XCIpIHtcclxuXHRcdFx0XHRpZiAobnVtVW5jbG9zZWQgPT09IDApIHtcclxuXHRcdFx0XHRcdHN0YXJ0SWR4ID0gaSsyO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRudW1VbmNsb3NlZCArPSAyO1xyXG5cdFx0XHRcdGkrKztcclxuXHRcdFx0fSBlbHNlIGlmICh3aWtpdGV4dFtpXSA9PT0gXCJ9XCIgJiYgd2lraXRleHRbaSsxXSA9PT0gXCJ9XCIpIHtcclxuXHRcdFx0XHRpZiAobnVtVW5jbG9zZWQgPT09IDIpIHtcclxuXHRcdFx0XHRcdGVuZElkeCA9IGk7XHJcblx0XHRcdFx0XHRwcm9jZXNzVGVtcGxhdGVUZXh0KHN0YXJ0SWR4LCBlbmRJZHgpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRudW1VbmNsb3NlZCAtPSAyO1xyXG5cdFx0XHRcdGkrKztcclxuXHRcdFx0fSBlbHNlIGlmICh3aWtpdGV4dFtpXSA9PT0gXCJ8XCIgJiYgbnVtVW5jbG9zZWQgPiAyKSB7XHJcblx0XHRcdFx0Ly8gc3dhcCBvdXQgcGlwZXMgaW4gbmVzdGVkIHRlbXBsYXRlcyB3aXRoIFxceDAxIGNoYXJhY3RlclxyXG5cdFx0XHRcdHdpa2l0ZXh0ID0gc3RyUmVwbGFjZUF0KHdpa2l0ZXh0LCBpLFwiXFx4MDFcIik7XHJcblx0XHRcdH0gZWxzZSBpZiAoIC9ePCEtLS8udGVzdCh3aWtpdGV4dC5zbGljZShpLCBpICsgNCkpICkge1xyXG5cdFx0XHRcdGluQ29tbWVudCA9IHRydWU7XHJcblx0XHRcdFx0aSArPSAzO1xyXG5cdFx0XHR9IGVsc2UgaWYgKCAvXjxub3dpa2kgPz4vLnRlc3Qod2lraXRleHQuc2xpY2UoaSwgaSArIDkpKSApIHtcclxuXHRcdFx0XHRpbk5vd2lraSA9IHRydWU7XHJcblx0XHRcdFx0aSArPSA3O1xyXG5cdFx0XHR9IFxyXG5cclxuXHRcdH0gZWxzZSB7IC8vIHdlIGFyZSBpbiBhIGNvbW1lbnQgb3Igbm93aWtpXHJcblx0XHRcdGlmICh3aWtpdGV4dFtpXSA9PT0gXCJ8XCIpIHtcclxuXHRcdFx0XHQvLyBzd2FwIG91dCBwaXBlcyB3aXRoIFxceDAxIGNoYXJhY3RlclxyXG5cdFx0XHRcdHdpa2l0ZXh0ID0gc3RyUmVwbGFjZUF0KHdpa2l0ZXh0LCBpLFwiXFx4MDFcIik7XHJcblx0XHRcdH0gZWxzZSBpZiAoL14tLT4vLnRlc3Qod2lraXRleHQuc2xpY2UoaSwgaSArIDMpKSkge1xyXG5cdFx0XHRcdGluQ29tbWVudCA9IGZhbHNlO1xyXG5cdFx0XHRcdGkgKz0gMjtcclxuXHRcdFx0fSBlbHNlIGlmICgvXjxcXC9ub3dpa2kgPz4vLnRlc3Qod2lraXRleHQuc2xpY2UoaSwgaSArIDEwKSkpIHtcclxuXHRcdFx0XHRpbk5vd2lraSA9IGZhbHNlO1xyXG5cdFx0XHRcdGkgKz0gODtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHR9XHJcblx0XHJcblx0aWYgKCByZWN1cnNpdmUgKSB7XHJcblx0XHR2YXIgc3VidGVtcGxhdGVzID0gcmVzdWx0Lm1hcChmdW5jdGlvbih0ZW1wbGF0ZSkge1xyXG5cdFx0XHRyZXR1cm4gdGVtcGxhdGUud2lraXRleHQuc2xpY2UoMiwtMik7XHJcblx0XHR9KVxyXG5cdFx0XHQuZmlsdGVyKGZ1bmN0aW9uKHRlbXBsYXRlV2lraXRleHQpIHtcclxuXHRcdFx0XHRyZXR1cm4gL1xce1xcey4qXFx9XFx9Ly50ZXN0KHRlbXBsYXRlV2lraXRleHQpO1xyXG5cdFx0XHR9KVxyXG5cdFx0XHQubWFwKGZ1bmN0aW9uKHRlbXBsYXRlV2lraXRleHQpIHtcclxuXHRcdFx0XHRyZXR1cm4gcGFyc2VUZW1wbGF0ZXModGVtcGxhdGVXaWtpdGV4dCwgdHJ1ZSk7XHJcblx0XHRcdH0pO1xyXG5cdFx0XHJcblx0XHRyZXR1cm4gcmVzdWx0LmNvbmNhdC5hcHBseShyZXN1bHQsIHN1YnRlbXBsYXRlcyk7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gcmVzdWx0OyBcclxufTsgLyogZXNsaW50LWVuYWJsZSBuby1jb250cm9sLXJlZ2V4ICovXHJcblxyXG4vKipcclxuICogQHBhcmFtIHtUZW1wbGF0ZXxUZW1wbGF0ZVtdfSB0ZW1wbGF0ZXNcclxuICogQHJldHVybiB7UHJvbWlzZTxUZW1wbGF0ZT58UHJvbWlzZTxUZW1wbGF0ZVtdPn1cclxuICovXHJcbnZhciBnZXRXaXRoUmVkaXJlY3RUbyA9IGZ1bmN0aW9uKHRlbXBsYXRlcykge1xyXG5cdHZhciB0ZW1wbGF0ZXNBcnJheSA9IEFycmF5LmlzQXJyYXkodGVtcGxhdGVzKSA/IHRlbXBsYXRlcyA6IFt0ZW1wbGF0ZXNdO1xyXG5cdGlmICh0ZW1wbGF0ZXNBcnJheS5sZW5ndGggPT09IDApIHtcclxuXHRcdHJldHVybiAkLkRlZmVycmVkKCkucmVzb2x2ZShbXSk7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gQVBJLmdldCh7XHJcblx0XHRcImFjdGlvblwiOiBcInF1ZXJ5XCIsXHJcblx0XHRcImZvcm1hdFwiOiBcImpzb25cIixcclxuXHRcdFwidGl0bGVzXCI6IHRlbXBsYXRlc0FycmF5Lm1hcCh0ZW1wbGF0ZSA9PiB0ZW1wbGF0ZS5nZXRUaXRsZSgpLmdldFByZWZpeGVkVGV4dCgpKSxcclxuXHRcdFwicmVkaXJlY3RzXCI6IDFcclxuXHR9KS50aGVuKGZ1bmN0aW9uKHJlc3VsdCkge1xyXG5cdFx0aWYgKCAhcmVzdWx0IHx8ICFyZXN1bHQucXVlcnkgKSB7XHJcblx0XHRcdHJldHVybiAkLkRlZmVycmVkKCkucmVqZWN0KFwiRW1wdHkgcmVzcG9uc2VcIik7XHJcblx0XHR9XHJcblx0XHRpZiAoIHJlc3VsdC5xdWVyeS5yZWRpcmVjdHMgKSB7XHJcblx0XHRcdHJlc3VsdC5xdWVyeS5yZWRpcmVjdHMuZm9yRWFjaChmdW5jdGlvbihyZWRpcmVjdCkge1xyXG5cdFx0XHRcdHZhciBpID0gdGVtcGxhdGVzQXJyYXkuZmluZEluZGV4KHRlbXBsYXRlID0+IHRlbXBsYXRlLmdldFRpdGxlKCkuZ2V0UHJlZml4ZWRUZXh0KCkgPT09IHJlZGlyZWN0LmZyb20pO1xyXG5cdFx0XHRcdGlmIChpICE9PSAtMSkge1xyXG5cdFx0XHRcdFx0dGVtcGxhdGVzQXJyYXlbaV0ucmVkaXJlY3RUYXJnZXQgPSBtdy5UaXRsZS5uZXdGcm9tVGV4dChyZWRpcmVjdC50byk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBBcnJheS5pc0FycmF5KHRlbXBsYXRlcykgPyB0ZW1wbGF0ZXNBcnJheSA6IHRlbXBsYXRlc0FycmF5WzBdO1xyXG5cdH0pO1xyXG59O1xyXG5cclxuVGVtcGxhdGUucHJvdG90eXBlLmdldERhdGFGb3JQYXJhbSA9IGZ1bmN0aW9uKGtleSwgcGFyYU5hbWUpIHtcclxuXHRpZiAoICF0aGlzLnBhcmFtRGF0YSApIHtcclxuXHRcdHJldHVybiBudWxsO1xyXG5cdH1cclxuXHQvLyBJZiBhbGlhcywgc3dpdGNoIGZyb20gYWxpYXMgdG8gcHJlZmVycmVkIHBhcmFtZXRlciBuYW1lXHJcblx0dmFyIHBhcmEgPSB0aGlzLnBhcmFtQWxpYXNlc1twYXJhTmFtZV0gfHwgcGFyYU5hbWU7XHRcclxuXHRpZiAoICF0aGlzLnBhcmFtRGF0YVtwYXJhXSApIHtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblx0XHJcblx0dmFyIGRhdGEgPSB0aGlzLnBhcmFtRGF0YVtwYXJhXVtrZXldO1xyXG5cdC8vIERhdGEgbWlnaHQgYWN0dWFsbHkgYmUgYW4gb2JqZWN0IHdpdGgga2V5IFwiZW5cIlxyXG5cdGlmICggZGF0YSAmJiBkYXRhLmVuICYmICFBcnJheS5pc0FycmF5KGRhdGEpICkge1xyXG5cdFx0cmV0dXJuIGRhdGEuZW47XHJcblx0fVxyXG5cdHJldHVybiBkYXRhO1xyXG59O1xyXG5cclxuVGVtcGxhdGUucHJvdG90eXBlLnNldFBhcmFtRGF0YUFuZFN1Z2dlc3Rpb25zID0gZnVuY3Rpb24oKSB7XHJcblx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cdHZhciBwYXJhbURhdGFTZXQgPSAkLkRlZmVycmVkKCk7XHJcblx0XHJcblx0aWYgKCBzZWxmLnBhcmFtRGF0YSApIHsgcmV0dXJuIHBhcmFtRGF0YVNldC5yZXNvbHZlKCk7IH1cclxuICAgIFxyXG5cdHZhciBwcmVmaXhlZFRleHQgPSBzZWxmLnJlZGlyZWN0VGFyZ2V0XHJcblx0XHQ/IHNlbGYucmVkaXJlY3RUYXJnZXQuZ2V0UHJlZml4ZWRUZXh0KClcclxuXHRcdDogc2VsZi5nZXRUaXRsZSgpLmdldFByZWZpeGVkVGV4dCgpO1xyXG5cclxuXHR2YXIgY2FjaGVkSW5mbyA9IGNhY2hlLnJlYWQocHJlZml4ZWRUZXh0ICsgXCItcGFyYW1zXCIpO1xyXG5cdFxyXG5cdGlmIChcclxuXHRcdGNhY2hlZEluZm8gJiZcclxuXHRcdGNhY2hlZEluZm8udmFsdWUgJiZcclxuXHRcdGNhY2hlZEluZm8uc3RhbGVEYXRlICYmXHJcblx0XHRjYWNoZWRJbmZvLnZhbHVlLnBhcmFtRGF0YSAhPSBudWxsICYmXHJcblx0XHRjYWNoZWRJbmZvLnZhbHVlLnBhcmFtZXRlclN1Z2dlc3Rpb25zICE9IG51bGwgJiZcclxuXHRcdGNhY2hlZEluZm8udmFsdWUucGFyYW1BbGlhc2VzICE9IG51bGxcclxuXHQpIHtcclxuXHRcdHNlbGYubm90ZW1wbGF0ZWRhdGEgPSBjYWNoZWRJbmZvLnZhbHVlLm5vdGVtcGxhdGVkYXRhO1xyXG5cdFx0c2VsZi5wYXJhbURhdGEgPSBjYWNoZWRJbmZvLnZhbHVlLnBhcmFtRGF0YTtcclxuXHRcdHNlbGYucGFyYW1ldGVyU3VnZ2VzdGlvbnMgPSBjYWNoZWRJbmZvLnZhbHVlLnBhcmFtZXRlclN1Z2dlc3Rpb25zO1xyXG5cdFx0c2VsZi5wYXJhbUFsaWFzZXMgPSBjYWNoZWRJbmZvLnZhbHVlLnBhcmFtQWxpYXNlcztcclxuXHRcdFxyXG5cdFx0cGFyYW1EYXRhU2V0LnJlc29sdmUoKTtcclxuXHRcdGlmICggIWlzQWZ0ZXJEYXRlKGNhY2hlZEluZm8uc3RhbGVEYXRlKSApIHtcclxuXHRcdFx0Ly8gSnVzdCB1c2UgdGhlIGNhY2hlZCBkYXRhXHJcblx0XHRcdHJldHVybiBwYXJhbURhdGFTZXQ7XHJcblx0XHR9IC8vIGVsc2U6IFVzZSB0aGUgY2FjaGUgZGF0YSBmb3Igbm93LCBidXQgYWxzbyBmZXRjaCBuZXcgZGF0YSBmcm9tIEFQSVxyXG5cdH1cclxuXHRcclxuXHRBUEkuZ2V0KHtcclxuXHRcdGFjdGlvbjogXCJ0ZW1wbGF0ZWRhdGFcIixcclxuXHRcdHRpdGxlczogcHJlZml4ZWRUZXh0LFxyXG5cdFx0cmVkaXJlY3RzOiAxLFxyXG5cdFx0aW5jbHVkZU1pc3NpbmdUaXRsZXM6IDFcclxuXHR9KVxyXG5cdFx0LnRoZW4oXHJcblx0XHRcdGZ1bmN0aW9uKHJlc3BvbnNlKSB7IHJldHVybiByZXNwb25zZTsgfSxcclxuXHRcdFx0ZnVuY3Rpb24oLyplcnJvciovKSB7IHJldHVybiBudWxsOyB9IC8vIElnbm9yZSBlcnJvcnMsIHdpbGwgdXNlIGRlZmF1bHQgZGF0YVxyXG5cdFx0KVxyXG5cdFx0LnRoZW4oIGZ1bmN0aW9uKHJlc3VsdCkge1xyXG5cdFx0Ly8gRmlndXJlIG91dCBwYWdlIGlkIChiZWFjdXNlIGFjdGlvbj10ZW1wbGF0ZWRhdGEgZG9lc24ndCBoYXZlIGFuIGluZGV4cGFnZWlkcyBvcHRpb24pXHJcblx0XHRcdHZhciBpZCA9IHJlc3VsdCAmJiAkLm1hcChyZXN1bHQucGFnZXMsIGZ1bmN0aW9uKCBfdmFsdWUsIGtleSApIHsgcmV0dXJuIGtleTsgfSk7XHJcblx0XHRcclxuXHRcdFx0aWYgKCAhcmVzdWx0IHx8ICFyZXN1bHQucGFnZXNbaWRdIHx8IHJlc3VsdC5wYWdlc1tpZF0ubm90ZW1wbGF0ZWRhdGEgfHwgIXJlc3VsdC5wYWdlc1tpZF0ucGFyYW1zICkge1xyXG5cdFx0XHQvLyBObyBUZW1wbGF0ZURhdGEsIHNvIHVzZSBkZWZhdWx0cyAoZ3Vlc3NlcylcclxuXHRcdFx0XHRzZWxmLm5vdGVtcGxhdGVkYXRhID0gdHJ1ZTtcclxuXHRcdFx0XHRzZWxmLnRlbXBsYXRlZGF0YUFwaUVycm9yID0gIXJlc3VsdDtcclxuXHRcdFx0XHRzZWxmLnBhcmFtRGF0YSA9IGNvbmZpZy5kZWZhdWx0UGFyYW1ldGVyRGF0YTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRzZWxmLnBhcmFtRGF0YSA9IHJlc3VsdC5wYWdlc1tpZF0ucGFyYW1zO1xyXG5cdFx0XHR9XHJcbiAgICAgICAgXHJcblx0XHRcdHNlbGYucGFyYW1BbGlhc2VzID0ge307XHJcblx0XHRcdCQuZWFjaChzZWxmLnBhcmFtRGF0YSwgZnVuY3Rpb24ocGFyYU5hbWUsIHBhcmFEYXRhKSB7XHJcblx0XHRcdFx0Ly8gRXh0cmFjdCBhbGlhc2VzIGZvciBlYXNpZXIgcmVmZXJlbmNlIGxhdGVyIG9uXHJcblx0XHRcdFx0aWYgKCBwYXJhRGF0YS5hbGlhc2VzICYmIHBhcmFEYXRhLmFsaWFzZXMubGVuZ3RoICkge1xyXG5cdFx0XHRcdFx0cGFyYURhdGEuYWxpYXNlcy5mb3JFYWNoKGZ1bmN0aW9uKGFsaWFzKXtcclxuXHRcdFx0XHRcdFx0c2VsZi5wYXJhbUFsaWFzZXNbYWxpYXNdID0gcGFyYU5hbWU7XHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Ly8gRXh0cmFjdCBhbGxvd2VkIHZhbHVlcyBhcnJheSBmcm9tIGRlc2NyaXB0aW9uXHJcblx0XHRcdFx0aWYgKCBwYXJhRGF0YS5kZXNjcmlwdGlvbiAmJiAvXFxbLionLis/Jy4qP1xcXS8udGVzdChwYXJhRGF0YS5kZXNjcmlwdGlvbi5lbikgKSB7XHJcblx0XHRcdFx0XHR0cnkge1xyXG5cdFx0XHRcdFx0XHR2YXIgYWxsb3dlZFZhbHMgPSBKU09OLnBhcnNlKFxyXG5cdFx0XHRcdFx0XHRcdHBhcmFEYXRhLmRlc2NyaXB0aW9uLmVuXHJcblx0XHRcdFx0XHRcdFx0XHQucmVwbGFjZSgvXi4qXFxbLyxcIltcIilcclxuXHRcdFx0XHRcdFx0XHRcdC5yZXBsYWNlKC9cIi9nLCBcIlxcXFxcXFwiXCIpXHJcblx0XHRcdFx0XHRcdFx0XHQucmVwbGFjZSgvJy9nLCBcIlxcXCJcIilcclxuXHRcdFx0XHRcdFx0XHRcdC5yZXBsYWNlKC8sXFxzKl0vLCBcIl1cIilcclxuXHRcdFx0XHRcdFx0XHRcdC5yZXBsYWNlKC9dLiokLywgXCJdXCIpXHJcblx0XHRcdFx0XHRcdCk7XHJcblx0XHRcdFx0XHRcdHNlbGYucGFyYW1EYXRhW3BhcmFOYW1lXS5hbGxvd2VkVmFsdWVzID0gYWxsb3dlZFZhbHM7XHJcblx0XHRcdFx0XHR9IGNhdGNoKGUpIHtcclxuXHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKFwiW1JhdGVyXSBDb3VsZCBub3QgcGFyc2UgYWxsb3dlZCB2YWx1ZXMgaW4gZGVzY3JpcHRpb246XFxuICBcIitcclxuXHRcdFx0XHRcdHBhcmFEYXRhLmRlc2NyaXB0aW9uLmVuICsgXCJcXG4gQ2hlY2sgVGVtcGxhdGVEYXRhIGZvciBwYXJhbWV0ZXIgfFwiICsgcGFyYU5hbWUgK1xyXG5cdFx0XHRcdFx0XCI9IGluIFwiICsgc2VsZi5nZXRUaXRsZSgpLmdldFByZWZpeGVkVGV4dCgpKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Ly8gTWFrZSBzdXJlIHJlcXVpcmVkL3N1Z2dlc3RlZCBwYXJhbWV0ZXJzIGFyZSBwcmVzZW50XHJcblx0XHRcdFx0aWYgKCAocGFyYURhdGEucmVxdWlyZWQgfHwgcGFyYURhdGEuc3VnZ2VzdGVkKSAmJiAhc2VsZi5nZXRQYXJhbShwYXJhTmFtZSkgKSB7XHJcblx0XHRcdFx0Ly8gQ2hlY2sgaWYgYWxyZWFkeSBwcmVzZW50IGluIGFuIGFsaWFzLCBpZiBhbnlcclxuXHRcdFx0XHRcdGlmICggcGFyYURhdGEuYWxpYXNlcy5sZW5ndGggKSB7XHJcblx0XHRcdFx0XHRcdHZhciBhbGlhc2VzID0gc2VsZi5wYXJhbWV0ZXJzLmZpbHRlcihwID0+IHtcclxuXHRcdFx0XHRcdFx0XHR2YXIgaXNBbGlhcyA9IHBhcmFEYXRhLmFsaWFzZXMuaW5jbHVkZXMocC5uYW1lKTtcclxuXHRcdFx0XHRcdFx0XHR2YXIgaXNFbXB0eSA9ICFwLnZhbDtcclxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gaXNBbGlhcyAmJiAhaXNFbXB0eTtcclxuXHRcdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0XHRcdGlmICggYWxpYXNlcy5sZW5ndGggKSB7XHJcblx0XHRcdFx0XHRcdC8vIEF0IGxlYXN0IG9uZSBub24tZW1wdHkgYWxpYXMsIHNvIGRvIG5vdGhpbmdcclxuXHRcdFx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdC8vIE5vIG5vbi1lbXB0eSBhbGlhc2VzLCBzbyBzZXQgcGFyYW1ldGVyIHRvIGVpdGhlciB0aGUgYXV0b3ZhdWxlLCBvclxyXG5cdFx0XHRcdFx0Ly8gYW4gZW1wdHkgc3RyaW5nICh3aXRob3V0IHRvdWNoaW5nLCB1bmxlc3MgaXQgaXMgYSByZXF1aXJlZCBwYXJhbWV0ZXIpXHJcblx0XHRcdFx0XHRzZWxmLnBhcmFtZXRlcnMucHVzaCh7XHJcblx0XHRcdFx0XHRcdG5hbWU6cGFyYU5hbWUsXHJcblx0XHRcdFx0XHRcdHZhbHVlOiBwYXJhRGF0YS5hdXRvdmFsdWUgfHwgXCJcIixcclxuXHRcdFx0XHRcdFx0YXV0b2ZpbGxlZDogdHJ1ZVxyXG5cdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHRcdFxyXG5cdFx0XHQvLyBNYWtlIHN1Z2dlc3Rpb25zIGZvciBjb21ib2JveFxyXG5cdFx0XHR2YXIgYWxsUGFyYW1zQXJyYXkgPSAoICFzZWxmLm5vdGVtcGxhdGVkYXRhICYmIHJlc3VsdC5wYWdlc1tpZF0ucGFyYW1PcmRlciApIHx8XHJcblx0XHRcdCQubWFwKHNlbGYucGFyYW1EYXRhLCBmdW5jdGlvbihfdmFsLCBrZXkpe1xyXG5cdFx0XHRcdHJldHVybiBrZXk7XHJcblx0XHRcdH0pO1xyXG5cdFx0XHRzZWxmLnBhcmFtZXRlclN1Z2dlc3Rpb25zID0gYWxsUGFyYW1zQXJyYXkuZmlsdGVyKGZ1bmN0aW9uKHBhcmFtTmFtZSkge1xyXG5cdFx0XHRcdHJldHVybiAoIHBhcmFtTmFtZSAmJiBwYXJhbU5hbWUgIT09IFwiY2xhc3NcIiAmJiBwYXJhbU5hbWUgIT09IFwiaW1wb3J0YW5jZVwiICk7XHJcblx0XHRcdH0pXHJcblx0XHRcdFx0Lm1hcChmdW5jdGlvbihwYXJhbU5hbWUpIHtcclxuXHRcdFx0XHRcdHZhciBvcHRpb25PYmplY3QgPSB7ZGF0YTogcGFyYW1OYW1lfTtcclxuXHRcdFx0XHRcdHZhciBsYWJlbCA9IHNlbGYuZ2V0RGF0YUZvclBhcmFtKGxhYmVsLCBwYXJhbU5hbWUpO1xyXG5cdFx0XHRcdFx0aWYgKCBsYWJlbCApIHtcclxuXHRcdFx0XHRcdFx0b3B0aW9uT2JqZWN0LmxhYmVsID0gbGFiZWwgKyBcIiAofFwiICsgcGFyYW1OYW1lICsgXCI9KVwiO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0cmV0dXJuIG9wdGlvbk9iamVjdDtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFxyXG5cdFx0XHRpZiAoIHNlbGYudGVtcGxhdGVkYXRhQXBpRXJyb3IgKSB7XHJcblx0XHRcdFx0Ly8gRG9uJ3Qgc2F2ZSBkZWZhdWx0cy9ndWVzc2VzIHRvIGNhY2hlO1xyXG5cdFx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0XHR9XHJcblx0XHRcclxuXHRcdFx0Y2FjaGUud3JpdGUocHJlZml4ZWRUZXh0ICsgXCItcGFyYW1zXCIsIHtcclxuXHRcdFx0XHRub3RlbXBsYXRlZGF0YTogc2VsZi5ub3RlbXBsYXRlZGF0YSxcclxuXHRcdFx0XHRwYXJhbURhdGE6IHNlbGYucGFyYW1EYXRhLFxyXG5cdFx0XHRcdHBhcmFtZXRlclN1Z2dlc3Rpb25zOiBzZWxmLnBhcmFtZXRlclN1Z2dlc3Rpb25zLFxyXG5cdFx0XHRcdHBhcmFtQWxpYXNlczogc2VsZi5wYXJhbUFsaWFzZXNcclxuXHRcdFx0fSxcdDFcclxuXHRcdFx0KTtcclxuXHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHR9KVxyXG5cdFx0LnRoZW4oXHJcblx0XHRcdHBhcmFtRGF0YVNldC5yZXNvbHZlLFxyXG5cdFx0XHRwYXJhbURhdGFTZXQucmVqZWN0XHJcblx0XHQpO1xyXG5cdFxyXG5cdHJldHVybiBwYXJhbURhdGFTZXQ7XHRcclxufTtcclxuXHJcblRlbXBsYXRlLnByb3RvdHlwZS5zZXRDbGFzc2VzQW5kSW1wb3J0YW5jZXMgPSBmdW5jdGlvbigpIHtcclxuXHR2YXIgcGFyc2VkID0gJC5EZWZlcnJlZCgpO1xyXG5cdFxyXG5cdGlmICggdGhpcy5jbGFzc2VzICYmIHRoaXMuaW1wb3J0YW5jZXMgKSB7XHJcblx0XHRyZXR1cm4gcGFyc2VkLnJlc29sdmUoKTtcclxuXHR9XHJcblxyXG5cdHZhciBtYWluVGV4dCA9IHRoaXMuZ2V0VGl0bGUoKS5nZXRNYWluVGV4dCgpO1xyXG5cdFxyXG5cdHZhciBjYWNoZWRSYXRpbmdzID0gY2FjaGUucmVhZChtYWluVGV4dCtcIi1yYXRpbmdzXCIpO1xyXG5cdGlmIChcclxuXHRcdGNhY2hlZFJhdGluZ3MgJiZcclxuXHRcdGNhY2hlZFJhdGluZ3MudmFsdWUgJiZcclxuXHRcdGNhY2hlZFJhdGluZ3Muc3RhbGVEYXRlICYmXHJcblx0XHRjYWNoZWRSYXRpbmdzLnZhbHVlLmNsYXNzZXMhPW51bGwgJiZcclxuXHRcdGNhY2hlZFJhdGluZ3MudmFsdWUuaW1wb3J0YW5jZXMhPW51bGxcclxuXHQpIHtcclxuXHRcdHRoaXMuY2xhc3NlcyA9IGNhY2hlZFJhdGluZ3MudmFsdWUuY2xhc3NlcztcclxuXHRcdHRoaXMuaW1wb3J0YW5jZXMgPSBjYWNoZWRSYXRpbmdzLnZhbHVlLmltcG9ydGFuY2VzO1xyXG5cdFx0cGFyc2VkLnJlc29sdmUoKTtcclxuXHRcdGlmICggIWlzQWZ0ZXJEYXRlKGNhY2hlZFJhdGluZ3Muc3RhbGVEYXRlKSApIHtcclxuXHRcdFx0Ly8gSnVzdCB1c2UgdGhlIGNhY2hlZCBkYXRhXHJcblx0XHRcdHJldHVybiBwYXJzZWQ7XHJcblx0XHR9IC8vIGVsc2U6IFVzZSB0aGUgY2FjaGUgZGF0YSBmb3Igbm93LCBidXQgYWxzbyBmZXRjaCBuZXcgZGF0YSBmcm9tIEFQSVxyXG5cdH1cclxuXHRcclxuXHR2YXIgd2lraXRleHRUb1BhcnNlID0gXCJcIjtcdFxyXG5cdGNvbmZpZy5iYW5uZXJEZWZhdWx0cy5leHRlbmRlZENsYXNzZXMuZm9yRWFjaChmdW5jdGlvbihjbGFzc25hbWUsIGluZGV4KSB7XHJcblx0XHR3aWtpdGV4dFRvUGFyc2UgKz0gXCJ7e1wiICsgbWFpblRleHQgKyBcInxjbGFzcz1cIiArIGNsYXNzbmFtZSArIFwifGltcG9ydGFuY2U9XCIgK1xyXG5cdFx0KGNvbmZpZy5iYW5uZXJEZWZhdWx0cy5leHRlbmRlZEltcG9ydGFuY2VzW2luZGV4XSB8fCBcIlwiKSArIFwifX0vblwiO1xyXG5cdH0pO1xyXG5cdFxyXG5cdHJldHVybiBBUEkuZ2V0KHtcclxuXHRcdGFjdGlvbjogXCJwYXJzZVwiLFxyXG5cdFx0dGl0bGU6IFwiVGFsazpTYW5kYm94XCIsXHJcblx0XHR0ZXh0OiB3aWtpdGV4dFRvUGFyc2UsXHJcblx0XHRwcm9wOiBcImNhdGVnb3JpZXNodG1sXCJcclxuXHR9KVxyXG5cdFx0LnRoZW4oKHJlc3VsdCkgPT4ge1xyXG5cdFx0XHR2YXIgcmVkaXJlY3RPck1haW5UZXh0ID0gdGhpcy5yZWRpcmVjdFRhcmdldCA/IHRoaXMucmVkaXJlY3RUYXJnZXQuZ2V0TWFpblRleHQoKSA6IG1haW5UZXh0O1xyXG5cdFx0XHR2YXIgY2F0c0h0bWwgPSByZXN1bHQucGFyc2UuY2F0ZWdvcmllc2h0bWxbXCIqXCJdO1xyXG5cdFx0XHR2YXIgZXh0ZW5kZWRDbGFzc2VzID0gY29uZmlnLmJhbm5lckRlZmF1bHRzLmV4dGVuZGVkQ2xhc3Nlcy5maWx0ZXIoZnVuY3Rpb24oY2wpIHtcclxuXHRcdFx0XHRyZXR1cm4gY2F0c0h0bWwuaW5kZXhPZihjbCtcIi1DbGFzc1wiKSAhPT0gLTE7XHJcblx0XHRcdH0pO1xyXG5cdFx0XHR2YXIgZGVmYXVsdENsYXNzZXMgPSAoIHJlZGlyZWN0T3JNYWluVGV4dCA9PT0gXCJXaWtpUHJvamVjdCBQb3J0YWxzXCIgKVxyXG5cdFx0XHRcdD8gW1wiTGlzdFwiXVxyXG5cdFx0XHRcdDogY29uZmlnLmJhbm5lckRlZmF1bHRzLmNsYXNzZXM7XHJcblx0XHRcdHZhciBjdXN0b21DbGFzc2VzID0gY29uZmlnLmN1c3RvbUNsYXNzZXNbcmVkaXJlY3RPck1haW5UZXh0XSB8fCBbXTtcclxuXHRcdFx0dGhpcy5jbGFzc2VzID0gW10uY29uY2F0KFxyXG5cdFx0XHRcdGN1c3RvbUNsYXNzZXMsXHJcblx0XHRcdFx0ZGVmYXVsdENsYXNzZXMsXHJcblx0XHRcdFx0ZXh0ZW5kZWRDbGFzc2VzXHJcblx0XHRcdCk7XHJcblxyXG5cdFx0XHR0aGlzLmltcG9ydGFuY2VzID0gY29uZmlnLmJhbm5lckRlZmF1bHRzLmV4dGVuZGVkSW1wb3J0YW5jZXMuZmlsdGVyKGZ1bmN0aW9uKGltcCkge1xyXG5cdFx0XHRcdHJldHVybiBjYXRzSHRtbC5pbmRleE9mKGltcCtcIi1pbXBvcnRhbmNlXCIpICE9PSAtMTtcclxuXHRcdFx0fSk7XHJcblx0XHRcdGNhY2hlLndyaXRlKG1haW5UZXh0K1wiLXJhdGluZ3NcIixcclxuXHRcdFx0XHR7XHJcblx0XHRcdFx0XHRjbGFzc2VzOiB0aGlzLmNsYXNzZXMsXHJcblx0XHRcdFx0XHRpbXBvcnRhbmNlczogdGhpcy5pbXBvcnRhbmNlc1xyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0MVxyXG5cdFx0XHQpO1xyXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdH0pO1xyXG59O1xyXG5cclxuZXhwb3J0IHtUZW1wbGF0ZSwgcGFyc2VUZW1wbGF0ZXMsIGdldFdpdGhSZWRpcmVjdFRvfTsiLCJ2YXIgQmFubmVyTGlzdFdpZGdldCA9IGZ1bmN0aW9uIEJhbm5lckxpc3RXaWRnZXQoIGNvbmZpZyApIHtcclxuXHRjb25maWcgPSBjb25maWcgfHwge307XHJcblxyXG5cdC8vIENhbGwgcGFyZW50IGNvbnN0cnVjdG9yXHJcblx0QmFubmVyTGlzdFdpZGdldC5wYXJlbnQuY2FsbCggdGhpcywgY29uZmlnICk7XHJcblx0T08udWkubWl4aW4uR3JvdXBFbGVtZW50LmNhbGwoIHRoaXMsIHtcclxuXHRcdCRncm91cDogdGhpcy4kZWxlbWVudFxyXG5cdH0gKTtcclxuXHJcblx0dGhpcy5hZ2dyZWdhdGUoIHtcclxuXHRcdHJlbW92ZTogXCJiYW5uZXJSZW1vdmVcIlxyXG5cdH0gKTtcclxuXHJcblx0dGhpcy5jb25uZWN0KCB0aGlzLCB7XHJcblx0XHRiYW5uZXJSZW1vdmU6IFwib25CYW5uZXJSZW1vdmVcIlxyXG5cdH0gKTtcclxufTtcclxuXHJcbk9PLmluaGVyaXRDbGFzcyggQmFubmVyTGlzdFdpZGdldCwgT08udWkuV2lkZ2V0ICk7XHJcbk9PLm1peGluQ2xhc3MoIEJhbm5lckxpc3RXaWRnZXQsIE9PLnVpLm1peGluLkdyb3VwRWxlbWVudCApO1xyXG4vKlxyXG5tZXRob2RzIGZyb20gbWl4aW46XHJcbiAtIGFkZEl0ZW1zKCBpdGVtcywgW2luZGV4XSApIDogT08udWkuRWxlbWVudCAgKENIQUlOQUJMRSlcclxuIC0gY2xlYXJJdGVtcyggKSA6IE9PLnVpLkVsZW1lbnQgIChDSEFJTkFCTEUpXHJcbiAtIGZpbmRJdGVtRnJvbURhdGEoIGRhdGEgKSA6IE9PLnVpLkVsZW1lbnR8bnVsbFxyXG4gLSBmaW5kSXRlbXNGcm9tRGF0YSggZGF0YSApIDogT08udWkuRWxlbWVudFtdXHJcbiAtIHJlbW92ZUl0ZW1zKCBpdGVtcyApIDogT08udWkuRWxlbWVudCAgKENIQUlOQUJMRSlcclxuKi9cclxuXHJcbkJhbm5lckxpc3RXaWRnZXQucHJvdG90eXBlLm9uQmFubmVyUmVtb3ZlID0gZnVuY3Rpb24gKCBiYW5uZXIgKSB7XHJcblx0dGhpcy5yZW1vdmVJdGVtcyhbYmFubmVyXSk7XHJcbn07XHJcblxyXG5cclxuXHJcbmV4cG9ydCBkZWZhdWx0IEJhbm5lckxpc3RXaWRnZXQ7IiwiaW1wb3J0IFBhcmFtZXRlckxpc3RXaWRnZXQgZnJvbSBcIi4vUGFyYW1ldGVyTGlzdFdpZGdldFwiO1xyXG5pbXBvcnQgUGFyYW1ldGVyV2lkZ2V0IGZyb20gXCIuL1BhcmFtZXRlcldpZGdldFwiO1xyXG5pbXBvcnQgU3VnZ2VzdGlvbkxvb2t1cFRleHRJbnB1dFdpZGdldCBmcm9tIFwiLi9TdWdnZXN0aW9uTG9va3VwVGV4dElucHV0V2lkZ2V0XCI7XHJcblxyXG4vKiBUYXJnZXQgb3V0cHV0IChmcm9tIHJhdGVyIHYxKTpcclxuLy8gSFRNTFxyXG48c3BhbiBjbGFzcz1cInJhdGVyLWRpYWxvZy1wYXJhSW5wdXQgcmF0ZXItZGlhbG9nLXRleHRJbnB1dENvbnRhaW5lclwiPlxyXG5cdDxsYWJlbD48c3BhbiBjbGFzcz1cInJhdGVyLWRpYWxvZy1wYXJhLWNvZGVcIj5jYXRlZ29yeTwvc3Bhbj48L2xhYmVsPlxyXG5cdDxpbnB1dCB0eXBlPVwidGV4dFwiLz48YSB0aXRsZT1cInJlbW92ZVwiPng8L2E+PHdici8+XHJcbjwvc3Bhbj5cclxuLy8gQ1NTXHJcbi5yYXRlci1kaWFsb2ctcm93ID4gZGl2ID4gc3BhbiB7XHJcbiAgICBwYWRkaW5nLXJpZ2h0OiAwLjVlbTtcclxuICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XHJcbn1cclxuLnJhdGVyLWRpYWxvZy1hdXRvZmlsbCB7XHJcbiAgICBib3JkZXI6IDFweCBkYXNoZWQgI2NkMjBmZjtcclxuICAgIHBhZGRpbmc6IDAuMmVtO1xyXG4gICAgbWFyZ2luLXJpZ2h0OiAwLjJlbTtcclxufVxyXG5yYXRlci1kaWFsb2ctYXV0b2ZpbGw6OmFmdGVyIHtcclxuICAgIGNvbnRlbnQ6IFwiYXV0b2ZpbGxlZFwiO1xyXG4gICAgY29sb3I6ICNjZDIwZmY7XHJcbiAgICBmb250LXdlaWdodDogYm9sZDtcclxuICAgIGZvbnQtc2l6ZTogOTYlO1xyXG59XHJcbiovXHJcblxyXG5mdW5jdGlvbiBCYW5uZXJXaWRnZXQoIHRlbXBsYXRlLCBjb25maWcgKSB7XHJcblx0Ly8gQ29uZmlndXJhdGlvbiBpbml0aWFsaXphdGlvblxyXG5cdGNvbmZpZyA9IGNvbmZpZyB8fCB7fTtcclxuXHQvLyBDYWxsIHBhcmVudCBjb25zdHJ1Y3RvclxyXG5cdEJhbm5lcldpZGdldC5zdXBlci5jYWxsKCB0aGlzLCBjb25maWcgKTtcclxuXHJcblx0dGhpcy50ZW1wbGF0ZSA9IHRlbXBsYXRlO1xyXG5cclxuXHQvKiAtLS0gVElUTEUgQU5EIFJBVElOR1MgLS0tICovXHJcblxyXG5cdHRoaXMucmVtb3ZlQnV0dG9uID0gbmV3IE9PLnVpLkJ1dHRvbldpZGdldCgge1xyXG5cdFx0aWNvbjogXCJ0cmFzaFwiLFxyXG5cdFx0bGFiZWw6IFwiUmVtb3ZlIGJhbm5lclwiLFxyXG5cdFx0dGl0bGU6IFwiUmVtb3ZlIGJhbm5lclwiLFxyXG5cdFx0ZmxhZ3M6IFwiZGVzdHJ1Y3RpdmVcIixcclxuXHRcdCRlbGVtZW50OiAkKFwiPGRpdiBzdHlsZT1cXFwid2lkdGg6MTAwJVxcXCI+XCIpXHJcblx0fSApO1xyXG5cdHRoaXMuY2xlYXJCdXR0b24gPSBuZXcgT08udWkuQnV0dG9uV2lkZ2V0KCB7XHJcblx0XHRpY29uOiBcImNhbmNlbFwiLFxyXG5cdFx0bGFiZWw6IFwiQ2xlYXIgcGFyYW1ldGVyc1wiLFxyXG5cdFx0dGl0bGU6IFwiQ2xlYXIgcGFyYW1ldGVyc1wiLFxyXG5cdFx0ZmxhZ3M6IFwiZGVzdHJ1Y3RpdmVcIixcclxuXHRcdCRlbGVtZW50OiAkKFwiPGRpdiBzdHlsZT1cXFwid2lkdGg6MTAwJVxcXCI+XCIpXHJcblx0fSApO1xyXG5cdHRoaXMuYnlwYXNzQnV0dG9uID0gbmV3IE9PLnVpLkJ1dHRvbldpZGdldCgge1xyXG5cdFx0aWNvbjogXCJhcnRpY2xlUmVkaXJlY3RcIixcclxuXHRcdGxhYmVsOiBcIkJ5cGFzcyByZWRpcmVjdFwiLFxyXG5cdFx0dGl0bGU6IFwiQnlwYXNzIHJlZGlyZWN0XCIsXHJcblx0XHQkZWxlbWVudDogJChcIjxkaXYgc3R5bGU9XFxcIndpZHRoOjEwMCVcXFwiPlwiKVxyXG5cdH0gKTtcclxuXHR0aGlzLnJlbW92ZUJ1dHRvbi4kZWxlbWVudC5maW5kKFwiYVwiKS5jc3MoXCJ3aWR0aFwiLFwiMTAwJVwiKTtcclxuXHR0aGlzLmNsZWFyQnV0dG9uLiRlbGVtZW50LmZpbmQoXCJhXCIpLmNzcyhcIndpZHRoXCIsXCIxMDAlXCIpO1xyXG5cdHRoaXMuYnlwYXNzQnV0dG9uLiRlbGVtZW50LmZpbmQoXCJhXCIpLmNzcyhcIndpZHRoXCIsXCIxMDAlXCIpO1xyXG5cclxuXHR0aGlzLnRpdGxlQnV0dG9uc0dyb3VwID0gbmV3IE9PLnVpLkJ1dHRvbkdyb3VwV2lkZ2V0KCB7XHJcblx0XHRpdGVtczogdGVtcGxhdGUucmVkaXJlY3RUYXJnZXRcclxuXHRcdFx0PyBbIHRoaXMucmVtb3ZlQnV0dG9uLFxyXG5cdFx0XHRcdHRoaXMuY2xlYXJCdXR0b24sXHJcblx0XHRcdFx0dGhpcy5ieXBhc3NCdXR0b24gXVxyXG5cdFx0XHQ6IFsgdGhpcy5yZW1vdmVCdXR0b24sXHJcblx0XHRcdFx0dGhpcy5jbGVhckJ1dHRvbiBdLFxyXG5cdFx0JGVsZW1lbnQ6ICQoXCI8c3BhbiBzdHlsZT0nd2lkdGg6MTAwJTsnPlwiKSxcclxuXHR9ICk7XHJcblxyXG5cdHRoaXMubWFpbkxhYmVsUG9wdXBCdXR0b24gPSBuZXcgT08udWkuUG9wdXBCdXR0b25XaWRnZXQoIHtcclxuXHRcdGxhYmVsOiBcInt7XCIgKyB0aGlzLnRlbXBsYXRlLmdldFRpdGxlKCkuZ2V0TWFpblRleHQoKSArIFwifX1cIixcclxuXHRcdCRlbGVtZW50OiAkKFwiPHNwYW4gc3R5bGU9J2Rpc3BsYXk6aW5saW5lLWJsb2NrO3dpZHRoOjQ4JTttYXJnaW4tcmlnaHQ6MDtwYWRkaW5nLXJpZ2h0OjhweCc+XCIpLFxyXG5cdFx0aW5kaWNhdG9yOlwiZG93blwiLFxyXG5cdFx0ZnJhbWVkOmZhbHNlLFxyXG5cdFx0cG9wdXA6IHtcclxuXHRcdFx0JGNvbnRlbnQ6IHRoaXMudGl0bGVCdXR0b25zR3JvdXAuJGVsZW1lbnQsXHJcblx0XHRcdHdpZHRoOiAyMDAsXHJcblx0XHRcdHBhZGRlZDogZmFsc2UsXHJcblx0XHRcdGFsaWduOiBcImZvcmNlLXJpZ2h0XCIsXHJcblx0XHRcdGFuY2hvcjogZmFsc2VcclxuXHRcdH1cclxuXHR9ICk7XHJcblx0dGhpcy5tYWluTGFiZWxQb3B1cEJ1dHRvbi4kZWxlbWVudFxyXG5cdFx0LmNoaWxkcmVuKFwiYVwiKS5maXJzdCgpLmNzcyh7XCJmb250LXNpemVcIjpcIjExMCVcIn0pXHJcblx0XHQuZmluZChcInNwYW4ub28tdWktbGFiZWxFbGVtZW50LWxhYmVsXCIpLmNzcyh7XCJ3aGl0ZS1zcGFjZVwiOlwibm9ybWFsXCJ9KTtcclxuXHJcblx0Ly8gUmF0aW5nIGRyb3Bkb3duc1xyXG5cdHRoaXMuY2xhc3NEcm9wZG93biA9IG5ldyBPTy51aS5Ecm9wZG93bldpZGdldCgge1xyXG5cdFx0bGFiZWw6IG5ldyBPTy51aS5IdG1sU25pcHBldChcIjxzcGFuIHN0eWxlPVxcXCJjb2xvcjojNzc3XFxcIj5DbGFzczwvc3Bhbj5cIiksXHJcblx0XHRtZW51OiB7IC8vIEZJWE1FOiBuZWVkcyByZWFsIGRhdGFcclxuXHRcdFx0aXRlbXM6IFtcclxuXHRcdFx0XHRuZXcgT08udWkuTWVudU9wdGlvbldpZGdldCgge1xyXG5cdFx0XHRcdFx0ZGF0YTogXCJcIixcclxuXHRcdFx0XHRcdGxhYmVsOiBcIiBcIlxyXG5cdFx0XHRcdH0gKSxcclxuXHRcdFx0XHRuZXcgT08udWkuTWVudU9wdGlvbldpZGdldCgge1xyXG5cdFx0XHRcdFx0ZGF0YTogXCJCXCIsXHJcblx0XHRcdFx0XHRsYWJlbDogXCJCXCJcclxuXHRcdFx0XHR9ICksXHJcblx0XHRcdFx0bmV3IE9PLnVpLk1lbnVPcHRpb25XaWRnZXQoIHtcclxuXHRcdFx0XHRcdGRhdGE6IFwiQ1wiLFxyXG5cdFx0XHRcdFx0bGFiZWw6IFwiQ1wiXHJcblx0XHRcdFx0fSApLFxyXG5cdFx0XHRcdG5ldyBPTy51aS5NZW51T3B0aW9uV2lkZ2V0KCB7XHJcblx0XHRcdFx0XHRkYXRhOiBcInN0YXJ0XCIsXHJcblx0XHRcdFx0XHRsYWJlbDogXCJTdGFydFwiXHJcblx0XHRcdFx0fSApLFxyXG5cdFx0XHRdXHJcblx0XHR9LFxyXG5cdFx0JGVsZW1lbnQ6ICQoXCI8c3BhbiBzdHlsZT0nZGlzcGxheTppbmxpbmUtYmxvY2s7d2lkdGg6MjQlJz5cIiksXHJcblx0XHQkb3ZlcmxheTogdGhpcy4kb3ZlcmxheSxcclxuXHR9ICk7XHJcblx0dGhpcy5pbXBvcnRhbmNlRHJvcGRvd24gPSBuZXcgT08udWkuRHJvcGRvd25XaWRnZXQoIHtcclxuXHRcdGxhYmVsOiBuZXcgT08udWkuSHRtbFNuaXBwZXQoXCI8c3BhbiBzdHlsZT1cXFwiY29sb3I6Izc3N1xcXCI+SW1wb3J0YW5jZTwvc3Bhbj5cIiksXHJcblx0XHRtZW51OiB7IC8vIEZJWE1FOiBuZWVkcyByZWFsIGRhdGFcclxuXHRcdFx0aXRlbXM6IFtcclxuXHRcdFx0XHRuZXcgT08udWkuTWVudU9wdGlvbldpZGdldCgge1xyXG5cdFx0XHRcdFx0ZGF0YTogXCJcIixcclxuXHRcdFx0XHRcdGxhYmVsOiBcIiBcIlxyXG5cdFx0XHRcdH0gKSxcclxuXHRcdFx0XHRuZXcgT08udWkuTWVudU9wdGlvbldpZGdldCgge1xyXG5cdFx0XHRcdFx0ZGF0YTogXCJ0b3BcIixcclxuXHRcdFx0XHRcdGxhYmVsOiBcIlRvcFwiXHJcblx0XHRcdFx0fSApLFxyXG5cdFx0XHRcdG5ldyBPTy51aS5NZW51T3B0aW9uV2lkZ2V0KCB7XHJcblx0XHRcdFx0XHRkYXRhOiBcImhpZ2hcIixcclxuXHRcdFx0XHRcdGxhYmVsOiBcIkhpZ2hcIlxyXG5cdFx0XHRcdH0gKSxcclxuXHRcdFx0XHRuZXcgT08udWkuTWVudU9wdGlvbldpZGdldCgge1xyXG5cdFx0XHRcdFx0ZGF0YTogXCJtaWRcIixcclxuXHRcdFx0XHRcdGxhYmVsOiBcIk1pZFwiXHJcblx0XHRcdFx0fSApXHJcblx0XHRcdF1cclxuXHRcdH0sXHJcblx0XHQkZWxlbWVudDogJChcIjxzcGFuIHN0eWxlPSdkaXNwbGF5OmlubGluZS1ibG9jazt3aWR0aDoyNCUnPlwiKSxcclxuXHRcdCRvdmVybGF5OiB0aGlzLiRvdmVybGF5LFxyXG5cdH0gKTtcclxuXHR0aGlzLnRpdGxlTGF5b3V0ID0gbmV3IE9PLnVpLkhvcml6b250YWxMYXlvdXQoIHtcclxuXHRcdGl0ZW1zOiBbXHJcblx0XHRcdHRoaXMubWFpbkxhYmVsUG9wdXBCdXR0b24sXHJcblx0XHRcdHRoaXMuY2xhc3NEcm9wZG93bixcclxuXHRcdFx0dGhpcy5pbXBvcnRhbmNlRHJvcGRvd24sXHJcblx0XHRdXHJcblx0fSApO1xyXG5cclxuXHQvKiAtLS0gUEFSQU1FVEVSUyBMSVNUIC0tLSAqL1xyXG5cclxuXHR2YXIgcGFyYW1ldGVyV2lkZ2V0cyA9IHRoaXMudGVtcGxhdGUucGFyYW1ldGVyc1xyXG5cdFx0LmZpbHRlcihwYXJhbSA9PiBwYXJhbS5uYW1lICE9PSBcImNsYXNzXCIgJiYgcGFyYW0ubmFtZSAhPT0gXCJpbXBvcnRhbmNlXCIpXHJcblx0XHQubWFwKHBhcmFtID0+IG5ldyBQYXJhbWV0ZXJXaWRnZXQocGFyYW0sIHRoaXMudGVtcGxhdGUucGFyYW1EYXRhW3BhcmFtLm5hbWVdKSk7XHJcblxyXG5cdHRoaXMucGFyYW1ldGVyTGlzdCA9IG5ldyBQYXJhbWV0ZXJMaXN0V2lkZ2V0KCB7XHJcblx0XHRpdGVtczogcGFyYW1ldGVyV2lkZ2V0cyxcclxuXHRcdGRpc3BsYXlMaW1pdDogNlxyXG5cdH0gKTtcclxuXHJcblx0LyogLS0tIEFERCBQQVJBTUVURVIgU0VDVElPTiAtLS0gKi9cclxuXHJcblx0dGhpcy5hZGRQYXJhbWV0ZXJOYW1lSW5wdXQgPSBuZXcgU3VnZ2VzdGlvbkxvb2t1cFRleHRJbnB1dFdpZGdldCh7XHJcblx0XHRzdWdnZXN0aW9uczogdGhpcy50ZW1wbGF0ZS5wYXJhbWV0ZXJTdWdnZXN0aW9ucyxcclxuXHRcdHBsYWNlaG9sZGVyOiBcInBhcmFtZXRlciBuYW1lXCIsXHJcblx0XHQkZWxlbWVudDogJChcIjxkaXYgc3R5bGU9J2Rpc3BsYXk6aW5saW5lLWJsb2NrO3dpZHRoOjQwJSc+XCIpLFxyXG5cdFx0dmFsaWRhdGU6IGZ1bmN0aW9uKHZhbCkge1xyXG5cdFx0XHRsZXQge3ZhbGlkTmFtZSwgbmFtZSwgdmFsdWV9ID0gdGhpcy5nZXRBZGRQYXJhbWV0ZXJzSW5mbyh2YWwpO1xyXG5cdFx0XHRyZXR1cm4gKCFuYW1lICYmICF2YWx1ZSkgPyB0cnVlIDogdmFsaWROYW1lO1xyXG5cdFx0fS5iaW5kKHRoaXMpXHJcblx0fSk7XHJcblx0dGhpcy5hZGRQYXJhbWV0ZXJWYWx1ZUlucHV0ID0gbmV3IFN1Z2dlc3Rpb25Mb29rdXBUZXh0SW5wdXRXaWRnZXQoe1xyXG5cdFx0cGxhY2Vob2xkZXI6IFwicGFyYW1ldGVyIHZhbHVlXCIsXHJcblx0XHQkZWxlbWVudDogJChcIjxkaXYgc3R5bGU9J2Rpc3BsYXk6aW5saW5lLWJsb2NrO3dpZHRoOjQwJSc+XCIpLFxyXG5cdFx0dmFsaWRhdGU6IGZ1bmN0aW9uKHZhbCkge1xyXG5cdFx0XHRsZXQge3ZhbGlkVmFsdWUsIG5hbWUsIHZhbHVlfSA9IHRoaXMuZ2V0QWRkUGFyYW1ldGVyc0luZm8obnVsbCwgdmFsKTtcclxuXHRcdFx0cmV0dXJuICghbmFtZSAmJiAhdmFsdWUpID8gdHJ1ZSA6IHZhbGlkVmFsdWU7XHJcblx0XHR9LmJpbmQodGhpcylcclxuXHR9KTtcclxuXHR0aGlzLmFkZFBhcmFtZXRlckJ1dHRvbiA9IG5ldyBPTy51aS5CdXR0b25XaWRnZXQoe1xyXG5cdFx0bGFiZWw6IFwiQWRkXCIsXHJcblx0XHRpY29uOiBcImFkZFwiLFxyXG5cdFx0ZmxhZ3M6IFwicHJvZ3Jlc3NpdmVcIlxyXG5cdH0pLnNldERpc2FibGVkKHRydWUpO1xyXG5cdHRoaXMuYWRkUGFyYW1ldGVyQ29udHJvbHMgPSBuZXcgT08udWkuSG9yaXpvbnRhbExheW91dCgge1xyXG5cdFx0aXRlbXM6IFtcclxuXHRcdFx0dGhpcy5hZGRQYXJhbWV0ZXJOYW1lSW5wdXQsXHJcblx0XHRcdG5ldyBPTy51aS5MYWJlbFdpZGdldCh7bGFiZWw6XCI9XCJ9KSxcclxuXHRcdFx0dGhpcy5hZGRQYXJhbWV0ZXJWYWx1ZUlucHV0LFxyXG5cdFx0XHR0aGlzLmFkZFBhcmFtZXRlckJ1dHRvblxyXG5cdFx0XVxyXG5cdH0gKTtcclxuXHQvLyBIYWNrcyB0byBtYWtlIHRoaXMgSG9yaXpvbnRhbExheW91dCBnbyBpbnNpZGUgYSBGaWVsZExheW91dFxyXG5cdHRoaXMuYWRkUGFyYW1ldGVyQ29udHJvbHMuZ2V0SW5wdXRJZCA9ICgpID0+IGZhbHNlO1xyXG5cdHRoaXMuYWRkUGFyYW1ldGVyQ29udHJvbHMuaXNEaXNhYmxlZCA9ICgpID0+IGZhbHNlO1xyXG5cdHRoaXMuYWRkUGFyYW1ldGVyQ29udHJvbHMuc2ltdWxhdGVMYWJlbENsaWNrID0gKCkgPT4gdHJ1ZTtcclxuXHJcblx0dGhpcy5hZGRQYXJhbWV0ZXJMYXlvdXQgPSBuZXcgT08udWkuRmllbGRMYXlvdXQodGhpcy5hZGRQYXJhbWV0ZXJDb250cm9scywge1xyXG5cdFx0bGFiZWw6IFwiQWRkIHBhcmFtZXRlcjpcIixcclxuXHRcdGFsaWduOiBcInRvcFwiXHJcblx0fSkudG9nZ2xlKGZhbHNlKTtcclxuXHQvLyBBbmQgYW5vdGhlciBoYWNrXHJcblx0dGhpcy5hZGRQYXJhbWV0ZXJMYXlvdXQuJGVsZW1lbnQuZmluZChcIi5vby11aS1maWVsZExheW91dC1tZXNzYWdlc1wiKS5jc3Moe1xyXG5cdFx0XCJjbGVhclwiOiBcImJvdGhcIixcclxuXHRcdFwicGFkZGluZy10b3BcIjogMFxyXG5cdH0pO1xyXG5cclxuXHQvKiAtLS0gT1ZFUkFMTCBMQVlPVVQvRElTUExBWSAtLS0gKi9cclxuXHJcblx0Ly8gRGlzcGxheSB0aGUgbGF5b3V0IGVsZW1lbnRzLCBhbmQgYSBydWxlXHJcblx0dGhpcy4kZWxlbWVudC5hcHBlbmQoXHJcblx0XHR0aGlzLnRpdGxlTGF5b3V0LiRlbGVtZW50LFxyXG5cdFx0dGhpcy5wYXJhbWV0ZXJMaXN0LiRlbGVtZW50LFxyXG5cdFx0dGhpcy5hZGRQYXJhbWV0ZXJMYXlvdXQuJGVsZW1lbnQsXHJcblx0XHQkKFwiPGhyPlwiKVxyXG5cdCk7XHJcblxyXG5cdC8qIC0tLSBFVkVOVCBIQU5ETElORyAtLS0gKi9cclxuXHJcblx0dGhpcy5wYXJhbWV0ZXJMaXN0LmNvbm5lY3QoIHRoaXMsIHsgXCJhZGRQYXJhbWV0ZXJzQnV0dG9uQ2xpY2tcIjogXCJzaG93QWRkUGFyYW1ldGVySW5wdXRzXCIgfSApO1xyXG5cdHRoaXMuYWRkUGFyYW1ldGVyQnV0dG9uLmNvbm5lY3QodGhpcywgeyBcImNsaWNrXCI6IFwib25QYXJhbWV0ZXJBZGRcIiB9KTtcclxuXHR0aGlzLmFkZFBhcmFtZXRlck5hbWVJbnB1dC5jb25uZWN0KHRoaXMsIHsgXCJjaGFuZ2VcIjogXCJvbkFkZFBhcmFtZXRlck5hbWVDaGFuZ2VcIn0pO1xyXG5cdHRoaXMuYWRkUGFyYW1ldGVyVmFsdWVJbnB1dC5jb25uZWN0KHRoaXMsIHsgXCJjaGFuZ2VcIjogXCJvbkFkZFBhcmFtZXRlclZhbHVlQ2hhbmdlXCJ9KTtcclxuXHR0aGlzLnJlbW92ZUJ1dHRvbi5jb25uZWN0KHRoaXMsIHtcImNsaWNrXCI6IFwib25SZW1vdmVCdXR0b25DbGlja1wifSwgKTtcclxufVxyXG5PTy5pbmhlcml0Q2xhc3MoIEJhbm5lcldpZGdldCwgT08udWkuV2lkZ2V0ICk7XHJcblxyXG5CYW5uZXJXaWRnZXQucHJvdG90eXBlLnNob3dBZGRQYXJhbWV0ZXJJbnB1dHMgPSBmdW5jdGlvbigpIHtcclxuXHR0aGlzLmFkZFBhcmFtZXRlckxheW91dC50b2dnbGUodHJ1ZSk7XHJcbn07XHJcblxyXG5CYW5uZXJXaWRnZXQucHJvdG90eXBlLmdldEFkZFBhcmFtZXRlcnNJbmZvID0gZnVuY3Rpb24obmFtZUlucHV0VmFsLCB2YWx1ZUlucHV0VmFsKSB7XHJcblx0dmFyIG5hbWUgPSBuYW1lSW5wdXRWYWwgJiYgbmFtZUlucHV0VmFsLnRyaW0oKSB8fCB0aGlzLmFkZFBhcmFtZXRlck5hbWVJbnB1dC5nZXRWYWx1ZSgpLnRyaW0oKTtcclxuXHR2YXIgcGFyYW1BbHJlYWR5SW5jbHVkZWQgPSBuYW1lID09PSBcImNsYXNzXCIgfHxcclxuXHRcdG5hbWUgPT09IFwiaW1wb3J0YW5jZVwiIHx8XHJcblx0XHR0aGlzLnBhcmFtZXRlckxpc3QuaXRlbXMuc29tZShwYXJhbVdpZGdldCA9PiBwYXJhbVdpZGdldC5wYXJhbWV0ZXIgJiYgcGFyYW1XaWRnZXQucGFyYW1ldGVyLm5hbWUgPT09IG5hbWUpO1xyXG5cdHZhciB2YWx1ZSA9IHZhbHVlSW5wdXRWYWwgJiYgdmFsdWVJbnB1dFZhbC50cmltKCkgfHwgdGhpcy5hZGRQYXJhbWV0ZXJWYWx1ZUlucHV0LmdldFZhbHVlKCkudHJpbSgpO1xyXG5cdHZhciBhdXRvdmFsdWUgPSBuYW1lICYmIHRoaXMudGVtcGxhdGUucGFyYW1EYXRhW25hbWVdICYmIHRoaXMudGVtcGxhdGUucGFyYW1EYXRhW25hbWVdLmF1dG92YWx1ZSB8fCBudWxsO1xyXG5cdHJldHVybiB7XHJcblx0XHR2YWxpZE5hbWU6ICEhKG5hbWUgJiYgIXBhcmFtQWxyZWFkeUluY2x1ZGVkKSxcclxuXHRcdHZhbGlkVmFsdWU6ICEhKHZhbHVlIHx8IGF1dG92YWx1ZSksXHJcblx0XHRpc0F1dG92YWx1ZTogISEoIXZhbHVlICYmIGF1dG92YWx1ZSksXHJcblx0XHRpc0FscmVhZHlJbmNsdWRlZDogISEobmFtZSAmJiBwYXJhbUFscmVhZHlJbmNsdWRlZCksXHJcblx0XHRuYW1lLFxyXG5cdFx0dmFsdWUsXHJcblx0XHRhdXRvdmFsdWVcclxuXHR9O1xyXG59O1xyXG5cclxuQmFubmVyV2lkZ2V0LnByb3RvdHlwZS5vbkFkZFBhcmFtZXRlck5hbWVDaGFuZ2UgPSBmdW5jdGlvbigpIHtcclxuXHRsZXQgeyB2YWxpZE5hbWUsIHZhbGlkVmFsdWUsIGlzQXV0b3ZhbHVlLCBpc0FscmVhZHlJbmNsdWRlZCwgbmFtZSwgYXV0b3ZhbHVlIH0gPSB0aGlzLmdldEFkZFBhcmFtZXRlcnNJbmZvKCk7XHJcblx0Ly8gU2V0IHZhbHVlIGlucHV0IHBsYWNlaG9sZGVyIGFzIHRoZSBhdXRvdmFsdWVcclxuXHR0aGlzLmFkZFBhcmFtZXRlclZhbHVlSW5wdXQuJGlucHV0LmF0dHIoIFwicGxhY2Vob2xkZXJcIiwgIGF1dG92YWx1ZSB8fCBcIlwiICk7XHJcblx0Ly8gU2V0IHN1Z2dlc3Rpb25zLCBpZiB0aGUgcGFyYW1ldGVyIGhhcyBhIGxpc3Qgb2YgYWxsb3dlZCB2YWx1ZXNcclxuXHR2YXIgYWxsb3dlZFZhbHVlcyA9IHRoaXMudGVtcGxhdGUucGFyYW1EYXRhW25hbWVdICYmXHJcblx0XHR0aGlzLnRlbXBsYXRlLnBhcmFtRGF0YVtuYW1lXS5hbGxvd2VkVmFsdWVzICYmIFxyXG5cdFx0dGhpcy50ZW1wbGF0ZS5wYXJhbURhdGFbbmFtZV0uYWxsb3dlZFZhbHVlcy5tYXAodmFsID0+IHtyZXR1cm4ge2RhdGE6IHZhbCwgbGFiZWw6dmFsfTsgfSk7XHJcblx0dGhpcy5hZGRQYXJhbWV0ZXJWYWx1ZUlucHV0LnNldFN1Z2dlc3Rpb25zKGFsbG93ZWRWYWx1ZXMgfHwgW10pO1xyXG5cdC8vIFNldCBidXR0b24gZGlzYWJsZWQgc3RhdGUgYmFzZWQgb24gdmFsaWRpdHlcclxuXHR0aGlzLmFkZFBhcmFtZXRlckJ1dHRvbi5zZXREaXNhYmxlZCghdmFsaWROYW1lIHx8ICF2YWxpZFZhbHVlKTtcclxuXHQvLyBTaG93IG5vdGljZSBpZiBhdXRvdmFsdWUgd2lsbCBiZSB1c2VkXHJcblx0dGhpcy5hZGRQYXJhbWV0ZXJMYXlvdXQuc2V0Tm90aWNlcyggdmFsaWROYW1lICYmIGlzQXV0b3ZhbHVlID8gW1wiUGFyYW1ldGVyIHZhbHVlIHdpbGwgYmUgYXV0b2ZpbGxlZFwiXSA6IFtdICk7XHJcblx0Ly8gU2hvdyBlcnJvciBpcyB0aGUgYmFubmVyIGFscmVhZHkgaGFzIHRoZSBwYXJhbWV0ZXIgc2V0XHJcblx0dGhpcy5hZGRQYXJhbWV0ZXJMYXlvdXQuc2V0RXJyb3JzKCBpc0FscmVhZHlJbmNsdWRlZCA/IFtcIlBhcmFtZXRlciBpcyBhbHJlYWR5IHByZXNlbnRcIl0gOiBbXSApO1xyXG59O1xyXG5cclxuQmFubmVyV2lkZ2V0LnByb3RvdHlwZS5vbkFkZFBhcmFtZXRlclZhbHVlQ2hhbmdlID0gZnVuY3Rpb24oKSB7XHJcblx0bGV0IHsgdmFsaWROYW1lLCB2YWxpZFZhbHVlLCBpc0F1dG92YWx1ZSB9ID0gdGhpcy5nZXRBZGRQYXJhbWV0ZXJzSW5mbygpO1xyXG5cdHRoaXMuYWRkUGFyYW1ldGVyQnV0dG9uLnNldERpc2FibGVkKCF2YWxpZE5hbWUgfHwgIXZhbGlkVmFsdWUpO1xyXG5cdHRoaXMuYWRkUGFyYW1ldGVyTGF5b3V0LnNldE5vdGljZXMoIHZhbGlkTmFtZSAmJiBpc0F1dG92YWx1ZSA/IFtcIlBhcmFtZXRlciB2YWx1ZSB3aWxsIGJlIGF1dG9maWxsZWRcIl0gOiBbXSApOyBcclxufTtcclxuXHJcbkJhbm5lcldpZGdldC5wcm90b3R5cGUub25QYXJhbWV0ZXJBZGQgPSBmdW5jdGlvbigpIHtcclxuXHRsZXQgeyB2YWxpZE5hbWUsIHZhbGlkVmFsdWUsIG5hbWUsIHZhbHVlLCBhdXRvdmFsdWUgfSAgPSB0aGlzLmdldEFkZFBhcmFtZXRlcnNJbmZvKCk7XHJcblx0aWYgKCF2YWxpZE5hbWUgfHwgIXZhbGlkVmFsdWUpIHtcclxuXHRcdC8vIEVycm9yIHNob3VsZCBhbHJlYWR5IGJlIHNob3duIHZpYSBvbkFkZFBhcmFtZXRlci4uLkNoYW5nZSBtZXRob2RzXHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cdHZhciBuZXdQYXJhbWV0ZXIgPSBuZXcgUGFyYW1ldGVyV2lkZ2V0KFxyXG5cdFx0e1xyXG5cdFx0XHRcIm5hbWVcIjogbmFtZSxcclxuXHRcdFx0XCJ2YWx1ZVwiOiB2YWx1ZSB8fCBhdXRvdmFsdWVcclxuXHRcdH0sXHJcblx0XHR0aGlzLnRlbXBsYXRlLnBhcmFtRGF0YVtuYW1lXVxyXG5cdCk7XHJcblx0dGhpcy5wYXJhbWV0ZXJMaXN0LmFkZEl0ZW1zKFtuZXdQYXJhbWV0ZXJdKTtcclxuXHR0aGlzLmFkZFBhcmFtZXRlck5hbWVJbnB1dC5zZXRWYWx1ZShcIlwiKTtcclxuXHR0aGlzLmFkZFBhcmFtZXRlclZhbHVlSW5wdXQuc2V0VmFsdWUoXCJcIik7XHJcblx0dGhpcy5hZGRQYXJhbWV0ZXJOYW1lSW5wdXQuZm9jdXMoKTtcclxufTtcclxuXHJcbkJhbm5lcldpZGdldC5wcm90b3R5cGUub25SZW1vdmVCdXR0b25DbGljayA9IGZ1bmN0aW9uKCkge1xyXG5cdHRoaXMuZW1pdChcInJlbW92ZVwiKTtcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IEJhbm5lcldpZGdldDsiLCIvKipcclxuICogQGNmZyB7T08udWkuRWxlbWVudFtdfSBpdGVtcyBJdGVtcyB0byBiZSBhZGRlZFxyXG4gKiBAY2ZnIHtOdW1iZXJ9IGRpc3BsYXlMaW1pdCBUaGUgbW9zdCB0byBzaG93IGF0IG9uY2UuIElmIHRoZSBudW1iZXIgb2YgaXRlbXNcclxuICogIGlzIG1vcmUgdGhhbiB0aGlzLCB0aGVuIG9ubHkgdGhlIGZpcnN0IChkaXNwbGF5TGltaXQgLSAxKSBpdGVtcyBhcmUgc2hvd24uXHJcbiAqL1xyXG52YXIgUGFyYW1ldGVyTGlzdFdpZGdldCA9IGZ1bmN0aW9uIFBhcmFtZXRlckxpc3RXaWRnZXQoIGNvbmZpZyApIHtcclxuXHRjb25maWcgPSBjb25maWcgfHwge307XHJcblxyXG5cdC8vIENhbGwgcGFyZW50IGNvbnN0cnVjdG9yXHJcblx0UGFyYW1ldGVyTGlzdFdpZGdldC5wYXJlbnQuY2FsbCggdGhpcywgY29uZmlnICk7XHJcblx0T08udWkubWl4aW4uR3JvdXBFbGVtZW50LmNhbGwoIHRoaXMsIHtcclxuXHRcdCRncm91cDogdGhpcy4kZWxlbWVudFxyXG5cdH0gKTtcclxuXHR0aGlzLmFkZEl0ZW1zKCBjb25maWcuaXRlbXMgKTtcclxuICAgXHJcblx0Ly8gSGlkZSBzb21lIHBhcmFtZXRlcnMgKGluaXRpYWxseSksIGlmIG1vcmUgdGhhbiBzZXQgZGlzcGxheSBsaW1pdFxyXG5cdGlmIChjb25maWcuZGlzcGxheUxpbWl0ICYmIHRoaXMuaXRlbXMubGVuZ3RoID4gY29uZmlnLmRpc3BsYXlMaW1pdCApIHtcclxuXHRcdHZhciBoaWRlRnJvbU51bWJlciA9IGNvbmZpZy5kaXNwbGF5TGltaXQgLSAxOyAvLyBPbmUtaW5kZXhlZFxyXG5cdFx0dmFyIGhpZGVGcm9tSW5kZXggPSBoaWRlRnJvbU51bWJlciAtIDE7IC8vIFplcm8taW5kZXhlZFxyXG5cdFx0Zm9yIChsZXQgaSA9IGhpZGVGcm9tSW5kZXg7IGkgPCB0aGlzLml0ZW1zLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdHRoaXMuaXRlbXNbaV0udG9nZ2xlKGZhbHNlKTtcclxuXHRcdH1cclxuXHRcdC8vIEFkZCBidXR0b24gdG8gc2hvdyB0aGUgaGlkZGVuIHBhcmFtc1xyXG5cdFx0dGhpcy5zaG93TW9yZVBhcmFtZXRlcnNCdXR0b24gPSBuZXcgT08udWkuQnV0dG9uV2lkZ2V0KHtcclxuXHRcdFx0bGFiZWw6IFwiU2hvdyBcIisodGhpcy5pdGVtcy5sZW5ndGggLSBjb25maWcuZGlzcGxheUxpbWl0IC0gMSkrXCIgbW9yZSBwYXJhbXRlcnNcIixcclxuXHRcdFx0ZnJhbWVkOiBmYWxzZSxcclxuXHRcdFx0JGVsZW1lbnQ6ICQoXCI8c3BhbiBzdHlsZT0nbWFyZ2luLWJvdHRvbTowJz5cIilcclxuXHRcdH0pO1xyXG5cdFx0dGhpcy5hZGRJdGVtcyhbdGhpcy5zaG93TW9yZVBhcmFtZXRlcnNCdXR0b25dKTtcclxuXHR9XHJcblxyXG5cdC8vIEFkZCB0aGUgYnV0dG9uIHRoYXQgYWxsb3dzIHVzZXIgdG8gYWRkIG1vcmUgcGFyYW1ldGVyc1xyXG5cdHRoaXMuYWRkUGFyYW1ldGVyc0J1dHRvbiA9IG5ldyBPTy51aS5CdXR0b25XaWRnZXQoe1xyXG5cdFx0bGFiZWw6IFwiQWRkIHBhcmFtdGVyXCIsXHJcblx0XHRpY29uOiBcImFkZFwiLFxyXG5cdFx0ZnJhbWVkOiBmYWxzZSxcclxuXHRcdCRlbGVtZW50OiAkKFwiPHNwYW4gc3R5bGU9J21hcmdpbi1ib3R0b206MCc+XCIpXHJcblx0fSk7XHJcblx0dGhpcy5hZGRJdGVtcyhbdGhpcy5hZGRQYXJhbWV0ZXJzQnV0dG9uXSk7XHJcblxyXG5cdC8vIEhhbmRsZSBkZWxldGUgZXZlbnRzIGZyb20gUGFyYW1ldGVyV2lkZ2V0c1xyXG5cdHRoaXMuYWdncmVnYXRlKCB7IGRlbGV0ZTogXCJwYXJhbWV0ZXJEZWxldGVcIlx0fSApO1xyXG5cdHRoaXMuY29ubmVjdCggdGhpcywgeyBwYXJhbWV0ZXJEZWxldGU6IFwib25QYXJhbWV0ZXJEZWxldGVcIiB9ICk7XHJcbiAgICBcclxuXHQvLyBIYW5kbGUgYnV0dG9uIGNsaWNrc1xyXG5cdGlmICh0aGlzLnNob3dNb3JlUGFyYW1ldGVyc0J1dHRvbiApIHtcclxuXHRcdHRoaXMuc2hvd01vcmVQYXJhbWV0ZXJzQnV0dG9uLmNvbm5lY3QoIHRoaXMsIHsgXCJjbGlja1wiOiBcIm9uU2hvd01vcmVQYXJhbWV0ZXJzQnV0dG9uQ2xpY2tcIiB9ICk7XHJcblx0fVxyXG5cdHRoaXMuYWRkUGFyYW1ldGVyc0J1dHRvbi5jb25uZWN0KCB0aGlzLCB7IFwiY2xpY2tcIjogXCJvbkFkZFBhcmFtZXRlcnNCdXR0b25DbGlja1wiIH0gKTtcclxufTtcclxuXHJcbk9PLmluaGVyaXRDbGFzcyggUGFyYW1ldGVyTGlzdFdpZGdldCwgT08udWkuV2lkZ2V0ICk7XHJcbk9PLm1peGluQ2xhc3MoIFBhcmFtZXRlckxpc3RXaWRnZXQsIE9PLnVpLm1peGluLkdyb3VwRWxlbWVudCApO1xyXG4vKlxyXG5tZXRob2RzIGZyb20gbWl4aW46XHJcbiAtIGFkZEl0ZW1zKCBpdGVtcywgW2luZGV4XSApIDogT08udWkuRWxlbWVudCAgKENIQUlOQUJMRSlcclxuIC0gY2xlYXJJdGVtcyggKSA6IE9PLnVpLkVsZW1lbnQgIChDSEFJTkFCTEUpXHJcbiAtIGZpbmRJdGVtRnJvbURhdGEoIGRhdGEgKSA6IE9PLnVpLkVsZW1lbnR8bnVsbFxyXG4gLSBmaW5kSXRlbXNGcm9tRGF0YSggZGF0YSApIDogT08udWkuRWxlbWVudFtdXHJcbiAtIHJlbW92ZUl0ZW1zKCBpdGVtcyApIDogT08udWkuRWxlbWVudCAgKENIQUlOQUJMRSlcclxuKi9cclxuXHJcblBhcmFtZXRlckxpc3RXaWRnZXQucHJvdG90eXBlLm9uUGFyYW1ldGVyRGVsZXRlID0gZnVuY3Rpb24gKCBwYXJhbWV0ZXIgKSB7XHJcblx0dGhpcy5yZW1vdmVJdGVtcyhbcGFyYW1ldGVyXSk7XHJcbn07XHJcblxyXG5QYXJhbWV0ZXJMaXN0V2lkZ2V0LnByb3RvdHlwZS5nZXRQYXJhbWV0ZXJJdGVtcyA9IGZ1bmN0aW9uKCkge1xyXG5cdHJldHVybiB0aGlzLml0ZW1zLmZpbHRlcihpdGVtID0+IGl0ZW0uY29uc3RydWN0b3IubmFtZSA9PT0gXCJQYXJhbWV0ZXJXaWRnZXRcIik7XHJcbn07XHJcblxyXG5QYXJhbWV0ZXJMaXN0V2lkZ2V0LnByb3RvdHlwZS5vblNob3dNb3JlUGFyYW1ldGVyc0J1dHRvbkNsaWNrID0gZnVuY3Rpb24oKSB7XHJcblx0dGhpcy5yZW1vdmVJdGVtcyhbdGhpcy5zaG93TW9yZVBhcmFtZXRlcnNCdXR0b25dKTtcclxuXHR0aGlzLml0ZW1zLmZvckVhY2gocGFyYW1ldGVyV2lkZ2V0ID0+IHBhcmFtZXRlcldpZGdldC50b2dnbGUodHJ1ZSkpO1xyXG59O1xyXG5cclxuUGFyYW1ldGVyTGlzdFdpZGdldC5wcm90b3R5cGUub25BZGRQYXJhbWV0ZXJzQnV0dG9uQ2xpY2sgPSBmdW5jdGlvbigpIHtcclxuXHR0aGlzLnJlbW92ZUl0ZW1zKFt0aGlzLmFkZFBhcmFtZXRlcnNCdXR0b25dKTtcclxuXHR0aGlzLmVtaXQoXCJhZGRQYXJhbWV0ZXJzQnV0dG9uQ2xpY2tcIik7XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBQYXJhbWV0ZXJMaXN0V2lkZ2V0OyIsImZ1bmN0aW9uIFBhcmFtZXRlcldpZGdldCggcGFyYW1ldGVyLCBwYXJhbURhdGEsIGNvbmZpZyApIHtcclxuXHQvLyBDb25maWd1cmF0aW9uIGluaXRpYWxpemF0aW9uXHJcblx0Y29uZmlnID0gY29uZmlnIHx8IHt9O1xyXG5cdC8vIENhbGwgcGFyZW50IGNvbnN0cnVjdG9yXHJcblx0UGFyYW1ldGVyV2lkZ2V0LnN1cGVyLmNhbGwoIHRoaXMsIGNvbmZpZyApO1xyXG4gICAgXHJcblx0dGhpcy5wYXJhbWV0ZXIgPSBwYXJhbWV0ZXI7XHJcblx0dGhpcy5wYXJhbURhdGEgPSBwYXJhbURhdGEgfHwge307XHJcblxyXG5cdC8vIE1ha2UgdGhlIGlucHV0LiBUeXBlIGNhbiBiZSBjaGVja2JveCwgb3IgZHJvcGRvd24sIG9yIHRleHQgaW5wdXQsXHJcblx0Ly8gZGVwZW5kaW5nIG9uIG51bWJlciBvZiBhbGxvd2VkIHZhbHVlcyBpbiBwYXJhbSBkYXRhLlxyXG5cdHRoaXMuYWxsb3dlZFZhbHVlcyA9IHBhcmFtRGF0YSAmJiBwYXJhbURhdGEuYWxsb3dlZFZhbHVlcyB8fCBbXTtcclxuXHQvLyBzd2l0Y2ggKHRydWUpIHtcclxuXHQvLyBjYXNlIHRoaXMuYWxsb3dlZFZhbHVlcy5sZW5ndGggPT09IDA6XHJcblx0Ly8gY2FzZSBwYXJhbWV0ZXIudmFsdWUgJiYgIXRoaXMuYWxsb3dlZFZhbHVlcy5pbmNsdWRlcyhwYXJhbWV0ZXIudmFsdWUpOlxyXG5cdC8vIFx0Ly8gVGV4dCBpbnB1dFxyXG5cdC8vIFx0YnJlYWs7XHJcblx0Ly8gY2FzZSAxOlxyXG5cdC8vIFx0Ly8gQ2hlY2tib3ggKGxhYmVsbGVkIG9ubHkgd2hlbiBib3RoIGNoZWNrZWQpXHJcblx0Ly8gXHR0aGlzLmFsbG93ZWRWYWx1ZXMgPSBbbnVsbCwgLi4udGhpcy5hbGxvd2VkVmFsdWVzXTtcclxuXHQvLyBcdC8qIC4uLmZhbGxzIHRocm91Z2guLi4gKi9cclxuXHQvLyBjYXNlIDI6XHJcblx0Ly8gXHQvLyBDaGVja2JveCAobGFiZWxsZWQgd2hlbiBib3RoIGNoZWNrZWQgYW5kIG5vdCBjaGVja2VkKVxyXG5cdC8vIFx0dGhpcy5pbnB1dCA9IG5ldyBPTy51aS5DaGVja2JveE11bHRpb3B0aW9uV2lkZ2V0KCB7XHJcblx0Ly8gXHRcdGRhdGE6IHBhcmFtZXRlci52YWx1ZSxcclxuXHQvLyBcdFx0c2VsZWN0ZWQ6IHRoaXMuYWxsb3dlZFZhbHVlcy5pbmRleE9mKHBhcmFtZXRlci52YWx1ZSkgPT09IDEsXHJcblx0Ly8gXHRcdGxhYmVsOiAkKFwiPGNvZGU+XCIpLnRleHQocGFyYW1ldGVyLnZhbHVlIHx8IFwiXCIpXHJcblx0Ly8gXHR9ICk7XHJcblx0Ly8gXHRicmVhaztcclxuXHQvLyBkZWZhdWx0OlxyXG5cdC8vIFx0Ly8gRHJvcGRvd25cclxuXHQvLyBcdHRoaXMuaW5wdXQgPSBuZXcgT08udWkuRHJvcGRvd25XaWRnZXQoIHtcclxuXHQvLyBcdFx0bWVudToge1xyXG5cdC8vIFx0XHRcdGl0ZW1zOiB0aGlzLmFsbG93ZWRWYWx1ZXMubWFwKGFsbG93ZWRWYWwgPT4gbmV3IE9PLnVpLk1lbnVPcHRpb25XaWRnZXQoe1xyXG5cdC8vIFx0XHRcdFx0ZGF0YTogYWxsb3dlZFZhbCxcclxuXHQvLyBcdFx0XHRcdGxhYmVsOiBhbGxvd2VkVmFsXHJcblx0Ly8gXHRcdFx0fSkgKVxyXG5cdC8vIFx0XHR9XHJcblx0Ly8gXHR9ICk7XHJcblx0Ly8gXHR0aGlzLmlucHV0LmdldE1lbnUoKS5zZWxlY3RJdGVtQnlEYXRhKHBhcmFtZXRlci52YWx1ZSk7XHJcblx0Ly8gXHRicmVhaztcclxuXHQvLyB9XHJcblx0Ly8gVE9ETzogVXNlIGFib3ZlIGxvZ2ljLCBvciBzb21ldGhpbmcgc2ltaWxhci4gRm9yIG5vdywganVzdCBjcmVhdGUgYSBDb21ib0JveFxyXG5cdHRoaXMuaW5wdXQgPSBuZXcgT08udWkuQ29tYm9Cb3hJbnB1dFdpZGdldCgge1xyXG5cdFx0dmFsdWU6IHRoaXMucGFyYW1ldGVyLnZhbHVlLFxyXG5cdFx0Ly8gbGFiZWw6IHBhcmFtZXRlci5uYW1lICsgXCIgPVwiLFxyXG5cdFx0Ly8gbGFiZWxQb3NpdGlvbjogXCJiZWZvcmVcIixcclxuXHRcdG9wdGlvbnM6IHRoaXMuYWxsb3dlZFZhbHVlcy5tYXAodmFsID0+IHtyZXR1cm4ge2RhdGE6IHZhbCwgbGFiZWw6dmFsfTsgfSksXHJcblx0XHQkZWxlbWVudDogJChcIjxkaXYgc3R5bGU9J3dpZHRoOmNhbGMoMTAwJSAtIDcwcHgpO21hcmdpbi1yaWdodDowOyc+XCIpIC8vIHRoZSA3MHB4IGxlYXZlcyByb29tIGZvciBidXR0b25zXHJcblx0fSApO1xyXG5cdC8vIFJlZHVjZSB0aGUgZXhjZXNzaXZlIHdoaXRlc3BhY2UvaGVpZ2h0XHJcblx0dGhpcy5pbnB1dC4kZWxlbWVudC5maW5kKFwiaW5wdXRcIikuY3NzKHtcclxuXHRcdFwicGFkZGluZy10b3BcIjogMCxcclxuXHRcdFwicGFkZGluZy1ib3R0b21cIjogXCIycHhcIixcclxuXHRcdFwiaGVpZ2h0XCI6IFwiMjRweFwiXHJcblx0fSk7XHJcblx0Ly8gRml4IGxhYmVsIHBvc2l0aW9uaW5nIHdpdGhpbiB0aGUgcmVkdWNlZCBoZWlnaHRcclxuXHR0aGlzLmlucHV0LiRlbGVtZW50LmZpbmQoXCJzcGFuLm9vLXVpLWxhYmVsRWxlbWVudC1sYWJlbFwiKS5jc3Moe1wibGluZS1oZWlnaHRcIjogXCJub3JtYWxcIn0pO1xyXG5cdC8vIEFsc28gcmVkdWNlIGhlaWdodCBvZiBkcm9wZG93biBidXR0b24gKGlmIG9wdGlvbnMgYXJlIHByZXNlbnQpXHJcblx0dGhpcy5pbnB1dC4kZWxlbWVudC5maW5kKFwiYS5vby11aS1idXR0b25FbGVtZW50LWJ1dHRvblwiKS5jc3Moe1xyXG5cdFx0XCJwYWRkaW5nLXRvcFwiOiAwLFxyXG5cdFx0XCJoZWlnaHRcIjogXCIyNHB4XCIsXHJcblx0XHRcIm1pbi1oZWlnaHRcIjogXCIwXCJcclxuXHR9KTtcclxuXHJcblx0Ly92YXIgZGVzY3JpcHRpb24gPSB0aGlzLnBhcmFtRGF0YVtwYXJhbWV0ZXIubmFtZV0gJiYgdGhpcy5wYXJhbURhdGFbcGFyYW1ldGVyLm5hbWVdLmxhYmVsICYmIHRoaXMucGFyYW1EYXRhW3BhcmFtZXRlci5uYW1lXS5sYWJlbC5lbjtcclxuXHQvLyB2YXIgcGFyYW1OYW1lID0gbmV3IE9PLnVpLkxhYmVsV2lkZ2V0KHtcclxuXHQvLyBcdGxhYmVsOiBcInxcIiArIHBhcmFtZXRlci5uYW1lICsgXCI9XCIsXHJcblx0Ly8gXHQkZWxlbWVudDogJChcIjxjb2RlPlwiKVxyXG5cdC8vIH0pO1xyXG5cdHRoaXMuZGVsZXRlQnV0dG9uID0gbmV3IE9PLnVpLkJ1dHRvbldpZGdldCh7XHJcblx0XHRpY29uOiBcImNsZWFyXCIsXHJcblx0XHRmcmFtZWQ6IGZhbHNlLFxyXG5cdFx0ZmxhZ3M6IFwiZGVzdHJ1Y3RpdmVcIlxyXG5cdH0pO1xyXG5cdHRoaXMuZGVsZXRlQnV0dG9uLiRlbGVtZW50LmZpbmQoXCJhIHNwYW5cIikuZmlyc3QoKS5jc3Moe1xyXG5cdFx0XCJtaW4td2lkdGhcIjogXCJ1bnNldFwiLFxyXG5cdFx0XCJ3aWR0aFwiOiBcIjE2cHhcIlxyXG5cdH0pO1xyXG4gICAgXHJcblx0dGhpcy5jb25maXJtQnV0dG9uID0gbmV3IE9PLnVpLkJ1dHRvbldpZGdldCh7XHJcblx0XHRpY29uOiBcImNoZWNrXCIsXHJcblx0XHRmcmFtZWQ6IGZhbHNlLFxyXG5cdFx0ZmxhZ3M6IFwicHJvZ3Jlc3NpdmVcIixcclxuXHRcdCRlbGVtZW50OiAkKFwiPHNwYW4gc3R5bGU9J21hcmdpbi1yaWdodDowJz5cIilcclxuXHR9KTtcclxuXHR0aGlzLmNvbmZpcm1CdXR0b24uJGVsZW1lbnQuZmluZChcImEgc3BhblwiKS5maXJzdCgpLmNzcyh7XHJcblx0XHRcIm1pbi13aWR0aFwiOiBcInVuc2V0XCIsXHJcblx0XHRcIndpZHRoXCI6IFwiMTZweFwiLFxyXG5cdFx0XCJtYXJnaW4tcmlnaHRcIjogMFxyXG5cdH0pO1xyXG5cclxuXHR0aGlzLmVkaXRMYXlvdXRDb250cm9scyA9IG5ldyBPTy51aS5Ib3Jpem9udGFsTGF5b3V0KHtcclxuXHRcdGl0ZW1zOiBbXHJcblx0XHRcdHRoaXMuaW5wdXQsXHJcblx0XHRcdHRoaXMuY29uZmlybUJ1dHRvbixcclxuXHRcdFx0dGhpcy5kZWxldGVCdXR0b25cclxuXHRcdF0sXHJcblx0XHQvLyRlbGVtZW50OiAkKFwiPGRpdiBzdHlsZT0nd2lkdGg6IDQ4JTttYXJnaW46MDsnPlwiKVxyXG5cdH0pO1xyXG5cdC8vIEhhY2tzIHRvIG1ha2UgdGhpcyBIb3Jpem9udGFsTGF5b3V0IGdvIGluc2lkZSBhIEZpZWxkTGF5b3V0XHJcblx0dGhpcy5lZGl0TGF5b3V0Q29udHJvbHMuZ2V0SW5wdXRJZCA9ICgpID0+IGZhbHNlO1xyXG5cdHRoaXMuZWRpdExheW91dENvbnRyb2xzLmlzRGlzYWJsZWQgPSAoKSA9PiBmYWxzZTtcclxuXHR0aGlzLmVkaXRMYXlvdXRDb250cm9scy5zaW11bGF0ZUxhYmVsQ2xpY2sgPSAoKSA9PiB0cnVlO1xyXG5cclxuXHR0aGlzLmVkaXRMYXlvdXQgPSBuZXcgT08udWkuRmllbGRMYXlvdXQoIHRoaXMuZWRpdExheW91dENvbnRyb2xzLCB7XHJcblx0XHRsYWJlbDogdGhpcy5wYXJhbWV0ZXIubmFtZSArIFwiID1cIixcclxuXHRcdGFsaWduOiBcInRvcFwiLFxyXG5cdFx0aGVscDogdGhpcy5wYXJhbURhdGEuZGVzY3JpcHRpb24gJiYgdGhpcy5wYXJhbURhdGEuZGVzY3JpcHRpb24uZW4gfHwgZmFsc2UsXHJcblx0XHRoZWxwSW5saW5lOiB0cnVlXHJcblx0fSkudG9nZ2xlKCk7XHJcblx0dGhpcy5lZGl0TGF5b3V0LiRlbGVtZW50LmZpbmQoXCJsYWJlbC5vby11aS1pbmxpbmUtaGVscFwiKS5jc3Moe1wibWFyZ2luXCI6IFwiLTEwcHggMCA1cHggMTBweFwifSk7XHJcblxyXG5cdHRoaXMuZnVsbExhYmVsID0gbmV3IE9PLnVpLkxhYmVsV2lkZ2V0KHtcclxuXHRcdGxhYmVsOiB0aGlzLnBhcmFtZXRlci5uYW1lICsgXCIgPSBcIiArIHRoaXMucGFyYW1ldGVyLnZhbHVlLFxyXG5cdFx0JGVsZW1lbnQ6ICQoXCI8bGFiZWwgc3R5bGU9J21hcmdpbjogMDsnPlwiKVxyXG5cdH0pO1xyXG5cdHRoaXMuZWRpdEJ1dHRvbiA9IG5ldyBPTy51aS5CdXR0b25XaWRnZXQoe1xyXG5cdFx0aWNvbjogXCJlZGl0XCIsXHJcblx0XHRmcmFtZWQ6IGZhbHNlLFxyXG5cdFx0JGVsZW1lbnQ6ICQoXCI8c3BhbiBzdHlsZT0nbWFyZ2luLWJvdHRvbTogMDsnPlwiKVxyXG5cdH0pO1xyXG5cdHRoaXMuZWRpdEJ1dHRvbi4kZWxlbWVudC5maW5kKFwiYVwiKS5jc3Moe1xyXG5cdFx0XCJib3JkZXItcmFkaXVzXCI6IFwiMCAxMHB4IDEwcHggMFwiLFxyXG5cdFx0XCJtYXJnaW4tbGVmdFwiOiBcIjVweFwiXHJcblx0fSk7XHJcblx0dGhpcy5lZGl0QnV0dG9uLiRlbGVtZW50LmZpbmQoXCJhIHNwYW5cIikuZmlyc3QoKS5jc3Moe1xyXG5cdFx0XCJtaW4td2lkdGhcIjogXCJ1bnNldFwiLFxyXG5cdFx0XCJ3aWR0aFwiOiBcIjE2cHhcIlxyXG5cdH0pO1xyXG5cclxuXHR0aGlzLnJlYWRMYXlvdXQgPSBuZXcgT08udWkuSG9yaXpvbnRhbExheW91dCh7XHJcblx0XHRpdGVtczogW1xyXG5cdFx0XHR0aGlzLmZ1bGxMYWJlbCxcclxuXHRcdFx0dGhpcy5lZGl0QnV0dG9uXHJcblx0XHRdLFxyXG5cdFx0JGVsZW1lbnQ6ICQoXCI8c3BhbiBzdHlsZT0nbWFyZ2luOjA7d2lkdGg6dW5zZXQ7Jz5cIilcclxuXHR9KTtcclxuXHJcblx0dGhpcy4kZWxlbWVudCA9ICQoXCI8ZGl2PlwiKVxyXG5cdFx0LmNzcyh7XHJcblx0XHRcdFwid2lkdGhcIjogXCJ1bnNldFwiLFxyXG5cdFx0XHRcImRpc3BsYXlcIjogXCJpbmxpbmUtYmxvY2tcIixcclxuXHRcdFx0XCJib3JkZXJcIjogXCIxcHggc29saWQgI2RkZFwiLFxyXG5cdFx0XHRcImJvcmRlci1yYWRpdXNcIjogXCIxMHB4XCIsXHJcblx0XHRcdFwicGFkZGluZy1sZWZ0XCI6IFwiMTBweFwiLFxyXG5cdFx0XHRcIm1hcmdpblwiOiBcIjAgOHB4IDhweCAwXCJcclxuXHRcdH0pXHJcblx0XHQuYXBwZW5kKHRoaXMucmVhZExheW91dC4kZWxlbWVudCwgdGhpcy5lZGl0TGF5b3V0LiRlbGVtZW50KTtcclxuICAgIFxyXG5cdHRoaXMuZWRpdEJ1dHRvbi5jb25uZWN0KCB0aGlzLCB7IFwiY2xpY2tcIjogXCJvbkVkaXRDbGlja1wiIH0gKTtcclxuXHR0aGlzLmNvbmZpcm1CdXR0b24uY29ubmVjdCggdGhpcywgeyBcImNsaWNrXCI6IFwib25Db25maXJtQ2xpY2tcIiB9ICk7XHJcblx0dGhpcy5kZWxldGVCdXR0b24uY29ubmVjdCggdGhpcywgeyBcImNsaWNrXCI6IFwib25EZWxldGVDbGlja1wiIH0gKTtcclxufVxyXG5PTy5pbmhlcml0Q2xhc3MoIFBhcmFtZXRlcldpZGdldCwgT08udWkuV2lkZ2V0ICk7XHJcblxyXG5QYXJhbWV0ZXJXaWRnZXQucHJvdG90eXBlLm9uRWRpdENsaWNrID0gZnVuY3Rpb24oKSB7XHJcblx0dGhpcy5yZWFkTGF5b3V0LnRvZ2dsZShmYWxzZSk7XHJcblx0dGhpcy5lZGl0TGF5b3V0LnRvZ2dsZSh0cnVlKTtcclxuXHR0aGlzLmlucHV0LmZvY3VzKCk7XHJcbn07XHJcblxyXG5QYXJhbWV0ZXJXaWRnZXQucHJvdG90eXBlLm9uQ29uZmlybUNsaWNrID0gZnVuY3Rpb24oKSB7XHJcblx0dGhpcy5wYXJhbWV0ZXIudmFsdWUgPSB0aGlzLmlucHV0LmdldFZhbHVlKCk7XHJcblx0dGhpcy5mdWxsTGFiZWwuc2V0TGFiZWwodGhpcy5wYXJhbWV0ZXIubmFtZSArIFwiID0gXCIgKyB0aGlzLnBhcmFtZXRlci52YWx1ZSk7XHJcblx0dGhpcy5yZWFkTGF5b3V0LnRvZ2dsZSh0cnVlKTtcclxuXHR0aGlzLmVkaXRMYXlvdXQudG9nZ2xlKGZhbHNlKTtcclxufTtcclxuXHJcblBhcmFtZXRlcldpZGdldC5wcm90b3R5cGUub25EZWxldGVDbGljayA9IGZ1bmN0aW9uKCkge1xyXG5cdHRoaXMuZW1pdChcImRlbGV0ZVwiKTtcclxufTtcclxuXHJcblBhcmFtZXRlcldpZGdldC5wcm90b3R5cGUuZm9jdXNJbnB1dCA9IGZ1bmN0aW9uKCkge1xyXG5cdHJldHVybiB0aGlzLmlucHV0LmZvY3VzKCk7XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBQYXJhbWV0ZXJXaWRnZXQ7IiwidmFyIFN1Z2dlc3Rpb25Mb29rdXBUZXh0SW5wdXRXaWRnZXQgPSBmdW5jdGlvbiBTdWdnZXN0aW9uTG9va3VwVGV4dElucHV0V2lkZ2V0KCBjb25maWcgKSB7XHJcblx0T08udWkuVGV4dElucHV0V2lkZ2V0LmNhbGwoIHRoaXMsIGNvbmZpZyApO1xyXG5cdE9PLnVpLm1peGluLkxvb2t1cEVsZW1lbnQuY2FsbCggdGhpcywgY29uZmlnICk7XHJcblx0dGhpcy5zdWdnZXN0aW9ucyA9IGNvbmZpZy5zdWdnZXN0aW9ucyB8fCBbXTtcclxufTtcclxuT08uaW5oZXJpdENsYXNzKCBTdWdnZXN0aW9uTG9va3VwVGV4dElucHV0V2lkZ2V0LCBPTy51aS5UZXh0SW5wdXRXaWRnZXQgKTtcclxuT08ubWl4aW5DbGFzcyggU3VnZ2VzdGlvbkxvb2t1cFRleHRJbnB1dFdpZGdldCwgT08udWkubWl4aW4uTG9va3VwRWxlbWVudCApO1xyXG5cclxuLy8gU2V0IHN1Z2dlc3Rpb24uIHBhcmFtOiBPYmplY3RbXSB3aXRoIG9iamVjdHMgb2YgdGhlIGZvcm0geyBkYXRhOiAuLi4gLCBsYWJlbDogLi4uIH1cclxuU3VnZ2VzdGlvbkxvb2t1cFRleHRJbnB1dFdpZGdldC5wcm90b3R5cGUuc2V0U3VnZ2VzdGlvbnMgPSBmdW5jdGlvbihzdWdnZXN0aW9ucykge1xyXG5cdHRoaXMuc3VnZ2VzdGlvbnMgPSBzdWdnZXN0aW9ucztcclxufTtcclxuXHJcbi8vIFJldHVybnMgZGF0YSwgYXMgYSByZXNvbHV0aW9uIHRvIGEgcHJvbWlzZSwgdG8gYmUgcGFzc2VkIHRvICNnZXRMb29rdXBNZW51T3B0aW9uc0Zyb21EYXRhXHJcblN1Z2dlc3Rpb25Mb29rdXBUZXh0SW5wdXRXaWRnZXQucHJvdG90eXBlLmdldExvb2t1cFJlcXVlc3QgPSBmdW5jdGlvbiAoKSB7XHJcblx0dmFyIGRlZmVycmVkID0gJC5EZWZlcnJlZCgpLnJlc29sdmUobmV3IFJlZ0V4cChcIlxcXFxiXCIgKyBtdy51dGlsLmVzY2FwZVJlZ0V4cCh0aGlzLmdldFZhbHVlKCkpLCBcImlcIikpO1xyXG5cdHJldHVybiBkZWZlcnJlZC5wcm9taXNlKCB7IGFib3J0OiBmdW5jdGlvbiAoKSB7fSB9ICk7XHJcbn07XHJcblxyXG4vLyA/Pz9cclxuU3VnZ2VzdGlvbkxvb2t1cFRleHRJbnB1dFdpZGdldC5wcm90b3R5cGUuZ2V0TG9va3VwQ2FjaGVEYXRhRnJvbVJlc3BvbnNlID0gZnVuY3Rpb24gKCByZXNwb25zZSApIHtcclxuXHRyZXR1cm4gcmVzcG9uc2UgfHwgW107XHJcbn07XHJcblxyXG4vLyBJcyBwYXNzZWQgZGF0YSBmcm9tICNnZXRMb29rdXBSZXF1ZXN0LCByZXR1cm5zIGFuIGFycmF5IG9mIG1lbnUgaXRlbSB3aWRnZXRzIFxyXG5TdWdnZXN0aW9uTG9va3VwVGV4dElucHV0V2lkZ2V0LnByb3RvdHlwZS5nZXRMb29rdXBNZW51T3B0aW9uc0Zyb21EYXRhID0gZnVuY3Rpb24gKCBwYXR0ZXJuICkge1xyXG5cdHZhciBsYWJlbE1hdGNoZXNJbnB1dFZhbCA9IGZ1bmN0aW9uKHN1Z2dlc3Rpb25JdGVtKSB7XHJcblx0XHRyZXR1cm4gcGF0dGVybi50ZXN0KHN1Z2dlc3Rpb25JdGVtLmxhYmVsKSB8fCAoICFzdWdnZXN0aW9uSXRlbS5sYWJlbCAmJiBwYXR0ZXJuLnRlc3Qoc3VnZ2VzdGlvbkl0ZW0uZGF0YSkgKTtcclxuXHR9O1xyXG5cdHZhciBtYWtlTWVudU9wdGlvbldpZGdldCA9IGZ1bmN0aW9uKG9wdGlvbkl0ZW0pIHtcclxuXHRcdHJldHVybiBuZXcgT08udWkuTWVudU9wdGlvbldpZGdldCgge1xyXG5cdFx0XHRkYXRhOiBvcHRpb25JdGVtLmRhdGEsXHJcblx0XHRcdGxhYmVsOiBvcHRpb25JdGVtLmxhYmVsIHx8IG9wdGlvbkl0ZW0uZGF0YVxyXG5cdFx0fSApO1xyXG5cdH07XHJcblx0cmV0dXJuIHRoaXMuc3VnZ2VzdGlvbnMuZmlsdGVyKGxhYmVsTWF0Y2hlc0lucHV0VmFsKS5tYXAobWFrZU1lbnVPcHRpb25XaWRnZXQpO1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgU3VnZ2VzdGlvbkxvb2t1cFRleHRJbnB1dFdpZGdldDsiLCJpbXBvcnQge21ha2VFcnJvck1zZ30gZnJvbSBcIi4uL3V0aWxcIjtcclxuXHJcbi8qIHZhciBpbmNyZW1lbnRQcm9ncmVzc0J5SW50ZXJ2YWwgPSBmdW5jdGlvbigpIHtcclxuXHR2YXIgaW5jcmVtZW50SW50ZXJ2YWxEZWxheSA9IDEwMDtcclxuXHR2YXIgaW5jcmVtZW50SW50ZXJ2YWxBbW91bnQgPSAwLjE7XHJcblx0dmFyIGluY3JlbWVudEludGVydmFsTWF4dmFsID0gOTg7XHJcblx0cmV0dXJuIHdpbmRvdy5zZXRJbnRlcnZhbChcclxuXHRcdGluY3JlbWVudFByb2dyZXNzLFxyXG5cdFx0aW5jcmVtZW50SW50ZXJ2YWxEZWxheSxcclxuXHRcdGluY3JlbWVudEludGVydmFsQW1vdW50LFxyXG5cdFx0aW5jcmVtZW50SW50ZXJ2YWxNYXh2YWxcclxuXHQpO1xyXG59OyAqL1xyXG5cclxudmFyIExvYWREaWFsb2cgPSBmdW5jdGlvbiBMb2FkRGlhbG9nKCBjb25maWcgKSB7XHJcblx0TG9hZERpYWxvZy5zdXBlci5jYWxsKCB0aGlzLCBjb25maWcgKTtcclxufTtcclxuT08uaW5oZXJpdENsYXNzKCBMb2FkRGlhbG9nLCBPTy51aS5EaWFsb2cgKTsgXHJcblxyXG5Mb2FkRGlhbG9nLnN0YXRpYy5uYW1lID0gXCJsb2FkRGlhbG9nXCI7XHJcbkxvYWREaWFsb2cuc3RhdGljLnRpdGxlID0gXCJMb2FkaW5nIFJhdGVyLi4uXCI7XHJcblxyXG4vLyBDdXN0b21pemUgdGhlIGluaXRpYWxpemUoKSBmdW5jdGlvbjogVGhpcyBpcyB3aGVyZSB0byBhZGQgY29udGVudCB0byB0aGUgZGlhbG9nIGJvZHkgYW5kIHNldCB1cCBldmVudCBoYW5kbGVycy5cclxuTG9hZERpYWxvZy5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uICgpIHtcclxuXHQvLyBDYWxsIHRoZSBwYXJlbnQgbWV0aG9kLlxyXG5cdExvYWREaWFsb2cuc3VwZXIucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCggdGhpcyApO1xyXG5cdC8vIENyZWF0ZSBhIGxheW91dFxyXG5cdHRoaXMuY29udGVudCA9IG5ldyBPTy51aS5QYW5lbExheW91dCggeyBcclxuXHRcdHBhZGRlZDogdHJ1ZSxcclxuXHRcdGV4cGFuZGVkOiBmYWxzZSBcclxuXHR9ICk7XHJcblx0Ly8gQ3JlYXRlIGNvbnRlbnRcclxuXHR0aGlzLnByb2dyZXNzQmFyID0gbmV3IE9PLnVpLlByb2dyZXNzQmFyV2lkZ2V0KCB7XHJcblx0XHRwcm9ncmVzczogMVxyXG5cdH0gKTtcclxuXHR0aGlzLnNldHVwdGFza3MgPSBbXHJcblx0XHRuZXcgT08udWkuTGFiZWxXaWRnZXQoIHtcclxuXHRcdFx0bGFiZWw6IFwiTG9hZGluZyBsaXN0IG9mIHByb2plY3QgYmFubmVycy4uLlwiLFxyXG5cdFx0XHQkZWxlbWVudDogJChcIjxwIHN0eWxlPVxcXCJkaXNwbGF5OmJsb2NrXFxcIj5cIilcclxuXHRcdH0pLFxyXG5cdFx0bmV3IE9PLnVpLkxhYmVsV2lkZ2V0KCB7XHJcblx0XHRcdGxhYmVsOiBcIkxvYWRpbmcgdGFsa3BhZ2Ugd2lraXRleHQuLi5cIixcclxuXHRcdFx0JGVsZW1lbnQ6ICQoXCI8cCBzdHlsZT1cXFwiZGlzcGxheTpibG9ja1xcXCI+XCIpXHJcblx0XHR9KSxcclxuXHRcdG5ldyBPTy51aS5MYWJlbFdpZGdldCgge1xyXG5cdFx0XHRsYWJlbDogXCJQYXJzaW5nIHRhbGtwYWdlIHRlbXBsYXRlcy4uLlwiLFxyXG5cdFx0XHQkZWxlbWVudDogJChcIjxwIHN0eWxlPVxcXCJkaXNwbGF5OmJsb2NrXFxcIj5cIilcclxuXHRcdH0pLFxyXG5cdFx0bmV3IE9PLnVpLkxhYmVsV2lkZ2V0KCB7XHJcblx0XHRcdGxhYmVsOiBcIkdldHRpbmcgdGVtcGxhdGVzJyBwYXJhbWV0ZXIgZGF0YS4uLlwiLFxyXG5cdFx0XHQkZWxlbWVudDogJChcIjxwIHN0eWxlPVxcXCJkaXNwbGF5OmJsb2NrXFxcIj5cIilcclxuXHRcdH0pLFxyXG5cdFx0bmV3IE9PLnVpLkxhYmVsV2lkZ2V0KCB7XHJcblx0XHRcdGxhYmVsOiBcIkNoZWNraW5nIGlmIHBhZ2UgcmVkaXJlY3RzLi4uXCIsXHJcblx0XHRcdCRlbGVtZW50OiAkKFwiPHAgc3R5bGU9XFxcImRpc3BsYXk6YmxvY2tcXFwiPlwiKVxyXG5cdFx0fSksXHJcblx0XHRuZXcgT08udWkuTGFiZWxXaWRnZXQoIHtcclxuXHRcdFx0bGFiZWw6IFwiUmV0cmlldmluZyBxdWFsaXR5IHByZWRpY3Rpb24uLi5cIixcclxuXHRcdFx0JGVsZW1lbnQ6ICQoXCI8cCBzdHlsZT1cXFwiZGlzcGxheTpibG9ja1xcXCI+XCIpXHJcblx0XHR9KS50b2dnbGUoKSxcclxuXHRdO1xyXG5cdHRoaXMuY2xvc2VCdXR0b24gPSBuZXcgT08udWkuQnV0dG9uV2lkZ2V0KCB7XHJcblx0XHRsYWJlbDogXCJDbG9zZVwiXHJcblx0fSkudG9nZ2xlKCk7XHJcblx0dGhpcy5zZXR1cFByb21pc2VzID0gW107XHJcblxyXG5cdC8vIEFwcGVuZCBjb250ZW50IHRvIGxheW91dFxyXG5cdHRoaXMuY29udGVudC4kZWxlbWVudC5hcHBlbmQoXHJcblx0XHR0aGlzLnByb2dyZXNzQmFyLiRlbGVtZW50LFxyXG5cdFx0KG5ldyBPTy51aS5MYWJlbFdpZGdldCgge1xyXG5cdFx0XHRsYWJlbDogXCJJbml0aWFsaXNpbmc6XCIsXHJcblx0XHRcdCRlbGVtZW50OiAkKFwiPHN0cm9uZyBzdHlsZT1cXFwiZGlzcGxheTpibG9ja1xcXCI+XCIpXHJcblx0XHR9KSkuJGVsZW1lbnQsXHJcblx0XHQuLi50aGlzLnNldHVwdGFza3MubWFwKHdpZGdldCA9PiB3aWRnZXQuJGVsZW1lbnQpLFxyXG5cdFx0dGhpcy5jbG9zZUJ1dHRvbi4kZWxlbWVudFxyXG5cdCk7XHJcblxyXG5cdC8vIEFwcGVuZCBsYXlvdXQgdG8gZGlhbG9nXHJcblx0dGhpcy4kYm9keS5hcHBlbmQoIHRoaXMuY29udGVudC4kZWxlbWVudCApO1xyXG5cclxuXHQvLyBDb25uZWN0IGV2ZW50cyB0byBoYW5kbGVyc1xyXG5cdHRoaXMuY2xvc2VCdXR0b24uY29ubmVjdCggdGhpcywgeyBcImNsaWNrXCI6IFwib25DbG9zZUJ1dHRvbkNsaWNrXCIgfSApO1xyXG59O1xyXG5cclxuTG9hZERpYWxvZy5wcm90b3R5cGUub25DbG9zZUJ1dHRvbkNsaWNrID0gZnVuY3Rpb24oKSB7XHJcblx0Ly8gQ2xvc2UgdGhpcyBkaWFsb2csIHdpdGhvdXQgcGFzc2luZyBhbnkgZGF0YVxyXG5cdHRoaXMuY2xvc2UoKTtcclxufTtcclxuXHJcbi8vIE92ZXJyaWRlIHRoZSBnZXRCb2R5SGVpZ2h0KCkgbWV0aG9kIHRvIHNwZWNpZnkgYSBjdXN0b20gaGVpZ2h0IChvciBkb24ndCB0byB1c2UgdGhlIGF1dG9tYXRpY2FsbHkgZ2VuZXJhdGVkIGhlaWdodCkuXHJcbkxvYWREaWFsb2cucHJvdG90eXBlLmdldEJvZHlIZWlnaHQgPSBmdW5jdGlvbiAoKSB7XHJcblx0cmV0dXJuIHRoaXMuY29udGVudC4kZWxlbWVudC5vdXRlckhlaWdodCggdHJ1ZSApO1xyXG59O1xyXG5cclxuTG9hZERpYWxvZy5wcm90b3R5cGUuaW5jcmVtZW50UHJvZ3Jlc3MgPSBmdW5jdGlvbihhbW91bnQsIG1heGltdW0pIHtcclxuXHR2YXIgcHJpb3JQcm9ncmVzcyA9IHRoaXMucHJvZ3Jlc3NCYXIuZ2V0UHJvZ3Jlc3MoKTtcclxuXHR2YXIgaW5jcmVtZW50ZWRQcm9ncmVzcyA9IE1hdGgubWluKG1heGltdW0gfHwgMTAwLCBwcmlvclByb2dyZXNzICsgYW1vdW50KTtcclxuXHR0aGlzLnByb2dyZXNzQmFyLnNldFByb2dyZXNzKGluY3JlbWVudGVkUHJvZ3Jlc3MpO1xyXG59O1xyXG5cclxuTG9hZERpYWxvZy5wcm90b3R5cGUuYWRkVGFza1Byb21pc2VIYW5kbGVycyA9IGZ1bmN0aW9uKHRhc2tQcm9taXNlcykge1xyXG5cdHZhciBvblRhc2tEb25lID0gaW5kZXggPT4ge1xyXG5cdFx0Ly8gQWRkIFwiRG9uZSFcIiB0byBsYWJlbFxyXG5cdFx0dmFyIHdpZGdldCA9IHRoaXMuc2V0dXB0YXNrc1tpbmRleF07XHJcblx0XHR3aWRnZXQuc2V0TGFiZWwod2lkZ2V0LmdldExhYmVsKCkgKyBcIiBEb25lIVwiKTtcclxuXHRcdC8vIEluY3JlbWVudCBzdGF0dXMgYmFyLiBTaG93IGEgc21vb3RoIHRyYW5zaXRpb24gYnlcclxuXHRcdC8vIHVzaW5nIHNtYWxsIHN0ZXBzIG92ZXIgYSBzaG9ydCBkdXJhdGlvbi5cclxuXHRcdHZhciB0b3RhbEluY3JlbWVudCA9IDIwOyAvLyBwZXJjZW50XHJcblx0XHR2YXIgdG90YWxUaW1lID0gNDAwOyAvLyBtaWxsaXNlY29uZHNcclxuXHRcdHZhciB0b3RhbFN0ZXBzID0gMTA7XHJcblx0XHR2YXIgaW5jcmVtZW50UGVyU3RlcCA9IHRvdGFsSW5jcmVtZW50IC8gdG90YWxTdGVwcztcclxuXHJcblx0XHRmb3IgKCB2YXIgc3RlcD0wOyBzdGVwIDwgdG90YWxTdGVwczsgc3RlcCsrKSB7XHJcblx0XHRcdHdpbmRvdy5zZXRUaW1lb3V0KFxyXG5cdFx0XHRcdHRoaXMuaW5jcmVtZW50UHJvZ3Jlc3MuYmluZCh0aGlzKSxcclxuXHRcdFx0XHR0b3RhbFRpbWUgKiBzdGVwIC8gdG90YWxTdGVwcyxcclxuXHRcdFx0XHRpbmNyZW1lbnRQZXJTdGVwXHJcblx0XHRcdCk7XHJcblx0XHR9XHJcblx0fTtcclxuXHR2YXIgb25UYXNrRXJyb3IgPSAoaW5kZXgsIGNvZGUsIGluZm8pID0+IHtcclxuXHRcdHZhciB3aWRnZXQgPSB0aGlzLnNldHVwdGFza3NbaW5kZXhdO1xyXG5cdFx0d2lkZ2V0LnNldExhYmVsKFxyXG5cdFx0XHR3aWRnZXQuZ2V0TGFiZWwoKSArIFwiIEZhaWxlZC4gXCIgKyBtYWtlRXJyb3JNc2coY29kZSwgaW5mbylcclxuXHRcdCk7XHJcblx0XHR0aGlzLmNsb3NlQnV0dG9uLnRvZ2dsZSh0cnVlKTtcclxuXHRcdHRoaXMudXBkYXRlU2l6ZSgpO1xyXG5cdH07XHJcblx0dGFza1Byb21pc2VzLmZvckVhY2goZnVuY3Rpb24ocHJvbWlzZSwgaW5kZXgpIHtcclxuXHRcdHByb21pc2UudGhlbihcclxuXHRcdFx0KCkgPT4gb25UYXNrRG9uZShpbmRleCksXHJcblx0XHRcdChjb2RlLCBpbmZvKSA9PiBvblRhc2tFcnJvcihpbmRleCwgY29kZSwgaW5mbylcclxuXHRcdCk7XHJcblx0fSk7XHJcbn07XHJcblxyXG4vLyBVc2UgZ2V0U2V0dXBQcm9jZXNzKCkgdG8gc2V0IHVwIHRoZSB3aW5kb3cgd2l0aCBkYXRhIHBhc3NlZCB0byBpdCBhdCB0aGUgdGltZSBcclxuLy8gb2Ygb3BlbmluZ1xyXG5Mb2FkRGlhbG9nLnByb3RvdHlwZS5nZXRTZXR1cFByb2Nlc3MgPSBmdW5jdGlvbiAoIGRhdGEgKSB7XHJcblx0ZGF0YSA9IGRhdGEgfHwge307XHJcblx0cmV0dXJuIExvYWREaWFsb2cuc3VwZXIucHJvdG90eXBlLmdldFNldHVwUHJvY2Vzcy5jYWxsKCB0aGlzLCBkYXRhIClcclxuXHRcdC5uZXh0KCAoKSA9PiB7XHJcblx0XHRcdHZhciBzaG93T3Jlc1Rhc2sgPSAhIWRhdGEub3JlcztcclxuXHRcdFx0dGhpcy5zZXR1cHRhc2tzWzVdLnRvZ2dsZShzaG93T3Jlc1Rhc2spO1xyXG5cdFx0XHR2YXIgdGFza1Byb21pc2VzID0gZGF0YS5vcmVzID8gZGF0YS5wcm9taXNlcyA6IGRhdGEucHJvbWlzZXMuc2xpY2UoMCwgLTEpO1xyXG5cdFx0XHRkYXRhLmlzT3BlbmVkLnRoZW4oKCkgPT4gdGhpcy5hZGRUYXNrUHJvbWlzZUhhbmRsZXJzKHRhc2tQcm9taXNlcykpO1xyXG5cdFx0fSwgdGhpcyApO1xyXG59O1xyXG5cclxuLy8gUHJldmVudCB3aW5kb3cgZnJvbSBjbG9zaW5nIHRvbyBxdWlja2x5LCB1c2luZyBnZXRIb2xkUHJvY2VzcygpXHJcbkxvYWREaWFsb2cucHJvdG90eXBlLmdldEhvbGRQcm9jZXNzID0gZnVuY3Rpb24gKCBkYXRhICkge1xyXG5cdGRhdGEgPSBkYXRhIHx8IHt9O1xyXG5cdGlmIChkYXRhLnN1Y2Nlc3MpIHtcclxuXHRcdC8vIFdhaXQgYSBiaXQgYmVmb3JlIHByb2Nlc3NpbmcgdGhlIGNsb3NlLCB3aGljaCBoYXBwZW5zIGF1dG9tYXRpY2FsbHlcclxuXHRcdHJldHVybiBMb2FkRGlhbG9nLnN1cGVyLnByb3RvdHlwZS5nZXRIb2xkUHJvY2Vzcy5jYWxsKCB0aGlzLCBkYXRhIClcclxuXHRcdFx0Lm5leHQoODAwKTtcclxuXHR9XHJcblx0Ly8gTm8gbmVlZCB0byB3YWl0IGlmIGNsb3NlZCBtYW51YWxseVxyXG5cdHJldHVybiBMb2FkRGlhbG9nLnN1cGVyLnByb3RvdHlwZS5nZXRIb2xkUHJvY2Vzcy5jYWxsKCB0aGlzLCBkYXRhICk7XHJcbn07XHJcblxyXG4vLyBVc2UgdGhlIGdldFRlYXJkb3duUHJvY2VzcygpIG1ldGhvZCB0byBwZXJmb3JtIGFjdGlvbnMgd2hlbmV2ZXIgdGhlIGRpYWxvZyBpcyBjbG9zZWQuIFxyXG5Mb2FkRGlhbG9nLnByb3RvdHlwZS5nZXRUZWFyZG93blByb2Nlc3MgPSBmdW5jdGlvbiAoIGRhdGEgKSB7XHJcblx0cmV0dXJuIExvYWREaWFsb2cuc3VwZXIucHJvdG90eXBlLmdldFRlYXJkb3duUHJvY2Vzcy5jYWxsKCB0aGlzLCBkYXRhIClcclxuXHRcdC5maXJzdCggKCkgPT4ge1xyXG5cdFx0Ly8gUGVyZm9ybSBjbGVhbnVwOiByZXNldCBsYWJlbHNcclxuXHRcdFx0dGhpcy5zZXR1cHRhc2tzLmZvckVhY2goIHNldHVwdGFzayA9PiB7XHJcblx0XHRcdFx0dmFyIGN1cnJlbnRMYWJlbCA9IHNldHVwdGFzay5nZXRMYWJlbCgpO1xyXG5cdFx0XHRcdHNldHVwdGFzay5zZXRMYWJlbChcclxuXHRcdFx0XHRcdGN1cnJlbnRMYWJlbC5zbGljZSgwLCBjdXJyZW50TGFiZWwuaW5kZXhPZihcIi4uLlwiKSszKVxyXG5cdFx0XHRcdCk7XHJcblx0XHRcdH0gKTtcclxuXHRcdH0sIHRoaXMgKTtcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IExvYWREaWFsb2c7IiwiaW1wb3J0IEJhbm5lcldpZGdldCBmcm9tIFwiLi9Db21wb25lbnRzL0Jhbm5lcldpZGdldFwiO1xyXG5pbXBvcnQgQmFubmVyTGlzdFdpZGdldCBmcm9tIFwiLi9Db21wb25lbnRzL0Jhbm5lckxpc3RXaWRnZXRcIjtcclxuaW1wb3J0IFN1Z2dlc3Rpb25Mb29rdXBUZXh0SW5wdXRXaWRnZXQgZnJvbSBcIi4vQ29tcG9uZW50cy9TdWdnZXN0aW9uTG9va3VwVGV4dElucHV0V2lkZ2V0XCI7XHJcbmltcG9ydCAqIGFzIGNhY2hlIGZyb20gXCIuLi9jYWNoZVwiO1xyXG5pbXBvcnQgeyBUZW1wbGF0ZSwgZ2V0V2l0aFJlZGlyZWN0VG8gfSBmcm9tIFwiLi4vVGVtcGxhdGVcIjtcclxuaW1wb3J0IHtnZXRCYW5uZXJPcHRpb25zfSBmcm9tIFwiLi4vZ2V0QmFubmVyc1wiO1xyXG5cclxuZnVuY3Rpb24gTWFpbldpbmRvdyggY29uZmlnICkge1xyXG5cdE1haW5XaW5kb3cuc3VwZXIuY2FsbCggdGhpcywgY29uZmlnICk7XHJcbn1cclxuT08uaW5oZXJpdENsYXNzKCBNYWluV2luZG93LCBPTy51aS5Qcm9jZXNzRGlhbG9nICk7XHJcblxyXG5NYWluV2luZG93LnN0YXRpYy5uYW1lID0gXCJtYWluXCI7XHJcbk1haW5XaW5kb3cuc3RhdGljLnRpdGxlID0gXCJSYXRlclwiO1xyXG5NYWluV2luZG93LnN0YXRpYy5zaXplID0gXCJsYXJnZVwiO1xyXG5NYWluV2luZG93LnN0YXRpYy5hY3Rpb25zID0gW1xyXG5cdC8vIFByaW1hcnkgKHRvcCByaWdodCk6XHJcblx0e1xyXG5cdFx0bGFiZWw6IFwiWFwiLCAvLyBub3QgdXNpbmcgYW4gaWNvbiBzaW5jZSBjb2xvciBiZWNvbWVzIGludmVydGVkLCBpLmUuIHdoaXRlIG9uIGxpZ2h0LWdyZXlcclxuXHRcdHRpdGxlOiBcIkNsb3NlIChhbmQgZGlzY2FyZCBhbnkgY2hhbmdlcylcIixcclxuXHRcdGZsYWdzOiBcInByaW1hcnlcIixcclxuXHR9LFxyXG5cdC8vIFNhZmUgKHRvcCBsZWZ0KVxyXG5cdHtcclxuXHRcdGFjdGlvbjogXCJoZWxwXCIsXHJcblx0XHRmbGFnczogXCJzYWZlXCIsXHJcblx0XHRsYWJlbDogXCI/XCIsIC8vIG5vdCB1c2luZyBpY29uLCB0byBtaXJyb3IgQ2xvc2UgYWN0aW9uXHJcblx0XHR0aXRsZTogXCJoZWxwXCJcclxuXHR9LFxyXG5cdC8vIE90aGVycyAoYm90dG9tKVxyXG5cdHtcclxuXHRcdGFjdGlvbjogXCJzYXZlXCIsXHJcblx0XHRsYWJlbDogbmV3IE9PLnVpLkh0bWxTbmlwcGV0KFwiPHNwYW4gc3R5bGU9J3BhZGRpbmc6MCAxZW07Jz5TYXZlPC9zcGFuPlwiKSxcclxuXHRcdGZsYWdzOiBbXCJwcmltYXJ5XCIsIFwicHJvZ3Jlc3NpdmVcIl1cclxuXHR9LFxyXG5cdHtcclxuXHRcdGFjdGlvbjogXCJwcmV2aWV3XCIsXHJcblx0XHRsYWJlbDogXCJTaG93IHByZXZpZXdcIlxyXG5cdH0sXHJcblx0e1xyXG5cdFx0YWN0aW9uOiBcImNoYW5nZXNcIixcclxuXHRcdGxhYmVsOiBcIlNob3cgY2hhbmdlc1wiXHJcblx0fSxcclxuXHR7XHJcblx0XHRhY3Rpb246IFwiY2FuY2VsXCIsXHJcblx0XHRsYWJlbDogXCJDYW5jZWxcIlxyXG5cdH1cclxuXTtcclxuXHJcbi8vIEN1c3RvbWl6ZSB0aGUgaW5pdGlhbGl6ZSgpIGZ1bmN0aW9uOiBUaGlzIGlzIHdoZXJlIHRvIGFkZCBjb250ZW50IHRvIHRoZSBkaWFsb2cgYm9keSBhbmQgc2V0IHVwIGV2ZW50IGhhbmRsZXJzLlxyXG5NYWluV2luZG93LnByb3RvdHlwZS5pbml0aWFsaXplID0gZnVuY3Rpb24gKCkge1xyXG5cdC8vIENhbGwgdGhlIHBhcmVudCBtZXRob2QuXHJcblx0TWFpbldpbmRvdy5zdXBlci5wcm90b3R5cGUuaW5pdGlhbGl6ZS5jYWxsKCB0aGlzICk7XHJcblx0Ly8gQ3JlYXRlIGxheW91dHNcclxuXHR0aGlzLnRvcEJhciA9IG5ldyBPTy51aS5QYW5lbExheW91dCgge1xyXG5cdFx0ZXhwYW5kZWQ6IGZhbHNlLFxyXG5cdFx0ZnJhbWVkOiBmYWxzZSxcclxuXHRcdHBhZGRlZDogZmFsc2VcclxuXHR9ICk7XHJcblxyXG5cdHRoaXMuY29udGVudExheW91dCA9IG5ldyBPTy51aS5QYW5lbExheW91dCgge1xyXG5cdFx0ZXhwYW5kZWQ6IHRydWUsXHJcblx0XHRwYWRkZWQ6IHRydWUsXHJcblx0XHRzY3JvbGxhYmxlOiB0cnVlXHJcblx0fSApO1xyXG5cclxuXHR0aGlzLm91dGVyTGF5b3V0ID0gbmV3IE9PLnVpLlN0YWNrTGF5b3V0KCB7XHJcblx0XHRpdGVtczogW1xyXG5cdFx0XHR0aGlzLnRvcEJhcixcclxuXHRcdFx0dGhpcy5jb250ZW50TGF5b3V0XHJcblx0XHRdLFxyXG5cdFx0Y29udGludW91czogdHJ1ZSxcclxuXHRcdGV4cGFuZGVkOiB0cnVlXHJcblx0fSApO1xyXG5cdC8vIENyZWF0ZSB0b3BCYXIgY29udGVudFxyXG5cdHRoaXMuc2VhcmNoQm94ID0gbmV3IFN1Z2dlc3Rpb25Mb29rdXBUZXh0SW5wdXRXaWRnZXQoIHtcclxuXHRcdHBsYWNlaG9sZGVyOiBcIkFkZCBhIFdpa2lQcm9qZWN0Li4uXCIsXHJcblx0XHRzdWdnZXN0aW9uczogY2FjaGUucmVhZChcImJhbm5lck9wdGlvbnNcIiksXHJcblx0XHQkZWxlbWVudDogJChcIjxkaXYgc3R5bGU9J2Rpc3BsYXk6aW5saW5lLWJsb2NrO3dpZHRoOjEwMCU7bWF4LXdpZHRoOjQyNXB4Oyc+XCIpLFxyXG5cdFx0JG92ZXJsYXk6IHRoaXMuJG92ZXJsYXksXHJcblx0fSApO1xyXG5cdGdldEJhbm5lck9wdGlvbnMoKS50aGVuKGJhbm5lck9wdGlvbnMgPT4gdGhpcy5zZWFyY2hCb3guc2V0U3VnZ2VzdGlvbnMoYmFubmVyT3B0aW9ucykpO1xyXG5cclxuXHR0aGlzLnNldEFsbERyb3BEb3duID0gbmV3IE9PLnVpLkRyb3Bkb3duV2lkZ2V0KCB7XHJcblx0XHRsYWJlbDogbmV3IE9PLnVpLkh0bWxTbmlwcGV0KFwiPHNwYW4gc3R5bGU9XFxcImNvbG9yOiM3NzdcXFwiPlNldCBhbGwuLi48L3NwYW4+XCIpLFxyXG5cdFx0bWVudTogeyAvLyBGSVhNRTogbmVlZHMgcmVhbCBkYXRhXHJcblx0XHRcdGl0ZW1zOiBbXHJcblx0XHRcdFx0bmV3IE9PLnVpLk1lbnVTZWN0aW9uT3B0aW9uV2lkZ2V0KCB7XHJcblx0XHRcdFx0XHRsYWJlbDogXCJDbGFzc2VzXCJcclxuXHRcdFx0XHR9ICksXHJcblx0XHRcdFx0bmV3IE9PLnVpLk1lbnVPcHRpb25XaWRnZXQoIHtcclxuXHRcdFx0XHRcdGRhdGE6IFwiQlwiLFxyXG5cdFx0XHRcdFx0bGFiZWw6IFwiQlwiXHJcblx0XHRcdFx0fSApLFxyXG5cdFx0XHRcdG5ldyBPTy51aS5NZW51T3B0aW9uV2lkZ2V0KCB7XHJcblx0XHRcdFx0XHRkYXRhOiBcIkNcIixcclxuXHRcdFx0XHRcdGxhYmVsOiBcIkNcIlxyXG5cdFx0XHRcdH0gKSxcclxuXHRcdFx0XHRuZXcgT08udWkuTWVudU9wdGlvbldpZGdldCgge1xyXG5cdFx0XHRcdFx0ZGF0YTogXCJzdGFydFwiLFxyXG5cdFx0XHRcdFx0bGFiZWw6IFwiU3RhcnRcIlxyXG5cdFx0XHRcdH0gKSxcclxuXHRcdFx0XHRuZXcgT08udWkuTWVudVNlY3Rpb25PcHRpb25XaWRnZXQoIHtcclxuXHRcdFx0XHRcdGxhYmVsOiBcIkltcG9ydGFuY2VzXCJcclxuXHRcdFx0XHR9ICksXHJcblx0XHRcdFx0bmV3IE9PLnVpLk1lbnVPcHRpb25XaWRnZXQoIHtcclxuXHRcdFx0XHRcdGRhdGE6IFwidG9wXCIsXHJcblx0XHRcdFx0XHRsYWJlbDogXCJUb3BcIlxyXG5cdFx0XHRcdH0gKSxcclxuXHRcdFx0XHRuZXcgT08udWkuTWVudU9wdGlvbldpZGdldCgge1xyXG5cdFx0XHRcdFx0ZGF0YTogXCJoaWdoXCIsXHJcblx0XHRcdFx0XHRsYWJlbDogXCJIaWdoXCJcclxuXHRcdFx0XHR9ICksXHJcblx0XHRcdFx0bmV3IE9PLnVpLk1lbnVPcHRpb25XaWRnZXQoIHtcclxuXHRcdFx0XHRcdGRhdGE6IFwibWlkXCIsXHJcblx0XHRcdFx0XHRsYWJlbDogXCJNaWRcIlxyXG5cdFx0XHRcdH0gKVxyXG5cdFx0XHRdXHJcblx0XHR9LFxyXG5cdFx0JGVsZW1lbnQ6ICQoXCI8c3BhbiBzdHlsZT1cXFwiZGlzcGxheTppbmxpbmUtYmxvY2s7d2lkdGg6YXV0b1xcXCI+XCIpLFxyXG5cdFx0JG92ZXJsYXk6IHRoaXMuJG92ZXJsYXksXHJcblx0fSApO1xyXG5cclxuXHR0aGlzLnJlbW92ZUFsbEJ1dHRvbiA9IG5ldyBPTy51aS5CdXR0b25XaWRnZXQoIHtcclxuXHRcdGljb246IFwidHJhc2hcIixcclxuXHRcdHRpdGxlOiBcIlJlbW92ZSBhbGxcIixcclxuXHRcdGZsYWdzOiBcImRlc3RydWN0aXZlXCJcclxuXHR9ICk7XHJcblx0dGhpcy5jbGVhckFsbEJ1dHRvbiA9IG5ldyBPTy51aS5CdXR0b25XaWRnZXQoIHtcclxuXHRcdGljb246IFwiY2FuY2VsXCIsXHJcblx0XHR0aXRsZTogXCJDbGVhciBhbGxcIixcclxuXHRcdGZsYWdzOiBcImRlc3RydWN0aXZlXCJcclxuXHR9ICk7XHJcblx0dGhpcy5ieXBhc3NBbGxCdXR0b24gPSBuZXcgT08udWkuQnV0dG9uV2lkZ2V0KCB7XHJcblx0XHRpY29uOiBcImFydGljbGVSZWRpcmVjdFwiLFxyXG5cdFx0dGl0bGU6IFwiQnlwYXNzIGFsbCByZWRpcmVjdHNcIlxyXG5cdH0gKTtcclxuXHR0aGlzLmRvQWxsQnV0dG9ucyA9IG5ldyBPTy51aS5CdXR0b25Hcm91cFdpZGdldCgge1xyXG5cdFx0aXRlbXM6IFtcclxuXHRcdFx0dGhpcy5yZW1vdmVBbGxCdXR0b24sXHJcblx0XHRcdHRoaXMuY2xlYXJBbGxCdXR0b24sXHJcblx0XHRcdHRoaXMuYnlwYXNzQWxsQnV0dG9uXHJcblx0XHRdLFxyXG5cdFx0JGVsZW1lbnQ6ICQoXCI8c3BhbiBzdHlsZT0nZmxvYXQ6cmlnaHQ7Jz5cIiksXHJcblx0fSApO1xyXG5cclxuXHR0aGlzLnRvcEJhci4kZWxlbWVudC5hcHBlbmQoXHJcblx0XHR0aGlzLnNlYXJjaEJveC4kZWxlbWVudCxcclxuXHRcdHRoaXMuc2V0QWxsRHJvcERvd24uJGVsZW1lbnQsXHJcblx0XHR0aGlzLmRvQWxsQnV0dG9ucy4kZWxlbWVudFxyXG5cdCkuY3NzKFwiYmFja2dyb3VuZFwiLFwiI2NjY1wiKTtcclxuXHJcblx0Ly8gQ3JlYXRlIGNvbnRlbnQgcGxhY2Vob2xkZXJcclxuXHR0aGlzLmJhbm5lckxpc3QgPSBuZXcgQmFubmVyTGlzdFdpZGdldCgpO1xyXG5cdHRoaXMuY29udGVudExheW91dC4kZWxlbWVudC5hcHBlbmQodGhpcy5iYW5uZXJMaXN0LiRlbGVtZW50KTtcclxuXHJcblx0dGhpcy4kYm9keS5hcHBlbmQoIHRoaXMub3V0ZXJMYXlvdXQuJGVsZW1lbnQgKTtcclxuXHJcblx0dGhpcy5zZWFyY2hCb3guY29ubmVjdCh0aGlzLCB7ZW50ZXI6IFwib25TZWFyY2hTZWxlY3RcIiB9KTtcclxufTtcclxuXHJcbi8vIE92ZXJyaWRlIHRoZSBnZXRCb2R5SGVpZ2h0KCkgbWV0aG9kIHRvIHNwZWNpZnkgYSBjdXN0b20gaGVpZ2h0XHJcbk1haW5XaW5kb3cucHJvdG90eXBlLmdldEJvZHlIZWlnaHQgPSBmdW5jdGlvbiAoKSB7XHJcblx0cmV0dXJuIHRoaXMudG9wQmFyLiRlbGVtZW50Lm91dGVySGVpZ2h0KCB0cnVlICkgKyB0aGlzLmNvbnRlbnRMYXlvdXQuJGVsZW1lbnQub3V0ZXJIZWlnaHQoIHRydWUgKTtcclxufTtcclxuXHJcbi8vIFVzZSBnZXRTZXR1cFByb2Nlc3MoKSB0byBzZXQgdXAgdGhlIHdpbmRvdyB3aXRoIGRhdGEgcGFzc2VkIHRvIGl0IGF0IHRoZSB0aW1lIFxyXG4vLyBvZiBvcGVuaW5nXHJcbk1haW5XaW5kb3cucHJvdG90eXBlLmdldFNldHVwUHJvY2VzcyA9IGZ1bmN0aW9uICggZGF0YSApIHtcclxuXHRkYXRhID0gZGF0YSB8fCB7fTtcclxuXHRyZXR1cm4gTWFpbldpbmRvdy5zdXBlci5wcm90b3R5cGUuZ2V0U2V0dXBQcm9jZXNzLmNhbGwoIHRoaXMsIGRhdGEgKVxyXG5cdFx0Lm5leHQoICgpID0+IHtcclxuXHRcdFx0Ly8gVE9ETzogU2V0IHVwIHdpbmRvdyBiYXNlZCBvbiBkYXRhXHJcblx0XHRcdHRoaXMuYmFubmVyTGlzdC5hZGRJdGVtcyhcclxuXHRcdFx0XHRkYXRhLmJhbm5lcnMubWFwKGJhbm5lclRlbXBsYXRlID0+IG5ldyBCYW5uZXJXaWRnZXQoYmFubmVyVGVtcGxhdGUpKVxyXG5cdFx0XHQpO1xyXG5cdFx0XHR0aGlzLnRhbGtXaWtpdGV4dCA9IGRhdGEudGFsa1dpa2l0ZXh0O1xyXG5cdFx0XHR0aGlzLnRhbGtwYWdlID0gZGF0YS50YWxrcGFnZTtcclxuXHRcdFx0dGhpcy51cGRhdGVTaXplKCk7XHJcblx0XHR9LCB0aGlzICk7XHJcbn07XHJcblxyXG4vLyBTZXQgdXAgdGhlIHdpbmRvdyBpdCBpcyByZWFkeTogYXR0YWNoZWQgdG8gdGhlIERPTSwgYW5kIG9wZW5pbmcgYW5pbWF0aW9uIGNvbXBsZXRlZFxyXG5NYWluV2luZG93LnByb3RvdHlwZS5nZXRSZWFkeVByb2Nlc3MgPSBmdW5jdGlvbiAoIGRhdGEgKSB7XHJcblx0ZGF0YSA9IGRhdGEgfHwge307XHJcblx0cmV0dXJuIE1haW5XaW5kb3cuc3VwZXIucHJvdG90eXBlLmdldFJlYWR5UHJvY2Vzcy5jYWxsKCB0aGlzLCBkYXRhIClcclxuXHRcdC5uZXh0KCAoKSA9PiB0aGlzLnNlYXJjaEJveC5mb2N1cygpICk7XHJcbn07XHJcblxyXG5NYWluV2luZG93LnByb3RvdHlwZS5vblNlYXJjaFNlbGVjdCA9IGZ1bmN0aW9uKCkge1xyXG5cdHZhciBuYW1lID0gdGhpcy5zZWFyY2hCb3guZ2V0VmFsdWUoKS50cmltKCk7XHJcblx0aWYgKCFuYW1lKSB7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cdHZhciBleGlzdGluZ0Jhbm5lciA9IHRoaXMuYmFubmVyTGlzdC5pdGVtcy5maW5kKGJhbm5lciA9PiB7XHJcblx0XHRyZXR1cm4gKFxyXG5cdFx0XHRiYW5uZXIudGVtcGxhdGUuZ2V0VGl0bGUoKS5nZXRNYWluVGV4dCgpID09PSBuYW1lIHx8XHJcblx0XHRcdGJhbm5lci50ZW1wbGF0ZS5yZWRpcmVjdFRhcmdldCAmJiBiYW5uZXIudGVtcGxhdGUucmVkaXJlY3RUYXJnZXQuZ2V0TWFpblRleHQoKSA9PT0gbmFtZVxyXG5cdFx0KTtcclxuXHR9KTtcclxuXHRpZiAoZXhpc3RpbmdCYW5uZXIpIHtcclxuXHRcdC8vIFRPRE86IHNob3cgZXJyb3IgbWVzc2FnZVxyXG5cdFx0cmV0dXJuO1xyXG5cdH1cclxuXHRpZiAoIS9eW1d3XSg/OlB8aWtpW1BwXXJvamVjdCkvLnRlc3QobmFtZSkpIHtcclxuXHRcdHZhciBtZXNzYWdlID0gbmV3IE9PLnVpLkh0bWxTbmlwcGV0KFxyXG5cdFx0XHRcIjxjb2RlPnt7XCIgKyBuYW1lICsgXCJ9fTwvY29kZT4gaXMgbm90IGEgcmVjb2duaXNlZCBXaWtpUHJvamVjdCBiYW5uZXIuPGJyLz5EbyB5b3Ugd2FudCB0byBjb250aW51ZT9cIlxyXG5cdFx0KTtcclxuXHRcdC8vIFRPRE86IGFzayBmb3IgY29uZmlybWF0aW9uXHJcblx0XHRjb25zb2xlLmxvZyhtZXNzYWdlKTtcclxuXHR9XHJcblx0aWYgKG5hbWUgPT09IFwiV2lraVByb2plY3QgRGlzYW1iaWd1YXRpb25cIiAmJiAkKFwiI2NhLXRhbGsubmV3XCIpLmxlbmd0aCAhPT0gMCAmJiB0aGlzLmJhbm5lckxpc3QuaXRlbXMubGVuZ3RoID09PSAwKSB7XHJcblx0XHR2YXIgbm9OZXdEYWJNZXNzYWdlID0gXCJOZXcgdGFsayBwYWdlcyBzaG91bGRuJ3QgYmUgY3JlYXRlZCBpZiB0aGV5IHdpbGwgb25seSBjb250YWluIHRoZSB7e1dpa2lQcm9qZWN0IERpc2FtYmlndWF0aW9ufX0gYmFubmVyLiBDb250aW51ZT9cIjtcclxuXHRcdC8vIFRPRE86IGFzayBmb3IgY29uZmlybWF0aW9uXHJcblx0XHRjb25zb2xlLmxvZyhub05ld0RhYk1lc3NhZ2UpO1xyXG5cdH1cclxuXHQvLyBDcmVhdGUgVGVtcGxhdGUgb2JqZWN0XHJcblx0dmFyIHRlbXBsYXRlID0gbmV3IFRlbXBsYXRlKCk7XHJcblx0dGVtcGxhdGUubmFtZSA9IG5hbWU7XHJcblx0Z2V0V2l0aFJlZGlyZWN0VG8odGVtcGxhdGUpXHJcblx0XHQudGhlbihmdW5jdGlvbih0ZW1wbGF0ZSkge1xyXG5cdFx0XHRyZXR1cm4gJC53aGVuKFxyXG5cdFx0XHRcdHRlbXBsYXRlLnNldENsYXNzZXNBbmRJbXBvcnRhbmNlcygpLFxyXG5cdFx0XHRcdHRlbXBsYXRlLnNldFBhcmFtRGF0YUFuZFN1Z2dlc3Rpb25zKClcclxuXHRcdFx0KS50aGVuKCgpID0+IHtcclxuXHRcdFx0XHQvLyBSZXR1cm4gdGhlIG5vdy1tb2RpZmllZCB0ZW1wbGF0ZXNcclxuXHRcdFx0XHRyZXR1cm4gdGVtcGxhdGU7XHJcblx0XHRcdH0pO1xyXG5cdFx0fSlcclxuXHRcdC50aGVuKHRlbXBsYXRlID0+IHtcclxuXHRcdFx0dGhpcy5iYW5uZXJMaXN0LmFkZEl0ZW1zKCBbbmV3IEJhbm5lcldpZGdldCh0ZW1wbGF0ZSldICk7XHJcblx0XHRcdHRoaXMudXBkYXRlU2l6ZSgpO1xyXG5cdFx0fSk7XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBNYWluV2luZG93OyIsImltcG9ydCBjb25maWcgZnJvbSBcIi4vY29uZmlnXCI7XHJcbmltcG9ydCB7QVBJLCBtYWtlRXJyb3JNc2d9IGZyb20gXCIuL3V0aWxcIjtcclxuaW1wb3J0IHNldHVwUmF0ZXIgZnJvbSBcIi4vc2V0dXBcIjtcclxuXHJcbnZhciBhdXRvU3RhcnQgPSBmdW5jdGlvbiBhdXRvU3RhcnQoKSB7XHJcblx0aWYgKCB3aW5kb3cucmF0ZXJfYXV0b3N0YXJ0TmFtZXNwYWNlcyA9PSBudWxsIHx8IGNvbmZpZy5tdy53Z0lzTWFpblBhZ2UgKSB7XHJcblx0XHRyZXR1cm4gJC5EZWZlcnJlZCgpLnJlamVjdCgpO1xyXG5cdH1cclxuXHRcclxuXHR2YXIgYXV0b3N0YXJ0TmFtZXNwYWNlcyA9ICggJC5pc0FycmF5KHdpbmRvdy5yYXRlcl9hdXRvc3RhcnROYW1lc3BhY2VzKSApID8gd2luZG93LnJhdGVyX2F1dG9zdGFydE5hbWVzcGFjZXMgOiBbd2luZG93LnJhdGVyX2F1dG9zdGFydE5hbWVzcGFjZXNdO1xyXG5cdFxyXG5cdGlmICggLTEgPT09IGF1dG9zdGFydE5hbWVzcGFjZXMuaW5kZXhPZihjb25maWcubXcud2dOYW1lc3BhY2VOdW1iZXIpICkge1xyXG5cdFx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3QoKTtcclxuXHR9XHJcblx0XHJcblx0aWYgKCAvKD86XFw/fCYpKD86YWN0aW9ufGRpZmZ8b2xkaWQpPS8udGVzdCh3aW5kb3cubG9jYXRpb24uaHJlZikgKSB7XHJcblx0XHRyZXR1cm4gJC5EZWZlcnJlZCgpLnJlamVjdCgpO1xyXG5cdH1cclxuXHRcclxuXHQvLyBDaGVjayBpZiB0YWxrIHBhZ2UgZXhpc3RzXHJcblx0aWYgKCAkKFwiI2NhLXRhbGsubmV3XCIpLmxlbmd0aCApIHtcclxuXHRcdHJldHVybiBzZXR1cFJhdGVyKCk7XHJcblx0fVxyXG5cdFxyXG5cdHZhciB0aGlzUGFnZSA9IG13LlRpdGxlLm5ld0Zyb21UZXh0KGNvbmZpZy5tdy53Z1BhZ2VOYW1lKTtcclxuXHR2YXIgdGFsa1BhZ2UgPSB0aGlzUGFnZSAmJiB0aGlzUGFnZS5nZXRUYWxrUGFnZSgpO1xyXG5cdGlmICghdGFsa1BhZ2UpIHtcclxuXHRcdHJldHVybiAkLkRlZmVycmVkKCkucmVqZWN0KCk7XHJcblx0fVxyXG5cclxuXHQvKiBDaGVjayB0ZW1wbGF0ZXMgcHJlc2VudCBvbiB0YWxrIHBhZ2UuIEZldGNoZXMgaW5kaXJlY3RseSB0cmFuc2NsdWRlZCB0ZW1wbGF0ZXMsIHNvIHdpbGwgZmluZFxyXG5cdFx0VGVtcGxhdGU6V1BCYW5uZXJNZXRhIChhbmQgaXRzIHN1YnRlbXBsYXRlcykuIEJ1dCBzb21lIGJhbm5lcnMgc3VjaCBhcyBNSUxISVNUIGRvbid0IHVzZSB0aGF0XHJcblx0XHRtZXRhIHRlbXBsYXRlLCBzbyB3ZSBhbHNvIGhhdmUgdG8gY2hlY2sgZm9yIHRlbXBsYXRlIHRpdGxlcyBjb250YWluZyAnV2lraVByb2plY3QnXHJcblx0Ki9cclxuXHRyZXR1cm4gQVBJLmdldCh7XHJcblx0XHRhY3Rpb246IFwicXVlcnlcIixcclxuXHRcdGZvcm1hdDogXCJqc29uXCIsXHJcblx0XHRwcm9wOiBcInRlbXBsYXRlc1wiLFxyXG5cdFx0dGl0bGVzOiB0YWxrUGFnZS5nZXRQcmVmaXhlZFRleHQoKSxcclxuXHRcdHRsbmFtZXNwYWNlOiBcIjEwXCIsXHJcblx0XHR0bGxpbWl0OiBcIjUwMFwiLFxyXG5cdFx0aW5kZXhwYWdlaWRzOiAxXHJcblx0fSlcclxuXHRcdC50aGVuKGZ1bmN0aW9uKHJlc3VsdCkge1xyXG5cdFx0XHR2YXIgaWQgPSByZXN1bHQucXVlcnkucGFnZWlkcztcclxuXHRcdFx0dmFyIHRlbXBsYXRlcyA9IHJlc3VsdC5xdWVyeS5wYWdlc1tpZF0udGVtcGxhdGVzO1xyXG5cdFx0XHJcblx0XHRcdGlmICggIXRlbXBsYXRlcyApIHtcclxuXHRcdFx0XHRyZXR1cm4gc2V0dXBSYXRlcigpO1xyXG5cdFx0XHR9XHJcblx0XHRcclxuXHRcdFx0dmFyIGhhc1dpa2lwcm9qZWN0ID0gdGVtcGxhdGVzLnNvbWUodGVtcGxhdGUgPT4gLyhXaWtpUHJvamVjdHxXUEJhbm5lcikvLnRlc3QodGVtcGxhdGUudGl0bGUpKTtcclxuXHRcdFxyXG5cdFx0XHRpZiAoICFoYXNXaWtpcHJvamVjdCApIHtcclxuXHRcdFx0XHRyZXR1cm4gc2V0dXBSYXRlcigpO1xyXG5cdFx0XHR9XHJcblx0XHRcclxuXHRcdH0sXHJcblx0XHRmdW5jdGlvbihjb2RlLCBqcXhocikge1xyXG5cdFx0Ly8gU2lsZW50bHkgaWdub3JlIGZhaWx1cmVzIChqdXN0IGxvZyB0byBjb25zb2xlKVxyXG5cdFx0XHRjb25zb2xlLndhcm4oXHJcblx0XHRcdFx0XCJbUmF0ZXJdIEVycm9yIHdoaWxlIGNoZWNraW5nIHdoZXRoZXIgdG8gYXV0b3N0YXJ0LlwiICtcclxuXHRcdFx0KCBjb2RlID09IG51bGwgKSA/IFwiXCIgOiBcIiBcIiArIG1ha2VFcnJvck1zZyhjb2RlLCBqcXhocilcclxuXHRcdFx0KTtcclxuXHRcdFx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3QoKTtcclxuXHRcdH0pO1xyXG5cclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGF1dG9TdGFydDsiLCJpbXBvcnQge2lzQWZ0ZXJEYXRlfSBmcm9tIFwiLi91dGlsXCI7XHJcblxyXG4vKiogd3JpdGVcclxuICogQHBhcmFtIHtTdHJpbmd9IGtleVxyXG4gKiBAcGFyYW0ge0FycmF5fE9iamVjdH0gdmFsXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBzdGFsZURheXMgTnVtYmVyIG9mIGRheXMgYWZ0ZXIgd2hpY2ggdGhlIGRhdGEgYmVjb21lcyBzdGFsZSAodXNhYmxlLCBidXQgc2hvdWxkXHJcbiAqICBiZSB1cGRhdGVkIGZvciBuZXh0IHRpbWUpLlxyXG4gKiBAcGFyYW0ge051bWJlcn0gZXhwaXJ5RGF5cyBOdW1iZXIgb2YgZGF5cyBhZnRlciB3aGljaCB0aGUgY2FjaGVkIGRhdGEgbWF5IGJlIGRlbGV0ZWQuXHJcbiAqL1xyXG52YXIgd3JpdGUgPSBmdW5jdGlvbihrZXksIHZhbCwgc3RhbGVEYXlzLCBleHBpcnlEYXlzKSB7XHJcblx0dHJ5IHtcclxuXHRcdHZhciBkZWZhdWx0U3RhbGVEYXlzID0gMTtcclxuXHRcdHZhciBkZWZhdWx0RXhwaXJ5RGF5cyA9IDMwO1xyXG5cdFx0dmFyIG1pbGxpc2Vjb25kc1BlckRheSA9IDI0KjYwKjYwKjEwMDA7XHJcblxyXG5cdFx0dmFyIHN0YWxlRHVyYXRpb24gPSAoc3RhbGVEYXlzIHx8IGRlZmF1bHRTdGFsZURheXMpKm1pbGxpc2Vjb25kc1BlckRheTtcclxuXHRcdHZhciBleHBpcnlEdXJhdGlvbiA9IChleHBpcnlEYXlzIHx8IGRlZmF1bHRFeHBpcnlEYXlzKSptaWxsaXNlY29uZHNQZXJEYXk7XHJcblx0XHRcclxuXHRcdHZhciBzdHJpbmdWYWwgPSBKU09OLnN0cmluZ2lmeSh7XHJcblx0XHRcdHZhbHVlOiB2YWwsXHJcblx0XHRcdHN0YWxlRGF0ZTogbmV3IERhdGUoRGF0ZS5ub3coKSArIHN0YWxlRHVyYXRpb24pLnRvSVNPU3RyaW5nKCksXHJcblx0XHRcdGV4cGlyeURhdGU6IG5ldyBEYXRlKERhdGUubm93KCkgKyBleHBpcnlEdXJhdGlvbikudG9JU09TdHJpbmcoKVxyXG5cdFx0fSk7XHJcblx0XHRsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcIlJhdGVyLVwiK2tleSwgc3RyaW5nVmFsKTtcclxuXHR9ICBjYXRjaChlKSB7fSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWVtcHR5XHJcbn07XHJcbi8qKiByZWFkXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBrZXlcclxuICogQHJldHVybnMge0FycmF5fE9iamVjdHxTdHJpbmd8TnVsbH0gQ2FjaGVkIGFycmF5IG9yIG9iamVjdCwgb3IgZW1wdHkgc3RyaW5nIGlmIG5vdCB5ZXQgY2FjaGVkLFxyXG4gKiAgICAgICAgICBvciBudWxsIGlmIHRoZXJlIHdhcyBlcnJvci5cclxuICovXHJcbnZhciByZWFkID0gZnVuY3Rpb24oa2V5KSB7XHJcblx0dmFyIHZhbDtcclxuXHR0cnkge1xyXG5cdFx0dmFyIHN0cmluZ1ZhbCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwiUmF0ZXItXCIra2V5KTtcclxuXHRcdGlmICggc3RyaW5nVmFsICE9PSBcIlwiICkge1xyXG5cdFx0XHR2YWwgPSBKU09OLnBhcnNlKHN0cmluZ1ZhbCk7XHJcblx0XHR9XHJcblx0fSAgY2F0Y2goZSkge1xyXG5cdFx0Y29uc29sZS5sb2coXCJbUmF0ZXJdIGVycm9yIHJlYWRpbmcgXCIgKyBrZXkgKyBcIiBmcm9tIGxvY2FsU3RvcmFnZSBjYWNoZTpcIik7XHJcblx0XHRjb25zb2xlLmxvZyhcclxuXHRcdFx0XCJcXHRcIiArIGUubmFtZSArIFwiIG1lc3NhZ2U6IFwiICsgZS5tZXNzYWdlICtcclxuXHRcdFx0KCBlLmF0ID8gXCIgYXQ6IFwiICsgZS5hdCA6IFwiXCIpICtcclxuXHRcdFx0KCBlLnRleHQgPyBcIiB0ZXh0OiBcIiArIGUudGV4dCA6IFwiXCIpXHJcblx0XHQpO1xyXG5cdH1cclxuXHRyZXR1cm4gdmFsIHx8IG51bGw7XHJcbn07XHJcbnZhciBjbGVhckl0ZW1JZkludmFsaWQgPSBmdW5jdGlvbihrZXkpIHtcclxuXHR2YXIgaXNSYXRlcktleSA9IGtleS5pbmRleE9mKFwiUmF0ZXItXCIpID09PSAwO1xyXG5cdGlmICggIWlzUmF0ZXJLZXkgKSB7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cdHZhciBpdGVtID0gcmVhZChrZXkucmVwbGFjZShcIlJhdGVyLVwiLFwiXCIpKTtcclxuXHR2YXIgaXNJbnZhbGlkID0gIWl0ZW0gfHwgIWl0ZW0uZXhwaXJ5RGF0ZSB8fCBpc0FmdGVyRGF0ZShpdGVtLmV4cGlyeURhdGUpO1xyXG5cdGlmICggaXNJbnZhbGlkICkge1xyXG5cdFx0bG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oa2V5KTtcclxuXHR9XHJcbn07XHJcbnZhciBjbGVhckludmFsaWRJdGVtcyA9IGZ1bmN0aW9uKCkge1xyXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgbG9jYWxTdG9yYWdlLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRzZXRUaW1lb3V0KGNsZWFySXRlbUlmSW52YWxpZCwgMTAwLCBsb2NhbFN0b3JhZ2Uua2V5KGkpKTtcclxuXHR9XHJcbn07XHJcblxyXG5leHBvcnQgeyB3cml0ZSwgcmVhZCwgY2xlYXJJdGVtSWZJbnZhbGlkLCBjbGVhckludmFsaWRJdGVtcyB9OyIsIi8vIEEgZ2xvYmFsIG9iamVjdCB0aGF0IHN0b3JlcyBhbGwgdGhlIHBhZ2UgYW5kIHVzZXIgY29uZmlndXJhdGlvbiBhbmQgc2V0dGluZ3NcclxudmFyIGNvbmZpZyA9IHt9O1xyXG4vLyBTY3JpcHQgaW5mb1xyXG5jb25maWcuc2NyaXB0ID0ge1xyXG5cdC8vIEFkdmVydCB0byBhcHBlbmQgdG8gZWRpdCBzdW1tYXJpZXNcclxuXHRhZHZlcnQ6ICBcIiAoW1tVc2VyOkV2YWQzNy9yYXRlci5qc3xSYXRlcl1dKVwiLFxyXG5cdHZlcnNpb246IFwiMi4wLjBcIlxyXG59O1xyXG4vLyBQcmVmZXJlbmNlczogZ2xvYmFscyB2YXJzIGFkZGVkIHRvIHVzZXJzJyBjb21tb24uanMsIG9yIHNldCB0byBkZWZhdWx0cyBpZiB1bmRlZmluZWRcclxuY29uZmlnLnByZWZzID0ge1xyXG5cdHdhdGNobGlzdDogd2luZG93LnJhdGVyX3dhdGNobGlzdCB8fCBcInByZWZlcmVuY2VzXCJcclxufTtcclxuLy8gTWVkaWFXaWtpIGNvbmZpZ3VyYXRpb24gdmFsdWVzXHJcbmNvbmZpZy5tdyA9IG13LmNvbmZpZy5nZXQoIFtcclxuXHRcInNraW5cIixcclxuXHRcIndnUGFnZU5hbWVcIixcclxuXHRcIndnTmFtZXNwYWNlTnVtYmVyXCIsXHJcblx0XCJ3Z1VzZXJOYW1lXCIsXHJcblx0XCJ3Z0Zvcm1hdHRlZE5hbWVzcGFjZXNcIixcclxuXHRcIndnTW9udGhOYW1lc1wiLFxyXG5cdFwid2dSZXZpc2lvbklkXCIsXHJcblx0XCJ3Z1NjcmlwdFBhdGhcIixcclxuXHRcIndnU2VydmVyXCIsXHJcblx0XCJ3Z0NhdGVnb3JpZXNcIixcclxuXHRcIndnSXNNYWluUGFnZVwiXHJcbl0gKTtcclxuXHJcbmNvbmZpZy5yZWdleCA9IHsgLyogZXNsaW50LWRpc2FibGUgbm8tdXNlbGVzcy1lc2NhcGUgKi9cclxuXHQvLyBQYXR0ZXJuIHRvIGZpbmQgdGVtcGxhdGVzLCB3aGljaCBtYXkgY29udGFpbiBvdGhlciB0ZW1wbGF0ZXNcclxuXHR0ZW1wbGF0ZTpcdFx0L1xce1xce1xccyooW14jXFx7XFxzXS4rPylcXHMqKFxcfCg/Oi58XFxuKSo/KD86KD86XFx7XFx7KD86LnxcXG4pKj8oPzooPzpcXHtcXHsoPzoufFxcbikqP1xcfVxcfSkoPzoufFxcbikqPykqP1xcfVxcfSkoPzoufFxcbikqPykqfClcXH1cXH1cXG4/L2csXHJcblx0Ly8gUGF0dGVybiB0byBmaW5kIGB8cGFyYW09dmFsdWVgIG9yIGB8dmFsdWVgLCB3aGVyZSBgdmFsdWVgIGNhbiBvbmx5IGNvbnRhaW4gYSBwaXBlXHJcblx0Ly8gaWYgd2l0aGluIHNxdWFyZSBicmFja2V0cyAoaS5lLiB3aWtpbGlua3MpIG9yIGJyYWNlcyAoaS5lLiB0ZW1wbGF0ZXMpXHJcblx0dGVtcGxhdGVQYXJhbXM6XHQvXFx8KD8hKD86W157XSt9fFteXFxbXStdKSkoPzoufFxccykqPyg/PSg/OlxcfHwkKSg/ISg/Oltee10rfXxbXlxcW10rXSkpKS9nXHJcbn07IC8qIGVzbGludC1lbmFibGUgbm8tdXNlbGVzcy1lc2NhcGUgKi9cclxuY29uZmlnLmRlZmVycmVkID0ge307XHJcbmNvbmZpZy5iYW5uZXJEZWZhdWx0cyA9IHtcclxuXHRjbGFzc2VzOiBbXHJcblx0XHRcIkZBXCIsXHJcblx0XHRcIkZMXCIsXHJcblx0XHRcIkFcIixcclxuXHRcdFwiR0FcIixcclxuXHRcdFwiQlwiLFxyXG5cdFx0XCJDXCIsXHJcblx0XHRcIlN0YXJ0XCIsXHJcblx0XHRcIlN0dWJcIixcclxuXHRcdFwiTGlzdFwiXHJcblx0XSxcclxuXHRpbXBvcnRhbmNlczogW1xyXG5cdFx0XCJUb3BcIixcclxuXHRcdFwiSGlnaFwiLFxyXG5cdFx0XCJNaWRcIixcclxuXHRcdFwiTG93XCJcclxuXHRdLFxyXG5cdGV4dGVuZGVkQ2xhc3NlczogW1xyXG5cdFx0XCJDYXRlZ29yeVwiLFxyXG5cdFx0XCJEcmFmdFwiLFxyXG5cdFx0XCJGaWxlXCIsXHJcblx0XHRcIlBvcnRhbFwiLFxyXG5cdFx0XCJQcm9qZWN0XCIsXHJcblx0XHRcIlRlbXBsYXRlXCIsXHJcblx0XHRcIkJwbHVzXCIsXHJcblx0XHRcIkZ1dHVyZVwiLFxyXG5cdFx0XCJDdXJyZW50XCIsXHJcblx0XHRcIkRpc2FtYmlnXCIsXHJcblx0XHRcIk5BXCIsXHJcblx0XHRcIlJlZGlyZWN0XCIsXHJcblx0XHRcIkJvb2tcIlxyXG5cdF0sXHJcblx0ZXh0ZW5kZWRJbXBvcnRhbmNlczogW1xyXG5cdFx0XCJUb3BcIixcclxuXHRcdFwiSGlnaFwiLFxyXG5cdFx0XCJNaWRcIixcclxuXHRcdFwiTG93XCIsXHJcblx0XHRcIkJvdHRvbVwiLFxyXG5cdFx0XCJOQVwiXHJcblx0XVxyXG59O1xyXG5jb25maWcuY3VzdG9tQ2xhc3NlcyA9IHtcclxuXHRcIldpa2lQcm9qZWN0IE1pbGl0YXJ5IGhpc3RvcnlcIjogW1xyXG5cdFx0XCJBTFwiLFxyXG5cdFx0XCJCTFwiLFxyXG5cdFx0XCJDTFwiXHJcblx0XSxcclxuXHRcIldpa2lQcm9qZWN0IFBvcnRhbHNcIjogW1xyXG5cdFx0XCJGUG9cIixcclxuXHRcdFwiQ29tcGxldGVcIixcclxuXHRcdFwiU3Vic3RhbnRpYWxcIixcclxuXHRcdFwiQmFzaWNcIixcclxuXHRcdFwiSW5jb21wbGV0ZVwiLFxyXG5cdFx0XCJNZXRhXCJcclxuXHRdXHJcbn07XHJcbmNvbmZpZy5zaGVsbFRlbXBsYXRlcyA9IFtcclxuXHRcIldpa2lQcm9qZWN0IGJhbm5lciBzaGVsbFwiLFxyXG5cdFwiV2lraVByb2plY3RCYW5uZXJzXCIsXHJcblx0XCJXaWtpUHJvamVjdCBCYW5uZXJzXCIsXHJcblx0XCJXUEJcIixcclxuXHRcIldQQlNcIixcclxuXHRcIldpa2lwcm9qZWN0YmFubmVyc2hlbGxcIixcclxuXHRcIldpa2lQcm9qZWN0IEJhbm5lciBTaGVsbFwiLFxyXG5cdFwiV3BiXCIsXHJcblx0XCJXUEJhbm5lclNoZWxsXCIsXHJcblx0XCJXcGJzXCIsXHJcblx0XCJXaWtpcHJvamVjdGJhbm5lcnNcIixcclxuXHRcIldQIEJhbm5lciBTaGVsbFwiLFxyXG5cdFwiV1AgYmFubmVyIHNoZWxsXCIsXHJcblx0XCJCYW5uZXJzaGVsbFwiLFxyXG5cdFwiV2lraXByb2plY3QgYmFubmVyIHNoZWxsXCIsXHJcblx0XCJXaWtpUHJvamVjdCBCYW5uZXJzIFNoZWxsXCIsXHJcblx0XCJXaWtpUHJvamVjdEJhbm5lciBTaGVsbFwiLFxyXG5cdFwiV2lraVByb2plY3RCYW5uZXJTaGVsbFwiLFxyXG5cdFwiV2lraVByb2plY3QgQmFubmVyU2hlbGxcIixcclxuXHRcIldpa2lwcm9qZWN0QmFubmVyU2hlbGxcIixcclxuXHRcIldpa2lQcm9qZWN0IGJhbm5lciBzaGVsbC9yZWRpcmVjdFwiLFxyXG5cdFwiV2lraVByb2plY3QgU2hlbGxcIixcclxuXHRcIkJhbm5lciBzaGVsbFwiLFxyXG5cdFwiU2NvcGUgc2hlbGxcIixcclxuXHRcIlByb2plY3Qgc2hlbGxcIixcclxuXHRcIldpa2lQcm9qZWN0IGJhbm5lclwiXHJcbl07XHJcbmNvbmZpZy5kZWZhdWx0UGFyYW1ldGVyRGF0YSA9IHtcclxuXHRcImF1dG9cIjoge1xyXG5cdFx0XCJsYWJlbFwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJBdXRvLXJhdGVkXCJcclxuXHRcdH0sXHJcblx0XHRcImRlc2NyaXB0aW9uXCI6IHtcclxuXHRcdFx0XCJlblwiOiBcIkF1dG9tYXRpY2FsbHkgcmF0ZWQgYnkgYSBib3QuIEFsbG93ZWQgdmFsdWVzOiBbJ3llcyddLlwiXHJcblx0XHR9LFxyXG5cdFx0XCJhdXRvdmFsdWVcIjogXCJ5ZXNcIlxyXG5cdH0sXHJcblx0XCJsaXN0YXNcIjoge1xyXG5cdFx0XCJsYWJlbFwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJMaXN0IGFzXCJcclxuXHRcdH0sXHJcblx0XHRcImRlc2NyaXB0aW9uXCI6IHtcclxuXHRcdFx0XCJlblwiOiBcIlNvcnRrZXkgZm9yIHRhbGsgcGFnZVwiXHJcblx0XHR9XHJcblx0fSxcclxuXHRcInNtYWxsXCI6IHtcclxuXHRcdFwibGFiZWxcIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiU21hbGw/XCIsXHJcblx0XHR9LFxyXG5cdFx0XCJkZXNjcmlwdGlvblwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJEaXNwbGF5IGEgc21hbGwgdmVyc2lvbi4gQWxsb3dlZCB2YWx1ZXM6IFsneWVzJ10uXCJcclxuXHRcdH0sXHJcblx0XHRcImF1dG92YWx1ZVwiOiBcInllc1wiXHJcblx0fSxcclxuXHRcImF0dGVudGlvblwiOiB7XHJcblx0XHRcImxhYmVsXCI6IHtcclxuXHRcdFx0XCJlblwiOiBcIkF0dGVudGlvbiByZXF1aXJlZD9cIixcclxuXHRcdH0sXHJcblx0XHRcImRlc2NyaXB0aW9uXCI6IHtcclxuXHRcdFx0XCJlblwiOiBcIkltbWVkaWF0ZSBhdHRlbnRpb24gcmVxdWlyZWQuIEFsbG93ZWQgdmFsdWVzOiBbJ3llcyddLlwiXHJcblx0XHR9LFxyXG5cdFx0XCJhdXRvdmFsdWVcIjogXCJ5ZXNcIlxyXG5cdH0sXHJcblx0XCJuZWVkcy1pbWFnZVwiOiB7XHJcblx0XHRcImxhYmVsXCI6IHtcclxuXHRcdFx0XCJlblwiOiBcIk5lZWRzIGltYWdlP1wiLFxyXG5cdFx0fSxcclxuXHRcdFwiZGVzY3JpcHRpb25cIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiUmVxdWVzdCB0aGF0IGFuIGltYWdlIG9yIHBob3RvZ3JhcGggb2YgdGhlIHN1YmplY3QgYmUgYWRkZWQgdG8gdGhlIGFydGljbGUuIEFsbG93ZWQgdmFsdWVzOiBbJ3llcyddLlwiXHJcblx0XHR9LFxyXG5cdFx0XCJhbGlhc2VzXCI6IFtcclxuXHRcdFx0XCJuZWVkcy1waG90b1wiXHJcblx0XHRdLFxyXG5cdFx0XCJhdXRvdmFsdWVcIjogXCJ5ZXNcIixcclxuXHRcdFwic3VnZ2VzdGVkXCI6IHRydWVcclxuXHR9LFxyXG5cdFwibmVlZHMtaW5mb2JveFwiOiB7XHJcblx0XHRcImxhYmVsXCI6IHtcclxuXHRcdFx0XCJlblwiOiBcIk5lZWRzIGluZm9ib3g/XCIsXHJcblx0XHR9LFxyXG5cdFx0XCJkZXNjcmlwdGlvblwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJSZXF1ZXN0IHRoYXQgYW4gaW5mb2JveCBiZSBhZGRlZCB0byB0aGUgYXJ0aWNsZS4gQWxsb3dlZCB2YWx1ZXM6IFsneWVzJ10uXCJcclxuXHRcdH0sXHJcblx0XHRcImFsaWFzZXNcIjogW1xyXG5cdFx0XHRcIm5lZWRzLXBob3RvXCJcclxuXHRcdF0sXHJcblx0XHRcImF1dG92YWx1ZVwiOiBcInllc1wiLFxyXG5cdFx0XCJzdWdnZXN0ZWRcIjogdHJ1ZVxyXG5cdH1cclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNvbmZpZzsiLCIvLyBBdHRyaWJ1dGlvbjogRGlmZiBzdHlsZXMgZnJvbSA8aHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvV2lraXBlZGlhOkF1dG9XaWtpQnJvd3Nlci9zdHlsZS5jc3M+XHJcbnZhciBkaWZmU3R5bGVzID0gYHRhYmxlLmRpZmYsIHRkLmRpZmYtb3RpdGxlLCB0ZC5kaWZmLW50aXRsZSB7IGJhY2tncm91bmQtY29sb3I6IHdoaXRlOyB9XHJcbnRkLmRpZmYtb3RpdGxlLCB0ZC5kaWZmLW50aXRsZSB7IHRleHQtYWxpZ246IGNlbnRlcjsgfVxyXG50ZC5kaWZmLW1hcmtlciB7IHRleHQtYWxpZ246IHJpZ2h0OyBmb250LXdlaWdodDogYm9sZDsgZm9udC1zaXplOiAxLjI1ZW07IH1cclxudGQuZGlmZi1saW5lbm8geyBmb250LXdlaWdodDogYm9sZDsgfVxyXG50ZC5kaWZmLWFkZGVkbGluZSwgdGQuZGlmZi1kZWxldGVkbGluZSwgdGQuZGlmZi1jb250ZXh0IHsgZm9udC1zaXplOiA4OCU7IHZlcnRpY2FsLWFsaWduOiB0b3A7IHdoaXRlLXNwYWNlOiAtbW96LXByZS13cmFwOyB3aGl0ZS1zcGFjZTogcHJlLXdyYXA7IH1cclxudGQuZGlmZi1hZGRlZGxpbmUsIHRkLmRpZmYtZGVsZXRlZGxpbmUgeyBib3JkZXItc3R5bGU6IHNvbGlkOyBib3JkZXItd2lkdGg6IDFweCAxcHggMXB4IDRweDsgYm9yZGVyLXJhZGl1czogMC4zM2VtOyB9XHJcbnRkLmRpZmYtYWRkZWRsaW5lIHsgYm9yZGVyLWNvbG9yOiAjYTNkM2ZmOyB9XHJcbnRkLmRpZmYtZGVsZXRlZGxpbmUgeyBib3JkZXItY29sb3I6ICNmZmU0OWM7IH1cclxudGQuZGlmZi1jb250ZXh0IHsgYmFja2dyb3VuZDogI2YzZjNmMzsgY29sb3I6ICMzMzMzMzM7IGJvcmRlci1zdHlsZTogc29saWQ7IGJvcmRlci13aWR0aDogMXB4IDFweCAxcHggNHB4OyBib3JkZXItY29sb3I6ICNlNmU2ZTY7IGJvcmRlci1yYWRpdXM6IDAuMzNlbTsgfVxyXG4uZGlmZmNoYW5nZSB7IGZvbnQtd2VpZ2h0OiBib2xkOyB0ZXh0LWRlY29yYXRpb246IG5vbmU7IH1cclxudGFibGUuZGlmZiB7XHJcbiAgICBib3JkZXI6IG5vbmU7XHJcbiAgICB3aWR0aDogOTglOyBib3JkZXItc3BhY2luZzogNHB4O1xyXG4gICAgdGFibGUtbGF5b3V0OiBmaXhlZDsgLyogRW5zdXJlcyB0aGF0IGNvbHVtcyBhcmUgb2YgZXF1YWwgd2lkdGggKi9cclxufVxyXG50ZC5kaWZmLWFkZGVkbGluZSAuZGlmZmNoYW5nZSwgdGQuZGlmZi1kZWxldGVkbGluZSAuZGlmZmNoYW5nZSB7IGJvcmRlci1yYWRpdXM6IDAuMzNlbTsgcGFkZGluZzogMC4yNWVtIDA7IH1cclxudGQuZGlmZi1hZGRlZGxpbmUgLmRpZmZjaGFuZ2Uge1x0YmFja2dyb3VuZDogI2Q4ZWNmZjsgfVxyXG50ZC5kaWZmLWRlbGV0ZWRsaW5lIC5kaWZmY2hhbmdlIHsgYmFja2dyb3VuZDogI2ZlZWVjODsgfVxyXG50YWJsZS5kaWZmIHRkIHtcdHBhZGRpbmc6IDAuMzNlbSAwLjY2ZW07IH1cclxudGFibGUuZGlmZiBjb2wuZGlmZi1tYXJrZXIgeyB3aWR0aDogMiU7IH1cclxudGFibGUuZGlmZiBjb2wuZGlmZi1jb250ZW50IHsgd2lkdGg6IDQ4JTsgfVxyXG50YWJsZS5kaWZmIHRkIGRpdiB7XHJcbiAgICAvKiBGb3JjZS13cmFwIHZlcnkgbG9uZyBsaW5lcyBzdWNoIGFzIFVSTHMgb3IgcGFnZS13aWRlbmluZyBjaGFyIHN0cmluZ3MuICovXHJcbiAgICB3b3JkLXdyYXA6IGJyZWFrLXdvcmQ7XHJcbiAgICAvKiBBcyBmYWxsYmFjayAoRkY8My41LCBPcGVyYSA8MTAuNSksIHNjcm9sbGJhcnMgd2lsbCBiZSBhZGRlZCBmb3IgdmVyeSB3aWRlIGNlbGxzXHJcbiAgICAgICAgaW5zdGVhZCBvZiB0ZXh0IG92ZXJmbG93aW5nIG9yIHdpZGVuaW5nICovXHJcbiAgICBvdmVyZmxvdzogYXV0bztcclxufWA7XHJcblxyXG5leHBvcnQgeyBkaWZmU3R5bGVzIH07IiwiaW1wb3J0IHtBUEksIGlzQWZ0ZXJEYXRlLCBtYWtlRXJyb3JNc2d9IGZyb20gXCIuL3V0aWxcIjtcclxuaW1wb3J0ICogYXMgY2FjaGUgZnJvbSBcIi4vY2FjaGVcIjtcclxuXHJcbnZhciBjYWNoZUJhbm5lcnMgPSBmdW5jdGlvbihiYW5uZXJzLCBiYW5uZXJPcHRpb25zKSB7XHJcblx0Y2FjaGUud3JpdGUoXCJiYW5uZXJzXCIsIGJhbm5lcnMsIDIsIDYwKTtcclxuXHRjYWNoZS53cml0ZShcImJhbm5lck9wdGlvbnNcIiwgYmFubmVyT3B0aW9ucywgMiwgNjApO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldHMgYmFubmVycy9vcHRpb25zIGZyb20gdGhlIEFwaVxyXG4gKiBcclxuICogQHJldHVybnMge1Byb21pc2V9IFJlc29sdmVkIHdpdGg6IGJhbm5lcnMgb2JqZWN0LCBiYW5uZXJPcHRpb25zIGFycmF5XHJcbiAqL1xyXG52YXIgZ2V0TGlzdE9mQmFubmVyc0Zyb21BcGkgPSBmdW5jdGlvbigpIHtcclxuXHJcblx0dmFyIGZpbmlzaGVkUHJvbWlzZSA9ICQuRGVmZXJyZWQoKTtcclxuXHJcblx0dmFyIHF1ZXJ5U2tlbGV0b24gPSB7XHJcblx0XHRhY3Rpb246IFwicXVlcnlcIixcclxuXHRcdGZvcm1hdDogXCJqc29uXCIsXHJcblx0XHRsaXN0OiBcImNhdGVnb3J5bWVtYmVyc1wiLFxyXG5cdFx0Y21wcm9wOiBcInRpdGxlXCIsXHJcblx0XHRjbW5hbWVzcGFjZTogXCIxMFwiLFxyXG5cdFx0Y21saW1pdDogXCI1MDBcIlxyXG5cdH07XHJcblxyXG5cdHZhciBjYXRlZ29yaWVzID0gW1xyXG5cdFx0e1xyXG5cdFx0XHR0aXRsZTpcIiBDYXRlZ29yeTpXaWtpUHJvamVjdCBiYW5uZXJzIHdpdGggcXVhbGl0eSBhc3Nlc3NtZW50XCIsXHJcblx0XHRcdGFiYnJldmlhdGlvbjogXCJ3aXRoUmF0aW5nc1wiLFxyXG5cdFx0XHRiYW5uZXJzOiBbXSxcclxuXHRcdFx0cHJvY2Vzc2VkOiAkLkRlZmVycmVkKClcclxuXHRcdH0sXHJcblx0XHR7XHJcblx0XHRcdHRpdGxlOiBcIkNhdGVnb3J5Oldpa2lQcm9qZWN0IGJhbm5lcnMgd2l0aG91dCBxdWFsaXR5IGFzc2Vzc21lbnRcIixcclxuXHRcdFx0YWJicmV2aWF0aW9uOiBcIndpdGhvdXRSYXRpbmdzXCIsXHJcblx0XHRcdGJhbm5lcnM6IFtdLFxyXG5cdFx0XHRwcm9jZXNzZWQ6ICQuRGVmZXJyZWQoKVxyXG5cdFx0fSxcclxuXHRcdHtcclxuXHRcdFx0dGl0bGU6IFwiQ2F0ZWdvcnk6V2lraVByb2plY3QgYmFubmVyIHdyYXBwZXIgdGVtcGxhdGVzXCIsXHJcblx0XHRcdGFiYnJldmlhdGlvbjogXCJ3cmFwcGVyc1wiLFxyXG5cdFx0XHRiYW5uZXJzOiBbXSxcclxuXHRcdFx0cHJvY2Vzc2VkOiAkLkRlZmVycmVkKClcclxuXHRcdH1cclxuXHRdO1xyXG5cclxuXHR2YXIgcHJvY2Vzc1F1ZXJ5ID0gZnVuY3Rpb24ocmVzdWx0LCBjYXRJbmRleCkge1xyXG5cdFx0aWYgKCAhcmVzdWx0LnF1ZXJ5IHx8ICFyZXN1bHQucXVlcnkuY2F0ZWdvcnltZW1iZXJzICkge1xyXG5cdFx0XHQvLyBObyByZXN1bHRzXHJcblx0XHRcdC8vIFRPRE86IGVycm9yIG9yIHdhcm5pbmcgKioqKioqKipcclxuXHRcdFx0ZmluaXNoZWRQcm9taXNlLnJlamVjdCgpO1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblx0XHRcclxuXHRcdC8vIEdhdGhlciB0aXRsZXMgaW50byBhcnJheSAtIGV4Y2x1ZGluZyBcIlRlbXBsYXRlOlwiIHByZWZpeFxyXG5cdFx0dmFyIHJlc3VsdFRpdGxlcyA9IHJlc3VsdC5xdWVyeS5jYXRlZ29yeW1lbWJlcnMubWFwKGZ1bmN0aW9uKGluZm8pIHtcclxuXHRcdFx0cmV0dXJuIGluZm8udGl0bGUuc2xpY2UoOSk7XHJcblx0XHR9KTtcclxuXHRcdEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KGNhdGVnb3JpZXNbY2F0SW5kZXhdLmJhbm5lcnMsIHJlc3VsdFRpdGxlcyk7XHJcblx0XHRcclxuXHRcdC8vIENvbnRpbnVlIHF1ZXJ5IGlmIG5lZWRlZFxyXG5cdFx0aWYgKCByZXN1bHQuY29udGludWUgKSB7XHJcblx0XHRcdGRvQXBpUXVlcnkoJC5leHRlbmQoY2F0ZWdvcmllc1tjYXRJbmRleF0ucXVlcnksIHJlc3VsdC5jb250aW51ZSksIGNhdEluZGV4KTtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHRjYXRlZ29yaWVzW2NhdEluZGV4XS5wcm9jZXNzZWQucmVzb2x2ZSgpO1xyXG5cdH07XHJcblxyXG5cdHZhciBkb0FwaVF1ZXJ5ID0gZnVuY3Rpb24ocSwgY2F0SW5kZXgpIHtcclxuXHRcdEFQSS5nZXQoIHEgKVxyXG5cdFx0XHQuZG9uZSggZnVuY3Rpb24ocmVzdWx0KSB7XHJcblx0XHRcdFx0cHJvY2Vzc1F1ZXJ5KHJlc3VsdCwgY2F0SW5kZXgpO1xyXG5cdFx0XHR9IClcclxuXHRcdFx0LmZhaWwoIGZ1bmN0aW9uKGNvZGUsIGpxeGhyKSB7XHJcblx0XHRcdFx0Y29uc29sZS53YXJuKFwiW1JhdGVyXSBcIiArIG1ha2VFcnJvck1zZyhjb2RlLCBqcXhociwgXCJDb3VsZCBub3QgcmV0cmlldmUgcGFnZXMgZnJvbSBbWzpcIiArIHEuY210aXRsZSArIFwiXV1cIikpO1xyXG5cdFx0XHRcdGZpbmlzaGVkUHJvbWlzZS5yZWplY3QoKTtcclxuXHRcdFx0fSApO1xyXG5cdH07XHJcblx0XHJcblx0Y2F0ZWdvcmllcy5mb3JFYWNoKGZ1bmN0aW9uKGNhdCwgaW5kZXgsIGFycikge1xyXG5cdFx0Y2F0LnF1ZXJ5ID0gJC5leHRlbmQoIHsgXCJjbXRpdGxlXCI6Y2F0LnRpdGxlIH0sIHF1ZXJ5U2tlbGV0b24gKTtcclxuXHRcdCQud2hlbiggYXJyW2luZGV4LTFdICYmIGFycltpbmRleC0xXS5wcm9jZXNzZWQgfHwgdHJ1ZSApLnRoZW4oZnVuY3Rpb24oKXtcclxuXHRcdFx0ZG9BcGlRdWVyeShjYXQucXVlcnksIGluZGV4KTtcclxuXHRcdH0pO1xyXG5cdH0pO1xyXG5cdFxyXG5cdGNhdGVnb3JpZXNbY2F0ZWdvcmllcy5sZW5ndGgtMV0ucHJvY2Vzc2VkLnRoZW4oZnVuY3Rpb24oKXtcclxuXHRcdHZhciBiYW5uZXJzID0ge307XHJcblx0XHR2YXIgc3Rhc2hCYW5uZXIgPSBmdW5jdGlvbihjYXRPYmplY3QpIHtcclxuXHRcdFx0YmFubmVyc1tjYXRPYmplY3QuYWJicmV2aWF0aW9uXSA9IGNhdE9iamVjdC5iYW5uZXJzO1xyXG5cdFx0fTtcclxuXHRcdHZhciBtZXJnZUJhbm5lcnMgPSBmdW5jdGlvbihtZXJnZUludG9UaGlzQXJyYXksIGNhdE9iamVjdCkge1xyXG5cdFx0XHRyZXR1cm4gJC5tZXJnZShtZXJnZUludG9UaGlzQXJyYXksIGNhdE9iamVjdC5iYW5uZXJzKTtcclxuXHRcdH07XHJcblx0XHR2YXIgbWFrZU9wdGlvbiA9IGZ1bmN0aW9uKGJhbm5lck5hbWUpIHtcclxuXHRcdFx0dmFyIGlzV3JhcHBlciA9ICggLTEgIT09ICQuaW5BcnJheShiYW5uZXJOYW1lLCBjYXRlZ29yaWVzWzJdLmJhbm5lcnMpICk7XHJcblx0XHRcdHJldHVybiB7XHJcblx0XHRcdFx0ZGF0YTogICggaXNXcmFwcGVyID8gXCJzdWJzdDpcIiA6IFwiXCIpICsgYmFubmVyTmFtZSxcclxuXHRcdFx0XHRsYWJlbDogYmFubmVyTmFtZS5yZXBsYWNlKFwiV2lraVByb2plY3QgXCIsIFwiXCIpICsgKCBpc1dyYXBwZXIgPyBcIiBbdGVtcGxhdGUgd3JhcHBlcl1cIiA6IFwiXCIpXHJcblx0XHRcdH07XHJcblx0XHR9O1xyXG5cdFx0Y2F0ZWdvcmllcy5mb3JFYWNoKHN0YXNoQmFubmVyKTtcclxuXHRcdFxyXG5cdFx0dmFyIGJhbm5lck9wdGlvbnMgPSBjYXRlZ29yaWVzLnJlZHVjZShtZXJnZUJhbm5lcnMsIFtdKS5tYXAobWFrZU9wdGlvbik7XHJcblx0XHRcclxuXHRcdGZpbmlzaGVkUHJvbWlzZS5yZXNvbHZlKGJhbm5lcnMsIGJhbm5lck9wdGlvbnMpO1xyXG5cdH0pO1xyXG5cdFxyXG5cdHJldHVybiBmaW5pc2hlZFByb21pc2U7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0cyBiYW5uZXJzL29wdGlvbnMgZnJvbSBjYWNoZSwgaWYgdGhlcmUgYW5kIG5vdCB0b28gb2xkXHJcbiAqIFxyXG4gKiBAcmV0dXJucyB7UHJvbWlzZX0gUmVzb2x2ZWQgd2l0aDogYmFubmVycyBvYmplY3QsIGJhbm5lck9wdGlvbnMgb2JqZWN0XHJcbiAqL1xyXG52YXIgZ2V0QmFubmVyc0Zyb21DYWNoZSA9IGZ1bmN0aW9uKCkge1xyXG5cdHZhciBjYWNoZWRCYW5uZXJzID0gY2FjaGUucmVhZChcImJhbm5lcnNcIik7XHJcblx0dmFyIGNhY2hlZEJhbm5lck9wdGlvbnMgPSBjYWNoZS5yZWFkKFwiYmFubmVyT3B0aW9uc1wiKTtcclxuXHRpZiAoXHJcblx0XHQhY2FjaGVkQmFubmVycyB8fFxyXG5cdFx0IWNhY2hlZEJhbm5lcnMudmFsdWUgfHwgIWNhY2hlZEJhbm5lcnMuc3RhbGVEYXRlIHx8XHJcblx0XHQhY2FjaGVkQmFubmVyT3B0aW9ucyB8fFxyXG5cdFx0IWNhY2hlZEJhbm5lck9wdGlvbnMudmFsdWUgfHwgIWNhY2hlZEJhbm5lck9wdGlvbnMuc3RhbGVEYXRlXHJcblx0KSB7XHJcblx0XHRyZXR1cm4gJC5EZWZlcnJlZCgpLnJlamVjdCgpO1xyXG5cdH1cclxuXHRpZiAoIGlzQWZ0ZXJEYXRlKGNhY2hlZEJhbm5lcnMuc3RhbGVEYXRlKSB8fCBpc0FmdGVyRGF0ZShjYWNoZWRCYW5uZXJPcHRpb25zLnN0YWxlRGF0ZSkgKSB7XHJcblx0XHQvLyBVcGRhdGUgaW4gdGhlIGJhY2tncm91bmQ7IHN0aWxsIHVzZSBvbGQgbGlzdCB1bnRpbCB0aGVuICBcclxuXHRcdGdldExpc3RPZkJhbm5lcnNGcm9tQXBpKCkudGhlbihjYWNoZUJhbm5lcnMpO1xyXG5cdH1cclxuXHRyZXR1cm4gJC5EZWZlcnJlZCgpLnJlc29sdmUoY2FjaGVkQmFubmVycy52YWx1ZSwgY2FjaGVkQmFubmVyT3B0aW9ucy52YWx1ZSk7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0cyBiYW5uZXJzL29wdGlvbnMgZnJvbSBjYWNoZSBvciBBUEkuXHJcbiAqIEhhcyBzaWRlIGFmZmVjdCBvZiBhZGRpbmcvdXBkYXRpbmcvY2xlYXJpbmcgY2FjaGUuXHJcbiAqIFxyXG4gKiBAcmV0dXJucyB7UHJvbWlzZTxPYmplY3QsIEFycmF5Pn0gYmFubmVycyBvYmplY3QsIGJhbm5lck9wdGlvbnMgb2JqZWN0XHJcbiAqXHJcbnZhciBnZXRCYW5uZXJzID0gKCkgPT4gZ2V0QmFubmVyc0Zyb21DYWNoZSgpLnRoZW4oXHJcblx0Ly8gU3VjY2VzczogcGFzcyB0aHJvdWdoXHJcblx0KGJhbm5lcnMsIG9wdGlvbnMpID0+ICQuRGVmZXJyZWQoKS5yZXNvbHZlKGJhbm5lcnMsIG9wdGlvbnMpLFxyXG5cdC8vIEZhaWx1cmU6IGdldCBmcm9tIEFwaSwgdGhlbiBjYWNoZSB0aGVtXHJcblx0KCkgPT4ge1xyXG5cdFx0dmFyIGJhbm5lcnNQcm9taXNlID0gZ2V0TGlzdE9mQmFubmVyc0Zyb21BcGkoKTtcclxuXHRcdGJhbm5lcnNQcm9taXNlLnRoZW4oY2FjaGVCYW5uZXJzKTtcclxuXHRcdHJldHVybiBiYW5uZXJzUHJvbWlzZTtcclxuXHR9XHJcbik7XHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEdldHMgYmFubmVyIG5hbWVzLCBncm91cGVkIGJ5IHR5cGUgKHdpdGhSYXRpbmdzLCB3aXRob3V0UmF0aW5ncywgd3JhcHBlcnMpXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlPE9iamVjdD59IHt3aXRoUmF0aW5nczpzdHJpbmdbXSwgd2l0aG91dFJhdGluZ3M6c3RyaW5nW10sIHdyYXBwZXJzOnN0cmluZ1tdPn1cclxuICovXHJcbnZhciBnZXRCYW5uZXJOYW1lcyA9ICgpID0+IGdldEJhbm5lcnNGcm9tQ2FjaGUoKS50aGVuKFxyXG5cdC8vIFN1Y2Nlc3M6IHBhc3MgdGhyb3VnaCAoZmlyc3QgcGFyYW0gb25seSlcclxuXHRiYW5uZXJzID0+IGJhbm5lcnMsXHJcblx0Ly8gRmFpbHVyZTogZ2V0IGZyb20gQXBpLCB0aGVuIGNhY2hlIHRoZW1cclxuXHQoKSA9PiB7XHJcblx0XHR2YXIgYmFubmVyc1Byb21pc2UgPSBnZXRMaXN0T2ZCYW5uZXJzRnJvbUFwaSgpO1xyXG5cdFx0YmFubmVyc1Byb21pc2UudGhlbihjYWNoZUJhbm5lcnMpO1xyXG5cdFx0cmV0dXJuIGJhbm5lcnNQcm9taXNlO1xyXG5cdH1cclxuKTtcclxuXHJcbi8qKlxyXG4gKiBHZXRzIGJhbm5lcnMgYXMge2RhdGEsIGxhYmVsfSBvYmplY3RzLCBmb3IgdXNlIGluIG91ciBTdWdnZXN0aW9uTG9va3VwVGV4dElucHV0V2lkZ2V0XHJcbiAqIGNvbXBvbmVudCAob3Igb3RoZXIgT09VSSB3aWRnZXRzIGxpa2UgT08udWkuQ29tYm9Cb3hJbnB1dFdpZGdldClcclxuICogQHJldHVybnMge1Byb21pc2U8T2JqZWN0W10+fSBSYXRpbmdzIGFzIHtkYXRhOnN0cmluZywgbGFiZWw6c3RyaW5nfSBvYmplY3RzXHJcbiAqL1xyXG52YXIgZ2V0QmFubmVyT3B0aW9ucyA9ICgpID0+IGdldEJhbm5lcnNGcm9tQ2FjaGUoKS50aGVuKFxyXG5cdC8vIFN1Y2Nlc3M6IHBhc3MgdGhyb3VnaCAoc2Vjb25kIHBhcmFtIG9ubHkpXHJcblx0KF9iYW5uZXJzLCBvcHRpb25zKSA9PiBvcHRpb25zLFxyXG5cdC8vIEZhaWx1cmU6IGdldCBmcm9tIEFwaSwgdGhlbiBjYWNoZSB0aGVtXHJcblx0KCkgPT4ge1xyXG5cdFx0dmFyIGJhbm5lcnNQcm9taXNlID0gZ2V0TGlzdE9mQmFubmVyc0Zyb21BcGkoKTtcclxuXHRcdGJhbm5lcnNQcm9taXNlLnRoZW4oY2FjaGVCYW5uZXJzKTtcclxuXHRcdHJldHVybiBiYW5uZXJzUHJvbWlzZTtcclxuXHR9XHJcbik7XHJcblxyXG5leHBvcnQge2dldEJhbm5lck5hbWVzLCBnZXRCYW5uZXJPcHRpb25zfTsiLCJpbXBvcnQgY29uZmlnIGZyb20gXCIuL2NvbmZpZ1wiO1xyXG5pbXBvcnQge0FQSX0gZnJvbSBcIi4vdXRpbFwiO1xyXG5pbXBvcnQgeyBwYXJzZVRlbXBsYXRlcywgZ2V0V2l0aFJlZGlyZWN0VG8gfSBmcm9tIFwiLi9UZW1wbGF0ZVwiO1xyXG5pbXBvcnQge2dldEJhbm5lck5hbWVzfSBmcm9tIFwiLi9nZXRCYW5uZXJzXCI7XHJcbmltcG9ydCAqIGFzIGNhY2hlIGZyb20gXCIuL2NhY2hlXCI7XHJcbmltcG9ydCB3aW5kb3dNYW5hZ2VyIGZyb20gXCIuL3dpbmRvd01hbmFnZXJcIjtcclxuXHJcbnZhciBzZXR1cFJhdGVyID0gZnVuY3Rpb24oY2xpY2tFdmVudCkge1xyXG5cdGlmICggY2xpY2tFdmVudCApIHtcclxuXHRcdGNsaWNrRXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHR9XHJcblxyXG5cdHZhciBzZXR1cENvbXBsZXRlZFByb21pc2UgPSAkLkRlZmVycmVkKCk7XHJcbiAgICBcclxuXHR2YXIgY3VycmVudFBhZ2UgPSBtdy5UaXRsZS5uZXdGcm9tVGV4dChjb25maWcubXcud2dQYWdlTmFtZSk7XHJcblx0dmFyIHRhbGtQYWdlID0gY3VycmVudFBhZ2UgJiYgY3VycmVudFBhZ2UuZ2V0VGFsa1BhZ2UoKTtcclxuXHR2YXIgc3ViamVjdFBhZ2UgPSBjdXJyZW50UGFnZSAmJiBjdXJyZW50UGFnZS5nZXRTdWJqZWN0UGFnZSgpO1xyXG4gXHJcblx0Ly8gR2V0IGxpc3RzIG9mIGFsbCBiYW5uZXJzICh0YXNrIDEpXHJcblx0dmFyIGJhbm5lcnNQcm9taXNlID0gZ2V0QmFubmVyTmFtZXMoKTtcclxuXHJcblx0Ly8gTG9hZCB0YWxrIHBhZ2UgKHRhc2sgMilcclxuXHR2YXIgbG9hZFRhbGtQcm9taXNlID0gQVBJLmdldCgge1xyXG5cdFx0YWN0aW9uOiBcInF1ZXJ5XCIsXHJcblx0XHRwcm9wOiBcInJldmlzaW9uc1wiLFxyXG5cdFx0cnZwcm9wOiBcImNvbnRlbnRcIixcclxuXHRcdHJ2c2VjdGlvbjogXCIwXCIsXHJcblx0XHR0aXRsZXM6IHRhbGtQYWdlLmdldFByZWZpeGVkVGV4dCgpLFxyXG5cdFx0aW5kZXhwYWdlaWRzOiAxXHJcblx0fSApLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xyXG5cdFx0dmFyIGlkID0gcmVzdWx0LnF1ZXJ5LnBhZ2VpZHM7XHRcdFxyXG5cdFx0dmFyIHdpa2l0ZXh0ID0gKCBpZCA8IDAgKSA/IFwiXCIgOiByZXN1bHQucXVlcnkucGFnZXNbaWRdLnJldmlzaW9uc1swXVtcIipcIl07XHJcblx0XHRyZXR1cm4gd2lraXRleHQ7XHJcblx0fSk7XHJcblxyXG5cdC8vIFBhcnNlIHRhbGsgcGFnZSBmb3IgYmFubmVycyAodGFzayAzKVxyXG5cdHZhciBwYXJzZVRhbGtQcm9taXNlID0gbG9hZFRhbGtQcm9taXNlLnRoZW4od2lraXRleHQgPT4gcGFyc2VUZW1wbGF0ZXMod2lraXRleHQsIHRydWUpKSAvLyBHZXQgYWxsIHRlbXBsYXRlc1xyXG5cdFx0LnRoZW4odGVtcGxhdGVzID0+IGdldFdpdGhSZWRpcmVjdFRvKHRlbXBsYXRlcykpIC8vIENoZWNrIGZvciByZWRpcmVjdHNcclxuXHRcdC50aGVuKHRlbXBsYXRlcyA9PiB7XHJcblx0XHRcdHJldHVybiBiYW5uZXJzUHJvbWlzZS50aGVuKChhbGxCYW5uZXJzKSA9PiB7IC8vIEdldCBsaXN0IG9mIGFsbCBiYW5uZXIgdGVtcGxhdGVzXHJcblx0XHRcdFx0cmV0dXJuIHRlbXBsYXRlcy5maWx0ZXIodGVtcGxhdGUgPT4geyAvLyBGaWx0ZXIgb3V0IG5vbi1iYW5uZXJzXHJcblx0XHRcdFx0XHR2YXIgbWFpblRleHQgPSB0ZW1wbGF0ZS5yZWRpcmVjdFRhcmdldFxyXG5cdFx0XHRcdFx0XHQ/IHRlbXBsYXRlLnJlZGlyZWN0VGFyZ2V0LmdldE1haW5UZXh0KClcclxuXHRcdFx0XHRcdFx0OiB0ZW1wbGF0ZS5nZXRUaXRsZSgpLmdldE1haW5UZXh0KCk7XHJcblx0XHRcdFx0XHRyZXR1cm4gYWxsQmFubmVycy53aXRoUmF0aW5ncy5pbmNsdWRlcyhtYWluVGV4dCkgfHwgXHJcbiAgICAgICAgICAgICAgICAgICAgYWxsQmFubmVycy53aXRob3V0UmF0aW5ncy5pbmNsdWRlcyhtYWluVGV4dCkgfHxcclxuICAgICAgICAgICAgICAgICAgICBhbGxCYW5uZXJzLndyYXBwZXJzLmluY2x1ZGVzKG1haW5UZXh0KTtcclxuXHRcdFx0XHR9KVxyXG5cdFx0XHRcdFx0Lm1hcChmdW5jdGlvbih0ZW1wbGF0ZSkgeyAvLyBTZXQgd3JhcHBlciB0YXJnZXQgaWYgbmVlZGVkXHJcblx0XHRcdFx0XHRcdHZhciBtYWluVGV4dCA9IHRlbXBsYXRlLnJlZGlyZWN0VGFyZ2V0XHJcblx0XHRcdFx0XHRcdFx0PyB0ZW1wbGF0ZS5yZWRpcmVjdFRhcmdldC5nZXRNYWluVGV4dCgpXHJcblx0XHRcdFx0XHRcdFx0OiB0ZW1wbGF0ZS5nZXRUaXRsZSgpLmdldE1haW5UZXh0KCk7XHJcblx0XHRcdFx0XHRcdGlmIChhbGxCYW5uZXJzLndyYXBwZXJzLmluY2x1ZGVzKG1haW5UZXh0KSkge1xyXG5cdFx0XHRcdFx0XHRcdHRlbXBsYXRlLnJlZGlyZWN0VGFyZ2V0ID0gbXcuVGl0bGUubmV3RnJvbVRleHQoXCJUZW1wbGF0ZTpTdWJzdDpcIiArIG1haW5UZXh0KTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRyZXR1cm4gdGVtcGxhdGU7XHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0fSk7XHJcblx0XHR9KTtcclxuXHRcclxuXHQvLyBSZXRyaWV2ZSBhbmQgc3RvcmUgY2xhc3NlcywgaW1wb3J0YW5jZXMsIGFuZCBUZW1wbGF0ZURhdGEgKHRhc2sgNClcclxuXHR2YXIgdGVtcGxhdGVEZXRhaWxzUHJvbWlzZSA9IHBhcnNlVGFsa1Byb21pc2UudGhlbihmdW5jdGlvbih0ZW1wbGF0ZXMpIHtcclxuXHRcdC8vIFdhaXQgZm9yIGFsbCBwcm9taXNlcyB0byByZXNvbHZlXHJcblx0XHRyZXR1cm4gJC53aGVuLmFwcGx5KG51bGwsIFtcclxuXHRcdFx0Li4udGVtcGxhdGVzLm1hcCh0ZW1wbGF0ZSA9PiB0ZW1wbGF0ZS5zZXRDbGFzc2VzQW5kSW1wb3J0YW5jZXMoKSksXHJcblx0XHRcdC4uLnRlbXBsYXRlcy5tYXAodGVtcGxhdGUgPT4gdGVtcGxhdGUuc2V0UGFyYW1EYXRhQW5kU3VnZ2VzdGlvbnMoKSlcclxuXHRcdF0pLnRoZW4oKCkgPT4ge1xyXG5cdFx0XHQvLyBSZXR1cm4gdGhlIG5vdy1tb2RpZmllZCB0ZW1wbGF0ZXNcclxuXHRcdFx0cmV0dXJuIHRlbXBsYXRlcztcclxuXHRcdH0pO1xyXG5cdH0pO1xyXG5cclxuXHQvLyBDaGVjayBpZiBwYWdlIGlzIGEgcmVkaXJlY3QgKHRhc2sgNSkgLSBidXQgZG9uJ3QgZXJyb3Igb3V0IGlmIHJlcXVlc3QgZmFpbHNcclxuXHR2YXIgcmVkaXJlY3RDaGVja1Byb21pc2UgPSBBUEkuZ2V0UmF3KHN1YmplY3RQYWdlLmdldFByZWZpeGVkVGV4dCgpKVxyXG5cdFx0LnRoZW4oXHJcblx0XHRcdC8vIFN1Y2Nlc3NcclxuXHRcdFx0ZnVuY3Rpb24ocmF3UGFnZSkgeyBcclxuXHRcdFx0XHRpZiAoIC9eXFxzKiNSRURJUkVDVC9pLnRlc3QocmF3UGFnZSkgKSB7XHJcblx0XHRcdFx0XHQvLyBnZXQgcmVkaXJlY3Rpb24gdGFyZ2V0LCBvciBib29sZWFuIHRydWVcclxuXHRcdFx0XHRcdHJldHVybiByYXdQYWdlLnNsaWNlKHJhd1BhZ2UuaW5kZXhPZihcIltbXCIpKzIsIHJhd1BhZ2UuaW5kZXhPZihcIl1dXCIpKSB8fCB0cnVlO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdH0sXHJcblx0XHRcdC8vIEZhaWx1cmUgKGlnbm9yZWQpXHJcblx0XHRcdGZ1bmN0aW9uKCkgeyByZXR1cm4gbnVsbDsgfVxyXG5cdFx0KTtcclxuXHJcblx0Ly8gUmV0cmlldmUgcmF0aW5nIGZyb20gT1JFUyAodGFzayA2LCBvbmx5IG5lZWRlZCBmb3IgYXJ0aWNsZXMpXHJcblx0dmFyIHNob3VsZEdldE9yZXMgPSAoIGNvbmZpZy5tdy53Z05hbWVzcGFjZU51bWJlciA8PSAxICk7XHJcblx0aWYgKCBzaG91bGRHZXRPcmVzICkge1xyXG5cdFx0dmFyIGxhdGVzdFJldklkUHJvbWlzZSA9IGN1cnJlbnRQYWdlLmlzVGFsa1BhZ2UoKVxyXG5cdFx0XHQ/ICQuRGVmZXJyZWQoKS5yZXNvbHZlKGNvbmZpZy5tdy53Z1JldmlzaW9uSWQpXHJcblx0XHRcdDogXHRBUEkuZ2V0KCB7XHJcblx0XHRcdFx0YWN0aW9uOiBcInF1ZXJ5XCIsXHJcblx0XHRcdFx0Zm9ybWF0OiBcImpzb25cIixcclxuXHRcdFx0XHRwcm9wOiBcInJldmlzaW9uc1wiLFxyXG5cdFx0XHRcdHRpdGxlczogc3ViamVjdFBhZ2UuZ2V0UHJlZml4ZWRUZXh0KCksXHJcblx0XHRcdFx0cnZwcm9wOiBcImlkc1wiLFxyXG5cdFx0XHRcdGluZGV4cGFnZWlkczogMVxyXG5cdFx0XHR9ICkudGhlbihmdW5jdGlvbihyZXN1bHQpIHtcclxuXHRcdFx0XHRpZiAocmVzdWx0LnF1ZXJ5LnJlZGlyZWN0cykge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHR2YXIgaWQgPSByZXN1bHQucXVlcnkucGFnZWlkcztcclxuXHRcdFx0XHR2YXIgcGFnZSA9IHJlc3VsdC5xdWVyeS5wYWdlc1tpZF07XHJcblx0XHRcdFx0aWYgKHBhZ2UubWlzc2luZyA9PT0gXCJcIikge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoIGlkIDwgMCApIHtcclxuXHRcdFx0XHRcdHJldHVybiAkLkRlZmVycmVkKCkucmVqZWN0KCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiBwYWdlLnJldmlzaW9uc1swXS5yZXZpZDtcclxuXHRcdFx0fSk7XHJcblx0XHR2YXIgb3Jlc1Byb21pc2UgPSBsYXRlc3RSZXZJZFByb21pc2UudGhlbihmdW5jdGlvbihsYXRlc3RSZXZJZCkge1xyXG5cdFx0XHRpZiAoIWxhdGVzdFJldklkKSB7XHJcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBBUEkuZ2V0T1JFUyhsYXRlc3RSZXZJZClcclxuXHRcdFx0XHQudGhlbihmdW5jdGlvbihyZXN1bHQpIHtcclxuXHRcdFx0XHRcdHZhciBkYXRhID0gcmVzdWx0LmVud2lraS5zY29yZXNbbGF0ZXN0UmV2SWRdLndwMTA7XHJcblx0XHRcdFx0XHRpZiAoIGRhdGEuZXJyb3IgKSB7XHJcblx0XHRcdFx0XHRcdHJldHVybiAkLkRlZmVycmVkKCkucmVqZWN0KGRhdGEuZXJyb3IudHlwZSwgZGF0YS5lcnJvci5tZXNzYWdlKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdHJldHVybiBkYXRhLnNjb3JlLnByZWRpY3Rpb247XHJcblx0XHRcdFx0fSk7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdC8vIE9wZW4gdGhlIGxvYWQgZGlhbG9nXHJcblx0dmFyIGlzT3BlbmVkUHJvbWlzZSA9ICQuRGVmZXJyZWQoKTtcclxuXHR2YXIgbG9hZERpYWxvZ1dpbiA9IHdpbmRvd01hbmFnZXIub3BlbldpbmRvdyhcImxvYWREaWFsb2dcIiwge1xyXG5cdFx0cHJvbWlzZXM6IFtcclxuXHRcdFx0YmFubmVyc1Byb21pc2UsXHJcblx0XHRcdGxvYWRUYWxrUHJvbWlzZSxcclxuXHRcdFx0cGFyc2VUYWxrUHJvbWlzZSxcclxuXHRcdFx0dGVtcGxhdGVEZXRhaWxzUHJvbWlzZSxcclxuXHRcdFx0cmVkaXJlY3RDaGVja1Byb21pc2UsXHJcblx0XHRcdHNob3VsZEdldE9yZXMgJiYgb3Jlc1Byb21pc2VcclxuXHRcdF0sXHJcblx0XHRvcmVzOiBzaG91bGRHZXRPcmVzLFxyXG5cdFx0aXNPcGVuZWQ6IGlzT3BlbmVkUHJvbWlzZVxyXG5cdH0pO1xyXG5cclxuXHRsb2FkRGlhbG9nV2luLm9wZW5lZC50aGVuKGlzT3BlbmVkUHJvbWlzZS5yZXNvbHZlKTtcclxuXHJcblxyXG5cdCQud2hlbihcclxuXHRcdGxvYWRUYWxrUHJvbWlzZSxcclxuXHRcdHRlbXBsYXRlRGV0YWlsc1Byb21pc2UsXHJcblx0XHRyZWRpcmVjdENoZWNrUHJvbWlzZSxcclxuXHRcdHNob3VsZEdldE9yZXMgJiYgb3Jlc1Byb21pc2VcclxuXHQpLnRoZW4oXHJcblx0XHQvLyBBbGwgc3VjY2VkZWRcclxuXHRcdGZ1bmN0aW9uKHRhbGtXaWtpdGV4dCwgYmFubmVycywgcmVkaXJlY3RUYXJnZXQsIG9yZXNQcmVkaWNpdGlvbiApIHtcclxuXHRcdFx0dmFyIHJlc3VsdCA9IHtcclxuXHRcdFx0XHRzdWNjZXNzOiB0cnVlLFxyXG5cdFx0XHRcdHRhbGtwYWdlOiB0YWxrUGFnZSxcclxuXHRcdFx0XHR0YWxrV2lraXRleHQ6IHRhbGtXaWtpdGV4dCxcclxuXHRcdFx0XHRiYW5uZXJzOiBiYW5uZXJzXHJcblx0XHRcdH07XHJcblx0XHRcdGlmIChyZWRpcmVjdFRhcmdldCkge1xyXG5cdFx0XHRcdHJlc3VsdC5yZWRpcmVjdFRhcmdldCA9IHJlZGlyZWN0VGFyZ2V0O1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChvcmVzUHJlZGljaXRpb24pIHtcclxuXHRcdFx0XHRyZXN1bHQub3Jlc1ByZWRpY2l0aW9uID0gb3Jlc1ByZWRpY2l0aW9uO1xyXG5cdFx0XHR9XHJcblx0XHRcdHdpbmRvd01hbmFnZXIuY2xvc2VXaW5kb3coXCJsb2FkRGlhbG9nXCIsIHJlc3VsdCk7XHJcblx0XHRcdFxyXG5cdFx0fVxyXG5cdCk7IC8vIEFueSBmYWlsdXJlcyBhcmUgaGFuZGxlZCBieSB0aGUgbG9hZERpYWxvZyB3aW5kb3cgaXRzZWxmXHJcblxyXG5cdC8vIE9uIHdpbmRvdyBjbG9zZWQsIGNoZWNrIGRhdGEsIGFuZCByZXNvbHZlL3JlamVjdCBzZXR1cENvbXBsZXRlZFByb21pc2VcclxuXHRsb2FkRGlhbG9nV2luLmNsb3NlZC50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcclxuXHRcdGlmIChkYXRhICYmIGRhdGEuc3VjY2Vzcykge1xyXG5cdFx0XHQvLyBHb3QgZXZlcnl0aGluZyBuZWVkZWQ6IFJlc29sdmUgcHJvbWlzZSB3aXRoIHRoaXMgZGF0YVxyXG5cdFx0XHRzZXR1cENvbXBsZXRlZFByb21pc2UucmVzb2x2ZShkYXRhKTtcclxuXHRcdH0gZWxzZSBpZiAoZGF0YSAmJiBkYXRhLmVycm9yKSB7XHJcblx0XHRcdC8vIFRoZXJlIHdhcyBhbiBlcnJvcjogUmVqZWN0IHByb21pc2Ugd2l0aCBlcnJvciBjb2RlL2luZm9cclxuXHRcdFx0c2V0dXBDb21wbGV0ZWRQcm9taXNlLnJlamVjdChkYXRhLmVycm9yLmNvZGUsIGRhdGEuZXJyb3IuaW5mbyk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHQvLyBXaW5kb3cgY2xvc2VkIGJlZm9yZSBjb21wbGV0aW9uOiByZXNvbHZlIHByb21pc2Ugd2l0aG91dCBhbnkgZGF0YVxyXG5cdFx0XHRzZXR1cENvbXBsZXRlZFByb21pc2UucmVzb2x2ZShudWxsKTtcclxuXHRcdH1cclxuXHRcdGNhY2hlLmNsZWFySW52YWxpZEl0ZW1zKCk7XHJcblx0fSk7XHJcblxyXG5cdC8vIFRFU1RJTkcgcHVycG9zZXMgb25seTogbG9nIHBhc3NlZCBkYXRhIHRvIGNvbnNvbGVcclxuXHRzZXR1cENvbXBsZXRlZFByb21pc2UudGhlbihcclxuXHRcdGRhdGEgPT4gY29uc29sZS5sb2coXCJzZXR1cCB3aW5kb3cgY2xvc2VkXCIsIGRhdGEpLFxyXG5cdFx0KGNvZGUsIGluZm8pID0+IGNvbnNvbGUubG9nKFwic2V0dXAgd2luZG93IGNsb3NlZCB3aXRoIGVycm9yXCIsIHtjb2RlLCBpbmZvfSlcclxuXHQpO1xyXG5cclxuXHRyZXR1cm4gc2V0dXBDb21wbGV0ZWRQcm9taXNlO1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgc2V0dXBSYXRlcjsiLCIvLyBWYXJpb3VzIHV0aWxpdHkgZnVuY3Rpb25zIGFuZCBvYmplY3RzIHRoYXQgbWlnaHQgYmUgdXNlZCBpbiBtdWx0aXBsZSBwbGFjZXNcclxuXHJcbmltcG9ydCBjb25maWcgZnJvbSBcIi4vY29uZmlnXCI7XHJcblxyXG52YXIgaXNBZnRlckRhdGUgPSBmdW5jdGlvbihkYXRlU3RyaW5nKSB7XHJcblx0cmV0dXJuIG5ldyBEYXRlKGRhdGVTdHJpbmcpIDwgbmV3IERhdGUoKTtcclxufTtcclxuXHJcbnZhciBBUEkgPSBuZXcgbXcuQXBpKCB7XHJcblx0YWpheDoge1xyXG5cdFx0aGVhZGVyczogeyBcclxuXHRcdFx0XCJBcGktVXNlci1BZ2VudFwiOiBcIlJhdGVyL1wiICsgY29uZmlnLnNjcmlwdC52ZXJzaW9uICsgXHJcblx0XHRcdFx0XCIgKCBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9Vc2VyOkV2YWQzNy9SYXRlciApXCJcclxuXHRcdH1cclxuXHR9XHJcbn0gKTtcclxuLyogLS0tLS0tLS0tLSBBUEkgZm9yIE9SRVMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xyXG5BUEkuZ2V0T1JFUyA9IGZ1bmN0aW9uKHJldmlzaW9uSUQpIHtcclxuXHRyZXR1cm4gJC5nZXQoXCJodHRwczovL29yZXMud2lraW1lZGlhLm9yZy92My9zY29yZXMvZW53aWtpP21vZGVscz13cDEwJnJldmlkcz1cIityZXZpc2lvbklEKTtcclxufTtcclxuLyogLS0tLS0tLS0tLSBSYXcgd2lraXRleHQgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xyXG5BUEkuZ2V0UmF3ID0gZnVuY3Rpb24ocGFnZSkge1xyXG5cdHJldHVybiAkLmdldChcImh0dHBzOlwiICsgY29uZmlnLm13LndnU2VydmVyICsgbXcudXRpbC5nZXRVcmwocGFnZSwge2FjdGlvbjpcInJhd1wifSkpXHJcblx0XHQudGhlbihmdW5jdGlvbihkYXRhKSB7XHJcblx0XHRcdGlmICggIWRhdGEgKSB7XHJcblx0XHRcdFx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3QoXCJvay1idXQtZW1wdHlcIik7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIGRhdGE7XHJcblx0XHR9KTtcclxufTtcclxuXHJcbnZhciBtYWtlRXJyb3JNc2cgPSBmdW5jdGlvbihmaXJzdCwgc2Vjb25kKSB7XHJcblx0dmFyIGNvZGUsIHhociwgbWVzc2FnZTtcclxuXHRpZiAoIHR5cGVvZiBmaXJzdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2Ygc2Vjb25kID09PSBcInN0cmluZ1wiICkge1xyXG5cdFx0Ly8gRXJyb3JzIGZyb20gJC5nZXQgYmVpbmcgcmVqZWN0ZWQgKE9SRVMgJiBSYXcgd2lraXRleHQpXHJcblx0XHR2YXIgZXJyb3JPYmogPSBmaXJzdC5yZXNwb25zZUpTT04gJiYgZmlyc3QucmVzcG9uc2VKU09OLmVycm9yO1xyXG5cdFx0aWYgKCBlcnJvck9iaiApIHtcclxuXHRcdFx0Ly8gR290IGFuIGFwaS1zcGVjaWZpYyBlcnJvciBjb2RlL21lc3NhZ2VcclxuXHRcdFx0Y29kZSA9IGVycm9yT2JqLmNvZGU7XHJcblx0XHRcdG1lc3NhZ2UgPSBlcnJvck9iai5tZXNzYWdlO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0eGhyID0gZmlyc3Q7XHJcblx0XHR9XHJcblx0fSBlbHNlIGlmICggdHlwZW9mIGZpcnN0ID09PSBcInN0cmluZ1wiICYmIHR5cGVvZiBzZWNvbmQgPT09IFwib2JqZWN0XCIgKSB7XHJcblx0XHQvLyBFcnJvcnMgZnJvbSBtdy5BcGkgb2JqZWN0XHJcblx0XHR2YXIgbXdFcnJvck9iaiA9IHNlY29uZC5lcnJvcjtcclxuXHRcdGlmIChtd0Vycm9yT2JqKSB7XHJcblx0XHRcdC8vIEdvdCBhbiBhcGktc3BlY2lmaWMgZXJyb3IgY29kZS9tZXNzYWdlXHJcblx0XHRcdGNvZGUgPSBlcnJvck9iai5jb2RlO1xyXG5cdFx0XHRtZXNzYWdlID0gZXJyb3JPYmouaW5mbztcclxuXHRcdH0gZWxzZSBpZiAoZmlyc3QgPT09IFwib2stYnV0LWVtcHR5XCIpIHtcclxuXHRcdFx0Y29kZSA9IG51bGw7XHJcblx0XHRcdG1lc3NhZ2UgPSBcIkdvdCBhbiBlbXB0eSByZXNwb25zZSBmcm9tIHRoZSBzZXJ2ZXJcIjtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHhociA9IHNlY29uZCAmJiBzZWNvbmQueGhyO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0aWYgKGNvZGUgJiYgbWVzc2FnZSkge1xyXG5cdFx0cmV0dXJuIGBBUEkgZXJyb3IgJHtjb2RlfTogJHttZXNzYWdlfWA7XHJcblx0fSBlbHNlIGlmIChtZXNzYWdlKSB7XHJcblx0XHRyZXR1cm4gYEFQSSBlcnJvcjogJHttZXNzYWdlfWA7XHJcblx0fSBlbHNlIGlmICh4aHIpIHtcclxuXHRcdHJldHVybiBgSFRUUCBlcnJvciAke3hoci5zdGF0dXN9YDtcclxuXHR9IGVsc2UgaWYgKFxyXG5cdFx0dHlwZW9mIGZpcnN0ID09PSBcInN0cmluZ1wiICYmIGZpcnN0ICE9PSBcImVycm9yXCIgJiZcclxuXHRcdHR5cGVvZiBzZWNvbmQgPT09IFwic3RyaW5nXCIgJiYgc2Vjb25kICE9PSBcImVycm9yXCJcclxuXHQpIHtcclxuXHRcdHJldHVybiBgRXJyb3IgJHtmaXJzdH06ICR7c2Vjb25kfWA7XHJcblx0fSBlbHNlIGlmICh0eXBlb2YgZmlyc3QgPT09IFwic3RyaW5nXCIgJiYgZmlyc3QgIT09IFwiZXJyb3JcIikge1xyXG5cdFx0cmV0dXJuIGBFcnJvcjogJHtmaXJzdH1gO1xyXG5cdH0gZWxzZSB7XHJcblx0XHRyZXR1cm4gXCJVbmtub3duIEFQSSBlcnJvclwiO1xyXG5cdH1cclxufTtcclxuXHJcbmV4cG9ydCB7aXNBZnRlckRhdGUsIEFQSSwgbWFrZUVycm9yTXNnfTsiLCJpbXBvcnQgTG9hZERpYWxvZyBmcm9tIFwiLi9XaW5kb3dzL0xvYWREaWFsb2dcIjtcclxuaW1wb3J0IE1haW5XaW5kb3cgZnJvbSBcIi4vV2luZG93cy9NYWluV2luZG93XCI7XHJcblxyXG52YXIgZmFjdG9yeSA9IG5ldyBPTy5GYWN0b3J5KCk7XHJcblxyXG4vLyBSZWdpc3RlciB3aW5kb3cgY29uc3RydWN0b3JzIHdpdGggdGhlIGZhY3RvcnkuXHJcbmZhY3RvcnkucmVnaXN0ZXIoTG9hZERpYWxvZyk7XHJcbmZhY3RvcnkucmVnaXN0ZXIoTWFpbldpbmRvdyk7XHJcblxyXG52YXIgbWFuYWdlciA9IG5ldyBPTy51aS5XaW5kb3dNYW5hZ2VyKCB7XHJcblx0XCJmYWN0b3J5XCI6IGZhY3RvcnlcclxufSApO1xyXG4kKCBkb2N1bWVudC5ib2R5ICkuYXBwZW5kKCBtYW5hZ2VyLiRlbGVtZW50ICk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBtYW5hZ2VyOyJdfQ==
