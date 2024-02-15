import {
  Component, ElementRef, Input, OnDestroy, ViewChild, HostBinding, TemplateRef, OnChanges, SimpleChanges, OnInit, Output, EventEmitter
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgbDropdown, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PlacementArray } from '@ng-bootstrap/ng-bootstrap/util/positioning';
import { fromEvent, of, Subject, Subscription } from 'rxjs';
import { catchError, debounceTime, map, switchMap, tap, exhaustMap } from 'rxjs/operators';
import { ApiService } from '~/app/data/api.service';
import { GetResponse } from '~/app/data/dto/get-response';
import { WorkspaceService } from '~/app/data/workspace.service';
import { addToWorkspace, Key, computeSelectForDetailsPicker } from '~/app/data/util';
import { TranslateService } from '@ngx-translate/core';
import { metadata, EntityDescriptor, Collection } from '~/app/data/entities/base/metadata';
import { GetArguments } from '~/app/data/dto/get-arguments';

enum SearchStatus {
  showSpinner = 'showSpinner',
  showResults = 'showResults',
  showError = 'showError'
}

@Component({
  selector: 't-details-picker',
  templateUrl: './details-picker.component.html',
  providers: [{ provide: NG_VALUE_ACCESSOR, multi: true, useExisting: DetailsPickerComponent }]
})
export class DetailsPickerComponent implements OnInit, OnChanges, OnDestroy, ControlValueAccessor {

  ///////////////// Input and Other Fields
  @Input()
  expand: string;

  @Input()
  additionalSelect: string = null;

  /**
   * By default, if the details picker wants to display some ID, if it finds it in the workspace
   * it will not verify that it has all the additionalSelect properties loaded.
   * Setting this input to true would correct this, especially useful in report parameters
   */
  @Input()
  ensureAdditionalSelect = false;

  @Input()
  selectTemplate: string;

  // This is mostly unused for now, all details pickers will always filter out inactive items
  // If the need arises we would have to bind it in all master implementation and all picker implementations
  @Input()
  includeInactive = false;

  @Input()
  filter: string;

  @Input()
  theme: 'light' | 'dark' = 'light';

  @Input()
  collection: Collection;

  @Input()
  definitionIds: number[] = [];

  @Input()
  masterTemplate: TemplateRef<any>;

  @Input()
  detailsTemplate: TemplateRef<any>;

  /**
   * If the details picker is started off with an Id that doesn't exist in the workspace it automatically loads that entity
   * when that entity is loaded the details picker fires this event
   */
  @Output()
  entityLoaded = new EventEmitter<void>();

  @ViewChild('input', { static: true })
  input: ElementRef;

  @ViewChild(NgbDropdown, { static: true })
  resultsDropdown: NgbDropdown;

  @ViewChild('detailsWrapperTemplate', { static: true })
  detailsWrapperTemplate: TemplateRef<any>;

  @ViewChild('masterWrapperTemplate', { static: true })
  masterWrapperTemplate: TemplateRef<any>;

  @ViewChild('detailsOptionsTemplate', { static: true })
  detailsOptionsTemplate: TemplateRef<any>;

  @ViewChild('masterOptionsTemplate', { static: true })
  masterOptionsTemplate: TemplateRef<any>;

  @HostBinding('class.w-100')
  w100 = true;

  private MIN_CHARS_TO_SEARCH = 1;
  private SEARCH_PAGE_SIZE = 15;

  private cancelRunningCall$ = new Subject<void>();
  private notifyFetchUnloadedItem$ = new Subject<string | number>();
  private subscriptions: Subscription;
  private _status: SearchStatus = null;
  private _isDisabled = false;
  private _searchResults: (string | number)[] = [];
  private _highlightedIndex = 0;
  private chosenItem: string | number;
  private _errorMessage: string;
  private _initialText: string;
  private _definitionId: number;
  // private _cacheMode = false;
  private _idString = 'new';
  public api = this.apiService.crudFactory('', null); // for intellisense

  public get additionalSelectKey(): string {
    if (!!this.additionalSelect) {
      return `__${this.additionalSelect}`;
    } else {
      return null;
    }
  }

