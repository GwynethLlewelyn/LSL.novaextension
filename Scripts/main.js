// Deal with debugging flag.
exports.activate = function() {
	if (nova.config.get('gwynethllewelyn.LindenScriptingLanguage.debugging', 'boolean')) {
		console.info("LSL extension is activated.");
	}
}

exports.deactivate = function() {
	if (nova.config.get('gwynethllewelyn.LindenScriptingLanguage.debugging', 'boolean')) {
		console.info("LSL extension is being deactivated.");
	}
}

// Register menu items.
nova.commands.register("gwynethllewelyn.LindenScriptingLanguage.search", (editor) => {
	var query = editor.getTextInRange(editor.selectedRanges[0]).trim();

	if (query == "" || query == null) {
		nova.workspace.showErrorMessage("Not a valid search query.");
		return;
	}
	// TODO: put this inside a Nova tab instead
	nova.openURL("https://wiki.secondlife.com/wiki/" + encodeURIComponent(query));
});

nova.commands.register("gwynethllewelyn.LindenScriptingLanguage.lint", (editor) => {
	var what = editor.documentText.MD5();

	console.log('Not really implemented yet, I think; MD5 is', what);
});

// Create main class and activate it
class LSLinter {
	constructor() {
		if (nova.config.get('gwynethllewelyn.LindenScriptingLanguage.debugging', 'boolean')) {
			console.info("Entering LSLint constructor...");
		}
	}

	/**
 	* Constructs the path to the executable, based on existing path data.
 	*
 	* @returns {string} Path name to the executable.
 	*/
	getExecutablePath() {
		let globalExecutable = nova.config
			.get("gwynethllewelyn.LindenScriptingLanguage.executablePath", "string")
			.trim();
		let bundledExecutable = nova.path.join(
			nova.extension.path,
			"LSLint",
			"lslint"
		);

		if (
			globalExecutable.length > 0 &&
			globalExecutable.charAt() !== "/"
		) {
			globalExecutable = nova.path.join(
				nova.workspace.path,
				globalExecutable
			);
		}

		let execPath = bundledExecutable;

		if (!bundledExecutable) execPath = globalExecutable;

		if (nova.config.get('gwynethllewelyn.LindenScriptingLanguage.debugging', 'boolean')) {
			console.info('getExecutablePath() will return path: "%s"', execPath);
		}

		return execPath;
	}

	/**
	 * Returns either the path to the user-defined builtins.txt, or constructs the path to
	 * the extension-provided builtins.txt.
	 *
	 * @returns {string} Path name to builtins.txt.
	 */
	getBuiltins() {
		var customBuiltins = nova.config.get(
			'gwynethllewelyn.LindenScriptingLanguage.builtins',
			'string'
		);

		var defaultBuiltins = nova.path.join(
			nova.extension.path,
			"LSLint",
			"builtins.txt"
		);

		if (nova.config.get('gwynethllewelyn.LindenScriptingLanguage.debugging', 'boolean')) {
			console.info('getBuiltins() constructed defaultBuiltins = "%s"', defaultBuiltins);
		}

		var selectedBuiltins = defaultBuiltins;

		// Do we have our own builtins.txt file, and, if so, is it valid?
		try {
			if (customBuiltins && customBuiltins != '') {
				if (nova.fs.stat(customBuiltins) != undefined) {
					selectedBuiltins = customBuiltins;
				}
			}
		} catch (error) {
			console.warn("getBuiltins() could not find a valid builtins.txt path '%s' — throws: '%s'  - going with the default builtins instead", customBuiltins, error.toString());
		}

		if (nova.config.get('gwynethllewelyn.LindenScriptingLanguage.debugging', 'boolean')) {
			console.log('getBuiltins() will return path: "%s"', selectedBuiltins);
		}

		return selectedBuiltins;
	}

