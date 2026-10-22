<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import type { ClassicEditor } from 'ckeditor5';
import type { Demo } from '../../demos/shared/demo';

/**
 * Runs a live editor from `docs/demos/<name>.ts`. The editor is created in the browser only (never during the static
 * build) and destroyed when the page is left.
 */
const props = defineProps<{ name: string }>();

const demos = import.meta.glob<{ default: Demo }>('../../demos/*.ts');
const container = ref<HTMLElement>();
const error = ref<string>();

let editor: ClassicEditor | undefined;
let isUnmounted = false;

onMounted(async () => {
	const load = demos[`../../demos/${props.name}.ts`];

	if (!load) {
		error.value = `Unknown demo: ${props.name}`;

		return;
	}

	const [{ ClassicEditor }, { default: demo }] = await Promise.all([import('ckeditor5'), load()]);

	if (isUnmounted || !container.value) {
		return;
	}

	const element = document.createElement('div');

	container.value.prepend(element);

	editor = await ClassicEditor.create({
		...demo.config,
		attachTo: element,
		licenseKey: 'GPL',
		root: { initialData: demo.data }
	});

	if (isUnmounted) {
		await editor.destroy();

		return;
	}

	demo.ready?.(editor, container.value);
});

onBeforeUnmount(() => {
	isUnmounted = true;
	void editor?.destroy();
});
</script>

<template>
	<div ref="container" class="editor-demo vp-raw">
		<p v-if="error" class="editor-demo__error">{{ error }}</p>
	</div>
</template>
