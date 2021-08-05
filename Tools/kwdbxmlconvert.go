// Simple application to load the XML from the KWDB and
// spew out XML for Completions
package main

import (
	"flag"
	"log"
	"os"
	"errors"
	"github.com/beevik/etree"
)

// Generic function which will parse a block of completion types, known as a 'set'.
func parseCompletionsSet(readDoc, writeDoc *etree.Element, comment, name, symbol string) error {
	// some simple error checking
	if readDoc == nil || writeDoc == nil {
		return errors.New("parseCompletionsSet() needs valid read & write XML trees (*etree.Element)")
	}
	if symbol == "" {
		return errors.New("parseCompletionsSet() called with empty symbol parameter (string)")
	}
	if comment != "" {
		writeDoc.CreateComment(comment)
	}
	aKeyword  := writeDoc.CreateElement("set")
	aKeyword.CreateAttr("name", name)
	aKeyword.CreateAttr("symbol", symbol)

	var aCompletion, aDescription *etree.Element

	for _, kwdbKeyword := range readDoc.SelectElements(symbol) {
		aCompletion = aKeyword.CreateElement("completion")
		for _, attr := range kwdbKeyword.Attr {
			switch attr.Key {
				case "name":
					aCompletion.CreateAttr("string", attr.Value)
				case "status":
					if attr.Value == "deprecated" {
						aCompletion.CreateAttr("deprecated", "true")
					}
				case "type":
					// log.Printf("%q: We got a \"type\" For name: %q symbol: %q element %q", attr.Key, name, symbol, element)
					if symbol == "function" {
						aCompletion.CreateAttr("result", attr.Value)
					}
				case "value":	// also for constants; should be ignored for now
					aCompletion.CreateAttr("value", attr.Value)
				case "version":
				case "grid":
				// case "delay":
				// case "energy":
					// ignore for now, since Nova has no way to add them directly
			}
		}
		if oneKeyword := kwdbKeyword.SelectElement("description"); oneKeyword != nil {
			aDescription = aCompletion.CreateElement("description")
			aDescription.CreateText(oneKeyword.Text())
		}
		// if it's a function, collect parameters, they'll be used as a behaviour:
		if symbol == "function" || symbol == "method" || symbol == "event"{
			var behaviourText = "("	// We will accumulate params here.
			var first = true		// Used to format the first parameter differently from the others.

			for _, param := range kwdbKeyword.SelectElements("param") {
				for _, attr := range param.Attr {
					//TODO(gwyneth): we assume that "type" comes always before "name"
					// If that's not the case, we will need to add a little more code...
					if first {
						behaviourText += "$[" + attr.Value
						first = false
					} else {
						if attr.Key == "name" {
							behaviourText += " " + attr.Value + "]"
						} else { // type
							behaviourText += ", $[" + attr.Value
						}
					}
				}
			}
			behaviourText += ")"
			aBehaviour	:= aCompletion.CreateElement("behavior")
			anAppend	:= aBehaviour.CreateElement("append")
			anAppend.CreateText(behaviourText)
		}
	}

	return nil	// no errors!
}

// Generic function which will parse a block of syntax scopes. Subtype is only used for some things and can be empty.
func parseSyntaxSet(readDoc, writeDoc *etree.Element, comment, name, symbol, subtype string) error {
	// some simple error checking
	if readDoc == nil || writeDoc == nil {
		return errors.New("parseSyntaxSet() needs valid read & write XML trees (*etree.Element)")
	}
	if symbol == "" {
		return errors.New("parseSyntaxSet() called with empty symbol parameter (string)")
	}
	if comment != "" {
		writeDoc.CreateComment(comment)
	}
	aKeyword  := writeDoc.CreateElement("scope")
	aKeyword.CreateAttr("name", name)
	scopeStrings := aKeyword.CreateElement("strings")
	if symbol != "type" {
		scopeStrings.CreateAttr("prefix", "(?<!\\.)")
	}
	if symbol == "function" || symbol == "event" { // events and constants apparently don't have any suffixes...
		scopeStrings.CreateAttr("suffix", "(?=\\()")
	}

	var aString *etree.Element

	if subtype != "" {
		subtypePath, err := etree.CompilePath("/[type='" + subtype + "']");
		if (err != nil) {
			return errors.New("parseSyntaxSet() could not process query involving subtype " + subtype);
		}
		for _, kwdbKeyword := range readDoc.FindElementsPath(subtypePath) {
			aString = scopeStrings.CreateElement("string")
			for _, attr := range kwdbKeyword.Attr {
				switch attr.Key {
					case "name":
						aString.CreateText(attr.Value)
				}
			}
		}
		return nil
	}

	for _, kwdbKeyword := range readDoc.SelectElements(symbol) {
		aString = scopeStrings.CreateElement("string")
		for _, attr := range kwdbKeyword.Attr {
			switch attr.Key {
				case "name":
					aString.CreateText(attr.Value)
			}
		}
	}
	return nil	// no errors!
}

