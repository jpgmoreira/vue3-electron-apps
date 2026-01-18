<script lang="ts" setup>
  import { Contest } from '@common/schemas/contests';
  import { parseTimestamp } from '@interapp/utils/dateUtils';

  const props = defineProps<{ contest: Contest }>();

  function addProblem() {}
</script>

<template>
  <div>
    <header>
      <div>
        Contest:
        <strong>{{ props.contest.name }}</strong>
      </div>
      <div class="flex justify-between items-center">
        <div>
          Created at:
          <strong>{{ parseTimestamp(contest.createdAt) }}</strong>
        </div>
        <button type="button" class="btn-primary btn-small" @click="addProblem">Add problem</button>
      </div>
    </header>
  </div>
</template>
