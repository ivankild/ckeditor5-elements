import { DomEventObserver, type ViewDocumentDomEventData } from 'ckeditor5';

/**
 * Fires the `contextmenu` event on the view document when the user opens the native context menu in an editable.
 */
export default class ContextMenuObserver extends DomEventObserver<'contextmenu'> {
	// The base class declares it as an accessor, so it cannot be a field here.
	// eslint-disable-next-line @typescript-eslint/class-literal-property-style
	public get domEventType(): 'contextmenu' {
		return 'contextmenu';
	}

	/**
	 * Fires `contextmenu` on the view document for the DOM event.
	 */
	public onDomEvent(domEvent: MouseEvent): void {
		this.fire(domEvent.type, domEvent);
	}
}

/**
 * Fired on the view document by the {@link ContextMenuObserver}.
 */
export interface ViewDocumentContextMenuEvent {
	name: 'contextmenu';
	args: [data: ViewDocumentDomEventData<MouseEvent>];
}
