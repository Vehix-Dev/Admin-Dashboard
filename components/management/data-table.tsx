"use client"

import type React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Trash2, Edit, Download, ArrowUpDown } from "lucide-react"
import { useState } from "react"

export interface Column<T> {
  header: string
  accessor: keyof T | ((row: T) => React.ReactNode)
  cell?: (value: any, row: T) => React.ReactNode
  sortable?: boolean
}

interface DataTableProps<T extends { id: string | number }> {
  data: T[]
  columns: Column<T>[]
  onView?: (row: T) => void
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  isLoading?: boolean
  onExport?: () => void
  title?: string
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  onView,
  onEdit,
  onDelete,
  isLoading,
  onExport,
  title,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<number | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const handleExport = () => {
    const csv = [
      columns.map((col) => col.header).join(","),
      ...data.map((row) =>
        columns
          .map((col) => {
            const value = typeof col.accessor === "function" ? col.accessor(row) : row[col.accessor]
            return String(value).replace(/"/g, '""')
          })
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `export-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleSort = (columnIndex: number) => {
    if (sortColumn === columnIndex) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(columnIndex)
      setSortDirection("asc")
    }
  }

  const sortedData = [...data].sort((a, b) => {
    if (sortColumn === null) return 0
    const column = columns[sortColumn]
    const aValue = typeof column.accessor === "function" ? column.accessor(a) : a[column.accessor]
    const bValue = typeof column.accessor === "function" ? column.accessor(b) : b[column.accessor]

    if (aValue === null || aValue === undefined) return 1
    if (bValue === null || bValue === undefined) return -1

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
    return 0
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {title && (
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800 tracking-tight">{title}</h2>
            <p className="text-sm text-gray-600 mt-1">
              Showing {sortedData.length} of {sortedData.length} entries
            </p>
          </div>
        )}

        {onExport && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleExport}
              className="border-blue-100 text-blue-600 bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 shadow-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                {columns.map((column, idx) => (
                  <TableHead
                    key={idx}
                    className="font-semibold text-gray-700 px-6 py-4 text-sm tracking-wide"
                  >
                    {column.sortable !== false ? (
                      <Button
                        variant="ghost"
                        onClick={() => handleSort(idx)}
                        className="h-auto p-0 hover:bg-transparent text-gray-700 font-semibold flex items-center gap-1.5 group"
                      >
                        {column.header}
                        <ArrowUpDown className="h-3.5 w-3.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        {sortColumn === idx && (
                          <span className="text-blue-600 font-medium text-xs ml-0.5">
                            {sortDirection === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </Button>
                    ) : (
                      column.header
                    )}
                  </TableHead>
                ))}
                {(onEdit || onDelete) && (
                  <TableHead className="text-gray-700 px-6 py-4 text-sm font-semibold text-right tracking-wide">
                    Actions
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                    className="h-48 text-center py-8"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-1">No data found</h3>
                      <p className="text-gray-500 text-sm max-w-sm">
                        There are currently no records to display. Try adjusting your filters or add new data.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedData.map((row, rowIndex) => (
                  <TableRow
                    key={row.id}
                    className={`
                      border-b border-gray-100 
                      ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                      hover:bg-blue-50/30 transition-all duration-200
                      group
                    `}
                  >
                    {columns.map((column, idx) => {
                      const value = typeof column.accessor === "function" ? column.accessor(row) : row[column.accessor]
                      return (
                        <TableCell
                          key={idx}
                          className="px-6 py-4 text-sm text-gray-700"
                        >
                          <div className="font-medium">
                            {column.cell ? column.cell(value, row) : (value as React.ReactNode)}
                          </div>
                        </TableCell>
                      )
                    })}
                    {(onEdit || onDelete) && (
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(row)}
                              className="h-9 w-9 p-0 text-blue-600 hover:bg-blue-100/50 hover:text-blue-700 rounded-lg"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(row)}
                              className="h-9 w-9 p-0 text-red-600 hover:bg-red-100/50 hover:text-red-700 rounded-lg"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {sortedData.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-white border-t border-gray-100 rounded-b-lg text-sm text-gray-600">
          <div className="mb-2 sm:mb-0">
            Showing <span className="font-semibold text-gray-800">1</span> to{" "}
            <span className="font-semibold text-gray-800">{sortedData.length}</span> of{" "}
            <span className="font-semibold text-gray-800">{sortedData.length}</span> entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 border-gray-200 text-gray-600 hover:bg-gray-50"
              disabled
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100"
            >
              1
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 border-gray-200 text-gray-600 hover:bg-gray-50"
              disabled
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}