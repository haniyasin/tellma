// tslint:disable:variable-name
// tslint:disable:max-line-length
import { TenantWorkspace, WorkspaceService } from '../workspace.service';
import { TranslateService } from '@ngx-translate/core';
import { EntityDescriptor, NavigationPropDescriptor, BooleanPropDescriptor } from './base/metadata';
import { SettingsForClient } from '../dto/settings-for-client';
import { DefinitionsForClient } from '../dto/definitions-for-client';
import { LineForSave, Line, LineState } from './line';
import { DocumentAssignment } from './document-assignment';
import { AttachmentForSave, Attachment } from './attachment';
import { EntityForSave } from './base/entity-for-save';
import { DocumentStateChange } from './document-state-change';

export type DocumentState = 0 | 1 | -1;
export type DocumentClearance = 0 | 1 | 2;

export interface DocumentForSave<TLine = LineForSave, TAttachment = AttachmentForSave> extends EntityForSave {
    SerialNumber?: number;
    PostingDate?: string;
    Clearance?: DocumentClearance;
    Memo?: string;
    MemoIsCommon?: boolean;
    DebitAgentId?: number;
    DebitAgentIsCommon?: boolean;
    CreditAgentId?: number;
    CreditAgentIsCommon?: boolean;
    NotedAgentId?: number;
    NotedAgentIsCommon?: boolean;
    InvestmentCenterId?: number;
    InvestmentCenterIsCommon?: boolean;
    Time1?: string;
    Time1IsCommon?: boolean;
    Time2?: string;
    Time2IsCommon?: boolean;
    Quantity?: number;
    QuantityIsCommon?: boolean;
    UnitId?: number;
    UnitIsCommon?: boolean;
    CurrencyId?: string;
    CurrencyIsCommon?: boolean;

    Lines?: TLine[];
    Attachments?: TAttachment[];
}

export interface Document extends DocumentForSave<Line, Attachment> {
    DefinitionId?: string;
    State?: DocumentState;
    StateAt?: string;
    Comment?: string;
    AssigneeId?: number;
    AssignedAt?: string;
    AssignedById?: number;
    OpenedAt?: string;
    CreatedAt?: string;
    CreatedById?: number;
    ModifiedAt?: string;
    ModifiedById?: number;
    AssignmentsHistory?: DocumentAssignment[];
    StatesHistory?: DocumentStateChange[];
}

const _select = ['SerialNumber'];
let _settings: SettingsForClient;
let _definitions: DefinitionsForClient;
let _cache: { [defId: string]: EntityDescriptor } = {};
let _definitionIds: string[];

export function metadata_Document(wss: WorkspaceService, trx: TranslateService, definitionId: string): EntityDescriptor {
    const ws = wss.currentTenant;
    // Some global values affect the result, we check here if they have changed, otherwise we return the cached result
    if (ws.settings !== _settings || ws.definitions !== _definitions) {
        _settings = ws.settings;
        _definitions = ws.definitions;
        _definitionIds = null;

        // clear the cache
        _cache = {};
    }

    const key = definitionId || '-'; // undefined
    if (!_cache[key]) {
        if (!_definitionIds) {
            _definitionIds = Object.keys(ws.definitions.Documents);
        }

        const entityDesc: EntityDescriptor = {
            collection: 'Document',
            definitionId,
            definitionIds: _definitionIds,
            titleSingular: () => ws.getMultilingualValueImmediate(ws.definitions.Documents[definitionId], 'TitleSingular') || trx.instant('Document'),
            titlePlural: () => ws.getMultilingualValueImmediate(ws.definitions.Documents[definitionId], 'TitlePlural') || trx.instant('Documents'),
            select: _select,
            apiEndpoint: !!definitionId ? `documents/${definitionId}` : 'documents',
            screenUrl: !!definitionId ? `documents/${definitionId}` : 'documents',
            orderby: () => ws.isSecondaryLanguage ? [_select[1], _select[0]] : ws.isTernaryLanguage ? [_select[2], _select[0]] : [_select[0]],
            format: (doc: Document) => !!doc.SerialNumber ? formatSerial(doc.SerialNumber, getPrefix(ws, doc.DefinitionId || definitionId), getCodeWidth(ws, doc.DefinitionId || definitionId)) : `(${trx.instant('New')})`,
            properties: {
                Id: { control: 'number', label: () => trx.instant('Id'), minDecimalPlaces: 0, maxDecimalPlaces: 0 },
                DefinitionId: { control: 'text', label: () => `${trx.instant('Definition')} (${trx.instant('Id')})` },
                Definition: { control: 'navigation', label: () => trx.instant('Definition'), type: 'DocumentDefinition', foreignKeyName: 'DefinitionId' },
                PostingDate: { control: 'date', label: () => trx.instant('Document_PostingDate') },
                Clearance: {
                    control: 'choice',
                    label: () => trx.instant('Document_Clearance'),
                    choices: [0, 1, 2],
                    format: (c: number) => trx.instant('Document_Clearance_' + c)
                },
                Memo: { control: 'text', label: () => trx.instant('Memo') },
                MemoIsCommon: { control: 'boolean', label: () => trx.instant('Document_MemoIsCommon') },
                DebitAgentId: { control: 'number', label: () => `${trx.instant('Document_DebitAgent')} (${trx.instant('Id')})`, minDecimalPlaces: 0, maxDecimalPlaces: 0 },
                DebitAgent: { control: 'navigation', label: () => trx.instant('Document_DebitAgent'), type: 'Agent', foreignKeyName: 'DebitAgentId' },
                DebitAgentIsCommon: { control: 'boolean', label: () => trx.instant('Document_DebitAgentIsCommon') },
                CreditAgentId: { control: 'number', label: () => `${trx.instant('Document_CreditAgent')} (${trx.instant('Id')})`, minDecimalPlaces: 0, maxDecimalPlaces: 0 },
                CreditAgent: { control: 'navigation', label: () => trx.instant('Document_CreditAgent'), type: 'Agent', foreignKeyName: 'CreditAgentId' },
                CreditAgentIsCommon: { control: 'boolean', label: () => trx.instant('Document_CreditAgentIsCommon') },
                NotedAgentId: { control: 'number', label: () => `${trx.instant('Document_NotedAgent')} (${trx.instant('Id')})`, minDecimalPlaces: 0, maxDecimalPlaces: 0 },
                NotedAgent: { control: 'navigation', label: () => trx.instant('Document_NotedAgent'), type: 'Agent', foreignKeyName: 'NotedAgentId' },
                NotedAgentIsCommon: { control: 'boolean', label: () => trx.instant('Document_NotedAgentIsCommon') },
                InvestmentCenterId: { control: 'number', label: () => `${trx.instant('Document_InvestmentCenter')} (${trx.instant('Id')})`, minDecimalPlaces: 0, maxDecimalPlaces: 0 },
                InvestmentCenter: { control: 'navigation', label: () => trx.instant('Document_InvestmentCenter'), type: 'Center', foreignKeyName: 'InvestmentCenterId' },
                InvestmentCenterIsCommon: { control: 'boolean', label: () => trx.instant('Document_InvestmentCenterIsCommon') },
                Time1: { control: 'date', label: () => trx.instant('Document_Time1') },
                Time1IsCommon: { control: 'boolean', label: () => trx.instant('Document_Time1IsCommon') },
                Time2: { control: 'date', label: () => trx.instant('Document_Time2') },
                Time2IsCommon: { control: 'boolean', label: () => trx.instant('Document_Time2IsCommon') },
                Quantity: { control: 'number', label: () => trx.instant('Document_Quantity'), minDecimalPlaces: 0, maxDecimalPlaces: 4 },
                QuantityIsCommon: { control: 'boolean', label: () => trx.instant('Document_QuantityIsCommon') },
                UnitId: { control: 'number', label: () => `${trx.instant('Document_Unit')} (${trx.instant('Id')})`, minDecimalPlaces: 0, maxDecimalPlaces: 0 },
                Unit: { control: 'navigation', label: () => trx.instant('Document_Unit'), type: 'Unit', foreignKeyName: 'UnitId' },
                UnitIsCommon: { control: 'boolean', label: () => trx.instant('Document_UnitIsCommon') },
                CurrencyId: { control: 'text', label: () => `${trx.instant('Document_Currency')} (${trx.instant('Id')})` },
                Currency: { control: 'navigation', label: () => trx.instant('Document_Currency'), type: 'Currency', foreignKeyName: 'CurrencyId' },
                CurrencyIsCommon: { control: 'boolean', label: () => trx.instant('Document_CurrencyIsCommon') },
                SerialNumber: {
                    control: 'serial', label: () => trx.instant('Document_SerialNumber'),
                    format: (serial: number) => formatSerial(serial, getPrefix(ws, definitionId), getCodeWidth(ws, definitionId))
                },
                State: {
                    control: 'state',
                    label: () => trx.instant('Document_State'),
                    choices: [0, -1, 1],
                    format: (state: number) => {
                        if (state >= 0) {
                            return trx.instant('Document_State_' + state);
                        } else {
                            return trx.instant('Document_State_minus_' + (-state));
                        }
                    },
                    color: (c: number) => {
                        switch (c) {
                            case 0: return '#6c757d';
                            case -1: return '#dc3545';
                            case 1: return '#28a745';
                            default: return null;
                        }
                    }
                },
                StateAt: { control: 'datetime', label: () => trx.instant('Document_StateAt') },

                AssigneeId: { control: 'number', label: () => `${trx.instant('Document_Assignee')} (${trx.instant('Id')})`, minDecimalPlaces: 0, maxDecimalPlaces: 0 },
                Assignee: { control: 'navigation', label: () => trx.instant('Document_Assignee'), type: 'User', foreignKeyName: 'AssigneeId' },
                AssignedById: { control: 'number', label: () => `${trx.instant('Document_AssignedBy')} (${trx.instant('Id')})`, minDecimalPlaces: 0, maxDecimalPlaces: 0 },
                AssignedBy: { control: 'navigation', label: () => trx.instant('Document_AssignedBy'), type: 'User', foreignKeyName: 'AssignedById' },
                AssignedAt: { control: 'datetime', label: () => trx.instant('Document_AssignedAt') },

                // Audit
                CreatedAt: { control: 'datetime', label: () => trx.instant('CreatedAt') },
                CreatedBy: { control: 'navigation', label: () => trx.instant('CreatedBy'), type: 'User', foreignKeyName: 'CreatedById' },
                ModifiedAt: { control: 'datetime', label: () => trx.instant('ModifiedAt') },
                ModifiedBy: { control: 'navigation', label: () => trx.instant('ModifiedBy'), type: 'User', foreignKeyName: 'ModifiedById' }
            }
        };

        // Adjust according to definitions
        const definition = _definitions.Documents[definitionId];
        if (!definition) {
            if (!!definitionId) {
                // Programmer mistake
                console.error(`defintionId '${definitionId}' doesn't exist`);
            }
        } else {
            const props = entityDesc.properties;
            delete props.DefinitionId;
            delete props.Definition;

            // Simple properties whose label and visibility are overriden by the definition
            for (const propName of ['Time1', 'Time2', 'Quantity', 'Memo']) {
                if (!definition[propName + 'Visibility']) {
                    delete props[propName];
                    delete props[propName + 'IsCommon'];
                } else {

                    // Nav property
                    const propDesc = props[propName];
                    const defaultLabel = propDesc.label;
                    propDesc.label = () => ws.getMultilingualValueImmediate(definition, propName + 'Label') || defaultLabel();

                    // IsCommon property
                    const isCommonPropDesc = props[propName + 'IsCommon'] as BooleanPropDescriptor;
                    isCommonPropDesc.label = () => trx.instant('XIsCommon', { 0: propDesc.label() });
                }
            }

            if (!definition.MemoIsCommonVisibility) {
                // Memo in particular can remain visible without MemoIsCommon
                delete props.MemoIsCommon;
            }

            // Navigation properties whose label and visibility are overriden by the definition
            for (const propName of ['DebitAgent', 'CreditAgent', 'NotedAgent', 'InvestmentCenter', 'Unit', 'Currency']) {
                if (!definition[propName + 'Visibility']) {

                    delete props[propName + 'Id'];
                    delete props[propName];
                    delete props[propName + 'IsCommon'];
                } else {

                    // Nav property
                    const propDesc = props[propName] as NavigationPropDescriptor;
                    const defaultLabel = propDesc.label;
                    propDesc.label = () => ws.getMultilingualValueImmediate(definition, propName + 'Label') || defaultLabel();

                    if (definition[propName + 'DefinitionId']) {
                        propDesc.definition = definition[propName + 'DefinitionId'];
                    }

                    // Foreign key property
                    const idPropDesc = props[propName + 'Id'];
                    idPropDesc.label = () => `${propDesc.label()} (${trx.instant('Id')})`;

                    // IsCommon property
                    const isCommonPropDesc = props[propName + 'IsCommon'] as BooleanPropDescriptor;
                    isCommonPropDesc.label = () => trx.instant('XIsCommon', { 0: propDesc.label() });
                }
            }
        }

        _cache[key] = entityDesc;
    }

    return _cache[key];
}

export function formatSerial(serial: number, prefix: string, codeWidth: number) {

    // Handle null and 0
    if (serial === null || serial === undefined) {
        return null;
    }

    let result = serial.toString();

    // Add a padding of zeros when needed
    if (result.length < codeWidth) {
        result = '00000000000000000'.substring(0, codeWidth - result.length) + result;
    }

    // Prepend the prefix
    if (!!prefix) {
        result = prefix + result;
    }

    // Return the result
    return result;
}

function getPrefix(ws: TenantWorkspace, definitionId: string) {
    const def = ws.definitions.Documents[definitionId];
    return !!def ? def.Prefix : '';
}

function getCodeWidth(ws: TenantWorkspace, definitionId: string) {
    const def = ws.definitions.Documents[definitionId];
    return !!def ? def.CodeWidth : 4;
}
