// 2007-09-25 http://wiki.secondlife.com/wiki/Chatbot
//
// Compile and run the Lsl you type on a channel,
// faster than you can thru the 2007-08 SL GUI,
// thus "chat with your 'bot" while it runs this script.
//
// Run well in Windows too by never cascading too many else-if.
//

// Choose one chat channel for hearing commands, echoing commands, and chatting results.

integer theChannel = 7;

// Chat back a copy of the meaningful or meaningless command, only on request.

integer theShouldEcho = TRUE;

// Describe the language of an LSL expression without infix operators, string escapes, etc.

string lf = "\n";
string quote = "\"";
string escape = "\\";//"

list spacers = [quote, "(", ")", "<", ">", "[", "]", "/", "*", "%", escape];

list separators()
{
	string tab = llUnescapeURL("%09"); // != "\t"
	string cr = llUnescapeURL("%0D"); // != "\r"
	return [tab, lf, cr, " ", ",", ";"];
}

list types = ["integer", "float", "key", "vector", "rotation", "list"];

// List some frequently useful code values.

list theCodes = [

	TRUE, FALSE,

	PI,
	TWO_PI,
	PI_BY_TWO,
	DEG_TO_RAD,
	RAD_TO_DEG,
	SQRT2,

	NULL_KEY,
	ALL_SIDES,
	EOF,
	ZERO_VECTOR,
	ZERO_ROTATION,

	STATUS_PHYSICS,

	DATA_BORN,
	DATA_NAME,
	DATA_ONLINE,
	DATA_PAYINFO,
	DATA_SIM_POS,
	DATA_SIM_RATING,
	DATA_SIM_STATUS,

	0
];

// List the name of each code.

list theCodenames = [
	"TRUE", "FALSE",

	"PI",
	"TWO_PI",
	"PI_BY_TWO",
	"DEG_TO_RAD",
	"RAD_TO_DEG",
	"SQRT2",

	"NULL_KEY",
	"ALL_SIDES",
	"EOF",
	"ZERO_VECTOR",
	"ZERO_ROTATION",

	"STATUS_PHYSICS",

	"DATA_BORN",
	"DATA_NAME",
	"DATA_ONLINE",
	"DATA_PAYINFO",
	"DATA_SIM_POS",
	"DATA_SIM_RATING",
	"DATA_SIM_STATUS",

	"0"
];

// Evaluate any one parameter.

list valueOf(string word)
{
	if (0 <= llSubStringIndex(word, "."))
	{
		return [(float) word];
	}
	else if (0 <= llSubStringIndex("0123456789", llGetSubString(word, 0, 0)))
	{
		return [(integer) word];
	}
	else
	{
		integer index = llListFindList(theCodenames, [word]);
		if (0 <= index)
		{
			return llList2List(theCodes, index, index);
		} else {
			return [word]; // unevaluated
		}
	}
}

// Add and return the sum.

list sum(list values)
{
	if (llGetListEntryType(values, 0) == TYPE_VECTOR)
	{
		return [llList2Vector(values, 0) + llList2Vector(values, 1)];
	}
	return [];
}

// Subtract and return the difference.

list difference(list values)
{
	if (llGetListEntryType(values, 0) == TYPE_VECTOR)
	{
		return [llList2Vector(values, 0) - llList2Vector(values, 1)];
	}
	return [];
}

// Multiply and return the product.

list product(list values)
{
	if (llGetListEntryType(values, 0) == TYPE_ROTATION)
	{
		return [llList2Rot(values, 0) * llList2Rot(values, 1)];
	}
	return [];
}

// Divide and return the quotient.

list quotient(list values)
{
	if (llGetListEntryType(values, 0) == TYPE_ROTATION)
	{
		return [llList2Rot(values, 0) / llList2Rot(values, 1)];
	}
	return [];
}

// Divide and return the remainder.

list remainder(list values)
{
	return [];
}

// Aggregate and return the composite.

list composite(list values)
{
	integer depth = llGetListLength(values);
	if (depth == 3)
	{
		vector vec;
		vec.x = llList2Float(values, 0);
		vec.y = llList2Float(values, 1);
		vec.z = llList2Float(values, 2);
		return [vec];
	}
	if (depth == 4)
	{
		rotation rot;
		rot.x = llList2Float(values, 0);
		rot.y = llList2Float(values, 1);
		rot.z = llList2Float(values, 2);
		rot.s = llList2Float(values, 2);
		return [rot];
	}
	return [];
}

