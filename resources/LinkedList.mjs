class Node {
    /**
     * @type {Node}
     */
    next;

    constructor(value) {
        this.value = value;
    }
}

export class LinkedList {
    head = undefined;
    tail = undefined;

    #length = 0;
    get length() {
        return this.#length;
    };

    constructor() {

    }

    add(value) {
        var node = new Node(value);

        if (this.head == undefined) {
            this.head = node;
        }

        if (this.tail != undefined) {
            this.tail.next = node;
        }

        this.tail = node;

        this.#length += 1;
    }

    get(index) {
        if (index >= this.length || index < 0) throw "OutOfBoundsException";

        var pointer = this.head;
        for (var i = 0; i < index; i++) {
            pointer = pointer.next;
        }

        return pointer.value;
    }

    remove(index) {
        if (index >= this.length || index < 0) throw "OutOfBoundsException";
        this.length -= 1;

        if (index == 0) {
            this.head = this.head?.next;
            return;
        }

        var pointer = this.head;
        for (var i = 0; i < index - 1; i++) {
            pointer = pointer.next;
        }


        pointer.next = pointer?.next?.next;
    }

    forEach(callback) {
        var pointer = this.head;
        for (var i = 0; i < this.length; i++) {
            callback(pointer.value, i);

            pointer = pointer.next;
        }
    }

    find(callback) {
        var pointer = this.head;
        var response = undefined;
        for (var i = 0; i < this.length; i++) {
            if (callback(pointer.value, i) == true) {
                response = pointer.value;
                break;
            }

            pointer = pointer.next;
        }

        return response;
    }

    filter(callback) {
        var pointer = this.head;
        var response = new LinkedList();
        for (var i = 0; i < this.length; i++) {
            if (callback(pointer.value, i) == true) {
                response.add(pointer.value);
            }

            pointer = pointer.next;
        }

        return response;
    }
}

window.LinkedList = LinkedList;