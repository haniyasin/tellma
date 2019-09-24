import { Component, OnInit, HostListener, ViewChild, ElementRef, AfterViewInit, OnDestroy, Inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Key } from '~/app/data/util';
import { WorkspaceService } from '~/app/data/workspace.service';
import { timer } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { DefinitionsForClient, DefinitionForClient } from '~/app/data/dto/definitions-for-client';
import { SettingsForClient } from '~/app/data/dto/settings-for-client';
import { PermissionsForClient } from '~/app/data/dto/permissions-for-client';

interface MenuSectionInfo { label?: string; background: string; items: MenuItemInfo[]; }
interface MenuItemInfo { icon: string; label: string; link: string; viewId?: string; sortKey: number; }

@Component({
  selector: 'b-main-menu',
  templateUrl: './main-menu.component.html'
})
export class MainMenuComponent implements OnInit, AfterViewInit, OnDestroy {

  // IMPORTANT: if you change these you must change the corresponding
  // SASS variables in main-menu.component.scss accordingly
  MAX_TILES = 6;
  TILE_WIDTH = 135;
  TILE_MARGIN = 4;
  CONTAINER_MARGIN = 15;

  // private fields
  private currentSection = -1;
  private currentItem = -1;
  private currentXMemory = -1;

  // public fields
  public search = '';
  public initialized = false;

  // the search field
  @ViewChild('searchInput', { static: true })
  searchInput: ElementRef;

  // TODO: replace below with a dynamically constructed mainMenu
  quickAccess: MenuItemInfo[] = [
    { label: 'MeasurementUnits', icon: 'ruler-combined', link: '../measurement-units', viewId: 'measurement-units', sortKey: 10 },
    // { label: 'IfrsNotes', icon: 'clipboard', link: '../ifrs-notes', viewId: 'ifrs-notes', sortKey: 20 },
    { label: 'Users', icon: 'users', link: '../users', viewId: 'users', sortKey: 40 },
    { label: 'Roles', icon: 'tasks', link: '../roles', viewId: 'roles', sortKey: 50 },
    { label: 'Settings', icon: 'cog', link: '../settings', viewId: 'settings', sortKey: 60 },
  ];

  mainMenuBase: { [section: string]: MenuSectionInfo } = {
    Financials: {
      background: 'b-green',
      items: [
        // { label: 'IfrsNotes', icon: 'clipboard', link: '../ifrs-notes', viewId: 'ifrs-notes', sortKey: 100 },
        { label: 'Currencies', icon: 'euro-sign', link: '../currencies', viewId: 'currencies', sortKey: 300 },
      ]
    },
    Administration: {
      background: 'b-blue',
      items: [
        { label: 'Users', icon: 'users', link: '../users', viewId: 'users', sortKey: 100 },
        { label: 'Roles', icon: 'tasks', link: '../roles', viewId: 'roles', sortKey: 200 },
        { label: 'MeasurementUnits', icon: 'ruler-combined', link: '../measurement-units', viewId: 'measurement-units', sortKey: 300 },
        { label: 'Settings', icon: 'cog', link: '../settings', viewId: 'settings', sortKey: 400 },
      ]
    },
    Miscellaneous: { // TODO
      background: 'b-grey',
      items: [
      ]
    }
  };

  get mainMenu(): MenuSectionInfo[] {
    this.initializeMainMenu();
    return this._mainMenu;
  }

  _permissions: PermissionsForClient = null;
  _definitions: DefinitionsForClient = null;
  _settings: SettingsForClient = null;
  _mainMenu: MenuSectionInfo[];
  _currentCulture: string;