// Pass the parameters to the named routine.
// Return a list of results.
// Return empty if no result, if empty list returned, or if callable meaningless.

list resultOf(string callable, list parameters)
{

	// Abbreviate the word "parameters"

	list ps = parameters;

	// Suicide on command

	if ("llDie" == callable) // ()
	{
		llDie(); // CAUTION -- this call deletes this script without saving changes -- CAUTION
	}

	// Return a list of one result of some verbose prefix arithmetic such as { "+"(vec1, vec2) }

	if ("<>" == callable)
	{
		return composite(ps);
	}
	else if ("+" == callable)
	{
		return sum(ps);
	}
	else if ("-" == callable)
	{
		return difference(ps);
	}
	else if ("*" == callable)
	{
		return product(ps);
	}
	else if ("/" == callable)
	{
		return quotient(ps);
	}
	else if ("%" == callable)
	{
		return remainder(ps);
	}

	// Return a list of one result of any type, for some meaningful verbs

	if ("llEscapeURL" == callable) // url
	{
		return [llEscapeURL(llList2String(ps, 0))];
	}
	else if ("llEuler2Rot" == callable) // (v)
	{
		return [llEuler2Rot(llList2Vector(ps, 0))];
	}
	else if ("llGetAgentInfo" == callable) // (id)
	{
		return [llGetAgentInfo(llList2Key(ps, 0))];
	}
	else if ("llGetAgentSize" == callable) // (id)
	{
		return [llGetAgentSize(llList2Key(ps, 0))];
	}
	else if ("llGetFreeMemory" == callable) // ()
	{
		return [llGetFreeMemory()];
	}

	else if ("llGetLinkKey" == callable) // (linknum)
	{
		return [llGetLinkKey(llList2Integer(ps, 0))];
	}
	else if ("llGetNumberOfPrims" == callable) // ()
	{
		return [llGetNumberOfPrims()];
	}
	else if ("llGetOwner" == callable) // ()
	{
		return [llGetOwner()];
	}
	else if ("llGetPos" == callable) // ()
	{
		return [llGetPos()];
	}
	else if ("llGetLocalRot" == callable) // ()
	{
		return [llGetLocalRot()];
	}

	// "ERROR : Syntax Error" rejects another cascading "else" here, in Windows SL

	if ("llGetRegionName" == callable) // ()
	{
		return [llGetRegionName()];
	}
	else if ("llGetRot" == callable) // ()
	{
		return [llGetRot()];
	}
	else if ("llGetSunDirection" == callable) // ()
	{
		return [llGetSunDirection()];
	}
	else if ("llKey2Name" == callable) // id
	{
		return [llKey2Name(llList2Key(ps, 0))];
	}
	else if ("llRequestAgentData" == callable) // (id, data)
	{
		return [llRequestAgentData(llList2Key(ps, 0), llList2Integer(ps, 1))];
	}

	else if ("llRequestSimulatorData" == callable) // (simulator, data)
	{
		return [llRequestSimulatorData(llList2String(ps, 0), llList2Integer(ps, 1))];
	}
	else if ("llRot2Euler" == callable) // (q)
	{
		return [llRot2Euler(llList2Rot(ps, 0))];
	}
	else if ("llRotBetween" == callable) // (v1, v2)
	{
		return [llRotBetween(llList2Vector(ps, 0), llList2Vector(ps, 1))];
	}
	else if ("llUnescapeURL" == callable) // url
	{
		return [llUnescapeURL(llList2String(ps, 0))];
	}
	else if ("llVecNorm" == callable) // v
	{
		return [llVecNorm(llList2Vector(ps, 0))];
	}

	// Obey some meaningful verbs that return no result

	integer meaningful = TRUE;

	if ("llApplyImpulse" == callable) // (force, local)
	{
		llApplyImpulse(llList2Vector(ps, 0), llList2Integer(ps, 1));
	}
	else if ("llApplyRotationalImpulse" == callable) //a (force, local)
	{
		llApplyRotationalImpulse(llList2Vector(ps, 0), llList2Integer(ps, 1));
	}
	else if ("llDialog" == callable) // (avatar, message, buttons, channel)
	{
		llDialog(llList2Key(ps, 0),
			llList2String(ps, 1), list2ListEntry(ps, 2), llList2Integer(ps, 3));
	}
	else if ("llSetAlpha" == callable) // (alpha, face)
	{
		llSetAlpha(llList2Float(ps, 0), llList2Integer(ps, 1));
	}
	else if ("llSetBuoyancy" == callable) // (buoyancy)
	{
		llSetBuoyancy(llList2Float(ps, 0));
	}

	else if ("llSetColor" == callable) // (color, face)
	{
		llSetColor(llList2Vector(ps, 0), llList2Integer(ps, 1));
	}
	else if ("llSetLocalRot" == callable) // (rot)
	{
		llSetLocalRot(llList2Rot(ps, 0));
	}
	else if ("llSetPos" == callable) // (pos)
	{
		llSetPos(llList2Vector(ps, 0));
	}
	else if ("llSetRot" == callable) // (rot)
	{
		llSetRot(llList2Rot(ps, 0));
	}
	else if ("llSetScale" == callable) // (scale)
	{
		llSetScale(llList2Vector(ps, 0));
	}

	else if ("llSetStatus" == callable) // (status, value)
	{
		llSetStatus(llList2Integer(ps, 0), llList2Integer(ps, 1));
	}
	else if ("llSetText" == callable) // (text, color, alpha)
	{
		llSetText(llList2String(ps, 0), llList2Vector(ps, 1), llList2Float(ps, 2));
	}
	else if ("llSitTarget" == callable) // (offset, rot)
	{
		llSitTarget(llList2Vector(ps, 0), llList2Rot(ps, 1));
	}
	else if ("llSleep" == callable) // (sec)
	{
		llSleep(llList2Float(ps, 0));
	}
	else
	{
		meaningful = FALSE;
	}

	// Return an empty list if callable returns no result

	if (meaningful)
	{
		return []; // FIXME: indistinguishable from callable meaningless
	}

	// Return an empty list if callable meaningless

	return [];
}

