<!--

/*------------------------------------------------------*/
/* ConsScale V2 calculator. April 2009. Raul Arrabales. */
/* raul@conscious-robots.com                            */
/*------------------------------------------------------*/


/*--------------------------------*/
/* ConsScale Intermediate results */
/*--------------------------------*/

// Level i quantitative score
var Li

// Cummulative Levels Score
var CLS

// ConsScale Quantitative Score
var CQS

// ConsScale Qualitative level
var Q_level

// Images
var LevelImage
var LevelImageFloor

// ConsScale Maximum Architectural level
var A_level

// ConsScale V2 constants
var K
var a

// ConsScale Level thresholds
var Thres


/*----------------------------*/
/* Calculator page references */
/*----------------------------*/

// HTML result string references

// ConsScale Qualitative Level
var CONSSCALE_level

// ConsScale Image
var CONSSCALE_image

// ConsScale Radar Graph
var CONSSCALE_graph

// ConsScale max. architectural level
var CONSSCALE_alevel

// ConsScale Quantitative Level Score
var CONSSCALE_cqs

// ConsScale Cummulative Levels Score
var CONSSCALE_cls

// Remarks about the calculation
var CONSSCALE_remarks

// ConsScale Li Results
var LevelResults

// Current remarks
var curRemarks



/*------------------------------*/
/* ConsScale CS and Arch arrays */
/*------------------------------*/

// Number of levels
var TopLevel

// ConsScale levels 
var ConsScaleMatrix 

// Max number of cognitive skills considered for any level
var J

// Max number of CS per level
var Ji

// Complete levels
var LevelComplete

// Architectural requirements per level matrix
var Ar_Requirements

// Level Names
var FloorLevel
var LevelName


/*--------------------------------*/
/* Architecture component indexes */
/*--------------------------------*/
var Arq_B  		// Body
var Arq_Spropio 	// Proprioceptive sensors
var Arq_Sext 		// Exteroceptive sensors
var Arq_A		// Actuators
var Arq_R		// Sensorimotor coordination
var Arq_M		// Memory
var Arq_Mn		// Multiple context
var Arq_Att		// Attention
var Arq_SsA		// Self-status assessment
var Arq_I		// Self
var Arq_O		// Others
var Arq_AR		// Accurate report
var Arq_AVR		// Accurate verbal report
var Arq_Rn		// Several streams

// Array of architecture flags
var Arq_Flag



/*
 * Annotates all the CS of a level as checked or unchecked depending on
 * current state. Toggles the complete level.
 */
function CompleteLevelCheck(state,boxes,level)
{
	// Update Li and checkboxes status
	if ( state.checked )
	{
		for (i=0;i<boxes.length;i++)
		{
			boxes[i].checked = true;
			boxes[i].disabled = true; 
		}
		for (i=0;i<ConsScaleMatrix[level].length;i++)
		{
			ConsScaleMatrix[level][i] = 1;
		}			
		Li[level] = 1.0;
		LevelComplete[level] = true;
	}
	else
	{
		for (i=0;i<boxes.length;i++)
		{
			boxes[i].checked = false;
			boxes[i].disabled = false;
		}		
		for (i=0;i<ConsScaleMatrix[level].length;i++)
		{
			ConsScaleMatrix[level][i] = 0;
		}	
		Li[level] = 0.0;
		LevelComplete[level] = false; 
	}
	
	// Calculate ConsScale
	CalculateScale();
	
	// Update results
	DisplayResultsLevel(level);
	DisplayResults();
}


/*
 * Annotates the state of the architecture components flags.
 */
function ArchCheck(state,flagID)
{
	if ( state.checked )
	{
		Arq_Flag[flagID] = true;
	}
	else
	{
		Arq_Flag[flagID] = false;
	}
	
	
	
	// Calculate ConsScale
	CalculateScale();
	
	// Update results
	DisplayResults();
}


/*
 * Annotates the CS in the corresponding level and
 * triggers the calculation of the corresponding Li
 */
function LevelCheck(state,level,csnumber)
{
	// Set the calculanting message
	LevelResults[level].innerHTML = "Calculating...";

	// Update ConsScale Matrix with the last user check/uncheck
	if ( state.checked )
	{		
		ConsScaleMatrix[level][csnumber] = 1;		
	}
	else
	{
		ConsScaleMatrix[level][csnumber] = 0;		
	}

	// Calculate the new Li
	Li[level] = CalculateLi(level);
	
	// Update level complete flag
	if (Li[level] == 1.0)
	{
		LevelComplete[level] = true;
	}
	else
	{
		LevelComplete[level] = false;
	}

	// Calculate ConsScale
	CalculateScale();
	
	// Update results
	DisplayResultsLevel(level);
	DisplayResults();

}

/*
 * Displays the ConsScale results in the results panel and the
 * Li corresponding to the specified level
 */
function DisplayResultsLevel(level)
{
	// Display the new corresponding Li
	LevelResults[level].innerHTML = String(Li[level]);

}


/*
 * Displays the ConsScale results in the results panel 
 */
