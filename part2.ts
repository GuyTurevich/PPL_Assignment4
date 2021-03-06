export const MISSING_KEY = '___MISSING_KEY___'
export const MISSING_TABLE_SERVICE = '___MISSING_TABLE_SERVICE___'

export type Table<T> = Readonly<Record<string, Readonly<T>>>

export type TableService<T> = {
    get(key: string): Promise<T>;
    set(key: string, val: T): Promise<void>;
    delete(key: string): Promise<void>;
}

// Q 2.1 (a)
export function makeTableService<T>(sync: (table?: Table<T>) => Promise<Table<T>>): TableService<T> {
    // optional initialization code
    return {
        get(key: string): Promise<T> {
            return new Promise((resolve,reject) => { sync()
                .then(table =>
                    { table[key] === undefined ? reject(MISSING_KEY) : resolve(table[key])})
                .catch(() =>
                    { reject(MISSING_KEY)})
                })

        },
        set(key: string, val: T): Promise<void> {
            return new Promise((resolve,reject) => { sync()
                .then(table => {
                    let newTable : Record<string,T> = table;
                    newTable[key] = val
                    sync(table)
                    resolve() 
                    })
                .catch(() => {
                    reject(MISSING_KEY)})
                })
        },
        delete(key: string): Promise<void> {
            return new Promise((resolve,reject) => { sync()
                .then(table => { 
                    if(table[key] === undefined){
                          reject(MISSING_KEY)
                    }
                    else{ 
                        let newTable : Record<string,T> = table;
                        delete newTable[key]
                        sync(newTable)
                        resolve()
                    }
                })
                .catch(() =>
                    { reject(MISSING_KEY)})})
             
            
        }
    }
}

// Q 2.1 (b)
export function getAll<T>(store: TableService<T>, keys: string[]): Promise<T[]> {
    return new Promise<T[]>((resolve, reject) => {
        let promiseList : Promise<T>[] = []
        for(let i = 0 ; i < keys.length ; i++){
            promiseList.push(store.get(keys[i]))
        }
        Promise.all(promiseList).then(value =>{
            resolve(value)
        })
        .catch(() => reject(MISSING_KEY))
    })
}


// Q 2.2
export type Reference = { table: string, key: string }

export type TableServiceTable = Table<TableService<object>>

export function isReference<T>(obj: T | Reference): obj is Reference {
    return typeof obj === 'object' && 'table' in obj
}

export async function constructObjectFromTables(tables: TableServiceTable, ref: Reference) {
     
    async function deref(ref: Reference) {
        try{
            let table = tables[ref.table]
            let obj :Record<string, any> = await table.get(ref.key)
            for (const [key, value] of Object.entries(obj)){
                isReference(value) ? obj[key] = await deref(value) : value
            }
          return obj
        }
        catch{
            return Promise.reject(MISSING_TABLE_SERVICE)
        }
    }

    return deref(ref)
}

// Q 2.3

export function lazyProduct<T1, T2>(g1: () => Generator<T1>, g2: () => Generator<T2>): () => Generator<[T1, T2]> {
    return function* () : Generator<[T1, T2]> {
        const iterator1 = g1()
        let iterator2 = g2()
        let next1 = iterator1.next()
        let next2 = iterator2.next()
        while(!next1.done){
            while(!next2.done){
                yield [next1.value,next2.value]
                next2 = iterator2.next()
            }
            next1 = iterator1.next()
            iterator2 = g2()
            next2 = iterator2.next()
        }
    }
}

export function lazyZip<T1, T2>(g1: () => Generator<T1>, g2: () => Generator<T2>): () => Generator<[T1, T2]> {
    return function* () : Generator<[T1, T2]> {
        const iterator1 = g1()
        const iterator2 = g2()
        let next1 = iterator1.next()
        let next2 = iterator2.next()
        while(!next1.done){
            yield [next1.value,next2.value]
            next1 = iterator1.next()
            next2 = iterator2.next()
        }
    }
}

// Q 2.4
export type ReactiveTableService<T> = {
    get(key: string): T;
    set(key: string, val: T): Promise<void>;
    delete(key: string): Promise<void>;
    subscribe(observer: (table: Table<T>) => void): void
}

export async function makeReactiveTableService<T>(sync: (table?: Table<T>) => Promise<Table<T>>, optimistic: boolean): Promise<ReactiveTableService<T>> {
    // optional initialization code

    let _table: Table<T> = await sync()

    const handleMutation = async (newTable: Table<T>) => {
        // TODO implement!
    }
    return {
        get(key: string): T {
            if (key in _table) {
                return _table[key]
            } else {
                throw MISSING_KEY
            }
        },
        set(key: string, val: T): Promise<void> {
            return handleMutation(null as any /* TODO */)
        },
        delete(key: string): Promise<void> {
            return handleMutation(null as any /* TODO */)
        },

        subscribe(observer: (table: Table<T>) => void): void {
            // TODO implement!
        }
    }
}