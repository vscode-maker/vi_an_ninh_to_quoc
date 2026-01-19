import React from 'react';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
    columns: any[];
    dataSource: any[];
    rowKey?: string;
    loading?: boolean;
    onRow?: (record: any) => React.HTMLAttributes<HTMLTableRowElement>;
    rowClassName?: (record: any, index: number) => string;
    pagination?: any; // Placeholder for now
}

export function Table({
    columns,
    dataSource,
    rowKey = 'id',
    loading = false,
    className = '',
    onRow,
    ...props
}: TableProps) {
    return (
        <div className={`w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md ${className}`}>
            <div className="overflow-x-auto">
                <table className="min-w-[1200px] w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-100 text-xs uppercase text-slate-800 font-semibold border-b border-slate-200">
                        <tr>
                            {columns.map((col: any, index: number) => (
                                <th
                                    key={col.key || index}
                                    className="px-4 py-3 tracking-wider"
                                    style={{ width: col.width, textAlign: col.align }}
                                >
                                    {col.title}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500">
                                    Loading...
                                </td>
                            </tr>
                        ) : dataSource.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500">
                                    No data
                                </td>
                            </tr>
                        ) : (
                            dataSource.map((record: any, rowIndex: number) => {
                                const rowClass = props.rowClassName ? props.rowClassName(record, rowIndex) : '';
                                return (
                                    <tr
                                        key={record[rowKey] || rowIndex}
                                        className={`hover:bg-slate-50 transition-colors ${rowClass}`}
                                        {...(onRow ? onRow(record) : {})}
                                    >
                                        {columns.map((col: any, colIndex: number) => {
                                            const cellProps = col.onCell ? col.onCell(record, rowIndex) : {};
                                            if (cellProps.colSpan === 0) return null;

                                            return (
                                                <td
                                                    key={col.key || colIndex}
                                                    className={`px-4 py-3 whitespace-nowrap ${cellProps.className || ''}`}
                                                    style={{ textAlign: col.align, ...cellProps.style }}
                                                    colSpan={cellProps.colSpan}
                                                    rowSpan={cellProps.rowSpan}
                                                >
                                                    {col.render
                                                        ? col.render(record[col.dataIndex], record, rowIndex)
                                                        : record[col.dataIndex]}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
            {/* Simple Pagination Placeholder */}
            {dataSource.length > 0 && (
                <div className="border-t border-slate-200 px-4 py-3 flex justify-end bg-slate-50">
                    <span className="text-xs text-slate-500">Showing {dataSource.length} items</span>
                </div>
            )}
        </div>
    );
}
