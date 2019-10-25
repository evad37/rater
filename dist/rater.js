(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

var _setup = _interopRequireDefault(require("./setup"));

var _autostart = _interopRequireDefault(require("./autostart"));

var _css = _interopRequireDefault(require("./css.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

(function App() {
  console.log("Rater's App.js is running...");
  mw.util.addCSS(_css["default"]); // Add portlet link

  mw.util.addPortletLink("p-cactions", "#", "Rater", "ca-rater", "Rate quality and importance", "5");
  $("#ca-rater").click(_setup["default"]);
  (0, _autostart["default"])();
})();

},{"./autostart":4,"./css.js":7,"./setup":9}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _util = require("./util");

var progressBar = new OO.ui.ProgressBarWidget({
  progress: 1
});

var incrementProgress = function incrementProgress(amount, maximum) {
  var priorProgress = progressBar.getProgress();
  var incrementedProgress = Math.min(maximum || 100, priorProgress + amount);
  progressBar.setProgress(incrementedProgress);
};
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
LoadDialog["static"].name = "loadDialog"; // Specify a title statically (or, alternatively, with data passed to the opening() method).

LoadDialog["static"].title = "Loading Rater..."; // Customize the initialize() function: This is where to add content to the dialog body and set up event handlers.

LoadDialog.prototype.initialize = function () {
  // Call the parent method.
  LoadDialog["super"].prototype.initialize.call(this); // Create and append a layout and some content.

  this.content = new OO.ui.PanelLayout({
    padded: true,
    expanded: false
  });
  this.content.$element.append(progressBar.$element, $("<p>").attr("id", "dialog-loading-0").css("font-weight", "bold").text("Initialising:"), $("<p>").attr("id", "dialog-loading-1").text("Loading talkpage wikitext..."), $("<p>").attr("id", "dialog-loading-2").text("Parsing talkpage templates..."), $("<p>").attr("id", "dialog-loading-3").text("Getting templates' parameter data..."), $("<p>").attr("id", "dialog-loading-4").text("Checking if page redirects..."), $("<p>").attr("id", "dialog-loading-5").text("Retrieving quality prediction...").hide());
  this.$body.append(this.content.$element);
}; // Override the getBodyHeight() method to specify a custom height (or don't to use the automatically generated height).


LoadDialog.prototype.getBodyHeight = function () {
  return this.content.$element.outerHeight(true);
};

LoadDialog.prototype.showTaskDone = function (taskNumber) {
  $("#dialog-loading-" + taskNumber).append(" Done!");
  var isLastTask = taskNumber === 5;

  if (isLastTask) {
    // Immediately show 100% completed
    incrementProgress(100);
    window.setTimeout(function () {
      $("#dialog-loading").hide();
    }, 100);
    return;
  } // Show a smooth transition by using small steps over a short duration


  var totalIncrement = 20;
  var totalTime = 400;
  var totalSteps = 10;
  var incrementPerStep = totalIncrement / totalSteps;

  for (var step = 0; step < totalSteps; step++) {
    window.setTimeout(incrementProgress, totalTime * step / totalSteps, incrementPerStep);
  }
};

LoadDialog.prototype.showTaskFailed = function (taskNumber, code, jqxhr) {
  $("#dialog-loading-" + taskNumber).append(" Failed.", code == null ? "" : " " + (0, _util.makeErrorMsg)(code, jqxhr));
};

var _default = LoadDialog;
exports["default"] = _default;

},{"./util":10}],3:[function(require,module,exports){
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
 * @return {Promise<Template[]>}
 */


exports.parseTemplates = parseTemplates;

var getWithRedirectTo = function getWithRedirectTo(templates) {
  var templatesArray = Array.isArray(templates) ? templates : [templates];
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
          templatesArray[i].redirectsTo = mw.Title.newFromText(redirect.to);
        }
      });
    }

    return templatesArray;
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

  var prefixedText = self.redirectsTo ? self.redirectsTo.getPrefixedText() : self.getTitle().getPrefixedText();
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

},{"./cache":5,"./config":6,"./util":10}],4:[function(require,module,exports){
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
    return;
  }

  var autostartNamespaces = $.isArray(window.rater_autostartNamespaces) ? window.rater_autostartNamespaces : [window.rater_autostartNamespaces];

  if (-1 === autostartNamespaces.indexOf(_config["default"].mw.wgNamespaceNumber)) {
    return;
  }

  if (/(?:\?|&)(?:action|diff|oldid)=/.test(window.location.href)) {
    return;
  } // Check if talk page exists


  if ($("#ca-talk.new").length) {
    (0, _setup["default"])();
    return;
  }

  var thisPage = mw.Title.newFromText(_config["default"].mw.wgPageName);
  var talkPage = thisPage && thisPage.getTalkPage();

  if (!talkPage) {
    return;
  }
  /* Check templates present on talk page. Fetches indirectly transcluded templates, so will find
  	Template:WPBannerMeta (and its subtemplates). But some banners such as MILHIST don't use that
  	meta template, so we also have to check for template titles containg 'WikiProject'
  */


  _util.API.get({
    action: "query",
    format: "json",
    prop: "templates",
    titles: talkPage.getPrefixedText(),
    tlnamespace: "10",
    tllimit: "500",
    indexpageids: 1
  }).done(function (result) {
    var id = result.query.pageids;
    var templates = result.query.pages[id].templates;

    if (!templates) {
      (0, _setup["default"])();
      return;
    }

    var hasWikiproject = templates.some(function (template) {
      return /(WikiProject|WPBanner)/.test(template.title);
    });

    if (!hasWikiproject) {
      (0, _setup["default"])();
      return;
    }
  }).fail(function (code, jqxhr) {
    // Silently ignore failures (just log to console)
    console.warn("[Rater] Error while checking whether to autostart." + (code == null) ? "" : " " + (0, _util.makeErrorMsg)(code, jqxhr));
  });
};

var _default = autoStart;
exports["default"] = _default;

},{"./config":6,"./setup":9,"./util":10}],5:[function(require,module,exports){
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

},{"./util":10}],6:[function(require,module,exports){
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
  version: "1.3.1"
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

},{}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.diffStyles = void 0;
// Attribution: Diff styles from <https://en.wikipedia.org/wiki/Wikipedia:AutoWikiBrowser/style.css>
var diffStyles = "table.diff, td.diff-otitle, td.diff-ntitle { background-color: white; }\ntd.diff-otitle, td.diff-ntitle { text-align: center; }\ntd.diff-marker { text-align: right; font-weight: bold; font-size: 1.25em; }\ntd.diff-lineno { font-weight: bold; }\ntd.diff-addedline, td.diff-deletedline, td.diff-context { font-size: 88%; vertical-align: top; white-space: -moz-pre-wrap; white-space: pre-wrap; }\ntd.diff-addedline, td.diff-deletedline { border-style: solid; border-width: 1px 1px 1px 4px; border-radius: 0.33em; }\ntd.diff-addedline { border-color: #a3d3ff; }\ntd.diff-deletedline { border-color: #ffe49c; }\ntd.diff-context { background: #f3f3f3; color: #333333; border-style: solid; border-width: 1px 1px 1px 4px; border-color: #e6e6e6; border-radius: 0.33em; }\n.diffchange { font-weight: bold; text-decoration: none; }\ntable.diff {\n    border: none;\n    width: 98%; border-spacing: 4px;\n    table-layout: fixed; /* Ensures that colums are of equal width */\n}\ntd.diff-addedline .diffchange, td.diff-deletedline .diffchange { border-radius: 0.33em; padding: 0.25em 0; }\ntd.diff-addedline .diffchange {\tbackground: #d8ecff; }\ntd.diff-deletedline .diffchange { background: #feeec8; }\ntable.diff td {\tpadding: 0.33em 0.66em; }\ntable.diff col.diff-marker { width: 2%; }\ntable.diff col.diff-content { width: 48%; }\ntable.diff td div {\n    /* Force-wrap very long lines such as URLs or page-widening char strings. */\n    word-wrap: break-word;\n    /* As fallback (FF<3.5, Opera <10.5), scrollbars will be added for very wide cells\n        instead of text overflowing or widening */\n    overflow: auto;\n}";
exports.diffStyles = diffStyles;

},{}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

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
 */


var getBanners = function getBanners() {
  return getBannersFromCache().then( // Success: pass through
  function (banners, options) {
    return $.Deferred().resolve(banners, options);
  }, // Failure: get from Api, then cache them
  function () {
    var bannersPromise = getListOfBannersFromApi();
    bannersPromise.then(cacheBanners);
    return bannersPromise;
  });
};

var _default = getBanners;
exports["default"] = _default;

},{"./cache":5,"./util":10}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _config = _interopRequireDefault(require("./config"));

var _LoadDialog = _interopRequireDefault(require("./LoadDialog"));

var _util = require("./util");

var _Template = require("./Template");

var _getBanners = _interopRequireDefault(require("./getBanners"));

var cache = _interopRequireWildcard(require("./cache"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var setupRater = function setupRater(clickEvent) {
  if (clickEvent) {
    clickEvent.preventDefault();
  }

  var setupCompletedPromise = $.Deferred();
  var currentPage = mw.Title.newFromText(_config["default"].mw.wgPageName);
  var talkPage = currentPage && currentPage.getTalkPage();
  var subjectPage = currentPage && currentPage.getSubjectPage();
  var loadDialog = new _LoadDialog["default"]({
    size: "medium"
  }); // Create and append a window manager, which will open and close the window.

  var windowManager = new OO.ui.WindowManager();
  $(document.body).append(windowManager.$element); // Add the window to the window manager using the addWindows() method.

  windowManager.addWindows([loadDialog]); // Open the window!

  var loadDialogWin = windowManager.openWindow(loadDialog); // Get lists of all banners (task 0)

  var bannersPromise = (0, _getBanners["default"])(); // Load talk page (task 1) 

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
  });

  loadTalkPromise.then(function () {
    loadDialog.showTaskDone(1);
  }, function (code, jqxhr) {
    loadDialog.showTaskFailed(1, code, jqxhr);
  }); // Parse talk page for banners (task 2)

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
        var mainText = template.redirectTo ? template.redirectTo.getMainText() : template.getTitle().getMainText();
        return allBanners.withRatings.includes(mainText) || allBanners.withoutRatings.includes(mainText) || allBanners.wrappers.includes(mainText);
      }).map(function (template) {
        // Set wrapper target if needed
        var mainText = template.redirectTo ? template.redirectTo.getMainText() : template.getTitle().getMainText();

        if (allBanners.wrappers.includes(mainText)) {
          template.redirectsTo = mw.Title.newFromText("Template:Subst:" + mainText);
        }

        return template;
      });
    });
  });
  parseTalkPromise.then(function () {
    loadDialog.showTaskDone(2);
  }, function (code, jqxhr) {
    loadDialog.showTaskFailed(2, code, jqxhr);
  }); // Retrieve and store TemplateData (task 3)

  var templateDataPromise = parseTalkPromise.then(function (templates) {
    templates.forEach(function (template) {
      return template.setParamDataAndSuggestions();
    });
    return templates;
  });
  templateDataPromise.then(function () {
    loadDialog.showTaskDone(3);
  }); // Check if page is a redirect (task 4) - but don't error out if request fails

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
  });

  redirectCheckPromise.then(function () {
    loadDialog.showTaskDone(4);
  }); // Retrieve rating from ORES (task 5, only needed for articles)

  var shouldGetOres = _config["default"].mw.wgNamespaceNumber <= 1;

  if (shouldGetOres) {
    $("#dialog-loading-5").show();
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
    oresPromise.then( // Success: show success
    function () {
      loadDialog.showTaskDone(4);
    }, // Failure: show failure, but still resolve promise (after 2 seconds)
    function (code, jqxhr) {
      loadDialog.showTaskFailed(4, code, jqxhr);
      var waitPromise = $.Deferred();
      setTimeout(waitPromise.resolve, 2000);
      return waitPromise;
    });
  } else {// // Set hidden task as done so progress bar can complete?
    // loadDialog.showTaskDone(5);
  }

  $.when(loadTalkPromise, templateDataPromise, redirectCheckPromise, shouldGetOres && oresPromise).then( // All succeded
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

    windowManager.closeWindow(loadDialog, result);
    cache.clearInvalidItems();
  }, // There was a failure. Wait a few seconds, then close the dialog
  function () {
    return setTimeout(function () {
      return windowManager.closeWindow(loadDialog);
    }, 3000);
  });
  loadDialogWin.closed.then(function (data) {
    if (data && data.success) {
      setupCompletedPromise.resolve(data);
    } else {
      setupCompletedPromise.reject();
    }
  });
  setupCompletedPromise.then(function (data) {
    return console.log("setup window closed", data);
  });
  return setupCompletedPromise;
};

var _default = setupRater;
exports["default"] = _default;

},{"./LoadDialog":2,"./Template":3,"./cache":5,"./config":6,"./getBanners":8,"./util":10}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeErrorMsg = exports.API = exports.isAfterDate = void 0;

