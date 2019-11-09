import setupRater from "./setup";
import autoStart from "./autostart";
import styles from "./css.js";
import { makeErrorMsg } from "./api";
import windowManager from "./windowManager";

(function App() {
	// <nowiki>

	mw.util.addCSS(styles);

	const showMainWindow = data => {
		if (!data || !data.success) {
			return;
		}
		// Add css class to body to enable background scrolling
		document.getElementsByTagName("body")[0].classList.add("rater-mainWindow-open");
		// Open the window
		windowManager.openWindow("main", data)
			.closed.then( () =>
			// Remove the css class, so as to not interfere with other OOUI windows
				document.getElementsByTagName("body")[0].classList.remove("rater-mainWindow-open")
			);
	};

	const showSetupError = (code, jqxhr) => OO.ui.alert(
		makeErrorMsg(code, jqxhr),	{
			title: "Rater failed to open"
		}
	);

	// Invocation by portlet link 
	mw.util.addPortletLink(
		"p-cactions",
		"#",
		"Rater",
		"ca-rater",
		"Rate quality and importance",
		"5"
	);
	$("#ca-rater").click(event => {
		event.preventDefault();
		setupRater().then(showMainWindow, showSetupError);
	});

	// Invocation by auto-start (do not show message on error)
	autoStart().then(showMainWindow);
})();