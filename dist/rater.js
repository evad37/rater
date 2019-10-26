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

},{"./autostart":5,"./css.js":8,"./setup":10,"./util":11,"./windowManager":12}],2:[function(require,module,exports){
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
 * @return {Promise<Template[]>}
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

},{"./cache":6,"./config":7,"./util":11}],3:[function(require,module,exports){
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
LoadDialog["static"].name = "loadDialog"; // Specify a title statically (or, alternatively, with data passed to the opening() method).

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
    if (data.ores) {
      _this2.setuptasks[5].toggle();
    }

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
};

var _default = LoadDialog;
exports["default"] = _default;

},{"../util":11}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

// Stub code, based on the example from https://www.mediawiki.org/wiki/OOUI/Windows/Window_managers
function MainWindow(config) {
  MainWindow["super"].call(this, config);
}

OO.inheritClass(MainWindow, OO.ui.Dialog); // Specify a symbolic name (e.g., 'simple', in this example) using the static 'name' property.

MainWindow["static"].name = "main";
MainWindow["static"].title = "Rater";

MainWindow.prototype.initialize = function () {
  MainWindow["super"].prototype.initialize.call(this);
  this.content = new OO.ui.PanelLayout({
    padded: true,
    expanded: false
  });
  this.content.$element.append("<p>The window manager references this window by its symbolic name ('simple'). The symbolic name is specified with the dialog class's static 'name' property. A factory is used to instantiate the window and add it to the window manager when it is needed.</p>");
  this.$body.append(this.content.$element);
};

