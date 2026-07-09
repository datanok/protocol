"use client";

import { useState } from "react";
import { Plus, X, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import type { TableBlockData } from "@/types/schema";
import { T } from "@/lib/tokens";
import { BlockShell } from "./blockUi";

type SortState = { col: number; dir: "asc" | "desc" } | null;

function compareCells(a: string, b: string): number {
  const na = parseFloat(a);
  const nb = parseFloat(b);
  const bothNumeric =
    !Number.isNaN(na) &&
    !Number.isNaN(nb) &&
    a.trim() !== "" &&
    b.trim() !== "";
  if (bothNumeric) return na - nb;
  // Empty cells sink to the bottom regardless of direction
  if (a.trim() === "" && b.trim() !== "") return 1;
  if (b.trim() === "" && a.trim() !== "") return -1;
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

export default function TableBlockView({
  block,
  onChange,
  onDelete,
}: {
  block: TableBlockData;
  onChange: (next: TableBlockData) => void;
  onDelete: () => void;
}) {
  const [sort, setSort] = useState<SortState>(null);
  const cellId = (r: number, c: number) => `pgc-${block.id}-${r}-${c}`;

  function setCell(rowIdx: number, colIdx: number, value: string) {
    const rows = block.rows.map((row, r) =>
      r === rowIdx ? row.map((cell, c) => (c === colIdx ? value : cell)) : row,
    );
    onChange({ ...block, rows });
  }

  function setColumnName(colIdx: number, value: string) {
    const columns = block.columns.map((col, c) => (c === colIdx ? value : col));
    onChange({ ...block, columns });
  }

  function addColumn() {
    const columns = [...block.columns, `Column ${block.columns.length + 1}`];
    const rows = block.rows.map((row) => [...row, ""]);
    onChange({ ...block, columns, rows });
  }

  function deleteColumn(colIdx: number) {
    if (block.columns.length <= 1) return;
    const columns = block.columns.filter((_, c) => c !== colIdx);
    const rows = block.rows.map((row) => row.filter((_, c) => c !== colIdx));
    onChange({ ...block, columns, rows });
    setSort(null);
  }

  function addRow(focusCol?: number) {
    const rows = [...block.rows, block.columns.map(() => "")];
    onChange({ ...block, rows });
    if (focusCol !== undefined) {
      requestAnimationFrame(() => {
        document.getElementById(cellId(rows.length - 1, focusCol))?.focus();
      });
    }
  }

  function deleteRow(rowIdx: number) {
    onChange({ ...block, rows: block.rows.filter((_, r) => r !== rowIdx) });
  }

  function sortBy(colIdx: number) {
    const dir: "asc" | "desc" =
      sort?.col === colIdx && sort.dir === "asc" ? "desc" : "asc";
    const rows = [...block.rows].sort((a, b) => {
      const cmp = compareCells(a[colIdx] ?? "", b[colIdx] ?? "");
      return dir === "asc" ? cmp : -cmp;
    });
    onChange({ ...block, rows });
    setSort({ col: colIdx, dir });
  }

  function handleCellKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    r: number,
    c: number,
  ) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (r === block.rows.length - 1) {
      addRow(c);
    } else {
      document.getElementById(cellId(r + 1, c))?.focus();
    }
  }

  const colCount = block.columns.length;

  return (
    <BlockShell
      label="Table"
      meta={
        block.rows.length > 0
          ? `${block.rows.length} row${block.rows.length !== 1 ? "s" : ""}`
          : undefined
      }
      onDelete={onDelete}
    >
      <div style={{ overflowX: "auto" }}>
        <table className="pg-table">
          <thead>
            <tr>
              <th className="pg-gutter" aria-label="Row number" />
              {block.columns.map((col, c) => {
                const sorted = sort?.col === c;
                return (
                  <th key={c} className="pg-hoverable">
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <input
                        value={col}
                        onChange={(e) => setColumnName(c, e.target.value)}
                        aria-label={`Column ${c + 1} name`}
                        placeholder={`Column ${c + 1}`}
                        className="pg-colname"
                      />
                      <span
                        className={sorted ? undefined : "pg-reveal"}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          paddingRight: 4,
                          flexShrink: 0,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => sortBy(c)}
                          aria-label={`Sort by ${col || `column ${c + 1}`} ${
                            sorted && sort.dir === "asc"
                              ? "descending"
                              : "ascending"
                          }`}
                          className="pg-iconbtn"
                          style={sorted ? { color: T.accent } : undefined}
                        >
                          {sorted ? (
                            sort.dir === "asc" ? (
                              <ArrowUp style={{ width: 11, height: 11 }} />
                            ) : (
                              <ArrowDown style={{ width: 11, height: 11 }} />
                            )
                          ) : (
                            <ArrowUpDown style={{ width: 11, height: 11 }} />
                          )}
                        </button>
                        {colCount > 1 && (
                          <button
                            type="button"
                            onClick={() => deleteColumn(c)}
                            aria-label={`Delete column ${col || c + 1}`}
                            className="pg-iconbtn pg-iconbtn-danger pg-reveal"
                          >
                            <X style={{ width: 11, height: 11 }} />
                          </button>
                        )}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, r) => (
              <tr key={r} className="pg-hoverable">
                <td className="pg-gutter">
                  <span
                    className="pg-rownum"
                    style={{
                      fontFamily: T.mono,
                      fontSize: 10,
                      color: T.stone,
                      alignItems: "center",
                      justifyContent: "center",
                      width: 24,
                      height: 24,
                    }}
                  >
                    {r + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteRow(r)}
                    aria-label={`Delete row ${r + 1}`}
                    className="pg-iconbtn pg-iconbtn-danger pg-rowdel"
                  >
                    <X style={{ width: 11, height: 11 }} />
                  </button>
                </td>
                {row.map((cell, c) => (
                  <td key={c}>
                    <input
                      id={cellId(r, c)}
                      value={cell}
                      onChange={(e) => setCell(r, c, e.target.value)}
                      onKeyDown={(e) => handleCellKeyDown(e, r, c)}
                      aria-label={`${block.columns[c] || `Column ${c + 1}`}, row ${r + 1}`}
                      className="pg-cell"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {block.rows.length === 0 && (
        <div
          style={{
            fontFamily: T.serifD,
            fontSize: 14,
            fontStyle: "italic",
            color: T.stone,
            padding: "12px 0 2px",
          }}
        >
          No rows yet — add one below.
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button type="button" onClick={() => addRow(0)} className="pg-ghostbtn">
          <Plus style={{ width: 11, height: 11 }} /> Row
        </button>
        <button type="button" onClick={addColumn} className="pg-ghostbtn">
          <Plus style={{ width: 11, height: 11 }} /> Column
        </button>
      </div>
    </BlockShell>
  );
}