  public initializeMainMenu(): MenuSectionInfo[] {
    if (this._definitions !== this.workspace.current.definitions ||
      this._settings !== this.workspace.current.settings ||
      this._currentCulture !== this.workspace.ws.culture ||
      this._permissions !== this.workspace.current.permissions) {

      this._definitions = this.workspace.current.definitions;
      this._settings = this.workspace.current.settings;
      this._currentCulture = this.workspace.ws.culture;
      this._permissions = this.workspace.current.permissions;

      // Clone the main menu base and add to the clone
      const menu = JSON.parse(JSON.stringify(this.mainMenuBase)) as { [section: string]: MenuSectionInfo };

      // translate all the labels to the current language
      for (const sectionKey of Object.keys(menu)) {
        for (const item of menu[sectionKey].items) {
          item.label = this.translate.instant(item.label);
        }
      }

      // add custom screens from definitions
      this.addDefinitions(menu, this.workspace.current.definitions.ResourceLookups, 'resource-lookups');
      this.addDefinitions(menu, this.workspace.current.definitions.Resources, 'resources');
      this.addDefinitions(menu, this.workspace.current.definitions.Documents, 'documents');
      this.addDefinitions(menu, this.workspace.current.definitions.Resources, 'resource-classifications',
      e => !!e ? e + ' - ' + this.translate.instant('Classifications') : e);


      this._mainMenu = Object.keys(menu).map(e => ({
        label: this.translate.instant(e),
        items: menu[e].items.sort((x1, x2) => x1.sortKey - x2.sortKey),
        background: menu[e].background
      }));
    }

    return this._mainMenu;
  }

  private addDefinitions(
    menu: { [section: string]: MenuSectionInfo },
    definitions: { [defId: string]: DefinitionForClient },
    url: string, titleFunc?: (title: string) => string) {
    if (!!definitions) {

      titleFunc = titleFunc || (e => e);
      for (const definitionId of Object.keys(definitions).filter(e => this.canView(e))) {

        // get the definition
        const definition = definitions[definitionId];

        // get the name
        const label = titleFunc(this.workspace.current.isSecondaryLanguage ? definition.TitlePlural2 :
          this.workspace.current.isTernaryLanguage ? definition.TitlePlural3 : definition.TitlePlural)
          || this.translate.instant('Untitled');

        // add the menu section if missing
        if (!menu[definition.MainMenuSection]) {
          definition.MainMenuSection = 'Miscellaneous';
        }

        // push the menu item
        menu[definition.MainMenuSection].items.push({
          label,
          sortKey: definition.MainMenuSortKey,
          icon: definition.MainMenuIcon || 'folder',
          link: `../${url}/${definitionId}`
        });
      }
    }
  }

  // constructor
  constructor(
    private router: Router, private route: ActivatedRoute, @Inject(DOCUMENT) private document: Document,
    private translate: TranslateService, private workspace: WorkspaceService) { }

  // Angular lifecycle hooks
  ngOnInit() {
    const count = this.mainMenu.reduce((sum, obj) => sum + obj.items.length, 0);

    // this adds a cool background to the main menu, unaffected by scrolling
    this.document.body.classList.add('b-banner');

    // if the main menu is enormous, it causes an uncomfortable lag before navigation
    // we eliminate this lag by not rendering the menu items immediately if  they are too many
    if (count < 100) {
      this.initialize();
    }
  }
  ngAfterViewInit() {
    if (!this.initialized) {
      timer(1).subscribe(() => this.initialize());
    }
  }

  ngOnDestroy() {
    // other screens have a simple grey background
    this.document.body.classList.remove('b-banner');
  }

  initialize() {
    this.initialized = true;
  }

  // this captures all keydown events from the root document
  // in here we allo the user to navigate the focus around the main menu
  // tiles with the arrow keys, ala metro style
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    let key: string = event.key;

    // Focus on the search field as soon as the user starts typing letters or numbers
    if (!this.searchInputIsFocused && !!key && key.trim().length === 1) {
      this.currentXMemory = -1;
      this.searchInput.nativeElement.value = '';
      this.searchInput.nativeElement.focus();
    }

    // custom keyboard interactions only occur when the user is not pressing Alt or Ctrl
    // for example alt-leftArrow and alt-rightArrow are universal keyboard for forward and backward browser navigation
    if (event.altKey || event.ctrlKey) {
      return;
    }

