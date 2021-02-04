// tslint:disable:max-line-length
import { TranslateService } from '@ngx-translate/core';
import { ReportDefinitionDimensionForClient, ReportDefinitionForClient, ReportDefinitionMeasureForClient, ReportDefinitionSelectForClient } from './dto/definitions-for-client';
import { Collection, DataType, EntityDescriptor, entityDescriptorImpl, getNavPropertyFromForeignKey, isNumeric, metadata, NavigationPropDescriptor, PropDescriptor, PropVisualDescriptor } from './entities/base/metadata';
import {
    DeBracket,
    Queryex,
    QueryexBase,
    QueryexBinaryOperator,
    QueryexBit,
    QueryexColumnAccess,
    QueryexDirection,
    QueryexFunction,
    QueryexNull,
    QueryexNumber,
    QueryexParameter,
    QueryexQuote,
    QueryexUnaryOperator
} from './queryex';
import { descFromControlOptions, isSpecified, toLocalDateISOString } from './util';
import { WorkspaceService } from './workspace.service';

type Calendar = 'GR' | 'ET' | 'UQ';
const calendarsArray: Calendar[] = ['GR', 'ET', 'UQ'];

// Type Guards
function isPropDescriptor(target: DataType | PropDescriptor | PropVisualDescriptor): target is PropDescriptor {
    return !!target && !!(target as PropDescriptor).datatype;
}

function isNavPropDescriptor(desc: PropDescriptor): desc is NavigationPropDescriptor {
    return desc.hasOwnProperty('foreignKeyName');
}

function precedence(datatype: DataType) {
    switch (datatype) {
        case 'boolean': return 1;
        case 'hierarchyid': return 2;
        case 'geography': return 4;
        case 'datetimeoffset': return 8;
        case 'datetime': return 16;
        case 'date': return 32;
        case 'numeric': return 64;
        case 'numeric': return 65; // TODO: delete
        case 'bit': return 128;
        case 'string': return 256;
        case 'null': return 512;
        case 'entity': return 1024;
        default: throw new Error(`Precedence: Unknown datatype ${datatype}`);
    }
}

function mergeArithmeticNumericDescriptors(d1: PropDescriptor, d2: PropDescriptor, label: () => string): PropDescriptor {
    // This is for arithmetic operations (+ /)
    if (d1.datatype === 'numeric' && d2.datatype === 'numeric') {
        if (d1.control === 'percent' && d2.control === 'percent') {
            return {
                datatype: 'numeric',
                control: 'percent',
                minDecimalPlaces: Math.max(d1.minDecimalPlaces, d2.minDecimalPlaces),
                maxDecimalPlaces: Math.max(d1.maxDecimalPlaces, d2.maxDecimalPlaces),
                label,
                isRightAligned: d1.isRightAligned || d2.isRightAligned
            };
        } else {
            const leftMinDecimals = d1.control === 'number' ? d1.minDecimalPlaces :
                d1.control === 'percent' ? d1.minDecimalPlaces - 2 : 0;
            const rightMinDecimals = d2.control === 'number' ? d2.minDecimalPlaces :
                d2.control === 'percent' ? d2.minDecimalPlaces - 2 : 0;
            const leftMaxDecimals = d1.control === 'number' ? d1.maxDecimalPlaces :
                d1.control === 'percent' ? d1.maxDecimalPlaces - 2 : 0;
            const rightMaxDecimals = d2.control === 'number' ? d2.maxDecimalPlaces :
                d2.control === 'percent' ? d2.maxDecimalPlaces - 2 : 0;
            const leftRightAligned = (d1.control === 'number' || d1.control === 'percent') && d1.isRightAligned;
            const rightRightAligned = (d2.control === 'number' || d2.control === 'percent') && d2.isRightAligned;

            return {
                datatype: 'numeric',
                control: 'number',
                minDecimalPlaces: Math.max(leftMinDecimals, rightMinDecimals),
                maxDecimalPlaces: Math.max(leftMaxDecimals, rightMaxDecimals),
                label,
                isRightAligned: leftRightAligned || rightRightAligned
            };
        }
    } else {
        throw new Error(`[Bug] Merging non numeric datatypes ${d1} and ${d2}.`);
    }
}

function mergeFallbackNumericDescriptors(d1: PropDescriptor, d2: PropDescriptor, label: () => string): PropDescriptor {
    // This is for fallback operations like If and IsNull
    if (d1.datatype === 'numeric' && d2.datatype === 'numeric') {

        // If they're both entities with the same control and defId, return that with the filter conjunction
        if (isNavPropDescriptor(d1) && isNavPropDescriptor(d2)) {
            if (d1.definitionId === d2.definitionId && d1.control === d2.control) {
                let filter: string;
                if (d1.filter === d2.filter) {
                    filter = d1.filter;
                } else {
                    filter = d1.filter;
                    if (!filter) {
                        filter = d2.filter;
                    } else if (!!d2.filter) {
                        filter = `(${filter}) and (${d2.filter})`;
                    }
                }

                return {
                    datatype: 'numeric',
                    control: d1.control,
                    definitionId: d1.definitionId,
                    filter,
                    label,
                    foreignKeyName: d1.foreignKeyName
                };
            }
        } else if (d1.control === 'choice' && d2.control === 'choice') {
            // Optimization for identical descriptors
            if (d1.choices.length === d2.choices.length) {
                let identical = true;
                for (let i = 0; i < d1.choices.length; i++) {
                    if (d1.choices[i] !== d2.choices[i]) {
                        identical = false;
                        break;
                    }
                }

                if (identical) {
                    return { ...d1 };
                }
            }

            // If they're both choices, merge the choices
            // Efficiently calculate the union of the two choice arrays
            const tracker = {};
            for (const v of d1.choices) {
                tracker[v] = true;
            }
            for (const v of d2.choices) {
                tracker[v] = true;
            }

            const choices = Object.keys(tracker).map(c => +c);

            // Prepare the combined format function
            const format1 = d1.format;
            const format2 = d2.format;
            const format = (v: string) => format1(v) || format2(v);

            const color1 = d1.color;
            const color2 = d2.color;
            const color = (v: string) => (color1 ? color1(v) : null) || (color2 ? color2(v) : null);

            return {
                datatype: 'numeric',
                control: 'choice',
                format,
                color,
                choices,
                label,
            };
        } else if (d1.control === 'serial' && d2.control === 'serial') {
            if (d1.prefix === d2.prefix && d1.codeWidth === d2.codeWidth) {
                return {
                    datatype: 'numeric',
                    control: 'serial',
                    prefix: d1.prefix,
                    codeWidth: d1.codeWidth,
                    label
                };
            }
        }

        // Last resort, merge as you would for arithmetic
        return mergeArithmeticNumericDescriptors(d1, d2, label);

    } else {
        throw new Error(`[Bug] Merging non numeric datatypes ${d1} and ${d2}.`);
    }
}

function mergeFallbackStringDescriptors(d1: PropDescriptor, d2: PropDescriptor, label: () => string): PropDescriptor {
    // This is for fallback operations like If and IsNull
    if (d1.datatype === 'string' && d2.datatype === 'string') {

        // If they're both entities with the same control and defId, return that with the filter conjunction
        if (isNavPropDescriptor(d1) && isNavPropDescriptor(d2)) {
            if (d1.definitionId === d2.definitionId && d1.control === d2.control) {
                let filter = d1.filter;
                if (!filter) {
                    filter = d2.filter;
                } else if (!!d2.filter) {
                    filter = `(${filter}) and (${d2.filter})`;
                }

                return {
                    datatype: 'string',
                    control: d1.control,
                    definitionId: d1.definitionId,
                    filter,
                    label,
                    foreignKeyName: d1.foreignKeyName
                };
            }

        } else if (d1.control === 'choice' && d2.control === 'choice') {
            // If they're both choices, merge the choices
            // Efficiently calculate the union of the two choice arrays
            const tracker = {};
            for (const v of d1.choices) {
                tracker[v] = true;
            }
            for (const v of d2.choices) {
                tracker[v] = true;
            }

            const choices = Object.keys(tracker);

            // Prepare the combined format function
            const format1 = d1.format;
            const format2 = d2.format;
            const format = (v: string) => format1(v) || format2(v);

            const color1 = d1.color;
            const color2 = d2.color;
            const color = (v: string) => (color1 ? color1(v) : null) || (color2 ? color2(v) : null);

            return {
                datatype: 'string',
                control: 'choice',
                format,
                color,
                choices,
                label
            };
        }

        // Last resort, return a plain old text editor
        return {
            datatype: 'string',
            control: 'text',
            label
        };
    }
}

function getLowestPrecedenceDescFromVisual(desc: PropVisualDescriptor, label: () => string, wss: WorkspaceService, trx: TranslateService): PropDescriptor {
    switch (desc.control) {
        case 'unsupported':
            return { datatype: 'boolean', ...desc, label };
        case 'datetime':
            return { datatype: 'datetime', ...desc, label };
        case 'date':
            return { datatype: 'date', ...desc, label };
        case 'number':
            return { datatype: 'numeric', ...desc, label };
        case 'check':
            return { datatype: 'bit', ...desc, label };
        case 'text':
            return { datatype: 'string', ...desc, label };
        case 'serial':
            return { datatype: 'numeric', ...desc, label };
        case 'choice':
            return { datatype: 'string', ...desc, label };
        case 'percent':
            return { datatype: 'numeric', ...desc, label };
        case 'null':
            return { datatype: 'null', ...desc, label };
        default:
            const entityDesc = metadata[desc.control](wss, trx, desc.definitionId);
            const idDesc = entityDesc.properties.Id.datatype;
            if (idDesc === 'numeric') {
                return { datatype: 'numeric', ...desc, foreignKeyName: null, label };
            } else if (idDesc === 'string') {
                return { datatype: 'string', ...desc, foreignKeyName: null, label };
            } else {
                throw new Error(`[Bug] type ${entityDesc.titleSingular()} has an Id that is neither string nor numeric`);
            }
    }
}

/**
 * Returns a PropDescriptor from a PropVisualDescriptor and a DataType, if they are compatible, else returns undefined
 */