function DisplayResults()
{
	// Display the new resulting CLS (rounded to 8 decimals)
	CONSSCALE_cls.innerHTML = roundNumber(CLS, 8);

	// Display the new CQS
	CONSSCALE_cqs.innerHTML = roundNumber(CQS, 2);

	// Display ConsScale Level String
	if ( Q_level < 0 )
	{
		CONSSCALE_level.innerHTML = FloorLevel;
		CONSSCALE_image.innerHTML = LevelImageFloor;
	}
	else
	{
		CONSSCALE_level.innerHTML = LevelName[Q_level];
		CONSSCALE_image.innerHTML = LevelImage[Q_level];
	}
	
	// Display ConsScale max. arch. level
	if ( A_level < 0 )
	{
		CONSSCALE_alevel.innerHTML = FloorLevel;
	}
	else
	{
		CONSSCALE_alevel.innerHTML = LevelName[A_level];
	}
	
	// Display remarks
	CONSSCALE_remarks.innerHTML = curRemarks;
	
	// Display the associated radar graph
	CONSSCALE_graph.innerHTML = "Processing...";
	CONSSCALE_graph.innerHTML = MakeGraph(getSelectedChartType(document.rform.chartType));
}

/*
 * Calculates the CLS and the CQS
 */
function CalculateScale()
{
	// Calculate the new CLS taking into account last change in Li.
	CLS = CalculateCLS();

	// Calculate the new CQS
	CQS = CalculateCQS();	
	
	// Calculate the architectural level
	A_level = CalculateArchLevel();
	
	// Calculate the qualitative level taking into account arch. level
	Q_level = CalculateQLevel(A_level);
}


/*
 * Calculates the value of the CQS based on current value of CLS
 */
function CalculateCQS()
{
	return (Math.exp(Math.pow(CLS,5)/K)+a)/10;
}


/*
 * Calculates the max. ConsScale level possible with current arch. setting
 */
function CalculateArchLevel()
{
	// Check architectural compliance
	var max_compliance = 11;
	var complying = false;
	while (!complying && max_compliance>-1)
	{
		complying = ArchComply(max_compliance);
		if ( !complying )
		{
			max_compliance--;
		}
	}
	
	// These two lower levels depends only on architecture
	if ( max_compliance >= 0 )
	{
		LevelComplete[0] = true;  // Isolated
	}
	if ( max_compliance >= 1 )
	{
		LevelComplete[1] = true;  // Decontrolled
	}
	
	return max_compliance;
}


/*
 * Calculates the ConsScale qualitative level based on CQS and architectural components.
 */
function CalculateQLevel(alevel)
{		
	var cqs = roundNumber(CQS,2);
	
	// Maximum qualitative level
	var maxqlevel; 
	
	if (cqs >= Thres[11])
	{		
		maxqlevel = 11;
	}
	else if ( cqs >= Thres[10])
	{
		maxqlevel = 10;
	}
	else if ( cqs >= Thres[9])
	{
		maxqlevel = 9;
	}
	else if ( cqs >= Thres[8])
	{
		maxqlevel = 8;
	}
	else if ( cqs >= Thres[7])
	{
		maxqlevel = 7;
	}
	else if ( cqs >= Thres[6])
	{
		maxqlevel = 6;
	}
	else if ( cqs >= Thres[5])
	{
		maxqlevel = 5;
	}
	else if ( cqs >= Thres[4])
	{
		maxqlevel = 4;
	}
	else if ( cqs >= Thres[3])
	{
		maxqlevel = 3;
	}
	else if ( cqs >= Thres[2])
	{
		maxqlevel = 2;
	}
	else
	{
		if ( alevel >= 1 )
		{
			maxqlevel = 1; // Decontrolled
		}
		else
		{
			maxqlevel = 0; // Isolated
		}
	}	
	
	// Check whether all lower levels are completed
	var AllLowerCompleted = true;
	var min = 2;
	while (AllLowerCompleted && min<=maxqlevel)
	{
		if (!LevelComplete[min])
		{
			AllLowerCompleted = false;			
		}
		else
		{
			min++;
		}
	}
	
	if ( AllLowerCompleted ) 
	{	
		if ( maxqlevel == alevel )
		{
			curRemarks = " ";
			return maxqlevel;
		}
		else if ( maxqlevel > alevel )
		{		
			curRemarks = "Could reach level " + maxqlevel + " adding architectural components.";
			return alevel;
		}
		else
		{
			curRemarks = "Potential arch. level: " + alevel;
			return maxqlevel;
		}
	}
	else
	{
		curRemarks = "Could not reach level " + maxqlevel + " because not all lower levels are completed.";
		return (min-1);
	}
}

	

/*
 * Indicates whether or not current architectural components comply with the parameter level
 */
function ArchComply(level)
{
	// Check all necessary arch. components exist.
	var complies = true;
	var i = 0;
	while (complies && i<Ar_Requirements[level].length)
	{
		if ( !Arq_Flag[Ar_Requirements[level][i++]] )
		{
			complies = false;
		}
	}
	return complies;	
}


/*
 * Calculates the value of CLS based on current values of Li.
 */
function CalculateCLS()
{
	var sum_cls = 0.0;
	var sum_element = 0.0;

	// Main Summation (starts at level 2)
	for (i=2;i<TopLevel+1;i++)
	{
		sum_element = Li[i] / (i-1);
		sum_cls = sum_cls + (sum_element*sum_element);		
	}

	return sum_cls;
}


/*
 * Calculates the value of Li for the indicated level
 * using current state of ConsScale CS matrix
 */
function CalculateLi(level)
{
	// Count number of CS fulfilled in level i
	var ncsf = 0;
	for (i=0;i<Ji[level]+1;i++)
	{
		if (ConsScaleMatrix[level][i] == 1)
		{
			ncsf++;
		}
	}
	
	// Only if ncsf is greater than 0 the Li equation has to be computed
	if ( ncsf == 0 )
	{
		return 0.0;
	}
	else
	{
		// Upper part of the Li equation
		var upper_eq = ncsf+(J-Ji[level]);
		upper_eq = upper_eq*upper_eq*upper_eq;

		// return upper_eq / 1000;  // This was valid only for J=10 (10^3) in version 2.x).
		
		return upper_eq / (J*J*J);
	}
}