// Main starts here. Yep.
func main() {
	// Parse flags, if any

	var config = map[string]*string {
		"kind":		flag.String("kind", "completion", "`completion` returns a complete XML for completions; `syntax` returns a snippet to be added to a pre-existing syntax file"),
		"kwdbfile":	flag.String("kwdbfile", "../References/kwdb.xml", "Location for the KWDB file (use STDIN to read from stdin)"),
		"output":	flag.String("output", "", "Output file location; defaults to stdout"),
	}

	flag.Parse()

	if *config["kind"] == "completion" {	// completion or syntax?
		// What we spew out: begin creating a new XML document

		completionsDoc := etree.NewDocument()
		completionsDoc.CreateProcInst("xml", `version="1.0" encoding="UTF-8"`)
		completionsDoc.CreateComment("Generated by kwdbxmlconvert; copy it to `/Completions/Linden\\ Scripting\\ Language.xml`")

		theCompletionsDoc := completionsDoc.CreateElement("completions")
		aProvider := theCompletionsDoc.CreateElement("provider")
		aProvider.CreateAttr("name", "lsl.globals")
		anElement := aProvider.CreateElement("syntax")
		anElement.CreateText("lsl")
		anElement  = aProvider.CreateElement("selector")
		anElement.CreateText("*:not(string,comment)")
		anElement  = aProvider.CreateElement("expression")
		anElement.CreateText("\\b[a-zA-Z_][a-zA-Z0-9-_]*")

		anElement  = aProvider.CreateElement("symbols")
		anElement.CreateAttr("type", "function")
		aBehavior := anElement.CreateElement("behavior")
		anArg	  := aBehavior.CreateElement("arguments")
		anArg.CreateAttr("prefix", "(")
		anArg.CreateAttr("suffix", ")")
		anArg.CreateAttr("separator", ", ")
		anElement  = aProvider.CreateElement("symbols")
		anElement.CreateAttr("type", "event")
		aBehavior  = anElement.CreateElement("behavior")
		anArg	   = aBehavior.CreateElement("arguments")
		anArg.CreateAttr("prefix", "(")
		anArg.CreateAttr("suffix", ")")
		anArg.CreateAttr("separator", ", ")
		anElement  = aProvider.CreateElement("symbols")
		anElement.CreateAttr("type", "keyword")
		anElement  = aProvider.CreateElement("symbols")
		anElement.CreateAttr("type", "type")
		anElement  = aProvider.CreateElement("symbols")
		anElement.CreateAttr("type", "variable,constant,argument")

		anElement  = aProvider.CreateElement("set")
		anElement.CreateText("lsl.functions")
		anElement  = aProvider.CreateElement("set")
		anElement.CreateText("lsl.events")
		anElement  = aProvider.CreateElement("set")
		anElement.CreateText("lsl.keywords")
		anElement  = aProvider.CreateElement("set")
		anElement.CreateText("lsl.types")
		anElement  = aProvider.CreateElement("set")
		anElement.CreateText("lsl.constants")

		// Now prepare to read from the KWDB
		doc := etree.NewDocument()
		if *config["kwdbfile"] != "STDIN" {
			if err := doc.ReadFromFile(*config["kwdbfile"]); err != nil {
				log.Panicf("Could not read from file %q; error was %q\n", *config["kwdbfile"], err)
			}
		} else {
			// attempt to read from stdin
			if _, err := doc.ReadFrom(os.Stdin); err != nil {
				log.Panic("Could not read from stdin; error was", err)
			}
		}
		// There should be only one 'main' XML entity, called 'keywords'
		kwdbRoot := doc.SelectElement("keywords")
		if kwdbRoot == nil {
			log.Fatal("Sorry, this doesn't seem to be a valid KWDB")
		}

		// Start parsing all keywords
		if err := parseCompletionsSet(kwdbRoot, theCompletionsDoc, "Keywords", "lsl.keywords", "keyword"); err != nil {
			log.Println(err)
		}

		// Now go for language types
		if err := parseCompletionsSet(kwdbRoot, theCompletionsDoc, "Language types", "lsl.types", "type"); err != nil {
			log.Println(err)
		}

		// Constants
		if err := parseCompletionsSet(kwdbRoot, theCompletionsDoc, "Constants", "lsl.constants", "constant"); err != nil {
			log.Println(err)
		}

		// Functions
		if err := parseCompletionsSet(kwdbRoot, theCompletionsDoc, "Functions", "lsl.functions", "function"); err != nil {
			log.Println(err)
		}

		// Functions
		if err := parseCompletionsSet(kwdbRoot, theCompletionsDoc, "Events", "lsl.events", "event"); err != nil {
			log.Println(err)
		}

		completionsDoc.Indent(2)
		if *config["output"] == "" {
			if _, err := completionsDoc.WriteTo(os.Stdout); err != nil {
				log.Println("Couldn't write to stdout; error was:", err)
			}
		} else {
			if err := completionsDoc.WriteToFile(*config["output"]); err != nil {
				log.Printf("Couldn't write to file %q; error was: %q\n", *config["output"], err)
			}
		}
	} else {
		// here we deal with the Syntax

		syntaxDoc := etree.NewDocument()
		syntaxDoc.CreateProcInst("xml", `version="1.0" encoding="UTF-8"`)
		syntaxDoc.CreateComment("Generated by kwdbxmlconvert; copy the relevant sections to `/Syntax/Linden\\ Scripting\\ Language.xml`")
		syntaxDoc.CreateComment("Note: this is **NOT** a complete syntax file!!")

		theSyntaxDoc := syntaxDoc.CreateElement("syntax")
		theSyntaxDoc.CreateAttr("name", "lsl")

		theMeta  := theSyntaxDoc.CreateElement("meta")
		aXMLItem := theMeta.CreateElement("name")
		aXMLItem.CreateText("Linden Scripting Language")
		aXMLItem  = theMeta.CreateElement("type")
		aXMLItem.CreateText("script")
		aXMLItem  = theMeta.CreateElement("preferred-file-extension")
		aXMLItem.CreateText("lsl")

		theSyntaxDoc.CreateComment("Start copying from below...")

		// Now prepare to read from the KWDB
		doc := etree.NewDocument()
		if *config["kwdbfile"] != "STDIN" {
			if err := doc.ReadFromFile(*config["kwdbfile"]); err != nil {
				log.Panicf("Could not read from file %q; error was %q\n", *config["kwdbfile"], err)
			}
		} else {
			// attempt to read from stdin
			if _, err := doc.ReadFrom(os.Stdin); err != nil {
				log.Panic("Could not read from stdin; error was", err)
			}
		}
		// There should be only one 'main' XML entity, called 'keywords'
		kwdbRoot := doc.SelectElement("keywords")
		if kwdbRoot == nil {
			log.Fatal("Sorry, this doesn't seem to be a valid KWDB")
		}

		if err := parseSyntaxSet(kwdbRoot, theSyntaxDoc, "Events", "lsl.identifier.core.function.event", "event", ""); err != nil {
			log.Println(err)
		}

		if err := parseSyntaxSet(kwdbRoot, theSyntaxDoc, "Core Functions", "lsl.identifier.core.function", "function", ""); err != nil {
			log.Println(err)
		}

		if err := parseSyntaxSet(kwdbRoot, theSyntaxDoc, "Integer constants", "lsl.identifier.constant.integer", "constant", "integer"); err != nil {
			log.Println(err)
		}

		if err := parseSyntaxSet(kwdbRoot, theSyntaxDoc, "Constants", "lsl.identifier.constant", "constant", ""); err != nil {
			log.Println(err)
		}

		if err := parseSyntaxSet(kwdbRoot, theSyntaxDoc, "Types", "lsl.identifier.type", "type", ""); err != nil {
			log.Println(err)
		}

		syntaxDoc.Indent(2)
		if *config["output"] == "" {
			if _, err := syntaxDoc.WriteTo(os.Stdout); err != nil {
				log.Println("Couldn't write to stdout; error was:", err)
			}
		} else {
			if err := syntaxDoc.WriteToFile(*config["output"]); err != nil {
				log.Printf("Couldn't write to file %q; error was: %q\n", *config["output"], err)
			}
		}
	}
}