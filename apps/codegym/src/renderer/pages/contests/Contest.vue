<script lang="ts" setup>
  import { computed } from 'vue';
  import { Contest, ContestProblem, ContestProblemFlag } from '@common/schemas/contests';
  import { parseTimestamp } from '@interapp/utils/dateUtils';
  import { InvokeChannels } from '@preload/channels/invoke';
  const props = defineProps<{ contest: Contest }>();
  const problemsSorted = computed(() => {
    return props.contest.problems.sort(compare);
  });
  function compare(a: ContestProblem, b: ContestProblem) {
    const numA = Number(a.accepted);
    const numB = Number(b.accepted);
    const isNumA = !isNaN(numA);
    const isNumB = !isNaN(numB);
    if (isNumA && isNumB) return numB - numA;
    else if (isNumA) return -1;
    else if (isNumB) return 1;
    return 0;
  }
  async function addProblem() {
    const problem = await window.api.invoke<ContestProblem>(
      InvokeChannels.addContestProblem,
      props.contest.id
    );
    props.contest.problems.push(problem);
  }
  function updateContestNotes() {}
  function updateContestProblem(problem: ContestProblem) {}
  function toggleProblemFlag(problem: ContestProblem, flag: ContestProblemFlag) {}
  function deleteProblem(problem: ContestProblem) {}
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
    <table v-if="contest.problems.length">
      <thead>
        <tr>
          <th>Problem</th>
          <th>#Accepted</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="problem in problemsSorted">
          <td>
            <input v-model="problem.title" type="text" @input="updateContestProblem(problem)" />
            <!-- <span @click="toggleProblemFlag(problem, 'solved')">
              <img :src="solved" />
            </span>
            <span @click="toggleProblemFlag(problem, 'todo')">
              <img :src="todo" />
            </span>
            <span @click="toggleProblemFlag(problem, 'favorite')">
              <img :src="star" />
            </span>
            <span @dblclick="deleteProblem(problem)">
              <img :src="trash" />
            </span> -->
          </td>
          <td>
            <input type="text" :value="problem.accepted" />
          </td>
          <td>
            <textarea
              v-model="problem.notes"
              spellcheck="false"
              @input="updateContestProblem(problem)"
            ></textarea>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
  textarea {
    display: flex;
    resize: none;
    width: 100%;
    field-sizing: content;
    padding: 2px 4px;
  }
</style>
