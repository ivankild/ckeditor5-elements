import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import EditorDemo from './EditorDemo.vue';

import 'ckeditor5/ckeditor5.css';
import 'ckeditor5-elements/index.css';
import 'ckeditor5-elements-example/content.css';
import 'ckeditor5-elements-docbook-example/content.css';
import 'ckeditor5-elements-dita-example/content.css';
import './custom.css';

export default {
	extends: DefaultTheme,
	enhanceApp({ app }) {
		app.component('EditorDemo', EditorDemo);
	}
} satisfies Theme;
