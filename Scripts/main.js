/**
 * main.js
 * Linden Scripting Language Nova Extension
 *
 * @author Gwyneth Llewelyn
 */

/**
 * Callback to activate this extension.
 *
 * Also deals with the debugging flag.
 *
 * @returns {void}
 */
exports.activate = function () {
	if (nova.config.get("gwynethllewelyn.LindenScriptingLanguage.debugging", "boolean")) {
		console.info("LSL extension is activated.");
	}
};

/**
 * Callback to deactivate this extension.
 *
 * @returns  {void}
 */
exports.deactivate = function () {
	if (nova.config.get("gwynethllewelyn.LindenScriptingLanguage.debugging", "boolean")) {
		console.info("LSL extension is being deactivated.");
	}
};

/**
 * Register menu item.
 */
nova.commands.register("gwynethllewelyn.LindenScriptingLanguage.search", (editor) => {
	/**
	 * What is currently being selected by the user.
	 * @type {string}
	 */
	var query = editor.getTextInRange(editor.selectedRanges[0]).trim();

	if (query == "" || query == null) {
		nova.workspace.showErrorMessage("Not a valid search query.");
		return;
	}
	// Check if this is clearly OSSL (will only work on functions, not most of the constants):
	if (query.substring(0, 2).toLowerCase() == "os") {
		nova.openURL("http://opensimulator.org/wiki/" + encodeURIComponent(query));
		return;
	}
	// Everything else goes to the Second Life Wiki.
	// TODO: put this inside a Nova tab instead (how?)
	nova.openURL("https://wiki.secondlife.com/wiki/" + encodeURIComponent(query));
});

/**
 * Create main extension class and activates it.
 */
class LSLinter {
	/**
	 * If debugging is turned on.
	 * @type {boolean}
	 * @since 1.7.0
	 */
	static debug = false;

	/**
	 * Possible Mach microkernel CPU architectures, as detected with `uname`.
	 *
	 * Values as defined by Apple in `mach/machine.h`,
	 * only the base, ignoring 32/64bit versions.
	 *
	 * @type {number}
	 * @since 1.7.0
	 */
	static archtype = {
		ANY: -1,
		NONE: 0,
		VAX: 1,
		MC680x0: 6,
		INTEL: 7,
		MC98000: 10,
		HPPA: 11,
		ARM: 12,
		MC88000: 13,
		SPARC: 14,
		I860: 15,
		POWERPC: 18,
	};

	/**
	 * Detected architecture.
	 *
	 * Because there is no (obvious) way of figuring out from within Nova if we're
	 * on an Intel, Rosetta, or ARM64 kernel, we do a simple test with `arch` and
	 * store the result here
	 *
	 * @type {number}
	 * @since 1.7.0
	 */
	static arch = archtype.INTEL; // we assume Intel by default

	static {
		// Save the debug value locally as statis to avoid constantly calling Nova's
		// functions only to retreive the status.
		debug = nova.config.get("gwynethllewelyn.LindenScriptingLanguage.debugging", "boolean");
		console.info("Debugging set to: ", debug);

		arch = getArchitecture();
		console.info("Machine architecture type: ", arch);
	}

	constructor() {
		if (debug) {
			console.info("Entering LSLint constructor...");
		}
	}

	/**
	 * Constructs the path to the executable, based on existing path data.
	 *
	 * @returns {string} Path name to the executable.
	 */
	getExecutablePath() {
		/**
		 * This is the path that the user set on Preferences for `lslint`.
		 * It's up to them to point to the right path!
		 *
		 * May be empty.
		 *
		 * @type {string}
		 */
		let globalExecutable = nova.config.get("gwynethllewelyn.LindenScriptingLanguage.executablePath", "string").trim();

		/**
		 * Calculate full path for the bundled executable. Note that we include
		 * *both* the Intel and the ARM64 binaries.
		 *
		 * @type {string}
		 */
		let bundledExecutable = nova.path.join(nova.extension.path, "LSLint", "lslint");
		if (arch == archtype.ARM) {
			bundledExecutable += "-arm64";
		}

		/**
		 * Actual path selected. Either the user has provided somethinh, and we'll use it,
		 * or we fall back to our own bundled default.
		 *
		 * @type {string}
		 */
		let execPath = bundledExecutable;

		if (globalExecutable) {
			execPath = globalExecutable;
		}
		// Extra check for relative paths:
		if (execPath.length > 0 && execPath.charAt() !== "/") {
			execPath = nova.path.join(nova.workspace.path, execPath);
		}
		if (debug) {
			console.info('getExecutablePath() will return path: "%s"', execPath);
		}

		return execPath;
	}

