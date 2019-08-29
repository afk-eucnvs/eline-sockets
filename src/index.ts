import Firebase from 'firebase/app';
import 'firebase/database'

// Erik skriver noget

const db = Firebase.initializeApp({
    apiKey: "AIzaSyDrgJLMlk-zHYwPgqhQfYRctaJkUMN69CI",
    databaseURL: "https://eline-sockets.firebaseio.com",
    projectId: "eline-sockets"
}).database();

const idsChars = 'abcdefghijklmnopqrstuvwxyz';

const Id = (len: number) => {
    let id = '';
    for (let i = 0; i < len; i++) {
        id += idsChars[Math.floor(Math.random() * idsChars.length)];
    }
    return id;
}

export class ElineSocket {
    private sink: Firebase.database.Reference;
    private source: Firebase.database.Reference;
    private disposables: (() => void)[] = [];

    private constructor(public id: string, sink: string, source: string) {
        this.sink = db.ref(`/${id}/${sink}`);
        this.source = db.ref(`/${id}/${source}`);
    }

    sendMessage(msg: any) {
        this.sink.push().set(msg);
    }

    onMessage(fn: (msg: any) => void) {
        const callback = (s: Firebase.database.DataSnapshot) => {
            fn(s.val());
            if (s.key) {
                this.source.child(s.key).remove();
            }
        }

        this.source.on('child_added', callback);

        this.disposables.push(() => this.source.off('child_added', callback));
    }

    close() {
        this.disposables.forEach(x => x());
        this.disposables = [];
    }

    static create(len = 6): ElineSocket {
        return new ElineSocket(Id(len), 'public', 'private');
    }

    static connect(id: string): ElineSocket {
        return new ElineSocket(id, 'private', 'public');
    }
}

(window as any).ElineSocket = ElineSocket;