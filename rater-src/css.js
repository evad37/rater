// Attribution: Diff styles from <https://en.wikipedia.org/wiki/Wikipedia:AutoWikiBrowser/style.css>
const styles = `table.diff, td.diff-otitle, td.diff-ntitle { background-color: white; }
td.diff-otitle, td.diff-ntitle { text-align: center; }
td.diff-marker { text-align: right; font-weight: bold; font-size: 1.25em; }
td.diff-lineno { font-weight: bold; }
td.diff-addedline, td.diff-deletedline, td.diff-context { font-size: 88%; vertical-align: top; white-space: -moz-pre-wrap; white-space: pre-wrap; }
td.diff-addedline, td.diff-deletedline { border-style: solid; border-width: 1px 1px 1px 4px; border-radius: 0.33em; }
td.diff-addedline { border-color: #a3d3ff; }
td.diff-deletedline { border-color: #ffe49c; }
td.diff-context { background: #f3f3f3; color: #333333; border-style: solid; border-width: 1px 1px 1px 4px; border-color: #e6e6e6; border-radius: 0.33em; }
.diffchange { font-weight: bold; text-decoration: none; }
table.diff {
    border: none;
    width: 98%; border-spacing: 4px;
    table-layout: fixed; /* Ensures that colums are of equal width */
}
td.diff-addedline .diffchange, td.diff-deletedline .diffchange { border-radius: 0.33em; padding: 0.25em 0; }
td.diff-addedline .diffchange {	background: #d8ecff; }
td.diff-deletedline .diffchange { background: #feeec8; }
table.diff td {	padding: 0.33em 0.66em; }
table.diff col.diff-marker { width: 2%; }
table.diff col.diff-content { width: 48%; }
table.diff td div {
    /* Force-wrap very long lines such as URLs or page-widening char strings. */
    word-wrap: break-word;
    /* As fallback (FF<3.5, Opera <10.5), scrollbars will be added for very wide cells
        instead of text overflowing or widening */
    overflow: auto;
}` +

// Override OOUI window manager preventing background scrolling/interaction
`html body.rater-mainWindow-open {
	position: unset;
	overflow: unset;
}
html body.rater-mainWindow-open .oo-ui-windowManager-modal > .oo-ui-dialog.oo-ui-window-active {
    position: static;
    padding: 0;
}` +
// Increase z-index, to be above skin menus etc
`html body.rater-mainWindow-open .oo-ui-dialog.oo-ui-window-active > div {
    z-index: 110;
}
`;

export default styles;