import { randomId } from '@interapp/utils/utils';
import { FileProxy } from '@interapp/utils/fileProxy';
import { Links, Node, FileNode, DirNode, NodeType, HeadAndTail } from '../common/tree';
import { ModifierKeys } from '@interapp/types/modifierKeys';
import { TreeSnapshot } from '../common/treeSnapshot';
import { GenericResponseDTO } from '@interapp/dto/genericResponseDTO';
import fs from 'fs';
import { setBit, clearBit } from '@interapp/utils/bitMask';

// Contains a linked list of the root nodes.
type Root = Links & {
  nextDir: number; // Number of the next directory to be created.
  nextFile: number; // Number of the next file to be created.
};

type TreeData = {
  root: Root;
  idToNode: Record<string, Node>; // Maps node ids to the node objects.
};

type DeleteCallback = (node: Node) => Promise<void>;

export class ExplorerManager {
  // -- Class configuration: ---

  static #instance: ExplorerManager;
  private _proxy: FileProxy<TreeData> | null = null;

  private constructor() {}

  public static get instance(): ExplorerManager {
    if (!this.#instance) {
      this.#instance = new ExplorerManager();
    }
    return this.#instance;
  }

  private get proxy() {
    return this._proxy!.proxy;
  }
  private get target() {
    return this._proxy!.target;
  }

  private readonly TREE_PAGE_SIZE = 300; // items.
  private readonly TREE_ITEM_HEIGHT = 28; // px.

  // --- Variables and structures: ---

  private nSelectedNodes = 0;
  private nSelectedFiles = 0;
  private nFiles = 0;
  private nOpenDirs = 0;
  private expandedFlat: Node[] = []; // Entire tree flattened into an array.
  private selectedNodes: string[] = [];

  // --- Registered callbacks: ---

  private deleteCallback: DeleteCallback = async () => {};

  // You should call this function for registering the node delete callback.
  public registerDeleteCallback(callback: DeleteCallback) {
    this.deleteCallback = callback;
  }

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

