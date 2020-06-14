import { useParams } from "react-router-dom";

import { useDispatch } from "react-redux";
import { createEditor } from "../store";
import React, { useEffect } from "react";
import { connect } from "http2";

export const Room: React.FC = () => {
  const { roomId } = useParams();
  useEffect(() => {
    if (!roomId) {
      throw "idk";
    }
  }, [roomId]);

  return <span>"roomId: " + roomId;</span>;
};