/*
 * Rounds a float to the specified number of decimal digits.
 */
function roundNumber(num, dec) 
{
	var result = Math.round( Math.round( num * Math.pow( 10, dec + 1 ) ) / Math.pow( 10, 1 ) ) / Math.pow(10,dec);
	return result;
}


/*
 * Fill the ConsScale state of a perfect Adaptive Agent
 * This state is merged with the former state, i.e. other CS's persists.
 */
function FillAdaptive()
{
	
	// Architecture components of an Adaptive Agent
	for (i=0;i<6;i++)
	{
		Arq_Flag[i] = true; // B,S,A,R,M
	}
	for (i=0;i<document.scaleform.ArchitectureBoxA.length;i++)
	{
		document.scaleform.ArchitectureBoxA[i].checked = true; 
	}
	
	for (i=6;i<14;i++)
	{
		Arq_Flag[i] = false;
	}
	for (i=0;i<document.scaleform.ArchitectureBox.length;i++)
	{
		document.scaleform.ArchitectureBox[i].checked = false; 
	}	
	
	
	// Fill levels 2 and 3 in the matrix
	for (i=2;i<4;i++)
	{
		for (k=1;k<ConsScaleMatrix[i].length;k++)
		{
			ConsScaleMatrix[i][k] = 1;
		}
	}
	
	for (i=4;i<TopLevel+1;i++)
	{
		for (k=1;k<ConsScaleMatrix[i].length;k++)
		{
			ConsScaleMatrix[i][k] = 0;
		}
	}
	
	
	
	// Fill the corresponding checkboxes
	document.scaleform.Level2Box.checked = true; 
	for (i=0;i<document.scaleform.Level3Box.length;i++)
	{
		document.scaleform.Level3Box[i].checked = true; 
		document.scaleform.Level3Box[i].disabled = true; 
	}
	document.scaleform.Level3AllBox.checked = true;
	
	for (i=0;i<document.scaleform.Level4Box.length;i++)
	{
		document.scaleform.Level4Box[i].checked = false; 
	}
	for (i=0;i<document.scaleform.Level5Box.length;i++)
	{
		document.scaleform.Level5Box[i].checked = false; 
	}
	for (i=0;i<document.scaleform.Level6Box.length;i++)
	{
		document.scaleform.Level6Box[i].checked = false; 
	}		
	for (i=0;i<document.scaleform.Level7Box.length;i++)
	{
		document.scaleform.Level7Box[i].checked = false; 
	}
	for (i=0;i<document.scaleform.Level8Box.length;i++)
	{
		document.scaleform.Level8Box[i].checked = false; 
	}
	for (i=0;i<document.scaleform.Level9Box.length;i++)
	{
		document.scaleform.Level9Box[i].checked = false; 
	}
	for (i=0;i<document.scaleform.Level10Box.length;i++)
	{
		document.scaleform.Level10Box[i].checked = false; 
	}
	for (i=0;i<document.scaleform.Level11Box.length;i++)
	{
		document.scaleform.Level11Box[i].checked = false; 
	}
	document.scaleform.Level4AllBox.checked = false;
	document.scaleform.Level5AllBox.checked = false;
	document.scaleform.Level6AllBox.checked = false;
	document.scaleform.Level7AllBox.checked = false;
	document.scaleform.Level8AllBox.checked = false;
	document.scaleform.Level9AllBox.checked = false;
	document.scaleform.Level10AllBox.checked = false;
	

	// Calculate the new Lis
	for (idx=2;idx<TopLevel+1;idx++)
	{
		Li[idx] = CalculateLi(idx);
	
		// Update level complete flag
		if (Li[idx] == 1.0)
		{
			LevelComplete[i] = true;
		}
		else
		{
			LevelComplete[i] = false;
		}
	}
	
	// Calculate ConsScale
	CalculateScale();
	
	// Update results
	curRemarks = "Pure adaptive agent set";
	for (i=2;i<TopLevel+1;i++)
	{
		DisplayResultsLevel(i);
	}
	DisplayResults();
	
}


/*
 * Reset the scale calculation
 */
