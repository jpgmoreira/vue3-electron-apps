<script lang="ts" setup>
  import { TreeOperationResponseDTO } from '@common/dto/treeOperationResponseDTO';
  import { NodeType, Node } from '@common/types/tree';
  import { ref, watch, computed } from 'vue';

  export type ContextProps = {
    tree: TreeOperationResponseDTO | null;
    visible: boolean;
    type: NodeType | 'root';
    nSelectedFolders: number;
    nOpenDirs: number;
    isSearching: boolean;
    activeNode: Node | null;
    x: number;
    y: number;
  };

  const emit = defineEmits<{
    (e: 'createNode', type: NodeType): void;
    (e: 'createNodeAbove', type: NodeType): void;
    (e: 'createNodeBelow', type: NodeType): void;
    (e: 'renameNode'): void;
    (e: 'deleteNode'): void;
    (e: 'deleteSelectedNodes'): void;
    (e: 'clearSelection'): void;
    (e: 'selectAll'): void;
    (e: 'collapseAll'): void;
    (e: 'moveSelectedFilesAbove'): void;
    (e: 'moveSelectedFilesBelow'): void;
    (e: 'moveSelectedFoldersAbove'): void;
    (e: 'moveSelectedFoldersBelow'): void;
    (e: 'moveSelectedNodesInto'): void;
    (e: 'moveSelectedNodesToRoot'): void;
  }>();

  const props = defineProps<ContextProps>();
  const style = ref<Record<string, string>>({});

  const nSelectedNodes = computed(() => props.tree?.nSelectedNodes || 0);
  const nSelectedFiles = computed(() => props.tree?.nSelectedFiles || 0);

  const showSelectAll = computed(() =>
    Boolean(!props.isSearching && props.tree && props.tree.nTotalNodes > props.tree.nSelectedNodes)
  );
  const showRootSelection = computed(() =>
    Boolean(nSelectedNodes.value || props.nOpenDirs || showSelectAll.value)
  );

  // Root sections
  const rootSections = computed(() => ({
    create: !props.isSearching,
    select: showRootSelection.value,
    move: nSelectedNodes.value > 0,
    delete: nSelectedNodes.value > 0,
  }));

  // Dir sections
  const dirSections = computed(() => ({
    create: !props.isSearching,
    move: Boolean(!props.activeNode?.selected && nSelectedNodes.value),
    change: true,
  }));

  // File sections
  const fileSections = computed(() => ({
    create: !props.isSearching,
    move: Boolean(!props.activeNode?.selected && nSelectedFiles.value),
    change: true,
  }));

  const anySectionVisible = computed(
    () =>
      (props.type === 'root' && Object.values(rootSections.value).some(Boolean)) ||
      (props.type === 'dir' && Object.values(dirSections.value).some(Boolean)) ||
      (props.type === 'file' && Object.values(fileSections.value).some(Boolean))
  );

  function computeContextStyle() {
    style.value = {};
    const diffY = window.innerHeight - props.y;
    if (diffY > 250) style.value.top = `${props.y}px`;
    else style.value.bottom = `${diffY}px`;
    style.value.left = `${props.x}px`;
  }

  watch(props, () => {
    if (props.visible) computeContextStyle();
  });
</script>

<template>
  <div v-if="props.visible && anySectionVisible" class="fixed context-menu" :style="style">
    <!-- Root context -->
    <div v-if="props.type === 'root'">
      <div v-if="rootSections.create">
        <div class="item" @click="emit('createNode', 'file')">New contest</div>
        <div class="item" @click="emit('createNode', 'dir')">New folder</div>
      </div>
      <div v-if="rootSections.create && rootSections.select" class="separator"></div>

      <div v-if="rootSections.select">
        <div v-if="showSelectAll" class="item" @click="emit('selectAll')">Select all</div>
        <div v-if="nSelectedNodes" class="item" @click="emit('clearSelection')">
          Clear selection
        </div>
        <div v-if="props.nOpenDirs" class="item" @click="emit('collapseAll')">Collapse all</div>
      </div>
      <div
        v-if="(rootSections.create || rootSections.select) && rootSections.move"
        class="separator"
      ></div>

      <div v-if="rootSections.move">
        <div class="item" @click="emit('moveSelectedNodesToRoot')">
          Move selected nodes to the root
        </div>
      </div>
      <div
        v-if="
          (rootSections.create || rootSections.select || rootSections.move) && rootSections.delete
        "
        class="separator"
      ></div>

      <div v-if="rootSections.delete">
        <div class="item danger" @click="emit('deleteSelectedNodes')">Delete selected</div>
      </div>
    </div>

    <!-- Dir context -->
    <div v-else-if="props.type === 'dir'">
      <div v-if="dirSections.create">
        <div class="item" @click="emit('createNode', 'file')">New contest</div>
        <div class="item" @click="emit('createNode', 'dir')">New folder</div>
        <div class="item" @click="emit('createNodeAbove', 'dir')">Create folder above</div>
        <div class="item" @click="emit('createNodeBelow', 'dir')">Create folder below</div>
      </div>
      <div v-if="dirSections.create && dirSections.move" class="separator"></div>

      <div v-if="dirSections.move">
        <div class="item" @click="emit('moveSelectedNodesInto')">
          Move selected nodes into the folder
        </div>
        <div v-if="props.nSelectedFolders" class="item" @click="emit('moveSelectedFoldersAbove')">
          Move selected folders above
        </div>
        <div v-if="props.nSelectedFolders" class="item" @click="emit('moveSelectedFoldersBelow')">
          Move selected folders below
        </div>
      </div>
      <div
        v-if="(dirSections.create || dirSections.move) && dirSections.change"
        class="separator"
      ></div>

      <div v-if="dirSections.change">
        <div class="item" @click="emit('renameNode')">Rename</div>
        <div v-if="!isSearching" class="item danger" @click="emit('deleteNode')">Delete</div>
      </div>
    </div>

    <!-- File context -->
    <div v-else-if="props.type === 'file'">
      <div v-if="fileSections.create">
        <div class="item" @click="emit('createNodeAbove', 'file')">Create file above</div>
        <div class="item" @click="emit('createNodeBelow', 'file')">Create file below</div>
      </div>
      <div v-if="fileSections.create && fileSections.move" class="separator"></div>

      <div v-if="fileSections.move">
        <div class="item" @click="emit('moveSelectedFilesAbove')">Move selected files above</div>
        <div class="item" @click="emit('moveSelectedFilesBelow')">Move selected files below</div>
      </div>
      <div
        v-if="(fileSections.create || fileSections.move) && fileSections.change"
        class="separator"
      ></div>

      <div v-if="fileSections.change">
        <div class="item" @click="emit('renameNode')">Rename</div>
        <div class="item danger" @click="emit('deleteNode')">Delete</div>
      </div>
    </div>
  </div>
</template>
