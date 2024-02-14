// Deal with debugging flag

exports.activate = function() {
	if (nova.config.get('gwynethllewelyn.LindenScriptingLanguage.debugging', 'boolean')) {
		console.log("LSL extension is activated.");
	}
}

exports.deactivate = function() {
	if (nova.config.get('gwynethllewelyn.LindenScriptingLanguage.debugging', 'boolean')) {
		console.log("LSL extension is being deactivated.");
	}
}

// Register menu items

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
	console.log('Not really implemented yet, I think');
});

// Create main class and activate it
class LSLinter {
	constructor() {}

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

		let path = globalExecutable || bundledExecutable;

		if (nova.config.get('gwynethllewelyn.LindenScriptingLanguage.debugging', 'boolean')) {
			console.log("lslint executable path:", path);
		}

		return path;
	}

	getBuiltins() {
		let customBuiltins = nova.config.get(
			'gwynethllewelyn.LindenScriptingLanguage.builtins',
			'string'
		);

		let defaultBuiltins = nova.path.join(
			nova.extension.path,
			"LSLint",
			"builtins.txt"
		);

		customBuiltins = nova.fs.stat(customBuiltins) != undefined ?
			customBuiltins :
			null;

		let selectedBuiltins = customBuiltins || defaultBuiltins;

		if (nova.config.get('gwynethllewelyn.LindenScriptingLanguage.debugging', 'boolean')) {
			console.log("Linting builtins path: " + selectedBuiltins);
		}

		return selectedBuiltins;
	}

	provideIssues(editor) {
		let issues = [];
		let self = this;

		return new Promise(function(resolve) {
			let fileName = Math.random().toString(36).substring(2, 15) +
				Math.random().toString(36).substring(2, 15) +
				".lsl";
			let range = new Range(0, editor.document.length);
			let documentText = editor.getTextInRange(range);
			let output = "";

			try {
				nova.fs.mkdir(nova.extension.workspaceStoragePath)
			} catch (error) {
				// fail silently
			}

			let lintFile = nova.fs.open(nova.path.join(nova.extension.workspaceStoragePath, fileName), "w");

			lintFile.write(documentText);
			lintFile.close();

			try {
				let linter = new Process(self.getExecutablePath(), {
					args: [
						'-l',
						'-d',
						self.getBuiltins()
					],
					shell: true,
				});

				// Capture LSLint output, line by line
				linter.onStdout(function(line) {
					if (nova.config.get('gwynethllewelyn.LindenScriptingLanguage.debugging', 'boolean')) {
						console.log("Linter output:", line);
					}

					output += line;
				});

				linter.onStderr(function(line) {
					console.error(line);
				});

				linter.onDidExit(function() {
					output = output.trim();

					if (output.length === 0) {
						return resolve([]);
					}

					if (!self.outputIsJson(output)) {
						console.error(output);

						return resolve([]);
					}

					resolve(self.parseLinterOutput(output));

					if (nova.config.get('gwynethllewelyn.LindenScriptingLanguage.debugging', 'boolean')) {
						console.log("Finished linting.");
					}

					nova.fs.remove(lintFile.path);
				});

				if (nova.config.get('gwynethllewelyn.LindenScriptingLanguage.debugging', 'boolean')) {
					console.log("Started linting.");
					console.log(`Running command: ${self.getExecutablePath()} -l -d ${self.getBuiltins()}`);
				}

				linter.start();
			} catch (error) {
				console.error("error during processing", error);
			}
		});
	}

	// probably not required
	outputIsJson(output) {
		try {
			return (JSON.parse(output) && !!output);
		} catch (error) {
			return false;
		}
	}
	/*
		LSLint output is something like this:

		 WARN:: (  8,  9): variable `LineTotal' declared but never used.
		 WARN:: ( 16,  8): variable `data' declared but never used.
		 WARN:: ( 43,  7): Empty if statement.
		 WARN:: (109, 22): Declaration of `data' in this scope shadows previous declaration at (16, 8)
		 WARN:: (204, 36): Declaration of `data' in this scope shadows previous declaration at (16, 8)
		TOTAL:: Errors: 0  Warnings: 5
	*/

	parseLinterOutput(output) {
		let self = this;
		let lints = JSON.parse(output);
		let issues = lints.files
			.flatMap(function(lint) {
				return lint.violations;
			})
			.map(function(lint) {
				let issue = new Issue();

				issue.message = lint.description;
				issue.severity = IssueSeverity.Error;

				if (lint.priority <= 2) {
					issue.severity = IssueSeverity.Warning;
				}

				issue.line = lint.beginLine;
				issue.code = lint.rule + "| " + lint.ruleSet + " | phpmd";
				issue.endLine = issue.line + 1;

				if (nova.config.get('gwynethllewelyn.LindenScriptingLanguage.debugging', 'boolean')) {
					console.log("Found lint:");
					console.log("===========");
					console.log("Line: " + issue.line);
					console.log("Message: " + issue.message);
					console.log("Code: " + issue.code);
					console.log("Ruleset: " + lint.ruleSet);
					console.log("Severity: " + issue.severity);
					console.log("===========");
				}

				return issue;
			})
			.filter(function(issue) {
				return issue !== null;
			});

		let errors = (lints.errors || [])
			.map(function(lint) {
				let issue = new Issue();

				if (
					lint.message === null ||
					lint.message === undefined
				) {
					return issue;
				}

				issue.code = "phpmd";
				issue.message = (lint.message || "");
				let matches = issue.message.match(/^.*? line: (.*?), col: .*$/i);

				if (
					matches === null ||
					matches.length <= 1
				) {
					return issue;
				}

				issue.line = matches[1];
				issue.endLine = issue.line + 1;
				issue.severity = IssueSeverity.Error;

				if (nova.config.get('gwynethllewelyn.LindenScriptingLanguage.debugging', 'boolean')) {
					console.log("Found error lint:");
					console.log("===========");
					console.log("Line: " + issue.line);
					console.log("Message: " + lint.message);
					console.log("===========");
				}

				return issue;
			});

		return issues
			.concat(errors);
	}
};

nova.assistants.registerIssueAssistant(["lsl", "ossl"], new LSLinter());