  @Input()
  formatter: (item: any) => string = (item: any) => {
    return this.descriptor.format(item);
  }

  private get descriptor(): EntityDescriptor {
    const definition = this.definitionIdsSingleOrDefault;
    return metadata[this.collection](this.workspace, this.translate, definition);
  }

  ///////////////// Lifecycle Hooks
  constructor(
    private apiService: ApiService, private workspace: WorkspaceService,
    public modalService: NgbModal, private translate: TranslateService) {

  }

  public focus = () => {
    this.input.nativeElement.focus();
  }

  get chosenItemDefinitionId(): number {
    const defIds = this.entityDescriptor().definitionIds;
    const chosenItem = this.workspace.current[this.collection][this.chosenItem];
    return !!defIds ? (!!chosenItem ? chosenItem.DefinitionId : null) : null;
  }

  ngOnInit() {

    // If there is 0 or 1 definitionId, use the specific API, otherwise use the generic one with a filter
    const apiEndpoint = this.apiEndpoint(this.definitionIdsSingleOrDefault);
    this.api = this.apiService.crudFactory(apiEndpoint, this.cancelRunningCall$);

    this.subscriptions = new Subscription();
    this.subscriptions.add(this.notifyFetchUnloadedItem$.pipe(
      exhaustMap((id) => this.doFetchUnloadedItem(id))
    ).subscribe());

    // // this.apiEndpoint(this.definitionId)

    // // Here we do cache mode
    // this.subscriptions.add(fromEvent(this.input.nativeElement, 'input').pipe(
    //   filter(_ => this._cacheMode),
    //   map((e: any) => e.target.value as string),
    //   tap(term => {
    //     //
    //   })
    // ).subscribe());

    // Use some RxJS magic to listen to user input and call the backend
    // in order to show the results in a dropdown
    this.subscriptions.add(fromEvent(this.input.nativeElement, 'input').pipe(
      //   filter(_ => !this._cacheMode),
      map((e: any) => e.target.value as string),
      tap(term => {

        // Here capture what the user is typing, in case she clicks on 'Create'
        // we pass this value to the details template which can use it as an initial
        // value for the name saving the user from having to type it again
        this._initialText = term;

        // As soon as the user starts typing:
        this._searchResults = []; // clear the results
        this.status = null; // hide the dropdown
        this.cancelRunningCall$.next(); // cancel any existing backend call immediately

        // If the user cleared the value
        if (!term) {
          this.chooseItem(null);
        }
      }),
      debounceTime(50), // 200 // takes it easy on the poor server
      switchMap(term => {
        if (!term || term.length < this.MIN_CHARS_TO_SEARCH) {
          return of(null);
        } else {
          // Show the spinner
          this.status = SearchStatus.showSpinner;

          // Prepare the arguments
          const args: GetArguments = {
            expand: this.expand,
            select: computeSelectForDetailsPicker(this.entityDescriptor(), this.additionalSelect),
            search: term,
            top: this.SEARCH_PAGE_SIZE,
            skip: 0,
            filter: this.queryFilter
          };

          // Call the API and return the observable
          return this.api.getEntities(args).pipe(
            tap(() => this.status = SearchStatus.showResults),
            catchError(friendlyError => {
              this._errorMessage = friendlyError.error;
              this.status = SearchStatus.showError;
              return of(null);
            })
          );
        }
      })
    ).subscribe((results: GetResponse) => {
      // Populate the dropdown with the results
      if (!!results) {

        // First, stamp all the loaded entities as adhering to additionalSelect
        // This stamp is used to check when ensureAdditionalSelect = true
        const stamp = this.additionalSelectKey;
        if (!!stamp) {
          for (const entity of results.Result) {
            entity.EntityMetadata[stamp] = 2;
          }
        }

        // Add the result to the workspace
        this._searchResults = addToWorkspace(results, this.workspace);
        // if (results.TotalCount > 500) {
        //   // Next call will retrieve the entire table and search it in memory
        //   this._cacheMode = true;
        // }
      }

      // Auto select the first result
      this._highlightedIndex = 0; // auto select the first item
    }));

    // Listen to changes in the application language and update the UI
    this.subscriptions.add(this.translate.onLangChange.subscribe(() => {
      this.updateUI(this.chosenItem);
    }));
  }

