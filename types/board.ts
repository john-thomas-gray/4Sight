export type CellProps = {
  id: string;
  type: "board" | "slot" | "well";
  team?: Team;
};

export type Team = "white" | "black" | undefined;
