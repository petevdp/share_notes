import {
  useLocation,
  useHistory,
  Switch,
  Route,
  useParams,
} from "react-router-dom";

import { atom, useRecoilState, useResetRecoilState, selector } from "recoil";
import Button from "carbon-components-react/lib/components/Button";

import React, { useEffect, useState, useReducer } from "react";
import { Editor } from "./Editor";
import Convergence, {
  ConvergenceDomain,
  RealTimeArray,
  RealTimeString,
  RealTimeModel,
  RealTimeArrayEvents,
  ArrayInsertEvent,
  ArraySetEvent,
  RealTimeObject,
  ObjectSetValueEvent,
  ObjectSetEvent,
  ObjectRemoveEvent,
} from "@convergence/convergence";
import {
  CONVERGENCE_SERVICE_URL,
  ROOM_COLLECTION,
  EDITOR_COLLECTION,
} from "Shared/environment";
import { editor } from "monaco-editor";
import { Domain } from "domain";
import { ObservableElement } from "@convergence/convergence/typings/model/observable/ObservableElement";
import { roomModelState, roomEditorStatusesState, domainState } from "../atoms";

const user = {
  username: "user1",
  password: "password",
};

interface action {
  type: string;
}

type editorStore = Map<string, RealTimeModel>;

export function Room() {
  const history = useHistory();
  const location = useLocation();
  const { roomId } = useParams();

  const [roomModel, setRoomModel] = useRecoilState(roomModelState);
  const [domain, setDomain] = useRecoilState(domainState);

  // initialize the room
  useEffect(() => {
    Convergence.connect(
      CONVERGENCE_SERVICE_URL,
      user.username,
      user.password
    ).then(async (domain) => {
      console.log("domain: ", domain);
      console.log("path: ", location.pathname);
    });
  }, []);

  const [editorStatuses, setEditorStatuses] = useRecoilState(
    roomEditorStatusesState
  );

  // roomId should be set, and we're ready to connect
  useEffect(() => {
    (async () => {
      if (location.pathname === "/room") {
        throw "implement me";
      }

      if (location.pathname === "/room/create") {
        const roomId = await domain.models().create({
          collection: ROOM_COLLECTION,
          data: {
            editorIds: [],
          },
        });
        // .then((roomModelId) => domain.models().open(roomModelId));
        console.log("room: ", roomId);
        history.push(`/rooms/${roomId}`);
        return;
      }

      const roomModel = await domain.models().open(roomId);

      const editorIds = roomModel.elementAt("editors") as RealTimeArray;

      const subscription = editorIds.events().subscribe((e) => {
        const { SET, REMOVE } = RealTimeObject.Events;
        switch (e.name) {
          case SET: {
            const event = e as ObjectSetEvent;
            setEditorStatuses({ ...editorStatuses, [event.key]: "active" });
            break;
          }
          case REMOVE: {
            const event = e as ObjectRemoveEvent;
            const { [event.key]: toRemove, ...rest } = editorStatuses;
            setEditorStatuses(rest);
            break;
          }
        }
      });

      const editorStatusObj = editorIds
        .value()
        .reduce((obj, id) => ({ ...obj, [id]: "active" }));
      setRoomModel(roomModel);
      setEditorStatuses(editorStatusObj);

      return () => subscription.unsubscribe();
    })();
  }, [domain, roomId]);

  const handleAddEditorAction = () => {
    console.log("clicked add editor");
    // hit the create endpoint
  };

  return (
    <Switch>
      <Route exact path="/room/create">
        <div>Creating Room</div>
      </Route>
      <Route path="/room/:roomId">
        <Button onClick={handleAddEditorAction}>Add Editor</Button>
        {Object.keys(editorStatuses).map(
          (editorId) =>
            // <Editor key={editorId} editorId={editorId} />
            editorId
        )}
      </Route>
    </Switch>
  );
}

// function reduce(): state {
// }