// Return the entries between the first index and the lastPlus index.
// cf. http://wiki.secondlife.com/wiki/Slice_List_String_Etc
// cf. http://www.google.com/search?q=site:docs.python.org+slice

list listGetBetween(list entries, integer first, integer lastPlus)
{

	// Count negative indices back from beyond, stopping at zero

	integer beyond = llGetListLength(entries);
	if (first < 0) { first += beyond; if (first < 0) { first = 0; } }
	if (lastPlus < 0) { lastPlus += beyond; if (lastPlus < 0) { lastPlus = 0; } }

	// Slice if indices nonnegative and strictly ordered

	if (first < lastPlus) // implies && (1 <= lastPlus)
	{
		return llList2List(entries, first, lastPlus - 1);
	}

	// Else return the empty list

	return [];
}

// Return the chars between the first index and the lastPlus index.
// cf. http://wiki.secondlife.com/wiki/Slice_List_String_Etc
// cf. http://www.google.com/search?q=site:docs.python.org+slice

string stringGetBetween(string chars, integer first, integer lastPlus)
{

	// Count negative indices back from beyond, stopping at zero

	integer beyond = llStringLength(chars);
	if (first < 0) { first += beyond; if (first < 0) { first = 0; } }
	if (lastPlus < 0) { lastPlus += beyond; if (lastPlus < 0) { lastPlus = 0; } }

	// Slice if indices nonnegative and strictly ordered

	if (first < lastPlus) // implies && (1 <= lastPlus)
	{
		return llGetSubString(chars, first, lastPlus - 1);
	}

	// Else return the empty string

	return "";
}

// Call llParseString2List for each of the sources.
// Return the results in order.
// cf. http://wiki.secondlife.com/wiki/Separate_Words

list applyLlParseString2List(list sources, list separators, list spacers)
{
	list words = [];
	integer index;
	integer lenSources = llGetListLength(sources);
	for (index = 0; index < lenSources; ++index)
	{
		string source = llList2String(sources, index);
		words += llParseString2List(source, separators, spacers);
	}
	return words;
}

// Divide a source string into words.
// See the chars between separators or spacers, and each spacer, as a word.
// Never see the empty string as a word.
// cf. http://wiki.secondlife.com/wiki/Separate_Words

list separateWords(string chars, list separators, list spacers)
{

	// Begin with all chars in one word

	list words = [chars];

	// List the chars between spacers, and each spacer, as a word

	integer index;
	integer lenSpacers = llGetListLength(spacers);
	for (index = 0; index < lenSpacers; index += 8)
	{
		list some = llList2List(spacers, index, index + 8 - 1);
		words = applyLlParseString2List(words, [], some);
	}

	// Discard the separators after letting the separators separate words

//  integer index;
	integer lenSeparators = llGetListLength(separators);
	for (index = 0; index < lenSeparators; index += 8)
	{
		list some = llList2List(separators, index, index + 8 - 1);
		words = applyLlParseString2List(words, some, []);
	}

	// Succeed

	return words;
}

