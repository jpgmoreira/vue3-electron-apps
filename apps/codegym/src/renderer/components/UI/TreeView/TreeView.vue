<script lang="ts" setup>
  import Modal from '../Modal.vue';
  import ContextMenu from './ContextMenu.vue';
  import { TreeOperationResponseDTO } from '@common/dto/treeOperationResponseDTO';
  import { NodeType, Node, DirNode } from '@common/types/tree';
  import { ModifierKeys } from '@common/types/keys';
  import { TreeChannels } from '@common/types/treeChannels';
  import {
    ref,
    onMounted,
    reactive,
    nextTick,
    onBeforeUnmount,
    useTemplateRef,
    computed,
  } from 'vue';
  import { GenericResponseDTO } from '@common/dto/genericResponseDTO';
  import { useUIStore } from '@renderer/store/ui';
  import { toLocaleNumber } from '@common/utils/utils';

  // --- Types: ---

  type ContextState = {
    type: NodeType | 'root';
    visible: boolean;
    activeNode: Node | null;
    activeDomNode: HTMLInputElement | null;
    x: number;
    y: number;
  };

  type ModalState = {
    visible: boolean;
    currentNode: Node | null;
    multiple: boolean;
    isDeleting: boolean;
  };

  // --- Props and emits: ---

  const props = withDefaults(
    defineProps<{
      checkbox?: boolean;
      filesHint?: boolean;
      search?: boolean;
      dirIcon?: boolean;
      fileIcon?: boolean;
    }>(),
    {
      checkbox: false,
      filesHint: false,
      search: false,
      dirIcon: false,
      fileIcon: false,
    }
  );

  const emit = defineEmits<{
    (e: 'setActive', contestId: string): void;
    (e: 'rename', newName: string): void;
    (e: 'deleteSingle', contestId: string): void;
    (e: 'deleteMultiple'): void;
  }>();

  // --- Variables: ---

  const rowHeight = 28;
  const paddingBottom = 250;

  const uiStore = useUIStore();

  const keys: ModifierKeys = {
    ctrl: false,
  };

  const hasLoaded = ref(false);
  const tree = ref<TreeOperationResponseDTO | null>(null);
  const contextState = reactive<ContextState>({
    type: 'root',
    visible: false,
    activeNode: null,
    activeDomNode: null,
    x: 0,
    y: 0,
  });

  const modalState = reactive<ModalState>({
    currentNode: null,
    multiple: false,
    visible: false,
    isDeleting: false,
  });

  const renamingNode = ref<Node | null>(null);
  const originalName = ref('');
  const searchText = ref('');
  const scrollTimer = ref<ReturnType<typeof setTimeout> | undefined>(undefined);

  const isSearching = ref(false);
  const showFilesSelectedBadge = ref(false);
  const nodeContainerOffset = ref(0);

  const scrollContainer = useTemplateRef('scroll-container');
  const treeView = useTemplateRef('tree-view');

  const ghostStyle = computed(() => ({
    height: `${rowHeight * (tree.value?.nSurfaceNodes || 0) + paddingBottom}px`,
  }));

  const selectedFilesText = computed(() => {
    if (!tree.value) return '0 contests';
    const val = toLocaleNumber(tree.value.nSelectedFiles);
    return val === '1' ? '1 contest' : `${val} contests`;
  });

  const nSelectedFolders = computed(() => {
    if (!tree.value) return 0;
    return tree.value.nSelectedNodes - tree.value.nSelectedFiles;
  });

  const selectedFoldersText = computed(() => {
    if (!tree.value) return '0 folders';
    const val = toLocaleNumber(nSelectedFolders.value);
    return val === '1' ? '1 folder' : `${val} folders`;
  });

  // --- Context menu: ---

  function showContextMenu(type: ContextState['type'], targetNode: Node | null, e: MouseEvent) {
    contextState.visible = true;
    contextState.type = type;
    contextState.x = e.clientX;
    contextState.y = e.clientY;
    contextState.activeNode = targetNode;
    contextState.activeDomNode = e.target as HTMLInputElement;
  }

  // --- Node creation: ---

  async function createNode(type: NodeType) {
    const node = contextState.activeNode;
    const parentId = node ? node.id : null;
    const prefix = type === 'dir' ? 'Folder' : 'Contest';
    tree.value = await window.api.invoke(
      TreeChannels.createNode,
      tree.value?.anchor || 0,
      type,
      prefix,
      parentId
    );
  }

  async function createNodeAbove(type: NodeType) {
    const node = contextState.activeNode;
    if (!node) return;
    const prefix = type === 'dir' ? 'Folder' : 'Contest';
    tree.value = await window.api.invoke(
      TreeChannels.createNodeAbove,
      tree.value?.anchor || 0,
      type,
      prefix,
      node.id
    );
  }

  async function createNodeBelow(type: NodeType) {
    const node = contextState.activeNode;
    if (!node) return;
    const prefix = type === 'dir' ? 'Folder' : 'Contest';
    tree.value = await window.api.invoke(
      TreeChannels.createNodeBelow,
      tree.value?.anchor || 0,
      type,
      prefix,
      node.id
    );
  }

  // --- Toggle dir open: ---

  async function toggleDirOpen(node: Node) {
    tree.value = await window.api.invoke(
      TreeChannels.toggleDirOpen,
      tree.value?.anchor || 0,
      node.id
    );
  }

  async function collapseAll() {
    tree.value = await window.api.invoke(TreeChannels.collapseAll, tree.value?.anchor || 0);
  }

  // --- Renaming: ---

  function startRenaming() {
    const node = contextState.activeNode;
    if (!node) return;
    originalName.value = node.text.trim();
    renamingNode.value = node;
    contextState.activeDomNode?.focus();
    contextState.activeDomNode?.select();
  }

  async function applyRenaming() {
    const node = renamingNode.value;
    if (!node) return;
    const newName = node.text.trim();
    if (!newName) {
      uiStore.showToast('Name cannot be empty!', 'error');
      node.text = originalName.value;
    } else if (newName !== originalName.value) {
      const result = await window.api.invoke<GenericResponseDTO>(
        TreeChannels.renameNode,
        node.id,
        newName
      );
      if (result.status === 'error') {
        uiStore.showToast(result.errorMsg, 'error');
        node.text = originalName.value;
      } else {
        emit('rename', newName);
      }
    }
    renamingNode.value = null;
    nextTick(() => {
      contextState.activeDomNode?.focus();
      contextState.activeDomNode?.blur();
    });
  }

  function undoRenaming() {
    if (!renamingNode.value) return;
    renamingNode.value.text = originalName.value;
    renamingNode.value = null;
    nextTick(() => {
      contextState.activeDomNode?.focus();
      contextState.activeDomNode?.blur();
    });
  }

  // --- Selection: ---

  async function handleSelection(node: Node) {
    if (isNodeDisabled(node)) return; // Do not allow folder selection while searching.
    const localKeys = { ...keys };
    const nextState = !node.selected;
    if (props.checkbox) localKeys.ctrl = true;
    tree.value = await window.api.invoke(
      TreeChannels.handleSelection,
      tree.value?.anchor || 0,
      node.id,
      localKeys
    );
    if (!localKeys.ctrl && node.type === 'file' && nextState) {
      emit('setActive', node.contestId);
    }
  }

  async function clearSelection() {
    tree.value = await window.api.invoke(TreeChannels.clearSelection, tree.value?.anchor || 0);
  }

  async function selectAll() {
    tree.value = await window.api.invoke(TreeChannels.selectAll, tree.value?.anchor || 0);
  }

  // --- Deletion: ---

  async function deleteNode() {
    const node = modalState.currentNode;
    if (!node) return;
    tree.value = await window.api.invoke(TreeChannels.deleteNode, tree.value?.anchor || 0, node.id);
    if (node.type === 'file') {
      emit('deleteSingle', node.contestId);
    }
  }

  async function deleteSelectedNodes() {
    tree.value = await window.api.invoke(TreeChannels.deleteSelectedNodes, tree.value?.anchor || 0);
    emit('deleteMultiple');
  }

  async function handleDeletion() {
    modalState.isDeleting = true;
    if (modalState.multiple) await deleteSelectedNodes();
    else await deleteNode();
    modalState.isDeleting = false;
    closeModal();
  }

  function openDeleteNodeModal() {
    modalState.currentNode = contextState.activeNode;
    modalState.visible = true;
    modalState.multiple = false;
  }

  function openDeleteSelectedNodesModal() {
    modalState.currentNode = null;
    modalState.visible = true;
    modalState.multiple = true;
  }

  function closeModal() {
    modalState.currentNode = null;
    modalState.visible = false;
    modalState.multiple = false;
  }

  // --- Search: ---

  async function search() {
    const text = searchText.value.trim();
    tree.value = await window.api.invoke(TreeChannels.search, tree.value?.anchor || 0, text);
    nextTick(() => {
      isSearching.value = Boolean(text);
    });
  }

  // --- Movement: ---

  async function moveSelection(channel: TreeChannels) {
    if (!tree.value) return;
    tree.value = await window.api.invoke(
      channel,
      tree.value.anchor || 0,
      contextState.activeNode?.id || null
    );
  }

  async function moveSelectionToRoot() {
    if (!tree.value) return;
    tree.value = await window.api.invoke(
      TreeChannels.moveSelectedNodesInto,
      tree.value.anchor || 0,
      null
    );
  }

  // --- Helpers: ---

  function isCheckIndeterminate(node: Node) {
    return Boolean(node.type === 'dir' && node.nSelDesc && node.nSelDesc < node.nDesc);
  }

  function isNodeDisabled(node: Node) {
    return node.type === 'dir' && isSearching.value;
  }

  function fileHintText(node: DirNode) {
    return node.nFileDesc === 1 ? '1 contest' : `${toLocaleNumber(node.nFileDesc)} contests`;
  }

  // --- Events: ---

  let lastScrollTop = 0;
  function handleScroll() {
    if (!scrollContainer.value) return;
    contextState.visible = false;
    const scrollTop = scrollContainer.value.scrollTop;
    if (scrollTop === lastScrollTop) return; // Do not react on x scroll;
    lastScrollTop = scrollTop;
    clearTimeout(scrollTimer.value);
    setTimeout(async () => {
      const container = scrollContainer.value;
      if (!container) return;
      const scrollTop = container.scrollTop;
      const newAnchor = Math.max(0, Math.floor(scrollTop / rowHeight) - 30);
      tree.value = await window.api.invoke<TreeOperationResponseDTO>(
        TreeChannels.getState,
        newAnchor
      );
      nodeContainerOffset.value = tree.value.anchor * rowHeight; // This is the key! Using a computed-value causes flickering.
    }, 40);
  }

  function containerMouseEnter() {
    if (tree.value?.nTotalNodes) {
      showFilesSelectedBadge.value = true;
    }
  }

  function containerMouseLeave() {
    showFilesSelectedBadge.value = false;
  }

  function windowKeyDown(e: KeyboardEvent) {
    if (e.key === 'Control') keys.ctrl = true;
  }

  function windowKeyUp(e: KeyboardEvent) {
    if (e.key === 'Control') keys.ctrl = false;
  }

  function windowClick(e: MouseEvent) {
    const root = treeView.value;
    if (!root) return;
    if (contextState.visible && !root.contains(e.target as globalThis.Node)) {
      contextState.visible = false;
    }
  }

  // --- Hooks: ---

  onMounted(async () => {
    tree.value = await window.api.invoke(TreeChannels.getState, 0);
    hasLoaded.value = true;
    window.addEventListener('click', windowClick);
    window.addEventListener('keydown', windowKeyDown);
    window.addEventListener('keyup', windowKeyUp);
  });
  onBeforeUnmount(async () => {
    await window.api.invoke(TreeChannels.search, 0, ''); // Clear search when leaving.
    window.removeEventListener('click', windowClick);
    window.removeEventListener('keydown', windowKeyDown);
    window.removeEventListener('keyup', windowKeyUp);
  });