function ResetAll()
{	
	
	window.location.reload();
	
	// Reset all checkboxes
	for (i=0;i<document.scaleform.ArchitectureBoxA.length;i++)
	{
		document.scaleform.ArchitectureBoxA[i].checked = false; 
	}	
	for (i=0;i<document.scaleform.ArchitectureBox.length;i++)
	{
		document.scaleform.ArchitectureBox[i].checked = false; 
	}	
	document.scaleform.Level2Box.checked = false; 
	for (i=0;i<document.scaleform.Level3Box.length;i++)
	{
		document.scaleform.Level3Box[i].checked = false; 
	}
	for (i=0;i<document.scaleform.Level4Box.length;i++)
	{
		document.scaleform.Level4Box[i].checked = false; 
	}
	for (i=0;i<document.scaleform.Level5Box.length;i++)
	{
		document.scaleform.Level5Box[i].checked = false; 
	}
	for (i=0;i<document.scaleform.Level6Box.length;i++)
	{
		document.scaleform.Level6Box[i].checked = false; 
	}		
	for (i=0;i<document.scaleform.Level7Box.length;i++)
	{
		document.scaleform.Level7Box[i].checked = false; 
	}
	for (i=0;i<document.scaleform.Level8Box.length;i++)
	{
		document.scaleform.Level8Box[i].checked = false; 
	}
	for (i=0;i<document.scaleform.Level9Box.length;i++)
	{
		document.scaleform.Level9Box[i].checked = false; 
	}
	for (i=0;i<document.scaleform.Level10Box.length;i++)
	{
		document.scaleform.Level10Box[i].checked = false; 
	}
	for (i=0;i<document.scaleform.Level11Box.length;i++)
	{
		document.scaleform.Level11Box[i].checked = false; 
	}
	document.scaleform.Level3AllBox.checked = false;
	document.scaleform.Level4AllBox.checked = false;
	document.scaleform.Level5AllBox.checked = false;
	document.scaleform.Level6AllBox.checked = false;
	document.scaleform.Level7AllBox.checked = false;
	document.scaleform.Level8AllBox.checked = false;
	document.scaleform.Level9AllBox.checked = false;
	document.scaleform.Level10AllBox.checked = false;
	
	// Init all data
	InitConsScale();
	
	// Update resutls	
	curRemarks = "Data cleared.";
	for (i=2;i<12;i++)
	{
		DisplayResultsLevel(i);		
	}	
	DisplayResults();
	
		
}

/*
 * Inicialize the ConsScale calculator.
 * Get the HTML tags for showing the results when they are calculated.
 * Initialise the ConsScale CS matrix.
 */
