// Notecard Multi-line Entries Configuration Reader v1.6 by Maddox Deluxe
// Error Checking for: Key Names, values, Empty Notecard Data, Line Spaces
// This script is free; you can redistribute it and/or modify it
// Just read the comments on the script

key NotecardQueryId;          // key name of the notecard
key LineRequestID;            // notecard line count
integer LineTotal;            // The number of lines in the notecard
integer LineIndex;            // index for data read requests

string Author_Name = "";      // variable for setting author name
string Menu_Button_Name = ""; // variable for setting menu button name to the themes list
string Back_Drop_UUID = "";   // variable for setting backdrop uuid key to the themes list
string Floor_Drop_UUID = "";  // variable for setting floor drop uuid key to the themes list

string data;                  // notecard data
string GetNoteName;           // notecard name

list Themes;                  // our list database for testing
list KeyNames;                // our list database for the key names: [Author Name]. [Menu Button Name], ect..

integer ThemesCount;          // counts how many themes they are in the notecard configuration

key User;                     // user tracker key

// function by Maddox Deluxe
// test to dump all 3 elements in the list that goes with each other
DumpListFind(list db, string name)
{
	integer index = llListFindList(db, [name]);
	if (~index) {
		list Found = llList2List(db, index, index + 2);

		string BN = llList2String(Found, 0);
		string BD = llList2String(Found, 1);
		string FD = llList2String(Found, 2);

		llOwnerSay("Dump testing for list database search.\nAuthor Name: " + (string)Author_Name + "\nButton Name: " + (string)BN + "\nBackdrop Texture: " + (string)BD + "\nFloor drop Texture: " + (string)FD);

		llOwnerSay("List Dump Found Test: " + llDumpList2String(Found, ","));

		//  llMessageLinked(LINK_SET, 0,"SET BACKDROP TEXTURE",(string)BD);
		if (FD != (key)"00000000-0000-0000-0000-000000000000")
		{
			//    llMessageLinked(LINK_SET, 0,"SET FLOOR DROP TEXTURE",(string)FD);
		}

	}
}
// function by Maddox Deluxe
// looks for 3 elements and the search string is the first element of the set
integer IsElement(list db, string search)
{
	integer index = llListFindList(db, [search]);
	if (~index) {
		list Found = llList2List(db, index, index + 2);

		string str = llList2String(Found, 0);
		if (str == search)
			return TRUE; // was found
	}
	return FALSE; // was not found
}
// function by Maddox Deluxe
// checks the key names making sure they match what is setup in the notecard
integer KeyNameCheck(list db, string search)
{
	integer i;
	for (i = 0; i < llGetListLength(db); ++i) {
		string s = llList2String(db, i);
		if (s == search) return TRUE;
	}
	return FALSE;
}

// Checks the uuid keys in the notecard, making sure they are real keys
// 2 valid key, not NULL_KEY
// 1 (TRUE):  NULL_KEY
// 0 (FALSE): not a key
// https://wiki.secondlife.com/wiki/Category:LSL_Key
integer isKey(key uuid)
{
	if (uuid)
		return 2;
	return (uuid == NULL_KEY);
}

// notecard initialization
NoteCardInit(string GrabNoteCardName, key id) // key id could be use for dialog message or llInstantMessage
{
	if (llGetInventoryKey(GrabNoteCardName) == NULL_KEY) // update v1.6 with notecard null key checking
	{
		llInstantMessage(id, "Notecard '" + GrabNoteCardName + "' (1) The notecard key is null, write some data in it and hit save. (2) Notecard was not found.");
		return;
	}
	else
		LineRequestID = llGetNumberOfNotecardLines(GrabNoteCardName); // total number of lines in the notecard
	Themes = [];      // clear the themes list
	LineIndex = 0;    // start reading from line 0
	ThemesCount = 0;  // start adding from 0
	NotecardQueryId = llGetNotecardLine(GrabNoteCardName, LineIndex);
	KeyNames = [];    // clear the keynames list
	// setup our key names
	KeyNames = ["[author name]", "[menu button name]", "[backdrop texture uuid]", "[floordrop texture uuid]"];
	llInstantMessage(id, "Please stand by, reading themes configuration for " + GrabNoteCardName);
	GetNoteName = GrabNoteCardName;
}

