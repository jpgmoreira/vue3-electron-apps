<script lang="ts" setup>
  /**
   * Auto-length text input.
   * Can be used with v-model.
   *
   * -- Observation: Is not needed anymore if you use field-sizing CSS prop:
   *    [https://developer.mozilla.org/en-US/docs/Web/CSS/field-sizing]
   */
  import { onMounted, useTemplateRef } from 'vue';

  const modelValue = defineModel<string>({ default: '' });

  const inputRef = useTemplateRef('input-ref');
  let style: CSSStyleDeclaration | null = null;

  function updateInputLength() {
    const input = inputRef.value;
    if (!input) return;
    if (!style) style = getComputedStyle(input);

    const measureSpan = document.createElement('span');
    measureSpan.style.position = 'absolute';
    measureSpan.style.left = '-99999px';
    measureSpan.style.top = '0';
    measureSpan.style.visibility = 'hidden';
    measureSpan.style.whiteSpace = 'pre';
    measureSpan.style.display = 'inline-block';
    document.body.appendChild(measureSpan);

    measureSpan.style.font = style.font || `${style.fontSize} ${style.fontFamily}`;
    measureSpan.style.letterSpacing = style.letterSpacing;
    measureSpan.style.textTransform = style.textTransform;

    const value = input.value || input.placeholder || ' ';
    measureSpan.textContent = value;

    const contentWidth = measureSpan.offsetWidth;
    const paddingLeft = parseFloat(style.paddingLeft || '0');
    const paddingRight = parseFloat(style.paddingRight || '0');
    const borderLeft = parseFloat(style.borderLeftWidth || '0');
    const borderRight = parseFloat(style.borderRightWidth || '0');
    const paddingAndBorder = paddingLeft + paddingRight + borderLeft + borderRight;

    const boxSizing = style.boxSizing;
    let finalWidth = contentWidth;
    if (boxSizing === 'border-box') finalWidth += paddingAndBorder;

    input.style.width = Math.max(Math.ceil(finalWidth + 2), 20) + 'px';
    measureSpan.remove();
  }

  function handleEvent() {
    const input = inputRef.value;
    if (!input) return;
    modelValue.value = input.value.trim();
    updateInputLength();
  }

  onMounted(() => {
    handleEvent();
    updateInputLength();
  });
</script>

<template>
  <input
    ref="input-ref"
    type="text"
    :value="modelValue"
    v-bind="$attrs"
    @input="handleEvent"
    @blur="handleEvent"
  />
</template>
