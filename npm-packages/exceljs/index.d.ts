declare interface Buffer extends ArrayBuffer { }

export declare enum RelationshipType {
	None = 0,
	OfficeDocument = 1,
	Worksheet = 2,
	CalcChain = 3,
	SharedStrings = 4,
	Styles = 5,
	Theme = 6,
	Hyperlink = 7
}

export declare enum DocumentType {
	Xlsx = 1
}

export const enum PaperSize {
	Legal = 5,
	Executive = 7,
	A4 = 9,
	A5 = 11,
	B5 = 13,
	Envelope_10 = 20,
	Envelope_DL = 27,
	Envelope_C5 = 28,
	Envelope_B5 = 34,
	Envelope_Monarch = 37,
	Double_Japan_Postcard_Rotated = 82,
	K16_197x273_mm = 119,
}

export interface WorksheetViewCommon {
	/**
	 * Sets the worksheet view's orientation to right-to-left, `false` by default
	 */
	rightToLeft: boolean;

	/**
	 * The currently selected cell
	 */
	activeCell: string;

	/**
	 * Shows or hides the ruler in Page Layout, `true` by default
	 */
	showRuler: boolean;

	/**
	 * Shows or hides the row and column headers (e.g. A1, B1 at the top and 1,2,3 on the left,
	 * `true` by default
	 */
	showRowColHeaders: boolean;

	/**
	 * Shows or hides the gridlines (shown for cells where borders have not been defined),
	 * `true` by default
	 */
	showGridLines: boolean;

	/**
	 * 	Percentage zoom to use for the view, `100` by default
	 */
	zoomScale: number;

	/**
	 * 	Normal zoom for the view, `100` by default
	 */
	zoomScaleNormal: number;
}

export interface WorksheetViewNormal {
	/**
	 * Controls the view state
	 */
	state: 'normal';

	/**
	 * Presentation style
	 */
	style: 'pageBreakPreview' | 'pageLayout';
}

export interface WorksheetViewFrozen {
	/**
	 * Where a number of rows and columns to the top and left are frozen in place.
	 * Only the bottom left section will scroll
	 */
	state: 'frozen';

	/**
	 * Presentation style
	 */
	style?: 'pageBreakPreview';

	/**
	 * How many columns to freeze. To freeze rows only, set this to 0 or undefined
	 */
	xSplit?: number;

	/**
	 * How many rows to freeze. To freeze columns only, set this to 0 or undefined
	 */
	ySplit?: number;

	/**
	 * Which cell will be top-left in the bottom-right pane. Note: cannot be a frozen cell.
	 * Defaults to first unfrozen cell
	 */
	topLeftCell?: string;
}

export interface WorksheetViewSplit {
	/**
	 * Where the view is split into 4 sections, each semi-independently scrollable.
	 */
	state: 'split';

	/**
	 * Presentation style
	 */
	style?: 'pageBreakPreview' | 'pageLayout';

	/**
	 * How many points from the left to place the splitter.
	 * To split vertically, set this to 0 or undefined
	 */
	xSplit?: number;

	/**
	 * How many points from the top to place the splitter.
	 * To split horizontally, set this to 0 or undefined
	 */
	ySplit?: number;

	/**
	 * Which cell will be top-left in the bottom-right pane
	 */
	topLeftCell?: string;

	/**
	 * Which pane will be active
	 */
	activePane?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
}

export type WorksheetView =
	& WorksheetViewCommon
	& (WorksheetViewNormal | WorksheetViewFrozen | WorksheetViewSplit);

export interface WorkbookView {
	x: number;
	y: number;
	width: number;
	height: number;
	firstSheet: number;
	activeTab: number;
	visibility: string;
}

export type FillPatterns =
	| 'none' | 'solid'
	| 'darkVertical' | 'darkHorizontal' | 'darkGrid' | 'darkTrellis' | 'darkDown' | 'darkUp'
	| 'lightVertical' | 'lightHorizontal' | 'lightGrid' | 'lightTrellis' | 'lightDown' | 'lightUp'
	| 'darkGray' | 'mediumGray' | 'lightGray' | 'gray125' | 'gray0625';

export interface FillPattern {
	type: 'pattern';
	pattern: FillPatterns;
	fgColor?: Partial<Color>;
	bgColor?: Partial<Color>;
}

export interface GradientStop {
	position: number;
	color: Partial<Color>;
}

export interface FillGradientAngle {
	type: 'gradient';
	gradient: 'angle';

	/**
	 * For 'angle' gradient, specifies the direction of the gradient. 0 is from the left to the right.
	 * Values from 1 - 359 rotates the direction clockwise
	 */
	degree: number;

	/**
	 * Specifies the gradient colour sequence. Is an array of objects containing position and
	 * color starting with position 0 and ending with position 1.
	 * Intermediary positions may be used to specify other colours on the path.
	 */
	stops: GradientStop[];
}

export interface FillGradientPath {
	type: 'gradient';
	gradient: 'path';

	/**
	 * For 'path' gradient. Specifies the relative coordinates for the start of the path.
	 * 'left' and 'top' values range from 0 to 1
	 */
	center: { left: number; top: number };

	/**
	 * Specifies the gradient colour sequence. Is an array of objects containing position and
	 * color starting with position 0 and ending with position 1.
	 * Intermediary positions may be used to specify other colours on the path.
	 */
	stops: GradientStop[];
}

export type Fill = FillPattern | FillGradientAngle | FillGradientPath;

export interface Font {
	name: string;
	size: number;
	family: number;
	scheme: 'minor' | 'major' | 'none';
	charset: number;
	color: Partial<Color>;
	bold: boolean;
	italic: boolean;
	underline: boolean | 'none' | 'single' | 'double' | 'singleAccounting' | 'doubleAccounting';
	vertAlign: 'superscript' | 'subscript';
	strike: boolean;
	outline: boolean;
}

export type BorderStyle =
	| 'thin' | 'dotted' | 'hair' | 'medium' | 'double' | 'thick' | 'dashed' | 'dashDot'
	| 'dashDotDot' | 'slantDashDot' | 'mediumDashed' | 'mediumDashDotDot' | 'mediumDashDot';

export interface Color {
	/**
	 * Hex string for alpha-red-green-blue e.g. FF00FF00
	 */
	argb: string;

	/**
	 * Choose a theme by index
	 */
	theme: number;
}

export interface Border {
	style: BorderStyle;
	color: Partial<Color>;
}

export interface BorderDiagonal extends Border {
	up: boolean;
	down: boolean;
}

export interface Borders {
	top: Partial<Border>;
	left: Partial<Border>;
	bottom: Partial<Border>;
	right: Partial<Border>;
	diagonal: Partial<BorderDiagonal>;
}

export interface Margins {
	top: number;
	left: number;
	bottom: number;
	right: number;
	header: number;
	footer: number;
}

