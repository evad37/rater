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
  this.$element.css({
    "padding": "20px 10px 16px 10px"
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

var _config = _interopRequireDefault(require("../config"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

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
  label: "Cancel"
}]; // Customize the initialize() function: This is where to add content to the dialog body and set up event handlers.

MainWindow.prototype.initialize = function () {
  var _this = this;

  // Call the parent method.
  MainWindow["super"].prototype.initialize.call(this); // this.outerLayout = new OO.ui.StackLayout( {
  // 	items: [
  // 		this.topBar,
  // 		this.contentLayout
  // 	],
  // 	continuous: true,
  // 	expanded: true
  // } );

  /* --- TOP BAR --- */
  // Search box

  this.searchBox = new _SuggestionLookupTextInputWidget["default"]({
    placeholder: "Add a WikiProject...",
    suggestions: cache.read("bannerOptions"),
    $element: $("<div style='display:inline-block;margin-right:-1px;width:calc(100% - 45px);'>"),
    $overlay: this.$overlay
  });
  (0, _getBanners.getBannerOptions)().then(function (bannerOptions) {
    return _this.searchBox.setSuggestions(bannerOptions);
  });
  this.addBannerButton = new OO.ui.ButtonWidget({
    icon: "add",
    title: "Add",
    flags: "progressive",
    $element: $("<span style='float:right;margin:0'>")
  });
  var $searchContainer = $("<div style='display:inline-block;width: calc(100% - 220px);min-width: 220px;float:left'>").append(this.searchBox.$element, this.addBannerButton.$element); // Set all classes/importances, in the style of a popup button with a menu.
  // (Is actually a dropdown with a hidden label, because that makes the coding easier.)

  this.setAllDropDown = new OO.ui.DropdownWidget({
    icon: "tag",
    label: "Set all...",
    invisibleLabel: true,
    menu: {
      items: [new OO.ui.MenuSectionOptionWidget({
        label: "Classes"
      })].concat(_toConsumableArray(_config["default"].bannerDefaults.classes.map(function (classname) {
        return new OO.ui.MenuOptionWidget({
          data: {
            "class": classname.toLowerCase()
          },
          label: classname
        });
      })), [new OO.ui.MenuSectionOptionWidget({
        label: "Importances"
      })], _toConsumableArray(_config["default"].bannerDefaults.importances.map(function (importance) {
        return new OO.ui.MenuOptionWidget({
          data: {
            importance: importance.toLowerCase()
          },
          label: importance
        });
      })))
    },
    $element: $("<span style=\"width:auto;display:inline-block;float:left;margin:0\" title='Set all...'>"),
    $overlay: this.$overlay
  }); // Remove all banners button

  this.removeAllButton = new OO.ui.ButtonWidget({
    icon: "trash",
    title: "Remove all",
    flags: "destructive"
  }); // Clear all parameters button

  this.clearAllButton = new OO.ui.ButtonWidget({
    icon: "cancel",
    title: "Clear all",
    flags: "destructive"
  }); // Bypass all redirects button

  this.bypassAllButton = new OO.ui.ButtonWidget({
    icon: "articleRedirect",
    title: "Bypass all redirects"
  }); // Group the buttons together

  this.menuButtons = new OO.ui.ButtonGroupWidget({
    items: [this.removeAllButton, this.clearAllButton, this.bypassAllButton],
    $element: $("<span style='float:left;'>")
  });
  this.menuButtons.$element.prepend(this.setAllDropDown.$element); // Put everything into a layout

  this.topBar = new OO.ui.PanelLayout({
    expanded: false,
    framed: false,
    padded: false,
    $element: $("<div style='position:fixed;width:100%;background:#ccc'>")
  });
  this.topBar.$element.append($searchContainer, //this.setAllDropDown.$element,
  this.menuButtons.$element); // Append to the default dialog header

  this.$head.css({
    "height": "73px"
  }).append(this.topBar.$element);
  /* --- CONTENT AREA --- */
  // Banners added dynamically upon opening, so just need a layout with an empty list

  this.bannerList = new _BannerListWidget["default"]();
  this.$body.css({
    "top": "73px"
  }).append(this.bannerList.$element);
  /* --- EVENT HANDLING --- */

  this.searchBox.connect(this, {
    "enter": "onSearchSelect"
  });
  this.addBannerButton.connect(this, {
    "click": "onSearchSelect"
  });
}; // Override the getBodyHeight() method to specify a custom height


MainWindow.prototype.getBodyHeight = function () {
  return Math.max(200, this.bannerList.$element.outerHeight(true));
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

},{"../Template":2,"../cache":11,"../config":12,"../getBanners":14,"./Components/BannerListWidget":3,"./Components/BannerWidget":4,"./Components/SuggestionLookupTextInputWidget":7}],10:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJyYXRlci1zcmMvQXBwLmpzIiwicmF0ZXItc3JjL1RlbXBsYXRlLmpzIiwicmF0ZXItc3JjL1dpbmRvd3MvQ29tcG9uZW50cy9CYW5uZXJMaXN0V2lkZ2V0LmpzIiwicmF0ZXItc3JjL1dpbmRvd3MvQ29tcG9uZW50cy9CYW5uZXJXaWRnZXQuanMiLCJyYXRlci1zcmMvV2luZG93cy9Db21wb25lbnRzL1BhcmFtZXRlckxpc3RXaWRnZXQuanMiLCJyYXRlci1zcmMvV2luZG93cy9Db21wb25lbnRzL1BhcmFtZXRlcldpZGdldC5qcyIsInJhdGVyLXNyYy9XaW5kb3dzL0NvbXBvbmVudHMvU3VnZ2VzdGlvbkxvb2t1cFRleHRJbnB1dFdpZGdldC5qcyIsInJhdGVyLXNyYy9XaW5kb3dzL0xvYWREaWFsb2cuanMiLCJyYXRlci1zcmMvV2luZG93cy9NYWluV2luZG93LmpzIiwicmF0ZXItc3JjL2F1dG9zdGFydC5qcyIsInJhdGVyLXNyYy9jYWNoZS5qcyIsInJhdGVyLXNyYy9jb25maWcuanMiLCJyYXRlci1zcmMvY3NzLmpzIiwicmF0ZXItc3JjL2dldEJhbm5lcnMuanMiLCJyYXRlci1zcmMvc2V0dXAuanMiLCJyYXRlci1zcmMvdXRpbC5qcyIsInJhdGVyLXNyYy93aW5kb3dNYW5hZ2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQUVBLENBQUMsU0FBUyxHQUFULEdBQWU7QUFDZixFQUFBLE9BQU8sQ0FBQyxHQUFSLENBQVksOEJBQVo7QUFFQSxFQUFBLEVBQUUsQ0FBQyxJQUFILENBQVEsTUFBUixDQUFlLGVBQWY7O0FBRUEsTUFBTSxjQUFjLEdBQUcsU0FBakIsY0FBaUIsQ0FBQSxJQUFJLEVBQUk7QUFDOUIsUUFBSSxDQUFDLElBQUQsSUFBUyxDQUFDLElBQUksQ0FBQyxPQUFuQixFQUE0QjtBQUMzQjtBQUNBOztBQUVELDhCQUFjLFVBQWQsQ0FBeUIsTUFBekIsRUFBaUMsSUFBakM7QUFDQSxHQU5EOztBQVFBLE1BQU0sY0FBYyxHQUFHLFNBQWpCLGNBQWlCLENBQUMsSUFBRCxFQUFPLEtBQVA7QUFBQSxXQUFpQixFQUFFLENBQUMsRUFBSCxDQUFNLEtBQU4sQ0FDdkMsd0JBQWEsSUFBYixFQUFtQixLQUFuQixDQUR1QyxFQUNaO0FBQzFCLE1BQUEsS0FBSyxFQUFFO0FBRG1CLEtBRFksQ0FBakI7QUFBQSxHQUF2QixDQWJlLENBbUJmOzs7QUFDQSxFQUFBLEVBQUUsQ0FBQyxJQUFILENBQVEsY0FBUixDQUNDLFlBREQsRUFFQyxHQUZELEVBR0MsT0FIRCxFQUlDLFVBSkQsRUFLQyw2QkFMRCxFQU1DLEdBTkQ7QUFRQSxFQUFBLENBQUMsQ0FBQyxXQUFELENBQUQsQ0FBZSxLQUFmLENBQXFCO0FBQUEsV0FBTSx5QkFBYSxJQUFiLENBQWtCLGNBQWxCLEVBQWtDLGNBQWxDLENBQU47QUFBQSxHQUFyQixFQTVCZSxDQThCZjs7QUFDQSwrQkFBWSxJQUFaLENBQWlCLGNBQWpCO0FBQ0EsQ0FoQ0Q7Ozs7Ozs7Ozs7QUNOQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7QUFFQTs7Ozs7Ozs7Ozs7Ozs7O0FBZUEsSUFBSSxRQUFRLEdBQUcsU0FBWCxRQUFXLENBQVMsUUFBVCxFQUFtQjtBQUNqQyxPQUFLLFFBQUwsR0FBZ0IsUUFBaEI7QUFDQSxPQUFLLFVBQUwsR0FBa0IsRUFBbEI7QUFDQSxDQUhEOzs7O0FBSUEsUUFBUSxDQUFDLFNBQVQsQ0FBbUIsUUFBbkIsR0FBOEIsVUFBUyxJQUFULEVBQWUsR0FBZixFQUFvQixRQUFwQixFQUE4QjtBQUMzRCxPQUFLLFVBQUwsQ0FBZ0IsSUFBaEIsQ0FBcUI7QUFDcEIsWUFBUSxJQURZO0FBRXBCLGFBQVMsR0FGVztBQUdwQixnQkFBWSxNQUFNO0FBSEUsR0FBckI7QUFLQSxDQU5EO0FBT0E7Ozs7O0FBR0EsUUFBUSxDQUFDLFNBQVQsQ0FBbUIsUUFBbkIsR0FBOEIsVUFBUyxTQUFULEVBQW9CO0FBQ2pELFNBQU8sS0FBSyxVQUFMLENBQWdCLElBQWhCLENBQXFCLFVBQVMsQ0FBVCxFQUFZO0FBQUUsV0FBTyxDQUFDLENBQUMsSUFBRixJQUFVLFNBQWpCO0FBQTZCLEdBQWhFLENBQVA7QUFDQSxDQUZEOztBQUdBLFFBQVEsQ0FBQyxTQUFULENBQW1CLE9BQW5CLEdBQTZCLFVBQVMsSUFBVCxFQUFlO0FBQzNDLE9BQUssSUFBTCxHQUFZLElBQUksQ0FBQyxJQUFMLEVBQVo7QUFDQSxDQUZEOztBQUdBLFFBQVEsQ0FBQyxTQUFULENBQW1CLFFBQW5CLEdBQThCLFlBQVc7QUFDeEMsU0FBTyxFQUFFLENBQUMsS0FBSCxDQUFTLFdBQVQsQ0FBcUIsY0FBYyxLQUFLLElBQXhDLENBQVA7QUFDQSxDQUZEO0FBSUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE0Q0EsSUFBSSxjQUFjLEdBQUcsU0FBakIsY0FBaUIsQ0FBUyxRQUFULEVBQW1CLFNBQW5CLEVBQThCO0FBQUU7QUFDcEQsTUFBSSxDQUFDLFFBQUwsRUFBZTtBQUNkLFdBQU8sRUFBUDtBQUNBOztBQUNELE1BQUksWUFBWSxHQUFHLFNBQWYsWUFBZSxDQUFTLE1BQVQsRUFBaUIsS0FBakIsRUFBd0IsS0FBeEIsRUFBOEI7QUFDaEQsV0FBTyxNQUFNLENBQUMsS0FBUCxDQUFhLENBQWIsRUFBZSxLQUFmLElBQXdCLEtBQXhCLEdBQStCLE1BQU0sQ0FBQyxLQUFQLENBQWEsS0FBSyxHQUFHLENBQXJCLENBQXRDO0FBQ0EsR0FGRDs7QUFJQSxNQUFJLE1BQU0sR0FBRyxFQUFiOztBQUVBLE1BQUksbUJBQW1CLEdBQUcsU0FBdEIsbUJBQXNCLENBQVUsUUFBVixFQUFvQixNQUFwQixFQUE0QjtBQUNyRCxRQUFJLElBQUksR0FBRyxRQUFRLENBQUMsS0FBVCxDQUFlLFFBQWYsRUFBeUIsTUFBekIsQ0FBWDtBQUVBLFFBQUksUUFBUSxHQUFHLElBQUksUUFBSixDQUFhLE9BQU8sSUFBSSxDQUFDLE9BQUwsQ0FBYSxPQUFiLEVBQXFCLEdBQXJCLENBQVAsR0FBbUMsSUFBaEQsQ0FBZixDQUhxRCxDQUtyRDtBQUNBOztBQUNBLFdBQVEsNEJBQTRCLElBQTVCLENBQWlDLElBQWpDLENBQVIsRUFBaUQ7QUFDaEQsTUFBQSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQUwsQ0FBYSwyQkFBYixFQUEwQyxVQUExQyxDQUFQO0FBQ0E7O0FBRUQsUUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUwsQ0FBVyxHQUFYLEVBQWdCLEdBQWhCLENBQW9CLFVBQVMsS0FBVCxFQUFnQjtBQUNoRDtBQUNBLGFBQU8sS0FBSyxDQUFDLE9BQU4sQ0FBYyxPQUFkLEVBQXNCLEdBQXRCLENBQVA7QUFDQSxLQUhZLENBQWI7QUFLQSxJQUFBLFFBQVEsQ0FBQyxPQUFULENBQWlCLE1BQU0sQ0FBQyxDQUFELENBQXZCO0FBRUEsUUFBSSxlQUFlLEdBQUcsTUFBTSxDQUFDLEtBQVAsQ0FBYSxDQUFiLENBQXRCO0FBRUEsUUFBSSxVQUFVLEdBQUcsQ0FBakI7QUFDQSxJQUFBLGVBQWUsQ0FBQyxPQUFoQixDQUF3QixVQUFTLEtBQVQsRUFBZ0I7QUFDdkMsVUFBSSxjQUFjLEdBQUcsS0FBSyxDQUFDLE9BQU4sQ0FBYyxHQUFkLENBQXJCO0FBQ0EsVUFBSSxpQkFBaUIsR0FBRyxLQUFLLENBQUMsT0FBTixDQUFjLElBQWQsQ0FBeEI7QUFFQSxVQUFJLGVBQWUsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFOLENBQWUsR0FBZixDQUF2QjtBQUNBLFVBQUkscUJBQXFCLEdBQUcsS0FBSyxDQUFDLFFBQU4sQ0FBZSxJQUFmLEtBQXdCLGlCQUFpQixHQUFHLGNBQXhFO0FBQ0EsVUFBSSxjQUFjLEdBQUssZUFBZSxJQUFJLHFCQUExQztBQUVBLFVBQUksS0FBSixFQUFXLElBQVgsRUFBaUIsSUFBakI7O0FBQ0EsVUFBSyxjQUFMLEVBQXNCO0FBQ3JCO0FBQ0E7QUFDQSxlQUFRLFFBQVEsQ0FBQyxRQUFULENBQWtCLFVBQWxCLENBQVIsRUFBd0M7QUFDdkMsVUFBQSxVQUFVO0FBQ1Y7O0FBQ0QsUUFBQSxJQUFJLEdBQUcsVUFBUDtBQUNBLFFBQUEsSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFOLEVBQVA7QUFDQSxPQVJELE1BUU87QUFDTixRQUFBLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBTixDQUFZLENBQVosRUFBZSxjQUFmLEVBQStCLElBQS9CLEVBQVI7QUFDQSxRQUFBLElBQUksR0FBRyxLQUFLLENBQUMsS0FBTixDQUFZLGNBQWMsR0FBRyxDQUE3QixFQUFnQyxJQUFoQyxFQUFQO0FBQ0E7O0FBQ0QsTUFBQSxRQUFRLENBQUMsUUFBVCxDQUFrQixLQUFLLElBQUksSUFBM0IsRUFBaUMsSUFBakMsRUFBdUMsS0FBdkM7QUFDQSxLQXRCRDtBQXdCQSxJQUFBLE1BQU0sQ0FBQyxJQUFQLENBQVksUUFBWjtBQUNBLEdBOUNEOztBQWlEQSxNQUFJLENBQUMsR0FBRyxRQUFRLENBQUMsTUFBakIsQ0EzRGtELENBNkRsRDs7QUFDQSxNQUFJLFdBQVcsR0FBRyxDQUFsQixDQTlEa0QsQ0FnRWxEOztBQUNBLE1BQUksU0FBUyxHQUFHLEtBQWhCO0FBQ0EsTUFBSSxRQUFRLEdBQUcsS0FBZjtBQUVBLE1BQUksUUFBSixFQUFjLE1BQWQ7O0FBRUEsT0FBSyxJQUFJLENBQUMsR0FBQyxDQUFYLEVBQWMsQ0FBQyxHQUFDLENBQWhCLEVBQW1CLENBQUMsRUFBcEIsRUFBd0I7QUFFdkIsUUFBSyxDQUFDLFNBQUQsSUFBYyxDQUFDLFFBQXBCLEVBQStCO0FBRTlCLFVBQUksUUFBUSxDQUFDLENBQUQsQ0FBUixLQUFnQixHQUFoQixJQUF1QixRQUFRLENBQUMsQ0FBQyxHQUFDLENBQUgsQ0FBUixLQUFrQixHQUE3QyxFQUFrRDtBQUNqRCxZQUFJLFdBQVcsS0FBSyxDQUFwQixFQUF1QjtBQUN0QixVQUFBLFFBQVEsR0FBRyxDQUFDLEdBQUMsQ0FBYjtBQUNBOztBQUNELFFBQUEsV0FBVyxJQUFJLENBQWY7QUFDQSxRQUFBLENBQUM7QUFDRCxPQU5ELE1BTU8sSUFBSSxRQUFRLENBQUMsQ0FBRCxDQUFSLEtBQWdCLEdBQWhCLElBQXVCLFFBQVEsQ0FBQyxDQUFDLEdBQUMsQ0FBSCxDQUFSLEtBQWtCLEdBQTdDLEVBQWtEO0FBQ3hELFlBQUksV0FBVyxLQUFLLENBQXBCLEVBQXVCO0FBQ3RCLFVBQUEsTUFBTSxHQUFHLENBQVQ7QUFDQSxVQUFBLG1CQUFtQixDQUFDLFFBQUQsRUFBVyxNQUFYLENBQW5CO0FBQ0E7O0FBQ0QsUUFBQSxXQUFXLElBQUksQ0FBZjtBQUNBLFFBQUEsQ0FBQztBQUNELE9BUE0sTUFPQSxJQUFJLFFBQVEsQ0FBQyxDQUFELENBQVIsS0FBZ0IsR0FBaEIsSUFBdUIsV0FBVyxHQUFHLENBQXpDLEVBQTRDO0FBQ2xEO0FBQ0EsUUFBQSxRQUFRLEdBQUcsWUFBWSxDQUFDLFFBQUQsRUFBVyxDQUFYLEVBQWEsTUFBYixDQUF2QjtBQUNBLE9BSE0sTUFHQSxJQUFLLFFBQVEsSUFBUixDQUFhLFFBQVEsQ0FBQyxLQUFULENBQWUsQ0FBZixFQUFrQixDQUFDLEdBQUcsQ0FBdEIsQ0FBYixDQUFMLEVBQThDO0FBQ3BELFFBQUEsU0FBUyxHQUFHLElBQVo7QUFDQSxRQUFBLENBQUMsSUFBSSxDQUFMO0FBQ0EsT0FITSxNQUdBLElBQUssY0FBYyxJQUFkLENBQW1CLFFBQVEsQ0FBQyxLQUFULENBQWUsQ0FBZixFQUFrQixDQUFDLEdBQUcsQ0FBdEIsQ0FBbkIsQ0FBTCxFQUFvRDtBQUMxRCxRQUFBLFFBQVEsR0FBRyxJQUFYO0FBQ0EsUUFBQSxDQUFDLElBQUksQ0FBTDtBQUNBO0FBRUQsS0ExQkQsTUEwQk87QUFBRTtBQUNSLFVBQUksUUFBUSxDQUFDLENBQUQsQ0FBUixLQUFnQixHQUFwQixFQUF5QjtBQUN4QjtBQUNBLFFBQUEsUUFBUSxHQUFHLFlBQVksQ0FBQyxRQUFELEVBQVcsQ0FBWCxFQUFhLE1BQWIsQ0FBdkI7QUFDQSxPQUhELE1BR08sSUFBSSxPQUFPLElBQVAsQ0FBWSxRQUFRLENBQUMsS0FBVCxDQUFlLENBQWYsRUFBa0IsQ0FBQyxHQUFHLENBQXRCLENBQVosQ0FBSixFQUEyQztBQUNqRCxRQUFBLFNBQVMsR0FBRyxLQUFaO0FBQ0EsUUFBQSxDQUFDLElBQUksQ0FBTDtBQUNBLE9BSE0sTUFHQSxJQUFJLGdCQUFnQixJQUFoQixDQUFxQixRQUFRLENBQUMsS0FBVCxDQUFlLENBQWYsRUFBa0IsQ0FBQyxHQUFHLEVBQXRCLENBQXJCLENBQUosRUFBcUQ7QUFDM0QsUUFBQSxRQUFRLEdBQUcsS0FBWDtBQUNBLFFBQUEsQ0FBQyxJQUFJLENBQUw7QUFDQTtBQUNEO0FBRUQ7O0FBRUQsTUFBSyxTQUFMLEVBQWlCO0FBQ2hCLFFBQUksWUFBWSxHQUFHLE1BQU0sQ0FBQyxHQUFQLENBQVcsVUFBUyxRQUFULEVBQW1CO0FBQ2hELGFBQU8sUUFBUSxDQUFDLFFBQVQsQ0FBa0IsS0FBbEIsQ0FBd0IsQ0FBeEIsRUFBMEIsQ0FBQyxDQUEzQixDQUFQO0FBQ0EsS0FGa0IsRUFHakIsTUFIaUIsQ0FHVixVQUFTLGdCQUFULEVBQTJCO0FBQ2xDLGFBQU8sYUFBYSxJQUFiLENBQWtCLGdCQUFsQixDQUFQO0FBQ0EsS0FMaUIsRUFNakIsR0FOaUIsQ0FNYixVQUFTLGdCQUFULEVBQTJCO0FBQy9CLGFBQU8sY0FBYyxDQUFDLGdCQUFELEVBQW1CLElBQW5CLENBQXJCO0FBQ0EsS0FSaUIsQ0FBbkI7QUFVQSxXQUFPLE1BQU0sQ0FBQyxNQUFQLENBQWMsS0FBZCxDQUFvQixNQUFwQixFQUE0QixZQUE1QixDQUFQO0FBQ0E7O0FBRUQsU0FBTyxNQUFQO0FBQ0EsQ0FoSUQ7QUFnSUc7O0FBRUg7Ozs7Ozs7O0FBSUEsSUFBSSxpQkFBaUIsR0FBRyxTQUFwQixpQkFBb0IsQ0FBUyxTQUFULEVBQW9CO0FBQzNDLE1BQUksY0FBYyxHQUFHLEtBQUssQ0FBQyxPQUFOLENBQWMsU0FBZCxJQUEyQixTQUEzQixHQUF1QyxDQUFDLFNBQUQsQ0FBNUQ7O0FBQ0EsTUFBSSxjQUFjLENBQUMsTUFBZixLQUEwQixDQUE5QixFQUFpQztBQUNoQyxXQUFPLENBQUMsQ0FBQyxRQUFGLEdBQWEsT0FBYixDQUFxQixFQUFyQixDQUFQO0FBQ0E7O0FBRUQsU0FBTyxVQUFJLEdBQUosQ0FBUTtBQUNkLGNBQVUsT0FESTtBQUVkLGNBQVUsTUFGSTtBQUdkLGNBQVUsY0FBYyxDQUFDLEdBQWYsQ0FBbUIsVUFBQSxRQUFRO0FBQUEsYUFBSSxRQUFRLENBQUMsUUFBVCxHQUFvQixlQUFwQixFQUFKO0FBQUEsS0FBM0IsQ0FISTtBQUlkLGlCQUFhO0FBSkMsR0FBUixFQUtKLElBTEksQ0FLQyxVQUFTLE1BQVQsRUFBaUI7QUFDeEIsUUFBSyxDQUFDLE1BQUQsSUFBVyxDQUFDLE1BQU0sQ0FBQyxLQUF4QixFQUFnQztBQUMvQixhQUFPLENBQUMsQ0FBQyxRQUFGLEdBQWEsTUFBYixDQUFvQixnQkFBcEIsQ0FBUDtBQUNBOztBQUNELFFBQUssTUFBTSxDQUFDLEtBQVAsQ0FBYSxTQUFsQixFQUE4QjtBQUM3QixNQUFBLE1BQU0sQ0FBQyxLQUFQLENBQWEsU0FBYixDQUF1QixPQUF2QixDQUErQixVQUFTLFFBQVQsRUFBbUI7QUFDakQsWUFBSSxDQUFDLEdBQUcsY0FBYyxDQUFDLFNBQWYsQ0FBeUIsVUFBQSxRQUFRO0FBQUEsaUJBQUksUUFBUSxDQUFDLFFBQVQsR0FBb0IsZUFBcEIsT0FBMEMsUUFBUSxDQUFDLElBQXZEO0FBQUEsU0FBakMsQ0FBUjs7QUFDQSxZQUFJLENBQUMsS0FBSyxDQUFDLENBQVgsRUFBYztBQUNiLFVBQUEsY0FBYyxDQUFDLENBQUQsQ0FBZCxDQUFrQixjQUFsQixHQUFtQyxFQUFFLENBQUMsS0FBSCxDQUFTLFdBQVQsQ0FBcUIsUUFBUSxDQUFDLEVBQTlCLENBQW5DO0FBQ0E7QUFDRCxPQUxEO0FBTUE7O0FBQ0QsV0FBTyxLQUFLLENBQUMsT0FBTixDQUFjLFNBQWQsSUFBMkIsY0FBM0IsR0FBNEMsY0FBYyxDQUFDLENBQUQsQ0FBakU7QUFDQSxHQWxCTSxDQUFQO0FBbUJBLENBekJEOzs7O0FBMkJBLFFBQVEsQ0FBQyxTQUFULENBQW1CLGVBQW5CLEdBQXFDLFVBQVMsR0FBVCxFQUFjLFFBQWQsRUFBd0I7QUFDNUQsTUFBSyxDQUFDLEtBQUssU0FBWCxFQUF1QjtBQUN0QixXQUFPLElBQVA7QUFDQSxHQUgyRCxDQUk1RDs7O0FBQ0EsTUFBSSxJQUFJLEdBQUcsS0FBSyxZQUFMLENBQWtCLFFBQWxCLEtBQStCLFFBQTFDOztBQUNBLE1BQUssQ0FBQyxLQUFLLFNBQUwsQ0FBZSxJQUFmLENBQU4sRUFBNkI7QUFDNUI7QUFDQTs7QUFFRCxNQUFJLElBQUksR0FBRyxLQUFLLFNBQUwsQ0FBZSxJQUFmLEVBQXFCLEdBQXJCLENBQVgsQ0FWNEQsQ0FXNUQ7O0FBQ0EsTUFBSyxJQUFJLElBQUksSUFBSSxDQUFDLEVBQWIsSUFBbUIsQ0FBQyxLQUFLLENBQUMsT0FBTixDQUFjLElBQWQsQ0FBekIsRUFBK0M7QUFDOUMsV0FBTyxJQUFJLENBQUMsRUFBWjtBQUNBOztBQUNELFNBQU8sSUFBUDtBQUNBLENBaEJEOztBQWtCQSxRQUFRLENBQUMsU0FBVCxDQUFtQiwwQkFBbkIsR0FBZ0QsWUFBVztBQUMxRCxNQUFJLElBQUksR0FBRyxJQUFYO0FBQ0EsTUFBSSxZQUFZLEdBQUcsQ0FBQyxDQUFDLFFBQUYsRUFBbkI7O0FBRUEsTUFBSyxJQUFJLENBQUMsU0FBVixFQUFzQjtBQUFFLFdBQU8sWUFBWSxDQUFDLE9BQWIsRUFBUDtBQUFnQzs7QUFFeEQsTUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLGNBQUwsR0FDaEIsSUFBSSxDQUFDLGNBQUwsQ0FBb0IsZUFBcEIsRUFEZ0IsR0FFaEIsSUFBSSxDQUFDLFFBQUwsR0FBZ0IsZUFBaEIsRUFGSDtBQUlBLE1BQUksVUFBVSxHQUFHLEtBQUssQ0FBQyxJQUFOLENBQVcsWUFBWSxHQUFHLFNBQTFCLENBQWpCOztBQUVBLE1BQ0MsVUFBVSxJQUNWLFVBQVUsQ0FBQyxLQURYLElBRUEsVUFBVSxDQUFDLFNBRlgsSUFHQSxVQUFVLENBQUMsS0FBWCxDQUFpQixTQUFqQixJQUE4QixJQUg5QixJQUlBLFVBQVUsQ0FBQyxLQUFYLENBQWlCLG9CQUFqQixJQUF5QyxJQUp6QyxJQUtBLFVBQVUsQ0FBQyxLQUFYLENBQWlCLFlBQWpCLElBQWlDLElBTmxDLEVBT0U7QUFDRCxJQUFBLElBQUksQ0FBQyxjQUFMLEdBQXNCLFVBQVUsQ0FBQyxLQUFYLENBQWlCLGNBQXZDO0FBQ0EsSUFBQSxJQUFJLENBQUMsU0FBTCxHQUFpQixVQUFVLENBQUMsS0FBWCxDQUFpQixTQUFsQztBQUNBLElBQUEsSUFBSSxDQUFDLG9CQUFMLEdBQTRCLFVBQVUsQ0FBQyxLQUFYLENBQWlCLG9CQUE3QztBQUNBLElBQUEsSUFBSSxDQUFDLFlBQUwsR0FBb0IsVUFBVSxDQUFDLEtBQVgsQ0FBaUIsWUFBckM7QUFFQSxJQUFBLFlBQVksQ0FBQyxPQUFiOztBQUNBLFFBQUssQ0FBQyx1QkFBWSxVQUFVLENBQUMsU0FBdkIsQ0FBTixFQUEwQztBQUN6QztBQUNBLGFBQU8sWUFBUDtBQUNBLEtBVkEsQ0FVQzs7QUFDRjs7QUFFRCxZQUFJLEdBQUosQ0FBUTtBQUNQLElBQUEsTUFBTSxFQUFFLGNBREQ7QUFFUCxJQUFBLE1BQU0sRUFBRSxZQUZEO0FBR1AsSUFBQSxTQUFTLEVBQUUsQ0FISjtBQUlQLElBQUEsb0JBQW9CLEVBQUU7QUFKZixHQUFSLEVBTUUsSUFORixDQU9FLFVBQVMsUUFBVCxFQUFtQjtBQUFFLFdBQU8sUUFBUDtBQUFrQixHQVB6QyxFQVFFO0FBQVM7QUFBVztBQUFFLFdBQU8sSUFBUDtBQUFjLEdBUnRDLENBUXVDO0FBUnZDLElBVUUsSUFWRixDQVVRLFVBQVMsTUFBVCxFQUFpQjtBQUN4QjtBQUNDLFFBQUksRUFBRSxHQUFHLE1BQU0sSUFBSSxDQUFDLENBQUMsR0FBRixDQUFNLE1BQU0sQ0FBQyxLQUFiLEVBQW9CLFVBQVUsTUFBVixFQUFrQixHQUFsQixFQUF3QjtBQUFFLGFBQU8sR0FBUDtBQUFhLEtBQTNELENBQW5COztBQUVBLFFBQUssQ0FBQyxNQUFELElBQVcsQ0FBQyxNQUFNLENBQUMsS0FBUCxDQUFhLEVBQWIsQ0FBWixJQUFnQyxNQUFNLENBQUMsS0FBUCxDQUFhLEVBQWIsRUFBaUIsY0FBakQsSUFBbUUsQ0FBQyxNQUFNLENBQUMsS0FBUCxDQUFhLEVBQWIsRUFBaUIsTUFBMUYsRUFBbUc7QUFDbkc7QUFDQyxNQUFBLElBQUksQ0FBQyxjQUFMLEdBQXNCLElBQXRCO0FBQ0EsTUFBQSxJQUFJLENBQUMsb0JBQUwsR0FBNEIsQ0FBQyxNQUE3QjtBQUNBLE1BQUEsSUFBSSxDQUFDLFNBQUwsR0FBaUIsbUJBQU8sb0JBQXhCO0FBQ0EsS0FMRCxNQUtPO0FBQ04sTUFBQSxJQUFJLENBQUMsU0FBTCxHQUFpQixNQUFNLENBQUMsS0FBUCxDQUFhLEVBQWIsRUFBaUIsTUFBbEM7QUFDQTs7QUFFRCxJQUFBLElBQUksQ0FBQyxZQUFMLEdBQW9CLEVBQXBCO0FBQ0EsSUFBQSxDQUFDLENBQUMsSUFBRixDQUFPLElBQUksQ0FBQyxTQUFaLEVBQXVCLFVBQVMsUUFBVCxFQUFtQixRQUFuQixFQUE2QjtBQUNuRDtBQUNBLFVBQUssUUFBUSxDQUFDLE9BQVQsSUFBb0IsUUFBUSxDQUFDLE9BQVQsQ0FBaUIsTUFBMUMsRUFBbUQ7QUFDbEQsUUFBQSxRQUFRLENBQUMsT0FBVCxDQUFpQixPQUFqQixDQUF5QixVQUFTLEtBQVQsRUFBZTtBQUN2QyxVQUFBLElBQUksQ0FBQyxZQUFMLENBQWtCLEtBQWxCLElBQTJCLFFBQTNCO0FBQ0EsU0FGRDtBQUdBLE9BTmtELENBT25EOzs7QUFDQSxVQUFLLFFBQVEsQ0FBQyxXQUFULElBQXdCLGlCQUFpQixJQUFqQixDQUFzQixRQUFRLENBQUMsV0FBVCxDQUFxQixFQUEzQyxDQUE3QixFQUE4RTtBQUM3RSxZQUFJO0FBQ0gsY0FBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLEtBQUwsQ0FDakIsUUFBUSxDQUFDLFdBQVQsQ0FBcUIsRUFBckIsQ0FDRSxPQURGLENBQ1UsT0FEVixFQUNrQixHQURsQixFQUVFLE9BRkYsQ0FFVSxJQUZWLEVBRWdCLE1BRmhCLEVBR0UsT0FIRixDQUdVLElBSFYsRUFHZ0IsSUFIaEIsRUFJRSxPQUpGLENBSVUsT0FKVixFQUltQixHQUpuQixFQUtFLE9BTEYsQ0FLVSxNQUxWLEVBS2tCLEdBTGxCLENBRGlCLENBQWxCO0FBUUEsVUFBQSxJQUFJLENBQUMsU0FBTCxDQUFlLFFBQWYsRUFBeUIsYUFBekIsR0FBeUMsV0FBekM7QUFDQSxTQVZELENBVUUsT0FBTSxDQUFOLEVBQVM7QUFDVixVQUFBLE9BQU8sQ0FBQyxJQUFSLENBQWEsK0RBQ2QsUUFBUSxDQUFDLFdBQVQsQ0FBcUIsRUFEUCxHQUNZLHVDQURaLEdBQ3NELFFBRHRELEdBRWQsT0FGYyxHQUVKLElBQUksQ0FBQyxRQUFMLEdBQWdCLGVBQWhCLEVBRlQ7QUFHQTtBQUNELE9BeEJrRCxDQXlCbkQ7OztBQUNBLFVBQUssQ0FBQyxRQUFRLENBQUMsUUFBVCxJQUFxQixRQUFRLENBQUMsU0FBL0IsS0FBNkMsQ0FBQyxJQUFJLENBQUMsUUFBTCxDQUFjLFFBQWQsQ0FBbkQsRUFBNkU7QUFDN0U7QUFDQyxZQUFLLFFBQVEsQ0FBQyxPQUFULENBQWlCLE1BQXRCLEVBQStCO0FBQzlCLGNBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxVQUFMLENBQWdCLE1BQWhCLENBQXVCLFVBQUEsQ0FBQyxFQUFJO0FBQ3pDLGdCQUFJLE9BQU8sR0FBRyxRQUFRLENBQUMsT0FBVCxDQUFpQixRQUFqQixDQUEwQixDQUFDLENBQUMsSUFBNUIsQ0FBZDtBQUNBLGdCQUFJLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFqQjtBQUNBLG1CQUFPLE9BQU8sSUFBSSxDQUFDLE9BQW5CO0FBQ0EsV0FKYSxDQUFkOztBQUtBLGNBQUssT0FBTyxDQUFDLE1BQWIsRUFBc0I7QUFDdEI7QUFDQztBQUNBO0FBQ0QsU0FaMkUsQ0FhNUU7QUFDQTs7O0FBQ0EsUUFBQSxJQUFJLENBQUMsVUFBTCxDQUFnQixJQUFoQixDQUFxQjtBQUNwQixVQUFBLElBQUksRUFBQyxRQURlO0FBRXBCLFVBQUEsS0FBSyxFQUFFLFFBQVEsQ0FBQyxTQUFULElBQXNCLEVBRlQ7QUFHcEIsVUFBQSxVQUFVLEVBQUU7QUFIUSxTQUFyQjtBQUtBO0FBQ0QsS0EvQ0QsRUFkdUIsQ0ErRHZCOztBQUNBLFFBQUksY0FBYyxHQUFLLENBQUMsSUFBSSxDQUFDLGNBQU4sSUFBd0IsTUFBTSxDQUFDLEtBQVAsQ0FBYSxFQUFiLEVBQWlCLFVBQTNDLElBQ3JCLENBQUMsQ0FBQyxHQUFGLENBQU0sSUFBSSxDQUFDLFNBQVgsRUFBc0IsVUFBUyxJQUFULEVBQWUsR0FBZixFQUFtQjtBQUN4QyxhQUFPLEdBQVA7QUFDQSxLQUZELENBREE7QUFJQSxJQUFBLElBQUksQ0FBQyxvQkFBTCxHQUE0QixjQUFjLENBQUMsTUFBZixDQUFzQixVQUFTLFNBQVQsRUFBb0I7QUFDckUsYUFBUyxTQUFTLElBQUksU0FBUyxLQUFLLE9BQTNCLElBQXNDLFNBQVMsS0FBSyxZQUE3RDtBQUNBLEtBRjJCLEVBRzFCLEdBSDBCLENBR3RCLFVBQVMsU0FBVCxFQUFvQjtBQUN4QixVQUFJLFlBQVksR0FBRztBQUFDLFFBQUEsSUFBSSxFQUFFO0FBQVAsT0FBbkI7QUFDQSxVQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsZUFBTCxDQUFxQixLQUFyQixFQUE0QixTQUE1QixDQUFaOztBQUNBLFVBQUssS0FBTCxFQUFhO0FBQ1osUUFBQSxZQUFZLENBQUMsS0FBYixHQUFxQixLQUFLLEdBQUcsS0FBUixHQUFnQixTQUFoQixHQUE0QixJQUFqRDtBQUNBOztBQUNELGFBQU8sWUFBUDtBQUNBLEtBVjBCLENBQTVCOztBQVlBLFFBQUssSUFBSSxDQUFDLG9CQUFWLEVBQWlDO0FBQ2hDO0FBQ0EsYUFBTyxJQUFQO0FBQ0E7O0FBRUQsSUFBQSxLQUFLLENBQUMsS0FBTixDQUFZLFlBQVksR0FBRyxTQUEzQixFQUFzQztBQUNyQyxNQUFBLGNBQWMsRUFBRSxJQUFJLENBQUMsY0FEZ0I7QUFFckMsTUFBQSxTQUFTLEVBQUUsSUFBSSxDQUFDLFNBRnFCO0FBR3JDLE1BQUEsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLG9CQUhVO0FBSXJDLE1BQUEsWUFBWSxFQUFFLElBQUksQ0FBQztBQUprQixLQUF0QyxFQUtHLENBTEg7QUFPQSxXQUFPLElBQVA7QUFDQSxHQXZHRixFQXdHRSxJQXhHRixDQXlHRSxZQUFZLENBQUMsT0F6R2YsRUEwR0UsWUFBWSxDQUFDLE1BMUdmOztBQTZHQSxTQUFPLFlBQVA7QUFDQSxDQTlJRDs7QUFnSkEsUUFBUSxDQUFDLFNBQVQsQ0FBbUIsd0JBQW5CLEdBQThDLFlBQVc7QUFBQTs7QUFDeEQsTUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDLFFBQUYsRUFBYjs7QUFFQSxNQUFLLEtBQUssT0FBTCxJQUFnQixLQUFLLFdBQTFCLEVBQXdDO0FBQ3ZDLFdBQU8sTUFBTSxDQUFDLE9BQVAsRUFBUDtBQUNBOztBQUVELE1BQUksUUFBUSxHQUFHLEtBQUssUUFBTCxHQUFnQixXQUFoQixFQUFmO0FBRUEsTUFBSSxhQUFhLEdBQUcsS0FBSyxDQUFDLElBQU4sQ0FBVyxRQUFRLEdBQUMsVUFBcEIsQ0FBcEI7O0FBQ0EsTUFDQyxhQUFhLElBQ2IsYUFBYSxDQUFDLEtBRGQsSUFFQSxhQUFhLENBQUMsU0FGZCxJQUdBLGFBQWEsQ0FBQyxLQUFkLENBQW9CLE9BQXBCLElBQTZCLElBSDdCLElBSUEsYUFBYSxDQUFDLEtBQWQsQ0FBb0IsV0FBcEIsSUFBaUMsSUFMbEMsRUFNRTtBQUNELFNBQUssT0FBTCxHQUFlLGFBQWEsQ0FBQyxLQUFkLENBQW9CLE9BQW5DO0FBQ0EsU0FBSyxXQUFMLEdBQW1CLGFBQWEsQ0FBQyxLQUFkLENBQW9CLFdBQXZDO0FBQ0EsSUFBQSxNQUFNLENBQUMsT0FBUDs7QUFDQSxRQUFLLENBQUMsdUJBQVksYUFBYSxDQUFDLFNBQTFCLENBQU4sRUFBNkM7QUFDNUM7QUFDQSxhQUFPLE1BQVA7QUFDQSxLQVBBLENBT0M7O0FBQ0Y7O0FBRUQsTUFBSSxlQUFlLEdBQUcsRUFBdEI7O0FBQ0EscUJBQU8sY0FBUCxDQUFzQixlQUF0QixDQUFzQyxPQUF0QyxDQUE4QyxVQUFTLFNBQVQsRUFBb0IsS0FBcEIsRUFBMkI7QUFDeEUsSUFBQSxlQUFlLElBQUksT0FBTyxRQUFQLEdBQWtCLFNBQWxCLEdBQThCLFNBQTlCLEdBQTBDLGNBQTFDLElBQ2xCLG1CQUFPLGNBQVAsQ0FBc0IsbUJBQXRCLENBQTBDLEtBQTFDLEtBQW9ELEVBRGxDLElBQ3dDLE1BRDNEO0FBRUEsR0FIRDs7QUFLQSxTQUFPLFVBQUksR0FBSixDQUFRO0FBQ2QsSUFBQSxNQUFNLEVBQUUsT0FETTtBQUVkLElBQUEsS0FBSyxFQUFFLGNBRk87QUFHZCxJQUFBLElBQUksRUFBRSxlQUhRO0FBSWQsSUFBQSxJQUFJLEVBQUU7QUFKUSxHQUFSLEVBTUwsSUFOSyxDQU1BLFVBQUMsTUFBRCxFQUFZO0FBQ2pCLFFBQUksa0JBQWtCLEdBQUcsS0FBSSxDQUFDLGNBQUwsR0FBc0IsS0FBSSxDQUFDLGNBQUwsQ0FBb0IsV0FBcEIsRUFBdEIsR0FBMEQsUUFBbkY7QUFDQSxRQUFJLFFBQVEsR0FBRyxNQUFNLENBQUMsS0FBUCxDQUFhLGNBQWIsQ0FBNEIsR0FBNUIsQ0FBZjs7QUFDQSxRQUFJLGVBQWUsR0FBRyxtQkFBTyxjQUFQLENBQXNCLGVBQXRCLENBQXNDLE1BQXRDLENBQTZDLFVBQVMsRUFBVCxFQUFhO0FBQy9FLGFBQU8sUUFBUSxDQUFDLE9BQVQsQ0FBaUIsRUFBRSxHQUFDLFFBQXBCLE1BQWtDLENBQUMsQ0FBMUM7QUFDQSxLQUZxQixDQUF0Qjs7QUFHQSxRQUFJLGNBQWMsR0FBSyxrQkFBa0IsS0FBSyxxQkFBekIsR0FDbEIsQ0FBQyxNQUFELENBRGtCLEdBRWxCLG1CQUFPLGNBQVAsQ0FBc0IsT0FGekI7QUFHQSxRQUFJLGFBQWEsR0FBRyxtQkFBTyxhQUFQLENBQXFCLGtCQUFyQixLQUE0QyxFQUFoRTtBQUNBLElBQUEsS0FBSSxDQUFDLE9BQUwsR0FBZSxHQUFHLE1BQUgsQ0FDZCxhQURjLEVBRWQsY0FGYyxFQUdkLGVBSGMsQ0FBZjtBQU1BLElBQUEsS0FBSSxDQUFDLFdBQUwsR0FBbUIsbUJBQU8sY0FBUCxDQUFzQixtQkFBdEIsQ0FBMEMsTUFBMUMsQ0FBaUQsVUFBUyxHQUFULEVBQWM7QUFDakYsYUFBTyxRQUFRLENBQUMsT0FBVCxDQUFpQixHQUFHLEdBQUMsYUFBckIsTUFBd0MsQ0FBQyxDQUFoRDtBQUNBLEtBRmtCLENBQW5CO0FBR0EsSUFBQSxLQUFLLENBQUMsS0FBTixDQUFZLFFBQVEsR0FBQyxVQUFyQixFQUNDO0FBQ0MsTUFBQSxPQUFPLEVBQUUsS0FBSSxDQUFDLE9BRGY7QUFFQyxNQUFBLFdBQVcsRUFBRSxLQUFJLENBQUM7QUFGbkIsS0FERCxFQUtDLENBTEQ7QUFPQSxXQUFPLElBQVA7QUFDQSxHQWpDSyxDQUFQO0FBa0NBLENBbEVEOzs7Ozs7Ozs7O0FDMVpBLElBQUksZ0JBQWdCLEdBQUcsU0FBUyxnQkFBVCxDQUEyQixNQUEzQixFQUFvQztBQUMxRCxFQUFBLE1BQU0sR0FBRyxNQUFNLElBQUksRUFBbkIsQ0FEMEQsQ0FHMUQ7O0FBQ0EsRUFBQSxnQkFBZ0IsQ0FBQyxNQUFqQixDQUF3QixJQUF4QixDQUE4QixJQUE5QixFQUFvQyxNQUFwQztBQUNBLEVBQUEsRUFBRSxDQUFDLEVBQUgsQ0FBTSxLQUFOLENBQVksWUFBWixDQUF5QixJQUF6QixDQUErQixJQUEvQixFQUFxQztBQUNwQyxJQUFBLE1BQU0sRUFBRSxLQUFLO0FBRHVCLEdBQXJDO0FBSUEsT0FBSyxRQUFMLENBQWMsR0FBZCxDQUFrQjtBQUFDLGVBQVU7QUFBWCxHQUFsQjtBQUVBLE9BQUssU0FBTCxDQUFnQjtBQUNmLElBQUEsTUFBTSxFQUFFO0FBRE8sR0FBaEI7QUFJQSxPQUFLLE9BQUwsQ0FBYyxJQUFkLEVBQW9CO0FBQ25CLElBQUEsWUFBWSxFQUFFO0FBREssR0FBcEI7QUFHQSxDQWxCRDs7QUFvQkEsRUFBRSxDQUFDLFlBQUgsQ0FBaUIsZ0JBQWpCLEVBQW1DLEVBQUUsQ0FBQyxFQUFILENBQU0sTUFBekM7QUFDQSxFQUFFLENBQUMsVUFBSCxDQUFlLGdCQUFmLEVBQWlDLEVBQUUsQ0FBQyxFQUFILENBQU0sS0FBTixDQUFZLFlBQTdDO0FBQ0E7Ozs7Ozs7OztBQVNBLGdCQUFnQixDQUFDLFNBQWpCLENBQTJCLGNBQTNCLEdBQTRDLFVBQVcsTUFBWCxFQUFvQjtBQUMvRCxPQUFLLFdBQUwsQ0FBaUIsQ0FBQyxNQUFELENBQWpCO0FBQ0EsQ0FGRDs7ZUFNZSxnQjs7Ozs7Ozs7Ozs7QUNyQ2Y7O0FBQ0E7O0FBQ0E7Ozs7QUFFQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF3QkEsU0FBUyxZQUFULENBQXVCLFFBQXZCLEVBQWlDLE1BQWpDLEVBQTBDO0FBQUE7O0FBQ3pDO0FBQ0EsRUFBQSxNQUFNLEdBQUcsTUFBTSxJQUFJLEVBQW5CLENBRnlDLENBR3pDOztBQUNBLEVBQUEsWUFBWSxTQUFaLENBQW1CLElBQW5CLENBQXlCLElBQXpCLEVBQStCLE1BQS9CO0FBRUEsT0FBSyxRQUFMLEdBQWdCLFFBQWhCO0FBRUE7O0FBRUEsT0FBSyxZQUFMLEdBQW9CLElBQUksRUFBRSxDQUFDLEVBQUgsQ0FBTSxZQUFWLENBQXdCO0FBQzNDLElBQUEsSUFBSSxFQUFFLE9BRHFDO0FBRTNDLElBQUEsS0FBSyxFQUFFLGVBRm9DO0FBRzNDLElBQUEsS0FBSyxFQUFFLGVBSG9DO0FBSTNDLElBQUEsS0FBSyxFQUFFLGFBSm9DO0FBSzNDLElBQUEsUUFBUSxFQUFFLENBQUMsQ0FBQyw0QkFBRDtBQUxnQyxHQUF4QixDQUFwQjtBQU9BLE9BQUssV0FBTCxHQUFtQixJQUFJLEVBQUUsQ0FBQyxFQUFILENBQU0sWUFBVixDQUF3QjtBQUMxQyxJQUFBLElBQUksRUFBRSxRQURvQztBQUUxQyxJQUFBLEtBQUssRUFBRSxrQkFGbUM7QUFHMUMsSUFBQSxLQUFLLEVBQUUsa0JBSG1DO0FBSTFDLElBQUEsS0FBSyxFQUFFLGFBSm1DO0FBSzFDLElBQUEsUUFBUSxFQUFFLENBQUMsQ0FBQyw0QkFBRDtBQUwrQixHQUF4QixDQUFuQjtBQU9BLE9BQUssWUFBTCxHQUFvQixJQUFJLEVBQUUsQ0FBQyxFQUFILENBQU0sWUFBVixDQUF3QjtBQUMzQyxJQUFBLElBQUksRUFBRSxpQkFEcUM7QUFFM0MsSUFBQSxLQUFLLEVBQUUsaUJBRm9DO0FBRzNDLElBQUEsS0FBSyxFQUFFLGlCQUhvQztBQUkzQyxJQUFBLFFBQVEsRUFBRSxDQUFDLENBQUMsNEJBQUQ7QUFKZ0MsR0FBeEIsQ0FBcEI7QUFNQSxPQUFLLFlBQUwsQ0FBa0IsUUFBbEIsQ0FBMkIsSUFBM0IsQ0FBZ0MsR0FBaEMsRUFBcUMsR0FBckMsQ0FBeUMsT0FBekMsRUFBaUQsTUFBakQ7QUFDQSxPQUFLLFdBQUwsQ0FBaUIsUUFBakIsQ0FBMEIsSUFBMUIsQ0FBK0IsR0FBL0IsRUFBb0MsR0FBcEMsQ0FBd0MsT0FBeEMsRUFBZ0QsTUFBaEQ7QUFDQSxPQUFLLFlBQUwsQ0FBa0IsUUFBbEIsQ0FBMkIsSUFBM0IsQ0FBZ0MsR0FBaEMsRUFBcUMsR0FBckMsQ0FBeUMsT0FBekMsRUFBaUQsTUFBakQ7QUFFQSxPQUFLLGlCQUFMLEdBQXlCLElBQUksRUFBRSxDQUFDLEVBQUgsQ0FBTSxpQkFBVixDQUE2QjtBQUNyRCxJQUFBLEtBQUssRUFBRSxRQUFRLENBQUMsY0FBVCxHQUNKLENBQUUsS0FBSyxZQUFQLEVBQ0QsS0FBSyxXQURKLEVBRUQsS0FBSyxZQUZKLENBREksR0FJSixDQUFFLEtBQUssWUFBUCxFQUNELEtBQUssV0FESixDQUxrRDtBQU9yRCxJQUFBLFFBQVEsRUFBRSxDQUFDLENBQUMsNEJBQUQ7QUFQMEMsR0FBN0IsQ0FBekI7QUFVQSxPQUFLLG9CQUFMLEdBQTRCLElBQUksRUFBRSxDQUFDLEVBQUgsQ0FBTSxpQkFBVixDQUE2QjtBQUN4RCxJQUFBLEtBQUssRUFBRSxPQUFPLEtBQUssUUFBTCxDQUFjLFFBQWQsR0FBeUIsV0FBekIsRUFBUCxHQUFnRCxJQURDO0FBRXhELElBQUEsUUFBUSxFQUFFLENBQUMsQ0FBQyxnRkFBRCxDQUY2QztBQUd4RCxJQUFBLFNBQVMsRUFBQyxNQUg4QztBQUl4RCxJQUFBLE1BQU0sRUFBQyxLQUppRDtBQUt4RCxJQUFBLEtBQUssRUFBRTtBQUNOLE1BQUEsUUFBUSxFQUFFLEtBQUssaUJBQUwsQ0FBdUIsUUFEM0I7QUFFTixNQUFBLEtBQUssRUFBRSxHQUZEO0FBR04sTUFBQSxNQUFNLEVBQUUsS0FIRjtBQUlOLE1BQUEsS0FBSyxFQUFFLGFBSkQ7QUFLTixNQUFBLE1BQU0sRUFBRTtBQUxGO0FBTGlELEdBQTdCLENBQTVCO0FBYUEsT0FBSyxvQkFBTCxDQUEwQixRQUExQixDQUNFLFFBREYsQ0FDVyxHQURYLEVBQ2dCLEtBRGhCLEdBQ3dCLEdBRHhCLENBQzRCO0FBQUMsaUJBQVk7QUFBYixHQUQ1QixFQUVFLElBRkYsQ0FFTywrQkFGUCxFQUV3QyxHQUZ4QyxDQUU0QztBQUFDLG1CQUFjO0FBQWYsR0FGNUMsRUF6RHlDLENBNkR6Qzs7QUFDQSxPQUFLLGFBQUwsR0FBcUIsSUFBSSxFQUFFLENBQUMsRUFBSCxDQUFNLGNBQVYsQ0FBMEI7QUFDOUMsSUFBQSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBSCxDQUFNLFdBQVYsQ0FBc0IseUNBQXRCLENBRHVDO0FBRTlDLElBQUEsSUFBSSxFQUFFO0FBQUU7QUFDUCxNQUFBLEtBQUssRUFBRSxDQUNOLElBQUksRUFBRSxDQUFDLEVBQUgsQ0FBTSxnQkFBVixDQUE0QjtBQUMzQixRQUFBLElBQUksRUFBRSxFQURxQjtBQUUzQixRQUFBLEtBQUssRUFBRTtBQUZvQixPQUE1QixDQURNLEVBS04sSUFBSSxFQUFFLENBQUMsRUFBSCxDQUFNLGdCQUFWLENBQTRCO0FBQzNCLFFBQUEsSUFBSSxFQUFFLEdBRHFCO0FBRTNCLFFBQUEsS0FBSyxFQUFFO0FBRm9CLE9BQTVCLENBTE0sRUFTTixJQUFJLEVBQUUsQ0FBQyxFQUFILENBQU0sZ0JBQVYsQ0FBNEI7QUFDM0IsUUFBQSxJQUFJLEVBQUUsR0FEcUI7QUFFM0IsUUFBQSxLQUFLLEVBQUU7QUFGb0IsT0FBNUIsQ0FUTSxFQWFOLElBQUksRUFBRSxDQUFDLEVBQUgsQ0FBTSxnQkFBVixDQUE0QjtBQUMzQixRQUFBLElBQUksRUFBRSxPQURxQjtBQUUzQixRQUFBLEtBQUssRUFBRTtBQUZvQixPQUE1QixDQWJNO0FBREYsS0FGd0M7QUFzQjlDLElBQUEsUUFBUSxFQUFFLENBQUMsQ0FBQywrQ0FBRCxDQXRCbUM7QUF1QjlDLElBQUEsUUFBUSxFQUFFLEtBQUs7QUF2QitCLEdBQTFCLENBQXJCO0FBeUJBLE9BQUssa0JBQUwsR0FBMEIsSUFBSSxFQUFFLENBQUMsRUFBSCxDQUFNLGNBQVYsQ0FBMEI7QUFDbkQsSUFBQSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBSCxDQUFNLFdBQVYsQ0FBc0IsOENBQXRCLENBRDRDO0FBRW5ELElBQUEsSUFBSSxFQUFFO0FBQUU7QUFDUCxNQUFBLEtBQUssRUFBRSxDQUNOLElBQUksRUFBRSxDQUFDLEVBQUgsQ0FBTSxnQkFBVixDQUE0QjtBQUMzQixRQUFBLElBQUksRUFBRSxFQURxQjtBQUUzQixRQUFBLEtBQUssRUFBRTtBQUZvQixPQUE1QixDQURNLEVBS04sSUFBSSxFQUFFLENBQUMsRUFBSCxDQUFNLGdCQUFWLENBQTRCO0FBQzNCLFFBQUEsSUFBSSxFQUFFLEtBRHFCO0FBRTNCLFFBQUEsS0FBSyxFQUFFO0FBRm9CLE9BQTVCLENBTE0sRUFTTixJQUFJLEVBQUUsQ0FBQyxFQUFILENBQU0sZ0JBQVYsQ0FBNEI7QUFDM0IsUUFBQSxJQUFJLEVBQUUsTUFEcUI7QUFFM0IsUUFBQSxLQUFLLEVBQUU7QUFGb0IsT0FBNUIsQ0FUTSxFQWFOLElBQUksRUFBRSxDQUFDLEVBQUgsQ0FBTSxnQkFBVixDQUE0QjtBQUMzQixRQUFBLElBQUksRUFBRSxLQURxQjtBQUUzQixRQUFBLEtBQUssRUFBRTtBQUZvQixPQUE1QixDQWJNO0FBREYsS0FGNkM7QUFzQm5ELElBQUEsUUFBUSxFQUFFLENBQUMsQ0FBQywrQ0FBRCxDQXRCd0M7QUF1Qm5ELElBQUEsUUFBUSxFQUFFLEtBQUs7QUF2Qm9DLEdBQTFCLENBQTFCO0FBeUJBLE9BQUssV0FBTCxHQUFtQixJQUFJLEVBQUUsQ0FBQyxFQUFILENBQU0sZ0JBQVYsQ0FBNEI7QUFDOUMsSUFBQSxLQUFLLEVBQUUsQ0FDTixLQUFLLG9CQURDLEVBRU4sS0FBSyxhQUZDLEVBR04sS0FBSyxrQkFIQztBQUR1QyxHQUE1QixDQUFuQjtBQVFBOztBQUVBLE1BQUksZ0JBQWdCLEdBQUcsS0FBSyxRQUFMLENBQWMsVUFBZCxDQUNyQixNQURxQixDQUNkLFVBQUEsS0FBSztBQUFBLFdBQUksS0FBSyxDQUFDLElBQU4sS0FBZSxPQUFmLElBQTBCLEtBQUssQ0FBQyxJQUFOLEtBQWUsWUFBN0M7QUFBQSxHQURTLEVBRXJCLEdBRnFCLENBRWpCLFVBQUEsS0FBSztBQUFBLFdBQUksSUFBSSwyQkFBSixDQUFvQixLQUFwQixFQUEyQixLQUFJLENBQUMsUUFBTCxDQUFjLFNBQWQsQ0FBd0IsS0FBSyxDQUFDLElBQTlCLENBQTNCLENBQUo7QUFBQSxHQUZZLENBQXZCO0FBSUEsT0FBSyxhQUFMLEdBQXFCLElBQUksK0JBQUosQ0FBeUI7QUFDN0MsSUFBQSxLQUFLLEVBQUUsZ0JBRHNDO0FBRTdDLElBQUEsWUFBWSxFQUFFO0FBRitCLEdBQXpCLENBQXJCO0FBS0E7O0FBRUEsT0FBSyxxQkFBTCxHQUE2QixJQUFJLDJDQUFKLENBQW9DO0FBQ2hFLElBQUEsV0FBVyxFQUFFLEtBQUssUUFBTCxDQUFjLG9CQURxQztBQUVoRSxJQUFBLFdBQVcsRUFBRSxnQkFGbUQ7QUFHaEUsSUFBQSxRQUFRLEVBQUUsQ0FBQyxDQUFDLDhDQUFELENBSHFEO0FBSWhFLElBQUEsUUFBUSxFQUFFLFVBQVMsR0FBVCxFQUFjO0FBQUEsa0NBQ1EsS0FBSyxvQkFBTCxDQUEwQixHQUExQixDQURSO0FBQUEsVUFDbEIsU0FEa0IseUJBQ2xCLFNBRGtCO0FBQUEsVUFDUCxJQURPLHlCQUNQLElBRE87QUFBQSxVQUNELEtBREMseUJBQ0QsS0FEQzs7QUFFdkIsYUFBUSxDQUFDLElBQUQsSUFBUyxDQUFDLEtBQVgsR0FBb0IsSUFBcEIsR0FBMkIsU0FBbEM7QUFDQSxLQUhTLENBR1IsSUFIUSxDQUdILElBSEc7QUFKc0QsR0FBcEMsQ0FBN0I7QUFTQSxPQUFLLHNCQUFMLEdBQThCLElBQUksMkNBQUosQ0FBb0M7QUFDakUsSUFBQSxXQUFXLEVBQUUsaUJBRG9EO0FBRWpFLElBQUEsUUFBUSxFQUFFLENBQUMsQ0FBQyw4Q0FBRCxDQUZzRDtBQUdqRSxJQUFBLFFBQVEsRUFBRSxVQUFTLEdBQVQsRUFBYztBQUFBLG1DQUNTLEtBQUssb0JBQUwsQ0FBMEIsSUFBMUIsRUFBZ0MsR0FBaEMsQ0FEVDtBQUFBLFVBQ2xCLFVBRGtCLDBCQUNsQixVQURrQjtBQUFBLFVBQ04sSUFETSwwQkFDTixJQURNO0FBQUEsVUFDQSxLQURBLDBCQUNBLEtBREE7O0FBRXZCLGFBQVEsQ0FBQyxJQUFELElBQVMsQ0FBQyxLQUFYLEdBQW9CLElBQXBCLEdBQTJCLFVBQWxDO0FBQ0EsS0FIUyxDQUdSLElBSFEsQ0FHSCxJQUhHO0FBSHVELEdBQXBDLENBQTlCO0FBUUEsT0FBSyxrQkFBTCxHQUEwQixJQUFJLEVBQUUsQ0FBQyxFQUFILENBQU0sWUFBVixDQUF1QjtBQUNoRCxJQUFBLEtBQUssRUFBRSxLQUR5QztBQUVoRCxJQUFBLElBQUksRUFBRSxLQUYwQztBQUdoRCxJQUFBLEtBQUssRUFBRTtBQUh5QyxHQUF2QixFQUl2QixXQUp1QixDQUlYLElBSlcsQ0FBMUI7QUFLQSxPQUFLLG9CQUFMLEdBQTRCLElBQUksRUFBRSxDQUFDLEVBQUgsQ0FBTSxnQkFBVixDQUE0QjtBQUN2RCxJQUFBLEtBQUssRUFBRSxDQUNOLEtBQUsscUJBREMsRUFFTixJQUFJLEVBQUUsQ0FBQyxFQUFILENBQU0sV0FBVixDQUFzQjtBQUFDLE1BQUEsS0FBSyxFQUFDO0FBQVAsS0FBdEIsQ0FGTSxFQUdOLEtBQUssc0JBSEMsRUFJTixLQUFLLGtCQUpDO0FBRGdELEdBQTVCLENBQTVCLENBM0p5QyxDQW1LekM7O0FBQ0EsT0FBSyxvQkFBTCxDQUEwQixVQUExQixHQUF1QztBQUFBLFdBQU0sS0FBTjtBQUFBLEdBQXZDOztBQUNBLE9BQUssb0JBQUwsQ0FBMEIsVUFBMUIsR0FBdUM7QUFBQSxXQUFNLEtBQU47QUFBQSxHQUF2Qzs7QUFDQSxPQUFLLG9CQUFMLENBQTBCLGtCQUExQixHQUErQztBQUFBLFdBQU0sSUFBTjtBQUFBLEdBQS9DOztBQUVBLE9BQUssa0JBQUwsR0FBMEIsSUFBSSxFQUFFLENBQUMsRUFBSCxDQUFNLFdBQVYsQ0FBc0IsS0FBSyxvQkFBM0IsRUFBaUQ7QUFDMUUsSUFBQSxLQUFLLEVBQUUsZ0JBRG1FO0FBRTFFLElBQUEsS0FBSyxFQUFFO0FBRm1FLEdBQWpELEVBR3ZCLE1BSHVCLENBR2hCLEtBSGdCLENBQTFCLENBeEt5QyxDQTRLekM7O0FBQ0EsT0FBSyxrQkFBTCxDQUF3QixRQUF4QixDQUFpQyxJQUFqQyxDQUFzQyw2QkFBdEMsRUFBcUUsR0FBckUsQ0FBeUU7QUFDeEUsYUFBUyxNQUQrRDtBQUV4RSxtQkFBZTtBQUZ5RCxHQUF6RTtBQUtBO0FBRUE7O0FBQ0EsT0FBSyxRQUFMLENBQWMsTUFBZCxDQUNDLEtBQUssV0FBTCxDQUFpQixRQURsQixFQUVDLEtBQUssYUFBTCxDQUFtQixRQUZwQixFQUdDLEtBQUssa0JBQUwsQ0FBd0IsUUFIekIsRUFJQyxDQUFDLENBQUMsTUFBRCxDQUpGO0FBT0E7O0FBRUEsT0FBSyxhQUFMLENBQW1CLE9BQW5CLENBQTRCLElBQTVCLEVBQWtDO0FBQUUsZ0NBQTRCO0FBQTlCLEdBQWxDO0FBQ0EsT0FBSyxrQkFBTCxDQUF3QixPQUF4QixDQUFnQyxJQUFoQyxFQUFzQztBQUFFLGFBQVM7QUFBWCxHQUF0QztBQUNBLE9BQUsscUJBQUwsQ0FBMkIsT0FBM0IsQ0FBbUMsSUFBbkMsRUFBeUM7QUFBRSxjQUFVO0FBQVosR0FBekM7QUFDQSxPQUFLLHNCQUFMLENBQTRCLE9BQTVCLENBQW9DLElBQXBDLEVBQTBDO0FBQUUsY0FBVTtBQUFaLEdBQTFDO0FBQ0EsT0FBSyxZQUFMLENBQWtCLE9BQWxCLENBQTBCLElBQTFCLEVBQWdDO0FBQUMsYUFBUztBQUFWLEdBQWhDO0FBQ0E7O0FBQ0QsRUFBRSxDQUFDLFlBQUgsQ0FBaUIsWUFBakIsRUFBK0IsRUFBRSxDQUFDLEVBQUgsQ0FBTSxNQUFyQzs7QUFFQSxZQUFZLENBQUMsU0FBYixDQUF1QixzQkFBdkIsR0FBZ0QsWUFBVztBQUMxRCxPQUFLLGtCQUFMLENBQXdCLE1BQXhCLENBQStCLElBQS9CO0FBQ0EsQ0FGRDs7QUFJQSxZQUFZLENBQUMsU0FBYixDQUF1QixvQkFBdkIsR0FBOEMsVUFBUyxZQUFULEVBQXVCLGFBQXZCLEVBQXNDO0FBQ25GLE1BQUksSUFBSSxHQUFHLFlBQVksSUFBSSxZQUFZLENBQUMsSUFBYixFQUFoQixJQUF1QyxLQUFLLHFCQUFMLENBQTJCLFFBQTNCLEdBQXNDLElBQXRDLEVBQWxEO0FBQ0EsTUFBSSxvQkFBb0IsR0FBRyxJQUFJLEtBQUssT0FBVCxJQUMxQixJQUFJLEtBQUssWUFEaUIsSUFFMUIsS0FBSyxhQUFMLENBQW1CLEtBQW5CLENBQXlCLElBQXpCLENBQThCLFVBQUEsV0FBVztBQUFBLFdBQUksV0FBVyxDQUFDLFNBQVosSUFBeUIsV0FBVyxDQUFDLFNBQVosQ0FBc0IsSUFBdEIsS0FBK0IsSUFBNUQ7QUFBQSxHQUF6QyxDQUZEO0FBR0EsTUFBSSxLQUFLLEdBQUcsYUFBYSxJQUFJLGFBQWEsQ0FBQyxJQUFkLEVBQWpCLElBQXlDLEtBQUssc0JBQUwsQ0FBNEIsUUFBNUIsR0FBdUMsSUFBdkMsRUFBckQ7QUFDQSxNQUFJLFNBQVMsR0FBRyxJQUFJLElBQUksS0FBSyxRQUFMLENBQWMsU0FBZCxDQUF3QixJQUF4QixDQUFSLElBQXlDLEtBQUssUUFBTCxDQUFjLFNBQWQsQ0FBd0IsSUFBeEIsRUFBOEIsU0FBdkUsSUFBb0YsSUFBcEc7QUFDQSxTQUFPO0FBQ04sSUFBQSxTQUFTLEVBQUUsQ0FBQyxFQUFFLElBQUksSUFBSSxDQUFDLG9CQUFYLENBRE47QUFFTixJQUFBLFVBQVUsRUFBRSxDQUFDLEVBQUUsS0FBSyxJQUFJLFNBQVgsQ0FGUDtBQUdOLElBQUEsV0FBVyxFQUFFLENBQUMsRUFBRSxDQUFDLEtBQUQsSUFBVSxTQUFaLENBSFI7QUFJTixJQUFBLGlCQUFpQixFQUFFLENBQUMsRUFBRSxJQUFJLElBQUksb0JBQVYsQ0FKZDtBQUtOLElBQUEsSUFBSSxFQUFKLElBTE07QUFNTixJQUFBLEtBQUssRUFBTCxLQU5NO0FBT04sSUFBQSxTQUFTLEVBQVQ7QUFQTSxHQUFQO0FBU0EsQ0FoQkQ7O0FBa0JBLFlBQVksQ0FBQyxTQUFiLENBQXVCLHdCQUF2QixHQUFrRCxZQUFXO0FBQUEsK0JBQ3FCLEtBQUssb0JBQUwsRUFEckI7QUFBQSxNQUN0RCxTQURzRCwwQkFDdEQsU0FEc0Q7QUFBQSxNQUMzQyxVQUQyQywwQkFDM0MsVUFEMkM7QUFBQSxNQUMvQixXQUQrQiwwQkFDL0IsV0FEK0I7QUFBQSxNQUNsQixpQkFEa0IsMEJBQ2xCLGlCQURrQjtBQUFBLE1BQ0MsSUFERCwwQkFDQyxJQUREO0FBQUEsTUFDTyxTQURQLDBCQUNPLFNBRFAsRUFFNUQ7OztBQUNBLE9BQUssc0JBQUwsQ0FBNEIsTUFBNUIsQ0FBbUMsSUFBbkMsQ0FBeUMsYUFBekMsRUFBeUQsU0FBUyxJQUFJLEVBQXRFLEVBSDRELENBSTVEOztBQUNBLE1BQUksYUFBYSxHQUFHLEtBQUssUUFBTCxDQUFjLFNBQWQsQ0FBd0IsSUFBeEIsS0FDbkIsS0FBSyxRQUFMLENBQWMsU0FBZCxDQUF3QixJQUF4QixFQUE4QixhQURYLElBRW5CLEtBQUssUUFBTCxDQUFjLFNBQWQsQ0FBd0IsSUFBeEIsRUFBOEIsYUFBOUIsQ0FBNEMsR0FBNUMsQ0FBZ0QsVUFBQSxHQUFHLEVBQUk7QUFBQyxXQUFPO0FBQUMsTUFBQSxJQUFJLEVBQUUsR0FBUDtBQUFZLE1BQUEsS0FBSyxFQUFDO0FBQWxCLEtBQVA7QUFBZ0MsR0FBeEYsQ0FGRDtBQUdBLE9BQUssc0JBQUwsQ0FBNEIsY0FBNUIsQ0FBMkMsYUFBYSxJQUFJLEVBQTVELEVBUjRELENBUzVEOztBQUNBLE9BQUssa0JBQUwsQ0FBd0IsV0FBeEIsQ0FBb0MsQ0FBQyxTQUFELElBQWMsQ0FBQyxVQUFuRCxFQVY0RCxDQVc1RDs7QUFDQSxPQUFLLGtCQUFMLENBQXdCLFVBQXhCLENBQW9DLFNBQVMsSUFBSSxXQUFiLEdBQTJCLENBQUMsb0NBQUQsQ0FBM0IsR0FBb0UsRUFBeEcsRUFaNEQsQ0FhNUQ7O0FBQ0EsT0FBSyxrQkFBTCxDQUF3QixTQUF4QixDQUFtQyxpQkFBaUIsR0FBRyxDQUFDLDhCQUFELENBQUgsR0FBc0MsRUFBMUY7QUFDQSxDQWZEOztBQWlCQSxZQUFZLENBQUMsU0FBYixDQUF1Qix5QkFBdkIsR0FBbUQsWUFBVztBQUFBLCtCQUNoQixLQUFLLG9CQUFMLEVBRGdCO0FBQUEsTUFDdkQsU0FEdUQsMEJBQ3ZELFNBRHVEO0FBQUEsTUFDNUMsVUFENEMsMEJBQzVDLFVBRDRDO0FBQUEsTUFDaEMsV0FEZ0MsMEJBQ2hDLFdBRGdDOztBQUU3RCxPQUFLLGtCQUFMLENBQXdCLFdBQXhCLENBQW9DLENBQUMsU0FBRCxJQUFjLENBQUMsVUFBbkQ7QUFDQSxPQUFLLGtCQUFMLENBQXdCLFVBQXhCLENBQW9DLFNBQVMsSUFBSSxXQUFiLEdBQTJCLENBQUMsb0NBQUQsQ0FBM0IsR0FBb0UsRUFBeEc7QUFDQSxDQUpEOztBQU1BLFlBQVksQ0FBQyxTQUFiLENBQXVCLGNBQXZCLEdBQXdDLFlBQVc7QUFBQSwrQkFDTyxLQUFLLG9CQUFMLEVBRFA7QUFBQSxNQUM1QyxTQUQ0QywwQkFDNUMsU0FENEM7QUFBQSxNQUNqQyxVQURpQywwQkFDakMsVUFEaUM7QUFBQSxNQUNyQixJQURxQiwwQkFDckIsSUFEcUI7QUFBQSxNQUNmLEtBRGUsMEJBQ2YsS0FEZTtBQUFBLE1BQ1IsU0FEUSwwQkFDUixTQURROztBQUVsRCxNQUFJLENBQUMsU0FBRCxJQUFjLENBQUMsVUFBbkIsRUFBK0I7QUFDOUI7QUFDQTtBQUNBOztBQUNELE1BQUksWUFBWSxHQUFHLElBQUksMkJBQUosQ0FDbEI7QUFDQyxZQUFRLElBRFQ7QUFFQyxhQUFTLEtBQUssSUFBSTtBQUZuQixHQURrQixFQUtsQixLQUFLLFFBQUwsQ0FBYyxTQUFkLENBQXdCLElBQXhCLENBTGtCLENBQW5CO0FBT0EsT0FBSyxhQUFMLENBQW1CLFFBQW5CLENBQTRCLENBQUMsWUFBRCxDQUE1QjtBQUNBLE9BQUsscUJBQUwsQ0FBMkIsUUFBM0IsQ0FBb0MsRUFBcEM7QUFDQSxPQUFLLHNCQUFMLENBQTRCLFFBQTVCLENBQXFDLEVBQXJDO0FBQ0EsT0FBSyxxQkFBTCxDQUEyQixLQUEzQjtBQUNBLENBakJEOztBQW1CQSxZQUFZLENBQUMsU0FBYixDQUF1QixtQkFBdkIsR0FBNkMsWUFBVztBQUN2RCxPQUFLLElBQUwsQ0FBVSxRQUFWO0FBQ0EsQ0FGRDs7ZUFJZSxZOzs7Ozs7Ozs7OztBQ3RTZjs7Ozs7QUFLQSxJQUFJLG1CQUFtQixHQUFHLFNBQVMsbUJBQVQsQ0FBOEIsTUFBOUIsRUFBdUM7QUFDaEUsRUFBQSxNQUFNLEdBQUcsTUFBTSxJQUFJLEVBQW5CLENBRGdFLENBR2hFOztBQUNBLEVBQUEsbUJBQW1CLENBQUMsTUFBcEIsQ0FBMkIsSUFBM0IsQ0FBaUMsSUFBakMsRUFBdUMsTUFBdkM7QUFDQSxFQUFBLEVBQUUsQ0FBQyxFQUFILENBQU0sS0FBTixDQUFZLFlBQVosQ0FBeUIsSUFBekIsQ0FBK0IsSUFBL0IsRUFBcUM7QUFDcEMsSUFBQSxNQUFNLEVBQUUsS0FBSztBQUR1QixHQUFyQztBQUdBLE9BQUssUUFBTCxDQUFlLE1BQU0sQ0FBQyxLQUF0QixFQVJnRSxDQVVoRTs7QUFDQSxNQUFJLE1BQU0sQ0FBQyxZQUFQLElBQXVCLEtBQUssS0FBTCxDQUFXLE1BQVgsR0FBb0IsTUFBTSxDQUFDLFlBQXRELEVBQXFFO0FBQ3BFLFFBQUksY0FBYyxHQUFHLE1BQU0sQ0FBQyxZQUFQLEdBQXNCLENBQTNDLENBRG9FLENBQ3RCOztBQUM5QyxRQUFJLGFBQWEsR0FBRyxjQUFjLEdBQUcsQ0FBckMsQ0FGb0UsQ0FFNUI7O0FBQ3hDLFNBQUssSUFBSSxDQUFDLEdBQUcsYUFBYixFQUE0QixDQUFDLEdBQUcsS0FBSyxLQUFMLENBQVcsTUFBM0MsRUFBbUQsQ0FBQyxFQUFwRCxFQUF3RDtBQUN2RCxXQUFLLEtBQUwsQ0FBVyxDQUFYLEVBQWMsTUFBZCxDQUFxQixLQUFyQjtBQUNBLEtBTG1FLENBTXBFOzs7QUFDQSxTQUFLLHdCQUFMLEdBQWdDLElBQUksRUFBRSxDQUFDLEVBQUgsQ0FBTSxZQUFWLENBQXVCO0FBQ3RELE1BQUEsS0FBSyxFQUFFLFdBQVMsS0FBSyxLQUFMLENBQVcsTUFBWCxHQUFvQixNQUFNLENBQUMsWUFBM0IsR0FBMEMsQ0FBbkQsSUFBc0QsaUJBRFA7QUFFdEQsTUFBQSxNQUFNLEVBQUUsS0FGOEM7QUFHdEQsTUFBQSxRQUFRLEVBQUUsQ0FBQyxDQUFDLGdDQUFEO0FBSDJDLEtBQXZCLENBQWhDO0FBS0EsU0FBSyxRQUFMLENBQWMsQ0FBQyxLQUFLLHdCQUFOLENBQWQ7QUFDQSxHQXhCK0QsQ0EwQmhFOzs7QUFDQSxPQUFLLG1CQUFMLEdBQTJCLElBQUksRUFBRSxDQUFDLEVBQUgsQ0FBTSxZQUFWLENBQXVCO0FBQ2pELElBQUEsS0FBSyxFQUFFLGNBRDBDO0FBRWpELElBQUEsSUFBSSxFQUFFLEtBRjJDO0FBR2pELElBQUEsTUFBTSxFQUFFLEtBSHlDO0FBSWpELElBQUEsUUFBUSxFQUFFLENBQUMsQ0FBQyxnQ0FBRDtBQUpzQyxHQUF2QixDQUEzQjtBQU1BLE9BQUssUUFBTCxDQUFjLENBQUMsS0FBSyxtQkFBTixDQUFkLEVBakNnRSxDQW1DaEU7O0FBQ0EsT0FBSyxTQUFMLENBQWdCO0FBQUUsY0FBUTtBQUFWLEdBQWhCO0FBQ0EsT0FBSyxPQUFMLENBQWMsSUFBZCxFQUFvQjtBQUFFLElBQUEsZUFBZSxFQUFFO0FBQW5CLEdBQXBCLEVBckNnRSxDQXVDaEU7O0FBQ0EsTUFBSSxLQUFLLHdCQUFULEVBQW9DO0FBQ25DLFNBQUssd0JBQUwsQ0FBOEIsT0FBOUIsQ0FBdUMsSUFBdkMsRUFBNkM7QUFBRSxlQUFTO0FBQVgsS0FBN0M7QUFDQTs7QUFDRCxPQUFLLG1CQUFMLENBQXlCLE9BQXpCLENBQWtDLElBQWxDLEVBQXdDO0FBQUUsYUFBUztBQUFYLEdBQXhDO0FBQ0EsQ0E1Q0Q7O0FBOENBLEVBQUUsQ0FBQyxZQUFILENBQWlCLG1CQUFqQixFQUFzQyxFQUFFLENBQUMsRUFBSCxDQUFNLE1BQTVDO0FBQ0EsRUFBRSxDQUFDLFVBQUgsQ0FBZSxtQkFBZixFQUFvQyxFQUFFLENBQUMsRUFBSCxDQUFNLEtBQU4sQ0FBWSxZQUFoRDtBQUNBOzs7Ozs7Ozs7QUFTQSxtQkFBbUIsQ0FBQyxTQUFwQixDQUE4QixpQkFBOUIsR0FBa0QsVUFBVyxTQUFYLEVBQXVCO0FBQ3hFLE9BQUssV0FBTCxDQUFpQixDQUFDLFNBQUQsQ0FBakI7QUFDQSxDQUZEOztBQUlBLG1CQUFtQixDQUFDLFNBQXBCLENBQThCLGlCQUE5QixHQUFrRCxZQUFXO0FBQzVELFNBQU8sS0FBSyxLQUFMLENBQVcsTUFBWCxDQUFrQixVQUFBLElBQUk7QUFBQSxXQUFJLElBQUksQ0FBQyxXQUFMLENBQWlCLElBQWpCLEtBQTBCLGlCQUE5QjtBQUFBLEdBQXRCLENBQVA7QUFDQSxDQUZEOztBQUlBLG1CQUFtQixDQUFDLFNBQXBCLENBQThCLCtCQUE5QixHQUFnRSxZQUFXO0FBQzFFLE9BQUssV0FBTCxDQUFpQixDQUFDLEtBQUssd0JBQU4sQ0FBakI7QUFDQSxPQUFLLEtBQUwsQ0FBVyxPQUFYLENBQW1CLFVBQUEsZUFBZTtBQUFBLFdBQUksZUFBZSxDQUFDLE1BQWhCLENBQXVCLElBQXZCLENBQUo7QUFBQSxHQUFsQztBQUNBLENBSEQ7O0FBS0EsbUJBQW1CLENBQUMsU0FBcEIsQ0FBOEIsMEJBQTlCLEdBQTJELFlBQVc7QUFDckUsT0FBSyxXQUFMLENBQWlCLENBQUMsS0FBSyxtQkFBTixDQUFqQjtBQUNBLE9BQUssSUFBTCxDQUFVLDBCQUFWO0FBQ0EsQ0FIRDs7ZUFLZSxtQjs7Ozs7Ozs7Ozs7QUNoRmYsU0FBUyxlQUFULENBQTBCLFNBQTFCLEVBQXFDLFNBQXJDLEVBQWdELE1BQWhELEVBQXlEO0FBQ3hEO0FBQ0EsRUFBQSxNQUFNLEdBQUcsTUFBTSxJQUFJLEVBQW5CLENBRndELENBR3hEOztBQUNBLEVBQUEsZUFBZSxTQUFmLENBQXNCLElBQXRCLENBQTRCLElBQTVCLEVBQWtDLE1BQWxDO0FBRUEsT0FBSyxTQUFMLEdBQWlCLFNBQWpCO0FBQ0EsT0FBSyxTQUFMLEdBQWlCLFNBQVMsSUFBSSxFQUE5QixDQVB3RCxDQVN4RDtBQUNBOztBQUNBLE9BQUssYUFBTCxHQUFxQixTQUFTLElBQUksU0FBUyxDQUFDLGFBQXZCLElBQXdDLEVBQTdELENBWHdELENBWXhEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUNBLE9BQUssS0FBTCxHQUFhLElBQUksRUFBRSxDQUFDLEVBQUgsQ0FBTSxtQkFBVixDQUErQjtBQUMzQyxJQUFBLEtBQUssRUFBRSxLQUFLLFNBQUwsQ0FBZSxLQURxQjtBQUUzQztBQUNBO0FBQ0EsSUFBQSxPQUFPLEVBQUUsS0FBSyxhQUFMLENBQW1CLEdBQW5CLENBQXVCLFVBQUEsR0FBRyxFQUFJO0FBQUMsYUFBTztBQUFDLFFBQUEsSUFBSSxFQUFFLEdBQVA7QUFBWSxRQUFBLEtBQUssRUFBQztBQUFsQixPQUFQO0FBQWdDLEtBQS9ELENBSmtDO0FBSzNDLElBQUEsUUFBUSxFQUFFLENBQUMsQ0FBQyx1REFBRCxDQUxnQyxDQUswQjs7QUFMMUIsR0FBL0IsQ0FBYixDQTNDd0QsQ0FrRHhEOztBQUNBLE9BQUssS0FBTCxDQUFXLFFBQVgsQ0FBb0IsSUFBcEIsQ0FBeUIsT0FBekIsRUFBa0MsR0FBbEMsQ0FBc0M7QUFDckMsbUJBQWUsQ0FEc0I7QUFFckMsc0JBQWtCLEtBRm1CO0FBR3JDLGNBQVU7QUFIMkIsR0FBdEMsRUFuRHdELENBd0R4RDs7QUFDQSxPQUFLLEtBQUwsQ0FBVyxRQUFYLENBQW9CLElBQXBCLENBQXlCLCtCQUF6QixFQUEwRCxHQUExRCxDQUE4RDtBQUFDLG1CQUFlO0FBQWhCLEdBQTlELEVBekR3RCxDQTBEeEQ7O0FBQ0EsT0FBSyxLQUFMLENBQVcsUUFBWCxDQUFvQixJQUFwQixDQUF5Qiw4QkFBekIsRUFBeUQsR0FBekQsQ0FBNkQ7QUFDNUQsbUJBQWUsQ0FENkM7QUFFNUQsY0FBVSxNQUZrRDtBQUc1RCxrQkFBYztBQUg4QyxHQUE3RCxFQTNEd0QsQ0FpRXhEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBQ0EsT0FBSyxZQUFMLEdBQW9CLElBQUksRUFBRSxDQUFDLEVBQUgsQ0FBTSxZQUFWLENBQXVCO0FBQzFDLElBQUEsSUFBSSxFQUFFLE9BRG9DO0FBRTFDLElBQUEsTUFBTSxFQUFFLEtBRmtDO0FBRzFDLElBQUEsS0FBSyxFQUFFO0FBSG1DLEdBQXZCLENBQXBCO0FBS0EsT0FBSyxZQUFMLENBQWtCLFFBQWxCLENBQTJCLElBQTNCLENBQWdDLFFBQWhDLEVBQTBDLEtBQTFDLEdBQWtELEdBQWxELENBQXNEO0FBQ3JELGlCQUFhLE9BRHdDO0FBRXJELGFBQVM7QUFGNEMsR0FBdEQ7QUFLQSxPQUFLLGFBQUwsR0FBcUIsSUFBSSxFQUFFLENBQUMsRUFBSCxDQUFNLFlBQVYsQ0FBdUI7QUFDM0MsSUFBQSxJQUFJLEVBQUUsT0FEcUM7QUFFM0MsSUFBQSxNQUFNLEVBQUUsS0FGbUM7QUFHM0MsSUFBQSxLQUFLLEVBQUUsYUFIb0M7QUFJM0MsSUFBQSxRQUFRLEVBQUUsQ0FBQyxDQUFDLCtCQUFEO0FBSmdDLEdBQXZCLENBQXJCO0FBTUEsT0FBSyxhQUFMLENBQW1CLFFBQW5CLENBQTRCLElBQTVCLENBQWlDLFFBQWpDLEVBQTJDLEtBQTNDLEdBQW1ELEdBQW5ELENBQXVEO0FBQ3RELGlCQUFhLE9BRHlDO0FBRXRELGFBQVMsTUFGNkM7QUFHdEQsb0JBQWdCO0FBSHNDLEdBQXZEO0FBTUEsT0FBSyxrQkFBTCxHQUEwQixJQUFJLEVBQUUsQ0FBQyxFQUFILENBQU0sZ0JBQVYsQ0FBMkI7QUFDcEQsSUFBQSxLQUFLLEVBQUUsQ0FDTixLQUFLLEtBREMsRUFFTixLQUFLLGFBRkMsRUFHTixLQUFLLFlBSEMsQ0FENkMsQ0FNcEQ7O0FBTm9ELEdBQTNCLENBQTFCLENBNUZ3RCxDQW9HeEQ7O0FBQ0EsT0FBSyxrQkFBTCxDQUF3QixVQUF4QixHQUFxQztBQUFBLFdBQU0sS0FBTjtBQUFBLEdBQXJDOztBQUNBLE9BQUssa0JBQUwsQ0FBd0IsVUFBeEIsR0FBcUM7QUFBQSxXQUFNLEtBQU47QUFBQSxHQUFyQzs7QUFDQSxPQUFLLGtCQUFMLENBQXdCLGtCQUF4QixHQUE2QztBQUFBLFdBQU0sSUFBTjtBQUFBLEdBQTdDOztBQUVBLE9BQUssVUFBTCxHQUFrQixJQUFJLEVBQUUsQ0FBQyxFQUFILENBQU0sV0FBVixDQUF1QixLQUFLLGtCQUE1QixFQUFnRDtBQUNqRSxJQUFBLEtBQUssRUFBRSxLQUFLLFNBQUwsQ0FBZSxJQUFmLEdBQXNCLElBRG9DO0FBRWpFLElBQUEsS0FBSyxFQUFFLEtBRjBEO0FBR2pFLElBQUEsSUFBSSxFQUFFLEtBQUssU0FBTCxDQUFlLFdBQWYsSUFBOEIsS0FBSyxTQUFMLENBQWUsV0FBZixDQUEyQixFQUF6RCxJQUErRCxLQUhKO0FBSWpFLElBQUEsVUFBVSxFQUFFO0FBSnFELEdBQWhELEVBS2YsTUFMZSxFQUFsQjtBQU1BLE9BQUssVUFBTCxDQUFnQixRQUFoQixDQUF5QixJQUF6QixDQUE4Qix5QkFBOUIsRUFBeUQsR0FBekQsQ0FBNkQ7QUFBQyxjQUFVO0FBQVgsR0FBN0Q7QUFFQSxPQUFLLFNBQUwsR0FBaUIsSUFBSSxFQUFFLENBQUMsRUFBSCxDQUFNLFdBQVYsQ0FBc0I7QUFDdEMsSUFBQSxLQUFLLEVBQUUsS0FBSyxTQUFMLENBQWUsSUFBZixHQUFzQixLQUF0QixHQUE4QixLQUFLLFNBQUwsQ0FBZSxLQURkO0FBRXRDLElBQUEsUUFBUSxFQUFFLENBQUMsQ0FBQyw0QkFBRDtBQUYyQixHQUF0QixDQUFqQjtBQUlBLE9BQUssVUFBTCxHQUFrQixJQUFJLEVBQUUsQ0FBQyxFQUFILENBQU0sWUFBVixDQUF1QjtBQUN4QyxJQUFBLElBQUksRUFBRSxNQURrQztBQUV4QyxJQUFBLE1BQU0sRUFBRSxLQUZnQztBQUd4QyxJQUFBLFFBQVEsRUFBRSxDQUFDLENBQUMsa0NBQUQ7QUFINkIsR0FBdkIsQ0FBbEI7QUFLQSxPQUFLLFVBQUwsQ0FBZ0IsUUFBaEIsQ0FBeUIsSUFBekIsQ0FBOEIsR0FBOUIsRUFBbUMsR0FBbkMsQ0FBdUM7QUFDdEMscUJBQWlCLGVBRHFCO0FBRXRDLG1CQUFlO0FBRnVCLEdBQXZDO0FBSUEsT0FBSyxVQUFMLENBQWdCLFFBQWhCLENBQXlCLElBQXpCLENBQThCLFFBQTlCLEVBQXdDLEtBQXhDLEdBQWdELEdBQWhELENBQW9EO0FBQ25ELGlCQUFhLE9BRHNDO0FBRW5ELGFBQVM7QUFGMEMsR0FBcEQ7QUFLQSxPQUFLLFVBQUwsR0FBa0IsSUFBSSxFQUFFLENBQUMsRUFBSCxDQUFNLGdCQUFWLENBQTJCO0FBQzVDLElBQUEsS0FBSyxFQUFFLENBQ04sS0FBSyxTQURDLEVBRU4sS0FBSyxVQUZDLENBRHFDO0FBSzVDLElBQUEsUUFBUSxFQUFFLENBQUMsQ0FBQyxzQ0FBRDtBQUxpQyxHQUEzQixDQUFsQjtBQVFBLE9BQUssUUFBTCxHQUFnQixDQUFDLENBQUMsT0FBRCxDQUFELENBQ2QsR0FEYyxDQUNWO0FBQ0osYUFBUyxPQURMO0FBRUosZUFBVyxjQUZQO0FBR0osY0FBVSxnQkFITjtBQUlKLHFCQUFpQixNQUpiO0FBS0osb0JBQWdCLE1BTFo7QUFNSixjQUFVO0FBTk4sR0FEVSxFQVNkLE1BVGMsQ0FTUCxLQUFLLFVBQUwsQ0FBZ0IsUUFUVCxFQVNtQixLQUFLLFVBQUwsQ0FBZ0IsUUFUbkMsQ0FBaEI7QUFXQSxPQUFLLFVBQUwsQ0FBZ0IsT0FBaEIsQ0FBeUIsSUFBekIsRUFBK0I7QUFBRSxhQUFTO0FBQVgsR0FBL0I7QUFDQSxPQUFLLGFBQUwsQ0FBbUIsT0FBbkIsQ0FBNEIsSUFBNUIsRUFBa0M7QUFBRSxhQUFTO0FBQVgsR0FBbEM7QUFDQSxPQUFLLFlBQUwsQ0FBa0IsT0FBbEIsQ0FBMkIsSUFBM0IsRUFBaUM7QUFBRSxhQUFTO0FBQVgsR0FBakM7QUFDQTs7QUFDRCxFQUFFLENBQUMsWUFBSCxDQUFpQixlQUFqQixFQUFrQyxFQUFFLENBQUMsRUFBSCxDQUFNLE1BQXhDOztBQUVBLGVBQWUsQ0FBQyxTQUFoQixDQUEwQixXQUExQixHQUF3QyxZQUFXO0FBQ2xELE9BQUssVUFBTCxDQUFnQixNQUFoQixDQUF1QixLQUF2QjtBQUNBLE9BQUssVUFBTCxDQUFnQixNQUFoQixDQUF1QixJQUF2QjtBQUNBLE9BQUssS0FBTCxDQUFXLEtBQVg7QUFDQSxDQUpEOztBQU1BLGVBQWUsQ0FBQyxTQUFoQixDQUEwQixjQUExQixHQUEyQyxZQUFXO0FBQ3JELE9BQUssU0FBTCxDQUFlLEtBQWYsR0FBdUIsS0FBSyxLQUFMLENBQVcsUUFBWCxFQUF2QjtBQUNBLE9BQUssU0FBTCxDQUFlLFFBQWYsQ0FBd0IsS0FBSyxTQUFMLENBQWUsSUFBZixHQUFzQixLQUF0QixHQUE4QixLQUFLLFNBQUwsQ0FBZSxLQUFyRTtBQUNBLE9BQUssVUFBTCxDQUFnQixNQUFoQixDQUF1QixJQUF2QjtBQUNBLE9BQUssVUFBTCxDQUFnQixNQUFoQixDQUF1QixLQUF2QjtBQUNBLENBTEQ7O0FBT0EsZUFBZSxDQUFDLFNBQWhCLENBQTBCLGFBQTFCLEdBQTBDLFlBQVc7QUFDcEQsT0FBSyxJQUFMLENBQVUsUUFBVjtBQUNBLENBRkQ7O0FBSUEsZUFBZSxDQUFDLFNBQWhCLENBQTBCLFVBQTFCLEdBQXVDLFlBQVc7QUFDakQsU0FBTyxLQUFLLEtBQUwsQ0FBVyxLQUFYLEVBQVA7QUFDQSxDQUZEOztlQUllLGU7Ozs7Ozs7Ozs7O0FDakxmLElBQUksK0JBQStCLEdBQUcsU0FBUywrQkFBVCxDQUEwQyxNQUExQyxFQUFtRDtBQUN4RixFQUFBLEVBQUUsQ0FBQyxFQUFILENBQU0sZUFBTixDQUFzQixJQUF0QixDQUE0QixJQUE1QixFQUFrQyxNQUFsQztBQUNBLEVBQUEsRUFBRSxDQUFDLEVBQUgsQ0FBTSxLQUFOLENBQVksYUFBWixDQUEwQixJQUExQixDQUFnQyxJQUFoQyxFQUFzQyxNQUF0QztBQUNBLE9BQUssV0FBTCxHQUFtQixNQUFNLENBQUMsV0FBUCxJQUFzQixFQUF6QztBQUNBLENBSkQ7O0FBS0EsRUFBRSxDQUFDLFlBQUgsQ0FBaUIsK0JBQWpCLEVBQWtELEVBQUUsQ0FBQyxFQUFILENBQU0sZUFBeEQ7QUFDQSxFQUFFLENBQUMsVUFBSCxDQUFlLCtCQUFmLEVBQWdELEVBQUUsQ0FBQyxFQUFILENBQU0sS0FBTixDQUFZLGFBQTVELEUsQ0FFQTs7QUFDQSwrQkFBK0IsQ0FBQyxTQUFoQyxDQUEwQyxjQUExQyxHQUEyRCxVQUFTLFdBQVQsRUFBc0I7QUFDaEYsT0FBSyxXQUFMLEdBQW1CLFdBQW5CO0FBQ0EsQ0FGRCxDLENBSUE7OztBQUNBLCtCQUErQixDQUFDLFNBQWhDLENBQTBDLGdCQUExQyxHQUE2RCxZQUFZO0FBQ3hFLE1BQUksUUFBUSxHQUFHLENBQUMsQ0FBQyxRQUFGLEdBQWEsT0FBYixDQUFxQixJQUFJLE1BQUosQ0FBVyxRQUFRLEVBQUUsQ0FBQyxJQUFILENBQVEsWUFBUixDQUFxQixLQUFLLFFBQUwsRUFBckIsQ0FBbkIsRUFBMEQsR0FBMUQsQ0FBckIsQ0FBZjtBQUNBLFNBQU8sUUFBUSxDQUFDLE9BQVQsQ0FBa0I7QUFBRSxJQUFBLEtBQUssRUFBRSxpQkFBWSxDQUFFO0FBQXZCLEdBQWxCLENBQVA7QUFDQSxDQUhELEMsQ0FLQTs7O0FBQ0EsK0JBQStCLENBQUMsU0FBaEMsQ0FBMEMsOEJBQTFDLEdBQTJFLFVBQVcsUUFBWCxFQUFzQjtBQUNoRyxTQUFPLFFBQVEsSUFBSSxFQUFuQjtBQUNBLENBRkQsQyxDQUlBOzs7QUFDQSwrQkFBK0IsQ0FBQyxTQUFoQyxDQUEwQyw0QkFBMUMsR0FBeUUsVUFBVyxPQUFYLEVBQXFCO0FBQzdGLE1BQUksb0JBQW9CLEdBQUcsU0FBdkIsb0JBQXVCLENBQVMsY0FBVCxFQUF5QjtBQUNuRCxXQUFPLE9BQU8sQ0FBQyxJQUFSLENBQWEsY0FBYyxDQUFDLEtBQTVCLEtBQXdDLENBQUMsY0FBYyxDQUFDLEtBQWhCLElBQXlCLE9BQU8sQ0FBQyxJQUFSLENBQWEsY0FBYyxDQUFDLElBQTVCLENBQXhFO0FBQ0EsR0FGRDs7QUFHQSxNQUFJLG9CQUFvQixHQUFHLFNBQXZCLG9CQUF1QixDQUFTLFVBQVQsRUFBcUI7QUFDL0MsV0FBTyxJQUFJLEVBQUUsQ0FBQyxFQUFILENBQU0sZ0JBQVYsQ0FBNEI7QUFDbEMsTUFBQSxJQUFJLEVBQUUsVUFBVSxDQUFDLElBRGlCO0FBRWxDLE1BQUEsS0FBSyxFQUFFLFVBQVUsQ0FBQyxLQUFYLElBQW9CLFVBQVUsQ0FBQztBQUZKLEtBQTVCLENBQVA7QUFJQSxHQUxEOztBQU1BLFNBQU8sS0FBSyxXQUFMLENBQWlCLE1BQWpCLENBQXdCLG9CQUF4QixFQUE4QyxHQUE5QyxDQUFrRCxvQkFBbEQsQ0FBUDtBQUNBLENBWEQ7O2VBYWUsK0I7Ozs7Ozs7Ozs7O0FDdENmOzs7Ozs7Ozs7O0FBRUE7Ozs7Ozs7Ozs7O0FBWUEsSUFBSSxVQUFVLEdBQUcsU0FBUyxVQUFULENBQXFCLE1BQXJCLEVBQThCO0FBQzlDLEVBQUEsVUFBVSxTQUFWLENBQWlCLElBQWpCLENBQXVCLElBQXZCLEVBQTZCLE1BQTdCO0FBQ0EsQ0FGRDs7QUFHQSxFQUFFLENBQUMsWUFBSCxDQUFpQixVQUFqQixFQUE2QixFQUFFLENBQUMsRUFBSCxDQUFNLE1BQW5DO0FBRUEsVUFBVSxVQUFWLENBQWtCLElBQWxCLEdBQXlCLFlBQXpCO0FBQ0EsVUFBVSxVQUFWLENBQWtCLEtBQWxCLEdBQTBCLGtCQUExQixDLENBRUE7O0FBQ0EsVUFBVSxDQUFDLFNBQVgsQ0FBcUIsVUFBckIsR0FBa0MsWUFBWTtBQUFBOztBQUM3QztBQUNBLEVBQUEsVUFBVSxTQUFWLENBQWlCLFNBQWpCLENBQTJCLFVBQTNCLENBQXNDLElBQXRDLENBQTRDLElBQTVDLEVBRjZDLENBRzdDOztBQUNBLE9BQUssT0FBTCxHQUFlLElBQUksRUFBRSxDQUFDLEVBQUgsQ0FBTSxXQUFWLENBQXVCO0FBQ3JDLElBQUEsTUFBTSxFQUFFLElBRDZCO0FBRXJDLElBQUEsUUFBUSxFQUFFO0FBRjJCLEdBQXZCLENBQWYsQ0FKNkMsQ0FRN0M7O0FBQ0EsT0FBSyxXQUFMLEdBQW1CLElBQUksRUFBRSxDQUFDLEVBQUgsQ0FBTSxpQkFBVixDQUE2QjtBQUMvQyxJQUFBLFFBQVEsRUFBRTtBQURxQyxHQUE3QixDQUFuQjtBQUdBLE9BQUssVUFBTCxHQUFrQixDQUNqQixJQUFJLEVBQUUsQ0FBQyxFQUFILENBQU0sV0FBVixDQUF1QjtBQUN0QixJQUFBLEtBQUssRUFBRSxvQ0FEZTtBQUV0QixJQUFBLFFBQVEsRUFBRSxDQUFDLENBQUMsNkJBQUQ7QUFGVyxHQUF2QixDQURpQixFQUtqQixJQUFJLEVBQUUsQ0FBQyxFQUFILENBQU0sV0FBVixDQUF1QjtBQUN0QixJQUFBLEtBQUssRUFBRSw4QkFEZTtBQUV0QixJQUFBLFFBQVEsRUFBRSxDQUFDLENBQUMsNkJBQUQ7QUFGVyxHQUF2QixDQUxpQixFQVNqQixJQUFJLEVBQUUsQ0FBQyxFQUFILENBQU0sV0FBVixDQUF1QjtBQUN0QixJQUFBLEtBQUssRUFBRSwrQkFEZTtBQUV0QixJQUFBLFFBQVEsRUFBRSxDQUFDLENBQUMsNkJBQUQ7QUFGVyxHQUF2QixDQVRpQixFQWFqQixJQUFJLEVBQUUsQ0FBQyxFQUFILENBQU0sV0FBVixDQUF1QjtBQUN0QixJQUFBLEtBQUssRUFBRSxzQ0FEZTtBQUV0QixJQUFBLFFBQVEsRUFBRSxDQUFDLENBQUMsNkJBQUQ7QUFGVyxHQUF2QixDQWJpQixFQWlCakIsSUFBSSxFQUFFLENBQUMsRUFBSCxDQUFNLFdBQVYsQ0FBdUI7QUFDdEIsSUFBQSxLQUFLLEVBQUUsK0JBRGU7QUFFdEIsSUFBQSxRQUFRLEVBQUUsQ0FBQyxDQUFDLDZCQUFEO0FBRlcsR0FBdkIsQ0FqQmlCLEVBcUJqQixJQUFJLEVBQUUsQ0FBQyxFQUFILENBQU0sV0FBVixDQUF1QjtBQUN0QixJQUFBLEtBQUssRUFBRSxrQ0FEZTtBQUV0QixJQUFBLFFBQVEsRUFBRSxDQUFDLENBQUMsNkJBQUQ7QUFGVyxHQUF2QixFQUdHLE1BSEgsRUFyQmlCLENBQWxCO0FBMEJBLE9BQUssV0FBTCxHQUFtQixJQUFJLEVBQUUsQ0FBQyxFQUFILENBQU0sWUFBVixDQUF3QjtBQUMxQyxJQUFBLEtBQUssRUFBRTtBQURtQyxHQUF4QixFQUVoQixNQUZnQixFQUFuQjtBQUdBLE9BQUssYUFBTCxHQUFxQixFQUFyQixDQXpDNkMsQ0EyQzdDOztBQUNBLGdDQUFLLE9BQUwsQ0FBYSxRQUFiLEVBQXNCLE1BQXRCLCtCQUNDLEtBQUssV0FBTCxDQUFpQixRQURsQixFQUVFLElBQUksRUFBRSxDQUFDLEVBQUgsQ0FBTSxXQUFWLENBQXVCO0FBQ3ZCLElBQUEsS0FBSyxFQUFFLGVBRGdCO0FBRXZCLElBQUEsUUFBUSxFQUFFLENBQUMsQ0FBQyxrQ0FBRDtBQUZZLEdBQXZCLENBQUQsQ0FHSSxRQUxMLDRCQU1JLEtBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixVQUFBLE1BQU07QUFBQSxXQUFJLE1BQU0sQ0FBQyxRQUFYO0FBQUEsR0FBMUIsQ0FOSixJQU9DLEtBQUssV0FBTCxDQUFpQixRQVBsQixJQTVDNkMsQ0FzRDdDOzs7QUFDQSxPQUFLLEtBQUwsQ0FBVyxNQUFYLENBQW1CLEtBQUssT0FBTCxDQUFhLFFBQWhDLEVBdkQ2QyxDQXlEN0M7O0FBQ0EsT0FBSyxXQUFMLENBQWlCLE9BQWpCLENBQTBCLElBQTFCLEVBQWdDO0FBQUUsYUFBUztBQUFYLEdBQWhDO0FBQ0EsQ0EzREQ7O0FBNkRBLFVBQVUsQ0FBQyxTQUFYLENBQXFCLGtCQUFyQixHQUEwQyxZQUFXO0FBQ3BEO0FBQ0EsT0FBSyxLQUFMO0FBQ0EsQ0FIRCxDLENBS0E7OztBQUNBLFVBQVUsQ0FBQyxTQUFYLENBQXFCLGFBQXJCLEdBQXFDLFlBQVk7QUFDaEQsU0FBTyxLQUFLLE9BQUwsQ0FBYSxRQUFiLENBQXNCLFdBQXRCLENBQW1DLElBQW5DLENBQVA7QUFDQSxDQUZEOztBQUlBLFVBQVUsQ0FBQyxTQUFYLENBQXFCLGlCQUFyQixHQUF5QyxVQUFTLE1BQVQsRUFBaUIsT0FBakIsRUFBMEI7QUFDbEUsTUFBSSxhQUFhLEdBQUcsS0FBSyxXQUFMLENBQWlCLFdBQWpCLEVBQXBCO0FBQ0EsTUFBSSxtQkFBbUIsR0FBRyxJQUFJLENBQUMsR0FBTCxDQUFTLE9BQU8sSUFBSSxHQUFwQixFQUF5QixhQUFhLEdBQUcsTUFBekMsQ0FBMUI7QUFDQSxPQUFLLFdBQUwsQ0FBaUIsV0FBakIsQ0FBNkIsbUJBQTdCO0FBQ0EsQ0FKRDs7QUFNQSxVQUFVLENBQUMsU0FBWCxDQUFxQixzQkFBckIsR0FBOEMsVUFBUyxZQUFULEVBQXVCO0FBQUE7O0FBQ3BFLE1BQUksVUFBVSxHQUFHLFNBQWIsVUFBYSxDQUFBLEtBQUssRUFBSTtBQUN6QjtBQUNBLFFBQUksTUFBTSxHQUFHLEtBQUksQ0FBQyxVQUFMLENBQWdCLEtBQWhCLENBQWI7QUFDQSxJQUFBLE1BQU0sQ0FBQyxRQUFQLENBQWdCLE1BQU0sQ0FBQyxRQUFQLEtBQW9CLFFBQXBDLEVBSHlCLENBSXpCO0FBQ0E7O0FBQ0EsUUFBSSxjQUFjLEdBQUcsRUFBckIsQ0FOeUIsQ0FNQTs7QUFDekIsUUFBSSxTQUFTLEdBQUcsR0FBaEIsQ0FQeUIsQ0FPSjs7QUFDckIsUUFBSSxVQUFVLEdBQUcsRUFBakI7QUFDQSxRQUFJLGdCQUFnQixHQUFHLGNBQWMsR0FBRyxVQUF4Qzs7QUFFQSxTQUFNLElBQUksSUFBSSxHQUFDLENBQWYsRUFBa0IsSUFBSSxHQUFHLFVBQXpCLEVBQXFDLElBQUksRUFBekMsRUFBNkM7QUFDNUMsTUFBQSxNQUFNLENBQUMsVUFBUCxDQUNDLEtBQUksQ0FBQyxpQkFBTCxDQUF1QixJQUF2QixDQUE0QixLQUE1QixDQURELEVBRUMsU0FBUyxHQUFHLElBQVosR0FBbUIsVUFGcEIsRUFHQyxnQkFIRDtBQUtBO0FBQ0QsR0FsQkQ7O0FBbUJBLE1BQUksV0FBVyxHQUFHLFNBQWQsV0FBYyxDQUFDLEtBQUQsRUFBUSxJQUFSLEVBQWMsSUFBZCxFQUF1QjtBQUN4QyxRQUFJLE1BQU0sR0FBRyxLQUFJLENBQUMsVUFBTCxDQUFnQixLQUFoQixDQUFiO0FBQ0EsSUFBQSxNQUFNLENBQUMsUUFBUCxDQUNDLE1BQU0sQ0FBQyxRQUFQLEtBQW9CLFdBQXBCLEdBQWtDLHdCQUFhLElBQWIsRUFBbUIsSUFBbkIsQ0FEbkM7O0FBR0EsSUFBQSxLQUFJLENBQUMsV0FBTCxDQUFpQixNQUFqQixDQUF3QixJQUF4Qjs7QUFDQSxJQUFBLEtBQUksQ0FBQyxVQUFMO0FBQ0EsR0FQRDs7QUFRQSxFQUFBLFlBQVksQ0FBQyxPQUFiLENBQXFCLFVBQVMsT0FBVCxFQUFrQixLQUFsQixFQUF5QjtBQUM3QyxJQUFBLE9BQU8sQ0FBQyxJQUFSLENBQ0M7QUFBQSxhQUFNLFVBQVUsQ0FBQyxLQUFELENBQWhCO0FBQUEsS0FERCxFQUVDLFVBQUMsSUFBRCxFQUFPLElBQVA7QUFBQSxhQUFnQixXQUFXLENBQUMsS0FBRCxFQUFRLElBQVIsRUFBYyxJQUFkLENBQTNCO0FBQUEsS0FGRDtBQUlBLEdBTEQ7QUFNQSxDQWxDRCxDLENBb0NBO0FBQ0E7OztBQUNBLFVBQVUsQ0FBQyxTQUFYLENBQXFCLGVBQXJCLEdBQXVDLFVBQVcsSUFBWCxFQUFrQjtBQUFBOztBQUN4RCxFQUFBLElBQUksR0FBRyxJQUFJLElBQUksRUFBZjtBQUNBLFNBQU8sVUFBVSxTQUFWLENBQWlCLFNBQWpCLENBQTJCLGVBQTNCLENBQTJDLElBQTNDLENBQWlELElBQWpELEVBQXVELElBQXZELEVBQ0wsSUFESyxDQUNDLFlBQU07QUFDWixRQUFJLFlBQVksR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQTFCOztBQUNBLElBQUEsTUFBSSxDQUFDLFVBQUwsQ0FBZ0IsQ0FBaEIsRUFBbUIsTUFBbkIsQ0FBMEIsWUFBMUI7O0FBQ0EsUUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLElBQUwsR0FBWSxJQUFJLENBQUMsUUFBakIsR0FBNEIsSUFBSSxDQUFDLFFBQUwsQ0FBYyxLQUFkLENBQW9CLENBQXBCLEVBQXVCLENBQUMsQ0FBeEIsQ0FBL0M7QUFDQSxJQUFBLElBQUksQ0FBQyxRQUFMLENBQWMsSUFBZCxDQUFtQjtBQUFBLGFBQU0sTUFBSSxDQUFDLHNCQUFMLENBQTRCLFlBQTVCLENBQU47QUFBQSxLQUFuQjtBQUNBLEdBTkssRUFNSCxJQU5HLENBQVA7QUFPQSxDQVRELEMsQ0FXQTs7O0FBQ0EsVUFBVSxDQUFDLFNBQVgsQ0FBcUIsY0FBckIsR0FBc0MsVUFBVyxJQUFYLEVBQWtCO0FBQ3ZELEVBQUEsSUFBSSxHQUFHLElBQUksSUFBSSxFQUFmOztBQUNBLE1BQUksSUFBSSxDQUFDLE9BQVQsRUFBa0I7QUFDakI7QUFDQSxXQUFPLFVBQVUsU0FBVixDQUFpQixTQUFqQixDQUEyQixjQUEzQixDQUEwQyxJQUExQyxDQUFnRCxJQUFoRCxFQUFzRCxJQUF0RCxFQUNMLElBREssQ0FDQSxHQURBLENBQVA7QUFFQSxHQU5zRCxDQU92RDs7O0FBQ0EsU0FBTyxVQUFVLFNBQVYsQ0FBaUIsU0FBakIsQ0FBMkIsY0FBM0IsQ0FBMEMsSUFBMUMsQ0FBZ0QsSUFBaEQsRUFBc0QsSUFBdEQsQ0FBUDtBQUNBLENBVEQsQyxDQVdBOzs7QUFDQSxVQUFVLENBQUMsU0FBWCxDQUFxQixrQkFBckIsR0FBMEMsVUFBVyxJQUFYLEVBQWtCO0FBQUE7O0FBQzNELFNBQU8sVUFBVSxTQUFWLENBQWlCLFNBQWpCLENBQTJCLGtCQUEzQixDQUE4QyxJQUE5QyxDQUFvRCxJQUFwRCxFQUEwRCxJQUExRCxFQUNMLEtBREssQ0FDRSxZQUFNO0FBQ2Q7QUFDQyxJQUFBLE1BQUksQ0FBQyxVQUFMLENBQWdCLE9BQWhCLENBQXlCLFVBQUEsU0FBUyxFQUFJO0FBQ3JDLFVBQUksWUFBWSxHQUFHLFNBQVMsQ0FBQyxRQUFWLEVBQW5CO0FBQ0EsTUFBQSxTQUFTLENBQUMsUUFBVixDQUNDLFlBQVksQ0FBQyxLQUFiLENBQW1CLENBQW5CLEVBQXNCLFlBQVksQ0FBQyxPQUFiLENBQXFCLEtBQXJCLElBQTRCLENBQWxELENBREQ7QUFHQSxLQUxEO0FBTUEsR0FUSyxFQVNILElBVEcsQ0FBUDtBQVVBLENBWEQ7O2VBYWUsVTs7Ozs7Ozs7Ozs7QUMvS2Y7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQSxTQUFTLFVBQVQsQ0FBcUIsTUFBckIsRUFBOEI7QUFDN0IsRUFBQSxVQUFVLFNBQVYsQ0FBaUIsSUFBakIsQ0FBdUIsSUFBdkIsRUFBNkIsTUFBN0I7QUFDQTs7QUFDRCxFQUFFLENBQUMsWUFBSCxDQUFpQixVQUFqQixFQUE2QixFQUFFLENBQUMsRUFBSCxDQUFNLGFBQW5DO0FBRUEsVUFBVSxVQUFWLENBQWtCLElBQWxCLEdBQXlCLE1BQXpCO0FBQ0EsVUFBVSxVQUFWLENBQWtCLEtBQWxCLEdBQTBCLE9BQTFCO0FBQ0EsVUFBVSxVQUFWLENBQWtCLElBQWxCLEdBQXlCLE9BQXpCO0FBQ0EsVUFBVSxVQUFWLENBQWtCLE9BQWxCLEdBQTRCLENBQzNCO0FBQ0E7QUFDQyxFQUFBLEtBQUssRUFBRSxHQURSO0FBQ2E7QUFDWixFQUFBLEtBQUssRUFBRSxpQ0FGUjtBQUdDLEVBQUEsS0FBSyxFQUFFO0FBSFIsQ0FGMkIsRUFPM0I7QUFDQTtBQUNDLEVBQUEsTUFBTSxFQUFFLE1BRFQ7QUFFQyxFQUFBLEtBQUssRUFBRSxNQUZSO0FBR0MsRUFBQSxLQUFLLEVBQUUsR0FIUjtBQUdhO0FBQ1osRUFBQSxLQUFLLEVBQUU7QUFKUixDQVIyQixFQWMzQjtBQUNBO0FBQ0MsRUFBQSxNQUFNLEVBQUUsTUFEVDtBQUVDLEVBQUEsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUgsQ0FBTSxXQUFWLENBQXNCLDBDQUF0QixDQUZSO0FBR0MsRUFBQSxLQUFLLEVBQUUsQ0FBQyxTQUFELEVBQVksYUFBWjtBQUhSLENBZjJCLEVBb0IzQjtBQUNDLEVBQUEsTUFBTSxFQUFFLFNBRFQ7QUFFQyxFQUFBLEtBQUssRUFBRTtBQUZSLENBcEIyQixFQXdCM0I7QUFDQyxFQUFBLE1BQU0sRUFBRSxTQURUO0FBRUMsRUFBQSxLQUFLLEVBQUU7QUFGUixDQXhCMkIsRUE0QjNCO0FBQ0MsRUFBQSxLQUFLLEVBQUU7QUFEUixDQTVCMkIsQ0FBNUIsQyxDQWlDQTs7QUFDQSxVQUFVLENBQUMsU0FBWCxDQUFxQixVQUFyQixHQUFrQyxZQUFZO0FBQUE7O0FBQzdDO0FBQ0EsRUFBQSxVQUFVLFNBQVYsQ0FBaUIsU0FBakIsQ0FBMkIsVUFBM0IsQ0FBc0MsSUFBdEMsQ0FBNEMsSUFBNUMsRUFGNkMsQ0FHN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUVBOztBQUNBLE9BQUssU0FBTCxHQUFpQixJQUFJLDJDQUFKLENBQXFDO0FBQ3JELElBQUEsV0FBVyxFQUFFLHNCQUR3QztBQUVyRCxJQUFBLFdBQVcsRUFBRSxLQUFLLENBQUMsSUFBTixDQUFXLGVBQVgsQ0FGd0M7QUFHckQsSUFBQSxRQUFRLEVBQUUsQ0FBQyxDQUFDLCtFQUFELENBSDBDO0FBSXJELElBQUEsUUFBUSxFQUFFLEtBQUs7QUFKc0MsR0FBckMsQ0FBakI7QUFNQSxzQ0FBbUIsSUFBbkIsQ0FBd0IsVUFBQSxhQUFhO0FBQUEsV0FBSSxLQUFJLENBQUMsU0FBTCxDQUFlLGNBQWYsQ0FBOEIsYUFBOUIsQ0FBSjtBQUFBLEdBQXJDO0FBQ0EsT0FBSyxlQUFMLEdBQXVCLElBQUksRUFBRSxDQUFDLEVBQUgsQ0FBTSxZQUFWLENBQXdCO0FBQzlDLElBQUEsSUFBSSxFQUFFLEtBRHdDO0FBRTlDLElBQUEsS0FBSyxFQUFFLEtBRnVDO0FBRzlDLElBQUEsS0FBSyxFQUFFLGFBSHVDO0FBSTlDLElBQUEsUUFBUSxFQUFFLENBQUMsQ0FBQyxxQ0FBRDtBQUptQyxHQUF4QixDQUF2QjtBQU1BLE1BQUksZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLDBGQUFELENBQUQsQ0FDckIsTUFEcUIsQ0FDZCxLQUFLLFNBQUwsQ0FBZSxRQURELEVBQ1csS0FBSyxlQUFMLENBQXFCLFFBRGhDLENBQXZCLENBNUI2QyxDQStCN0M7QUFDQTs7QUFDQSxPQUFLLGNBQUwsR0FBc0IsSUFBSSxFQUFFLENBQUMsRUFBSCxDQUFNLGNBQVYsQ0FBMEI7QUFDL0MsSUFBQSxJQUFJLEVBQUUsS0FEeUM7QUFFL0MsSUFBQSxLQUFLLEVBQUUsWUFGd0M7QUFHL0MsSUFBQSxjQUFjLEVBQUUsSUFIK0I7QUFJL0MsSUFBQSxJQUFJLEVBQUU7QUFDTCxNQUFBLEtBQUssR0FDSixJQUFJLEVBQUUsQ0FBQyxFQUFILENBQU0sdUJBQVYsQ0FBbUM7QUFDbEMsUUFBQSxLQUFLLEVBQUU7QUFEMkIsT0FBbkMsQ0FESSw0QkFJRCxtQkFBVSxjQUFWLENBQXlCLE9BQXpCLENBQWlDLEdBQWpDLENBQXFDLFVBQUEsU0FBUztBQUFBLGVBQUksSUFBSSxFQUFFLENBQUMsRUFBSCxDQUFNLGdCQUFWLENBQTRCO0FBQ2hGLFVBQUEsSUFBSSxFQUFFO0FBQUMscUJBQU8sU0FBUyxDQUFDLFdBQVY7QUFBUixXQUQwRTtBQUVoRixVQUFBLEtBQUssRUFBRTtBQUZ5RSxTQUE1QixDQUFKO0FBQUEsT0FBOUMsQ0FKQyxJQVNKLElBQUksRUFBRSxDQUFDLEVBQUgsQ0FBTSx1QkFBVixDQUFtQztBQUNsQyxRQUFBLEtBQUssRUFBRTtBQUQyQixPQUFuQyxDQVRJLHNCQVlELG1CQUFVLGNBQVYsQ0FBeUIsV0FBekIsQ0FBcUMsR0FBckMsQ0FBeUMsVUFBQSxVQUFVO0FBQUEsZUFBSSxJQUFJLEVBQUUsQ0FBQyxFQUFILENBQU0sZ0JBQVYsQ0FBNEI7QUFDckYsVUFBQSxJQUFJLEVBQUU7QUFBQyxZQUFBLFVBQVUsRUFBRSxVQUFVLENBQUMsV0FBWDtBQUFiLFdBRCtFO0FBRXJGLFVBQUEsS0FBSyxFQUFFO0FBRjhFLFNBQTVCLENBQUo7QUFBQSxPQUFuRCxDQVpDO0FBREEsS0FKeUM7QUF3Qi9DLElBQUEsUUFBUSxFQUFFLENBQUMsQ0FBQyx5RkFBRCxDQXhCb0M7QUF5Qi9DLElBQUEsUUFBUSxFQUFFLEtBQUs7QUF6QmdDLEdBQTFCLENBQXRCLENBakM2QyxDQTZEN0M7O0FBQ0EsT0FBSyxlQUFMLEdBQXVCLElBQUksRUFBRSxDQUFDLEVBQUgsQ0FBTSxZQUFWLENBQXdCO0FBQzlDLElBQUEsSUFBSSxFQUFFLE9BRHdDO0FBRTlDLElBQUEsS0FBSyxFQUFFLFlBRnVDO0FBRzlDLElBQUEsS0FBSyxFQUFFO0FBSHVDLEdBQXhCLENBQXZCLENBOUQ2QyxDQW9FN0M7O0FBQ0EsT0FBSyxjQUFMLEdBQXNCLElBQUksRUFBRSxDQUFDLEVBQUgsQ0FBTSxZQUFWLENBQXdCO0FBQzdDLElBQUEsSUFBSSxFQUFFLFFBRHVDO0FBRTdDLElBQUEsS0FBSyxFQUFFLFdBRnNDO0FBRzdDLElBQUEsS0FBSyxFQUFFO0FBSHNDLEdBQXhCLENBQXRCLENBckU2QyxDQTJFN0M7O0FBQ0EsT0FBSyxlQUFMLEdBQXVCLElBQUksRUFBRSxDQUFDLEVBQUgsQ0FBTSxZQUFWLENBQXdCO0FBQzlDLElBQUEsSUFBSSxFQUFFLGlCQUR3QztBQUU5QyxJQUFBLEtBQUssRUFBRTtBQUZ1QyxHQUF4QixDQUF2QixDQTVFNkMsQ0FpRjdDOztBQUNBLE9BQUssV0FBTCxHQUFtQixJQUFJLEVBQUUsQ0FBQyxFQUFILENBQU0saUJBQVYsQ0FBNkI7QUFDL0MsSUFBQSxLQUFLLEVBQUUsQ0FDTixLQUFLLGVBREMsRUFFTixLQUFLLGNBRkMsRUFHTixLQUFLLGVBSEMsQ0FEd0M7QUFNL0MsSUFBQSxRQUFRLEVBQUUsQ0FBQyxDQUFDLDRCQUFEO0FBTm9DLEdBQTdCLENBQW5CO0FBUUEsT0FBSyxXQUFMLENBQWlCLFFBQWpCLENBQTBCLE9BQTFCLENBQWtDLEtBQUssY0FBTCxDQUFvQixRQUF0RCxFQTFGNkMsQ0E0RjdDOztBQUNBLE9BQUssTUFBTCxHQUFjLElBQUksRUFBRSxDQUFDLEVBQUgsQ0FBTSxXQUFWLENBQXVCO0FBQ3BDLElBQUEsUUFBUSxFQUFFLEtBRDBCO0FBRXBDLElBQUEsTUFBTSxFQUFFLEtBRjRCO0FBR3BDLElBQUEsTUFBTSxFQUFFLEtBSDRCO0FBSXBDLElBQUEsUUFBUSxFQUFFLENBQUMsQ0FBQyx5REFBRDtBQUp5QixHQUF2QixDQUFkO0FBTUEsT0FBSyxNQUFMLENBQVksUUFBWixDQUFxQixNQUFyQixDQUNDLGdCQURELEVBRUM7QUFDQSxPQUFLLFdBQUwsQ0FBaUIsUUFIbEIsRUFuRzZDLENBeUc3Qzs7QUFDQSxPQUFLLEtBQUwsQ0FBVyxHQUFYLENBQWU7QUFBQyxjQUFTO0FBQVYsR0FBZixFQUFrQyxNQUFsQyxDQUF5QyxLQUFLLE1BQUwsQ0FBWSxRQUFyRDtBQUVBO0FBRUE7O0FBQ0EsT0FBSyxVQUFMLEdBQWtCLElBQUksNEJBQUosRUFBbEI7QUFFQSxPQUFLLEtBQUwsQ0FBVyxHQUFYLENBQWU7QUFBQyxXQUFNO0FBQVAsR0FBZixFQUErQixNQUEvQixDQUFzQyxLQUFLLFVBQUwsQ0FBZ0IsUUFBdEQ7QUFFQTs7QUFFQSxPQUFLLFNBQUwsQ0FBZSxPQUFmLENBQXVCLElBQXZCLEVBQTZCO0FBQUMsYUFBUztBQUFWLEdBQTdCO0FBQ0EsT0FBSyxlQUFMLENBQXFCLE9BQXJCLENBQTZCLElBQTdCLEVBQW1DO0FBQUMsYUFBUztBQUFWLEdBQW5DO0FBQ0EsQ0F2SEQsQyxDQXlIQTs7O0FBQ0EsVUFBVSxDQUFDLFNBQVgsQ0FBcUIsYUFBckIsR0FBcUMsWUFBWTtBQUNoRCxTQUFPLElBQUksQ0FBQyxHQUFMLENBQVMsR0FBVCxFQUFjLEtBQUssVUFBTCxDQUFnQixRQUFoQixDQUF5QixXQUF6QixDQUFzQyxJQUF0QyxDQUFkLENBQVA7QUFDQSxDQUZELEMsQ0FJQTtBQUNBOzs7QUFDQSxVQUFVLENBQUMsU0FBWCxDQUFxQixlQUFyQixHQUF1QyxVQUFXLElBQVgsRUFBa0I7QUFBQTs7QUFDeEQsRUFBQSxJQUFJLEdBQUcsSUFBSSxJQUFJLEVBQWY7QUFDQSxTQUFPLFVBQVUsU0FBVixDQUFpQixTQUFqQixDQUEyQixlQUEzQixDQUEyQyxJQUEzQyxDQUFpRCxJQUFqRCxFQUF1RCxJQUF2RCxFQUNMLElBREssQ0FDQyxZQUFNO0FBQ1o7QUFDQSxJQUFBLE1BQUksQ0FBQyxVQUFMLENBQWdCLFFBQWhCLENBQ0MsSUFBSSxDQUFDLE9BQUwsQ0FBYSxHQUFiLENBQWlCLFVBQUEsY0FBYztBQUFBLGFBQUksSUFBSSx3QkFBSixDQUFpQixjQUFqQixDQUFKO0FBQUEsS0FBL0IsQ0FERDs7QUFHQSxJQUFBLE1BQUksQ0FBQyxZQUFMLEdBQW9CLElBQUksQ0FBQyxZQUF6QjtBQUNBLElBQUEsTUFBSSxDQUFDLFFBQUwsR0FBZ0IsSUFBSSxDQUFDLFFBQXJCOztBQUNBLElBQUEsTUFBSSxDQUFDLFVBQUw7QUFDQSxHQVRLLEVBU0gsSUFURyxDQUFQO0FBVUEsQ0FaRCxDLENBY0E7OztBQUNBLFVBQVUsQ0FBQyxTQUFYLENBQXFCLGVBQXJCLEdBQXVDLFVBQVcsSUFBWCxFQUFrQjtBQUFBOztBQUN4RCxFQUFBLElBQUksR0FBRyxJQUFJLElBQUksRUFBZjtBQUNBLFNBQU8sVUFBVSxTQUFWLENBQWlCLFNBQWpCLENBQTJCLGVBQTNCLENBQTJDLElBQTNDLENBQWlELElBQWpELEVBQXVELElBQXZELEVBQ0wsSUFESyxDQUNDO0FBQUEsV0FBTSxNQUFJLENBQUMsU0FBTCxDQUFlLEtBQWYsRUFBTjtBQUFBLEdBREQsQ0FBUDtBQUVBLENBSkQ7O0FBTUEsVUFBVSxDQUFDLFNBQVgsQ0FBcUIsY0FBckIsR0FBc0MsWUFBVztBQUFBOztBQUNoRCxNQUFJLElBQUksR0FBRyxLQUFLLFNBQUwsQ0FBZSxRQUFmLEdBQTBCLElBQTFCLEVBQVg7O0FBQ0EsTUFBSSxDQUFDLElBQUwsRUFBVztBQUNWO0FBQ0E7O0FBQ0QsTUFBSSxjQUFjLEdBQUcsS0FBSyxVQUFMLENBQWdCLEtBQWhCLENBQXNCLElBQXRCLENBQTJCLFVBQUEsTUFBTSxFQUFJO0FBQ3pELFdBQ0MsTUFBTSxDQUFDLFFBQVAsQ0FBZ0IsUUFBaEIsR0FBMkIsV0FBM0IsT0FBNkMsSUFBN0MsSUFDQSxNQUFNLENBQUMsUUFBUCxDQUFnQixjQUFoQixJQUFrQyxNQUFNLENBQUMsUUFBUCxDQUFnQixjQUFoQixDQUErQixXQUEvQixPQUFpRCxJQUZwRjtBQUlBLEdBTG9CLENBQXJCOztBQU1BLE1BQUksY0FBSixFQUFvQjtBQUNuQjtBQUNBO0FBQ0E7O0FBQ0QsTUFBSSxDQUFDLDJCQUEyQixJQUEzQixDQUFnQyxJQUFoQyxDQUFMLEVBQTRDO0FBQzNDLFFBQUksT0FBTyxHQUFHLElBQUksRUFBRSxDQUFDLEVBQUgsQ0FBTSxXQUFWLENBQ2IsYUFBYSxJQUFiLEdBQW9CLGdGQURQLENBQWQsQ0FEMkMsQ0FJM0M7O0FBQ0EsSUFBQSxPQUFPLENBQUMsR0FBUixDQUFZLE9BQVo7QUFDQTs7QUFDRCxNQUFJLElBQUksS0FBSyw0QkFBVCxJQUF5QyxDQUFDLENBQUMsY0FBRCxDQUFELENBQWtCLE1BQWxCLEtBQTZCLENBQXRFLElBQTJFLEtBQUssVUFBTCxDQUFnQixLQUFoQixDQUFzQixNQUF0QixLQUFpQyxDQUFoSCxFQUFtSDtBQUNsSCxRQUFJLGVBQWUsR0FBRyxvSEFBdEIsQ0FEa0gsQ0FFbEg7O0FBQ0EsSUFBQSxPQUFPLENBQUMsR0FBUixDQUFZLGVBQVo7QUFDQSxHQTFCK0MsQ0EyQmhEOzs7QUFDQSxNQUFJLFFBQVEsR0FBRyxJQUFJLGtCQUFKLEVBQWY7QUFDQSxFQUFBLFFBQVEsQ0FBQyxJQUFULEdBQWdCLElBQWhCO0FBQ0EsbUNBQWtCLFFBQWxCLEVBQ0UsSUFERixDQUNPLFVBQVMsUUFBVCxFQUFtQjtBQUN4QixXQUFPLENBQUMsQ0FBQyxJQUFGLENBQ04sUUFBUSxDQUFDLHdCQUFULEVBRE0sRUFFTixRQUFRLENBQUMsMEJBQVQsRUFGTSxFQUdMLElBSEssQ0FHQSxZQUFNO0FBQ1o7QUFDQSxhQUFPLFFBQVA7QUFDQSxLQU5NLENBQVA7QUFPQSxHQVRGLEVBVUUsSUFWRixDQVVPLFVBQUEsUUFBUSxFQUFJO0FBQ2pCLElBQUEsTUFBSSxDQUFDLFVBQUwsQ0FBZ0IsUUFBaEIsQ0FBMEIsQ0FBQyxJQUFJLHdCQUFKLENBQWlCLFFBQWpCLENBQUQsQ0FBMUI7O0FBQ0EsSUFBQSxNQUFJLENBQUMsVUFBTDtBQUNBLEdBYkY7QUFjQSxDQTVDRDs7ZUE4Q2UsVTs7Ozs7Ozs7Ozs7QUNyUGY7O0FBQ0E7O0FBQ0E7Ozs7QUFFQSxJQUFJLFNBQVMsR0FBRyxTQUFTLFNBQVQsR0FBcUI7QUFDcEMsTUFBSyxNQUFNLENBQUMseUJBQVAsSUFBb0MsSUFBcEMsSUFBNEMsbUJBQU8sRUFBUCxDQUFVLFlBQTNELEVBQTBFO0FBQ3pFLFdBQU8sQ0FBQyxDQUFDLFFBQUYsR0FBYSxNQUFiLEVBQVA7QUFDQTs7QUFFRCxNQUFJLG1CQUFtQixHQUFLLENBQUMsQ0FBQyxPQUFGLENBQVUsTUFBTSxDQUFDLHlCQUFqQixDQUFGLEdBQWtELE1BQU0sQ0FBQyx5QkFBekQsR0FBcUYsQ0FBQyxNQUFNLENBQUMseUJBQVIsQ0FBL0c7O0FBRUEsTUFBSyxDQUFDLENBQUQsS0FBTyxtQkFBbUIsQ0FBQyxPQUFwQixDQUE0QixtQkFBTyxFQUFQLENBQVUsaUJBQXRDLENBQVosRUFBdUU7QUFDdEUsV0FBTyxDQUFDLENBQUMsUUFBRixHQUFhLE1BQWIsRUFBUDtBQUNBOztBQUVELE1BQUssaUNBQWlDLElBQWpDLENBQXNDLE1BQU0sQ0FBQyxRQUFQLENBQWdCLElBQXRELENBQUwsRUFBbUU7QUFDbEUsV0FBTyxDQUFDLENBQUMsUUFBRixHQUFhLE1BQWIsRUFBUDtBQUNBLEdBYm1DLENBZXBDOzs7QUFDQSxNQUFLLENBQUMsQ0FBQyxjQUFELENBQUQsQ0FBa0IsTUFBdkIsRUFBZ0M7QUFDL0IsV0FBTyx3QkFBUDtBQUNBOztBQUVELE1BQUksUUFBUSxHQUFHLEVBQUUsQ0FBQyxLQUFILENBQVMsV0FBVCxDQUFxQixtQkFBTyxFQUFQLENBQVUsVUFBL0IsQ0FBZjtBQUNBLE1BQUksUUFBUSxHQUFHLFFBQVEsSUFBSSxRQUFRLENBQUMsV0FBVCxFQUEzQjs7QUFDQSxNQUFJLENBQUMsUUFBTCxFQUFlO0FBQ2QsV0FBTyxDQUFDLENBQUMsUUFBRixHQUFhLE1BQWIsRUFBUDtBQUNBO0FBRUQ7Ozs7OztBQUlBLFNBQU8sVUFBSSxHQUFKLENBQVE7QUFDZCxJQUFBLE1BQU0sRUFBRSxPQURNO0FBRWQsSUFBQSxNQUFNLEVBQUUsTUFGTTtBQUdkLElBQUEsSUFBSSxFQUFFLFdBSFE7QUFJZCxJQUFBLE1BQU0sRUFBRSxRQUFRLENBQUMsZUFBVCxFQUpNO0FBS2QsSUFBQSxXQUFXLEVBQUUsSUFMQztBQU1kLElBQUEsT0FBTyxFQUFFLEtBTks7QUFPZCxJQUFBLFlBQVksRUFBRTtBQVBBLEdBQVIsRUFTTCxJQVRLLENBU0EsVUFBUyxNQUFULEVBQWlCO0FBQ3RCLFFBQUksRUFBRSxHQUFHLE1BQU0sQ0FBQyxLQUFQLENBQWEsT0FBdEI7QUFDQSxRQUFJLFNBQVMsR0FBRyxNQUFNLENBQUMsS0FBUCxDQUFhLEtBQWIsQ0FBbUIsRUFBbkIsRUFBdUIsU0FBdkM7O0FBRUEsUUFBSyxDQUFDLFNBQU4sRUFBa0I7QUFDakIsYUFBTyx3QkFBUDtBQUNBOztBQUVELFFBQUksY0FBYyxHQUFHLFNBQVMsQ0FBQyxJQUFWLENBQWUsVUFBQSxRQUFRO0FBQUEsYUFBSSx5QkFBeUIsSUFBekIsQ0FBOEIsUUFBUSxDQUFDLEtBQXZDLENBQUo7QUFBQSxLQUF2QixDQUFyQjs7QUFFQSxRQUFLLENBQUMsY0FBTixFQUF1QjtBQUN0QixhQUFPLHdCQUFQO0FBQ0E7QUFFRCxHQXZCSyxFQXdCTixVQUFTLElBQVQsRUFBZSxLQUFmLEVBQXNCO0FBQ3RCO0FBQ0MsSUFBQSxPQUFPLENBQUMsSUFBUixDQUNDLHdEQUNDLElBQUksSUFBSSxJQURULElBQ2tCLEVBRGxCLEdBQ3VCLE1BQU0sd0JBQWEsSUFBYixFQUFtQixLQUFuQixDQUY5QjtBQUlBLFdBQU8sQ0FBQyxDQUFDLFFBQUYsR0FBYSxNQUFiLEVBQVA7QUFDQSxHQS9CSyxDQUFQO0FBaUNBLENBL0REOztlQWlFZSxTOzs7Ozs7Ozs7OztBQ3JFZjs7QUFFQTs7Ozs7OztBQU9BLElBQUksS0FBSyxHQUFHLFNBQVIsS0FBUSxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLFNBQW5CLEVBQThCLFVBQTlCLEVBQTBDO0FBQ3JELE1BQUk7QUFDSCxRQUFJLGdCQUFnQixHQUFHLENBQXZCO0FBQ0EsUUFBSSxpQkFBaUIsR0FBRyxFQUF4QjtBQUNBLFFBQUksa0JBQWtCLEdBQUcsS0FBRyxFQUFILEdBQU0sRUFBTixHQUFTLElBQWxDO0FBRUEsUUFBSSxhQUFhLEdBQUcsQ0FBQyxTQUFTLElBQUksZ0JBQWQsSUFBZ0Msa0JBQXBEO0FBQ0EsUUFBSSxjQUFjLEdBQUcsQ0FBQyxVQUFVLElBQUksaUJBQWYsSUFBa0Msa0JBQXZEO0FBRUEsUUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQUwsQ0FBZTtBQUM5QixNQUFBLEtBQUssRUFBRSxHQUR1QjtBQUU5QixNQUFBLFNBQVMsRUFBRSxJQUFJLElBQUosQ0FBUyxJQUFJLENBQUMsR0FBTCxLQUFhLGFBQXRCLEVBQXFDLFdBQXJDLEVBRm1CO0FBRzlCLE1BQUEsVUFBVSxFQUFFLElBQUksSUFBSixDQUFTLElBQUksQ0FBQyxHQUFMLEtBQWEsY0FBdEIsRUFBc0MsV0FBdEM7QUFIa0IsS0FBZixDQUFoQjtBQUtBLElBQUEsWUFBWSxDQUFDLE9BQWIsQ0FBcUIsV0FBUyxHQUE5QixFQUFtQyxTQUFuQztBQUNBLEdBZEQsQ0FjRyxPQUFNLENBQU4sRUFBUyxDQUFFLENBZnVDLENBZXRDOztBQUNmLENBaEJEO0FBaUJBOzs7Ozs7Ozs7QUFLQSxJQUFJLElBQUksR0FBRyxTQUFQLElBQU8sQ0FBUyxHQUFULEVBQWM7QUFDeEIsTUFBSSxHQUFKOztBQUNBLE1BQUk7QUFDSCxRQUFJLFNBQVMsR0FBRyxZQUFZLENBQUMsT0FBYixDQUFxQixXQUFTLEdBQTlCLENBQWhCOztBQUNBLFFBQUssU0FBUyxLQUFLLEVBQW5CLEVBQXdCO0FBQ3ZCLE1BQUEsR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFMLENBQVcsU0FBWCxDQUFOO0FBQ0E7QUFDRCxHQUxELENBS0csT0FBTSxDQUFOLEVBQVM7QUFDWCxJQUFBLE9BQU8sQ0FBQyxHQUFSLENBQVksMkJBQTJCLEdBQTNCLEdBQWlDLDJCQUE3QztBQUNBLElBQUEsT0FBTyxDQUFDLEdBQVIsQ0FDQyxPQUFPLENBQUMsQ0FBQyxJQUFULEdBQWdCLFlBQWhCLEdBQStCLENBQUMsQ0FBQyxPQUFqQyxJQUNFLENBQUMsQ0FBQyxFQUFGLEdBQU8sVUFBVSxDQUFDLENBQUMsRUFBbkIsR0FBd0IsRUFEMUIsS0FFRSxDQUFDLENBQUMsSUFBRixHQUFTLFlBQVksQ0FBQyxDQUFDLElBQXZCLEdBQThCLEVBRmhDLENBREQ7QUFLQTs7QUFDRCxTQUFPLEdBQUcsSUFBSSxJQUFkO0FBQ0EsQ0FoQkQ7Ozs7QUFpQkEsSUFBSSxrQkFBa0IsR0FBRyxTQUFyQixrQkFBcUIsQ0FBUyxHQUFULEVBQWM7QUFDdEMsTUFBSSxVQUFVLEdBQUcsR0FBRyxDQUFDLE9BQUosQ0FBWSxRQUFaLE1BQTBCLENBQTNDOztBQUNBLE1BQUssQ0FBQyxVQUFOLEVBQW1CO0FBQ2xCO0FBQ0E7O0FBQ0QsTUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFKLENBQVksUUFBWixFQUFxQixFQUFyQixDQUFELENBQWY7QUFDQSxNQUFJLFNBQVMsR0FBRyxDQUFDLElBQUQsSUFBUyxDQUFDLElBQUksQ0FBQyxVQUFmLElBQTZCLHVCQUFZLElBQUksQ0FBQyxVQUFqQixDQUE3Qzs7QUFDQSxNQUFLLFNBQUwsRUFBaUI7QUFDaEIsSUFBQSxZQUFZLENBQUMsVUFBYixDQUF3QixHQUF4QjtBQUNBO0FBQ0QsQ0FWRDs7OztBQVdBLElBQUksaUJBQWlCLEdBQUcsU0FBcEIsaUJBQW9CLEdBQVc7QUFDbEMsT0FBSyxJQUFJLENBQUMsR0FBRyxDQUFiLEVBQWdCLENBQUMsR0FBRyxZQUFZLENBQUMsTUFBakMsRUFBeUMsQ0FBQyxFQUExQyxFQUE4QztBQUM3QyxJQUFBLFVBQVUsQ0FBQyxrQkFBRCxFQUFxQixHQUFyQixFQUEwQixZQUFZLENBQUMsR0FBYixDQUFpQixDQUFqQixDQUExQixDQUFWO0FBQ0E7QUFDRCxDQUpEOzs7Ozs7Ozs7OztBQzNEQTtBQUNBLElBQUksTUFBTSxHQUFHLEVBQWIsQyxDQUNBOztBQUNBLE1BQU0sQ0FBQyxNQUFQLEdBQWdCO0FBQ2Y7QUFDQSxFQUFBLE1BQU0sRUFBRyxtQ0FGTTtBQUdmLEVBQUEsT0FBTyxFQUFFO0FBSE0sQ0FBaEIsQyxDQUtBOztBQUNBLE1BQU0sQ0FBQyxLQUFQLEdBQWU7QUFDZCxFQUFBLFNBQVMsRUFBRSxNQUFNLENBQUMsZUFBUCxJQUEwQjtBQUR2QixDQUFmLEMsQ0FHQTs7QUFDQSxNQUFNLENBQUMsRUFBUCxHQUFZLEVBQUUsQ0FBQyxNQUFILENBQVUsR0FBVixDQUFlLENBQzFCLE1BRDBCLEVBRTFCLFlBRjBCLEVBRzFCLG1CQUgwQixFQUkxQixZQUowQixFQUsxQix1QkFMMEIsRUFNMUIsY0FOMEIsRUFPMUIsY0FQMEIsRUFRMUIsY0FSMEIsRUFTMUIsVUFUMEIsRUFVMUIsY0FWMEIsRUFXMUIsY0FYMEIsQ0FBZixDQUFaO0FBY0EsTUFBTSxDQUFDLEtBQVAsR0FBZTtBQUFFO0FBQ2hCO0FBQ0EsRUFBQSxRQUFRLEVBQUcsMkhBRkc7QUFHZDtBQUNBO0FBQ0EsRUFBQSxjQUFjLEVBQUU7QUFMRixDQUFmO0FBTUc7O0FBQ0gsTUFBTSxDQUFDLFFBQVAsR0FBa0IsRUFBbEI7QUFDQSxNQUFNLENBQUMsY0FBUCxHQUF3QjtBQUN2QixFQUFBLE9BQU8sRUFBRSxDQUNSLElBRFEsRUFFUixJQUZRLEVBR1IsR0FIUSxFQUlSLElBSlEsRUFLUixHQUxRLEVBTVIsR0FOUSxFQU9SLE9BUFEsRUFRUixNQVJRLEVBU1IsTUFUUSxDQURjO0FBWXZCLEVBQUEsV0FBVyxFQUFFLENBQ1osS0FEWSxFQUVaLE1BRlksRUFHWixLQUhZLEVBSVosS0FKWSxDQVpVO0FBa0J2QixFQUFBLGVBQWUsRUFBRSxDQUNoQixVQURnQixFQUVoQixPQUZnQixFQUdoQixNQUhnQixFQUloQixRQUpnQixFQUtoQixTQUxnQixFQU1oQixVQU5nQixFQU9oQixPQVBnQixFQVFoQixRQVJnQixFQVNoQixTQVRnQixFQVVoQixVQVZnQixFQVdoQixJQVhnQixFQVloQixVQVpnQixFQWFoQixNQWJnQixDQWxCTTtBQWlDdkIsRUFBQSxtQkFBbUIsRUFBRSxDQUNwQixLQURvQixFQUVwQixNQUZvQixFQUdwQixLQUhvQixFQUlwQixLQUpvQixFQUtwQixRQUxvQixFQU1wQixJQU5vQjtBQWpDRSxDQUF4QjtBQTBDQSxNQUFNLENBQUMsYUFBUCxHQUF1QjtBQUN0QixrQ0FBZ0MsQ0FDL0IsSUFEK0IsRUFFL0IsSUFGK0IsRUFHL0IsSUFIK0IsQ0FEVjtBQU10Qix5QkFBdUIsQ0FDdEIsS0FEc0IsRUFFdEIsVUFGc0IsRUFHdEIsYUFIc0IsRUFJdEIsT0FKc0IsRUFLdEIsWUFMc0IsRUFNdEIsTUFOc0I7QUFORCxDQUF2QjtBQWVBLE1BQU0sQ0FBQyxjQUFQLEdBQXdCLENBQ3ZCLDBCQUR1QixFQUV2QixvQkFGdUIsRUFHdkIscUJBSHVCLEVBSXZCLEtBSnVCLEVBS3ZCLE1BTHVCLEVBTXZCLHdCQU51QixFQU92QiwwQkFQdUIsRUFRdkIsS0FSdUIsRUFTdkIsZUFUdUIsRUFVdkIsTUFWdUIsRUFXdkIsb0JBWHVCLEVBWXZCLGlCQVp1QixFQWF2QixpQkFidUIsRUFjdkIsYUFkdUIsRUFldkIsMEJBZnVCLEVBZ0J2QiwyQkFoQnVCLEVBaUJ2Qix5QkFqQnVCLEVBa0J2Qix3QkFsQnVCLEVBbUJ2Qix5QkFuQnVCLEVBb0J2Qix3QkFwQnVCLEVBcUJ2QixtQ0FyQnVCLEVBc0J2QixtQkF0QnVCLEVBdUJ2QixjQXZCdUIsRUF3QnZCLGFBeEJ1QixFQXlCdkIsZUF6QnVCLEVBMEJ2QixvQkExQnVCLENBQXhCO0FBNEJBLE1BQU0sQ0FBQyxvQkFBUCxHQUE4QjtBQUM3QixVQUFRO0FBQ1AsYUFBUztBQUNSLFlBQU07QUFERSxLQURGO0FBSVAsbUJBQWU7QUFDZCxZQUFNO0FBRFEsS0FKUjtBQU9QLGlCQUFhO0FBUE4sR0FEcUI7QUFVN0IsWUFBVTtBQUNULGFBQVM7QUFDUixZQUFNO0FBREUsS0FEQTtBQUlULG1CQUFlO0FBQ2QsWUFBTTtBQURRO0FBSk4sR0FWbUI7QUFrQjdCLFdBQVM7QUFDUixhQUFTO0FBQ1IsWUFBTTtBQURFLEtBREQ7QUFJUixtQkFBZTtBQUNkLFlBQU07QUFEUSxLQUpQO0FBT1IsaUJBQWE7QUFQTCxHQWxCb0I7QUEyQjdCLGVBQWE7QUFDWixhQUFTO0FBQ1IsWUFBTTtBQURFLEtBREc7QUFJWixtQkFBZTtBQUNkLFlBQU07QUFEUSxLQUpIO0FBT1osaUJBQWE7QUFQRCxHQTNCZ0I7QUFvQzdCLGlCQUFlO0FBQ2QsYUFBUztBQUNSLFlBQU07QUFERSxLQURLO0FBSWQsbUJBQWU7QUFDZCxZQUFNO0FBRFEsS0FKRDtBQU9kLGVBQVcsQ0FDVixhQURVLENBUEc7QUFVZCxpQkFBYSxLQVZDO0FBV2QsaUJBQWE7QUFYQyxHQXBDYztBQWlEN0IsbUJBQWlCO0FBQ2hCLGFBQVM7QUFDUixZQUFNO0FBREUsS0FETztBQUloQixtQkFBZTtBQUNkLFlBQU07QUFEUSxLQUpDO0FBT2hCLGVBQVcsQ0FDVixhQURVLENBUEs7QUFVaEIsaUJBQWEsS0FWRztBQVdoQixpQkFBYTtBQVhHO0FBakRZLENBQTlCO2VBZ0VlLE07Ozs7Ozs7Ozs7QUN4TGY7QUFDQSxJQUFJLFVBQVUsc2xEQUFkOzs7Ozs7Ozs7OztBQ0RBOztBQUNBOzs7Ozs7QUFFQSxJQUFJLFlBQVksR0FBRyxTQUFmLFlBQWUsQ0FBUyxPQUFULEVBQWtCLGFBQWxCLEVBQWlDO0FBQ25ELEVBQUEsS0FBSyxDQUFDLEtBQU4sQ0FBWSxTQUFaLEVBQXVCLE9BQXZCLEVBQWdDLENBQWhDLEVBQW1DLEVBQW5DO0FBQ0EsRUFBQSxLQUFLLENBQUMsS0FBTixDQUFZLGVBQVosRUFBNkIsYUFBN0IsRUFBNEMsQ0FBNUMsRUFBK0MsRUFBL0M7QUFDQSxDQUhEO0FBS0E7Ozs7Ozs7QUFLQSxJQUFJLHVCQUF1QixHQUFHLFNBQTFCLHVCQUEwQixHQUFXO0FBRXhDLE1BQUksZUFBZSxHQUFHLENBQUMsQ0FBQyxRQUFGLEVBQXRCO0FBRUEsTUFBSSxhQUFhLEdBQUc7QUFDbkIsSUFBQSxNQUFNLEVBQUUsT0FEVztBQUVuQixJQUFBLE1BQU0sRUFBRSxNQUZXO0FBR25CLElBQUEsSUFBSSxFQUFFLGlCQUhhO0FBSW5CLElBQUEsTUFBTSxFQUFFLE9BSlc7QUFLbkIsSUFBQSxXQUFXLEVBQUUsSUFMTTtBQU1uQixJQUFBLE9BQU8sRUFBRTtBQU5VLEdBQXBCO0FBU0EsTUFBSSxVQUFVLEdBQUcsQ0FDaEI7QUFDQyxJQUFBLEtBQUssRUFBQyx1REFEUDtBQUVDLElBQUEsWUFBWSxFQUFFLGFBRmY7QUFHQyxJQUFBLE9BQU8sRUFBRSxFQUhWO0FBSUMsSUFBQSxTQUFTLEVBQUUsQ0FBQyxDQUFDLFFBQUY7QUFKWixHQURnQixFQU9oQjtBQUNDLElBQUEsS0FBSyxFQUFFLHlEQURSO0FBRUMsSUFBQSxZQUFZLEVBQUUsZ0JBRmY7QUFHQyxJQUFBLE9BQU8sRUFBRSxFQUhWO0FBSUMsSUFBQSxTQUFTLEVBQUUsQ0FBQyxDQUFDLFFBQUY7QUFKWixHQVBnQixFQWFoQjtBQUNDLElBQUEsS0FBSyxFQUFFLCtDQURSO0FBRUMsSUFBQSxZQUFZLEVBQUUsVUFGZjtBQUdDLElBQUEsT0FBTyxFQUFFLEVBSFY7QUFJQyxJQUFBLFNBQVMsRUFBRSxDQUFDLENBQUMsUUFBRjtBQUpaLEdBYmdCLENBQWpCOztBQXFCQSxNQUFJLFlBQVksR0FBRyxTQUFmLFlBQWUsQ0FBUyxNQUFULEVBQWlCLFFBQWpCLEVBQTJCO0FBQzdDLFFBQUssQ0FBQyxNQUFNLENBQUMsS0FBUixJQUFpQixDQUFDLE1BQU0sQ0FBQyxLQUFQLENBQWEsZUFBcEMsRUFBc0Q7QUFDckQ7QUFDQTtBQUNBLE1BQUEsZUFBZSxDQUFDLE1BQWhCO0FBQ0E7QUFDQSxLQU40QyxDQVE3Qzs7O0FBQ0EsUUFBSSxZQUFZLEdBQUcsTUFBTSxDQUFDLEtBQVAsQ0FBYSxlQUFiLENBQTZCLEdBQTdCLENBQWlDLFVBQVMsSUFBVCxFQUFlO0FBQ2xFLGFBQU8sSUFBSSxDQUFDLEtBQUwsQ0FBVyxLQUFYLENBQWlCLENBQWpCLENBQVA7QUFDQSxLQUZrQixDQUFuQjtBQUdBLElBQUEsS0FBSyxDQUFDLFNBQU4sQ0FBZ0IsSUFBaEIsQ0FBcUIsS0FBckIsQ0FBMkIsVUFBVSxDQUFDLFFBQUQsQ0FBVixDQUFxQixPQUFoRCxFQUF5RCxZQUF6RCxFQVo2QyxDQWM3Qzs7QUFDQSxRQUFLLE1BQU0sWUFBWCxFQUF1QjtBQUN0QixNQUFBLFVBQVUsQ0FBQyxDQUFDLENBQUMsTUFBRixDQUFTLFVBQVUsQ0FBQyxRQUFELENBQVYsQ0FBcUIsS0FBOUIsRUFBcUMsTUFBTSxZQUEzQyxDQUFELEVBQXdELFFBQXhELENBQVY7QUFDQTtBQUNBOztBQUVELElBQUEsVUFBVSxDQUFDLFFBQUQsQ0FBVixDQUFxQixTQUFyQixDQUErQixPQUEvQjtBQUNBLEdBckJEOztBQXVCQSxNQUFJLFVBQVUsR0FBRyxTQUFiLFVBQWEsQ0FBUyxDQUFULEVBQVksUUFBWixFQUFzQjtBQUN0QyxjQUFJLEdBQUosQ0FBUyxDQUFULEVBQ0UsSUFERixDQUNRLFVBQVMsTUFBVCxFQUFpQjtBQUN2QixNQUFBLFlBQVksQ0FBQyxNQUFELEVBQVMsUUFBVCxDQUFaO0FBQ0EsS0FIRixFQUlFLElBSkYsQ0FJUSxVQUFTLElBQVQsRUFBZSxLQUFmLEVBQXNCO0FBQzVCLE1BQUEsT0FBTyxDQUFDLElBQVIsQ0FBYSxhQUFhLHdCQUFhLElBQWIsRUFBbUIsS0FBbkIsRUFBMEIsc0NBQXNDLENBQUMsQ0FBQyxPQUF4QyxHQUFrRCxJQUE1RSxDQUExQjtBQUNBLE1BQUEsZUFBZSxDQUFDLE1BQWhCO0FBQ0EsS0FQRjtBQVFBLEdBVEQ7O0FBV0EsRUFBQSxVQUFVLENBQUMsT0FBWCxDQUFtQixVQUFTLEdBQVQsRUFBYyxLQUFkLEVBQXFCLEdBQXJCLEVBQTBCO0FBQzVDLElBQUEsR0FBRyxDQUFDLEtBQUosR0FBWSxDQUFDLENBQUMsTUFBRixDQUFVO0FBQUUsaUJBQVUsR0FBRyxDQUFDO0FBQWhCLEtBQVYsRUFBbUMsYUFBbkMsQ0FBWjtBQUNBLElBQUEsQ0FBQyxDQUFDLElBQUYsQ0FBUSxHQUFHLENBQUMsS0FBSyxHQUFDLENBQVAsQ0FBSCxJQUFnQixHQUFHLENBQUMsS0FBSyxHQUFDLENBQVAsQ0FBSCxDQUFhLFNBQTdCLElBQTBDLElBQWxELEVBQXlELElBQXpELENBQThELFlBQVU7QUFDdkUsTUFBQSxVQUFVLENBQUMsR0FBRyxDQUFDLEtBQUwsRUFBWSxLQUFaLENBQVY7QUFDQSxLQUZEO0FBR0EsR0FMRDtBQU9BLEVBQUEsVUFBVSxDQUFDLFVBQVUsQ0FBQyxNQUFYLEdBQWtCLENBQW5CLENBQVYsQ0FBZ0MsU0FBaEMsQ0FBMEMsSUFBMUMsQ0FBK0MsWUFBVTtBQUN4RCxRQUFJLE9BQU8sR0FBRyxFQUFkOztBQUNBLFFBQUksV0FBVyxHQUFHLFNBQWQsV0FBYyxDQUFTLFNBQVQsRUFBb0I7QUFDckMsTUFBQSxPQUFPLENBQUMsU0FBUyxDQUFDLFlBQVgsQ0FBUCxHQUFrQyxTQUFTLENBQUMsT0FBNUM7QUFDQSxLQUZEOztBQUdBLFFBQUksWUFBWSxHQUFHLFNBQWYsWUFBZSxDQUFTLGtCQUFULEVBQTZCLFNBQTdCLEVBQXdDO0FBQzFELGFBQU8sQ0FBQyxDQUFDLEtBQUYsQ0FBUSxrQkFBUixFQUE0QixTQUFTLENBQUMsT0FBdEMsQ0FBUDtBQUNBLEtBRkQ7O0FBR0EsUUFBSSxVQUFVLEdBQUcsU0FBYixVQUFhLENBQVMsVUFBVCxFQUFxQjtBQUNyQyxVQUFJLFNBQVMsR0FBSyxDQUFDLENBQUQsS0FBTyxDQUFDLENBQUMsT0FBRixDQUFVLFVBQVYsRUFBc0IsVUFBVSxDQUFDLENBQUQsQ0FBVixDQUFjLE9BQXBDLENBQXpCO0FBQ0EsYUFBTztBQUNOLFFBQUEsSUFBSSxFQUFHLENBQUUsU0FBUyxHQUFHLFFBQUgsR0FBYyxFQUF6QixJQUErQixVQURoQztBQUVOLFFBQUEsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFYLENBQW1CLGNBQW5CLEVBQW1DLEVBQW5DLEtBQTJDLFNBQVMsR0FBRyxxQkFBSCxHQUEyQixFQUEvRTtBQUZELE9BQVA7QUFJQSxLQU5EOztBQU9BLElBQUEsVUFBVSxDQUFDLE9BQVgsQ0FBbUIsV0FBbkI7QUFFQSxRQUFJLGFBQWEsR0FBRyxVQUFVLENBQUMsTUFBWCxDQUFrQixZQUFsQixFQUFnQyxFQUFoQyxFQUFvQyxHQUFwQyxDQUF3QyxVQUF4QyxDQUFwQjtBQUVBLElBQUEsZUFBZSxDQUFDLE9BQWhCLENBQXdCLE9BQXhCLEVBQWlDLGFBQWpDO0FBQ0EsR0FwQkQ7QUFzQkEsU0FBTyxlQUFQO0FBQ0EsQ0FsR0Q7QUFvR0E7Ozs7Ozs7QUFLQSxJQUFJLG1CQUFtQixHQUFHLFNBQXRCLG1CQUFzQixHQUFXO0FBQ3BDLE1BQUksYUFBYSxHQUFHLEtBQUssQ0FBQyxJQUFOLENBQVcsU0FBWCxDQUFwQjtBQUNBLE1BQUksbUJBQW1CLEdBQUcsS0FBSyxDQUFDLElBQU4sQ0FBVyxlQUFYLENBQTFCOztBQUNBLE1BQ0MsQ0FBQyxhQUFELElBQ0EsQ0FBQyxhQUFhLENBQUMsS0FEZixJQUN3QixDQUFDLGFBQWEsQ0FBQyxTQUR2QyxJQUVBLENBQUMsbUJBRkQsSUFHQSxDQUFDLG1CQUFtQixDQUFDLEtBSHJCLElBRzhCLENBQUMsbUJBQW1CLENBQUMsU0FKcEQsRUFLRTtBQUNELFdBQU8sQ0FBQyxDQUFDLFFBQUYsR0FBYSxNQUFiLEVBQVA7QUFDQTs7QUFDRCxNQUFLLHVCQUFZLGFBQWEsQ0FBQyxTQUExQixLQUF3Qyx1QkFBWSxtQkFBbUIsQ0FBQyxTQUFoQyxDQUE3QyxFQUEwRjtBQUN6RjtBQUNBLElBQUEsdUJBQXVCLEdBQUcsSUFBMUIsQ0FBK0IsWUFBL0I7QUFDQTs7QUFDRCxTQUFPLENBQUMsQ0FBQyxRQUFGLEdBQWEsT0FBYixDQUFxQixhQUFhLENBQUMsS0FBbkMsRUFBMEMsbUJBQW1CLENBQUMsS0FBOUQsQ0FBUDtBQUNBLENBaEJEO0FBa0JBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrQkE7Ozs7OztBQUlBLElBQUksY0FBYyxHQUFHLFNBQWpCLGNBQWlCO0FBQUEsU0FBTSxtQkFBbUIsR0FBRyxJQUF0QixFQUMxQjtBQUNBLFlBQUEsT0FBTztBQUFBLFdBQUksT0FBSjtBQUFBLEdBRm1CLEVBRzFCO0FBQ0EsY0FBTTtBQUNMLFFBQUksY0FBYyxHQUFHLHVCQUF1QixFQUE1QztBQUNBLElBQUEsY0FBYyxDQUFDLElBQWYsQ0FBb0IsWUFBcEI7QUFDQSxXQUFPLGNBQVA7QUFDQSxHQVJ5QixDQUFOO0FBQUEsQ0FBckI7QUFXQTs7Ozs7Ozs7O0FBS0EsSUFBSSxnQkFBZ0IsR0FBRyxTQUFuQixnQkFBbUI7QUFBQSxTQUFNLG1CQUFtQixHQUFHLElBQXRCLEVBQzVCO0FBQ0EsWUFBQyxRQUFELEVBQVcsT0FBWDtBQUFBLFdBQXVCLE9BQXZCO0FBQUEsR0FGNEIsRUFHNUI7QUFDQSxjQUFNO0FBQ0wsUUFBSSxjQUFjLEdBQUcsdUJBQXVCLEVBQTVDO0FBQ0EsSUFBQSxjQUFjLENBQUMsSUFBZixDQUFvQixZQUFwQjtBQUNBLFdBQU8sY0FBUDtBQUNBLEdBUjJCLENBQU47QUFBQSxDQUF2Qjs7Ozs7Ozs7Ozs7O0FDOUtBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7Ozs7Ozs7Ozs7Ozs7O0FBRUEsSUFBSSxVQUFVLEdBQUcsU0FBYixVQUFhLENBQVMsVUFBVCxFQUFxQjtBQUNyQyxNQUFLLFVBQUwsRUFBa0I7QUFDakIsSUFBQSxVQUFVLENBQUMsY0FBWDtBQUNBOztBQUVELE1BQUkscUJBQXFCLEdBQUcsQ0FBQyxDQUFDLFFBQUYsRUFBNUI7QUFFQSxNQUFJLFdBQVcsR0FBRyxFQUFFLENBQUMsS0FBSCxDQUFTLFdBQVQsQ0FBcUIsbUJBQU8sRUFBUCxDQUFVLFVBQS9CLENBQWxCO0FBQ0EsTUFBSSxRQUFRLEdBQUcsV0FBVyxJQUFJLFdBQVcsQ0FBQyxXQUFaLEVBQTlCO0FBQ0EsTUFBSSxXQUFXLEdBQUcsV0FBVyxJQUFJLFdBQVcsQ0FBQyxjQUFaLEVBQWpDLENBVHFDLENBV3JDOztBQUNBLE1BQUksY0FBYyxHQUFHLGlDQUFyQixDQVpxQyxDQWNyQzs7QUFDQSxNQUFJLGVBQWUsR0FBRyxVQUFJLEdBQUosQ0FBUztBQUM5QixJQUFBLE1BQU0sRUFBRSxPQURzQjtBQUU5QixJQUFBLElBQUksRUFBRSxXQUZ3QjtBQUc5QixJQUFBLE1BQU0sRUFBRSxTQUhzQjtBQUk5QixJQUFBLFNBQVMsRUFBRSxHQUptQjtBQUs5QixJQUFBLE1BQU0sRUFBRSxRQUFRLENBQUMsZUFBVCxFQUxzQjtBQU05QixJQUFBLFlBQVksRUFBRTtBQU5nQixHQUFULEVBT2xCLElBUGtCLENBT2IsVUFBVSxNQUFWLEVBQWtCO0FBQzFCLFFBQUksRUFBRSxHQUFHLE1BQU0sQ0FBQyxLQUFQLENBQWEsT0FBdEI7QUFDQSxRQUFJLFFBQVEsR0FBSyxFQUFFLEdBQUcsQ0FBUCxHQUFhLEVBQWIsR0FBa0IsTUFBTSxDQUFDLEtBQVAsQ0FBYSxLQUFiLENBQW1CLEVBQW5CLEVBQXVCLFNBQXZCLENBQWlDLENBQWpDLEVBQW9DLEdBQXBDLENBQWpDO0FBQ0EsV0FBTyxRQUFQO0FBQ0EsR0FYcUIsQ0FBdEIsQ0FmcUMsQ0E0QnJDOzs7QUFDQSxNQUFJLGdCQUFnQixHQUFHLGVBQWUsQ0FBQyxJQUFoQixDQUFxQixVQUFBLFFBQVE7QUFBQSxXQUFJLDhCQUFlLFFBQWYsRUFBeUIsSUFBekIsQ0FBSjtBQUFBLEdBQTdCLEVBQWlFO0FBQWpFLEdBQ3JCLElBRHFCLENBQ2hCLFVBQUEsU0FBUztBQUFBLFdBQUksaUNBQWtCLFNBQWxCLENBQUo7QUFBQSxHQURPLEVBQzJCO0FBRDNCLEdBRXJCLElBRnFCLENBRWhCLFVBQUEsU0FBUyxFQUFJO0FBQ2xCLFdBQU8sY0FBYyxDQUFDLElBQWYsQ0FBb0IsVUFBQyxVQUFELEVBQWdCO0FBQUU7QUFDNUMsYUFBTyxTQUFTLENBQUMsTUFBVixDQUFpQixVQUFBLFFBQVEsRUFBSTtBQUFFO0FBQ3JDLFlBQUksUUFBUSxHQUFHLFFBQVEsQ0FBQyxjQUFULEdBQ1osUUFBUSxDQUFDLGNBQVQsQ0FBd0IsV0FBeEIsRUFEWSxHQUVaLFFBQVEsQ0FBQyxRQUFULEdBQW9CLFdBQXBCLEVBRkg7QUFHQSxlQUFPLFVBQVUsQ0FBQyxXQUFYLENBQXVCLFFBQXZCLENBQWdDLFFBQWhDLEtBQ1EsVUFBVSxDQUFDLGNBQVgsQ0FBMEIsUUFBMUIsQ0FBbUMsUUFBbkMsQ0FEUixJQUVRLFVBQVUsQ0FBQyxRQUFYLENBQW9CLFFBQXBCLENBQTZCLFFBQTdCLENBRmY7QUFHQSxPQVBNLEVBUUwsR0FSSyxDQVFELFVBQVMsUUFBVCxFQUFtQjtBQUFFO0FBQ3pCLFlBQUksUUFBUSxHQUFHLFFBQVEsQ0FBQyxjQUFULEdBQ1osUUFBUSxDQUFDLGNBQVQsQ0FBd0IsV0FBeEIsRUFEWSxHQUVaLFFBQVEsQ0FBQyxRQUFULEdBQW9CLFdBQXBCLEVBRkg7O0FBR0EsWUFBSSxVQUFVLENBQUMsUUFBWCxDQUFvQixRQUFwQixDQUE2QixRQUE3QixDQUFKLEVBQTRDO0FBQzNDLFVBQUEsUUFBUSxDQUFDLGNBQVQsR0FBMEIsRUFBRSxDQUFDLEtBQUgsQ0FBUyxXQUFULENBQXFCLG9CQUFvQixRQUF6QyxDQUExQjtBQUNBOztBQUNELGVBQU8sUUFBUDtBQUNBLE9BaEJLLENBQVA7QUFpQkEsS0FsQk0sQ0FBUDtBQW1CQSxHQXRCcUIsQ0FBdkIsQ0E3QnFDLENBcURyQzs7QUFDQSxNQUFJLHNCQUFzQixHQUFHLGdCQUFnQixDQUFDLElBQWpCLENBQXNCLFVBQVMsU0FBVCxFQUFvQjtBQUN0RTtBQUNBLFdBQU8sQ0FBQyxDQUFDLElBQUYsQ0FBTyxLQUFQLENBQWEsSUFBYiwrQkFDSCxTQUFTLENBQUMsR0FBVixDQUFjLFVBQUEsUUFBUTtBQUFBLGFBQUksUUFBUSxDQUFDLHdCQUFULEVBQUo7QUFBQSxLQUF0QixDQURHLHNCQUVILFNBQVMsQ0FBQyxHQUFWLENBQWMsVUFBQSxRQUFRO0FBQUEsYUFBSSxRQUFRLENBQUMsMEJBQVQsRUFBSjtBQUFBLEtBQXRCLENBRkcsSUFHSixJQUhJLENBR0MsWUFBTTtBQUNiO0FBQ0EsYUFBTyxTQUFQO0FBQ0EsS0FOTSxDQUFQO0FBT0EsR0FUNEIsQ0FBN0IsQ0F0RHFDLENBaUVyQzs7QUFDQSxNQUFJLG9CQUFvQixHQUFHLFVBQUksTUFBSixDQUFXLFdBQVcsQ0FBQyxlQUFaLEVBQVgsRUFDekIsSUFEeUIsRUFFekI7QUFDQSxZQUFTLE9BQVQsRUFBa0I7QUFDakIsUUFBSyxpQkFBaUIsSUFBakIsQ0FBc0IsT0FBdEIsQ0FBTCxFQUFzQztBQUNyQztBQUNBLGFBQU8sT0FBTyxDQUFDLEtBQVIsQ0FBYyxPQUFPLENBQUMsT0FBUixDQUFnQixJQUFoQixJQUFzQixDQUFwQyxFQUF1QyxPQUFPLENBQUMsT0FBUixDQUFnQixJQUFoQixDQUF2QyxLQUFpRSxJQUF4RTtBQUNBOztBQUNELFdBQU8sS0FBUDtBQUNBLEdBVHdCLEVBVXpCO0FBQ0EsY0FBVztBQUFFLFdBQU8sSUFBUDtBQUFjLEdBWEYsQ0FBM0IsQ0FsRXFDLENBZ0ZyQzs7O0FBQ0EsTUFBSSxhQUFhLEdBQUssbUJBQU8sRUFBUCxDQUFVLGlCQUFWLElBQStCLENBQXJEOztBQUNBLE1BQUssYUFBTCxFQUFxQjtBQUNwQixRQUFJLGtCQUFrQixHQUFHLFdBQVcsQ0FBQyxVQUFaLEtBQ3RCLENBQUMsQ0FBQyxRQUFGLEdBQWEsT0FBYixDQUFxQixtQkFBTyxFQUFQLENBQVUsWUFBL0IsQ0FEc0IsR0FFckIsVUFBSSxHQUFKLENBQVM7QUFDWCxNQUFBLE1BQU0sRUFBRSxPQURHO0FBRVgsTUFBQSxNQUFNLEVBQUUsTUFGRztBQUdYLE1BQUEsSUFBSSxFQUFFLFdBSEs7QUFJWCxNQUFBLE1BQU0sRUFBRSxXQUFXLENBQUMsZUFBWixFQUpHO0FBS1gsTUFBQSxNQUFNLEVBQUUsS0FMRztBQU1YLE1BQUEsWUFBWSxFQUFFO0FBTkgsS0FBVCxFQU9DLElBUEQsQ0FPTSxVQUFTLE1BQVQsRUFBaUI7QUFDekIsVUFBSSxNQUFNLENBQUMsS0FBUCxDQUFhLFNBQWpCLEVBQTRCO0FBQzNCLGVBQU8sS0FBUDtBQUNBOztBQUNELFVBQUksRUFBRSxHQUFHLE1BQU0sQ0FBQyxLQUFQLENBQWEsT0FBdEI7QUFDQSxVQUFJLElBQUksR0FBRyxNQUFNLENBQUMsS0FBUCxDQUFhLEtBQWIsQ0FBbUIsRUFBbkIsQ0FBWDs7QUFDQSxVQUFJLElBQUksQ0FBQyxPQUFMLEtBQWlCLEVBQXJCLEVBQXlCO0FBQ3hCLGVBQU8sS0FBUDtBQUNBOztBQUNELFVBQUssRUFBRSxHQUFHLENBQVYsRUFBYztBQUNiLGVBQU8sQ0FBQyxDQUFDLFFBQUYsR0FBYSxNQUFiLEVBQVA7QUFDQTs7QUFDRCxhQUFPLElBQUksQ0FBQyxTQUFMLENBQWUsQ0FBZixFQUFrQixLQUF6QjtBQUNBLEtBcEJFLENBRko7QUF1QkEsUUFBSSxXQUFXLEdBQUcsa0JBQWtCLENBQUMsSUFBbkIsQ0FBd0IsVUFBUyxXQUFULEVBQXNCO0FBQy9ELFVBQUksQ0FBQyxXQUFMLEVBQWtCO0FBQ2pCLGVBQU8sS0FBUDtBQUNBOztBQUNELGFBQU8sVUFBSSxPQUFKLENBQVksV0FBWixFQUNMLElBREssQ0FDQSxVQUFTLE1BQVQsRUFBaUI7QUFDdEIsWUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLE1BQVAsQ0FBYyxNQUFkLENBQXFCLFdBQXJCLEVBQWtDLElBQTdDOztBQUNBLFlBQUssSUFBSSxDQUFDLEtBQVYsRUFBa0I7QUFDakIsaUJBQU8sQ0FBQyxDQUFDLFFBQUYsR0FBYSxNQUFiLENBQW9CLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBL0IsRUFBcUMsSUFBSSxDQUFDLEtBQUwsQ0FBVyxPQUFoRCxDQUFQO0FBQ0E7O0FBQ0QsZUFBTyxJQUFJLENBQUMsS0FBTCxDQUFXLFVBQWxCO0FBQ0EsT0FQSyxDQUFQO0FBUUEsS0FaaUIsQ0FBbEI7QUFhQSxHQXZIb0MsQ0F5SHJDOzs7QUFDQSxNQUFJLGVBQWUsR0FBRyxDQUFDLENBQUMsUUFBRixFQUF0Qjs7QUFDQSxNQUFJLGFBQWEsR0FBRywwQkFBYyxVQUFkLENBQXlCLFlBQXpCLEVBQXVDO0FBQzFELElBQUEsUUFBUSxFQUFFLENBQ1QsY0FEUyxFQUVULGVBRlMsRUFHVCxnQkFIUyxFQUlULHNCQUpTLEVBS1Qsb0JBTFMsRUFNVCxhQUFhLElBQUksV0FOUixDQURnRDtBQVMxRCxJQUFBLElBQUksRUFBRSxhQVRvRDtBQVUxRCxJQUFBLFFBQVEsRUFBRTtBQVZnRCxHQUF2QyxDQUFwQjs7QUFhQSxFQUFBLGFBQWEsQ0FBQyxNQUFkLENBQXFCLElBQXJCLENBQTBCLGVBQWUsQ0FBQyxPQUExQztBQUdBLEVBQUEsQ0FBQyxDQUFDLElBQUYsQ0FDQyxlQURELEVBRUMsc0JBRkQsRUFHQyxvQkFIRCxFQUlDLGFBQWEsSUFBSSxXQUpsQixFQUtFLElBTEYsRUFNQztBQUNBLFlBQVMsWUFBVCxFQUF1QixPQUF2QixFQUFnQyxjQUFoQyxFQUFnRCxlQUFoRCxFQUFrRTtBQUNqRSxRQUFJLE1BQU0sR0FBRztBQUNaLE1BQUEsT0FBTyxFQUFFLElBREc7QUFFWixNQUFBLFFBQVEsRUFBRSxRQUZFO0FBR1osTUFBQSxZQUFZLEVBQUUsWUFIRjtBQUlaLE1BQUEsT0FBTyxFQUFFO0FBSkcsS0FBYjs7QUFNQSxRQUFJLGNBQUosRUFBb0I7QUFDbkIsTUFBQSxNQUFNLENBQUMsY0FBUCxHQUF3QixjQUF4QjtBQUNBOztBQUNELFFBQUksZUFBSixFQUFxQjtBQUNwQixNQUFBLE1BQU0sQ0FBQyxlQUFQLEdBQXlCLGVBQXpCO0FBQ0E7O0FBQ0QsOEJBQWMsV0FBZCxDQUEwQixZQUExQixFQUF3QyxNQUF4QztBQUVBLEdBdEJGLEVBM0lxQyxDQWtLbEM7QUFFSDs7QUFDQSxFQUFBLGFBQWEsQ0FBQyxNQUFkLENBQXFCLElBQXJCLENBQTBCLFVBQVMsSUFBVCxFQUFlO0FBQ3hDLFFBQUksSUFBSSxJQUFJLElBQUksQ0FBQyxPQUFqQixFQUEwQjtBQUN6QjtBQUNBLE1BQUEscUJBQXFCLENBQUMsT0FBdEIsQ0FBOEIsSUFBOUI7QUFDQSxLQUhELE1BR08sSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLEtBQWpCLEVBQXdCO0FBQzlCO0FBQ0EsTUFBQSxxQkFBcUIsQ0FBQyxNQUF0QixDQUE2QixJQUFJLENBQUMsS0FBTCxDQUFXLElBQXhDLEVBQThDLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBekQ7QUFDQSxLQUhNLE1BR0E7QUFDTjtBQUNBLE1BQUEscUJBQXFCLENBQUMsT0FBdEIsQ0FBOEIsSUFBOUI7QUFDQTs7QUFDRCxJQUFBLEtBQUssQ0FBQyxpQkFBTjtBQUNBLEdBWkQsRUFyS3FDLENBbUxyQzs7QUFDQSxFQUFBLHFCQUFxQixDQUFDLElBQXRCLENBQ0MsVUFBQSxJQUFJO0FBQUEsV0FBSSxPQUFPLENBQUMsR0FBUixDQUFZLHFCQUFaLEVBQW1DLElBQW5DLENBQUo7QUFBQSxHQURMLEVBRUMsVUFBQyxJQUFELEVBQU8sSUFBUDtBQUFBLFdBQWdCLE9BQU8sQ0FBQyxHQUFSLENBQVksZ0NBQVosRUFBOEM7QUFBQyxNQUFBLElBQUksRUFBSixJQUFEO0FBQU8sTUFBQSxJQUFJLEVBQUo7QUFBUCxLQUE5QyxDQUFoQjtBQUFBLEdBRkQ7QUFLQSxTQUFPLHFCQUFQO0FBQ0EsQ0ExTEQ7O2VBNExlLFU7Ozs7Ozs7Ozs7O0FDak1mOzs7Ozs7QUFFQSxJQUFJLFdBQVcsR0FBRyxTQUFkLFdBQWMsQ0FBUyxVQUFULEVBQXFCO0FBQ3RDLFNBQU8sSUFBSSxJQUFKLENBQVMsVUFBVCxJQUF1QixJQUFJLElBQUosRUFBOUI7QUFDQSxDQUZEOzs7QUFJQSxJQUFJLEdBQUcsR0FBRyxJQUFJLEVBQUUsQ0FBQyxHQUFQLENBQVk7QUFDckIsRUFBQSxJQUFJLEVBQUU7QUFDTCxJQUFBLE9BQU8sRUFBRTtBQUNSLHdCQUFrQixXQUFXLG1CQUFPLE1BQVAsQ0FBYyxPQUF6QixHQUNqQjtBQUZPO0FBREo7QUFEZSxDQUFaLENBQVY7QUFRQTs7OztBQUNBLEdBQUcsQ0FBQyxPQUFKLEdBQWMsVUFBUyxVQUFULEVBQXFCO0FBQ2xDLFNBQU8sQ0FBQyxDQUFDLEdBQUYsQ0FBTSxvRUFBa0UsVUFBeEUsQ0FBUDtBQUNBLENBRkQ7QUFHQTs7O0FBQ0EsR0FBRyxDQUFDLE1BQUosR0FBYSxVQUFTLElBQVQsRUFBZTtBQUMzQixTQUFPLENBQUMsQ0FBQyxHQUFGLENBQU0sV0FBVyxtQkFBTyxFQUFQLENBQVUsUUFBckIsR0FBZ0MsRUFBRSxDQUFDLElBQUgsQ0FBUSxNQUFSLENBQWUsSUFBZixFQUFxQjtBQUFDLElBQUEsTUFBTSxFQUFDO0FBQVIsR0FBckIsQ0FBdEMsRUFDTCxJQURLLENBQ0EsVUFBUyxJQUFULEVBQWU7QUFDcEIsUUFBSyxDQUFDLElBQU4sRUFBYTtBQUNaLGFBQU8sQ0FBQyxDQUFDLFFBQUYsR0FBYSxNQUFiLENBQW9CLGNBQXBCLENBQVA7QUFDQTs7QUFDRCxXQUFPLElBQVA7QUFDQSxHQU5LLENBQVA7QUFPQSxDQVJEOztBQVVBLElBQUksWUFBWSxHQUFHLFNBQWYsWUFBZSxDQUFTLEtBQVQsRUFBZ0IsTUFBaEIsRUFBd0I7QUFDMUMsTUFBSSxJQUFKLEVBQVUsR0FBVixFQUFlLE9BQWY7O0FBQ0EsTUFBSyxRQUFPLEtBQVAsTUFBaUIsUUFBakIsSUFBNkIsT0FBTyxNQUFQLEtBQWtCLFFBQXBELEVBQStEO0FBQzlEO0FBQ0EsUUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFDLFlBQU4sSUFBc0IsS0FBSyxDQUFDLFlBQU4sQ0FBbUIsS0FBeEQ7O0FBQ0EsUUFBSyxRQUFMLEVBQWdCO0FBQ2Y7QUFDQSxNQUFBLElBQUksR0FBRyxRQUFRLENBQUMsSUFBaEI7QUFDQSxNQUFBLE9BQU8sR0FBRyxRQUFRLENBQUMsT0FBbkI7QUFDQSxLQUpELE1BSU87QUFDTixNQUFBLEdBQUcsR0FBRyxLQUFOO0FBQ0E7QUFDRCxHQVZELE1BVU8sSUFBSyxPQUFPLEtBQVAsS0FBaUIsUUFBakIsSUFBNkIsUUFBTyxNQUFQLE1BQWtCLFFBQXBELEVBQStEO0FBQ3JFO0FBQ0EsUUFBSSxVQUFVLEdBQUcsTUFBTSxDQUFDLEtBQXhCOztBQUNBLFFBQUksVUFBSixFQUFnQjtBQUNmO0FBQ0EsTUFBQSxJQUFJLEdBQUcsUUFBUSxDQUFDLElBQWhCO0FBQ0EsTUFBQSxPQUFPLEdBQUcsUUFBUSxDQUFDLElBQW5CO0FBQ0EsS0FKRCxNQUlPLElBQUksS0FBSyxLQUFLLGNBQWQsRUFBOEI7QUFDcEMsTUFBQSxJQUFJLEdBQUcsSUFBUDtBQUNBLE1BQUEsT0FBTyxHQUFHLHVDQUFWO0FBQ0EsS0FITSxNQUdBO0FBQ04sTUFBQSxHQUFHLEdBQUcsTUFBTSxJQUFJLE1BQU0sQ0FBQyxHQUF2QjtBQUNBO0FBQ0Q7O0FBRUQsTUFBSSxJQUFJLElBQUksT0FBWixFQUFxQjtBQUNwQiwrQkFBb0IsSUFBcEIsZUFBNkIsT0FBN0I7QUFDQSxHQUZELE1BRU8sSUFBSSxPQUFKLEVBQWE7QUFDbkIsZ0NBQXFCLE9BQXJCO0FBQ0EsR0FGTSxNQUVBLElBQUksR0FBSixFQUFTO0FBQ2YsZ0NBQXFCLEdBQUcsQ0FBQyxNQUF6QjtBQUNBLEdBRk0sTUFFQSxJQUNOLE9BQU8sS0FBUCxLQUFpQixRQUFqQixJQUE2QixLQUFLLEtBQUssT0FBdkMsSUFDQSxPQUFPLE1BQVAsS0FBa0IsUUFEbEIsSUFDOEIsTUFBTSxLQUFLLE9BRm5DLEVBR0w7QUFDRCwyQkFBZ0IsS0FBaEIsZUFBMEIsTUFBMUI7QUFDQSxHQUxNLE1BS0EsSUFBSSxPQUFPLEtBQVAsS0FBaUIsUUFBakIsSUFBNkIsS0FBSyxLQUFLLE9BQTNDLEVBQW9EO0FBQzFELDRCQUFpQixLQUFqQjtBQUNBLEdBRk0sTUFFQTtBQUNOLFdBQU8sbUJBQVA7QUFDQTtBQUNELENBM0NEOzs7Ozs7Ozs7Ozs7QUMvQkE7O0FBQ0E7Ozs7QUFFQSxJQUFJLE9BQU8sR0FBRyxJQUFJLEVBQUUsQ0FBQyxPQUFQLEVBQWQsQyxDQUVBOztBQUNBLE9BQU8sQ0FBQyxRQUFSLENBQWlCLHNCQUFqQjtBQUNBLE9BQU8sQ0FBQyxRQUFSLENBQWlCLHNCQUFqQjtBQUVBLElBQUksT0FBTyxHQUFHLElBQUksRUFBRSxDQUFDLEVBQUgsQ0FBTSxhQUFWLENBQXlCO0FBQ3RDLGFBQVc7QUFEMkIsQ0FBekIsQ0FBZDtBQUdBLENBQUMsQ0FBRSxRQUFRLENBQUMsSUFBWCxDQUFELENBQW1CLE1BQW5CLENBQTJCLE9BQU8sQ0FBQyxRQUFuQztlQUVlLE8iLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJpbXBvcnQgc2V0dXBSYXRlciBmcm9tIFwiLi9zZXR1cFwiO1xyXG5pbXBvcnQgYXV0b1N0YXJ0IGZyb20gXCIuL2F1dG9zdGFydFwiO1xyXG5pbXBvcnQgZGlmZlN0eWxlcyBmcm9tIFwiLi9jc3MuanNcIjtcclxuaW1wb3J0IHsgbWFrZUVycm9yTXNnIH0gZnJvbSBcIi4vdXRpbFwiO1xyXG5pbXBvcnQgd2luZG93TWFuYWdlciBmcm9tIFwiLi93aW5kb3dNYW5hZ2VyXCI7XHJcblxyXG4oZnVuY3Rpb24gQXBwKCkge1xyXG5cdGNvbnNvbGUubG9nKFwiUmF0ZXIncyBBcHAuanMgaXMgcnVubmluZy4uLlwiKTtcclxuXHJcblx0bXcudXRpbC5hZGRDU1MoZGlmZlN0eWxlcyk7XHJcblxyXG5cdGNvbnN0IHNob3dNYWluV2luZG93ID0gZGF0YSA9PiB7XHJcblx0XHRpZiAoIWRhdGEgfHwgIWRhdGEuc3VjY2Vzcykge1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblxyXG5cdFx0d2luZG93TWFuYWdlci5vcGVuV2luZG93KFwibWFpblwiLCBkYXRhKTtcclxuXHR9O1xyXG5cclxuXHRjb25zdCBzaG93U2V0dXBFcnJvciA9IChjb2RlLCBqcXhocikgPT4gT08udWkuYWxlcnQoXHJcblx0XHRtYWtlRXJyb3JNc2coY29kZSwganF4aHIpLFx0e1xyXG5cdFx0XHR0aXRsZTogXCJSYXRlciBmYWlsZWQgdG8gb3BlblwiXHJcblx0XHR9XHJcblx0KTtcclxuXHJcblx0Ly8gSW52b2NhdGlvbiBieSBwb3J0bGV0IGxpbmsgXHJcblx0bXcudXRpbC5hZGRQb3J0bGV0TGluayhcclxuXHRcdFwicC1jYWN0aW9uc1wiLFxyXG5cdFx0XCIjXCIsXHJcblx0XHRcIlJhdGVyXCIsXHJcblx0XHRcImNhLXJhdGVyXCIsXHJcblx0XHRcIlJhdGUgcXVhbGl0eSBhbmQgaW1wb3J0YW5jZVwiLFxyXG5cdFx0XCI1XCJcclxuXHQpO1xyXG5cdCQoXCIjY2EtcmF0ZXJcIikuY2xpY2soKCkgPT4gc2V0dXBSYXRlcigpLnRoZW4oc2hvd01haW5XaW5kb3csIHNob3dTZXR1cEVycm9yKSApO1xyXG5cclxuXHQvLyBJbnZvY2F0aW9uIGJ5IGF1dG8tc3RhcnQgKGRvIG5vdCBzaG93IG1lc3NhZ2Ugb24gZXJyb3IpXHJcblx0YXV0b1N0YXJ0KCkudGhlbihzaG93TWFpbldpbmRvdyk7XHJcbn0pKCk7IiwiaW1wb3J0IHtBUEksIGlzQWZ0ZXJEYXRlfSBmcm9tIFwiLi91dGlsXCI7XHJcbmltcG9ydCBjb25maWcgZnJvbSBcIi4vY29uZmlnXCI7XHJcbmltcG9ydCAqIGFzIGNhY2hlIGZyb20gXCIuL2NhY2hlXCI7XHJcblxyXG4vKiogVGVtcGxhdGVcclxuICpcclxuICogQGNsYXNzXHJcbiAqIFJlcHJlc2VudHMgdGhlIHdpa2l0ZXh0IG9mIHRlbXBsYXRlIHRyYW5zY2x1c2lvbi4gVXNlZCBieSAjcGFyc2VUZW1wbGF0ZXMuXHJcbiAqIEBwcm9wIHtTdHJpbmd9IG5hbWUgTmFtZSBvZiB0aGUgdGVtcGxhdGVcclxuICogQHByb3Age1N0cmluZ30gd2lraXRleHQgRnVsbCB3aWtpdGV4dCBvZiB0aGUgdHJhbnNjbHVzaW9uXHJcbiAqIEBwcm9wIHtPYmplY3RbXX0gcGFyYW1ldGVycyBQYXJhbWV0ZXJzIHVzZWQgaW4gdGhlIHRyYW5zbGN1c2lvbiwgaW4gb3JkZXIsIG9mIGZvcm06XHJcblx0e1xyXG5cdFx0bmFtZToge1N0cmluZ3xOdW1iZXJ9IHBhcmFtZXRlciBuYW1lLCBvciBwb3NpdGlvbiBmb3IgdW5uYW1lZCBwYXJhbWV0ZXJzLFxyXG5cdFx0dmFsdWU6IHtTdHJpbmd9IFdpa2l0ZXh0IHBhc3NlZCB0byB0aGUgcGFyYW1ldGVyICh3aGl0ZXNwYWNlIHRyaW1tZWQpLFxyXG5cdFx0d2lraXRleHQ6IHtTdHJpbmd9IEZ1bGwgd2lraXRleHQgKGluY2x1ZGluZyBsZWFkaW5nIHBpcGUsIHBhcmFtZXRlciBuYW1lL2VxdWFscyBzaWduIChpZiBhcHBsaWNhYmxlKSwgdmFsdWUsIGFuZCBhbnkgd2hpdGVzcGFjZSlcclxuXHR9XHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0ge1N0cmluZ30gd2lraXRleHQgV2lraXRleHQgb2YgYSB0ZW1wbGF0ZSB0cmFuc2NsdXNpb24sIHN0YXJ0aW5nIHdpdGggJ3t7JyBhbmQgZW5kaW5nIHdpdGggJ319Jy5cclxuICovXHJcbnZhciBUZW1wbGF0ZSA9IGZ1bmN0aW9uKHdpa2l0ZXh0KSB7XHJcblx0dGhpcy53aWtpdGV4dCA9IHdpa2l0ZXh0O1xyXG5cdHRoaXMucGFyYW1ldGVycyA9IFtdO1xyXG59O1xyXG5UZW1wbGF0ZS5wcm90b3R5cGUuYWRkUGFyYW0gPSBmdW5jdGlvbihuYW1lLCB2YWwsIHdpa2l0ZXh0KSB7XHJcblx0dGhpcy5wYXJhbWV0ZXJzLnB1c2goe1xyXG5cdFx0XCJuYW1lXCI6IG5hbWUsXHJcblx0XHRcInZhbHVlXCI6IHZhbCwgXHJcblx0XHRcIndpa2l0ZXh0XCI6IFwifFwiICsgd2lraXRleHRcclxuXHR9KTtcclxufTtcclxuLyoqXHJcbiAqIEdldCBhIHBhcmFtZXRlciBkYXRhIGJ5IHBhcmFtZXRlciBuYW1lXHJcbiAqLyBcclxuVGVtcGxhdGUucHJvdG90eXBlLmdldFBhcmFtID0gZnVuY3Rpb24ocGFyYW1OYW1lKSB7XHJcblx0cmV0dXJuIHRoaXMucGFyYW1ldGVycy5maW5kKGZ1bmN0aW9uKHApIHsgcmV0dXJuIHAubmFtZSA9PSBwYXJhbU5hbWU7IH0pO1xyXG59O1xyXG5UZW1wbGF0ZS5wcm90b3R5cGUuc2V0TmFtZSA9IGZ1bmN0aW9uKG5hbWUpIHtcclxuXHR0aGlzLm5hbWUgPSBuYW1lLnRyaW0oKTtcclxufTtcclxuVGVtcGxhdGUucHJvdG90eXBlLmdldFRpdGxlID0gZnVuY3Rpb24oKSB7XHJcblx0cmV0dXJuIG13LlRpdGxlLm5ld0Zyb21UZXh0KFwiVGVtcGxhdGU6XCIgKyB0aGlzLm5hbWUpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIHBhcnNlVGVtcGxhdGVzXHJcbiAqXHJcbiAqIFBhcnNlcyB0ZW1wbGF0ZXMgZnJvbSB3aWtpdGV4dC5cclxuICogQmFzZWQgb24gU0QwMDAxJ3MgdmVyc2lvbiBhdCA8aHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvVXNlcjpTRDAwMDEvcGFyc2VBbGxUZW1wbGF0ZXMuanM+LlxyXG4gKiBSZXR1cm5zIGFuIGFycmF5IGNvbnRhaW5pbmcgdGhlIHRlbXBsYXRlIGRldGFpbHM6XHJcbiAqICB2YXIgdGVtcGxhdGVzID0gcGFyc2VUZW1wbGF0ZXMoXCJIZWxsbyB7e2ZvbyB8QmFyfGJhej1xdXggfDI9bG9yZW1pcHN1bXwzPX19IHdvcmxkXCIpO1xyXG4gKiAgY29uc29sZS5sb2codGVtcGxhdGVzWzBdKTsgLy8gLS0+IG9iamVjdFxyXG5cdHtcclxuXHRcdG5hbWU6IFwiZm9vXCIsXHJcblx0XHR3aWtpdGV4dDpcInt7Zm9vIHxCYXJ8YmF6PXF1eCB8IDIgPSBsb3JlbWlwc3VtICB8Mz19fVwiLFxyXG5cdFx0cGFyYW1ldGVyczogW1xyXG5cdFx0XHR7XHJcblx0XHRcdFx0bmFtZTogMSxcclxuXHRcdFx0XHR2YWx1ZTogJ0JhcicsXHJcblx0XHRcdFx0d2lraXRleHQ6ICd8QmFyJ1xyXG5cdFx0XHR9LFxyXG5cdFx0XHR7XHJcblx0XHRcdFx0bmFtZTogJ2JheicsXHJcblx0XHRcdFx0dmFsdWU6ICdxdXgnLFxyXG5cdFx0XHRcdHdpa2l0ZXh0OiAnfGJhej1xdXggJ1xyXG5cdFx0XHR9LFxyXG5cdFx0XHR7XHJcblx0XHRcdFx0bmFtZTogJzInLFxyXG5cdFx0XHRcdHZhbHVlOiAnbG9yZW1pcHN1bScsXHJcblx0XHRcdFx0d2lraXRleHQ6ICd8IDIgPSBsb3JlbWlwc3VtICAnXHJcblx0XHRcdH0sXHJcblx0XHRcdHtcclxuXHRcdFx0XHRuYW1lOiAnMycsXHJcblx0XHRcdFx0dmFsdWU6ICcnLFxyXG5cdFx0XHRcdHdpa2l0ZXh0OiAnfDM9J1xyXG5cdFx0XHR9XHJcblx0XHRdLFxyXG5cdFx0Z2V0UGFyYW06IGZ1bmN0aW9uKHBhcmFtTmFtZSkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5wYXJhbWV0ZXJzLmZpbmQoZnVuY3Rpb24ocCkgeyByZXR1cm4gcC5uYW1lID09IHBhcmFtTmFtZTsgfSk7XHJcblx0XHR9XHJcblx0fVxyXG4gKiAgICBcclxuICogXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSB3aWtpdGV4dFxyXG4gKiBAcGFyYW0ge0Jvb2xlYW59IHJlY3Vyc2l2ZSBTZXQgdG8gYHRydWVgIHRvIGFsc28gcGFyc2UgdGVtcGxhdGVzIHRoYXQgb2NjdXIgd2l0aGluIG90aGVyIHRlbXBsYXRlcyxcclxuICogIHJhdGhlciB0aGFuIGp1c3QgdG9wLWxldmVsIHRlbXBsYXRlcy4gXHJcbiAqIEByZXR1cm4ge1RlbXBsYXRlW119IHRlbXBsYXRlc1xyXG4qL1xyXG52YXIgcGFyc2VUZW1wbGF0ZXMgPSBmdW5jdGlvbih3aWtpdGV4dCwgcmVjdXJzaXZlKSB7IC8qIGVzbGludC1kaXNhYmxlIG5vLWNvbnRyb2wtcmVnZXggKi9cclxuXHRpZiAoIXdpa2l0ZXh0KSB7XHJcblx0XHRyZXR1cm4gW107XHJcblx0fVxyXG5cdHZhciBzdHJSZXBsYWNlQXQgPSBmdW5jdGlvbihzdHJpbmcsIGluZGV4LCBjaGFyKSB7XHJcblx0XHRyZXR1cm4gc3RyaW5nLnNsaWNlKDAsaW5kZXgpICsgY2hhciArIHN0cmluZy5zbGljZShpbmRleCArIDEpO1xyXG5cdH07XHJcblxyXG5cdHZhciByZXN1bHQgPSBbXTtcclxuXHRcclxuXHR2YXIgcHJvY2Vzc1RlbXBsYXRlVGV4dCA9IGZ1bmN0aW9uIChzdGFydElkeCwgZW5kSWR4KSB7XHJcblx0XHR2YXIgdGV4dCA9IHdpa2l0ZXh0LnNsaWNlKHN0YXJ0SWR4LCBlbmRJZHgpO1xyXG5cclxuXHRcdHZhciB0ZW1wbGF0ZSA9IG5ldyBUZW1wbGF0ZShcInt7XCIgKyB0ZXh0LnJlcGxhY2UoL1xceDAxL2csXCJ8XCIpICsgXCJ9fVwiKTtcclxuXHRcdFxyXG5cdFx0Ly8gc3dhcCBvdXQgcGlwZSBpbiBsaW5rcyB3aXRoIFxceDAxIGNvbnRyb2wgY2hhcmFjdGVyXHJcblx0XHQvLyBbW0ZpbGU6IF1dIGNhbiBoYXZlIG11bHRpcGxlIHBpcGVzLCBzbyBtaWdodCBuZWVkIG11bHRpcGxlIHBhc3Nlc1xyXG5cdFx0d2hpbGUgKCAvKFxcW1xcW1teXFxdXSo/KVxcfCguKj9cXF1cXF0pL2cudGVzdCh0ZXh0KSApIHtcclxuXHRcdFx0dGV4dCA9IHRleHQucmVwbGFjZSgvKFxcW1xcW1teXFxdXSo/KVxcfCguKj9cXF1cXF0pL2csIFwiJDFcXHgwMSQyXCIpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBjaHVua3MgPSB0ZXh0LnNwbGl0KFwifFwiKS5tYXAoZnVuY3Rpb24oY2h1bmspIHtcclxuXHRcdFx0Ly8gY2hhbmdlICdcXHgwMScgY29udHJvbCBjaGFyYWN0ZXJzIGJhY2sgdG8gcGlwZXNcclxuXHRcdFx0cmV0dXJuIGNodW5rLnJlcGxhY2UoL1xceDAxL2csXCJ8XCIpOyBcclxuXHRcdH0pO1xyXG5cclxuXHRcdHRlbXBsYXRlLnNldE5hbWUoY2h1bmtzWzBdKTtcclxuXHRcdFxyXG5cdFx0dmFyIHBhcmFtZXRlckNodW5rcyA9IGNodW5rcy5zbGljZSgxKTtcclxuXHJcblx0XHR2YXIgdW5uYW1lZElkeCA9IDE7XHJcblx0XHRwYXJhbWV0ZXJDaHVua3MuZm9yRWFjaChmdW5jdGlvbihjaHVuaykge1xyXG5cdFx0XHR2YXIgaW5kZXhPZkVxdWFsVG8gPSBjaHVuay5pbmRleE9mKFwiPVwiKTtcclxuXHRcdFx0dmFyIGluZGV4T2ZPcGVuQnJhY2VzID0gY2h1bmsuaW5kZXhPZihcInt7XCIpO1xyXG5cdFx0XHRcclxuXHRcdFx0dmFyIGlzV2l0aG91dEVxdWFscyA9ICFjaHVuay5pbmNsdWRlcyhcIj1cIik7XHJcblx0XHRcdHZhciBoYXNCcmFjZXNCZWZvcmVFcXVhbHMgPSBjaHVuay5pbmNsdWRlcyhcInt7XCIpICYmIGluZGV4T2ZPcGVuQnJhY2VzIDwgaW5kZXhPZkVxdWFsVG87XHRcclxuXHRcdFx0dmFyIGlzVW5uYW1lZFBhcmFtID0gKCBpc1dpdGhvdXRFcXVhbHMgfHwgaGFzQnJhY2VzQmVmb3JlRXF1YWxzICk7XHJcblx0XHRcdFxyXG5cdFx0XHR2YXIgcE5hbWUsIHBOdW0sIHBWYWw7XHJcblx0XHRcdGlmICggaXNVbm5hbWVkUGFyYW0gKSB7XHJcblx0XHRcdFx0Ly8gR2V0IHRoZSBuZXh0IG51bWJlciBub3QgYWxyZWFkeSB1c2VkIGJ5IGVpdGhlciBhbiB1bm5hbWVkIHBhcmFtZXRlciwgb3IgYnkgYVxyXG5cdFx0XHRcdC8vIG5hbWVkIHBhcmFtZXRlciBsaWtlIGB8MT12YWxgXHJcblx0XHRcdFx0d2hpbGUgKCB0ZW1wbGF0ZS5nZXRQYXJhbSh1bm5hbWVkSWR4KSApIHtcclxuXHRcdFx0XHRcdHVubmFtZWRJZHgrKztcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cE51bSA9IHVubmFtZWRJZHg7XHJcblx0XHRcdFx0cFZhbCA9IGNodW5rLnRyaW0oKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRwTmFtZSA9IGNodW5rLnNsaWNlKDAsIGluZGV4T2ZFcXVhbFRvKS50cmltKCk7XHJcblx0XHRcdFx0cFZhbCA9IGNodW5rLnNsaWNlKGluZGV4T2ZFcXVhbFRvICsgMSkudHJpbSgpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHRlbXBsYXRlLmFkZFBhcmFtKHBOYW1lIHx8IHBOdW0sIHBWYWwsIGNodW5rKTtcclxuXHRcdH0pO1xyXG5cdFx0XHJcblx0XHRyZXN1bHQucHVzaCh0ZW1wbGF0ZSk7XHJcblx0fTtcclxuXHJcblx0XHJcblx0dmFyIG4gPSB3aWtpdGV4dC5sZW5ndGg7XHJcblx0XHJcblx0Ly8gbnVtYmVyIG9mIHVuY2xvc2VkIGJyYWNlc1xyXG5cdHZhciBudW1VbmNsb3NlZCA9IDA7XHJcblxyXG5cdC8vIGFyZSB3ZSBpbnNpZGUgYSBjb21tZW50IG9yIGJldHdlZW4gbm93aWtpIHRhZ3M/XHJcblx0dmFyIGluQ29tbWVudCA9IGZhbHNlO1xyXG5cdHZhciBpbk5vd2lraSA9IGZhbHNlO1xyXG5cclxuXHR2YXIgc3RhcnRJZHgsIGVuZElkeDtcclxuXHRcclxuXHRmb3IgKHZhciBpPTA7IGk8bjsgaSsrKSB7XHJcblx0XHRcclxuXHRcdGlmICggIWluQ29tbWVudCAmJiAhaW5Ob3dpa2kgKSB7XHJcblx0XHRcdFxyXG5cdFx0XHRpZiAod2lraXRleHRbaV0gPT09IFwie1wiICYmIHdpa2l0ZXh0W2krMV0gPT09IFwie1wiKSB7XHJcblx0XHRcdFx0aWYgKG51bVVuY2xvc2VkID09PSAwKSB7XHJcblx0XHRcdFx0XHRzdGFydElkeCA9IGkrMjtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0bnVtVW5jbG9zZWQgKz0gMjtcclxuXHRcdFx0XHRpKys7XHJcblx0XHRcdH0gZWxzZSBpZiAod2lraXRleHRbaV0gPT09IFwifVwiICYmIHdpa2l0ZXh0W2krMV0gPT09IFwifVwiKSB7XHJcblx0XHRcdFx0aWYgKG51bVVuY2xvc2VkID09PSAyKSB7XHJcblx0XHRcdFx0XHRlbmRJZHggPSBpO1xyXG5cdFx0XHRcdFx0cHJvY2Vzc1RlbXBsYXRlVGV4dChzdGFydElkeCwgZW5kSWR4KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0bnVtVW5jbG9zZWQgLT0gMjtcclxuXHRcdFx0XHRpKys7XHJcblx0XHRcdH0gZWxzZSBpZiAod2lraXRleHRbaV0gPT09IFwifFwiICYmIG51bVVuY2xvc2VkID4gMikge1xyXG5cdFx0XHRcdC8vIHN3YXAgb3V0IHBpcGVzIGluIG5lc3RlZCB0ZW1wbGF0ZXMgd2l0aCBcXHgwMSBjaGFyYWN0ZXJcclxuXHRcdFx0XHR3aWtpdGV4dCA9IHN0clJlcGxhY2VBdCh3aWtpdGV4dCwgaSxcIlxceDAxXCIpO1xyXG5cdFx0XHR9IGVsc2UgaWYgKCAvXjwhLS0vLnRlc3Qod2lraXRleHQuc2xpY2UoaSwgaSArIDQpKSApIHtcclxuXHRcdFx0XHRpbkNvbW1lbnQgPSB0cnVlO1xyXG5cdFx0XHRcdGkgKz0gMztcclxuXHRcdFx0fSBlbHNlIGlmICggL148bm93aWtpID8+Ly50ZXN0KHdpa2l0ZXh0LnNsaWNlKGksIGkgKyA5KSkgKSB7XHJcblx0XHRcdFx0aW5Ob3dpa2kgPSB0cnVlO1xyXG5cdFx0XHRcdGkgKz0gNztcclxuXHRcdFx0fSBcclxuXHJcblx0XHR9IGVsc2UgeyAvLyB3ZSBhcmUgaW4gYSBjb21tZW50IG9yIG5vd2lraVxyXG5cdFx0XHRpZiAod2lraXRleHRbaV0gPT09IFwifFwiKSB7XHJcblx0XHRcdFx0Ly8gc3dhcCBvdXQgcGlwZXMgd2l0aCBcXHgwMSBjaGFyYWN0ZXJcclxuXHRcdFx0XHR3aWtpdGV4dCA9IHN0clJlcGxhY2VBdCh3aWtpdGV4dCwgaSxcIlxceDAxXCIpO1xyXG5cdFx0XHR9IGVsc2UgaWYgKC9eLS0+Ly50ZXN0KHdpa2l0ZXh0LnNsaWNlKGksIGkgKyAzKSkpIHtcclxuXHRcdFx0XHRpbkNvbW1lbnQgPSBmYWxzZTtcclxuXHRcdFx0XHRpICs9IDI7XHJcblx0XHRcdH0gZWxzZSBpZiAoL148XFwvbm93aWtpID8+Ly50ZXN0KHdpa2l0ZXh0LnNsaWNlKGksIGkgKyAxMCkpKSB7XHJcblx0XHRcdFx0aW5Ob3dpa2kgPSBmYWxzZTtcclxuXHRcdFx0XHRpICs9IDg7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0fVxyXG5cdFxyXG5cdGlmICggcmVjdXJzaXZlICkge1xyXG5cdFx0dmFyIHN1YnRlbXBsYXRlcyA9IHJlc3VsdC5tYXAoZnVuY3Rpb24odGVtcGxhdGUpIHtcclxuXHRcdFx0cmV0dXJuIHRlbXBsYXRlLndpa2l0ZXh0LnNsaWNlKDIsLTIpO1xyXG5cdFx0fSlcclxuXHRcdFx0LmZpbHRlcihmdW5jdGlvbih0ZW1wbGF0ZVdpa2l0ZXh0KSB7XHJcblx0XHRcdFx0cmV0dXJuIC9cXHtcXHsuKlxcfVxcfS8udGVzdCh0ZW1wbGF0ZVdpa2l0ZXh0KTtcclxuXHRcdFx0fSlcclxuXHRcdFx0Lm1hcChmdW5jdGlvbih0ZW1wbGF0ZVdpa2l0ZXh0KSB7XHJcblx0XHRcdFx0cmV0dXJuIHBhcnNlVGVtcGxhdGVzKHRlbXBsYXRlV2lraXRleHQsIHRydWUpO1xyXG5cdFx0XHR9KTtcclxuXHRcdFxyXG5cdFx0cmV0dXJuIHJlc3VsdC5jb25jYXQuYXBwbHkocmVzdWx0LCBzdWJ0ZW1wbGF0ZXMpO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIHJlc3VsdDsgXHJcbn07IC8qIGVzbGludC1lbmFibGUgbm8tY29udHJvbC1yZWdleCAqL1xyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSB7VGVtcGxhdGV8VGVtcGxhdGVbXX0gdGVtcGxhdGVzXHJcbiAqIEByZXR1cm4ge1Byb21pc2U8VGVtcGxhdGU+fFByb21pc2U8VGVtcGxhdGVbXT59XHJcbiAqL1xyXG52YXIgZ2V0V2l0aFJlZGlyZWN0VG8gPSBmdW5jdGlvbih0ZW1wbGF0ZXMpIHtcclxuXHR2YXIgdGVtcGxhdGVzQXJyYXkgPSBBcnJheS5pc0FycmF5KHRlbXBsYXRlcykgPyB0ZW1wbGF0ZXMgOiBbdGVtcGxhdGVzXTtcclxuXHRpZiAodGVtcGxhdGVzQXJyYXkubGVuZ3RoID09PSAwKSB7XHJcblx0XHRyZXR1cm4gJC5EZWZlcnJlZCgpLnJlc29sdmUoW10pO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIEFQSS5nZXQoe1xyXG5cdFx0XCJhY3Rpb25cIjogXCJxdWVyeVwiLFxyXG5cdFx0XCJmb3JtYXRcIjogXCJqc29uXCIsXHJcblx0XHRcInRpdGxlc1wiOiB0ZW1wbGF0ZXNBcnJheS5tYXAodGVtcGxhdGUgPT4gdGVtcGxhdGUuZ2V0VGl0bGUoKS5nZXRQcmVmaXhlZFRleHQoKSksXHJcblx0XHRcInJlZGlyZWN0c1wiOiAxXHJcblx0fSkudGhlbihmdW5jdGlvbihyZXN1bHQpIHtcclxuXHRcdGlmICggIXJlc3VsdCB8fCAhcmVzdWx0LnF1ZXJ5ICkge1xyXG5cdFx0XHRyZXR1cm4gJC5EZWZlcnJlZCgpLnJlamVjdChcIkVtcHR5IHJlc3BvbnNlXCIpO1xyXG5cdFx0fVxyXG5cdFx0aWYgKCByZXN1bHQucXVlcnkucmVkaXJlY3RzICkge1xyXG5cdFx0XHRyZXN1bHQucXVlcnkucmVkaXJlY3RzLmZvckVhY2goZnVuY3Rpb24ocmVkaXJlY3QpIHtcclxuXHRcdFx0XHR2YXIgaSA9IHRlbXBsYXRlc0FycmF5LmZpbmRJbmRleCh0ZW1wbGF0ZSA9PiB0ZW1wbGF0ZS5nZXRUaXRsZSgpLmdldFByZWZpeGVkVGV4dCgpID09PSByZWRpcmVjdC5mcm9tKTtcclxuXHRcdFx0XHRpZiAoaSAhPT0gLTEpIHtcclxuXHRcdFx0XHRcdHRlbXBsYXRlc0FycmF5W2ldLnJlZGlyZWN0VGFyZ2V0ID0gbXcuVGl0bGUubmV3RnJvbVRleHQocmVkaXJlY3QudG8pO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gQXJyYXkuaXNBcnJheSh0ZW1wbGF0ZXMpID8gdGVtcGxhdGVzQXJyYXkgOiB0ZW1wbGF0ZXNBcnJheVswXTtcclxuXHR9KTtcclxufTtcclxuXHJcblRlbXBsYXRlLnByb3RvdHlwZS5nZXREYXRhRm9yUGFyYW0gPSBmdW5jdGlvbihrZXksIHBhcmFOYW1lKSB7XHJcblx0aWYgKCAhdGhpcy5wYXJhbURhdGEgKSB7XHJcblx0XHRyZXR1cm4gbnVsbDtcclxuXHR9XHJcblx0Ly8gSWYgYWxpYXMsIHN3aXRjaCBmcm9tIGFsaWFzIHRvIHByZWZlcnJlZCBwYXJhbWV0ZXIgbmFtZVxyXG5cdHZhciBwYXJhID0gdGhpcy5wYXJhbUFsaWFzZXNbcGFyYU5hbWVdIHx8IHBhcmFOYW1lO1x0XHJcblx0aWYgKCAhdGhpcy5wYXJhbURhdGFbcGFyYV0gKSB7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cdFxyXG5cdHZhciBkYXRhID0gdGhpcy5wYXJhbURhdGFbcGFyYV1ba2V5XTtcclxuXHQvLyBEYXRhIG1pZ2h0IGFjdHVhbGx5IGJlIGFuIG9iamVjdCB3aXRoIGtleSBcImVuXCJcclxuXHRpZiAoIGRhdGEgJiYgZGF0YS5lbiAmJiAhQXJyYXkuaXNBcnJheShkYXRhKSApIHtcclxuXHRcdHJldHVybiBkYXRhLmVuO1xyXG5cdH1cclxuXHRyZXR1cm4gZGF0YTtcclxufTtcclxuXHJcblRlbXBsYXRlLnByb3RvdHlwZS5zZXRQYXJhbURhdGFBbmRTdWdnZXN0aW9ucyA9IGZ1bmN0aW9uKCkge1xyXG5cdHZhciBzZWxmID0gdGhpcztcclxuXHR2YXIgcGFyYW1EYXRhU2V0ID0gJC5EZWZlcnJlZCgpO1xyXG5cdFxyXG5cdGlmICggc2VsZi5wYXJhbURhdGEgKSB7IHJldHVybiBwYXJhbURhdGFTZXQucmVzb2x2ZSgpOyB9XHJcbiAgICBcclxuXHR2YXIgcHJlZml4ZWRUZXh0ID0gc2VsZi5yZWRpcmVjdFRhcmdldFxyXG5cdFx0PyBzZWxmLnJlZGlyZWN0VGFyZ2V0LmdldFByZWZpeGVkVGV4dCgpXHJcblx0XHQ6IHNlbGYuZ2V0VGl0bGUoKS5nZXRQcmVmaXhlZFRleHQoKTtcclxuXHJcblx0dmFyIGNhY2hlZEluZm8gPSBjYWNoZS5yZWFkKHByZWZpeGVkVGV4dCArIFwiLXBhcmFtc1wiKTtcclxuXHRcclxuXHRpZiAoXHJcblx0XHRjYWNoZWRJbmZvICYmXHJcblx0XHRjYWNoZWRJbmZvLnZhbHVlICYmXHJcblx0XHRjYWNoZWRJbmZvLnN0YWxlRGF0ZSAmJlxyXG5cdFx0Y2FjaGVkSW5mby52YWx1ZS5wYXJhbURhdGEgIT0gbnVsbCAmJlxyXG5cdFx0Y2FjaGVkSW5mby52YWx1ZS5wYXJhbWV0ZXJTdWdnZXN0aW9ucyAhPSBudWxsICYmXHJcblx0XHRjYWNoZWRJbmZvLnZhbHVlLnBhcmFtQWxpYXNlcyAhPSBudWxsXHJcblx0KSB7XHJcblx0XHRzZWxmLm5vdGVtcGxhdGVkYXRhID0gY2FjaGVkSW5mby52YWx1ZS5ub3RlbXBsYXRlZGF0YTtcclxuXHRcdHNlbGYucGFyYW1EYXRhID0gY2FjaGVkSW5mby52YWx1ZS5wYXJhbURhdGE7XHJcblx0XHRzZWxmLnBhcmFtZXRlclN1Z2dlc3Rpb25zID0gY2FjaGVkSW5mby52YWx1ZS5wYXJhbWV0ZXJTdWdnZXN0aW9ucztcclxuXHRcdHNlbGYucGFyYW1BbGlhc2VzID0gY2FjaGVkSW5mby52YWx1ZS5wYXJhbUFsaWFzZXM7XHJcblx0XHRcclxuXHRcdHBhcmFtRGF0YVNldC5yZXNvbHZlKCk7XHJcblx0XHRpZiAoICFpc0FmdGVyRGF0ZShjYWNoZWRJbmZvLnN0YWxlRGF0ZSkgKSB7XHJcblx0XHRcdC8vIEp1c3QgdXNlIHRoZSBjYWNoZWQgZGF0YVxyXG5cdFx0XHRyZXR1cm4gcGFyYW1EYXRhU2V0O1xyXG5cdFx0fSAvLyBlbHNlOiBVc2UgdGhlIGNhY2hlIGRhdGEgZm9yIG5vdywgYnV0IGFsc28gZmV0Y2ggbmV3IGRhdGEgZnJvbSBBUElcclxuXHR9XHJcblx0XHJcblx0QVBJLmdldCh7XHJcblx0XHRhY3Rpb246IFwidGVtcGxhdGVkYXRhXCIsXHJcblx0XHR0aXRsZXM6IHByZWZpeGVkVGV4dCxcclxuXHRcdHJlZGlyZWN0czogMSxcclxuXHRcdGluY2x1ZGVNaXNzaW5nVGl0bGVzOiAxXHJcblx0fSlcclxuXHRcdC50aGVuKFxyXG5cdFx0XHRmdW5jdGlvbihyZXNwb25zZSkgeyByZXR1cm4gcmVzcG9uc2U7IH0sXHJcblx0XHRcdGZ1bmN0aW9uKC8qZXJyb3IqLykgeyByZXR1cm4gbnVsbDsgfSAvLyBJZ25vcmUgZXJyb3JzLCB3aWxsIHVzZSBkZWZhdWx0IGRhdGFcclxuXHRcdClcclxuXHRcdC50aGVuKCBmdW5jdGlvbihyZXN1bHQpIHtcclxuXHRcdC8vIEZpZ3VyZSBvdXQgcGFnZSBpZCAoYmVhY3VzZSBhY3Rpb249dGVtcGxhdGVkYXRhIGRvZXNuJ3QgaGF2ZSBhbiBpbmRleHBhZ2VpZHMgb3B0aW9uKVxyXG5cdFx0XHR2YXIgaWQgPSByZXN1bHQgJiYgJC5tYXAocmVzdWx0LnBhZ2VzLCBmdW5jdGlvbiggX3ZhbHVlLCBrZXkgKSB7IHJldHVybiBrZXk7IH0pO1xyXG5cdFx0XHJcblx0XHRcdGlmICggIXJlc3VsdCB8fCAhcmVzdWx0LnBhZ2VzW2lkXSB8fCByZXN1bHQucGFnZXNbaWRdLm5vdGVtcGxhdGVkYXRhIHx8ICFyZXN1bHQucGFnZXNbaWRdLnBhcmFtcyApIHtcclxuXHRcdFx0Ly8gTm8gVGVtcGxhdGVEYXRhLCBzbyB1c2UgZGVmYXVsdHMgKGd1ZXNzZXMpXHJcblx0XHRcdFx0c2VsZi5ub3RlbXBsYXRlZGF0YSA9IHRydWU7XHJcblx0XHRcdFx0c2VsZi50ZW1wbGF0ZWRhdGFBcGlFcnJvciA9ICFyZXN1bHQ7XHJcblx0XHRcdFx0c2VsZi5wYXJhbURhdGEgPSBjb25maWcuZGVmYXVsdFBhcmFtZXRlckRhdGE7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0c2VsZi5wYXJhbURhdGEgPSByZXN1bHQucGFnZXNbaWRdLnBhcmFtcztcclxuXHRcdFx0fVxyXG4gICAgICAgIFxyXG5cdFx0XHRzZWxmLnBhcmFtQWxpYXNlcyA9IHt9O1xyXG5cdFx0XHQkLmVhY2goc2VsZi5wYXJhbURhdGEsIGZ1bmN0aW9uKHBhcmFOYW1lLCBwYXJhRGF0YSkge1xyXG5cdFx0XHRcdC8vIEV4dHJhY3QgYWxpYXNlcyBmb3IgZWFzaWVyIHJlZmVyZW5jZSBsYXRlciBvblxyXG5cdFx0XHRcdGlmICggcGFyYURhdGEuYWxpYXNlcyAmJiBwYXJhRGF0YS5hbGlhc2VzLmxlbmd0aCApIHtcclxuXHRcdFx0XHRcdHBhcmFEYXRhLmFsaWFzZXMuZm9yRWFjaChmdW5jdGlvbihhbGlhcyl7XHJcblx0XHRcdFx0XHRcdHNlbGYucGFyYW1BbGlhc2VzW2FsaWFzXSA9IHBhcmFOYW1lO1xyXG5cdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdC8vIEV4dHJhY3QgYWxsb3dlZCB2YWx1ZXMgYXJyYXkgZnJvbSBkZXNjcmlwdGlvblxyXG5cdFx0XHRcdGlmICggcGFyYURhdGEuZGVzY3JpcHRpb24gJiYgL1xcWy4qJy4rPycuKj9cXF0vLnRlc3QocGFyYURhdGEuZGVzY3JpcHRpb24uZW4pICkge1xyXG5cdFx0XHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRcdFx0dmFyIGFsbG93ZWRWYWxzID0gSlNPTi5wYXJzZShcclxuXHRcdFx0XHRcdFx0XHRwYXJhRGF0YS5kZXNjcmlwdGlvbi5lblxyXG5cdFx0XHRcdFx0XHRcdFx0LnJlcGxhY2UoL14uKlxcWy8sXCJbXCIpXHJcblx0XHRcdFx0XHRcdFx0XHQucmVwbGFjZSgvXCIvZywgXCJcXFxcXFxcIlwiKVxyXG5cdFx0XHRcdFx0XHRcdFx0LnJlcGxhY2UoLycvZywgXCJcXFwiXCIpXHJcblx0XHRcdFx0XHRcdFx0XHQucmVwbGFjZSgvLFxccypdLywgXCJdXCIpXHJcblx0XHRcdFx0XHRcdFx0XHQucmVwbGFjZSgvXS4qJC8sIFwiXVwiKVxyXG5cdFx0XHRcdFx0XHQpO1xyXG5cdFx0XHRcdFx0XHRzZWxmLnBhcmFtRGF0YVtwYXJhTmFtZV0uYWxsb3dlZFZhbHVlcyA9IGFsbG93ZWRWYWxzO1xyXG5cdFx0XHRcdFx0fSBjYXRjaChlKSB7XHJcblx0XHRcdFx0XHRcdGNvbnNvbGUud2FybihcIltSYXRlcl0gQ291bGQgbm90IHBhcnNlIGFsbG93ZWQgdmFsdWVzIGluIGRlc2NyaXB0aW9uOlxcbiAgXCIrXHJcblx0XHRcdFx0XHRwYXJhRGF0YS5kZXNjcmlwdGlvbi5lbiArIFwiXFxuIENoZWNrIFRlbXBsYXRlRGF0YSBmb3IgcGFyYW1ldGVyIHxcIiArIHBhcmFOYW1lICtcclxuXHRcdFx0XHRcdFwiPSBpbiBcIiArIHNlbGYuZ2V0VGl0bGUoKS5nZXRQcmVmaXhlZFRleHQoKSk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdC8vIE1ha2Ugc3VyZSByZXF1aXJlZC9zdWdnZXN0ZWQgcGFyYW1ldGVycyBhcmUgcHJlc2VudFxyXG5cdFx0XHRcdGlmICggKHBhcmFEYXRhLnJlcXVpcmVkIHx8IHBhcmFEYXRhLnN1Z2dlc3RlZCkgJiYgIXNlbGYuZ2V0UGFyYW0ocGFyYU5hbWUpICkge1xyXG5cdFx0XHRcdC8vIENoZWNrIGlmIGFscmVhZHkgcHJlc2VudCBpbiBhbiBhbGlhcywgaWYgYW55XHJcblx0XHRcdFx0XHRpZiAoIHBhcmFEYXRhLmFsaWFzZXMubGVuZ3RoICkge1xyXG5cdFx0XHRcdFx0XHR2YXIgYWxpYXNlcyA9IHNlbGYucGFyYW1ldGVycy5maWx0ZXIocCA9PiB7XHJcblx0XHRcdFx0XHRcdFx0dmFyIGlzQWxpYXMgPSBwYXJhRGF0YS5hbGlhc2VzLmluY2x1ZGVzKHAubmFtZSk7XHJcblx0XHRcdFx0XHRcdFx0dmFyIGlzRW1wdHkgPSAhcC52YWw7XHJcblx0XHRcdFx0XHRcdFx0cmV0dXJuIGlzQWxpYXMgJiYgIWlzRW1wdHk7XHJcblx0XHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdFx0XHRpZiAoIGFsaWFzZXMubGVuZ3RoICkge1xyXG5cdFx0XHRcdFx0XHQvLyBBdCBsZWFzdCBvbmUgbm9uLWVtcHR5IGFsaWFzLCBzbyBkbyBub3RoaW5nXHJcblx0XHRcdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHQvLyBObyBub24tZW1wdHkgYWxpYXNlcywgc28gc2V0IHBhcmFtZXRlciB0byBlaXRoZXIgdGhlIGF1dG92YXVsZSwgb3JcclxuXHRcdFx0XHRcdC8vIGFuIGVtcHR5IHN0cmluZyAod2l0aG91dCB0b3VjaGluZywgdW5sZXNzIGl0IGlzIGEgcmVxdWlyZWQgcGFyYW1ldGVyKVxyXG5cdFx0XHRcdFx0c2VsZi5wYXJhbWV0ZXJzLnB1c2goe1xyXG5cdFx0XHRcdFx0XHRuYW1lOnBhcmFOYW1lLFxyXG5cdFx0XHRcdFx0XHR2YWx1ZTogcGFyYURhdGEuYXV0b3ZhbHVlIHx8IFwiXCIsXHJcblx0XHRcdFx0XHRcdGF1dG9maWxsZWQ6IHRydWVcclxuXHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHRcclxuXHRcdFx0Ly8gTWFrZSBzdWdnZXN0aW9ucyBmb3IgY29tYm9ib3hcclxuXHRcdFx0dmFyIGFsbFBhcmFtc0FycmF5ID0gKCAhc2VsZi5ub3RlbXBsYXRlZGF0YSAmJiByZXN1bHQucGFnZXNbaWRdLnBhcmFtT3JkZXIgKSB8fFxyXG5cdFx0XHQkLm1hcChzZWxmLnBhcmFtRGF0YSwgZnVuY3Rpb24oX3ZhbCwga2V5KXtcclxuXHRcdFx0XHRyZXR1cm4ga2V5O1xyXG5cdFx0XHR9KTtcclxuXHRcdFx0c2VsZi5wYXJhbWV0ZXJTdWdnZXN0aW9ucyA9IGFsbFBhcmFtc0FycmF5LmZpbHRlcihmdW5jdGlvbihwYXJhbU5hbWUpIHtcclxuXHRcdFx0XHRyZXR1cm4gKCBwYXJhbU5hbWUgJiYgcGFyYW1OYW1lICE9PSBcImNsYXNzXCIgJiYgcGFyYW1OYW1lICE9PSBcImltcG9ydGFuY2VcIiApO1xyXG5cdFx0XHR9KVxyXG5cdFx0XHRcdC5tYXAoZnVuY3Rpb24ocGFyYW1OYW1lKSB7XHJcblx0XHRcdFx0XHR2YXIgb3B0aW9uT2JqZWN0ID0ge2RhdGE6IHBhcmFtTmFtZX07XHJcblx0XHRcdFx0XHR2YXIgbGFiZWwgPSBzZWxmLmdldERhdGFGb3JQYXJhbShsYWJlbCwgcGFyYW1OYW1lKTtcclxuXHRcdFx0XHRcdGlmICggbGFiZWwgKSB7XHJcblx0XHRcdFx0XHRcdG9wdGlvbk9iamVjdC5sYWJlbCA9IGxhYmVsICsgXCIgKHxcIiArIHBhcmFtTmFtZSArIFwiPSlcIjtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdHJldHVybiBvcHRpb25PYmplY3Q7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcclxuXHRcdFx0aWYgKCBzZWxmLnRlbXBsYXRlZGF0YUFwaUVycm9yICkge1xyXG5cdFx0XHRcdC8vIERvbid0IHNhdmUgZGVmYXVsdHMvZ3Vlc3NlcyB0byBjYWNoZTtcclxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0fVxyXG5cdFx0XHJcblx0XHRcdGNhY2hlLndyaXRlKHByZWZpeGVkVGV4dCArIFwiLXBhcmFtc1wiLCB7XHJcblx0XHRcdFx0bm90ZW1wbGF0ZWRhdGE6IHNlbGYubm90ZW1wbGF0ZWRhdGEsXHJcblx0XHRcdFx0cGFyYW1EYXRhOiBzZWxmLnBhcmFtRGF0YSxcclxuXHRcdFx0XHRwYXJhbWV0ZXJTdWdnZXN0aW9uczogc2VsZi5wYXJhbWV0ZXJTdWdnZXN0aW9ucyxcclxuXHRcdFx0XHRwYXJhbUFsaWFzZXM6IHNlbGYucGFyYW1BbGlhc2VzXHJcblx0XHRcdH0sXHQxXHJcblx0XHRcdCk7XHJcblx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0fSlcclxuXHRcdC50aGVuKFxyXG5cdFx0XHRwYXJhbURhdGFTZXQucmVzb2x2ZSxcclxuXHRcdFx0cGFyYW1EYXRhU2V0LnJlamVjdFxyXG5cdFx0KTtcclxuXHRcclxuXHRyZXR1cm4gcGFyYW1EYXRhU2V0O1x0XHJcbn07XHJcblxyXG5UZW1wbGF0ZS5wcm90b3R5cGUuc2V0Q2xhc3Nlc0FuZEltcG9ydGFuY2VzID0gZnVuY3Rpb24oKSB7XHJcblx0dmFyIHBhcnNlZCA9ICQuRGVmZXJyZWQoKTtcclxuXHRcclxuXHRpZiAoIHRoaXMuY2xhc3NlcyAmJiB0aGlzLmltcG9ydGFuY2VzICkge1xyXG5cdFx0cmV0dXJuIHBhcnNlZC5yZXNvbHZlKCk7XHJcblx0fVxyXG5cclxuXHR2YXIgbWFpblRleHQgPSB0aGlzLmdldFRpdGxlKCkuZ2V0TWFpblRleHQoKTtcclxuXHRcclxuXHR2YXIgY2FjaGVkUmF0aW5ncyA9IGNhY2hlLnJlYWQobWFpblRleHQrXCItcmF0aW5nc1wiKTtcclxuXHRpZiAoXHJcblx0XHRjYWNoZWRSYXRpbmdzICYmXHJcblx0XHRjYWNoZWRSYXRpbmdzLnZhbHVlICYmXHJcblx0XHRjYWNoZWRSYXRpbmdzLnN0YWxlRGF0ZSAmJlxyXG5cdFx0Y2FjaGVkUmF0aW5ncy52YWx1ZS5jbGFzc2VzIT1udWxsICYmXHJcblx0XHRjYWNoZWRSYXRpbmdzLnZhbHVlLmltcG9ydGFuY2VzIT1udWxsXHJcblx0KSB7XHJcblx0XHR0aGlzLmNsYXNzZXMgPSBjYWNoZWRSYXRpbmdzLnZhbHVlLmNsYXNzZXM7XHJcblx0XHR0aGlzLmltcG9ydGFuY2VzID0gY2FjaGVkUmF0aW5ncy52YWx1ZS5pbXBvcnRhbmNlcztcclxuXHRcdHBhcnNlZC5yZXNvbHZlKCk7XHJcblx0XHRpZiAoICFpc0FmdGVyRGF0ZShjYWNoZWRSYXRpbmdzLnN0YWxlRGF0ZSkgKSB7XHJcblx0XHRcdC8vIEp1c3QgdXNlIHRoZSBjYWNoZWQgZGF0YVxyXG5cdFx0XHRyZXR1cm4gcGFyc2VkO1xyXG5cdFx0fSAvLyBlbHNlOiBVc2UgdGhlIGNhY2hlIGRhdGEgZm9yIG5vdywgYnV0IGFsc28gZmV0Y2ggbmV3IGRhdGEgZnJvbSBBUElcclxuXHR9XHJcblx0XHJcblx0dmFyIHdpa2l0ZXh0VG9QYXJzZSA9IFwiXCI7XHRcclxuXHRjb25maWcuYmFubmVyRGVmYXVsdHMuZXh0ZW5kZWRDbGFzc2VzLmZvckVhY2goZnVuY3Rpb24oY2xhc3NuYW1lLCBpbmRleCkge1xyXG5cdFx0d2lraXRleHRUb1BhcnNlICs9IFwie3tcIiArIG1haW5UZXh0ICsgXCJ8Y2xhc3M9XCIgKyBjbGFzc25hbWUgKyBcInxpbXBvcnRhbmNlPVwiICtcclxuXHRcdChjb25maWcuYmFubmVyRGVmYXVsdHMuZXh0ZW5kZWRJbXBvcnRhbmNlc1tpbmRleF0gfHwgXCJcIikgKyBcIn19L25cIjtcclxuXHR9KTtcclxuXHRcclxuXHRyZXR1cm4gQVBJLmdldCh7XHJcblx0XHRhY3Rpb246IFwicGFyc2VcIixcclxuXHRcdHRpdGxlOiBcIlRhbGs6U2FuZGJveFwiLFxyXG5cdFx0dGV4dDogd2lraXRleHRUb1BhcnNlLFxyXG5cdFx0cHJvcDogXCJjYXRlZ29yaWVzaHRtbFwiXHJcblx0fSlcclxuXHRcdC50aGVuKChyZXN1bHQpID0+IHtcclxuXHRcdFx0dmFyIHJlZGlyZWN0T3JNYWluVGV4dCA9IHRoaXMucmVkaXJlY3RUYXJnZXQgPyB0aGlzLnJlZGlyZWN0VGFyZ2V0LmdldE1haW5UZXh0KCkgOiBtYWluVGV4dDtcclxuXHRcdFx0dmFyIGNhdHNIdG1sID0gcmVzdWx0LnBhcnNlLmNhdGVnb3JpZXNodG1sW1wiKlwiXTtcclxuXHRcdFx0dmFyIGV4dGVuZGVkQ2xhc3NlcyA9IGNvbmZpZy5iYW5uZXJEZWZhdWx0cy5leHRlbmRlZENsYXNzZXMuZmlsdGVyKGZ1bmN0aW9uKGNsKSB7XHJcblx0XHRcdFx0cmV0dXJuIGNhdHNIdG1sLmluZGV4T2YoY2wrXCItQ2xhc3NcIikgIT09IC0xO1xyXG5cdFx0XHR9KTtcclxuXHRcdFx0dmFyIGRlZmF1bHRDbGFzc2VzID0gKCByZWRpcmVjdE9yTWFpblRleHQgPT09IFwiV2lraVByb2plY3QgUG9ydGFsc1wiIClcclxuXHRcdFx0XHQ/IFtcIkxpc3RcIl1cclxuXHRcdFx0XHQ6IGNvbmZpZy5iYW5uZXJEZWZhdWx0cy5jbGFzc2VzO1xyXG5cdFx0XHR2YXIgY3VzdG9tQ2xhc3NlcyA9IGNvbmZpZy5jdXN0b21DbGFzc2VzW3JlZGlyZWN0T3JNYWluVGV4dF0gfHwgW107XHJcblx0XHRcdHRoaXMuY2xhc3NlcyA9IFtdLmNvbmNhdChcclxuXHRcdFx0XHRjdXN0b21DbGFzc2VzLFxyXG5cdFx0XHRcdGRlZmF1bHRDbGFzc2VzLFxyXG5cdFx0XHRcdGV4dGVuZGVkQ2xhc3Nlc1xyXG5cdFx0XHQpO1xyXG5cclxuXHRcdFx0dGhpcy5pbXBvcnRhbmNlcyA9IGNvbmZpZy5iYW5uZXJEZWZhdWx0cy5leHRlbmRlZEltcG9ydGFuY2VzLmZpbHRlcihmdW5jdGlvbihpbXApIHtcclxuXHRcdFx0XHRyZXR1cm4gY2F0c0h0bWwuaW5kZXhPZihpbXArXCItaW1wb3J0YW5jZVwiKSAhPT0gLTE7XHJcblx0XHRcdH0pO1xyXG5cdFx0XHRjYWNoZS53cml0ZShtYWluVGV4dCtcIi1yYXRpbmdzXCIsXHJcblx0XHRcdFx0e1xyXG5cdFx0XHRcdFx0Y2xhc3NlczogdGhpcy5jbGFzc2VzLFxyXG5cdFx0XHRcdFx0aW1wb3J0YW5jZXM6IHRoaXMuaW1wb3J0YW5jZXNcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdDFcclxuXHRcdFx0KTtcclxuXHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHR9KTtcclxufTtcclxuXHJcbmV4cG9ydCB7VGVtcGxhdGUsIHBhcnNlVGVtcGxhdGVzLCBnZXRXaXRoUmVkaXJlY3RUb307IiwidmFyIEJhbm5lckxpc3RXaWRnZXQgPSBmdW5jdGlvbiBCYW5uZXJMaXN0V2lkZ2V0KCBjb25maWcgKSB7XHJcblx0Y29uZmlnID0gY29uZmlnIHx8IHt9O1xyXG5cclxuXHQvLyBDYWxsIHBhcmVudCBjb25zdHJ1Y3RvclxyXG5cdEJhbm5lckxpc3RXaWRnZXQucGFyZW50LmNhbGwoIHRoaXMsIGNvbmZpZyApO1xyXG5cdE9PLnVpLm1peGluLkdyb3VwRWxlbWVudC5jYWxsKCB0aGlzLCB7XHJcblx0XHQkZ3JvdXA6IHRoaXMuJGVsZW1lbnRcclxuXHR9ICk7XHJcblxyXG5cdHRoaXMuJGVsZW1lbnQuY3NzKHtcInBhZGRpbmdcIjpcIjIwcHggMTBweCAxNnB4IDEwcHhcIn0pO1xyXG5cclxuXHR0aGlzLmFnZ3JlZ2F0ZSgge1xyXG5cdFx0cmVtb3ZlOiBcImJhbm5lclJlbW92ZVwiXHJcblx0fSApO1xyXG5cclxuXHR0aGlzLmNvbm5lY3QoIHRoaXMsIHtcclxuXHRcdGJhbm5lclJlbW92ZTogXCJvbkJhbm5lclJlbW92ZVwiXHJcblx0fSApO1xyXG59O1xyXG5cclxuT08uaW5oZXJpdENsYXNzKCBCYW5uZXJMaXN0V2lkZ2V0LCBPTy51aS5XaWRnZXQgKTtcclxuT08ubWl4aW5DbGFzcyggQmFubmVyTGlzdFdpZGdldCwgT08udWkubWl4aW4uR3JvdXBFbGVtZW50ICk7XHJcbi8qXHJcbm1ldGhvZHMgZnJvbSBtaXhpbjpcclxuIC0gYWRkSXRlbXMoIGl0ZW1zLCBbaW5kZXhdICkgOiBPTy51aS5FbGVtZW50ICAoQ0hBSU5BQkxFKVxyXG4gLSBjbGVhckl0ZW1zKCApIDogT08udWkuRWxlbWVudCAgKENIQUlOQUJMRSlcclxuIC0gZmluZEl0ZW1Gcm9tRGF0YSggZGF0YSApIDogT08udWkuRWxlbWVudHxudWxsXHJcbiAtIGZpbmRJdGVtc0Zyb21EYXRhKCBkYXRhICkgOiBPTy51aS5FbGVtZW50W11cclxuIC0gcmVtb3ZlSXRlbXMoIGl0ZW1zICkgOiBPTy51aS5FbGVtZW50ICAoQ0hBSU5BQkxFKVxyXG4qL1xyXG5cclxuQmFubmVyTGlzdFdpZGdldC5wcm90b3R5cGUub25CYW5uZXJSZW1vdmUgPSBmdW5jdGlvbiAoIGJhbm5lciApIHtcclxuXHR0aGlzLnJlbW92ZUl0ZW1zKFtiYW5uZXJdKTtcclxufTtcclxuXHJcblxyXG5cclxuZXhwb3J0IGRlZmF1bHQgQmFubmVyTGlzdFdpZGdldDsiLCJpbXBvcnQgUGFyYW1ldGVyTGlzdFdpZGdldCBmcm9tIFwiLi9QYXJhbWV0ZXJMaXN0V2lkZ2V0XCI7XHJcbmltcG9ydCBQYXJhbWV0ZXJXaWRnZXQgZnJvbSBcIi4vUGFyYW1ldGVyV2lkZ2V0XCI7XHJcbmltcG9ydCBTdWdnZXN0aW9uTG9va3VwVGV4dElucHV0V2lkZ2V0IGZyb20gXCIuL1N1Z2dlc3Rpb25Mb29rdXBUZXh0SW5wdXRXaWRnZXRcIjtcclxuXHJcbi8qIFRhcmdldCBvdXRwdXQgKGZyb20gcmF0ZXIgdjEpOlxyXG4vLyBIVE1MXHJcbjxzcGFuIGNsYXNzPVwicmF0ZXItZGlhbG9nLXBhcmFJbnB1dCByYXRlci1kaWFsb2ctdGV4dElucHV0Q29udGFpbmVyXCI+XHJcblx0PGxhYmVsPjxzcGFuIGNsYXNzPVwicmF0ZXItZGlhbG9nLXBhcmEtY29kZVwiPmNhdGVnb3J5PC9zcGFuPjwvbGFiZWw+XHJcblx0PGlucHV0IHR5cGU9XCJ0ZXh0XCIvPjxhIHRpdGxlPVwicmVtb3ZlXCI+eDwvYT48d2JyLz5cclxuPC9zcGFuPlxyXG4vLyBDU1NcclxuLnJhdGVyLWRpYWxvZy1yb3cgPiBkaXYgPiBzcGFuIHtcclxuICAgIHBhZGRpbmctcmlnaHQ6IDAuNWVtO1xyXG4gICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcclxufVxyXG4ucmF0ZXItZGlhbG9nLWF1dG9maWxsIHtcclxuICAgIGJvcmRlcjogMXB4IGRhc2hlZCAjY2QyMGZmO1xyXG4gICAgcGFkZGluZzogMC4yZW07XHJcbiAgICBtYXJnaW4tcmlnaHQ6IDAuMmVtO1xyXG59XHJcbnJhdGVyLWRpYWxvZy1hdXRvZmlsbDo6YWZ0ZXIge1xyXG4gICAgY29udGVudDogXCJhdXRvZmlsbGVkXCI7XHJcbiAgICBjb2xvcjogI2NkMjBmZjtcclxuICAgIGZvbnQtd2VpZ2h0OiBib2xkO1xyXG4gICAgZm9udC1zaXplOiA5NiU7XHJcbn1cclxuKi9cclxuXHJcbmZ1bmN0aW9uIEJhbm5lcldpZGdldCggdGVtcGxhdGUsIGNvbmZpZyApIHtcclxuXHQvLyBDb25maWd1cmF0aW9uIGluaXRpYWxpemF0aW9uXHJcblx0Y29uZmlnID0gY29uZmlnIHx8IHt9O1xyXG5cdC8vIENhbGwgcGFyZW50IGNvbnN0cnVjdG9yXHJcblx0QmFubmVyV2lkZ2V0LnN1cGVyLmNhbGwoIHRoaXMsIGNvbmZpZyApO1xyXG5cclxuXHR0aGlzLnRlbXBsYXRlID0gdGVtcGxhdGU7XHJcblxyXG5cdC8qIC0tLSBUSVRMRSBBTkQgUkFUSU5HUyAtLS0gKi9cclxuXHJcblx0dGhpcy5yZW1vdmVCdXR0b24gPSBuZXcgT08udWkuQnV0dG9uV2lkZ2V0KCB7XHJcblx0XHRpY29uOiBcInRyYXNoXCIsXHJcblx0XHRsYWJlbDogXCJSZW1vdmUgYmFubmVyXCIsXHJcblx0XHR0aXRsZTogXCJSZW1vdmUgYmFubmVyXCIsXHJcblx0XHRmbGFnczogXCJkZXN0cnVjdGl2ZVwiLFxyXG5cdFx0JGVsZW1lbnQ6ICQoXCI8ZGl2IHN0eWxlPVxcXCJ3aWR0aDoxMDAlXFxcIj5cIilcclxuXHR9ICk7XHJcblx0dGhpcy5jbGVhckJ1dHRvbiA9IG5ldyBPTy51aS5CdXR0b25XaWRnZXQoIHtcclxuXHRcdGljb246IFwiY2FuY2VsXCIsXHJcblx0XHRsYWJlbDogXCJDbGVhciBwYXJhbWV0ZXJzXCIsXHJcblx0XHR0aXRsZTogXCJDbGVhciBwYXJhbWV0ZXJzXCIsXHJcblx0XHRmbGFnczogXCJkZXN0cnVjdGl2ZVwiLFxyXG5cdFx0JGVsZW1lbnQ6ICQoXCI8ZGl2IHN0eWxlPVxcXCJ3aWR0aDoxMDAlXFxcIj5cIilcclxuXHR9ICk7XHJcblx0dGhpcy5ieXBhc3NCdXR0b24gPSBuZXcgT08udWkuQnV0dG9uV2lkZ2V0KCB7XHJcblx0XHRpY29uOiBcImFydGljbGVSZWRpcmVjdFwiLFxyXG5cdFx0bGFiZWw6IFwiQnlwYXNzIHJlZGlyZWN0XCIsXHJcblx0XHR0aXRsZTogXCJCeXBhc3MgcmVkaXJlY3RcIixcclxuXHRcdCRlbGVtZW50OiAkKFwiPGRpdiBzdHlsZT1cXFwid2lkdGg6MTAwJVxcXCI+XCIpXHJcblx0fSApO1xyXG5cdHRoaXMucmVtb3ZlQnV0dG9uLiRlbGVtZW50LmZpbmQoXCJhXCIpLmNzcyhcIndpZHRoXCIsXCIxMDAlXCIpO1xyXG5cdHRoaXMuY2xlYXJCdXR0b24uJGVsZW1lbnQuZmluZChcImFcIikuY3NzKFwid2lkdGhcIixcIjEwMCVcIik7XHJcblx0dGhpcy5ieXBhc3NCdXR0b24uJGVsZW1lbnQuZmluZChcImFcIikuY3NzKFwid2lkdGhcIixcIjEwMCVcIik7XHJcblxyXG5cdHRoaXMudGl0bGVCdXR0b25zR3JvdXAgPSBuZXcgT08udWkuQnV0dG9uR3JvdXBXaWRnZXQoIHtcclxuXHRcdGl0ZW1zOiB0ZW1wbGF0ZS5yZWRpcmVjdFRhcmdldFxyXG5cdFx0XHQ/IFsgdGhpcy5yZW1vdmVCdXR0b24sXHJcblx0XHRcdFx0dGhpcy5jbGVhckJ1dHRvbixcclxuXHRcdFx0XHR0aGlzLmJ5cGFzc0J1dHRvbiBdXHJcblx0XHRcdDogWyB0aGlzLnJlbW92ZUJ1dHRvbixcclxuXHRcdFx0XHR0aGlzLmNsZWFyQnV0dG9uIF0sXHJcblx0XHQkZWxlbWVudDogJChcIjxzcGFuIHN0eWxlPSd3aWR0aDoxMDAlOyc+XCIpLFxyXG5cdH0gKTtcclxuXHJcblx0dGhpcy5tYWluTGFiZWxQb3B1cEJ1dHRvbiA9IG5ldyBPTy51aS5Qb3B1cEJ1dHRvbldpZGdldCgge1xyXG5cdFx0bGFiZWw6IFwie3tcIiArIHRoaXMudGVtcGxhdGUuZ2V0VGl0bGUoKS5nZXRNYWluVGV4dCgpICsgXCJ9fVwiLFxyXG5cdFx0JGVsZW1lbnQ6ICQoXCI8c3BhbiBzdHlsZT0nZGlzcGxheTppbmxpbmUtYmxvY2s7d2lkdGg6NDglO21hcmdpbi1yaWdodDowO3BhZGRpbmctcmlnaHQ6OHB4Jz5cIiksXHJcblx0XHRpbmRpY2F0b3I6XCJkb3duXCIsXHJcblx0XHRmcmFtZWQ6ZmFsc2UsXHJcblx0XHRwb3B1cDoge1xyXG5cdFx0XHQkY29udGVudDogdGhpcy50aXRsZUJ1dHRvbnNHcm91cC4kZWxlbWVudCxcclxuXHRcdFx0d2lkdGg6IDIwMCxcclxuXHRcdFx0cGFkZGVkOiBmYWxzZSxcclxuXHRcdFx0YWxpZ246IFwiZm9yY2UtcmlnaHRcIixcclxuXHRcdFx0YW5jaG9yOiBmYWxzZVxyXG5cdFx0fVxyXG5cdH0gKTtcclxuXHR0aGlzLm1haW5MYWJlbFBvcHVwQnV0dG9uLiRlbGVtZW50XHJcblx0XHQuY2hpbGRyZW4oXCJhXCIpLmZpcnN0KCkuY3NzKHtcImZvbnQtc2l6ZVwiOlwiMTEwJVwifSlcclxuXHRcdC5maW5kKFwic3Bhbi5vby11aS1sYWJlbEVsZW1lbnQtbGFiZWxcIikuY3NzKHtcIndoaXRlLXNwYWNlXCI6XCJub3JtYWxcIn0pO1xyXG5cclxuXHQvLyBSYXRpbmcgZHJvcGRvd25zXHJcblx0dGhpcy5jbGFzc0Ryb3Bkb3duID0gbmV3IE9PLnVpLkRyb3Bkb3duV2lkZ2V0KCB7XHJcblx0XHRsYWJlbDogbmV3IE9PLnVpLkh0bWxTbmlwcGV0KFwiPHNwYW4gc3R5bGU9XFxcImNvbG9yOiM3NzdcXFwiPkNsYXNzPC9zcGFuPlwiKSxcclxuXHRcdG1lbnU6IHsgLy8gRklYTUU6IG5lZWRzIHJlYWwgZGF0YVxyXG5cdFx0XHRpdGVtczogW1xyXG5cdFx0XHRcdG5ldyBPTy51aS5NZW51T3B0aW9uV2lkZ2V0KCB7XHJcblx0XHRcdFx0XHRkYXRhOiBcIlwiLFxyXG5cdFx0XHRcdFx0bGFiZWw6IFwiIFwiXHJcblx0XHRcdFx0fSApLFxyXG5cdFx0XHRcdG5ldyBPTy51aS5NZW51T3B0aW9uV2lkZ2V0KCB7XHJcblx0XHRcdFx0XHRkYXRhOiBcIkJcIixcclxuXHRcdFx0XHRcdGxhYmVsOiBcIkJcIlxyXG5cdFx0XHRcdH0gKSxcclxuXHRcdFx0XHRuZXcgT08udWkuTWVudU9wdGlvbldpZGdldCgge1xyXG5cdFx0XHRcdFx0ZGF0YTogXCJDXCIsXHJcblx0XHRcdFx0XHRsYWJlbDogXCJDXCJcclxuXHRcdFx0XHR9ICksXHJcblx0XHRcdFx0bmV3IE9PLnVpLk1lbnVPcHRpb25XaWRnZXQoIHtcclxuXHRcdFx0XHRcdGRhdGE6IFwic3RhcnRcIixcclxuXHRcdFx0XHRcdGxhYmVsOiBcIlN0YXJ0XCJcclxuXHRcdFx0XHR9ICksXHJcblx0XHRcdF1cclxuXHRcdH0sXHJcblx0XHQkZWxlbWVudDogJChcIjxzcGFuIHN0eWxlPSdkaXNwbGF5OmlubGluZS1ibG9jazt3aWR0aDoyNCUnPlwiKSxcclxuXHRcdCRvdmVybGF5OiB0aGlzLiRvdmVybGF5LFxyXG5cdH0gKTtcclxuXHR0aGlzLmltcG9ydGFuY2VEcm9wZG93biA9IG5ldyBPTy51aS5Ecm9wZG93bldpZGdldCgge1xyXG5cdFx0bGFiZWw6IG5ldyBPTy51aS5IdG1sU25pcHBldChcIjxzcGFuIHN0eWxlPVxcXCJjb2xvcjojNzc3XFxcIj5JbXBvcnRhbmNlPC9zcGFuPlwiKSxcclxuXHRcdG1lbnU6IHsgLy8gRklYTUU6IG5lZWRzIHJlYWwgZGF0YVxyXG5cdFx0XHRpdGVtczogW1xyXG5cdFx0XHRcdG5ldyBPTy51aS5NZW51T3B0aW9uV2lkZ2V0KCB7XHJcblx0XHRcdFx0XHRkYXRhOiBcIlwiLFxyXG5cdFx0XHRcdFx0bGFiZWw6IFwiIFwiXHJcblx0XHRcdFx0fSApLFxyXG5cdFx0XHRcdG5ldyBPTy51aS5NZW51T3B0aW9uV2lkZ2V0KCB7XHJcblx0XHRcdFx0XHRkYXRhOiBcInRvcFwiLFxyXG5cdFx0XHRcdFx0bGFiZWw6IFwiVG9wXCJcclxuXHRcdFx0XHR9ICksXHJcblx0XHRcdFx0bmV3IE9PLnVpLk1lbnVPcHRpb25XaWRnZXQoIHtcclxuXHRcdFx0XHRcdGRhdGE6IFwiaGlnaFwiLFxyXG5cdFx0XHRcdFx0bGFiZWw6IFwiSGlnaFwiXHJcblx0XHRcdFx0fSApLFxyXG5cdFx0XHRcdG5ldyBPTy51aS5NZW51T3B0aW9uV2lkZ2V0KCB7XHJcblx0XHRcdFx0XHRkYXRhOiBcIm1pZFwiLFxyXG5cdFx0XHRcdFx0bGFiZWw6IFwiTWlkXCJcclxuXHRcdFx0XHR9IClcclxuXHRcdFx0XVxyXG5cdFx0fSxcclxuXHRcdCRlbGVtZW50OiAkKFwiPHNwYW4gc3R5bGU9J2Rpc3BsYXk6aW5saW5lLWJsb2NrO3dpZHRoOjI0JSc+XCIpLFxyXG5cdFx0JG92ZXJsYXk6IHRoaXMuJG92ZXJsYXksXHJcblx0fSApO1xyXG5cdHRoaXMudGl0bGVMYXlvdXQgPSBuZXcgT08udWkuSG9yaXpvbnRhbExheW91dCgge1xyXG5cdFx0aXRlbXM6IFtcclxuXHRcdFx0dGhpcy5tYWluTGFiZWxQb3B1cEJ1dHRvbixcclxuXHRcdFx0dGhpcy5jbGFzc0Ryb3Bkb3duLFxyXG5cdFx0XHR0aGlzLmltcG9ydGFuY2VEcm9wZG93bixcclxuXHRcdF1cclxuXHR9ICk7XHJcblxyXG5cdC8qIC0tLSBQQVJBTUVURVJTIExJU1QgLS0tICovXHJcblxyXG5cdHZhciBwYXJhbWV0ZXJXaWRnZXRzID0gdGhpcy50ZW1wbGF0ZS5wYXJhbWV0ZXJzXHJcblx0XHQuZmlsdGVyKHBhcmFtID0+IHBhcmFtLm5hbWUgIT09IFwiY2xhc3NcIiAmJiBwYXJhbS5uYW1lICE9PSBcImltcG9ydGFuY2VcIilcclxuXHRcdC5tYXAocGFyYW0gPT4gbmV3IFBhcmFtZXRlcldpZGdldChwYXJhbSwgdGhpcy50ZW1wbGF0ZS5wYXJhbURhdGFbcGFyYW0ubmFtZV0pKTtcclxuXHJcblx0dGhpcy5wYXJhbWV0ZXJMaXN0ID0gbmV3IFBhcmFtZXRlckxpc3RXaWRnZXQoIHtcclxuXHRcdGl0ZW1zOiBwYXJhbWV0ZXJXaWRnZXRzLFxyXG5cdFx0ZGlzcGxheUxpbWl0OiA2XHJcblx0fSApO1xyXG5cclxuXHQvKiAtLS0gQUREIFBBUkFNRVRFUiBTRUNUSU9OIC0tLSAqL1xyXG5cclxuXHR0aGlzLmFkZFBhcmFtZXRlck5hbWVJbnB1dCA9IG5ldyBTdWdnZXN0aW9uTG9va3VwVGV4dElucHV0V2lkZ2V0KHtcclxuXHRcdHN1Z2dlc3Rpb25zOiB0aGlzLnRlbXBsYXRlLnBhcmFtZXRlclN1Z2dlc3Rpb25zLFxyXG5cdFx0cGxhY2Vob2xkZXI6IFwicGFyYW1ldGVyIG5hbWVcIixcclxuXHRcdCRlbGVtZW50OiAkKFwiPGRpdiBzdHlsZT0nZGlzcGxheTppbmxpbmUtYmxvY2s7d2lkdGg6NDAlJz5cIiksXHJcblx0XHR2YWxpZGF0ZTogZnVuY3Rpb24odmFsKSB7XHJcblx0XHRcdGxldCB7dmFsaWROYW1lLCBuYW1lLCB2YWx1ZX0gPSB0aGlzLmdldEFkZFBhcmFtZXRlcnNJbmZvKHZhbCk7XHJcblx0XHRcdHJldHVybiAoIW5hbWUgJiYgIXZhbHVlKSA/IHRydWUgOiB2YWxpZE5hbWU7XHJcblx0XHR9LmJpbmQodGhpcylcclxuXHR9KTtcclxuXHR0aGlzLmFkZFBhcmFtZXRlclZhbHVlSW5wdXQgPSBuZXcgU3VnZ2VzdGlvbkxvb2t1cFRleHRJbnB1dFdpZGdldCh7XHJcblx0XHRwbGFjZWhvbGRlcjogXCJwYXJhbWV0ZXIgdmFsdWVcIixcclxuXHRcdCRlbGVtZW50OiAkKFwiPGRpdiBzdHlsZT0nZGlzcGxheTppbmxpbmUtYmxvY2s7d2lkdGg6NDAlJz5cIiksXHJcblx0XHR2YWxpZGF0ZTogZnVuY3Rpb24odmFsKSB7XHJcblx0XHRcdGxldCB7dmFsaWRWYWx1ZSwgbmFtZSwgdmFsdWV9ID0gdGhpcy5nZXRBZGRQYXJhbWV0ZXJzSW5mbyhudWxsLCB2YWwpO1xyXG5cdFx0XHRyZXR1cm4gKCFuYW1lICYmICF2YWx1ZSkgPyB0cnVlIDogdmFsaWRWYWx1ZTtcclxuXHRcdH0uYmluZCh0aGlzKVxyXG5cdH0pO1xyXG5cdHRoaXMuYWRkUGFyYW1ldGVyQnV0dG9uID0gbmV3IE9PLnVpLkJ1dHRvbldpZGdldCh7XHJcblx0XHRsYWJlbDogXCJBZGRcIixcclxuXHRcdGljb246IFwiYWRkXCIsXHJcblx0XHRmbGFnczogXCJwcm9ncmVzc2l2ZVwiXHJcblx0fSkuc2V0RGlzYWJsZWQodHJ1ZSk7XHJcblx0dGhpcy5hZGRQYXJhbWV0ZXJDb250cm9scyA9IG5ldyBPTy51aS5Ib3Jpem9udGFsTGF5b3V0KCB7XHJcblx0XHRpdGVtczogW1xyXG5cdFx0XHR0aGlzLmFkZFBhcmFtZXRlck5hbWVJbnB1dCxcclxuXHRcdFx0bmV3IE9PLnVpLkxhYmVsV2lkZ2V0KHtsYWJlbDpcIj1cIn0pLFxyXG5cdFx0XHR0aGlzLmFkZFBhcmFtZXRlclZhbHVlSW5wdXQsXHJcblx0XHRcdHRoaXMuYWRkUGFyYW1ldGVyQnV0dG9uXHJcblx0XHRdXHJcblx0fSApO1xyXG5cdC8vIEhhY2tzIHRvIG1ha2UgdGhpcyBIb3Jpem9udGFsTGF5b3V0IGdvIGluc2lkZSBhIEZpZWxkTGF5b3V0XHJcblx0dGhpcy5hZGRQYXJhbWV0ZXJDb250cm9scy5nZXRJbnB1dElkID0gKCkgPT4gZmFsc2U7XHJcblx0dGhpcy5hZGRQYXJhbWV0ZXJDb250cm9scy5pc0Rpc2FibGVkID0gKCkgPT4gZmFsc2U7XHJcblx0dGhpcy5hZGRQYXJhbWV0ZXJDb250cm9scy5zaW11bGF0ZUxhYmVsQ2xpY2sgPSAoKSA9PiB0cnVlO1xyXG5cclxuXHR0aGlzLmFkZFBhcmFtZXRlckxheW91dCA9IG5ldyBPTy51aS5GaWVsZExheW91dCh0aGlzLmFkZFBhcmFtZXRlckNvbnRyb2xzLCB7XHJcblx0XHRsYWJlbDogXCJBZGQgcGFyYW1ldGVyOlwiLFxyXG5cdFx0YWxpZ246IFwidG9wXCJcclxuXHR9KS50b2dnbGUoZmFsc2UpO1xyXG5cdC8vIEFuZCBhbm90aGVyIGhhY2tcclxuXHR0aGlzLmFkZFBhcmFtZXRlckxheW91dC4kZWxlbWVudC5maW5kKFwiLm9vLXVpLWZpZWxkTGF5b3V0LW1lc3NhZ2VzXCIpLmNzcyh7XHJcblx0XHRcImNsZWFyXCI6IFwiYm90aFwiLFxyXG5cdFx0XCJwYWRkaW5nLXRvcFwiOiAwXHJcblx0fSk7XHJcblxyXG5cdC8qIC0tLSBPVkVSQUxMIExBWU9VVC9ESVNQTEFZIC0tLSAqL1xyXG5cclxuXHQvLyBEaXNwbGF5IHRoZSBsYXlvdXQgZWxlbWVudHMsIGFuZCBhIHJ1bGVcclxuXHR0aGlzLiRlbGVtZW50LmFwcGVuZChcclxuXHRcdHRoaXMudGl0bGVMYXlvdXQuJGVsZW1lbnQsXHJcblx0XHR0aGlzLnBhcmFtZXRlckxpc3QuJGVsZW1lbnQsXHJcblx0XHR0aGlzLmFkZFBhcmFtZXRlckxheW91dC4kZWxlbWVudCxcclxuXHRcdCQoXCI8aHI+XCIpXHJcblx0KTtcclxuXHJcblx0LyogLS0tIEVWRU5UIEhBTkRMSU5HIC0tLSAqL1xyXG5cclxuXHR0aGlzLnBhcmFtZXRlckxpc3QuY29ubmVjdCggdGhpcywgeyBcImFkZFBhcmFtZXRlcnNCdXR0b25DbGlja1wiOiBcInNob3dBZGRQYXJhbWV0ZXJJbnB1dHNcIiB9ICk7XHJcblx0dGhpcy5hZGRQYXJhbWV0ZXJCdXR0b24uY29ubmVjdCh0aGlzLCB7IFwiY2xpY2tcIjogXCJvblBhcmFtZXRlckFkZFwiIH0pO1xyXG5cdHRoaXMuYWRkUGFyYW1ldGVyTmFtZUlucHV0LmNvbm5lY3QodGhpcywgeyBcImNoYW5nZVwiOiBcIm9uQWRkUGFyYW1ldGVyTmFtZUNoYW5nZVwifSk7XHJcblx0dGhpcy5hZGRQYXJhbWV0ZXJWYWx1ZUlucHV0LmNvbm5lY3QodGhpcywgeyBcImNoYW5nZVwiOiBcIm9uQWRkUGFyYW1ldGVyVmFsdWVDaGFuZ2VcIn0pO1xyXG5cdHRoaXMucmVtb3ZlQnV0dG9uLmNvbm5lY3QodGhpcywge1wiY2xpY2tcIjogXCJvblJlbW92ZUJ1dHRvbkNsaWNrXCJ9LCApO1xyXG59XHJcbk9PLmluaGVyaXRDbGFzcyggQmFubmVyV2lkZ2V0LCBPTy51aS5XaWRnZXQgKTtcclxuXHJcbkJhbm5lcldpZGdldC5wcm90b3R5cGUuc2hvd0FkZFBhcmFtZXRlcklucHV0cyA9IGZ1bmN0aW9uKCkge1xyXG5cdHRoaXMuYWRkUGFyYW1ldGVyTGF5b3V0LnRvZ2dsZSh0cnVlKTtcclxufTtcclxuXHJcbkJhbm5lcldpZGdldC5wcm90b3R5cGUuZ2V0QWRkUGFyYW1ldGVyc0luZm8gPSBmdW5jdGlvbihuYW1lSW5wdXRWYWwsIHZhbHVlSW5wdXRWYWwpIHtcclxuXHR2YXIgbmFtZSA9IG5hbWVJbnB1dFZhbCAmJiBuYW1lSW5wdXRWYWwudHJpbSgpIHx8IHRoaXMuYWRkUGFyYW1ldGVyTmFtZUlucHV0LmdldFZhbHVlKCkudHJpbSgpO1xyXG5cdHZhciBwYXJhbUFscmVhZHlJbmNsdWRlZCA9IG5hbWUgPT09IFwiY2xhc3NcIiB8fFxyXG5cdFx0bmFtZSA9PT0gXCJpbXBvcnRhbmNlXCIgfHxcclxuXHRcdHRoaXMucGFyYW1ldGVyTGlzdC5pdGVtcy5zb21lKHBhcmFtV2lkZ2V0ID0+IHBhcmFtV2lkZ2V0LnBhcmFtZXRlciAmJiBwYXJhbVdpZGdldC5wYXJhbWV0ZXIubmFtZSA9PT0gbmFtZSk7XHJcblx0dmFyIHZhbHVlID0gdmFsdWVJbnB1dFZhbCAmJiB2YWx1ZUlucHV0VmFsLnRyaW0oKSB8fCB0aGlzLmFkZFBhcmFtZXRlclZhbHVlSW5wdXQuZ2V0VmFsdWUoKS50cmltKCk7XHJcblx0dmFyIGF1dG92YWx1ZSA9IG5hbWUgJiYgdGhpcy50ZW1wbGF0ZS5wYXJhbURhdGFbbmFtZV0gJiYgdGhpcy50ZW1wbGF0ZS5wYXJhbURhdGFbbmFtZV0uYXV0b3ZhbHVlIHx8IG51bGw7XHJcblx0cmV0dXJuIHtcclxuXHRcdHZhbGlkTmFtZTogISEobmFtZSAmJiAhcGFyYW1BbHJlYWR5SW5jbHVkZWQpLFxyXG5cdFx0dmFsaWRWYWx1ZTogISEodmFsdWUgfHwgYXV0b3ZhbHVlKSxcclxuXHRcdGlzQXV0b3ZhbHVlOiAhISghdmFsdWUgJiYgYXV0b3ZhbHVlKSxcclxuXHRcdGlzQWxyZWFkeUluY2x1ZGVkOiAhIShuYW1lICYmIHBhcmFtQWxyZWFkeUluY2x1ZGVkKSxcclxuXHRcdG5hbWUsXHJcblx0XHR2YWx1ZSxcclxuXHRcdGF1dG92YWx1ZVxyXG5cdH07XHJcbn07XHJcblxyXG5CYW5uZXJXaWRnZXQucHJvdG90eXBlLm9uQWRkUGFyYW1ldGVyTmFtZUNoYW5nZSA9IGZ1bmN0aW9uKCkge1xyXG5cdGxldCB7IHZhbGlkTmFtZSwgdmFsaWRWYWx1ZSwgaXNBdXRvdmFsdWUsIGlzQWxyZWFkeUluY2x1ZGVkLCBuYW1lLCBhdXRvdmFsdWUgfSA9IHRoaXMuZ2V0QWRkUGFyYW1ldGVyc0luZm8oKTtcclxuXHQvLyBTZXQgdmFsdWUgaW5wdXQgcGxhY2Vob2xkZXIgYXMgdGhlIGF1dG92YWx1ZVxyXG5cdHRoaXMuYWRkUGFyYW1ldGVyVmFsdWVJbnB1dC4kaW5wdXQuYXR0ciggXCJwbGFjZWhvbGRlclwiLCAgYXV0b3ZhbHVlIHx8IFwiXCIgKTtcclxuXHQvLyBTZXQgc3VnZ2VzdGlvbnMsIGlmIHRoZSBwYXJhbWV0ZXIgaGFzIGEgbGlzdCBvZiBhbGxvd2VkIHZhbHVlc1xyXG5cdHZhciBhbGxvd2VkVmFsdWVzID0gdGhpcy50ZW1wbGF0ZS5wYXJhbURhdGFbbmFtZV0gJiZcclxuXHRcdHRoaXMudGVtcGxhdGUucGFyYW1EYXRhW25hbWVdLmFsbG93ZWRWYWx1ZXMgJiYgXHJcblx0XHR0aGlzLnRlbXBsYXRlLnBhcmFtRGF0YVtuYW1lXS5hbGxvd2VkVmFsdWVzLm1hcCh2YWwgPT4ge3JldHVybiB7ZGF0YTogdmFsLCBsYWJlbDp2YWx9OyB9KTtcclxuXHR0aGlzLmFkZFBhcmFtZXRlclZhbHVlSW5wdXQuc2V0U3VnZ2VzdGlvbnMoYWxsb3dlZFZhbHVlcyB8fCBbXSk7XHJcblx0Ly8gU2V0IGJ1dHRvbiBkaXNhYmxlZCBzdGF0ZSBiYXNlZCBvbiB2YWxpZGl0eVxyXG5cdHRoaXMuYWRkUGFyYW1ldGVyQnV0dG9uLnNldERpc2FibGVkKCF2YWxpZE5hbWUgfHwgIXZhbGlkVmFsdWUpO1xyXG5cdC8vIFNob3cgbm90aWNlIGlmIGF1dG92YWx1ZSB3aWxsIGJlIHVzZWRcclxuXHR0aGlzLmFkZFBhcmFtZXRlckxheW91dC5zZXROb3RpY2VzKCB2YWxpZE5hbWUgJiYgaXNBdXRvdmFsdWUgPyBbXCJQYXJhbWV0ZXIgdmFsdWUgd2lsbCBiZSBhdXRvZmlsbGVkXCJdIDogW10gKTtcclxuXHQvLyBTaG93IGVycm9yIGlzIHRoZSBiYW5uZXIgYWxyZWFkeSBoYXMgdGhlIHBhcmFtZXRlciBzZXRcclxuXHR0aGlzLmFkZFBhcmFtZXRlckxheW91dC5zZXRFcnJvcnMoIGlzQWxyZWFkeUluY2x1ZGVkID8gW1wiUGFyYW1ldGVyIGlzIGFscmVhZHkgcHJlc2VudFwiXSA6IFtdICk7XHJcbn07XHJcblxyXG5CYW5uZXJXaWRnZXQucHJvdG90eXBlLm9uQWRkUGFyYW1ldGVyVmFsdWVDaGFuZ2UgPSBmdW5jdGlvbigpIHtcclxuXHRsZXQgeyB2YWxpZE5hbWUsIHZhbGlkVmFsdWUsIGlzQXV0b3ZhbHVlIH0gPSB0aGlzLmdldEFkZFBhcmFtZXRlcnNJbmZvKCk7XHJcblx0dGhpcy5hZGRQYXJhbWV0ZXJCdXR0b24uc2V0RGlzYWJsZWQoIXZhbGlkTmFtZSB8fCAhdmFsaWRWYWx1ZSk7XHJcblx0dGhpcy5hZGRQYXJhbWV0ZXJMYXlvdXQuc2V0Tm90aWNlcyggdmFsaWROYW1lICYmIGlzQXV0b3ZhbHVlID8gW1wiUGFyYW1ldGVyIHZhbHVlIHdpbGwgYmUgYXV0b2ZpbGxlZFwiXSA6IFtdICk7IFxyXG59O1xyXG5cclxuQmFubmVyV2lkZ2V0LnByb3RvdHlwZS5vblBhcmFtZXRlckFkZCA9IGZ1bmN0aW9uKCkge1xyXG5cdGxldCB7IHZhbGlkTmFtZSwgdmFsaWRWYWx1ZSwgbmFtZSwgdmFsdWUsIGF1dG92YWx1ZSB9ICA9IHRoaXMuZ2V0QWRkUGFyYW1ldGVyc0luZm8oKTtcclxuXHRpZiAoIXZhbGlkTmFtZSB8fCAhdmFsaWRWYWx1ZSkge1xyXG5cdFx0Ly8gRXJyb3Igc2hvdWxkIGFscmVhZHkgYmUgc2hvd24gdmlhIG9uQWRkUGFyYW1ldGVyLi4uQ2hhbmdlIG1ldGhvZHNcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblx0dmFyIG5ld1BhcmFtZXRlciA9IG5ldyBQYXJhbWV0ZXJXaWRnZXQoXHJcblx0XHR7XHJcblx0XHRcdFwibmFtZVwiOiBuYW1lLFxyXG5cdFx0XHRcInZhbHVlXCI6IHZhbHVlIHx8IGF1dG92YWx1ZVxyXG5cdFx0fSxcclxuXHRcdHRoaXMudGVtcGxhdGUucGFyYW1EYXRhW25hbWVdXHJcblx0KTtcclxuXHR0aGlzLnBhcmFtZXRlckxpc3QuYWRkSXRlbXMoW25ld1BhcmFtZXRlcl0pO1xyXG5cdHRoaXMuYWRkUGFyYW1ldGVyTmFtZUlucHV0LnNldFZhbHVlKFwiXCIpO1xyXG5cdHRoaXMuYWRkUGFyYW1ldGVyVmFsdWVJbnB1dC5zZXRWYWx1ZShcIlwiKTtcclxuXHR0aGlzLmFkZFBhcmFtZXRlck5hbWVJbnB1dC5mb2N1cygpO1xyXG59O1xyXG5cclxuQmFubmVyV2lkZ2V0LnByb3RvdHlwZS5vblJlbW92ZUJ1dHRvbkNsaWNrID0gZnVuY3Rpb24oKSB7XHJcblx0dGhpcy5lbWl0KFwicmVtb3ZlXCIpO1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgQmFubmVyV2lkZ2V0OyIsIi8qKlxyXG4gKiBAY2ZnIHtPTy51aS5FbGVtZW50W119IGl0ZW1zIEl0ZW1zIHRvIGJlIGFkZGVkXHJcbiAqIEBjZmcge051bWJlcn0gZGlzcGxheUxpbWl0IFRoZSBtb3N0IHRvIHNob3cgYXQgb25jZS4gSWYgdGhlIG51bWJlciBvZiBpdGVtc1xyXG4gKiAgaXMgbW9yZSB0aGFuIHRoaXMsIHRoZW4gb25seSB0aGUgZmlyc3QgKGRpc3BsYXlMaW1pdCAtIDEpIGl0ZW1zIGFyZSBzaG93bi5cclxuICovXHJcbnZhciBQYXJhbWV0ZXJMaXN0V2lkZ2V0ID0gZnVuY3Rpb24gUGFyYW1ldGVyTGlzdFdpZGdldCggY29uZmlnICkge1xyXG5cdGNvbmZpZyA9IGNvbmZpZyB8fCB7fTtcclxuXHJcblx0Ly8gQ2FsbCBwYXJlbnQgY29uc3RydWN0b3JcclxuXHRQYXJhbWV0ZXJMaXN0V2lkZ2V0LnBhcmVudC5jYWxsKCB0aGlzLCBjb25maWcgKTtcclxuXHRPTy51aS5taXhpbi5Hcm91cEVsZW1lbnQuY2FsbCggdGhpcywge1xyXG5cdFx0JGdyb3VwOiB0aGlzLiRlbGVtZW50XHJcblx0fSApO1xyXG5cdHRoaXMuYWRkSXRlbXMoIGNvbmZpZy5pdGVtcyApO1xyXG4gICBcclxuXHQvLyBIaWRlIHNvbWUgcGFyYW1ldGVycyAoaW5pdGlhbGx5KSwgaWYgbW9yZSB0aGFuIHNldCBkaXNwbGF5IGxpbWl0XHJcblx0aWYgKGNvbmZpZy5kaXNwbGF5TGltaXQgJiYgdGhpcy5pdGVtcy5sZW5ndGggPiBjb25maWcuZGlzcGxheUxpbWl0ICkge1xyXG5cdFx0dmFyIGhpZGVGcm9tTnVtYmVyID0gY29uZmlnLmRpc3BsYXlMaW1pdCAtIDE7IC8vIE9uZS1pbmRleGVkXHJcblx0XHR2YXIgaGlkZUZyb21JbmRleCA9IGhpZGVGcm9tTnVtYmVyIC0gMTsgLy8gWmVyby1pbmRleGVkXHJcblx0XHRmb3IgKGxldCBpID0gaGlkZUZyb21JbmRleDsgaSA8IHRoaXMuaXRlbXMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0dGhpcy5pdGVtc1tpXS50b2dnbGUoZmFsc2UpO1xyXG5cdFx0fVxyXG5cdFx0Ly8gQWRkIGJ1dHRvbiB0byBzaG93IHRoZSBoaWRkZW4gcGFyYW1zXHJcblx0XHR0aGlzLnNob3dNb3JlUGFyYW1ldGVyc0J1dHRvbiA9IG5ldyBPTy51aS5CdXR0b25XaWRnZXQoe1xyXG5cdFx0XHRsYWJlbDogXCJTaG93IFwiKyh0aGlzLml0ZW1zLmxlbmd0aCAtIGNvbmZpZy5kaXNwbGF5TGltaXQgLSAxKStcIiBtb3JlIHBhcmFtdGVyc1wiLFxyXG5cdFx0XHRmcmFtZWQ6IGZhbHNlLFxyXG5cdFx0XHQkZWxlbWVudDogJChcIjxzcGFuIHN0eWxlPSdtYXJnaW4tYm90dG9tOjAnPlwiKVxyXG5cdFx0fSk7XHJcblx0XHR0aGlzLmFkZEl0ZW1zKFt0aGlzLnNob3dNb3JlUGFyYW1ldGVyc0J1dHRvbl0pO1xyXG5cdH1cclxuXHJcblx0Ly8gQWRkIHRoZSBidXR0b24gdGhhdCBhbGxvd3MgdXNlciB0byBhZGQgbW9yZSBwYXJhbWV0ZXJzXHJcblx0dGhpcy5hZGRQYXJhbWV0ZXJzQnV0dG9uID0gbmV3IE9PLnVpLkJ1dHRvbldpZGdldCh7XHJcblx0XHRsYWJlbDogXCJBZGQgcGFyYW10ZXJcIixcclxuXHRcdGljb246IFwiYWRkXCIsXHJcblx0XHRmcmFtZWQ6IGZhbHNlLFxyXG5cdFx0JGVsZW1lbnQ6ICQoXCI8c3BhbiBzdHlsZT0nbWFyZ2luLWJvdHRvbTowJz5cIilcclxuXHR9KTtcclxuXHR0aGlzLmFkZEl0ZW1zKFt0aGlzLmFkZFBhcmFtZXRlcnNCdXR0b25dKTtcclxuXHJcblx0Ly8gSGFuZGxlIGRlbGV0ZSBldmVudHMgZnJvbSBQYXJhbWV0ZXJXaWRnZXRzXHJcblx0dGhpcy5hZ2dyZWdhdGUoIHsgZGVsZXRlOiBcInBhcmFtZXRlckRlbGV0ZVwiXHR9ICk7XHJcblx0dGhpcy5jb25uZWN0KCB0aGlzLCB7IHBhcmFtZXRlckRlbGV0ZTogXCJvblBhcmFtZXRlckRlbGV0ZVwiIH0gKTtcclxuICAgIFxyXG5cdC8vIEhhbmRsZSBidXR0b24gY2xpY2tzXHJcblx0aWYgKHRoaXMuc2hvd01vcmVQYXJhbWV0ZXJzQnV0dG9uICkge1xyXG5cdFx0dGhpcy5zaG93TW9yZVBhcmFtZXRlcnNCdXR0b24uY29ubmVjdCggdGhpcywgeyBcImNsaWNrXCI6IFwib25TaG93TW9yZVBhcmFtZXRlcnNCdXR0b25DbGlja1wiIH0gKTtcclxuXHR9XHJcblx0dGhpcy5hZGRQYXJhbWV0ZXJzQnV0dG9uLmNvbm5lY3QoIHRoaXMsIHsgXCJjbGlja1wiOiBcIm9uQWRkUGFyYW1ldGVyc0J1dHRvbkNsaWNrXCIgfSApO1xyXG59O1xyXG5cclxuT08uaW5oZXJpdENsYXNzKCBQYXJhbWV0ZXJMaXN0V2lkZ2V0LCBPTy51aS5XaWRnZXQgKTtcclxuT08ubWl4aW5DbGFzcyggUGFyYW1ldGVyTGlzdFdpZGdldCwgT08udWkubWl4aW4uR3JvdXBFbGVtZW50ICk7XHJcbi8qXHJcbm1ldGhvZHMgZnJvbSBtaXhpbjpcclxuIC0gYWRkSXRlbXMoIGl0ZW1zLCBbaW5kZXhdICkgOiBPTy51aS5FbGVtZW50ICAoQ0hBSU5BQkxFKVxyXG4gLSBjbGVhckl0ZW1zKCApIDogT08udWkuRWxlbWVudCAgKENIQUlOQUJMRSlcclxuIC0gZmluZEl0ZW1Gcm9tRGF0YSggZGF0YSApIDogT08udWkuRWxlbWVudHxudWxsXHJcbiAtIGZpbmRJdGVtc0Zyb21EYXRhKCBkYXRhICkgOiBPTy51aS5FbGVtZW50W11cclxuIC0gcmVtb3ZlSXRlbXMoIGl0ZW1zICkgOiBPTy51aS5FbGVtZW50ICAoQ0hBSU5BQkxFKVxyXG4qL1xyXG5cclxuUGFyYW1ldGVyTGlzdFdpZGdldC5wcm90b3R5cGUub25QYXJhbWV0ZXJEZWxldGUgPSBmdW5jdGlvbiAoIHBhcmFtZXRlciApIHtcclxuXHR0aGlzLnJlbW92ZUl0ZW1zKFtwYXJhbWV0ZXJdKTtcclxufTtcclxuXHJcblBhcmFtZXRlckxpc3RXaWRnZXQucHJvdG90eXBlLmdldFBhcmFtZXRlckl0ZW1zID0gZnVuY3Rpb24oKSB7XHJcblx0cmV0dXJuIHRoaXMuaXRlbXMuZmlsdGVyKGl0ZW0gPT4gaXRlbS5jb25zdHJ1Y3Rvci5uYW1lID09PSBcIlBhcmFtZXRlcldpZGdldFwiKTtcclxufTtcclxuXHJcblBhcmFtZXRlckxpc3RXaWRnZXQucHJvdG90eXBlLm9uU2hvd01vcmVQYXJhbWV0ZXJzQnV0dG9uQ2xpY2sgPSBmdW5jdGlvbigpIHtcclxuXHR0aGlzLnJlbW92ZUl0ZW1zKFt0aGlzLnNob3dNb3JlUGFyYW1ldGVyc0J1dHRvbl0pO1xyXG5cdHRoaXMuaXRlbXMuZm9yRWFjaChwYXJhbWV0ZXJXaWRnZXQgPT4gcGFyYW1ldGVyV2lkZ2V0LnRvZ2dsZSh0cnVlKSk7XHJcbn07XHJcblxyXG5QYXJhbWV0ZXJMaXN0V2lkZ2V0LnByb3RvdHlwZS5vbkFkZFBhcmFtZXRlcnNCdXR0b25DbGljayA9IGZ1bmN0aW9uKCkge1xyXG5cdHRoaXMucmVtb3ZlSXRlbXMoW3RoaXMuYWRkUGFyYW1ldGVyc0J1dHRvbl0pO1xyXG5cdHRoaXMuZW1pdChcImFkZFBhcmFtZXRlcnNCdXR0b25DbGlja1wiKTtcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IFBhcmFtZXRlckxpc3RXaWRnZXQ7IiwiZnVuY3Rpb24gUGFyYW1ldGVyV2lkZ2V0KCBwYXJhbWV0ZXIsIHBhcmFtRGF0YSwgY29uZmlnICkge1xyXG5cdC8vIENvbmZpZ3VyYXRpb24gaW5pdGlhbGl6YXRpb25cclxuXHRjb25maWcgPSBjb25maWcgfHwge307XHJcblx0Ly8gQ2FsbCBwYXJlbnQgY29uc3RydWN0b3JcclxuXHRQYXJhbWV0ZXJXaWRnZXQuc3VwZXIuY2FsbCggdGhpcywgY29uZmlnICk7XHJcbiAgICBcclxuXHR0aGlzLnBhcmFtZXRlciA9IHBhcmFtZXRlcjtcclxuXHR0aGlzLnBhcmFtRGF0YSA9IHBhcmFtRGF0YSB8fCB7fTtcclxuXHJcblx0Ly8gTWFrZSB0aGUgaW5wdXQuIFR5cGUgY2FuIGJlIGNoZWNrYm94LCBvciBkcm9wZG93biwgb3IgdGV4dCBpbnB1dCxcclxuXHQvLyBkZXBlbmRpbmcgb24gbnVtYmVyIG9mIGFsbG93ZWQgdmFsdWVzIGluIHBhcmFtIGRhdGEuXHJcblx0dGhpcy5hbGxvd2VkVmFsdWVzID0gcGFyYW1EYXRhICYmIHBhcmFtRGF0YS5hbGxvd2VkVmFsdWVzIHx8IFtdO1xyXG5cdC8vIHN3aXRjaCAodHJ1ZSkge1xyXG5cdC8vIGNhc2UgdGhpcy5hbGxvd2VkVmFsdWVzLmxlbmd0aCA9PT0gMDpcclxuXHQvLyBjYXNlIHBhcmFtZXRlci52YWx1ZSAmJiAhdGhpcy5hbGxvd2VkVmFsdWVzLmluY2x1ZGVzKHBhcmFtZXRlci52YWx1ZSk6XHJcblx0Ly8gXHQvLyBUZXh0IGlucHV0XHJcblx0Ly8gXHRicmVhaztcclxuXHQvLyBjYXNlIDE6XHJcblx0Ly8gXHQvLyBDaGVja2JveCAobGFiZWxsZWQgb25seSB3aGVuIGJvdGggY2hlY2tlZClcclxuXHQvLyBcdHRoaXMuYWxsb3dlZFZhbHVlcyA9IFtudWxsLCAuLi50aGlzLmFsbG93ZWRWYWx1ZXNdO1xyXG5cdC8vIFx0LyogLi4uZmFsbHMgdGhyb3VnaC4uLiAqL1xyXG5cdC8vIGNhc2UgMjpcclxuXHQvLyBcdC8vIENoZWNrYm94IChsYWJlbGxlZCB3aGVuIGJvdGggY2hlY2tlZCBhbmQgbm90IGNoZWNrZWQpXHJcblx0Ly8gXHR0aGlzLmlucHV0ID0gbmV3IE9PLnVpLkNoZWNrYm94TXVsdGlvcHRpb25XaWRnZXQoIHtcclxuXHQvLyBcdFx0ZGF0YTogcGFyYW1ldGVyLnZhbHVlLFxyXG5cdC8vIFx0XHRzZWxlY3RlZDogdGhpcy5hbGxvd2VkVmFsdWVzLmluZGV4T2YocGFyYW1ldGVyLnZhbHVlKSA9PT0gMSxcclxuXHQvLyBcdFx0bGFiZWw6ICQoXCI8Y29kZT5cIikudGV4dChwYXJhbWV0ZXIudmFsdWUgfHwgXCJcIilcclxuXHQvLyBcdH0gKTtcclxuXHQvLyBcdGJyZWFrO1xyXG5cdC8vIGRlZmF1bHQ6XHJcblx0Ly8gXHQvLyBEcm9wZG93blxyXG5cdC8vIFx0dGhpcy5pbnB1dCA9IG5ldyBPTy51aS5Ecm9wZG93bldpZGdldCgge1xyXG5cdC8vIFx0XHRtZW51OiB7XHJcblx0Ly8gXHRcdFx0aXRlbXM6IHRoaXMuYWxsb3dlZFZhbHVlcy5tYXAoYWxsb3dlZFZhbCA9PiBuZXcgT08udWkuTWVudU9wdGlvbldpZGdldCh7XHJcblx0Ly8gXHRcdFx0XHRkYXRhOiBhbGxvd2VkVmFsLFxyXG5cdC8vIFx0XHRcdFx0bGFiZWw6IGFsbG93ZWRWYWxcclxuXHQvLyBcdFx0XHR9KSApXHJcblx0Ly8gXHRcdH1cclxuXHQvLyBcdH0gKTtcclxuXHQvLyBcdHRoaXMuaW5wdXQuZ2V0TWVudSgpLnNlbGVjdEl0ZW1CeURhdGEocGFyYW1ldGVyLnZhbHVlKTtcclxuXHQvLyBcdGJyZWFrO1xyXG5cdC8vIH1cclxuXHQvLyBUT0RPOiBVc2UgYWJvdmUgbG9naWMsIG9yIHNvbWV0aGluZyBzaW1pbGFyLiBGb3Igbm93LCBqdXN0IGNyZWF0ZSBhIENvbWJvQm94XHJcblx0dGhpcy5pbnB1dCA9IG5ldyBPTy51aS5Db21ib0JveElucHV0V2lkZ2V0KCB7XHJcblx0XHR2YWx1ZTogdGhpcy5wYXJhbWV0ZXIudmFsdWUsXHJcblx0XHQvLyBsYWJlbDogcGFyYW1ldGVyLm5hbWUgKyBcIiA9XCIsXHJcblx0XHQvLyBsYWJlbFBvc2l0aW9uOiBcImJlZm9yZVwiLFxyXG5cdFx0b3B0aW9uczogdGhpcy5hbGxvd2VkVmFsdWVzLm1hcCh2YWwgPT4ge3JldHVybiB7ZGF0YTogdmFsLCBsYWJlbDp2YWx9OyB9KSxcclxuXHRcdCRlbGVtZW50OiAkKFwiPGRpdiBzdHlsZT0nd2lkdGg6Y2FsYygxMDAlIC0gNzBweCk7bWFyZ2luLXJpZ2h0OjA7Jz5cIikgLy8gdGhlIDcwcHggbGVhdmVzIHJvb20gZm9yIGJ1dHRvbnNcclxuXHR9ICk7XHJcblx0Ly8gUmVkdWNlIHRoZSBleGNlc3NpdmUgd2hpdGVzcGFjZS9oZWlnaHRcclxuXHR0aGlzLmlucHV0LiRlbGVtZW50LmZpbmQoXCJpbnB1dFwiKS5jc3Moe1xyXG5cdFx0XCJwYWRkaW5nLXRvcFwiOiAwLFxyXG5cdFx0XCJwYWRkaW5nLWJvdHRvbVwiOiBcIjJweFwiLFxyXG5cdFx0XCJoZWlnaHRcIjogXCIyNHB4XCJcclxuXHR9KTtcclxuXHQvLyBGaXggbGFiZWwgcG9zaXRpb25pbmcgd2l0aGluIHRoZSByZWR1Y2VkIGhlaWdodFxyXG5cdHRoaXMuaW5wdXQuJGVsZW1lbnQuZmluZChcInNwYW4ub28tdWktbGFiZWxFbGVtZW50LWxhYmVsXCIpLmNzcyh7XCJsaW5lLWhlaWdodFwiOiBcIm5vcm1hbFwifSk7XHJcblx0Ly8gQWxzbyByZWR1Y2UgaGVpZ2h0IG9mIGRyb3Bkb3duIGJ1dHRvbiAoaWYgb3B0aW9ucyBhcmUgcHJlc2VudClcclxuXHR0aGlzLmlucHV0LiRlbGVtZW50LmZpbmQoXCJhLm9vLXVpLWJ1dHRvbkVsZW1lbnQtYnV0dG9uXCIpLmNzcyh7XHJcblx0XHRcInBhZGRpbmctdG9wXCI6IDAsXHJcblx0XHRcImhlaWdodFwiOiBcIjI0cHhcIixcclxuXHRcdFwibWluLWhlaWdodFwiOiBcIjBcIlxyXG5cdH0pO1xyXG5cclxuXHQvL3ZhciBkZXNjcmlwdGlvbiA9IHRoaXMucGFyYW1EYXRhW3BhcmFtZXRlci5uYW1lXSAmJiB0aGlzLnBhcmFtRGF0YVtwYXJhbWV0ZXIubmFtZV0ubGFiZWwgJiYgdGhpcy5wYXJhbURhdGFbcGFyYW1ldGVyLm5hbWVdLmxhYmVsLmVuO1xyXG5cdC8vIHZhciBwYXJhbU5hbWUgPSBuZXcgT08udWkuTGFiZWxXaWRnZXQoe1xyXG5cdC8vIFx0bGFiZWw6IFwifFwiICsgcGFyYW1ldGVyLm5hbWUgKyBcIj1cIixcclxuXHQvLyBcdCRlbGVtZW50OiAkKFwiPGNvZGU+XCIpXHJcblx0Ly8gfSk7XHJcblx0dGhpcy5kZWxldGVCdXR0b24gPSBuZXcgT08udWkuQnV0dG9uV2lkZ2V0KHtcclxuXHRcdGljb246IFwiY2xlYXJcIixcclxuXHRcdGZyYW1lZDogZmFsc2UsXHJcblx0XHRmbGFnczogXCJkZXN0cnVjdGl2ZVwiXHJcblx0fSk7XHJcblx0dGhpcy5kZWxldGVCdXR0b24uJGVsZW1lbnQuZmluZChcImEgc3BhblwiKS5maXJzdCgpLmNzcyh7XHJcblx0XHRcIm1pbi13aWR0aFwiOiBcInVuc2V0XCIsXHJcblx0XHRcIndpZHRoXCI6IFwiMTZweFwiXHJcblx0fSk7XHJcbiAgICBcclxuXHR0aGlzLmNvbmZpcm1CdXR0b24gPSBuZXcgT08udWkuQnV0dG9uV2lkZ2V0KHtcclxuXHRcdGljb246IFwiY2hlY2tcIixcclxuXHRcdGZyYW1lZDogZmFsc2UsXHJcblx0XHRmbGFnczogXCJwcm9ncmVzc2l2ZVwiLFxyXG5cdFx0JGVsZW1lbnQ6ICQoXCI8c3BhbiBzdHlsZT0nbWFyZ2luLXJpZ2h0OjAnPlwiKVxyXG5cdH0pO1xyXG5cdHRoaXMuY29uZmlybUJ1dHRvbi4kZWxlbWVudC5maW5kKFwiYSBzcGFuXCIpLmZpcnN0KCkuY3NzKHtcclxuXHRcdFwibWluLXdpZHRoXCI6IFwidW5zZXRcIixcclxuXHRcdFwid2lkdGhcIjogXCIxNnB4XCIsXHJcblx0XHRcIm1hcmdpbi1yaWdodFwiOiAwXHJcblx0fSk7XHJcblxyXG5cdHRoaXMuZWRpdExheW91dENvbnRyb2xzID0gbmV3IE9PLnVpLkhvcml6b250YWxMYXlvdXQoe1xyXG5cdFx0aXRlbXM6IFtcclxuXHRcdFx0dGhpcy5pbnB1dCxcclxuXHRcdFx0dGhpcy5jb25maXJtQnV0dG9uLFxyXG5cdFx0XHR0aGlzLmRlbGV0ZUJ1dHRvblxyXG5cdFx0XSxcclxuXHRcdC8vJGVsZW1lbnQ6ICQoXCI8ZGl2IHN0eWxlPSd3aWR0aDogNDglO21hcmdpbjowOyc+XCIpXHJcblx0fSk7XHJcblx0Ly8gSGFja3MgdG8gbWFrZSB0aGlzIEhvcml6b250YWxMYXlvdXQgZ28gaW5zaWRlIGEgRmllbGRMYXlvdXRcclxuXHR0aGlzLmVkaXRMYXlvdXRDb250cm9scy5nZXRJbnB1dElkID0gKCkgPT4gZmFsc2U7XHJcblx0dGhpcy5lZGl0TGF5b3V0Q29udHJvbHMuaXNEaXNhYmxlZCA9ICgpID0+IGZhbHNlO1xyXG5cdHRoaXMuZWRpdExheW91dENvbnRyb2xzLnNpbXVsYXRlTGFiZWxDbGljayA9ICgpID0+IHRydWU7XHJcblxyXG5cdHRoaXMuZWRpdExheW91dCA9IG5ldyBPTy51aS5GaWVsZExheW91dCggdGhpcy5lZGl0TGF5b3V0Q29udHJvbHMsIHtcclxuXHRcdGxhYmVsOiB0aGlzLnBhcmFtZXRlci5uYW1lICsgXCIgPVwiLFxyXG5cdFx0YWxpZ246IFwidG9wXCIsXHJcblx0XHRoZWxwOiB0aGlzLnBhcmFtRGF0YS5kZXNjcmlwdGlvbiAmJiB0aGlzLnBhcmFtRGF0YS5kZXNjcmlwdGlvbi5lbiB8fCBmYWxzZSxcclxuXHRcdGhlbHBJbmxpbmU6IHRydWVcclxuXHR9KS50b2dnbGUoKTtcclxuXHR0aGlzLmVkaXRMYXlvdXQuJGVsZW1lbnQuZmluZChcImxhYmVsLm9vLXVpLWlubGluZS1oZWxwXCIpLmNzcyh7XCJtYXJnaW5cIjogXCItMTBweCAwIDVweCAxMHB4XCJ9KTtcclxuXHJcblx0dGhpcy5mdWxsTGFiZWwgPSBuZXcgT08udWkuTGFiZWxXaWRnZXQoe1xyXG5cdFx0bGFiZWw6IHRoaXMucGFyYW1ldGVyLm5hbWUgKyBcIiA9IFwiICsgdGhpcy5wYXJhbWV0ZXIudmFsdWUsXHJcblx0XHQkZWxlbWVudDogJChcIjxsYWJlbCBzdHlsZT0nbWFyZ2luOiAwOyc+XCIpXHJcblx0fSk7XHJcblx0dGhpcy5lZGl0QnV0dG9uID0gbmV3IE9PLnVpLkJ1dHRvbldpZGdldCh7XHJcblx0XHRpY29uOiBcImVkaXRcIixcclxuXHRcdGZyYW1lZDogZmFsc2UsXHJcblx0XHQkZWxlbWVudDogJChcIjxzcGFuIHN0eWxlPSdtYXJnaW4tYm90dG9tOiAwOyc+XCIpXHJcblx0fSk7XHJcblx0dGhpcy5lZGl0QnV0dG9uLiRlbGVtZW50LmZpbmQoXCJhXCIpLmNzcyh7XHJcblx0XHRcImJvcmRlci1yYWRpdXNcIjogXCIwIDEwcHggMTBweCAwXCIsXHJcblx0XHRcIm1hcmdpbi1sZWZ0XCI6IFwiNXB4XCJcclxuXHR9KTtcclxuXHR0aGlzLmVkaXRCdXR0b24uJGVsZW1lbnQuZmluZChcImEgc3BhblwiKS5maXJzdCgpLmNzcyh7XHJcblx0XHRcIm1pbi13aWR0aFwiOiBcInVuc2V0XCIsXHJcblx0XHRcIndpZHRoXCI6IFwiMTZweFwiXHJcblx0fSk7XHJcblxyXG5cdHRoaXMucmVhZExheW91dCA9IG5ldyBPTy51aS5Ib3Jpem9udGFsTGF5b3V0KHtcclxuXHRcdGl0ZW1zOiBbXHJcblx0XHRcdHRoaXMuZnVsbExhYmVsLFxyXG5cdFx0XHR0aGlzLmVkaXRCdXR0b25cclxuXHRcdF0sXHJcblx0XHQkZWxlbWVudDogJChcIjxzcGFuIHN0eWxlPSdtYXJnaW46MDt3aWR0aDp1bnNldDsnPlwiKVxyXG5cdH0pO1xyXG5cclxuXHR0aGlzLiRlbGVtZW50ID0gJChcIjxkaXY+XCIpXHJcblx0XHQuY3NzKHtcclxuXHRcdFx0XCJ3aWR0aFwiOiBcInVuc2V0XCIsXHJcblx0XHRcdFwiZGlzcGxheVwiOiBcImlubGluZS1ibG9ja1wiLFxyXG5cdFx0XHRcImJvcmRlclwiOiBcIjFweCBzb2xpZCAjZGRkXCIsXHJcblx0XHRcdFwiYm9yZGVyLXJhZGl1c1wiOiBcIjEwcHhcIixcclxuXHRcdFx0XCJwYWRkaW5nLWxlZnRcIjogXCIxMHB4XCIsXHJcblx0XHRcdFwibWFyZ2luXCI6IFwiMCA4cHggOHB4IDBcIlxyXG5cdFx0fSlcclxuXHRcdC5hcHBlbmQodGhpcy5yZWFkTGF5b3V0LiRlbGVtZW50LCB0aGlzLmVkaXRMYXlvdXQuJGVsZW1lbnQpO1xyXG4gICAgXHJcblx0dGhpcy5lZGl0QnV0dG9uLmNvbm5lY3QoIHRoaXMsIHsgXCJjbGlja1wiOiBcIm9uRWRpdENsaWNrXCIgfSApO1xyXG5cdHRoaXMuY29uZmlybUJ1dHRvbi5jb25uZWN0KCB0aGlzLCB7IFwiY2xpY2tcIjogXCJvbkNvbmZpcm1DbGlja1wiIH0gKTtcclxuXHR0aGlzLmRlbGV0ZUJ1dHRvbi5jb25uZWN0KCB0aGlzLCB7IFwiY2xpY2tcIjogXCJvbkRlbGV0ZUNsaWNrXCIgfSApO1xyXG59XHJcbk9PLmluaGVyaXRDbGFzcyggUGFyYW1ldGVyV2lkZ2V0LCBPTy51aS5XaWRnZXQgKTtcclxuXHJcblBhcmFtZXRlcldpZGdldC5wcm90b3R5cGUub25FZGl0Q2xpY2sgPSBmdW5jdGlvbigpIHtcclxuXHR0aGlzLnJlYWRMYXlvdXQudG9nZ2xlKGZhbHNlKTtcclxuXHR0aGlzLmVkaXRMYXlvdXQudG9nZ2xlKHRydWUpO1xyXG5cdHRoaXMuaW5wdXQuZm9jdXMoKTtcclxufTtcclxuXHJcblBhcmFtZXRlcldpZGdldC5wcm90b3R5cGUub25Db25maXJtQ2xpY2sgPSBmdW5jdGlvbigpIHtcclxuXHR0aGlzLnBhcmFtZXRlci52YWx1ZSA9IHRoaXMuaW5wdXQuZ2V0VmFsdWUoKTtcclxuXHR0aGlzLmZ1bGxMYWJlbC5zZXRMYWJlbCh0aGlzLnBhcmFtZXRlci5uYW1lICsgXCIgPSBcIiArIHRoaXMucGFyYW1ldGVyLnZhbHVlKTtcclxuXHR0aGlzLnJlYWRMYXlvdXQudG9nZ2xlKHRydWUpO1xyXG5cdHRoaXMuZWRpdExheW91dC50b2dnbGUoZmFsc2UpO1xyXG59O1xyXG5cclxuUGFyYW1ldGVyV2lkZ2V0LnByb3RvdHlwZS5vbkRlbGV0ZUNsaWNrID0gZnVuY3Rpb24oKSB7XHJcblx0dGhpcy5lbWl0KFwiZGVsZXRlXCIpO1xyXG59O1xyXG5cclxuUGFyYW1ldGVyV2lkZ2V0LnByb3RvdHlwZS5mb2N1c0lucHV0ID0gZnVuY3Rpb24oKSB7XHJcblx0cmV0dXJuIHRoaXMuaW5wdXQuZm9jdXMoKTtcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IFBhcmFtZXRlcldpZGdldDsiLCJ2YXIgU3VnZ2VzdGlvbkxvb2t1cFRleHRJbnB1dFdpZGdldCA9IGZ1bmN0aW9uIFN1Z2dlc3Rpb25Mb29rdXBUZXh0SW5wdXRXaWRnZXQoIGNvbmZpZyApIHtcclxuXHRPTy51aS5UZXh0SW5wdXRXaWRnZXQuY2FsbCggdGhpcywgY29uZmlnICk7XHJcblx0T08udWkubWl4aW4uTG9va3VwRWxlbWVudC5jYWxsKCB0aGlzLCBjb25maWcgKTtcclxuXHR0aGlzLnN1Z2dlc3Rpb25zID0gY29uZmlnLnN1Z2dlc3Rpb25zIHx8IFtdO1xyXG59O1xyXG5PTy5pbmhlcml0Q2xhc3MoIFN1Z2dlc3Rpb25Mb29rdXBUZXh0SW5wdXRXaWRnZXQsIE9PLnVpLlRleHRJbnB1dFdpZGdldCApO1xyXG5PTy5taXhpbkNsYXNzKCBTdWdnZXN0aW9uTG9va3VwVGV4dElucHV0V2lkZ2V0LCBPTy51aS5taXhpbi5Mb29rdXBFbGVtZW50ICk7XHJcblxyXG4vLyBTZXQgc3VnZ2VzdGlvbi4gcGFyYW06IE9iamVjdFtdIHdpdGggb2JqZWN0cyBvZiB0aGUgZm9ybSB7IGRhdGE6IC4uLiAsIGxhYmVsOiAuLi4gfVxyXG5TdWdnZXN0aW9uTG9va3VwVGV4dElucHV0V2lkZ2V0LnByb3RvdHlwZS5zZXRTdWdnZXN0aW9ucyA9IGZ1bmN0aW9uKHN1Z2dlc3Rpb25zKSB7XHJcblx0dGhpcy5zdWdnZXN0aW9ucyA9IHN1Z2dlc3Rpb25zO1xyXG59O1xyXG5cclxuLy8gUmV0dXJucyBkYXRhLCBhcyBhIHJlc29sdXRpb24gdG8gYSBwcm9taXNlLCB0byBiZSBwYXNzZWQgdG8gI2dldExvb2t1cE1lbnVPcHRpb25zRnJvbURhdGFcclxuU3VnZ2VzdGlvbkxvb2t1cFRleHRJbnB1dFdpZGdldC5wcm90b3R5cGUuZ2V0TG9va3VwUmVxdWVzdCA9IGZ1bmN0aW9uICgpIHtcclxuXHR2YXIgZGVmZXJyZWQgPSAkLkRlZmVycmVkKCkucmVzb2x2ZShuZXcgUmVnRXhwKFwiXFxcXGJcIiArIG13LnV0aWwuZXNjYXBlUmVnRXhwKHRoaXMuZ2V0VmFsdWUoKSksIFwiaVwiKSk7XHJcblx0cmV0dXJuIGRlZmVycmVkLnByb21pc2UoIHsgYWJvcnQ6IGZ1bmN0aW9uICgpIHt9IH0gKTtcclxufTtcclxuXHJcbi8vID8/P1xyXG5TdWdnZXN0aW9uTG9va3VwVGV4dElucHV0V2lkZ2V0LnByb3RvdHlwZS5nZXRMb29rdXBDYWNoZURhdGFGcm9tUmVzcG9uc2UgPSBmdW5jdGlvbiAoIHJlc3BvbnNlICkge1xyXG5cdHJldHVybiByZXNwb25zZSB8fCBbXTtcclxufTtcclxuXHJcbi8vIElzIHBhc3NlZCBkYXRhIGZyb20gI2dldExvb2t1cFJlcXVlc3QsIHJldHVybnMgYW4gYXJyYXkgb2YgbWVudSBpdGVtIHdpZGdldHMgXHJcblN1Z2dlc3Rpb25Mb29rdXBUZXh0SW5wdXRXaWRnZXQucHJvdG90eXBlLmdldExvb2t1cE1lbnVPcHRpb25zRnJvbURhdGEgPSBmdW5jdGlvbiAoIHBhdHRlcm4gKSB7XHJcblx0dmFyIGxhYmVsTWF0Y2hlc0lucHV0VmFsID0gZnVuY3Rpb24oc3VnZ2VzdGlvbkl0ZW0pIHtcclxuXHRcdHJldHVybiBwYXR0ZXJuLnRlc3Qoc3VnZ2VzdGlvbkl0ZW0ubGFiZWwpIHx8ICggIXN1Z2dlc3Rpb25JdGVtLmxhYmVsICYmIHBhdHRlcm4udGVzdChzdWdnZXN0aW9uSXRlbS5kYXRhKSApO1xyXG5cdH07XHJcblx0dmFyIG1ha2VNZW51T3B0aW9uV2lkZ2V0ID0gZnVuY3Rpb24ob3B0aW9uSXRlbSkge1xyXG5cdFx0cmV0dXJuIG5ldyBPTy51aS5NZW51T3B0aW9uV2lkZ2V0KCB7XHJcblx0XHRcdGRhdGE6IG9wdGlvbkl0ZW0uZGF0YSxcclxuXHRcdFx0bGFiZWw6IG9wdGlvbkl0ZW0ubGFiZWwgfHwgb3B0aW9uSXRlbS5kYXRhXHJcblx0XHR9ICk7XHJcblx0fTtcclxuXHRyZXR1cm4gdGhpcy5zdWdnZXN0aW9ucy5maWx0ZXIobGFiZWxNYXRjaGVzSW5wdXRWYWwpLm1hcChtYWtlTWVudU9wdGlvbldpZGdldCk7XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBTdWdnZXN0aW9uTG9va3VwVGV4dElucHV0V2lkZ2V0OyIsImltcG9ydCB7bWFrZUVycm9yTXNnfSBmcm9tIFwiLi4vdXRpbFwiO1xyXG5cclxuLyogdmFyIGluY3JlbWVudFByb2dyZXNzQnlJbnRlcnZhbCA9IGZ1bmN0aW9uKCkge1xyXG5cdHZhciBpbmNyZW1lbnRJbnRlcnZhbERlbGF5ID0gMTAwO1xyXG5cdHZhciBpbmNyZW1lbnRJbnRlcnZhbEFtb3VudCA9IDAuMTtcclxuXHR2YXIgaW5jcmVtZW50SW50ZXJ2YWxNYXh2YWwgPSA5ODtcclxuXHRyZXR1cm4gd2luZG93LnNldEludGVydmFsKFxyXG5cdFx0aW5jcmVtZW50UHJvZ3Jlc3MsXHJcblx0XHRpbmNyZW1lbnRJbnRlcnZhbERlbGF5LFxyXG5cdFx0aW5jcmVtZW50SW50ZXJ2YWxBbW91bnQsXHJcblx0XHRpbmNyZW1lbnRJbnRlcnZhbE1heHZhbFxyXG5cdCk7XHJcbn07ICovXHJcblxyXG52YXIgTG9hZERpYWxvZyA9IGZ1bmN0aW9uIExvYWREaWFsb2coIGNvbmZpZyApIHtcclxuXHRMb2FkRGlhbG9nLnN1cGVyLmNhbGwoIHRoaXMsIGNvbmZpZyApO1xyXG59O1xyXG5PTy5pbmhlcml0Q2xhc3MoIExvYWREaWFsb2csIE9PLnVpLkRpYWxvZyApOyBcclxuXHJcbkxvYWREaWFsb2cuc3RhdGljLm5hbWUgPSBcImxvYWREaWFsb2dcIjtcclxuTG9hZERpYWxvZy5zdGF0aWMudGl0bGUgPSBcIkxvYWRpbmcgUmF0ZXIuLi5cIjtcclxuXHJcbi8vIEN1c3RvbWl6ZSB0aGUgaW5pdGlhbGl6ZSgpIGZ1bmN0aW9uOiBUaGlzIGlzIHdoZXJlIHRvIGFkZCBjb250ZW50IHRvIHRoZSBkaWFsb2cgYm9keSBhbmQgc2V0IHVwIGV2ZW50IGhhbmRsZXJzLlxyXG5Mb2FkRGlhbG9nLnByb3RvdHlwZS5pbml0aWFsaXplID0gZnVuY3Rpb24gKCkge1xyXG5cdC8vIENhbGwgdGhlIHBhcmVudCBtZXRob2QuXHJcblx0TG9hZERpYWxvZy5zdXBlci5wcm90b3R5cGUuaW5pdGlhbGl6ZS5jYWxsKCB0aGlzICk7XHJcblx0Ly8gQ3JlYXRlIGEgbGF5b3V0XHJcblx0dGhpcy5jb250ZW50ID0gbmV3IE9PLnVpLlBhbmVsTGF5b3V0KCB7IFxyXG5cdFx0cGFkZGVkOiB0cnVlLFxyXG5cdFx0ZXhwYW5kZWQ6IGZhbHNlIFxyXG5cdH0gKTtcclxuXHQvLyBDcmVhdGUgY29udGVudFxyXG5cdHRoaXMucHJvZ3Jlc3NCYXIgPSBuZXcgT08udWkuUHJvZ3Jlc3NCYXJXaWRnZXQoIHtcclxuXHRcdHByb2dyZXNzOiAxXHJcblx0fSApO1xyXG5cdHRoaXMuc2V0dXB0YXNrcyA9IFtcclxuXHRcdG5ldyBPTy51aS5MYWJlbFdpZGdldCgge1xyXG5cdFx0XHRsYWJlbDogXCJMb2FkaW5nIGxpc3Qgb2YgcHJvamVjdCBiYW5uZXJzLi4uXCIsXHJcblx0XHRcdCRlbGVtZW50OiAkKFwiPHAgc3R5bGU9XFxcImRpc3BsYXk6YmxvY2tcXFwiPlwiKVxyXG5cdFx0fSksXHJcblx0XHRuZXcgT08udWkuTGFiZWxXaWRnZXQoIHtcclxuXHRcdFx0bGFiZWw6IFwiTG9hZGluZyB0YWxrcGFnZSB3aWtpdGV4dC4uLlwiLFxyXG5cdFx0XHQkZWxlbWVudDogJChcIjxwIHN0eWxlPVxcXCJkaXNwbGF5OmJsb2NrXFxcIj5cIilcclxuXHRcdH0pLFxyXG5cdFx0bmV3IE9PLnVpLkxhYmVsV2lkZ2V0KCB7XHJcblx0XHRcdGxhYmVsOiBcIlBhcnNpbmcgdGFsa3BhZ2UgdGVtcGxhdGVzLi4uXCIsXHJcblx0XHRcdCRlbGVtZW50OiAkKFwiPHAgc3R5bGU9XFxcImRpc3BsYXk6YmxvY2tcXFwiPlwiKVxyXG5cdFx0fSksXHJcblx0XHRuZXcgT08udWkuTGFiZWxXaWRnZXQoIHtcclxuXHRcdFx0bGFiZWw6IFwiR2V0dGluZyB0ZW1wbGF0ZXMnIHBhcmFtZXRlciBkYXRhLi4uXCIsXHJcblx0XHRcdCRlbGVtZW50OiAkKFwiPHAgc3R5bGU9XFxcImRpc3BsYXk6YmxvY2tcXFwiPlwiKVxyXG5cdFx0fSksXHJcblx0XHRuZXcgT08udWkuTGFiZWxXaWRnZXQoIHtcclxuXHRcdFx0bGFiZWw6IFwiQ2hlY2tpbmcgaWYgcGFnZSByZWRpcmVjdHMuLi5cIixcclxuXHRcdFx0JGVsZW1lbnQ6ICQoXCI8cCBzdHlsZT1cXFwiZGlzcGxheTpibG9ja1xcXCI+XCIpXHJcblx0XHR9KSxcclxuXHRcdG5ldyBPTy51aS5MYWJlbFdpZGdldCgge1xyXG5cdFx0XHRsYWJlbDogXCJSZXRyaWV2aW5nIHF1YWxpdHkgcHJlZGljdGlvbi4uLlwiLFxyXG5cdFx0XHQkZWxlbWVudDogJChcIjxwIHN0eWxlPVxcXCJkaXNwbGF5OmJsb2NrXFxcIj5cIilcclxuXHRcdH0pLnRvZ2dsZSgpLFxyXG5cdF07XHJcblx0dGhpcy5jbG9zZUJ1dHRvbiA9IG5ldyBPTy51aS5CdXR0b25XaWRnZXQoIHtcclxuXHRcdGxhYmVsOiBcIkNsb3NlXCJcclxuXHR9KS50b2dnbGUoKTtcclxuXHR0aGlzLnNldHVwUHJvbWlzZXMgPSBbXTtcclxuXHJcblx0Ly8gQXBwZW5kIGNvbnRlbnQgdG8gbGF5b3V0XHJcblx0dGhpcy5jb250ZW50LiRlbGVtZW50LmFwcGVuZChcclxuXHRcdHRoaXMucHJvZ3Jlc3NCYXIuJGVsZW1lbnQsXHJcblx0XHQobmV3IE9PLnVpLkxhYmVsV2lkZ2V0KCB7XHJcblx0XHRcdGxhYmVsOiBcIkluaXRpYWxpc2luZzpcIixcclxuXHRcdFx0JGVsZW1lbnQ6ICQoXCI8c3Ryb25nIHN0eWxlPVxcXCJkaXNwbGF5OmJsb2NrXFxcIj5cIilcclxuXHRcdH0pKS4kZWxlbWVudCxcclxuXHRcdC4uLnRoaXMuc2V0dXB0YXNrcy5tYXAod2lkZ2V0ID0+IHdpZGdldC4kZWxlbWVudCksXHJcblx0XHR0aGlzLmNsb3NlQnV0dG9uLiRlbGVtZW50XHJcblx0KTtcclxuXHJcblx0Ly8gQXBwZW5kIGxheW91dCB0byBkaWFsb2dcclxuXHR0aGlzLiRib2R5LmFwcGVuZCggdGhpcy5jb250ZW50LiRlbGVtZW50ICk7XHJcblxyXG5cdC8vIENvbm5lY3QgZXZlbnRzIHRvIGhhbmRsZXJzXHJcblx0dGhpcy5jbG9zZUJ1dHRvbi5jb25uZWN0KCB0aGlzLCB7IFwiY2xpY2tcIjogXCJvbkNsb3NlQnV0dG9uQ2xpY2tcIiB9ICk7XHJcbn07XHJcblxyXG5Mb2FkRGlhbG9nLnByb3RvdHlwZS5vbkNsb3NlQnV0dG9uQ2xpY2sgPSBmdW5jdGlvbigpIHtcclxuXHQvLyBDbG9zZSB0aGlzIGRpYWxvZywgd2l0aG91dCBwYXNzaW5nIGFueSBkYXRhXHJcblx0dGhpcy5jbG9zZSgpO1xyXG59O1xyXG5cclxuLy8gT3ZlcnJpZGUgdGhlIGdldEJvZHlIZWlnaHQoKSBtZXRob2QgdG8gc3BlY2lmeSBhIGN1c3RvbSBoZWlnaHQgKG9yIGRvbid0IHRvIHVzZSB0aGUgYXV0b21hdGljYWxseSBnZW5lcmF0ZWQgaGVpZ2h0KS5cclxuTG9hZERpYWxvZy5wcm90b3R5cGUuZ2V0Qm9keUhlaWdodCA9IGZ1bmN0aW9uICgpIHtcclxuXHRyZXR1cm4gdGhpcy5jb250ZW50LiRlbGVtZW50Lm91dGVySGVpZ2h0KCB0cnVlICk7XHJcbn07XHJcblxyXG5Mb2FkRGlhbG9nLnByb3RvdHlwZS5pbmNyZW1lbnRQcm9ncmVzcyA9IGZ1bmN0aW9uKGFtb3VudCwgbWF4aW11bSkge1xyXG5cdHZhciBwcmlvclByb2dyZXNzID0gdGhpcy5wcm9ncmVzc0Jhci5nZXRQcm9ncmVzcygpO1xyXG5cdHZhciBpbmNyZW1lbnRlZFByb2dyZXNzID0gTWF0aC5taW4obWF4aW11bSB8fCAxMDAsIHByaW9yUHJvZ3Jlc3MgKyBhbW91bnQpO1xyXG5cdHRoaXMucHJvZ3Jlc3NCYXIuc2V0UHJvZ3Jlc3MoaW5jcmVtZW50ZWRQcm9ncmVzcyk7XHJcbn07XHJcblxyXG5Mb2FkRGlhbG9nLnByb3RvdHlwZS5hZGRUYXNrUHJvbWlzZUhhbmRsZXJzID0gZnVuY3Rpb24odGFza1Byb21pc2VzKSB7XHJcblx0dmFyIG9uVGFza0RvbmUgPSBpbmRleCA9PiB7XHJcblx0XHQvLyBBZGQgXCJEb25lIVwiIHRvIGxhYmVsXHJcblx0XHR2YXIgd2lkZ2V0ID0gdGhpcy5zZXR1cHRhc2tzW2luZGV4XTtcclxuXHRcdHdpZGdldC5zZXRMYWJlbCh3aWRnZXQuZ2V0TGFiZWwoKSArIFwiIERvbmUhXCIpO1xyXG5cdFx0Ly8gSW5jcmVtZW50IHN0YXR1cyBiYXIuIFNob3cgYSBzbW9vdGggdHJhbnNpdGlvbiBieVxyXG5cdFx0Ly8gdXNpbmcgc21hbGwgc3RlcHMgb3ZlciBhIHNob3J0IGR1cmF0aW9uLlxyXG5cdFx0dmFyIHRvdGFsSW5jcmVtZW50ID0gMjA7IC8vIHBlcmNlbnRcclxuXHRcdHZhciB0b3RhbFRpbWUgPSA0MDA7IC8vIG1pbGxpc2Vjb25kc1xyXG5cdFx0dmFyIHRvdGFsU3RlcHMgPSAxMDtcclxuXHRcdHZhciBpbmNyZW1lbnRQZXJTdGVwID0gdG90YWxJbmNyZW1lbnQgLyB0b3RhbFN0ZXBzO1xyXG5cclxuXHRcdGZvciAoIHZhciBzdGVwPTA7IHN0ZXAgPCB0b3RhbFN0ZXBzOyBzdGVwKyspIHtcclxuXHRcdFx0d2luZG93LnNldFRpbWVvdXQoXHJcblx0XHRcdFx0dGhpcy5pbmNyZW1lbnRQcm9ncmVzcy5iaW5kKHRoaXMpLFxyXG5cdFx0XHRcdHRvdGFsVGltZSAqIHN0ZXAgLyB0b3RhbFN0ZXBzLFxyXG5cdFx0XHRcdGluY3JlbWVudFBlclN0ZXBcclxuXHRcdFx0KTtcclxuXHRcdH1cclxuXHR9O1xyXG5cdHZhciBvblRhc2tFcnJvciA9IChpbmRleCwgY29kZSwgaW5mbykgPT4ge1xyXG5cdFx0dmFyIHdpZGdldCA9IHRoaXMuc2V0dXB0YXNrc1tpbmRleF07XHJcblx0XHR3aWRnZXQuc2V0TGFiZWwoXHJcblx0XHRcdHdpZGdldC5nZXRMYWJlbCgpICsgXCIgRmFpbGVkLiBcIiArIG1ha2VFcnJvck1zZyhjb2RlLCBpbmZvKVxyXG5cdFx0KTtcclxuXHRcdHRoaXMuY2xvc2VCdXR0b24udG9nZ2xlKHRydWUpO1xyXG5cdFx0dGhpcy51cGRhdGVTaXplKCk7XHJcblx0fTtcclxuXHR0YXNrUHJvbWlzZXMuZm9yRWFjaChmdW5jdGlvbihwcm9taXNlLCBpbmRleCkge1xyXG5cdFx0cHJvbWlzZS50aGVuKFxyXG5cdFx0XHQoKSA9PiBvblRhc2tEb25lKGluZGV4KSxcclxuXHRcdFx0KGNvZGUsIGluZm8pID0+IG9uVGFza0Vycm9yKGluZGV4LCBjb2RlLCBpbmZvKVxyXG5cdFx0KTtcclxuXHR9KTtcclxufTtcclxuXHJcbi8vIFVzZSBnZXRTZXR1cFByb2Nlc3MoKSB0byBzZXQgdXAgdGhlIHdpbmRvdyB3aXRoIGRhdGEgcGFzc2VkIHRvIGl0IGF0IHRoZSB0aW1lIFxyXG4vLyBvZiBvcGVuaW5nXHJcbkxvYWREaWFsb2cucHJvdG90eXBlLmdldFNldHVwUHJvY2VzcyA9IGZ1bmN0aW9uICggZGF0YSApIHtcclxuXHRkYXRhID0gZGF0YSB8fCB7fTtcclxuXHRyZXR1cm4gTG9hZERpYWxvZy5zdXBlci5wcm90b3R5cGUuZ2V0U2V0dXBQcm9jZXNzLmNhbGwoIHRoaXMsIGRhdGEgKVxyXG5cdFx0Lm5leHQoICgpID0+IHtcclxuXHRcdFx0dmFyIHNob3dPcmVzVGFzayA9ICEhZGF0YS5vcmVzO1xyXG5cdFx0XHR0aGlzLnNldHVwdGFza3NbNV0udG9nZ2xlKHNob3dPcmVzVGFzayk7XHJcblx0XHRcdHZhciB0YXNrUHJvbWlzZXMgPSBkYXRhLm9yZXMgPyBkYXRhLnByb21pc2VzIDogZGF0YS5wcm9taXNlcy5zbGljZSgwLCAtMSk7XHJcblx0XHRcdGRhdGEuaXNPcGVuZWQudGhlbigoKSA9PiB0aGlzLmFkZFRhc2tQcm9taXNlSGFuZGxlcnModGFza1Byb21pc2VzKSk7XHJcblx0XHR9LCB0aGlzICk7XHJcbn07XHJcblxyXG4vLyBQcmV2ZW50IHdpbmRvdyBmcm9tIGNsb3NpbmcgdG9vIHF1aWNrbHksIHVzaW5nIGdldEhvbGRQcm9jZXNzKClcclxuTG9hZERpYWxvZy5wcm90b3R5cGUuZ2V0SG9sZFByb2Nlc3MgPSBmdW5jdGlvbiAoIGRhdGEgKSB7XHJcblx0ZGF0YSA9IGRhdGEgfHwge307XHJcblx0aWYgKGRhdGEuc3VjY2Vzcykge1xyXG5cdFx0Ly8gV2FpdCBhIGJpdCBiZWZvcmUgcHJvY2Vzc2luZyB0aGUgY2xvc2UsIHdoaWNoIGhhcHBlbnMgYXV0b21hdGljYWxseVxyXG5cdFx0cmV0dXJuIExvYWREaWFsb2cuc3VwZXIucHJvdG90eXBlLmdldEhvbGRQcm9jZXNzLmNhbGwoIHRoaXMsIGRhdGEgKVxyXG5cdFx0XHQubmV4dCg4MDApO1xyXG5cdH1cclxuXHQvLyBObyBuZWVkIHRvIHdhaXQgaWYgY2xvc2VkIG1hbnVhbGx5XHJcblx0cmV0dXJuIExvYWREaWFsb2cuc3VwZXIucHJvdG90eXBlLmdldEhvbGRQcm9jZXNzLmNhbGwoIHRoaXMsIGRhdGEgKTtcclxufTtcclxuXHJcbi8vIFVzZSB0aGUgZ2V0VGVhcmRvd25Qcm9jZXNzKCkgbWV0aG9kIHRvIHBlcmZvcm0gYWN0aW9ucyB3aGVuZXZlciB0aGUgZGlhbG9nIGlzIGNsb3NlZC4gXHJcbkxvYWREaWFsb2cucHJvdG90eXBlLmdldFRlYXJkb3duUHJvY2VzcyA9IGZ1bmN0aW9uICggZGF0YSApIHtcclxuXHRyZXR1cm4gTG9hZERpYWxvZy5zdXBlci5wcm90b3R5cGUuZ2V0VGVhcmRvd25Qcm9jZXNzLmNhbGwoIHRoaXMsIGRhdGEgKVxyXG5cdFx0LmZpcnN0KCAoKSA9PiB7XHJcblx0XHQvLyBQZXJmb3JtIGNsZWFudXA6IHJlc2V0IGxhYmVsc1xyXG5cdFx0XHR0aGlzLnNldHVwdGFza3MuZm9yRWFjaCggc2V0dXB0YXNrID0+IHtcclxuXHRcdFx0XHR2YXIgY3VycmVudExhYmVsID0gc2V0dXB0YXNrLmdldExhYmVsKCk7XHJcblx0XHRcdFx0c2V0dXB0YXNrLnNldExhYmVsKFxyXG5cdFx0XHRcdFx0Y3VycmVudExhYmVsLnNsaWNlKDAsIGN1cnJlbnRMYWJlbC5pbmRleE9mKFwiLi4uXCIpKzMpXHJcblx0XHRcdFx0KTtcclxuXHRcdFx0fSApO1xyXG5cdFx0fSwgdGhpcyApO1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgTG9hZERpYWxvZzsiLCJpbXBvcnQgQmFubmVyV2lkZ2V0IGZyb20gXCIuL0NvbXBvbmVudHMvQmFubmVyV2lkZ2V0XCI7XHJcbmltcG9ydCBCYW5uZXJMaXN0V2lkZ2V0IGZyb20gXCIuL0NvbXBvbmVudHMvQmFubmVyTGlzdFdpZGdldFwiO1xyXG5pbXBvcnQgU3VnZ2VzdGlvbkxvb2t1cFRleHRJbnB1dFdpZGdldCBmcm9tIFwiLi9Db21wb25lbnRzL1N1Z2dlc3Rpb25Mb29rdXBUZXh0SW5wdXRXaWRnZXRcIjtcclxuaW1wb3J0ICogYXMgY2FjaGUgZnJvbSBcIi4uL2NhY2hlXCI7XHJcbmltcG9ydCB7IFRlbXBsYXRlLCBnZXRXaXRoUmVkaXJlY3RUbyB9IGZyb20gXCIuLi9UZW1wbGF0ZVwiO1xyXG5pbXBvcnQge2dldEJhbm5lck9wdGlvbnN9IGZyb20gXCIuLi9nZXRCYW5uZXJzXCI7XHJcbmltcG9ydCBhcHBDb25maWcgZnJvbSBcIi4uL2NvbmZpZ1wiO1xyXG5cclxuZnVuY3Rpb24gTWFpbldpbmRvdyggY29uZmlnICkge1xyXG5cdE1haW5XaW5kb3cuc3VwZXIuY2FsbCggdGhpcywgY29uZmlnICk7XHJcbn1cclxuT08uaW5oZXJpdENsYXNzKCBNYWluV2luZG93LCBPTy51aS5Qcm9jZXNzRGlhbG9nICk7XHJcblxyXG5NYWluV2luZG93LnN0YXRpYy5uYW1lID0gXCJtYWluXCI7XHJcbk1haW5XaW5kb3cuc3RhdGljLnRpdGxlID0gXCJSYXRlclwiO1xyXG5NYWluV2luZG93LnN0YXRpYy5zaXplID0gXCJsYXJnZVwiO1xyXG5NYWluV2luZG93LnN0YXRpYy5hY3Rpb25zID0gW1xyXG5cdC8vIFByaW1hcnkgKHRvcCByaWdodCk6XHJcblx0e1xyXG5cdFx0bGFiZWw6IFwiWFwiLCAvLyBub3QgdXNpbmcgYW4gaWNvbiBzaW5jZSBjb2xvciBiZWNvbWVzIGludmVydGVkLCBpLmUuIHdoaXRlIG9uIGxpZ2h0LWdyZXlcclxuXHRcdHRpdGxlOiBcIkNsb3NlIChhbmQgZGlzY2FyZCBhbnkgY2hhbmdlcylcIixcclxuXHRcdGZsYWdzOiBcInByaW1hcnlcIixcclxuXHR9LFxyXG5cdC8vIFNhZmUgKHRvcCBsZWZ0KVxyXG5cdHtcclxuXHRcdGFjdGlvbjogXCJoZWxwXCIsXHJcblx0XHRmbGFnczogXCJzYWZlXCIsXHJcblx0XHRsYWJlbDogXCI/XCIsIC8vIG5vdCB1c2luZyBpY29uLCB0byBtaXJyb3IgQ2xvc2UgYWN0aW9uXHJcblx0XHR0aXRsZTogXCJoZWxwXCJcclxuXHR9LFxyXG5cdC8vIE90aGVycyAoYm90dG9tKVxyXG5cdHtcclxuXHRcdGFjdGlvbjogXCJzYXZlXCIsXHJcblx0XHRsYWJlbDogbmV3IE9PLnVpLkh0bWxTbmlwcGV0KFwiPHNwYW4gc3R5bGU9J3BhZGRpbmc6MCAxZW07Jz5TYXZlPC9zcGFuPlwiKSxcclxuXHRcdGZsYWdzOiBbXCJwcmltYXJ5XCIsIFwicHJvZ3Jlc3NpdmVcIl1cclxuXHR9LFxyXG5cdHtcclxuXHRcdGFjdGlvbjogXCJwcmV2aWV3XCIsXHJcblx0XHRsYWJlbDogXCJTaG93IHByZXZpZXdcIlxyXG5cdH0sXHJcblx0e1xyXG5cdFx0YWN0aW9uOiBcImNoYW5nZXNcIixcclxuXHRcdGxhYmVsOiBcIlNob3cgY2hhbmdlc1wiXHJcblx0fSxcclxuXHR7XHJcblx0XHRsYWJlbDogXCJDYW5jZWxcIlxyXG5cdH1cclxuXTtcclxuXHJcbi8vIEN1c3RvbWl6ZSB0aGUgaW5pdGlhbGl6ZSgpIGZ1bmN0aW9uOiBUaGlzIGlzIHdoZXJlIHRvIGFkZCBjb250ZW50IHRvIHRoZSBkaWFsb2cgYm9keSBhbmQgc2V0IHVwIGV2ZW50IGhhbmRsZXJzLlxyXG5NYWluV2luZG93LnByb3RvdHlwZS5pbml0aWFsaXplID0gZnVuY3Rpb24gKCkge1xyXG5cdC8vIENhbGwgdGhlIHBhcmVudCBtZXRob2QuXHJcblx0TWFpbldpbmRvdy5zdXBlci5wcm90b3R5cGUuaW5pdGlhbGl6ZS5jYWxsKCB0aGlzICk7XHJcblx0Ly8gdGhpcy5vdXRlckxheW91dCA9IG5ldyBPTy51aS5TdGFja0xheW91dCgge1xyXG5cdC8vIFx0aXRlbXM6IFtcclxuXHQvLyBcdFx0dGhpcy50b3BCYXIsXHJcblx0Ly8gXHRcdHRoaXMuY29udGVudExheW91dFxyXG5cdC8vIFx0XSxcclxuXHQvLyBcdGNvbnRpbnVvdXM6IHRydWUsXHJcblx0Ly8gXHRleHBhbmRlZDogdHJ1ZVxyXG5cdC8vIH0gKTtcclxuXHRcclxuXHQvKiAtLS0gVE9QIEJBUiAtLS0gKi9cclxuXHRcclxuXHQvLyBTZWFyY2ggYm94XHJcblx0dGhpcy5zZWFyY2hCb3ggPSBuZXcgU3VnZ2VzdGlvbkxvb2t1cFRleHRJbnB1dFdpZGdldCgge1xyXG5cdFx0cGxhY2Vob2xkZXI6IFwiQWRkIGEgV2lraVByb2plY3QuLi5cIixcclxuXHRcdHN1Z2dlc3Rpb25zOiBjYWNoZS5yZWFkKFwiYmFubmVyT3B0aW9uc1wiKSxcclxuXHRcdCRlbGVtZW50OiAkKFwiPGRpdiBzdHlsZT0nZGlzcGxheTppbmxpbmUtYmxvY2s7bWFyZ2luLXJpZ2h0Oi0xcHg7d2lkdGg6Y2FsYygxMDAlIC0gNDVweCk7Jz5cIiksXHJcblx0XHQkb3ZlcmxheTogdGhpcy4kb3ZlcmxheSxcclxuXHR9ICk7XHJcblx0Z2V0QmFubmVyT3B0aW9ucygpLnRoZW4oYmFubmVyT3B0aW9ucyA9PiB0aGlzLnNlYXJjaEJveC5zZXRTdWdnZXN0aW9ucyhiYW5uZXJPcHRpb25zKSk7XHJcblx0dGhpcy5hZGRCYW5uZXJCdXR0b24gPSBuZXcgT08udWkuQnV0dG9uV2lkZ2V0KCB7XHJcblx0XHRpY29uOiBcImFkZFwiLFxyXG5cdFx0dGl0bGU6IFwiQWRkXCIsXHJcblx0XHRmbGFnczogXCJwcm9ncmVzc2l2ZVwiLFxyXG5cdFx0JGVsZW1lbnQ6ICQoXCI8c3BhbiBzdHlsZT0nZmxvYXQ6cmlnaHQ7bWFyZ2luOjAnPlwiKSxcclxuXHR9ICk7XHJcblx0dmFyICRzZWFyY2hDb250YWluZXIgPSAkKFwiPGRpdiBzdHlsZT0nZGlzcGxheTppbmxpbmUtYmxvY2s7d2lkdGg6IGNhbGMoMTAwJSAtIDIyMHB4KTttaW4td2lkdGg6IDIyMHB4O2Zsb2F0OmxlZnQnPlwiKVxyXG5cdFx0LmFwcGVuZCh0aGlzLnNlYXJjaEJveC4kZWxlbWVudCwgdGhpcy5hZGRCYW5uZXJCdXR0b24uJGVsZW1lbnQpO1xyXG5cclxuXHQvLyBTZXQgYWxsIGNsYXNzZXMvaW1wb3J0YW5jZXMsIGluIHRoZSBzdHlsZSBvZiBhIHBvcHVwIGJ1dHRvbiB3aXRoIGEgbWVudS5cclxuXHQvLyAoSXMgYWN0dWFsbHkgYSBkcm9wZG93biB3aXRoIGEgaGlkZGVuIGxhYmVsLCBiZWNhdXNlIHRoYXQgbWFrZXMgdGhlIGNvZGluZyBlYXNpZXIuKVxyXG5cdHRoaXMuc2V0QWxsRHJvcERvd24gPSBuZXcgT08udWkuRHJvcGRvd25XaWRnZXQoIHtcclxuXHRcdGljb246IFwidGFnXCIsXHJcblx0XHRsYWJlbDogXCJTZXQgYWxsLi4uXCIsXHJcblx0XHRpbnZpc2libGVMYWJlbDogdHJ1ZSxcclxuXHRcdG1lbnU6IHtcclxuXHRcdFx0aXRlbXM6IFtcclxuXHRcdFx0XHRuZXcgT08udWkuTWVudVNlY3Rpb25PcHRpb25XaWRnZXQoIHtcclxuXHRcdFx0XHRcdGxhYmVsOiBcIkNsYXNzZXNcIlxyXG5cdFx0XHRcdH0gKSxcclxuXHRcdFx0XHQuLi5hcHBDb25maWcuYmFubmVyRGVmYXVsdHMuY2xhc3Nlcy5tYXAoY2xhc3NuYW1lID0+IG5ldyBPTy51aS5NZW51T3B0aW9uV2lkZ2V0KCB7XHJcblx0XHRcdFx0XHRkYXRhOiB7Y2xhc3M6IGNsYXNzbmFtZS50b0xvd2VyQ2FzZSgpfSxcclxuXHRcdFx0XHRcdGxhYmVsOiBjbGFzc25hbWVcclxuXHRcdFx0XHR9IClcclxuXHRcdFx0XHQpLFxyXG5cdFx0XHRcdG5ldyBPTy51aS5NZW51U2VjdGlvbk9wdGlvbldpZGdldCgge1xyXG5cdFx0XHRcdFx0bGFiZWw6IFwiSW1wb3J0YW5jZXNcIlxyXG5cdFx0XHRcdH0gKSxcclxuXHRcdFx0XHQuLi5hcHBDb25maWcuYmFubmVyRGVmYXVsdHMuaW1wb3J0YW5jZXMubWFwKGltcG9ydGFuY2UgPT4gbmV3IE9PLnVpLk1lbnVPcHRpb25XaWRnZXQoIHtcclxuXHRcdFx0XHRcdGRhdGE6IHtpbXBvcnRhbmNlOiBpbXBvcnRhbmNlLnRvTG93ZXJDYXNlKCl9LFxyXG5cdFx0XHRcdFx0bGFiZWw6IGltcG9ydGFuY2VcclxuXHRcdFx0XHR9IClcclxuXHRcdFx0XHQpXHJcblx0XHRcdF1cclxuXHRcdH0sXHJcblx0XHQkZWxlbWVudDogJChcIjxzcGFuIHN0eWxlPVxcXCJ3aWR0aDphdXRvO2Rpc3BsYXk6aW5saW5lLWJsb2NrO2Zsb2F0OmxlZnQ7bWFyZ2luOjBcXFwiIHRpdGxlPSdTZXQgYWxsLi4uJz5cIiksXHJcblx0XHQkb3ZlcmxheTogdGhpcy4kb3ZlcmxheSxcclxuXHR9ICk7XHJcblxyXG5cdC8vIFJlbW92ZSBhbGwgYmFubmVycyBidXR0b25cclxuXHR0aGlzLnJlbW92ZUFsbEJ1dHRvbiA9IG5ldyBPTy51aS5CdXR0b25XaWRnZXQoIHtcclxuXHRcdGljb246IFwidHJhc2hcIixcclxuXHRcdHRpdGxlOiBcIlJlbW92ZSBhbGxcIixcclxuXHRcdGZsYWdzOiBcImRlc3RydWN0aXZlXCJcclxuXHR9ICk7XHJcblxyXG5cdC8vIENsZWFyIGFsbCBwYXJhbWV0ZXJzIGJ1dHRvblxyXG5cdHRoaXMuY2xlYXJBbGxCdXR0b24gPSBuZXcgT08udWkuQnV0dG9uV2lkZ2V0KCB7XHJcblx0XHRpY29uOiBcImNhbmNlbFwiLFxyXG5cdFx0dGl0bGU6IFwiQ2xlYXIgYWxsXCIsXHJcblx0XHRmbGFnczogXCJkZXN0cnVjdGl2ZVwiXHJcblx0fSApO1xyXG5cclxuXHQvLyBCeXBhc3MgYWxsIHJlZGlyZWN0cyBidXR0b25cclxuXHR0aGlzLmJ5cGFzc0FsbEJ1dHRvbiA9IG5ldyBPTy51aS5CdXR0b25XaWRnZXQoIHtcclxuXHRcdGljb246IFwiYXJ0aWNsZVJlZGlyZWN0XCIsXHJcblx0XHR0aXRsZTogXCJCeXBhc3MgYWxsIHJlZGlyZWN0c1wiXHJcblx0fSApO1xyXG5cclxuXHQvLyBHcm91cCB0aGUgYnV0dG9ucyB0b2dldGhlclxyXG5cdHRoaXMubWVudUJ1dHRvbnMgPSBuZXcgT08udWkuQnV0dG9uR3JvdXBXaWRnZXQoIHtcclxuXHRcdGl0ZW1zOiBbXHJcblx0XHRcdHRoaXMucmVtb3ZlQWxsQnV0dG9uLFxyXG5cdFx0XHR0aGlzLmNsZWFyQWxsQnV0dG9uLFxyXG5cdFx0XHR0aGlzLmJ5cGFzc0FsbEJ1dHRvblxyXG5cdFx0XSxcclxuXHRcdCRlbGVtZW50OiAkKFwiPHNwYW4gc3R5bGU9J2Zsb2F0OmxlZnQ7Jz5cIiksXHJcblx0fSApO1xyXG5cdHRoaXMubWVudUJ1dHRvbnMuJGVsZW1lbnQucHJlcGVuZCh0aGlzLnNldEFsbERyb3BEb3duLiRlbGVtZW50KTtcclxuXHJcblx0Ly8gUHV0IGV2ZXJ5dGhpbmcgaW50byBhIGxheW91dFxyXG5cdHRoaXMudG9wQmFyID0gbmV3IE9PLnVpLlBhbmVsTGF5b3V0KCB7XHJcblx0XHRleHBhbmRlZDogZmFsc2UsXHJcblx0XHRmcmFtZWQ6IGZhbHNlLFxyXG5cdFx0cGFkZGVkOiBmYWxzZSxcclxuXHRcdCRlbGVtZW50OiAkKFwiPGRpdiBzdHlsZT0ncG9zaXRpb246Zml4ZWQ7d2lkdGg6MTAwJTtiYWNrZ3JvdW5kOiNjY2MnPlwiKVxyXG5cdH0gKTtcclxuXHR0aGlzLnRvcEJhci4kZWxlbWVudC5hcHBlbmQoXHJcblx0XHQkc2VhcmNoQ29udGFpbmVyLFxyXG5cdFx0Ly90aGlzLnNldEFsbERyb3BEb3duLiRlbGVtZW50LFxyXG5cdFx0dGhpcy5tZW51QnV0dG9ucy4kZWxlbWVudFxyXG5cdCk7XHJcblxyXG5cdC8vIEFwcGVuZCB0byB0aGUgZGVmYXVsdCBkaWFsb2cgaGVhZGVyXHJcblx0dGhpcy4kaGVhZC5jc3Moe1wiaGVpZ2h0XCI6XCI3M3B4XCJ9KS5hcHBlbmQodGhpcy50b3BCYXIuJGVsZW1lbnQpO1xyXG5cclxuXHQvKiAtLS0gQ09OVEVOVCBBUkVBIC0tLSAqL1xyXG5cclxuXHQvLyBCYW5uZXJzIGFkZGVkIGR5bmFtaWNhbGx5IHVwb24gb3BlbmluZywgc28ganVzdCBuZWVkIGEgbGF5b3V0IHdpdGggYW4gZW1wdHkgbGlzdFxyXG5cdHRoaXMuYmFubmVyTGlzdCA9IG5ldyBCYW5uZXJMaXN0V2lkZ2V0KCk7XHJcblxyXG5cdHRoaXMuJGJvZHkuY3NzKHtcInRvcFwiOlwiNzNweFwifSkuYXBwZW5kKHRoaXMuYmFubmVyTGlzdC4kZWxlbWVudCk7XHJcblxyXG5cdC8qIC0tLSBFVkVOVCBIQU5ETElORyAtLS0gKi9cclxuXHJcblx0dGhpcy5zZWFyY2hCb3guY29ubmVjdCh0aGlzLCB7XCJlbnRlclwiOiBcIm9uU2VhcmNoU2VsZWN0XCIgfSk7XHJcblx0dGhpcy5hZGRCYW5uZXJCdXR0b24uY29ubmVjdCh0aGlzLCB7XCJjbGlja1wiOiBcIm9uU2VhcmNoU2VsZWN0XCJ9KTtcclxufTtcclxuXHJcbi8vIE92ZXJyaWRlIHRoZSBnZXRCb2R5SGVpZ2h0KCkgbWV0aG9kIHRvIHNwZWNpZnkgYSBjdXN0b20gaGVpZ2h0XHJcbk1haW5XaW5kb3cucHJvdG90eXBlLmdldEJvZHlIZWlnaHQgPSBmdW5jdGlvbiAoKSB7XHJcblx0cmV0dXJuIE1hdGgubWF4KDIwMCwgdGhpcy5iYW5uZXJMaXN0LiRlbGVtZW50Lm91dGVySGVpZ2h0KCB0cnVlICkpO1xyXG59O1xyXG5cclxuLy8gVXNlIGdldFNldHVwUHJvY2VzcygpIHRvIHNldCB1cCB0aGUgd2luZG93IHdpdGggZGF0YSBwYXNzZWQgdG8gaXQgYXQgdGhlIHRpbWUgXHJcbi8vIG9mIG9wZW5pbmdcclxuTWFpbldpbmRvdy5wcm90b3R5cGUuZ2V0U2V0dXBQcm9jZXNzID0gZnVuY3Rpb24gKCBkYXRhICkge1xyXG5cdGRhdGEgPSBkYXRhIHx8IHt9O1xyXG5cdHJldHVybiBNYWluV2luZG93LnN1cGVyLnByb3RvdHlwZS5nZXRTZXR1cFByb2Nlc3MuY2FsbCggdGhpcywgZGF0YSApXHJcblx0XHQubmV4dCggKCkgPT4ge1xyXG5cdFx0XHQvLyBUT0RPOiBTZXQgdXAgd2luZG93IGJhc2VkIG9uIGRhdGFcclxuXHRcdFx0dGhpcy5iYW5uZXJMaXN0LmFkZEl0ZW1zKFxyXG5cdFx0XHRcdGRhdGEuYmFubmVycy5tYXAoYmFubmVyVGVtcGxhdGUgPT4gbmV3IEJhbm5lcldpZGdldChiYW5uZXJUZW1wbGF0ZSkpXHJcblx0XHRcdCk7XHJcblx0XHRcdHRoaXMudGFsa1dpa2l0ZXh0ID0gZGF0YS50YWxrV2lraXRleHQ7XHJcblx0XHRcdHRoaXMudGFsa3BhZ2UgPSBkYXRhLnRhbGtwYWdlO1xyXG5cdFx0XHR0aGlzLnVwZGF0ZVNpemUoKTtcclxuXHRcdH0sIHRoaXMgKTtcclxufTtcclxuXHJcbi8vIFNldCB1cCB0aGUgd2luZG93IGl0IGlzIHJlYWR5OiBhdHRhY2hlZCB0byB0aGUgRE9NLCBhbmQgb3BlbmluZyBhbmltYXRpb24gY29tcGxldGVkXHJcbk1haW5XaW5kb3cucHJvdG90eXBlLmdldFJlYWR5UHJvY2VzcyA9IGZ1bmN0aW9uICggZGF0YSApIHtcclxuXHRkYXRhID0gZGF0YSB8fCB7fTtcclxuXHRyZXR1cm4gTWFpbldpbmRvdy5zdXBlci5wcm90b3R5cGUuZ2V0UmVhZHlQcm9jZXNzLmNhbGwoIHRoaXMsIGRhdGEgKVxyXG5cdFx0Lm5leHQoICgpID0+IHRoaXMuc2VhcmNoQm94LmZvY3VzKCkgKTtcclxufTtcclxuXHJcbk1haW5XaW5kb3cucHJvdG90eXBlLm9uU2VhcmNoU2VsZWN0ID0gZnVuY3Rpb24oKSB7XHJcblx0dmFyIG5hbWUgPSB0aGlzLnNlYXJjaEJveC5nZXRWYWx1ZSgpLnRyaW0oKTtcclxuXHRpZiAoIW5hbWUpIHtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblx0dmFyIGV4aXN0aW5nQmFubmVyID0gdGhpcy5iYW5uZXJMaXN0Lml0ZW1zLmZpbmQoYmFubmVyID0+IHtcclxuXHRcdHJldHVybiAoXHJcblx0XHRcdGJhbm5lci50ZW1wbGF0ZS5nZXRUaXRsZSgpLmdldE1haW5UZXh0KCkgPT09IG5hbWUgfHxcclxuXHRcdFx0YmFubmVyLnRlbXBsYXRlLnJlZGlyZWN0VGFyZ2V0ICYmIGJhbm5lci50ZW1wbGF0ZS5yZWRpcmVjdFRhcmdldC5nZXRNYWluVGV4dCgpID09PSBuYW1lXHJcblx0XHQpO1xyXG5cdH0pO1xyXG5cdGlmIChleGlzdGluZ0Jhbm5lcikge1xyXG5cdFx0Ly8gVE9ETzogc2hvdyBlcnJvciBtZXNzYWdlXHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cdGlmICghL15bV3ddKD86UHxpa2lbUHBdcm9qZWN0KS8udGVzdChuYW1lKSkge1xyXG5cdFx0dmFyIG1lc3NhZ2UgPSBuZXcgT08udWkuSHRtbFNuaXBwZXQoXHJcblx0XHRcdFwiPGNvZGU+e3tcIiArIG5hbWUgKyBcIn19PC9jb2RlPiBpcyBub3QgYSByZWNvZ25pc2VkIFdpa2lQcm9qZWN0IGJhbm5lci48YnIvPkRvIHlvdSB3YW50IHRvIGNvbnRpbnVlP1wiXHJcblx0XHQpO1xyXG5cdFx0Ly8gVE9ETzogYXNrIGZvciBjb25maXJtYXRpb25cclxuXHRcdGNvbnNvbGUubG9nKG1lc3NhZ2UpO1xyXG5cdH1cclxuXHRpZiAobmFtZSA9PT0gXCJXaWtpUHJvamVjdCBEaXNhbWJpZ3VhdGlvblwiICYmICQoXCIjY2EtdGFsay5uZXdcIikubGVuZ3RoICE9PSAwICYmIHRoaXMuYmFubmVyTGlzdC5pdGVtcy5sZW5ndGggPT09IDApIHtcclxuXHRcdHZhciBub05ld0RhYk1lc3NhZ2UgPSBcIk5ldyB0YWxrIHBhZ2VzIHNob3VsZG4ndCBiZSBjcmVhdGVkIGlmIHRoZXkgd2lsbCBvbmx5IGNvbnRhaW4gdGhlIHt7V2lraVByb2plY3QgRGlzYW1iaWd1YXRpb259fSBiYW5uZXIuIENvbnRpbnVlP1wiO1xyXG5cdFx0Ly8gVE9ETzogYXNrIGZvciBjb25maXJtYXRpb25cclxuXHRcdGNvbnNvbGUubG9nKG5vTmV3RGFiTWVzc2FnZSk7XHJcblx0fVxyXG5cdC8vIENyZWF0ZSBUZW1wbGF0ZSBvYmplY3RcclxuXHR2YXIgdGVtcGxhdGUgPSBuZXcgVGVtcGxhdGUoKTtcclxuXHR0ZW1wbGF0ZS5uYW1lID0gbmFtZTtcclxuXHRnZXRXaXRoUmVkaXJlY3RUbyh0ZW1wbGF0ZSlcclxuXHRcdC50aGVuKGZ1bmN0aW9uKHRlbXBsYXRlKSB7XHJcblx0XHRcdHJldHVybiAkLndoZW4oXHJcblx0XHRcdFx0dGVtcGxhdGUuc2V0Q2xhc3Nlc0FuZEltcG9ydGFuY2VzKCksXHJcblx0XHRcdFx0dGVtcGxhdGUuc2V0UGFyYW1EYXRhQW5kU3VnZ2VzdGlvbnMoKVxyXG5cdFx0XHQpLnRoZW4oKCkgPT4ge1xyXG5cdFx0XHRcdC8vIFJldHVybiB0aGUgbm93LW1vZGlmaWVkIHRlbXBsYXRlc1xyXG5cdFx0XHRcdHJldHVybiB0ZW1wbGF0ZTtcclxuXHRcdFx0fSk7XHJcblx0XHR9KVxyXG5cdFx0LnRoZW4odGVtcGxhdGUgPT4ge1xyXG5cdFx0XHR0aGlzLmJhbm5lckxpc3QuYWRkSXRlbXMoIFtuZXcgQmFubmVyV2lkZ2V0KHRlbXBsYXRlKV0gKTtcclxuXHRcdFx0dGhpcy51cGRhdGVTaXplKCk7XHJcblx0XHR9KTtcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IE1haW5XaW5kb3c7IiwiaW1wb3J0IGNvbmZpZyBmcm9tIFwiLi9jb25maWdcIjtcclxuaW1wb3J0IHtBUEksIG1ha2VFcnJvck1zZ30gZnJvbSBcIi4vdXRpbFwiO1xyXG5pbXBvcnQgc2V0dXBSYXRlciBmcm9tIFwiLi9zZXR1cFwiO1xyXG5cclxudmFyIGF1dG9TdGFydCA9IGZ1bmN0aW9uIGF1dG9TdGFydCgpIHtcclxuXHRpZiAoIHdpbmRvdy5yYXRlcl9hdXRvc3RhcnROYW1lc3BhY2VzID09IG51bGwgfHwgY29uZmlnLm13LndnSXNNYWluUGFnZSApIHtcclxuXHRcdHJldHVybiAkLkRlZmVycmVkKCkucmVqZWN0KCk7XHJcblx0fVxyXG5cdFxyXG5cdHZhciBhdXRvc3RhcnROYW1lc3BhY2VzID0gKCAkLmlzQXJyYXkod2luZG93LnJhdGVyX2F1dG9zdGFydE5hbWVzcGFjZXMpICkgPyB3aW5kb3cucmF0ZXJfYXV0b3N0YXJ0TmFtZXNwYWNlcyA6IFt3aW5kb3cucmF0ZXJfYXV0b3N0YXJ0TmFtZXNwYWNlc107XHJcblx0XHJcblx0aWYgKCAtMSA9PT0gYXV0b3N0YXJ0TmFtZXNwYWNlcy5pbmRleE9mKGNvbmZpZy5tdy53Z05hbWVzcGFjZU51bWJlcikgKSB7XHJcblx0XHRyZXR1cm4gJC5EZWZlcnJlZCgpLnJlamVjdCgpO1xyXG5cdH1cclxuXHRcclxuXHRpZiAoIC8oPzpcXD98JikoPzphY3Rpb258ZGlmZnxvbGRpZCk9Ly50ZXN0KHdpbmRvdy5sb2NhdGlvbi5ocmVmKSApIHtcclxuXHRcdHJldHVybiAkLkRlZmVycmVkKCkucmVqZWN0KCk7XHJcblx0fVxyXG5cdFxyXG5cdC8vIENoZWNrIGlmIHRhbGsgcGFnZSBleGlzdHNcclxuXHRpZiAoICQoXCIjY2EtdGFsay5uZXdcIikubGVuZ3RoICkge1xyXG5cdFx0cmV0dXJuIHNldHVwUmF0ZXIoKTtcclxuXHR9XHJcblx0XHJcblx0dmFyIHRoaXNQYWdlID0gbXcuVGl0bGUubmV3RnJvbVRleHQoY29uZmlnLm13LndnUGFnZU5hbWUpO1xyXG5cdHZhciB0YWxrUGFnZSA9IHRoaXNQYWdlICYmIHRoaXNQYWdlLmdldFRhbGtQYWdlKCk7XHJcblx0aWYgKCF0YWxrUGFnZSkge1xyXG5cdFx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3QoKTtcclxuXHR9XHJcblxyXG5cdC8qIENoZWNrIHRlbXBsYXRlcyBwcmVzZW50IG9uIHRhbGsgcGFnZS4gRmV0Y2hlcyBpbmRpcmVjdGx5IHRyYW5zY2x1ZGVkIHRlbXBsYXRlcywgc28gd2lsbCBmaW5kXHJcblx0XHRUZW1wbGF0ZTpXUEJhbm5lck1ldGEgKGFuZCBpdHMgc3VidGVtcGxhdGVzKS4gQnV0IHNvbWUgYmFubmVycyBzdWNoIGFzIE1JTEhJU1QgZG9uJ3QgdXNlIHRoYXRcclxuXHRcdG1ldGEgdGVtcGxhdGUsIHNvIHdlIGFsc28gaGF2ZSB0byBjaGVjayBmb3IgdGVtcGxhdGUgdGl0bGVzIGNvbnRhaW5nICdXaWtpUHJvamVjdCdcclxuXHQqL1xyXG5cdHJldHVybiBBUEkuZ2V0KHtcclxuXHRcdGFjdGlvbjogXCJxdWVyeVwiLFxyXG5cdFx0Zm9ybWF0OiBcImpzb25cIixcclxuXHRcdHByb3A6IFwidGVtcGxhdGVzXCIsXHJcblx0XHR0aXRsZXM6IHRhbGtQYWdlLmdldFByZWZpeGVkVGV4dCgpLFxyXG5cdFx0dGxuYW1lc3BhY2U6IFwiMTBcIixcclxuXHRcdHRsbGltaXQ6IFwiNTAwXCIsXHJcblx0XHRpbmRleHBhZ2VpZHM6IDFcclxuXHR9KVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24ocmVzdWx0KSB7XHJcblx0XHRcdHZhciBpZCA9IHJlc3VsdC5xdWVyeS5wYWdlaWRzO1xyXG5cdFx0XHR2YXIgdGVtcGxhdGVzID0gcmVzdWx0LnF1ZXJ5LnBhZ2VzW2lkXS50ZW1wbGF0ZXM7XHJcblx0XHRcclxuXHRcdFx0aWYgKCAhdGVtcGxhdGVzICkge1xyXG5cdFx0XHRcdHJldHVybiBzZXR1cFJhdGVyKCk7XHJcblx0XHRcdH1cclxuXHRcdFxyXG5cdFx0XHR2YXIgaGFzV2lraXByb2plY3QgPSB0ZW1wbGF0ZXMuc29tZSh0ZW1wbGF0ZSA9PiAvKFdpa2lQcm9qZWN0fFdQQmFubmVyKS8udGVzdCh0ZW1wbGF0ZS50aXRsZSkpO1xyXG5cdFx0XHJcblx0XHRcdGlmICggIWhhc1dpa2lwcm9qZWN0ICkge1xyXG5cdFx0XHRcdHJldHVybiBzZXR1cFJhdGVyKCk7XHJcblx0XHRcdH1cclxuXHRcdFxyXG5cdFx0fSxcclxuXHRcdGZ1bmN0aW9uKGNvZGUsIGpxeGhyKSB7XHJcblx0XHQvLyBTaWxlbnRseSBpZ25vcmUgZmFpbHVyZXMgKGp1c3QgbG9nIHRvIGNvbnNvbGUpXHJcblx0XHRcdGNvbnNvbGUud2FybihcclxuXHRcdFx0XHRcIltSYXRlcl0gRXJyb3Igd2hpbGUgY2hlY2tpbmcgd2hldGhlciB0byBhdXRvc3RhcnQuXCIgK1xyXG5cdFx0XHQoIGNvZGUgPT0gbnVsbCApID8gXCJcIiA6IFwiIFwiICsgbWFrZUVycm9yTXNnKGNvZGUsIGpxeGhyKVxyXG5cdFx0XHQpO1xyXG5cdFx0XHRyZXR1cm4gJC5EZWZlcnJlZCgpLnJlamVjdCgpO1xyXG5cdFx0fSk7XHJcblxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgYXV0b1N0YXJ0OyIsImltcG9ydCB7aXNBZnRlckRhdGV9IGZyb20gXCIuL3V0aWxcIjtcclxuXHJcbi8qKiB3cml0ZVxyXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5XHJcbiAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fSB2YWxcclxuICogQHBhcmFtIHtOdW1iZXJ9IHN0YWxlRGF5cyBOdW1iZXIgb2YgZGF5cyBhZnRlciB3aGljaCB0aGUgZGF0YSBiZWNvbWVzIHN0YWxlICh1c2FibGUsIGJ1dCBzaG91bGRcclxuICogIGJlIHVwZGF0ZWQgZm9yIG5leHQgdGltZSkuXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBleHBpcnlEYXlzIE51bWJlciBvZiBkYXlzIGFmdGVyIHdoaWNoIHRoZSBjYWNoZWQgZGF0YSBtYXkgYmUgZGVsZXRlZC5cclxuICovXHJcbnZhciB3cml0ZSA9IGZ1bmN0aW9uKGtleSwgdmFsLCBzdGFsZURheXMsIGV4cGlyeURheXMpIHtcclxuXHR0cnkge1xyXG5cdFx0dmFyIGRlZmF1bHRTdGFsZURheXMgPSAxO1xyXG5cdFx0dmFyIGRlZmF1bHRFeHBpcnlEYXlzID0gMzA7XHJcblx0XHR2YXIgbWlsbGlzZWNvbmRzUGVyRGF5ID0gMjQqNjAqNjAqMTAwMDtcclxuXHJcblx0XHR2YXIgc3RhbGVEdXJhdGlvbiA9IChzdGFsZURheXMgfHwgZGVmYXVsdFN0YWxlRGF5cykqbWlsbGlzZWNvbmRzUGVyRGF5O1xyXG5cdFx0dmFyIGV4cGlyeUR1cmF0aW9uID0gKGV4cGlyeURheXMgfHwgZGVmYXVsdEV4cGlyeURheXMpKm1pbGxpc2Vjb25kc1BlckRheTtcclxuXHRcdFxyXG5cdFx0dmFyIHN0cmluZ1ZhbCA9IEpTT04uc3RyaW5naWZ5KHtcclxuXHRcdFx0dmFsdWU6IHZhbCxcclxuXHRcdFx0c3RhbGVEYXRlOiBuZXcgRGF0ZShEYXRlLm5vdygpICsgc3RhbGVEdXJhdGlvbikudG9JU09TdHJpbmcoKSxcclxuXHRcdFx0ZXhwaXJ5RGF0ZTogbmV3IERhdGUoRGF0ZS5ub3coKSArIGV4cGlyeUR1cmF0aW9uKS50b0lTT1N0cmluZygpXHJcblx0XHR9KTtcclxuXHRcdGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwiUmF0ZXItXCIra2V5LCBzdHJpbmdWYWwpO1xyXG5cdH0gIGNhdGNoKGUpIHt9IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tZW1wdHlcclxufTtcclxuLyoqIHJlYWRcclxuICogQHBhcmFtIHtTdHJpbmd9IGtleVxyXG4gKiBAcmV0dXJucyB7QXJyYXl8T2JqZWN0fFN0cmluZ3xOdWxsfSBDYWNoZWQgYXJyYXkgb3Igb2JqZWN0LCBvciBlbXB0eSBzdHJpbmcgaWYgbm90IHlldCBjYWNoZWQsXHJcbiAqICAgICAgICAgIG9yIG51bGwgaWYgdGhlcmUgd2FzIGVycm9yLlxyXG4gKi9cclxudmFyIHJlYWQgPSBmdW5jdGlvbihrZXkpIHtcclxuXHR2YXIgdmFsO1xyXG5cdHRyeSB7XHJcblx0XHR2YXIgc3RyaW5nVmFsID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJSYXRlci1cIitrZXkpO1xyXG5cdFx0aWYgKCBzdHJpbmdWYWwgIT09IFwiXCIgKSB7XHJcblx0XHRcdHZhbCA9IEpTT04ucGFyc2Uoc3RyaW5nVmFsKTtcclxuXHRcdH1cclxuXHR9ICBjYXRjaChlKSB7XHJcblx0XHRjb25zb2xlLmxvZyhcIltSYXRlcl0gZXJyb3IgcmVhZGluZyBcIiArIGtleSArIFwiIGZyb20gbG9jYWxTdG9yYWdlIGNhY2hlOlwiKTtcclxuXHRcdGNvbnNvbGUubG9nKFxyXG5cdFx0XHRcIlxcdFwiICsgZS5uYW1lICsgXCIgbWVzc2FnZTogXCIgKyBlLm1lc3NhZ2UgK1xyXG5cdFx0XHQoIGUuYXQgPyBcIiBhdDogXCIgKyBlLmF0IDogXCJcIikgK1xyXG5cdFx0XHQoIGUudGV4dCA/IFwiIHRleHQ6IFwiICsgZS50ZXh0IDogXCJcIilcclxuXHRcdCk7XHJcblx0fVxyXG5cdHJldHVybiB2YWwgfHwgbnVsbDtcclxufTtcclxudmFyIGNsZWFySXRlbUlmSW52YWxpZCA9IGZ1bmN0aW9uKGtleSkge1xyXG5cdHZhciBpc1JhdGVyS2V5ID0ga2V5LmluZGV4T2YoXCJSYXRlci1cIikgPT09IDA7XHJcblx0aWYgKCAhaXNSYXRlcktleSApIHtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblx0dmFyIGl0ZW0gPSByZWFkKGtleS5yZXBsYWNlKFwiUmF0ZXItXCIsXCJcIikpO1xyXG5cdHZhciBpc0ludmFsaWQgPSAhaXRlbSB8fCAhaXRlbS5leHBpcnlEYXRlIHx8IGlzQWZ0ZXJEYXRlKGl0ZW0uZXhwaXJ5RGF0ZSk7XHJcblx0aWYgKCBpc0ludmFsaWQgKSB7XHJcblx0XHRsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShrZXkpO1xyXG5cdH1cclxufTtcclxudmFyIGNsZWFySW52YWxpZEl0ZW1zID0gZnVuY3Rpb24oKSB7XHJcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBsb2NhbFN0b3JhZ2UubGVuZ3RoOyBpKyspIHtcclxuXHRcdHNldFRpbWVvdXQoY2xlYXJJdGVtSWZJbnZhbGlkLCAxMDAsIGxvY2FsU3RvcmFnZS5rZXkoaSkpO1xyXG5cdH1cclxufTtcclxuXHJcbmV4cG9ydCB7IHdyaXRlLCByZWFkLCBjbGVhckl0ZW1JZkludmFsaWQsIGNsZWFySW52YWxpZEl0ZW1zIH07IiwiLy8gQSBnbG9iYWwgb2JqZWN0IHRoYXQgc3RvcmVzIGFsbCB0aGUgcGFnZSBhbmQgdXNlciBjb25maWd1cmF0aW9uIGFuZCBzZXR0aW5nc1xyXG52YXIgY29uZmlnID0ge307XHJcbi8vIFNjcmlwdCBpbmZvXHJcbmNvbmZpZy5zY3JpcHQgPSB7XHJcblx0Ly8gQWR2ZXJ0IHRvIGFwcGVuZCB0byBlZGl0IHN1bW1hcmllc1xyXG5cdGFkdmVydDogIFwiIChbW1VzZXI6RXZhZDM3L3JhdGVyLmpzfFJhdGVyXV0pXCIsXHJcblx0dmVyc2lvbjogXCIyLjAuMFwiXHJcbn07XHJcbi8vIFByZWZlcmVuY2VzOiBnbG9iYWxzIHZhcnMgYWRkZWQgdG8gdXNlcnMnIGNvbW1vbi5qcywgb3Igc2V0IHRvIGRlZmF1bHRzIGlmIHVuZGVmaW5lZFxyXG5jb25maWcucHJlZnMgPSB7XHJcblx0d2F0Y2hsaXN0OiB3aW5kb3cucmF0ZXJfd2F0Y2hsaXN0IHx8IFwicHJlZmVyZW5jZXNcIlxyXG59O1xyXG4vLyBNZWRpYVdpa2kgY29uZmlndXJhdGlvbiB2YWx1ZXNcclxuY29uZmlnLm13ID0gbXcuY29uZmlnLmdldCggW1xyXG5cdFwic2tpblwiLFxyXG5cdFwid2dQYWdlTmFtZVwiLFxyXG5cdFwid2dOYW1lc3BhY2VOdW1iZXJcIixcclxuXHRcIndnVXNlck5hbWVcIixcclxuXHRcIndnRm9ybWF0dGVkTmFtZXNwYWNlc1wiLFxyXG5cdFwid2dNb250aE5hbWVzXCIsXHJcblx0XCJ3Z1JldmlzaW9uSWRcIixcclxuXHRcIndnU2NyaXB0UGF0aFwiLFxyXG5cdFwid2dTZXJ2ZXJcIixcclxuXHRcIndnQ2F0ZWdvcmllc1wiLFxyXG5cdFwid2dJc01haW5QYWdlXCJcclxuXSApO1xyXG5cclxuY29uZmlnLnJlZ2V4ID0geyAvKiBlc2xpbnQtZGlzYWJsZSBuby11c2VsZXNzLWVzY2FwZSAqL1xyXG5cdC8vIFBhdHRlcm4gdG8gZmluZCB0ZW1wbGF0ZXMsIHdoaWNoIG1heSBjb250YWluIG90aGVyIHRlbXBsYXRlc1xyXG5cdHRlbXBsYXRlOlx0XHQvXFx7XFx7XFxzKihbXiNcXHtcXHNdLis/KVxccyooXFx8KD86LnxcXG4pKj8oPzooPzpcXHtcXHsoPzoufFxcbikqPyg/Oig/Olxce1xceyg/Oi58XFxuKSo/XFx9XFx9KSg/Oi58XFxuKSo/KSo/XFx9XFx9KSg/Oi58XFxuKSo/KSp8KVxcfVxcfVxcbj8vZyxcclxuXHQvLyBQYXR0ZXJuIHRvIGZpbmQgYHxwYXJhbT12YWx1ZWAgb3IgYHx2YWx1ZWAsIHdoZXJlIGB2YWx1ZWAgY2FuIG9ubHkgY29udGFpbiBhIHBpcGVcclxuXHQvLyBpZiB3aXRoaW4gc3F1YXJlIGJyYWNrZXRzIChpLmUuIHdpa2lsaW5rcykgb3IgYnJhY2VzIChpLmUuIHRlbXBsYXRlcylcclxuXHR0ZW1wbGF0ZVBhcmFtczpcdC9cXHwoPyEoPzpbXntdK318W15cXFtdK10pKSg/Oi58XFxzKSo/KD89KD86XFx8fCQpKD8hKD86W157XSt9fFteXFxbXStdKSkpL2dcclxufTsgLyogZXNsaW50LWVuYWJsZSBuby11c2VsZXNzLWVzY2FwZSAqL1xyXG5jb25maWcuZGVmZXJyZWQgPSB7fTtcclxuY29uZmlnLmJhbm5lckRlZmF1bHRzID0ge1xyXG5cdGNsYXNzZXM6IFtcclxuXHRcdFwiRkFcIixcclxuXHRcdFwiRkxcIixcclxuXHRcdFwiQVwiLFxyXG5cdFx0XCJHQVwiLFxyXG5cdFx0XCJCXCIsXHJcblx0XHRcIkNcIixcclxuXHRcdFwiU3RhcnRcIixcclxuXHRcdFwiU3R1YlwiLFxyXG5cdFx0XCJMaXN0XCJcclxuXHRdLFxyXG5cdGltcG9ydGFuY2VzOiBbXHJcblx0XHRcIlRvcFwiLFxyXG5cdFx0XCJIaWdoXCIsXHJcblx0XHRcIk1pZFwiLFxyXG5cdFx0XCJMb3dcIlxyXG5cdF0sXHJcblx0ZXh0ZW5kZWRDbGFzc2VzOiBbXHJcblx0XHRcIkNhdGVnb3J5XCIsXHJcblx0XHRcIkRyYWZ0XCIsXHJcblx0XHRcIkZpbGVcIixcclxuXHRcdFwiUG9ydGFsXCIsXHJcblx0XHRcIlByb2plY3RcIixcclxuXHRcdFwiVGVtcGxhdGVcIixcclxuXHRcdFwiQnBsdXNcIixcclxuXHRcdFwiRnV0dXJlXCIsXHJcblx0XHRcIkN1cnJlbnRcIixcclxuXHRcdFwiRGlzYW1iaWdcIixcclxuXHRcdFwiTkFcIixcclxuXHRcdFwiUmVkaXJlY3RcIixcclxuXHRcdFwiQm9va1wiXHJcblx0XSxcclxuXHRleHRlbmRlZEltcG9ydGFuY2VzOiBbXHJcblx0XHRcIlRvcFwiLFxyXG5cdFx0XCJIaWdoXCIsXHJcblx0XHRcIk1pZFwiLFxyXG5cdFx0XCJMb3dcIixcclxuXHRcdFwiQm90dG9tXCIsXHJcblx0XHRcIk5BXCJcclxuXHRdXHJcbn07XHJcbmNvbmZpZy5jdXN0b21DbGFzc2VzID0ge1xyXG5cdFwiV2lraVByb2plY3QgTWlsaXRhcnkgaGlzdG9yeVwiOiBbXHJcblx0XHRcIkFMXCIsXHJcblx0XHRcIkJMXCIsXHJcblx0XHRcIkNMXCJcclxuXHRdLFxyXG5cdFwiV2lraVByb2plY3QgUG9ydGFsc1wiOiBbXHJcblx0XHRcIkZQb1wiLFxyXG5cdFx0XCJDb21wbGV0ZVwiLFxyXG5cdFx0XCJTdWJzdGFudGlhbFwiLFxyXG5cdFx0XCJCYXNpY1wiLFxyXG5cdFx0XCJJbmNvbXBsZXRlXCIsXHJcblx0XHRcIk1ldGFcIlxyXG5cdF1cclxufTtcclxuY29uZmlnLnNoZWxsVGVtcGxhdGVzID0gW1xyXG5cdFwiV2lraVByb2plY3QgYmFubmVyIHNoZWxsXCIsXHJcblx0XCJXaWtpUHJvamVjdEJhbm5lcnNcIixcclxuXHRcIldpa2lQcm9qZWN0IEJhbm5lcnNcIixcclxuXHRcIldQQlwiLFxyXG5cdFwiV1BCU1wiLFxyXG5cdFwiV2lraXByb2plY3RiYW5uZXJzaGVsbFwiLFxyXG5cdFwiV2lraVByb2plY3QgQmFubmVyIFNoZWxsXCIsXHJcblx0XCJXcGJcIixcclxuXHRcIldQQmFubmVyU2hlbGxcIixcclxuXHRcIldwYnNcIixcclxuXHRcIldpa2lwcm9qZWN0YmFubmVyc1wiLFxyXG5cdFwiV1AgQmFubmVyIFNoZWxsXCIsXHJcblx0XCJXUCBiYW5uZXIgc2hlbGxcIixcclxuXHRcIkJhbm5lcnNoZWxsXCIsXHJcblx0XCJXaWtpcHJvamVjdCBiYW5uZXIgc2hlbGxcIixcclxuXHRcIldpa2lQcm9qZWN0IEJhbm5lcnMgU2hlbGxcIixcclxuXHRcIldpa2lQcm9qZWN0QmFubmVyIFNoZWxsXCIsXHJcblx0XCJXaWtpUHJvamVjdEJhbm5lclNoZWxsXCIsXHJcblx0XCJXaWtpUHJvamVjdCBCYW5uZXJTaGVsbFwiLFxyXG5cdFwiV2lraXByb2plY3RCYW5uZXJTaGVsbFwiLFxyXG5cdFwiV2lraVByb2plY3QgYmFubmVyIHNoZWxsL3JlZGlyZWN0XCIsXHJcblx0XCJXaWtpUHJvamVjdCBTaGVsbFwiLFxyXG5cdFwiQmFubmVyIHNoZWxsXCIsXHJcblx0XCJTY29wZSBzaGVsbFwiLFxyXG5cdFwiUHJvamVjdCBzaGVsbFwiLFxyXG5cdFwiV2lraVByb2plY3QgYmFubmVyXCJcclxuXTtcclxuY29uZmlnLmRlZmF1bHRQYXJhbWV0ZXJEYXRhID0ge1xyXG5cdFwiYXV0b1wiOiB7XHJcblx0XHRcImxhYmVsXCI6IHtcclxuXHRcdFx0XCJlblwiOiBcIkF1dG8tcmF0ZWRcIlxyXG5cdFx0fSxcclxuXHRcdFwiZGVzY3JpcHRpb25cIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiQXV0b21hdGljYWxseSByYXRlZCBieSBhIGJvdC4gQWxsb3dlZCB2YWx1ZXM6IFsneWVzJ10uXCJcclxuXHRcdH0sXHJcblx0XHRcImF1dG92YWx1ZVwiOiBcInllc1wiXHJcblx0fSxcclxuXHRcImxpc3Rhc1wiOiB7XHJcblx0XHRcImxhYmVsXCI6IHtcclxuXHRcdFx0XCJlblwiOiBcIkxpc3QgYXNcIlxyXG5cdFx0fSxcclxuXHRcdFwiZGVzY3JpcHRpb25cIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiU29ydGtleSBmb3IgdGFsayBwYWdlXCJcclxuXHRcdH1cclxuXHR9LFxyXG5cdFwic21hbGxcIjoge1xyXG5cdFx0XCJsYWJlbFwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJTbWFsbD9cIixcclxuXHRcdH0sXHJcblx0XHRcImRlc2NyaXB0aW9uXCI6IHtcclxuXHRcdFx0XCJlblwiOiBcIkRpc3BsYXkgYSBzbWFsbCB2ZXJzaW9uLiBBbGxvd2VkIHZhbHVlczogWyd5ZXMnXS5cIlxyXG5cdFx0fSxcclxuXHRcdFwiYXV0b3ZhbHVlXCI6IFwieWVzXCJcclxuXHR9LFxyXG5cdFwiYXR0ZW50aW9uXCI6IHtcclxuXHRcdFwibGFiZWxcIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiQXR0ZW50aW9uIHJlcXVpcmVkP1wiLFxyXG5cdFx0fSxcclxuXHRcdFwiZGVzY3JpcHRpb25cIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiSW1tZWRpYXRlIGF0dGVudGlvbiByZXF1aXJlZC4gQWxsb3dlZCB2YWx1ZXM6IFsneWVzJ10uXCJcclxuXHRcdH0sXHJcblx0XHRcImF1dG92YWx1ZVwiOiBcInllc1wiXHJcblx0fSxcclxuXHRcIm5lZWRzLWltYWdlXCI6IHtcclxuXHRcdFwibGFiZWxcIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiTmVlZHMgaW1hZ2U/XCIsXHJcblx0XHR9LFxyXG5cdFx0XCJkZXNjcmlwdGlvblwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJSZXF1ZXN0IHRoYXQgYW4gaW1hZ2Ugb3IgcGhvdG9ncmFwaCBvZiB0aGUgc3ViamVjdCBiZSBhZGRlZCB0byB0aGUgYXJ0aWNsZS4gQWxsb3dlZCB2YWx1ZXM6IFsneWVzJ10uXCJcclxuXHRcdH0sXHJcblx0XHRcImFsaWFzZXNcIjogW1xyXG5cdFx0XHRcIm5lZWRzLXBob3RvXCJcclxuXHRcdF0sXHJcblx0XHRcImF1dG92YWx1ZVwiOiBcInllc1wiLFxyXG5cdFx0XCJzdWdnZXN0ZWRcIjogdHJ1ZVxyXG5cdH0sXHJcblx0XCJuZWVkcy1pbmZvYm94XCI6IHtcclxuXHRcdFwibGFiZWxcIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiTmVlZHMgaW5mb2JveD9cIixcclxuXHRcdH0sXHJcblx0XHRcImRlc2NyaXB0aW9uXCI6IHtcclxuXHRcdFx0XCJlblwiOiBcIlJlcXVlc3QgdGhhdCBhbiBpbmZvYm94IGJlIGFkZGVkIHRvIHRoZSBhcnRpY2xlLiBBbGxvd2VkIHZhbHVlczogWyd5ZXMnXS5cIlxyXG5cdFx0fSxcclxuXHRcdFwiYWxpYXNlc1wiOiBbXHJcblx0XHRcdFwibmVlZHMtcGhvdG9cIlxyXG5cdFx0XSxcclxuXHRcdFwiYXV0b3ZhbHVlXCI6IFwieWVzXCIsXHJcblx0XHRcInN1Z2dlc3RlZFwiOiB0cnVlXHJcblx0fVxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY29uZmlnOyIsIi8vIEF0dHJpYnV0aW9uOiBEaWZmIHN0eWxlcyBmcm9tIDxodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9XaWtpcGVkaWE6QXV0b1dpa2lCcm93c2VyL3N0eWxlLmNzcz5cclxudmFyIGRpZmZTdHlsZXMgPSBgdGFibGUuZGlmZiwgdGQuZGlmZi1vdGl0bGUsIHRkLmRpZmYtbnRpdGxlIHsgYmFja2dyb3VuZC1jb2xvcjogd2hpdGU7IH1cclxudGQuZGlmZi1vdGl0bGUsIHRkLmRpZmYtbnRpdGxlIHsgdGV4dC1hbGlnbjogY2VudGVyOyB9XHJcbnRkLmRpZmYtbWFya2VyIHsgdGV4dC1hbGlnbjogcmlnaHQ7IGZvbnQtd2VpZ2h0OiBib2xkOyBmb250LXNpemU6IDEuMjVlbTsgfVxyXG50ZC5kaWZmLWxpbmVubyB7IGZvbnQtd2VpZ2h0OiBib2xkOyB9XHJcbnRkLmRpZmYtYWRkZWRsaW5lLCB0ZC5kaWZmLWRlbGV0ZWRsaW5lLCB0ZC5kaWZmLWNvbnRleHQgeyBmb250LXNpemU6IDg4JTsgdmVydGljYWwtYWxpZ246IHRvcDsgd2hpdGUtc3BhY2U6IC1tb3otcHJlLXdyYXA7IHdoaXRlLXNwYWNlOiBwcmUtd3JhcDsgfVxyXG50ZC5kaWZmLWFkZGVkbGluZSwgdGQuZGlmZi1kZWxldGVkbGluZSB7IGJvcmRlci1zdHlsZTogc29saWQ7IGJvcmRlci13aWR0aDogMXB4IDFweCAxcHggNHB4OyBib3JkZXItcmFkaXVzOiAwLjMzZW07IH1cclxudGQuZGlmZi1hZGRlZGxpbmUgeyBib3JkZXItY29sb3I6ICNhM2QzZmY7IH1cclxudGQuZGlmZi1kZWxldGVkbGluZSB7IGJvcmRlci1jb2xvcjogI2ZmZTQ5YzsgfVxyXG50ZC5kaWZmLWNvbnRleHQgeyBiYWNrZ3JvdW5kOiAjZjNmM2YzOyBjb2xvcjogIzMzMzMzMzsgYm9yZGVyLXN0eWxlOiBzb2xpZDsgYm9yZGVyLXdpZHRoOiAxcHggMXB4IDFweCA0cHg7IGJvcmRlci1jb2xvcjogI2U2ZTZlNjsgYm9yZGVyLXJhZGl1czogMC4zM2VtOyB9XHJcbi5kaWZmY2hhbmdlIHsgZm9udC13ZWlnaHQ6IGJvbGQ7IHRleHQtZGVjb3JhdGlvbjogbm9uZTsgfVxyXG50YWJsZS5kaWZmIHtcclxuICAgIGJvcmRlcjogbm9uZTtcclxuICAgIHdpZHRoOiA5OCU7IGJvcmRlci1zcGFjaW5nOiA0cHg7XHJcbiAgICB0YWJsZS1sYXlvdXQ6IGZpeGVkOyAvKiBFbnN1cmVzIHRoYXQgY29sdW1zIGFyZSBvZiBlcXVhbCB3aWR0aCAqL1xyXG59XHJcbnRkLmRpZmYtYWRkZWRsaW5lIC5kaWZmY2hhbmdlLCB0ZC5kaWZmLWRlbGV0ZWRsaW5lIC5kaWZmY2hhbmdlIHsgYm9yZGVyLXJhZGl1czogMC4zM2VtOyBwYWRkaW5nOiAwLjI1ZW0gMDsgfVxyXG50ZC5kaWZmLWFkZGVkbGluZSAuZGlmZmNoYW5nZSB7XHRiYWNrZ3JvdW5kOiAjZDhlY2ZmOyB9XHJcbnRkLmRpZmYtZGVsZXRlZGxpbmUgLmRpZmZjaGFuZ2UgeyBiYWNrZ3JvdW5kOiAjZmVlZWM4OyB9XHJcbnRhYmxlLmRpZmYgdGQge1x0cGFkZGluZzogMC4zM2VtIDAuNjZlbTsgfVxyXG50YWJsZS5kaWZmIGNvbC5kaWZmLW1hcmtlciB7IHdpZHRoOiAyJTsgfVxyXG50YWJsZS5kaWZmIGNvbC5kaWZmLWNvbnRlbnQgeyB3aWR0aDogNDglOyB9XHJcbnRhYmxlLmRpZmYgdGQgZGl2IHtcclxuICAgIC8qIEZvcmNlLXdyYXAgdmVyeSBsb25nIGxpbmVzIHN1Y2ggYXMgVVJMcyBvciBwYWdlLXdpZGVuaW5nIGNoYXIgc3RyaW5ncy4gKi9cclxuICAgIHdvcmQtd3JhcDogYnJlYWstd29yZDtcclxuICAgIC8qIEFzIGZhbGxiYWNrIChGRjwzLjUsIE9wZXJhIDwxMC41KSwgc2Nyb2xsYmFycyB3aWxsIGJlIGFkZGVkIGZvciB2ZXJ5IHdpZGUgY2VsbHNcclxuICAgICAgICBpbnN0ZWFkIG9mIHRleHQgb3ZlcmZsb3dpbmcgb3Igd2lkZW5pbmcgKi9cclxuICAgIG92ZXJmbG93OiBhdXRvO1xyXG59YDtcclxuXHJcbmV4cG9ydCB7IGRpZmZTdHlsZXMgfTsiLCJpbXBvcnQge0FQSSwgaXNBZnRlckRhdGUsIG1ha2VFcnJvck1zZ30gZnJvbSBcIi4vdXRpbFwiO1xyXG5pbXBvcnQgKiBhcyBjYWNoZSBmcm9tIFwiLi9jYWNoZVwiO1xyXG5cclxudmFyIGNhY2hlQmFubmVycyA9IGZ1bmN0aW9uKGJhbm5lcnMsIGJhbm5lck9wdGlvbnMpIHtcclxuXHRjYWNoZS53cml0ZShcImJhbm5lcnNcIiwgYmFubmVycywgMiwgNjApO1xyXG5cdGNhY2hlLndyaXRlKFwiYmFubmVyT3B0aW9uc1wiLCBiYW5uZXJPcHRpb25zLCAyLCA2MCk7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0cyBiYW5uZXJzL29wdGlvbnMgZnJvbSB0aGUgQXBpXHJcbiAqIFxyXG4gKiBAcmV0dXJucyB7UHJvbWlzZX0gUmVzb2x2ZWQgd2l0aDogYmFubmVycyBvYmplY3QsIGJhbm5lck9wdGlvbnMgYXJyYXlcclxuICovXHJcbnZhciBnZXRMaXN0T2ZCYW5uZXJzRnJvbUFwaSA9IGZ1bmN0aW9uKCkge1xyXG5cclxuXHR2YXIgZmluaXNoZWRQcm9taXNlID0gJC5EZWZlcnJlZCgpO1xyXG5cclxuXHR2YXIgcXVlcnlTa2VsZXRvbiA9IHtcclxuXHRcdGFjdGlvbjogXCJxdWVyeVwiLFxyXG5cdFx0Zm9ybWF0OiBcImpzb25cIixcclxuXHRcdGxpc3Q6IFwiY2F0ZWdvcnltZW1iZXJzXCIsXHJcblx0XHRjbXByb3A6IFwidGl0bGVcIixcclxuXHRcdGNtbmFtZXNwYWNlOiBcIjEwXCIsXHJcblx0XHRjbWxpbWl0OiBcIjUwMFwiXHJcblx0fTtcclxuXHJcblx0dmFyIGNhdGVnb3JpZXMgPSBbXHJcblx0XHR7XHJcblx0XHRcdHRpdGxlOlwiIENhdGVnb3J5Oldpa2lQcm9qZWN0IGJhbm5lcnMgd2l0aCBxdWFsaXR5IGFzc2Vzc21lbnRcIixcclxuXHRcdFx0YWJicmV2aWF0aW9uOiBcIndpdGhSYXRpbmdzXCIsXHJcblx0XHRcdGJhbm5lcnM6IFtdLFxyXG5cdFx0XHRwcm9jZXNzZWQ6ICQuRGVmZXJyZWQoKVxyXG5cdFx0fSxcclxuXHRcdHtcclxuXHRcdFx0dGl0bGU6IFwiQ2F0ZWdvcnk6V2lraVByb2plY3QgYmFubmVycyB3aXRob3V0IHF1YWxpdHkgYXNzZXNzbWVudFwiLFxyXG5cdFx0XHRhYmJyZXZpYXRpb246IFwid2l0aG91dFJhdGluZ3NcIixcclxuXHRcdFx0YmFubmVyczogW10sXHJcblx0XHRcdHByb2Nlc3NlZDogJC5EZWZlcnJlZCgpXHJcblx0XHR9LFxyXG5cdFx0e1xyXG5cdFx0XHR0aXRsZTogXCJDYXRlZ29yeTpXaWtpUHJvamVjdCBiYW5uZXIgd3JhcHBlciB0ZW1wbGF0ZXNcIixcclxuXHRcdFx0YWJicmV2aWF0aW9uOiBcIndyYXBwZXJzXCIsXHJcblx0XHRcdGJhbm5lcnM6IFtdLFxyXG5cdFx0XHRwcm9jZXNzZWQ6ICQuRGVmZXJyZWQoKVxyXG5cdFx0fVxyXG5cdF07XHJcblxyXG5cdHZhciBwcm9jZXNzUXVlcnkgPSBmdW5jdGlvbihyZXN1bHQsIGNhdEluZGV4KSB7XHJcblx0XHRpZiAoICFyZXN1bHQucXVlcnkgfHwgIXJlc3VsdC5xdWVyeS5jYXRlZ29yeW1lbWJlcnMgKSB7XHJcblx0XHRcdC8vIE5vIHJlc3VsdHNcclxuXHRcdFx0Ly8gVE9ETzogZXJyb3Igb3Igd2FybmluZyAqKioqKioqKlxyXG5cdFx0XHRmaW5pc2hlZFByb21pc2UucmVqZWN0KCk7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHRcdFxyXG5cdFx0Ly8gR2F0aGVyIHRpdGxlcyBpbnRvIGFycmF5IC0gZXhjbHVkaW5nIFwiVGVtcGxhdGU6XCIgcHJlZml4XHJcblx0XHR2YXIgcmVzdWx0VGl0bGVzID0gcmVzdWx0LnF1ZXJ5LmNhdGVnb3J5bWVtYmVycy5tYXAoZnVuY3Rpb24oaW5mbykge1xyXG5cdFx0XHRyZXR1cm4gaW5mby50aXRsZS5zbGljZSg5KTtcclxuXHRcdH0pO1xyXG5cdFx0QXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkoY2F0ZWdvcmllc1tjYXRJbmRleF0uYmFubmVycywgcmVzdWx0VGl0bGVzKTtcclxuXHRcdFxyXG5cdFx0Ly8gQ29udGludWUgcXVlcnkgaWYgbmVlZGVkXHJcblx0XHRpZiAoIHJlc3VsdC5jb250aW51ZSApIHtcclxuXHRcdFx0ZG9BcGlRdWVyeSgkLmV4dGVuZChjYXRlZ29yaWVzW2NhdEluZGV4XS5xdWVyeSwgcmVzdWx0LmNvbnRpbnVlKSwgY2F0SW5kZXgpO1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblx0XHRcclxuXHRcdGNhdGVnb3JpZXNbY2F0SW5kZXhdLnByb2Nlc3NlZC5yZXNvbHZlKCk7XHJcblx0fTtcclxuXHJcblx0dmFyIGRvQXBpUXVlcnkgPSBmdW5jdGlvbihxLCBjYXRJbmRleCkge1xyXG5cdFx0QVBJLmdldCggcSApXHJcblx0XHRcdC5kb25lKCBmdW5jdGlvbihyZXN1bHQpIHtcclxuXHRcdFx0XHRwcm9jZXNzUXVlcnkocmVzdWx0LCBjYXRJbmRleCk7XHJcblx0XHRcdH0gKVxyXG5cdFx0XHQuZmFpbCggZnVuY3Rpb24oY29kZSwganF4aHIpIHtcclxuXHRcdFx0XHRjb25zb2xlLndhcm4oXCJbUmF0ZXJdIFwiICsgbWFrZUVycm9yTXNnKGNvZGUsIGpxeGhyLCBcIkNvdWxkIG5vdCByZXRyaWV2ZSBwYWdlcyBmcm9tIFtbOlwiICsgcS5jbXRpdGxlICsgXCJdXVwiKSk7XHJcblx0XHRcdFx0ZmluaXNoZWRQcm9taXNlLnJlamVjdCgpO1xyXG5cdFx0XHR9ICk7XHJcblx0fTtcclxuXHRcclxuXHRjYXRlZ29yaWVzLmZvckVhY2goZnVuY3Rpb24oY2F0LCBpbmRleCwgYXJyKSB7XHJcblx0XHRjYXQucXVlcnkgPSAkLmV4dGVuZCggeyBcImNtdGl0bGVcIjpjYXQudGl0bGUgfSwgcXVlcnlTa2VsZXRvbiApO1xyXG5cdFx0JC53aGVuKCBhcnJbaW5kZXgtMV0gJiYgYXJyW2luZGV4LTFdLnByb2Nlc3NlZCB8fCB0cnVlICkudGhlbihmdW5jdGlvbigpe1xyXG5cdFx0XHRkb0FwaVF1ZXJ5KGNhdC5xdWVyeSwgaW5kZXgpO1xyXG5cdFx0fSk7XHJcblx0fSk7XHJcblx0XHJcblx0Y2F0ZWdvcmllc1tjYXRlZ29yaWVzLmxlbmd0aC0xXS5wcm9jZXNzZWQudGhlbihmdW5jdGlvbigpe1xyXG5cdFx0dmFyIGJhbm5lcnMgPSB7fTtcclxuXHRcdHZhciBzdGFzaEJhbm5lciA9IGZ1bmN0aW9uKGNhdE9iamVjdCkge1xyXG5cdFx0XHRiYW5uZXJzW2NhdE9iamVjdC5hYmJyZXZpYXRpb25dID0gY2F0T2JqZWN0LmJhbm5lcnM7XHJcblx0XHR9O1xyXG5cdFx0dmFyIG1lcmdlQmFubmVycyA9IGZ1bmN0aW9uKG1lcmdlSW50b1RoaXNBcnJheSwgY2F0T2JqZWN0KSB7XHJcblx0XHRcdHJldHVybiAkLm1lcmdlKG1lcmdlSW50b1RoaXNBcnJheSwgY2F0T2JqZWN0LmJhbm5lcnMpO1xyXG5cdFx0fTtcclxuXHRcdHZhciBtYWtlT3B0aW9uID0gZnVuY3Rpb24oYmFubmVyTmFtZSkge1xyXG5cdFx0XHR2YXIgaXNXcmFwcGVyID0gKCAtMSAhPT0gJC5pbkFycmF5KGJhbm5lck5hbWUsIGNhdGVnb3JpZXNbMl0uYmFubmVycykgKTtcclxuXHRcdFx0cmV0dXJuIHtcclxuXHRcdFx0XHRkYXRhOiAgKCBpc1dyYXBwZXIgPyBcInN1YnN0OlwiIDogXCJcIikgKyBiYW5uZXJOYW1lLFxyXG5cdFx0XHRcdGxhYmVsOiBiYW5uZXJOYW1lLnJlcGxhY2UoXCJXaWtpUHJvamVjdCBcIiwgXCJcIikgKyAoIGlzV3JhcHBlciA/IFwiIFt0ZW1wbGF0ZSB3cmFwcGVyXVwiIDogXCJcIilcclxuXHRcdFx0fTtcclxuXHRcdH07XHJcblx0XHRjYXRlZ29yaWVzLmZvckVhY2goc3Rhc2hCYW5uZXIpO1xyXG5cdFx0XHJcblx0XHR2YXIgYmFubmVyT3B0aW9ucyA9IGNhdGVnb3JpZXMucmVkdWNlKG1lcmdlQmFubmVycywgW10pLm1hcChtYWtlT3B0aW9uKTtcclxuXHRcdFxyXG5cdFx0ZmluaXNoZWRQcm9taXNlLnJlc29sdmUoYmFubmVycywgYmFubmVyT3B0aW9ucyk7XHJcblx0fSk7XHJcblx0XHJcblx0cmV0dXJuIGZpbmlzaGVkUHJvbWlzZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXRzIGJhbm5lcnMvb3B0aW9ucyBmcm9tIGNhY2hlLCBpZiB0aGVyZSBhbmQgbm90IHRvbyBvbGRcclxuICogXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlfSBSZXNvbHZlZCB3aXRoOiBiYW5uZXJzIG9iamVjdCwgYmFubmVyT3B0aW9ucyBvYmplY3RcclxuICovXHJcbnZhciBnZXRCYW5uZXJzRnJvbUNhY2hlID0gZnVuY3Rpb24oKSB7XHJcblx0dmFyIGNhY2hlZEJhbm5lcnMgPSBjYWNoZS5yZWFkKFwiYmFubmVyc1wiKTtcclxuXHR2YXIgY2FjaGVkQmFubmVyT3B0aW9ucyA9IGNhY2hlLnJlYWQoXCJiYW5uZXJPcHRpb25zXCIpO1xyXG5cdGlmIChcclxuXHRcdCFjYWNoZWRCYW5uZXJzIHx8XHJcblx0XHQhY2FjaGVkQmFubmVycy52YWx1ZSB8fCAhY2FjaGVkQmFubmVycy5zdGFsZURhdGUgfHxcclxuXHRcdCFjYWNoZWRCYW5uZXJPcHRpb25zIHx8XHJcblx0XHQhY2FjaGVkQmFubmVyT3B0aW9ucy52YWx1ZSB8fCAhY2FjaGVkQmFubmVyT3B0aW9ucy5zdGFsZURhdGVcclxuXHQpIHtcclxuXHRcdHJldHVybiAkLkRlZmVycmVkKCkucmVqZWN0KCk7XHJcblx0fVxyXG5cdGlmICggaXNBZnRlckRhdGUoY2FjaGVkQmFubmVycy5zdGFsZURhdGUpIHx8IGlzQWZ0ZXJEYXRlKGNhY2hlZEJhbm5lck9wdGlvbnMuc3RhbGVEYXRlKSApIHtcclxuXHRcdC8vIFVwZGF0ZSBpbiB0aGUgYmFja2dyb3VuZDsgc3RpbGwgdXNlIG9sZCBsaXN0IHVudGlsIHRoZW4gIFxyXG5cdFx0Z2V0TGlzdE9mQmFubmVyc0Zyb21BcGkoKS50aGVuKGNhY2hlQmFubmVycyk7XHJcblx0fVxyXG5cdHJldHVybiAkLkRlZmVycmVkKCkucmVzb2x2ZShjYWNoZWRCYW5uZXJzLnZhbHVlLCBjYWNoZWRCYW5uZXJPcHRpb25zLnZhbHVlKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXRzIGJhbm5lcnMvb3B0aW9ucyBmcm9tIGNhY2hlIG9yIEFQSS5cclxuICogSGFzIHNpZGUgYWZmZWN0IG9mIGFkZGluZy91cGRhdGluZy9jbGVhcmluZyBjYWNoZS5cclxuICogXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlPE9iamVjdCwgQXJyYXk+fSBiYW5uZXJzIG9iamVjdCwgYmFubmVyT3B0aW9ucyBvYmplY3RcclxuICpcclxudmFyIGdldEJhbm5lcnMgPSAoKSA9PiBnZXRCYW5uZXJzRnJvbUNhY2hlKCkudGhlbihcclxuXHQvLyBTdWNjZXNzOiBwYXNzIHRocm91Z2hcclxuXHQoYmFubmVycywgb3B0aW9ucykgPT4gJC5EZWZlcnJlZCgpLnJlc29sdmUoYmFubmVycywgb3B0aW9ucyksXHJcblx0Ly8gRmFpbHVyZTogZ2V0IGZyb20gQXBpLCB0aGVuIGNhY2hlIHRoZW1cclxuXHQoKSA9PiB7XHJcblx0XHR2YXIgYmFubmVyc1Byb21pc2UgPSBnZXRMaXN0T2ZCYW5uZXJzRnJvbUFwaSgpO1xyXG5cdFx0YmFubmVyc1Byb21pc2UudGhlbihjYWNoZUJhbm5lcnMpO1xyXG5cdFx0cmV0dXJuIGJhbm5lcnNQcm9taXNlO1xyXG5cdH1cclxuKTtcclxuICovXHJcblxyXG4vKipcclxuICogR2V0cyBiYW5uZXIgbmFtZXMsIGdyb3VwZWQgYnkgdHlwZSAod2l0aFJhdGluZ3MsIHdpdGhvdXRSYXRpbmdzLCB3cmFwcGVycylcclxuICogQHJldHVybnMge1Byb21pc2U8T2JqZWN0Pn0ge3dpdGhSYXRpbmdzOnN0cmluZ1tdLCB3aXRob3V0UmF0aW5nczpzdHJpbmdbXSwgd3JhcHBlcnM6c3RyaW5nW10+fVxyXG4gKi9cclxudmFyIGdldEJhbm5lck5hbWVzID0gKCkgPT4gZ2V0QmFubmVyc0Zyb21DYWNoZSgpLnRoZW4oXHJcblx0Ly8gU3VjY2VzczogcGFzcyB0aHJvdWdoIChmaXJzdCBwYXJhbSBvbmx5KVxyXG5cdGJhbm5lcnMgPT4gYmFubmVycyxcclxuXHQvLyBGYWlsdXJlOiBnZXQgZnJvbSBBcGksIHRoZW4gY2FjaGUgdGhlbVxyXG5cdCgpID0+IHtcclxuXHRcdHZhciBiYW5uZXJzUHJvbWlzZSA9IGdldExpc3RPZkJhbm5lcnNGcm9tQXBpKCk7XHJcblx0XHRiYW5uZXJzUHJvbWlzZS50aGVuKGNhY2hlQmFubmVycyk7XHJcblx0XHRyZXR1cm4gYmFubmVyc1Byb21pc2U7XHJcblx0fVxyXG4pO1xyXG5cclxuLyoqXHJcbiAqIEdldHMgYmFubmVycyBhcyB7ZGF0YSwgbGFiZWx9IG9iamVjdHMsIGZvciB1c2UgaW4gb3VyIFN1Z2dlc3Rpb25Mb29rdXBUZXh0SW5wdXRXaWRnZXRcclxuICogY29tcG9uZW50IChvciBvdGhlciBPT1VJIHdpZGdldHMgbGlrZSBPTy51aS5Db21ib0JveElucHV0V2lkZ2V0KVxyXG4gKiBAcmV0dXJucyB7UHJvbWlzZTxPYmplY3RbXT59IFJhdGluZ3MgYXMge2RhdGE6c3RyaW5nLCBsYWJlbDpzdHJpbmd9IG9iamVjdHNcclxuICovXHJcbnZhciBnZXRCYW5uZXJPcHRpb25zID0gKCkgPT4gZ2V0QmFubmVyc0Zyb21DYWNoZSgpLnRoZW4oXHJcblx0Ly8gU3VjY2VzczogcGFzcyB0aHJvdWdoIChzZWNvbmQgcGFyYW0gb25seSlcclxuXHQoX2Jhbm5lcnMsIG9wdGlvbnMpID0+IG9wdGlvbnMsXHJcblx0Ly8gRmFpbHVyZTogZ2V0IGZyb20gQXBpLCB0aGVuIGNhY2hlIHRoZW1cclxuXHQoKSA9PiB7XHJcblx0XHR2YXIgYmFubmVyc1Byb21pc2UgPSBnZXRMaXN0T2ZCYW5uZXJzRnJvbUFwaSgpO1xyXG5cdFx0YmFubmVyc1Byb21pc2UudGhlbihjYWNoZUJhbm5lcnMpO1xyXG5cdFx0cmV0dXJuIGJhbm5lcnNQcm9taXNlO1xyXG5cdH1cclxuKTtcclxuXHJcbmV4cG9ydCB7Z2V0QmFubmVyTmFtZXMsIGdldEJhbm5lck9wdGlvbnN9OyIsImltcG9ydCBjb25maWcgZnJvbSBcIi4vY29uZmlnXCI7XHJcbmltcG9ydCB7QVBJfSBmcm9tIFwiLi91dGlsXCI7XHJcbmltcG9ydCB7IHBhcnNlVGVtcGxhdGVzLCBnZXRXaXRoUmVkaXJlY3RUbyB9IGZyb20gXCIuL1RlbXBsYXRlXCI7XHJcbmltcG9ydCB7Z2V0QmFubmVyTmFtZXN9IGZyb20gXCIuL2dldEJhbm5lcnNcIjtcclxuaW1wb3J0ICogYXMgY2FjaGUgZnJvbSBcIi4vY2FjaGVcIjtcclxuaW1wb3J0IHdpbmRvd01hbmFnZXIgZnJvbSBcIi4vd2luZG93TWFuYWdlclwiO1xyXG5cclxudmFyIHNldHVwUmF0ZXIgPSBmdW5jdGlvbihjbGlja0V2ZW50KSB7XHJcblx0aWYgKCBjbGlja0V2ZW50ICkge1xyXG5cdFx0Y2xpY2tFdmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdH1cclxuXHJcblx0dmFyIHNldHVwQ29tcGxldGVkUHJvbWlzZSA9ICQuRGVmZXJyZWQoKTtcclxuICAgIFxyXG5cdHZhciBjdXJyZW50UGFnZSA9IG13LlRpdGxlLm5ld0Zyb21UZXh0KGNvbmZpZy5tdy53Z1BhZ2VOYW1lKTtcclxuXHR2YXIgdGFsa1BhZ2UgPSBjdXJyZW50UGFnZSAmJiBjdXJyZW50UGFnZS5nZXRUYWxrUGFnZSgpO1xyXG5cdHZhciBzdWJqZWN0UGFnZSA9IGN1cnJlbnRQYWdlICYmIGN1cnJlbnRQYWdlLmdldFN1YmplY3RQYWdlKCk7XHJcbiBcclxuXHQvLyBHZXQgbGlzdHMgb2YgYWxsIGJhbm5lcnMgKHRhc2sgMSlcclxuXHR2YXIgYmFubmVyc1Byb21pc2UgPSBnZXRCYW5uZXJOYW1lcygpO1xyXG5cclxuXHQvLyBMb2FkIHRhbGsgcGFnZSAodGFzayAyKVxyXG5cdHZhciBsb2FkVGFsa1Byb21pc2UgPSBBUEkuZ2V0KCB7XHJcblx0XHRhY3Rpb246IFwicXVlcnlcIixcclxuXHRcdHByb3A6IFwicmV2aXNpb25zXCIsXHJcblx0XHRydnByb3A6IFwiY29udGVudFwiLFxyXG5cdFx0cnZzZWN0aW9uOiBcIjBcIixcclxuXHRcdHRpdGxlczogdGFsa1BhZ2UuZ2V0UHJlZml4ZWRUZXh0KCksXHJcblx0XHRpbmRleHBhZ2VpZHM6IDFcclxuXHR9ICkudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XHJcblx0XHR2YXIgaWQgPSByZXN1bHQucXVlcnkucGFnZWlkcztcdFx0XHJcblx0XHR2YXIgd2lraXRleHQgPSAoIGlkIDwgMCApID8gXCJcIiA6IHJlc3VsdC5xdWVyeS5wYWdlc1tpZF0ucmV2aXNpb25zWzBdW1wiKlwiXTtcclxuXHRcdHJldHVybiB3aWtpdGV4dDtcclxuXHR9KTtcclxuXHJcblx0Ly8gUGFyc2UgdGFsayBwYWdlIGZvciBiYW5uZXJzICh0YXNrIDMpXHJcblx0dmFyIHBhcnNlVGFsa1Byb21pc2UgPSBsb2FkVGFsa1Byb21pc2UudGhlbih3aWtpdGV4dCA9PiBwYXJzZVRlbXBsYXRlcyh3aWtpdGV4dCwgdHJ1ZSkpIC8vIEdldCBhbGwgdGVtcGxhdGVzXHJcblx0XHQudGhlbih0ZW1wbGF0ZXMgPT4gZ2V0V2l0aFJlZGlyZWN0VG8odGVtcGxhdGVzKSkgLy8gQ2hlY2sgZm9yIHJlZGlyZWN0c1xyXG5cdFx0LnRoZW4odGVtcGxhdGVzID0+IHtcclxuXHRcdFx0cmV0dXJuIGJhbm5lcnNQcm9taXNlLnRoZW4oKGFsbEJhbm5lcnMpID0+IHsgLy8gR2V0IGxpc3Qgb2YgYWxsIGJhbm5lciB0ZW1wbGF0ZXNcclxuXHRcdFx0XHRyZXR1cm4gdGVtcGxhdGVzLmZpbHRlcih0ZW1wbGF0ZSA9PiB7IC8vIEZpbHRlciBvdXQgbm9uLWJhbm5lcnNcclxuXHRcdFx0XHRcdHZhciBtYWluVGV4dCA9IHRlbXBsYXRlLnJlZGlyZWN0VGFyZ2V0XHJcblx0XHRcdFx0XHRcdD8gdGVtcGxhdGUucmVkaXJlY3RUYXJnZXQuZ2V0TWFpblRleHQoKVxyXG5cdFx0XHRcdFx0XHQ6IHRlbXBsYXRlLmdldFRpdGxlKCkuZ2V0TWFpblRleHQoKTtcclxuXHRcdFx0XHRcdHJldHVybiBhbGxCYW5uZXJzLndpdGhSYXRpbmdzLmluY2x1ZGVzKG1haW5UZXh0KSB8fCBcclxuICAgICAgICAgICAgICAgICAgICBhbGxCYW5uZXJzLndpdGhvdXRSYXRpbmdzLmluY2x1ZGVzKG1haW5UZXh0KSB8fFxyXG4gICAgICAgICAgICAgICAgICAgIGFsbEJhbm5lcnMud3JhcHBlcnMuaW5jbHVkZXMobWFpblRleHQpO1xyXG5cdFx0XHRcdH0pXHJcblx0XHRcdFx0XHQubWFwKGZ1bmN0aW9uKHRlbXBsYXRlKSB7IC8vIFNldCB3cmFwcGVyIHRhcmdldCBpZiBuZWVkZWRcclxuXHRcdFx0XHRcdFx0dmFyIG1haW5UZXh0ID0gdGVtcGxhdGUucmVkaXJlY3RUYXJnZXRcclxuXHRcdFx0XHRcdFx0XHQ/IHRlbXBsYXRlLnJlZGlyZWN0VGFyZ2V0LmdldE1haW5UZXh0KClcclxuXHRcdFx0XHRcdFx0XHQ6IHRlbXBsYXRlLmdldFRpdGxlKCkuZ2V0TWFpblRleHQoKTtcclxuXHRcdFx0XHRcdFx0aWYgKGFsbEJhbm5lcnMud3JhcHBlcnMuaW5jbHVkZXMobWFpblRleHQpKSB7XHJcblx0XHRcdFx0XHRcdFx0dGVtcGxhdGUucmVkaXJlY3RUYXJnZXQgPSBtdy5UaXRsZS5uZXdGcm9tVGV4dChcIlRlbXBsYXRlOlN1YnN0OlwiICsgbWFpblRleHQpO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdHJldHVybiB0ZW1wbGF0ZTtcclxuXHRcdFx0XHRcdH0pO1xyXG5cdFx0XHR9KTtcclxuXHRcdH0pO1xyXG5cdFxyXG5cdC8vIFJldHJpZXZlIGFuZCBzdG9yZSBjbGFzc2VzLCBpbXBvcnRhbmNlcywgYW5kIFRlbXBsYXRlRGF0YSAodGFzayA0KVxyXG5cdHZhciB0ZW1wbGF0ZURldGFpbHNQcm9taXNlID0gcGFyc2VUYWxrUHJvbWlzZS50aGVuKGZ1bmN0aW9uKHRlbXBsYXRlcykge1xyXG5cdFx0Ly8gV2FpdCBmb3IgYWxsIHByb21pc2VzIHRvIHJlc29sdmVcclxuXHRcdHJldHVybiAkLndoZW4uYXBwbHkobnVsbCwgW1xyXG5cdFx0XHQuLi50ZW1wbGF0ZXMubWFwKHRlbXBsYXRlID0+IHRlbXBsYXRlLnNldENsYXNzZXNBbmRJbXBvcnRhbmNlcygpKSxcclxuXHRcdFx0Li4udGVtcGxhdGVzLm1hcCh0ZW1wbGF0ZSA9PiB0ZW1wbGF0ZS5zZXRQYXJhbURhdGFBbmRTdWdnZXN0aW9ucygpKVxyXG5cdFx0XSkudGhlbigoKSA9PiB7XHJcblx0XHRcdC8vIFJldHVybiB0aGUgbm93LW1vZGlmaWVkIHRlbXBsYXRlc1xyXG5cdFx0XHRyZXR1cm4gdGVtcGxhdGVzO1xyXG5cdFx0fSk7XHJcblx0fSk7XHJcblxyXG5cdC8vIENoZWNrIGlmIHBhZ2UgaXMgYSByZWRpcmVjdCAodGFzayA1KSAtIGJ1dCBkb24ndCBlcnJvciBvdXQgaWYgcmVxdWVzdCBmYWlsc1xyXG5cdHZhciByZWRpcmVjdENoZWNrUHJvbWlzZSA9IEFQSS5nZXRSYXcoc3ViamVjdFBhZ2UuZ2V0UHJlZml4ZWRUZXh0KCkpXHJcblx0XHQudGhlbihcclxuXHRcdFx0Ly8gU3VjY2Vzc1xyXG5cdFx0XHRmdW5jdGlvbihyYXdQYWdlKSB7IFxyXG5cdFx0XHRcdGlmICggL15cXHMqI1JFRElSRUNUL2kudGVzdChyYXdQYWdlKSApIHtcclxuXHRcdFx0XHRcdC8vIGdldCByZWRpcmVjdGlvbiB0YXJnZXQsIG9yIGJvb2xlYW4gdHJ1ZVxyXG5cdFx0XHRcdFx0cmV0dXJuIHJhd1BhZ2Uuc2xpY2UocmF3UGFnZS5pbmRleE9mKFwiW1tcIikrMiwgcmF3UGFnZS5pbmRleE9mKFwiXV1cIikpIHx8IHRydWU7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0fSxcclxuXHRcdFx0Ly8gRmFpbHVyZSAoaWdub3JlZClcclxuXHRcdFx0ZnVuY3Rpb24oKSB7IHJldHVybiBudWxsOyB9XHJcblx0XHQpO1xyXG5cclxuXHQvLyBSZXRyaWV2ZSByYXRpbmcgZnJvbSBPUkVTICh0YXNrIDYsIG9ubHkgbmVlZGVkIGZvciBhcnRpY2xlcylcclxuXHR2YXIgc2hvdWxkR2V0T3JlcyA9ICggY29uZmlnLm13LndnTmFtZXNwYWNlTnVtYmVyIDw9IDEgKTtcclxuXHRpZiAoIHNob3VsZEdldE9yZXMgKSB7XHJcblx0XHR2YXIgbGF0ZXN0UmV2SWRQcm9taXNlID0gY3VycmVudFBhZ2UuaXNUYWxrUGFnZSgpXHJcblx0XHRcdD8gJC5EZWZlcnJlZCgpLnJlc29sdmUoY29uZmlnLm13LndnUmV2aXNpb25JZClcclxuXHRcdFx0OiBcdEFQSS5nZXQoIHtcclxuXHRcdFx0XHRhY3Rpb246IFwicXVlcnlcIixcclxuXHRcdFx0XHRmb3JtYXQ6IFwianNvblwiLFxyXG5cdFx0XHRcdHByb3A6IFwicmV2aXNpb25zXCIsXHJcblx0XHRcdFx0dGl0bGVzOiBzdWJqZWN0UGFnZS5nZXRQcmVmaXhlZFRleHQoKSxcclxuXHRcdFx0XHRydnByb3A6IFwiaWRzXCIsXHJcblx0XHRcdFx0aW5kZXhwYWdlaWRzOiAxXHJcblx0XHRcdH0gKS50aGVuKGZ1bmN0aW9uKHJlc3VsdCkge1xyXG5cdFx0XHRcdGlmIChyZXN1bHQucXVlcnkucmVkaXJlY3RzKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHZhciBpZCA9IHJlc3VsdC5xdWVyeS5wYWdlaWRzO1xyXG5cdFx0XHRcdHZhciBwYWdlID0gcmVzdWx0LnF1ZXJ5LnBhZ2VzW2lkXTtcclxuXHRcdFx0XHRpZiAocGFnZS5taXNzaW5nID09PSBcIlwiKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICggaWQgPCAwICkge1xyXG5cdFx0XHRcdFx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3QoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIHBhZ2UucmV2aXNpb25zWzBdLnJldmlkO1xyXG5cdFx0XHR9KTtcclxuXHRcdHZhciBvcmVzUHJvbWlzZSA9IGxhdGVzdFJldklkUHJvbWlzZS50aGVuKGZ1bmN0aW9uKGxhdGVzdFJldklkKSB7XHJcblx0XHRcdGlmICghbGF0ZXN0UmV2SWQpIHtcclxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIEFQSS5nZXRPUkVTKGxhdGVzdFJldklkKVxyXG5cdFx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlc3VsdCkge1xyXG5cdFx0XHRcdFx0dmFyIGRhdGEgPSByZXN1bHQuZW53aWtpLnNjb3Jlc1tsYXRlc3RSZXZJZF0ud3AxMDtcclxuXHRcdFx0XHRcdGlmICggZGF0YS5lcnJvciApIHtcclxuXHRcdFx0XHRcdFx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3QoZGF0YS5lcnJvci50eXBlLCBkYXRhLmVycm9yLm1lc3NhZ2UpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0cmV0dXJuIGRhdGEuc2NvcmUucHJlZGljdGlvbjtcclxuXHRcdFx0XHR9KTtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0Ly8gT3BlbiB0aGUgbG9hZCBkaWFsb2dcclxuXHR2YXIgaXNPcGVuZWRQcm9taXNlID0gJC5EZWZlcnJlZCgpO1xyXG5cdHZhciBsb2FkRGlhbG9nV2luID0gd2luZG93TWFuYWdlci5vcGVuV2luZG93KFwibG9hZERpYWxvZ1wiLCB7XHJcblx0XHRwcm9taXNlczogW1xyXG5cdFx0XHRiYW5uZXJzUHJvbWlzZSxcclxuXHRcdFx0bG9hZFRhbGtQcm9taXNlLFxyXG5cdFx0XHRwYXJzZVRhbGtQcm9taXNlLFxyXG5cdFx0XHR0ZW1wbGF0ZURldGFpbHNQcm9taXNlLFxyXG5cdFx0XHRyZWRpcmVjdENoZWNrUHJvbWlzZSxcclxuXHRcdFx0c2hvdWxkR2V0T3JlcyAmJiBvcmVzUHJvbWlzZVxyXG5cdFx0XSxcclxuXHRcdG9yZXM6IHNob3VsZEdldE9yZXMsXHJcblx0XHRpc09wZW5lZDogaXNPcGVuZWRQcm9taXNlXHJcblx0fSk7XHJcblxyXG5cdGxvYWREaWFsb2dXaW4ub3BlbmVkLnRoZW4oaXNPcGVuZWRQcm9taXNlLnJlc29sdmUpO1xyXG5cclxuXHJcblx0JC53aGVuKFxyXG5cdFx0bG9hZFRhbGtQcm9taXNlLFxyXG5cdFx0dGVtcGxhdGVEZXRhaWxzUHJvbWlzZSxcclxuXHRcdHJlZGlyZWN0Q2hlY2tQcm9taXNlLFxyXG5cdFx0c2hvdWxkR2V0T3JlcyAmJiBvcmVzUHJvbWlzZVxyXG5cdCkudGhlbihcclxuXHRcdC8vIEFsbCBzdWNjZWRlZFxyXG5cdFx0ZnVuY3Rpb24odGFsa1dpa2l0ZXh0LCBiYW5uZXJzLCByZWRpcmVjdFRhcmdldCwgb3Jlc1ByZWRpY2l0aW9uICkge1xyXG5cdFx0XHR2YXIgcmVzdWx0ID0ge1xyXG5cdFx0XHRcdHN1Y2Nlc3M6IHRydWUsXHJcblx0XHRcdFx0dGFsa3BhZ2U6IHRhbGtQYWdlLFxyXG5cdFx0XHRcdHRhbGtXaWtpdGV4dDogdGFsa1dpa2l0ZXh0LFxyXG5cdFx0XHRcdGJhbm5lcnM6IGJhbm5lcnNcclxuXHRcdFx0fTtcclxuXHRcdFx0aWYgKHJlZGlyZWN0VGFyZ2V0KSB7XHJcblx0XHRcdFx0cmVzdWx0LnJlZGlyZWN0VGFyZ2V0ID0gcmVkaXJlY3RUYXJnZXQ7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKG9yZXNQcmVkaWNpdGlvbikge1xyXG5cdFx0XHRcdHJlc3VsdC5vcmVzUHJlZGljaXRpb24gPSBvcmVzUHJlZGljaXRpb247XHJcblx0XHRcdH1cclxuXHRcdFx0d2luZG93TWFuYWdlci5jbG9zZVdpbmRvdyhcImxvYWREaWFsb2dcIiwgcmVzdWx0KTtcclxuXHRcdFx0XHJcblx0XHR9XHJcblx0KTsgLy8gQW55IGZhaWx1cmVzIGFyZSBoYW5kbGVkIGJ5IHRoZSBsb2FkRGlhbG9nIHdpbmRvdyBpdHNlbGZcclxuXHJcblx0Ly8gT24gd2luZG93IGNsb3NlZCwgY2hlY2sgZGF0YSwgYW5kIHJlc29sdmUvcmVqZWN0IHNldHVwQ29tcGxldGVkUHJvbWlzZVxyXG5cdGxvYWREaWFsb2dXaW4uY2xvc2VkLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xyXG5cdFx0aWYgKGRhdGEgJiYgZGF0YS5zdWNjZXNzKSB7XHJcblx0XHRcdC8vIEdvdCBldmVyeXRoaW5nIG5lZWRlZDogUmVzb2x2ZSBwcm9taXNlIHdpdGggdGhpcyBkYXRhXHJcblx0XHRcdHNldHVwQ29tcGxldGVkUHJvbWlzZS5yZXNvbHZlKGRhdGEpO1xyXG5cdFx0fSBlbHNlIGlmIChkYXRhICYmIGRhdGEuZXJyb3IpIHtcclxuXHRcdFx0Ly8gVGhlcmUgd2FzIGFuIGVycm9yOiBSZWplY3QgcHJvbWlzZSB3aXRoIGVycm9yIGNvZGUvaW5mb1xyXG5cdFx0XHRzZXR1cENvbXBsZXRlZFByb21pc2UucmVqZWN0KGRhdGEuZXJyb3IuY29kZSwgZGF0YS5lcnJvci5pbmZvKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdC8vIFdpbmRvdyBjbG9zZWQgYmVmb3JlIGNvbXBsZXRpb246IHJlc29sdmUgcHJvbWlzZSB3aXRob3V0IGFueSBkYXRhXHJcblx0XHRcdHNldHVwQ29tcGxldGVkUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xyXG5cdFx0fVxyXG5cdFx0Y2FjaGUuY2xlYXJJbnZhbGlkSXRlbXMoKTtcclxuXHR9KTtcclxuXHJcblx0Ly8gVEVTVElORyBwdXJwb3NlcyBvbmx5OiBsb2cgcGFzc2VkIGRhdGEgdG8gY29uc29sZVxyXG5cdHNldHVwQ29tcGxldGVkUHJvbWlzZS50aGVuKFxyXG5cdFx0ZGF0YSA9PiBjb25zb2xlLmxvZyhcInNldHVwIHdpbmRvdyBjbG9zZWRcIiwgZGF0YSksXHJcblx0XHQoY29kZSwgaW5mbykgPT4gY29uc29sZS5sb2coXCJzZXR1cCB3aW5kb3cgY2xvc2VkIHdpdGggZXJyb3JcIiwge2NvZGUsIGluZm99KVxyXG5cdCk7XHJcblxyXG5cdHJldHVybiBzZXR1cENvbXBsZXRlZFByb21pc2U7XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBzZXR1cFJhdGVyOyIsIi8vIFZhcmlvdXMgdXRpbGl0eSBmdW5jdGlvbnMgYW5kIG9iamVjdHMgdGhhdCBtaWdodCBiZSB1c2VkIGluIG11bHRpcGxlIHBsYWNlc1xyXG5cclxuaW1wb3J0IGNvbmZpZyBmcm9tIFwiLi9jb25maWdcIjtcclxuXHJcbnZhciBpc0FmdGVyRGF0ZSA9IGZ1bmN0aW9uKGRhdGVTdHJpbmcpIHtcclxuXHRyZXR1cm4gbmV3IERhdGUoZGF0ZVN0cmluZykgPCBuZXcgRGF0ZSgpO1xyXG59O1xyXG5cclxudmFyIEFQSSA9IG5ldyBtdy5BcGkoIHtcclxuXHRhamF4OiB7XHJcblx0XHRoZWFkZXJzOiB7IFxyXG5cdFx0XHRcIkFwaS1Vc2VyLUFnZW50XCI6IFwiUmF0ZXIvXCIgKyBjb25maWcuc2NyaXB0LnZlcnNpb24gKyBcclxuXHRcdFx0XHRcIiAoIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1VzZXI6RXZhZDM3L1JhdGVyIClcIlxyXG5cdFx0fVxyXG5cdH1cclxufSApO1xyXG4vKiAtLS0tLS0tLS0tIEFQSSBmb3IgT1JFUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXHJcbkFQSS5nZXRPUkVTID0gZnVuY3Rpb24ocmV2aXNpb25JRCkge1xyXG5cdHJldHVybiAkLmdldChcImh0dHBzOi8vb3Jlcy53aWtpbWVkaWEub3JnL3YzL3Njb3Jlcy9lbndpa2k/bW9kZWxzPXdwMTAmcmV2aWRzPVwiK3JldmlzaW9uSUQpO1xyXG59O1xyXG4vKiAtLS0tLS0tLS0tIFJhdyB3aWtpdGV4dCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXHJcbkFQSS5nZXRSYXcgPSBmdW5jdGlvbihwYWdlKSB7XHJcblx0cmV0dXJuICQuZ2V0KFwiaHR0cHM6XCIgKyBjb25maWcubXcud2dTZXJ2ZXIgKyBtdy51dGlsLmdldFVybChwYWdlLCB7YWN0aW9uOlwicmF3XCJ9KSlcclxuXHRcdC50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcclxuXHRcdFx0aWYgKCAhZGF0YSApIHtcclxuXHRcdFx0XHRyZXR1cm4gJC5EZWZlcnJlZCgpLnJlamVjdChcIm9rLWJ1dC1lbXB0eVwiKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gZGF0YTtcclxuXHRcdH0pO1xyXG59O1xyXG5cclxudmFyIG1ha2VFcnJvck1zZyA9IGZ1bmN0aW9uKGZpcnN0LCBzZWNvbmQpIHtcclxuXHR2YXIgY29kZSwgeGhyLCBtZXNzYWdlO1xyXG5cdGlmICggdHlwZW9mIGZpcnN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBzZWNvbmQgPT09IFwic3RyaW5nXCIgKSB7XHJcblx0XHQvLyBFcnJvcnMgZnJvbSAkLmdldCBiZWluZyByZWplY3RlZCAoT1JFUyAmIFJhdyB3aWtpdGV4dClcclxuXHRcdHZhciBlcnJvck9iaiA9IGZpcnN0LnJlc3BvbnNlSlNPTiAmJiBmaXJzdC5yZXNwb25zZUpTT04uZXJyb3I7XHJcblx0XHRpZiAoIGVycm9yT2JqICkge1xyXG5cdFx0XHQvLyBHb3QgYW4gYXBpLXNwZWNpZmljIGVycm9yIGNvZGUvbWVzc2FnZVxyXG5cdFx0XHRjb2RlID0gZXJyb3JPYmouY29kZTtcclxuXHRcdFx0bWVzc2FnZSA9IGVycm9yT2JqLm1lc3NhZ2U7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR4aHIgPSBmaXJzdDtcclxuXHRcdH1cclxuXHR9IGVsc2UgaWYgKCB0eXBlb2YgZmlyc3QgPT09IFwic3RyaW5nXCIgJiYgdHlwZW9mIHNlY29uZCA9PT0gXCJvYmplY3RcIiApIHtcclxuXHRcdC8vIEVycm9ycyBmcm9tIG13LkFwaSBvYmplY3RcclxuXHRcdHZhciBtd0Vycm9yT2JqID0gc2Vjb25kLmVycm9yO1xyXG5cdFx0aWYgKG13RXJyb3JPYmopIHtcclxuXHRcdFx0Ly8gR290IGFuIGFwaS1zcGVjaWZpYyBlcnJvciBjb2RlL21lc3NhZ2VcclxuXHRcdFx0Y29kZSA9IGVycm9yT2JqLmNvZGU7XHJcblx0XHRcdG1lc3NhZ2UgPSBlcnJvck9iai5pbmZvO1xyXG5cdFx0fSBlbHNlIGlmIChmaXJzdCA9PT0gXCJvay1idXQtZW1wdHlcIikge1xyXG5cdFx0XHRjb2RlID0gbnVsbDtcclxuXHRcdFx0bWVzc2FnZSA9IFwiR290IGFuIGVtcHR5IHJlc3BvbnNlIGZyb20gdGhlIHNlcnZlclwiO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0eGhyID0gc2Vjb25kICYmIHNlY29uZC54aHI7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRpZiAoY29kZSAmJiBtZXNzYWdlKSB7XHJcblx0XHRyZXR1cm4gYEFQSSBlcnJvciAke2NvZGV9OiAke21lc3NhZ2V9YDtcclxuXHR9IGVsc2UgaWYgKG1lc3NhZ2UpIHtcclxuXHRcdHJldHVybiBgQVBJIGVycm9yOiAke21lc3NhZ2V9YDtcclxuXHR9IGVsc2UgaWYgKHhocikge1xyXG5cdFx0cmV0dXJuIGBIVFRQIGVycm9yICR7eGhyLnN0YXR1c31gO1xyXG5cdH0gZWxzZSBpZiAoXHJcblx0XHR0eXBlb2YgZmlyc3QgPT09IFwic3RyaW5nXCIgJiYgZmlyc3QgIT09IFwiZXJyb3JcIiAmJlxyXG5cdFx0dHlwZW9mIHNlY29uZCA9PT0gXCJzdHJpbmdcIiAmJiBzZWNvbmQgIT09IFwiZXJyb3JcIlxyXG5cdCkge1xyXG5cdFx0cmV0dXJuIGBFcnJvciAke2ZpcnN0fTogJHtzZWNvbmR9YDtcclxuXHR9IGVsc2UgaWYgKHR5cGVvZiBmaXJzdCA9PT0gXCJzdHJpbmdcIiAmJiBmaXJzdCAhPT0gXCJlcnJvclwiKSB7XHJcblx0XHRyZXR1cm4gYEVycm9yOiAke2ZpcnN0fWA7XHJcblx0fSBlbHNlIHtcclxuXHRcdHJldHVybiBcIlVua25vd24gQVBJIGVycm9yXCI7XHJcblx0fVxyXG59O1xyXG5cclxuZXhwb3J0IHtpc0FmdGVyRGF0ZSwgQVBJLCBtYWtlRXJyb3JNc2d9OyIsImltcG9ydCBMb2FkRGlhbG9nIGZyb20gXCIuL1dpbmRvd3MvTG9hZERpYWxvZ1wiO1xyXG5pbXBvcnQgTWFpbldpbmRvdyBmcm9tIFwiLi9XaW5kb3dzL01haW5XaW5kb3dcIjtcclxuXHJcbnZhciBmYWN0b3J5ID0gbmV3IE9PLkZhY3RvcnkoKTtcclxuXHJcbi8vIFJlZ2lzdGVyIHdpbmRvdyBjb25zdHJ1Y3RvcnMgd2l0aCB0aGUgZmFjdG9yeS5cclxuZmFjdG9yeS5yZWdpc3RlcihMb2FkRGlhbG9nKTtcclxuZmFjdG9yeS5yZWdpc3RlcihNYWluV2luZG93KTtcclxuXHJcbnZhciBtYW5hZ2VyID0gbmV3IE9PLnVpLldpbmRvd01hbmFnZXIoIHtcclxuXHRcImZhY3RvcnlcIjogZmFjdG9yeVxyXG59ICk7XHJcbiQoIGRvY3VtZW50LmJvZHkgKS5hcHBlbmQoIG1hbmFnZXIuJGVsZW1lbnQgKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IG1hbmFnZXI7Il19
