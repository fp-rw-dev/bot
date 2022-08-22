declare module "color-parse" {
  export default function parseColor(color: string): {
    space: string;
    values: [number, number, number];
    alpha: number;
  } | null;
}
