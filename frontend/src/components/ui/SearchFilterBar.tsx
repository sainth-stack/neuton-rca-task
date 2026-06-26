import type { ReactNode } from "react";
import SearchIcon from "@mui/icons-material/Search";
import { Box, InputAdornment, MenuItem, TextField } from "@mui/material";

type FilterOption = {
  value: string;
  label: string;
};

type SearchFilterBarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: Array<{
    id: string;
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
    minWidth?: number;
  }>;
  rightSlot?: ReactNode;
};

export default function SearchFilterBar({
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  rightSlot,
}: SearchFilterBarProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-end",
        gap: 1.5,
      }}
    >
      <TextField
        size="small"
        placeholder={searchPlaceholder}
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        sx={{ flex: 1, minWidth: 240 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 20, color: "text.secondary" }} />
              </InputAdornment>
            ),
          },
        }}
      />

      {filters.map((filter) => (
        <TextField
          key={filter.id}
          select
          size="small"
          label={filter.label}
          value={filter.value}
          onChange={(event) => filter.onChange(event.target.value)}
          sx={{ minWidth: filter.minWidth ?? 160 }}
        >
          {filter.options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      ))}

      {rightSlot ? <Box sx={{ ml: { md: "auto" }, width: { xs: "100%", md: "auto" } }}>{rightSlot}</Box> : null}
    </Box>
  );
}
