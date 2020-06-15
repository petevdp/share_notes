import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FormControl } from 'baseui/form-control';
import { Button } from 'baseui/button';
import { Input } from 'baseui/input';
import { rootState } from '../store';
import { roomCreationConsumed, createRoom } from '../rooms/slice';

export function Home() {
  const history = useHistory();
  const dispatch = useDispatch();
  const [roomName] = useState('');
  const roomCreationStatus = useSelector((state: rootState) => state.rooms.creationStatus);
  useEffect(() => {
    console.log('creatingroomstatus: ', roomCreationStatus);
    if (roomCreationStatus === 'creating') {
    } else if (!!roomCreationStatus) {
      console.log('wut');
      history.push('/rooms/' + roomCreationStatus); // is room id
      dispatch(roomCreationConsumed());
    }
  }, [roomCreationStatus]);

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
