export type CellProps = {
  id: string;
  type: "board" | "slot" | "well";
  team?: CellTeam;
};

export type CellTeam = "white" | "black" | undefined;
