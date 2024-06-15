import { Component, Input } from '@angular/core';

@Component({
  selector: 't-warning-message',
  templateUrl: './warning-message.component.html'
})
export class WarningMessageComponent {
  
  @Input()
  height: number;
}
