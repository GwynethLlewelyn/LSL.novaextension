package main

import (
	"fmt"
	"github.com/beevik/etree"
)

func main() {
	doc := etree.NewDocument()
	if err := doc.ReadFromFile("../References/kwdb.xml"); err != nil {
		panic(err)
	}
	kwdbRoot := doc.SelectElement("keywords")
	fmt.Println("kwdbRoot element:", kwdbRoot.Tag)

	for _, kwdbKeyword := range kwdbRoot.SelectElements("keyword") {
		fmt.Println("CHILD element:", kwdbKeyword.Tag)
		if oneKeyword := kwdbKeyword.SelectElement("description"); oneKeyword != nil {
			fmt.Printf("  Description: %s\n", oneKeyword.Text())
		}
		for _, attr := range kwdbKeyword.Attr {
			fmt.Printf("  ATTR: %s=%s\n", attr.Key, attr.Value)
		}
	}
}