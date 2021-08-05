// Simple application to load the XML from the KWDB and
// spew out XML for Completions
package main

import (
	"fmt"
	"log"

	"github.com/beevik/etree"
)

func main() {
	// What we spew out
	completionsDoc := etree.NewDocument()
	completionsDoc := NewDocument()
	completionsDoc.CreateProcInst("xml", `version="1.0" encoding="UTF-8"`)

	aProvider := completionsDoc.CreateElement("provider")
	anElement := aProvider.CreateElement("selector")
	someText  := anElement.CreateText("lsl")
	anElement  = aProvider.CreateElement("expression")
	someText   = anElement.CreateText("\b[a-zA-Z0-9-_]*")
	anElement  = aProvider.CreateElement("set")
	someText   = anElement.CreateText("lsl.entities")

	aComment  := completionsDoc.CreateComment("Entities")
	aSet      := completionsDoc.CreateElement("set")
	anAttr	  := aSet.CreateAttr("name", "lsl.entities")
	anElement  = aSet.CreateElement("completion")
	anAttr	   = anElement.CreateAttr("string", "&quot;")

	// there will be more and more stuff here before we
	// actually *start* parsing the KWDB!

	doc := etree.NewDocument()
	if err := doc.ReadFromFile("../References/kwdb.xml"); err != nil {
		log.Panic(err)
	}
	// this is the root of all roots
	if kwdbRoot := doc.SelectElement("keywords"); kwdbRoot == nil {
		log.Fatal("Sorry, this doesn't seem to be a valid KWDB")
	}

	// Spew out generic garbage
	log.Println("kwdbRoot element:", kwdbRoot.Tag)

	// Start parsing all keywords
	aKeyword  := completionsDoc.CreateElement("set")
	anAttr	   = aKeyword.CreateAttr("name", "lsl.keywords")
	anAttr	   = aKeyword.CreateAttr("symbol", "keyword")

	var aCompletion etree.Element

	for _, kwdbKeyword := range kwdbRoot.SelectElements("keyword") {
		// log.Println("CHILD element:", kwdbKeyword.Tag)
		aCompletion = aKeyword.CreateElement("completion")
		for _, attr := range kwdbKeyword.Attr {
			log.Printf("  ATTR: %s=%s\n", attr.Key, attr.Value)
		}
		if oneKeyword := kwdbKeyword.SelectElement("description"); oneKeyword != nil {
			log.Printf("  Description: %s\n", oneKeyword.Text())
		}
	}

}