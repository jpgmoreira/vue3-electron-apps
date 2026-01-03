import { randomId } from '@common/utils/utils';
import { DATA_DIR, TREE_PAGE_SIZE } from '../constants';
import { FileProxy } from '../fileProxy';
import { Links, Node, FileNode, DirNode, NodeType, HeadAndTail } from '@common/types/tree';
import { ModifierKeys } from '@common/types/keys';
import { TreeOperationResponseDTO } from '@common/dto/treeOperationResponseDTO';
import { GenericResponseDTO } from '@common/dto/genericResponseDTO';
import { ContestsManager } from './contestsManager';
import path from 'path';
import { ProfileManager } from './profileManager';

// Contains a linked list of the base nodes of the tree.
type Root = Links & {
  nextDir: number; // Number of the next directory to be created.
  nextFile: number; // Number of the next file to be created.
};

type TreeData = {
  root: Root;
  idToNode: Record<string, Node>; // Maps node ids to the node objects.
};

/**
 * Singleton for managing the treeview component operations.
 * Access via TreeManager.instance
 */
export class TreeManager {
  // -- Class configuration: ---

  static #instance: TreeManager;
  private _proxy: FileProxy<TreeData> | null = null;

  private constructor() {}

  public static get instance(): TreeManager {
    if (!this.#instance) {
      this.#instance = new TreeManager();
    }
    return this.#instance;
  }

  private get proxy() {
    return this._proxy!.proxy;
  }
  private get target() {
    return this._proxy!.target;
  }

  // --- Variables and structures: ---

  private nSelectedNodes = 0;
  private nSelectedFiles = 0;
  private nOpenDirs = 0;
  private expandedFlat: Node[] = []; // Entire tree flattened into an array.

  // --- Setup methods: ---

  private getEmptyTreeData(): TreeData {
    return {
      root: {
        nextDir: 1,
        nextFile: 1,
        dirs: { headId: null, tailId: null },
        files: { headId: null, tailId: null },
      },
      idToNode: {},
    };
  }

  public loadTree(profileId: string) {
    const filePath = path.join(DATA_DIR, 'profileData', profileId, 'tree.json');
    this._proxy = new FileProxy(filePath, this.getEmptyTreeData());
    this.refresh(false);
    this.clearHidden();
  }

  // --- Result and flattening: ---

  private flatten(node: Node | null, depth: number, array: Node[]) {
    let curr = node;
    let nSub = 0,
      nSubSel = 0,
      nSubFiles = 0;
    while (curr) {
      array.push(curr);
      if (curr.type === 'dir') {
        const dirHead = this.getHead(curr.dirs, false);
        const fileHead = this.getHead(curr.files, false);
        const dirResult = this.flatten(dirHead, depth + 1, array);
        const fileResult = this.flatten(fileHead, depth + 1, array);
        curr.nDesc = dirResult.nSub + fileResult.nSub;
        curr.nSelDesc = dirResult.nSubSel + fileResult.nSubSel;
        curr.nFileDesc = dirResult.nSubFiles + fileResult.nSubFiles;
        nSub += curr.nDesc;
        nSubSel += curr.nSelDesc;
        nSubFiles += curr.nFileDesc;
        if (curr.nDesc) {
          curr.selected = !!curr.nDesc && curr.nDesc === curr.nSelDesc;
        }
        this.nOpenDirs += curr.open ? 1 : 0;
      }
      curr.depth = depth;
      const sel = curr.selected ? 1 : 0;
      nSub++;
      nSubSel += sel;
      nSubFiles += curr.type === 'file' ? 1 : 0;
      this.nSelectedNodes += sel;
      this.nSelectedFiles += curr.type === 'file' ? sel : 0;
      curr = this.getNext(curr, false);
    }
    return { nSub, nSubSel, nSubFiles };
  }

