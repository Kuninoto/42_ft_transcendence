"use client";

import Image from "next/image";
import Pong from "./pong";
import { useEffect, useState } from "react";

export default function Game() {
  const [leftPlayerScore, setLeftPlayerScore] = useState(0);
  const [rightPlayerScore, setRightPlayerScore] = useState(0);

  const givePoint = (rigthPlayer: boolean): void => {
    if (rigthPlayer) {
      setRightPlayerScore((rightPlayerScore: number) => rightPlayerScore + 1);
    } else {
      setLeftPlayerScore((leftPlayerScore: number) => leftPlayerScore + 1);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex my-8 mx-auto gap-x-8">
        <div className="flex gap-4 my-4">
          <div className="my-auto text-end">
            <h3 className="text-2xl">Macaco</h3>
            <h4 className="text-md">140 w</h4>
            {leftPlayerScore}
          </div>
          <Image
            src={"https://picsum.photos/200"}
            width="0"
            height="0"
            sizes="100vw"
            alt={"player 1 profile picutre"}
            className="w-20 aspect-square rounded-full"
          />
        </div>
        <div className="h-full w-0.5 bg-white"></div>
        <div className="flex gap-4 my-4">
          <Image
            src={"https://picsum.photos/200"}
            width="0"
            height="0"
            sizes="100vw"
            alt={"player 1 profile picutre"}
            className="w-20 aspect-square rounded-full"
          />
          <div className="my-auto">
            <h3 className="text-2xl">Macaco</h3>
            <h4 className="text-md">140 w</h4>
            {rightPlayerScore}
          </div>
        </div>
      </div>

      <div className="mx-auto"> 2:30 </div>

      <Pong givePoint={givePoint} />
    </div>
  );
}
