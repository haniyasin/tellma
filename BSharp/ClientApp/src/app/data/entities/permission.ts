// tslint:disable:variable-name
import { EntityForSave } from '../entities/base/entity-for-save';
import { Action } from '../views';

export class PermissionForSave extends EntityForSave {
  ViewId: Action;
  Action: 'Read' | 'Update' | 'Delete' | 'IsActive' | 'ResendInvitationEmail';
  Criteria: string;
  Mask: string;
  Memo: string;
}

export class Permission extends PermissionForSave {
  RoleId: number;
  CreatedAt: string;
  CreatedById: number | string;
  ModifiedAt: string;
  ModifiedById: number | string;
}
