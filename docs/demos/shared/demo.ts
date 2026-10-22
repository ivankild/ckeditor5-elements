import type { ClassicEditor, EditorConfig } from 'ckeditor5';

/**
 * A live example: the editor config (without `attachTo`, `licenseKey` and the data), the data, and an optional
 * callback for adding controls next to the editor.
 */
export interface Demo {
	config: EditorConfig;
	data: string;
	ready?(editor: ClassicEditor, container: HTMLElement): void;
}
