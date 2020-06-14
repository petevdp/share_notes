import { Subject, BehaviorSubject } from "rxjs";

const dependencyDescription = {
  room: { id: "string" },
  user: { id: "string" },
};


type notFunc = string | null | undefined | number | {[key: string]: notFunc} | notFunc[];

type id = string;

interface storeDescription {
  id: string;
  descriptors: {
    [key: string]: notFunc
  },
  dependencies: Set<id>;
};

interface store<V> {
  description: storeDescription;
  $: BehaviorSubject<V>;
}


type initStore<V> = (storeDescription: storeDescription, state: any, dependendStores: Map<id, storeDescription>) => store<V>

function initStore() {
}

interface dependency<T, D> {
  id: string;
  store?: BehaviorSubject<T>;
  dependencies: D;
}

function initDependency<T, D>(dependency: dependency<T, D>, dependencies: D) {
}

function requireDependency<T>(dependency)


interface subjectStore = {
  domain$: {
    $: Subject | nul
  }
}


const dependency = {
  dependencies: {},
  create: (dependencies) => {
    return "subject";
  },
};

interface dependencies {
  [key: string]: string;
}

interface dependencyDescription {
  deps: dependencies;
}

function requireSubject<S, D>() {}