export declare enum ReadingOrder {
	LeftToRight = 1,
	RightToLeft = 2,
}

export interface Alignment {
	horizontal: 'left' | 'center' | 'right' | 'fill' | 'justify' | 'centerContinuous' | 'distributed';
	vertical: 'top' | 'middle' | 'bottom' | 'distributed' | 'justify';
	wrapText: boolean;
	shrinkToFit: boolean;
	indent: number;
	readingOrder: 'rtl' | 'ltr';
	textRotation: number | 'vertical';
}

export interface Protection {
	locked: boolean;
	hidden: boolean;
}

export interface Style {
	numFmt: string;
	font: Partial<Font>;
	alignment: Partial<Alignment>;
	protection: Partial<Protection>;
	border: Partial<Borders>;
	fill: Fill;
}

export type DataValidationOperator =
	| 'between' | 'notBetween' | 'equal' | 'notEqual' | 'greaterThan' | 'lessThan'
	| 'greaterThanOrEqual' | 'lessThanOrEqual';

export interface DataValidation {
	type: 'list' | 'whole' | 'decimal' | 'date' | 'textLength' | 'custom';
	formulae: any[];
	allowBlank?: boolean;
	operator?: DataValidationOperator;
	error?: string;
	errorTitle?: string;
	errorStyle?: string;
	prompt?: string;
	promptTitle?: string;
	showErrorMessage?: boolean;
	showInputMessage?: boolean;
}

export declare enum ErrorValue {
	NotApplicable = '#N/A',
	Ref = '#REF!',
	Name = '#NAME?',
	DivZero = '#DIV/0!',
	Null = '#NULL!',
	Value = '#VALUE!',
	Num = '#NUM!',
}

export interface CellErrorValue {
	error: '#N/A' | '#REF!' | '#NAME?' | '#DIV/0!' | '#NULL!' | '#VALUE!' | '#NUM!';
}

export interface RichText {
	text: string;
	font?: Partial<Font>;
}

export interface CellRichTextValue {
	richText: RichText[];
}

export interface CellHyperlinkValue {
	text: string;
	hyperlink: string;
	tooltip?: string;
}

export interface CellFormulaValue {
	formula: string;
	result?: number | string | boolean | Date | CellErrorValue;
	date1904?: boolean;
}

export interface CellSharedFormulaValue {
	sharedFormula: string;
	readonly formula?: string;
	result?: number | string | boolean | Date | CellErrorValue;
	date1904?: boolean;
}

export declare enum ValueType {
	Null = 0,
	Merge = 1,
	Number = 2,
	String = 3,
	Date = 4,
	Hyperlink = 5,
	Formula = 6,
	SharedString = 7,
	RichText = 8,
	Boolean = 9,
	Error = 10
}

export declare enum FormulaType {
	None = 0,
	Master = 1,
	Shared = 2
}

export type CellValue =
	| null | number | string | boolean | Date | undefined
	| CellErrorValue
	| CellRichTextValue | CellHyperlinkValue
	| CellFormulaValue | CellSharedFormulaValue;


	export interface CommentMargins {
		insetmode: 'auto' | 'custom';
		inset: Number[];
	}

	export interface CommentProtection {
		locked: 'True' | 'False';
		lockText: 'True' | 'False';
	}

	export type CommentEditAs = 'twoCells' | 'oneCells' | 'absolute';

	export interface Comment {
		texts?: RichText[];
		margins?: Partial<CommentMargins>;
		protection?: Partial<CommentProtection>;
		editAs?: CommentEditAs;
	}

export interface CellModel {
	address: Address;
	style: Style;
	type: ValueType;
	text?: string;
	hyperlink?: string;
	value?: CellValue;
	master: string;
	formula?: string;
	sharedFormula?: string;
	result?: string | number | any;
	comment: Comment;
}

export interface Cell extends Style, Address {
	readonly worksheet: Worksheet;
	readonly workbook: Workbook;

	readonly effectiveType: ValueType;
	readonly isMerged: boolean;
	readonly master: Cell;
	readonly isHyperlink: boolean;
	readonly hyperlink: string;	// todo
	readonly text: string;
	readonly fullAddress: {
		sheetName: string;
		address: string;
		row: number;
		col: number;
	};
	model: CellModel;
	/**
	 * Assign (or get) a name for a cell (will overwrite any other names that cell had)
	 */
	name: string;

	/**
	 * Assign (or get) an array of names for a cell (cells can have more than one name)
	 */
	names: string[];

	/**
	 * Cells can define what values are valid or not and provide
	 * prompting to the user to help guide them.
	 */
	dataValidation: DataValidation;

	/**
	 * Value of the cell
	 */
	value: CellValue;

	/**
	 * comment of the cell
	 */
	note: string | Comment;

	/**
	 * convenience getter to access the formula
	 */
	readonly formula: string;

	/**
	 * convenience getter to access the formula result
	 */
	readonly result: number | string | Date;

	/**
	 * The type of the cell's value
	 */
	readonly type: ValueType;

	/**
	 * The type of the cell's formula
	 */
	readonly formulaType: FormulaType;

	/**
	 * The styles of the cell
	 */
	style: Partial<Style>;

	addName(name: string): void;

	/**
	 * Remove a name from a cell
	 */
	removeName(name: string): void;
	removeAllNames(): void;

	destroy(): void;
	toCsvString(): string;
	release(): void;
	addMergeRef(): void;
	releaseMergeRef(): void;
	merge(master: Cell, ignoreStyle?: boolean): void;
	unmerge(): void;
	isMergedTo(master: Cell): boolean;
	toString(): string;
}

export interface RowModel {
	cells: CellModel[];
	number: number;
	min: number;
	max: number;
	height: number;
	style: Partial<Style>;
	hidden: boolean;
	outlineLevel: number;
	collapsed: boolean;
}

export interface Row extends Style {
	readonly worksheet: Worksheet;
	readonly hasValues: boolean;
	readonly dimensions: number;
	model: Partial<RowModel> | null;
	/**
	 * Set a specific row height
	 */
	height: number;

	/**
	 * Make row hidden
	 */
	hidden: boolean;

	/**
	 * Get a row as a sparse array
	 */
	// readonly values: CellValue[];
	values: CellValue[] | { [key: string]: CellValue };

	/**
	 * Set an outline level for rows
	 */
	outlineLevel?: number;

	/**
	 * The row number
	 */
	readonly number: number;

	/**
	 * Indicate the collapsed state based on outlineLevel
	 */
	readonly collapsed: boolean;

	/**
	 * Number of cells including empty ones
	 */
	readonly cellCount: number;

	/**
	 * Number of non-empty cells
	 */
	readonly actualCellCount: number;

	/**
	 * Get cell by number, column letter or column key
	 */
	getCell(indexOrKey: number | string): Cell;

	findCell(colNumber: number): Cell | undefined;

	getCellEx(address: Address): Cell;