function tryGetDescFromVisual(desc: PropVisualDescriptor, datatype: DataType, label: () => string, wss: WorkspaceService, trx: TranslateService): PropDescriptor {
    switch (desc.control) {
        case 'unsupported':
            switch (datatype) {
                case 'boolean':
                case 'hierarchyid':
                case 'geography':
                    return { datatype, ...desc, label };
            }
            break;
        case 'datetime':
            switch (datatype) {
                case 'datetimeoffset':
                case 'datetime':
                    return { datatype, ...desc, label };
            }
            break;
        case 'date':
            switch (datatype) {
                case 'datetimeoffset':
                case 'datetime':
                case 'date':
                    return { datatype, ...desc, label };
            }
            break;
        case 'number':
            if (datatype === 'numeric') {
                return { datatype, ...desc, label };
            }
            break;
        case 'check':
            if (datatype === 'bit') {
                return { datatype, ...desc, label };
            }
            break;
        case 'text':
            if (datatype === 'string') {
                return { datatype, ...desc, label };
            }
            break;
        case 'serial':
            if (datatype === 'numeric') {
                return { datatype, ...desc, label };
            }
            break;
        case 'choice':
            if (datatype === 'string') {
                return { datatype, ...desc, label };
            } else if (datatype === 'numeric' && desc.choices.every(c => !isNaN(+c))) {
                return { datatype, ...desc, label };
            }
            break;
        case 'percent':
            if (datatype === 'numeric') {
                return { datatype, ...desc, label };
            }
            break;
        case 'null':
            if (datatype === 'null') {
                return { datatype, ...desc, label };
            }
            break;
        default:
            const idDesc = metadata[desc.control](wss, trx, desc.definitionId).properties.Id.datatype;
            if (datatype === 'numeric' && idDesc === 'numeric') {
                return { datatype, ...desc, foreignKeyName: null, label };
            }
            if (datatype === 'string' && idDesc === 'string') {
                return { datatype, ...desc, foreignKeyName: null, label };
            }
    }
}

function tryGetDescFromDatatype(targetType: DataType, label: () => string): PropDescriptor {
    // A null can be implicitly cast to any one of these
    switch (targetType) {
        case 'string':
            return { datatype: targetType, control: 'text', label };
        case 'numeric':
            return { datatype: targetType, control: 'number', label, minDecimalPlaces: 0, maxDecimalPlaces: 4, isRightAligned: false };
        case 'bit':
            return { datatype: targetType, control: 'check', label };
        case 'date':
            return { datatype: targetType, control: 'date', label };
        case 'datetime':
        case 'datetimeoffset':
            return { datatype: targetType, control: 'date', label };
        case 'geography':
        case 'hierarchyid':
            return { datatype: targetType, control: 'unsupported', label };
    }
}

function mergeDescriptors(d1: PropDescriptor, d2: PropDescriptor, label: () => string): PropDescriptor {

    if (d1.datatype !== d2.datatype) {
        throw new Error(`[Bug] Merging two different datatypes ${d1.datatype} and ${d2.datatype}.`);
    }

    switch (d1.datatype) {
        case 'string': {
            return mergeFallbackStringDescriptors(d1, d2, label);
        }
        case 'numeric':
            return mergeFallbackNumericDescriptors(d1, d2, label);

        case 'date':
            return {
                datatype: 'date',
                control: 'date',
                label
            };

        case 'datetime':
            return {
                datatype: 'datetime',
                control: 'datetime',
                label
            };

        case 'datetimeoffset':
            return {
                datatype: 'datetimeoffset',
                control: 'datetime',
                label
            };

        case 'bit':
            return {
                datatype: 'bit',
                control: 'check',
                label
            };

        case 'geography':
        case 'hierarchyid':
        case 'boolean':
            return {
                datatype: d1.datatype,
                control: 'unsupported',
                label
            };

        case 'null':
            return {
                datatype: 'null',
                control: 'null',
                label
            };
    }

    throw new Error(`[Bug] Merging unhandled datatype ${d1.datatype}.`);
}

function implicitCast(nativeDesc: PropDescriptor, targetType: DataType, hintDesc?: PropDescriptor): PropDescriptor {

    if (nativeDesc.datatype === targetType) {
        return nativeDesc;
    } else if (nativeDesc.datatype === 'null') {
        let desc: PropDescriptor;
        if (targetType !== 'boolean') {
            if (!!hintDesc) {
                desc = { ...hintDesc };
            } else {
                desc = tryGetDescFromDatatype(targetType, nativeDesc.label);
            }
        }

        return desc;
    } else if (nativeDesc.datatype === 'bit') {
        if (targetType === 'numeric') {
            return {
                datatype: targetType,
                control: 'number',
                minDecimalPlaces: 0,
                maxDecimalPlaces: 0,
                label: nativeDesc.label,
                isRightAligned: true
            };
        } else if (targetType === 'boolean') {
            return {
                datatype: targetType,
                control: 'unsupported',
                label: nativeDesc.label
            };
        }
    }
}

export interface ParameterInfo {
    key: string;
    keyLower: string;
    datatype: DataType;
    desc: PropVisualDescriptor;
    label: () => string;
    isRequired: boolean; // True if mentioned in a non-boolean expression or if def.visibility = 'Required'
    defaultExp?: QueryexBase;
}

export interface MeasureInfo {
    // All these should be possible to evaluate on the client side,
    // i.e. all aggregations should be tagged with the index to the values array
    exp: QueryexBase;
    desc: PropVisualDescriptor; // displaying the measure
    label: () => string; // Measure labels appear when there is more than 1 measure

    success: QueryexBase; // boolean
    warning: QueryexBase; // boolean
    danger: QueryexBase; // boolean

    isOrdered: boolean; // If this is true, we set the sortValue of the dimension cell to the measure value
    isNumeric: boolean; // So charts know whether they can display it or not
}

export interface DimensionInfo {
    keyExp: QueryexBase; // For query, and for drilldown we say AND keyExpression eq <val>
    dispExp: QueryexBase; // Display Expression For the query
    localize: boolean;
    keyDesc: PropDescriptor; // For drilldown: To determine if quotes should be added or not and to get the fk name of nav key expressions
    desc: PropVisualDescriptor; // For displaying the dimension (display desc || key desc)
    entityDesc: EntityDescriptor; // Set when the key expression is a nav property
    label: () => string; // Mostly used when converting to a chart

    keyIndex?: number; // Value used for navigating the pivot hash (Id for entities or the value for value)
    parentKeyIndex?: number;
    indices?: number[]; // Either entity, multilingual or scalar

    autoExpandLevel: number;
    showAsTree: boolean;
    showEmptyMembers: boolean;
    orderDir: QueryexDirection; // The order direction (whether from the dimension or from one of its attributes)
    isOrdered: boolean; // If this is true, we set the sortValue of the dimension cell to the dimension value

    attributes: AttributeInfo[];
}

export interface SelectInfo {
    exp: QueryexBase; // For the query
    expToString: string; // To efficiently match the column to the orderby_key (when the user overrides the default report orderby)
    localize: boolean;
    desc: PropVisualDescriptor; // For displaying the attribute and checking if it's an entity
    entityDesc: EntityDescriptor;
    label: () => string; // For labeling the attribute
    indices?: number[]; // Either entity, multilingual or scalar

    width?: string; // Useful to remember the column widths during order by to avoid jarring movement
}

export interface AttributeInfo extends SelectInfo {
    isOrdered: boolean; // If this is true, we set the sortValue of the dimension cell to the attribute value
}

export interface UniqueAggregationInfo {
    exp: QueryexFunction;
    index?: number; // The index of the select atom
}

export interface ReportInfos {
    rows: DimensionInfo[];
    columns: DimensionInfo[];
    measures: MeasureInfo[];
    select: SelectInfo[];
    filter: QueryexBase;
    having: QueryexBase;
    parameters: ParameterInfo[];
}

export class QueryexUtil {

    public static yearOrDayDesc(label: () => string, _: TranslateService): PropDescriptor {
        return {
            datatype: 'numeric',
            control: 'number',
            label,
            minDecimalPlaces: 0,
            maxDecimalPlaces: 0,
            isRightAligned: false
        };
    }

    public static quarterDesc(label: () => string, trx: TranslateService): PropDescriptor {
        return {
            datatype: 'numeric',
            control: 'choice',
            label,
            choices: [1, 2, 3, 4],
            format: (c: number | string) => !c ? '' : trx.instant(`ShortQuarter${c}`)
        };
    }

    public static monthDesc(label: () => string, trx: TranslateService): PropDescriptor {
        return {
            datatype: 'numeric',
            control: 'choice',
            label,
            choices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
            format: (c: number | string) => !c ? '' : trx.instant(`ShortMonth${c}`)
        };
    }

    public static weekdayDesc(label: () => string, trx: TranslateService): PropDescriptor {
        return {
            datatype: 'numeric',
            control: 'choice',
            label,
            choices: [2 /* Mon */, 3, 4, 5, 6, 7, 1 /* Sun */],
            // SQL Server numbers the days differently from ngb-datepicker
            format: (c: number) => !c ? '' : trx.instant(`ShortDay${(c - 1) === 0 ? 7 : c - 1}`)
        };
    }

    public static needsQuotes(datatype: DataType) {
        switch (datatype) {
            case 'string':
            case 'date':
            case 'datetime':
            case 'datetimeoffset':
                return true;
            default:
                return false;
        }
    }

