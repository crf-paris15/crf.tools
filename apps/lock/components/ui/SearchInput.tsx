"use client";

import { handleSearch } from "@/app/utils/ui/actions";
import { IconSearch } from "@tabler/icons-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

function SearchInput() {
  const params = new URLSearchParams(useSearchParams());

  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearchDebounce = useDebouncedCallback((searchTerm) => {
    handleSearch(searchTerm, params, pathname, replace);
  }, 300);

  return (
    <div className="input-group input-group-flat w-auto">
      <span className="input-group-text">
        <IconSearch className="icon icon-1" />
      </span>
      <input
        id="advanced-table-search"
        type="text"
        className="form-control"
        autoComplete="off"
        onChange={(e) => {
          handleSearchDebounce(e.target.value);
        }}
        defaultValue={params.get("search")?.toString()}
      />
    </div>
  );
}
export default SearchInput;
