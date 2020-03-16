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
			.closed.then( result => {
				if (result && result.restart) {
					windowManager.removeWindows(["main"])
						.then(setupRater)
						.then(showMainWindow, showSetupError);
					return;
				}
				// Remove the css class, so as to not interfere with other OOUI windows
				document.getElementsByTagName("body")[0].classList.remove("rater-mainWindow-open");
				// Show notification when saved successfully
				if (result && result.success) {
					const $message = $("<span>").append(
						$("<strong>").text("Ratings saved successfully.")
					);
					if (result.upgradedStub) {
						$message.append(
							$("<br>"),
							// TODO: There should be a link that will edit the article for you
							$("<span>").text("Note that the article appears to be tagged as a stub.")
						);
					}
					mw.notify(
						$message,
						{ autoHide: true, autoHideSeconds: "long", tag: "Rater-saved" }
					);
				}
			} );
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