	/**
	 * Iterate over all non-null cells in a row
	 */
	eachCell(callback: (cell: Cell, colNumber: number) => void): void;

	/**
	 * Iterate over all cells in a row (including empty cells)
	 */
	eachCell(opt: { includeEmpty: boolean }, callback: (cell: Cell, colNumber: number) => void): void;

	/**
	 * Cut one or more cells (cells to the right are shifted left)
	 *
	 * Note: this operation will not affect other rows
	 */
	splice(start: number, count: number, ...insert: any[]): void;

	/**
	 * Commit a completed row to stream
	 */
	commit(): void;
	destroy(): void;
	addPageBreak(lft?: number, rght?: number): void;
}

export interface Column {
	/**
	 * Can be a string to set one row high header or an array to set multi-row high header
	 */
	header?: string | string[];

	/**
	 * The name of the properties associated with this column in each row
	 */
	key?: string;

	/**
	 * The width of the column
	 */
	width?: number;

	/**
	 * Set an outline level for columns
	 */
	outlineLevel: number;

	/**
	 * Hides the column
	 */
	hidden: boolean;

	/**
	 * Styles applied to the column
	 */
	style: Partial<Style>;

	/**
	 * The cell values in the column
	 */
	values: CellValue;

	/**
	 * Column letter key
	 */
	readonly letter: string;
	readonly number: number;
	readonly worksheet: Worksheet;
	readonly isCustomWidth: boolean;
	readonly headers: string[];
	readonly isDefault: boolean;
	readonly headerCount: number;

	/**
	 * Below properties read from style
	 */
	border?: Partial<Borders>;
	fill?: Fill;
	numFmt?: string;
	font?: Partial<Font>;
	alignment?: Partial<Alignment>;
	protection?: Partial<Protection>;

	toString(): string
	equivalentTo(other: Column): boolean

	/**
	 * indicate the collapsed state based on outlineLevel
	 */
	readonly collapsed: boolean;

	/**
	 * Iterate over all current cells in this column
	 */
	eachCell(callback: (cell: Cell, rowNumber: number) => void): void;

	/**
	 * Iterate over all current cells in this column including empty cells
	 */
	eachCell(opt: { includeEmpty: boolean }, callback: (cell: Cell, rowNumber: number) => void): void;

	defn: any; //todo
}
export interface PageSetup {
	/**
	 * Whitespace on the borders of the page. Units are inches.
	 */
	margins: Margins;

	/**
	 * Orientation of the page - i.e. taller (`'portrait'`) or wider (`'landscape'`).
	 *
	 * `'portrait'` by default
	 */
	orientation: 'portrait' | 'landscape';

	/**
	 * Horizontal Dots per Inch. Default value is 4294967295
	 */
	horizontalDpi: number;

	/**
	 * Vertical Dots per Inch. Default value is 4294967295
	 */
	verticalDpi: number;

	/**
	 * Whether to use fitToWidth and fitToHeight or scale settings.
	 *
	 * Default is based on presence of these settings in the pageSetup object - if both are present,
	 * scale wins (i.e. default will be false)
	 */
	fitToPage: boolean;

	/**
	 * How many pages wide the sheet should print on to. Active when fitToPage is true
	 *
	 * Default is 1
	 */
	fitToWidth: number;

	/**
	 * How many pages high the sheet should print on to. Active when fitToPage is true
	 *
	 * Default is 1
	 */
	fitToHeight: number;

	/**
	 * Percentage value to increase or reduce the size of the print. Active when fitToPage is false
	 *
	 * Default is 100
	 */
	scale: number;

	/**
	 * Which order to print the pages.
	 *
	 * Default is `downThenOver`
	 */
	pageOrder: 'downThenOver' | 'overThenDown';

	/**
	 * Print without colour
	 *
	 * false by default
	 */
	blackAndWhite: boolean;

	/**
	 * Print with less quality (and ink)
	 *
	 * false by default
	 */
	draft: boolean;

	/**
	 * Where to place comments
	 *
	 * Default is `None`
	 */
	cellComments: 'atEnd' | 'asDisplayed' | 'None';

	/**
	 * Where to show errors
	 *
	 * Default is `displayed`
	 */
	errors: 'dash' | 'blank' | 'NA' | 'displayed';

	/**
	 * 	What paper size to use (see below)
	 *
	 * | Name                          | Value       |
	 * | ----------------------------- | ---------   |
	 * | Letter                        | `undefined` |
	 * | Legal                         |  `5`        |
	 * | Executive                     |  `7`        |
	 * | A4                            |  `9`        |
	 * | A5                            |  `11`       |
	 * | B5 (JIS)                      |  `13`       |
	 * | Envelope #10                  |  `20`       |
	 * | Envelope DL                   |  `27`       |
	 * | Envelope C5                   |  `28`       |
	 * | Envelope B5                   |  `34`       |
	 * | Envelope Monarch              |  `37`       |
	 * | Double Japan Postcard Rotated |  `82`       |
	 * | 16K 197x273 mm                |  `119`      |
	 */
	paperSize: PaperSize;

	/**
	 * Whether to show the row numbers and column letters, `false` by default
	 */
	showRowColHeaders: boolean;

	/**
	 * Whether to show grid lines, `false` by default
	 */
	showGridLines: boolean;

	/**
	 * Which number to use for the first page
	 */
	firstPageNumber: number;

	/**
	 * 	Whether to center the sheet data horizontally, `false` by default
	 */
	horizontalCentered: boolean;

	/**
	 * 	Whether to center the sheet data vertically, `false` by default
	 */
	verticalCentered: boolean;

	/**
	 * Set Print Area for a sheet, e.g. `'A1:G20'`
	 */
	printArea: string;

	/**
	 * Repeat specific rows on every printed page, e.g. `'1:3'`
	 */
	printTitlesRow: string;

	/**
	 * Repeat specific columns on every printed page, e.g. `'A:C'`
	 */
	printTitlesColumn: string;
}

export interface HeaderFooter {
	/**
	 * Set the value of differentFirst as true, which indicates that headers/footers for first page are different from the other pages, `false` by default
	 */
	differentFirst: boolean,
	/**
	 * Set the value of differentOddEven as true, which indicates that headers/footers for odd and even pages are different, `false` by default
	 */
	differentOddEven: boolean,
	/**
	 * Set header string for odd pages, could format the string and `null` by default
	 */
	oddHeader: string,
	/**
	 * Set footer string for odd pages, could format the string and `null` by default
	 */
	oddFooter: string,
	/**
	 * Set header string for even pages, could format the string and `null` by default
	 */
	evenHeader: string,
	/**
	 * Set footer string for even pages, could format the string and `null` by default
	 */
	evenFooter: string,
	/**
	 * Set header string for the first page, could format the string and `null` by default
	 */
	firstHeader: string,
	/**
	 * Set footer string for the first page, could format the string and `null` by default
	 */
	firstFooter: string
}