  public buildResult(anchor: number): TreeOperationResponseDTO {
    const visibleNodes: Node[] = [];
    let nSurfaceNodes = 0;
    for (let i = 0; i < this.expandedFlat.length; i++) {
      const node = this.expandedFlat[i];
      if (!node.hidden) {
        if (nSurfaceNodes >= anchor && visibleNodes.length < TREE_PAGE_SIZE) {
          visibleNodes.push(node);
        }
        nSurfaceNodes++;
      }
      if (node.type === 'dir' && (node.hidden || !node.open)) {
        i += node.nDesc;
      }
    }
    if (nSurfaceNodes && !visibleNodes.length) {
      // If current anchor is larger than nSurfaceNodes.
      return this.buildResult(Math.max(0, nSurfaceNodes - TREE_PAGE_SIZE));
    }
    return {
      nSelectedNodes: this.nSelectedNodes,
      nSelectedFiles: this.nSelectedFiles,
      nTotalNodes: this.expandedFlat.length,
      nOpenDirs: this.nOpenDirs,
      anchor,
      nSurfaceNodes,
      visibleNodes,
    };
  }

  /**
   * Refreshes:
   *  - this.expandedFlat;
   *  - this.nSelectedNodes;
   *  - this.nSelectedFiles;
   *  - this.nOpenDirs;
   * For every node, updates:
   *  - depth;
   *  - nDesc;
   *  - nSelDesc;
   *  - nFileDesc;
   */
  private refresh(flush: boolean) {
    const dirHead = this.getHead(this.target.root.dirs, false);
    const fileHead = this.getHead(this.target.root.files, false);
    this.expandedFlat.length = 0;
    this.nSelectedNodes = 0;
    this.nSelectedFiles = 0;
    this.nOpenDirs = 0;
    this.flatten(dirHead, 0, this.expandedFlat);
    this.flatten(fileHead, 0, this.expandedFlat);
    if (flush) {
      this._proxy!.queueWrite();
    }
  }

  // --- Helpers: ---

  private getHead(headAndTail: HeadAndTail, asProxy: boolean) {
    const source = asProxy ? this.proxy : this.target;
    const id = headAndTail.headId;
    return id ? source.idToNode[id] : null;
  }

  private getTail(headAndTail: HeadAndTail, asProxy: boolean) {
    const source = asProxy ? this.proxy : this.target;
    const id = headAndTail.tailId;
    return id ? source.idToNode[id] : null;
  }

  private getNext(node: Node, asProxy: boolean) {
    const source = asProxy ? this.proxy : this.target;
    const id = node.nextId;
    return id ? source.idToNode[id] : null;
  }

  private getPrev(node: Node, asProxy: boolean) {
    const source = asProxy ? this.proxy : this.target;
    const id = node.prevId;
    return id ? source.idToNode[id] : null;
  }

  private getParent(node: Node, asProxy: boolean) {
    const source = asProxy ? this.proxy : this.target;
    const id = node.parentId;
    return id ? (source.idToNode[id] as DirNode) : null;
  }

  // --- Creation: ---

  private createDirNode(prefix: string, parentId: string | null): DirNode {
    return {
      id: randomId(),
      type: 'dir',
      text: `${prefix} ${this.target.root.nextDir}`,
      depth: 0,
      open: false,
      selected: false,
      hidden: false,
      parentId,
      nextId: null,
      prevId: null,
      dirs: {
        headId: null,
        tailId: null,
      },
      files: {
        headId: null,
        tailId: null,
      },
      nDesc: 0,
      nSelDesc: 0,
      nFileDesc: 0,
    } as const;
  }

  private createFileNode(prefix: string, parentId: string | null): FileNode {
    const text = `${prefix} ${this.target.root.nextFile}`;
    const contestId = ContestsManager.instance.createContest(text);
    return {
      id: randomId(),
      type: 'file',
      text,
      depth: 0,
      selected: false,
      hidden: false,
      parentId,
      nextId: null,
      prevId: null,
      contestId,
      active: false,
    } as const;
  }

  private appendNode(node: Node, control: Links) {
    const sub = node.type === 'dir' ? control.dirs : control.files;
    if (!sub.headId) {
      sub.headId = node.id;
      sub.tailId = node.id;
    } else {
      const tail = this.getTail(sub, false)!;
      const next = this.getNext(tail, false);
      node.nextId = tail.nextId;
      tail.nextId = node.id;
      node.prevId = tail.id;
      if (next) next.prevId = node.id;
      sub.tailId = node.id;
    }
  }

