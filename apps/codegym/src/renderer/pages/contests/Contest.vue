<script lang="ts" setup>
  import { Contest } from '@common/schemas/contests';
  import { parseTimestamp } from '@interapp/utils/dateUtils';
  // Technically, you should not mutate a prop's properties, because it can cause
  // side-effects on the parent. However here this is not a problem.
  const props = defineProps<{ contest: Contest }>();

  function addProblem() {}
  function updateContestNotes() {}
</script>

<template>
  <div>
    <header class="whitespace-nowrap select-none p-1">
      <div>
        Contest:
        <strong>{{ contest.name }}</strong>
      </div>
      <div class="flex justify-between items-center">
        <div>
          Created at:
          <strong>{{ parseTimestamp(contest.createdAt) }}</strong>
        </div>
        <button type="button" class="btn-primary btn-small" @click="addProblem">Add problem</button>
      </div>
    </header>
    <textarea
      placeholder="Notes"
      spellcheck="false"
      class="min-h-20"
      v-model="contest.notes"
      @input="updateContestNotes"
    ></textarea>
  </div>
</template>

<style scoped>
  textarea {
    resize: none;
    width: 100%;
    field-sizing: content;
    padding: 2px 4px;
  }
</style>
