type Color = "RED" | "BLACK";

class Node<K, V> {
  key: K;
  value: V;
  color: Color;

  left: Node<K, V> | null = null;
  right: Node<K, V> | null = null;
  parent: Node<K, V> | null = null;

  constructor(key: K, value: V, color: Color) {
    this.key = key;
    this.value = value;
    this.color = color;
  }
}

export class RBTree<K, V> {
  private root: Node<K, V> | null = null;

  constructor(private compare: (a: K, b: K) => number) {}

  // ------------------------
  // ROTATIONS
  // ------------------------

  private rotateLeft(x: Node<K, V>) {
    const y = x.right!;
    x.right = y.left;

    if (y.left) y.left.parent = x;

    y.parent = x.parent;

    if (!x.parent) this.root = y;
    else if (x === x.parent.left) x.parent.left = y;
    else x.parent.right = y;

    y.left = x;
    x.parent = y;
  }

  private rotateRight(y: Node<K, V>) {
    const x = y.left!;
    y.left = x.right;

    if (x.right) x.right.parent = y;

    x.parent = y.parent;

    if (!y.parent) this.root = x;
    else if (y === y.parent.left) y.parent.left = x;
    else y.parent.right = x;

    x.right = y;
    y.parent = x;
  }

  // ------------------------
  // INSERT
  // ------------------------

  insert(key: K, value: V) {
    const node = new Node(key, value, "RED");

    let parent: Node<K, V> | null = null;
    let current = this.root;

    while (current) {
      parent = current;
      if (this.compare(key, current.key) < 0) current = current.left;
      else current = current.right;
    }

    node.parent = parent;

    if (!parent) this.root = node;
    else if (this.compare(key, parent.key) < 0) parent.left = node;
    else parent.right = node;

    this.fixInsert(node);
  }

  private fixInsert(z: Node<K, V>) {
    while (z.parent && z.parent.color === "RED") {
      const gp = z.parent.parent!;
      if (z.parent === gp.left) {
        const y = gp.right;

        if (y?.color === "RED") {
          z.parent.color = "BLACK";
          y.color = "BLACK";
          gp.color = "RED";
          z = gp;
        } else {
          if (z === z.parent.right) {
            z = z.parent;
            this.rotateLeft(z);
          }
          z.parent!.color = "BLACK";
          gp.color = "RED";
          this.rotateRight(gp);
        }
      } else {
        const y = gp.left;

        if (y?.color === "RED") {
          z.parent.color = "BLACK";
          y.color = "BLACK";
          gp.color = "RED";
          z = gp;
        } else {
          if (z === z.parent.left) {
            z = z.parent;
            this.rotateRight(z);
          }
          z.parent!.color = "BLACK";
          gp.color = "RED";
          this.rotateLeft(gp);
        }
      }
    }

    if (this.root) this.root.color = "BLACK";
  }

  // ------------------------
  // SEARCH
  // ------------------------

  private findNode(key: K): Node<K, V> | null {
    let current = this.root;

    while (current) {
      const cmp = this.compare(key, current.key);
      if (cmp === 0) return current;
      if (cmp < 0) current = current.left;
      else current = current.right;
    }

    return null;
  }

  find(key: K): V | null {
    return this.findNode(key)?.value || null;
  }

  // ------------------------
  // MIN
  // ------------------------

  private minimum(node: Node<K, V>): Node<K, V> {
    while (node.left) node = node.left;
    return node;
  }

  getMin(): V | null {
    if (!this.root) return null;
    return this.minimum(this.root).value;
  }

  // ------------------------
  // DELETE
  // ------------------------

  delete(key: K): boolean {
    const z = this.findNode(key);
    if (!z) return false;

    let y = z;
    let yOriginalColor = y.color;
    let x: Node<K, V> | null = null;

    if (!z.left) {
      x = z.right;
      this.transplant(z, z.right);
    } else if (!z.right) {
      x = z.left;
      this.transplant(z, z.left);
    } else {
      y = this.minimum(z.right);
      yOriginalColor = y.color;
      x = y.right;

      if (y.parent !== z) {
        this.transplant(y, y.right);
        y.right = z.right;
        if (y.right) y.right.parent = y;
      }

      this.transplant(z, y);
      y.left = z.left;
      if (y.left) y.left.parent = y;

      y.color = z.color;
    }

    if (yOriginalColor === "BLACK") {
      this.fixDelete(x, z.parent);
    }

    return true;
  }

  private transplant(u: Node<K, V>, v: Node<K, V> | null) {
    if (!u.parent) this.root = v;
    else if (u === u.parent.left) u.parent.left = v;
    else u.parent.right = v;

    if (v) v.parent = u.parent;
  }

  // ------------------------
  // FIX DELETE (SAFE VERSION)
  // ------------------------

  private fixDelete(x: Node<K, V> | null, parent: Node<K, V> | null) {
    while (x !== this.root && (x === null || x.color === "BLACK")) {
      if (!parent) break;

      if (x === parent.left) {
        let w = parent.right;

        if (w?.color === "RED") {
          w.color = "BLACK";
          parent.color = "RED";
          this.rotateLeft(parent);
          w = parent.right;
        }

        if (
          (!w?.left || w.left.color === "BLACK") &&
          (!w?.right || w.right.color === "BLACK")
        ) {
          if (w) w.color = "RED";
          x = parent;
          parent = x.parent;
        } else {
          if (!w?.right || w.right.color === "BLACK") {
            if (w?.left) w.left.color = "BLACK";
            if (w) {
              w.color = "RED";
              this.rotateRight(w);
            }
            w = parent.right;
          }

          if (w) w.color = parent.color;
          parent.color = "BLACK";
          if (w?.right) w.right.color = "BLACK";
          this.rotateLeft(parent);
          x = this.root;
          break;
        }
      } else {
        let w = parent.left;

        if (w?.color === "RED") {
          w.color = "BLACK";
          parent.color = "RED";
          this.rotateRight(parent);
          w = parent.left;
        }

        if (
          (!w?.left || w.left.color === "BLACK") &&
          (!w?.right || w.right.color === "BLACK")
        ) {
          if (w) w.color = "RED";
          x = parent;
          parent = x.parent;
        } else {
          if (!w?.left || w.left.color === "BLACK") {
            if (w?.right) w.right.color = "BLACK";
            if (w) {
              w.color = "RED";
              this.rotateLeft(w);
            }
            w = parent.left;
          }

          if (w) w.color = parent.color;
          parent.color = "BLACK";
          if (w?.left) w.left.color = "BLACK";
          this.rotateRight(parent);
          x = this.root;
          break;
        }
      }
    }

    if (x) x.color = "BLACK";
  }
}