function InitConsScale()
{
	// Initialise Architecture component indexes 
	Arq_B = 0; 		// Body
	Arq_Sproprio = 1; 	// Proprioceptive sensors
	Arq_Sext = 2; 		// Exteroceptive sensors
	Arq_A = 3;		// Actuators
	Arq_R = 4;		// Sensorimotor coordination
	Arq_M = 5; 		// Memory
	Arq_Mn = 6; 		// Multiple context
	Arq_Att = 7; 		// Attention
	Arq_SsA = 8;		// Self-status assessment
	Arq_I = 9;		// Self
	Arq_O = 10;		// Others
	Arq_AR = 11;		// Accurate report
	Arq_AVR = 12;		// Accurate verbal report
	Arq_Rn = 13;		// Several streams	
	
	Arq_Flag = new Array(14);
	for (i=0;i<14;i++)
	{
		Arq_Flag[i] = false;
	}
	
	// Initialize ConsScale matrices

	// Max number of levels
	TopLevel = 11;
	
	// Level names
	FloorLevel = "(-1) Disembodied";
	LevelName = new Array(TopLevel+1);
	LevelName[0] = "(0) Isolated"; 
	LevelName[1] = "(1) Decontrolled";
	LevelName[2] = "(2) Reactive";
	LevelName[3] = "(3) Adaptive";
	LevelName[4] = "(4) Attentional";
	LevelName[5] = "(5) Executive";
	LevelName[6] = "(6) Emotional";
	LevelName[7] = "(7) Self-Conscious";
	LevelName[8] = "(8) Empathic";
	LevelName[9] = "(9) Social";
	LevelName[10] = "(10) Human-Like";
	LevelName[11] = "(11) Super-Conscious";

	// Level i quantitative scores
	Li = new Array(TopLevel+1);

	// Initialize quantitative scores
	for (i=0;i<TopLevel+1;i++)
	{
		Li[i] = 0.0;
	}

	// Initialise Cummulative Levels Score
	CLS = 0.0;

	// Initialise ConsScale Quantitative Score
	CQS = 0.0;
	
	// Initialise ConsScale Qualitative level
	Q_level = -1;
	
	// Initialise ConsScale maximun architectural level
	A_level = -1; 
		
	// Level images
	LevelImage = new Array(TopLevel+1);
	LevelImageFloor = "<img src='csm1.jpg'>";
	LevelImage[0] = "<img src='cs0.jpg'>";
	LevelImage[1] = "<img src='cs1.jpg'>";
	LevelImage[2] = "<img src='cs2.jpg'>";
	LevelImage[3] = "<img src='cs3.jpg'>";
	LevelImage[4] = "<img src='cs4.jpg'>";
	LevelImage[5] = "<img src='cs5.jpg'>";
	LevelImage[6] = "<img src='cs6.jpg'>";
	LevelImage[7] = "<img src='cs7.jpg'>";
	LevelImage[8] = "<img src='cs8.jpg'>";
	LevelImage[9] = "<img src='cs9.jpg'>";
	LevelImage[10] = "<img src='cs10.jpg'>";
	LevelImage[11] = "<img src='cs11.jpg'>";
	
	
	// Image
	CONSSCALE_image = LevelImageFloor;

	// ConsScale Architectural requirements
	Ar_Requirements = new Array(TopLevel+1);
	for (i=0;i<TopLevel+1;i++)
	
	// Requirements for level 0: B
	Ar_Requirements[0] = new Array(1);
	Ar_Requirements[0][0] = Arq_B; 
	
	// Requirements for level 1: B, Sext, A
	Ar_Requirements[1] = new Array(3);
	Ar_Requirements[1][0] = Arq_B; 
	Ar_Requirements[1][1] = Arq_Sext; 
	Ar_Requirements[1][2] = Arq_A; 

	// Requirements for level 2: B, Sext, A, R
	Ar_Requirements[2] = new Array(4);
	Ar_Requirements[2][0] = Arq_B; 
	Ar_Requirements[2][1] = Arq_Sext; 
	Ar_Requirements[2][2] = Arq_A; 	
	Ar_Requirements[2][3] = Arq_R; 	
		
	// Requirements for level 3: B, Sext, Spropio, A, R, M
	Ar_Requirements[3] = new Array(6);
	Ar_Requirements[3][0] = Arq_B; 
	Ar_Requirements[3][1] = Arq_Sext; 
	Ar_Requirements[3][2] = Arq_Sproprio; 
	Ar_Requirements[3][3] = Arq_A; 	
	Ar_Requirements[3][4] = Arq_R; 	
	Ar_Requirements[3][5] = Arq_M; 	
		
	// Requirements for level 4: B, Sext, Spropio, A, R, M, Att
	Ar_Requirements[4] = new Array(7);
	Ar_Requirements[4][0] = Arq_B; 
	Ar_Requirements[4][1] = Arq_Sext; 
	Ar_Requirements[4][2] = Arq_Sproprio; 
	Ar_Requirements[4][3] = Arq_A; 	
	Ar_Requirements[4][4] = Arq_R; 	
	Ar_Requirements[4][5] = Arq_M; 	
	Ar_Requirements[4][6] = Arq_Att; 	
	
	// Requirements for level 5: B, Sext, Sproprio, A, R, M, Mn, Att
	Ar_Requirements[5] = new Array(8);
	Ar_Requirements[5][0] = Arq_B; 
	Ar_Requirements[5][1] = Arq_Sext; 
	Ar_Requirements[5][2] = Arq_Sproprio; 
	Ar_Requirements[5][3] = Arq_A; 	
	Ar_Requirements[5][4] = Arq_R; 	
	Ar_Requirements[5][5] = Arq_M; 	
	Ar_Requirements[5][6] = Arq_Att; 		
	Ar_Requirements[5][7] = Arq_Mn;
	
	// Requirements for level 6: B, Sext, Sproprio, A, R, M, Mn, Att, SsA
	Ar_Requirements[6] = new Array(9);
	Ar_Requirements[6][0] = Arq_B; 
	Ar_Requirements[6][1] = Arq_Sext; 
	Ar_Requirements[6][2] = Arq_Sproprio; 
	Ar_Requirements[6][3] = Arq_A; 	
	Ar_Requirements[6][4] = Arq_R; 	
	Ar_Requirements[6][5] = Arq_M; 	
	Ar_Requirements[6][6] = Arq_Att; 		
	Ar_Requirements[6][7] = Arq_Mn;
	Ar_Requirements[6][8] = Arq_SsA;

	// Requirements for level 7: B, Sext, Sproprio, A, R, M, Mn, Att, SsA, I
	Ar_Requirements[7] = new Array(10);
	Ar_Requirements[7][0] = Arq_B; 
	Ar_Requirements[7][1] = Arq_Sext; 
	Ar_Requirements[7][2] = Arq_Sproprio; 
	Ar_Requirements[7][3] = Arq_A; 	
	Ar_Requirements[7][4] = Arq_R; 	
	Ar_Requirements[7][5] = Arq_M; 	
	Ar_Requirements[7][6] = Arq_Att; 		
	Ar_Requirements[7][7] = Arq_Mn;
	Ar_Requirements[7][8] = Arq_SsA;	
	Ar_Requirements[7][9] = Arq_I;
	
	// Requirements for level 8: B, Sext, Sproprio, A, R, M, Mn, Att, SsA, I, O
	Ar_Requirements[8] = new Array(11);
	Ar_Requirements[8][0] = Arq_B; 
	Ar_Requirements[8][1] = Arq_Sext; 
	Ar_Requirements[8][2] = Arq_Sproprio; 
	Ar_Requirements[8][3] = Arq_A; 	
	Ar_Requirements[8][4] = Arq_R; 	
	Ar_Requirements[8][5] = Arq_M; 	
	Ar_Requirements[8][6] = Arq_Att; 		
	Ar_Requirements[8][7] = Arq_Mn;
	Ar_Requirements[8][8] = Arq_SsA;	
	Ar_Requirements[8][9] = Arq_I;		
	Ar_Requirements[8][10] = Arq_O;

	// Requirements for level 9: B, Sext, Sproprio, A, R, M, Mn, Att, SsA, I, O, AR
	Ar_Requirements[9] = new Array(12);
	Ar_Requirements[9][0] = Arq_B; 
	Ar_Requirements[9][1] = Arq_Sext; 
	Ar_Requirements[9][2] = Arq_Sproprio; 
	Ar_Requirements[9][3] = Arq_A; 	
	Ar_Requirements[9][4] = Arq_R; 	
	Ar_Requirements[9][5] = Arq_M; 	
	Ar_Requirements[9][6] = Arq_Att; 		
	Ar_Requirements[9][7] = Arq_Mn;
	Ar_Requirements[9][8] = Arq_SsA;	
	Ar_Requirements[9][9] = Arq_I;		
	Ar_Requirements[9][10] = Arq_O;
	Ar_Requirements[9][11] = Arq_AR;

	// Requirements for level 10: B, Sext, Sproprio, A, R, M, Mn, Att, SsA, I, O, AR, AVR
	Ar_Requirements[10] = new Array(13);
	Ar_Requirements[10][0] = Arq_B; 
	Ar_Requirements[10][1] = Arq_Sext; 
	Ar_Requirements[10][2] = Arq_Sproprio; 
	Ar_Requirements[10][3] = Arq_A; 	
	Ar_Requirements[10][4] = Arq_R; 	
	Ar_Requirements[10][5] = Arq_M; 	
	Ar_Requirements[10][6] = Arq_Att; 		
	Ar_Requirements[10][7] = Arq_Mn;
	Ar_Requirements[10][8] = Arq_SsA;	
	Ar_Requirements[10][9] = Arq_I;		
	Ar_Requirements[10][10] = Arq_O;
	Ar_Requirements[10][11] = Arq_AR;
	Ar_Requirements[10][12] = Arq_AVR;
	
	// Requirements for level 11: B, Sext, Sproprio, A, R, M, Mn, Att, SsA, I, O, AR, AVR, Rn
	Ar_Requirements[11] = new Array(14);
	Ar_Requirements[11][0] = Arq_B; 
	Ar_Requirements[11][1] = Arq_Sext; 
	Ar_Requirements[11][2] = Arq_Sproprio; 
	Ar_Requirements[11][3] = Arq_A; 	
	Ar_Requirements[11][4] = Arq_R; 	
	Ar_Requirements[11][5] = Arq_M; 	
	Ar_Requirements[11][6] = Arq_Att; 		
	Ar_Requirements[11][7] = Arq_Mn;
	Ar_Requirements[11][8] = Arq_SsA;	
	Ar_Requirements[11][9] = Arq_I;		
	Ar_Requirements[11][10] = Arq_O;
	Ar_Requirements[11][11] = Arq_AR;
	Ar_Requirements[11][12] = Arq_AVR;	
	Ar_Requirements[11][13] = Arq_Rn;
	

	// Initialise ConsScale V2 constants
	K = 0.97062765;
	a = -1;

	// Max number of cognitive skills considered for any level
	J = 8;  //changed in version 3.0 from 10 to 8.

	// Max number of CS per level in ConsScale V2 (Changed in version 3.0)
	Ji = new Array(TopLevel+1);
	Ji[0] = 0; 
	Ji[1] = 0;
	Ji[2] = 1;
	Ji[3] = 7;  // formerly 2
	Ji[4] = 5;  // formerly 10
	Ji[5] = 6;  // formerly 5
	Ji[6] = 6;  // formerly 5
	Ji[7] = 8;  // formerly 7
	Ji[8] = 6;  // formerly 5
	Ji[9] = 5;  // formerly 4
	Ji[10] = 3; // formerly 4
	Ji[11]	= 1;

	// ConsScale pre-calculated level thresholds
	Thres = new Array(TopLevel+1);
	Thres[0] = 0.0;
	Thres[1] = 0.0;
	Thres[2] = 0.18;
	Thres[3] = 2.22;
	Thres[4] = 12.21;
	Thres[5] = 41.23;
	Thres[6] = 101.08;
	Thres[7] = 200.03;
	Thres[8] = 341.45;
	Thres[9] = 524.54;
	Thres[10] = 745.74;
	Thres[11] = 1000.0;

	// Complete levels flags
	LevelComplete = new Array(TopLevel+1);
	for (i=0;i<TopLevel+1;i++)
	{
		LevelComplete[i] = false;
	}

	// ConsScale levels (0 to 11)
	ConsScaleMatrix = new Array(TopLevel+1);

	// All levels initialisation to 0
	for (i=0;i<TopLevel+1;i++)
	{
		ConsScaleMatrix[i] = new Array(Ji[i]+1);
		for (k=0;k<Ji[i]+1;k++)
		{
			ConsScaleMatrix[i][k] = 0;
		}
	}
	
	// Current remarks
	curRemarks = "&nbsp;";

	// Get the IDs of the HTML objects being referenced.
	getHTMLIDs();	
}