    public static stringify(
        expression: QueryexBase,
        args: { [keyLower: string]: any },
        infos: { [keyLower: string]: ParameterInfo },
        lang: 1 | 2 | 3 = 1,
        navPrefix?: string): string {

        function stringifyInner(exp: QueryexBase): string {
            if (exp instanceof QueryexParameter) {
                const { desc, datatype, isRequired, defaultExp } = infos[exp.keyLower];
                const value = args[exp.keyLower];

                if (!desc) {
                    throw new Error(`[Bug] The descriptor for parameter @${exp.key} was not supplied.`);
                }

                if (isSpecified(value)) {
                    if (QueryexUtil.needsQuotes(datatype)) {
                        return `'${(value + '').replace('\'', '\'\'')}'`;
                    } else {
                        return value + '';
                    }
                } else if (!!defaultExp) {
                    return defaultExp.toString(); // It can't contain parameters anyways
                } else if (isRequired) {
                    // Validation should prevent reaching here
                    throw new Error(`[Bug] required parameter @${exp.key} was not supplied.`);
                } else {
                    return null; // Will be pruned out
                }
            } else if (exp instanceof QueryexColumnAccess) {
                let expString = exp.toString();

                // Handle multi-lingual if needed
                if (lang === 2 && exp.hasSecondary) {
                    expString += '2';
                } else if (lang === 3 && exp.hasTernary) {
                    expString += '3';
                }

                // The nav prefix - if supplied - is appended before every column access string
                if (!!navPrefix) {
                    return `${navPrefix}.${expString}`;
                } else {
                    return expString;
                }
            } else if (exp instanceof QueryexFunction) {
                const stringArgs = exp.arguments.map(a => DeBracket(stringifyInner(a)));
                if (stringArgs.some(a => a === null)) {
                    return null; // prune it out
                } else {
                    return `${exp.nameLower}(${stringArgs.join(', ')})`;
                }
            } else if (exp instanceof QueryexBinaryOperator) {
                const stringLeft = stringifyInner(exp.left);
                const stringRight = stringifyInner(exp.right);
                switch (exp.operator.toLowerCase()) {
                    case 'and':
                    case 'or':
                    case '&&':
                    case '||':
                        // Logical operators can cleave out one operand and keep the other
                        if (stringLeft === null) {
                            return stringRight;
                        } else if (stringRight === null) {
                            return stringLeft;
                        } else {
                            return `(${stringLeft} ${exp.operator.toLowerCase()} ${stringRight})`;
                        }

                    default:
                        // Other operators get cleaved out if any operand is cleaved out
                        if (stringLeft === null || stringRight === null) {
                            return null;
                        } else {
                            return `(${stringLeft} ${exp.operator.toLowerCase()} ${stringRight})`;
                        }
                }
            } else if (exp instanceof QueryexUnaryOperator) {
                const stringOperand = stringifyInner(exp.operand);
                if (stringOperand === null) {
                    return null;
                } else {
                    return `(${exp.operator.toLowerCase()} ${stringOperand})`;
                }
            } else {
                return exp.toString(); // The other types are all leaves, cannot contain parameters
            }
        }

        return stringifyInner(expression);
    }

    public static canShowEmptyMembers(desc: PropVisualDescriptor) {
        // Those are the controls where we know the full list of members
        return !!desc && (desc.control === 'choice' || desc.control === 'check');
    }

    public static canShowAsTree(desc: PropDescriptor, wss: WorkspaceService, trx: TranslateService) {
        // Those are the controls where we know the full list of members
        return !!desc && desc.datatype === 'entity' &&
            !!metadata[desc.control](wss, trx, desc.definitionId).properties.Parent;
    }