    if (Key[key]) {

      // reverse left and right arrows for RTL languages
      if (this.workspace.ws.isRtl) {
        if (key === Key.ArrowRight) {
          key = Key.ArrowLeft;
        } else if (key === Key.ArrowLeft) {
          key = Key.ArrowRight;
        }
      }

      switch (key) {
        case Key.Escape: {
          this.currentXMemory = -1;
          this.search = '';
          this.currentItem = -1;
          this.currentSection = -1;

          (this.document.activeElement as any).blur();

          break;
        }
        case Key.Tab: {
          this.currentXMemory = -1;
          break;
        }
        case Key.ArrowLeft:
          if (this.currentIdExists) {
            this.currentXMemory = -1;
            const gridModel = this.computeGridModel();

            let nextX = gridModel.currentX;
            const nextY = gridModel.currentY;

            nextX = nextX - 1;
            if (nextX < 0) {
              // (1) to wrap around
              // nextY = nextY - 1;
              // if (nextY < 0) {
              //   nextY = gridModel.height - 1;
              // }

              // nextX = gridModel.width - 1;
              // while (!gridModel.grid[nextY][nextX] && nextX > 0) {
              //   nextX--;
              // }

              // (1) to not wrap around
              nextX = 0;
            }

            const indices = gridModel.grid[nextY][nextX];
            this.focusTile(indices.sectionIndex, indices.itemIndex, event);
          }
          break;
        case Key.ArrowRight:
          if (!this.showNoItemsFound && !this.searchInputIsFocused) {
            this.currentXMemory = -1;
            let nextX = 0;
            let nextY = 0;
            const gridModel = this.computeGridModel();

            if (this.currentIdExists) {

              nextX = gridModel.currentX;
              nextY = gridModel.currentY;

              nextX = nextX + 1;

              // (1) to wrap around
              // while (!gridModel.grid[nextY][nextX] && nextX < gridModel.width) {
              //   nextX++;
              // }
              // if (nextX >= gridModel.width) {
              //   // nextY = nextY + 1;
              //   // if (nextY >= gridModel.height) {
              //   //   nextY = 0;
              //   // }

              //   nextX = 0;
              // }

              // (2) to not wrap around
              if (!gridModel.grid[nextY][nextX]) {
                nextX = nextX - 1;
              }
            }

            const indices = gridModel.grid[nextY][nextX];
            this.focusTile(indices.sectionIndex, indices.itemIndex, event);

          }
          break;
        case Key.ArrowUp:
          if (this.currentIdExists) {
            const gridModel = this.computeGridModel();

            let nextX = this.currentXMemory < 0 ? gridModel.currentX : this.currentXMemory;
            let nextY = gridModel.currentY;

            nextY = nextY - 1;
            if (nextY < 0) {
              // (1) to wrap around
              // nextY = gridModel.height - 1;

              // (2) to not wrap around
              nextY = 0;
            }

            this.currentXMemory = Math.max(this.currentXMemory, nextX);
            while (!gridModel.grid[nextY][nextX] && nextX > 0) {
              nextX--;
            }
            const indices = gridModel.grid[nextY][nextX];
            this.focusTile(indices.sectionIndex, indices.itemIndex, event);
          }
          break;
        case Key.ArrowDown:
          // the down arrow works even if no tile is highlighted
          // in which case we highlight the very first tile
          if (!this.showNoItemsFound) {
            let nextX = 0;
            let nextY = 0;
            const gridModel = this.computeGridModel();

            if (this.currentIdExists) {

              nextX = this.currentXMemory < 0 ? gridModel.currentX : this.currentXMemory;
              nextY = gridModel.currentY;

              nextY = nextY + 1;
              if (nextY >= gridModel.height) {
                // (1) to wrap around
                // nextY = 0;

                // (2) to not wrap around
                nextY = gridModel.height - 1;
              }

              this.currentXMemory = Math.max(this.currentXMemory, nextX);
              while (!gridModel.grid[nextY][nextX] && nextX > 0) {
                nextX--;
              }
            } else {
              this.currentXMemory = -1;
            }

            const indices = gridModel.grid[nextY][nextX];
            this.focusTile(indices.sectionIndex, indices.itemIndex, event);
          }

          break;
      }
    }
  }

  private get searchInputIsFocused(): boolean {
    return this.searchInput.nativeElement === this.document.activeElement;
  }

  private focusTile(sectionIndex: number, itemIndex: number, event: KeyboardEvent) {
    const elem = this.document.getElementById(this.getId(sectionIndex, itemIndex));
    elem.focus();
    event.preventDefault();
    event.stopPropagation();
  }

  private get rowTiles(): number {
    // this computes the number of tiles in each row using media queries
    for (let i = this.MAX_TILES; i > 0; i--) {
      const minWidth = (this.CONTAINER_MARGIN * 2) + (this.TILE_WIDTH + (2 * this.TILE_MARGIN)) * i;
      if (window.matchMedia(`(min-width: ${minWidth}px)`).matches) {
        return i;
      }
    }
  }

  private computeGridModel(): {
    currentX: number,
    currentY: number,
    width: number,
    height: number,
    grid: { sectionIndex: number, itemIndex: number }[][]
  } {
    const rowTiles = this.rowTiles;
    let currentY = -1;
    let currentX = -1;
    const gridModel: { sectionIndex: number, itemIndex: number }[][] = [];

    for (let s = 0; s < this.sectionsLength; s++) {
      const sectionItems = this.getSectionItems(s);
      if (this.showSectionIndex(s)) {
        const visibleItems = sectionItems.map((e, index) => ({ sectionIndex: s, itemIndex: index }))
          .filter((indices) => this.showItemIndex(indices.sectionIndex, indices.itemIndex));

        for (let i = 0; i < visibleItems.length; i = i + rowTiles) {
          const row = visibleItems.slice(i, i + rowTiles);
          gridModel.push(row);

          for (let col = 0; col < rowTiles; col++) {
            const cell = row[col];
            if (!!cell && cell.itemIndex === this.currentItem && cell.sectionIndex === this.currentSection) {
              currentY = gridModel.length - 1;
              currentX = col;
            }
          }
        }
      }
    }

    return {
      currentX,
      currentY,
      width: rowTiles,
      height: gridModel.length,
      grid: gridModel
    };
  }

  private get sectionsLength(): number {
    return 1 + this.mainMenu.length;
  }

  private getSectionItems(index: number) {
    if (index === 0) {
      return this.quickAccess;
    } else {
      return this.mainMenu[index - 1].items;
    }
  }

  get currentIdExists(): boolean {
    return this.currentSection >= 0 && this.currentItem >= 0;
  }

  public onFocus(section: number, item: number) {
    this.currentSection = section;
    this.currentItem = item;
  }

  public onBlur() {
    this.currentSection = -1;
    this.currentItem = -1;
  }

  public getId(section: number, item: number) {
    return `${section}_${item}`;
  }

  onNavigate(url: string) {
    this.router.navigate([url], { relativeTo: this.route });
  }

  showSection(items: MenuItemInfo[]): boolean {
    if (!!this.search && items === this.quickAccess) {
      return false;
    }

    return !!items && items.some(e => this.showItem(e));
  }

  showItem(item: MenuItemInfo): boolean {
    const term = this.search;
    return (!item.viewId || this.canView(item.viewId)) &&
      (!term || this.translate.instant(item.label).toLowerCase().indexOf(term.toLowerCase()) !== -1);
  }

  showSectionIndex(sectionIndex: number) {
    const section = this.getSectionItems(sectionIndex);
    return this.showSection(section);
  }

  showItemIndex(sectionIndex: number, itemIndex: number) {
    const item = this.getSectionItems(sectionIndex)[itemIndex];
    return this.showItem(item);
  }

  get showNoItemsFound(): boolean {
    return this.mainMenu.every(section => !this.showSection(section.items));
  }

  public canView(viewId: string) {
    return this.workspace.current.canRead(viewId);
  }
}
