<script lang="ts" setup>
  import { ref, onMounted, onBeforeUnmount, watch, computed, toRaw } from 'vue';
  import { Contest, ContestProblem, ContestProblemFlag } from '@common/schemas/contests';
  import { useProfileStore } from '@renderer/store/profile';
  import { useGraphStore } from '@renderer/store/graph';
  import { getTodayDate, parseTimestamp } from '@common/utils/dateUtils';
  import TreeView from '@renderer/components/UI/TreeView/TreeView.vue';
  import SettingsPageHeader from '@renderer/components/Header/custom/SettingsPageHeader.vue';
  import { Channels } from '@common/types/channels';
  import solved from '@renderer/assets/images/solved.png';
  import todo from '@renderer/assets/images/to-do-list.png';
  import trash from '@renderer/assets/images/trash.png';
  import star from '@renderer/assets/images/star.png';

  const profileStore = useProfileStore();
  const graphStore = useGraphStore();

  const treeAreaWidth = ref(300);
  const contestsAreaWidth = ref(window.innerWidth - 300);
  const isResizing = ref(false);

  const contest = ref<Contest | null>(null);
  const loaded = ref(false);

  const currContestId = computed(() => profileStore.currProfile?.currContestId);

  const sortedContestProblems = computed(() => {
    if (contest.value && contest.value.problems.length) {
      return contest.value.problems.sort(compareProblems);
    }
    return [];
  });

  function compareProblems(a: ContestProblem, b: ContestProblem) {
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
    const problem = await window.api.invoke<ContestProblem>(Channels.addCurrContestProblem);
    contest.value?.problems.push(problem);
  }

  function updateContestNotes() {
    if (!contest.value) return;
    window.api.send(Channels.updateCurrContestNotes, contest.value.notes);
  }

  function updateCurrContestProblem(problem: ContestProblem) {
    window.api.send(Channels.updateCurrContestProblem, toRaw(problem));
  }

  function acceptedInputChange(problem: ContestProblem, e: Event) {
    problem.accepted = (e.target as HTMLInputElement).value.trim();
    updateCurrContestProblem(problem);
  }

  async function setActiveContest(contestId: string) {
    // Sets the active contest and then retrieve it from back.
    profileStore.setCurrContest(contestId);
    contest.value = await profileStore.getCurrContest();
  }

  function renameContest(newName: string) {
    if (!contest.value) return;
    contest.value.name = newName;
  }

  function deleteSingleContest(contestId: string) {
    if (!contest.value) return;
    if (contest.value.id === contestId) {
      profileStore.setCurrContest(null);
    }
  }

  async function deleteMultipleContests() {
    // Get curr contest again, if it was deleted, back will return null.
    contest.value = await profileStore.getCurrContest();
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

  async function toggleProblemFlag(problem: ContestProblem, flag: ContestProblemFlag) {
    // await here because the tree can be updated in the back with this call,
    // and "problem[flag] = !problem[flag]" will trigger a new tree refetch.
    await window.api.invoke(Channels.toggleCurrContestProblemFlag, problem.id, flag);
    problem[flag] = !problem[flag];
    if (flag === 'solved') {
      const prevDate = problem.solvedDate;
      const today = getTodayDate();
      if (problem.solved) {
        problem.solvedDate = today;
        graphStore.updateGraphData('contests', today, 1);
      } else {
        problem.solvedDate = null;
        if (prevDate === today) {
          // See "contestsManager.ts", method "toggleCurrContestProblemFlag" for context.
          graphStore.updateGraphData('contests', today, -1);
        }
      }
    }
  }

  async function deleteProblem(problem: ContestProblem) {
    if (!contest.value) return;
    await window.api.invoke(Channels.deleteCurrContestProblem, problem.id);
    contest.value.problems = contest.value.problems.filter((p) => p.id !== problem.id);
  }

  function windowMouseUp() {
    isResizing.value = false;
  }

  function windowMouseMove(e: MouseEvent) {
    if (!isResizing.value) return;
    treeAreaWidth.value = e.clientX;
    contestsAreaWidth.value = window.innerWidth - e.clientX;
    window.getSelection()?.removeAllRanges();
  }

  watch(
    currContestId,
    async () => {
      contest.value = await profileStore.getCurrContest();
      loaded.value = true;
    },
    { immediate: true }
  );
  onMounted(() => {
    window.addEventListener('mouseup', windowMouseUp);
    window.addEventListener('mousemove', windowMouseMove);
  });
  onBeforeUnmount(() => {
    window.removeEventListener('mouseup', windowMouseUp);
    window.removeEventListener('mousemove', windowMouseMove);
  });
</script>

<template>
  <div
    class="contests-page main-container flex flex-col h-[100vh]"
    :class="{ resizing: isResizing }"
  >
    <SettingsPageHeader />
    <div class="flex grow">
      <div :style="{ width: `${treeAreaWidth}px` }">
        <TreeView
          class="select-none"
          files-hint
          search
          file-icon
          @set-active="setActiveContest"
          @rename="renameContest"
          @delete-single="deleteSingleContest"
          @delete-multiple="deleteMultipleContests"
        />
      </div>
      <div
        class="separator shrink-0"
        :class="{ resizing: isResizing }"
        @mousedown="isResizing = true"
      ></div>
      <div class="flex grow" :style="{ width: `${contestsAreaWidth}px` }">
        <div
          v-if="loaded && !contest"
          class="flex grow items-center justify-center overflow-hidden select-none"
        >
          <span class="text-xl opacity-70 whitespace-nowrap">Create or select a contest</span>
        </div>
        <div v-else-if="loaded && contest" class="w-full overflow-auto flex flex-col">
          <section class="header-section px-3 py-1">
            <div>
              Contest:
              <strong>{{ contest.name }}</strong>
            </div>
            <div class="flex whitespace-nowrap items-center justify-between">
              <div class="truncate">
                Created at:
                <strong>{{ parseTimestamp(contest.createdAt) }}</strong>
              </div>
              <button type="button" class="btn-primary btn-small" @click="addProblem">
                Add problem
              </button>
            </div>
          </section>
          <div v-if="contest.problems.length" class="pb-20">
            <textarea
              v-model="contest.notes"
              placeholder="Contest notes"
              class="p-1 contest-notes"
              @change="updateContestNotes"
            ></textarea>
            <table class="w-full">
              <colgroup>
                <col class="col-problem" />
                <col class="col-accepted" />
                <col class="col-notes" />
              </colgroup>
              <thead>
                <tr>
                  <th>Problem</th>
                  <th>#Accepted</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="problem in sortedContestProblems"
                  :key="problem.id"
                  class="no-hover problem-tr"
                  :class="{
                    todo: problem.todo,
                    solved: problem.solved,
                    favorite: problem.favorite,
                  }"
                >
                  <td class="font-bold relative">
                    <input
                      v-model="problem.title"
                      class="top-0 bottom-0 left-0 right-0"
                      type="text"
                      @change="updateCurrContestProblem(problem)"
                    />
                    <span
                      class="absolute icon solved"
                      @dragstart.prevent
                      @click="toggleProblemFlag(problem, 'solved')"
                    >
                      <img :src="solved" />
                    </span>
                    <span
                      class="absolute icon todo"
                      @dragstart.prevent
                      @click="toggleProblemFlag(problem, 'todo')"
                    >
                      <img :src="todo" />
                    </span>
                    <span
                      class="absolute icon favorite"
                      @dragstart.prevent
                      @click="toggleProblemFlag(problem, 'favorite')"
                    >
                      <img :src="star" />
                    </span>
                    <span
                      class="absolute icon trash"
                      @dragstart.prevent
                      @dblclick="deleteProblem(problem)"
                    >
                      <img :src="trash" />
                      <span class="tooltip select-none absolute">Double-click to delete.</span>
                    </span>
                  </td>
                  <td>
                    <input
                      type="text"
                      :value="problem.accepted"
                      @change="(e: Event) => acceptedInputChange(problem, e)"
                      @keydown="acceptedInputKeydown"
                    />
                  </td>
                  <td>
                    <textarea
                      v-model="problem.notes"
                      class="p-1 problem-notes"
                      @change="updateCurrContestProblem(problem)"
                    ></textarea>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="flex grow items-center justify-center text-lg opacity-70">
            Add a new problem
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .main-container.resizing {
    cursor: ew-resize;
  }
  .separator {
    width: 5px;
    background: gray;
  }
  .separator:hover,
  .separator.resizing {
    background: #007bd1;
    cursor: ew-resize;
  }
  td {
    padding: 0;
    margin: 0;
    height: 45px;
  }
  tbody tr:hover {
    background-color: auto;
  }
  input[type='text'] {
    height: 100%;
    width: 100%;
    border-radius: 0;
    text-align: center;
  }
  .col-problem {
    width: 30%;
  }
  .col-accepted {
    width: 15%;
  }
  textarea {
    field-sizing: content; /** CSS experimental. Should work fine on recent electron versions. */
    resize: none;
    display: block;
    width: 100%;
  }
  .contest-notes {
    min-height: 100px;
    max-height: 300px;
  }
  .problem-notes {
    height: 100%;
    max-height: 200px;
  }
  .icon img {
    width: 20px;
    height: 20px;
  }
  .icon {
    bottom: 2px;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease;
    cursor: pointer;
  }
  .problem-tr:hover .icon {
    visibility: visible;
    opacity: 0.5;
  }
  .problem-tr.todo .icon.todo,
  .problem-tr.solved .icon.solved,
  .problem-tr.favorite .icon.favorite {
    visibility: visible;
    opacity: 1;
  }
  .icon:hover {
    opacity: 1 !important;
  }
  .icon.solved {
    right: 2px;
  }
  .icon.todo {
    right: calc(2px + 20px + 2px);
  }
  .icon.favorite {
    right: calc(2px + 20px + 2px + 20px);
  }
  .icon.trash {
    left: 2px;
  }
  .tooltip {
    visibility: hidden;
    font-weight: normal;
    top: calc(100% + 3px);
    width: 120px;
  }
  .icon:hover .tooltip {
    visibility: visible;
  }
</style>