    public static getReportInfos(
        definition: ReportDefinitionForClient,
        wss: WorkspaceService,
        trx: TranslateService): ReportInfos {

        const coll = definition.Collection;
        const defId = definition.DefinitionId;

        if (!coll) {
            throw new Error(`The collection was not specified`);
        }

        const ws = wss.currentTenant;

        // First prepare overrides

        const autoOverrides: { [keyLower: string]: PropDescriptor } = {};
        const autoOverridesPrev: { [keyLower: string]: PropDescriptor } = {};
        const userOverrides: { [keyLower: string]: PropVisualDescriptor } = {};
        const defaultExpressionDic: { [keyLower: string]: QueryexBase } = {};
        for (const dfnParam of definition.Parameters || []) {
            const keyLower = dfnParam.Key.toLowerCase();
            if (!!dfnParam.Control) {
                userOverrides[keyLower] = descFromControlOptions(wss.currentTenant, dfnParam.Control, dfnParam.ControlOptions);
            }

            // The default expression
            const exp = Queryex.parseSingle(dfnParam.DefaultExpression);
            if (!!exp) {
                const aggregations = exp.aggregations();
                const columnAccesses = exp.columnAccesses();
                const parameters = exp.parameters();
                if (aggregations.length > 0) {
                    throw new Error(`Parameter default Expression cannot contain aggregation functions like '${aggregations[0].name}'.`);
                } else if (columnAccesses.length > 0) {
                    throw new Error(`Parameter default Expression cannot contain column access literals like '${columnAccesses[0]}'.`);
                } else if (parameters.length > 0) {
                    throw new Error(`Parameter default Expression cannot contain parameters like '${parameters[0]}'.`);
                } else {
                    const desc = QueryexUtil.nativeDesc(exp, undefined, undefined, coll, defId, wss, trx);
                    switch (desc.datatype) {
                        case 'boolean':
                        case 'hierarchyid':
                        case 'geography':
                        case 'entity':
                            throw new Error(`Parameter default Expression cannot be of type ${desc.datatype}.`);
                        default:
                            autoOverrides[keyLower] = desc;
                            autoOverridesPrev[keyLower] = desc;
                    }
                }
            }

            defaultExpressionDic[keyLower] = exp;
        }

        /////////////////// Filter and Having

        const filterExp = Queryex.parseSingle(definition.Filter);
        if (!!filterExp) {
            const aggregations = filterExp.aggregations();
            if (aggregations.length > 0) {
                throw new Error(`Filter: Expression cannot contain aggregation functions like '${aggregations[0].name}'.`);
            }
        }

        let havingExp: QueryexBase;
        if (definition.Type === 'Summary') {
            havingExp = Queryex.parseSingle(definition.Having);
            if (!!havingExp) {
                const unaggregated = havingExp.unaggregatedColumnAccesses();
                if (unaggregated.length > 0) {
                    throw new Error(`Having: Expression cannot contain unaggregated column accesses like '${unaggregated[0]}'.`);
                }
            }
        }

        /////////////////// OrderBy

        if (definition.Type === 'Details' || definition.IsCustomDrilldown) {
            // This is just for validation
            const orderbyExps = Queryex.parse(definition.OrderBy, { expectDirKeywords: true });
            for (const orderbyExp of orderbyExps) {
                const aggregations = orderbyExp.aggregations();
                const parameters = orderbyExp.parameters();
                const columnAccesses = orderbyExp.columnAccesses();
                if (aggregations.length > 0) {
                    throw new Error(`Order By: Expression cannot contain aggregation functions like '${aggregations[0].name}'.`);
                } else if (parameters.length > 0) {
                    throw new Error(`Order By: Expression cannot contain parameters like '${parameters[0]}'.`);
                } else if (columnAccesses.length === 0) {
                    throw new Error(`Order By: Expression atom cannot be a constant like '${orderbyExp}'.`);
                } else {
                    const desc = QueryexUtil.nativeDesc(orderbyExp, userOverrides, autoOverrides, coll, defId, wss, trx);
                    switch (desc.datatype) {
                        case 'boolean':
                        case 'entity':
                            throw new Error(`Order By: Expression cannot be of type ${desc.datatype}.`);
                    }
                }
            }
        }

        /////////////////// Rows and Columns

        const addDimensionInfo = (dimension: ReportDefinitionDimensionForClient, infos: DimensionInfo[]): void => {
            const keyExp = Queryex.parseSingle(dimension.KeyExpression);
            let keyDesc: PropDescriptor;
            let keyEntityDesc: EntityDescriptor;
            let orderDir: QueryexDirection;
            if (!!keyExp) {
                const aggregations = keyExp.aggregations();
                const parameters = keyExp.parameters();
                if (aggregations.length > 0) {
                    throw new Error(`Dimension key Expression cannot contain aggregation functions like '${aggregations[0].name}'.`);
                } else if (parameters.length > 0) {
                    throw new Error(`Dimension key Expression cannot contain parameters like '${parameters[0]}'.`);
                } else {
                    keyDesc = QueryexUtil.nativeDesc(keyExp, userOverrides, autoOverrides, coll, defId, wss, trx);
                    switch (keyDesc.datatype) {
                        case 'boolean':
                        case 'hierarchyid':
                        case 'geography':
                            throw new Error(`Dimension key Expression cannot be of type ${keyDesc.datatype}.`);
                        case 'entity':
                            keyEntityDesc = metadata[keyDesc.control](wss, trx, keyDesc.definitionId);
                    }
                }
            } else {
                throw new Error(`Dimension key Expression cannot be empty.`);
            }

            let dispExp: QueryexBase;
            let dispDesc: PropDescriptor;
            const attributes: AttributeInfo[] = [];
            if (keyDesc.datatype === 'entity') {
                dispExp = Queryex.parseSingle(dimension.DisplayExpression);
                if (!!dispExp) {
                    const aggregations = dispExp.aggregations();
                    const parameters = dispExp.parameters();
                    if (aggregations.length > 0) {
                        throw new Error(`Dimension display Expression cannot contain aggregation functions like '${aggregations[0].name}'.`);
                    } else if (parameters.length > 0) {
                        throw new Error(`Dimension display Expression cannot contain parameters like '${parameters[0]}'.`);
                    } else {
                        dispDesc = QueryexUtil.nativeDesc(dispExp, userOverrides, autoOverrides, keyDesc.control, keyDesc.definitionId, wss, trx);
                        switch (dispDesc.datatype) {
                            case 'boolean':
                            case 'entity':
                            case 'hierarchyid':
                            case 'geography':
                                throw new Error(`Dimension display Expression ${dispExp} cannot be of type ${dispDesc.datatype}.`);
                        }
                    }
                }

                for (const attribute of dimension.Attributes || []) {
                    const localize = attribute.Localize;
                    const exp = Queryex.parseSingle(attribute.Expression);
                    if (!!exp) {
                        const aggregations = exp.aggregations();
                        const parameters = exp.parameters();
                        if (aggregations.length > 0) {
                            throw new Error(`Dimension attribute expression cannot contain aggregation functions like '${aggregations[0].name}'.`);
                        } else if (parameters.length > 0) {
                            throw new Error(`Dimension attribute expression cannot contain parameters like '${parameters[0]}'.`);
                        } else {
                            const expToString = exp.toString();
                            const desc = QueryexUtil.nativeDesc(exp, userOverrides, autoOverrides, keyDesc.control, keyDesc.definitionId, wss, trx);
                            let entityDesc: EntityDescriptor;
                            switch (desc.datatype) {
                                case 'boolean':
                                case 'hierarchyid':
                                case 'geography':
                                    throw new Error(`Dimension attribute Expression ${exp} cannot be of type ${desc.datatype}.`);
                                case 'entity':
                                    entityDesc = metadata[desc.control](wss, trx, desc.definitionId);
                            }

                            const label = !!attribute.Label ? () => ws.localize(attribute.Label, attribute.Label2, attribute.Label3) : desc.label;
                            const isOrdered = !!attribute.OrderDirection;
                            if (isOrdered) {
                                orderDir = attribute.OrderDirection;
                            }

                            attributes.push({ exp, expToString, localize, desc, entityDesc, label, isOrdered });
                        }
                    } else {
                        throw new Error(`Dimension attribute Expression cannot be empty.`);
                    }
                }
            }

            // Add the dimension info
            {
                const localize = dimension.Localize;
                const label = dimension.Label ? () => ws.localize(dimension.Label, dimension.Label2, dimension.Label3) : keyDesc.label;
                const isOrdered = !!dimension.OrderDirection;
                if (isOrdered) {
                    orderDir = dimension.OrderDirection;
                }
                const autoExpandLevel = dimension.AutoExpandLevel;
                const showAsTree = dimension.ShowAsTree && QueryexUtil.canShowAsTree(keyDesc, wss, trx);
                const showEmptyMembers = dimension.ShowEmptyMembers && QueryexUtil.canShowEmptyMembers(keyDesc);
                if (!showEmptyMembers) {
                    for (const d of rowInfos) {
                        // ShowEmptyMembers must true for all subsequent dimensions too
                        // Otherwise how would you display that dimension with nothing underneath it?
                        d.showEmptyMembers = false;
                    }
                }

                infos.push({
                    keyExp,
                    dispExp,
                    localize,
                    keyDesc,
                    desc: dispDesc || keyDesc,
                    entityDesc: keyEntityDesc,
                    label,
                    orderDir,
                    isOrdered,
                    attributes,
                    autoExpandLevel,
                    showAsTree, // Only when it's a tree entity
                    showEmptyMembers // Only when it's supported
                });
            }
        };

        const rowInfos: DimensionInfo[] = [];
        const columnInfos: DimensionInfo[] = [];

        if (definition.Type === 'Summary') {
            for (const row of definition.Rows) {
                addDimensionInfo(row, rowInfos);
            }

            for (const col of definition.Columns) {
                addDimensionInfo(col, columnInfos);
            }
        }

        /////////////////// Measures

        const measureExps: {
            measure: ReportDefinitionMeasureForClient,
            mainExp: QueryexBase,
            visualDesc: PropVisualDescriptor,
            orderDir: QueryexDirection,
            success: QueryexBase,
            warning: QueryexBase,
            danger: QueryexBase
        }[] = [];

        if (definition.Type === 'Summary') {
            for (const measure of definition.Measures) {
                const mainExp = Queryex.parseSingle(measure.Expression);
                if (!!mainExp) {
                    const unaggregated = mainExp.unaggregatedColumnAccesses();
                    if (unaggregated.length > 0) {
                        throw new Error(`Measure expression cannot contain unaggregated column accesses like '${unaggregated[0]}'.`);
                    }
                } else {
                    throw new Error(`Measure expression cannot be empty.`);
                }

                function validateHighlightExpression(expString: string, prop: string): QueryexBase {
                    const exp = Queryex.parseSingle(expString, { placeholderReplacement: mainExp });
                    if (!!exp) {
                        const unaggregated = exp.unaggregatedColumnAccesses();
                        if (unaggregated.length > 0) {
                            throw new Error(`Measure ${prop} expression cannot contain unaggregated column accesses like '${unaggregated[0]}'.`);
                        } else {
                            const desc = QueryexUtil.tryBooleanDesc(exp, userOverrides, autoOverrides, coll, defId, wss, trx);
                            if (!desc) {
                                throw new Error(`Measure ${prop} expression ${exp} could not be interpreted as a boolean.`);
                            } else {
                                return exp;
                            }
                        }
                    }
                }

                // The measure's visual descriptor
                const visualDesc = measure.Control ? descFromControlOptions(wss.currentTenant, measure.Control, measure.ControlOptions) : null;
                const orderDir = measure.OrderDirection;

                measureExps.push({
                    measure,
                    mainExp,
                    visualDesc,
                    orderDir,
                    success: validateHighlightExpression(measure.SuccessWhen, 'Success When'),
                    warning: validateHighlightExpression(measure.WarningWhen, 'Warning When'),
                    danger: validateHighlightExpression(measure.DangerWhen, 'Danger When'),
                });
            }
        }

        /////////////////// Selects

        const selectExps: { exp: QueryexBase, localize: boolean, select: ReportDefinitionSelectForClient }[] = [];
        if (definition.Type === 'Details' || definition.IsCustomDrilldown) {
            for (const select of definition.Select) {
                const localize = select.Localize;
                const exp = Queryex.parseSingle(select.Expression);
                if (!!exp) {
                    const aggregations = exp.aggregations();
                    const parameters = exp.parameters();
                    if (aggregations.length > 0) {
                        throw new Error(`Select expression cannot contain aggregation functions like '${aggregations[0].name}'.`);
                    } else if (definition.Type === 'Summary' && definition.IsCustomDrilldown && parameters.length > 0) {
                        throw new Error(`Expression cannot contain parameters like '${parameters[0]}'.`);
                    } else {
                        selectExps.push({ exp, localize, select });
                    }
                } else {
                    throw new Error(`Select expression cannot be empty.`);
                }
            }
        }

        let measureInfos: MeasureInfo[] = [];
        let selectInfos: SelectInfo[] = [];

        while (true) {
            // Clear these two first thing
            measureInfos = [];
            selectInfos = [];

            // Filter
            if (!!filterExp) {
                const desc = QueryexUtil.tryBooleanDesc(filterExp, userOverrides, autoOverrides, coll, defId, wss, trx);
                if (!desc) {
                    throw new Error(`Filter expression could not be interpreted as a boolean.`);
                }
            }

            // Having
            if (!!havingExp) {
                const desc = QueryexUtil.tryBooleanDesc(havingExp, userOverrides, autoOverrides, coll, defId, wss, trx);
                if (!desc) {
                    throw new Error(`Having expression could not be interpreted as a boolean.`);
                }
            }

            // Measures
            for (const { measure, mainExp, visualDesc, orderDir, success, warning, danger } of measureExps) {
                const mainDesc = QueryexUtil.nativeDesc(mainExp, userOverrides, autoOverrides, coll, defId, wss, trx);
                switch (mainDesc.datatype) {
                    case 'boolean':
                    case 'entity':
                    case 'hierarchyid':
                    case 'geography':
                        throw new Error(`Measure expression ${mainExp} cannot be of type ${mainDesc.datatype}.`);
                }

                function validateHighlightExpression(exp: QueryexBase, prop: string): void {
                    if (!!exp) {
                        const desc = QueryexUtil.tryBooleanDesc(exp, userOverrides, autoOverrides, coll, defId, wss, trx);
                        if (!desc) {
                            throw new Error(`Measure ${prop} expression ${exp} could not be interpreted as a boolean.`);
                        }
                    }
                }

                validateHighlightExpression(success, 'Success When');
                validateHighlightExpression(warning, 'Warning When');
                validateHighlightExpression(danger, 'Danger When');

                if (!!visualDesc && !tryGetDescFromVisual(visualDesc, mainDesc.datatype, () => '', wss, trx)) {
                    throw new Error(`Measure expression ${mainExp} (${mainDesc.datatype}) is incompatible with the selected control.`);
                }

                // Add the measure info
                {
                    const isOrdered = !!orderDir;
                    if (isOrdered) {
                        // Measrues are sorted by sorting the row dimensions they belong to
                        rowInfos.forEach(e => e.orderDir = orderDir);
                    }

                    const desc = visualDesc || mainDesc;
                    const label = !!measure.Label ? () => ws.localize(measure.Label, measure.Label2, measure.Label3) : mainDesc.label;
                    measureInfos.push({
                        exp: mainExp,
                        desc,
                        label,
                        isNumeric: isNumeric(mainDesc),
                        isOrdered,
                        success,
                        warning,
                        danger
                    });
                }
            }

            // Select
            for (const { exp, localize, select } of selectExps) {
                const expToString = exp.toString();
                const desc = QueryexUtil.nativeDesc(exp, userOverrides, autoOverrides, coll, defId, wss, trx);
                let entityDesc: EntityDescriptor;
                switch (desc.datatype) {
                    case 'boolean':
                    case 'hierarchyid':
                    case 'geography':
                        throw new Error(`Select expression ${exp} cannot be of type ${desc.datatype}.`);
                    case 'entity':
                        entityDesc = metadata[desc.control](wss, trx, desc.definitionId);
                }

                // Add the measure info
                const label = !!select.Label ? () => ws.localize(select.Label, select.Label2, select.Label3) : desc.label;
                selectInfos.push({ exp, expToString, localize, desc, entityDesc, label });
            }

            // Result
            {
                // First figure out if the overrides have changed
                let different = false;
                for (const key of Object.keys(autoOverrides)) {
                    const autoOverride = autoOverrides[key];
                    const autoOverridePrev = autoOverridesPrev[key];
                    if (!autoOverridePrev || autoOverridePrev.datatype !== autoOverride.datatype) {
                        different = true;
                        break;
                    }
                }

                if (different) {
                    // Copy back for next iteration
                    for (const key of Object.keys(autoOverrides)) {
                        autoOverridesPrev[key] = autoOverrides[key];
                    }
                } else {
                    // Parameter descriptors have stabilized -> break the loop
                    break;
                }
            }
        }

        // Gather the prams from all expressions that may contain them
        const params: QueryexParameter[] = [];
        const requiredParams: QueryexParameter[] = [];
        if (!!filterExp) {
            filterExp.parametersInner(params);
        }
        if (!!havingExp) {
            havingExp.parametersInner(params);
        }
        for (const { exp, success, warning, danger } of measureInfos) {
            exp.parametersInner(params);
            exp.parametersInner(requiredParams);
            if (!!success) {
                success.parametersInner(params);
                success.parametersInner(requiredParams);
            }
            if (!!warning) {
                warning.parametersInner(params);
                warning.parametersInner(requiredParams);
            }
            if (!!danger) {
                danger.parametersInner(params);
                danger.parametersInner(requiredParams);
            }
        }
        for (const { exp } of selectInfos) {
            exp.parametersInner(params);
            exp.parametersInner(requiredParams);
        }

        const keysDic: { [keyLower: string]: string } = {};
        const keysLower: string[] = [];
        for (const param of params) {
            if (!keysDic[param.keyLower]) {
                keysDic[param.keyLower] = param.key;
                keysLower.push(param.keyLower);
            }
        }

        // Put required parameter keys in a dictionary
        const requiredKeysDic: { [keyLower: string]: boolean } = {};
        for (const param of requiredParams) {
            requiredKeysDic[param.keyLower] = true;
        }

        // This dictionary will contain the undefinitioned parameter Infos
        const rawParameterInfosDic: { [keyLower: string]: ParameterInfo } = {};
        for (const keyLower of keysLower) {

            // Get the key in its proper form
            const key = keysDic[keyLower];

            // Get whether this parameter is used in a measure or a select
            const isRequired = !!requiredKeysDic[keyLower];

            // Get the final descriptor of the parameter
            const desc = autoOverrides[keyLower];

            // Get the label of this parameter
            const label: () => string = desc.label;

            // Get the parameter datatype
            const datatype = desc.datatype;

            // Add to the result
            rawParameterInfosDic[keyLower] = {
                key,
                keyLower,
                desc,
                datatype,
                label,
                isRequired
            };
        }

        const parameterInfos: ParameterInfo[] = [];

        // Override the raw parameters from the definition, The parameter definitions can override the following:
        // (1) Default Expression (sets it from null)
        // (2) Visual Descriptor
        // (3) Is Required
        // (4) Label
        // (5) Order
        for (const dfnParam of definition.Parameters || []) {
            const keyLower = dfnParam.Key.toLowerCase();

            if (dfnParam.Visibility === 'None') {
                // This hides parameters that are explicitly hidden
                delete rawParameterInfosDic[keyLower];
            } else {
                const paramInfo = rawParameterInfosDic[keyLower];
                if (!!paramInfo) {
                    // Here we do the overriding
                    const visibilityIsRequired = dfnParam.Visibility === 'Required';
                    const usedInMeasureOrSelect = paramInfo.isRequired;

                    // (1) Default Expression
                    let defaultExp: QueryexBase;
                    if (!visibilityIsRequired) { // Default expression is ignored when visibility is optional
                        defaultExp = defaultExpressionDic[keyLower];
                        if (!!defaultExp) {
                            // Make sure DefaultExpression can be interpreted to the same final datatype as the parameter
                            const defaultDesc = QueryexUtil.tryDesc(defaultExp, undefined, undefined, paramInfo.datatype, coll, defId, wss, trx);
                            if (!defaultDesc) {
                                throw new Error(`Parameter @${dfnParam.Key}: Default Expression ${defaultExp} could not be interpreted as a ${defaultDesc.datatype}`);
                            } else {
                                paramInfo.defaultExp = defaultExp;
                            }
                        } else if (usedInMeasureOrSelect) {
                            throw new Error(`Parameter @${dfnParam.Key} is used in a measure or a select expression making it required. Either specify its Default Expression or set its Visibility to Required.`);
                        }
                    }

                    // (2) Visual Descriptor
                    // This is already taken care of earlier because we set this desc in userOverrides

                    // (3) Is Required
                    paramInfo.isRequired = visibilityIsRequired;

                    // (4) Label
                    if (!!dfnParam.Label) {
                        paramInfo.label = () => ws.localize(dfnParam.Label, dfnParam.Label2, dfnParam.Label3);
                    }

                    parameterInfos.push(paramInfo);
                    delete rawParameterInfosDic[keyLower];
                }
            }
        }

        // Add the remaining raw parameters as is, since they have no definition overrides
        // Those were most likely just added by the user
        for (const keyLower of Object.keys(rawParameterInfosDic)) {
            const paramInfo = rawParameterInfosDic[keyLower];
            parameterInfos.push(paramInfo);
        }

        // Return the result
        return {
            rows: rowInfos,
            columns: columnInfos,
            measures: measureInfos,
            select: selectInfos,
            filter: filterExp,
            having: havingExp,
            parameters: parameterInfos
        };
    }

