<script lang="ts" setup>
  import { Note } from '@common/schemas/notes';

  const props = defineProps<{
    note: Note;
  }>();
</script>

<template>
  <div>
    {{ note.head }}
  </div>
</template>
