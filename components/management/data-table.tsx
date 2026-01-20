"use client"

import type React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Trash2, Edit, Download, ArrowUpDown, RotateCcw } from "lucide-react"
import { useState } from "react"
import { ConfirmModal } from "@/components/ui/confirm-modal"

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
  onRestore?: (row: T) => void
  isLoading?: boolean
  onExport?: () => void
  title?: string
  pageSize?: number
  initialSortColumn?: number | null
  initialSortDirection?: "asc" | "desc"
  confirmAction?: boolean
  deleteConfirmTitle?: string | ((row: T) => string)
  deleteConfirmDescription?: string | ((row: T) => string)
  restoreConfirmTitle?: string | ((row: T) => string)
  restoreConfirmDescription?: string | ((row: T) => string)
  renderConfirmDetails?: (row: T) => React.ReactNode
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  onView,
  onEdit,
  onDelete,
  onRestore,
  isLoading,
  onExport,
  title,
  pageSize = 10,
  initialSortColumn = null,
  initialSortDirection = "desc",
  confirmAction = true,
  deleteConfirmTitle,
  deleteConfirmDescription,
  restoreConfirmTitle,
  restoreConfirmDescription,
  renderConfirmDetails,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<number | null>(initialSortColumn)
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">(initialSortDirection)
  const [currentPage, setCurrentPage] = useState(1)

  // Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [confirmMode, setConfirmMode] = useState<"delete" | "restore">("delete")
  const [pendingRow, setPendingRow] = useState<T | null>(null)

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
      setSortDirection(sortDirection === "desc" ? "asc" : "desc")
    } else {
      setSortColumn(columnIndex)
      setSortDirection("desc")
    }
  }

  const sortedData = [...data].sort((a, b) => {
    if (sortColumn === null) return 0
    const column = columns[sortColumn]
    const aValue = typeof column.accessor === "function" ? column.accessor(a) : a[column.accessor]
    const bValue = typeof column.accessor === "function" ? column.accessor(b) : b[column.accessor]

    if (aValue === null || aValue === undefined) return 1
    if (bValue === null || bValue === undefined) return -1

    if (aValue < bValue) return sortDirection === "desc" ? 1 : -1
    if (aValue > bValue) return sortDirection === "desc" ? -1 : 1
    return 0
  })

  const totalPages = Math.ceil(sortedData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, sortedData.length)
  const currentData = sortedData.slice(startIndex, endIndex)

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  const triggerAction = (row: T, mode: "delete" | "restore") => {
    if (confirmAction) {
      setPendingRow(row)
      setConfirmMode(mode)
      setIsConfirmOpen(true)
    } else {
      if (mode === "delete" && onDelete) onDelete(row)
      if (mode === "restore" && onRestore) onRestore(row)
    }
  }

  const handleConfirm = () => {
    if (!pendingRow) return
    if (confirmMode === "delete" && onDelete) onDelete(pendingRow)
    if (confirmMode === "restore" && onRestore) onRestore(pendingRow)
    setIsConfirmOpen(false)
    setPendingRow(null)
  }

  const getModalContent = () => {
    if (!pendingRow) return { title: "", description: "" }

    if (confirmMode === "delete") {
      return {
        title: typeof deleteConfirmTitle === "function" ? deleteConfirmTitle(pendingRow) : deleteConfirmTitle || "Confirm Deletion",
        description: typeof deleteConfirmDescription === "function" ? deleteConfirmDescription(pendingRow) : deleteConfirmDescription || "Are you sure you want to delete this record? This action cannot be undone.",
      }
    }

    return {
      title: typeof restoreConfirmTitle === "function" ? restoreConfirmTitle(pendingRow) : restoreConfirmTitle || "Confirm Restoration",
      description: typeof restoreConfirmDescription === "function" ? restoreConfirmDescription(pendingRow) : restoreConfirmDescription || "Are you sure you want to restore this record?",
    }
  }

  const modalContent = getModalContent()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {title && (
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Showing {startIndex + 1} to {endIndex} of {sortedData.length} entries
            </p>
          </div>
        )}

        {onExport && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleExport}
              className="border-primary/20 text-primary bg-card hover:bg-primary/10 hover:text-primary hover:border-primary/30 shadow-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        )}
      </div>

      <div className="bg-card rounded-xl shadow-md overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 border-b border-border">
                {columns.map((column, idx) => (
                  <TableHead
                    key={idx}
                    className="font-semibold text-foreground px-6 py-4 text-sm tracking-wide"
                  >
                    {column.sortable !== false ? (
                      <Button
                        variant="ghost"
                        onClick={() => handleSort(idx)}
                        className="h-auto p-0 hover:bg-transparent text-foreground font-semibold flex items-center gap-1.5 group"
                      >
                        {column.header}
                        <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                        {sortColumn === idx && (
                          <span className="text-primary font-medium text-xs ml-0.5">
                            {sortDirection === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </Button>
                    ) : (
                      column.header
                    )}
                  </TableHead>
                ))}
                {(onEdit || onDelete || onRestore) && (
                  <TableHead className="text-foreground px-6 py-4 text-sm font-semibold text-right tracking-wide">
                    Actions
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (onEdit || onDelete || onRestore ? 1 : 0)}
                    className="h-48 text-center py-8"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <svg
                          className="w-8 h-8 text-muted-foreground"
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
                      <h3 className="text-lg font-semibold text-foreground mb-1">No data found</h3>
                      <p className="text-muted-foreground text-sm max-w-sm">
                        There are currently no records to display. Try adjusting your filters or add new data.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                currentData.map((row, rowIndex) => (
                  <TableRow
                    key={row.id}
                    className={`
                      border-b border-border 
                      ${rowIndex % 2 === 0 ? 'bg-card' : 'bg-muted/20'}
                      hover:bg-primary/5 transition-all duration-200
                      group
                    `}
                  >
                    {columns.map((column, idx) => {
                      const value = typeof column.accessor === "function" ? column.accessor(row) : row[column.accessor]
                      return (
                        <TableCell
                          key={idx}
                          className="px-6 py-4 text-sm text-foreground"
                        >
                          <div className="font-medium">
                            {column.cell ? column.cell(value, row) : (value as React.ReactNode)}
                          </div>
                        </TableCell>
                      )
                    })}
                    {(onEdit || onDelete || onRestore) && (
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {onRestore && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => triggerAction(row, "restore")}
                              className="h-9 w-9 p-0 text-emerald-600 hover:bg-emerald-600/10 hover:text-emerald-600 rounded-lg"
                              title="Restore"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(row)}
                              className="h-9 w-9 p-0 text-primary hover:bg-primary/10 hover:text-primary rounded-lg"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => triggerAction(row, "delete")}
                              className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg"
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

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirm}
        mode={confirmMode}
        title={modalContent.title}
        description={modalContent.description}
      >
        {pendingRow && renderConfirmDetails?.(pendingRow)}
      </ConfirmModal>

      {sortedData.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-card border-t border-border rounded-b-lg text-sm text-muted-foreground">
          <div className="mb-2 sm:mb-0">
            Showing <span className="font-semibold text-foreground">{startIndex + 1}</span> to{" "}
            <span className="font-semibold text-foreground">{endIndex}</span> of{" "}
            <span className="font-semibold text-foreground">{sortedData.length}</span> entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 border-border text-muted-foreground hover:bg-muted"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = i + 1
                return (
                  <Button
                    key={pageNum}
                    variant="outline"
                    size="sm"
                    className={`h-8 w-8 p-0 ${currentPage === pageNum
                      ? "border-primary/20 bg-primary/10 text-primary hover:bg-primary/20"
                      : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
              {totalPages > 5 && <span className="px-1">...</span>}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 border-border text-muted-foreground hover:bg-muted"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}