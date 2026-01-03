<script lang="ts" setup>
  import ContextMenu from './ContextMenu.vue';
  import { TreeOperationResponseDTO } from '@common/dto/treeOperationResponseDTO';
  import { NodeType, Node, DirNode } from '@common/types/tree';
  import { ModifierKeys } from '@common/types/keys';
  import { TreeChannels } from '@preload/channels/tree';
  import {
    ref,
    onMounted,
    reactive,
    nextTick,
    onBeforeUnmount,
    useTemplateRef,
    computed,
    onActivated,
    watch,
  } from 'vue';
  import { GenericResponseDTO } from '@common/dto/genericResponseDTO';
  import { useUIStore } from '@renderer/store/ui';
  import { toLocaleNumber } from '@common/utils/utils';
  import { hasBit } from '@common/utils/bitMask';
  import { useNotesStore } from '@renderer/store/notes';
  import verticalIndent from '@renderer/assets/images/vertical.png';
  import middleIndent from '@renderer/assets/images/middle.png';
  import endIndent from '@renderer/assets/images/end.png';
  import DeleteModal from './DeleteModal.vue';

  // --- Types: ---

  type ContextState = {
    type: NodeType | 'root';
    visible: boolean;
    activeNode: Node | null;
    activeDomNode: HTMLInputElement | null;
    x: number;
    y: number;
  };

  export type ModalState = {
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
      selectionOnly?: boolean;
    }>(),
    {
      checkbox: false,
      filesHint: false,
      search: false,
      dirIcon: false,
      fileIcon: false,
      selectionOnly: false,
    }
  );

  const emit = defineEmits<{
    (e: 'rename', noteId: string, newName: string): void;
    (e: 'deleteSingle', noteId: string): void;
    (e: 'deleteMultiple'): void;
  }>();

  // --- Variables: ---

  const rowHeight = 28;
  const paddingBottom = 250;
  const indentSpanWidth = 20;

  const uiStore = useUIStore();
  const notesStore = useNotesStore();

  const keys: ModifierKeys = {
    ctrl: false,
  };

  const initialScrollTop = uiStore.settings.explorerScrollTop;
  const lastScrollTop = ref(initialScrollTop);

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
  const firstActivation = ref(true);

  const isSearching = ref(false);
  const showFilesSelectedBadge = ref(false);
  const nodeContainerOffset = ref(0);

  const scrollContainer = useTemplateRef('scroll-container');
  const treeView = useTemplateRef('tree-view');

  const ghostStyle = computed(() => ({
    height: `${rowHeight * (tree.value?.nSurfaceNodes || 0) + paddingBottom}px`,
  }));

  const selectedFilesText = computed(() => {
    if (!tree.value) return '0 notes';
    const val = toLocaleNumber(tree.value.nSelectedFiles);
    return val === '1' ? '1 note' : `${val} notes`;
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

  const nSelectedFiles = computed(() => tree.value?.nSelectedFiles || 0);

  // --- Watches: ---

  watch(nSelectedFiles, notesStore.fetchNoteStatistics);

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
    const prefix = type === 'dir' ? 'Folder' : 'Note';
    const newTree = await window.api.invoke<TreeOperationResponseDTO>(
      TreeChannels.createNode,
      lastScrollTop.value,
      type,
      prefix,
      parentId
    );
    updateTree(newTree);
  }

  async function createNodeAbove(type: NodeType) {
    const node = contextState.activeNode;
    if (!node) return;
    const prefix = type === 'dir' ? 'Folder' : 'Note';
    const newTree = await window.api.invoke<TreeOperationResponseDTO>(
      TreeChannels.createNodeAbove,
      lastScrollTop.value,
      type,
      prefix,
      node.id
    );
    updateTree(newTree);
  }

  async function createNodeBelow(type: NodeType) {
    const node = contextState.activeNode;
    if (!node) return;
    const prefix = type === 'dir' ? 'Folder' : 'Note';
    const newTree = await window.api.invoke<TreeOperationResponseDTO>(
      TreeChannels.createNodeBelow,
      lastScrollTop.value,
      type,
      prefix,
      node.id
    );
    updateTree(newTree);
  }

  // --- Toggle dir open: ---

  async function toggleDirOpen(node: Node) {
    const newTree = await window.api.invoke<TreeOperationResponseDTO>(
      TreeChannels.toggleDirOpen,
      lastScrollTop.value,
      node.id
    );
    updateTree(newTree);
  }

  async function collapseAll() {
    const newTree = await window.api.invoke<TreeOperationResponseDTO>(
      TreeChannels.collapseAll,
      lastScrollTop.value
    );
    updateTree(newTree);
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
        if (node.type === 'file') {
          emit('rename', node.noteId, newName);
        }
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
    if (props.checkbox) localKeys.ctrl = true;
    const newTree = await window.api.invoke<TreeOperationResponseDTO>(
      TreeChannels.handleSelection,
      lastScrollTop.value,
      node.id,
      localKeys
    );
    updateTree(newTree);
  }

  async function clearSelection() {
    const newTree = await window.api.invoke<TreeOperationResponseDTO>(
      TreeChannels.clearSelection,
      lastScrollTop.value
    );
    updateTree(newTree);
  }

  async function selectAll() {
    const newTree = await window.api.invoke<TreeOperationResponseDTO>(
      TreeChannels.selectAll,
      lastScrollTop.value
    );
    updateTree(newTree);
  }

  // --- Deletion: ---

  async function deleteNode() {
    const node = modalState.currentNode;
    if (!node) return;
    const newTree = await window.api.invoke<TreeOperationResponseDTO>(
      TreeChannels.deleteNode,
      lastScrollTop.value,
      node.id
    );
    updateTree(newTree);
    if (node.type === 'file') {
      emit('deleteSingle', node.noteId);
    }
  }

  async function deleteSelectedNodes() {
    const newTree = await window.api.invoke<TreeOperationResponseDTO>(
      TreeChannels.deleteSelectedNodes,
      lastScrollTop.value
    );
    updateTree(newTree);
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
    if (modalState.isDeleting) return;
    modalState.currentNode = null;
    modalState.visible = false;
    modalState.multiple = false;
  }

  // --- Search: ---

  async function search() {
    const text = searchText.value.trim();
    const newTree = await window.api.invoke<TreeOperationResponseDTO>(
      TreeChannels.search,
      lastScrollTop.value,
      text
    );
    nextTick(() => {
      isSearching.value = Boolean(text);
    });
    updateTree(newTree);
  }

  // --- Node click: ---

  function nodeClick(node: Node) {
    if (props.selectionOnly) return;
    if (node.type === 'file') {
      notesStore.explorerNoteClicked(node.noteId);
    }
  }

  function openNote() {
    if (props.selectionOnly) return;
    const node = contextState.activeNode;
    if (!node) return;
    if (node.type === 'file') {
      notesStore.explorerNoteClicked(node.noteId);
      notesStore.explorerNoteClicked(node.noteId);
    }
  }

  // --- Movement: ---

  async function moveSelection(channel: TreeChannels) {
    if (!tree.value) return;
    const newTree = await window.api.invoke<TreeOperationResponseDTO>(
      channel,
      lastScrollTop.value,
      contextState.activeNode?.id || null
    );
    updateTree(newTree);
  }

  async function moveSelectionToRoot() {
    if (!tree.value) return;
    const newTree = await window.api.invoke<TreeOperationResponseDTO>(
      TreeChannels.moveSelectedNodesInto,
      lastScrollTop.value,
      null
    );
    updateTree(newTree);
  }

  // --- Helpers: ---

  function isCheckIndeterminate(node: Node) {
    return Boolean(node.type === 'dir' && node.nSelDesc && node.nSelDesc < node.nDesc);
  }

  function isNodeDisabled(node: Node) {
    return node.type === 'dir' && isSearching.value;
  }

  function fileHintText(node: DirNode) {
    return node.nFileDesc === 1 ? '1 note' : `${toLocaleNumber(node.nFileDesc)} notes`;
  }

  function updateTree(newTree: TreeOperationResponseDTO) {
    tree.value = newTree;
  }

  function getNodeIndentStyle(node: Node) {
    const backgrounds: string[] = [];
    const positions: string[] = [];
    const repeats: string[] = [];
    for (let i = 0; i < node.depth; i++) {
      const x = i * indentSpanWidth;
      let img = '';
      if (i === node.depth - 1) {
        img = node.ui.isLastChild ? `url(${endIndent})` : `url(${middleIndent})`;
      } else if (hasBit(node.ui.depths, i)) {
        img = `url(${verticalIndent})`;
      } else {
        continue;
      }
      backgrounds.push(img);
      positions.push(`${x}px 0`);
      repeats.push('no-repeat');
    }
    return {
      width: `${node.depth * indentSpanWidth}px`,
      height: `${rowHeight}px`,
      backgroundImage: backgrounds.join(', '),
      backgroundPosition: positions.join(', '),
      backgroundRepeat: repeats.join(', '),
    };
  }

  // --- Events: ---

  function handleScroll() {
    if (!scrollContainer.value) return;
    contextState.visible = false;
    const scrollTop = scrollContainer.value.scrollTop;
    if (scrollTop === lastScrollTop.value) return; // Do not react on x scroll;
    lastScrollTop.value = scrollTop;
    uiStore.updateSettings({ explorerScrollTop: scrollTop });
    clearTimeout(scrollTimer.value);
    scrollTimer.value = setTimeout(async () => {
      const container = scrollContainer.value;
      if (!container) return;
      const newTree = await window.api.invoke<TreeOperationResponseDTO>(
        TreeChannels.getState,
        lastScrollTop.value
      );
      updateTree(newTree);
      nodeContainerOffset.value = (tree.value?.page[0].ui.position || 0) * rowHeight; // This is the key! Using a computed-value causes flickering.
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

  onActivated(async () => {
    if (firstActivation.value) {
      firstActivation.value = false;
      return;
    }
    const newTree = await window.api.invoke<TreeOperationResponseDTO>(
      TreeChannels.getState,
      lastScrollTop.value
    );
    updateTree(newTree);
    scrollContainer.value!.scrollTop = lastScrollTop.value;
  });
  onMounted(async () => {
    tree.value = await window.api.invoke<TreeOperationResponseDTO>(
      TreeChannels.getState,
      initialScrollTop
    );
    hasLoaded.value = true;
    await nextTick();
    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = initialScrollTop;
    }
    nodeContainerOffset.value = (tree.value?.page[0]?.ui.position || 0) * rowHeight;
    window.addEventListener('click', windowClick);
    window.addEventListener('keydown', windowKeyDown);
    window.addEventListener('keyup', windowKeyUp);
  });
  onBeforeUnmount(async () => {
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
    <DeleteModal
      :modal-state="modalState"
      :close-modal="closeModal"
      :tree="tree"
      :n-selected-folders="nSelectedFolders"
      :handle-deletion="handleDeletion"
    />

    <ContextMenu
      class="z-[3]"
      :tree="tree"
      :n-selected-folders="nSelectedFolders"
      :n-open-dirs="tree?.nOpenDirs || 0"
      :is-searching="isSearching"
      :selection-only="props.selectionOnly"
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
      @open-note="openNote"
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
      v-if="!isSearching && !tree?.page.length"
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
          class="w-full !rounded-none !border-none"
          type="text"
          placeholder="Search for notes..."
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
          <div v-for="node in tree.page" :key="node.id" class="flex items-center whitespace-nowrap">
            <span :style="getNodeIndentStyle(node)"></span>

            <span
              v-if="node.type === 'dir'"
              class="node-caret"
              :class="{ closed: !node.open }"
              @click="toggleDirOpen(node)"
            ></span>

            <div class="flex items-center">
              <div
                class="flex items-center"
                @click="
                  handleSelection(node);
                  nodeClick(node);
                "
              >
                <input
                  v-if="props.checkbox"
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
                  v-model.trim="node.text"
                  class="node-input"
                  :class="{
                    selected: node.selected,
                    'cursor-not-allowed': isNodeDisabled(node),
                  }"
                  :readonly="renamingNode !== node"
                  @mousedown.prevent
                  @keydown.enter="applyRenaming"
                  @keydown.esc="undoRenaming"
                  @blur="applyRenaming"
                  @click.right.stop="(e: MouseEvent) => showContextMenu(node.type, node, e)"
                />
              </div>
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
  .node-input {
    height: 28px;
    cursor: pointer;
    background-color: transparent;
    field-sizing: content; /** CSS experimental. On recent electron versions it should work fine. */
  }

  .node-caret {
    transition: transform 0.2s ease;
    display: inline-block;
    transform: rotate(0deg);
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
</style>
