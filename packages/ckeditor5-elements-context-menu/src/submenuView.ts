import { ButtonView, KeystrokeHandler, View, type Locale } from 'ckeditor5';
import ElementContextMenuView from './elementContextMenuView.js';

/**
 * A menu item that opens a nested menu next to it.
 *
 * Clicking the item or pressing the right arrow opens the nested menu; the left arrow or Esc closes it.
 * When one of the nested items fires `execute`, the submenu fires `execute` too, so the whole menu can close.
 */
export default class SubmenuView extends View {
	/**
	 * The item that opens the nested menu.
	 */
	public readonly buttonView: ButtonView;

	/**
	 * The nested menu.
	 */
	public readonly panelView: ElementContextMenuView;

	/**
	 * Handles the keystrokes within the submenu.
	 */
	public readonly keystrokes = new KeystrokeHandler();

	/**
	 * Whether the nested menu is open.
	 *
	 * @observable
	 */
	declare public isOpen: boolean;

	constructor(locale: Locale | undefined, label: string, items: View[]) {
		super(locale);

		this.set('isOpen', false);

		this.buttonView = new ButtonView(locale);
		this.buttonView.set({ label, withText: true, role: 'menuitem' });
		this.buttonView.bind('isOn').to(this, 'isOpen');
		this.buttonView.extendTemplate({
			attributes: {
				class: 'ck-elements-submenu__button',
				'aria-haspopup': 'true',
				'aria-expanded': this.bindTemplate.to('isOpen', value => String(value))
			}
		});

		this.buttonView.on('execute', () => {
			if (this.isOpen) {
				this.close();
			} else {
				this.open();
			}
		});

		this.panelView = new ElementContextMenuView(locale);
		this.panelView.items.addMany(items);
		this.panelView.extendTemplate({
			attributes: {
				class: ['ck-elements-submenu__panel', this.bindTemplate.if('isOpen', 'ck-hidden', value => !value)]
			}
		});

		this.panelView.on('cancel', () => {
			this.close();
		});

		for (const item of items) {
			item.delegate('execute').to(this);
		}

		this.setTemplate({
			tag: 'div',
			attributes: {
				class: ['ck', 'ck-elements-submenu']
			},
			children: [this.buttonView, this.panelView]
		});
	}

	public override render(): void {
		super.render();

		if (this.element) {
			this.keystrokes.listenTo(this.element);
		}

		this.keystrokes.set('arrowright', (data, cancel) => {
			if (document.activeElement === this.buttonView.element) {
				this.open();
				cancel();
			}
		});

		this.keystrokes.set('arrowleft', (data, cancel) => {
			if (this.isOpen && this.panelView.element?.contains(document.activeElement)) {
				this.close();
				cancel();
			}
		});
	}

	/**
	 * Opens the nested menu and focuses its first item.
	 */
	public open(): void {
		this.isOpen = true;
		this.panelView.focus();
	}

	/**
	 * Closes the nested menu and focuses the item that opens it.
	 */
	public close(): void {
		this.isOpen = false;
		this.buttonView.focus();
	}

	/**
	 * Focuses the item that opens the nested menu.
	 */
	public focus(): void {
		this.buttonView.focus();
	}

	public override destroy(): void {
		super.destroy();
		this.keystrokes.destroy();
	}
}