    public static nativeDesc(
        exp: QueryexBase,
        userOverrides: { [key: string]: PropVisualDescriptor },
        autoOverrides: { [key: string]: PropDescriptor },
        coll: Collection,
        defId: number,
        wss: WorkspaceService,
        trx: TranslateService) {

        return QueryexUtil.tryDesc(exp, userOverrides, autoOverrides, null, coll, defId, wss, trx);
    }

    public static tryBooleanDesc(
        exp: QueryexBase,
        userOverrides: { [key: string]: PropVisualDescriptor },
        autoOverrides: { [key: string]: PropDescriptor },
        coll: Collection,
        defId: number,
        wss: WorkspaceService,
        trx: TranslateService) {

        return QueryexUtil.tryDesc(exp, userOverrides, autoOverrides, 'boolean', coll, defId, wss, trx);
    }

    public static tryDesc(
        expression: QueryexBase,
        userOverrides: { [key: string]: PropVisualDescriptor },
        autoOverrides: { [key: string]: PropDescriptor },
        t: DataType,
        coll: Collection,
        defId: number,
        wss: WorkspaceService,
        trx: TranslateService): PropDescriptor {

        // We defined everything as inner functions so we don't have to pass 5 parameters with every one of the many recursive calls

        function tryDescImpl(ex: QueryexBase, target: DataType | PropDescriptor): PropDescriptor {
            // Unpack the parameter
            let hintDesc: PropDescriptor;
            let targetType: DataType;
            if (isPropDescriptor(target)) {
                hintDesc = target;
                targetType = target.datatype;
            } else {
                hintDesc = null;
                targetType = target;
            }

            // First check the cases where the requested output can influence the requested input
            if (ex instanceof QueryexFunction) {
                const nameLower = ex.nameLower;
                switch (nameLower) {
                    case 'min':
                    case 'max': {
                        const arg1 = aggregationParameters(ex);
                        const arg1Desc = tryDescImpl(arg1, target);
                        if (!!arg1Desc) {
                            const resultDesc = { ...arg1Desc };

                            const originalLabel = resultDesc.label;
                            const aggregationLabel = () => trx.instant('DefaultAggregationMeasure', {
                                0: trx.instant('Aggregation_' + nameLower),
                                1: originalLabel()
                            });

                            resultDesc.label = aggregationLabel;
                            return resultDesc;
                        } else {
                            return undefined;
                        }
                    }

                    case 'if': {
                        const { arg2, arg3 } = ifParameters(ex);

                        const arg2Desc = tryDescImpl(arg2, target);
                        const arg3Desc = tryDescImpl(arg3, target);

                        if (!!arg2Desc && !!arg3Desc) {
                            return mergeDescriptors(arg2Desc, arg3Desc, () => trx.instant('Expression'));
                        } else {
                            return undefined;
                        }
                    }

                    case 'isnull': {
                        const { arg1, arg2 } = isNullParameters(ex);

                        const arg1Desc = tryDescImpl(arg1, target);
                        const arg2Desc = tryDescImpl(arg2, target);

                        if (!!arg1Desc && !!arg2Desc) {
                            return mergeDescriptors(arg1Desc, arg2Desc, () => trx.instant('Expression'));
                        } else {
                            return undefined;
                        }
                    }
                }
            } else if (ex instanceof QueryexBinaryOperator) {
                // We can omit this one
            } else if (ex instanceof QueryexQuote) {
                switch (targetType) {
                    case 'date':
                    case 'datetime':
                    case 'datetimeoffset': {
                        if (!isNaN(Date.parse(ex.value))) {
                            if (!!hintDesc) {
                                return hintDesc;
                            } else {
                                const label = () => trx.instant('Expression');
                                if (targetType === 'date') {
                                    const control = 'date';
                                    return { datatype: targetType, control, label };

                                } else {
                                    const control = 'datetime';
                                    return { datatype: targetType, control, label };
                                }
                            }
                        } else {
                            return undefined;
                        }
                    }
                }
            } else if (ex instanceof QueryexParameter) {
                const userOverride = userOverrides[ex.keyLower];
                const label = !!hintDesc ? hintDesc.label : () => ex.key;
                let autoOverrideNew: PropDescriptor;
                let result: PropDescriptor;

                // IF we have a userOverride, the result must adhere to both userOverride AND targetType
                if (!!userOverride) {
                    autoOverrideNew = tryGetDescFromVisual(userOverride, targetType, label, wss, trx);
                    if (!!autoOverrideNew) {
                        // Nice and compatible. E.g. targetType = 'numeric', userOverride = 'percent'
                        result = autoOverrideNew;
                    } else {
                        // Not compatible, we hope there is an implicit cast from userOverride to targetType
                        // E.g. targetType = 'number', userOverride = 'check'
                        autoOverrideNew = getLowestPrecedenceDescFromVisual(userOverride, label, wss, trx);
                        result = implicitCast(autoOverrideNew, targetType, hintDesc);
                    }
                } else {
                    // ELSE The result must adhere to targetType
                    if (!!hintDesc) {
                        autoOverrideNew = { ...hintDesc };
                        result = autoOverrideNew;
                    } else {
                        if (targetType === 'boolean') {
                            autoOverrideNew = { datatype: 'bit', control: 'check', label };
                            result = { datatype: targetType, control: 'unsupported', label };
                        } else {
                            autoOverrideNew = tryGetDescFromDatatype(targetType, label);
                            result = autoOverrideNew;
                        }
                    }
                }

                if (!!result) {
                    // We found a valid result, we ensure it does not cause any existing autoOverride
                    // to downgrade (i.e. go from high precedence to low precedence type)
                    const autoOverrideOld = autoOverrides[ex.keyLower];
                    if (!!autoOverrideOld) {
                        if (precedence(autoOverrideOld.datatype) > precedence(autoOverrideNew.datatype)) {
                            // If autoOverride has lower precedence -> upgrade it
                            autoOverrides[ex.keyLower] = autoOverrideNew;
                            return result;
                        } else if (autoOverrideOld.datatype === autoOverrideNew.datatype) {
                            // If they have the same precedence -> merge them
                            autoOverrides[ex.keyLower] = mergeDescriptors(autoOverrideOld, autoOverrideNew, autoOverrideOld.label);
                            return result;
                        } else {
                            // The same parameter is used elsewhere with a higher precedence
                            // E.g. Elsewhere is used as a date and here a string is requested
                            return undefined;
                        }
                    } else {
                        autoOverrides[ex.keyLower] = autoOverrideNew;
                        return result;
                    }
                } else {
                    return undefined;
                }
            }

            // Default: try to cast it implicitly
            const nativeDesc = nativeDescImpl(ex);
            return implicitCast(nativeDesc, targetType, hintDesc);
        }

        function nativeDescImpl(ex: QueryexBase): PropDescriptor {

            if (ex instanceof QueryexColumnAccess) {
                const entityDesc = entityDescriptorImpl(ex.path, coll, defId, wss, trx);

                // Special case for foreign keys
                {
                    const navPropDesc = getNavPropertyFromForeignKey(entityDesc, ex.property);
                    if (!!navPropDesc) {
                        const fkDesc = entityDesc.properties[ex.property];
                        // All nav props without FKs in the metadata have integral FKs
                        const datatype = !!fkDesc ? fkDesc.datatype as 'string' | 'numeric' : 'numeric';
                        const result = {
                            ...navPropDesc,
                        };

                        result.datatype = datatype;
                        return result;
                    }
                }

                const propDesc = entityDesc.properties[ex.property];
                if (!propDesc) {
                    throw new Error(`Property '${ex.property}' does not exist on type ${entityDesc.titleSingular()}.`);
                }

                // Special case for Ids
                if (ex.property === 'Id' && (propDesc.datatype === 'numeric' || propDesc.datatype === 'string')) {
                    if (ex.path.length === 0) {
                        const label = metadata[coll](wss, trx, defId).titleSingular;
                        const result = {
                            datatype: propDesc.datatype,
                            control: coll,
                            definitionId: defId,
                            foreignKeyName: null, // Not needed
                            label
                        };

                        return result;
                    } else {
                        const navEntityDesc = entityDescriptorImpl(ex.path.slice(0, -1), coll, defId, wss, trx);
                        const navPropDesc = navEntityDesc.properties[ex.path[ex.path.length - 1]] as NavigationPropDescriptor;
                        const result = {
                            ...navPropDesc,
                        };

                        result.datatype = propDesc.datatype;
                        return result;
                    }
                }

                // Here we flag multilingual descriptors
                if (propDesc.control === 'text') {
                    const s = wss.currentTenant.settings;
                    if (s.SecondaryLanguageId) {
                        const prop2Desc = entityDesc.properties[ex.property + '2'];
                        if (prop2Desc && prop2Desc.control === 'text') {
                            ex.hasSecondary = true;
                        }
                    }

                    if (s.TernaryLanguageId) {
                        const prop3Desc = entityDesc.properties[ex.property + '3'];
                        if (prop3Desc && prop3Desc.control === 'text') {
                            ex.hasTernary = true;
                        }
                    }
                }

                // Finally return as is
                return propDesc;

            } else if (ex instanceof QueryexFunction) {
                const nameLower = ex.nameLower;
                switch (nameLower) {
                    case 'count':
                    case 'sum':
                    case 'avg':
                    case 'min':
                    case 'max': {
                        const arg1 = aggregationParameters(ex);

                        let resultDesc: PropDescriptor;
                        if (nameLower === 'count' || nameLower === 'min' || nameLower === 'max') {
                            resultDesc = nativeDescImpl(arg1);
                            if (resultDesc.datatype === 'boolean' || resultDesc.datatype === 'entity') {
                                throw new Error(`Function '${ex.name}': The first argument ${arg1} cannot have type ${resultDesc.datatype}.`);
                            }

                            if (nameLower === 'count') {
                                resultDesc = {
                                    datatype: 'numeric',
                                    control: 'number',
                                    maxDecimalPlaces: 0,
                                    minDecimalPlaces: 0,
                                    isRightAligned: true,
                                    label: resultDesc.label
                                };
                            } else {
                                resultDesc = { ...resultDesc };
                            }
                        } else { // sum and avg
                            resultDesc = tryDescImpl(arg1, 'numeric');
                            if (!resultDesc) {
                                throw new Error(`Function '${ex.name}': The first argument ${arg1} could not be interpreted as a numeric.`);
                            } else {
                                resultDesc = mergeArithmeticNumericDescriptors(resultDesc, resultDesc, resultDesc.label);
                            }
                        }

                        const originalLabel = resultDesc.label;
                        const aggregationLabel = () => trx.instant('DefaultAggregationMeasure', {
                            0: trx.instant('Aggregation_' + nameLower),
                            1: originalLabel()
                        });

                        resultDesc.label = aggregationLabel;
                        return resultDesc;
                    }

                    case 'year':
                    case 'quarter':
                    case 'month':
                    case 'day':
                    case 'weekday': {
                        if (ex.arguments.length < 1 || ex.arguments.length > 2) {
                            throw new Error(`No overload for function '${ex.name}' accepts ${ex.arguments.length} arguments.`);
                        }

                        const datePart = nameLower;
                        const arg1 = ex.arguments[0];
                        const arg1Desc = tryDescImpl(arg1, 'date') || tryDescImpl(arg1, 'datetime') || tryDescImpl(arg1, 'datetimeoffset');
                        if (!!arg1Desc) {
                            let calendar: Calendar = 'GR'; // Gregorian
                            if (ex.arguments.length >= 2) {
                                const arg2 = ex.arguments[1];
                                if (arg2 instanceof QueryexQuote) {
                                    calendar = arg2.value.toUpperCase() as Calendar;
                                    if (calendarsArray.indexOf(calendar) < 0) {
                                        throw new Error(`Function '${ex.name}': The second argument ${arg2} must be one of the supported calendars: '${calendarsArray.join(`', '`)}'.`);
                                    }
                                } else {
                                    throw new Error(`Function '${ex.name}': The second argument must be a simple quote like this: 'UQ'.`);
                                }
                            }

                            const label = () => `${arg1Desc.label()} (${trx.instant('DatePart_' + datePart)})`;
                            switch (datePart) {
                                case 'day':
                                case 'year':
                                    return QueryexUtil.yearOrDayDesc(label, trx);
                                case 'quarter':
                                    return QueryexUtil.quarterDesc(label, trx);
                                case 'month':
                                    if (calendar === 'GR') {
                                        return QueryexUtil.monthDesc(label, trx);
                                    } else if (calendar === 'UQ') {
                                        return {
                                            datatype: 'numeric',
                                            control: 'choice',
                                            label,
                                            choices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                                            format: (c: number | string) => !c ? '' : trx.instant(`ShortMonthUq${c}`)
                                        };
                                    } else if (calendar === 'ET') {
                                        return {
                                            datatype: 'numeric',
                                            control: 'choice',
                                            label,
                                            choices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
                                            format: (c: number | string) => !c ? '' : trx.instant(`ShortMonthEt${c}`)
                                        };
                                    } else {
                                        // Should not reach here
                                        const msg = `Unknown calendar ${calendar}`;
                                        console.error(msg);
                                        throw new Error(msg);
                                    }
                                case 'weekday':
                                    return QueryexUtil.weekdayDesc(label, trx);
                                default:
                                    throw new Error('Never'); // To keep compiler happy
                            }

                        } else {
                            throw new Error(`Function '${ex.name}': The first argument ${arg1} could not be interpreted as a date, datetime or datetimeoffset.`);
                        }
                    }

                    case 'adddays':
                    case 'addmonths':
                    case 'addyears': {
                        if (ex.arguments.length < 2 || ex.arguments.length > 3) {
                            throw new Error(`No overload for function '${ex.name}' accepts ${ex.arguments.length} arguments.`);
                        }

                        // Arg #1 Number
                        const arg1 = ex.arguments[0];
                        const arg1Desc = tryDescImpl(arg1, 'numeric');
                        if (!!arg1Desc) {
                            // Hopefully not a nullable expression
                        } else {
                            throw new Error(`Function '${ex.name}': The first argument ${arg1} could not be interpreted as a numeric.`);
                        }

                        // Arg #2 Date
                        const arg2 = ex.arguments[1];
                        const arg2Desc = tryDescImpl(arg2, 'date') || tryDescImpl(arg2, 'datetime') || tryDescImpl(arg2, 'datetimeoffset');
                        if (!arg2Desc) {
                            throw new Error(`Function '${ex.name}': The second argument ${arg2} could not be interpreted as a date, datetime or datetimeoffset.`);
                        }

                        // Arg #3 Calendar
                        let calendar: Calendar = 'GR'; // Gregorian
                        if (ex.arguments.length >= 3) {
                            const arg3 = ex.arguments[2];
                            if (arg3 instanceof QueryexQuote) {
                                calendar = arg3.value.toUpperCase() as Calendar;
                                if (calendarsArray.indexOf(calendar) < 0) {
                                    throw new Error(`Function '${ex.name}': The third argument ${arg3} must be one of the supported calendars: '${calendarsArray.join(`', '`)}'.`);
                                }
                            } else {
                                throw new Error(`Function '${ex.name}': The third argument must be a simple quote like this: 'UQ'.`);
                            }
                        }

                        return { ...arg2Desc };
                    }

                    case 'not': {
                        const expectedArgCount = 1;
                        if (ex.arguments.length !== expectedArgCount) {
                            throw new Error(`Function '${ex.name}' accepts exactly ${expectedArgCount} argument(s).`);
                        }

                        const arg1 = ex.arguments[0];
                        const arg1Desc = tryDescImpl(arg1, 'boolean');
                        if (!!arg1Desc) {
                            return { ...arg1Desc };

                        } else {
                            throw new Error(`Function '${ex.name}': The first argument ${arg1} could not be interpreted as a boolean.`);
                        }
                    }

                    case 'if': {
                        const { arg2, arg3 } = ifParameters(ex);

                        let arg2Desc = nativeDescImpl(arg2);
                        const arg2Type = arg2Desc.datatype;
                        if (arg2Type === 'boolean' || arg2Type === 'entity') {
                            throw new Error(`Function '${ex.name}': The second argument ${arg2} cannot have a type ${arg2Type}.`);
                        }

                        let arg3Desc = nativeDescImpl(arg3);
                        const arg3Type = arg3Desc.datatype;
                        if (arg3Type === 'boolean' || arg3Type === 'entity') {
                            throw new Error(`Function '${ex.name}': The third argument ${arg3} cannot have a type ${arg3Type}.`);
                        }

                        if (precedence(arg2Type) > precedence(arg3Type)) {
                            arg2Desc = tryDescImpl(arg2, arg3Desc);
                        } else if (precedence(arg3Type) > precedence(arg2Type)) {
                            arg3Desc = tryDescImpl(arg3, arg2Desc);
                        }

                        if (!arg2Desc || !arg3Desc) {
                            throw new Error(`Function '${ex.name}' cannot be used on expressions ${arg2} (${arg2Type}) and ${arg3} (${arg3Type}) because they have incompatible data types.`);
                        }

                        return mergeDescriptors(arg2Desc, arg3Desc, () => trx.instant('Expression'));
                    }

                    case 'isnull': {
                        const { arg1, arg2 } = isNullParameters(ex);

                        let arg1Desc = nativeDescImpl(arg1);
                        const arg1Type = arg1Desc.datatype;
                        if (arg1Type === 'boolean' || arg1Type === 'entity') {
                            throw new Error(`Function '${ex.name}': The first argument ${arg1} cannot have type ${arg1Type}.`);
                        }

                        let arg2Desc = nativeDescImpl(arg2);
                        const arg2Type = arg2Desc.datatype;
                        if (arg2Type === 'boolean' || arg2Type === 'entity') {
                            throw new Error(`Function '${ex.name}': The second argument ${arg2} cannot have type ${arg2Type}.`);
                        }

                        if (precedence(arg1Type) > precedence(arg2Type)) {
                            arg1Desc = tryDescImpl(arg1, arg2Desc);
                        } else if (precedence(arg2Type) > precedence(arg1Type)) {
                            arg2Desc = tryDescImpl(arg2, arg1Desc);
                        }

                        if (!arg1Desc || !arg2Desc) {
                            throw new Error(`Function '${ex.name}' cannot be used on expressions ${arg1} (${arg1Type}) and ${arg2} (${arg2Type}) because they have incompatible data types.`);
                        }

                        return mergeDescriptors(arg1Desc, arg2Desc, () => trx.instant('Expression'));
                    }

                    case 'today': {
                        if (ex.arguments.length > 0) {
                            throw new Error(`Function '${ex.name}' does not accept any arguments.`);
                        }

                        return {
                            datatype: 'date',
                            control: 'date',
                            label: () => trx.instant('Today')
                        };
                    }

                    case 'now': {
                        if (ex.arguments.length > 0) {
                            throw new Error(`Function '${ex.name}' does not accept any arguments.`);
                        }

                        return {
                            datatype: 'datetimeoffset',
                            control: 'datetime',
                            label: () => trx.instant('Now')
                        };
                    }

                    case 'me': {
                        if (ex.arguments.length > 0) {
                            throw new Error(`Function '${ex.name}' does not accept any arguments.`);
                        }

                        return {
                            datatype: 'numeric',
                            control: 'number',
                            minDecimalPlaces: 0,
                            maxDecimalPlaces: 0,
                            label: () => trx.instant('CurrentUser'),
                            isRightAligned: false
                        };
                    }

                    default:
                        {
                            throw new Error(`Unknown function '${ex.name}'.`);
                        }
                }
            } else if (ex instanceof QueryexBinaryOperator) {
                const opLower = ex.operator.toLowerCase();
                switch (opLower) {
                    case '+': {
                        let leftDesc = tryDescImpl(ex.left, 'numeric');
                        let rightDesc = tryDescImpl(ex.right, leftDesc || 'numeric');

                        const label = () => trx.instant('Expression');

                        if (!leftDesc || !rightDesc) {
                            leftDesc = tryDescImpl(ex.left, 'string');
                            rightDesc = tryDescImpl(ex.right, 'string');

                            if (!leftDesc || !rightDesc) {
                                const leftType = nativeDescImpl(ex.left).datatype;
                                const rightType = nativeDescImpl(ex.right).datatype;
                                throw new Error(`Operator '${ex.operator}' cannot be used on expressions ${ex.left} (${leftType}) and ${ex.right} (${rightType}) because they have incompatible data types.`);
                            }

                            return {
                                datatype: 'string',
                                control: 'text',
                                label
                            };
                        }

                        return mergeArithmeticNumericDescriptors(leftDesc, rightDesc, label);
                    }

                    case '-':
                    case '*':
                    case '/':
                    case '%': {
                        const leftDesc = tryDescImpl(ex.left, 'numeric');
                        if (!leftDesc) {
                            throw new Error(`Operator '${ex.operator}': Left operand ${ex.left} could not be interpreted as a numeric.`);
                        }

                        const rightDesc = tryDescImpl(ex.right, 'numeric');
                        if (!rightDesc) {
                            throw new Error(`Operator '${ex.operator}': Right operand ${ex.right} could not be interpreted as a numeric.`);
                        }

                        const label = () => trx.instant('Expression');
                        return mergeArithmeticNumericDescriptors(leftDesc, rightDesc, label);
                    }

                    case '&&':
                    case 'and':
                    case '||':
                    case 'or': {
                        const leftDesc = tryDescImpl(ex.left, 'boolean');
                        if (!leftDesc) {
                            throw new Error(`Operator '${ex.operator}': Left operand ${ex.left} could not be interpreted as a boolean.`);
                        }

                        const rightDesc = tryDescImpl(ex.right, 'boolean');
                        if (!rightDesc) {
                            throw new Error(`Operator '${ex.operator}': Right operand ${ex.right} could not be interpreted as a boolean.`);
                        }

                        return {
                            datatype: 'boolean',
                            control: 'unsupported',
                            label: () => trx.instant('Expression')
                        };
                    }
                    case '<>':
                    case '!=':
                    case 'ne':
                    case '>':
                    case 'gt':
                    case '>=':
                    case 'ge':
                    case '<':
                    case 'lt':
                    case '<=':
                    case 'le':
                    case '=':
                    case 'eq': {
                        const left = ex.left;
                        let leftDesc = nativeDescImpl(left);
                        const leftType = leftDesc.datatype;
                        if (leftType === 'boolean' || leftType === 'entity') {
                            throw new Error(`Operator '${ex.operator}': The left operand ${left} cannot have type ${leftType}.`);
                        }

                        const right = ex.right;
                        let rightDesc = nativeDescImpl(right);
                        const rightType = rightDesc.datatype;
                        if (rightType === 'boolean' || rightType === 'entity') {
                            throw new Error(`Operator '${ex.operator}': The right operand ${right} cannot have type ${rightType}.`);
                        }

                        if (precedence(leftType) > precedence(rightType)) {
                            leftDesc = tryDescImpl(left, rightDesc);
                        } else if (precedence(rightType) > precedence(leftType)) {
                            rightDesc = tryDescImpl(right, leftDesc);
                        }

                        if (!leftDesc || !rightDesc) {
                            throw new Error(`Operator '${ex.operator}' cannot be used on expressions ${left} (${leftType}) and ${right} (${rightType}) because they have incompatible data types.`);
                        }

                        return {
                            datatype: 'boolean',
                            control: 'unsupported',
                            label: () => trx.instant('Expression')
                        };
                    }

                    case 'descof': {
                        if (!(ex.left instanceof QueryexColumnAccess)) {
                            throw new Error(`Operator '${ex.operator}': The left operand ${ex.left} must be a column access like AccountType.Concept.`);
                        }

                        const ca = ex.right.columnAccesses()[0];
                        if (ca === ex.right) {
                            throw new Error(`Operator '${ex.operator}': The right operand cannot be a column access expression like ${ca}.`);
                        } else if (!!ca) {
                            throw new Error(`Operator '${ex.operator}': The right operand cannot contain a column access expression like ${ca}.`);
                        }

                        const left = ex.left;
                        let leftDesc = nativeDescImpl(left);
                        const leftType = leftDesc.datatype;
                        if (leftType === 'boolean' || leftType === 'entity') {
                            throw new Error(`Operator '${ex.operator}': The left operand ${left} cannot have type ${leftType}.`);
                        }

                        const right = ex.right;
                        let rightDesc = nativeDescImpl(right);
                        const rightType = rightDesc.datatype;
                        if (rightType === 'boolean' || rightType === 'entity') {
                            throw new Error(`Operator '${ex.operator}': The right operand ${right} cannot have type ${rightType}.`);
                        }

                        if (precedence(leftType) > precedence(rightType)) {
                            leftDesc = tryDescImpl(left, rightDesc);
                        } else if (precedence(rightType) > precedence(leftType)) {
                            rightDesc = tryDescImpl(right, leftDesc);
                        }

                        if (!leftDesc || !rightDesc) {
                            throw new Error(`Operator '${ex.operator}' cannot be used on expressions ${left} (${leftType}) and ${right} (${rightType}) because they have incompatible data types.`);
                        }

                        return {
                            datatype: 'boolean',
                            control: 'unsupported',
                            label: () => trx.instant('Expression')
                        };
                    }

                    case 'contains':
                    case 'startsw':
                    case 'endsw': {
                        const leftDesc = tryDescImpl(ex.left, 'string');
                        if (!leftDesc) {
                            throw new Error(`Operator '${ex.operator}': Left operand ${ex.left} could not be interpreted as string.`);
                        }

                        const rightDesc = tryDescImpl(ex.right, leftDesc);
                        if (!rightDesc) {
                            throw new Error(`Operator '${ex.operator}': Right operand ${ex.right} could not be interpreted as string.`);
                        }

                        return {
                            datatype: 'boolean',
                            control: 'unsupported',
                            label: () => trx.instant('Expression')
                        };
                    }
                }
            } else if (ex instanceof QueryexUnaryOperator) {
                const opLower = ex.operator.toLowerCase();
                switch (opLower) {
                    case '+':
                    case '-': {
                        const desc = tryDescImpl(ex.operand, 'numeric');
                        if (!desc) {
                            throw new Error(`Operator '${ex.operator}': Operand ${ex.operand} could not be interpreted as numeric.`);
                        }

                        if (opLower === '+') {
                            return { ...desc }; // +ve sign doesn't change anything
                        } else if (desc.control === 'number' || desc.control === 'percent') {
                            // -ve sign: If the inside is a plain number or a percent, preserve it
                            return {
                                datatype: 'numeric',
                                control: desc.control,
                                maxDecimalPlaces: desc.maxDecimalPlaces,
                                minDecimalPlaces: desc.minDecimalPlaces,
                                label: () => trx.instant('Expression'),
                                isRightAligned: desc.isRightAligned
                            };
                        } else { // serial, choice, entity
                            // Serial, choice, entity: turn it into plain number
                            return {
                                datatype: 'numeric',
                                control: 'number',
                                maxDecimalPlaces: 0,
                                minDecimalPlaces: 0,
                                label: () => trx.instant('Expression'),
                                isRightAligned: false
                            };
                        }
                    }

                    case '!':
                    case 'not': {
                        const desc = tryDescImpl(ex.operand, 'boolean');
                        if (!desc) {
                            throw new Error(`Operator '${ex.operator}': Operand ${ex.operand} could not be interpreted as boolean.`);
                        }

                        return {
                            datatype: 'boolean',
                            control: 'unsupported',
                            label: () => trx.instant('Expression')
                        };
                    }
                }
            } else if (ex instanceof QueryexQuote) {
                return {
                    datatype: 'string',
                    control: 'text',
                    label: () => ex.toString()
                };
            } else if (ex instanceof QueryexNumber) {
                return {
                    datatype: 'numeric',
                    control: 'number',
                    minDecimalPlaces: ex.decimals,
                    maxDecimalPlaces: ex.decimals,
                    label: () => ex.toString(),
                    isRightAligned: true
                };
            } else if (ex instanceof QueryexNull) {
                return {
                    datatype: 'null',
                    control: 'null',
                    label: () => ''
                };
            } else if (ex instanceof QueryexBit) {
                return {
                    datatype: 'bit',
                    control: 'check',
                    label: () => ex.value ? trx.instant('Yes') : trx.instant('No')
                };
            } else if (ex instanceof QueryexParameter) {
                const userOverride = userOverrides[ex.keyLower];
                if (!!userOverride) {
                    const label = () => ex.key;
                    const result = getLowestPrecedenceDescFromVisual(userOverride, label, wss, trx);
                    autoOverrides[ex.keyLower] = result;
                    return result;
                } else {
                    const autoOverride = autoOverrides[ex.keyLower];
                    if (!!autoOverride) {
                        return { ...autoOverride };
                    } else {
                        const label = () => ex.key;
                        const result: PropDescriptor = { datatype: 'null', control: 'null', label };
                        autoOverrides[ex.keyLower] = result;
                        return result;
                    }
                }
            } else {
                throw Error(`[Bug] ${ex} has an unknown Queryex type.`);
            }
        }

        function aggregationParameters(ex: QueryexFunction): QueryexBase {
            if (ex.arguments.length < 1 || ex.arguments.length > 2) {
                throw new Error(`No overload for function '${ex.name}' accepts ${ex.arguments.length} arguments.`);
            }

            // Argument #1
            const arg1 = ex.arguments[0];

            // Argument #2
            if (ex.arguments.length >= 2) {
                const arg2 = ex.arguments[1];
                const arg2Desc = tryDescImpl(arg2, 'boolean');
                if (!arg2Desc) {
                    throw new Error(`Function '${ex.name}': The second argument ${arg2} could not be interpreted as a boolean.`);
                }
            }

            return arg1;
        }

        function ifParameters(ex: QueryexFunction): { arg2: QueryexBase, arg3: QueryexBase } {
            const expectedArgCount = 3;
            if (ex.arguments.length !== expectedArgCount) {
                throw new Error(`Function '${ex.name}' accepts exactly ${expectedArgCount} argument(s).`);
            }

            const arg1 = ex.arguments[0];
            const arg1Desc = tryDescImpl(arg1, 'boolean');
            if (!arg1Desc) {
                throw new Error(`Function '${ex.name}': The first argument ${arg1} could not be interpreted as a boolean.`);
            }

            const arg2 = ex.arguments[1];
            const arg3 = ex.arguments[2];

            return { arg2, arg3 };
        }

        function isNullParameters(ex: QueryexFunction): { arg1: QueryexBase, arg2: QueryexBase } {
            const expectedArgCount = 2;
            if (ex.arguments.length !== expectedArgCount) {
                throw new Error(`Function '${ex.name}' accepts exactly ${expectedArgCount} argument(s).`);
            }

            const arg1 = ex.arguments[0];
            const arg2 = ex.arguments[1];

            return { arg1, arg2 };
        }

        if (!!t) {
            return tryDescImpl(expression, t);
        } else {
            return nativeDescImpl(expression);
        }
    }