/*
 * Inicialise the ConsScale calculator specifically for the FPS Bots problem domain.
 * Get the HTML tags for showing the results when they are calculated.
 * Initialise the ConsScale CS matrix.
 */
function InitConsScaleForFPS()
{
	InitConsScale();
	Arq_Flag[Arq_B] = true; 
}


/*
 * Get the IDs of the HTML elements that are used to show
 * the results of the calculation in the ConsScale calculator page
 */
function getHTMLIDs()
{
	// HTML tags for Li partial resutls
	LevelResults = new Array(TopLevel+1);

	LevelResults[0] = GetHTMLTag("L0");
	LevelResults[1] = GetHTMLTag("L1");
	LevelResults[2] = GetHTMLTag("L2");
	LevelResults[3] = GetHTMLTag("L3");
	LevelResults[4] = GetHTMLTag("L4");
	LevelResults[5] = GetHTMLTag("L5");
	LevelResults[6] = GetHTMLTag("L6");
	LevelResults[7] = GetHTMLTag("L7");
	LevelResults[8] = GetHTMLTag("L8");
	LevelResults[9] = GetHTMLTag("L9");
	LevelResults[10] = GetHTMLTag("L10");
	LevelResults[11] = GetHTMLTag("L11");

	// HTML tag for ConsScale global resutls
	CONSSCALE_level = GetHTMLTag("CONSSCALE_level");
	
	// HTML taf for max. architectural level
	CONSSCALE_alevel = GetHTMLTag("CONSSCALE_alevel");
	
	// ConsScale Quantitative Level Score
	CONSSCALE_cqs = GetHTMLTag("CONSSCALE_cqs");

	// ConsScale Cummulative Levels Score
	CONSSCALE_cls = GetHTMLTag("CONSSCALE_cls");
	
	// Remarks about the calculation
	CONSSCALE_remarks = GetHTMLTag("CONSSCALE_remarks");
	
	// Image
	CONSSCALE_image = GetHTMLTag("CONSSCALE_image");
	
	// Graph
	CONSSCALE_graph = GetHTMLTag("CONSSCALE_graph");

}


