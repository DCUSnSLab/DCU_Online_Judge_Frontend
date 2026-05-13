<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, required: true },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  autocomplete: { type: String, default: 'off' },
  help: { type: String, default: null },
  error: { type: String, default: null },
  mono: { type: Boolean, default: true }
})

const emit = defineEmits(['update:modelValue', 'blur'])

const value = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const useMono = computed(() => props.mono && props.type !== 'password')
</script>

<template>
  <div :class="['field', error && 'field-error']">
    <label class="mono field-label">{{ label }}</label>
    <input
      v-model="value"
      :type="type"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :class="['input', useMono && 'mono']"
      @blur="$emit('blur', $event)"
    />
    <div v-if="error" class="field-msg field-msg-error">{{ error }}</div>
    <div v-else-if="help" class="field-msg">{{ help }}</div>
  </div>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}
.field-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-2);
  text-transform: uppercase;
  letter-spacing: 1px;
}
.input {
  width: 100%;
  height: 38px;
  padding: 0 12px;
  border-radius: var(--r-md);
  border: 1px solid var(--line-strong);
  background: var(--surface);
  color: var(--ink);
  font-size: 13px;
  font-family: inherit;
  outline: none;
  transition:
    border-color var(--t-fast) var(--ease-out),
    box-shadow var(--t-fast) var(--ease-out);
}
.input::placeholder {
  color: var(--ink-4);
}
.input:focus {
  border-color: var(--accent);
  box-shadow: var(--focus-ring);
}
.field-error .input {
  border-color: var(--status-wa);
}
.field-error .input:focus {
  box-shadow: 0 0 0 3px oklch(0.58 0.18 28 / 0.2);
}
.field-msg {
  font-size: 11px;
  color: var(--ink-3);
}
.field-msg-error {
  color: var(--status-wa);
}
</style>