    public static evaluateExp(expression: QueryexBase, aggregationValues: any[], args: { [keyLower: string]: any }, wss: WorkspaceService): any {

        function normalize(v: any) {
            if (v === undefined) {
                return null;
            }

            return v;
        }

        function evaluate(ex: QueryexBase) {

            if (ex instanceof QueryexColumnAccess) {

            } else if (ex instanceof QueryexFunction) {
                const nameLower = ex.name.toLowerCase();
                switch (nameLower) {
                    case 'count':
                    case 'sum':
                    case 'min':
                    case 'max':
                        return normalize(aggregationValues[ex.index]);
                    case 'avg': {
                        const sum = normalize(aggregationValues[ex.sumIndex]) as number;
                        const count = normalize(aggregationValues[ex.countIndex]) as number;

                        return sum === null || count === null ? null : sum / count;
                    }
                    case 'year':
                    case 'quarter':
                    case 'month':
                    case 'day':
                    case 'weekday': {
                        throw new Error(`Not implemented`);
                    }

                    case 'adddays': {
                        const n = evaluate(ex.arguments[0]);
                        if (n === null) {
                            return null;
                        }

                        const date = new Date(evaluate(ex.arguments[1]));
                        date.setDate(date.getDate() + n);
                        return toLocalDateISOString(date); // TODO: handle datetimeoffset
                    }

                    case 'addmonths':
                    case 'addyears': {
                        throw new Error(`Not implemented`);
                    }

                    case 'not': {
                        const arg = evaluate(ex.arguments[0]) as boolean;
                        return !arg;
                    }

                    case 'if': {
                        const condition = evaluate(ex.arguments[0]) as boolean;
                        return condition ? evaluate(ex.arguments[1]) : evaluate(ex.arguments[2]);
                    }

                    case 'isnull': {
                        const exp = evaluate(ex.arguments[0]);
                        return exp !== null ? exp : evaluate(ex.arguments[1]);
                    }

                    case 'today':
                        return toLocalDateISOString(new Date());

                    case 'now':
                        return new Date().toISOString();

                    case 'me':
                        return wss.currentTenant.userSettings.UserId;

                    default: {
                        throw new Error(`Unknown function '${ex.name}'.`);
                    }
                }
            } else if (ex instanceof QueryexBinaryOperator) {
                const opLower = ex.operator.toLowerCase();
                const left = evaluate(ex.left);
                const right = evaluate(ex.right);
                switch (opLower) {
                    case '+':
                        return left === null || right === null ? null : left + right;
                    case '-':
                        return left === null || right === null ? null : left - right;
                    case '*':
                        return left === null || right === null ? null : left * right;
                    case '/':
                        return left === null || right === null ? null : left / right;
                    case '%':
                        return left === null || right === null ? null : left % right;

                    case '&&':
                    case 'and':
                        return left && right;
                    case '||':
                    case 'or':
                        return left || right;

                    case '<>':
                    case '!=':
                    case 'ne':
                        return left !== right; // JS handles nulls the way we want it
                    case '>':
                    case 'gt':
                        return left === null || right === null ? false : left > right;
                    case '>=':
                    case 'ge':
                        return left === null || right === null ? false : left >= right;
                    case '<':
                    case 'lt':
                        return left === null || right === null ? false : left < right;
                    case '<=':
                    case 'le':
                        return left === null || right === null ? false : left <= right;
                    case '=':
                    case 'eq':
                        return left === right; // JS handles nulls the way we want it

                    case 'descof': {
                        // Not possible in theory
                        throw new Error(`descof not implemented`);
                    }

                    case 'contains':
                        return left === null || right === null ? false : (left as string).includes((right as string));
                    case 'startsw':
                        return left === null || right === null ? false : (left as string).startsWith((right as string));
                    case 'endsw': {
                        return left === null || right === null ? false : (left as string).endsWith((right as string));
                    }
                }
            } else if (ex instanceof QueryexUnaryOperator) {
                const opLower = ex.operator.toLowerCase();
                const operand = evaluate(ex.operand);
                switch (opLower) {
                    case '+':
                        return operand;
                    case '-':
                        return -operand;
                    case '!':
                    case 'not':
                        return !operand;
                }
            } else if (ex instanceof QueryexQuote) {
                return ex.value;
            } else if (ex instanceof QueryexNumber) {
                return ex.value;
            } else if (ex instanceof QueryexNull) {
                return null;
            } else if (ex instanceof QueryexBit) {
                return ex.value;
            } else if (ex instanceof QueryexParameter) {
                const result = args[ex.keyLower];
                return isSpecified(result) ? result : null; // normalization
            } else {
                throw Error(`[Bug] ${ex} has an unknown Queryex type.`);
            }
        }

        return evaluate(expression);
    }
}
