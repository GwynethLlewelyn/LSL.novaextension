nova.commands.register("gwynethllewelyn.LindenScriptingLanguage.search", (editor) => {
	var query = editor.getTextInRange(editor.selectedRanges[0]).trim();

	if (query == "" || query == null) {
		nova.workspace.showErrorMessage("Not a valid search query.");
		return;
	}
	// TODO: put this inside a Nova tab instead
	nova.openURL("http://wiki.secondlife.com/wiki/" + encodeURIComponent(query));
});


