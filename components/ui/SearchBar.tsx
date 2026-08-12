import { SearchIcon } from "@/components/ui/Icon";

type SearchBarProps = {
  id: string;
  defaultValue?: string;
  placeholder?: string;
  variant?: "header" | "hero" | "page";
};

export function SearchBar({
  id,
  defaultValue,
  placeholder = "Search players, teams, matches, tournaments, articles...",
  variant = "header"
}: SearchBarProps) {
  return (
    <form className={`search-bar search-bar--${variant}`} action="/search" role="search">
      <label className="sr-only" htmlFor={id}>
        Search Cricket Atlas
      </label>
      <SearchIcon className="search-bar__icon" />
      <input id={id} name="q" type="search" defaultValue={defaultValue} placeholder={placeholder} />
      <button type="submit">Search</button>
    </form>
  );
}
