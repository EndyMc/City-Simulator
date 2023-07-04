class Storage {
    static singleton = new Storage();

    static get() {
        return Storage.singleton;
    }

    constructor() {
        this.worker = new Worker("Storage_Worker.mjs");

        var openRequest = indexedDB.open("city-builder", 1);

        // Called if this is the first time the DB was opened, AKA the DB was
        // created and needs to have all of the neccessary objectStores inserted
        openRequest.onupgradeneeded = () => {
            openRequest.result.createObjectStore("world");
        }

        openRequest.onsuccess = () => {
            this.db = openRequest.result;
        }

        openRequest.onblocked = () => {
            console.error("Database open request blocked");
        };
        
        openRequest.onerror = (event) => {
            console.error("Error opening database:", event.target.error);
        };
    }

    async get(key) {
        var transaction = this.db.transaction("world", "readonly");
        var store = transaction.objectStore("world");
        var request = store.get(key);

        var result = await new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => {
                console.error(request.error);
                reject(request.error);
            }
        });

        return result;
    }

    async getAll() {
        if (this.db == undefined) return [];
        var transaction = this.db.transaction("world", "readonly");
        var store = transaction.objectStore("world");
        var request = store.getAll();

        var result = await new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => {
                console.error(request.error);
                reject(request.error);
            }
        });

        return result;
    }

    saveAll(keys, values) {
        this.worker.postMessage({ "function": "saveAll", params: [ keys, values ] });
    }

    save(key, data) {
        this.worker.postMessage({ "function": "save", params: [ key, data ] });
    }
    
    remove(key) {
        this.worker.postMessage({ "function": "remove", params: [ key ] });
    }

    clear() {
        this.worker.postMessage({ "function": "clear", params: [  ] });
    }
}