	provideIssues(editor) {
		let self = this;

		return new Promise(function(resolve) {
			/**
			 * Randomly generated filename, to be used as scrap (so we don't
			 * break anything).
			 *
			 * @type {string}
			 */
			let fileName = Math.random().toString(36).substring(2, 15) +
				Math.random().toString(36).substring(2, 15) +
				".lsl";
			// Get the whole document. This makes sense, because the LSLinter cannot
			// work just on LSL fragments. (gwyneth 20240214)
			let range = new Range(0, editor.document.length);
			/**
			 * Full document text.
			 * @type {string}
			 */
			let documentText = editor.getTextInRange(range);
			let output = "";

			try {
				nova.fs.mkdir(nova.extension.workspaceStoragePath)
			} catch (error) {
				console.error("Nova couldn't mkdir directory '%s'", nova.extension.workspaceStoragePath)
				return resolve([]);
			}

			/** Name of the scrap file.
			 *	@type {string}
			 */
			var scrapFileName = nova.path.join(nova.extension.workspaceStoragePath, fileName);
			try {
				var lintFile = nova.fs.open(scrapFileName, "w");

				lintFile.write(documentText);
				lintFile.close();
			} catch (error) {
				console.error("Scrap filename at '%s' could not be written!", scrapFileName);
			}

			/**
			 * Path to executable; hopefully, well defined.
			 * @type {string}
			 */
			var execPath = self.getExecutablePath();

			/**
			 * Path to builtins.txt.
			 * @type {string}
			 */
			var builtinsPath = self.getBuiltins();

			if (nova.config.get('gwynethllewelyn.LindenScriptingLanguage.debugging', 'boolean')) {
				console.group("Pre-Process() paths");
				console.info("Executable path: '%s'", execPath);
				console.info("builtins.txt path: '%s'", builtinsPath);
				console.info("Path to temporary file: '%s'", scrapFileName);
				console.groupEnd();
			}

			try {
				// create linter with var, or else we lose scope
				var linter = new Process('/usr/bin/env', {
						args: [
							execPath,
							'-l',
							'-b',
							builtinsPath,
							scrapFileName
						],
						shell: true,
					}
				);
			} catch (error) {
				console.group("LSLint Process activation");
				console.error("Error during LSLint Process() activation");
				console.info("Exec path: '%s'", execPath);
				console.info("Path to builtins.txt: '%s'", builtinsPath);
				console.info("Path to temporary file: '%s'", scrapFileName);
				console.error("Process() throws:", error);
				console.groupEnd();
				return resolve([]);
			}

			try {
				// Capture LSLint output, line by line
				linter.onStdout(function(line) {
					if (nova.config.get('gwynethllewelyn.LindenScriptingLanguage.debugging', 'boolean')) {
						console.log("LSLint output:", line);
					}

					output += line;
				});
			} catch (error) {
				console.error("error during linter.onStdout - ", error);
				return resolve([]);
			}

			// should not throw errors!
			try {
				linter.onStderr(function(line) {
					console.error('LSLint error: ' + line);
					return resolve([]);
				});
			} catch (error) {
				console.error("error during linter.onStderr - ", error);
				return resolve([]);
			}

			try {
				linter.onDidExit(function() {
					output = output.trim();

					if (output.length === 0) {
						return resolve([]);
					}

					// This might be required at some point, i.e. how to deal with
					// errors from the output? Easy when the errors come in a different format.
					// if (!self.outputIsJson(output)) {
					// 	console.error(output);
					// 	return resolve([]);
					// }

					resolve(self.parseLinterOutput(output));

					if (nova.config.get('gwynethllewelyn.LindenScriptingLanguage.debugging', 'boolean')) {
						console.info("Finished linting.");
					}

					nova.fs.remove(scrapFileName);
				});
			} catch (error) {
				console.error("error during processing - ", error);
				return resolve([]);
			}

			try {
				if (nova.config.get('gwynethllewelyn.LindenScriptingLanguage.debugging', 'boolean')) {
					console.info("Started linting.");
					console.log(`Running command: ${self.getExecutablePath()} -l -b ${self.getBuiltins()} ${scrapFileName}`);
				}
				// Execution starts here.
				linter.start();
			} catch (error) {
				console.error("error during actual execution - ", error);
			}
		});
	}

	/*
		LSLint output is something like this:

		 WARN:: (  8,  9)-(  8, 18): variable `LineTotal' declared but never used.
		 WARN:: ( 16,  8)-( 16, 12): variable `data' declared but never used.
		 WARN:: ( 43,  7)-( 43, 93): Empty if statement.
		 WARN:: (109, 22)-(109, 26): Declaration of `data' in this scope shadows previous declaration at (16, 8)
		 WARN:: (204, 36)-(204, 40): Declaration of `data' in this scope shadows previous declaration at (16, 8)
		TOTAL:: Errors: 0  Warnings: 5
	*/
	/**
	 * Receives the text to be parsed/linted, and returns an array of issues found.
	 *
	 * @param {string} output Text to be parsed.
	 * @returns {string[]} Array of issues found.
	 */
	parseLinterOutput(output) {
		let issues = [];
		// Do it the basic way, since I'm no JavaScript expert.
		// Split by newlines first:
		var lints = output.split(/\r\n|\n/);
		for (var lint = 0; lint < lints.length - 1; lint++) {
			/**
			 * Array of matched issues on LSLint output.
			 * @type {string[]}
			 */
			let matches = lints[lint].match(/^\W*(\w+)::\s*\(\s*(\d*),\s*(\d*)\)-\(\s*(\d*),\s*(\d*)\):\s*(.*)$/gmi);

			if (
				matches === null ||
				matches.length <= 1
			) {
				continue;
			}

			let issue = new Issue();

			issue.source = "lslint";

			switch (matches[1]) {
				case "INFO":
					issue.severity = IssueSeverity.Info;
					break;
				case "DEBUG":
					issue.severity = IssueSeverity.Hint;
					break;
				case "WARN":
					issue.severity = IssueSeverity.Warning;
					break;
				case "ERROR":
					issue.severity = IssueSeverity.Error;
					break;
				case "OTHER":
				default:
					issue.severity = IssueSeverity.Info;
					break;
			}

			issue.line		= matches[2];
			issue.column	= matches[3];
			issue.endLine	= matches[4];
			issue.endColumn	= matches[5];
			issue.message	= matches[6];

			if (nova.config.get('gwynethllewelyn.LindenScriptingLanguage.debugging', 'boolean')) {
				// console.log(lint + ' --> ' + issue);
				console.log("Found lslint #%d:", lint);
				console.log("===========");
				console.log("Line: " + issue.line);
				console.log("Severity: " + issue.severity);
				console.log("Message: " + issue.message);
				console.log("===========");
			}
			issues.push(issue);
		}

		return issues;
	}
};

nova.assistants.registerIssueAssistant(["lsl", "ossl"], new LSLinter());