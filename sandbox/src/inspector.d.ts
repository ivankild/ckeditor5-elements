declare module '@ckeditor/ckeditor5-inspector' {
	import type { Editor } from 'ckeditor5';

	const CKEditorInspector: {
		attach(editorOrConfig: Editor | Record<string, Editor>, options?: { isCollapsed?: boolean }): string[];
		detach(editorName: string): void;
		destroy(): void;
	};

	export default CKEditorInspector;
}
