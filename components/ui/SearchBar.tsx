import Link from "next/link";
import { CloseIcon, SearchIcon } from "@/components/ui/Icon";

type SearchBarProps = {
  id: string;
  defaultValue?: string;
  placeholder?: string;
  variant?: "header" | "hero" | "page";
  showClear?: boolean;
};

export function SearchBar({
  id,
  defaultValue,
  placeholder = "Search players, teams, matches, tournaments, articles...",
  variant = "header",
  showClear = false
}: SearchBarProps) {
  const hasValue = Boolean(defaultValue?.trim());

  return (
    <form className={`search-bar search-bar--${variant}`} action="/search" role="search">
      <label className="sr-only" htmlFor={id}>
        Search Cricket Atlas
      </label>
      <SearchIcon className="search-bar__icon" />
      <input id={id} name="q" type="search" defaultValue={defaultValue} placeholder={placeholder} />
      {showClear && hasValue ? (
        <Link className="search-bar__clear" href="/search" aria-label="Clear search">
          <CloseIcon />
        </Link>
      ) : null}
      <button type="submit">Search</button>
    </form>
  );
}