ProcessThemes(string data, key id) // key id could be use for dialog message or llInstantMessage
{
	list cmd;
	string cmd_grab;
	string value;

	//  if we are at the end of the file
	if (data == EOF) {
		llInstantMessage(id, "Done reading themes configuration for " + GetNoteName + "\n\nTotal Themes: " + (string)ThemesCount);

		// lets use the 2nd search string for this test, the search strings are the button names in the notecard configuration
		string TestSearch = "Fantasy Car";
		if (IsElement(Themes, TestSearch) == FALSE) {
			llInstantMessage(id, "Themes Configuration Error. Button search string was not found.");
			return;
		}
		else
			DumpListFind(Themes, TestSearch);
		return;
	}
	if (data == "") {
		llInstantMessage(id, "Themes Configuration Format Error. (1) No DATA found. (2) Got line spaces.");
		llResetScript();
	}
	if (data != "") {
		// lets move on and read the next line
		NotecardQueryId = llGetNotecardLine(GetNoteName, ++LineIndex);

		// cut off any leading blanks
		// ignore comment lines
		// if you change the comment line from // to #, make sure you change the 1 to 0
		if (llGetSubString(data, 0, 1) != "//" && llStringTrim(data, STRING_TRIM) != "") {
			cmd = llParseString2List(data, ["="], []);
			cmd_grab = llStringTrim(llToLower(llList2String(cmd, 0)), STRING_TRIM);
			value = llStringTrim(llList2String(cmd, 1), STRING_TRIM);

			// we only need this at the start to check for key name errors :)
			if (KeyNameCheck(KeyNames, cmd_grab) == FALSE) {
				llInstantMessage(id, "Themes Configuration Format Error on line: " + (string)LineIndex + ".");
				llResetScript();
			}
			if (cmd_grab == "[author name]") {
				Author_Name = value;
				// error checking for Author Name
				if (value == "") {
					llInstantMessage(id, "Themes Configuration Error on line: " + (string)LineIndex + ". Author Name can not be empty.");
					llResetScript();
				}
			}
			else
				if (cmd_grab == "[menu button name]") {
					Menu_Button_Name = value;
					// error checking for Menu Button Name
					if (value == "") {
						llInstantMessage(id, "Themes Configuration Error on line: " + (string)LineIndex + ". Menu Button Name can not be empty.");
						llResetScript();
					}
				}
				else
					if (cmd_grab == "[backdrop texture uuid]") {
						Back_Drop_UUID = value;
						// error checking for BackDrop Texture UUID
						if (value == "" || (isKey((key)value)) == 1 || (isKey((key)value)) == 0) {
							llInstantMessage(id, "Themes Configuration Error on line: " + (string)LineIndex + ". (1) The Backdrop UUID Key is empty. (2) The Backdrop UUID is not a key. (3) The Backdrop UUID Key is NULL.");
							llResetScript();
						}
					}
					else
						if (cmd_grab == "[floordrop texture uuid]") {
							Floor_Drop_UUID = value;
							// error checking for FloorDrop Texture UUID
							if (value == "" || (isKey((key)value)) == 0) {
								llInstantMessage(id, "Themes Configuration Error on line: " + (string)LineIndex + ". (1) The Floor-drop UUID Key is empty. (2) The Floor-drop UUID is not a key.");
								llResetScript();
							}
							ThemesCount = ThemesCount + 1;                                  // add +1 to our themes count
							Themes += [Menu_Button_Name, Back_Drop_UUID, Floor_Drop_UUID];   // add to our themes test list database
						}
		}
	}
}
default
{
	link_message(integer sender_num, integer num, string str, key id)
	{
		if (str == "SetUserKey") {
			// sets up the user key that click the object
			User = (key)id;
		}
		if (str == "LoadThemes") {
			// loads up our test notecard
			NoteCardInit((string)id, User);
		}
	}
	//  triggered when task receives asynchronous data
	dataserver(key request_id, string data)
	{
		if (request_id == NotecardQueryId) {
			//  we start processing our notecard data
			ProcessThemes(data, User);
		}
	}
}