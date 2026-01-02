<script setup lang="ts">
  /**
   * [August 17th 2025]
   *
   * Tested with 50K options and around 100 options selected, and worked nicely.
   *
   * A multiselect component with reactive props written for Vue 3.
   * If anything changes on the input props, the component will
   *   reflect the changes.
   * This component does not copy the initial state passed as
   *   props, instead it emits events and the parent component
   *   is responsible for managing the state and re-injecting
   *   it as props in this component.
   * It does not modify the input props in any way.
   *
   * Usage:
   *
   *  - Pass the "options" prop as an array of objects in the form:
   *    {
   *      text: <string>
   *      value: string
   *    }
   *    You should not have duplicate values in the options.
   *
   *  On the parent component, you can listen to the following events:
   *    - select-option   (passes an option value);
   *    - deselect-option (passes an option value);
   *    - create-option   (passes an option name);
   *
   * Optional props:
   *   - placeholder     <string>         A placeholder for the text input;
   *   - selected        <string[]>       An array of string containing the pre-selected values;
   *   - create:         <boolean>        Used to allow the creation of new options. Default is false.
   *   - close:          <boolean>        Display or not close buttons inside the badges. Default is false;
   *   - direction:      <"up" | "down">  The opening direction for the context menu. Default is down.
   *   - badgeNumbers:   <boolean>        Show a small index in front of the badge text. Default is false.
   *   - optionNumbers:  <boolean>        Show a small index in front of the option text. Default is false.
   *
   * Styling:
   *   - You can apply the styling for this component's elements using the
   *     following CSS classes and selectors:
   *        .multiselect
   *        .multiselect .context-menu
   *        .multiselect .context-menu .option
   *        .multiselect .context-menu .option .text-part
   *        .multiselect .context-menu .option .text-part.match
   *        .multiselect .context-menu .option .option-index
   *        .multiselect .context-menu .highlight
   *        .multiselect .badge
   *        .multiselect .badge .badge-index
   *        .multiselect .badge .close-button
   *        .multiselect .badge .close-button svg path  (set the "stroke" CSS property to change X color)
   *        .multiselect .badges-container
   *        .multiselect .editor
   */
  import { toLocaleNumber } from '@common/utils/utils';
  import { computed, reactive, useTemplateRef, ref, watch } from 'vue';
  export type MultiselectOption = {
    text: string;
    value: string;
  };
  export type MultiselectProps = {
    options: MultiselectOption[];
    placeholder?: string;
    selected?: string[];
    create?: boolean;
    close?: boolean;
    direction?: 'up' | 'down';
    badgeNumbers?: boolean;
    optionNumbers?: boolean;
  };
  type SearchSegment = { text: string; match: boolean };
  const emit = defineEmits<{
    (e: 'selectOption', optionValue: string): void;
    (e: 'createOption', optionText: string): void;
    (e: 'deselectOption', optionValue: string): void;
  }>();
  const optionHeight = 30;
  const pageSize = 100;
  const anchor = ref(0);
  const scrollOffset = ref(0);
  const scrollTimer = ref<ReturnType<typeof setTimeout> | undefined>(undefined);
  const props = defineProps<MultiselectProps>();
  const editor = useTemplateRef('editor');
  const contextMenu = useTemplateRef('context-menu');
  const optionsContainer = useTemplateRef('options-container');
  const badgesContainer = useTemplateRef('badges-container');
  const state = reactive({
    content: '',
    editorHasFocus: false,
    highlightedContextIndex: 0,
  });
  const selectedValues = computed<Set<string>>(() => new Set(props.selected));
  const selectedOptions = computed(() =>
    props.options.filter((op) => selectedValues.value.has(op.value))
  );
  const contextOptions = computed(() =>
    props.options.filter((op) => {
      if (selectedValues.value.has(op.value)) return false;
      if (!state.content) return true;
      return op.text.toLowerCase().includes(state.content.toLowerCase());
    })
  );
  const showContextMenu = computed(() =>
    Boolean(state.editorHasFocus && contextOptions.value.length)
  );
  const contextMenuStyle = computed(() => {
    if (props.direction === 'up') return { bottom: '100%' };
    return { top: '100%' };
  });

  function focusEditor() {
    editor.value?.focus();
  }
  function clamp(min: number, max: number, val: number) {
    let res = Math.min(val, max);
    res = Math.max(res, min);
    return res;
  }
  function selectOption(optionValue: string) {
    emit('selectOption', optionValue);
    state.highlightedContextIndex = clamp(
      0,
      contextOptions.value.length - 1,
      state.highlightedContextIndex
    );
  }
  function editorBlur(e: FocusEvent) {
    if (showContextMenu.value && e.relatedTarget === contextMenu.value) {
      focusEditor();
      return;
    }
    clear();
  }
  function editorEnter() {
    const option = contextOptions.value[state.highlightedContextIndex];
    if (option) {
      selectOption(option.value);
    } else if (props.create) {
      emit('createOption', state.content);
      state.content = '';
      state.highlightedContextIndex = 0;
    }
  }
  function clear() {
    state.content = '';
    state.editorHasFocus = false;
    state.highlightedContextIndex = 0;
    (document.activeElement as HTMLElement | null)?.blur();
  }
  function editorInput() {
    contextMenu.value?.scrollTo({
      top: 0,
      behavior: 'instant',
    });
    state.highlightedContextIndex = 0;
  }
  function deselectOption(optionValue: string) {
    emit('deselectOption', optionValue);
  }
  function badgeKeydown(event: KeyboardEvent, optionValue: string) {
    const badges = badgesContainer.value?.children as HTMLElement[] | undefined;
    if (!badges) return;
    const current = event.currentTarget as HTMLElement;
    const index = Array.from(badges).indexOf(current);
    if (event.key === 'Backspace') {
      const previous = current?.previousElementSibling as HTMLElement;
      previous?.focus();
      deselectOption(optionValue);
    } else if (event.key === 'Delete') {
      const next = current?.nextElementSibling as HTMLElement;
      next?.focus();
      deselectOption(optionValue);
    } else if (event.key === 'ArrowLeft' && index > 0) {
      badges[index - 1].focus();
    } else if (event.key === 'ArrowRight' && index < badges.length - 1) {
      badges[index + 1].focus();
    }
  }
  function contextUp() {
    state.highlightedContextIndex = Math.max(0, state.highlightedContextIndex - 1);
    const child = optionsContainer.value?.children[state.highlightedContextIndex - anchor.value] as
      | HTMLElement
      | undefined;
    if (child) {
      child.scrollIntoView({ behavior: 'instant', block: 'nearest' });
    }
  }
  function contextDown() {
    state.highlightedContextIndex = Math.min(
      contextOptions.value.length - 1,
      state.highlightedContextIndex + 1
    );
    const child = optionsContainer.value?.children[state.highlightedContextIndex - anchor.value] as
      | HTMLElement
      | undefined;
    if (child) {
      child.scrollIntoView({ behavior: 'instant', block: 'nearest' });
    }
  }
  function contextScroll() {
    clearTimeout(scrollTimer.value);
    scrollTimer.value = setTimeout(() => {
      const context = contextMenu.value;
      if (!context) return;
      const scrollTop = context.scrollTop;
      anchor.value = Math.max(0, Math.floor(scrollTop / optionHeight) - 40);
      scrollOffset.value = optionHeight * anchor.value;
    }, 40);
  }
  function searchParts(text: string) {
    const result: SearchSegment[] = [];
    const term = state.content.trim();
    if (!term) return [{ text, match: false }];
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    let lastIndex = 0;
    for (const match of text.matchAll(regex)) {
      const start = match.index!;
      const end = start + match[0].length;
      if (start > lastIndex) {
        result.push({ text: text.slice(lastIndex, start), match: false });
      }
      result.push({ text: match[0], match: true });
      lastIndex = end;
    }
    if (lastIndex < text.length) {
      result.push({ text: text.slice(lastIndex), match: false });
    }
    return result;
  }
  watch(showContextMenu, () => {
    anchor.value = 0;
    scrollOffset.value = 0;
  });
