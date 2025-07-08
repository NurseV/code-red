import React from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '../icons/Icons';

interface TableColumn<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
  className?: string;
  sortKey?: keyof T;
}

interface SortConfig<T> {
    key: keyof T;
    direction: 'ascending' | 'descending';
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  sortConfig?: SortConfig<T> | null;
  requestSort?: (key: keyof T) => void;
  onRowClick?: (item: T) => void;
  expandedRowId?: string | number | null;
  renderExpandedRow?: (item: T) => React.ReactNode;
}

const Table = <T extends { id: string | number },>(
  { columns, data, sortConfig, requestSort, onRowClick, expandedRowId, renderExpandedRow }: TableProps<T>
) => {
  const getSortIcon = (key: keyof T) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <span className="w-4 h-4 inline-block"></span>;
    }
    if (sortConfig.direction === 'ascending') {
      return <ChevronUpIcon className="h-4 w-4 inline-block ml-1" />;
    }
    return <ChevronDownIcon className="h-4 w-4 inline-block ml-1" />;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-dark-card text-dark-text">
        <thead className="bg-gray-700/50">
          <tr>
            {columns.map((col, index) => {
              const isSortable = !!(col.sortKey && requestSort);
              return (
                <th
                  key={index}
                  scope="col"
                  className={`px-6 py-3 text-left text-xs font-medium text-dark-text-secondary uppercase tracking-wider ${col.className || ''} ${isSortable ? 'cursor-pointer hover:bg-gray-600/50' : ''}`}
                  onClick={isSortable ? () => requestSort(col.sortKey!) : undefined}
                >
                  <div className="flex items-center">
                    {col.header}
                    {isSortable && getSortIcon(col.sortKey!)}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-dark-border">
          {data.length > 0 ? (
            data.map((item) => (
              <React.Fragment key={item.id}>
                <tr 
                    className={`transition-colors duration-150 ${onRowClick ? 'cursor-pointer hover:bg-dark-border/50' : ''} ${expandedRowId === item.id ? 'bg-dark-border/40' : ''}`}
                    onClick={onRowClick ? () => onRowClick(item) : undefined}
                >
                  {columns.map((col, index) => (
                    <td key={index} className={`px-6 py-4 whitespace-nowrap text-sm ${col.className || ''}`}>
                      {col.accessor(item)}
                    </td>
                  ))}
                </tr>
                {renderExpandedRow && expandedRowId === item.id && (
                  <tr className="bg-dark-bg">
                      <td colSpan={columns.length} className="p-0">
                          {renderExpandedRow(item)}
                      </td>
                  </tr>
                )}
              </React.Fragment>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-6 py-8 text-center text-dark-text-secondary">
                No data available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