export type AutoFilter = string | {
	from: string | { row: number; column: number };
	to: string | { row: number; column: number };
};

export interface WorksheetProtection {
	objects: boolean;
	scenarios: boolean;
	selectLockedCells: boolean;
	selectUnlockedCells: boolean;
	formatCells: boolean;
	formatColumns: boolean;
	formatRows: boolean;
	insertColumns: boolean;
	insertRows: boolean;
	insertHyperlinks: boolean;
	deleteColumns: boolean;
	deleteRows: boolean;
	sort: boolean;
	autoFilter: boolean;
	pivotTables: boolean;
	spinCount: number;
}
export interface Image {
	extension: 'jpeg' | 'png' | 'gif';
	base64?: string;
	filename?: string;
	buffer?: Buffer;
	/**
	 * Streaming WorkbookWriter only: the image as a readable stream, or a function
	 * returning one. A function is called when the image is written, so images are
	 * read one at a time.
	 */
	stream?: NodeJS.ReadableStream | (() => NodeJS.ReadableStream);
}
export interface IAnchor {
	col: number;
	row: number;
	nativeCol: number;
	nativeRow: number;
	nativeColOff: number;
	nativeRowOff: number;
}
export class Anchor implements IAnchor {
	col: number;
	nativeCol: number;
	nativeColOff: number;
	nativeRow: number;
	nativeRowOff: number;
	row: number;

	private readonly colWidth: number;
	private readonly rowHeight: number;
	worksheet: Worksheet;

	constructor(model?: IAnchor | object);
}
export interface ImageRange {
	tl: Anchor;
	br: Anchor;
}

export interface ImagePosition {
	tl: { col: number; row: number };
	ext: { width: number; height: number };
}

export interface ImageHyperlinkValue {
	hyperlink: string;
	tooltip?: string;
}

export interface Range extends Location {
	sheetName: string;

	tl: string;
	$t$l: string;

	br: string;
	$b$r: string;

	range: string;
	$range: string;

	shortRange: string;
	$shortRange: string;

	count: number;

	decode(): void;
	decode(v: Range): void;
	decode(v: string): void;
	decode(v: Location): void;
	decode(top: number, left: number, bottom: number, right: number, sheetName?: string): void;
	decode(tl: string, br: string, sheetName?: string): void;
	decode(v: [string, string]): void;
	decode(v: [string, string, string]): void;
	decode(v: [number, number, number, number]): void;
	decode(v: [number, number, number, number, string]): void;

	expand(top: number, left: number, bottom: number, right: number): void;

	expandRow(row: Row): void;

	expandToAddress(addressStr: string): void;

	toString(): string;

	intersects(other: Range): boolean;

	contains(addressStr: string): boolean;

	containsEx(address: Partial<{
		sheetName: string;
		row: number;
		col: number;
	}>): boolean;
}

export interface RowBreak {
	id: number;
	max: number;
	min: number;
	man: number;
}

export interface WorksheetModel {
	id: number;
	name: string;
	// dataValidations: this.dataValidations.model,
	properties: WorksheetProperties;
	pageSetup: Partial<PageSetup>;
	headerFooter: Partial<HeaderFooter>;
	rowBreaks: RowBreak[];
	views: WorksheetView[];
	autoFilter: AutoFilter;
	media: Media[];
	merges: Range['range'][];
}
export type WorksheetState = 'visible' | 'hidden' | 'veryHidden';

export type CellIsOperators = 'equal' | 'greaterThan' | 'lessThan' | 'between';

export type ContainsTextOperators = 'containsText' | 'containsBlanks' | 'notContainsBlanks' | 'containsErrors' | 'notContainsErrors';

export type TimePeriodTypes = 'lastWeek' | 'thisWeek' | 'nextWeek' | 'yesterday' | 'today' | 'tomorrow' | 'last7Days' | 'lastMonth'
	| 'thisMonth' | 'nextMonth';

export type IconSetTypes = '5Arrows' | '5ArrowsGray' | '5Boxes' | '5Quarters' | '5Rating' | '4Arrows' | '4ArrowsGray'
	| '4Rating' | '4RedToBlack' | '4TrafficLights' | 'NoIcons' | '3Arrows' | '3ArrowsGray' | '3Flags' | '3Signs'
	| '3Stars' | '3Symbols' | '3Symbols2' | '3TrafficLights1' | '3TrafficLights2' | '3Triangles';

export type CfvoTypes = 'percentile' | 'percent' | 'num' | 'min' | 'max' | 'formula' | 'autoMin' | 'autoMax';

export interface Cvfo {
	type: CfvoTypes;
	value?: number;
}
export interface ConditionalFormattingBaseRule {
	priority: number;
	style?: Partial<Style>;
}
export interface ExpressionRuleType extends ConditionalFormattingBaseRule {
	type: 'expression';
	formulae?: any[];
}

export interface CellIsRuleType extends ConditionalFormattingBaseRule {
	type: 'cellIs';
	formulae?: any[];
	operator?: CellIsOperators;
}

export interface Top10RuleType extends ConditionalFormattingBaseRule {
	type: 'top10';
	rank: number;
	percent: boolean;
	bottom: boolean;
}

export interface AboveAverageRuleType extends ConditionalFormattingBaseRule {
	type: 'aboveAverage';
	aboveAverage: boolean;
}

export interface ColorScaleRuleType extends ConditionalFormattingBaseRule {
	type: 'colorScale';
	cfvo?: Cvfo[];
	color?: Partial<Color>[];
}

export interface IconSetRuleType extends ConditionalFormattingBaseRule {
	type: 'iconSet';
	showValue?: boolean;
	reverse?: boolean;
	custom?: boolean;
	iconSet?: IconSetTypes;
	cfvo?: Cvfo[];
}

export interface ContainsTextRuleType extends ConditionalFormattingBaseRule {
	type: 'containsText';
	operator?: ContainsTextOperators;
	text?: string;
}

export interface TimePeriodRuleType extends ConditionalFormattingBaseRule {
	type: 'timePeriod';
	timePeriod?: TimePeriodTypes;
}

export interface DataBarRuleType extends ConditionalFormattingBaseRule {
	type: 'dataBar';
	gradient?: boolean;
	minLength?: number;
	maxLength?: number;
	showValue?: boolean;
	border?: boolean;
	negativeBarColorSameAsPositive?: boolean;
	negativeBarBorderColorSameAsPositive?: boolean;
	axisPosition?: 'auto' | 'middle' | 'none';
	direction?: 'context' | 'leftToRight' | 'rightToLeft';
	cfvo?: Cvfo[];
}

export type ConditionalFormattingRule = ExpressionRuleType | CellIsRuleType | Top10RuleType | AboveAverageRuleType | ColorScaleRuleType | IconSetRuleType
	| ContainsTextRuleType | TimePeriodRuleType | DataBarRuleType;


