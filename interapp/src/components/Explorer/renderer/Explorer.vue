<script lang="ts" setup>
  import ContextMenu from './ContextMenu.vue';
  import { TreeSnapshot } from '../common/treeSnapshot';
  import { NodeType, Node, DirNode } from '../common/tree';
  import { ModifierKeys } from '@interapp/types/modifierKeys';
  import { TreeChannels } from '../preload/channels';
  import {
    ref,
    onMounted,
    reactive,
    nextTick,
    onBeforeUnmount,
    useTemplateRef,
    computed,
    onActivated,
  } from 'vue';
  import { useToastStore } from '@interapp/store/toast';
  import { GenericResponseDTO } from '@interapp/dto/genericResponseDTO';
  import { toLocaleNumber } from '@interapp/utils/utils';
  import { hasBit } from '@interapp/utils/bitMask';
  import verticalIndent from './assets/vertical.png';
  import middleIndent from './assets/middle.png';
  import endIndent from './assets/end.png';

  // --- Types: ---

  type ContextState = {
    type: NodeType | 'root';
    visible: boolean;
    activeNode: Node | null;
    activeDomNode: HTMLInputElement | null;
    x: number;
    y: number;
  };

  export type CreateNodeCallback = (nodeId: string, name: string) => Promise<void>;
  export type DeleteNodeCallback = () => Promise<void>;

  // --- Props and emits: ---

  const props = withDefaults(
    defineProps<{
      checkbox?: boolean;
      filesHint?: boolean;
      dirIcon?: boolean;
      fileIcon?: boolean;
      selectionOnly?: boolean;
    }>(),
    {
      checkbox: false,
      filesHint: false,
      dirIcon: false,
      fileIcon: false,
      selectionOnly: false,
    }
  );

  const emit = defineEmits<{
    (e: 'rename-file', nodeId: string, newName: string): void;
    (e: 'before-create-node', type: NodeType, callback: CreateNodeCallback): void;
    (e: 'before-delete-node', node: Node, callback: DeleteNodeCallback): void;
    (
      e: 'before-delete-selected',
      files: number,
      folders: number,
      callback: DeleteNodeCallback
    ): void;
    (e: 'node-click', node: Node, keys: ModifierKeys): void;
  }>();

  // --- Variables: ---

  const rowHeight = 28;
  const paddingBottom = 250;
  const indentSpanWidth = 20;

  const toastStore = useToastStore();

  const keys: ModifierKeys = {
    ctrl: false,
  };

  const lastScrollTop = ref(0);

  const hasLoaded = ref(false);
  const tree = ref<TreeSnapshot | null>(null);
  const contextState = reactive<ContextState>({
    type: 'root',
    visible: false,
    activeNode: null,
    activeDomNode: null,
    x: 0,
    y: 0,
  });

  const renamingNode = ref<Node | null>(null);
  const originalName = ref('');
  const scrollTimer = ref<ReturnType<typeof setTimeout> | undefined>(undefined);
  const firstActivation = ref(true);

  const showFilesSelectedBadge = ref(false);
  const nodeContainerOffset = ref(0);

  const scrollContainer = useTemplateRef('scroll-container');
  const explorer = useTemplateRef('explorer');

  const ghostStyle = computed(() => ({
    height: `${rowHeight * (tree.value?.nSurfaceNodes || 0) + paddingBottom}px`,
  }));

  const selectedFilesText = computed(() => {
    if (!tree.value) return '0 files';
    const val = toLocaleNumber(tree.value.nSelectedFiles);
    return val === '1' ? '1 file' : `${val} files`;
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

  // --- Node pre-creation events: ---

  function beforeCreateNode(type: NodeType) {
    const node = contextState.activeNode;
    const parentId = node ? node.id : null;
    const callback: CreateNodeCallback = (nodeId: string, name: string) => {
      return createNode(nodeId, parentId, type, name);
    };
    emit('before-create-node', type, callback);
  }

  function beforeCreateNodeAbove(type: NodeType) {
    const node = contextState.activeNode;
    if (!node) return;
    const callback: CreateNodeCallback = (nodeId: string, name: string) => {
      return createNodeAbove(nodeId, node.id, type, name);
    };
    emit('before-create-node', type, callback);
  }

  function beforeCreateNodeBelow(type: NodeType) {
    const node = contextState.activeNode;
    if (!node) return;
    const callback: CreateNodeCallback = (nodeId: string, name: string) => {
      return createNodeBelow(nodeId, node.id, type, name);
    };
    emit('before-create-node', type, callback);
  }

  // --- Node creation callbacks: ---

  async function createNode(nodeId: string, parentId: string | null, type: NodeType, name: string) {
    const newTree = await window.explorer.invoke<TreeSnapshot>(
      TreeChannels.createNode,
      lastScrollTop.value,
      type,
      nodeId,
      parentId,
      name
    );
    updateTree(newTree);
  }

  async function createNodeAbove(nodeId: string, baseNodeId: string, type: NodeType, name: string) {
    const newTree = await window.explorer.invoke<TreeSnapshot>(
      TreeChannels.createNodeAbove,
      lastScrollTop.value,
      type,
      nodeId,
      baseNodeId,
      name
    );
    updateTree(newTree);
  }

  async function createNodeBelow(nodeId: string, baseNodeId: string, type: NodeType, name: string) {
    const newTree = await window.explorer.invoke<TreeSnapshot>(
      TreeChannels.createNodeBelow,
      lastScrollTop.value,
      type,
      nodeId,
      baseNodeId,
      name
    );
    updateTree(newTree);
  }

  // --- Toggle dir open: ---

  async function toggleDirOpen(node: Node) {
    const newTree = await window.explorer.invoke<TreeSnapshot>(
      TreeChannels.toggleDirOpen,
      lastScrollTop.value,
      node.id
    );
    updateTree(newTree);
  }

  async function collapseAll() {
    const newTree = await window.explorer.invoke<TreeSnapshot>(
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
      toastStore.showToast('Name cannot be empty!', 'error');
      node.text = originalName.value;
    } else if (newName !== originalName.value) {
      const result = await window.explorer.invoke<GenericResponseDTO>(
        TreeChannels.renameNode,
        node.id,
        newName
      );
      if (result.status === 'error') {
        toastStore.showToast(result.errorMsg, 'error');
        node.text = originalName.value;
      } else {
        if (node.type === 'file') {
          emit('rename-file', node.id, newName);
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
    const localKeys = { ...keys };
    if (props.checkbox) localKeys.ctrl = true;
    const newTree = await window.explorer.invoke<TreeSnapshot>(
      TreeChannels.handleSelection,
      lastScrollTop.value,
      node.id,
      localKeys
    );
    updateTree(newTree);
  }

  async function clearSelection() {
    const newTree = await window.explorer.invoke<TreeSnapshot>(
      TreeChannels.clearSelection,
      lastScrollTop.value
    );
    updateTree(newTree);
  }

  async function selectAll() {
    const newTree = await window.explorer.invoke<TreeSnapshot>(
      TreeChannels.selectAll,
      lastScrollTop.value
    );
    updateTree(newTree);
  }

  // --- Pre-deletion event handlers: ---

  function beforeDeleteNode() {
    const node = contextState.activeNode;
    if (!node) throw new Error('Cannot delete null node!');
    const callback = () => deleteNode(node.id);
    emit('before-delete-node', node, callback);
  }

  function beforeDeleteSelected() {
    const callback = () => deleteSelectedNodes();
    const files = tree.value?.nSelectedFiles || 0;
    const folders = (tree.value?.nSelectedNodes || 0) - files;
    emit('before-delete-selected', files, folders, callback);
  }

  // --- Deletion callbacks: ---

  async function deleteNode(nodeId: string) {
    const newTree = await window.explorer.invoke<TreeSnapshot>(
      TreeChannels.deleteNode,
      lastScrollTop.value,
      nodeId
    );
    updateTree(newTree);
  }

  async function deleteSelectedNodes() {
    const newTree = await window.explorer.invoke<TreeSnapshot>(
      TreeChannels.deleteSelectedNodes,
      lastScrollTop.value
    );
    updateTree(newTree);
  }

  // --- Node click: ---

  function nodeClick(node: Node) {
    emit('node-click', node, keys);
  }

  // --- Movement: ---

  async function moveSelection(channel: TreeChannels) {
    if (!tree.value) return;
    const newTree = await window.explorer.invoke<TreeSnapshot>(
      channel,
      lastScrollTop.value,
      contextState.activeNode?.id || null
    );
    updateTree(newTree);
  }

  async function moveSelectionToRoot() {
    if (!tree.value) return;
    const newTree = await window.explorer.invoke<TreeSnapshot>(
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

  function fileHintText(node: DirNode) {
    return node.nFileDesc === 1 ? '1 file' : `${toLocaleNumber(node.nFileDesc)} files`;
  }

  function updateTree(newTree: TreeSnapshot) {
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
    clearTimeout(scrollTimer.value);
    scrollTimer.value = setTimeout(async () => {
      const container = scrollContainer.value;
      if (!container) return;
      const newTree = await window.explorer.invoke<TreeSnapshot>(
        TreeChannels.getPage,
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
    const root = explorer.value;
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
    const newTree = await window.explorer.invoke<TreeSnapshot>(
      TreeChannels.getPage,
      lastScrollTop.value
    );
    updateTree(newTree);
    scrollContainer.value!.scrollTop = lastScrollTop.value;
  });
  onMounted(async () => {
    const firstTree = await window.explorer.invoke<TreeSnapshot>(TreeChannels.getPage, 0);
    updateTree(firstTree);
    hasLoaded.value = true;
    await nextTick();
    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = 0;
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
    ref="explorer"
    class="explorer relative h-full"
    @click.right="(e) => showContextMenu('root', null, e)"
    @click="() => (contextState.visible = false)"
    @mouseenter="containerMouseEnter"
    @mouseleave="containerMouseLeave"
  >
    <ContextMenu
      class="z-[3]"
      :tree="tree"
      :n-selected-folders="nSelectedFolders"
      :n-open-dirs="tree?.nOpenDirs || 0"
      :selection-only="props.selectionOnly"
      v-bind="contextState"
      @create-node="beforeCreateNode"
      @create-node-above="beforeCreateNodeAbove"
      @create-node-below="beforeCreateNodeBelow"
      @rename-node="startRenaming"
      @delete-node="beforeDeleteNode"
      @delete-selected-nodes="beforeDeleteSelected"
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
      v-if="!tree?.page.length"
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
                  :class="{
                    indeterminate: isCheckIndeterminate(node),
                  }"
                />

                <span v-if="node.type === 'file' && props.fileIcon" class="file-icon"></span>
                <span v-if="node.type === 'dir' && props.dirIcon" class="dir-icon"></span>

                <input
                  v-model.trim="node.text"
                  class="node-input"
                  :class="{ selected: node.selected }"
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
  .explorer {
    user-select: none;
  }

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