var _config = _interopRequireDefault(require("./config"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// Various utility functions and objects that might be used in multiple places
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
  var request = $.get("https:" + _config["default"].mw.wgServer + mw.util.getUrl(page, {
    action: "raw"
  })).then(function (data) {
    if (!data) {
      return $.Deferred().reject("ok-but-empty");
    }
  }, function () {
    var status = request.getResponseHeader("status");
    return $.Deferred().reject("http", {
      textstatus: status || "unknown"
    });
  });
  return request;
};

var makeErrorMsg = function makeErrorMsg(code, jqxhr) {
  var details = "";

  if (code === "http" && jqxhr.textStatus === "error") {
    details = "HTTP error " + jqxhr.xhr.status;
  } else if (code === "http") {
    details = "HTTP error: " + jqxhr.textStatus;
  } else if (code === "ok-but-empty") {
    details = "Error: Got an empty response from the server";
  } else {
    details = "API error: " + code;
  }

  return details;
};

exports.makeErrorMsg = makeErrorMsg;

},{"./config":6}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJyYXRlci1zcmMvQXBwLmpzIiwicmF0ZXItc3JjL0xvYWREaWFsb2cuanMiLCJyYXRlci1zcmMvVGVtcGxhdGUuanMiLCJyYXRlci1zcmMvYXV0b3N0YXJ0LmpzIiwicmF0ZXItc3JjL2NhY2hlLmpzIiwicmF0ZXItc3JjL2NvbmZpZy5qcyIsInJhdGVyLXNyYy9jc3MuanMiLCJyYXRlci1zcmMvZ2V0QmFubmVycy5qcyIsInJhdGVyLXNyYy9zZXR1cC5qcyIsInJhdGVyLXNyYy91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQTs7QUFDQTs7QUFDQTs7OztBQUVBLENBQUMsU0FBUyxHQUFULEdBQWU7QUFDZixFQUFBLE9BQU8sQ0FBQyxHQUFSLENBQVksOEJBQVo7QUFFQSxFQUFBLEVBQUUsQ0FBQyxJQUFILENBQVEsTUFBUixDQUFlLGVBQWYsRUFIZSxDQUtmOztBQUNBLEVBQUEsRUFBRSxDQUFDLElBQUgsQ0FBUSxjQUFSLENBQ0MsWUFERCxFQUVDLEdBRkQsRUFHQyxPQUhELEVBSUMsVUFKRCxFQUtDLDZCQUxELEVBTUMsR0FORDtBQVFBLEVBQUEsQ0FBQyxDQUFDLFdBQUQsQ0FBRCxDQUFlLEtBQWYsQ0FBcUIsaUJBQXJCO0FBRUE7QUFDQSxDQWpCRDs7Ozs7Ozs7OztBQ0pBOztBQUVBLElBQUksV0FBVyxHQUFHLElBQUksRUFBRSxDQUFDLEVBQUgsQ0FBTSxpQkFBVixDQUE2QjtBQUM5QyxFQUFBLFFBQVEsRUFBRTtBQURvQyxDQUE3QixDQUFsQjs7QUFHQSxJQUFJLGlCQUFpQixHQUFHLFNBQXBCLGlCQUFvQixDQUFTLE1BQVQsRUFBaUIsT0FBakIsRUFBMEI7QUFDakQsTUFBSSxhQUFhLEdBQUcsV0FBVyxDQUFDLFdBQVosRUFBcEI7QUFDQSxNQUFJLG1CQUFtQixHQUFHLElBQUksQ0FBQyxHQUFMLENBQVMsT0FBTyxJQUFJLEdBQXBCLEVBQXlC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SUFBZixFQUFxQjtBQUFDLElBQUEsTUFBTSxFQUFDO0FBQVIsR0FBckIsQ0FBdEMsRUFDWixJQURZLENBQ1AsVUFBUyxJQUFULEVBQWU7QUFDcEIsUUFBSyxDQUFDLElBQU4sRUFBYTtBQUNaLGFBQU8sQ0FBQyxDQUFDLFFBQUYsR0FBYSxNQUFiLENBQW9CLGNBQXBCLENBQVA7QUFDQTtBQUNELEdBTFksRUFLVixZQUFXO0FBQ2IsUUFBSSxNQUFNLEdBQUcsT0FBTyxDQUFDLGlCQUFSLENBQTBCLFFBQTFCLENBQWI7QUFDQSxXQUFPLENBQUMsQ0FBQyxRQUFGLEdBQWEsTUFBYixDQUFvQixNQUFwQixFQUE0QjtBQUFDLE1BQUEsVUFBVSxFQUFFLE1BQU0sSUFBSTtBQUF2QixLQUE1QixDQUFQO0FBQ0EsR0FSWSxDQUFkO0FBU0EsU0FBTyxPQUFQO0FBQ0EsQ0FYRDs7QUFhQSxJQUFJLFlBQVksR0FBRyxTQUFmLFlBQWUsQ0FBUyxJQUFULEVBQWUsS0FBZixFQUFzQjtBQUN4QyxNQUFJLE9BQU8sR0FBRyxFQUFkOztBQUNBLE1BQUssSUFBSSxLQUFLLE1BQVQsSUFBbUIsS0FBSyxDQUFDLFVBQU4sS0FBcUIsT0FBN0MsRUFBdUQ7QUFDdEQsSUFBQSxPQUFPLEdBQUcsZ0JBQWdCLEtBQUssQ0FBQyxHQUFOLENBQVUsTUFBcEM7QUFDQSxHQUZELE1BRU8sSUFBSyxJQUFJLEtBQUssTUFBZCxFQUF1QjtBQUM3QixJQUFBLE9BQU8sR0FBRyxpQkFBaUIsS0FBSyxDQUFDLFVBQWpDO0FBQ0EsR0FGTSxNQUVBLElBQUssSUFBSSxLQUFLLGNBQWQsRUFBK0I7QUFDckMsSUFBQSxPQUFPLEdBQUcsOENBQVY7QUFDQSxHQUZNLE1BRUE7QUFDTixJQUFBLE9BQU8sR0FBRyxnQkFBZ0IsSUFBMUI7QUFDQTs7QUFDRCxTQUFPLE9BQVA7QUFDQSxDQVpEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiaW1wb3J0IHNldHVwUmF0ZXIgZnJvbSBcIi4vc2V0dXBcIjtcclxuaW1wb3J0IGF1dG9TdGFydCBmcm9tIFwiLi9hdXRvc3RhcnRcIjtcclxuaW1wb3J0IGRpZmZTdHlsZXMgZnJvbSBcIi4vY3NzLmpzXCI7XHJcblxyXG4oZnVuY3Rpb24gQXBwKCkge1xyXG5cdGNvbnNvbGUubG9nKFwiUmF0ZXIncyBBcHAuanMgaXMgcnVubmluZy4uLlwiKTtcclxuXHJcblx0bXcudXRpbC5hZGRDU1MoZGlmZlN0eWxlcyk7XHJcblxyXG5cdC8vIEFkZCBwb3J0bGV0IGxpbmtcclxuXHRtdy51dGlsLmFkZFBvcnRsZXRMaW5rKFxyXG5cdFx0XCJwLWNhY3Rpb25zXCIsXHJcblx0XHRcIiNcIixcclxuXHRcdFwiUmF0ZXJcIixcclxuXHRcdFwiY2EtcmF0ZXJcIixcclxuXHRcdFwiUmF0ZSBxdWFsaXR5IGFuZCBpbXBvcnRhbmNlXCIsXHJcblx0XHRcIjVcIlxyXG5cdCk7XHJcblx0JChcIiNjYS1yYXRlclwiKS5jbGljayhzZXR1cFJhdGVyKTtcclxuXHJcblx0YXV0b1N0YXJ0KCk7XHJcbn0pKCk7IiwiaW1wb3J0IHttYWtlRXJyb3JNc2d9IGZyb20gXCIuL3V0aWxcIjtcclxuXHJcbnZhciBwcm9ncmVzc0JhciA9IG5ldyBPTy51aS5Qcm9ncmVzc0JhcldpZGdldCgge1xyXG5cdHByb2dyZXNzOiAxXHJcbn0gKTtcclxudmFyIGluY3JlbWVudFByb2dyZXNzID0gZnVuY3Rpb24oYW1vdW50LCBtYXhpbXVtKSB7XHJcblx0dmFyIHByaW9yUHJvZ3Jlc3MgPSBwcm9ncmVzc0Jhci5nZXRQcm9ncmVzcygpO1xyXG5cdHZhciBpbmNyZW1lbnRlZFByb2dyZXNzID0gTWF0aC5taW4obWF4aW11bSB8fCAxMDAsIHByaW9yUHJvZ3Jlc3MgKyBhbW91bnQpO1xyXG5cdHByb2dyZXNzQmFyLnNldFByb2dyZXNzKGluY3JlbWVudGVkUHJvZ3Jlc3MpO1xyXG59O1xyXG4vKiB2YXIgaW5jcmVtZW50UHJvZ3Jlc3NCeUludGVydmFsID0gZnVuY3Rpb24oKSB7XHJcblx0dmFyIGluY3JlbWVudEludGVydmFsRGVsYXkgPSAxMDA7XHJcblx0dmFyIGluY3JlbWVudEludGVydmFsQW1vdW50ID0gMC4xO1xyXG5cdHZhciBpbmNyZW1lbnRJbnRlcnZhbE1heHZhbCA9IDk4O1xyXG5cdHJldHVybiB3aW5kb3cuc2V0SW50ZXJ2YWwoXHJcblx0XHRpbmNyZW1lbnRQcm9ncmVzcyxcclxuXHRcdGluY3JlbWVudEludGVydmFsRGVsYXksXHJcblx0XHRpbmNyZW1lbnRJbnRlcnZhbEFtb3VudCxcclxuXHRcdGluY3JlbWVudEludGVydmFsTWF4dmFsXHJcblx0KTtcclxufTsgKi9cclxuXHJcbnZhciBMb2FkRGlhbG9nID0gZnVuY3Rpb24gTG9hZERpYWxvZyggY29uZmlnICkge1xyXG5cdExvYWREaWFsb2cuc3VwZXIuY2FsbCggdGhpcywgY29uZmlnICk7XHJcbn07XHJcbk9PLmluaGVyaXRDbGFzcyggTG9hZERpYWxvZywgT08udWkuRGlhbG9nICk7IFxyXG5cclxuTG9hZERpYWxvZy5zdGF0aWMubmFtZSA9IFwibG9hZERpYWxvZ1wiO1xyXG4vLyBTcGVjaWZ5IGEgdGl0bGUgc3RhdGljYWxseSAob3IsIGFsdGVybmF0aXZlbHksIHdpdGggZGF0YSBwYXNzZWQgdG8gdGhlIG9wZW5pbmcoKSBtZXRob2QpLlxyXG5Mb2FkRGlhbG9nLnN0YXRpYy50aXRsZSA9IFwiTG9hZGluZyBSYXRlci4uLlwiO1xyXG5cclxuLy8gQ3VzdG9taXplIHRoZSBpbml0aWFsaXplKCkgZnVuY3Rpb246IFRoaXMgaXMgd2hlcmUgdG8gYWRkIGNvbnRlbnQgdG8gdGhlIGRpYWxvZyBib2R5IGFuZCBzZXQgdXAgZXZlbnQgaGFuZGxlcnMuXHJcbkxvYWREaWFsb2cucHJvdG90eXBlLmluaXRpYWxpemUgPSBmdW5jdGlvbiAoKSB7XHJcblx0Ly8gQ2FsbCB0aGUgcGFyZW50IG1ldGhvZC5cclxuXHRMb2FkRGlhbG9nLnN1cGVyLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwoIHRoaXMgKTtcclxuXHQvLyBDcmVhdGUgYW5kIGFwcGVuZCBhIGxheW91dCBhbmQgc29tZSBjb250ZW50LlxyXG5cdHRoaXMuY29udGVudCA9IG5ldyBPTy51aS5QYW5lbExheW91dCggeyBcclxuXHRcdHBhZGRlZDogdHJ1ZSxcclxuXHRcdGV4cGFuZGVkOiBmYWxzZSBcclxuXHR9ICk7XHJcblx0dGhpcy5jb250ZW50LiRlbGVtZW50LmFwcGVuZChcclxuXHRcdHByb2dyZXNzQmFyLiRlbGVtZW50LFxyXG5cdFx0JChcIjxwPlwiKS5hdHRyKFwiaWRcIiwgXCJkaWFsb2ctbG9hZGluZy0wXCIpLmNzcyhcImZvbnQtd2VpZ2h0XCIsIFwiYm9sZFwiKS50ZXh0KFwiSW5pdGlhbGlzaW5nOlwiKSxcclxuXHRcdCQoXCI8cD5cIikuYXR0cihcImlkXCIsIFwiZGlhbG9nLWxvYWRpbmctMVwiKS50ZXh0KFwiTG9hZGluZyB0YWxrcGFnZSB3aWtpdGV4dC4uLlwiKSxcclxuXHRcdCQoXCI8cD5cIikuYXR0cihcImlkXCIsIFwiZGlhbG9nLWxvYWRpbmctMlwiKS50ZXh0KFwiUGFyc2luZyB0YWxrcGFnZSB0ZW1wbGF0ZXMuLi5cIiksXHJcblx0XHQkKFwiPHA+XCIpLmF0dHIoXCJpZFwiLCBcImRpYWxvZy1sb2FkaW5nLTNcIikudGV4dChcIkdldHRpbmcgdGVtcGxhdGVzJyBwYXJhbWV0ZXIgZGF0YS4uLlwiKSxcclxuXHRcdCQoXCI8cD5cIikuYXR0cihcImlkXCIsIFwiZGlhbG9nLWxvYWRpbmctNFwiKS50ZXh0KFwiQ2hlY2tpbmcgaWYgcGFnZSByZWRpcmVjdHMuLi5cIiksXHJcblx0XHQkKFwiPHA+XCIpLmF0dHIoXCJpZFwiLCBcImRpYWxvZy1sb2FkaW5nLTVcIikudGV4dChcIlJldHJpZXZpbmcgcXVhbGl0eSBwcmVkaWN0aW9uLi4uXCIpLmhpZGUoKVxyXG5cdCk7XHJcblx0dGhpcy4kYm9keS5hcHBlbmQoIHRoaXMuY29udGVudC4kZWxlbWVudCApO1xyXG59O1xyXG5cclxuLy8gT3ZlcnJpZGUgdGhlIGdldEJvZHlIZWlnaHQoKSBtZXRob2QgdG8gc3BlY2lmeSBhIGN1c3RvbSBoZWlnaHQgKG9yIGRvbid0IHRvIHVzZSB0aGUgYXV0b21hdGljYWxseSBnZW5lcmF0ZWQgaGVpZ2h0KS5cclxuTG9hZERpYWxvZy5wcm90b3R5cGUuZ2V0Qm9keUhlaWdodCA9IGZ1bmN0aW9uICgpIHtcclxuXHRyZXR1cm4gdGhpcy5jb250ZW50LiRlbGVtZW50Lm91dGVySGVpZ2h0KCB0cnVlICk7XHJcbn07XHJcblxyXG5Mb2FkRGlhbG9nLnByb3RvdHlwZS5zaG93VGFza0RvbmUgPSBmdW5jdGlvbih0YXNrTnVtYmVyKSB7XHJcblx0JChcIiNkaWFsb2ctbG9hZGluZy1cIit0YXNrTnVtYmVyKS5hcHBlbmQoXCIgRG9uZSFcIik7XHJcblx0dmFyIGlzTGFzdFRhc2sgPSAoIHRhc2tOdW1iZXIgPT09IDUgKTtcclxuXHRpZiAoIGlzTGFzdFRhc2sgKSB7XHJcblx0XHQvLyBJbW1lZGlhdGVseSBzaG93IDEwMCUgY29tcGxldGVkXHJcblx0XHRpbmNyZW1lbnRQcm9ncmVzcygxMDApO1xyXG5cdFx0d2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcblx0XHRcdCQoXCIjZGlhbG9nLWxvYWRpbmdcIikuaGlkZSgpO1xyXG5cdFx0fSwgMTAwKTtcclxuXHRcdHJldHVybjtcclxuXHR9IFxyXG5cdC8vIFNob3cgYSBzbW9vdGggdHJhbnNpdGlvbiBieSB1c2luZyBzbWFsbCBzdGVwcyBvdmVyIGEgc2hvcnQgZHVyYXRpb25cclxuXHR2YXIgdG90YWxJbmNyZW1lbnQgPSAyMDtcclxuXHR2YXIgdG90YWxUaW1lID0gNDAwO1xyXG5cdHZhciB0b3RhbFN0ZXBzID0gMTA7XHJcblx0dmFyIGluY3JlbWVudFBlclN0ZXAgPSB0b3RhbEluY3JlbWVudCAvIHRvdGFsU3RlcHM7XHJcblx0Zm9yICggdmFyIHN0ZXA9MDsgc3RlcCA8IHRvdGFsU3RlcHM7IHN0ZXArKykge1xyXG5cdFx0d2luZG93LnNldFRpbWVvdXQoXHJcblx0XHRcdGluY3JlbWVudFByb2dyZXNzLFxyXG5cdFx0XHR0b3RhbFRpbWUgKiBzdGVwIC8gdG90YWxTdGVwcyxcclxuXHRcdFx0aW5jcmVtZW50UGVyU3RlcFxyXG5cdFx0KTtcclxuXHR9XHJcbn07XHJcbkxvYWREaWFsb2cucHJvdG90eXBlLnNob3dUYXNrRmFpbGVkID0gZnVuY3Rpb24odGFza051bWJlciwgY29kZSwganF4aHIpIHtcclxuXHQkKFwiI2RpYWxvZy1sb2FkaW5nLVwiK3Rhc2tOdW1iZXIpLmFwcGVuZChcclxuXHRcdFwiIEZhaWxlZC5cIixcclxuXHRcdCggY29kZSA9PSBudWxsICkgPyBcIlwiIDogXCIgXCIgKyBtYWtlRXJyb3JNc2coY29kZSwganF4aHIpXHJcblx0KTtcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IExvYWREaWFsb2c7XHJcblxyXG4iLCJpbXBvcnQge0FQSSwgaXNBZnRlckRhdGV9IGZyb20gXCIuL3V0aWxcIjtcclxuaW1wb3J0IGNvbmZpZyBmcm9tIFwiLi9jb25maWdcIjtcclxuaW1wb3J0ICogYXMgY2FjaGUgZnJvbSBcIi4vY2FjaGVcIjtcclxuXHJcbi8qKiBUZW1wbGF0ZVxyXG4gKlxyXG4gKiBAY2xhc3NcclxuICogUmVwcmVzZW50cyB0aGUgd2lraXRleHQgb2YgdGVtcGxhdGUgdHJhbnNjbHVzaW9uLiBVc2VkIGJ5ICNwYXJzZVRlbXBsYXRlcy5cclxuICogQHByb3Age1N0cmluZ30gbmFtZSBOYW1lIG9mIHRoZSB0ZW1wbGF0ZVxyXG4gKiBAcHJvcCB7U3RyaW5nfSB3aWtpdGV4dCBGdWxsIHdpa2l0ZXh0IG9mIHRoZSB0cmFuc2NsdXNpb25cclxuICogQHByb3Age09iamVjdFtdfSBwYXJhbWV0ZXJzIFBhcmFtZXRlcnMgdXNlZCBpbiB0aGUgdHJhbnNsY3VzaW9uLCBpbiBvcmRlciwgb2YgZm9ybTpcclxuXHR7XHJcblx0XHRuYW1lOiB7U3RyaW5nfE51bWJlcn0gcGFyYW1ldGVyIG5hbWUsIG9yIHBvc2l0aW9uIGZvciB1bm5hbWVkIHBhcmFtZXRlcnMsXHJcblx0XHR2YWx1ZToge1N0cmluZ30gV2lraXRleHQgcGFzc2VkIHRvIHRoZSBwYXJhbWV0ZXIgKHdoaXRlc3BhY2UgdHJpbW1lZCksXHJcblx0XHR3aWtpdGV4dDoge1N0cmluZ30gRnVsbCB3aWtpdGV4dCAoaW5jbHVkaW5nIGxlYWRpbmcgcGlwZSwgcGFyYW1ldGVyIG5hbWUvZXF1YWxzIHNpZ24gKGlmIGFwcGxpY2FibGUpLCB2YWx1ZSwgYW5kIGFueSB3aGl0ZXNwYWNlKVxyXG5cdH1cclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSB3aWtpdGV4dCBXaWtpdGV4dCBvZiBhIHRlbXBsYXRlIHRyYW5zY2x1c2lvbiwgc3RhcnRpbmcgd2l0aCAne3snIGFuZCBlbmRpbmcgd2l0aCAnfX0nLlxyXG4gKi9cclxudmFyIFRlbXBsYXRlID0gZnVuY3Rpb24od2lraXRleHQpIHtcclxuXHR0aGlzLndpa2l0ZXh0ID0gd2lraXRleHQ7XHJcblx0dGhpcy5wYXJhbWV0ZXJzID0gW107XHJcbn07XHJcblRlbXBsYXRlLnByb3RvdHlwZS5hZGRQYXJhbSA9IGZ1bmN0aW9uKG5hbWUsIHZhbCwgd2lraXRleHQpIHtcclxuXHR0aGlzLnBhcmFtZXRlcnMucHVzaCh7XHJcblx0XHRcIm5hbWVcIjogbmFtZSxcclxuXHRcdFwidmFsdWVcIjogdmFsLCBcclxuXHRcdFwid2lraXRleHRcIjogXCJ8XCIgKyB3aWtpdGV4dFxyXG5cdH0pO1xyXG59O1xyXG4vKipcclxuICogR2V0IGEgcGFyYW1ldGVyIGRhdGEgYnkgcGFyYW1ldGVyIG5hbWVcclxuICovIFxyXG5UZW1wbGF0ZS5wcm90b3R5cGUuZ2V0UGFyYW0gPSBmdW5jdGlvbihwYXJhbU5hbWUpIHtcclxuXHRyZXR1cm4gdGhpcy5wYXJhbWV0ZXJzLmZpbmQoZnVuY3Rpb24ocCkgeyByZXR1cm4gcC5uYW1lID09IHBhcmFtTmFtZTsgfSk7XHJcbn07XHJcblRlbXBsYXRlLnByb3RvdHlwZS5zZXROYW1lID0gZnVuY3Rpb24obmFtZSkge1xyXG5cdHRoaXMubmFtZSA9IG5hbWUudHJpbSgpO1xyXG59O1xyXG5UZW1wbGF0ZS5wcm90b3R5cGUuZ2V0VGl0bGUgPSBmdW5jdGlvbigpIHtcclxuXHRyZXR1cm4gbXcuVGl0bGUubmV3RnJvbVRleHQoXCJUZW1wbGF0ZTpcIiArIHRoaXMubmFtZSk7XHJcbn07XHJcblxyXG4vKipcclxuICogcGFyc2VUZW1wbGF0ZXNcclxuICpcclxuICogUGFyc2VzIHRlbXBsYXRlcyBmcm9tIHdpa2l0ZXh0LlxyXG4gKiBCYXNlZCBvbiBTRDAwMDEncyB2ZXJzaW9uIGF0IDxodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9Vc2VyOlNEMDAwMS9wYXJzZUFsbFRlbXBsYXRlcy5qcz4uXHJcbiAqIFJldHVybnMgYW4gYXJyYXkgY29udGFpbmluZyB0aGUgdGVtcGxhdGUgZGV0YWlsczpcclxuICogIHZhciB0ZW1wbGF0ZXMgPSBwYXJzZVRlbXBsYXRlcyhcIkhlbGxvIHt7Zm9vIHxCYXJ8YmF6PXF1eCB8Mj1sb3JlbWlwc3VtfDM9fX0gd29ybGRcIik7XHJcbiAqICBjb25zb2xlLmxvZyh0ZW1wbGF0ZXNbMF0pOyAvLyAtLT4gb2JqZWN0XHJcblx0e1xyXG5cdFx0bmFtZTogXCJmb29cIixcclxuXHRcdHdpa2l0ZXh0Olwie3tmb28gfEJhcnxiYXo9cXV4IHwgMiA9IGxvcmVtaXBzdW0gIHwzPX19XCIsXHJcblx0XHRwYXJhbWV0ZXJzOiBbXHJcblx0XHRcdHtcclxuXHRcdFx0XHRuYW1lOiAxLFxyXG5cdFx0XHRcdHZhbHVlOiAnQmFyJyxcclxuXHRcdFx0XHR3aWtpdGV4dDogJ3xCYXInXHJcblx0XHRcdH0sXHJcblx0XHRcdHtcclxuXHRcdFx0XHRuYW1lOiAnYmF6JyxcclxuXHRcdFx0XHR2YWx1ZTogJ3F1eCcsXHJcblx0XHRcdFx0d2lraXRleHQ6ICd8YmF6PXF1eCAnXHJcblx0XHRcdH0sXHJcblx0XHRcdHtcclxuXHRcdFx0XHRuYW1lOiAnMicsXHJcblx0XHRcdFx0dmFsdWU6ICdsb3JlbWlwc3VtJyxcclxuXHRcdFx0XHR3aWtpdGV4dDogJ3wgMiA9IGxvcmVtaXBzdW0gICdcclxuXHRcdFx0fSxcclxuXHRcdFx0e1xyXG5cdFx0XHRcdG5hbWU6ICczJyxcclxuXHRcdFx0XHR2YWx1ZTogJycsXHJcblx0XHRcdFx0d2lraXRleHQ6ICd8Mz0nXHJcblx0XHRcdH1cclxuXHRcdF0sXHJcblx0XHRnZXRQYXJhbTogZnVuY3Rpb24ocGFyYW1OYW1lKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLnBhcmFtZXRlcnMuZmluZChmdW5jdGlvbihwKSB7IHJldHVybiBwLm5hbWUgPT0gcGFyYW1OYW1lOyB9KTtcclxuXHRcdH1cclxuXHR9XHJcbiAqICAgIFxyXG4gKiBcclxuICogQHBhcmFtIHtTdHJpbmd9IHdpa2l0ZXh0XHJcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gcmVjdXJzaXZlIFNldCB0byBgdHJ1ZWAgdG8gYWxzbyBwYXJzZSB0ZW1wbGF0ZXMgdGhhdCBvY2N1ciB3aXRoaW4gb3RoZXIgdGVtcGxhdGVzLFxyXG4gKiAgcmF0aGVyIHRoYW4ganVzdCB0b3AtbGV2ZWwgdGVtcGxhdGVzLiBcclxuICogQHJldHVybiB7VGVtcGxhdGVbXX0gdGVtcGxhdGVzXHJcbiovXHJcbnZhciBwYXJzZVRlbXBsYXRlcyA9IGZ1bmN0aW9uKHdpa2l0ZXh0LCByZWN1cnNpdmUpIHsgLyogZXNsaW50LWRpc2FibGUgbm8tY29udHJvbC1yZWdleCAqL1xyXG5cdHZhciBzdHJSZXBsYWNlQXQgPSBmdW5jdGlvbihzdHJpbmcsIGluZGV4LCBjaGFyKSB7XHJcblx0XHRyZXR1cm4gc3RyaW5nLnNsaWNlKDAsaW5kZXgpICsgY2hhciArIHN0cmluZy5zbGljZShpbmRleCArIDEpO1xyXG5cdH07XHJcblxyXG5cdHZhciByZXN1bHQgPSBbXTtcclxuXHRcclxuXHR2YXIgcHJvY2Vzc1RlbXBsYXRlVGV4dCA9IGZ1bmN0aW9uIChzdGFydElkeCwgZW5kSWR4KSB7XHJcblx0XHR2YXIgdGV4dCA9IHdpa2l0ZXh0LnNsaWNlKHN0YXJ0SWR4LCBlbmRJZHgpO1xyXG5cclxuXHRcdHZhciB0ZW1wbGF0ZSA9IG5ldyBUZW1wbGF0ZShcInt7XCIgKyB0ZXh0LnJlcGxhY2UoL1xceDAxL2csXCJ8XCIpICsgXCJ9fVwiKTtcclxuXHRcdFxyXG5cdFx0Ly8gc3dhcCBvdXQgcGlwZSBpbiBsaW5rcyB3aXRoIFxceDAxIGNvbnRyb2wgY2hhcmFjdGVyXHJcblx0XHQvLyBbW0ZpbGU6IF1dIGNhbiBoYXZlIG11bHRpcGxlIHBpcGVzLCBzbyBtaWdodCBuZWVkIG11bHRpcGxlIHBhc3Nlc1xyXG5cdFx0d2hpbGUgKCAvKFxcW1xcW1teXFxdXSo/KVxcfCguKj9cXF1cXF0pL2cudGVzdCh0ZXh0KSApIHtcclxuXHRcdFx0dGV4dCA9IHRleHQucmVwbGFjZSgvKFxcW1xcW1teXFxdXSo/KVxcfCguKj9cXF1cXF0pL2csIFwiJDFcXHgwMSQyXCIpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBjaHVua3MgPSB0ZXh0LnNwbGl0KFwifFwiKS5tYXAoZnVuY3Rpb24oY2h1bmspIHtcclxuXHRcdFx0Ly8gY2hhbmdlICdcXHgwMScgY29udHJvbCBjaGFyYWN0ZXJzIGJhY2sgdG8gcGlwZXNcclxuXHRcdFx0cmV0dXJuIGNodW5rLnJlcGxhY2UoL1xceDAxL2csXCJ8XCIpOyBcclxuXHRcdH0pO1xyXG5cclxuXHRcdHRlbXBsYXRlLnNldE5hbWUoY2h1bmtzWzBdKTtcclxuXHRcdFxyXG5cdFx0dmFyIHBhcmFtZXRlckNodW5rcyA9IGNodW5rcy5zbGljZSgxKTtcclxuXHJcblx0XHR2YXIgdW5uYW1lZElkeCA9IDE7XHJcblx0XHRwYXJhbWV0ZXJDaHVua3MuZm9yRWFjaChmdW5jdGlvbihjaHVuaykge1xyXG5cdFx0XHR2YXIgaW5kZXhPZkVxdWFsVG8gPSBjaHVuay5pbmRleE9mKFwiPVwiKTtcclxuXHRcdFx0dmFyIGluZGV4T2ZPcGVuQnJhY2VzID0gY2h1bmsuaW5kZXhPZihcInt7XCIpO1xyXG5cdFx0XHRcclxuXHRcdFx0dmFyIGlzV2l0aG91dEVxdWFscyA9ICFjaHVuay5pbmNsdWRlcyhcIj1cIik7XHJcblx0XHRcdHZhciBoYXNCcmFjZXNCZWZvcmVFcXVhbHMgPSBjaHVuay5pbmNsdWRlcyhcInt7XCIpICYmIGluZGV4T2ZPcGVuQnJhY2VzIDwgaW5kZXhPZkVxdWFsVG87XHRcclxuXHRcdFx0dmFyIGlzVW5uYW1lZFBhcmFtID0gKCBpc1dpdGhvdXRFcXVhbHMgfHwgaGFzQnJhY2VzQmVmb3JlRXF1YWxzICk7XHJcblx0XHRcdFxyXG5cdFx0XHR2YXIgcE5hbWUsIHBOdW0sIHBWYWw7XHJcblx0XHRcdGlmICggaXNVbm5hbWVkUGFyYW0gKSB7XHJcblx0XHRcdFx0Ly8gR2V0IHRoZSBuZXh0IG51bWJlciBub3QgYWxyZWFkeSB1c2VkIGJ5IGVpdGhlciBhbiB1bm5hbWVkIHBhcmFtZXRlciwgb3IgYnkgYVxyXG5cdFx0XHRcdC8vIG5hbWVkIHBhcmFtZXRlciBsaWtlIGB8MT12YWxgXHJcblx0XHRcdFx0d2hpbGUgKCB0ZW1wbGF0ZS5nZXRQYXJhbSh1bm5hbWVkSWR4KSApIHtcclxuXHRcdFx0XHRcdHVubmFtZWRJZHgrKztcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cE51bSA9IHVubmFtZWRJZHg7XHJcblx0XHRcdFx0cFZhbCA9IGNodW5rLnRyaW0oKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRwTmFtZSA9IGNodW5rLnNsaWNlKDAsIGluZGV4T2ZFcXVhbFRvKS50cmltKCk7XHJcblx0XHRcdFx0cFZhbCA9IGNodW5rLnNsaWNlKGluZGV4T2ZFcXVhbFRvICsgMSkudHJpbSgpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHRlbXBsYXRlLmFkZFBhcmFtKHBOYW1lIHx8IHBOdW0sIHBWYWwsIGNodW5rKTtcclxuXHRcdH0pO1xyXG5cdFx0XHJcblx0XHRyZXN1bHQucHVzaCh0ZW1wbGF0ZSk7XHJcblx0fTtcclxuXHJcblx0XHJcblx0dmFyIG4gPSB3aWtpdGV4dC5sZW5ndGg7XHJcblx0XHJcblx0Ly8gbnVtYmVyIG9mIHVuY2xvc2VkIGJyYWNlc1xyXG5cdHZhciBudW1VbmNsb3NlZCA9IDA7XHJcblxyXG5cdC8vIGFyZSB3ZSBpbnNpZGUgYSBjb21tZW50IG9yIGJldHdlZW4gbm93aWtpIHRhZ3M/XHJcblx0dmFyIGluQ29tbWVudCA9IGZhbHNlO1xyXG5cdHZhciBpbk5vd2lraSA9IGZhbHNlO1xyXG5cclxuXHR2YXIgc3RhcnRJZHgsIGVuZElkeDtcclxuXHRcclxuXHRmb3IgKHZhciBpPTA7IGk8bjsgaSsrKSB7XHJcblx0XHRcclxuXHRcdGlmICggIWluQ29tbWVudCAmJiAhaW5Ob3dpa2kgKSB7XHJcblx0XHRcdFxyXG5cdFx0XHRpZiAod2lraXRleHRbaV0gPT09IFwie1wiICYmIHdpa2l0ZXh0W2krMV0gPT09IFwie1wiKSB7XHJcblx0XHRcdFx0aWYgKG51bVVuY2xvc2VkID09PSAwKSB7XHJcblx0XHRcdFx0XHRzdGFydElkeCA9IGkrMjtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0bnVtVW5jbG9zZWQgKz0gMjtcclxuXHRcdFx0XHRpKys7XHJcblx0XHRcdH0gZWxzZSBpZiAod2lraXRleHRbaV0gPT09IFwifVwiICYmIHdpa2l0ZXh0W2krMV0gPT09IFwifVwiKSB7XHJcblx0XHRcdFx0aWYgKG51bVVuY2xvc2VkID09PSAyKSB7XHJcblx0XHRcdFx0XHRlbmRJZHggPSBpO1xyXG5cdFx0XHRcdFx0cHJvY2Vzc1RlbXBsYXRlVGV4dChzdGFydElkeCwgZW5kSWR4KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0bnVtVW5jbG9zZWQgLT0gMjtcclxuXHRcdFx0XHRpKys7XHJcblx0XHRcdH0gZWxzZSBpZiAod2lraXRleHRbaV0gPT09IFwifFwiICYmIG51bVVuY2xvc2VkID4gMikge1xyXG5cdFx0XHRcdC8vIHN3YXAgb3V0IHBpcGVzIGluIG5lc3RlZCB0ZW1wbGF0ZXMgd2l0aCBcXHgwMSBjaGFyYWN0ZXJcclxuXHRcdFx0XHR3aWtpdGV4dCA9IHN0clJlcGxhY2VBdCh3aWtpdGV4dCwgaSxcIlxceDAxXCIpO1xyXG5cdFx0XHR9IGVsc2UgaWYgKCAvXjwhLS0vLnRlc3Qod2lraXRleHQuc2xpY2UoaSwgaSArIDQpKSApIHtcclxuXHRcdFx0XHRpbkNvbW1lbnQgPSB0cnVlO1xyXG5cdFx0XHRcdGkgKz0gMztcclxuXHRcdFx0fSBlbHNlIGlmICggL148bm93aWtpID8+Ly50ZXN0KHdpa2l0ZXh0LnNsaWNlKGksIGkgKyA5KSkgKSB7XHJcblx0XHRcdFx0aW5Ob3dpa2kgPSB0cnVlO1xyXG5cdFx0XHRcdGkgKz0gNztcclxuXHRcdFx0fSBcclxuXHJcblx0XHR9IGVsc2UgeyAvLyB3ZSBhcmUgaW4gYSBjb21tZW50IG9yIG5vd2lraVxyXG5cdFx0XHRpZiAod2lraXRleHRbaV0gPT09IFwifFwiKSB7XHJcblx0XHRcdFx0Ly8gc3dhcCBvdXQgcGlwZXMgd2l0aCBcXHgwMSBjaGFyYWN0ZXJcclxuXHRcdFx0XHR3aWtpdGV4dCA9IHN0clJlcGxhY2VBdCh3aWtpdGV4dCwgaSxcIlxceDAxXCIpO1xyXG5cdFx0XHR9IGVsc2UgaWYgKC9eLS0+Ly50ZXN0KHdpa2l0ZXh0LnNsaWNlKGksIGkgKyAzKSkpIHtcclxuXHRcdFx0XHRpbkNvbW1lbnQgPSBmYWxzZTtcclxuXHRcdFx0XHRpICs9IDI7XHJcblx0XHRcdH0gZWxzZSBpZiAoL148XFwvbm93aWtpID8+Ly50ZXN0KHdpa2l0ZXh0LnNsaWNlKGksIGkgKyAxMCkpKSB7XHJcblx0XHRcdFx0aW5Ob3dpa2kgPSBmYWxzZTtcclxuXHRcdFx0XHRpICs9IDg7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0fVxyXG5cdFxyXG5cdGlmICggcmVjdXJzaXZlICkge1xyXG5cdFx0dmFyIHN1YnRlbXBsYXRlcyA9IHJlc3VsdC5tYXAoZnVuY3Rpb24odGVtcGxhdGUpIHtcclxuXHRcdFx0cmV0dXJuIHRlbXBsYXRlLndpa2l0ZXh0LnNsaWNlKDIsLTIpO1xyXG5cdFx0fSlcclxuXHRcdFx0LmZpbHRlcihmdW5jdGlvbih0ZW1wbGF0ZVdpa2l0ZXh0KSB7XHJcblx0XHRcdFx0cmV0dXJuIC9cXHtcXHsuKlxcfVxcfS8udGVzdCh0ZW1wbGF0ZVdpa2l0ZXh0KTtcclxuXHRcdFx0fSlcclxuXHRcdFx0Lm1hcChmdW5jdGlvbih0ZW1wbGF0ZVdpa2l0ZXh0KSB7XHJcblx0XHRcdFx0cmV0dXJuIHBhcnNlVGVtcGxhdGVzKHRlbXBsYXRlV2lraXRleHQsIHRydWUpO1xyXG5cdFx0XHR9KTtcclxuXHRcdFxyXG5cdFx0cmV0dXJuIHJlc3VsdC5jb25jYXQuYXBwbHkocmVzdWx0LCBzdWJ0ZW1wbGF0ZXMpO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIHJlc3VsdDsgXHJcbn07IC8qIGVzbGludC1lbmFibGUgbm8tY29udHJvbC1yZWdleCAqL1xyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSB7VGVtcGxhdGV8VGVtcGxhdGVbXX0gdGVtcGxhdGVzXHJcbiAqIEByZXR1cm4ge1Byb21pc2U8VGVtcGxhdGVbXT59XHJcbiAqL1xyXG52YXIgZ2V0V2l0aFJlZGlyZWN0VG8gPSBmdW5jdGlvbih0ZW1wbGF0ZXMpIHtcclxuXHR2YXIgdGVtcGxhdGVzQXJyYXkgPSBBcnJheS5pc0FycmF5KHRlbXBsYXRlcykgPyB0ZW1wbGF0ZXMgOiBbdGVtcGxhdGVzXTtcclxuXHJcblx0cmV0dXJuIEFQSS5nZXQoe1xyXG5cdFx0XCJhY3Rpb25cIjogXCJxdWVyeVwiLFxyXG5cdFx0XCJmb3JtYXRcIjogXCJqc29uXCIsXHJcblx0XHRcInRpdGxlc1wiOiB0ZW1wbGF0ZXNBcnJheS5tYXAodGVtcGxhdGUgPT4gdGVtcGxhdGUuZ2V0VGl0bGUoKS5nZXRQcmVmaXhlZFRleHQoKSksXHJcblx0XHRcInJlZGlyZWN0c1wiOiAxXHJcblx0fSkudGhlbihmdW5jdGlvbihyZXN1bHQpIHtcclxuXHRcdGlmICggIXJlc3VsdCB8fCAhcmVzdWx0LnF1ZXJ5ICkge1xyXG5cdFx0XHRyZXR1cm4gJC5EZWZlcnJlZCgpLnJlamVjdChcIkVtcHR5IHJlc3BvbnNlXCIpO1xyXG5cdFx0fVxyXG5cdFx0aWYgKCByZXN1bHQucXVlcnkucmVkaXJlY3RzICkge1xyXG5cdFx0XHRyZXN1bHQucXVlcnkucmVkaXJlY3RzLmZvckVhY2goZnVuY3Rpb24ocmVkaXJlY3QpIHtcclxuXHRcdFx0XHR2YXIgaSA9IHRlbXBsYXRlc0FycmF5LmZpbmRJbmRleCh0ZW1wbGF0ZSA9PiB0ZW1wbGF0ZS5nZXRUaXRsZSgpLmdldFByZWZpeGVkVGV4dCgpID09PSByZWRpcmVjdC5mcm9tKTtcclxuXHRcdFx0XHRpZiAoaSAhPT0gLTEpIHtcclxuXHRcdFx0XHRcdHRlbXBsYXRlc0FycmF5W2ldLnJlZGlyZWN0c1RvID0gbXcuVGl0bGUubmV3RnJvbVRleHQocmVkaXJlY3QudG8pO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdGVtcGxhdGVzQXJyYXk7XHJcblx0fSk7XHJcbn07XHJcblxyXG5UZW1wbGF0ZS5wcm90b3R5cGUuZ2V0RGF0YUZvclBhcmFtID0gZnVuY3Rpb24oa2V5LCBwYXJhTmFtZSkge1xyXG5cdGlmICggIXRoaXMucGFyYW1EYXRhICkge1xyXG5cdFx0cmV0dXJuIG51bGw7XHJcblx0fVxyXG5cdC8vIElmIGFsaWFzLCBzd2l0Y2ggZnJvbSBhbGlhcyB0byBwcmVmZXJyZWQgcGFyYW1ldGVyIG5hbWVcclxuXHR2YXIgcGFyYSA9IHRoaXMucGFyYW1BbGlhc2VzW3BhcmFOYW1lXSB8fCBwYXJhTmFtZTtcdFxyXG5cdGlmICggIXRoaXMucGFyYW1EYXRhW3BhcmFdICkge1xyXG5cdFx0cmV0dXJuO1xyXG5cdH1cclxuXHRcclxuXHR2YXIgZGF0YSA9IHRoaXMucGFyYW1EYXRhW3BhcmFdW2tleV07XHJcblx0Ly8gRGF0YSBtaWdodCBhY3R1YWxseSBiZSBhbiBvYmplY3Qgd2l0aCBrZXkgXCJlblwiXHJcblx0aWYgKCBkYXRhICYmIGRhdGEuZW4gJiYgIUFycmF5LmlzQXJyYXkoZGF0YSkgKSB7XHJcblx0XHRyZXR1cm4gZGF0YS5lbjtcclxuXHR9XHJcblx0cmV0dXJuIGRhdGE7XHJcbn07XHJcblxyXG5UZW1wbGF0ZS5wcm90b3R5cGUuc2V0UGFyYW1EYXRhQW5kU3VnZ2VzdGlvbnMgPSBmdW5jdGlvbigpIHtcclxuXHR2YXIgc2VsZiA9IHRoaXM7XHJcblx0dmFyIHBhcmFtRGF0YVNldCA9ICQuRGVmZXJyZWQoKTtcclxuXHRcclxuXHRpZiAoIHNlbGYucGFyYW1EYXRhICkgeyByZXR1cm4gcGFyYW1EYXRhU2V0LnJlc29sdmUoKTsgfVxyXG4gICAgXHJcblx0dmFyIHByZWZpeGVkVGV4dCA9IHNlbGYucmVkaXJlY3RzVG9cclxuXHRcdD8gc2VsZi5yZWRpcmVjdHNUby5nZXRQcmVmaXhlZFRleHQoKVxyXG5cdFx0OiBzZWxmLmdldFRpdGxlKCkuZ2V0UHJlZml4ZWRUZXh0KCk7XHJcblxyXG5cdHZhciBjYWNoZWRJbmZvID0gY2FjaGUucmVhZChwcmVmaXhlZFRleHQgKyBcIi1wYXJhbXNcIik7XHJcblx0XHJcblx0aWYgKFxyXG5cdFx0Y2FjaGVkSW5mbyAmJlxyXG5cdFx0Y2FjaGVkSW5mby52YWx1ZSAmJlxyXG5cdFx0Y2FjaGVkSW5mby5zdGFsZURhdGUgJiZcclxuXHRcdGNhY2hlZEluZm8udmFsdWUucGFyYW1EYXRhICE9IG51bGwgJiZcclxuXHRcdGNhY2hlZEluZm8udmFsdWUucGFyYW1ldGVyU3VnZ2VzdGlvbnMgIT0gbnVsbCAmJlxyXG5cdFx0Y2FjaGVkSW5mby52YWx1ZS5wYXJhbUFsaWFzZXMgIT0gbnVsbFxyXG5cdCkge1xyXG5cdFx0c2VsZi5ub3RlbXBsYXRlZGF0YSA9IGNhY2hlZEluZm8udmFsdWUubm90ZW1wbGF0ZWRhdGE7XHJcblx0XHRzZWxmLnBhcmFtRGF0YSA9IGNhY2hlZEluZm8udmFsdWUucGFyYW1EYXRhO1xyXG5cdFx0c2VsZi5wYXJhbWV0ZXJTdWdnZXN0aW9ucyA9IGNhY2hlZEluZm8udmFsdWUucGFyYW1ldGVyU3VnZ2VzdGlvbnM7XHJcblx0XHRzZWxmLnBhcmFtQWxpYXNlcyA9IGNhY2hlZEluZm8udmFsdWUucGFyYW1BbGlhc2VzO1xyXG5cdFx0XHJcblx0XHRwYXJhbURhdGFTZXQucmVzb2x2ZSgpO1xyXG5cdFx0aWYgKCAhaXNBZnRlckRhdGUoY2FjaGVkSW5mby5zdGFsZURhdGUpICkge1xyXG5cdFx0XHQvLyBKdXN0IHVzZSB0aGUgY2FjaGVkIGRhdGFcclxuXHRcdFx0cmV0dXJuIHBhcmFtRGF0YVNldDtcclxuXHRcdH0gLy8gZWxzZTogVXNlIHRoZSBjYWNoZSBkYXRhIGZvciBub3csIGJ1dCBhbHNvIGZldGNoIG5ldyBkYXRhIGZyb20gQVBJXHJcblx0fVxyXG5cdFxyXG5cdEFQSS5nZXQoe1xyXG5cdFx0YWN0aW9uOiBcInRlbXBsYXRlZGF0YVwiLFxyXG5cdFx0dGl0bGVzOiBwcmVmaXhlZFRleHQsXHJcblx0XHRyZWRpcmVjdHM6IDEsXHJcblx0XHRpbmNsdWRlTWlzc2luZ1RpdGxlczogMVxyXG5cdH0pXHJcblx0XHQudGhlbihcclxuXHRcdFx0ZnVuY3Rpb24ocmVzcG9uc2UpIHsgcmV0dXJuIHJlc3BvbnNlOyB9LFxyXG5cdFx0XHRmdW5jdGlvbigvKmVycm9yKi8pIHsgcmV0dXJuIG51bGw7IH0gLy8gSWdub3JlIGVycm9ycywgd2lsbCB1c2UgZGVmYXVsdCBkYXRhXHJcblx0XHQpXHJcblx0XHQudGhlbiggZnVuY3Rpb24ocmVzdWx0KSB7XHJcblx0XHQvLyBGaWd1cmUgb3V0IHBhZ2UgaWQgKGJlYWN1c2UgYWN0aW9uPXRlbXBsYXRlZGF0YSBkb2Vzbid0IGhhdmUgYW4gaW5kZXhwYWdlaWRzIG9wdGlvbilcclxuXHRcdFx0dmFyIGlkID0gcmVzdWx0ICYmICQubWFwKHJlc3VsdC5wYWdlcywgZnVuY3Rpb24oIF92YWx1ZSwga2V5ICkgeyByZXR1cm4ga2V5OyB9KTtcclxuXHRcdFxyXG5cdFx0XHRpZiAoICFyZXN1bHQgfHwgIXJlc3VsdC5wYWdlc1tpZF0gfHwgcmVzdWx0LnBhZ2VzW2lkXS5ub3RlbXBsYXRlZGF0YSB8fCAhcmVzdWx0LnBhZ2VzW2lkXS5wYXJhbXMgKSB7XHJcblx0XHRcdC8vIE5vIFRlbXBsYXRlRGF0YSwgc28gdXNlIGRlZmF1bHRzIChndWVzc2VzKVxyXG5cdFx0XHRcdHNlbGYubm90ZW1wbGF0ZWRhdGEgPSB0cnVlO1xyXG5cdFx0XHRcdHNlbGYudGVtcGxhdGVkYXRhQXBpRXJyb3IgPSAhcmVzdWx0O1xyXG5cdFx0XHRcdHNlbGYucGFyYW1EYXRhID0gY29uZmlnLmRlZmF1bHRQYXJhbWV0ZXJEYXRhO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHNlbGYucGFyYW1EYXRhID0gcmVzdWx0LnBhZ2VzW2lkXS5wYXJhbXM7XHJcblx0XHRcdH1cclxuICAgICAgICBcclxuXHRcdFx0c2VsZi5wYXJhbUFsaWFzZXMgPSB7fTtcclxuXHRcdFx0JC5lYWNoKHNlbGYucGFyYW1EYXRhLCBmdW5jdGlvbihwYXJhTmFtZSwgcGFyYURhdGEpIHtcclxuXHRcdFx0XHQvLyBFeHRyYWN0IGFsaWFzZXMgZm9yIGVhc2llciByZWZlcmVuY2UgbGF0ZXIgb25cclxuXHRcdFx0XHRpZiAoIHBhcmFEYXRhLmFsaWFzZXMgJiYgcGFyYURhdGEuYWxpYXNlcy5sZW5ndGggKSB7XHJcblx0XHRcdFx0XHRwYXJhRGF0YS5hbGlhc2VzLmZvckVhY2goZnVuY3Rpb24oYWxpYXMpe1xyXG5cdFx0XHRcdFx0XHRzZWxmLnBhcmFtQWxpYXNlc1thbGlhc10gPSBwYXJhTmFtZTtcclxuXHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHQvLyBFeHRyYWN0IGFsbG93ZWQgdmFsdWVzIGFycmF5IGZyb20gZGVzY3JpcHRpb25cclxuXHRcdFx0XHRpZiAoIHBhcmFEYXRhLmRlc2NyaXB0aW9uICYmIC9cXFsuKicuKz8nLio/XFxdLy50ZXN0KHBhcmFEYXRhLmRlc2NyaXB0aW9uLmVuKSApIHtcclxuXHRcdFx0XHRcdHRyeSB7XHJcblx0XHRcdFx0XHRcdHZhciBhbGxvd2VkVmFscyA9IEpTT04ucGFyc2UoXHJcblx0XHRcdFx0XHRcdFx0cGFyYURhdGEuZGVzY3JpcHRpb24uZW5cclxuXHRcdFx0XHRcdFx0XHRcdC5yZXBsYWNlKC9eLipcXFsvLFwiW1wiKVxyXG5cdFx0XHRcdFx0XHRcdFx0LnJlcGxhY2UoL1wiL2csIFwiXFxcXFxcXCJcIilcclxuXHRcdFx0XHRcdFx0XHRcdC5yZXBsYWNlKC8nL2csIFwiXFxcIlwiKVxyXG5cdFx0XHRcdFx0XHRcdFx0LnJlcGxhY2UoLyxcXHMqXS8sIFwiXVwiKVxyXG5cdFx0XHRcdFx0XHRcdFx0LnJlcGxhY2UoL10uKiQvLCBcIl1cIilcclxuXHRcdFx0XHRcdFx0KTtcclxuXHRcdFx0XHRcdFx0c2VsZi5wYXJhbURhdGFbcGFyYU5hbWVdLmFsbG93ZWRWYWx1ZXMgPSBhbGxvd2VkVmFscztcclxuXHRcdFx0XHRcdH0gY2F0Y2goZSkge1xyXG5cdFx0XHRcdFx0XHRjb25zb2xlLndhcm4oXCJbUmF0ZXJdIENvdWxkIG5vdCBwYXJzZSBhbGxvd2VkIHZhbHVlcyBpbiBkZXNjcmlwdGlvbjpcXG4gIFwiK1xyXG5cdFx0XHRcdFx0cGFyYURhdGEuZGVzY3JpcHRpb24uZW4gKyBcIlxcbiBDaGVjayBUZW1wbGF0ZURhdGEgZm9yIHBhcmFtZXRlciB8XCIgKyBwYXJhTmFtZSArXHJcblx0XHRcdFx0XHRcIj0gaW4gXCIgKyBzZWxmLmdldFRpdGxlKCkuZ2V0UHJlZml4ZWRUZXh0KCkpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHQvLyBNYWtlIHN1cmUgcmVxdWlyZWQvc3VnZ2VzdGVkIHBhcmFtZXRlcnMgYXJlIHByZXNlbnRcclxuXHRcdFx0XHRpZiAoIChwYXJhRGF0YS5yZXF1aXJlZCB8fCBwYXJhRGF0YS5zdWdnZXN0ZWQpICYmICFzZWxmLmdldFBhcmFtKHBhcmFOYW1lKSApIHtcclxuXHRcdFx0XHQvLyBDaGVjayBpZiBhbHJlYWR5IHByZXNlbnQgaW4gYW4gYWxpYXMsIGlmIGFueVxyXG5cdFx0XHRcdFx0aWYgKCBwYXJhRGF0YS5hbGlhc2VzLmxlbmd0aCApIHtcclxuXHRcdFx0XHRcdFx0dmFyIGFsaWFzZXMgPSBzZWxmLnBhcmFtZXRlcnMuZmlsdGVyKHAgPT4ge1xyXG5cdFx0XHRcdFx0XHRcdHZhciBpc0FsaWFzID0gcGFyYURhdGEuYWxpYXNlcy5pbmNsdWRlcyhwLm5hbWUpO1xyXG5cdFx0XHRcdFx0XHRcdHZhciBpc0VtcHR5ID0gIXAudmFsO1xyXG5cdFx0XHRcdFx0XHRcdHJldHVybiBpc0FsaWFzICYmICFpc0VtcHR5O1xyXG5cdFx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHRcdFx0aWYgKCBhbGlhc2VzLmxlbmd0aCApIHtcclxuXHRcdFx0XHRcdFx0Ly8gQXQgbGVhc3Qgb25lIG5vbi1lbXB0eSBhbGlhcywgc28gZG8gbm90aGluZ1xyXG5cdFx0XHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0Ly8gTm8gbm9uLWVtcHR5IGFsaWFzZXMsIHNvIHNldCBwYXJhbWV0ZXIgdG8gZWl0aGVyIHRoZSBhdXRvdmF1bGUsIG9yXHJcblx0XHRcdFx0XHQvLyBhbiBlbXB0eSBzdHJpbmcgKHdpdGhvdXQgdG91Y2hpbmcsIHVubGVzcyBpdCBpcyBhIHJlcXVpcmVkIHBhcmFtZXRlcilcclxuXHRcdFx0XHRcdHNlbGYucGFyYW1ldGVycy5wdXNoKHtcclxuXHRcdFx0XHRcdFx0bmFtZTpwYXJhTmFtZSxcclxuXHRcdFx0XHRcdFx0dmFsdWU6IHBhcmFEYXRhLmF1dG92YWx1ZSB8fCBcIlwiLFxyXG5cdFx0XHRcdFx0XHRhdXRvZmlsbGVkOiB0cnVlXHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pO1xyXG5cdFx0XHJcblx0XHRcdC8vIE1ha2Ugc3VnZ2VzdGlvbnMgZm9yIGNvbWJvYm94XHJcblx0XHRcdHZhciBhbGxQYXJhbXNBcnJheSA9ICggIXNlbGYubm90ZW1wbGF0ZWRhdGEgJiYgcmVzdWx0LnBhZ2VzW2lkXS5wYXJhbU9yZGVyICkgfHxcclxuXHRcdFx0JC5tYXAoc2VsZi5wYXJhbURhdGEsIGZ1bmN0aW9uKF92YWwsIGtleSl7XHJcblx0XHRcdFx0cmV0dXJuIGtleTtcclxuXHRcdFx0fSk7XHJcblx0XHRcdHNlbGYucGFyYW1ldGVyU3VnZ2VzdGlvbnMgPSBhbGxQYXJhbXNBcnJheS5maWx0ZXIoZnVuY3Rpb24ocGFyYW1OYW1lKSB7XHJcblx0XHRcdFx0cmV0dXJuICggcGFyYW1OYW1lICYmIHBhcmFtTmFtZSAhPT0gXCJjbGFzc1wiICYmIHBhcmFtTmFtZSAhPT0gXCJpbXBvcnRhbmNlXCIgKTtcclxuXHRcdFx0fSlcclxuXHRcdFx0XHQubWFwKGZ1bmN0aW9uKHBhcmFtTmFtZSkge1xyXG5cdFx0XHRcdFx0dmFyIG9wdGlvbk9iamVjdCA9IHtkYXRhOiBwYXJhbU5hbWV9O1xyXG5cdFx0XHRcdFx0dmFyIGxhYmVsID0gc2VsZi5nZXREYXRhRm9yUGFyYW0obGFiZWwsIHBhcmFtTmFtZSk7XHJcblx0XHRcdFx0XHRpZiAoIGxhYmVsICkge1xyXG5cdFx0XHRcdFx0XHRvcHRpb25PYmplY3QubGFiZWwgPSBsYWJlbCArIFwiICh8XCIgKyBwYXJhbU5hbWUgKyBcIj0pXCI7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRyZXR1cm4gb3B0aW9uT2JqZWN0O1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHJcblx0XHRcdGlmICggc2VsZi50ZW1wbGF0ZWRhdGFBcGlFcnJvciApIHtcclxuXHRcdFx0XHQvLyBEb24ndCBzYXZlIGRlZmF1bHRzL2d1ZXNzZXMgdG8gY2FjaGU7XHJcblx0XHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHRcdH1cclxuXHRcdFxyXG5cdFx0XHRjYWNoZS53cml0ZShwcmVmaXhlZFRleHQgKyBcIi1wYXJhbXNcIiwge1xyXG5cdFx0XHRcdG5vdGVtcGxhdGVkYXRhOiBzZWxmLm5vdGVtcGxhdGVkYXRhLFxyXG5cdFx0XHRcdHBhcmFtRGF0YTogc2VsZi5wYXJhbURhdGEsXHJcblx0XHRcdFx0cGFyYW1ldGVyU3VnZ2VzdGlvbnM6IHNlbGYucGFyYW1ldGVyU3VnZ2VzdGlvbnMsXHJcblx0XHRcdFx0cGFyYW1BbGlhc2VzOiBzZWxmLnBhcmFtQWxpYXNlc1xyXG5cdFx0XHR9LFx0MVxyXG5cdFx0XHQpO1xyXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdH0pXHJcblx0XHQudGhlbihcclxuXHRcdFx0cGFyYW1EYXRhU2V0LnJlc29sdmUsXHJcblx0XHRcdHBhcmFtRGF0YVNldC5yZWplY3RcclxuXHRcdCk7XHJcblx0XHJcblx0cmV0dXJuIHBhcmFtRGF0YVNldDtcdFxyXG59O1xyXG5cclxuZXhwb3J0IHtUZW1wbGF0ZSwgcGFyc2VUZW1wbGF0ZXMsIGdldFdpdGhSZWRpcmVjdFRvfTsiLCJpbXBvcnQgY29uZmlnIGZyb20gXCIuL2NvbmZpZ1wiO1xyXG5pbXBvcnQge0FQSSwgbWFrZUVycm9yTXNnfSBmcm9tIFwiLi91dGlsXCI7XHJcbmltcG9ydCBzZXR1cFJhdGVyIGZyb20gXCIuL3NldHVwXCI7XHJcblxyXG52YXIgYXV0b1N0YXJ0ID0gZnVuY3Rpb24gYXV0b1N0YXJ0KCkge1xyXG5cdGlmICggd2luZG93LnJhdGVyX2F1dG9zdGFydE5hbWVzcGFjZXMgPT0gbnVsbCB8fCBjb25maWcubXcud2dJc01haW5QYWdlICkge1xyXG5cdFx0cmV0dXJuO1xyXG5cdH1cclxuXHRcclxuXHR2YXIgYXV0b3N0YXJ0TmFtZXNwYWNlcyA9ICggJC5pc0FycmF5KHdpbmRvdy5yYXRlcl9hdXRvc3RhcnROYW1lc3BhY2VzKSApID8gd2luZG93LnJhdGVyX2F1dG9zdGFydE5hbWVzcGFjZXMgOiBbd2luZG93LnJhdGVyX2F1dG9zdGFydE5hbWVzcGFjZXNdO1xyXG5cdFxyXG5cdGlmICggLTEgPT09IGF1dG9zdGFydE5hbWVzcGFjZXMuaW5kZXhPZihjb25maWcubXcud2dOYW1lc3BhY2VOdW1iZXIpICkge1xyXG5cdFx0cmV0dXJuO1xyXG5cdH1cclxuXHRcclxuXHRpZiAoIC8oPzpcXD98JikoPzphY3Rpb258ZGlmZnxvbGRpZCk9Ly50ZXN0KHdpbmRvdy5sb2NhdGlvbi5ocmVmKSApIHtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblx0XHJcblx0Ly8gQ2hlY2sgaWYgdGFsayBwYWdlIGV4aXN0c1xyXG5cdGlmICggJChcIiNjYS10YWxrLm5ld1wiKS5sZW5ndGggKSB7XHJcblx0XHRzZXR1cFJhdGVyKCk7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cdFxyXG5cdHZhciB0aGlzUGFnZSA9IG13LlRpdGxlLm5ld0Zyb21UZXh0KGNvbmZpZy5tdy53Z1BhZ2VOYW1lKTtcclxuXHR2YXIgdGFsa1BhZ2UgPSB0aGlzUGFnZSAmJiB0aGlzUGFnZS5nZXRUYWxrUGFnZSgpO1xyXG5cdGlmICghdGFsa1BhZ2UpIHtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblxyXG5cdC8qIENoZWNrIHRlbXBsYXRlcyBwcmVzZW50IG9uIHRhbGsgcGFnZS4gRmV0Y2hlcyBpbmRpcmVjdGx5IHRyYW5zY2x1ZGVkIHRlbXBsYXRlcywgc28gd2lsbCBmaW5kXHJcblx0XHRUZW1wbGF0ZTpXUEJhbm5lck1ldGEgKGFuZCBpdHMgc3VidGVtcGxhdGVzKS4gQnV0IHNvbWUgYmFubmVycyBzdWNoIGFzIE1JTEhJU1QgZG9uJ3QgdXNlIHRoYXRcclxuXHRcdG1ldGEgdGVtcGxhdGUsIHNvIHdlIGFsc28gaGF2ZSB0byBjaGVjayBmb3IgdGVtcGxhdGUgdGl0bGVzIGNvbnRhaW5nICdXaWtpUHJvamVjdCdcclxuXHQqL1xyXG5cdEFQSS5nZXQoe1xyXG5cdFx0YWN0aW9uOiBcInF1ZXJ5XCIsXHJcblx0XHRmb3JtYXQ6IFwianNvblwiLFxyXG5cdFx0cHJvcDogXCJ0ZW1wbGF0ZXNcIixcclxuXHRcdHRpdGxlczogdGFsa1BhZ2UuZ2V0UHJlZml4ZWRUZXh0KCksXHJcblx0XHR0bG5hbWVzcGFjZTogXCIxMFwiLFxyXG5cdFx0dGxsaW1pdDogXCI1MDBcIixcclxuXHRcdGluZGV4cGFnZWlkczogMVxyXG5cdH0pXHJcblx0XHQuZG9uZShmdW5jdGlvbihyZXN1bHQpIHtcclxuXHRcdFx0dmFyIGlkID0gcmVzdWx0LnF1ZXJ5LnBhZ2VpZHM7XHJcblx0XHRcdHZhciB0ZW1wbGF0ZXMgPSByZXN1bHQucXVlcnkucGFnZXNbaWRdLnRlbXBsYXRlcztcclxuXHRcdFxyXG5cdFx0XHRpZiAoICF0ZW1wbGF0ZXMgKSB7XHJcblx0XHRcdFx0c2V0dXBSYXRlcigpO1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cdFx0XHJcblx0XHRcdHZhciBoYXNXaWtpcHJvamVjdCA9IHRlbXBsYXRlcy5zb21lKHRlbXBsYXRlID0+IC8oV2lraVByb2plY3R8V1BCYW5uZXIpLy50ZXN0KHRlbXBsYXRlLnRpdGxlKSk7XHJcblx0XHRcclxuXHRcdFx0aWYgKCAhaGFzV2lraXByb2plY3QgKSB7XHJcblx0XHRcdFx0c2V0dXBSYXRlcigpO1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cdFx0XHJcblx0XHR9KVxyXG5cdFx0LmZhaWwoZnVuY3Rpb24oY29kZSwganF4aHIpIHtcclxuXHRcdC8vIFNpbGVudGx5IGlnbm9yZSBmYWlsdXJlcyAoanVzdCBsb2cgdG8gY29uc29sZSlcclxuXHRcdFx0Y29uc29sZS53YXJuKFxyXG5cdFx0XHRcdFwiW1JhdGVyXSBFcnJvciB3aGlsZSBjaGVja2luZyB3aGV0aGVyIHRvIGF1dG9zdGFydC5cIiArXHJcblx0XHRcdCggY29kZSA9PSBudWxsICkgPyBcIlwiIDogXCIgXCIgKyBtYWtlRXJyb3JNc2coY29kZSwganF4aHIpXHJcblx0XHRcdCk7XHJcblx0XHR9KTtcclxuXHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBhdXRvU3RhcnQ7IiwiaW1wb3J0IHtpc0FmdGVyRGF0ZX0gZnJvbSBcIi4vdXRpbFwiO1xyXG5cclxuLyoqIHdyaXRlXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBrZXlcclxuICogQHBhcmFtIHtBcnJheXxPYmplY3R9IHZhbFxyXG4gKiBAcGFyYW0ge051bWJlcn0gc3RhbGVEYXlzIE51bWJlciBvZiBkYXlzIGFmdGVyIHdoaWNoIHRoZSBkYXRhIGJlY29tZXMgc3RhbGUgKHVzYWJsZSwgYnV0IHNob3VsZFxyXG4gKiAgYmUgdXBkYXRlZCBmb3IgbmV4dCB0aW1lKS5cclxuICogQHBhcmFtIHtOdW1iZXJ9IGV4cGlyeURheXMgTnVtYmVyIG9mIGRheXMgYWZ0ZXIgd2hpY2ggdGhlIGNhY2hlZCBkYXRhIG1heSBiZSBkZWxldGVkLlxyXG4gKi9cclxudmFyIHdyaXRlID0gZnVuY3Rpb24oa2V5LCB2YWwsIHN0YWxlRGF5cywgZXhwaXJ5RGF5cykge1xyXG5cdHRyeSB7XHJcblx0XHR2YXIgZGVmYXVsdFN0YWxlRGF5cyA9IDE7XHJcblx0XHR2YXIgZGVmYXVsdEV4cGlyeURheXMgPSAzMDtcclxuXHRcdHZhciBtaWxsaXNlY29uZHNQZXJEYXkgPSAyNCo2MCo2MCoxMDAwO1xyXG5cclxuXHRcdHZhciBzdGFsZUR1cmF0aW9uID0gKHN0YWxlRGF5cyB8fCBkZWZhdWx0U3RhbGVEYXlzKSptaWxsaXNlY29uZHNQZXJEYXk7XHJcblx0XHR2YXIgZXhwaXJ5RHVyYXRpb24gPSAoZXhwaXJ5RGF5cyB8fCBkZWZhdWx0RXhwaXJ5RGF5cykqbWlsbGlzZWNvbmRzUGVyRGF5O1xyXG5cdFx0XHJcblx0XHR2YXIgc3RyaW5nVmFsID0gSlNPTi5zdHJpbmdpZnkoe1xyXG5cdFx0XHR2YWx1ZTogdmFsLFxyXG5cdFx0XHRzdGFsZURhdGU6IG5ldyBEYXRlKERhdGUubm93KCkgKyBzdGFsZUR1cmF0aW9uKS50b0lTT1N0cmluZygpLFxyXG5cdFx0XHRleHBpcnlEYXRlOiBuZXcgRGF0ZShEYXRlLm5vdygpICsgZXhwaXJ5RHVyYXRpb24pLnRvSVNPU3RyaW5nKClcclxuXHRcdH0pO1xyXG5cdFx0bG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJSYXRlci1cIitrZXksIHN0cmluZ1ZhbCk7XHJcblx0fSAgY2F0Y2goZSkge30gLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1lbXB0eVxyXG59O1xyXG4vKiogcmVhZFxyXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5XHJcbiAqIEByZXR1cm5zIHtBcnJheXxPYmplY3R8U3RyaW5nfE51bGx9IENhY2hlZCBhcnJheSBvciBvYmplY3QsIG9yIGVtcHR5IHN0cmluZyBpZiBub3QgeWV0IGNhY2hlZCxcclxuICogICAgICAgICAgb3IgbnVsbCBpZiB0aGVyZSB3YXMgZXJyb3IuXHJcbiAqL1xyXG52YXIgcmVhZCA9IGZ1bmN0aW9uKGtleSkge1xyXG5cdHZhciB2YWw7XHJcblx0dHJ5IHtcclxuXHRcdHZhciBzdHJpbmdWYWwgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcIlJhdGVyLVwiK2tleSk7XHJcblx0XHRpZiAoIHN0cmluZ1ZhbCAhPT0gXCJcIiApIHtcclxuXHRcdFx0dmFsID0gSlNPTi5wYXJzZShzdHJpbmdWYWwpO1xyXG5cdFx0fVxyXG5cdH0gIGNhdGNoKGUpIHtcclxuXHRcdGNvbnNvbGUubG9nKFwiW1JhdGVyXSBlcnJvciByZWFkaW5nIFwiICsga2V5ICsgXCIgZnJvbSBsb2NhbFN0b3JhZ2UgY2FjaGU6XCIpO1xyXG5cdFx0Y29uc29sZS5sb2coXHJcblx0XHRcdFwiXFx0XCIgKyBlLm5hbWUgKyBcIiBtZXNzYWdlOiBcIiArIGUubWVzc2FnZSArXHJcblx0XHRcdCggZS5hdCA/IFwiIGF0OiBcIiArIGUuYXQgOiBcIlwiKSArXHJcblx0XHRcdCggZS50ZXh0ID8gXCIgdGV4dDogXCIgKyBlLnRleHQgOiBcIlwiKVxyXG5cdFx0KTtcclxuXHR9XHJcblx0cmV0dXJuIHZhbCB8fCBudWxsO1xyXG59O1xyXG52YXIgY2xlYXJJdGVtSWZJbnZhbGlkID0gZnVuY3Rpb24oa2V5KSB7XHJcblx0dmFyIGlzUmF0ZXJLZXkgPSBrZXkuaW5kZXhPZihcIlJhdGVyLVwiKSA9PT0gMDtcclxuXHRpZiAoICFpc1JhdGVyS2V5ICkge1xyXG5cdFx0cmV0dXJuO1xyXG5cdH1cclxuXHR2YXIgaXRlbSA9IHJlYWQoa2V5LnJlcGxhY2UoXCJSYXRlci1cIixcIlwiKSk7XHJcblx0dmFyIGlzSW52YWxpZCA9ICFpdGVtIHx8ICFpdGVtLmV4cGlyeURhdGUgfHwgaXNBZnRlckRhdGUoaXRlbS5leHBpcnlEYXRlKTtcclxuXHRpZiAoIGlzSW52YWxpZCApIHtcclxuXHRcdGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKGtleSk7XHJcblx0fVxyXG59O1xyXG52YXIgY2xlYXJJbnZhbGlkSXRlbXMgPSBmdW5jdGlvbigpIHtcclxuXHRmb3IgKHZhciBpID0gMDsgaSA8IGxvY2FsU3RvcmFnZS5sZW5ndGg7IGkrKykge1xyXG5cdFx0c2V0VGltZW91dChjbGVhckl0ZW1JZkludmFsaWQsIDEwMCwgbG9jYWxTdG9yYWdlLmtleShpKSk7XHJcblx0fVxyXG59O1xyXG5cclxuZXhwb3J0IHsgd3JpdGUsIHJlYWQsIGNsZWFySXRlbUlmSW52YWxpZCwgY2xlYXJJbnZhbGlkSXRlbXMgfTsiLCIvLyBBIGdsb2JhbCBvYmplY3QgdGhhdCBzdG9yZXMgYWxsIHRoZSBwYWdlIGFuZCB1c2VyIGNvbmZpZ3VyYXRpb24gYW5kIHNldHRpbmdzXHJcbnZhciBjb25maWcgPSB7fTtcclxuLy8gU2NyaXB0IGluZm9cclxuY29uZmlnLnNjcmlwdCA9IHtcclxuXHQvLyBBZHZlcnQgdG8gYXBwZW5kIHRvIGVkaXQgc3VtbWFyaWVzXHJcblx0YWR2ZXJ0OiAgXCIgKFtbVXNlcjpFdmFkMzcvcmF0ZXIuanN8UmF0ZXJdXSlcIixcclxuXHR2ZXJzaW9uOiBcIjEuMy4xXCJcclxufTtcclxuLy8gUHJlZmVyZW5jZXM6IGdsb2JhbHMgdmFycyBhZGRlZCB0byB1c2VycycgY29tbW9uLmpzLCBvciBzZXQgdG8gZGVmYXVsdHMgaWYgdW5kZWZpbmVkXHJcbmNvbmZpZy5wcmVmcyA9IHtcclxuXHR3YXRjaGxpc3Q6IHdpbmRvdy5yYXRlcl93YXRjaGxpc3QgfHwgXCJwcmVmZXJlbmNlc1wiXHJcbn07XHJcbi8vIE1lZGlhV2lraSBjb25maWd1cmF0aW9uIHZhbHVlc1xyXG5jb25maWcubXcgPSBtdy5jb25maWcuZ2V0KCBbXHJcblx0XCJza2luXCIsXHJcblx0XCJ3Z1BhZ2VOYW1lXCIsXHJcblx0XCJ3Z05hbWVzcGFjZU51bWJlclwiLFxyXG5cdFwid2dVc2VyTmFtZVwiLFxyXG5cdFwid2dGb3JtYXR0ZWROYW1lc3BhY2VzXCIsXHJcblx0XCJ3Z01vbnRoTmFtZXNcIixcclxuXHRcIndnUmV2aXNpb25JZFwiLFxyXG5cdFwid2dTY3JpcHRQYXRoXCIsXHJcblx0XCJ3Z1NlcnZlclwiLFxyXG5cdFwid2dDYXRlZ29yaWVzXCIsXHJcblx0XCJ3Z0lzTWFpblBhZ2VcIlxyXG5dICk7XHJcblxyXG5jb25maWcucmVnZXggPSB7IC8qIGVzbGludC1kaXNhYmxlIG5vLXVzZWxlc3MtZXNjYXBlICovXHJcblx0Ly8gUGF0dGVybiB0byBmaW5kIHRlbXBsYXRlcywgd2hpY2ggbWF5IGNvbnRhaW4gb3RoZXIgdGVtcGxhdGVzXHJcblx0dGVtcGxhdGU6XHRcdC9cXHtcXHtcXHMqKFteI1xce1xcc10uKz8pXFxzKihcXHwoPzoufFxcbikqPyg/Oig/Olxce1xceyg/Oi58XFxuKSo/KD86KD86XFx7XFx7KD86LnxcXG4pKj9cXH1cXH0pKD86LnxcXG4pKj8pKj9cXH1cXH0pKD86LnxcXG4pKj8pKnwpXFx9XFx9XFxuPy9nLFxyXG5cdC8vIFBhdHRlcm4gdG8gZmluZCBgfHBhcmFtPXZhbHVlYCBvciBgfHZhbHVlYCwgd2hlcmUgYHZhbHVlYCBjYW4gb25seSBjb250YWluIGEgcGlwZVxyXG5cdC8vIGlmIHdpdGhpbiBzcXVhcmUgYnJhY2tldHMgKGkuZS4gd2lraWxpbmtzKSBvciBicmFjZXMgKGkuZS4gdGVtcGxhdGVzKVxyXG5cdHRlbXBsYXRlUGFyYW1zOlx0L1xcfCg/ISg/Oltee10rfXxbXlxcW10rXSkpKD86LnxcXHMpKj8oPz0oPzpcXHx8JCkoPyEoPzpbXntdK318W15cXFtdK10pKSkvZ1xyXG59OyAvKiBlc2xpbnQtZW5hYmxlIG5vLXVzZWxlc3MtZXNjYXBlICovXHJcbmNvbmZpZy5kZWZlcnJlZCA9IHt9O1xyXG5jb25maWcuYmFubmVyRGVmYXVsdHMgPSB7XHJcblx0Y2xhc3NlczogW1xyXG5cdFx0XCJGQVwiLFxyXG5cdFx0XCJGTFwiLFxyXG5cdFx0XCJBXCIsXHJcblx0XHRcIkdBXCIsXHJcblx0XHRcIkJcIixcclxuXHRcdFwiQ1wiLFxyXG5cdFx0XCJTdGFydFwiLFxyXG5cdFx0XCJTdHViXCIsXHJcblx0XHRcIkxpc3RcIlxyXG5cdF0sXHJcblx0aW1wb3J0YW5jZXM6IFtcclxuXHRcdFwiVG9wXCIsXHJcblx0XHRcIkhpZ2hcIixcclxuXHRcdFwiTWlkXCIsXHJcblx0XHRcIkxvd1wiXHJcblx0XSxcclxuXHRleHRlbmRlZENsYXNzZXM6IFtcclxuXHRcdFwiQ2F0ZWdvcnlcIixcclxuXHRcdFwiRHJhZnRcIixcclxuXHRcdFwiRmlsZVwiLFxyXG5cdFx0XCJQb3J0YWxcIixcclxuXHRcdFwiUHJvamVjdFwiLFxyXG5cdFx0XCJUZW1wbGF0ZVwiLFxyXG5cdFx0XCJCcGx1c1wiLFxyXG5cdFx0XCJGdXR1cmVcIixcclxuXHRcdFwiQ3VycmVudFwiLFxyXG5cdFx0XCJEaXNhbWJpZ1wiLFxyXG5cdFx0XCJOQVwiLFxyXG5cdFx0XCJSZWRpcmVjdFwiLFxyXG5cdFx0XCJCb29rXCJcclxuXHRdLFxyXG5cdGV4dGVuZGVkSW1wb3J0YW5jZXM6IFtcclxuXHRcdFwiVG9wXCIsXHJcblx0XHRcIkhpZ2hcIixcclxuXHRcdFwiTWlkXCIsXHJcblx0XHRcIkxvd1wiLFxyXG5cdFx0XCJCb3R0b21cIixcclxuXHRcdFwiTkFcIlxyXG5cdF1cclxufTtcclxuY29uZmlnLmN1c3RvbUNsYXNzZXMgPSB7XHJcblx0XCJXaWtpUHJvamVjdCBNaWxpdGFyeSBoaXN0b3J5XCI6IFtcclxuXHRcdFwiQUxcIixcclxuXHRcdFwiQkxcIixcclxuXHRcdFwiQ0xcIlxyXG5cdF0sXHJcblx0XCJXaWtpUHJvamVjdCBQb3J0YWxzXCI6IFtcclxuXHRcdFwiRlBvXCIsXHJcblx0XHRcIkNvbXBsZXRlXCIsXHJcblx0XHRcIlN1YnN0YW50aWFsXCIsXHJcblx0XHRcIkJhc2ljXCIsXHJcblx0XHRcIkluY29tcGxldGVcIixcclxuXHRcdFwiTWV0YVwiXHJcblx0XVxyXG59O1xyXG5jb25maWcuc2hlbGxUZW1wbGF0ZXMgPSBbXHJcblx0XCJXaWtpUHJvamVjdCBiYW5uZXIgc2hlbGxcIixcclxuXHRcIldpa2lQcm9qZWN0QmFubmVyc1wiLFxyXG5cdFwiV2lraVByb2plY3QgQmFubmVyc1wiLFxyXG5cdFwiV1BCXCIsXHJcblx0XCJXUEJTXCIsXHJcblx0XCJXaWtpcHJvamVjdGJhbm5lcnNoZWxsXCIsXHJcblx0XCJXaWtpUHJvamVjdCBCYW5uZXIgU2hlbGxcIixcclxuXHRcIldwYlwiLFxyXG5cdFwiV1BCYW5uZXJTaGVsbFwiLFxyXG5cdFwiV3Bic1wiLFxyXG5cdFwiV2lraXByb2plY3RiYW5uZXJzXCIsXHJcblx0XCJXUCBCYW5uZXIgU2hlbGxcIixcclxuXHRcIldQIGJhbm5lciBzaGVsbFwiLFxyXG5cdFwiQmFubmVyc2hlbGxcIixcclxuXHRcIldpa2lwcm9qZWN0IGJhbm5lciBzaGVsbFwiLFxyXG5cdFwiV2lraVByb2plY3QgQmFubmVycyBTaGVsbFwiLFxyXG5cdFwiV2lraVByb2plY3RCYW5uZXIgU2hlbGxcIixcclxuXHRcIldpa2lQcm9qZWN0QmFubmVyU2hlbGxcIixcclxuXHRcIldpa2lQcm9qZWN0IEJhbm5lclNoZWxsXCIsXHJcblx0XCJXaWtpcHJvamVjdEJhbm5lclNoZWxsXCIsXHJcblx0XCJXaWtpUHJvamVjdCBiYW5uZXIgc2hlbGwvcmVkaXJlY3RcIixcclxuXHRcIldpa2lQcm9qZWN0IFNoZWxsXCIsXHJcblx0XCJCYW5uZXIgc2hlbGxcIixcclxuXHRcIlNjb3BlIHNoZWxsXCIsXHJcblx0XCJQcm9qZWN0IHNoZWxsXCIsXHJcblx0XCJXaWtpUHJvamVjdCBiYW5uZXJcIlxyXG5dO1xyXG5jb25maWcuZGVmYXVsdFBhcmFtZXRlckRhdGEgPSB7XHJcblx0XCJhdXRvXCI6IHtcclxuXHRcdFwibGFiZWxcIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiQXV0by1yYXRlZFwiXHJcblx0XHR9LFxyXG5cdFx0XCJkZXNjcmlwdGlvblwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJBdXRvbWF0aWNhbGx5IHJhdGVkIGJ5IGEgYm90LiBBbGxvd2VkIHZhbHVlczogWyd5ZXMnXS5cIlxyXG5cdFx0fSxcclxuXHRcdFwiYXV0b3ZhbHVlXCI6IFwieWVzXCJcclxuXHR9LFxyXG5cdFwibGlzdGFzXCI6IHtcclxuXHRcdFwibGFiZWxcIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiTGlzdCBhc1wiXHJcblx0XHR9LFxyXG5cdFx0XCJkZXNjcmlwdGlvblwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJTb3J0a2V5IGZvciB0YWxrIHBhZ2VcIlxyXG5cdFx0fVxyXG5cdH0sXHJcblx0XCJzbWFsbFwiOiB7XHJcblx0XHRcImxhYmVsXCI6IHtcclxuXHRcdFx0XCJlblwiOiBcIlNtYWxsP1wiLFxyXG5cdFx0fSxcclxuXHRcdFwiZGVzY3JpcHRpb25cIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiRGlzcGxheSBhIHNtYWxsIHZlcnNpb24uIEFsbG93ZWQgdmFsdWVzOiBbJ3llcyddLlwiXHJcblx0XHR9LFxyXG5cdFx0XCJhdXRvdmFsdWVcIjogXCJ5ZXNcIlxyXG5cdH0sXHJcblx0XCJhdHRlbnRpb25cIjoge1xyXG5cdFx0XCJsYWJlbFwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJBdHRlbnRpb24gcmVxdWlyZWQ/XCIsXHJcblx0XHR9LFxyXG5cdFx0XCJkZXNjcmlwdGlvblwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJJbW1lZGlhdGUgYXR0ZW50aW9uIHJlcXVpcmVkLiBBbGxvd2VkIHZhbHVlczogWyd5ZXMnXS5cIlxyXG5cdFx0fSxcclxuXHRcdFwiYXV0b3ZhbHVlXCI6IFwieWVzXCJcclxuXHR9LFxyXG5cdFwibmVlZHMtaW1hZ2VcIjoge1xyXG5cdFx0XCJsYWJlbFwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJOZWVkcyBpbWFnZT9cIixcclxuXHRcdH0sXHJcblx0XHRcImRlc2NyaXB0aW9uXCI6IHtcclxuXHRcdFx0XCJlblwiOiBcIlJlcXVlc3QgdGhhdCBhbiBpbWFnZSBvciBwaG90b2dyYXBoIG9mIHRoZSBzdWJqZWN0IGJlIGFkZGVkIHRvIHRoZSBhcnRpY2xlLiBBbGxvd2VkIHZhbHVlczogWyd5ZXMnXS5cIlxyXG5cdFx0fSxcclxuXHRcdFwiYWxpYXNlc1wiOiBbXHJcblx0XHRcdFwibmVlZHMtcGhvdG9cIlxyXG5cdFx0XSxcclxuXHRcdFwiYXV0b3ZhbHVlXCI6IFwieWVzXCIsXHJcblx0XHRcInN1Z2dlc3RlZFwiOiB0cnVlXHJcblx0fSxcclxuXHRcIm5lZWRzLWluZm9ib3hcIjoge1xyXG5cdFx0XCJsYWJlbFwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJOZWVkcyBpbmZvYm94P1wiLFxyXG5cdFx0fSxcclxuXHRcdFwiZGVzY3JpcHRpb25cIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiUmVxdWVzdCB0aGF0IGFuIGluZm9ib3ggYmUgYWRkZWQgdG8gdGhlIGFydGljbGUuIEFsbG93ZWQgdmFsdWVzOiBbJ3llcyddLlwiXHJcblx0XHR9LFxyXG5cdFx0XCJhbGlhc2VzXCI6IFtcclxuXHRcdFx0XCJuZWVkcy1waG90b1wiXHJcblx0XHRdLFxyXG5cdFx0XCJhdXRvdmFsdWVcIjogXCJ5ZXNcIixcclxuXHRcdFwic3VnZ2VzdGVkXCI6IHRydWVcclxuXHR9XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjb25maWc7IiwiLy8gQXR0cmlidXRpb246IERpZmYgc3R5bGVzIGZyb20gPGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1dpa2lwZWRpYTpBdXRvV2lraUJyb3dzZXIvc3R5bGUuY3NzPlxyXG52YXIgZGlmZlN0eWxlcyA9IGB0YWJsZS5kaWZmLCB0ZC5kaWZmLW90aXRsZSwgdGQuZGlmZi1udGl0bGUgeyBiYWNrZ3JvdW5kLWNvbG9yOiB3aGl0ZTsgfVxyXG50ZC5kaWZmLW90aXRsZSwgdGQuZGlmZi1udGl0bGUgeyB0ZXh0LWFsaWduOiBjZW50ZXI7IH1cclxudGQuZGlmZi1tYXJrZXIgeyB0ZXh0LWFsaWduOiByaWdodDsgZm9udC13ZWlnaHQ6IGJvbGQ7IGZvbnQtc2l6ZTogMS4yNWVtOyB9XHJcbnRkLmRpZmYtbGluZW5vIHsgZm9udC13ZWlnaHQ6IGJvbGQ7IH1cclxudGQuZGlmZi1hZGRlZGxpbmUsIHRkLmRpZmYtZGVsZXRlZGxpbmUsIHRkLmRpZmYtY29udGV4dCB7IGZvbnQtc2l6ZTogODglOyB2ZXJ0aWNhbC1hbGlnbjogdG9wOyB3aGl0ZS1zcGFjZTogLW1vei1wcmUtd3JhcDsgd2hpdGUtc3BhY2U6IHByZS13cmFwOyB9XHJcbnRkLmRpZmYtYWRkZWRsaW5lLCB0ZC5kaWZmLWRlbGV0ZWRsaW5lIHsgYm9yZGVyLXN0eWxlOiBzb2xpZDsgYm9yZGVyLXdpZHRoOiAxcHggMXB4IDFweCA0cHg7IGJvcmRlci1yYWRpdXM6IDAuMzNlbTsgfVxyXG50ZC5kaWZmLWFkZGVkbGluZSB7IGJvcmRlci1jb2xvcjogI2EzZDNmZjsgfVxyXG50ZC5kaWZmLWRlbGV0ZWRsaW5lIHsgYm9yZGVyLWNvbG9yOiAjZmZlNDljOyB9XHJcbnRkLmRpZmYtY29udGV4dCB7IGJhY2tncm91bmQ6ICNmM2YzZjM7IGNvbG9yOiAjMzMzMzMzOyBib3JkZXItc3R5bGU6IHNvbGlkOyBib3JkZXItd2lkdGg6IDFweCAxcHggMXB4IDRweDsgYm9yZGVyLWNvbG9yOiAjZTZlNmU2OyBib3JkZXItcmFkaXVzOiAwLjMzZW07IH1cclxuLmRpZmZjaGFuZ2UgeyBmb250LXdlaWdodDogYm9sZDsgdGV4dC1kZWNvcmF0aW9uOiBub25lOyB9XHJcbnRhYmxlLmRpZmYge1xyXG4gICAgYm9yZGVyOiBub25lO1xyXG4gICAgd2lkdGg6IDk4JTsgYm9yZGVyLXNwYWNpbmc6IDRweDtcclxuICAgIHRhYmxlLWxheW91dDogZml4ZWQ7IC8qIEVuc3VyZXMgdGhhdCBjb2x1bXMgYXJlIG9mIGVxdWFsIHdpZHRoICovXHJcbn1cclxudGQuZGlmZi1hZGRlZGxpbmUgLmRpZmZjaGFuZ2UsIHRkLmRpZmYtZGVsZXRlZGxpbmUgLmRpZmZjaGFuZ2UgeyBib3JkZXItcmFkaXVzOiAwLjMzZW07IHBhZGRpbmc6IDAuMjVlbSAwOyB9XHJcbnRkLmRpZmYtYWRkZWRsaW5lIC5kaWZmY2hhbmdlIHtcdGJhY2tncm91bmQ6ICNkOGVjZmY7IH1cclxudGQuZGlmZi1kZWxldGVkbGluZSAuZGlmZmNoYW5nZSB7IGJhY2tncm91bmQ6ICNmZWVlYzg7IH1cclxudGFibGUuZGlmZiB0ZCB7XHRwYWRkaW5nOiAwLjMzZW0gMC42NmVtOyB9XHJcbnRhYmxlLmRpZmYgY29sLmRpZmYtbWFya2VyIHsgd2lkdGg6IDIlOyB9XHJcbnRhYmxlLmRpZmYgY29sLmRpZmYtY29udGVudCB7IHdpZHRoOiA0OCU7IH1cclxudGFibGUuZGlmZiB0ZCBkaXYge1xyXG4gICAgLyogRm9yY2Utd3JhcCB2ZXJ5IGxvbmcgbGluZXMgc3VjaCBhcyBVUkxzIG9yIHBhZ2Utd2lkZW5pbmcgY2hhciBzdHJpbmdzLiAqL1xyXG4gICAgd29yZC13cmFwOiBicmVhay13b3JkO1xyXG4gICAgLyogQXMgZmFsbGJhY2sgKEZGPDMuNSwgT3BlcmEgPDEwLjUpLCBzY3JvbGxiYXJzIHdpbGwgYmUgYWRkZWQgZm9yIHZlcnkgd2lkZSBjZWxsc1xyXG4gICAgICAgIGluc3RlYWQgb2YgdGV4dCBvdmVyZmxvd2luZyBvciB3aWRlbmluZyAqL1xyXG4gICAgb3ZlcmZsb3c6IGF1dG87XHJcbn1gO1xyXG5cclxuZXhwb3J0IHsgZGlmZlN0eWxlcyB9OyIsImltcG9ydCB7QVBJLCBpc0FmdGVyRGF0ZSwgbWFrZUVycm9yTXNnfSBmcm9tIFwiLi91dGlsXCI7XHJcbmltcG9ydCAqIGFzIGNhY2hlIGZyb20gXCIuL2NhY2hlXCI7XHJcblxyXG52YXIgY2FjaGVCYW5uZXJzID0gZnVuY3Rpb24oYmFubmVycywgYmFubmVyT3B0aW9ucykge1xyXG5cdGNhY2hlLndyaXRlKFwiYmFubmVyc1wiLCBiYW5uZXJzLCAyLCA2MCk7XHJcblx0Y2FjaGUud3JpdGUoXCJiYW5uZXJPcHRpb25zXCIsIGJhbm5lck9wdGlvbnMsIDIsIDYwKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXRzIGJhbm5lcnMvb3B0aW9ucyBmcm9tIHRoZSBBcGlcclxuICogXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlfSBSZXNvbHZlZCB3aXRoOiBiYW5uZXJzIG9iamVjdCwgYmFubmVyT3B0aW9ucyBhcnJheVxyXG4gKi9cclxudmFyIGdldExpc3RPZkJhbm5lcnNGcm9tQXBpID0gZnVuY3Rpb24oKSB7XHJcblxyXG5cdHZhciBmaW5pc2hlZFByb21pc2UgPSAkLkRlZmVycmVkKCk7XHJcblxyXG5cdHZhciBxdWVyeVNrZWxldG9uID0ge1xyXG5cdFx0YWN0aW9uOiBcInF1ZXJ5XCIsXHJcblx0XHRmb3JtYXQ6IFwianNvblwiLFxyXG5cdFx0bGlzdDogXCJjYXRlZ29yeW1lbWJlcnNcIixcclxuXHRcdGNtcHJvcDogXCJ0aXRsZVwiLFxyXG5cdFx0Y21uYW1lc3BhY2U6IFwiMTBcIixcclxuXHRcdGNtbGltaXQ6IFwiNTAwXCJcclxuXHR9O1xyXG5cclxuXHR2YXIgY2F0ZWdvcmllcyA9IFtcclxuXHRcdHtcclxuXHRcdFx0dGl0bGU6XCIgQ2F0ZWdvcnk6V2lraVByb2plY3QgYmFubmVycyB3aXRoIHF1YWxpdHkgYXNzZXNzbWVudFwiLFxyXG5cdFx0XHRhYmJyZXZpYXRpb246IFwid2l0aFJhdGluZ3NcIixcclxuXHRcdFx0YmFubmVyczogW10sXHJcblx0XHRcdHByb2Nlc3NlZDogJC5EZWZlcnJlZCgpXHJcblx0XHR9LFxyXG5cdFx0e1xyXG5cdFx0XHR0aXRsZTogXCJDYXRlZ29yeTpXaWtpUHJvamVjdCBiYW5uZXJzIHdpdGhvdXQgcXVhbGl0eSBhc3Nlc3NtZW50XCIsXHJcblx0XHRcdGFiYnJldmlhdGlvbjogXCJ3aXRob3V0UmF0aW5nc1wiLFxyXG5cdFx0XHRiYW5uZXJzOiBbXSxcclxuXHRcdFx0cHJvY2Vzc2VkOiAkLkRlZmVycmVkKClcclxuXHRcdH0sXHJcblx0XHR7XHJcblx0XHRcdHRpdGxlOiBcIkNhdGVnb3J5Oldpa2lQcm9qZWN0IGJhbm5lciB3cmFwcGVyIHRlbXBsYXRlc1wiLFxyXG5cdFx0XHRhYmJyZXZpYXRpb246IFwid3JhcHBlcnNcIixcclxuXHRcdFx0YmFubmVyczogW10sXHJcblx0XHRcdHByb2Nlc3NlZDogJC5EZWZlcnJlZCgpXHJcblx0XHR9XHJcblx0XTtcclxuXHJcblx0dmFyIHByb2Nlc3NRdWVyeSA9IGZ1bmN0aW9uKHJlc3VsdCwgY2F0SW5kZXgpIHtcclxuXHRcdGlmICggIXJlc3VsdC5xdWVyeSB8fCAhcmVzdWx0LnF1ZXJ5LmNhdGVnb3J5bWVtYmVycyApIHtcclxuXHRcdFx0Ly8gTm8gcmVzdWx0c1xyXG5cdFx0XHQvLyBUT0RPOiBlcnJvciBvciB3YXJuaW5nICoqKioqKioqXHJcblx0XHRcdGZpbmlzaGVkUHJvbWlzZS5yZWplY3QoKTtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHQvLyBHYXRoZXIgdGl0bGVzIGludG8gYXJyYXkgLSBleGNsdWRpbmcgXCJUZW1wbGF0ZTpcIiBwcmVmaXhcclxuXHRcdHZhciByZXN1bHRUaXRsZXMgPSByZXN1bHQucXVlcnkuY2F0ZWdvcnltZW1iZXJzLm1hcChmdW5jdGlvbihpbmZvKSB7XHJcblx0XHRcdHJldHVybiBpbmZvLnRpdGxlLnNsaWNlKDkpO1xyXG5cdFx0fSk7XHJcblx0XHRBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseShjYXRlZ29yaWVzW2NhdEluZGV4XS5iYW5uZXJzLCByZXN1bHRUaXRsZXMpO1xyXG5cdFx0XHJcblx0XHQvLyBDb250aW51ZSBxdWVyeSBpZiBuZWVkZWRcclxuXHRcdGlmICggcmVzdWx0LmNvbnRpbnVlICkge1xyXG5cdFx0XHRkb0FwaVF1ZXJ5KCQuZXh0ZW5kKGNhdGVnb3JpZXNbY2F0SW5kZXhdLnF1ZXJ5LCByZXN1bHQuY29udGludWUpLCBjYXRJbmRleCk7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHRcdFxyXG5cdFx0Y2F0ZWdvcmllc1tjYXRJbmRleF0ucHJvY2Vzc2VkLnJlc29sdmUoKTtcclxuXHR9O1xyXG5cclxuXHR2YXIgZG9BcGlRdWVyeSA9IGZ1bmN0aW9uKHEsIGNhdEluZGV4KSB7XHJcblx0XHRBUEkuZ2V0KCBxIClcclxuXHRcdFx0LmRvbmUoIGZ1bmN0aW9uKHJlc3VsdCkge1xyXG5cdFx0XHRcdHByb2Nlc3NRdWVyeShyZXN1bHQsIGNhdEluZGV4KTtcclxuXHRcdFx0fSApXHJcblx0XHRcdC5mYWlsKCBmdW5jdGlvbihjb2RlLCBqcXhocikge1xyXG5cdFx0XHRcdGNvbnNvbGUud2FybihcIltSYXRlcl0gXCIgKyBtYWtlRXJyb3JNc2coY29kZSwganF4aHIsIFwiQ291bGQgbm90IHJldHJpZXZlIHBhZ2VzIGZyb20gW1s6XCIgKyBxLmNtdGl0bGUgKyBcIl1dXCIpKTtcclxuXHRcdFx0XHRmaW5pc2hlZFByb21pc2UucmVqZWN0KCk7XHJcblx0XHRcdH0gKTtcclxuXHR9O1xyXG5cdFxyXG5cdGNhdGVnb3JpZXMuZm9yRWFjaChmdW5jdGlvbihjYXQsIGluZGV4LCBhcnIpIHtcclxuXHRcdGNhdC5xdWVyeSA9ICQuZXh0ZW5kKCB7IFwiY210aXRsZVwiOmNhdC50aXRsZSB9LCBxdWVyeVNrZWxldG9uICk7XHJcblx0XHQkLndoZW4oIGFycltpbmRleC0xXSAmJiBhcnJbaW5kZXgtMV0ucHJvY2Vzc2VkIHx8IHRydWUgKS50aGVuKGZ1bmN0aW9uKCl7XHJcblx0XHRcdGRvQXBpUXVlcnkoY2F0LnF1ZXJ5LCBpbmRleCk7XHJcblx0XHR9KTtcclxuXHR9KTtcclxuXHRcclxuXHRjYXRlZ29yaWVzW2NhdGVnb3JpZXMubGVuZ3RoLTFdLnByb2Nlc3NlZC50aGVuKGZ1bmN0aW9uKCl7XHJcblx0XHR2YXIgYmFubmVycyA9IHt9O1xyXG5cdFx0dmFyIHN0YXNoQmFubmVyID0gZnVuY3Rpb24oY2F0T2JqZWN0KSB7XHJcblx0XHRcdGJhbm5lcnNbY2F0T2JqZWN0LmFiYnJldmlhdGlvbl0gPSBjYXRPYmplY3QuYmFubmVycztcclxuXHRcdH07XHJcblx0XHR2YXIgbWVyZ2VCYW5uZXJzID0gZnVuY3Rpb24obWVyZ2VJbnRvVGhpc0FycmF5LCBjYXRPYmplY3QpIHtcclxuXHRcdFx0cmV0dXJuICQubWVyZ2UobWVyZ2VJbnRvVGhpc0FycmF5LCBjYXRPYmplY3QuYmFubmVycyk7XHJcblx0XHR9O1xyXG5cdFx0dmFyIG1ha2VPcHRpb24gPSBmdW5jdGlvbihiYW5uZXJOYW1lKSB7XHJcblx0XHRcdHZhciBpc1dyYXBwZXIgPSAoIC0xICE9PSAkLmluQXJyYXkoYmFubmVyTmFtZSwgY2F0ZWdvcmllc1syXS5iYW5uZXJzKSApO1xyXG5cdFx0XHRyZXR1cm4ge1xyXG5cdFx0XHRcdGRhdGE6ICAoIGlzV3JhcHBlciA/IFwic3Vic3Q6XCIgOiBcIlwiKSArIGJhbm5lck5hbWUsXHJcblx0XHRcdFx0bGFiZWw6IGJhbm5lck5hbWUucmVwbGFjZShcIldpa2lQcm9qZWN0IFwiLCBcIlwiKSArICggaXNXcmFwcGVyID8gXCIgW3RlbXBsYXRlIHdyYXBwZXJdXCIgOiBcIlwiKVxyXG5cdFx0XHR9O1xyXG5cdFx0fTtcclxuXHRcdGNhdGVnb3JpZXMuZm9yRWFjaChzdGFzaEJhbm5lcik7XHJcblx0XHRcclxuXHRcdHZhciBiYW5uZXJPcHRpb25zID0gY2F0ZWdvcmllcy5yZWR1Y2UobWVyZ2VCYW5uZXJzLCBbXSkubWFwKG1ha2VPcHRpb24pO1xyXG5cdFx0XHJcblx0XHRmaW5pc2hlZFByb21pc2UucmVzb2x2ZShiYW5uZXJzLCBiYW5uZXJPcHRpb25zKTtcclxuXHR9KTtcclxuXHRcclxuXHRyZXR1cm4gZmluaXNoZWRQcm9taXNlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldHMgYmFubmVycy9vcHRpb25zIGZyb20gY2FjaGUsIGlmIHRoZXJlIGFuZCBub3QgdG9vIG9sZFxyXG4gKiBcclxuICogQHJldHVybnMge1Byb21pc2V9IFJlc29sdmVkIHdpdGg6IGJhbm5lcnMgb2JqZWN0LCBiYW5uZXJPcHRpb25zIG9iamVjdFxyXG4gKi9cclxudmFyIGdldEJhbm5lcnNGcm9tQ2FjaGUgPSBmdW5jdGlvbigpIHtcclxuXHR2YXIgY2FjaGVkQmFubmVycyA9IGNhY2hlLnJlYWQoXCJiYW5uZXJzXCIpO1xyXG5cdHZhciBjYWNoZWRCYW5uZXJPcHRpb25zID0gY2FjaGUucmVhZChcImJhbm5lck9wdGlvbnNcIik7XHJcblx0aWYgKFxyXG5cdFx0IWNhY2hlZEJhbm5lcnMgfHxcclxuXHRcdCFjYWNoZWRCYW5uZXJzLnZhbHVlIHx8ICFjYWNoZWRCYW5uZXJzLnN0YWxlRGF0ZSB8fFxyXG5cdFx0IWNhY2hlZEJhbm5lck9wdGlvbnMgfHxcclxuXHRcdCFjYWNoZWRCYW5uZXJPcHRpb25zLnZhbHVlIHx8ICFjYWNoZWRCYW5uZXJPcHRpb25zLnN0YWxlRGF0ZVxyXG5cdCkge1xyXG5cdFx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3QoKTtcclxuXHR9XHJcblx0aWYgKCBpc0FmdGVyRGF0ZShjYWNoZWRCYW5uZXJzLnN0YWxlRGF0ZSkgfHwgaXNBZnRlckRhdGUoY2FjaGVkQmFubmVyT3B0aW9ucy5zdGFsZURhdGUpICkge1xyXG5cdFx0Ly8gVXBkYXRlIGluIHRoZSBiYWNrZ3JvdW5kOyBzdGlsbCB1c2Ugb2xkIGxpc3QgdW50aWwgdGhlbiAgXHJcblx0XHRnZXRMaXN0T2ZCYW5uZXJzRnJvbUFwaSgpLnRoZW4oY2FjaGVCYW5uZXJzKTtcclxuXHR9XHJcblx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZXNvbHZlKGNhY2hlZEJhbm5lcnMudmFsdWUsIGNhY2hlZEJhbm5lck9wdGlvbnMudmFsdWUpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldHMgYmFubmVycy9vcHRpb25zIGZyb20gY2FjaGUgb3IgQVBJLlxyXG4gKiBIYXMgc2lkZSBhZmZlY3Qgb2YgYWRkaW5nL3VwZGF0aW5nL2NsZWFyaW5nIGNhY2hlLlxyXG4gKiBcclxuICogQHJldHVybnMge1Byb21pc2U8T2JqZWN0LCBBcnJheT59IGJhbm5lcnMgb2JqZWN0LCBiYW5uZXJPcHRpb25zIG9iamVjdFxyXG4gKi9cclxudmFyIGdldEJhbm5lcnMgPSAoKSA9PiBnZXRCYW5uZXJzRnJvbUNhY2hlKCkudGhlbihcclxuXHQvLyBTdWNjZXNzOiBwYXNzIHRocm91Z2hcclxuXHQoYmFubmVycywgb3B0aW9ucykgPT4gJC5EZWZlcnJlZCgpLnJlc29sdmUoYmFubmVycywgb3B0aW9ucyksXHJcblx0Ly8gRmFpbHVyZTogZ2V0IGZyb20gQXBpLCB0aGVuIGNhY2hlIHRoZW1cclxuXHQoKSA9PiB7XHJcblx0XHR2YXIgYmFubmVyc1Byb21pc2UgPSBnZXRMaXN0T2ZCYW5uZXJzRnJvbUFwaSgpO1xyXG5cdFx0YmFubmVyc1Byb21pc2UudGhlbihjYWNoZUJhbm5lcnMpO1xyXG5cdFx0cmV0dXJuIGJhbm5lcnNQcm9taXNlO1xyXG5cdH1cclxuKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGdldEJhbm5lcnM7IiwiaW1wb3J0IGNvbmZpZyBmcm9tIFwiLi9jb25maWdcIjtcclxuaW1wb3J0IExvYWREaWFsb2cgZnJvbSBcIi4vTG9hZERpYWxvZ1wiO1xyXG5pbXBvcnQge0FQSX0gZnJvbSBcIi4vdXRpbFwiO1xyXG5pbXBvcnQgeyBwYXJzZVRlbXBsYXRlcywgZ2V0V2l0aFJlZGlyZWN0VG8gfSBmcm9tIFwiLi9UZW1wbGF0ZVwiO1xyXG5pbXBvcnQgZ2V0QmFubmVycyBmcm9tIFwiLi9nZXRCYW5uZXJzXCI7XHJcbmltcG9ydCAqIGFzIGNhY2hlIGZyb20gXCIuL2NhY2hlXCI7XHJcblxyXG52YXIgc2V0dXBSYXRlciA9IGZ1bmN0aW9uKGNsaWNrRXZlbnQpIHtcclxuXHRpZiAoIGNsaWNrRXZlbnQgKSB7XHJcblx0XHRjbGlja0V2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0fVxyXG5cclxuXHR2YXIgc2V0dXBDb21wbGV0ZWRQcm9taXNlID0gJC5EZWZlcnJlZCgpO1xyXG4gICAgXHJcblx0dmFyIGN1cnJlbnRQYWdlID0gbXcuVGl0bGUubmV3RnJvbVRleHQoY29uZmlnLm13LndnUGFnZU5hbWUpO1xyXG5cdHZhciB0YWxrUGFnZSA9IGN1cnJlbnRQYWdlICYmIGN1cnJlbnRQYWdlLmdldFRhbGtQYWdlKCk7XHJcblx0dmFyIHN1YmplY3RQYWdlID0gY3VycmVudFBhZ2UgJiYgY3VycmVudFBhZ2UuZ2V0U3ViamVjdFBhZ2UoKTtcclxuICAgIFxyXG5cdHZhciBsb2FkRGlhbG9nID0gbmV3IExvYWREaWFsb2coe1xyXG5cdFx0c2l6ZTogXCJtZWRpdW1cIlxyXG5cdH0pO1xyXG5cclxuXHQvLyBDcmVhdGUgYW5kIGFwcGVuZCBhIHdpbmRvdyBtYW5hZ2VyLCB3aGljaCB3aWxsIG9wZW4gYW5kIGNsb3NlIHRoZSB3aW5kb3cuXHJcblx0dmFyIHdpbmRvd01hbmFnZXIgPSBuZXcgT08udWkuV2luZG93TWFuYWdlcigpO1xyXG5cdCQoIGRvY3VtZW50LmJvZHkgKS5hcHBlbmQoIHdpbmRvd01hbmFnZXIuJGVsZW1lbnQgKTtcclxuXHJcblx0Ly8gQWRkIHRoZSB3aW5kb3cgdG8gdGhlIHdpbmRvdyBtYW5hZ2VyIHVzaW5nIHRoZSBhZGRXaW5kb3dzKCkgbWV0aG9kLlxyXG5cdHdpbmRvd01hbmFnZXIuYWRkV2luZG93cyggWyBsb2FkRGlhbG9nIF0gKTtcclxuXHJcblx0Ly8gT3BlbiB0aGUgd2luZG93IVxyXG5cdHZhciBsb2FkRGlhbG9nV2luID0gd2luZG93TWFuYWdlci5vcGVuV2luZG93KCBsb2FkRGlhbG9nICk7XHJcbiAgICBcclxuXHQvLyBHZXQgbGlzdHMgb2YgYWxsIGJhbm5lcnMgKHRhc2sgMClcclxuXHR2YXIgYmFubmVyc1Byb21pc2UgPSBnZXRCYW5uZXJzKCk7XHJcblxyXG5cdC8vIExvYWQgdGFsayBwYWdlICh0YXNrIDEpIFxyXG5cdHZhciBsb2FkVGFsa1Byb21pc2UgPSBBUEkuZ2V0KCB7XHJcblx0XHRhY3Rpb246IFwicXVlcnlcIixcclxuXHRcdHByb3A6IFwicmV2aXNpb25zXCIsXHJcblx0XHRydnByb3A6IFwiY29udGVudFwiLFxyXG5cdFx0cnZzZWN0aW9uOiBcIjBcIixcclxuXHRcdHRpdGxlczogdGFsa1BhZ2UuZ2V0UHJlZml4ZWRUZXh0KCksXHJcblx0XHRpbmRleHBhZ2VpZHM6IDFcclxuXHR9ICkudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XHJcblx0XHR2YXIgaWQgPSByZXN1bHQucXVlcnkucGFnZWlkcztcdFx0XHJcblx0XHR2YXIgd2lraXRleHQgPSAoIGlkIDwgMCApID8gXCJcIiA6IHJlc3VsdC5xdWVyeS5wYWdlc1tpZF0ucmV2aXNpb25zWzBdW1wiKlwiXTtcclxuXHRcdHJldHVybiB3aWtpdGV4dDtcclxuXHR9KTtcclxuXHRsb2FkVGFsa1Byb21pc2UudGhlbihcclxuXHRcdGZ1bmN0aW9uKCkgeyBsb2FkRGlhbG9nLnNob3dUYXNrRG9uZSgxKTsgfSxcclxuXHRcdGZ1bmN0aW9uKGNvZGUsIGpxeGhyKSB7IGxvYWREaWFsb2cuc2hvd1Rhc2tGYWlsZWQoMSwgY29kZSwganF4aHIpOyB9XHJcblx0KTtcclxuXHJcblx0Ly8gUGFyc2UgdGFsayBwYWdlIGZvciBiYW5uZXJzICh0YXNrIDIpXHJcblx0dmFyIHBhcnNlVGFsa1Byb21pc2UgPSBsb2FkVGFsa1Byb21pc2UudGhlbih3aWtpdGV4dCA9PiBwYXJzZVRlbXBsYXRlcyh3aWtpdGV4dCwgdHJ1ZSkpIC8vIEdldCBhbGwgdGVtcGxhdGVzXHJcblx0XHQudGhlbih0ZW1wbGF0ZXMgPT4gZ2V0V2l0aFJlZGlyZWN0VG8odGVtcGxhdGVzKSkgLy8gQ2hlY2sgZm9yIHJlZGlyZWN0c1xyXG5cdFx0LnRoZW4odGVtcGxhdGVzID0+IHtcclxuXHRcdFx0cmV0dXJuIGJhbm5lcnNQcm9taXNlLnRoZW4oKGFsbEJhbm5lcnMpID0+IHsgLy8gR2V0IGxpc3Qgb2YgYWxsIGJhbm5lciB0ZW1wbGF0ZXNcclxuXHRcdFx0XHRyZXR1cm4gdGVtcGxhdGVzLmZpbHRlcih0ZW1wbGF0ZSA9PiB7IC8vIEZpbHRlciBvdXQgbm9uLWJhbm5lcnNcclxuXHRcdFx0XHRcdHZhciBtYWluVGV4dCA9IHRlbXBsYXRlLnJlZGlyZWN0VG9cclxuXHRcdFx0XHRcdFx0PyB0ZW1wbGF0ZS5yZWRpcmVjdFRvLmdldE1haW5UZXh0KClcclxuXHRcdFx0XHRcdFx0OiB0ZW1wbGF0ZS5nZXRUaXRsZSgpLmdldE1haW5UZXh0KCk7XHJcblx0XHRcdFx0XHRyZXR1cm4gYWxsQmFubmVycy53aXRoUmF0aW5ncy5pbmNsdWRlcyhtYWluVGV4dCkgfHwgXHJcbiAgICAgICAgICAgICAgICAgICAgYWxsQmFubmVycy53aXRob3V0UmF0aW5ncy5pbmNsdWRlcyhtYWluVGV4dCkgfHxcclxuICAgICAgICAgICAgICAgICAgICBhbGxCYW5uZXJzLndyYXBwZXJzLmluY2x1ZGVzKG1haW5UZXh0KTtcclxuXHRcdFx0XHR9KVxyXG5cdFx0XHRcdFx0Lm1hcChmdW5jdGlvbih0ZW1wbGF0ZSkgeyAvLyBTZXQgd3JhcHBlciB0YXJnZXQgaWYgbmVlZGVkXHJcblx0XHRcdFx0XHRcdHZhciBtYWluVGV4dCA9IHRlbXBsYXRlLnJlZGlyZWN0VG9cclxuXHRcdFx0XHRcdFx0XHQ/IHRlbXBsYXRlLnJlZGlyZWN0VG8uZ2V0TWFpblRleHQoKVxyXG5cdFx0XHRcdFx0XHRcdDogdGVtcGxhdGUuZ2V0VGl0bGUoKS5nZXRNYWluVGV4dCgpO1xyXG5cdFx0XHRcdFx0XHRpZiAoYWxsQmFubmVycy53cmFwcGVycy5pbmNsdWRlcyhtYWluVGV4dCkpIHtcclxuXHRcdFx0XHRcdFx0XHR0ZW1wbGF0ZS5yZWRpcmVjdHNUbyA9IG13LlRpdGxlLm5ld0Zyb21UZXh0KFwiVGVtcGxhdGU6U3Vic3Q6XCIgKyBtYWluVGV4dCk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0cmV0dXJuIHRlbXBsYXRlO1xyXG5cdFx0XHRcdFx0fSk7XHJcblx0XHRcdH0pO1xyXG5cdFx0fSk7XHJcblx0cGFyc2VUYWxrUHJvbWlzZS50aGVuKFxyXG5cdFx0ZnVuY3Rpb24oKSB7IGxvYWREaWFsb2cuc2hvd1Rhc2tEb25lKDIpOyB9LFxyXG5cdFx0ZnVuY3Rpb24oY29kZSwganF4aHIpIHsgbG9hZERpYWxvZy5zaG93VGFza0ZhaWxlZCgyLCBjb2RlLCBqcXhocik7IH1cclxuXHQpO1xyXG5cclxuXHQvLyBSZXRyaWV2ZSBhbmQgc3RvcmUgVGVtcGxhdGVEYXRhICh0YXNrIDMpXHJcblx0dmFyIHRlbXBsYXRlRGF0YVByb21pc2UgPSBwYXJzZVRhbGtQcm9taXNlLnRoZW4odGVtcGxhdGVzID0+IHtcclxuXHRcdHRlbXBsYXRlcy5mb3JFYWNoKHRlbXBsYXRlID0+IHRlbXBsYXRlLnNldFBhcmFtRGF0YUFuZFN1Z2dlc3Rpb25zKCkpO1xyXG5cdFx0cmV0dXJuIHRlbXBsYXRlcztcclxuXHR9KTtcclxuXHR0ZW1wbGF0ZURhdGFQcm9taXNlLnRoZW4oZnVuY3Rpb24oKXtcclxuXHRcdGxvYWREaWFsb2cuc2hvd1Rhc2tEb25lKDMpO1xyXG5cdH0pO1xyXG5cclxuXHQvLyBDaGVjayBpZiBwYWdlIGlzIGEgcmVkaXJlY3QgKHRhc2sgNCkgLSBidXQgZG9uJ3QgZXJyb3Igb3V0IGlmIHJlcXVlc3QgZmFpbHNcclxuXHR2YXIgcmVkaXJlY3RDaGVja1Byb21pc2UgPSBBUEkuZ2V0UmF3KHN1YmplY3RQYWdlLmdldFByZWZpeGVkVGV4dCgpKVxyXG5cdFx0LnRoZW4oXHJcblx0XHRcdC8vIFN1Y2Nlc3NcclxuXHRcdFx0ZnVuY3Rpb24ocmF3UGFnZSkgeyBcclxuXHRcdFx0XHRpZiAoIC9eXFxzKiNSRURJUkVDVC9pLnRlc3QocmF3UGFnZSkgKSB7XHJcblx0XHRcdFx0XHQvLyBnZXQgcmVkaXJlY3Rpb24gdGFyZ2V0LCBvciBib29sZWFuIHRydWVcclxuXHRcdFx0XHRcdHJldHVybiByYXdQYWdlLnNsaWNlKHJhd1BhZ2UuaW5kZXhPZihcIltbXCIpKzIsIHJhd1BhZ2UuaW5kZXhPZihcIl1dXCIpKSB8fCB0cnVlO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdH0sXHJcblx0XHRcdC8vIEZhaWx1cmUgKGlnbm9yZWQpXHJcblx0XHRcdGZ1bmN0aW9uKCkgeyByZXR1cm4gbnVsbDsgfVxyXG5cdFx0KTtcclxuXHRyZWRpcmVjdENoZWNrUHJvbWlzZVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24oKXtcclxuXHRcdFx0bG9hZERpYWxvZy5zaG93VGFza0RvbmUoNCk7XHJcblx0XHR9KTtcclxuXHJcblx0Ly8gUmV0cmlldmUgcmF0aW5nIGZyb20gT1JFUyAodGFzayA1LCBvbmx5IG5lZWRlZCBmb3IgYXJ0aWNsZXMpXHJcblx0dmFyIHNob3VsZEdldE9yZXMgPSAoIGNvbmZpZy5tdy53Z05hbWVzcGFjZU51bWJlciA8PSAxICk7XHJcblx0aWYgKCBzaG91bGRHZXRPcmVzICkge1xyXG5cdFx0JChcIiNkaWFsb2ctbG9hZGluZy01XCIpLnNob3coKTtcclxuXHRcdHZhciBsYXRlc3RSZXZJZFByb21pc2UgPSBjdXJyZW50UGFnZS5pc1RhbGtQYWdlKClcclxuXHRcdFx0PyAkLkRlZmVycmVkKCkucmVzb2x2ZShjb25maWcubXcud2dSZXZpc2lvbklkKVxyXG5cdFx0XHQ6IFx0QVBJLmdldCgge1xyXG5cdFx0XHRcdGFjdGlvbjogXCJxdWVyeVwiLFxyXG5cdFx0XHRcdGZvcm1hdDogXCJqc29uXCIsXHJcblx0XHRcdFx0cHJvcDogXCJyZXZpc2lvbnNcIixcclxuXHRcdFx0XHR0aXRsZXM6IHN1YmplY3RQYWdlLmdldFByZWZpeGVkVGV4dCgpLFxyXG5cdFx0XHRcdHJ2cHJvcDogXCJpZHNcIixcclxuXHRcdFx0XHRpbmRleHBhZ2VpZHM6IDFcclxuXHRcdFx0fSApLnRoZW4oZnVuY3Rpb24ocmVzdWx0KSB7XHJcblx0XHRcdFx0aWYgKHJlc3VsdC5xdWVyeS5yZWRpcmVjdHMpIHtcclxuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dmFyIGlkID0gcmVzdWx0LnF1ZXJ5LnBhZ2VpZHM7XHJcblx0XHRcdFx0dmFyIHBhZ2UgPSByZXN1bHQucXVlcnkucGFnZXNbaWRdO1xyXG5cdFx0XHRcdGlmIChwYWdlLm1pc3NpbmcgPT09IFwiXCIpIHtcclxuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKCBpZCA8IDAgKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gJC5EZWZlcnJlZCgpLnJlamVjdCgpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gcGFnZS5yZXZpc2lvbnNbMF0ucmV2aWQ7XHJcblx0XHRcdH0pO1xyXG5cdFx0dmFyIG9yZXNQcm9taXNlID0gbGF0ZXN0UmV2SWRQcm9taXNlLnRoZW4oZnVuY3Rpb24obGF0ZXN0UmV2SWQpIHtcclxuXHRcdFx0aWYgKCFsYXRlc3RSZXZJZCkge1xyXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gQVBJLmdldE9SRVMobGF0ZXN0UmV2SWQpXHJcblx0XHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzdWx0KSB7XHJcblx0XHRcdFx0XHR2YXIgZGF0YSA9IHJlc3VsdC5lbndpa2kuc2NvcmVzW2xhdGVzdFJldklkXS53cDEwO1xyXG5cdFx0XHRcdFx0aWYgKCBkYXRhLmVycm9yICkge1xyXG5cdFx0XHRcdFx0XHRyZXR1cm4gJC5EZWZlcnJlZCgpLnJlamVjdChkYXRhLmVycm9yLnR5cGUsIGRhdGEuZXJyb3IubWVzc2FnZSk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRyZXR1cm4gZGF0YS5zY29yZS5wcmVkaWN0aW9uO1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0fSk7XHJcblx0XHRvcmVzUHJvbWlzZS50aGVuKFxyXG5cdFx0XHQvLyBTdWNjZXNzOiBzaG93IHN1Y2Nlc3NcclxuXHRcdFx0ZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0bG9hZERpYWxvZy5zaG93VGFza0RvbmUoNCk7XHJcblx0XHRcdH0sXHJcblx0XHRcdC8vIEZhaWx1cmU6IHNob3cgZmFpbHVyZSwgYnV0IHN0aWxsIHJlc29sdmUgcHJvbWlzZSAoYWZ0ZXIgMiBzZWNvbmRzKVxyXG5cdFx0XHRmdW5jdGlvbihjb2RlLCBqcXhocikge1xyXG5cdFx0XHRcdGxvYWREaWFsb2cuc2hvd1Rhc2tGYWlsZWQoNCwgY29kZSwganF4aHIpO1xyXG5cdFx0XHRcdHZhciB3YWl0UHJvbWlzZSA9ICQuRGVmZXJyZWQoKTtcclxuXHRcdFx0XHRzZXRUaW1lb3V0KHdhaXRQcm9taXNlLnJlc29sdmUsIDIwMDApO1xyXG5cdFx0XHRcdHJldHVybiB3YWl0UHJvbWlzZTtcclxuXHRcdFx0fVxyXG5cdFx0KTtcclxuXHR9IGVsc2Uge1xyXG5cdFx0Ly8gLy8gU2V0IGhpZGRlbiB0YXNrIGFzIGRvbmUgc28gcHJvZ3Jlc3MgYmFyIGNhbiBjb21wbGV0ZT9cclxuXHRcdC8vIGxvYWREaWFsb2cuc2hvd1Rhc2tEb25lKDUpO1xyXG5cdH1cclxuXHJcblx0JC53aGVuKFxyXG5cdFx0bG9hZFRhbGtQcm9taXNlLFxyXG5cdFx0dGVtcGxhdGVEYXRhUHJvbWlzZSxcclxuXHRcdHJlZGlyZWN0Q2hlY2tQcm9taXNlLFxyXG5cdFx0c2hvdWxkR2V0T3JlcyAmJiBvcmVzUHJvbWlzZVxyXG5cdClcclxuXHRcdC50aGVuKFxyXG5cdFx0XHQvLyBBbGwgc3VjY2VkZWRcclxuXHRcdFx0ZnVuY3Rpb24odGFsa1dpa2l0ZXh0LCBiYW5uZXJzLCByZWRpcmVjdFRhcmdldCwgb3Jlc1ByZWRpY2l0aW9uICkge1xyXG5cdFx0XHRcdHZhciByZXN1bHQgPSB7XHJcblx0XHRcdFx0XHRzdWNjZXNzOiB0cnVlLFxyXG5cdFx0XHRcdFx0dGFsa3BhZ2U6IHRhbGtQYWdlLFxyXG5cdFx0XHRcdFx0dGFsa1dpa2l0ZXh0OiB0YWxrV2lraXRleHQsXHJcblx0XHRcdFx0XHRiYW5uZXJzOiBiYW5uZXJzXHJcblx0XHRcdFx0fTtcclxuXHRcdFx0XHRpZiAocmVkaXJlY3RUYXJnZXQpIHtcclxuXHRcdFx0XHRcdHJlc3VsdC5yZWRpcmVjdFRhcmdldCA9IHJlZGlyZWN0VGFyZ2V0O1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAob3Jlc1ByZWRpY2l0aW9uKSB7XHJcblx0XHRcdFx0XHRyZXN1bHQub3Jlc1ByZWRpY2l0aW9uID0gb3Jlc1ByZWRpY2l0aW9uO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHR3aW5kb3dNYW5hZ2VyLmNsb3NlV2luZG93KGxvYWREaWFsb2csIHJlc3VsdCk7XHJcblx0XHRcdFx0Y2FjaGUuY2xlYXJJbnZhbGlkSXRlbXMoKTtcclxuXHRcdFx0fSxcclxuXHRcdFx0Ly8gVGhlcmUgd2FzIGEgZmFpbHVyZS4gV2FpdCBhIGZldyBzZWNvbmRzLCB0aGVuIGNsb3NlIHRoZSBkaWFsb2dcclxuXHRcdFx0KCkgPT4gc2V0VGltZW91dCgoKT0+d2luZG93TWFuYWdlci5jbG9zZVdpbmRvdyhsb2FkRGlhbG9nKSwgMzAwMClcclxuXHRcdCk7XHJcblxyXG5cdGxvYWREaWFsb2dXaW4uY2xvc2VkLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xyXG5cdFx0aWYgKGRhdGEgJiYgZGF0YS5zdWNjZXNzKSB7XHJcblx0XHRcdHNldHVwQ29tcGxldGVkUHJvbWlzZS5yZXNvbHZlKGRhdGEpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0c2V0dXBDb21wbGV0ZWRQcm9taXNlLnJlamVjdCgpO1xyXG5cdFx0fVxyXG5cdH0pO1xyXG5cclxuXHRzZXR1cENvbXBsZXRlZFByb21pc2UudGhlbihkYXRhPT5jb25zb2xlLmxvZyhcInNldHVwIHdpbmRvdyBjbG9zZWRcIiwgZGF0YSkpO1xyXG5cclxuXHRyZXR1cm4gc2V0dXBDb21wbGV0ZWRQcm9taXNlO1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgc2V0dXBSYXRlcjsiLCIvLyBWYXJpb3VzIHV0aWxpdHkgZnVuY3Rpb25zIGFuZCBvYmplY3RzIHRoYXQgbWlnaHQgYmUgdXNlZCBpbiBtdWx0aXBsZSBwbGFjZXNcclxuXHJcbmltcG9ydCBjb25maWcgZnJvbSBcIi4vY29uZmlnXCI7XHJcblxyXG52YXIgaXNBZnRlckRhdGUgPSBmdW5jdGlvbihkYXRlU3RyaW5nKSB7XHJcblx0cmV0dXJuIG5ldyBEYXRlKGRhdGVTdHJpbmcpIDwgbmV3IERhdGUoKTtcclxufTtcclxuXHJcbnZhciBBUEkgPSBuZXcgbXcuQXBpKCB7XHJcblx0YWpheDoge1xyXG5cdFx0aGVhZGVyczogeyBcclxuXHRcdFx0XCJBcGktVXNlci1BZ2VudFwiOiBcIlJhdGVyL1wiICsgY29uZmlnLnNjcmlwdC52ZXJzaW9uICsgXHJcblx0XHRcdFx0XCIgKCBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9Vc2VyOkV2YWQzNy9SYXRlciApXCJcclxuXHRcdH1cclxuXHR9XHJcbn0gKTtcclxuLyogLS0tLS0tLS0tLSBBUEkgZm9yIE9SRVMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xyXG5BUEkuZ2V0T1JFUyA9IGZ1bmN0aW9uKHJldmlzaW9uSUQpIHtcclxuXHRyZXR1cm4gJC5nZXQoXCJodHRwczovL29yZXMud2lraW1lZGlhLm9yZy92My9zY29yZXMvZW53aWtpP21vZGVscz13cDEwJnJldmlkcz1cIityZXZpc2lvbklEKTtcclxufTtcclxuLyogLS0tLS0tLS0tLSBSYXcgd2lraXRleHQgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xyXG5BUEkuZ2V0UmF3ID0gZnVuY3Rpb24ocGFnZSkge1xyXG5cdHZhciByZXF1ZXN0ID0gJC5nZXQoXCJodHRwczpcIiArIGNvbmZpZy5tdy53Z1NlcnZlciArIG13LnV0aWwuZ2V0VXJsKHBhZ2UsIHthY3Rpb246XCJyYXdcIn0pKVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24oZGF0YSkge1xyXG5cdFx0XHRpZiAoICFkYXRhICkge1xyXG5cdFx0XHRcdHJldHVybiAkLkRlZmVycmVkKCkucmVqZWN0KFwib2stYnV0LWVtcHR5XCIpO1xyXG5cdFx0XHR9XHJcblx0XHR9LCBmdW5jdGlvbigpIHtcclxuXHRcdFx0dmFyIHN0YXR1cyA9IHJlcXVlc3QuZ2V0UmVzcG9uc2VIZWFkZXIoXCJzdGF0dXNcIik7XHJcblx0XHRcdHJldHVybiAkLkRlZmVycmVkKCkucmVqZWN0KFwiaHR0cFwiLCB7dGV4dHN0YXR1czogc3RhdHVzIHx8IFwidW5rbm93blwifSk7XHJcblx0XHR9KTtcclxuXHRyZXR1cm4gcmVxdWVzdDtcclxufTtcclxuXHJcbnZhciBtYWtlRXJyb3JNc2cgPSBmdW5jdGlvbihjb2RlLCBqcXhocikge1xyXG5cdHZhciBkZXRhaWxzID0gXCJcIjtcclxuXHRpZiAoIGNvZGUgPT09IFwiaHR0cFwiICYmIGpxeGhyLnRleHRTdGF0dXMgPT09IFwiZXJyb3JcIiApIHtcclxuXHRcdGRldGFpbHMgPSBcIkhUVFAgZXJyb3IgXCIgKyBqcXhoci54aHIuc3RhdHVzO1xyXG5cdH0gZWxzZSBpZiAoIGNvZGUgPT09IFwiaHR0cFwiICkge1xyXG5cdFx0ZGV0YWlscyA9IFwiSFRUUCBlcnJvcjogXCIgKyBqcXhoci50ZXh0U3RhdHVzO1xyXG5cdH0gZWxzZSBpZiAoIGNvZGUgPT09IFwib2stYnV0LWVtcHR5XCIgKSB7XHJcblx0XHRkZXRhaWxzID0gXCJFcnJvcjogR290IGFuIGVtcHR5IHJlc3BvbnNlIGZyb20gdGhlIHNlcnZlclwiO1xyXG5cdH0gZWxzZSB7XHJcblx0XHRkZXRhaWxzID0gXCJBUEkgZXJyb3I6IFwiICsgY29kZTtcclxuXHR9XHJcblx0cmV0dXJuIGRldGFpbHM7XHJcbn07XHJcblxyXG5leHBvcnQge2lzQWZ0ZXJEYXRlLCBBUEksIG1ha2VFcnJvck1zZ307Il19
