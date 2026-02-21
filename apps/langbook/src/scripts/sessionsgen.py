import sqlite3
import json
import time
import uuid
import random
import os


# -----------------------------
# Helpers
# -----------------------------


def gen_session_id():
    return "session_" + uuid.uuid4().hex


def gen_folder_id():
    return "folder_" + uuid.uuid4().hex


def now_ms():
    return int(time.time() * 1000)


# Node representation
def make_file_node(session_id, name, depth):
    return {
        "id": session_id,
        "type": "file",
        "text": name,
        "depth": depth,
        "selected": False,
        "parentId": None,
        "nextId": None,
        "prevId": None,
        "ui": {"position": 0, "isLastChild": False, "depths": 0},
    }


def make_folder_node(folder_id, name, depth):
    return {
        "id": folder_id,
        "type": "dir",
        "text": name,
        "depth": depth,
        "open": True,
        "selected": False,
        "parentId": None,
        "nextId": None,
        "prevId": None,
        "dirs": {"headId": None, "tailId": None},
        "files": {"headId": None, "tailId": None},
        "ui": {"position": 0, "isLastChild": False, "depths": 0},
        "nDesc": 0,
        "nFileDesc": 0,
        "nSelDesc": 0,
    }


# Linked list insert
def append_to_list(struct, list_type, node_id, id_to_node):
    """
    struct.dirs or struct.files
    """
    lst = struct[list_type]
    head = lst["headId"]
    tail = lst["tailId"]

    if head is None:
        lst["headId"] = node_id
        lst["tailId"] = node_id
        return

    # update old tail
    prev_tail = id_to_node[tail]
    prev_tail["nextId"] = node_id

    # update new node
    new_node = id_to_node[node_id]
    new_node["prevId"] = tail

    lst["tailId"] = node_id


# Recursively compute nDesc and nFileDesc
def compute_desc(node, id_to_node):
    if node["type"] == "file":
        return 0, 1  # no descendants, 1 file itself

    # folder
    total_desc = 0
    total_file_desc = 0

    # dirs
    cur = node["dirs"]["headId"]
    while cur:
        child = id_to_node[cur]
        d, f = compute_desc(child, id_to_node)
        total_desc += 1 + d
        total_file_desc += f
        cur = child["nextId"]

    # files
    cur = node["files"]["headId"]
    while cur:
        child = id_to_node[cur]
        d, f = compute_desc(child, id_to_node)
        total_desc += 1 + d
        total_file_desc += f
        cur = child["nextId"]

    node["nDesc"] = total_desc
    node["nFileDesc"] = total_file_desc
    return total_desc, total_file_desc


# -----------------------------
# Main generator
# -----------------------------


def generate(total_nodes, sessions_db="sessions.sqlite", tree_path="tree.json"):
    # Create SQLite
    conn = sqlite3.connect(sessions_db)
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      createdAt INTEGER NOT NULL
    );
    """)

    # ROOT node
    root = {
        "root": {
            "dirs": {"headId": None, "tailId": None},
            "files": {"headId": None, "tailId": None},
        },
        "idToNode": {},
    }

    id_to_node = root["idToNode"]

    # List of possible parent folders for placement (including root)
    folders = [
        {"id": None, "node": root["root"], "depth": 0}
    ]  # root acts like a folder

    folder_count = 0
    session_count = 0

    for _ in range(total_nodes):
        # choose random parent folder
        parent = random.choice(folders)
        parent_id = parent["id"]
        parent_node = parent["node"]
        parent_depth = parent["depth"]

        # choose random file OR folder
        is_file = random.random() < 0.6  # 60% chance file

        if is_file:
            session_count += 1
            session_id = gen_session_id()
            name = f"Session {session_count}"

            # Create file node
            node = make_file_node(session_id, name, parent_depth + 1)
            node["parentId"] = parent_id
            id_to_node[session_id] = node

            # Insert in parent's files list
            append_to_list(parent_node, "files", session_id, id_to_node)

            # Insert into SQLite
            cursor.execute(
                "INSERT INTO sessions (id, name, count, createdAt) VALUES (?, ?, ?, ?)",
                (session_id, name, 0, now_ms()),
            )

        else:
            folder_count += 1
            folder_id = gen_folder_id()
            name = f"Folder {folder_count}"

            node = make_folder_node(folder_id, name, parent_depth + 1)
            node["parentId"] = parent_id
            id_to_node[folder_id] = node

            append_to_list(parent_node, "dirs", folder_id, id_to_node)

            # folder becomes a parent option (if depth < 5)
            if parent_depth + 1 < 5:
                folders.append(
                    {"id": folder_id, "node": node, "depth": parent_depth + 1}
                )

    conn.commit()
    conn.close()

    # compute descendants stats
    # for each folder
    for node_id, node in id_to_node.items():
        if node["type"] == "dir":
            compute_desc(node, id_to_node)

    # write JSON
    with open(tree_path, "w", encoding="utf8") as f:
        json.dump(root, f, indent=2, ensure_ascii=False)

    return sessions_db, tree_path


if __name__ == "__main__":
    n = int(input("How many total nodes (files + folders)? "))
    db_path, tree_file = generate(n)
    print("Database created:", os.path.abspath(db_path))
    print("Tree created:", os.path.abspath(tree_file))
