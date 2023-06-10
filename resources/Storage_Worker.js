class Storage {
    static singleton = new Storage();

    static get() {
        return Storage.singleton;
    }

    constructor() {
        var openRequest = indexedDB.open("city-builder", 1);

        // Called if this is the first time the DB was opened, AKA the DB was
        // created and needs to have all of the neccessary objectStores inserted
        openRequest.onupgradeneeded = () => {
            openRequest.result.createObjectStore("world");
        }

        openRequest.onsuccess = () => {
            this.db = openRequest.result;
        }
    }

    saveAll(keys, values) {
        var len = Math.min(keys.length, values.length);
        for (var i = 0; i < len; i++) {
            this.save(keys[i], values[i]);
        }
    }

    save(key, data) {
        var transaction = this.db.transaction("world", "readwrite");
        var store = transaction.objectStore("world");
        store.put(data, key);
        transaction.commit();
    }
    
    remove(key) {
        var transaction = this.db.transaction("world", "readwrite");
        var store = transaction.objectStore("world");
        store.delete(key);
        transaction.commit();
    }

    clear() {
        var transaction = this.db.transaction("world", "readwrite");
        var store = transaction.objectStore("world");
        store.clear();
        transaction.commit();
    }
}

self.onmessage = (message) => {
    Storage.get()[message.data.function](...message.data.params);
}