	/**
	 * Calls `arch` to figure out the architecture (Intel or ARM).
	 *
	 * @returns {number} ID number of architecture (see statics).
	 * @since 1.7.0
	 */
	getArchitecture() {
		try {
			var archname = new Process("/usr/bin/arch", {
				args: [],
				shell: false,
			});
		} catch (error) {
			console.group("Architecture Detection");
			console.error("Could not find `/usr/bin/arch`; error was: %s", error);
			console.groupEnd();
			return archtype.NONE;
		}

		/**
		 * Variable to capture all output from `uname`.
		 *
		 * @type {string}
		 */
		var output = "";

		try {
			// Capture uname output, line by line
			archname.onStdout(function (line) {
				if (debug) {
					console.log("»»", line);
				}
				output += line;
			});
		} catch (error) {
			console.error("error during archname.onStdout - ", error);
			return archtype.NONE;
		}

		// Test
		if (/arm/.test(output)) {
			return archtype.ARM;
		}

		if (/powerpc/.test(output)) {
			return archtype.POWERPC;
		}

		/* Note that we have no idea if macOS was ever ported to any other architecture!

		   `man arch` only considers the following:

		   The arch_name argument must be one of the currently supported architectures:
			i386     32-bit intel
			x86_64   64-bit intel
			x86_64h  64-bit intel (haswell)
			arm64    64-bit arm
			arm64e   64-bit arm (Apple Silicon)
		*/

		return archtype.INTEL;	// most likely case.
	}

