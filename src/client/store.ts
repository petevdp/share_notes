import { createStore, applyMiddleware, Action, Store } from "redux";
import { combineEpics, createEpicMiddleware, Epic } from "redux-observable";
import { configureStore, createAction, createReducer } from "@reduxjs/toolkit";
import { filter, map, concatMap, withLatestFrom } from "rxjs/operators";
import { Observable, of, from } from "rxjs";
import { Convergence, ConvergenceDomain } from "@convergence/convergence";
import { CONVERGENCE_SERVICE_URL } from "Shared/environment";

type userCredentials = { username: string; password: string };
type id = string;

export const attemptConnection = createAction(
  "attemptConnection",
  (userCredentials: userCredentials) => ({
    payload: {
      userCredentials,
    },
  })
);

const connectionEstablished = createAction(
  "connectionEstablished",
  (domain: ConvergenceDomain) => ({ payload: domain })
);

type roomCreationDetails = {
  name: string;
};

export const createRoom = createAction(
  "createRoom",
  (details: roomCreationDetails) => ({ payload: details })
);

export const roomCreated = createAction("roomCreated", (id: string) => ({
  payload: id,
}));

export const resetRoomCreationStatus = createAction("resetRoomCreationStatus");

export const createEditor = createAction("createEditor", (roomId: string) => ({
  payload: roomId,
}));

const editorCreated = createAction("editorCreated", (editorId: string) => ({
  payload: editorId,
}));

interface roomData {
  name: string;
  ownerId: id;
  editorIds: id[];
  participantIds: id[];
}

export interface state {
  userCredentials?: userCredentials;
  creatingRoomStatus?: "creating" | id;
}

export const attemptConnectionEpic: Epic = (actions$) => {
  return actions$.pipe(
    filter(attemptConnection.match),
    concatMap(({ payload }) => {
      const { username, password } = payload.userCredentials;
      return Convergence.connect(CONVERGENCE_SERVICE_URL, username, password);
    }),
    map((domain) => connectionEstablished(domain))
  );
};

export const createRoomEpic: Epic = (action$, state$: Observable<state>) => {
  const domain$ = action$.pipe(
    filter(connectionEstablished.match),
    map(({ payload }) => payload)
  );

  return action$.pipe(
    filter(createRoom.match),
    withLatestFrom(domain$),
    concatMap(async ([{ payload }, domain]) => {
      if (!domain) {
        throw "domain isn't connected";
      }
      const { name } = payload;
      const data: roomData = {
        name,
        ownerId: domain.session().user().userId.username,
        participantIds: [],
        editorIds: [],
      };

      console.log("creating room");
      const id = await domain.models().create({
        collection: "rooms",
        data,
      });

      console.log("created room + " + id);
      return roomCreated(id);
    })
  );
};

const createEditorEpic: Epic = (action$, state$: Observable<state>) => {
  const domain$ = action$.pipe(
    filter(connectionEstablished.match),
    map(({ payload }) => payload)
  );

  return action$.pipe(
    filter(createEditor.match),
    withLatestFrom(domain$),
    concatMap(async ([{ payload: roomId }, domain]) => {
      if (!domain) {
        throw "domain isn't connected when creating editor";
      }
      console.log("creating editor");
      const editorId = await domain.models().create({ collection: "editors" });
      return editorCreated(editorId);
    })
  );
};

const epicMiddleware = createEpicMiddleware();

const state: state = {};
const reducer = createReducer(state, (builder) =>
  builder
    .addCase(createRoom, (state) => ({
      ...state,
      creatingRoomStatus: "creating",
    }))
    .addCase(roomCreated, (state, action) => ({
      ...state,
      creatingRoomStatus: action.payload, // roomId
    }))
    .addCase(resetRoomCreationStatus, (state, action) => ({
      ...state,
      creatingRoomStatus: undefined,
    }))
);

export const store = configureStore({
  reducer,
  preloadedState: state,
  middleware: [epicMiddleware],
});

export type AppDispatch = typeof store.dispatch;

epicMiddleware.run(
  combineEpics(attemptConnectionEpic, createRoomEpic, createEditorEpic)
);