  private appendNodeAbove(node: Node, baseNode: Node) {
    const control = this.getParent(baseNode, false) || this.target.root;
    const sub = node.type === 'dir' ? control.dirs : control.files;
    const prev = this.getPrev(baseNode, false);
    node.nextId = baseNode.id;
    node.prevId = baseNode.prevId;
    baseNode.prevId = node.id;
    if (prev) prev.nextId = node.id;
    else sub.headId = node.id;
  }

  private appendNodeBelow(node: Node, baseNode: Node) {
    const control = this.getParent(baseNode, false) || this.target.root;
    const sub = node.type === 'dir' ? control.dirs : control.files;
    const next = this.getNext(baseNode, false);
    node.prevId = baseNode.id;
    node.nextId = baseNode.nextId;
    baseNode.nextId = node.id;
    if (next) next.prevId = node.id;
    else sub.tailId = node.id;
  }

  private createNodeHelper(type: NodeType, prefix: string, parentId: string | null) {
    let newNode: Node;
    if (type === 'dir') {
      newNode = this.createDirNode(prefix, parentId);
      this.proxy.root.nextDir++;
    } else {
      newNode = this.createFileNode(prefix, parentId);
      this.proxy.root.nextFile++;
    }
    this.proxy.idToNode[newNode.id] = newNode;
    return newNode;
  }

  public createNode(type: NodeType, prefix: string, parentId: string | null) {
    const newNode = this.createNodeHelper(type, prefix, parentId);
    const parent = this.getParent(newNode, false);
    if (parent) {
      newNode.selected = parent.selected;
      this.openDir(parent);
      this.appendNode(newNode, parent);
    } else {
      this.appendNode(newNode, this.target.root);
    }
    this.refresh(true);
  }

  public createNodeAbove(type: NodeType, prefix: string, baseNodeId: string) {
    const baseNode = this.target.idToNode[baseNodeId];
    if (!baseNode) return;
    const parent = this.getParent(baseNode, false);
    const newNode = this.createNodeHelper(type, prefix, parent?.id || null);
    if (parent) newNode.selected = parent.selected;
    this.appendNodeAbove(newNode, baseNode);
    this.refresh(true);
  }

  public createNodeBelow(type: NodeType, prefix: string, baseNodeId: string) {
    const baseNode = this.target.idToNode[baseNodeId];
    if (!baseNode) return;
    const parent = this.getParent(baseNode, false);
    const newNode = this.createNodeHelper(type, prefix, parent?.id || null);
    if (parent) newNode.selected = parent.selected;
    this.appendNodeBelow(newNode, baseNode);
    this.refresh(true);
  }

  // --- Handle directory open/closed state: ---

  private openDir(node: DirNode) {
    if (!node.open) {
      node.open = true;
      this.nOpenDirs++;
    }
  }

  private closeDir(node: DirNode) {
    if (node.open) {
      node.open = false;
      this.nOpenDirs--;
    }
  }

  public toggleDirOpen(nodeId: string) {
    const node = this.proxy.idToNode[nodeId] as DirNode;
    if (!node.open) this.openDir(node);
    else this.closeDir(node);
  }

  public collapseAll() {
    this.nOpenDirs = 0;
    for (const node of this.expandedFlat) {
      if (node.type === 'dir') node.open = false;
    }
    this._proxy!.queueWrite();
  }

  // --- Rename node: ---

  public renameNode(nodeId: string, newName: string): GenericResponseDTO {
    newName = newName.trim();
    if (!newName) {
      return {
        status: 'error',
        errorMsg: 'Name cannot be empty!',
      };
    }
    const node = this.proxy.idToNode[nodeId];
    const control = this.getParent(node, false) || this.target.root;
    const dirHead = this.getHead(control.dirs, false);
    const fileHead = this.getHead(control.files, false);
    for (const head of [dirHead, fileHead]) {
      let curr = head;
      while (curr) {
        if (curr.text === newName) {
          return {
            status: 'error',
            errorMsg: 'Name already exists in this folder.',
          };
        }
        curr = this.getNext(curr, false);
      }
    }
    node.text = newName;
    if (node.type === 'file') {
      ContestsManager.instance.renameContest(node.contestId, newName);
    }
    return { status: 'success' };
  }