export type RowValues = CellValue[] | { [key: string]: CellValue } | undefined | null; 

export interface ConditionalFormattingOptions {
	ref: string;
	rules: ConditionalFormattingRule[];
}

export interface Worksheet {
	readonly id: number;
	name: string;
	readonly workbook: Workbook;
	readonly hasMerges: boolean;

	readonly dimensions: Range;
	/**
	 * Contains information related to how a worksheet is printed
	 */
	pageSetup: Partial<PageSetup>;

	/**
	 * Worksheet Header and Footer
	 */
	headerFooter: Partial<HeaderFooter>;

	/**
	 * Worksheet State
	 */
	state: WorksheetState;

	/**
	 * Worksheet Properties
	 */
	properties: WorksheetProperties;

	/**
	 * Open panes representing the sheet
	 */
	views: Array<Partial<WorksheetView>>;

	/**
	 * Apply an auto filter to your worksheet.
	 */
	autoFilter?: AutoFilter;

	destroy(): void;

	/**
	 * A count of the number of rows that have values. If a mid-document row is empty, it will not be included in the count.
	 */
	readonly actualRowCount: number;

	/**
	 * The total column size of the document. Equal to the maximum cell count from all of the rows
	 */
	readonly columnCount: number;

	/**
	 * Get the last column in a worksheet
	 */
	readonly lastColumn: Column | undefined;

	/**
	 * A count of the number of columns that have values.
	 */
	readonly actualColumnCount: number;

	getColumnKey(key: string): Column;

	setColumnKey(key: string, value: Column): void;

	deleteColumnKey(key: string): void;

	eachColumnKey(callback: (col: Column, index: number) => void): void;

	/**
	 * Access an individual columns by key, letter and 1-based column number
	 */
	getColumn(indexOrKey: number | string): Column;

	/**
	 * Cut one or more columns (columns to the right are shifted left)
	 * and optionally insert more
	 *
	 * If column properties have been defined, they will be cut or moved accordingly
	 *
	 * Known Issue: If a splice causes any merged cells to move, the results may be unpredictable
	 *
	 * Also: If the worksheet has more rows than values in the colulmn inserts,
	 * the rows will still be shifted as if the values existed
	 */
	spliceColumns(start: number, count: number, ...insert: any[][]): void;

	/**
	 * Add column headers and define column keys and widths.
	 *
	 * Note: these column structures are a workbook-building convenience only,
	 * apart from the column width, they will not be fully persisted.
	 */
	columns: Array<Partial<Column>>;

	/**
	 * The total row size of the document. Equal to the row number of the last row that has values.
	 */
	readonly rowCount: number;

	/**
	 * Get the last editable row in a worksheet (or undefined if there are none)
	 */
	readonly lastRow: Row | undefined;

	/**
	 * Tries to find and return row for row no, else undefined
	 * 
	 * @param row The 1-index row number
	 */
	findRow(row: number): Row | undefined;

	/**
	 * Tries to find and return rows for row no start and length, else undefined
	 * 
	 * @param start The 1-index starting row number
	 * @param length The length of the expected array
	 */
	findRows(start: number, length: number): Row[] | undefined;

	/**
	 * Cut one or more rows (rows below are shifted up)
	 * and optionally insert more
	 *
	 * Known Issue: If a splice causes any merged cells to move, the results may be unpredictable
	 */
	spliceRows(start: number, count: number, ...insert: any[][]): void;

	/**
	 * Add a couple of Rows by key-value, after the last current row, using the column keys,
	 * or add a row by contiguous Array (assign to columns A, B & C)
	 */
	addRow(data: any[] | any, style?: string): Row;

	/**
	 * Add multiple rows by providing an array of arrays or key-value pairs
	 */
	addRows(rows: any[], style?: string): Row[];

	/**
	 * Insert a Row by key-value, at the position (shifiting down all rows from position),
	 * using the column keys, or add a row by contiguous Array (assign to columns A, B & C)
	 */
	insertRow(pos: number, value: any[] | any, style?: string): Row;

	/**
	 * Insert multiple rows at position (shifiting down all rows from position)
	 * by providing an array of arrays or key-value pairs
	 */
	insertRows(pos: number, values: any[], style?: string): Row[];

	/**
	 * Duplicate rows and insert new rows
	 */
	duplicateRow(rowNum: number, count: number, insert: boolean): void;

	/**
	 * Get or create row by 1-based index
	 */
	getRow(index: number): Row;

	/**
	 * Get or create rows by 1-based index
	 */
	getRows(start: number, length: number): Row[] | undefined;

	/**
	 * Iterate over all rows that have values in a worksheet
	 */
	eachRow(callback: (row: Row, rowNumber: number) => void): void;

	/**
	 * Iterate over all rows (including empty rows) in a worksheet
	 */
	eachRow(opt: { includeEmpty: boolean }, callback: (row: Row, rowNumber: number) => void): void;

	/**
	 * return all rows as sparse array
	 */
	getSheetValues(): RowValues[];

	/**
	 * returns the cell at [r,c] or address given by r. If not found, return undefined
	 */
	findCell(r: number | string, c: number | string): Cell | undefined;

	/**
	 * Get or create cell
	 */
	getCell(r: number | string, c?: number | string): Cell;

	/**
	 * Merge cells, either:
	 *
	 * tlbr string, e.g. `'A4:B5'`
	 *
	 * tl string, br string, e.g. `'G10', 'H11'`
	 *
	 * t, l, b, r numbers, e.g. `10,11,12,13`
	 */
	mergeCells(): void;
	mergeCells(v: Range): void;
	mergeCells(v: string): void;
	mergeCells(v: Location): void;
	mergeCells(top: number, left: number, bottom: number, right: number, sheetName?: string): void;
	mergeCells(tl: string, br: string, sheetName?: string): void;
	mergeCells(v: [string, string]): void;
	mergeCells(v: [string, string, string]): void;
	mergeCells(v: [number, number, number, number]): void;
	mergeCells(v: [number, number, number, number, string]): void;
	mergeCellsWithoutStyle(): void;
	mergeCellsWithoutStyle(v: Range): void;
	mergeCellsWithoutStyle(v: string): void;
	mergeCellsWithoutStyle(v: Location): void;
	mergeCellsWithoutStyle(top: number, left: number, bottom: number, right: number, sheetName?: string): void;
	mergeCellsWithoutStyle(tl: string, br: string, sheetName?: string): void;
	mergeCellsWithoutStyle(v: [string, string]): void;
	mergeCellsWithoutStyle(v: [string, string, string]): void;
	mergeCellsWithoutStyle(v: [number, number, number, number]): void;
	mergeCellsWithoutStyle(v: [number, number, number, number, string]): void;