/*
 * Get the HTML tag corresponding to the ID passed as parameter.
 * This should work with any browser as it is based on features.
 */
function GetHTMLTag(tag)
{
	if ( document.getElementById )
        {
		return document.getElementById(tag);
	}
	else if ( document.all )
	{
		return document.all[tag];
	}
	else if ( document.layers )
	{
		return document.layers[tag];
	}
}

/*
 * Get the value of the selected radio button.
 */
function getSelectedChartType(ctrl)
{
    for(i=0;i<ctrl.length;i++)
        if(ctrl[i].checked) return ctrl[i].value;
}


/*
 * Creates the URL for the cognitive profile graph using Li values
 */
function MakeGraph(type)
{
	var graph;
	

	// Graph URL beginning
        if (type == "bar")
	{
          graph = '<img src="http://chart.apis.google.com/chart?cht=bvs&chs=189x171&chbh=a&chd=t:';
        }
        else if (type == "barh")
        {
           graph = '<img src="http://chart.apis.google.com/chart?cht=bhs&chs=189x171&chbh=a&chd=t:';
        }
        else if (type == "line")
        {
           graph = '<img src="http://chart.apis.google.com/chart?cht=lc&chs=189x171&chbh=a&chd=t:';
        }        
        else if (type == "cmeter")
        {
           graph = '<img src="http://chart.apis.google.com/chart?cht=gom&chs=189x171&chd=t:';
        }
        else // Radar
        {
          graph = '<img src="http://chart.apis.google.com/chart?cht=r&chs=189x171&chd=t:';
        }
	
	// Populate graph data
	if (type == "cmeter")
	{
		graph = graph + CQS; 	
	}
	if (type == "barh")
	{
		for (i=11;i>1;i--)
		{
			graph = graph + Li[i];
			if ( i > 2 )
			{
				graph = graph + ',';
			}
		}		
	}
	else
	{
		for (i=2;i<12;i++)
		{
			graph = graph + Li[i];
			if ( i < 11 )
			{
				graph = graph + ',';
			}
		}
	}
	
	// Graph URL ending
	if ( type == "bar")
	{
	   graph = graph + '&chds=0,1&chco=FF0000&chxt=x,y&chxr=1,0.0,1.0&chxl=0:|L2|L3|L4|L5|L6|L7|L8|L9|L10|L11&chm=B,FF000060,0,1.0,5.0" alt="ConsScale Cognitive Profile Chart" />'
	}
	else if (type == "barh")
	{
	   graph = graph + '&chds=0,1&chco=FF0000&chxt=y,x&chxr=1,0.0,1.0&chxl=0:|L2|L3|L4|L5|L6|L7|L8|L9|L10|L11&chm=B,FF000060,0,1.0,5.0" alt="ConsScale Cognitive Profile Chart" />'
	}
	else if (type == "line")
	{
	   graph = graph + '&chds=0,1&chco=FF0000&chxt=x,y&chxr=1,0.0,1.0&chxl=0:|L2|L3|L4|L5|L6|L7|L8|L9|L10|L11&chm=B,FF000060,0,1.0,5.0" alt="ConsScale Cognitive Profile Chart" />'
	}	
	else if (type == "cmeter")
	{
	   graph = graph + '&chtt=Consciousness-meter&chds=0.0,1000.0&chco=8888AA,FF0000&chxt=x,y&chxl=0:|'
	   graph = graph + LevelName[Q_level];
	   graph = graph + '|1:|Reactive|Human-Like&chm=B,FF000060,0,1.0,5.0" alt="ConsScale Cognitive Profile Chart" />'		
	}
	else
	{
	   graph = graph + '&chds=0.0,1.0&chco=FF0000&chls=2.0,4.0,0.0&chxt=x&chxl=0:|L2|L3|L4|L5|L6|L7|L8|L9|L10&chxr=0,0.0,360.0&chm=B,FF000060,0,1.0,5.0" alt="ConsScale Cognitive Profile Chart" />'
	}
	
	return graph;
	
}





/*
 * Generates a report with the current state of rating
 */
