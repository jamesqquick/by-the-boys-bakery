import "react";

declare module "react" {
  interface HTMLAttributes<T> {
    toolautosubmit?: boolean;
    toolname?: string;
    toolparamdescription?: string;
    tooldescription?: string;
  }
}