</script>

<template>
  <div
    v-if="hasLoaded"
    ref="tree-view"
    class="treeview relative h-full"
    @click.right="(e) => showContextMenu('root', null, e)"
    @click="() => (contextState.visible = false)"
    @mouseenter="containerMouseEnter"
    @mouseleave="containerMouseLeave"
  >
    <!-- The modal belongs to here, because the delete node operation belongs to here,
   and the modal must intercept the delete node operation to request for confirmation. -->
    <Modal :visible="modalState.visible" :frozen="modalState.isDeleting" @close="closeModal">
      <template #header>
        <div v-if="!modalState.multiple && modalState.currentNode?.type === 'dir'">
          Delete folder
          <strong>"{{ modalState.currentNode.text }}"</strong>
        </div>
        <div v-else-if="!modalState.multiple && modalState.currentNode?.type === 'file'">
          Delete contest
          <strong>"{{ modalState.currentNode.text }}"</strong>
        </div>
        <div v-else>Delete selection</div>
      </template>
      <template #body>
        <div class="flex flex-col text-center">
          <template v-if="!modalState.multiple && modalState.currentNode">
            <span>
              Are you sure you want to delete the
              <strong>"{{ modalState.currentNode.text }}"</strong>
              {{ modalState.currentNode.type === 'dir' ? 'folder' : 'contest' }}?
            </span>
            <span class="text-danger text-xl my-2">This action cannot be undone!</span>
            <div
              v-if="modalState.isDeleting"
              class="text-danger text-xl flex items-center justify-center"
            >
              Deleting...
              <span class="loader ml-2"></span>
            </div>
          </template>
          <template v-else>
            <span>
              Are you sure you want to delete
              <strong>{{ tree?.nSelectedFiles || 0 }}</strong>
              {{ tree?.nSelectedFiles === 1 ? 'contest' : 'contests' }}
              and
              <strong>{{ nSelectedFolders }}</strong>
              {{ nSelectedFolders === 1 ? 'folder' : 'folders' }}?
            </span>
            <span class="text-danger text-xl my-2">This action cannot be undone!</span>
            <div
              v-if="modalState.isDeleting"
              class="text-danger text-xl flex items-center justify-center"
            >
              Deleting...
              <span class="loader ml-2"></span>
            </div>
          </template>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-between">
          <button
            type="button"
            class="btn-secondary"
            :disabled="modalState.isDeleting"
            @click="closeModal"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn-danger"
            :disabled="modalState.isDeleting"
            @click="handleDeletion"
          >
            Delete
          </button>
        </div>
      </template>
    </Modal>

    <ContextMenu
      class="z-[3]"
      :tree="tree"
      :n-selected-folders="nSelectedFolders"
      :n-open-dirs="tree?.nOpenDirs || 0"
      :is-searching="isSearching"
      v-bind="contextState"
      @create-node="createNode"
      @create-node-above="createNodeAbove"
      @create-node-below="createNodeBelow"
      @rename-node="startRenaming"
      @delete-node="openDeleteNodeModal"
      @delete-selected-nodes="openDeleteSelectedNodesModal"
      @collapse-all="collapseAll"
      @clear-selection="clearSelection"
      @select-all="selectAll"
      @move-selected-files-above="() => moveSelection(TreeChannels.moveSelectedFilesAbove)"
      @move-selected-files-below="() => moveSelection(TreeChannels.moveSelectedFilesBelow)"
      @move-selected-folders-above="() => moveSelection(TreeChannels.moveSelectedFoldersAbove)"
      @move-selected-folders-below="() => moveSelection(TreeChannels.moveSelectedFoldersBelow)"
      @move-selected-nodes-into="() => moveSelection(TreeChannels.moveSelectedNodesInto)"
      @move-selected-nodes-to-root="moveSelectionToRoot"
    />
    <Transition name="fade">
      <div v-show="showFilesSelectedBadge" class="z-[2] files-selected-badge text-sm font-bold">
        <div>{{ selectedFilesText }} and</div>
        <div>{{ selectedFoldersText }} selected</div>
      </div>
    </Transition>

    <div
      v-if="!isSearching && !tree?.visibleNodes.length"
      class="absolute-center flex justify-center whitespace-nowrap text-lg opacity-70 w-full overflow-hidden"
    >
      Right-click here
    </div>
    <div
      v-else-if="tree"
      ref="scroll-container"
      class="absolute top-0 left-0 w-full z-[1] overflow-auto h-full"
      @scroll="handleScroll"
    >
      <div v-if="props.search" class="flex w-full sticky left-0 right-0">
        <input
          v-model.trim="searchText"
          class="w-full rounded-none"
          type="text"
          placeholder="Search for contests..."
          @keydown.enter="search"
        />
        <button type="button" class="btn-primary rounded-none" @click="search">Search</button>
      </div>
      <div class="relative">
        <div :style="ghostStyle"></div>
        <div
          :style="{ transform: `translateY(${nodeContainerOffset}px)` }"
          class="nodes-container absolute top-0 left-0"
        >
          <div
            v-for="node in tree.visibleNodes"
            :key="node.id"
            class="flex items-center whitespace-nowrap"
          >
            <span v-for="_ in node.depth" class="indent-span"></span>
            <span
              v-if="node.type === 'dir'"
              class="node-caret"
              :class="{ closed: !node.open }"
              @click="toggleDirOpen(node)"
            ></span>

            <div class="flex items-center" @click="handleSelection(node)">
              <input
                v-if="props.checkbox"
                class="input-checkbox"
                type="checkbox"
                :checked="node.selected"
                :indeterminate="isCheckIndeterminate(node)"
                :disabled="isNodeDisabled(node)"
                :class="{
                  indeterminate: isCheckIndeterminate(node),
                }"
              />

              <span
                v-if="node.type === 'file' && props.fileIcon"
                class="file-icon"
                :class="{ 'cursor-not-allowed': isNodeDisabled(node) }"
              ></span>
              <span
                v-if="node.type === 'dir' && props.dirIcon"
                class="dir-icon"
                :class="{ 'cursor-not-allowed': isNodeDisabled(node) }"
              ></span>

              <input
                v-model="node.text"
                class="node-input"
                :class="{
                  selected: node.selected,
                  active: node.type === 'file' && node.active,
                  'cursor-not-allowed': isNodeDisabled(node),
                }"
                :readonly="renamingNode !== node"
                @keydown.enter="applyRenaming"
                @keydown.esc="undoRenaming"
                @blur="applyRenaming"
                @click.right.stop="(e: MouseEvent) => showContextMenu(node.type, node, e)"
              />
              <span v-if="node.type === 'dir' && props.filesHint" class="files-hint">
                ({{ fileHintText(node) }})
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .indent-span {
    width: 20px;
    height: 28px;
    position: relative;
  }

  .indent-span::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 0.5px;
    transform: translateX(-50%);
  }

  .input-checkbox {
    margin-left: 5px;
  }

  .node-input {
    height: 28px;
    padding-left: 2px;
    padding-right: 5px;
    cursor: pointer;
    background-color: transparent;
    field-sizing: content; /** CSS experimental. On recent electron versions it should work fine. */
  }

  .node-caret {
    transition: transform 0.2s ease;
    display: inline-block;
    transform: rotate(0deg);
    width: 20px;
    height: 20px;
  }
  .node-caret.closed {
    transform: rotate(-90deg);
  }

  .node-caret,
  .dir-icon,
  .file-icon {
    cursor: pointer;
    background-position: center;
    background-size: contain;
    background-repeat: no-repeat;
  }

  .nodes-container {
    padding-left: 5px;
    padding-top: 5px;
    will-change: transform;
  }

  .files-selected-badge {
    position: absolute;
    bottom: 25px;
    right: 25px;
    display: inline;
    border-radius: 5px;
    padding: 1px 5px;
    white-space: nowrap;
    padding: 3px 5px;
  }

  .files-hint {
    font-size: 0.92rem;
    font-weight: 500;
    padding-left: 3px;
  }

  .cursor-not-allowed {
    cursor: not-allowed;
  }

  /* --- Transitions --- */

  /* Fade: */
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.25s ease;
  }
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
  .fade-enter-to,
  .fade-leave-from {
    opacity: 1;
  }
</style>
