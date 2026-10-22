import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import EditorDemo from './EditorDemo.vue';

import 'ckeditor5/ckeditor5.css';
import 'ckeditor5-elements-core/index.css';
import 'ckeditor5-elements-breadcrumbs/index.css';
import 'ckeditor5-elements-quick-insert/index.css';
import './custom.css';

export default {
	extends: DefaultTheme,
	enhanceApp({ app }) {
		app.component('EditorDemo', EditorDemo);
	}
} satisfies Theme;