var _default = MainWindow;
exports["default"] = _default;

},{}],5:[function(require,module,exports){
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

},{"./config":7,"./setup":10,"./util":11}],6:[function(require,module,exports){
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

},{"./util":11}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.diffStyles = void 0;
// Attribution: Diff styles from <https://en.wikipedia.org/wiki/Wikipedia:AutoWikiBrowser/style.css>
var diffStyles = "table.diff, td.diff-otitle, td.diff-ntitle { background-color: white; }\ntd.diff-otitle, td.diff-ntitle { text-align: center; }\ntd.diff-marker { text-align: right; font-weight: bold; font-size: 1.25em; }\ntd.diff-lineno { font-weight: bold; }\ntd.diff-addedline, td.diff-deletedline, td.diff-context { font-size: 88%; vertical-align: top; white-space: -moz-pre-wrap; white-space: pre-wrap; }\ntd.diff-addedline, td.diff-deletedline { border-style: solid; border-width: 1px 1px 1px 4px; border-radius: 0.33em; }\ntd.diff-addedline { border-color: #a3d3ff; }\ntd.diff-deletedline { border-color: #ffe49c; }\ntd.diff-context { background: #f3f3f3; color: #333333; border-style: solid; border-width: 1px 1px 1px 4px; border-color: #e6e6e6; border-radius: 0.33em; }\n.diffchange { font-weight: bold; text-decoration: none; }\ntable.diff {\n    border: none;\n    width: 98%; border-spacing: 4px;\n    table-layout: fixed; /* Ensures that colums are of equal width */\n}\ntd.diff-addedline .diffchange, td.diff-deletedline .diffchange { border-radius: 0.33em; padding: 0.25em 0; }\ntd.diff-addedline .diffchange {\tbackground: #d8ecff; }\ntd.diff-deletedline .diffchange { background: #feeec8; }\ntable.diff td {\tpadding: 0.33em 0.66em; }\ntable.diff col.diff-marker { width: 2%; }\ntable.diff col.diff-content { width: 48%; }\ntable.diff td div {\n    /* Force-wrap very long lines such as URLs or page-widening char strings. */\n    word-wrap: break-word;\n    /* As fallback (FF<3.5, Opera <10.5), scrollbars will be added for very wide cells\n        instead of text overflowing or widening */\n    overflow: auto;\n}";
exports.diffStyles = diffStyles;

},{}],9:[function(require,module,exports){
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

},{"./cache":6,"./util":11}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _config = _interopRequireDefault(require("./config"));

var _util = require("./util");

var _Template = require("./Template");

var _getBanners = _interopRequireDefault(require("./getBanners"));

var cache = _interopRequireWildcard(require("./cache"));

var _windowManager = _interopRequireDefault(require("./windowManager"));

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
  var subjectPage = currentPage && currentPage.getSubjectPage(); // Get lists of all banners (task 1)

  var bannersPromise = (0, _getBanners["default"])(); // Load talk page (task 2)

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
  }); // Retrieve and store TemplateData (task 4)

  var templateDataPromise = parseTalkPromise.then(function (templates) {
    templates.forEach(function (template) {
      return template.setParamDataAndSuggestions();
    });
    return templates;
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
    promises: [bannersPromise, loadTalkPromise, parseTalkPromise, templateDataPromise, redirectCheckPromise, shouldGetOres && oresPromise],
    ores: shouldGetOres,
    isOpened: isOpenedPromise
  });

  loadDialogWin.opened.then(isOpenedPromise.resolve);
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

},{"./Template":2,"./cache":6,"./config":7,"./getBanners":9,"./util":11,"./windowManager":12}],11:[function(require,module,exports){
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

},{"./config":7}],12:[function(require,module,exports){
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

},{"./Windows/LoadDialog":3,"./Windows/MainWindow":4}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJyYXRlci1zcmMvQXBwLmpzIiwicmF0ZXItc3JjL1RlbXBsYXRlLmpzIiwicmF0ZXItc3JjL1dpbmRvd3MvTG9hZERpYWxvZy5qcyIsInJhdGVyLXNyYy9XaW5kb3dzL01haW5XaW5kb3cuanMiLCJyYXRlci1zcmMvYXV0b3N0YXJ0LmpzIiwicmF0ZXItc3JjL2NhY2hlLmpzIiwicmF0ZXItc3JjL2NvbmZpZy5qcyIsInJhdGVyLXNyYy9jc3MuanMiLCJyYXRlci1zcmMvZ2V0QmFubmVycy5qcyIsInJhdGVyLXNyYy9zZXR1cC5qcyIsInJhdGVyLXNyYy91dGlsLmpzIiwicmF0ZXItc3JjL3dpbmRvd01hbmFnZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7O0FBRUEsQ0FBQyxTQUFTLEdBQVQsR0FBZTtBQUNmLEVBQUEsT0FBTyxDQUFDLEdBQVIsQ0FBWSw4QkFBWjtBQUVBLEVBQUEsRUFBRSxDQUFDLElBQUgsQ0FBUSxNQUFSLENBQWUsZUFBZjs7QUFFQSxNQUFNLGNBQWMsR0FBRyxTQUFqQixjQUFpQixDQUFBLElBQUksRUFBSTtBQUM5QixRQUFJLENBQUMsSUFBRCxJQUFTLENBQUMsSUFBSSxDQUFDLE9BQW5CLEVBQTRCO0FBQzNCO0FBQ0E7O0FBRUQsOEJBQWMsVUFBZCxDQUF5QixNQUF6QixFQUFpQyxJQUFqQztBQUNBLEdBTkQ7O0FBUUEsTUFBTSxjQUFjLEdBQUcsU0FBakIsY0FBaUIsQ0FBQyxJQUFELEVBQU8sS0FBUDtBQUFBLFdBQWlCLEVBQUUsQ0FBQyxFQUFILENBQU0sS0FBTixDQUN2Qyx3QkFBYSxJQUFiLEVBQW1CLEtBQW5CLENBRHVDLEVBQ1o7QUFDMUIsTUFBQSxLQUFLLEVBQUU7QUFEbUIsS0FEWSxDQUFqQjtBQUFBLEdBQXZCLENBYmUsQ0FtQmY7OztBQUNBLEVBQUEsRUFBRSxDQUFD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b3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiaW1wb3J0IHNldHVwUmF0ZXIgZnJvbSBcIi4vc2V0dXBcIjtcclxuaW1wb3J0IGF1dG9TdGFydCBmcm9tIFwiLi9hdXRvc3RhcnRcIjtcclxuaW1wb3J0IGRpZmZTdHlsZXMgZnJvbSBcIi4vY3NzLmpzXCI7XHJcbmltcG9ydCB7IG1ha2VFcnJvck1zZyB9IGZyb20gXCIuL3V0aWxcIjtcclxuaW1wb3J0IHdpbmRvd01hbmFnZXIgZnJvbSBcIi4vd2luZG93TWFuYWdlclwiO1xyXG5cclxuKGZ1bmN0aW9uIEFwcCgpIHtcclxuXHRjb25zb2xlLmxvZyhcIlJhdGVyJ3MgQXBwLmpzIGlzIHJ1bm5pbmcuLi5cIik7XHJcblxyXG5cdG13LnV0aWwuYWRkQ1NTKGRpZmZTdHlsZXMpO1xyXG5cclxuXHRjb25zdCBzaG93TWFpbldpbmRvdyA9IGRhdGEgPT4ge1xyXG5cdFx0aWYgKCFkYXRhIHx8ICFkYXRhLnN1Y2Nlc3MpIHtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cclxuXHRcdHdpbmRvd01hbmFnZXIub3BlbldpbmRvdyhcIm1haW5cIiwgZGF0YSk7XHJcblx0fTtcclxuXHJcblx0Y29uc3Qgc2hvd1NldHVwRXJyb3IgPSAoY29kZSwganF4aHIpID0+IE9PLnVpLmFsZXJ0KFxyXG5cdFx0bWFrZUVycm9yTXNnKGNvZGUsIGpxeGhyKSxcdHtcclxuXHRcdFx0dGl0bGU6IFwiUmF0ZXIgZmFpbGVkIHRvIG9wZW5cIlxyXG5cdFx0fVxyXG5cdCk7XHJcblxyXG5cdC8vIEludm9jYXRpb24gYnkgcG9ydGxldCBsaW5rIFxyXG5cdG13LnV0aWwuYWRkUG9ydGxldExpbmsoXHJcblx0XHRcInAtY2FjdGlvbnNcIixcclxuXHRcdFwiI1wiLFxyXG5cdFx0XCJSYXRlclwiLFxyXG5cdFx0XCJjYS1yYXRlclwiLFxyXG5cdFx0XCJSYXRlIHF1YWxpdHkgYW5kIGltcG9ydGFuY2VcIixcclxuXHRcdFwiNVwiXHJcblx0KTtcclxuXHQkKFwiI2NhLXJhdGVyXCIpLmNsaWNrKCgpID0+IHNldHVwUmF0ZXIoKS50aGVuKHNob3dNYWluV2luZG93LCBzaG93U2V0dXBFcnJvcikgKTtcclxuXHJcblx0Ly8gSW52b2NhdGlvbiBieSBhdXRvLXN0YXJ0IChkbyBub3Qgc2hvdyBtZXNzYWdlIG9uIGVycm9yKVxyXG5cdGF1dG9TdGFydCgpLnRoZW4oc2hvd01haW5XaW5kb3cpO1xyXG59KSgpOyIsImltcG9ydCB7QVBJLCBpc0FmdGVyRGF0ZX0gZnJvbSBcIi4vdXRpbFwiO1xyXG5pbXBvcnQgY29uZmlnIGZyb20gXCIuL2NvbmZpZ1wiO1xyXG5pbXBvcnQgKiBhcyBjYWNoZSBmcm9tIFwiLi9jYWNoZVwiO1xyXG5cclxuLyoqIFRlbXBsYXRlXHJcbiAqXHJcbiAqIEBjbGFzc1xyXG4gKiBSZXByZXNlbnRzIHRoZSB3aWtpdGV4dCBvZiB0ZW1wbGF0ZSB0cmFuc2NsdXNpb24uIFVzZWQgYnkgI3BhcnNlVGVtcGxhdGVzLlxyXG4gKiBAcHJvcCB7U3RyaW5nfSBuYW1lIE5hbWUgb2YgdGhlIHRlbXBsYXRlXHJcbiAqIEBwcm9wIHtTdHJpbmd9IHdpa2l0ZXh0IEZ1bGwgd2lraXRleHQgb2YgdGhlIHRyYW5zY2x1c2lvblxyXG4gKiBAcHJvcCB7T2JqZWN0W119IHBhcmFtZXRlcnMgUGFyYW1ldGVycyB1c2VkIGluIHRoZSB0cmFuc2xjdXNpb24sIGluIG9yZGVyLCBvZiBmb3JtOlxyXG5cdHtcclxuXHRcdG5hbWU6IHtTdHJpbmd8TnVtYmVyfSBwYXJhbWV0ZXIgbmFtZSwgb3IgcG9zaXRpb24gZm9yIHVubmFtZWQgcGFyYW1ldGVycyxcclxuXHRcdHZhbHVlOiB7U3RyaW5nfSBXaWtpdGV4dCBwYXNzZWQgdG8gdGhlIHBhcmFtZXRlciAod2hpdGVzcGFjZSB0cmltbWVkKSxcclxuXHRcdHdpa2l0ZXh0OiB7U3RyaW5nfSBGdWxsIHdpa2l0ZXh0IChpbmNsdWRpbmcgbGVhZGluZyBwaXBlLCBwYXJhbWV0ZXIgbmFtZS9lcXVhbHMgc2lnbiAoaWYgYXBwbGljYWJsZSksIHZhbHVlLCBhbmQgYW55IHdoaXRlc3BhY2UpXHJcblx0fVxyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtIHtTdHJpbmd9IHdpa2l0ZXh0IFdpa2l0ZXh0IG9mIGEgdGVtcGxhdGUgdHJhbnNjbHVzaW9uLCBzdGFydGluZyB3aXRoICd7eycgYW5kIGVuZGluZyB3aXRoICd9fScuXHJcbiAqL1xyXG52YXIgVGVtcGxhdGUgPSBmdW5jdGlvbih3aWtpdGV4dCkge1xyXG5cdHRoaXMud2lraXRleHQgPSB3aWtpdGV4dDtcclxuXHR0aGlzLnBhcmFtZXRlcnMgPSBbXTtcclxufTtcclxuVGVtcGxhdGUucHJvdG90eXBlLmFkZFBhcmFtID0gZnVuY3Rpb24obmFtZSwgdmFsLCB3aWtpdGV4dCkge1xyXG5cdHRoaXMucGFyYW1ldGVycy5wdXNoKHtcclxuXHRcdFwibmFtZVwiOiBuYW1lLFxyXG5cdFx0XCJ2YWx1ZVwiOiB2YWwsIFxyXG5cdFx0XCJ3aWtpdGV4dFwiOiBcInxcIiArIHdpa2l0ZXh0XHJcblx0fSk7XHJcbn07XHJcbi8qKlxyXG4gKiBHZXQgYSBwYXJhbWV0ZXIgZGF0YSBieSBwYXJhbWV0ZXIgbmFtZVxyXG4gKi8gXHJcblRlbXBsYXRlLnByb3RvdHlwZS5nZXRQYXJhbSA9IGZ1bmN0aW9uKHBhcmFtTmFtZSkge1xyXG5cdHJldHVybiB0aGlzLnBhcmFtZXRlcnMuZmluZChmdW5jdGlvbihwKSB7IHJldHVybiBwLm5hbWUgPT0gcGFyYW1OYW1lOyB9KTtcclxufTtcclxuVGVtcGxhdGUucHJvdG90eXBlLnNldE5hbWUgPSBmdW5jdGlvbihuYW1lKSB7XHJcblx0dGhpcy5uYW1lID0gbmFtZS50cmltKCk7XHJcbn07XHJcblRlbXBsYXRlLnByb3RvdHlwZS5nZXRUaXRsZSA9IGZ1bmN0aW9uKCkge1xyXG5cdHJldHVybiBtdy5UaXRsZS5uZXdGcm9tVGV4dChcIlRlbXBsYXRlOlwiICsgdGhpcy5uYW1lKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBwYXJzZVRlbXBsYXRlc1xyXG4gKlxyXG4gKiBQYXJzZXMgdGVtcGxhdGVzIGZyb20gd2lraXRleHQuXHJcbiAqIEJhc2VkIG9uIFNEMDAwMSdzIHZlcnNpb24gYXQgPGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1VzZXI6U0QwMDAxL3BhcnNlQWxsVGVtcGxhdGVzLmpzPi5cclxuICogUmV0dXJucyBhbiBhcnJheSBjb250YWluaW5nIHRoZSB0ZW1wbGF0ZSBkZXRhaWxzOlxyXG4gKiAgdmFyIHRlbXBsYXRlcyA9IHBhcnNlVGVtcGxhdGVzKFwiSGVsbG8ge3tmb28gfEJhcnxiYXo9cXV4IHwyPWxvcmVtaXBzdW18Mz19fSB3b3JsZFwiKTtcclxuICogIGNvbnNvbGUubG9nKHRlbXBsYXRlc1swXSk7IC8vIC0tPiBvYmplY3RcclxuXHR7XHJcblx0XHRuYW1lOiBcImZvb1wiLFxyXG5cdFx0d2lraXRleHQ6XCJ7e2ZvbyB8QmFyfGJhej1xdXggfCAyID0gbG9yZW1pcHN1bSAgfDM9fX1cIixcclxuXHRcdHBhcmFtZXRlcnM6IFtcclxuXHRcdFx0e1xyXG5cdFx0XHRcdG5hbWU6IDEsXHJcblx0XHRcdFx0dmFsdWU6ICdCYXInLFxyXG5cdFx0XHRcdHdpa2l0ZXh0OiAnfEJhcidcclxuXHRcdFx0fSxcclxuXHRcdFx0e1xyXG5cdFx0XHRcdG5hbWU6ICdiYXonLFxyXG5cdFx0XHRcdHZhbHVlOiAncXV4JyxcclxuXHRcdFx0XHR3aWtpdGV4dDogJ3xiYXo9cXV4ICdcclxuXHRcdFx0fSxcclxuXHRcdFx0e1xyXG5cdFx0XHRcdG5hbWU6ICcyJyxcclxuXHRcdFx0XHR2YWx1ZTogJ2xvcmVtaXBzdW0nLFxyXG5cdFx0XHRcdHdpa2l0ZXh0OiAnfCAyID0gbG9yZW1pcHN1bSAgJ1xyXG5cdFx0XHR9LFxyXG5cdFx0XHR7XHJcblx0XHRcdFx0bmFtZTogJzMnLFxyXG5cdFx0XHRcdHZhbHVlOiAnJyxcclxuXHRcdFx0XHR3aWtpdGV4dDogJ3wzPSdcclxuXHRcdFx0fVxyXG5cdFx0XSxcclxuXHRcdGdldFBhcmFtOiBmdW5jdGlvbihwYXJhbU5hbWUpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMucGFyYW1ldGVycy5maW5kKGZ1bmN0aW9uKHApIHsgcmV0dXJuIHAubmFtZSA9PSBwYXJhbU5hbWU7IH0pO1xyXG5cdFx0fVxyXG5cdH1cclxuICogICAgXHJcbiAqIFxyXG4gKiBAcGFyYW0ge1N0cmluZ30gd2lraXRleHRcclxuICogQHBhcmFtIHtCb29sZWFufSByZWN1cnNpdmUgU2V0IHRvIGB0cnVlYCB0byBhbHNvIHBhcnNlIHRlbXBsYXRlcyB0aGF0IG9jY3VyIHdpdGhpbiBvdGhlciB0ZW1wbGF0ZXMsXHJcbiAqICByYXRoZXIgdGhhbiBqdXN0IHRvcC1sZXZlbCB0ZW1wbGF0ZXMuIFxyXG4gKiBAcmV0dXJuIHtUZW1wbGF0ZVtdfSB0ZW1wbGF0ZXNcclxuKi9cclxudmFyIHBhcnNlVGVtcGxhdGVzID0gZnVuY3Rpb24od2lraXRleHQsIHJlY3Vyc2l2ZSkgeyAvKiBlc2xpbnQtZGlzYWJsZSBuby1jb250cm9sLXJlZ2V4ICovXHJcblx0aWYgKCF3aWtpdGV4dCkge1xyXG5cdFx0cmV0dXJuIFtdO1xyXG5cdH1cclxuXHR2YXIgc3RyUmVwbGFjZUF0ID0gZnVuY3Rpb24oc3RyaW5nLCBpbmRleCwgY2hhcikge1xyXG5cdFx0cmV0dXJuIHN0cmluZy5zbGljZSgwLGluZGV4KSArIGNoYXIgKyBzdHJpbmcuc2xpY2UoaW5kZXggKyAxKTtcclxuXHR9O1xyXG5cclxuXHR2YXIgcmVzdWx0ID0gW107XHJcblx0XHJcblx0dmFyIHByb2Nlc3NUZW1wbGF0ZVRleHQgPSBmdW5jdGlvbiAoc3RhcnRJZHgsIGVuZElkeCkge1xyXG5cdFx0dmFyIHRleHQgPSB3aWtpdGV4dC5zbGljZShzdGFydElkeCwgZW5kSWR4KTtcclxuXHJcblx0XHR2YXIgdGVtcGxhdGUgPSBuZXcgVGVtcGxhdGUoXCJ7e1wiICsgdGV4dC5yZXBsYWNlKC9cXHgwMS9nLFwifFwiKSArIFwifX1cIik7XHJcblx0XHRcclxuXHRcdC8vIHN3YXAgb3V0IHBpcGUgaW4gbGlua3Mgd2l0aCBcXHgwMSBjb250cm9sIGNoYXJhY3RlclxyXG5cdFx0Ly8gW1tGaWxlOiBdXSBjYW4gaGF2ZSBtdWx0aXBsZSBwaXBlcywgc28gbWlnaHQgbmVlZCBtdWx0aXBsZSBwYXNzZXNcclxuXHRcdHdoaWxlICggLyhcXFtcXFtbXlxcXV0qPylcXHwoLio/XFxdXFxdKS9nLnRlc3QodGV4dCkgKSB7XHJcblx0XHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UoLyhcXFtcXFtbXlxcXV0qPylcXHwoLio/XFxdXFxdKS9nLCBcIiQxXFx4MDEkMlwiKTtcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgY2h1bmtzID0gdGV4dC5zcGxpdChcInxcIikubWFwKGZ1bmN0aW9uKGNodW5rKSB7XHJcblx0XHRcdC8vIGNoYW5nZSAnXFx4MDEnIGNvbnRyb2wgY2hhcmFjdGVycyBiYWNrIHRvIHBpcGVzXHJcblx0XHRcdHJldHVybiBjaHVuay5yZXBsYWNlKC9cXHgwMS9nLFwifFwiKTsgXHJcblx0XHR9KTtcclxuXHJcblx0XHR0ZW1wbGF0ZS5zZXROYW1lKGNodW5rc1swXSk7XHJcblx0XHRcclxuXHRcdHZhciBwYXJhbWV0ZXJDaHVua3MgPSBjaHVua3Muc2xpY2UoMSk7XHJcblxyXG5cdFx0dmFyIHVubmFtZWRJZHggPSAxO1xyXG5cdFx0cGFyYW1ldGVyQ2h1bmtzLmZvckVhY2goZnVuY3Rpb24oY2h1bmspIHtcclxuXHRcdFx0dmFyIGluZGV4T2ZFcXVhbFRvID0gY2h1bmsuaW5kZXhPZihcIj1cIik7XHJcblx0XHRcdHZhciBpbmRleE9mT3BlbkJyYWNlcyA9IGNodW5rLmluZGV4T2YoXCJ7e1wiKTtcclxuXHRcdFx0XHJcblx0XHRcdHZhciBpc1dpdGhvdXRFcXVhbHMgPSAhY2h1bmsuaW5jbHVkZXMoXCI9XCIpO1xyXG5cdFx0XHR2YXIgaGFzQnJhY2VzQmVmb3JlRXF1YWxzID0gY2h1bmsuaW5jbHVkZXMoXCJ7e1wiKSAmJiBpbmRleE9mT3BlbkJyYWNlcyA8IGluZGV4T2ZFcXVhbFRvO1x0XHJcblx0XHRcdHZhciBpc1VubmFtZWRQYXJhbSA9ICggaXNXaXRob3V0RXF1YWxzIHx8IGhhc0JyYWNlc0JlZm9yZUVxdWFscyApO1xyXG5cdFx0XHRcclxuXHRcdFx0dmFyIHBOYW1lLCBwTnVtLCBwVmFsO1xyXG5cdFx0XHRpZiAoIGlzVW5uYW1lZFBhcmFtICkge1xyXG5cdFx0XHRcdC8vIEdldCB0aGUgbmV4dCBudW1iZXIgbm90IGFscmVhZHkgdXNlZCBieSBlaXRoZXIgYW4gdW5uYW1lZCBwYXJhbWV0ZXIsIG9yIGJ5IGFcclxuXHRcdFx0XHQvLyBuYW1lZCBwYXJhbWV0ZXIgbGlrZSBgfDE9dmFsYFxyXG5cdFx0XHRcdHdoaWxlICggdGVtcGxhdGUuZ2V0UGFyYW0odW5uYW1lZElkeCkgKSB7XHJcblx0XHRcdFx0XHR1bm5hbWVkSWR4Kys7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHBOdW0gPSB1bm5hbWVkSWR4O1xyXG5cdFx0XHRcdHBWYWwgPSBjaHVuay50cmltKCk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0cE5hbWUgPSBjaHVuay5zbGljZSgwLCBpbmRleE9mRXF1YWxUbykudHJpbSgpO1xyXG5cdFx0XHRcdHBWYWwgPSBjaHVuay5zbGljZShpbmRleE9mRXF1YWxUbyArIDEpLnRyaW0oKTtcclxuXHRcdFx0fVxyXG5cdFx0XHR0ZW1wbGF0ZS5hZGRQYXJhbShwTmFtZSB8fCBwTnVtLCBwVmFsLCBjaHVuayk7XHJcblx0XHR9KTtcclxuXHRcdFxyXG5cdFx0cmVzdWx0LnB1c2godGVtcGxhdGUpO1xyXG5cdH07XHJcblxyXG5cdFxyXG5cdHZhciBuID0gd2lraXRleHQubGVuZ3RoO1xyXG5cdFxyXG5cdC8vIG51bWJlciBvZiB1bmNsb3NlZCBicmFjZXNcclxuXHR2YXIgbnVtVW5jbG9zZWQgPSAwO1xyXG5cclxuXHQvLyBhcmUgd2UgaW5zaWRlIGEgY29tbWVudCBvciBiZXR3ZWVuIG5vd2lraSB0YWdzP1xyXG5cdHZhciBpbkNvbW1lbnQgPSBmYWxzZTtcclxuXHR2YXIgaW5Ob3dpa2kgPSBmYWxzZTtcclxuXHJcblx0dmFyIHN0YXJ0SWR4LCBlbmRJZHg7XHJcblx0XHJcblx0Zm9yICh2YXIgaT0wOyBpPG47IGkrKykge1xyXG5cdFx0XHJcblx0XHRpZiAoICFpbkNvbW1lbnQgJiYgIWluTm93aWtpICkge1xyXG5cdFx0XHRcclxuXHRcdFx0aWYgKHdpa2l0ZXh0W2ldID09PSBcIntcIiAmJiB3aWtpdGV4dFtpKzFdID09PSBcIntcIikge1xyXG5cdFx0XHRcdGlmIChudW1VbmNsb3NlZCA9PT0gMCkge1xyXG5cdFx0XHRcdFx0c3RhcnRJZHggPSBpKzI7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdG51bVVuY2xvc2VkICs9IDI7XHJcblx0XHRcdFx0aSsrO1xyXG5cdFx0XHR9IGVsc2UgaWYgKHdpa2l0ZXh0W2ldID09PSBcIn1cIiAmJiB3aWtpdGV4dFtpKzFdID09PSBcIn1cIikge1xyXG5cdFx0XHRcdGlmIChudW1VbmNsb3NlZCA9PT0gMikge1xyXG5cdFx0XHRcdFx0ZW5kSWR4ID0gaTtcclxuXHRcdFx0XHRcdHByb2Nlc3NUZW1wbGF0ZVRleHQoc3RhcnRJZHgsIGVuZElkeCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdG51bVVuY2xvc2VkIC09IDI7XHJcblx0XHRcdFx0aSsrO1xyXG5cdFx0XHR9IGVsc2UgaWYgKHdpa2l0ZXh0W2ldID09PSBcInxcIiAmJiBudW1VbmNsb3NlZCA+IDIpIHtcclxuXHRcdFx0XHQvLyBzd2FwIG91dCBwaXBlcyBpbiBuZXN0ZWQgdGVtcGxhdGVzIHdpdGggXFx4MDEgY2hhcmFjdGVyXHJcblx0XHRcdFx0d2lraXRleHQgPSBzdHJSZXBsYWNlQXQod2lraXRleHQsIGksXCJcXHgwMVwiKTtcclxuXHRcdFx0fSBlbHNlIGlmICggL148IS0tLy50ZXN0KHdpa2l0ZXh0LnNsaWNlKGksIGkgKyA0KSkgKSB7XHJcblx0XHRcdFx0aW5Db21tZW50ID0gdHJ1ZTtcclxuXHRcdFx0XHRpICs9IDM7XHJcblx0XHRcdH0gZWxzZSBpZiAoIC9ePG5vd2lraSA/Pi8udGVzdCh3aWtpdGV4dC5zbGljZShpLCBpICsgOSkpICkge1xyXG5cdFx0XHRcdGluTm93aWtpID0gdHJ1ZTtcclxuXHRcdFx0XHRpICs9IDc7XHJcblx0XHRcdH0gXHJcblxyXG5cdFx0fSBlbHNlIHsgLy8gd2UgYXJlIGluIGEgY29tbWVudCBvciBub3dpa2lcclxuXHRcdFx0aWYgKHdpa2l0ZXh0W2ldID09PSBcInxcIikge1xyXG5cdFx0XHRcdC8vIHN3YXAgb3V0IHBpcGVzIHdpdGggXFx4MDEgY2hhcmFjdGVyXHJcblx0XHRcdFx0d2lraXRleHQgPSBzdHJSZXBsYWNlQXQod2lraXRleHQsIGksXCJcXHgwMVwiKTtcclxuXHRcdFx0fSBlbHNlIGlmICgvXi0tPi8udGVzdCh3aWtpdGV4dC5zbGljZShpLCBpICsgMykpKSB7XHJcblx0XHRcdFx0aW5Db21tZW50ID0gZmFsc2U7XHJcblx0XHRcdFx0aSArPSAyO1xyXG5cdFx0XHR9IGVsc2UgaWYgKC9ePFxcL25vd2lraSA/Pi8udGVzdCh3aWtpdGV4dC5zbGljZShpLCBpICsgMTApKSkge1xyXG5cdFx0XHRcdGluTm93aWtpID0gZmFsc2U7XHJcblx0XHRcdFx0aSArPSA4O1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdH1cclxuXHRcclxuXHRpZiAoIHJlY3Vyc2l2ZSApIHtcclxuXHRcdHZhciBzdWJ0ZW1wbGF0ZXMgPSByZXN1bHQubWFwKGZ1bmN0aW9uKHRlbXBsYXRlKSB7XHJcblx0XHRcdHJldHVybiB0ZW1wbGF0ZS53aWtpdGV4dC5zbGljZSgyLC0yKTtcclxuXHRcdH0pXHJcblx0XHRcdC5maWx0ZXIoZnVuY3Rpb24odGVtcGxhdGVXaWtpdGV4dCkge1xyXG5cdFx0XHRcdHJldHVybiAvXFx7XFx7LipcXH1cXH0vLnRlc3QodGVtcGxhdGVXaWtpdGV4dCk7XHJcblx0XHRcdH0pXHJcblx0XHRcdC5tYXAoZnVuY3Rpb24odGVtcGxhdGVXaWtpdGV4dCkge1xyXG5cdFx0XHRcdHJldHVybiBwYXJzZVRlbXBsYXRlcyh0ZW1wbGF0ZVdpa2l0ZXh0LCB0cnVlKTtcclxuXHRcdFx0fSk7XHJcblx0XHRcclxuXHRcdHJldHVybiByZXN1bHQuY29uY2F0LmFwcGx5KHJlc3VsdCwgc3VidGVtcGxhdGVzKTtcclxuXHR9XHJcblxyXG5cdHJldHVybiByZXN1bHQ7IFxyXG59OyAvKiBlc2xpbnQtZW5hYmxlIG5vLWNvbnRyb2wtcmVnZXggKi9cclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge1RlbXBsYXRlfFRlbXBsYXRlW119IHRlbXBsYXRlc1xyXG4gKiBAcmV0dXJuIHtQcm9taXNlPFRlbXBsYXRlW10+fVxyXG4gKi9cclxudmFyIGdldFdpdGhSZWRpcmVjdFRvID0gZnVuY3Rpb24odGVtcGxhdGVzKSB7XHJcblx0dmFyIHRlbXBsYXRlc0FycmF5ID0gQXJyYXkuaXNBcnJheSh0ZW1wbGF0ZXMpID8gdGVtcGxhdGVzIDogW3RlbXBsYXRlc107XHJcblx0aWYgKHRlbXBsYXRlc0FycmF5Lmxlbmd0aCA9PT0gMCkge1xyXG5cdFx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZXNvbHZlKFtdKTtcclxuXHR9XHJcblxyXG5cdHJldHVybiBBUEkuZ2V0KHtcclxuXHRcdFwiYWN0aW9uXCI6IFwicXVlcnlcIixcclxuXHRcdFwiZm9ybWF0XCI6IFwianNvblwiLFxyXG5cdFx0XCJ0aXRsZXNcIjogdGVtcGxhdGVzQXJyYXkubWFwKHRlbXBsYXRlID0+IHRlbXBsYXRlLmdldFRpdGxlKCkuZ2V0UHJlZml4ZWRUZXh0KCkpLFxyXG5cdFx0XCJyZWRpcmVjdHNcIjogMVxyXG5cdH0pLnRoZW4oZnVuY3Rpb24ocmVzdWx0KSB7XHJcblx0XHRpZiAoICFyZXN1bHQgfHwgIXJlc3VsdC5xdWVyeSApIHtcclxuXHRcdFx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3QoXCJFbXB0eSByZXNwb25zZVwiKTtcclxuXHRcdH1cclxuXHRcdGlmICggcmVzdWx0LnF1ZXJ5LnJlZGlyZWN0cyApIHtcclxuXHRcdFx0cmVzdWx0LnF1ZXJ5LnJlZGlyZWN0cy5mb3JFYWNoKGZ1bmN0aW9uKHJlZGlyZWN0KSB7XHJcblx0XHRcdFx0dmFyIGkgPSB0ZW1wbGF0ZXNBcnJheS5maW5kSW5kZXgodGVtcGxhdGUgPT4gdGVtcGxhdGUuZ2V0VGl0bGUoKS5nZXRQcmVmaXhlZFRleHQoKSA9PT0gcmVkaXJlY3QuZnJvbSk7XHJcblx0XHRcdFx0aWYgKGkgIT09IC0xKSB7XHJcblx0XHRcdFx0XHR0ZW1wbGF0ZXNBcnJheVtpXS5yZWRpcmVjdHNUbyA9IG13LlRpdGxlLm5ld0Zyb21UZXh0KHJlZGlyZWN0LnRvKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRlbXBsYXRlc0FycmF5O1xyXG5cdH0pO1xyXG59O1xyXG5cclxuVGVtcGxhdGUucHJvdG90eXBlLmdldERhdGFGb3JQYXJhbSA9IGZ1bmN0aW9uKGtleSwgcGFyYU5hbWUpIHtcclxuXHRpZiAoICF0aGlzLnBhcmFtRGF0YSApIHtcclxuXHRcdHJldHVybiBudWxsO1xyXG5cdH1cclxuXHQvLyBJZiBhbGlhcywgc3dpdGNoIGZyb20gYWxpYXMgdG8gcHJlZmVycmVkIHBhcmFtZXRlciBuYW1lXHJcblx0dmFyIHBhcmEgPSB0aGlzLnBhcmFtQWxpYXNlc1twYXJhTmFtZV0gfHwgcGFyYU5hbWU7XHRcclxuXHRpZiAoICF0aGlzLnBhcmFtRGF0YVtwYXJhXSApIHtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblx0XHJcblx0dmFyIGRhdGEgPSB0aGlzLnBhcmFtRGF0YVtwYXJhXVtrZXldO1xyXG5cdC8vIERhdGEgbWlnaHQgYWN0dWFsbHkgYmUgYW4gb2JqZWN0IHdpdGgga2V5IFwiZW5cIlxyXG5cdGlmICggZGF0YSAmJiBkYXRhLmVuICYmICFBcnJheS5pc0FycmF5KGRhdGEpICkge1xyXG5cdFx0cmV0dXJuIGRhdGEuZW47XHJcblx0fVxyXG5cdHJldHVybiBkYXRhO1xyXG59O1xyXG5cclxuVGVtcGxhdGUucHJvdG90eXBlLnNldFBhcmFtRGF0YUFuZFN1Z2dlc3Rpb25zID0gZnVuY3Rpb24oKSB7XHJcblx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cdHZhciBwYXJhbURhdGFTZXQgPSAkLkRlZmVycmVkKCk7XHJcblx0XHJcblx0aWYgKCBzZWxmLnBhcmFtRGF0YSApIHsgcmV0dXJuIHBhcmFtRGF0YVNldC5yZXNvbHZlKCk7IH1cclxuICAgIFxyXG5cdHZhciBwcmVmaXhlZFRleHQgPSBzZWxmLnJlZGlyZWN0c1RvXHJcblx0XHQ/IHNlbGYucmVkaXJlY3RzVG8uZ2V0UHJlZml4ZWRUZXh0KClcclxuXHRcdDogc2VsZi5nZXRUaXRsZSgpLmdldFByZWZpeGVkVGV4dCgpO1xyXG5cclxuXHR2YXIgY2FjaGVkSW5mbyA9IGNhY2hlLnJlYWQocHJlZml4ZWRUZXh0ICsgXCItcGFyYW1zXCIpO1xyXG5cdFxyXG5cdGlmIChcclxuXHRcdGNhY2hlZEluZm8gJiZcclxuXHRcdGNhY2hlZEluZm8udmFsdWUgJiZcclxuXHRcdGNhY2hlZEluZm8uc3RhbGVEYXRlICYmXHJcblx0XHRjYWNoZWRJbmZvLnZhbHVlLnBhcmFtRGF0YSAhPSBudWxsICYmXHJcblx0XHRjYWNoZWRJbmZvLnZhbHVlLnBhcmFtZXRlclN1Z2dlc3Rpb25zICE9IG51bGwgJiZcclxuXHRcdGNhY2hlZEluZm8udmFsdWUucGFyYW1BbGlhc2VzICE9IG51bGxcclxuXHQpIHtcclxuXHRcdHNlbGYubm90ZW1wbGF0ZWRhdGEgPSBjYWNoZWRJbmZvLnZhbHVlLm5vdGVtcGxhdGVkYXRhO1xyXG5cdFx0c2VsZi5wYXJhbURhdGEgPSBjYWNoZWRJbmZvLnZhbHVlLnBhcmFtRGF0YTtcclxuXHRcdHNlbGYucGFyYW1ldGVyU3VnZ2VzdGlvbnMgPSBjYWNoZWRJbmZvLnZhbHVlLnBhcmFtZXRlclN1Z2dlc3Rpb25zO1xyXG5cdFx0c2VsZi5wYXJhbUFsaWFzZXMgPSBjYWNoZWRJbmZvLnZhbHVlLnBhcmFtQWxpYXNlcztcclxuXHRcdFxyXG5cdFx0cGFyYW1EYXRhU2V0LnJlc29sdmUoKTtcclxuXHRcdGlmICggIWlzQWZ0ZXJEYXRlKGNhY2hlZEluZm8uc3RhbGVEYXRlKSApIHtcclxuXHRcdFx0Ly8gSnVzdCB1c2UgdGhlIGNhY2hlZCBkYXRhXHJcblx0XHRcdHJldHVybiBwYXJhbURhdGFTZXQ7XHJcblx0XHR9IC8vIGVsc2U6IFVzZSB0aGUgY2FjaGUgZGF0YSBmb3Igbm93LCBidXQgYWxzbyBmZXRjaCBuZXcgZGF0YSBmcm9tIEFQSVxyXG5cdH1cclxuXHRcclxuXHRBUEkuZ2V0KHtcclxuXHRcdGFjdGlvbjogXCJ0ZW1wbGF0ZWRhdGFcIixcclxuXHRcdHRpdGxlczogcHJlZml4ZWRUZXh0LFxyXG5cdFx0cmVkaXJlY3RzOiAxLFxyXG5cdFx0aW5jbHVkZU1pc3NpbmdUaXRsZXM6IDFcclxuXHR9KVxyXG5cdFx0LnRoZW4oXHJcblx0XHRcdGZ1bmN0aW9uKHJlc3BvbnNlKSB7IHJldHVybiByZXNwb25zZTsgfSxcclxuXHRcdFx0ZnVuY3Rpb24oLyplcnJvciovKSB7IHJldHVybiBudWxsOyB9IC8vIElnbm9yZSBlcnJvcnMsIHdpbGwgdXNlIGRlZmF1bHQgZGF0YVxyXG5cdFx0KVxyXG5cdFx0LnRoZW4oIGZ1bmN0aW9uKHJlc3VsdCkge1xyXG5cdFx0Ly8gRmlndXJlIG91dCBwYWdlIGlkIChiZWFjdXNlIGFjdGlvbj10ZW1wbGF0ZWRhdGEgZG9lc24ndCBoYXZlIGFuIGluZGV4cGFnZWlkcyBvcHRpb24pXHJcblx0XHRcdHZhciBpZCA9IHJlc3VsdCAmJiAkLm1hcChyZXN1bHQucGFnZXMsIGZ1bmN0aW9uKCBfdmFsdWUsIGtleSApIHsgcmV0dXJuIGtleTsgfSk7XHJcblx0XHRcclxuXHRcdFx0aWYgKCAhcmVzdWx0IHx8ICFyZXN1bHQucGFnZXNbaWRdIHx8IHJlc3VsdC5wYWdlc1tpZF0ubm90ZW1wbGF0ZWRhdGEgfHwgIXJlc3VsdC5wYWdlc1tpZF0ucGFyYW1zICkge1xyXG5cdFx0XHQvLyBObyBUZW1wbGF0ZURhdGEsIHNvIHVzZSBkZWZhdWx0cyAoZ3Vlc3NlcylcclxuXHRcdFx0XHRzZWxmLm5vdGVtcGxhdGVkYXRhID0gdHJ1ZTtcclxuXHRcdFx0XHRzZWxmLnRlbXBsYXRlZGF0YUFwaUVycm9yID0gIXJlc3VsdDtcclxuXHRcdFx0XHRzZWxmLnBhcmFtRGF0YSA9IGNvbmZpZy5kZWZhdWx0UGFyYW1ldGVyRGF0YTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRzZWxmLnBhcmFtRGF0YSA9IHJlc3VsdC5wYWdlc1tpZF0ucGFyYW1zO1xyXG5cdFx0XHR9XHJcbiAgICAgICAgXHJcblx0XHRcdHNlbGYucGFyYW1BbGlhc2VzID0ge307XHJcblx0XHRcdCQuZWFjaChzZWxmLnBhcmFtRGF0YSwgZnVuY3Rpb24ocGFyYU5hbWUsIHBhcmFEYXRhKSB7XHJcblx0XHRcdFx0Ly8gRXh0cmFjdCBhbGlhc2VzIGZvciBlYXNpZXIgcmVmZXJlbmNlIGxhdGVyIG9uXHJcblx0XHRcdFx0aWYgKCBwYXJhRGF0YS5hbGlhc2VzICYmIHBhcmFEYXRhLmFsaWFzZXMubGVuZ3RoICkge1xyXG5cdFx0XHRcdFx0cGFyYURhdGEuYWxpYXNlcy5mb3JFYWNoKGZ1bmN0aW9uKGFsaWFzKXtcclxuXHRcdFx0XHRcdFx0c2VsZi5wYXJhbUFsaWFzZXNbYWxpYXNdID0gcGFyYU5hbWU7XHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Ly8gRXh0cmFjdCBhbGxvd2VkIHZhbHVlcyBhcnJheSBmcm9tIGRlc2NyaXB0aW9uXHJcblx0XHRcdFx0aWYgKCBwYXJhRGF0YS5kZXNjcmlwdGlvbiAmJiAvXFxbLionLis/Jy4qP1xcXS8udGVzdChwYXJhRGF0YS5kZXNjcmlwdGlvbi5lbikgKSB7XHJcblx0XHRcdFx0XHR0cnkge1xyXG5cdFx0XHRcdFx0XHR2YXIgYWxsb3dlZFZhbHMgPSBKU09OLnBhcnNlKFxyXG5cdFx0XHRcdFx0XHRcdHBhcmFEYXRhLmRlc2NyaXB0aW9uLmVuXHJcblx0XHRcdFx0XHRcdFx0XHQucmVwbGFjZSgvXi4qXFxbLyxcIltcIilcclxuXHRcdFx0XHRcdFx0XHRcdC5yZXBsYWNlKC9cIi9nLCBcIlxcXFxcXFwiXCIpXHJcblx0XHRcdFx0XHRcdFx0XHQucmVwbGFjZSgvJy9nLCBcIlxcXCJcIilcclxuXHRcdFx0XHRcdFx0XHRcdC5yZXBsYWNlKC8sXFxzKl0vLCBcIl1cIilcclxuXHRcdFx0XHRcdFx0XHRcdC5yZXBsYWNlKC9dLiokLywgXCJdXCIpXHJcblx0XHRcdFx0XHRcdCk7XHJcblx0XHRcdFx0XHRcdHNlbGYucGFyYW1EYXRhW3BhcmFOYW1lXS5hbGxvd2VkVmFsdWVzID0gYWxsb3dlZFZhbHM7XHJcblx0XHRcdFx0XHR9IGNhdGNoKGUpIHtcclxuXHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKFwiW1JhdGVyXSBDb3VsZCBub3QgcGFyc2UgYWxsb3dlZCB2YWx1ZXMgaW4gZGVzY3JpcHRpb246XFxuICBcIitcclxuXHRcdFx0XHRcdHBhcmFEYXRhLmRlc2NyaXB0aW9uLmVuICsgXCJcXG4gQ2hlY2sgVGVtcGxhdGVEYXRhIGZvciBwYXJhbWV0ZXIgfFwiICsgcGFyYU5hbWUgK1xyXG5cdFx0XHRcdFx0XCI9IGluIFwiICsgc2VsZi5nZXRUaXRsZSgpLmdldFByZWZpeGVkVGV4dCgpKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Ly8gTWFrZSBzdXJlIHJlcXVpcmVkL3N1Z2dlc3RlZCBwYXJhbWV0ZXJzIGFyZSBwcmVzZW50XHJcblx0XHRcdFx0aWYgKCAocGFyYURhdGEucmVxdWlyZWQgfHwgcGFyYURhdGEuc3VnZ2VzdGVkKSAmJiAhc2VsZi5nZXRQYXJhbShwYXJhTmFtZSkgKSB7XHJcblx0XHRcdFx0Ly8gQ2hlY2sgaWYgYWxyZWFkeSBwcmVzZW50IGluIGFuIGFsaWFzLCBpZiBhbnlcclxuXHRcdFx0XHRcdGlmICggcGFyYURhdGEuYWxpYXNlcy5sZW5ndGggKSB7XHJcblx0XHRcdFx0XHRcdHZhciBhbGlhc2VzID0gc2VsZi5wYXJhbWV0ZXJzLmZpbHRlcihwID0+IHtcclxuXHRcdFx0XHRcdFx0XHR2YXIgaXNBbGlhcyA9IHBhcmFEYXRhLmFsaWFzZXMuaW5jbHVkZXMocC5uYW1lKTtcclxuXHRcdFx0XHRcdFx0XHR2YXIgaXNFbXB0eSA9ICFwLnZhbDtcclxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gaXNBbGlhcyAmJiAhaXNFbXB0eTtcclxuXHRcdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0XHRcdGlmICggYWxpYXNlcy5sZW5ndGggKSB7XHJcblx0XHRcdFx0XHRcdC8vIEF0IGxlYXN0IG9uZSBub24tZW1wdHkgYWxpYXMsIHNvIGRvIG5vdGhpbmdcclxuXHRcdFx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdC8vIE5vIG5vbi1lbXB0eSBhbGlhc2VzLCBzbyBzZXQgcGFyYW1ldGVyIHRvIGVpdGhlciB0aGUgYXV0b3ZhdWxlLCBvclxyXG5cdFx0XHRcdFx0Ly8gYW4gZW1wdHkgc3RyaW5nICh3aXRob3V0IHRvdWNoaW5nLCB1bmxlc3MgaXQgaXMgYSByZXF1aXJlZCBwYXJhbWV0ZXIpXHJcblx0XHRcdFx0XHRzZWxmLnBhcmFtZXRlcnMucHVzaCh7XHJcblx0XHRcdFx0XHRcdG5hbWU6cGFyYU5hbWUsXHJcblx0XHRcdFx0XHRcdHZhbHVlOiBwYXJhRGF0YS5hdXRvdmFsdWUgfHwgXCJcIixcclxuXHRcdFx0XHRcdFx0YXV0b2ZpbGxlZDogdHJ1ZVxyXG5cdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHRcdFxyXG5cdFx0XHQvLyBNYWtlIHN1Z2dlc3Rpb25zIGZvciBjb21ib2JveFxyXG5cdFx0XHR2YXIgYWxsUGFyYW1zQXJyYXkgPSAoICFzZWxmLm5vdGVtcGxhdGVkYXRhICYmIHJlc3VsdC5wYWdlc1tpZF0ucGFyYW1PcmRlciApIHx8XHJcblx0XHRcdCQubWFwKHNlbGYucGFyYW1EYXRhLCBmdW5jdGlvbihfdmFsLCBrZXkpe1xyXG5cdFx0XHRcdHJldHVybiBrZXk7XHJcblx0XHRcdH0pO1xyXG5cdFx0XHRzZWxmLnBhcmFtZXRlclN1Z2dlc3Rpb25zID0gYWxsUGFyYW1zQXJyYXkuZmlsdGVyKGZ1bmN0aW9uKHBhcmFtTmFtZSkge1xyXG5cdFx0XHRcdHJldHVybiAoIHBhcmFtTmFtZSAmJiBwYXJhbU5hbWUgIT09IFwiY2xhc3NcIiAmJiBwYXJhbU5hbWUgIT09IFwiaW1wb3J0YW5jZVwiICk7XHJcblx0XHRcdH0pXHJcblx0XHRcdFx0Lm1hcChmdW5jdGlvbihwYXJhbU5hbWUpIHtcclxuXHRcdFx0XHRcdHZhciBvcHRpb25PYmplY3QgPSB7ZGF0YTogcGFyYW1OYW1lfTtcclxuXHRcdFx0XHRcdHZhciBsYWJlbCA9IHNlbGYuZ2V0RGF0YUZvclBhcmFtKGxhYmVsLCBwYXJhbU5hbWUpO1xyXG5cdFx0XHRcdFx0aWYgKCBsYWJlbCApIHtcclxuXHRcdFx0XHRcdFx0b3B0aW9uT2JqZWN0LmxhYmVsID0gbGFiZWwgKyBcIiAofFwiICsgcGFyYW1OYW1lICsgXCI9KVwiO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0cmV0dXJuIG9wdGlvbk9iamVjdDtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFxyXG5cdFx0XHRpZiAoIHNlbGYudGVtcGxhdGVkYXRhQXBpRXJyb3IgKSB7XHJcblx0XHRcdFx0Ly8gRG9uJ3Qgc2F2ZSBkZWZhdWx0cy9ndWVzc2VzIHRvIGNhY2hlO1xyXG5cdFx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0XHR9XHJcblx0XHRcclxuXHRcdFx0Y2FjaGUud3JpdGUocHJlZml4ZWRUZXh0ICsgXCItcGFyYW1zXCIsIHtcclxuXHRcdFx0XHRub3RlbXBsYXRlZGF0YTogc2VsZi5ub3RlbXBsYXRlZGF0YSxcclxuXHRcdFx0XHRwYXJhbURhdGE6IHNlbGYucGFyYW1EYXRhLFxyXG5cdFx0XHRcdHBhcmFtZXRlclN1Z2dlc3Rpb25zOiBzZWxmLnBhcmFtZXRlclN1Z2dlc3Rpb25zLFxyXG5cdFx0XHRcdHBhcmFtQWxpYXNlczogc2VsZi5wYXJhbUFsaWFzZXNcclxuXHRcdFx0fSxcdDFcclxuXHRcdFx0KTtcclxuXHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHR9KVxyXG5cdFx0LnRoZW4oXHJcblx0XHRcdHBhcmFtRGF0YVNldC5yZXNvbHZlLFxyXG5cdFx0XHRwYXJhbURhdGFTZXQucmVqZWN0XHJcblx0XHQpO1xyXG5cdFxyXG5cdHJldHVybiBwYXJhbURhdGFTZXQ7XHRcclxufTtcclxuXHJcbmV4cG9ydCB7VGVtcGxhdGUsIHBhcnNlVGVtcGxhdGVzLCBnZXRXaXRoUmVkaXJlY3RUb307IiwiaW1wb3J0IHttYWtlRXJyb3JNc2d9IGZyb20gXCIuLi91dGlsXCI7XHJcblxyXG4vKiB2YXIgaW5jcmVtZW50UHJvZ3Jlc3NCeUludGVydmFsID0gZnVuY3Rpb24oKSB7XHJcblx0dmFyIGluY3JlbWVudEludGVydmFsRGVsYXkgPSAxMDA7XHJcblx0dmFyIGluY3JlbWVudEludGVydmFsQW1vdW50ID0gMC4xO1xyXG5cdHZhciBpbmNyZW1lbnRJbnRlcnZhbE1heHZhbCA9IDk4O1xyXG5cdHJldHVybiB3aW5kb3cuc2V0SW50ZXJ2YWwoXHJcblx0XHRpbmNyZW1lbnRQcm9ncmVzcyxcclxuXHRcdGluY3JlbWVudEludGVydmFsRGVsYXksXHJcblx0XHRpbmNyZW1lbnRJbnRlcnZhbEFtb3VudCxcclxuXHRcdGluY3JlbWVudEludGVydmFsTWF4dmFsXHJcblx0KTtcclxufTsgKi9cclxuXHJcbnZhciBMb2FkRGlhbG9nID0gZnVuY3Rpb24gTG9hZERpYWxvZyggY29uZmlnICkge1xyXG5cdExvYWREaWFsb2cuc3VwZXIuY2FsbCggdGhpcywgY29uZmlnICk7XHJcbn07XHJcbk9PLmluaGVyaXRDbGFzcyggTG9hZERpYWxvZywgT08udWkuRGlhbG9nICk7IFxyXG5cclxuTG9hZERpYWxvZy5zdGF0aWMubmFtZSA9IFwibG9hZERpYWxvZ1wiO1xyXG4vLyBTcGVjaWZ5IGEgdGl0bGUgc3RhdGljYWxseSAob3IsIGFsdGVybmF0aXZlbHksIHdpdGggZGF0YSBwYXNzZWQgdG8gdGhlIG9wZW5pbmcoKSBtZXRob2QpLlxyXG5Mb2FkRGlhbG9nLnN0YXRpYy50aXRsZSA9IFwiTG9hZGluZyBSYXRlci4uLlwiO1xyXG5cclxuLy8gQ3VzdG9taXplIHRoZSBpbml0aWFsaXplKCkgZnVuY3Rpb246IFRoaXMgaXMgd2hlcmUgdG8gYWRkIGNvbnRlbnQgdG8gdGhlIGRpYWxvZyBib2R5IGFuZCBzZXQgdXAgZXZlbnQgaGFuZGxlcnMuXHJcbkxvYWREaWFsb2cucHJvdG90eXBlLmluaXRpYWxpemUgPSBmdW5jdGlvbiAoKSB7XHJcblx0Ly8gQ2FsbCB0aGUgcGFyZW50IG1ldGhvZC5cclxuXHRMb2FkRGlhbG9nLnN1cGVyLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwoIHRoaXMgKTtcclxuXHQvLyBDcmVhdGUgYSBsYXlvdXRcclxuXHR0aGlzLmNvbnRlbnQgPSBuZXcgT08udWkuUGFuZWxMYXlvdXQoIHsgXHJcblx0XHRwYWRkZWQ6IHRydWUsXHJcblx0XHRleHBhbmRlZDogZmFsc2UgXHJcblx0fSApO1xyXG5cdC8vIENyZWF0ZSBjb250ZW50XHJcblx0dGhpcy5wcm9ncmVzc0JhciA9IG5ldyBPTy51aS5Qcm9ncmVzc0JhcldpZGdldCgge1xyXG5cdFx0cHJvZ3Jlc3M6IDFcclxuXHR9ICk7XHJcblx0dGhpcy5zZXR1cHRhc2tzID0gW1xyXG5cdFx0bmV3IE9PLnVpLkxhYmVsV2lkZ2V0KCB7XHJcblx0XHRcdGxhYmVsOiBcIkxvYWRpbmcgbGlzdCBvZiBwcm9qZWN0IGJhbm5lcnMuLi5cIixcclxuXHRcdFx0JGVsZW1lbnQ6ICQoXCI8cCBzdHlsZT1cXFwiZGlzcGxheTpibG9ja1xcXCI+XCIpXHJcblx0XHR9KSxcclxuXHRcdG5ldyBPTy51aS5MYWJlbFdpZGdldCgge1xyXG5cdFx0XHRsYWJlbDogXCJMb2FkaW5nIHRhbGtwYWdlIHdpa2l0ZXh0Li4uXCIsXHJcblx0XHRcdCRlbGVtZW50OiAkKFwiPHAgc3R5bGU9XFxcImRpc3BsYXk6YmxvY2tcXFwiPlwiKVxyXG5cdFx0fSksXHJcblx0XHRuZXcgT08udWkuTGFiZWxXaWRnZXQoIHtcclxuXHRcdFx0bGFiZWw6IFwiUGFyc2luZyB0YWxrcGFnZSB0ZW1wbGF0ZXMuLi5cIixcclxuXHRcdFx0JGVsZW1lbnQ6ICQoXCI8cCBzdHlsZT1cXFwiZGlzcGxheTpibG9ja1xcXCI+XCIpXHJcblx0XHR9KSxcclxuXHRcdG5ldyBPTy51aS5MYWJlbFdpZGdldCgge1xyXG5cdFx0XHRsYWJlbDogXCJHZXR0aW5nIHRlbXBsYXRlcycgcGFyYW1ldGVyIGRhdGEuLi5cIixcclxuXHRcdFx0JGVsZW1lbnQ6ICQoXCI8cCBzdHlsZT1cXFwiZGlzcGxheTpibG9ja1xcXCI+XCIpXHJcblx0XHR9KSxcclxuXHRcdG5ldyBPTy51aS5MYWJlbFdpZGdldCgge1xyXG5cdFx0XHRsYWJlbDogXCJDaGVja2luZyBpZiBwYWdlIHJlZGlyZWN0cy4uLlwiLFxyXG5cdFx0XHQkZWxlbWVudDogJChcIjxwIHN0eWxlPVxcXCJkaXNwbGF5OmJsb2NrXFxcIj5cIilcclxuXHRcdH0pLFxyXG5cdFx0bmV3IE9PLnVpLkxhYmVsV2lkZ2V0KCB7XHJcblx0XHRcdGxhYmVsOiBcIlJldHJpZXZpbmcgcXVhbGl0eSBwcmVkaWN0aW9uLi4uXCIsXHJcblx0XHRcdCRlbGVtZW50OiAkKFwiPHAgc3R5bGU9XFxcImRpc3BsYXk6YmxvY2tcXFwiPlwiKVxyXG5cdFx0fSkudG9nZ2xlKCksXHJcblx0XTtcclxuXHR0aGlzLmNsb3NlQnV0dG9uID0gbmV3IE9PLnVpLkJ1dHRvbldpZGdldCgge1xyXG5cdFx0bGFiZWw6IFwiQ2xvc2VcIlxyXG5cdH0pLnRvZ2dsZSgpO1xyXG5cdHRoaXMuc2V0dXBQcm9taXNlcyA9IFtdO1xyXG5cclxuXHQvLyBBcHBlbmQgY29udGVudCB0byBsYXlvdXRcclxuXHR0aGlzLmNvbnRlbnQuJGVsZW1lbnQuYXBwZW5kKFxyXG5cdFx0dGhpcy5wcm9ncmVzc0Jhci4kZWxlbWVudCxcclxuXHRcdChuZXcgT08udWkuTGFiZWxXaWRnZXQoIHtcclxuXHRcdFx0bGFiZWw6IFwiSW5pdGlhbGlzaW5nOlwiLFxyXG5cdFx0XHQkZWxlbWVudDogJChcIjxzdHJvbmcgc3R5bGU9XFxcImRpc3BsYXk6YmxvY2tcXFwiPlwiKVxyXG5cdFx0fSkpLiRlbGVtZW50LFxyXG5cdFx0Li4udGhpcy5zZXR1cHRhc2tzLm1hcCh3aWRnZXQgPT4gd2lkZ2V0LiRlbGVtZW50KSxcclxuXHRcdHRoaXMuY2xvc2VCdXR0b24uJGVsZW1lbnRcclxuXHQpO1xyXG5cclxuXHQvLyBBcHBlbmQgbGF5b3V0IHRvIGRpYWxvZ1xyXG5cdHRoaXMuJGJvZHkuYXBwZW5kKCB0aGlzLmNvbnRlbnQuJGVsZW1lbnQgKTtcclxuXHJcblx0Ly8gQ29ubmVjdCBldmVudHMgdG8gaGFuZGxlcnNcclxuXHR0aGlzLmNsb3NlQnV0dG9uLmNvbm5lY3QoIHRoaXMsIHsgXCJjbGlja1wiOiBcIm9uQ2xvc2VCdXR0b25DbGlja1wiIH0gKTtcclxufTtcclxuXHJcbkxvYWREaWFsb2cucHJvdG90eXBlLm9uQ2xvc2VCdXR0b25DbGljayA9IGZ1bmN0aW9uKCkge1xyXG5cdC8vIENsb3NlIHRoaXMgZGlhbG9nLCB3aXRob3V0IHBhc3NpbmcgYW55IGRhdGFcclxuXHR0aGlzLmNsb3NlKCk7XHJcbn07XHJcblxyXG4vLyBPdmVycmlkZSB0aGUgZ2V0Qm9keUhlaWdodCgpIG1ldGhvZCB0byBzcGVjaWZ5IGEgY3VzdG9tIGhlaWdodCAob3IgZG9uJ3QgdG8gdXNlIHRoZSBhdXRvbWF0aWNhbGx5IGdlbmVyYXRlZCBoZWlnaHQpLlxyXG5Mb2FkRGlhbG9nLnByb3RvdHlwZS5nZXRCb2R5SGVpZ2h0ID0gZnVuY3Rpb24gKCkge1xyXG5cdHJldHVybiB0aGlzLmNvbnRlbnQuJGVsZW1lbnQub3V0ZXJIZWlnaHQoIHRydWUgKTtcclxufTtcclxuXHJcbkxvYWREaWFsb2cucHJvdG90eXBlLmluY3JlbWVudFByb2dyZXNzID0gZnVuY3Rpb24oYW1vdW50LCBtYXhpbXVtKSB7XHJcblx0dmFyIHByaW9yUHJvZ3Jlc3MgPSB0aGlzLnByb2dyZXNzQmFyLmdldFByb2dyZXNzKCk7XHJcblx0dmFyIGluY3JlbWVudGVkUHJvZ3Jlc3MgPSBNYXRoLm1pbihtYXhpbXVtIHx8IDEwMCwgcHJpb3JQcm9ncmVzcyArIGFtb3VudCk7XHJcblx0dGhpcy5wcm9ncmVzc0Jhci5zZXRQcm9ncmVzcyhpbmNyZW1lbnRlZFByb2dyZXNzKTtcclxufTtcclxuXHJcbkxvYWREaWFsb2cucHJvdG90eXBlLmFkZFRhc2tQcm9taXNlSGFuZGxlcnMgPSBmdW5jdGlvbih0YXNrUHJvbWlzZXMpIHtcclxuXHR2YXIgb25UYXNrRG9uZSA9IGluZGV4ID0+IHtcclxuXHRcdC8vIEFkZCBcIkRvbmUhXCIgdG8gbGFiZWxcclxuXHRcdHZhciB3aWRnZXQgPSB0aGlzLnNldHVwdGFza3NbaW5kZXhdO1xyXG5cdFx0d2lkZ2V0LnNldExhYmVsKHdpZGdldC5nZXRMYWJlbCgpICsgXCIgRG9uZSFcIik7XHJcblx0XHQvLyBJbmNyZW1lbnQgc3RhdHVzIGJhci4gU2hvdyBhIHNtb290aCB0cmFuc2l0aW9uIGJ5XHJcblx0XHQvLyB1c2luZyBzbWFsbCBzdGVwcyBvdmVyIGEgc2hvcnQgZHVyYXRpb24uXHJcblx0XHR2YXIgdG90YWxJbmNyZW1lbnQgPSAyMDsgLy8gcGVyY2VudFxyXG5cdFx0dmFyIHRvdGFsVGltZSA9IDQwMDsgLy8gbWlsbGlzZWNvbmRzXHJcblx0XHR2YXIgdG90YWxTdGVwcyA9IDEwO1xyXG5cdFx0dmFyIGluY3JlbWVudFBlclN0ZXAgPSB0b3RhbEluY3JlbWVudCAvIHRvdGFsU3RlcHM7XHJcblxyXG5cdFx0Zm9yICggdmFyIHN0ZXA9MDsgc3RlcCA8IHRvdGFsU3RlcHM7IHN0ZXArKykge1xyXG5cdFx0XHR3aW5kb3cuc2V0VGltZW91dChcclxuXHRcdFx0XHR0aGlzLmluY3JlbWVudFByb2dyZXNzLmJpbmQodGhpcyksXHJcblx0XHRcdFx0dG90YWxUaW1lICogc3RlcCAvIHRvdGFsU3RlcHMsXHJcblx0XHRcdFx0aW5jcmVtZW50UGVyU3RlcFxyXG5cdFx0XHQpO1xyXG5cdFx0fVxyXG5cdH07XHJcblx0dmFyIG9uVGFza0Vycm9yID0gKGluZGV4LCBjb2RlLCBpbmZvKSA9PiB7XHJcblx0XHR2YXIgd2lkZ2V0ID0gdGhpcy5zZXR1cHRhc2tzW2luZGV4XTtcclxuXHRcdHdpZGdldC5zZXRMYWJlbChcclxuXHRcdFx0d2lkZ2V0LmdldExhYmVsKCkgKyBcIiBGYWlsZWQuIFwiICsgbWFrZUVycm9yTXNnKGNvZGUsIGluZm8pXHJcblx0XHQpO1xyXG5cdFx0dGhpcy5jbG9zZUJ1dHRvbi50b2dnbGUodHJ1ZSk7XHJcblx0XHR0aGlzLnVwZGF0ZVNpemUoKTtcclxuXHR9O1xyXG5cdHRhc2tQcm9taXNlcy5mb3JFYWNoKGZ1bmN0aW9uKHByb21pc2UsIGluZGV4KSB7XHJcblx0XHRwcm9taXNlLnRoZW4oXHJcblx0XHRcdCgpID0+IG9uVGFza0RvbmUoaW5kZXgpLFxyXG5cdFx0XHQoY29kZSwgaW5mbykgPT4gb25UYXNrRXJyb3IoaW5kZXgsIGNvZGUsIGluZm8pXHJcblx0XHQpO1xyXG5cdH0pO1xyXG59O1xyXG5cclxuLy8gVXNlIGdldFNldHVwUHJvY2VzcygpIHRvIHNldCB1cCB0aGUgd2luZG93IHdpdGggZGF0YSBwYXNzZWQgdG8gaXQgYXQgdGhlIHRpbWUgXHJcbi8vIG9mIG9wZW5pbmdcclxuTG9hZERpYWxvZy5wcm90b3R5cGUuZ2V0U2V0dXBQcm9jZXNzID0gZnVuY3Rpb24gKCBkYXRhICkge1xyXG5cdGRhdGEgPSBkYXRhIHx8IHt9O1xyXG5cdHJldHVybiBMb2FkRGlhbG9nLnN1cGVyLnByb3RvdHlwZS5nZXRTZXR1cFByb2Nlc3MuY2FsbCggdGhpcywgZGF0YSApXHJcblx0XHQubmV4dCggKCkgPT4ge1xyXG5cdFx0XHRpZiAoZGF0YS5vcmVzKSB7XHJcblx0XHRcdFx0dGhpcy5zZXR1cHRhc2tzWzVdLnRvZ2dsZSgpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHZhciB0YXNrUHJvbWlzZXMgPSBkYXRhLm9yZXMgPyBkYXRhLnByb21pc2VzIDogZGF0YS5wcm9taXNlcy5zbGljZSgwLCAtMSk7XHJcblx0XHRcdGRhdGEuaXNPcGVuZWQudGhlbigoKSA9PiB0aGlzLmFkZFRhc2tQcm9taXNlSGFuZGxlcnModGFza1Byb21pc2VzKSk7XHJcblx0XHR9LCB0aGlzICk7XHJcbn07XHJcblxyXG4vLyBQcmV2ZW50IHdpbmRvdyBmcm9tIGNsb3NpbmcgdG9vIHF1aWNrbHksIHVzaW5nIGdldEhvbGRQcm9jZXNzKClcclxuTG9hZERpYWxvZy5wcm90b3R5cGUuZ2V0SG9sZFByb2Nlc3MgPSBmdW5jdGlvbiAoIGRhdGEgKSB7XHJcblx0ZGF0YSA9IGRhdGEgfHwge307XHJcblx0aWYgKGRhdGEuc3VjY2Vzcykge1xyXG5cdFx0Ly8gV2FpdCBhIGJpdCBiZWZvcmUgcHJvY2Vzc2luZyB0aGUgY2xvc2UsIHdoaWNoIGhhcHBlbnMgYXV0b21hdGljYWxseVxyXG5cdFx0cmV0dXJuIExvYWREaWFsb2cuc3VwZXIucHJvdG90eXBlLmdldEhvbGRQcm9jZXNzLmNhbGwoIHRoaXMsIGRhdGEgKVxyXG5cdFx0XHQubmV4dCg4MDApO1xyXG5cdH1cclxuXHQvLyBObyBuZWVkIHRvIHdhaXQgaWYgY2xvc2VkIG1hbnVhbGx5XHJcblx0cmV0dXJuIExvYWREaWFsb2cuc3VwZXIucHJvdG90eXBlLmdldEhvbGRQcm9jZXNzLmNhbGwoIHRoaXMsIGRhdGEgKTtcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IExvYWREaWFsb2c7IiwiLy8gU3R1YiBjb2RlLCBiYXNlZCBvbiB0aGUgZXhhbXBsZSBmcm9tIGh0dHBzOi8vd3d3Lm1lZGlhd2lraS5vcmcvd2lraS9PT1VJL1dpbmRvd3MvV2luZG93X21hbmFnZXJzXHJcblxyXG5mdW5jdGlvbiBNYWluV2luZG93KCBjb25maWcgKSB7XHJcblx0TWFpbldpbmRvdy5zdXBlci5jYWxsKCB0aGlzLCBjb25maWcgKTtcclxufVxyXG5PTy5pbmhlcml0Q2xhc3MoIE1haW5XaW5kb3csIE9PLnVpLkRpYWxvZyApO1xyXG5cclxuLy8gU3BlY2lmeSBhIHN5bWJvbGljIG5hbWUgKGUuZy4sICdzaW1wbGUnLCBpbiB0aGlzIGV4YW1wbGUpIHVzaW5nIHRoZSBzdGF0aWMgJ25hbWUnIHByb3BlcnR5LlxyXG5NYWluV2luZG93LnN0YXRpYy5uYW1lID0gXCJtYWluXCI7XHJcbk1haW5XaW5kb3cuc3RhdGljLnRpdGxlID0gXCJSYXRlclwiO1xyXG5cclxuTWFpbldpbmRvdy5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uICgpIHtcclxuXHRNYWluV2luZG93LnN1cGVyLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwoIHRoaXMgKTtcclxuXHR0aGlzLmNvbnRlbnQgPSBuZXcgT08udWkuUGFuZWxMYXlvdXQoIHsgcGFkZGVkOiB0cnVlLCBleHBhbmRlZDogZmFsc2UgfSApO1xyXG5cdHRoaXMuY29udGVudC4kZWxlbWVudC5hcHBlbmQoIFwiPHA+VGhlIHdpbmRvdyBtYW5hZ2VyIHJlZmVyZW5jZXMgdGhpcyB3aW5kb3cgYnkgaXRzIHN5bWJvbGljIG5hbWUgKCdzaW1wbGUnKS4gVGhlIHN5bWJvbGljIG5hbWUgaXMgc3BlY2lmaWVkIHdpdGggdGhlIGRpYWxvZyBjbGFzcydzIHN0YXRpYyAnbmFtZScgcHJvcGVydHkuIEEgZmFjdG9yeSBpcyB1c2VkIHRvIGluc3RhbnRpYXRlIHRoZSB3aW5kb3cgYW5kIGFkZCBpdCB0byB0aGUgd2luZG93IG1hbmFnZXIgd2hlbiBpdCBpcyBuZWVkZWQuPC9wPlwiICk7XHJcblx0dGhpcy4kYm9keS5hcHBlbmQoIHRoaXMuY29udGVudC4kZWxlbWVudCApO1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgTWFpbldpbmRvdzsiLCJpbXBvcnQgY29uZmlnIGZyb20gXCIuL2NvbmZpZ1wiO1xyXG5pbXBvcnQge0FQSSwgbWFrZUVycm9yTXNnfSBmcm9tIFwiLi91dGlsXCI7XHJcbmltcG9ydCBzZXR1cFJhdGVyIGZyb20gXCIuL3NldHVwXCI7XHJcblxyXG52YXIgYXV0b1N0YXJ0ID0gZnVuY3Rpb24gYXV0b1N0YXJ0KCkge1xyXG5cdGlmICggd2luZG93LnJhdGVyX2F1dG9zdGFydE5hbWVzcGFjZXMgPT0gbnVsbCB8fCBjb25maWcubXcud2dJc01haW5QYWdlICkge1xyXG5cdFx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3QoKTtcclxuXHR9XHJcblx0XHJcblx0dmFyIGF1dG9zdGFydE5hbWVzcGFjZXMgPSAoICQuaXNBcnJheSh3aW5kb3cucmF0ZXJfYXV0b3N0YXJ0TmFtZXNwYWNlcykgKSA/IHdpbmRvdy5yYXRlcl9hdXRvc3RhcnROYW1lc3BhY2VzIDogW3dpbmRvdy5yYXRlcl9hdXRvc3RhcnROYW1lc3BhY2VzXTtcclxuXHRcclxuXHRpZiAoIC0xID09PSBhdXRvc3RhcnROYW1lc3BhY2VzLmluZGV4T2YoY29uZmlnLm13LndnTmFtZXNwYWNlTnVtYmVyKSApIHtcclxuXHRcdHJldHVybiAkLkRlZmVycmVkKCkucmVqZWN0KCk7XHJcblx0fVxyXG5cdFxyXG5cdGlmICggLyg/OlxcP3wmKSg/OmFjdGlvbnxkaWZmfG9sZGlkKT0vLnRlc3Qod2luZG93LmxvY2F0aW9uLmhyZWYpICkge1xyXG5cdFx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3QoKTtcclxuXHR9XHJcblx0XHJcblx0Ly8gQ2hlY2sgaWYgdGFsayBwYWdlIGV4aXN0c1xyXG5cdGlmICggJChcIiNjYS10YWxrLm5ld1wiKS5sZW5ndGggKSB7XHJcblx0XHRyZXR1cm4gc2V0dXBSYXRlcigpO1xyXG5cdH1cclxuXHRcclxuXHR2YXIgdGhpc1BhZ2UgPSBtdy5UaXRsZS5uZXdGcm9tVGV4dChjb25maWcubXcud2dQYWdlTmFtZSk7XHJcblx0dmFyIHRhbGtQYWdlID0gdGhpc1BhZ2UgJiYgdGhpc1BhZ2UuZ2V0VGFsa1BhZ2UoKTtcclxuXHRpZiAoIXRhbGtQYWdlKSB7XHJcblx0XHRyZXR1cm4gJC5EZWZlcnJlZCgpLnJlamVjdCgpO1xyXG5cdH1cclxuXHJcblx0LyogQ2hlY2sgdGVtcGxhdGVzIHByZXNlbnQgb24gdGFsayBwYWdlLiBGZXRjaGVzIGluZGlyZWN0bHkgdHJhbnNjbHVkZWQgdGVtcGxhdGVzLCBzbyB3aWxsIGZpbmRcclxuXHRcdFRlbXBsYXRlOldQQmFubmVyTWV0YSAoYW5kIGl0cyBzdWJ0ZW1wbGF0ZXMpLiBCdXQgc29tZSBiYW5uZXJzIHN1Y2ggYXMgTUlMSElTVCBkb24ndCB1c2UgdGhhdFxyXG5cdFx0bWV0YSB0ZW1wbGF0ZSwgc28gd2UgYWxzbyBoYXZlIHRvIGNoZWNrIGZvciB0ZW1wbGF0ZSB0aXRsZXMgY29udGFpbmcgJ1dpa2lQcm9qZWN0J1xyXG5cdCovXHJcblx0cmV0dXJuIEFQSS5nZXQoe1xyXG5cdFx0YWN0aW9uOiBcInF1ZXJ5XCIsXHJcblx0XHRmb3JtYXQ6IFwianNvblwiLFxyXG5cdFx0cHJvcDogXCJ0ZW1wbGF0ZXNcIixcclxuXHRcdHRpdGxlczogdGFsa1BhZ2UuZ2V0UHJlZml4ZWRUZXh0KCksXHJcblx0XHR0bG5hbWVzcGFjZTogXCIxMFwiLFxyXG5cdFx0dGxsaW1pdDogXCI1MDBcIixcclxuXHRcdGluZGV4cGFnZWlkczogMVxyXG5cdH0pXHJcblx0XHQudGhlbihmdW5jdGlvbihyZXN1bHQpIHtcclxuXHRcdFx0dmFyIGlkID0gcmVzdWx0LnF1ZXJ5LnBhZ2VpZHM7XHJcblx0XHRcdHZhciB0ZW1wbGF0ZXMgPSByZXN1bHQucXVlcnkucGFnZXNbaWRdLnRlbXBsYXRlcztcclxuXHRcdFxyXG5cdFx0XHRpZiAoICF0ZW1wbGF0ZXMgKSB7XHJcblx0XHRcdFx0cmV0dXJuIHNldHVwUmF0ZXIoKTtcclxuXHRcdFx0fVxyXG5cdFx0XHJcblx0XHRcdHZhciBoYXNXaWtpcHJvamVjdCA9IHRlbXBsYXRlcy5zb21lKHRlbXBsYXRlID0+IC8oV2lraVByb2plY3R8V1BCYW5uZXIpLy50ZXN0KHRlbXBsYXRlLnRpdGxlKSk7XHJcblx0XHRcclxuXHRcdFx0aWYgKCAhaGFzV2lraXByb2plY3QgKSB7XHJcblx0XHRcdFx0cmV0dXJuIHNldHVwUmF0ZXIoKTtcclxuXHRcdFx0fVxyXG5cdFx0XHJcblx0XHR9LFxyXG5cdFx0ZnVuY3Rpb24oY29kZSwganF4aHIpIHtcclxuXHRcdC8vIFNpbGVudGx5IGlnbm9yZSBmYWlsdXJlcyAoanVzdCBsb2cgdG8gY29uc29sZSlcclxuXHRcdFx0Y29uc29sZS53YXJuKFxyXG5cdFx0XHRcdFwiW1JhdGVyXSBFcnJvciB3aGlsZSBjaGVja2luZyB3aGV0aGVyIHRvIGF1dG9zdGFydC5cIiArXHJcblx0XHRcdCggY29kZSA9PSBudWxsICkgPyBcIlwiIDogXCIgXCIgKyBtYWtlRXJyb3JNc2coY29kZSwganF4aHIpXHJcblx0XHRcdCk7XHJcblx0XHRcdHJldHVybiAkLkRlZmVycmVkKCkucmVqZWN0KCk7XHJcblx0XHR9KTtcclxuXHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBhdXRvU3RhcnQ7IiwiaW1wb3J0IHtpc0FmdGVyRGF0ZX0gZnJvbSBcIi4vdXRpbFwiO1xyXG5cclxuLyoqIHdyaXRlXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBrZXlcclxuICogQHBhcmFtIHtBcnJheXxPYmplY3R9IHZhbFxyXG4gKiBAcGFyYW0ge051bWJlcn0gc3RhbGVEYXlzIE51bWJlciBvZiBkYXlzIGFmdGVyIHdoaWNoIHRoZSBkYXRhIGJlY29tZXMgc3RhbGUgKHVzYWJsZSwgYnV0IHNob3VsZFxyXG4gKiAgYmUgdXBkYXRlZCBmb3IgbmV4dCB0aW1lKS5cclxuICogQHBhcmFtIHtOdW1iZXJ9IGV4cGlyeURheXMgTnVtYmVyIG9mIGRheXMgYWZ0ZXIgd2hpY2ggdGhlIGNhY2hlZCBkYXRhIG1heSBiZSBkZWxldGVkLlxyXG4gKi9cclxudmFyIHdyaXRlID0gZnVuY3Rpb24oa2V5LCB2YWwsIHN0YWxlRGF5cywgZXhwaXJ5RGF5cykge1xyXG5cdHRyeSB7XHJcblx0XHR2YXIgZGVmYXVsdFN0YWxlRGF5cyA9IDE7XHJcblx0XHR2YXIgZGVmYXVsdEV4cGlyeURheXMgPSAzMDtcclxuXHRcdHZhciBtaWxsaXNlY29uZHNQZXJEYXkgPSAyNCo2MCo2MCoxMDAwO1xyXG5cclxuXHRcdHZhciBzdGFsZUR1cmF0aW9uID0gKHN0YWxlRGF5cyB8fCBkZWZhdWx0U3RhbGVEYXlzKSptaWxsaXNlY29uZHNQZXJEYXk7XHJcblx0XHR2YXIgZXhwaXJ5RHVyYXRpb24gPSAoZXhwaXJ5RGF5cyB8fCBkZWZhdWx0RXhwaXJ5RGF5cykqbWlsbGlzZWNvbmRzUGVyRGF5O1xyXG5cdFx0XHJcblx0XHR2YXIgc3RyaW5nVmFsID0gSlNPTi5zdHJpbmdpZnkoe1xyXG5cdFx0XHR2YWx1ZTogdmFsLFxyXG5cdFx0XHRzdGFsZURhdGU6IG5ldyBEYXRlKERhdGUubm93KCkgKyBzdGFsZUR1cmF0aW9uKS50b0lTT1N0cmluZygpLFxyXG5cdFx0XHRleHBpcnlEYXRlOiBuZXcgRGF0ZShEYXRlLm5vdygpICsgZXhwaXJ5RHVyYXRpb24pLnRvSVNPU3RyaW5nKClcclxuXHRcdH0pO1xyXG5cdFx0bG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJSYXRlci1cIitrZXksIHN0cmluZ1ZhbCk7XHJcblx0fSAgY2F0Y2goZSkge30gLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1lbXB0eVxyXG59O1xyXG4vKiogcmVhZFxyXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5XHJcbiAqIEByZXR1cm5zIHtBcnJheXxPYmplY3R8U3RyaW5nfE51bGx9IENhY2hlZCBhcnJheSBvciBvYmplY3QsIG9yIGVtcHR5IHN0cmluZyBpZiBub3QgeWV0IGNhY2hlZCxcclxuICogICAgICAgICAgb3IgbnVsbCBpZiB0aGVyZSB3YXMgZXJyb3IuXHJcbiAqL1xyXG52YXIgcmVhZCA9IGZ1bmN0aW9uKGtleSkge1xyXG5cdHZhciB2YWw7XHJcblx0dHJ5IHtcclxuXHRcdHZhciBzdHJpbmdWYWwgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcIlJhdGVyLVwiK2tleSk7XHJcblx0XHRpZiAoIHN0cmluZ1ZhbCAhPT0gXCJcIiApIHtcclxuXHRcdFx0dmFsID0gSlNPTi5wYXJzZShzdHJpbmdWYWwpO1xyXG5cdFx0fVxyXG5cdH0gIGNhdGNoKGUpIHtcclxuXHRcdGNvbnNvbGUubG9nKFwiW1JhdGVyXSBlcnJvciByZWFkaW5nIFwiICsga2V5ICsgXCIgZnJvbSBsb2NhbFN0b3JhZ2UgY2FjaGU6XCIpO1xyXG5cdFx0Y29uc29sZS5sb2coXHJcblx0XHRcdFwiXFx0XCIgKyBlLm5hbWUgKyBcIiBtZXNzYWdlOiBcIiArIGUubWVzc2FnZSArXHJcblx0XHRcdCggZS5hdCA/IFwiIGF0OiBcIiArIGUuYXQgOiBcIlwiKSArXHJcblx0XHRcdCggZS50ZXh0ID8gXCIgdGV4dDogXCIgKyBlLnRleHQgOiBcIlwiKVxyXG5cdFx0KTtcclxuXHR9XHJcblx0cmV0dXJuIHZhbCB8fCBudWxsO1xyXG59O1xyXG52YXIgY2xlYXJJdGVtSWZJbnZhbGlkID0gZnVuY3Rpb24oa2V5KSB7XHJcblx0dmFyIGlzUmF0ZXJLZXkgPSBrZXkuaW5kZXhPZihcIlJhdGVyLVwiKSA9PT0gMDtcclxuXHRpZiAoICFpc1JhdGVyS2V5ICkge1xyXG5cdFx0cmV0dXJuO1xyXG5cdH1cclxuXHR2YXIgaXRlbSA9IHJlYWQoa2V5LnJlcGxhY2UoXCJSYXRlci1cIixcIlwiKSk7XHJcblx0dmFyIGlzSW52YWxpZCA9ICFpdGVtIHx8ICFpdGVtLmV4cGlyeURhdGUgfHwgaXNBZnRlckRhdGUoaXRlbS5leHBpcnlEYXRlKTtcclxuXHRpZiAoIGlzSW52YWxpZCApIHtcclxuXHRcdGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKGtleSk7XHJcblx0fVxyXG59O1xyXG52YXIgY2xlYXJJbnZhbGlkSXRlbXMgPSBmdW5jdGlvbigpIHtcclxuXHRmb3IgKHZhciBpID0gMDsgaSA8IGxvY2FsU3RvcmFnZS5sZW5ndGg7IGkrKykge1xyXG5cdFx0c2V0VGltZW91dChjbGVhckl0ZW1JZkludmFsaWQsIDEwMCwgbG9jYWxTdG9yYWdlLmtleShpKSk7XHJcblx0fVxyXG59O1xyXG5cclxuZXhwb3J0IHsgd3JpdGUsIHJlYWQsIGNsZWFySXRlbUlmSW52YWxpZCwgY2xlYXJJbnZhbGlkSXRlbXMgfTsiLCIvLyBBIGdsb2JhbCBvYmplY3QgdGhhdCBzdG9yZXMgYWxsIHRoZSBwYWdlIGFuZCB1c2VyIGNvbmZpZ3VyYXRpb24gYW5kIHNldHRpbmdzXHJcbnZhciBjb25maWcgPSB7fTtcclxuLy8gU2NyaXB0IGluZm9cclxuY29uZmlnLnNjcmlwdCA9IHtcclxuXHQvLyBBZHZlcnQgdG8gYXBwZW5kIHRvIGVkaXQgc3VtbWFyaWVzXHJcblx0YWR2ZXJ0OiAgXCIgKFtbVXNlcjpFdmFkMzcvcmF0ZXIuanN8UmF0ZXJdXSlcIixcclxuXHR2ZXJzaW9uOiBcIjIuMC4wXCJcclxufTtcclxuLy8gUHJlZmVyZW5jZXM6IGdsb2JhbHMgdmFycyBhZGRlZCB0byB1c2VycycgY29tbW9uLmpzLCBvciBzZXQgdG8gZGVmYXVsdHMgaWYgdW5kZWZpbmVkXHJcbmNvbmZpZy5wcmVmcyA9IHtcclxuXHR3YXRjaGxpc3Q6IHdpbmRvdy5yYXRlcl93YXRjaGxpc3QgfHwgXCJwcmVmZXJlbmNlc1wiXHJcbn07XHJcbi8vIE1lZGlhV2lraSBjb25maWd1cmF0aW9uIHZhbHVlc1xyXG5jb25maWcubXcgPSBtdy5jb25maWcuZ2V0KCBbXHJcblx0XCJza2luXCIsXHJcblx0XCJ3Z1BhZ2VOYW1lXCIsXHJcblx0XCJ3Z05hbWVzcGFjZU51bWJlclwiLFxyXG5cdFwid2dVc2VyTmFtZVwiLFxyXG5cdFwid2dGb3JtYXR0ZWROYW1lc3BhY2VzXCIsXHJcblx0XCJ3Z01vbnRoTmFtZXNcIixcclxuXHRcIndnUmV2aXNpb25JZFwiLFxyXG5cdFwid2dTY3JpcHRQYXRoXCIsXHJcblx0XCJ3Z1NlcnZlclwiLFxyXG5cdFwid2dDYXRlZ29yaWVzXCIsXHJcblx0XCJ3Z0lzTWFpblBhZ2VcIlxyXG5dICk7XHJcblxyXG5jb25maWcucmVnZXggPSB7IC8qIGVzbGludC1kaXNhYmxlIG5vLXVzZWxlc3MtZXNjYXBlICovXHJcblx0Ly8gUGF0dGVybiB0byBmaW5kIHRlbXBsYXRlcywgd2hpY2ggbWF5IGNvbnRhaW4gb3RoZXIgdGVtcGxhdGVzXHJcblx0dGVtcGxhdGU6XHRcdC9cXHtcXHtcXHMqKFteI1xce1xcc10uKz8pXFxzKihcXHwoPzoufFxcbikqPyg/Oig/Olxce1xceyg/Oi58XFxuKSo/KD86KD86XFx7XFx7KD86LnxcXG4pKj9cXH1cXH0pKD86LnxcXG4pKj8pKj9cXH1cXH0pKD86LnxcXG4pKj8pKnwpXFx9XFx9XFxuPy9nLFxyXG5cdC8vIFBhdHRlcm4gdG8gZmluZCBgfHBhcmFtPXZhbHVlYCBvciBgfHZhbHVlYCwgd2hlcmUgYHZhbHVlYCBjYW4gb25seSBjb250YWluIGEgcGlwZVxyXG5cdC8vIGlmIHdpdGhpbiBzcXVhcmUgYnJhY2tldHMgKGkuZS4gd2lraWxpbmtzKSBvciBicmFjZXMgKGkuZS4gdGVtcGxhdGVzKVxyXG5cdHRlbXBsYXRlUGFyYW1zOlx0L1xcfCg/ISg/Oltee10rfXxbXlxcW10rXSkpKD86LnxcXHMpKj8oPz0oPzpcXHx8JCkoPyEoPzpbXntdK318W15cXFtdK10pKSkvZ1xyXG59OyAvKiBlc2xpbnQtZW5hYmxlIG5vLXVzZWxlc3MtZXNjYXBlICovXHJcbmNvbmZpZy5kZWZlcnJlZCA9IHt9O1xyXG5jb25maWcuYmFubmVyRGVmYXVsdHMgPSB7XHJcblx0Y2xhc3NlczogW1xyXG5cdFx0XCJGQVwiLFxyXG5cdFx0XCJGTFwiLFxyXG5cdFx0XCJBXCIsXHJcblx0XHRcIkdBXCIsXHJcblx0XHRcIkJcIixcclxuXHRcdFwiQ1wiLFxyXG5cdFx0XCJTdGFydFwiLFxyXG5cdFx0XCJTdHViXCIsXHJcblx0XHRcIkxpc3RcIlxyXG5cdF0sXHJcblx0aW1wb3J0YW5jZXM6IFtcclxuXHRcdFwiVG9wXCIsXHJcblx0XHRcIkhpZ2hcIixcclxuXHRcdFwiTWlkXCIsXHJcblx0XHRcIkxvd1wiXHJcblx0XSxcclxuXHRleHRlbmRlZENsYXNzZXM6IFtcclxuXHRcdFwiQ2F0ZWdvcnlcIixcclxuXHRcdFwiRHJhZnRcIixcclxuXHRcdFwiRmlsZVwiLFxyXG5cdFx0XCJQb3J0YWxcIixcclxuXHRcdFwiUHJvamVjdFwiLFxyXG5cdFx0XCJUZW1wbGF0ZVwiLFxyXG5cdFx0XCJCcGx1c1wiLFxyXG5cdFx0XCJGdXR1cmVcIixcclxuXHRcdFwiQ3VycmVudFwiLFxyXG5cdFx0XCJEaXNhbWJpZ1wiLFxyXG5cdFx0XCJOQVwiLFxyXG5cdFx0XCJSZWRpcmVjdFwiLFxyXG5cdFx0XCJCb29rXCJcclxuXHRdLFxyXG5cdGV4dGVuZGVkSW1wb3J0YW5jZXM6IFtcclxuXHRcdFwiVG9wXCIsXHJcblx0XHRcIkhpZ2hcIixcclxuXHRcdFwiTWlkXCIsXHJcblx0XHRcIkxvd1wiLFxyXG5cdFx0XCJCb3R0b21cIixcclxuXHRcdFwiTkFcIlxyXG5cdF1cclxufTtcclxuY29uZmlnLmN1c3RvbUNsYXNzZXMgPSB7XHJcblx0XCJXaWtpUHJvamVjdCBNaWxpdGFyeSBoaXN0b3J5XCI6IFtcclxuXHRcdFwiQUxcIixcclxuXHRcdFwiQkxcIixcclxuXHRcdFwiQ0xcIlxyXG5cdF0sXHJcblx0XCJXaWtpUHJvamVjdCBQb3J0YWxzXCI6IFtcclxuXHRcdFwiRlBvXCIsXHJcblx0XHRcIkNvbXBsZXRlXCIsXHJcblx0XHRcIlN1YnN0YW50aWFsXCIsXHJcblx0XHRcIkJhc2ljXCIsXHJcblx0XHRcIkluY29tcGxldGVcIixcclxuXHRcdFwiTWV0YVwiXHJcblx0XVxyXG59O1xyXG5jb25maWcuc2hlbGxUZW1wbGF0ZXMgPSBbXHJcblx0XCJXaWtpUHJvamVjdCBiYW5uZXIgc2hlbGxcIixcclxuXHRcIldpa2lQcm9qZWN0QmFubmVyc1wiLFxyXG5cdFwiV2lraVByb2plY3QgQmFubmVyc1wiLFxyXG5cdFwiV1BCXCIsXHJcblx0XCJXUEJTXCIsXHJcblx0XCJXaWtpcHJvamVjdGJhbm5lcnNoZWxsXCIsXHJcblx0XCJXaWtpUHJvamVjdCBCYW5uZXIgU2hlbGxcIixcclxuXHRcIldwYlwiLFxyXG5cdFwiV1BCYW5uZXJTaGVsbFwiLFxyXG5cdFwiV3Bic1wiLFxyXG5cdFwiV2lraXByb2plY3RiYW5uZXJzXCIsXHJcblx0XCJXUCBCYW5uZXIgU2hlbGxcIixcclxuXHRcIldQIGJhbm5lciBzaGVsbFwiLFxyXG5cdFwiQmFubmVyc2hlbGxcIixcclxuXHRcIldpa2lwcm9qZWN0IGJhbm5lciBzaGVsbFwiLFxyXG5cdFwiV2lraVByb2plY3QgQmFubmVycyBTaGVsbFwiLFxyXG5cdFwiV2lraVByb2plY3RCYW5uZXIgU2hlbGxcIixcclxuXHRcIldpa2lQcm9qZWN0QmFubmVyU2hlbGxcIixcclxuXHRcIldpa2lQcm9qZWN0IEJhbm5lclNoZWxsXCIsXHJcblx0XCJXaWtpcHJvamVjdEJhbm5lclNoZWxsXCIsXHJcblx0XCJXaWtpUHJvamVjdCBiYW5uZXIgc2hlbGwvcmVkaXJlY3RcIixcclxuXHRcIldpa2lQcm9qZWN0IFNoZWxsXCIsXHJcblx0XCJCYW5uZXIgc2hlbGxcIixcclxuXHRcIlNjb3BlIHNoZWxsXCIsXHJcblx0XCJQcm9qZWN0IHNoZWxsXCIsXHJcblx0XCJXaWtpUHJvamVjdCBiYW5uZXJcIlxyXG5dO1xyXG5jb25maWcuZGVmYXVsdFBhcmFtZXRlckRhdGEgPSB7XHJcblx0XCJhdXRvXCI6IHtcclxuXHRcdFwibGFiZWxcIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiQXV0by1yYXRlZFwiXHJcblx0XHR9LFxyXG5cdFx0XCJkZXNjcmlwdGlvblwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJBdXRvbWF0aWNhbGx5IHJhdGVkIGJ5IGEgYm90LiBBbGxvd2VkIHZhbHVlczogWyd5ZXMnXS5cIlxyXG5cdFx0fSxcclxuXHRcdFwiYXV0b3ZhbHVlXCI6IFwieWVzXCJcclxuXHR9LFxyXG5cdFwibGlzdGFzXCI6IHtcclxuXHRcdFwibGFiZWxcIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiTGlzdCBhc1wiXHJcblx0XHR9LFxyXG5cdFx0XCJkZXNjcmlwdGlvblwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJTb3J0a2V5IGZvciB0YWxrIHBhZ2VcIlxyXG5cdFx0fVxyXG5cdH0sXHJcblx0XCJzbWFsbFwiOiB7XHJcblx0XHRcImxhYmVsXCI6IHtcclxuXHRcdFx0XCJlblwiOiBcIlNtYWxsP1wiLFxyXG5cdFx0fSxcclxuXHRcdFwiZGVzY3JpcHRpb25cIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiRGlzcGxheSBhIHNtYWxsIHZlcnNpb24uIEFsbG93ZWQgdmFsdWVzOiBbJ3llcyddLlwiXHJcblx0XHR9LFxyXG5cdFx0XCJhdXRvdmFsdWVcIjogXCJ5ZXNcIlxyXG5cdH0sXHJcblx0XCJhdHRlbnRpb25cIjoge1xyXG5cdFx0XCJsYWJlbFwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJBdHRlbnRpb24gcmVxdWlyZWQ/XCIsXHJcblx0XHR9LFxyXG5cdFx0XCJkZXNjcmlwdGlvblwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJJbW1lZGlhdGUgYXR0ZW50aW9uIHJlcXVpcmVkLiBBbGxvd2VkIHZhbHVlczogWyd5ZXMnXS5cIlxyXG5cdFx0fSxcclxuXHRcdFwiYXV0b3ZhbHVlXCI6IFwieWVzXCJcclxuXHR9LFxyXG5cdFwibmVlZHMtaW1hZ2VcIjoge1xyXG5cdFx0XCJsYWJlbFwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJOZWVkcyBpbWFnZT9cIixcclxuXHRcdH0sXHJcblx0XHRcImRlc2NyaXB0aW9uXCI6IHtcclxuXHRcdFx0XCJlblwiOiBcIlJlcXVlc3QgdGhhdCBhbiBpbWFnZSBvciBwaG90b2dyYXBoIG9mIHRoZSBzdWJqZWN0IGJlIGFkZGVkIHRvIHRoZSBhcnRpY2xlLiBBbGxvd2VkIHZhbHVlczogWyd5ZXMnXS5cIlxyXG5cdFx0fSxcclxuXHRcdFwiYWxpYXNlc1wiOiBbXHJcblx0XHRcdFwibmVlZHMtcGhvdG9cIlxyXG5cdFx0XSxcclxuXHRcdFwiYXV0b3ZhbHVlXCI6IFwieWVzXCIsXHJcblx0XHRcInN1Z2dlc3RlZFwiOiB0cnVlXHJcblx0fSxcclxuXHRcIm5lZWRzLWluZm9ib3hcIjoge1xyXG5cdFx0XCJsYWJlbFwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJOZWVkcyBpbmZvYm94P1wiLFxyXG5cdFx0fSxcclxuXHRcdFwiZGVzY3JpcHRpb25cIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiUmVxdWVzdCB0aGF0IGFuIGluZm9ib3ggYmUgYWRkZWQgdG8gdGhlIGFydGljbGUuIEFsbG93ZWQgdmFsdWVzOiBbJ3llcyddLlwiXHJcblx0XHR9LFxyXG5cdFx0XCJhbGlhc2VzXCI6IFtcclxuXHRcdFx0XCJuZWVkcy1waG90b1wiXHJcblx0XHRdLFxyXG5cdFx0XCJhdXRvdmFsdWVcIjogXCJ5ZXNcIixcclxuXHRcdFwic3VnZ2VzdGVkXCI6IHRydWVcclxuXHR9XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjb25maWc7IiwiLy8gQXR0cmlidXRpb246IERpZmYgc3R5bGVzIGZyb20gPGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1dpa2lwZWRpYTpBdXRvV2lraUJyb3dzZXIvc3R5bGUuY3NzPlxyXG52YXIgZGlmZlN0eWxlcyA9IGB0YWJsZS5kaWZmLCB0ZC5kaWZmLW90aXRsZSwgdGQuZGlmZi1udGl0bGUgeyBiYWNrZ3JvdW5kLWNvbG9yOiB3aGl0ZTsgfVxyXG50ZC5kaWZmLW90aXRsZSwgdGQuZGlmZi1udGl0bGUgeyB0ZXh0LWFsaWduOiBjZW50ZXI7IH1cclxudGQuZGlmZi1tYXJrZXIgeyB0ZXh0LWFsaWduOiByaWdodDsgZm9udC13ZWlnaHQ6IGJvbGQ7IGZvbnQtc2l6ZTogMS4yNWVtOyB9XHJcbnRkLmRpZmYtbGluZW5vIHsgZm9udC13ZWlnaHQ6IGJvbGQ7IH1cclxudGQuZGlmZi1hZGRlZGxpbmUsIHRkLmRpZmYtZGVsZXRlZGxpbmUsIHRkLmRpZmYtY29udGV4dCB7IGZvbnQtc2l6ZTogODglOyB2ZXJ0aWNhbC1hbGlnbjogdG9wOyB3aGl0ZS1zcGFjZTogLW1vei1wcmUtd3JhcDsgd2hpdGUtc3BhY2U6IHByZS13cmFwOyB9XHJcbnRkLmRpZmYtYWRkZWRsaW5lLCB0ZC5kaWZmLWRlbGV0ZWRsaW5lIHsgYm9yZGVyLXN0eWxlOiBzb2xpZDsgYm9yZGVyLXdpZHRoOiAxcHggMXB4IDFweCA0cHg7IGJvcmRlci1yYWRpdXM6IDAuMzNlbTsgfVxyXG50ZC5kaWZmLWFkZGVkbGluZSB7IGJvcmRlci1jb2xvcjogI2EzZDNmZjsgfVxyXG50ZC5kaWZmLWRlbGV0ZWRsaW5lIHsgYm9yZGVyLWNvbG9yOiAjZmZlNDljOyB9XHJcbnRkLmRpZmYtY29udGV4dCB7IGJhY2tncm91bmQ6ICNmM2YzZjM7IGNvbG9yOiAjMzMzMzMzOyBib3JkZXItc3R5bGU6IHNvbGlkOyBib3JkZXItd2lkdGg6IDFweCAxcHggMXB4IDRweDsgYm9yZGVyLWNvbG9yOiAjZTZlNmU2OyBib3JkZXItcmFkaXVzOiAwLjMzZW07IH1cclxuLmRpZmZjaGFuZ2UgeyBmb250LXdlaWdodDogYm9sZDsgdGV4dC1kZWNvcmF0aW9uOiBub25lOyB9XHJcbnRhYmxlLmRpZmYge1xyXG4gICAgYm9yZGVyOiBub25lO1xyXG4gICAgd2lkdGg6IDk4JTsgYm9yZGVyLXNwYWNpbmc6IDRweDtcclxuICAgIHRhYmxlLWxheW91dDogZml4ZWQ7IC8qIEVuc3VyZXMgdGhhdCBjb2x1bXMgYXJlIG9mIGVxdWFsIHdpZHRoICovXHJcbn1cclxudGQuZGlmZi1hZGRlZGxpbmUgLmRpZmZjaGFuZ2UsIHRkLmRpZmYtZGVsZXRlZGxpbmUgLmRpZmZjaGFuZ2UgeyBib3JkZXItcmFkaXVzOiAwLjMzZW07IHBhZGRpbmc6IDAuMjVlbSAwOyB9XHJcbnRkLmRpZmYtYWRkZWRsaW5lIC5kaWZmY2hhbmdlIHtcdGJhY2tncm91bmQ6ICNkOGVjZmY7IH1cclxudGQuZGlmZi1kZWxldGVkbGluZSAuZGlmZmNoYW5nZSB7IGJhY2tncm91bmQ6ICNmZWVlYzg7IH1cclxudGFibGUuZGlmZiB0ZCB7XHRwYWRkaW5nOiAwLjMzZW0gMC42NmVtOyB9XHJcbnRhYmxlLmRpZmYgY29sLmRpZmYtbWFya2VyIHsgd2lkdGg6IDIlOyB9XHJcbnRhYmxlLmRpZmYgY29sLmRpZmYtY29udGVudCB7IHdpZHRoOiA0OCU7IH1cclxudGFibGUuZGlmZiB0ZCBkaXYge1xyXG4gICAgLyogRm9yY2Utd3JhcCB2ZXJ5IGxvbmcgbGluZXMgc3VjaCBhcyBVUkxzIG9yIHBhZ2Utd2lkZW5pbmcgY2hhciBzdHJpbmdzLiAqL1xyXG4gICAgd29yZC13cmFwOiBicmVhay13b3JkO1xyXG4gICAgLyogQXMgZmFsbGJhY2sgKEZGPDMuNSwgT3BlcmEgPDEwLjUpLCBzY3JvbGxiYXJzIHdpbGwgYmUgYWRkZWQgZm9yIHZlcnkgd2lkZSBjZWxsc1xyXG4gICAgICAgIGluc3RlYWQgb2YgdGV4dCBvdmVyZmxvd2luZyBvciB3aWRlbmluZyAqL1xyXG4gICAgb3ZlcmZsb3c6IGF1dG87XHJcbn1gO1xyXG5cclxuZXhwb3J0IHsgZGlmZlN0eWxlcyB9OyIsImltcG9ydCB7QVBJLCBpc0FmdGVyRGF0ZSwgbWFrZUVycm9yTXNnfSBmcm9tIFwiLi91dGlsXCI7XHJcbmltcG9ydCAqIGFzIGNhY2hlIGZyb20gXCIuL2NhY2hlXCI7XHJcblxyXG52YXIgY2FjaGVCYW5uZXJzID0gZnVuY3Rpb24oYmFubmVycywgYmFubmVyT3B0aW9ucykge1xyXG5cdGNhY2hlLndyaXRlKFwiYmFubmVyc1wiLCBiYW5uZXJzLCAyLCA2MCk7XHJcblx0Y2FjaGUud3JpdGUoXCJiYW5uZXJPcHRpb25zXCIsIGJhbm5lck9wdGlvbnMsIDIsIDYwKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXRzIGJhbm5lcnMvb3B0aW9ucyBmcm9tIHRoZSBBcGlcclxuICogXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlfSBSZXNvbHZlZCB3aXRoOiBiYW5uZXJzIG9iamVjdCwgYmFubmVyT3B0aW9ucyBhcnJheVxyXG4gKi9cclxudmFyIGdldExpc3RPZkJhbm5lcnNGcm9tQXBpID0gZnVuY3Rpb24oKSB7XHJcblxyXG5cdHZhciBmaW5pc2hlZFByb21pc2UgPSAkLkRlZmVycmVkKCk7XHJcblxyXG5cdHZhciBxdWVyeVNrZWxldG9uID0ge1xyXG5cdFx0YWN0aW9uOiBcInF1ZXJ5XCIsXHJcblx0XHRmb3JtYXQ6IFwianNvblwiLFxyXG5cdFx0bGlzdDogXCJjYXRlZ29yeW1lbWJlcnNcIixcclxuXHRcdGNtcHJvcDogXCJ0aXRsZVwiLFxyXG5cdFx0Y21uYW1lc3BhY2U6IFwiMTBcIixcclxuXHRcdGNtbGltaXQ6IFwiNTAwXCJcclxuXHR9O1xyXG5cclxuXHR2YXIgY2F0ZWdvcmllcyA9IFtcclxuXHRcdHtcclxuXHRcdFx0dGl0bGU6XCIgQ2F0ZWdvcnk6V2lraVByb2plY3QgYmFubmVycyB3aXRoIHF1YWxpdHkgYXNzZXNzbWVudFwiLFxyXG5cdFx0XHRhYmJyZXZpYXRpb246IFwid2l0aFJhdGluZ3NcIixcclxuXHRcdFx0YmFubmVyczogW10sXHJcblx0XHRcdHByb2Nlc3NlZDogJC5EZWZlcnJlZCgpXHJcblx0XHR9LFxyXG5cdFx0e1xyXG5cdFx0XHR0aXRsZTogXCJDYXRlZ29yeTpXaWtpUHJvamVjdCBiYW5uZXJzIHdpdGhvdXQgcXVhbGl0eSBhc3Nlc3NtZW50XCIsXHJcblx0XHRcdGFiYnJldmlhdGlvbjogXCJ3aXRob3V0UmF0aW5nc1wiLFxyXG5cdFx0XHRiYW5uZXJzOiBbXSxcclxuXHRcdFx0cHJvY2Vzc2VkOiAkLkRlZmVycmVkKClcclxuXHRcdH0sXHJcblx0XHR7XHJcblx0XHRcdHRpdGxlOiBcIkNhdGVnb3J5Oldpa2lQcm9qZWN0IGJhbm5lciB3cmFwcGVyIHRlbXBsYXRlc1wiLFxyXG5cdFx0XHRhYmJyZXZpYXRpb246IFwid3JhcHBlcnNcIixcclxuXHRcdFx0YmFubmVyczogW10sXHJcblx0XHRcdHByb2Nlc3NlZDogJC5EZWZlcnJlZCgpXHJcblx0XHR9XHJcblx0XTtcclxuXHJcblx0dmFyIHByb2Nlc3NRdWVyeSA9IGZ1bmN0aW9uKHJlc3VsdCwgY2F0SW5kZXgpIHtcclxuXHRcdGlmICggIXJlc3VsdC5xdWVyeSB8fCAhcmVzdWx0LnF1ZXJ5LmNhdGVnb3J5bWVtYmVycyApIHtcclxuXHRcdFx0Ly8gTm8gcmVzdWx0c1xyXG5cdFx0XHQvLyBUT0RPOiBlcnJvciBvciB3YXJuaW5nICoqKioqKioqXHJcblx0XHRcdGZpbmlzaGVkUHJvbWlzZS5yZWplY3QoKTtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHQvLyBHYXRoZXIgdGl0bGVzIGludG8gYXJyYXkgLSBleGNsdWRpbmcgXCJUZW1wbGF0ZTpcIiBwcmVmaXhcclxuXHRcdHZhciByZXN1bHRUaXRsZXMgPSByZXN1bHQucXVlcnkuY2F0ZWdvcnltZW1iZXJzLm1hcChmdW5jdGlvbihpbmZvKSB7XHJcblx0XHRcdHJldHVybiBpbmZvLnRpdGxlLnNsaWNlKDkpO1xyXG5cdFx0fSk7XHJcblx0XHRBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseShjYXRlZ29yaWVzW2NhdEluZGV4XS5iYW5uZXJzLCByZXN1bHRUaXRsZXMpO1xyXG5cdFx0XHJcblx0XHQvLyBDb250aW51ZSBxdWVyeSBpZiBuZWVkZWRcclxuXHRcdGlmICggcmVzdWx0LmNvbnRpbnVlICkge1xyXG5cdFx0XHRkb0FwaVF1ZXJ5KCQuZXh0ZW5kKGNhdGVnb3JpZXNbY2F0SW5kZXhdLnF1ZXJ5LCByZXN1bHQuY29udGludWUpLCBjYXRJbmRleCk7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHRcdFxyXG5cdFx0Y2F0ZWdvcmllc1tjYXRJbmRleF0ucHJvY2Vzc2VkLnJlc29sdmUoKTtcclxuXHR9O1xyXG5cclxuXHR2YXIgZG9BcGlRdWVyeSA9IGZ1bmN0aW9uKHEsIGNhdEluZGV4KSB7XHJcblx0XHRBUEkuZ2V0KCBxIClcclxuXHRcdFx0LmRvbmUoIGZ1bmN0aW9uKHJlc3VsdCkge1xyXG5cdFx0XHRcdHByb2Nlc3NRdWVyeShyZXN1bHQsIGNhdEluZGV4KTtcclxuXHRcdFx0fSApXHJcblx0XHRcdC5mYWlsKCBmdW5jdGlvbihjb2RlLCBqcXhocikge1xyXG5cdFx0XHRcdGNvbnNvbGUud2FybihcIltSYXRlcl0gXCIgKyBtYWtlRXJyb3JNc2coY29kZSwganF4aHIsIFwiQ291bGQgbm90IHJldHJpZXZlIHBhZ2VzIGZyb20gW1s6XCIgKyBxLmNtdGl0bGUgKyBcIl1dXCIpKTtcclxuXHRcdFx0XHRmaW5pc2hlZFByb21pc2UucmVqZWN0KCk7XHJcblx0XHRcdH0gKTtcclxuXHR9O1xyXG5cdFxyXG5cdGNhdGVnb3JpZXMuZm9yRWFjaChmdW5jdGlvbihjYXQsIGluZGV4LCBhcnIpIHtcclxuXHRcdGNhdC5xdWVyeSA9ICQuZXh0ZW5kKCB7IFwiY210aXRsZVwiOmNhdC50aXRsZSB9LCBxdWVyeVNrZWxldG9uICk7XHJcblx0XHQkLndoZW4oIGFycltpbmRleC0xXSAmJiBhcnJbaW5kZXgtMV0ucHJvY2Vzc2VkIHx8IHRydWUgKS50aGVuKGZ1bmN0aW9uKCl7XHJcblx0XHRcdGRvQXBpUXVlcnkoY2F0LnF1ZXJ5LCBpbmRleCk7XHJcblx0XHR9KTtcclxuXHR9KTtcclxuXHRcclxuXHRjYXRlZ29yaWVzW2NhdGVnb3JpZXMubGVuZ3RoLTFdLnByb2Nlc3NlZC50aGVuKGZ1bmN0aW9uKCl7XHJcblx0XHR2YXIgYmFubmVycyA9IHt9O1xyXG5cdFx0dmFyIHN0YXNoQmFubmVyID0gZnVuY3Rpb24oY2F0T2JqZWN0KSB7XHJcblx0XHRcdGJhbm5lcnNbY2F0T2JqZWN0LmFiYnJldmlhdGlvbl0gPSBjYXRPYmplY3QuYmFubmVycztcclxuXHRcdH07XHJcblx0XHR2YXIgbWVyZ2VCYW5uZXJzID0gZnVuY3Rpb24obWVyZ2VJbnRvVGhpc0FycmF5LCBjYXRPYmplY3QpIHtcclxuXHRcdFx0cmV0dXJuICQubWVyZ2UobWVyZ2VJbnRvVGhpc0FycmF5LCBjYXRPYmplY3QuYmFubmVycyk7XHJcblx0XHR9O1xyXG5cdFx0dmFyIG1ha2VPcHRpb24gPSBmdW5jdGlvbihiYW5uZXJOYW1lKSB7XHJcblx0XHRcdHZhciBpc1dyYXBwZXIgPSAoIC0xICE9PSAkLmluQXJyYXkoYmFubmVyTmFtZSwgY2F0ZWdvcmllc1syXS5iYW5uZXJzKSApO1xyXG5cdFx0XHRyZXR1cm4ge1xyXG5cdFx0XHRcdGRhdGE6ICAoIGlzV3JhcHBlciA/IFwic3Vic3Q6XCIgOiBcIlwiKSArIGJhbm5lck5hbWUsXHJcblx0XHRcdFx0bGFiZWw6IGJhbm5lck5hbWUucmVwbGFjZShcIldpa2lQcm9qZWN0IFwiLCBcIlwiKSArICggaXNXcmFwcGVyID8gXCIgW3RlbXBsYXRlIHdyYXBwZXJdXCIgOiBcIlwiKVxyXG5cdFx0XHR9O1xyXG5cdFx0fTtcclxuXHRcdGNhdGVnb3JpZXMuZm9yRWFjaChzdGFzaEJhbm5lcik7XHJcblx0XHRcclxuXHRcdHZhciBiYW5uZXJPcHRpb25zID0gY2F0ZWdvcmllcy5yZWR1Y2UobWVyZ2VCYW5uZXJzLCBbXSkubWFwKG1ha2VPcHRpb24pO1xyXG5cdFx0XHJcblx0XHRmaW5pc2hlZFByb21pc2UucmVzb2x2ZShiYW5uZXJzLCBiYW5uZXJPcHRpb25zKTtcclxuXHR9KTtcclxuXHRcclxuXHRyZXR1cm4gZmluaXNoZWRQcm9taXNlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldHMgYmFubmVycy9vcHRpb25zIGZyb20gY2FjaGUsIGlmIHRoZXJlIGFuZCBub3QgdG9vIG9sZFxyXG4gKiBcclxuICogQHJldHVybnMge1Byb21pc2V9IFJlc29sdmVkIHdpdGg6IGJhbm5lcnMgb2JqZWN0LCBiYW5uZXJPcHRpb25zIG9iamVjdFxyXG4gKi9cclxudmFyIGdldEJhbm5lcnNGcm9tQ2FjaGUgPSBmdW5jdGlvbigpIHtcclxuXHR2YXIgY2FjaGVkQmFubmVycyA9IGNhY2hlLnJlYWQoXCJiYW5uZXJzXCIpO1xyXG5cdHZhciBjYWNoZWRCYW5uZXJPcHRpb25zID0gY2FjaGUucmVhZChcImJhbm5lck9wdGlvbnNcIik7XHJcblx0aWYgKFxyXG5cdFx0IWNhY2hlZEJhbm5lcnMgfHxcclxuXHRcdCFjYWNoZWRCYW5uZXJzLnZhbHVlIHx8ICFjYWNoZWRCYW5uZXJzLnN0YWxlRGF0ZSB8fFxyXG5cdFx0IWNhY2hlZEJhbm5lck9wdGlvbnMgfHxcclxuXHRcdCFjYWNoZWRCYW5uZXJPcHRpb25zLnZhbHVlIHx8ICFjYWNoZWRCYW5uZXJPcHRpb25zLnN0YWxlRGF0ZVxyXG5cdCkge1xyXG5cdFx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3QoKTtcclxuXHR9XHJcblx0aWYgKCBpc0FmdGVyRGF0ZShjYWNoZWRCYW5uZXJzLnN0YWxlRGF0ZSkgfHwgaXNBZnRlckRhdGUoY2FjaGVkQmFubmVyT3B0aW9ucy5zdGFsZURhdGUpICkge1xyXG5cdFx0Ly8gVXBkYXRlIGluIHRoZSBiYWNrZ3JvdW5kOyBzdGlsbCB1c2Ugb2xkIGxpc3QgdW50aWwgdGhlbiAgXHJcblx0XHRnZXRMaXN0T2ZCYW5uZXJzRnJvbUFwaSgpLnRoZW4oY2FjaGVCYW5uZXJzKTtcclxuXHR9XHJcblx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZXNvbHZlKGNhY2hlZEJhbm5lcnMudmFsdWUsIGNhY2hlZEJhbm5lck9wdGlvbnMudmFsdWUpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldHMgYmFubmVycy9vcHRpb25zIGZyb20gY2FjaGUgb3IgQVBJLlxyXG4gKiBIYXMgc2lkZSBhZmZlY3Qgb2YgYWRkaW5nL3VwZGF0aW5nL2NsZWFyaW5nIGNhY2hlLlxyXG4gKiBcclxuICogQHJldHVybnMge1Byb21pc2U8T2JqZWN0LCBBcnJheT59IGJhbm5lcnMgb2JqZWN0LCBiYW5uZXJPcHRpb25zIG9iamVjdFxyXG4gKi9cclxudmFyIGdldEJhbm5lcnMgPSAoKSA9PiBnZXRCYW5uZXJzRnJvbUNhY2hlKCkudGhlbihcclxuXHQvLyBTdWNjZXNzOiBwYXNzIHRocm91Z2hcclxuXHQoYmFubmVycywgb3B0aW9ucykgPT4gJC5EZWZlcnJlZCgpLnJlc29sdmUoYmFubmVycywgb3B0aW9ucyksXHJcblx0Ly8gRmFpbHVyZTogZ2V0IGZyb20gQXBpLCB0aGVuIGNhY2hlIHRoZW1cclxuXHQoKSA9PiB7XHJcblx0XHR2YXIgYmFubmVyc1Byb21pc2UgPSBnZXRMaXN0T2ZCYW5uZXJzRnJvbUFwaSgpO1xyXG5cdFx0YmFubmVyc1Byb21pc2UudGhlbihjYWNoZUJhbm5lcnMpO1xyXG5cdFx0cmV0dXJuIGJhbm5lcnNQcm9taXNlO1xyXG5cdH1cclxuKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGdldEJhbm5lcnM7IiwiaW1wb3J0IGNvbmZpZyBmcm9tIFwiLi9jb25maWdcIjtcclxuaW1wb3J0IHtBUEl9IGZyb20gXCIuL3V0aWxcIjtcclxuaW1wb3J0IHsgcGFyc2VUZW1wbGF0ZXMsIGdldFdpdGhSZWRpcmVjdFRvIH0gZnJvbSBcIi4vVGVtcGxhdGVcIjtcclxuaW1wb3J0IGdldEJhbm5lcnMgZnJvbSBcIi4vZ2V0QmFubmVyc1wiO1xyXG5pbXBvcnQgKiBhcyBjYWNoZSBmcm9tIFwiLi9jYWNoZVwiO1xyXG5pbXBvcnQgd2luZG93TWFuYWdlciBmcm9tIFwiLi93aW5kb3dNYW5hZ2VyXCI7XHJcblxyXG52YXIgc2V0dXBSYXRlciA9IGZ1bmN0aW9uKGNsaWNrRXZlbnQpIHtcclxuXHRpZiAoIGNsaWNrRXZlbnQgKSB7XHJcblx0XHRjbGlja0V2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0fVxyXG5cclxuXHR2YXIgc2V0dXBDb21wbGV0ZWRQcm9taXNlID0gJC5EZWZlcnJlZCgpO1xyXG4gICAgXHJcblx0dmFyIGN1cnJlbnRQYWdlID0gbXcuVGl0bGUubmV3RnJvbVRleHQoY29uZmlnLm13LndnUGFnZU5hbWUpO1xyXG5cdHZhciB0YWxrUGFnZSA9IGN1cnJlbnRQYWdlICYmIGN1cnJlbnRQYWdlLmdldFRhbGtQYWdlKCk7XHJcblx0dmFyIHN1YmplY3RQYWdlID0gY3VycmVudFBhZ2UgJiYgY3VycmVudFBhZ2UuZ2V0U3ViamVjdFBhZ2UoKTtcclxuIFxyXG5cdC8vIEdldCBsaXN0cyBvZiBhbGwgYmFubmVycyAodGFzayAxKVxyXG5cdHZhciBiYW5uZXJzUHJvbWlzZSA9IGdldEJhbm5lcnMoKTtcclxuXHJcblx0Ly8gTG9hZCB0YWxrIHBhZ2UgKHRhc2sgMilcclxuXHR2YXIgbG9hZFRhbGtQcm9taXNlID0gQVBJLmdldCgge1xyXG5cdFx0YWN0aW9uOiBcInF1ZXJ5XCIsXHJcblx0XHRwcm9wOiBcInJldmlzaW9uc1wiLFxyXG5cdFx0cnZwcm9wOiBcImNvbnRlbnRcIixcclxuXHRcdHJ2c2VjdGlvbjogXCIwXCIsXHJcblx0XHR0aXRsZXM6IHRhbGtQYWdlLmdldFByZWZpeGVkVGV4dCgpLFxyXG5cdFx0aW5kZXhwYWdlaWRzOiAxXHJcblx0fSApLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xyXG5cdFx0dmFyIGlkID0gcmVzdWx0LnF1ZXJ5LnBhZ2VpZHM7XHRcdFxyXG5cdFx0dmFyIHdpa2l0ZXh0ID0gKCBpZCA8IDAgKSA/IFwiXCIgOiByZXN1bHQucXVlcnkucGFnZXNbaWRdLnJldmlzaW9uc1swXVtcIipcIl07XHJcblx0XHRyZXR1cm4gd2lraXRleHQ7XHJcblx0fSk7XHJcblxyXG5cdC8vIFBhcnNlIHRhbGsgcGFnZSBmb3IgYmFubmVycyAodGFzayAzKVxyXG5cdHZhciBwYXJzZVRhbGtQcm9taXNlID0gbG9hZFRhbGtQcm9taXNlLnRoZW4od2lraXRleHQgPT4gcGFyc2VUZW1wbGF0ZXMod2lraXRleHQsIHRydWUpKSAvLyBHZXQgYWxsIHRlbXBsYXRlc1xyXG5cdFx0LnRoZW4odGVtcGxhdGVzID0+IGdldFdpdGhSZWRpcmVjdFRvKHRlbXBsYXRlcykpIC8vIENoZWNrIGZvciByZWRpcmVjdHNcclxuXHRcdC50aGVuKHRlbXBsYXRlcyA9PiB7XHJcblx0XHRcdHJldHVybiBiYW5uZXJzUHJvbWlzZS50aGVuKChhbGxCYW5uZXJzKSA9PiB7IC8vIEdldCBsaXN0IG9mIGFsbCBiYW5uZXIgdGVtcGxhdGVzXHJcblx0XHRcdFx0cmV0dXJuIHRlbXBsYXRlcy5maWx0ZXIodGVtcGxhdGUgPT4geyAvLyBGaWx0ZXIgb3V0IG5vbi1iYW5uZXJzXHJcblx0XHRcdFx0XHR2YXIgbWFpblRleHQgPSB0ZW1wbGF0ZS5yZWRpcmVjdFRvXHJcblx0XHRcdFx0XHRcdD8gdGVtcGxhdGUucmVkaXJlY3RUby5nZXRNYWluVGV4dCgpXHJcblx0XHRcdFx0XHRcdDogdGVtcGxhdGUuZ2V0VGl0bGUoKS5nZXRNYWluVGV4dCgpO1xyXG5cdFx0XHRcdFx0cmV0dXJuIGFsbEJhbm5lcnMud2l0aFJhdGluZ3MuaW5jbHVkZXMobWFpblRleHQpIHx8IFxyXG4gICAgICAgICAgICAgICAgICAgIGFsbEJhbm5lcnMud2l0aG91dFJhdGluZ3MuaW5jbHVkZXMobWFpblRleHQpIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgYWxsQmFubmVycy53cmFwcGVycy5pbmNsdWRlcyhtYWluVGV4dCk7XHJcblx0XHRcdFx0fSlcclxuXHRcdFx0XHRcdC5tYXAoZnVuY3Rpb24odGVtcGxhdGUpIHsgLy8gU2V0IHdyYXBwZXIgdGFyZ2V0IGlmIG5lZWRlZFxyXG5cdFx0XHRcdFx0XHR2YXIgbWFpblRleHQgPSB0ZW1wbGF0ZS5yZWRpcmVjdFRvXHJcblx0XHRcdFx0XHRcdFx0PyB0ZW1wbGF0ZS5yZWRpcmVjdFRvLmdldE1haW5UZXh0KClcclxuXHRcdFx0XHRcdFx0XHQ6IHRlbXBsYXRlLmdldFRpdGxlKCkuZ2V0TWFpblRleHQoKTtcclxuXHRcdFx0XHRcdFx0aWYgKGFsbEJhbm5lcnMud3JhcHBlcnMuaW5jbHVkZXMobWFpblRleHQpKSB7XHJcblx0XHRcdFx0XHRcdFx0dGVtcGxhdGUucmVkaXJlY3RzVG8gPSBtdy5UaXRsZS5uZXdGcm9tVGV4dChcIlRlbXBsYXRlOlN1YnN0OlwiICsgbWFpblRleHQpO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdHJldHVybiB0ZW1wbGF0ZTtcclxuXHRcdFx0XHRcdH0pO1xyXG5cdFx0XHR9KTtcclxuXHRcdH0pO1xyXG5cclxuXHQvLyBSZXRyaWV2ZSBhbmQgc3RvcmUgVGVtcGxhdGVEYXRhICh0YXNrIDQpXHJcblx0dmFyIHRlbXBsYXRlRGF0YVByb21pc2UgPSBwYXJzZVRhbGtQcm9taXNlLnRoZW4odGVtcGxhdGVzID0+IHtcclxuXHRcdHRlbXBsYXRlcy5mb3JFYWNoKHRlbXBsYXRlID0+IHRlbXBsYXRlLnNldFBhcmFtRGF0YUFuZFN1Z2dlc3Rpb25zKCkpO1xyXG5cdFx0cmV0dXJuIHRlbXBsYXRlcztcclxuXHR9KTtcclxuXHJcblx0Ly8gQ2hlY2sgaWYgcGFnZSBpcyBhIHJlZGlyZWN0ICh0YXNrIDUpIC0gYnV0IGRvbid0IGVycm9yIG91dCBpZiByZXF1ZXN0IGZhaWxzXHJcblx0dmFyIHJlZGlyZWN0Q2hlY2tQcm9taXNlID0gQVBJLmdldFJhdyhzdWJqZWN0UGFnZS5nZXRQcmVmaXhlZFRleHQoKSlcclxuXHRcdC50aGVuKFxyXG5cdFx0XHQvLyBTdWNjZXNzXHJcblx0XHRcdGZ1bmN0aW9uKHJhd1BhZ2UpIHsgXHJcblx0XHRcdFx0aWYgKCAvXlxccyojUkVESVJFQ1QvaS50ZXN0KHJhd1BhZ2UpICkge1xyXG5cdFx0XHRcdFx0Ly8gZ2V0IHJlZGlyZWN0aW9uIHRhcmdldCwgb3IgYm9vbGVhbiB0cnVlXHJcblx0XHRcdFx0XHRyZXR1cm4gcmF3UGFnZS5zbGljZShyYXdQYWdlLmluZGV4T2YoXCJbW1wiKSsyLCByYXdQYWdlLmluZGV4T2YoXCJdXVwiKSkgfHwgdHJ1ZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHR9LFxyXG5cdFx0XHQvLyBGYWlsdXJlIChpZ25vcmVkKVxyXG5cdFx0XHRmdW5jdGlvbigpIHsgcmV0dXJuIG51bGw7IH1cclxuXHRcdCk7XHJcblxyXG5cdC8vIFJldHJpZXZlIHJhdGluZyBmcm9tIE9SRVMgKHRhc2sgNiwgb25seSBuZWVkZWQgZm9yIGFydGljbGVzKVxyXG5cdHZhciBzaG91bGRHZXRPcmVzID0gKCBjb25maWcubXcud2dOYW1lc3BhY2VOdW1iZXIgPD0gMSApO1xyXG5cdGlmICggc2hvdWxkR2V0T3JlcyApIHtcclxuXHRcdHZhciBsYXRlc3RSZXZJZFByb21pc2UgPSBjdXJyZW50UGFnZS5pc1RhbGtQYWdlKClcclxuXHRcdFx0PyAkLkRlZmVycmVkKCkucmVzb2x2ZShjb25maWcubXcud2dSZXZpc2lvbklkKVxyXG5cdFx0XHQ6IFx0QVBJLmdldCgge1xyXG5cdFx0XHRcdGFjdGlvbjogXCJxdWVyeVwiLFxyXG5cdFx0XHRcdGZvcm1hdDogXCJqc29uXCIsXHJcblx0XHRcdFx0cHJvcDogXCJyZXZpc2lvbnNcIixcclxuXHRcdFx0XHR0aXRsZXM6IHN1YmplY3RQYWdlLmdldFByZWZpeGVkVGV4dCgpLFxyXG5cdFx0XHRcdHJ2cHJvcDogXCJpZHNcIixcclxuXHRcdFx0XHRpbmRleHBhZ2VpZHM6IDFcclxuXHRcdFx0fSApLnRoZW4oZnVuY3Rpb24ocmVzdWx0KSB7XHJcblx0XHRcdFx0aWYgKHJlc3VsdC5xdWVyeS5yZWRpcmVjdHMpIHtcclxuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dmFyIGlkID0gcmVzdWx0LnF1ZXJ5LnBhZ2VpZHM7XHJcblx0XHRcdFx0dmFyIHBhZ2UgPSByZXN1bHQucXVlcnkucGFnZXNbaWRdO1xyXG5cdFx0XHRcdGlmIChwYWdlLm1pc3NpbmcgPT09IFwiXCIpIHtcclxuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKCBpZCA8IDAgKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gJC5EZWZlcnJlZCgpLnJlamVjdCgpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gcGFnZS5yZXZpc2lvbnNbMF0ucmV2aWQ7XHJcblx0XHRcdH0pO1xyXG5cdFx0dmFyIG9yZXNQcm9taXNlID0gbGF0ZXN0UmV2SWRQcm9taXNlLnRoZW4oZnVuY3Rpb24obGF0ZXN0UmV2SWQpIHtcclxuXHRcdFx0aWYgKCFsYXRlc3RSZXZJZCkge1xyXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gQVBJLmdldE9SRVMobGF0ZXN0UmV2SWQpXHJcblx0XHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzdWx0KSB7XHJcblx0XHRcdFx0XHR2YXIgZGF0YSA9IHJlc3VsdC5lbndpa2kuc2NvcmVzW2xhdGVzdFJldklkXS53cDEwO1xyXG5cdFx0XHRcdFx0aWYgKCBkYXRhLmVycm9yICkge1xyXG5cdFx0XHRcdFx0XHRyZXR1cm4gJC5EZWZlcnJlZCgpLnJlamVjdChkYXRhLmVycm9yLnR5cGUsIGRhdGEuZXJyb3IubWVzc2FnZSk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRyZXR1cm4gZGF0YS5zY29yZS5wcmVkaWN0aW9uO1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHQvLyBPcGVuIHRoZSBsb2FkIGRpYWxvZ1xyXG5cdHZhciBpc09wZW5lZFByb21pc2UgPSAkLkRlZmVycmVkKCk7XHJcblx0dmFyIGxvYWREaWFsb2dXaW4gPSB3aW5kb3dNYW5hZ2VyLm9wZW5XaW5kb3coXCJsb2FkRGlhbG9nXCIsIHtcclxuXHRcdHByb21pc2VzOiBbXHJcblx0XHRcdGJhbm5lcnNQcm9taXNlLFxyXG5cdFx0XHRsb2FkVGFsa1Byb21pc2UsXHJcblx0XHRcdHBhcnNlVGFsa1Byb21pc2UsXHJcblx0XHRcdHRlbXBsYXRlRGF0YVByb21pc2UsXHJcblx0XHRcdHJlZGlyZWN0Q2hlY2tQcm9taXNlLFxyXG5cdFx0XHRzaG91bGRHZXRPcmVzICYmIG9yZXNQcm9taXNlXHJcblx0XHRdLFxyXG5cdFx0b3Jlczogc2hvdWxkR2V0T3JlcyxcclxuXHRcdGlzT3BlbmVkOiBpc09wZW5lZFByb21pc2VcclxuXHR9KTtcclxuXHJcblx0bG9hZERpYWxvZ1dpbi5vcGVuZWQudGhlbihpc09wZW5lZFByb21pc2UucmVzb2x2ZSk7XHJcblxyXG5cclxuXHQkLndoZW4oXHJcblx0XHRsb2FkVGFsa1Byb21pc2UsXHJcblx0XHR0ZW1wbGF0ZURhdGFQcm9taXNlLFxyXG5cdFx0cmVkaXJlY3RDaGVja1Byb21pc2UsXHJcblx0XHRzaG91bGRHZXRPcmVzICYmIG9yZXNQcm9taXNlXHJcblx0KS50aGVuKFxyXG5cdFx0Ly8gQWxsIHN1Y2NlZGVkXHJcblx0XHRmdW5jdGlvbih0YWxrV2lraXRleHQsIGJhbm5lcnMsIHJlZGlyZWN0VGFyZ2V0LCBvcmVzUHJlZGljaXRpb24gKSB7XHJcblx0XHRcdHZhciByZXN1bHQgPSB7XHJcblx0XHRcdFx0c3VjY2VzczogdHJ1ZSxcclxuXHRcdFx0XHR0YWxrcGFnZTogdGFsa1BhZ2UsXHJcblx0XHRcdFx0dGFsa1dpa2l0ZXh0OiB0YWxrV2lraXRleHQsXHJcblx0XHRcdFx0YmFubmVyczogYmFubmVyc1xyXG5cdFx0XHR9O1xyXG5cdFx0XHRpZiAocmVkaXJlY3RUYXJnZXQpIHtcclxuXHRcdFx0XHRyZXN1bHQucmVkaXJlY3RUYXJnZXQgPSByZWRpcmVjdFRhcmdldDtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAob3Jlc1ByZWRpY2l0aW9uKSB7XHJcblx0XHRcdFx0cmVzdWx0Lm9yZXNQcmVkaWNpdGlvbiA9IG9yZXNQcmVkaWNpdGlvbjtcclxuXHRcdFx0fVxyXG5cdFx0XHR3aW5kb3dNYW5hZ2VyLmNsb3NlV2luZG93KFwibG9hZERpYWxvZ1wiLCByZXN1bHQpO1xyXG5cdFx0XHRcclxuXHRcdH1cclxuXHQpOyAvLyBBbnkgZmFpbHVyZXMgYXJlIGhhbmRsZWQgYnkgdGhlIGxvYWREaWFsb2cgd2luZG93IGl0c2VsZlxyXG5cclxuXHQvLyBPbiB3aW5kb3cgY2xvc2VkLCBjaGVjayBkYXRhLCBhbmQgcmVzb2x2ZS9yZWplY3Qgc2V0dXBDb21wbGV0ZWRQcm9taXNlXHJcblx0bG9hZERpYWxvZ1dpbi5jbG9zZWQudGhlbihmdW5jdGlvbihkYXRhKSB7XHJcblx0XHRpZiAoZGF0YSAmJiBkYXRhLnN1Y2Nlc3MpIHtcclxuXHRcdFx0Ly8gR290IGV2ZXJ5dGhpbmcgbmVlZGVkOiBSZXNvbHZlIHByb21pc2Ugd2l0aCB0aGlzIGRhdGFcclxuXHRcdFx0c2V0dXBDb21wbGV0ZWRQcm9taXNlLnJlc29sdmUoZGF0YSk7XHJcblx0XHR9IGVsc2UgaWYgKGRhdGEgJiYgZGF0YS5lcnJvcikge1xyXG5cdFx0XHQvLyBUaGVyZSB3YXMgYW4gZXJyb3I6IFJlamVjdCBwcm9taXNlIHdpdGggZXJyb3IgY29kZS9pbmZvXHJcblx0XHRcdHNldHVwQ29tcGxldGVkUHJvbWlzZS5yZWplY3QoZGF0YS5lcnJvci5jb2RlLCBkYXRhLmVycm9yLmluZm8pO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0Ly8gV2luZG93IGNsb3NlZCBiZWZvcmUgY29tcGxldGlvbjogcmVzb2x2ZSBwcm9taXNlIHdpdGhvdXQgYW55IGRhdGFcclxuXHRcdFx0c2V0dXBDb21wbGV0ZWRQcm9taXNlLnJlc29sdmUobnVsbCk7XHJcblx0XHR9XHJcblx0XHRjYWNoZS5jbGVhckludmFsaWRJdGVtcygpO1xyXG5cdH0pO1xyXG5cclxuXHQvLyBURVNUSU5HIHB1cnBvc2VzIG9ubHk6IGxvZyBwYXNzZWQgZGF0YSB0byBjb25zb2xlXHJcblx0c2V0dXBDb21wbGV0ZWRQcm9taXNlLnRoZW4oXHJcblx0XHRkYXRhID0+IGNvbnNvbGUubG9nKFwic2V0dXAgd2luZG93IGNsb3NlZFwiLCBkYXRhKSxcclxuXHRcdChjb2RlLCBpbmZvKSA9PiBjb25zb2xlLmxvZyhcInNldHVwIHdpbmRvdyBjbG9zZWQgd2l0aCBlcnJvclwiLCB7Y29kZSwgaW5mb30pXHJcblx0KTtcclxuXHJcblx0cmV0dXJuIHNldHVwQ29tcGxldGVkUHJvbWlzZTtcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IHNldHVwUmF0ZXI7IiwiLy8gVmFyaW91cyB1dGlsaXR5IGZ1bmN0aW9ucyBhbmQgb2JqZWN0cyB0aGF0IG1pZ2h0IGJlIHVzZWQgaW4gbXVsdGlwbGUgcGxhY2VzXHJcblxyXG5pbXBvcnQgY29uZmlnIGZyb20gXCIuL2NvbmZpZ1wiO1xyXG5cclxudmFyIGlzQWZ0ZXJEYXRlID0gZnVuY3Rpb24oZGF0ZVN0cmluZykge1xyXG5cdHJldHVybiBuZXcgRGF0ZShkYXRlU3RyaW5nKSA8IG5ldyBEYXRlKCk7XHJcbn07XHJcblxyXG52YXIgQVBJID0gbmV3IG13LkFwaSgge1xyXG5cdGFqYXg6IHtcclxuXHRcdGhlYWRlcnM6IHsgXHJcblx0XHRcdFwiQXBpLVVzZXItQWdlbnRcIjogXCJSYXRlci9cIiArIGNvbmZpZy5zY3JpcHQudmVyc2lvbiArIFxyXG5cdFx0XHRcdFwiICggaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvVXNlcjpFdmFkMzcvUmF0ZXIgKVwiXHJcblx0XHR9XHJcblx0fVxyXG59ICk7XHJcbi8qIC0tLS0tLS0tLS0gQVBJIGZvciBPUkVTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cclxuQVBJLmdldE9SRVMgPSBmdW5jdGlvbihyZXZpc2lvbklEKSB7XHJcblx0cmV0dXJuICQuZ2V0KFwiaHR0cHM6Ly9vcmVzLndpa2ltZWRpYS5vcmcvdjMvc2NvcmVzL2Vud2lraT9tb2RlbHM9d3AxMCZyZXZpZHM9XCIrcmV2aXNpb25JRCk7XHJcbn07XHJcbi8qIC0tLS0tLS0tLS0gUmF3IHdpa2l0ZXh0IC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cclxuQVBJLmdldFJhdyA9IGZ1bmN0aW9uKHBhZ2UpIHtcclxuXHRyZXR1cm4gJC5nZXQoXCJodHRwczpcIiArIGNvbmZpZy5tdy53Z1NlcnZlciArIG13LnV0aWwuZ2V0VXJsKHBhZ2UsIHthY3Rpb246XCJyYXdcIn0pKVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24oZGF0YSkge1xyXG5cdFx0XHRpZiAoICFkYXRhICkge1xyXG5cdFx0XHRcdHJldHVybiAkLkRlZmVycmVkKCkucmVqZWN0KFwib2stYnV0LWVtcHR5XCIpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBkYXRhO1xyXG5cdFx0fSk7XHJcbn07XHJcblxyXG52YXIgbWFrZUVycm9yTXNnID0gZnVuY3Rpb24oZmlyc3QsIHNlY29uZCkge1xyXG5cdHZhciBjb2RlLCB4aHIsIG1lc3NhZ2U7XHJcblx0aWYgKCB0eXBlb2YgZmlyc3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIHNlY29uZCA9PT0gXCJzdHJpbmdcIiApIHtcclxuXHRcdC8vIEVycm9ycyBmcm9tICQuZ2V0IGJlaW5nIHJlamVjdGVkIChPUkVTICYgUmF3IHdpa2l0ZXh0KVxyXG5cdFx0dmFyIGVycm9yT2JqID0gZmlyc3QucmVzcG9uc2VKU09OICYmIGZpcnN0LnJlc3BvbnNlSlNPTi5lcnJvcjtcclxuXHRcdGlmICggZXJyb3JPYmogKSB7XHJcblx0XHRcdC8vIEdvdCBhbiBhcGktc3BlY2lmaWMgZXJyb3IgY29kZS9tZXNzYWdlXHJcblx0XHRcdGNvZGUgPSBlcnJvck9iai5jb2RlO1xyXG5cdFx0XHRtZXNzYWdlID0gZXJyb3JPYmoubWVzc2FnZTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHhociA9IGZpcnN0O1xyXG5cdFx0fVxyXG5cdH0gZWxzZSBpZiAoIHR5cGVvZiBmaXJzdCA9PT0gXCJzdHJpbmdcIiAmJiB0eXBlb2Ygc2Vjb25kID09PSBcIm9iamVjdFwiICkge1xyXG5cdFx0Ly8gRXJyb3JzIGZyb20gbXcuQXBpIG9iamVjdFxyXG5cdFx0dmFyIG13RXJyb3JPYmogPSBzZWNvbmQuZXJyb3I7XHJcblx0XHRpZiAobXdFcnJvck9iaikge1xyXG5cdFx0XHQvLyBHb3QgYW4gYXBpLXNwZWNpZmljIGVycm9yIGNvZGUvbWVzc2FnZVxyXG5cdFx0XHRjb2RlID0gZXJyb3JPYmouY29kZTtcclxuXHRcdFx0bWVzc2FnZSA9IGVycm9yT2JqLmluZm87XHJcblx0XHR9IGVsc2UgaWYgKGZpcnN0ID09PSBcIm9rLWJ1dC1lbXB0eVwiKSB7XHJcblx0XHRcdGNvZGUgPSBudWxsO1xyXG5cdFx0XHRtZXNzYWdlID0gXCJHb3QgYW4gZW1wdHkgcmVzcG9uc2UgZnJvbSB0aGUgc2VydmVyXCI7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR4aHIgPSBzZWNvbmQgJiYgc2Vjb25kLnhocjtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGlmIChjb2RlICYmIG1lc3NhZ2UpIHtcclxuXHRcdHJldHVybiBgQVBJIGVycm9yICR7Y29kZX06ICR7bWVzc2FnZX1gO1xyXG5cdH0gZWxzZSBpZiAobWVzc2FnZSkge1xyXG5cdFx0cmV0dXJuIGBBUEkgZXJyb3I6ICR7bWVzc2FnZX1gO1xyXG5cdH0gZWxzZSBpZiAoeGhyKSB7XHJcblx0XHRyZXR1cm4gYEhUVFAgZXJyb3IgJHt4aHIuc3RhdHVzfWA7XHJcblx0fSBlbHNlIGlmIChcclxuXHRcdHR5cGVvZiBmaXJzdCA9PT0gXCJzdHJpbmdcIiAmJiBmaXJzdCAhPT0gXCJlcnJvclwiICYmXHJcblx0XHR0eXBlb2Ygc2Vjb25kID09PSBcInN0cmluZ1wiICYmIHNlY29uZCAhPT0gXCJlcnJvclwiXHJcblx0KSB7XHJcblx0XHRyZXR1cm4gYEVycm9yICR7Zmlyc3R9OiAke3NlY29uZH1gO1xyXG5cdH0gZWxzZSBpZiAodHlwZW9mIGZpcnN0ID09PSBcInN0cmluZ1wiICYmIGZpcnN0ICE9PSBcImVycm9yXCIpIHtcclxuXHRcdHJldHVybiBgRXJyb3I6ICR7Zmlyc3R9YDtcclxuXHR9IGVsc2Uge1xyXG5cdFx0cmV0dXJuIFwiVW5rbm93biBBUEkgZXJyb3JcIjtcclxuXHR9XHJcbn07XHJcblxyXG5leHBvcnQge2lzQWZ0ZXJEYXRlLCBBUEksIG1ha2VFcnJvck1zZ307IiwiaW1wb3J0IExvYWREaWFsb2cgZnJvbSBcIi4vV2luZG93cy9Mb2FkRGlhbG9nXCI7XHJcbmltcG9ydCBNYWluV2luZG93IGZyb20gXCIuL1dpbmRvd3MvTWFpbldpbmRvd1wiO1xyXG5cclxudmFyIGZhY3RvcnkgPSBuZXcgT08uRmFjdG9yeSgpO1xyXG5cclxuLy8gUmVnaXN0ZXIgd2luZG93IGNvbnN0cnVjdG9ycyB3aXRoIHRoZSBmYWN0b3J5LlxyXG5mYWN0b3J5LnJlZ2lzdGVyKExvYWREaWFsb2cpO1xyXG5mYWN0b3J5LnJlZ2lzdGVyKE1haW5XaW5kb3cpO1xyXG5cclxudmFyIG1hbmFnZXIgPSBuZXcgT08udWkuV2luZG93TWFuYWdlcigge1xyXG5cdFwiZmFjdG9yeVwiOiBmYWN0b3J5XHJcbn0gKTtcclxuJCggZG9jdW1lbnQuYm9keSApLmFwcGVuZCggbWFuYWdlci4kZWxlbWVudCApO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgbWFuYWdlcjsiXX0=
