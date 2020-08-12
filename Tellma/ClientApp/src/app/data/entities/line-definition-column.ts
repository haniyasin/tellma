import { EntityForSave } from './base/entity-for-save';
import { EntryColumnName } from '../dto/definitions-for-client';
import { PositiveLineState } from './line';

export interface LineDefinitionColumnForSave extends EntityForSave {
    ColumnName?: EntryColumnName;
    EntryIndex?: number;
    Label?: string;
    Label2?: string;
    Label3?: string;
    InheritsFromHeader?: boolean;
    VisibleState?: PositiveLineState | 5;
    RequiredState?: PositiveLineState | 5;
    ReadOnlyState?: PositiveLineState | 5;
}

export interface LineDefinitionColumn extends LineDefinitionColumnForSave {
    LineDefinitionId?: number;
    SavedById?: number;
}