function GenerateReport(version)
{
		
	// Create a new document for the report
	w = window.open("","ConsScale_Calculator_Report","left=100,top=0,scrollbars=yes,resizable=yes,location=yes,status=yes,menubar=yes");
	if ( screen.availWidth < 800+100 )
	{
		w.resizeTo(screen.availWidth,screen.availHeight);
	}
	else
	{
		w.resizeTo(800,screen.availHeight);
	}
  	var reportDoc = w.document.open("text/html","replace");
  
  	// Timestamp
  	today = new Date();
  	  	
  	// Fill the report
        var reportText = '<html><head><link rel="stylesheet" type="text/css" href="csstyle.css" /></head><body><h1 class="FontDarkBlue">Report generated by <i>ConsScale</i> Calculator</h1>';
        
        reportText += "<form><input type=button name=print value='Print' onClick='javascript:window.print()'><input type=button name=save value='Save' onClick='javascript:document.execCommand(\"SaveAs\",true,\"ConsScale_report.html\")'><input type=button name=copy value='Copy HTML' onClick='window.clipboardData.setData(\"Text\", document.getElementById(\"tabla\").innerHTML);'><input type=button name=close value='Close Window' onClick='javascript:window.close()'></form>"; 
        reportText += "<table><tr><td class='footer'>(Use [File - Save as] to save this report including images)</td></tr></table><hr>";        
        
        reportText += "<div id='tabla'><p><b>Report generated:</b> " + today.toString(); 
        
        reportText += "<br><b>Name of agent:</b> " + document.getElementById('ImpName').value;

        reportText += "<br><b><i>ConsScale</i> Version:</b> " + version + "</p>";
        

  	reportDoc.write(reportText);
	
	reportText = "<p></p><h1>MAIN RESULTS:</h1><table class='ResultsTable'>";

	reportText += "<tr><td><b><i>ConsScale</i> Level:</b></td><td class='BGYellowBorder'>" + CONSSCALE_level.innerHTML  + "</td></tr>";
	reportText += "<tr><td><b>CQS (0-1000):</b></td><td class='BGYellowBorder'><b>" + CONSSCALE_cqs.innerHTML  + "</b></td></tr>";
	reportText += "<tr><td><b>Cognitive Profile:</b></td><td class='BGYellowBorder'><b>" + CONSSCALE_graph.innerHTML  + "</b></td></tr>";

	reportText += "</table>";
	
  	reportDoc.write(reportText);
  	
  	reportText = "<h1>ADDITIONAL RESULTS:</h1>";
  	
  	reportText += "<table class='ResultsTable' width='328'><tr><td><b>Architectural Level:</b></td><td>" + CONSSCALE_level.innerHTML  + "</td></tr>"; 
  	reportText += "<tr><td><b>CLS (0-1.55):</b></td><td>" + CONSSCALE_cls.innerHTML  + "</td></tr>"; 
  	reportText += "<tr><td><b>Comments:</b></td><td>" + CONSSCALE_remarks.innerHTML  + "</td></tr>"; 
  	reportText += "<tr><td><b>CQS Graph:</b></td><td>" + CONSSCALE_image.innerHTML  + "</td></tr>"; 
  	reportText += "</table>";
  	
  	reportDoc.write(reportText);
  	
	reportText = "<h1>AGENT EVALUATION DETAILS:</h1>";
  	
  	ArchComps = ""; 
  	if ( Arq_Flag[Arq_B] )
  	{
  		ArchComps += "B (body) ";
  	}
  	if ( Arq_Flag[Arq_Sproprio] )
  	{
  		ArchComps += "S<sub>proprio</sub> (proprioceptive sensing) ";
  	}
  	if ( Arq_Flag[Arq_Sext] )
  	{
  		ArchComps += "S<sub>ext</sub> (exteroceptive sensing) ";
  	}
  	if ( Arq_Flag[Arq_A] )
  	{
  		ArchComps += "A (action machinery) ";
  	}
  	if ( Arq_Flag[Arq_R] )
  	{
  		ArchComps += "R (sensorimotor coordination) ";
  	}
  	if ( Arq_Flag[Arq_M] )
  	{
  		ArchComps += "M (memory) ";
  	}
  	if ( Arq_Flag[Arq_Mn] )
  	{
  		ArchComps += "M<sub>n</sub> (multiple context memory) ";
  	}
  	if ( Arq_Flag[Arq_Att] )
  	{
  		ArchComps += "Att (attention mechanism) ";
  	}
  	if ( Arq_Flag[Arq_SsA] )
  	{
  		ArchComps += "SsA (self-status assessment) ";
  	}
  	if ( Arq_Flag[Arq_I] )
  	{
  		ArchComps += "I (self model) ";
  	}
  	if ( Arq_Flag[Arq_O] )
  	{
  		ArchComps += "O (other selves model) ";
  	}
  	if ( Arq_Flag[Arq_AR] )
  	{
  		ArchComps += "AR (accurate report) ";
  	}
  	if ( Arq_Flag[Arq_AVR] )
  	{
  		ArchComps += "AVR (accurate verbal report) ";
  	}
  	if ( Arq_Flag[Arq_Rn] )
  	{
  		ArchComps += "Rn (several streams of consciousness) ";
  	}
  	 
  	reportText += "<table class='ResultsTable' width='200'><tr><td><b><i>ConsScale</i> Levels Score:</b></td></tr></table>";   	  
  	reportText += "<table class='ResultsTable' width='200'>";   	  
  	for (i=2;i<12;i++)
  	{
  		reportText += "<tr><td><b>L<sub>" + i + "</sub>:</b></td><td width='80' class='BGYellowBorder'>" + Li[i] + "</td></tr>";
  	}
  	reportText += "</table><br>";
  	  	
  	reportText += "<table class='ResultsTable' width='600'><tr><td><b>Architectural Components:</b></td><td>" + ArchComps  + "</td></tr></table>"; 
  	
  	reportText += "<br><table class='ResultsTable' width='600'><tr><td><b>Behavioral Profiles (BP) fulfilled by the agent:</b></td></tr>"; 
  	  	
  	BPs = "<br>";   	
  	for (i=0;i<TopLevel+1;i++)
	{
 		for (k=1;k<Ji[i]+1;k++)
		{
			if ( ConsScaleMatrix[i][k] == 1)
			{
				BPName = "BP" + i + k;
				BPDesc = " ";
				tag = document.getElementById(BPName);
				if ( tag != null )
				{
					BPDesc = tag.innerHTML;
				}
				BPs += "<b>BP<sub>" + i + "," + k + "</sub></b> -> " + BPDesc + "<br><br>";
			}
		}
	}
	
	reportText += "<tr><td>" + BPs + "</td></tr>";   	  	
	
	
  	reportText += "</table>";   	  	
  	
  	reportText += "</div></body></html>";
  	
  	reportDoc.write(reportText);
  	reportDoc.close();    

}


-->
