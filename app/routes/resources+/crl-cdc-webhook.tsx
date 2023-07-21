import { type DataFunctionArgs, Response, json } from "@remix-run/node";
import { eventStream } from "remix-utils";

import { emitter } from "~/utils/emitter.server.ts";

interface ChangeFeedMessage<T> {
  length: number;
  payload: T[];
}

type Payload = {
  guests: number;
  id: string;
  message: string;
  name: string;
};

export const loader = async ({ request }: DataFunctionArgs) => {
  return eventStream(request.signal, function setup(send) {
    function handle(payload: Payload) {}

    emitter.on("new-message", handle);

    return function clear() {
      emitter.off("new-message", handle);
    };
  });
};

export const action = async ({ request }: DataFunctionArgs) => {
  if (request.method !== "POST") {
    return json(
      { message: "Method not allowed" },
      { headers: { Allow: "POST" }, status: 405 }
    );
  }

  const body = (await request.json()) as ChangeFeedMessage<Payload>;

  body.payload.forEach((payload) => {
    emitter.emit("new-message", payload);
  });

  return new Response("OK", { status: 200 });
};