  // --- Selection handling: ---

  public clearSelection(clearActive: boolean) {
    for (const node of this.expandedFlat) {
      node.selected = false;
      if (node.type === 'file' && clearActive) node.active = false;
      if (node.type === 'dir') node.nSelDesc = 0;
    }
    this.nSelectedFiles = 0;
    this.nSelectedNodes = 0;
    this._proxy!.queueWrite();
  }

  public selectAll() {
    this.nSelectedFiles = 0;
    for (const node of this.expandedFlat) {
      node.selected = true;
      if (node.type === 'dir') node.nSelDesc = node.nDesc;
      if (node.type === 'file') this.nSelectedFiles++;
    }
    this.nSelectedNodes = this.expandedFlat.length;
    this._proxy!.queueWrite();
  }

  private setSubtreeSelection(control: Links, state: boolean) {
    const dirHead = this.getHead(control.dirs, false);
    const fileHead = this.getHead(control.files, false);
    let curr: Node | null = dirHead;
    while (curr) {
      curr.selected = state;
      this.setSubtreeSelection(curr as DirNode, state);
      curr = this.getNext(curr, false);
    }
    curr = fileHead;
    while (curr) {
      curr.selected = state;
      curr = this.getNext(curr, false);
    }
  }

  public handleSelection(nodeId: string, keys: ModifierKeys) {
    const node = this.target.idToNode[nodeId];
    const nextState = !node.selected;
    const newActive = Boolean(!keys.ctrl && node.type === 'file' && nextState);
    if (!keys.ctrl) {
      this.clearSelection(newActive);
      if (!nextState) return;
    }
    node.selected = nextState;
    if (node.type === 'dir') {
      this.setSubtreeSelection(node, nextState);
    }
    if (node.type === 'file' && newActive) {
      node.active = true;
      ProfileManager.instance.setCurrContest(node.contestId);
    }
    this.refresh(true);
  }

  // --- Deletion: ---

  private removeNodeFromTree(node: Node) {
    if (node.parentId && !(node.parentId in this.target.idToNode)) {
      // Orphaned node: no need to remove from tree.
      return;
    }
    const control = node.parentId ? this.getParent(node, false)! : this.target.root;
    const sub = node.type === 'file' ? control.files : control.dirs;
    const head = this.getHead(sub, false)!;
    const tail = this.getTail(sub, false)!;
    if (node === head) sub.headId = head.nextId;
    if (node === tail) sub.tailId = tail.prevId;
    const prev = this.getPrev(node, false);
    const next = this.getNext(node, false);
    if (prev) prev.nextId = node.nextId;
    if (next) next.prevId = node.prevId;
    node.nextId = null;
    node.prevId = null;
    node.parentId = null;
  }

  private deleteSubtree(control: Links) {
    const dirHead = this.getHead(control.dirs, false);
    const fileHead = this.getHead(control.files, false);
    let curr: Node | null = dirHead;
    while (curr) {
      this.deleteCallback(curr);
      this.deleteSubtree(curr as DirNode);
      delete this.target.idToNode[curr.id];
      curr = this.getNext(curr, false);
    }
    curr = fileHead;
    while (curr) {
      this.deleteCallback(curr);
      delete this.target.idToNode[curr.id];
      curr = this.getNext(curr, false);
    }
  }

  private deleteCallback(node: Node) {
    if (node.type !== 'file') return;
    ProfileManager.instance.contestDeleted(node.contestId);
    ContestsManager.instance.deleteContest(node.contestId);
  }

  public deleteNode(nodeId: string) {
    const node = this.target.idToNode[nodeId];
    if (!node) return;
    this.removeNodeFromTree(node);
    this.deleteCallback(node);
    if (node.type === 'dir') {
      this.deleteSubtree(node);
    }
    delete this.target.idToNode[nodeId];
    this.refresh(true);
  }

  public deleteSelectedNodes() {
    for (const node of this.expandedFlat) {
      if (node.selected) {
        this.removeNodeFromTree(node);
        this.deleteCallback(node);
        delete this.target.idToNode[node.id];
      }
    }
    this.refresh(true);
  }

  // --- Search: ---