	/**
	 * Returns either the path to the user-defined builtins.txt, or constructs the path to
	 * the extension-provided builtins.txt.
	 *
	 * @returns {string} Path name to builtins.txt.
	 */
	getBuiltins() {
		var customBuiltins = nova.config.get("gwynethllewelyn.LindenScriptingLanguage.builtins", "string");

		var defaultBuiltins = nova.path.join(nova.extension.path, "LSLint", "builtins.txt");

		if (debug) {
			console.info('getBuiltins() constructed defaultBuiltins = "%s"', defaultBuiltins);
		}

		var selectedBuiltins = defaultBuiltins;

		// Do we have our own builtins.txt file, and, if so, is it valid?
		try {
			if (customBuiltins && customBuiltins != "") {
				if (nova.fs.stat(customBuiltins) != undefined) {
					selectedBuiltins = customBuiltins;
				}
			}
		} catch (error) {
			console.warn("getBuiltins() could not find a valid builtins.txt path '%s' — throws: '%s'  - going with the default builtins instead", customBuiltins, error.toString());
		}

		if (debug) {
			console.log('getBuiltins() will return path: "%s"', selectedBuiltins);
		}

		try {
			_ = new Process("/usr/bin/env", {
				args: [execPath, "-l", "-b", builtinsPath, scrapFileName],
				shell: true,
			});
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

		return selectedBuiltins;
	}

	/**
	 * Extract content from current LSL file in editor and feed it to the linter.
	 *
	 * Collects all text inside current LSL file being edited, write it to a
	 * temporary file, launch LSLint in a subprocess, feed it the builtins.txt file
	 * as well as the temporary file, and capture the resulting warnings/errors for
	 * further processing.
	 *
	 * @param {TextEditor} editor - Currently open LSL file in editor.
	 * @returns {Promise<any>} Returns promise resolved after linter is finished.
	 */
	provideIssues(editor) {
		let self = this;

		return new Promise(function (resolve) {
			/**
			 * Randomly generated filename, to be used as scrap (so we don't
			 * break anything).
			 *
			 * @type {string}
			 */
			let fileName = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + ".lsl";
			// Get the whole document. This makes sense, because the LSLinter cannot
			// work just on LSL fragments. (gwyneth 20240214)
			let range = new Range(0, editor.document.length);
			/**
			 * Full document text.
			 * @type {string}
			 */
			let documentText = editor.getTextInRange(range);
			/**
			 * Linter output.
			 * @type {string}
			 */
			var output = "";

			try {
				nova.fs.mkdir(nova.extension.workspaceStoragePath);
			} catch (error) {
				console.error("Nova couldn't mkdir directory '%s'", nova.extension.workspaceStoragePath);
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

			if (debug) {
				console.group("Pre-Process() paths");
				console.info("Executable path: '%s'", execPath);
				console.info("builtins.txt path: '%s'", builtinsPath);
				console.info("Path to temporary file: '%s'", scrapFileName);
				console.groupEnd();
			}

			try {
				// Capture LSLint output, line by line
				linter.onStdout(function (line) {
					if (debug) {
						console.log("»»", line);
					}
					output += line;
				});
			} catch (error) {
				console.error("error during linter.onStdout - ", error);
				return resolve([]);
			}
			// The LSLint apparently send the LSL parsing errors to stderr instead of staout!
			// (gwyneth 20240216)
			try {
				linter.onStderr(function (line) {
					if (debug) {
						console.log(">>", line);
					}
					output += line;
				});
			} catch (error) {
				console.error("error during linter.onStderr - ", error);
				return resolve([]);
			}

			try {
				/**
				 * The grunt of the linting job is done here, when the subprocess finishes.
				 */
				linter.onDidExit(function () {
					output = output.trim();

					if (output.length === 0) {
						return resolve([]);
					}

					if (debug) {
						console.info("Output received on linter process exit, %d line(s) read", output.length);
					}

					// This might be required at some point, i.e. how to deal with
					// errors from the output? Easy when the errors come in a different format.
					// if (!self.outputIsJson(output)) {
					// 	console.error(output);
					// 	return resolve([]);
					// }

					resolve(self.parseLinterOutput(output));

					if (debug) {
						console.info("Finished linting.");
					}
					try {
						nova.fs.remove(scrapFileName);
					} catch (error) {
						// it's not fatal, just annoying
						console.warn("Warning: could not remove %s automatically, you might wish to do so manually!", scrapFileName);
					}
				});
			} catch (error) {
				console.error("error during processing - ", error);
				return resolve([]);
			}

			try {
				if (debug) {
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
		/**
		 * Collected issues to push to Nova engine.
		 * @type {Issue[]} - Array of issues to be parsed.
		 */
		let issues = [];
		/**
		 * Do it the basic way, since I'm no JavaScript expert.
		 * @type {Issue[]}
		 */
		// Split by newlines first:
		var lints = output.split(/\r\n|\n/);

		if (debug) {
			console.info("%d line(s) to process on this run.", lints.length);
		}

		for (var lint = 0; lint < lints.length - 1; lint++) {
			if (debug) {
				console.info("#%d: '%s'", lint, lints[lint]);
			}
			/**
			 * Array of matched issues on LSLint output.
			 * @type {string[]}
			 */
			let matches = lints[lint].match(/^\W*(\w+)::\s*\(\s*(\d*),\s*(\d*)\)-\(\s*(\d*),\s*(\d*)\):\s*(.*)$/);

			if (matches === null || matches.length <= 1) {
				if (debug) {
					console.info("No matches found; skipping over line:", lint);
				}
				continue;
			}

			if (debug) {
				console.info(matches.length, "match(es) found:", matches);
			}

			/**
			 * The issue raised in this loop iteration.
			 * @type {Issue}
			 */
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

			issue.line = matches[2];
			issue.column = matches[3];
			issue.endLine = matches[4];
			issue.endColumn = matches[5];
			issue.message = matches[6];

			if (debug) {
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
}

nova.assistants.registerIssueAssistant(["lsl", "ossl"], new LSLinter());
