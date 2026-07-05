"use client";

import { Trash2, Plus } from "lucide-react";
import type { TableBlockData } from "@/types/schema";
import { T } from "@/lib/tokens";

export default function TableBlockView({
  block,
  onChange,
  onDelete,
}: {
  block: TableBlockData;
  onChange: (next: TableBlockData) => void;
  onDelete: () => void;
}) {
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

  function addRow() {
    const rows = [...block.rows, block.columns.map(() => "")];
    onChange({ ...block, rows });
  }

  return (
    <div
      style={{ border: `1px solid ${T.rule}`, padding: 16, marginBottom: 12 }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontFamily: T.mono,
            fontSize: 9,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: T.stone,
          }}
        >
          Table
        </span>
        <button
          onClick={onDelete}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: T.stone,
          }}
        >
          <Trash2 style={{ width: 12, height: 12 }} />
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              {block.columns.map((col, c) => (
                <th
                  key={c}
                  style={{ border: `1px solid ${T.rule}`, padding: 0 }}
                >
                  <input
                    value={col}
                    onChange={(e) => setColumnName(c, e.target.value)}
                    style={{
                      width: "100%",
                      background: T.tint,
                      border: "none",
                      outline: "none",
                      padding: "6px 8px",
                      fontFamily: T.mono,
                      fontSize: 10,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: T.ink,
                      boxSizing: "border-box",
                    }}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td
                    key={c}
                    style={{ border: `1px solid ${T.rule}`, padding: 0 }}
                  >
                    <input
                      value={cell}
                      onChange={(e) => setCell(r, c, e.target.value)}
                      style={{
                        width: "100%",
                        background: "none",
                        border: "none",
                        outline: "none",
                        padding: "6px 8px",
                        fontFamily: T.sans,
                        fontSize: 12,
                        color: T.ink,
                        boxSizing: "border-box",
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button
          onClick={addColumn}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: `1px solid ${T.rule}`,
            cursor: "pointer",
            color: T.stone,
            padding: "4px 10px",
            fontFamily: T.mono,
            fontSize: 10,
          }}
        >
          <Plus style={{ width: 10, height: 10 }} /> Column
        </button>
        <button
          onClick={addRow}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: `1px solid ${T.rule}`,
            cursor: "pointer",
            color: T.stone,
            padding: "4px 10px",
            fontFamily: T.mono,
            fontSize: 10,
          }}
        >
          <Plus style={{ width: 10, height: 10 }} /> Row
        </button>
      </div>
    </div>
  );
}