  public loadTree(filePath: string) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Tree file does not exist: ${filePath}`);
    }
    this._proxy = new FileProxy(filePath, this.getEmptyTreeData());
    this.refresh(false);
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
      } else {
        this.nFiles++;
      }
      curr.depth = depth;
      const sel = curr.selected ? 1 : 0;
      if (sel) this.selectedNodes.push(curr.id);
      nSub++;
      nSubSel += sel;
      nSubFiles += curr.type === 'file' ? 1 : 0;
      this.nSelectedNodes += sel;
      this.nSelectedFiles += curr.type === 'file' ? sel : 0;
      curr = this.getNext(curr, false);
    }
    return { nSub, nSubSel, nSubFiles };
  }

  private getLastDirectChild(node: Node): Node | null {
    if (node.type !== 'dir') return null;
    const file = this.getTail(node.files, false);
    const dir = this.getTail(node.dirs, false);
    return file || dir || null;
  }

  private calculateUiDepths() {
    const depthSet = new Set<string>();
    let currDepth = 0;
    for (const node of this.expandedFlat) {
      node.ui.depths = currDepth;
      if (depthSet.has(node.id)) {
        currDepth = clearBit(currDepth, node.depth - 1);
      }
      // - Set current node last direct child status:
      const parent = this.getParent(node, false);
      if (parent) {
        const parentLastDirectChild = this.getLastDirectChild(parent);
        node.ui.isLastChild = node === parentLastDirectChild;
      }
      // - Find last direct child of node, and set it as limit in the set:
      const lastDirectChild = this.getLastDirectChild(node);
      if (lastDirectChild) {
        depthSet.add(lastDirectChild.id);
        currDepth = setBit(currDepth, node.depth);
      }
    }
  }

  public buildResult(scrollTop: number): TreeSnapshot {
    const page: Node[] = [];
    const tolerance = scrollTop - (this.TREE_PAGE_SIZE / 2) * this.TREE_ITEM_HEIGHT;
    let nSurfaceNodes = 0;
    for (let i = 0; i < this.expandedFlat.length; i++) {
      const node = this.expandedFlat[i];
      const currScroll = this.TREE_ITEM_HEIGHT * nSurfaceNodes;
      node.ui.position = nSurfaceNodes;
      if (currScroll >= tolerance && page.length < this.TREE_PAGE_SIZE) {
        page.push(node);
      }
      nSurfaceNodes++;
      if (node.type === 'dir' && !node.open) {
        i += node.nDesc;
      }
    }
    if (nSurfaceNodes && !page.length) {
      // If current scrollTop is larger than the size of the tree:
      const fakeScrollTop = (nSurfaceNodes - 1) * this.TREE_ITEM_HEIGHT;
      return this.buildResult(fakeScrollTop);
    }
    return {
      selectedNodes: this.nSelectedNodes,
      selectedFiles: this.nSelectedFiles,
      totalNodes: this.expandedFlat.length,
      openDirs: this.nOpenDirs,
      surfaceNodes: nSurfaceNodes,
      page,
    };
  }

  /**
   * Refreshes:
   *  - this.expandedFlat;
   *  - this.selectedNotes;
   *  - this.nSelectedNodes;
   *  - this.nSelectedFiles;
   *  - this.nOpenDirs;
   *  - this.nFiles;
   * For every node, updates:
   *  - depth;
   *  - nDesc;
   *  - nSelDesc;
   *  - nFileDesc;
   */
  private refresh(flush: boolean) {
    const dirHead = this.getHead(this.target.root.dirs, false);
    const fileHead = this.getHead(this.target.root.files, false);
    this.selectedNodes = [];
    this.expandedFlat = [];
    this.nSelectedNodes = 0;
    this.nSelectedFiles = 0;
    this.nOpenDirs = 0;
    this.nFiles = 0;
    this.flatten(dirHead, 0, this.expandedFlat);
    this.flatten(fileHead, 0, this.expandedFlat);
    if (flush) {
      this._proxy!.queueWrite();
    }
  }

  public getSelectedNodes(): string[] {
    return [...this.selectedNodes];
  }

  public getNFiles(): number {
    return this.nFiles;
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
      ui: {
        position: 0,
        isLastChild: false,
        depths: 0,
      },
    } as const;
  }

  private createFileNode(prefix: string, parentId: string | null): FileNode {
    const text = `${prefix} ${this.target.root.nextFile}`;
    return {
      id: randomId(),
      type: 'file',
      text,
      depth: 0,
      selected: false,
      parentId,
      nextId: null,
      prevId: null,
      ui: {
        position: 0,
        isLastChild: false,
        depths: 0,
      },
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

  public createNode(type: NodeType, prefix: string, parentId: string | null): Node {
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
    this.calculateUiDepths();
    return newNode;
  }

  public createNodeAbove(type: NodeType, prefix: string, baseNodeId: string) {
    const baseNode = this.target.idToNode[baseNodeId];
    if (!baseNode) return;
    const parent = this.getParent(baseNode, false);
    const newNode = this.createNodeHelper(type, prefix, parent?.id || null);
    if (parent) newNode.selected = parent.selected;
    this.appendNodeAbove(newNode, baseNode);
    this.refresh(true);
    this.calculateUiDepths();
  }

  public createNodeBelow(type: NodeType, prefix: string, baseNodeId: string) {
    const baseNode = this.target.idToNode[baseNodeId];
    if (!baseNode) return;
    const parent = this.getParent(baseNode, false);
    const newNode = this.createNodeHelper(type, prefix, parent?.id || null);
    if (parent) newNode.selected = parent.selected;
    this.appendNodeBelow(newNode, baseNode);
    this.refresh(true);
    this.calculateUiDepths();
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
    return { status: 'success' };
  }

  // --- Selection handling: ---

  public clearSelection() {
    for (const node of this.expandedFlat) {
      node.selected = false;
      if (node.type === 'dir') node.nSelDesc = 0;
    }
    this.nSelectedFiles = 0;
    this.nSelectedNodes = 0;
    this.selectedNodes = [];
    this._proxy!.queueWrite();
  }

  public selectAll() {
    this.nSelectedFiles = 0;
    this.selectedNodes = [];
    for (const node of this.expandedFlat) {
      node.selected = true;
      if (node.type === 'dir') node.nSelDesc = node.nDesc;
      if (node.type === 'file') {
        this.nSelectedFiles++;
        this.selectedNodes.push(node.id);
      }
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
    if (!keys.ctrl) {
      this.clearSelection();
      if (!nextState) return;
    }
    node.selected = nextState;
    if (node.type === 'dir') {
      this.setSubtreeSelection(node, nextState);
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

  private async deleteSubtree(control: Links) {
    const dirHead = this.getHead(control.dirs, false);
    const fileHead = this.getHead(control.files, false);
    let curr: Node | null = dirHead;
    while (curr) {
      await this.deleteCallback(curr);
      this.deleteSubtree(curr as DirNode);
      delete this.target.idToNode[curr.id];
      curr = this.getNext(curr, false);
    }
    curr = fileHead;
    while (curr) {
      await this.deleteCallback(curr);
      delete this.target.idToNode[curr.id];
      curr = this.getNext(curr, false);
    }
  }

  public async deleteNode(nodeId: string) {
    const node = this.target.idToNode[nodeId];
    if (!node) return;
    this.removeNodeFromTree(node);
    if (node.type === 'dir') {
      this.deleteSubtree(node);
    }
    delete this.target.idToNode[nodeId];
    this.refresh(true);
    this.calculateUiDepths();
    await this.deleteCallback(node);
  }

  public async deleteSelectedNodes() {
    for (const node of this.expandedFlat) {
      if (node.selected) {
        this.removeNodeFromTree(node);
        await this.deleteCallback(node);
        delete this.target.idToNode[node.id];
      }
    }
    this.refresh(true);
    this.calculateUiDepths();
  }

  //  --- Movement: ---

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
    this.calculateUiDepths();
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
    this.calculateUiDepths();
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
    this.calculateUiDepths();
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
    this.calculateUiDepths();
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
    this.calculateUiDepths();
  }
}