// Fetch named values, keep spacers, discard separators and commentary.
// Along the way, rejoin any quotation broken into words.
// Trust the caller to have kept at least the separators inside quotations.

list assignValues(list words)
{

	// Begin with nothing

	list values = [];

	// Divide the command into words, but also shatter quotations

	integer lenWords = llGetListLength(words);

	// Consider each word or word of a quotation

	integer index = 0;
	while (index < lenWords)
	{
		string word = llList2String(words, index++);

		// Join together the words of a quotation

		if (word == quote)
		{
			string value = "";
			do
			{
				word = llList2String(words, index++);
				if (word != quote)
				{
					value += word;
				}
			} while ((word != quote) && (index < lenWords));

			// Quote the chars simply, so the quotation is never found in spacers

			values += quote + value + quote;
		}

		// Discard slash slash commentary

		else if ((word == "/") && (llList2String(words, index) == "/"))
		{
			return values;
		}

		// Discard separators

		else if (0 <= llListFindList(separators(), [word]))
		{
			;
		}

		// Keep spacers

		else if (0 <= llListFindList(spacers, [word]))
		{
			values += word; // often (word == valueOf(word)) here
		}

		// Fetch named values

		else
		{
			values += valueOf(word);
		}
	}

	// Succeed

	return values;
}

// Return an equivalent source string.
// Pass each quoted parameter value to the callable.
// Compare llDumpList2String

string toSourceString(string callable, list values)
{
	string chars = callable + "(";

	// Take each quoted parameter in order

	integer opened = -1;

	integer index;
	integer lenValues = llGetListLength(values);
	for (index = 0; index < lenValues; ++index)
	{
		list value = llList2List(values, index, index);
		string word = (string) value;

		// Separate inside of each list

		if (word == "[")
		{
			opened = 0;
		}
		if ((index != (opened + 1)) && (word != "]"))
		{
			chars += ", ";
		}

		// Append the quoted parameter

		chars += word;
	}

	// Succeed

	chars += ");";
	return chars;
}

// Fetch an indexed parameter of list type.
// Compare llList2Rot llList2String llList2Vector etc.

list list2ListEntry(list parameters, integer index)
{

	// Step thru links back to the start of this last parameter

	integer depth = llList2Integer(parameters, index);
	integer offset = -1;
	while (0 < depth--)
	{
		offset -= llList2Integer(parameters, offset + 0);
	}

	// Return the zero or more entries

	integer lengthPlus = llList2Integer(parameters, offset + 0);
	integer lenEntries = (lengthPlus - 1);
	list entries = listGetBetween(parameters, offset - lenEntries, offset);
	return entries;
}

// Return a list of one parameter per entry on the left
// by moving the entries of list type parameters
// into a linked list of fetchable lists on the right.

list indexParameters(string callable, list passables)
{

	// Begin with nothing and begin outside of [ ... ]

	list indexables = [];
	list fetchables = [];
	integer depth = 0; // no lists found
	integer opened = -1; // not open

	// Take each quoted parameter in order

	integer index;
	integer lenPassables = llGetListLength(passables);
	for (index = 0; index < lenPassables; ++index)
	{
		list passable = llList2List(passables, index, index);
		string word = (string) passable;

		// Count the zero or more passables enclosed by [ ... ]

		if ((word == "]") && (0 <= opened))
		{
			integer lenEntries = llGetListLength(indexables) - opened;

			// Substitute the nonnegative length for those passables

			list entries = listGetBetween(indexables, opened, llGetListLength(indexables));
			indexables = listGetBetween(indexables, 0, opened) + depth;
			++depth;

			// Move these passables into the linked list on the right

			fetchables = (lenEntries + 1) + fetchables; // also count the depth as a flat added
			fetchables = entries + fetchables;

			// Consume the "[" from before

			opened = -1;
		}

		// Open with "[" til "]" found

		if (word == "[")
		{
			opened = llGetListLength(indexables);
		}
		else if (word == "]")
		{
			opened = -1;
		}

		// Unquote each string parameter simply

		else if (llGetListEntryType(passable, 0) == TYPE_STRING)
		{
			string chars = word;
			if (llGetSubString(word, 0, 0) == quote)
			{
				chars = stringGetBetween(word, 1, -1); // maybe empty
			}
			indexables += chars;
		}

		// Add the other parameters in order

		else
		{
			indexables += passable;
		}
	}

	// Succeed

	return indexables + fetchables;
}