  private identical(currentDefIds: string[], previousDefIds: string[]): boolean {
    return (!currentDefIds && !previousDefIds) || (
      !!currentDefIds && !!previousDefIds && currentDefIds.length === previousDefIds.length &&
      currentDefIds.every((defId, i) => defId === previousDefIds[i]));
  }

  ngOnChanges(changes: SimpleChanges) {
    // the combination of collection and definitionIds define a new details picker
    if ((!!changes.collection && !changes.collection.isFirstChange()) ||
      (!!changes.definitionIds && !changes.definitionIds.isFirstChange() &&
        !this.identical(changes.definitionIds.currentValue, changes.definitionIds.previousValue))) {
      this.ngOnDestroy();
      this.ngOnInit();
    }
  }

  ngOnDestroy(): void {
    // cleanup duty
    if (!!this.subscriptions) {
      this.subscriptions.unsubscribe();
    }
  }

  ///////////////// Helper Functions

  entityDescriptor(definitionId?: number): EntityDescriptor {
    const coll = this.collection;
    return !!coll ? metadata[coll](this.workspace, this.translate, definitionId) : null;
  }

  apiEndpoint(definitionId: number): string {
    const meta = this.entityDescriptor(definitionId);
    return !!meta ? meta.apiEndpoint : null;
  }

  private fetchUnloadedItem(id: string | number) {
    this.notifyFetchUnloadedItem$.next(id);
  }

  private doFetchUnloadedItem(id: string | number) {
    // Prep the filter
    let filter: string;
    const idDesc = this.descriptor.properties.Id;
    if (!!idDesc && idDesc.control === 'text') {
      filter = `Id eq '${id}'`;
    } else {
      filter = `Id eq ${id}`;
    }

    // Prep the GetArguments
    const args: GetArguments = {
      filter,
      expand: this.expand,
      select: computeSelectForDetailsPicker(this.entityDescriptor(), this.additionalSelect),
    };

    // Load the entity from the server
    return this.api.getEntities(args).pipe(
      tap((response: GetResponse) => {

        // Stamp the loaded entity as adhering to additionalSelect
        // This stamp is used to ensureAdditionalSelect
        const stamp = this.additionalSelectKey;
        const entity = response.Result[0];
        if (!!entity) {

          if (!!stamp) {
            entity.EntityMetadata[stamp] = 2;
          }

          addToWorkspace(response, this.workspace);
          if (this.chosenItem === id) {
            this.updateUI(id);
          }

          // Notify the outside world
          this.entityLoaded.emit();
        } else {
          this.chooseItem(null);
        }
      }),
      catchError(_ => {
        this.chooseItem(null);
        return of(null);
      })
    );
  }

  public get status(): SearchStatus {
    return this._status;
  }

  public set status(val: SearchStatus) {
    this._status = val;
  }

  onDocumentClick(event: any) {
    if (event.target !== this.input.nativeElement) {
      this.status = null;
    }
  }

  private chooseItem(id: string | number) {

    id = id || undefined; // Standardise empty value

    if (this.chosenItem !== id) {
      this.chosenItem = id;

      // Signal ControlValueAccessor
      this.onChange(id);
    }

    // Show the selection in the input box
    this.updateUI(id);

    // Restart input stream
    this.cancelRunningCall$.next(null);

    // Close the dropdown
    this.status = null;
  }

  private updateUI(id: any) {
    const display = !!id ? this.formatterInner(id) : '';
    this.input.nativeElement.value = display;
  }

  private get isDefinitioned(): boolean {
    return !!this.entityDescriptor().definitionIds;
  }

  /**
   * If the api is definitioned, and definitionIds was not supplied, this method returns the
   * full list of definitionIds from the definitions, otherwise returns the supplied list
   */
  private get allDefinitionIds(): number[] {
    // If the api is definitioned, and definitionIds was not supplied, this method
    // Returns the full list of definitionIds form the definitions, otherwise returns the supplied list
    if (this.isDefinitioned) { // Definitioned API
      if (!this.definitionIds || this.definitionIds.filter(e => !!e).length === 0) { // The definitionId were not specified
        return this.entityDescriptor().definitionIds || [];
      } else {
        return this.definitionIds.filter(e => !!e);
      }
    } else {
      return [];
    }
  }

