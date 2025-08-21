export type CellProps = {
  id: string;
  type: "space" | "slot" | "well" | "corner" | "error";
  team?: CellTeam;
  layout?: Layout;
};

export type CellTeam = "white" | "black" | undefined;

type Layout = {
  pageX: number;
  pageY: number;
  width: number;
  height: number;
};