	/**
	 * unmerging the cells breaks the style links
	 */
	unMergeCells(): void;
	unMergeCells(v: Range): void;
	unMergeCells(v: string): void;
	unMergeCells(v: Location): void;
	unMergeCells(top: number, left: number, bottom: number, right: number, sheetName?: string): void;
	unMergeCells(tl: string, br: string, sheetName?: string): void;
	unMergeCells(v: [string, string]): void;
	unMergeCells(v: [string, string, string]): void;
	unMergeCells(v: [number, number, number, number]): void;
	unMergeCells(v: [number, number, number, number, string]): void;

	fillFormula(range: Range | string | Location, formula: string, results?: ((r: number, c: number) => string | number) | number[] | number[][]): void;

	/**
	 * Using the image id from `Workbook.addImage`, set the background to the worksheet
	 */
	addBackgroundImage(imageId: number): void;

	getBackgroundImageId(): string;

	/**
	 * Using the image id from `Workbook.addImage`,
	 * embed an image within the worksheet to cover a range
	 */
	addImage(imageId: number, range: string | { editAs?: string; } & ImageRange & { hyperlinks?: ImageHyperlinkValue } | { editAs?: string; } & ImagePosition & { hyperlinks?: ImageHyperlinkValue }): void;

	getImages(): Array<{
		type: 'image',
		imageId: string;
		range: ImageRange;
	}>;

	commit(): void;

	model: WorksheetModel;

	/**
	 * Worksheet protection
	 */
	protect(password: string, options: Partial<WorksheetProtection>): Promise<void>;
	unprotect(): void;

	/**
	 * Add a new table and return a reference to it
	 */
	addTable(tableProperties: TableProperties): Table;
	/**
	 * fetch table by name or id
	 */
	getTable(name: string): Table;
	/**
	 * delete table by name or id
	 */
	removeTable(name: string): void;
	/**
	 *  fetch table
	 */
	getTables(): [Table, void][];
	/**
	 * add conditionalFormattingOptions
	 */
	addConditionalFormatting(cf: ConditionalFormattingOptions): void;

	/**
	 * delete conditionalFormattingOptions
	 */
	removeConditionalFormatting(filter: any): void;
}

export interface CalculationProperties {
	/**
	 * Whether the application shall perform a full recalculation when the workbook is opened
	 */
	fullCalcOnLoad: boolean
}

export interface WorksheetProperties {
	/**
	 * Color of the tab
	 */
	tabColor: Partial<Color>;

	/**
	 * The worksheet column outline level (default: 0)
	 */
	outlineLevelCol: number;

	/**
	 * The worksheet row outline level (default: 0)
	 */
	outlineLevelRow: number;

	/**
 	 * The outline properties which controls how it will summarize rows and columns
   	 */
	outlineProperties: {
		summaryBelow: boolean,
		summaryRight: boolean,
	};
	/**
	 * Default row height (default: 15)
	 */
	defaultRowHeight: number;

	/**
	 * Default column width (optional)
	 */
	defaultColWidth?: number;

	/**
	 * default: 55
	 */
	dyDescent: number;
	showGridLines: boolean;
}

export interface AddWorksheetOptions {
	properties: Partial<WorksheetProperties>;
	pageSetup: Partial<PageSetup>;
	headerFooter: Partial<HeaderFooter>;
	views: Array<Partial<WorksheetView>>;
	state: WorksheetState;
}

export interface WorkbookProperties {
	/**
	 * Set workbook dates to 1904 date system
	 */
	date1904: boolean;
}

export interface JSZipGeneratorOptions {
	/**
	 * @default DEFLATE
	 */
	compression: 'STORE' | 'DEFLATE';
	compressionOptions: null | {
		/**
		 * @default 6
		 */
		level: number;
	};
}

export interface XlsxReadOptions {
	/**
	 * The list of XML node names to ignore while parsing an XLSX file
	 */
	ignoreNodes: string[];
}

export interface XlsxWriteOptions extends stream.xlsx.WorkbookWriterOptions {
	/**
	 * The option passed to JsZip#generateAsync(options)
	 */
	zip: Partial<JSZipGeneratorOptions>;
}

export interface Xlsx {
	/**
	 * read from a file
	 */
	readFile(path: string, options?: Partial<XlsxReadOptions>): Promise<Workbook>;

	/**
	 * read from a stream
	 * @param stream
	 */
	read(stream: import('stream').Stream, options?: Partial<XlsxReadOptions>): Promise<Workbook>;

	/**
	 * load from an array buffer
	 * @param buffer
	 */
	load(buffer: Buffer, options?: Partial<XlsxReadOptions>): Promise<Workbook>;

	/**
	 * write to a buffer
	 */
	writeBuffer(options?: Partial<XlsxWriteOptions>): Promise<Buffer>;

	/**
	 * write to a file
	 */
	writeFile(path: string, options?: Partial<XlsxWriteOptions>): Promise<void>;

	/**
	 * write to a stream
	 */
	write(stream: import('stream').Stream, options?: Partial<XlsxWriteOptions>): Promise<void>;
}

// https://c2fo.github.io/fast-csv/docs/parsing/options

type HeaderArray = (string | undefined | null)[];
type HeaderTransformFunction = (headers: HeaderArray) => HeaderArray;
export interface FastCsvParserOptionsArgs {
	objectMode: boolean;
	delimiter: string;
	quote: string | null;
	escape: string;
	headers: boolean | HeaderTransformFunction | HeaderArray;
	renameHeaders: boolean;
	ignoreEmpty: boolean;
	comment: string;
	strictColumnHandling: boolean;
	discardUnmappedColumns: boolean;
	trim: boolean;
	ltrim: boolean;
	rtrim: boolean;
	encoding: string;
	maxRows: number;
	skipLines: number;
	skipRows: number;
}

interface QuoteColumnMap {
	[s: string]: boolean;
}
declare type QuoteColumns = boolean | boolean[] | QuoteColumnMap;

interface RowMap {
	[key: string]: any;
}
declare type RowHashArray = [string, any][];
declare type RowArray = string[];
declare type Rows = RowArray | RowMap | RowHashArray;
declare type RowTransformCallback = (error?: Error | null, row?: Rows) => void;
interface RowTransformFunction {
	(row: Rows, callback: RowTransformCallback): void;
	(row: Rows): Rows;
}

// https://c2fo.github.io/fast-csv/docs/formatting/options/
export interface FastCsvFormatterOptionsArgs {
	objectMode: boolean;
	delimiter: string;
	rowDelimiter: string;
	quote: string | boolean;
	escape: string;
	quoteColumns: QuoteColumns;
	quoteHeaders: QuoteColumns;
	headers: null | boolean | string[];
	includeEndRowDelimiter: boolean;
	writeBOM: boolean;
	transform: RowTransformFunction;
	alwaysWriteHeaders: boolean;
}

export interface CsvReadOptions {
	dateFormats: string[];
	map(value: any, index: number): any;
	sheetName: string;
	parserOptions: Partial<FastCsvParserOptionsArgs>;
}

