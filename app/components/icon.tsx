import { type SVGProps } from "react";

import spriteHref from "~/components/icons/sprite.svg";
export function Icon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & {
  name: string;
}) {
  return (
    <svg {...props}>
      <use href={`${spriteHref}#${name}`} />
    </svg>
  );
}
