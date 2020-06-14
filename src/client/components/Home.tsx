import React, { useEffect, useState } from "react";
import Button from "carbon-components-react/lib/components/Button";
import TextInput from "carbon-components-react/lib/components/TextInput";
import FormGroup from "carbon-components-react/lib/components/FormGroup";
import Form from "carbon-components-react/lib/components/Form";
import { Link, useHistory } from "react-router-dom";
import { connect, useStore, useDispatch, useSelector } from "react-redux";
import { createRoom, state, resetRoomCreationStatus } from "../store";

type props = {
  creatingRoomStatus: "creating" | string;
  createRoom: () => void;
  resetRoomCreationStatus: () => void;
};

export function Home() {
  const history = useHistory();
  const dispatch = useDispatch();
  const [roomName, setRoomName] = useState("");
  const { creatingRoomStatus } = useSelector((state: state) => state);
  useEffect(() => {
    console.log("creatingroomstatus: ", creatingRoomStatus);
    if (creatingRoomStatus === "creating") {
    } else if (!!creatingRoomStatus) {
      console.log("wut");
      history.push("/rooms/" + creatingRoomStatus); // is room id
      dispatch(resetRoomCreationStatus());
    }
  }, [creatingRoomStatus]);

  return (
    <Form
      onSubmit={(e) => {
        e.preventDefault();
        console.log("creating");
        dispatch(createRoom({ name: roomName }));
      }}
    >
      <FormGroup legendText="the name of the room">
        <TextInput
          id="roomName"
          labelText="name"
          onChange={(e) => setRoomName(e.target.value)}
        />
        <Button type="submit">Create</Button>
      </FormGroup>
    </Form>
  );
}