export interface CsvWriteOptions {
	dateFormat: string;
	dateUTC: boolean;
	sheetName: string;
	sheetId: number;
	encoding: string;
	map(value: any, index: number): any;
	includeEmptyRows: boolean;
	formatterOptions: Partial<FastCsvFormatterOptionsArgs>;
}

export interface Csv {
	/**
	 * read from a file
	 */
	readFile(path: string, options?: Partial<CsvReadOptions>): Promise<Worksheet>;

	/**
	 * read from a stream
	 */
	read(stream: import('stream').Stream, options?: Partial<CsvReadOptions>): Promise<Worksheet>;

	/**
	 * Create input stream for reading
	 */
	createInputStream(options?: Partial<CsvReadOptions>): import('events').EventEmitter;

	/**
	 * write to a buffer
	 */
	writeBuffer(options?: Partial<CsvWriteOptions>): Promise<Buffer>;

	/**
	 * write to a file
	 */
	writeFile(path: string, options?: Partial<CsvWriteOptions>): Promise<void>;

	/**
	 * write to a stream
	 */
	write(stream: import('stream').Stream, options?: Partial<CsvWriteOptions>): Promise<void>;
}

export interface Media {
	type: string;	// image,background
	name: string;
	extension: string;
	buffer: Buffer;
}

export interface Address {
	sheetName?: string;
	address: string;
	col: string;
	row: string;
	$col$row: string;
}

export interface Location {
	top: number;
	left: number;
	bottom: number;
	right: number;
}

export interface CellMatrix {
	addCell(addressStr: string): void;
	getCell(addressStr: string): Cell;
	findCell(addressStr: string): Cell | undefined;
	findCellAt(sheetName: string, rowNumber: number, colNumber: number): Cell | undefined;
	addCellEx(address: string | Location): void;
	getCellEx(address: string | Location): Cell;
	findCellEx(address: string | Location, create: boolean): Cell | undefined;
	getCellAt(sheetName: string, rowNumber: number, colNumber: number): Cell;
	removeCellEx(address: string | Location): void;
	forEach(callback: (cell: Cell) => void): void;
	map<T>(callback: (cell: Cell) => T): T[];
	findSheet(address: string | Location, create: boolean): Cell[] | undefined;
	findSheetRow(sheet: Cell[][], address: string | Location, create: boolean): Row | undefined;
	findRowCell(row: any[], address: Address, create: boolean): Cell | undefined;
}

export interface DefinedNamesRanges {
	name: string;
	ranges: string[];
}

export type DefinedNamesModel = DefinedNamesRanges[];

export interface DefinedNames {
	getMatrix(name: string): CellMatrix;
	// add a name to a cell. locStr in the form SheetName!$col$row or SheetName!$c1$r1:$c2:$r2
	add(locStr: string, name?: string): void;
	addEx(location: string | Location, name: string): Cell;

	remove(locStr: string | Location, name: string): void;
	removeEx(location: string | Location, name: string): void;
	removeAllNames(location: string | Location): void;

	forEach(callback: (name: string, cell: Cell) => void): void;

	// get all the names of a cell
	getNames(addressStr: string): string[];
	getNamesEx(address: string): string[];

	getRanges(name: string, matrix?: CellMatrix): DefinedNamesRanges;

	model: DefinedNamesModel;
}

export interface WorkbookModel {
	creator: string;
	lastModifiedBy: string;
	lastPrinted: Date;
	created: Date;
	modified: Date;
	properties: WorkbookProperties;
	worksheets: Worksheet[];
	sheets: WorksheetModel[];
	definedNames: DefinedNamesModel;
	views: WorkbookView[];
	company: string;
	manager: string;
	title: string;
	subject: string;
	keywords: string;
	category: string;
	description: string;
	language: string;
	revision: Date;
	contentStatus: string;
	themes: string[];
	media: Media[];
}

export class Workbook {
    category: string;
    company: string;
	creator: string;
    description: string;
    keywords: string;
	lastModifiedBy: string;
	created: Date;
    manager: string;
	modified: Date;
	lastPrinted: Date;
	properties: WorkbookProperties;
	subject: string;
    title: string;

	/**
	 * Workbook calculation Properties
	 */
	calcProperties: CalculationProperties;

	/**
	 * xlsx file format operations
	 */
	readonly xlsx: Xlsx;

	/**
	 * csv file format operations
	 */
	readonly csv: Csv;

	readonly nextId: number;

	readonly definedNames: DefinedNames;

	model: WorkbookModel;

	/**
	 * The Workbook views controls how many separate windows Excel will open when viewing the workbook.
	 */
	views: WorkbookView[];

	/**
	 * return a clone of worksheets in order
	 */
	worksheets: Worksheet[];

	/**
	 * Add a new worksheet and return a reference to it
	 */
	addWorksheet(name?: string, options?: Partial<AddWorksheetOptions>): Worksheet;

	removeWorksheetEx(worksheet: Worksheet): void;
	removeWorksheet(indexOrName: number | string): void;

	/**
	 * fetch sheet by name or id
	 */
	getWorksheet(indexOrName?: number | string): Worksheet | undefined;

	/**
	 * Iterate over all sheets.
	 *
	 * Note: `workbook.worksheets.forEach` will still work but this is better.
	 */
	eachSheet(callback: (worksheet: Worksheet, id: number) => void): void;

	clearThemes(): void;

	/**
	 * Add Image to Workbook and return the id
	 */
	addImage(img: Image): number;

	getImage(id: number): Image;
}

export interface TableStyleProperties {
	/**
	 * The colour theme of the table
	 * @default 'TableStyleMedium2'
	 */
	theme?: 'TableStyleDark1' | 'TableStyleDark10' | 'TableStyleDark11' | 'TableStyleDark2' | 'TableStyleDark3' | 'TableStyleDark4' | 'TableStyleDark5' | 'TableStyleDark6' | 'TableStyleDark7' | 'TableStyleDark8' | 'TableStyleDark9' | 'TableStyleLight1' | 'TableStyleLight10' | 'TableStyleLight11' | 'TableStyleLight12' | 'TableStyleLight13' | 'TableStyleLight14' | 'TableStyleLight15' | 'TableStyleLight16' | 'TableStyleLight17' | 'TableStyleLight18' | 'TableStyleLight19' | 'TableStyleLight2' | 'TableStyleLight20' | 'TableStyleLight21' | 'TableStyleLight3' | 'TableStyleLight4' | 'TableStyleLight5' | 'TableStyleLight6' | 'TableStyleLight7' | 'TableStyleLight8' | 'TableStyleLight9' | 'TableStyleMedium1' | 'TableStyleMedium10' | 'TableStyleMedium11' | 'TableStyleMedium12' | 'TableStyleMedium13' | 'TableStyleMedium14' | 'TableStyleMedium15' | 'TableStyleMedium16' | 'TableStyleMedium17' | 'TableStyleMedium18' | 'TableStyleMedium19' | 'TableStyleMedium2' | 'TableStyleMedium20' | 'TableStyleMedium21' | 'TableStyleMedium22' | 'TableStyleMedium23' | 'TableStyleMedium24' | 'TableStyleMedium25' | 'TableStyleMedium26' | 'TableStyleMedium27' | 'TableStyleMedium28' | 'TableStyleMedium3' | 'TableStyleMedium4' | 'TableStyleMedium5' | 'TableStyleMedium6' | 'TableStyleMedium7' | 'TableStyleMedium8' | 'TableStyleMedium9';
	/**
	  * Highlight the first column (bold)
	  * @default false
	  */
	showFirstColumn?: boolean;
	/**
	  * Highlight the last column (bold)
	  * @default false
	  */
	showLastColumn?: boolean;
	/**
	  * Alternate rows shown with background colour
	  * @default false
	  */
	showRowStripes?: boolean;
	/**
	  * Alternate rows shown with background colour
	  * @default false
	  */
	showColumnStripes?: boolean;
}

