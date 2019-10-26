// A global object that stores all the page and user configuration and settings
var config = {};
// Script info
config.script = {
	// Advert to append to edit summaries
	advert:  " ([[User:Evad37/rater.js|Rater]])",
	version: "2.0.0"
};
// Preferences: globals vars added to users' common.js, or set to defaults if undefined
config.prefs = {
	watchlist: window.rater_watchlist || "preferences"
};
// MediaWiki configuration values
config.mw = mw.config.get( [
	"skin",
	"wgPageName",
	"wgNamespaceNumber",
	"wgUserName",
	"wgFormattedNamespaces",
	"wgMonthNames",
	"wgRevisionId",
	"wgScriptPath",
	"wgServer",
	"wgCategories",
	"wgIsMainPage"
] );

config.regex = { /* eslint-disable no-useless-escape */
	// Pattern to find templates, which may contain other templates
	template:		/\{\{\s*([^#\{\s].+?)\s*(\|(?:.|\n)*?(?:(?:\{\{(?:.|\n)*?(?:(?:\{\{(?:.|\n)*?\}\})(?:.|\n)*?)*?\}\})(?:.|\n)*?)*|)\}\}\n?/g,
	// Pattern to find `|param=value` or `|value`, where `value` can only contain a pipe
	// if within square brackets (i.e. wikilinks) or braces (i.e. templates)
	templateParams:	/\|(?!(?:[^{]+}|[^\[]+]))(?:.|\s)*?(?=(?:\||$)(?!(?:[^{]+}|[^\[]+])))/g
}; /* eslint-enable no-useless-escape */
config.deferred = {};
config.bannerDefaults = {
	classes: [
		"FA",
		"FL",
		"A",
		"GA",
		"B",
		"C",
		"Start",
		"Stub",
		"List"
	],
	importances: [
		"Top",
		"High",
		"Mid",
		"Low"
	],
	extendedClasses: [
		"Category",
		"Draft",
		"File",
		"Portal",
		"Project",
		"Template",
		"Bplus",
		"Future",
		"Current",
		"Disambig",
		"NA",
		"Redirect",
		"Book"
	],
	extendedImportances: [
		"Top",
		"High",
		"Mid",
		"Low",
		"Bottom",
		"NA"
	]
};
config.customClasses = {
	"WikiProject Military history": [
		"AL",
		"BL",
		"CL"
	],
	"WikiProject Portals": [
		"FPo",
		"Complete",
		"Substantial",
		"Basic",
		"Incomplete",
		"Meta"
	]
};
config.shellTemplates = [
	"WikiProject banner shell",
	"WikiProjectBanners",
	"WikiProject Banners",
	"WPB",
	"WPBS",
	"Wikiprojectbannershell",
	"WikiProject Banner Shell",
	"Wpb",
	"WPBannerShell",
	"Wpbs",
	"Wikiprojectbanners",
	"WP Banner Shell",
	"WP banner shell",
	"Bannershell",
	"Wikiproject banner shell",
	"WikiProject Banners Shell",
	"WikiProjectBanner Shell",
	"WikiProjectBannerShell",
	"WikiProject BannerShell",
	"WikiprojectBannerShell",
	"WikiProject banner shell/redirect",
	"WikiProject Shell",
	"Banner shell",
	"Scope shell",
	"Project shell",
	"WikiProject banner"
];
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
			"en": "Small?",
		},
		"description": {
			"en": "Display a small version. Allowed values: ['yes']."
		},
		"autovalue": "yes"
	},
	"attention": {
		"label": {
			"en": "Attention required?",
		},
		"description": {
			"en": "Immediate attention required. Allowed values: ['yes']."
		},
		"autovalue": "yes"
	},
	"needs-image": {
		"label": {
			"en": "Needs image?",
		},
		"description": {
			"en": "Request that an image or photograph of the subject be added to the article. Allowed values: ['yes']."
		},
		"aliases": [
			"needs-photo"
		],
		"autovalue": "yes",
		"suggested": true
	},
	"needs-infobox": {
		"label": {
			"en": "Needs infobox?",
		},
		"description": {
			"en": "Request that an infobox be added to the article. Allowed values: ['yes']."
		},
		"aliases": [
			"needs-photo"
		],
		"autovalue": "yes",
		"suggested": true
	}
};

export default config;