import React, { useEffect } from "react";
import Button from "carbon-components-react/lib/components/Button";
import { Link, useHistory } from "react-router-dom";

export function Home() {
  const history = useHistory();
  // useEffect(() => {
  //   history.push("/room/2f95d64b-1364-4047-9821-569f31cec4f8");
  // });

  return (
    <Link to="/rooms/create">
      <Button>New Room</Button>
    </Link>
  );
}
