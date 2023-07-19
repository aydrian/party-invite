import { type V2_MetaFunction } from "@remix-run/node";

export const meta: V2_MetaFunction = () => {
  return [
    { title: "Invite" },
    { content: "An invite app made with React", name: "description" }
  ];
};

export default function Index() {
  return <h1>Invite App</h1>;
}
