// Simple application to load the XML from the KWDB and
// spew out XML for Completions
package main

import (
	"log"
	"os"
	"errors"
	"github.com/beevik/etree"
)

// Generic function which will parse a block of completion types, known as a 'set'
func parseSet(readDoc, writeDoc *etree.Element, comment, name, symbol, element string) error {
	// some simple error checking
	if readDoc == nil || writeDoc == nil {
		return errors.New("parseSet() needs valid read & write XML trees (*etree.Element)")
	}
	if symbol == "" {
		return errors.New("parseSet() called with empty symbol parameter (string)")
	}
	if comment != "" {
		writeDoc.CreateComment(comment)
	}
	aKeyword  := writeDoc.CreateElement("set")
	aKeyword.CreateAttr("name", name)
	aKeyword.CreateAttr("symbol", symbol)

	var aCompletion, aDescription *etree.Element

	for _, kwdbKeyword := range readDoc.SelectElements(element) {
		// log.Println("CHILD element:", kwdbKeyword.Tag)
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
		if element == "function" || element == "method" {
			var behaviourText = "("	// We will accumulate params here.
			var first = true		// Used to format the first parameter differently from the others.

			for _, param := range kwdbKeyword.SelectElements("param") {
				for _, attr := range param.Attr {
					//TODO(gwyneth): we assume that "type" comes always before "name"
					// If that's not the case, we will need to add a little more code...
					if first {
						behaviourText += attr.Value
						first = false
					} else {
						if attr.Key == "type" {
							behaviourText += ","
						}
						behaviourText += " " + attr.Value
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

func main() {
	// What we spew out: begin creating XML document
	completionsDoc := etree.NewDocument()
	completionsDoc.CreateProcInst("xml", `version="1.0" encoding="UTF-8"`)

	theCompletionsDoc := completionsDoc.CreateElement("completions")
	aProvider := theCompletionsDoc.CreateElement("provider")
	anElement := aProvider.CreateElement("selector")
	anElement.CreateText("lsl")
	anElement  = aProvider.CreateElement("expression")
	anElement.CreateText("\\b[a-zA-Z0-9-_]*")
	anElement  = aProvider.CreateElement("set")
	anElement.CreateText("lsl.entities")

	theCompletionsDoc.CreateComment("Entities")
	aSet      := theCompletionsDoc.CreateElement("set")
	aSet.CreateAttr("name", "lsl.entities")
	anElement  = aSet.CreateElement("completion")
	anElement.CreateAttr("string", "\"")

	// there will be more and more stuff here before we
	// actually *start* parsing the KWDB!

	// Now prepare to read from the KWDB
	doc := etree.NewDocument()
	if err := doc.ReadFromFile("../References/kwdb.xml"); err != nil {
		log.Panic(err)
	}
	// There should be only one 'main' XML entity, called 'keywords'
	kwdbRoot := doc.SelectElement("keywords")
	if kwdbRoot == nil {
		log.Fatal("Sorry, this doesn't seem to be a valid KWDB")
	}

	// Start parsing all keywords
	if err := parseSet(kwdbRoot, theCompletionsDoc, "Keywords", "lsl.keywords", "keyword", "keyword"); err != nil {
		log.Println(err)
	}

	// Now go for language types
	if err := parseSet(kwdbRoot, theCompletionsDoc, "Language types", "lsl.types", "type", "type"); err != nil {
		log.Println(err)
	}

	// Constants
	if err := parseSet(kwdbRoot, theCompletionsDoc, "Constants", "lsl.constants", "constant", "constant"); err != nil {
		log.Println(err)
	}

	// Functions
	if err := parseSet(kwdbRoot, theCompletionsDoc, "Functions", "lsl.functions", "function", "function"); err != nil {
		log.Println(err)
	}

	completionsDoc.Indent(2)
	completionsDoc.WriteTo(os.Stdout)
}