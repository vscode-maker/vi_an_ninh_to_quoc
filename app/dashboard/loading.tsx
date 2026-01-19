'use client';

export default function Loading() {
    return (
        <div className="animate-pulse">
            {/* Header / Title area */}
            <div className="mb-6">
                <div className="h-10 bg-gray-200 rounded w-[300px]"></div>
            </div>

            {/* Main Content Area (mimicking table/card) */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
                {/* Toolbar area */}
                <div className="flex justify-between mb-6">
                    <div className="flex gap-2">
                        <div className="h-9 bg-gray-200 rounded w-[120px]"></div>
                        <div className="h-9 bg-gray-200 rounded w-[40px]"></div>
                    </div>
                    <div className="h-9 bg-gray-200 rounded w-[200px]"></div>
                </div>

                {/* Table rows simulation */}
                <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
            </div>
        </div>
    );
}