// Quote each string result simply, so that each result is never found in spacers.
// Pass thru any other results unchanged.

list quoteResults(list results)
{

	// Begin with nothing

	list listables = [];

	// Consider quoting the one result, else every result enclosed in [ ... ]

	integer first = 0;
	integer last = 0;
	integer beyond = llGetListLength(results);
	if (1 < llGetListLength(results))
	{
		first = 1;
		last = beyond - 2;
	}

	// Take each result in order

	integer index;
	for (index = first; index <= last; ++index)
	{

		// Quote each string result (or key result) simply

		integer resultType = llGetListEntryType(results, index);
		if ((resultType == TYPE_STRING) || (resultType == TYPE_KEY))
		{
			list result = llList2List(results, index, index);
			string word = (string) result;
//          listables += "(key) " + quote + word + quote; // no
			listables += quote + word + quote;
		}

		// List all other results unchanged

		else
		{
			list result = llList2List(results, index, index);
			listables += result;
		}
	}

	// Enclose a list of zero or more results in [ ... ], else return one result

	if (1 < beyond)
	{
		return "[" + listables + "]";
	}

	return listables;
}

// Interpret one list of words.

list fetchResults(list values)
{

	// Begin with nothing

	list results = [];
	list depths = [];

	// Take each action in order

	integer index;
	integer lenValues = llGetListLength(values);
	for (index = 0; index < lenValues; ++index)
	{
		list value = llList2List(values, index, index);
		string word = (string) value;

		// Count results of "( ... )" or of "< ... >"

		if ((word == "(") || (word == "<"))
		{
			depths += llGetListLength(results); // push the depth
		}

		else if ((word == ")") || (word == ">"))
		{

			// Pop the depth of "(" or "<" opened without ">" or ")" to close

			integer first = llList2Integer(depths, -1);
			depths = listGetBetween(depths, 0, -1); // pop the tail

			// Pop the zero or more parameters

			list passables = listGetBetween(results, first, llGetListLength(results));
			results = listGetBetween(results, 0, first);
//          llOwnerSay("..." + "(" + llList2CSV(passables) + ") == passables");

			// Choose the callable to receive the parameters

			string callable = "<>"; // "<>" for vector source or rotation source
			if (word == ")")
			{
				callable = "()"; // "" for type casts
				list passable0 = llList2List(passables, 0, 0);
				if ((llGetListLength(passables) != 1) || (llListFindList(types, passable0) < 0))
				{
					callable = llList2String(results, -1);
					results = listGetBetween(results, 0, -1); // pop the tail
				}

				// Unquote the callable simply

				if (llGetSubString(callable, 0, 0) == quote)
				{
					callable = stringGetBetween(callable, 1, -1); // unquote simply, even if empty
				}
			}

			// Often chat back each call

			if (theShouldEcho && (llListFindList(["()", "<>"], [callable]) < 0))
			{
				llOwnerSay(toSourceString(callable, passables));
			}

			// Call with a list of parameters

			list parameters = indexParameters(callable, passables);
//          llOwnerSay("(" + llList2CSV(parameters) + ") == parameters");

			list quotables = resultOf(callable, parameters);
//          llOwnerSay("(" + llList2CSV(quotables) + ") == quotables");

			list listables = quoteResults(quotables);
//          llOwnerSay("(" + llList2CSV(listables) + ") == listables");

			results += listables;
		}

		// Push any other word as a parameter, without change

		else
		{
			results += value;
		}
	}

	// Succeed

	return results;
}

// Hear and echo and obey the chat of the owner at the channel.

default
{

	state_entry()
	{
//      llOwnerSay(llGetScriptName() + ".default.state_entry");
		llListen(theChannel, "", llGetOwner(), "");
	}

	dataserver(key queryid, string data)
	{
		llOwnerSay(toSourceString("dataserver", quoteResults([queryid]) + quoteResults([data])));
	}

	listen(integer channel, string name, key id, string message)
	{
//      llOwnerSay(llGetScriptName() + ".default.listen");

		// Compile and run

		llOwnerSay("// " + message);

		list words = separateWords(message, [], separators() + spacers);
//      llOwnerSay(llList2CSV(words) + " == words");

		list values = assignValues(words);
//      llOwnerSay(llList2CSV(values) + " == values");

		list results = fetchResults(values);
//      llOwnerSay(llList2CSV(results) + " == results");

		// Chat back the results, if not empty

		if (results != [])
		{
			llOwnerSay(stringGetBetween(toSourceString("", results), 1, -2));
		}

//      llOwnerSay("OK");
	}
}