</script>

<template>
  <div class="multiselect">
    <div
      v-if="showContextMenu"
      ref="context-menu"
      class="context-menu"
      :style="contextMenuStyle"
      tabindex="0"
      role="listbox"
      @scroll="contextScroll"
    >
      <div class="ghost" :style="{ height: `${contextOptions.length * optionHeight}px` }"></div>
      <div
        ref="options-container"
        class="options-container"
        :style="{ transform: `translateY(${scrollOffset}px)` }"
      >
        <div
          v-for="(option, i) in contextOptions.slice(anchor, anchor + pageSize)"
          :key="option.value"
          class="option"
          :class="{ highlight: i + anchor === state.highlightedContextIndex }"
          role="option"
          @mouseover="state.highlightedContextIndex = i + anchor"
          @click="selectOption(option.value)"
        >
          <span v-if="props.optionNumbers" class="option-index">
            {{ toLocaleNumber(i + anchor + 1) }}
          </span>
          <span
            v-for="(part, index) in searchParts(option.text)"
            :key="`${option.value}-${part.text}-${index}`"
            class="text-part"
            :class="{ match: part.match }"
          >
            {{ part.text }}
          </span>
        </div>
      </div>
    </div>
    <div ref="badges-container" class="badges-container" @mousedown.prevent="focusEditor">
      <span
        v-for="(option, index) in selectedOptions"
        :key="option.value"
        class="badge"
        tabindex="0"
        @keydown="badgeKeydown($event, option.value)"
        @mousedown.stop
      >
        <span v-if="props.badgeNumbers" class="badge-index">({{ toLocaleNumber(index + 1) }})</span>
        <span>{{ option.text }}</span>
        <button
          v-if="props.close"
          class="close-button"
          type="button"
          aria-label="remove option"
          tabindex="-1"
          @click="deselectOption(option.value)"
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M1 1 L9 9 M9 1 L1 9" stroke="currentColor" stroke-width="1" />
          </svg>
        </button>
      </span>
    </div>
    <input
      ref="editor"
      v-model.trim="state.content"
      type="text"
      class="editor"
      :placeholder="props.placeholder"
      @input="editorInput"
      @focus="state.editorHasFocus = true"
      @blur="editorBlur"
      @keydown.up.prevent="contextUp"
      @keydown.down.prevent="contextDown"
      @keydown.enter.prevent="editorEnter"
      @keydown.escape.prevent="clear"
    />
  </div>
</template>

<style scoped>
  .multiselect {
    position: relative;
    display: flex;
    flex-direction: column;
  }
  .badges-container {
    display: flex;
    flex-wrap: wrap;
  }
  .context-menu {
    cursor: pointer;
    position: absolute;
    left: -1px;
    right: -1px;
    max-height: 250px;
    overflow-y: scroll;
  }
  .badge {
    cursor: pointer;
    display: flex;
  }
  .badge .close-button {
    cursor: pointer;
    display: flex;
    align-items: center;
    height: 100%;
  }
  .option {
    height: 30px;
    display: flex;
    align-items: center;
    white-space: nowrap;
    overflow: hidden;
  }
  .options-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    will-change: transform;
  }
</style>
