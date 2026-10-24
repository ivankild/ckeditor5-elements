import { DomEventObserver, type ViewDocumentDomEventData } from 'ckeditor5';

/**
 * Fires `dblclick` on the view document when the user double-clicks in the editing view. (CKEditor has an observer for
 * `click`, but not for `dblclick`.)
 */
export default class DoubleClickObserver extends DomEventObserver<'dblclick'> {
	// The base class declares it as an accessor, so it cannot be a field here.
	// eslint-disable-next-line @typescript-eslint/class-literal-property-style
	public get domEventType(): 'dblclick' {
		return 'dblclick';
	}

	/**
	 * Fires `dblclick` on the view document for the DOM event.
	 */
	public onDomEvent(domEvent: MouseEvent): void {
		this.fire(domEvent.type, domEvent);
	}
}

/**
 * Fired on the view document by the {@link DoubleClickObserver}.
 */
export interface ViewDocumentDoubleClickEvent {
	name: 'dblclick';
	args: [data: ViewDocumentDomEventData<MouseEvent>];
}
