import React, { useEffect, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { connect, useStore, useDispatch, useSelector } from 'react-redux';
import { FormControl } from 'baseui/form-control';
import { Button } from 'baseui/button';
import { Input } from 'baseui/input';
import { createRoom, state, resetRoomCreationStatus } from '../store';

type props = {
  creatingRoomStatus: 'creating' | string;
  createRoom: () => void;
  resetRoomCreationStatus: () => void;
};

export function Home() {
  const history = useHistory();
  const dispatch = useDispatch();
  const [roomName, setRoomName] = useState('');
  const { creatingRoomStatus } = useSelector((state: state) => state);
  useEffect(() => {
    console.log('creatingroomstatus: ', creatingRoomStatus);
    if (creatingRoomStatus === 'creating') {
    } else if (!!creatingRoomStatus) {
      console.log('wut');
      history.push('/rooms/' + creatingRoomStatus); // is room id
      dispatch(resetRoomCreationStatus());
    }
  }, [creatingRoomStatus]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        console.log('creating');
        dispatch(createRoom({ name: roomName }));
      }}
    >
      <FormControl label={() => 'Room Name'}>
        <Input />
      </FormControl>
      <Button type="submit">Create</Button>
    </form>
  );
}