  public search(text: string) {
    text = text.trim();
    if (!text) {
      this.clearHidden();
      return;
    }
    const regex = new RegExp(text, 'i');
    // Clear selection on search to avoid confusion.
    this.nSelectedFiles = 0;
    this.nSelectedNodes = 0;
    for (const node of this.expandedFlat) {
      node.hidden = true;
      node.selected = false;
    }
    for (let i = this.expandedFlat.length - 1; i >= 0; i--) {
      const node = this.expandedFlat[i];
      if (node.type === 'file') {
        if (regex.test(node.text)) {
          node.hidden = false;
          const parent = this.getParent(node, false);
          if (parent) {
            parent.hidden = false;
            this.openDir(parent);
          }
        }
      } else {
        if (!node.hidden) {
          const parent = this.getParent(node, false);
          if (parent) {
            parent.hidden = false;
            this.openDir(parent);
          }
        }
      }
    }
  }

  private clearHidden() {
    for (const node of this.expandedFlat) node.hidden = false;
  }

  //  -- Movement: ---

  public moveSelectedFilesAbove(baseNodeId: string) {
    const baseNode = this.target.idToNode[baseNodeId];
    if (!baseNode || baseNode.type !== 'file' || baseNode.selected) return;
    const parent = this.getParent(baseNode, false);
    for (const node of this.expandedFlat) {
      if (node.type === 'file' && node.selected) {
        this.removeNodeFromTree(node);
        this.appendNodeAbove(node, baseNode);
        node.parentId = parent?.id || null;
      }
    }
    this.refresh(true);
  }

  public moveSelectedFilesBelow(baseNodeId: string) {
    const baseNode = this.target.idToNode[baseNodeId];
    if (!baseNode || baseNode.type !== 'file' || baseNode.selected) return;
    const parent = this.getParent(baseNode, false);
    for (let i = this.expandedFlat.length - 1; i >= 0; i--) {
      const node = this.expandedFlat[i];
      if (node.type === 'file' && node.selected) {
        this.removeNodeFromTree(node);
        this.appendNodeBelow(node, baseNode);
        node.parentId = parent?.id || null;
      }
    }
    this.refresh(true);
  }

  public moveSelectedFoldersAbove(baseNodeId: string) {
    const baseNode = this.target.idToNode[baseNodeId];
    if (!baseNode || baseNode.type !== 'dir' || baseNode.selected) return;
    const baseNodeParent = this.getParent(baseNode, false);
    for (const node of this.expandedFlat) {
      if (node.type === 'dir' && node.selected) {
        const parent = this.getParent(node, false);
        if (parent && parent.selected) continue;
        this.removeNodeFromTree(node);
        this.appendNodeAbove(node, baseNode);
        node.parentId = baseNodeParent?.id || null;
      }
    }
    this.refresh(true);
  }

  public moveSelectedFoldersBelow(baseNodeId: string) {
    const baseNode = this.target.idToNode[baseNodeId];
    if (!baseNode || baseNode.type !== 'dir' || baseNode.selected) return;
    const baseNodeParent = this.getParent(baseNode, false);
    for (let i = this.expandedFlat.length - 1; i >= 0; i--) {
      const node = this.expandedFlat[i];
      if (node.type === 'dir' && node.selected) {
        const parent = this.getParent(node, false);
        if (parent && parent.selected) continue;
        this.removeNodeFromTree(node);
        this.appendNodeBelow(node, baseNode);
        node.parentId = baseNodeParent?.id || null;
      }
    }
    this.refresh(true);
  }

  public moveSelectedNodesInto(destinationId: string | null) {
    const destinationNode = destinationId ? (this.target.idToNode[destinationId] as DirNode) : null;
    const control = destinationNode || this.target.root;
    if (destinationNode && (destinationNode.type !== 'dir' || destinationNode.selected)) return;
    if (destinationNode) this.openDir(destinationNode);
    for (const node of this.expandedFlat) {
      if (node.selected) {
        const parent = this.getParent(node, false);
        if (parent && parent.selected) continue;
        this.removeNodeFromTree(node);
        this.appendNode(node, control);
        node.parentId = destinationNode ? destinationNode.id : null;
      }
    }
    this.refresh(true);
  }
}