export interface TableColumnProperties {
	/**
	  * The name of the column, also used in the header
	  */
	name: string;
	/**
	  * Switches the filter control in the header
	  * @default false
	  */
	filterButton?: boolean;
	/**
	  * Label to describe the totals row (first column)
	  * @default 'Total'
	  */
	totalsRowLabel?: string;
	/**
	  * Name of the totals function
	  * @default 'none'
	  */
	totalsRowFunction?: 'none' | 'average' | 'countNums' | 'count' | 'max' | 'min' | 'stdDev' | 'var' | 'sum' | 'custom';
	/**
	  * Optional formula for custom functions
	  */
	totalsRowFormula?: string;

	/**
	 * Styles applied to the column
	 */
	style?: Partial<Style>;
}


export interface TableProperties {
	/**
	 * The name of the table
	 */
	name: string;
	/**
	 * The display name of the table
	 */
	displayName?: string;
	/**
	 * Top left cell of the table
	 */
	ref: string;
	/**
	 * Show headers at top of table
	 * @default true
	 */
	headerRow?: boolean;
	/**
	 * Show totals at bottom of table
	 * @default false
	 */
	totalsRow?: boolean;
	/**
	 * Extra style properties
	 * @default {}
	 */
	style?: TableStyleProperties;
	/**
	 * Column definitions
	 */
	columns: TableColumnProperties[]
	/**
	 * Rows of data
	 */
	rows: any[][]
}

export type TableColumn = Required<TableColumnProperties>

export interface Table extends Required<TableProperties> {
	/**
	 * Commit changes
	 */
	commit: () => void
	/**
	 * Remove a rows of data
	 */
	removeRows: (rowIndex: number, count: number) => void
	/**
	 * Add a row of data, either insert at rowNumber or append
	 */
	addRow: (values: any[], rowNumber?: number) => void
	/**
	 * Get column
	 */
	getColumn: (colIndex: number) => TableColumn
	/**
	 * Add a new column, including column defn and values
	 * inserts at colNumber or adds to the right
	 */
	addColumn: (column: TableColumnProperties, values: any[], colIndex: number) => void
	/**
	 * Remove a column with data
	 */
	removeColumns: (colIndex: number, count: number) => void
}

export namespace config {
	function setValue(key: 'promise', promise: any): void;
}

export namespace stream {
	namespace xlsx {
		interface WorkbookWriterOptions {
			/**
			 * Specifies a writable stream to write the XLSX workbook to.
			 */
			stream: import('stream').Stream;

			/**
			 * 	If stream not specified, this field specifies the path to a file to write the XLSX workbook to.
			 */
			filename: string;

			/**
			 * 	Specifies whether to use shared strings in the workbook. Default is false
			 */
			useSharedStrings: boolean;

			/**
			 * Specifies whether to add style information to the workbook.
			 * Styles can add some performance overhead. Default is false
			 */
			useStyles: boolean;
		}

		interface ArchiverZipOptions {
			comment: string;
			forceLocalTime: boolean;
			forceZip64: boolean;
			store: boolean;
			zlib: Partial<ZlibOptions>;
		}

		interface ZlibOptions {
			/**
			 * @default constants.Z_NO_FLUSH
			 */
			flush: number;
			/**
			 * @default constants.Z_FINISH
			 */
			finishFlush: number;
			/**
			 * @default 16*1024
			 */
			chunkSize: number;
			windowBits: number;
			level: number; // compression only
			memLevel: number; // compression only
			strategy: number; // compression only
			dictionary: Buffer | NodeJS.TypedArray | DataView | ArrayBuffer; // deflate/inflate only, empty dictionary by default
		}

		interface WorkbookStreamWriterOptions extends WorkbookWriterOptions {

			/**
			 * Specifies whether to add style information to the workbook.
			 * Styles can add some performance overhead. Default is false
			 */
			zip: Partial<ArchiverZipOptions>;
		}

		class WorkbookWriter extends Workbook {
			constructor(options: Partial<WorkbookStreamWriterOptions>);
			// commit all worksheets, then add suplimentary files
			commit(): Promise<void>;
			addStyles(): Promise<void>;
			addThemes(): Promise<void>;
			addOfficeRels(): Promise<void>;
			addContentTypes(): Promise<void>;
			addApp(): Promise<void>;
			addCore(): Promise<void>;
			addSharedStrings(): Promise<void>;
			addWorkbookRels(): Promise<void>;
			addWorkbook(): Promise<void>;
		}


		interface WorkbookStreamReaderOptions {
			/**
			 * @default 'emit'
			 */
			worksheets?: 'emit' | 'ignore';
			/**
			 * @default 'cache'
			 */
			sharedStrings?: 'cache' | 'emit' | 'ignore';
			/**
			 * @default 'ignore'
			 */
			hyperlinks?: 'cache' | 'emit' | 'ignore';
			/**
			 * @default 'ignore'
			 */
			styles?: 'cache' | 'ignore';
			/**
			 * @default 'ignore'
			 */
			entries?: 'emit' | 'ignore';
		}

		class WorkbookReader extends Workbook {
			constructor(input: string | import('stream').Stream, options: Partial<WorkbookStreamReaderOptions>);
			read(): Promise<void>;
			[Symbol.asyncIterator](): AsyncGenerator<WorksheetReader>;
			parse(): AsyncIterator<any>;
		}

		interface WorksheetReaderOptions {
			workbook: Workbook;
			id: number;
			entry: import('stream').Stream;
			options: WorkbookStreamReaderOptions;
		}

		class WorksheetReader {
			constructor(options: WorksheetReaderOptions);
			read(): Promise<void>;
			[Symbol.asyncIterator](): AsyncGenerator<Row>;
			parse(): AsyncIterator<Array<any>>;
			dimensions(): number;
			columns(): number;
			getColumn(c: number): Column;
		}
	}
}
