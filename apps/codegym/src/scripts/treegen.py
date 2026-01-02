"""
Generate a tree to test the TreeView component.
"""

import json
import random
import string
import sys
from typing import Optional


def random_id() -> str:
    part1 = "".join(
        random.choices(string.ascii_lowercase + string.digits, k=random.randint(6, 8))
    )
    part2 = "".join(
        random.choices(string.ascii_lowercase + string.digits, k=random.randint(8, 10))
    )
    return f"{part1}.{part2}"


class Node:
    def __init__(self, node_id, node_type, text, parent_id=None):
        self.id = node_id
        self.type = node_type
        self.text = text
        self.parentId = parent_id
        self.nextId = None
        self.prevId = None
        self.depth = 0
        self.selected = False
        self.hidden = False
        self.open = True
        self.dirs = {"headId": None, "tailId": None} if node_type == "dir" else None
        self.files = {"headId": None, "tailId": None} if node_type == "dir" else None
        self.nDesc = 0 if node_type == "dir" else None
        self.nSelDesc = 0 if node_type == "dir" else None


def create_random_tree(total_nodes: int):
    id_to_node = {}
    root = {
        "nextDir": 1,
        "nextFile": 1,
        "dirs": {"headId": None, "tailId": None},
        "files": {"headId": None, "tailId": None},
    }

    # Creates a list of directories that can have children:
    dir_candidates = []

    def add_child(parent: Optional[Node]):
        nonlocal total_nodes
        if total_nodes <= 0:
            return None
        node_type = random.choices(["dir", "file"], weights=[0.4, 0.6])[0]
        if parent is None:
            parent_id = None
            depth = 0
        else:
            parent_id = parent.id
            depth = parent.depth + 1

        node_id = random_id()
        name_prefix = "Folder" if node_type == "dir" else "File"
        name = f"{name_prefix} {root['nextDir'] if node_type == 'dir' else root['nextFile']}"
        node = Node(node_id, node_type, name, parent_id)
        node.depth = depth

        # Increment counters
        if node_type == "dir":
            root["nextDir"] += 1
        else:
            root["nextFile"] += 1

        id_to_node[node_id] = vars(node)

        # Connects the node to the parent (doubly linked list)
        if parent:
            sub = parent.dirs if node_type == "dir" else parent.files
            if sub["headId"] is None:
                sub["headId"] = node.id
                sub["tailId"] = node.id
            else:
                tail = id_to_node[sub["tailId"]]
                node.prevId = tail["id"]
                tail["nextId"] = node.id
                sub["tailId"] = node.id

        # If it is a directory, add as a candidate to receive children
        if node_type == "dir":
            dir_candidates.append(node)

        total_nodes -= 1
        return node

    # Start by creating files and directories at the root
    roots = []
    while total_nodes > 0 and len(roots) < 5:
        roots.append(add_child(None))

    # Create children while there are nodes available
    while total_nodes > 0 and dir_candidates:
        parent = random.choice(dir_candidates)
        for _ in range(random.randint(1, 4)):
            add_child(parent)
            if total_nodes <= 0:
                break

    # Define head/tail in root
    dirs = [
        n for n in id_to_node.values() if n["type"] == "dir" and n["parentId"] is None
    ]
    files = [
        n for n in id_to_node.values() if n["type"] == "file" and n["parentId"] is None
    ]
    if dirs:
        root["dirs"]["headId"] = dirs[0]["id"]
        root["dirs"]["tailId"] = dirs[-1]["id"]
        for i in range(1, len(dirs)):
            dirs[i]["prevId"] = dirs[i - 1]["id"]
            dirs[i - 1]["nextId"] = dirs[i]["id"]
    if files:
        root["files"]["headId"] = files[0]["id"]
        root["files"]["tailId"] = files[-1]["id"]
        for i in range(1, len(files)):
            files[i]["prevId"] = files[i - 1]["id"]
            files[i - 1]["nextId"] = files[i]["id"]

    return {"root": root, "idToNode": id_to_node}


def main():
    N = int(input("How many nodes? "))
    tree_data = create_random_tree(N)
    with open("tree.json", "w", encoding="utf-8") as f:
        json.dump(tree_data, f, indent=2)
    print(f"🌳 File 'tree.json' generated with {len(tree_data['idToNode'])} nodes.")


if __name__ == "__main__":
    main()
