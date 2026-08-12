import Link from "next/link";
import { ChevronRightIcon } from "@/components/ui/Icon";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`}>
              {item.href && !isLast ? <Link href={item.href}>{item.label}</Link> : <span>{item.label}</span>}
              {!isLast ? <ChevronRightIcon className="breadcrumb-icon" /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
