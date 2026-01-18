<script lang="ts" setup>
  import { ref, computed, watch } from 'vue';
  import { Contest, ContestProblem, ContestProblemFlag } from '@common/schemas/contests';
  import { parseTimestamp } from '@interapp/utils/dateUtils';
  import { InvokeChannels } from '@preload/channels/invoke';
  import { cloneDeep, toRawDeep } from '@interapp/utils/utils';
  import solved from '@renderer/assets/images/solved.png';
  import todo from '@renderer/assets/images/to-do-list.png';
  import trash from '@renderer/assets/images/trash.png';
  import star from '@renderer/assets/images/star.png';
  const props = defineProps<{ currContest: Contest }>();
  const contest = ref(cloneDeep(props.currContest));
  const problemsSorted = computed(() => {
    return [...contest.value.problems].sort(compare);
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
      contest.value.id
    );
    contest.value.problems.push(problem);
  }
  function updateContestNotes() {
    window.api.invoke(InvokeChannels.updateContestNotes, contest.value.id, contest.value.notes);
  }
  function updateContestProblem(problem: ContestProblem) {
    window.api.invoke(InvokeChannels.updateContestProblem, contest.value.id, toRawDeep(problem));
  }
  function toggleProblemFlag(problem: ContestProblem, flag: ContestProblemFlag) {}
  function deleteProblem(problem: ContestProblem) {}
  function acceptedInputKeydown(e: KeyboardEvent) {
    const allowedKeys = [
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'Tab',
      'Enter',
      'Home',
      'End',
    ];
    if (!allowedKeys.includes(e.key) && !/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  }
  function acceptedInputChange(problem: ContestProblem, e: Event) {
    problem.accepted = (e.target as HTMLInputElement).value.trim();
    updateContestProblem(problem);
  }
  watch(
    () => props.currContest,
    (newContest) => {
      contest.value = cloneDeep(newContest);
    },
    { immediate: true }
  );
</script>

<template>
  <div>
    <header class="contest-header whitespace-nowrap select-none p-1">
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
          <th class="col-problem">Problem</th>
          <th class="col-accepted">#Accepted</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="problem in problemsSorted" :key="problem.id">
          <td>
            <input
              v-model="problem.title"
              spellcheck="false"
              type="text"
              class="absolute inset-0 text-center font-bold"
              @input="updateContestProblem(problem)"
            />
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
            <input
              type="text"
              spellcheck="false"
              class="absolute inset-0 text-center"
              :value="problem.accepted"
              @change="(e: Event) => acceptedInputChange(problem, e)"
              @keydown="acceptedInputKeydown"
            />
          </td>
          <td class="!p-0">
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
  .col-problem {
    width: 30%;
  }
  .col-accepted {
    width: 15%;
  }
  table td {
    position: relative;
  }
  table textarea {
    max-height: 200px;
  }

  .contest-header {
    background-color: #282b30;
  }
  table th {
    background-color: #26292b;
    border-bottom: 1px solid white;
  }
  table textarea,
  table input {
    border: none;
    border-radius: 0 !important;
    background-color: #26292b;
  }
  table td:focus-within::after {
    content: '';
    position: absolute;
    inset: 0px;
    border: 2px solid rgba(255, 255, 255, 0.15);
    pointer-events: none;
  }
</style>