  private get definitionIdsSingleOrDefault(): number {
    const defIds = this.allDefinitionIds;
    return !!defIds && defIds.length === 1 ? defIds[0] : null;
  }

  /**
   * Returns all definition Ids (restricted by any input) that are not archived
   */
  private get createDefinitionIds(): number[] {
    return this.allDefinitionIds.filter(defId => {
      const desc = this.entityDescriptor(defId);
      return !!desc && !desc.isArchived;
    });
  }

  private get createDefinitionIdsSingleOrDefault(): number {
    const defIds = this.createDefinitionIds;
    return !!defIds && defIds.length === 1 ? defIds[0] : null;
  }

  ///////////////// Implementation of ControlValueAccessor

  private onChange = (_: any) => { };
  private onTouched = () => { };

  writeValue(id: any): void {

    id = id || undefined; // Standardize empty value

    // Restart input stream
    this.cancelRunningCall$.next(null);

    // Make it the chosen item;
    this.chosenItem = id;

    // Show the selection in the input box
    this.updateUI(id);
  }

  registerOnChange(fn: (id: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    if (isDisabled) {
      this.cancelRunningCall$.next();
    }
    this._isDisabled = isDisabled;
  }

  private inactiveFilter(definitionId?: number): string {
    return this.entityDescriptor(definitionId).inactiveFilter;
  }

  public get querySelect(): string {
    return computeSelectForDetailsPicker(this.entityDescriptor(), this.additionalSelect);
  }

  public get queryFilter(): string {
    // IF this is a definitioned API and the definition id is ambigious
    // then we add the definitions to the filter
    let result: string = this.filter;

    // Add include inactive filter, if any
    if (!this.includeInactive) {
      const inactiveFilter = this.inactiveFilter();
      if (!!inactiveFilter) {
        if (!!result) {
          result = `(${inactiveFilter}) and (${result})`;
        } else {
          result = inactiveFilter;
        }
      }
    }

    // If all definitions are there, this isn't needed
    // If only a single definition is there, this also isn't needed
    // This is only needed if the allowed definitions are more than 1 but less than total
    if (this.isDefinitioned &&
      !this.definitionIdsSingleOrDefault &&
      !!this.definitionIds &&
      this.definitionIds.filter(e => !!e).length > 0) {

      const definitionfilter = this.definitionIds
        .filter(e => !!e)
        .map(e => `DefinitionId eq ${e}`)
        .reduce((e1, e2) => `${e1} or ${e2}`);

      if (!!result) {
        result = `(${definitionfilter}) and (${result})`;

      } else {
        result = definitionfilter;
      }
    }

    return result;
  }

  ////////////////// UI Bindings

  get searchResults(): (string | number)[] {
    return this._searchResults;
  }

  get highlightedIndex(): number {
    return this._highlightedIndex;
  }

  get isDisabled(): boolean {
    return this._isDisabled;
  }

  get errorMessage(): string {
    return this._errorMessage;
  }

  get showSpinner(): boolean {
    return this.status === SearchStatus.showSpinner;
  }

  get showError(): boolean {
    return this.status === SearchStatus.showError;
  }

  get showNoItemsFound(): boolean {
    return this.status === SearchStatus.showResults &&
      (!!this._searchResults && this._searchResults.length === 0);
  }

  get showResults(): boolean {
    return this.status === SearchStatus.showResults &&
      (!!this._searchResults && this._searchResults.length > 0);
  }

  get placement(): PlacementArray {
    return this.workspace.ws.isRtl ?
      ['bottom-right', 'bottom-left', 'bottom'] :
      ['bottom-left', 'bottom-right', 'bottom'];
  }

  public formatterInner: (id: number | string) => string = (id: number | string) => {
    // all this does is fetch the entity from the server in case it wasn't found in the workspace
    const item = this.workspace.current.get(this.collection, id);
    if (!!id && (!item || (this.ensureAdditionalSelect && !!this.additionalSelectKey && !item.EntityMetadata[this.additionalSelectKey]))) {
      this.fetchUnloadedItem(id);
      return '';
    } else {
      return this.formatter(item);
    }
  }

  onMouseEnter(i: number) {
    this._highlightedIndex = i;
  }

  onBlur() {

    // Restart input stream and cancel existing backend calls
    this.cancelRunningCall$.next();
    
    // Hide the dropdown
    // Use setTimeout in case the user is clicking the dropdown with their mouse
    // This allows the onFocus(item) handler to trigger before the dropdown is gone
    setTimeout(() => this.status = null);

    // Signal on touched
    this.onTouched();

    // Set the displayed value appropriately
    const item = this.chosenItem;
    this.updateUI(item);
  }

  onKeyDown(event: KeyboardEvent) {
    // Use key events on the input to highlight and select from the search results
    // without losing the focus from the input element

    if (!this.status) {
      return;
    }

    const key: string = event.key;
    if (Key[key]) {
      let offset = 0;
      if (this.showCreateNew && this.canCreateNew) {
        offset = offset + 1;
      }
      const maxIndex = this._searchResults.length - 1 + offset;

      switch (key) {
        case Key.ArrowDown:
          // Event was handled
          event.preventDefault();

          if (!!this._searchResults) {
            if (this._highlightedIndex < maxIndex) {
              // Increment the highlighted index if we're not at the end
              this._highlightedIndex++;
            } else {
              this._highlightedIndex = 0;
            }
          }
          break;

        case Key.ArrowUp:
          // Event was handled
          event.preventDefault();

          if (!!this._searchResults) {

            if (this._highlightedIndex <= 0) {
              this._highlightedIndex = maxIndex;
            } else {
              // Decrement the highlighted index if we're not at the beginning
              this._highlightedIndex--;
            }
          }
          break;

        case Key.Enter:
        case Key.Tab:

          if (this._highlightedIndex === this.indexCreateNew && this.showCreateNew) {
            this.onCreateFromKeyDown();
          } else {
            // Retrieve the selected value
            const chosenValue = this._searchResults[this._highlightedIndex];
            if (!!chosenValue) {

              // Event has been handled
              event.preventDefault();
              event.stopPropagation();
            }

            this.chooseItem(chosenValue);
          }

          break;

        case Key.Escape:
          // Event was handled
          event.preventDefault();

          // Restart input stream and cancel existing backend calls
          this.cancelRunningCall$.next(null);

          // Close the dropdown
          this.status = null;
          break;
      }
    }
  }

  public onFocus(item: any) {
    this.chooseItem(item);
  }

  // Create New

  public get indexCreateNew(): number {
    return this.searchResults ? this.searchResults.length : 0;
  }

  public get showCreateNew(): boolean {
    return !!this.detailsTemplate &&
      (this.showNoItemsFound || this.showResults) &&
      (!this.isDefinitioned || this.createOptions.length > 0); // If the entity is definitioned, we need at least one definition
  }

  public get highlightCreateNew(): boolean {
    return this.indexCreateNew === this.highlightedIndex && this.canCreateNew;
  }

  private hasCreatePermissions = (definitionId: number): boolean => {
    // This returns false if the API is definitioned, but definitionId was not supplied
    const view = this.apiEndpoint(definitionId);
    return this.workspace.current.canCreate(view);
  }

  private hasReadPermissions = (definitionId: number): boolean => {
    // This returns false if the API is definitioned, but definitionId was not supplied
    const view = this.apiEndpoint(definitionId);
    return this.workspace.current.canRead(view);
  }

  private get canCreateNewInner(): boolean {
    if (this.isDefinitioned) {
      const defId = this.createDefinitionIdsSingleOrDefault;
      if (!!defId) {
        return this.hasCreatePermissions(defId);
      } else {
        // The definition can't be uniquely determined, so return true
        return true;
      }
    } else {
      return this.hasCreatePermissions(null);
    }
  }

  public get canCreateNew(): boolean {
    return this.canCreateNewInner;
  }

  public get createNewTooltip(): string {
    return this.canCreateNewInner ? '' :
      this.translate.instant('Error_AccountDoesNotHaveSufficientPermissions');
  }

  // Edit Selected

  private get hasEditPermissions(): boolean {
    return this.canUpdatePermissions(this.chosenItemDefinitionId);
  }

  public get canEdit(): boolean {
    return this.hasEditPermissions;
  }

  public get showMagnifier(): boolean {
    return !!this.masterTemplate;
  }

  public get showEditSelected(): boolean {
    return !!this.detailsTemplate && !!this.chosenItem;
  }

  public get disableEditSelected(): boolean {
    return !this.canUpdatePermissions(this.chosenItemDefinitionId);
  }

  // The following methods handle displaying and interacting with master and details template

  onUpdate = (id: number | string) => {
    // Called externally by the master or the details template
    // to specify the item Id just saved or selected
    this.chooseItem(id);
  }

  /**
   * When the user users keyboard arrows to highlight an item and then hits enter
   */
  onCreateFromKeyDown = () => {
    if (!this.canCreateNew) {
      return;
    }

    // close the dropdown
    this.status = null;

    // otherwise Angular complains that the value has changed after it has been checked
    this.onTouched();

    // Open the modal
    this.openCreateModal();
  }

  /**
   * When the user hits create from an open master modal
   */
  onCreateFromMasterModal = () => {
    if (!this.canCreateNew) {
      return;
    }

    // otherwise Angular complains that the value has changed after it has been checked
    this.onTouched();

    // Open the modal (passing the definitionId so the user isn't prompted again)
    this.openCreateModal(this.definitionId);
  }

  /**
   * When the user clicks an item with the mouse
   */
  onCreateFromFocus = () => {
    if (!this.canCreateNew) {
      return;
    }

    // The value is already captured in onBlur() which is triggered before onCreateFromFocus()
    this.openCreateModal();
  }

  onEditFromFocus = () => {
    if (!this.canEdit) {
      return;
    }

    this.openEditModalInner();
  }

  // Search Modal

  public get searchOptions(): number[] {
    return this.allDefinitionIds.filter(defId => this.hasReadPermissions(defId));
  }

  public openSearchModal = () => {
    // The idea here is that if multiple definitions are supported:
    // (1) If the user can read all, the user is presented with a modal to choose
    // (2) If the user has permission to view just one of them, the user is taken to that single choice without asking
    // (3) If the user has no permission to view any of them, the user is presented with the choice like #1, but
    //      no matter what they choose, the server will send back a 403 Forbidden, this is to avoid showing the generic
    //      choice when definitionIds are specified but the user permissions is the problem
    const optionCount = this.searchOptions.length || this.allDefinitionIds.length;
    if (optionCount > 1) {
      // Without the setTimeout it misbehaves when createFromFocus,
      // applying the Enter press on the modal itself
      const windowClass = this.isDark ? 't-dark-theme' : null;
      setTimeout(() => {
        this.modalService.open(this.masterOptionsTemplate, { windowClass })
          .result.then(
            (definitionId) => {
              // if (!this.canSearchFromOptions(definitionId)) {
              //   return;
              // }
              this.openSearchModalInner(definitionId);
            },
            (_: any) => {
            }
          );
      }, 0);
    } else {
      // This isn't definitioned, or there is exactly one definition
      this.openSearchModalInner(this.searchOptions[0] || this.allDefinitionIds[0]);
    }
  }

  private openSearchModalInner(definitionId?: number) {

    // it would be confusing if the user opens the details form the master
    // and find the text she typed in the input field a while ago
    this._initialText = '';
    this._definitionId = definitionId;

    const modalRef = this.modalService.open(this.masterWrapperTemplate, { windowClass: this.masterModalWindowClass });

    // this guarantees that the input will be focused again when the modal closes
    modalRef.result.then(this.onFocusInput, this.onFocusInput);
  }

  public searchOptionName(definitionId: number) {
    return this.entityDescriptor(definitionId).titlePlural();
  }

  public searchFromOptionsTooltip = (definitionId: number): string => {
    return this.hasReadPermissions(definitionId) ? '' : this.translate.instant('Error_AccountDoesNotHaveSufficientPermissions');
  }

  // Create Modal

  /**
   * Strictly the options that appear in the create modal
   */
  public get createOptions(): number[] {
    return this.createDefinitionIds || []; // Ones that you can't create will appear but will be disabled
  }

  private openCreateModal = (definitionId?: number) => {
    if (!!definitionId && this.createOptions.some(defId => defId === definitionId)) {
      // It's given and valid
      this.openCreateModalInner(definitionId);
    } else if (this.createOptions.length > 1) {
      // Without the setTimeout it misbehaves when createFromFocus,
      // applying the Enter press on the modal itself
      const windowClass = this.isDark ? 't-dark-theme' : null;
      setTimeout(() => {
        this.modalService.open(this.detailsOptionsTemplate, { windowClass })
          .result.then(
            (defId) => {
              if (!this.canCreateFromOptions(defId)) {
                return;
              }
              this.openCreateModalInner(defId);
            },
            (_: any) => {
            }
          );
      }, 0);

    } else {
      // get the first one or null
      this.openCreateModalInner(this.createOptions[0]);
    }
  }

  private get detailsModalWindowClass(): string {
    let result = 't-details-modal';
    if (this.isDark) {
      result += ' ' + 't-dark-theme';
    }

    return result;
  }

  private get masterModalWindowClass(): string {
    let result = 't-master-modal';
    if (this.isDark) {
      result += ' ' + 't-dark-theme';
    }

    return result;
  }

  private openCreateModalInner = (definitionId?: number) => {
    // Launch the details modal
    this._definitionId = definitionId;
    this._idString = 'new';

    // Without setTimeout it doesn't open in dev env sometimes, weird
    setTimeout(() => {
      const modalRef = this.modalService.open(this.detailsWrapperTemplate, { windowClass: this.detailsModalWindowClass });

      // this guarantees that the input will be focused again when the modal closes
      modalRef.result.then(this.onFocusInput, this.onFocusInput);
    }, 0);
  }

  private openEditModalInner = () => {
    if (!!this.collection && !!this.workspace.current[this.collection] && !!this.workspace.current[this.collection][this.chosenItem]) {
      this._idString = this.chosenItem.toString();
      this._definitionId = this.chosenItemDefinitionId;

      if (!!this._idString) {
        this.modalService.open(this.detailsWrapperTemplate, { windowClass: this.detailsModalWindowClass })

          // this guarantees that the input will be focused again when the modal closes
          .result.then(this.onFocusInput, this.onFocusInput);
      }
    }
  }

  onFocusInput = () => {
    this.input.nativeElement.focus();
  }

  get initialText(): string {
    return this._initialText;
  }

  get definitionId(): number {
    return this._definitionId;
  }

  public canUpdatePermissions = (definitionId: number): boolean => {
    const view = this.apiEndpoint(definitionId);
    return this.workspace.current.canUpdate(view, null);
  }

  public canCreateFromOptions = (definitionId: number): boolean => {
    return this.hasCreatePermissions(definitionId);
  }

  public createFromOptionsTooltip = (definitionId: number): string => {
    return this.hasCreatePermissions(definitionId) ? '' : this.translate.instant('Error_AccountDoesNotHaveSufficientPermissions');
  }

  public createOptionName(definitionId: number) {
    return this.entityDescriptor(definitionId).titleSingular();
  }

  public get idString(): string {
    return this._idString;
  }

  public get editSelectedLeftMargin(): string {
    return !this.workspace.ws.isRtl ? '-24px' : null;
  }

  public get editSelectedRightMargin(): string {
    return this.workspace.ws.isRtl ? '-24px' : null;
  }

  public get inputLeftPadding(): string {
    return this.showEditSelected ? this.workspace.ws.isRtl ? '24px!important' : null : null;
  }

  public get inputRightPadding(): string {
    return this.showEditSelected ? !this.workspace.ws.isRtl ? '24px!important' : null : null;
  }

  public get isDark(): boolean {
    return this.theme === 'dark';
  }
}
