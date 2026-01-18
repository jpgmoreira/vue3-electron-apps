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
  function toggleProblemFlag(problem: ContestProblem, flag: ContestProblemFlag) {
    problem[flag] = !problem[flag];
    updateContestProblem(problem);
  }
  async function deleteProblem(problem: ContestProblem) {
    await window.api.invoke(InvokeChannels.deleteContestProblem, contest.value.id, problem.id);
    contest.value.problems = contest.value.problems.filter((p) => p.id !== problem.id);
  }
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
  <div class="contest-container">
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
        <tr
          v-for="problem in problemsSorted"
          :key="problem.id"
          :class="{ todo: problem.todo, solved: problem.solved }"
        >
          <td>
            <input
              v-model="problem.title"
              spellcheck="false"
              type="text"
              class="font-bold"
              @input="updateContestProblem(problem)"
            />
            <div class="flags-container absolute w-full left-0 flex justify-between">
              <div>
                <img
                  class="flag flag-trash"
                  v-tooltip="'Double-click to delete.'"
                  :src="trash"
                  @dblclick="deleteProblem(problem)"
                />
              </div>
              <div class="flex gap-1">
                <img
                  class="flag flag-todo"
                  :class="{ active: problem.todo }"
                  :src="todo"
                  @click="toggleProblemFlag(problem, 'todo')"
                />
                <img
                  class="flag flag-star"
                  :class="{ active: problem.favorite }"
                  :src="star"
                  @click="toggleProblemFlag(problem, 'favorite')"
                />
                <img
                  class="flag flag-solved"
                  :class="{ active: problem.solved }"
                  :src="solved"
                  @click="toggleProblemFlag(problem, 'solved')"
                />
              </div>
            </div>
          </td>
          <td>
            <input
              type="text"
              spellcheck="false"
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
  table td input {
    position: absolute;
    inset: 0;
    text-align: center;
  }
  table textarea {
    max-height: 200px;
    min-height: 35px;
  }
  .flag {
    cursor: pointer;
    width: 19px;
    height: 19px;
    transform: translateY(-100%);
    opacity: 0;
    transition: opacity 0.15s ease;
  }
  .flags-container {
    padding: 0 3px;
    bottom: 1px;
    height: 0px;
  }
  tr:hover .flag:not(.active):not(:hover) {
    opacity: 0.5;
  }
  .flag.active,
  .flag:hover {
    opacity: 1;
  }
</style>
